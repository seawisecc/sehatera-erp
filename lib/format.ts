/**
 * Format angka dan tanggal.
 *
 * Sebelum berkas ini ada, `toLocaleString('id-ID')` ditulis ulang 63 kali di
 * dalam monolit. Itu bukan sekadar pengulangan: beberapa tempat menulis
 * "Rp 12.000", sebagian "Rp12.000", dan yang lain lupa menangani null sehingga
 * tercetak "Rp NaN" di struk. Satu tempat, satu bentuk.
 */

/** 12000 -> "12.000". Null dan NaN jadi "0", bukan "NaN". */
export function angka(n: number | null | undefined): string {
  const v = Number(n)
  return (Number.isFinite(v) ? v : 0).toLocaleString('id-ID')
}

/** 12000 -> "Rp 12.000". Dipakai di layar; dokumen cetak punya formatnya sendiri. */
export function rupiah(n: number | null | undefined): string {
  return 'Rp ' + angka(n)
}

/** 12345.678 -> "12.345,68". Untuk stok pecahan dan persentase. */
export function desimal(n: number | null | undefined, digit = 2): string {
  const v = Number(n)
  return (Number.isFinite(v) ? v : 0).toLocaleString('id-ID', {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  })
}

/** ISO -> "17 Agu 2026". String kosong jika tanggalnya tidak ada. */
export function tanggal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** ISO -> "17 Agu 2026, 14:30". */
export function tanggalJam(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

/** ISO atau Date -> "14:30". Untuk penanda "terakhir disegarkan". */
export function jam(nilai: string | Date | null | undefined): string {
  if (!nilai) return ''
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Date -> "2026-08-17" menurut jam DINDING, bukan menurut UTC.
 *
 * `toISOString()` menggeser ke UTC lebih dulu, dan Indonesia ada di depan UTC:
 * di WITA, tengah malam sampai jam delapan pagi masih terbaca sebagai HARI
 * KEMARIN. Itu membuat rentang laporan yang bawaannya "sampai hari ini"
 * berhenti kemarin, dan nilai bawaan "awal bulan" tertulis tanggal 31 bulan
 * sebelumnya. Tidak ada yang gagal; angkanya cuma kurang satu hari.
 */
export function tanggalLokal(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Hari pertama bulan berjalan, bentuk <input type="date">. */
export function awalBulanIni(d: Date = new Date()): string {
  return tanggalLokal(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** ISO -> "2026-08-17", bentuk yang dipakai <input type="date">. */
export function tanggalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return tanggalLokal(d)
}
