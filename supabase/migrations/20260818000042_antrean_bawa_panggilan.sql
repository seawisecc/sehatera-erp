-- ============================================================
-- 0042  Antrean membawa keadaan panggilannya
-- ============================================================
--
-- Migrasi 0041 menambahkan `visits.dipanggil_pada` dan `jumlah_panggil`, lalu
-- layar Kunjungan tidak bisa membacanya: `v_antrean_hari_ini` tidak
-- membawanya. Pola yang sama persis dengan migrasi 0036 dan 0037, dan ini
-- ketiga kalinya. Menambah kolom berarti memeriksa SETIAP pembacanya, pada
-- saat yang sama, bukan nanti.
--
-- Bedanya kali ini: kolomnya ditaruh DI UJUNG, jadi `create or replace view`
-- menerimanya tanpa perlu DROP. DROP-lah yang membuat 0035 kehilangan
-- `nilai_biaya` tanpa ada yang mengeluh.

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
  v.jenis_kunjungan,
  v.poli,
  v.no_rujukan,
  v.kesadaran,
  v.status_pulang,
  v.ihs_encounter_id,
  p.ihs_id as pasien_ihs_id,
  exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_catatan,
  (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::integer as jumlah_diagnosis,
  exists (select 1 from public.visit_vitals t where t.visit_id = v.id) as ada_vital,
  v.unit_id,
  u.nama as unit_nama,
  u.kode as unit_kode,
  (select r.status from public.prescriptions r
    where r.visit_id = v.id
      and r.status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
    order by r.ditulis_pada desc limit 1) as status_resep,
  (select r.id from public.prescriptions r
    where r.visit_id = v.id and r.status <> 'batal'
    order by r.ditulis_pada desc limit 1) as resep_id,
  -- Dari migrasi 0024. Inilah yang hilang.
  coalesce((select sum(c.jumlah * c.harga) from public.visit_charges c
             where c.visit_id = v.id), 0) as nilai_biaya,
  v.transaction_id,
  -- DITAMBAHKAN DI UJUNG, sengaja. `create or replace view` menerima kolom
  -- baru di akhir tanpa perlu DROP, dan DROP-lah yang membuat migrasi 0035
  -- kehilangan `nilai_biaya` diam-diam. Kalau kolom baru bisa ditaruh di
  -- ujung, taruh di ujung.
  v.dipanggil_pada,
  v.jumlah_panggil
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;
alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
