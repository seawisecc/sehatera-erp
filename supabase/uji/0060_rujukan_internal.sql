-- ============================================================
-- Uji migrasi 0060: rujukan internal
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co    uuid;
  v_u1    uuid;
  v_u2    uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_stat  text;
  v_antre text;
  v_n     integer;
  v_rm    jsonb;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_u1 from public.clinic_units where company_id = v_co and aktif and tarif_konsultasi > 0 order by urutan limit 1;
  select id into v_u2 from public.clinic_units where company_id = v_co and aktif and tarif_konsultasi > 0 and id <> v_u1 order by urutan limit 1;
  if v_u1 is null or v_u2 is null then
    raise exception 'Butuh dua poli bertarif untuk menguji rujukan.';
  end if;

  insert into public.patients (company_id, nama) values (v_co, 'UJI RUJUKAN INTERNAL')
    returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Nyeri dada', 'umum', v_u1, null, v_co) ->> 'id')::uuid;
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');

  -- Dokter pertama menulis SOAP-nya.
  perform public.simpan_rekam_medis(v_vis,
    jsonb_build_object('subjektif', 'Nyeri dada sejak pagi', 'asesmen', 'Curiga angina'));

  -- 1. Alasan wajib ----------------------------------------------------------
  begin
    perform public.rujuk_internal(v_vis, v_u2, '   ');
    raise exception 'Rujukan tanpa alasan diterima. Dokter yang menerima tidak akan tahu kenapa pasien ini dikirim.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 2. Merujuk ke poli sendiri ditolak ---------------------------------------
  begin
    perform public.rujuk_internal(v_vis, v_u1, 'Uji');
    raise exception 'Merujuk ke poli yang sama diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Merujuk memindahkan poli, dokter, nomor antrean, dan keadaan ----------
  perform public.rujuk_internal(v_vis, v_u2, 'Perlu dinilai spesialis', null, 'EKG terlampir');

  select status, nomor_antre into v_stat, v_antre from public.visits where id = v_vis;
  if v_stat <> 'terdaftar' then
    raise exception 'Kunjungan yang dirujuk berstatus %, seharusnya terdaftar. Ia akan hilang dari papan dan pasiennya menunggu panggilan yang tidak datang.', v_stat;
  end if;
  select count(*) into v_n from public.visits where id = v_vis and unit_id = v_u2;
  if v_n <> 1 then raise exception 'Poli kunjungan tidak berpindah.'; end if;
  if v_antre !~ ('^' || (select upper(kode) from public.clinic_units where id = v_u2) || '-') then
    raise exception 'Nomor antrean % bukan deret poli tujuan.', v_antre;
  end if;

  -- Panggilan lama dinolkan: pasien ini belum dipanggil di poli barunya.
  select count(*) into v_n from public.visits
   where id = v_vis and coalesce(jumlah_panggil, 0) = 0 and dipanggil_pada is null;
  if v_n <> 1 then
    raise exception 'Penanda panggilan tidak dinolkan, jadi papan menganggapnya sudah dipanggil di poli baru.';
  end if;

  -- 4. Jejaknya tersimpan ----------------------------------------------------
  select count(*) into v_n from public.visit_referrals
   where visit_id = v_vis and dari_unit = v_u1 and ke_unit = v_u2
     and alasan = 'Perlu dinilai spesialis';
  if v_n <> 1 then raise exception 'Jejak rujukan tidak tersimpan.'; end if;

  -- 5. Dokter kedua menulis SOAP SENDIRI, tidak menimpa ----------------------
  -- Ini inti migrasi ini.
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
  perform public.simpan_rekam_medis(v_vis,
    jsonb_build_object('subjektif', 'Rujukan dari poli sebelumnya', 'asesmen', 'Angina pektoris stabil'));

  select count(*) into v_n from public.visit_notes where visit_id = v_vis;
  if v_n <> 2 then
    raise exception 'Ada % catatan SOAP, seharusnya 2. Dokter kedua menimpa tulisan dokter pertama.', v_n;
  end if;
  select count(*) into v_n from public.visit_notes
   where visit_id = v_vis and subjektif = 'Nyeri dada sejak pagi';
  if v_n <> 1 then
    raise exception 'Catatan dokter pertama hilang.';
  end if;

  -- 6. Rekam medis memberi catatan poli sekarang DAN yang sebelumnya ---------
  v_rm := public.rekam_medis(v_vis);
  if v_rm -> 'soap' ->> 'asesmen' <> 'Angina pektoris stabil' then
    raise exception 'Yang tampil sebagai catatan berjalan bukan catatan poli yang sedang memeriksa: %', v_rm -> 'soap';
  end if;
  if jsonb_array_length(v_rm -> 'soap_lain') <> 1 then
    raise exception 'Catatan poli sebelumnya tidak ikut terbaca.';
  end if;
  if jsonb_array_length(v_rm -> 'rujukan') <> 1 then
    raise exception 'Jejak rujukan tidak ikut di rekam medis.';
  end if;

  -- 7. Konsultasi ditagih DUA kali, satu per poli ----------------------------
  select count(*) into v_n from public.visit_charges
   where visit_id = v_vis and jenis = 'konsultasi';
  if v_n <> 2 then
    raise exception 'Ada % baris konsultasi, seharusnya 2. Konsultasi spesialis tidak tertagih.', v_n;
  end if;

  -- 8. Administrasi TETAP sekali --------------------------------------------
  select count(*) into v_n from public.visit_charges
   where visit_id = v_vis and jenis = 'administrasi';
  if v_n <> 1 then
    raise exception 'Ada % baris administrasi, seharusnya 1. Pasien ditagih pendaftaran dua kali untuk satu kedatangan.', v_n;
  end if;

  -- 9. Mundur-maju di poli yang SAMA tetap tidak menagih ulang ---------------
  -- Ini yang dijaga indeks unik sejak 0024, dan tidak boleh hilang karena
  -- indeksnya sekarang berkunci poli.
  perform public.ubah_status_kunjungan(v_vis, 'terdaftar');
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
  select count(*) into v_n from public.visit_charges
   where visit_id = v_vis and jenis = 'konsultasi';
  if v_n <> 2 then
    raise exception 'Mundur lalu maju lagi menagih konsultasi ulang: sekarang % baris.', v_n;
  end if;

  -- 10. Tetap SATU kunjungan, jadi satu tagihan ------------------------------
  select count(*) into v_n from public.visits
   where patient_id = v_pas and tanggal = current_date;
  if v_n <> 1 then
    raise exception 'Rujukan melahirkan % kunjungan. Pasiennya akan antre dua kali di kasir.', v_n;
  end if;

  -- 11. Kunjungan yang sudah ditutup tidak bisa dirujuk ----------------------
  update public.visits set status = 'batal' where id = v_vis;
  begin
    perform public.rujuk_internal(v_vis, v_u1, 'Uji');
    raise exception 'Kunjungan yang sudah ditutup masih bisa dirujuk.';
  exception when sqlstate 'SH004' then null;
  end;

  raise exception 'SEMUA UJI LULUS. Satu kunjungan, dua poli, dua catatan SOAP, dua tarif konsultasi, satu biaya administrasi.';
end $$;
