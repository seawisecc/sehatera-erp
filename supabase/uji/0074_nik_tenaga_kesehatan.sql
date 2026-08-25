-- ============================================================
-- Uji migrasi 0074: NIK tenaga kesehatan
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Yang dibuktikan, dan yang KEDUA adalah alasan uji ini ada: NIK tersimpan dan
-- terbaca, DAN `tenaga_kesehatan()` tidak kehilangan satu pun kolom yang sudah
-- ada sebelumnya. Membuat ulang fungsi sambil menghilangkan kolom yang dipilih
-- layar secara eksplisit adalah persis cara migrasi 0035 mengosongkan layar
-- Kasir tanpa ada yang gagal saat migrasinya dijalankan.

do $$
declare
  v_co   uuid;
  v_id   uuid;
  v_out  jsonb;
  v_row  jsonb;
  k      text;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then raise exception 'Klinik contoh tidak ditemukan.'; end if;

  select id into v_id from public.app_users
   where company_id = v_co and role = 'dokter' order by created_at limit 1;
  if v_id is null then raise exception 'Tidak ada dokter di klinik contoh.'; end if;

  -- ── 1. NIK tersimpan lewat simpan_perizinan ──────────────────────────────
  v_out := public.simpan_perizinan(v_id, jsonb_build_object('nik', '3374010101900001'), v_co);
  if v_out ->> 'nik' is distinct from '3374010101900001' then
    raise exception 'NIK tidak tersimpan: %.', coalesce(v_out ->> 'nik', '(kosong)');
  end if;

  -- ── 2. NIK asal-asalan DITOLAK ───────────────────────────────────────────
  begin
    perform public.simpan_perizinan(v_id, jsonb_build_object('nik', '123'), v_co);
    raise exception 'NIK 3 angka diterima, seharusnya ditolak.';
  exception when sqlstate 'SH004' then null;
  end;

  -- ── 3. Panggilan TANPA kunci nik tidak menghapusnya ──────────────────────
  -- Layar lain yang menyimpan perizinan tanpa membawa kolom NIK tidak boleh
  -- diam-diam mengosongkannya.
  v_out := public.simpan_perizinan(v_id, jsonb_build_object('nomor_sip', 'SIP-UJI-0074'), v_co);
  if v_out ->> 'nik' is distinct from '3374010101900001' then
    raise exception 'NIK hilang saat menyimpan tanpa membawa kolomnya.';
  end if;

  -- ── 4. Ganti NIK menolkan penanda pencarian ──────────────────────────────
  -- Pencarian sebelumnya menjawab tentang orang lain, jadi ia harus diulang
  -- tanpa menunggu jeda 30 hari.
  update public.app_users set ihs_dicari_pada = now() where id = v_id;
  v_out := public.simpan_perizinan(v_id, jsonb_build_object('nik', '3374010101900002'), v_co);
  if v_out ->> 'ihs_dicari_pada' is not null then
    raise exception 'Ganti NIK tidak menolkan ihs_dicari_pada.';
  end if;

  -- ── 5. tenaga_kesehatan() tidak kehilangan kolom ─────────────────────────
  v_out := public.tenaga_kesehatan(v_co);
  select value into v_row from jsonb_array_elements(v_out) where (value ->> 'id')::uuid = v_id;
  if v_row is null then raise exception 'Dokter uji hilang dari tenaga_kesehatan().'; end if;

  foreach k in array array['id','nama','email','role','status','spesialisasi','nik',
                           'nomor_str','str_sampai','nomor_sip','sip_mulai','sip_sampai',
                           'ihs_practitioner_id','sisa_hari','str_sisa_hari','poli'] loop
    if not (v_row ? k) then
      raise exception 'tenaga_kesehatan() kehilangan kolom "%". Ini cara migrasi 0035 mengosongkan layar Kasir.', k;
    end if;
  end loop;

  if v_row ->> 'nik' is distinct from '3374010101900002' then
    raise exception 'NIK tidak ikut terbawa tenaga_kesehatan().';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
