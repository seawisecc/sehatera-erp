import type { PlanFeatures } from './plan'

/**
 * Keadaan langganan dari sudut pandang PEMILIK APOTEK.
 *
 * Sengaja dihitung ulang di sini, bukan memanggil `company_is_active()` di
 * database: fungsi itu menerima id apotek apa pun sehingga hak panggilnya
 * dicabut dari `authenticated` (lihat migrasi 0003). Aturannya harus PERSIS
 * sama dengan `company_lapsed_at()`: kalau keduanya berbeda, apotek melihat
 * "aman" di layar lalu ditolak saat menekan Proses Transaksi, dan itu terjadi
 * di depan pembeli yang sedang antre.
 */
export type CompanyContext = {
  id: string
  nama: string
  status: 'trial' | 'active' | 'suspended' | 'inactive'
  theme: string | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  planCode: string | null
  planName: string | null
  planPriceMonthly: number | null
  features: PlanFeatures
}

export type SubscriptionState =
  | { kind: 'ok' }
  | { kind: 'ending'; reason: 'trial' | 'paid'; sisaHari: number; berakhir: Date }
  | { kind: 'lapsed'; reason: 'trial' | 'paid' | 'suspended'; berakhir: Date | null }

/** Sejak berapa hari sebelum habis apotek mulai diingatkan. */
const HARI_PERINGATAN = 7

/**
 * Selisih HARI KALENDER, bukan selisih jam.
 *
 * Orang menghitung tanggal: langganan yang habis lusa harus berbunyi "2 hari
 * lagi", bukan "1 hari" karena jamnya kurang beberapa menit dari 48.
 */
function sisaHariKalender(berakhir: Date): number {
  const akhir = new Date(berakhir.toLocaleDateString('en-CA') + 'T00:00:00').getTime()
  const kini = new Date(new Date().toLocaleDateString('en-CA') + 'T00:00:00').getTime()
  return Math.round((akhir - kini) / 864e5)
}

export function subscriptionState(company: CompanyContext | null): SubscriptionState {
  if (!company) return { kind: 'ok' }

  if (company.status === 'suspended' || company.status === 'inactive') {
    return { kind: 'lapsed', reason: 'suspended', berakhir: null }
  }

  // STATUS yang menentukan tanggal mana yang berlaku, sama persis dengan
  // `company_lapsed_at()`. Apotek trial tidak dikunci oleh subscriptionEndsAt,
  // dan sebaliknya: kalau tidak, apotek yang naik dari trial ke berbayar akan
  // membawa tanggal trial lamanya dan langsung terkunci di hari ia membayar.
  const iso = company.status === 'trial' ? company.trialEndsAt : company.subscriptionEndsAt
  const reason: 'trial' | 'paid' = company.status === 'trial' ? 'trial' : 'paid'

  // Tanpa tanggal akhir dianggap aktif: jangan pernah mengunci apotek hanya
  // karena kolomnya belum pernah diisi.
  if (!iso) return { kind: 'ok' }

  const berakhir = new Date(iso)
  if (Number.isNaN(berakhir.getTime())) return { kind: 'ok' }

  if (berakhir <= new Date()) return { kind: 'lapsed', reason, berakhir }

  const sisaHari = sisaHariKalender(berakhir)
  if (sisaHari <= HARI_PERINGATAN) return { kind: 'ending', reason, sisaHari, berakhir }

  return { kind: 'ok' }
}

/** true kalau apotek sedang tidak boleh membuat transaksi baru. */
export const isLapsed = (s: SubscriptionState) => s.kind === 'lapsed'

/** Kalimat untuk spanduk di atas layar. Ditulis untuk pemilik apotek. */
export function pesanLangganan(
  s: SubscriptionState,
  t: (id: string, en: string) => string,
): { nada: 'info' | 'peringatan' | 'berhenti'; judul: string; isi: string } | null {
  if (s.kind === 'ok') return null

  if (s.kind === 'ending') {
    const n = s.sisaHari
    const hari = n <= 0 ? t('hari ini', 'today') : `${n} ${t('hari lagi', 'more days')}`
    return {
      nada: n <= 3 ? 'peringatan' : 'info',
      judul:
        s.reason === 'trial'
          ? t(`Masa coba berakhir ${hari}`, `Free trial ends ${hari}`)
          : t(`Langganan berakhir ${hari}`, `Subscription ends ${hari}`),
      isi: t(
        'Data Anda tetap utuh setelahnya. Yang berhenti hanya penerimaan transaksi baru di kasir.',
        'Your data stays intact afterwards. Only new sales at the register stop.',
      ),
    }
  }

  return {
    nada: 'berhenti',
    judul:
      s.reason === 'suspended'
        ? t('Akses apotek ini ditangguhkan', 'This pharmacy’s access is suspended')
        : s.reason === 'trial'
          ? t('Masa coba sudah berakhir', 'The free trial has ended')
          : t('Masa aktif langganan sudah berakhir', 'The subscription has ended'),
    isi: t(
      'Semua data Anda aman dan tetap bisa dibuka, dicetak, dan dilaporkan, termasuk SIPNAP. Yang berhenti hanya transaksi baru, sampai langganan diaktifkan kembali.',
      'All your data is safe and still readable, printable, and reportable, including SIPNAP. Only new sales stop, until the subscription is reactivated.',
    ),
  }
}
