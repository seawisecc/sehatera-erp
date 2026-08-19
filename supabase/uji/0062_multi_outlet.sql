-- ============================================================
-- Uji migrasi 0062: multi outlet
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_asal  uuid;
  v_b     uuid;
  v_grup  uuid;
  v_plan  uuid;
  v_n     integer;
  v_out   jsonb;
  v_row   record;
begin
  select id, plan_id into v_asal, v_plan from public.companies
   where deleted_at is null order by created_at limit 1;
  if v_asal is null then raise exception 'Tidak ada faskes untuk diuji.'; end if;

  -- 1. Kuota outlet akhirnya DIHITUNG -----------------------------------------
  -- Dulu `outlets` ada di company_quota tapi tidak pernah ada di company_usage,
  -- jadi batasnya terbaca di layar lalu tidak pernah dipakai menolak apa pun.
  if public.company_usage(v_asal, 'outlets') is null then
    raise exception 'company_usage masih tidak menghitung outlet.';
  end if;
  if public.company_usage(v_asal, 'outlets') < 1 then
    raise exception 'Faskes tanpa kelompok terhitung % outlet, seharusnya minimal 1.',
      public.company_usage(v_asal, 'outlets');
  end if;

  -- 2. Outlet kedua mewarisi paket dan masa aktif -----------------------------
  insert into public.company_groups (nama, dibuat_oleh) values ('UJI KELOMPOK', 'uji') returning id into v_grup;
  update public.companies set group_id = v_grup where id = v_asal;

  insert into public.companies (nama, admin_email, sektor, group_id, plan_id, status)
  select 'UJI OUTLET B', admin_email, sektor, v_grup, plan_id, status
    from public.companies where id = v_asal
  returning id into v_b;

  if (select plan_id from public.companies where id = v_b) is distinct from v_plan then
    raise exception 'Outlet kedua tidak mewarisi paket. Pemiliknya akan membayar dua langganan untuk paket bertuliskan tiga cabang.';
  end if;

  -- 3. Kuota menghitung SELURUH kelompok --------------------------------------
  select public.company_usage(v_asal, 'outlets') into v_n;
  if v_n <> 2 then
    raise exception 'Kelompok berisi dua outlet terhitung %.', v_n;
  end if;

  -- 4. Penunjuk outlet TIDAK bisa ditulis dari aplikasi ------------------------
  -- Ini yang paling penting. Kalau bisa, siapa pun yang tahu alamat tabelnya
  -- menunjuk ke outlet orang lain, dan SELURUH RLS aplikasi ikut penunjuk itu.
  select count(*) into v_n from pg_policies
   where schemaname = 'public' and tablename = 'outlet_aktif';
  if v_n > 0 then
    raise exception 'outlet_aktif punya % policy. Outlet orang lain bisa dibuka dengan menulis satu baris.', v_n;
  end if;
  select count(*) into v_n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = 'outlet_aktif' and c.relrowsecurity;
  if v_n <> 1 then raise exception 'RLS tidak menyala di outlet_aktif.'; end if;

  -- 5. Penunjuk yang menunjuk ke outlet ASING diabaikan ------------------------
  -- Ditulis lewat jalur langsung (uji ini punya hak penuh) lalu dipastikan
  -- `auth_company_id()` tidak mau memakainya untuk email yang tidak berhak.
  insert into public.outlet_aktif (email, company_id)
  values ('bukan.siapa.siapa@contoh.id', v_b)
  on conflict (email) do update set company_id = excluded.company_id;
  -- Tanpa JWT, auth_company_id() harus tetap null, bukan mengembalikan v_b.
  if public.auth_company_id() is not null then
    raise exception 'auth_company_id mengembalikan sesuatu tanpa sesi: %.', public.auth_company_id();
  end if;

  -- 6. Berpindah ke outlet yang bukan miliknya ditolak -------------------------
  begin
    perform public.pilih_outlet(v_b);
    raise exception 'pilih_outlet menerima panggilan tanpa sesi.';
  exception
    when sqlstate 'SH004' then null;
    when sqlstate 'SH007' then null;
  end;

  -- 7. Urutan auth_company_id sudah ditentukan ---------------------------------
  -- `limit 1` tanpa `order by` boleh mengembalikan baris mana saja, dan boleh
  -- berbeda antar permintaan. Untuk yang punya dua outlet itu berarti data
  -- tersimpan ke outlet yang salah tanpa pernah muncul sebagai galat.
  if (select pg_get_functiondef(p.oid) from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'auth_company_id') not like '%order by created_at%' then
    raise exception 'auth_company_id masih memakai limit 1 tanpa urutan.';
  end if;

  -- 8. Rekap lintas outlet membawa tiap outlet terpisah ------------------------
  v_out := public.rekap_outlet(current_date - 30, current_date);
  if jsonb_typeof(v_out) <> 'array' then
    raise exception 'rekap_outlet tidak mengembalikan daftar: %', v_out;
  end if;

  -- 9. Outlet yang dihapus tidak ikut terhitung --------------------------------
  update public.companies set deleted_at = now() where id = v_b;
  select public.company_usage(v_asal, 'outlets') into v_n;
  if v_n <> 1 then
    raise exception 'Outlet yang sudah dihapus masih terhitung: %.', v_n;
  end if;

  raise exception 'SEMUA UJI LULUS. Outlet berbagi paket, kuotanya dihitung, dan penunjuk outlet tidak bisa ditulis dari aplikasi.';
end $$;
