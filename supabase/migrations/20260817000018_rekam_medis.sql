-- ============================================================
-- 0018  Rekam medis: SOAP, tanda vital, dan diagnosis
-- ============================================================
--
-- Bentuk tabel di sini SENGAJA mengikuti syarat SatuSehat dan BPJS sejak
-- sekarang, meskipun pengirimannya baru dibangun nanti. Alasannya: menambah
-- kolom kosong belakangan itu murah, tapi menyimpan hal yang salah bentuknya
-- itu mahal, dan yang paling mahal adalah data yang terlanjur terkumpul
-- setahun dalam bentuk yang tidak bisa dikirim.
--
-- Yang dituntut kedua sistem itu, dan bagaimana ia dipenuhi di sini:
--
-- SATUSEHAT (FHIR R4)
--   · Observation untuk tanda vital, tiap jenis punya kode LOINC sendiri. Jadi
--     tanda vital disimpan sebagai KOLOM BERJENIS, bukan satu kotak catatan.
--     Teks bebas "TD 120/80, nadi 88" tidak bisa dipetakan ke Observation
--     tanpa menebak, dan menebak data medis bukan pilihan.
--   · Condition untuk diagnosis, wajib berkode ICD-10. Jadi diagnosis punya
--     barisnya sendiri dengan kolom kode, bukan menumpang di teks asesmen.
--   · Encounter wajib membawa statusHistory: tiap perpindahan keadaan beserta
--     waktunya, bukan cuma keadaan terakhir. Karena itu ada `visit_status_log`,
--     dan mesin keadaan di migrasi 0016 dipasangi trigger yang mengisinya.
--   · Tiap Patient, Practitioner, dan Encounter punya IHS id dari SatuSehat.
--     Kolomnya disiapkan sekarang supaya nomor yang sudah didapat tidak perlu
--     dicari ulang tiap kali mengirim.
--
-- BPJS P-CARE (FKTP)
--   · Kunjungan menuntut kesadaran, tanda vital, keluhan, terapi, diagnosis
--     ICD-10, dan status pulang. Kesadaran dan status pulang ikut ke `visits`;
--     sisanya sudah tertampung di atas.
--   · Kunjungan rujukan menuntut nomor rujukan. Ikut ke `visits`.
--
-- Satu hal lagi yang tidak datang dari kedua sistem itu, melainkan dari
-- praktik: rekam medis yang sudah ditutup TIDAK ditulis ulang, melainkan
-- ditambahi adendum. Itu ditegakkan di sini, bukan diserahkan ke kesopanan.

-- ------------------------------------------------------------
-- 1. Kolom penghubung ke sistem luar
-- ------------------------------------------------------------

alter table public.patients
  add column if not exists ihs_id text;
comment on column public.patients.ihs_id is
  'Nomor IHS pasien dari SatuSehat, hasil pencocokan NIK. Disimpan supaya tidak dicari ulang tiap pengiriman.';

alter table public.app_users
  add column if not exists nik    text,
  add column if not exists ihs_id text,
  add column if not exists sip    text;
comment on column public.app_users.ihs_id is
  'Nomor IHS tenaga kesehatan dari SatuSehat. Encounter menolak practitioner tanpa ini.';

alter table public.settings
  add column if not exists ihs_organization_id text,
  add column if not exists ihs_location_id     text,
  add column if not exists kode_faskes_bpjs    text;

alter table public.visits
  add column if not exists ihs_encounter_id text,
  add column if not exists jenis_kunjungan  text not null default 'sakit',
  add column if not exists poli             text,
  add column if not exists no_rujukan       text,
  add column if not exists kesadaran        text,
  add column if not exists status_pulang    text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'visits_jenis_check') then
    alter table public.visits add constraint visits_jenis_check
      check (jenis_kunjungan in ('sakit', 'sehat', 'kia', 'promotif'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'visits_pulang_check') then
    alter table public.visits add constraint visits_pulang_check
      check (status_pulang is null or status_pulang in ('berobat_jalan', 'rujuk', 'rawat_inap', 'meninggal'));
  end if;
end $$;

comment on column public.visits.kesadaran is
  'Tingkat kesadaran (compos mentis, somnolen, sopor, coma). Diminta BPJS P-Care pada tiap kunjungan.';
comment on column public.visits.status_pulang is
  'Diminta BPJS P-Care saat kunjungan ditutup, dan jadi Encounter.hospitalization.dischargeDisposition di SatuSehat.';

-- ------------------------------------------------------------
-- 2. Riwayat perpindahan keadaan
-- ------------------------------------------------------------

create table if not exists public.visit_status_log (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  visit_id   uuid not null references public.visits(id) on delete cascade,
  dari       text,
  ke         text not null,
  pada       timestamptz not null default now(),
  oleh       text
);

create index if not exists idx_status_log_visit on public.visit_status_log (visit_id, pada);

comment on table public.visit_status_log is
  'Riwayat keadaan kunjungan. Bukan kemewahan: Encounter SatuSehat mewajibkan statusHistory, dan keadaan terakhir saja tidak cukup untuk menyusunnya.';

/**
 * Mencatat tiap perpindahan keadaan.
 *
 * Dipasang sebagai TRIGGER, bukan dipanggil dari dalam `ubah_status_kunjungan`.
 * Bedanya penting: trigger juga menangkap perubahan yang terjadi lewat jalur
 * lain, termasuk perbaikan tangan lewat SQL. Riwayat yang bisa dilewati dengan
 * cara tidak lewat fungsinya bukan riwayat.
 */
create or replace function public.catat_status_kunjungan()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.visit_status_log (company_id, visit_id, dari, ke, oleh)
    values (new.company_id, new.id, null, new.status,
            coalesce(lower(auth.jwt() ->> 'email'), 'sistem'));
  elsif new.status is distinct from old.status then
    insert into public.visit_status_log (company_id, visit_id, dari, ke, oleh)
    values (new.company_id, new.id, old.status, new.status,
            coalesce(lower(auth.jwt() ->> 'email'), 'sistem'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_catat_status on public.visits;
create trigger trg_catat_status
  after insert or update of status on public.visits
  for each row execute function public.catat_status_kunjungan();

-- ------------------------------------------------------------
-- 3. Tanda vital
-- ------------------------------------------------------------

/**
 * Tanda vital sebagai kolom berjenis, bukan catatan bebas.
 *
 * Tiap kolom di sini punya pasangan kode LOINC di SatuSehat, dan pasangan
 * kolom di BPJS P-Care. Menyimpannya sebagai satu kotak teks berarti setiap
 * pengiriman harus menebak angka mana yang sistole, dan menebak data medis
 * bukan pilihan.
 *
 * Boleh lebih dari satu baris per kunjungan: tanda vital diukur ulang, dan
 * yang diukur ulang biasanya justru yang penting.
 */
create table if not exists public.visit_vitals (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  visit_id     uuid not null references public.visits(id) on delete cascade,
  sistole      integer,   -- LOINC 8480-6, mmHg
  diastole     integer,   -- LOINC 8462-4, mmHg
  nadi         integer,   -- LOINC 8867-4, /menit
  napas        integer,   -- LOINC 9279-1, /menit
  suhu         numeric(4,1), -- LOINC 8310-5, derajat C
  saturasi     integer,   -- LOINC 59408-5, %
  berat        numeric(5,2), -- LOINC 29463-7, kg
  tinggi       numeric(5,1), -- LOINC 8302-2, cm
  lingkar_perut numeric(5,1),
  dicatat_oleh text,
  dicatat_pada timestamptz not null default now(),
  constraint vitals_masuk_akal check (
    (sistole  is null or sistole  between 40 and 300) and
    (diastole is null or diastole between 20 and 200) and
    (nadi     is null or nadi     between 20 and 250) and
    (napas    is null or napas    between 4  and 90)  and
    (suhu     is null or suhu     between 25 and 45)  and
    (saturasi is null or saturasi between 30 and 100) and
    (berat    is null or berat    between 0.3 and 400) and
    (tinggi   is null or tinggi   between 20 and 260)
  )
);

create index if not exists idx_vitals_visit on public.visit_vitals (visit_id, dicatat_pada desc);

comment on constraint vitals_masuk_akal on public.visit_vitals is
  'Batas kewajaran, bukan batas medis. Tugasnya menangkap salah ketik (suhu 368 karena titiknya lupa), bukan menghakimi keadaan pasien.';

-- ------------------------------------------------------------
-- 4. Catatan SOAP
-- ------------------------------------------------------------

create table if not exists public.visit_notes (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  visit_id     uuid not null references public.visits(id) on delete cascade,
  subjektif    text,
  objektif     text,
  asesmen      text,
  plan         text,
  dicatat_oleh text,
  dicatat_pada timestamptz not null default now(),
  diubah_pada  timestamptz
);

create unique index if not exists uq_notes_visit on public.visit_notes (visit_id);

comment on table public.visit_notes is
  'Catatan SOAP satu kunjungan. Sesudah kunjungannya ditutup, isinya tidak bisa diubah lagi; koreksi ditulis sebagai adendum.';

create table if not exists public.visit_addenda (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  visit_id     uuid not null references public.visits(id) on delete cascade,
  isi          text not null,
  ditulis_oleh text,
  ditulis_pada timestamptz not null default now()
);

create index if not exists idx_adenda_visit on public.visit_addenda (visit_id, ditulis_pada);

comment on table public.visit_addenda is
  'Koreksi atas rekam medis yang sudah ditutup. Rekam medis yang ditulis ulang menghapus jejak apa yang sebenarnya dilihat dokter saat itu, dan justru itu yang dicari kalau ada sengketa.';

-- ------------------------------------------------------------
-- 5. Diagnosis
-- ------------------------------------------------------------

create table if not exists public.visit_diagnoses (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  visit_id     uuid not null references public.visits(id) on delete cascade,
  kode_icd10   text not null,
  nama         text not null,
  tipe         text not null default 'sekunder',
  catatan      text,
  dicatat_oleh text,
  dicatat_pada timestamptz not null default now(),
  constraint diagnosa_tipe_check check (tipe in ('primer', 'sekunder')),
  -- Bentuk kode ICD-10: satu huruf, dua angka, boleh diikuti titik dan satu
  -- sampai dua angka. Ini penyaring BENTUK, bukan penyaring kebenaran: kode
  -- yang bentuknya benar tapi tidak ada di ICD-10 tetap lolos di sini dan baru
  -- ditolak SatuSehat. Yang ditangkap di sini adalah salah ketik.
  constraint diagnosa_kode_check check (kode_icd10 ~ '^[A-Z][0-9]{2}(\.[0-9]{1,2})?$')
);

create index if not exists idx_diagnosa_visit on public.visit_diagnoses (visit_id);

-- Satu kunjungan hanya boleh punya SATU diagnosis primer. BPJS dan SatuSehat
-- sama-sama menolak yang lebih dari satu, dan menolaknya di sini jauh lebih
-- murah daripada menemukannya saat pengiriman gagal sebulan kemudian.
create unique index if not exists uq_diagnosa_primer
  on public.visit_diagnoses (visit_id) where tipe = 'primer';

create unique index if not exists uq_diagnosa_kode
  on public.visit_diagnoses (visit_id, kode_icd10);

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['visit_status_log', 'visit_vitals', 'visit_notes',
                           'visit_addenda', 'visit_diagnoses'] loop
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
-- 7. Menyimpan rekam medis
-- ------------------------------------------------------------

/**
 * Menyimpan SOAP, tanda vital, dan diagnosis dalam SATU transaksi.
 *
 * Tiga tabel yang disimpan terpisah dari peramban berarti tanda vital bisa
 * tersimpan sementara diagnosisnya gagal, dan kunjungan yang punya tekanan
 * darah tapi tanpa diagnosis akan lolos ke pengiriman BPJS lalu ditolak di
 * sana, sebulan kemudian, tanpa ada yang tahu kenapa.
 *
 * Rekam medis kunjungan yang SUDAH DITUTUP tidak bisa diubah lewat fungsi ini.
 * Rekam medis yang ditulis ulang menghapus jejak apa yang sebenarnya dilihat
 * dokter saat itu, dan justru itu yang dicari kalau ada sengketa.
 */
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

revoke all on function public.simpan_rekam_medis(uuid, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.simpan_rekam_medis(uuid, jsonb, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.tambah_adendum(p_visit uuid, p_isi text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_row   record;
begin
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

revoke all on function public.tambah_adendum(uuid, text) from public, anon;
grant execute on function public.tambah_adendum(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 8. Penjaga saat kunjungan ditutup
-- ------------------------------------------------------------

/**
 * Kunjungan tidak bisa ditutup tanpa diagnosis.
 *
 * Ini bukan kerewelan administratif. Kunjungan tanpa diagnosis akan ditolak
 * BPJS dan SatuSehat, dan penolakannya datang berminggu-minggu kemudian, saat
 * pasiennya sudah pulang dan tidak ada yang ingat apa yang terjadi. Menahannya
 * di sini berarti yang perlu diperbaiki diperbaiki selagi orangnya masih ada
 * di depan meja.
 *
 * Kunjungan yang DIBATALKAN tidak terkena aturan ini: pasien yang pulang
 * sebelum diperiksa memang tidak punya diagnosis.
 */
create or replace function public.wajib_diagnosis_sebelum_tutup()
returns trigger
language plpgsql set search_path = public, pg_temp
as $$
begin
  if new.status = 'selesai' and old.status <> 'selesai' then
    if not exists (select 1 from public.visit_diagnoses where visit_id = new.id) then
      raise exception 'Kunjungan belum punya diagnosis. Isi diagnosis ICD-10 dulu sebelum menutupnya, karena BPJS dan SatuSehat akan menolaknya tanpa itu.'
        using errcode = 'SH004';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wajib_diagnosis on public.visits;
create trigger trg_wajib_diagnosis
  before update of status on public.visits
  for each row execute function public.wajib_diagnosis_sebelum_tutup();

-- ------------------------------------------------------------
-- 9. Satu kueri untuk seluruh rekam medis satu kunjungan
-- ------------------------------------------------------------

create or replace function public.rekam_medis(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_visit record;
begin
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

revoke all on function public.rekam_medis(uuid) from public, anon;
grant execute on function public.rekam_medis(uuid) to authenticated;
