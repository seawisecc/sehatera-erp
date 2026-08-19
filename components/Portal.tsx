'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Memindahkan isinya ke `document.body`.
 *
 * Dipakai oleh jendela dialog, dan alasannya bukan kerapian.
 *
 * `position: fixed` diukur dari viewport, KECUALI kalau ada leluhur yang
 * memasang `transform`, `filter`, atau `backdrop-filter`: yang begitu menjadi
 * containing block baru, dan `fixed inset-0` mendadak berarti "sebesar kartu
 * itu", bukan "sebesar layar". Kartu di halaman Pengaturan memakai
 * `backdrop-blur-sm`, jadi tiap dialog di dalamnya ikut tergeser mengikuti
 * gulungan halaman: bagian atasnya, tempat tombol tutup dan kotak pertama
 * berada, bisa berada di luar layar tergantung posisi gulungan saat dibuka.
 *
 * Tidak ada yang gagal, tidak ada galat, dan build lolos. Ketahuannya cuma
 * dengan membuka dialognya sungguhan di peramban.
 *
 * Dirender setelah terpasang, bukan saat render pertama, karena `document`
 * tidak ada saat halaman disusun di server.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [siap, setSiap] = useState(false)
  useEffect(() => { setSiap(true) }, [])
  if (!siap) return null
  return createPortal(children, document.body)
}
