-- ============================================================
-- UJI 0095  Kode produk dan supplier per faskes
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruhnya dibatalkan.
-- Identitas lewat request.jwt.claims, seperti uji 0090.

do $$
declare
  v_a uuid; v_b uuid; v_pemilik text;
  v_k1 text; v_k2 text; v_kb text; v_s1 text; v_sb text;
  v_tgl text[];
begin
  select id, admin_email into v_a, v_pemilik from public.companies where nama = 'Klinik Rexco 88';
  select id into v_b from public.companies where nama = 'Apotek Rexco Renon';
  if v_a is null or v_b is null then raise exception 'Faskes uji tidak ditemukan.'; end if;
  perform set_config('request.jwt.claims', json_build_object('email', lower(v_pemilik), 'role', 'authenticated')::text, true);
  delete from public.outlet_aktif where lower(email) = lower(v_pemilik);
  insert into public.outlet_aktif (email, company_id) values (lower(v_pemilik), v_a);

  -- 1. Tidak ada lagi kode otomatis yang loncat: tiap faskes mulai dari 0001
  if exists (
    select company_id from public.products where kode ~ '^OBT-[0-9]+$'
     group by company_id
    having max(substring(kode from '^OBT-([0-9]+)$')::int) <> count(*)) then
    raise exception 'GAGAL 1: ada faskes yang deret OBT-nya berlubang atau tidak mulai dari 0001.';
  end if;
  if exists (
    select company_id from public.suppliers where kode ~ '^SUP-[0-9]+$'
     group by company_id
    having max(substring(kode from '^SUP-([0-9]+)$')::int) <> count(*)) then
    raise exception 'GAGAL 1b: ada faskes yang deret SUP-nya berlubang atau tidak mulai dari 0001.';
  end if;

  -- 2. Produk baru tanpa kode, dari peramban (company_id diisi trigger) --
  insert into public.products (nama_obat, kategori, satuan) values ('Uji Kode 1', 'bebas', 'Tablet') returning kode into v_k1;
  insert into public.products (nama_obat, kategori, satuan, kode) values ('Uji Kode 2', 'bebas', 'Tablet', '') returning kode into v_k2;
  if v_k1 is null or v_k1 !~ '^OBT-[0-9]{4}$' then raise exception 'GAGAL 2: kode produk A = %', v_k1; end if;
  if substring(v_k2 from 5)::int <> substring(v_k1 from 5)::int + 1 then
    raise exception 'GAGAL 2b: kode kosong tidak diberi nomor berikutnya: % lalu %', v_k1, v_k2;
  end if;

  -- 3. Faskes lain punya deretnya sendiri, dan BOLEH memakai kode yang sama
  insert into public.products (company_id, nama_obat, kategori, satuan) values (v_b, 'Uji Kode B', 'bebas', 'Tablet') returning kode into v_kb;
  if v_kb <> 'OBT-' || lpad(((select count(*) from public.products where company_id = v_b and kode ~ '^OBT-[0-9]+$'))::text, 4, '0') then
    raise exception 'GAGAL 3: kode B % tidak melanjutkan deret B sendiri.', v_kb;
  end if;
  -- Kode yang dipakai A (diketik tangan di Rexco 88) boleh dipakai B juga.
  -- Sebelum 0095 ini ditolak products_kode_key.
  if not exists (select 1 from public.products where company_id = v_a and kode = 'OB-002') then
    raise exception 'Uji butuh produk OB-002 di Rexco 88.';
  end if;
  insert into public.products (company_id, nama_obat, kategori, satuan, kode) values (v_b, 'Uji OB-002', 'bebas', 'Tablet', 'OB-002');

  -- 4. Di DALAM satu faskes, kode tetap unik ----------------------------
  begin
    insert into public.products (nama_obat, kategori, satuan, kode) values ('Uji Kembar A', 'bebas', 'Tablet', v_k1);
    raise exception 'GAGAL 4: kode kembar di faskes yang sama diterima.';
  exception when unique_violation then null;
  end;

  -- 5. Supplier: sama -------------------------------------------------
  insert into public.suppliers (nama_supplier) values ('Uji Supplier A') returning kode into v_s1;
  insert into public.suppliers (company_id, nama_supplier) values (v_b, 'Uji Supplier B') returning kode into v_sb;
  if v_s1 !~ '^SUP-[0-9]{4}$' or v_sb !~ '^SUP-[0-9]{4}$' then raise exception 'GAGAL 5: % / %', v_s1, v_sb; end if;
  insert into public.suppliers (company_id, nama_supplier, kode) values (v_b, 'Uji Supplier Kembar', 'PBF-01');
  begin
    insert into public.suppliers (nama_supplier, kode) values ('Uji Supplier Kembar A', v_s1);
    raise exception 'GAGAL 5b: kode supplier kembar di faskes yang sama diterima.';
  exception when unique_violation then null;
  end;

  -- 6. Tanpa faskes: ditolak, bukan diberi nomor dari faskes siapa pun ---
  perform set_config('request.jwt.claims', '{}', true);
  begin
    insert into public.products (nama_obat, kategori, satuan) values ('Uji Tanpa Faskes', 'bebas', 'Tablet');
    raise exception 'GAGAL 6: produk tanpa faskes diberi kode.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Urutan trigger: kode SESUDAH company_id -------------------------
  select array_agg(tgname order by tgname) into v_tgl from pg_trigger
   where tgrelid = 'public.products'::regclass and not tgisinternal;
  if array_position(v_tgl, 'trg_z_kode_produk') < array_position(v_tgl, 'trg_set_company_id') then
    raise exception 'GAGAL 7: kode produk dibuat sebelum faskesnya terisi: %', v_tgl;
  end if;
  if exists (select 1 from pg_trigger where tgname in ('set_kode_produk', 'set_kode_supplier')) then
    raise exception 'GAGAL 7b: trigger lama masih terpasang.';
  end if;

  -- 8. Hak panggil -------------------------------------------------------
  if has_function_privilege('authenticated', 'public.kode_berikut(uuid, text, text)', 'execute')
     or has_function_privilege('anon', 'public.kode_berikut(uuid, text, text)', 'execute') then
    raise exception 'GAGAL 8: kode_berikut bisa dipakai mengintip jumlah produk faskes lain.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
