-- ============================================================
-- 0090  peran_saya() membaca peran di outlet yang SEDANG DIBUKA
-- ============================================================
--
-- Ditemukan 28 September 2026 saat merancang hak stok opname.
--
-- `peran_saya()` (0039) mengambil `app_users.role` dengan `limit 1` TANPA
-- memandang faskes, dan mengenali pemilik dari faskes MANA SAJA. Sejak 0065
-- satu orang boleh punya peran berbeda di tiap outlet: apoteker di cabang A,
-- kasir di cabang B. Yang terpakai adalah baris yang kebetulan terbaca lebih
-- dulu, jadi:
--
--   - kasir di cabang B bisa lolos `boleh('stok.opname.final')` karena ia
--     apoteker di cabang A, atau sebaliknya ditolak padahal berhak;
--   - pemilik faskes A yang diberi peran kasir di faskes milik orang lain
--     terbaca sebagai PEMILIK di sana, dan pemilik mendapat semuanya.
--
-- Sepuluh fungsi bersandar padanya (seluruh penjaga rekam medis 0039, klaim,
-- opname). `my_context()`, yang menentukan menu di layar, SUDAH membaca per
-- faskes aktif, jadi layar dan database bisa berbeda pendapat tentang orang
-- yang sama.
--
-- Sekarang keduanya membaca faskes aktif (`auth_company_id()`, yang juga
-- menghormati pemilih outlet) dengan urutan yang SAMA: pemilik faskes itu
-- dulu, lalu baris app_users di faskes itu. Outlet mewarisi admin_email
-- pemiliknya (tambah_outlet), jadi pemilik tetap pemilik di setiap outletnya.

create or replace function public.peran_saya()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with aktif as (select public.auth_company_id() as co, lower(auth.jwt() ->> 'email') as email)
  select coalesce(
    (select 'pemilik' from public.companies c, aktif a
      where c.id = a.co and lower(c.admin_email) = a.email and c.deleted_at is null),
    (select u.role from public.app_users u, aktif a
      where u.company_id = a.co and lower(u.email) = a.email and u.status = 'aktif'
      order by u.created_at, u.id
      limit 1));
$$;

revoke all on function public.peran_saya() from public, anon;
grant execute on function public.peran_saya() to authenticated;

-- my_context: urutan yang sama. Dulu `coalesce(v_user.role, 'pemilik')`
-- membuat pemilik yang KEBETULAN punya baris app_users terbaca sebagai peran
-- baris itu di layar, sementara database menganggapnya pemilik.
do $$
declare
  v_def  text;
  v_lama text := $j$    'role',     coalesce(v_user.role, 'pemilik'),$j$;
  v_baru text := $j$    'role',     case when v_row.id is not null and exists (
                    select 1 from public.companies c
                     where c.id = v_company and lower(c.admin_email) = v_email)
                  then 'pemilik' else coalesce(v_user.role, 'pemilik') end,$j$;
begin
  select pg_get_functiondef('public.my_context()'::regprocedure) into v_def;
  if position(v_lama in v_def) = 0 then
    if position('then ''pemilik'' else coalesce(v_user.role' in v_def) > 0 then return; end if;
    raise exception 'Jangkar my_context tidak ditemukan; migrasi 0090 dibatalkan.';
  end if;
  execute replace(v_def, v_lama, v_baru);
  select pg_get_functiondef('public.my_context()'::regprocedure) into v_def;
  if position('then ''pemilik'' else coalesce(v_user.role' in v_def) = 0 then
    raise exception 'my_context tidak memuat urutan peran yang baru; migrasi 0090 dibatalkan.';
  end if;
end $$;
