-- ============================================================
-- Sehatera · 0003 · Kuota paket & masa aktif langganan
--
-- Penegakannya ditaruh di DATABASE, bukan di layar. Dua alasan yang sudah
-- menggigit project sejenis:
--   1. INSERT yang ditolak RLS mengembalikan "sukses" dengan 0 baris, bukan
--      error: pengecekan di aplikasi mudah bocor tanpa meninggalkan jejak.
--   2. Impor katalog CSV menembak `products` langsung dalam satu insert massal.
--      Gerbang yang cuma ada di form tambah-produk akan dilewati begitu saja.
-- ============================================================

-- ============================================================
-- 1. Kuota paket
-- ============================================================

-- NULL berarti tanpa batas. Apotek tanpa paket (`plan_id` belum diisi) juga
-- NULL: jangan pernah mengunci apotek hanya karena kolomnya belum terisi -
-- memberi kelebihan jauh lebih murah daripada menahan apotek yang sudah bayar
-- lalu menunggu mereka mengeluh.
create or replace function public.company_quota(p_company uuid, p_key text)
returns integer
language sql stable security definer set search_path = public, pg_temp
as $$
  select case p_key
    when 'products' then pl.max_products
    when 'users'    then pl.max_users
    when 'outlets'  then pl.max_outlets
    when 'devices'  then pl.max_devices
  end
  from public.companies c
  join public.plans pl on pl.id = c.plan_id
  where c.id = p_company
$$;

-- SATU sumber kebenaran, dipakai trigger DI BAWAH dan panel kuota di Super
-- Admin. Kalau keduanya menghitung sendiri-sendiri, angka yang dilihat admin
-- cepat atau lambat berbeda dari angka yang dipakai menolak.
create or replace function public.company_usage(p_company uuid, p_key text)
returns integer
language sql stable security definer set search_path = public, pg_temp
as $$
  select (case p_key
    when 'products' then
      (select count(*) from public.products where company_id = p_company)
    when 'users' then
      (select count(*) from public.app_users
        where company_id = p_company and status = 'aktif')
  end)::integer
$$;

-- TG_ARGV[0] kunci kuota · TG_ARGV[1] kata benda · TG_ARGV[2] saran tindakan.
-- SQLSTATE SH002 dipakai supaya aplikasi bisa mengenali penolakan kuota tanpa
-- mencocokkan teks. Pesannya sudah ditulis untuk pemilik apotek, jadi aman
-- ditampilkan apa adanya.
create or replace function public.enforce_plan_quota()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_used  integer;
begin
  v_limit := public.company_quota(new.company_id, TG_ARGV[0]);
  if v_limit is null then
    return new;
  end if;

  v_used := public.company_usage(new.company_id, TG_ARGV[0]);

  if v_used >= v_limit then
    raise exception 'Paket apotek ini hanya mengizinkan % %. %',
      v_limit, TG_ARGV[1], TG_ARGV[2]
      using errcode = 'SH002';
  end if;

  return new;
end;
$$;

-- Sengaja hanya pada INSERT. Apotek yang turun paket dan sudah terlanjur
-- melewati batas TIDAK kehilangan satu baris pun: ia hanya tidak bisa menambah
-- sampai kembali di bawah batas. Menghapus data orang karena downgrade adalah
-- cara tercepat kehilangan kepercayaan, dan untuk apotek itu berarti menghapus
-- katalog obat yang jadi dasar laporan ke Dinas Kesehatan.
drop trigger if exists trg_quota_products on public.products;
create trigger trg_quota_products
  before insert on public.products
  for each row execute function public.enforce_plan_quota(
    'products', 'item obat',
    'Nonaktifkan obat yang sudah tidak dijual, atau naikkan paket apotek.');

drop trigger if exists trg_quota_users on public.app_users;
create trigger trg_quota_users
  before insert on public.app_users
  for each row execute function public.enforce_plan_quota(
    'users', 'pengguna',
    'Nonaktifkan anggota yang sudah tidak bekerja, atau naikkan paket apotek.');

-- Kedua fungsi di atas menerima id apotek APA PUN. Dibiarkan terbuka, keduanya
-- jadi cara menghitung isi katalog dan jumlah pegawai apotek pesaing satu per
-- satu. Yang boleh dipanggil aplikasi hanyalah view di bawah, yang menyaring
-- dirinya sendiri.
revoke all on function public.company_quota(uuid, text) from public, anon, authenticated;
revoke all on function public.company_usage(uuid, text) from public, anon, authenticated;

-- ---------- ringkasan kuota ----------
-- Sengaja BUKAN security_invoker: view ini memanggil fungsi yang hak panggilnya
-- baru saja dicabut, jadi penyaringnya ditulis di sini sebagai WHERE yang bisa
-- dibaca langsung. Angkanya PERSIS sama dengan yang dipakai trigger menolak.
create or replace view public.v_company_quota as
select
  c.id                                    as company_id,
  pl.max_products,
  pl.max_users,
  public.company_usage(c.id, 'products')  as used_products,
  public.company_usage(c.id, 'users')     as used_users
from public.companies c
left join public.plans pl on pl.id = c.plan_id
where c.deleted_at is null
  and (c.id = public.auth_company_id() or public.is_super_admin());

grant select on public.v_company_quota to authenticated;

-- ============================================================
-- 2. Masa aktif langganan
-- ============================================================

-- Kapan akses sebuah apotek habis. NULL = belum/tidak habis.
--
-- STATUS yang menentukan tanggal mana yang berlaku. Apotek yang masih trial
-- tidak boleh dikunci oleh subscription_ends_at, dan sebaliknya: kalau tidak,
-- apotek yang naik dari trial ke berbayar akan membawa tanggal trial lamanya
-- dan langsung terkunci di hari ia membayar.
--
-- Aturan ini WAJIB sama persis dengan lib/subscription.ts. Kalau keduanya
-- berbeda, apotek melihat "aman" di layar lalu ditolak saat menekan Proses
-- Transaksi, dan itu terjadi di depan pembeli yang sedang antre.
create or replace function public.company_lapsed_at(p_company uuid)
returns timestamptz
language sql stable security definer set search_path = public, pg_temp
as $$
  select case
    when c.status in ('suspended', 'inactive') then now()
    when c.status = 'trial'  then c.trial_ends_at
    when c.status = 'active' then c.subscription_ends_at
  end
  from public.companies c
  where c.id = p_company and c.deleted_at is null
$$;

create or replace function public.company_is_active(p_company uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  -- Tanpa tanggal akhir dianggap aktif. Jangan pernah mengunci apotek hanya
  -- karena kolomnya belum pernah diisi.
  select coalesce(public.company_lapsed_at(p_company) > now(), true)
$$;

-- Hak panggil DICABUT dari `authenticated`: fungsinya menerima id apotek apa
-- pun, jadi kalau dibiarkan terbuka ia jadi cara memeriksa status langganan
-- apotek lain satu per satu.
revoke all on function public.company_lapsed_at(uuid) from public, anon, authenticated;
revoke all on function public.company_is_active(uuid)  from public, anon, authenticated;

-- ---------- gerbang transaksi ----------
-- Yang berhenti saat langganan habis HANYA penerimaan transaksi baru. Data lama
-- tetap utuh, tetap bisa dibuka, tetap bisa dicetak dan dilaporkan. Apotek yang
-- masa aktifnya lewat masih punya kewajiban SIPNAP bulan itu, dan menyandera
-- datanya sampai mereka membayar bukan cuma tidak sopan: itu menghalangi
-- mereka memenuhi kewajiban hukum.
create or replace function public.enforce_subscription_active()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.company_is_active(new.company_id) then
    raise exception 'Masa aktif langganan apotek ini sudah berakhir. Data Anda aman dan tetap bisa dibuka; transaksi baru bisa dilanjutkan setelah langganan diaktifkan.'
      using errcode = 'SH003';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_subscription_transactions on public.transactions;
create trigger trg_subscription_transactions
  before insert on public.transactions
  for each row execute function public.enforce_subscription_active();

-- ---------- trial sekali per akun ----------
-- Trial dihitung per EMAIL PENDAFTAR, bukan per apotek. Kalau per apotek, satu
-- orang bisa mendaftar "Apotek Sehat 1", "Apotek Sehat 2", dan seterusnya untuk
-- mendapat 14 hari gratis tanpa henti.
create table if not exists public.trial_grants (
  email      text primary key,
  granted_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null
);

alter table public.trial_grants enable row level security;
drop policy if exists "trial_grants_super" on public.trial_grants;
create policy "trial_grants_super" on public.trial_grants
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

comment on function public.company_lapsed_at is
  'Kapan akses apotek habis. Aturannya harus sama persis dengan lib/subscription.ts.';
comment on function public.enforce_plan_quota is
  'Trigger BEFORE INSERT penegak kuota paket. Menolak dengan SQLSTATE SH002.';
