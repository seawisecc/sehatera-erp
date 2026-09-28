-- ============================================================
-- 0084  Paket Klinik tampil di halaman harga
-- ============================================================
--
-- Diminta pemilik 28 September 2026. Harganya (Rp 1.490.000/bln,
-- Rp 14.900.000/th) sudah disetujui sejak Agustus; yang menahan adalah
-- "baru boleh ditampilkan setelah modulnya benar-benar siap dijual".
--
-- Deskripsinya DITULIS ULANG, bukan cuma dibuka. Yang lama berbunyi
-- "rekam medis, SatuSehat, BPJS", dan dua dari tiga itu belum bisa dibeli:
-- BPJS belum tersambung sama sekali (kredensialnya belum ada), dan SatuSehat
-- baru berjalan di SANDBOX. Kirim ke produksi menuntut Sehatera terverifikasi
-- sebagai Penyedia Sistem RME di SSP. Aturan halaman harga project ini:
-- yang dijual tanpa barang bukan kelalaian teknis, ia janji yang tidak
-- ditepati. Begitu keduanya benar-benar berjalan di produksi, deskripsinya
-- boleh menyebutnya lagi lewat editor paket di Super Admin.
--
-- Yang disebut di sini semuanya ADA dan digerbangi paket sejak 0081:
-- kunjungan & rekam medis, e-resep, antrean & layar ruang tunggu,
-- reservasi, lab & radiologi, dan klaim penjamin.

update public.plans
   set is_public   = true,
       description = 'Klinik pratama: rekam medis, e-resep, antrean, reservasi, lab, dan klaim penjamin',
       updated_at  = now()
 where code = 'klinik';
