import { ImageResponse } from 'next/og'

export const alt = 'Sehatera: sistem apotek, klinik, dan rumah sakit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Gambar yang muncul saat tautan Sehatera dibagikan di WhatsApp dan media
 * sosial. Ini layar pertama yang dilihat calon klien, sering SEBELUM ia membuka
 * situsnya, jadi yang salah di sini salah di tempat yang paling menentukan.
 *
 * Versi sebelumnya sudah tertinggal di tiga hal sekaligus, dan ketiganya tidak
 * pernah muncul sebagai galat karena gambar ini tidak pernah dibuka siapa pun
 * yang sedang mengerjakan aplikasinya:
 *
 * 1. **Warnanya tema yang sudah dibuang.** Latarnya `#16281d` ke `#1e3a2c`,
 *    yaitu hijau gelap dari palet lama. Keempat tema Sehatera sekarang TERANG
 *    dan bawaannya Vital Tide, jadi orang yang menekan tautannya mendarat di
 *    aplikasi yang sama sekali tidak seperti gambarnya.
 * 2. **Judulnya "Apotek Anda".** Produknya sudah tiga bentuk fasilitas sejak
 *    `companies.sektor` ada, dan klinik justru paket yang paling mahal. Gambar
 *    yang menyebut apotek saja membuat pemilik klinik menyimpulkan ini bukan
 *    untuk dia, dan ia tidak akan menekan tautannya untuk memastikan.
 * 3. **Lambangnya bukan lambang Sehatera**, melainkan ikon labu takar dari
 *    pustaka ikon. Lambang perisai-palang-nadi sudah dipakai di sidebar, layar
 *    masuk, dan ikon aplikasi terpasang; cuma gambar bagikan ini yang
 *    ketinggalan, jadi tautannya terbaca seperti milik produk lain.
 *
 * Warnanya diambil dari Vital Tide di `app/globals.css`. Nilainya ditulis
 * harfiah di sini, bukan lewat token, karena `next/og` merender di server tanpa
 * CSS aplikasi sama sekali: token akan jadi warna kosong dan gambarnya terbit
 * hitam polos. **Kalau palet Vital Tide diubah, berkas ini ikut diubah tangan.**
 */
export default function OpengraphImage() {
  // Vital Tide, tema bawaan. Disalin dari globals.css; lihat catatan di atas.
  const MARK = ['#4aa8d8', '#2fb8ab', '#3fb87a']
  const BRAND = '#12292e'
  const KABUT = '#7fd3e6'

  const chips = [
    'Rekam Medis & e-Resep',
    'Antrean per Poli',
    'Kasir & Batch Kadaluarsa',
    'SatuSehat',
    'Klaim BPJS & Asuransi',
    'Laporan SIPNAP',
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 72px',
          background: `linear-gradient(118deg, ${BRAND} 0%, #17414c 38%, #1f6b80 72%, #2a8296 100%)`,
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/*
          TIDAK ada bidang cahaya tambahan di atas latar ini, dan itu keputusan
          sesudah dua percobaan gagal.

          Satori, perender di balik `next/og`, tidak mengenal `filter: blur`,
          jadi percobaan pertama (lingkaran pekat ber-opacity) terbit dengan
          tepi tajam dan terbaca sebagai bola hijau yang bersaing dengan
          judulnya. Percobaan kedua memakai `radial-gradient` yang memudar, dan
          itu memang menghilangkan tepinya, tapi KOTAK yang menampungnya tetap
          dilayout sebagai blok biasa: `position: absolute` tidak dihormati,
          jadi tepi bawahnya terbit sebagai garis mendatar melintasi seluruh
          gambar. Terlihat seperti berkas PNG yang rusak, dan itu yang ikut
          terbagikan ke calon klien.

          Jadi kedalamannya datang dari latar itu sendiri: satu gradien
          diagonal bertiga henti, dari pekat ke warna tanda tangan. Tidak ada
          lapisan kedua yang bisa membocorkan tepinya.
        */}

        {/* ── Merek ── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 38 }}>
          <svg width="76" height="76" viewBox="0 0 32 32" fill="none" style={{ marginRight: 20 }}>
            <defs>
              <linearGradient id="og-mark" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={MARK[0]} />
                <stop offset="52%" stopColor={MARK[1]} />
                <stop offset="100%" stopColor={MARK[2]} />
              </linearGradient>
            </defs>
            <path
              d="M16 2.2 27.2 6.4V16c0 6.5-4.7 12.1-11.2 13.8C9.5 28.1 4.8 22.5 4.8 16V6.4L16 2.2Z"
              fill="url(#og-mark)"
            />
            <g fill={BRAND}>
              <rect x="13.7" y="9.2" width="4.6" height="13.6" rx="1.9" />
              <rect x="9.2" y="13.7" width="13.6" height="4.6" rx="1.9" />
            </g>
            <path
              d="M9.2 16h2.6l1.5-3.4 2.4 6.8 1.4-3.4h3.7"
              stroke="url(#og-mark)"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.5px' }}>Sehatera</div>
            <div style={{ fontSize: 23, color: KABUT }}>by Seawise Studio</div>
          </div>
        </div>

        {/* ── Judul ──
            Menyebut ketiga bentuk fasilitas, bukan cuma apotek.

            Tiap baris jadi div-nya sendiri di dalam kolom flex, bukan dipisah
            `<br />`. Satori, perender di balik `next/og`, MENOLAK div yang
            punya lebih dari satu anak tanpa `display` yang disebut terang-
            terangan, dan penolakannya berbentuk build yang gagal, bukan gambar
            yang jelek. */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-1.5px' }}>
            Apotek, klinik, dan rumah sakit
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-1.5px' }}>
            dalam satu sistem.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 25, color: '#c7e6ef', lineHeight: 1.45, marginBottom: 38, maxWidth: 900 }}>
          {'Rekam medis, e-resep, antrean poli, kasir dengan batch & kadaluarsa, klaim penjamin, laporan SIPNAP, dan pengiriman ke SatuSehat.'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {chips.map(c => (
            <div
              key={c}
              style={{
                display: 'flex',
                fontSize: 20,
                color: '#eaf7fa',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.20)',
                borderRadius: 999,
                padding: '9px 20px',
                marginRight: 10,
                marginBottom: 10,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
