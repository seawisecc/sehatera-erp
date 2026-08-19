-- ============================================================
-- 0070  Perizinan tenaga kesehatan: STR, SIP, dan masa berlakunya
-- ============================================================
--
-- Sampai sekarang identitas penanggung jawab cuma DUA KOTAK TEKS di
-- `settings`: `nama_apoteker` dan `nomor_sipa`. Itu cukup untuk mencetak nama
-- di purchase order, dan tidak cukup untuk apa pun yang lain.
--
-- Tiga hal yang tidak bisa dijawab bentuk lama:
--
-- 1. **Klinik punya lebih dari satu dokter**, dan resep yang dicetak harus
--    membawa nomor izin DOKTER YANG MENULISNYA, bukan nomor satu orang yang
--    kebetulan tersimpan di pengaturan. Resep bernomor izin orang lain adalah
--    dokumen yang salah, bukan dokumen yang kurang rapi.
-- 2. **Izin praktik ADA MASA BERLAKUNYA.** SIP yang habis berarti prakteknya
--    tidak sah hari itu juga, dan yang mengetahuinya belakangan adalah yang
--    diperiksa. Tanggal yang tidak disimpan tidak bisa diingatkan.
-- 3. STR tidak pernah punya tempat sama sekali, padahal SIP diterbitkan DI
--    ATAS STR dan keduanya diminta saat kredensialing BPJS maupun SatuSehat.
--
-- Menempel di `app_users`, BUKAN tabel baru. Dokter sudah ada di sana (peran
-- `dokter`), `unit_doctors` sudah menautkannya ke poli lewat email, dan
-- `visits.dokter_email` sudah menunjuk ke sana juga. Tabel kedua berarti dua
-- daftar nama yang harus tetap sama, dan yang kedua akan ketinggalan pada
-- perbaikan berikutnya.

alter table public.app_users
  add column if not exists nomor_str          text,
  add column if not exists str_sampai         date,
  add column if not exists nomor_sip          text,
  add column if not exists sip_mulai          date,
  add column if not exists sip_sampai         date,
  add column if not exists spesialisasi       text,
  add column if not exists ihs_practitioner_id text;

comment on column public.app_users.nomor_sip is
  'Nomor SIP (dokter) atau SIPA (apoteker). Yang tercetak di resep adalah milik dokter yang MENULIS resep itu, bukan milik penanggung jawab faskes.';
comment on column public.app_users.sip_sampai is
  'Habis berlakunya. Kosong berarti belum diisi, BUKAN berarti berlaku selamanya: layarnya membedakan keduanya.';
comment on column public.app_users.ihs_practitioner_id is
  'Practitioner di SatuSehat. Disiapkan sekarang karena menambah kolom kosong itu murah, sedangkan data setahun yang tidak bisa dikirim tidak bisa diperbaiki tanpa mengetik ulang.';

-- ------------------------------------------------------------
-- Daftar tenaga kesehatan beserta keadaan izinnya
-- ------------------------------------------------------------
/**
 * `sisa_hari` dihitung di database, bukan di peramban.
 *
 * Kalau dihitung di layar, ia memakai jam komputer klinik, dan komputer klinik
 * yang jamnya meleset dua bulan adalah hal yang benar-benar terjadi. Tanggal
 * kedaluwarsa izin bukan tempat untuk mempercayai jam yang tidak diperiksa
 * siapa pun.
 *
 * Nilai negatif berarti SUDAH LEWAT, dan itu sengaja tidak dibulatkan jadi
 * nol: selisihnya adalah berapa lama praktik berjalan tanpa izin yang sah,
 * dan itu angka yang harus terbaca.
 */
create or replace function public.tenaga_kesehatan(p_company uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_co  uuid := case when p_company is not null and v_adm
                     then p_company else public.auth_company_id() end;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', u.id, 'nama', u.nama, 'email', u.email, 'role', u.role,
             'status', u.status, 'spesialisasi', u.spesialisasi,
             'nomor_str', u.nomor_str, 'str_sampai', u.str_sampai,
             'nomor_sip', u.nomor_sip,
             'sip_mulai', u.sip_mulai, 'sip_sampai', u.sip_sampai,
             'ihs_practitioner_id', u.ihs_practitioner_id,
             'sisa_hari', case when u.sip_sampai is null then null
                               else (u.sip_sampai - current_date) end,
             'str_sisa_hari', case when u.str_sampai is null then null
                                   else (u.str_sampai - current_date) end,
             'poli', coalesce((
               select jsonb_agg(c.nama order by c.nama)
                 from public.unit_doctors d
                 join public.clinic_units c on c.id = d.unit_id
                where d.company_id = v_co and lower(d.email) = lower(u.email)), '[]'::jsonb))
           order by u.role, u.nama)
      from public.app_users u
     where u.company_id = v_co
       and u.role in ('dokter', 'apoteker', 'asisten_apoteker', 'perawat', 'analis')), '[]'::jsonb);
end;
$$;

revoke all on function public.tenaga_kesehatan(uuid) from public, anon;
grant execute on function public.tenaga_kesehatan(uuid) to authenticated;

-- ------------------------------------------------------------
-- Menyimpan perizinan
-- ------------------------------------------------------------
/**
 * Sengaja TIDAK lewat `update app_users` langsung dari peramban.
 *
 * Policy tenant di `app_users` mengizinkan menulis barisnya, dan RLS menyaring
 * BARIS bukan KOLOM (aturan lama project ini): layar yang boleh menyunting
 * nomor SIP otomatis boleh menyunting `role` juga, dan `role` adalah seluruh
 * hak akses orang itu. Fungsi ini cuma menyentuh kolom perizinan, jadi jalur
 * ini tidak bisa dipakai menaikkan peran diri sendiri.
 */
create or replace function public.simpan_perizinan(
  p_id      uuid,
  p_data    jsonb,
  p_company uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
  v_row   record;
  v_mulai date := nullif(p_data ->> 'sip_mulai', '')::date;
  v_sampai date := nullif(p_data ->> 'sip_sampai', '')::date;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak mengubah perizinan tenaga kesehatan.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if v_mulai is not null and v_sampai is not null and v_sampai < v_mulai then
    raise exception 'Masa berlaku berakhir sebelum ia mulai.' using errcode = 'SH004';
  end if;

  update public.app_users set
    nama                = coalesce(nullif(trim(p_data ->> 'nama'), ''), nama),
    spesialisasi        = nullif(trim(p_data ->> 'spesialisasi'), ''),
    nomor_str           = nullif(trim(p_data ->> 'nomor_str'), ''),
    str_sampai          = nullif(p_data ->> 'str_sampai', '')::date,
    nomor_sip           = nullif(trim(p_data ->> 'nomor_sip'), ''),
    sip_mulai           = v_mulai,
    sip_sampai          = v_sampai,
    ihs_practitioner_id = nullif(trim(p_data ->> 'ihs_practitioner_id'), '')
   where id = p_id and company_id = v_co
  returning * into v_row;

  if not found then
    raise exception 'Tenaga kesehatan tidak ditemukan di fasilitas ini.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_co, 'perizinan.simpan', 'app_users', p_id::text,
    jsonb_build_object('nama', v_row.nama, 'sip_sampai', v_row.sip_sampai));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.simpan_perizinan(uuid, jsonb, uuid) from public, anon;
grant execute on function public.simpan_perizinan(uuid, jsonb, uuid) to authenticated;

-- ------------------------------------------------------------
-- Resep membawa izin penulisnya
-- ------------------------------------------------------------
/**
 * `resep_untuk_cetak()`: satu panggilan berisi semua yang harus ada di kertas
 * resep, termasuk identitas dokter penulisnya.
 *
 * Dikumpulkan di sini dan bukan dirakit di peramban dari tiga kueri, alasan
 * yang sama dengan `tagihan_kunjungan` di 0024: kalau terpisah, ada jeda di
 * mana sebagian sudah sampai dan sebagian belum, dan resep yang tercetak
 * kurang satu baris baru ketahuan sesudah pasiennya pulang.
 *
 * Nomor izin diambil dari dokter yang tercatat di KUNJUNGANNYA, bukan dari
 * penanggung jawab faskes. Kalau dokternya belum mengisi izinnya, kolomnya
 * kosong dan layarnya mengatakan itu; mengisinya dengan nomor orang lain jauh
 * lebih buruk daripada mengosongkannya.
 */
create or replace function public.resep_untuk_cetak(p_resep uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_r     record;
  v_v     record;
  v_p     record;
  v_dok   record;
  v_items jsonb;
begin
  perform public.wajib_boleh('resep.baca');

  select * into v_r from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  select v.*, u.nama as unit_nama into v_v
    from public.visits v
    left join public.clinic_units u on u.id = v.unit_id
   where v.id = v_r.visit_id;

  select * into v_p from public.patients where id = v_v.patient_id;

  select * into v_dok from public.app_users
   where company_id = v_r.company_id
     and lower(email) = lower(coalesce(v_r.dokter_email, v_v.dokter_email, ''))
   limit 1;

  v_items := coalesce((
    select jsonb_agg(jsonb_build_object(
             'nama_obat', i.nama_obat, 'jumlah', i.jumlah, 'satuan', i.satuan,
             'dosis', i.dosis, 'frekuensi', i.frekuensi, 'rute', i.rute,
             'aturan_pakai', i.aturan_pakai, 'catatan', i.catatan,
             'permintaan_terbuka', i.permintaan_terbuka,
             'permintaan_asli', i.permintaan_asli)
           order by i.urutan)
      from public.prescription_items i where i.prescription_id = p_resep), '[]'::jsonb);

  return jsonb_build_object(
    'resep', jsonb_build_object(
      'id', v_r.id, 'nomor', v_r.nomor, 'status', v_r.status,
      'ditulis_pada', v_r.ditulis_pada, 'catatan', v_r.catatan),
    'kunjungan', jsonb_build_object(
      'id', v_v.id, 'nomor', v_v.nomor, 'tanggal', v_v.tanggal,
      'poli', v_v.unit_nama, 'penjamin', v_v.penjamin),
    'pasien', jsonb_build_object(
      'nama', v_p.nama, 'nomor_rm', v_p.nomor_rm, 'tanggal_lahir', v_p.tanggal_lahir,
      'jenis_kelamin', v_p.jenis_kelamin, 'alamat', v_p.alamat, 'alergi', v_p.alergi,
      'umur', case when v_p.tanggal_lahir is null then null
                   else extract(year from age(current_date, v_p.tanggal_lahir))::integer end),
    'dokter', jsonb_build_object(
      'nama', coalesce(v_dok.nama, v_r.dokter_email, v_v.dokter_email),
      'email', coalesce(v_r.dokter_email, v_v.dokter_email),
      'spesialisasi', v_dok.spesialisasi,
      'nomor_sip', v_dok.nomor_sip,
      'nomor_str', v_dok.nomor_str,
      'sip_sampai', v_dok.sip_sampai,
      'sip_habis', case when v_dok.sip_sampai is null then null
                        else v_dok.sip_sampai < current_date end),
    'items', v_items);
end;
$$;

revoke all on function public.resep_untuk_cetak(uuid) from public, anon;
grant execute on function public.resep_untuk_cetak(uuid) to authenticated;
