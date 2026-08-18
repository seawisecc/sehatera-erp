-- ============================================================
-- Uji migrasi 0038: permintaan terbuka
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co    uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_resep uuid;
  v_prod  uuid;
  v_item  record;
  v_baris record;
  v_n     integer;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_prod from public.products where company_id = v_co limit 1;
  if v_prod is null then raise exception 'Klinik ini tidak punya produk untuk diuji.'; end if;

  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'UJI PERMINTAAN', 'P') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status, dokter_email)
  values (v_co, v_pas, 'diperiksa', 'dokter.uji@contoh.id') returning id into v_vis;

  -- 1. Yang hampir saya jatuhkan saat menulis ulang simpan_resep -------
  perform public.simpan_resep(v_vis, jsonb_build_array(
    jsonb_build_object('nama_obat', 'antihistamin oral', 'jumlah', 10,
                       'satuan', 'tablet', 'permintaan_terbuka', true)),
    'Pasien alergi debu, tolong pilihkan yang tidak bikin ngantuk', false);

  select * into v_baris from public.prescriptions where visit_id = v_vis;
  v_resep := v_baris.id;
  if coalesce(v_baris.nomor, '') = '' then
    raise exception 'Resep tidak dapat nomor. next_doc_number hilang dari simpan_resep.';
  end if;
  if v_baris.catatan is null then
    raise exception 'Catatan untuk farmasi tidak tersimpan.';
  end if;

  -- Jumlah nol harus DITOLAK, bukan diam-diam dijadikan 0.01.
  begin
    perform public.simpan_resep(v_vis, jsonb_build_array(
      jsonb_build_object('nama_obat', 'apa saja', 'jumlah', 0)), null, false);
    raise exception 'Jumlah nol diterima, padahal seharusnya ditolak.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 2. Penanda terbuka diabaikan kalau dokter sudah memilih produk -----
  perform public.simpan_resep(v_vis, jsonb_build_array(
    jsonb_build_object('nama_obat', 'antihistamin oral', 'jumlah', 10,
                       'satuan', 'tablet', 'permintaan_terbuka', true),
    jsonb_build_object('nama_obat', 'Obat pilihan dokter', 'jumlah', 5,
                       'product_id', v_prod, 'permintaan_terbuka', true)),
    'Tolong pilihkan', true);

  select * into v_item from public.prescription_items
   where prescription_id = v_resep and product_id = v_prod;
  if v_item.permintaan_terbuka then
    raise exception 'Baris yang produknya sudah dipilih dokter ikut jadi permintaan terbuka. Farmasi jadi bisa menggantinya.';
  end if;

  -- 3. Antrean farmasi menghitung yang belum diisi ---------------------
  select jumlah_belum_diisi into v_n from public.v_resep_menunggu where id = v_resep;
  if v_n <> 1 then raise exception 'jumlah_belum_diisi = %, seharusnya 1.', v_n; end if;

  -- 4. Farmasi mengisi permintaan terbuka ------------------------------
  select * into v_item from public.prescription_items
   where prescription_id = v_resep and permintaan_terbuka;

  perform public.isi_permintaan_farmasi(v_item.id, v_prod, 'Cetirizine 10 mg', 10, 'tablet');

  select * into v_item from public.prescription_items where id = v_item.id;
  if v_item.nama_obat <> 'Cetirizine 10 mg' then
    raise exception 'Isian farmasi tidak tersimpan.';
  end if;
  if v_item.permintaan_asli <> 'antihistamin oral' then
    raise exception 'Permintaan asli dokter hilang, dapat %. Justru itu yang harus tetap terbaca.',
      coalesce(v_item.permintaan_asli, '(kosong)');
  end if;
  if v_item.diisi_oleh is null or v_item.diisi_pada is null then
    raise exception 'Tidak tercatat siapa yang mengisi dan kapan.';
  end if;

  -- Sesudah diisi, tidak lagi terhitung menunggu.
  select jumlah_belum_diisi into v_n from public.v_resep_menunggu where id = v_resep;
  if v_n <> 0 then raise exception 'Masih terhitung belum diisi sesudah diisi.'; end if;

  -- Diisi ulang tidak menimpa permintaan aslinya.
  perform public.isi_permintaan_farmasi(v_item.id, v_prod, 'Loratadine 10 mg', 10, 'tablet');
  select * into v_item from public.prescription_items where id = v_item.id;
  if v_item.permintaan_asli <> 'antihistamin oral' then
    raise exception 'Permintaan asli tertimpa saat diisi ulang.';
  end if;

  -- 5. Baris pilihan dokter TIDAK bisa disentuh farmasi ----------------
  -- Ini garis yang memisahkan menyerahkan obat dari meresepkan.
  select * into v_item from public.prescription_items
   where prescription_id = v_resep and product_id = v_prod and not permintaan_terbuka;
  begin
    perform public.isi_permintaan_farmasi(v_item.id, v_prod, 'Obat lain maunya farmasi', 5, 'tablet');
    raise exception 'Farmasi bisa mengganti obat yang sudah ditentukan dokter.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 6. Sesudah diserahkan, isinya terkunci -----------------------------
  update public.prescriptions set status = 'dilayani', dilayani_pada = now() where id = v_resep;
  select * into v_item from public.prescription_items
   where prescription_id = v_resep and permintaan_terbuka;
  begin
    perform public.isi_permintaan_farmasi(v_item.id, v_prod, 'Diubah sesudah diminum', 10, 'tablet');
    raise exception 'Isi resep bisa diubah sesudah obatnya diserahkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Tidak melahirkan resep kedua ------------------------------------
  -- Sebelum 0038, simpan_resep cuma melihat status ('draf','final'), jadi
  -- resep yang sedang disiapkan farmasi tidak terlihat dan dokter yang
  -- menekan simpan mendapat resep KEDUA diam-diam.
  update public.prescriptions set status = 'siap' where id = v_resep;
  begin
    perform public.simpan_resep(v_vis, jsonb_build_array(
      jsonb_build_object('nama_obat', 'Obat baru', 'jumlah', 1)), null, false);
    raise exception 'Resep kedua lahir padahal yang pertama sedang disiapkan farmasi.';
  exception when sqlstate 'SH004' then null;
  end;
  select count(*) into v_n from public.prescriptions where visit_id = v_vis;
  if v_n <> 1 then raise exception 'Ada % resep di kunjungan ini, seharusnya 1.', v_n; end if;

  raise exception 'SEMUA UJI LULUS. Dokter meminta, farmasi mengisi, dan permintaan aslinya tetap terbaca.';
end $$;
