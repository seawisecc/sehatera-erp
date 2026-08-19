'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, FlaskRound, Plus, Trash2, X, Zap } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import { rupiah, tanggalJam } from '@/lib/format'

/**
 * Permintaan pemeriksaan penunjang dari layar dokter, dan hasilnya.
 *
 * Pemeriksaannya dipilih dari katalog Layanan, bukan diketik bebas beserta
 * harganya. Kalau diketik ulang, satu pemeriksaan yang sama tercatat dengan
 * harga berbeda tergantung siapa yang jaga, dan rekap setahun jadi tidak bisa
 * dijumlahkan. Yang tidak ada di katalog tetap boleh diminta, cuma tidak
 * menagih apa pun, dan itu dikatakan di layar bukan didiamkan.
 *
 * Hasil yang bertanda kritis diberi warna merah dan disebut lebih dulu.
 * Trombosit 84.000 yang terselip di baris keenam dari sepuluh adalah cara
 * paling mudah melewatkan pasien yang seharusnya dirujuk hari itu juga.
 */

type Baris = {
  id: string
  jenis: string
  nama: string
  status: string
  prioritas: string
  catatan_klinis: string | null
  temuan: string | null
  kesan: string | null
  alasan_batal: string | null
  diminta_oleh: string | null
  diminta_pada: string
  dikerjakan_oleh: string | null
  selesai_pada: string | null
  hasil: any[]
}

const LABEL_STATUS: Record<string, [string, string]> = {
  diminta:    ['Menunggu dikerjakan', 'Waiting'],
  dikerjakan: ['Sedang dikerjakan', 'In progress'],
  selesai:    ['Selesai', 'Done'],
  batal:      ['Dibatalkan', 'Cancelled'],
}

export default function Penunjang({
  visitId, tertutup, onTutup,
}: {
  visitId: string
  tertutup: boolean
  onTutup: () => void
}) {
  const { t, lang } = useLang()
  const app = useApp()

  const bolehMinta = boleh(app.currentRole, 'penunjang.minta', app.isSuper) && !tertutup

  const [daftar, setDaftar] = useState<Baris[]>([])
  const [layanan, setLayanan] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [buka, setBuka] = useState(false)
  const [form, setForm] = useState({ jenis: 'lab', service: '', nama: '', catatan: '', cito: false })

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data, error } = await supabase.rpc('penunjang_kunjungan', { p_visit: visitId })
    if (error) alert(pesanError(error))
    setDaftar(((data as Baris[]) || []))
    setMemuat(false)
  }, [visitId])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    ;(async () => {
      const { data } = await app.scope(
        supabase.from('services').select('id,nama,harga').eq('status', 'aktif').order('nama'))
      setLayanan((data as any[]) || [])
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const minta = async () => {
    if (!form.nama.trim()) return
    setSibuk(true)
    const { error } = await supabase.rpc('minta_penunjang', {
      p_visit: visitId,
      p_jenis: form.jenis,
      p_nama: form.nama.trim(),
      p_service: form.service || null,
      p_catatan: form.catatan.trim() || null,
      p_prioritas: form.cito ? 'cito' : 'rutin',
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setBuka(false)
    setForm({ jenis: 'lab', service: '', nama: '', catatan: '', cito: false })
    muat()
  }

  const batal = async (b: Baris) => {
    const alasan = window.prompt(t(`Batalkan permintaan ${b.nama}? Tulis alasannya.`,
                                   `Cancel ${b.nama}? Write the reason.`))
    if (alasan === null) return
    setSibuk(true)
    const { error } = await supabase.rpc('batal_penunjang', { p_id: b.id, p_alasan: alasan })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'

  const svc = layanan.find(x => x.id === form.service)

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[6vh]" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl shadow-xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--surface)] px-6 pt-6 pb-4 border-b border-[var(--line-soft)] flex items-start justify-between gap-3 z-10">
          <div>
            <h2 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2">
              <FlaskRound size={18} /> {t('Pemeriksaan Penunjang', 'Diagnostic Tests')}
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              {t('Laboratorium dan radiologi untuk kunjungan ini.', 'Lab and imaging for this visit.')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bolehMinta && (
              <button onClick={() => setBuka(true)}
                className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--brand-hover)] transition">
                <Plus size={14} /> {t('Minta pemeriksaan', 'Order a test')}
              </button>
            )}
            <button onClick={onTutup} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {memuat ? (
            <p className="text-sm text-[var(--ink-faint)] py-6 text-center">{t('Memuat…', 'Loading…')}</p>
          ) : daftar.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)] py-8 text-center leading-relaxed">
              {t('Belum ada pemeriksaan penunjang untuk kunjungan ini.',
                 'No diagnostic tests for this visit yet.')}
            </p>
          ) : daftar.map(b => {
            const kritis = (b.hasil || []).some(h => h.penanda === 'kritis')
            return (
              <div key={b.id}
                className={`rounded-xl border p-3 ${
                  b.status === 'batal' ? 'border-[var(--line-soft)] bg-[var(--surface-2)]/40 opacity-70'
                  : kritis ? 'border-red-300 bg-red-50'
                  : 'border-[var(--line)]'
                }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-soft)]">
                    {b.jenis === 'lab' ? 'LAB' : t('RADIOLOGI', 'IMAGING')}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)]">{b.nama}</span>
                  {b.prioritas === 'cito' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      <Zap size={10} /> CITO
                    </span>
                  )}
                  <span className={`ml-auto text-[11px] font-medium ${
                    b.status === 'selesai' ? 'text-emerald-700' : 'text-[var(--ink-faint)]'
                  }`}>
                    {LABEL_STATUS[b.status]?.[lang === 'en' ? 1 : 0] || b.status}
                  </span>
                  {bolehMinta && b.status !== 'selesai' && b.status !== 'batal' && (
                    <button onClick={() => batal(b)} disabled={sibuk}
                      className="text-[var(--ink-faint)] hover:text-red-600 disabled:opacity-50"
                      aria-label={t('Batalkan', 'Cancel')} title={t('Batalkan', 'Cancel')}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {b.catatan_klinis && (
                  <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                    {t('Keterangan klinis:', 'Clinical note:')} {b.catatan_klinis}
                  </p>
                )}
                {b.alasan_batal && (
                  <p className="text-[11px] text-[var(--ink-soft)] mt-1">
                    {t('Dibatalkan:', 'Cancelled:')} {b.alasan_batal}
                  </p>
                )}

                {kritis && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-red-800 font-semibold">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {t('Ada hasil bertanda KRITIS. Kabari dokternya sekarang, jangan menunggu pasien dipanggil.',
                       'A CRITICAL result is present. Tell the doctor now, do not wait for the patient to be called.')}
                  </p>
                )}

                {(b.hasil || []).length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[var(--ink-faint)] text-[10px] uppercase tracking-wide">
                          <th className="text-left font-medium py-1">{t('Parameter', 'Parameter')}</th>
                          <th className="text-right font-medium py-1">{t('Hasil', 'Value')}</th>
                          <th className="text-left font-medium py-1 pl-2">{t('Satuan', 'Unit')}</th>
                          <th className="text-left font-medium py-1 pl-2">{t('Rujukan', 'Reference')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.hasil.map((h: any) => (
                          <tr key={h.id} className="border-t border-[var(--line-soft)]">
                            <td className="py-1 text-[var(--ink)]">
                              {h.nama}
                              {h.kode_loinc && <span className="text-[10px] text-[var(--ink-faint)] num"> · {h.kode_loinc}</span>}
                            </td>
                            <td className={`py-1 text-right num font-semibold ${
                              h.penanda === 'kritis' ? 'text-red-700'
                              : h.penanda === 'tinggi' || h.penanda === 'rendah' ? 'text-amber-700'
                              : 'text-[var(--ink)]'
                            }`}>
                              {h.nilai}
                              {h.penanda === 'tinggi' ? ' ↑' : h.penanda === 'rendah' ? ' ↓' : ''}
                              {h.penanda === 'kritis' ? ' !' : ''}
                            </td>
                            <td className="py-1 pl-2 text-[var(--ink-soft)]">{h.satuan || '-'}</td>
                            <td className="py-1 pl-2 text-[var(--ink-faint)] num">
                              {h.rujukan_teks
                                || (h.rujukan_bawah != null || h.rujukan_atas != null
                                    ? `${h.rujukan_bawah ?? ''} - ${h.rujukan_atas ?? ''}` : '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(b.temuan || b.kesan) && (
                  <div className="mt-2 space-y-1">
                    {b.temuan && (
                      <p className="text-xs text-[var(--ink)] leading-relaxed">
                        <span className="text-[var(--ink-faint)]">{t('Temuan:', 'Findings:')}</span> {b.temuan}
                      </p>
                    )}
                    {b.kesan && (
                      <p className="text-xs text-[var(--ink)] leading-relaxed font-medium">
                        <span className="text-[var(--ink-faint)] font-normal">{t('Kesan:', 'Impression:')}</span> {b.kesan}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-[var(--ink-faint)] mt-2">
                  {t('Diminta', 'Ordered')} {tanggalJam(b.diminta_pada)}
                  {b.diminta_oleh ? ` · ${b.diminta_oleh}` : ''}
                  {b.selesai_pada ? ` · ${t('selesai', 'done')} ${tanggalJam(b.selesai_pada)}` : ''}
                  {b.dikerjakan_oleh ? ` · ${b.dikerjakan_oleh}` : ''}
                </p>
              </div>
            )
          })}
        </div>

        {buka && (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-[var(--brand)] p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--brand)]">{t('Minta pemeriksaan', 'Order a test')}</p>

              <div className="flex gap-2">
                {(['lab', 'radiologi'] as const).map(j => (
                  <button key={j} type="button" onClick={() => setForm({ ...form, jenis: j })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      form.jenis === j ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                                       : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
                    }`}>
                    {j === 'lab' ? t('Laboratorium', 'Laboratory') : t('Radiologi', 'Imaging')}
                  </button>
                ))}
              </div>

              <div>
                <label className={L}>{t('Ambil dari katalog Layanan', 'Pick from the service catalogue')}</label>
                <select value={form.service}
                  onChange={e => {
                    const s = layanan.find(x => x.id === e.target.value)
                    setForm({ ...form, service: e.target.value, nama: s ? s.nama : form.nama })
                  }}
                  className={I}>
                  <option value="">{t('Di luar katalog (tidak menagih)', 'Off catalogue (no charge)')}</option>
                  {layanan.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} · {rupiah(s.harga)}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--ink-faint)] mt-1 leading-relaxed">
                  {svc
                    ? t(`Akan menagih ${rupiah(svc.harga)} ke tagihan kunjungan ini.`,
                        `Will add ${rupiah(svc.harga)} to this visit bill.`)
                    : t('Pemeriksaan di luar katalog tetap tercatat, tapi tidak menagih apa pun. Tambahkan ke Layanan Jasa supaya ikut tertagih.',
                        'Off-catalogue tests are still recorded but charge nothing. Add them to Services so they get billed.')}
                </p>
              </div>

              <div>
                <label className={L}>{t('Nama pemeriksaan', 'Test name')} <span className="text-red-500">*</span></label>
                <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className={I} />
              </div>

              <div>
                <label className={L}>{t('Keterangan klinis', 'Clinical note')}</label>
                <input value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })}
                  placeholder={t('mis. curiga DBD hari kelima', 'e.g. suspected dengue, day five')} className={I} />
                <p className="text-[11px] text-[var(--ink-faint)] mt-1">
                  {t('Yang membaca hasilnya perlu tahu apa yang sedang dicari.',
                     'Whoever reads the result needs to know what is being looked for.')}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.cito} onChange={e => setForm({ ...form, cito: e.target.checked })} />
                <span className="text-xs text-[var(--ink)]">
                  {t('CITO, didahulukan di antrean lab', 'CITO, jump the lab queue')}
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setBuka(false)}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                  {t('Batal', 'Cancel')}
                </button>
                <button onClick={minta} disabled={sibuk || !form.nama.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  <Check size={15} /> {t('Minta', 'Order')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </Portal>
  )
}
