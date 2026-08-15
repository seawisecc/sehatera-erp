-- ============================================================
-- Sehatera · 0001 · Skema dasar
--
-- Menggantikan 14 file di `sql/` yang dulu dijalankan manual satu per satu di
-- SQL Editor. Masalahnya bukan gayanya: tidak ada satu pun urutan yang bisa
-- diputar ulang dari nol, jadi tidak ada cara memastikan database produksi dan
-- database uji berisi hal yang sama. Mulai dari sini, database dibangun HANYA
-- lewat folder ini, berurut.
--
-- KENAPA BENTUKNYA `create table if not exists` LALU `add column if not exists`
-- SATU PER SATU, bukan satu CREATE TABLE yang rapi:
--
-- Database yang sudah berjalan SUDAH punya sebagian tabel ini, dibuat tangan
-- lewat SQL Editor dan tidak pernah tercatat di file mana pun.
-- `create table if not exists` pada tabel yang sudah ada TIDAK melakukan apa
-- pun — ia tidak menambahkan kolom yang kurang, dan tidak mengeluh. Jadi
-- migrasi yang hanya berisi CREATE TABLE akan melaporkan "berhasil" sambil
-- meninggalkan database persis seperti semula, dan kode baru yang menulis ke
-- kolom yang tidak ada baru gagal berjam-jam kemudian di tangan pengguna.
--
-- Bentuk di bawah lebih panjang dibaca, tapi menghasilkan bentuk akhir yang
-- sama baik dijalankan di database kosong maupun di database yang sudah berisi
-- data — dan yang kedua itulah keadaan nyatanya.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- LAPISAN PLATFORM — milik penyedia layanan, bukan milik apotek
-- ============================================================

-- ---------- paket langganan ----------
-- Harga dan batas disimpan di baris, bukan di kode, supaya bisa diubah lewat
-- panel Super Admin tanpa deploy. `features` menampung penanda kemampuan yang
-- tidak berbentuk angka (lihat lib/plan.ts).
create table if not exists public.plans (id uuid primary key default gen_random_uuid());
alter table public.plans
  add column if not exists code          text,
  add column if not exists name          text,
  add column if not exists description   text,
  add column if not exists price_monthly bigint not null default 0,
  add column if not exists price_yearly  bigint,
  add column if not exists max_outlets   integer,   -- null = tanpa batas
  add column if not exists max_users     integer,
  add column if not exists max_products  integer,
  add column if not exists max_devices   integer,
  add column if not exists features      jsonb not null default '{}'::jsonb,
  add column if not exists sort_order    integer not null default 0,
  add column if not exists is_public     boolean not null default true,
  add column if not exists created_at    timestamptz not null default now(),
  add column if not exists updated_at    timestamptz not null default now();
create unique index if not exists uq_plans_code on public.plans (code);

-- ---------- super admin ----------
create table if not exists public.super_admins (email text primary key);
alter table public.super_admins
  add column if not exists created_at timestamptz not null default now();

-- ---------- apotek (tenant) ----------
create table if not exists public.companies (id uuid primary key default gen_random_uuid());
alter table public.companies
  add column if not exists nama                 text,
  add column if not exists slug                 text,
  add column if not exists admin_nama           text,
  add column if not exists admin_email          text,
  add column if not exists kota                 text,
  add column if not exists telepon              text,
  add column if not exists plan_id              uuid references public.plans(id),
  add column if not exists status               text not null default 'trial',
  add column if not exists trial_ends_at        timestamptz,
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists theme                text not null default 'sunrise-sorbet',
  add column if not exists deleted_at           timestamptz,
  add column if not exists created_at           timestamptz not null default now(),
  -- Dua kolom di bawah warisan `sql/2026_companies_superadmin.sql`. Dibiarkan
  -- ada supaya database lama tidak pecah, tapi TIDAK dipakai lagi oleh
  -- aplikasi — masa aktif sekarang dibaca dari trial_ends_at /
  -- subscription_ends_at.
  add column if not exists valid_sampai         date,
  add column if not exists user_count           integer not null default 1;

comment on column public.companies.valid_sampai is
  'USANG sejak migrasi 0001. Dipakai trial_ends_at / subscription_ends_at.';

create unique index if not exists uq_companies_slug on public.companies (slug);
create index if not exists idx_companies_admin_email on public.companies (lower(admin_email));
create index if not exists idx_companies_status      on public.companies (status);

-- Status apotek dikunci constraint supaya salah ketik di panel Super Admin
-- ketahuan saat itu juga, bukan berminggu-minggu kemudian saat ada apotek yang
-- tidak bisa transaksi tanpa sebab yang jelas.
do $$
begin
  -- Data lama memakai 'aktif' / 'nonaktif'. Diseragamkan DULU, baru dikunci —
  -- urutan terbalik akan menolak migrasinya sendiri.
  update public.companies set status = 'active'   where status = 'aktif';
  update public.companies set status = 'inactive' where status = 'nonaktif';
  update public.companies set status = 'trial'    where status is null;

  if not exists (select 1 from pg_constraint where conname = 'companies_status_check') then
    alter table public.companies add constraint companies_status_check
      check (status in ('trial', 'active', 'suspended', 'inactive'));
  end if;
end $$;

-- ---------- riwayat langganan ----------
-- Tiap perubahan paket meninggalkan jejak. Tanpa ini, pertanyaan "kenapa apotek
-- ini turun paket bulan lalu" tidak punya jawaban selain ingatan orang.
create table if not exists public.subscription_events (id uuid primary key default gen_random_uuid());
alter table public.subscription_events
  add column if not exists company_id   uuid references public.companies(id) on delete cascade,
  add column if not exists action       text,   -- subscribe|upgrade|downgrade|renew|cancel|reactivate
  add column if not exists plan_id      uuid references public.plans(id),
  add column if not exists from_plan_id uuid references public.plans(id),
  add column if not exists amount       bigint,
  add column if not exists note         text,
  add column if not exists actor_email  text,
  add column if not exists created_at   timestamptz not null default now();
create index if not exists idx_sub_events_company on public.subscription_events (company_id, created_at desc);

-- ---------- jejak audit ----------
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid());
alter table public.audit_logs
  add column if not exists company_id  uuid references public.companies(id) on delete set null,
  add column if not exists actor_email text,
  add column if not exists action      text,
  add column if not exists entity      text,
  add column if not exists entity_id   text,
  add column if not exists detail      jsonb,
  add column if not exists created_at  timestamptz not null default now();
create index if not exists idx_audit_company on public.audit_logs (company_id, created_at desc);

-- ============================================================
-- LAPISAN APOTEK — semua tabel di bawah ini ber-company_id
-- ============================================================

-- ---------- profil apotek ----------
create table if not exists public.settings (id uuid primary key default gen_random_uuid());
alter table public.settings
  add column if not exists company_id    uuid,
  add column if not exists nama_apotek   text,
  add column if not exists sektor_usaha  text default 'Apotek',
  add column if not exists kota          text,
  add column if not exists alamat        text,
  add column if not exists nomor_ijin    text,          -- SIA
  add column if not exists nomor_telepon text,
  add column if not exists email         text,
  add column if not exists logo_url      text,
  add column if not exists nama_apoteker text,
  add column if not exists nomor_sipa    text,
  add column if not exists created_at    timestamptz not null default now();

-- ---------- anggota tim ----------
create table if not exists public.app_users (id uuid primary key default gen_random_uuid());
alter table public.app_users
  add column if not exists company_id uuid,
  add column if not exists nama       text,
  add column if not exists email      text,
  add column if not exists role       text not null default 'kasir',
  add column if not exists status     text not null default 'aktif',
  add column if not exists modules    jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default now();
create index if not exists idx_app_users_email on public.app_users (lower(email));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_users_role_check') then
    alter table public.app_users add constraint app_users_role_check
      check (role in ('pemilik', 'apoteker', 'asisten_apoteker', 'kasir', 'admin'));
  end if;
end $$;

-- ---------- katalog obat ----------
create table if not exists public.products (id uuid primary key default gen_random_uuid());
alter table public.products
  add column if not exists company_id   uuid,
  add column if not exists kode         text,
  add column if not exists nama_obat    text,
  add column if not exists nama_generik text,
  add column if not exists kandungan    text,
  add column if not exists kategori     text not null default 'bebas',
  add column if not exists satuan       text not null default 'Tablet',
  add column if not exists isi_kemasan  integer not null default 1,
  add column if not exists harga_beli   numeric not null default 0,
  add column if not exists harga_jual   numeric not null default 0,
  add column if not exists stok_total   integer not null default 0,
  add column if not exists stok_minimum integer not null default 10,
  add column if not exists status       text not null default 'aktif',
  add column if not exists created_at   timestamptz not null default now();
create index if not exists idx_products_nama on public.products (company_id, nama_obat);

-- Kode obat unik PER APOTEK, bukan unik global. Impor katalog dua apotek yang
-- kebetulan memakai kode yang sama tidak boleh saling menolak.
create unique index if not exists uq_products_kode_per_company
  on public.products (company_id, kode) where kode is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_kategori_check') then
    alter table public.products add constraint products_kategori_check
      check (kategori in ('bebas','bebas_terbatas','keras','psikotropika',
                          'narkotika','prekursor','suplemen','alkes','lainnya'));
  end if;
end $$;

-- ---------- pemasok ----------
create table if not exists public.suppliers (id uuid primary key default gen_random_uuid());
alter table public.suppliers
  add column if not exists company_id    uuid,
  add column if not exists kode          text,
  add column if not exists nama_supplier text,
  add column if not exists jenis         text not null default 'PBF',  -- PBF|Subdistributor|Lainnya
  add column if not exists alamat        text,
  add column if not exists telepon       text,
  add column if not exists email         text,
  add column if not exists status        text not null default 'aktif',
  add column if not exists created_at    timestamptz not null default now();
create unique index if not exists uq_suppliers_kode_per_company
  on public.suppliers (company_id, kode) where kode is not null;

create table if not exists public.product_suppliers (id uuid primary key default gen_random_uuid());
alter table public.product_suppliers
  add column if not exists company_id   uuid,
  add column if not exists product_id   uuid references public.products(id) on delete cascade,
  add column if not exists supplier_id  uuid references public.suppliers(id) on delete cascade,
  add column if not exists is_preferred boolean not null default false,
  add column if not exists created_at   timestamptz not null default now();
create unique index if not exists uq_product_supplier
  on public.product_suppliers (product_id, supplier_id);

-- ---------- pembelian ----------
create table if not exists public.purchase_orders (id uuid primary key default gen_random_uuid());
alter table public.purchase_orders
  add column if not exists company_id     uuid,
  add column if not exists nomor_po       text,
  add column if not exists supplier_id    uuid references public.suppliers(id),
  add column if not exists total_nilai    numeric not null default 0,
  add column if not exists catatan        text,
  add column if not exists status         text not null default 'draft',  -- draft|dikirim|selesai|dibatalkan
  add column if not exists tanggal_terima date,
  add column if not exists created_at     timestamptz not null default now();
create unique index if not exists uq_po_nomor_per_company
  on public.purchase_orders (company_id, nomor_po) where nomor_po is not null;

create table if not exists public.po_items (id uuid primary key default gen_random_uuid());
alter table public.po_items
  add column if not exists company_id  uuid,
  add column if not exists po_id       uuid references public.purchase_orders(id) on delete cascade,
  add column if not exists product_id  uuid references public.products(id),
  add column if not exists nama_produk text,
  add column if not exists satuan      text,
  add column if not exists qty_pesan   integer not null default 0,
  add column if not exists qty_terima  integer not null default 0,
  add column if not exists harga_beli  numeric not null default 0,
  add column if not exists subtotal    numeric not null default 0,
  add column if not exists created_at  timestamptz not null default now();
create index if not exists idx_po_items_po on public.po_items (po_id);

-- ---------- batch & kadaluarsa ----------
-- Inilah yang membedakan apotek dari toko biasa: obat yang sama bisa punya
-- beberapa batch dengan tanggal kadaluarsa berbeda, dan yang dilaporkan ke
-- BPOM adalah batch-nya, bukan produknya.
create table if not exists public.product_batches (id uuid primary key default gen_random_uuid());
alter table public.product_batches
  add column if not exists company_id   uuid,
  add column if not exists product_id   uuid references public.products(id) on delete cascade,
  add column if not exists po_id        uuid references public.purchase_orders(id),
  add column if not exists batch_number text,
  add column if not exists expired_date date,
  add column if not exists stok_batch   integer not null default 0,
  add column if not exists created_at   timestamptz not null default now();
create index if not exists idx_batches_product on public.product_batches (product_id);
create index if not exists idx_batches_expired on public.product_batches (company_id, expired_date);

-- ---------- faktur pembelian ----------
create table if not exists public.faktur (id uuid primary key default gen_random_uuid());
alter table public.faktur
  add column if not exists company_id          uuid,
  add column if not exists nomor_faktur        text,
  add column if not exists po_id               uuid references public.purchase_orders(id),
  add column if not exists supplier_id         uuid references public.suppliers(id),
  add column if not exists tanggal_faktur      date not null default current_date,
  add column if not exists term_of_payment     integer not null default 30,
  add column if not exists tanggal_jatuh_tempo date,
  add column if not exists total               numeric not null default 0,
  add column if not exists status              text not null default 'belum_bayar',
  add column if not exists tanggal_bayar       date,
  add column if not exists metode_bayar        text,
  add column if not exists catatan_bayar       text,
  add column if not exists created_at          timestamptz not null default now();
create index if not exists idx_faktur_jatuh_tempo on public.faktur (company_id, tanggal_jatuh_tempo);
create index if not exists idx_faktur_status      on public.faktur (company_id, status);

-- ---------- layanan jasa ----------
create table if not exists public.services (id uuid primary key default gen_random_uuid());
alter table public.services
  add column if not exists company_id uuid,
  add column if not exists nama       text,
  add column if not exists harga      numeric not null default 0,
  add column if not exists deskripsi  text,
  add column if not exists status     text not null default 'aktif',
  add column if not exists created_at timestamptz not null default now();

-- ---------- penjualan ----------
create table if not exists public.transactions (id uuid primary key default gen_random_uuid());
alter table public.transactions
  add column if not exists company_id      uuid,
  add column if not exists nomor_transaksi text,
  add column if not exists total           numeric not null default 0,
  add column if not exists bayar           numeric not null default 0,
  add column if not exists kembalian       numeric not null default 0,
  add column if not exists metode_bayar    text default 'Tunai',
  add column if not exists status          text not null default 'selesai',  -- selesai|dibatalkan
  -- Empat kolom di bawah diisi hanya untuk transaksi resep atau obat golongan.
  -- Wajib untuk SIPNAP.
  add column if not exists nama_pasien     text,
  add column if not exists alamat_pasien   text,
  add column if not exists kontak_pasien   text,
  add column if not exists nomor_resep     text,
  add column if not exists created_at      timestamptz not null default now();
create index if not exists idx_trx_company_created on public.transactions (company_id, created_at desc);
create unique index if not exists uq_trx_nomor_per_company
  on public.transactions (company_id, nomor_transaksi) where nomor_transaksi is not null;

create table if not exists public.transaction_items (id uuid primary key default gen_random_uuid());
alter table public.transaction_items
  add column if not exists company_id     uuid,
  add column if not exists transaction_id uuid references public.transactions(id) on delete cascade,
  -- boleh null: baris layanan jasa tidak menunjuk produk mana pun
  add column if not exists product_id     uuid references public.products(id),
  add column if not exists nama_obat      text,
  add column if not exists harga_jual     numeric not null default 0,
  add column if not exists jumlah         integer not null default 0,
  add column if not exists subtotal       numeric not null default 0,
  add column if not exists created_at     timestamptz not null default now();
create index if not exists idx_trx_items_trx on public.transaction_items (transaction_id);
alter table public.transaction_items alter column product_id drop not null;

-- ---------- tindak lanjut barang kadaluarsa ----------
create table if not exists public.pemusnahan (id uuid primary key default gen_random_uuid());
alter table public.pemusnahan
  add column if not exists company_id        uuid,
  add column if not exists nomor_ba          text,
  add column if not exists batch_id          uuid references public.product_batches(id),
  add column if not exists product_id        uuid references public.products(id),
  add column if not exists tanggal_musnahkan date not null default current_date,
  add column if not exists qty_musnahkan     integer not null default 0,
  add column if not exists metode            text,
  add column if not exists saksi_1           text,
  add column if not exists saksi_2           text,
  add column if not exists keterangan        text,
  add column if not exists created_at        timestamptz not null default now();

create table if not exists public.retur_supplier (id uuid primary key default gen_random_uuid());
alter table public.retur_supplier
  add column if not exists company_id    uuid,
  add column if not exists nomor_retur   text,
  add column if not exists batch_id      uuid references public.product_batches(id),
  add column if not exists product_id    uuid references public.products(id),
  add column if not exists supplier_id   uuid references public.suppliers(id),
  add column if not exists qty_retur     integer not null default 0,
  add column if not exists tanggal_retur date not null default current_date,
  add column if not exists alasan        text,
  add column if not exists status        text not null default 'diajukan',
  add column if not exists created_at    timestamptz not null default now();

-- Nomor BA dan nomor retur unik PER APOTEK. Versi lama memasang `unique` global,
-- sehingga apotek kedua yang memusnahkan obat di tahun yang sama akan ditolak
-- karena nomor BA/2026/0001 sudah dipakai apotek lain. Batasan lama dilepas
-- dulu — kalau tidak, yang global tetap berlaku dan penggantinya percuma.
do $$
declare r record;
begin
  for r in
    select conname, conrelid::regclass::text as tabel
    from pg_constraint
    where contype = 'u'
      and conrelid in ('public.pemusnahan'::regclass, 'public.retur_supplier'::regclass)
  loop
    execute format('alter table %s drop constraint %I', r.tabel, r.conname);
  end loop;
end $$;

create unique index if not exists uq_pemusnahan_nomor_per_company
  on public.pemusnahan (company_id, nomor_ba) where nomor_ba is not null;
create unique index if not exists uq_retur_nomor_per_company
  on public.retur_supplier (company_id, nomor_retur) where nomor_retur is not null;

comment on table public.plans is 'Paket langganan Sehatera. Harga dan batas diubah lewat Super Admin, bukan lewat deploy.';
comment on table public.companies is 'Satu baris = satu apotek berlangganan. Semua tabel ber-company_id mengacu ke sini.';
