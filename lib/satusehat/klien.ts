/**
 * Pemanggil ReST API SatuSehat, dan pencarian pasien ke MPI.
 *
 * BERKAS INI HANYA UNTUK SISI SERVER. Ia menerima client secret sebagai
 * argumen, dan apa pun yang menyentuh secret tidak boleh ikut ke dalam bundel
 * peramban. Yang memanggilnya adalah Route Handler di `app/api/`, bukan
 * komponen.
 */

import { urlFhir, SYS, type Lingkungan } from './config'
import { ambilToken, lupakanToken } from './token'
import { bacaBadan, pesanOperationOutcome, type Keluaran } from './galat'

export type Kredensial = {
  clientId: string
  clientSecret: string
  organizationId: string
}

export type Konteks = {
  /** Pemisah simpanan token: satu faskes, satu lingkungan. */
  kunci: string
  lingkungan: Lingkungan
  kredensial: Kredensial
}

/**
 * Satu panggilan FHIR, dengan SATU kali coba ulang khusus untuk 401.
 *
 * 401 di tengah jalan hampir selalu berarti tokennya kedaluwarsa lebih cepat
 * dari yang dikatakan `expires_in`, bukan berarti kredensialnya salah. Membuang
 * simpanan lalu mencoba sekali lagi menyelesaikannya tanpa melibatkan antrean.
 * Cuma SEKALI: kredensial yang benar-benar salah akan menjawab 401 lagi, dan
 * mengulang tanpa batas berarti berbaris masuk ke rate limit.
 */
export async function panggil<T = unknown>(
  k: Konteks,
  resource: string,
  init: RequestInit = {},
  sudahCobaUlang = false,
): Promise<Keluaran<T>> {
  const t = await ambilToken(k.kunci, k.lingkungan, k.kredensial.clientId, k.kredensial.clientSecret)
  if (!t.ok) return t

  let r: Response
  try {
    r = await fetch(urlFhir(k.lingkungan, resource), {
      ...init,
      headers: {
        Authorization: `Bearer ${t.data}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    })
  } catch (e) {
    return { ok: false, pesan: `Tidak bisa menghubungi SatuSehat: ${(e as Error).message}`, status: 0 }
  }

  if (r.status === 401 && !sudahCobaUlang) {
    lupakanToken(k.kunci)
    return panggil<T>(k, resource, init, true)
  }

  const badan = await bacaBadan(r)
  if (!r.ok) {
    return { ok: false, pesan: pesanOperationOutcome(badan, r.status), status: r.status, mentah: badan }
  }
  return { ok: true, data: badan as T, status: r.status }
}

type Bundle = {
  total?: number
  entry?: { resource?: { id?: string; name?: { text?: string }[]; gender?: string; birthDate?: string } }[]
}

export type PasienIhs = {
  ihs: string
  nama?: string
  gender?: string
  tanggalLahir?: string
}

/**
 * Mencari nomor IHS pasien lewat NIK.
 *
 * Pasien TIDAK dibuat sendiri: SatuSehat mewajibkan pencocokan lewat MPI, dan
 * membuat Patient baru untuk orang yang sudah ada di sana melahirkan dua nomor
 * IHS untuk satu manusia. Yang boleh dilakukan sistem klinik cuma mencari lalu
 * memakai nomor yang ditemukan.
 *
 * Tiga jawaban yang berbeda artinya, dan ketiganya harus bisa dibedakan
 * pemanggil: KETEMU, TIDAK ADA di MPI, dan GAGAL menanyakan. Yang ketiga
 * dilaporkan sebagai galat, bukan sebagai "tidak ada", karena jaringan yang
 * putus bukan bukti bahwa orangnya belum terdaftar.
 */
export async function cariPasienByNik(k: Konteks, nik: string): Promise<Keluaran<PasienIhs | null>> {
  const bersih = (nik || '').replace(/\D/g, '')
  if (bersih.length !== 16) {
    return { ok: false, pesan: 'NIK harus 16 angka sebelum bisa dicari ke SatuSehat.', status: 0 }
  }

  // Nilai `identifier` berbentuk "<system>|<nilai>", dan pemisah "|" itu bagian
  // dari sintaks pencarian FHIR. URLSearchParams menyandikannya jadi %7C, dan
  // contoh resmi memakai keduanya, jadi biarkan ia menyandikan.
  const q = new URLSearchParams({ identifier: `${SYS.nik}|${bersih}` })
  const hasil = await panggil<Bundle>(k, `Patient?${q.toString()}`, { method: 'GET' })
  if (!hasil.ok) return hasil

  const entri = hasil.data?.entry?.[0]?.resource
  if (!entri?.id) return { ok: true, data: null, status: hasil.status }

  return {
    ok: true,
    status: hasil.status,
    data: {
      ihs: entri.id,
      nama: entri.name?.[0]?.text,
      gender: entri.gender,
      tanggalLahir: entri.birthDate,
    },
  }
}

/**
 * Mencari nomor IHS TENAGA KESEHATAN lewat NIK.
 *
 * Bentuknya sama persis dengan pencarian pasien, dan itu bukan kebetulan:
 * dokter Indonesia SUDAH terdaftar di SatuSehat dari data STR, jadi yang bisa
 * dilakukan sistem klinik cuma menanyakan nomornya. Resource Practitioner
 * memang tidak punya jalur penambahan data sama sekali di katalog ReST-nya,
 * hanya Pencarian dan Detail.
 *
 * Karena itu "mendaftarkan dokter ke SatuSehat" tidak pernah jadi pekerjaan
 * siapa pun di klinik. Yang perlu diisi cuma NIK-nya di Sehatera, dan itu
 * kolom yang sudah ada sejak migrasi 0018.
 */
export async function cariPractitionerByNik(k: Konteks, nik: string): Promise<Keluaran<PasienIhs | null>> {
  const bersih = (nik || '').replace(/\D/g, '')
  if (bersih.length !== 16) {
    return { ok: false, pesan: 'NIK tenaga kesehatan harus 16 angka sebelum bisa dicari ke SatuSehat.', status: 0 }
  }
  const q = new URLSearchParams({ identifier: `${SYS.nik}|${bersih}` })
  const hasil = await panggil<Bundle>(k, `Practitioner?${q.toString()}`, { method: 'GET' })
  if (!hasil.ok) return hasil

  const entri = hasil.data?.entry?.[0]?.resource
  if (!entri?.id) return { ok: true, data: null, status: hasil.status }
  return {
    ok: true,
    status: hasil.status,
    data: { ihs: entri.id, nama: entri.name?.[0]?.text, gender: entri.gender, tanggalLahir: entri.birthDate },
  }
}

/**
 * Membuat Location untuk satu poli, lalu mengembalikan nomornya.
 *
 * Berbeda dari Patient dan Practitioner: Location memang BELUM ADA di sana,
 * dan kita yang membuatnya. Poli adalah ruangan di dalam klinik ini, dan tidak
 * ada daftar nasional yang sudah memuatnya.
 */
export async function buatLocation(k: Konteks, payload: Record<string, unknown>): Promise<Keluaran<string>> {
  const hasil = await panggil<{ id?: string }>(k, 'Location', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!hasil.ok) return hasil
  if (!hasil.data?.id) {
    return { ok: false, pesan: `${hasil.status}: Location dibuat tapi jawabannya tanpa id.`, status: hasil.status }
  }
  return { ok: true, data: hasil.data.id, status: hasil.status }
}
