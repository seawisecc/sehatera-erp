-- ============================================================
-- Uji 0037: kolom v_antrean_hari_ini tidak boleh hilang
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Uji ini lahir dari kesalahan nyata. Migrasi 0035 membuat ulang view ini
-- dengan DROP lalu CREATE memakai definisi yang disalin dari migrasi 0023,
-- padahal migrasi 0024 sudah menambahkan `nilai_biaya`. Kolom itu hilang,
-- dan karena kasir memilihnya secara eksplisit, SELURUH daftar kunjungan di
-- layar Kasir kosong. Bukan satu pasien: semuanya.
--
-- Yang bikin mahal: tidak ada yang gagal saat migrasi dijalankan. Galatnya
-- baru muncul di peramban orang lain, sebagai daftar kosong yang kelihatan
-- seperti "memang belum ada pasien".
--
-- Jadi daftar di bawah adalah KONTRAK. Menghapus satu nama dari sini harus
-- disengaja dan harus diikuti memperbaiki pemakainya.

do $$
declare
  v_kurang text[];
  v_wajib  text[] := array[
    -- dipakai layar Kunjungan
    'id', 'company_id', 'nomor', 'nomor_antre', 'tanggal', 'status', 'keluhan',
    'penjamin', 'dokter_email', 'dibuka_pada', 'ditutup_pada',
    'pasien_id', 'nomor_rm', 'pasien_nama', 'tanggal_lahir', 'jenis_kelamin',
    'alergi', 'telepon', 'umur',
    'jenis_kunjungan', 'poli', 'no_rujukan', 'kesadaran', 'status_pulang',
    'ihs_encounter_id', 'pasien_ihs_id',
    'ada_catatan', 'jumlah_diagnosis', 'ada_vital',
    'unit_id', 'unit_nama', 'unit_kode',
    -- dipakai layar Kasir. `nilai_biaya` inilah yang pernah hilang.
    'status_resep', 'nilai_biaya', 'transaction_id',
    -- ditambahkan migrasi 0035 untuk layar Farmasi
    'resep_id',
    -- ditambahkan migrasi 0042 untuk layar antrean ruang tunggu
    'dipanggil_pada', 'jumlah_panggil',
    -- ditambahkan migrasi 0047 supaya kasir tahu tagihannya sudah lengkap
    'obat_belum_dipilih'
  ];
begin
  select array_agg(k) into v_kurang
    from unnest(v_wajib) as k
   where not exists (
     select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'v_antrean_hari_ini'
        and c.column_name = k);

  if v_kurang is not null then
    raise exception 'v_antrean_hari_ini kehilangan kolom: %. Layar yang memilihnya akan gagal SELURUHNYA, bukan sebagian.',
      array_to_string(v_kurang, ', ');
  end if;

  -- Kolom yang sama untuk antrean farmasi.
  select array_agg(k) into v_kurang
    from unnest(array['id','nomor','status','visit_id','nomor_antre','poli','penjamin',
                      'pasien_id','pasien_nama','nomor_rm','alergi','jumlah_item',
                      'sudah_bayar','transaction_id','disiapkan_pada','siap_pada']) as k
   where not exists (
     select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'v_resep_menunggu'
        and c.column_name = k);

  if v_kurang is not null then
    raise exception 'v_resep_menunggu kehilangan kolom: %.', array_to_string(v_kurang, ', ');
  end if;

  -- Nilai biaya benar-benar terhitung, bukan sekadar kolomnya ada.
  if exists (
    select 1 from public.v_antrean_hari_ini a
     where a.nilai_biaya is null) then
    raise exception 'Ada baris dengan nilai_biaya NULL. Seharusnya coalesce ke 0.';
  end if;

  raise exception 'SEMUA UJI LULUS. Kontrak kolom kedua view masih utuh.';
end $$;
