-- ============================================================
-- 0031  Penormalan ejaan: huruf h sesudah r
-- ============================================================
--
-- Migrasi baru, bukan suntingan pada 0030, karena 0030 sudah dijalankan.
-- Aturannya memang begitu di project ini, dan kali ini ada alasan teknis
-- tambahan yang membuatnya wajib: lihat bagian kedua di bawah.
--
-- Yang salah: `cirrhosis` jadi `sirhosis`, sedangkan `sirosis` tetap
-- `sirosis`, jadi keduanya tidak pernah bertemu. Penyebabnya `h` sesudah `r`
-- tidak ikut luruh, padahal dalam serapan Indonesia ia selalu hilang.
--
-- Ini ditemukan berkas uji, bukan oleh saya membaca ulang kodenya. Pasangan
-- sirosis/cirrhosis memang sengaja ditaruh di sana bersama 17 pasang lain
-- untuk dites satu per satu. Sesudah aturan ini, ke-18 pasangnya bertemu.
--
-- Ikut terperbaiki tanpa diminta, karena ketiganya berbentuk sama:
--
--   haemorrhagic -> hemoragik     (dipakai "demam berdarah")
--   diarrhoea    -> diarea        (mengandung "diare")
--   rheumatic    -> reumatik
--
-- ------------------------------------------------------------
-- 1. Kolom hasil hitungan harus dibongkar dulu
-- ------------------------------------------------------------
-- `nama_norm` itu kolom GENERATED STORED: nilainya dihitung sekali saat baris
-- ditulis, lalu disimpan. Mengganti isi fungsinya TIDAK menghitung ulang
-- 18.543 baris yang sudah terlanjur tersimpan, dan Postgres tidak mengeluh
-- sedikit pun. Hasilnya kolom yang diam-diam memakai aturan lama, yang jauh
-- lebih susah dilacak daripada galat biasa.
--
-- Jadi kolomnya dibuang dan dipasang ulang. Indeksnya ikut terbawa saat
-- kolomnya dibuang, jadi ikut dibuat ulang juga di bawah.

alter table public.icd10  drop column if exists nama_norm;
alter table public.icd9cm drop column if exists nama_norm;

-- ------------------------------------------------------------
-- 2. Aturannya, dengan rh -> r
-- ------------------------------------------------------------
-- Ditaruh sesudah th -> t supaya "arthritis" tidak tersentuh: sesudah th
-- luruh ia jadi "artritis" dan tidak lagi punya "rh".

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
                  replace(replace(replace(replace(replace(replace(replace(replace(replace(
                    regexp_replace(lower(p_teks), '[^a-z0-9]+', ' ', 'g'),
                  'ae','e'), 'oe','e'), 'ity','itas'), 'tion','si'), 'sion','si'),
                  'ph','f'), 'ch','k'), 'th','t'), 'rh','r'),
                'c([eiy])', 's\1', 'g'),
              'c','k'),
            'x','ks'),
          'qu','ku'),
        'y','i'),
      'stm','sm'),
    'n[gk](?=[bdgjkptsz])', 'n', 'g'),
  '(.)\1+', '\1', 'g'));
$$;

comment on function public.normalisasi_medis(text) is
  'Menyamakan ejaan serapan Indonesia dengan aslinya: ph->f, ch->k, th->t, rh->r, c->k/s, y->i, x->ks, -tion->-si, huruf ganda jadi tunggal. Bukan terjemahan, cuma kunci pencocokan.';

-- ------------------------------------------------------------
-- 3. Pasang ulang, sekarang terhitung dengan aturan baru
-- ------------------------------------------------------------

alter table public.icd10
  add column nama_norm text
  generated always as (public.normalisasi_medis(nama)) stored;

alter table public.icd9cm
  add column nama_norm text
  generated always as (public.normalisasi_medis(nama)) stored;

create index if not exists idx_icd10_norm on public.icd10 using gin (nama_norm gin_trgm_ops);
create index if not exists idx_icd9_norm  on public.icd9cm using gin (nama_norm gin_trgm_ops);
