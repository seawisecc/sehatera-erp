'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, FlaskRound, Plus, RefreshCw, Trash2, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import TarifPenunjang from '@/components/klinik/TarifPenunjang'
import { jam } from '@/lib/format'

/**
 * Antrean kerja laboratorium dan radiologi.
 *
 * **Yang cito di atas, dan itu satu-satunya alasan kolom prioritas ada.**
 * Kalau antreannya tetap menurut waktu, menandai cito cuma jadi hiasan yang
 * membuat dokter mengira sesuatu sedang terjadi lebih cepat.
 *
 * **Yang mengisi hasil adalah petugas lab, bukan dokter yang memintanya.**
 * Hasil yang diisi oleh yang memintanya bukan hasil pemeriksaan, dan itu
 * ditegakkan database lewat kapabilitas `penunjang.hasil`, bukan oleh layar
 * ini. Layar ini cuma menyembunyikan tombol yang sudah pasti ditolak.
 *
 * Penyegarannya berkala, sama seperti antrean farmasi: belasan baris sehari,
 * dan sambungan realtime yang putus diam-diam jauh lebih buruk daripada jeda
 * sepuluh detik yang bisa dilihat orang di pojok layar.
 */

type Antre = {
  id: string
  jenis: string
  nama: string
  status: string
  prioritas: string
  catatan_klinis: string | null
  diminta_oleh: string | null
  diminta_pada: string
  visit_id: string
  nomor_antre: string | null
  pasien_nama: string
  nomor_rm: string | null
  poli: string | null
  cetakan?: any[]
  hasil?: any[]
}

type BarisHasil = {
  nama: string; kode_loinc: string; nilai: string; satuan: string
  rujukan_bawah: string; rujukan_atas: string; penanda: string
}

const HASIL_KOSONG: BarisHasil = {
  nama: '', kode_loinc: '', nilai: '', satuan: '',
  rujukan_bawah: '', rujukan_atas: '', penanda: 'normal',
}

export default function HalamanPenunjang() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()

  const bolehIsi = boleh(app.currentRole, 'penunjang.hasil', app.isSuper)
  // Tarif diubah oleh yang bertanggung jawab atas uangnya, bukan petugas lab
  // yang memakai daftarnya sehari-hari. Database menegakkannya juga.
  const bolehTarif = app.isSuper || ['pemilik', 'admin'].includes(app.currentRole || '')
  const [tab, setTab] = useState<'antrean' | 'tarif'>('antrean')

  const [jenis, setJenis] = useState<'semua' | 'lab' | 'radiologi'>('semua')
  const [daftar, setDaftar] = useState<Antre[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const [kerja, setKerja] = useState<Antre | null>(null)
  const [hasil, setHasil] = useState<BarisHasil[]>([{ ...HASIL_KOSONG }])
  const [temuan, setTemuan] = useState('')
  const [kesan, setKesan] = useState('')

  const muat = useCallback(async () => {
    setMemuat(true)
    setGalat('')
    const { data, error } = await supabase.rpc('antrean_penunjang', {
      p_jenis: jenis === 'semua' ? null : jenis,
    })
    if (error) setGalat(pesanError(error))
    setDaftar(((data as Antre[]) || []))
    setMemuat(false)
  }, [jenis])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    const id = setInterval(() => { if (!kerja) muat() }, 20000)
    return () => clearInterval(id)
  }, [muat, kerja])

  /**
   * Formulir hasil sudah terisi barisnya dari cetakan paketnya.
   *
   * Ini yang membuat modul lab benar-benar bisa dipakai: darah lengkap itu
   * sepuluh parameter, dan mengetik ulang nama, satuan, serta rentang rujukan
   * untuk tiap pasien adalah pekerjaan yang tidak ada gunanya. Lebih buruk:
   * rentang yang diketik ulang berbeda-beda tergantung siapa yang jaga,
   * sehingga penanda tinggi dan rendah berhenti berarti apa pun.
   *
   * Hasil yang SUDAH pernah disimpan menang atas cetakan: pemeriksaan yang
   * diisi bertahap harus melanjutkan yang sudah ada, bukan mengosongkannya.
   */
  const mulai = (a: Antre) => {
    setKerja(a)
    const sudah = (a.hasil || []).map((h: any) => ({
      nama: h.nama || '', kode_loinc: h.kode_loinc || '', nilai: h.nilai || '',
      satuan: h.satuan || '', rujukan_bawah: h.rujukan_bawah ?? '',
      rujukan_atas: h.rujukan_atas ?? '', penanda: h.penanda || 'normal',
    }))
    const cetakan = (a.cetakan || []).map((c: any) => ({
      nama: c.nama || '', kode_loinc: c.kode_loinc || '', nilai: '',
      satuan: c.satuan || '', rujukan_bawah: c.rujukan_bawah ?? '',
      rujukan_atas: c.rujukan_atas ?? '', penanda: 'normal',
    }))
    setHasil(sudah.length > 0 ? sudah : cetakan.length > 0 ? cetakan : [{ ...HASIL_KOSONG }])
    setTemuan('')
    setKesan('')
  }

  const simpan = async (selesai: boolean) => {
    if (!kerja) return
    const isi = kerja.jenis === 'lab'
      ? hasil.filter(h => h.nama.trim()).map(h => ({
          nama: h.nama.trim(),
          kode_loinc: h.kode_loinc.trim() || null,
          nilai: h.nilai.trim() || null,
          // `nilai_angka` diisi HANYA kalau memang angka. Hasil seperti
          // "positif" atau "kuning jernih" tetap tersimpan di `nilai`, dan
          // memaksanya jadi angka cuma menghasilkan nol yang tidak berarti.
          nilai_angka: h.nilai.trim() !== '' && !isNaN(Number(h.nilai)) ? h.nilai.trim() : null,
          satuan: h.satuan.trim() || null,
          rujukan_bawah: h.rujukan_bawah.trim() || null,
          rujukan_atas: h.rujukan_atas.trim() || null,
          penanda: h.penanda,
        }))
      : null

    if (kerja.jenis === 'lab' && selesai && (isi || []).length === 0) {
      kabar(t('Belum ada satu pun parameter yang diisi.', 'No parameter has been filled in yet.'))
      return
    }

    setSibuk(true)
    const { error } = await supabase.rpc('isi_hasil_penunjang', {
      p_id: kerja.id,
      p_hasil: isi,
      p_temuan: temuan.trim() || null,
      p_kesan: kesan.trim() || null,
      p_selesai: selesai,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setKerja(null)
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const KARTU = 'bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm'

  const jumlahCito = useMemo(() => daftar.filter(x => x.prioritas === 'cito').length, [daftar])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1 flex items-center gap-2">
            <FlaskRound size={26} /> {t('Lab & Radiologi', 'Lab & Imaging')}
          </h1>
          <p className="text-[var(--ink-soft)] text-sm">
            <span className="num">{daftar.length}</span> {t('menunggu dikerjakan', 'waiting')}
            {jumlahCito > 0 && (
              <> · <span className="num font-semibold text-red-700">{jumlahCito}</span> <span className="text-red-700 font-semibold">CITO</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'antrean' && (['semua', 'lab', 'radiologi'] as const).map(j => (
            <button key={j} onClick={() => setJenis(j)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                jenis === j ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                            : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
              }`}>
              {j === 'semua' ? t('Semua', 'All') : j === 'lab' ? t('Lab', 'Lab') : t('Radiologi', 'Imaging')}
            </button>
          ))}
          {tab === 'antrean' && (
            <button onClick={muat} disabled={memuat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs text-[var(--ink-soft)] hover:bg-[var(--surface-2)] disabled:opacity-50">
              <RefreshCw size={13} /> {t('Segarkan', 'Refresh')}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        {([
          { id: 'antrean' as const, label: t('Antrean kerja', 'Worklist') },
          { id: 'tarif' as const,   label: t('Tarif & paket pemeriksaan', 'Tariffs & panels') },
        ]).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === x.id ? 'bg-[var(--brand)] text-[var(--on-brand)]'
                           : 'text-[var(--ink-soft)] hover:bg-[var(--surface)]/60'
            }`}>
            {x.label}
          </button>
        ))}
      </div>

      {galat && tab === 'antrean' && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{galat}</p>
      )}

      {tab === 'tarif' && <TarifPenunjang bolehUbah={bolehTarif} />}

      {tab === 'antrean' && (
      <div className={`${KARTU} p-4`}>
        {memuat ? (
          <p className="text-sm text-[var(--ink-faint)] py-8 text-center">{t('Memuat…', 'Loading…')}</p>
        ) : daftar.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)] py-10 text-center leading-relaxed">
            {t('Tidak ada pemeriksaan yang menunggu. Permintaan baru muncul di sini begitu dokter memintanya.',
               'Nothing waiting. New orders appear here as soon as a doctor places them.')}
          </p>
        ) : (
          <div className="space-y-2">
            {daftar.map(a => (
              <div key={a.id}
                className={`rounded-xl border p-3 ${
                  a.prioritas === 'cito' ? 'border-red-300 bg-red-50' : 'border-[var(--line)]'
                }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-xs font-bold text-[var(--brand)]">{a.nomor_antre || '-'}</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{a.pasien_nama}</span>
                  {a.nomor_rm && <span className="text-[11px] text-[var(--ink-faint)] num">{a.nomor_rm}</span>}
                  {a.prioritas === 'cito' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                      <Zap size={10} /> CITO
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-[var(--ink-faint)] num">{jam(a.diminta_pada)}</span>
                </div>
                <p className="text-sm text-[var(--ink)] mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-soft)] mr-1.5">
                    {a.jenis === 'lab' ? 'LAB' : t('RAD', 'IMG')}
                  </span>
                  {a.nama}
                </p>
                <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                  {a.poli ? `${a.poli} · ` : ''}{a.diminta_oleh}
                  {a.catatan_klinis ? ` · ${a.catatan_klinis}` : ''}
                </p>
                {bolehIsi && (
                  <button onClick={() => mulai(a)}
                    className="mt-2 inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--brand-hover)] transition">
                    <Check size={13} /> {t('Isi hasil', 'Enter result')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {kerja && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[6vh]" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface)] px-6 pt-6 pb-3 border-b border-[var(--line-soft)] z-10">
              <h2 className="text-lg font-bold text-[var(--brand)]">{kerja.nama}</h2>
              <p className="text-xs text-[var(--ink-soft)]">
                {kerja.pasien_nama}
                {kerja.nomor_rm ? ` · ${kerja.nomor_rm}` : ''}
                {kerja.catatan_klinis ? ` · ${kerja.catatan_klinis}` : ''}
              </p>
            </div>

            <div className="px-6 py-4 space-y-3">
              {kerja.jenis === 'lab' ? (
                <>
                  <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed">
                    {t('Tiap parameter satu baris, dengan satuan dan rentang rujukannya. Bukan satu kotak catatan: hasil yang ditulis bebas tidak bisa dibandingkan dengan hasil bulan lalu maupun dikirim ke SatuSehat.',
                       'One row per parameter, with unit and reference range. Not one free-text box: results written as prose cannot be compared with last month nor sent to SatuSehat.')}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[var(--ink-faint)] text-[10px] uppercase tracking-wide">
                          <th className="text-left font-medium pb-1">{t('Parameter', 'Parameter')} *</th>
                          <th className="text-left font-medium pb-1 px-1">LOINC</th>
                          <th className="text-left font-medium pb-1 px-1">{t('Hasil', 'Value')}</th>
                          <th className="text-left font-medium pb-1 px-1">{t('Satuan', 'Unit')}</th>
                          <th className="text-left font-medium pb-1 px-1">{t('Rujukan', 'Ref.')}</th>
                          <th className="text-left font-medium pb-1 px-1">{t('Penanda', 'Flag')}</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {hasil.map((h, i) => (
                          <tr key={i}>
                            <td className="py-0.5">
                              <input value={h.nama} onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, nama: e.target.value } : x))} className={I} />
                            </td>
                            <td className="py-0.5 px-1">
                              <input value={h.kode_loinc} onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, kode_loinc: e.target.value } : x))} className={I + ' num w-24'} />
                            </td>
                            <td className="py-0.5 px-1">
                              <input value={h.nilai} onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, nilai: e.target.value } : x))} className={I + ' num w-24'} />
                            </td>
                            <td className="py-0.5 px-1">
                              <input value={h.satuan} onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, satuan: e.target.value } : x))} className={I + ' w-20'} />
                            </td>
                            <td className="py-0.5 px-1">
                              <div className="flex items-center gap-1">
                                <input value={h.rujukan_bawah} inputMode="decimal"
                                  onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, rujukan_bawah: e.target.value } : x))} className={I + ' num w-16'} />
                                <span className="text-[var(--ink-faint)]">-</span>
                                <input value={h.rujukan_atas} inputMode="decimal"
                                  onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, rujukan_atas: e.target.value } : x))} className={I + ' num w-16'} />
                              </div>
                            </td>
                            <td className="py-0.5 px-1">
                              <select value={h.penanda} onChange={e => setHasil(hasil.map((x, j) => j === i ? { ...x, penanda: e.target.value } : x))} className={I}>
                                <option value="normal">{t('Normal', 'Normal')}</option>
                                <option value="rendah">{t('Rendah', 'Low')}</option>
                                <option value="tinggi">{t('Tinggi', 'High')}</option>
                                <option value="kritis">{t('Kritis', 'Critical')}</option>
                              </select>
                            </td>
                            <td className="py-0.5 pl-1">
                              {hasil.length > 1 && (
                                <button onClick={() => setHasil(hasil.filter((_, j) => j !== i))}
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
                  <button onClick={() => setHasil([...hasil, { ...HASIL_KOSONG }])}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline underline-offset-4">
                    <Plus size={13} /> {t('Tambah parameter', 'Add parameter')}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed">
                    {t('Bacaan radiologi memang naratif. Memaksanya jadi angka membuat orang mengisi kolom yang tidak ada isinya.',
                       'Imaging reads are narrative by nature. Forcing them into numbers makes people fill columns that have nothing in them.')}
                  </p>
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Temuan', 'Findings')}</label>
                    <textarea rows={4} value={temuan} onChange={e => setTemuan(e.target.value)} className={I} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kesan', 'Impression')}</label>
                    <textarea rows={2} value={kesan} onChange={e => setKesan(e.target.value)} className={I} />
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-[var(--surface)] px-6 py-4 border-t border-[var(--line-soft)] flex flex-wrap gap-2">
              <button onClick={() => setKerja(null)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Tutup', 'Close')}
              </button>
              {/* Simpan tanpa menyelesaikan: pemeriksaan yang parameternya
                  keluar bertahap tidak perlu ditahan sampai semuanya lengkap. */}
              <button onClick={() => simpan(false)} disabled={sibuk}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] disabled:opacity-50">
                {t('Simpan sementara', 'Save draft')}
              </button>
              <button onClick={() => simpan(true)} disabled={sibuk}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                <Check size={15} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Selesai', 'Complete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
