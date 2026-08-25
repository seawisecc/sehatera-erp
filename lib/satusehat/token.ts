/**
 * Token OAuth2 SatuSehat, dan kenapa ia WAJIB disimpan.
 *
 * Bentuk permintaannya tidak biasa dan mudah salah kalau ditulis dari ingatan:
 * `grant_type` ada di QUERY STRING, sedangkan `client_id` dan `client_secret`
 * ada di BODY ber-`application/x-www-form-urlencoded`. Bukan Basic auth, dan
 * bukan JSON.
 *
 * Menyimpan tokennya BUKAN penghematan, melainkan syarat. Dokumen Akses Token
 * menyebut rate limit yang menghukum dua hal sekaligus: salah client_secret
 * satu kali per menit, DAN membuat token baru terlalu sering dalam satu menit.
 * Pengirim antrean yang meminta token baru untuk tiap baris akan memukul
 * dirinya sendiri ke dalam batas itu pada baris kedua.
 *
 * Simpanannya di MEMORI PROSES, bukan di database. Alasannya sederhana: token
 * hidup 3599 detik dan ia rahasia. Menaruhnya di tabel berarti menambah satu
 * tempat lagi yang bocor kalau RLS salah, padahal Vault sudah dipilih justru
 * untuk mengurangi tempat semacam itu. Konsekuensinya diterima: proses yang
 * baru dingin mengambil token baru, dan itu satu panggilan, bukan seribu.
 */

import { urlToken, type Lingkungan } from './config'
import { bacaBadan, pesanOperationOutcome, type Keluaran } from './galat'

type Simpanan = { token: string; kedaluwarsa: number }

const simpanan = new Map<string, Simpanan>()

/**
 * Diambil 60 detik SEBELUM benar-benar kedaluwarsa.
 *
 * Token yang dipakai pada detik terakhir masa hidupnya akan sampai di server
 * Kemenkes sesudah lewat, dan yang terjadi adalah 401 yang terlihat seperti
 * kredensial salah. Satu menit itu jarak yang cukup untuk permintaan yang
 * lambat sekalipun.
 */
const AMBANG_DETIK = 60

export function lupakanToken(kunci: string) {
  simpanan.delete(kunci)
}

/**
 * Token untuk satu faskes di satu lingkungan.
 *
 * `kunci` memisahkan simpanan antar faskes DAN antar lingkungan. Satu proses
 * melayani banyak klinik, dan token klinik lain adalah token yang salah, bukan
 * token yang kurang baru.
 */
export async function ambilToken(
  kunci: string,
  lingkungan: Lingkungan,
  clientId: string,
  clientSecret: string,
): Promise<Keluaran<string>> {
  const ada = simpanan.get(kunci)
  if (ada && ada.kedaluwarsa > Date.now()) {
    return { ok: true, data: ada.token, status: 200 }
  }

  let r: Response
  try {
    r = await fetch(urlToken(lingkungan), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
      cache: 'no-store',
    })
  } catch (e) {
    // Kegagalan jaringan bukan kegagalan kredensial, dan bedanya penting: yang
    // pertama layak dicoba lagi, yang kedua tidak akan pernah berhasil.
    return { ok: false, pesan: `Tidak bisa menghubungi SatuSehat: ${(e as Error).message}`, status: 0 }
  }

  const badan = await bacaBadan(r)
  if (!r.ok) {
    return { ok: false, pesan: pesanOperationOutcome(badan, r.status), status: r.status, mentah: badan }
  }

  const j = badan as { access_token?: string; expires_in?: string | number } | null
  if (!j?.access_token) {
    return { ok: false, pesan: `${r.status}: jawaban token tanpa access_token`, status: r.status, mentah: badan }
  }

  // `expires_in` datang sebagai STRING ("3599") di contoh dokumennya, walaupun
  // tabel struktur datanya menyebut number. Yang ditulis dokumen dan yang
  // dikirim server tidak selalu sama, jadi keduanya diterima.
  const detik = Number(j.expires_in) || 3599
  simpanan.set(kunci, {
    token: j.access_token,
    kedaluwarsa: Date.now() + Math.max(detik - AMBANG_DETIK, 30) * 1000,
  })
  return { ok: true, data: j.access_token, status: r.status }
}
