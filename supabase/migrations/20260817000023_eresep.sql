-- ============================================================
-- 0023  E-resep: ditulis dari kunjungan, dilayani lewat kasir
-- ============================================================
--
-- Resep adalah tempat modul klinik dan modul apotek bertemu, dan pertemuan itu
-- yang menentukan apakah ini satu sistem atau dua aplikasi yang kebetulan satu
-- login. Karena itu penyerahannya TIDAK dibuatkan jalur stok sendiri: ia
-- mengisi keranjang kasir, lalu keluar lewat `apply_transaction` yang sudah
-- ada. Jalur itu sudah memotong stok produk dan batch secara FEFO, mencatat
-- batch mana yang diambil supaya pembatalan bisa membalikkannya persis, dan
-- terhitung di SIPNAP. Menulis jalur kedua berarti dua tempat yang harus benar,
-- dan yang kedua akan ketinggalan pada perbaikan berikutnya.
--
-- Bentuk barisnya menuruti MedicationRequest FHIR sejak sekarang, dengan alasan
-- yang sama seperti migrasi 0018: aturan pakai yang disimpan sebagai satu
-- kalimat bebas tidak bisa dipetakan ke dosageInstruction tanpa menebak.
--
-- Satu aturan yang ditegakkan di sini dan bukan diserahkan ke kesopanan: resep
-- yang sudah difinalkan tidak bisa diubah. Ia bisa dibatalkan dengan alasan,
-- lalu ditulis ulang. Resep yang berubah isinya sesudah dibaca apoteker adalah
-- cara paling sunyi untuk menyerahkan obat yang bukan diperintahkan dokter.

-- ------------------------------------------------------------
-- 1. Tabel
-- ------------------------------------------------------------

create table if not exists public.prescriptions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  visit_id       uuid not null references public.visits(id) on delete cascade,
  nomor          text,
  status         text not null default 'draf',
  dokter_email   text,
  catatan        text,
  ditulis_pada   timestamptz not null default now(),
  difinalkan_pada timestamptz,
  dilayani_pada  timestamptz,
  transaction_id uuid references public.transactions(id),
  alasan_batal   text,
  ihs_id         text,
  constraint resep_status_check check (status in ('draf', 'final', 'dilayani', 'batal'))
);

create index if not exists idx_resep_visit on public.prescriptions (visit_id);
create index if not exists idx_resep_antre on public.prescriptions (company_id, status, ditulis_pada);

comment on table public.prescriptions is
  'Resep satu kunjungan. Sesudah difinalkan isinya tidak bisa diubah; koreksi dilakukan dengan membatalkan lalu menulis ulang.';

create table if not exists public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  -- Kosong berarti obat itu tidak ada di katalog: ditulis sebagai teks, dan
  -- tidak bisa dilayani dari stok sini. Itu keadaan yang sah (pasien menebus di
  -- tempat lain), jadi ia dicatat apa adanya, bukan dipaksa masuk katalog.
  product_id      uuid references public.products(id),
  nama_obat       text not null,
  jumlah          numeric(12,2) not null,
  satuan          text,
  -- Aturan pakai dipecah, bukan satu kalimat bebas. dosageInstruction di FHIR
  -- meminta bagian-bagiannya terpisah, dan "3x1 sesudah makan" tidak bisa
  -- dibelah kembali tanpa menebak.
  dosis           text,
  frekuensi       text,
  rute            text,
  aturan_pakai    text,
  catatan         text,
  kode_kfa        text,
  urutan          integer not null default 0,
  constraint resep_jumlah_check check (jumlah > 0)
);

create index if not exists idx_resep_item on public.prescription_items (prescription_id, urutan);

comment on column public.prescription_items.kode_kfa is
  'Kode Kamus Farmasi dan Alat Kesehatan. Diminta SatuSehat pada Medication; belum diisi, kolomnya disiapkan supaya pemetaannya nanti tidak perlu mengubah bentuk tabel.';

-- ------------------------------------------------------------
-- 2. RLS
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['prescriptions', 'prescription_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "tenant_all" on public.%I', t);
    execute format(
      'create policy "tenant_all" on public.%I for all to authenticated
         using (company_id = public.auth_company_id() or public.is_super_admin())
         with check (company_id = public.auth_company_id() or public.is_super_admin())', t);
    execute format('drop trigger if exists trg_set_company_id on public.%I', t);
    execute format('create trigger trg_set_company_id before insert on public.%I
                    for each row execute function public.set_company_id()', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3. Menulis resep
-- ------------------------------------------------------------

/**
 * Menyimpan resep beserta seluruh isinya dalam satu transaksi.
 *
 * Item disimpan ulang seluruhnya, bukan ditambal per baris. Untuk daftar
 * sependek resep itu lebih murah daripada melacak baris mana yang berubah, dan
 * yang lebih penting: tidak ada keadaan setengah tersimpan, di mana obat kedua
 * masuk sementara yang pertama gagal.
 *
 * Resep yang sudah difinalkan ditolak. Resep yang berubah isinya sesudah dibaca
 * apoteker adalah cara paling sunyi untuk menyerahkan obat yang bukan
 * diperintahkan dokter.
 */
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

  select * into v_resep from public.prescriptions
   where visit_id = p_visit and status in ('draf', 'final')
   order by ditulis_pada desc limit 1;

  if found and v_resep.status = 'final' then
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
      dosis, frekuensi, rute, aturan_pakai, catatan, urutan)
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
      v_urut);
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

create or replace function public.batalkan_resep(p_resep uuid, p_alasan text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  if coalesce(trim(p_alasan), '') = '' then
    raise exception 'Pembatalan resep harus disertai alasannya.' using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status = 'batal', alasan_batal = trim(p_alasan)
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
     and status in ('draf', 'final')
  returning * into v_row;
  if not found then
    raise exception 'Resep tidak ditemukan, atau sudah dilayani sehingga tidak bisa dibatalkan.'
      using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_row.company_id, 'resep.dibatalkan', 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'alasan', trim(p_alasan)));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.batalkan_resep(uuid, text) from public, anon;
grant execute on function public.batalkan_resep(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4. Membaca resep
-- ------------------------------------------------------------

/**
 * Resep satu kunjungan beserta isinya DAN sisa stok tiap obatnya.
 *
 * Stoknya ikut dibawa supaya dokter melihat apa yang benar-benar ada saat
 * menulis, bukan sesudah pasien berdiri di depan loket dan diberi tahu obatnya
 * habis. Memindahkan kabar itu ke depan tidak menambah stok, tapi memindahkan
 * kekecewaannya ke tempat yang masih bisa ditindaklanjuti.
 */
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
   where visit_id = p_visit and status in ('draf', 'final', 'dilayani')
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
        'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori,
        'satuan_produk', p.satuan
      ) order by i.urutan)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = v_resep.id), '[]'::jsonb));
end;
$$;

revoke all on function public.resep_kunjungan(uuid) from public, anon;
grant execute on function public.resep_kunjungan(uuid) to authenticated;

/**
 * Antrean resep yang menunggu dilayani farmasi.
 *
 * Hanya yang berstatus final. Resep draf tidak boleh muncul di sini: draf
 * artinya dokter belum selesai berpikir, dan obat yang diserahkan dari draf
 * adalah obat yang tidak pernah diperintahkan.
 */
create or replace view public.v_resep_menunggu as
select
  r.id, r.company_id, r.nomor, r.status, r.dokter_email, r.catatan,
  r.ditulis_pada, r.difinalkan_pada,
  v.id as visit_id, v.nomor_antre, v.status as status_kunjungan, v.poli, v.penjamin,
  p.id as pasien_id, p.nama as pasien_nama, p.nomor_rm, p.alergi,
  (select count(*) from public.prescription_items i where i.prescription_id = r.id)::integer as jumlah_item
from public.prescriptions r
join public.visits v   on v.id = r.visit_id
join public.patients p on p.id = v.patient_id
where r.status = 'final'
  and v.tanggal = current_date;

alter view public.v_resep_menunggu set (security_invoker = on);
revoke all on public.v_resep_menunggu from public, anon;
grant select on public.v_resep_menunggu to authenticated;

-- ------------------------------------------------------------
-- 5. Menandai resep sudah dilayani
-- ------------------------------------------------------------

/**
 * Menyambungkan resep ke penjualan yang melayaninya.
 *
 * Dipanggil SESUDAH `apply_transaction` berhasil, bukan sebelumnya. Urutannya
 * penting: kalau resep ditandai lebih dulu lalu penjualannya gagal, resep itu
 * hilang dari antrean farmasi padahal obatnya belum diserahkan, dan tidak ada
 * yang tahu sampai pasien kembali bertanya.
 *
 * Idempoten. Menekan tombol dua kali karena halaman terasa lambat tidak boleh
 * menghasilkan keadaan yang berbeda dari menekan sekali.
 */
create or replace function public.tandai_resep_dilayani(p_resep uuid, p_transaksi uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  select * into v_row from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_row.status = 'dilayani' then
    return to_jsonb(v_row);
  end if;
  if v_row.status <> 'final' then
    raise exception 'Hanya resep yang sudah difinalkan yang bisa ditandai dilayani.' using errcode = 'SH004';
  end if;

  update public.prescriptions
     set status = 'dilayani', dilayani_pada = now(), transaction_id = p_transaksi
   where id = p_resep
  returning * into v_row;

  perform public.catat_audit(v_row.company_id, 'resep.dilayani', 'prescriptions', p_resep::text,
    jsonb_build_object('nomor', v_row.nomor, 'transaksi', p_transaksi));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.tandai_resep_dilayani(uuid, uuid) from public, anon;
grant execute on function public.tandai_resep_dilayani(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- 6. Antrean kunjungan membawa keadaan resepnya
-- ------------------------------------------------------------

create or replace view public.v_antrean_hari_ini as
select
  v.id, v.company_id, v.nomor, v.nomor_antre, v.tanggal, v.status,
  v.keluhan, v.penjamin, v.dokter_email, v.dibuka_pada, v.ditutup_pada,
  p.id   as pasien_id,
  p.nomor_rm,
  p.nama as pasien_nama,
  p.tanggal_lahir,
  p.jenis_kelamin,
  p.alergi,
  p.telepon,
  case when p.tanggal_lahir is null then null
       else extract(year from age(current_date, p.tanggal_lahir))::integer end as umur,
  v.jenis_kunjungan,
  v.poli,
  v.no_rujukan,
  v.kesadaran,
  v.status_pulang,
  v.ihs_encounter_id,
  p.ihs_id as pasien_ihs_id,
  exists (select 1 from public.visit_notes n where n.visit_id = v.id) as ada_catatan,
  (select count(*) from public.visit_diagnoses d where d.visit_id = v.id)::integer as jumlah_diagnosis,
  exists (select 1 from public.visit_vitals t where t.visit_id = v.id) as ada_vital,
  v.unit_id,
  u.nama as unit_nama,
  u.kode as unit_kode,
  (select r.status from public.prescriptions r
    where r.visit_id = v.id and r.status in ('draf', 'final', 'dilayani')
    order by r.ditulis_pada desc limit 1) as status_resep
from public.visits v
join public.patients p on p.id = v.patient_id
left join public.clinic_units u on u.id = v.unit_id
where v.tanggal = current_date;

alter view public.v_antrean_hari_ini set (security_invoker = on);
revoke all on public.v_antrean_hari_ini from public, anon;
grant select on public.v_antrean_hari_ini to authenticated;
