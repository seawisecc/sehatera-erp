-- ============================================================
-- Data contoh Klinik Rexco 88, bagian 2: pasien dan kejadian hari ini
-- ============================================================
--
-- Dijalankan SESUDAH bagian 1. Idempoten dan hanya menyentuh Klinik Rexco 88.
--
-- Yang dibuat sengaja menyebar ke seluruh keadaan, termasuk yang tidak
-- menyenangkan: pemeriksaan cito yang belum dikerjakan, hasil lab bertanda
-- kritis, resep yang masih draf, dan pasien yang dirujuk antar poli. Data uji
-- yang semuanya rapi tidak pernah menunjukkan layar mana yang belum siap.

do $$
declare
  v_co   uuid;
  v_umum uuid; v_gigi uuid; v_kia uuid;
  v_dok  text;
  v_pas  uuid; v_vis uuid; v_pen uuid; v_svc uuid; v_jad uuid;
  v_n    integer;
  r      record;
begin
  select id into v_co from public.companies
   where nama = 'Klinik Rexco 88' and deleted_at is null limit 1;
  if v_co is null then raise exception 'Klinik Rexco 88 tidak ditemukan.'; end if;

  select id into v_umum from public.clinic_units where company_id = v_co and nama = 'Umum';
  select id into v_gigi from public.clinic_units where company_id = v_co and nama = 'Gigi';
  select id into v_kia  from public.clinic_units where company_id = v_co and nama = 'KIA';
  select email into v_dok from public.app_users where company_id = v_co and role = 'dokter' limit 1;

  -- ── 1. Pasien dengan identitas LENGKAP ─────────────────────────────────
  -- Termasuk kerabat dan alamat berkolom, supaya layar detail pasien dan
  -- kesiapan kirim ke SatuSehat bisa dilihat berisi, bukan penuh "belum diisi".
  for r in
    select * from (values
      ('Ni Luh Gede Sriani',  '5171014503880021', '081338110021', 'P', '1988-03-05', 'Hindu',  'Ibu rumah tangga', 'SMA', 'kawin',       'Jl. Gatot Subroto 12',  '003','004','Ubung','Denpasar Utara','Denpasar','Bali','80116','I Made Sriana','Suami','081338110022'),
      ('I Gusti Ngurah Anom', '5171010207790022', '081338110023', 'L', '1979-07-02', 'Hindu',  'Wiraswasta',       'S1',  'kawin',       'Jl. Hayam Wuruk 88',    '001','002','Sumerta','Denpasar Timur','Denpasar','Bali','80234','Ni Kadek Anom','Istri','081338110024'),
      ('Siti Nurhaliza',      '3374015611950023', '081338110025', 'P', '1995-11-16', 'Islam',  'Guru',             'S1',  'kawin',       'Jl. Diponegoro 45',     '005','001','Dauh Puri','Denpasar Barat','Denpasar','Bali','80114','Ahmad Fauzi','Suami','081338110026'),
      ('Yohanes Baptista',    '5171012512830024', '081338110027', 'L', '1983-12-25', 'Katolik','Karyawan swasta',  'D3',  'kawin',       'Jl. Teuku Umar 210',    '002','006','Pemecutan','Denpasar Barat','Denpasar','Bali','80119','Maria Yohana','Istri','081338110028'),
      ('Ni Komang Ayu Lestari','5171015008010025','081338110029', 'P', '2001-08-10', 'Hindu',  'Mahasiswa',        'SMA', 'belum_kawin', 'Jl. Nusa Indah 7',      '004','003','Kesiman','Denpasar Timur','Denpasar','Bali','80237','I Wayan Lestara','Ayah','081338110030'),
      ('Muhammad Ridwan',     '3573011003720026', '081338110031', 'L', '1972-03-10', 'Islam',  'Pedagang',         'SMP', 'kawin',       'Jl. Imam Bonjol 300',   '007','002','Pemogan','Denpasar Selatan','Denpasar','Bali','80221','Siti Aminah','Istri','081338110032'),
      ('Ni Putu Ari Sasmita', '5171016304920027', '081338110033', 'P', '1992-04-23', 'Hindu',  'Perawat',          'D3',  'kawin',       'Jl. Waturenggong 5',    '001','005','Panjer','Denpasar Selatan','Denpasar','Bali','80225','I Ketut Sasmita','Suami','081338110034'),
      ('Bagus Wibisono',      '5171011809650028', '081338110035', 'L', '1965-09-18', 'Hindu',  'Pensiunan',        'S1',  'kawin',       'Jl. Cok Agung Tresna 9','003','001','Renon','Denpasar Selatan','Denpasar','Bali','80235','Ni Made Wibi','Istri','081338110036'),
      ('Kadek Ayu Pramesti',  '5171015507050029', '081338110037', 'P', '2005-07-15', 'Hindu',  'Pelajar',          'SMP', 'belum_kawin', 'Jl. Ahmad Yani 120',    '006','004','Peguyangan','Denpasar Utara','Denpasar','Bali','80115','I Nyoman Prames','Ayah','081338110038'),
      ('Robertus Kurniawan',  '5171010101900030', '081338110039', 'L', '1990-01-01', 'Kristen','Karyawan swasta',  'S1',  'belum_kawin', 'Jl. Mahendradatta 55',  '002','003','Padangsambian','Denpasar Barat','Denpasar','Bali','80117','Yohana Kurnia','Ibu','081338110040'),
      ('Ni Wayan Sekar Arum', '5171014102980031', '081338110041', 'P', '1998-02-01', 'Hindu',  'Karyawan swasta',  'SMA', 'belum_kawin','Jl. Pulau Moyo 17',     '005','002','Pedungan','Denpasar Selatan','Denpasar','Bali','80222','I Made Arum','Ayah','081338110042'),
      ('Ahmad Zulkarnain',    '3204012208880032', '081338110043', 'L', '1988-08-22', 'Islam',  'Sopir',            'SMA', 'kawin',       'Jl. Kebo Iwa 78',       '008','001','Padangsambian','Denpasar Barat','Denpasar','Bali','80118','Nur Aisyah','Istri','081338110044')
    ) as x(nama, nik, telp, jk, lahir, agama, kerja, didik, kawin, jalan, rt, rw, kel, kec, kota, prov, pos, kerabat, hub, kerabat_telp)
  loop
    if not exists (select 1 from public.patients where company_id = v_co and nik = r.nik) then
      perform public.simpan_pasien(null, jsonb_build_object(
        'nama', r.nama, 'nik', r.nik, 'telepon', r.telp, 'jenis_kelamin', r.jk,
        'tanggal_lahir', r.lahir, 'tempat_lahir', 'Denpasar', 'agama', r.agama,
        'pekerjaan', r.kerja, 'pendidikan', r.didik, 'status_kawin', r.kawin,
        'kewarganegaraan', 'WNI', 'alamat', r.jalan, 'rt', r.rt, 'rw', r.rw,
        'kelurahan', r.kel, 'kecamatan', r.kec, 'kota', r.kota, 'provinsi', r.prov,
        'kode_pos', r.pos, 'kerabat_nama', r.kerabat, 'kerabat_hubungan', r.hub,
        'kerabat_telepon', r.kerabat_telp,
        'nomor_bpjs', case when r.jk = 'P' then '000' || right(r.nik, 10) else null end
      ), v_co);
    end if;
  end loop;

  -- ── 2. Reservasi untuk BESOK, tersebar di beberapa poli ────────────────
  for r in
    select p.id, p.nama, p.telepon, row_number() over (order by p.nama) as urut
      from public.patients p
     where p.company_id = v_co and p.nik like '5171%' limit 6
  loop
    select j.id into v_jad from public.doctor_schedules j
     where j.company_id = v_co and j.aktif
       and j.hari = extract(dow from current_date + 1)::smallint
       and j.unit_id = case when r.urut % 3 = 0 then v_gigi when r.urut % 3 = 1 then v_umum else v_kia end
     order by j.jam_mulai limit 1;
    if v_jad is not null and not exists (
         select 1 from public.reservations
          where patient_id = r.id and tanggal = current_date + 1 and status = 'menunggu') then
      perform public.buat_reservasi(r.nama, current_date + 1, v_jad, r.telepon, r.id,
        case r.urut % 3 when 0 then 'Kontrol gigi' when 1 then 'Kontrol tekanan darah' else 'Imunisasi' end,
        case when r.urut % 2 = 0 then 'bpjs' else 'umum' end,
        null, null, v_co);
    end if;
  end loop;

  -- ── 3. Kunjungan hari ini dengan pemeriksaan penunjang ─────────────────
  select id into v_pas from public.patients
   where company_id = v_co and nama = 'Ni Luh Gede Sriani' limit 1;
  if v_pas is not null and not exists (
       select 1 from public.visits where patient_id = v_pas and tanggal = current_date) then
    v_vis := (public.daftar_kunjungan(v_pas, 'Demam lima hari, nyeri kepala', 'umum', v_umum, v_dok, v_co) ->> 'id')::uuid;
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    perform public.simpan_rekam_medis(v_vis,
      jsonb_build_object('subjektif', 'Demam naik turun sejak lima hari, nyeri kepala, mual.',
                         'objektif', 'Tampak lemah, tidak ada ruam, hepar tidak teraba.',
                         'asesmen', 'Curiga demam berdarah dengue',
                         'plan', 'Cek darah lengkap cito, rawat jalan, kontrol besok.'),
      jsonb_build_object('sistole', 100, 'diastole', 70, 'nadi', 96, 'napas', 20, 'suhu', 38.6, 'saturasi', 98));
    insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
    values (v_co, v_vis, 'A90', 'Dengue fever', 'primer') on conflict do nothing;

    -- Cito, sudah ada hasilnya, dan trombositnya KRITIS.
    select id into v_svc from public.services where company_id = v_co and nama = 'Darah Lengkap';
    v_pen := (public.minta_penunjang(v_vis, 'lab', 'Darah Lengkap', v_svc, 'Curiga DBD hari kelima', 'cito') ->> 'id')::uuid;
    perform public.isi_hasil_penunjang(v_pen, jsonb_build_array(
      jsonb_build_object('nama','Hemoglobin','kode_loinc','718-7','nilai','13.8','nilai_angka','13.8','satuan','g/dL','rujukan_bawah','13','rujukan_atas','17','penanda','normal'),
      jsonb_build_object('nama','Hematokrit','kode_loinc','4544-3','nilai','48','nilai_angka','48','satuan','%','rujukan_bawah','40','rujukan_atas','52','penanda','normal'),
      jsonb_build_object('nama','Leukosit','kode_loinc','6690-2','nilai','3200','nilai_angka','3200','satuan','/uL','rujukan_bawah','4000','rujukan_atas','11000','penanda','rendah'),
      jsonb_build_object('nama','Trombosit','kode_loinc','777-3','nilai','78000','nilai_angka','78000','satuan','/uL','rujukan_bawah','150000','rujukan_atas','450000','penanda','kritis')));
  end if;

  -- Pasien kedua: dirujuk internal dari Umum ke Gigi, dua catatan SOAP.
  select id into v_pas from public.patients
   where company_id = v_co and nama = 'I Gusti Ngurah Anom' limit 1;
  if v_pas is not null and not exists (
       select 1 from public.visits where patient_id = v_pas and tanggal = current_date) then
    v_vis := (public.daftar_kunjungan(v_pas, 'Nyeri rahang kanan', 'bpjs', v_umum, v_dok, v_co) ->> 'id')::uuid;
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    perform public.simpan_rekam_medis(v_vis,
      jsonb_build_object('subjektif', 'Nyeri rahang kanan sejak tiga hari, sulit mengunyah.',
                         'objektif', 'Pembengkakan regio molar kanan bawah.',
                         'asesmen', 'Curiga abses periapikal, perlu dinilai dokter gigi',
                         'plan', 'Rujuk internal ke poli gigi.'));
    perform public.rujuk_internal(v_vis, v_gigi, 'Perlu dinilai dokter gigi, curiga abses periapikal',
      null, 'Sudah diberi analgetik di poli umum.');
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    perform public.simpan_rekam_medis(v_vis,
      jsonb_build_object('subjektif', 'Rujukan dari poli umum.',
                         'objektif', 'Gigi 46 karies profunda, perkusi positif.',
                         'asesmen', 'Abses periapikal gigi 46',
                         'plan', 'Drainase, antibiotik, kontrol tiga hari.'));
    insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
    values (v_co, v_vis, 'K04.7', 'Abses periapikal tanpa sinus', 'primer') on conflict do nothing;
  end if;

  -- Pasien ketiga: radiologi yang BELUM dikerjakan, supaya antrean lab berisi.
  select id into v_pas from public.patients
   where company_id = v_co and nama = 'Bagus Wibisono' limit 1;
  if v_pas is not null and not exists (
       select 1 from public.visits where patient_id = v_pas and tanggal = current_date) then
    v_vis := (public.daftar_kunjungan(v_pas, 'Batuk lama dua bulan', 'umum', v_umum, v_dok, v_co) ->> 'id')::uuid;
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    perform public.simpan_rekam_medis(v_vis,
      jsonb_build_object('subjektif', 'Batuk berdahak dua bulan, keringat malam, berat badan turun.',
                         'objektif', 'Ronkhi apeks kanan.',
                         'asesmen', 'Curiga TB paru',
                         'plan', 'Foto thorax PA, cek dahak.'),
      jsonb_build_object('sistole', 130, 'diastole', 85, 'nadi', 88, 'napas', 22, 'suhu', 37.4, 'berat', 52, 'tinggi', 168));
    select id into v_svc from public.services where company_id = v_co and nama = 'Thorax PA';
    perform public.minta_penunjang(v_vis, 'radiologi', 'Thorax PA', v_svc, 'Curiga TB paru, batuk dua bulan', 'rutin');
    select id into v_svc from public.services where company_id = v_co and nama = 'Darah Lengkap';
    perform public.minta_penunjang(v_vis, 'lab', 'Darah Lengkap', v_svc, 'Skrining awal', 'rutin');
  end if;

  -- Pasien keempat: KIA, pemeriksaan USG menunggu.
  select id into v_pas from public.patients
   where company_id = v_co and nama = 'Ni Putu Ari Sasmita' limit 1;
  if v_pas is not null and v_kia is not null and not exists (
       select 1 from public.visits where patient_id = v_pas and tanggal = current_date) then
    v_vis := (public.daftar_kunjungan(v_pas, 'Kontrol kehamilan 28 minggu', 'bpjs', v_kia, null, v_co) ->> 'id')::uuid;
    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    select id into v_svc from public.services where company_id = v_co and nama = 'USG Kehamilan';
    perform public.minta_penunjang(v_vis, 'radiologi', 'USG Kehamilan', v_svc, 'Kontrol trimester tiga', 'rutin');
  end if;

  select count(*) into v_n from public.visit_penunjang
   where company_id = v_co and status in ('diminta', 'dikerjakan');
  raise notice 'Selesai. Antrean penunjang sekarang berisi % permintaan.', v_n;
end $$;
