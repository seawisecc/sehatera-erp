-- ============================================================
-- 0024  Satu tagihan per kunjungan
-- ============================================================
--
-- Ini menutup lubang di jalur uang, bukan menambah kenyamanan.
--
-- Sampai sekarang resep sampai ke kasir, tapi TARIF KONSULTASI DAN TINDAKAN
-- TIDAK PERNAH TERTAGIH SAMA SEKALI. Kolom `tarif_konsultasi` sudah ada di tiap
-- poli sejak migrasi 0020 dan tidak pernah dibaca siapa pun. Klinik yang
-- memakai aplikasi ini hari ini akan kehilangan pendapatan tanpa sadar, dan
-- kehilangan yang tidak disadari tidak akan pernah dilaporkan sebagai keluhan.
--
-- Bentuknya: tiap kunjungan mengumpulkan barisan biaya sepanjang harinya, lalu
-- seluruhnya berangkat ke kasir bersama obatnya sebagai SATU keranjang, SATU
-- struk, SATU pembayaran. Kasirnya tidak perlu tahu mana yang datang dari mana.
--
-- Dua biaya yang paling sering lupa ditagih dimasukkan SENDIRI oleh database,
-- bukan diserahkan ke ingatan orang:
--
--   · biaya administrasi, saat pasien didaftarkan
--   · tarif konsultasi, saat kunjungan berpindah ke Diperiksa
--
-- Keduanya lewat trigger dan idempoten. Alasan memakai trigger sama seperti
-- pencatat riwayat keadaan di migrasi 0018: biaya yang hanya ditambahkan oleh
-- satu jalur akan hilang begitu ada jalur kedua, dan jalur kedua selalu datang.

-- ------------------------------------------------------------
-- 1. Biaya administrasi per fasilitas
-- ------------------------------------------------------------

alter table public.settings
  add column if not exists biaya_administrasi numeric(14,2) not null default 0;

comment on column public.settings.biaya_administrasi is
  'Biaya administrasi per kunjungan. Nol berarti tidak ditagih, dan itu bawaannya: memunculkan biaya yang tidak diminta lebih buruk daripada melupakannya.';

-- ------------------------------------------------------------
-- 2. Barisan biaya satu kunjungan
-- ------------------------------------------------------------

create table if not exists public.visit_charges (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  visit_id     uuid not null references public.visits(id) on delete cascade,
  jenis        text not null default 'tindakan',
  service_id   uuid references public.services(id),
  nama         text not null,
  jumlah       numeric(10,2) not null default 1,
  harga        numeric(14,2) not null default 0,
  catatan      text,
  -- Kode ICD-9-CM tindakan. Belum diisi, kolomnya disiapkan sekarang dengan
  -- alasan yang sama seperti kode LOINC dan KFA di migrasi 0018 dan 0023.
  kode_icd9    text,
  dicatat_oleh text,
  dicatat_pada timestamptz not null default now(),
  constraint charge_jenis_check check (jenis in ('administrasi', 'konsultasi', 'tindakan', 'lainnya')),
  constraint charge_jumlah_check check (jumlah > 0),
  constraint charge_harga_check check (harga >= 0)
);

create index if not exists idx_charge_visit on public.visit_charges (visit_id);

-- Satu kunjungan hanya boleh punya SATU baris administrasi dan SATU baris
-- konsultasi. Tanpa ini, kunjungan yang mundur lalu maju lagi di rel keadaan
-- akan menagih konsultasi dua kali, dan pasien yang membayar dua kali untuk
-- satu pemeriksaan tidak akan kembali.
create unique index if not exists uq_charge_sekali
  on public.visit_charges (visit_id, jenis)
  where jenis in ('administrasi', 'konsultasi');

comment on table public.visit_charges is
  'Barisan biaya satu kunjungan: administrasi, konsultasi, dan tindakan. Obat tidak di sini, ia datang dari resep.';

alter table public.visit_charges enable row level security;
drop policy if exists "tenant_all" on public.visit_charges;
create policy "tenant_all" on public.visit_charges for all to authenticated
  using (company_id = public.auth_company_id() or public.is_super_admin())
  with check (company_id = public.auth_company_id() or public.is_super_admin());
drop trigger if exists trg_set_company_id on public.visit_charges;
create trigger trg_set_company_id before insert on public.visit_charges
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- 3. Biaya yang masuk sendiri
-- ------------------------------------------------------------

/**
 * Biaya administrasi, saat kunjungan dibuka.
 *
 * `on conflict do nothing` bukan kemalasan: ia yang membuat pendaftaran ulang,
 * percobaan ulang jaringan, dan perbaikan tangan lewat SQL tetap menghasilkan
 * satu baris administrasi, bukan dua.
 */
create or replace function public.tambah_biaya_administrasi()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_biaya numeric;
begin
  select coalesce(biaya_administrasi, 0) into v_biaya
    from public.settings where company_id = new.company_id;

  if coalesce(v_biaya, 0) > 0 then
    insert into public.visit_charges (company_id, visit_id, jenis, nama, jumlah, harga, dicatat_oleh)
    values (new.company_id, new.id, 'administrasi', 'Biaya administrasi', 1, v_biaya, 'sistem')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_biaya_administrasi on public.visits;
create trigger trg_biaya_administrasi
  after insert on public.visits
  for each row execute function public.tambah_biaya_administrasi();

/**
 * Tarif konsultasi, saat kunjungan mulai diperiksa.
 *
 * Ditagih saat pemeriksaan dimulai, bukan saat pendaftaran: pasien yang pulang
 * dari ruang tunggu sebelum diperiksa tidak boleh ditagih konsultasi, dan itu
 * kejadian yang cukup sering untuk pantas dipikirkan.
 */
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
      insert into public.visit_charges (company_id, visit_id, jenis, nama, jumlah, harga, dicatat_oleh)
      values (new.company_id, new.id, 'konsultasi',
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
-- 4. Mengelola biaya
-- ------------------------------------------------------------

/**
 * Menyimpan seluruh barisan biaya satu kunjungan sekaligus.
 *
 * Ditulis ulang seluruhnya, bukan ditambal per baris, dengan alasan yang sama
 * seperti `simpan_resep`: daftarnya pendek, dan tidak boleh ada keadaan
 * setengah tersimpan di mana tindakan kedua masuk sementara yang pertama gagal.
 *
 * Kunjungan yang sudah ditutup ditolak. Tagihan yang berubah sesudah pasien
 * membayar dan pulang bukan lagi tagihan, ia jadi selisih yang tidak bisa
 * dijelaskan siapa pun saat tutup buku.
 */
create or replace function public.simpan_biaya_kunjungan(p_visit uuid, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_item  jsonb;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_n     integer := 0;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, tagihannya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  delete from public.visit_charges where visit_id = p_visit;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(v_item ->> 'nama'), '') = '' then continue; end if;
    v_n := v_n + 1;
    insert into public.visit_charges (
      company_id, visit_id, jenis, service_id, nama, jumlah, harga, catatan, kode_icd9, dicatat_oleh)
    values (
      v_visit.company_id, p_visit,
      coalesce(nullif(v_item ->> 'jenis', ''), 'tindakan'),
      nullif(v_item ->> 'service_id', '')::uuid,
      trim(v_item ->> 'nama'),
      greatest(coalesce(nullif(v_item ->> 'jumlah', '')::numeric, 1), 0.01),
      greatest(coalesce(nullif(v_item ->> 'harga', '')::numeric, 0), 0),
      nullif(trim(v_item ->> 'catatan'), ''),
      nullif(trim(v_item ->> 'kode_icd9'), ''),
      v_email);
  end loop;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.biaya', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'jumlah_baris', v_n));

  return jsonb_build_object('ok', true, 'jumlah', v_n);
end;
$$;

revoke all on function public.simpan_biaya_kunjungan(uuid, jsonb) from public, anon;
grant execute on function public.simpan_biaya_kunjungan(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. Seluruh tagihan satu kunjungan, dalam satu panggilan
-- ------------------------------------------------------------

/**
 * Biaya DAN obat satu kunjungan, siap dijadikan satu keranjang.
 *
 * Keduanya diambil bersama, bukan dua panggilan dari peramban, supaya tidak
 * mungkin ada keadaan di mana kasir sudah melihat tarifnya tapi belum
 * obatnya, lalu menekan Proses. Struk yang kurang satu baris baru ketahuan
 * saat pasien sudah pulang.
 */
create or replace function public.tagihan_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_resep record;
  v_biaya jsonb;
  v_obat  jsonb;
begin
  select v.*, p.nama as pasien_nama, p.nomor_rm, p.alergi
    into v_visit
    from public.visits v join public.patients p on p.id = v.patient_id
   where v.id = p_visit
     and (public.boleh_admin_platform() or v.company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions
   where visit_id = p_visit and status = 'final'
   order by ditulis_pada desc limit 1;

  v_biaya := coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'jenis', c.jenis, 'service_id', c.service_id, 'nama', c.nama,
      'jumlah', c.jumlah, 'harga', c.harga, 'catatan', c.catatan, 'kode_icd9', c.kode_icd9)
      order by case c.jenis when 'administrasi' then 1 when 'konsultasi' then 2 else 3 end,
               c.dicatat_pada)
    from public.visit_charges c where c.visit_id = p_visit), '[]'::jsonb);

  v_obat := case when v_resep.id is null then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object(
      'product_id', i.product_id, 'nama_obat', i.nama_obat, 'jumlah', i.jumlah,
      'satuan', i.satuan, 'aturan_pakai', i.aturan_pakai,
      'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori)
      order by i.urutan)
    from public.prescription_items i
    left join public.products p on p.id = i.product_id
    where i.prescription_id = v_resep.id), '[]'::jsonb) end;

  return jsonb_build_object(
    'kunjungan', jsonb_build_object(
      'id', v_visit.id, 'nomor', v_visit.nomor, 'nomor_antre', v_visit.nomor_antre,
      'status', v_visit.status, 'poli', v_visit.poli, 'penjamin', v_visit.penjamin,
      'pasien_nama', v_visit.pasien_nama, 'nomor_rm', v_visit.nomor_rm,
      'alergi', v_visit.alergi),
    'resep_id', v_resep.id,
    'biaya', v_biaya,
    'obat',  v_obat);
end;
$$;

revoke all on function public.tagihan_kunjungan(uuid) from public, anon;
grant execute on function public.tagihan_kunjungan(uuid) to authenticated;

-- ------------------------------------------------------------
-- 6. Antrean kunjungan membawa nilai tagihannya
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
  u.kode as unit_kode,
  (select r.status from public.prescriptions r
    where r.visit_id = v.id and r.status in ('draf', 'final', 'dilayani')
    order by r.ditulis_pada desc limit 1) as status_resep,
  coalesce((select sum(c.jumlah * c.harga) from public.visit_charges c
             where c.visit_id = v.id), 0) as nilai_biaya,
  v.transaction_id
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;

-- ------------------------------------------------------------
-- 7. Menyambungkan kunjungan ke penjualan yang melunasinya
-- ------------------------------------------------------------

/**
 * Idempoten, dan dipanggil SESUDAH penjualan berhasil. Alasannya sama persis
 * seperti `tandai_resep_dilayani` di migrasi 0023: kalau urutannya dibalik lalu
 * penjualannya gagal, kunjungan itu terlihat sudah dibayar padahal belum.
 */
create or replace function public.tandai_kunjungan_dibayar(p_visit uuid, p_transaksi uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  update public.visits
     set transaction_id = coalesce(transaction_id, p_transaksi)
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
  returning * into v_row;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.tandai_kunjungan_dibayar(uuid, uuid) from public, anon;
grant execute on function public.tandai_kunjungan_dibayar(uuid, uuid) to authenticated;
