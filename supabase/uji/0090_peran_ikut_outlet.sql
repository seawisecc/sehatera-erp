-- ============================================================
-- UJI 0090  Peran dibaca per outlet yang sedang dibuka
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruhnya dibatalkan.
-- Identitas pengguna disimulasikan lewat request.jwt.claims, yang dibaca
-- auth.jwt() persis seperti saat PostgREST meneruskan token peramban.

do $$
declare
  v_a     uuid;
  v_b     uuid;
  v_email text := 'uji.peran.0090@contoh.test';
  v_pemilik text;
begin
  select id, admin_email into v_a, v_pemilik from public.companies where nama = 'Klinik Rexco 88' limit 1;
  select id into v_b from public.companies where nama = 'Apotek Rexco Renon' limit 1;
  if v_a is null or v_b is null then raise exception 'Kedua outlet Rexco tidak ditemukan.'; end if;

  -- Satu orang, dua peran: apoteker di A, kasir di B.
  insert into public.app_users (company_id, nama, email, role, status)
  values (v_a, 'Uji Peran', v_email, 'apoteker', 'aktif'),
         (v_b, 'Uji Peran', v_email, 'kasir', 'aktif');
  perform set_config('request.jwt.claims', json_build_object('email', v_email, 'role', 'authenticated')::text, true);

  -- 1. Membuka A: apoteker, dan boleh memfinalkan opname --------------------
  delete from public.outlet_aktif where lower(email) = v_email;
  insert into public.outlet_aktif (email, company_id) values (v_email, v_a);
  if public.auth_company_id() <> v_a then raise exception 'GAGAL 1: auth_company_id tidak menunjuk A.'; end if;
  if public.peran_saya() <> 'apoteker' then raise exception 'GAGAL 1b: di A terbaca %.', public.peran_saya(); end if;
  if not public.boleh('stok.opname.final') then raise exception 'GAGAL 1c: apoteker di A ditolak.'; end if;
  if public.my_context() ->> 'role' <> 'apoteker' then
    raise exception 'GAGAL 1d: layar dan database berbeda pendapat di A: %.', public.my_context() ->> 'role';
  end if;

  -- 2. Membuka B: kasir, dan TIDAK boleh ---------------------------------
  update public.outlet_aktif set company_id = v_b where lower(email) = v_email;
  if public.peran_saya() <> 'kasir' then
    raise exception 'GAGAL 2: di B terbaca % (peran dari outlet lain).', public.peran_saya();
  end if;
  if public.boleh('stok.opname.final') or public.boleh('resep.layani') then
    raise exception 'GAGAL 2b: kasir di B memakai hak apotekernya di A.';
  end if;
  if public.my_context() ->> 'role' <> 'kasir' then
    raise exception 'GAGAL 2c: layar di B membaca %.', public.my_context() ->> 'role';
  end if;

  -- 3. Pemilik tetap pemilik, di outlet mana pun miliknya -----------------
  perform set_config('request.jwt.claims', json_build_object('email', lower(v_pemilik), 'role', 'authenticated')::text, true);
  delete from public.outlet_aktif where lower(email) = lower(v_pemilik);
  insert into public.outlet_aktif (email, company_id) values (lower(v_pemilik), v_b);
  if public.peran_saya() <> 'pemilik' or public.my_context() ->> 'role' <> 'pemilik' then
    raise exception 'GAGAL 3: pemilik di outlet keduanya terbaca % / %.', public.peran_saya(), public.my_context() ->> 'role';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
