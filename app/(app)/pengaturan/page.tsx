'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck,
  ArrowLeft, Building2, Check, ChevronRight, CreditCard, Database, KeyRound,
  LayoutGrid, Pencil, Pill, ScrollText, Send, ShieldCheck, Stethoscope, Trash2,
  Upload, UserPlus, Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { useTheme, ThemePicker } from '@/lib/theme'
import { pesanError } from '@/lib/session'
import { menuItems, ROLE_PAGES } from '@/lib/navigation'
import { MODUL_SEKTOR } from '@/lib/faskes'
import { tanggal, rupiah } from '@/lib/format'
import JejakAudit from '@/components/JejakAudit'
import PengaturanPoli from '@/components/klinik/PengaturanPoli'
import JadwalPraktik from '@/components/klinik/JadwalPraktik'
import SistemNasional from '@/components/klinik/SistemNasional'
import Perizinan from '@/components/klinik/Perizinan'
import OutletCabang from '@/components/OutletCabang'
import AksesOutletPengguna from '@/components/AksesOutletPengguna'
import TombolIkon from '@/components/TombolIkon'

/**
 * Pengaturan: profil apotek, pengguna, data apoteker, tampilan, langganan.
 *
 * Sub-halamannya ditulis ke `?tab=`, jadi "buka pengaturan pengguna" bisa
 * dikirim sebagai tautan dan tombol back peramban bekerja di dalamnya. Migrasi
 * Data punya alamatnya sendiri di `/pengaturan/migrasi`.
 *
 * Tiga hal ikut dibetulkan:
 *
 * 1. Simpan profil membaca `settings` tanpa penyaring apotek, lalu memutuskan
 *    insert atau update dari baris pertama yang kebetulan terbaca. Untuk super
 *    admin yang sedang melihat satu apotek, itu bisa menimpa profil apotek
 *    lain. Sekarang lewat baris apotek yang sedang aktif.
 * 2. Penambahan pengguna tidak menyertakan company_id, jadi pengguna yang
 *    dibuat super admin mendarat tanpa apotek.
 * 3. Nonaktifkan dan hapus pengguna tidak pernah melaporkan kegagalan.
 */

// Pengguna yang sedang diatur akses outletnya.
const TAB_SAH = ['profil', 'outlet', 'pengguna', 'poli', 'perizinan', 'apoteker', 'nasional', 'tampilan', 'langganan', 'jejak'] as const
type Tab = typeof TAB_SAH[number]

/**
 * Kata sandi awal acak, 10 karakter dari huruf dan angka yang tidak mudah
 * tertukar saat dibacakan atau diketik ulang (tanpa 0/O, 1/l/I).
 */
function sandiAcak(): string {
  const huruf = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const acak = new Uint32Array(10)
  crypto.getRandomValues(acak)
  return Array.from(acak, n => huruf[n % huruf.length]).join('')
}

export default function HalamanPengaturan() {
  const { t, lang } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const app = useApp()
  const { theme } = useTheme()
  const router = useRouter()
  const cari = useSearchParams()

  const tabUrl = cari.get('tab') as Tab | null
  const tab: Tab = TAB_SAH.includes(tabUrl as Tab) ? (tabUrl as Tab) : 'profil'
  const gantiTab = (id: string) => router.replace(`/pengaturan?tab=${id}`, { scroll: false })

  const [users, setUsers] = useState<any[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ nama: '', email: '', password: '', role: 'kasir', modules: ROLE_PAGES['kasir'] as string[] })
  const [editUser, setEditUser] = useState<any>(null)
  const [aksesOutlet, setAksesOutlet] = useState<any>(null)
  const [savingUser, setSavingUser] = useState(false)
  const [kuota, setKuota] = useState<any>(null)
  const [tagihan, setTagihan] = useState<any[]>([])
  const [sibuk, setSibuk] = useState(false)
  const [undangan, setUndangan] = useState<any[]>([])
  // Kotak hasil sesudah akun dibuat atau sandinya diatur ulang. Sandinya
  // hanya ada di memori halaman ini: tidak disimpan di mana pun, jadi begitu
  // kotaknya ditutup ia tidak bisa dimunculkan lagi.
  const [akunBaru, setAkunBaru] = useState<{ email: string; sandi: string | null; jenis: 'baru' | 'lama' | 'atur_ulang' } | null>(null)
  const [lihatSandi, setLihatSandi] = useState(false)
  const [tersalin, setTersalin] = useState(false)

  const scope = app.scope

  const fetchUsers = useCallback(async () => {
    const { data } = await scope(supabase.from('app_users').select('*').order('created_at', { ascending: true }))
    setUsers(data || [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Kuota dibaca dari `v_company_quota`: view yang sama yang dipakai trigger
  // penegak kuota. Kalau layar menghitung sendiri, angkanya cepat atau lambat
  // berbeda dari angka yang dipakai menolak.
  useEffect(() => {
    if (tab !== 'langganan') return
    scope(supabase.from('v_company_quota').select('*')).maybeSingle()
      .then(({ data }: any) => setKuota(data))
    scope(supabase.from('billing_invoices').select('*').order('periode_mulai', { ascending: false }).limit(24))
      .then(({ data }: any) => setTagihan(data || []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, app.superViewCompany])

  const saveSettings = async () => {
    const payload = {
      nama_faskes: app.settingsData.nama_faskes,
      sektor_usaha: app.settingsData.sektor_usaha,
      kota: app.settingsData.kota,
      alamat: app.settingsData.alamat,
      nomor_ijin: app.settingsData.nomor_ijin,
      nomor_telepon: app.settingsData.nomor_telepon,
      email: app.settingsData.email,
      logo_url: app.settingsData.logo_url,
      nama_apoteker: app.settingsData.nama_apoteker,
      nomor_sipa: app.settingsData.nomor_sipa,
      // Daftar kolom di sini SENGAJA eksplisit, supaya kolom yang tidak boleh
      // diubah dari layar ini tidak ikut terkirim. Akibatnya tiap kolom baru
      // harus didaftarkan di sini juga, dan yang lupa akan tersimpan diam-diam
      // sebagai tidak berubah, tanpa pesan galat apa pun.
      biaya_administrasi: Number(app.settingsData.biaya_administrasi) || 0,
    }
    setSibuk(true)
    // Baris settings dicari DALAM lingkup apotek yang sedang aktif. Versi lama
    // membaca baris pertama yang kebetulan terbaca, dan untuk super admin yang
    // sedang melihat satu apotek itu bisa menimpa profil apotek lain.
    const { data: ada } = await scope(supabase.from('settings').select('id')).maybeSingle()
    const { error } = ada
      ? await supabase.from('settings').update(payload).eq('id', (ada as any).id)
      : await supabase.from('settings').insert([{ ...payload, ...app.cid() }])
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(t('Profil apotek disimpan.', 'Pharmacy profile saved.'))
    app.muatSettings()
  }

  const handleLogoUpload = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { kabar(t('Ukuran maksimal 4MB.', 'Maximum size is 4MB.')); return }
    const reader = new FileReader()
    reader.onload = () => app.setSettingsData({ ...app.settingsData, logo_url: reader.result as string })
    reader.readAsDataURL(file)
  }

  const openTambahUser = () => {
    setUserForm({ nama: '', email: '', password: sandiAcak(), role: 'kasir', modules: ROLE_PAGES['kasir'] })
    setLihatSandi(true)
    setShowUserForm(true)
  }

  /** Panggilan ke route handler tim, membawa sesi pemanggil sebagai bukti siapa dia. */
  const panggilTim = async (alamat: string, isi: Record<string, unknown>) => {
    const { data: sesi } = await supabase.auth.getSession()
    const token = sesi.session?.access_token
    if (!token) return { ok: false, pesan: t('Sesi berakhir. Masuk lagi.', 'Session ended. Sign in again.') } as any
    const res = await fetch(alamat, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...isi, company: (app.isSuper && app.superViewCompany) || null }),
    })
    const j = await res.json().catch(() => ({ ok: false, pesan: t('Jawaban server tidak terbaca.', 'Unreadable server response.') }))
    // Galat database membawa kodenya, jadi pesan SH00x lewat pesanError()
    // seperti galat RPC lain; galat server sendiri sudah berupa kalimat.
    if (!j.ok && j.kode) j.pesan = pesanError({ code: j.kode, message: j.pesan })
    return j
  }

  /**
   * Membuatkan akun anggota tim: email dan kata sandi awal (migrasi 0093).
   *
   * Keputusan pemilik, menggantikan undangan lewat tautan. Yang menjaga
   * alasan lama undangan (pemilik tidak boleh tahu sandi kasirnya selamanya)
   * adalah penanda wajib-ganti: orangnya harus membuat sandinya sendiri saat
   * pertama masuk, sebelum bisa memakai apa pun.
   */
  const handleTambah = async () => {
    if (!userForm.nama.trim()) { kabar(t('Nama wajib diisi.', 'Name is required.')); return }
    if (!userForm.email.trim()) { kabar(t('Email wajib diisi.', 'Email is required.')); return }
    if (userForm.password.length < 8) { kabar(t('Kata sandi awal minimal 8 karakter.', 'The first password needs at least 8 characters.')); return }
    setSavingUser(true)
    const j = await panggilTim('/api/tim/buat', {
      email: userForm.email.trim(), nama: userForm.nama.trim(), role: userForm.role,
      modules: userForm.modules, sandi: userForm.password,
    })
    setSavingUser(false)
    if (!j.ok) { kabar(j.pesan, 'galat'); return }
    setAkunBaru({ email: j.email, sandi: j.akunLama ? null : userForm.password, jenis: j.akunLama ? 'lama' : 'baru' })
    setShowUserForm(false)
    fetchUsers()
  }

  /** Sandi baru dibangkitkan, bukan diketik, supaya tidak ada "123456" yang dipakai untuk semua kasir. */
  const handleAturUlangSandi = async (u: any) => {
    if (!await konfirmasi({
      tombol: t('Atur ulang', 'Reset'),
      judul: t(`Atur ulang kata sandi ${u.nama}?`, `Reset ${u.nama}'s password?`),
      pesan: t('Sandi lamanya langsung berhenti berlaku. Sandi baru ditampilkan sekali untuk Anda sampaikan langsung, dan ia wajib menggantinya saat masuk.',
               'The old password stops working immediately. The new one is shown once for you to pass on in person, and they must change it when signing in.'),
    })) return
    const sandi = sandiAcak()
    const j = await panggilTim('/api/tim/sandi', { email: u.email, sandi })
    if (!j.ok) { kabar(j.pesan, 'galat'); return }
    setLihatSandi(true)
    setAkunBaru({ email: u.email, sandi, jenis: 'atur_ulang' })
  }

  const muatUndangan = useCallback(async () => {
    const { data } = await scope(supabase.from('invitations')
      .select('*')
      .is('accepted_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }))
    setUndangan(data || [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muatUndangan() }, [muatUndangan])

  const cabutUndangan = async (u: any) => {
    if (!await konfirmasi({ bahaya: true, tombol: t('Cabut undangan', 'Revoke'), judul: t(`Cabut undangan untuk ${u.email}?`, `Revoke the invitation for ${u.email}?`), pesan: t(`Tautannya langsung tidak bisa dipakai.`,
                   `Revoke the invitation for ${u.email}? The link stops working immediately.`)})) return
    const { error } = await supabase.rpc('cabut_undangan', { p_id: u.id })
    if (error) { kabar(pesanError(error), 'galat'); return }
    muatUndangan()
  }

  const handleUpdateUser = async () => {
    if (!editUser) return
    const { error } = await supabase.from('app_users').update({
      nama: editUser.nama, role: editUser.role, status: editUser.status,
      modules: Array.isArray(editUser.modules) ? editUser.modules : [],
    }).eq('id', editUser.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setEditUser(null)
    fetchUsers()
  }

  const toggleFormModule = (target: 'new' | 'edit', pageId: string) => {
    if (target === 'new') {
      const ada = userForm.modules.includes(pageId)
      setUserForm({ ...userForm, modules: ada ? userForm.modules.filter(m => m !== pageId) : [...userForm.modules, pageId] })
    } else if (editUser) {
      const mods: string[] = Array.isArray(editUser.modules) ? editUser.modules : []
      const ada = mods.includes(pageId)
      setEditUser({ ...editUser, modules: ada ? mods.filter(m => m !== pageId) : [...mods, pageId] })
    }
  }

  const toggleUserStatus = async (u: any) => {
    const { error } = await supabase.from('app_users')
      .update({ status: u.status === 'aktif' ? 'nonaktif' : 'aktif' }).eq('id', u.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    fetchUsers()
  }

  /**
   * Mengubah bentuk bagian farmasi.
   *
   * Lewat RPC tersendiri, bukan ikut penyimpanan pengaturan biasa, karena ini
   * mengubah apa yang BOLEH dilakukan dan bukan cuma apa yang tertulis. Ia
   * pantas punya jejak auditnya sendiri.
   */
  const simpanModeFarmasi = async (mode: string) => {
    if ((app.settingsData.mode_farmasi || 'apotek') === mode) return
    if (mode === 'instalasi' && !await konfirmasi({ judul: 
      t('Sesudah ini, penyerahan obat yang tidak terikat ke kunjungan pasien akan ditolak. Penjualan bebas di kasir tidak bisa lagi. Lanjutkan?',
        'After this, dispensing not tied to a patient visit will be rejected. Walk-in sales at the counter will no longer work. Continue?')})) return
    setSibuk(true)
    const { error } = await supabase.rpc('set_mode_farmasi', { p_mode: mode })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    app.setSettingsData({ ...app.settingsData, mode_farmasi: mode })
  }

  const handleDeleteUser = async (u: any) => {
    if (!await konfirmasi({ bahaya: true, tombol: t('Hapus pengguna', 'Remove user'), judul: t(`Hapus pengguna "${u.nama}"?`, `Remove "${u.nama}"?`), pesan: t(`Akun loginnya tetap ada, tapi ia kehilangan akses ke ${app.kata('faskes').toLowerCase()} ini.`,
                   `Their login account remains, but they lose access to this ${app.kata('faskes').toLowerCase()}.`)})) return
    const { error } = await supabase.from('app_users').delete().eq('id', u.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    fetchUsers()
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const roleLabels: Record<string, string> = {
    pemilik: t('Pemilik', 'Owner'), apoteker: t('Apoteker', 'Pharmacist'),
    asisten_apoteker: t('Asisten Apoteker', 'Pharmacist Assistant'),
    analis:           t('Analis Lab & Radiologi', 'Lab & Imaging Technician'),
    kasir: t('Kasir', 'Cashier'), admin: 'Admin',
    dokter: t('Dokter', 'Doctor'), perawat: t('Perawat', 'Nurse'),
    pendaftaran: t('Pendaftaran', 'Front desk'),
  }
  /**
   * Menu bawaan peran yang TIDAK ikut dicentang di modul manual pengguna.
   *
   * Modul manual adalah daftar beku: menu yang lahir sesudahnya (Stok Opname,
   * Transfer Stok) tidak pernah masuk sendiri, jadi apoteker yang modulnya
   * diatur sebelum menu itu ada tidak akan pernah melihatnya, dan tidak ada
   * yang tahu kenapa. Yang dikatakan di sini cuma selisihnya; boleh jadi
   * memang sengaja dicabut, dan itu keputusan pemilik, bukan layar ini.
   */
  const menuTakDicentang = (u: any): string[] => {
    if (!Array.isArray(u.modules) || !u.modules.length) return []
    const ada = MODUL_SEKTOR[app.sektor]
    return (ROLE_PAGES[u.role] || [])
      .filter(id => ada.includes(id) && !u.modules.includes(id))
      .map(id => { const m = menuItems.find(x => x.id === id); return m ? t(m.label, m.en) : id })
  }
  // Poli cuma ada di klinik dan rumah sakit. Menampilkannya di apotek berarti
  // menawarkan sesuatu yang tidak akan pernah dipakai, dan tiap menu mati
  // membuat menu yang hidup lebih sulit ditemukan.
  const klinik = app.sektor !== 'apotek'
  /**
   * Penamaannya mengikuti SEKTOR, bukan warisan nama lama.
   *
   * "Profil Apotek" salah di klinik dan salah di rumah sakit, dan yang membaca
   * layar berjudul Apotek di kliniknya menyimpulkan aplikasinya memang bukan
   * untuk dia. `app.kata('faskes')` sudah tahu jawabannya per sektor sejak
   * `lib/faskes.ts` ada; yang kurang cuma dipakai di sini.
   *
   * Urutannya juga disusun ulang jadi tiga kelompok yang terasa: identitas
   * faskes, lalu orang dan perizinannya, lalu urusan sistem. Sebelumnya
   * langganan dan jejak audit terselip di antara data apoteker.
   */
  const settingsMenu = [
    { id: 'profil',    label: t(`Profil ${app.kata('faskes')}`, 'Facility Profile'),
      desc: t('Nama, alamat, izin operasional, logo', 'Name, address, operating licence, logo'), Icon: Building2 },
    { id: 'outlet',    label: t('Outlet & Cabang', 'Outlets & Branches'), desc: t('Cabang, dan rekap lintas outlet', 'Branches, and cross-outlet summary'), Icon: Building2 },
    { id: 'pengguna',  label: t('Pengguna & Hak Akses', 'Users & Access'), desc: t('Anggota tim, peran, akses outlet', 'Team members, roles, outlet access'), Icon: Users },
    ...(klinik ? [{ id: 'poli', label: t('Poli & Dokter', 'Units & Doctors'), desc: t('Ruang periksa, tarif konsultasi, deret antrean', 'Exam rooms, consultation fees, queue series'), Icon: Stethoscope }] : []),
    ...(klinik ? [{ id: 'perizinan', label: t('Perizinan Tenaga Kesehatan', 'Practitioner Licences'),
      desc: t('STR, SIP, dan masa berlakunya', 'Registration, practice licence, and validity'), Icon: BadgeCheck }] : []),
    { id: 'apoteker',  label: klinik ? t('Instalasi Farmasi', 'Pharmacy Unit') : t('Perizinan & Apoteker', 'Licences & Pharmacist'),
      desc: klinik ? t('Bentuk layanan farmasi klinik', 'How the clinic pharmacy operates') : t('SIA, SIPA, penanggung jawab', 'SIA, SIPA, responsible person'), Icon: ShieldCheck },
    // Cuma klinik dan rumah sakit. Apotek tidak mengirim Encounter ke
    // SatuSehat, jadi menawarkan kotak kredensialnya berarti menawarkan
    // sesuatu yang tidak akan pernah dipakai.
    ...(klinik ? [{ id: 'nasional', label: t('SatuSehat & BPJS', 'SatuSehat & BPJS'), desc: t('Kredensial dan antrean kirim', 'Credentials and send queue'), Icon: KeyRound }] : []),
    { id: 'tampilan',  label: t('Tampilan', 'Appearance'),              desc: t('Tema warna aplikasi', 'App colour theme'),                  Icon: LayoutGrid },
    { id: 'langganan', label: t('Langganan', 'Subscription'),           desc: t('Paket, masa aktif, kuota', 'Plan, validity, quota'),        Icon: CreditCard },
    { id: 'jejak',     label: t('Jejak Audit', 'Audit Trail'),          desc: t('Siapa melakukan apa, kapan', 'Who did what, and when'),      Icon: ScrollText },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Pengaturan', 'Settings')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-6">
        {t(`Kelola profil ${app.kata('faskes').toLowerCase()}, pengguna, perizinan, dan sistem.`, 'Manage the facility profile, users, licences, and system settings.')}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-2">
          {settingsMenu.map((m: any) => (
            <button key={m.id} onClick={() => gantiTab(m.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                tab === m.id ? 'bg-[var(--surface)]/80 border-[var(--brand)]/20 shadow-sm' : 'bg-[var(--surface)]/50 border-[var(--line)] hover:bg-[var(--surface)]/70'
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tab === m.id ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--paper)] text-[var(--brand)]'}`}>
                <m.Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)]">{m.label}</p>
                <p className="text-xs text-[var(--ink-faint)] truncate">{m.desc}</p>
              </div>
              <ChevronRight size={16} className="text-[var(--ink-faint)] shrink-0" />
            </button>
          ))}
          <a href="/pengaturan/migrasi"
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 hover:bg-[var(--surface)]/70 text-left transition">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--paper)] text-[var(--brand)]">
              <Database size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{t('Migrasi Data', 'Data Migration')}</p>
              <p className="text-xs text-[var(--ink-faint)] truncate">{t('Impor & ekspor CSV', 'Import & export CSV')}</p>
            </div>
            <ChevronRight size={16} className="text-[var(--ink-faint)] shrink-0" />
          </a>
        </div>

        <div className="min-w-0 bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] shadow-sm rounded-2xl p-6">
                  {tab === 'jejak' && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Jejak Audit', 'Audit Trail')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6 leading-relaxed">
                        {t('Tindakan yang tidak bisa dibatalkan, dan siapa yang melakukannya. Dicatat oleh database saat kejadiannya berlangsung, bukan oleh aplikasi sesudahnya, jadi tidak ada cara melewatinya.',
                           'Irreversible actions, and who performed them. Recorded by the database as they happen rather than by the app afterwards, so there is no way to skip it.')}
                      </p>
                      <JejakAudit />
                    </div>
                  )}

                  {/* TAMPILAN: tema warna */}
                  {tab === 'tampilan' && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Tampilan', 'Appearance')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">
                        {t('Pilih tema warna aplikasi. Pilihan ini berlaku untuk perangkat ini.',
                           'Pick the app colour theme. This choice applies to this device.')}
                      </p>
                      <ThemePicker lang={lang} />
                      <p className="text-xs text-[var(--ink-faint)] mt-4 leading-relaxed">
                        {t('Tema bawaan apotek dipakai untuk perangkat yang belum pernah memilih sendiri, sehingga semua kasir melihat tampilan yang sama sejak hari pertama. Perangkat yang sudah memilih tetap memakai pilihannya.',
                           'The pharmacy default applies to devices that have never picked one, so every cashier sees the same look from day one. Devices that have chosen keep their choice.')}
                      </p>
                      {(app.currentRole === 'pemilik' || app.currentRole === 'admin') && (
                        <button
                          onClick={async () => {
                            if (!app.session?.company) return
                            const { error } = await supabase.from('companies')
                              .update({ theme }).eq('id', app.session.company.id)
                            kabar(error ? pesanError(error)
                              : t('Tema bawaan apotek disimpan.', 'Pharmacy default theme saved.'))
                          }}
                          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)] transition">
                          {t('Jadikan tema bawaan apotek', 'Make this the pharmacy default')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* LANGGANAN */}
                  {tab === 'langganan' && (() => {
                    const c = app.session?.company
                    const rp = (n: number | null | undefined) => 'Rp ' + (n || 0).toLocaleString('id-ID')
                    const tgl = (iso: string | null) => iso
                      ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    const aktifSampai = c?.status === 'trial' ? c?.trialEndsAt : c?.subscriptionEndsAt
                    const statusLabel: Record<string, string> = {
                      trial: t('Masa coba gratis', 'Free trial'),
                      active: t('Aktif', 'Active'),
                      suspended: t('Ditangguhkan', 'Suspended'),
                      inactive: t('Nonaktif', 'Inactive'),
                    }
                    // Batas dari paket; null berarti tanpa batas. Angkanya datang
                    // dari view yang sama dengan yang dipakai trigger menolak,
                    // supaya yang dilihat di sini persis yang ditegakkan.
                    const bar = (dipakai: number, batas: number | null, label: string) => {
                      const persen = batas ? Math.min(100, Math.round((dipakai / batas) * 100)) : 0
                      const penuh = batas !== null && dipakai >= batas
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[var(--ink-soft)]">{label}</span>
                            <span className={`tabular-nums font-medium ${penuh ? 'text-red-600' : 'text-[var(--ink)]'}`}>
                              {dipakai.toLocaleString('id-ID')} / {batas === null ? t('tanpa batas', 'unlimited') : batas.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${penuh ? 'bg-red-500' : 'bg-[var(--brand)]'}`}
                              style={{ width: batas === null ? '8%' : `${persen}%` }} />
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Langganan', 'Subscription')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-6">
                          {t('Paket, masa aktif, dan pemakaian kuota apotek ini.', 'Plan, validity, and quota usage for this pharmacy.')}
                        </p>

                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-3)] p-5 mb-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-[var(--ink-faint)] font-semibold">{t('Paket aktif', 'Active plan')}</p>
                              <p className="text-2xl font-bold text-[var(--ink)] mt-1">{c?.planName || t('Belum berpaket', 'No plan yet')}</p>
                              <p className="text-sm text-[var(--ink-soft)] mt-0.5">
                                {c?.planPriceMonthly ? `${rp(c.planPriceMonthly)} / ${t('bulan', 'month')}` : t('Belum ada tagihan untuk apotek ini.', 'No billing for this pharmacy yet.')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c?.status === 'active' ? 'bg-green-100 text-green-800'
                              : c?.status === 'trial' ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'}`}>
                              {statusLabel[c?.status || 'trial']}
                            </span>
                          </div>
                          <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-wrap gap-x-8 gap-y-2 text-sm">
                            <div>
                              <span className="text-[var(--ink-faint)]">{t('Aktif sampai', 'Active until')}: </span>
                              <span className="font-semibold text-[var(--ink)]">{tgl(aktifSampai ?? null)}</span>
                            </div>
                            <div>
                              <span className="text-[var(--ink-faint)]">{t('Bantuan', 'Support')}: </span>
                              <span className="font-semibold text-[var(--ink)]">
                                {app.fitur.support === 'dedicated' ? t('Pendampingan khusus', 'Dedicated') : app.fitur.support === 'whatsapp' ? 'WhatsApp' : 'Email'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{t('Pemakaian kuota', 'Quota usage')}</h3>
                        {kuota ? (
                          <div className="space-y-4">
                            {bar(kuota.used_products ?? 0, kuota.max_products, t('Item obat', 'Drug items'))}
                            {bar(kuota.used_users ?? 0, kuota.max_users, t('Pengguna', 'Users'))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--ink-faint)]">{t('Memuat pemakaian…', 'Loading usage…')}</p>
                        )}

                        <h3 className="text-sm font-semibold text-[var(--ink)] mt-8 mb-3">{t('Tagihan', 'Invoices')}</h3>
                        {tagihan.length === 0 ? (
                          <p className="text-sm text-[var(--ink-faint)]">
                            {t('Belum ada tagihan. Selama masa coba memang belum ada yang ditagihkan.',
                               'No invoices yet. Nothing is billed during the trial.')}
                          </p>
                        ) : (
                          <div className="border border-[var(--line)] rounded-xl overflow-hidden">
                            {tagihan.map((b: any) => (
                              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--line-soft)] last:border-0">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[var(--ink)] num">{b.nomor}</p>
                                  <p className="text-xs text-[var(--ink-faint)] num">
                                    {tanggal(b.periode_mulai)} &rarr; {tanggal(b.periode_selesai)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-[var(--ink)] num">{rupiah(b.jumlah)}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    b.status === 'lunas' ? 'bg-green-100 text-green-800'
                                    : b.status === 'dibatalkan' ? 'bg-gray-100 text-gray-500'
                                    : 'bg-amber-100 text-amber-800'}`}>
                                    {b.status === 'lunas' ? t('Lunas', 'Paid')
                                      : b.status === 'dibatalkan' ? t('Dibatalkan', 'Cancelled') : t('Belum bayar', 'Unpaid')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                          <p className="text-sm font-semibold text-[var(--ink)] mb-1">{t('Mau ganti paket?', 'Want to change plans?')}</p>
                          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                            {t('Untuk sekarang pergantian paket dilakukan lewat admin Sehatera. Pembayaran otomatis di dalam aplikasi belum tersedia. Turun paket tidak menghapus data apa pun; yang berubah hanya batas penambahan.',
                               'For now, plan changes go through the Sehatera admin. In-app automatic payment is not available yet. Downgrading deletes nothing; only the limit on adding changes.')}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                  {/* PROFIL APOTEK */}
                  {tab === 'profil' && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">
                        {t('Profil', 'Profile')} {app.kata('faskes').toLowerCase()}
                      </h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">
                        {t('Profil ini ditampilkan pada struk, purchase order, dan dokumen resmi lainnya.',
                           'This profile appears on receipts, purchase orders, and other official documents.')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Logo */}
                        <div className="shrink-0">
                          <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[var(--line)] flex items-center justify-center overflow-hidden bg-[var(--surface)]">
                            {app.settingsData.logo_url
                              ? <img src={app.settingsData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                              : <Building2 size={44} className="text-[var(--ink-faint)]" strokeWidth={1.3} />}
                          </div>
                          <label className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--brand)] font-medium hover:bg-[var(--surface-2)] transition cursor-pointer">
                            <Upload size={15} /> {t('Ubah logo', 'Change logo')}
                            <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                              onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                          </label>
                          <p className="text-xs text-[var(--ink-faint)] mt-2 text-center">{t('Maksimal 4MB', 'Max 4MB')}<br/>{t('Format .JPG .JPEG .PNG', 'Format .JPG .JPEG .PNG')}</p>
                        </div>
                        {/* Fields */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">
                              {t('Nama', 'Name')} {app.kata('faskes').toLowerCase()}
                            </label>
                            <input value={app.settingsData.nama_faskes ?? app.settingsData.nama_apotek ?? ''}
                              onChange={e => app.setSettingsData({ ...app.settingsData, nama_faskes: e.target.value })}
                              className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Sektor usaha', 'Business sector')}</label>
                              <input value={app.settingsData.sektor_usaha || app.kata('faskes')}
                                onChange={e => app.setSettingsData({ ...app.settingsData, sektor_usaha: e.target.value })}
                                className={inputCls} />
                              <p className="text-[11px] text-[var(--ink-faint)] mt-1 leading-relaxed">
                                {t('Sekadar keterangan di dokumen. Jenis fasilitas yang menentukan menu diatur admin Sehatera.',
                                   'Just a label on documents. The facility type that drives the menu is set by the Sehatera admin.')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Kota/Kabupaten', 'City/Regency')}</label>
                              <input value={app.settingsData.kota || ''} onChange={e => app.setSettingsData({...app.settingsData, kota: e.target.value})} placeholder="Kab. Gianyar, Bali" className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Alamat', 'Address')}</label>
                            <textarea value={app.settingsData.alamat || ''} onChange={e => app.setSettingsData({...app.settingsData, alamat: e.target.value})} rows={2} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('No. telepon', 'Phone No.')}</label>
                              <input value={app.settingsData.nomor_telepon || ''} onChange={e => app.setSettingsData({...app.settingsData, nomor_telepon: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input type="email" value={app.settingsData.email || ''} onChange={e => app.setSettingsData({...app.settingsData, email: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">
                              {t('Nomor Izin', 'Licence No.')} ({app.kata('izin')})
                            </label>
                            <input value={app.settingsData.nomor_ijin || ''} onChange={e => app.setSettingsData({...app.settingsData, nomor_ijin: e.target.value})} className={inputCls} />
                          </div>
                          <button onClick={saveSettings} disabled={sibuk}
                            className="bg-[var(--brand)] text-[var(--on-brand)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                            {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Profil', 'Save Profile')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DATA APOTEKER */}
                  {tab === 'poli' && (
                    <div className="space-y-6">
                      <PengaturanPoli />
                      <JadwalPraktik />
                      <DaftarAsuransi />
                      <LayarAntrean />
                    </div>
                  )}

                  {tab === 'outlet' && <OutletCabang />}

                  {aksesOutlet && (
                    <AksesOutletPengguna
                      email={aksesOutlet.email}
                      nama={aksesOutlet.nama}
                      onTutup={() => setAksesOutlet(null)}
                    />
                  )}

                  {tab === 'nasional' && <SistemNasional />}
                  {tab === 'perizinan' && <Perizinan />}

                  {tab === 'apoteker' && (
                    <div className="max-w-md">
                      {/* Bentuk farmasi. Di klinik, bagian obatnya bisa berdiri
                          sebagai apotek berizin sendiri atau sebagai instalasi
                          farmasi yang menempel pada izin klinik, dan keduanya
                          beda secara hukum, bukan cuma beda nama. Pilihannya di
                          sini mengubah apa yang boleh dilakukan kasir. */}
                      {klinik && (
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Bentuk bagian farmasi', 'Form of the pharmacy unit')}</h2>
                          <p className="text-sm text-[var(--ink-soft)] mb-4 leading-relaxed">
                            {t('Ini bukan soal istilah di layar. Pilihannya menentukan apakah penyerahan obat boleh lepas dari kunjungan pasien.',
                               'This is not a matter of wording. It decides whether dispensing may happen without a patient visit.')}
                          </p>
                          <div className="space-y-2">
                            {([
                              ['apotek', t('Apotek', 'Pharmacy'),
                               t('Punya izin sendiri (SIA) dan apoteker penanggung jawab sendiri. Boleh melayani siapa saja, termasuk yang bukan pasien klinik, dan boleh menerima resep dari luar.',
                                 'Has its own licence and responsible pharmacist. May serve anyone, including non-patients, and may accept outside prescriptions.')],
                              ['instalasi', t('Instalasi Farmasi', 'Pharmacy Installation'),
                               t('Bagian dari izin klinik, tidak punya SIA sendiri. Hanya melayani pasien klinik ini, jadi tiap penyerahan obat harus terikat ke satu kunjungan.',
                                 'Part of the clinic licence, with no separate permit. Serves this clinic patients only, so every dispensing must be tied to a visit.')],
                            ] as const).map(([nilai, judul, ket]) => {
                              const on = (app.settingsData.mode_farmasi || 'apotek') === nilai
                              return (
                                <button key={nilai} onClick={() => simpanModeFarmasi(nilai)} disabled={sibuk}
                                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition disabled:opacity-50 ${
                                    on ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
                                  }`}>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--paper)] text-[var(--brand)]'}`}>
                                    <Pill size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                                      {judul} {on && <Check size={14} className="text-[var(--brand)]" />}
                                    </p>
                                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed mt-0.5">{ket}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          <hr className="my-8 border-[var(--line-soft)]" />
                        </div>
                      )}

                      {/* Biaya administrasi PINDAH ke Layanan Jasa (permintaan
                          pemilik, dan ia benar). Ia adalah TARIF, bukan
                          pengaturan sistem: orang yang mencari harga
                          administrasi akan membuka daftar tarif, bukan menu
                          Pengaturan, dan tarif yang tersembunyi di Pengaturan
                          adalah tarif yang tidak pernah diperbarui. */}
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Penanggung jawab', 'Person in charge')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">
                        {app.kata('penanggungJawab')}. {t('Namanya tertera di purchase order dan berita acara pemusnahan.',
                                                          'Their name appears on purchase orders and destruction reports.')}
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama Apoteker', 'Pharmacist Name')}</label>
                          <input value={app.settingsData.nama_apoteker || ''} onChange={e => app.setSettingsData({...app.settingsData, nama_apoteker: e.target.value})} placeholder="apt. Nama Apoteker, S.Farm" className={inputCls} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nomor SIPA', 'SIPA Number')}</label>
                          <input value={app.settingsData.nomor_sipa || ''} onChange={e => app.setSettingsData({...app.settingsData, nomor_sipa: e.target.value})} placeholder="SIPA/001/2024/..." className={inputCls} />
                        </div>
                        <button onClick={saveSettings} disabled={sibuk}
                          className="bg-[var(--brand)] text-[var(--on-brand)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                          {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Data Apoteker', 'Save Pharmacist Data')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MANAJEMEN PENGGUNA */}
                  {tab === 'pengguna' && (() => {
                    const ModuleGrid = ({ selected, onToggle, onClear, onAll }: { selected: string[], onToggle: (id:string)=>void, onClear: ()=>void, onAll: ()=>void }) => (
                      <div className="border border-[var(--line)] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[var(--ink)]">{t('Akses Modul', 'Module Access')}</p>
                          <div className="flex gap-3 text-xs">
                            <button type="button" onClick={onAll} className="text-[var(--brand)] font-medium hover:underline">{t('Pilih semua', 'Select all')}</button>
                            <button type="button" onClick={onClear} className="text-[var(--ink-soft)] hover:underline">{t('Hapus semua', 'Clear all')}</button>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--ink-faint)] mb-4">{t('Centang modul yang boleh dibuka user ini.', 'Check the modules this user may open.')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {menuItems.map(m => {
                            const checked = selected.includes(m.id)
                            return (
                              <button type="button" key={m.id} onClick={() => onToggle(m.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm transition ${checked ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)] hover:bg-gray-50'}`}>
                                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'border border-[var(--line)]'}`}>{checked && <Check size={11} strokeWidth={3} />}</span>
                                <span className="text-[var(--ink)]">{lang === 'en' ? m.en : m.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )

                    // ── FORM TAMBAH ──
                    if (showUserForm) return (
                      <div>
                        <button onClick={() => setShowUserForm(false)} className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Tambah Anggota Tim', 'Add a Team Member')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-5 leading-relaxed">
                          {t('Buatkan email dan kata sandi awal, lalu sampaikan langsung ke orangnya. Saat pertama masuk ia wajib mengganti kata sandinya sendiri, supaya sesudah itu hanya ia yang tahu: transaksi dan rekam medis atas namanya baru membuktikan siapa yang mengerjakannya.',
                             'Set an email and a first password, then pass them on in person. On first sign-in they must change the password, so afterwards only they know it: sales and records under their name then prove who did the work.')}
                        </p>
                        <div className="space-y-5">
                          <div className="border border-[var(--line)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="nama@email.com" className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} placeholder={t('Nama lengkap', 'Full name')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Kata sandi awal', 'First password')}</label>
                              <div className="flex gap-2">
                                <input type={lihatSandi ? 'text' : 'password'} value={userForm.password} autoComplete="new-password"
                                  onChange={e => setUserForm({...userForm, password: e.target.value})} className={inputCls + ' num'} />
                                <button type="button" onClick={() => { setUserForm({...userForm, password: sandiAcak()}); setLihatSandi(true) }}
                                  className="shrink-0 px-3 rounded-lg border border-[var(--line)] text-xs font-medium text-[var(--brand)] hover:bg-[var(--surface-2)] transition">
                                  {t('Acak', 'Generate')}
                                </button>
                              </div>
                              <p className="text-[11px] text-[var(--ink-faint)] mt-1">{t('Minimal 8 karakter. Wajib diganti orangnya saat pertama masuk.', 'At least 8 characters. They must change it on first sign-in.')}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Role</label>
                              <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value, modules: ROLE_PAGES[e.target.value] || []})} className={inputCls}>
                                <option value="admin">Admin</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="analis">{t('Analis Lab & Radiologi', 'Lab & Imaging Technician')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                {app.sektor !== 'apotek' && (
                                  <>
                                    <option value="dokter">{t('Dokter', 'Doctor')}</option>
                                    <option value="perawat">{t('Perawat', 'Nurse')}</option>
                                    <option value="pendaftaran">{t('Pendaftaran', 'Front desk')}</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                          <ModuleGrid selected={userForm.modules}
                            onToggle={(id) => toggleFormModule('new', id)}
                            onClear={() => setUserForm({...userForm, modules: []})}
                            onAll={() => setUserForm({...userForm, modules: menuItems.map(m => m.id)})} />
                          <button onClick={handleTambah} disabled={savingUser}
                            className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                            {savingUser ? t('Membuat akun…', 'Creating the account…') : t('Buat Akun', 'Create Account')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── FORM EDIT ──
                    if (editUser) return (
                      <div>
                        <button onClick={() => setEditUser(null)} className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Edit Pengguna', 'Edit User')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Ubah role, status, dan hak akses modul. Email login tidak dapat diubah di sini.', 'Change role, status, and module access. Login email cannot be changed here.')}</p>
                        <div className="space-y-5">
                          <div className="border border-[var(--line)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={editUser.nama} onChange={e => setEditUser({...editUser, nama: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input value={editUser.email || ''} disabled className={inputCls + ' bg-[var(--surface-2)] text-[var(--ink-faint)]'} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Role</label>
                              <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className={inputCls}>
                                <option value="pemilik">{t('Pemilik', 'Owner')}</option>
                                <option value="admin">Admin</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="analis">{t('Analis Lab & Radiologi', 'Lab & Imaging Technician')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                {app.sektor !== 'apotek' && (
                                  <>
                                    <option value="dokter">{t('Dokter', 'Doctor')}</option>
                                    <option value="perawat">{t('Perawat', 'Nurse')}</option>
                                    <option value="pendaftaran">{t('Pendaftaran', 'Front desk')}</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Status</label>
                              <select value={editUser.status} onChange={e => setEditUser({...editUser, status: e.target.value})} className={inputCls}>
                                <option value="aktif">{t('Aktif', 'Active')}</option>
                                <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
                              </select>
                            </div>
                          </div>
                          <ModuleGrid selected={Array.isArray(editUser.modules) ? editUser.modules : []}
                            onToggle={(id) => toggleFormModule('edit', id)}
                            onClear={() => setEditUser({...editUser, modules: []})}
                            onAll={() => setEditUser({...editUser, modules: menuItems.map(m => m.id)})} />
                          <button onClick={handleUpdateUser} className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition">
                            {t('Simpan Perubahan', 'Save Changes')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── LIST ──
                    return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-[var(--ink)]">{t('Manajemen pengguna', 'User management')}</h2>
                        <button onClick={openTambahUser}
                          className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                          <UserPlus size={15} /> {t('Tambah Anggota', 'Add Member')}
                        </button>
                      </div>
                      <p className="text-sm text-[var(--ink-soft)] mb-5">{t(`Atur anggota tim ${app.kata('faskes').toLowerCase()} beserta hak akses modul masing-masing.`, `Manage ${app.kata('faskes').toLowerCase()} team members and their module access.`)}</p>

                      {/* Sandinya hanya ada di memori halaman ini, jadi kotak
                          ini bertahan sampai ditutup sendiri, bukan hilang
                          sesudah beberapa detik. */}
                      {akunBaru && (() => {
                        const pesan = akunBaru.sandi
                          ? t(`Masuk di ${window.location.origin}\nEmail: ${akunBaru.email}\nKata sandi awal: ${akunBaru.sandi}\nSaat pertama masuk, Anda diminta membuat kata sandi sendiri.`,
                              `Sign in at ${window.location.origin}\nEmail: ${akunBaru.email}\nFirst password: ${akunBaru.sandi}\nOn first sign-in you will be asked to set your own password.`)
                          : ''
                        return (
                        <div className="mb-5 rounded-2xl border border-green-300 bg-green-50 p-4">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            {akunBaru.jenis === 'atur_ulang'
                              ? t(`Kata sandi ${akunBaru.email} sudah diatur ulang.`, `${akunBaru.email} password has been reset.`)
                              : t(`Akun ${akunBaru.email} sudah dibuat.`, `Account ${akunBaru.email} created.`)}
                          </p>
                          {akunBaru.jenis === 'lama' ? (
                            <p className="text-xs text-green-800 leading-relaxed">
                              {t('Email ini sudah punya akun Sehatera, jadi ia masuk dengan kata sandinya sendiri. Kata sandi yang Anda ketik tidak dipakai, dan sandinya tidak ditimpa.',
                                 'This email already has a Sehatera account, so they sign in with their own password. The password you typed is not used, and theirs is not overwritten.')}
                            </p>
                          ) : (<>
                            <p className="text-xs text-green-800 mb-3 leading-relaxed">
                              {t('Sampaikan langsung ke orangnya. Kata sandi ini hanya tampil sekarang dan tidak disimpan di mana pun; kalau terlanjur hilang, atur ulang dari daftar di bawah.',
                                 'Pass this on in person. The password is shown only now and stored nowhere; if it gets lost, reset it from the list below.')}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex-1 min-w-[14rem] border border-green-300 bg-white rounded-lg px-3 py-2 text-xs">
                                <span className="text-[var(--ink-soft)]">{akunBaru.email}</span>
                                <span className="mx-2 text-[var(--ink-faint)]">|</span>
                                <span className="num font-semibold text-[var(--ink)]">{lihatSandi ? akunBaru.sandi : '••••••••••'}</span>
                              </div>
                              <button onClick={() => setLihatSandi(v => !v)}
                                className="px-3 py-2 rounded-lg border border-green-300 text-green-800 text-xs font-medium hover:bg-green-100 transition">
                                {lihatSandi ? t('Sembunyikan', 'Hide') : t('Lihat', 'Show')}
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(pesan)
                                    setTersalin(true); setTimeout(() => setTersalin(false), 2000)
                                  } catch {
                                    kabar(t('Peramban menolak menyalin. Catat sandinya sendiri.',
                                            'The browser refused to copy. Note the password down yourself.'))
                                  }
                                }}
                                className="px-3 py-2 rounded-lg bg-green-700 text-white text-xs font-medium hover:bg-green-800 transition">
                                {tersalin ? t('Tersalin', 'Copied') : t('Salin pesan masuk', 'Copy sign-in message')}
                              </button>
                            </div>
                          </>)}
                          <button onClick={() => setAkunBaru(null)}
                            className="mt-3 px-3 py-1.5 rounded-lg border border-green-300 text-green-800 text-xs font-medium hover:bg-green-100 transition">
                            {t('Tutup', 'Close')}
                          </button>
                        </div>
                        )
                      })()}

                      {undangan.length > 0 && (
                        <div className="mb-5 border border-[var(--line)] rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-[var(--surface-2)] flex items-center gap-2">
                            <Send size={14} className="text-[var(--ink-soft)]" />
                            <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide">
                              {t('Undangan menunggu dijawab', 'Invitations awaiting a reply')} ({undangan.length})
                            </p>
                          </div>
                          <div className="divide-y divide-[var(--line-soft)]">
                            {undangan.map((u: any) => {
                              const lewat = new Date(u.expires_at) <= new Date()
                              return (
                                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-[var(--ink)] truncate">{u.email}</p>
                                    <p className="text-xs text-[var(--ink-faint)]">
                                      {roleLabels[u.role] || u.role} ·{' '}
                                      <span className={lewat ? 'text-red-600 font-medium' : ''}>
                                        {lewat ? t('sudah kedaluwarsa', 'expired')
                                               : `${t('berlaku sampai', 'valid until')} ${tanggal(u.expires_at)}`}
                                      </span>
                                    </p>
                                  </div>
                                  <button onClick={() => cabutUndangan(u)}
                                    className="px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-medium hover:bg-[var(--surface-2)] transition">
                                    {t('Cabut', 'Revoke')}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {users.length === 0 ? (
                        <div className="text-center py-12 text-sm text-[var(--ink-faint)]">
                          <Users size={32} className="mx-auto mb-2 text-[var(--ink-faint)]" />
                          {t('Belum ada pengguna. Klik "Tambah Pengguna" untuk menambah anggota tim.', 'No users yet. Click "Add User" to add a team member.')}
                        </div>
                      ) : (
                        <div className="border border-[var(--line-soft)] rounded-xl overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[var(--surface-2)] text-[var(--ink-soft)]">
                                <th className="text-left px-4 py-2.5 text-xs font-medium">{t('Nama', 'Name')}</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium">Email</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium">Role</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">{t('Modul', 'Modules')}</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">Status</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">{t('Aksi', 'Action')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u:any, i:number) => (
                                <tr key={i} className="border-t border-[var(--line-soft)] hover:bg-[var(--surface)]">
                                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.nama}</td>
                                  <td className="px-4 py-3 text-[var(--ink-soft)] text-xs">{u.email || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--brand-soft)]">{roleLabels[u.role] || u.role}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-[var(--ink-soft)]">
                                    {Array.isArray(u.modules) && u.modules.length ? `${u.modules.length} ${t('modul','modules')}` : t('bawaan peran','role default')}
                                    {menuTakDicentang(u).length > 0 && (
                                      <span className="block mt-0.5 text-[11px] text-amber-700"
                                        title={menuTakDicentang(u).join(', ')}>
                                        {t(`${menuTakDicentang(u).length} menu bawaan belum dicentang`, `${menuTakDicentang(u).length} default menus unchecked`)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggleUserStatus(u)}
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {u.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <TombolIkon label={t('Ubah pengguna', 'Edit user')}
                                        onClick={() => setEditUser({ ...u, modules: Array.isArray(u.modules) ? u.modules : [] })}>
                                        <Pencil size={14} />
                                      </TombolIkon>
                                      {/* Akses outlet berdiri sendiri, bukan di dalam formulir
                                          ubah pengguna: yang diubah bukan data ORANGNYA
                                          melainkan tempat ia boleh masuk, dan perannya bisa
                                          berbeda di tiap outlet. */}
                                      {/* Bukan untuk pemilik dan bukan untuk diri sendiri:
                                          database menolak keduanya, jadi tombolnya tidak
                                          ditawarkan sama sekali. */}
                                      {u.role !== 'pemilik' && u.email?.toLowerCase() !== app.session?.email?.toLowerCase() && (
                                        <TombolIkon label={t('Atur ulang kata sandi', 'Reset password')}
                                          onClick={() => handleAturUlangSandi(u)}>
                                          <KeyRound size={14} />
                                        </TombolIkon>
                                      )}
                                      <TombolIkon label={t('Atur akses outlet', 'Outlet access')}
                                        onClick={() => setAksesOutlet(u)}>
                                        <Building2 size={14} />
                                      </TombolIkon>
                                      <TombolIkon label={t('Hapus pengguna', 'Remove user')} warna="bahaya"
                                        onClick={() => handleDeleteUser(u)}>
                                        <Trash2 size={14} />
                                      </TombolIkon>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )
                  })()}        </div>
      </div>
    </div>
  )
}

/**
 * Alamat layar antrean ruang tunggu.
 *
 * Alamatnya membawa token, dan token itu SATU-SATUNYA yang menjaga layar itu.
 * Jadi ia diperlakukan seperti kunci: ada tombol memutarnya, dan peringatan
 * bahwa memutarnya membuat televisi yang sudah terpasang harus dibuka ulang.
 */
function LayarAntrean() {
  const { t } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const [token, setToken] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [tersalin, setTersalin] = useState(false)

  const ambil = async (putar = false) => {
    setSibuk(true)
    const { data, error } = await supabase.rpc('token_antrean_saya', { p_putar: putar })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setToken(data as string)
  }

  const alamat = token && typeof window !== 'undefined'
    ? `${window.location.origin}/antrean?t=${token}` : ''

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h3 className="text-base font-bold text-[var(--ink)] mb-1">
        {t('Layar antrean ruang tunggu', 'Waiting room display')}
      </h3>
      <p className="text-sm text-[var(--ink-soft)] mb-4 max-w-prose">
        {t('Buka alamat ini di televisi ruang tunggu. Layarnya TIDAK perlu login, dan memang tidak boleh: sesi petugas yang hidup di ruangan publik bisa dipakai siapa saja yang lewat. Alamat ini hanya bisa membaca nomor antrean hari ini, dan nama pasien sudah disingkat sebelum dikirim.',
           'Open this address on the waiting room TV. It does NOT need a login, and must not have one: a staff session left running in a public room can be used by anyone passing by. This address can only read today queue numbers, and patient names are shortened before being sent.')}
      </p>

      {!token ? (
        <button onClick={() => ambil(false)} disabled={sibuk}
          className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
          {t('Tampilkan alamat layar', 'Show display address')}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 truncate rounded-lg bg-[var(--surface-2)] border border-[var(--line)] px-3 py-2 text-xs">
              {alamat}
            </code>
            <button onClick={() => { navigator.clipboard.writeText(alamat); setTersalin(true); setTimeout(() => setTersalin(false), 2000) }}
              className="px-3 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--ink-soft)] hover:bg-[var(--surface-2)] transition">
              {tersalin ? t('tersalin', 'copied') : t('Salin', 'Copy')}
            </button>
          </div>
          <button onClick={async () => {
              if (await konfirmasi({
                judul: t('Putar token layar antrean?', 'Rotate the waiting-room token?'),
                pesan: t('Televisi yang sudah terpasang harus dibuka ulang dengan alamat yang baru, dan alamat lamanya langsung mati.',
                         'Any TV already set up must be reopened with the new address, and the old one stops working immediately.'),
                tombol: t('Putar token', 'Rotate token'),
                bahaya: true,
              })) ambil(true)
            }}
            disabled={sibuk}
            className="text-xs text-[var(--ink-faint)] hover:text-red-600 underline underline-offset-2 disabled:opacity-50">
            {t('Putar token', 'Rotate token')}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Asuransi rekanan faskes ini.
 *
 * Dipisah dari nilai `penjamin` dengan sengaja (migrasi 0048): tiap klinik
 * punya rekanan berbeda dan daftarnya berubah tiap kontrak diperbarui. Kalau
 * jadi nilai status, klinik yang menambah rekanan harus menunggu migrasi baru
 * dan pengembangnya. Di sini pemilik menambahnya sendiri.
 *
 * Dinonaktifkan, bukan dihapus: kunjungan lama menunjuk ke barisnya, dan
 * menghapusnya berarti tagihan tahun lalu kehilangan nama penjaminnya.
 */
function DaftarAsuransi() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()
  const [daftar, setDaftar] = useState<any[]>([])
  const [nama, setNama] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    const { data } = await app.scope(
      supabase.from('insurers').select('id,nama,aktif').order('nama'))
    setDaftar((data as any[]) || [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const tambah = async () => {
    const n = nama.trim()
    if (!n) return
    setSibuk(true)
    const { error } = await supabase.from('insurers').insert([{ nama: n }])
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setNama(''); muat()
  }

  const ubahAktif = async (a: any) => {
    setSibuk(true)
    const { error } = await supabase.from('insurers').update({ aktif: !a.aktif }).eq('id', a.id)
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h3 className="text-base font-bold text-[var(--ink)] mb-1">
        {t('Asuransi rekanan', 'Partner insurers')}
      </h3>
      <p className="text-sm text-[var(--ink-soft)] mb-4 max-w-prose">
        {t('Allianz, Prudential, Mandiri Inhealth, dan seterusnya. Yang ada di sini muncul sebagai pilihan saat mendaftarkan pasien berpenjamin asuransi, dan nanti memisahkan laporan tagihan per penjamin.',
           'Allianz, Prudential, Mandiri Inhealth, and so on. These appear when registering an insured patient, and later split the billing report per payer.')}
      </p>

      <div className="flex gap-2 mb-3">
        <input value={nama} onChange={e => setNama(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') tambah() }}
          placeholder={t('mis. Allianz', 'e.g. Allianz')}
          className="flex-1 border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        <button onClick={tambah} disabled={sibuk || !nama.trim()}
          className="bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
          {t('Tambah', 'Add')}
        </button>
      </div>

      {daftar.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">
          {t('Belum ada asuransi rekanan.', 'No partner insurers yet.')}
        </p>
      ) : (
        <div className="space-y-1">
          {daftar.map(a => (
            <div key={a.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--line)] ${a.aktif ? '' : 'opacity-55'}`}>
              <span className="text-sm text-[var(--ink)] flex-1 truncate">{a.nama}</span>
              {!a.aktif && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-2)] text-[var(--ink-faint)]">
                  {t('NONAKTIF', 'INACTIVE')}
                </span>
              )}
              {/* Dinonaktifkan, bukan dihapus: kunjungan lama menunjuk ke sini. */}
              <button onClick={() => ubahAktif(a)} disabled={sibuk}
                className="text-xs text-[var(--ink-faint)] hover:text-[var(--brand)] underline underline-offset-2 disabled:opacity-50">
                {a.aktif ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan', 'Activate')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
