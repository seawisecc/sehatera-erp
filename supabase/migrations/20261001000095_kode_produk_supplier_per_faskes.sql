-- ============================================================
-- 0095  Kode produk dan supplier per faskes
-- ============================================================
--
-- Dua kesalahan yang sama bentuknya, pada dua tabel, ditemukan 1 Oktober 2026:
--
-- 1. UNIK DI SELURUH DATABASE. `products_kode_key` dan `suppliers_kode_key`
--    (dari folder sql/ lama) membuat dua faskes tidak bisa memakai kode yang
--    sama. Klinik baru yang mengimpor katalog berkode "OB-001" ditolak
--    karena faskes LAIN sudah memakai OB-001, dan pesannya tidak menyebut
--    faskes lain sama sekali. Produk sudah punya indeks per faskes
--    (`uq_products_kode_per_company`); supplier belum.
--
-- 2. SATU DERET NOMOR UNTUK SEMUA FASKES. `generate_kode_produk()` dan
--    `generate_kode_supplier()` mengambil nextval() dari sequence bersama,
--    jadi produk pertama Apotek Rexco Renon bernomor OBT-0020 dan supplier
--    pertama Apotek Sejahtera SUP-0034. Kesalahan yang sama dengan penomoran
--    dokumen sebelum 0085, dan triggernya juga berjalan SEBELUM
--    trg_set_company_id karena "s" mendahului "t".
--
-- Kode otomatis yang SUDAH ada (OBT-angka, SUP-angka) dinomori ulang per
-- faskes menurut urutan dibuat: semua pengguna saat ini masih uji coba dan
-- belum ada label yang tercetak (keputusan pemilik). Kode yang diketik
-- tangan (OB-001, PBF-01, PRD-1005) tidak disentuh. Tidak ada tabel lain yang
-- menyimpan salinan kode ini; semua relasi ke produk dan supplier lewat id.

-- ── 1. Keunikan per faskes, bukan sedunia ────────────────────────────────
alter table public.products  drop constraint if exists products_kode_key;
alter table public.suppliers drop constraint if exists suppliers_kode_key;
drop index if exists public.products_kode_key;
drop index if exists public.suppliers_kode_key;

create unique index if not exists uq_suppliers_kode_per_company
  on public.suppliers (company_id, kode) where kode is not null;

-- ── 2. Nomor berikutnya per faskes ───────────────────────────────────────
-- Dicabut dari authenticated: memanggilnya dengan id faskes lain memberi tahu
-- berapa produk yang mereka punya (alasan yang sama dengan company_usage).
-- Pemanggilnya hanya fungsi trigger di bawah, yang security definer.
create or replace function public.kode_berikut(p_company uuid, p_tabel text, p_awalan text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n integer;
begin
  if p_company is null then
    raise exception 'Kode tidak bisa dibuat tanpa faskes.' using errcode = 'SH004';
  end if;
  if p_tabel not in ('products', 'suppliers') then
    raise exception 'Tabel tidak dikenal untuk penomoran kode.' using errcode = 'SH004';
  end if;

  -- Dua orang yang menyimpan pada detik yang sama berbaris di sini, jadi yang
  -- kedua membaca max() SESUDAH yang pertama tertulis. Pola next_doc_number.
  perform pg_advisory_xact_lock(hashtextextended(p_company::text || ':kode:' || p_tabel, 0));

  execute format(
    'select coalesce(max(substring(kode from %L)::integer), 0) + 1
       from public.%I where company_id = $1 and kode ~ %L',
    '^' || p_awalan || '-([0-9]+)$', p_tabel, '^' || p_awalan || '-[0-9]+$')
  into v_n using p_company;

  return p_awalan || '-' || lpad(v_n::text, 4, '0');
end;
$$;

revoke all on function public.kode_berikut(uuid, text, text) from public, anon, authenticated;

create or replace function public.generate_kode_produk()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.kode := public.kode_berikut(new.company_id, 'products', 'OBT');
  return new;
end;
$$;

create or replace function public.generate_kode_supplier()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.kode := public.kode_berikut(new.company_id, 'suppliers', 'SUP');
  return new;
end;
$$;

-- `trg_z_`: harus berjalan SESUDAH trg_set_company_id, yang mengisi faskesnya.
-- Kode kosong ('') juga diberi nomor: formulir yang mengirim string kosong
-- akan bertabrakan di indeks unik pada baris kosong kedua.
drop trigger if exists set_kode_produk on public.products;
drop trigger if exists trg_z_kode_produk on public.products;
create trigger trg_z_kode_produk
  before insert on public.products
  for each row when (coalesce(trim(new.kode), '') = '')
  execute function public.generate_kode_produk();

drop trigger if exists set_kode_supplier on public.suppliers;
drop trigger if exists trg_z_kode_supplier on public.suppliers;
create trigger trg_z_kode_supplier
  before insert on public.suppliers
  for each row when (coalesce(trim(new.kode), '') = '')
  execute function public.generate_kode_supplier();

-- Deret lama tidak dipakai siapa pun lagi. Dibiarkan berarti tempat yang
-- salah untuk ditemukan orang berikutnya.
drop sequence if exists public.product_kode_seq;
drop sequence if exists public.supplier_kode_seq;

-- ── 3. Menomori ulang kode otomatis yang sudah ada ───────────────────────
-- Dua langkah: ke nama sementara dulu, supaya OBT-0001 baru tidak bertabrakan
-- dengan OBT-0001 lama milik baris lain di faskes yang sama.
update public.products set kode = 'SEMENTARA-' || id::text where kode ~ '^OBT-[0-9]+$';
update public.products p set kode = x.baru
  from (select id, 'OBT-' || lpad(row_number() over (partition by company_id order by created_at, id)::text, 4, '0') baru
          from public.products where kode like 'SEMENTARA-%') x
 where p.id = x.id;

update public.suppliers set kode = 'SEMENTARA-' || id::text where kode ~ '^SUP-[0-9]+$';
update public.suppliers s set kode = x.baru
  from (select id, 'SUP-' || lpad(row_number() over (partition by company_id order by created_at, id)::text, 4, '0') baru
          from public.suppliers where kode like 'SEMENTARA-%') x
 where s.id = x.id;
