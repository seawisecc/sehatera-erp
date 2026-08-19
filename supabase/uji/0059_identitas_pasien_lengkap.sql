-- ============================================================
-- Uji migrasi 0059: identitas pasien
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co  uuid;
  v_out jsonb;
  v_id  uuid;
  v_row record;
  v_n   integer;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;

  -- 1. NIK wajib -------------------------------------------------------------
  begin
    perform public.simpan_pasien(null,
      jsonb_build_object('nama', 'UJI TANPA NIK', 'telepon', '08123456789'), v_co);
    raise exception 'Pasien tanpa NIK diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 2. Telepon wajib ---------------------------------------------------------
  begin
    perform public.simpan_pasien(null,
      jsonb_build_object('nama', 'UJI TANPA TELEPON', 'nik', '5171010101900001'), v_co);
    raise exception 'Pasien tanpa telepon diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. NIK setengah tetap ditolak --------------------------------------------
  -- NIK setengah benar lebih berbahaya daripada NIK kosong: ia terlihat
  -- seperti data dan ikut terkirim ke SatuSehat.
  begin
    perform public.simpan_pasien(null,
      jsonb_build_object('nama', 'UJI NIK PENDEK', 'nik', '5171', 'telepon', '08123456789'), v_co);
    raise exception 'NIK empat angka diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. Pintu daruratnya ADA, dan MENUNTUT alasan -----------------------------
  begin
    perform public.simpan_pasien(null,
      jsonb_build_object('nama', 'UJI DARURAT TANPA ALASAN', 'identitas_belum_lengkap', true), v_co);
    raise exception 'Identitas belum lengkap diterima tanpa alasan. Petugas akan memakainya untuk semua orang.';
  exception when sqlstate 'SH004' then null;
  end;

  v_out := public.simpan_pasien(null, jsonb_build_object(
    'nama', 'UJI PASIEN DARURAT',
    'identitas_belum_lengkap', true,
    'alasan_identitas', 'Tidak sadarkan diri, tanpa kartu identitas'), v_co);
  if (v_out ->> 'id') is null then
    raise exception 'Pasien gawat darurat tidak bisa didaftarkan sama sekali. Ia akan didaftarkan dengan NIK karangan.';
  end if;
  if (v_out ->> 'nomor_rm') is null then
    raise exception 'Pasien darurat tidak dapat nomor rekam medis.';
  end if;

  -- Alasannya masuk jejak audit, bukan cuma tersimpan di barisnya.
  select count(*) into v_n from public.audit_logs
   where entity = 'patients' and entity_id = (v_out ->> 'id')
     and detail ->> 'alasan' = 'Tidak sadarkan diri, tanpa kartu identitas';
  if v_n = 0 then
    raise exception 'Alasan identitas tidak masuk jejak audit.';
  end if;

  -- 5. Yang lengkap tersimpan seluruhnya -------------------------------------
  v_out := public.simpan_pasien(null, jsonb_build_object(
    'nama', 'UJI PASIEN LENGKAP',
    'nik', '5171010101900002',
    'telepon', '08123450001',
    'tempat_lahir', 'Denpasar',
    'agama', 'Hindu',
    'pekerjaan', 'Petani',
    'pendidikan', 'SMA',
    'status_kawin', 'kawin',
    'kewarganegaraan', 'WNI',
    'rt', '003', 'rw', '004',
    'kelurahan', 'Ubung', 'kecamatan', 'Denpasar Utara',
    'kota', 'Denpasar', 'provinsi', 'Bali', 'kode_pos', '80116',
    'nomor_bpjs', '0001234567890',
    'nomor_polis', 'POL-UJI-1',
    'kerabat_nama', 'Ni Made Uji',
    'kerabat_hubungan', 'Istri',
    'kerabat_telepon', '08123450002',
    'kerabat_alamat', 'Alamat yang sama'), v_co);
  v_id := (v_out ->> 'id')::uuid;

  select * into v_row from public.patients where id = v_id;
  if v_row.kerabat_nama is null or v_row.kerabat_telepon is null then
    raise exception 'Data kerabat tidak tersimpan.';
  end if;
  if v_row.kelurahan is null or v_row.provinsi is null then
    raise exception 'Alamat berkolom tidak tersimpan.';
  end if;
  if v_row.nomor_bpjs is null or v_row.nomor_polis is null then
    raise exception 'Nomor kartu tidak tersimpan.';
  end if;
  if v_row.identitas_belum_lengkap then
    raise exception 'Pasien lengkap malah ditandai belum lengkap.';
  end if;

  -- 6. Satu orang boleh punya BPJS SEKALIGUS asuransi -------------------------
  -- Ini seluruh alasan nomor kartunya dipisah dari status penjamin.
  if v_row.nomor_bpjs is not null and v_row.nomor_polis is not null then
    null;
  else
    raise exception 'Satu pasien tidak bisa membawa dua nomor kartu sekaligus.';
  end if;

  -- 7. Status kawin di luar daftar ditolak ------------------------------------
  begin
    update public.patients set status_kawin = 'entah' where id = v_id;
    raise exception 'Status kawin asing diterima.';
  exception when check_violation then null;
  end;

  -- 8. Menyunting boleh mencabut penanda darurat ------------------------------
  -- Pasien yang sudah sadar dan keluarganya membawa KTP harus bisa dilengkapi,
  -- dan penandanya harus ikut hilang. Kalau tidak, penanda itu menempel
  -- selamanya dan berhenti berarti apa pun.
  perform public.simpan_pasien(v_id, jsonb_build_object(
    'nama', 'UJI PASIEN LENGKAP', 'nik', '5171010101900002', 'telepon', '08123450001'), v_co);
  select * into v_row from public.patients where id = v_id;
  if v_row.identitas_belum_lengkap or v_row.alasan_identitas is not null then
    raise exception 'Penanda darurat tidak bisa dicabut.';
  end if;

  -- 9. NIK kembar ditolak dengan kalimat yang bisa dipakai --------------------
  begin
    perform public.simpan_pasien(null, jsonb_build_object(
      'nama', 'UJI NIK KEMBAR', 'nik', '5171010101900002', 'telepon', '08123450003'), v_co);
    raise exception 'NIK kembar diterima.';
  exception
    when sqlstate 'SH004' then null;
    when unique_violation then
      raise exception 'NIK kembar keluar sebagai 23505, bukan kalimat yang bisa dibaca petugas.';
  end;

  raise exception 'SEMUA UJI LULUS. Identitas wajib, pintu daruratnya ada dan berjejak, dan satu orang boleh punya dua kartu.';
end $$;
