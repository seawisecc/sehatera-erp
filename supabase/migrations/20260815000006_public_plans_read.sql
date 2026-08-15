-- ============================================================
-- Sehatera · 0006 · Paket harus terbaca tanpa login
--
-- Migrasi 0002 memasang satu policy baca untuk `plans`:
--
--     using (is_public or public.is_super_admin())
--
-- dan di migrasi yang sama hak panggil `is_super_admin()` dicabut dari `anon` —
-- fungsi itu membaca tabel super admin, jadi memang tidak boleh bisa dipanggil
-- pengunjung. Akibat gabungan keduanya: pengunjung yang membuka halaman harga
-- mendapat `permission denied for function is_super_admin`, bukan daftar paket.
-- PostgreSQL memeriksa hak panggil fungsi di dalam policy tanpa peduli bahwa
-- `is_public` sudah cukup untuk meloloskannya.
--
-- Ditemukan dengan menembak REST API memakai kunci anon yang memang ada di
-- dalam browser, bukan lewat aplikasi — dan memang begitu seharusnya diuji.
--
-- Perbaikannya MEMISAHKAN policy per peran, bukan membuka `is_super_admin()`
-- untuk anon. Pengunjung hanya boleh melihat paket yang ditandai publik; paket
-- yang belum siap dijual — misalnya Klinik, yang harganya belum diketok —
-- tetap tidak terlihat.
-- ============================================================

drop policy if exists "plans_read"      on public.plans;
drop policy if exists "plans_read_anon" on public.plans;
drop policy if exists "plans_read_auth" on public.plans;

create policy "plans_read_anon" on public.plans
  for select to anon
  using (is_public);

create policy "plans_read_auth" on public.plans
  for select to authenticated
  using (is_public or public.is_super_admin());

comment on table public.plans is
  'Paket langganan Sehatera. Baris is_public = false hanya terlihat oleh Super Admin — dipakai untuk paket yang harganya belum diketok.';
