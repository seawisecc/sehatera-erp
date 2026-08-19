-- ============================================================
-- Uji migrasi 0048: daftar asuransi dan pendaftaran
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_co2  uuid;
  v_pas  uuid;
  v_unit uuid;
  v_as   uuid;
  v_as2  uuid;
  v_row  jsonb;
  v_n    integer;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_unit from public.clinic_units where company_id = v_co and aktif limit 1;
  select id into v_co2 from public.companies where id <> v_co and deleted_at is null limit 1;

  insert into public.insurers (company_id, nama) values (v_co, 'UJI Allianz') returning id into v_as;

  insert into public.patients (company_id, nama, jenis_kelamin, penjamin, nomor_penjamin)
  values (v_co, 'UJI PENJAMIN', 'L', 'asuransi', '00-PROFIL') returning id into v_pas;

  -- Catatan: `p_company` WAJIB disebut di sini. Di SQL Editor tidak ada sesi,
  -- jadi auth_company_id() bernilai null dan fungsinya menolak. Aplikasinya
  -- tidak perlu menyebutkannya karena sesinya ada.
  -- 1. Yang tidak boleh hilang saat fungsinya disalin ulang --------------
  v_row := public.daftar_kunjungan(v_pas, 'Kontrol', 'asuransi', v_unit,
                                   'dokter.uji@contoh.id', v_co, v_as, '99-POLIS');
  if coalesce(v_row ->> 'nomor', '') = '' then
    raise exception 'Kunjungan tidak dapat nomor. next_doc_number hilang.';
  end if;
  if coalesce(v_row ->> 'nomor_antre', '') = '' then
    raise exception 'Kunjungan tidak dapat nomor ANTREAN. Itu yang dipanggil di ruang tunggu.';
  end if;
  if coalesce(v_row ->> 'petugas_daftar', '') = '' then
    raise exception 'Tidak tercatat siapa yang mendaftarkan.';
  end if;
  if v_row ->> 'poli' is null then
    raise exception 'Nama poli tidak ikut tersimpan.';
  end if;

  -- 2. Yang baru ---------------------------------------------------------
  if (v_row ->> 'asuransi_id') is distinct from v_as::text then
    raise exception 'Penerbit asuransi tidak tersimpan.';
  end if;
  if v_row ->> 'nomor_penjamin' <> '99-POLIS' then
    raise exception 'Nomor polis kunjungan tertimpa profil pasien, dapat %.',
      v_row ->> 'nomor_penjamin';
  end if;
  if v_row ->> 'dokter_email' <> 'dokter.uji@contoh.id' then
    raise exception 'Dokter tujuan tidak tersimpan saat pendaftaran.';
  end if;

  -- 3. Pasien yang sama tidak boleh dua kunjungan terbuka -----------------
  begin
    perform public.daftar_kunjungan(v_pas, null, 'asuransi', v_unit, null, v_co, v_as, null);
    raise exception 'Pasien yang sama bisa didaftarkan dua kali hari ini.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. Asuransi milik faskes LAIN ditolak ---------------------------------
  -- Ini yang paling penting: tanpa penjaga ini, tagihan pasien bisa
  -- berangkat ke rekanan yang bukan rekanan klinik ini.
  if v_co2 is not null then
    insert into public.insurers (company_id, nama) values (v_co2, 'UJI Asuransi Tetangga')
    returning id into v_as2;

    insert into public.patients (company_id, nama, jenis_kelamin)
    values (v_co, 'UJI PENJAMIN DUA', 'P') returning id into v_pas;

    begin
      perform public.daftar_kunjungan(v_pas, null, 'asuransi', v_unit, null, v_co, v_as2, null);
      raise exception 'Asuransi milik faskes lain diterima.';
    exception when sqlstate 'SH004' then null;
    end;
  end if;

  -- 5. Penerbit tanpa penjamin asuransi ditolak ---------------------------
  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'UJI PENJAMIN TIGA', 'L') returning id into v_pas;
  begin
    perform public.daftar_kunjungan(v_pas, null, 'umum', v_unit, null, v_co, v_as, null);
    raise exception 'Penerbit asuransi diterima padahal penjaminnya umum.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 6. Asuransi nonaktif ditolak ------------------------------------------
  update public.insurers set aktif = false where id = v_as;
  begin
    perform public.daftar_kunjungan(v_pas, null, 'asuransi', v_unit, null, v_co, v_as, null);
    raise exception 'Asuransi yang sudah nonaktif masih bisa dipakai.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Nama asuransi tidak boleh kembar di satu faskes ---------------------
  update public.insurers set aktif = true where id = v_as;
  begin
    insert into public.insurers (company_id, nama) values (v_co, 'uji allianz');
    raise exception 'Nama asuransi kembar diterima (beda huruf besar-kecil).';
  exception when unique_violation then null;
  end;

  raise exception 'SEMUA UJI LULUS. Penjamin ikut ke kunjungan, dan asuransi tetangga ditolak.';
end $$;
