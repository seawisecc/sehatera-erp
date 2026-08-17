/**
 * Dokumen cetak: berita acara, bukti bayar, dan seterusnya.
 *
 * Dipisah dari halaman karena isinya bukan React sama sekali, melainkan HTML
 * lengkap yang dibuka di jendela lain. Selama ia menumpang di dalam komponen
 * dashboard, dua hal terjadi: templat yang sama disalin dua kali (Berita Acara
 * dicetak dari dua tempat: sesudah memusnahkan, dan dari riwayat), dan
 * salinannya sudah mulai berbeda. Yang pertama menulis `${settingsData.alamat}`
 * tanpa nilai cadangan, sehingga alamat yang belum diisi tercetak sebagai kata
 * "undefined" pada dokumen yang ikut ditandatangani apoteker penanggung jawab.
 *
 * Dokumen di sini SELALU hitam di atas putih, tidak mengikuti tema aplikasi.
 * Kertas tidak punya tema gelap.
 */

export type ProfilApotek = {
  /** Nama fasilitas. `nama_apotek` masih diterima demi data lama. */
  nama_faskes?: string | null
  nama_apotek?: string | null
  alamat?: string | null
  nomor_ijin?: string | null
  nomor_telepon?: string | null
  nama_apoteker?: string | null
  nomor_sipa?: string | null
  kota?: string | null
}

/**
 * Semua nilai yang masuk templat lewat sini.
 *
 * Selain menyeragamkan tanda "-" untuk yang kosong, ini juga meloloskan
 * karakter HTML. Nama pasien dan keterangan pemusnahan diketik manusia, dan
 * satu tanda `<` di dalamnya sudah cukup untuk merusak sisa dokumen.
 */
export const teks = (v: unknown, kosong = '-'): string => {
  const s = v === null || v === undefined ? '' : String(v)
  if (!s.trim()) return kosong
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const tanggalPanjang = (v: unknown, kosong = '-'): string => {
  if (!v) return kosong
  const d = new Date(v as string)
  if (Number.isNaN(d.getTime())) return kosong
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const rupiah = (n: unknown): string => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

/** Membuka jendela cetak. Mengembalikan false kalau diblokir peramban. */
export function bukaCetak(html: string, lebar = 800, tinggi = 900): boolean {
  const win = window.open('', '_blank', `width=${lebar},height=${tinggi}`)
  if (!win) return false
  win.document.write(html)
  win.document.close()
  win.print()
  return true
}

const GAYA_DOKUMEN = `
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;font-size:12px;padding:40px;color:#000;background:#fff;}
h1{font-size:16px;text-align:center;font-weight:bold;}
h2{font-size:13px;text-align:center;margin-bottom:20px;}
.apotek{text-align:center;margin-bottom:16px;}
.divider{border-top:2px solid #000;margin:12px 0;}
table{width:100%;border-collapse:collapse;margin:16px 0;}
td{padding:6px 8px;vertical-align:top;}
.label{width:35%;font-weight:bold;}
.ttd{margin-top:48px;display:flex;justify-content:space-around;}
.ttd-box{text-align:center;}
.ttd-line{border-top:1px solid #000;width:180px;margin:48px auto 4px;}
`

const kepalaApotek = (p: ProfilApotek) => `
<div class="apotek">
  <h1>${teks(p.nama_faskes ?? p.nama_apotek, 'Fasilitas')}</h1>
  <p>${teks(p.alamat, '')}</p>
  <p>SIA: ${teks(p.nomor_ijin)} | Telp: ${teks(p.nomor_telepon)}</p>
</div>
<div class="divider"></div>`

export type DataPemusnahan = {
  nomor_ba?: string | null
  tanggal_musnahkan?: string | null
  nama_produk?: string | null
  satuan?: string | null
  batch_number?: string | null
  expired_date?: string | null
  qty_musnahkan?: number | null
  metode?: string | null
  keterangan?: string | null
  saksi_1?: string | null
  saksi_2?: string | null
}

/**
 * Berita Acara Pemusnahan Obat.
 *
 * Satu templat untuk dua pemakaian: langsung sesudah pemusnahan dicatat, dan
 * dicetak ulang dari riwayat. Bentuknya harus sama persis: dokumen yang sama
 * dicetak dua kali dengan tata letak berbeda akan dipertanyakan saat
 * pemeriksaan.
 */
export function beritaAcaraPemusnahan(p: ProfilApotek, d: DataPemusnahan): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Berita Acara Pemusnahan ${teks(d.nomor_ba, '')}</title>
<style>${GAYA_DOKUMEN}</style></head><body>
${kepalaApotek(p)}
<h1>BERITA ACARA PEMUSNAHAN OBAT</h1>
<h2>No: ${teks(d.nomor_ba)}</h2>
<table>
  <tr><td class="label">Tanggal Pemusnahan</td><td>: ${tanggalPanjang(d.tanggal_musnahkan)}</td></tr>
  <tr><td class="label">Nama Produk</td><td>: ${teks(d.nama_produk)}</td></tr>
  <tr><td class="label">No. Batch</td><td>: ${teks(d.batch_number)}</td></tr>
  <tr><td class="label">Expired Date</td><td>: ${tanggalPanjang(d.expired_date)}</td></tr>
  <tr><td class="label">Jumlah Dimusnahkan</td><td>: ${teks(d.qty_musnahkan, '0')} ${teks(d.satuan, '')}</td></tr>
  <tr><td class="label">Metode Pemusnahan</td><td>: ${teks(d.metode)}</td></tr>
  <tr><td class="label">Keterangan</td><td>: ${teks(d.keterangan)}</td></tr>
</table>
<p>Demikian berita acara ini dibuat dengan sebenarnya.</p>
<div class="ttd">
  <div class="ttd-box">
    <p>Apoteker Penanggung Jawab</p><div class="ttd-line"></div>
    <p><b>${teks(p.nama_apoteker)}</b></p><p>SIPA: ${teks(p.nomor_sipa)}</p>
  </div>
  <div class="ttd-box"><p>Saksi 1</p><div class="ttd-line"></div><p><b>${teks(d.saksi_1)}</b></p></div>
  <div class="ttd-box"><p>Saksi 2</p><div class="ttd-line"></div><p><b>${teks(d.saksi_2)}</b></p></div>
</div>
</body></html>`
}

export type BarisPO = {
  nama_produk?: string | null
  satuan?: string | null
  qty_pesan?: number | null
  harga_beli?: number | null
  subtotal?: number | null
}

export type DataPO = {
  nomor_po?: string | null
  tanggal?: string | null
  status?: string | null
  total_nilai?: number | null
  catatan?: string | null
  supplier_nama?: string | null
  supplier_alamat?: string | null
  supplier_telepon?: string | null
}

/** Surat pesanan ke pemasok. */
export function purchaseOrder(p: ProfilApotek, d: DataPO, items: BarisPO[]): string {
  const baris = items
    .map(
      (it, i) => `<tr>
      <td>${i + 1}</td><td>${teks(it.nama_produk)}</td><td>${teks(it.satuan, '')}</td>
      <td>${teks(it.qty_pesan, '0')}</td>
      <td>${rupiah(it.harga_beli)}</td>
      <td>${rupiah(it.subtotal)}</td>
    </tr>`,
    )
    .join('')

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>PO ${teks(d.nomor_po, '')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;font-size:12px;padding:32px;color:#000;background:#fff;}
.header{display:flex;justify-content:space-between;margin-bottom:24px;}
h1{font-size:18px;font-weight:bold;margin-bottom:4px;}
table{width:100%;border-collapse:collapse;margin:16px 0;}
th{background:#333;color:#fff;padding:8px;text-align:left;font-size:11px;}
td{padding:8px;border-bottom:1px solid #eee;font-size:11px;}
.total-row td{font-weight:bold;border-top:2px solid #333;}
.divider{border-top:2px solid #333;margin:12px 0;}
.ttd{margin-top:48px;display:flex;justify-content:space-between;}
.ttd-box{text-align:center;}
.ttd-line{border-top:1px solid #000;width:200px;margin:48px auto 4px;}
</style></head><body>
<div class="header">
  <div>
    <h1>${teks(p.nama_faskes ?? p.nama_apotek, 'Fasilitas')}</h1>
    <p>${teks(p.alamat, '')}</p>
    <p>SIA: ${teks(p.nomor_ijin)} | Telp: ${teks(p.nomor_telepon)}</p>
  </div>
  <div style="text-align:right;">
    <h1>PURCHASE ORDER</h1>
    <p><b>No. PO:</b> ${teks(d.nomor_po)}</p>
    <p><b>Tanggal:</b> ${tanggalPanjang(d.tanggal)}</p>
    <p><b>Status:</b> ${teks(d.status, '-').toUpperCase()}</p>
  </div>
</div>
<div class="divider"></div>
<div style="margin:12px 0;">
  <p><b>Kepada Yth:</b></p>
  <p>${teks(d.supplier_nama)}</p>
  <p>${teks(d.supplier_alamat, '')}</p>
  <p>${teks(d.supplier_telepon, '')}</p>
</div>
<table>
  <thead><tr><th>No</th><th>Nama Produk</th><th>Satuan</th><th>Qty</th><th>Harga Beli</th><th>Subtotal</th></tr></thead>
  <tbody>
    ${baris}
    <tr class="total-row"><td colspan="5">TOTAL</td><td>${rupiah(d.total_nilai)}</td></tr>
  </tbody>
</table>
${d.catatan ? `<p><b>Catatan:</b> ${teks(d.catatan)}</p>` : ''}
<div class="ttd">
  <div class="ttd-box">
    <p>Hormat kami,</p>
    <div class="ttd-line"></div>
    <p><b>${teks(p.nama_apoteker, 'Apoteker')}</b></p>
    <p>SIPA: ${teks(p.nomor_sipa)}</p>
  </div>
  <div class="ttd-box">
    <p>Diterima oleh,</p>
    <div class="ttd-line"></div>
    <p><b>${teks(d.supplier_nama)}</b></p>
  </div>
</div>
</body></html>`
}

export type DataBuktiBayar = {
  nomor_faktur?: string | null
  nama_supplier?: string | null
  nomor_po?: string | null
  tanggal_faktur?: string | null
  tanggal_jatuh_tempo?: string | null
  tanggal_bayar?: string | null
  metode_bayar?: string | null
  catatan_bayar?: string | null
  total?: number | null
}

export function buktiPembayaranFaktur(p: ProfilApotek, d: DataBuktiBayar): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Bukti Pembayaran ${teks(d.nomor_faktur, '')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;font-size:12px;padding:40px;color:#000;background:#fff;}
.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
h1{font-size:16px;font-weight:bold;}
.apotek p{font-size:11px;color:#555;}
.divider{border-top:2px solid #000;margin:12px 0;}
.title{text-align:center;margin:8px 0 18px;}
.title h2{font-size:15px;letter-spacing:1px;}
.title p{font-size:11px;color:#666;}
table{width:100%;border-collapse:collapse;margin:6px 0;}
td{padding:6px 8px;vertical-align:top;}
.label{width:38%;color:#555;}
.val{font-weight:600;}
.total-box{margin-top:14px;background:#f4f4f4;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}
.total-box .l{font-size:12px;color:#555;}
.total-box .v{font-size:20px;font-weight:bold;}
.stamp{display:inline-block;border:2px solid #16a34a;color:#16a34a;font-weight:bold;padding:4px 14px;border-radius:6px;letter-spacing:2px;transform:rotate(-4deg);}
.ttd{margin-top:48px;display:flex;justify-content:flex-end;}
.ttd-box{text-align:center;}
.ttd-line{border-top:1px solid #000;width:200px;margin:56px auto 4px;}
.foot{margin-top:32px;font-size:10px;color:#999;text-align:center;}
</style></head><body>
<div class="head">
  <div class="apotek">
    <h1>${teks(p.nama_faskes ?? p.nama_apotek, 'Fasilitas')}</h1>
    <p>${teks(p.alamat, '')}</p>
    <p>SIA: ${teks(p.nomor_ijin)} | Telp: ${teks(p.nomor_telepon)}</p>
  </div>
  <div style="text-align:right;"><span class="stamp">LUNAS</span></div>
</div>
<div class="divider"></div>
<div class="title">
  <h2>BUKTI PEMBAYARAN FAKTUR</h2>
  <p>No. Faktur: ${teks(d.nomor_faktur)}</p>
</div>
<table>
  <tr><td class="label">Dibayarkan kepada</td><td class="val">${teks(d.nama_supplier)}</td></tr>
  <tr><td class="label">No. Purchase Order</td><td>${teks(d.nomor_po)}</td></tr>
  <tr><td class="label">Tanggal Faktur</td><td>${tanggalPanjang(d.tanggal_faktur)}</td></tr>
  <tr><td class="label">Jatuh Tempo</td><td>${tanggalPanjang(d.tanggal_jatuh_tempo)}</td></tr>
  <tr><td class="label">Tanggal Pembayaran</td><td class="val">${tanggalPanjang(d.tanggal_bayar)}</td></tr>
  <tr><td class="label">Metode Pembayaran</td><td>${teks(d.metode_bayar)}</td></tr>
  ${d.catatan_bayar ? `<tr><td class="label">Catatan</td><td>${teks(d.catatan_bayar)}</td></tr>` : ''}
</table>
<div class="total-box">
  <span class="l">Jumlah Dibayar</span>
  <span class="v">${rupiah(d.total)}</span>
</div>
<div class="ttd">
  <div class="ttd-box">
    <p>Penerima / Penanggung Jawab,</p>
    <div class="ttd-line"></div>
    <p><b>${teks(p.nama_apoteker)}</b></p>
  </div>
</div>
<div class="foot">Dokumen ini dicetak otomatis oleh Sehatera by Seawise Studio.</div>
</body></html>`
}

// ── Laporan SIPNAP ──

export type BarisSipnapMasuk  = { tgl: string; sumber: string; jml: number }
export type BarisSipnapKeluar = { tgl: string; resep: string; pasien: string; jml: number }

export type BarisSipnap = {
  nama: string
  satuan?: string | null
  awal: number
  masuk: BarisSipnapMasuk[]
  keluar: BarisSipnapKeluar[]
  batch: string[]
}

/**
 * Laporan penggunaan Narkotika / Psikotropika / Prekursor.
 *
 * Templat ini pindah ke sini dari dalam komponen dashboard, dan ikut dibetulkan
 * di jalan: sebelumnya nama obat, nama pasien, dan alamat pasien ditempel
 * mentah ke dalam HTML. Ketiganya diketik manusia. Satu tanda `<` atau `&`
 * pada nama pasien merusak sisa tabel pada dokumen yang justru paling tidak
 * boleh salah, karena ditandatangani apoteker penanggung jawab dan dikirim ke
 * Kementerian Kesehatan.
 */
export function laporanSipnap(
  p: ProfilApotek,
  d: { golongan: string; bulan: number; tahun: number },
  baris: BarisSipnap[],
): string {
  const judul = d.golongan === 'narkotika' ? 'NARKOTIKA'
              : d.golongan === 'psikotropika' ? 'PSIKOTROPIKA' : 'PREKURSOR'
  const namaBulan = new Date(d.tahun, d.bulan - 1, 1).toLocaleDateString('id-ID', { month: 'long' })
  const tglCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const isi = baris.map((b, idx) => {
    const masuk = b.masuk.reduce((a, r) => a + r.jml, 0)
    const keluar = b.keluar.reduce((a, r) => a + r.jml, 0)
    const totalP = b.awal + masuk
    const akhir = totalP - keluar
    const batchStr = b.batch.length ? b.batch.map(x => teks(x)).join('<br>') : '-'

    const n = Math.max(b.masuk.length, b.keluar.length, 1)
    let html = ''
    for (let i = 0; i < n; i++) {
      const m = b.masuk[i]
      const k = b.keluar[i]
      html += '<tr>'
      if (i === 0) {
        html += `<td rowspan="${n}" class="c">${idx + 1}</td>`
             +  `<td rowspan="${n}" class="l">${teks(b.nama)}</td>`
             +  `<td rowspan="${n}" class="c">${teks(b.satuan, '')}</td>`
             +  `<td rowspan="${n}" class="c">${b.awal}</td>`
      }
      html += `<td class="c">${m ? teks(m.tgl, '') : ''}</td>`
           +  `<td class="l">${m ? teks(m.sumber) : ''}</td>`
           +  `<td class="c">${m ? m.jml : ''}</td>`
      if (i === 0) html += `<td rowspan="${n}" class="c">${totalP}</td>`
      html += `<td class="c">${k ? teks(k.tgl, '') + '<br>' + teks(k.resep) : ''}</td>`
           +  `<td class="l">${k ? teks(k.pasien) : ''}</td>`
           +  `<td class="c">${k ? k.jml : ''}</td>`
      if (i === 0) {
        html += `<td rowspan="${n}" class="c">${akhir}</td>`
             +  `<td rowspan="${n}" class="l">${batchStr}</td>`
      }
      html += '</tr>'
    }
    return html
  }).join('')

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Laporan SIPNAP ${judul} ${namaBulan} ${d.tahun}</title><style>
@page { size: A4 landscape; margin: 12mm; }
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:10px;}
h1{text-align:center;font-size:15px;margin-bottom:16px;}
.info td{padding:1px 4px;font-size:11px;}
table.rep{width:100%;border-collapse:collapse;margin-top:8px;}
table.rep th, table.rep td{border:1px solid #000;padding:3px 5px;font-size:10px;}
table.rep th{text-align:center;font-weight:bold;}
.c{text-align:center;} .l{text-align:left;}
.sign{margin-top:40px;width:100%;overflow:hidden;}
.sign .box{width:280px;float:right;text-align:center;}
.sign .nm{font-weight:bold;text-decoration:underline;margin-top:56px;}
</style></head><body>
<h1>LAPORAN PENGGUNAAN ${judul}</h1>
<table class="info">
  <tr><td>Nama Sarana</td><td>: ${teks(p.nama_faskes ?? p.nama_apotek)}</td></tr>
  <tr><td>Alamat</td><td>: ${teks(p.alamat)}</td></tr>
  <tr><td>Bulan/Tahun</td><td>: ${namaBulan} ${d.tahun}</td></tr>
</table>
<table class="rep">
  <thead>
    <tr>
      <th rowspan="2">No</th><th rowspan="2">Nama Sediaan</th><th rowspan="2">Satuan</th><th rowspan="2">Persediaan Awal</th>
      <th colspan="3">Penerimaan</th>
      <th rowspan="2">Total Persediaan</th>
      <th colspan="3">Pengeluaran</th>
      <th rowspan="2">Persediaan Akhir Bulan</th>
      <th rowspan="2">No. Batch &amp; ED</th>
    </tr>
    <tr>
      <th>Tanggal</th><th>Sumber</th><th>Jumlah</th>
      <th>Tanggal/No. Resep</th><th>Nama /Alamat Pasien</th><th>Jumlah</th>
    </tr>
  </thead>
  <tbody>${isi}</tbody>
</table>
<div class="sign">
  <div class="box">
    <p>${p.kota ? teks(p.kota) + ', ' : ''}${tglCetak}</p>
    <p>Penanggung Jawab Farmasi</p>
    <p class="nm">${teks(p.nama_apoteker)}</p>
    <p>SIPA: ${teks(p.nomor_sipa)}</p>
  </div>
</div>
</body></html>`
}

// ── Struk penjualan ──

export type BarisStruk = { nama_obat?: string | null; jumlah?: number; harga_jual?: number; subtotal?: number }

export type DataStruk = {
  nomor_transaksi?: string | null
  created_at?: string | null
  total?: number
  bayar?: number
  kembalian?: number
  metode_bayar?: string | null
  nama_pasien?: string | null
  nomor_resep?: string | null
}

/**
 * Struk kasir, lebar 58mm (kertas termal yang paling umum di apotek kecil).
 *
 * Pindah ke sini dari dalam komponen kasir, dan ikut dibetulkan dua hal:
 * nama apotek serta nama obat dulu ditempel mentah ke HTML, dan waktunya
 * diambil dari `new Date()` alih-alih waktu transaksinya, jadi struk yang
 * dicetak ulang menunjukkan jam cetak, bukan jam penjualan.
 */
export function strukPenjualan(p: ProfilApotek, d: DataStruk, items: BarisStruk[]): string {
  const waktu = d.created_at ? new Date(d.created_at) : new Date()
  const baris = items.map(i => `
    <div style="margin:4px 0;">
      <div class="bold" style="font-size:11px;">${teks(i.nama_obat, '')}</div>
      <div class="row small">
        <span>${i.jumlah ?? 0} x ${rupiah(i.harga_jual)}</span>
        <span>${rupiah(i.subtotal)}</span>
      </div>
    </div>`).join('')

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Struk ${teks(d.nomor_transaksi, '')}</title><style>
@page { margin: 4mm; }
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Courier New',monospace;font-size:12px;padding:16px;width:300px;color:#000;background:#fff;}
h2{font-size:13px;text-align:center;font-weight:bold;margin-bottom:2px;}
p{text-align:center;font-size:10px;color:#555;margin:1px 0;}
.divider{border-top:1px dashed #999;margin:8px 0;}
.row{display:flex;justify-content:space-between;margin:2px 0;gap:8px;}
.bold{font-weight:bold;}
.small{font-size:10px;color:#555;}
</style></head><body>
<h2>${teks(p.nama_faskes ?? p.nama_apotek)}</h2>
<p>${teks(p.alamat, '')}</p>
${p.nomor_ijin ? `<p>SIA: ${teks(p.nomor_ijin)}</p>` : ''}
${p.nomor_telepon ? `<p>Telp: ${teks(p.nomor_telepon)}</p>` : ''}
<div class="divider"></div>
<div class="row small"><span>No.</span><span>${teks(d.nomor_transaksi, '')}</span></div>
<div class="row small"><span>Waktu</span><span>${waktu.toLocaleString('id-ID')}</span></div>
${d.nomor_resep ? `<div class="row small"><span>Resep</span><span>${teks(d.nomor_resep)}</span></div>` : ''}
${d.nama_pasien ? `<div class="row small"><span>Pasien</span><span>${teks(d.nama_pasien)}</span></div>` : ''}
<div class="divider"></div>
${baris}
<div class="divider"></div>
<div class="row bold"><span>TOTAL</span><span>${rupiah(d.total)}</span></div>
<div class="row small"><span>Bayar (${teks(d.metode_bayar, 'Tunai')})</span><span>${rupiah(d.bayar)}</span></div>
<div class="row small"><span>Kembalian</span><span>${rupiah(d.kembalian)}</span></div>
<div class="divider"></div>
<p style="margin-top:8px;">Terima kasih atas kunjungan Anda</p>
<p>Semoga lekas sembuh</p>
</body></html>`
}
