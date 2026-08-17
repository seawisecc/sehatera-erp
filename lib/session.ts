import { supabase } from './supabase'
import { readPlanFeatures } from './plan'
import { bacaSektor } from './faskes'
import type { CompanyContext } from './subscription'

/**
 * Identitas, peran, hak akses modul, dan keadaan langganan: satu panggilan.
 *
 * Sebelumnya aplikasi menembak tiga tabel berturut-turut saat masuk dashboard:
 * `super_admins`, lalu `companies`, lalu `app_users`. Yang pertama memaksa
 * tabel super admin bisa dibaca siapa saja yang login, dan itulah asal lubang
 * yang ditutup di migrasi 0002. Fungsi `my_context()` di database menggantikan
 * ketiganya tanpa membuka satu pun tabel platform.
 */
export type SessionContext = {
  signedIn: boolean
  email: string | null
  isSuper: boolean
  role: string | null
  /** Daftar id modul yang boleh dibuka. null = pakai bawaan role. */
  modules: string[] | null
  memberStatus: string | null
  company: CompanyContext | null
}

/**
 * Tempat token undangan dititipkan selama menunggu konfirmasi email.
 *
 * Ada di sini, bukan di halaman undangannya, karena yang menuliskan dan yang
 * membacanya adalah dua halaman berbeda yang dipisah oleh satu tab yang
 * ditutup dan satu tautan di kotak masuk.
 */
export const KUNCI_UNDANGAN = 'sw_undangan_token'

export const SESSION_KOSONG: SessionContext = {
  signedIn: false,
  email: null,
  isSuper: false,
  role: null,
  modules: null,
  memberStatus: null,
  company: null,
}

export async function getSessionContext(): Promise<SessionContext> {
  const { data, error } = await supabase.rpc('my_context')
  if (error || !data || !(data as any).signedIn) return SESSION_KOSONG

  const raw = data as any
  const c = raw.company

  return {
    signedIn: true,
    email: raw.email ?? null,
    isSuper: raw.isSuper === true,
    role: raw.role ?? null,
    modules: Array.isArray(raw.modules) && raw.modules.length ? raw.modules : null,
    memberStatus: raw.memberStatus ?? null,
    company: c
      ? {
          id: c.id,
          nama: c.nama,
          status: c.status,
          theme: c.theme ?? null,
          sektor: bacaSektor(c.sektor),
          trialEndsAt: c.trialEndsAt ?? null,
          subscriptionEndsAt: c.subscriptionEndsAt ?? null,
          planCode: c.planCode ?? null,
          planName: c.planName ?? null,
          planPriceMonthly: c.planPriceMonthly ?? null,
          features: readPlanFeatures(c.features),
        }
      : null,
  }
}

/** Pesan penolakan dari database yang sudah ditulis untuk pemilik apotek. */
const KODE_RAMAH = new Set(['SH001', 'SH002', 'SH003', 'SH004', 'SH005', 'SH006'])

/**
 * Kuota, masa aktif, dan kewajiban resep ditolak di database dengan SQLSTATE
 * tersendiri, dan pesannya memang ditulis untuk dibaca pemilik apotek. Yang
 * lain: pelanggaran constraint, jaringan putus: tidak boleh muncul apa
 * adanya: "duplicate key value violates unique constraint" bukan kalimat yang
 * bisa ditindaklanjuti siapa pun di balik meja kasir.
 */
export function pesanError(error: { code?: string; message?: string } | null): string {
  if (!error) return ''
  if (error.code && KODE_RAMAH.has(error.code)) return error.message || ''
  return `Gagal menyimpan. Coba lagi sebentar lagi. (${error.code || 'tidak diketahui'})`
}
