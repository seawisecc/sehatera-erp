-- ============================================================
-- 0039  Hak akses per sub-modul kunjungan
-- ============================================================
--
-- Ini KEPATUHAN, bukan kenyamanan. Sampai sekarang hak akses cuma menyaring
-- MENU: `ROLE_PAGES` di lib/navigation.ts menentukan halaman apa yang muncul
-- di sidebar. Yang menahan cuma tombolnya.
--
-- Artinya petugas pendaftaran yang mengetik alamat rekam medis di peramban,
-- atau memanggil `rekam_medis()` lewat kunci anon yang memang ada di dalam
-- peramban, membaca SOAP dan diagnosis siapa pun di kliniknya. Tidak perlu
-- meretas apa pun. Untuk rekam medis itu bukan kelalaian kecil.
--
-- Jadi penjaganya turun ke database, di dalam fungsinya, bukan di layar.
--
-- Bentuk yang dipakai, dan ini yang pernah saya usulkan ke pemilik:
--
--   pendaftaran  identitas dan antrean. TIDAK membuka rekam medis.
--   perawat      tanda vital dan tindakan. TIDAK menegakkan diagnosis.
--   dokter       SOAP, diagnosis, dan resep.
--   farmasi      resep dan alergi. TIDAK membuka SOAP.
--   kasir        tagihan. TIDAK membuka apa pun yang medis.
--
-- Yang perlu diperhatikan kalau bentuk ini diubah nanti: `pemilik` dan
-- `admin` sengaja mendapat SEMUANYA. Bukan karena mereka lebih berhak
-- membaca rekam medis pasien, tapi karena mengunci pemilik dari datanya
-- sendiri akan membuat klinik berhenti bekerja pada hari pertama, dan yang
-- terjadi berikutnya adalah semua orang dibuatkan akun pemilik.

-- ------------------------------------------------------------
-- 1. Peran si pemanggil
-- ------------------------------------------------------------

create or replace function public.peran_saya()
returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(
    -- Pemilik dikenali dari email pendaftar faskesnya, bukan dari app_users.
    -- Ia memang tidak punya baris di sana.
    (select 'pemilik' from public.companies
      where lower(admin_email) = lower(auth.jwt() ->> 'email')
        and deleted_at is null limit 1),
    (select u.role from public.app_users u
      where lower(u.email) = lower(auth.jwt() ->> 'email')
        and u.status = 'aktif' limit 1));
$$;

revoke all on function public.peran_saya() from public, anon;
grant execute on function public.peran_saya() to authenticated;

-- ------------------------------------------------------------
-- 2. Matriks kemampuan
-- ------------------------------------------------------------
-- Ditulis sebagai satu tempat, bukan disebar sebagai `if peran = ...` di
-- sepuluh fungsi. Kalau disebar, penambahan peran berikutnya akan
-- ketinggalan di salah satunya dan tidak ada yang mengeluh.

create or replace function public.boleh(p_kapabilitas text)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select case
    -- Jalur admin platform dan koneksi langsung tidak lewat sini. Skrip
    -- pemeliharaan dan super admin tidak punya `role`, dan mengunci mereka
    -- berarti mengunci perbaikan data saat ada yang rusak.
    when public.boleh_admin_platform() then true
    else coalesce((
      select case p_kapabilitas
        when 'rekam_medis.baca'  then peran in ('pemilik','admin','dokter','perawat')
        when 'rekam_medis.tulis' then peran in ('pemilik','admin','dokter','perawat')
        when 'diagnosis.tulis'   then peran in ('pemilik','admin','dokter')
        when 'resep.baca'        then peran in ('pemilik','admin','dokter','perawat','apoteker','asisten_apoteker')
        when 'resep.tulis'       then peran in ('pemilik','admin','dokter')
        when 'resep.layani'      then peran in ('pemilik','admin','apoteker','asisten_apoteker')
        else false
      end
      from (select public.peran_saya() as peran) x
    ), false)
  end;
$$;

revoke all on function public.boleh(text) from public, anon;
grant execute on function public.boleh(text) to authenticated;

/**
 * Sama seperti `boleh()`, tapi menolak dengan pesan yang bisa dibaca orang.
 *
 * Pesannya sengaja menyebut PERAN si pemanggil. Tanpa itu, yang kena akan
 * melapor "aplikasinya error" dan yang menerima laporan harus menebak.
 */
create or replace function public.wajib_boleh(p_kapabilitas text)
returns void
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.boleh(p_kapabilitas) then
    raise exception 'Peran % tidak berhak %. Minta pemilik faskes mengubah perannya kalau ini keliru.',
      coalesce(public.peran_saya(), 'tanpa peran'), p_kapabilitas
      using errcode = 'SH007';
  end if;
end;
$$;

revoke all on function public.wajib_boleh(text) from public, anon;
grant execute on function public.wajib_boleh(text) to authenticated;

-- ------------------------------------------------------------
-- 3. Fungsi yang dijaga
-- ------------------------------------------------------------
-- Badan kesepuluh fungsi di bawah DISALIN MEKANIS dari migrasi asalnya
-- (0018, 0034, 0035, 0038), bukan diketik ulang. Satu-satunya perubahan
-- adalah baris `perform public.wajib_boleh(...)` tepat sesudah `begin`.
-- Alasannya kesalahan di migrasi 0037: menulis ulang definisi dari ingatan
-- menjatuhkan hal yang tidak ada yang mengeluhkan sampai terlambat.

-- rekam_medis
create or replace function public.rekam_medis(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_visit record;
begin
  perform public.wajib_boleh('rekam_medis.baca');
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  return jsonb_build_object(
    'soap',      (select to_jsonb(n) from public.visit_notes n where n.visit_id = p_visit),
    'vital',     coalesce((select jsonb_agg(to_jsonb(v) order by v.dicatat_pada desc)
                             from public.visit_vitals v where v.visit_id = p_visit), '[]'::jsonb),
    'diagnosis', coalesce((select jsonb_agg(to_jsonb(d) order by d.tipe, d.kode_icd10)
                             from public.visit_diagnoses d where d.visit_id = p_visit), '[]'::jsonb),
    'adendum',   coalesce((select jsonb_agg(to_jsonb(a) order by a.ditulis_pada)
                             from public.visit_addenda a where a.visit_id = p_visit), '[]'::jsonb),
    'riwayat',   coalesce((select jsonb_agg(to_jsonb(l) order by l.pada)
                             from public.visit_status_log l where l.visit_id = p_visit), '[]'::jsonb)
  );
end;
$$;

-- simpan_rekam_medis
create or replace function public.simpan_rekam_medis(
  p_visit     uuid,
  p_soap      jsonb default null,
  p_vital     jsonb default null,
  p_diagnosis jsonb default null,
  p_kunjungan jsonb default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_d     jsonb;
  v_primer integer := 0;
begin
  perform public.wajib_boleh('rekam_medis.tulis');
  -- Diagnosis dijaga TERPISAH: perawat boleh menambah tanda vital
  -- pada kunjungan yang sama, tapi tidak boleh menegakkan diagnosis.
  if p_diagnosis is not null then
    perform public.wajib_boleh('diagnosis.tulis');
  end if;
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup. Koreksi ditulis sebagai adendum, bukan dengan mengubah catatannya.'
      using errcode = 'SH004';
  end if;

  -- ── SOAP ──
  if p_soap is not null then
    insert into public.visit_notes (
      company_id, visit_id, subjektif, objektif, asesmen, plan, dicatat_oleh)
    values (
      v_visit.company_id, p_visit,
      nullif(trim(p_soap ->> 'subjektif'), ''),
      nullif(trim(p_soap ->> 'objektif'), ''),
      nullif(trim(p_soap ->> 'asesmen'), ''),
      nullif(trim(p_soap ->> 'plan'), ''),
      v_email)
    on conflict (visit_id) do update set
      subjektif   = excluded.subjektif,
      objektif    = excluded.objektif,
      asesmen     = excluded.asesmen,
      plan        = excluded.plan,
      diubah_pada = now();
  end if;

  -- ── Tanda vital ──
  -- Baris baru tiap kali disimpan, bukan menimpa: pengukuran ulang adalah
  -- kejadian tersendiri, dan yang diukur ulang biasanya justru yang penting.
  if p_vital is not null and p_vital <> '{}'::jsonb then
    insert into public.visit_vitals (
      company_id, visit_id, sistole, diastole, nadi, napas, suhu, saturasi,
      berat, tinggi, lingkar_perut, dicatat_oleh)
    values (
      v_visit.company_id, p_visit,
      nullif(p_vital ->> 'sistole', '')::integer,
      nullif(p_vital ->> 'diastole', '')::integer,
      nullif(p_vital ->> 'nadi', '')::integer,
      nullif(p_vital ->> 'napas', '')::integer,
      nullif(p_vital ->> 'suhu', '')::numeric,
      nullif(p_vital ->> 'saturasi', '')::integer,
      nullif(p_vital ->> 'berat', '')::numeric,
      nullif(p_vital ->> 'tinggi', '')::numeric,
      nullif(p_vital ->> 'lingkar_perut', '')::numeric,
      v_email);
  end if;

  -- ── Diagnosis ──
  if p_diagnosis is not null then
    delete from public.visit_diagnoses where visit_id = p_visit;

    for v_d in select * from jsonb_array_elements(p_diagnosis) loop
      if coalesce(trim(v_d ->> 'kode_icd10'), '') = '' then
        continue;
      end if;
      if coalesce(v_d ->> 'tipe', 'sekunder') = 'primer' then
        v_primer := v_primer + 1;
      end if;
      insert into public.visit_diagnoses (
        company_id, visit_id, kode_icd10, nama, tipe, catatan, dicatat_oleh)
      values (
        v_visit.company_id, p_visit,
        upper(trim(v_d ->> 'kode_icd10')),
        coalesce(nullif(trim(v_d ->> 'nama'), ''), upper(trim(v_d ->> 'kode_icd10'))),
        coalesce(nullif(v_d ->> 'tipe', ''), 'sekunder'),
        nullif(trim(v_d ->> 'catatan'), ''),
        v_email);
    end loop;

    if v_primer > 1 then
      raise exception 'Hanya boleh ada satu diagnosis primer.' using errcode = 'SH004';
    end if;
  end if;

  -- ── Keterangan kunjungan yang diminta BPJS ──
  if p_kunjungan is not null then
    update public.visits set
      kesadaran       = coalesce(nullif(trim(p_kunjungan ->> 'kesadaran'), ''), kesadaran),
      jenis_kunjungan = coalesce(nullif(p_kunjungan ->> 'jenis_kunjungan', ''), jenis_kunjungan),
      poli            = coalesce(nullif(trim(p_kunjungan ->> 'poli'), ''), poli),
      no_rujukan      = coalesce(nullif(trim(p_kunjungan ->> 'no_rujukan'), ''), no_rujukan),
      status_pulang   = coalesce(nullif(p_kunjungan ->> 'status_pulang', ''), status_pulang),
      keluhan         = coalesce(nullif(trim(p_kunjungan ->> 'keluhan'), ''), keluhan)
     where id = p_visit;
  end if;

  perform public.catat_audit(v_visit.company_id, 'rekam_medis.disimpan', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor,
                       'ada_soap', p_soap is not null,
                       'ada_vital', p_vital is not null and p_vital <> '{}'::jsonb,
                       'jumlah_diagnosis', coalesce(jsonb_array_length(p_diagnosis), 0)));

  return jsonb_build_object('ok', true);
end;
$$;

-- tambah_adendum
create or replace function public.tambah_adendum(p_visit uuid, p_isi text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_row   record;
begin
  perform public.wajib_boleh('rekam_medis.tulis');
  if coalesce(trim(p_isi), '') = '' then
    raise exception 'Isi adendum tidak boleh kosong.' using errcode = 'SH004';
  end if;

  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  insert into public.visit_addenda (company_id, visit_id, isi, ditulis_oleh)
  values (v_visit.company_id, p_visit, trim(p_isi),
          coalesce(lower(auth.jwt() ->> 'email'), 'sistem'))
  returning * into v_row;

  perform public.catat_audit(v_visit.company_id, 'rekam_medis.adendum', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor));

  return to_jsonb(v_row);
end;
$$;

-- riwayat_pasien
create or replace function public.riwayat_pasien(p_pasien uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_pasien record;
  v_hasil  jsonb;
begin
  perform public.wajib_boleh('rekam_medis.baca');
  -- Penyaringnya di sini, bukan di kueri pemanggil. Fungsi security definer
  -- yang menerima id pasien sebagai argumen tanpa memeriksa pemiliknya bisa
  -- dipakai membaca rekam medis faskes lain satu per satu, dan itu justru
  -- jenis kebocoran yang paling gampang tidak disadari. Aturan yang sama
  -- ditulis di CLAUDE.md untuk company_quota dan kawan-kawannya.
  select p.* into v_pasien
    from public.patients p
   where p.id = p_pasien
     and (public.boleh_admin_platform() or p.company_id = public.auth_company_id());
  if not found then
    raise exception 'Pasien tidak ditemukan.' using errcode = 'SH004';
  end if;

  select jsonb_build_object(
    'pasien', jsonb_build_object(
      'id', v_pasien.id, 'nama', v_pasien.nama, 'nomor_rm', v_pasien.nomor_rm,
      'nik', v_pasien.nik, 'tanggal_lahir', v_pasien.tanggal_lahir,
      'jenis_kelamin', v_pasien.jenis_kelamin, 'alergi', v_pasien.alergi,
      'penjamin', v_pasien.penjamin),
    'kunjungan', coalesce((
      select jsonb_agg(x order by x.tanggal desc, x.dibuka_pada desc)
      from (
        select
          v.id, v.nomor, v.nomor_antre, v.tanggal, v.status, v.keluhan,
          v.dibuka_pada, v.ditutup_pada, v.dokter_email, v.penjamin,
          v.poli, v.no_rujukan, v.status_pulang, v.jenis_kunjungan, v.kesadaran,
          u.nama as unit_nama,
          (select jsonb_build_object('kode', d.kode_icd10, 'nama', d.nama,
                                     'terverifikasi', d.terverifikasi)
             from public.visit_diagnoses d
            where d.visit_id = v.id and d.tipe = 'primer' limit 1) as diagnosis,
          (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::int
            as jumlah_diagnosis,
          (select count(*) from public.prescriptions r
            where r.visit_id = v.id and r.status <> 'batal')::int as jumlah_resep,
          (select count(*) from public.visit_addenda a where a.visit_id = v.id)::int
            as jumlah_adendum,
          exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_soap,
          exists (select 1 from public.visit_vitals w where w.visit_id = v.id) as ada_vital
        from public.visits v
        left join public.clinic_units u on u.id = v.unit_id
        where v.patient_id = p_pasien
      ) x), '[]'::jsonb)
  ) into v_hasil;

  return v_hasil;
end;
$$;

-- resep_kunjungan
create or replace function public.resep_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_visit record; v_resep record;
begin
  perform public.wajib_boleh('resep.baca');
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions
   where visit_id = p_visit
     and status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;
  if not found then
    return jsonb_build_object('resep', null, 'items', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'permintaan_terbuka', i.permintaan_terbuka, 'permintaan_asli', i.permintaan_asli,
        'diisi_oleh', i.diisi_oleh, 'diisi_pada', i.diisi_pada,
        'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori,
        'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = v_resep.id), '[]'::jsonb));
end;
$$;

-- isi_resep
create or replace function public.isi_resep(p_resep uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_resep record;
begin
  perform public.wajib_boleh('resep.baca');
  select * into v_resep from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'permintaan_terbuka', i.permintaan_terbuka, 'permintaan_asli', i.permintaan_asli,
        'diisi_oleh', i.diisi_oleh, 'diisi_pada', i.diisi_pada,
        'stok', p.stok_total, 'kategori', p.kategori, 'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = p_resep), '[]'::jsonb));
end;
$$;

-- simpan_resep
create or replace function public.simpan_resep(
  p_visit  uuid,
  p_items  jsonb,
  p_catatan text default null,
  p_final  boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_resep  record;
  v_email  text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_item   jsonb;
  v_urut   integer := 0;
  v_jumlah numeric;
begin
  perform public.wajib_boleh('resep.tulis');
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, resepnya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  -- Daftar status di sini DIPERLUAS, dan ini memperbaiki lubang yang dibuka
  -- migrasi 0035 tanpa disadari. Aslinya cuma melihat ('draf','final'), jadi
  -- resep yang sedang `disiapkan` atau `siap` tidak terlihat sama sekali dan
  -- dokter yang menekan simpan akan mendapat resep KEDUA di kunjungan yang
  -- sama, diam-diam, sementara farmasi masih menyiapkan yang pertama.
  select * into v_resep from public.prescriptions
   where visit_id = p_visit and status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;

  if found and v_resep.status <> 'draf' then
    raise exception 'Resep ini sudah difinalkan dan tidak bisa diubah. Batalkan dulu dengan alasannya, lalu tulis resep baru.'
      using errcode = 'SH004';
  end if;

  if not found then
    insert into public.prescriptions (company_id, visit_id, nomor, dokter_email, catatan)
    values (v_visit.company_id, p_visit,
            public.next_doc_number(v_visit.company_id, 'prescriptions', 'nomor', 'RSP', to_char(current_date, 'YYYY')),
            coalesce(v_visit.dokter_email, v_email),
            nullif(trim(p_catatan), ''))
    returning * into v_resep;
  else
    update public.prescriptions
       set catatan = nullif(trim(p_catatan), ''),
           dokter_email = coalesce(v_visit.dokter_email, dokter_email, v_email)
     where id = v_resep.id
    returning * into v_resep;
  end if;

  delete from public.prescription_items where prescription_id = v_resep.id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(v_item ->> 'nama_obat'), '') = '' then
      continue;
    end if;
    v_jumlah := coalesce(nullif(v_item ->> 'jumlah', '')::numeric, 0);
    if v_jumlah <= 0 then
      raise exception 'Jumlah obat % harus lebih dari nol.', v_item ->> 'nama_obat' using errcode = 'SH004';
    end if;
    v_urut := v_urut + 1;
    insert into public.prescription_items (
      company_id, prescription_id, product_id, nama_obat, jumlah, satuan,
      dosis, frekuensi, rute, aturan_pakai, catatan, urutan, permintaan_terbuka)
    values (
      v_visit.company_id, v_resep.id,
      nullif(v_item ->> 'product_id', '')::uuid,
      trim(v_item ->> 'nama_obat'),
      v_jumlah,
      nullif(trim(v_item ->> 'satuan'), ''),
      nullif(trim(v_item ->> 'dosis'), ''),
      nullif(trim(v_item ->> 'frekuensi'), ''),
      nullif(trim(v_item ->> 'rute'), ''),
      nullif(trim(v_item ->> 'aturan_pakai'), ''),
      nullif(trim(v_item ->> 'catatan'), ''),
      v_urut,
      -- SATU-SATUNYA tambahan di fungsi ini. Permintaan terbuka cuma sah
      -- kalau produknya memang belum dipilih; kalau dokter sudah memilih,
      -- penandanya diabaikan supaya farmasi tidak bisa menggantinya.
      coalesce((v_item ->> 'permintaan_terbuka')::boolean, false)
        and nullif(v_item ->> 'product_id', '') is null);
  end loop;

  if p_final then
    if v_urut = 0 then
      raise exception 'Resep kosong tidak bisa difinalkan.' using errcode = 'SH004';
    end if;
    update public.prescriptions
       set status = 'final', difinalkan_pada = now()
     where id = v_resep.id
    returning * into v_resep;
  end if;

  perform public.catat_audit(v_visit.company_id,
    case when p_final then 'resep.final' else 'resep.disimpan' end,
    'prescriptions', v_resep.id::text,
    jsonb_build_object('nomor', v_resep.nomor, 'kunjungan', v_visit.nomor, 'jumlah_item', v_urut));

  return to_jsonb(v_resep);
end;
$$;

-- isi_permintaan_farmasi
create or replace function public.isi_permintaan_farmasi(
  p_item    uuid,
  p_product uuid,
  p_nama    text,
  p_jumlah  numeric default null,
  p_satuan  text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_item  record;
  v_resep record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  perform public.wajib_boleh('resep.layani');
  select i.* into v_item from public.prescription_items i
   where i.id = p_item
     and (public.boleh_admin_platform() or i.company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Baris resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  if not v_item.permintaan_terbuka then
    raise exception 'Baris ini sudah ditentukan dokter, jadi tidak bisa diganti farmasi. Kalau obatnya tidak ada, hubungi dokternya.'
      using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions where id = v_item.prescription_id;
  if v_resep.status not in ('final', 'disiapkan', 'siap') then
    raise exception 'Resep ini tidak sedang disiapkan, jadi isinya tidak bisa diubah.' using errcode = 'SH004';
  end if;

  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama obatnya wajib diisi.' using errcode = 'SH004';
  end if;

  update public.prescription_items
     set permintaan_asli = coalesce(permintaan_asli, nama_obat),
         product_id      = p_product,
         nama_obat       = trim(p_nama),
         jumlah          = greatest(coalesce(p_jumlah, jumlah), 0.01),
         satuan          = coalesce(nullif(trim(p_satuan), ''), satuan),
         diisi_oleh      = v_email,
         diisi_pada      = now()
   where id = p_item
  returning * into v_item;

  perform public.catat_audit(v_item.company_id, 'resep.diisi_farmasi',
    'prescription_items', p_item::text,
    jsonb_build_object('permintaan', v_item.permintaan_asli,
                       'diisi', v_item.nama_obat, 'oleh', v_email));

  return to_jsonb(v_item);
end;
$$;

-- ubah_status_resep
create or replace function public.ubah_status_resep(p_resep uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row   record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  perform public.wajib_boleh('resep.layani');
  if p_status not in ('final', 'disiapkan', 'siap') then
    raise exception 'Keadaan resep "%" tidak dikenal di sini. Penyerahan lewat serahkan_resep().', p_status
      using errcode = 'SH004';
  end if;

  select * into v_row from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- Draf tidak boleh masuk antrean penyiapan. Draf artinya dokter belum
  -- selesai berpikir, dan obat yang disiapkan dari draf adalah obat yang
  -- tidak pernah diperintahkan. Aturan yang sama sudah ditulis di migrasi
  -- 0023 untuk antreannya.
  if v_row.status = 'draf' then
    raise exception 'Resep ini masih draf. Dokter harus memfinalkannya dulu.' using errcode = 'SH004';
  end if;
  if v_row.status in ('dilayani', 'batal') then
    raise exception 'Resep ini sudah selesai, keadaannya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status         = p_status,
         disiapkan_pada = case when p_status = 'disiapkan' then coalesce(disiapkan_pada, now())
                               when p_status = 'final' then null else disiapkan_pada end,
         disiapkan_oleh = case when p_status = 'disiapkan' then coalesce(disiapkan_oleh, v_email)
                               when p_status = 'final' then null else disiapkan_oleh end,
         siap_pada      = case when p_status = 'siap' then now() else null end
   where id = p_resep
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'resep.' || p_status, 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'oleh', v_email));

  return to_jsonb(v_row);
end;
$$;

-- serahkan_resep
create or replace function public.serahkan_resep(
  p_resep uuid,
  p_tanpa_bayar boolean default false,
  p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row    record;
  v_visit  record;
  v_email  text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_bayar  uuid;
begin
  perform public.wajib_boleh('resep.layani');
  select * into v_row from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_row.status = 'dilayani' then
    return to_jsonb(v_row);
  end if;
  if v_row.status in ('draf', 'batal') then
    raise exception 'Resep ini belum difinalkan atau sudah dibatalkan, jadi tidak bisa diserahkan.'
      using errcode = 'SH004';
  end if;

  select * into v_visit from public.visits where id = v_row.visit_id;
  v_bayar := coalesce(v_row.transaction_id, v_visit.transaction_id);

  if v_bayar is null and not coalesce(p_tanpa_bayar, false) then
    raise exception 'Pembayaran resep ini belum tercatat, jadi obatnya belum boleh diserahkan.'
      using errcode = 'SH004';
  end if;
  if v_bayar is null and coalesce(trim(p_alasan), '') = '' then
    raise exception 'Menyerahkan obat sebelum pembayaran harus disertai alasan.'
      using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status             = 'dilayani',
         dilayani_pada      = now(),
         diserahkan_oleh    = v_email,
         transaction_id     = coalesce(transaction_id, v_bayar),
         serah_tanpa_bayar  = (v_bayar is null),
         alasan_tanpa_bayar = case when v_bayar is null then trim(p_alasan) else null end
   where id = p_resep
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'resep.diserahkan', 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'oleh', v_email,
                       'tanpa_bayar', v_row.serah_tanpa_bayar,
                       'alasan', v_row.alasan_tanpa_bayar));

  return to_jsonb(v_row);
end;
$$;
