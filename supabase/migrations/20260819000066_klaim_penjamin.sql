-- ============================================================
-- 0066  Klaim penjamin: dokumen yang dikirim, bukan cuma cetakan
-- ============================================================
--
-- Migrasi 0051 memisahkan `diterima_tunai` dari `ditagihkan_penjamin`, jadi
-- pemilik akhirnya tahu berapa yang masih ditagihkan. Yang belum ada: dokumen
-- yang benar-benar dikirim ke BPJS atau asuransi, dan cara tahu mana yang sudah
-- dibayar.
--
-- **Klaim adalah BARIS, bukan tombol cetak.** Faktur yang cuma dicetak tanpa
-- meninggalkan catatan berarti klinik tidak bisa menjawab tiga pertanyaan yang
-- pasti ditanyakan: klaim mana yang sudah dikirim, berapa yang belum dibayar,
-- dan transaksi ini sudah masuk klaim yang mana. Yang tidak tercatat akan
-- ditagihkan dua kali, dan menagih penjamin dua kali untuk pelayanan yang sama
-- adalah cara tercepat kehilangan kerja sama.
--
-- **Barisnya CUPLIKAN, bukan tautan hidup.** Alasannya sama seperti payload
-- antrean kirim di 0056 dan `transaction_item_batches` di 0009: klaim yang
-- sudah dikirim ke BPJS tidak boleh berubah isinya karena satu transaksi
-- dibatalkan minggu depan. Yang berubah harus TERLIHAT sebagai selisih, bukan
-- diam-diam menyesuaikan diri.

create table if not exists public.claims (id uuid primary key default gen_random_uuid());
alter table public.claims
  add column if not exists company_id   uuid not null references public.companies(id) on delete cascade,
  add column if not exists nomor        text,
  add column if not exists penjamin     text not null,
  add column if not exists asuransi_id  uuid references public.insurers(id),
  add column if not exists dari         date not null,
  add column if not exists sampai       date not null,
  add column if not exists jumlah_transaksi integer not null default 0,
  add column if not exists total_pelayanan  numeric(14,2) not null default 0,
  add column if not exists total_ditagihkan numeric(14,2) not null default 0,
  add column if not exists rincian     jsonb not null default '[]'::jsonb,
  add column if not exists status      text not null default 'draf',
  add column if not exists dikirim_pada timestamptz,
  add column if not exists dibayar_pada date,
  add column if not exists dibayar_jumlah numeric(14,2),
  add column if not exists catatan     text,
  add column if not exists dibuat_oleh text,
  add column if not exists created_at  timestamptz not null default now();

-- Ditulis sebagai yang ADA. Pelajaran 0046 lagi: daftar negatif membuat
-- keadaan baru mana pun ikut lolos ke tempat yang tidak memutuskannya.
alter table public.claims drop constraint if exists claim_status_check;
alter table public.claims add constraint claim_status_check
  check (status in ('draf', 'dikirim', 'dibayar', 'ditolak', 'batal'));

alter table public.claims drop constraint if exists claim_penjamin_check;
alter table public.claims add constraint claim_penjamin_check
  check (penjamin in ('bpjs', 'asuransi'));

comment on table public.claims is
  'Tagihan ke penjamin untuk satu rentang tanggal. Rinciannya cuplikan: klaim yang sudah dikirim tidak boleh berubah karena transaksi dibatalkan kemudian.';
comment on column public.claims.rincian is
  'Cuplikan baris saat klaim dibuat. Bukan tautan hidup: yang berubah harus terlihat sebagai selisih, bukan diam-diam menyesuaikan diri.';

create unique index if not exists uq_claim_nomor
  on public.claims (company_id, nomor) where nomor is not null;
create index if not exists idx_claim_company on public.claims (company_id, status, dari desc);

alter table public.claims enable row level security;
drop policy if exists "tenant_all" on public.claims;
create policy "tenant_all" on public.claims for all to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id())
  with check (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.claims;
create trigger trg_set_company_id before insert on public.claims
  for each row execute function public.set_company_id();

-- Penanda di transaksinya, supaya satu pelayanan tidak masuk dua klaim.
alter table public.transactions
  add column if not exists claim_id uuid references public.claims(id) on delete set null;

create index if not exists idx_trx_claim on public.transactions (company_id, claim_id);

comment on column public.transactions.claim_id is
  'Klaim yang menagihkan transaksi ini. Terisi berarti sudah ditagihkan; menagihkannya lagi berarti menagih penjamin dua kali.';

-- ------------------------------------------------------------
-- Yang belum ditagihkan
-- ------------------------------------------------------------
/**
 * Transaksi berpenjamin yang belum masuk klaim mana pun.
 *
 * Ini yang dilihat sebelum membuat klaim: kalau daftarnya kosong, tidak ada
 * yang perlu ditagihkan, dan tombol yang tetap bisa ditekan cuma menghasilkan
 * klaim kosong yang harus dibatalkan lagi.
 */
create or replace function public.tagihan_belum_diklaim(
  p_dari     date,
  p_sampai   date,
  p_penjamin text default null,
  p_asuransi uuid default null
)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_peran text := public.peran_saya();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuka tagihan penjamin.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', t.id, 'nomor', t.nomor_transaksi, 'tanggal', t.created_at,
             'penjamin', t.penjamin, 'asuransi', i.nama,
             'pasien', coalesce(p.nama, t.nama_pasien),
             'nomor_rm', p.nomor_rm, 'nomor_penjamin', v.nomor_penjamin,
             'kunjungan', v.nomor,
             'diagnosis', (select d.kode_icd10 from public.visit_diagnoses d
                            where d.visit_id = v.id and d.tipe = 'primer' limit 1),
             'diagnosis_nama', (select d.nama from public.visit_diagnoses d
                                 where d.visit_id = v.id and d.tipe = 'primer' limit 1),
             'total', t.total, 'ditagihkan', t.ditagihkan_penjamin)
           order by t.created_at)
      from public.transactions t
      left join public.visits v on v.id = t.visit_id
      left join public.patients p on p.id = v.patient_id
      left join public.insurers i on i.id = t.asuransi_id
     where t.company_id = v_co
       and t.status = 'selesai'
       and t.claim_id is null
       and coalesce(t.ditagihkan_penjamin, 0) > 0
       and t.created_at::date between p_dari and p_sampai
       and (p_penjamin is null or t.penjamin = p_penjamin)
       and (p_asuransi is null or t.asuransi_id = p_asuransi)), '[]'::jsonb);
end;
$$;

revoke all on function public.tagihan_belum_diklaim(date, date, text, uuid) from public, anon;
grant execute on function public.tagihan_belum_diklaim(date, date, text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Membuat klaim
-- ------------------------------------------------------------
create or replace function public.buat_klaim(
  p_dari     date,
  p_sampai   date,
  p_penjamin text,
  p_asuransi uuid default null,
  p_catatan  text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_peran text := public.peran_saya();
  v_isi   jsonb;
  v_row   record;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuat klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if p_penjamin not in ('bpjs', 'asuransi') then
    raise exception 'Klaim hanya untuk BPJS atau asuransi. Pasien umum membayar sendiri.'
      using errcode = 'SH004';
  end if;
  if p_penjamin = 'asuransi' and p_asuransi is null then
    raise exception 'Pilih dulu penerbit asuransinya: satu klaim tidak bisa dikirim ke dua perusahaan.'
      using errcode = 'SH004';
  end if;
  if p_sampai < p_dari then
    raise exception 'Tanggal akhir lebih awal daripada tanggal mulai.' using errcode = 'SH004';
  end if;

  v_isi := public.tagihan_belum_diklaim(p_dari, p_sampai, p_penjamin, p_asuransi);
  if jsonb_array_length(v_isi) = 0 then
    raise exception 'Tidak ada tagihan yang belum diklaim pada rentang itu.' using errcode = 'SH004';
  end if;

  insert into public.claims (
    company_id, nomor, penjamin, asuransi_id, dari, sampai,
    jumlah_transaksi, total_pelayanan, total_ditagihkan, rincian, catatan, dibuat_oleh)
  values (
    v_co,
    public.next_doc_number(v_co, 'claims', 'nomor', 'KLM', to_char(p_sampai, 'YYYY')),
    p_penjamin, p_asuransi, p_dari, p_sampai,
    jsonb_array_length(v_isi),
    (select coalesce(sum((x ->> 'total')::numeric), 0) from jsonb_array_elements(v_isi) x),
    (select coalesce(sum((x ->> 'ditagihkan')::numeric), 0) from jsonb_array_elements(v_isi) x),
    v_isi, nullif(trim(p_catatan), ''), lower(auth.jwt() ->> 'email'))
  returning * into v_row;

  -- Penandanya dipasang SESUDAH klaimnya ada, dan hanya pada baris yang benar
  -- benar masuk cuplikan. Kalau ditandai lebih dulu, kegagalan di tengah
  -- meninggalkan transaksi bertanda klaim yang tidak pernah ada.
  update public.transactions t
     set claim_id = v_row.id
    from jsonb_array_elements(v_isi) x
   where t.id = (x ->> 'id')::uuid and t.company_id = v_co and t.claim_id is null;

  perform public.catat_audit(v_co, 'klaim.buat', 'claims', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'penjamin', p_penjamin,
                       'transaksi', v_row.jumlah_transaksi, 'nilai', v_row.total_ditagihkan));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.buat_klaim(date, date, text, uuid, text) from public, anon;
grant execute on function public.buat_klaim(date, date, text, uuid, text) to authenticated;

-- ------------------------------------------------------------
-- Rel keadaan klaim
-- ------------------------------------------------------------
/**
 * draf -> dikirim -> dibayar / ditolak, dan batal dari mana saja kecuali
 * dibayar.
 *
 * Membatalkan klaim MELEPAS penanda di transaksinya, supaya pelayanannya bisa
 * masuk klaim berikutnya. Tanpa itu, satu klaim yang salah rentang akan
 * mengunci pelayanan sebulan penuh dari penagihan, dan uangnya hilang tanpa
 * ada yang menyadarinya.
 */
create or replace function public.ubah_status_klaim(
  p_id      uuid,
  p_status  text,
  p_dibayar numeric default null,
  p_tanggal date default null,
  p_catatan text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_peran text := public.peran_saya();
  v_row   record;
begin
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak mengubah klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if p_status not in ('draf', 'dikirim', 'dibayar', 'ditolak', 'batal') then
    raise exception 'Keadaan klaim "%" tidak dikenali.', p_status using errcode = 'SH004';
  end if;

  select * into v_row from public.claims
   where id = p_id and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Klaim tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.status = 'dibayar' and p_status <> 'dibayar' then
    raise exception 'Klaim yang sudah dibayar tidak bisa diubah lagi. Selisihnya diurus lewat klaim berikutnya.'
      using errcode = 'SH004';
  end if;
  if p_status = 'dibayar' and coalesce(p_dibayar, 0) <= 0 then
    raise exception 'Jumlah yang dibayar penjamin wajib diisi. Klaim dibayar nol tidak bisa dibedakan dari klaim yang ditolak.'
      using errcode = 'SH004';
  end if;

  update public.claims set
    status         = p_status,
    dikirim_pada   = case when p_status = 'dikirim' then coalesce(dikirim_pada, now()) else dikirim_pada end,
    dibayar_pada   = case when p_status = 'dibayar' then coalesce(p_tanggal, current_date) else null end,
    dibayar_jumlah = case when p_status = 'dibayar' then p_dibayar else null end,
    catatan        = coalesce(nullif(trim(p_catatan), ''), catatan)
   where id = p_id
  returning * into v_row;

  if p_status = 'batal' then
    update public.transactions set claim_id = null where claim_id = p_id;
  end if;

  perform public.catat_audit(v_row.company_id, 'klaim.' || p_status, 'claims', p_id::text,
    jsonb_build_object('nomor', v_row.nomor, 'dibayar', v_row.dibayar_jumlah));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.ubah_status_klaim(uuid, text, numeric, date, text) from public, anon;
grant execute on function public.ubah_status_klaim(uuid, text, numeric, date, text) to authenticated;

-- ------------------------------------------------------------
-- Daftar klaim
-- ------------------------------------------------------------
/**
 * `selisih_dibatalkan` menghitung transaksi yang SUDAH masuk klaim ini lalu
 * dibatalkan sesudahnya.
 *
 * Rinciannya sengaja cuplikan supaya klaim yang sudah dikirim tidak berubah
 * diam-diam, tapi selisihnya tetap harus TERLIHAT: klaim yang berisi pelayanan
 * yang sudah dibatalkan akan ditolak penjamin, dan lebih baik diketahui
 * sekarang daripada dari surat penolakan sebulan kemudian.
 */
create or replace function public.daftar_klaim(p_status text default null)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_peran text := public.peran_saya();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not public.boleh_admin_platform() and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuka daftar klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', c.id, 'nomor', c.nomor, 'penjamin', c.penjamin,
             'asuransi', i.nama, 'dari', c.dari, 'sampai', c.sampai,
             'jumlah_transaksi', c.jumlah_transaksi,
             'total_pelayanan', c.total_pelayanan,
             'total_ditagihkan', c.total_ditagihkan,
             'status', c.status, 'dikirim_pada', c.dikirim_pada,
             'dibayar_pada', c.dibayar_pada, 'dibayar_jumlah', c.dibayar_jumlah,
             'catatan', c.catatan, 'dibuat_oleh', c.dibuat_oleh, 'created_at', c.created_at,
             'rincian', c.rincian,
             'selisih_dibatalkan', (
               select count(*) from public.transactions t
                where t.claim_id = c.id and t.status <> 'selesai'))
           order by c.created_at desc)
      from public.claims c
      left join public.insurers i on i.id = c.asuransi_id
     where c.company_id = v_co
       and (p_status is null or c.status = p_status)), '[]'::jsonb);
end;
$$;

revoke all on function public.daftar_klaim(text) from public, anon;
grant execute on function public.daftar_klaim(text) to authenticated;
