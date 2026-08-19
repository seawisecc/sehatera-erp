-- ============================================================
-- Uji migrasi 0066 + 0067: klaim penjamin
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Yang dibuktikan di sini bukan "klaimnya tersimpan", melainkan tiga hal yang
-- kalau salah berarti UANG: satu pelayanan tidak bisa masuk dua klaim, klaim
-- yang dibatalkan MELEPAS pelayanannya kembali, dan rincian klaim tidak
-- berubah saat transaksinya dibatalkan sesudahnya.

do $$
declare
  v_co    uuid;
  v_prod  uuid;
  v_as    uuid;
  v_pas   uuid;
  v_k1    uuid;
  v_k2    uuid;
  v_k3    uuid;
  v_t1    uuid;
  v_t2    uuid;
  v_t3    uuid;
  v_trx   jsonb;
  v_isi   jsonb;
  v_klaim jsonb;
  v_kl_id uuid;
  v_lain  jsonb;
  v_n     integer;
  v_num   numeric;
  v_txt   text;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit')
   and deleted_at is null order by created_at limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_prod from public.products
   where company_id = v_co and coalesce(stok_total,0) > 10 limit 1;
  if v_prod is null then raise exception 'Tidak ada obat berstok untuk diuji.'; end if;

  insert into public.insurers (company_id, nama) values (v_co, 'UJI KLAIM Asuransi') returning id into v_as;

  -- Tiga pasien, karena satu pasien tidak boleh punya dua kunjungan terbuka
  -- di hari yang sama (uq_visits_terbuka).
  insert into public.patients (company_id, nama) values (v_co, 'UJI Klaim Satu') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa') returning id into v_k1;
  insert into public.patients (company_id, nama) values (v_co, 'UJI Klaim Dua') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa') returning id into v_k2;
  insert into public.patients (company_id, nama) values (v_co, 'UJI Klaim Tiga') returning id into v_pas;
  insert into public.visits (company_id, patient_id, status) values (v_co, v_pas, 'diperiksa') returning id into v_k3;

  -- Dua BPJS dan satu asuransi, lewat jalur kasir yang sebenarnya.
  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 30000, 'jumlah', 1)),
    0, 'Tunai', jsonb_build_object('visit_id', v_k1), v_co, 'bpjs', null, 30000);
  v_t1 := (v_trx ->> 'id')::uuid;

  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 20000, 'jumlah', 1)),
    0, 'Tunai', jsonb_build_object('visit_id', v_k2), v_co, 'bpjs', null, 20000);
  v_t2 := (v_trx ->> 'id')::uuid;

  v_trx := public.apply_transaction(
    jsonb_build_array(jsonb_build_object('product_id', v_prod, 'nama_obat', 'UJI', 'harga_jual', 50000, 'jumlah', 1)),
    10000, 'Tunai', jsonb_build_object('visit_id', v_k3), v_co, 'asuransi', v_as, 40000);
  v_t3 := (v_trx ->> 'id')::uuid;

  -- 1. Yang belum diklaim menyaring per penjamin -----------------------------
  v_isi := public.tagihan_belum_diklaim(current_date, current_date, 'bpjs', null, v_co);
  select count(*) into v_n from jsonb_array_elements(v_isi) x
   where (x ->> 'id')::uuid in (v_t1, v_t2);
  if v_n <> 2 then
    raise exception 'Dua transaksi BPJS baru terbaca % di daftar belum diklaim.', v_n;
  end if;
  select count(*) into v_n from jsonb_array_elements(v_isi) x where (x ->> 'id')::uuid = v_t3;
  if v_n <> 0 then
    raise exception 'Transaksi asuransi ikut masuk saat yang diminta BPJS. Satu klaim akan dikirim ke dua penjamin.';
  end if;

  -- Pasien umum tidak pernah muncul: ia sudah membayar sendiri.
  select count(*) into v_n from jsonb_array_elements(
    public.tagihan_belum_diklaim(current_date, current_date, null, null, v_co)) x
   where x ->> 'penjamin' = 'umum';
  if v_n > 0 then
    raise exception '% transaksi umum masuk daftar tagihan penjamin.', v_n;
  end if;

  -- 2. Klaim asuransi WAJIB menyebut penerbitnya ------------------------------
  begin
    perform public.buat_klaim(current_date, current_date, 'asuransi', null, null, v_co);
    raise exception 'Klaim asuransi dibuat tanpa penerbit. Satu berkas tidak bisa dikirim ke dua perusahaan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Umum tidak bisa diklaim ------------------------------------------------
  begin
    perform public.buat_klaim(current_date, current_date, 'umum', null, null, v_co);
    raise exception 'Pasien umum bisa diklaim ke penjamin.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 4. Rentang terbalik ditolak -----------------------------------------------
  begin
    perform public.buat_klaim(current_date, current_date - 1, 'bpjs', null, null, v_co);
    raise exception 'Tanggal akhir lebih awal daripada tanggal mulai diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 5. Klaim BPJS: nomor, jumlah, dan nilai -----------------------------------
  v_klaim := public.buat_klaim(current_date, current_date, 'bpjs', null, 'UJI', v_co);
  v_kl_id := (v_klaim ->> 'id')::uuid;
  if v_klaim ->> 'nomor' is null or (v_klaim ->> 'nomor') not like 'KLM/%' then
    raise exception 'Klaim lahir tanpa nomor berpola KLM: %.', v_klaim ->> 'nomor';
  end if;
  if (v_klaim ->> 'status') <> 'draf' then
    raise exception 'Klaim baru berstatus %, seharusnya draf. Yang lahir langsung terkirim tidak pernah sempat diperiksa.',
      v_klaim ->> 'status';
  end if;
  -- Isinya belum tentu cuma dua: klinik contoh boleh punya transaksi BPJS lain
  -- hari ini. Yang diuji adalah dua yang baru dibuat ADA di dalamnya.
  select count(*) into v_n from jsonb_array_elements((v_klaim -> 'rincian')) x
   where (x ->> 'id')::uuid in (v_t1, v_t2);
  if v_n <> 2 then
    raise exception 'Rincian klaim memuat % dari dua transaksi yang baru dibuat.', v_n;
  end if;
  if (v_klaim ->> 'jumlah_transaksi')::integer <> jsonb_array_length(v_klaim -> 'rincian') then
    raise exception 'jumlah_transaksi (%) tidak sama dengan panjang rinciannya (%).',
      v_klaim ->> 'jumlah_transaksi', jsonb_array_length(v_klaim -> 'rincian');
  end if;
  select coalesce(sum((x ->> 'ditagihkan')::numeric), 0) into v_num
    from jsonb_array_elements(v_klaim -> 'rincian') x;
  if (v_klaim ->> 'total_ditagihkan')::numeric <> v_num then
    raise exception 'Total ditagihkan % tidak sama dengan jumlah rinciannya %. Yang dikirim ke BPJS akan ditolak.',
      v_klaim ->> 'total_ditagihkan', v_num;
  end if;

  -- 6. Transaksinya tertandai, dan HILANG dari daftar belum diklaim -----------
  -- Ini inti migrasinya. Yang tidak tertandai akan ditagihkan dua kali, dan
  -- menagih penjamin dua kali adalah cara tercepat kehilangan kerja sama.
  select claim_id into v_pas from public.transactions where id = v_t1;
  if v_pas is distinct from v_kl_id then
    raise exception 'Transaksi pertama tidak tertandai klaim: %.', v_pas;
  end if;
  select count(*) into v_n from jsonb_array_elements(
    public.tagihan_belum_diklaim(current_date, current_date, 'bpjs', null, v_co)) x
   where (x ->> 'id')::uuid in (v_t1, v_t2);
  if v_n <> 0 then
    raise exception '% transaksi yang sudah diklaim masih muncul sebagai belum diklaim.', v_n;
  end if;

  -- 7. Klaim kedua pada rentang yang sama menolak diri sendiri ----------------
  begin
    perform public.buat_klaim(current_date, current_date, 'bpjs', null, null, v_co);
    raise exception 'Klaim BPJS kedua dibuat padahal semuanya sudah tertagihkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 8. Asuransi tetap bisa diklaim: penandanya per transaksi, bukan per hari --
  v_lain := public.buat_klaim(current_date, current_date, 'asuransi', v_as, null, v_co);
  if (v_lain ->> 'nomor') = (v_klaim ->> 'nomor') then
    raise exception 'Dua klaim mendapat nomor yang sama: %.', v_lain ->> 'nomor';
  end if;
  select count(*) into v_n from jsonb_array_elements(v_lain -> 'rincian') x
   where (x ->> 'id')::uuid = v_t3;
  if v_n <> 1 then
    raise exception 'Transaksi asuransi tidak masuk klaim asuransinya.';
  end if;

  -- 9. Rel keadaan ------------------------------------------------------------
  v_klaim := public.ubah_status_klaim(v_kl_id, 'dikirim');
  if (v_klaim ->> 'dikirim_pada') is null then
    raise exception 'Klaim dikirim tanpa mencatat kapan. Umur piutang tidak bisa dihitung.';
  end if;

  begin
    perform public.ubah_status_klaim(v_kl_id, 'dibayar', 0);
    raise exception 'Klaim dibayar nol diterima. Ia tidak bisa dibedakan dari yang ditolak.';
  exception when sqlstate 'SH004' then null;
  end;

  begin
    perform public.ubah_status_klaim(v_kl_id, 'entah apa');
    raise exception 'Keadaan klaim karangan diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  v_klaim := public.ubah_status_klaim(v_kl_id, 'dibayar', 45000, current_date, 'dipotong verifikator');
  if (v_klaim ->> 'dibayar_jumlah')::numeric <> 45000 then
    raise exception 'Jumlah yang dibayar tercatat %, seharusnya 45000.', v_klaim ->> 'dibayar_jumlah';
  end if;
  if (v_klaim ->> 'dikirim_pada') is null then
    raise exception 'Tanggal kirim hilang saat klaim dinyatakan dibayar.';
  end if;

  -- 10. Yang sudah dibayar terkunci -------------------------------------------
  begin
    perform public.ubah_status_klaim(v_kl_id, 'batal');
    raise exception 'Klaim yang sudah dibayar bisa dibatalkan. Uang yang sudah masuk akan hilang dari catatan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 11. Membatalkan klaim MELEPAS pelayanannya --------------------------------
  -- Tanpa ini, satu klaim yang salah rentang mengunci pelayanan sebulan penuh
  -- dari penagihan, dan uangnya hilang tanpa ada yang menyadarinya.
  perform public.ubah_status_klaim((v_lain ->> 'id')::uuid, 'batal');
  select claim_id into v_pas from public.transactions where id = v_t3;
  if v_pas is not null then
    raise exception 'Transaksi masih tertandai klaim yang sudah dibatalkan.';
  end if;
  select count(*) into v_n from jsonb_array_elements(
    public.tagihan_belum_diklaim(current_date, current_date, 'asuransi', v_as, v_co)) x
   where (x ->> 'id')::uuid = v_t3;
  if v_n <> 1 then
    raise exception 'Pelayanan dari klaim yang dibatalkan tidak kembali ke daftar yang belum diklaim.';
  end if;

  -- 12. Rincian adalah CUPLIKAN, bukan tautan hidup ---------------------------
  -- Transaksi yang dibatalkan SESUDAH klaim dikirim tidak boleh mengubah isi
  -- berkas yang sudah ada di tangan verifikator BPJS. Yang berubah harus
  -- terlihat sebagai selisih.
  update public.transactions set status = 'batal' where id = v_t2;
  select jsonb_array_length(c.rincian) into v_n from public.claims c where c.id = v_kl_id;
  if (v_klaim ->> 'jumlah_transaksi')::integer <> v_n then
    raise exception 'Rincian klaim ikut berubah saat transaksinya dibatalkan: % jadi %.',
      v_klaim ->> 'jumlah_transaksi', v_n;
  end if;
  select (x ->> 'selisih_dibatalkan')::integer into v_n
    from jsonb_array_elements(public.daftar_klaim(null, v_co)) x
   where (x ->> 'id')::uuid = v_kl_id;
  if coalesce(v_n, 0) < 1 then
    raise exception 'Transaksi yang dibatalkan sesudah masuk klaim tidak terlihat sebagai selisih. Penolakan BPJS baru ketahuan dari suratnya.';
  end if;

  -- 13. Daftar klaim menyaring per keadaan ------------------------------------
  select count(*) into v_n from jsonb_array_elements(public.daftar_klaim('dibayar', v_co)) x
   where (x ->> 'id')::uuid = v_kl_id;
  if v_n <> 1 then raise exception 'Klaim dibayar tidak muncul saat disaring dibayar.'; end if;
  select count(*) into v_n from jsonb_array_elements(public.daftar_klaim('draf', v_co)) x
   where (x ->> 'id')::uuid = v_kl_id;
  if v_n <> 0 then raise exception 'Klaim dibayar ikut muncul di saringan draf.'; end if;

  -- 14. Nomor klaim unik per faskes -------------------------------------------
  select count(*) into v_n from pg_indexes
   where schemaname = 'public' and indexname = 'uq_claim_nomor';
  if v_n <> 1 then raise exception 'Nomor klaim tidak dijaga indeks unik.'; end if;

  -- 15. Klaim milik faskes lain tidak bisa disentuh ----------------------------
  select id into v_pas from public.companies
   where id <> v_co and deleted_at is null limit 1;
  if v_pas is not null then
    select count(*) into v_n from jsonb_array_elements(public.daftar_klaim(null, v_pas)) x
     where (x ->> 'id')::uuid in (v_kl_id, (v_lain ->> 'id')::uuid);
    if v_n > 0 then
      raise exception 'Klaim faskes ini terbaca dari faskes lain.';
    end if;
  end if;

  -- 16. Versi lama fungsinya benar-benar DIBUANG -------------------------------
  -- Menambah argumen berdefault melahirkan fungsi kedua, dan panggilan lama
  -- bisa jatuh ke sana diam-diam tanpa membawa faskesnya (0048).
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('buat_klaim', 'daftar_klaim', 'tagihan_belum_diklaim');
  if v_n <> 3 then
    raise exception 'Ada % fungsi klaim, seharusnya tepat 3. Versi lamanya masih hidup berdampingan.', v_n;
  end if;

  -- 17. Rahasia tetap tertutup untuk kunci anon --------------------------------
  select string_agg(p.proname, ', ') into v_txt
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('buat_klaim', 'daftar_klaim', 'tagihan_belum_diklaim', 'ubah_status_klaim')
     and has_function_privilege('anon', p.oid, 'execute');
  if v_txt is not null then
    raise exception 'Fungsi klaim terbuka untuk anon: %.', v_txt;
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
