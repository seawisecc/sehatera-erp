-- ============================================================
-- UJI 0093  Anggota tim dibuatkan langsung, dan atur ulang sandi
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruhnya dibatalkan.
-- Identitas disimulasikan lewat request.jwt.claims, seperti uji 0090.
-- Akun Auth-nya sendiri dibuat route handler, jadi yang diuji di sini adalah
-- GERBANG haknya, dan separuh pemeriksaannya menguji yang TIDAK boleh.

do $$
declare
  v_a       uuid;
  v_b       uuid;
  v_lain    uuid;
  v_pemilik text;
  v_kasir   text := 'uji.kasir.0093@contoh.test';
  v_dokter  text := 'uji.dokter.0093@contoh.test';
  v_ganda   text := 'uji.ganda.0093@contoh.test';
  v_ok      boolean;
  v_jawab   jsonb;
begin
  select id, admin_email into v_a, v_pemilik from public.companies where nama = 'Klinik Rexco 88' limit 1;
  select id into v_b from public.companies where nama = 'Apotek Rexco Renon' limit 1;
  select id into v_lain from public.companies where id not in (v_a, v_b) and admin_email is not null
     and lower(admin_email) <> lower(v_pemilik) limit 1;
  if v_a is null or v_b is null or v_lain is null then raise exception 'Faskes uji tidak lengkap.'; end if;

  perform set_config('request.jwt.claims', json_build_object('email', lower(v_pemilik), 'role', 'authenticated')::text, true);
  delete from public.outlet_aktif where lower(email) = lower(v_pemilik);
  insert into public.outlet_aktif (email, company_id) values (lower(v_pemilik), v_a);

  -- 1. Pemilik menambah dokter: peran klinik kini diterima ------------------
  v_jawab := public.tambah_anggota_tim(v_dokter, 'Uji Dokter', 'dokter', '[]'::jsonb);
  if (v_jawab ->> 'company_id')::uuid <> v_a then raise exception 'GAGAL 1: masuk ke faskes yang salah.'; end if;
  if not exists (select 1 from public.app_users where company_id = v_a and email = v_dokter and role = 'dokter' and status = 'aktif') then
    raise exception 'GAGAL 1b: baris app_users tidak terbentuk.';
  end if;
  if not exists (select 1 from public.audit_logs where entity_id = (v_jawab ->> 'id') and action = 'pengguna.dibuat') then
    raise exception 'GAGAL 1c: tidak tercatat di jejak audit.';
  end if;

  -- 2. Yang TIDAK boleh: email kembar, peran pemilik, nama kosong ----------
  begin
    perform public.tambah_anggota_tim(upper(v_dokter), 'Lagi', 'kasir');
    raise exception 'GAGAL 2: email kembar diterima.';
  exception when sqlstate 'SH004' then
    if sqlerrm not like '%sudah terdaftar%' then raise exception 'GAGAL 2 alasan: %', sqlerrm; end if;
  end;
  begin
    perform public.tambah_anggota_tim('uji.pemilik2.0093@contoh.test', 'Pemilik Dua', 'pemilik');
    raise exception 'GAGAL 2b: pemilik kedua bisa dibuat.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.tambah_anggota_tim('uji.tanpanama.0093@contoh.test', '  ', 'kasir');
    raise exception 'GAGAL 2c: nama kosong diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Kasir tidak boleh menambah orang -----------------------------------
  perform public.tambah_anggota_tim(v_kasir, 'Uji Kasir', 'kasir');
  perform set_config('request.jwt.claims', json_build_object('email', v_kasir, 'role', 'authenticated')::text, true);
  begin
    perform public.tambah_anggota_tim('uji.selundup.0093@contoh.test', 'Selundup', 'admin');
    raise exception 'GAGAL 3: kasir bisa menambah admin.';
  exception when sqlstate 'SH007' then null;
  end;
  begin
    perform public.izinkan_atur_sandi(v_dokter);
    raise exception 'GAGAL 3b: kasir bisa mengatur ulang sandi dokter.';
  exception when sqlstate 'SH007' then null;
  end;

  -- 4. Atur ulang sandi: yang boleh, dan yang tidak -----------------------
  perform set_config('request.jwt.claims', json_build_object('email', lower(v_pemilik), 'role', 'authenticated')::text, true);
  v_ok := public.izinkan_atur_sandi(v_dokter);
  if not v_ok then raise exception 'GAGAL 4: pemilik ditolak mengatur ulang sandi dokternya.'; end if;
  begin
    perform public.izinkan_atur_sandi(v_pemilik);
    raise exception 'GAGAL 4b: sandi sendiri lewat jalur ini.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.izinkan_atur_sandi('tidak.ada.0093@contoh.test');
    raise exception 'GAGAL 4c: orang luar tim bisa diatur ulang.';
  exception when sqlstate 'SH004' then null;
  end;

  -- Orang yang juga bekerja di outlet KEDUA milik pemilik yang sama: boleh.
  insert into public.app_users (company_id, nama, email, role, status) values
    (v_a, 'Uji Ganda', v_ganda, 'apoteker', 'aktif'),
    (v_b, 'Uji Ganda', v_ganda, 'kasir', 'aktif');
  if not public.izinkan_atur_sandi(v_ganda) then raise exception 'GAGAL 4d: dua outlet sendiri ditolak.'; end if;

  -- Orang yang juga bekerja di faskes ORANG LAIN: tidak boleh, sandinya
  -- membuka faskes itu juga.
  insert into public.app_users (company_id, nama, email, role, status) values
    (v_lain, 'Uji Ganda', v_ganda, 'kasir', 'aktif');
  begin
    perform public.izinkan_atur_sandi(v_ganda);
    raise exception 'GAGAL 4e: sandi orang yang juga bekerja di faskes lain bisa diambil alih.';
  exception when sqlstate 'SH007' then
    if sqlerrm not like '%faskes lain%' then raise exception 'GAGAL 4e alasan: %', sqlerrm; end if;
  end;

  -- 5. Hak panggil -------------------------------------------------------
  if has_function_privilege('authenticated', 'public.id_akun_by_email(text)', 'execute')
     or has_function_privilege('anon', 'public.id_akun_by_email(text)', 'execute') then
    raise exception 'GAGAL 5: id_akun_by_email terbuka untuk peramban.';
  end if;
  if not has_function_privilege('service_role', 'public.id_akun_by_email(text)', 'execute') then
    raise exception 'GAGAL 5b: service_role tidak bisa memanggil id_akun_by_email.';
  end if;
  if has_function_privilege('anon', 'public.tambah_anggota_tim(text, text, text, jsonb, uuid)', 'execute') then
    raise exception 'GAGAL 5c: anon bisa menambah anggota tim.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
