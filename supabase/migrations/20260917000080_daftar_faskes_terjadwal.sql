-- ============================================================
-- 0080  Penjadwal boleh tahu faskes MANA yang perlu dikirim
-- ============================================================
--
-- Sampai sekarang pengiriman ke SatuSehat dipicu tombol, dan tombol selalu
-- ditekan oleh seseorang yang sedang membuka satu faskes. Faskesnya sudah
-- diketahui dari sesinya, jadi tidak pernah ada yang perlu bertanya "faskes
-- mana saja yang perlu dikirim".
--
-- Penjadwal tidak punya sesi. Ia berjalan tanpa siapa pun, jadi ia harus
-- bertanya lebih dulu, dan pertanyaan itu belum pernah ada jawabannya.
--
--
-- ## Kenapa fungsi, bukan sekadar membaca tabelnya
--
-- `faskes_credentials` sengaja TIDAK punya policy sama sekali (migrasi 0055),
-- dan alasannya aturan lama project ini: RLS menyaring BARIS, bukan KOLOM.
-- Policy apa pun yang mengizinkan membaca daftarnya otomatis mengizinkan
-- membaca `secret_id` juga. Jalan masuknya cuma lewat fungsi, masing-masing
-- memberi persis satu hal, dan fungsi ini meneruskan aturan itu: ia
-- mengembalikan `company_id` saja. Tidak ada `secret_id`, tidak ada isi
-- `publik`, tidak ada nama kolom yang bisa dipakai menebak apa pun.
--
-- `service_role` memang bisa membaca tabelnya langsung karena ia melewati RLS.
-- Itu justru sebabnya ini ditulis sebagai fungsi: yang membaca tabel langsung
-- hari ini akan membaca kolom yang ditambahkan besok, dan kolom yang
-- ditambahkan ke tabel kredensial hampir selalu rahasia.
--
--
-- ## Hanya `produksi`, dan itu keputusan
--
-- Penjadwal TIDAK menyentuh kredensial `sandbox`. Sandbox adalah tempat orang
-- mencoba, dan yang dicoba harus dijalankan oleh orang yang sedang mencoba:
-- ia perlu melihat jawabannya, bukan menemukannya sudah terkirim entah kapan.
-- Faskes yang baru memasang sandbox tetap memakai kedua tombol seperti biasa.
--
-- Konsekuensinya disebut supaya tidak mengagetkan: **klinik contoh Rexco 88
-- yang cuma punya kredensial sandbox tidak akan pernah dikirimi penjadwal.**
-- Itu perilaku yang benar, bukan penjadwal yang rusak.

create or replace function public.faskes_kirim_terjadwal(
  p_sistem     text default 'satusehat',
  p_lingkungan text default 'produksi'
)
returns table (company_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select k.company_id
    from public.faskes_credentials k
    join public.companies c on c.id = k.company_id
   where k.sistem = p_sistem
     and k.lingkungan = p_lingkungan
     -- Kredensial yang barisnya ada tapi rahasianya belum dipasang tidak akan
     -- bisa mengambil token, jadi ia cuma akan memukul rate limit SatuSehat
     -- setiap penjadwal berjalan. Yang begitu tidak ikut didaftar.
     and k.secret_id is not null
     -- Faskes yang ditangguhkan berhenti mengirim. Langganan yang habis TIDAK
     -- menghentikannya: kewajiban pelaporan ke sistem nasional tidak ikut
     -- berhenti saat tagihan telat, aturan yang sama dengan SIPNAP.
     and coalesce(c.status, '') <> 'suspended'
   order by k.company_id
$$;

comment on function public.faskes_kirim_terjadwal(text, text) is
  'Daftar faskes yang boleh dikirim penjadwal. Mengembalikan company_id SAJA: tabel kredensial tidak pernah dibaca langsung, supaya kolom rahasia yang ditambahkan nanti tidak ikut terbawa.';

-- Dicabut dari `authenticated` dengan alasan yang sama seperti
-- `ambil_kredensial`: kunci anon ada di dalam peramban tiap pengguna, dan
-- daftar faskes mana yang sudah tersambung ke sistem nasional bukan sesuatu
-- yang perlu dijawab ke peramban siapa pun. Yang memanggilnya cuma jalur
-- server yang memegang service_role.
revoke all on function public.faskes_kirim_terjadwal(text, text) from public, anon, authenticated;
