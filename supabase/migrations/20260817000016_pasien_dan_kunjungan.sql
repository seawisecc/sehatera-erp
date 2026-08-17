-- ============================================================
-- 0016  Pasien dan kunjungan: fondasi modul klinik
-- ============================================================
--
-- Ini bagian pertama modul klinik, dan bentuknya menentukan sisanya. Yang
-- dipilih: KUNJUNGAN adalah tulang punggungnya, bukan satu modul lagi di
-- samping modul lain.
--
-- Alasannya bisa dihitung. Di klinik, satu pasien melewati enam langkah dalam
-- satu kedatangan: daftar, antre, periksa, resep, terima obat, bayar. Kalau
-- keenamnya jadi enam menu terpisah, tiap perpindahan menuntut orang mencari
-- ulang pasien yang sama. Untuk 40 pasien sehari itu 160 pencarian, dan tiap
-- pencarian adalah tempat seseorang bisa memilih baris yang salah. Untuk resep
-- obat, memilih baris yang salah bukan kesalahan administratif.
--
-- Jadi `visits` menyimpan KEADAAN, bukan sekadar catatan bahwa seseorang
-- pernah datang. Perpindahan keadaannya dijaga di database, bukan di layar:
-- layar bisa dilewati dengan memanggil API langsung, dan urutan langkah medis
-- bukan sesuatu yang boleh dilewati.
--
-- Yang SENGAJA belum ada di sini: rekam medis (SOAP dan tanda vital), e-resep,
-- dan pengiriman SatuSehat. Ketiganya menggantung pada kunjungan, jadi
-- kunjungannya harus benar lebih dulu. Menumpuk semuanya dalam satu migrasi
-- berarti tidak ada satu pun bagian yang sempat diperiksa sendiri.

-- ------------------------------------------------------------
-- 1. Pasien
-- ------------------------------------------------------------

create table if not exists public.patients (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  nomor_rm       text,
  nama           text not null,
  nik            text,
  tanggal_lahir  date,
  jenis_kelamin  text,
  alamat         text,
  telepon        text,
  gol_darah      text,
  alergi         text,
  penjamin       text not null default 'umum',
  nomor_penjamin text,
  catatan        text,
  created_at     timestamptz not null default now(),
  constraint patients_kelamin_check check (jenis_kelamin is null or jenis_kelamin in ('L', 'P')),
  constraint patients_penjamin_check check (penjamin in ('umum', 'bpjs', 'asuransi'))
);

create index if not exists idx_patients_company on public.patients (company_id, nama);
create unique index if not exists uq_patients_rm on public.patients (company_id, nomor_rm) where nomor_rm is not null;

-- Satu NIK satu rekam medis. Tanpa ini, pasien yang sama didaftarkan dua kali
-- akan punya dua riwayat, dan riwayat yang terbelah lebih berbahaya daripada
-- tidak ada riwayat sama sekali: dokter membaca separuh dan mengira itu
-- seluruhnya.
create unique index if not exists uq_patients_nik
  on public.patients (company_id, nik) where nik is not null and nik <> '';

comment on table public.patients is
  'Pasien per fasilitas. NIK dijaga unik: riwayat yang terbelah jadi dua rekam medis lebih berbahaya daripada tidak ada riwayat sama sekali.';

-- ------------------------------------------------------------
-- 2. Kunjungan
-- ------------------------------------------------------------

create table if not exists public.visits (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  patient_id     uuid not null references public.patients(id) on delete restrict,
  nomor          text,
  nomor_antre    text,
  tanggal        date not null default current_date,
  status         text not null default 'terdaftar',
  keluhan        text,
  penjamin       text not null default 'umum',
  petugas_daftar text,
  dokter_email   text,
  transaction_id uuid references public.transactions(id),
  catatan_batal  text,
  dibuka_pada    timestamptz not null default now(),
  ditutup_pada   timestamptz,
  constraint visits_status_check check (status in ('terdaftar', 'diperiksa', 'resep', 'obat', 'selesai', 'batal')),
  constraint visits_penjamin_check check (penjamin in ('umum', 'bpjs', 'asuransi'))
);

create index if not exists idx_visits_company_tgl on public.visits (company_id, tanggal desc, dibuka_pada);
create index if not exists idx_visits_patient on public.visits (patient_id, tanggal desc);
create index if not exists idx_visits_aktif on public.visits (company_id, status) where status not in ('selesai', 'batal');
create unique index if not exists uq_visits_nomor on public.visits (company_id, nomor) where nomor is not null;

-- Satu pasien tidak boleh punya dua kunjungan terbuka di hari yang sama.
-- Tanpa ini, menekan "Daftarkan" dua kali karena halaman terasa lambat
-- melahirkan dua antrean untuk orang yang sama, dan yang kedua akan dipanggil
-- ke ruang periksa yang sudah kosong.
create unique index if not exists uq_visits_terbuka
  on public.visits (company_id, patient_id, tanggal)
  where status not in ('selesai', 'batal');

comment on table public.visits is
  'Satu kedatangan pasien, beserta KEADAANNYA. Perpindahan keadaan dijaga di database karena urutan langkah medis bukan sesuatu yang boleh dilewati dengan memanggil API langsung.';

comment on column public.visits.status is
  'terdaftar > diperiksa > resep > obat > selesai. Boleh dibatalkan dari mana pun sebelum selesai. Tidak boleh melompat maju.';

-- ------------------------------------------------------------
-- 3. RLS dan pengisi company_id
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['patients', 'visits'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "tenant_all" on public.%I', t);
    execute format(
      'create policy "tenant_all" on public.%I for all to authenticated
         using (company_id = public.auth_company_id() or public.is_super_admin())
         with check (company_id = public.auth_company_id() or public.is_super_admin())', t);
    execute format('drop trigger if exists trg_set_company_id on public.%I', t);
    execute format('create trigger trg_set_company_id before insert on public.%I
                    for each row execute function public.set_company_id()', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 4. Mendaftarkan pasien
-- ------------------------------------------------------------

create or replace function public.simpan_pasien(
  p_id      uuid,
  p_data    jsonb
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := public.auth_company_id();
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
     where id = p_id and (public.is_super_admin() or company_id = v_company)
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

revoke all on function public.simpan_pasien(uuid, jsonb) from public, anon;
grant execute on function public.simpan_pasien(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. Membuka kunjungan
-- ------------------------------------------------------------

create or replace function public.daftar_kunjungan(
  p_patient  uuid,
  p_keluhan  text default null,
  p_penjamin text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := public.auth_company_id();
  v_pasien  record;
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

  -- Nomor antrean diulang tiap hari, dan dihitung dari kunjungan hari ini di
  -- fasilitas ini saja. Nomor yang tidak diulang membuat "A-1284" dipanggil di
  -- ruang tunggu, dan tidak ada yang tahu itu antrean ke berapa hari ini.
  select count(*) + 1 into v_urut from public.visits
   where company_id = v_company and tanggal = current_date;

  insert into public.visits (
    company_id, patient_id, nomor, nomor_antre, keluhan, penjamin, petugas_daftar)
  values (
    v_company, p_patient,
    public.next_doc_number(v_company, 'visits', 'nomor', 'KJG', to_char(current_date, 'YYYY')),
    'A-' || lpad(v_urut::text, 3, '0'),
    nullif(trim(p_keluhan), ''),
    coalesce(nullif(p_penjamin, ''), v_pasien.penjamin, 'umum'),
    lower(auth.jwt() ->> 'email'))
  returning * into v_row;

  perform public.catat_audit(v_company, 'kunjungan.dibuka', 'visits', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'antre', v_row.nomor_antre,
                       'pasien', v_pasien.nama, 'rm', v_pasien.nomor_rm));

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'Pasien ini sudah punya kunjungan yang belum selesai hari ini. Lanjutkan yang itu, jangan buat baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.daftar_kunjungan(uuid, text, text) from public, anon;
grant execute on function public.daftar_kunjungan(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 6. Memindahkan keadaan kunjungan
-- ------------------------------------------------------------

/**
 * Urutan langkahnya dijaga DI SINI, bukan di layar.
 *
 * Layar bisa dilewati: siapa pun yang bisa masuk bisa memanggil API ini
 * langsung. Untuk urutan yang cuma soal kerapian itu tidak penting, tapi
 * urutan di sini menyangkut siapa sudah diperiksa sebelum obatnya diserahkan.
 *
 * Boleh maju satu langkah, boleh mundur satu langkah (dokter yang keliru
 * menekan harus bisa membetulkannya sendiri, bukan memanggil admin), dan boleh
 * dibatalkan dari mana pun sebelum selesai. Yang tidak boleh: melompat.
 */
create or replace function public.ubah_status_kunjungan(
  p_visit  uuid,
  p_status text,
  p_alasan text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_urut   text[] := array['terdaftar', 'diperiksa', 'resep', 'obat', 'selesai'];
  v_dari   integer;
  v_ke     integer;
begin
  select * into v_visit from public.visits
   where id = p_visit and (public.is_super_admin() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_visit.status = p_status then
    return to_jsonb(v_visit);
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup.' using errcode = 'SH004';
  end if;

  if p_status = 'batal' then
    update public.visits
       set status = 'batal', ditutup_pada = now(),
           catatan_batal = nullif(trim(p_alasan), '')
     where id = p_visit;

    perform public.catat_audit(v_visit.company_id, 'kunjungan.dibatalkan', 'visits', p_visit::text,
      jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'alasan', p_alasan));

    return (select to_jsonb(v) from public.visits v where v.id = p_visit);
  end if;

  v_dari := array_position(v_urut, v_visit.status);
  v_ke   := array_position(v_urut, p_status);
  if v_ke is null then
    raise exception 'Keadaan kunjungan tidak dikenali.' using errcode = 'SH004';
  end if;
  if abs(v_ke - v_dari) > 1 then
    raise exception 'Kunjungan tidak bisa melompat dari % ke %. Lewati satu per satu.', v_visit.status, p_status
      using errcode = 'SH004';
  end if;

  update public.visits
     set status       = p_status,
         dokter_email = case when p_status = 'diperiksa' and dokter_email is null
                             then lower(auth.jwt() ->> 'email') else dokter_email end,
         ditutup_pada = case when p_status = 'selesai' then now() else null end
   where id = p_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.' || p_status, 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'ke', p_status));

  return (select to_jsonb(v) from public.visits v where v.id = p_visit);
end;
$$;

revoke all on function public.ubah_status_kunjungan(uuid, text, text) from public, anon;
grant execute on function public.ubah_status_kunjungan(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 7. Papan antrean hari ini
-- ------------------------------------------------------------

/**
 * Satu kueri untuk seluruh layar Kunjungan.
 *
 * Halaman ini dibuka sekali pagi hari dan tidak ditutup sampai praktik
 * selesai, lalu disegarkan berkali-kali. Menyusunnya dari tiga kueri terpisah
 * berarti tiga kali waktu tunggu untuk satu penyegaran, dan pada jaringan
 * klinik yang lambat selisih itu terasa.
 */
create or replace view public.v_antrean_hari_ini as
select
  v.id, v.company_id, v.nomor, v.nomor_antre, v.tanggal, v.status,
  v.keluhan, v.penjamin, v.dokter_email, v.dibuka_pada, v.ditutup_pada,
  p.id   as pasien_id,
  p.nomor_rm,
  p.nama as pasien_nama,
  p.tanggal_lahir,
  p.jenis_kelamin,
  p.alergi,
  p.telepon,
  case when p.tanggal_lahir is null then null
       else extract(year from age(current_date, p.tanggal_lahir))::integer end as umur
from public.visits v
join public.patients p on p.id = v.patient_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);

comment on view public.v_antrean_hari_ini is
  'Antrean hari ini beserta identitas pasiennya. security_invoker menyala supaya RLS pemanggilnya yang berlaku, bukan RLS pemilik view.';

revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
