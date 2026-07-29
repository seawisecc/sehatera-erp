'use client'

import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AMBIENT } from '../lib/theme'
import { useLang, LangToggle } from '../lib/i18n'

const inputCls =
  'w-full border border-[#e2ddd3] bg-white rounded-xl px-4 py-3 text-sm text-[#1c2620] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]'

// CSS animasi disematkan langsung (Tailwind v4 tidak selalu meng-emit class custom dari globals.css)
const AUTH_CSS = `
@keyframes swAuthFadeUp { from { opacity:0; transform: translateY(18px) scale(.985); } to { opacity:1; transform:none; } }
.sw-auth { position:relative; width:100%; max-width:64rem; min-height:600px; background:#f5f3ee; border-radius:28px; overflow:hidden;
  box-shadow:0 25px 60px -20px rgba(30,58,44,.45); animation: swAuthFadeUp .5s cubic-bezier(.22,.61,.36,1) both; }
.sw-form { position:absolute; top:0; height:100%; width:50%; overflow-y:auto; display:flex; flex-direction:column; justify-content:center;
  transition: opacity .7s cubic-bezier(.77,0,.18,1), transform .7s cubic-bezier(.77,0,.18,1), filter .7s ease; }
.sw-form--login  { left:0; z-index:2; }
.sw-form--signup { left:50%; z-index:1; opacity:0; transform:translateX(40px); pointer-events:none; }
.sw-auth.active .sw-form--login  { opacity:0; transform:translateX(-40px); filter:blur(5px); pointer-events:none; z-index:1; }
.sw-auth.active .sw-form--signup { opacity:1; transform:none; pointer-events:auto; z-index:2; }
.sw-overlay { position:absolute; top:0; left:50%; width:50%; height:100%; z-index:5; overflow:hidden;
  background:linear-gradient(135deg,#1b3426 0%,#22392a 45%,#6f5236 100%);
  clip-path:polygon(14% 0,100% 0,100% 100%,0 100%);
  transition:transform .9s cubic-bezier(.77,0,.18,1), clip-path .9s cubic-bezier(.77,0,.18,1); }
.sw-auth.active .sw-overlay { transform:translateX(-100%); clip-path:polygon(0 0,86% 0,100% 100%,0 100%); }
.sw-overlay-face { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2.5rem; color:#fff; transition:opacity .5s ease; }
.sw-overlay-face--login { opacity:0; pointer-events:none; }
.sw-auth.active .sw-overlay-face--signup { opacity:0; pointer-events:none; }
.sw-auth.active .sw-overlay-face--login  { opacity:1; pointer-events:auto; }
@media (max-width:768px){
  .sw-auth { min-height:0; }
  .sw-overlay { display:none; }
  .sw-form { position:relative; left:0 !important; width:100%; opacity:1 !important; transform:none !important; filter:none !important; pointer-events:auto !important; }
  .sw-form--signup { display:none; }
  .sw-auth.active .sw-form--login { display:none; }
  .sw-auth.active .sw-form--signup { display:flex; }
}
@media (prefers-reduced-motion: reduce){ .sw-auth,.sw-form,.sw-overlay,.sw-overlay-face { animation:none; transition:none; } }
`

function Logo() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="relative w-11 h-11 rounded-2xl bg-[#1e3a2c] flex items-center justify-center">
        <FlaskConical size={22} className="text-white" strokeWidth={1.8} />
        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
      </div>
      <div>
        <div className="font-bold text-[#1c2620] leading-tight">Pharmacy Store</div>
        <div className="text-xs text-[#8a8f88]">by Seawise Studio</div>
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
    const { error } = await supabase.auth.signUp({
      email: sEmail.trim().toLowerCase(), password: sPassword,
      options: { data: { nama_apotek: namaApotek, nama_lengkap: namaLengkap } },
    })
    if (error) { setSLoading(false); setSError(error.message); return }
    const slug = namaApotek.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6)
    await supabase.from('companies').insert([{ nama: namaApotek.trim(), slug, admin_nama: namaLengkap.trim(), admin_email: sEmail.trim().toLowerCase(), status: 'nonaktif', user_count: 1 }])
    setSLoading(false)
    setSSukses('Pendaftaran berhasil! Akun apotek Anda menunggu aktivasi tim Seawise sebelum bisa digunakan.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative" style={AMBIENT}>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="absolute top-4 right-5 sm:top-6 sm:right-8 flex items-center gap-2">
        <LangToggle />
        <a href="/kenapa" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a2c] bg-white/70 backdrop-blur-sm border border-black/5 px-3.5 py-2 rounded-full shadow-sm hover:bg-white transition">
          ✨ {t('Kenapa aplikasi ini?', 'Why this app?')}
        </a>
      </div>
      <div className={`sw-auth ${mode === 'signup' ? 'active' : ''}`}>

        {/* ── Login form ── */}
        <div className="sw-form sw-form--login p-8 sm:p-10 md:p-12">
          <Logo />
          <p className="text-[#c2632f] text-xs font-semibold uppercase tracking-[0.18em] mb-2">{t('Selamat Datang Kembali', 'Welcome Back')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1c2620] mb-6">{t('Masuk', 'Sign In')}</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
              {needConfirm && <button onClick={resendConfirmation} className="block mt-2 text-[#1e3a2c] font-medium underline">{t('Kirim ulang email verifikasi', 'Resend verification email')}</button>}
            </div>
          )}
          {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{info}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
              <input type="email" placeholder="nama@apotek.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputCls} />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition disabled:opacity-50">
              {loading ? t('Memproses...', 'Processing...') : t('Masuk', 'Sign In')}
            </button>
          </div>
          <p className="text-sm text-[#6b7280] mt-6 md:hidden">{t('Belum punya akun?', "Don't have an account?")} <button onClick={() => setMode('signup')} className="text-[#1e3a2c] font-semibold">{t('Daftar', 'Sign Up')}</button></p>
        </div>

        {/* ── Signup form ── */}
        <div className="sw-form sw-form--signup p-8 sm:p-10 md:p-12">
          <Logo />
          <p className="text-[#c2632f] text-xs font-semibold uppercase tracking-[0.18em] mb-2">{t('Gabung Sekarang', 'Join Now')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1c2620] mb-1">{t('Daftarkan Apotek', 'Register Pharmacy')}</h1>
          <p className="text-sm text-[#6b7280] mb-5">{t('Gratis mendaftar, aktivasi oleh tim Seawise.', 'Free to register, activated by the Seawise team.')}</p>
          {sError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{sError}</div>}
          {sSukses && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{sSukses}</div>}
          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">{t('Nama Apotek', 'Pharmacy Name')}</label>
              <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)} placeholder={t('Apotek Sehat Sentosa', 'Sehat Sentosa Pharmacy')} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">{t('Nama Lengkap', 'Full Name')}</label>
                <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)} placeholder={t('Nama apoteker', 'Pharmacist name')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="kamu@apotek.com" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
                <input type="password" value={sPassword} onChange={e => setSPassword(e.target.value)} placeholder={t('Min. 6 karakter', 'Min. 6 characters')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">{t('Konfirmasi', 'Confirm')}</label>
                <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder={t('Ulangi password', 'Repeat password')} className={inputCls} />
              </div>
            </div>
            <button onClick={handleRegister} disabled={sLoading} className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition disabled:opacity-50">
              {sLoading ? t('Memproses...', 'Processing...') : t('Daftarkan Apotek', 'Register Pharmacy')}
            </button>
          </div>
          <p className="text-sm text-[#6b7280] mt-5 md:hidden">{t('Sudah punya akun?', 'Already have an account?')} <button onClick={() => setMode('login')} className="text-[#1e3a2c] font-semibold">{t('Masuk', 'Sign In')}</button></p>
        </div>

        {/* ── Overlay (slides) ── */}
        <div className="sw-overlay">
          {/* Login mode → invite to sign up */}
          <div className="sw-overlay-face sw-overlay-face--signup">
            <div className="relative mb-6">
              <FlaskConical size={44} className="text-white" strokeWidth={1.5} />
              <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[#c2632f]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('Apotek baru di sini?', 'New pharmacy here?')}</h2>
            <p className="text-[#c9d6cc] text-sm leading-relaxed max-w-xs mb-6">{t('Daftarkan apotekmu dan kelola stok, transaksi, hingga tindak lanjut barang expired dalam satu aplikasi.', 'Register your pharmacy and manage stock, sales, and expired-goods follow-up in one app.')}</p>
            <button onClick={() => setMode('signup')} className="px-6 py-2.5 rounded-xl border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition">{t('Daftarkan Apotek', 'Register Pharmacy')}</button>
          </div>
          {/* Signup mode → invite to sign in */}
          <div className="sw-overlay-face sw-overlay-face--login">
            <div className="relative mb-6">
              <FlaskConical size={44} className="text-white" strokeWidth={1.5} />
              <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[#c2632f]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('Sudah punya akun?', 'Already have an account?')}</h2>
            <p className="text-[#c9d6cc] text-sm leading-relaxed max-w-xs mb-6">{t('Masuk dan lanjutkan mengelola apotekmu dari tempat terakhir.', 'Sign in and continue managing your pharmacy where you left off.')}</p>
            <button onClick={() => setMode('login')} className="px-6 py-2.5 rounded-xl border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition">{t('Masuk', 'Sign In')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
