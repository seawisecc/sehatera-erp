-- ============================================================
-- Data contoh Klinik Rexco 88, bagian 3: kunjungan berpenjamin yang SUDAH DIBAYAR
-- ============================================================
--
-- Dijalankan SESUDAH bagian 1 dan 2. Idempoten dan hanya menyentuh Klinik
-- Rexco 88.
--
-- Alasannya satu: seluruh data contoh sebelumnya berpenjamin `umum`, jadi
-- layar Penjamin dan layar Klaim benar-benar kosong saat dibuka. Layar yang
-- kosong tidak bisa dinilai. Yang tidak pernah dilihat berisi adalah yang
-- rusaknya baru ketahuan di klinik orang lain.
--
-- Yang dibuat: enam kunjungan tertutup dengan penjamin BPJS dan asuransi,
-- tersebar sepanjang bulan berjalan supaya klaim satu periode berisi lebih
-- dari satu baris. Dua di antaranya sengaja **tidak enak**: satu asuransi
-- dengan selisih bayar pasien (bukan seluruhnya ditanggung), dan satu
-- kunjungan tanpa diagnosis primer, yang justru harus terlihat sebagai
-- peringatan di pratinjau klaim: berkas tanpa diagnosis akan dikembalikan
-- verifikator.

do $$
declare
  v_co   uuid;
  v_umum uuid; v_gigi uuid;
  v_dok  text;
  v_as   uuid;
  v_prod uuid;
  v_pas  uuid; v_vis uuid; v_trx uuid;
  v_n    integer;
  r      record;
begin
  select id into v_co from public.companies
   where nama = 'Klinik Rexco 88' and deleted_at is null limit 1;
  if v_co is null then raise exception 'Klinik Rexco 88 tidak ditemukan.'; end if;

  select id into v_umum from public.clinic_units where company_id = v_co and nama = 'Umum';
  select id into v_gigi from public.clinic_units where company_id = v_co and nama = 'Gigi';
  select email into v_dok from public.app_users where company_id = v_co and role = 'dokter' limit 1;
  select id into v_as from public.insurers where company_id = v_co and aktif order by nama limit 1;
  select id into v_prod from public.products
   where company_id = v_co and coalesce(stok_total, 0) > 20 order by nama_obat limit 1;

  if v_prod is null then
    raise exception 'Tidak ada obat berstok cukup di Klinik Rexco 88. Jalankan bagian 1 lebih dulu.';
  end if;

  -- ── Pasien khusus bagian ini ──────────────────────────────────────────
  -- Pasien tersendiri, bukan menumpang yang sudah ada, karena satu pasien
  -- tidak boleh punya dua kunjungan terbuka di hari yang sama.
  for r in
    select * from (values
      ('Dewa Gede Suparta',   '5171010504760051', '081338110051', 'L', '1976-04-05'),
      ('Ni Made Rasmini',     '5171015209810052', '081338110052', 'P', '1981-09-12'),
      ('Hendra Kusuma',       '3374011811840053', '081338110053', 'L', '1984-11-18'),
      ('Ni Kadek Widiastuti', '5171016003930054', '081338110054', 'P', '1993-03-20'),
      ('Stefanus Halim',      '5171012906700055', '081338110055', 'L', '1970-06-29'),
      ('Ni Nyoman Purnami',   '5171014712870056', '081338110056', 'P', '1987-12-07')
    ) as x(nama, nik, telp, jk, lahir)
  loop
    if not exists (select 1 from public.patients where company_id = v_co and nik = r.nik) then
      perform public.simpan_pasien(null, jsonb_build_object(
        'nama', r.nama, 'nik', r.nik, 'telepon', r.telp, 'jenis_kelamin', r.jk,
        'tanggal_lahir', r.lahir, 'tempat_lahir', 'Denpasar', 'agama', 'Hindu',
        'kewarganegaraan', 'WNI', 'alamat', 'Jl. Contoh Klaim ' || right(r.nik, 2),
        'kota', 'Denpasar', 'provinsi', 'Bali',
        'nomor_bpjs', '000' || right(r.nik, 10)), v_co);
    end if;
  end loop;

  -- ── Enam kunjungan tertutup, tersebar sepanjang bulan ─────────────────
  -- `mundur` dihitung dari hari ini lalu ditahan supaya tidak melompat ke
  -- bulan sebelumnya: klaim yang bawaannya "awal bulan sampai hari ini" harus
  -- benar-benar memuat semuanya, kalau tidak layarnya terlihat kosong lagi.
  for r in
    select * from (values
      ('Dewa Gede Suparta',   'bpjs',     'Kontrol hipertensi',        'I10',   'Essential (primary) hypertension',        45000,  45000,      0, 12),
      ('Ni Made Rasmini',     'bpjs',     'Batuk pilek tiga hari',     'J06.9', 'Acute upper respiratory infection',       38000,  38000,      0,  9),
      ('Hendra Kusuma',       'asuransi', 'Nyeri lambung berulang',    'K29.7', 'Gastritis, unspecified',                 120000, 90000,  30000,  7),
      ('Ni Kadek Widiastuti', 'bpjs',     'Kontrol gula darah',        'E11.9', 'Type 2 diabetes mellitus',                65000,  65000,      0,  4),
      ('Stefanus Halim',      'asuransi', 'Pemeriksaan berkala kantor', null,   null,                                     250000, 250000,     0,  2),
      ('Ni Nyoman Purnami',   'bpjs',     'Nyeri gigi geraham',        'K02.9', 'Dental caries, unspecified',              55000,  55000,     0,  0)
    ) as x(nama, penjamin, keluhan, icd, icd_nama, total, tagih, tunai, mundur)
  loop
    select id into v_pas from public.patients where company_id = v_co and nama = r.nama limit 1;
    continue when v_pas is null;

    -- Idempoten: kalau pasien ini sudah punya kunjungan berpenjamin, lewati.
    if exists (select 1 from public.visits v
                where v.patient_id = v_pas and v.penjamin <> 'umum') then
      continue;
    end if;

    v_vis := (public.daftar_kunjungan(
      v_pas, r.keluhan, r.penjamin,
      case when r.icd = 'K02.9' then coalesce(v_gigi, v_umum) else v_umum end,
      v_dok, v_co,
      case when r.penjamin = 'asuransi' then v_as else null end,
      case when r.penjamin = 'bpjs'
           then (select nomor_bpjs from public.patients where id = v_pas)
           else 'POL-' || right(r.nama, 4) || '-2026' end
    ) ->> 'id')::uuid;

    perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
    perform public.simpan_rekam_medis(v_vis, jsonb_build_object(
      'subjektif', r.keluhan,
      'objektif',  'Keadaan umum baik, kesadaran penuh.',
      'asesmen',   coalesce(r.icd_nama, 'Pemeriksaan kesehatan berkala'),
      'plan',      'Terapi simtomatik, kontrol bila keluhan menetap.'));

    -- Satu kunjungan sengaja TANPA diagnosis primer, supaya pratinjau klaim
    -- punya baris bertanda "tanpa diagnosis" untuk dilihat.
    if r.icd is not null then
      insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
      values (v_co, v_vis, r.icd, r.icd_nama, 'primer') on conflict do nothing;
    end if;

    -- Uangnya lewat jalur kasir yang sebenarnya, bukan insert ke
    -- `transactions`. Jalur kedua ke tabel yang sama berarti dua tempat yang
    -- harus benar, dan data contoh yang lahir lewat jalur kedua tidak
    -- membuktikan apa pun tentang jalur yang dipakai orang.
    v_trx := (public.apply_transaction(
      jsonb_build_array(jsonb_build_object(
        'product_id', v_prod, 'nama_obat', 'Obat pelayanan',
        'harga_jual', r.total, 'jumlah', 1)),
      r.tunai, 'Tunai', jsonb_build_object('visit_id', v_vis),
      v_co, r.penjamin,
      case when r.penjamin = 'asuransi' then v_as else null end,
      r.tagih) ->> 'id')::uuid;

    -- Dimundurkan SESUDAH semuanya tercatat. Kalau tanggalnya dimundurkan
    -- lebih dulu, nomor antrean dan biaya kunjungan ikut jatuh ke hari yang
    -- salah.
    if r.mundur > 0 then
      update public.visits
         set tanggal = current_date - r.mundur,
             dibuka_pada  = dibuka_pada - (r.mundur || ' days')::interval,
             ditutup_pada = ditutup_pada - (r.mundur || ' days')::interval
       where id = v_vis;
      update public.transactions
         set created_at = created_at - (r.mundur || ' days')::interval
       where id = v_trx;
    end if;
  end loop;

  select count(*) into v_n from public.transactions
   where company_id = v_co and status = 'selesai'
     and coalesce(ditagihkan_penjamin, 0) > 0 and claim_id is null;
  raise notice 'Selesai. Ada % pelayanan berpenjamin yang siap diklaim.', v_n;
end $$;
