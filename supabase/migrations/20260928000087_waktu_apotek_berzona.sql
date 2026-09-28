-- ============================================================
-- 0087  Waktu di tabel apotek membawa zonanya
-- ============================================================
--
-- Ditemukan saat audit 28 September 2026, dijalankan atas persetujuan
-- pemilik hari yang sama.
--
-- Sembilan kolom `created_at` di tabel apotek yang lama bertipe
-- `timestamp WITHOUT time zone`. Server database berjalan dalam UTC, jadi
-- isinya jam UTC, tapi PostgREST mengirimnya TANPA penanda zona
-- ("2026-09-23T23:36:20"), dan peramban membaca string tanpa zona sebagai
-- JAM LOKAL. Akibatnya, tanpa satu galat pun:
--
--   - jam transaksi yang tampil MUNDUR 8 jam di WITA (7 di WIB): penjualan
--     pukul 07.36 tanggal 24 terbaca 23.36 tanggal 23;
--   - laporan harian kasir memasukkan penjualan sebelum pukul 08.00 ke hari
--     KEMARIN;
--   - SIPNAP memasukkan pengeluaran narkotika tanggal 1 pagi ke BULAN
--     SEBELUMNYA, dan itu laporan wajib yang ditandatangani apoteker.
--
-- Tabel medis (visits, patients, dan seterusnya) sudah memakai timestamptz
-- sejak lahir, jadi hanya tabel apotek generasi pertama yang kena.
--
-- `using created_at at time zone 'UTC'` membaca nilai lama SEBAGAI UTC,
-- yang memang arti sebenarnya, jadi tidak ada satu detik pun yang bergeser.
-- Yang berubah hanya bentuk kirimannya: kini membawa "+00:00", dan peramban
-- mengonversinya ke jam dinding faskes dengan benar.
--
-- Kueri yang sudah ada tetap benar: pembanding dari peramban dikirim dalam
-- UTC ("...Z"), dan dulu zona itu dibuang lalu dibandingkan dengan jam UTC
-- yang tersimpan; sekarang dibandingkan sebagai waktu absolut. Hasilnya sama.
--
-- Tidak ada view yang bergantung pada kolom-kolom ini (diperiksa sebelum
-- migrasi ditulis), jadi ALTER TYPE tidak ditahan apa pun.

do $$
declare
  t text;
begin
  foreach t in array array[
    'transactions', 'purchase_orders', 'pemusnahan', 'retur_supplier',
    'product_batches', 'product_suppliers', 'products', 'suppliers', 'settings'
  ] loop
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = t
         and column_name = 'created_at'
         and data_type = 'timestamp without time zone'
    ) then
      execute format(
        'alter table public.%I alter column created_at type timestamptz using created_at at time zone ''UTC''',
        t);
    end if;
  end loop;
end $$;
