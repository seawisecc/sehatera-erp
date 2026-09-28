-- ============================================================
-- UJI 0092  Transfer stok antar outlet
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak ada stok yang
-- benar-benar berpindah. Memakai kelompok Rexco (Klinik Rexco 88 dan
-- Apotek Rexco Renon), tidak menyentuh faskes lain.

do $$
declare
  v_a     uuid;
  v_b     uuid;
  v_luar  uuid;
  v_bt    record;
  v_hasil jsonb;
  v_trf   uuid;
  v_trf2  uuid;
  v_it    record;
  v_stok_b_sblm integer;
  v_n     integer;
begin
  select id into v_a from public.companies where nama = 'Klinik Rexco 88' limit 1;
  select id into v_b from public.companies where nama = 'Apotek Rexco Renon' limit 1;
  select id into v_luar from public.companies
   where group_id is distinct from (select group_id from public.companies where id = v_a)
     and deleted_at is null limit 1;

  select b.*, p.nama_obat, p.stok_total as prod_stok into v_bt
    from public.product_batches b join public.products p on p.id = b.product_id
   where b.company_id = v_a and b.stok_batch >= 5 order by b.stok_batch desc limit 1;

  -- 1. Kirim 3 dari A ke B: stok A turun saat itu juga -----------------------
  v_hasil := public.kirim_transfer(v_b, jsonb_build_array(jsonb_build_object('batch_id', v_bt.id, 'qty', 3)), 'Uji 0092', v_a);
  v_trf := (v_hasil ->> 'id')::uuid;
  if (v_hasil ->> 'nomor') not like 'TRF/%' then raise exception 'GAGAL 1: nomor %.', v_hasil ->> 'nomor'; end if;
  if (select stok_batch from public.product_batches where id = v_bt.id) <> v_bt.stok_batch - 3 then
    raise exception 'GAGAL 1b: batch pengirim tidak turun 3.';
  end if;
  if (select stok_total from public.products where id = v_bt.product_id) <> v_bt.prod_stok - 3 then
    raise exception 'GAGAL 1c: produk pengirim tidak turun 3.';
  end if;

  -- 2. Lebih dari isi batch ditolak ----------------------------------------
  begin
    perform public.kirim_transfer(v_b, jsonb_build_array(jsonb_build_object('batch_id', v_bt.id, 'qty', 999999)), null, v_a);
    raise exception 'GAGAL 2: kiriman melebihi isi batch diterima.';
  exception when sqlstate 'SH005' then null;
  end;

  -- 3. Tujuan di luar kelompok ditolak -------------------------------------
  begin
    perform public.kirim_transfer(v_luar, jsonb_build_array(jsonb_build_object('batch_id', v_bt.id, 'qty', 1)), null, v_a);
    raise exception 'GAGAL 3: transfer ke faskes di luar kelompok diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. Diterima B: produk dicocokkan atau dibuat, batch dan stok naik 3 ------
  v_hasil := public.terima_transfer(v_trf);
  select * into v_it from public.stock_transfer_items where transfer_id = v_trf;
  if v_it.ke_product_id is null or v_it.ke_batch_id is null then
    raise exception 'GAGAL 4: baris transfer tidak tertaut ke produk dan batch penerima.';
  end if;
  if (select company_id from public.products where id = v_it.ke_product_id) <> v_b then
    raise exception 'GAGAL 4b: produk penerima bukan milik outlet B.';
  end if;
  if (select stok_batch from public.product_batches where id = v_it.ke_batch_id) < 3 then
    raise exception 'GAGAL 4c: batch penerima tidak bertambah.';
  end if;
  if (select batch_number from public.product_batches where id = v_it.ke_batch_id) is distinct from v_bt.batch_number then
    raise exception 'GAGAL 4d: nomor batch tidak ikut pindah.';
  end if;
  if (select status from public.stock_transfers where id = v_trf) <> 'diterima' then
    raise exception 'GAGAL 4e: status tidak diterima.';
  end if;

  -- 5. Kiriman kedua dari batch yang sama digabung ke batch yang sama di B --
  v_stok_b_sblm := (select stok_batch from public.product_batches where id = v_it.ke_batch_id);
  v_trf2 := (public.kirim_transfer(v_b, jsonb_build_array(jsonb_build_object('batch_id', v_bt.id, 'qty', 1)), null, v_a) ->> 'id')::uuid;
  perform public.terima_transfer(v_trf2);
  if (select ke_batch_id from public.stock_transfer_items where transfer_id = v_trf2) <> v_it.ke_batch_id then
    raise exception 'GAGAL 5: batch yang sama di B dipecah jadi dua baris.';
  end if;
  if (select stok_batch from public.product_batches where id = v_it.ke_batch_id) <> v_stok_b_sblm + 1 then
    raise exception 'GAGAL 5b: batch B tidak bertambah satu.';
  end if;

  -- 6. Tidak bisa diterima dua kali ----------------------------------------
  begin
    perform public.terima_transfer(v_trf);
    raise exception 'GAGAL 6: transfer yang sama diterima dua kali.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Batal mengembalikan stok ke batch ASALNYA, persis --------------------
  v_trf2 := (public.kirim_transfer(v_b, jsonb_build_array(jsonb_build_object('batch_id', v_bt.id, 'qty', 1)), null, v_a) ->> 'id')::uuid;
  perform public.batal_transfer(v_trf2, 'uji');
  if (select stok_batch from public.product_batches where id = v_bt.id) <> v_bt.stok_batch - 4 then
    raise exception 'GAGAL 7: batal tidak mengembalikan stok batch asal (seharusnya %).', v_bt.stok_batch - 4;
  end if;

  -- 8. Yang sudah diterima tidak bisa dibatalkan ---------------------------
  begin
    perform public.batal_transfer(v_trf, 'coba');
    raise exception 'GAGAL 8: transfer yang sudah diterima bisa dibatalkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 9. Hak dan policy ----------------------------------------------------
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('kirim_transfer', 'terima_transfer', 'batal_transfer')
     and has_function_privilege('anon', p.oid, 'execute');
  if v_n > 0 then raise exception 'GAGAL 9: fungsi transfer terbuka untuk anon.'; end if;
  if exists (select 1 from pg_policy
              where polrelid in ('public.stock_transfers'::regclass, 'public.stock_transfer_items'::regclass)
                and polcmd <> 'r') then
    raise exception 'GAGAL 9b: ada policy tulis pada tabel transfer.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
