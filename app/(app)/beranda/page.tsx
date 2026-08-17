'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Pill, ShoppingCart, CalendarClock, Wallet, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { rupiah, angka } from '@/lib/format'

/**
 * Beranda: ringkasan satu layar.
 *
 * Warna grafik dipindah ke token tema saat modul ini keluar dari monolit.
 * Sebelumnya batang, garis, dan garis bantunya ditulis sebagai hex tetap
 * (#3a6b50, #c2632f, #eceae3), jadi di tiga dari empat tema grafiknya memakai
 * warna tema lama sementara semua yang di sekitarnya sudah berganti.
 */

type Titik = { label: string; day: number | string; value: number; count: number }

export default function HalamanBeranda() {
  const { t, lang } = useLang()
  const app = useApp()

  const [statProduk, setStatProduk] = useState(0)
  const [statTrxHariIni, setStatTrxHariIni] = useState(0)
  const [statOmzet, setStatOmzet] = useState(0)
  const [statExpired, setStatExpired] = useState(0)
  const [salesChart, setSalesChart] = useState<Titik[]>([])
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d')
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [expiringSoon, setExpiringSoon] = useState<any[]>([])
  const [dueInvoices, setDueInvoices] = useState<any[]>([])

  const scope = app.scope

  // Kunci tanggal LOKAL, bukan UTC: kalau memakai UTC, transaksi sore hari di
  // WIB masuk ke ember tanggal berikutnya dan omzet "hari ini" jadi kosong.
  const localKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const muatGrafik = useCallback(async (range: '7d' | '30d') => {
    const span = range === '30d' ? 30 : 7
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (span - 1))
    const days: Date[] = []
    for (let i = 0; i < span; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }

    const { data: trx } = await scope(
      supabase.from('transactions').select('total,created_at,status').gte('created_at', start.toISOString())
    )
    const bucket: Record<string, { value: number; count: number }> = {}
    ;(trx || []).forEach((x: any) => {
      if (x.status === 'dibatalkan' || !x.created_at) return
      const k = localKey(new Date(x.created_at))
      if (!bucket[k]) bucket[k] = { value: 0, count: 0 }
      bucket[k].value += (x.total || 0)
      bucket[k].count += 1
    })
    const loc = lang === 'en' ? 'en-US' : 'id-ID'
    setSalesChart(days.map((d, i) => {
      const b = bucket[localKey(d)] || { value: 0, count: 0 }
      const label = span === 7
        ? d.toLocaleDateString(loc, { weekday: 'short' })
        : (i % 5 === 0 || i === span - 1) ? d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }) : ''
      return { label, day: d.getDate(), value: b.value, count: b.count }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, app.superViewCompany])

  const muatWidget = useCallback(async () => {
    // Produk terlaris, 30 hari terakhir
    const d30 = new Date(); d30.setDate(d30.getDate() - 30)
    const { data: items } = await scope(
      supabase.from('transaction_items').select('nama_obat,jumlah,transactions(status,created_at)')
    )
    const map: Record<string, number> = {}
    ;(items || []).forEach((it: any) => {
      if (it.transactions?.status === 'dibatalkan') return
      if (!it.transactions?.created_at || new Date(it.transactions.created_at) < d30) return
      map[it.nama_obat] = (map[it.nama_obat] || 0) + (it.jumlah || 0)
    })
    setBestSellers(Object.entries(map).map(([nama, qty]) => ({ nama, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5))

    const { data: prods } = await scope(
      supabase.from('products').select('nama_obat,kode,stok_total,stok_minimum').order('stok_total')
    )
    setLowStock((prods || []).filter((p: any) => (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)).slice(0, 8))

    const in60 = new Date(); in60.setDate(in60.getDate() + 60)
    const { data: batches } = await scope(
      supabase.from('product_batches')
        .select('batch_number,expired_date,stok_batch,products(nama_obat)')
        .lte('expired_date', in60.toISOString().split('T')[0]).gt('stok_batch', 0).order('expired_date')
    )
    setExpiringSoon((batches || []).slice(0, 6))

    const { data: fakturs } = await scope(
      supabase.from('faktur')
        .select('nomor_faktur,tanggal_jatuh_tempo,total,status,suppliers(nama_supplier)')
        .neq('status', 'lunas')
    )
    setDueInvoices((fakturs || [])
      .filter((f: any) => f.tanggal_jatuh_tempo)
      .sort((a: any, b: any) => new Date(a.tanggal_jatuh_tempo).getTime() - new Date(b.tanggal_jatuh_tempo).getTime())
      .slice(0, 6))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  const muatStat = useCallback(async () => {
    const { count: produkCount } = await scope(supabase.from('products').select('*', { count: 'exact', head: true }))
    setStatProduk(produkCount || 0)

    const today = new Date().toISOString().split('T')[0]
    const { data: trxHariIni } = await scope(supabase.from('transactions').select('total').gte('created_at', today))
    setStatTrxHariIni(trxHariIni?.length || 0)
    setStatOmzet(trxHariIni?.reduce((a: number, b: any) => a + b.total, 0) || 0)

    const in60 = new Date(); in60.setDate(new Date().getDate() + 60)
    const { count: expCount } = await scope(
      supabase.from('product_batches').select('*', { count: 'exact', head: true })
        .lte('expired_date', in60.toISOString().split('T')[0]).gt('stok_batch', 0)
    )
    setStatExpired(expCount || 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muatStat(); muatWidget() }, [muatStat, muatWidget])
  useEffect(() => { muatGrafik(chartRange) }, [muatGrafik, chartRange])

  const KARTU = 'bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] shadow-sm rounded-2xl'

  const kartu = [
    { label: t('Total Produk', 'Total Products'),        value: angka(statProduk),      desc: t('Item terdaftar', 'Registered items'),               Icon: Pill,          chip: 'bg-[var(--surface-2)] text-[var(--brand-soft)]' },
    { label: t('Transaksi Hari Ini', 'Sales Today'),     value: angka(statTrxHariIni),  desc: t('Penjualan hari ini', "Today's sales"),              Icon: ShoppingCart,  chip: 'bg-[var(--surface-2)] text-[var(--brand-soft)]' },
    { label: t('Expired ≤ 60 Hari', 'Expiring ≤ 60 Days'), value: angka(statExpired),   desc: t('Batch mendekati / lewat exp', 'Batches near / past expiry'), Icon: CalendarClock, chip: 'bg-[var(--accent-soft)] text-[var(--accent)]' },
    { label: t('Omzet Hari Ini', 'Revenue Today'),       value: rupiah(statOmzet),      desc: t('Total penjualan', 'Total sales'),                   Icon: Wallet,        chip: 'bg-[var(--surface-2)] text-[var(--accent)]' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Beranda', 'Home')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-8">
        {t('Halo', 'Hello')}, <span className="font-semibold text-[var(--ink)]">{app.settingsData.nama_apoteker || app.authName || t('Apoteker', 'Pharmacist')}</span>
        {' '}👋, {t('ringkasan aktivitas hari ini', "today's activity summary")}
      </p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {kartu.map((s, i) => (
          <div key={i} className={`${KARTU} p-4 sm:p-5 flex flex-col aspect-square xl:aspect-auto`}>
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${s.chip}`}>
              <s.Icon size={19} strokeWidth={1.9} />
            </div>
            <div className="mt-auto pt-3">
              <p className="text-[10.5px] sm:text-xs text-[var(--ink-soft)] font-medium uppercase tracking-wide mb-1 leading-tight">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-[var(--ink)] leading-tight break-words num">{s.value}</p>
              <p className="text-[11px] text-[var(--ink-faint)] mt-1.5 leading-tight">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className={`${KARTU} lg:col-span-2 p-5`}>
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h3 className="font-bold text-[var(--ink)]">
                {chartRange === '7d' ? t('Penjualan 7 Hari Terakhir', 'Sales, Last 7 Days') : t('Penjualan 30 Hari Terakhir', 'Sales, Last 30 Days')}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--brand-soft)]" />{t('Omzet', 'Revenue')}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="inline-block w-4 h-0.5 rounded bg-[var(--accent)]" />{t('Transaksi', 'Transactions')}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-lg font-bold text-[var(--brand)] leading-none num">
                {rupiah(salesChart.reduce((a, b) => a + (b.value || 0), 0))}
              </p>
              <div className="inline-flex rounded-lg bg-[var(--paper)] p-0.5 text-xs font-medium">
                {(['7d', '30d'] as const).map(r => (
                  <button key={r} onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 rounded-md transition-all ${chartRange === r ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}>
                    {r === '7d' ? t('7 Hari', '7 Days') : t('30 Hari', '30 Days')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Grafik data={salesChart} range={chartRange} />
        </div>

        <div className={`${KARTU} p-5`}>
          <h3 className="font-bold text-[var(--ink)] mb-1">{t('Produk Terlaris', 'Best Sellers')}</h3>
          <p className="text-xs text-[var(--ink-faint)] mb-4">{t('30 hari terakhir', 'Last 30 days')}</p>
          {bestSellers.length === 0 ? (
            <p className="text-center text-xs text-[var(--ink-faint)] py-8">{t('Belum ada penjualan', 'No sales yet')}</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((b: any, i: number) => {
                const maxQty = bestSellers[0].qty || 1
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[var(--ink)] truncate pr-2">{i + 1}. {b.nama}</span>
                      <span className="text-[var(--ink-soft)] shrink-0 num">{angka(b.qty)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--paper)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--brand-soft)]" style={{ width: `${Math.max(6, (b.qty / maxQty) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className={`${KARTU} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><Pill size={16} /></div>
            <h3 className="font-bold text-[var(--ink)]">{t('Stok Minim', 'Low Stock')}</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-center text-xs text-[var(--ink-faint)] py-6">{t('Semua stok aman 👍', 'All stock is healthy 👍')}</p>
          ) : (
            <div className="space-y-1.5">
              {lowStock.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--line-soft)] last:border-0">
                  <span className="text-[var(--ink)] truncate pr-2">{p.nama_obat}</span>
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 num">
                    {angka(p.stok_total)} / {angka(p.stok_minimum)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${KARTU} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center"><CalendarClock size={16} /></div>
            <h3 className="font-bold text-[var(--ink)]">{t('Segera Expired (≤60 hari)', 'Expiring Soon (≤60 days)')}</h3>
          </div>
          {expiringSoon.length === 0 ? (
            <p className="text-center text-xs text-[var(--ink-faint)] py-6">{t('Tidak ada batch mendekati expired', 'No batches nearing expiry')}</p>
          ) : (
            <div className="space-y-1.5">
              {expiringSoon.map((b: any, i: number) => {
                const days = Math.ceil((new Date(b.expired_date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--line-soft)] last:border-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-[var(--ink)] truncate">{b.products?.nama_obat}</p>
                      <p className="text-[10px] text-[var(--ink-faint)]">
                        {t('Batch', 'Batch')} {b.batch_number || '-'} · {t('sisa', 'qty')} {angka(b.stok_batch)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full num ${days <= 0 ? 'bg-red-200 text-red-800' : days <= 30 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                      {days <= 0 ? t('Expired', 'Expired') : `${days} ${t('hari', 'days')}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${KARTU} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center"><Receipt size={16} /></div>
              <h3 className="font-bold text-[var(--ink)]">{t('Jatuh Tempo', 'Invoices Due')}</h3>
            </div>
            {dueInvoices.length > 0 && (
              <Link href="/faktur" className="text-xs font-medium text-[var(--brand)] hover:underline">{t('Semua', 'All')}</Link>
            )}
          </div>
          {dueInvoices.length === 0 ? (
            <p className="text-center text-xs text-[var(--ink-faint)] py-6">{t('Tidak ada tagihan 👍', 'No invoices due 👍')}</p>
          ) : (
            <div className="space-y-1.5">
              {dueInvoices.map((f: any, i: number) => {
                const days = Math.ceil((new Date(f.tanggal_jatuh_tempo).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
                const badge = days < 0 ? 'bg-red-200 text-red-800' : days <= 7 ? 'bg-red-50 text-red-600' : days <= 14 ? 'bg-yellow-50 text-yellow-700' : 'bg-[var(--paper)] text-[var(--brand-soft)]'
                return (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--line-soft)] last:border-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-[var(--ink)] truncate">{f.suppliers?.nama_supplier || '-'}</p>
                      <p className="text-[10px] text-[var(--ink-faint)] num">{rupiah(f.total)}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap num ${badge}`}>
                      {days < 0 ? `${t('Telat', 'Late')} ${Math.abs(days)}${t('h', 'd')}` : days === 0 ? t('Hari ini', 'Today') : `${days} ${t('hari', 'days')}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Grafik omzet (batang) dan jumlah transaksi (garis) dalam satu bidang.
 *
 * Digambar langsung sebagai SVG, bukan lewat pustaka grafik: satu-satunya
 * grafik di aplikasi ini, dan menambah pustaka untuk itu berarti menambah
 * ratusan kilobita ke halaman yang paling sering dibuka.
 */
function Grafik({ data: masuk, range }: { data: Titik[]; range: '7d' | '30d' }) {
  const fallbackN = range === '30d' ? 30 : 7
  const data: Titik[] = masuk.length ? masuk : Array.from({ length: fallbackN }, () => ({ label: '', day: '', value: 0, count: 0 }))
  const n = data.length
  const dense = n > 10
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const maxCnt = Math.max(...data.map(d => d.count), 1)

  const W = 340, H = 150, PL = 34, PR = 24, PT = 16, PB = 24
  const plotW = W - PL - PR, plotH = H - PT - PB, baseY = PT + plotH
  const slot = plotW / n
  const cx = (i: number) => PL + slot * i + slot / 2
  const barW = Math.max(3, slot * (dense ? 0.62 : 0.5))
  const lineY = (c: number) => baseY - (c / maxCnt) * plotH

  // Catmull-Rom ke Bezier: garisnya melengkung halus, bukan patah di tiap titik.
  const pts = data.map((d, i) => ({ x: cx(i), y: lineY(d.count) }))
  const smooth = (p: { x: number; y: number }[]) => {
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
  const linePath = smooth(pts)
  const lineLen = 900
  const fmtRp = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}jt` : v >= 1e3 ? `${Math.round(v / 1e3)}rb` : `${v}`

  return (
    <svg key={range} viewBox={`0 0 ${W} ${H}`} className="w-full h-48 sw-chart" role="img"
      aria-label={`Grafik penjualan ${range === '7d' ? '7' : '30'} hari terakhir`}>
      <defs>
        <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((g, i) => {
        const y = baseY - g * plotH
        return (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="var(--line-soft)" strokeWidth="1" />
            <text x={PL - 5} y={y + 3} textAnchor="end" fontSize="7.5" fill="var(--ink-faint)">{fmtRp(maxVal * g)}</text>
          </g>
        )
      })}

      {[0, 1].map((g, i) => (
        <text key={'r' + i} x={W - PR + 5} y={baseY - g * plotH + 3} textAnchor="start" fontSize="7.5" fill="var(--accent)">
          {Math.round(maxCnt * g)}
        </text>
      ))}

      {data.map((d, i) => {
        const h = (d.value / maxVal) * plotH
        return (
          <rect className="sw-bar" key={'b' + i} x={cx(i) - barW / 2} y={baseY - h} width={barW} height={Math.max(0, h)}
            rx={Math.min(3, barW / 2)} fill="url(#salesBar)"
            style={{ transformOrigin: `center ${baseY}px`, animationDelay: `${i * 0.04}s` }} />
        )
      })}

      <path className="sw-chart-line" d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: lineLen, strokeDashoffset: lineLen }} />

      {!dense && data.map((d, i) => (
        <g key={'p' + i}>
          <circle className="sw-chart-dot" cx={cx(i)} cy={lineY(d.count)} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"
            style={{ animationDelay: `${0.6 + i * 0.06}s` }} />
          {d.count > 0 && (
            <text className="sw-chart-dot" x={cx(i)} y={lineY(d.count) - 7} textAnchor="middle" fontSize="8" fontWeight="700"
              fill="var(--accent)" style={{ animationDelay: `${0.7 + i * 0.06}s` }}>{d.count}</text>
          )}
        </g>
      ))}

      {data.map((d, i) => d.label
        ? <text key={'t' + i} x={cx(i)} y={H - 7} textAnchor="middle" fontSize="8.5" fill="var(--ink-faint)">{d.label}</text>
        : null)}
    </svg>
  )
}
