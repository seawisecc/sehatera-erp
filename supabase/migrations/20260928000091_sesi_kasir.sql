-- ============================================================
-- 0091  Sesi kasir: kas awal, tutup kasir, dan selisih laci
-- ============================================================
--
-- CLAUDE.md sudah lama menulis "laci kasir harus cocok saat tutup buku"
-- (migrasi 0051 memisahkan diterima_tunai dari ditagihkan_penjamin justru
-- untuk itu), tapi tidak ada tempat mencocokkannya. Selisih uang tidak bisa
-- ditelusuri ke siapa, karena transaksi bahkan tidak mencatat kasirnya.
--
-- Tiga bagian:
--
--   1. transactions.dibuat_oleh terisi SENDIRI dari email di token pemanggil
--      (nilai bawaan kolom). apply_transaction tidak perlu disentuh: fungsi
--      security definer tetap membaca request.jwt.claims milik peramban yang
--      memanggilnya. Transaksi lama tetap null; tidak ada yang ditebak surut.
--
--   2. sesi_kasir: satu sesi terbuka per kasir per faskes. Dibuka dengan kas
--      awal (uang kembalian di laci), ditutup dengan uang yang dihitung.
--
--   3. Saat tutup, database menghitung kas SEHARUSNYA = kas awal + diterima
--      tunai dari transaksi metode Tunai milik kasir itu selama sesinya,
--      tanpa yang dibatalkan. Angkanya DIBEKUKAN di baris sesi: pembatalan
--      transaksi minggu depan tidak boleh mengubah setoran yang sudah
--      diserahkan hari ini. Pola cuplikan yang sama dengan klaim (0066).
--
-- Selisih wajib diberi catatan. Sesi TIDAK memblokir penjualan: kasir yang
-- lupa membuka sesi tetap bisa melayani, karena palang di depan pembeli yang
-- antre akan diakali dengan cara yang tidak meninggalkan jejak sama sekali.

-- ── 1. Siapa yang membuat transaksi ─────────────────────────────────────
alter table public.transactions add column if not exists dibuat_oleh text
  default lower(nullif(auth.jwt() ->> 'email', ''));
create index if not exists idx_transactions_kasir on public.transactions (company_id, dibuat_oleh, created_at);

-- ── 2. Tabel sesi ───────────────────────────────────────────────────────
create table if not exists public.sesi_kasir (
  id uuid primary key default gen_random_uuid()
);
alter table public.sesi_kasir add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.sesi_kasir add column if not exists kasir_email text;
alter table public.sesi_kasir add column if not exists status text not null default 'buka';
alter table public.sesi_kasir add column if not exists dibuka_pada timestamptz not null default now();
alter table public.sesi_kasir add column if not exists kas_awal numeric not null default 0;
alter table public.sesi_kasir add column if not exists ditutup_pada timestamptz;
alter table public.sesi_kasir add column if not exists ditutup_oleh text;
alter table public.sesi_kasir add column if not exists tunai_diterima numeric;
alter table public.sesi_kasir add column if not exists non_tunai numeric;
alter table public.sesi_kasir add column if not exists jumlah_transaksi integer;
alter table public.sesi_kasir add column if not exists kas_seharusnya numeric;
alter table public.sesi_kasir add column if not exists kas_dihitung numeric;
alter table public.sesi_kasir add column if not exists selisih numeric
  generated always as (kas_dihitung - kas_seharusnya) stored;
alter table public.sesi_kasir add column if not exists catatan text;

alter table public.sesi_kasir drop constraint if exists sesi_kasir_status_check;
alter table public.sesi_kasir add constraint sesi_kasir_status_check check (status in ('buka', 'tutup'));
alter table public.sesi_kasir drop constraint if exists sesi_kasir_kas_check;
alter table public.sesi_kasir add constraint sesi_kasir_kas_check
  check (kas_awal >= 0 and (kas_dihitung is null or kas_dihitung >= 0));

create unique index if not exists uq_sesi_kasir_satu_buka on public.sesi_kasir (company_id, kasir_email) where status = 'buka';
create index if not exists idx_sesi_kasir_company on public.sesi_kasir (company_id, dibuka_pada desc);

alter table public.sesi_kasir enable row level security;
drop policy if exists tenant_baca on public.sesi_kasir;
create policy tenant_baca on public.sesi_kasir for select
  using (company_id = public.auth_company_id() or public.is_super_admin());
grant select, insert, update, delete on public.sesi_kasir to authenticated, service_role;

-- ── Hak: di matriks yang satu ───────────────────────────────────────────
do $$
declare
  v_def  text;
  v_jangkar text := $j$        when 'stok.opname.final' then peran in ('pemilik','admin','apoteker')$j$;
begin
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('kasir.sesi' in v_def) > 0 then return; end if;
  if position(v_jangkar in v_def) = 0 then
    raise exception 'Jangkar boleh() tidak ditemukan; migrasi 0091 dibatalkan.';
  end if;
  execute replace(v_def, v_jangkar, v_jangkar || E'\n' ||
    $j$        when 'kasir.sesi'        then peran in ('pemilik','admin','kasir','apoteker','asisten_apoteker','pendaftaran')$j$ || E'\n' ||
    $j$        when 'kasir.setoran'     then peran in ('pemilik','admin')$j$);
  select pg_get_functiondef('public.boleh(text)'::regprocedure) into v_def;
  if position('kasir.setoran' in v_def) = 0 then
    raise exception 'boleh() tidak memuat kasir.setoran; migrasi 0091 dibatalkan.';
  end if;
end $$;

-- ── Hitungan laci, satu tempat untuk layar dan penutupan ────────────────
-- Dipakai layar untuk menampilkan angka sementara DAN oleh tutup_kasir untuk
-- membekukannya. Dua kueri yang seharusnya menjawab sama akan berbeda pada
-- hari salah satunya diperbaiki (pelajaran tagihan_belum_diklaim, 0066).
create or replace function public.hitung_sesi_kasir(p_sesi uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm boolean := public.boleh_admin_platform();
  v_s   record;
  v_hasil jsonb;
begin
  select * into v_s from public.sesi_kasir
   where id = p_sesi and (v_adm or company_id = public.auth_company_id());
  if not found then
    raise exception 'Sesi kasir tidak ditemukan.' using errcode = 'SH004';
  end if;

  select jsonb_build_object(
           'tunai',     coalesce(sum(t.diterima_tunai) filter (where coalesce(t.metode_bayar, 'Tunai') = 'Tunai'), 0),
           'non_tunai', coalesce(sum(t.diterima_tunai) filter (where coalesce(t.metode_bayar, 'Tunai') <> 'Tunai'), 0),
           'jumlah',    count(*),
           'per_metode', coalesce((
              select jsonb_object_agg(m, n) from (
                select coalesce(x.metode_bayar, 'Tunai') m, sum(x.diterima_tunai) n
                  from public.transactions x
                 where x.company_id = v_s.company_id and lower(x.dibuat_oleh) = lower(v_s.kasir_email)
                   and x.created_at >= v_s.dibuka_pada
                   and x.created_at < coalesce(v_s.ditutup_pada, now())
                   and coalesce(x.status, 'selesai') <> 'dibatalkan'
                 group by 1) y), '{}'::jsonb))
    into v_hasil
    from public.transactions t
   where t.company_id = v_s.company_id and lower(t.dibuat_oleh) = lower(v_s.kasir_email)
     and t.created_at >= v_s.dibuka_pada
     and t.created_at < coalesce(v_s.ditutup_pada, now())
     and coalesce(t.status, 'selesai') <> 'dibatalkan';

  return v_hasil || jsonb_build_object(
    'kas_awal', v_s.kas_awal,
    'kas_seharusnya', v_s.kas_awal + (v_hasil ->> 'tunai')::numeric);
end;
$$;

-- ── buka_kasir ──────────────────────────────────────────────────────────
create or replace function public.buka_kasir(p_kas_awal numeric, p_company uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm then p_company else public.auth_company_id() end;
  v_email text := lower(nullif(auth.jwt() ->> 'email', ''));
  v_row   record;
begin
  if v_co is null or v_email is null then
    raise exception 'Masuk sebagai kasir di satu faskes dulu.' using errcode = 'SH004';
  end if;
  perform public.wajib_boleh('kasir.sesi');
  if coalesce(p_kas_awal, -1) < 0 then
    raise exception 'Kas awal tidak boleh kurang dari nol.' using errcode = 'SH004';
  end if;
  begin
    insert into public.sesi_kasir (company_id, kasir_email, kas_awal)
    values (v_co, v_email, p_kas_awal)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'Anda masih punya sesi kasir yang terbuka. Tutup dulu yang itu.' using errcode = 'SH004';
  end;
  perform public.catat_audit(v_co, 'kasir.buka', 'sesi_kasir', v_row.id::text,
    jsonb_build_object('kas_awal', p_kas_awal));
  return to_jsonb(v_row);
end;
$$;

-- ── tutup_kasir ─────────────────────────────────────────────────────────
create or replace function public.tutup_kasir(p_sesi uuid, p_kas_dihitung numeric, p_catatan text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_email text := lower(nullif(auth.jwt() ->> 'email', ''));
  v_s     record;
  v_h     jsonb;
  v_harus numeric;
  v_row   record;
begin
  select * into v_s from public.sesi_kasir
   where id = p_sesi and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Sesi kasir tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_s.status <> 'buka' then
    raise exception 'Sesi ini sudah ditutup.' using errcode = 'SH004';
  end if;
  -- Yang menutup: kasirnya sendiri, atau pemilik/admin (kasir pulang lupa
  -- menutup). Orang lain menutup laci orang lain adalah menandatangani uang
  -- yang tidak ia hitung.
  if not v_adm and lower(v_s.kasir_email) <> coalesce(v_email, '') and not public.boleh('kasir.setoran') then
    raise exception 'Hanya kasirnya sendiri, pemilik, atau admin yang boleh menutup sesi ini.' using errcode = 'SH007';
  end if;
  if coalesce(p_kas_dihitung, -1) < 0 then
    raise exception 'Isi jumlah uang yang dihitung di laci.' using errcode = 'SH004';
  end if;

  -- Waktu tutup dicatat LEBIH DULU, supaya hitungan di bawah memakai batas
  -- yang sama persis dengan yang tersimpan.
  update public.sesi_kasir set ditutup_pada = now() where id = p_sesi;
  v_h := public.hitung_sesi_kasir(p_sesi);
  v_harus := (v_h ->> 'kas_seharusnya')::numeric;

  if p_kas_dihitung <> v_harus and coalesce(trim(p_catatan), '') = '' then
    raise exception 'Ada selisih % antara uang dihitung dan yang seharusnya. Tulis catatannya dulu.',
      to_char(p_kas_dihitung - v_harus, 'FM999G999G999') using errcode = 'SH004';
  end if;

  update public.sesi_kasir
     set status = 'tutup',
         ditutup_oleh = coalesce(v_email, 'sistem'),
         tunai_diterima = (v_h ->> 'tunai')::numeric,
         non_tunai = (v_h ->> 'non_tunai')::numeric,
         jumlah_transaksi = (v_h ->> 'jumlah')::integer,
         kas_seharusnya = v_harus,
         kas_dihitung = p_kas_dihitung,
         catatan = nullif(trim(p_catatan), '')
   where id = p_sesi
   returning * into v_row;

  perform public.catat_audit(v_s.company_id, 'kasir.tutup', 'sesi_kasir', p_sesi::text,
    jsonb_build_object('kasir', v_s.kasir_email, 'seharusnya', v_harus,
                       'dihitung', p_kas_dihitung, 'selisih', p_kas_dihitung - v_harus));
  return to_jsonb(v_row) || jsonb_build_object('per_metode', v_h -> 'per_metode');
end;
$$;

revoke all on function public.hitung_sesi_kasir(uuid)                from public, anon;
revoke all on function public.buka_kasir(numeric, uuid)              from public, anon;
revoke all on function public.tutup_kasir(uuid, numeric, text)       from public, anon;
grant execute on function public.hitung_sesi_kasir(uuid)             to authenticated;
grant execute on function public.buka_kasir(numeric, uuid)           to authenticated;
grant execute on function public.tutup_kasir(uuid, numeric, text)    to authenticated;
