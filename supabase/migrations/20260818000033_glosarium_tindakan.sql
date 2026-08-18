-- ============================================================
-- 0033  Glosarium kata tindakan
-- ============================================================
--
-- Ditemukan saat mencoba aplikasinya sungguhan, bukan dari membaca kode:
-- di form Layanan, "suture skin" menemukan 86.5 dengan benar, sedangkan
-- "jahit kulit" tidak menemukan apa pun.
--
-- Sebabnya glosarium di migrasi 0030 saya susun sambil memikirkan kotak
-- DIAGNOSIS: isinya keluhan (demam, nyeri, mual), organ (jantung, kulit),
-- dan sifat (akut, kronik). Semuanya kata benda. Tidak ada satu pun kata
-- kerja, padahal seluruh ICD-9-CM justru kata kerja: suture, excision,
-- insertion, removal.
--
-- Jadi kotak ICD-9-CM sebenarnya cuma bisa dicari dalam bahasa Inggris sejak
-- awal, dan itu tidak akan pernah ketahuan dari uji yang saya tulis sendiri,
-- karena uji itu memakai daftar kata yang saya susun sendiri juga.
--
-- 81 pasang. Banyak yang menunjuk ke beberapa kata Inggris karena
-- ICD-9-CM memisahkan hal yang bahasa Indonesianya satu kata: "angkat" bisa
-- removal atau excision, "potong" bisa incision atau excision.

insert into public.icd_kata (id_kata, en_kata)
select split_part(x, '|', 1), split_part(x, '|', 2)
from unnest(string_to_array($KATA$amputasi|amputation
anestesi|anesthesia
angkat|excision
angkat|removal
aspirasi|aspiration
balut|dressing
bedah|surgical
bidai|splint
bilas|lavage
biopsi|biopsy
bius|anesthesia
cabut|extraction
cabut|removal
cangkok|transplant
cuci|irrigation
debridemen|debridement
drainase|drainage
ekg|electrocardiogram
eksisi|excision
endoskopi|endoscopy
fisioterapi|physical
foto|radiography
ganti|replacement
gips|cast
imunisasi|immunization
infus|infusion
inhalasi|inhalation
insisi|incision
jahit|repair
jahit|suture
katarak|cataract
kateter|catheterization
khitan|circumcision
konsultasi|consultation
kuret|curettage
kuretase|curettage
laparoskopi|laparoscopy
lepas|removal
menjahit|suture
nebulisasi|inhalation
oksigen|oxygen
operasi|operation
pasang|implantation
pasang|insertion
pelepasan|removal
pemasangan|insertion
pembalutan|dressing
pembedahan|operation
pembersihan|debridement
pemeriksaan|examination
pemotongan|incision
pencabutan|extraction
pencucian|lavage
pengangkatan|excision
penggantian|replacement
penyuntikan|injection
perawatan|care
perbaikan|repair
perban|bandage
potong|excision
potong|incision
pungsi|puncture
rehabilitasi|rehabilitation
rekam|recording
rekonstruksi|reconstruction
rontgen|radiography
sayat|incision
sinar|radiography
sirkumsisi|circumcision
skeling|scaling
sunat|circumcision
suntik|injection
tambal|restoration
tambalan|restoration
terapi|therapy
traksi|traction
transfusi|transfusion
transplantasi|transplant
ultrasonografi|ultrasound
usg|ultrasound
vaksinasi|vaccination$KATA$, E'\n')) as x
where x <> ''
on conflict (id_kata, en_kata) do nothing;
