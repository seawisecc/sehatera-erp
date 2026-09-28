-- ============================================================
-- 0092  Transfer stok antar outlet
-- ============================================================
--
-- Multi-outlet ada sejak 0062, tapi memindahkan obat dari satu cabang ke
-- cabang lain tidak punya jalan. Yang terjadi di lapangan: dicatat sebagai
-- penjualan di cabang A (kepada "cabang B") dan penerimaan PO di cabang B,
-- jadi omzet A naik palsu, B mencatat pembelian yang tidak pernah dibayar,
-- dan untuk narkotika SIPNAP kedua outlet salah.
--
-- Tiap outlet punya KATALOGNYA SENDIRI, jadi "Paracetamol" di A dan di B
-- adalah dua baris products yang berbeda. Itu yang menentukan bentuknya:
--
--   kirim_transfer   di outlet PENGIRIM. Stok batch dan produk langsung
--                    berkurang (barang dalam perjalanan). Tiap baris
--                    menyimpan CUPLIKAN produk dan batchnya.
--   terima_transfer  di outlet PENERIMA. Produk dicocokkan: barcode, lalu
--                    kode KFA, lalu nama persis; kalau tidak ada, dibuat dari
--                    cuplikan (kuota paket tetap berlaku lewat trigger).
--                    Batch dengan nomor DAN kedaluwarsa sama digabung, aturan
--                    yang sama dengan receive_purchase_order (0010).
--   batal_transfer   di outlet pengirim, hanya selama belum diterima. Stok
--                    kembali ke batch asalnya, persis.
--
-- Kedua outlet wajib satu kelompok (company_groups). Tabelnya hanya
-- ber-policy SELECT; seluruh penulisan lewat fungsi, alasan yang sama dengan
-- opname (0089): policy tulis apa pun mengizinkan status 'diterima' tanpa
-- stoknya ikut bergerak.

create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid()
);
-- company_id = outlet PENGIRIM (penomoran dan RLS pengirim).
alter table public.stock_transfers add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_transfers add column if not exists ke_company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_transfers add column if not exists nomor text;
alter table public.stock_transfers add column if not exists status text not null default 'dikirim';
alter table public.stock_transfers add column if not exists catatan text;
alter table public.stock_transfers add column if not exists dibuat_oleh text;
alter table public.stock_transfers add column if not exists dibuat_pada timestamptz not null default now();
alter table public.stock_transfers add column if not exists diterima_oleh text;
alter table public.stock_transfers add column if not exists diterima_pada timestamptz;
alter table public.stock_transfers add column if not exists alasan_batal text;

alter table public.stock_transfers drop constraint if exists stock_transfers_status_check;
alter table public.stock_transfers add constraint stock_transfers_status_check check (status in ('dikirim', 'diterima', 'batal'));
alter table public.stock_transfers drop constraint if exists stock_transfers_beda_outlet;
alter table public.stock_transfers add constraint stock_transfers_beda_outlet check (company_id <> ke_company_id);

create unique index if not exists uq_stock_transfers_nomor on public.stock_transfers (company_id, nomor) where nomor is not null;
create index if not exists idx_stock_transfers_dari on public.stock_transfers (company_id, dibuat_pada desc);
create index if not exists idx_stock_transfers_ke   on public.stock_transfers (ke_company_id, dibuat_pada desc);

create table if not exists public.stock_transfer_items (
  id uuid primary key default gen_random_uuid()
);
alter table public.stock_transfer_items add column if not exists transfer_id uuid references public.stock_transfers(id) on delete cascade;
alter table public.stock_transfer_items add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_transfer_items add column if not exists ke_company_id uuid references public.companies(id) on delete cascade;
alter table public.stock_transfer_items add column if not exists dari_product_id uuid references public.products(id);
alter table public.stock_transfer_items add column if not exists dari_batch_id uuid references public.product_batches(id);
alter table public.stock_transfer_items add column if not exists ke_product_id uuid references public.products(id);
alter table public.stock_transfer_items add column if not exists ke_batch_id uuid references public.product_batches(id);
alter table public.stock_transfer_items add column if not exists qty integer not null default 0;
-- Cuplikan: yang dikirim, bukan yang tertulis di katalog pengirim minggu depan.
alter table public.stock_transfer_items add column if not exists nama_obat text;
alter table public.stock_transfer_items add column if not exists kategori text;
alter table public.stock_transfer_items add column if not exists satuan text;
alter table public.stock_transfer_items add column if not exists barcode text;
alter table public.stock_transfer_items add column if not exists kode_kfa text;
alter table public.stock_transfer_items add column if not exists isi_kemasan integer;
alter table public.stock_transfer_items add column if not exists harga_beli integer;
alter table public.stock_transfer_items add column if not exists harga_jual integer;
alter table public.stock_transfer_items add column if not exists batch_number text;
alter table public.stock_transfer_items add column if not exists expired_date date;

alter table public.stock_transfer_items drop constraint if exists stock_transfer_items_qty_check;
alter table public.stock_transfer_items add constraint stock_transfer_items_qty_check check (qty > 0);

create index if not exists idx_stock_transfer_items_transfer on public.stock_transfer_items (transfer_id);
create index if not exists idx_stock_transfer_items_dari     on public.stock_transfer_items (dari_product_id);
create index if not exists idx_stock_transfer_items_ke       on public.stock_transfer_items (ke_product_id);

alter table public.stock_transfers      enable row level security;
alter table public.stock_transfer_items enable row level security;

drop policy if exists dua_outlet_baca on public.stock_transfers;
create policy dua_outlet_baca on public.stock_transfers for select
  using (company_id = public.auth_company_id() or ke_company_id = public.auth_company_id() or public.is_super_admin());
drop policy if exists dua_outlet_baca on public.stock_transfer_items;
create policy dua_outlet_baca on public.stock_transfer_items for select
  using (company_id = public.auth_company_id() or ke_company_id = public.auth_company_id() or public.is_super_admin());

grant select, insert, update, delete on public.stock_transfers      to authenticated, service_role;
grant select, insert, update, delete on public.stock_transfer_items to authenticated, service_role;

-- ── Hak ─────────────────────────────────────────────────────────────────
do $$
declare
  v_def text;
  v_jangkar text := $j$        when 'kasir.setoran'     then peran in ('pemilik','admin')$j$;
begin
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('stok.transfer' in v_def) > 0 then return; end if;
  if position(v_jangkar in v_def) = 0 then
    raise exception 'Jangkar boleh() tidak ditemukan; migrasi 0092 dibatalkan.';
  end if;
  execute replace(v_def, v_jangkar, v_jangkar || E'\n' ||
    $j$        when 'stok.transfer'     then peran in ('pemilik','admin','apoteker')$j$);
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('stok.transfer' in v_def) = 0 then
    raise exception 'boleh() tidak memuat stok.transfer; migrasi 0092 dibatalkan.';
  end if;
end $$;

-- ── kirim_transfer ──────────────────────────────────────────────────────
-- p_baris: [{ "batch_id": uuid, "qty": int }]
create or replace function public.kirim_transfer(
  p_ke uuid, p_baris jsonb, p_catatan text default null, p_dari uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm  boolean := public.boleh_admin_platform();
  v_co   uuid := case when p_dari is not null and v_adm then p_dari else public.auth_company_id() end;
  v_asal record;
  v_ke   record;
  v_id   uuid;
  v_no   text;
  v_el   jsonb;
  v_qty  integer;
  v_b    record;
  v_n    integer := 0;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.transfer');

  select * into v_asal from public.companies where id = v_co and deleted_at is null;
  select * into v_ke   from public.companies where id = p_ke and deleted_at is null;
  if v_ke.id is null or v_ke.id = v_co or v_asal.group_id is null or v_ke.group_id is distinct from v_asal.group_id then
    raise exception 'Tujuan transfer harus outlet lain dalam kelompok yang sama.' using errcode = 'SH004';
  end if;
  if jsonb_array_length(coalesce(p_baris, '[]'::jsonb)) = 0 then
    raise exception 'Pilih paling tidak satu batch untuk dikirim.' using errcode = 'SH004';
  end if;

  v_no := public.next_doc_number(v_co, 'stock_transfers', 'nomor', 'TRF', to_char(current_date, 'YYYY'));
  insert into public.stock_transfers (company_id, ke_company_id, nomor, catatan, dibuat_oleh)
  values (v_co, p_ke, v_no, nullif(trim(p_catatan), ''), coalesce(auth.jwt() ->> 'email', 'sistem'))
  returning id into v_id;

  for v_el in select * from jsonb_array_elements(p_baris) loop
    v_qty := (v_el ->> 'qty')::integer;
    select b.*, p.nama_obat, p.kategori, p.satuan, p.barcode, p.kode_kfa, p.isi_kemasan,
           p.harga_beli as p_harga_beli, p.harga_jual
      into v_b
      from public.product_batches b join public.products p on p.id = b.product_id
     where b.id = (v_el ->> 'batch_id')::uuid and b.company_id = v_co
     for update of b;
    if not found then
      raise exception 'Batch tidak ditemukan di outlet ini.' using errcode = 'SH004';
    end if;
    if coalesce(v_qty, 0) <= 0 then
      raise exception 'Jumlah transfer % harus lebih dari nol.', v_b.nama_obat using errcode = 'SH004';
    end if;
    if v_qty > v_b.stok_batch then
      raise exception 'Batch % % hanya berisi %, tidak bisa mengirim %.', v_b.nama_obat, coalesce(v_b.batch_number, '-'), v_b.stok_batch, v_qty
        using errcode = 'SH005';
    end if;

    update public.product_batches set stok_batch = stok_batch - v_qty where id = v_b.id;
    update public.products set stok_total = greatest(0, coalesce(stok_total, 0) - v_qty) where id = v_b.product_id;

    insert into public.stock_transfer_items (
      transfer_id, company_id, ke_company_id, dari_product_id, dari_batch_id, qty,
      nama_obat, kategori, satuan, barcode, kode_kfa, isi_kemasan, harga_beli, harga_jual,
      batch_number, expired_date)
    values (
      v_id, v_co, p_ke, v_b.product_id, v_b.id, v_qty,
      v_b.nama_obat, v_b.kategori, v_b.satuan, v_b.barcode, v_b.kode_kfa, v_b.isi_kemasan,
      coalesce(v_b.harga_beli, v_b.p_harga_beli), v_b.harga_jual,
      v_b.batch_number, v_b.expired_date);
    v_n := v_n + 1;
  end loop;

  perform public.catat_audit(v_co, 'transfer.kirim', 'stock_transfers', v_id::text,
    jsonb_build_object('nomor', v_no, 'ke', v_ke.nama, 'baris', v_n));
  return jsonb_build_object('id', v_id, 'nomor', v_no, 'baris', v_n);
end;
$$;

-- ── terima_transfer ─────────────────────────────────────────────────────
create or replace function public.terima_transfer(p_transfer uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm  boolean := public.boleh_admin_platform();
  v_t    record;
  v_it   record;
  v_prod uuid;
  v_batch uuid;
  v_n    integer := 0;
  v_baru integer := 0;
begin
  select * into v_t from public.stock_transfers
   where id = p_transfer and (v_adm or ke_company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Transfer tidak ditemukan untuk outlet ini. Buka outlet penerimanya dulu.' using errcode = 'SH004';
  end if;
  if v_t.status <> 'dikirim' then
    raise exception 'Transfer % sudah %.', v_t.nomor, v_t.status using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.transfer');

  for v_it in select * from public.stock_transfer_items where transfer_id = p_transfer order by id loop
    -- Cocokkan produk di katalog penerima. Barcode dan KFA lebih dulu karena
    -- keduanya menyebut obat yang sama PERSIS; nama hanya kalau sama persis.
    v_prod := null;
    if v_it.barcode is not null then
      select id into v_prod from public.products
       where company_id = v_t.ke_company_id and barcode = v_it.barcode limit 1;
    end if;
    if v_prod is null and v_it.kode_kfa is not null then
      select id into v_prod from public.products
       where company_id = v_t.ke_company_id and kode_kfa = v_it.kode_kfa order by created_at limit 1;
    end if;
    if v_prod is null then
      select id into v_prod from public.products
       where company_id = v_t.ke_company_id and lower(trim(nama_obat)) = lower(trim(v_it.nama_obat))
       order by created_at limit 1;
    end if;
    if v_prod is null then
      insert into public.products (
        company_id, nama_obat, kategori, satuan, isi_kemasan, harga_beli, harga_jual,
        stok_total, stok_minimum, status, barcode, kode_kfa)
      values (
        v_t.ke_company_id, v_it.nama_obat, v_it.kategori, v_it.satuan, v_it.isi_kemasan,
        coalesce(v_it.harga_beli, 0), coalesce(v_it.harga_jual, 0),
        0, 0, 'aktif', v_it.barcode, v_it.kode_kfa)
      returning id into v_prod;
      v_baru := v_baru + 1;
    end if;

    -- Batch sama (nomor DAN kedaluwarsa) digabung, seperti penerimaan PO.
    select id into v_batch from public.product_batches
     where company_id = v_t.ke_company_id and product_id = v_prod
       and batch_number is not distinct from v_it.batch_number
       and expired_date is not distinct from v_it.expired_date
     order by created_at limit 1
     for update;
    if v_batch is not null then
      update public.product_batches set stok_batch = stok_batch + v_it.qty where id = v_batch;
    else
      insert into public.product_batches (company_id, product_id, batch_number, expired_date, stok_batch, harga_beli)
      values (v_t.ke_company_id, v_prod, v_it.batch_number, v_it.expired_date, v_it.qty, v_it.harga_beli)
      returning id into v_batch;
    end if;

    update public.products set stok_total = coalesce(stok_total, 0) + v_it.qty where id = v_prod;
    update public.stock_transfer_items set ke_product_id = v_prod, ke_batch_id = v_batch where id = v_it.id;
    v_n := v_n + 1;
  end loop;

  update public.stock_transfers
     set status = 'diterima', diterima_oleh = coalesce(auth.jwt() ->> 'email', 'sistem'), diterima_pada = now()
   where id = p_transfer;

  perform public.catat_audit(v_t.ke_company_id, 'transfer.terima', 'stock_transfers', p_transfer::text,
    jsonb_build_object('nomor', v_t.nomor, 'baris', v_n, 'produk_baru', v_baru));
  return jsonb_build_object('nomor', v_t.nomor, 'baris', v_n, 'produk_baru', v_baru);
end;
$$;

-- ── batal_transfer ──────────────────────────────────────────────────────
create or replace function public.batal_transfer(p_transfer uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_t   record;
  v_it  record;
begin
  select * into v_t from public.stock_transfers
   where id = p_transfer and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Transfer tidak ditemukan untuk outlet pengirim ini.' using errcode = 'SH004';
  end if;
  if v_t.status <> 'dikirim' then
    raise exception 'Hanya transfer yang belum diterima yang bisa dibatalkan.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Tulis alasan pembatalannya.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('stok.transfer');

  -- Kembali ke batch ASALNYA, persis, bukan ke batch mana saja.
  for v_it in select * from public.stock_transfer_items where transfer_id = p_transfer order by dari_batch_id loop
    update public.product_batches set stok_batch = stok_batch + v_it.qty where id = v_it.dari_batch_id;
    update public.products set stok_total = coalesce(stok_total, 0) + v_it.qty where id = v_it.dari_product_id;
  end loop;

  update public.stock_transfers set status = 'batal', alasan_batal = trim(p_alasan) where id = p_transfer;
  perform public.catat_audit(v_t.company_id, 'transfer.batal', 'stock_transfers', p_transfer::text,
    jsonb_build_object('nomor', v_t.nomor, 'alasan', trim(p_alasan)));
end;
$$;

revoke all on function public.kirim_transfer(uuid, jsonb, text, uuid) from public, anon;
revoke all on function public.terima_transfer(uuid)                   from public, anon;
revoke all on function public.batal_transfer(uuid, text)              from public, anon;
grant execute on function public.kirim_transfer(uuid, jsonb, text, uuid) to authenticated;
grant execute on function public.terima_transfer(uuid)                   to authenticated;
grant execute on function public.batal_transfer(uuid, text)              to authenticated;
