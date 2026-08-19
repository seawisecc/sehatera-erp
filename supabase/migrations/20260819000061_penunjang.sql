-- ============================================================
-- 0061  Pemeriksaan penunjang: laboratorium dan radiologi
-- ============================================================
--
-- Permintaan pemilik, sepaket dengan rujukan internal: pasien yang perlu
-- diperiksa lab atau dirontgen sebelum dokternya bisa memutuskan.
--
-- Empat keputusan bentuk yang perlu dibaca sebelum menyentuhnya lagi.
--
-- 1. **Hasil lab adalah BARIS BERKOLOM, bukan satu kotak catatan.** Aturan yang
--    sama dengan tanda vital di migrasi 0018, dan alasannya sama: "Hb 11,2"
--    yang ditulis di kotak bebas tidak bisa dipetakan ke Observation tanpa
--    menebak, tidak bisa dibandingkan dengan hasil bulan lalu, dan tidak bisa
--    ditandai di luar rentang oleh siapa pun kecuali mata manusia. Tiap baris
--    membawa kode LOINC, nilai, satuan, dan rentang rujukannya.
--
-- 2. **Radiologi TIDAK dipaksa jadi baris berkolom.** Bacaan radiologi memang
--    naratif: temuan dan kesan. Memaksanya jadi angka akan membuat orang
--    mengisi kolom yang tidak ada isinya, dan data yang diisi asal lebih buruk
--    daripada data yang kosong.
--
-- 3. **Permintaan pemeriksaan menagih SENDIRI**, lewat katalog Layanan, bukan
--    diketik ulang harganya tiap kali. Kalau harganya diketik ulang, satu
--    pemeriksaan yang sama tercatat dengan harga berbeda tergantung siapa yang
--    jaga, dan rekap setahun jadi tidak bisa dijumlahkan. Dibatalkan berarti
--    biayanya ikut dicabut: pemeriksaan yang tidak jadi dikerjakan tidak boleh
--    ditagihkan.
--
-- 4. **Petugas lab adalah PERAN tersendiri.** Tanpa itu, yang mengisi hasil
--    adalah dokter yang memintanya, dan hasil yang diisi oleh yang memintanya
--    bukan hasil pemeriksaan.

-- ------------------------------------------------------------
-- 1. Peran analis
-- ------------------------------------------------------------
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users add constraint app_users_role_check
  check (role in ('pemilik', 'admin', 'apoteker', 'asisten_apoteker', 'kasir',
                  'dokter', 'perawat', 'pendaftaran', 'analis'));

-- ------------------------------------------------------------
-- 2. Permintaan pemeriksaan
-- ------------------------------------------------------------

create table if not exists public.visit_penunjang (id uuid primary key default gen_random_uuid());
alter table public.visit_penunjang
  add column if not exists company_id     uuid not null references public.companies(id) on delete cascade,
  add column if not exists visit_id       uuid not null references public.visits(id) on delete cascade,
  add column if not exists unit_id        uuid references public.clinic_units(id),
  add column if not exists jenis          text not null,
  add column if not exists service_id     uuid references public.services(id),
  add column if not exists charge_id      uuid references public.visit_charges(id) on delete set null,
  add column if not exists nama           text not null,
  add column if not exists kode_loinc     text,
  add column if not exists catatan_klinis text,
  add column if not exists prioritas      text not null default 'rutin',
  add column if not exists status         text not null default 'diminta',
  add column if not exists temuan         text,
  add column if not exists kesan          text,
  add column if not exists alasan_batal   text,
  add column if not exists diminta_oleh   text,
  add column if not exists diminta_pada   timestamptz not null default now(),
  add column if not exists dikerjakan_oleh text,
  add column if not exists selesai_pada   timestamptz;

alter table public.visit_penunjang drop constraint if exists penunjang_jenis_check;
alter table public.visit_penunjang add constraint penunjang_jenis_check
  check (jenis in ('lab', 'radiologi'));

-- Ditulis sebagai yang ADA. Pelajaran 0046: daftar negatif membuat keadaan
-- baru mana pun ikut muncul di tempat yang tidak pernah memutuskannya.
alter table public.visit_penunjang drop constraint if exists penunjang_status_check;
alter table public.visit_penunjang add constraint penunjang_status_check
  check (status in ('diminta', 'dikerjakan', 'selesai', 'batal'));

alter table public.visit_penunjang drop constraint if exists penunjang_prioritas_check;
alter table public.visit_penunjang add constraint penunjang_prioritas_check
  check (prioritas in ('rutin', 'cito'));

comment on table public.visit_penunjang is
  'Permintaan pemeriksaan penunjang satu kunjungan. Hasil lab ada di lab_results; hasil radiologi naratif di temuan/kesan.';
comment on column public.visit_penunjang.prioritas is
  'cito berarti didahulukan. Bukan hiasan: yang cito muncul di atas antrean lab dan ditandai merah.';
comment on column public.visit_penunjang.charge_id is
  'Baris biaya yang lahir dari permintaan ini. Dibatalkan berarti biayanya ikut dicabut.';

create index if not exists idx_penunjang_visit on public.visit_penunjang (visit_id, diminta_pada);
create index if not exists idx_penunjang_antre
  on public.visit_penunjang (company_id, jenis, status, prioritas, diminta_pada);

alter table public.visit_penunjang enable row level security;
drop policy if exists "tenant_all" on public.visit_penunjang;
create policy "tenant_all" on public.visit_penunjang for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.visit_penunjang;
create trigger trg_set_company_id before insert on public.visit_penunjang
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 3. Hasil laboratorium, berkolom
-- ------------------------------------------------------------

create table if not exists public.lab_results (id uuid primary key default gen_random_uuid());
alter table public.lab_results
  add column if not exists company_id     uuid not null references public.companies(id) on delete cascade,
  add column if not exists penunjang_id   uuid not null references public.visit_penunjang(id) on delete cascade,
  add column if not exists kode_loinc     text,
  add column if not exists nama           text not null,
  add column if not exists nilai          text,
  add column if not exists nilai_angka    numeric,
  add column if not exists satuan         text,
  add column if not exists rujukan_bawah  numeric,
  add column if not exists rujukan_atas   numeric,
  add column if not exists rujukan_teks   text,
  add column if not exists penanda        text not null default 'normal',
  add column if not exists catatan        text,
  add column if not exists urutan         integer not null default 0,
  add column if not exists dicatat_oleh   text,
  add column if not exists dicatat_pada   timestamptz not null default now();

alter table public.lab_results drop constraint if exists lab_penanda_check;
alter table public.lab_results add constraint lab_penanda_check
  check (penanda in ('normal', 'rendah', 'tinggi', 'kritis'));

comment on table public.lab_results is
  'Satu baris per parameter, berkolom dan berkode LOINC. Bukan satu kotak catatan: hasil yang ditulis bebas tidak bisa dibandingkan dengan hasil bulan lalu maupun dikirim ke SatuSehat.';
comment on column public.lab_results.nilai is
  'Nilai apa adanya, termasuk yang bukan angka (positif/negatif, warna). `nilai_angka` diisi hanya kalau memang angka, dan itu yang dipakai membandingkan.';
comment on column public.lab_results.penanda is
  'kritis berarti harus dikabari dokternya SEKARANG, bukan menunggu pasien dipanggil.';

create index if not exists idx_lab_penunjang on public.lab_results (penunjang_id, urutan);

alter table public.lab_results enable row level security;
drop policy if exists "tenant_all" on public.lab_results;
create policy "tenant_all" on public.lab_results for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.lab_results;
create trigger trg_set_company_id before insert on public.lab_results
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 4. Biaya penunjang: jenis baru di visit_charges
-- ------------------------------------------------------------
-- Menambah nilai status berarti memeriksa tiap tempat yang menyebut nilai
-- lama. Yang menyebut `jenis` di sini: constraint ini, urutan di
-- `tagihan_kunjungan` (memakai `else`, jadi aman), indeks unik administrasi
-- dan konsultasi (tidak menyentuh nilai baru), dan pengelompokan keranjang di
-- layar Kasir (punya kelompok "Lainnya" sebagai jaring, dan diberi kelompok
-- sendiri di berkas TypeScript-nya).
alter table public.visit_charges drop constraint if exists charge_jenis_check;
alter table public.visit_charges add constraint charge_jenis_check
  check (jenis in ('administrasi', 'konsultasi', 'tindakan', 'penunjang', 'lainnya'));

-- ------------------------------------------------------------
-- 5. Hak akses
-- ------------------------------------------------------------
-- Disalin utuh dari migrasi 0054, ditambah dua baris dan satu peran.
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
        when 'reservasi.baca'    then peran in ('pemilik','admin','pendaftaran','dokter','perawat','kasir')
        when 'reservasi.tulis'   then peran in ('pemilik','admin','pendaftaran')
        -- Yang MEMINTA pemeriksaan adalah dokter: itu keputusan klinis yang
        -- menagih uang pasien. Yang MENGISI hasilnya adalah petugas lab, dan
        -- keduanya sengaja tidak sama: hasil yang diisi oleh yang memintanya
        -- bukan hasil pemeriksaan.
        when 'penunjang.minta'   then peran in ('pemilik','admin','dokter')
        when 'penunjang.hasil'   then peran in ('pemilik','admin','analis')
        when 'penunjang.baca'    then peran in ('pemilik','admin','dokter','perawat','analis')
        else false
      end
      from (select public.peran_saya() as peran) x
    ), false)
  end;
$$;

revoke all on function public.boleh(text) from public, anon;
grant execute on function public.boleh(text) to authenticated;

-- ------------------------------------------------------------
-- 6. Meminta pemeriksaan
-- ------------------------------------------------------------
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

  -- Harga datang dari katalog Layanan, bukan diketik. Pemeriksaan di luar
  -- katalog tetap boleh diminta, cuma tidak menagih apa pun: itu lebih jujur
  -- daripada menagih angka yang dikarang di tempat.
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
  end if;

  insert into public.visit_penunjang (
    company_id, visit_id, unit_id, jenis, service_id, charge_id, nama,
    kode_loinc, catatan_klinis, prioritas, diminta_oleh)
  values (
    v_visit.company_id, p_visit, v_visit.unit_id, p_jenis, p_service, v_charge,
    trim(p_nama), nullif(trim(p_loinc), ''), nullif(trim(p_catatan), ''),
    case when lower(coalesce(p_prioritas, 'rutin')) = 'cito' then 'cito' else 'rutin' end,
    v_email)
  returning * into v_row;

  perform public.catat_audit(v_visit.company_id, 'penunjang.diminta', 'visit_penunjang', v_row.id::text,
    jsonb_build_object('kunjungan', v_visit.nomor, 'jenis', p_jenis,
                       'nama', trim(p_nama), 'prioritas', v_row.prioritas));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.minta_penunjang(uuid, text, text, uuid, text, text, text) from public, anon;
grant execute on function public.minta_penunjang(uuid, text, text, uuid, text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 7. Membatalkan permintaan
-- ------------------------------------------------------------
/**
 * Biayanya ikut dicabut. Pemeriksaan yang tidak jadi dikerjakan tidak boleh
 * ditagihkan, dan membiarkan barisnya di tagihan sambil berharap kasir sadar
 * adalah cara paling mudah menagih orang untuk sesuatu yang tidak terjadi.
 *
 * Yang sudah SELESAI tidak bisa dibatalkan: hasilnya sudah ada, dan
 * pemeriksaan yang sudah dikerjakan memang harus dibayar.
 */
create or replace function public.batal_penunjang(p_id uuid, p_alasan text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  perform public.wajib_boleh('penunjang.minta');
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Alasan pembatalan wajib ditulis.' using errcode = 'SH004';
  end if;

  select * into v_row from public.visit_penunjang
   where id = p_id
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Permintaan pemeriksaan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.status = 'selesai' then
    raise exception 'Pemeriksaan ini sudah selesai dan hasilnya sudah ada, jadi tidak bisa dibatalkan.'
      using errcode = 'SH004';
  end if;
  if v_row.status = 'batal' then
    return to_jsonb(v_row);
  end if;

  if v_row.charge_id is not null then
    delete from public.visit_charges where id = v_row.charge_id;
  end if;

  update public.visit_penunjang
     set status = 'batal', alasan_batal = trim(p_alasan), charge_id = null
   where id = p_id
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'penunjang.batal', 'visit_penunjang', p_id::text,
    jsonb_build_object('nama', v_row.nama, 'alasan', trim(p_alasan)));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.batal_penunjang(uuid, text) from public, anon;
grant execute on function public.batal_penunjang(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 8. Mengisi hasil
-- ------------------------------------------------------------
/**
 * `p_hasil` array objek untuk lab; `p_temuan`/`p_kesan` untuk radiologi.
 *
 * Hasil lab ditulis ULANG seluruhnya tiap kali disimpan, bukan ditambahkan:
 * koreksi satu parameter yang salah ketik akan meninggalkan dua baris untuk
 * parameter yang sama kalau ditambahkan, dan yang membaca tidak punya cara
 * tahu mana yang berlaku.
 */
create or replace function public.isi_hasil_penunjang(
  p_id     uuid,
  p_hasil  jsonb default null,
  p_temuan text default null,
  p_kesan  text default null,
  p_selesai boolean default true
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row   record;
  v_item  jsonb;
  v_i     integer := 0;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  perform public.wajib_boleh('penunjang.hasil');

  select * into v_row from public.visit_penunjang
   where id = p_id
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Permintaan pemeriksaan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.status = 'batal' then
    raise exception 'Permintaan ini sudah dibatalkan.' using errcode = 'SH004';
  end if;

  if p_hasil is not null then
    if v_row.jenis <> 'lab' then
      raise exception 'Hasil berkolom hanya untuk pemeriksaan laboratorium.' using errcode = 'SH004';
    end if;
    delete from public.lab_results where penunjang_id = p_id;
    for v_item in select * from jsonb_array_elements(p_hasil) loop
      v_i := v_i + 1;
      if coalesce(trim(v_item ->> 'nama'), '') = '' then
        raise exception 'Baris hasil ke-% tidak punya nama parameter.', v_i using errcode = 'SH004';
      end if;
      insert into public.lab_results (
        company_id, penunjang_id, kode_loinc, nama, nilai, nilai_angka, satuan,
        rujukan_bawah, rujukan_atas, rujukan_teks, penanda, catatan, urutan, dicatat_oleh)
      values (
        v_row.company_id, p_id,
        nullif(trim(v_item ->> 'kode_loinc'), ''),
        trim(v_item ->> 'nama'),
        nullif(trim(v_item ->> 'nilai'), ''),
        nullif(v_item ->> 'nilai_angka', '')::numeric,
        nullif(trim(v_item ->> 'satuan'), ''),
        nullif(v_item ->> 'rujukan_bawah', '')::numeric,
        nullif(v_item ->> 'rujukan_atas', '')::numeric,
        nullif(trim(v_item ->> 'rujukan_teks'), ''),
        case when lower(coalesce(v_item ->> 'penanda', 'normal')) in ('rendah','tinggi','kritis')
             then lower(v_item ->> 'penanda') else 'normal' end,
        nullif(trim(v_item ->> 'catatan'), ''),
        v_i, v_email);
    end loop;
  end if;

  update public.visit_penunjang
     set temuan          = coalesce(nullif(trim(p_temuan), ''), temuan),
         kesan           = coalesce(nullif(trim(p_kesan), ''), kesan),
         dikerjakan_oleh = v_email,
         status          = case when p_selesai then 'selesai' else 'dikerjakan' end,
         selesai_pada    = case when p_selesai then now() else null end
   where id = p_id
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'penunjang.hasil', 'visit_penunjang', p_id::text,
    jsonb_build_object('nama', v_row.nama, 'status', v_row.status, 'baris', v_i));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.isi_hasil_penunjang(uuid, jsonb, text, text, boolean) from public, anon;
grant execute on function public.isi_hasil_penunjang(uuid, jsonb, text, text, boolean) to authenticated;

-- ------------------------------------------------------------
-- 9. Membaca
-- ------------------------------------------------------------
create or replace function public.penunjang_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  perform public.wajib_boleh('penunjang.baca');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id, 'jenis', p.jenis, 'nama', p.nama, 'status', p.status,
             'prioritas', p.prioritas, 'catatan_klinis', p.catatan_klinis,
             'temuan', p.temuan, 'kesan', p.kesan, 'alasan_batal', p.alasan_batal,
             'diminta_oleh', p.diminta_oleh, 'diminta_pada', p.diminta_pada,
             'dikerjakan_oleh', p.dikerjakan_oleh, 'selesai_pada', p.selesai_pada,
             'hasil', coalesce((select jsonb_agg(to_jsonb(l) order by l.urutan)
                                  from public.lab_results l where l.penunjang_id = p.id), '[]'::jsonb))
           order by p.diminta_pada)
      from public.visit_penunjang p
     where p.visit_id = p_visit
       and (public.boleh_admin_platform() or p.company_id = public.auth_company_id())),
    '[]'::jsonb);
end;
$$;

revoke all on function public.penunjang_kunjungan(uuid) from public, anon;
grant execute on function public.penunjang_kunjungan(uuid) to authenticated;

/**
 * Antrean kerja petugas lab dan radiologi.
 *
 * `cito` di atas, lalu yang paling lama menunggu. Urutan itu satu-satunya
 * alasan kolom prioritas ada; kalau antreannya tetap menurut waktu, menandai
 * cito cuma jadi hiasan yang membuat orang mengira sesuatu sedang terjadi.
 */
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
             'poli', u.nama)
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

revoke all on function public.antrean_penunjang(text) from public, anon;
grant execute on function public.antrean_penunjang(text) to authenticated;
