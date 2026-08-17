import { redirect } from 'next/navigation'

/**
 * Alamat lama.
 *
 * Selama pemecahan, seluruh aplikasi hidup di berkas ini: 4.969 baris berisi
 * sebelas modul, halaman super admin, dan semua modalnya, dibedakan oleh satu
 * string di `useState`. Sekarang tiap modul punya alamatnya sendiri di
 * `app/(app)/`, dan yang tersisa di sini hanya pengalihan, supaya tautan,
 * penanda halaman, dan tab yang sudah terlanjur terbuka tetap mendarat di
 * tempat yang benar.
 */
export default function Dashboard() {
  redirect('/beranda')
}
