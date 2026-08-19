-- ============================================================
-- 0054  Reservasi: jadwal praktik, kuota per sesi, dan pembatalan
-- ============================================================
--
-- Permintaan kelima tahap 8. Modul baru, bukan penyempurnaan, dan ia berdiri
-- di atas poli serta dokter yang sudah ada sejak migrasi 0020.
--
-- Tiga keputusan bentuk yang perlu dibaca sebelum menambah apa pun di sini.
--
-- 1. **Reservasi TIDAK menuntut pasien yang sudah terdaftar.** Yang menelepon
--    besok pagi belum tentu pernah datang, dan memaksa membuat rekam medis
--    lebih dulu berarti klinik mengumpulkan nomor RM untuk orang yang mungkin
--    tidak jadi datang. Reservasi adalah JANJI DATANG, bukan rekam medis.
--    Jadi `patient_id` boleh kosong, `nama` dan `telepon` wajib, dan
--    pencocokan ke pasien terjadi saat orangnya benar-benar tiba.
--
-- 2. **Kuota ditegakkan di database.** Alasannya sama seperti kuota paket di
--    migrasi 0003: dua petugas yang menekan Simpan pada detik yang sama akan
--    dua-duanya melihat "masih ada sisa" kalau yang menghitung layarnya. Yang
--    dihitung adalah reservasi berstatus `menunggu` pada sesi itu, dan
--    perhitungannya mengunci barisnya lebih dulu.
--
-- 3. **Jadwal praktik berbentuk SESI, bukan jam janji.** Klinik pratama tidak
--    bekerja dengan slot lima belas menit: pasien datang di rentang jam
--    praktik dan dilayani berurutan. Memaksa jam pasti berarti membuat janji
--    yang tidak pernah ditepati, dan pasien yang datang tepat waktu tetap
--    menunggu di belakang tiga orang. Yang dijanjikan adalah SESI dan URUTAN
--    di dalamnya, dan itu yang memang bisa ditepati.

-- ------------------------------------------------------------
-- 1. Jadwal praktik
-- ------------------------------------------------------------

create table if not exists public.doctor_schedules (id uuid primary key default gen_random_uuid());
alter table public.doctor_schedules
  add column if not exists company_id  uuid not null references public.companies(id) on delete cascade,
  add column if not exists unit_id     uuid not null references public.clinic_units(id) on delete cascade,
  add column if not exists dokter_email text,
  add column if not exists hari        smallint not null,
  add column if not exists jam_mulai   time not null,
  add column if not exists jam_selesai time not null,
  add column if not exists kuota       integer not null default 0,
  add column if not exists aktif       boolean not null default true,
  add column if not exists created_at  timestamptz not null default now();

alter table public.doctor_schedules drop constraint if exists jadwal_hari_check;
alter table public.doctor_schedules add constraint jadwal_hari_check
  check (hari between 0 and 6);

alter table public.doctor_schedules drop constraint if exists jadwal_jam_check;
alter table public.doctor_schedules add constraint jadwal_jam_check
  check (jam_selesai > jam_mulai);

-- Kuota nol berarti TANPA BATAS, bukan tertutup. Pola yang sama dengan
-- `lib/plan.ts`: penanda yang lupa diisi itu wajar, dan memberi kelebihan
-- jauh lebih murah daripada mengunci klinik yang sedang melayani orang.
alter table public.doctor_schedules drop constraint if exists jadwal_kuota_check;
alter table public.doctor_schedules add constraint jadwal_kuota_check
  check (kuota >= 0);

comment on table public.doctor_schedules is
  'Jadwal praktik per poli per hari. Satu baris = satu sesi. Kuota 0 berarti tanpa batas.';
comment on column public.doctor_schedules.hari is
  'Hari dalam pekan, 0 = Minggu, mengikuti extract(dow) PostgreSQL.';
comment on column public.doctor_schedules.dokter_email is
  'Boleh kosong: poli yang dokternya bergantian dijadwalkan per poli saja.';

create unique index if not exists uq_jadwal_sesi
  on public.doctor_schedules (unit_id, hari, jam_mulai, coalesce(lower(dokter_email), ''));
create index if not exists idx_jadwal_company on public.doctor_schedules (company_id, hari);

alter table public.doctor_schedules enable row level security;
drop policy if exists "tenant_all" on public.doctor_schedules;
create policy "tenant_all" on public.doctor_schedules for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.doctor_schedules;
create trigger trg_set_company_id before insert on public.doctor_schedules
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 2. Reservasi
-- ------------------------------------------------------------

create table if not exists public.reservations (id uuid primary key default gen_random_uuid());
alter table public.reservations
  add column if not exists company_id   uuid not null references public.companies(id) on delete cascade,
  add column if not exists nomor        text,
  add column if not exists patient_id   uuid references public.patients(id) on delete set null,
  add column if not exists nama         text not null,
  add column if not exists telepon      text,
  add column if not exists unit_id      uuid references public.clinic_units(id) on delete set null,
  add column if not exists jadwal_id    uuid references public.doctor_schedules(id) on delete set null,
  add column if not exists dokter_email text,
  add column if not exists tanggal      date not null,
  add column if not exists urut         integer,
  add column if not exists keluhan      text,
  add column if not exists penjamin     text not null default 'umum',
  add column if not exists asuransi_id  uuid references public.insurers(id),
  add column if not exists nomor_penjamin text,
  add column if not exists status       text not null default 'menunggu',
  add column if not exists catatan_batal text,
  add column if not exists visit_id     uuid references public.visits(id) on delete set null,
  add column if not exists dibuat_oleh  text,
  add column if not exists created_at   timestamptz not null default now();

-- Daftar keadaan ditulis sebagai yang ADA, bukan sebagai yang bukan. Pelajaran
-- papan ruang tunggu di migrasi 0046: "not in (...)" membuat keadaan baru mana
-- pun ikut muncul di tempat yang tidak pernah memutuskannya.
alter table public.reservations drop constraint if exists reservasi_status_check;
alter table public.reservations add constraint reservasi_status_check
  check (status in ('menunggu', 'hadir', 'batal', 'hangus'));

alter table public.reservations drop constraint if exists reservasi_penjamin_check;
alter table public.reservations add constraint reservasi_penjamin_check
  check (penjamin in ('umum', 'bpjs', 'asuransi'));

comment on table public.reservations is
  'Janji datang. Bukan rekam medis: pasiennya boleh belum terdaftar, dan pencocokannya terjadi saat orangnya tiba.';
comment on column public.reservations.status is
  'menunggu = belum datang, hadir = sudah jadi kunjungan, batal = dibatalkan, hangus = harinya lewat tanpa datang.';
comment on column public.reservations.visit_id is
  'Kunjungan yang lahir dari reservasi ini. Terisi saat pasiennya tiba.';

create index if not exists idx_reservasi_tanggal
  on public.reservations (company_id, tanggal, unit_id);
create index if not exists idx_reservasi_pasien
  on public.reservations (patient_id, tanggal desc);
create unique index if not exists uq_reservasi_nomor
  on public.reservations (company_id, nomor) where nomor is not null;

-- Satu pasien tidak boleh punya dua janji terbuka di poli yang sama pada hari
-- yang sama. Bentuknya indeks parsial, seperti `uq_visits_terbuka`: yang sudah
-- batal atau hangus tidak menghalangi janji baru.
create unique index if not exists uq_reservasi_terbuka
  on public.reservations (patient_id, tanggal, unit_id)
  where status = 'menunggu' and patient_id is not null;

alter table public.reservations enable row level security;
drop policy if exists "tenant_all" on public.reservations;
create policy "tenant_all" on public.reservations for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.reservations;
create trigger trg_set_company_id before insert on public.reservations
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 3. Hak akses
-- ------------------------------------------------------------
-- Disalin utuh dari migrasi 0039, ditambah dua baris. Matriksnya tetap di SATU
-- tempat: `if peran = ...` yang disebar akan ketinggalan saat peran berikutnya
-- lahir, dan yang ketinggalan pada hak akses membuka data.

create or replace function public.boleh(p_kapabilitas text)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select case
    when public.boleh_admin_platform() then true
    else coalesce((
      select case p_kapabilitas
        when 'rekam_medis.baca'  then peran in ('pemilik','admin','dokter','perawat')
        when 'rekam_medis.tulis' then peran in ('pemilik','admin','dokter','perawat')
        when 'diagnosis.tulis'   then peran in ('pemilik','admin','dokter')
        when 'resep.baca'        then peran in ('pemilik','admin','dokter','perawat','apoteker','asisten_apoteker')
        when 'resep.tulis'       then peran in ('pemilik','admin','dokter')
        when 'resep.layani'      then peran in ('pemilik','admin','apoteker','asisten_apoteker')
        -- Reservasi dibaca hampir semua orang: dokter ingin tahu berapa yang
        -- sudah memesan hari ini, kasir ingin tahu apakah masih ada yang
        -- ditunggu. Yang MENULISNYA cuma yang memegang loket, karena janji
        -- yang dibuat dua orang berbeda pada satu sesi adalah cara paling
        -- mudah melewati kuota tanpa ada yang sadar.
        when 'reservasi.baca'    then peran in ('pemilik','admin','pendaftaran','dokter','perawat','kasir')
        when 'reservasi.tulis'   then peran in ('pemilik','admin','pendaftaran')
        else false
      end
      from (select public.peran_saya() as peran) x
    ), false)
  end;
$$;

revoke all on function public.boleh(text) from public, anon;
grant execute on function public.boleh(text) to authenticated;

-- ------------------------------------------------------------
-- 4. Sesi yang berlaku pada satu tanggal
-- ------------------------------------------------------------
/**
 * Jadwal praktik pada satu tanggal, beserta berapa yang sudah memesan.
 *
 * Sisanya dihitung di sini, bukan di layar, supaya angka yang dilihat petugas
 * loket dan angka yang dipakai menolak adalah angka yang sama. Kalau layar
 * menghitung sendiri, ia akan menampilkan "sisa 2" pada saat database sudah
 * menolak, dan petugas akan mengira aplikasinya rusak.
 */
create or replace function public.jadwal_tanggal(p_tanggal date, p_company uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co  uuid := case when p_company is not null and public.boleh_admin_platform()
                     then p_company else public.auth_company_id() end;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('reservasi.baca');

  return coalesce((
    select jsonb_agg(x order by x.jam_mulai, x.unit_nama)
    from (
      select
        j.id, j.unit_id, u.nama as unit_nama, j.dokter_email,
        j.jam_mulai, j.jam_selesai, j.kuota,
        (select count(*) from public.reservations r
          where r.jadwal_id = j.id and r.tanggal = p_tanggal
            and r.status = 'menunggu')::integer as terpakai
      from public.doctor_schedules j
      join public.clinic_units u on u.id = j.unit_id
     where j.company_id = v_co
       and j.aktif
       and u.aktif
       and j.hari = extract(dow from p_tanggal)::smallint
    ) x), '[]'::jsonb);
end;
$$;

revoke all on function public.jadwal_tanggal(date, uuid) from public, anon;
grant execute on function public.jadwal_tanggal(date, uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. Membuat reservasi
-- ------------------------------------------------------------
/**
 * Kuotanya diperiksa DI SINI, dengan mengunci baris jadwalnya lebih dulu.
 *
 * `select ... for update` pada barisnya, bukan pada hitungan reservasinya:
 * dua petugas yang menekan Simpan bersamaan akan berbaris di kunci yang sama,
 * jadi yang kedua menghitung SESUDAH yang pertama menyimpan. Tanpa itu
 * keduanya membaca "sisa 1" dan keduanya berhasil.
 */
create or replace function public.buat_reservasi(
  p_nama     text,
  p_tanggal  date,
  p_jadwal   uuid,
  p_telepon  text default null,
  p_patient  uuid default null,
  p_keluhan  text default null,
  p_penjamin text default 'umum',
  p_asuransi uuid default null,
  p_nomor_penjamin text default null,
  p_company  uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := case when p_company is not null and public.boleh_admin_platform()
                       then p_company else public.auth_company_id() end;
  v_jad   record;
  v_pakai integer;
  v_urut  integer;
  v_pen   text;
  v_row   record;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('reservasi.tulis');

  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama yang memesan harus diisi.' using errcode = 'SH004';
  end if;

  -- Janji untuk hari yang sudah lewat tidak bisa ditepati oleh siapa pun.
  if p_tanggal < current_date then
    raise exception 'Tanggal % sudah lewat, jadi tidak bisa dipesan.', to_char(p_tanggal, 'DD Mon YYYY')
      using errcode = 'SH004';
  end if;

  v_pen := lower(coalesce(nullif(trim(p_penjamin), ''), 'umum'));
  if v_pen not in ('umum', 'bpjs', 'asuransi') then
    raise exception 'Penjamin "%" tidak dikenali.', v_pen using errcode = 'SH004';
  end if;
  if v_pen <> 'asuransi' and p_asuransi is not null then
    raise exception 'Penerbit asuransi hanya berlaku kalau penjaminnya asuransi.' using errcode = 'SH004';
  end if;

  select * into v_jad from public.doctor_schedules
   where id = p_jadwal and company_id = v_co and aktif
   for update;
  if not found then
    raise exception 'Jadwal praktik tidak ditemukan atau sudah tidak aktif.' using errcode = 'SH004';
  end if;

  if v_jad.hari <> extract(dow from p_tanggal)::smallint then
    raise exception 'Jadwal itu tidak berlaku pada tanggal %.', to_char(p_tanggal, 'DD Mon YYYY')
      using errcode = 'SH004';
  end if;

  select count(*) into v_pakai from public.reservations
   where jadwal_id = p_jadwal and tanggal = p_tanggal and status = 'menunggu';

  -- Kuota nol berarti tanpa batas, bukan tertutup.
  if v_jad.kuota > 0 and v_pakai >= v_jad.kuota then
    raise exception 'Sesi ini sudah penuh: % dari % tempat sudah dipesan.', v_pakai, v_jad.kuota
      using errcode = 'SH002';
  end if;

  if p_patient is not null and not exists (
       select 1 from public.patients where id = p_patient and company_id = v_co) then
    raise exception 'Pasien tidak ditemukan di fasilitas ini.' using errcode = 'SH004';
  end if;

  v_urut := v_pakai + 1;

  insert into public.reservations (
    company_id, nomor, patient_id, nama, telepon, unit_id, jadwal_id, dokter_email,
    tanggal, urut, keluhan, penjamin, asuransi_id, nomor_penjamin, dibuat_oleh)
  values (
    v_co,
    public.next_doc_number(v_co, 'reservations', 'nomor', 'RSV', to_char(p_tanggal, 'YYYY')),
    p_patient, trim(p_nama), nullif(trim(p_telepon), ''), v_jad.unit_id, p_jadwal,
    v_jad.dokter_email, p_tanggal, v_urut, nullif(trim(p_keluhan), ''), v_pen,
    p_asuransi, nullif(trim(p_nomor_penjamin), ''), lower(auth.jwt() ->> 'email'))
  returning * into v_row;

  perform public.catat_audit(v_co, 'reservasi.buat', 'reservations', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'nama', v_row.nama, 'tanggal', p_tanggal));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.buat_reservasi(text, date, uuid, text, uuid, text, text, uuid, text, uuid)
  from public, anon;
grant execute on function public.buat_reservasi(text, date, uuid, text, uuid, text, text, uuid, text, uuid)
  to authenticated;

-- ------------------------------------------------------------
-- 6. Membatalkan
-- ------------------------------------------------------------
create or replace function public.batal_reservasi(p_id uuid, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  perform public.wajib_boleh('reservasi.tulis');

  update public.reservations
     set status = 'batal', catatan_batal = nullif(trim(p_alasan), '')
   where id = p_id
     and status = 'menunggu'
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
  returning * into v_row;

  if not found then
    raise exception 'Reservasi tidak ditemukan, atau sudah tidak berstatus menunggu.'
      using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_row.company_id, 'reservasi.batal', 'reservations', p_id::text,
    jsonb_build_object('nomor', v_row.nomor, 'alasan', v_row.catatan_batal));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.batal_reservasi(uuid, text) from public, anon;
grant execute on function public.batal_reservasi(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 7. Pasiennya tiba
-- ------------------------------------------------------------
/**
 * Reservasi berubah jadi kunjungan.
 *
 * Lewat `daftar_kunjungan()` yang sudah ada, bukan dengan menulis ke `visits`
 * sendiri. Jalur kedua ke tabel yang sama berarti dua tempat yang harus benar,
 * dan yang kedua akan ketinggalan pada perbaikan berikutnya: nomor antrean,
 * biaya administrasi, dan riwayat keadaan semuanya menempel pada jalur itu.
 *
 * Pasiennya boleh baru dicocokkan sekarang. Itulah gunanya `p_patient`: yang
 * memesan lewat telepon kemarin belum tentu punya nomor RM.
 */
create or replace function public.hadirkan_reservasi(p_id uuid, p_patient uuid default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row  record;
  v_pas  uuid;
  v_kun  jsonb;
begin
  perform public.wajib_boleh('reservasi.tulis');

  select * into v_row from public.reservations
   where id = p_id
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Reservasi tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.status <> 'menunggu' then
    raise exception 'Reservasi ini sudah berstatus %, jadi tidak bisa dihadirkan lagi.', v_row.status
      using errcode = 'SH004';
  end if;

  v_pas := coalesce(p_patient, v_row.patient_id);
  if v_pas is null then
    raise exception 'Pilih dulu pasiennya. Reservasi ini dibuat tanpa nomor RM, jadi orangnya harus dicocokkan atau didaftarkan sekarang.'
      using errcode = 'SH004';
  end if;

  v_kun := public.daftar_kunjungan(
    v_pas, v_row.keluhan, v_row.penjamin, v_row.unit_id, v_row.dokter_email,
    v_row.company_id, v_row.asuransi_id, v_row.nomor_penjamin);

  update public.reservations
     set status = 'hadir', patient_id = v_pas, visit_id = (v_kun ->> 'id')::uuid
   where id = p_id
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'reservasi.hadir', 'reservations', p_id::text,
    jsonb_build_object('nomor', v_row.nomor, 'kunjungan', v_kun ->> 'nomor'));

  return jsonb_build_object('reservasi', to_jsonb(v_row), 'kunjungan', v_kun);
end;
$$;

revoke all on function public.hadirkan_reservasi(uuid, uuid) from public, anon;
grant execute on function public.hadirkan_reservasi(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- 8. Yang harinya lewat tanpa datang
-- ------------------------------------------------------------
/**
 * Reservasi kemarin yang tidak pernah hadir jadi `hangus`.
 *
 * Dipanggil saat layar reservasi dibuka, bukan lewat penjadwal: klinik ini
 * belum punya penjadwal, dan reservasi yang menggantung di keadaan `menunggu`
 * selamanya membuat hitungan "berapa yang masih ditunggu hari ini" salah pada
 * hari berikutnya. Dibatasi ke faskes pemanggilnya sendiri.
 */
create or replace function public.hanguskan_reservasi_lewat(p_company uuid default null)
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co uuid := case when p_company is not null and public.boleh_admin_platform()
                    then p_company else public.auth_company_id() end;
  v_n  integer;
begin
  if v_co is null then
    return 0;
  end if;

  update public.reservations
     set status = 'hangus'
   where company_id = v_co and status = 'menunggu' and tanggal < current_date;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.hanguskan_reservasi_lewat(uuid) from public, anon;
grant execute on function public.hanguskan_reservasi_lewat(uuid) to authenticated;
