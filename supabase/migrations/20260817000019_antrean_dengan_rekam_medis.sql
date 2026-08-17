-- ============================================================
-- 0019  Antrean membawa keadaan rekam medisnya
-- ============================================================
--
-- Sesudah 0018, satu kunjungan tidak bisa ditutup tanpa diagnosis. Aturan itu
-- benar, tapi kalau layarnya tidak tahu apa-apa tentangnya, orang baru
-- menemukannya saat menekan tombol terakhir: pasien sudah berdiri hendak
-- pulang, lalu ditolak. Penolakan yang benar pada saat yang salah tetap terasa
-- seperti aplikasi yang rusak.
--
-- Jadi antreannya sendiri yang membawa kabar itu. Kolom yang ditambahkan cuma
-- ditempel di belakang, supaya urutan kolom lama tidak berubah.

create or replace view public.v_antrean_hari_ini as
select
  v.id, v.company_id, v.nomor, v.nomor_antre, v.tanggal, v.status,
  v.keluhan, v.penjamin, v.dokter_email, v.dibuka_pada, v.ditutup_pada,
  p.id   as pasien_id,
  p.nomor_rm,
  p.nama as pasien_nama,
  p.tanggal_lahir,
  p.jenis_kelamin,
  p.alergi,
  p.telepon,
  case when p.tanggal_lahir is null then null
       else extract(year from age(current_date, p.tanggal_lahir))::integer end as umur,
  -- Keterangan yang diminta BPJS P-Care, dibawa ikut supaya formulir rekam
  -- medis terbuka dengan isian yang sudah ada, bukan kosong lagi tiap kali.
  v.jenis_kunjungan,
  v.poli,
  v.no_rujukan,
  v.kesadaran,
  v.status_pulang,
  v.ihs_encounter_id,
  p.ihs_id as pasien_ihs_id,
  -- Keadaan rekam medisnya. Dihitung di sini, bukan dengan satu kueri tambahan
  -- per baris dari peramban: antrean 40 pasien berarti 80 permintaan jaringan
  -- untuk menampilkan dua tanda centang.
  exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_catatan,
  (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::integer as jumlah_diagnosis,
  exists (select 1 from public.visit_vitals t where t.visit_id = v.id) as ada_vital
from public.visits v
join public.patients p on p.id = v.patient_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);

revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
