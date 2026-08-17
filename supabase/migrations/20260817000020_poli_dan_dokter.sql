-- ============================================================
-- 0020  Poli, penugasan dokter, dan nomor antrean per poli
-- ============================================================
--
-- Sampai sekarang "poli" cuma teks bebas di kunjungan. Itu cukup untuk satu
-- ruang periksa, dan langsung roboh di dua: "Umum", "umum", dan "Poli Umum"
-- jadi tiga poli berbeda di laporan, dan tidak ada yang bisa menghitung berapa
-- pasien poli gigi bulan lalu.
--
-- Nomor antreannya juga salah bentuk. Sekarang semua kunjungan berbagi satu
-- deret A-001, A-002, dan seterusnya. Di klinik dengan tiga ruang periksa itu
-- berarti "A-014" dipanggil dan tiga orang berdiri. Nomor antrean gunanya
-- memanggil satu orang ke satu pintu, jadi deretnya harus per pintu.
--
-- Sekalian memperbaiki satu kesalahan saya sendiri: peran dokter, perawat, dan
-- pendaftaran sudah saya pasang di pemilih peran, tapi batasan di tabelnya
-- masih menolak ketiganya. Tidak ada yang akan menemukan itu sampai seseorang
-- benar-benar mencoba membuat akun dokter, dan saat itu ia sudah mengetik
-- semuanya dan tinggal menekan simpan.

-- ------------------------------------------------------------
-- 1. Peran klinik diterima tabelnya
-- ------------------------------------------------------------

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users add constraint app_users_role_check
  check (role in ('pemilik', 'admin', 'apoteker', 'asisten_apoteker', 'kasir',
                  'dokter', 'perawat', 'pendaftaran'));

-- ------------------------------------------------------------
-- 2. Poli
-- ------------------------------------------------------------

create table if not exists public.clinic_units (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  nama              text not null,
  kode              text not null,
  kode_bpjs         text,
  tarif_konsultasi  numeric(14,2) not null default 0,
  urutan            integer not null default 0,
  aktif             boolean not null default true,
  created_at        timestamptz not null default now(),
  -- Awalan antrean: satu sampai tiga huruf. Lebih panjang tidak terbaca dari
  -- kursi belakang ruang tunggu, dan itu satu-satunya tempat nomor ini dibaca.
  constraint unit_kode_check check (kode ~ '^[A-Z]{1,3}$')
);

create unique index if not exists uq_unit_nama on public.clinic_units (company_id, lower(nama));
create unique index if not exists uq_unit_kode on public.clinic_units (company_id, upper(kode));

comment on table public.clinic_units is
  'Poli atau unit layanan. Kodenya jadi awalan nomor antrean, supaya tiap pintu punya deret sendiri.';
comment on column public.clinic_units.kode_bpjs is
  'Kode poli di BPJS P-Care. Berbeda dari kode antrean, dan tidak semua poli punya.';

/**
 * Dokter yang bertugas di satu poli.
 *
 * Tabel tersendiri, bukan satu kolom di app_users, karena di klinik kecil satu
 * dokter umum sering merangkap poli KIA atau lansia. Memaksanya jadi satu poli
 * berarti orang akan mengisi yang bukan sebenarnya, dan data yang diisi asal
 * lebih buruk daripada data yang kosong.
 */
create table if not exists public.unit_doctors (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id    uuid not null references public.clinic_units(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_unit_doctor on public.unit_doctors (unit_id, lower(email));
create index if not exists idx_unit_doctor_email on public.unit_doctors (company_id, lower(email));

alter table public.visits
  add column if not exists unit_id uuid references public.clinic_units(id);

create index if not exists idx_visits_unit on public.visits (company_id, tanggal, unit_id);

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['clinic_units', 'unit_doctors'] loop
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
-- 4. Mengelola poli
-- ------------------------------------------------------------

create or replace function public.simpan_poli(p_id uuid, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := coalesce(public.auth_company_id(), (p_data ->> 'company_id')::uuid);
  v_kode    text := upper(trim(coalesce(p_data ->> 'kode', '')));
  v_nama    text := trim(coalesce(p_data ->> 'nama', ''));
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if v_nama = '' then
    raise exception 'Nama poli tidak boleh kosong.' using errcode = 'SH004';
  end if;
  if v_kode !~ '^[A-Z]{1,3}$' then
    raise exception 'Kode antrean harus satu sampai tiga huruf, misalnya U untuk Umum atau G untuk Gigi.'
      using errcode = 'SH004';
  end if;

  if p_id is null then
    insert into public.clinic_units (company_id, nama, kode, kode_bpjs, tarif_konsultasi, urutan)
    values (v_company, v_nama, v_kode,
            nullif(trim(p_data ->> 'kode_bpjs'), ''),
            coalesce(nullif(p_data ->> 'tarif_konsultasi', '')::numeric, 0),
            coalesce(nullif(p_data ->> 'urutan', '')::integer,
                     (select coalesce(max(urutan), 0) + 1 from public.clinic_units where company_id = v_company)))
    returning * into v_row;
  else
    update public.clinic_units set
      nama             = v_nama,
      kode             = v_kode,
      kode_bpjs        = nullif(trim(p_data ->> 'kode_bpjs'), ''),
      tarif_konsultasi = coalesce(nullif(p_data ->> 'tarif_konsultasi', '')::numeric, tarif_konsultasi),
      urutan           = coalesce(nullif(p_data ->> 'urutan', '')::integer, urutan),
      aktif            = coalesce((p_data ->> 'aktif')::boolean, aktif)
     where id = p_id
       and (public.boleh_admin_platform() or company_id = public.auth_company_id())
    returning * into v_row;
    if not found then
      raise exception 'Poli tidak ditemukan.' using errcode = 'SH004';
    end if;
  end if;

  perform public.catat_audit(v_row.company_id,
    case when p_id is null then 'poli.dibuat' else 'poli.diubah' end,
    'clinic_units', v_row.id::text, jsonb_build_object('nama', v_row.nama, 'kode', v_row.kode));

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'Sudah ada poli dengan nama atau kode antrean yang sama.' using errcode = 'SH004';
end;
$$;

revoke all on function public.simpan_poli(uuid, jsonb) from public, anon;
grant execute on function public.simpan_poli(uuid, jsonb) to authenticated;

/**
 * Poli dinonaktifkan, tidak dihapus.
 *
 * Kunjungan tahun lalu menunjuk ke poli ini. Menghapus barisnya membuat laporan
 * tahun lalu kehilangan nama polinya, dan laporan yang berubah sesudah dicetak
 * adalah laporan yang tidak bisa dipakai untuk apa pun.
 */
create or replace function public.nonaktifkan_poli(p_id uuid, p_aktif boolean default false)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  update public.clinic_units set aktif = p_aktif
   where id = p_id
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
  returning * into v_row;
  if not found then
    raise exception 'Poli tidak ditemukan.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_row.company_id, 'poli.status', 'clinic_units', p_id::text,
    jsonb_build_object('nama', v_row.nama, 'aktif', p_aktif));
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.nonaktifkan_poli(uuid, boolean) from public, anon;
grant execute on function public.nonaktifkan_poli(uuid, boolean) to authenticated;

create or replace function public.set_dokter_poli(p_unit uuid, p_emails jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_unit record;
  v_e    text;
begin
  select * into v_unit from public.clinic_units
   where id = p_unit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Poli tidak ditemukan.' using errcode = 'SH004';
  end if;

  delete from public.unit_doctors where unit_id = p_unit;

  for v_e in select jsonb_array_elements_text(coalesce(p_emails, '[]'::jsonb)) loop
    if coalesce(trim(v_e), '') = '' then continue; end if;
    insert into public.unit_doctors (company_id, unit_id, email)
    values (v_unit.company_id, p_unit, lower(trim(v_e)))
    on conflict do nothing;
  end loop;

  perform public.catat_audit(v_unit.company_id, 'poli.dokter', 'clinic_units', p_unit::text,
    jsonb_build_object('nama', v_unit.nama, 'jumlah', coalesce(jsonb_array_length(p_emails), 0)));

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.set_dokter_poli(uuid, jsonb) from public, anon;
grant execute on function public.set_dokter_poli(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. Pendaftaran kunjungan: nomor antrean per poli
-- ------------------------------------------------------------

-- Yang lama dibuang, tidak disimpan sebagai pembungkus. Dua fungsi bernama sama
-- dengan jumlah argumen berbeda berarti satu panggilan yang lupa satu argumen
-- diam-diam memilih fungsi yang salah, dan itu jenis kesalahan yang tidak
-- memberi pesan apa pun.
drop function if exists public.daftar_kunjungan(uuid, text, text);

create or replace function public.daftar_kunjungan(
  p_patient  uuid,
  p_keluhan  text default null,
  p_penjamin text default null,
  p_unit     uuid default null,
  p_dokter   text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := public.auth_company_id();
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

  -- Deretnya per poli dan per hari. Satu deret bersama membuat "A-014"
  -- dipanggil dan tiga orang berdiri, masing-masing dari ruang tunggu yang
  -- berbeda. Fasilitas yang belum punya poli tetap memakai deret 'A' seperti
  -- sebelumnya, jadi apotek dan klinik satu ruang tidak berubah apa-apa.
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
    lower(auth.jwt() ->> 'email'),
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

revoke all on function public.daftar_kunjungan(uuid, text, text, uuid, text) from public, anon;
grant execute on function public.daftar_kunjungan(uuid, text, text, uuid, text) to authenticated;

/**
 * Menetapkan dokter pemeriksa.
 *
 * Terpisah dari pendaftaran karena urutannya memang begitu: yang mendaftar tahu
 * poli tujuannya, belum tentu tahu dokter mana yang akan memeriksa. Dokter yang
 * dipilih tidak wajib terdaftar di poli itu: di klinik kecil dokter saling
 * menggantikan, dan menolaknya berarti menahan pasien karena urusan tabel.
 */
create or replace function public.set_dokter_kunjungan(p_visit uuid, p_email text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  update public.visits set dokter_email = lower(nullif(trim(p_email), ''))
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
     and status not in ('selesai', 'batal')
  returning * into v_row;
  if not found then
    raise exception 'Kunjungan tidak ditemukan atau sudah ditutup.' using errcode = 'SH004';
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.set_dokter_kunjungan(uuid, text) from public, anon;
grant execute on function public.set_dokter_kunjungan(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 6. Antrean membawa nama polinya
-- ------------------------------------------------------------

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
       else extract(year from age(current_date, p.tanggal_lahir))::integer end as umur,
  v.jenis_kunjungan,
  v.poli,
  v.no_rujukan,
  v.kesadaran,
  v.status_pulang,
  v.ihs_encounter_id,
  p.ihs_id as pasien_ihs_id,
  exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_catatan,
  (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::integer as jumlah_diagnosis,
  exists (select 1 from public.visit_vitals t where t.visit_id = v.id) as ada_vital,
  v.unit_id,
  u.nama as unit_nama,
  u.kode as unit_kode
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
