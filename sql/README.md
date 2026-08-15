# Arsip — jangan dijalankan lagi

File `.sql` di folder ini adalah cara lama menyiapkan database: dijalankan
manual satu per satu di Supabase SQL Editor, tanpa urutan yang bisa diputar
ulang dari nol.

**Semuanya sudah digantikan oleh `supabase/migrations/`.** Menjalankan file di
folder ini di atas database yang sudah bermigrasi akan merusaknya — beberapa di
antaranya memasang policy `using (true)` pada `companies` dan `super_admins`,
yang justru lubang keamanan yang ditutup migrasi `0002`.

Folder ini dipertahankan hanya sebagai catatan sejarah: beberapa keputusan
bentuk tabel — batch obat, penomoran BA pemusnahan, kolom pasien untuk SIPNAP —
alasannya tertulis di sini dan tidak ada di tempat lain.

Yang harus dijalankan sekarang:

```bash
supabase db push     # menjalankan supabase/migrations/ berurut
psql "$DATABASE_URL" -f supabase/seed.sql   # paket langganan & super admin
```
