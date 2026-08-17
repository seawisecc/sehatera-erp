'use client'

import { use, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useLang, LangToggle } from '../../../lib/i18n'
import { ThemeToggle } from '../../../lib/theme'
import { AuthBackdrop } from '../../../components/AuthBackdrop'
import { Logo } from '../../../components/Logo'
import { pesanError, KUNCI_UNDANGAN } from '../../../lib/session'
import { ROLE_LABELS } from '../../../lib/navigation'

/**
 * Menerima undangan tim.
 *
 * Halaman ini terbuka tanpa login, karena yang diundang belum punya akun saat
 * membuka tautannya. Yang ditampilkan sengaja sedikit, cuma nama apotek dan
 * peran yang ditawarkan: tautan undangan bisa saja diteruskan ke orang lain,
 * dan halaman ini tidak boleh jadi jendela ke dalam data apotek.
 *
 * Kata sandinya diketik sendiri oleh yang diundang, tidak pernah oleh pemilik.
 * Itu inti perubahannya: selama pemilik yang menentukan kata sandi kasirnya,
 * transaksi atas nama kasir tidak membuktikan siapa yang menyerahkan obat.
 */

const inputCls = 'glass-field w-full rounded-xl px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)]'

type Undangan = {
  sah: boolean
  alasan?: string
  email?: string
  nama?: string | null
  role?: string
  nama_apotek?: string
  expires_at?: string
}

export default function HalamanUndangan({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { t } = useLang()

  const [undangan, setUndangan] = useState<Undangan | null>(null)
  const [nama, setNama] = useState('')
  const [sandi, setSandi] = useState('')
  const [ulangi, setUlangi] = useState('')
  const [lihatSandi, setLihatSandi] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [salah, setSalah] = useState('')
  const [pesan, setPesan] = useState('')
  const [sudahPunyaAkun, setSudahPunyaAkun] = useState(false)

  useEffect(() => {
    supabase.rpc('lihat_undangan', { p_token: token }).then(({ data, error }) => {
      if (error) { setUndangan({ sah: false, alasan: 'tidak_ditemukan' }); return }
      const u = data as Undangan
      setUndangan(u)
      if (u?.sah) setNama(u.nama || '')
    })
  }, [token])

  /** Menyambungkan sesi yang sudah ada ke apoteknya. */
  const terima = async () => {
    const { error } = await supabase.rpc('terima_undangan', { p_token: token })
    if (error) { setSibuk(false); setSalah(pesanError(error)); return }
    try { localStorage.removeItem(KUNCI_UNDANGAN) } catch {}
    window.location.href = '/beranda'
  }

  const buatAkun = async () => {
    setSalah(''); setPesan('')
    if (!nama.trim()) { setSalah(t('Nama wajib diisi.', 'Name is required.')); return }
    if (sandi.length < 6) { setSalah(t('Kata sandi minimal 6 karakter.', 'Password must be at least 6 characters.')); return }
    if (sandi !== ulangi) { setSalah(t('Ulangi kata sandi tidak cocok.', 'Password confirmation does not match.')); return }
    setSibuk(true)

    // Token dititipkan ke metadata akun DAN ke penyimpanan peramban. Kalau
    // konfirmasi email menyala, orang menutup tab lalu kembali lewat tautan di
    // emailnya, dan pada saat itu isian halaman ini sudah lama hilang.
    try { localStorage.setItem(KUNCI_UNDANGAN, token) } catch {}
    const { data, error } = await supabase.auth.signUp({
      email: undangan!.email!,
      password: sandi,
      options: { data: { nama_lengkap: nama.trim(), undangan_token: token } },
    })

    if (error) {
      setSibuk(false)
      if (/already registered|already been registered/i.test(error.message)) {
        setSudahPunyaAkun(true)
        setSalah(t('Email ini sudah punya akun Sehatera. Masuk dengan kata sandi lamamu untuk menerima undangan.',
                   'This email already has a Sehatera account. Sign in with your existing password to accept the invitation.'))
        return
      }
      setSalah(error.message)
      return
    }

    if (data.session) { await terima(); return }

    setSibuk(false)
    setPesan(t('Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk. Undangannya diterima otomatis begitu kamu masuk pertama kali.',
               'Account created. Check your email to confirm, then sign in. The invitation is accepted automatically on your first sign-in.'))
  }

  const masukLalu = async () => {
    setSalah(''); setSibuk(true)
    const { error } = await supabase.auth.signInWithPassword({ email: undangan!.email!, password: sandi })
    if (error) { setSibuk(false); setSalah(error.message); return }
    await terima()
  }

  const ALASAN: Record<string, { judul: string; isi: string }> = {
    tidak_ditemukan: {
      judul: t('Undangan tidak ditemukan', 'Invitation not found'),
      isi: t('Tautannya mungkin tersalin tidak lengkap. Minta tautan baru ke pemilik apotek.',
             'The link may have been copied incompletely. Ask the pharmacy owner for a new one.'),
    },
    dicabut: {
      judul: t('Undangan sudah dicabut', 'Invitation revoked'),
      isi: t('Pemilik apotek mencabut undangan ini. Hubungi dia kalau ini tidak disengaja.',
             'The pharmacy owner revoked this invitation. Contact them if this was unintended.'),
    },
    sudah_dipakai: {
      judul: t('Undangan sudah dipakai', 'Invitation already used'),
      isi: t('Akunnya sudah dibuat. Langsung masuk lewat halaman depan.',
             'The account already exists. Sign in from the front page.'),
    },
    kedaluwarsa: {
      judul: t('Undangan sudah kedaluwarsa', 'Invitation expired'),
      isi: t('Undangan berlaku terbatas demi keamanan. Minta yang baru ke pemilik apotek.',
             'Invitations expire for safety. Ask the pharmacy owner for a new one.'),
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <AuthBackdrop />
      <div className="absolute top-4 right-5 sm:top-6 sm:right-8 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LangToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={40} sub="BY SEAWISE STUDIO" />
        </div>

        <div className="glass rounded-3xl p-7 sm:p-8">
          {undangan === null ? (
            <p className="text-sm text-[var(--ink-soft)] text-center py-6">{t('Memeriksa undangan…', 'Checking the invitation…')}</p>
          ) : !undangan.sah ? (
            <div className="text-center py-2">
              <h1 className="text-xl font-bold text-[var(--ink)] mb-2">{ALASAN[undangan.alasan || 'tidak_ditemukan'].judul}</h1>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-6">{ALASAN[undangan.alasan || 'tidak_ditemukan'].isi}</p>
              <a href="/" className="inline-block px-5 py-2.5 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                {t('Ke halaman masuk', 'Go to sign-in')}
              </a>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-soft)] mb-1">
                {t('Undangan Tim', 'Team Invitation')}
              </p>
              <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">{undangan.nama_apotek}</h1>
              <p className="text-sm text-[var(--ink-soft)] mb-6 leading-relaxed">
                {t('mengundangmu bergabung sebagai', 'invites you to join as')}{' '}
                <b className="text-[var(--ink)]">{ROLE_LABELS[undangan.role || 'kasir'] || undangan.role}</b>.{' '}
                {t('Buat kata sandimu sendiri di bawah. Pemilik apotek tidak akan mengetahuinya.',
                   'Set your own password below. The pharmacy owner will not know it.')}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Email</label>
                  <input value={undangan.email} disabled className={inputCls + ' opacity-70'} />
                </div>
                {!sudahPunyaAkun && (
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama lengkap', 'Full name')}</label>
                    <input value={nama} onChange={e => setNama(e.target.value)} className={inputCls}
                      placeholder={t('Nama yang tampil di struk dan laporan', 'The name shown on receipts and reports')} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                    {sudahPunyaAkun ? t('Kata sandi akunmu', 'Your account password') : t('Kata sandi baru', 'New password')}
                  </label>
                  <div className="relative">
                    <input type={lihatSandi ? 'text' : 'password'} value={sandi} onChange={e => setSandi(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && sudahPunyaAkun) masukLalu() }}
                      className={inputCls + ' pr-11'} placeholder="••••••••" />
                    <button type="button" onClick={() => setLihatSandi(v => !v)}
                      aria-label={lihatSandi ? t('Sembunyikan', 'Hide') : t('Tampilkan', 'Show')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
                      {lihatSandi ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {!sudahPunyaAkun && (
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Ulangi kata sandi', 'Repeat password')}</label>
                    <input type={lihatSandi ? 'text' : 'password'} value={ulangi} onChange={e => setUlangi(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') buatAkun() }}
                      className={inputCls} placeholder="••••••••" />
                  </div>
                )}
              </div>

              {salah && <p className="mt-3 text-sm text-red-600 leading-relaxed">{salah}</p>}
              {pesan && <p className="mt-3 text-sm text-green-700 leading-relaxed">{pesan}</p>}

              <button onClick={sudahPunyaAkun ? masukLalu : buatAkun} disabled={sibuk || !!pesan}
                className="mt-5 w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Memproses…', 'Processing…')
                  : sudahPunyaAkun ? t('Masuk & Terima Undangan', 'Sign in & Accept')
                  : t('Buat Akun & Gabung', 'Create Account & Join')}
              </button>

              <p className="mt-4 text-[11px] text-[var(--ink-faint)] leading-relaxed text-center">
                {t('Undangan ini hanya berlaku untuk alamat email di atas, dan hanya sekali.',
                   'This invitation works only for the email address above, and only once.')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
