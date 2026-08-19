-- ============================================================
-- Uji migrasi 0068: siap ditagih
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Dua hal diuji di sini, dan yang kedua sebenarnya lebih penting daripada
-- fiturnya sendiri: bahwa membuat ulang `v_antrean_hari_ini` dan
-- `tagihan_kunjungan()` TIDAK menghilangkan kolom yang sudah ada. Itu persis
-- cara migrasi 0035 mengosongkan layar Kasir tanpa ada yang gagal.

do $$
declare
  v_co    uuid;
  v_umum  uuid;
  v_prod  uuid;
  v_svc   uuid;
  v_pas   uuid;
  v_vis   uuid;
  v_vis2  uuid;
  v_pen   uuid;
  v_res   uuid;
  v_out   jsonb;
  v_tag   jsonb;
  v_n     integer;
  v_ts    timestamptz;
  v_txt   text;
  r       record;
begin
  select id into v_co from public.companies
   where sektor in ('klinik','rumah_sakit') and deleted_at is null order by created_at limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_umum from public.clinic_units where company_id = v_co limit 1;
  select id into v_prod from public.products
   where company_id = v_co and coalesce(stok_total,0) > 5 limit 1;

  -- ── 1. View tidak kehilangan satu kolom pun ──────────────────────────────
  -- Kontrak, bukan basa-basi. `create or replace view` menolak menggeser
  -- kolom, dan itu JUSTRU penjaganya; uji ini menjaga hal yang sama untuk
  -- kolom yang hilang lewat DROP.
  for r in
    select unnest(array[
      'id','company_id','nomor','nomor_antre','tanggal','status','keluhan','penjamin',
      'dokter_email','dibuka_pada','ditutup_pada','pasien_id','nomor_rm','pasien_nama',
      'tanggal_lahir','jenis_kelamin','alergi','telepon','umur','jenis_kunjungan','poli',
      'no_rujukan','kesadaran','status_pulang','ihs_encounter_id','pasien_ihs_id',
      'ada_catatan','jumlah_diagnosis','ada_vital','unit_id','unit_nama','unit_kode',
      'status_resep','resep_id','nilai_biaya','transaction_id','dipanggil_pada',
      'jumlah_panggil','obat_belum_dipilih',
      'siap_tagih_pada','siap_tagih_catatan','penunjang_menggantung']) as nama
  loop
    if not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'v_antrean_hari_ini'
                      and column_name = r.nama) then
      raise exception 'Kolom % hilang dari v_antrean_hari_ini. Layar yang memilihnya eksplisit akan kosong SELURUHNYA.', r.nama;
    end if;
  end loop;

  -- ── 2. Persiapan: satu pasien, satu kunjungan ────────────────────────────
  insert into public.patients (company_id, nama) values (v_co, 'UJI Siap Tagih')
    returning id into v_pas;
  v_vis := (public.daftar_kunjungan(v_pas, 'Uji siap tagih', 'umum', v_umum, null, v_co) ->> 'id')::uuid;

  -- ── 3. Yang masih `terdaftar` ditolak ────────────────────────────────────
  -- Pasien yang belum diperiksa tidak punya apa pun untuk ditagihkan selain
  -- biaya administrasi, dan menyatakannya siap berarti memanggilnya ke kasir
  -- sebelum ia sempat masuk ruangan.
  begin
    perform public.siapkan_tagihan(v_vis);
    raise exception 'Kunjungan yang masih terdaftar bisa dinyatakan siap ditagih.';
  exception when sqlstate 'SH004' then null;
  end;

  perform public.ubah_status_kunjungan(v_vis, 'diperiksa');

  -- ── 4. Tanpa diagnosis ditolak ───────────────────────────────────────────
  -- Ditolak di sini supaya DOKTERNYA yang mendengar, bukan kasir di depan
  -- pasien yang sudah memegang uang.
  begin
    perform public.siapkan_tagihan(v_vis);
    raise exception 'Kunjungan tanpa diagnosis bisa dinyatakan siap ditagih, padahal ia tidak akan bisa ditutup.';
  exception when sqlstate 'SH004' then null;
  end;

  insert into public.visit_diagnoses (company_id, visit_id, kode_icd10, nama, tipe)
  values (v_co, v_vis, 'J06.9', 'Acute upper respiratory infection', 'primer')
  on conflict do nothing;

  -- ── 5. Resep draf ditolak, dan TANPA pintu ───────────────────────────────
  if v_prod is not null then
    v_res := (public.simpan_resep(v_vis, jsonb_build_array(jsonb_build_object(
                'product_id', v_prod, 'nama_obat', 'UJI', 'jumlah', 1,
                'dosis', '1 tablet', 'frekuensi', '3x sehari', 'rute', 'oral')),
              null, false) ->> 'id')::uuid;

    begin
      perform public.siapkan_tagihan(v_vis);
      raise exception 'Resep draf tidak menahan pernyataan siap ditagih. Kasir akan menunggu obat yang tidak pernah disiapkan siapa pun.';
    exception when sqlstate 'SH004' then null;
    end;

    -- Pintunya yang benar: finalkan. Bukan p_paksa.
    begin
      perform public.siapkan_tagihan(v_vis, 'ngeyel', true);
      raise exception 'p_paksa menembus resep draf. Pintu daruratnya seharusnya cuma untuk penunjang.';
    exception when sqlstate 'SH004' then null;
    end;

    perform public.batalkan_resep(v_res, 'uji');
  end if;

  -- ── 6. Penunjang menggantung: ditolak, TAPI punya pintu beralasan ────────
  select id into v_svc from public.services
   where company_id = v_co and jenis_penunjang = 'lab' limit 1;
  if v_svc is not null then
    v_pen := (public.minta_penunjang(v_vis, 'lab', 'Uji Lab', v_svc, 'uji', 'rutin') ->> 'id')::uuid;

    begin
      perform public.siapkan_tagihan(v_vis);
      raise exception 'Penunjang yang belum keluar hasilnya tidak menahan apa pun.';
    exception when sqlstate 'SH004' then null;
    end;

    -- Pintu tanpa alasan tetap ditolak: palang yang bisa dilewati diam-diam
    -- sama saja dengan tidak ada palang.
    begin
      perform public.siapkan_tagihan(v_vis, null, true);
      raise exception 'Pintu darurat terbuka tanpa alasan. Yang tidak meninggalkan jejak tidak bisa diperiksa siapa pun.';
    exception when sqlstate 'SH004' then null;
    end;

    v_out := public.siapkan_tagihan(v_vis, 'Rontgen dikerjakan besok, pasien membayar hari ini', true);
    if v_out ->> 'siap_tagih_pada' is null then
      raise exception 'Pintu darurat beralasan tidak menyatakan apa pun.';
    end if;
    if (v_out ->> 'penunjang_menggantung')::integer < 1 then
      raise exception 'Penunjang menggantung tidak ikut tercatat di pernyataannya.';
    end if;

    -- Alasannya masuk jejak audit, bukan cuma ke kolomnya.
    select count(*) into v_n from public.audit_logs
     where company_id = v_co and action = 'kunjungan.siap_tagih'
       and entity_id = v_vis::text;
    if v_n < 1 then
      raise exception 'Pernyataan siap ditagih tidak meninggalkan jejak audit.';
    end if;

    perform public.batal_penunjang(v_pen, 'uji');
  end if;

  -- ── 7. Menyatakan, lalu menariknya kembali ───────────────────────────────
  v_out := public.siapkan_tagihan(v_vis, null, false);
  if v_out ->> 'siap_tagih_pada' is null then
    raise exception 'Kunjungan yang sudah bersih tidak bisa dinyatakan siap ditagih.';
  end if;

  perform public.batal_siap_tagih(v_vis);
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is not null then
    raise exception 'Pernyataannya tidak bisa ditarik kembali. Tindakan yang terlewat cuma bisa ditagih lewat struk kedua.';
  end if;

  -- ── 8. Biaya yang berubah MENCABUT pernyataannya ─────────────────────────
  -- Ini inti migrasinya. Kalau tidak dicabut, dokter menyatakan siap lalu
  -- menambah tindakan, dan kasir menagih dengan lencana hijau yang sudah
  -- kedaluwarsa: menagih KURANG, persis lubang yang mau ditutup.
  perform public.siapkan_tagihan(v_vis);
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is null then raise exception 'Gagal menyatakan siap ditagih untuk uji pencabutan.'; end if;

  insert into public.visit_charges (company_id, visit_id, jenis, nama, jumlah, harga)
  values (v_co, v_vis, 'tindakan', 'UJI Tindakan Menyusul', 1, 25000);

  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is not null then
    raise exception 'Menambah tindakan TIDAK mencabut pernyataan siap ditagih. Kasir akan menagih kurang dan tidak ada yang tahu.';
  end if;

  -- Menghapus biaya juga mencabut: tagihannya berubah, jadi yang menyatakan
  -- harus melihatnya lagi.
  perform public.siapkan_tagihan(v_vis);
  delete from public.visit_charges
   where visit_id = v_vis and nama = 'UJI Tindakan Menyusul';
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is not null then
    raise exception 'Menghapus biaya tidak mencabut pernyataannya.';
  end if;

  -- ── 9. Trigger TIDAK memasang, cuma mencabut ─────────────────────────────
  -- Arah satu-satunya. Kalau ia bisa memasang, "siap ditagih" berhenti berarti
  -- ada manusia yang menyatakannya.
  insert into public.visit_charges (company_id, visit_id, jenis, nama, jumlah, harga)
  values (v_co, v_vis, 'tindakan', 'UJI Tindakan Kedua', 1, 10000);
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is not null then
    raise exception 'Trigger memasang pernyataan siap ditagih sendiri.';
  end if;

  -- ── 10. tagihan_kunjungan MEMBAWA penandanya, dan tidak kehilangan yang lama ──
  perform public.siapkan_tagihan(v_vis);
  v_tag := public.tagihan_kunjungan(v_vis);
  if v_tag -> 'kunjungan' ->> 'siap_tagih_pada' is null then
    raise exception 'tagihan_kunjungan tidak membawa penanda siap ditagih. Daftar kasir dan tagihan yang terbuka akan mengatakan dua hal berbeda.';
  end if;
  foreach v_txt in array array['resep_id', 'resep_nomor', 'resep_status', 'biaya', 'obat'] loop
    if not (v_tag ? v_txt) then
      raise exception 'tagihan_kunjungan kehilangan kunci "%" saat dibuat ulang di 0068.', v_txt;
    end if;
  end loop;
  foreach v_txt in array array['nomor', 'nomor_antre', 'status', 'penjamin', 'pasien_nama', 'nomor_rm', 'alergi'] loop
    if not (v_tag -> 'kunjungan' ? v_txt) then
      raise exception 'tagihan_kunjungan kehilangan kunjungan.% saat dibuat ulang di 0068.', v_txt;
    end if;
  end loop;

  -- ── 11. Kunjungan yang sudah ditutup tidak bisa dinyatakan ulang ─────────
  update public.visits set status = 'selesai', ditutup_pada = now() where id = v_vis;
  begin
    perform public.siapkan_tagihan(v_vis);
    raise exception 'Kunjungan yang sudah ditutup masih bisa dinyatakan siap ditagih.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.batal_siap_tagih(v_vis);
    raise exception 'Kunjungan yang sudah ditutup masih bisa ditarik pernyataannya.';
  exception when sqlstate 'SH004' then null;
  end;

  -- Biaya yang berubah pada kunjungan TERTUTUP tidak mencabut apa pun:
  -- yang sudah dibayar tidak boleh berubah keadaannya karena penyesuaian
  -- pembukuan.
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is null then raise exception 'Persiapan langkah 11 keliru.'; end if;
  insert into public.visit_charges (company_id, visit_id, jenis, nama, jumlah, harga)
  values (v_co, v_vis, 'tindakan', 'UJI Setelah Tutup', 1, 5000);
  select siap_tagih_pada into v_ts from public.visits where id = v_vis;
  if v_ts is null then
    raise exception 'Biaya pada kunjungan yang sudah ditutup ikut mencabut pernyataannya.';
  end if;

  -- ── 12. Hak: kasir TIDAK boleh menyatakan tagihannya sendiri lengkap ─────
  if public.boleh('kunjungan.siap_tagih') is null then
    raise exception 'Kapabilitas kunjungan.siap_tagih tidak dikenali boleh().';
  end if;

  -- ── 13. Tertutup untuk kunci anon ────────────────────────────────────────
  select string_agg(p.proname, ', ') into v_txt
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('siapkan_tagihan', 'batal_siap_tagih')
     and has_function_privilege('anon', p.oid, 'execute');
  if v_txt is not null then
    raise exception 'Fungsi siap tagih terbuka untuk anon: %.', v_txt;
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
