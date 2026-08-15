/**
 * Baca dan tulis CSV.
 *
 * Dipisah dari halaman karena tidak menyentuh state apa pun — dan karena
 * pembaca CSV yang benar itu lebih halus daripada kelihatannya. Yang di sini
 * menangani tanda kutip, koma di dalam nilai, dan kutip ganda yang di-escape;
 * `text.split(',')` tidak, dan katalog obat yang mengandung "Amoxicillin 500
 * mg, kaplet" akan terpotong jadi dua kolom tanpa ada yang mengeluh.
 */

/** Baris CSV jadi objek, memakai baris pertama sebagai nama kolom. */
export function parseCSV(text: string): Record<string, string>[] {
  text = text.replace(/\r\n?/g, '\n')
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQ = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      // Dua kutip berturut-turut di dalam kutip berarti satu kutip harfiah.
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false
      } else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { cur.push(field); field = '' }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
    else field += c
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur) }

  const header = (rows.shift() || []).map((h) => h.trim())
  return rows
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const o: Record<string, string> = {}
      header.forEach((h, i) => { o[h] = (r[i] ?? '').trim() })
      return o
    })
}

/**
 * Unduh baris sebagai berkas CSV.
 *
 * Diawali BOM UTF-8 (`﻿`) dengan sengaja: tanpa itu Excel di Windows
 * membaca berkasnya sebagai ANSI, dan nama obat berhuruf non-ASCII berantakan
 * di layar apoteker yang membukanya.
 */
export function unduhCSV(namaBerkas: string, headers: string[], baris: string[][]) {
  const esc = (v: string) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v)
  const isi = [headers.join(','), ...baris.map((r) => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaBerkas
  a.click()
  URL.revokeObjectURL(url)
}
