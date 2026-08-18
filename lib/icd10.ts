/**
 * Terminologi diagnosis dan tindakan.
 *
 * Berkas ini dulu MEMUAT daftarnya: 49 diagnosis susunan saya sendiri, dengan
 * peringatan panjang di header bahwa itu saran cepat dan bukan rujukan resmi.
 * Peringatan itu sudah tidak berlaku dan daftarnya sudah tidak di sini.
 *
 * Sejak migrasi 0025 sampai 0029, sumbernya berkas e-klaim Kemenkes yang
 * tersimpan di database: 18.543 kode ICD-10 dan 4.626 kode ICD-9-CM, versi
 * 2010, daftar yang sama persis dipakai INA-CBG menilai klaim.
 *
 * Pencariannya di DATABASE, bukan di sini, dan itu bukan pilihan gaya: 18.543
 * baris berarti sekitar 1 MB JavaScript yang harus diunduh tiap orang yang
 * membuka aplikasi ini, untuk menampilkan delapan baris hasil.
 *
 * 49 nama Indonesia yang dulu jadi seluruh isi berkas ini tidak dibuang.
 * Mereka pindah ke tabel `icd10_alias` sebagai jalan pintas mengetik, karena
 * berkas Kemenkes seluruhnya bahasa Inggris dan dokter di sini mencari
 * "demam tifoid", bukan "Typhoid fever".
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type SaranICD = {
  kode: string
  nama: string
  /** Nama Indonesianya, kalau kode ini punya alias. */
  nama_id?: string | null
  terverifikasi?: boolean
}

export type SaranICD9 = { kode: string; nama: string }

/**
 * Penyaring BENTUK, bukan penyaring kebenaran. Sama seperti di migrasi 0018:
 * yang ditangkap di sini salah ketik, bukan kode yang tidak ada.
 */
export const BENTUK_ICD10 = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/

/**
 * Tiga angka di belakang titik, bukan dua. Berkas Kemenkes memuat 93.960, dan
 * kalau batasnya dua angka satu-satunya kode itu tidak akan pernah bisa
 * dimasukkan.
 */
export const BENTUK_ICD9 = /^[0-9]{2}(\.[0-9]{1,3})?$/

/** Nama yang sebaiknya dipakai: Indonesia kalau ada, kalau tidak yang resmi. */
export function namaTerbaik(s: SaranICD): string {
  return s.nama_id?.trim() || s.nama
}

export async function cariICD(q: string, batas = 20): Promise<SaranICD[]> {
  const s = q.trim()
  if (!s) return []
  const { data, error } = await supabase.rpc('cari_icd10', { p_q: s, p_batas: batas })
  if (error) return []
  return (data ?? []) as SaranICD[]
}

export async function cariICD9(q: string, batas = 20): Promise<SaranICD9[]> {
  const s = q.trim()
  if (!s) return []
  const { data, error } = await supabase.rpc('cari_icd9', { p_q: s, p_batas: batas })
  if (error) return []
  return (data ?? []) as SaranICD9[]
}

/**
 * Pencarian yang menunggu orangnya berhenti mengetik.
 *
 * Tanpa jeda ini, "faringitis" berangkat sepuluh kali ke database dan jawaban
 * yang datang belakangan belum tentu jawaban untuk ketikan yang terakhir:
 * kotak hasil bisa berkedip mundur ke hasil huruf sebelumnya. Penghitung
 * `urutan` di bawah yang menahannya, bukan jedanya.
 */
export function usePencarianICD<T>(
  q: string,
  cari: (q: string) => Promise<T[]>,
  jeda = 250,
): { hasil: T[]; sibuk: boolean } {
  const [hasil, setHasil] = useState<T[]>([])
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    const s = q.trim()
    if (!s) { setHasil([]); setSibuk(false); return }
    setSibuk(true)
    let hidup = true
    const jam = setTimeout(async () => {
      const r = await cari(s)
      if (!hidup) return
      setHasil(r)
      setSibuk(false)
    }, jeda)
    return () => { hidup = false; clearTimeout(jam) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, jeda])

  return { hasil, sibuk }
}

export const KESADARAN = [
  'Compos mentis', 'Apatis', 'Somnolen', 'Sopor', 'Coma',
]

export const STATUS_PULANG: { nilai: string; nama: string }[] = [
  { nilai: 'berobat_jalan', nama: 'Berobat jalan' },
  { nilai: 'rujuk',         nama: 'Dirujuk' },
  { nilai: 'rawat_inap',    nama: 'Rawat inap' },
  { nilai: 'meninggal',     nama: 'Meninggal' },
]
