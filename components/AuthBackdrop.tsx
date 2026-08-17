/**
 * Latar halaman masuk.
 *
 * Menggantikan ilustrasi pemandangan (rumah sakit, ambulans, apotek, tanaman)
 * yang sebelumnya ada di sini. Ilustrasi itu bukan gagal digambar; ia gagal
 * pada tugasnya. Gambar bangunan dan kendaraan bergaya datar adalah bahasa
 * visual aplikasi konsumen, dan orang yang sedang menimbang apakah akan
 * menyerahkan data pasiennya membaca bahasa itu sebagai "mainan". Perangkat
 * lunak yang dipercaya memegang rekam medis justru hampir selalu memilih latar
 * yang nyaris tidak terlihat.
 *
 * Jadi yang tersisa di sini cuma cahaya: tiga bidang warna tema yang sangat
 * besar dan sangat kabur, satu kisi halus untuk memberi tekstur, dan satu
 * garis nadi setipis rambut. Tidak ada yang bisa dikenali sebagai gambar apa
 * pun; yang tertangkap mata cuma suasana.
 *
 * Semuanya tetap token tema, jadi ganti tema berarti seluruh latar ikut
 * berganti tanpa satu berkas gambar pun diunduh. Di jaringan klinik yang
 * lambat, layar pertama yang tidak menunggu apa-apa itu sendiri sudah pesan.
 */
export function AuthBackdrop() {
  return (
    <div className="sw-scene" aria-hidden="true">
      {/* Cahaya. Tiga bidang, masing-masing satu warna gradien tema, ditaruh
          jauh di luar tepi layar supaya yang terlihat hanya bagian tengahnya
          yang paling lembut. */}
      <div className="sw-aura sw-aura-1" />
      <div className="sw-aura sw-aura-2" />
      <div className="sw-aura sw-aura-3" />

      {/* Kisi. Cukup samar untuk tidak terbaca sebagai pola, cukup ada untuk
          menahan bidang warna besar supaya tidak terlihat seperti gradien
          kosong. */}
      <div className="sw-kisi" />

      {/* Satu garis nadi. Satu-satunya isyarat dunia kesehatan yang tersisa,
          dan sengaja hanya berupa garis: begitu ia digambar jadi benda, ia
          kembali jadi ilustrasi. */}
      <svg
        className="sw-nadi"
        viewBox="0 0 1200 120"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M0 60 H210 l22 -34 22 68 26 -86 24 100 20 -48 h34 l18 -20 16 40 14 -20 H700 l26 -30 20 60 22 -74 20 88 18 -44 h40 l16 -18 14 36 12 -18 H1200"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
