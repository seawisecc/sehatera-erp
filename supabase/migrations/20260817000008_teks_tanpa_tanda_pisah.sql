-- ============================================================
-- Sehatera · 0008 · Buang tanda pisah panjang dari teks di database
--
-- Pemilik tidak memakai tanda pisah panjang (U+2014) di mana pun. Sebagian
-- terlanjur tersimpan DI DALAM database, bukan cuma di berkas: deskripsi paket,
-- komentar tabel, dan satu pesan di dalam badan fungsi register_apotek.
--
-- Berkas migrasi 0004, 0006, dan 0007 yang memuatnya TIDAK disunting. Ketiganya
-- sudah dijalankan, dan berkas yang isinya berbeda dari database adalah persis
-- masalah yang folder ini ada untuk mencegah. Perbaikannya lewat migrasi baru,
-- seperti seharusnya.
-- ============================================================

-- ---------- deskripsi paket ----------
update public.plans
   set description = 'Klinik pratama & utama: rekam medis, SatuSehat, BPJS',
       updated_at  = now()
 where code = 'klinik';

-- ---------- komentar tabel ----------
comment on table public.plans is
  'Paket langganan Sehatera. Baris is_public = false hanya terlihat oleh Super Admin, dipakai untuk paket yang harganya belum diketok.';

comment on column public.companies.theme is
  'Tema bawaan apotek ini. Keempatnya terang, lihat lib/theme.tsx. Perangkat yang sudah memilih sendiri tetap memakai pilihannya.';

-- ---------- pesan di dalam register_apotek ----------
-- Hanya satu kalimat yang berubah (catatan pada subscription_events saat email
-- pendaftar sudah pernah memakai masa cobanya). Sisanya sama persis dengan
-- versi di migrasi 0007.
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
  -- boleh, dia hanya tidak dapat 14 hari gratis untuk kedua kalinya.
  v_trial_used := exists (select 1 from public.trial_grants where email = v_email);
  v_trial_end  := case when v_trial_used then now() else now() + interval '14 days' end;

  -- Kolom theme sengaja tidak diisi supaya DEFAULT kolomnya yang berlaku.
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
               then 'Pendaftaran tanpa masa coba. Email ini sudah pernah memakai masa coba.'
               else 'Pendaftaran baru, masa coba 14 hari.' end);

  return jsonb_build_object('companyId', v_company, 'created', true, 'trialUsed', v_trial_used);
end;
$$;

revoke all on function public.register_apotek(text, text, text, text) from public, anon;
grant execute on function public.register_apotek(text, text, text, text) to authenticated;

-- ---------- periksa ----------
-- Harus mengembalikan nol baris. Kalau tidak, ada teks yang masih memuat tanda
-- pisah panjang dan perlu ditambahkan ke migrasi berikutnya.
select 'plans.description' as sumber, code as detail
  from public.plans where description like '%' || chr(8212) || '%'
union all
select 'subscription_events.note', left(note, 60)
  from public.subscription_events where note like '%' || chr(8212) || '%'
union all
select 'settings.nama_apotek', nama_apotek
  from public.settings where nama_apotek like '%' || chr(8212) || '%'
union all
select 'products.nama_obat', nama_obat
  from public.products where nama_obat like '%' || chr(8212) || '%'
     or coalesce(nama_generik, '') like '%' || chr(8212) || '%';
