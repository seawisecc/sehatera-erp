-- ============================================================
-- 0093  Anggota tim dibuatkan langsung oleh pemilik atau admin
-- ============================================================
--
-- Permintaan pemilik, 1 Oktober 2026: tim TIDAK diundang lewat tautan.
-- Pemilik atau admin faskes membuatkan email dan kata sandi awal, lalu
-- orangnya langsung masuk dengan itu.
--
-- Alasan undangan dulu dipakai tetap berlaku, jadi ditambal di sisi lain:
-- kata sandi yang diketik pemilik WAJIB diganti orangnya saat pertama masuk
-- (penanda `wajib_ganti_sandi` di user_metadata, dipasang route handler).
-- Tanpa itu pemilik memegang sandi kasirnya selamanya, dan transaksi atas
-- nama kasir tidak lagi membuktikan siapa yang menyerahkan obat.
--
-- Akun Auth dibuat route handler lewat service_role (`/api/tim/buat`), karena
-- membuat akun Auth memang hanya bisa dari sana. Yang di sini adalah gerbang
-- haknya, dipanggil dengan SESI pemanggil, supaya yang diperiksa adalah
-- siapa dia, bukan klaim yang ia tulis sendiri ke badan permintaan.
--
-- Sekalian menutup lubang lama: `buat_undangan()` hanya menerima lima peran
-- apotek, jadi dokter, perawat, pendaftaran, dan analis tidak pernah bisa
-- diundang sama sekali walau pilihannya ada di layar.

-- ── Apakah pemanggil pengelola faskes ini ─────────────────────────────────
-- Pemilik (admin_email faskes, atau app_users berperan pemilik) atau admin
-- aktif. Per faskes, bukan "peran saya sekarang", karena atur ulang sandi
-- harus memeriksa SETIAP faskes tempat orang itu terdaftar.
create or replace function public.pengelola_faskes(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.boleh_admin_platform()
    or exists (
      select 1 from public.companies
       where id = p_company and lower(admin_email) = lower(auth.jwt() ->> 'email'))
    or exists (
      select 1 from public.app_users
       where company_id = p_company
         and lower(email) = lower(auth.jwt() ->> 'email')
         and role in ('pemilik', 'admin')
         and status = 'aktif');
$$;

revoke all on function public.pengelola_faskes(uuid) from public, anon;
grant execute on function public.pengelola_faskes(uuid) to authenticated, service_role;

-- ── Mencatat anggota tim baru ─────────────────────────────────────────────
create or replace function public.tambah_anggota_tim(
  p_email   text,
  p_nama    text,
  p_role    text,
  p_modules jsonb default '[]'::jsonb,
  p_company uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company uuid := case when p_company is not null and public.boleh_admin_platform()
                         then p_company else public.auth_company_id() end;
  v_email   text := lower(trim(p_email));
  v_nama    text := nullif(trim(p_nama), '');
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if not public.pengelola_faskes(v_company) then
    raise exception 'Hanya pemilik atau admin yang boleh menambah anggota tim.' using errcode = 'SH007';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Alamat email tidak sah.' using errcode = 'SH004';
  end if;
  if v_nama is null then
    raise exception 'Nama anggota tim wajib diisi.' using errcode = 'SH004';
  end if;
  -- Pemilik TIDAK bisa dibuat dari sini. Pemilik lahir saat pendaftaran
  -- faskes; pemilik kedua yang dibuatkan orang lain bisa mencabut akses
  -- pembuatnya sendiri.
  if p_role not in ('admin', 'apoteker', 'asisten_apoteker', 'kasir',
                    'dokter', 'perawat', 'pendaftaran', 'analis') then
    raise exception 'Peran tidak dikenali.' using errcode = 'SH004';
  end if;
  if exists (select 1 from public.app_users
              where company_id = v_company and lower(email) = v_email) then
    raise exception 'Email ini sudah terdaftar sebagai anggota tim di sini.' using errcode = 'SH004';
  end if;

  -- Kuota pengguna ditegakkan trigger trg_quota_users (SH002).
  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_company, v_nama, v_email, p_role, 'aktif', coalesce(p_modules, '[]'::jsonb))
  returning * into v_row;

  perform public.catat_audit(v_company, 'pengguna.dibuat', 'app_users', v_row.id::text,
    jsonb_build_object('email', v_email, 'role', p_role));

  return jsonb_build_object('id', v_row.id, 'company_id', v_company, 'email', v_email);
end;
$$;

revoke all on function public.tambah_anggota_tim(text, text, text, jsonb, uuid) from public, anon;
grant execute on function public.tambah_anggota_tim(text, text, text, jsonb, uuid) to authenticated;

-- ── Boleh atau tidak mengatur ulang sandi orang ini ───────────────────────
-- Atur ulang sandi adalah MENGAMBIL ALIH akun, jadi syaratnya ketat:
--   * orangnya terdaftar di faskes pemanggil,
--   * SETIAP faskes tempat ia terdaftar dikelola pemanggil. Admin klinik A
--     tidak boleh mengganti sandi orang yang juga bekerja di klinik B milik
--     orang lain: sandi itu membuka B juga.
--   * bukan pemilik faskes mana pun, dan bukan dirinya sendiri (untuk itu
--     ada Ganti Sandi, yang meminta sandi lama).
-- Dicatat di jejak audit SEBELUM sandinya diganti route handler: yang
-- dicatat adalah keputusan siapa, dan itu yang ditanyakan kalau ada masalah.
create or replace function public.izinkan_atur_sandi(p_email text, p_company uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_company uuid := case when p_company is not null and public.boleh_admin_platform()
                         then p_company else public.auth_company_id() end;
  v_email   text := lower(trim(p_email));
  v_lain    uuid;
begin
  if v_company is null or not public.pengelola_faskes(v_company) then
    raise exception 'Hanya pemilik atau admin yang boleh mengatur ulang kata sandi anggota tim.' using errcode = 'SH007';
  end if;
  if v_email = lower(auth.jwt() ->> 'email') then
    raise exception 'Untuk kata sandi Anda sendiri, pakai Ganti Kata Sandi di menu akun.' using errcode = 'SH004';
  end if;
  if not exists (select 1 from public.app_users where company_id = v_company and lower(email) = v_email) then
    raise exception 'Orang ini bukan anggota tim di sini.' using errcode = 'SH004';
  end if;
  if exists (select 1 from public.companies where lower(admin_email) = v_email)
     or exists (select 1 from public.app_users where lower(email) = v_email and role = 'pemilik') then
    raise exception 'Kata sandi pemilik faskes tidak bisa diatur ulang orang lain. Pemiliknya memakai Lupa Kata Sandi di halaman masuk.'
      using errcode = 'SH007';
  end if;
  select company_id into v_lain from public.app_users
   where lower(email) = v_email and not public.pengelola_faskes(company_id)
   limit 1;
  if found then
    raise exception 'Orang ini juga terdaftar di faskes lain yang tidak Anda kelola, jadi sandinya tidak bisa diatur ulang dari sini. Minta ia memakai Lupa Kata Sandi.'
      using errcode = 'SH007';
  end if;

  perform public.catat_audit(v_company, 'pengguna.sandi_diatur_ulang', 'app_users', v_email,
    jsonb_build_object('email', v_email));
  return true;
end;
$$;

revoke all on function public.izinkan_atur_sandi(text, uuid) from public, anon;
grant execute on function public.izinkan_atur_sandi(text, uuid) to authenticated;

-- ── Mencari id akun Auth dari email: HANYA untuk server ──────────────────
-- API admin Supabase tidak punya pencarian per email, dan menelusuri seluruh
-- daftar akun per halaman lebih lambat dan lebih banyak membuka. Dicabut dari
-- anon dan authenticated: siapa pun yang bisa memanggilnya bisa menebak email
-- mana yang punya akun.
create or replace function public.id_akun_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.id_akun_by_email(text) from public, anon, authenticated;
grant execute on function public.id_akun_by_email(text) to service_role;
