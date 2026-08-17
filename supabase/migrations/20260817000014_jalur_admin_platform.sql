-- ============================================================
-- 0014  Jalur admin platform untuk fungsi super admin
-- ============================================================
--
-- Enam fungsi yang ditambahkan di migrasi 0012 dan 0013 menahan siapa pun yang
-- bukan super admin, dan penahannya membaca email dari JWT. Akibatnya SQL
-- Editor, skrip pemeliharaan, dan migrasi berikutnya ikut tertahan: ketiganya
-- terhubung langsung ke database dan tidak punya JWT sama sekali. Yang paling
-- terasa: idempotensi `lunasi_tagihan()` tidak bisa DIBUKTIKAN dari mana pun,
-- padahal itu justru sifat yang paling perlu dibuktikan sebelum ada uang
-- sungguhan lewat.
--
-- Ini persoalan yang sama dengan yang diselesaikan migrasi 0005 untuk
-- `guard_company_commercial()`, dan jawabannya juga sama. Menerima koneksi
-- tanpa JWT tidak melemahkan apa pun: siapa pun yang bisa membuka koneksi
-- langsung ke database sudah bisa meng-UPDATE tabelnya sendiri tanpa lewat
-- fungsi ini. Yang ditahan penahan itu adalah pengguna aplikasi, dan mereka
-- SELALU membawa JWT.
--
-- Penahannya diangkat jadi satu fungsi supaya keenamnya tidak bisa lagi
-- berbeda pendapat tentang siapa yang boleh.

create or replace function public.boleh_admin_platform()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select public.is_super_admin()
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      -- Tanpa JWT sama sekali: koneksi langsung (migrasi, skrip, SQL Editor).
      or auth.jwt() is null;
$$;

revoke all on function public.boleh_admin_platform() from public, anon;
grant execute on function public.boleh_admin_platform() to authenticated;

comment on function public.boleh_admin_platform is
  'Siapa yang boleh menjalankan tindakan tingkat platform: super admin, service_role, atau koneksi langsung tanpa JWT. Bukan untuk dipakai di policy RLS; ini penahan di dalam fungsi.';

-- ------------------------------------------------------------
-- Keenam fungsinya dipasangi penahan yang sama
-- ------------------------------------------------------------

create or replace function public.set_company_status(p_company uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_lama text;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh mengubah status apotek.' using errcode = 'SH001';
  end if;
  if p_status not in ('active', 'trial', 'suspended', 'inactive') then
    raise exception 'Status tidak dikenali.' using errcode = 'SH004';
  end if;

  select status into v_lama from public.companies where id = p_company for update;
  if not found then
    raise exception 'Apotek tidak ditemukan.' using errcode = 'SH004';
  end if;

  update public.companies set status = p_status where id = p_company;

  insert into public.subscription_events (company_id, plan_id, action, actor_email)
  select p_company, plan_id,
         case when p_status = 'suspended' then 'cancel' else 'reactivate' end,
         coalesce(lower(auth.jwt() ->> 'email'), 'sistem')
    from public.companies where id = p_company;

  perform public.catat_audit(p_company, 'apotek.status', 'companies', p_company::text,
    jsonb_build_object('dari', v_lama, 'ke', p_status));

  return (select to_jsonb(c) from public.companies c where c.id = p_company);
end;
$$;

revoke all on function public.set_company_status(uuid, text) from public, anon;
grant execute on function public.set_company_status(uuid, text) to authenticated;

create or replace function public.set_company_plan(
  p_company     uuid,
  p_plan        uuid default null,
  p_sampai      date default null,
  p_tanpa_batas boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_lama record;
  v_plan uuid;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh mengubah paket dan masa aktif.' using errcode = 'SH001';
  end if;

  select id, plan_id, status, subscription_ends_at into v_lama
    from public.companies where id = p_company for update;
  if not found then
    raise exception 'Apotek tidak ditemukan.' using errcode = 'SH004';
  end if;

  v_plan := coalesce(p_plan, v_lama.plan_id);
  if p_plan is not null and not exists (select 1 from public.plans where id = p_plan) then
    raise exception 'Paket tidak ditemukan.' using errcode = 'SH004';
  end if;

  update public.companies
     set plan_id = v_plan,
         status  = 'active',
         subscription_ends_at = case
           when p_tanpa_batas then null
           when p_sampai is not null then (p_sampai + time '23:59:59') at time zone 'Asia/Jakarta'
           else subscription_ends_at end
   where id = p_company;

  insert into public.subscription_events (company_id, action, plan_id, from_plan_id, actor_email, note)
  values (p_company,
          case when p_plan is not null and p_plan is distinct from v_lama.plan_id then 'upgrade' else 'renew' end,
          v_plan, v_lama.plan_id, coalesce(lower(auth.jwt() ->> 'email'), 'sistem'),
          case when p_tanpa_batas then 'Masa aktif tanpa batas.'
               else 'Diperpanjang sampai ' || coalesce(p_sampai::text, '(tidak diubah)') || '.' end);

  perform public.catat_audit(p_company, 'apotek.paket', 'companies', p_company::text,
    jsonb_build_object('paket_lama', v_lama.plan_id, 'paket_baru', v_plan,
                       'sampai', p_sampai, 'tanpa_batas', p_tanpa_batas));

  return (select to_jsonb(c) from public.companies c where c.id = p_company);
end;
$$;

revoke all on function public.set_company_plan(uuid, uuid, date, boolean) from public, anon;
grant execute on function public.set_company_plan(uuid, uuid, date, boolean) to authenticated;

create or replace function public.terbitkan_tagihan(
  p_company uuid,
  p_siklus  text default 'bulanan',
  p_mulai   date default null,
  p_plan    uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_comp    record;
  v_plan    record;
  v_mulai   date;
  v_selesai date;
  v_jumlah  bigint;
  v_row     record;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh menerbitkan tagihan.' using errcode = 'SH001';
  end if;
  if p_siklus not in ('bulanan', 'tahunan') then
    raise exception 'Siklus tagihan harus bulanan atau tahunan.' using errcode = 'SH004';
  end if;

  select * into v_comp from public.companies where id = p_company and deleted_at is null;
  if not found then
    raise exception 'Apotek tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_plan from public.plans where id = coalesce(p_plan, v_comp.plan_id);
  if not found then
    raise exception 'Apotek ini belum punya paket. Tentukan paketnya dulu.' using errcode = 'SH004';
  end if;

  v_mulai := coalesce(
    p_mulai,
    greatest(current_date, (v_comp.subscription_ends_at at time zone 'Asia/Jakarta')::date),
    current_date);

  v_selesai := (case when p_siklus = 'tahunan'
                     then v_mulai + interval '1 year'
                     else v_mulai + interval '1 month' end)::date;

  v_jumlah := case when p_siklus = 'tahunan'
                   then coalesce(v_plan.price_yearly, v_plan.price_monthly * 12)
                   else v_plan.price_monthly end;

  insert into public.billing_invoices (
    company_id, plan_id, siklus, periode_mulai, periode_selesai,
    jumlah, status, jatuh_tempo, nomor)
  values (
    p_company, v_plan.id, p_siklus, v_mulai, v_selesai,
    v_jumlah, 'belum_bayar', v_mulai,
    public.next_doc_number(p_company, 'billing_invoices', 'nomor', 'INV',
                           to_char(v_mulai, 'YYYY')))
  returning * into v_row;

  perform public.catat_audit(p_company, 'tagihan.diterbitkan', 'billing_invoices', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'jumlah', v_jumlah, 'siklus', p_siklus,
                       'periode', v_mulai::text || ' s/d ' || v_selesai::text));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.terbitkan_tagihan(uuid, text, date, uuid) from public, anon;
grant execute on function public.terbitkan_tagihan(uuid, text, date, uuid) to authenticated;

create or replace function public.lunasi_tagihan(
  p_invoice   uuid,
  p_metode    text default null,
  p_referensi text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_inv   record;
  v_akhir timestamptz;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin atau sistem pembayaran yang boleh melunasi tagihan.' using errcode = 'SH001';
  end if;

  select * into v_inv from public.billing_invoices where id = p_invoice for update;
  if not found then
    raise exception 'Tagihan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_inv.status = 'dibatalkan' then
    raise exception 'Tagihan ini sudah dibatalkan.' using errcode = 'SH004';
  end if;

  -- Idempoten. Penyedia pembayaran mana pun mengirim ulang notifikasi yang
  -- sama sampai dijawab 200, dan satu jawaban yang telat sedikit sudah cukup
  -- untuk memperpanjang langganan dua kali. Sama berlakunya untuk tangan
  -- manusia yang menekan tombol dua kali karena halaman terasa lambat.
  if v_inv.status = 'lunas' then
    return to_jsonb(v_inv);
  end if;

  update public.billing_invoices
     set status       = 'lunas',
         dibayar_pada = now(),
         metode       = coalesce(nullif(trim(p_metode), ''), metode),
         referensi    = coalesce(nullif(trim(p_referensi), ''), referensi)
   where id = p_invoice;

  v_akhir := (v_inv.periode_selesai + time '23:59:59') at time zone 'Asia/Jakarta';

  update public.companies
     set plan_id = coalesce(v_inv.plan_id, plan_id),
         status  = 'active',
         subscription_ends_at = greatest(coalesce(subscription_ends_at, v_akhir), v_akhir)
   where id = v_inv.company_id;

  insert into public.subscription_events (company_id, action, plan_id, amount, actor_email, note)
  values (v_inv.company_id, 'renew', v_inv.plan_id, v_inv.jumlah,
          coalesce(lower(auth.jwt() ->> 'email'), 'sistem'),
          'Tagihan ' || coalesce(v_inv.nomor, '') || ' lunas.');

  perform public.catat_audit(v_inv.company_id, 'tagihan.lunas', 'billing_invoices', p_invoice::text,
    jsonb_build_object('nomor', v_inv.nomor, 'jumlah', v_inv.jumlah,
                       'metode', p_metode, 'referensi', p_referensi,
                       'aktif_sampai', v_inv.periode_selesai));

  return (select to_jsonb(b) from public.billing_invoices b where b.id = p_invoice);
end;
$$;

revoke all on function public.lunasi_tagihan(uuid, text, text) from public, anon;
grant execute on function public.lunasi_tagihan(uuid, text, text) to authenticated, service_role;

create or replace function public.batalkan_tagihan(p_invoice uuid, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_inv record;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh membatalkan tagihan.' using errcode = 'SH001';
  end if;

  select * into v_inv from public.billing_invoices where id = p_invoice for update;
  if not found then
    raise exception 'Tagihan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_inv.status = 'lunas' then
    raise exception 'Tagihan yang sudah lunas tidak bisa dibatalkan. Terbitkan penyesuaian terpisah.'
      using errcode = 'SH004';
  end if;

  update public.billing_invoices
     set status = 'dibatalkan',
         catatan = nullif(trim(coalesce(catatan || ' ', '') || coalesce(p_alasan, '')), '')
   where id = p_invoice;

  perform public.catat_audit(v_inv.company_id, 'tagihan.dibatalkan', 'billing_invoices', p_invoice::text,
    jsonb_build_object('nomor', v_inv.nomor, 'alasan', p_alasan));

  return (select to_jsonb(b) from public.billing_invoices b where b.id = p_invoice);
end;
$$;

revoke all on function public.batalkan_tagihan(uuid, text) from public, anon;
grant execute on function public.batalkan_tagihan(uuid, text) to authenticated;

create or replace function public.simpan_paket(
  p_id            uuid,
  p_name          text,
  p_description   text,
  p_price_monthly bigint,
  p_price_yearly  bigint,
  p_max_outlets   integer,
  p_max_users     integer,
  p_max_products  integer,
  p_is_public     boolean,
  p_features      jsonb
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_lama record;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh mengubah paket.' using errcode = 'SH001';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Nama paket wajib diisi.' using errcode = 'SH004';
  end if;
  if p_price_monthly < 0 or coalesce(p_price_yearly, 0) < 0 then
    raise exception 'Harga tidak boleh negatif.' using errcode = 'SH004';
  end if;

  select * into v_lama from public.plans where id = p_id for update;
  if not found then
    raise exception 'Paket tidak ditemukan.' using errcode = 'SH004';
  end if;

  update public.plans
     set name          = trim(p_name),
         description   = nullif(trim(p_description), ''),
         price_monthly = p_price_monthly,
         price_yearly  = p_price_yearly,
         max_outlets   = p_max_outlets,
         max_users     = p_max_users,
         max_products  = p_max_products,
         is_public     = coalesce(p_is_public, false),
         features      = coalesce(p_features, features),
         updated_at    = now()
   where id = p_id;

  perform public.catat_audit(null, 'paket.diubah', 'plans', p_id::text,
    jsonb_build_object(
      'code', v_lama.code,
      'harga_lama', v_lama.price_monthly, 'harga_baru', p_price_monthly,
      'publik_lama', v_lama.is_public,    'publik_baru', p_is_public));

  return (select to_jsonb(p) from public.plans p where p.id = p_id);
end;
$$;

revoke all on function public.simpan_paket(uuid, text, text, bigint, bigint, integer, integer, integer, boolean, jsonb)
  from public, anon;
grant execute on function public.simpan_paket(uuid, text, text, bigint, bigint, integer, integer, integer, boolean, jsonb)
  to authenticated;
