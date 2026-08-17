-- ============================================================
-- Sehatera · 0007 · Empat tema terang, bawaan pindah ke Vital Tide
--
-- Tema gelap (neon-pulse, midnight-sage) dihapus dari aplikasi. Alasannya
-- keadaan pakai, bukan selera: aplikasi ini dipakai di ruangan terang, sering
-- di samping dokumen kertas, dan layar gelap di antara kertas putih memaksa
-- mata menyesuaikan bolak-balik sepanjang hari.
--
-- Apotek yang kolom `theme`-nya menyimpan tema yang sudah tidak ada TIDAK boleh
-- dibiarkan: `isThemeId()` di aplikasi akan menolak nilainya dan diam-diam
-- jatuh ke bawaan, jadi dari layar tidak terlihat rusak, tapi kolomnya
-- menyimpan sesuatu yang tidak berarti apa-apa, dan itu jenis data yang
-- membingungkan orang berikutnya yang membacanya.
-- ============================================================

-- Pemetaan disengaja per suasana, bukan asal ke bawaan:
--   neon-pulse    berani, berwarna  -> lilac-dawn  (paling berwarna dari yang terang)
--   midnight-sage tenang, nyaris polos -> clean-slate (paling tenang dari yang terang)
update public.companies set theme = 'lilac-dawn'  where theme = 'neon-pulse';
update public.companies set theme = 'clean-slate' where theme = 'midnight-sage';

-- Nilai tak dikenal apa pun (termasuk kosong) dibawa ke bawaan yang baru.
update public.companies
   set theme = 'vital-tide'
 where theme is null
    or theme not in ('vital-tide', 'sunrise-sorbet', 'lilac-dawn', 'clean-slate');

alter table public.companies alter column theme set default 'vital-tide';

-- Dikunci constraint supaya tema yang dihapus tidak bisa masuk lagi lewat
-- panel Super Admin atau skrip seed yang belum diperbarui.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'companies_theme_check') then
    alter table public.companies drop constraint companies_theme_check;
  end if;
  alter table public.companies add constraint companies_theme_check
    check (theme in ('vital-tide', 'sunrise-sorbet', 'lilac-dawn', 'clean-slate'));
end $$;

comment on column public.companies.theme is
  'Tema bawaan apotek ini. Keempatnya terang — lihat lib/theme.tsx. Perangkat yang sudah memilih sendiri tetap memakai pilihannya.';

-- ============================================================
-- register_apotek: berhenti menuliskan nama tema
--
-- Versi di migrasi 0004 menanam 'sunrise-sorbet' langsung di INSERT-nya, jadi
-- apotek yang mendaftar sesudah hari ini akan lahir dengan tema yang bukan lagi
-- bawaan aplikasi. Memperbaikinya dengan menyunting migrasi 0004 bukan pilihan:
-- migrasi itu SUDAH dijalankan, dan berkas yang berbeda isinya dari database
-- adalah persis masalah yang folder migrations ini ada untuk mencegahnya.
--
-- Kolom `theme` sekarang dihilangkan dari INSERT sama sekali, jadi DEFAULT
-- kolomnya yang berlaku. Pergantian tema bawaan berikutnya cukup satu
-- `alter column ... set default`, tanpa menyentuh fungsi ini lagi.
-- ============================================================
create or replace function public.register_apotek(
  p_nama_apotek text,
  p_nama_admin  text,
  p_kota        text default null,
  p_telepon     text default null
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
begin
  if v_email is null then
    raise exception 'Harus masuk dulu sebelum mendaftarkan apotek.' using errcode = 'SH004';
  end if;

  if coalesce(trim(p_nama_apotek), '') = '' then
    raise exception 'Nama apotek wajib diisi.' using errcode = 'SH004';
  end if;

  -- Satu email = satu apotek. Kalau tidak dijaga, menekan tombol daftar dua
  -- kali karena halaman terasa lambat akan melahirkan dua apotek kembar, dan
  -- auth_company_id() akan memilih salah satunya secara acak.
  select id into v_company from public.companies
   where lower(admin_email) = v_email and deleted_at is null limit 1;
  if v_company is not null then
    return jsonb_build_object('companyId', v_company, 'created', false);
  end if;

  v_slug := regexp_replace(lower(trim(p_nama_apotek)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if exists (select 1 from public.companies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  select id into v_plan from public.plans where code = 'starter' limit 1;

  -- Masa coba dicatat per email pendaftar. Yang mendaftar apotek kedua tetap
  -- boleh: dia hanya tidak dapat 14 hari gratis untuk kedua kalinya.
  v_trial_used := exists (select 1 from public.trial_grants where email = v_email);
  v_trial_end  := case when v_trial_used then now() else now() + interval '14 days' end;

  insert into public.companies (nama, slug, admin_nama, admin_email, kota, telepon,
                                plan_id, status, trial_ends_at)
  values (trim(p_nama_apotek), v_slug, nullif(trim(p_nama_admin), ''), v_email,
          nullif(trim(p_kota), ''), nullif(trim(p_telepon), ''),
          v_plan, 'trial', v_trial_end)
  returning id into v_company;

  insert into public.trial_grants (email, company_id)
  values (v_email, v_company)
  on conflict (email) do nothing;

  -- Profil apotek diisi awal supaya struk dan laporan SIPNAP tidak mencetak
  -- baris kosong di hari pertama.
  insert into public.settings (company_id, nama_apotek, kota, sektor_usaha)
  values (v_company, trim(p_nama_apotek), nullif(trim(p_kota), ''), 'Apotek');

  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_company, coalesce(nullif(trim(p_nama_admin), ''), v_email),
          v_email, 'pemilik', 'aktif', '[]'::jsonb);

  insert into public.subscription_events (company_id, action, plan_id, actor_email, note)
  values (v_company, 'subscribe', v_plan, v_email,
          case when v_trial_used
               then 'Pendaftaran tanpa masa coba — email ini sudah pernah memakai masa coba.'
               else 'Pendaftaran baru, masa coba 14 hari.' end);

  return jsonb_build_object('companyId', v_company, 'created', true, 'trialUsed', v_trial_used);
end;
$$;

revoke all on function public.register_apotek(text, text, text, text) from public, anon;
grant execute on function public.register_apotek(text, text, text, text) to authenticated;
