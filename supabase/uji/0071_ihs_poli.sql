-- ============================================================
-- Uji migrasi 0071: nomor IHS per poli, dan satu kolom praktisi
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruh percobaannya
-- dibatalkan dan tidak meninggalkan baris di produksi.
--
-- Yang dibuktikan, dan yang ketiga paling mudah terlewat: kolom barunya ada,
-- `simpan_poli` benar-benar MENYIMPANNYA (bukan sekadar menerima kuncinya lalu
-- membuangnya), dan panggilan yang TIDAK membawa kunci itu tidak menghapus
-- nilai yang sudah ada. Yang ketiga itu bentuk kegagalan yang paling sunyi:
-- layar poli menyimpan nama, dan nomor IHS-nya hilang tanpa ada yang menekan
-- apa pun untuk menghapusnya.

do $$
declare
  v_co   uuid;
  v_out  jsonb;
  v_id   uuid;
  v_txt  text;
  v_n    integer;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then
    raise exception 'Klinik contoh tidak ditemukan. Jalankan seed_demo_klinik.sql lebih dulu.';
  end if;

  -- ── 1. Kolomnya ada ──────────────────────────────────────────────────────
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'clinic_units'
                    and column_name = 'ihs_location_id') then
    raise exception 'clinic_units.ihs_location_id tidak ada.';
  end if;

  -- ── 2. Kolom kembar di app_users sudah dibereskan ────────────────────────
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'app_users' and column_name = 'ihs_id') then
    raise exception 'app_users.ihs_id masih ada: dua kolom untuk satu fakta.';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'app_users'
                    and column_name = 'ihs_practitioner_id') then
    raise exception 'app_users.ihs_practitioner_id hilang: yang dibuang justru kolom yang dipakai layar.';
  end if;

  -- ── 3. Membuat poli SEKALIAN dengan nomor IHS-nya ────────────────────────
  v_out := public.simpan_poli(null, jsonb_build_object(
    'company_id', v_co, 'nama', 'Uji Poli IHS', 'kode', 'ZZ',
    'tarif_konsultasi', 50000, 'ihs_location_id', 'L-UJI-0001'));
  v_id := (v_out ->> 'id')::uuid;

  if v_out ->> 'ihs_location_id' is distinct from 'L-UJI-0001' then
    raise exception 'Nomor IHS poli tidak tersimpan saat dibuat: %.', v_out ->> 'ihs_location_id';
  end if;

  -- ── 4. Mengubah nomor IHS-nya ────────────────────────────────────────────
  v_out := public.simpan_poli(v_id, jsonb_build_object(
    'company_id', v_co, 'nama', 'Uji Poli IHS', 'kode', 'ZZ',
    'ihs_location_id', 'L-UJI-0002'));
  if v_out ->> 'ihs_location_id' is distinct from 'L-UJI-0002' then
    raise exception 'Nomor IHS poli tidak berubah: %.', v_out ->> 'ihs_location_id';
  end if;

  -- ── 5. Panggilan TANPA kunci itu tidak boleh menghapusnya ────────────────
  -- Ini yang paling penting di berkas ini. Layar Poli & Dokter menyimpan nama
  -- dan tarif tanpa membawa kolom SatuSehat, dan kalau `coalesce` biasa yang
  -- dipakai, nomor IHS-nya lenyap tiap kali ada yang membetulkan salah ketik
  -- pada nama polinya.
  v_out := public.simpan_poli(v_id, jsonb_build_object(
    'company_id', v_co, 'nama', 'Uji Poli IHS Ganti', 'kode', 'ZZ'));
  if v_out ->> 'ihs_location_id' is distinct from 'L-UJI-0002' then
    raise exception 'Nomor IHS poli hilang saat menyimpan tanpa membawa kolomnya: %.',
      coalesce(v_out ->> 'ihs_location_id', '(kosong)');
  end if;

  -- ── 6. Mengosongkan dengan SENGAJA tetap bisa ────────────────────────────
  v_out := public.simpan_poli(v_id, jsonb_build_object(
    'company_id', v_co, 'nama', 'Uji Poli IHS Ganti', 'kode', 'ZZ', 'ihs_location_id', ''));
  if v_out ->> 'ihs_location_id' is not null then
    raise exception 'Nomor IHS poli tidak bisa dikosongkan dengan sengaja.';
  end if;

  -- ── 7. `simpan_poli` tidak melahirkan fungsi kembar ──────────────────────
  select count(*) into v_n
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'simpan_poli';
  if v_n <> 1 then
    raise exception 'Ada % versi simpan_poli. Panggilannya jadi ambigu, seperti migrasi 0048.', v_n;
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
