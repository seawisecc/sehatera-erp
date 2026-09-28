-- ============================================================
-- Uji migrasi 0040: rel kunjungan mengikuti resepnya
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Disegarkan 28 September 2026 ke rel EMPAT keadaan (migrasi 0049):
-- terdaftar -> diperiksa -> obat -> selesai. Keadaan `resep` sudah dibuang,
-- dan resep yang difinalkan kini menggeser kunjungan langsung ke `obat`.

do $$
declare
  v_co    uuid;
  v_pas   uuid;
  v_pas2  uuid;
  v_pas3  uuid;
  v_vis   uuid;
  v_resep uuid;
  v_prod  uuid;
  v_stat  text;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_prod from public.products where company_id = v_co limit 1;

  -- ================================================================
  -- A. Kunjungan TANPA resep boleh melompati resep dan obat
  -- ================================================================
  -- Inilah keluhan pemilik: pasien kontrol yang tidak diberi obat tetap
  -- harus diklik lewat dua tahap kosong.
  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'UJI REL TANPA OBAT', 'L') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status)
  values (v_co, v_pas, 'diperiksa') returning id into v_vis;

  -- Diagnosis wajib ada sebelum kunjungan bisa ditutup (migrasi 0018).
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'I10', 'Hipertensi esensial', 'primer');

  perform public.ubah_status_kunjungan(v_vis, 'selesai');
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'selesai' then
    raise exception 'Kunjungan tanpa resep tidak bisa melompat ke selesai, dapat %.', v_stat;
  end if;

  -- ================================================================
  -- B. Kunjungan DENGAN resep tidak boleh melompat
  -- ================================================================
  -- Pasien BERBEDA tiap skenario. Ada indeks unik `uq_visits_terbuka`: satu
  -- pasien tidak boleh punya dua kunjungan terbuka di hari yang sama, dan
  -- percobaan pertama uji ini melanggarnya. Aturan yang bagus, dan ketahuan
  -- justru karena dilanggar.
  insert into public.patients (company_id, nama, jenis_kelamin)
  values (v_co, 'UJI REL DENGAN OBAT', 'P') returning id into v_pas2;
  insert into public.visits (company_id, patient_id, status)
  values (v_co, v_pas2, 'diperiksa') returning id into v_vis;
  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'I10', 'Hipertensi esensial', 'primer');
  insert into public.prescriptions (company_id, visit_id, status, dokter_email)
  values (v_co, v_vis, 'draf', 'dokter.uji@contoh.id') returning id into v_resep;
  insert into public.prescription_items (company_id, prescription_id, nama_obat, jumlah, product_id)
  values (v_co, v_resep, 'Obat uji', 1, v_prod);

  begin
    perform public.ubah_status_kunjungan(v_vis, 'selesai');
    raise exception 'Kunjungan yang punya resep bisa melompati tahap obat.';
  exception when sqlstate 'SH004' then null;
  end;

  -- Melompati `diperiksa` tetap dilarang, walau tanpa resep. Menutup pasien
  -- yang belum pernah diperiksa bukan jalan pintas.
  declare v_vis2 uuid;
  begin
    insert into public.patients (company_id, nama, jenis_kelamin)
    values (v_co, 'UJI REL LOMPAT PERIKSA', 'L') returning id into v_pas3;
    insert into public.visits (company_id, patient_id, status)
    values (v_co, v_pas3, 'terdaftar') returning id into v_vis2;
    -- Ditolak karena MELOMPAT, bukan karena nama keadaannya tidak dikenal:
    -- versi lama uji ini memakai 'resep', yang sejak 0049 memang tidak ada,
    -- jadi ia lulus karena alasan yang salah.
    begin
      perform public.ubah_status_kunjungan(v_vis2, 'obat');
      raise exception 'Kunjungan bisa melompati tahap diperiksa.';
    exception when sqlstate 'SH004' then
      if sqlerrm not like '%melompat%' then
        raise exception 'Lompatan ditolak dengan alasan yang salah: %', sqlerrm;
      end if;
    end;
  end;

  -- ================================================================
  -- C. Rel bergeser SENDIRI mengikuti resepnya
  -- ================================================================
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'diperiksa' then raise exception 'Awalnya seharusnya diperiksa, dapat %.', v_stat; end if;

  -- Dokter memfinalkan -> kunjungan pindah ke `obat` tanpa ada yang mengklik.
  update public.prescriptions set status = 'final', difinalkan_pada = now() where id = v_resep;
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'obat' then
    raise exception 'Resep difinalkan tapi kunjungan masih %, seharusnya obat.', v_stat;
  end if;

  -- Farmasi mulai menyiapkan -> kunjungan tetap `obat`, tidak bergeser lagi.
  update public.prescriptions set status = 'disiapkan', disiapkan_pada = now() where id = v_resep;
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'obat' then
    raise exception 'Farmasi mulai menyiapkan tapi kunjungan pindah ke %, seharusnya tetap obat.', v_stat;
  end if;

  -- `siap` tidak menyeret lebih jauh: yang menutup kunjungan tetap orang.
  update public.prescriptions set status = 'siap', siap_pada = now() where id = v_resep;
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'obat' then
    raise exception 'Kunjungan terseret ke % oleh keadaan siap.', v_stat;
  end if;

  -- ================================================================
  -- D. Trigger tidak menyeret kunjungan yang sudah di depan
  -- ================================================================
  -- Kalau kunjungan sudah ditutup, resep yang berubah tidak boleh
  -- membangkitkannya kembali.
  update public.visits set status = 'selesai', ditutup_pada = now() where id = v_vis;
  update public.prescriptions set status = 'dilayani', dilayani_pada = now() where id = v_resep;
  select status into v_stat from public.visits where id = v_vis;
  if v_stat <> 'selesai' then
    raise exception 'Kunjungan yang sudah selesai terseret mundur ke %.', v_stat;
  end if;

  raise exception 'SEMUA UJI LULUS. Rel bergeser sendiri kalau ada obatnya, dan bisa dilompati kalau tidak.';
end $$;
