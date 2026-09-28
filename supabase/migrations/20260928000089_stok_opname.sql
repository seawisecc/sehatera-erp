-- ============================================================
-- 0089  Stok opname
-- ============================================================
--
-- Sampai sekarang Sehatera tidak punya jalan resmi membetulkan stok yang
-- berbeda dari fisiknya. Komentar di migrasi 0009 bahkan menyuruh orang
-- "meluruskannya lewat stok opname", padahal fiturnya tidak ada. Jalan yang
-- tersisa adalah menyunting angka stok produk langsung dari layar Produk:
-- tanpa alasan, tanpa jejak, tanpa menyentuh stok batch, dan tanpa muncul di
-- SIPNAP. Untuk narkotika dan psikotropika itu selisih yang ditandatangani
-- apoteker tanpa ada catatannya.
--
-- Bentuknya:
--
--   stock_opnames        kepala: nomor OPN/2026/0001, cakupan, status
--   stock_opname_items   satu baris per BATCH: stok sistem saat opname
--                        dimulai, stok fisik hasil hitung, selisih, alasan
--
-- Aturan yang ditegakkan DI SINI, bukan di layar:
--
--   - Satu opname draf per faskes. Dua opname yang terbuka bersamaan atas
--     batch yang sama menyesuaikannya dua kali.
--   - Semua baris wajib dihitung sebelum difinalkan. Baris yang terlewat
--     bukan "tidak berubah", ia "tidak tahu".
--   - Selisih wajib beralasan. Selisih tanpa alasan adalah persis hal yang
--     hendak dihentikan fitur ini.
--   - Yang memfinalkan hanya pemilik, admin, dan apoteker (stok.opname.final).
--     Asisten apoteker boleh menghitung, tidak boleh menandatangani.
--
-- **Penyesuaiannya RELATIF**: stok batch sekarang + selisih, bukan ditimpa
-- dengan angka fisik. Kalau ada penjualan di antara mulai dan final, menimpa
-- akan menghapusnya, kesalahan yang persis sama dengan penerimaan barang
-- sebelum migrasi 0010. Kalau hasilnya minus (stok sudah turun lebih jauh
-- daripada yang dihitung), finalnya DITOLAK dengan nama batchnya, bukan
-- dibulatkan ke nol diam-diam.
--
-- Tabelnya hanya bisa DIBACA dari peramban (policy select saja). Seluruh
-- penulisan lewat empat fungsi di bawah, karena RLS menyaring baris, bukan
-- kolom: policy tulis apa pun akan mengizinkan orang mengisi `status` =
-- 'final' tanpa stoknya ikut disesuaikan.

-- ── Tabel ───────────────────────────────────────────────────────────────
create table if not exists public.stock_opnames (
  id uuid primary key default gen_random_uuid()
);
alter table public.stock_opnames add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_opnames add column if not exists nomor text;
alter table public.stock_opnames add column if not exists tanggal date not null default current_date;
alter table public.stock_opnames add column if not exists kategori text;
alter table public.stock_opnames add column if not exists catatan text;
alter table public.stock_opnames add column if not exists status text not null default 'draf';
alter table public.stock_opnames add column if not exists dibuat_oleh text;
alter table public.stock_opnames add column if not exists dibuat_pada timestamptz not null default now();
alter table public.stock_opnames add column if not exists difinalkan_oleh text;
alter table public.stock_opnames add column if not exists difinalkan_pada timestamptz;
alter table public.stock_opnames add column if not exists alasan_batal text;

alter table public.stock_opnames drop constraint if exists stock_opnames_status_check;
alter table public.stock_opnames add constraint stock_opnames_status_check
  check (status in ('draf', 'final', 'batal'));

create index if not exists idx_stock_opnames_company on public.stock_opnames (company_id, dibuat_pada desc);
create unique index if not exists uq_stock_opnames_nomor on public.stock_opnames (company_id, nomor) where nomor is not null;
-- Satu draf per faskes.
create unique index if not exists uq_stock_opnames_satu_draf on public.stock_opnames (company_id) where status = 'draf';

create table if not exists public.stock_opname_items (
  id uuid primary key default gen_random_uuid()
);
alter table public.stock_opname_items add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_opname_items add column if not exists opname_id uuid references public.stock_opnames(id) on delete cascade;
alter table public.stock_opname_items add column if not exists product_id uuid references public.products(id);
-- null berarti stok produk yang tidak tercatat di batch mana pun.
alter table public.stock_opname_items add column if not exists batch_id uuid references public.product_batches(id);
alter table public.stock_opname_items add column if not exists stok_sistem integer not null default 0;
alter table public.stock_opname_items add column if not exists stok_fisik integer;
alter table public.stock_opname_items add column if not exists alasan text;
alter table public.stock_opname_items add column if not exists catatan text;
alter table public.stock_opname_items add column if not exists selisih integer
  generated always as (stok_fisik - stok_sistem) stored;

alter table public.stock_opname_items drop constraint if exists stock_opname_items_fisik_check;
alter table public.stock_opname_items add constraint stock_opname_items_fisik_check
  check (stok_fisik is null or stok_fisik >= 0);

create index if not exists idx_stock_opname_items_opname  on public.stock_opname_items (opname_id);
create index if not exists idx_stock_opname_items_product on public.stock_opname_items (product_id);
create index if not exists idx_stock_opname_items_company on public.stock_opname_items (company_id);

-- ── RLS dan hak Data API (aturan sejak 0082: ditulis, bukan diberikan) ────
alter table public.stock_opnames      enable row level security;
alter table public.stock_opname_items enable row level security;

drop policy if exists tenant_baca on public.stock_opnames;
create policy tenant_baca on public.stock_opnames for select
  using (company_id = public.auth_company_id() or public.is_super_admin());

drop policy if exists tenant_baca on public.stock_opname_items;
create policy tenant_baca on public.stock_opname_items for select
  using (company_id = public.auth_company_id() or public.is_super_admin());

grant select, insert, update, delete on public.stock_opnames      to authenticated, service_role;
grant select, insert, update, delete on public.stock_opname_items to authenticated, service_role;

-- ── Hak: dua kapabilitas baru di matriks yang SATU ─────────────────────
-- Disulam ke definisi boleh() yang sedang berlaku, sama seperti 0081, lalu
-- diperiksa ulang. lib/hak.ts memegang salinannya untuk menyembunyikan tombol.
do $$
declare
  v_def  text;
  v_baru text;
  v_jangkar text := $j$        when 'kunjungan.siap_tagih' then peran in ('pemilik','admin','dokter','perawat')$j$;
begin
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('stok.opname' in v_def) > 0 then
    return;  -- sudah terpasang
  end if;
  if position(v_jangkar in v_def) = 0 then
    raise exception 'Jangkar boleh() tidak ditemukan; migrasi 0089 dibatalkan.';
  end if;
  v_baru := replace(v_def, v_jangkar, v_jangkar || E'\n' ||
    $j$        when 'stok.opname'       then peran in ('pemilik','admin','apoteker','asisten_apoteker')$j$ || E'\n' ||
    $j$        when 'stok.opname.final' then peran in ('pemilik','admin','apoteker')$j$);
  execute v_baru;
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('stok.opname.final' in v_def) = 0 then
    raise exception 'boleh() tidak memuat stok.opname.final sesudah disulam; migrasi 0089 dibatalkan.';
  end if;
end $$;

-- ── buat_opname ─────────────────────────────────────────────────────────
create or replace function public.buat_opname(
  p_kategori text default null,
  p_catatan  text default null,
  p_company  uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_co  uuid := case when p_company is not null and v_adm then p_company else public.auth_company_id() end;
  v_id  uuid;
  v_no  text;
  v_n   integer;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.opname');

  if exists (select 1 from public.stock_opnames where company_id = v_co and status = 'draf') then
    raise exception 'Masih ada opname yang belum selesai. Finalkan atau batalkan dulu yang itu.'
      using errcode = 'SH004';
  end if;

  v_no := public.next_doc_number(v_co, 'stock_opnames', 'nomor', 'OPN', to_char(current_date, 'YYYY'));

  begin
    insert into public.stock_opnames (company_id, nomor, kategori, catatan, dibuat_oleh)
    values (v_co, v_no, nullif(trim(p_kategori), ''), nullif(trim(p_catatan), ''),
            coalesce(auth.jwt() ->> 'email', 'sistem'))
    returning id into v_id;
  exception when unique_violation then
    -- Dua orang menekan Mulai bersamaan: yang kedua menabrak indeks satu-draf.
    raise exception 'Masih ada opname yang belum selesai. Finalkan atau batalkan dulu yang itu.'
      using errcode = 'SH004';
  end;

  -- Satu baris per batch yang masih berisi.
  insert into public.stock_opname_items (company_id, opname_id, product_id, batch_id, stok_sistem)
  select v_co, v_id, b.product_id, b.id, b.stok_batch
    from public.product_batches b
    join public.products p on p.id = b.product_id
   where b.company_id = v_co and b.stok_batch > 0
     and coalesce(p.status, 'aktif') = 'aktif'
     and (nullif(trim(p_kategori), '') is null or p.kategori = trim(p_kategori));

  -- Stok produk yang tidak tercatat di batch mana pun tetap harus dihitung,
  -- kalau tidak ia tidak pernah bisa dibetulkan.
  insert into public.stock_opname_items (company_id, opname_id, product_id, batch_id, stok_sistem)
  select v_co, v_id, p.id, null, coalesce(p.stok_total, 0) - coalesce(s.jml, 0)
    from public.products p
    left join (select product_id, sum(stok_batch) as jml
                 from public.product_batches
                where company_id = v_co and stok_batch > 0
                group by product_id) s on s.product_id = p.id
   where p.company_id = v_co
     and coalesce(p.status, 'aktif') = 'aktif'
     and (nullif(trim(p_kategori), '') is null or p.kategori = trim(p_kategori))
     and coalesce(p.stok_total, 0) - coalesce(s.jml, 0) > 0;

  select count(*) into v_n from public.stock_opname_items where opname_id = v_id;
  if v_n = 0 then
    raise exception 'Tidak ada stok yang bisa dihitung pada cakupan itu.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_co, 'opname.buat', 'stock_opnames', v_id::text,
    jsonb_build_object('nomor', v_no, 'kategori', p_kategori, 'baris', v_n));

  return jsonb_build_object('id', v_id, 'nomor', v_no, 'baris', v_n);
end;
$$;

-- ── simpan_hitung_opname ───────────────────────────────────────────────
-- p_baris: [{ "id": uuid, "stok_fisik": int|null, "alasan": text, "catatan": text }]
create or replace function public.simpan_hitung_opname(p_opname uuid, p_baris jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_op  record;
  v_el  jsonb;
  v_fis integer;
  v_n   integer := 0;
begin
  select * into v_op from public.stock_opnames
   where id = p_opname and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Opname tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_op.status <> 'draf' then
    raise exception 'Opname % sudah %, hitungannya tidak bisa diubah lagi.', v_op.nomor, v_op.status
      using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.opname');

  for v_el in select * from jsonb_array_elements(coalesce(p_baris, '[]'::jsonb)) loop
    v_fis := case when v_el ? 'stok_fisik' and jsonb_typeof(v_el -> 'stok_fisik') <> 'null'
                  then (v_el ->> 'stok_fisik')::integer end;
    if v_fis is not null and v_fis < 0 then
      raise exception 'Stok fisik tidak boleh kurang dari nol.' using errcode = 'SH004';
    end if;
    update public.stock_opname_items
       set stok_fisik = v_fis,
           alasan     = nullif(trim(v_el ->> 'alasan'), ''),
           catatan    = nullif(trim(v_el ->> 'catatan'), '')
     where id = (v_el ->> 'id')::uuid and opname_id = p_opname;
    if found then v_n := v_n + 1; end if;
  end loop;

  return v_n;
end;
$$;

-- ── finalkan_opname ────────────────────────────────────────────────────
create or replace function public.finalkan_opname(p_opname uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_op    record;
  v_it    record;
  v_stok  integer;
  v_belum integer;
  v_tanpa integer;
  v_tambah integer := 0;
  v_kurang integer := 0;
  v_ubah  integer := 0;
begin
  select * into v_op from public.stock_opnames
   where id = p_opname and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Opname tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_op.status <> 'draf' then
    raise exception 'Opname % sudah %.', v_op.nomor, v_op.status using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.opname.final');

  select count(*) filter (where stok_fisik is null),
         count(*) filter (where stok_fisik is not null and selisih <> 0 and coalesce(trim(alasan), '') = '')
    into v_belum, v_tanpa
    from public.stock_opname_items where opname_id = p_opname;
  if v_belum > 0 then
    raise exception 'Masih ada % baris yang belum dihitung. Baris yang terlewat bukan berarti tidak berubah.', v_belum
      using errcode = 'SH004';
  end if;
  if v_tanpa > 0 then
    raise exception '% baris punya selisih tanpa alasan. Isi alasannya dulu: rusak, hilang, kedaluwarsa, salah catat, atau lainnya.', v_tanpa
      using errcode = 'SH004';
  end if;

  -- Diurutkan supaya dua proses yang mengunci batch yang sama selalu
  -- berbaris dalam urutan yang sama, bukan saling menunggu.
  for v_it in
    select i.*, p.nama_obat, b.batch_number
      from public.stock_opname_items i
      join public.products p on p.id = i.product_id
      left join public.product_batches b on b.id = i.batch_id
     where i.opname_id = p_opname and i.selisih <> 0
     order by i.product_id, i.batch_id nulls last
  loop
    if v_it.batch_id is not null then
      select stok_batch into v_stok from public.product_batches where id = v_it.batch_id for update;
      if v_stok + v_it.selisih < 0 then
        raise exception 'Stok % batch % sekarang %, dan selisih % membuatnya minus. Stoknya berubah sejak opname dimulai; hitung ulang baris itu.',
          v_it.nama_obat, coalesce(v_it.batch_number, '-'), v_stok, v_it.selisih
          using errcode = 'SH005';
      end if;
      update public.product_batches set stok_batch = stok_batch + v_it.selisih where id = v_it.batch_id;
    end if;

    update public.products
       set stok_total = greatest(0, coalesce(stok_total, 0) + v_it.selisih)
     where id = v_it.product_id and company_id = v_op.company_id;

    v_ubah := v_ubah + 1;
    if v_it.selisih > 0 then v_tambah := v_tambah + v_it.selisih;
    else v_kurang := v_kurang - v_it.selisih; end if;
  end loop;

  update public.stock_opnames
     set status = 'final',
         difinalkan_oleh = coalesce(auth.jwt() ->> 'email', 'sistem'),
         difinalkan_pada = now()
   where id = p_opname;

  perform public.catat_audit(v_op.company_id, 'opname.final', 'stock_opnames', p_opname::text,
    jsonb_build_object('nomor', v_op.nomor, 'baris_berubah', v_ubah,
                       'bertambah', v_tambah, 'berkurang', v_kurang));

  return jsonb_build_object('nomor', v_op.nomor, 'baris_berubah', v_ubah,
                            'bertambah', v_tambah, 'berkurang', v_kurang);
end;
$$;

-- ── batal_opname ───────────────────────────────────────────────────────
create or replace function public.batal_opname(p_opname uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_op  record;
begin
  select * into v_op from public.stock_opnames
   where id = p_opname and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Opname tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_op.status <> 'draf' then
    raise exception 'Hanya opname draf yang bisa dibatalkan. Opname final sudah mengubah stok; betulkan lewat opname berikutnya.'
      using errcode = 'SH004';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Tulis alasan pembatalannya.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.opname');

  update public.stock_opnames set status = 'batal', alasan_batal = trim(p_alasan) where id = p_opname;
  perform public.catat_audit(v_op.company_id, 'opname.batal', 'stock_opnames', p_opname::text,
    jsonb_build_object('nomor', v_op.nomor, 'alasan', trim(p_alasan)));
end;
$$;

revoke all on function public.buat_opname(text, text, uuid)          from public, anon;
revoke all on function public.simpan_hitung_opname(uuid, jsonb)      from public, anon;
revoke all on function public.finalkan_opname(uuid)                  from public, anon;
revoke all on function public.batal_opname(uuid, text)               from public, anon;
grant execute on function public.buat_opname(text, text, uuid)       to authenticated;
grant execute on function public.simpan_hitung_opname(uuid, jsonb)   to authenticated;
grant execute on function public.finalkan_opname(uuid)               to authenticated;
grant execute on function public.batal_opname(uuid, text)            to authenticated;
