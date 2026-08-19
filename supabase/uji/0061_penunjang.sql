-- ============================================================
-- Uji migrasi 0061: pemeriksaan penunjang
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_unit uuid;
  v_svc  uuid;
  v_pas  uuid;
  v_vis  uuid;
  v_ord  uuid;
  v_rad  uuid;
  v_out  jsonb;
  v_row  record;
  v_n    integer;
  v_tot  numeric;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_unit from public.clinic_units where company_id = v_co and aktif limit 1;

  insert into public.services (company_id, nama, harga) values (v_co, 'UJI Darah Lengkap', 85000)
    returning id into v_svc;

  insert into public.patients (company_id, nama) values (v_co, 'UJI PENUNJANG')
    returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Demam lima hari', 'umum', v_unit, null, v_co) ->> 'id')::uuid;
  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');

  -- 1. Meminta pemeriksaan MENAGIH sendiri dari katalog ----------------------
  v_out := public.minta_penunjang(v_vis, 'lab', 'Darah Lengkap', v_svc, 'Curiga DBD', 'cito');
  v_ord := (v_out ->> 'id')::uuid;
  if (v_out ->> 'prioritas') <> 'cito' then
    raise exception 'Prioritas cito tidak tersimpan.';
  end if;

  select count(*), coalesce(sum(harga), 0) into v_n, v_tot from public.visit_charges
   where visit_id = v_vis and jenis = 'penunjang';
  if v_n <> 1 then raise exception 'Permintaan tidak melahirkan biaya.'; end if;
  if v_tot <> 85000 then
    raise exception 'Harganya % bukan harga katalog. Kalau diketik ulang, satu pemeriksaan yang sama tercatat beda harga tiap kali.', v_tot;
  end if;

  -- 2. Jenis asing ditolak ---------------------------------------------------
  begin
    perform public.minta_penunjang(v_vis, 'usg', 'Sesuatu');
    raise exception 'Jenis pemeriksaan asing diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Hasil lab tersimpan BERKOLOM, bukan satu kotak -----------------------
  -- Ini inti migrasi ini: hasil yang ditulis bebas tidak bisa dibandingkan
  -- dengan hasil bulan lalu maupun dikirim ke SatuSehat.
  perform public.isi_hasil_penunjang(v_ord, jsonb_build_array(
    jsonb_build_object('nama', 'Hemoglobin', 'kode_loinc', '718-7', 'nilai', '11.2',
                       'nilai_angka', '11.2', 'satuan', 'g/dL',
                       'rujukan_bawah', '13', 'rujukan_atas', '17', 'penanda', 'rendah'),
    jsonb_build_object('nama', 'Trombosit', 'kode_loinc', '777-3', 'nilai', '84000',
                       'nilai_angka', '84000', 'satuan', '/uL',
                       'rujukan_bawah', '150000', 'rujukan_atas', '450000', 'penanda', 'kritis')));

  select count(*) into v_n from public.lab_results where penunjang_id = v_ord;
  if v_n <> 2 then raise exception 'Hasil lab tersimpan % baris, seharusnya 2.', v_n; end if;

  select * into v_row from public.lab_results where penunjang_id = v_ord and nama = 'Trombosit';
  if v_row.penanda <> 'kritis' or v_row.nilai_angka <> 84000 or v_row.kode_loinc <> '777-3' then
    raise exception 'Baris kritis tidak tersimpan utuh: penanda %, angka %, loinc %.',
      v_row.penanda, v_row.nilai_angka, v_row.kode_loinc;
  end if;

  select * into v_row from public.visit_penunjang where id = v_ord;
  if v_row.status <> 'selesai' or v_row.selesai_pada is null then
    raise exception 'Permintaan tidak ditandai selesai sesudah hasilnya diisi.';
  end if;

  -- 4. Mengisi ULANG menimpa, bukan menumpuk --------------------------------
  -- Kalau menumpuk, koreksi satu parameter meninggalkan dua baris untuk
  -- parameter yang sama dan yang membaca tidak tahu mana yang berlaku.
  perform public.isi_hasil_penunjang(v_ord, jsonb_build_array(
    jsonb_build_object('nama', 'Hemoglobin', 'nilai', '12.0', 'nilai_angka', '12.0')));
  select count(*) into v_n from public.lab_results where penunjang_id = v_ord;
  if v_n <> 1 then
    raise exception 'Mengisi ulang meninggalkan % baris. Dua baris untuk satu parameter tidak bisa dibaca siapa pun.', v_n;
  end if;

  -- 5. Penanda asing jatuh ke normal, bukan ditolak diam-diam ---------------
  perform public.isi_hasil_penunjang(v_ord, jsonb_build_array(
    jsonb_build_object('nama', 'Leukosit', 'nilai', '4200', 'penanda', 'entah')));
  select * into v_row from public.lab_results where penunjang_id = v_ord limit 1;
  if v_row.penanda <> 'normal' then
    raise exception 'Penanda asing tersimpan sebagai %.', v_row.penanda;
  end if;

  -- 6. Radiologi naratif, dan hasil berkolom ditolak untuknya ----------------
  v_rad := (public.minta_penunjang(v_vis, 'radiologi', 'Thorax PA') ->> 'id')::uuid;
  begin
    perform public.isi_hasil_penunjang(v_rad, jsonb_build_array(
      jsonb_build_object('nama', 'Sesuatu', 'nilai', '1')));
    raise exception 'Hasil berkolom diterima untuk radiologi.';
  exception when sqlstate 'SH004' then null;
  end;
  perform public.isi_hasil_penunjang(v_rad, null,
    'Corakan bronkovaskular normal', 'Tidak tampak kelainan');
  select * into v_row from public.visit_penunjang where id = v_rad;
  if v_row.kesan <> 'Tidak tampak kelainan' then
    raise exception 'Kesan radiologi tidak tersimpan.';
  end if;

  -- 7. Pemeriksaan di luar katalog boleh diminta, tapi tidak menagih --------
  select count(*) into v_n from public.visit_charges
   where visit_id = v_vis and jenis = 'penunjang';
  if v_n <> 1 then
    raise exception 'Pemeriksaan tanpa layanan katalog ikut menagih: sekarang % baris biaya.', v_n;
  end if;

  -- 8. Membatalkan MENCABUT biayanya ----------------------------------------
  -- Pemeriksaan yang tidak jadi dikerjakan tidak boleh ditagihkan.
  v_out := public.minta_penunjang(v_vis, 'lab', 'Darah Lengkap Ulang', v_svc);
  select count(*) into v_n from public.visit_charges where visit_id = v_vis and jenis = 'penunjang';
  if v_n <> 2 then raise exception 'Permintaan kedua tidak menagih.'; end if;

  perform public.batal_penunjang((v_out ->> 'id')::uuid, 'Pasien menolak');
  select count(*) into v_n from public.visit_charges where visit_id = v_vis and jenis = 'penunjang';
  if v_n <> 1 then
    raise exception 'Biaya pemeriksaan yang dibatalkan masih tertagih: % baris.', v_n;
  end if;

  -- 9. Alasan pembatalan wajib ----------------------------------------------
  v_out := public.minta_penunjang(v_vis, 'lab', 'Uji Alasan', v_svc);
  begin
    perform public.batal_penunjang((v_out ->> 'id')::uuid, '  ');
    raise exception 'Pembatalan tanpa alasan diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 10. Yang SUDAH SELESAI tidak bisa dibatalkan ----------------------------
  begin
    perform public.batal_penunjang(v_ord, 'Coba batalkan');
    raise exception 'Pemeriksaan yang hasilnya sudah ada bisa dibatalkan, jadi kerja lab hilang dari tagihan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 11. Biayanya sampai ke kasir --------------------------------------------
  v_out := public.tagihan_kunjungan(v_vis);
  if not exists (select 1 from jsonb_array_elements(v_out -> 'biaya') x
                  where x ->> 'jenis' = 'penunjang') then
    raise exception 'Biaya penunjang tidak muncul di tagihan kasir: %', v_out -> 'biaya';
  end if;

  -- 12. Antrean lab mendahulukan yang cito ----------------------------------
  v_out := public.antrean_penunjang('lab');
  if jsonb_array_length(v_out) = 0 then
    raise exception 'Antrean lab kosong padahal ada permintaan yang belum dikerjakan.';
  end if;
  if (v_out -> 0 ->> 'prioritas') <> 'cito'
     and exists (select 1 from jsonb_array_elements(v_out) x where x ->> 'prioritas' = 'cito') then
    raise exception 'Yang cito tidak berada di atas antrean. Menandai cito jadi hiasan.';
  end if;

  -- 13. Kunjungan yang sudah ditutup tidak bisa ditambahi -------------------
  update public.visits set status = 'batal' where id = v_vis;
  begin
    perform public.minta_penunjang(v_vis, 'lab', 'Terlambat', v_svc);
    raise exception 'Kunjungan yang sudah ditutup masih bisa ditambahi pemeriksaan.';
  exception when sqlstate 'SH004' then null;
  end;

  raise exception 'SEMUA UJI LULUS. Hasil lab berkolom dan berkode, radiologi naratif, dan yang dibatalkan tidak ditagihkan.';
end $$;
