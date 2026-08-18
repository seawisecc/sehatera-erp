-- ============================================================
-- 0037  Mengembalikan nilai_biaya yang saya hapus sendiri
-- ============================================================
--
-- Migrasi 0035 membuat ulang `v_antrean_hari_ini` dengan DROP lalu CREATE,
-- dan definisi yang saya salin diambil dari migrasi 0023. Padahal migrasi
-- 0024 sudah menambahkan dua kolom ke view itu: `nilai_biaya` dan
-- `transaction_id`. Yang kedua kebetulan saya tulis ulang; yang pertama
-- hilang tanpa jejak.
--
-- Akibatnya bukan kolom kosong, melainkan KUERI GAGAL. Kasir memilih
-- `nilai_biaya` secara eksplisit, jadi PostgREST menolak seluruh kueri dan
-- daftar kunjungan di layar Kasir kosong SELURUHNYA. Bukan cuma satu pasien
-- yang tagihannya tidak kelihatan: tidak ada satu pasien pun yang bisa
-- ditagih. Ditemukan pemilik saat mencari tagihan satu pasien.
--
-- Pelajarannya, dan ini yang membuat saya menulis panjang di sini:
-- **`create or replace view` menolak menggeser kolom, dan itu justru
-- penjaga.** Begitu saya memakai DROP untuk melewatinya, saya kehilangan
-- satu-satunya alat yang akan mengeluh. Menyalin definisi view dari migrasi
-- lama berarti memutar balik SETIAP perubahan yang terjadi sesudahnya, dan
-- tidak ada yang memberi tahu.
--
-- Aturan untuk berikutnya: sebelum DROP lalu CREATE sebuah view, ambil
-- definisi yang SEDANG BERLAKU dari database (`pg_get_viewdef`), bukan dari
-- berkas migrasi mana pun. Berkas migrasi cuma tahu keadaan saat ia ditulis.

drop view if exists public.v_antrean_hari_ini;
create view public.v_antrean_hari_ini as
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
  v.transaction_id
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
