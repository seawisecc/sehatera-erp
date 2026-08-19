-- ============================================================
-- 0063  Tarif dan paket pemeriksaan penunjang
-- ============================================================
--
-- Migrasi 0061 membuat permintaan pemeriksaan mengambil harga dari katalog
-- Layanan. Yang belum ada: cara memberi tahu aplikasi bahwa satu layanan
-- ADALAH pemeriksaan lab, dan parameter apa saja yang ada di dalamnya.
--
-- Dua akibatnya di lapangan, dan yang kedua yang paling memakan waktu.
--
-- 1. Kotak "ambil dari katalog" di layar dokter menampilkan SELURUH layanan,
--    termasuk jahit luka dan nebulisasi. Dokter yang mencari "Darah Lengkap"
--    menggulung melewati dua puluh tindakan yang tidak ada hubungannya.
-- 2. **Petugas lab mengetik ulang nama parameter, satuan, dan rentang rujukan
--    untuk setiap pasien.** Darah lengkap itu sepuluh baris. Sepuluh baris
--    dikali tiga puluh pasien sehari adalah pekerjaan mengetik yang tidak ada
--    gunanya, dan lebih buruk: rentang rujukan yang diketik ulang akan
--    berbeda-beda tergantung siapa yang jaga, sehingga penanda "tinggi" dan
--    "rendah" berhenti berarti apa pun.
--
-- Jadi paket pemeriksaan punya CETAKANNYA: parameter, satuan, dan rentang
-- rujukan disimpan sekali di katalog, lalu dituangkan ke formulir hasil.
-- Petugas lab tinggal mengetik angkanya.
--
-- **Rentang rujukan tetap bisa diubah per hasil.** Rentang bayi berbeda dari
-- dewasa, dan rentang hemoglobin perempuan berbeda dari laki-laki. Cetakan
-- adalah titik mulai, bukan palang.

alter table public.services
  add column if not exists jenis_penunjang text,
  add column if not exists kode_loinc      text;

alter table public.services drop constraint if exists services_jenis_penunjang_check;
alter table public.services add constraint services_jenis_penunjang_check
  check (jenis_penunjang is null or jenis_penunjang in ('lab', 'radiologi'));

comment on column public.services.jenis_penunjang is
  'Diisi kalau layanan ini adalah pemeriksaan penunjang. Kosong berarti tindakan biasa, dan itu bawaan yang benar untuk baris lama.';

create index if not exists idx_services_penunjang
  on public.services (company_id, jenis_penunjang) where jenis_penunjang is not null;

-- ------------------------------------------------------------
-- Cetakan parameter satu paket lab
-- ------------------------------------------------------------

create table if not exists public.service_lab_params (id uuid primary key default gen_random_uuid());
alter table public.service_lab_params
  add column if not exists company_id    uuid not null references public.companies(id) on delete cascade,
  add column if not exists service_id    uuid not null references public.services(id) on delete cascade,
  add column if not exists nama          text not null,
  add column if not exists kode_loinc    text,
  add column if not exists satuan        text,
  add column if not exists rujukan_bawah numeric,
  add column if not exists rujukan_atas  numeric,
  add column if not exists rujukan_teks  text,
  add column if not exists urutan        integer not null default 0,
  add column if not exists created_at    timestamptz not null default now();

comment on table public.service_lab_params is
  'Cetakan parameter satu paket lab. Dituangkan ke formulir hasil supaya petugas lab tinggal mengetik angkanya, dan supaya rentang rujukan tidak berbeda-beda tergantung siapa yang jaga.';

create index if not exists idx_lab_param_service on public.service_lab_params (service_id, urutan);

alter table public.service_lab_params enable row level security;
drop policy if exists "tenant_all" on public.service_lab_params;
create policy "tenant_all" on public.service_lab_params for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.service_lab_params;
create trigger trg_set_company_id before insert on public.service_lab_params
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- Katalog pemeriksaan, beserta cetakannya
-- ------------------------------------------------------------
create or replace function public.katalog_penunjang(p_jenis text default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_co uuid := public.auth_company_id();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', s.id, 'nama', s.nama, 'harga', s.harga,
             'jenis', s.jenis_penunjang, 'kode_loinc', s.kode_loinc,
             'kode_icd9', s.kode_icd9, 'deskripsi', s.deskripsi, 'status', s.status,
             'parameter', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'id', p.id, 'nama', p.nama, 'kode_loinc', p.kode_loinc,
                        'satuan', p.satuan, 'rujukan_bawah', p.rujukan_bawah,
                        'rujukan_atas', p.rujukan_atas, 'rujukan_teks', p.rujukan_teks)
                      order by p.urutan, p.nama)
                 from public.service_lab_params p where p.service_id = s.id), '[]'::jsonb))
           order by s.jenis_penunjang, s.nama)
      from public.services s
     where s.company_id = v_co
       and s.jenis_penunjang is not null
       and (p_jenis is null or s.jenis_penunjang = p_jenis)), '[]'::jsonb);
end;
$$;

revoke all on function public.katalog_penunjang(text) from public, anon;
grant execute on function public.katalog_penunjang(text) to authenticated;

-- ------------------------------------------------------------
-- Menyimpan satu paket pemeriksaan
-- ------------------------------------------------------------
/**
 * Parameternya ditulis ULANG seluruhnya, bukan ditambahkan.
 *
 * Alasannya sama seperti hasil lab di migrasi 0061: kalau ditambahkan,
 * menghapus satu parameter dari paket tidak mungkin dilakukan dari layar, dan
 * memperbaiki satu salah ketik meninggalkan dua baris untuk parameter yang
 * sama. Hasil yang SUDAH tercatat tidak ikut berubah: ia disimpan di
 * `lab_results`, bukan menunjuk ke cetakan ini.
 */
create or replace function public.simpan_tarif_penunjang(
  p_id        uuid,
  p_jenis     text,
  p_nama      text,
  p_harga     numeric,
  p_parameter jsonb default null,
  p_loinc     text default null,
  p_icd9      text default null,
  p_deskripsi text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_peran text := public.peran_saya();
  v_row   record;
  v_item  jsonb;
  v_i     integer := 0;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  -- Yang mengubah TARIF adalah yang bertanggung jawab atas uangnya, bukan
  -- petugas lab yang memakai daftarnya sehari-hari.
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak mengubah tarif pemeriksaan.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if p_jenis not in ('lab', 'radiologi') then
    raise exception 'Jenis pemeriksaan "%" tidak dikenali.', p_jenis using errcode = 'SH004';
  end if;
  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama pemeriksaan wajib diisi.' using errcode = 'SH004';
  end if;
  if coalesce(p_harga, 0) < 0 then
    raise exception 'Tarif tidak boleh minus.' using errcode = 'SH004';
  end if;

  if p_id is null then
    insert into public.services (company_id, nama, harga, deskripsi, status,
                                 jenis_penunjang, kode_loinc, kode_icd9)
    values (v_co, trim(p_nama), coalesce(p_harga, 0), nullif(trim(p_deskripsi), ''), 'aktif',
            p_jenis, nullif(trim(p_loinc), ''), nullif(trim(p_icd9), ''))
    returning * into v_row;
  else
    update public.services set
      nama            = trim(p_nama),
      harga           = coalesce(p_harga, 0),
      deskripsi       = nullif(trim(p_deskripsi), ''),
      jenis_penunjang = p_jenis,
      kode_loinc      = nullif(trim(p_loinc), ''),
      kode_icd9       = nullif(trim(p_icd9), '')
     where id = p_id and company_id = v_co
    returning * into v_row;
    if not found then
      raise exception 'Pemeriksaan tidak ditemukan di katalog fasilitas ini.' using errcode = 'SH004';
    end if;
  end if;

  if p_parameter is not null then
    if p_jenis <> 'lab' then
      raise exception 'Cetakan parameter hanya untuk pemeriksaan laboratorium. Radiologi dibaca naratif.'
        using errcode = 'SH004';
    end if;
    delete from public.service_lab_params where service_id = v_row.id;
    for v_item in select * from jsonb_array_elements(p_parameter) loop
      v_i := v_i + 1;
      if coalesce(trim(v_item ->> 'nama'), '') = '' then
        continue;
      end if;
      insert into public.service_lab_params (
        company_id, service_id, nama, kode_loinc, satuan,
        rujukan_bawah, rujukan_atas, rujukan_teks, urutan)
      values (
        v_co, v_row.id, trim(v_item ->> 'nama'),
        nullif(trim(v_item ->> 'kode_loinc'), ''),
        nullif(trim(v_item ->> 'satuan'), ''),
        nullif(v_item ->> 'rujukan_bawah', '')::numeric,
        nullif(v_item ->> 'rujukan_atas', '')::numeric,
        nullif(trim(v_item ->> 'rujukan_teks'), ''),
        v_i);
    end loop;
  end if;

  perform public.catat_audit(v_co, 'penunjang.tarif', 'services', v_row.id::text,
    jsonb_build_object('nama', v_row.nama, 'jenis', p_jenis, 'harga', v_row.harga,
                       'parameter', v_i));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.simpan_tarif_penunjang(uuid, text, text, numeric, jsonb, text, text, text)
  from public, anon;
grant execute on function public.simpan_tarif_penunjang(uuid, text, text, numeric, jsonb, text, text, text)
  to authenticated;

-- ------------------------------------------------------------
-- Cetakan ikut saat pemeriksaan diminta
-- ------------------------------------------------------------
/**
 * `penunjang_kunjungan()` dan antrean lab perlu tahu parameter apa yang harus
 * disiapkan. Disimpan sebagai CUPLIKAN di barisnya, bukan dibaca ulang dari
 * katalog saat hasilnya diisi.
 *
 * Alasannya sama dengan payload antrean kirim di 0056: kalau dibaca ulang,
 * paket yang tarifnya diubah bulan depan mengubah bentuk hasil pemeriksaan
 * yang sudah diminta minggu lalu, dan yang tercatat bukan lagi yang diminta.
 */
alter table public.visit_penunjang
  add column if not exists cetakan jsonb;

comment on column public.visit_penunjang.cetakan is
  'Cuplikan parameter paket saat pemeriksaan ini diminta. Bukan dibaca ulang dari katalog: paket yang diubah nanti tidak boleh mengubah bentuk pemeriksaan yang sudah diminta.';

create or replace function public.minta_penunjang(
  p_visit     uuid,
  p_jenis     text,
  p_nama      text,
  p_service   uuid default null,
  p_catatan   text default null,
  p_prioritas text default 'rutin',
  p_loinc     text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit   record;
  v_svc     record;
  v_charge  uuid;
  v_row     record;
  v_cetak   jsonb;
  v_email   text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  perform public.wajib_boleh('penunjang.minta');

  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, jadi tidak bisa ditambahi pemeriksaan.' using errcode = 'SH004';
  end if;
  if p_jenis not in ('lab', 'radiologi') then
    raise exception 'Jenis pemeriksaan "%" tidak dikenali.', p_jenis using errcode = 'SH004';
  end if;
  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama pemeriksaan wajib diisi.' using errcode = 'SH004';
  end if;

  if p_service is not null then
    select * into v_svc from public.services
     where id = p_service and company_id = v_visit.company_id;
    if not found then
      raise exception 'Layanan tidak ditemukan di katalog fasilitas ini.' using errcode = 'SH004';
    end if;

    insert into public.visit_charges (
      company_id, visit_id, jenis, unit_id, service_id, nama, jumlah, harga,
      kode_icd9, catatan, dicatat_oleh)
    values (
      v_visit.company_id, p_visit, 'penunjang', v_visit.unit_id, v_svc.id,
      trim(p_nama), 1, coalesce(v_svc.harga, 0), v_svc.kode_icd9,
      nullif(trim(p_catatan), ''), v_email)
    returning id into v_charge;

    select jsonb_agg(jsonb_build_object(
             'nama', p.nama, 'kode_loinc', p.kode_loinc, 'satuan', p.satuan,
             'rujukan_bawah', p.rujukan_bawah, 'rujukan_atas', p.rujukan_atas,
             'rujukan_teks', p.rujukan_teks) order by p.urutan, p.nama)
      into v_cetak
      from public.service_lab_params p where p.service_id = v_svc.id;
  end if;

  insert into public.visit_penunjang (
    company_id, visit_id, unit_id, jenis, service_id, charge_id, nama,
    kode_loinc, catatan_klinis, prioritas, cetakan, diminta_oleh)
  values (
    v_visit.company_id, p_visit, v_visit.unit_id, p_jenis, p_service, v_charge,
    trim(p_nama), coalesce(nullif(trim(p_loinc), ''), v_svc.kode_loinc),
    nullif(trim(p_catatan), ''),
    case when lower(coalesce(p_prioritas, 'rutin')) = 'cito' then 'cito' else 'rutin' end,
    v_cetak, v_email)
  returning * into v_row;

  perform public.catat_audit(v_visit.company_id, 'penunjang.diminta', 'visit_penunjang', v_row.id::text,
    jsonb_build_object('kunjungan', v_visit.nomor, 'jenis', p_jenis,
                       'nama', trim(p_nama), 'prioritas', v_row.prioritas));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.minta_penunjang(uuid, text, text, uuid, text, text, text) from public, anon;
grant execute on function public.minta_penunjang(uuid, text, text, uuid, text, text, text) to authenticated;

-- Antrean lab membawa cetakannya, supaya formulir hasil sudah terisi barisnya.
create or replace function public.antrean_penunjang(p_jenis text default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_co uuid := public.auth_company_id();
begin
  perform public.wajib_boleh('penunjang.baca');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id, 'jenis', p.jenis, 'nama', p.nama, 'status', p.status,
             'prioritas', p.prioritas, 'catatan_klinis', p.catatan_klinis,
             'diminta_oleh', p.diminta_oleh, 'diminta_pada', p.diminta_pada,
             'visit_id', p.visit_id, 'nomor_antre', v.nomor_antre,
             'pasien_nama', pa.nama, 'nomor_rm', pa.nomor_rm,
             'poli', u.nama, 'cetakan', coalesce(p.cetakan, '[]'::jsonb),
             'hasil', coalesce((select jsonb_agg(jsonb_build_object(
                                  'nama', l.nama, 'kode_loinc', l.kode_loinc, 'nilai', l.nilai,
                                  'satuan', l.satuan, 'rujukan_bawah', l.rujukan_bawah,
                                  'rujukan_atas', l.rujukan_atas, 'penanda', l.penanda)
                                order by l.urutan)
                                 from public.lab_results l where l.penunjang_id = p.id), '[]'::jsonb))
           order by case p.prioritas when 'cito' then 0 else 1 end, p.diminta_pada)
      from public.visit_penunjang p
      join public.visits v on v.id = p.visit_id
      join public.patients pa on pa.id = v.patient_id
      left join public.clinic_units u on u.id = p.unit_id
     where p.status in ('diminta', 'dikerjakan')
       and (public.boleh_admin_platform() or p.company_id = v_co)
       and (p_jenis is null or p.jenis = p_jenis)),
    '[]'::jsonb);
end;
$$;

revoke all on function public.antrean_penunjang(text) from public, anon, authenticated;
grant execute on function public.antrean_penunjang(text) to authenticated;
