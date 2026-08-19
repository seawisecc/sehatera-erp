'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, ChevronRight, CreditCard, Eye, LayoutGrid, LogOut, Menu, Settings, ShieldCheck, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import PemilihOutlet from '@/components/PemilihOutlet'
import { useLang, LangToggle } from '@/lib/i18n'
import { ThemeToggle } from '@/lib/theme'
import { Logo, Mark } from '@/components/Logo'
import { menuTampil, menuAktif, ROLE_LABELS, RUTE_FOKUS, type MenuItem } from '@/lib/navigation'

/**
 * Kerangka aplikasi: sidebar, topbar, navigasi bawah, spanduk langganan.
 *
 * Dulu semuanya hidup di dalam `app/dashboard/page.tsx` dan berpindah halaman
 * berarti mengganti sebuah string di `useState`. Sekarang halaman ditentukan
 * alamat, dan kerangka ini tetap terpasang saat isinya berganti: menu langsung
 * menyala, tidak ada kedipan, dan tombol back peramban bekerja seperti yang
 * orang harapkan.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t, lang } = useLang()
  const app = useApp()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  /**
   * Pilihan lipat sidebar milik PENGGUNA, terpisah dari lipat otomatis.
   *
   * Tanpa pemisahan ini, mode fokus menimpa pilihan orang secara permanen:
   * masuk ke Kasir sekali, dan sidebar tetap menyempit di semua halaman lain
   * sesudahnya karena keadaan terakhirnya ikut tersimpan.
   */
  const pinRef = useRef(false)
  useEffect(() => {
    try { pinRef.current = localStorage.getItem('sw_sidebar_collapsed') === '1' } catch {}
    setSidebarCollapsed(pinRef.current)
  }, [])

  // Mode fokus: Kasir adalah halaman tempat orang berhadapan dengan pembeli,
  // bukan sedang mencari menu.
  useEffect(() => {
    setSidebarCollapsed(RUTE_FOKUS.some(r => pathname.startsWith(r)) ? true : pinRef.current)
  }, [pathname])

  // Menu mobile dan lembar "Lainnya" harus tertutup sendiri sesudah pindah
  // halaman, kalau tidak keduanya masih menutupi halaman tujuan.
  useEffect(() => { setMobileNavOpen(false); setMoreOpen(false); setAccountOpen(false) }, [pathname])

  const nav = menuTampil(app.allowedPages, app.isSuper)
  const aktif = nav.find(m => menuAktif(pathname, m))
  const judul = aktif ? (lang === 'en' ? aktif.en : aktif.label) : 'Sehatera'

  const keluar = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const lipat = () => {
    const nv = !sidebarCollapsed
    setSidebarCollapsed(nv)
    pinRef.current = nv
    try { localStorage.setItem('sw_sidebar_collapsed', nv ? '1' : '0') } catch {}
  }

  const banner = app.langganan.pesan

  return (
    <div className="sw-ambient min-h-screen">
      {/* ══ SPANDUK MENGINTIP ══
          Super admin yang sedang "melihat sebagai" satu apotek memegang data
          orang lain, dan setiap tombol simpan di layar itu menulis ke apotek
          itu, bukan ke miliknya. Selama ini keadaan itu hanya ditandai oleh
          satu dropdown kecil di topbar yang mudah luput, terutama sesudah
          beberapa kali pindah halaman. Spanduk ini menempel di paling atas,
          tidak bisa ditutup, dan membawa jalan keluarnya sendiri. */}
      {app.isSuper && app.superViewCompany && (
        <div
          role="status"
          className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 bg-amber-500 text-amber-950"
        >
          <Eye size={15} className="shrink-0" />
          <p className="text-sm font-semibold">
            {t('Kamu sedang melihat sebagai', 'You are viewing as')} {app.namaFaskes}
          </p>
          <p className="text-xs opacity-80">
            {t('Semua yang kamu simpan masuk ke apotek ini, bukan ke akunmu.',
               'Everything you save goes to this pharmacy, not to your own account.')}
          </p>
          <button
            onClick={() => app.setSuperViewCompany('')}
            className="ml-auto shrink-0 px-3 py-1 rounded-lg bg-amber-950/15 hover:bg-amber-950/25 text-xs font-semibold transition"
          >
            {t('Keluar dari tampilan ini', 'Exit this view')}
          </button>
        </div>
      )}

      {/* ── Topbar mobile ── */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[var(--brand)] text-[var(--on-brand)]">
        <button onClick={() => setMobileNavOpen(true)} aria-label="Menu"><Menu size={22} /></button>
        <span className="font-medium truncate">{app.namaFaskes}</span>
      </div>

      <div className="md:flex md:min-h-screen">
        {mobileNavOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
        )}

        {/* ══ SIDEBAR ══ */}
        <div
          className={`${sidebarCollapsed ? 'md:w-[64px]' : 'md:w-64'} w-64 bg-gradient-to-b from-[var(--brand)] via-[var(--brand-soft)] to-[var(--brand-hover)] flex flex-col shrink-0 fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 md:z-auto ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          style={{ transition: 'transform var(--t-normal) var(--ease), width var(--t-normal) var(--ease)' }}
        >
          <div className={`${sidebarCollapsed ? 'px-2' : 'px-5'} pt-5 pb-3`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              {sidebarCollapsed
                ? <Mark size={26} variant="mono" className="text-[var(--on-brand)]" />
                : <Logo size={38} sub={app.namaFaskes} tone="onBrand" />}
              <button onClick={() => setMobileNavOpen(false)} className="md:hidden ml-auto text-[var(--on-brand-soft)] hover:text-white" aria-label="Tutup menu">
                <X size={20} />
              </button>
            </div>
          </div>

          {/*
            Tombol lipat duduk di ANTARA logo dan menu, bukan mengambang di
            tepi luar sidebar.

            Yang mengambang di tepi terlihat seperti tombol yang tidak punya
            rumah: ia menindih isi halaman di sebelahnya, bergeser sendiri saat
            sidebar dilipat, dan di layar sempit menempel pada teks. Di antara
            logo dan menu ia jelas milik sidebar, dan garis pemisahnya sekalian
            memisahkan identitas dari navigasi.
          */}
          <div className={`hidden md:flex ${sidebarCollapsed ? 'px-2 justify-center' : 'px-4 justify-end'} pb-2 border-b border-[var(--on-brand)]/15 mb-2`}>
            <button
              onClick={lipat}
              title={sidebarCollapsed ? t('Perlebar sidebar', 'Expand sidebar') : t('Perkecil sidebar', 'Collapse sidebar')}
              aria-label={sidebarCollapsed ? t('Perlebar sidebar', 'Expand sidebar') : t('Perkecil sidebar', 'Collapse sidebar')}
              aria-expanded={!sidebarCollapsed}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--on-brand-soft)] hover:text-[var(--on-brand)] hover:bg-[var(--on-brand)]/10"
              style={{ transition: 'background-color var(--t-quick) var(--ease), color var(--t-quick) var(--ease)' }}
            >
              <ChevronRight size={16} style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform var(--t-normal) var(--ease)' }} />
            </button>
          </div>

          <nav className={`flex-1 min-h-0 overflow-y-auto ${sidebarCollapsed ? 'px-2' : 'px-3'} pb-2 space-y-1`}>
            {nav.map(item => <ItemNav key={item.id} item={item} aktif={menuAktif(pathname, item)} ciut={sidebarCollapsed} lang={lang} />)}
          </nav>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* ══ TOPBAR ══ */}
          <header className="hidden md:flex sticky top-0 z-30 h-16 items-center gap-3 px-6 bg-[var(--surface)]/85 backdrop-blur border-b border-[var(--line)]">
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-[var(--ink)] truncate leading-tight">{judul}</h1>
              <p className="text-xs text-[var(--ink-faint)] truncate">{app.namaFaskes}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Pemilih outlet menyembunyikan dirinya sendiri kalau outletnya
                  cuma satu, jadi apotek tunggal tidak pernah melihatnya. */}
              <PemilihOutlet />
              {app.isSuper && (
                <select
                  value={app.superViewCompany}
                  onChange={e => app.setSuperViewCompany(e.target.value)}
                  aria-label={t('Lihat sebagai faskes', 'View as facility')}
                  className="max-w-[190px] px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] text-xs"
                >
                  <option value="">{t('Semua faskes', 'All facilities')}</option>
                  {app.companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </select>
              )}
              <LangToggle />
              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)]"
                  style={{ transition: 'background-color var(--t-quick) var(--ease)' }}
                >
                  <span className="w-7 h-7 rounded-full bg-[var(--brand)] text-[var(--on-brand)] text-xs font-semibold flex items-center justify-center shrink-0">
                    {(app.authName || 'U').trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:block text-xs font-medium text-[var(--ink)] max-w-[130px] truncate">
                    {app.authName || t('Pengguna', 'User')}
                  </span>
                </button>

                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                    <div role="menu" className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-lg overflow-hidden sw-anim-fade">
                      <div className="px-4 py-3 border-b border-[var(--line-soft)]">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{app.authName || t('Pengguna', 'User')}</p>
                        <p className="text-xs text-[var(--ink-faint)] truncate">{app.session?.email}</p>
                        <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-soft)] text-[10px] font-medium">
                          <ShieldCheck size={11} /> {app.currentRole ? (ROLE_LABELS[app.currentRole] || app.currentRole) : '…'}
                        </span>
                      </div>
                      {app.allowedPages.includes('pengaturan') && (
                        <Link href="/pengaturan" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--ink-mid)] hover:bg-[var(--surface-2)]">
                          <Settings size={15} /> {t('Pengaturan', 'Settings')}
                        </Link>
                      )}
                      <Link href="/pengaturan?tab=langganan" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--ink-mid)] hover:bg-[var(--surface-2)]">
                        <CreditCard size={15} /> {t('Langganan', 'Subscription')}
                      </Link>
                      <button onClick={keluar} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--accent)] hover:bg-[var(--surface-2)] text-left border-t border-[var(--line-soft)]">
                        <LogOut size={15} /> {t('Keluar', 'Sign out')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">
            {banner && (
              <div
                role={banner.nada === 'berhenti' ? 'alert' : undefined}
                className={`mb-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${
                  banner.nada === 'berhenti' ? 'border-red-300 bg-red-50 text-red-900'
                  : banner.nada === 'peringatan' ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)]'
                }`}
              >
                <AlertTriangle size={17} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{banner.judul}</p>
                  <p className="text-xs mt-0.5 leading-relaxed opacity-90">{banner.isi}</p>
                </div>
                <Link href="/pengaturan?tab=langganan" className="ml-auto shrink-0 self-center text-xs font-semibold underline underline-offset-2 whitespace-nowrap">
                  {t('Lihat langganan', 'View subscription')}
                </Link>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* ══ Navigasi bawah (mobile) ══ */}
      <NavBawah
        nav={nav}
        pathname={pathname}
        lang={lang}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
        authName={app.authName}
        role={app.currentRole}
        keluar={keluar}
      />
    </div>
  )
}

/**
 * Satu baris menu di sidebar.
 *
 * Menu aktif memakai GRADASI tema, bukan kabut putih tipis seperti sebelumnya.
 * Kabut putih di atas sidebar yang sendirinya sudah gradasi hanya menaikkan
 * terangnya sedikit, dan pada layar kasir yang menyala terus sepanjang hari
 * selisih setipis itu praktis tidak terbaca. Gradasi tema membalik
 * hubungannya: yang aktif jadi terang di atas latar gelap, jadi terbaca dari
 * sudut mata tanpa dicari.
 *
 * Warna tulisannya memakai --on-grad, bukan putih. Gradasi keempat tema ini
 * terang, dan putih di atasnya hilang.
 */
function ItemNav({ item, aktif, ciut, lang }: { item: MenuItem; aktif: boolean; ciut: boolean; lang: string }) {
  const Icon = item.icon
  const nama = lang === 'en' ? item.en : item.label
  return (
    <Link
      href={item.href}
      title={ciut ? nama : undefined}
      aria-current={aktif ? 'page' : undefined}
      className={`relative w-full flex items-center ${ciut ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm ${
        aktif
          ? 'font-semibold shadow-sm'
          : 'text-[var(--on-brand-soft)] hover:bg-white/[0.07] hover:text-white'
      }`}
      style={{
        transition: 'background-color var(--t-quick) var(--ease), color var(--t-quick) var(--ease)',
        ...(aktif ? { background: 'var(--grad)', color: 'var(--on-grad)' } : null),
      }}
    >
      <Icon size={17} className="shrink-0" strokeWidth={aktif ? 2.4 : 2} />
      {!ciut && <span className="truncate">{nama}</span>}
    </Link>
  )
}

function NavBawah({
  nav, pathname, lang, moreOpen, setMoreOpen, authName, role, keluar,
}: {
  nav: MenuItem[]; pathname: string; lang: string
  moreOpen: boolean; setMoreOpen: (v: boolean) => void
  authName: string; role: string | null; keluar: () => void
}) {
  const { t } = useLang()
  const utama = nav.slice(0, 4)
  const sisa = nav.slice(4)
  const singkat = (m: MenuItem) => (lang === 'en' ? m.en : m.label).split(/[ &/]/)[0]
  const sisaAktif = sisa.some(m => menuAktif(pathname, m))

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)]/95 backdrop-blur border-t border-[var(--line)] flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={t('Navigasi bawah', 'Bottom navigation')}
      >
        {utama.map(item => {
          const Icon = item.icon
          const on = menuAktif(pathname, item)
          return (
            <Link key={item.id} href={item.href} aria-current={on ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${on ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>
              <span className={`flex items-center justify-center w-10 h-6 rounded-full ${on ? 'bg-[var(--brand)]/10' : ''}`}><Icon size={19} /></span>
              <span className="text-[10px] font-medium leading-none">{singkat(item)}</span>
            </Link>
          )
        })}
        {sisa.length > 0 && (
          <button onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${sisaAktif || moreOpen ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>
            <span className={`flex items-center justify-center w-10 h-6 rounded-full ${sisaAktif || moreOpen ? 'bg-[var(--brand)]/10' : ''}`}><LayoutGrid size={19} /></span>
            <span className="text-[10px] font-medium leading-none">{t('Lainnya', 'More')}</span>
          </button>
        )}
      </nav>

      {moreOpen && sisa.length > 0 && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[var(--surface)] rounded-t-3xl p-4 sw-sheet"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="w-10 h-1 rounded-full bg-[var(--line)] mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--ink)]">{t('Menu Lainnya', 'More Menu')}</p>
              <button onClick={() => setMoreOpen(false)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label="Tutup"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sisa.map(item => {
                const Icon = item.icon
                const on = menuAktif(pathname, item)
                return (
                  <Link key={item.id} href={item.href}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border ${on ? 'border-[var(--brand)] bg-[var(--surface-2)] text-[var(--brand)]' : 'border-[var(--line-soft)] text-[var(--ink-mid)]'}`}>
                    <Icon size={20} />
                    <span className="text-[10px] font-medium text-center leading-tight px-0.5">{lang === 'en' ? item.en : item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Identitas dan pemilih tema ada di menu akun pada topbar, tapi
                mobile tidak punya topbar itu. Tanpa bagian ini orang kehilangan
                satu-satunya tempat melihat sedang masuk sebagai siapa. */}
            <div className="border-t border-[var(--line-soft)] mt-4 pt-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold flex items-center justify-center shrink-0">
                  {(authName || 'U').trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{authName || t('Pengguna', 'User')}</p>
                  <p className="text-[11px] text-[var(--ink-faint)] truncate">{role ? (ROLE_LABELS[role] || role) : '…'}</p>
                </div>
                <button onClick={keluar} className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] font-medium shrink-0">
                  <LogOut size={15} /> {t('Keluar', 'Sign out')}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <LangToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
