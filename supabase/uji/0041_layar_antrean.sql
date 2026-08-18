-- ============================================================
-- Uji migrasi 0041: layar antrean ruang tunggu
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co    uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_token text;
  v_hasil jsonb;
  v_baris jsonb;
  v_lama  text;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;

  select token_antrean into v_lama from public.settings where company_id = v_co;

  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'Nyoman Rai Sudiartha', 'L') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status, nomor_antre)
  values (v_co, v_pas, 'terdaftar', 'U-999') returning id into v_vis;

  -- 1. Bentuk tokennya -----------------------------------------------------
  -- `token_antrean_saya()` mengambil fasilitas dari SESI lewat
  -- auth_company_id(), dan di SQL Editor tidak ada sesi. Itu memang benar
  -- untuk aplikasinya, jadi yang diuji di sini sifat fungsinya, bukan
  -- panggilannya.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'token_antrean_saya'
       and pg_get_functiondef(p.oid) like '%gen_random_bytes%'
       and pg_get_functiondef(p.oid) like '%auth_company_id%') then
    raise exception 'token_antrean_saya tidak membangkitkan token acak dari fasilitas si pemanggil.';
  end if;

  -- Tokennya dipasang langsung di sini, karena seluruh blok ini dibatalkan
  -- di akhir dan token asli klinik tidak ikut berubah.
  v_token := encode(gen_random_bytes(24), 'hex');
  update public.settings set token_antrean = v_token where company_id = v_co;

  if length(v_token) < 32 then
    raise exception 'Token terlalu pendek: %.', v_token;
  end if;
  if v_token = v_co::text then
    raise exception 'Token sama dengan id fasilitas. Kunci yang sama dengan pengenal bukan kunci.';
  end if;

  -- 2. Token salah ditolak -----------------------------------------------
  begin
    perform public.layar_antrean('token-karangan');
    raise exception 'Token karangan diterima.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.layar_antrean('');
    raise exception 'Token kosong diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Isi layar -----------------------------------------------------------
  v_hasil := public.layar_antrean(v_token);
  select x into v_baris
    from jsonb_array_elements(v_hasil -> 'antrean') x
   where x ->> 'nomor_antre' = 'U-999';
  if v_baris is null then raise exception 'Nomor antrean uji tidak muncul di layar.'; end if;

  -- 4. Nama DISAMARKAN di database, bukan di peramban ---------------------
  -- Inti keamanan migrasi ini: yang tidak boleh ditampilkan tidak boleh
  -- ikut terkirim.
  if v_baris ->> 'nama' <> 'Nyoman R.' then
    raise exception 'Nama tidak disamarkan, dapat "%". Nama lengkap tidak boleh melewati jaringan ke televisi ruang tunggu.',
      v_baris ->> 'nama';
  end if;

  -- 5. Yang tidak boleh ikut ke ruang tunggu -------------------------------
  for v_baris in select x from jsonb_array_elements(v_hasil -> 'antrean') x loop
    if v_baris ? 'nomor_rm' or v_baris ? 'nik' or v_baris ? 'keluhan'
       or v_baris ? 'diagnosis' or v_baris ? 'telepon' or v_baris ? 'alergi' then
      raise exception 'Layar ruang tunggu membawa data yang tidak boleh dipajang: %', v_baris;
    end if;
  end loop;

  -- 6. Memanggil nomor ----------------------------------------------------
  perform public.panggil_antrean(v_vis);
  select jumlah_panggil into strict v_lama from public.visits where id = v_vis;
  if v_lama::integer <> 1 then raise exception 'Panggilan pertama tidak tercatat.'; end if;
  perform public.panggil_antrean(v_vis);
  select jumlah_panggil into strict v_lama from public.visits where id = v_vis;
  if v_lama::integer <> 2 then raise exception 'Panggilan kedua tidak menambah hitungan.'; end if;

  -- Yang sudah ditutup tidak bisa dipanggil lagi. Diagnosis harus ada dulu:
  -- kunjungan tidak bisa ditutup tanpa itu (trigger dari migrasi 0018), dan
  -- percobaan pertama uji ini melupakannya.
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J06.9', 'Infeksi saluran napas atas akut', 'primer');
  update public.visits set status = 'selesai', ditutup_pada = now() where id = v_vis;
  begin
    perform public.panggil_antrean(v_vis);
    raise exception 'Kunjungan yang sudah selesai masih bisa dipanggil.';
  exception when sqlstate 'SH004' then null;
  end;

  -- Dan hilang dari layar.
  v_hasil := public.layar_antrean(v_token);
  if exists (select 1 from jsonb_array_elements(v_hasil -> 'antrean') x
              where x ->> 'nomor_antre' = 'U-999') then
    raise exception 'Kunjungan yang sudah selesai masih dipajang di ruang tunggu.';
  end if;

  raise exception 'SEMUA UJI LULUS. Layar ruang tunggu cuma tahu nomor antrean, dan namanya sudah disamarkan sebelum dikirim.';
end $$;
