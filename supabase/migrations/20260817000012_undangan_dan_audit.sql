-- ============================================================
-- 0012  Undangan tim, jejak audit, dan aksi super admin
-- ============================================================
--
-- Tiga hal yang saling berkaitan, karena ketiganya menyangkut siapa boleh
-- melakukan apa dan siapa yang tahu itu pernah terjadi.
--
-- BAGIAN 1: undangan.
--
-- Cara lama menambah anggota tim: pemilik mengetik email, nama, DAN kata sandi
-- awal orang itu, lalu memberitahukannya. Artinya pemilik apotek mengetahui
-- kata sandi kasirnya, dan biasanya kata sandi itu tidak pernah diganti. Sejak
-- itu, setiap transaksi atas nama kasir tidak lagi membuktikan apa pun: siapa
-- saja yang tahu kata sandinya bisa menjualnya. Untuk apotek yang menjual
-- narkotika dan psikotropika, "siapa yang menyerahkan" bukan detail sepele.
--
-- Sekarang pemilik membuat UNDANGAN, dan yang diundang memilih kata sandinya
-- sendiri. Yang disimpan hanya SIDIK tokennya, bukan tokennya: kalau isi tabel
-- ini bocor, tautan di dalamnya tidak bisa dipakai.
--
-- BAGIAN 2: jejak audit.
--
-- Tabel `audit_logs` sudah ada sejak awal dan tidak pernah sekali pun ditulisi.
-- Yang dicatat di sini bukan semua hal, melainkan yang tidak bisa dibatalkan
-- atau yang mengubah uang, stok, dan hak akses. Penulisannya terjadi DI DALAM
-- fungsi yang melakukan pekerjaannya, bukan dipanggil terpisah dari peramban:
-- catatan yang bisa dilewatkan dengan cara tidak memanggilnya bukan jejak
-- audit, cuma dekorasi.
--
-- BAGIAN 3: aksi super admin.
--
-- Menangguhkan apotek dan mengubah paketnya dulu dilakukan lewat UPDATE
-- langsung dari peramban. Dipindah ke fungsi supaya tercatat, dan supaya
-- penahannya ada di satu tempat.

-- ------------------------------------------------------------
-- 1. Penulis jejak audit
-- ------------------------------------------------------------

create or replace function public.catat_audit(
  p_company   uuid,
  p_action    text,
  p_entity    text,
  p_entity_id text default null,
  p_detail    jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs (company_id, actor_email, action, entity, entity_id, detail)
  values (
    p_company,
    coalesce(lower(auth.jwt() ->> 'email'), 'sistem'),
    p_action, p_entity, p_entity_id, coalesce(p_detail, '{}'::jsonb));
exception when others then
  -- Kegagalan mencatat TIDAK boleh membatalkan pekerjaannya. Penjualan yang
  -- gagal hanya karena barisnya gagal dicatat jauh lebih merugikan daripada
  -- satu baris audit yang hilang.
  raise warning 'catat_audit gagal: %', sqlerrm;
end;
$$;

revoke all on function public.catat_audit(uuid, text, text, text, jsonb) from public, anon, authenticated;

comment on function public.catat_audit is
  'Menulis satu baris jejak audit. Dipanggil DARI DALAM fungsi lain, bukan dari peramban: catatan yang bisa dilewatkan dengan cara tidak memanggilnya bukan jejak audit.';

-- ------------------------------------------------------------
-- 2. Undangan tim
-- ------------------------------------------------------------

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  email        text not null,
  nama         text,
  role         text not null default 'kasir',
  modules      jsonb not null default '[]'::jsonb,
  token_hash   text not null unique,
  dibuat_oleh  text,
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invitations_company on public.invitations (company_id, created_at desc);
create unique index if not exists uq_invitations_terbuka
  on public.invitations (company_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.invitations enable row level security;

drop policy if exists "invitations_read"  on public.invitations;
drop policy if exists "invitations_write" on public.invitations;

-- Hanya bisa DIBACA oleh apoteknya sendiri, dan tidak bisa ditulis langsung
-- sama sekali: semua perubahan lewat fungsi di bawah, supaya token tidak
-- pernah bisa dipasang tangan dan tiap perubahan tercatat.
create policy "invitations_read" on public.invitations
  for select to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin());

comment on table public.invitations is
  'Undangan anggota tim. Yang disimpan hanya SIDIK tokennya: kalau isi tabel ini bocor, tautan di dalamnya tidak bisa dipakai.';

/**
 * Membuat undangan. Mengembalikan tokennya SATU KALI, karena sesudah ini
 * hanya sidiknya yang tersimpan.
 */
create or replace function public.buat_undangan(
  p_email   text,
  p_nama    text default null,
  p_role    text default 'kasir',
  p_modules jsonb default '[]'::jsonb,
  p_hari    integer default 7
)
returns jsonb
-- pgcrypto (digest, gen_random_bytes) terpasang di skema `extensions` pada
-- Supabase, bukan di `public`, jadi ia harus ikut di search_path.
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  v_company uuid := public.auth_company_id();
  v_email   text := lower(trim(p_email));
  v_token   text;
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke apotek mana pun.' using errcode = 'SH004';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Alamat email tidak sah.' using errcode = 'SH004';
  end if;
  if p_role not in ('pemilik', 'admin', 'apoteker', 'asisten_apoteker', 'kasir') then
    raise exception 'Peran tidak dikenali.' using errcode = 'SH004';
  end if;

  -- Hanya pemilik dan admin yang boleh mengundang. Kasir yang bisa mengundang
  -- kasir lain berarti hak akses bisa tumbuh sendiri tanpa sepengetahuan
  -- pemilik.
  if not exists (
    select 1 from public.companies
     where id = v_company and lower(admin_email) = lower(auth.jwt() ->> 'email')
  ) and not exists (
    select 1 from public.app_users
     where company_id = v_company
       and lower(email) = lower(auth.jwt() ->> 'email')
       and role in ('pemilik', 'admin')
       and status = 'aktif'
  ) then
    raise exception 'Hanya pemilik atau admin apotek yang boleh mengundang anggota tim.' using errcode = 'SH001';
  end if;

  if exists (
    select 1 from public.app_users
     where company_id = v_company and lower(email) = v_email
  ) then
    raise exception 'Email ini sudah terdaftar sebagai anggota tim apotek ini.' using errcode = 'SH004';
  end if;

  -- Undangan lama untuk email yang sama dicabut, bukan ditolak: mengirim ulang
  -- undangan adalah hal yang wajar dilakukan orang, dan menolaknya hanya
  -- memaksa mereka mencari tombol Cabut lebih dulu.
  update public.invitations
     set revoked_at = now()
   where company_id = v_company and lower(email) = v_email
     and accepted_at is null and revoked_at is null;

  v_token := replace(replace(encode(gen_random_bytes(32), 'base64'), '/', '_'), '+', '-');
  v_token := replace(v_token, '=', '');

  insert into public.invitations (
    company_id, email, nama, role, modules, token_hash, dibuat_oleh, expires_at)
  values (
    v_company, v_email, nullif(trim(p_nama), ''), p_role, coalesce(p_modules, '[]'::jsonb),
    encode(digest(v_token, 'sha256'), 'hex'),
    lower(auth.jwt() ->> 'email'),
    now() + make_interval(days => greatest(1, least(30, coalesce(p_hari, 7)))))
  returning * into v_row;

  perform public.catat_audit(v_company, 'undangan.dibuat', 'invitations', v_row.id::text,
    jsonb_build_object('email', v_email, 'role', p_role));

  return jsonb_build_object(
    'id', v_row.id, 'token', v_token, 'email', v_email,
    'role', p_role, 'expires_at', v_row.expires_at);
end;
$$;

revoke all on function public.buat_undangan(text, text, text, jsonb, integer) from public, anon;
grant execute on function public.buat_undangan(text, text, text, jsonb, integer) to authenticated;

/**
 * Membaca undangan dari tokennya. Boleh dipanggil TANPA login, karena yang
 * diundang belum punya akun saat membuka tautannya.
 *
 * Yang dikembalikan sengaja sedikit: nama apotek, email yang diundang, dan
 * perannya. Cukup untuk orang tahu ia sedang diundang ke mana, dan tidak cukup
 * untuk dipakai menambang data apotek dengan menebak token.
 */
create or replace function public.lihat_undangan(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions, pg_temp
as $$
declare v_row record;
begin
  select i.*, c.nama as nama_apotek
    into v_row
    from public.invitations i
    join public.companies c on c.id = i.company_id
   where i.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  if not found then
    return jsonb_build_object('sah', false, 'alasan', 'tidak_ditemukan');
  end if;
  if v_row.revoked_at is not null then
    return jsonb_build_object('sah', false, 'alasan', 'dicabut');
  end if;
  if v_row.accepted_at is not null then
    return jsonb_build_object('sah', false, 'alasan', 'sudah_dipakai');
  end if;
  if v_row.expires_at <= now() then
    return jsonb_build_object('sah', false, 'alasan', 'kedaluwarsa');
  end if;

  return jsonb_build_object(
    'sah', true,
    'email', v_row.email,
    'nama', v_row.nama,
    'role', v_row.role,
    'nama_apotek', v_row.nama_apotek,
    'expires_at', v_row.expires_at);
end;
$$;

revoke all on function public.lihat_undangan(text) from public;
grant execute on function public.lihat_undangan(text) to anon, authenticated;

/**
 * Menerima undangan. Dipanggil SESUDAH yang diundang punya akun dan sudah
 * masuk, karena inilah satu-satunya cara membuktikan ia memang pemilik email
 * yang diundang: tokennya membuktikan ia menerima tautannya, sesinya
 * membuktikan ia memegang emailnya.
 */
create or replace function public.terima_undangan(p_token text)
returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_row   record;
begin
  if v_email is null then
    raise exception 'Masuk dulu dengan email yang diundang.' using errcode = 'SH004';
  end if;

  select * into v_row from public.invitations
   where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
   for update;

  if not found then
    raise exception 'Undangan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.revoked_at is not null then
    raise exception 'Undangan ini sudah dicabut.' using errcode = 'SH004';
  end if;
  if v_row.accepted_at is not null then
    raise exception 'Undangan ini sudah pernah dipakai.' using errcode = 'SH004';
  end if;
  if v_row.expires_at <= now() then
    raise exception 'Undangan ini sudah kedaluwarsa. Minta yang baru ke pemilik apotek.' using errcode = 'SH004';
  end if;
  if lower(v_row.email) <> v_email then
    raise exception 'Undangan ini ditujukan untuk %, bukan untuk akun yang sedang masuk.', v_row.email
      using errcode = 'SH001';
  end if;

  -- Kuota pengguna ditegakkan trigger pada app_users, jadi undangan yang
  -- diterima saat kuota sudah penuh ditolak di sini, bukan diam-diam lolos.
  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_row.company_id, coalesce(v_row.nama, split_part(v_email, '@', 1)),
          v_email, v_row.role, 'aktif', v_row.modules);

  update public.invitations
     set accepted_at = now()
   where id = v_row.id;

  perform public.catat_audit(v_row.company_id, 'undangan.diterima', 'invitations', v_row.id::text,
    jsonb_build_object('email', v_email, 'role', v_row.role));

  return jsonb_build_object('company_id', v_row.company_id, 'role', v_row.role);
end;
$$;

revoke all on function public.terima_undangan(text) from public, anon;
grant execute on function public.terima_undangan(text) to authenticated;

create or replace function public.cabut_undangan(p_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  select * into v_row from public.invitations
   where id = p_id
     and (public.is_super_admin() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Undangan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.accepted_at is not null then
    raise exception 'Undangan ini sudah diterima, tidak bisa dicabut. Nonaktifkan penggunanya lewat Manajemen Pengguna.'
      using errcode = 'SH004';
  end if;

  update public.invitations set revoked_at = now() where id = p_id and revoked_at is null;

  perform public.catat_audit(v_row.company_id, 'undangan.dicabut', 'invitations', p_id::text,
    jsonb_build_object('email', v_row.email));
end;
$$;

revoke all on function public.cabut_undangan(uuid) from public, anon;
grant execute on function public.cabut_undangan(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. Aksi super admin
-- ------------------------------------------------------------

create or replace function public.set_company_status(p_company uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_lama text;
begin
  if not public.is_super_admin() then
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
         lower(auth.jwt() ->> 'email')
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
  if not public.is_super_admin() then
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

  -- Status ikut berpindah ke 'active'. Keduanya HARUS bergerak bersama:
  -- apotek yang statusnya masih 'trial' dibaca dari trial_ends_at, jadi
  -- memperpanjang tanpa memindahkan status berarti tanggal barunya tidak
  -- dilihat siapa pun (lihat company_lapsed_at, migrasi 0003).
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
          v_plan, v_lama.plan_id, lower(auth.jwt() ->> 'email'),
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

-- ------------------------------------------------------------
-- 4. Jejak audit pada fungsi yang sudah ada
-- ------------------------------------------------------------
--
-- Ditempel lewat pembungkus, bukan dengan menulis ulang badan fungsinya:
-- badan yang sudah diperiksa dan dipakai tidak perlu disentuh lagi hanya untuk
-- menambah satu baris catatan.

create or replace function public.cancel_transaction(p_transaction_id uuid, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company  uuid := public.auth_company_id();
  v_super    boolean := public.is_super_admin();
  v_trx      record;
  v_baris    integer := 0;
  v_catatan  text;
begin
  select * into v_trx from public.transactions
   where id = p_transaction_id and (v_super or company_id = v_company)
   for update;
  if not found then
    raise exception 'Transaksi tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_trx.status = 'dibatalkan' then
    return to_jsonb(v_trx);
  end if;

  update public.products p
     set stok_total = p.stok_total + i.jumlah
    from public.transaction_items i
   where i.transaction_id = p_transaction_id and i.product_id = p.id;

  with kembali as (
    update public.product_batches b
       set stok_batch = b.stok_batch + tib.jumlah
      from public.transaction_item_batches tib
     where tib.transaction_id = p_transaction_id and tib.batch_id = b.id
    returning 1
  )
  select count(*) into v_baris from kembali;

  if v_baris = 0 and exists (
    select 1 from public.transaction_items
     where transaction_id = p_transaction_id and product_id is not null
  ) then
    v_catatan := 'Stok batch tidak dikembalikan otomatis: transaksi ini dibuat sebelum pencatatan batch per baris. Luruskan lewat stok opname.';
  end if;

  update public.transactions
     set status             = 'dibatalkan',
         dibatalkan_pada    = now(),
         dibatalkan_oleh    = coalesce(auth.jwt() ->> 'email', 'sistem'),
         catatan_pembatalan = nullif(trim(
           coalesce(nullif(trim(p_alasan), '') || ' ', '') || coalesce(v_catatan, '')
         ), '')
   where id = p_transaction_id;

  perform public.catat_audit(v_trx.company_id, 'transaksi.dibatalkan', 'transactions', p_transaction_id::text,
    jsonb_build_object('nomor', v_trx.nomor_transaksi, 'total', v_trx.total,
                       'batch_dikembalikan', v_baris, 'catatan', v_catatan));

  return (select to_jsonb(t) from public.transactions t where t.id = p_transaction_id);
end;
$$;

revoke all on function public.cancel_transaction(uuid, text) from public, anon;
grant execute on function public.cancel_transaction(uuid, text) to authenticated;

comment on function public.cancel_transaction is
  'Pembatalan penjualan sebagai satu transaksi database: stok produk dan stok batch dikembalikan bersama, pemanggilan kedua tidak menambah stok lagi, dan hasilnya tercatat di jejak audit.';
