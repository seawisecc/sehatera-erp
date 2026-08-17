'use client'

import { useEffect } from 'react'
import {
  ShoppingCart, ClipboardList, Receipt, BarChart2, Database,
  Users, ShieldCheck, Pill, Truck, CalendarClock, Wallet, ArrowRight,
  Wand2, TrendingUp, Languages, LayoutDashboard, Settings, Menu
} from 'lucide-react'
import { Mark } from '../../components/Logo'
import DaftarPaket from '../../components/DaftarPaket'
import { useLang, LangToggle } from '../../lib/i18n'

const CSS = `
:root { --sw-green:#1e3a2c; --sw-rust:#c2632f; --sw-ink:#1c2620; }
.kn-ambient {
  background:
    radial-gradient(1100px 560px at 8% -8%, #d9e4d3 0%, rgba(217,228,211,0) 55%),
    radial-gradient(1000px 520px at 102% -4%, #f1ded0 0%, rgba(241,222,208,0) 52%),
    radial-gradient(900px 720px at 104% 60%, #e7d4c2 0%, rgba(231,212,194,0) 55%),
    #f3f1ea;
}
.kn-dark { background: linear-gradient(160deg,#16281d 0%,#1e3a2c 45%,#3a3320 100%); }
.reveal { opacity:0; transform: translateY(30px); transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1); }
.reveal.in { opacity:1; transform:none; }
.kn-nav { backdrop-filter: saturate(160%) blur(12px); -webkit-backdrop-filter: saturate(160%) blur(12px); }
.kn-win { box-shadow: 0 40px 90px -30px rgba(20,40,29,.55); }
.kn-headline { letter-spacing:-0.02em; line-height:1.02; }
@media (prefers-reduced-motion: reduce){ .reveal{ opacity:1; transform:none; transition:none; } }

/* ── Device showcase (MacBook Pro + iPhone Pro) ── */
.dev-stage{ position:relative; max-width:720px; margin:0 auto; padding-bottom:1%; }
.macbook{ position:relative; width:80%; }
.mb-lid{ background:#0a0b0d; border:1px solid #34373c; border-radius:11px 11px 5px 5px; padding:0.85% 0.85% 1.5%; box-shadow:0 46px 86px -32px rgba(20,40,29,.5); }
.mb-cam{ display:block; width:4px; height:4px; margin:0 auto 0.6%; border-radius:50%; background:#141619; box-shadow:inset 0 0 0 1px #2c2f34; }
.mb-screen{ border-radius:5px; overflow:hidden; background:#0f1a14; aspect-ratio:16/10.2; }
.mb-deck{ position:relative; width:113%; margin-left:-6.5%; height:clamp(11px,2.1vw,22px); background:linear-gradient(180deg,#4a4d53 0%,#303338 42%,#191a1d 100%); border-radius:3px 3px 11px 11px; box-shadow:0 22px 30px -14px rgba(20,40,29,.34); }
.mb-deck::before{ content:''; position:absolute; left:0; right:0; top:0; height:1.5px; background:rgba(255,255,255,.22); border-radius:3px 3px 0 0; }
.mb-groove{ position:absolute; top:0; left:50%; transform:translateX(-50%); width:13%; height:46%; background:#141619; border-radius:0 0 9px 9px; }
.iphone{ position:absolute; right:0; bottom:-9%; width:22.5%; min-width:134px; background:linear-gradient(150deg,#3b3e43 0%,#141518 62%); border-radius:26px; padding:1.4%; box-shadow:0 38px 62px -18px rgba(20,40,29,.55); z-index:5; }
.iphone-inner{ position:relative; background:#e9ede7; border-radius:22px; overflow:hidden; aspect-ratio:9/19.5; }
.ip-island{ position:absolute; z-index:6; top:3.4%; left:50%; transform:translateX(-50%); width:30%; height:3%; background:#000; border-radius:20px; }
.ip-side{ position:absolute; background:#25272b; border-radius:2px; }
.ip-pw{ right:-2px; top:27%; width:2.5px; height:12%; }
.ip-cam{ right:-2px; top:43%; width:2.5px; height:7%; }
.ip-v1{ left:-2px; top:23%; width:2.5px; height:6%; }
.ip-v2{ left:-2px; top:32%; width:2.5px; height:9%; }
.ip-v3{ left:-2px; top:44%; width:2.5px; height:9%; }
@media (max-width:560px){ .macbook{ width:90%; } .iphone{ width:30%; right:-4%; bottom:-11%; } }
`

// Mini mockup jendela aplikasi (memakai tema asli)
function AppWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="kn-win rounded-2xl overflow-hidden border border-black/5 bg-[var(--surface)]/80 backdrop-blur-sm w-full">
      <div className="h-9 flex items-center gap-2 px-4 bg-[var(--paper)] border-b border-black/5">
        <span className="w-3 h-3 rounded-full bg-[var(--brand-soft)]" />
        <span className="w-3 h-3 rounded-full bg-[var(--accent)]" />
        <span className="w-3 h-3 rounded-full bg-[var(--brand-soft)]" />
      </div>
      <div className="flex min-h-[240px]">
        <div className="w-16 sm:w-20 shrink-0 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-hover)] flex flex-col items-center py-4 gap-4">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface)]/10 flex items-center justify-center"><Mark size={16} variant="mono" className="text-[var(--on-brand)]" /></div>
          {[Pill, ShoppingCart, ClipboardList, BarChart2].map((I, i) => <I key={i} size={16} className="text-[var(--on-brand-soft)]" />)}
        </div>
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  )
}


// Recreation Dashboard (di dalam layar MacBook) + Kasir mobile (di dalam iPhone)
function DeviceShowcase({ t }: { t: (id: string, en: string) => string }) {
  const nav = [
    [LayoutDashboard, t('Dashboard', 'Dashboard'), true],
    [Pill, t('Produk & Stok', 'Products & Stock'), false],
    [ShoppingCart, t('Kasir', 'Sales'), false],
    [Wand2, t('Pembelian', 'Purchasing'), false],
    [Receipt, t('Pembayaran Faktur', 'Invoice Payments'), false],
    [BarChart2, t('Laporan', 'Reports'), false],
    [Settings, t('Pengaturan', 'Settings'), false],
  ] as const
  const stats = [
    [Pill, 'bg-[var(--surface-2)] text-[var(--brand-soft)]', t('TOTAL PRODUK', 'TOTAL PRODUCTS'), '100'],
    [ShoppingCart, 'bg-[var(--surface-2)] text-[var(--brand-soft)]', t('PENJUALAN HARI INI', 'SALES TODAY'), '3'],
    [CalendarClock, 'bg-[var(--accent-soft)] text-[var(--accent)]', t('EXPIRED ≤60 HARI', 'EXPIRING ≤60 DAYS'), '3'],
    [Wallet, 'bg-[var(--surface-2)] text-[var(--accent)]', t('OMZET HARI INI', 'REVENUE TODAY'), 'Rp 10.095.000'],
  ] as const
  const sellers: [string, number][] = [['Sarung Tangan Latex (M)', 160], ['Tolak Angin Cair 15 ml', 10], ['Simvastatin 20 mg', 10], ['Konidin Tablet', 10]]
  const bars = [3, 3, 3, 3, 3, 2, 62]
  const cashItems: [string, string, string][] = [
    ['Sanmol Tablet 500 mg', 'Paracetamol · Stock: 300', 'Rp 3.000'],
    ['Panadol Regular Caplet', 'Paracetamol · Stock: 240', 'Rp 11.000'],
    ['Bodrex Tablet', 'Paracetamol + Caffeine · Stock: 500', 'Rp 5.500'],
    ['Darlie Routines Flu & Batuk', 'Paracetamol + Herbal · Stock: 200', 'Rp 4.800'],
  ]
  return (
    <div className="dev-stage">
      {/* MacBook Pro */}
      <div className="macbook">
        <div className="mb-lid">
          <span className="mb-cam" />
          <div className="mb-screen">
          <div className="flex h-full text-[var(--ink)] bg-[var(--surface-3)]">
            {/* Sidebar */}
            <div className="w-[24%] shrink-0 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-hover)] px-[3%] py-[3.5%] flex flex-col">
              <div className="flex items-center gap-1.5 mb-[8%]">
                <div className="w-[18%] aspect-square rounded-md bg-[var(--surface)]/10 flex items-center justify-center"><Mark size={12} variant="mono" className="text-[var(--on-brand)] w-1/2 h-1/2" /></div>
                <div className="leading-none"><div className="text-white font-bold text-[0.62vw] sm:text-[0.6vw]" style={{ fontSize: 'clamp(6px,0.85vw,11px)' }}>Sehatera</div><div className="text-[var(--on-brand-soft)]" style={{ fontSize: 'clamp(5px,0.7vw,9px)' }}>by Seawise Studio</div></div>
              </div>
              <div className="rounded-md bg-[var(--surface)]/10 text-white/90 px-2 py-1 mb-[7%] truncate" style={{ fontSize: 'clamp(5px,0.75vw,10px)' }}>Apotek Rakyat Sejahtera</div>
              <div className="space-y-[4%]">
                {nav.map(([Ic, label, active], i) => (
                  <div key={i} className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${active ? 'bg-[var(--surface)]/12 text-white' : 'text-[var(--on-brand-soft)]'}`} style={{ fontSize: 'clamp(5px,0.78vw,10px)' }}>
                    <Ic className="w-[11px] h-[11px] shrink-0" /> <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Main */}
            <div className="flex-1 min-w-0 px-[3.2%] py-[2.8%] flex flex-col overflow-hidden">
              <p className="font-bold text-[var(--ink)] leading-none shrink-0" style={{ fontSize: 'clamp(11px,1.7vw,24px)' }}>Dashboard</p>
              <p className="text-[var(--ink-soft)] mt-1 mb-[3%] shrink-0" style={{ fontSize: 'clamp(6px,0.78vw,11px)' }}>Hello, apt. Anessa Beckham 👋, {t('ringkasan aktivitas apotek', "today's pharmacy summary")}</p>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-[2.2%] mb-[3%] shrink-0">
                {stats.map(([Ic, chip, label, val], i) => (
                  <div key={i} className="bg-[var(--surface)]/80 border border-white/70 rounded-lg px-[8%] py-[7%]">
                    <div className={`rounded-md flex items-center justify-center mb-[12%] ${chip}`} style={{ width: 'clamp(14px,1.7vw,28px)', height: 'clamp(14px,1.7vw,28px)' }}><Ic className="w-1/2 h-1/2" /></div>
                    <p className="text-[var(--ink-soft)] uppercase tracking-wide leading-tight" style={{ fontSize: 'clamp(4.5px,0.6vw,8px)' }}>{label}</p>
                    <p className="font-bold text-[var(--ink)] leading-tight mt-0.5" style={{ fontSize: 'clamp(7px,1vw,14px)' }}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Chart + Best sellers */}
              <div className="grid grid-cols-3 gap-[2.2%] flex-1 min-h-0">
                <div className="col-span-2 bg-[var(--surface)]/80 border border-white/70 rounded-lg p-[3.2%] flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-[2%] shrink-0">
                    <div>
                      <p className="font-bold text-[var(--ink)]" style={{ fontSize: 'clamp(6px,0.85vw,12px)' }}>Sales, Last 7 Days</p>
                      <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: 'clamp(4.5px,0.62vw,8px)' }}><span className="text-[var(--brand-soft)]">● Revenue</span><span className="text-[var(--accent)]">━ Transactions</span></div>
                    </div>
                    <p className="font-bold text-[var(--brand)]" style={{ fontSize: 'clamp(6px,0.9vw,13px)' }}>Rp 10.095.000</p>
                  </div>
                  <svg viewBox="0 0 260 92" preserveAspectRatio="xMidYMid meet" className="w-full flex-1 min-h-0">
                    {[0, 0.5, 1].map((g, i) => <line key={i} x1="8" x2="252" y1={78 - g * 62} y2={78 - g * 62} stroke="#eceae3" strokeWidth="1" />)}
                    {bars.map((h, i) => { const bh = (h / 62) * 62; return <rect key={i} x={14 + i * 34} y={78 - bh} width="17" height={bh} rx="3" fill="#1e3a2c" /> })}
                    <path d="M22,75 L56,75 L90,75 L124,75 L158,75 L192,77 L226,16" fill="none" stroke="#c2632f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    {[[22, 75], [56, 75], [90, 75], [124, 75], [158, 75], [192, 77], [226, 16]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="#fff" stroke="#c2632f" strokeWidth="1.8" />)}
                  </svg>
                </div>
                <div className="bg-[var(--surface)]/80 border border-white/70 rounded-lg p-[6%] min-h-0 overflow-hidden">
                  <p className="font-bold text-[var(--ink)] mb-[9%]" style={{ fontSize: 'clamp(6px,0.85vw,12px)' }}>Best Sellers</p>
                  <div className="space-y-[10%]">
                    {sellers.map(([nm, q], i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[var(--ink)] mb-0.5" style={{ fontSize: 'clamp(4.5px,0.6vw,8px)' }}><span className="truncate pr-1">{i + 1}. {nm}</span><span>{q}</span></div>
                        <div className="h-[3px] rounded-full bg-[var(--paper)]"><div className="h-full rounded-full bg-[var(--brand-soft)]" style={{ width: `${Math.max(8, (q / 160) * 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <div className="mb-deck"><span className="mb-groove" /></div>
      </div>

      {/* iPhone Pro, Kasir mobile */}
      <div className="iphone">
        <span className="ip-island" />
        <span className="ip-side ip-pw" /><span className="ip-side ip-cam" />
        <span className="ip-side ip-v1" /><span className="ip-side ip-v2" /><span className="ip-side ip-v3" />
        <div className="iphone-inner">
          <div className="bg-[var(--brand)] text-[var(--on-brand)] flex items-center gap-1.5 px-[6%] pt-[14%] pb-[5%]"><Menu className="w-3 h-3" /> <span style={{ fontSize: 'clamp(6px,1.4vw,11px)' }}>Apotek Sejahtera</span></div>
          <div className="px-[6%] py-[5%]">
            <p className="font-bold text-[var(--ink)]" style={{ fontSize: 'clamp(9px,2vw,15px)' }}>Cashier</p>
            <p className="text-[var(--ink-soft)] mb-[5%]" style={{ fontSize: 'clamp(5px,1.1vw,9px)' }}>Medicine sales transactions</p>
            <div className="bg-[var(--surface)]/80 border border-white/70 rounded-lg p-[4%]">
              <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 mb-[4%] text-[var(--ink)]" style={{ fontSize: 'clamp(6px,1.3vw,10px)' }}>Para</div>
              {cashItems.map(([nm, sub, pr], i) => (
                <div key={i} className="flex items-center justify-between py-[3%] border-b border-[var(--line-soft)] last:border-0">
                  <div className="min-w-0 pr-1"><p className="text-[var(--ink)] truncate" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}>{nm}</p><p className="text-[var(--ink-faint)] truncate" style={{ fontSize: 'clamp(4.5px,0.95vw,8px)' }}>{sub}</p></div>
                  <span className="text-[var(--ink)] shrink-0" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}>{pr}</span>
                </div>
              ))}
            </div>
            <div className="bg-[var(--surface)]/80 border border-white/70 rounded-lg p-[5%] mt-[5%]">
              <p className="font-bold text-[var(--ink)] mb-[5%]" style={{ fontSize: 'clamp(6px,1.4vw,11px)' }}>Transaction Summary</p>
              <div className="flex justify-between text-[var(--ink-soft)] mb-1" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}><span>Total Items</span><span>0 items</span></div>
              <div className="flex justify-between font-semibold text-[var(--ink)] border-t border-[var(--line-soft)] pt-1" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}><span>Total</span><span>Rp 0</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Kenapa() {
  const { t } = useLang()
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
    }, { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const spotlights = [
    { tag: t('DASHBOARD ANALITIK', 'ANALYTICS DASHBOARD'), title: t('Kondisi apotek, dalam sekali pandang.', 'Your whole pharmacy, at a glance.'), body: t('Grafik penjualan interaktif, batang omzet dipadu garis jumlah transaksi, bisa ganti rentang 7 atau 30 hari. Di bawahnya: produk terlaris, stok yang menipis, barang segera expired, dan tagihan yang akan jatuh tempo. Semua real-time, tanpa perlu buka laporan.', 'An interactive sales chart, revenue bars paired with a transaction-count line, switchable between 7 or 30 days. Below it: best sellers, low stock, items expiring soon, and invoices coming due. All real-time, no report needed.'), Icon: TrendingUp,
      visual: (<AppWindow><div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[[t('Omzet','Revenue'),'Rp8,4jt','bg-[var(--surface-2)] text-[var(--accent)]'],[t('Transaksi','Sales'),'87','bg-[var(--surface-2)] text-[var(--brand-soft)]'],[t('Produk','Products'),'1.240','bg-[var(--surface-2)] text-[var(--brand-soft)]']].map((c,i)=>(<div key={i} className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] uppercase tracking-wide">{c[0]}</p><p className="text-[11px] font-bold text-[var(--ink)]">{c[1]}</p></div>))}
        </div>
        <div className="rounded-lg border border-[var(--line-soft)] p-2.5">
          <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-semibold text-[var(--ink)]">{t('Penjualan 7 Hari','Sales, 7 Days')}</span><div className="flex gap-1.5 text-[7px]"><span className="text-[var(--brand-soft)]">▉ {t('Omzet','Revenue')}</span><span className="text-[var(--accent)]">━ {t('Transaksi','Trx')}</span></div></div>
          <svg viewBox="0 0 240 74" className="w-full">
            {[24,40,32,54,46,66,58].map((h,i)=>(<rect key={i} x={12+i*32} y={68-h} width="16" height={h} rx="3" fill="#1e3a2c" />))}
            <path d="M20,42 C36,34 40,32 52,30 C68,27 72,40 84,38 C100,35 104,24 116,22 C132,20 136,32 148,30 C164,27 168,16 180,15 C196,14 200,22 212,24" fill="none" stroke="#c2632f" strokeWidth="2.4" strokeLinecap="round" />
            {[[20,42],[52,30],[84,38],[116,22],[148,30],[180,15],[212,24]].map((p,i)=>(<circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill="#fff" stroke="#c2632f" strokeWidth="1.8" />))}
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] mb-0.5">{t('Stok Minim','Low Stock')}</p><p className="text-[10px] text-[var(--ink)]">Amoxicillin <span className="text-red-500 font-semibold">2/10</span></p></div>
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] mb-0.5">{t('Jatuh Tempo','Due')}</p><p className="text-[10px] text-[var(--ink)]">PBF Sehat <span className="text-amber-600 font-semibold">3 {t('hari','d')}</span></p></div>
        </div>
      </div></AppWindow>) },
    { tag: t('ORDER TERPANDU', 'GUIDED ORDER'), title: t('Restok otomatis. PO terpecah sendiri.', 'Auto-restock. POs split themselves.'), body: t('Satu klik, sistem mengumpulkan semua barang yang mencapai stok minimum, menyarankan jumlah order, lalu otomatis membagi ke distributor masing-masing. Tinggal review, order langsung terpecah menjadi PO per supplier, siap kirim. Tak perlu lagi cek kartu stok satu per satu.', 'One click, the system gathers every item at minimum stock, suggests order quantities, then auto-assigns each to its distributor. Just review, the order splits into a PO per supplier, ready to send. No more checking stock cards one by one.'), Icon: Wand2,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">{[t('Pilih','Select'),t('Bagi','Assign'),t('Buat','Create')].map((s,i)=>(<div key={i} className="flex items-center gap-1.5 flex-1"><span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${i===0?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>{i+1}</span><span className="text-[8px] text-[var(--ink-soft)]">{s}</span>{i<2&&<div className="flex-1 h-px bg-[var(--line-soft)]" />}</div>))}</div>
        {[['Amoxicillin 500','2/10','PBF Sehat'],['Paracetamol','5/20','PBF Sehat'],['Vitamin C','3/15','PT Kimia']].map((r,i)=>(<div key={i} className="flex items-center justify-between text-[10px] rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5"><span className="text-[var(--ink)]">{r[0]}</span><span className="text-red-500">{r[1]}</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--brand-soft)]">{r[2]}</span></div>))}
        <div className="text-[9px] text-center text-[var(--brand-soft)] font-medium">→ 2 PO {t('siap kirim','ready to send')}</div>
      </div></AppWindow>) },
    { tag: t('KASIR & KEPATUHAN', 'POS & COMPLIANCE'), title: t('Jual cepat, tetap patuh aturan.', 'Sell fast, stay compliant.'), body: t('Kasir ringan dengan metode bayar Tunai, QRIS, Transfer. Untuk obat Narkotika, Psikotropika & Prekursor, data pasien dan nomor resep wajib terisi otomatis, tercatat rapi untuk pelaporan.', 'A light POS with Cash, QRIS, and Transfer payments. For Narcotics, Psychotropics & Precursors, patient data and prescription number are required automatically, neatly recorded for reporting.'), Icon: ShoppingCart,
      visual: (<AppWindow><div className="space-y-2"><div className="h-8 rounded-lg bg-[var(--surface-2)] flex items-center px-3 text-xs text-[var(--ink-faint)]">Cari obat…</div><div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">⚠ Narkotika, isi data pasien & resep</div><div className="grid grid-cols-3 gap-1.5">{['Tunai','QRIS','Transfer'].map(m=><div key={m} className="text-[10px] text-center py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)]">{m}</div>)}</div></div></AppWindow>) },
    { tag: t('STOK & EXPIRED', 'STOCK & EXPIRY'), title: t('Tak ada lagi obat kadaluarsa terbuang.', 'No more expired medicine wasted.'), body: t('Pantau batch & tanggal expired, dapat peringatan dini, lalu tindak lanjuti: musnahkan dengan Berita Acara resmi atau retur ke supplier, stok berkurang hanya setelah dikonfirmasi.', 'Track batches & expiry dates, get early alerts, then follow up: destroy with an official report or return to supplier, stock is only reduced after confirmation.'), Icon: CalendarClock,
      visual: (<AppWindow><table className="w-full text-[11px]"><thead><tr className="text-[var(--ink-faint)]"><th className="text-left font-medium pb-1">Batch</th><th className="text-left font-medium pb-1">Exp</th><th className="text-right font-medium pb-1">Aksi</th></tr></thead><tbody>{[['BT-2401','30 hari','#dc2626'],['BT-2312','≤60 hari','#b45309'],['BT-2408','Aman','#16a34a']].map((r,i)=>(<tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-1.5 font-mono text-[var(--ink)]">{r[0]}</td><td className="py-1.5" style={{color:r[2]}}>{r[1]}</td><td className="py-1.5 text-right"><span className="text-[10px] px-2 py-0.5 rounded bg-[var(--brand)] text-[var(--on-brand)]">Tindak Lanjut</span></td></tr>))}</tbody></table></AppWindow>) },
    { tag: t('LAPORAN SIPNAP', 'SIPNAP REPORT'), title: t('Laporan SIPNAP, otomatis.', 'SIPNAP reports, automated.'), body: t('Narkotika, Psikotropika, dan Prekursor per periode, penerimaan dari pembelian, pengeluaran lengkap dengan data pasien & resep, siap cetak dengan tanda tangan Apoteker Penanggung Jawab. Hemat berjam-jam kerja manual.', 'Narcotics, Psychotropics, and Precursors per period, receipts from purchases, dispensing complete with patient & prescription data, ready to print with the Responsible Pharmacist signature. Save hours of manual work.'), Icon: BarChart2,
      visual: (<AppWindow><div className="text-center"><p className="text-[11px] font-bold text-[var(--ink)]">LAPORAN PENGGUNAAN NARKOTIKA</p><p className="text-[9px] text-[var(--ink-faint)] mb-2">Periode: Bulan berjalan</p><div className="border border-[var(--line)] rounded"><div className="grid grid-cols-4 text-[8px] bg-[var(--surface-2)] text-[var(--ink-soft)]"><span className="p-1 border-r border-[var(--line)]">Sediaan</span><span className="p-1 border-r border-[var(--line)]">Masuk</span><span className="p-1 border-r border-[var(--line)]">Keluar</span><span className="p-1">Sisa</span></div>{[['Codein 10mg','20','5','15'],['Pethidin 50ml','10','2','8']].map((r,i)=>(<div key={i} className="grid grid-cols-4 text-[8px] border-t border-[var(--line-soft)]">{r.map((c,j)=><span key={j} className={`p-1 ${j<3?'border-r border-[var(--line-soft)]':''}`}>{c}</span>)}</div>))}</div></div></AppWindow>) },
    { tag: t('PEMBELIAN & KEUANGAN', 'PURCHASING & FINANCE'), title: t('Pembelian sampai bayar faktur, terpantau.', 'From purchasing to invoice payment, all tracked.'), body: t('Buat PO ke supplier, terima barang beserta batch & faktur, lalu kelola pembayaran faktur, diurutkan berdasarkan jatuh tempo, dengan pengingat yang lewat tempo dan bukti pembayaran yang bisa dicetak.', 'Create POs to suppliers, receive goods with batches & invoices, then manage invoice payments, sorted by due date, with overdue reminders and printable payment receipts.'), Icon: Receipt,
      visual: (<AppWindow><div className="space-y-1.5">{[['INV/0087','Jatuh tempo 3 hari','#b45309'],['INV/0091','Terlambat','#dc2626'],['INV/0080','Lunas','#16a34a']].map((r,i)=>(<div key={i} className="flex items-center justify-between text-[11px] bg-[var(--surface)]/70 border border-[var(--line-soft)] rounded-lg px-3 py-2"><span className="font-mono text-[var(--ink)]">{r[0]}</span><span style={{color:r[2]}}>{r[1]}</span></div>))}</div></AppWindow>) },
    { tag: t('ONBOARDING', 'ONBOARDING'), title: t('Pindah data lama? Cukup satu klik.', 'Migrating old data? Just one click.'), body: t('Unduh template, isi di Excel, upload CSV, daftar produk, supplier, stok awal, hingga saldo hutang langsung masuk. Client baru bisa langsung jalan tanpa input manual berhari-hari.', 'Download a template, fill it in Excel, upload the CSV, products, suppliers, opening stock, even outstanding debts come straight in. New clients get running without days of manual entry.'), Icon: Database,
      visual: (<AppWindow><div className="grid grid-cols-2 gap-2">{['Produk','Supplier','Stok Awal','Faktur Awal'].map((t,i)=>(<div key={i} className="rounded-lg border border-[var(--line)] p-2.5"><Database size={14} className="text-[var(--brand-soft)] mb-1"/><p className="text-[11px] font-semibold text-[var(--ink)]">{t}</p><p className="text-[9px] text-[var(--ink-faint)]">Template + Upload CSV</p></div>))}</div></AppWindow>) },
  ]

  const grid = [
    { Icon: TrendingUp, title: t('Dashboard Analitik', 'Analytics Dashboard'), d: t('Grafik penjualan, produk terlaris, stok minim & jatuh tempo.', 'Sales chart, best sellers, low stock & due invoices.') },
    { Icon: ShoppingCart, title: t('Kasir & Struk', 'POS & Receipts'), d: t('POS cepat, multi metode bayar, penjualan resep.', 'Fast POS, multiple payment methods, prescription sales.') },
    { Icon: Pill, title: t('Produk & Stok', 'Products & Stock'), d: t('Katalog, harga, margin, batch, expired + filter kolom.', 'Catalog, prices, margins, batches, expiry + column filters.') },
    { Icon: Wand2, title: t('Order Terpandu', 'Guided Order'), d: t('Restok otomatis, PO terpecah per distributor.', 'Auto-restock, POs split per distributor.') },
    { Icon: Truck, title: t('Supplier & PO', 'Suppliers & PO'), d: t('Kelola supplier dan purchase order.', 'Manage suppliers and purchase orders.') },
    { Icon: Receipt, title: t('Pembayaran Faktur', 'Invoice Payments'), d: t('Hutang supplier, jatuh tempo, bukti bayar.', 'Supplier debts, due dates, payment receipts.') },
    { Icon: ClipboardList, title: t('Tindak Lanjut Expired', 'Expired Follow-up'), d: t('Musnahkan (Berita Acara) & retur supplier.', 'Destruction (official report) & supplier returns.') },
    { Icon: BarChart2, title: t('Laporan & SIPNAP', 'Reports & SIPNAP'), d: t('Penjualan, rekap metode bayar & laporan wajib.', 'Sales, payment-method recap & mandatory reports.') },
    { Icon: Users, title: t('Pengguna & Role', 'Users & Roles'), d: t('Akun tim dengan hak akses per modul.', 'Team accounts with per-module access.') },
    { Icon: ShieldCheck, title: t('Data Aman & Terpisah', 'Secure & Isolated Data'), d: t('Tiap apotek terisolasi di level database.', 'Each pharmacy isolated at the database level.') },
    { Icon: Languages, title: t('Dwibahasa ID / EN', 'Bilingual ID / EN'), d: t('Ganti bahasa seluruh aplikasi seketika.', 'Switch the entire app language instantly.') },
    { Icon: Database, title: t('Migrasi & Backup', 'Migration & Backup'), d: t('Import/ekspor CSV kapan saja.', 'Import/export CSV anytime.') },
  ]

  return (
    <div className="kn-ambient min-h-screen text-[var(--ink)]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Nav */}
      <nav className="kn-nav sticky top-0 z-30 bg-[var(--surface)]/60 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mark size={36} />
            <div className="leading-tight"><div className="font-bold text-sm">Sehatera</div><div className="text-[10px] text-[var(--ink-faint)]">by Seawise Studio</div></div>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <a href="/" className="hidden sm:inline text-sm font-medium text-[var(--brand)] px-3 py-2">{t('Masuk', 'Sign In')}</a>
            <a href="/" className="text-sm font-semibold bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-xl hover:bg-[var(--brand-hover)] transition">{t('Daftarkan Apotek', 'Register Pharmacy')}</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-5 pt-20 sm:pt-28 pb-16 text-center">
        <p className="reveal text-[var(--accent)] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-5">{t('Sistem Manajemen Apotek', 'Pharmacy Management System')}</p>
        <h1 className="reveal kn-headline text-4xl sm:text-6xl md:text-7xl font-bold mb-6" style={{ transitionDelay: '.05s' }}>
          {t('Apotek Anda,', 'Your pharmacy,')}<br />{t('dikelola dengan tenang.', 'managed with ease.')}
        </h1>
        <p className="reveal text-lg sm:text-xl text-[var(--ink-mid)] max-w-2xl mx-auto mb-9" style={{ transitionDelay: '.1s' }}>
          {t('Dashboard analitik real-time, kasir, stok, order terpandu, kepatuhan SIPNAP, semuanya dalam satu aplikasi yang dirancang khusus untuk apotek Indonesia.', 'A real-time analytics dashboard, POS, stock, guided ordering, and SIPNAP compliance, all in one app built specifically for Indonesian pharmacies.')}
        </p>
        <div className="reveal flex items-center justify-center gap-3 mb-14" style={{ transitionDelay: '.15s' }}>
          <a href="/" className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-6 py-3 rounded-xl font-semibold hover:bg-[var(--brand-hover)] transition">{t('Coba Sekarang', 'Try Now')} <ArrowRight size={17} /></a>
          <a href="#harga" className="px-6 py-3 rounded-xl font-semibold border border-[var(--line)] hover:bg-[var(--surface)]/60 transition">{t('Lihat Harga', 'See Pricing')}</a>
        </div>
        <div className="reveal px-2 sm:px-8 pb-16" style={{ transitionDelay: '.2s' }}>
          <DeviceShowcase t={t} />
        </div>
      </header>

      {/* Problem (dark) */}
      <section className="kn-dark text-white py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-6">{t('Mengelola apotek nggak harus ribet.', 'Managing a pharmacy should not be hard.')}</h2>
          <p className="reveal text-[var(--on-brand-soft)] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>{t('Kebocoran yang diam-diam menggerus keuntungan, dan bikin repot saat audit.', 'Silent leaks that eat into profit, and cause headaches at audit time.')}</p>
          <div className="grid sm:grid-cols-3 gap-5 text-left">
            {[
              [t('Obat kadaluarsa terbuang', 'Expired medicine wasted'), t('Tanpa pantauan batch & expired, stok mati jadi kerugian.', 'Without batch & expiry tracking, dead stock becomes loss.')],
              [t('Laporan SIPNAP manual', 'Manual SIPNAP reports'), t('Rekap narkotika/psikotropika makan waktu dan rawan salah.', 'Narcotics/psychotropics recaps are slow and error-prone.')],
              [t('Hutang & stok tercecer', 'Scattered debts & stock'), t('Faktur jatuh tempo terlewat, data ada di banyak tempat.', 'Due invoices missed, data spread across many places.')],
            ].map((p, i) => (
              <div key={i} className="reveal bg-white/[0.06] border border-white/10 rounded-2xl p-6" style={{ transitionDelay: `${i * .07}s` }}>
                <p className="font-semibold text-lg mb-1.5">{p[0]}</p>
                <p className="text-[var(--on-brand-soft)] text-sm leading-relaxed">{p[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlights */}
      <section className="py-8 sm:py-16">
        {spotlights.map((s, i) => (
          <div key={i} className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
            <div className={`grid md:grid-cols-2 gap-10 sm:gap-14 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="reveal">
                <p className="text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-3">{s.tag}</p>
                <h3 className="kn-headline text-3xl sm:text-4xl font-bold mb-4">{s.title}</h3>
                <p className="text-[var(--ink-mid)] text-lg leading-relaxed">{s.body}</p>
              </div>
              <div className="reveal" style={{ transitionDelay: '.08s' }}>{s.visual}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Semua yang apotek Anda butuhkan.', 'Everything your pharmacy needs.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-12" style={{ transitionDelay: '.05s' }}>{t('Satu langganan, seluruh operasional tercakup.', 'One subscription, all operations covered.')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grid.map((g, i) => (
            <div key={i} className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-2xl p-6" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
              <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center mb-4"><g.Icon size={20} /></div>
              <p className="font-bold text-lg mb-1">{g.title}</p>
              <p className="text-[var(--ink-soft)] text-sm leading-relaxed">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing.
          Harganya dibaca dari tabel `plans`, bukan ditulis di sini. Sampai
          sekarang halaman ini memasang Rp216.000/bulan dan Rp2.160.000/tahun,
          dua angka yang tidak ada di database dan tidak pernah ditagihkan;
          siapa pun yang membacanya lalu mendaftar akan menemukan harga yang
          sama sekali lain begitu masuk. */}
      <section id="harga" className="kn-dark text-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="reveal text-[var(--on-brand-soft)] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t('Harga', 'Pricing')}</p>
            <h2 className="reveal kn-headline text-4xl sm:text-5xl font-bold mb-3" style={{ transitionDelay: '.05s' }}>
              {t('Bayar sesuai ukuran apotekmu', 'Pay for the size of your pharmacy')}
            </h2>
            <p className="reveal text-[var(--on-brand-soft)] text-lg" style={{ transitionDelay: '.1s' }}>
              {t('Naik paket saat apotekmu tumbuh, bukan sebelum itu.', 'Move up when your pharmacy grows, not before.')}
            </p>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <DaftarPaket nada="gelap" />
          </div>
          <div className="text-center">
            <a href="/" className="reveal inline-flex items-center gap-2 mt-10 bg-[var(--surface)] text-[var(--brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--line-soft)] transition" style={{ transitionDelay: '.25s' }}>
              {t('Daftarkan Apotek Sekarang', 'Register Your Pharmacy Now')} <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="max-w-4xl mx-auto px-5 py-24 text-center">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-5">{t('Siap membuat apotek lebih tenang?', 'Ready for a calmer pharmacy?')}</h2>
        <p className="reveal text-[var(--ink-mid)] text-lg mb-8" style={{ transitionDelay: '.05s' }}>{t('Mulai hari ini. Aktivasi dibantu langsung oleh tim Seawise.', 'Start today. Activation is assisted directly by the Seawise team.')}</p>
        <a href="/" className="reveal inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--brand-hover)] transition">{t('Mulai Sekarang', 'Start Now')} <ArrowRight size={18} /></a>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-[var(--ink-faint)]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mark size={18} /> <span className="font-semibold text-[var(--ink)]">Sehatera</span>
        </div>
        © {new Date().getFullYear()} Seawise Studio · Sehatera
      </footer>
    </div>
  )
}
