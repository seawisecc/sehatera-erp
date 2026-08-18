@AGENTS.md

# Sehatera

Sistem manajemen fasilitas kesehatan berlangganan, multi-tenant. Oleh Seawise
Studio. Sekeluarga dengan **TokoKu** (`~/Desktop/tokoku-erp`), yang dipakai
sebagai acuan pola, bukan untuk disalin mentah.

Tiga bentuk fasilitas, dipilih saat mendaftar dan disimpan di `companies.sektor`:
`apotek`, `klinik`, `rumah_sakit`. Sektor menentukan menu mana yang ada
(`MODUL_SEKTOR` di `lib/faskes.ts`) dan istilah apa yang dipakai (`istilah()`).
Klinik dan rumah sakit mendapat SELURUH modul apotek ditambah pasien, kunjungan,
rekam medis, dan resep.

Penyaring menu berlapis tiga, urutannya penting: **sektor** (apa yang ada) →
**hak pengguna** (apa yang boleh dilihat) → **paket** (apa yang sudah dibuka).

## Perintah

```bash
npm run dev            # localhost:3000
npm run build          # wajib lolos sebelum menganggap sesuatu selesai
npx tsc --noEmit       # typecheck
```

Tidak ada test suite. Itu fakta yang harus mengubah cara bekerja di sini:
**setiap perubahan diverifikasi lewat `npm run build` dan, untuk apa pun yang
kelihatan di layar, dengan benar-benar membukanya di peramban.** Menyimpulkan
"seharusnya jalan" dari kode saja sudah beberapa kali salah di project ini.

## Database

Supabase, project ref `nycfqanzszwiuwrlugjb` (org `seawisecc's Org`).

**Database dibangun HANYA lewat `supabase/migrations/`, berurut.** Folder
`sql/` adalah arsip cara lama: jangan dijalankan, beberapa file di sana justru
memasang lubang keamanan yang sudah ditutup.

| Migrasi | Isi |
| --- | --- |
| `0001_baseline_schema` | Seluruh tabel: platform (plans, companies, super_admins) dan apotek |
| `0002_rls_and_numbering` | Isolasi antar apotek, penomoran dokumen, penutupan lubang RLS |
| `0003_plan_quotas_and_subscription` | Kuota paket lewat trigger, masa aktif, masa coba |
| `0004_rpc` | `my_context()`, `register_apotek()`, `apply_transaction()` |
| `0005_guard_allows_admin_paths` | Gerbang kolom komersial melewatkan service_role & koneksi langsung |
| `0006_public_plans_read` | Paket terbaca tanpa login untuk halaman harga |
| `0007_tema_terang_saja` | Empat tema jadi terang semua; neon & midnight dibuang |
| `0008_teks_tanpa_tanda_pisah` | Membuang tanda pisah panjang dari teks yang dilihat pengguna |
| `0009_pembatalan_transaksi` | `transaction_item_batches`, `cancel_transaction()` yang membalikkan batch persis |
| `0010_penerimaan_barang` | `receive_purchase_order()` dengan delta relatif dan penggabungan batch |
| `0011_pemusnahan_dan_retur` | `abaikan_batch()`, `musnahkan_batch()`, `konfirmasi_retur()` |
| `0012_undangan_dan_audit` | `catat_audit()`, `invitations` (simpan hash saja), undangan tim |
| `0013_tagihan_langganan` | `billing_invoices`, `webhook_events`, pelunasan idempoten |
| `0014_jalur_admin_platform` | `boleh_admin_platform()`: super admin, service_role, koneksi langsung |
| `0015_identitas_faskes` | `companies.sektor`, `register_faskes()`, `my_context()` membawa sektor |
| `0016_pasien_dan_kunjungan` | `patients`, `visits`, mesin keadaan kunjungan, antrean harian |
| `0017_kunjungan_jalur_admin` | `ubah_status_kunjungan` memakai `boleh_admin_platform()` |
| `0018_rekam_medis` | SOAP, tanda vital berkode LOINC, diagnosis ICD-10, adendum, statusHistory |
| `0019_antrean_dengan_rekam_medis` | Antrean membawa keadaan rekam medisnya |
| `0020_poli_dan_dokter` | `clinic_units`, `unit_doctors`, deret antrean per poli, peran klinik |
| `0021_mode_farmasi` | `settings.mode_farmasi`, `transactions.visit_id`, batas instalasi farmasi |
| `0022_jalur_admin_klinik` | `simpan_pasien` & `daftar_kunjungan` menerima `p_company` |
| `0023_eresep` | `prescriptions`, `prescription_items`, antrean farmasi, penandaan dilayani |
| `0024_tagihan_kunjungan` | `visit_charges`, biaya administrasi & konsultasi masuk lewat trigger, `tagihan_kunjungan()` |
| `0025_terminologi_icd` | Tabel `icd10`, `icd9cm`, `icd10_alias`; `cari_icd10()`, `cari_icd9()`; penandaan `terverifikasi`; `services.kode_icd9` |
| `0026..0028_data_icd10_bagian1..3` | Isi 18.543 kode ICD-10 dari berkas e-klaim Kemenkes |
| `0029_data_icd9cm_dan_alias` | Isi 4.626 kode ICD-9-CM, dan 49 alias Indonesia |
| `0030_cari_icd_bahasa_indonesia` | `normalisasi_medis()`, `icd_kata` (162 pasang), `nama_norm`, pencarian dua bahasa |
| `0031_normalisasi_rh` | `rh` luruh jadi `r`: cirrhosis = sirosis |
| `0032_glosarium_kunci_ternormalisasi` | Kunci glosarium dibandingkan setelah dinormalkan |
| `0033_glosarium_tindakan` | 81 kata kerja tindakan: jahit, cabut, pasang, angkat |
| `0034_riwayat_pasien` | `riwayat_pasien()`: pintu ke rekam medis kunjungan lama |
| `0035_jabat_tangan_farmasi` | Keadaan `disiapkan` & `siap`, `serahkan_resep()`, kasir berhenti menyatakan penyerahan |
| `0036_resep_ikut_keadaan_baru` | `resep_kunjungan()` mengenal keadaan baru, `isi_resep()` untuk farmasi |
| `0037_kembalikan_nilai_biaya` | Mengembalikan `nilai_biaya` yang terhapus saat 0035 membuat ulang view |

`supabase/seed.sql` mengisi paket & super admin. `supabase/seed_demo.sql`
mengisi satu apotek dengan data yang cukup untuk mencoba aplikasinya.

**Migrasi yang sudah dijalankan tidak boleh disunting.** Perbaikan selalu jadi
migrasi baru: file dan database harus tetap sama isinya, dan itulah seluruh
alasan folder ini ada.

`supabase/uji/` berisi pembuktian migrasi: blok `do $$` yang diakhiri
`raise exception` supaya seluruh percobaannya dibatalkan. **Bukan migrasi, dan
tidak pernah mengubah apa pun.** Yang benar cuma satu keluaran: galat terakhir
berbunyi "SEMUA UJI LULUS". Tempelkan sesudah migrasinya dijalankan.

Migrasi 0026 sampai 0029 isinya data, bukan skema, dan berukuran 214 sampai
338 KB per berkas. Ukuran itu disengaja: satu tempelan 1 MB membuat SQL Editor
Supabase tersendat, dan jalur menjalankan SQL di project ini memang lewat sana.
Isinya satu pernyataan `insert ... select from unnest(string_to_array(...))`
berpembatas "|", bukan puluhan ribu tuple VALUES, dan `on conflict do update`
membuatnya aman dijalankan ulang.

**Migrasi harus aman dijalankan di atas database yang sudah berisi data.**
Bentuknya `create table if not exists` lalu `alter table ... add column if not
exists` satu per satu, bukan satu CREATE TABLE yang rapi. Alasannya di header
migrasi 0001: `create table if not exists` pada tabel yang sudah ada tidak
melakukan apa pun dan tidak mengeluh, jadi migrasi berbentuk CREATE TABLE saja
akan melapor "berhasil" sambil meninggalkan database persis seperti semula.

## Aturan yang tidak boleh dilanggar

**Kuota, masa aktif, dan kewajiban resep ditegakkan di DATABASE, bukan di
layar.** Dua alasan konkret: impor katalog CSV menembak tabel `products`
langsung dalam satu insert massal, jadi gerbang yang hanya ada di form akan
dilewati; dan penolakan RLS mengembalikan "berhasil" dengan nol baris, bukan
error, jadi pengecekan di aplikasi bocor tanpa jejak.

Penolakan memakai SQLSTATE tersendiri supaya aplikasi mengenalinya tanpa
mencocokkan teks. Pesannya sudah ditulis untuk pemilik apotek, jadi aman
ditampilkan apa adanya: lihat `pesanError()` di `lib/session.ts`.

| Kode | Arti |
| --- | --- |
| `SH001` | Kolom komersial diubah oleh yang bukan admin |
| `SH002` | Kuota paket penuh |
| `SH003` | Masa aktif langganan habis |
| `SH004` | Masukan tidak sah |
| `SH005` | Stok tidak cukup |
| `SH006` | Obat golongan tanpa identitas pasien / nomor resep |

**RLS menyaring baris, bukan kolom.** Policy yang mengizinkan pemilik apotek
memperbarui profilnya otomatis mengizinkan ia menulis `status` dan tanggal
langganan juga. Itu ditahan trigger `guard_company_commercial()`, bukan policy.
Pola yang sama berlaku untuk kolom sensitif mana pun yang ditambahkan nanti.

**Fungsi yang menerima id apotek sebagai argumen hak panggilnya dicabut dari
`authenticated`.** `company_lapsed_at`, `company_is_active`, `company_quota`,
`company_usage`: semuanya bisa dipakai memeriksa apotek lain satu per satu
kalau dibiarkan terbuka. Yang boleh dipanggil aplikasi adalah view yang
menyaring dirinya sendiri (`v_company_quota`).

**Aturan masa aktif di `lib/subscription.ts` harus PERSIS sama dengan
`company_lapsed_at()`.** Kalau berbeda, apotek melihat "aman" di layar lalu
ditolak saat menekan Proses Transaksi: di depan pembeli yang sedang antre.
STATUS yang menentukan tanggal mana yang berlaku: `trial` membaca
`trial_ends_at`, `active` membaca `subscription_ends_at`. Jangan pernah
`coalesce` keduanya.

**Kolom kosong berarti kemampuan PENUH, bukan terkunci** (`lib/plan.ts`).
Paket dibuat tangan lewat Super Admin, jadi penanda yang lupa diisi itu wajar,
dan memberi kelebihan jauh lebih murah daripada mengunci apotek yang sudah
membayar lalu menunggu mereka mengeluh. Satu pengecualian: `klinik` harus
dinyalakan sengaja: itu produk terpisah dengan kewajiban hukum sendiri.

**SIPNAP ada di semua paket, termasuk Starter.** Pelaporan narkotika dan
psikotropika adalah kewajiban hukum apotek, bukan fitur premium. Yang boleh
dikunci di paket atas hanya kemudahannya: rekap lintas cabang dan pengiriman
terjadwal. Aturan yang sama berlaku untuk fitur kepatuhan apa pun nanti.

**Masa aktif habis TIDAK mengunci aplikasi.** Yang berhenti hanya transaksi
baru. Apotek yang lewat masa aktifnya masih punya kewajiban SIPNAP bulan itu,
masih perlu mencetak ulang faktur, dan masih perlu melihat kartu stoknya.

## Tema

Semua warna melewati token di `app/globals.css`. **Jangan pernah menulis hex
langsung di komponen**: dulu `#1e3a2c` muncul 309 kali dan "ganti tema" jadi
praktis tidak bisa dilakukan.

Empat tema, **semuanya terang**, dipilih lewat `data-theme` di `<html>`:
`sunrise-sorbet` (bawaan), `vital-tide` (biru kehijauan), `lilac-dawn`, dan
`clinic-mint`. Tema gelap dibuang di migrasi 0007 atas permintaan pemilik:
faskes bekerja di ruangan terang dan mencetak di kertas putih.

**Token `--mark-1..3` (gradien logo) hanya dirujuk dari JSX**, jadi pengoptimal
CSS pernah membuangnya dan logo berubah hitam. Yang menahannya adalah aturan
`.sw-mark` di `globals.css` yang menyebut ketiganya. Jangan hapus aturan itu
meski terlihat tidak berguna: itu satu-satunya rujukan yang terlihat alat.

Menambah tema: satu blok `[data-theme="..."]` di `globals.css` + satu entri di
`THEMES` (`lib/theme.tsx`). **Jangan menulis daftar id tema di tempat kedua** -
`ThemeScript` dulu menanam dua id secara harfiah di dalam string, jadi tema
ketiga akan ditolak sebagai tidak dikenal dan semua orang dikembalikan ke tema
bawaan tiap halaman dibuka. Sekarang daftarnya dibangun dari `THEMES`.

Tiga warna tiap palet adalah **gradien identitas, bukan warna teks** -
`#fbd786` di atas putih tidak terbaca siapa pun. Bedakan dua permukaan yang
mirip tapi tidak sama:

- di atas `--brand` (pekat) → pakai `--on-brand`
- di atas `--grad` (gradien, terang di Sorbet) → pakai `--on-grad`

Satu token untuk dua permukaan itu selalu salah di salah satunya.

Dokumen cetak (`lib/cetak.ts`) SELALU hitam di atas putih, tidak ikut tema.
Kertas tidak punya tema gelap.

## Bentuk kode

Monolit `app/dashboard/page.tsx` sudah dibongkar: sekarang 15 baris berisi
`redirect('/beranda')`. Seluruh modul punya rutenya sendiri di `app/(app)/`.
Keadaan yang dipakai bersama ada di `AppProvider` (`lib/app-context.tsx`);
`app.scope()` menyaring kueri ke fasilitas yang sedang aktif, termasuk saat
super admin sedang melihat klien.

Modul klinik ada di `components/klinik/`: `FormPasien`, `RekamMedis`, `Resep`,
`PengaturanPoli`, `RiwayatPasien`, `PilihICD9`.

**Rekam medis dibuka dari DUA pintu, dan keduanya perlu.** Dari Kunjungan untuk
pasien HARI INI, dan dari Pasien lewat tombol Riwayat untuk kunjungan lama.
Pintu kedua sempat tidak ada sama sekali: layar Kunjungan cuma membaca
`v_antrean_hari_ini`, jadi begitu hari berganti rekam medis yang sudah tercatat
tidak bisa dibuka lagi oleh siapa pun. Datanya utuh, cuma tidak terjangkau.
Itu menghapus alasan utama orang memakai rekam medis elektronik.

`RekamMedis` sendiri sudah tahu membedakan keduanya: kunjungan berstatus
`selesai` atau `batal` tampil sebagai bacaan yang hanya bisa ditambahi adendum,
dan itu ditegakkan database sejak migrasi 0018, bukan oleh layarnya.

Bahasa: **antarmuka dan komentar dalam bahasa Indonesia.** Ada dwibahasa ID/EN
lewat `lib/i18n.tsx`: helper `t('teks id', 'english text')`. TokoKu tidak
punya ini; di sini dipertahankan.

**Jangan pakai tanda pisah panjang (em dash) di mana pun** yang dilihat
pengguna: teks antarmuka, pesan galat, judul tab, commit, dokumen. Pemilik
memintanya sendiri. Untuk judul tab peramban pakai `|`.

Angka diformat lewat `lib/format.ts` (`rupiah`, `angka`, `tanggal`,
`tanggalJam`), bukan `toLocaleString` yang ditulis ulang di tiap berkas.

## Bentuk data medis ditentukan SatuSehat dan BPJS, bukan selera

Pengirimannya belum dibangun, tapi bentuk tabelnya sudah menuruti keduanya.
Alasannya: menambah kolom kosong belakangan itu murah, sedangkan data yang
terlanjur terkumpul setahun dalam bentuk yang tidak bisa dikirim tidak bisa
diperbaiki tanpa mengetik ulang. **Pertahankan aturan ini pada tabel medis baru
mana pun.**

- Tanda vital = kolom berjenis, tiap kolom membawa kode LOINC-nya di komentar.
  Bukan satu kotak catatan: "TD 120/80" tidak bisa dipetakan ke Observation
  tanpa menebak.
- Diagnosis = baris berkode ICD-10, satu diagnosis primer per kunjungan.
- Aturan pakai resep dipecah jadi dosis, frekuensi, rute. "3x1 sesudah makan"
  tidak bisa dibelah kembali.
- Riwayat keadaan kunjungan dicatat lewat TRIGGER, bukan dari dalam fungsinya,
  supaya perubahan lewat jalur lain juga tertangkap. Encounter mewajibkan
  statusHistory.
- Kolom IHS sudah ada di `patients`, `app_users`, `settings`, `visits`,
  `prescriptions`.

Tiga aturan medis yang ditegakkan database, bukan layar: kunjungan tidak bisa
ditutup tanpa diagnosis; rekam medis yang sudah ditutup hanya bisa ditambahi
adendum; resep yang sudah difinalkan hanya bisa dibatalkan lalu ditulis ulang.

**Daftar ICD sekarang RESMI dan ada di database, bukan di berkas TypeScript.**
Sumbernya berkas e-klaim Kemenkes yang diberikan pemilik: 18.543 kode ICD-10
dan 4.626 kode ICD-9-CM, daftar yang sama persis dipakai INA-CBG menilai klaim.
`lib/icd10.ts` sekarang hanya pembungkus pencarian, isinya sudah tidak ada di
sana: 18.543 baris berarti sekitar 1 MB JavaScript untuk menampilkan delapan
baris hasil.

Tiga hal yang perlu diingat sebelum menyentuhnya lagi:

- **Kode di luar daftar tidak ditolak, cuma ditandai** (`visit_diagnoses.terverifikasi`).
  Berkasnya berlabel versi 2010 tapi masih dirawat (U07.1 COVID-19 ada di
  dalamnya), jadi ia bisa tertinggal dari SatuSehat tanpa ada yang memberi
  tahu. Menolak keras berarti ada dokter yang tidak bisa menutup kunjungannya
  di depan pasien karena kodenya terlalu baru.
- **Nama resmi seluruhnya bahasa Inggris**, dan itu ditangani BERLAPIS TIGA
  (migrasi 0030 sampai 0032), karena masalahnya ternyata dua hal yang berbeda:

  1. **Ejaan** diselesaikan mesin. `normalisasi_medis()` meluruhkan ph->f,
     ch->k, th->t, rh->r, c->k/s, y->i, x->ks, -tion->-si, dan huruf ganda,
     lalu dipakai pada nama resmi (kolom `nama_norm`) DAN pada yang diketik.
     Jadi "faringitis" bertemu "pharyngitis" tanpa ada yang mendaftarkannya.
  2. **Kosakata** tidak bisa diselesaikan mesin. "demam" bukan salah eja dari
     "fever". Itu tugas `icd_kata`, 162 pasang kata Indonesia ke Inggris.
  3. **Frasa utuh** tetap di `icd10_alias`, 49 nama yang dulu jadi seluruh isi
     `lib/icd10.ts`.

  Antar kata syaratnya DAN, antar padanan satu kata syaratnya ATAU. Itu yang
  membuat "demam berdarah" tidak mengembalikan semua yang demam, walau di nama
  resminya urutannya justru terbalik ("dengue haemorrhagic fever").

  **Menambah baris di `icd_kata` itu tempat pertama yang dilihat kalau ada
  keluhan "kok tidak ketemu"**: satu baris di sana memperbaiki pencarian untuk
  ribuan kode sekaligus, sedangkan satu alias cuma memperbaiki satu kode.

  **Diagnosis dan tindakan butuh JENIS KATA yang berbeda, dan itu terlewat
  sekali.** Glosarium 0030 seluruhnya kata benda, karena disusun sambil
  memikirkan kotak diagnosis: keluhan, organ, sifat. Seluruh ICD-9-CM justru
  kata kerja (suture, excision, insertion), jadi kotak tindakan sebenarnya
  cuma bisa dicari dalam bahasa Inggris dan tidak ada uji yang menangkapnya.
  Ketahuan saat formnya dibuka sungguhan di peramban. Migrasi 0033 menambal
  dengan 81 kata kerja. **Uji yang memakai daftar kata susunan sendiri tidak
  bisa menemukan kata yang tidak terpikirkan; hanya memakai aplikasinya yang
  bisa.**

  **Yang sengaja TIDAK dilakukan: menerjemahkan 18.543 nama dengan mesin.**
  Terjemahan medis yang setengah benar lebih berbahaya daripada tidak ada,
  alasannya sama persis dengan kenapa pemeriksaan interaksi obat tidak dibuat.

  **`nama_norm` itu kolom GENERATED STORED.** Mengubah isi `normalisasi_medis()`
  TIDAK menghitung ulang baris yang sudah tersimpan, dan Postgres tidak
  mengeluh sedikit pun. Kolomnya harus dibuang lalu dipasang ulang, seperti di
  migrasi 0031. Ini jenis kesalahan yang tidak akan pernah muncul sebagai galat.
- **Kode ICD-9-CM tindakan menempel di katalog layanan** (`services.kode_icd9`),
  bukan diketik ulang tiap kunjungan, lalu ikut sendiri ke `visit_charges`
  lewat `simpan_biaya_kunjungan`. Kode yang dikirim pemanggil tetap menang.

Yang belum: mencocokkan dengan daftar 144 diagnosis non-spesialistik BPJS
(untuk menandai mana yang boleh ditangani FKTP), dan penerjemahan nama resmi
ke bahasa Indonesia di luar 49 alias itu.

**Verifikasi spesifikasi SatuSehat dan BPJS ke dokumentasi resmi yang berlaku
saat itu, jangan dari ingatan.** Versi FHIR, resource wajib, format tanda tangan
permintaan, dan syarat sertifikasi berubah cukup sering. Kredensial BPJS
diberikan per faskes, bukan per vendor: harus disimpan terenkripsi per tenant,
bukan polos di `settings`.

### Yang sudah diperiksa ke dokumentasi resmi SatuSehat

Dibaca dari `satusehat.kemkes.go.id/platform/docs` pada **18 Agustus 2026**.
Dua yang pertama diambil dari halaman resource-nya langsung, dan keduanya
sudah dipakai memutuskan bentuk tabel di migrasi 0025:

- `Condition.code` memakai system **`http://hl7.org/fhir/sid/icd-10`**.
  **Satu payload `Condition` hanya boleh membawa SATU kode ICD-10**, jadi
  kunjungan dengan tiga diagnosis berangkat sebagai tiga payload. Ini
  cocok dengan bentuk `visit_diagnoses` yang sudah satu baris per kode.
- `Procedure.code` memakai system **`http://hl7.org/fhir/sid/icd-9-cm`**.
  Wajib: `status`, `code.coding`, `subject`, `encounter`, `performer.actor`.
  `performer.actor` sempat tidak punya tempat: `visit_charges` cuma mencatat
  siapa yang MENGETIK biayanya (`dicatat_oleh`), yang di klinik sibuk hampir
  selalu kasir, bukan yang memegang alatnya. Migrasi 0025 menambah
  `visit_charges.dikerjakan_oleh`, bawaannya dokter kunjungan itu.
- Urutannya: daftar faskes, lengkapi profil, ambil kredensial sandbox,
  kirim prasyarat (Organization, Location, Practitioner, Patient) lebih
  dulu, baru resource klinis. Patient harus lewat pencocokan MPI, bukan
  dibuat sendiri.

**Alamat endpoint dan alur OAuth2 di bawah ini BELUM diverifikasi ke
dokumen resmi**, sumbernya pustaka pihak ketiga dan tulisan orang. Jangan
dipakai menulis kode sebelum dicocokkan sendiri ke dokumen resmi saat
kredensialnya sudah ada:

- token: `POST {base}/oauth2/v1/accesstoken?grant_type=client_credentials`
- FHIR: `{base}/fhir-r4/v1/{Resource}`
- base produksi `https://api-satusehat.kemkes.go.id`, sandbox
  `https://api-satusehat-dev.dto.kemkes.go.id`

Yang menahan pekerjaan ini bukan lagi bentuk data, melainkan kredensial
per faskes dan tempat menyimpannya terenkripsi.

## Uang kunjungan: satu tagihan, dan dua biaya yang masuk sendiri

Biaya administrasi masuk lewat trigger saat kunjungan dibuka; tarif konsultasi
masuk saat kunjungan berpindah ke `diperiksa`, bukan saat pendaftaran, karena
pasien yang pulang dari ruang tunggu sebelum diperiksa tidak boleh ditagih
konsultasi. Indeks unik parsial menahan penagihan ganda saat kunjungan mundur
lalu maju lagi di rel keadaan.

Kasir mengambil tarif, tindakan, dan obat lewat SATU panggilan
(`tagihan_kunjungan`), bukan dua. Kalau terpisah, ada jeda di mana kasir sudah
melihat tarifnya tapi obatnya belum sampai, lalu menekan Proses; struk yang
kurang satu baris baru ketahuan saat pasien sudah pulang.

Tagihan terkunci begitu kunjungan berstatus `selesai` atau `batal`.

## Farmasi klinik: dua bentuk, beda hukum

`settings.mode_farmasi` = `apotek` (izin sendiri, boleh melayani umum) atau
`instalasi` (menempel izin klinik, hanya pasien sendiri). Dalam mode instalasi,
penjualan tanpa `visit_id` **ditolak trigger**, bukan ditolak layar, supaya
batasnya sudah menunggu di jalur mana pun yang ditulis nanti.

Penyerahan obat dari resep TIDAK punya jalur stok sendiri: ia mengisi keranjang
kasir lalu keluar lewat `apply_transaction`. Jalur kedua berarti dua tempat yang
harus benar, dan yang kedua akan ketinggalan pada perbaikan berikutnya.

### Uang dan penyerahan adalah dua kejadian terpisah

**Kasir mencatat UANG. Farmasi menyatakan PENYERAHAN.** Sampai migrasi 0035
keduanya satu klik: kasir memanggil `tandai_resep_dilayani` saat pembayaran,
jadi database mencatat obat sudah diserahkan pada detik uang diterima. Pasien
yang membayar lalu pulang tanpa mengambil obatnya tercatat sudah menerima, dan
untuk narkotika serta psikotropika itu catatan bertanda tangan apoteker yang
isinya salah.

Rel keadaan resep sekarang lima, dan tiap perpindahan ditulis oleh yang
benar-benar mengerjakannya:

| Keadaan | Siapa | Artinya |
| --- | --- | --- |
| `draf` | dokter | belum selesai berpikir, tidak masuk antrean farmasi |
| `final` | dokter | muncul di layar Farmasi |
| `disiapkan` | farmasi | sedang dikerjakan, kasir sudah boleh menagih |
| `siap` | farmasi | obat siap, menunggu pembayaran |
| `dilayani` | farmasi | benar-benar berpindah tangan |

`serahkan_resep()` MENUNTUT pembayaran sudah tercatat, tapi tidak memalang
mati: `p_tanpa_bayar` membukanya dengan syarat alasannya ditulis, dan alasan
itu masuk jejak audit beserta kolom `serah_tanpa_bayar`. Palang yang tidak
bisa dilewati akan diakali dengan cara yang tidak meninggalkan jejak sama
sekali, yaitu menekan tombol bayar padahal belum dibayar.

`dilayani` sengaja tidak diganti nama jadi `diserahkan`: baris lama memakai
nilai itu. **Baris `dilayani` sebelum migrasi 0035 `dilayani_pada`-nya adalah
waktu BAYAR, bukan waktu serah.** Tidak bisa diperbaiki surut.

**Menambah nilai status berarti memeriksa tiap tempat yang menyebut nilai
lama.** Migrasi 0036 lahir persis karena itu terlewat: `resep_kunjungan()`
menyaring daftar harfiah tiga status, jadi resep yang sedang disiapkan farmasi
hilang dari layar dokter. Daftar harfiah tidak pernah mengeluh saat
ketinggalan.

## Di mana pekerjaannya berhenti

**Tulang punggung modul klinik SELESAI dan sudah diuji satu per satu di
database.** Alurnya utuh: daftar, antre per poli, periksa (SOAP, tanda vital,
diagnosis ICD-10), resep, obat lewat kasir, bayar. Setiap migrasi dibuktikan
dengan blok `do $$` yang diakhiri `raise exception` supaya seluruh percobaannya
dibatalkan dan tidak meninggalkan baris di produksi. **Pertahankan cara itu.**

Sekarang di **tahap 8**, enam permintaan pemilik. Urutannya disusun menurut mana
yang paling menghalangi klinik memakainya besok pagi, bukan mana yang paling
menarik:

| | Apa | Keadaan |
| --- | --- | --- |
| 1 | Satu tagihan per kunjungan | **selesai** (migrasi 0024) |
| 2 | Hak akses per sub-modul kunjungan | **berikutnya** |
| 3 | Layar antrean ruang tunggu + panggilan suara | belum |
| 4 | ICD-10 resmi dan ICD-9-CM untuk tindakan | **selesai** (migrasi 0025..0029) |
| 5 | Reservasi | belum, modul baru |
| 6 | Kirim ke SatuSehat dan BPJS | belum, tertahan kredensial |

### Berikutnya: hak akses per sub-modul kunjungan

Sekarang hak akses masih satu bongkah `kunjungan`. Harus dipecah, dan ini
kepatuhan bukan kenyamanan: **petugas pendaftaran tidak boleh bisa membuka isi
rekam medis orang.** Bentuk yang sudah diusulkan ke pemilik dan menunggu
koreksinya:

- **pendaftaran** memegang identitas dan antrean, tidak membuka rekam medis
- **perawat** menambah tanda vital dan tindakan, tidak menulis diagnosis
- **dokter** menulis SOAP, diagnosis, dan resep
- **farmasi** melihat resep dan alergi, tidak membuka SOAP
- **kasir** melihat tagihan, tidak membuka apa pun yang medis

Yang menahan harus di **database**, bukan cuma menyembunyikan tombol.
Menyembunyikan tombol saja berarti siapa pun yang tahu alamatnya tetap bisa
membaca, dan untuk rekam medis itu bukan kelalaian kecil.

### Data uji

Ada satu klinik contoh di produksi, **Klinik Rexco 88**, sektor `klinik`, mode
farmasi `instalasi`. Isinya 4 poli, 7 tenaga kesehatan, 25 obat dengan 32 batch
(beberapa sengaja kadaluarsa dan hampir kadaluarsa), 8 layanan, 12 pasien, dan
kunjungan hari ini yang tersebar di semua keadaan. Skrip pengisinya idempoten
dan tidak menyentuh fasilitas lain.

## Dua pelajaran yang mahal kalau diulang

**Dasbor Supabase bisa berbohong.** Pada migrasi 0021 ia menampilkan
"Running..." tanpa henti padahal pernyataannya sudah selesai sejak awal. Cara
memeriksanya bukan menunggu lebih lama, melainkan bertanya ke database lewat
jalur lain: panggil RPC-nya dengan anon key, lalu baca pesannya. `permission
denied for function X` berarti fungsinya ADA; `Could not find the function`
berarti tidak ada. Jangan pernah menjalankan ulang migrasi karena dasbor
terlihat menggantung.

**Jangan pernah menyalin definisi VIEW dari berkas migrasi lama.** Migrasi
0035 membuat ulang `v_antrean_hari_ini` dengan DROP lalu CREATE memakai
definisi dari migrasi 0023, padahal 0024 sudah menambahkan `nilai_biaya`.
Kolom itu hilang, dan karena kasir memilihnya eksplisit, PostgREST menolak
seluruh kueri: **daftar kunjungan di layar Kasir kosong SELURUHNYA**, bukan
sebagian. Tidak ada yang gagal saat migrasi dijalankan; galatnya muncul di
peramban orang lain sebagai daftar kosong yang tampak seperti "memang belum
ada pasien". Ditemukan pemilik, bukan oleh saya.

`create or replace view` menolak menggeser kolom, dan **itu justru penjaga**.
Begitu DROP dipakai untuk melewatinya, satu-satunya alat yang akan mengeluh
ikut hilang. Ambil definisi yang SEDANG BERLAKU dari database
(`pg_get_viewdef`), bukan dari berkas migrasi mana pun: berkas cuma tahu
keadaan saat ia ditulis. `supabase/uji/0037_kolom_view_antrean.sql` sekarang
memegang daftar kolom kedua view itu sebagai kontrak.

**`saveSettings` di halaman Pengaturan memakai daftar kolom yang eksplisit.**
Kolom `settings` baru yang lupa didaftarkan di sana akan tersimpan diam-diam
sebagai tidak berubah, tanpa pesan galat apa pun. Tiap kali menambah kolom
`settings`, daftarkan juga di `payload` fungsi itu.

## Yang belum ada

Pengiriman ke SatuSehat dan BPJS (bentuk datanya sudah siap, kredensialnya
belum), pemetaan obat ke kode KFA, penyimpanan kredensial terenkripsi per
tenant, dan antrean kirim ulang yang idempoten (pola `webhook_events`).

Pemeriksaan interaksi obat **sengaja tidak dibuat**: butuh basis data interaksi
terpelihara, dan yang setengah benar lebih berbahaya daripada tidak ada karena
orang mulai memercayainya. Ini dikatakan di layar resep, bukan didiamkan.

Payment gateway belum tersambung: pergantian paket masih manual lewat Super
Admin. SMTP undangan tim belum disetel, tautannya dikirim tangan.

Paket **Klinik** ada di database tapi `is_public = false`: harganya
(Rp 1.490.000/bln) sudah disetujui pemilik, tapi baru boleh ditampilkan setelah
modulnya benar-benar siap dijual. Rumah sakit tidak ditawarkan di pendaftaran
mandiri: harganya per implementasi.

## Lembar progres

`~/.claude/projects/-Users-agusyulyastrawan-Desktop-sehatera-erp/progres-sehatera.html`,
diterbitkan sebagai artifact. **Buka tiap sesi** dan perbarui saat satu tahap
selesai. Repo GitHub ini publik, jadi dokumen bisnis dan URL artifact tidak
boleh masuk ke dalamnya.
