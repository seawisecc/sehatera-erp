-- ============================================================
-- Uji migrasi 0030: mencari ICD dalam bahasa Indonesia
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
-- Benar kalau galat terakhirnya berbunyi "SEMUA UJI LULUS".

do $$
declare
  v_n     bigint;
  v_kode  text;
  v_mulai timestamptz;
  v_ms    numeric;
  r       record;
begin
  -- 1. Penormalan ejaan -------------------------------------------------
  -- Kiri yang diketik dokter, kanan yang tertulis di berkas Kemenkes.
  for r in select * from (values
      ('faringitis',    'pharyngitis'),
      ('bronkitis',     'bronchitis'),
      ('hipertensi',    'hypertension'),
      ('tuberkulosis',  'tuberculosis'),
      ('konjungtivitis','conjunctivitis'),
      ('asma',          'asthma'),
      ('anemia',        'anaemia'),
      ('diabetes',      'diabetes'),
      ('infeksi',       'infection'),
      ('obesitas',      'obesity'),
      ('sirosis',       'cirrhosis'),
      ('toksik',        'toxic'),
      ('mialgia',       'myalgia'),
      ('artritis',      'arthritis'),
      ('selulitis',     'cellulitis'),
      ('karsinoma',     'carcinoma'),
      ('psikosis',      'psychosis'),
      ('skabies',       'scabies')
    ) as t(id_kata, en_kata)
  loop
    if public.normalisasi_medis(r.id_kata) is distinct from public.normalisasi_medis(r.en_kata) then
      raise exception 'Ejaan tidak bertemu: % -> % , sedangkan % -> %',
        r.id_kata, public.normalisasi_medis(r.id_kata),
        r.en_kata, public.normalisasi_medis(r.en_kata);
    end if;
  end loop;

  -- 2. Kolom ternormalisasi terisi seluruhnya ---------------------------
  select count(*) into v_n from public.icd10 where coalesce(nama_norm, '') = '';
  if v_n > 0 then raise exception '% baris icd10 tidak punya nama_norm.', v_n; end if;
  select count(*) into v_n from public.icd9cm where coalesce(nama_norm, '') = '';
  if v_n > 0 then raise exception '% baris icd9cm tidak punya nama_norm.', v_n; end if;

  -- 3. Glosarium terisi -------------------------------------------------
  select count(*) into v_n from public.icd_kata;
  if v_n < 240 then raise exception 'Glosarium cuma % baris, seharusnya 243 sesudah migrasi 0033.', v_n; end if;

  -- Kata KERJA harus ada, bukan cuma kata benda. Glosarium 0030 seluruhnya
  -- keluhan dan organ, jadi kotak ICD-9-CM sebenarnya cuma bisa dicari dalam
  -- bahasa Inggris, dan itu baru ketahuan saat aplikasinya benar-benar dibuka.
  for r in select * from (values ('jahit'), ('cabut'), ('pasang'), ('angkat'), ('suntik')) as t(k)
  loop
    if not exists (select 1 from public.icd_kata where id_kata = r.k) then
      raise exception 'Kata tindakan "%" tidak ada di glosarium.', r.k;
    end if;
  end loop;

  -- 4. Yang dulu tidak mungkin, sekarang ketemu -------------------------
  -- Semua ini SEBELUM migrasi 0030 mengembalikan nol baris, karena nama
  -- resminya bahasa Inggris dan tidak satu pun punya alias.
  for r in select * from (values
      ('faringitis',    'J02'),   -- pharyngitis, lewat ejaan
      ('bronkitis',     'J20'),   -- bronchitis, lewat ejaan
      ('hipertensi',    'I10'),   -- hypertension, lewat ejaan
      ('skabies',       'B86'),   -- scabies, lewat ejaan
      ('sakit kepala',  'R51'),   -- headache, lewat glosarium
      ('demam berdarah','A91'),   -- dengue haemorrhagic fever, urutan terbalik
      ('luka terbuka',  'T14'),   -- open wound, lewat glosarium
      ('patah tulang',  'S'),     -- fracture, lewat glosarium
      ('nyeri dada',    'R07')    -- chest pain, lewat glosarium
    ) as t(ketik, harap)
  loop
    if not exists (select 1 from public.cari_icd10(r.ketik, 50)
                    where kode like r.harap || '%') then
      raise exception 'Mencari "%" tidak menemukan kode yang diawali %.', r.ketik, r.harap;
    end if;
  end loop;

  -- 5. Antar kata syaratnya DAN, bukan ATAU -----------------------------
  -- Kalau ATAU, "demam berdarah" akan mengembalikan semua yang demam dan
  -- kotak hasilnya jadi tidak berguna.
  select count(*) into v_n from public.cari_icd10('demam berdarah', 50);
  if v_n = 0 then raise exception '"demam berdarah" tidak dapat apa-apa.'; end if;
  if not exists (select 1 from public.cari_icd10('demam berdarah', 50) where kode like 'A9%') then
    raise exception '"demam berdarah" tidak memunculkan dengue.';
  end if;

  -- 6. Yang lama tidak boleh rusak --------------------------------------
  select kode into v_kode from public.cari_icd10('J06.9', 10) limit 1;
  if v_kode <> 'J06.9' then raise exception 'Cari kode persis rusak, dapat %.', coalesce(v_kode,'(kosong)'); end if;

  select kode into v_kode from public.cari_icd10('demam tifoid', 5) limit 1;
  if v_kode is distinct from 'A01.0' then
    raise exception 'Alias lama rusak: "demam tifoid" dapat %.', coalesce(v_kode, '(kosong)');
  end if;

  select count(*) into v_n from public.cari_icd10('', 20);
  if v_n <> 0 then raise exception 'Kata kosong mengembalikan % baris.', v_n; end if;
  select count(*) into v_n from public.cari_icd10('   ', 20);
  if v_n <> 0 then raise exception 'Spasi saja mengembalikan % baris.', v_n; end if;
  select count(*) into v_n from public.cari_icd10('a', 9999);
  if v_n > 50 then raise exception 'Batas hasil tembus: % baris.', v_n; end if;

  -- 7. ICD-9-CM ---------------------------------------------------------
  select kode into v_kode from public.cari_icd9('93.960', 5) limit 1;
  if v_kode <> '93.960' then raise exception 'cari_icd9 gagal menemukan 93.960.'; end if;
  if not exists (select 1 from public.cari_icd9('jantung', 50)) then
    raise exception 'cari_icd9 "jantung" tidak dapat apa-apa.';
  end if;

  -- Tindakan dicari dalam bahasa Indonesia. Ketiganya mengembalikan NOL
  -- sebelum migrasi 0033, dan itu tidak tertangkap uji mana pun sampai
  -- formnya dibuka sungguhan di peramban.
  for r in select * from (values
      ('jahit kulit', '86.5'),   -- Suture of skin and subcutaneous tissue
      ('cabut gigi',  '23.'),    -- Extraction of tooth
      ('pasang kateter', '57.')  -- Insertion of catheter
    ) as t(ketik, harap)
  loop
    if not exists (select 1 from public.cari_icd9(r.ketik, 50)
                    where kode like r.harap || '%') then
      raise exception 'cari_icd9 "%" tidak menemukan kode yang diawali %.', r.ketik, r.harap;
    end if;
  end loop;

  -- 8. Masih cukup cepat untuk diketik huruf demi huruf -----------------
  -- Kotak diagnosis memanggil ini tiap orang berhenti mengetik 250 ms.
  -- Kalau satu pencarian lebih lama dari itu, jedanya kelihatan.
  v_mulai := clock_timestamp();
  perform public.cari_icd10('demam berdarah', 20);
  perform public.cari_icd10('faringitis', 20);
  perform public.cari_icd10('nyeri kepala', 20);
  v_ms := extract(milliseconds from clock_timestamp() - v_mulai)
        + 1000 * extract(seconds from clock_timestamp() - v_mulai);
  raise notice 'Tiga pencarian selesai dalam % ms.', round(v_ms);
  if v_ms > 3000 then
    raise exception 'Tiga pencarian butuh % ms, terlalu lambat untuk kotak ketik.', round(v_ms);
  end if;

  raise exception 'SEMUA UJI LULUS. Pencarian bahasa Indonesia hidup, dan yang lama tidak ada yang rusak.';
end $$;
