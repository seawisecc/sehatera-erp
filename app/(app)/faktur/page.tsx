'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, CreditCard, Printer, Receipt, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { usePemuat } from '@/lib/pemuat'
import { useLang } from '@/lib/i18n'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { bukaCetak, buktiPembayaranFaktur } from '@/lib/cetak'
import { TR } from '@/lib/ui'

/**
 * Pembayaran Faktur: hutang ke pemasok, diurutkan dari yang paling mendesak.
 *
 * Fakturnya tidak dibuat di sini. Ia lahir sendiri saat barang diterima di
 * Pembelian, dan halaman ini hanya melunasi serta mencetak buktinya. Karena itu
 * pesan "belum ada faktur" menyebut dari mana ia akan datang: tanpa itu orang
 * mencari tombol Tambah yang memang tidak pernah ada.
 */
type Faktur = {
  id: string
  nomor_faktur: string | null
  tanggal_faktur: string | null
  tanggal_jatuh_tempo: string | null
  term_of_payment: number
  total: number | null
  status: string
  tanggal_bayar: string | null
  metode_bayar: string | null
  catatan_bayar: string | null
  suppliers?: { nama_supplier: string } | null
  purchase_orders?: { nomor_po: string } | null
}

const rp = (n: unknown) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const tgl = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export default function HalamanFaktur() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()

  const [daftar, setDaftar] = useState<Faktur[]>([])
  const { memuat, mulai, selesai } = usePemuat(app.superViewCompany)
  const [bayar, setBayar] = useState<Faktur | null>(null)
  const [formBayar, setFormBayar] = useState({
    tanggal_bayar: new Date().toISOString().split('T')[0],
    metode_bayar: 'Transfer',
    catatan_bayar: '',
  })
  const [menyimpan, setMenyimpan] = useState(false)

  const muat = async () => {
    mulai()
    const { data } = await app.scope(
      supabase.from('faktur').select('*, suppliers(nama_supplier), purchase_orders(nomor_po)'),
    )
    const rows = ((data as Faktur[]) || []).slice()
    // Belum lunas dulu, yang paling dekat jatuh tempo di atas. Halaman ini
    // dibuka untuk menjawab satu pertanyaan: mana yang harus dibayar hari ini.
    rows.sort((a, b) => {
      const au = a.status !== 'lunas' ? 0 : 1
      const bu = b.status !== 'lunas' ? 0 : 1
      if (au !== bu) return au - bu
      return new Date(a.tanggal_jatuh_tempo || 0).getTime() - new Date(b.tanggal_jatuh_tempo || 0).getTime()
    })
    setDaftar(rows)
    selesai()
  }

  useEffect(() => { muat() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  const cetakBukti = (f: Faktur) =>
    bukaCetak(buktiPembayaranFaktur(app.settingsData, {
      nomor_faktur: f.nomor_faktur,
      nama_supplier: f.suppliers?.nama_supplier,
      nomor_po: f.purchase_orders?.nomor_po,
      tanggal_faktur: f.tanggal_faktur,
      tanggal_jatuh_tempo: f.tanggal_jatuh_tempo,
      tanggal_bayar: f.tanggal_bayar,
      metode_bayar: f.metode_bayar,
      catatan_bayar: f.catatan_bayar,
      total: f.total,
    }))

  const simpanBayar = async () => {
    if (!bayar) return
    setMenyimpan(true)
    const { error } = await supabase.from('faktur').update({
      status: 'lunas',
      tanggal_bayar: formBayar.tanggal_bayar,
      metode_bayar: formBayar.metode_bayar,
      catatan_bayar: formBayar.catatan_bayar,
    }).eq('id', bayar.id)
    setMenyimpan(false)
    if (error) { kabar(pesanError(error), 'galat'); return }

    // Bukti dicetak dari salinan di memori, bukan dari hasil muat ulang: kalau
    // pencetakan menunggu kueri berikutnya, jendela cetak dibuka terlambat dan
    // peramban memblokirnya sebagai pop-up yang tidak dipicu klik.
    const lunas = { ...bayar, status: 'lunas', ...formBayar }
    setBayar(null)
    muat()
    cetakBukti(lunas)
  }

  const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0)
  const belumLunas = daftar.filter(f => f.status !== 'lunas')
  const totalHutang = belumLunas.reduce((a, f) => a + (f.total || 0), 0)
  const terlambat = belumLunas.filter(f => f.tanggal_jatuh_tempo && new Date(f.tanggal_jatuh_tempo) < hariIni).length

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Pembayaran Faktur', 'Invoice Payments')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-6">
        {t('Hutang ke pemasok, diurutkan dari jatuh tempo terdekat.', 'Supplier debt, sorted by nearest due date.')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Kartu ikon={<Wallet size={20} strokeWidth={1.9} />} nadaIkon="bg-[var(--surface-2)] text-[var(--accent)]"
          label={t('Total Hutang Belum Lunas', 'Total Unpaid Debt')} nilai={rp(totalHutang)} />
        <Kartu ikon={<Receipt size={20} strokeWidth={1.9} />} nadaIkon="bg-[var(--accent-soft)] text-[var(--accent)]"
          label={t('Faktur Belum Lunas', 'Unpaid Invoices')} nilai={String(belumLunas.length)} />
        <Kartu ikon={<CalendarClock size={20} strokeWidth={1.9} />} nadaIkon="bg-red-100 text-red-600"
          label={t('Lewat Jatuh Tempo', 'Overdue')} nilai={String(terlambat)} />
      </div>

      <div className="sw-geser-x sw-tabel-kartu-wadah bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] shadow-sm rounded-2xl">
        {memuat ? (
          <p className="text-center text-[var(--ink-faint)] py-12 text-sm">{t('Memuat…', 'Loading…')}</p>
        ) : daftar.length === 0 ? (
          <p className="text-center text-[var(--ink-faint)] py-12 text-sm">
            {t('Belum ada faktur. Faktur tercatat otomatis saat barang diterima di Pembelian.',
               'No invoices yet. They are recorded automatically when goods are received in Purchasing.')}
          </p>
        ) : (
          <table className="w-full text-sm sw-tabel-kartu">
            <thead>
              <tr className="bg-[var(--brand)] text-[var(--on-brand)]">
                <th className="text-left px-4 py-3 text-xs font-medium">{t('No. Faktur', 'Invoice No.')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-medium">PO</th>
                <th className="text-left px-4 py-3 text-xs font-medium">{t('Tgl Faktur', 'Invoice Date')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium">TOP</th>
                <th className="text-left px-4 py-3 text-xs font-medium">{t('Jatuh Tempo', 'Due Date')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium">Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium">{t('Aksi', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map(f => {
                const jt = f.tanggal_jatuh_tempo ? new Date(f.tanggal_jatuh_tempo) : null
                const lewat = !!jt && jt < hariIni && f.status !== 'lunas'
                const dekat = !!jt && !lewat && f.status !== 'lunas' && (jt.getTime() - hariIni.getTime()) / 86400000 <= 7
                return (
                  <tr key={f.id} className={`${TR} ${lewat ? 'bg-red-50/60' : ''}`}>
                    <td data-l={t('No. Faktur', 'Invoice No.')} className="px-4 py-3 num text-xs text-[var(--ink)]">{f.nomor_faktur || '-'}</td>
                    <td data-utama className="px-4 py-3 text-[var(--ink)]">{f.suppliers?.nama_supplier || '-'}</td>
                    <td data-l="PO" className="px-4 py-3 num text-xs text-[var(--ink-soft)]">{f.purchase_orders?.nomor_po || '-'}</td>
                    <td data-l={t('Tgl Faktur', 'Invoice Date')} className="px-4 py-3 text-xs text-[var(--ink-soft)]">{tgl(f.tanggal_faktur)}</td>
                    <td data-l="TOP" className="px-4 py-3 text-center text-xs text-[var(--ink-soft)] num">
                      {f.term_of_payment === 0 ? t('Tunai', 'Cash') : `${f.term_of_payment} ${t('hr', 'd')}`}
                    </td>
                    <td data-l={t('Jatuh Tempo', 'Due Date')} className="px-4 py-3 text-xs">
                      <span className={lewat ? 'text-red-600 font-semibold' : dekat ? 'text-amber-600 font-medium' : 'text-[var(--ink-soft)]'}>
                        {tgl(f.tanggal_jatuh_tempo)}
                      </span>
                      {lewat && <span className="block text-[10px] text-red-500">{t('terlambat', 'overdue')}</span>}
                    </td>
                    <td data-l="Total" className="px-4 py-3 text-right font-medium text-[var(--ink)] num">{rp(f.total)}</td>
                    <td data-l="Status" className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {f.status === 'lunas' ? t('Lunas', 'Paid') : t('Belum Lunas', 'Unpaid')}
                      </span>
                    </td>
                    <td data-aksi className="px-4 py-3 text-center">
                      {f.status === 'lunas' ? (
                        <button onClick={() => cetakBukti(f)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--brand)] text-xs font-medium hover:bg-[var(--surface-2)] transition">
                          <Printer size={13} /> {t('Cetak Bukti', 'Print Receipt')}
                        </button>
                      ) : (
                        <button onClick={() => {
                          setFormBayar({ tanggal_bayar: new Date().toISOString().split('T')[0], metode_bayar: 'Transfer', catatan_bayar: '' })
                          setBayar(f)
                        }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-xs font-medium hover:bg-[var(--brand-hover)] transition">
                          <CreditCard size={13} /> {t('Bayar', 'Pay')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {bayar && (
        <Dialog
          lebar="sm"
          onTutup={() => setBayar(null)}
          labelTutup={t('Tutup', 'Close')}
          judul={t('Bayar Faktur', 'Pay Invoice')}
          sub={`${bayar.nomor_faktur} · ${bayar.suppliers?.nama_supplier || ''}`}
          aksi={<>
            <button onClick={() => setBayar(null)} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
            <button onClick={simpanBayar} disabled={menyimpan} className={TOMBOL_UTAMA}>
              {menyimpan ? t('Menyimpan…', 'Saving…') : t('Lunasi & Cetak', 'Pay & Print')}
            </button>
          </>}
        >
            <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-[var(--ink-soft)]">{t('Jumlah dibayar', 'Amount due')}</span>
              <span className="text-xl font-bold text-[var(--ink)] num">{rp(bayar.total)}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tanggal Bayar', 'Payment Date')}</label>
                <input type="date" value={formBayar.tanggal_bayar}
                  onChange={e => setFormBayar({ ...formBayar, tanggal_bayar: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Metode Pembayaran', 'Payment Method')}</label>
                <select value={formBayar.metode_bayar}
                  onChange={e => setFormBayar({ ...formBayar, metode_bayar: e.target.value })} className={inputCls}>
                  <option value="Transfer">Transfer</option>
                  <option value="Tunai">{t('Tunai', 'Cash')}</option>
                  <option value="Giro">Giro</option>
                  <option value="Lainnya">{t('Lainnya', 'Other')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Catatan', 'Note')}</label>
                <input value={formBayar.catatan_bayar}
                  onChange={e => setFormBayar({ ...formBayar, catatan_bayar: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') simpanBayar() }}
                  placeholder={t('mis. no. referensi transfer', 'e.g. transfer reference no.')} className={inputCls} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--ink-faint)] mt-3">
              {t('Bukti pembayaran langsung dicetak sesudah disimpan.', 'The payment receipt prints immediately after saving.')}
            </p>
        </Dialog>
      )}
    </div>
  )
}

function Kartu({ ikon, nadaIkon, label, nilai }: { ikon: React.ReactNode; nadaIkon: string; label: string; nilai: string }) {
  return (
    <div className="bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] shadow-sm rounded-2xl p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${nadaIkon}`}>{ikon}</div>
      <p className="text-xs text-[var(--ink-soft)] font-medium uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-[var(--ink)] leading-none num">{nilai}</p>
    </div>
  )
}
