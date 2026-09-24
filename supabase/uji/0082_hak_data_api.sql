-- ============================================================
-- UJI 0082  Hak Data API tertulis, bukan diberikan Supabase
-- ============================================================
--
-- BUKAN migrasi. Tempelkan di SQL Editor sesudah migrasi 0082 dijalankan,
-- DAN sesudah tiap migrasi yang membuat tabel baru. Tidak mengubah apa pun.
-- Yang benar cuma satu keluaran: galat terakhir berbunyi "SEMUA UJI LULUS".
--
-- Sejak 30 Oktober 2026 tabel baru di public lahir TANPA hak Data API. Lupa
-- menulis grant tidak menggagalkan migrasinya: tabelnya ada, dan aplikasi
-- membacanya sebagai "permission denied". Uji ini yang menangkapnya sebelum
-- peramban orang lain.
--
-- Yang diperiksa DIHITUNG dari katalog, bukan dari daftar harfiah: tabel yang
-- lahir besok ikut diperiksa tanpa ada yang ingat menambahkannya ke sini.

do $$
declare
  r record;
  v_kurang text := '';
begin
  -- ── 1. Tiap tabel public terjangkau authenticated & service_role ──────
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  loop
    if not has_table_privilege('authenticated', format('public.%I', r.relname), 'select')
    or not has_table_privilege('service_role',  format('public.%I', r.relname), 'select') then
      v_kurang := v_kurang || ' ' || r.relname;
    end if;
  end loop;
  if v_kurang <> '' then
    raise exception 'GAGAL: tanpa grant Data API:%. Tulis grant-nya di migrasi yang membuat tabel itu.', v_kurang;
  end if;

  -- ── 2. Tiap tabel ber-RLS menyala ────────────────────────────────────
  -- Hak tabel memberi anon & authenticated DML penuh; yang menahan cuma RLS.
  -- Tabel baru yang diberi grant tapi lupa RLS terbuka untuk semua klinik.
  v_kurang := '';
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    v_kurang := v_kurang || ' ' || r.relname;
  end loop;
  if v_kurang <> '' then
    raise exception 'GAGAL: tabel tanpa RLS:%.', v_kurang;
  end if;

  -- ── 3. Kedua view antrean TETAP tertutup untuk anon ──────────────────
  if has_table_privilege('anon', 'public.v_antrean_hari_ini', 'select') then
    raise exception 'GAGAL: anon bisa membaca v_antrean_hari_ini.';
  end if;
  if has_table_privilege('anon', 'public.v_resep_menunggu', 'select') then
    raise exception 'GAGAL: anon bisa membaca v_resep_menunggu.';
  end if;

  -- ── 4. Sequence bisa dipakai nilai bawaan kolom ──────────────────────
  v_kurang := '';
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'S'
  loop
    if not has_sequence_privilege('authenticated', format('public.%I', r.relname), 'usage') then
      v_kurang := v_kurang || ' ' || r.relname;
    end if;
  end loop;
  if v_kurang <> '' then
    raise exception 'GAGAL: sequence tanpa USAGE untuk authenticated:%.', v_kurang;
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
