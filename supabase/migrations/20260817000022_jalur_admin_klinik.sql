-- ============================================================
-- 0022  Jalur admin untuk pasien dan pendaftaran kunjungan
-- ============================================================
--
-- Dua fungsi ini masih membaca perusahaan HANYA dari `auth_company_id()`.
-- Akibatnya dua hal, dan yang kedua bukan soal pengujian:
--
-- 1. Keduanya tidak bisa diuji dari sambungan langsung ke database, jadi
--    penomoran antrean per poli yang baru saja dibuat tidak bisa DIBUKTIKAN.
--    Alasan yang sama seperti migrasi 0014 dan 0017 berlaku di sini: sambungan
--    langsung ke database sudah bisa INSERT ke tabelnya, jadi penjaga itu tidak
--    melindungi apa pun di sana, ia cuma menghalangi pemeriksaan.
--
-- 2. Super admin yang sedang melihat satu klinik tidak bisa mendaftarkan pasien
--    atau kunjungan di klinik itu. Ia akan mendarat di perusahaannya sendiri,
--    atau ditolak. Ini bukan kekurangan pengujian, ini cacat yang akan ditemui
--    orang pertama yang mencoba membantu klien lewat akun super admin.
--
-- Bentuknya disamakan dengan `apply_transaction`, yang sejak awal memang sudah
-- menerima `p_company` untuk keperluan yang persis sama. Argumennya ditaruh di
-- belakang dengan nilai bawaan, jadi tidak ada pemanggil lama yang patah.

create or replace function public.simpan_pasien(
  p_id      uuid,
  p_data    jsonb,
  p_company uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := case when p_company is not null and public.boleh_admin_platform()
                         then p_company else public.auth_company_id() end;
  v_nama    text := nullif(trim(p_data ->> 'nama'), '');
  v_nik     text := nullif(trim(p_data ->> 'nik'), '');
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if v_nama is null then
    raise exception 'Nama pasien wajib diisi.' using errcode = 'SH004';
  end if;
  if v_nik is not null and v_nik !~ '^[0-9]{16}$' then
    raise exception 'NIK harus 16 angka.' using errcode = 'SH004';
  end if;

  if p_id is null then
    insert into public.patients (
      company_id, nomor_rm, nama, nik, tanggal_lahir, jenis_kelamin,
      alamat, telepon, gol_darah, alergi, penjamin, nomor_penjamin, catatan)
    values (
      v_company,
      public.next_doc_number(v_company, 'patients', 'nomor_rm', 'RM', to_char(current_date, 'YYYY')),
      v_nama, v_nik,
      nullif(p_data ->> 'tanggal_lahir', '')::date,
      nullif(p_data ->> 'jenis_kelamin', ''),
      nullif(trim(p_data ->> 'alamat'), ''),
      nullif(trim(p_data ->> 'telepon'), ''),
      nullif(trim(p_data ->> 'gol_darah'), ''),
      nullif(trim(p_data ->> 'alergi'), ''),
      coalesce(nullif(p_data ->> 'penjamin', ''), 'umum'),
      nullif(trim(p_data ->> 'nomor_penjamin'), ''),
      nullif(trim(p_data ->> 'catatan'), ''))
    returning * into v_row;

    perform public.catat_audit(v_company, 'pasien.didaftarkan', 'patients', v_row.id::text,
      jsonb_build_object('nomor_rm', v_row.nomor_rm, 'nama', v_nama));
  else
    update public.patients set
      nama           = v_nama,
      nik            = v_nik,
      tanggal_lahir  = nullif(p_data ->> 'tanggal_lahir', '')::date,
      jenis_kelamin  = nullif(p_data ->> 'jenis_kelamin', ''),
      alamat         = nullif(trim(p_data ->> 'alamat'), ''),
      telepon        = nullif(trim(p_data ->> 'telepon'), ''),
      gol_darah      = nullif(trim(p_data ->> 'gol_darah'), ''),
      alergi         = nullif(trim(p_data ->> 'alergi'), ''),
      penjamin       = coalesce(nullif(p_data ->> 'penjamin', ''), 'umum'),
      nomor_penjamin = nullif(trim(p_data ->> 'nomor_penjamin'), ''),
      catatan        = nullif(trim(p_data ->> 'catatan'), '')
     where id = p_id and (public.boleh_admin_platform() or company_id = v_company)
    returning * into v_row;

    if not found then
      raise exception 'Pasien tidak ditemukan.' using errcode = 'SH004';
    end if;

    perform public.catat_audit(v_company, 'pasien.diubah', 'patients', p_id::text,
      jsonb_build_object('nomor_rm', v_row.nomor_rm, 'nama', v_nama));
  end if;

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'NIK ini sudah terdaftar atas pasien lain. Cari dulu di daftar pasien sebelum mendaftarkan yang baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.simpan_pasien(uuid, jsonb, uuid) from public, anon;
grant execute on function public.simpan_pasien(uuid, jsonb, uuid) to authenticated;

drop function if exists public.simpan_pasien(uuid, jsonb);

create or replace function public.daftar_kunjungan(
  p_patient  uuid,
  p_keluhan  text default null,
  p_penjamin text default null,
  p_unit     uuid default null,
  p_dokter   text default null,
  p_company  uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := case when p_company is not null and public.boleh_admin_platform()
                         then p_company else public.auth_company_id() end;
  v_pasien  record;
  v_unit    record;
  v_awalan  text := 'A';
  v_urut    integer;
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;

  select * into v_pasien from public.patients
   where id = p_patient and company_id = v_company;
  if not found then
    raise exception 'Pasien tidak ditemukan di fasilitas ini.' using errcode = 'SH004';
  end if;

  if p_unit is not null then
    select * into v_unit from public.clinic_units
     where id = p_unit and company_id = v_company;
    if not found then
      raise exception 'Poli tidak ditemukan.' using errcode = 'SH004';
    end if;
    if not v_unit.aktif then
      raise exception 'Poli % sedang tidak aktif.', v_unit.nama using errcode = 'SH004';
    end if;
    v_awalan := v_unit.kode;
  end if;

  select count(*) + 1 into v_urut from public.visits
   where company_id = v_company
     and tanggal = current_date
     and unit_id is not distinct from p_unit;

  insert into public.visits (
    company_id, patient_id, nomor, nomor_antre, keluhan, penjamin, petugas_daftar,
    unit_id, poli, dokter_email)
  values (
    v_company, p_patient,
    public.next_doc_number(v_company, 'visits', 'nomor', 'KJG', to_char(current_date, 'YYYY')),
    v_awalan || '-' || lpad(v_urut::text, 3, '0'),
    nullif(trim(p_keluhan), ''),
    coalesce(nullif(p_penjamin, ''), v_pasien.penjamin, 'umum'),
    coalesce(lower(auth.jwt() ->> 'email'), 'sistem'),
    p_unit,
    v_unit.nama,
    lower(nullif(trim(p_dokter), '')))
  returning * into v_row;

  perform public.catat_audit(v_company, 'kunjungan.dibuka', 'visits', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'antre', v_row.nomor_antre,
                       'pasien', v_pasien.nama, 'rm', v_pasien.nomor_rm,
                       'poli', v_row.poli));

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'Pasien ini sudah punya kunjungan yang belum selesai hari ini. Lanjutkan yang itu, jangan buat baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.daftar_kunjungan(uuid, text, text, uuid, text, uuid) from public, anon;
grant execute on function public.daftar_kunjungan(uuid, text, text, uuid, text, uuid) to authenticated;

drop function if exists public.daftar_kunjungan(uuid, text, text, uuid, text);
