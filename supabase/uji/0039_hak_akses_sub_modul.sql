-- ============================================================
-- Uji migrasi 0039: hak akses per sub-modul kunjungan
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Uji ini TIDAK bisa menguji lewat `wajib_boleh()` langsung, karena di SQL
-- Editor `boleh_admin_platform()` bernilai benar dan semuanya diizinkan.
-- Itu memang disengaja. Jadi yang diuji di sini matriksnya sebagai tabel
-- keputusan: peran apa boleh apa. Penjaganya sendiri sudah dipasang di
-- kesepuluh fungsi, dan itu diperiksa dengan membaca definisinya.

do $$
declare
  v_n      integer;
  r        record;
  v_kurang text[];
begin
  -- 1. Matriks: siapa boleh apa --------------------------------------
  for r in select * from (values
      -- peran,             kapabilitas,            harapan
      ('dokter',            'rekam_medis.baca',     true),
      ('dokter',            'diagnosis.tulis',      true),
      ('dokter',            'resep.tulis',          true),
      ('dokter',            'resep.layani',         false),
      ('perawat',           'rekam_medis.baca',     true),
      ('perawat',           'rekam_medis.tulis',    true),
      ('perawat',           'diagnosis.tulis',      false),
      ('perawat',           'resep.tulis',          false),
      -- Inti seluruh migrasi ini: pendaftaran TIDAK membuka rekam medis.
      ('pendaftaran',       'rekam_medis.baca',     false),
      ('pendaftaran',       'rekam_medis.tulis',    false),
      ('pendaftaran',       'diagnosis.tulis',      false),
      ('pendaftaran',       'resep.baca',           false),
      -- Kasir tidak membuka apa pun yang medis.
      ('kasir',             'rekam_medis.baca',     false),
      ('kasir',             'resep.baca',           false),
      ('kasir',             'diagnosis.tulis',      false),
      -- Farmasi melihat resep, tapi TIDAK membuka SOAP.
      ('apoteker',          'resep.baca',           true),
      ('apoteker',          'resep.layani',         true),
      ('apoteker',          'rekam_medis.baca',     false),
      ('apoteker',          'diagnosis.tulis',      false),
      ('asisten_apoteker',  'resep.layani',         true),
      ('asisten_apoteker',  'rekam_medis.baca',     false),
      -- Pemilik dan admin mendapat semuanya, sengaja.
      ('pemilik',           'rekam_medis.baca',     true),
      ('pemilik',           'diagnosis.tulis',      true),
      ('admin',             'resep.layani',         true),
      -- Kapabilitas karangan selalu ditolak, bukan diizinkan diam-diam.
      ('dokter',            'apa.saja.ini',         false),
      ('pemilik',           'apa.saja.ini',         false)
    ) as t(peran, kap, harap)
  loop
    -- Matriksnya dihitung ulang di sini persis seperti di `boleh()`,
    -- supaya yang diuji keputusannya dan bukan cuma jalannya fungsi.
    if (case r.kap
          when 'rekam_medis.baca'  then r.peran in ('pemilik','admin','dokter','perawat')
          when 'rekam_medis.tulis' then r.peran in ('pemilik','admin','dokter','perawat')
          when 'diagnosis.tulis'   then r.peran in ('pemilik','admin','dokter')
          when 'resep.baca'        then r.peran in ('pemilik','admin','dokter','perawat','apoteker','asisten_apoteker')
          when 'resep.tulis'       then r.peran in ('pemilik','admin','dokter')
          when 'resep.layani'      then r.peran in ('pemilik','admin','apoteker','asisten_apoteker')
          else false
        end) <> r.harap then
      raise exception 'Matriks salah: peran % terhadap % seharusnya %.', r.peran, r.kap, r.harap;
    end if;
  end loop;

  -- 2. Fungsinya benar-benar memasang penjaga --------------------------
  -- Dibaca dari definisi yang SEDANG BERLAKU di database, bukan dari berkas
  -- migrasi. Itu pelajaran dari migrasi 0037: berkas cuma tahu keadaan saat
  -- ia ditulis, database tahu keadaan sekarang.
  select array_agg(f) into v_kurang
    from unnest(array['rekam_medis','simpan_rekam_medis','tambah_adendum','riwayat_pasien',
                      'resep_kunjungan','isi_resep','simpan_resep','isi_permintaan_farmasi',
                      'ubah_status_resep','serahkan_resep']) as f
   where not exists (
     select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = f
       and pg_get_functiondef(p.oid) like '%wajib_boleh%');

  if v_kurang is not null then
    raise exception 'Fungsi ini tidak memasang penjaga hak akses: %. Siapa pun yang tahu alamatnya bisa memanggilnya.',
      array_to_string(v_kurang, ', ');
  end if;

  -- Diagnosis dijaga TERPISAH di dalam simpan_rekam_medis, supaya perawat
  -- boleh menambah tanda vital tapi tidak menegakkan diagnosis.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'simpan_rekam_medis'
       and pg_get_functiondef(p.oid) like '%diagnosis.tulis%') then
    raise exception 'simpan_rekam_medis tidak memisahkan penjaga diagnosis. Perawat jadi bisa menegakkan diagnosis.';
  end if;

  -- 3. Yang tidak boleh ikut hilang saat fungsinya disalin ulang -------
  -- Kesepuluh fungsi tadi disalin mekanis dari migrasi asalnya. Kalau ada
  -- yang tercecer, di sinilah ketahuannya.
  for r in select * from (values
      ('simpan_resep',           'next_doc_number'),
      ('simpan_resep',           'harus lebih dari nol'),
      ('serahkan_resep',         'serah_tanpa_bayar'),
      ('isi_permintaan_farmasi', 'permintaan_asli'),
      ('riwayat_pasien',         'boleh_admin_platform'),
      ('simpan_rekam_medis',     'SH004')
    ) as t(fungsi, jejak)
  loop
    if not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = r.fungsi
         and pg_get_functiondef(p.oid) like '%' || r.jejak || '%') then
      raise exception 'Fungsi % kehilangan "%" saat disalin ulang.', r.fungsi, r.jejak;
    end if;
  end loop;

  -- 4. Jalur admin platform tetap terbuka ------------------------------
  -- Kalau ini tertutup, perbaikan data saat ada yang rusak ikut tertutup.
  if not public.boleh('rekam_medis.baca') then
    raise exception 'Jalur admin platform ikut terkunci. Skrip pemeliharaan tidak bisa jalan lagi.';
  end if;

  raise exception 'SEMUA UJI LULUS. Rekam medis sekarang dijaga database, bukan cuma disembunyikan tombolnya.';
end $$;
