-- ============================================================
-- 0009  Pembatalan transaksi yang benar-benar mengembalikan stok
-- ============================================================
--
-- Migrasi 0004 memperbaiki setengah masalahnya: penjualan sekarang memotong
-- `products.stok_total` DAN `product_batches.stok_batch` secara FEFO, dalam
-- satu transaksi database.
--
-- Setengah yang lain masih rusak, dan letaknya di halaman Laporan: tombol
-- "Batalkan" mengembalikan `products.stok_total` saja. Batch tidak pernah
-- diisi kembali. Akibatnya setiap pembatalan menyisakan selisih permanen
-- antara stok produk dan jumlah batch, dan angka BATCH itulah yang dibaca
-- laporan SIPNAP dan penelusuran kadaluarsa. Untuk narkotika dan psikotropika
-- selisih itu bukan sekadar angka keliru di layar, melainkan laporan yang
-- ditandatangani apoteker penanggung jawab.
--
-- Mengembalikannya tidak bisa ditebak. FEFO memilih batch berdasarkan keadaan
-- stok pada saat penjualan, dan keadaan itu sudah berubah. Maka penjualan
-- sekarang MENCATAT batch mana yang diambil, dan pembatalan membalik catatan
-- itu persis.
--
-- Transaksi lama, yang dibuat sebelum migrasi ini, tidak punya catatan itu.
-- Untuk mereka pembatalan tetap mengembalikan `stok_total` saja, lalu menandai
-- hasilnya di kolom `catatan_pembatalan`, supaya selisihnya diketahui dan bisa
-- diluruskan lewat stok opname, bukan diam-diam.

-- ------------------------------------------------------------
-- 1. Catatan batch per baris penjualan
-- ------------------------------------------------------------

create table if not exists public.transaction_item_batches (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  transaction_id      uuid not null references public.transactions(id) on delete cascade,
  transaction_item_id uuid not null references public.transaction_items(id) on delete cascade,
  product_id          uuid not null references public.products(id),
  batch_id            uuid not null references public.product_batches(id),
  jumlah              integer not null check (jumlah > 0),
  created_at          timestamptz not null default now()
);

create index if not exists idx_tib_company     on public.transaction_item_batches (company_id);
create index if not exists idx_tib_transaction on public.transaction_item_batches (transaction_id);
create index if not exists idx_tib_batch       on public.transaction_item_batches (batch_id);

alter table public.transaction_item_batches enable row level security;

drop policy if exists "tenant_all" on public.transaction_item_batches;
create policy "tenant_all" on public.transaction_item_batches for all to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin())
  with check (company_id = public.auth_company_id() or public.is_super_admin());

drop trigger if exists trg_set_company_id on public.transaction_item_batches;
create trigger trg_set_company_id before insert on public.transaction_item_batches
  for each row execute function public.set_company_id();

comment on table public.transaction_item_batches is
  'Batch mana yang diambil FEFO untuk tiap baris penjualan. Ada supaya pembatalan bisa mengembalikan stok ke batch yang benar, bukan menebak.';

alter table public.transactions
  add column if not exists dibatalkan_pada     timestamptz,
  add column if not exists dibatalkan_oleh     text,
  add column if not exists catatan_pembatalan  text;

-- ------------------------------------------------------------
-- 2. apply_transaction: sama seperti 0004, tapi mencatat batchnya
-- ------------------------------------------------------------

create or replace function public.apply_transaction(
  p_items        jsonb,
  p_bayar        numeric,
  p_metode_bayar text default 'Tunai',
  p_pasien       jsonb default '{}'::jsonb,
  p_company      uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company   uuid := case when p_company is not null and public.is_super_admin()
                           then p_company else public.auth_company_id() end;
  v_trx       uuid;
  v_item_id   uuid;
  v_total     numeric := 0;
  v_item      jsonb;
  v_pid       uuid;
  v_qty       integer;
  v_harga     numeric;
  v_stok      integer;
  v_nama      text;
  v_sisa      integer;
  v_ambil     integer;
  v_batch     record;
  v_golongan  boolean := false;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke apotek mana pun.' using errcode = 'SH004';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Keranjang kosong.' using errcode = 'SH004';
  end if;

  -- ---------- periksa dulu, tulis kemudian ----------
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := coalesce((v_item ->> 'jumlah')::integer, 0);
    v_harga := coalesce((v_item ->> 'harga_jual')::numeric, 0);
    if v_qty <= 0 then
      raise exception 'Jumlah harus lebih dari nol.' using errcode = 'SH004';
    end if;
    v_total := v_total + (v_harga * v_qty);

    if coalesce((v_item ->> 'is_jasa')::boolean, false) then
      continue;
    end if;

    v_pid := (v_item ->> 'product_id')::uuid;
    select stok_total, nama_obat,
           kategori in ('narkotika', 'psikotropika', 'prekursor')
      into v_stok, v_nama, v_golongan
      from public.products
     where id = v_pid and company_id = v_company;

    if not found then
      raise exception 'Obat tidak ditemukan di katalog apotek ini.' using errcode = 'SH004';
    end if;
    if v_stok < v_qty then
      raise exception 'Stok % tidak cukup: tersisa %, diminta %.', v_nama, v_stok, v_qty
        using errcode = 'SH005';
    end if;

    if v_golongan and (
         p_pasien is null
         or coalesce(trim(p_pasien ->> 'nama_pasien'), '') = ''
         or coalesce(trim(p_pasien ->> 'nomor_resep'), '') = ''
       ) then
      raise exception 'Obat golongan Narkotika/Psikotropika/Prekursor wajib mencatat nama pasien dan nomor resep.'
        using errcode = 'SH006';
    end if;
  end loop;

  if coalesce(p_bayar, 0) < v_total then
    raise exception 'Pembayaran kurang dari total belanja.' using errcode = 'SH004';
  end if;

  -- ---------- tulis ----------
  insert into public.transactions (
    company_id, total, bayar, kembalian, metode_bayar, status,
    nama_pasien, alamat_pasien, kontak_pasien, nomor_resep)
  values (
    v_company, v_total, p_bayar, p_bayar - v_total,
    coalesce(p_metode_bayar, 'Tunai'), 'selesai',
    nullif(trim(p_pasien ->> 'nama_pasien'), ''),
    nullif(trim(p_pasien ->> 'alamat_pasien'), ''),
    nullif(trim(p_pasien ->> 'kontak_pasien'), ''),
    nullif(trim(p_pasien ->> 'nomor_resep'), ''))
  returning id into v_trx;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := (v_item ->> 'jumlah')::integer;
    v_harga := coalesce((v_item ->> 'harga_jual')::numeric, 0);
    v_pid   := case when coalesce((v_item ->> 'is_jasa')::boolean, false)
                    then null else (v_item ->> 'product_id')::uuid end;

    insert into public.transaction_items (
      company_id, transaction_id, product_id, nama_obat, harga_jual, jumlah, subtotal)
    values (v_company, v_trx, v_pid, v_item ->> 'nama_obat', v_harga, v_qty, v_harga * v_qty)
    returning id into v_item_id;

    if v_pid is null then
      continue;
    end if;

    update public.products
       set stok_total = greatest(0, stok_total - v_qty)
     where id = v_pid and company_id = v_company;

    -- FEFO: batch yang paling dekat kadaluarsa dikeluarkan lebih dulu. Batch
    -- tanpa tanggal kadaluarsa ditaruh paling akhir supaya obat yang punya
    -- tanggal tidak keburu lewat sementara yang tak bertanggal terus terpakai.
    v_sisa := v_qty;
    for v_batch in
      select id, stok_batch from public.product_batches
       where product_id = v_pid and company_id = v_company and stok_batch > 0
       order by expired_date asc nulls last, created_at asc
      for update
    loop
      exit when v_sisa <= 0;
      v_ambil := least(v_sisa, v_batch.stok_batch);

      update public.product_batches
         set stok_batch = stok_batch - v_ambil
       where id = v_batch.id;

      insert into public.transaction_item_batches (
        company_id, transaction_id, transaction_item_id, product_id, batch_id, jumlah)
      values (v_company, v_trx, v_item_id, v_pid, v_batch.id, v_ambil);

      v_sisa := v_sisa - v_ambil;
    end loop;
  end loop;

  return (select to_jsonb(t) from public.transactions t where t.id = v_trx);
end;
$$;

revoke all on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) from public, anon;
grant execute on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) to authenticated;

comment on function public.apply_transaction is
  'Penjualan sebagai satu transaksi database. Memotong stok produk DAN batch (FEFO), dan mencatat batch mana yang diambil supaya pembatalan bisa membalikkannya persis.';

-- ------------------------------------------------------------
-- 3. cancel_transaction
-- ------------------------------------------------------------

create or replace function public.cancel_transaction(
  p_transaction_id uuid,
  p_alasan         text default null
)
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
  select * into v_trx
    from public.transactions
   where id = p_transaction_id
     and (v_super or company_id = v_company)
   for update;

  if not found then
    raise exception 'Transaksi tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- Idempoten. Menekan "Batalkan" dua kali, atau dua kasir menekannya
  -- bersamaan, tidak boleh mengembalikan stok dua kali.
  if v_trx.status = 'dibatalkan' then
    return to_jsonb(v_trx);
  end if;

  -- Stok produk selalu dikembalikan.
  update public.products p
     set stok_total = p.stok_total + i.jumlah
    from public.transaction_items i
   where i.transaction_id = p_transaction_id
     and i.product_id = p.id;

  -- Batch dikembalikan dari catatan penjualan, kalau ada.
  with kembali as (
    update public.product_batches b
       set stok_batch = b.stok_batch + tib.jumlah
      from public.transaction_item_batches tib
     where tib.transaction_id = p_transaction_id
       and tib.batch_id = b.id
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

  return (select to_jsonb(t) from public.transactions t where t.id = p_transaction_id);
end;
$$;

revoke all on function public.cancel_transaction(uuid, text) from public, anon;
grant execute on function public.cancel_transaction(uuid, text) to authenticated;

comment on function public.cancel_transaction is
  'Pembatalan penjualan sebagai satu transaksi database: stok produk dan stok batch dikembalikan bersama, dan pemanggilan kedua tidak menambah stok lagi.';
