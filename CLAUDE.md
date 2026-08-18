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

`supabase/seed.sql` mengisi paket & super admin. `supabase/seed_demo.sql`
mengisi satu apotek dengan data yang cukup untuk mencoba aplikasinya.

**Migrasi yang sudah dijalankan tidak boleh disunting.** Perbaikan selalu jadi
migrasi baru: file dan database harus tetap sama isinya, dan itulah seluruh
alasan folder ini ada.

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
`PengaturanPoli`. Semuanya dibuka DARI kunjungan, bukan dari menunya sendiri.

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

`lib/icd10.ts` berisi **saran cepat susunan Claude, BUKAN berkas resmi.** Harus
dicocokkan dengan daftar 144 diagnosis non-spesialistik BPJS sebelum dipakai
klaim.

**Verifikasi spesifikasi SatuSehat dan BPJS ke dokumentasi resmi yang berlaku
saat itu, jangan dari ingatan.** Versi FHIR, resource wajib, format tanda tangan
permintaan, dan syarat sertifikasi berubah cukup sering. Kredensial BPJS
diberikan per faskes, bukan per vendor: harus disimpan terenkripsi per tenant,
bukan polos di `settings`.

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
| 4 | ICD-10 resmi dan ICD-9-CM untuk tindakan | belum, sebagian menunggu berkas dari pemilik |
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
