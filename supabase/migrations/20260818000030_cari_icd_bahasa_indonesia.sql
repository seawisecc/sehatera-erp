-- ============================================================
-- 0030  Mencari ICD dalam bahasa Indonesia
-- ============================================================
--
-- Migrasi 0025 sampai 0029 memasang daftar resminya, dan meninggalkan satu
-- lubang yang saya sebut sendiri waktu itu: nama di berkas Kemenkes SELURUHNYA
-- bahasa Inggris, sedangkan 49 alias Indonesia cuma menutupi 49 kode dari
-- 18.543. Untuk 18.494 sisanya, dokter harus menebak ejaan Inggrisnya.
--
-- Yang meleset diperiksa dulu sebelum ditambal, dan hasilnya membelah masalah
-- ini jadi dua yang sifatnya berbeda:
--
--   1. EJAAN. "faringitis" vs "pharyngitis", "bronkitis" vs "bronchitis",
--      "hipertensi" vs "hypertension". Ini kata yang sama, cuma lewat aturan
--      penyerapan yang tetap: ph->f, ch->k, th->t, c->k/s, y->i, x->ks,
--      -tion->-si. Bisa diselesaikan mesin, dan sudah.
--
--   2. KOSAKATA. "demam" vs "fever", "nyeri" vs "pain", "kepala" vs "head".
--      Ini kata yang BERBEDA. Tidak ada aturan ejaan yang bisa menyeberang,
--      berapa pun pintarnya. Harus ada daftarnya.
--
-- Diuji ke 49 pasang alias yang sudah ada, karena itu satu-satunya kunci
-- jawaban yang benar-benar dimiliki project ini: penormalan ejaan saja kena
-- 37 dari 49, ditambah glosarium jadi 48 dari 49.
--
-- Yang TIDAK dilakukan: menerjemahkan 18.543 nama dengan mesin. Terjemahan
-- medis yang setengah benar lebih berbahaya daripada tidak ada, karena orang
-- mulai memercayainya. Alasannya sama persis dengan kenapa pemeriksaan
-- interaksi obat sengaja tidak dibuat. Jadi yang diterjemahkan hanya kata
-- yang saya yakini, dan yang ditampilkan tetap nama resminya.

-- ------------------------------------------------------------
-- 1. Penormalan ejaan
-- ------------------------------------------------------------
-- Dipakai pada nama resmi DAN pada yang diketik, supaya keduanya bertemu di
-- bentuk yang sama. Hasilnya bukan bahasa Indonesia yang benar dan memang
-- tidak pernah ditampilkan: ia cuma kunci pencocokan.

create or replace function public.normalisasi_medis(p_teks text)
returns text
language sql immutable strict parallel safe
as $$
  select trim(regexp_replace(
    regexp_replace(
      regexp_replace(
        replace(
          replace(
            replace(
              replace(
                regexp_replace(
                  replace(replace(replace(replace(replace(replace(replace(replace(
                    regexp_replace(lower(p_teks), '[^a-z0-9]+', ' ', 'g'),
                  'ae','e'), 'oe','e'), 'ity','itas'), 'tion','si'), 'sion','si'),
                  'ph','f'), 'ch','k'), 'th','t'),
                'c([eiy])', 's\1', 'g'),
              'c','k'),
            'x','ks'),
          'qu','ku'),
        'y','i'),
      'stm','sm'),
    -- konjungtivitis = conjunctivitis: "ng" dan "nk" sebelum konsonan sama saja
    'n[gk](?=[bdgjkptsz])', 'n', 'g'),
  '(.)\1+', '\1', 'g'));
$$;

comment on function public.normalisasi_medis(text) is
  'Menyamakan ejaan serapan Indonesia dengan aslinya: ph->f, ch->k, th->t, c->k/s, y->i, x->ks, -tion->-si, huruf ganda jadi tunggal. Bukan terjemahan, cuma kunci pencocokan.';

-- ------------------------------------------------------------
-- 2. Glosarium
-- ------------------------------------------------------------
-- Boleh banyak-ke-banyak: satu kata Indonesia boleh menunjuk beberapa kata
-- Inggris, karena berkas Kemenkes tidak konsisten memilih yang mana.
-- "Kecacingan" muncul sebagai "intestinal parasitism" di satu tempat dan
-- "helminthiasis" di tempat lain, dan keduanya harus ketemu.

create table if not exists public.icd_kata (
  id_kata text not null,
  en_kata text not null,
  primary key (id_kata, en_kata)
);

comment on table public.icd_kata is
  'Glosarium Indonesia ke Inggris untuk mencari ICD. Hanya untuk PENCARIAN: tidak pernah ditampilkan, dan bukan terjemahan resmi apa pun.';

alter table public.icd_kata enable row level security;
drop policy if exists "baca_terminologi" on public.icd_kata;
create policy "baca_terminologi" on public.icd_kata
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- 3. Nama yang sudah ternormalisasi, disimpan
-- ------------------------------------------------------------
-- Kolom hasil hitungan, bukan kolom yang diisi. Kalau diisi lewat trigger,
-- akan ada baris yang lolos saat data ditambah lewat jalur lain, dan barisan
-- itu jadi tidak bisa dicari tanpa ada yang tahu kenapa.

alter table public.icd10
  add column if not exists nama_norm text
  generated always as (public.normalisasi_medis(nama)) stored;

alter table public.icd9cm
  add column if not exists nama_norm text
  generated always as (public.normalisasi_medis(nama)) stored;

create index if not exists idx_icd10_norm on public.icd10 using gin (nama_norm gin_trgm_ops);
create index if not exists idx_icd9_norm  on public.icd9cm using gin (nama_norm gin_trgm_ops);

-- ------------------------------------------------------------
-- 4. Menguraikan yang diketik jadi syarat pencarian
-- ------------------------------------------------------------
-- Tiap kata diperluas jadi beberapa kemungkinan: bentuk ternormalisasinya
-- sendiri, padanan Inggrisnya, dan padanan Inggris dari akar katanya setelah
-- imbuhan dilepas ("kehamilan" -> "hamil", "perdarahan" -> "darah").
--
-- Antar KATA syaratnya DAN, antar kemungkinan satu kata syaratnya ATAU.
-- Itu yang membuat "demam berdarah" tidak mengembalikan semua yang demam:
-- keduanya harus ada, meski di nama resminya urutannya justru terbalik
-- ("dengue haemorrhagic fever").

create or replace function public.icd_kemungkinan(p_kata text)
returns text[]
language sql stable parallel safe
as $$
  select array_agg(distinct x) from (
    select public.normalisasi_medis(p_kata) as x
    union
    select public.normalisasi_medis(g.en_kata)
      from public.icd_kata g where g.id_kata = p_kata
    union
    -- imbuhan dilepas: ke-an, per-an, ber-, peN-, -nya
    select public.normalisasi_medis(g.en_kata)
      from public.icd_kata g
     where p_kata in (
       'ke' || g.id_kata || 'an', 'per' || g.id_kata || 'an', 'pe' || g.id_kata || 'an',
       'ber' || g.id_kata, 'me' || g.id_kata, g.id_kata || 'an', g.id_kata || 'nya')
  ) s where length(x) > 2;
$$;

-- ------------------------------------------------------------
-- 5. Pencarian yang mengerti dua bahasa
-- ------------------------------------------------------------

create or replace function public.cari_icd10(p_q text, p_batas int default 20)
returns table (kode text, nama text, nama_id text, terverifikasi boolean)
language sql stable security definer set search_path = public, pg_temp
as $$
  with q as (
    select upper(trim(coalesce(p_q, ''))) as k,
           trim(coalesce(p_q, ''))        as n,
           public.normalisasi_medis(coalesce(p_q, '')) as nq
  ),
  kata as (
    select w, public.icd_kemungkinan(w) as alt
    from q, unnest(string_to_array(q.nq, ' ')) as w
    where length(w) > 2
  ),
  cocok as (
    select d.kode, d.nama, d.nama_norm
    from public.icd10 d
    where exists (select 1 from kata)
      and not exists (
        select 1 from kata
         where not exists (
           select 1 from unnest(kata.alt) a where d.nama_norm like '%' || a || '%')
      )
  )
  select d.kode,
         d.nama,
         (select a.nama from public.icd10_alias a where a.kode = d.kode order by a.nama limit 1),
         true
  from public.icd10 d, q
  where q.k <> ''
    and (d.kode = q.k
         or d.kode like q.k || '%'
         or exists (select 1 from public.icd10_alias a
                     where a.kode = d.kode and a.nama ilike '%' || q.n || '%')
         or exists (select 1 from cocok c where c.kode = d.kode))
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
  with q as (
    select trim(coalesce(p_q, '')) as k,
           public.normalisasi_medis(coalesce(p_q, '')) as nq
  ),
  kata as (
    select w, public.icd_kemungkinan(w) as alt
    from q, unnest(string_to_array(q.nq, ' ')) as w
    where length(w) > 2
  ),
  cocok as (
    select t.kode
    from public.icd9cm t
    where exists (select 1 from kata)
      and not exists (
        select 1 from kata
         where not exists (
           select 1 from unnest(kata.alt) a where t.nama_norm like '%' || a || '%')
      )
  )
  select t.kode, t.nama
  from public.icd9cm t, q
  where q.k <> ''
    and (t.kode = q.k or t.kode like q.k || '%'
         or exists (select 1 from cocok c where c.kode = t.kode))
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
-- 6. Isi glosarium
-- ------------------------------------------------------------
-- 162 pasang. Sengaja pendek dan sengaja umum: yang dikejar bukan
-- kelengkapan kamus, melainkan kata yang benar-benar diketik orang di kotak
-- diagnosis. Menambah satu baris di sini memperbaiki pencarian untuk ribuan
-- kode sekaligus, jadi ini tempat pertama yang dilihat kalau ada keluhan
-- "kok tidak ketemu".

insert into public.icd_kata (id_kata, en_kata)
select split_part(x, '|', 1), split_part(x, '|', 2)
from unnest(string_to_array($KATA$akut|acute
alergi|allergic
amandel|tonsillitis
anak|child
asma|asthma
atas|upper
bahu|shoulder
batu|calculus
batuk|cough
bawaan|congenital
bawah|lower
bayi|newborn
bengkak|swelling
berdarah|haemorrhagic
bersin|sneezing
bisul|furuncle
cacar|varicella
cacing|helminthiasis
cacing|worm
campak|measles
cedera|injury
cerna|digestive
dada|chest
dalam|deep
darah|blood
darah|haemorrhage
darahtinggi|hypertension
demam|fever
demam|pyrexia
demamberdarah|dengue
diare|diarrhoea
gagal|failure
ganas|malignant
gangguan|disorder
gatal|itch
gemetar|tremor
gigi|tooth
gigitan|bite
ginjal|kidney
ginjal|renal
gizi|nutritional
gondok|goitre
gula|diabetes
hamil|pregnancy
hati|hepatic
hati|liver
hidung|nose
infeksi|infection
jamur|mycosis
jantung|cardiac
jantung|heart
jari|finger
jinak|benign
kaki|foot
kanan|right
kandung|bladder
kanker|cancer
kecacingan|helminthiasis
kecacingan|parasitism
kecelakaan|accident
kehamilan|pregnancy
kejang|convulsions
kelahiran|birth
kelebihan|excess
kemih|urinary
kencing|urinary
kepala|head
keracunan|poisoning
kiri|left
kronik|chronic
kronis|chronic
kuku|nail
kulit|dermatitis
kulit|skin
kurang|deficiency
lain|other
lambung|gastric
lambung|stomach
lecet|abrasion
leher|neck
lelah|fatigue
lemah|weakness
lengan|arm
lidah|tongue
luar|external
luka|wound
lutut|knee
malaria|malaria
mata|eye
mata|ocular
melahirkan|delivery
memar|contusion
menahun|chronic
mencret|diarrhoea
menular|infectious
mual|nausea
mulut|mouth
muntah|vomiting
nanah|abscess
napas|respiratory
nyeri|ache
nyeri|pain
otak|brain
otot|muscle
otot|myalgia
panas|fever
paru|lung
paru|pulmonary
paru|tuberculosis
patah|fracture
payudara|breast
pemeriksaan|examination
pencernaan|digestive
pendarahan|haemorrhage
pengawasan|supervision
penyakit|disease
perawatan|care
perdarahan|haemorrhage
pernapasan|respiratory
persalinan|delivery
perut|abdomen
perut|stomach
pilek|cold
pinggang|back
pingsan|syncope
punggung|back
pusing|dizziness
rabies|rabies
radang|inflammation
rahim|uterus
rambut|hair
rendah|hypotension
sakit|disease
sakit|pain
saluran|tract
saraf|nerve
sendi|arthritis
sendi|joint
sengatan|sting
sesak|dyspnoea
tangan|hand
tb|tuberculosis
tbc|tuberculosis
tekanan|pressure
telinga|ear
telinga|otitis
tenggorokan|pharyngitis
tenggorokan|throat
terbakar|burn
terbuka|open
terkilir|sprain
tertutup|closed
tidak|unspecified
tifus|typhoid
tinggi|hypertension
tipes|typhoid
tulang|bone
tulang|osteo
tumor|neoplasm
tungkai|leg
usus|bowel
usus|intestine$KATA$, E'\n')) as x
where x <> ''
on conflict (id_kata, en_kata) do nothing;
