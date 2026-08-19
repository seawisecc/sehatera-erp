-- ============================================================
-- 0059  Identitas pasien: kolom pendukung, kerabat, dan kewajiban isian
-- ============================================================
--
-- Permintaan pemilik: identitas pasien jadi wajib diisi (KTP, telepon), plus
-- data kerabat dan data pendukung lain. Sekalian membetulkan satu bentuk yang
-- memang salah sejak awal.
--
-- **Penjamin BUKAN sifat orangnya.** `patients.penjamin` memaksa tiap pasien
-- punya satu status: umum ATAU bpjs ATAU asuransi. Kenyataannya satu orang
-- bisa punya kartu BPJS sekaligus asuransi kantor, dan yang menanggung
-- kunjungan HARI INI ditentukan saat pendaftaran, bukan setahun lalu waktu ia
-- pertama kali didaftarkan. Kolomnya tidak dibuang (baris lama memakainya, dan
-- ia masih jadi bawaan yang berguna), tapi yang tersimpan di pasien sekarang
-- adalah NOMOR KARTUNYA, yang memang menempel pada orangnya: `nomor_bpjs` dan
-- `nomor_polis`. Yang memilih penanggung tetap layar pendaftaran.
--
-- **Kewajiban identitas ditegakkan di sini, bukan cuma di layar.** Alasannya
-- sama seperti kuota: impor CSV menembak tabel langsung, dan pengecekan yang
-- cuma ada di form akan dilewati tanpa jejak.
--
-- **Tapi palangnya punya pintu, dan pintunya meninggalkan jejak.** Pasien yang
-- datang tidak sadarkan diri tidak punya KTP di tangan, dan petugas yang tidak
-- bisa mendaftarkannya akan mengarang NIK enam belas angka supaya formulirnya
-- mau lewat. NIK karangan lebih berbahaya daripada NIK kosong: ia terlihat
-- seperti data, ikut terkirim ke SatuSehat, dan menempel pada orang lain.
-- Jadi ada `identitas_belum_lengkap` yang HARUS disertai alasan, tercatat di
-- barisnya dan di jejak audit. Pola yang sama dengan `p_tanpa_bayar` pada
-- `serahkan_resep()` di migrasi 0035: palang yang tidak bisa dilewati akan
-- diakali dengan cara yang tidak meninggalkan jejak sama sekali.
--
-- Bentuk alamatnya dipecah (kelurahan, kecamatan, kota, provinsi, kode pos,
-- RT/RW) mengikuti aturan lama project ini: SatuSehat mewajibkan `address`
-- berkolom, dan menambah kolom kosong sekarang jauh lebih murah daripada
-- membelah alamat setahun yang terlanjur tertulis sebagai satu baris bebas.
-- `alamat` yang lama tetap ada sebagai baris jalannya.

alter table public.patients
  add column if not exists tempat_lahir      text,
  add column if not exists agama             text,
  add column if not exists pekerjaan         text,
  add column if not exists pendidikan        text,
  add column if not exists status_kawin      text,
  add column if not exists kewarganegaraan   text,
  add column if not exists rt                text,
  add column if not exists rw                text,
  add column if not exists kelurahan         text,
  add column if not exists kecamatan         text,
  add column if not exists kota              text,
  add column if not exists provinsi          text,
  add column if not exists kode_pos          text,
  add column if not exists nomor_bpjs        text,
  add column if not exists nomor_polis       text,
  add column if not exists kerabat_nama      text,
  add column if not exists kerabat_hubungan  text,
  add column if not exists kerabat_telepon   text,
  add column if not exists kerabat_alamat    text,
  add column if not exists identitas_belum_lengkap boolean not null default false,
  add column if not exists alasan_identitas  text;

comment on column public.patients.identitas_belum_lengkap is
  'Ditandai saat NIK atau telepon tidak bisa diisi (gawat darurat, kartu tertinggal). Wajib disertai alasan, dan alasannya masuk jejak audit.';
comment on column public.patients.nomor_bpjs is
  'Menempel pada ORANGNYA. Yang menanggung satu kunjungan ditentukan saat pendaftaran, bukan dari sini.';
comment on column public.patients.penjamin is
  'Bawaan saat mendaftarkan kunjungan. BUKAN sifat pasien: satu orang bisa punya BPJS sekaligus asuransi.';

-- Daftar nilai ditulis sebagai yang ADA, dan `is null` dilewatkan supaya baris
-- lama tidak jadi tidak sah karena kolom yang belum pernah ada.
alter table public.patients drop constraint if exists patients_status_kawin_check;
alter table public.patients add constraint patients_status_kawin_check
  check (status_kawin is null or status_kawin in ('belum_kawin', 'kawin', 'cerai_hidup', 'cerai_mati'));

create index if not exists idx_patients_telepon on public.patients (company_id, telepon);

-- ------------------------------------------------------------
-- simpan_pasien: kolom baru, dan kewajiban identitas
-- ------------------------------------------------------------
-- Disalin dari migrasi 0022 lalu ditambah, bukan ditulis ulang dari ingatan.
-- Menulis ulang fungsi dari ingatan sudah dua kali menjatuhkan hal yang tidak
-- terlihat di layar: penomoran dokumen, nama aksi audit, dan urutan
-- pengambilan dokter.

create or replace function public.simpan_pasien(
  p_id      uuid,
  p_data    jsonb,
  p_company uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := case when p_company is not null and public.boleh_admin_platform()
                         then p_company else public.auth_company_id() end;
  v_nama    text := nullif(trim(p_data ->> 'nama'), '');
  v_nik     text := nullif(trim(p_data ->> 'nik'), '');
  v_telepon text := nullif(trim(p_data ->> 'telepon'), '');
  v_darurat boolean := coalesce((p_data ->> 'identitas_belum_lengkap')::boolean, false);
  v_alasan  text := nullif(trim(p_data ->> 'alasan_identitas'), '');
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if v_nama is null then
    raise exception 'Nama pasien wajib diisi.' using errcode = 'SH004';
  end if;
  if v_nik is not null and v_nik !~ '^[0-9]{16}$' then
    raise exception 'NIK harus 16 angka.' using errcode = 'SH004';
  end if;

  if v_darurat then
    if v_alasan is null then
      raise exception 'Kalau identitas belum lengkap, alasannya wajib ditulis. Alasan itu yang membedakan pasien gawat darurat dari data yang asal diisi.'
        using errcode = 'SH004';
    end if;
  else
    if v_nik is null then
      raise exception 'NIK wajib diisi. Kalau pasiennya memang tidak bisa menunjukkan KTP, tandai "identitas belum lengkap" dan tulis alasannya, jangan mengarang nomor.'
        using errcode = 'SH004';
    end if;
    if v_telepon is null then
      raise exception 'Nomor telepon wajib diisi. Tanpa itu klinik tidak bisa menghubungi pasien untuk hasil pemeriksaan atau kontrol.'
        using errcode = 'SH004';
    end if;
    v_alasan := null;
  end if;

  if p_id is null then
    insert into public.patients (
      company_id, nomor_rm, nama, nik, tanggal_lahir, jenis_kelamin,
      alamat, telepon, gol_darah, alergi, penjamin, nomor_penjamin, catatan,
      tempat_lahir, agama, pekerjaan, pendidikan, status_kawin, kewarganegaraan,
      rt, rw, kelurahan, kecamatan, kota, provinsi, kode_pos,
      nomor_bpjs, nomor_polis,
      kerabat_nama, kerabat_hubungan, kerabat_telepon, kerabat_alamat,
      identitas_belum_lengkap, alasan_identitas)
    values (
      v_company,
      public.next_doc_number(v_company, 'patients', 'nomor_rm', 'RM', to_char(current_date, 'YYYY')),
      v_nama, v_nik,
      nullif(p_data ->> 'tanggal_lahir', '')::date,
      nullif(p_data ->> 'jenis_kelamin', ''),
      nullif(trim(p_data ->> 'alamat'), ''),
      v_telepon,
      nullif(trim(p_data ->> 'gol_darah'), ''),
      nullif(trim(p_data ->> 'alergi'), ''),
      coalesce(nullif(p_data ->> 'penjamin', ''), 'umum'),
      nullif(trim(p_data ->> 'nomor_penjamin'), ''),
      nullif(trim(p_data ->> 'catatan'), ''),
      nullif(trim(p_data ->> 'tempat_lahir'), ''),
      nullif(trim(p_data ->> 'agama'), ''),
      nullif(trim(p_data ->> 'pekerjaan'), ''),
      nullif(trim(p_data ->> 'pendidikan'), ''),
      nullif(trim(p_data ->> 'status_kawin'), ''),
      nullif(trim(p_data ->> 'kewarganegaraan'), ''),
      nullif(trim(p_data ->> 'rt'), ''),
      nullif(trim(p_data ->> 'rw'), ''),
      nullif(trim(p_data ->> 'kelurahan'), ''),
      nullif(trim(p_data ->> 'kecamatan'), ''),
      nullif(trim(p_data ->> 'kota'), ''),
      nullif(trim(p_data ->> 'provinsi'), ''),
      nullif(trim(p_data ->> 'kode_pos'), ''),
      nullif(trim(p_data ->> 'nomor_bpjs'), ''),
      nullif(trim(p_data ->> 'nomor_polis'), ''),
      nullif(trim(p_data ->> 'kerabat_nama'), ''),
      nullif(trim(p_data ->> 'kerabat_hubungan'), ''),
      nullif(trim(p_data ->> 'kerabat_telepon'), ''),
      nullif(trim(p_data ->> 'kerabat_alamat'), ''),
      v_darurat, v_alasan)
    returning * into v_row;

    perform public.catat_audit(v_company, 'pasien.didaftarkan', 'patients', v_row.id::text,
      jsonb_build_object('nomor_rm', v_row.nomor_rm, 'nama', v_nama,
                         'identitas_belum_lengkap', v_darurat, 'alasan', v_alasan));
  else
    update public.patients set
      nama           = v_nama,
      nik            = v_nik,
      tanggal_lahir  = nullif(p_data ->> 'tanggal_lahir', '')::date,
      jenis_kelamin  = nullif(p_data ->> 'jenis_kelamin', ''),
      alamat         = nullif(trim(p_data ->> 'alamat'), ''),
      telepon        = v_telepon,
      gol_darah      = nullif(trim(p_data ->> 'gol_darah'), ''),
      alergi         = nullif(trim(p_data ->> 'alergi'), ''),
      penjamin       = coalesce(nullif(p_data ->> 'penjamin', ''), 'umum'),
      nomor_penjamin = nullif(trim(p_data ->> 'nomor_penjamin'), ''),
      catatan        = nullif(trim(p_data ->> 'catatan'), ''),
      tempat_lahir   = nullif(trim(p_data ->> 'tempat_lahir'), ''),
      agama          = nullif(trim(p_data ->> 'agama'), ''),
      pekerjaan      = nullif(trim(p_data ->> 'pekerjaan'), ''),
      pendidikan     = nullif(trim(p_data ->> 'pendidikan'), ''),
      status_kawin   = nullif(trim(p_data ->> 'status_kawin'), ''),
      kewarganegaraan = nullif(trim(p_data ->> 'kewarganegaraan'), ''),
      rt             = nullif(trim(p_data ->> 'rt'), ''),
      rw             = nullif(trim(p_data ->> 'rw'), ''),
      kelurahan      = nullif(trim(p_data ->> 'kelurahan'), ''),
      kecamatan      = nullif(trim(p_data ->> 'kecamatan'), ''),
      kota           = nullif(trim(p_data ->> 'kota'), ''),
      provinsi       = nullif(trim(p_data ->> 'provinsi'), ''),
      kode_pos       = nullif(trim(p_data ->> 'kode_pos'), ''),
      nomor_bpjs     = nullif(trim(p_data ->> 'nomor_bpjs'), ''),
      nomor_polis    = nullif(trim(p_data ->> 'nomor_polis'), ''),
      kerabat_nama     = nullif(trim(p_data ->> 'kerabat_nama'), ''),
      kerabat_hubungan = nullif(trim(p_data ->> 'kerabat_hubungan'), ''),
      kerabat_telepon  = nullif(trim(p_data ->> 'kerabat_telepon'), ''),
      kerabat_alamat   = nullif(trim(p_data ->> 'kerabat_alamat'), ''),
      identitas_belum_lengkap = v_darurat,
      alasan_identitas        = v_alasan
     where id = p_id and (public.boleh_admin_platform() or company_id = v_company)
    returning * into v_row;

    if not found then
      raise exception 'Pasien tidak ditemukan.' using errcode = 'SH004';
    end if;

    perform public.catat_audit(v_company, 'pasien.diubah', 'patients', p_id::text,
      jsonb_build_object('nomor_rm', v_row.nomor_rm, 'nama', v_nama,
                         'identitas_belum_lengkap', v_darurat, 'alasan', v_alasan));
  end if;

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'NIK ini sudah terdaftar atas pasien lain. Cari dulu di daftar pasien sebelum mendaftarkan yang baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.simpan_pasien(uuid, jsonb, uuid) from public, anon;
grant execute on function public.simpan_pasien(uuid, jsonb, uuid) to authenticated;
