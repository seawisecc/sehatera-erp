-- ============================================================
-- 0032  Kunci glosarium ikut dinormalkan
-- ============================================================
--
-- Glosarium di migrasi 0030 tidak pernah kena untuk kata yang ejaannya
-- BERUBAH saat dinormalkan, dan itu memakan sebagian besar isinya.
--
-- Jalannya begini: `cari_icd10` menormalkan seluruh yang diketik lebih dulu,
-- baru memecahnya jadi kata. Jadi yang sampai ke `icd_kemungkinan` adalah
-- "nieri", bukan "nyeri". Sementara `icd_kata` menyimpan "nyeri" apa adanya.
-- Perbandingannya `g.id_kata = p_kata`, jadi "nyeri" tidak pernah sama dengan
-- "nieri" dan seluruh cabang glosariumnya diam.
--
-- Yang menyamarkan kesalahan ini: kata yang ejaannya TIDAK berubah tetap
-- jalan. "demam", "sakit", "kepala", "luka", "tulang" semuanya lolos, jadi
-- pengujian sepintas kelihatan berhasil. Yang jatuh justru yang mengandung
-- y, c, ph, th: "nyeri", "cacing", "kencing", "psikosis".
--
-- Ditemukan berkas uji lewat "nyeri dada", yang seharusnya menemukan R07
-- (Chest pain) dan mengembalikan nol.
--
-- Perbaikannya: bandingkan sesudah keduanya dinormalkan. Isi tabelnya tetap
-- ditulis dalam ejaan Indonesia yang benar, karena tabel itu dibaca dan
-- disunting orang; yang dinormalkan cuma perbandingannya. 162 baris, jadi
-- memanggil fungsinya per baris tidak ada artinya buat kecepatan.

create or replace function public.icd_kemungkinan(p_kata text)
returns text[]
language sql stable parallel safe
as $$
  -- p_kata SUDAH ternormalisasi saat sampai ke sini, dipakai apa adanya.
  select array_agg(distinct x) from (
    select p_kata as x
    union
    select public.normalisasi_medis(g.en_kata)
      from public.icd_kata g
     where p_kata = public.normalisasi_medis(g.id_kata)
        -- imbuhan dilepas: ke-an, per-an, peN-an, ber-, meN-, -an, -nya
        or p_kata in (
             public.normalisasi_medis('ke'  || g.id_kata || 'an'),
             public.normalisasi_medis('per' || g.id_kata || 'an'),
             public.normalisasi_medis('pe'  || g.id_kata || 'an'),
             public.normalisasi_medis('ber' || g.id_kata),
             public.normalisasi_medis('me'  || g.id_kata),
             public.normalisasi_medis(g.id_kata || 'an'),
             public.normalisasi_medis(g.id_kata || 'nya'))
  ) s where length(x) > 2;
$$;

comment on function public.icd_kemungkinan(text) is
  'Satu kata ternormalisasi menjadi daftar bentuk yang mungkin muncul di nama resmi: dirinya sendiri, padanan Inggrisnya, dan padanan dari akar katanya setelah imbuhan dilepas.';
