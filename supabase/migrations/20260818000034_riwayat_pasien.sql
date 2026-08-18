-- ============================================================
-- 0034  Riwayat kunjungan satu pasien
-- ============================================================
--
-- Lubang yang ditemukan saat pemilik bertanya "di mana menu rekam medis".
-- Jawabannya waktu itu: tidak ada, dan bukan cuma menunya yang tidak ada.
--
-- Layar Kunjungan hanya membaca `v_antrean_hari_ini`, jadi isinya HARI INI
-- saja. Layar Pasien menjanjikan "identitas dan riwayat kunjungan" di
-- subjudulnya, tapi mengklik pasien cuma membuka form ubah identitas.
--
-- Akibatnya begitu hari berganti, SOAP, tanda vital, diagnosis, dan resep
-- yang sudah tercatat TIDAK BISA DIBUKA LAGI lewat aplikasi. Datanya utuh di
-- database, cuma tidak punya pintu.
--
-- Itu menghapus alasan utama orang memakai rekam medis elektronik: dokter
-- ingin tahu apa yang terjadi kunjungan lalu. Dan rekam medis yang tidak bisa
-- ditampilkan kembali juga bermasalah menurut aturan, bukan cuma tidak enak
-- dipakai.
--
-- Yang ditambahkan cuma PINTUNYA. Isinya sudah ada sejak migrasi 0018, dan
-- komponen RekamMedis pun sudah tahu cara menampilkan kunjungan tertutup
-- sebagai bacaan yang hanya bisa ditambahi adendum.

/**
 * Seluruh kunjungan satu pasien, terbaru di atas.
 *
 * Ringkasan saja, bukan isi rekam medisnya: yang dibutuhkan layar daftar
 * adalah kapan, di poli mana, oleh siapa, dan diagnosis apa. Isi lengkapnya
 * diambil `rekam_medis()` saat satu baris benar-benar dibuka. Kalau
 * seluruhnya dikirim sekaligus, pasien lama dengan 40 kunjungan mengirim 40
 * rekam medis lengkap untuk menampilkan 40 baris tanggal.
 *
 * Diagnosis PRIMER ikut karena itu yang dicari orang saat menelusuri riwayat,
 * dan karena satu kunjungan dijamin cuma punya satu (indeks unik parsial di
 * migrasi 0018).
 */
create or replace function public.riwayat_pasien(p_pasien uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_pasien record;
  v_hasil  jsonb;
begin
  -- Penyaringnya di sini, bukan di kueri pemanggil. Fungsi security definer
  -- yang menerima id pasien sebagai argumen tanpa memeriksa pemiliknya bisa
  -- dipakai membaca rekam medis faskes lain satu per satu, dan itu justru
  -- jenis kebocoran yang paling gampang tidak disadari. Aturan yang sama
  -- ditulis di CLAUDE.md untuk company_quota dan kawan-kawannya.
  select p.* into v_pasien
    from public.patients p
   where p.id = p_pasien
     and (public.boleh_admin_platform() or p.company_id = public.auth_company_id());
  if not found then
    raise exception 'Pasien tidak ditemukan.' using errcode = 'SH004';
  end if;

  select jsonb_build_object(
    'pasien', jsonb_build_object(
      'id', v_pasien.id, 'nama', v_pasien.nama, 'nomor_rm', v_pasien.nomor_rm,
      'nik', v_pasien.nik, 'tanggal_lahir', v_pasien.tanggal_lahir,
      'jenis_kelamin', v_pasien.jenis_kelamin, 'alergi', v_pasien.alergi,
      'penjamin', v_pasien.penjamin),
    'kunjungan', coalesce((
      select jsonb_agg(x order by x.tanggal desc, x.dibuka_pada desc)
      from (
        select
          v.id, v.nomor, v.nomor_antre, v.tanggal, v.status, v.keluhan,
          v.dibuka_pada, v.ditutup_pada, v.dokter_email, v.penjamin,
          v.poli, v.no_rujukan, v.status_pulang, v.jenis_kunjungan, v.kesadaran,
          u.nama as unit_nama,
          (select jsonb_build_object('kode', d.kode_icd10, 'nama', d.nama,
                                     'terverifikasi', d.terverifikasi)
             from public.visit_diagnoses d
            where d.visit_id = v.id and d.tipe = 'primer' limit 1) as diagnosis,
          (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::int
            as jumlah_diagnosis,
          (select count(*) from public.prescriptions r
            where r.visit_id = v.id and r.status <> 'batal')::int as jumlah_resep,
          (select count(*) from public.visit_addenda a where a.visit_id = v.id)::int
            as jumlah_adendum,
          exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_soap,
          exists (select 1 from public.visit_vitals w where w.visit_id = v.id) as ada_vital
        from public.visits v
        left join public.clinic_units u on u.id = v.unit_id
        where v.patient_id = p_pasien
      ) x), '[]'::jsonb)
  ) into v_hasil;

  return v_hasil;
end;
$$;

revoke all on function public.riwayat_pasien(uuid) from public, anon;
grant execute on function public.riwayat_pasien(uuid) to authenticated;
