-- ============================================================
-- 0068  Siap ditagih: dokter yang menyatakannya, bukan layar yang menebak
-- ============================================================
--
-- Layar Kasir sudah memasang lencana "SIAP DITAGIH" sejak 0047, tapi tidak ada
-- apa pun di database yang berarti itu. Lencananya HIJAU SECARA BAWAAN: yang
-- tidak sedang menunggu farmasi dan tidak punya resep draf dianggap siap, jadi
-- pasien yang dokternya masih mengetik SOAP tampil sama persis dengan pasien
-- yang pemeriksaannya sudah tuntas.
--
-- Akibatnya satu arah, dan arahnya mahal: kasir menagih SEBELUM tindakan
-- dimasukkan, lalu tarif tindakan itu tidak pernah tertagih. Kehilangan yang
-- tidak disadari tidak akan pernah dilaporkan sebagai keluhan, dan ini persis
-- lubang yang sama yang ditutup migrasi 0024 dari sisi yang berbeda.
--
-- **Resep yang difinalkan BUKAN pernyataan siap ditagih.** Ia berarti "farmasi
-- boleh mulai menyiapkan", dan itu kejadian yang berbeda: tindakan bisa saja
-- belum dimasukkan sama sekali. Menyatukan keduanya adalah kesalahan yang
-- sama bentuknya dengan menyatukan uang dan penyerahan sebelum 0035.
--
-- Yang ditambahkan cuma penanda di `visits`, BUKAN nilai `status` baru.
-- Menambah nilai status berarti memeriksa tiap tempat yang menyebut nilai
-- lama, dan pola itu sudah menggigit empat kali (0036, 0042, 0045, 0049).
-- Penanda tidak menggigit siapa pun yang tidak membacanya.

alter table public.visits
  add column if not exists siap_tagih_pada    timestamptz,
  add column if not exists siap_tagih_oleh    text,
  add column if not exists siap_tagih_catatan text;

comment on column public.visits.siap_tagih_pada is
  'Kapan sisi klinis menyatakan pemeriksaannya tuntas dan kasir boleh menagih. Kosong berarti BELUM, bukan berarti siap: lencana hijau harus punya sesuatu di belakangnya.';
comment on column public.visits.siap_tagih_catatan is
  'Alasan, kalau pernyataannya menerobos pemeriksaan penunjang yang belum keluar hasilnya.';

create index if not exists idx_visits_siap_tagih
  on public.visits (company_id, tanggal) where siap_tagih_pada is not null;

-- ------------------------------------------------------------
-- Hak: yang menyatakan adalah yang memeriksa
-- ------------------------------------------------------------
-- Kasir sengaja TIDAK diberi hak ini. Kasir yang bisa menyatakan sendiri
-- bahwa tagihannya lengkap sedang menandatangani pekerjaan orang lain, dan
-- pernyataan yang bisa dibuat oleh yang berkepentingan berhenti jadi
-- pernyataan.
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
        when 'penunjang.minta'   then peran in ('pemilik','admin','dokter')
        when 'penunjang.hasil'   then peran in ('pemilik','admin','analis')
        when 'penunjang.baca'    then peran in ('pemilik','admin','dokter','perawat','analis')
        when 'kunjungan.siap_tagih' then peran in ('pemilik','admin','dokter','perawat')
        else false
      end
      from (select public.peran_saya() as peran) x
    ), false)
  end;
$$;

revoke all on function public.boleh(text) from public, anon;
grant execute on function public.boleh(text) to authenticated;

-- ------------------------------------------------------------
-- Menyatakan siap ditagih
-- ------------------------------------------------------------
/**
 * Dua penolakan yang KERAS, dan satu yang punya pintu.
 *
 * Resep `draf` ditolak tanpa pintu, karena pintunya yang benar ada dua langkah
 * di sebelahnya: finalkan, atau batalkan. Draf tidak pernah masuk antrean
 * farmasi, jadi kunjungan yang dikirim ke kasir dengan draf menggantung akan
 * menunggu obat yang tidak pernah disiapkan siapa pun (0058).
 *
 * Diagnosis kosong juga ditolak tanpa pintu, karena kunjungan tanpa diagnosis
 * memang tidak bisa ditutup sejak 0018. Menolaknya di sini berarti dokternya
 * yang mendengar, saat ia masih di depan berkasnya. Menolaknya nanti berarti
 * kasir yang mendengar, di depan pasien yang sudah memegang uang.
 *
 * Penunjang yang belum keluar hasilnya PUNYA pintu (`p_paksa`), karena ada
 * kejadian yang benar-benar begitu: rontgen dikerjakan besok, pasien membayar
 * hari ini. Pintunya menuntut alasan, dan alasannya masuk jejak audit. Pola
 * yang sama dengan `p_tanpa_bayar` di 0035 dan `identitas_belum_lengkap` di
 * 0059: palang yang tidak bisa dilewati akan diakali dengan cara yang tidak
 * meninggalkan jejak sama sekali.
 */
create or replace function public.siapkan_tagihan(
  p_visit   uuid,
  p_catatan text default null,
  p_paksa   boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit   record;
  v_draf    integer;
  v_pending integer;
  v_diag    integer;
begin
  perform public.wajib_boleh('kunjungan.siap_tagih');

  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, jadi tagihannya tidak bisa dinyatakan ulang.'
      using errcode = 'SH004';
  end if;
  if v_visit.status = 'terdaftar' then
    raise exception 'Pasien ini belum diperiksa. Tekan "Tiba, mulai periksa" dulu sebelum menyatakan tagihannya siap.'
      using errcode = 'SH004';
  end if;

  select count(*) into v_draf from public.prescriptions
   where visit_id = p_visit and status = 'draf';
  if v_draf > 0 then
    raise exception 'Resepnya masih draf, jadi belum sampai ke farmasi. Finalkan dulu, atau batalkan kalau memang tidak jadi diberi obat.'
      using errcode = 'SH004';
  end if;

  select count(*) into v_diag from public.visit_diagnoses where visit_id = p_visit;
  if v_diag = 0 then
    raise exception 'Kunjungan ini belum punya diagnosis. Tanpa itu ia tidak bisa ditutup kasir, dan BPJS maupun SatuSehat akan menolaknya.'
      using errcode = 'SH004';
  end if;

  select count(*) into v_pending from public.visit_penunjang
   where visit_id = p_visit and status in ('diminta', 'dikerjakan');
  if v_pending > 0 and not p_paksa then
    raise exception 'Masih ada % pemeriksaan penunjang yang belum selesai. Tunggu hasilnya, atau nyatakan siap dengan menuliskan alasannya.', v_pending
      using errcode = 'SH004';
  end if;
  if v_pending > 0 and p_paksa and coalesce(trim(p_catatan), '') = '' then
    raise exception 'Menyatakan siap ditagih sementara pemeriksaannya belum keluar HARUS disertai alasan.'
      using errcode = 'SH004';
  end if;

  update public.visits set
    siap_tagih_pada    = now(),
    siap_tagih_oleh    = lower(auth.jwt() ->> 'email'),
    siap_tagih_catatan = nullif(trim(p_catatan), '')
   where id = p_visit
  returning * into v_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.siap_tagih', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'penunjang_menggantung', v_pending,
                       'alasan', v_visit.siap_tagih_catatan));

  return jsonb_build_object(
    'id', v_visit.id, 'nomor', v_visit.nomor,
    'siap_tagih_pada', v_visit.siap_tagih_pada,
    'siap_tagih_oleh', v_visit.siap_tagih_oleh,
    'siap_tagih_catatan', v_visit.siap_tagih_catatan,
    'penunjang_menggantung', v_pending);
end;
$$;

revoke all on function public.siapkan_tagihan(uuid, text, boolean) from public, anon;
grant execute on function public.siapkan_tagihan(uuid, text, boolean) to authenticated;

-- ------------------------------------------------------------
-- Menariknya kembali
-- ------------------------------------------------------------
/**
 * Dokter yang menekan terlalu cepat harus punya jalan pulang. Tanpa ini,
 * satu-satunya cara menambah tindakan yang terlewat adalah menyuruh kasir
 * menagih dua kali, dan struk kedua untuk satu kedatangan adalah hal yang
 * tidak bisa dijelaskan ke pasien mana pun.
 */
create or replace function public.batal_siap_tagih(p_visit uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
begin
  perform public.wajib_boleh('kunjungan.siap_tagih');

  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup. Yang sudah dibayar tidak bisa dibuka lagi dari sini.'
      using errcode = 'SH004';
  end if;

  update public.visits set
    siap_tagih_pada = null, siap_tagih_oleh = null, siap_tagih_catatan = null
   where id = p_visit
  returning * into v_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.siap_tagih_batal', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor));

  return jsonb_build_object('id', v_visit.id, 'siap_tagih_pada', null);
end;
$$;

revoke all on function public.batal_siap_tagih(uuid) from public, anon;
grant execute on function public.batal_siap_tagih(uuid) to authenticated;

-- ------------------------------------------------------------
-- Biaya yang berubah MENCABUT pernyataannya
-- ------------------------------------------------------------
/**
 * Lewat trigger, bukan dari dalam fungsi yang menambah biaya, alasannya sama
 * seperti pencatat riwayat keadaan di 0018 dan biaya administrasi di 0024:
 * biaya masuk lewat beberapa pintu (tindakan, penunjang, tarif konsultasi poli
 * tujuan saat dirujuk), dan pintu yang ditulis bulan depan tidak akan ingat
 * memanggil pencabutnya.
 *
 * Arahnya sengaja cuma satu: MENCABUT, tidak pernah memasang. Yang menyatakan
 * siap harus tetap manusia.
 */
create or replace function public.cabut_siap_tagih_saat_biaya_berubah()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit uuid := coalesce(new.visit_id, old.visit_id);
begin
  update public.visits
     set siap_tagih_pada = null, siap_tagih_oleh = null, siap_tagih_catatan = null
   where id = v_visit
     and siap_tagih_pada is not null
     and status not in ('selesai', 'batal');
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_cabut_siap_tagih on public.visit_charges;
create trigger trg_cabut_siap_tagih
  after insert or update or delete on public.visit_charges
  for each row execute function public.cabut_siap_tagih_saat_biaya_berubah();

-- ------------------------------------------------------------
-- Antrean membawa penandanya
-- ------------------------------------------------------------
-- Definisinya diambil dari yang SEDANG BERLAKU di database (`pg_get_viewdef`
-- dibandingkan kolom per kolom sebelum migrasi ini ditulis: 39 kolom, urutan
-- sama persis dengan berkas 0047), bukan disalin percaya diri dari berkas
-- migrasi mana pun. Itu yang membuat 0035 kehilangan `nilai_biaya` diam-diam
-- dan mengosongkan layar Kasir seluruhnya.
--
-- Kolom barunya DITARUH DI UJUNG supaya `create or replace view` menerimanya
-- tanpa DROP. DROP adalah alat yang membuang satu-satunya penjaga yang akan
-- mengeluh kalau ada kolom yang hilang.
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
    where r.visit_id = v.id
      and r.status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
    order by r.ditulis_pada desc limit 1) as status_resep,
  (select r.id from public.prescriptions r
    where r.visit_id = v.id and r.status <> 'batal'
    order by r.ditulis_pada desc limit 1) as resep_id,
  coalesce((select sum(c.jumlah * c.harga) from public.visit_charges c
             where c.visit_id = v.id), 0) as nilai_biaya,
  v.transaction_id,
  v.dipanggil_pada,
  v.jumlah_panggil,
  (select count(*) from public.prescription_items i
     join public.prescriptions r on r.id = i.prescription_id
    where r.visit_id = v.id and r.status not in ('batal')
      and i.permintaan_terbuka and i.diisi_pada is null)::integer as obat_belum_dipilih,
  -- Kolom 40 dan seterusnya: yang baru di 0068.
  v.siap_tagih_pada,
  v.siap_tagih_catatan,
  -- Pemeriksaan yang belum keluar hasilnya, supaya layar Kunjungan bisa
  -- mengatakannya SEBELUM tombolnya ditekan, bukan sesudah ditolak.
  (select count(*) from public.visit_penunjang g
    where g.visit_id = v.id and g.status in ('diminta', 'dikerjakan'))::integer as penunjang_menggantung
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;

-- ------------------------------------------------------------
-- Tagihan membawa penandanya juga
-- ------------------------------------------------------------
-- Layar Kasir memuat satu kunjungan lewat sini, jadi penandanya harus ikut ke
-- sini juga: daftar di kiri dan tagihan yang terbuka di kanan tidak boleh
-- mengatakan dua hal yang berbeda tentang kunjungan yang sama.
create or replace function public.tagihan_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_resep record;
  v_biaya jsonb;
  v_obat  jsonb;
  v_pend  integer;
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
   where visit_id = p_visit
     and status in ('final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;

  select count(*) into v_pend from public.visit_penunjang
   where visit_id = p_visit and status in ('diminta', 'dikerjakan');

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
      'alergi', v_visit.alergi,
      'siap_tagih_pada', v_visit.siap_tagih_pada,
      'siap_tagih_oleh', v_visit.siap_tagih_oleh,
      'siap_tagih_catatan', v_visit.siap_tagih_catatan,
      'penunjang_menggantung', v_pend),
    'resep_id', v_resep.id,
    'resep_nomor', v_resep.nomor,
    'resep_status', v_resep.status,
    'biaya', v_biaya,
    'obat',  v_obat);
end;
$$;

revoke all on function public.tagihan_kunjungan(uuid) from public, anon;
grant execute on function public.tagihan_kunjungan(uuid) to authenticated;
