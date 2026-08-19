'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Share2, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { rupiah } from '@/lib/format'

/**
 * Merujuk pasien ke poli lain di klinik yang sama.
 *
 * **Tetap SATU kunjungan.** Pasiennya membayar sekali di ujung, dan dua
 * kunjungan berarti dua tagihan serta dua kali antre di kasir untuk satu
 * kedatangan. Yang berpindah adalah poli, dokter, dan nomor antreannya.
 *
 * **Pasien menunggu lagi, dan layar mengatakannya sebelum tombolnya ditekan.**
 * Kunjungan kembali ke Terdaftar dengan nomor antrean baru di poli tujuan;
 * kalau itu tidak dikatakan, dokter yang merujuk mengira pasiennya langsung
 * masuk dan pasiennya duduk menunggu panggilan yang tidak pernah datang.
 *
 * Tarif konsultasi poli tujuan ditagih tersendiri, dan angkanya ditunjukkan di
 * sini. Pasien yang baru tahu ada tambahan biaya saat berdiri di kasir akan
 * menyalahkan kliniknya, bukan aplikasinya.
 */

export default function RujukInternal({
  visitId, unitSekarang, onTutup, onSelesai,
}: {
  visitId: string
  unitSekarang: string | null
  onTutup: () => void
  onSelesai: () => void
}) {
  const { t } = useLang()
  const app = useApp()

  const [poli, setPoli] = useState<any[]>([])
  const [dokter, setDokter] = useState<any[]>([])
  const [tugas, setTugas] = useState<Record<string, string[]>>({})
  const [tujuan, setTujuan] = useState('')
  const [dokterTujuan, setDokterTujuan] = useState('')
  const [alasan, setAlasan] = useState('')
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    const [u, a, d] = await Promise.all([
      app.scope(supabase.from('clinic_units').select('id,nama,tarif_konsultasi,aktif').order('urutan').order('nama')),
      app.scope(supabase.from('app_users').select('nama,email,role')),
      app.scope(supabase.from('unit_doctors').select('unit_id,email')),
    ])
    setPoli(((u.data as any[]) || []).filter(x => x.aktif && x.id !== unitSekarang))
    setDokter(((a.data as any[]) || []).filter(x => x.role === 'dokter'))
    const peta: Record<string, string[]> = {}
    for (const r of ((d.data as any[]) || [])) {
      peta[r.unit_id] = [...(peta[r.unit_id] || []), (r.email || '').toLowerCase()]
    }
    setTugas(peta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany, unitSekarang])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const rujuk = async () => {
    if (!tujuan || !alasan.trim()) return
    setSibuk(true)
    const { error } = await supabase.rpc('rujuk_internal', {
      p_visit: visitId,
      p_ke_unit: tujuan,
      p_alasan: alasan.trim(),
      p_dokter: dokterTujuan || null,
      p_catatan: catatan.trim() || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    onSelesai()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'

  const unit = poli.find(p => p.id === tujuan)
  const dokterSePoli = tujuan ? (tugas[tujuan] || []) : []

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2">
            <Share2 size={18} /> {t('Rujuk ke Poli Lain', 'Refer to Another Unit')}
          </h2>
          <button onClick={onTutup} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
          {t('Tetap satu kunjungan dan satu tagihan. Yang berpindah poli, dokter, dan nomor antreannya.',
             'Still one visit and one bill. What moves is the unit, the doctor, and the queue number.')}
        </p>

        <div className="space-y-3">
          <div>
            <label className={L}>{t('Poli tujuan', 'Target unit')} <span className="text-red-500">*</span></label>
            <select value={tujuan} onChange={e => { setTujuan(e.target.value); setDokterTujuan('') }} className={I}>
              <option value="">{t('Pilih poli…', 'Choose a unit…')}</option>
              {poli.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama}{p.tarif_konsultasi > 0 ? ` · ${rupiah(p.tarif_konsultasi)}` : ''}
                </option>
              ))}
            </select>
          </div>

          {tujuan && (
            <div>
              <label className={L}>{t('Dokter tujuan', 'Target doctor')}</label>
              <select value={dokterTujuan} onChange={e => setDokterTujuan(e.target.value)} className={I}>
                <option value="">{t('Belum ditentukan', 'Not decided yet')}</option>
                {dokter
                  .filter(d => dokterSePoli.length === 0 || dokterSePoli.includes((d.email || '').toLowerCase()))
                  .map(d => (
                    <option key={d.email} value={(d.email || '').toLowerCase()}>{d.nama || d.email}</option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className={L}>{t('Alasan rujukan', 'Reason')} <span className="text-red-500">*</span></label>
            <input value={alasan} onChange={e => setAlasan(e.target.value)}
              placeholder={t('mis. perlu dinilai spesialis jantung', 'e.g. needs a cardiology assessment')} className={I} />
            <p className="text-[11px] text-[var(--ink-faint)] mt-1 leading-relaxed">
              {t('Dokter yang menerima harus tahu kenapa pasien ini dikirim kepadanya. Rujukan tanpa alasan ditolak.',
                 'The receiving doctor must know why this patient was sent. A referral without a reason is rejected.')}
            </p>
          </div>

          <div>
            <label className={L}>{t('Catatan untuk dokter tujuan', 'Note for the receiving doctor')}</label>
            <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} className={I} />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                {t('Pasien akan mendapat nomor antrean baru dan menunggu lagi di poli tujuan.',
                   'The patient gets a new queue number and waits again at the target unit.')}
                {unit && unit.tarif_konsultasi > 0 && (
                  <> {t(`Tarif konsultasi ${unit.nama} sebesar ${rupiah(unit.tarif_konsultasi)} akan ditambahkan ke tagihan kunjungan ini.`,
                        `The ${unit.nama} consultation fee of ${rupiah(unit.tarif_konsultasi)} will be added to this visit bill.`)}</>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onTutup}
            className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
            {t('Batal', 'Cancel')}
          </button>
          <button onClick={rujuk} disabled={sibuk || !tujuan || !alasan.trim()}
            className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
            {sibuk ? t('Merujuk…', 'Referring…') : t('Rujuk sekarang', 'Refer now')}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
