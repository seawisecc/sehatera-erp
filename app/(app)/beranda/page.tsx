'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock,
  Minus, Package, Receipt, ShoppingCart, Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { rupiah, angka, desimal } from '@/lib/format'

/**
 * Beranda: ringkasan satu layar.
 *
 * Tiga hal yang membedakannya dari versi sebelumnya.
 *
 * 1. SATU pemilih periode menggerakkan seluruh halaman. Sebelumnya kartu angka
 *    selalu "hari ini" sementara grafiknya punya pemilih sendiri, jadi dua
 *    bagian di layar yang sama bicara tentang rentang waktu berbeda tanpa
 *    memberi tahu siapa pun.
 *
 * 2. Tiap angka dibandingkan dengan periode SEBELUMNYA. Angka tanpa
 *    pembanding bukan informasi: "Rp 8,4 juta" tidak memberi tahu apa pun
 *    sampai orang tahu minggu lalu berapa. Ini juga yang membuat papan seperti
 *    ini pantas dilihat tiap pagi, bukan cuma sekali saat penasaran.
 *
 * 3. Bahasanya tidak lagi menganggap semua pemakainya apotek. Istilah yang
 *    berubah menurut jenis fasilitas diambil dari `app.kata()`.
 *
 * Warna grafik memakai token tema. Versi pertamanya menulis hex tetap, jadi di
 * tiga dari empat tema grafiknya berbeda sendiri dari seluruh halaman.
 */

type Titik = { label: string; nilai: number; jumlah: number }
type Rentang = '7h' | '30h' | '90h'

const RENTANG: Record<Rentang, number> = { '7h': 7, '30h': 30, '90h': 90 }

export default function HalamanBeranda() {
  const { t, lang } = useLang()
  const app = useApp()
  const scope = app.scope

  const [rentang, setRentang] = useState<Rentang>('7h')
  const [memuat, setMemuat] = useState(true)

  const [seri, setSeri] = useState<Titik[]>([])
  const [seriLalu, setSeriLalu] = useState<Titik[]>([])
  const [kini, setKini] = useState({ omzet: 0, transaksi: 0, item: 0 })
  const [lalu, setLalu] = useState({ omzet: 0, transaksi: 0, item: 0 })
  const [totalProduk, setTotalProduk] = useState(0)

  const [terlaris, setTerlaris] = useState<any[]>([])
  const [stokMinim, setStokMinim] = useState<any[]>([])
  const [segeraExp, setSegeraExp] = useState<any[]>([])
  const [jatuhTempo, setJatuhTempo] = useState<any[]>([])

  // Kunci tanggal LOKAL, bukan UTC: dengan UTC, transaksi sore hari di WIB
  // masuk ke ember tanggal berikutnya dan omzet hari ini terlihat kosong.
  const kunci = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const muatAngka = useCallback(async () => {
    setMemuat(true)
    const hari = RENTANG[rentang]

    const mulai = new Date(); mulai.setHours(0, 0, 0, 0); mulai.setDate(mulai.getDate() - (hari - 1))
    const mulaiLalu = new Date(mulai); mulaiLalu.setDate(mulaiLalu.getDate() - hari)

    // Satu pengambilan untuk DUA periode sekaligus. Dua panggilan terpisah
    // untuk rentang yang bersebelahan hanya menggandakan waktu tunggu.
    const { data: trx } = await scope(
      supabase.from('transactions')
        .select('total,created_at,status')
        .gte('created_at', mulaiLalu.toISOString())
    )
    const { data: item } = await scope(
      supabase.from('transaction_items')
        .select('jumlah,transactions(created_at,status)')
    )

    const ember: Record<string, { nilai: number; jumlah: number }> = {}
    let oKini = 0, tKini = 0, oLalu = 0, tLalu = 0
    ;(trx || []).forEach((x: any) => {
      if (x.status === 'dibatalkan' || !x.created_at) return
      const d = new Date(x.created_at)
      const k = kunci(d)
      if (!ember[k]) ember[k] = { nilai: 0, jumlah: 0 }
      ember[k].nilai += x.total || 0
      ember[k].jumlah += 1
      if (d >= mulai) { oKini += x.total || 0; tKini += 1 }
      else { oLalu += x.total || 0; tLalu += 1 }
    })

    let iKini = 0, iLalu = 0
    ;(item || []).forEach((x: any) => {
      const c = x.transactions
      if (!c?.created_at || c.status === 'dibatalkan') return
      const d = new Date(c.created_at)
      if (d >= mulai) iKini += x.jumlah || 0
      else if (d >= mulaiLalu) iLalu += x.jumlah || 0
    })

    const loc = lang === 'en' ? 'en-US' : 'id-ID'
    const buat = (dari: Date): Titik[] =>
      Array.from({ length: hari }, (_, i) => {
        const d = new Date(dari); d.setDate(dari.getDate() + i)
        const b = ember[kunci(d)] || { nilai: 0, jumlah: 0 }
        const label = hari <= 7
          ? d.toLocaleDateString(loc, { weekday: 'short' })
          : (i % Math.ceil(hari / 6) === 0 || i === hari - 1)
            ? d.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
            : ''
        return { label, nilai: b.nilai, jumlah: b.jumlah }
      })

    setSeri(buat(mulai))
    setSeriLalu(buat(mulaiLalu))
    setKini({ omzet: oKini, transaksi: tKini, item: iKini })
    setLalu({ omzet: oLalu, transaksi: tLalu, item: iLalu })

    const { count } = await scope(supabase.from('products').select('*', { count: 'exact', head: true }))
    setTotalProduk(count || 0)
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentang, lang, app.superViewCompany])

  const muatDaftar = useCallback(async () => {
    const d30 = new Date(); d30.setDate(d30.getDate() - 30)
    const in60 = new Date(); in60.setDate(in60.getDate() + 60)

    const [{ data: items }, { data: prods }, { data: batches }, { data: fakturs }] = await Promise.all([
      scope(supabase.from('transaction_items').select('nama_obat,jumlah,transactions(status,created_at)')),
      scope(supabase.from('products').select('nama_obat,kode,stok_total,stok_minimum').order('stok_total')),
      scope(supabase.from('product_batches')
        .select('batch_number,expired_date,stok_batch,products(nama_obat)')
        .lte('expired_date', in60.toISOString().split('T')[0])
        .gt('stok_batch', 0).is('ditindaklanjuti_pada', null).order('expired_date')),
      scope(supabase.from('faktur')
        .select('nomor_faktur,tanggal_jatuh_tempo,total,status,suppliers(nama_supplier)')
        .neq('status', 'lunas')),
    ])

    const peta: Record<string, number> = {}
    ;(items || []).forEach((x: any) => {
      if (x.transactions?.status === 'dibatalkan') return
      if (!x.transactions?.created_at || new Date(x.transactions.created_at) < d30) return
      peta[x.nama_obat] = (peta[x.nama_obat] || 0) + (x.jumlah || 0)
    })
    setTerlaris(Object.entries(peta).map(([nama, qty]) => ({ nama, qty }))
      .sort((a, b) => b.qty - a.qty).slice(0, 5))

    setStokMinim((prods || []).filter((p: any) => (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)).slice(0, 6))
    setSegeraExp((batches || []).slice(0, 6))
    setJatuhTempo((fakturs || [])
      .filter((f: any) => f.tanggal_jatuh_tempo)
      .sort((a: any, b: any) => new Date(a.tanggal_jatuh_tempo).getTime() - new Date(b.tanggal_jatuh_tempo).getTime())
      .slice(0, 6))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muatAngka() }, [muatAngka])
  useEffect(() => { muatDaftar() }, [muatDaftar])

  const rata = kini.transaksi ? kini.omzet / kini.transaksi : 0
  const rataLalu = lalu.transaksi ? lalu.omzet / lalu.transaksi : 0

  const kartu = [
    { label: t('Omzet', 'Revenue'),                        nilai: rupiah(kini.omzet),    kini: kini.omzet,     lalu: lalu.omzet,     Icon: Wallet },
    { label: t('Transaksi', 'Transactions'),               nilai: angka(kini.transaksi), kini: kini.transaksi, lalu: lalu.transaksi, Icon: ShoppingCart },
    { label: t('Item terjual', 'Items sold'),              nilai: angka(kini.item),      kini: kini.item,      lalu: lalu.item,      Icon: Package },
    { label: t('Rata-rata / transaksi', 'Average / sale'), nilai: rupiah(rata),          kini: rata,           lalu: rataLalu,       Icon: Receipt },
  ]

  const perluPerhatian = stokMinim.length + segeraExp.length + jatuhTempo.length

  const KARTU = 'bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm'
  const namaRentang: Record<Rentang, string> = {
    '7h': t('7 hari', '7 days'), '30h': t('30 hari', '30 days'), '90h': t('90 hari', '90 days'),
  }

  return (
    <div>
      {/* ── Kepala: judul, dan SATU pemilih periode untuk seluruh halaman ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] tracking-[-0.01em]">{t('Beranda', 'Home')}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {app.namaFaskes} · {new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID',
              { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-[var(--surface-2)] p-1 text-xs font-medium shrink-0">
          {(Object.keys(RENTANG) as Rentang[]).map(r => (
            <button key={r} onClick={() => setRentang(r)}
              className={`px-3 py-1.5 rounded-lg transition ${
                rentang === r ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}>
              {namaRentang[r]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Angka utama, masing-masing dengan pembandingnya ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {kartu.map((k, i) => (
          <div key={i} className={`${KARTU} p-4 sm:p-5`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-[11px] sm:text-xs text-[var(--ink-soft)] font-medium uppercase tracking-wide leading-tight">{k.label}</p>
              <k.Icon size={16} className="shrink-0 text-[var(--ink-faint)]" strokeWidth={1.9} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--ink)] leading-tight break-words num">
              {memuat ? '—' : k.nilai}
            </p>
            <Selisih kini={k.kini} lalu={k.lalu} rentang={namaRentang[rentang]} />
          </div>
        ))}
      </div>

      {/* ── Grafik + komposisi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className={`${KARTU} lg:col-span-2 p-5`}>
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-[var(--ink)]">{t('Penjualan', 'Sales')}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--brand-soft)]" />{t('Omzet', 'Revenue')}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="inline-block w-4 h-0.5 rounded bg-[var(--accent)]" />{t('Transaksi', 'Transactions')}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
                  <span className="inline-block w-4 h-0.5 rounded" style={{ background: 'var(--line)' }} />
                  {t('periode sebelumnya', 'previous period')}
                </span>
              </div>
            </div>
            <p className="text-lg font-bold text-[var(--brand)] leading-none num">{rupiah(kini.omzet)}</p>
          </div>
          <Grafik data={seri} pembanding={seriLalu} kunciUlang={rentang} />
        </div>

        <div className={`${KARTU} p-5`}>
          <h2 className="font-semibold text-[var(--ink)] mb-1">{t('Produk Terlaris', 'Best Sellers')}</h2>
          <p className="text-xs text-[var(--ink-faint)] mb-4">{t('30 hari terakhir', 'Last 30 days')}</p>
          {terlaris.length === 0 ? (
            <p className="text-center text-xs text-[var(--ink-faint)] py-8">{t('Belum ada penjualan.', 'No sales yet.')}</p>
          ) : (
            <div className="space-y-3">
              {terlaris.map((b: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="font-medium text-[var(--ink)] truncate">{i + 1}. {b.nama}</span>
                    <span className="text-[var(--ink-soft)] shrink-0 num">{angka(b.qty)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand-soft)]"
                      style={{ width: `${Math.max(6, (b.qty / (terlaris[0].qty || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-[var(--line-soft)]">
            <p className="text-xs text-[var(--ink-soft)]">{t('Item terdaftar di katalog', 'Items in the catalogue')}</p>
            <p className="text-lg font-bold text-[var(--ink)] num">{angka(totalProduk)}</p>
          </div>
        </div>
      </div>

      {/* ── Yang perlu diurus. Ini bagian yang dilihat orang tiap pagi, jadi
             judulnya menyebut jumlahnya, bukan cuma menamai bagiannya. ── */}
      <div className="mt-8 mb-3 flex items-baseline gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-[var(--ink)]">{t('Perlu diurus', 'Needs attention')}</h2>
        <span className={`text-sm ${perluPerhatian ? 'text-[var(--accent)] font-medium' : 'text-[var(--ink-faint)]'}`}>
          {perluPerhatian
            ? `${angka(perluPerhatian)} ${t('hal', 'items')}`
            : t('tidak ada, semuanya beres', 'nothing, all clear')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          judul={t('Stok Minim', 'Low Stock')}
          jumlah={stokMinim.length}
          nada="merah"
          Icon={Package}
          tautan="/produk"
          kosong={t('Semua stok di atas batas minimum.', 'All stock is above the minimum.')}
        >
          {stokMinim.map((p: any, i: number) => (
            <Baris key={i} utama={p.nama_obat}
              kanan={<span className="num text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {angka(p.stok_total)} / {angka(p.stok_minimum)}
              </span>} />
          ))}
        </Panel>

        <Panel
          judul={t('Segera Kadaluarsa', 'Expiring Soon')}
          jumlah={segeraExp.length}
          nada="kuning"
          Icon={CalendarClock}
          tautan="/tindak-lanjut"
          kosong={t('Tidak ada batch mendekati kadaluarsa.', 'No batches nearing expiry.')}
        >
          {segeraExp.map((b: any, i: number) => {
            const hari = Math.ceil((new Date(b.expired_date).getTime() - Date.now()) / 86400000)
            return (
              <Baris key={i}
                utama={b.products?.nama_obat || '-'}
                bawah={`${t('Batch', 'Batch')} ${b.batch_number || '-'} · ${t('sisa', 'qty')} ${angka(b.stok_batch)}`}
                kanan={<span className={`num text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                  hari <= 0 ? 'bg-red-200 text-red-800' : hari <= 30 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {hari <= 0 ? t('Lewat', 'Past') : `${hari} ${t('hari', 'days')}`}
                </span>} />
            )
          })}
        </Panel>

        <Panel
          judul={t('Faktur Jatuh Tempo', 'Invoices Due')}
          jumlah={jatuhTempo.length}
          nada="netral"
          Icon={Receipt}
          tautan="/faktur"
          kosong={t('Tidak ada tagihan supplier yang menunggu.', 'No supplier invoices waiting.')}
        >
          {jatuhTempo.map((f: any, i: number) => {
            const hari = Math.ceil((new Date(f.tanggal_jatuh_tempo).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
            const nada = hari < 0 ? 'bg-red-200 text-red-800' : hari <= 7 ? 'bg-red-50 text-red-600'
              : hari <= 14 ? 'bg-yellow-50 text-yellow-700' : 'bg-[var(--surface-2)] text-[var(--ink-soft)]'
            return (
              <Baris key={i}
                utama={f.suppliers?.nama_supplier || '-'}
                bawah={rupiah(f.total)}
                kanan={<span className={`num text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${nada}`}>
                  {hari < 0 ? `${t('Telat', 'Late')} ${Math.abs(hari)}${t('h', 'd')}`
                    : hari === 0 ? t('Hari ini', 'Today') : `${hari} ${t('hari', 'days')}`}
                </span>} />
            )
          })}
        </Panel>
      </div>
    </div>
  )
}

/**
 * Selisih terhadap periode sebelumnya.
 *
 * Angka tanpa pembanding bukan informasi: "Rp 8,4 juta" tidak memberi tahu apa
 * pun sampai orang tahu minggu lalu berapa. Naik dan turun sengaja TIDAK
 * diberi warna hijau dan merah begitu saja, karena omzet naik belum tentu
 * kabar baik dan transaksi turun belum tentu kabar buruk; warnanya cuma
 * penanda arah, dan panahnya yang membaca.
 */
function Selisih({ kini, lalu, rentang }: { kini: number; lalu: number; rentang: string }) {
  const { t } = useLang()
  if (!lalu) {
    return <p className="text-[11px] text-[var(--ink-faint)] mt-2">{t('belum ada pembanding', 'no comparison yet')}</p>
  }
  const beda = ((kini - lalu) / lalu) * 100
  const naik = beda > 0.5
  const turun = beda < -0.5
  const Panah = naik ? ArrowUpRight : turun ? ArrowDownRight : Minus
  const warna = naik ? 'text-emerald-700' : turun ? 'text-red-600' : 'text-[var(--ink-faint)]'
  return (
    <p className={`text-[11px] mt-2 flex items-center gap-1 ${warna}`}>
      <Panah size={13} strokeWidth={2.4} className="shrink-0" />
      <span className="num font-medium">{desimal(Math.abs(beda), 1)}%</span>
      <span className="text-[var(--ink-faint)]">{t('vs', 'vs')} {rentang} {t('sebelumnya', 'before')}</span>
    </p>
  )
}

function Baris({ utama, bawah, kanan }: { utama: string; bawah?: string; kanan: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--line-soft)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-[var(--ink)] truncate">{utama}</p>
        {bawah && <p className="text-[11px] text-[var(--ink-faint)] num">{bawah}</p>}
      </div>
      <span className="shrink-0">{kanan}</span>
    </div>
  )
}

function Panel({
  judul, jumlah, nada, Icon, tautan, kosong, children,
}: {
  judul: string; jumlah: number; nada: 'merah' | 'kuning' | 'netral'
  Icon: typeof Package; tautan: string; kosong: string; children: React.ReactNode
}) {
  const { t } = useLang()
  const cincin = nada === 'merah' ? 'bg-red-50 text-red-600'
    : nada === 'kuning' ? 'bg-amber-50 text-amber-700'
    : 'bg-[var(--surface-2)] text-[var(--ink-soft)]'

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cincin}`}>
          <Icon size={16} />
        </div>
        <h3 className="font-semibold text-[var(--ink)]">{judul}</h3>
        {jumlah > 0 && (
          <span className="ml-auto text-xs font-semibold text-[var(--ink-soft)] num">{angka(jumlah)}</span>
        )}
      </div>

      {jumlah === 0 ? (
        <p className="text-center text-xs text-[var(--ink-faint)] py-6 leading-relaxed">{kosong}</p>
      ) : (
        <>
          <div className="flex-1">{children}</div>
          <Link href={tautan}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline underline-offset-4">
            {t('Buka semuanya', 'Open all')} <ArrowRight size={13} />
          </Link>
        </>
      )}
    </div>
  )
}

/**
 * Grafik omzet (batang) dan jumlah transaksi (garis), dengan periode
 * sebelumnya sebagai garis pembanding yang pudar.
 *
 * Digambar langsung sebagai SVG, bukan lewat pustaka grafik: ini satu-satunya
 * grafik di aplikasi, dan menambah pustaka untuknya berarti menambah ratusan
 * kilobita ke halaman yang paling sering dibuka.
 */
function Grafik({ data, pembanding, kunciUlang }: { data: Titik[]; pembanding: Titik[]; kunciUlang: string }) {
  const { t } = useLang()
  const n = data.length || 7
  const isi: Titik[] = data.length ? data : Array.from({ length: n }, () => ({ label: '', nilai: 0, jumlah: 0 }))
  const rapat = n > 10

  const maxNilai = Math.max(...isi.map(d => d.nilai), ...pembanding.map(d => d.nilai), 1)
  const maxJumlah = Math.max(...isi.map(d => d.jumlah), ...pembanding.map(d => d.jumlah), 1)

  const W = 340, H = 160, PL = 36, PR = 26, PT = 14, PB = 26
  const lebar = W - PL - PR, tinggi = H - PT - PB, dasar = PT + tinggi
  const slot = lebar / n
  const cx = (i: number) => PL + slot * i + slot / 2
  const lebarBatang = Math.max(3, slot * (rapat ? 0.62 : 0.5))
  const yGaris = (v: number) => dasar - (v / maxJumlah) * tinggi

  // Catmull-Rom ke Bezier: garisnya melengkung halus, bukan patah di tiap titik.
  const halus = (p: { x: number; y: number }[]) => {
    if (p.length < 2) return p.length ? `M${p[0].x},${p[0].y}` : ''
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    }
    return d
  }

  const jalur = halus(isi.map((d, i) => ({ x: cx(i), y: yGaris(d.jumlah) })))
  const jalurLalu = pembanding.length === n
    ? halus(pembanding.map((d, i) => ({ x: cx(i), y: yGaris(d.jumlah) })))
    : ''
  const panjang = 900
  const ringkas = (v: number) =>
    v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}jt` : v >= 1e3 ? `${Math.round(v / 1e3)}rb` : `${v}`

  return (
    <svg key={kunciUlang} viewBox={`0 0 ${W} ${H}`} className="w-full h-52 sw-chart" role="img"
      aria-label={t('Grafik penjualan', 'Sales chart')}>
      <defs>
        <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((g, i) => {
        const y = dasar - g * tinggi
        return (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="var(--line-soft)" strokeWidth="1" />
            <text x={PL - 5} y={y + 3} textAnchor="end" fontSize="7.5" fill="var(--ink-faint)">{ringkas(maxNilai * g)}</text>
          </g>
        )
      })}
      {[0, 1].map((g, i) => (
        <text key={'r' + i} x={W - PR + 5} y={dasar - g * tinggi + 3} textAnchor="start" fontSize="7.5" fill="var(--accent)">
          {Math.round(maxJumlah * g)}
        </text>
      ))}

      {isi.map((d, i) => {
        const h = (d.nilai / maxNilai) * tinggi
        return (
          <rect className="sw-bar" key={'b' + i} x={cx(i) - lebarBatang / 2} y={dasar - h}
            width={lebarBatang} height={Math.max(0, h)} rx={Math.min(3, lebarBatang / 2)} fill="url(#salesBar)"
            style={{ transformOrigin: `center ${dasar}px`, animationDelay: `${i * 0.03}s` }} />
        )
      })}

      {/* Periode sebelumnya digambar DI BAWAH periode sekarang, putus-putus dan
          pudar: ia pembanding, bukan sesuatu yang perlu dibaca angkanya. */}
      {jalurLalu && (
        <path d={jalurLalu} fill="none" stroke="var(--line)" strokeWidth="1.6"
          strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />
      )}

      <path className="sw-chart-line" d={jalur} fill="none" stroke="var(--accent)" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: panjang, strokeDashoffset: panjang }} />

      {!rapat && isi.map((d, i) => (
        <g key={'p' + i}>
          <circle className="sw-chart-dot" cx={cx(i)} cy={yGaris(d.jumlah)} r="3"
            fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"
            style={{ animationDelay: `${0.5 + i * 0.05}s` }} />
          {d.jumlah > 0 && (
            <text className="sw-chart-dot" x={cx(i)} y={yGaris(d.jumlah) - 7} textAnchor="middle"
              fontSize="8" fontWeight="700" fill="var(--accent)" style={{ animationDelay: `${0.6 + i * 0.05}s` }}>
              {d.jumlah}
            </text>
          )}
        </g>
      ))}

      {isi.map((d, i) => d.label
        ? <text key={'t' + i} x={cx(i)} y={H - 7} textAnchor="middle" fontSize="8.5" fill="var(--ink-faint)">{d.label}</text>
        : null)}
    </svg>
  )
}
