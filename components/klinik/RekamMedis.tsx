'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { tanggalJam } from '@/lib/format'
import { BENTUK_ICD10, cariICD, KESADARAN, STATUS_PULANG, type SaranICD } from '@/lib/icd10'

/**
 * Rekam medis satu kunjungan: SOAP, tanda vital, dan diagnosis.
 *
 * Dibuka DARI kunjungan, bukan dari menu sendiri. Rekam medis tanpa kunjungan
 * tidak punya arti, dan kalau ia jadi menu tersendiri, orang harus mencari
 * pasien yang sama untuk kedua kalinya.
 *
 * Tiga hal di sini bentuknya ditentukan SatuSehat dan BPJS, bukan selera:
 * tanda vital sebagai kolom berjenis (tiap kolom punya kode LOINC), diagnosis
 * sebagai baris berkode ICD-10, dan keterangan kunjungan yang diminta P-Care.
 * Menyimpannya sebagai catatan bebas berarti nanti harus ditebak, dan menebak
 * data medis bukan pilihan.
 */

type Diagnosis = { kode_icd10: string; nama: string; tipe: string }

type Isi = {
  soap: { subjektif?: string; objektif?: string; asesmen?: string; plan?: string; dicatat_oleh?: string; diubah_pada?: string } | null
  vital: any[]
  diagnosis: any[]
  adendum: any[]
  riwayat: any[]
}

const VITAL: { k: string; label: [string, string]; satuan: string; loinc: string }[] = [
  { k: 'sistole',       label: ['Sistole', 'Systolic'],      satuan: 'mmHg',   loinc: '8480-6' },
  { k: 'diastole',      label: ['Diastole', 'Diastolic'],    satuan: 'mmHg',   loinc: '8462-4' },
  { k: 'nadi',          label: ['Nadi', 'Pulse'],            satuan: '/menit', loinc: '8867-4' },
  { k: 'napas',         label: ['Napas', 'Resp. rate'],      satuan: '/menit', loinc: '9279-1' },
  { k: 'suhu',          label: ['Suhu', 'Temperature'],      satuan: '°C',     loinc: '8310-5' },
  { k: 'saturasi',      label: ['Saturasi O₂', 'SpO₂'],      satuan: '%',      loinc: '59408-5' },
  { k: 'berat',         label: ['Berat', 'Weight'],          satuan: 'kg',     loinc: '29463-7' },
  { k: 'tinggi',        label: ['Tinggi', 'Height'],         satuan: 'cm',     loinc: '8302-2' },
  { k: 'lingkar_perut', label: ['Lingkar perut', 'Waist'],   satuan: 'cm',     loinc: '56086-2' },
]

export default function RekamMedis({
  visitId, nama, alergi, tertutup, awal, onTutup, onSimpan,
}: {
  visitId: string
  nama: string
  alergi: string | null
  tertutup: boolean
  awal: { kesadaran: string | null; poli: string | null; no_rujukan: string | null; status_pulang: string | null; jenis_kunjungan: string }
  onTutup: () => void
  onSimpan: () => void
}) {
  const { t, lang } = useLang()
  const en = lang === 'en'

  const [isi, setIsi] = useState<Isi | null>(null)
  const [sibuk, setSibuk] = useState(false)

  const [soap, setSoap] = useState({ subjektif: '', objektif: '', asesmen: '', plan: '' })
  const [vital, setVital] = useState<Record<string, string>>({})
  const [diagnosis, setDiagnosis] = useState<Diagnosis[]>([])
  const [kunjungan, setKunjungan] = useState({
    kesadaran: awal.kesadaran || '', poli: awal.poli || '',
    no_rujukan: awal.no_rujukan || '', status_pulang: awal.status_pulang || '',
    jenis_kunjungan: awal.jenis_kunjungan || 'sakit',
  })

  const [cari, setCari] = useState('')
  const [adendum, setAdendum] = useState('')

  useEffect(() => {
    let batal = false
    ;(async () => {
      const { data, error } = await supabase.rpc('rekam_medis', { p_visit: visitId })
      if (batal) return
      if (error) { alert(pesanError(error)); onTutup(); return }
      const d = data as Isi
      setIsi(d)
      if (d.soap) setSoap({
        subjektif: d.soap.subjektif || '', objektif: d.soap.objektif || '',
        asesmen: d.soap.asesmen || '', plan: d.soap.plan || '',
      })
      setDiagnosis((d.diagnosis || []).map((x: any) => ({
        kode_icd10: x.kode_icd10, nama: x.nama, tipe: x.tipe,
      })))
    })()
    return () => { batal = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId])

  const saran = useMemo(() => cariICD(cari), [cari])
  const kodeManual = cari.trim().toUpperCase()
  const bisaManual = BENTUK_ICD10.test(kodeManual) && !diagnosis.some(d => d.kode_icd10 === kodeManual)

  const tambah = (d: SaranICD) => {
    if (diagnosis.some(x => x.kode_icd10 === d.kode)) return
    // Yang pertama masuk jadi primer. Bukan tebakan: yang pertama diketik dokter
    // hampir selalu alasan utama pasien datang, dan kalau keliru tinggal ditukar.
    setDiagnosis([...diagnosis, {
      kode_icd10: d.kode, nama: d.nama,
      tipe: diagnosis.some(x => x.tipe === 'primer') ? 'sekunder' : 'primer',
    }])
    setCari('')
  }

  const jadikanPrimer = (kode: string) =>
    setDiagnosis(diagnosis.map(d => ({ ...d, tipe: d.kode_icd10 === kode ? 'primer' : 'sekunder' })))

  const simpan = async () => {
    const adaVital = Object.values(vital).some(v => v.trim() !== '')
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_rekam_medis', {
      p_visit: visitId,
      p_soap: soap,
      p_vital: adaVital ? vital : {},
      p_diagnosis: diagnosis,
      p_kunjungan: kunjungan,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    onSimpan()
    onTutup()
  }

  const kirimAdendum = async () => {
    if (!adendum.trim()) return
    setSibuk(true)
    const { error } = await supabase.rpc('tambah_adendum', { p_visit: visitId, p_isi: adendum })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setAdendum('')
    const { data } = await supabase.rpc('rekam_medis', { p_visit: visitId })
    setIsi(data as Isi)
  }

  const L = 'block text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-1'
  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60'
  const vitalTerakhir = isi?.vital?.[0]

  return (
    <div className="fixed inset-0 bg-black/45 flex items-start justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface-2)] rounded-2xl w-full max-w-3xl my-4 shadow-xl">

        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--surface)] rounded-t-2xl border-b border-[var(--line)]">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--ink)] truncate">{t('Rekam Medis', 'Medical Record')}</h2>
            <p className="text-xs text-[var(--ink-soft)] truncate">{nama}</p>
          </div>
          <button onClick={onTutup} className="shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {alergi && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-300 text-red-900" role="alert">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{t('Alergi obat', 'Drug allergy')}</p>
                <p className="text-sm">{alergi}</p>
              </div>
            </div>
          )}

          {!isi ? (
            <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
          ) : tertutup ? (
            <>
              {/* Kunjungan yang sudah ditutup dibaca saja. Rekam medis yang
                  ditulis ulang menghapus jejak apa yang sebenarnya dilihat
                  dokter saat itu, dan justru itu yang dicari kalau ada sengketa. */}
              <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3">
                {(['subjektif', 'objektif', 'asesmen', 'plan'] as const).map(k => (
                  <div key={k}>
                    <p className={L}>{k}</p>
                    <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{soap[k] || '-'}</p>
                  </div>
                ))}
                <div>
                  <p className={L}>{t('Diagnosis', 'Diagnoses')}</p>
                  {diagnosis.length === 0 ? <p className="text-sm text-[var(--ink-faint)]">-</p> :
                    diagnosis.map(d => (
                      <p key={d.kode_icd10} className="text-sm text-[var(--ink)]">
                        <span className="num font-semibold">{d.kode_icd10}</span> {d.nama}
                        {d.tipe === 'primer' && <span className="ml-1 text-[10px] font-bold text-[var(--brand)]">PRIMER</span>}
                      </p>
                    ))}
                </div>
                {vitalTerakhir && (
                  <div>
                    <p className={L}>{t('Tanda vital', 'Vital signs')}</p>
                    <p className="text-sm text-[var(--ink)] num">
                      {VITAL.filter(v => vitalTerakhir[v.k] != null)
                        .map(v => `${v.label[en ? 1 : 0]} ${vitalTerakhir[v.k]} ${v.satuan}`)
                        .join(' · ') || '-'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className={L}>{t('Adendum', 'Addenda')}</p>
                <p className="text-xs text-[var(--ink-soft)] mb-2 leading-relaxed">
                  {t('Kunjungan ini sudah ditutup, jadi catatannya tidak bisa diubah lagi. Koreksi ditulis sebagai adendum: catatan aslinya tetap utuh, dan keduanya terbaca berurutan.',
                     'This visit is closed, so the note can no longer be edited. Corrections are written as addenda: the original stays intact and both read in order.')}
                </p>
                {isi.adendum.map((a: any) => (
                  <div key={a.id} className="mb-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] px-3 py-2">
                    <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{a.isi}</p>
                    <p className="text-[10px] text-[var(--ink-faint)] mt-1">{a.ditulis_oleh} · {tanggalJam(a.ditulis_pada)}</p>
                  </div>
                ))}
                <textarea value={adendum} onChange={e => setAdendum(e.target.value)} rows={2}
                  placeholder={t('Tulis koreksi atau tambahan…', 'Write a correction or addition…')} className={I} />
                <button onClick={kirimAdendum} disabled={sibuk || !adendum.trim()}
                  className="mt-2 inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  <Plus size={15} /> {t('Tambah Adendum', 'Add Addendum')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ── Tanda vital ── */}
              <section>
                <p className={L}>{t('Tanda vital', 'Vital signs')}</p>
                {vitalTerakhir && (
                  <p className="text-[11px] text-[var(--ink-faint)] mb-2 num">
                    {t('Terakhir diukur', 'Last measured')} {tanggalJam(vitalTerakhir.dicatat_pada)}
                    {' · '}
                    {VITAL.filter(v => vitalTerakhir[v.k] != null)
                      .map(v => `${v.label[en ? 1 : 0]} ${vitalTerakhir[v.k]}`).join(' · ')}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VITAL.map(v => (
                    <div key={v.k}>
                      <label className="block text-xs text-[var(--ink-soft)] mb-1" title={`LOINC ${v.loinc}`}>
                        {v.label[en ? 1 : 0]} <span className="text-[var(--ink-faint)]">({v.satuan})</span>
                      </label>
                      <input inputMode="decimal" value={vital[v.k] || ''}
                        onChange={e => setVital({ ...vital, [v.k]: e.target.value })}
                        className={`${I} num`} />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--ink-faint)] mt-2 leading-relaxed">
                  {t('Kosongkan yang tidak diukur. Yang diisi disimpan sebagai pengukuran baru, tidak menimpa yang sebelumnya.',
                     'Leave unmeasured fields blank. What you fill is stored as a new measurement, it does not overwrite the previous one.')}
                </p>
              </section>

              {/* ── SOAP ── */}
              <section className="space-y-3">
                <p className={L}>{t('Catatan SOAP', 'SOAP note')}</p>
                {([
                  ['subjektif', t('Subjektif: keluhan menurut pasien', 'Subjective: complaint in the patient words')],
                  ['objektif',  t('Objektif: temuan pemeriksaan', 'Objective: examination findings')],
                  ['asesmen',   t('Asesmen: penilaian dokter', 'Assessment: clinical judgement')],
                  ['plan',      t('Plan: rencana tindakan dan terapi', 'Plan: treatment and follow up')],
                ] as const).map(([k, ket]) => (
                  <div key={k}>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{ket}</label>
                    <textarea rows={k === 'subjektif' || k === 'plan' ? 3 : 2}
                      value={soap[k]} onChange={e => setSoap({ ...soap, [k]: e.target.value })} className={I} />
                  </div>
                ))}
              </section>

              {/* ── Diagnosis ── */}
              <section>
                <p className={L}>{t('Diagnosis (ICD-10)', 'Diagnoses (ICD-10)')}</p>

                {diagnosis.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {diagnosis.map(d => (
                      <div key={d.kode_icd10} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
                        <span className="num text-xs font-bold text-[var(--brand)] shrink-0">{d.kode_icd10}</span>
                        <span className="text-sm text-[var(--ink)] truncate flex-1">{d.nama}</span>
                        {d.tipe === 'primer' ? (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--brand)] text-[var(--on-brand)]">
                            {t('PRIMER', 'PRIMARY')}
                          </span>
                        ) : (
                          <button onClick={() => jadikanPrimer(d.kode_icd10)}
                            className="shrink-0 text-[10px] text-[var(--ink-faint)] hover:text-[var(--brand)] hover:underline underline-offset-2">
                            {t('jadikan primer', 'make primary')}
                          </button>
                        )}
                        <button onClick={() => setDiagnosis(diagnosis.filter(x => x.kode_icd10 !== d.kode_icd10))}
                          className="shrink-0 text-[var(--ink-faint)] hover:text-red-600" aria-label={t('Hapus', 'Remove')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                  <input value={cari} onChange={e => setCari(e.target.value)}
                    placeholder={t('Cari diagnosis atau ketik kode ICD-10…', 'Search a diagnosis or type an ICD-10 code…')}
                    className={`${I} pl-9`} />
                </div>

                {(saran.length > 0 || bisaManual) && (
                  <div className="mt-1 border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)]">
                    {saran.map(s => (
                      <button key={s.kode} onClick={() => tambah(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] flex items-center gap-2">
                        <span className="num text-xs font-bold text-[var(--brand)] w-14 shrink-0">{s.kode}</span>
                        <span className="text-[var(--ink)] truncate">{s.nama}</span>
                      </button>
                    ))}
                    {bisaManual && (
                      <button onClick={() => tambah({ kode: kodeManual, nama: kodeManual })}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] border-t border-[var(--line)]">
                        <span className="num text-xs font-bold text-[var(--brand)]">{kodeManual}</span>
                        <span className="text-[var(--ink-soft)] ml-2">{t('pakai kode ini', 'use this code')}</span>
                      </button>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-[var(--ink-faint)] mt-2 leading-relaxed">
                  {t('Daftar yang muncul cuma saran cepat, bukan daftar resmi. Kode di luar daftar tetap bisa diketik. Satu kunjungan hanya boleh punya satu diagnosis primer.',
                     'The suggestions are a shortcut, not the official list. Codes outside it can still be typed. A visit may have only one primary diagnosis.')}
                </p>
              </section>

              {/* ── Yang diminta BPJS ── */}
              <section>
                <p className={L}>{t('Keterangan kunjungan', 'Visit details')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{t('Kesadaran', 'Consciousness')}</label>
                    <select value={kunjungan.kesadaran} onChange={e => setKunjungan({ ...kunjungan, kesadaran: e.target.value })} className={I}>
                      <option value="">{t('Pilih…', 'Choose…')}</option>
                      {KESADARAN.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{t('Jenis kunjungan', 'Visit type')}</label>
                    <select value={kunjungan.jenis_kunjungan} onChange={e => setKunjungan({ ...kunjungan, jenis_kunjungan: e.target.value })} className={I}>
                      <option value="sakit">{t('Sakit', 'Illness')}</option>
                      <option value="sehat">{t('Sehat', 'Wellness')}</option>
                      <option value="kia">{t('KIA', 'Maternal and child')}</option>
                      <option value="promotif">{t('Promotif preventif', 'Promotive preventive')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{t('Poli', 'Clinic unit')}</label>
                    <input value={kunjungan.poli} onChange={e => setKunjungan({ ...kunjungan, poli: e.target.value })} className={I} />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{t('Nomor rujukan', 'Referral number')}</label>
                    <input value={kunjungan.no_rujukan} onChange={e => setKunjungan({ ...kunjungan, no_rujukan: e.target.value })} className={`${I} num`} />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--ink-soft)] mb-1">{t('Status pulang', 'Discharge status')}</label>
                    <select value={kunjungan.status_pulang} onChange={e => setKunjungan({ ...kunjungan, status_pulang: e.target.value })} className={I}>
                      <option value="">{t('Pilih…', 'Choose…')}</option>
                      {STATUS_PULANG.map(s => <option key={s.nilai} value={s.nilai}>{s.nama}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--ink-faint)] mt-2 leading-relaxed">
                  {t('Kelimanya diminta BPJS P-Care saat kunjungan dikirim. Diisi sekarang selagi pasiennya masih ada, bukan nanti saat sudah tidak ada yang ingat.',
                     'All five are required by BPJS P-Care when the visit is submitted. Fill them now while the patient is still here, not later when nobody remembers.')}
                </p>
              </section>
            </>
          )}
        </div>

        {!tertutup && isi && (
          <div className="sticky bottom-0 flex gap-3 px-6 py-4 bg-[var(--surface)] rounded-b-2xl border-t border-[var(--line)]">
            <button onClick={onTutup} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
              {t('Batal', 'Cancel')}
            </button>
            <button onClick={simpan} disabled={sibuk}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
              <Check size={16} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Rekam Medis', 'Save Record')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
