-- ============================================================
-- 0010  Penerimaan barang sebagai satu transaksi database
-- ============================================================
--
-- Dua hal digabung di sini karena keduanya menyangkut Pembelian.
--
-- BAGIAN 1: dua kolom yang ada di database tapi tidak ada di migrasi mana pun.
--
-- `purchase_orders.status_penerimaan` dan `purchase_orders.tanggal_po` dipakai
-- aplikasi (ditulis saat menerima barang, dibaca tombol "Terima Lagi" dan
-- dokumen cetak PO), ada di database produksi, tapi tidak pernah muncul di
-- satu berkas SQL pun. Artinya lingkungan baru yang dibangun dari folder
-- migrasi ini akan rusak di penerimaan barang pertama. Ditambahkan di sini
-- dengan `if not exists`, jadi tidak mengubah apa pun di produksi.
--
-- BAGIAN 2: penerimaan barang.
--
-- Bentuk lamanya berjalan di peramban, satu permintaan HTTP per baris, dan
-- membawa empat kesalahan sekaligus:
--
--   1. Stok ditulis sebagai nilai mutlak: `stok_total = (yang dibaca saat
--      modal dibuka) + qty_terima`. Penjualan yang terjadi antara modal dibuka
--      dan tombol Simpan ditekan terhapus tanpa jejak. Dua orang menerima
--      barang bersamaan juga saling menimpa.
--   2. Menerima sebagian lalu menerima lagi menambahkan stok DUA KALI, karena
--      `qty_terima` di formulir bersifat kumulatif tapi diperlakukan sebagai
--      tambahan baru.
--   3. Batch baru selalu di-INSERT, jadi menerima batch yang sama dua kali
--      meninggalkan dua baris batch dengan nomor yang sama, dan FEFO lalu
--      membaginya. `po_id` pada batch tidak pernah diisi, padahal kolomnya ada
--      dan justru itu yang dicari halaman Tindak Lanjut untuk tahu batch ini
--      datang dari supplier mana.
--   4. Tidak ada company_id pada batch. Untuk pemilik apotek trigger
--      mengisinya dari sesi, tapi super admin tidak terikat apotek mana pun:
--      batch yang ia terima sambil "melihat sebagai" satu apotek mendarat
--      tanpa pemilik, lalu tidak terlihat siapa pun.
--
-- Dan kalau jaringan putus di tengah perulangan, sebagian stok bertambah,
-- sebagian tidak, sementara PO tetap ditandai selesai.

-- ------------------------------------------------------------
-- 1. Kolom yang hanyut
-- ------------------------------------------------------------

alter table public.purchase_orders
  add column if not exists tanggal_po        date not null default current_date,
  add column if not exists status_penerimaan text not null default 'belum';

comment on column public.purchase_orders.status_penerimaan is
  'belum | partial | selesai. Menentukan tombol "Terima Barang" atau "Terima Lagi".';

create index if not exists idx_batches_lookup
  on public.product_batches (company_id, product_id, batch_number, expired_date);

create unique index if not exists uq_faktur_nomor_per_company
  on public.faktur (company_id, nomor_faktur) where nomor_faktur is not null;

-- ------------------------------------------------------------
-- 2. receive_purchase_order
-- ------------------------------------------------------------

create or replace function public.receive_purchase_order(
  p_po_id  uuid,
  p_items  jsonb,
  p_tutup  boolean default false,
  p_faktur jsonb default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_po        record;
  v_company   uuid;
  v_super     boolean := public.is_super_admin();
  v_item      jsonb;
  v_baris     record;
  v_delta     integer;
  v_qty       integer;
  v_harga     numeric;
  v_batchno   text;
  v_ed        date;
  v_batch_id  uuid;
  v_diterima  integer := 0;
  v_total_fak numeric := 0;
  v_no_faktur text;
  v_tgl_fak   date;
  v_top       integer;
  v_jt        date;
  v_status    text;
  v_st_terima text;
begin
  select * into v_po from public.purchase_orders
   where id = p_po_id
     and (v_super or company_id = public.auth_company_id())
   for update;

  if not found then
    raise exception 'Purchase order tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_po.status = 'dibatalkan' then
    raise exception 'Purchase order ini sudah dibatalkan.' using errcode = 'SH004';
  end if;

  v_company := v_po.company_id;
  if v_company is null then
    raise exception 'Purchase order ini tidak terhubung ke apotek mana pun.' using errcode = 'SH004';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Tidak ada baris penerimaan.' using errcode = 'SH004';
  end if;

  -- ---------- periksa dulu, tulis kemudian ----------
  -- Semua penolakan terjadi sebelum satu angka stok pun berubah. Kalau nomor
  -- faktur ditolak sesudah stok ditambah, penerimaannya harus dibatalkan
  -- seluruhnya, dan orang yang sedang berdiri di depan kurir tidak tahu
  -- barangnya sudah masuk atau belum.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_baris from public.po_items
     where id = (v_item ->> 'po_item_id')::uuid and po_id = p_po_id;
    if not found then
      raise exception 'Baris pesanan tidak dikenali.' using errcode = 'SH004';
    end if;

    v_qty := coalesce((v_item ->> 'qty_terima')::integer, 0);
    if v_qty < 0 then
      raise exception 'Jumlah diterima tidak boleh negatif.' using errcode = 'SH004';
    end if;
    if v_qty < v_baris.qty_terima then
      raise exception 'Jumlah diterima untuk % tidak boleh lebih kecil dari yang sudah tercatat (%). Batalkan penerimaan lewat penyesuaian stok.',
        coalesce(v_baris.nama_produk, 'produk ini'), v_baris.qty_terima using errcode = 'SH004';
    end if;

    v_batchno := nullif(trim(v_item ->> 'batch_number'), '');
    v_ed      := nullif(v_item ->> 'expired_date', '')::date;
    if v_batchno is not null and v_ed is null then
      raise exception 'Batch % belum punya tanggal kadaluarsa. Tanpa itu FEFO dan laporan SIPNAP tidak bisa dihitung.', v_batchno
        using errcode = 'SH004';
    end if;

    v_total_fak := v_total_fak + (v_qty - v_baris.qty_terima) * coalesce((v_item ->> 'harga_beli')::numeric, v_baris.harga_beli);
  end loop;

  v_no_faktur := nullif(trim(p_faktur ->> 'nomor_faktur'), '');
  if v_no_faktur is not null then
    if exists (select 1 from public.faktur
                where company_id = v_company and nomor_faktur = v_no_faktur) then
      raise exception 'Nomor faktur % sudah pernah dicatat.', v_no_faktur using errcode = 'SH004';
    end if;
  end if;

  -- ---------- tulis ----------
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_baris from public.po_items
     where id = (v_item ->> 'po_item_id')::uuid and po_id = p_po_id
     for update;

    v_qty     := coalesce((v_item ->> 'qty_terima')::integer, 0);
    v_harga   := coalesce((v_item ->> 'harga_beli')::numeric, v_baris.harga_beli);
    v_batchno := nullif(trim(v_item ->> 'batch_number'), '');
    v_ed      := nullif(v_item ->> 'expired_date', '')::date;

    -- Yang masuk kali ini, bukan yang tertulis di formulir. Formulirnya
    -- kumulatif: kalau PO ini pernah diterima sebagian, angka di layar sudah
    -- termasuk penerimaan sebelumnya.
    v_delta := v_qty - v_baris.qty_terima;

    update public.po_items
       set qty_terima   = v_qty,
           batch_number = v_batchno,
           expired_date = v_ed,
           harga_beli   = v_harga,
           subtotal     = v_qty * v_harga
     where id = v_baris.id;

    if v_delta <= 0 or v_baris.product_id is null then
      continue;
    end if;

    v_diterima := v_diterima + 1;

    -- Penambahan RELATIF. Nilai mutlak dari peramban menghapus penjualan yang
    -- terjadi sementara modal penerimaan terbuka.
    update public.products
       set stok_total = stok_total + v_delta,
           harga_beli = v_harga
     where id = v_baris.product_id and company_id = v_company;

    if v_batchno is not null then
      select id into v_batch_id from public.product_batches
       where company_id = v_company
         and product_id = v_baris.product_id
         and batch_number = v_batchno
         and expired_date = v_ed
       for update;

      if found then
        update public.product_batches
           set stok_batch = stok_batch + v_delta
         where id = v_batch_id;
      else
        insert into public.product_batches (
          company_id, product_id, po_id, batch_number, expired_date, stok_batch)
        values (v_company, v_baris.product_id, p_po_id, v_batchno, v_ed, v_delta);
      end if;
    end if;
  end loop;

  if p_tutup then
    v_status := 'selesai'; v_st_terima := 'selesai';
  else
    v_status := 'dikirim'; v_st_terima := 'partial';
  end if;

  update public.purchase_orders
     set status            = v_status,
         status_penerimaan = v_st_terima,
         tanggal_terima    = current_date
   where id = p_po_id;

  if v_no_faktur is not null then
    v_tgl_fak := coalesce(nullif(p_faktur ->> 'tanggal_faktur', '')::date, current_date);
    v_top     := coalesce((p_faktur ->> 'term_of_payment')::integer, 30);
    v_jt      := v_tgl_fak + v_top;

    insert into public.faktur (
      company_id, nomor_faktur, po_id, supplier_id,
      tanggal_faktur, term_of_payment, tanggal_jatuh_tempo, total, status)
    values (
      v_company, v_no_faktur, p_po_id, v_po.supplier_id,
      v_tgl_fak, v_top, v_jt, greatest(v_total_fak, 0), 'belum_bayar');
  end if;

  return jsonb_build_object(
    'po',            (select to_jsonb(x) from public.purchase_orders x where x.id = p_po_id),
    'baris_masuk',   v_diterima,
    'nomor_faktur',  v_no_faktur,
    'jatuh_tempo',   v_jt,
    'total_faktur',  greatest(v_total_fak, 0)
  );
end;
$$;

revoke all on function public.receive_purchase_order(uuid, jsonb, boolean, jsonb) from public, anon;
grant execute on function public.receive_purchase_order(uuid, jsonb, boolean, jsonb) to authenticated;

comment on function public.receive_purchase_order is
  'Penerimaan barang sebagai satu transaksi database: stok ditambah relatif (bukan mutlak), batch digabung bukan diduplikat, dan faktur ikut tercatat atau seluruhnya batal.';
