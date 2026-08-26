/**
 * Service worker Sehatera.
 *
 * SATU ATURAN yang menentukan seluruh isi berkas ini: TIDAK ADA data pasien
 * yang boleh menginap di komputer klinik. Halaman aplikasi membawa nama, nomor
 * rekam medis, diagnosis, dan resep; komputer di ruang pendaftaran dipakai
 * bergantian oleh beberapa orang dan hampir tidak pernah dikunci. Cache yang
 * "membantu" dengan menyimpan halaman terakhir yang dibuka berarti rekam medis
 * pasien terakhir tersimpan di disk, bisa dibaca dari tab peramban mana pun,
 * dan tetap ada di sana sesudah orangnya keluar.
 *
 * Jadi yang disimpan cuma tiga hal, dan tidak satu pun berisi data:
 *
 *   1. berkas build ber-hash di `/_next/static/` (isinya tidak pernah berubah
 *      untuk satu alamat, jadi aman diambil dari cache lebih dulu),
 *   2. ikon aplikasi,
 *   3. satu halaman "tidak ada koneksi".
 *
 * Selebihnya lewat begitu saja ke jaringan. Permintaan ke Supabase dan
 * SatuSehat bahkan tidak disentuh sama sekali: beda asal, langsung dilewatkan.
 *
 * Ini juga berarti Sehatera BUKAN aplikasi luring. Ia terpasang seperti
 * aplikasi, tapi tetap menuntut koneksi. Menjanjikan yang sebaliknya pada
 * aplikasi kasir dan rekam medis jauh lebih berbahaya daripada tidak
 * menjanjikan apa-apa: transaksi yang tersimpan di peramban lalu tidak pernah
 * terkirim adalah stok yang salah dan uang yang hilang tanpa jejak.
 */

const CACHE = 'sehatera-v1'

// Yang dijamin ada sebelum koneksi hilang. Ikonnya ikut karena halaman luring
// menampilkannya, dan gambar yang gagal dimuat justru saat koneksi putus
// membuat halaman itu terlihat rusak alih-alih menjelaskan.
const CANGKANG = ['/luring', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CANGKANG))
      // Gagal mengisi cangkang tidak boleh menggagalkan pemasangan: yang
      // hilang cuma halaman luring, sedangkan aplikasinya sendiri tetap
      // berjalan penuh selama ada koneksi.
      .catch(() => {})
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Berkas build: nama berkasnya membawa hash isinya, jadi alamat yang sama
  // selamanya berarti isi yang sama. Cache dulu, jaringan cuma kalau belum
  // pernah diambil.
  if (url.pathname.startsWith('/_next/static/') || CANGKANG.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const salinan = res.clone()
          caches.open(CACHE).then((c) => c.put(req, salinan))
        }
        return res
      })),
    )
    return
  }

  // Perpindahan halaman: SELALU ke jaringan. Yang disimpan kalau jaringannya
  // mati bukan halaman yang diminta, melainkan halaman yang mengatakan
  // koneksinya putus.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/luring').then((hit) => hit || Response.error())),
    )
    return
  }

  // Sisanya: data. Tidak disentuh.
})
