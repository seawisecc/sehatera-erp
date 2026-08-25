-- ============================================================
-- 0073  Jejak pengiriman SatuSehat: apa yang sudah dicari, apa yang sudah dikirim
-- ============================================================
--
-- Empat kolom, dan semuanya lahir dari hal yang sama: **kosong tidak pernah
-- bisa membedakan "belum dicoba" dari "sudah dicoba, jawabannya memang tidak
-- ada".** Selama bedanya tidak tercatat, orang akan mengulang pekerjaan yang
-- jawabannya sudah didapat, dan layar tidak punya cara mengatakan sudah selesai.
--
-- **1 & 2. `ihs_dicari_pada` di `patients` dan `app_users`.**
-- Pencarian ke MPI adalah panggilan HTTP ke Kemenkes per orang. Pasien yang
-- NIK-nya belum terdaftar di sana akan menjawab "tidak ditemukan" hari ini,
-- besok, dan bulan depan, sementara ia terus menempati batch dan menghabiskan
-- kuota panggilan. Yang dicatat WAKTU-nya, bukan penanda boolean: jawaban
-- "tidak ada" pada akhirnya bisa berubah (bayi yang baru punya NIK), jadi yang
-- dibutuhkan adalah "sudah pernah dicari, kapan", bukan "sudah selesai".
--
-- **3. `visit_diagnoses.ihs_condition_id`.**
-- Tempat menyimpan nomor Condition yang dikembalikan SatuSehat. Tanpa ini,
-- `Encounter.diagnosis[i].condition` tidak punya yang bisa ditunjuk, dan
-- pengiriman ulang akan melahirkan Condition kedua untuk diagnosis yang sama.
--
-- **4. `visits.ihs_final_pada`.**
-- Menandai Encounter yang sudah DIPERBARUI jadi `finished` beserta
-- diagnosisnya. Berbeda dari `ihs_encounter_id`, yang cuma berarti Encounter-nya
-- sudah lahir. Dua kejadian yang berbeda menuntut dua penanda; satu penanda
-- untuk dua kejadian adalah cara kehilangan salah satunya.
--
-- Kenapa ini perlu: SatuSehat menolak Encounter tanpa `Encounter.diagnosis`
-- (RuleNumber 10457), sedangkan `Condition.encounter` wajib menunjuk balik ke
-- Encounter. Lingkaran itu dipecahkan dengan mengikuti kunjungannya: Encounter
-- lahir saat pendaftaran, Condition menyusul saat diagnosis ditegakkan, lalu
-- Encounter DIPERBARUI saat kunjungan ditutup.

alter table public.patients
  add column if not exists ihs_dicari_pada timestamptz;
comment on column public.patients.ihs_dicari_pada is
  'Kapan terakhir NIK ini dicari ke MPI SatuSehat. Membedakan "belum dicoba" dari "sudah dicoba, tidak ketemu", yang tidak bisa dibedakan dari ihs_id yang sama-sama kosong.';

alter table public.app_users
  add column if not exists ihs_dicari_pada timestamptz;
comment on column public.app_users.ihs_dicari_pada is
  'Kapan terakhir NIK tenaga kesehatan ini dicari ke SatuSehat. Lihat alasan yang sama di patients.ihs_dicari_pada.';

alter table public.visit_diagnoses
  add column if not exists ihs_condition_id text;
comment on column public.visit_diagnoses.ihs_condition_id is
  'Nomor Condition di SatuSehat untuk diagnosis ini. Dipakai Encounter.diagnosis[i].condition, dan menahan kiriman ulang melahirkan Condition kembar.';

alter table public.visits
  add column if not exists ihs_final_pada timestamptz;
comment on column public.visits.ihs_final_pada is
  'Kapan Encounter di SatuSehat diperbarui jadi finished beserta diagnosisnya. BEDA dari ihs_encounter_id, yang cuma berarti Encounter-nya sudah lahir.';

-- Mempercepat pemindaian "mana yang belum". Parsial, karena yang sudah selesai
-- tidak pernah ikut dicari lagi dan tidak perlu ikut menempati indeksnya.
create index if not exists idx_patients_ihs_belum
  on public.patients (company_id, ihs_dicari_pada) where ihs_id is null;

create index if not exists idx_visits_ihs_belum_final
  on public.visits (company_id, status) where ihs_final_pada is null;
