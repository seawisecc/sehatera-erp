-- ============================================================
-- 0088  Email wajib dikonfirmasi: auto_confirm_email dicabut
-- ============================================================
--
-- `auto_confirm_email` adalah trigger BEFORE INSERT di `auth.users` yang
-- mengisi `email_confirmed_at` saat akun dibuat. Ia dipasang dari folder
-- arsip `sql/fix_email_confirmation.sql`, tidak pernah ada di migrasi mana
-- pun, dan kemungkinan besar lahir karena email konfirmasi bawaan Supabase
-- tidak terkirim.
--
-- Akibatnya "Confirm email" yang menyala di setelan Auth tidak pernah
-- berlaku: siapa pun bisa mendaftar memakai email ORANG LAIN dan langsung
-- dianggap pemiliknya. Hak akses Sehatera dibaca dari email (app_users,
-- company.admin_email, outlet), jadi email yang sudah diberi akses tapi
-- pemiliknya belum pernah mendaftar bisa diambil alih oleh yang mendaftar
-- lebih dulu. Ditemukan saat audit 28 September 2026.
--
-- Dicabut SESUDAH SMTP Resend terbukti mengirim (28 September 2026, email
-- atur ulang sandi sampai ke kotak masuk dari noreply@send.seawise.id) dan
-- template konfirmasi berbahasa Indonesia terpasang. Urutan sebaliknya
-- membuat klinik yang mendaftar tidak pernah bisa masuk.
--
-- Akun yang sudah terkonfirmasi tidak disentuh.
--
-- Berlapis, karena Supabase membatasi perubahan pada skema `auth`: kalau
-- trigger di `auth.users` tidak boleh dicabut dari sini, isi fungsinya
-- (milik skema public) dikosongkan, hasilnya sama. Diperiksa di akhir; kalau
-- email masih bisa terkonfirmasi sendiri, migrasinya GAGAL.

do $$
begin
  begin
    drop trigger if exists trg_auto_confirm_email on auth.users;
  exception when insufficient_privilege then
    raise notice 'Trigger di auth.users tidak bisa dicabut dari sini; fungsinya dikosongkan.';
  end;
end $$;

create or replace function public.auto_confirm_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Sengaja kosong sejak migrasi 0088. Kalau trigger di auth.users masih
  -- terpasang, ia memanggil fungsi ini dan tidak mengubah apa pun.
  return new;
end;
$$;

revoke execute on function public.auto_confirm_email() from public, anon, authenticated;

-- Periksa sendiri: fungsi yang masih mengisi email_confirmed_at berarti
-- pencabutannya gagal diam-diam.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'auto_confirm_email'
       and p.prosrc ilike '%email_confirmed_at%'
  ) then
    raise exception 'auto_confirm_email masih mengisi email_confirmed_at; migrasi 0088 dibatalkan.';
  end if;
end $$;
