'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLang, LangToggle } from '../../lib/i18n'
import { AuthBackdrop } from '../../components/AuthBackdrop'
import { Logo } from '../../components/Logo'

/**
 * Tempat tautan "atur ulang kata sandi" dari email mendarat.
 *
 * Sampai 28 September 2026 Sehatera tidak punya jalan lupa sandi sama sekali:
 * pemilik klinik yang lupa sandinya harus menghubungi Seawise, dan kasir yang
 * lupa sandinya menunggu pemiliknya. Halaman ini lahir bersamaan dengan SMTP
 * Resend, karena tanpa email yang benar-benar sampai, tautannya tidak ada.
 *
 * Tautannya membawa token pemulihan di alamatnya, dan supabase-js membacanya
 * sendiri saat halaman dimuat (detectSessionInUrl). Yang dilakukan di sini
 * cuma menunggu sesi pemulihan itu ada, lalu mengganti sandinya.
 */

const inputCls =
  'glass-field w-full rounded-xl px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)]'

// Sama dengan formulir pendaftaran. Kalau yang satu lebih longgar, orang
// memakai jalan itu untuk memasang sandi yang ditolak jalan lainnya.
const MIN_SANDI = 8

type Keadaan = 'menunggu' | 'siap' | 'kedaluwarsa' | 'selesai'

export default function AturSandi() {
  const { t } = useLang()
  const [keadaan, setKeadaan] = useState<Keadaan>('menunggu')
  const [sandi, setSandi] = useState('')
  const [ulang, setUlang] = useState('')
  const [lihat, setLihat] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    // Tautan yang kedaluwarsa atau sudah dipakai kembali membawa galat di
    // alamatnya, bukan token. Katakan itu, jangan biarkan formulirnya tampil
    // lalu gagal saat disimpan.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (hash.get('error') || hash.get('error_code')) {
      setKeadaan('kedaluwarsa')
      return
    }

    const { data: dengar } = supabase.auth.onAuthStateChange((kejadian, sesi) => {
      if (kejadian === 'PASSWORD_RECOVERY' || (sesi && kejadian === 'SIGNED_IN')) setKeadaan('siap')
    })
    // Kalau token di alamat sudah diproses sebelum pendengar terpasang, sesinya
    // sudah ada. Beri waktu sebentar sebelum menyimpulkan tautannya tidak sah.
    const cek = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      setKeadaan(k => k !== 'menunggu' ? k : data.session ? 'siap' : 'kedaluwarsa')
    }, 1500)
    return () => { dengar.subscription.unsubscribe(); clearTimeout(cek) }
  }, [])

  const simpan = async () => {
    setGalat('')
    if (sandi.length < MIN_SANDI) {
      setGalat(t(`Kata sandi minimal ${MIN_SANDI} karakter.`, `The password needs at least ${MIN_SANDI} characters.`))
      return
    }
    if (sandi !== ulang) {
      setGalat(t('Kedua kata sandi tidak sama.', 'The two passwords do not match.'))
      return
    }
    setSibuk(true)
    const { error } = await supabase.auth.updateUser({ password: sandi })
    setSibuk(false)
    if (error) {
      const m = error.message.toLowerCase()
      setGalat(m.includes('different from the old')
        ? t('Kata sandi baru harus berbeda dari yang lama.', 'The new password must differ from the old one.')
        : m.includes('weak') || m.includes('pwned') || m.includes('leaked')
          ? t('Kata sandi ini terlalu mudah ditebak atau pernah bocor di internet. Pilih yang lain.',
              'This password is too easy to guess or has appeared in a data leak. Choose another.')
          : error.message)
      return
    }
    setKeadaan('selesai')
    // Sesi pemulihan sudah jadi sesi biasa; langsung masuk ke aplikasinya.
    setTimeout(() => { window.location.href = '/beranda' }, 1800)
  }

  const label = 'block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5'

  return (
    <div className="min-h-screen flex flex-col relative">
      <AuthBackdrop />
      <header className="relative z-20 w-full max-w-md mx-auto px-4 pt-5 flex items-center">
        <Logo size={32} />
        <div className="ml-auto"><LangToggle /></div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="glass w-full max-w-md rounded-2xl p-6 sm:p-8">
          <h1 className="text-[26px] font-bold text-[var(--ink)] tracking-[-0.01em]">
            {t('Atur kata sandi baru', 'Set a new password')}
          </h1>

          {keadaan === 'menunggu' && (
            <p className="text-sm text-[var(--ink-soft)] mt-3">{t('Memeriksa tautan…', 'Checking the link…')}</p>
          )}

          {keadaan === 'kedaluwarsa' && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {t('Tautan ini sudah kedaluwarsa atau sudah pernah dipakai. Tautan atur ulang hanya berlaku sekali dan untuk waktu singkat. Minta tautan baru dari halaman masuk.',
                   'This link has expired or was already used. Reset links work once and only briefly. Request a new one from the sign-in page.')}
              </p>
              <a href="/?lupa=1"
                className="block text-center w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition">
                {t('Minta tautan baru', 'Request a new link')}
              </a>
            </div>
          )}

          {keadaan === 'siap' && (
            <div className="mt-2">
              <p className="text-sm text-[var(--ink-soft)] mb-6">
                {t(`Minimal ${MIN_SANDI} karakter. Sesudah disimpan, Anda langsung masuk.`,
                   `At least ${MIN_SANDI} characters. Once saved, you are signed straight in.`)}
              </p>
              {galat && (
                <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm leading-relaxed">{galat}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="sandi-baru" className={label}>{t('Kata sandi baru', 'New password')}</label>
                  <div className="relative">
                    <input id="sandi-baru" type={lihat ? 'text' : 'password'} value={sandi} autoComplete="new-password"
                      onChange={e => setSandi(e.target.value)} className={inputCls + ' pr-11'} />
                    <button type="button" onClick={() => setLihat(v => !v)}
                      aria-label={lihat ? t('Sembunyikan kata sandi', 'Hide password') : t('Lihat kata sandi', 'Show password')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
                      {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="sandi-ulang" className={label}>{t('Ulangi', 'Repeat')}</label>
                  <input id="sandi-ulang" type={lihat ? 'text' : 'password'} value={ulang} autoComplete="new-password"
                    onChange={e => setUlang(e.target.value)} onKeyDown={e => e.key === 'Enter' && simpan()}
                    className={inputCls} />
                </div>
                <button onClick={simpan} disabled={sibuk}
                  className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan kata sandi', 'Save password')}
                </button>
              </div>
            </div>
          )}

          {keadaan === 'selesai' && (
            <p className="mt-4 px-3.5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
              {t('Kata sandi tersimpan. Membuka aplikasi…', 'Password saved. Opening the app…')}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
