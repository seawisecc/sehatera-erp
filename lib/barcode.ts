/**
 * CODE 128, dibangkitkan sendiri tanpa pustaka luar.
 *
 * Kenapa tanpa pustaka: dokumen cetak di project ini dibuka sebagai HTML
 * lepas di jendela lain (`lib/cetak.ts`), tanpa bundler dan tanpa jaringan.
 * Apa pun yang menuntut <script src="..."> akan gagal diam-diam di komputer
 * apotek yang internetnya putus, dan yang gagal diam-diam pada dokumen cetak
 * baru ketahuan saat setumpuk stiker sudah keluar polos.
 *
 * **Barcode yang salah lebih berbahaya daripada tidak ada barcode.** Ia
 * terlihat sah, dipindai tanpa ragu, dan menghasilkan produk yang keliru di
 * keranjang. Karena itu tabel polanya diperiksa STRUKTURAL saat modul ini
 * dimuat (lihat `periksaTabel`), bukan cuma dipercaya sudah diketik benar:
 * tiap pola CODE 128 wajib berjumlah 11 modul, wajib enam elemen, dan wajib
 * berbeda satu sama lain. Satu digit yang salah ketik hampir selalu merusak
 * salah satu dari ketiganya.
 *
 * Yang TIDAK bisa dibuktikan dari sini: bahwa tabelnya cocok dengan standar
 * ISO/IEC 15417. Penjaga di atas membuktikan tabelnya konsisten, bukan
 * tabelnya benar. Karena itu label yang dicetak SELALU membawa angkanya dalam
 * huruf di bawah bar, dan lembar pertama harus dipindai sungguhan dengan
 * pemindai kliniknya sebelum dipercaya. Itu dikatakan di layarnya.
 */

/**
 * 107 pola, tiap pola enam lebar elemen bergantian bar-spasi-bar-spasi-bar-spasi.
 * Indeks = nilai simbol CODE 128. Nilai 106 adalah STOP dan panjangnya tujuh.
 */
const POLA: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
]

const START_B = 104
const START_C = 105
const STOP    = 106
const KE_C    = 99   // dari Code B ke Code C
const KE_B    = 100  // dari Code C ke Code B

/**
 * Penjaga struktural, dijalankan sekali saat modul dimuat.
 *
 * Bukan hiasan: tabel 107 baris yang diketik tangan adalah tempat yang wajar
 * untuk satu digit meleset, dan digit yang meleset menghasilkan barcode yang
 * TERBACA tapi salah nilainya pada satu karakter tertentu saja. Itu jenis
 * kesalahan yang lolos dari percobaan pertama dan muncul berbulan-bulan
 * kemudian pada satu produk.
 */
function periksaTabel(): void {
  const terlihat = new Set<string>()
  POLA.forEach((p, i) => {
    const panjang = i === STOP ? 7 : 6
    if (p.length !== panjang) {
      throw new Error(`CODE128: pola ${i} punya ${p.length} elemen, seharusnya ${panjang}.`)
    }
    const jumlah = [...p].reduce((a, c) => a + Number(c), 0)
    const harus = i === STOP ? 13 : 11
    if (jumlah !== harus) {
      throw new Error(`CODE128: pola ${i} berjumlah ${jumlah} modul, seharusnya ${harus}.`)
    }
    if (terlihat.has(p)) {
      throw new Error(`CODE128: pola ${i} (${p}) kembar dengan yang lain.`)
    }
    terlihat.add(p)
  })
  if (POLA.length !== 107) {
    throw new Error(`CODE128: tabelnya berisi ${POLA.length} pola, seharusnya 107.`)
  }
}
periksaTabel()

/** Karakter yang bisa dibawa Code B: ASCII 32..127. */
const bisaB = (c: string) => {
  const k = c.charCodeAt(0)
  return k >= 32 && k <= 127
}

/**
 * Berapa digit berurutan mulai dari posisi i.
 *
 * Dipakai memutuskan pindah ke Code C, yang memuat DUA digit per simbol. Untuk
 * barcode obat yang isinya 13 digit, itu memangkas lebarnya hampir separuh,
 * dan lebar adalah alasan stiker rak muat atau tidak muat di raknya.
 */
const digitBerurutan = (s: string, i: number): number => {
  let n = 0
  while (i + n < s.length && s[i + n] >= '0' && s[i + n] <= '9') n++
  return n
}

/**
 * Nilai-nilai simbol untuk satu teks, termasuk START dan check digit.
 *
 * Aturan pindah mode diambil apa adanya dari praktik yang lazim: Code C dipakai
 * kalau ada empat digit berurutan atau lebih (dua di awal/akhir sudah cukup
 * kalau seluruh isinya digit), karena di bawah itu biaya pindah modenya lebih
 * besar daripada hematnya.
 */
function nilaiSimbol(teks: string): number[] {
  const out: number[] = []
  let i = 0
  let mode: 'B' | 'C'

  const digitAwal = digitBerurutan(teks, 0)
  if (digitAwal >= 4 || (digitAwal === teks.length && teks.length >= 2 && teks.length % 2 === 0)) {
    mode = 'C'
    out.push(START_C)
  } else {
    mode = 'B'
    out.push(START_B)
  }

  while (i < teks.length) {
    if (mode === 'C') {
      const sisa = digitBerurutan(teks, i)
      if (sisa >= 2) {
        out.push(Number(teks.substr(i, 2)))
        i += 2
        continue
      }
      out.push(KE_B)
      mode = 'B'
      continue
    }

    const runut = digitBerurutan(teks, i)
    // Pindah ke C hanya kalau yang tersisa genap dan cukup panjang. Pindah lalu
    // harus segera balik karena tersisa satu digit ganjil adalah kerugian.
    const genap = runut - (runut % 2)
    if (genap >= 4 || (genap >= 2 && i + runut === teks.length && genap === runut)) {
      out.push(KE_C)
      mode = 'C'
      continue
    }

    const c = teks[i]
    if (!bisaB(c)) {
      throw new Error(`CODE128: karakter "${c}" di luar jangkauan yang didukung (ASCII 32..127).`)
    }
    out.push(c.charCodeAt(0) - 32)
    i++
  }

  // Check digit: jumlah berbobot, bobot START = 1 lalu 1,2,3, ...
  let jumlah = out[0]
  for (let k = 1; k < out.length; k++) jumlah += out[k] * k
  out.push(jumlah % 103)
  out.push(STOP)
  return out
}

export type Barcode = {
  /** Lebar tiap elemen dalam modul, bergantian mulai dari BAR. */
  elemen: number[]
  /** Total modul, untuk menghitung lebar fisiknya. */
  modul: number
  /** Teks aslinya, dicetak sebagai huruf di bawah bar. */
  teks: string
}

/**
 * Mengubah teks jadi deretan lebar elemen.
 *
 * Melempar untuk masukan yang tidak bisa dibawa CODE 128, dan itu disengaja:
 * mengembalikan barcode kosong berarti stiker keluar tanpa bar dan tidak ada
 * yang tahu kenapa sampai ada yang mencoba memindainya.
 */
export function code128(teks: string): Barcode {
  const bersih = (teks ?? '').trim()
  if (!bersih) throw new Error('CODE128: teksnya kosong.')

  const elemen: number[] = []
  for (const nilai of nilaiSimbol(bersih)) {
    for (const d of POLA[nilai]) elemen.push(Number(d))
  }
  // Quiet zone tidak masuk ke sini: ia urusan tata letak, dan menaruhnya di
  // dalam deretan elemen membuat elemen ganjil/genap tidak lagi berarti
  // bar/spasi.
  return { elemen, modul: elemen.reduce((a, b) => a + b, 0), teks: bersih }
}

/**
 * Barcode sebagai HTML polos: satu <i> per elemen, lebarnya dalam milimeter.
 *
 * Sengaja bukan SVG dan bukan <canvas>. SVG di dalam dokumen cetak yang
 * dibuka lewat `window.open` pernah berbeda ukurannya antar peramban, dan
 * canvas tidak ikut tercetak sama sekali di sebagian pengaturan. Kotak berisi
 * div hitam dan putih adalah hal yang paling tidak bisa disalahartikan mesin
 * cetak mana pun.
 *
 * `modulMm` bawaannya 0,33 mm: itu ukuran X-dimension yang lazim dan masih
 * terbaca pemindai genggam murah. Lebih kecil memang muat lebih banyak, dan
 * juga lebih sering gagal dipindai di ruangan yang lampunya seadanya.
 */
export function barcodeHtml(
  teks: string,
  opsi: { tinggiMm?: number; modulMm?: number; tanpaTeks?: boolean } = {},
): string {
  const { tinggiMm = 10, modulMm = 0.33, tanpaTeks = false } = opsi
  const b = code128(teks)

  let x = 0
  const bar: string[] = []
  b.elemen.forEach((lebar, i) => {
    if (i % 2 === 0) {
      // Genap = bar. Diposisikan absolut supaya pembulatan lebar tiap elemen
      // tidak menumpuk jadi geseran di ujung kanan.
      bar.push(`<i style="left:${(x * modulMm).toFixed(3)}mm;width:${(lebar * modulMm).toFixed(3)}mm"></i>`)
    }
    x += lebar
  })

  const lebarMm = (b.modul * modulMm).toFixed(3)
  return `<span class="bc" style="width:${lebarMm}mm">
  <span class="bc-bar" style="height:${tinggiMm}mm">${bar.join('')}</span>
  ${tanpaTeks ? '' : `<span class="bc-teks">${b.teks.replace(/[<&]/g, c => (c === '<' ? '&lt;' : '&amp;'))}</span>`}
</span>`
}

/** Gaya yang dipakai `barcodeHtml`. Ditempel sekali per dokumen. */
export const GAYA_BARCODE = `
.bc{display:inline-block;text-align:center;}
.bc-bar{display:block;position:relative;width:100%;background:#fff;}
.bc-bar i{position:absolute;top:0;bottom:0;background:#000;}
.bc-teks{display:block;font-family:"Courier New",monospace;font-size:7pt;letter-spacing:.08em;margin-top:.6mm;color:#000;}
`
