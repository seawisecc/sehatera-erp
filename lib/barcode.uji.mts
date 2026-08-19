/**
 * Bukti CODE 128, dijalankan tangan:
 *
 *   npx tsx lib/barcode.uji.mts
 *
 * Mengikuti pola `supabase/uji/`: bukan bagian dari build, tidak mengubah apa
 * pun, dan yang benar cuma satu keluaran, "ROUND-TRIP LULUS".
 *
 * Ia membongkar kembali deretan lebar elemen jadi teks dan MEMERIKSA CHECK
 * DIGIT SENDIRI. Yang dibuktikan adalah logika encoder: pindah mode B/C,
 * urutan simbol, dan check digit. Yang TIDAK dibuktikan: bahwa tabel polanya
 * cocok dengan ISO/IEC 15417, karena pembongkarnya memakai tabel yang sama.
 * Itu cuma bisa dibuktikan dengan memindai hasil cetaknya pakai pemindai
 * sungguhan, dan layar Produk mengatakan itu apa adanya.
 */

import { code128 } from './barcode'

/**
 * Pembongkar mandiri: mengubah deretan lebar elemen kembali jadi teks, dengan
 * memeriksa check digit sendiri. Ia MEMAKAI tabel yang sama, jadi yang
 * dibuktikan adalah logika encoder (pindah mode, check digit, urutan), bukan
 * bahwa tabelnya cocok dengan standar.
 */

function bongkar(elemen: number[]): string {
  // Ambil ulang tabel dari pola yang tercetak: potong per 6, sisa 7 = STOP.
  const simbol: number[] = []
  let i = 0
  const tabel = TABEL
  while (i < elemen.length) {
    const sisa = elemen.length - i
    const n = sisa === 7 ? 7 : 6
    const pola = elemen.slice(i, i + n).join('')
    const nilai = tabel.indexOf(pola)
    if (nilai < 0) throw new Error('pola tidak dikenali: ' + pola)
    simbol.push(nilai)
    i += n
  }
  if (simbol[simbol.length - 1] !== 106) throw new Error('tidak diakhiri STOP')
  const cek = simbol[simbol.length - 2]
  const isi = simbol.slice(0, simbol.length - 2)
  let jumlah = isi[0]
  for (let k = 1; k < isi.length; k++) jumlah += isi[k] * k
  if (jumlah % 103 !== cek) throw new Error(`check digit salah: ${jumlah % 103} vs ${cek}`)

  let mode: 'B' | 'C' = isi[0] === 105 ? 'C' : 'B'
  let out = ''
  for (let k = 1; k < isi.length; k++) {
    const v = isi[k]
    if (mode === 'C') {
      if (v === 100) { mode = 'B'; continue }
      out += String(v).padStart(2, '0')
    } else {
      if (v === 99) { mode = 'C'; continue }
      out += String.fromCharCode(v + 32)
    }
  }
  return out
}

const TABEL: string[] = [
  '212222','222122','222221','121223','121322','131222','122213','122312',
  '132212','221213','221312','231212','112232','122132','122231','113222',
  '123122','123221','223211','221132','221231','213212','223112','312131',
  '311222','321122','321221','312212','322112','322211','212123','212321',
  '232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121',
  '313121','211331','231131','213113','213311','213131','311123','311321',
  '331121','312113','312311','332111','314111','221411','431111','111224',
  '111422','121124','121421','141122','141221','112214','112412','122114',
  '122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112',
  '421211','212141','214121','412121','111143','111341','131141','114113',
  '114311','411113','411311','113141','114131','311141','411131','211412',
  '211214','211232','2331112',
]

const contoh: string[] = [
  '8992761111112', '1234567890128', '0123456789', '12345', '1',
  'OBT-001', 'A3-2', 'PCT500', 'Rexco 88', 'a1b2c3', '99', '0000',
  'SEHATERA-2026-0001', '4' , '  spasi  '.trim(),
]
const acak: string[] = []
const abjad = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-. /'
for (let n = 0; n < 4000; n++) {
  const p = 1 + Math.floor(Math.random() * 24)
  let s = ''
  for (let k = 0; k < p; k++) s += abjad[Math.floor(Math.random() * abjad.length)]
  acak.push(s)
}

let gagal = 0
let modulTotal = 0
for (const s of [...contoh, ...acak]) {
  // Encoder memang memangkas ujung: barcode berspasi di tepi adalah salah
  // ketik, bukan data. Jadi yang dibandingkan adalah bentuk terpangkasnya.
  const harap = s.trim()
  if (!harap) continue
  try {
    const b = code128(s)
    const kembali = bongkar(b.elemen)
    if (kembali !== harap) { console.log('BEDA:', JSON.stringify(s), '->', JSON.stringify(kembali)); gagal++ }
    if (s.length === 13) modulTotal = b.modul
  } catch (e: any) {
    console.log('GAGAL:', JSON.stringify(s), e.message); gagal++
  }
}
console.log(gagal === 0 ? `ROUND-TRIP LULUS: ${contoh.length + acak.length} teks` : `GAGAL: ${gagal}`)
const ean = code128('8992761111112')
console.log('EAN 13 digit ->', ean.modul, 'modul =', (ean.modul * 0.33).toFixed(1), 'mm pada 0,33mm/modul')
const b13 = code128('OBT-001')
console.log('OBT-001 ->', b13.modul, 'modul =', (b13.modul * 0.33).toFixed(1), 'mm')
