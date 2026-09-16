-- ============================================================
-- 0079  Hasil lab punya tempat menyimpan nomor Observation-nya
-- ============================================================
--
-- Satu kolom, alasan yang sama dengan `visit_charges.ihs_procedure_id` di
-- migrasi 0076: tanpa tempat menyimpan nomor yang dikembalikan SatuSehat,
-- pengiriman ulang melahirkan Observation kedua untuk parameter yang sama,
-- dan tidak ada cara tahu mana yang sudah berangkat.
--
-- `lab_results` sejak migrasi 0061 sudah satu baris per parameter berkode
-- LOINC, dan itu persis bentuk yang diminta SatuSehat: satu Observation per
-- parameter. Keputusan lama itu terbayar di sini tanpa pekerjaan tambahan,
-- sama seperti `statusHistory` pada Encounter.
--
--
-- ## Kenapa BERHENTI di Observation, dan tidak sampai DiagnosticReport
--
-- Dibaca dari `satusehat.kemkes.go.id/platform/docs` pada 16 September 2026,
-- halaman FHIR > Observation, FHIR > DiagnosticReport, FHIR > Specimen, dan
-- Panduan Interoperabilitas > Resume Medis - Rawat Jalan bab 10 dan 11.
--
-- Pemeriksaan penunjang berangkat sebagai RANTAI, bukan satu kiriman:
--
--   Lab       : ServiceRequest -> Specimen -> Observation -> DiagnosticReport
--   Radiologi : ServiceRequest -> Observation -> DiagnosticReport -> ImagingStudy
--
-- Sehatera bisa mengisi Observation hari ini, dan tidak bisa mengisi dua mata
-- rantai berikutnya. Keduanya bukan soal menulis kode:
--
-- 1. **`Specimen.type` memakai SNOMED-CT**, dan Sehatera tidak menyimpan data
--    spesimen sama sekali: tidak ada jenis spesimen, waktu pengambilan, maupun
--    wadahnya. Menambah kolomnya mudah; yang tidak boleh adalah MENEBAK kode
--    SNOMED-nya, aturan yang sama yang membuat `serviceType` pada Encounter dan
--    `Procedure.category` sengaja tidak dikirim. Kalau ditebak, payload-nya
--    tetap sah dan kirimannya tetap diterima; yang salah cuma isinya, dan itu
--    bentuk kegagalan yang paling mahal.
--
-- 2. **`ImagingStudy` menuntut DICOM**, dikirim lewat DICOM router dari PACS.
--    Klinik pratama yang jadi sasaran Sehatera tidak punya PACS, dan Sehatera
--    memang menyimpan bacaan radiologi sebagai naratif (`temuan`, `kesan`)
--    justru karena itu keputusan sadar di migrasi 0061.
--
-- Jadi yang dikirim sekarang HANYA hasil lab sebagai Observation. Radiologi
-- tidak dikirim sama sekali: bacaannya naratif dan tidak punya kode LOINC per
-- parameter, jadi ia tidak punya bentuk Observation yang sah.
--
-- **Ini ditulis di sini supaya yang membacanya nanti tidak mengira Observation
-- saja sudah cukup.** Ia sah dan diterima, tapi sebuah laporan laboratorium
-- yang utuh di SatuSehat baru ada begitu DiagnosticReport-nya ikut, dan itu
-- menunggu data spesimen yang klinik memang belum pernah dimintai.

alter table public.lab_results
  add column if not exists ihs_observation_id text;

comment on column public.lab_results.ihs_observation_id is
  'Nomor Observation di SatuSehat untuk parameter ini. Menahan kiriman ulang melahirkan Observation kembar, sama seperti visit_charges.ihs_procedure_id.';

-- Indeks parsial: yang dicari pemindai selalu yang BELUM punya nomor, dan
-- jumlahnya mengecil terus seiring yang lama terkirim.
create index if not exists idx_lab_ihs_belum
  on public.lab_results (penunjang_id) where ihs_observation_id is null;
