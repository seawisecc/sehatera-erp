'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Building2, Check, ChevronRight, CreditCard, Database,
  LayoutGrid, Pencil, ScrollText, Send, ShieldCheck, Trash2, Upload, UserPlus, Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useTheme, ThemePicker } from '@/lib/theme'
import { pesanError } from '@/lib/session'
import { menuItems, ROLE_PAGES } from '@/lib/navigation'
import { tanggal } from '@/lib/format'
import JejakAudit from '@/components/JejakAudit'

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

const TAB_SAH = ['profil', 'pengguna', 'apoteker', 'tampilan', 'langganan', 'jejak'] as const
type Tab = typeof TAB_SAH[number]

export default function HalamanPengaturan() {
  const { t, lang } = useLang()
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
  const [savingUser, setSavingUser] = useState(false)
  const [kuota, setKuota] = useState<any>(null)
  const [sibuk, setSibuk] = useState(false)
  const [undangan, setUndangan] = useState<any[]>([])
  const [undanganBaru, setUndanganBaru] = useState<{ tautan: string; email: string } | null>(null)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, app.superViewCompany])

  const saveSettings = async () => {
    const payload = {
      nama_apotek: app.settingsData.nama_apotek,
      sektor_usaha: app.settingsData.sektor_usaha,
      kota: app.settingsData.kota,
      alamat: app.settingsData.alamat,
      nomor_ijin: app.settingsData.nomor_ijin,
      nomor_telepon: app.settingsData.nomor_telepon,
      email: app.settingsData.email,
      logo_url: app.settingsData.logo_url,
      nama_apoteker: app.settingsData.nama_apoteker,
      nomor_sipa: app.settingsData.nomor_sipa,
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
    if (error) { alert(pesanError(error)); return }
    alert(t('Profil apotek disimpan.', 'Pharmacy profile saved.'))
    app.muatSettings()
  }

  const handleLogoUpload = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { alert(t('Ukuran maksimal 4MB.', 'Maximum size is 4MB.')); return }
    const reader = new FileReader()
    reader.onload = () => app.setSettingsData({ ...app.settingsData, logo_url: reader.result as string })
    reader.readAsDataURL(file)
  }

  const openTambahUser = () => {
    setUserForm({ nama: '', email: '', password: '', role: 'kasir', modules: ROLE_PAGES['kasir'] })
    setShowUserForm(true)
  }

  /**
   * Mengundang anggota tim.
   *
   * Menggantikan cara lama, yaitu pemilik mengetik kata sandi awal orang itu
   * lalu memberitahukannya. Sejak itu pemilik mengetahui kata sandi kasirnya,
   * dan biasanya kata sandi itu tidak pernah diganti; setiap transaksi atas
   * nama kasir jadi tidak membuktikan siapa yang menyerahkan obat. Untuk
   * apotek yang menjual narkotika dan psikotropika itu bukan detail sepele.
   */
  const handleUndang = async () => {
    if (!userForm.email.trim()) { alert(t('Email wajib diisi.', 'Email is required.')); return }
    setSavingUser(true)
    const { data, error } = await supabase.rpc('buat_undangan', {
      p_email: userForm.email.trim(),
      p_nama: userForm.nama.trim() || null,
      p_role: userForm.role,
      p_modules: userForm.modules,
    })
    setSavingUser(false)
    if (error) { alert(pesanError(error)); return }

    // Tokennya hanya dikembalikan SEKALI, karena sesudah ini yang tersimpan di
    // database cuma sidiknya. Jadi tautannya ditampilkan sekarang, bukan nanti.
    const tautan = `${window.location.origin}/undangan/${(data as any).token}`
    setUndanganBaru({ tautan, email: (data as any).email })
    setShowUserForm(false)
    muatUndangan()
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
    if (!confirm(t(`Cabut undangan untuk ${u.email}? Tautannya langsung tidak bisa dipakai.`,
                   `Revoke the invitation for ${u.email}? The link stops working immediately.`))) return
    const { error } = await supabase.rpc('cabut_undangan', { p_id: u.id })
    if (error) { alert(pesanError(error)); return }
    muatUndangan()
  }

  const handleUpdateUser = async () => {
    if (!editUser) return
    const { error } = await supabase.from('app_users').update({
      nama: editUser.nama, role: editUser.role, status: editUser.status,
      modules: Array.isArray(editUser.modules) ? editUser.modules : [],
    }).eq('id', editUser.id)
    if (error) { alert(pesanError(error)); return }
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
    if (error) { alert(pesanError(error)); return }
    fetchUsers()
  }

  const handleDeleteUser = async (u: any) => {
    if (!confirm(t(`Hapus pengguna "${u.nama}"? Akun loginnya tetap ada, tapi ia kehilangan akses ke apotek ini.`,
                   `Delete user "${u.nama}"? Their login account remains, but they lose access to this pharmacy.`))) return
    const { error } = await supabase.from('app_users').delete().eq('id', u.id)
    if (error) { alert(pesanError(error)); return }
    fetchUsers()
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const roleLabels: Record<string, string> = {
    pemilik: t('Pemilik', 'Owner'), apoteker: t('Apoteker', 'Pharmacist'),
    asisten_apoteker: t('Asisten Apoteker', 'Pharmacist Assistant'),
    kasir: t('Kasir', 'Cashier'), admin: 'Admin',
  }
  const settingsMenu = [
    { id: 'profil',    label: t('Profil Apotek', 'Pharmacy Profile'),   desc: t('Nama, alamat, logo', 'Name, address, logo'),                Icon: Building2 },
    { id: 'pengguna',  label: t('Manajemen Pengguna', 'User Management'), desc: t('Akses pengguna, anggota tim', 'User access, team members'), Icon: Users },
    { id: 'apoteker',  label: t('Data Apoteker', 'Pharmacist Data'),    desc: t('SIA, SIPA, penanggung jawab', 'SIA, SIPA, responsible person'), Icon: ShieldCheck },
    { id: 'tampilan',  label: t('Tampilan', 'Appearance'),              desc: t('Tema warna aplikasi', 'App colour theme'),                  Icon: LayoutGrid },
    { id: 'langganan', label: t('Langganan', 'Subscription'),           desc: t('Paket, masa aktif, kuota', 'Plan, validity, quota'),        Icon: CreditCard },
    { id: 'jejak',     label: t('Jejak Audit', 'Audit Trail'),          desc: t('Siapa melakukan apa, kapan', 'Who did what, and when'),      Icon: ScrollText },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Pengaturan', 'Settings')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-6">
        {t('Kelola profil apotek, pengguna, dan data penanggung jawab.', 'Manage the pharmacy profile, users, and responsible pharmacist data.')}
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

        <div className="bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] shadow-sm rounded-2xl p-6">
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
                            alert(error ? pesanError(error)
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
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Profil apotek', 'Pharmacy profile')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">{t('Profil apotek akan ditampilkan pada struk penjualan.', 'The pharmacy profile appears on sales receipts.')}</p>
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
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama apotek', 'Pharmacy name')}</label>
                            <input value={app.settingsData.nama_apotek || ''} onChange={e => app.setSettingsData({...app.settingsData, nama_apotek: e.target.value})} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Sektor usaha', 'Business sector')}</label>
                              <input value={app.settingsData.sektor_usaha || 'Apotek'} onChange={e => app.setSettingsData({...app.settingsData, sektor_usaha: e.target.value})} className={inputCls} />
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
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nomor Ijin (SIA)', 'License No. (SIA)')}</label>
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
                  {tab === 'apoteker' && (
                    <div className="max-w-md">
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Data apoteker', 'Pharmacist data')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">{t('Penanggung jawab yang tertera di PO & Berita Acara.', 'The responsible person shown on POs & official reports.')}</p>
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
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Undang Anggota Tim', 'Invite a Team Member')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-5 leading-relaxed">
                          {t('Kamu membuat tautan undangan, dan yang diundang menentukan kata sandinya sendiri. Kamu tidak akan mengetahuinya, dan memang tidak seharusnya: selama kata sandi kasir diketahui orang lain, transaksi atas namanya tidak membuktikan siapa yang menyerahkan obat.',
                             'You create an invitation link and the invitee sets their own password. You will not know it, and should not: while someone else knows a cashier password, a sale under their name proves nothing about who handed over the medicine.')}
                        </p>
                        <div className="space-y-5">
                          <div className="border border-[var(--line)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="nama@apotek.com" className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} placeholder={t('Nama lengkap', 'Full name')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Role</label>
                              <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value, modules: ROLE_PAGES[e.target.value] || []})} className={inputCls}>
                                <option value="pemilik">{t('Pemilik', 'Owner')}</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                          <ModuleGrid selected={userForm.modules}
                            onToggle={(id) => toggleFormModule('new', id)}
                            onClear={() => setUserForm({...userForm, modules: []})}
                            onAll={() => setUserForm({...userForm, modules: menuItems.map(m => m.id)})} />
                          <button onClick={handleUndang} disabled={savingUser}
                            className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                            {savingUser ? t('Membuat undangan…', 'Creating the invitation…') : t('Buat Tautan Undangan', 'Create Invitation Link')}
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
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                <option value="admin">Admin</option>
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
                          <UserPlus size={15} /> {t('Undang Anggota', 'Invite Member')}
                        </button>
                      </div>
                      <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Atur anggota tim apotek beserta hak akses modul masing-masing.', 'Manage pharmacy team members and their module access.')}</p>

                      {/* Tautan undangan hanya bisa ditampilkan SEKALI: yang
                          tersimpan di database cuma sidiknya, jadi tidak ada
                          cara memunculkannya lagi nanti. Kotak ini bertahan
                          sampai ditutup sendiri, bukan hilang setelah beberapa
                          detik. */}
                      {undanganBaru && (
                        <div className="mb-5 rounded-2xl border border-green-300 bg-green-50 p-4">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            {t('Undangan untuk', 'Invitation for')} {undanganBaru.email} {t('sudah dibuat.', 'created.')}
                          </p>
                          <p className="text-xs text-green-800 mb-3 leading-relaxed">
                            {t('Salin tautan ini dan kirim sendiri lewat WhatsApp atau email. Tautannya hanya bisa dilihat sekarang: yang tersimpan di database cuma sidiknya, jadi kalau kotak ini ditutup, tautannya tidak bisa dimunculkan lagi. Buat undangan baru kalau terlanjur hilang.',
                               'Copy this link and send it yourself over WhatsApp or email. It can only be seen now: the database keeps only its fingerprint, so once this box closes the link cannot be shown again. Create a new invitation if it gets lost.')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <input readOnly value={undanganBaru.tautan}
                              onFocus={e => e.currentTarget.select()}
                              className="flex-1 min-w-[16rem] border border-green-300 bg-white rounded-lg px-3 py-2 text-xs num" />
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(undanganBaru.tautan)
                                  setTersalin(true); setTimeout(() => setTersalin(false), 2000)
                                } catch {
                                  alert(t('Peramban menolak menyalin. Pilih teksnya lalu salin sendiri.',
                                          'The browser refused to copy. Select the text and copy it manually.'))
                                }
                              }}
                              className="px-3 py-2 rounded-lg bg-green-700 text-white text-xs font-medium hover:bg-green-800 transition">
                              {tersalin ? t('Tersalin', 'Copied') : t('Salin', 'Copy')}
                            </button>
                            <button onClick={() => setUndanganBaru(null)}
                              className="px-3 py-2 rounded-lg border border-green-300 text-green-800 text-xs font-medium hover:bg-green-100 transition">
                              {t('Tutup', 'Close')}
                            </button>
                          </div>
                        </div>
                      )}

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
                                  <td className="px-4 py-3 text-center text-xs text-[var(--ink-soft)]">{Array.isArray(u.modules) && u.modules.length ? `${u.modules.length} ${t('modul','modules')}` : t('default role','default role')}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggleUserStatus(u)}
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {u.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => setEditUser({ ...u, modules: Array.isArray(u.modules) ? u.modules : [] })} title="Edit" className="p-1.5 rounded-lg text-[var(--brand)] hover:bg-[var(--surface-2)] transition"><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteUser(u)} title="Hapus" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
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
