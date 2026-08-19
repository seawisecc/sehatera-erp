-- ============================================================
-- 0055  Kredensial faskes, disimpan terenkripsi
-- ============================================================
--
-- Prasyarat pengiriman ke SatuSehat dan BPJS. Bentuk datanya sudah siap sejak
-- migrasi 0018 dan 0025; yang menahan pekerjaan itu bukan lagi bentuk data,
-- melainkan kredensial per faskes dan tempat menyimpannya.
--
-- **Kredensial diberikan PER FASKES, bukan per vendor.** Tiap klinik mendaftar
-- sendiri ke SatuSehat dan ke BPJS dan menerima client secret miliknya sendiri.
-- Menyimpannya polos di `settings` berarti satu kebocoran RLS, satu ekspor CSV
-- yang salah kolom, atau satu backup yang tercecer membocorkan kunci SEMUA
-- klinik sekaligus, dan kunci itu membuka data pasien di sistem nasional.
--
-- Tiga keputusan yang perlu dibaca sebelum menyentuhnya lagi.
--
-- 1. **Rahasianya masuk Supabase Vault, bukan kolom biasa.** Yang tersimpan di
--    tabel ini cuma `secret_id`, penunjuk. Kuncinya dipegang di luar tabel,
--    jadi `pg_dump` atau ekspor tabel mana pun cuma menghasilkan sandi.
--    Enkripsi yang kuncinya ikut tersimpan di sebelahnya bukan enkripsi.
--
-- 2. **Tabelnya tidak punya policy sama sekali**, jadi PostgREST tidak bisa
--    membacanya untuk siapa pun. Alasannya aturan lama project ini: RLS
--    MENYARING BARIS, BUKAN KOLOM. Policy apa pun yang mengizinkan pemilik
--    melihat "kredensial apa saja yang sudah dipasang" otomatis mengizinkan ia
--    membaca `secret_id` juga. Jadi satu-satunya jalan masuk adalah tiga
--    fungsi di bawah, dan masing-masing memberi persis satu hal.
--
-- 3. **Yang PUBLIK dipisah dari yang RAHASIA.** `client_id`, `organization_id`,
--    `cons_id`: itu pengenal, bukan kunci, dan petugas perlu melihatnya untuk
--    memastikan tidak salah tempel. Yang rahasia tidak pernah dikembalikan ke
--    layar sekali pun oleh yang memasangnya. Kolom yang bisa dibaca balik akan
--    dibaca balik, dan kredensial yang bisa dilihat di layar akan difoto.
--
-- Nama secret di Vault sengaja deterministik supaya pemasangan ulang MENGGANTI
-- yang lama, bukan menumpuk. Vault menolak nama kembar, dan kalau ditumpuk
-- tidak ada yang tahu penunjuk mana yang masih dipakai.

-- ------------------------------------------------------------
-- 1. Tabel
-- ------------------------------------------------------------

create table if not exists public.faskes_credentials (id uuid primary key default gen_random_uuid());
alter table public.faskes_credentials
  add column if not exists company_id      uuid not null references public.companies(id) on delete cascade,
  add column if not exists sistem          text not null,
  add column if not exists lingkungan      text not null default 'sandbox',
  add column if not exists publik          jsonb not null default '{}'::jsonb,
  add column if not exists secret_id       uuid,
  add column if not exists diperbarui_oleh text,
  add column if not exists created_at      timestamptz not null default now(),
  add column if not exists updated_at      timestamptz not null default now();

-- Ditulis sebagai yang ADA, bukan sebagai yang bukan. Pelajaran migrasi 0046:
-- daftar negatif membuat nilai baru mana pun ikut lolos tanpa ada yang
-- memutuskannya.
alter table public.faskes_credentials drop constraint if exists kredensial_sistem_check;
alter table public.faskes_credentials add constraint kredensial_sistem_check
  check (sistem in ('satusehat', 'bpjs_pcare', 'bpjs_vclaim'));

alter table public.faskes_credentials drop constraint if exists kredensial_lingkungan_check;
alter table public.faskes_credentials add constraint kredensial_lingkungan_check
  check (lingkungan in ('sandbox', 'produksi'));

comment on table public.faskes_credentials is
  'Kredensial per faskes per sistem. Rahasianya di Supabase Vault; di sini cuma penunjuknya. Tidak ada policy: satu-satunya jalan masuk adalah fungsi.';
comment on column public.faskes_credentials.publik is
  'Pengenal yang boleh dilihat petugas: client_id, organization_id, cons_id. BUKAN tempat menaruh secret.';
comment on column public.faskes_credentials.secret_id is
  'Penunjuk ke vault.secrets. Tidak berguna tanpa akses Vault, dan Vault tidak dibuka ke PostgREST.';

-- Satu faskes punya satu kredensial per sistem per lingkungan. Sandbox dan
-- produksi hidup berdampingan supaya perpindahan tidak menuntut menghapus yang
-- masih dipakai.
create unique index if not exists uq_kredensial_faskes
  on public.faskes_credentials (company_id, sistem, lingkungan);

alter table public.faskes_credentials enable row level security;
drop policy if exists "tenant_all" on public.faskes_credentials;
-- Sengaja TIDAK ada policy. Lihat catatan 2 di kepala berkas.

-- ------------------------------------------------------------
-- 2. Memasang
-- ------------------------------------------------------------
/**
 * Hanya pemilik dan admin. Bukan sekadar kerapian peran: yang memegang
 * kredensial ini bisa mengirim data pasien atas nama kliniknya ke sistem
 * nasional, dan itu tanggung jawab yang menandatangani perjanjiannya.
 *
 * `p_rahasia` boleh null saat cuma mengubah bagian publiknya, supaya
 * memperbaiki satu digit `organization_id` yang salah ketik tidak menuntut
 * mengetik ulang client secret yang panjang. Yang tidak dikirim tidak diubah.
 */
create or replace function public.simpan_kredensial(
  p_sistem     text,
  p_lingkungan text,
  p_publik     jsonb default '{}'::jsonb,
  p_rahasia    jsonb default null,
  p_company    uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := case when p_company is not null and public.boleh_admin_platform()
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
  v_nama  text;
  v_row   record;
  v_sid   uuid;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak memasang kredensial sistem nasional. Ini dipegang pemilik faskes.',
      coalesce(v_peran, 'tanpa peran') using errcode = 'SH007';
  end if;

  if p_sistem not in ('satusehat', 'bpjs_pcare', 'bpjs_vclaim') then
    raise exception 'Sistem "%" tidak dikenali.', p_sistem using errcode = 'SH004';
  end if;
  if p_lingkungan not in ('sandbox', 'produksi') then
    raise exception 'Lingkungan "%" tidak dikenali.', p_lingkungan using errcode = 'SH004';
  end if;
  if p_rahasia is not null and jsonb_typeof(p_rahasia) <> 'object' then
    raise exception 'Rahasia harus berupa objek.' using errcode = 'SH004';
  end if;

  select * into v_row from public.faskes_credentials
   where company_id = v_co and sistem = p_sistem and lingkungan = p_lingkungan
   for update;

  -- Nama deterministik: memasang ulang MENGGANTI, tidak menumpuk. Vault
  -- menolak nama kembar, dan penunjuk yang menumpuk membuat tidak ada yang
  -- tahu mana yang masih dipakai.
  v_nama := 'sehatera:' || v_co::text || ':' || p_sistem || ':' || p_lingkungan;

  if p_rahasia is not null then
    if found and v_row.secret_id is not null then
      -- Dipanggil dengan nama skema di depan. Fungsi `security definer` di sini
      -- mengunci `search_path = public, pg_temp`, jadi apa pun di luar itu
      -- TIDAK terlihat kalau tidak disebut skemanya. Ini persis kesalahan
      -- migrasi 0043: `gen_random_bytes` jadi 42883 di aplikasi sementara
      -- berkas ujinya lulus, karena SQL Editor berjalan dengan search_path
      -- yang lebih luas.
      perform vault.update_secret(v_row.secret_id, p_rahasia::text, v_nama,
        'Kredensial ' || p_sistem || ' (' || p_lingkungan || ') faskes ' || v_co::text);
      v_sid := v_row.secret_id;
    else
      v_sid := vault.create_secret(p_rahasia::text, v_nama,
        'Kredensial ' || p_sistem || ' (' || p_lingkungan || ') faskes ' || v_co::text);
    end if;
  else
    v_sid := case when found then v_row.secret_id else null end;
  end if;

  insert into public.faskes_credentials
    (company_id, sistem, lingkungan, publik, secret_id, diperbarui_oleh, updated_at)
  values
    (v_co, p_sistem, p_lingkungan, coalesce(p_publik, '{}'::jsonb), v_sid,
     lower(auth.jwt() ->> 'email'), now())
  on conflict (company_id, sistem, lingkungan) do update
    set publik          = coalesce(excluded.publik, public.faskes_credentials.publik),
        secret_id       = coalesce(excluded.secret_id, public.faskes_credentials.secret_id),
        diperbarui_oleh = excluded.diperbarui_oleh,
        updated_at      = now()
  returning * into v_row;

  perform public.catat_audit(v_co, 'kredensial.simpan', 'faskes_credentials', v_row.id::text,
    jsonb_build_object('sistem', p_sistem, 'lingkungan', p_lingkungan,
                       'rahasia_diganti', p_rahasia is not null));

  -- Yang dikembalikan sengaja BUKAN barisnya. Barisnya membawa `secret_id`,
  -- dan tidak ada satu pun alasan layar membutuhkannya.
  return jsonb_build_object(
    'sistem', v_row.sistem, 'lingkungan', v_row.lingkungan, 'publik', v_row.publik,
    'terpasang', v_row.secret_id is not null, 'diperbarui_pada', v_row.updated_at);
end;
$$;

revoke all on function public.simpan_kredensial(text, text, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.simpan_kredensial(text, text, jsonb, jsonb, uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. Melihat apa yang sudah terpasang
-- ------------------------------------------------------------
/**
 * Metadata saja: sistem mana, lingkungan mana, bagian publiknya, sudah ada
 * rahasianya atau belum, kapan dan oleh siapa terakhir diubah.
 *
 * `secret_id` TIDAK ikut, dan rahasianya jelas tidak. Layar tidak pernah punya
 * alasan menampilkan kembali kredensial yang sudah dipasang: yang bisa dibaca
 * balik akan dibaca balik, dan yang tampil di layar akan difoto. Kalau
 * kredensialnya hilang, jalannya mengambil yang baru dari portalnya, bukan
 * mengintip yang lama.
 */
create or replace function public.kredensial_faskes(p_company uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := case when p_company is not null and public.boleh_admin_platform()
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak melihat kredensial sistem nasional.',
      coalesce(v_peran, 'tanpa peran') using errcode = 'SH007';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'sistem', k.sistem,
             'lingkungan', k.lingkungan,
             'publik', k.publik,
             'terpasang', k.secret_id is not null,
             'diperbarui_pada', k.updated_at,
             'diperbarui_oleh', k.diperbarui_oleh)
           order by k.sistem, k.lingkungan)
      from public.faskes_credentials k
     where k.company_id = v_co), '[]'::jsonb);
end;
$$;

revoke all on function public.kredensial_faskes(uuid) from public, anon;
grant execute on function public.kredensial_faskes(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Mengambil untuk dipakai mengirim
-- ------------------------------------------------------------
/**
 * SATU-SATUNYA yang mengembalikan rahasianya, dan ia TIDAK diberikan kepada
 * `authenticated`.
 *
 * Yang memanggilnya adalah pengirim di sisi server, yang memegang service
 * role. Kalau fungsi ini terbuka untuk pengguna aplikasi, kunci anon yang
 * memang ada di dalam peramban jadi cukup untuk mengambil client secret
 * kliniknya sendiri, dan sesudah itu tidak ada lagi gunanya Vault.
 *
 * Kalau nanti tetap perlu dipanggil dari sisi server aplikasi, jalannya
 * memberi grant kepada `service_role` di migrasi tersendiri yang menyebutkan
 * alasannya, bukan melonggarkan yang ini.
 */
create or replace function public.ambil_kredensial(p_company uuid, p_sistem text, p_lingkungan text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_row  record;
  v_isi  text;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Kredensial hanya bisa diambil lewat jalur server.' using errcode = 'SH007';
  end if;

  select * into v_row from public.faskes_credentials
   where company_id = p_company and sistem = p_sistem and lingkungan = p_lingkungan;
  if not found then
    raise exception 'Kredensial % (%) belum dipasang untuk faskes ini.', p_sistem, p_lingkungan
      using errcode = 'SH004';
  end if;
  if v_row.secret_id is null then
    raise exception 'Kredensial % (%) belum punya bagian rahasianya.', p_sistem, p_lingkungan
      using errcode = 'SH004';
  end if;

  select s.decrypted_secret into v_isi
    from vault.decrypted_secrets s where s.id = v_row.secret_id;
  if v_isi is null then
    raise exception 'Rahasia tidak terbaca dari Vault. Pasang ulang kredensialnya.' using errcode = 'SH004';
  end if;

  return jsonb_build_object('publik', v_row.publik, 'rahasia', v_isi::jsonb);
end;
$$;

revoke all on function public.ambil_kredensial(uuid, text, text) from public, anon, authenticated;
