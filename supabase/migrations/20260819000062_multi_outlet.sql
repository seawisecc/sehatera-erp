-- ============================================================
-- 0062  Multi outlet: satu pemilik, beberapa faskes
-- ============================================================
--
-- `plans.max_outlets` sudah ada sejak migrasi 0001, halaman harga sudah
-- menampilkan baris "Cabang", dan `lib/plan.ts` sudah menghitung
-- `multiOutlet`. Yang tidak pernah ada: outletnya sendiri. Apotek yang membeli
-- paket bertuliskan "3 cabang" hari ini mendapat satu, dan
-- `company_usage(..., 'outlets')` bahkan tidak menghitung apa-apa.
--
-- **Tiap outlet tetap satu baris `companies` tersendiri.** Ini bukan jalan
-- pintas, melainkan bentuk yang benar untuk apotek di Indonesia: tiap cabang
-- punya SIA dan apoteker penanggung jawabnya sendiri, stoknya sendiri, dan
-- SIPNAP-nya dilaporkan per outlet, bukan digabung. Menyatukan stok beberapa
-- outlet di satu badan usaha justru akan membuat laporan wajibnya salah.
--
-- Yang ditambahkan cuma tiga hal, dan tidak satu pun menyentuh stok atau RLS:
--
-- 1. `company_groups`, supaya beberapa outlet tahu mereka satu pemilik.
-- 2. `outlet_aktif`, penunjuk outlet mana yang sedang dibuka pengguna.
-- 3. `auth_company_id()` menghormati penunjuk itu.
--
-- **Seluruh fungsi lain TIDAK diubah sama sekali**, dan itu memang seluruh
-- alasan bentuk ini dipilih: ratusan tempat memanggil `auth_company_id()`,
-- jadi berpindah outlet cukup mengubah jawaban SATU fungsi.
--
-- **Sekalian membetulkan bug yang sudah ada.** `auth_company_id()` memakai
-- `limit 1` TANPA `order by`. Untuk siapa pun yang terdaftar di dua fasilitas,
-- PostgreSQL boleh mengembalikan yang mana saja, dan boleh berbeda antar
-- permintaan. Artinya satu orang bisa menyimpan data ke outlet yang salah
-- tanpa ada yang tahu, dan tidak akan pernah muncul sebagai galat. Sekarang
-- urutannya ditentukan: penunjuk dulu, lalu yang paling lama terdaftar.

-- ------------------------------------------------------------
-- 1. Kelompok outlet
-- ------------------------------------------------------------

create table if not exists public.company_groups (id uuid primary key default gen_random_uuid());
alter table public.company_groups
  add column if not exists nama        text not null,
  add column if not exists dibuat_oleh text,
  add column if not exists created_at  timestamptz not null default now();

comment on table public.company_groups is
  'Beberapa outlet yang satu pemilik. Tiap outlet tetap faskes tersendiri dengan stok, izin, dan laporan wajibnya sendiri.';

alter table public.companies
  add column if not exists group_id uuid references public.company_groups(id);

create index if not exists idx_companies_group on public.companies (group_id);

alter table public.company_groups enable row level security;
-- Dibaca hanya oleh yang punya outlet di dalamnya.
drop policy if exists "anggota_baca" on public.company_groups;
create policy "anggota_baca" on public.company_groups for select to authenticated
  using (
    public.boleh_admin_platform()
    or exists (select 1 from public.companies c
                where c.group_id = public.company_groups.id
                  and (lower(c.admin_email) = lower(auth.jwt() ->> 'email')
                       or exists (select 1 from public.app_users u
                                   where u.company_id = c.id and u.status = 'aktif'
                                     and lower(u.email) = lower(auth.jwt() ->> 'email'))))
  );

-- ------------------------------------------------------------
-- 2. Outlet yang sedang dibuka
-- ------------------------------------------------------------
/**
 * Penunjuk per PENGGUNA, bukan per tab peramban.
 *
 * Konsekuensinya harus diketahui: pemilik yang membuka dua tab untuk dua
 * outlet akan melihat keduanya mengikuti pilihan terakhir. Itu disengaja.
 * Menyimpannya per tab berarti mengirim outlet aktif pada tiap permintaan,
 * dan permintaan yang lupa membawanya akan menulis ke outlet yang salah:
 * kesalahan yang jauh lebih mahal daripada dua tab yang saling mengikuti.
 */
create table if not exists public.outlet_aktif (email text primary key);
alter table public.outlet_aktif
  add column if not exists company_id uuid not null references public.companies(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

comment on table public.outlet_aktif is
  'Outlet yang sedang dibuka tiap pengguna. Dibaca auth_company_id(); tidak pernah ditulis langsung dari aplikasi.';

alter table public.outlet_aktif enable row level security;
-- Tidak ada policy: satu-satunya jalan masuk adalah `pilih_outlet()`. Kalau
-- bisa ditulis langsung, siapa pun yang tahu alamat tabelnya bisa menunjuk ke
-- outlet milik orang lain, dan sesudah itu SELURUH RLS aplikasi ikut mengikuti
-- penunjuk itu.
drop policy if exists "milik_sendiri" on public.outlet_aktif;

-- ------------------------------------------------------------
-- 3. auth_company_id() menghormati penunjuk
-- ------------------------------------------------------------
create or replace function public.auth_company_id()
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(
    -- 1. Outlet yang sedang dibuka, KALAU ia memang berhak masuk ke sana.
    --    Syarat kedua itu bukan kehati-hatian berlebih: penunjuk yang tidak
    --    diperiksa membuat outlet orang lain terbuka hanya dengan menulis satu
    --    baris ke tabel penunjuk.
    (select o.company_id from public.outlet_aktif o
      join public.companies c on c.id = o.company_id
     where lower(o.email) = lower(auth.jwt() ->> 'email')
       and c.deleted_at is null
       and (lower(c.admin_email) = lower(auth.jwt() ->> 'email')
            or exists (select 1 from public.app_users u
                        where u.company_id = c.id and u.status = 'aktif'
                          and lower(u.email) = lower(auth.jwt() ->> 'email')))),
    -- 2. Pemilik: faskes yang didaftarkan dengan email ini.
    --    `order by created_at` menggantikan `limit 1` telanjang yang dulu:
    --    tanpa urutan, dua faskes berarti jawaban yang boleh berubah antar
    --    permintaan, dan data tersimpan ke outlet yang salah tanpa galat.
    (select id from public.companies
      where lower(admin_email) = lower(auth.jwt() ->> 'email')
        and deleted_at is null
      order by created_at, id
      limit 1),
    -- 3. Anggota tim.
    (select u.company_id from public.app_users u
      join public.companies c on c.id = u.company_id
     where lower(u.email) = lower(auth.jwt() ->> 'email')
       and u.status = 'aktif'
       and c.deleted_at is null
     order by u.created_at, u.id
     limit 1)
  );
$$;

revoke all on function public.auth_company_id() from public, anon;
grant execute on function public.auth_company_id() to authenticated;

-- ------------------------------------------------------------
-- 4. Outlet yang boleh dibuka pengguna ini
-- ------------------------------------------------------------
create or replace function public.outlet_saya()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_aktif uuid := public.auth_company_id();
begin
  if v_email is null then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', c.id, 'nama', c.nama, 'kota', c.kota, 'sektor', c.sektor,
             'group_id', c.group_id, 'kelompok', g.nama,
             'pemilik', lower(c.admin_email) = v_email,
             'aktif', c.id = v_aktif)
           order by c.nama)
      from public.companies c
      left join public.company_groups g on g.id = c.group_id
     where c.deleted_at is null
       and (lower(c.admin_email) = v_email
            or exists (select 1 from public.app_users u
                        where u.company_id = c.id and u.status = 'aktif'
                          and lower(u.email) = v_email))), '[]'::jsonb);
end;
$$;

revoke all on function public.outlet_saya() from public, anon;
grant execute on function public.outlet_saya() to authenticated;

-- ------------------------------------------------------------
-- 5. Berpindah outlet
-- ------------------------------------------------------------
create or replace function public.pilih_outlet(p_company uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_row   record;
begin
  if v_email is null then
    raise exception 'Tidak ada sesi.' using errcode = 'SH004';
  end if;

  select c.* into v_row from public.companies c
   where c.id = p_company and c.deleted_at is null
     and (lower(c.admin_email) = v_email
          or exists (select 1 from public.app_users u
                      where u.company_id = c.id and u.status = 'aktif'
                        and lower(u.email) = v_email));
  if not found then
    raise exception 'Outlet ini bukan milik akun Anda.' using errcode = 'SH007';
  end if;

  insert into public.outlet_aktif (email, company_id, updated_at)
  values (v_email, p_company, now())
  on conflict (email) do update set company_id = excluded.company_id, updated_at = now();

  perform public.catat_audit(p_company, 'outlet.pindah', 'companies', p_company::text,
    jsonb_build_object('nama', v_row.nama));

  return jsonb_build_object('id', v_row.id, 'nama', v_row.nama, 'sektor', v_row.sektor);
end;
$$;

revoke all on function public.pilih_outlet(uuid) from public, anon;
grant execute on function public.pilih_outlet(uuid) to authenticated;

-- ------------------------------------------------------------
-- 6. Kuota outlet akhirnya dihitung
-- ------------------------------------------------------------
-- Disalin dari migrasi 0003, ditambah satu cabang. Dulu `outlets` ada di
-- `company_quota` tapi tidak pernah ada di `company_usage`, jadi batasnya
-- terbaca di layar Super Admin lalu tidak pernah dipakai menolak apa pun.
create or replace function public.company_usage(p_company uuid, p_key text)
returns integer
language sql stable security definer set search_path = public, pg_temp
as $$
  select (case p_key
    when 'products' then
      (select count(*) from public.products where company_id = p_company)
    when 'users' then
      (select count(*) from public.app_users
        where company_id = p_company and status = 'aktif')
    when 'outlets' then
      -- Faskes tanpa kelompok berarti satu outlet, bukan nol.
      (select greatest(count(*), 1) from public.companies c
        where c.deleted_at is null
          and c.group_id is not null
          and c.group_id = (select group_id from public.companies where id = p_company))
  end)::integer
$$;

-- ------------------------------------------------------------
-- 7. Menambah outlet
-- ------------------------------------------------------------
/**
 * Outlet baru mewarisi PAKET dan MASA AKTIF outlet asalnya, dan tidak membuat
 * langganan kedua.
 *
 * Kalau tiap outlet punya langganannya sendiri, pemilik jaringan membayar
 * berkali-kali untuk satu paket yang tertulis "3 cabang", dan itu persis
 * kebalikan dari yang dijanjikan halaman harga.
 *
 * Yang boleh menambah cuma pemilik outlet asalnya, bukan admin: menambah
 * outlet menambah tagihan.
 */
create or replace function public.tambah_outlet(
  p_nama   text,
  p_kota   text default null,
  p_sektor text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_asal  record;
  v_grup  uuid;
  v_batas integer;
  v_pakai integer;
  v_row   record;
begin
  select c.* into v_asal from public.companies c
   where c.id = public.auth_company_id() and c.deleted_at is null;
  if not found then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if lower(coalesce(v_asal.admin_email, '')) <> v_email and not public.boleh_admin_platform() then
    raise exception 'Hanya pemilik yang boleh menambah outlet. Menambah outlet menambah tagihan.'
      using errcode = 'SH007';
  end if;
  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama outlet wajib diisi.' using errcode = 'SH004';
  end if;

  -- Kelompoknya dibuat saat outlet KEDUA lahir, bukan saat mendaftar. Faskes
  -- tunggal tidak perlu tahu apa pun tentang kelompok.
  v_grup := v_asal.group_id;
  if v_grup is null then
    insert into public.company_groups (nama, dibuat_oleh)
    values (v_asal.nama, v_email) returning id into v_grup;
    update public.companies set group_id = v_grup where id = v_asal.id;
  end if;

  v_batas := public.company_quota(v_asal.id, 'outlets');
  if v_batas is not null then
    select count(*) into v_pakai from public.companies
     where group_id = v_grup and deleted_at is null;
    if v_pakai >= v_batas then
      raise exception 'Paket ini hanya mengizinkan % outlet. Naikkan paket dulu untuk menambah cabang.', v_batas
        using errcode = 'SH002';
    end if;
  end if;

  insert into public.companies (
    nama, kota, admin_email, sektor, group_id,
    plan_id, status, trial_ends_at, subscription_ends_at)
  values (
    trim(p_nama), nullif(trim(p_kota), ''), v_asal.admin_email,
    coalesce(nullif(trim(p_sektor), ''), v_asal.sektor), v_grup,
    v_asal.plan_id, v_asal.status, v_asal.trial_ends_at, v_asal.subscription_ends_at)
  returning * into v_row;

  perform public.catat_audit(v_row.id, 'outlet.tambah', 'companies', v_row.id::text,
    jsonb_build_object('nama', v_row.nama, 'dari', v_asal.nama));

  return jsonb_build_object('id', v_row.id, 'nama', v_row.nama, 'sektor', v_row.sektor);
end;
$$;

revoke all on function public.tambah_outlet(text, text, text) from public, anon;
grant execute on function public.tambah_outlet(text, text, text) to authenticated;

-- ------------------------------------------------------------
-- 8. Rekap lintas outlet
-- ------------------------------------------------------------
/**
 * Penjualan per outlet dalam satu kelompok.
 *
 * Ini yang membuat multi outlet berarti sesuatu bagi pemiliknya: tanpa rekap,
 * ia tetap harus membuka tiga layar dan menjumlahkan sendiri, dan yang
 * dijumlahkan tangan cepat atau lambat salah.
 *
 * Hanya untuk yang MEMILIKI outletnya, bukan tiap anggota tim: kasir di cabang
 * A tidak punya urusan dengan omzet cabang B.
 */
create or replace function public.rekap_outlet(p_dari date, p_sampai date)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_grup  uuid;
begin
  select group_id into v_grup from public.companies where id = public.auth_company_id();

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', x.id, 'nama', x.nama, 'kota', x.kota,
             'jumlah_transaksi', x.jumlah, 'total', x.total,
             'diterima_tunai', x.tunai, 'ditagihkan_penjamin', x.tagih)
           order by x.total desc nulls last)
    from (
      select c.id, c.nama, c.kota,
             count(t.id)::integer                        as jumlah,
             coalesce(sum(t.total), 0)::numeric          as total,
             coalesce(sum(t.diterima_tunai), 0)::numeric as tunai,
             coalesce(sum(t.ditagihkan_penjamin), 0)::numeric as tagih
        from public.companies c
        left join public.transactions t
               on t.company_id = c.id
              and t.status = 'selesai'
              and t.created_at::date between p_dari and p_sampai
       where c.deleted_at is null
         and lower(c.admin_email) = v_email
         and (v_grup is null or c.group_id = v_grup or c.id = public.auth_company_id())
       group by c.id, c.nama, c.kota
    ) x), '[]'::jsonb);
end;
$$;

revoke all on function public.rekap_outlet(date, date) from public, anon;
grant execute on function public.rekap_outlet(date, date) to authenticated;
