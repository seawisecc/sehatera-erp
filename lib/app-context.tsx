'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getSessionContext, pesanError, KUNCI_UNDANGAN, type SessionContext } from './session'
import { FULL_PLAN, lockedModules, type PlanFeatures } from './plan'
import { subscriptionState, isLapsed, pesanLangganan, type SubscriptionState } from './subscription'
import { menuItems, ROLE_PAGES } from './navigation'
import { bacaSektor, istilah, MODUL_SEKTOR, type Sektor } from './faskes'
import { useLang } from './i18n'
import { useTheme } from './theme'

/**
 * State yang dipakai bersama oleh SEMUA halaman.
 *
 * Ini keluar dari `app/dashboard/page.tsx` lebih dulu, sebelum satu modul pun
 * dipindah ke rutenya sendiri. Alasannya terbaca dari peta monolitnya:
 * `settingsData` dibaca delapan modul, `companies` dipakai pemilih apotek di
 * topbar sekaligus halaman Klien, dan `superViewCompany` menyaring hampir semua
 * kueri. Memindahkan modul lebih dulu tanpa memindahkan ini berarti tiap rute
 * mengambil ulang data yang sama, lalu perlahan tidak sepakat isinya.
 *
 * Sengaja tetap client component. Pola TokoKu (Server Component + server
 * action) lebih baik, tapi seluruh lapisan data di sini memanggil Supabase dari
 * peramban; menukar keduanya sekaligus berarti mengubah routing DAN cara ambil
 * data dalam satu langkah, tanpa satu pun tes untuk menangkap kalau ada yang
 * salah. Routing dulu, lapisan data belakangan.
 */
export type AppState = {
  /** false selama sesi belum selesai dibaca. Jangan render menu sebelum ini true. */
  siap: boolean

  session: SessionContext | null
  isSuper: boolean
  currentRole: string | null
  authName: string

  /** Profil apotek. Dibaca struk, laporan SIPNAP, dokumen cetak, dan Pengaturan. */
  settingsData: any
  setSettingsData: React.Dispatch<React.SetStateAction<any>>
  muatSettings: () => Promise<void>

  /** Super admin: daftar apotek, dan yang sedang "diintip". */
  companies: any[]
  muatCompanies: () => Promise<void>
  superViewCompany: string
  setSuperViewCompany: (v: string) => void

  /**
   * Penyaring apotek untuk setiap kueri.
   *
   * Di monolit ini bernama `scopeQ` dan dipakai 20 tempat. Ia harus hidup di
   * sini, bukan di tiap halaman: kalau satu halaman lupa memakainya, super
   * admin yang sedang mengintip satu apotek diam-diam melihat data semua
   * apotek, dan tidak ada yang memberi tahu.
   */
  scope: <T>(q: T) => T
  /** company_id untuk INSERT, kosong kecuali super admin sedang mengintip. */
  cid: () => Record<string, string>

  /** Modul yang boleh dibuka: hak akses pengguna, lalu disaring paket. */
  allowedPages: string[]
  fitur: PlanFeatures
  langganan: {
    state: SubscriptionState
    pesan: ReturnType<typeof pesanLangganan>
    terkunci: boolean
  }

  /** Nama yang tampil di sidebar, topbar, dan menu akun. */
  namaFaskes: string

  /**
   * Jenis fasilitas: apotek, klinik, atau rumah sakit.
   *
   * Menentukan menu mana yang ADA. Paket menentukan menu mana yang DIBUKA.
   * Keduanya sengaja terpisah: apotek berpaket Enterprise tetap tidak melihat
   * Antrian Pasien, karena ia memang tidak punya antrian pasien, bukan karena
   * paketnya kurang.
   */
  sektor: Sektor
  /** Satu kata istilah yang mengikuti jenis fasilitas dan bahasa yang dipakai. */
  kata: (kunci: 'faskes' | 'pelanggan' | 'penanggungJawab' | 'izin') => string
}

const Ctx = createContext<AppState | null>(null)

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp dipakai di luar AppProvider')
  return v
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLang()
  const { applyCompanyTheme } = useTheme()

  const [siap, setSiap] = useState(false)
  const [session, setSession] = useState<SessionContext | null>(null)
  const [isSuper, setIsSuper] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [currentModules, setCurrentModules] = useState<string[] | null>(null)
  const [authName, setAuthName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [settingsData, setSettingsData] = useState<any>({
    nama_faskes: '', nama_apotek: '', alamat: '', nomor_ijin: '', nomor_telepon: '',
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [superViewCompany, setSuperViewCompany] = useState('')

  const scope = <T,>(q: T): T =>
    (isSuper && superViewCompany ? (q as any).eq('company_id', superViewCompany) : q) as T

  const cid = (): Record<string, string> =>
    isSuper && superViewCompany ? { company_id: superViewCompany } : {}

  const muatSettings = async () => {
    // Super admin tanpa apotek terpilih melihat SEMUA apotek; mengambil satu
    // baris settings di keadaan itu berarti menampilkan profil apotek acak.
    if (isSuper && !superViewCompany) return
    const { data } = await scope(supabase.from('settings').select('*')).maybeSingle()
    if (data) setSettingsData(data)
  }

  const muatCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*, plans(code, name, price_monthly)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setCompanies(data || [])
  }

  // ── Sesi ──
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setAuthName((user.user_metadata as any)?.nama_lengkap || user.email || '')

      let ctx = await getSessionContext()
      if (!ctx.signedIn) { window.location.href = '/'; return }

      // Pendaftaran dan undangan yang tertunda karena konfirmasi email
      // diselesaikan di sini. Keduanya bermuara pada keadaan yang sama: orang
      // sudah punya akun tapi belum terhubung ke apotek mana pun, karena
      // langkah keduanya terjadi di tab yang sudah lama ditutup.
      if (!ctx.isSuper && !ctx.company) {
        const meta = (user.user_metadata as any) || {}
        let token: string | null = meta.undangan_token || null
        if (!token) { try { token = localStorage.getItem(KUNCI_UNDANGAN) } catch {} }

        if (meta.nama_apotek) {
          // Sektor ikut dari metadata akun. Kalau tidak, orang yang mendaftar
          // sebagai klinik lalu kembali lewat tautan konfirmasi email akan
          // mendarat sebagai apotek, dan menu klinik yang ia pilih tidak pernah
          // muncul. Bawaan 'apotek' hanya untuk akun lama yang metadatanya
          // memang belum punya kolom ini.
          await supabase.rpc('register_faskes', {
            p_nama: meta.nama_apotek,
            p_nama_admin: meta.nama_lengkap || '',
            p_sektor: meta.sektor === 'klinik' || meta.sektor === 'rumah_sakit' ? meta.sektor : 'apotek',
          })
          ctx = await getSessionContext()
        } else if (token) {
          const { error } = await supabase.rpc('terima_undangan', { p_token: token })
          try { localStorage.removeItem(KUNCI_UNDANGAN) } catch {}
          if (error) {
            alert(pesanError(error))
          } else {
            ctx = await getSessionContext()
          }
        }
      }
      setSession(ctx)

      if (ctx.isSuper) {
        setIsSuper(true)
        setCurrentRole('superadmin')
        setCurrentModules(null)
        setSiap(true)
        return
      }

      if (ctx.memberStatus && ctx.memberStatus !== 'aktif') {
        alert(t('Akun Anda dinonaktifkan. Hubungi pemilik apotek.', 'Your account has been deactivated. Contact the pharmacy owner.'))
        await supabase.auth.signOut(); window.location.href = '/'; return
      }

      if (ctx.company) {
        setCompanyName(ctx.company.nama || '')
        applyCompanyTheme(ctx.company.theme)
        setSettingsData((prev: any) => prev.nama_faskes ? prev
          : { ...prev, nama_faskes: ctx.company!.nama || '', nama_apotek: ctx.company!.nama || '' })
      }

      setCurrentRole(ctx.role)
      setCurrentModules(ctx.modules)
      setSiap(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Profil apotek dimuat sekali, lalu tiap kali super admin berganti apotek.
  useEffect(() => { if (siap) muatSettings() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siap, superViewCompany])

  useEffect(() => { if (isSuper) muatCompanies() }, [isSuper])

  const fitur = session?.company?.features ?? FULL_PLAN
  const state = subscriptionState(session?.company ?? null)

  const sektor = bacaSektor(session?.company?.sektor)

  const allowedPages = (() => {
    if (isSuper) return [...menuItems.map(m => m.id), 'klien', 'migrasi']
    if (!currentRole) return []
    const dasar = currentModules && currentModules.length
      ? currentModules
      : (ROLE_PAGES[currentRole] || ['dashboard'])
    const dengaMigrasi = dasar.includes('pengaturan') ? [...dasar, 'migrasi'] : dasar
    // Paket disaring PALING AKHIR, sesudah hak akses per pengguna: pemilik
    // boleh memberi kasir akses ke Pembayaran Faktur, tapi paket Starter tetap
    // tidak membukanya untuk siapa pun di apotek itu.
    const terkunci = lockedModules(fitur)
    // Jenis fasilitas menyaring PALING DULU. Modul yang tidak masuk akal untuk
    // jenis fasilitas ini bukan soal hak akses dan bukan soal paket: ia memang
    // tidak ada di sana.
    const adaDiSektor = MODUL_SEKTOR[sektor]
    return dengaMigrasi
      .filter(p => p === 'migrasi' || adaDiSektor.includes(p))
      .filter(p => !terkunci.includes(p))
  })()

  const namaFaskes = isSuper
    ? (companies.find((c: any) => c.id === superViewCompany)?.nama || 'Super Admin')
    : (settingsData.nama_faskes || settingsData.nama_apotek || companyName
       || istilah(sektor, 'faskes', false) + ' Saya')

  const nilai: AppState = {
    siap, session, isSuper, currentRole, authName,
    settingsData, setSettingsData, muatSettings,
    companies, muatCompanies, superViewCompany, setSuperViewCompany,
    scope, cid,
    allowedPages, fitur,
    langganan: { state, pesan: pesanLangganan(state, t), terkunci: isLapsed(state) },
    namaFaskes,
    sektor,
    kata: (kunci) => istilah(sektor, kunci, lang === 'en'),
  }

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}
