'use client'

import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang, LangToggle } from '../lib/i18n'
import { ThemeToggle } from '../lib/theme'

const inputCls =
  'w-full border border-[var(--line)] bg-[var(--surface)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'


function Logo() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="relative w-11 h-11 rounded-2xl bg-[var(--brand)] flex items-center justify-center">
        <FlaskConical size={22} className="text-white" strokeWidth={1.8} />
        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
      </div>
      <div>
        <div className="font-bold text-[var(--ink)] leading-tight">Sehatera</div>
        <div className="text-xs text-[var(--ink-faint)]">by Seawise Studio</div>
      </div>
    </div>
  )
}

export default function Auth() {
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needConfirm, setNeedConfirm] = useState(false)
  const [info, setInfo] = useState('')

  // Signup
  const [namaApotek, setNamaApotek] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPassword, setSPassword] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [sLoading, setSLoading] = useState(false)
  const [sError, setSError] = useState('')
  const [sSukses, setSSukses] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError(''); setInfo(''); setNeedConfirm(false)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('not confirmed') || m.includes('confirm')) { setNeedConfirm(true); setError(t('Email belum dikonfirmasi. Konfirmasi lewat email verifikasi, atau matikan "Confirm email" di Supabase.', 'Email not confirmed. Confirm via the verification email, or turn off "Confirm email" in Supabase.')) }
      else if (m.includes('invalid login')) setError(t('Email atau password salah.', 'Incorrect email or password.'))
      else setError(error.message)
    } else { window.location.href = '/dashboard' }
    setLoading(false)
  }

  const resendConfirmation = async () => {
    setInfo(''); setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    if (error) setError(t('Gagal kirim ulang: ', 'Failed to resend: ') + error.message)
    else setInfo(t('Email verifikasi dikirim ulang. Cek inbox/spam.', 'Verification email resent. Check your inbox/spam.'))
  }

  const handleRegister = async () => {
    setSError(''); setSSukses('')
    if (!namaApotek || !sEmail || !sPassword) return setSError(t('Nama apotek, email, dan password wajib diisi', 'Pharmacy name, email, and password are required'))
    if (sPassword.length < 6) return setSError(t('Password minimal 6 karakter', 'Password must be at least 6 characters'))
    if (sPassword !== konfirmasi) return setSError(t('Konfirmasi password tidak cocok', 'Password confirmation does not match'))
    setSLoading(true)
    // Nama apotek & nama lengkap disimpan di metadata akun, bukan cuma di state
    // halaman ini. Kalau konfirmasi email menyala, orang menutup tab lalu
    // kembali lewat tautan di emailnya — dan pada saat itu isian formulir ini
    // sudah lama hilang. Metadata yang membawanya sampai ke pendaftaran apotek.
    const { data, error } = await supabase.auth.signUp({
      email: sEmail.trim().toLowerCase(), password: sPassword,
      options: { data: { nama_apotek: namaApotek.trim(), nama_lengkap: namaLengkap.trim() } },
    })
    if (error) { setSLoading(false); setSError(error.message); return }

    // Apotek dibentuk lewat satu fungsi database, bukan dengan menulis ke tabel
    // `companies` dari browser: penulisan langsung itu berarti tabel klien harus
    // terbuka untuk siapa saja, dan itulah lubang yang ditutup di migrasi 0002.
    if (data.session) {
      const { error: rpcError } = await supabase.rpc('register_apotek', {
        p_nama_apotek: namaApotek.trim(),
        p_nama_admin: namaLengkap.trim(),
      })
      setSLoading(false)
      if (rpcError) { setSError(rpcError.message); return }
      window.location.href = '/dashboard'
      return
    }

    // Belum ada sesi berarti konfirmasi email menyala. Apoteknya dibentuk nanti
    // saat login pertama (lihat app/dashboard/page.tsx).
    setSLoading(false)
    setSSukses(t(
      'Pendaftaran berhasil! Cek email Anda untuk konfirmasi, lalu masuk — apotek Anda langsung aktif dengan masa coba 14 hari.',
      'Registration successful! Check your email to confirm, then sign in — your pharmacy starts with a 14-day free trial.',
    ))
  }

  return (
    <div className="sw-ambient min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-5 sm:top-6 sm:right-8 flex items-center gap-2">
        <ThemeToggle />
        <LangToggle />
        <a href="/kenapa" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] bg-[var(--surface)]/70 backdrop-blur-sm border border-black/5 px-3.5 py-2 rounded-full shadow-sm hover:bg-[var(--surface)] transition">
          ✨ {t('Kenapa aplikasi ini?', 'Why this app?')}
        </a>
      </div>
      <div className={`sw-auth ${mode === 'signup' ? 'active' : ''}`}>

        {/* ── Login form ── */}
        <div className="sw-form sw-form--login p-8 sm:p-10 md:p-12">
          <Logo />
          <p className="text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-2">{t('Selamat Datang Kembali', 'Welcome Back')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-6">{t('Masuk', 'Sign In')}</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
              {needConfirm && <button onClick={resendConfirmation} className="block mt-2 text-[var(--brand)] font-medium underline">{t('Kirim ulang email verifikasi', 'Resend verification email')}</button>}
            </div>
          )}
          {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{info}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">Email</label>
              <input type="email" placeholder="nama@apotek.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputCls} />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
              {loading ? t('Memproses...', 'Processing...') : t('Masuk', 'Sign In')}
            </button>
          </div>
          <p className="text-sm text-[var(--ink-soft)] mt-6 md:hidden">{t('Belum punya akun?', "Don't have an account?")} <button onClick={() => setMode('signup')} className="text-[var(--brand)] font-semibold">{t('Daftar', 'Sign Up')}</button></p>
        </div>

        {/* ── Signup form ── */}
        <div className="sw-form sw-form--signup p-8 sm:p-10 md:p-12">
          <Logo />
          <p className="text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-2">{t('Gabung Sekarang', 'Join Now')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-1">{t('Daftarkan Apotek', 'Register Pharmacy')}</h1>
          <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Gratis mendaftar, aktivasi oleh tim Seawise.', 'Free to register, activated by the Seawise team.')}</p>
          {sError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{sError}</div>}
          {sSukses && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{sSukses}</div>}
          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">{t('Nama Apotek', 'Pharmacy Name')}</label>
              <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)} placeholder={t('Apotek Sehat Sentosa', 'Sehat Sentosa Pharmacy')} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">{t('Nama Lengkap', 'Full Name')}</label>
                <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)} placeholder={t('Nama apoteker', 'Pharmacist name')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">Email</label>
                <input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="kamu@apotek.com" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">Password</label>
                <input type="password" value={sPassword} onChange={e => setSPassword(e.target.value)} placeholder={t('Min. 6 karakter', 'Min. 6 characters')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink-mid)] mb-1.5">{t('Konfirmasi', 'Confirm')}</label>
                <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder={t('Ulangi password', 'Repeat password')} className={inputCls} />
              </div>
            </div>
            <button onClick={handleRegister} disabled={sLoading} className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
              {sLoading ? t('Memproses...', 'Processing...') : t('Daftarkan Apotek', 'Register Pharmacy')}
            </button>
          </div>
          <p className="text-sm text-[var(--ink-soft)] mt-5 md:hidden">{t('Sudah punya akun?', 'Already have an account?')} <button onClick={() => setMode('login')} className="text-[var(--brand)] font-semibold">{t('Masuk', 'Sign In')}</button></p>
        </div>

        {/* ── Overlay (slides) ── */}
        <div className="sw-overlay">
          {/* Login mode → invite to sign up */}
          <div className="sw-overlay-face sw-overlay-face--signup">
            <div className="relative mb-6">
              <FlaskConical size={44} className="text-[var(--on-grad)]" strokeWidth={1.5} />
              <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--on-grad)] mb-3">{t('Apotek baru di sini?', 'New pharmacy here?')}</h2>
            <p className="text-[var(--on-grad-soft)] text-sm leading-relaxed max-w-xs mb-6">{t('Daftarkan apotekmu dan kelola stok, transaksi, hingga tindak lanjut barang expired dalam satu aplikasi.', 'Register your pharmacy and manage stock, sales, and expired-goods follow-up in one app.')}</p>
            <button onClick={() => setMode('signup')} className="px-6 py-2.5 rounded-xl border border-[var(--on-grad)]/35 text-[var(--on-grad)] text-sm font-medium hover:bg-[var(--on-grad)]/10 transition">{t('Daftarkan Apotek', 'Register Pharmacy')}</button>
          </div>
          {/* Signup mode → invite to sign in */}
          <div className="sw-overlay-face sw-overlay-face--login">
            <div className="relative mb-6">
              <FlaskConical size={44} className="text-[var(--on-grad)]" strokeWidth={1.5} />
              <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--on-grad)] mb-3">{t('Sudah punya akun?', 'Already have an account?')}</h2>
            <p className="text-[var(--on-grad-soft)] text-sm leading-relaxed max-w-xs mb-6">{t('Masuk dan lanjutkan mengelola apotekmu dari tempat terakhir.', 'Sign in and continue managing your pharmacy where you left off.')}</p>
            <button onClick={() => setMode('login')} className="px-6 py-2.5 rounded-xl border border-[var(--on-grad)]/35 text-[var(--on-grad)] text-sm font-medium hover:bg-[var(--on-grad)]/10 transition">{t('Masuk', 'Sign In')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
