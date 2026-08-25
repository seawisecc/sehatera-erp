-- ============================================================
-- 0074  NIK tenaga kesehatan bisa diisi
-- ============================================================
--
-- `app_users.nik` sudah ada sejak migrasi 0018, dan sampai hari ini **tidak
-- ada satu pun tempat di aplikasi untuk mengisinya.** Kolom yang tidak bisa
-- diisi sama saja dengan kolom yang tidak ada; ia cuma lebih sulit disadari,
-- karena skemanya terlihat lengkap.
--
-- Baru terasa saat pengiriman SatuSehat jalan. Nomor IHS tenaga kesehatan
-- didapat dengan MENCARI lewat NIK, jadi tanpa NIK seluruh nakes selain yang
-- dibuat lewat seed tidak pernah bisa dicocokkan, dan seluruh kunjungan yang
-- mereka tangani tidak pernah bisa dikirim. Ditemukan pemilik saat bertanya
-- "bagaimana dengan nakes lain".
--
-- **Diisi lewat `simpan_perizinan()`, bukan `update app_users` langsung.**
-- Aturan lama project ini: RLS menyaring BARIS, bukan KOLOM. Layar yang boleh
-- menulis NIK lewat jalur biasa otomatis boleh menulis `role` juga, dan `role`
-- adalah seluruh hak akses orang itu.
--
-- **NIK divalidasi 16 angka di database**, bukan cuma di form. Alasan yang
-- sama dengan `simpan_pasien()` di 0059: NIK karangan lebih berbahaya daripada
-- NIK kosong, karena ia terlihat seperti data dan ikut dikirim ke sistem
-- nasional. Bedanya dengan pasien, di sini NIK BOLEH kosong: tenaga kesehatan
-- yang tidak pernah menangani pasien (kasir, pendaftaran) tidak butuh nomor
-- IHS, dan memaksa mereka mengisi NIK berarti mengumpulkan identitas yang
-- tidak dipakai untuk apa pun.

create or replace function public.simpan_perizinan(
  p_id      uuid,
  p_data    jsonb,
  p_company uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
  v_row   record;
  v_mulai date := nullif(p_data ->> 'sip_mulai', '')::date;
  v_sampai date := nullif(p_data ->> 'sip_sampai', '')::date;
  v_nik   text := nullif(trim(p_data ->> 'nik'), '');
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak mengubah perizinan tenaga kesehatan.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if v_mulai is not null and v_sampai is not null and v_sampai < v_mulai then
    raise exception 'Masa berlaku berakhir sebelum ia mulai.' using errcode = 'SH004';
  end if;
  if v_nik is not null and v_nik !~ '^[0-9]{16}$' then
    raise exception 'NIK harus 16 angka. Kosongkan saja kalau memang belum ada, jangan mengarang nomor.'
      using errcode = 'SH004';
  end if;

  update public.app_users set
    nama                = coalesce(nullif(trim(p_data ->> 'nama'), ''), nama),
    -- Kunci yang TIDAK dikirim tidak mengubah apa pun; ini menjaga layar lama
    -- yang belum membawa kolom `nik` tidak diam-diam mengosongkannya.
    nik                 = case when p_data ? 'nik' then v_nik else nik end,
    spesialisasi        = nullif(trim(p_data ->> 'spesialisasi'), ''),
    nomor_str           = nullif(trim(p_data ->> 'nomor_str'), ''),
    str_sampai          = nullif(p_data ->> 'str_sampai', '')::date,
    nomor_sip           = nullif(trim(p_data ->> 'nomor_sip'), ''),
    sip_mulai           = v_mulai,
    sip_sampai          = v_sampai,
    ihs_practitioner_id = nullif(trim(p_data ->> 'ihs_practitioner_id'), ''),
    -- NIK berganti berarti pencarian sebelumnya menjawab tentang orang lain.
    -- Penandanya dinolkan supaya ia ikut dicari lagi pada tekan berikutnya,
    -- tanpa menunggu jeda 30 hari.
    ihs_dicari_pada     = case when p_data ? 'nik' and v_nik is distinct from nik
                               then null else ihs_dicari_pada end
   where id = p_id and company_id = v_co
  returning * into v_row;

  if not found then
    raise exception 'Tenaga kesehatan tidak ditemukan di fasilitas ini.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_co, 'perizinan.simpan', 'app_users', p_id::text,
    jsonb_build_object('nama', v_row.nama, 'sip_sampai', v_row.sip_sampai));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.simpan_perizinan(uuid, jsonb, uuid) from public, anon;
grant execute on function public.simpan_perizinan(uuid, jsonb, uuid) to authenticated;

-- `tenaga_kesehatan()` harus ikut membawa NIK, kalau tidak layarnya tidak bisa
-- menampilkan apa yang baru saja disimpannya sendiri.
--
-- **Definisinya disalin UTUH dari yang sedang berlaku, lalu ditambahi SATU
-- baris.** Bukan ditulis ulang dari ingatan. Menulis ulang adalah cara migrasi
-- 0035 menghilangkan `nilai_biaya` dari `v_antrean_hari_ini` dan mengosongkan
-- seluruh layar Kasir tanpa ada yang gagal saat migrasinya dijalankan. Yang
-- hampir hilang di sini: `status`, dan `sisa_hari` yang hampir berganti nama.

create or replace function public.tenaga_kesehatan(p_company uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_co  uuid := case when p_company is not null and v_adm
                     then p_company else public.auth_company_id() end;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', u.id, 'nama', u.nama, 'email', u.email, 'role', u.role,
             'status', u.status, 'spesialisasi', u.spesialisasi,
             'nik', u.nik,
             'nomor_str', u.nomor_str, 'str_sampai', u.str_sampai,
             'nomor_sip', u.nomor_sip,
             'sip_mulai', u.sip_mulai, 'sip_sampai', u.sip_sampai,
             'ihs_practitioner_id', u.ihs_practitioner_id,
             'sisa_hari', case when u.sip_sampai is null then null
                               else (u.sip_sampai - current_date) end,
             'str_sisa_hari', case when u.str_sampai is null then null
                                   else (u.str_sampai - current_date) end,
             'poli', coalesce((
               select jsonb_agg(c.nama order by c.nama)
                 from public.unit_doctors d
                 join public.clinic_units c on c.id = d.unit_id
                where d.company_id = v_co and lower(d.email) = lower(u.email)), '[]'::jsonb))
           order by u.role, u.nama)
      from public.app_users u
     where u.company_id = v_co
       and u.role in ('dokter', 'apoteker', 'asisten_apoteker', 'perawat', 'analis')), '[]'::jsonb);
end;
$$;

revoke all on function public.tenaga_kesehatan(uuid) from public, anon;
grant execute on function public.tenaga_kesehatan(uuid) to authenticated;
