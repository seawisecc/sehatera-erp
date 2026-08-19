-- ============================================================
-- 0048  Daftar asuransi, dan penjamin yang ikut ke kunjungan
-- ============================================================
--
-- `penjamin` sudah ada sejak migrasi 0016 dengan tiga nilai: umum, bpjs,
-- asuransi. Yang belum ada: KALAU asuransi, asuransi yang MANA.
--
-- Allianz, Prudential, Mandiri Inhealth dan seterusnya tidak dijadikan nilai
-- `penjamin` baru, dan itu keputusan yang perlu dibaca sebelum menambah
-- apa pun di sini. Tiap klinik bekerja sama dengan asuransi yang berbeda, dan
-- daftarnya berubah tiap kontrak diperbarui. Kalau dijadikan nilai status,
-- tiap klinik yang menambah rekanan harus menunggu migrasi baru dan
-- pengembangnya. Jadi kategorinya tetap tiga, dan penerbitnya jadi TABEL yang
-- diisi tiap klinik sendiri.
--
-- Pelajaran empat kali kena di project ini dipakai di sini: menambah nilai
-- status berarti memeriksa tiap tempat yang menyebut nilai lama. Yang tidak
-- jadi nilai status tidak menimbulkan pemeriksaan itu sama sekali.

create table if not exists public.insurers (id uuid primary key default gen_random_uuid());
alter table public.insurers
  add column if not exists company_id uuid not null references public.companies(id) on delete cascade,
  add column if not exists nama       text not null,
  add column if not exists kode       text,
  add column if not exists catatan    text,
  add column if not exists aktif      boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

comment on table public.insurers is
  'Penerbit asuransi yang bekerja sama dengan faskes ini: Allianz, Prudential, Mandiri Inhealth, dan seterusnya. Per faskes, karena rekanannya berbeda-beda.';

create unique index if not exists uq_insurer_nama
  on public.insurers (company_id, lower(nama));

alter table public.insurers enable row level security;
drop policy if exists "tenant_all" on public.insurers;
create policy "tenant_all" on public.insurers for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

-- Pengisi company_id dari sesi, sama seperti tabel lain (migrasi 0011).
drop trigger if exists trg_set_company_id on public.insurers;
create trigger trg_set_company_id before insert on public.insurers
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- Kunjungan membawa penjaminnya
-- ------------------------------------------------------------
-- `nomor_penjamin` ada di `patients` sejak 0016, tapi ditaruh juga di
-- kunjungan: nomor polis bisa berganti di tengah tahun, dan yang dipakai
-- menagih adalah nomor yang berlaku SAAT kunjungan itu, bukan yang terakhir
-- diketik di profil pasien.

alter table public.visits
  add column if not exists asuransi_id    uuid references public.insurers(id),
  add column if not exists nomor_penjamin text;

alter table public.patients
  add column if not exists asuransi_id uuid references public.insurers(id);

comment on column public.visits.asuransi_id is
  'Penerbit asuransi untuk kunjungan ini. Hanya berarti kalau penjamin = asuransi.';
comment on column public.visits.nomor_penjamin is
  'Nomor kartu/polis yang berlaku SAAT kunjungan ini, bukan yang terakhir tercatat di profil pasien.';

create index if not exists idx_visits_asuransi on public.visits (company_id, asuransi_id);

-- ------------------------------------------------------------
-- Pendaftaran menerima dokter, asuransi, dan nomor polis
-- ------------------------------------------------------------
-- Disalin dari migrasi 0022, ditambah tiga argumen di UJUNG supaya pemanggil
-- lama tetap jalan selama aplikasinya belum berangkat.

create or replace function public.daftar_kunjungan(
  p_patient  uuid,
  p_keluhan  text default null,
  p_penjamin text default null,
  p_unit     uuid default null,
  p_dokter   text default null,
  p_company  uuid default null,
  p_asuransi uuid default null,
  p_nomor_penjamin text default null
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
  v_pen     text;
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

  v_pen := coalesce(nullif(p_penjamin, ''), v_pasien.penjamin, 'umum');

  -- Asuransi yang dipilih harus milik faskes ini DAN masih aktif. Tanpa ini,
  -- id asuransi faskes lain bisa ditempelkan lewat panggilan langsung, dan
  -- tagihan pasien berangkat ke rekanan yang bukan rekanan klinik ini.
  if p_asuransi is not null then
    if v_pen <> 'asuransi' then
      raise exception 'Penerbit asuransi hanya berarti kalau penjaminnya asuransi.'
        using errcode = 'SH004';
    end if;
    if not exists (select 1 from public.insurers
                    where id = p_asuransi and company_id = v_company and aktif) then
      raise exception 'Asuransi itu tidak ada di daftar rekanan faskes ini.'
        using errcode = 'SH004';
    end if;
  end if;

  select count(*) + 1 into v_urut from public.visits
   where company_id = v_company
     and tanggal = current_date
     and unit_id is not distinct from p_unit;

  insert into public.visits (
    company_id, patient_id, nomor, nomor_antre, keluhan, penjamin, petugas_daftar,
    unit_id, poli, dokter_email, asuransi_id, nomor_penjamin)
  values (
    v_company, p_patient,
    public.next_doc_number(v_company, 'visits', 'nomor', 'KJG', to_char(current_date, 'YYYY')),
    v_awalan || '-' || lpad(v_urut::text, 3, '0'),
    nullif(trim(p_keluhan), ''),
    v_pen,
    coalesce(lower(auth.jwt() ->> 'email'), 'sistem'),
    p_unit,
    v_unit.nama,
    lower(nullif(trim(p_dokter), '')),
    p_asuransi,
    -- Nomor polis yang berlaku SAAT kunjungan ini. Kalau tidak diketik ulang,
    -- diambil dari profil pasien, tapi yang tersimpan di kunjungan tidak ikut
    -- berubah kalau profilnya disunting nanti.
    coalesce(nullif(trim(p_nomor_penjamin), ''), v_pasien.nomor_penjamin))
  returning * into v_row;

  perform public.catat_audit(v_company, 'kunjungan.dibuka', 'visits', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'antre', v_row.nomor_antre,
                       'pasien', v_pasien.nama, 'rm', v_pasien.nomor_rm,
                       'poli', v_row.poli, 'penjamin', v_row.penjamin));

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'Pasien ini sudah punya kunjungan yang belum selesai hari ini. Lanjutkan yang itu, jangan buat baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.daftar_kunjungan(uuid, text, text, uuid, text, uuid, uuid, text) from public, anon;
grant execute on function public.daftar_kunjungan(uuid, text, text, uuid, text, uuid, uuid, text) to authenticated;
