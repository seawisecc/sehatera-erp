-- ============================================================
-- 0078  Baris resep punya tempat menyimpan nomor MedicationRequest-nya
-- ============================================================
--
-- Satu kolom, alasan yang sama dengan `visit_diagnoses.ihs_condition_id` (0073)
-- dan `visit_charges.ihs_procedure_id` (0076): tanpa tempat menyimpan nomor
-- yang dikembalikan SatuSehat, pengiriman ulang melahirkan resep kedua untuk
-- obat yang sama, dan tidak ada cara tahu mana yang sudah berangkat.
--
-- **Per BARIS resep, bukan per resep.** Satu `MedicationRequest` membawa satu
-- obat: pasien yang menerima tiga obat berangkat sebagai tiga kiriman, sama
-- seperti tiga diagnosis jadi tiga Condition. Menyimpannya di
-- `prescriptions` berarti satu nomor untuk tiga kiriman.
--
-- Yang dikirim hanya baris yang produknya punya `kode_kfa`. Yang tanpa kode
-- tidak bisa berangkat sama sekali karena `Medication.code` wajib, dan
-- menebak kode obat dilarang: kode KFA yang salah berarti melaporkan pasien
-- menerima obat yang tidak pernah ia terima.

alter table public.prescription_items
  add column if not exists ihs_medicationrequest_id text;

comment on column public.prescription_items.ihs_medicationrequest_id is
  'Nomor MedicationRequest di SatuSehat untuk baris resep ini. Satu baris satu kiriman, jadi nomornya menempel di sini bukan di prescriptions.';

create index if not exists idx_resep_item_ihs_belum
  on public.prescription_items (prescription_id) where ihs_medicationrequest_id is null;
