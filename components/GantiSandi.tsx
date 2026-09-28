'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'
import { useUmpan } from '@/components/Umpan'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'

/**
 * Ganti kata sandi dari dalam aplikasi.
 *
 * Sebelum ini satu-satunya jalan adalah "Lupa kata sandi" lewat email, jadi
 * kasir yang sandinya ketahuan orang lain tidak bisa menggantinya saat itu
 * juga.
 *
 * **Sandi lama diminta lebih dulu**, dan itu keputusan keamanan, bukan
 * kerapian. Komputer klinik dipakai bergantian: tanpa sandi lama, siapa pun
 * yang duduk di depan sesi orang lain yang masih terbuka bisa mengganti
 * sandinya dan mengunci pemiliknya di luar. Supabase punya "Require current
 * password" sendiri, tapi pemeriksaannya di sini supaya tidak bergantung pada
 * setelan dashboard yang bisa berubah diam-diam.
 */

const INPUT =
  'w-full border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

// Sama dengan pendaftaran, atur ulang sandi, undangan, dan setelan Auth.
const MIN_SANDI = 8

export default function GantiSandi({ email, onTutup }: { email: string; onTutup: () => void }) {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [lihat, setLihat] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const simpan = async () => {
    setGalat('')
    if (!lama) { setGalat(t('Isi kata sandi yang sekarang.', 'Enter your current password.')); return }
    if (baru.length < MIN_SANDI) {
      setGalat(t(`Kata sandi baru minimal ${MIN_SANDI} karakter.`, `The new password needs at least ${MIN_SANDI} characters.`))
      return
    }
    if (baru !== ulang) { setGalat(t('Kedua kata sandi baru tidak sama.', 'The two new passwords do not match.')); return }
    if (baru === lama) { setGalat(t('Kata sandi baru harus berbeda dari yang sekarang.', 'The new password must differ from the current one.')); return }

    setSibuk(true)
    // Membuktikan sandi lama dengan masuk ulang memakai email yang sama. Sesi
    // yang sedang berjalan tidak berubah pemiliknya, jadi aman dilakukan di
    // sesi yang sama.
    const { error: eLama } = await supabase.auth.signInWithPassword({ email, password: lama })
    if (eLama) {
      setSibuk(false)
      setGalat(/invalid/i.test(eLama.message)
        ? t('Kata sandi yang sekarang salah.', 'The current password is incorrect.')
        : eLama.message)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: baru })
    setSibuk(false)
    if (error) {
      setGalat(/weak|pwned|leaked/i.test(error.message)
        ? t('Kata sandi ini terlalu mudah ditebak. Pilih yang lain.', 'This password is too easy to guess. Choose another.')
        : error.message)
      return
    }
    kabar(t('Kata sandi diganti. Pakai yang baru saat masuk berikutnya.', 'Password changed. Use the new one next time you sign in.'), 'ok')
    onTutup()
  }

  const label = 'block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5'
  const tipe = lihat ? 'text' : 'password'

  return (
    <Dialog
      judul={t('Ganti kata sandi', 'Change password')}
      sub={email}
      lebar="sm"
      onTutup={onTutup}
      aksi={<>
        <button type="button" onClick={onTutup} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
        <button type="button" onClick={simpan} disabled={sibuk} className={TOMBOL_UTAMA}>
          {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
        </button>
      </>}
    >
      <div className="space-y-4">
        {galat && (
          <div className="px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm leading-relaxed">{galat}</div>
        )}
        <div>
          <label htmlFor="sandi-lama" className={label}>{t('Kata sandi sekarang', 'Current password')}</label>
          <div className="relative">
            <input id="sandi-lama" type={tipe} value={lama} autoComplete="current-password"
              onChange={e => setLama(e.target.value)} className={INPUT + ' pr-11'} />
            <button type="button" onClick={() => setLihat(v => !v)}
              aria-label={lihat ? t('Sembunyikan kata sandi', 'Hide passwords') : t('Lihat kata sandi', 'Show passwords')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
              {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="sandi-baru-app" className={label}>{t('Kata sandi baru', 'New password')}</label>
          <input id="sandi-baru-app" type={tipe} value={baru} autoComplete="new-password"
            onChange={e => setBaru(e.target.value)} className={INPUT} />
          <p className="text-[11px] text-[var(--ink-faint)] mt-1">{t(`Minimal ${MIN_SANDI} karakter.`, `At least ${MIN_SANDI} characters.`)}</p>
        </div>
        <div>
          <label htmlFor="sandi-ulang-app" className={label}>{t('Ulangi kata sandi baru', 'Repeat new password')}</label>
          <input id="sandi-ulang-app" type={tipe} value={ulang} autoComplete="new-password"
            onChange={e => setUlang(e.target.value)} onKeyDown={e => e.key === 'Enter' && simpan()} className={INPUT} />
        </div>
      </div>
    </Dialog>
  )
}
