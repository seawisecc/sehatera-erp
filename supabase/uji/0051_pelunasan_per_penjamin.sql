-- ============================================================
-- Uji migrasi 0051: pelunasan per penjamin
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_as   uuid;
  v_prod uuid;
  v_trx  jsonb;
  v_row  record;
  v_lap  jsonb;
  v_n    integer;
  v_pas  uuid;
  v_k1   uuid;
  v_k2   uuid;
  v_k3   uuid;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_prod from public.products
   where company_id = v_co and coalesce(stok_total,0) > 10 limit 1;
  if v_prod is null then raise exception 'Tidak ada obat berstok untuk diuji.'; end if;
  insert into public.insurers (company_id, nama) values (v_co, 'UJI Prudential') returning id into v_as;

  -- Klinik contoh berjalan dalam mode farmasi `instalasi`, jadi penjualan
  -- tanpa `visit_id` ditolak trigger sejak migrasi 0021. Itu bukan penghalang
  -- uji ini melainkan bagian dari yang diuji: tiap penjualan di sini terikat
  -- ke satu kunjungan sungguhan. Satu pasien tidak boleh punya dua kunjungan
  -- terbuka di hari yang sama (`uq_visits_terbuka`), jadi pasiennya tiga.
  insert into public.patients (company_id, nama) values (v_co, 'UJI Penjamin Satu')
    returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa')
    returning id into v_k1;
  insert into public.patients (company_id, nama) values (v_co, 'UJI Penjamin Dua')
    returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa')
    returning id into v_k2;
  insert into public.patients (company_id, nama) values (v_co, 'UJI Penjamin Tiga')
    returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa')
    returning id into v_k3;

  -- 1. Transaksi lama tidak boleh punya lubang -----------------------------
  select count(*) into v_n from public.transactions
   where diterima_tunai is null or penjamin is null;
  if v_n > 0 then
    raise exception '% transaksi lama tidak terisi pelunasannya. Laporan akan bolong di masa lalu.', v_n;
  end if;

  -- 2. Umum: seluruhnya tunai ---------------------------------------------
  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 10000, 'jumlah', 1)),
    10000, 'Tunai', jsonb_build_object('visit_id', v_k1), v_co, 'umum', null, 0);
  select * into v_row from public.transactions where id = (v_trx ->> 'id')::uuid;
  if v_row.diterima_tunai <> 10000 or v_row.ditagihkan_penjamin <> 0 then
    raise exception 'Umum: tunai % ditagihkan %, seharusnya 10000 dan 0.',
      v_row.diterima_tunai, v_row.ditagihkan_penjamin;
  end if;

  -- 3. Umum TIDAK boleh menagihkan ke penjamin ----------------------------
  begin
    perform public.apply_transaction(
      jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 10000, 'jumlah', 1)),
      0, 'Tunai', '{}'::jsonb, v_co, 'umum', null, 10000);
    raise exception 'Pasien umum bisa menagihkan ke penjamin.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. BPJS penuh: laci TIDAK bertambah ------------------------------------
  -- Ini inti migrasi ini. Kalau yang ditagihkan ikut terhitung sebagai uang
  -- diterima, laci kasir tidak akan pernah cocok saat tutup buku.
  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 20000, 'jumlah', 1)),
    0, 'Tunai', jsonb_build_object('visit_id', v_k2), v_co, 'bpjs', null, 20000);
  select * into v_row from public.transactions where id = (v_trx ->> 'id')::uuid;
  if v_row.diterima_tunai <> 0 then
    raise exception 'BPJS penuh tapi laci tercatat menerima %. Laci tidak akan cocok saat tutup buku.',
      v_row.diterima_tunai;
  end if;
  if v_row.ditagihkan_penjamin <> 20000 then
    raise exception 'Tagihan ke BPJS tercatat %, seharusnya 20000.', v_row.ditagihkan_penjamin;
  end if;

  -- 5. Asuransi dengan selisih bayar ---------------------------------------
  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 50000, 'jumlah', 1)),
    15000, 'Tunai', jsonb_build_object('visit_id', v_k3), v_co, 'asuransi', v_as, 35000);
  select * into v_row from public.transactions where id = (v_trx ->> 'id')::uuid;
  if v_row.diterima_tunai <> 15000 or v_row.ditagihkan_penjamin <> 35000 then
    raise exception 'Selisih bayar salah: tunai % ditagihkan %.',
      v_row.diterima_tunai, v_row.ditagihkan_penjamin;
  end if;
  if v_row.kembalian <> 0 then
    raise exception 'Kembalian % padahal bayar persis sebesar selisihnya.', v_row.kembalian;
  end if;

  -- 6. Yang ditagihkan tidak boleh melebihi total --------------------------
  begin
    perform public.apply_transaction(
      jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 10000, 'jumlah', 1)),
      0, 'Tunai', '{}'::jsonb, v_co, 'bpjs', null, 99999);
    raise exception 'Tagihan melebihi total diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Bayar kurang dari yang harus ditanggung pasien ----------------------
  begin
    perform public.apply_transaction(
      jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 50000, 'jumlah', 1)),
      1000, 'Tunai', '{}'::jsonb, v_co, 'bpjs', null, 20000);
    raise exception 'Bayar 1000 diterima padahal pasien harus menanggung 30000.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 8. Asuransi faskes lain, dan penerbit tanpa penjamin asuransi ----------
  begin
    perform public.apply_transaction(
      jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 10000, 'jumlah', 1)),
      10000, 'Tunai', '{}'::jsonb, v_co, 'umum', v_as, 0);
    raise exception 'Penerbit asuransi diterima padahal penjaminnya umum.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 9. Dua angkanya SELALU berjumlah total ---------------------------------
  select count(*) into v_n from public.transactions
   where coalesce(diterima_tunai,0) + coalesce(ditagihkan_penjamin,0) <> total;
  if v_n > 0 then
    raise exception '% transaksi yang dua angka pelunasannya tidak berjumlah total.', v_n;
  end if;

  -- 10. Laporan memisahkan keduanya ----------------------------------------
  v_lap := public.laporan_penjamin(current_date, current_date, v_co);
  if jsonb_array_length(v_lap) = 0 then
    raise exception 'Laporan per penjamin kosong padahal ada transaksi hari ini.';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_lap) x where x ->> 'penjamin' = 'bpjs') then
    raise exception 'Laporan tidak memisahkan BPJS.';
  end if;

  raise exception 'SEMUA UJI LULUS. Yang ditagihkan ke penjamin tidak pernah tercatat masuk laci.';
end $$;
