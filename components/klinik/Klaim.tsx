'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle2, FileText, Printer, Send, X, XCircle } from 'lucide-react'
import Portal from '@/components/Portal'
import TombolIkon from '@/components/TombolIkon'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR, TD } from '@/lib/ui'
import { rupiah, angka, tanggal, tanggalJam, tanggalLokal, awalBulanIni } from '@/lib/format'
import { bukaCetak, fakturPenjamin } from '@/lib/cetak'

/**
 * Klaim penjamin: berkas yang benar-benar dikirim ke BPJS atau asuransi.
 *
 * Layar ini menjawab tiga pertanyaan yang pasti ditanyakan pemilik dan yang
 * sebelumnya tidak ada jawabannya di mana pun: klaim mana yang sudah dikirim,
 * berapa yang belum dibayar, dan pelayanan ini sudah masuk klaim yang mana.
 *
 * Urutannya sengaja: yang MENUNGGU tindakan ada di atas (draf yang belum
 * dikirim, kiriman yang belum dibayar), yang sudah tutup ke bawah. Aturan yang
 * sama dengan daftar antrean di Kunjungan, dan alasannya sama: daftar menurut
 * waktu itu benar sebagai catatan dan salah sebagai alat kerja.
 *
 * Rinciannya CUPLIKAN. Faktur yang dicetak ulang bulan depan harus sama persis
 * dengan yang sudah ada di tangan verifikator, jadi yang dicetak diambil dari
 * kolom `rincian` klaimnya, bukan dihitung ulang dari transaksinya.
 */

const LABEL_STATUS: Record<string, [string, string]> = {
  draf:    ['Draf', 'Draft'],
  dikirim: ['Dikirim', 'Sent'],
  dibayar: ['Dibayar', 'Paid'],
  ditolak: ['Ditolak', 'Rejected'],
  batal:   ['Batal', 'Cancelled'],
}

const WARNA_STATUS: Record<string, string> = {
  draf:    'bg-slate-100 text-slate-700 ring-1 ring-slate-400/20',
  dikirim: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  dibayar: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  ditolak: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  batal:   'bg-gray-100 text-gray-500 ring-1 ring-gray-400/20',
}

/** Yang masih menuntut tindakan. Yang di luar ini digeser ke bawah. */
const TERBUKA = ['draf', 'dikirim']

export default function Klaim() {
  const { t, lang } = useLang()
  const { kabar, konfirmasi, tanya } = useUmpan()
  const app = useApp()

  const [daftar, setDaftar] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [asuransi, setAsuransi] = useState<any[]>([])
  const [sibuk, setSibuk] = useState(false)

  const [form, setForm] = useState<any>(null)
  const [pratinjau, setPratinjau] = useState<any[] | null>(null)
  const [muatPratinjau, setMuatPratinjau] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  const co = app.superViewCompany || null

  const muat = useCallback(async () => {
    setMemuat(true)
    const [{ data, error }, { data: ins }] = await Promise.all([
      supabase.rpc('daftar_klaim', { p_status: null, p_company: co }),
      app.scope(supabase.from('insurers').select('id,nama').eq('aktif', true).order('nama')),
    ])
    if (error) kabar(pesanError(error), 'galat')
    setDaftar((data as any[]) || [])
    setAsuransi((ins as any[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [co])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    if (!form && !detail) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setForm(null); setDetail(null) } }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [form, detail])

  /**
   * Pratinjau dibaca dari fungsi yang sama dengan yang dipakai membuat
   * klaimnya, bukan dari kueri lain yang mirip. Dua kueri yang seharusnya
   * memberi jawaban sama akan berbeda pada hari salah satunya diperbaiki, dan
   * yang berbeda di sini berarti klaim yang isinya bukan yang dilihat orangnya
   * saat menekan Buat.
   */
  useEffect(() => {
    if (!form) { setPratinjau(null); return }
    let batal = false
    ;(async () => {
      setMuatPratinjau(true)
      const { data, error } = await supabase.rpc('tagihan_belum_diklaim', {
        p_dari: form.dari, p_sampai: form.sampai,
        p_penjamin: form.penjamin,
        p_asuransi: form.penjamin === 'asuransi' ? (form.asuransi_id || null) : null,
        p_company: co,
      })
      if (batal) return
      if (error) kabar(pesanError(error), 'galat')
      setPratinjau((data as any[]) || [])
      setMuatPratinjau(false)
    })()
    return () => { batal = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.dari, form?.sampai, form?.penjamin, form?.asuransi_id, co])

  const nilaiPratinjau = useMemo(
    () => (pratinjau || []).reduce((a, x) => a + Number(x.ditagihkan || 0), 0),
    [pratinjau])

  /** Yang menunggu tindakan di atas, yang sudah tutup di bawah. */
  const urut = useMemo(() => {
    const skor = (x: any) => (TERBUKA.includes(x.status) ? 0 : 1)
    return [...daftar].sort((a, b) => skor(a) - skor(b))
  }, [daftar])

  const jumlahTerbuka = useMemo(() => daftar.filter(x => TERBUKA.includes(x.status)).length, [daftar])

  const ringkas = useMemo(() => daftar.reduce((a, x) => {
    const nilai = Number(x.total_ditagihkan || 0)
    if (x.status === 'draf') a.draf += nilai
    if (x.status === 'dikirim') a.dikirim += nilai
    if (x.status === 'dibayar') a.dibayar += Number(x.dibayar_jumlah || 0)
    return a
  }, { draf: 0, dikirim: 0, dibayar: 0 }), [daftar])

  const buat = async () => {
    if (form.penjamin === 'asuransi' && !form.asuransi_id) {
      kabar(t('Pilih dulu penerbit asuransinya.', 'Choose the insurer first.'), 'galat')
      return
    }
    setSibuk(true)
    const { error } = await supabase.rpc('buat_klaim', {
      p_dari: form.dari, p_sampai: form.sampai, p_penjamin: form.penjamin,
      p_asuransi: form.penjamin === 'asuransi' ? form.asuransi_id : null,
      p_catatan: form.catatan || null, p_company: co,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setForm(null)
    kabar(t('Klaim dibuat. Periksa dulu isinya sebelum menandainya dikirim.',
            'Claim created. Check its contents before marking it as sent.'), 'ok')
    muat()
  }

  const geser = async (k: any, status: string) => {
    let dibayar: number | null = null
    let catatan: string | null = null

    if (status === 'dibayar') {
      const jawab = await tanya({
        judul: t('Berapa yang dibayar penjamin?', 'How much did the payer pay?'),
        label: t(`Ditagihkan ${rupiah(k.total_ditagihkan)}. Isi sesuai yang benar-benar masuk rekening.`,
                 `Billed ${rupiah(k.total_ditagihkan)}. Enter what actually landed in the account.`),
        nilai: String(Number(k.total_ditagihkan || 0)),
        wajib: true,
      })
      if (jawab === null) return
      dibayar = Number(String(jawab).replace(/[^0-9.-]/g, ''))
      if (!dibayar || dibayar <= 0) {
        kabar(t('Jumlah yang dibayar harus lebih dari nol.', 'The paid amount must be above zero.'), 'galat')
        return
      }
    }

    if (status === 'ditolak') {
      const jawab = await tanya({
        judul: t('Alasan penolakan', 'Reason for rejection'),
        label: t('Ditulis apa adanya dari surat penjamin. Ini yang dibaca saat menyusun klaim penggantinya.',
                 'Copy it from the payer letter. This is what gets read when preparing the replacement claim.'),
        wajib: true,
      })
      if (jawab === null) return
      catatan = String(jawab)
    }

    if (status === 'batal' && !await konfirmasi({
      judul: t(`Batalkan klaim ${k.nomor}?`, `Cancel claim ${k.nomor}?`),
      pesan: t('Seluruh pelayanan di dalamnya kembali ke daftar yang belum ditagihkan, jadi bisa masuk klaim berikutnya. Klaimnya sendiri tetap tercatat.',
               'All services inside return to the unbilled list so they can join a later claim. The claim itself stays on record.'),
      tombol: t('Batalkan klaim', 'Cancel claim'),
      bahaya: true,
    })) return

    if (status === 'dikirim' && !await konfirmasi({
      judul: t(`Tandai ${k.nomor} sudah dikirim?`, `Mark ${k.nomor} as sent?`),
      pesan: t('Isinya sudah tidak perlu diubah lagi sesudah ini. Yang berubah kemudian diurus lewat klaim berikutnya.',
               'Its contents should not change after this. Later changes go into a follow-up claim.'),
      tombol: t('Sudah dikirim', 'Mark as sent'),
    })) return

    setSibuk(true)
    const { error } = await supabase.rpc('ubah_status_klaim', {
      p_id: k.id, p_status: status, p_dibayar: dibayar, p_tanggal: null, p_catatan: catatan,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const cetak = (k: any) => {
    const ok = bukaCetak(fakturPenjamin(app.settingsData || {}, {
      nomor: k.nomor, penjamin: k.penjamin, asuransi: k.asuransi,
      dari: k.dari, sampai: k.sampai, jumlah_transaksi: k.jumlah_transaksi,
      total_pelayanan: k.total_pelayanan, total_ditagihkan: k.total_ditagihkan,
      status: LABEL_STATUS[k.status]?.[0] || k.status,
      catatan: k.catatan, created_at: k.created_at,
    }, (k.rincian as any[]) || []), 1000, 800)
    if (!ok) kabar(t('Jendela cetak diblokir peramban. Izinkan popup untuk situs ini.',
                     'The print window was blocked. Allow popups for this site.'), 'galat')
  }

  const namaPenjamin = (k: any) =>
    k.penjamin === 'bpjs' ? 'BPJS Kesehatan' : (k.asuransi || t('Asuransi', 'Insurance'))

  const inputCls = 'w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const KARTU = 'bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--line)] rounded-2xl shadow-sm'

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className={`${KARTU} p-4`}>
          <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Belum dikirim', 'Not sent yet')}</p>
          <p className="text-2xl font-bold text-[var(--ink)] num leading-none">{rupiah(ringkas.draf)}</p>
          <p className="text-xs text-[var(--ink-faint)] mt-1.5">{t('Masih draf di meja sendiri', 'Still a draft on your own desk')}</p>
        </div>
        <div className={`${KARTU} p-4`}>
          <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Menunggu dibayar', 'Awaiting payment')}</p>
          <p className="text-2xl font-bold text-[var(--accent)] num leading-none">{rupiah(ringkas.dikirim)}</p>
          <p className="text-xs text-[var(--ink-faint)] mt-1.5">{t('Sudah dikirim, uangnya belum masuk', 'Sent, money not in yet')}</p>
        </div>
        <div className={`${KARTU} p-4`}>
          <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Sudah dibayar', 'Paid')}</p>
          <p className="text-2xl font-bold text-[var(--ink)] num leading-none">{rupiah(ringkas.dibayar)}</p>
          <p className="text-xs text-[var(--ink-faint)] mt-1.5">{t('Yang benar-benar diterima', 'What actually came in')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[var(--ink-soft)]">
          {t('Tagihan ke BPJS dan asuransi, berbentuk berkas yang bisa dikirim dan dilacak.',
             'Bills to BPJS and insurers, as documents you can send and track.')}
        </p>
        <button onClick={() => setForm({ dari: awalBulanIni(), sampai: tanggalLokal(), penjamin: 'bpjs', asuransi_id: '', catatan: '' })}
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          <FileText size={15} /> {t('Buat Klaim', 'New Claim')}
        </button>
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('No. Klaim', 'Claim No.')}</th>
              <th className={TH_L}>{t('Penjamin', 'Payer')}</th>
              <th className={TH_L}>{t('Periode', 'Period')}</th>
              <th className={TH_C}>{t('Pelayanan', 'Services')}</th>
              <th className={TH_R}>{t('Ditagihkan', 'Billed')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat && (
              <tr><td className={TD + ' text-center text-[var(--ink-faint)]'} colSpan={7}>{t('Memuat…', 'Loading…')}</td></tr>
            )}
            {!memuat && daftar.length === 0 && (
              <tr><td className={TD + ' text-center text-[var(--ink-faint)] py-10 text-sm'} colSpan={7}>
                {t('Belum ada klaim. Yang ditagihkan ke penjamin ada di tab Penjamin; klaim adalah berkas yang mengirimkannya.',
                   'No claims yet. What is billed to payers is in the Payers tab; a claim is the document that sends it.')}
              </td></tr>
            )}
            {urut.map((k, i) => {
              const tutup = !TERBUKA.includes(k.status)
              const pemisah = tutup && i === jumlahTerbuka && jumlahTerbuka > 0
              return (
                <Fragment key={k.id}>
                  {pemisah && (
                    <tr>
                      <td colSpan={7} className="px-4 py-1.5 bg-[var(--surface-2)] text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                        {t('SUDAH TUTUP', 'CLOSED')} ({daftar.length - jumlahTerbuka})
                      </td>
                    </tr>
                  )}
                  <tr className={TR + (tutup ? ' opacity-70' : '')}>
                    <td className={TD}>
                      <button onClick={() => setDetail(k)} className="font-medium text-[var(--brand)] num hover:underline underline-offset-4">
                        {k.nomor}
                      </button>
                      {Number(k.selisih_dibatalkan) > 0 && (
                        <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                          {angka(k.selisih_dibatalkan)} {t('pelayanan dibatalkan sesudah masuk klaim', 'services cancelled after being claimed')}
                        </div>
                      )}
                    </td>
                    <td className={TD + ' text-[var(--ink)]'}>{namaPenjamin(k)}</td>
                    <td className={TD + ' text-[var(--ink-soft)] text-xs num'}>
                      {tanggal(k.dari)} – {tanggal(k.sampai)}
                    </td>
                    <td className={TD + ' text-center text-[var(--ink-soft)] num'}>{angka(k.jumlah_transaksi)}</td>
                    <td className={TD + ' text-right font-medium text-[var(--ink)] num'}>
                      {rupiah(k.total_ditagihkan)}
                      {k.status === 'dibayar' && Number(k.dibayar_jumlah) !== Number(k.total_ditagihkan) && (
                        <div className="text-[10px] text-amber-700 font-semibold">
                          {t('dibayar', 'paid')} {rupiah(k.dibayar_jumlah)}
                        </div>
                      )}
                    </td>
                    <td className={TD + ' text-center'}>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${WARNA_STATUS[k.status] || ''}`}>
                        {LABEL_STATUS[k.status]?.[lang === 'en' ? 1 : 0] || k.status}
                      </span>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center justify-center gap-1.5">
                        <TombolIkon label={t('Cetak faktur tagihan', 'Print billing invoice')} onClick={() => cetak(k)}>
                          <Printer size={14} />
                        </TombolIkon>
                        {k.status === 'draf' && (
                          <TombolIkon label={t('Tandai sudah dikirim', 'Mark as sent')} warna="brand" onClick={() => geser(k, 'dikirim')}>
                            <Send size={14} />
                          </TombolIkon>
                        )}
                        {k.status === 'dikirim' && (
                          <>
                            <TombolIkon label={t('Catat pembayaran penjamin', 'Record payer payment')} warna="brand" onClick={() => geser(k, 'dibayar')}>
                              <CheckCircle2 size={14} />
                            </TombolIkon>
                            <TombolIkon label={t('Ditolak penjamin', 'Rejected by payer')} onClick={() => geser(k, 'ditolak')}>
                              <XCircle size={14} />
                            </TombolIkon>
                          </>
                        )}
                        {k.status !== 'dibayar' && k.status !== 'batal' && (
                          <TombolIkon label={t('Batalkan klaim', 'Cancel claim')} warna="bahaya" onClick={() => geser(k, 'batal')}>
                            <Ban size={14} />
                          </TombolIkon>
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--ink-faint)] mt-3 leading-relaxed">
        {t('Isi klaim adalah cuplikan saat ia dibuat. Transaksi yang dibatalkan sesudahnya tidak mengubah faktur yang sudah dikirim; selisihnya ditandai di daftar ini dan diurus lewat klaim berikutnya.',
           'A claim holds a snapshot from the moment it was created. Transactions cancelled afterwards do not change an invoice already sent; the difference is flagged here and settled in a follow-up claim.')}
      </p>

      {/* ── Buat klaim ─────────────────────────────────────────── */}
      {form && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--brand)]">{t('Buat Klaim', 'New Claim')}</h2>
                  <p className="text-xs text-[var(--ink-soft)] mt-1">
                    {t('Yang masuk hanya pelayanan yang belum pernah diklaim. Yang sudah tertagihkan tidak akan muncul dua kali.',
                       'Only services never claimed before are included. Already-billed ones will not appear twice.')}
                  </p>
                </div>
                <button onClick={() => setForm(null)} className="shrink-0 p-1.5 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--surface-2)]" aria-label={t('Tutup', 'Close')}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Dari Tgl', 'From')}</label>
                    <input type="date" value={form.dari} onChange={e => setForm({ ...form, dari: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Sampai Tgl', 'To')}</label>
                    <input type="date" value={form.sampai} onChange={e => setForm({ ...form, sampai: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Penjamin', 'Payer')}</label>
                    <select value={form.penjamin} onChange={e => setForm({ ...form, penjamin: e.target.value, asuransi_id: '' })} className={inputCls}>
                      <option value="bpjs">BPJS Kesehatan</option>
                      <option value="asuransi">{t('Asuransi', 'Insurance')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Penerbit', 'Insurer')}</label>
                    <select value={form.asuransi_id} disabled={form.penjamin !== 'asuransi'}
                      onChange={e => setForm({ ...form, asuransi_id: e.target.value })}
                      className={inputCls + ' disabled:opacity-50'}>
                      <option value="">{form.penjamin === 'asuransi' ? t('Pilih penerbit…', 'Choose insurer…') : '-'}</option>
                      {asuransi.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Catatan', 'Note')}</label>
                  <input value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })}
                    placeholder={t('Ikut tercetak di fakturnya. Boleh dikosongkan.', 'Printed on the invoice. May be left empty.')}
                    className={inputCls} />
                </div>

                <div className="border border-[var(--line)] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[var(--surface-2)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      {t('Yang akan masuk klaim', 'What will go into the claim')}
                    </p>
                    <p className="text-sm font-bold text-[var(--ink)] num">
                      {angka((pratinjau || []).length)} {t('pelayanan', 'services')} · {rupiah(nilaiPratinjau)}
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {muatPratinjau && (
                          <tr><td className="px-4 py-6 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
                        )}
                        {!muatPratinjau && (pratinjau || []).length === 0 && (
                          <tr><td className="px-4 py-6 text-center text-[var(--ink-faint)] text-sm">
                            {t('Tidak ada pelayanan yang belum ditagihkan pada rentang ini.',
                               'No unbilled services in this range.')}
                          </td></tr>
                        )}
                        {(pratinjau || []).map(x => (
                          <tr key={x.id} className="border-b border-[var(--line-soft)] last:border-0">
                            <td className="px-4 py-2">
                              <p className="text-[var(--ink)] font-medium">{x.pasien || '-'}</p>
                              <p className="text-[11px] text-[var(--ink-faint)] num">
                                {tanggal(x.tanggal)} · {x.nomor}
                                {x.nomor_penjamin ? ` · ${t('kartu', 'card')} ${x.nomor_penjamin}` : ''}
                              </p>
                            </td>
                            <td className="px-4 py-2 text-[11px] text-[var(--ink-soft)]">
                              {x.diagnosis || <span className="text-amber-700 font-medium">{t('tanpa diagnosis', 'no diagnosis')}</span>}
                            </td>
                            <td className="px-4 py-2 text-right num text-[var(--ink)] whitespace-nowrap">{rupiah(x.ditagihkan)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-[var(--line)]">
                <button onClick={() => setForm(null)} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                  {t('Batal', 'Cancel')}
                </button>
                <button onClick={buat} disabled={sibuk || muatPratinjau || (pratinjau || []).length === 0}
                  className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  {sibuk ? t('Menyimpan…', 'Saving…') : t('Buat Klaim', 'Create Claim')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Rincian satu klaim ─────────────────────────────────── */}
      {detail && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--brand)] num">{detail.nomor}</h2>
                  <p className="text-xs text-[var(--ink-soft)] mt-1">
                    {namaPenjamin(detail)} · {tanggal(detail.dari)} – {tanggal(detail.sampai)} ·{' '}
                    {LABEL_STATUS[detail.status]?.[lang === 'en' ? 1 : 0] || detail.status}
                  </p>
                  {detail.dikirim_pada && (
                    <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
                      {t('Dikirim', 'Sent')} {tanggalJam(detail.dikirim_pada)}
                      {detail.dibayar_pada ? ` · ${t('dibayar', 'paid')} ${tanggal(detail.dibayar_pada)} ${rupiah(detail.dibayar_jumlah)}` : ''}
                    </p>
                  )}
                  {detail.catatan && <p className="text-xs text-[var(--ink-soft)] mt-1">{detail.catatan}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => cetak(detail)}
                    className="inline-flex items-center gap-1.5 border border-[var(--line)] text-[var(--ink-soft)] px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-2)]">
                    <Printer size={14} /> {t('Cetak', 'Print')}
                  </button>
                  <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--surface-2)]" aria-label={t('Tutup', 'Close')}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto">
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('Tanggal', 'Date')}</th>
                      <th className={TH_L}>{t('Pasien', 'Patient')}</th>
                      <th className={TH_L}>{t('No. Kartu', 'Card No.')}</th>
                      <th className={TH_L}>{t('Diagnosis', 'Diagnosis')}</th>
                      <th className={TH_R}>{t('Pelayanan', 'Service')}</th>
                      <th className={TH_R}>{t('Ditagihkan', 'Billed')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((detail.rincian as any[]) || []).map((x, i) => (
                      <tr key={i} className={TR}>
                        <td className={TD + ' text-xs num text-[var(--ink-soft)]'}>{tanggal(x.tanggal)}</td>
                        <td className={TD}>
                          <p className="font-medium text-[var(--ink)]">{x.pasien || '-'}</p>
                          <p className="text-[11px] text-[var(--ink-faint)] num">{x.nomor_rm || '-'} · {x.nomor}</p>
                        </td>
                        <td className={TD + ' text-xs num text-[var(--ink-soft)]'}>{x.nomor_penjamin || '-'}</td>
                        <td className={TD + ' text-xs text-[var(--ink-soft)]'}>
                          {x.diagnosis ? <span className="num font-medium text-[var(--ink)]">{x.diagnosis}</span> : '-'}
                          {x.diagnosis_nama && <div className="text-[11px] text-[var(--ink-faint)]">{x.diagnosis_nama}</div>}
                        </td>
                        <td className={TD + ' text-right num text-[var(--ink-soft)]'}>{rupiah(x.total)}</td>
                        <td className={TD + ' text-right num font-medium text-[var(--ink)]'}>{rupiah(x.ditagihkan)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--line)]">
                      <td className={TD + ' font-bold text-[var(--ink)]'} colSpan={4}>{t('TOTAL', 'TOTAL')}</td>
                      <td className={TD + ' text-right num font-bold text-[var(--ink)]'}>{rupiah(detail.total_pelayanan)}</td>
                      <td className={TD + ' text-right num font-bold text-[var(--ink)]'}>{rupiah(detail.total_ditagihkan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
