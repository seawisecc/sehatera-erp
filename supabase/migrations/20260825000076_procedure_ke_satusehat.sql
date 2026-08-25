-- ============================================================
-- 0076  Tindakan punya tempat menyimpan nomor Procedure-nya
-- ============================================================
--
-- Satu kolom, alasan yang sama dengan `visit_diagnoses.ihs_condition_id` di
-- migrasi 0073: tanpa tempat menyimpan nomor yang dikembalikan SatuSehat,
-- pengiriman ulang melahirkan Procedure kedua untuk tindakan yang sama, dan
-- tidak ada cara tahu mana yang sudah berangkat.
--
-- **Hanya baris berjenis `tindakan` yang dikirim, dan hanya yang punya
-- `kode_icd9`.** Biaya administrasi dan tarif konsultasi juga tinggal di tabel
-- ini, tapi keduanya bukan tindakan medis; mengirimnya sebagai Procedure
-- berarti melaporkan bahwa pasien menjalani prosedur bernama "Biaya
-- Administrasi". Yang tanpa kode ICD-9-CM juga tidak dikirim: `Procedure.code`
-- wajib, dan menebak kodenya dilarang di project ini.
--
-- Kode ICD-9-CM-nya sendiri sudah menempel di katalog Layanan sejak migrasi
-- 0025 dan ikut sendiri ke `visit_charges` lewat `simpan_biaya_kunjungan`,
-- jadi tidak ada yang perlu diketik ulang.

alter table public.visit_charges
  add column if not exists ihs_procedure_id text;

comment on column public.visit_charges.ihs_procedure_id is
  'Nomor Procedure di SatuSehat untuk tindakan ini. Menahan kiriman ulang melahirkan Procedure kembar, sama seperti visit_diagnoses.ihs_condition_id.';

create index if not exists idx_charges_ihs_belum
  on public.visit_charges (visit_id) where ihs_procedure_id is null and jenis = 'tindakan';
