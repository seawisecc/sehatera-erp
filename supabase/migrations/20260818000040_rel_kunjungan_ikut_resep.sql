-- ============================================================
-- 0040  Rel kunjungan mengikuti resepnya sendiri
-- ============================================================
--
-- Dua keluhan pemilik tentang keadaan `resep` dan `obat`, dan dua-duanya sah.
--
-- SATU: pasien yang cuma konsultasi, tanpa obat sama sekali, TETAP harus
-- diklik lewat Resep lalu Obat untuk sampai Selesai. Aturannya
-- `abs(v_ke - v_dari) > 1` di migrasi 0016: wajib lewat satu per satu. Dua
-- klik kosong untuk tiap pasien yang tidak diberi obat, dan di klinik itu
-- justru sebagian besar kunjungan kontrol.
--
-- DUA: sejak migrasi 0035 resep punya rel keadaannya SENDIRI
-- (final, disiapkan, siap, dilayani) yang dipegang layar Farmasi. Jadi
-- sekarang ada dua tempat menyimpan fakta yang sama, dan dua tempat itu bisa
-- berbeda isinya: rel kunjungan berkata "obat" sementara resepnya masih
-- "final" karena tidak ada yang menggeser salah satunya.
--
-- Yang TIDAK dilakukan: membuang keadaan `resep` dan `obat`. Keduanya
-- menjawab "di mana pasiennya sekarang", dan itulah seluruh alasan rel ini
-- ada (migrasi 0016: "pasienlah yang berpindah keadaan, bukan orangnya yang
-- berpindah menu"). Layar antrean ruang tunggu yang akan datang juga membaca
-- ini. Yang dibuang adalah KEHARUSAN MENGGESERNYA DENGAN TANGAN.
--
-- Jadi: kalau ada resepnya, relnya bergeser sendiri mengikuti farmasi. Kalau
-- tidak ada resepnya, relnya boleh dilompati.

-- ------------------------------------------------------------
-- 1. Boleh melompati resep dan obat kalau memang tidak ada obatnya
-- ------------------------------------------------------------
-- Disalin dari migrasi 0016 dengan satu blok aturan lompat diganti. Mundur
-- tetap satu per satu: memundurkan kunjungan itu koreksi, dan koreksi yang
-- melompat jauh hampir selalu salah klik.

create or replace function public.ubah_status_kunjungan(
  p_visit uuid, p_status text, p_alasan text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_urut   text[] := array['terdaftar', 'diperiksa', 'resep', 'obat', 'selesai'];
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
    -- Yang boleh dilewati HANYA resep dan obat. Melompati `diperiksa` berarti
    -- pasien ditutup tanpa pernah diperiksa, dan itu bukan jalan pintas.
    if exists (select 1 from unnest(v_lewat) as l where l not in ('resep', 'obat')) then
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
-- 2. Rel kunjungan bergeser sendiri mengikuti resepnya
-- ------------------------------------------------------------
/**
 * Menggeser kunjungan mengikuti keadaan resepnya.
 *
 * Lewat TRIGGER, bukan dari dalam fungsi farmasinya, dengan alasan yang sama
 * seperti pencatat riwayat keadaan di migrasi 0018 dan biaya administrasi di
 * 0024: yang hanya digeser oleh satu jalur akan berhenti bergeser begitu ada
 * jalur kedua, dan jalur kedua selalu datang.
 *
 * Hanya MAJU dan hanya satu langkah. Kalau kunjungannya sudah lebih jauh dari
 * resepnya, ia dibiarkan: orang di depan pasien tahu lebih banyak daripada
 * trigger ini.
 */
create or replace function public.geser_kunjungan_dari_resep()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_tujuan text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  v_tujuan := case new.status
    when 'final'     then 'resep'   -- dokter selesai, pasien menuju farmasi
    when 'disiapkan' then 'obat'    -- farmasi mulai menyiapkan
    when 'siap'      then 'obat'
    else null
  end;
  if v_tujuan is null then return new; end if;

  select status into v_status from public.visits where id = new.visit_id;

  -- Cuma dari keadaan tepat sebelumnya. Tidak menyeret kunjungan yang sudah
  -- ditutup, dibatalkan, atau yang memang sengaja ditahan di belakang.
  if (v_tujuan = 'resep' and v_status = 'diperiksa')
     or (v_tujuan = 'obat' and v_status = 'resep') then
    update public.visits set status = v_tujuan where id = new.visit_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_geser_kunjungan_dari_resep on public.prescriptions;
create trigger trg_geser_kunjungan_dari_resep
  after update of status on public.prescriptions
  for each row execute function public.geser_kunjungan_dari_resep();
