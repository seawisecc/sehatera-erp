-- ============================================================
-- 0049  Rel kunjungan tanpa keadaan `resep`
-- ============================================================
--
-- Alur yang diminta pemilik, dan alasannya masuk akal semua:
--
--   terdaftar  didaftarkan, dipanggil (boleh berkali-kali), tetap di papan
--   diperiksa  ditekan "Tiba" oleh pendaftaran, pasien masuk ruangan
--   obat       dokter menyimpan rekam medis DAN resepnya ada
--   selesai    ditutup kasir
--
-- Keadaan `resep` DIBUANG. Ia sudah tidak menjelaskan apa pun sejak migrasi
-- 0035: resep punya rel keadaannya sendiri (final, disiapkan, siap, dilayani)
-- yang dipegang layar Farmasi, jadi `resep` di rel kunjungan cuma satu klik
-- kosong yang harus dilewati orang.
--
-- Baris lama yang masih `resep` dipindahkan ke `obat`. Itu tidak bisa
-- dibatalkan, dan memang tidak ada yang perlu dibatalkan: kunjungan
-- berstatus `resep` artinya resepnya sudah ditulis dan sedang menunggu
-- obatnya, yang persis arti `obat`.

-- ------------------------------------------------------------
-- 1. Pindahkan baris lama SEBELUM batasannya diubah
-- ------------------------------------------------------------
-- Urutannya penting. Kalau batasan diubah lebih dulu, baris `resep` yang
-- masih ada membuat `alter table` gagal dan migrasinya berhenti di tengah.

update public.visits set status = 'obat' where status = 'resep';

do $$
begin
  alter table public.visits drop constraint if exists visits_status_check;
  alter table public.visits add constraint visits_status_check
    check (status in ('terdaftar', 'diperiksa', 'obat', 'selesai', 'batal'));
end $$;

-- ------------------------------------------------------------
-- 2. Rel baru
-- ------------------------------------------------------------
-- Disalin dari migrasi 0040, dengan `resep` dibuang dari urutannya dan dari
-- daftar yang boleh dilewati.

create or replace function public.ubah_status_kunjungan(
  p_visit uuid, p_status text, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_urut   text[] := array['terdaftar', 'diperiksa', 'obat', 'selesai'];
  v_dari   integer;
  v_ke     integer;
  v_lewat  text[];
begin
  select * into v_visit from public.visits
   where id = p_visit and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_visit.status = p_status then
    return to_jsonb(v_visit);
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup.' using errcode = 'SH004';
  end if;

  if p_status = 'batal' then
    update public.visits
       set status = 'batal', ditutup_pada = now(),
           catatan_batal = nullif(trim(p_alasan), '')
     where id = p_visit;

    perform public.catat_audit(v_visit.company_id, 'kunjungan.dibatalkan', 'visits', p_visit::text,
      jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'alasan', p_alasan));

    return (select to_jsonb(v) from public.visits v where v.id = p_visit);
  end if;

  v_dari := array_position(v_urut, v_visit.status);
  v_ke   := array_position(v_urut, p_status);
  if v_ke is null then
    raise exception 'Keadaan kunjungan tidak dikenali.' using errcode = 'SH004';
  end if;

  if v_dari - v_ke > 1 then
    raise exception 'Kunjungan tidak bisa mundur dari % ke % sekaligus. Mundurkan satu per satu.',
      v_visit.status, p_status using errcode = 'SH004';
  end if;

  if v_ke - v_dari > 1 then
    v_lewat := v_urut[v_dari + 1 : v_ke - 1];
    if exists (select 1 from unnest(v_lewat) as l where l <> 'obat') then
      raise exception 'Kunjungan tidak bisa melompat dari % ke %. Lewati satu per satu.',
        v_visit.status, p_status using errcode = 'SH004';
    end if;
    if exists (select 1 from public.prescriptions r
                where r.visit_id = p_visit and r.status <> 'batal') then
      raise exception 'Kunjungan ini punya resep, jadi tidak bisa melewati tahap obat. Selesaikan dulu di layar Farmasi.'
        using errcode = 'SH004';
    end if;
  end if;

  update public.visits
     set status       = p_status,
         dokter_email = case when p_status = 'diperiksa' and dokter_email is null
                             then lower(auth.jwt() ->> 'email') else dokter_email end,
         ditutup_pada = case when p_status = 'selesai' then now() else null end
   where id = p_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.' || p_status, 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'ke', p_status));

  return (select to_jsonb(v) from public.visits v where v.id = p_visit);
end;
$$;

revoke all on function public.ubah_status_kunjungan(uuid, text, text) from public, anon;
grant execute on function public.ubah_status_kunjungan(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 3. Trigger resep tidak lagi menggeser ke `resep`
-- ------------------------------------------------------------
-- Sebelumnya resep `final` menggeser kunjungan ke `resep`. Keadaan itu sudah
-- tidak ada. Sekarang yang menggeser ke `obat` adalah DOKTER yang menyimpan
-- rekam medisnya, bukan farmasi yang mulai menyiapkan: pasien sudah berpindah
-- ke ruang tunggu obat begitu dokter selesai, jauh sebelum farmasi menyentuh
-- resepnya.

create or replace function public.geser_kunjungan_dari_resep()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_status text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  -- Begitu dokter memfinalkan resepnya, pasien memang sudah menuju farmasi.
  if new.status not in ('final', 'disiapkan', 'siap') then
    return new;
  end if;

  select status into v_status from public.visits where id = new.visit_id;
  if v_status = 'diperiksa' then
    update public.visits set status = 'obat' where id = new.visit_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_geser_kunjungan_dari_resep on public.prescriptions;
create trigger trg_geser_kunjungan_dari_resep
  after update of status on public.prescriptions
  for each row execute function public.geser_kunjungan_dari_resep();

-- ------------------------------------------------------------
-- 4. Pembayaran menutup kunjungan
-- ------------------------------------------------------------
/**
 * Kasir menutup kunjungan, SELALU, termasuk BPJS dan asuransi.
 *
 * Ini keputusan pemilik dan lebih baik daripada usul saya. Saya sempat
 * mengusulkan kunjungan tanpa obat ditutup sendiri saat dibayar, dan itu
 * meninggalkan lubang: kunjungan bertagihan nol (kapitasi BPJS, konsultasi
 * gratis) tidak akan pernah dibayar, jadi tidak akan pernah tertutup.
 *
 * Dengan semuanya lewat kasir, satu jalur menutup semua keadaan, dan laporan
 * per penjamin keluar sendiri karena tiap penutupan punya penjaminnya.
 *
 * Yang PUNYA resep tidak ditutup di sini: obatnya belum diserahkan. Yang
 * menutupnya `serahkan_resep()`.
 */
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

  select exists (select 1 from public.prescriptions r
                  where r.visit_id = p_visit and r.status <> 'batal')
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

-- ------------------------------------------------------------
-- 5. Penyerahan obat menutup kunjungan
-- ------------------------------------------------------------
create or replace function public.tutup_kunjungan_sesudah_serah()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_visit record;
begin
  if new.status <> 'dilayani' or old.status = 'dilayani' then
    return new;
  end if;

  select * into v_visit from public.visits where id = new.visit_id;
  if v_visit.status in ('selesai', 'batal') then
    return new;
  end if;

  -- Masih ada resep lain yang belum diserahkan: jangan ditutup. Satu
  -- kunjungan bisa punya lebih dari satu resep sepanjang harinya.
  if exists (select 1 from public.prescriptions r
              where r.visit_id = new.visit_id
                and r.id <> new.id
                and r.status not in ('dilayani', 'batal')) then
    return new;
  end if;

  update public.visits set status = 'selesai', ditutup_pada = now()
   where id = new.visit_id;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.selesai', 'visits', new.visit_id::text,
    jsonb_build_object('nomor', v_visit.nomor, 'oleh', 'farmasi', 'resep', new.nomor));

  return new;
end;
$$;

drop trigger if exists trg_tutup_kunjungan_sesudah_serah on public.prescriptions;
create trigger trg_tutup_kunjungan_sesudah_serah
  after update of status on public.prescriptions
  for each row execute function public.tutup_kunjungan_sesudah_serah();

-- ------------------------------------------------------------
-- 6. Papan ruang tunggu ikut kehilangan `resep`
-- ------------------------------------------------------------
-- Migrasi 0046 menulis daftar statusnya sebagai yang MASUK, dan salah satunya
-- `resep` yang sekarang sudah tidak ada. Dibiarkan pun tidak salah, tapi
-- daftar yang menyebut keadaan yang tidak ada adalah daftar yang membuat
-- pembaca berikutnya menebak.

create or replace function public.layar_antrean(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_set  record;
  v_hasil jsonb;
begin
  if coalesce(trim(p_token), '') = '' then
    raise exception 'Layar antrean butuh token.' using errcode = 'SH004';
  end if;

  select s.*, c.nama as nama_faskes
    into v_set
    from public.settings s
    join public.companies c on c.id = s.company_id
   where s.token_antrean = trim(p_token)
     and c.deleted_at is null;
  if not found then
    raise exception 'Token layar antrean tidak dikenali.' using errcode = 'SH004';
  end if;

  select jsonb_build_object(
    'faskes', v_set.nama_faskes,
    'pada', now(),
    'antrean', coalesce((
      select jsonb_agg(x order by x.dipanggil_pada desc nulls last, x.dibuka_pada)
      from (
        select
          v.nomor_antre, v.status, v.dipanggil_pada, v.jumlah_panggil, v.dibuka_pada,
          u.nama as poli,
          case when v_set.antrean_nama_penuh then p.nama
               else public.samarkan_nama(p.nama) end as nama
        from public.visits v
        join public.patients p on p.id = v.patient_id
        left join public.clinic_units u on u.id = v.unit_id
        where v.company_id = v_set.company_id
          and v.tanggal = current_date
          and v.status in ('terdaftar', 'obat')
      ) x), '[]'::jsonb))
  into v_hasil;

  return v_hasil;
end;
$$;

revoke all on function public.layar_antrean(text) from public;
grant execute on function public.layar_antrean(text) to anon, authenticated;
