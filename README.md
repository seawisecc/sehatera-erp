# Sehatera

Sistem manajemen apotek: kasir & resep, stok dengan batch dan tanggal
kadaluarsa, order terpandu ke pemasok, pembayaran faktur, tindak lanjut barang
kadaluarsa, dan laporan SIPNAP — dalam satu aplikasi, berlangganan per apotek.

Oleh Seawise Studio. Sekeluarga dengan [TokoKu](../tokoku-erp), yang dipakai
sebagai acuan pola untuk struktur multi-tenant dan sistem paketnya.

## Menjalankan

```bash
npm install
npm run dev
```

Butuh `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Database

Database dibangun **hanya** lewat `supabase/migrations/`, berurut:

| Migrasi | Isi |
| --- | --- |
| `0001_baseline_schema` | Seluruh tabel: platform (plans, companies, super_admins) dan apotek (produk, batch, transaksi, pembelian, faktur, SIPNAP) |
| `0002_rls_and_numbering` | Isolasi antar apotek, penomoran dokumen per apotek, dan penutupan lubang RLS pada `companies` & `super_admins` |
| `0003_plan_quotas_and_subscription` | Kuota paket ditegakkan lewat trigger, masa aktif langganan, masa coba sekali per akun |
| `0004_rpc` | `my_context()`, `register_apotek()`, `apply_transaction()` |
| `0005_guard_allows_admin_paths` | Gerbang kolom komersial melewatkan `service_role` dan koneksi database langsung |
| `0006_public_plans_read` | Paket bisa dibaca tanpa login, untuk halaman harga publik |

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql        # paket & super admin
psql "$DATABASE_URL" -f supabase/seed_demo.sql   # data demo, opsional
```

Migrasi ditulis agar aman dijalankan **di atas database yang sudah berisi
data** — `create table if not exists` lalu `add column if not exists` satu per
satu, bukan satu CREATE TABLE yang rapi. Alasannya di header migrasi 0001.

Migrasi yang sudah dijalankan tidak disunting; perbaikan jadi migrasi baru.
Itulah kenapa ada 0005 dan 0006.

`sql/` adalah arsip cara lama — jangan dijalankan (lihat `sql/README.md`).

### Data demo

`supabase/seed_demo.sql` mengisi satu apotek dengan data yang cukup untuk
benar-benar **mencoba** aplikasinya: ada batch yang sudah kadaluarsa dan yang
hampir, ada obat golongan narkotika/psikotropika/prekursor beserta transaksi
resepnya, dan ada faktur yang lewat jatuh tempo. Tanpa ketiganya, layar Tindak
Lanjut, laporan SIPNAP, dan pengingat faktur akan tampak "berfungsi" hanya
karena tidak ada yang perlu ditampilkan.

Skrip itu **tidak membuat akun login apa pun** — apotek disambungkan ke akun
yang sudah ada di `auth.users`.

## Paket langganan

Harga mengikuti TokoKu; kuota produk dinaikkan karena apotek terkecil pun
membawa ribuan item.

| Paket | Harga/bulan | Outlet | Pengguna | Item obat |
| --- | ---: | ---: | ---: | ---: |
| Starter | Rp 99.000 | 1 | 3 | 1.500 |
| Growth | Rp 249.000 | 5 | 15 | 8.000 |
| Enterprise | Rp 749.000 | ∞ | ∞ | ∞ |
| Klinik *(belum publik)* | Rp 1.490.000 | ∞ | ∞ | ∞ |

Masa coba 14 hari, sekali per email pendaftar.

**SIPNAP ada di semua paket, termasuk Starter.** Pelaporan narkotika dan
psikotropika adalah kewajiban hukum apotek, bukan fitur premium. Yang boleh
dikunci di paket atas hanya kemudahannya: rekap lintas cabang dan pengiriman
terjadwal.

Aturan pembacaan paket ada di satu tempat: `lib/plan.ts`. Kuota ditegakkan di
database (`enforce_plan_quota`, SQLSTATE `SH002`), bukan di layar — impor
katalog CSV menembak tabel `products` langsung, jadi gerbang yang hanya ada di
form akan dilewati begitu saja.

## Tema

Dua tema, bisa diganti di Pengaturan → Tampilan:

- **Sunrise Sorbet** (bawaan, terang) — `#c6ffdd` `#fbd786` `#f7797d`
- **Neon Pulse** (gelap) — `#8a2387` `#e94057` `#f27121`

Semua warna melewati token di `app/globals.css`. Menambah tema ketiga cukup
menambah satu blok `[data-theme="..."]`; tidak ada komponen yang perlu disentuh.

Ketiga warna tiap palet dipakai sebagai **gradien identitas**, bukan warna teks
— `#fbd786` di atas putih tidak terbaca siapa pun. Isi layar memakai netral
hangat yang diturunkan dari palet itu.
