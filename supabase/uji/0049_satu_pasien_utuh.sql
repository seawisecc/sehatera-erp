-- ============================================================
-- Uji 0049: SATU PASIEN UTUH, pendaftaran sampai selesai
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Berkas ini lahir dari kesalahan yang lolos dari SEMUA uji lain: obat tidak
-- muncul di kasir karena `tagihan_kunjungan()` menyaring status resep yang
-- sudah usang. Tiap migrasinya punya ujinya sendiri dan semuanya lulus; yang
-- tidak ada adalah satu uji yang menjalankan SATU KUNJUNGAN melintasi modul.
--
-- Jadi ini bukan uji migrasi 0049 saja. Ini uji ALURNYA, dan tiap perubahan
-- yang menyentuh kunjungan harus lulus di sini sebelum dianggap selesai.

do $$
declare
  v_co    uuid;
  v_unit  uuid;
  v_prod  uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_resep uuid;
  v_trx   uuid;
  v_stat  text;
  v_tag   jsonb;
  v_items jsonb;
  v_total numeric;
  v_tunai numeric;
  v_n     integer;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_unit from public.clinic_units where company_id = v_co and aktif limit 1;
  select id into v_prod from public.products
   where company_id = v_co and coalesce(stok_total, 0) > 5 limit 1;
  if v_prod is null then raise exception 'Tidak ada obat berstok untuk diuji.'; end if;

  -- ================================================================
  -- A. PENDAFTARAN
  -- ================================================================
  insert into public.patients (company_id, nama, jenis_kelamin, penjamin)
  values (v_co, 'UJI ALUR UTUH', 'L', 'umum') returning id into v_pas;

  v_vis := (public.daftar_kunjungan(v_pas, 'Batuk tiga hari', 'umum', v_unit,
                                    'dokter.uji@contoh.id', v_co) ->> 'id')::uuid;

  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'terdaftar' then raise exception 'Sesudah daftar seharusnya terdaftar, dapat %.', v_stat; end if;

  -- Muncul di papan ruang tunggu.
  if not exists (select 1 from public.visits where id = v_vis and status in ('terdaftar','obat')) then
    raise exception 'Kunjungan baru tidak masuk kelompok yang dipajang di papan.';
  end if;

  -- ================================================================
  -- B. DIPANGGIL, LALU TIBA
  -- ================================================================
  perform public.panggil_antrean(v_vis);
  select jumlah_panggil into v_n from public.visits where id = v_vis;
  if v_n <> 1 then raise exception 'Panggilan tidak tercatat.'; end if;

  -- Dipanggil TIDAK mengubah keadaan: pasiennya belum tentu datang.
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'terdaftar' then raise exception 'Memanggil mengubah keadaan jadi %.', v_stat; end if;

  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'diperiksa' then raise exception 'Tiba tidak memindahkan ke diperiksa.'; end if;

  -- ================================================================
  -- C. DOKTER: diagnosis, tindakan, resep
  -- ================================================================
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J20.9', 'Bronkitis akut', 'primer');

  perform public.simpan_biaya_kunjungan(v_vis, jsonb_build_array(
    jsonb_build_object('jenis','tindakan','nama','UJI Nebulisasi','jumlah',1,'harga',60000)));

  insert into public.prescriptions (company_id, visit_id, status, dokter_email)
  values (v_co, v_vis, 'draf', 'dokter.uji@contoh.id') returning id into v_resep;
  insert into public.prescription_items (company_id, prescription_id, product_id, nama_obat, jumlah, satuan)
  values (v_co, v_resep, v_prod, 'UJI Obat', 3, 'tablet');

  -- Resep difinalkan -> kunjungan pindah ke `obat` SENDIRI.
  update public.prescriptions set status = 'final', difinalkan_pada = now() where id = v_resep;
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'obat' then
    raise exception 'Resep difinalkan tapi kunjungan masih %, seharusnya obat.', v_stat;
  end if;

  -- ================================================================
  -- D. FARMASI menyiapkan
  -- ================================================================
  update public.prescriptions set status = 'disiapkan', disiapkan_pada = now() where id = v_resep;

  -- INI YANG DULU GAGAL: obatnya harus tetap terbawa ke kasir.
  v_tag := public.tagihan_kunjungan(v_vis);
  if jsonb_array_length(v_tag -> 'obat') = 0 then
    raise exception 'Obat hilang dari tagihan saat resepnya sedang disiapkan. Ini bug yang membuat pasien membayar kurang.';
  end if;
  if jsonb_array_length(v_tag -> 'biaya') = 0 then
    raise exception 'Tindakan hilang dari tagihan.';
  end if;

  update public.prescriptions set status = 'siap', siap_pada = now() where id = v_resep;
  v_tag := public.tagihan_kunjungan(v_vis);
  if jsonb_array_length(v_tag -> 'obat') = 0 then
    raise exception 'Obat hilang dari tagihan saat resepnya SIAP.';
  end if;

  -- ================================================================
  -- E. KASIR membayar
  -- ================================================================
  -- Lewat `apply_transaction` sungguhan, bukan insert langsung ke
  -- `transactions`. Sampai migrasi 0052 fungsi itu tidak bisa dipanggil dari
  -- sini sama sekali (gerbangnya membaca JWT), jadi satu-satunya langkah yang
  -- menyentuh UANG dan STOK adalah satu-satunya yang uji ini lompati. Persis
  -- jenis lubang yang membuat bug obat-hilang-di-kasir bertahan.
  --
  -- Keranjangnya dibangun dari `tagihan_kunjungan()`, seperti yang dilakukan
  -- layar Kasir, bukan diketik ulang di sini. Kalau diketik ulang, uji ini
  -- akan tetap lulus pada hari tagihannya berhenti membawa obat.
  v_tag := public.tagihan_kunjungan(v_vis);

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', null, 'is_jasa', true,
           'nama_obat', c ->> 'nama',
           'harga_jual', (c ->> 'harga')::numeric,
           'jumlah', (c ->> 'jumlah')::numeric::integer)), '[]'::jsonb)
    into v_items
    from jsonb_array_elements(coalesce(v_tag -> 'biaya', '[]'::jsonb)) c;

  select v_items || coalesce(jsonb_agg(jsonb_build_object(
           'product_id', (o ->> 'product_id')::uuid,
           'nama_obat', o ->> 'nama_obat',
           'harga_jual', (o ->> 'harga_jual')::numeric,
           'jumlah', (o ->> 'jumlah')::numeric::integer)), '[]'::jsonb)
    into v_items
    from jsonb_array_elements(coalesce(v_tag -> 'obat', '[]'::jsonb)) o
   where (o ->> 'product_id') is not null
     and (o ->> 'jumlah')::numeric > 0;

  if jsonb_array_length(v_items) < 2 then
    raise exception 'Tagihan kasir cuma berisi % baris. Tarif atau obatnya tidak sampai ke kasir.',
      jsonb_array_length(v_items);
  end if;

  select coalesce(sum((x ->> 'harga_jual')::numeric * (x ->> 'jumlah')::numeric), 0)
    into v_total from jsonb_array_elements(v_items) x;

  -- Pasien BPJS: kasir menekan Proses dengan bayar NOL dan seluruhnya
  -- ditagihkan. Yang menutup transaksi tetap kasir.
  v_trx := (public.apply_transaction(
    v_items, 0, 'Tunai', jsonb_build_object('visit_id', v_vis), v_co, 'bpjs', null, v_total
  ) ->> 'id')::uuid;

  select diterima_tunai into v_tunai from public.transactions where id = v_trx;
  if v_tunai <> 0 then
    raise exception 'Laci tercatat menerima % padahal seluruhnya ditagihkan ke BPJS.', v_tunai;
  end if;

  perform public.tandai_kunjungan_dibayar(v_vis, v_trx);
  perform public.tandai_resep_dibayar(v_resep, v_trx);

  -- Kunjungan yang PUNYA resep belum boleh selesai: obatnya belum diserahkan.
  select status into v_stat from public.visits where id = v_vis;
  if v_stat = 'selesai' then
    raise exception 'Kunjungan ditutup saat dibayar padahal obatnya belum diserahkan.';
  end if;

  -- ================================================================
  -- F. FARMASI menyerahkan -> SELESAI sendiri
  -- ================================================================
  perform public.serahkan_resep(v_resep);
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'selesai' then
    raise exception 'Obat diserahkan tapi kunjungan masih %, seharusnya selesai.', v_stat;
  end if;

  -- Hilang dari papan ruang tunggu.
  if exists (select 1 from public.visits where id = v_vis and status in ('terdaftar','obat')) then
    raise exception 'Kunjungan selesai masih dipajang di papan.';
  end if;

  -- ================================================================
  -- G. JALUR KEDUA: tanpa resep, kasir yang menutup
  -- ================================================================
  insert into public.patients (company_id, nama, jenis_kelamin, penjamin)
  values (v_co, 'UJI ALUR TANPA OBAT', 'P', 'bpjs') returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Kontrol', 'bpjs', v_unit, null, v_co) ->> 'id')::uuid;

  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'I10', 'Hipertensi esensial', 'primer');

  -- Tagihan NOL, khas kapitasi BPJS. Tetap harus bisa ditutup.
  insert into public.transactions (company_id, visit_id, total, bayar)
  values (v_co, v_vis, 0, 0) returning id into v_trx;
  perform public.tandai_kunjungan_dibayar(v_vis, v_trx);

  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'selesai' then
    raise exception 'Kunjungan tanpa resep tidak tertutup oleh kasir, masih %. Kunjungan kapitasi bertagihan nol akan menggantung selamanya.', v_stat;
  end if;

  -- ================================================================
  -- H. Keadaan `resep` benar-benar tidak ada lagi
  -- ================================================================
  begin
    update public.visits set status = 'resep' where id = v_vis;
    raise exception 'Keadaan `resep` masih diterima tabel visits.';
  exception when check_violation then null;
  end;

  select count(*) into v_n from public.visits where status = 'resep';
  if v_n > 0 then
    raise exception 'Masih ada % kunjungan berstatus resep yang belum dipindahkan.', v_n;
  end if;

  raise exception 'SEMUA UJI LULUS. Satu pasien berjalan utuh dari pendaftaran sampai selesai, dua jalurnya.';
end $$;
