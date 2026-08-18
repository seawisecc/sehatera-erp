'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang, LangToggle } from '../lib/i18n'
import { ThemeToggle } from '../lib/theme'
import { Check, Eye, EyeOff } from 'lucide-react'
import { AuthBackdrop } from '../components/AuthBackdrop'
import { Logo } from '../components/Logo'

const inputCls =
  'glass-field w-full rounded-xl px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)]'


export default function Auth() {
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needConfirm, setNeedConfirm] = useState(false)
  const [lihatSandi, setLihatSandi] = useState(false)
  const [info, setInfo] = useState('')

  // Signup
  const [namaApotek, setNamaApotek] = useState('')
  const [sektor, setSektor] = useState<'apotek' | 'klinik'>('apotek')
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
    if (!namaApotek || !sEmail || !sPassword) return setSError(t('Nama faskes, email, dan password wajib diisi', 'Facility name, email, and password are required'))
    if (sPassword.length < 6) return setSError(t('Password minimal 6 karakter', 'Password must be at least 6 characters'))
    if (sPassword !== konfirmasi) return setSError(t('Konfirmasi password tidak cocok', 'Password confirmation does not match'))
    setSLoading(true)
    // Nama apotek & nama lengkap disimpan di metadata akun, bukan cuma di state
    // halaman ini. Kalau konfirmasi email menyala, orang menutup tab lalu
    // kembali lewat tautan di emailnya, dan pada saat itu isian formulir ini
    // sudah lama hilang. Metadata yang membawanya sampai ke pendaftaran apotek.
    const { data, error } = await supabase.auth.signUp({
      email: sEmail.trim().toLowerCase(), password: sPassword,
      options: { data: {
        nama_apotek: namaApotek.trim(),
        nama_lengkap: namaLengkap.trim(),
        sektor,
      } },
    })
    if (error) { setSLoading(false); setSError(error.message); return }

    // Apotek dibentuk lewat satu fungsi database, bukan dengan menulis ke tabel
    // `companies` dari browser: penulisan langsung itu berarti tabel klien harus
    // terbuka untuk siapa saja, dan itulah lubang yang ditutup di migrasi 0002.
    if (data.session) {
      const { error: rpcError } = await supabase.rpc('register_faskes', {
        p_nama: namaApotek.trim(),
        p_nama_admin: namaLengkap.trim(),
        p_sektor: sektor,
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
      'Pendaftaran berhasil! Cek email Anda untuk konfirmasi, lalu masuk. Fasilitas Anda langsung aktif dengan masa coba 14 hari.',
      'Registration successful! Check your email to confirm, then sign in. Your facility starts with a 14-day free trial.',
    ))
  }

  const label = 'block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5'

  return (
    <div className="min-h-screen flex flex-col relative">
      <AuthBackdrop />

      {/* Baris kendali di atas. Sejajar dengan lebar kartunya, bukan menempel
          sudut layar: yang menempel sudut terlihat seperti tempelan. */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 flex items-center gap-2">
        <a href="/kenapa" className="text-sm font-medium text-[var(--brand)] hover:underline underline-offset-4">
          {t('Fitur & harga', 'Features & pricing')}
        </a>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="sw-masuk glass w-full max-w-5xl">

          {/* ── Kolom merek ── */}
          <section className="sw-masuk-merek">
            <Logo size={40} sub="BY SEAWISE STUDIO" subClass="uppercase tracking-[0.16em] text-[11px]" tone="onGrad" />

            <div>
              <h2 className="text-[26px] sm:text-[30px] font-bold leading-[1.15] tracking-[-0.01em] max-w-[15ch]">
                {t('Satu sistem untuk apotek, klinik, dan rumah sakit.',
                   'One system for pharmacies, clinics, and hospitals.')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed max-w-[38ch]" style={{ color: 'var(--on-grad-soft)' }}>
                {t('Stok, kasir, pembelian, dan laporan wajib dalam satu tempat, dengan angka yang bisa dipertanggungjawabkan.',
                   'Stock, register, purchasing, and mandatory reports in one place, with numbers that hold up.')}
              </p>
            </div>

            {/* Tiga hal yang BENAR tentang produknya, bukan janji pemasaran.
                Orang yang menilai apakah akan menyerahkan data pasiennya
                membaca yang spesifik, dan mengabaikan yang umum. */}
            <ul className="sw-bukti text-sm">
              {[
                t('Laporan SIPNAP narkotika, psikotropika, dan prekursor siap cetak.',
                  'SIPNAP reports for narcotics, psychotropics, and precursors, ready to print.'),
                t('Batch dan tanggal kadaluarsa tercatat FEFO, bukan sekadar jumlah stok.',
                  'Batches and expiry dates tracked FEFO, not just a stock count.'),
                t('Data tiap faskes terpisah di tingkat database, bukan hanya di tampilan.',
                  'Each facility isolated at the database level, not merely on screen.'),
              ].map((x, i) => (
                <li key={i}>
                  <span className="tanda"><Check size={12} strokeWidth={3} /></span>
                  <span style={{ color: 'var(--on-grad-soft)' }}>{x}</span>
                </li>
              ))}
            </ul>

            <p className="mt-auto pt-2 text-xs" style={{ color: 'var(--on-grad-soft)' }}>
              {t('Masa coba 14 hari. Tanpa kartu kredit.', '14-day trial. No credit card.')}
            </p>
          </section>

          {/* ── Kolom formulir ── */}
          <section className="sw-masuk-isi flex flex-col justify-center">
            {mode === 'login' ? (
              <div>
                <h1 className="text-[28px] font-bold text-[var(--ink)] tracking-[-0.01em]">{t('Masuk', 'Sign in')}</h1>
                <p className="text-sm text-[var(--ink-soft)] mt-1 mb-7">
                  {t('Lanjutkan dari tempat terakhir kamu berhenti.', 'Continue where you left off.')}
                </p>

                {error && (
                  <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm leading-relaxed">
                    {error}
                    {needConfirm && (
                      <button onClick={resendConfirmation} className="block mt-1.5 font-medium underline underline-offset-2">
                        {t('Kirim ulang email verifikasi', 'Resend the verification email')}
                      </button>
                    )}
                  </div>
                )}
                {info && <div className="mb-4 px-3.5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">{info}</div>}

                <div className="space-y-4">
                  <div>
                    <label className={label}>Email</label>
                    <input type="email" placeholder="nama@faskes.com" value={email}
                      onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>{t('Kata sandi', 'Password')}</label>
                    {/* Tombol lihat sandi bukan kemewahan: kata sandi yang
                        diketik di balik titik-titik adalah penyebab paling
                        sering orang mengira akunnya bermasalah padahal cuma
                        salah ketik. */}
                    <div className="relative">
                      <input type={lihatSandi ? 'text' : 'password'} placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className={inputCls + ' pr-11'} />
                      <button type="button" onClick={() => setLihatSandi(v => !v)}
                        aria-label={lihatSandi ? t('Sembunyikan kata sandi', 'Hide password') : t('Lihat kata sandi', 'Show password')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
                        {lihatSandi ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <button onClick={handleLogin} disabled={loading}
                    className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                    {loading ? t('Memproses…', 'Processing…') : t('Masuk', 'Sign in')}
                  </button>
                </div>

                <p className="mt-7 pt-6 border-t border-[var(--line-soft)] text-sm text-[var(--ink-soft)]">
                  {t('Belum punya faskes terdaftar?', 'No facility registered yet?')}{' '}
                  <button onClick={() => setMode('signup')} className="font-semibold text-[var(--brand)] hover:underline underline-offset-4">
                    {t('Daftarkan sekarang', 'Register now')}
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-[28px] font-bold text-[var(--ink)] tracking-[-0.01em]">{t('Daftarkan faskes', 'Register a facility')}</h1>
                <p className="text-sm text-[var(--ink-soft)] mt-1 mb-7">
                  {t('Gratis 14 hari, dan tidak diminta kartu kredit.', 'Free for 14 days, and no card is asked for.')}
                </p>

                {sError && <div className="mb-4 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm leading-relaxed">{sError}</div>}
                {sSukses && <div className="mb-4 px-3.5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm leading-relaxed">{sSukses}</div>}

                <div className="space-y-3.5">
                  {/* Jenis fasilitas ditanya PALING AWAL, sebelum namanya.
                      Ia menentukan menu apa yang muncul, istilah apa yang
                      dipakai, dan modul mana yang aktif sejak hari pertama.
                      Menanyakannya belakangan berarti orang sudah terlanjur
                      membayangkan aplikasi yang salah. */}
                  <div>
                    <label className={label}>{t('Jenis fasilitas', 'Facility type')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['apotek', t('Apotek', 'Pharmacy'), t('Obat, stok, kasir, SIPNAP', 'Drugs, stock, counter, SIPNAP')],
                        ['klinik', t('Klinik', 'Clinic'), t('Ditambah pasien, kunjungan, rekam medis, resep', 'Plus patients, visits, records, prescriptions')],
                      ] as const).map(([nilai, judul, ket]) => (
                        <button key={nilai} type="button" onClick={() => setSektor(nilai)}
                          className={`text-left px-3 py-2.5 rounded-xl border transition ${
                            sektor === nilai
                              ? 'border-[var(--brand)] bg-[var(--brand)]/8'
                              : 'border-[var(--line)] hover:border-[var(--brand)]/50'
                          }`}>
                          <span className="block text-sm font-semibold text-[var(--ink)]">{judul}</span>
                          <span className="block text-[11px] text-[var(--ink-faint)] leading-snug mt-0.5">{ket}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--ink-faint)] mt-1.5 leading-relaxed">
                      {t('Bisa diubah nanti, dan modul apotek tetap ada di klinik. Rumah sakit disiapkan tersendiri, hubungi kami.',
                         'Changeable later, and the pharmacy module stays available in a clinic. Hospitals are arranged separately, contact us.')}
                    </p>
                  </div>
                  <div>
                    <label className={label}>{t('Nama faskes', 'Facility name')}</label>
                    <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)}
                      placeholder={sektor === 'klinik'
                        ? t('Klinik Sehat Sentosa', 'Sehat Sentosa Clinic')
                        : t('Apotek Sehat Sentosa', 'Sehat Sentosa Pharmacy')} className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>{t('Nama lengkap', 'Full name')}</label>
                    <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)}
                      placeholder={t('Nama penanggung jawab', 'Person in charge')} className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>Email</label>
                    <input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)}
                      placeholder="kamu@faskes.com" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>{t('Kata sandi', 'Password')}</label>
                      <input type="password" value={sPassword} onChange={e => setSPassword(e.target.value)}
                        placeholder={t('Min. 6 karakter', 'Min. 6 characters')} className={inputCls} />
                    </div>
                    <div>
                      <label className={label}>{t('Ulangi', 'Repeat')}</label>
                      <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        placeholder={t('Ulangi kata sandi', 'Repeat password')} className={inputCls} />
                    </div>
                  </div>
                  <button onClick={handleRegister} disabled={sLoading}
                    className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                    {sLoading ? t('Memproses…', 'Processing…') : t('Daftarkan faskes', 'Register facility')}
                  </button>
                </div>

                <p className="mt-7 pt-6 border-t border-[var(--line-soft)] text-sm text-[var(--ink-soft)]">
                  {t('Sudah punya akun?', 'Already have an account?')}{' '}
                  <button onClick={() => setMode('login')} className="font-semibold text-[var(--brand)] hover:underline underline-offset-4">
                    {t('Masuk', 'Sign in')}
                  </button>
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Kaki halaman. Tautan legal dan halaman harga sengaja ada DI SINI:
          orang menilai apakah mau menyerahkan data pasiennya tepat saat
          diminta mendaftar, dan dokumen yang tidak bisa ditemukan dari layar
          ini sama saja dengan tidak ada. */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6 text-center sm:text-left">
        <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
          {t('Sehatera: sistem apotek, klinik, dan faskes', 'Sehatera: pharmacy, clinic, and facility system')}
          {' · '}<span className="text-[var(--ink-soft)] font-medium">by Seawise Studio</span>
        </p>
      </footer>
    </div>
  )
}
