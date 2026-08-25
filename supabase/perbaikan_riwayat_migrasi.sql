-- ============================================================
-- Perbaikan riwayat migrasi (SEKALI JALAN, bukan migrasi)
-- ============================================================
--
-- Jalankan di SQL Editor Supabase, sekali saja.
--
-- Seluruh migrasi project ini dijalankan tangan lewat SQL Editor sejak awal,
-- jadi tabel riwayat milik Supabase CLI tidak pernah ada isinya, dan pada
-- database ini tabelnya bahkan belum pernah dibuat. Itu yang membuat
-- `supabase migration repair` gagal dengan "failed to update migration table":
-- ia mencoba menulis ke tabel yang belum ada.
--
-- Berkas ini membuat tabelnya lalu mengisinya dengan ketujuh puluh tujuh versi
-- yang MEMANG sudah terpasang. **Tidak menjalankan satu baris DDL aplikasi pun**:
-- tidak ada tabel aplikasi yang disentuh, tidak ada fungsi yang dibuat ulang.
-- Yang ditulis cuma catatan "versi ini sudah pernah dijalankan".
--
-- Sesudah ini, `supabase db push` hanya akan menjalankan migrasi yang BELUM
-- tercatat, dan menempel SQL ke SQL Editor tidak diperlukan lagi.
--
-- Aman dijalankan ulang: `on conflict do nothing`.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version    text primary key,
  statements text[],
  name       text
);

-- Versi CLI yang lebih baru menambah kolom sendiri. Ditambahkan satu per satu
-- supaya berkas ini tetap aman di database yang tabelnya sudah lebih lengkap.
alter table supabase_migrations.schema_migrations
  add column if not exists statements text[],
  add column if not exists name text;

insert into supabase_migrations.schema_migrations (version, name) values
  ('20260815000001', 'baseline_schema'),
  ('20260815000002', 'rls_and_numbering'),
  ('20260815000003', 'plan_quotas_and_subscription'),
  ('20260815000004', 'rpc'),
  ('20260815000005', 'guard_allows_admin_paths'),
  ('20260815000006', 'public_plans_read'),
  ('20260817000007', 'tema_terang_saja'),
  ('20260817000008', 'teks_tanpa_tanda_pisah'),
  ('20260817000009', 'pembatalan_transaksi'),
  ('20260817000010', 'penerimaan_barang'),
  ('20260817000011', 'pemusnahan_dan_retur'),
  ('20260817000012', 'undangan_dan_audit'),
  ('20260817000013', 'tagihan_langganan'),
  ('20260817000014', 'jalur_admin_platform'),
  ('20260817000015', 'identitas_faskes'),
  ('20260817000016', 'pasien_dan_kunjungan'),
  ('20260817000017', 'kunjungan_jalur_admin'),
  ('20260817000018', 'rekam_medis'),
  ('20260817000019', 'antrean_dengan_rekam_medis'),
  ('20260817000020', 'poli_dan_dokter'),
  ('20260817000021', 'mode_farmasi'),
  ('20260817000022', 'jalur_admin_klinik'),
  ('20260817000023', 'eresep'),
  ('20260817000024', 'tagihan_kunjungan'),
  ('20260818000025', 'terminologi_icd'),
  ('20260818000026', 'data_icd10_bagian1'),
  ('20260818000027', 'data_icd10_bagian2'),
  ('20260818000028', 'data_icd10_bagian3'),
  ('20260818000029', 'data_icd9cm_dan_alias'),
  ('20260818000030', 'cari_icd_bahasa_indonesia'),
  ('20260818000031', 'normalisasi_rh'),
  ('20260818000032', 'glosarium_kunci_ternormalisasi'),
  ('20260818000033', 'glosarium_tindakan'),
  ('20260818000034', 'riwayat_pasien'),
  ('20260818000035', 'jabat_tangan_farmasi'),
  ('20260818000036', 'resep_ikut_keadaan_baru'),
  ('20260818000037', 'kembalikan_nilai_biaya'),
  ('20260818000038', 'permintaan_terbuka_farmasi'),
  ('20260818000039', 'hak_akses_sub_modul'),
  ('20260818000040', 'rel_kunjungan_ikut_resep'),
  ('20260818000041', 'layar_antrean'),
  ('20260818000042', 'antrean_bawa_panggilan'),
  ('20260818000043', 'token_tanpa_pgcrypto'),
  ('20260818000044', 'samaran_nama_bali'),
  ('20260819000045', 'tagihan_ikut_keadaan_resep'),
  ('20260819000046', 'papan_tunggu_saja'),
  ('20260819000047', 'kasir_tahu_siap_ditagih'),
  ('20260819000048', 'daftar_asuransi'),
  ('20260819000049', 'rel_baru_kunjungan'),
  ('20260819000050', 'buang_daftar_kunjungan_lama'),
  ('20260819000051', 'pelunasan_per_penjamin'),
  ('20260819000052', 'apply_transaction_jalur_admin'),
  ('20260819000053', 'laporan_penjamin_jalur_admin'),
  ('20260819000054', 'reservasi'),
  ('20260819000055', 'kredensial_faskes'),
  ('20260819000056', 'antrean_kirim'),
  ('20260819000057', 'antre_kirim_penanda_baru'),
  ('20260819000058', 'draf_tidak_menahan_kunjungan'),
  ('20260819000059', 'identitas_pasien_lengkap'),
  ('20260819000060', 'rujukan_internal'),
  ('20260819000061', 'penunjang'),
  ('20260819000062', 'multi_outlet'),
  ('20260819000063', 'tarif_penunjang'),
  ('20260819000064', 'nomor_resep_ke_kasir'),
  ('20260819000065', 'hak_outlet_pengguna'),
  ('20260819000066', 'klaim_penjamin'),
  ('20260819000067', 'klaim_jalur_admin'),
  ('20260819000068', 'siap_tagih'),
  ('20260819000069', 'barcode_dan_rak'),
  ('20260819000070', 'perizinan_tenaga_kesehatan'),
  ('20260825000071', 'ihs_poli_dan_satu_kolom_praktisi'),
  ('20260825000072', 'antrean_kirim_per_faskes'),
  ('20260825000073', 'jejak_kirim_satusehat'),
  ('20260825000074', 'nik_tenaga_kesehatan'),
  ('20260825000075', 'antre_ulang_yang_ditinggalkan'),
  ('20260825000076', 'procedure_ke_satusehat'),
  ('20260825000077', 'kode_kfa_obat')
on conflict (version) do nothing;

-- Buktinya: harus mengembalikan 77.
select count(*) as versi_tercatat from supabase_migrations.schema_migrations;
