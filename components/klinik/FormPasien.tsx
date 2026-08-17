'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'

/**
 * Formulir identitas pasien.
 *
 * Dipakai dua tempat: daftar pasien, dan pendaftaran cepat dari layar
 * Kunjungan. Karena itu ia berdiri sendiri, bukan menumpang salah satunya.
 *
 * Yang WAJIB cuma nama. Sisanya boleh menyusul, dan itu keputusan yang
 * disengaja: pasien yang datang dalam keadaan gawat tidak boleh tertahan di
 * loket karena kartu identitasnya tertinggal di rumah. Yang divalidasi ketat
 * hanya NIK, karena NIK setengah benar lebih berbahaya daripada NIK kosong:
 * ia terlihat seperti data.
 */

export type Pasien = {
  id: string
  nomor_rm: string | null
  nama: string
  nik: string | null
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  alamat: string | null
  telepon: string | null
  gol_darah: string | null
  alergi: string | null
  penjamin: string
  nomor_penjamin: string | null
  catatan: string | null
}

const KOSONG = {
  nama: '', nik: '', tanggal_lahir: '', jenis_kelamin: '', alamat: '',
  telepon: '', gol_darah: '', alergi: '', penjamin: 'umum', nomor_penjamin: '', catatan: '',
}

export default function FormPasien({
  pasien, sibuk, onTutup, onSimpan,
}: {
  /** null berarti pasien baru. */
  pasien: Pasien | null
  sibuk: boolean
  onTutup: () => void
  onSimpan: (isi: any, id: string | null) => Promise<boolean>
}) {
  const { t } = useLang()
  const [isi, setIsi] = useState<any>(KOSONG)

  useEffect(() => {
    setIsi(pasien ? {
      nama: pasien.nama || '', nik: pasien.nik || '',
      tanggal_lahir: pasien.tanggal_lahir || '', jenis_kelamin: pasien.jenis_kelamin || '',
      alamat: pasien.alamat || '', telepon: pasien.telepon || '',
      gol_darah: pasien.gol_darah || '', alergi: pasien.alergi || '',
      penjamin: pasien.penjamin || 'umum', nomor_penjamin: pasien.nomor_penjamin || '',
      catatan: pasien.catatan || '',
    } : KOSONG)
  }, [pasien])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const ubah = (k: string, v: string) => setIsi({ ...isi, [k]: v })
  const input = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const label = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'

  const nikSalah = isi.nik.trim() !== '' && !/^[0-9]{16}$/.test(isi.nik.trim())

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-[var(--brand)] mb-1">
          {pasien ? t('Ubah Data Pasien', 'Edit Patient') : t('Pasien Baru', 'New Patient')}
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mb-5">
          {pasien
            ? <>No. RM <span className="num">{pasien.nomor_rm || '-'}</span></>
            : t('Hanya nama yang wajib. Sisanya boleh menyusul.', 'Only the name is required. The rest can follow later.')}
        </p>

        <div className="space-y-3">
          <div>
            <label className={label}>{t('Nama lengkap *', 'Full name *')}</label>
            <input autoFocus value={isi.nama} onChange={e => ubah('nama', e.target.value)} className={input} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>NIK</label>
              <input value={isi.nik} onChange={e => ubah('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                inputMode="numeric" placeholder={t('16 angka', '16 digits')}
                className={`${input} num ${nikSalah ? 'border-red-400' : ''}`} />
              {nikSalah && (
                <p className="text-[11px] text-red-600 mt-1">
                  {t(`Baru ${isi.nik.trim().length} dari 16 angka.`, `Only ${isi.nik.trim().length} of 16 digits.`)}
                </p>
              )}
            </div>
            <div>
              <label className={label}>{t('Telepon', 'Phone')}</label>
              <input value={isi.telepon} onChange={e => ubah('telepon', e.target.value)}
                inputMode="tel" className={input + ' num'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>{t('Tanggal lahir', 'Date of birth')}</label>
              <input type="date" value={isi.tanggal_lahir} onChange={e => ubah('tanggal_lahir', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>{t('Jenis kelamin', 'Sex')}</label>
              <select value={isi.jenis_kelamin} onChange={e => ubah('jenis_kelamin', e.target.value)} className={input}>
                <option value="">{t('(belum diisi)', '(not set)')}</option>
                <option value="L">{t('Laki-laki', 'Male')}</option>
                <option value="P">{t('Perempuan', 'Female')}</option>
              </select>
            </div>
            <div>
              <label className={label}>{t('Gol. darah', 'Blood type')}</label>
              <select value={isi.gol_darah} onChange={e => ubah('gol_darah', e.target.value)} className={input}>
                <option value="">{t('(belum diisi)', '(not set)')}</option>
                {['A', 'B', 'AB', 'O'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>{t('Alamat', 'Address')}</label>
            <textarea rows={2} value={isi.alamat} onChange={e => ubah('alamat', e.target.value)} className={input} />
          </div>

          {/* Alergi berdiri sendiri dan diberi peringatan, bukan disatukan ke
              catatan umum. Ia satu-satunya isian di formulir ini yang bisa
              membunuh orang kalau terlewat dibaca. */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <label className="text-xs font-semibold text-red-800 mb-1 block">
              {t('Alergi obat', 'Drug allergies')}
            </label>
            <input value={isi.alergi} onChange={e => ubah('alergi', e.target.value)}
              placeholder={t('mis. amoksisilin, sulfa. Kosongkan kalau tidak ada.', 'e.g. amoxicillin, sulfa. Leave empty if none.')}
              className="w-full border border-red-300 bg-[var(--surface)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <p className="text-[11px] text-red-700 mt-1.5 leading-relaxed">
              {t('Yang ditulis di sini muncul sebagai peringatan merah di layar Kunjungan, setiap kali pasien ini datang.',
                 'What you write here appears as a red warning on the Visits screen, every time this patient comes in.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>{t('Penjamin', 'Payer')}</label>
              <select value={isi.penjamin} onChange={e => ubah('penjamin', e.target.value)} className={input}>
                <option value="umum">{t('Umum', 'Self-pay')}</option>
                <option value="bpjs">BPJS</option>
                <option value="asuransi">{t('Asuransi', 'Insurance')}</option>
              </select>
            </div>
            {isi.penjamin !== 'umum' && (
              <div>
                <label className={label}>
                  {isi.penjamin === 'bpjs' ? t('Nomor BPJS', 'BPJS number') : t('Nomor polis', 'Policy number')}
                </label>
                <input value={isi.nomor_penjamin} onChange={e => ubah('nomor_penjamin', e.target.value)}
                  className={input + ' num'} />
              </div>
            )}
          </div>

          <div>
            <label className={label}>{t('Catatan', 'Notes')}</label>
            <textarea rows={2} value={isi.catatan} onChange={e => ubah('catatan', e.target.value)} className={input} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onTutup} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
            {t('Batal', 'Cancel')}
          </button>
          <button
            onClick={() => { if (!nikSalah) onSimpan(isi, pasien?.id ?? null) }}
            disabled={sibuk || !isi.nama.trim() || nikSalah}
            className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
            {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
