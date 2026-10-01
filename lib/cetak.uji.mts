/**
 * Membuktikan suntikan `bukaCetak` mendarat di SETIAP templat cetak.
 *
 * Tidak memanggil `bukaCetak` sendiri karena ia butuh `window`. Yang diuji
 * adalah hal yang sebenarnya bisa salah: apakah tiap templat punya `<head>`
 * dan `<body>` HARFIAH yang jadi sasaran `.replace()`. Templat yang menulis
 * `<body class="...">` akan lolos build, lolos typecheck, dan terbit tanpa
 * bilah tombol maupun penanda viewport, yaitu persis bug yang diperbaiki.
 */
import {
  beritaAcaraPemusnahan, purchaseOrder, buktiPembayaranFaktur,
  strukPenjualan, etiketObat, fakturPenjamin, labelRak, lembarOpname, buktiSetoranKasir,
} from './cetak'

const p = { nama_faskes: 'Klinik Rexco 88', alamat: 'Denpasar', nomor_ijin: 'SIA/1', nomor_telepon: '0361', nama_apoteker: 'Apt. A', nomor_sipa: 'SIPA/1', kota: 'Denpasar' }

const dokumen: [string, string][] = [
  ['beritaAcaraPemusnahan', beritaAcaraPemusnahan(p, { nomor_ba: 'BA/1', nama_produk: 'Obat <script>' })],
  ['purchaseOrder', purchaseOrder(p, { nomor_po: 'PO/1' } as never, [])],
  ['buktiPembayaranFaktur', buktiPembayaranFaktur(p, { nomor_faktur: 'F/1' } as never)],
  ['strukPenjualan', strukPenjualan(p, { nomor_transaksi: 'TRX/1', total: 1000, bayar: 1000, kembalian: 0 } as never,
    [{ nama_obat: 'Paracetamol 500 mg', jumlah: 2, harga_jual: 500, subtotal: 1000 }] as never)],
  ['etiketObat', etiketObat(p, { nomor_resep: 'R/1', nama_pasien: 'Budi' } as never,
    [{ nama_obat: 'Amoxicillin', jumlah: 10, satuan: 'tablet', rute: 'oral' }] as never)],
  ['fakturPenjamin', fakturPenjamin(p, { nomor: 'KL/1' } as never, [])],
  ['labelRak', labelRak(p, [{ nama_obat: 'Zinc', kode: 'OB-024' }] as never)],
  ['lembarOpname draf', lembarOpname(p, { nomor: 'OPN/1', status: 'draf' }, [{ nama_obat: 'Codein <10>', stok_sistem: 40 }])],
  ['lembarOpname final', lembarOpname(p, { nomor: 'OPN/1', status: 'final' }, [{ nama_obat: 'Codein', stok_sistem: 40, stok_fisik: 38, selisih: -2, alasan: 'rusak' }])],
  ['buktiSetoranKasir', buktiSetoranKasir(p, { kasir_email: 'kasir@x.test', kas_awal: 100000, kas_seharusnya: 250000, kas_dihitung: 245000, selisih: -5000 })],
]

// Suntikan yang sama persis dengan yang ada di `bukaCetak`.
const suntik = (html: string) => html
  .replace('<head>', '<head><meta name="viewport" content="width=device-width,initial-scale=1">')
  .replace('<body>', '<body>SW_BILAH')

let gagal = 0
for (const [nama, html] of dokumen) {
  const hasil = suntik(html)
  const cekViewport = (hasil.match(/name="viewport"/g) || []).length
  const cekBilah = (hasil.match(/SW_BILAH/g) || []).length
  const ok = cekViewport === 1 && cekBilah === 1
  if (!ok) { gagal++; console.log(`GAGAL ${nama}: viewport=${cekViewport} bilah=${cekBilah}`) }
  else console.log(`ok   ${nama}`)
}

// Struk: yang diperbaiki adalah keterbacaannya, jadi itu yang diuji.
const struk = dokumen.find(d => d[0] === 'strukPenjualan')![1]
const cekStruk: [string, boolean][] = [
  ['tidak ada teks abu-abu #555', !struk.includes('#555')],
  ['tidak ada garis abu-abu #999', !struk.includes('#999')],
  ['tidak ada huruf 10px', !/font-size:\s*10px/.test(struk)],
  ['tidak ada huruf 11px', !/font-size:\s*11px/.test(struk)],
  ['total dibesarkan', struk.includes('class="row total"')],
  ['nama obat punya kelasnya sendiri', struk.includes('class="bold nama"')],
]
for (const [apa, lulus] of cekStruk) {
  if (!lulus) { gagal++; console.log(`GAGAL struk: ${apa}`) }
  else console.log(`ok   struk: ${apa}`)
}

// Templat di berkas ini terkirim apa adanya ke dokumen yang dibuka orang,
// jadi penjelasan panjang di dalam <style> adalah paragraf yang menumpang di
// struk pembeli. Penjelasannya tempatnya di komentar TypeScript, yang tidak
// ikut ke mana pun.
for (const [nama, html] of dokumen) {
  if (html.includes('/*') && /\/\*[^*]{160,}/.test(html)) {
    gagal++
    console.log(`GAGAL ${nama}: ada komentar CSS panjang yang ikut tercetak`)
  } else console.log(`ok   ${nama}: tidak ada komentar panjang yang ikut tercetak`)
}

// Opname: lembar draf itu hitung BUTA, angka sistem tidak boleh tercetak.
const draf = dokumen.find(d => d[0] === 'lembarOpname draf')![1]
const final = dokumen.find(d => d[0] === 'lembarOpname final')![1]
const setoran = dokumen.find(d => d[0] === 'buktiSetoranKasir')![1]
const cekLain: [string, boolean][] = [
  ['opname draf tanpa kolom Sistem', !draf.includes('>Sistem<') && !draf.includes('>40<')],
  ['opname draf meloloskan karakter HTML', draf.includes('Codein &lt;10&gt;')],
  ['opname final membawa sistem, fisik, selisih', final.includes('>40<') && final.includes('>38<') && final.includes('>-2<')],
  ['opname final menebalkan yang berselisih', final.includes('class="beda"')],
  ['setoran menyebut KURANG untuk selisih minus', setoran.includes('KURANG') && setoran.includes('Rp -5.000')],
]
for (const [apa, lulus] of cekLain) {
  if (!lulus) { gagal++; console.log(`GAGAL ${apa}`) }
  else console.log(`ok   ${apa}`)
}

if (gagal) throw new Error(`${gagal} pemeriksaan gagal`)
console.log('\nSEMUA UJI LULUS')
