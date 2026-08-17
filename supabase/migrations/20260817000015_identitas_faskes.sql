-- ============================================================
-- 0015  Identitas faskes: dari "apotek" ke jenis fasilitas
-- ============================================================
--
-- Prasyarat modul klinik, dan sengaja dikerjakan SEKARANG selagi kliennya
-- masih dua. Mengubah nama kolom yang sudah dipakai dua jenis faskes jauh
-- lebih mahal daripada mengubahnya sebelum jenis keduanya ada.
--
-- Dua hal yang diperbaiki.
--
-- 1. Tidak ada satu pun tempat yang menyimpan JENIS fasilitasnya. Yang ada
--    `settings.sektor_usaha`, kolom teks bebas yang diisi tangan: "Apotek",
--    "apotek", "Apotek & Klinik", apa saja. Teks bebas tidak bisa dipakai
--    menyaring menu, dan menyaring menu berdasarkan jenis fasilitas adalah
--    inti dari cara modul klinik nanti tidak membebani apotek yang tidak
--    membutuhkannya. Jadi jenisnya naik ke `companies.sektor`, dengan daftar
--    nilai yang tertutup.
--
-- 2. `settings.nama_apotek` menamai kolom menurut satu jenis fasilitas saja.
--    Untuk klinik dan rumah sakit namanya salah, dan kolom yang namanya salah
--    adalah kolom yang cepat atau lambat diisi salah.
--
-- Kolom lamanya TIDAK dibuang. Kode yang sudah ter-deploy masih membacanya,
-- dan membuangnya berarti aplikasi yang sedang berjalan langsung rusak
-- sebelum deploy berikutnya sampai. Keduanya dijaga tetap sama isinya oleh
-- trigger, ke DUA arah, sampai semua pembacaan `nama_apotek` habis.

-- ------------------------------------------------------------
-- 1. Jenis fasilitas
-- ------------------------------------------------------------

alter table public.companies
  add column if not exists sektor text not null default 'apotek';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_sektor_check') then
    alter table public.companies
      add constraint companies_sektor_check
      check (sektor in ('apotek', 'klinik', 'rumah_sakit'));
  end if;
end $$;

comment on column public.companies.sektor is
  'Jenis fasilitas: apotek | klinik | rumah_sakit. Menentukan MENU mana yang ada, terpisah dari paket yang menentukan menu mana yang dibuka. Sebuah apotek berpaket Enterprise tetap tidak melihat Antrian Pasien.';

-- ------------------------------------------------------------
-- 2. Nama fasilitas
-- ------------------------------------------------------------

alter table public.settings
  add column if not exists nama_faskes text;

update public.settings
   set nama_faskes = nama_apotek
 where nama_faskes is null and nama_apotek is not null;

comment on column public.settings.nama_faskes is
  'Nama fasilitas. Menggantikan nama_apotek, yang dipertahankan sementara karena kode ter-deploy masih membacanya.';

comment on column public.settings.nama_apotek is
  'USANG sejak migrasi 0015. Dipakai nama_faskes. Dijaga tetap sama isinya oleh trigger sampai semua pembacaannya habis.';

/**
 * Menjaga nama_faskes dan nama_apotek tetap sama, KE DUA ARAH.
 *
 * Satu arah saja tidak cukup: selama peluncuran, sebagian pengguna memakai
 * kode lama yang menulis `nama_apotek` dan sebagian sudah memakai kode baru
 * yang menulis `nama_faskes`. Menjaga satu arah berarti salah satu kelompok
 * menyimpan nama, melihatnya tersimpan, lalu menemukannya kembali seperti
 * semula begitu halaman disegarkan.
 */
create or replace function public.samakan_nama_faskes()
returns trigger
language plpgsql set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.nama_faskes := coalesce(new.nama_faskes, new.nama_apotek);
    new.nama_apotek := coalesce(new.nama_apotek, new.nama_faskes);
    return new;
  end if;

  if new.nama_faskes is distinct from old.nama_faskes then
    new.nama_apotek := new.nama_faskes;
  elsif new.nama_apotek is distinct from old.nama_apotek then
    new.nama_faskes := new.nama_apotek;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_samakan_nama_faskes on public.settings;
create trigger trg_samakan_nama_faskes
  before insert or update on public.settings
  for each row execute function public.samakan_nama_faskes();

-- ------------------------------------------------------------
-- 3. Pendaftaran yang tidak lagi menganggap semua orang apotek
-- ------------------------------------------------------------

create or replace function public.register_faskes(
  p_nama       text,
  p_nama_admin text default '',
  p_sektor     text default 'apotek',
  p_kota       text default null,
  p_telepon    text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_email      text := lower(auth.jwt() ->> 'email');
  v_company    uuid;
  v_plan       uuid;
  v_slug       text;
  v_trial_used boolean;
  v_trial_end  timestamptz;
  v_sektor     text := coalesce(nullif(trim(p_sektor), ''), 'apotek');
begin
  if v_email is null then
    raise exception 'Harus masuk dulu sebelum mendaftarkan fasilitas.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama fasilitas wajib diisi.' using errcode = 'SH004';
  end if;
  if v_sektor not in ('apotek', 'klinik', 'rumah_sakit') then
    raise exception 'Jenis fasilitas tidak dikenali.' using errcode = 'SH004';
  end if;

  -- Satu email = satu fasilitas. Kalau tidak dijaga, menekan tombol daftar dua
  -- kali karena halaman terasa lambat akan melahirkan dua fasilitas kembar, dan
  -- auth_company_id() akan memilih salah satunya secara acak.
  select id into v_company from public.companies
   where lower(admin_email) = v_email and deleted_at is null limit 1;
  if v_company is not null then
    return jsonb_build_object('companyId', v_company, 'created', false);
  end if;

  v_slug := regexp_replace(lower(trim(p_nama)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if exists (select 1 from public.companies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  -- Paket awal mengikuti jenis fasilitasnya. Klinik yang didaftarkan dengan
  -- paket Starter akan kehilangan modulnya sendiri pada hari pertama.
  select id into v_plan from public.plans
   where code = case when v_sektor = 'apotek' then 'starter' else 'klinik' end limit 1;
  if v_plan is null then
    select id into v_plan from public.plans order by sort_order limit 1;
  end if;

  -- Masa coba dicatat per email pendaftar. Yang mendaftar fasilitas kedua tetap
  -- boleh, dia hanya tidak dapat 14 hari gratis untuk kedua kalinya.
  v_trial_used := exists (select 1 from public.trial_grants where email = v_email);
  v_trial_end  := case when v_trial_used then now() else now() + interval '14 days' end;

  -- Kolom theme sengaja tidak diisi supaya DEFAULT kolomnya yang berlaku.
  insert into public.companies (nama, slug, admin_nama, admin_email, kota, telepon,
                                sektor, plan_id, status, trial_ends_at)
  values (trim(p_nama), v_slug, nullif(trim(p_nama_admin), ''), v_email,
          nullif(trim(p_kota), ''), nullif(trim(p_telepon), ''),
          v_sektor, v_plan, 'trial', v_trial_end)
  returning id into v_company;

  insert into public.trial_grants (email, company_id)
  values (v_email, v_company)
  on conflict (email) do nothing;

  -- Profil diisi awal supaya struk dan laporan SIPNAP tidak mencetak baris
  -- kosong di hari pertama.
  insert into public.settings (company_id, nama_faskes, kota, sektor_usaha)
  values (v_company, trim(p_nama), nullif(trim(p_kota), ''),
          case v_sektor when 'klinik' then 'Klinik'
                        when 'rumah_sakit' then 'Rumah Sakit'
                        else 'Apotek' end);

  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_company, coalesce(nullif(trim(p_nama_admin), ''), v_email),
          v_email, 'pemilik', 'aktif', '[]'::jsonb);

  insert into public.subscription_events (company_id, action, plan_id, actor_email, note)
  values (v_company, 'subscribe', v_plan, v_email,
          case when v_trial_used
               then 'Pendaftaran tanpa masa coba. Email ini sudah pernah memakai masa coba.'
               else 'Pendaftaran baru, masa coba 14 hari.' end);

  perform public.catat_audit(v_company, 'faskes.didaftarkan', 'companies', v_company::text,
    jsonb_build_object('nama', trim(p_nama), 'sektor', v_sektor, 'masa_coba', not v_trial_used));

  return jsonb_build_object('companyId', v_company, 'created', true, 'trialUsed', v_trial_used);
end;
$$;

revoke all on function public.register_faskes(text, text, text, text, text) from public, anon;
grant execute on function public.register_faskes(text, text, text, text, text) to authenticated;

comment on function public.register_faskes is
  'Mendaftarkan fasilitas baru beserta jenisnya. Menggantikan register_apotek, yang tetap ada sebagai pembungkus karena kode ter-deploy masih memanggilnya.';

/**
 * Pembungkus untuk kode yang sudah ter-deploy.
 *
 * Tanda tangannya HARUS persis sama dengan yang lama (empat argumen, dua
 * terakhir bertanda bawaan). Menambah versi dua-argumen di sampingnya akan
 * membuat panggilan dua-argumen jadi ambigu, dan Postgres menolaknya: halaman
 * pendaftaran berhenti bekerja tanpa ada satu baris kode aplikasi pun yang
 * berubah.
 */
create or replace function public.register_apotek(
  p_nama_apotek text,
  p_nama_admin  text,
  p_kota        text default null,
  p_telepon     text default null
)
returns jsonb
language sql security definer set search_path = public, pg_temp
as $$
  select public.register_faskes(p_nama_apotek, p_nama_admin, 'apotek', p_kota, p_telepon);
$$;

revoke all on function public.register_apotek(text, text, text, text) from public, anon;
grant execute on function public.register_apotek(text, text, text, text) to authenticated;

comment on function public.register_apotek is
  'USANG sejak migrasi 0015. Pembungkus tipis untuk register_faskes; dipertahankan karena kode ter-deploy memanggilnya.';

-- ------------------------------------------------------------
-- 4. my_context() ikut membawa jenis fasilitas
-- ------------------------------------------------------------

create or replace function public.my_context()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_email   text := lower(auth.jwt() ->> 'email');
  v_super   boolean;
  v_company uuid;
  v_row     record;
  v_user    record;
begin
  if v_email is null then
    return jsonb_build_object('signedIn', false);
  end if;

  v_super := public.is_super_admin();

  if v_super then
    return jsonb_build_object(
      'signedIn', true, 'email', v_email,
      'isSuper', true, 'role', 'superadmin', 'modules', null, 'company', null);
  end if;

  v_company := public.auth_company_id();

  select c.id, c.nama, c.status, c.theme, c.sektor,
         c.trial_ends_at, c.subscription_ends_at,
         p.code as plan_code, p.name as plan_name, p.price_monthly, p.features
    into v_row
    from public.companies c
    left join public.plans p on p.id = c.plan_id
   where c.id = v_company and c.deleted_at is null;

  select role, modules, status into v_user
    from public.app_users
   where company_id = v_company and lower(email) = v_email
   limit 1;

  return jsonb_build_object(
    'signedIn', true,
    'email',    v_email,
    'isSuper',  false,
    -- Email yang tidak terdaftar di direktori tim tapi memiliki fasilitas
    -- adalah pemiliknya. Itu keadaan normal, bukan kesalahan: pendaftar tidak
    -- pernah mengundang dirinya sendiri.
    'role',     coalesce(v_user.role, 'pemilik'),
    'modules',  v_user.modules,
    'memberStatus', v_user.status,
    'company',  case when v_row.id is null then null else jsonb_build_object(
      'id',                 v_row.id,
      'nama',               v_row.nama,
      'status',             v_row.status,
      'theme',              v_row.theme,
      'sektor',             coalesce(v_row.sektor, 'apotek'),
      'trialEndsAt',        v_row.trial_ends_at,
      'subscriptionEndsAt', v_row.subscription_ends_at,
      'planCode',           v_row.plan_code,
      'planName',           v_row.plan_name,
      'planPriceMonthly',   v_row.price_monthly,
      'features',           coalesce(v_row.features, '{}'::jsonb)
    ) end
  );
end;
$$;

revoke all on function public.my_context() from public, anon;
grant execute on function public.my_context() to authenticated;

/**
 * Mengubah jenis fasilitas.
 *
 * Naik dari apotek ke klinik mengubah menu yang muncul, jadi ini bukan
 * pengaturan tampilan melainkan perubahan bentuk usaha. Hanya super admin,
 * dan tercatat: modul klinik membawa kewajiban hukum sendiri, dan siapa yang
 * membukanya kapan harus bisa ditelusuri.
 */
create or replace function public.set_company_sektor(p_company uuid, p_sektor text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_lama text;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya super admin yang boleh mengubah jenis fasilitas.' using errcode = 'SH001';
  end if;
  if p_sektor not in ('apotek', 'klinik', 'rumah_sakit') then
    raise exception 'Jenis fasilitas tidak dikenali.' using errcode = 'SH004';
  end if;

  select sektor into v_lama from public.companies where id = p_company for update;
  if not found then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  update public.companies set sektor = p_sektor where id = p_company;

  perform public.catat_audit(p_company, 'faskes.sektor', 'companies', p_company::text,
    jsonb_build_object('dari', v_lama, 'ke', p_sektor));

  return (select to_jsonb(c) from public.companies c where c.id = p_company);
end;
$$;

revoke all on function public.set_company_sektor(uuid, text) from public, anon;
grant execute on function public.set_company_sektor(uuid, text) to authenticated;
