-- ============================================================
-- Uji migrasi 0025 sampai 0029: terminologi ICD
-- ============================================================
--
-- BUKAN migrasi. Berkas di folder ini tidak pernah mengubah apa pun: setiap
-- blok diakhiri `raise exception`, jadi seluruh isinya dibatalkan sebelum
-- selesai. Tempelkan ke SQL Editor SETELAH 0025 sampai 0029 dijalankan.
--
-- Yang benar hanya satu keluaran: galat terakhir berbunyi "SEMUA UJI LULUS".
-- Galat lain, apa pun bunyinya, berarti ada yang belum beres.

do $$
declare
  v_n     bigint;
  v_kode  text;
  v_nama  text;
  v_co    uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_srv   uuid;
  v_hasil text;
begin
  -- 1. Jumlah baris ------------------------------------------------------
  select count(*) into v_n from public.icd10;
  if v_n <> 18543 then
    raise exception 'icd10 berisi % baris, seharusnya 18543. Ada bagian 0026..0028 yang belum dijalankan.', v_n;
  end if;

  select count(*) into v_n from public.icd9cm;
  if v_n <> 4626 then
    raise exception 'icd9cm berisi % baris, seharusnya 4626.', v_n;
  end if;

  select count(*) into v_n from public.icd10_alias;
  if v_n <> 49 then
    raise exception 'icd10_alias berisi % baris, seharusnya 49.', v_n;
  end if;

  -- Tidak ada nama yang kosong. Kalau pemisah "|" pernah salah urai, inilah
  -- yang menangkapnya: kodenya masuk tapi namanya hilang.
  select count(*) into v_n from public.icd10 where coalesce(trim(nama), '') = '';
  if v_n > 0 then raise exception '% baris icd10 tidak punya nama.', v_n; end if;
  select count(*) into v_n from public.icd9cm where coalesce(trim(nama), '') = '';
  if v_n > 0 then raise exception '% baris icd9cm tidak punya nama.', v_n; end if;

  -- Kode yang paling gampang rusak: satu-satunya yang tiga angka di belakang titik.
  if not exists (select 1 from public.icd9cm where kode = '93.960') then
    raise exception 'Kode ICD-9-CM 93.960 hilang. Batas tiga angka di belakang titik tidak terpasang.';
  end if;

  -- 2. Pencarian ---------------------------------------------------------
  -- Kode persis harus jadi hasil PERTAMA, bukan sekadar ada di daftar.
  select kode into v_kode from public.cari_icd10('J06.9', 10) limit 1;
  if v_kode <> 'J06.9' then
    raise exception 'Cari kode persis J06.9 malah mendahulukan %.', v_kode;
  end if;

  -- Awalan kode: "J06" harus memunculkan turunannya.
  select count(*) into v_n from public.cari_icd10('J06', 20);
  if v_n < 2 then raise exception 'Cari awalan J06 cuma dapat % baris.', v_n; end if;

  -- Alias Indonesia. Ini yang paling penting: tanpa ini daftar 18 ribu baris
  -- justru lebih susah dipakai daripada 49 baris yang barusan diganti.
  select kode into v_kode from public.cari_icd10('demam tifoid', 5) limit 1;
  if v_kode is distinct from 'A01.0' then
    raise exception 'Cari alias "demam tifoid" dapat %, seharusnya A01.0.', coalesce(v_kode, '(kosong)');
  end if;

  -- Nama resmi bahasa Inggris tetap bisa dicari.
  select count(*) into v_n from public.cari_icd10('typhoid', 10);
  if v_n < 1 then raise exception 'Cari nama resmi "typhoid" tidak dapat apa-apa.'; end if;

  -- Alias ikut terbawa di hasil, supaya layar bisa menampilkan nama Indonesia.
  select nama_id into v_nama from public.cari_icd10('A01.0', 5) limit 1;
  if coalesce(v_nama, '') = '' then
    raise exception 'Hasil A01.0 tidak membawa nama_id, alias tidak terbaca.';
  end if;

  -- Kosong harus mengembalikan kosong, bukan seluruh 18.543 baris.
  select count(*) into v_n from public.cari_icd10('', 20);
  if v_n <> 0 then raise exception 'Cari dengan kata kosong mengembalikan % baris.', v_n; end if;
  select count(*) into v_n from public.cari_icd10('   ', 20);
  if v_n <> 0 then raise exception 'Cari dengan spasi saja mengembalikan % baris.', v_n; end if;

  -- Batas atas dijaga, walau pemanggil meminta lebih.
  select count(*) into v_n from public.cari_icd10('a', 9999);
  if v_n > 50 then raise exception 'Batas hasil tembus: % baris.', v_n; end if;

  -- ICD-9-CM.
  select kode into v_kode from public.cari_icd9('93.960', 5) limit 1;
  if v_kode <> '93.960' then raise exception 'cari_icd9 gagal menemukan 93.960.'; end if;
  select count(*) into v_n from public.cari_icd9('ultrasound', 10);
  if v_n < 1 then raise exception 'cari_icd9 gagal mencari lewat nama.'; end if;

  -- 3. Penandaan terverifikasi ------------------------------------------
  select id into v_co from public.companies where sektor in ('klinik', 'rumah_sakit') limit 1;
  if v_co is null then
    raise notice 'Tidak ada faskes klinik, uji trigger dan tagihan dilewati.';
  else
    insert into public.patients (company_id, nama, jenis_kelamin)
    values (v_co, 'UJI TERMINOLOGI', 'L') returning id into v_pas;

    insert into public.visits (company_id, patient_id, status)
    values (v_co, v_pas, 'terdaftar') returning id into v_vis;

    -- Kode yang ADA di daftar e-klaim.
    insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
    values (v_co, v_vis, 'A01.0', 'Demam tifoid', 'primer');
    if not (select terverifikasi from public.visit_diagnoses
             where visit_id = v_vis and kode_icd10 = 'A01.0') then
      raise exception 'A01.0 ada di daftar tapi ditandai tidak terverifikasi.';
    end if;

    -- Kode yang bentuknya sah tapi TIDAK ada di daftar. Harus tetap masuk,
    -- cuma ditandai. Kalau baris ini gagal, palangnya terlalu keras dan ada
    -- dokter yang tidak bisa menutup kunjungannya.
    --
    -- U99.9 dipilih sesudah dicek: ia memang tidak ada di berkas Kemenkes.
    -- Tebakan pertama saya Z99.9, dan itu ternyata ADA. Kalau uji ini memakai
    -- kode yang ternyata sah, ia akan gagal dan menuduh trigger-nya rusak.
    insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
    values (v_co, v_vis, 'U99.9', 'Kode karangan', 'sekunder');
    if (select terverifikasi from public.visit_diagnoses
         where visit_id = v_vis and kode_icd10 = 'U99.9') then
      raise exception 'U99.9 tidak ada di daftar tapi ditandai terverifikasi.';
    end if;

    -- 4. Kode tindakan ikut dari katalog --------------------------------
    insert into public.services (company_id, nama, harga, kode_icd9)
    values (v_co, 'UJI Tindakan', 50000, '93.83') returning id into v_srv;

    perform public.simpan_biaya_kunjungan(v_vis, jsonb_build_array(
      jsonb_build_object('jenis', 'tindakan', 'service_id', v_srv,
                         'nama', 'UJI Tindakan', 'jumlah', 1, 'harga', 50000)));

    select kode_icd9 into v_kode from public.visit_charges
     where visit_id = v_vis and service_id = v_srv;
    if v_kode is distinct from '93.83' then
      raise exception 'Kode ICD-9 tidak ikut dari katalog, dapat %.', coalesce(v_kode, '(kosong)');
    end if;

    -- Kode yang dikirim pemanggil harus MENANG atas katalog.
    perform public.simpan_biaya_kunjungan(v_vis, jsonb_build_array(
      jsonb_build_object('jenis', 'tindakan', 'service_id', v_srv,
                         'nama', 'UJI Tindakan', 'jumlah', 1, 'harga', 50000,
                         'kode_icd9', '89.52')));
    select kode_icd9 into v_kode from public.visit_charges
     where visit_id = v_vis and service_id = v_srv;
    if v_kode is distinct from '89.52' then
      raise exception 'Kode dari pemanggil kalah oleh katalog, dapat %.', coalesce(v_kode, '(kosong)');
    end if;

    -- Pelaksana tindakan: kalau tidak disebut, jatuh ke dokter kunjungan.
    update public.visits set dokter_email = 'dokter.uji@contoh.id' where id = v_vis;
    perform public.simpan_biaya_kunjungan(v_vis, jsonb_build_array(
      jsonb_build_object('jenis', 'tindakan', 'service_id', v_srv,
                         'nama', 'UJI Tindakan', 'jumlah', 1, 'harga', 50000)));
    select dikerjakan_oleh into v_hasil from public.visit_charges
     where visit_id = v_vis and service_id = v_srv;
    if v_hasil is distinct from 'dokter.uji@contoh.id' then
      raise exception 'Pelaksana tindakan tidak jatuh ke dokter kunjungan, dapat %.', coalesce(v_hasil, '(kosong)');
    end if;

    -- 5. Bentuk kode tindakan ditolak kalau ngawur ----------------------
    begin
      update public.services set kode_icd9 = 'ABC' where id = v_srv;
      raise exception 'Kode ICD-9 "ABC" diterima, padahal bentuknya salah.';
    exception when check_violation then null;
    end;
  end if;

  raise exception 'SEMUA UJI LULUS. Seluruh perubahan di atas dibatalkan, tidak ada baris uji yang tertinggal.';
end $$;
