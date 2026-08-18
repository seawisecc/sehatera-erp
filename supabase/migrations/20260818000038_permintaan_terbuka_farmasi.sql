-- ============================================================
-- 0038  Permintaan terbuka: dokter meminta, farmasi memilih
-- ============================================================
--
-- Keadaan yang dituju: dokter tahu golongan obat yang ia mau tapi tidak hafal
-- apa yang sedang ada di rak, atau sengaja menyerahkan pilihannya ke apoteker.
-- Sekarang ia harus menebak nama produk, dan kalau tebakannya habis stok,
-- resepnya harus dibatalkan lalu ditulis ulang.
--
-- Yang TIDAK dibuat, dan ini keputusan yang perlu dibaca sebelum menambah
-- apa pun di sini: **farmasi tidak bisa menambahkan baris obat yang sama
-- sekali tidak ditulis dokter.** Itu bukan penyerahan lagi, itu meresepkan,
-- dan yang tercatat sebagai peresep harus tetap dokter. Kalau nanti ada
-- sengketa, pertanyaannya "siapa yang memerintahkan obat ini", dan jawaban
-- "farmasi memilih sendiri" adalah jawaban yang mahal.
--
-- Jadi bentuknya: DOKTER tetap menulis barisnya, walau kabur
-- ("antihistamin oral, 10 tablet"), dan menandainya sebagai permintaan
-- terbuka. Baris itulah resepnya. Farmasi mengisi produk mana yang dipakai.
--
-- Permintaan aslinya TIDAK ditimpa. Ia pindah ke `permintaan_asli` dan tetap
-- terbaca selamanya, jadi rekamnya selalu berbunyi "dokter meminta X, farmasi
-- mengisi Y, oleh siapa, jam berapa". Pola yang sama dengan adendum rekam
-- medis di migrasi 0018: yang asli tidak pernah dihapus, yang baru menempel
-- sebagai lapisan bernama.

alter table public.prescription_items
  add column if not exists permintaan_terbuka boolean not null default false,
  add column if not exists permintaan_asli    text,
  add column if not exists diisi_oleh         text,
  add column if not exists diisi_pada         timestamptz;

comment on column public.prescription_items.permintaan_terbuka is
  'Dokter sengaja tidak memilih produk dan menyerahkannya ke farmasi. Hanya baris seperti ini yang boleh diisi farmasi.';
comment on column public.prescription_items.permintaan_asli is
  'Kata-kata dokter sebelum farmasi mengisi. Tidak pernah ditimpa, supaya selalu terbaca siapa meminta apa.';

-- ------------------------------------------------------------
-- 1. Dokter menandai permintaannya terbuka
-- ------------------------------------------------------------
-- `simpan_resep` ditulis ulang seluruhnya hanya untuk menambah satu kolom di
-- INSERT-nya. Sisanya sama persis dengan migrasi 0023, termasuk seluruh
-- penjaganya: kunjungan tertutup ditolak, resep final ditolak, obat golongan
-- menuntut identitas pasien.

create or replace function public.simpan_resep(
  p_visit  uuid,
  p_items  jsonb,
  p_catatan text default null,
  p_final  boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit  record;
  v_resep  record;
  v_email  text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_item   jsonb;
  v_urut   integer := 0;
  v_jumlah numeric;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, resepnya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  -- Daftar status di sini DIPERLUAS, dan ini memperbaiki lubang yang dibuka
  -- migrasi 0035 tanpa disadari. Aslinya cuma melihat ('draf','final'), jadi
  -- resep yang sedang `disiapkan` atau `siap` tidak terlihat sama sekali dan
  -- dokter yang menekan simpan akan mendapat resep KEDUA di kunjungan yang
  -- sama, diam-diam, sementara farmasi masih menyiapkan yang pertama.
  select * into v_resep from public.prescriptions
   where visit_id = p_visit and status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;

  if found and v_resep.status <> 'draf' then
    raise exception 'Resep ini sudah difinalkan dan tidak bisa diubah. Batalkan dulu dengan alasannya, lalu tulis resep baru.'
      using errcode = 'SH004';
  end if;

  if not found then
    insert into public.prescriptions (company_id, visit_id, nomor, dokter_email, catatan)
    values (v_visit.company_id, p_visit,
            public.next_doc_number(v_visit.company_id, 'prescriptions', 'nomor', 'RSP', to_char(current_date, 'YYYY')),
            coalesce(v_visit.dokter_email, v_email),
            nullif(trim(p_catatan), ''))
    returning * into v_resep;
  else
    update public.prescriptions
       set catatan = nullif(trim(p_catatan), ''),
           dokter_email = coalesce(v_visit.dokter_email, dokter_email, v_email)
     where id = v_resep.id
    returning * into v_resep;
  end if;

  delete from public.prescription_items where prescription_id = v_resep.id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(v_item ->> 'nama_obat'), '') = '' then
      continue;
    end if;
    v_jumlah := coalesce(nullif(v_item ->> 'jumlah', '')::numeric, 0);
    if v_jumlah <= 0 then
      raise exception 'Jumlah obat % harus lebih dari nol.', v_item ->> 'nama_obat' using errcode = 'SH004';
    end if;
    v_urut := v_urut + 1;
    insert into public.prescription_items (
      company_id, prescription_id, product_id, nama_obat, jumlah, satuan,
      dosis, frekuensi, rute, aturan_pakai, catatan, urutan, permintaan_terbuka)
    values (
      v_visit.company_id, v_resep.id,
      nullif(v_item ->> 'product_id', '')::uuid,
      trim(v_item ->> 'nama_obat'),
      v_jumlah,
      nullif(trim(v_item ->> 'satuan'), ''),
      nullif(trim(v_item ->> 'dosis'), ''),
      nullif(trim(v_item ->> 'frekuensi'), ''),
      nullif(trim(v_item ->> 'rute'), ''),
      nullif(trim(v_item ->> 'aturan_pakai'), ''),
      nullif(trim(v_item ->> 'catatan'), ''),
      v_urut,
      -- SATU-SATUNYA tambahan di fungsi ini. Permintaan terbuka cuma sah
      -- kalau produknya memang belum dipilih; kalau dokter sudah memilih,
      -- penandanya diabaikan supaya farmasi tidak bisa menggantinya.
      coalesce((v_item ->> 'permintaan_terbuka')::boolean, false)
        and nullif(v_item ->> 'product_id', '') is null);
  end loop;

  if p_final then
    if v_urut = 0 then
      raise exception 'Resep kosong tidak bisa difinalkan.' using errcode = 'SH004';
    end if;
    update public.prescriptions
       set status = 'final', difinalkan_pada = now()
     where id = v_resep.id
    returning * into v_resep;
  end if;

  perform public.catat_audit(v_visit.company_id,
    case when p_final then 'resep.final' else 'resep.disimpan' end,
    'prescriptions', v_resep.id::text,
    jsonb_build_object('nomor', v_resep.nomor, 'kunjungan', v_visit.nomor, 'jumlah_item', v_urut));

  return to_jsonb(v_resep);
end;
$$;

revoke all on function public.simpan_resep(uuid, jsonb, text, boolean) from public, anon;
grant execute on function public.simpan_resep(uuid, jsonb, text, boolean) to authenticated;

-- ------------------------------------------------------------
-- 2. Farmasi mengisi permintaan terbuka
-- ------------------------------------------------------------

/**
 * Mengisi satu baris permintaan terbuka dengan produk yang benar-benar dipakai.
 *
 * Tiga penjaga, dan ketiganya sengaja:
 *
 *   1. Hanya baris ber-`permintaan_terbuka`. Baris yang produknya sudah
 *      dipilih dokter tidak bisa disentuh farmasi sama sekali. Menggantinya
 *      adalah substitusi, dan substitusi menuntut sepengetahuan dokter.
 *   2. Hanya selama resepnya belum diserahkan. Sesudah `dilayani`, mengubah
 *      isinya berarti mengarang ulang apa yang sudah terlanjur diminum orang.
 *   3. `permintaan_asli` diisi sekali dan tidak pernah ditimpa lagi.
 */
create or replace function public.isi_permintaan_farmasi(
  p_item    uuid,
  p_product uuid,
  p_nama    text,
  p_jumlah  numeric default null,
  p_satuan  text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_item  record;
  v_resep record;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
begin
  select i.* into v_item from public.prescription_items i
   where i.id = p_item
     and (public.boleh_admin_platform() or i.company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Baris resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  if not v_item.permintaan_terbuka then
    raise exception 'Baris ini sudah ditentukan dokter, jadi tidak bisa diganti farmasi. Kalau obatnya tidak ada, hubungi dokternya.'
      using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions where id = v_item.prescription_id;
  if v_resep.status not in ('final', 'disiapkan', 'siap') then
    raise exception 'Resep ini tidak sedang disiapkan, jadi isinya tidak bisa diubah.' using errcode = 'SH004';
  end if;

  if coalesce(trim(p_nama), '') = '' then
    raise exception 'Nama obatnya wajib diisi.' using errcode = 'SH004';
  end if;

  update public.prescription_items
     set permintaan_asli = coalesce(permintaan_asli, nama_obat),
         product_id      = p_product,
         nama_obat       = trim(p_nama),
         jumlah          = greatest(coalesce(p_jumlah, jumlah), 0.01),
         satuan          = coalesce(nullif(trim(p_satuan), ''), satuan),
         diisi_oleh      = v_email,
         diisi_pada      = now()
   where id = p_item
  returning * into v_item;

  perform public.catat_audit(v_item.company_id, 'resep.diisi_farmasi',
    'prescription_items', p_item::text,
    jsonb_build_object('permintaan', v_item.permintaan_asli,
                       'diisi', v_item.nama_obat, 'oleh', v_email));

  return to_jsonb(v_item);
end;
$$;

revoke all on function public.isi_permintaan_farmasi(uuid, uuid, text, numeric, text) from public, anon;
grant execute on function public.isi_permintaan_farmasi(uuid, uuid, text, numeric, text) to authenticated;

-- ------------------------------------------------------------
-- 3. Kedua pembaca resep ikut membawa kolom baru
-- ------------------------------------------------------------
-- Pelajaran migrasi 0036 dan 0037 dipakai di sini: menambah kolom berarti
-- memeriksa SETIAP tempat yang membacanya, sekarang juga, bukan nanti.

create or replace function public.isi_resep(p_resep uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_resep record;
begin
  select * into v_resep from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'permintaan_terbuka', i.permintaan_terbuka, 'permintaan_asli', i.permintaan_asli,
        'diisi_oleh', i.diisi_oleh, 'diisi_pada', i.diisi_pada,
        'stok', p.stok_total, 'kategori', p.kategori, 'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = p_resep), '[]'::jsonb));
end;
$$;

revoke all on function public.isi_resep(uuid) from public, anon;
grant execute on function public.isi_resep(uuid) to authenticated;

create or replace function public.resep_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_visit record; v_resep record;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions
   where visit_id = p_visit
     and status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;
  if not found then
    return jsonb_build_object('resep', null, 'items', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'permintaan_terbuka', i.permintaan_terbuka, 'permintaan_asli', i.permintaan_asli,
        'diisi_oleh', i.diisi_oleh, 'diisi_pada', i.diisi_pada,
        'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori,
        'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = v_resep.id), '[]'::jsonb));
end;
$$;

revoke all on function public.resep_kunjungan(uuid) from public, anon;
grant execute on function public.resep_kunjungan(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Antrean farmasi menandai yang masih menunggu diisi
-- ------------------------------------------------------------
-- Supaya farmasi tahu ada yang perlu dipilih tanpa membuka satu per satu.

drop view if exists public.v_resep_menunggu;
create view public.v_resep_menunggu as
select
  r.id, r.company_id, r.nomor, r.status, r.dokter_email, r.catatan,
  r.ditulis_pada, r.difinalkan_pada, r.disiapkan_pada, r.disiapkan_oleh, r.siap_pada,
  v.id as visit_id, v.nomor_antre, v.status as status_kunjungan, v.poli, v.penjamin,
  p.id as pasien_id, p.nama as pasien_nama, p.nomor_rm, p.alergi,
  (select count(*) from public.prescription_items i where i.prescription_id = r.id)::integer as jumlah_item,
  (select count(*) from public.prescription_items i
    where i.prescription_id = r.id
      and i.permintaan_terbuka and i.diisi_pada is null)::integer as jumlah_belum_diisi,
  (coalesce(r.transaction_id, v.transaction_id) is not null) as sudah_bayar,
  coalesce(r.transaction_id, v.transaction_id) as transaction_id
from public.prescriptions r
join public.visits v   on v.id = r.visit_id
join public.patients p on p.id = v.patient_id
where r.status in ('final', 'disiapkan', 'siap')
  and v.tanggal = current_date;

alter view public.v_resep_menunggu set (security_invoker = on);
revoke all on public.v_resep_menunggu from public, anon;
grant select on public.v_resep_menunggu to authenticated;
