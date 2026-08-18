-- ============================================================
-- 0025  Terminologi resmi: ICD-10 dan ICD-9-CM
-- ============================================================
--
-- Sampai migrasi ini, diagnosis dipilih dari 49 baris yang saya susun sendiri
-- di `lib/icd10.ts`. Berkas itu jujur menyebut dirinya saran cepat, bukan
-- rujukan, dan header-nya menulis "begitu daftar resminya diimpor, tempat ini
-- tinggal diganti sumbernya". Ini migrasi yang menggantinya.
--
-- Sumbernya berkas e-klaim Kemenkes: 18.543 kode ICD-10 dan 4.626 kode
-- ICD-9-CM, keduanya versi 2010, yang persis dipakai INA-CBG untuk menilai
-- klaim. Memakai daftar yang sama dengan penilai klaim adalah seluruh
-- gunanya: kode yang tidak ada di daftar ini akan ditolak saat klaim
-- diajukan, berminggu-minggu setelah pasiennya pulang.
--
-- Dua hal yang SENGAJA tidak dilakukan di sini:
--
-- 1. Kode di luar daftar TIDAK ditolak. Berkasnya berlabel versi 2010 tapi
--    ternyata masih dirawat: U07.1 untuk COVID-19 ada di dalamnya, padahal
--    kode itu baru lahir 2020. Artinya isinya bisa tertinggal dari SatuSehat
--    pada suatu masa tanpa ada yang memberi tahu kita. Menolak keras berarti
--    ada dokter yang tidak bisa menutup kunjungannya sama sekali, di depan
--    pasien, karena kodenya terlalu baru. Yang dilakukan: kode ditandai
--    `terverifikasi`, dan yang tidak terverifikasi kelihatan di layar sebagai
--    peringatan klaim, bukan sebagai palang.
--
-- 2. Nama resmi TIDAK menimpa nama yang diketik dokter. Nama di berkas
--    Kemenkes seluruhnya bahasa Inggris. Menimpanya berarti rekam medis
--    berbahasa Inggris di klinik yang bekerja dalam bahasa Indonesia.
--
-- Bahasa itu juga alasan tabel alias ada. Dokter mencari "demam tifoid",
-- sedangkan berkas resminya menulis "Typhoid fever". Tanpa lapisan alias,
-- daftar resmi yang 18 ribu baris justru LEBIH SUSAH dipakai daripada 49
-- baris buatan tangan yang barusan diganti. 49 nama Indonesia itu tidak
-- dibuang: mereka pindah ke sini sebagai alias pencarian.
--
-- Datanya TIDAK ada di berkas ini. Barisnya terlalu banyak untuk satu
-- tempelan ke SQL Editor, jadi isinya dipecah ke migrasi 0026 sampai 0030.
-- Berkas ini hanya membuat wadah, pencarian, dan aliasnya.

-- ------------------------------------------------------------
-- 1. Pencarian teks
-- ------------------------------------------------------------
-- Pencarian kode itu awalan ("J06" harus menemukan "J06.9"), sedangkan
-- pencarian nama itu potongan di tengah ("tifoid" ada di tengah kalimat).
-- Yang kedua tidak bisa dilayani indeks btree, jadi pakai trigram.

create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- 2. Tabel referensi
-- ------------------------------------------------------------
-- Tanpa `company_id`. Ini satu-satunya tabel di seluruh skema yang bukan
-- milik siapa-siapa: ICD-10 sama isinya untuk semua faskes, dan menyalinnya
-- 18.543 baris per tenant adalah cara mahal untuk menyimpan hal yang sama.

create table if not exists public.icd10 (kode text primary key);
alter table public.icd10
  add column if not exists nama  text not null default '',
  add column if not exists versi text not null default 'ICD10_2010';

comment on table public.icd10 is
  'Kode diagnosis ICD-10 dari berkas e-klaim Kemenkes. Global, bukan per tenant. Dikirim ke SatuSehat dengan system http://hl7.org/fhir/sid/icd-10';

create table if not exists public.icd9cm (kode text primary key);
alter table public.icd9cm
  add column if not exists nama  text not null default '',
  add column if not exists versi text not null default 'ICD9CM_2010';

comment on table public.icd9cm is
  'Kode tindakan ICD-9-CM dari berkas e-klaim Kemenkes. Global, bukan per tenant. Dikirim ke SatuSehat dengan system http://hl7.org/fhir/sid/icd-9-cm';

create index if not exists idx_icd10_nama on public.icd10 using gin (nama gin_trgm_ops);
create index if not exists idx_icd9_nama  on public.icd9cm using gin (nama gin_trgm_ops);

-- ------------------------------------------------------------
-- 3. Alias bahasa Indonesia
-- ------------------------------------------------------------

create table if not exists public.icd10_alias (
  kode text not null references public.icd10(kode) on delete cascade,
  nama text not null,
  primary key (kode, nama)
);

comment on table public.icd10_alias is
  'Nama Indonesia untuk kode ICD-10. Hanya untuk PENCARIAN: yang dikirim ke SatuSehat dan BPJS tetap kodenya, bukan nama ini.';

create index if not exists idx_icd10_alias_nama on public.icd10_alias using gin (nama gin_trgm_ops);

-- ------------------------------------------------------------
-- 4. Siapa boleh membaca
-- ------------------------------------------------------------
-- Referensi, bukan data pasien: semua yang sudah masuk boleh membacanya.
-- Yang menulis hanya service_role, yang melewati RLS. Tidak ada policy
-- insert/update/delete sama sekali, jadi tidak ada jalan menulisnya dari
-- aplikasi walau seseorang menemukan alamat tabelnya.

alter table public.icd10       enable row level security;
alter table public.icd9cm      enable row level security;
alter table public.icd10_alias enable row level security;

drop policy if exists "baca_terminologi" on public.icd10;
create policy "baca_terminologi" on public.icd10
  for select to authenticated using (true);

drop policy if exists "baca_terminologi" on public.icd9cm;
create policy "baca_terminologi" on public.icd9cm
  for select to authenticated using (true);

drop policy if exists "baca_terminologi" on public.icd10_alias;
create policy "baca_terminologi" on public.icd10_alias
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- 5. Pencarian
-- ------------------------------------------------------------
-- Urutan hasil ditentukan di sini, bukan di layar, supaya jalur mana pun
-- yang memanggilnya mendapat urutan yang sama.
--
--   1  kode persis          "J06.9"  -> J06.9
--   2  awalan kode          "J06"    -> J06, J06.0, J06.8, J06.9
--   3  alias Indonesia      "tifoid" -> A01.0 Demam tifoid
--   4  nama resmi Inggris   "typho"  -> A01.0 Typhoid fever
--
-- Alias didahulukan atas nama resmi karena yang mengetik bahasa Indonesia
-- sudah pasti memaksudkan alias itu, sedangkan kecocokan di nama Inggris
-- sering cuma kebetulan potongan huruf.

create or replace function public.cari_icd10(p_q text, p_batas int default 20)
returns table (kode text, nama text, nama_id text, terverifikasi boolean)
language sql stable security definer set search_path = public, pg_temp
as $$
  with q as (select upper(trim(coalesce(p_q, ''))) as k, trim(coalesce(p_q, '')) as n)
  select d.kode,
         d.nama,
         (select a.nama from public.icd10_alias a where a.kode = d.kode order by a.nama limit 1),
         true
  from public.icd10 d, q
  where q.k <> ''
    and (d.kode = q.k
         or d.kode like q.k || '%'
         or d.nama ilike '%' || q.n || '%'
         or exists (select 1 from public.icd10_alias a
                     where a.kode = d.kode and a.nama ilike '%' || q.n || '%'))
  order by
    case when d.kode = q.k then 0
         when d.kode like q.k || '%' then 1
         when exists (select 1 from public.icd10_alias a
                       where a.kode = d.kode and a.nama ilike '%' || q.n || '%') then 2
         else 3 end,
    length(d.kode),
    d.kode
  limit greatest(1, least(coalesce(p_batas, 20), 50));
$$;

revoke all on function public.cari_icd10(text, int) from public, anon;
grant execute on function public.cari_icd10(text, int) to authenticated;

create or replace function public.cari_icd9(p_q text, p_batas int default 20)
returns table (kode text, nama text)
language sql stable security definer set search_path = public, pg_temp
as $$
  with q as (select trim(coalesce(p_q, '')) as k)
  select t.kode, t.nama
  from public.icd9cm t, q
  where q.k <> ''
    and (t.kode = q.k or t.kode like q.k || '%' or t.nama ilike '%' || q.k || '%')
  order by
    case when t.kode = q.k then 0
         when t.kode like q.k || '%' then 1
         else 2 end,
    length(t.kode),
    t.kode
  limit greatest(1, least(coalesce(p_batas, 20), 50));
$$;

revoke all on function public.cari_icd9(text, int) from public, anon;
grant execute on function public.cari_icd9(text, int) to authenticated;

-- ------------------------------------------------------------
-- 6. Penandaan terverifikasi
-- ------------------------------------------------------------
-- Bawaannya `true`, bukan `false`. Alasannya sama dengan aturan kolom kosong
-- di lib/plan.ts: baris yang sudah tercatat sebelum migrasi ini tidak boleh
-- tiba-tiba muncul sebagai bermasalah hanya karena kolomnya baru lahir.
-- Trigger di bawah yang menentukan nilai sebenarnya, dan ia hanya berjalan
-- untuk baris yang ditulis mulai sekarang.

alter table public.visit_diagnoses
  add column if not exists terverifikasi boolean not null default true;

comment on column public.visit_diagnoses.terverifikasi is
  'Kodenya ada di daftar e-klaim Kemenkes. Salah berarti klaim BPJS berisiko ditolak, bukan berarti diagnosisnya salah.';

create or replace function public.tandai_icd10_terverifikasi()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Selama tabelnya masih kosong (migrasi 0026..0029 belum dijalankan),
  -- jangan menandai apa pun sebagai tidak terverifikasi: yang salah waktu
  -- itu adalah keadaan tabelnya, bukan kode yang diketik dokter.
  if not exists (select 1 from public.icd10 limit 1) then
    new.terverifikasi := true;
    return new;
  end if;

  new.terverifikasi := exists (
    select 1 from public.icd10 where kode = upper(trim(new.kode_icd10))
  );
  return new;
end;
$$;

drop trigger if exists trg_icd10_terverifikasi on public.visit_diagnoses;
create trigger trg_icd10_terverifikasi
  before insert or update of kode_icd10 on public.visit_diagnoses
  for each row execute function public.tandai_icd10_terverifikasi();

-- ------------------------------------------------------------
-- 7. Kode tindakan menempel di katalog layanan
-- ------------------------------------------------------------
-- Kode ICD-9-CM tindakan sudah punya tempat di `visit_charges` sejak migrasi
-- 0024, tapi tidak ada yang mengisinya. Diisi tangan tiap kunjungan berarti
-- tindakan yang sama dapat kode berbeda-beda tergantung siapa yang mengetik.
-- Jadi kodenya ditempelkan sekali di katalog layanan, lalu ikut sendiri tiap
-- kali layanan itu ditagihkan.

alter table public.services
  add column if not exists kode_icd9 text;

comment on column public.services.kode_icd9 is
  'Kode ICD-9-CM tindakan ini. Ikut tersalin ke visit_charges saat layanan ditagihkan.';

-- SatuSehat mewajibkan `Procedure.performer.actor`: SIAPA yang mengerjakan
-- tindakannya. `visit_charges` sudah punya `dicatat_oleh`, tapi itu siapa yang
-- MENGETIK barisnya, dan di klinik yang sibuk itu hampir selalu kasir atau
-- perawat pendaftaran, bukan yang memegang alatnya. Dua hal berbeda.
--
-- Kolomnya ditambahkan sekarang meski pengirimannya belum dibangun, dengan
-- alasan yang sama seperti kolom LOINC dan IHS di migrasi 0018: kolom kosong
-- itu murah, sedangkan tindakan yang sudah terkumpul setahun tanpa
-- pelaksananya tidak bisa dilengkapi lagi tanpa menebak.
alter table public.visit_charges
  add column if not exists dikerjakan_oleh text;

comment on column public.visit_charges.dikerjakan_oleh is
  'Email tenaga kesehatan yang MENGERJAKAN tindakan, untuk Procedure.performer.actor. Beda dengan dicatat_oleh, yang cuma mencatat siapa mengetik barisnya.';

-- Penyaring BENTUK, bukan penyaring kebenaran, sama seperti kode ICD-10 di
-- migrasi 0018: dua angka, boleh diikuti titik dan satu sampai tiga angka.
-- Tiga, bukan dua: berkas Kemenkes memuat 93.960 dan kalau batasnya dua
-- angka satu-satunya kode itu tidak akan pernah bisa dimasukkan.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_icd9_check') then
    alter table public.services add constraint services_icd9_check
      check (kode_icd9 is null or kode_icd9 ~ '^[0-9]{2}(\.[0-9]{1,3})?$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'charge_icd9_check') then
    alter table public.visit_charges add constraint charge_icd9_check
      check (kode_icd9 is null or kode_icd9 ~ '^[0-9]{2}(\.[0-9]{1,3})?$');
  end if;
end $$;

-- ------------------------------------------------------------
-- 8. Kode tindakan ikut sendiri dari katalog
-- ------------------------------------------------------------
-- Sama dengan yang ditulis di migrasi 0024 tentang biaya administrasi dan
-- tarif konsultasi: yang hanya diisi kalau seseorang ingat mengisinya akan
-- kosong justru pada kunjungan yang paling sibuk. Jadi kalau baris biaya
-- menunjuk sebuah layanan dan tidak membawa kode ICD-9-CM sendiri, kodenya
-- diambil dari katalog layanan itu.
--
-- Kode yang dikirim pemanggil tetap menang. Ada tindakan yang kode
-- tepatnya bergantung pada apa yang benar-benar dikerjakan hari itu, dan
-- katalog tidak bisa tahu itu.
--
-- Selain baris ini, isi fungsinya sama persis dengan migrasi 0024.

create or replace function public.simpan_biaya_kunjungan(p_visit uuid, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_item  jsonb;
  v_email text := coalesce(lower(auth.jwt() ->> 'email'), 'sistem');
  v_n     integer := 0;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup, tagihannya tidak bisa diubah lagi.' using errcode = 'SH004';
  end if;

  delete from public.visit_charges where visit_id = p_visit;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    if coalesce(trim(v_item ->> 'nama'), '') = '' then continue; end if;
    v_n := v_n + 1;
    insert into public.visit_charges (
      company_id, visit_id, jenis, service_id, nama, jumlah, harga, catatan, kode_icd9,
      dikerjakan_oleh, dicatat_oleh)
    values (
      v_visit.company_id, p_visit,
      coalesce(nullif(v_item ->> 'jenis', ''), 'tindakan'),
      nullif(v_item ->> 'service_id', '')::uuid,
      trim(v_item ->> 'nama'),
      greatest(coalesce(nullif(v_item ->> 'jumlah', '')::numeric, 1), 0.01),
      greatest(coalesce(nullif(v_item ->> 'harga', '')::numeric, 0), 0),
      nullif(trim(v_item ->> 'catatan'), ''),
      coalesce(
        nullif(trim(v_item ->> 'kode_icd9'), ''),
        (select s.kode_icd9 from public.services s
          where s.id = nullif(v_item ->> 'service_id', '')::uuid
            and s.company_id = v_visit.company_id)),
      -- Kalau tidak disebut, yang dianggap mengerjakan adalah dokter kunjungan
      -- ini. Untuk klinik satu dokter itu selalu benar, dan menebak begitu
      -- jauh lebih baik daripada mengirim kolom kosong ke SatuSehat.
      coalesce(nullif(trim(v_item ->> 'dikerjakan_oleh'), ''), v_visit.dokter_email),
      v_email);
  end loop;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.biaya', 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'jumlah_baris', v_n));

  return jsonb_build_object('ok', true, 'jumlah', v_n);
end;
$$;

revoke all on function public.simpan_biaya_kunjungan(uuid, jsonb) from public, anon;
grant execute on function public.simpan_biaya_kunjungan(uuid, jsonb) to authenticated;
