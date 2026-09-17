-- ============================================================
-- 0081  Modul klinik akhirnya digerbangi paket
-- ============================================================
--
-- `plans.features->>'klinik'` sudah ada sejak paket dibangun, `lib/plan.ts`
-- menghitungnya, dan `DaftarPaket` menampilkannya. Yang tidak pernah ada:
-- satu pun tempat yang MEMERIKSANYA. Siapa pun yang mendaftar dengan sektor
-- `klinik` mendapat seluruh modul klinik, memakai paket Starter Rp 99.000
-- sekalipun, dan tidak ada alasan siapa pun membayar paket Klinik.
--
--
-- ## Yang dikunci: MEMBUAT yang baru. Bukan membaca yang lama.
--
-- Ini keputusan yang paling menentukan di migrasi ini, dan ia disengaja.
--
-- Klinik yang paketnya turun TETAP bisa membuka, membaca, mencetak, dan
-- menambahi adendum seluruh rekam medis yang sudah ada. Yang berhenti cuma
-- lahirnya pekerjaan BARU: kunjungan baru dan reservasi baru.
--
-- Alasannya sama persis dengan kenapa masa aktif habis tidak mengunci
-- aplikasi (`lib/subscription.ts`): rekam medis adalah dokumen hukum pasien,
-- bukan barang sewaan. Klinik yang tidak bisa membaca rekam medis pasiennya
-- sendiri karena tagihannya telat sedang melanggar kewajibannya kepada orang
-- yang tidak ikut dalam urusan tagihan itu. Aturan yang sama membuat SIPNAP
-- tidak pernah masuk `lockedModules`.
--
-- **Hanya DUA pintu yang dijaga**, dan keduanya pintu MASUK ke modulnya:
--
--   `daftar_kunjungan()`  -> kunjungan baru
--   `buat_reservasi()`    -> janji datang baru
--
-- Rekam medis, resep, penunjang, tarif, dan klaim TIDAK dijaga, dan itu bukan
-- kelalaian: semuanya bekerja di atas kunjungan yang sudah ada. Begitu pintu
-- masuknya tertutup, semuanya berhenti melahirkan yang baru dengan sendirinya,
-- sementara pasien yang SEDANG diperiksa hari itu tetap bisa diselesaikan
-- sampai bayar. Menjaga kesepuluh fungsi satu per satu justru akan menelantarkan
-- pasien di tengah konsultasi, di depan dokternya.
--
--
-- ## Kolom kosong berarti PENUH, kecuali yang satu ini
--
-- `lib/plan.ts` sudah lama memperlakukan penanda yang lupa diisi sebagai
-- kemampuan penuh, karena paket dibuat tangan lewat Super Admin dan memberi
-- kelebihan lebih murah daripada mengunci klinik yang sudah membayar.
--
-- `klinik` adalah satu-satunya pengecualian, dan itu sudah tertulis di
-- `readPlanFeatures()` sejak awal: ia HARUS dinyalakan sengaja. Fungsi di bawah
-- meneruskan aturan yang sama supaya kedua sisi tidak pernah berbeda jawaban.
--
-- **Faskes TANPA paket sama sekali tetap lolos.** Yang belum dipasangi paket
-- biasanya faskes yang baru mendaftar atau sedang disiapkan tangan, dan
-- mengunci mereka berarti mengunci orang yang belum sempat ditawari apa pun.

-- ------------------------------------------------------------
-- 1. Apakah faskes ini membeli modul klinik
-- ------------------------------------------------------------

create or replace function public.boleh_modul_klinik(p_company uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    -- Jalur admin platform (super admin, service_role, koneksi langsung) tidak
    -- pernah digerbangi paket. Pola yang sama dengan `boleh()` di 0039.
    when public.boleh_admin_platform() then true
    else coalesce((
      select
        -- Tanpa paket = belum ditawari apa pun. Lihat catatan di kepala berkas.
        case when c.plan_id is null then true
             else coalesce((p.features ->> 'klinik')::boolean, false)
        end
        from public.companies c
        left join public.plans p on p.id = c.plan_id
       where c.id = coalesce(p_company, public.auth_company_id())
    ), false)
  end
$$;

comment on function public.boleh_modul_klinik(uuid) is
  'Apakah paket faskes ini membuka modul klinik. Faskes tanpa paket tetap lolos: yang belum ditawari apa pun tidak boleh dikunci.';

revoke all on function public.boleh_modul_klinik(uuid) from public, anon;
grant execute on function public.boleh_modul_klinik(uuid) to authenticated;


-- ------------------------------------------------------------
-- 2. Penolakannya, dengan pesan yang sudah ditulis untuk pemiliknya
-- ------------------------------------------------------------
--
-- SQLSTATE tersendiri, bukan teks yang dicocokkan, supaya `pesanError()` di
-- `lib/session.ts` mengenalinya tanpa menebak. SH008 melanjutkan SH001..SH007.

create or replace function public.wajib_modul_klinik(p_company uuid default null)
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.boleh_modul_klinik(p_company) then
    raise exception
      'Paket fasilitas ini belum membuka modul klinik, jadi kunjungan dan reservasi baru tidak bisa dibuat. Rekam medis yang sudah ada tetap bisa dibuka, dicetak, dan ditambahi adendum. Buka Pengaturan > Langganan untuk menaikkan paket.'
      using errcode = 'SH008';
  end if;
end;
$$;

revoke all on function public.wajib_modul_klinik(uuid) from public, anon;
grant execute on function public.wajib_modul_klinik(uuid) to authenticated;


-- ------------------------------------------------------------
-- 3. Dipasang di kedua pintu masuk
-- ------------------------------------------------------------
--
-- Ditambahkan ke dalam fungsi yang sudah ada lewat `create or replace`, dan
-- keduanya tidak berubah tanda tangannya sama sekali. Menambah argumen
-- berdefault MELAHIRKAN fungsi kedua alih-alih mengganti yang lama (migrasi
-- 0048 sudah menggigit begitu), dan di sini memang tidak ada argumen baru.

-- Penjaganya disisipkan sesudah faskesnya ditentukan dan sebelum satu baris
-- pun dibaca atau ditulis. Jangkarnya BERBEDA di kedua fungsi, dan itu yang
-- hampir membuat migrasi ini gagal diam-diam: `daftar_kunjungan` memakai
-- `v_company` dengan pesan "Akun ini belum terhubung...", sementara
-- `buat_reservasi` memakai `v_co` dengan pesan "Fasilitas tidak ditemukan.".
-- Jangkar yang salah membuat `replace()` tidak melakukan apa pun, fungsinya
-- ditulis ulang persis seperti semula, dan migrasinya melapor BERHASIL sambil
-- meninggalkan pintu terbuka. Karena itu tiap sisipan diperiksa sesudahnya.

create or replace function pg_temp.pasang_gerbang_klinik(
  p_fungsi text, p_jangkar text
) returns void
language plpgsql
as $pasang$
declare
  v_src text;
  v_bar text;
begin
  select pg_get_functiondef(p.oid) into v_src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = p_fungsi
   limit 1;

  if v_src is null then
    raise exception 'Fungsi %() tidak ditemukan. Migrasi sebelumnya belum jalan?', p_fungsi;
  end if;

  -- Sudah terpasang: migrasi ini aman dijalankan ulang.
  if position('wajib_modul_klinik' in v_src) > 0 then
    return;
  end if;

  if position(p_jangkar in v_src) = 0 then
    raise exception
      'Jangkar tidak ditemukan di %(). Isinya berubah sejak migrasi ini ditulis, jadi gerbang modul klinik TIDAK dipasang. Perbaiki jangkarnya, jangan dilewati.',
      p_fungsi;
  end if;

  v_bar := replace(v_src, p_jangkar, p_jangkar || chr(10) || chr(10)
    || '  perform public.wajib_modul_klinik(' ||
       case when p_fungsi = 'buat_reservasi' then 'v_co' else 'v_company' end || ');');

  execute v_bar;

  -- Dibaca ULANG dari database, bukan dipercaya dari variabel di atas: yang
  -- diperiksa harus yang benar-benar terpasang.
  select pg_get_functiondef(p.oid) into v_src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = p_fungsi
   limit 1;

  if position('wajib_modul_klinik' in v_src) = 0 then
    raise exception 'Gerbang gagal terpasang di %(), dan tidak boleh dibiarkan lolos diam-diam.', p_fungsi;
  end if;
end;
$pasang$;

select pg_temp.pasang_gerbang_klinik(
  'daftar_kunjungan',
  'raise exception ''Akun ini belum terhubung ke fasilitas mana pun.'' using errcode = ''SH004'';
  end if;');

select pg_temp.pasang_gerbang_klinik(
  'buat_reservasi',
  'perform public.wajib_boleh(''reservasi.tulis'');');
