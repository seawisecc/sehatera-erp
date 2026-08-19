'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { useUmpan } from '@/components/Umpan'
import { rupiah } from '@/lib/format'

/**
 * Daftar pemeriksaan yang bisa dilayani, beserta tarif dan cetakan
 * parameternya.
 *
 * **Cetakan parameter itu bagian yang paling menghemat waktu.** Darah lengkap
 * sepuluh baris; dikali tiga puluh pasien sehari itu tiga ratus baris nama,
 * satuan, dan rentang rujukan yang diketik ulang tanpa guna. Lebih buruk:
 * rentang yang diketik ulang akan berbeda-beda tergantung siapa yang jaga,
 * sehingga penanda "tinggi" dan "rendah" berhenti berarti apa pun.
 *
 * Radiologi tidak punya cetakan parameter, dan itu disengaja: bacaannya
 * naratif, dan memaksanya jadi angka membuat orang mengisi kolom kosong.
 *
 * Barisnya sama dengan Layanan Jasa, cuma ditandai sebagai pemeriksaan. Satu
 * tabel, dua pintu: Layanan Jasa untuk tindakan pada umumnya, layar ini untuk
 * pemeriksaan beserta cetakannya.
 */

type Param = { nama: string; kode_loinc: string; satuan: string; rujukan_bawah: string; rujukan_atas: string; rujukan_teks: string }
type Paket = {
  id: string; nama: string; harga: number; jenis: string
  kode_loinc: string | null; kode_icd9: string | null; deskripsi: string | null; status: string
  parameter: any[]
}

const PARAM_KOSONG: Param = { nama: '', kode_loinc: '', satuan: '', rujukan_bawah: '', rujukan_atas: '', rujukan_teks: '' }

export default function TarifPenunjang({ bolehUbah }: { bolehUbah: boolean }) {
  const { t } = useLang()
  const { kabar } = useUmpan()

  const [daftar, setDaftar] = useState<Paket[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [form, setForm] = useState<any>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data, error } = await supabase.rpc('katalog_penunjang', { p_jenis: null })
    if (error) kabar(pesanError(error), 'galat')
    setDaftar(((data as Paket[]) || []))
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { muat() }, [muat])

  const buka = (p?: Paket) => setForm(p ? {
    id: p.id, jenis: p.jenis, nama: p.nama, harga: String(p.harga ?? ''),
    loinc: p.kode_loinc || '', icd9: p.kode_icd9 || '', deskripsi: p.deskripsi || '',
    parameter: (p.parameter || []).map((x: any) => ({
      nama: x.nama || '', kode_loinc: x.kode_loinc || '', satuan: x.satuan || '',
      rujukan_bawah: x.rujukan_bawah ?? '', rujukan_atas: x.rujukan_atas ?? '',
      rujukan_teks: x.rujukan_teks || '',
    })),
  } : {
    id: null, jenis: 'lab', nama: '', harga: '', loinc: '', icd9: '', deskripsi: '',
    parameter: [{ ...PARAM_KOSONG }],
  })

  const simpan = async () => {
    if (!form?.nama.trim()) return
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_tarif_penunjang', {
      p_id: form.id,
      p_jenis: form.jenis,
      p_nama: form.nama.trim(),
      p_harga: Number(form.harga) || 0,
      p_parameter: form.jenis === 'lab'
        ? (form.parameter as Param[]).filter(x => x.nama.trim()).map(x => ({
            nama: x.nama.trim(),
            kode_loinc: x.kode_loinc.trim() || null,
            satuan: x.satuan.trim() || null,
            rujukan_bawah: String(x.rujukan_bawah).trim() || null,
            rujukan_atas: String(x.rujukan_atas).trim() || null,
            rujukan_teks: x.rujukan_teks.trim() || null,
          }))
        : null,
      p_loinc: form.loinc.trim() || null,
      p_icd9: form.icd9.trim() || null,
      p_deskripsi: form.deskripsi.trim() || null,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setForm(null)
    kabar(t('Tarif pemeriksaan tersimpan.', 'Test tariff saved.'), 'ok')
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'
  const KARTU = 'bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm'

  const kelompok = [
    { id: 'lab', label: t('Laboratorium', 'Laboratory') },
    { id: 'radiologi', label: t('Radiologi', 'Imaging') },
  ]

  return (
    <div className={`${KARTU} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--ink)]">
            {t('Pemeriksaan yang bisa dilayani', 'Tests this facility can perform')}
          </h3>
          <p className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed max-w-2xl">
            {t('Yang ada di sini muncul sebagai pilihan saat dokter meminta pemeriksaan, dan tarifnya langsung masuk ke tagihan kunjungan. Untuk paket lab, parameternya diisi sekali di sini lalu dituangkan ke formulir hasil, jadi petugas lab tinggal mengetik angkanya.',
               'What is listed here appears when a doctor orders a test, and its tariff goes straight onto the visit bill. For lab panels, the parameters are set once here and poured into the result form, so the technician only types the numbers.')}
          </p>
        </div>
        {bolehUbah && (
          <button onClick={() => buka()}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
            <Plus size={15} /> {t('Tambah Pemeriksaan', 'Add Test')}
          </button>
        )}
      </div>

      {memuat ? (
        <p className="text-sm text-[var(--ink-faint)] py-6 text-center">{t('Memuat…', 'Loading…')}</p>
      ) : daftar.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)] py-10 text-center leading-relaxed max-w-md mx-auto">
          {t('Belum ada pemeriksaan yang didaftarkan. Selama daftar ini kosong, dokter tetap bisa meminta pemeriksaan tapi tidak ada yang tertagih.',
             'No tests registered yet. While this list is empty, doctors can still order tests but nothing gets billed.')}
        </p>
      ) : (
        <div className="space-y-5">
          {kelompok.map(g => {
            const isi = daftar.filter(x => x.jenis === g.id)
            if (isi.length === 0) return null
            return (
              <div key={g.id}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-soft)] mb-2 pb-1 border-b border-[var(--line-soft)]">
                  {g.label} <span className="num text-[var(--ink-faint)]">({isi.length})</span>
                </p>
                <div className="space-y-1.5">
                  {isi.map(p => (
                    <button key={p.id} onClick={() => bolehUbah && buka(p)} disabled={!bolehUbah}
                      className="w-full text-left flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--brand)] transition disabled:cursor-default disabled:hover:border-[var(--line)]">
                      <span className="text-sm font-medium text-[var(--ink)] flex-1 truncate">{p.nama}</span>
                      {p.jenis === 'lab' && (
                        <span className="text-[11px] text-[var(--ink-faint)]">
                          <span className="num">{p.parameter?.length || 0}</span> {t('parameter', 'parameters')}
                        </span>
                      )}
                      {p.kode_icd9 && <span className="text-[10px] num text-[var(--ink-faint)]">ICD-9 {p.kode_icd9}</span>}
                      <span className="num text-sm font-semibold text-[var(--brand)]">{rupiah(p.harga)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {form && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[5vh]" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[var(--surface)] px-6 pt-6 pb-3 border-b border-[var(--line-soft)] flex items-start justify-between gap-3 z-10">
                <h3 className="text-lg font-bold text-[var(--brand)]">
                  {form.id ? t('Ubah Pemeriksaan', 'Edit Test') : t('Tambah Pemeriksaan', 'Add Test')}
                </h3>
                <button onClick={() => setForm(null)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="flex gap-2">
                  {kelompok.map(g => (
                    <button key={g.id} type="button" onClick={() => setForm({ ...form, jenis: g.id })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        form.jenis === g.id ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                                            : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
                      }`}>
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={L}>{t('Nama pemeriksaan', 'Test name')} <span className="text-red-500">*</span></label>
                    <input autoFocus value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                      placeholder={form.jenis === 'lab' ? t('mis. Darah Lengkap', 'e.g. Complete Blood Count') : t('mis. Thorax PA', 'e.g. Chest X-ray PA')}
                      className={I} />
                  </div>
                  <div>
                    <label className={L}>{t('Tarif', 'Tariff')}</label>
                    <input inputMode="numeric" value={form.harga}
                      onChange={e => setForm({ ...form, harga: e.target.value.replace(/[^0-9]/g, '') })}
                      className={I + ' num'} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={L}>{t('Kode LOINC paket', 'Panel LOINC code')}</label>
                    <input value={form.loinc} onChange={e => setForm({ ...form, loinc: e.target.value })} className={I + ' num'} />
                  </div>
                  <div>
                    <label className={L}>{t('Kode ICD-9-CM', 'ICD-9-CM code')}</label>
                    <input value={form.icd9} onChange={e => setForm({ ...form, icd9: e.target.value })} className={I + ' num'} />
                  </div>
                  <div>
                    <label className={L}>{t('Keterangan', 'Note')}</label>
                    <input value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} className={I} />
                  </div>
                </div>

                {form.jenis === 'lab' ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-soft)] mb-1 pb-1 border-b border-[var(--line-soft)]">
                      {t('Parameter di dalam paket ini', 'Parameters in this panel')}
                    </p>
                    <p className="text-[11px] text-[var(--ink-faint)] mb-2 leading-relaxed">
                      {t('Diisi sekali di sini, lalu muncul sendiri di formulir hasil. Rentang rujukan tetap bisa diubah per pasien: rentang bayi berbeda dari dewasa, dan hemoglobin perempuan berbeda dari laki-laki.',
                         'Set once here, then appear automatically in the result form. Reference ranges can still be changed per patient: infant ranges differ from adult, and haemoglobin differs by sex.')}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[var(--ink-faint)] text-[10px] uppercase tracking-wide">
                            <th className="text-left font-medium pb-1">{t('Parameter', 'Parameter')}</th>
                            <th className="text-left font-medium pb-1 px-1">LOINC</th>
                            <th className="text-left font-medium pb-1 px-1">{t('Satuan', 'Unit')}</th>
                            <th className="text-left font-medium pb-1 px-1">{t('Rujukan', 'Reference')}</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {form.parameter.map((p: Param, i: number) => (
                            <tr key={i}>
                              <td className="py-0.5">
                                <input value={p.nama} onChange={e => setForm({ ...form, parameter: form.parameter.map((x: Param, j: number) => j === i ? { ...x, nama: e.target.value } : x) })} className={I} />
                              </td>
                              <td className="py-0.5 px-1">
                                <input value={p.kode_loinc} onChange={e => setForm({ ...form, parameter: form.parameter.map((x: Param, j: number) => j === i ? { ...x, kode_loinc: e.target.value } : x) })} className={I + ' num w-24'} />
                              </td>
                              <td className="py-0.5 px-1">
                                <input value={p.satuan} onChange={e => setForm({ ...form, parameter: form.parameter.map((x: Param, j: number) => j === i ? { ...x, satuan: e.target.value } : x) })} className={I + ' w-20'} />
                              </td>
                              <td className="py-0.5 px-1">
                                <div className="flex items-center gap-1">
                                  <input value={p.rujukan_bawah} inputMode="decimal"
                                    onChange={e => setForm({ ...form, parameter: form.parameter.map((x: Param, j: number) => j === i ? { ...x, rujukan_bawah: e.target.value } : x) })} className={I + ' num w-16'} />
                                  <span className="text-[var(--ink-faint)]">-</span>
                                  <input value={p.rujukan_atas} inputMode="decimal"
                                    onChange={e => setForm({ ...form, parameter: form.parameter.map((x: Param, j: number) => j === i ? { ...x, rujukan_atas: e.target.value } : x) })} className={I + ' num w-16'} />
                                </div>
                              </td>
                              <td className="py-0.5 pl-1">
                                {form.parameter.length > 1 && (
                                  <button onClick={() => setForm({ ...form, parameter: form.parameter.filter((_: Param, j: number) => j !== i) })}
                                    className="text-[var(--ink-faint)] hover:text-red-600" aria-label={t('Hapus baris', 'Remove row')}>
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => setForm({ ...form, parameter: [...form.parameter, { ...PARAM_KOSONG }] })}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline underline-offset-4">
                      <Plus size={13} /> {t('Tambah parameter', 'Add parameter')}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed rounded-lg border border-[var(--line)] px-3 py-2">
                    {t('Radiologi tidak punya cetakan parameter, dan itu disengaja: bacaannya naratif berupa temuan dan kesan. Memaksanya jadi angka membuat orang mengisi kolom yang tidak ada isinya.',
                       'Imaging has no parameter template, deliberately: its read is narrative, findings and impression. Forcing it into numbers makes people fill columns that have nothing in them.')}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-soft)] flex gap-3">
                <button onClick={() => setForm(null)}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                  {t('Batal', 'Cancel')}
                </button>
                <button onClick={simpan} disabled={sibuk || !form.nama.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  <Check size={15} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
