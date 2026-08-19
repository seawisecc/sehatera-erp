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
| `0038_permintaan_terbuka_farmasi` | Dokter meminta tanpa memilih produk, farmasi yang mengisi |
| `0039_hak_akses_sub_modul` | `peran_saya()`, `boleh()`, `wajib_boleh()`; sepuluh fungsi medis dijaga |
| `0040_rel_kunjungan_ikut_resep` | Rel bergeser sendiri mengikuti resep, dan boleh dilompati kalau tanpa obat |
| `0041_layar_antrean` | `panggil_antrean()`, token layar, `layar_antrean()` yang dipanggil tanpa login |
| `0042_antrean_bawa_panggilan` | `dipanggil_pada` & `jumlah_panggil` masuk ke `v_antrean_hari_ini` |
| `0043_token_tanpa_pgcrypto` | Token dibuat dari `gen_random_uuid()`, bukan pgcrypto |
| `0044_samaran_nama_bali` | `samarkan_nama()` mengerti penanda I, Ni, Ida, Sri |
| `0045_tagihan_ikut_keadaan_resep` | `tagihan_kunjungan()` mengenal `disiapkan`/`siap`: obat kembali muncul di kasir |
| `0046_papan_tunggu_saja` | Papan hanya menampilkan yang benar-benar menunggu |
| `0047_kasir_tahu_siap_ditagih` | `obat_belum_dipilih`: kasir tahu tagihannya sudah lengkap |
| `0048_daftar_asuransi` | Tabel `insurers` per faskes, `visits.asuransi_id`, pendaftaran bawa dokter & penjamin |
| `0049_rel_baru_kunjungan` | Keadaan `resep` dibuang; kasir & farmasi yang menutup kunjungan |
| `0050_buang_daftar_kunjungan_lama` | Membuang `daftar_kunjungan` 6 argumen yang jadi ambigu |
| `0051_pelunasan_per_penjamin` | `transactions.penjamin`, `diterima_tunai` vs `ditagihkan_penjamin`, `laporan_penjamin()` |
| `0052_apply_transaction_jalur_admin` | Gerbang `apply_transaction` pindah ke `boleh_admin_platform()` supaya pembayaran bisa diuji |
| `0053_laporan_penjamin_jalur_admin` | `laporan_penjamin()` menerima faskes: super admin melihat angka klien, bukan angka sendiri |
| `0054_reservasi` | `doctor_schedules`, `reservations`, kuota per sesi, `hadirkan_reservasi()` |
| `0055_kredensial_faskes` | Kredensial per faskes di Supabase Vault; tabelnya tanpa policy |
| `0056_antrean_kirim` | `outbound_messages`: idempoten, mundur berlipat, menyerah itu keadaan |
| `0057_antre_kirim_penanda_baru` | `found` ditangkap sebelum SELECT menimpanya |
| `0058_draf_tidak_menahan_kunjungan` | Resep `draf` tidak menahan penutupan; reservasi kembar bicara SH004 |
| `0059_identitas_pasien_lengkap` | NIK & telepon wajib dengan pintu darurat berjejak, kerabat, alamat berkolom |
| `0060_rujukan_internal` | Satu kunjungan berpindah poli; SOAP & tarif konsultasi jadi per poli |
| `0061_penunjang` | Lab & radiologi: `visit_penunjang`, `lab_results`, peran `analis` |
| `0062_multi_outlet` | `company_groups`, `outlet_aktif`, `auth_company_id()` berurut & berpindah outlet |
| `0063_tarif_penunjang` | `services.jenis_penunjang`, `service_lab_params`, cetakan ikut ke permintaan |

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
| `SH007` | Peran tidak berhak atas sub-modul yang diminta |

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

## Penjamin: tiga kategori, penerbitnya tabel

`penjamin` tetap TIGA nilai (`umum`, `bpjs`, `asuransi`). Allianz, Prudential,
Mandiri Inhealth dan seterusnya **tidak** jadi nilai `penjamin` baru: tiap
klinik punya rekanan berbeda dan daftarnya berubah tiap kontrak diperbarui.
Kalau jadi nilai status, tiap klinik yang menambah rekanan harus menunggu
migrasi baru. Jadi penerbitnya tabel `insurers` per faskes, dan
`visits.asuransi_id` menunjuk ke sana.

Itu juga menghindari pemeriksaan yang sudah empat kali menggigit di project
ini: yang tidak jadi nilai status tidak memaksa memeriksa tiap tempat yang
menyebut nilai lama.

`visits.nomor_penjamin` disimpan terpisah dari `patients.nomor_penjamin`:
nomor polis bisa berganti di tengah tahun, dan yang dipakai menagih adalah
nomor yang berlaku SAAT kunjungan itu.

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

**Yang ditagihkan ke penjamin BUKAN uang yang diterima.** `transactions` punya
`diterima_tunai` dan `ditagihkan_penjamin`, dijaga constraint supaya jumlah
keduanya selalu sama dengan `total`. Kalau piutang BPJS ikut terhitung sebagai
uang masuk, laci kasir tidak akan pernah cocok saat tutup buku, dan selisihnya
baru ketahuan berminggu-minggu kemudian. `laporan_penjamin()` membaca dua kolom
itu, jadi pemilik melihat berapa yang benar-benar diterima dan berapa yang
masih ditagihkan, per penjamin.

Yang menutup transaksi tetap KASIR, termasuk untuk pasien BPJS dan asuransi.
Kasir menekan Proses dengan bayar nol dan seluruhnya ditagihkan. Itu keputusan
pemilik: satu pintu keluar berarti satu tempat yang harus benar, dan seluruh
kunjungan muncul di laporan dengan penjaminnya.

## Daftar antrean: yang sudah tutup ke bawah, bukan dibuang

Urutan waktu daftar itu benar sebagai catatan dan salah sebagai alat kerja.
Pukul sebelas di klinik yang sibuk, separuh daftar sudah selesai dan yang
berikutnya harus dipanggil terselip di antaranya, jadi mata mencari tiap kali.
Yang menentukan pekerjaan berikutnya adalah yang BELUM tutup.

Digeser ke bawah dengan pemisah, **tidak disembunyikan**: kunjungan yang sudah
selesai masih dibuka untuk menambah adendum rekam medis, mencetak ulang, dan
memeriksa tagihan. Di dalam masing-masing kelompok urutannya tetap urutan
datang. Berlaku untuk layar antrean mana pun yang ditambahkan nanti; Farmasi
sudah mengelompokkan per keadaan, dan Reservasi sudah menaruh yang menunggu di
atas.

Angka di ringkasan atas harus bisa dijumlahkan dengan yang terlihat di daftar.
`batal` disebut terpisah, bukan dilebur ke "selesai": dua angka yang tidak
menjelaskan enam baris membuat orang berhenti percaya pada dua-duanya.

## Reservasi: janji datang, bukan rekam medis

Modul baru di migrasi 0054, berdiri di atas poli dan dokter dari 0020. Tiga
keputusan bentuk yang perlu dibaca sebelum menyentuhnya lagi.

**Yang memesan BOLEH belum jadi pasien.** `reservations.patient_id` nullable,
`nama` wajib. Yang menelepon sore ini untuk besok pagi belum tentu pernah
datang, dan memaksa nomor RM lebih dulu berarti klinik mengumpulkan rekam
medis untuk orang yang mungkin tidak jadi datang. Pencocokan ke pasien terjadi
saat orangnya tiba, lewat `hadirkan_reservasi(p_id, p_patient)`.

**Jadwal praktik berbentuk SESI, bukan slot janji per lima belas menit.**
Klinik pratama tidak bekerja begitu: pasien datang di rentang jam praktik dan
dilayani berurutan. Memaksa jam pasti berarti membuat janji yang tidak pernah
ditepati, dan yang datang tepat waktu tetap menunggu di belakang tiga orang.
Yang bisa dijanjikan adalah sesi dan urutan di dalamnya.

**Kuota ditegakkan database, dengan mengunci baris jadwalnya lebih dulu**
(`select ... for update` pada `doctor_schedules`, bukan pada hitungan
reservasinya). Dua petugas yang menekan Simpan bersamaan berbaris di kunci yang
sama, jadi yang kedua menghitung SESUDAH yang pertama menyimpan. Tanpa itu
keduanya membaca "sisa 1" dan keduanya berhasil. Kuota `0` berarti TANPA BATAS,
bukan tertutup, pola yang sama dengan `lib/plan.ts`.

`hadirkan_reservasi()` melahirkan kunjungan lewat `daftar_kunjungan()`, bukan
dengan menulis ke `visits` sendiri. Nomor antrean, biaya administrasi, dan
riwayat keadaan semuanya menempel pada jalur itu, dan jalur kedua ke tabel yang
sama berarti dua tempat yang harus benar. Ujinya memeriksa nomor antrean dan
`visit_charges` justru untuk membuktikan jalurnya masih yang itu.

Reservasi kemarin yang tidak pernah hadir dihanguskan saat layarnya dibuka
(`hanguskan_reservasi_lewat`), bukan lewat penjadwal: project ini belum punya
penjadwal, dan yang menggantung di keadaan `menunggu` selamanya membuat
hitungan hari berikutnya salah.

## Dialog harus dirender ke `document.body`

`position: fixed` diukur dari viewport, KECUALI kalau ada leluhur yang memasang
`transform`, `filter`, atau `backdrop-filter`. Yang begitu jadi containing block
baru, dan `fixed inset-0` mendadak berarti "sebesar kartu itu", bukan "sebesar
layar".

Kartu di halaman Pengaturan memakai `backdrop-blur-sm`, jadi tiap dialog di
dalamnya ikut tergeser mengikuti gulungan halaman: bagian atasnya, tempat
tombol tutup dan kotak pertama berada, bisa berada di luar layar tergantung
posisi gulungan saat dibuka. Tidak ada yang gagal, tidak ada galat, dan
`npm run build` lolos. Ketahuannya cuma dengan membuka dialognya sungguhan.

`components/Portal.tsx` menyelesaikannya. **Dialog baru di dalam kartu mana pun
harus dibungkus `<Portal>`**, bukan mengandalkan `fixed` saja.

## Layar ruang tunggu: tanpa login, dan itu keputusan keamanan

`/antrean?t=<token>` dibuka di televisi ruang tunggu. **Tidak memakai sesi
staf, dan tidak boleh:** sesi yang hidup di ruangan publik adalah sesi milik
semua orang yang lewat, dan satu tekan tombol Beranda membuka rekam medis
seluruh klinik. Token disimpan di `settings.token_antrean`, boleh diputar dari
Pengaturan > Poli & Dokter, dan hanya membuka `layar_antrean()`.

**Nama pasien disamarkan DI DATABASE**, bukan di peramban. Kalau penyamarannya
di layar, nama lengkapnya tetap melewati jaringan dan tetap ada di dalam
televisi itu. Bawaannya "Nyoman R."; `settings.antrean_nama_penuh` membuka
nama penuh kalau kliniknya memang memanggil begitu.

**Menambah kolom ke `layar_antrean()` berarti menambahkannya ke papan
pengumuman ruang tunggu.** Ujinya menolak `nomor_rm`, `nik`, `keluhan`,
`diagnosis`, `telepon`, dan `alergi` secara eksplisit.

Penyamarannya lewat `samarkan_nama()`, dan ia **mengerti penanda nama**: kata
pertama yang tiga huruf atau kurang (I, Ni, Ida, Sri) dianggap penanda, jadi
kata kedua ikut utuh. Versi pertama menghasilkan "I W." untuk I Wayan Sudiarta
dan itu tidak memanggil siapa pun di ruang tunggu yang isinya belasan orang
bernama I dan Ni. Ujinya lulus waktu itu karena nama contohnya kebetulan
"Nyoman Rai Sudiartha".

**Jangan memakai pgcrypto di fungsi ber-`search_path` terkunci.** Supabase
memasang pgcrypto di skema `extensions`, sedangkan fungsi `security definer`
mengunci `search_path = public, pg_temp` (dan memang harus). `gen_random_bytes`
jadi 42883 di aplikasi sementara berkas uji lulus, karena blok `do $$` di SQL
Editor berjalan dengan search_path yang lebih luas. `gen_random_uuid()` ada di
inti PostgreSQL dan selalu terlihat.

Suaranya dibangkitkan `speechSynthesis` peramban, bukan berkas rekaman, jadi
nomor apa pun bisa diucapkan tanpa menyiapkan ratusan potongan audio. Muatan
PERTAMA sengaja tidak diucapkan: televisi yang menyala jam sepuluh tidak boleh
membacakan seluruh pagi itu.

**Peramban MELARANG suara sebelum ada interaksi manusia di tab itu**, dan layar
ruang tunggu justru dibuka lalu ditinggal. Jadi ada tombol "Aktifkan suara"
yang ditekan sekali saat televisinya dipasang, beserta penanda apakah suaranya
sudah hidup. Tanpa itu tidak akan pernah bunyi, sepintar apa pun kodenya.

**Yang sudah dipanggil tidak saling menghapus.** Versi pertama cuma menampilkan
SATU yang terakhir dipanggil, jadi di klinik empat poli panggilan Gigi
menghapus panggilan Umum sebelum orangnya sempat berdiri. Sekarang yang
terbaru besar di tengah dan sisanya tetap terbaca di "Sedang dipanggil".

Daftar status yang tampil ditulis sebagai yang **MASUK** (`terdaftar`, `obat`),
bukan sebagai yang keluar. Kalau ditulis "not in (selesai, batal)", keadaan
baru mana pun akan otomatis muncul di papan pengumuman ruang tunggu tanpa ada
yang memutuskannya.

**Kasir tidak boleh menagih selama masih ada permintaan terbuka yang belum
diisi farmasi** (`obat_belum_dipilih`). Bukan soal urutan sopan: baris
permintaan terbuka BELUM PUNYA HARGA sampai farmasi memilih produknya, jadi
kasir yang menagih lebih dulu menagih KURANG.

## Rel kunjungan: EMPAT keadaan, dan yang menutupnya bukan dokter

**terdaftar → diperiksa → obat → selesai.** Keadaan `resep` DIBUANG di migrasi
0049: sejak 0035 resep punya rel keadaannya sendiri yang dipegang layar
Farmasi, jadi `resep` di rel kunjungan cuma satu klik kosong.

- **terdaftar** didaftarkan, boleh dipanggil berkali-kali, tetap di papan
- **diperiksa** ditekan "Tiba" saat orangnya benar-benar datang
- **obat** bergeser SENDIRI begitu dokter memfinalkan resep
- **selesai** ditutup KASIR (kalau tanpa resep) atau FARMASI saat menyerahkan

**Semua kunjungan ditutup lewat kasir, termasuk BPJS dan asuransi.** Usul
pemilik, dan lebih baik daripada usul saya: kunjungan bertagihan NOL (kapitasi
BPJS, konsultasi gratis) tidak akan pernah dibayar, jadi kalau penutupannya
menunggu pembayaran ia menggantung selamanya. Dengan semuanya lewat kasir,
satu jalur menutup semua keadaan dan laporan per penjamin keluar sendiri.

**`supabase/uji/0049_satu_pasien_utuh.sql` adalah uji yang paling penting di
folder ini.** Ia menjalankan SATU kunjungan melintasi seluruh modul:
pendaftaran, panggil, tiba, diagnosis, tindakan, resep, penyiapan farmasi,
kasir, penyerahan. Sejak migrasi 0052 langkah kasirnya lewat
`apply_transaction` yang sebenarnya, bukan insert langsung ke `transactions`:
sebelum itu satu-satunya langkah yang menyentuh UANG dan STOK justru
satu-satunya yang dilompati, karena gerbangnya membaca JWT yang tidak ada di
SQL Editor. Keranjangnya dibangun dari `tagihan_kunjungan()` seperti yang
dilakukan layar Kasir, bukan diketik ulang, supaya uji ini ikut gagal pada
hari tagihannya berhenti membawa obat. Uji per migrasi tidak menggantikannya: bug obat-hilang-di-
kasir lolos dari SELURUH uji lain karena tidak ada yang menyeberangi modul.
**Tiap perubahan yang menyentuh kunjungan harus lulus di sini.**

**Menambah argumen berdefault ke fungsi yang sudah ada MELAHIRKAN fungsi
kedua, bukan mengganti yang lama.** Migrasi 0048 melakukannya dan panggilan
enam argumen jadi ambigu (42725). Yang lebih buruk dari galatnya: kalau versi
lama yang terpilih di suatu jalur, argumen barunya diam-diam tidak tersimpan.
Selalu `drop function` versi lamanya, seperti 0022 dan 0050.

## Rel kunjungan: digeser sendiri, bukan diklik

Keadaan `resep` dan `obat` menjawab "di mana pasiennya sekarang", dan itulah
seluruh alasan rel ini ada. Yang dibuang di migrasi 0040 bukan keadaannya,
melainkan **keharusan menggesernya dengan tangan**:

- Resep difinalkan dokter -> kunjungan pindah ke `resep` sendiri.
- Farmasi menekan Mulai siapkan -> kunjungan pindah ke `obat` sendiri.
- Kunjungan TANPA resep boleh melompat langsung ke `selesai`.

Lewat TRIGGER pada `prescriptions`, bukan dari dalam fungsi farmasinya,
alasannya sama seperti pencatat riwayat keadaan di 0018 dan biaya administrasi
di 0024. Triggernya hanya MAJU dan hanya satu langkah: kunjungan yang sudah
lebih jauh dibiarkan, karena orang di depan pasien tahu lebih banyak.

Melompati `diperiksa` tetap dilarang, dan kunjungan yang PUNYA resep tetap
tidak boleh melompati tahap obat.

**Satu pasien tidak boleh punya dua kunjungan terbuka di hari yang sama**
(`uq_visits_terbuka`). Uji apa pun yang membuat beberapa kunjungan harus
memakai pasien berbeda.

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

### Permintaan terbuka: dokter meminta, farmasi memilih

Dokter boleh menulis baris tanpa memilih produk ("antihistamin oral, 10
tablet") dan menandainya `permintaan_terbuka`. Farmasi mengisinya lewat
`isi_permintaan_farmasi()`. Kata-kata dokter pindah ke `permintaan_asli` dan
**tidak pernah ditimpa**, jadi rekamnya selalu terbaca "dokter meminta X,
farmasi mengisi Y, oleh siapa, jam berapa". Pola yang sama dengan adendum.

**Farmasi TIDAK BISA menambah baris obat yang tidak ditulis dokter, dan tidak
bisa mengganti baris yang produknya sudah dipilih dokter.** Itu bukan batas
kenyamanan: yang tercatat sebagai peresep harus tetap dokter. Kalau obatnya
habis, jalannya menghubungi dokternya, bukan mengganti diam-diam. Ditegakkan
`isi_permintaan_farmasi()`, bukan disembunyikan di layar.

Bedakan dari **luar katalog** (`product_id` null tanpa penanda): itu artinya
obatnya memang tidak ada di sini dan pasien menebusnya di tempat lain.

`serahkan_resep()` MENUNTUT pembayaran sudah tercatat, tapi tidak memalang
mati: `p_tanpa_bayar` membukanya dengan syarat alasannya ditulis, dan alasan
itu masuk jejak audit beserta kolom `serah_tanpa_bayar`. Palang yang tidak
bisa dilewati akan diakali dengan cara yang tidak meninggalkan jejak sama
sekali, yaitu menekan tombol bayar padahal belum dibayar.

`dilayani` sengaja tidak diganti nama jadi `diserahkan`: baris lama memakai
nilai itu. **Baris `dilayani` sebelum migrasi 0035 `dilayani_pada`-nya adalah
waktu BAYAR, bukan waktu serah.** Tidak bisa diperbaiki surut.

**Menambah nilai status berarti memeriksa tiap tempat yang menyebut nilai
lama.** Pola ini sudah menggigit EMPAT kali: migrasi 0036 (`resep_kunjungan`),
0042 (`v_antrean_hari_ini`), dan 0045 (`tagihan_kunjungan`, yang membuat obat
hilang dari kasir dan baru ketahuan saat pemilik menjalankan satu pasien dari
pendaftaran sampai bayar). Yang keempat lolos dari SEMUA uji karena tidak ada
satu pun uji yang menjalankan satu kunjungan utuh melintasi modul. **Uji per
migrasi tidak menggantikan satu uji yang menjalankan satu pasien dari
pendaftaran sampai selesai.** Migrasi 0036 lahir persis karena itu terlewat: `resep_kunjungan()`
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
| 2 | Hak akses per sub-modul kunjungan | **selesai** (migrasi 0039) |
| 3 | Layar antrean ruang tunggu + panggilan suara | **selesai** (migrasi 0041..0044) |
| 4 | ICD-10 resmi dan ICD-9-CM untuk tindakan | **selesai** (migrasi 0025..0029) |
| 5 | Reservasi | **selesai** (migrasi 0054) |
| 6 | Kirim ke SatuSehat dan BPJS | prasyaratnya **selesai** (0055, 0056); pengirimannya tertahan kredensial |

### Hak akses per sub-modul: SELESAI (migrasi 0039)

Sebelumnya hak akses cuma menyaring MENU lewat `ROLE_PAGES`. Yang menahan cuma
tombolnya, jadi petugas pendaftaran yang mengetik alamatnya, atau memanggil
`rekam_medis()` lewat kunci anon yang memang ada di dalam peramban, membaca
SOAP dan diagnosis siapa pun di kliniknya.

Sekarang penjaganya di database: `wajib_boleh()` dipanggil di dalam sepuluh
fungsi medis, dan matriksnya ada di SATU tempat (`boleh()`), bukan disebar
sebagai `if peran = ...` yang akan ketinggalan saat peran berikutnya lahir.

`lib/hak.ts` adalah SALINAN matriks itu untuk menyembunyikan tombol.
**Urutannya tidak boleh dibalik**: kalau berkas itu yang jadi penjaga, alamat
fungsinya tetap bisa dipanggil langsung. Lupa menyamakan keduanya hanya
membuat tombol muncul lalu ditolak, atau hilang padahal boleh; dua-duanya
tidak membuka data, dan itu memang urutan yang diinginkan.

`pemilik` dan `admin` sengaja mendapat semuanya. Mengunci pemilik dari datanya
sendiri akan membuat klinik berhenti bekerja hari pertama, dan yang terjadi
berikutnya adalah semua orang dibuatkan akun pemilik.

Bentuk yang berlaku sekarang:

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

## Kredensial sistem nasional: Vault, dan tabel tanpa policy

Migrasi 0055. Kredensial SatuSehat dan BPJS diberikan **per faskes**, jadi
menyimpannya polos di `settings` berarti satu kebocoran RLS, satu ekspor CSV
yang salah kolom, atau satu backup yang tercecer membocorkan kunci SEMUA klinik
sekaligus, dan kunci itu membuka data pasien di sistem nasional.

- **Rahasianya di Supabase Vault** (`vault.create_secret` / `vault.update_secret`,
  ekstensi `supabase_vault` 0.3.1, sudah terpasang). Yang tersimpan di
  `faskes_credentials` cuma `secret_id`. Kuncinya di luar tabel, jadi `pg_dump`
  cuma menghasilkan sandi. Enkripsi yang kuncinya ikut tersimpan di sebelahnya
  bukan enkripsi.
- **`faskes_credentials` sengaja TIDAK punya policy sama sekali**, jadi
  PostgREST tidak bisa membacanya untuk siapa pun. Alasannya aturan lama
  project ini: RLS menyaring BARIS, bukan KOLOM. Policy apa pun yang
  mengizinkan pemilik melihat daftar kredensialnya otomatis mengizinkan ia
  membaca `secret_id`. Jalan masuknya cuma tiga fungsi, masing-masing memberi
  persis satu hal.
- **`ambil_kredensial()` dicabut dari `authenticated`.** Ia satu-satunya yang
  mengembalikan rahasianya. Kunci anon ada di dalam peramban tiap pengguna;
  kalau fungsi ini terbuka, Vault berhenti berarti apa pun.
- **Tidak ada jalan membaca balik dari layar, dan itu disengaja.** Yang bisa
  dibaca balik akan dibaca balik, dan yang tampil di layar akan difoto. Kalau
  kredensialnya hilang, jalannya mengambil yang baru dari portalnya.
- Nama secret di Vault deterministik (`sehatera:<company>:<sistem>:<lingkungan>`)
  supaya pemasangan ulang MENGGANTI, bukan menumpuk penunjuk yang tidak ada lagi
  yang tahu masih dipakai atau tidak.

**Panggil fungsi Vault dengan nama skema di depan.** `security definer` di sini
mengunci `search_path = public, pg_temp`, jadi apa pun di luar itu tidak
terlihat kalau tidak disebut skemanya. Ini persis kesalahan migrasi 0043.

## Antrean kirim: idempoten, dan menyerah itu keadaan

Migrasi 0056, bentuknya mengikuti `webhook_events` dari 0013.

**Antrean, bukan kirim langsung saat kejadiannya.** Kalau HTTP-nya dipanggil
saat kunjungan ditutup, dokter yang menekan Selesai ikut menunggu jaringan
Kemenkes, dan kalau gagal, kunjungan itu tidak pernah terkirim tanpa ada yang
tahu.

- **Kunci idempoten dibuat PEMANGGIL**, bukan database. Kunjungan yang ditutup,
  dibuka lagi, lalu ditutup lagi harus tetap satu kiriman.
- **Payload disimpan sebagai cuplikan**, bukan dibangun ulang saat kirim. Kalau
  dibangun ulang, perbaikan kode bulan depan diam-diam mengubah isi kiriman
  yang sudah antre minggu lalu. Alasan yang sama dengan
  `transaction_item_batches` di 0009.
- **TIGA keadaan: `antre`, `terkirim`, `ditinggalkan`.** Yang gagal kembali ke
  `antre` dengan jeda berlipat, dan `percobaan > 0` yang membedakannya dari yang
  belum pernah dicoba. Keadaan "gagal" yang toh akan dicoba lagi cuma membuat
  orang mengira ia berhenti.
- **`percobaan` dinaikkan saat DIAMBIL, bukan saat gagal.** Pengirim yang mati
  di tengah tidak sempat melapor, dan baris yang selalu membunuh pengirimnya
  akan dicoba selamanya kalau hitungannya menunggu laporan.
- Policy-nya cuma SELECT. Kalau INSERT/UPDATE ikut terbuka, siapa pun yang tahu
  alamatnya bisa menandai kirimannya sendiri "terkirim".

**Yang sengaja BELUM ada: pemanggil yang mengisi antreannya.** Bentuk payload
FHIR harus dicocokkan ke dokumen resmi yang berlaku saat kredensialnya ada.
Mengisi antrean dengan payload yang belum diverifikasi cuma menumpuk ribuan
baris yang harus dibuang ulang, dan lebih buruk: membuat orang mengira
pengirimannya sudah jalan. Layarnya mengatakan ini apa adanya.

**`found` menjawab pernyataan TERAKHIR.** Migrasi 0057 lahir karena penanda
`baru` di `antre_kirim` dihitung dari isi barisnya (`percobaan = 0 and status =
'antre'`), yang juga benar untuk baris yang sudah ada. Jawabannya ada di `found`
sesudah `INSERT ... ON CONFLICT DO NOTHING`, tapi ia harus ditangkap ke variabel
sebelum SELECT berikutnya menimpanya. Ditemukan uji, bukan saat membacanya.

## Tarif penunjang: paket punya CETAKAN parameternya

Migrasi 0063. Layanan yang berjenis `lab` atau `radiologi` muncul sebagai
pilihan saat dokter meminta pemeriksaan; sisanya tidak. Daftar yang berisi hal
yang salah lebih lambat dipakai daripada daftar yang kosong.

**Paket lab menyimpan cetakan parameternya** (`service_lab_params`): nama,
LOINC, satuan, dan rentang rujukan, diisi sekali lalu dituangkan ke formulir
hasil. Tanpa itu, darah lengkap berarti sepuluh baris diketik ulang untuk tiap
pasien, dan yang lebih buruk: rentang rujukan yang diketik ulang berbeda-beda
tergantung siapa yang jaga, sehingga penanda "tinggi" dan "rendah" berhenti
berarti apa pun.

**Cetakannya disimpan sebagai CUPLIKAN di `visit_penunjang.cetakan`**, bukan
dibaca ulang dari katalog saat hasilnya diisi. Alasannya sama dengan payload
antrean kirim di 0056: paket yang diubah bulan depan tidak boleh mengubah
bentuk pemeriksaan yang sudah diminta minggu lalu.

Rentang rujukan tetap bisa diubah per hasil: rentang bayi berbeda dari dewasa,
dan hemoglobin perempuan berbeda dari laki-laki. Cetakan adalah titik mulai,
bukan palang.

## Layar kunjungan: kartu tindakan yang membawa keadaannya

Lima tombol seragam berbentuk pil tidak memberi tahu mana yang paling sering
dipakai maupun mana yang sudah dikerjakan, jadi dokter harus MEMBUKA rekam
medis untuk tahu apakah diagnosisnya sudah ditegakkan, dan membuka resep untuk
tahu apakah resepnya masih draf: dua klik untuk pertanyaan yang jawabannya muat
di satu baris.

Sekarang tiap tindakan berbentuk kartu dengan baris kedua berisi keadaannya
("2 diagnosis tercatat", "Masih draf, belum sampai ke farmasi", "Rp 70.000"),
tanda hijau kalau sudah selesai, dan warna amber kalau ada yang menggantung.
Rekam medis dibuat lebih menonjol karena itu pintu utama dokter.

## Multi outlet: tiap outlet tetap faskes tersendiri

Migrasi 0062. `plans.max_outlets` sudah ada sejak 0001 dan halaman harga sudah
menjual "Cabang", tapi outletnya sendiri tidak pernah ada, dan
`company_usage(..., 'outlets')` bahkan tidak menghitung apa pun.

**Tiap outlet tetap satu baris `companies`.** Bukan jalan pintas: tiap cabang
apotek punya SIA dan apoteker penanggung jawabnya sendiri, stoknya sendiri, dan
SIPNAP-nya dilaporkan per outlet. Menyatukan stok beberapa outlet di satu badan
usaha justru membuat laporan wajibnya salah.

Yang ditambahkan cuma tiga, dan tidak satu pun menyentuh stok atau RLS:
`company_groups`, `outlet_aktif` (penunjuk outlet yang sedang dibuka), dan
`auth_company_id()` yang menghormatinya. **Seluruh fungsi lain tidak diubah**,
dan itu seluruh alasan bentuk ini dipilih: ratusan tempat memanggil
`auth_company_id()`, jadi berpindah outlet cukup mengubah jawaban SATU fungsi.

- **`outlet_aktif` sengaja TIDAK punya policy.** Satu-satunya jalan masuk
  `pilih_outlet()`, yang memeriksa keanggotaan. Kalau bisa ditulis langsung,
  menunjuk ke outlet orang lain membuat SELURUH RLS aplikasi ikut penunjuk itu.
- **`auth_company_id()` juga memeriksa keanggotaan saat membaca penunjuk.**
  Dua lapis, karena yang satu lapis sudah cukup untuk membuka semuanya.
- Penunjuknya **per pengguna, bukan per tab**. Dua tab untuk dua outlet akan
  mengikuti pilihan terakhir. Disengaja: menyimpannya per tab berarti mengirim
  outlet aktif pada tiap permintaan, dan permintaan yang lupa membawanya akan
  menulis ke outlet yang salah.
- Outlet baru **mewarisi paket dan masa aktif**, tidak membuat langganan kedua.

**Sekalian membetulkan bug lama:** `auth_company_id()` dulu memakai `limit 1`
TANPA `order by`. Untuk siapa pun yang terdaftar di dua fasilitas, PostgreSQL
boleh mengembalikan yang mana saja dan boleh berbeda antar permintaan: data
tersimpan ke outlet yang salah tanpa pernah muncul sebagai galat.

## Tidak ada `alert`, `confirm`, atau `prompt` di aplikasi ini

Semuanya lewat `components/Umpan.tsx`: `kabar()`, `konfirmasi()`, `tanya()`.
Dulu ada 139 kotak bawaan peramban, dan empat hal salah dengannya. Tampilannya
milik sistem operasi, bukan milik aplikasi: kotak abu-abu bertuliskan
"localhost says" adalah satu-satunya bagian yang membuat orang berhenti
mengira ini perangkat lunak yang dibeli. Ia MEMBEKUKAN seluruh peramban, jadi
kasir yang mendapat kotak galat tidak bisa menggulung struk di belakangnya
untuk memeriksa apa yang salah. Tombolnya selalu "OK" walau yang akan terjadi
adalah menghapus data. Dan karena tiap kejadian menuntut satu klik, orang
menekan OK tanpa membaca, lalu kejadian berikutnya yang penting ikut ditekan
OK juga.

- `kabar(teks, 'galat' | 'ok' | 'info')` menumpuk di pojok dan hilang sendiri.
  Yang berupa galat bertahan lebih lama karena kalimat penolakan di aplikasi
  ini panjang: ia menyebutkan apa yang harus dilakukan orangnya.
- `konfirmasi({ judul, pesan, tombol, bahaya })` untuk ya/tidak. **Tombolnya
  menyebut tindakannya** ("Hapus", "Batalkan PO") dan merah kalau merusak.
- `tanya({ judul, label, wajib })` untuk satu baris jawaban, misalnya alasan
  pembatalan.

Ketiganya mengembalikan Promise, jadi bentuk pemanggilnya sama seperti yang
digantikan: `if (!await konfirmasi({...})) return`.

**Jangan menambahkan `alert`/`confirm`/`prompt` baru.** Selain alasan di atas,
kotak bawaan peramban juga membekukan automasi peramban, dan itu sudah dua kali
menghentikan sesi kerja di tengah jalan.

## Rujukan internal: SATU kunjungan yang berpindah poli

Migrasi 0060. Pasien yang diperiksa dokter umum lalu dirujuk ke spesialis di
klinik yang sama, dalam satu hari.

**Bukan dua kunjungan.** Tiga alasan: pasiennya membayar SEKALI di ujung, dan
dua kunjungan berarti dua tagihan serta dua kali antre di kasir untuk satu
kedatangan; `uq_visits_terbuka` menahan dua kunjungan terbuka per pasien per
hari dan melubanginya untuk rujukan berarti melubanginya untuk salah ketik
juga; dan aturan "satu tagihan per kunjungan" dari 0024 tetap utuh.

Yang berubah: hal yang selama ini SATU per kunjungan jadi satu per POLI.

- **`visit_notes` unik per (kunjungan, poli)**, bukan per kunjungan. Kalau
  tidak, dokter spesialis menimpa tulisan dokter yang merujuk, dan yang hilang
  justru alasan pasien itu dikirim kepadanya. `rekam_medis()` mengembalikan
  `soap` (poli yang sedang memeriksa) dan `soap_lain` (poli sebelumnya).
- **Tarif konsultasi unik per (kunjungan, jenis, poli).** Mundur-maju di rel
  pada poli yang sama tetap sekali, yang justru alasan indeks itu ada sejak
  0024. Biaya administrasi TETAP sekali per kunjungan.
- Merujuk menerbitkan **nomor antrean baru** untuk poli tujuan dan
  mengembalikan kunjungan ke `terdaftar`: pasiennya memang menunggu lagi.
  Penanda panggilan dinolkan, kalau tidak papan menganggapnya sudah dipanggil
  di poli yang baru.

**`on conflict (visit_id)` di `simpan_rekam_medis` WAJIB ikut diperbarui di
migrasi yang sama.** Ia menunjuk indeks unik yang dibuang; kalau tertinggal,
menyimpan rekam medis gagal untuk SEMUA kunjungan, bukan cuma yang dirujuk.

Diagnosis sengaja tidak dipecah per poli: satu kunjungan tetap satu diagnosis
primer, dan itu yang dituntut BPJS dan SatuSehat.

## Penunjang: lab berkolom, radiologi naratif

Migrasi 0061.

- **Hasil lab adalah BARIS BERKOLOM berkode LOINC**, aturan yang sama dengan
  tanda vital di 0018. "Hb 11,2" di kotak bebas tidak bisa dipetakan ke
  Observation tanpa menebak, tidak bisa dibandingkan dengan hasil bulan lalu,
  dan tidak bisa ditandai di luar rentang oleh siapa pun kecuali mata manusia.
- **Radiologi TIDAK dipaksa berkolom.** Bacaannya memang naratif: temuan dan
  kesan. Memaksanya jadi angka membuat orang mengisi kolom yang tidak ada
  isinya.
- **Permintaan menagih sendiri lewat katalog Layanan.** Yang di luar katalog
  tetap boleh diminta tapi tidak menagih, dan itu dikatakan di layar.
  Dibatalkan berarti biayanya ikut dicabut: pemeriksaan yang tidak jadi
  dikerjakan tidak boleh ditagihkan. Yang sudah selesai tidak bisa dibatalkan.
- **`penunjang.minta` dan `penunjang.hasil` sengaja beda peran.** Hasil yang
  diisi oleh yang memintanya bukan hasil pemeriksaan. Peran baru `analis`
  lahir untuk ini, dan ia hanya diberi Beranda dan Lab & Radiologi.
- `cito` menentukan URUTAN antrean lab, bukan sekadar penanda. Kalau
  antreannya tetap menurut waktu, menandai cito cuma jadi hiasan.
- Penanda `kritis` berarti dokternya dikabari SEKARANG. Layar penunjang
  menyebutnya lebih dulu dan mewarnainya merah: trombosit 84.000 yang terselip
  di baris keenam dari sepuluh adalah cara paling mudah melewatkan pasien yang
  seharusnya dirujuk hari itu juga.

**Nilai `jenis` baru di `visit_charges` (`penunjang`)** berarti memeriksa tiap
tempat yang menyebut nilai lama: constraint, urutan di `tagihan_kunjungan`
(memakai `else`, aman), indeks unik administrasi/konsultasi (tidak menyentuh
nilai baru), dan pengelompokan keranjang di layar Kasir.

## Identitas pasien: wajib, tapi palangnya punya pintu

Migrasi 0059. NIK dan telepon WAJIB atas permintaan pemilik, ditegakkan di
`simpan_pasien()` bukan cuma di form: impor CSV menembak tabel langsung.

**Tapi ada `identitas_belum_lengkap` yang MENUNTUT alasan**, dan alasannya
masuk jejak audit. Pasien yang datang tidak sadarkan diri tidak memegang KTP,
dan petugas yang tidak bisa mendaftarkannya akan mengarang enam belas angka
supaya formulirnya mau lewat. NIK karangan lebih berbahaya daripada NIK kosong:
ia terlihat seperti data, ikut terkirim ke SatuSehat, dan menempel pada orang
lain. Pola yang sama dengan `p_tanpa_bayar` pada `serahkan_resep()` di 0035:
**palang yang tidak bisa dilewati akan diakali dengan cara yang tidak
meninggalkan jejak sama sekali.**

**`patients.penjamin` BUKAN sifat orangnya**, dan formulir pasien tidak lagi
menyuntingnya. Satu orang bisa memegang kartu BPJS sekaligus asuransi kantor,
dan yang menanggung kunjungan HARI INI ditentukan hari ini: pasien BPJS yang
rujukannya belum keluar datang sebagai pasien umum. Yang menempel pada orangnya
adalah NOMOR kartunya (`nomor_bpjs`, `nomor_polis`), dan layar pendaftaran
menampilkannya sebagai PETUNJUK, bukan sebagai pilihan otomatis. Kolom
`penjamin` dibiarkan sebagai bawaan; jangan menambah kode baru yang
memperlakukannya sebagai status pasien.

Alamat dipecah berkolom (`kelurahan`, `kecamatan`, `kota`, `provinsi`,
`kode_pos`, `rt`, `rw`) mengikuti aturan lama: SatuSehat mewajibkan `address`
berkolom, dan membelah alamat setahun yang terlanjur satu baris bebas tidak
bisa dilakukan tanpa menebak. `alamat` tetap ada sebagai baris jalannya.

## Membaca dan mengubah adalah dua tindakan

`DetailPasien` lahir karena satu-satunya cara melihat identitas pasien dulu
adalah menekan namanya, yang membuka formulir ubah. Artinya orang yang cuma
ingin memastikan nomor telepon berada satu ketikan dari mengubah tanggal lahir
orang tanpa sadar. Yang kosong ditampilkan sebagai "belum diisi", tidak
disembunyikan: baris yang hilang terbaca sebagai "tidak ada informasinya",
padahal yang dibutuhkan justru tahu ada yang belum dilengkapi.

**Tombol aksi berbentuk ikon memakai `components/TombolIkon.tsx`**, yang
membawa `title` bawaan peramban DAN gelembung sendiri. Keduanya perlu: `title`
untuk pembaca layar dan pengguna papan ketik, gelembung karena `title` baru
muncul sesudah satu detik lebih dan di layar sesibuk daftar pasien itu terlalu
lama untuk menolong siapa pun.

## Dua hal yang ditemukan saat memeriksa ulang, bukan dari galat

**Resep `draf` menahan kunjungan selamanya** (diperbaiki di 0058). Draf tidak
pernah masuk antrean farmasi, jadi tidak ada yang menyiapkannya, tapi ia
terhitung sebagai resep yang belum diserahkan sehingga kasir tidak boleh
menutup kunjungannya. Farmasi tidak melihatnya, kasir tidak boleh menutupnya,
dan sejak tombol maju dibuang dari layar Kunjungan tidak ada lagi jalan
memaksanya lewat. Layar resep sekarang punya tombol membatalkan draf; sebelum
ini "Batalkan Resep" hanya muncul untuk yang berstatus `final`.

**Pelanggaran indeks unik keluar sebagai "coba lagi sebentar lagi".**
`pesanError()` hanya meloloskan SH001..SH007 apa adanya, jadi 23505 jadi ajakan
mencoba lagi padahal mencoba lagi tidak akan pernah berhasil. `daftar_kunjungan`
sudah menangkapnya sejak 0022; `buat_reservasi` ditulis tanpa menirunya.
**Tiap fungsi yang bisa menabrak indeks unik karena tindakan wajar pengguna
harus menerjemahkannya sendiri jadi SH004.**

## Dua hal yang BELUM diperbaiki, dan alasannya

**`PlanFeatures.klinik` tidak menggerbangi apa pun.** `lib/plan.ts`
menghitungnya (`f.klinik === true`) dan `DaftarPaket` menampilkannya, tapi
`lockedModules()` hanya mengunci `faktur`. Artinya seluruh modul klinik: rekam
medis, e-resep, antrean, reservasi: terbuka untuk faskes mana pun yang
sektornya `klinik`, tanpa memandang paket. Belum berdampak karena paket Klinik
masih `is_public = false`, jadi belum ada yang bisa membelinya, tapi ini yang
menentukan pendapatan begitu dijual. Sengaja tidak saya kunci sepihak:
menyalakannya sekarang akan mengunci klinik contoh yang sedang dipakai
mencoba, dan cara menguncinya (menyembunyikan menu? menolak mendaftar sebagai
klinik?) itu keputusan pemilik.

**`settings.ihs_organization_id` dan `faskes_credentials.publik->>'organization_id'`
adalah dua tempat untuk satu fakta.** Yang benar tempatnya di kredensial:
sandbox dan produksi punya organization id yang BERBEDA, dan kolom tunggal di
`settings` tidak bisa menampung keduanya. Kolom lama dibiarkan sampai
pengirimannya benar-benar disambungkan, supaya tidak ada yang membacanya lalu
mengirim ke lingkungan yang salah. **Jangan menulis kode baru yang membacanya.**

## Yang belum ada

Pengiriman ke SatuSehat dan BPJS: bentuk datanya siap, tempat menyimpan
kredensialnya siap (0055), mesin antreannya siap (0056). Yang belum ada adalah
pembangun payload FHIR-nya dan kredensial faskesnya sendiri. Juga belum:
pemetaan obat ke kode KFA.

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
