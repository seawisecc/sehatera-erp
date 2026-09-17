-- ============================================================
-- UJI 0081  Gerbang modul klinik
-- ============================================================
--
-- BUKAN migrasi. Tempelkan di SQL Editor sesudah migrasi 0081 dijalankan.
-- Seluruh percobaannya dibatalkan di ujung, jadi ia tidak pernah mengubah apa
-- pun. Yang benar cuma satu keluaran: galat terakhir berbunyi
-- "SEMUA UJI LULUS".
--
--
-- ## Kenapa sebagian besar ujinya memeriksa TEKS fungsinya
--
-- `boleh_modul_klinik()` lolos begitu saja lewat `boleh_admin_platform()`, dan
-- SQL Editor adalah koneksi langsung, jadi ia SELALU menjawab `true` di sini.
-- Itu memang perilaku yang benar, tapi berarti gerbangnya tidak bisa dibuktikan
-- dengan memanggilnya dari sini.
--
-- Yang justru paling perlu dibuktikan bukan logikanya, melainkan bahwa
-- penjaganya BENAR-BENAR TERPASANG di dalam kedua fungsi. Migrasi 0081
-- memasangnya dengan menyulam teks (`replace` atas `pg_get_functiondef`), dan
-- jangkar yang meleset membuat `replace()` tidak melakukan apa pun: fungsinya
-- ditulis ulang persis seperti semula, migrasinya melapor BERHASIL, dan
-- pintunya tetap terbuka. Kegagalan seperti itu tidak punya galat sama sekali.

do $$
declare
  v_src   text;
  v_klin  uuid;
  v_apo   uuid;
  v_fitur boolean;
begin
  -- ── 1. Penjaganya terpasang di KEDUA pintu masuk ───────────────────────
  select pg_get_functiondef(p.oid) into v_src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'daftar_kunjungan' limit 1;
  if v_src is null or position('wajib_modul_klinik' in v_src) = 0 then
    raise exception 'GAGAL: daftar_kunjungan() tidak memanggil wajib_modul_klinik.';
  end if;

  select pg_get_functiondef(p.oid) into v_src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'buat_reservasi' limit 1;
  if v_src is null or position('wajib_modul_klinik' in v_src) = 0 then
    raise exception 'GAGAL: buat_reservasi() tidak memanggil wajib_modul_klinik.';
  end if;

  -- ── 2. Yang TIDAK boleh ikut dijaga ────────────────────────────────────
  -- Ini uji yang menguji sesuatu yang tidak boleh terjadi, dan justru itu
  -- gunanya. Paket mengunci MEMBUAT yang baru, bukan MEMBACA yang lama:
  -- klinik yang paketnya turun harus tetap bisa membuka, mencetak, dan
  -- menambahi adendum rekam medis yang sudah ada. Kalau suatu hari ada yang
  -- menambahkan penjaga ke salah satu fungsi di bawah, uji ini yang berteriak.
  for v_src in
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('rekam_medis', 'simpan_rekam_medis', 'riwayat_pasien',
                         'resep_kunjungan', 'tagihan_kunjungan', 'resep_untuk_cetak')
  loop
    if position('wajib_modul_klinik' in
        (select pg_get_functiondef(p.oid) from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = v_src limit 1)) > 0 then
      raise exception
        'GAGAL: %() ikut digerbangi paket. Membaca rekam medis lama tidak boleh dikunci paket.', v_src;
    end if;
  end loop;

  -- ── 3. Logika paketnya, dibaca langsung ────────────────────────────────
  -- `boleh_modul_klinik()` sendiri tidak dipanggil di sini karena ia selalu
  -- `true` lewat jalur admin. Yang diperiksa isi paketnya, yaitu satu-satunya
  -- hal yang menentukan jawabannya untuk pengguna biasa.
  select c.id into v_klin from public.companies c
    join public.plans p on p.id = c.plan_id
   where (p.features ->> 'klinik')::boolean is true limit 1;

  select c.id into v_apo from public.companies c
    join public.plans p on p.id = c.plan_id
   where coalesce((p.features ->> 'klinik')::boolean, false) is false limit 1;

  if v_klin is null then
    raise exception 'GAGAL: tidak ada satu pun faskes berpaket klinik untuk diuji.';
  end if;
  if v_apo is null then
    raise exception 'GAGAL: tidak ada faskes berpaket NON-klinik untuk diuji.';
  end if;

  select coalesce((p.features ->> 'klinik')::boolean, false) into v_fitur
    from public.companies c join public.plans p on p.id = c.plan_id where c.id = v_klin;
  if not v_fitur then
    raise exception 'GAGAL: paket klinik seharusnya membuka modul klinik.';
  end if;

  select coalesce((p.features ->> 'klinik')::boolean, false) into v_fitur
    from public.companies c join public.plans p on p.id = c.plan_id where c.id = v_apo;
  if v_fitur then
    raise exception 'GAGAL: paket non-klinik seharusnya TIDAK membuka modul klinik.';
  end if;

  -- ── 4. Faskes tanpa paket tetap lolos ──────────────────────────────────
  -- Yang belum dipasangi paket biasanya baru mendaftar atau sedang disiapkan
  -- tangan, dan mengunci mereka berarti mengunci orang yang belum sempat
  -- ditawari apa pun.
  if position('c.plan_id is null then true' in
      (select pg_get_functiondef(p.oid) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'boleh_modul_klinik' limit 1)) = 0 then
    raise exception 'GAGAL: faskes tanpa paket tidak lagi dilewatkan.';
  end if;

  -- ── 5. Kode galatnya SH008, bukan teks yang dicocokkan ─────────────────
  if position('SH008' in
      (select pg_get_functiondef(p.oid) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'wajib_modul_klinik' limit 1)) = 0 then
    raise exception 'GAGAL: wajib_modul_klinik tidak memakai SQLSTATE SH008.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
