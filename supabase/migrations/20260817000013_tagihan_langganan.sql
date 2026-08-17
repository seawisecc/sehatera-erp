-- ============================================================
-- 0013  Tagihan langganan, dan editor paket
-- ============================================================
--
-- Sampai sekarang berlangganan dicatat sebagai DUA tanggal di tabel apotek dan
-- tidak lebih. Siapa membayar berapa untuk periode mana tidak pernah ada di
-- mana pun: yang tersisa hanya `subscription_ends_at` yang bergeser maju, dan
-- satu baris di `subscription_events` yang mencatat bahwa sesuatu diperpanjang
-- tanpa nominal. Untuk dua apotek itu bisa diingat kepala; untuk dua puluh
-- tidak, dan pertanyaan "apotek mana yang belum bayar bulan ini" jadi tidak
-- bisa dijawab tanpa membuka WhatsApp satu per satu.
--
-- Yang dibangun di sini SENGAJA berhenti sebelum penyedia pembayaran. Gateway
-- (Midtrans, Xendit, Duitku) belum dipilih, dan menulis pemeriksaan tanda
-- tangan untuk penyedia yang belum tentu dipakai berarti menulis kode yang
-- tidak bisa diuji terhadap apa pun. Yang dibangun adalah bagian yang tidak
-- berubah apa pun penyedianya:
--
--   · buku tagihan, supaya pertanyaan "siapa belum bayar" punya jawaban;
--   · `lunasi_tagihan()` yang IDEMPOTEN, karena gateway mana pun mengirim
--     ulang notifikasi yang sama, dan tanpa itu satu pembayaran bisa
--     memperpanjang langganan dua kali;
--   · buku peristiwa webhook, yang menahan pengiriman ulang di pintu depan.
--
-- Begitu penyedianya dipilih, yang ditambahkan cuma pembacaan tanda tangannya.
-- Jalur yang memindahkan uang jadi masa aktif sudah berdiri dan sudah dipakai
-- tangan.

-- ------------------------------------------------------------
-- 1. Buku tagihan
-- ------------------------------------------------------------

create table if not exists public.billing_invoices (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  plan_id         uuid references public.plans(id),
  nomor           text,
  siklus          text not null default 'bulanan',
  periode_mulai   date not null,
  periode_selesai date not null,
  jumlah          bigint not null default 0,
  status          text not null default 'belum_bayar',
  jatuh_tempo     date,
  dibayar_pada    timestamptz,
  metode          text,
  referensi       text,
  catatan         text,
  created_at      timestamptz not null default now(),
  constraint billing_invoices_siklus_check check (siklus in ('bulanan', 'tahunan')),
  constraint billing_invoices_status_check check (status in ('belum_bayar', 'lunas', 'dibatalkan')),
  constraint billing_invoices_periode_check check (periode_selesai > periode_mulai)
);

create index if not exists idx_billing_company on public.billing_invoices (company_id, periode_mulai desc);
create index if not exists idx_billing_status  on public.billing_invoices (status, jatuh_tempo);
create unique index if not exists uq_billing_nomor on public.billing_invoices (company_id, nomor) where nomor is not null;

-- Satu apotek tidak boleh punya dua tagihan terbuka untuk periode yang sama.
-- Tanpa ini, menekan "Terbitkan" dua kali menghasilkan dua tagihan, dan yang
-- kedua akan ditagihkan ke orang yang sudah membayar.
create unique index if not exists uq_billing_periode_terbuka
  on public.billing_invoices (company_id, periode_mulai)
  where status <> 'dibatalkan';

alter table public.billing_invoices enable row level security;

drop policy if exists "billing_read" on public.billing_invoices;

-- Apotek boleh MELIHAT tagihannya sendiri, dan tidak boleh menulis apa pun.
-- Semua perubahan lewat fungsi di bawah: tagihan yang bisa ditandai lunas dari
-- peramban bukan tagihan.
create policy "billing_read" on public.billing_invoices
  for select to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin());

comment on table public.billing_invoices is
  'Buku tagihan langganan. Hanya bisa dibaca dari aplikasi; diterbitkan dan dilunasi lewat fungsi, supaya tiap perubahan tercatat dan tidak bisa dilakukan dua kali.';

-- ------------------------------------------------------------
-- 2. Buku peristiwa webhook
-- ------------------------------------------------------------

create table if not exists public.webhook_events (
  id            uuid primary key default gen_random_uuid(),
  penyedia      text not null,
  event_id      text not null,
  payload       jsonb,
  diterima_pada timestamptz not null default now(),
  diproses_pada timestamptz,
  hasil         text
);

create unique index if not exists uq_webhook_event on public.webhook_events (penyedia, event_id);

alter table public.webhook_events enable row level security;
-- Tanpa policy sama sekali: tidak ada peran aplikasi yang boleh menyentuhnya.
-- Yang menulis nanti adalah route webhook lewat kunci service_role, yang
-- memang melewati RLS.

comment on table public.webhook_events is
  'Penahan pengiriman ulang dari penyedia pembayaran. Gateway mana pun mengirim ulang notifikasi yang sama sampai dijawab 200; tanpa buku ini satu pembayaran bisa memperpanjang langganan dua kali.';

-- ------------------------------------------------------------
-- 3. Menerbitkan tagihan
-- ------------------------------------------------------------

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
  if not public.is_super_admin() then
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

  -- Periode berikutnya dimulai dari akhir masa aktif yang sekarang, bukan dari
  -- hari ini. Kalau dimulai dari hari ini, apotek yang membayar lebih awal
  -- kehilangan sisa hari yang sudah dibayarnya.
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

-- ------------------------------------------------------------
-- 4. Melunasi tagihan
-- ------------------------------------------------------------

/**
 * Menandai tagihan lunas DAN memajukan masa aktif apoteknya, dalam satu
 * transaksi database.
 *
 * IDEMPOTEN. Ini bukan kehati-hatian berlebihan: penyedia pembayaran mana pun
 * mengirim ulang notifikasi yang sama sampai dijawab 200, dan satu jawaban
 * yang telat sedikit sudah cukup untuk memperpanjang langganan dua kali. Sama
 * berlakunya untuk tangan manusia yang menekan tombol dua kali karena halaman
 * terasa lambat.
 *
 * Dibuka untuk `service_role` juga, supaya route webhook nanti memanggil
 * fungsi yang SAMA dengan yang dipakai tangan. Dua jalur berbeda untuk
 * pekerjaan yang sama adalah cara paling pasti keduanya berbeda perilakunya.
 */
create or replace function public.lunasi_tagihan(
  p_invoice   uuid,
  p_metode    text default null,
  p_referensi text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_inv  record;
  v_akhir timestamptz;
begin
  if not public.is_super_admin() and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Hanya super admin atau sistem pembayaran yang boleh melunasi tagihan.' using errcode = 'SH001';
  end if;

  select * into v_inv from public.billing_invoices where id = p_invoice for update;
  if not found then
    raise exception 'Tagihan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_inv.status = 'dibatalkan' then
    raise exception 'Tagihan ini sudah dibatalkan.' using errcode = 'SH004';
  end if;
  if v_inv.status = 'lunas' then
    return to_jsonb(v_inv);
  end if;

  update public.billing_invoices
     set status       = 'lunas',
         dibayar_pada = now(),
         metode       = coalesce(nullif(trim(p_metode), ''), metode),
         referensi    = coalesce(nullif(trim(p_referensi), ''), referensi)
   where id = p_invoice;

  -- Masa aktif dimajukan ke akhir periode yang dibayar, dan status dipindah ke
  -- 'active'. Keduanya harus bergerak bersama: apotek yang statusnya masih
  -- 'trial' dibaca dari trial_ends_at, jadi memajukan tanggal tanpa
  -- memindahkan status berarti tanggal barunya tidak dilihat siapa pun
  -- (lihat company_lapsed_at, migrasi 0003).
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
  if not public.is_super_admin() then
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

-- ------------------------------------------------------------
-- 5. Editor paket
-- ------------------------------------------------------------

/**
 * Mengubah harga dan batas paket tanpa deploy.
 *
 * Halaman harga publik membacanya langsung, jadi salah ketik di sini terlihat
 * orang banyak dalam hitungan detik. Karena itu perubahannya dicatat, dan
 * `code` sengaja TIDAK bisa diubah: kode paket dipakai sebagai pengenal di
 * seed dan di jejak langganan, dan menggantinya memutus keduanya diam-diam.
 */
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
  if not public.is_super_admin() then
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

comment on function public.simpan_paket is
  'Editor paket untuk super admin. Harga dan batas berubah tanpa deploy, dan halaman harga publik ikut berubah karena membacanya dari tabel yang sama.';
