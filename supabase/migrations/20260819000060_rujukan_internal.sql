-- ============================================================
-- 0060  Rujukan internal: satu kunjungan, beberapa poli
-- ============================================================
--
-- Permintaan pemilik: pasien yang diperiksa dokter umum lalu dirujuk ke
-- spesialis di klinik yang sama, dalam satu hari.
--
-- **SATU kunjungan yang berpindah poli, bukan dua kunjungan.** Ini keputusan
-- yang paling menentukan bentuknya, dan alasannya ada tiga.
--
-- 1. Pasiennya membayar SEKALI, di ujung. Dua kunjungan berarti dua tagihan
--    dan dua kali antre di kasir untuk satu kedatangan, dan itu bukan yang
--    terjadi di loket mana pun.
-- 2. `uq_visits_terbuka` menahan satu pasien punya dua kunjungan terbuka di
--    hari yang sama. Aturan itu benar dan menahan pendaftaran ganda yang tidak
--    disengaja; melubanginya untuk rujukan berarti melubanginya untuk salah
--    ketik juga.
-- 3. Aturan "satu tagihan per kunjungan" dari migrasi 0024 tetap utuh.
--
-- Yang berubah karena itu: hal-hal yang selama ini SATU per kunjungan menjadi
-- satu per POLI di dalam kunjungan itu.
--
-- - **Catatan SOAP.** Dulu unik per kunjungan, jadi dokter kedua akan menimpa
--   tulisan dokter pertama. Sekarang unik per (kunjungan, poli): tiap dokter
--   menulis catatannya sendiri, dan yang sebelumnya tetap terbaca. Rekam medis
--   yang ditimpa menghapus jejak apa yang sebenarnya dilihat dokter pertama,
--   dan justru itu yang dicari kalau ada sengketa.
-- - **Tarif konsultasi.** Dulu unik per kunjungan supaya kunjungan yang mundur
--   lalu maju lagi di rel tidak menagih dua kali. Sekarang unik per (kunjungan,
--   jenis, poli): mundur-maju di poli yang sama tetap sekali, tapi konsultasi
--   spesialis memang ditagih tersendiri karena tarifnya memang berbeda.
--   Biaya administrasi TETAP sekali per kunjungan: yang didaftarkan cuma satu.
--
-- Diagnosis sengaja TIDAK dipecah per poli. Satu kunjungan tetap punya satu
-- diagnosis primer, dan spesialis yang menegakkan diagnosis yang lebih tepat
-- mengubah yang primer, bukan menambah primer kedua. Itu yang dituntut BPJS
-- dan SatuSehat.

-- ------------------------------------------------------------
-- 1. Jejak rujukan
-- ------------------------------------------------------------

create table if not exists public.visit_referrals (id uuid primary key default gen_random_uuid());
alter table public.visit_referrals
  add column if not exists company_id   uuid not null references public.companies(id) on delete cascade,
  add column if not exists visit_id     uuid not null references public.visits(id) on delete cascade,
  add column if not exists dari_unit    uuid references public.clinic_units(id),
  add column if not exists dari_dokter  text,
  add column if not exists ke_unit      uuid not null references public.clinic_units(id),
  add column if not exists ke_dokter    text,
  add column if not exists alasan       text not null,
  add column if not exists catatan      text,
  add column if not exists nomor_antre  text,
  add column if not exists dirujuk_oleh text,
  add column if not exists dirujuk_pada timestamptz not null default now();

comment on table public.visit_referrals is
  'Jejak perpindahan poli di dalam SATU kunjungan. Barisnya tidak pernah dihapus: yang dicari saat menelusuri kembali adalah siapa merujuk ke siapa dan kenapa.';
comment on column public.visit_referrals.alasan is
  'Wajib. Rujukan tanpa alasan tidak bisa dinilai siapa pun yang membacanya nanti, termasuk dokter yang menerimanya.';

create index if not exists idx_rujukan_visit on public.visit_referrals (visit_id, dirujuk_pada);

alter table public.visit_referrals enable row level security;
drop policy if exists "tenant_all" on public.visit_referrals;
create policy "tenant_all" on public.visit_referrals for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.visit_referrals;
create trigger trg_set_company_id before insert on public.visit_referrals
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 2. SOAP jadi satu per poli
-- ------------------------------------------------------------

alter table public.visit_notes
  add column if not exists unit_id uuid references public.clinic_units(id);

-- Baris lama diberi poli kunjungannya supaya indeks baru tidak menabrak
-- apa pun, dan supaya catatan lama tetap tampil sebagai catatan poli itu.
update public.visit_notes n
   set unit_id = v.unit_id
  from public.visits v
 where v.id = n.visit_id and n.unit_id is null and v.unit_id is not null;

drop index if exists public.uq_notes_visit;
-- `coalesce` supaya kunjungan tanpa poli (apotek, atau data lama) tetap
-- terjaga satu catatan. Tanpa itu, null tidak pernah sama dengan null dan
-- indeks uniknya diam-diam berhenti menjaga apa pun.
create unique index if not exists uq_notes_visit_unit
  on public.visit_notes (visit_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid));

comment on table public.visit_notes is
  'Catatan SOAP, satu per poli di dalam satu kunjungan. Pasien yang dirujuk internal punya catatan sendiri dari tiap dokter yang memeriksanya.';

-- ------------------------------------------------------------
-- 3. Tarif konsultasi jadi satu per poli
-- ------------------------------------------------------------

alter table public.visit_charges
  add column if not exists unit_id uuid references public.clinic_units(id);

update public.visit_charges c
   set unit_id = v.unit_id
  from public.visits v
 where v.id = c.visit_id and c.unit_id is null and c.jenis = 'konsultasi' and v.unit_id is not null;

drop index if exists public.uq_charge_sekali;

-- Administrasi tetap SEKALI per kunjungan: yang didaftarkan cuma satu, berapa
-- pun poli yang dilewati.
create unique index if not exists uq_charge_administrasi
  on public.visit_charges (visit_id)
  where jenis = 'administrasi';

-- Konsultasi sekali per POLI. Mundur-maju di rel pada poli yang sama tetap
-- tertahan, yang justru alasan indeks ini ada sejak 0024.
create unique index if not exists uq_charge_konsultasi_unit
  on public.visit_charges (visit_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where jenis = 'konsultasi';

-- Triggernya ikut membawa poli. Disalin dari 0024, ditambah satu kolom.
create or replace function public.tambah_tarif_konsultasi()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_unit record;
begin
  if new.status = 'diperiksa' and old.status is distinct from 'diperiksa'
     and new.unit_id is not null then
    select * into v_unit from public.clinic_units where id = new.unit_id;
    if found and coalesce(v_unit.tarif_konsultasi, 0) > 0 then
      insert into public.visit_charges (company_id, visit_id, jenis, unit_id, nama, jumlah, harga, dicatat_oleh)
      values (new.company_id, new.id, 'konsultasi', new.unit_id,
              'Konsultasi ' || v_unit.nama, 1, v_unit.tarif_konsultasi,
              coalesce(lower(auth.jwt() ->> 'email'), 'sistem'))
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tarif_konsultasi on public.visits;
create trigger trg_tarif_konsultasi
  after update of status on public.visits
  for each row execute function public.tambah_tarif_konsultasi();

-- ------------------------------------------------------------
-- 4. Merujuk
-- ------------------------------------------------------------
/**
 * Memindahkan kunjungan ke poli lain di klinik yang sama.
 *
 * Nomor antrean BARU diterbitkan untuk poli tujuan, dan kunjungannya kembali
 * ke `terdaftar`: pasiennya memang menunggu lagi, di ruang tunggu yang lain,
 * dan papan pengumuman harus menampilkannya di sana. Kunjungan yang tetap
 * berstatus `diperiksa` sesudah dirujuk akan hilang dari papan, dan pasiennya
 * duduk menunggu panggilan yang tidak akan pernah datang.
 *
 * Yang boleh merujuk cuma yang boleh menegakkan diagnosis. Rujukan adalah
 * keputusan klinis, bukan pemindahan antrean.
 */
create or replace function public.rujuk_internal(
  p_visit   uuid,
  p_ke_unit uuid,
  p_alasan  text,
  p_dokter  text default null,
  p_catatan text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_unit   record;
  v_awalan text;
  v_urut   integer;
  v_antre  text;
  v_row    record;
begin
  perform public.wajib_boleh('diagnosis.tulis');

  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, jadi tidak bisa dirujuk lagi.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan rujukan wajib ditulis. Dokter yang menerima harus tahu kenapa pasien ini dikirim kepadanya.'
      using errcode = 'SH004';
  end if;
  if v_visit.unit_id is not null and v_visit.unit_id = p_ke_unit then
    raise exception 'Poli tujuan sama dengan poli sekarang.' using errcode = 'SH004';
  end if;

  select * into v_unit from public.clinic_units
   where id = p_ke_unit and company_id = v_visit.company_id and aktif;
  if not found then
    raise exception 'Poli tujuan tidak ditemukan atau sudah tidak aktif.' using errcode = 'SH004';
  end if;

  -- Nomor antrean per poli, sama seperti pendaftaran: tiap pintu punya
  -- deretnya sendiri, kalau tidak "A-014" dipanggil dan tiga orang berdiri.
  v_awalan := upper(v_unit.kode);
  select coalesce(max(nullif(regexp_replace(nomor_antre, '^[A-Z]+-', ''), '')::integer), 0) + 1
    into v_urut
    from public.visits
   where company_id = v_visit.company_id and tanggal = v_visit.tanggal
     and nomor_antre like v_awalan || '-%';
  v_antre := v_awalan || '-' || lpad(v_urut::text, 3, '0');

  insert into public.visit_referrals (
    company_id, visit_id, dari_unit, dari_dokter, ke_unit, ke_dokter,
    alasan, catatan, nomor_antre, dirujuk_oleh)
  values (
    v_visit.company_id, p_visit, v_visit.unit_id, v_visit.dokter_email,
    p_ke_unit, nullif(trim(p_dokter), ''), trim(p_alasan), nullif(trim(p_catatan), ''),
    v_antre, coalesce(lower(auth.jwt() ->> 'email'), 'sistem'))
  returning * into v_row;

  -- Poli, dokter, nomor antrean, dan keadaan berpindah sekaligus. Panggilan
  -- lama dinolkan supaya papan tidak menampilkan pasien ini sebagai "sudah
  -- dipanggil" di poli yang baru.
  update public.visits
     set unit_id       = p_ke_unit,
         poli          = v_unit.nama,
         dokter_email  = coalesce(nullif(trim(p_dokter), ''), null),
         nomor_antre   = v_antre,
         status        = 'terdaftar',
         dipanggil_pada = null,
         jumlah_panggil = 0
   where id = p_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.rujuk_internal', 'visits', p_visit::text,
    jsonb_build_object('dari', v_visit.poli, 'ke', v_unit.nama,
                       'antre', v_antre, 'alasan', trim(p_alasan)));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.rujuk_internal(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.rujuk_internal(uuid, uuid, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 5. Rekam medis membawa catatan tiap poli
-- ------------------------------------------------------------
-- Disalin dari 0039. `soap` sekarang catatan poli yang SEDANG dibuka, dan
-- `soap_lain` catatan poli sebelumnya, terbaca tapi tidak bisa disunting
-- dokter yang sekarang.
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
    'soap',      (select to_jsonb(n) from public.visit_notes n
                   where n.visit_id = p_visit
                     and coalesce(n.unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
                       = coalesce(v_visit.unit_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    'soap_lain', coalesce((select jsonb_agg(jsonb_build_object(
                             'unit_id', n.unit_id, 'unit_nama', u.nama,
                             'subjektif', n.subjektif, 'objektif', n.objektif,
                             'asesmen', n.asesmen, 'plan', n.plan,
                             'dicatat_oleh', n.dicatat_oleh, 'dicatat_pada', n.dicatat_pada)
                             order by n.dicatat_pada)
                           from public.visit_notes n
                           left join public.clinic_units u on u.id = n.unit_id
                          where n.visit_id = p_visit
                            and coalesce(n.unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
                              is distinct from coalesce(v_visit.unit_id, '00000000-0000-0000-0000-000000000000'::uuid)),
                          '[]'::jsonb),
    'rujukan',   coalesce((select jsonb_agg(jsonb_build_object(
                             'dari', ud.nama, 'ke', uk.nama, 'dokter', r.ke_dokter,
                             'alasan', r.alasan, 'catatan', r.catatan,
                             'antre', r.nomor_antre, 'oleh', r.dirujuk_oleh, 'pada', r.dirujuk_pada)
                             order by r.dirujuk_pada)
                           from public.visit_referrals r
                           left join public.clinic_units ud on ud.id = r.dari_unit
                           left join public.clinic_units uk on uk.id = r.ke_unit
                          where r.visit_id = p_visit), '[]'::jsonb),
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

-- ------------------------------------------------------------
-- 6. Menyimpan SOAP mengikuti poli yang sedang memeriksa
-- ------------------------------------------------------------
-- WAJIB ikut di migrasi ini, bukan menyusul. `on conflict (visit_id)` menunjuk
-- indeks unik yang baru saja dibuang di atas; kalau fungsi ini tertinggal,
-- menyimpan rekam medis langsung gagal untuk SEMUA kunjungan, bukan cuma yang
-- dirujuk. Disalin dari migrasi 0039, yang berubah cuma bagian SOAP-nya.

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
    -- Catatan ditulis untuk POLI yang sedang memeriksa, bukan untuk
    -- kunjungannya. Kalau untuk kunjungan, dokter spesialis yang menerima
    -- rujukan akan menimpa tulisan dokter yang merujuk, dan yang hilang justru
    -- alasan pasien itu dikirim kepadanya.
    insert into public.visit_notes (
      company_id, visit_id, unit_id, subjektif, objektif, asesmen, plan, dicatat_oleh)
    values (
      v_visit.company_id, p_visit, v_visit.unit_id,
      nullif(trim(p_soap ->> 'subjektif'), ''),
      nullif(trim(p_soap ->> 'objektif'), ''),
      nullif(trim(p_soap ->> 'asesmen'), ''),
      nullif(trim(p_soap ->> 'plan'), ''),
      v_email)
    on conflict (visit_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid)) do update set
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
