-- ============================================================
-- Uji migrasi 0035: jabat tangan farmasi dan kasir
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
-- Benar kalau galat terakhirnya berbunyi "SEMUA UJI LULUS".

do $$
declare
  v_co     uuid;
  v_pas    uuid;
  v_vis    uuid;
  v_resep  uuid;
  v_trx    uuid;
  v_row    record;
  v_n      bigint;
begin
  select id into v_co from public.companies where sektor in ('klinik', 'rumah_sakit') limit 1;
  if v_co is null then
    raise exception 'Tidak ada faskes klinik untuk diuji.';
  end if;

  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'UJI FARMASI', 'L') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status)
  values (v_co, v_pas, 'resep') returning id into v_vis;
  insert into public.prescriptions (company_id, visit_id, status, dokter_email)
  values (v_co, v_vis, 'draf', 'dokter.uji@contoh.id') returning id into v_resep;

  -- 1. Draf tidak boleh masuk antrean penyiapan ------------------------
  begin
    perform public.ubah_status_resep(v_resep, 'disiapkan');
    raise exception 'Resep DRAF bisa disiapkan, padahal dokter belum selesai.';
  exception when sqlstate 'SH004' then null;
  end;

  update public.prescriptions set status = 'final', difinalkan_pada = now() where id = v_resep;

  -- 2. Antrean farmasi memunculkannya, dan menandainya belum bayar -----
  select count(*) into v_n from public.v_resep_menunggu where id = v_resep;
  if v_n <> 1 then raise exception 'Resep final tidak muncul di antrean farmasi.'; end if;
  if (select sudah_bayar from public.v_resep_menunggu where id = v_resep) then
    raise exception 'Resep yang belum dibayar ditandai sudah bayar.';
  end if;

  -- 3. Penyerahan DITOLAK selama pembayaran belum tercatat -------------
  -- Ini inti seluruh migrasi ini.
  begin
    perform public.serahkan_resep(v_resep);
    raise exception 'Obat bisa diserahkan padahal pembayaran belum tercatat.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. Farmasi memindahkan keadaan penyiapan ---------------------------
  perform public.ubah_status_resep(v_resep, 'disiapkan');
  select * into v_row from public.prescriptions where id = v_resep;
  if v_row.status <> 'disiapkan' then raise exception 'Gagal pindah ke disiapkan.'; end if;
  if v_row.disiapkan_pada is null or v_row.disiapkan_oleh is null then
    raise exception 'Pindah ke disiapkan tidak mencatat kapan dan siapa.';
  end if;

  perform public.ubah_status_resep(v_resep, 'siap');
  select * into v_row from public.prescriptions where id = v_resep;
  if v_row.status <> 'siap' or v_row.siap_pada is null then
    raise exception 'Gagal pindah ke siap.';
  end if;

  -- Masih di antrean farmasi selama belum diserahkan.
  select count(*) into v_n from public.v_resep_menunggu where id = v_resep;
  if v_n <> 1 then raise exception 'Resep siap hilang dari antrean farmasi.'; end if;

  -- 5. Kasir mencatat bayar, dan itu TIDAK menyatakan penyerahan -------
  -- visit_id WAJIB ikut. Klinik Rexco 88 mode farmasinya `instalasi`, dan
  -- migrasi 0021 menolak penjualan yang tidak terikat kunjungan lewat trigger.
  -- Percobaan pertama uji ini lupa itu dan ditolak database, yang justru
  -- membuktikan batas instalasi farmasi masih berdiri.
  insert into public.transactions (company_id, visit_id, total, bayar)
  values (v_co, v_vis, 50000, 50000) returning id into v_trx;

  perform public.tandai_resep_dibayar(v_resep, v_trx);
  select * into v_row from public.prescriptions where id = v_resep;
  if v_row.status = 'dilayani' then
    raise exception 'Membayar langsung menandai obat sudah diserahkan. Justru itu yang diperbaiki migrasi ini.';
  end if;
  if v_row.status <> 'siap' then
    raise exception 'Pembayaran mengubah keadaan penyiapan jadi %.', v_row.status;
  end if;

  -- Nama lama juga tidak boleh menyatakan penyerahan.
  perform public.tandai_resep_dilayani(v_resep, v_trx);
  if (select status from public.prescriptions where id = v_resep) = 'dilayani' then
    raise exception 'tandai_resep_dilayani versi lama masih menyatakan penyerahan.';
  end if;

  -- Antrean farmasi sekarang menyala sudah bayar.
  if not (select sudah_bayar from public.v_resep_menunggu where id = v_resep) then
    raise exception 'Sudah dibayar tapi antrean farmasi masih menandai belum.';
  end if;

  -- 6. Barulah farmasi menyerahkan -------------------------------------
  perform public.serahkan_resep(v_resep);
  select * into v_row from public.prescriptions where id = v_resep;
  if v_row.status <> 'dilayani' then raise exception 'Penyerahan gagal.'; end if;
  if v_row.diserahkan_oleh is null then
    raise exception 'Penyerahan tidak mencatat siapa yang menyerahkan.';
  end if;
  if v_row.serah_tanpa_bayar then
    raise exception 'Penyerahan yang sudah dibayar ditandai tanpa bayar.';
  end if;

  -- Hilang dari antrean sesudah diserahkan, bukan sesudah dibayar.
  select count(*) into v_n from public.v_resep_menunggu where id = v_resep;
  if v_n <> 0 then raise exception 'Resep yang sudah diserahkan masih di antrean farmasi.'; end if;

  -- 7. Yang sudah diserahkan tidak bisa dimundurkan --------------------
  begin
    perform public.ubah_status_resep(v_resep, 'disiapkan');
    raise exception 'Resep yang sudah diserahkan masih bisa dimundurkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 8. Jalan keluar tanpa bayar ada, tapi menuntut alasan --------------
  insert into public.prescriptions (company_id, visit_id, status, dokter_email)
  values (v_co, v_vis, 'final', 'dokter.uji@contoh.id') returning id into v_resep;

  begin
    perform public.serahkan_resep(v_resep, true, null);
    raise exception 'Serah tanpa bayar diterima tanpa alasan.';
  exception when sqlstate 'SH004' then null;
  end;

  perform public.serahkan_resep(v_resep, true, 'Obat darurat, ditagihkan menyusul');
  select * into v_row from public.prescriptions where id = v_resep;
  if v_row.status <> 'dilayani' then raise exception 'Serah tanpa bayar dengan alasan tetap ditolak.'; end if;
  if not v_row.serah_tanpa_bayar then
    raise exception 'Serah tanpa bayar tidak ditandai, jadi tidak bisa ditelusuri.';
  end if;
  if coalesce(v_row.alasan_tanpa_bayar, '') = '' then
    raise exception 'Alasannya tidak tersimpan.';
  end if;

  raise exception 'SEMUA UJI LULUS. Uang dan penyerahan sekarang dua kejadian terpisah.';
end $$;
