-- ============================================================
-- 0041  Layar antrean ruang tunggu
-- ============================================================
--
-- Layar ini menyala di ruang tunggu, menghadap orang banyak, seharian.
-- Itu satu kalimat, tapi ia yang menentukan hampir seluruh bentuk migrasi ini.
--
-- YANG TIDAK BOLEH: memakai sesi staf. Kalau layarnya login sebagai petugas,
-- siapa pun yang lewat tinggal menekan tombol Beranda di televisi itu dan
-- masuk ke rekam medis seluruh klinik. Sesi yang hidup di ruangan publik
-- adalah sesi milik semua orang yang ada di ruangan itu.
--
-- Jadi layarnya dibuka dengan TOKEN, dan token itu hanya bisa satu hal:
-- membaca nomor antrean hari ini. Polanya sama dengan `lihat_undangan()` di
-- migrasi 0012, yang juga dipanggil orang yang belum punya akun.
--
-- NAMA PASIEN: yang dikirim ke layar sudah DISAMARKAN di database, bukan
-- disamarkan di peramban. Kalau penyamarannya di layar, nama lengkapnya tetap
-- melewati jaringan dan tetap ada di dalam peramban televisi itu. Bawaannya
-- "I Wayan S.", dan pemilik boleh menyalakan nama penuh kalau kliniknya
-- memang memanggil begitu.

alter table public.visits
  add column if not exists dipanggil_pada timestamptz,
  add column if not exists dipanggil_oleh text,
  add column if not exists jumlah_panggil integer not null default 0;

comment on column public.visits.jumlah_panggil is
  'Berapa kali nomor ini dipanggil. Yang dipanggil berkali-kali biasanya tidak ada di tempat, dan itu perlu kelihatan.';

alter table public.settings
  add column if not exists token_antrean text,
  add column if not exists antrean_nama_penuh boolean not null default false;

comment on column public.settings.token_antrean is
  'Kunci layar ruang tunggu. Hanya membuka nomor antrean hari ini, bukan yang lain. Boleh diputar kapan saja.';

create unique index if not exists uq_settings_token_antrean
  on public.settings (token_antrean) where token_antrean is not null;

-- ------------------------------------------------------------
-- 1. Memanggil satu nomor
-- ------------------------------------------------------------

create or replace function public.panggil_antrean(p_visit uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  update public.visits
     set dipanggil_pada = now(),
         dipanggil_oleh = v_email,
         jumlah_panggil = jumlah_panggil + 1
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
     and status not in ('selesai', 'batal')
  returning * into v_visit;
  if not found then
    raise exception 'Kunjungan tidak ditemukan, atau sudah ditutup sehingga tidak bisa dipanggil.'
      using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_visit.company_id, 'antrean.dipanggil', 'visits', p_visit::text,
    jsonb_build_object('nomor_antre', v_visit.nomor_antre, 'ke', v_visit.jumlah_panggil));

  return to_jsonb(v_visit);
end;
$$;

revoke all on function public.panggil_antrean(uuid) from public, anon;
grant execute on function public.panggil_antrean(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2. Token layar
-- ------------------------------------------------------------

create or replace function public.token_antrean_saya(p_putar boolean default false)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_token text;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  select token_antrean into v_token from public.settings where company_id = v_co;

  if v_token is null or coalesce(p_putar, false) then
    -- 32 huruf acak. Bukan id fasilitas: id itu muncul di banyak tempat lain,
    -- dan kunci yang sama dengan pengenal bukan kunci.
    v_token := encode(gen_random_bytes(24), 'hex');
    update public.settings set token_antrean = v_token where company_id = v_co;
    perform public.catat_audit(v_co, 'antrean.token', 'settings', v_co::text,
      jsonb_build_object('diputar', coalesce(p_putar, false)));
  end if;

  return v_token;
end;
$$;

revoke all on function public.token_antrean_saya(boolean) from public, anon;
grant execute on function public.token_antrean_saya(boolean) to authenticated;

-- ------------------------------------------------------------
-- 3. Yang dibaca layar
-- ------------------------------------------------------------

/**
 * Isi layar ruang tunggu, dibuka dengan token.
 *
 * Dipanggil TANPA login, jadi ia harus menganggap dirinya menghadap publik.
 * Yang keluar dari sini cuma: nomor antrean, poli, keadaan, dan nama yang
 * sudah disamarkan. Tidak ada nomor rekam medis, tidak ada NIK, tidak ada
 * keluhan, tidak ada diagnosis. Menambah kolom di sini berarti menambahkannya
 * ke papan pengumuman ruang tunggu.
 */
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
          v.nomor_antre,
          v.status,
          v.dipanggil_pada,
          v.jumlah_panggil,
          v.dibuka_pada,
          u.nama as poli,
          -- Penyamaran dilakukan DI SINI. Kalau dilakukan di peramban, nama
          -- lengkapnya tetap melewati jaringan dan tetap ada di dalam
          -- televisi ruang tunggu itu.
          case when v_set.antrean_nama_penuh then p.nama
               else split_part(p.nama, ' ', 1) ||
                    case when position(' ' in p.nama) > 0
                         then ' ' || upper(left(split_part(p.nama, ' ', 2), 1)) || '.'
                         else '' end
          end as nama
        from public.visits v
        join public.patients p on p.id = v.patient_id
        left join public.clinic_units u on u.id = v.unit_id
        where v.company_id = v_set.company_id
          and v.tanggal = current_date
          and v.status not in ('selesai', 'batal')
      ) x), '[]'::jsonb))
  into v_hasil;

  return v_hasil;
end;
$$;

revoke all on function public.layar_antrean(text) from public;
grant execute on function public.layar_antrean(text) to anon, authenticated;
