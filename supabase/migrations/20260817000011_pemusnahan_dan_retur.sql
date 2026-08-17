-- ============================================================
-- 0011  Pemusnahan, retur, dan penandaan batch selesai
-- ============================================================
--
-- Permukaan terakhir yang masih mengubah stok dari peramban. Polanya sama
-- dengan yang sudah dibetulkan di migrasi 0009 dan 0010, tapi di sini ada satu
-- kesalahan yang lebih tajam dari yang lain.
--
-- 1. Pemusnahan menulis stok produk dari angka yang SALAH SUMBER.
--    Kodenya: `stok_total = max(0, showProdukDetail.stok_total - qty)`.
--    `showProdukDetail` adalah salinan produk dari saat modal detail dibuka,
--    dan modal itu bisa terbuka lama. Lebih buruk: kalau tindak lanjut dibuka
--    tanpa modal detail produk aktif, nilainya undefined, jadi `0 - qty` yang
--    dibatasi ke 0. Stok produk itu jadi NOL, apa pun isinya sebelumnya.
--
-- 2. Konfirmasi retur membaca stok lalu menulisnya kembali sebagai nilai
--    mutlak, dari peramban, dalam empat permintaan HTTP terpisah. Penjualan
--    yang terjadi di sela-selanya hilang.
--
-- 3. "Tandai selesai ditindaklanjuti" menulis `stok_batch = 0` sambil sengaja
--    tidak menyentuh stok produk. Maksudnya benar (ini cuma menyingkirkan
--    pengingat, bukan mutasi stok), tapi caranya membuat jumlah batch lebih
--    kecil dari stok produk secara permanen, dan selisih itulah yang dibaca
--    laporan SIPNAP. Diganti kolom penanda `ditindaklanjuti_pada`: pengingat
--    hilang, angka batch tetap utuh.

-- ------------------------------------------------------------
-- 1. Penanda batch yang sudah ditindaklanjuti
-- ------------------------------------------------------------

alter table public.product_batches
  add column if not exists ditindaklanjuti_pada timestamptz,
  add column if not exists ditindaklanjuti_oleh text;

comment on column public.product_batches.ditindaklanjuti_pada is
  'Diisi kalau batch ini sudah diurus di luar sistem dan tidak perlu muncul lagi sebagai pengingat. Stok batchnya sengaja TIDAK diubah, supaya jumlah batch tetap cocok dengan stok produk.';

create or replace function public.abaikan_batch(
  p_batch_id uuid,
  p_alasan   text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_batch record;
begin
  select * into v_batch from public.product_batches
   where id = p_batch_id
     and (public.is_super_admin() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Batch tidak ditemukan.' using errcode = 'SH004';
  end if;

  update public.product_batches
     set ditindaklanjuti_pada = now(),
         ditindaklanjuti_oleh = coalesce(nullif(trim(p_alasan), ''), auth.jwt() ->> 'email', 'sistem')
   where id = p_batch_id;

  return (select to_jsonb(b) from public.product_batches b where b.id = p_batch_id);
end;
$$;

revoke all on function public.abaikan_batch(uuid, text) from public, anon;
grant execute on function public.abaikan_batch(uuid, text) to authenticated;

comment on function public.abaikan_batch is
  'Menyingkirkan batch dari daftar pengingat kadaluarsa tanpa mengubah stok. Pengganti cara lama yang menulis stok_batch = 0 dan diam-diam membuat jumlah batch tidak lagi cocok dengan stok produk.';

-- ------------------------------------------------------------
-- 2. Pemusnahan
-- ------------------------------------------------------------

create or replace function public.musnahkan_batch(
  p_batch_id uuid,
  p_data     jsonb
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_batch   record;
  v_company uuid;
  v_qty     integer;
  v_ba      record;
begin
  select * into v_batch from public.product_batches
   where id = p_batch_id
     and (public.is_super_admin() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Batch tidak ditemukan.' using errcode = 'SH004';
  end if;

  v_company := v_batch.company_id;
  v_qty := coalesce((p_data ->> 'qty_musnahkan')::integer, 0);

  if v_qty <= 0 then
    raise exception 'Jumlah yang dimusnahkan harus lebih dari nol.' using errcode = 'SH004';
  end if;
  if v_qty > v_batch.stok_batch then
    raise exception 'Batch ini hanya berisi %, tidak bisa memusnahkan %.', v_batch.stok_batch, v_qty
      using errcode = 'SH004';
  end if;

  -- Berita acara ditandatangani apoteker penanggung jawab dan dua saksi.
  -- Menolak yang kosong di sini, bukan hanya di layar, karena dokumen tanpa
  -- saksi tidak sah dan baru ketahuan saat diperiksa.
  if coalesce(trim(p_data ->> 'saksi_1'), '') = '' then
    raise exception 'Berita acara pemusnahan wajib mencantumkan saksi pertama.' using errcode = 'SH004';
  end if;

  insert into public.pemusnahan (
    company_id, batch_id, product_id, tanggal_musnahkan,
    qty_musnahkan, metode, saksi_1, saksi_2, keterangan)
  values (
    v_company, p_batch_id, v_batch.product_id,
    coalesce(nullif(p_data ->> 'tanggal_musnahkan', '')::date, current_date),
    v_qty,
    nullif(trim(p_data ->> 'metode'), ''),
    nullif(trim(p_data ->> 'saksi_1'), ''),
    nullif(trim(p_data ->> 'saksi_2'), ''),
    nullif(trim(p_data ->> 'keterangan'), ''))
  returning * into v_ba;

  -- Keduanya RELATIF, dan keduanya bergerak bersama. Obat yang dimusnahkan
  -- keluar dari batch DAN dari stok produk.
  update public.product_batches
     set stok_batch = greatest(0, stok_batch - v_qty)
   where id = p_batch_id;

  update public.products
     set stok_total = greatest(0, stok_total - v_qty)
   where id = v_batch.product_id and company_id = v_company;

  return to_jsonb(v_ba);
end;
$$;

revoke all on function public.musnahkan_batch(uuid, jsonb) from public, anon;
grant execute on function public.musnahkan_batch(uuid, jsonb) to authenticated;

comment on function public.musnahkan_batch is
  'Pemusnahan sebagai satu transaksi database. Stok batch dan stok produk dipotong relatif dan bersama, menggantikan cara lama yang menulis nilai mutlak dari salinan produk di layar.';

-- ------------------------------------------------------------
-- 3. Konfirmasi dan pembatalan retur
-- ------------------------------------------------------------

create or replace function public.konfirmasi_retur(p_retur_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_retur record;
begin
  select * into v_retur from public.retur_supplier
   where id = p_retur_id
     and (public.is_super_admin() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Retur tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- Idempoten: menekan Konfirmasi dua kali tidak memotong stok dua kali.
  if v_retur.status = 'selesai' then
    return to_jsonb(v_retur);
  end if;
  if v_retur.status = 'dibatalkan' then
    raise exception 'Retur ini sudah dibatalkan.' using errcode = 'SH004';
  end if;

  if v_retur.batch_id is not null then
    update public.product_batches
       set stok_batch = greatest(0, stok_batch - v_retur.qty_retur)
     where id = v_retur.batch_id;
  end if;

  update public.products
     set stok_total = greatest(0, stok_total - v_retur.qty_retur)
   where id = v_retur.product_id and company_id = v_retur.company_id;

  update public.retur_supplier set status = 'selesai' where id = p_retur_id;

  return (select to_jsonb(r) from public.retur_supplier r where r.id = p_retur_id);
end;
$$;

revoke all on function public.konfirmasi_retur(uuid) from public, anon;
grant execute on function public.konfirmasi_retur(uuid) to authenticated;

comment on function public.konfirmasi_retur is
  'Retur yang dikonfirmasi memotong stok batch dan stok produk secara relatif dalam satu transaksi, dan aman dipanggil dua kali.';
