/**
 * Membuat ikon PNG untuk manifest PWA dari sumber SVG-nya.
 *
 *   node scripts/buat-ikon.mjs
 *
 * Kenapa PNG padahal SVG-nya sudah ada: Chrome di komputer memang menerima
 * ikon SVG, tapi Android membungkus PWA jadi WebAPK dan pembungkus itu
 * meminta PNG berukuran pasti. Ikon yang tidak terbaca tidak berarti gagal
 * memasang, ia berarti aplikasi terpasang dengan kotak abu-abu di peluncur.
 *
 * Dijalankan TANGAN, hasilnya ikut masuk repo. Kalau ia jadi bagian dari
 * `npm run build`, tiap deploy menanggung rasterisasi untuk berkas yang tidak
 * pernah berubah.
 *
 * Perasternya `next/og`, yang memang sudah ada di project ini karena
 * `app/opengraph-image.tsx` memakainya. Tidak ada dependensi baru.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'

// `next/og` hanya mendaftarkan jalur CommonJS, jadi ia diambil lewat require,
// bukan import. Import biasa berhenti dengan ERR_MODULE_NOT_FOUND.
const { ImageResponse } = createRequire(import.meta.url)('next/og')

const IKON = [
  { sumber: 'app/apple-icon.svg',      keluaran: 'public/icon-192.png',          ukuran: 192 },
  { sumber: 'app/apple-icon.svg',      keluaran: 'public/icon-512.png',          ukuran: 512 },
  { sumber: 'public/icon-maskable.svg', keluaran: 'public/icon-maskable-192.png', ukuran: 192 },
  { sumber: 'public/icon-maskable.svg', keluaran: 'public/icon-maskable-512.png', ukuran: 512 },
]

for (const { sumber, keluaran, ukuran } of IKON) {
  const svg = readFileSync(sumber)
  const src = `data:image/svg+xml;base64,${svg.toString('base64')}`
  const el = createElement(
    'div',
    { style: { display: 'flex', width: '100%', height: '100%' } },
    createElement('img', { src, width: ukuran, height: ukuran }),
  )
  const png = await new ImageResponse(el, { width: ukuran, height: ukuran }).arrayBuffer()
  writeFileSync(keluaran, Buffer.from(png))
  console.log(`${keluaran}  ${ukuran}x${ukuran}  ${Buffer.from(png).length} bytes`)
}
