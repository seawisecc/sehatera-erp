-- ============================================================
-- 0035  Jabat tangan farmasi dan kasir
-- ============================================================
--
-- Ini membetulkan CATATAN YANG TIDAK BENAR, bukan menambah kenyamanan.
--
-- Sampai sekarang resep cuma punya tiga keadaan yang jalan: draf, final,
-- dilayani. Perpindahan ke `dilayani` dilakukan KASIR, di detik pembayaran
-- diterima, di dalam klik yang sama dengan penjualannya.
--
-- Artinya database mencatat obat sudah diserahkan pada saat UANG diterima,
-- bukan saat obatnya berpindah tangan. Pasien yang sudah membayar lalu pulang
-- tanpa mengambil obatnya tercatat sudah menerima. Untuk narkotika dan
-- psikotropika itu catatan yang ditandatangani apoteker penanggung jawab, dan
-- isinya salah. Itu jenis kesalahan yang tidak akan pernah muncul sebagai
-- keluhan, karena tidak ada yang melihatnya.
--
-- Kedua, farmasi tidak punya tempat melihat resep masuk sama sekali. View
-- `v_resep_menunggu` sudah dibuat di migrasi 0023 untuk itu, lalu tidak
-- pernah ada satu baris pun di aplikasi yang membacanya.
--
-- Bentuk barunya, dan tiap perpindahan dilakukan orang yang benar-benar
-- mengerjakannya:
--
--   final      dokter menyelesaikan resep, muncul di layar farmasi
--   disiapkan  FARMASI mulai menyiapkan, kasir sudah boleh menagih
--   siap       FARMASI selesai, obat menunggu dibayar
--   dilayani   FARMASI menyerahkan ke pasien, sesudah pembayaran
--
-- `dilayani` sengaja TIDAK diganti namanya jadi `diserahkan`. Baris lama
-- sudah memakai nilai itu, dan mengganti nama nilai status berarti menyentuh
-- data yang sudah tercatat. Yang berubah adalah SIAPA yang menuliskannya dan
-- KAPAN, bukan hurufnya.
--
-- Catatan untuk yang membaca data lama: baris `dilayani` sebelum migrasi ini
-- ditulis kasir saat pembayaran, jadi `dilayani_pada` di baris-baris itu
-- adalah waktu BAYAR, bukan waktu serah. Tidak bisa diperbaiki surut, dan
-- menebaknya lebih buruk daripada membiarkannya.

-- ------------------------------------------------------------
-- 1. Dua keadaan baru, dan jejak siapa mengerjakannya
-- ------------------------------------------------------------

alter table public.prescriptions
  add column if not exists disiapkan_pada  timestamptz,
  add column if not exists disiapkan_oleh  text,
  add column if not exists siap_pada       timestamptz,
  add column if not exists diserahkan_oleh text,
  add column if not exists serah_tanpa_bayar boolean not null default false,
  add column if not exists alasan_tanpa_bayar text;

comment on column public.prescriptions.diserahkan_oleh is
  'Email petugas farmasi yang MENYERAHKAN obatnya. Beda dengan yang menerima uangnya.';
comment on column public.prescriptions.serah_tanpa_bayar is
  'Obat diserahkan sebelum pembayaran tercatat. Sengaja disimpan supaya bisa ditelusuri, bukan supaya dilarang.';

do $$
begin
  alter table public.prescriptions drop constraint if exists resep_status_check;
  alter table public.prescriptions add constraint resep_status_check
    check (status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani', 'batal'));
end $$;

-- ------------------------------------------------------------
-- 2. Kasir mencatat pembayaran, TIDAK menyatakan penyerahan
-- ------------------------------------------------------------

create or replace function public.tandai_resep_dibayar(p_resep uuid, p_transaksi uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  update public.prescriptions
     set transaction_id = coalesce(transaction_id, p_transaksi)
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
     and status <> 'batal'
  returning * into v_row;
  if not found then
    raise exception 'Resep tidak ditemukan, atau sudah dibatalkan.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_row.company_id, 'resep.dibayar', 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'transaksi', p_transaksi));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.tandai_resep_dibayar(uuid, uuid) from public, anon;
grant execute on function public.tandai_resep_dibayar(uuid, uuid) to authenticated;

-- Nama lama DIPERTAHANKAN dan sekarang cuma mencatat pembayaran.
--
-- Bukan karena namanya masih cocok (tidak), tapi karena migrasi dijalankan
-- tangan lewat SQL Editor sedangkan aplikasinya berangkat lewat deploy, dan
-- keduanya tidak pernah tiba bersamaan. Kalau fungsinya dihapus dan migrasinya
-- lebih dulu sampai, kasir berhenti bekerja di tengah antrean. Yang penting
-- sekarang: dijalankan lewat jalur mana pun, ia TIDAK LAGI menyatakan obat
-- sudah diserahkan.
create or replace function public.tandai_resep_dilayani(p_resep uuid, p_transaksi uuid)
returns jsonb
language sql security definer set search_path = public, pg_temp
as $$
  select public.tandai_resep_dibayar(p_resep, p_transaksi);
$$;

revoke all on function public.tandai_resep_dilayani(uuid, uuid) from public, anon;
grant execute on function public.tandai_resep_dilayani(uuid, uuid) to authenticated;

comment on function public.tandai_resep_dilayani(uuid, uuid) is
  'USANG sejak migrasi 0035, dipertahankan supaya kasir versi lama tidak patah. Sekarang cuma mencatat pembayaran. Yang menyatakan penyerahan adalah serahkan_resep().';

-- ------------------------------------------------------------
-- 3. Farmasi memindahkan keadaan penyiapan
-- ------------------------------------------------------------

create or replace function public.ubah_status_resep(p_resep uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row   record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  if p_status not in ('final', 'disiapkan', 'siap') then
    raise exception 'Keadaan resep "%" tidak dikenal di sini. Penyerahan lewat serahkan_resep().', p_status
      using errcode = 'SH004';
  end if;

  select * into v_row from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- Draf tidak boleh masuk antrean penyiapan. Draf artinya dokter belum
  -- selesai berpikir, dan obat yang disiapkan dari draf adalah obat yang
  -- tidak pernah diperintahkan. Aturan yang sama sudah ditulis di migrasi
  -- 0023 untuk antreannya.
  if v_row.status = 'draf' then
    raise exception 'Resep ini masih draf. Dokter harus memfinalkannya dulu.' using errcode = 'SH004';
  end if;
  if v_row.status in ('dilayani', 'batal') then
    raise exception 'Resep ini sudah selesai, keadaannya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status         = p_status,
         disiapkan_pada = case when p_status = 'disiapkan' then coalesce(disiapkan_pada, now())
                               when p_status = 'final' then null else disiapkan_pada end,
         disiapkan_oleh = case when p_status = 'disiapkan' then coalesce(disiapkan_oleh, v_email)
                               when p_status = 'final' then null else disiapkan_oleh end,
         siap_pada      = case when p_status = 'siap' then now() else null end
   where id = p_resep
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'resep.' || p_status, 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'oleh', v_email));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.ubah_status_resep(uuid, text) from public, anon;
grant execute on function public.ubah_status_resep(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4. Penyerahan, dan syaratnya
-- ------------------------------------------------------------

/**
 * Menyatakan obat BENAR-BENAR berpindah tangan.
 *
 * Menuntut pembayaran sudah tercatat, karena itulah seluruh gunanya jabat
 * tangan ini. Tapi tidak memalang mati: `p_tanpa_bayar` membuka jalannya
 * dengan syarat alasannya ditulis, dan alasannya masuk ke jejak audit.
 *
 * Itu bukan kelonggaran yang malas. Klinik punya keadaan sah di mana obat
 * berangkat lebih dulu, dan palang yang tidak bisa dilewati akan diakali
 * dengan cara yang tidak meninggalkan jejak sama sekali: menekan tombol
 * bayar padahal belum dibayar. Lebih baik jalannya ada dan tercatat.
 */
create or replace function public.serahkan_resep(
  p_resep uuid,
  p_tanpa_bayar boolean default false,
  p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row    record;
  v_visit  record;
  v_email  text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_bayar  uuid;
begin
  select * into v_row from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_row.status = 'dilayani' then
    return to_jsonb(v_row);
  end if;
  if v_row.status in ('draf', 'batal') then
    raise exception 'Resep ini belum difinalkan atau sudah dibatalkan, jadi tidak bisa diserahkan.'
      using errcode = 'SH004';
  end if;

  select * into v_visit from public.visits where id = v_row.visit_id;
  v_bayar := coalesce(v_row.transaction_id, v_visit.transaction_id);

  if v_bayar is null and not coalesce(p_tanpa_bayar, false) then
    raise exception 'Pembayaran resep ini belum tercatat, jadi obatnya belum boleh diserahkan.'
      using errcode = 'SH004';
  end if;
  if v_bayar is null and coalesce(trim(p_alasan), '') = '' then
    raise exception 'Menyerahkan obat sebelum pembayaran harus disertai alasan.'
      using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status             = 'dilayani',
         dilayani_pada      = now(),
         diserahkan_oleh    = v_email,
         transaction_id     = coalesce(transaction_id, v_bayar),
         serah_tanpa_bayar  = (v_bayar is null),
         alasan_tanpa_bayar = case when v_bayar is null then trim(p_alasan) else null end
   where id = p_resep
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'resep.diserahkan', 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'oleh', v_email,
                       'tanpa_bayar', v_row.serah_tanpa_bayar,
                       'alasan', v_row.alasan_tanpa_bayar));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.serahkan_resep(uuid, boolean, text) from public, anon;
grant execute on function public.serahkan_resep(uuid, boolean, text) to authenticated;

-- ------------------------------------------------------------
-- 5. Antrean farmasi, sekarang membawa keadaan uangnya
-- ------------------------------------------------------------
-- Penanda `sudah_bayar` diambil dari resep ATAU dari kunjungannya. Kasir
-- menautkan keduanya, tapi membaca salah satu saja berarti ada keadaan di
-- mana farmasi melihat "belum bayar" pada pasien yang sudah membayar, lalu
-- menahan obatnya di depan orang yang sudah menyerahkan uang.

-- DROP lalu CREATE, bukan CREATE OR REPLACE. Postgres menolak `create or
-- replace view` yang menggeser urutan kolom lama, dan kolom baru di sini
-- disisipkan di tengah supaya isinya masih terbaca berkelompok. Kolom
-- tambahan boleh saja ditaruh di ujung untuk menghindari ini, tapi view yang
-- urutan kolomnya ditentukan riwayat penyuntingan akan makin susah dibaca
-- tiap kali disentuh.
drop view if exists public.v_resep_menunggu;
create view public.v_resep_menunggu as
select
  r.id, r.company_id, r.nomor, r.status, r.dokter_email, r.catatan,
  r.ditulis_pada, r.difinalkan_pada, r.disiapkan_pada, r.disiapkan_oleh, r.siap_pada,
  v.id as visit_id, v.nomor_antre, v.status as status_kunjungan, v.poli, v.penjamin,
  p.id as pasien_id, p.nama as pasien_nama, p.nomor_rm, p.alergi,
  (select count(*) from public.prescription_items i where i.prescription_id = r.id)::integer as jumlah_item,
  (coalesce(r.transaction_id, v.transaction_id) is not null) as sudah_bayar,
  coalesce(r.transaction_id, v.transaction_id) as transaction_id
from public.prescriptions r
join public.visits v   on v.id = r.visit_id
join public.patients p on p.id = v.patient_id
where r.status in ('final', 'disiapkan', 'siap')
  and v.tanggal = current_date;

alter view public.v_resep_menunggu set (security_invoker = on);
revoke all on public.v_resep_menunggu from public, anon;
grant select on public.v_resep_menunggu to authenticated;

-- ------------------------------------------------------------
-- 6. Antrean kunjungan ikut tahu keadaan resepnya
-- ------------------------------------------------------------
-- Tanpa ini, kunjungan yang resepnya sedang disiapkan tampil seolah resepnya
-- belum ada sama sekali di layar Kunjungan dan Kasir.

drop view if exists public.v_antrean_hari_ini;
create view public.v_antrean_hari_ini as
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
  v.transaction_id,
  (select r.status from public.prescriptions r
    where r.visit_id = v.id
      and r.status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
    order by r.ditulis_pada desc limit 1) as status_resep,
  (select r.id from public.prescriptions r
    where r.visit_id = v.id and r.status <> 'batal'
    order by r.ditulis_pada desc limit 1) as resep_id
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
