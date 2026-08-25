-- ============================================================
-- Data uji SatuSehat sandbox: satu pasien, satu dokter, satu kunjungan
-- ============================================================
--
-- Sandbox SatuSehat hanya mengenali DAFTAR CONTOH yang disediakan Kemenkes:
-- sepuluh NIK pasien dan sepuluh NIK tenaga kesehatan. NIK pasien dan dokter di
-- Klinik Rexco 88 adalah nomor karangan untuk demo, jadi pencarian ke sandbox
-- akan menjawab "tidak ditemukan" untuk semuanya, dan tidak ada satu pun
-- kunjungan yang bisa dikirim.
--
-- Berkas ini menambah SATU pasien dan SATU dokter yang memakai NIK contoh
-- resmi, lalu menjalankan satu kunjungan sampai selesai.
--
-- **Data demo yang sudah ada tidak disentuh sama sekali.** Menempelkan nomor
-- IHS orang lain ke pasien demo yang sudah ada akan lebih cepat, dan itu
-- persis jenis kesalahan yang paling mahal di sistem rekam medis: nomor
-- identitas yang menempel pada orang yang salah terlihat seperti data yang
-- benar. Barisnya sengaja dinamai "(Uji SatuSehat)" supaya siapa pun yang
-- membuka daftar pasien tahu ini bukan pasien sungguhan.
--
-- Idempoten: aman dijalankan berkali-kali.
--
-- Sumber NIK dan nama: dokumentasi resmi SATUSEHAT, halaman Patient dan
-- Practitioner, tabel "Daftar Data untuk Proses Uji Coba/Sandbox(Staging)".

do $$
declare
  v_co    uuid;
  v_unit  uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_stat  text;
  c_email text := 'dr.alexander.uji@rexco.test';
  c_nik_d text := '7209061211900001';   -- dr. Alexander, daftar contoh Kemenkes
  c_nik_p text := '9271060312000001';   -- Ardianto Putra, daftar contoh Kemenkes
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then
    raise exception 'Klinik Rexco 88 tidak ditemukan. Jalankan seed_demo_klinik.sql lebih dulu.';
  end if;

  select id into v_unit from public.clinic_units
   where company_id = v_co and aktif order by urutan limit 1;
  if v_unit is null then
    raise exception 'Belum ada poli di klinik ini.';
  end if;

  -- ── 1. Dokter uji ────────────────────────────────────────────────────────
  -- `app_users` tidak punya indeks unik pada (company_id, email), jadi
  -- `on conflict` tidak bisa dipakai di sini. Diperiksa dulu, baru ditulis.
  if exists (select 1 from public.app_users
              where company_id = v_co and lower(email) = lower(c_email)) then
    update public.app_users
       set nama = 'dr. Alexander (Uji SatuSehat)', nik = c_nik_d, status = 'aktif'
     where company_id = v_co and lower(email) = lower(c_email);
  else
    insert into public.app_users (company_id, email, nama, role, status, nik)
    values (v_co, c_email, 'dr. Alexander (Uji SatuSehat)', 'dokter', 'aktif', c_nik_d);
  end if;

  -- Kolomnya `email`, bukan `dokter_email`: yang bernama `dokter_email` ada di
  -- `visits`, bukan di sini.
  insert into public.unit_doctors (company_id, unit_id, email)
  values (v_co, v_unit, c_email)
  on conflict do nothing;

  -- ── 2. Pasien uji ────────────────────────────────────────────────────────
  select id into v_pas from public.patients where company_id = v_co and nik = c_nik_p limit 1;
  if v_pas is null then
    v_pas := (public.simpan_pasien(null, jsonb_build_object(
      'nama', 'Ardianto Putra (Uji SatuSehat)',
      'nik', c_nik_p,
      'telepon', '081100000001',
      'jenis_kelamin', 'L',
      'tanggal_lahir', '1992-01-09',
      'alamat', 'Alamat uji, bukan alamat sebenarnya'
    ), v_co) ->> 'id')::uuid;
  end if;

  -- ── 3. Kunjungan, dijalankan sampai selesai ──────────────────────────────
  -- Lewat `daftar_kunjungan()`, bukan insert langsung ke `visits`: nomor
  -- antrean, biaya administrasi, dan riwayat keadaan semuanya menempel pada
  -- jalur itu. Riwayat keadaan justru yang paling dibutuhkan di sini, karena
  -- `Encounter.statusHistory` wajib.
  select id into v_vis from public.visits
   where company_id = v_co and patient_id = v_pas and tanggal = current_date limit 1;

  if v_vis is null then
    v_vis := (public.daftar_kunjungan(
      v_pas, 'Uji pengiriman SatuSehat', 'umum', v_unit, c_email, v_co) ->> 'id')::uuid;
  end if;

  select status into v_stat from public.visits where id = v_vis;

  if v_stat = 'terdaftar' then
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    v_stat := 'diperiksa';
  end if;

  -- Diagnosis WAJIB sebelum kunjungan bisa ditutup (aturan database sejak
  -- migrasi 0018), dan ia juga yang akan jadi payload Condition berikutnya.
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J06.9', 'Acute upper respiratory infection, unspecified', 'primer')
  on conflict do nothing;

  -- Tanpa resep, jadi boleh melompat langsung ke selesai (migrasi 0040).
  if v_stat <> 'selesai' then
    perform public.ubah_status_kunjungan(v_vis, 'selesai');
  end if;

  raise notice 'Pasien uji: %  Kunjungan uji: %', v_pas, v_vis;
end $$;
