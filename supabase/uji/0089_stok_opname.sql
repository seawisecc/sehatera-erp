-- ============================================================
-- UJI 0089  Stok opname
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi seluruh percobaan ini
-- dibatalkan dan tidak ada stok yang benar-benar berubah. Yang benar cuma
-- satu keluaran: galat terakhir berbunyi "SEMUA UJI LULUS".

do $$
declare
  v_co    uuid;
  v_hasil jsonb;
  v_op    uuid;
  v_op2   uuid;
  v_item  record;
  v_semua jsonb;
  v_batch_sblm integer;
  v_prod_sblm  integer;
  v_n     integer;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then raise exception 'Klinik Rexco 88 tidak ditemukan.'; end if;

  -- 1. Mulai opname seluruh produk -----------------------------------------
  v_hasil := public.buat_opname(null, 'Uji 0089', v_co);
  v_op := (v_hasil ->> 'id')::uuid;
  if (v_hasil ->> 'baris')::integer = 0 then raise exception 'GAGAL 1: opname tanpa baris.'; end if;
  if (v_hasil ->> 'nomor') not like 'OPN/%/%' then
    raise exception 'GAGAL 1b: nomor opname berbentuk %.', v_hasil ->> 'nomor';
  end if;

  -- 2. Satu draf per faskes -------------------------------------------------
  begin
    perform public.buat_opname(null, 'kembar', v_co);
    raise exception 'GAGAL 2: dua opname draf bisa berjalan bersamaan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Belum dihitung semuanya: ditolak ------------------------------------
  begin
    perform public.finalkan_opname(v_op);
    raise exception 'GAGAL 3: opname yang belum dihitung bisa difinalkan.';
  exception when sqlstate 'SH004' then
    if sqlerrm not like '%belum dihitung%' then raise exception 'GAGAL 3: alasan salah: %', sqlerrm; end if;
  end;

  -- Semua baris dihitung SAMA dengan sistem.
  select jsonb_agg(jsonb_build_object('id', id, 'stok_fisik', stok_sistem)) into v_semua
    from public.stock_opname_items where opname_id = v_op;
  perform public.simpan_hitung_opname(v_op, v_semua);

  -- Satu baris ber-batch dikurangi satu, TANPA alasan.
  select i.*, b.stok_batch as batch_kini, p.stok_total as prod_kini into v_item
    from public.stock_opname_items i
    join public.product_batches b on b.id = i.batch_id
    join public.products p on p.id = i.product_id
   where i.opname_id = v_op and i.stok_sistem >= 2
   limit 1;
  v_batch_sblm := v_item.batch_kini;
  v_prod_sblm  := v_item.prod_kini;
  perform public.simpan_hitung_opname(v_op,
    jsonb_build_array(jsonb_build_object('id', v_item.id, 'stok_fisik', v_item.stok_sistem - 1)));

  -- 4. Selisih tanpa alasan: ditolak ---------------------------------------
  begin
    perform public.finalkan_opname(v_op);
    raise exception 'GAGAL 4: selisih tanpa alasan bisa difinalkan.';
  exception when sqlstate 'SH004' then
    if sqlerrm not like '%tanpa alasan%' then raise exception 'GAGAL 4: alasan salah: %', sqlerrm; end if;
  end;

  -- 5. Dengan alasan: stok batch DAN produk turun satu, relatif ------------
  -- Penjualan di tengah opname disimulasikan: batch turun 1 SESUDAH dihitung.
  -- Final yang menimpa angka fisik akan menghapus penjualan itu.
  update public.product_batches set stok_batch = stok_batch - 1 where id = v_item.batch_id;
  update public.products set stok_total = stok_total - 1 where id = v_item.product_id;
  perform public.simpan_hitung_opname(v_op,
    jsonb_build_array(jsonb_build_object('id', v_item.id, 'stok_fisik', v_item.stok_sistem - 1, 'alasan', 'rusak')));
  v_hasil := public.finalkan_opname(v_op);
  if (v_hasil ->> 'baris_berubah')::integer <> 1 or (v_hasil ->> 'berkurang')::integer <> 1 then
    raise exception 'GAGAL 5: ringkasan final %.', v_hasil;
  end if;
  if (select stok_batch from public.product_batches where id = v_item.batch_id) <> v_batch_sblm - 2 then
    raise exception 'GAGAL 5b: stok batch % (seharusnya %: penjualan -1 DAN selisih -1).',
      (select stok_batch from public.product_batches where id = v_item.batch_id), v_batch_sblm - 2;
  end if;
  if (select stok_total from public.products where id = v_item.product_id) <> v_prod_sblm - 2 then
    raise exception 'GAGAL 5c: stok produk tidak ikut turun relatif.';
  end if;
  if (select status from public.stock_opnames where id = v_op) <> 'final' then
    raise exception 'GAGAL 5d: status tidak final.';
  end if;

  -- 6. Yang sudah final terkunci -------------------------------------------
  begin
    perform public.simpan_hitung_opname(v_op, v_semua);
    raise exception 'GAGAL 6: hitungan opname final bisa diubah.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.batal_opname(v_op, 'coba');
    raise exception 'GAGAL 6b: opname final bisa dibatalkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Hasil minus DITOLAK, bukan dibulatkan ke nol diam-diam ---------------
  v_op2 := (public.buat_opname(null, 'Uji minus', v_co) ->> 'id')::uuid;
  select jsonb_agg(jsonb_build_object('id', id, 'stok_fisik', stok_sistem)) into v_semua
    from public.stock_opname_items where opname_id = v_op2;
  perform public.simpan_hitung_opname(v_op2, v_semua);
  select * into v_item from public.stock_opname_items
   where opname_id = v_op2 and batch_id is not null and stok_sistem >= 1 limit 1;
  -- Seluruh batch terjual sesudah dihitung, lalu hitungannya kurang satu.
  update public.product_batches set stok_batch = 0 where id = v_item.batch_id;
  perform public.simpan_hitung_opname(v_op2,
    jsonb_build_array(jsonb_build_object('id', v_item.id, 'stok_fisik', v_item.stok_sistem - 1, 'alasan', 'hilang')));
  begin
    perform public.finalkan_opname(v_op2);
    raise exception 'GAGAL 7: penyesuaian yang membuat stok minus diterima.';
  exception when sqlstate 'SH005' then null;
  end;

  -- 8. Batal butuh alasan, dan melepas kunci satu-draf ---------------------
  begin
    perform public.batal_opname(v_op2, '  ');
    raise exception 'GAGAL 8: batal tanpa alasan diterima.';
  exception when sqlstate 'SH004' then null;
  end;
  perform public.batal_opname(v_op2, 'uji');
  perform public.buat_opname(null, 'sesudah batal', v_co);

  -- 9. Hak: kapabilitas ada di matriks tunggal, fungsi tertutup untuk anon --
  if position('stok.opname.final' in pg_get_functiondef('public.boleh(text)'::regprocedure)) = 0 then
    raise exception 'GAGAL 9: boleh() tidak mengenal stok.opname.final.';
  end if;
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('buat_opname', 'simpan_hitung_opname', 'finalkan_opname', 'batal_opname')
     and has_function_privilege('anon', p.oid, 'execute');
  if v_n > 0 then raise exception 'GAGAL 9b: % fungsi opname bisa dipanggil tanpa login.', v_n; end if;

  -- 10. Tabel hanya bisa dibaca dari peramban -------------------------------
  if exists (select 1 from pg_policy
              where polrelid in ('public.stock_opnames'::regclass, 'public.stock_opname_items'::regclass)
                and polcmd <> 'r') then
    raise exception 'GAGAL 10: ada policy tulis pada tabel opname.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
