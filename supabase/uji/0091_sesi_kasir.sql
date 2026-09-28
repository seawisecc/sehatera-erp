-- ============================================================
-- UJI 0091  Sesi kasir dan tutup kasir
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruhnya dibatalkan.
-- Kasir disimulasikan lewat request.jwt.claims (lihat uji 0090). Waktu di
-- dalam satu transaksi database berhenti di satu titik, jadi jam sesi dan
-- transaksinya digeser mundur secara eksplisit.

do $$
declare
  v_co   uuid;
  v_a    text := 'uji.kasir.a.0091@contoh.test';
  v_b    text := 'uji.kasir.b.0091@contoh.test';
  v_sesi uuid;
  v_sesi2 uuid;
  v_h    jsonb;
  v_row  record;
  v_trx  uuid;
begin
  -- Apotek biasa, bukan instalasi farmasi: di instalasi setiap transaksi wajib
  -- terikat ke kunjungan (0021), dan itu bukan yang diuji di sini.
  select id into v_co from public.companies where nama = 'Apotek Rexco Renon' limit 1;
  insert into public.app_users (company_id, nama, email, role, status)
  values (v_co, 'Kasir A', v_a, 'kasir', 'aktif'), (v_co, 'Kasir B', v_b, 'kasir', 'aktif');
  delete from public.outlet_aktif where lower(email) in (v_a, v_b);

  -- 1. Kolom kasir terisi sendiri dari token --------------------------------
  if coalesce((select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d
                 join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
                where d.adrelid = 'public.transactions'::regclass and a.attname = 'dibuat_oleh'), '') not like '%jwt%' then
    raise exception 'GAGAL 1: transactions.dibuat_oleh tidak berbawaan email dari token.';
  end if;

  -- 2. Kasir A membuka sesi; sesi kedua ditolak ----------------------------
  perform set_config('request.jwt.claims', json_build_object('email', v_a, 'role', 'authenticated')::text, true);
  v_sesi := (public.buka_kasir(200000) ->> 'id')::uuid;
  begin
    perform public.buka_kasir(100000);
    raise exception 'GAGAL 2: satu kasir bisa membuka dua sesi.';
  exception when sqlstate 'SH004' then null;
  end;
  update public.sesi_kasir set dibuka_pada = now() - interval '2 hours' where id = v_sesi;

  -- Tiga transaksi A selama sesi, satu transaksi B, satu transaksi A SEBELUM sesi.
  insert into public.transactions (company_id, total, bayar, kembalian, status, metode_bayar, diterima_tunai, dibuat_oleh, created_at)
  values (v_co, 50000, 50000, 0, 'selesai', 'Tunai', 50000, v_a, now() - interval '1 hour')
  returning id into v_trx;
  insert into public.transactions (company_id, total, bayar, kembalian, status, metode_bayar, diterima_tunai, dibuat_oleh, created_at)
  values (v_co, 30000, 30000, 0, 'selesai', 'QRIS', 30000, v_a, now() - interval '50 minutes'),
         (v_co, 10000, 10000, 0, 'dibatalkan', 'Tunai', 10000, v_a, now() - interval '40 minutes'),
         (v_co, 70000, 70000, 0, 'selesai', 'Tunai', 70000, v_b, now() - interval '30 minutes'),
         (v_co, 90000, 90000, 0, 'selesai', 'Tunai', 90000, v_a, now() - interval '3 hours');

  -- 3. Hitungan laci: hanya milik A, dalam sesi, tanpa yang batal --------------
  v_h := public.hitung_sesi_kasir(v_sesi);
  if (v_h ->> 'tunai')::numeric <> 50000 or (v_h ->> 'non_tunai')::numeric <> 30000
     or (v_h ->> 'jumlah')::integer <> 2 or (v_h ->> 'kas_seharusnya')::numeric <> 250000 then
    raise exception 'GAGAL 3: hitungan laci %.', v_h;
  end if;

  -- 4. Kasir B tidak bisa menutup laci A -----------------------------------
  perform set_config('request.jwt.claims', json_build_object('email', v_b, 'role', 'authenticated')::text, true);
  begin
    perform public.tutup_kasir(v_sesi, 250000, null);
    raise exception 'GAGAL 4: kasir lain bisa menutup sesi A.';
  exception when sqlstate 'SH007' then null;
  end;

  -- 5. Selisih tanpa catatan ditolak; dengan catatan dibekukan -------------
  perform set_config('request.jwt.claims', json_build_object('email', v_a, 'role', 'authenticated')::text, true);
  begin
    perform public.tutup_kasir(v_sesi, 240000, null);
    raise exception 'GAGAL 5: selisih tanpa catatan diterima.';
  exception when sqlstate 'SH004' then null;
  end;
  perform public.tutup_kasir(v_sesi, 240000, 'Kembalian salah ke pembeli');
  select * into v_row from public.sesi_kasir where id = v_sesi;
  if v_row.status <> 'tutup' or v_row.kas_seharusnya <> 250000 or v_row.selisih <> -10000
     or v_row.tunai_diterima <> 50000 or v_row.jumlah_transaksi <> 2 then
    raise exception 'GAGAL 5b: sesi tertutup menyimpan % / % / %.', v_row.status, v_row.kas_seharusnya, v_row.selisih;
  end if;

  -- 6. Setoran yang sudah diserahkan tidak berubah oleh pembatalan kemudian -
  update public.transactions set status = 'dibatalkan' where id = v_trx;
  if (select kas_seharusnya from public.sesi_kasir where id = v_sesi) <> 250000 then
    raise exception 'GAGAL 6: setoran tertutup berubah sesudah transaksinya dibatalkan.';
  end if;
  begin
    perform public.tutup_kasir(v_sesi, 250000, 'ulang');
    raise exception 'GAGAL 6b: sesi tertutup bisa ditutup lagi.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Sesudah tutup, A boleh membuka sesi baru ----------------------------
  v_sesi2 := (public.buka_kasir(150000) ->> 'id')::uuid;
  if v_sesi2 is null then raise exception 'GAGAL 7: sesi baru tidak bisa dibuka.'; end if;

  -- 8. Hak --------------------------------------------------------------
  if position('kasir.setoran' in pg_get_functiondef('public.boleh(text)'::regprocedure)) = 0 then
    raise exception 'GAGAL 8: boleh() tidak mengenal kasir.setoran.';
  end if;
  if exists (select 1 from pg_policy where polrelid = 'public.sesi_kasir'::regclass and polcmd <> 'r') then
    raise exception 'GAGAL 8b: ada policy tulis pada sesi_kasir.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
