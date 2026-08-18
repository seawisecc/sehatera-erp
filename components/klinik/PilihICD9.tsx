'use client'

import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { BENTUK_ICD9, cariICD9, usePencarianICD, type SaranICD9 } from '@/lib/icd10'

/**
 * Pemilih kode tindakan ICD-9-CM.
 *
 * Dipakai di katalog layanan, bukan di tiap kunjungan. Kalau kodenya diketik
 * ulang tiap kali tindakan ditagihkan, satu tindakan yang sama akan tercatat
 * dengan kode berbeda-beda tergantung siapa yang sedang jaga, dan rekap
 * tindakan setahun jadi tidak bisa dijumlahkan. Ditempel sekali di katalog,
 * lalu ikut sendiri lewat `simpan_biaya_kunjungan`.
 *
 * Kosong itu sah. Tidak semua yang ditagihkan sebuah faskes adalah tindakan
 * medis: administrasi dan surat keterangan tidak punya kode ICD-9-CM, dan
 * memaksa mengisi cuma akan melahirkan kode asal-asalan yang lebih buruk
 * daripada kosong.
 */
export default function PilihICD9({
  nilai, ubah,
}: {
  nilai: string | null
  ubah: (kode: string | null) => void
}) {
  const { t } = useLang()
  const [cari, setCari] = useState('')
  const { hasil, sibuk } = usePencarianICD<SaranICD9>(cari, cariICD9)

  const manual = cari.trim()
  const bisaManual = BENTUK_ICD9.test(manual) && !hasil.some(h => h.kode === manual)

  const pilih = (kode: string) => { ubah(kode); setCari('') }

  return (
    <div>
      <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
        {t('Kode tindakan ICD-9-CM', 'ICD-9-CM procedure code')}
      </label>

      {nilai ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
          <Check size={14} className="text-[var(--brand)] shrink-0" />
          <span className="num text-xs font-bold text-[var(--brand)] shrink-0">{nilai}</span>
          <button onClick={() => ubah(null)}
            className="ml-auto shrink-0 text-[var(--ink-faint)] hover:text-red-600"
            aria-label={t('Hapus kode', 'Remove code')}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
            <input
              value={cari}
              onChange={e => setCari(e.target.value)}
              placeholder={t('Cari tindakan atau ketik kodenya…', 'Search a procedure or type its code…')}
              className="w-full border border-[var(--line)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          {(hasil.length > 0 || bisaManual || sibuk) && (
            <div className="mt-1 border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)] max-h-56 overflow-y-auto">
              {sibuk && hasil.length === 0 && (
                <p className="px-3 py-2 text-sm text-[var(--ink-faint)]">{t('Mencari…', 'Searching…')}</p>
              )}
              {hasil.map(h => (
                <button key={h.kode} onClick={() => pilih(h.kode)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] flex items-start gap-2">
                  <span className="num text-xs font-bold text-[var(--brand)] w-14 shrink-0 pt-0.5">{h.kode}</span>
                  <span className="text-[var(--ink)] min-w-0 break-words">{h.nama}</span>
                </button>
              ))}
              {bisaManual && (
                <button onClick={() => pilih(manual)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] border-t border-[var(--line)]">
                  <span className="num text-xs font-bold text-[var(--brand)]">{manual}</span>
                  <span className="text-[var(--ink-soft)] ml-2">
                    {t('pakai kode ini, walau tidak ada di daftar e-klaim', 'use this code, though it is not in the e-claim list')}
                  </span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-[11px] text-[var(--ink-faint)] mt-1 leading-relaxed">
        {t('Boleh dikosongkan. Kode ini ikut tercatat tiap layanan ditagihkan, dan itulah yang dibaca klaim BPJS dan SatuSehat.',
           'May be left empty. The code follows the service onto every charge, and that is what BPJS claims and SatuSehat read.')}
      </p>
    </div>
  )
}
