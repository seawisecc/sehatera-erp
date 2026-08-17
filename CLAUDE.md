@AGENTS.md

# Sehatera

Sistem manajemen apotek berlangganan, multi-tenant. Oleh Seawise Studio.
Sekeluarga dengan **TokoKu** (`~/Desktop/tokoku-erp`), yang dipakai sebagai
acuan pola, bukan untuk disalin mentah.

Arahnya: apotek hari ini, klinik dan faskes berikutnya. Karena itu namanya
bukan "Apotek-" apa pun, dan skema datanya tidak mengunci diri ke apotek.

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

Empat tema, dipilih lewat `data-theme` di `<html>`: `sunrise-sorbet` (bawaan,
terang), `vital-tide` (terang, biru–hijau kesehatan), `neon-pulse` (gelap,
ramai), `midnight-sage` (gelap, tenang). Dua terang dua gelap, masing-masing
satu berani satu tenang: tema kelima sebaiknya mengisi kotak yang kosong.

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

`app/dashboard/page.tsx` masih satu file ~5.000 baris berisi seluruh aplikasi.
Itu diketahui dan belum dibereskan. Memecahnya berarti membagi ~90 `useState`
yang saling bergantung, dan tanpa tes otomatis salah pindah satu state akan
tampak normal sampai ada kasir yang kehilangan keranjangnya.

**Sampai itu dibereskan: jangan menambah state atau modul baru ke file itu.**
Yang baru ditaruh di `lib/` atau komponen tersendiri, seperti `lib/cetak.ts`,
`lib/plan.ts`, `lib/subscription.ts`, dan `lib/session.ts` yang sudah dipisah.

Bahasa: **antarmuka dan komentar dalam bahasa Indonesia.** Ada dwibahasa ID/EN
lewat `lib/i18n.tsx`: helper `t('teks id', 'english text')`. TokoKu tidak
punya ini; di sini dipertahankan.

## Yang belum ada

Undangan tim lewat tautan, impersonation berbanner, penulisan `audit_logs`
(tabelnya sudah ada), halaman harga publik, dan lapisan billing. Payment
gateway belum tersambung sama sekali: pergantian paket masih manual lewat
Super Admin, sama seperti TokoKu.

Paket **Klinik** sudah ada di database tapi `is_public = false`: harganya
(Rp 1.490.000/bln) masih usulan dan belum diketok pemilik. Jangan menampilkannya
di halaman harga sampai angkanya benar.

Untuk SatuSehat dan BPJS nanti: **verifikasi spesifikasinya ke dokumentasi
resmi yang berlaku saat itu, jangan dari ingatan.** Versi FHIR, resource yang
wajib, format tanda tangan permintaan, dan syarat sertifikasi berubah cukup
sering. Kredensial BPJS diberikan per faskes, bukan per vendor: harus
disimpan terenkripsi per tenant, bukan polos di `settings`.
