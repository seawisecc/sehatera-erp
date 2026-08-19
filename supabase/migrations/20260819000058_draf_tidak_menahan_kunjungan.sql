-- ============================================================
-- 0058  Draf resep tidak menahan kunjungan, dan satu pesan yang bisa dipakai
-- ============================================================
--
-- Dua hal yang ketahuan saat memeriksa ulang alurnya dari awal, bukan dari
-- galat. Keduanya jenis kesalahan yang tidak pernah melapor sendiri.
--
-- **1. Kunjungan dengan resep DRAF menggantung terbuka selamanya.**
--
-- Draf tidak pernah masuk antrean farmasi, jadi tidak ada yang menyiapkannya.
-- Tapi `tandai_kunjungan_dibayar` menghitung setiap resep yang bukan `batal`
-- sebagai resep yang belum diserahkan, jadi kasir tidak boleh menutup
-- kunjungannya. Farmasi tidak melihatnya, kasir tidak boleh menutupnya, dan
-- sejak tombol maju di layar Kunjungan dibuang (rel sudah bergeser sendiri)
-- tidak ada lagi jalan memaksanya lewat. Kunjungan itu terbuka selamanya, dan
-- tetap muncul di papan ruang tunggu keesokan harinya.
--
-- Yang membuatnya mudah terjadi: dokter menekan "Simpan Draf" lalu pasiennya
-- ternyata tidak jadi diberi obat.
--
-- **2. "Coba lagi sebentar lagi. (23505)" saat membuat reservasi kembar.**
--
-- Satu pasien tidak boleh punya dua janji terbuka di poli dan hari yang sama,
-- dan itu benar. Yang salah pesannya: `pesanError()` hanya meloloskan SQLSTATE
-- SH001..SH007 apa adanya, jadi pelanggaran indeks unik keluar sebagai ajakan
-- mencoba lagi, padahal mencoba lagi tidak akan pernah berhasil.
--
-- `daftar_kunjungan` sudah menangkap yang setara sejak 0022. Modul reservasi
-- ditulis tanpa menirunya, dan itu terlewat.

create or replace function public.tandai_kunjungan_dibayar(p_visit uuid, p_transaksi uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row   record;
  v_resep boolean;
begin
  update public.visits
     set transaction_id = coalesce(transaction_id, p_transaksi)
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
  returning * into v_row;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- `draf` TIDAK dihitung sebagai resep yang menahan kunjungan.
  --
  -- Draf tidak pernah masuk antrean farmasi, jadi tidak ada seorang pun yang
  -- sedang menyiapkannya. Tapi ia terhitung sebagai resep yang belum
  -- diserahkan, sehingga kasir tidak boleh menutup kunjungannya, sementara
  -- farmasi juga tidak akan pernah melihatnya.
  --
  -- Drafnya sendiri tidak disentuh di sini: membatalkan tulisan dokter dari
  -- dalam fungsi kasir adalah keputusan yang bukan milik kasir. Layar resep
  -- yang menyediakan tombolnya.
  select exists (select 1 from public.prescriptions r
                  where r.visit_id = p_visit and r.status not in ('batal', 'draf'))
    into v_resep;

  -- Tanpa resep, pembayaran adalah kejadian terakhir kunjungan ini.
  if not v_resep and v_row.status not in ('selesai', 'batal') then
    update public.visits set status = 'selesai', ditutup_pada = now()
     where id = p_visit
    returning * into v_row;

    perform public.catat_audit(v_row.company_id, 'kunjungan.selesai', 'visits', p_visit::text,
      jsonb_build_object('nomor', v_row.nomor, 'oleh', 'kasir', 'transaksi', p_transaksi));
  end if;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.tandai_kunjungan_dibayar(uuid, uuid) from public, anon;
grant execute on function public.tandai_kunjungan_dibayar(uuid, uuid) to authenticated;

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
exception
  -- `uq_reservasi_terbuka`: satu pasien tidak boleh punya dua janji terbuka di
  -- poli dan hari yang sama. Aturannya benar; yang salah pesannya. `pesanError`
  -- hanya meloloskan SH001..SH007 apa adanya, jadi tanpa ini yang muncul di
  -- layar adalah "Gagal menyimpan. Coba lagi sebentar lagi. (23505)", dan
  -- mencoba lagi tidak akan pernah berhasil. Petugas yang disuruh mencoba lagi
  -- akan mencoba lagi, lalu menyimpulkan aplikasinya rusak.
  --
  -- `daftar_kunjungan` sudah menangkap yang setara sejak 0022; yang ini
  -- terlewat waktu modul reservasi ditulis.
  when unique_violation then
    raise exception 'Pasien ini sudah punya reservasi yang menunggu di poli itu pada tanggal tersebut. Buka reservasi yang sudah ada, jangan buat baru.'
      using errcode = 'SH004';
end;
$$;

revoke all on function public.buat_reservasi(text, date, uuid, text, uuid, text, text, uuid, text, uuid)
  from public, anon;
grant execute on function public.buat_reservasi(text, date, uuid, text, uuid, text, text, uuid, text, uuid)
  to authenticated;
