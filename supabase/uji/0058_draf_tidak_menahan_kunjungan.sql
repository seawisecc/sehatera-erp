-- ============================================================
-- Uji migrasi 0058
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_unit uuid;
  v_jad  uuid;
  v_pas  uuid;
  v_vis  uuid;
  v_trx  uuid;
  v_res  uuid;
  v_stat text;
  v_tgl  date;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_unit from public.clinic_units where company_id = v_co and aktif limit 1;

  -- 1. Kunjungan dengan resep DRAF harus bisa ditutup kasir -------------------
  -- Ini yang dulu menggantung: farmasi tidak melihat draf, kasir tidak boleh
  -- menutup, dan tidak ada tombol yang memaksanya lewat.
  insert into public.patients (company_id, nama) values (v_co, 'UJI DRAF MENAHAN')
    returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Uji draf', 'umum', v_unit, null, v_co) ->> 'id')::uuid;
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');

  -- Diagnosis wajib sebelum kunjungan bisa ditutup (aturan sejak 0018), jadi
  -- ia harus ada di sini supaya yang diuji benar-benar soal drafnya.
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J00', 'Nasofaringitis akut', 'primer');

  insert into public.prescriptions (company_id, visit_id, status)
  values (v_co, v_vis, 'draf');

  insert into public.transactions (company_id, visit_id, total, bayar)
  values (v_co, v_vis, 0, 0) returning id into v_trx;
  perform public.tandai_kunjungan_dibayar(v_vis, v_trx);

  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'selesai' then
    raise exception 'Kunjungan berresep draf tidak tertutup kasir, masih %. Ia akan menggantung selamanya.', v_stat;
  end if;

  -- 2. Resep FINAL tetap menahan, dan itu memang harus --------------------
  -- Kalau yang final ikut lolos, kasir menutup kunjungan sebelum obatnya
  -- diserahkan, dan farmasi kehilangan barisnya.
  insert into public.patients (company_id, nama) values (v_co, 'UJI FINAL MENAHAN')
    returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Uji final', 'umum', v_unit, null, v_co) ->> 'id')::uuid;
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');

  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J00', 'Nasofaringitis akut', 'primer');

  insert into public.prescriptions (company_id, visit_id, status)
  values (v_co, v_vis, 'final');

  insert into public.transactions (company_id, visit_id, total, bayar)
  values (v_co, v_vis, 0, 0) returning id into v_trx;
  perform public.tandai_kunjungan_dibayar(v_vis, v_trx);

  select status into v_stat from public.visits where id = v_vis;
  if v_stat = 'selesai' then
    raise exception 'Kunjungan berresep final ditutup kasir padahal obatnya belum diserahkan.';
  end if;

  -- 3. Reservasi kembar ditolak dengan pesan yang bisa dipakai ----------------
  v_tgl := current_date + 1;
  -- Pakai jadwal yang SUDAH ADA kalau ada. Uji yang selalu menyisipkan jadwal
  -- baru akan menabrak `uq_jadwal_sesi` begitu klinik sungguhan mengisi
  -- jadwalnya, dan yang gagal jadi ujinya, bukan yang diuji.
  select id into v_jad from public.doctor_schedules
   where company_id = v_co and unit_id = v_unit and aktif
     and hari = extract(dow from v_tgl)::smallint
   limit 1;
  if v_jad is null then
    insert into public.doctor_schedules (company_id, unit_id, hari, jam_mulai, jam_selesai, kuota)
    values (v_co, v_unit, extract(dow from v_tgl)::smallint, '21:00', '22:00', 0)
    returning id into v_jad;
  end if;

  insert into public.patients (company_id, nama) values (v_co, 'UJI RESERVASI KEMBAR')
    returning id into v_pas;
  perform public.buat_reservasi('Uji Kembar', v_tgl, v_jad, null, v_pas, p_company => v_co);

  begin
    perform public.buat_reservasi('Uji Kembar', v_tgl, v_jad, null, v_pas, p_company => v_co);
    raise exception 'Reservasi kembar diterima.';
  exception
    when sqlstate 'SH004' then null;
    when unique_violation then
      raise exception 'Reservasi kembar masih keluar sebagai 23505. Yang terbaca petugas: "coba lagi sebentar lagi", dan mencoba lagi tidak akan pernah berhasil.';
  end;

  raise exception 'SEMUA UJI LULUS. Draf tidak lagi menahan kunjungan, yang final tetap menahan, dan reservasi kembar bicara dengan kalimat yang bisa dipakai.';
end $$;
