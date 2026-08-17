-- ============================================================
-- Sehatera · 0002 · Isolasi antar apotek, penomoran, dan penutupan lubang RLS
--
-- LUBANG YANG DITUTUP DI SINI.
-- Versi lama (`sql/2026_companies_superadmin.sql`) memasang policy
-- `for all using (true) with check (true)` pada `companies` DAN `super_admins`.
-- Akibatnya siapa pun yang berhasil login, termasuk kasir dari apotek lain -
-- bisa membaca seluruh daftar klien beserta email admin dan masa aktifnya, lalu
-- mengubah `status` apotek mana pun. Aplikasi tidak perlu diretas untuk itu;
-- satu panggilan PostgREST dengan kunci anon yang memang ada di browser sudah
-- cukup. Selama policy itu terpasang, sistem langganan apa pun yang dibangun di
-- atasnya bisa dimatikan dari luar aplikasi, jadi ini didahulukan sebelum
-- semua yang lain.
-- ============================================================

-- ============================================================
-- 1. Fungsi penentu identitas
-- ============================================================

-- SECURITY DEFINER karena dipanggil DARI DALAM policy: kalau fungsinya ikut
-- disaring RLS, ia akan mencari barisnya sendiri, tidak menemukan apa pun, dan
-- semua policy jadi menolak semuanya.
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.super_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function public.auth_company_id()
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(
    -- pemilik: apotek yang didaftarkan dengan email ini
    (select id from public.companies
      where lower(admin_email) = lower(auth.jwt() ->> 'email')
        and deleted_at is null
      limit 1),
    -- anggota tim: apotek tempat ia terdaftar
    (select company_id from public.app_users
      where lower(email) = lower(auth.jwt() ->> 'email')
        and status = 'aktif'
      limit 1)
  );
$$;

revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.auth_company_id() from public, anon;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.auth_company_id() to authenticated;

-- ============================================================
-- 2. Pengisian company_id otomatis
-- ============================================================
-- Tanpa ini, satu tempat di aplikasi yang lupa mengirim company_id akan menulis
-- baris tanpa pemilik: tidak terlihat oleh siapa pun, tidak terhapus oleh
-- siapa pun, dan tidak terhitung di laporan mana pun.
create or replace function public.set_company_id()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.company_id is null then
    new.company_id := public.auth_company_id();
  end if;
  return new;
end;
$$;

-- ============================================================
-- 3. Penomoran dokumen: berurut PER APOTEK
-- ============================================================
-- Nomor dibuat di database, bukan di browser. Dua kasir yang menekan "Proses"
-- pada detik yang sama akan mendapat nomor struk yang sama kalau nomornya
-- dihitung di aplikasi, dan struk kembar adalah masalah yang baru ketahuan saat
-- tutup buku.
create or replace function public.next_doc_number(
  p_company uuid, p_table text, p_column text, p_prefix text, p_year text
)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_seq integer;
begin
  execute format(
    'select coalesce(max(nullif(regexp_replace(%I, ''^.*/'', ''''), '''')::integer), 0) + 1
       from public.%I
      where company_id = $1 and %I like $2',
    p_column, p_table, p_column
  )
  into v_seq
  using p_company, p_prefix || '/' || p_year || '/%';

  return p_prefix || '/' || p_year || '/' || lpad(v_seq::text, 4, '0');
end;
$$;

-- Empat trigger kecil yang eksplisit, bukan satu trigger generik. Versi generik
-- perlu menulis kolom yang namanya baru diketahui saat jalan, dan trik untuk
-- melakukan itu membuat penomoran struk: hal yang paling tidak boleh gagal di
-- aplikasi ini: bergantung pada bagian PL/pgSQL yang paling sulit dibaca.
create or replace function public.set_nomor_pemusnahan()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.nomor_ba is null then
    new.nomor_ba := public.next_doc_number(
      new.company_id, 'pemusnahan', 'nomor_ba', 'BA',
      to_char(coalesce(new.tanggal_musnahkan, current_date), 'YYYY'));
  end if;
  return new;
end $$;

create or replace function public.set_nomor_retur()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.nomor_retur is null then
    new.nomor_retur := public.next_doc_number(
      new.company_id, 'retur_supplier', 'nomor_retur', 'RTR',
      to_char(coalesce(new.tanggal_retur, current_date), 'YYYY'));
  end if;
  return new;
end $$;

create or replace function public.set_nomor_po()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.nomor_po is null then
    new.nomor_po := public.next_doc_number(
      new.company_id, 'purchase_orders', 'nomor_po', 'PO',
      to_char(current_date, 'YYYY'));
  end if;
  return new;
end $$;

create or replace function public.set_nomor_transaksi()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.nomor_transaksi is null then
    new.nomor_transaksi := public.next_doc_number(
      new.company_id, 'transactions', 'nomor_transaksi', 'TRX',
      to_char(current_date, 'YYYY'));
  end if;
  return new;
end $$;

drop trigger if exists trg_nomor_pemusnahan on public.pemusnahan;
create trigger trg_nomor_pemusnahan before insert on public.pemusnahan
  for each row execute function public.set_nomor_pemusnahan();

drop trigger if exists trg_nomor_retur on public.retur_supplier;
create trigger trg_nomor_retur before insert on public.retur_supplier
  for each row execute function public.set_nomor_retur();

drop trigger if exists trg_nomor_po on public.purchase_orders;
create trigger trg_nomor_po before insert on public.purchase_orders
  for each row execute function public.set_nomor_po();

drop trigger if exists trg_nomor_trx on public.transactions;
create trigger trg_nomor_trx before insert on public.transactions
  for each row execute function public.set_nomor_transaksi();

-- Fungsi lama `set_nomor_ba()` dari `sql/2026_expired_followup.sql` menghitung
-- `count(*) + 1` lintas seluruh tabel tanpa memandang apotek: begitu ada apotek
-- kedua, nomornya melompat dan bentrok. Padanannya di atas sudah menggantikan.
-- `set_nomor_retur()` tidak ikut di-drop di sini: namanya sama dan sudah
-- ditulis ulang oleh `create or replace` di atas; men-drop-nya dengan cascade
-- justru akan ikut menghapus trigger yang baru saja dipasang.
drop function if exists public.set_nomor_ba() cascade;

-- ============================================================
-- 4. Policy tabel data apotek
-- ============================================================
do $$
declare
  t   text;
  pol record;
  tables text[] := array[
    'settings','app_users','products','suppliers','product_suppliers',
    'purchase_orders','po_items','product_batches','faktur','services',
    'transactions','transaction_items','pemusnahan','retur_supplier'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I add column if not exists company_id uuid', t);

    execute format('drop trigger if exists trg_set_company_id on public.%I', t);
    execute format('create trigger trg_set_company_id before insert on public.%I
                    for each row execute function public.set_company_id()', t);

    execute format('alter table public.%I enable row level security', t);

    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    execute format(
      'create policy "tenant_all" on public.%I for all to authenticated
         using (company_id = public.auth_company_id() or public.is_super_admin())
         with check (company_id = public.auth_company_id() or public.is_super_admin())', t);

    execute format('create index if not exists idx_%s_company on public.%I (company_id)', t, t);
  end loop;
end $$;

-- ============================================================
-- 5. Policy tabel platform: bagian yang dulu bolong
-- ============================================================

alter table public.companies enable row level security;
drop policy if exists "allow all companies" on public.companies;
drop policy if exists "companies_select"    on public.companies;
drop policy if exists "companies_update"    on public.companies;
drop policy if exists "companies_super_all" on public.companies;

-- Apotek hanya melihat dirinya sendiri. Super admin melihat semuanya.
create policy "companies_select" on public.companies
  for select to authenticated
  using (id = public.auth_company_id() or public.is_super_admin());

-- Pemilik boleh memperbarui profil apoteknya. Kolom komersial dijaga trigger di
-- bawah, bukan oleh policy: RLS bekerja per BARIS, tidak per kolom, jadi policy
-- yang mengizinkan update baris sendiri otomatis mengizinkan update kolom
-- `status` dan `subscription_ends_at` juga.
create policy "companies_update_own" on public.companies
  for update to authenticated
  using (id = public.auth_company_id())
  with check (id = public.auth_company_id());

create policy "companies_super_write" on public.companies
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create or replace function public.guard_company_commercial()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;

  -- Pemilik apotek tidak boleh memperpanjang langganannya sendiri.
  if new.plan_id              is distinct from old.plan_id
     or new.status            is distinct from old.status
     or new.trial_ends_at     is distinct from old.trial_ends_at
     or new.subscription_ends_at is distinct from old.subscription_ends_at
     or new.deleted_at        is distinct from old.deleted_at
     or new.admin_email       is distinct from old.admin_email then
    raise exception 'Paket dan masa aktif hanya bisa diubah oleh admin Sehatera.'
      using errcode = 'SH001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_company_commercial on public.companies;
create trigger trg_guard_company_commercial
  before update on public.companies
  for each row execute function public.guard_company_commercial();

-- ---------- super_admins ----------
-- Daftar super admin tidak boleh bisa dibaca, apalagi ditulis, oleh pengguna
-- biasa. Aplikasi TIDAK perlu membacanya untuk tahu siapa dirinya: ada
-- `is_super_admin()` yang SECURITY DEFINER untuk itu.
alter table public.super_admins enable row level security;
drop policy if exists "allow all super_admins" on public.super_admins;
drop policy if exists "super_admins_self"      on public.super_admins;

create policy "super_admins_self" on public.super_admins
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------- plans ----------
-- Dibaca tanpa login: halaman harga publik harus bisa menampilkannya sebelum
-- orang punya akun.
alter table public.plans enable row level security;
drop policy if exists "plans_read"  on public.plans;
drop policy if exists "plans_write" on public.plans;

create policy "plans_read" on public.plans
  for select to anon, authenticated
  using (is_public or public.is_super_admin());

create policy "plans_write" on public.plans
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------- riwayat langganan & audit ----------
alter table public.subscription_events enable row level security;
drop policy if exists "sub_events_read"  on public.subscription_events;
drop policy if exists "sub_events_write" on public.subscription_events;

create policy "sub_events_read" on public.subscription_events
  for select to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin());

create policy "sub_events_write" on public.subscription_events
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

alter table public.audit_logs enable row level security;
drop policy if exists "audit_read"   on public.audit_logs;
drop policy if exists "audit_insert" on public.audit_logs;

create policy "audit_read" on public.audit_logs
  for select to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin());

create policy "audit_insert" on public.audit_logs
  for insert to authenticated
  with check (company_id = public.auth_company_id() or public.is_super_admin());

comment on function public.guard_company_commercial is
  'RLS menyaring baris, bukan kolom. Trigger ini yang menahan pemilik apotek mengubah paket dan masa aktifnya sendiri.';
