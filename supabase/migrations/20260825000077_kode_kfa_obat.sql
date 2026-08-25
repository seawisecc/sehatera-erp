-- ============================================================
-- 0077  Kode KFA menempel di produk
-- ============================================================
--
-- Prasyarat mengirim resep ke SatuSehat, dan sekaligus menutup satu baris di
-- daftar "yang belum ada" yang sudah lama berdiri di catatan project ini.
--
-- `MedicationRequest` membawa `Medication` sebagai resource `contained`, dan
-- `Medication.code` **WAJIB memakai kode KFA** (Kamus Farmasi dan Alat
-- Kesehatan), bukan nama obat dan bukan kode internal apotek. Tanpa kode itu
-- resep tidak bisa berangkat sama sekali.
--
-- Dua bentuk kode, dan bedanya penting:
--
--   92xxxxxx  produk obat TEMPLATE  (zat aktif + kekuatan + bentuk sediaan)
--   93xxxxxx  produk obat AKTUAL    (merek dagang tertentu dari pabrik tertentu)
--
-- Yang dipilih tergantung apa yang benar-benar diserahkan. Apotek yang
-- menyerahkan Panadol 500 mg memakai kode aktual; yang meresepkan "parasetamol
-- 500 mg tablet" tanpa menentukan merek memakai kode template. Keduanya sah,
-- dan kolom ini menampung salah satunya apa adanya.
--
-- **Tidak divalidasi ke daftar KFA di sini**, cuma bentuknya. Alasan yang sama
-- dengan ICD-10 di migrasi 0025: daftar yang dipegang aplikasi bisa tertinggal
-- dari daftar nasional tanpa ada yang memberi tahu, dan menolak keras berarti
-- ada apoteker yang tidak bisa menyimpan obat baru karena kodenya terlalu
-- baru. Yang salah akan ditolak SatuSehat saat dikirim, dan penolakan itu
-- muncul di layar antrean beserta kalimatnya.
--
-- Daftar resminya dicari di https://satusehat.kemkes.go.id/kfa-browser

alter table public.products
  add column if not exists kode_kfa text;

comment on column public.products.kode_kfa is
  'Kode KFA dari kamus farmasi nasional. Diawali 92 untuk produk template (zat aktif + kekuatan + sediaan) atau 93 untuk produk aktual (merek tertentu). Wajib ada sebelum resep obat ini bisa dikirim ke SatuSehat.';

-- Bentuknya saja yang dijaga: delapan angka diawali 92 atau 93. Kosong tetap
-- boleh, karena perbekalan non-obat (kasa, spuit, alat) tidak selalu ada di
-- KFA dan tidak pernah ikut berangkat sebagai Medication.
alter table public.products drop constraint if exists products_kode_kfa_bentuk;
alter table public.products add constraint products_kode_kfa_bentuk
  check (kode_kfa is null or kode_kfa ~ '^9[23][0-9]{6}$');

create index if not exists idx_products_kfa_belum
  on public.products (company_id) where kode_kfa is null;
