'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight, Award, BadgeCheck, BarChart2, Building2, CalendarClock, Check,
  ChevronDown, ClipboardCheck, ClipboardList, Database, FileCheck, FileText,
  FlaskConical, GitBranch, HeartPulse, Hospital, Languages, LayoutDashboard,
  Lock, Menu, Microscope, PackageOpen, Pill, Receipt, ScanLine, Settings,
  ShieldCheck, ShoppingCart, Stethoscope, Store, Syringe, TrendingUp, Tv,
  MessageCircle, UsersRound, Volume2, Wallet, Wand2, X
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
/* Rel bab di bawah nav. Batang gulungnya disembunyikan: ia muncul di tengah
   presentasi dan tidak ada yang menggulungnya dengan tetikus di layar lebar. */
.kn-rail{ scrollbar-width:none; -ms-overflow-style:none; }
.kn-rail::-webkit-scrollbar{ display:none; }

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

/**
 * Nomor WhatsApp tim Seawise, dalam bentuk internasional TANPA nol di depan
 * dan tanpa tanda apa pun. wa.me menolak "0812..." dan menolak spasi maupun
 * tanda hubung, dan yang ditolak diam-diam membuka halaman kosong, bukan galat.
 */
const WA = '6281237597759'

/**
 * Tiap tombol membawa kalimat pembukanya sendiri, dan kalimatnya BERBEDA per
 * tempat. Bukan basa-basi: yang menerima pesan jadi tahu calon klien menekan
 * tombol yang mana, dan tidak perlu bertanya "dari mana Anda tahu Sehatera"
 * sebagai kalimat pertama.
 */
const wa = (pesan: string) => `https://wa.me/${WA}?text=${encodeURIComponent(pesan)}`

/** Bentuk komponen ikon yang dipakai halaman ini. Semua ikon lucide muat. */
type Ikon = React.ComponentType<{ size?: number; className?: string }>

/**
 * Satu sorotan modul. `bab` hanya diisi pada sorotan PERTAMA tiap kelompok,
 * dan itulah yang menerbitkan judul babnya. Menyimpan judul bab di array
 * terpisah berarti dua daftar yang harus tetap berurutan, dan yang kedua akan
 * ketinggalan begitu ada sorotan disisipkan di tengah.
 */
type Sorot = {
  bab?: readonly [string, string, string]
  tag: string
  title: string
  body: string
  Icon: Ikon
  visual: React.ReactNode
}

/* ── Potongan kecil yang dipakai berulang di halaman ini ────────────────── */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)]/70 px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
      {children}
    </span>
  )
}

/**
 * Judul bab di antara kelompok sorotan.
 *
 * Halaman ini dipakai saat presentasi, dan yang presentasi perlu tahu ia
 * sedang di bagian mana tanpa menghitung berapa layar sudah lewat.
 */
function Bab({ no, judul, ringkas }: { no: string; judul: string; ringkas: string }) {
  return (
    <div className="max-w-6xl mx-auto px-5 pt-14">
      <div className="reveal flex items-start gap-4 border-t border-[var(--line)] pt-10">
        <span className="text-[var(--accent)] font-mono text-sm pt-1.5">{no}</span>
        <div>
          <h3 className="kn-headline text-2xl sm:text-3xl font-bold">{judul}</h3>
          <p className="text-[var(--ink-soft)] mt-1.5 max-w-2xl">{ringkas}</p>
        </div>
      </div>
    </div>
  )
}

/** Satu baris hasil pemeriksaan atau perizinan, dengan warna tingkat. */
function Tingkat({ warna, children }: { warna: 'merah' | 'amber' | 'hijau'; children: React.ReactNode }) {
  const kelas = warna === 'merah' ? 'text-red-600 bg-red-50 border-red-200'
    : warna === 'amber' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-green-700 bg-green-50 border-green-200'
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${kelas}`}>{children}</span>
}

export default function Kenapa() {
  const { t } = useLang()
  const [sektor, setSektor] = useState<'apotek' | 'klinik' | 'rumah_sakit'>('klinik')
  const [tanya, setTanya] = useState<number | null>(0)

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sektor, tanya])

  /* ── Peta bab, dipakai nav lengket saat presentasi ── */
  const bab = [
    ['untuk-siapa', t('Untuk siapa', 'Who it is for')],
    ['alur', t('Alur pasien', 'Patient flow')],
    ['modul', t('Modul', 'Modules')],
    ['aturan', t('Yang ditegakkan', 'Enforced')],
    ['banding', t('Perbandingan', 'Comparison')],
    ['harga', t('Harga', 'Pricing')],
    ['tanya-jawab', t('Tanya jawab', 'FAQ')],
  ] as const

  /* ── Tiga bentuk fasilitas ── */
  const sektorData = {
    apotek: {
      Icon: Store,
      nama: t('Apotek', 'Pharmacy'),
      ringkas: t('Kasir, stok berbasis batch, pembelian ke PBF, pembayaran faktur, dan pelaporan SIPNAP.',
                 'POS, batch based stock, purchasing from distributors, invoice payments, and SIPNAP reporting.'),
      modul: [t('Beranda', 'Home'), t('Produk & Stok', 'Products & Stock'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('SIPNAP ada di SEMUA paket, termasuk yang paling murah. Pelaporan narkotika dan psikotropika itu kewajiban hukum apotek, bukan fitur premium yang boleh dijual terpisah.',
              'SIPNAP is in EVERY plan, including the cheapest. Narcotics and psychotropics reporting is a legal duty, not a premium feature to be sold separately.'),
    },
    klinik: {
      Icon: Stethoscope,
      nama: t('Klinik', 'Clinic'),
      ringkas: t('Seluruh modul apotek, ditambah reservasi, antrean per poli, rekam medis, e-resep, lab & radiologi, dan klaim penjamin.',
                 'Every pharmacy module, plus appointments, per unit queues, medical records, e-prescriptions, lab & imaging, and payer claims.'),
      modul: [t('Beranda', 'Home'), t('Reservasi', 'Appointments'), t('Kunjungan', 'Visits'), t('Pasien', 'Patients'), t('Farmasi', 'Pharmacy'), t('Lab & Radiologi', 'Lab & Imaging'), t('Produk & Stok', 'Products & Stock'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('Satu kunjungan, satu tagihan. Pasien membayar SEKALI di kasir, termasuk pasien BPJS dan asuransi, jadi tidak ada kunjungan yang menggantung karena menunggu penjamin membayar.',
              'One visit, one bill. The patient pays ONCE at the cashier, BPJS and insurance included, so no visit hangs open waiting for a payer to settle.'),
    },
    rumah_sakit: {
      Icon: Hospital,
      nama: t('Rumah Sakit', 'Hospital'),
      ringkas: t('Sama dengan klinik hari ini, dengan poli, dokter, dan tenaga kesehatan tanpa batas jumlah.',
                 'Same as the clinic today, with unlimited units, doctors, and clinical staff.'),
      modul: [t('Beranda', 'Home'), t('Reservasi', 'Appointments'), t('Kunjungan', 'Visits'), t('Pasien', 'Patients'), t('Farmasi', 'Pharmacy'), t('Lab & Radiologi', 'Lab & Imaging'), t('Produk & Stok', 'Products & Stock'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('Rawat inap, kamar, dan penunjang lanjutan disiapkan per implementasi. Kami memilih tidak memasang menunya lebih dulu: menu yang mengantar ke halaman kosong lebih merugikan daripada menu yang belum ada.',
              'Inpatient, wards, and advanced ancillaries are scoped per implementation. We choose not to ship the menu first: a menu that leads to an empty page costs more than a menu that is not there yet.'),
    },
  } as const
  const S = sektorData[sektor]

  /* ── Alur satu pasien, dari memesan sampai klaim dibayar ── */
  const alur = [
    { Icon: CalendarClock, siapa: t('Loket / telepon', 'Front desk / phone'), judul: t('Reservasi', 'Appointment'),
      d: t('Pasien memesan sesi praktik dokter. Yang memesan belum harus jadi pasien terdaftar, karena yang menelepon sore ini untuk besok pagi belum tentu pernah datang.', 'The patient books a doctor session. A caller does not have to be a registered patient yet, because whoever calls this evening for tomorrow may never arrive.') },
    { Icon: UsersRound, siapa: t('Pendaftaran', 'Registration'), judul: t('Pendaftaran', 'Registration'),
      d: t('Identitas lengkap, penjamin yang berlaku HARI INI, dan poli tujuan. Nomor antrean terbit, biaya administrasi masuk sendiri ke tagihan.', 'Full identity, the payer valid TODAY, and the target unit. A queue number is issued and the admin fee enters the bill by itself.') },
    { Icon: Tv, siapa: t('Layar ruang tunggu', 'Waiting room screen'), judul: t('Antrean', 'Queue'),
      d: t('Nomor tampil besar di televisi ruang tunggu dan diucapkan suara. Layar itu tidak memakai sesi staf, jadi tidak ada rekam medis di balik tombol Beranda.', 'The number shows large on the waiting room TV and is announced aloud. That screen uses no staff session, so there is no medical record behind a Home button.') },
    { Icon: Stethoscope, siapa: t('Dokter', 'Doctor'), judul: t('Pemeriksaan', 'Examination'),
      d: t('SOAP, tanda vital berkolom berkode LOINC, diagnosis ICD-10 resmi. Tarif konsultasi masuk saat pasien benar-benar diperiksa, bukan saat mendaftar.', 'SOAP, vitals in typed LOINC coded columns, official ICD-10 diagnoses. The consultation fee enters when the patient is actually examined, not at registration.') },
    { Icon: Microscope, siapa: t('Analis', 'Lab technician'), judul: t('Penunjang', 'Ancillaries'),
      d: t('Lab berkolom dengan rentang rujukan, radiologi naratif. Cito naik ke atas antrean, dan nilai kritis diberi tanda merah supaya dokternya dikabari hari itu juga.', 'Lab in columns with reference ranges, imaging as narrative. Urgent orders jump the queue, and critical values are flagged red so the doctor hears today.') },
    { Icon: FileText, siapa: t('Dokter', 'Doctor'), judul: t('Resep', 'Prescription'),
      d: t('Dosis, frekuensi, dan rute dipisah jadi kolom sendiri. Dokter boleh menulis permintaan terbuka tanpa memilih produk, dan farmasi yang mengisinya.', 'Dose, frequency, and route are separate columns. The doctor may write an open request without picking a product, and pharmacy fills it in.') },
    { Icon: FlaskConical, siapa: t('Farmasi', 'Pharmacy'), judul: t('Penyiapan', 'Dispensing prep'),
      d: t('Farmasi menyiapkan, mencetak etiket, lalu menyatakan siap. Yang menyatakan obat berpindah tangan tetap farmasi, bukan mesin kasir.', 'Pharmacy prepares, prints the label, then marks it ready. Handover is declared by pharmacy, never by the cash register.') },
    { Icon: Wallet, siapa: t('Kasir', 'Cashier'), judul: t('Pembayaran', 'Payment'),
      d: t('Satu tagihan berisi administrasi, konsultasi, tindakan, penunjang, dan obat. Tunai, QRIS, transfer, atau ditagihkan ke penjamin.', 'One bill holding admin, consultation, procedures, ancillaries, and drugs. Cash, QRIS, transfer, or billed to the payer.') },
    { Icon: FileCheck, siapa: t('Pemilik / admin', 'Owner / admin'), judul: t('Klaim', 'Claim'),
      d: t('Tagihan penjamin dikumpulkan jadi klaim bernomor, dicetak lengkap dengan nomor kartu dan diagnosis primer, lalu dilacak sampai dibayar.', 'Payer billings are gathered into a numbered claim, printed with card numbers and primary diagnoses, then tracked until paid.') },
  ]

  /* ── Sorotan modul. `bab` menandai awal kelompok. ── */
  const spotlights: Sorot[] = [
    { bab: ['01', t('Pasien datang', 'The patient arrives'), t('Dari memesan lewat telepon sampai namanya dipanggil di ruang tunggu.', 'From a phone booking to a name called in the waiting room.')] as const,
      tag: t('BERANDA & ANALITIK', 'HOME & ANALYTICS'),
      title: t('Kondisi faskes, dalam sekali pandang.', 'The whole facility, at a glance.'),
      body: t('Grafik penjualan interaktif, batang omzet dipadu garis jumlah transaksi, bisa ganti rentang 7 atau 30 hari. Di bawahnya: produk terlaris, stok yang menipis, barang segera kadaluarsa, dan tagihan yang akan jatuh tempo. Semua langsung dari data hari itu, tanpa perlu membuka laporan.',
              'An interactive sales chart, revenue bars paired with a transaction count line, switchable between 7 or 30 days. Below it: best sellers, low stock, items expiring soon, and invoices coming due. Straight from today data, no report needed.'),
      Icon: TrendingUp,
      visual: (<AppWindow><div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[[t('Omzet','Revenue'),'Rp8,4jt'],[t('Kunjungan','Visits'),'34'],[t('Produk','Products'),'1.240']].map((c,i)=>(<div key={i} className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] uppercase tracking-wide">{c[0]}</p><p className="text-[11px] font-bold text-[var(--ink)]">{c[1]}</p></div>))}
        </div>
        <div className="rounded-lg border border-[var(--line-soft)] p-2.5">
          <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-semibold text-[var(--ink)]">{t('Penjualan 7 Hari','Sales, 7 Days')}</span><div className="flex gap-1.5 text-[7px]"><span className="text-[var(--brand-soft)]">▉ {t('Omzet','Revenue')}</span><span className="text-[var(--accent)]">━ {t('Transaksi','Trx')}</span></div></div>
          <svg viewBox="0 0 240 74" className="w-full">
            {[24,40,32,54,46,66,58].map((h,i)=>(<rect key={i} x={12+i*32} y={68-h} width="16" height={h} rx="3" fill="var(--brand)" />))}
            <path d="M20,42 C36,34 40,32 52,30 C68,27 72,40 84,38 C100,35 104,24 116,22 C132,20 136,32 148,30 C164,27 168,16 180,15 C196,14 200,22 212,24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
            {[[20,42],[52,30],[84,38],[116,22],[148,30],[180,15],[212,24]].map((p,i)=>(<circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.8" />))}
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] mb-0.5">{t('Stok Minim','Low Stock')}</p><p className="text-[10px] text-[var(--ink)]">Amoxicillin <span className="text-red-600 font-semibold">2/10</span></p></div>
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[8px] text-[var(--ink-faint)] mb-0.5">{t('Jatuh Tempo','Due')}</p><p className="text-[10px] text-[var(--ink)]">PBF Sehat <span className="text-amber-700 font-semibold">3 {t('hari','d')}</span></p></div>
        </div>
      </div></AppWindow>) },

    { tag: t('RESERVASI', 'APPOINTMENTS'),
      title: t('Janji datang, dengan kuota yang benar-benar menahan.', 'Bookings, with a quota that actually holds.'),
      body: t('Jadwal praktik berbentuk SESI, bukan slot lima belas menit, karena klinik pratama memang tidak bekerja begitu: pasien datang di rentang jam praktik dan dilayani berurutan. Kuota per sesi ditegakkan database dengan mengunci baris jadwalnya, jadi dua petugas yang menekan Simpan bersamaan tidak akan sama-sama berhasil pada kursi terakhir. Reservasi kemarin yang tidak pernah hadir dihanguskan sendiri.',
              'Practice schedules are SESSIONS, not fifteen minute slots, because primary clinics do not work that way: patients arrive within practice hours and are served in order. The per session quota is enforced in the database by locking the schedule row, so two staff pressing Save at once cannot both take the last seat. Yesterday no shows expire on their own.'),
      Icon: CalendarClock,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[var(--ink-soft)]"><span className="font-semibold text-[var(--ink)]">{t('Sabtu, 23 Agustus','Saturday, 23 August')}</span><span>{t('Sisa kuota','Seats left')} 4/20</span></div>
        {[['08.00 - 11.00','dr. Andi, Poli Umum','16'],['09.00 - 12.00','drg. Rina, Poli Gigi','7'],['16.00 - 19.00','dr. Sari, KIA','3']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2 flex items-center justify-between">
            <div><p className="text-[10px] font-semibold text-[var(--ink)]">{r[1]}</p><p className="text-[9px] text-[var(--ink-faint)]">{r[0]}</p></div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--brand-soft)]">{r[2]} {t('terisi','booked')}</span>
          </div>))}
        <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[9px] text-[var(--ink-soft)]">{t('Hadir? Satu klik jadi kunjungan, nomor antrean dan biaya administrasi ikut sendiri.','Arrived? One click becomes a visit, queue number and admin fee follow along.')}</div>
      </div></AppWindow>) },

    { tag: t('ANTREAN & LAYAR RUANG TUNGGU', 'QUEUE & WAITING ROOM SCREEN'),
      title: t('Nomor dipanggil, dan benar-benar terdengar.', 'Numbers called, and actually heard.'),
      body: t('Antrean bernomor per poli, dan sebuah layar untuk televisi ruang tunggu yang dibuka lewat tautan bertoken, TANPA login staf. Itu keputusan keamanan: sesi yang hidup di ruangan publik adalah sesi milik semua orang yang lewat. Nama pasien disamarkan di database, bukan di peramban, jadi nama lengkapnya tidak pernah sampai ke televisi itu. Suaranya dibangkitkan peramban, jadi nomor apa pun bisa diucapkan tanpa menyiapkan ratusan potongan rekaman.',
              'Numbered queues per unit, plus a waiting room TV screen opened by a tokenized link with NO staff login. That is a security decision: a session left running in a public room belongs to everyone who walks past. Patient names are masked in the database, not in the browser, so the full name never reaches that TV. The voice is generated by the browser, so any number can be spoken without recording hundreds of clips.'),
      Icon: Tv,
      visual: (<div className="kn-win rounded-2xl overflow-hidden border border-black/5 bg-[var(--brand)] text-[var(--on-brand)] p-5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--on-brand-soft)] mb-3">
          <span>Klinik Rexco 88</span>
          <span className="inline-flex items-center gap-1"><Volume2 size={12} /> {t('Suara aktif','Voice on')}</span>
        </div>
        <div className="rounded-xl bg-white/10 py-7 text-center mb-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--on-brand-soft)]">{t('Nomor dipanggil','Now calling')}</p>
          <p className="text-5xl font-bold leading-none mt-1.5">A-014</p>
          <p className="text-sm mt-2">Nyoman R. <span className="text-[var(--on-brand-soft)]">· Poli Umum</span></p>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--on-brand-soft)] mb-1.5">{t('Sedang dipanggil','Also calling')}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[['B-007','Poli Gigi'],['C-003','KIA'],['A-013','Poli Umum']].map((r,i)=>(
            <div key={i} className="rounded-lg bg-white/10 px-2 py-1.5"><p className="text-sm font-bold leading-none">{r[0]}</p><p className="text-[9px] text-[var(--on-brand-soft)] mt-1">{r[1]}</p></div>))}
        </div>
      </div>) },

    { tag: t('PASIEN & IDENTITAS', 'PATIENTS & IDENTITY'),
      title: t('Identitas wajib, tapi palangnya punya pintu.', 'Identity is required, but the gate has a door.'),
      body: t('NIK dan telepon wajib, ditegakkan di database bukan cuma di formulir, karena impor CSV menembak tabelnya langsung. Tapi ada pintu darurat yang MENUNTUT alasan, dan alasannya masuk jejak audit: pasien yang datang tidak sadarkan diri tidak memegang KTP, dan petugas yang tidak bisa mendaftarkannya akan mengarang enam belas angka. NIK karangan lebih berbahaya daripada NIK kosong, karena ia terlihat seperti data. Alamat dipecah berkolom sampai kelurahan, mengikuti syarat SatuSehat.',
              'National ID and phone are required, enforced in the database rather than only in the form, because a CSV import hits the table directly. But there is an emergency door that DEMANDS a reason, and the reason lands in the audit trail: an unconscious patient carries no ID card, and staff who cannot register them will invent sixteen digits. An invented ID is more dangerous than a blank one, because it looks like data. Addresses are split into columns down to the village, following SatuSehat requirements.'),
      Icon: BadgeCheck,
      visual: (<AppWindow><div className="space-y-2">
        {[[t('Nama lengkap','Full name'),'I Wayan Sudiarta'],['NIK','5171 •••• •••• 0042'],[t('Telepon','Phone'),'0812 •••• 4471'],[t('Kerabat','Next of kin'),'Ni Made Ayu · 0813 •••• 2210']].map((r,i)=>(
          <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5"><span className="text-[9px] text-[var(--ink-faint)]">{r[0]}</span><span className="text-[10px] text-[var(--ink)] font-medium">{r[1]}</span></div>))}
        <div className="grid grid-cols-2 gap-1.5">
          {[[t('Kelurahan','Village'),'Renon'],[t('Kecamatan','District'),'Denpasar Selatan'],[t('Kota','City'),'Denpasar'],[t('Provinsi','Province'),'Bali']].map((r,i)=>(
            <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2 py-1.5"><p className="text-[8px] text-[var(--ink-faint)]">{r[0]}</p><p className="text-[10px] text-[var(--ink)]">{r[1]}</p></div>))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[9px] text-amber-800">{t('Tanpa NIK? Wajib menulis alasan, dan alasannya tercatat di jejak audit.','No ID number? A reason is required, and it is recorded in the audit trail.')}</div>
      </div></AppWindow>) },

    { bab: ['02', t('Ruang periksa', 'The examination room'), t('Yang ditulis dokter hari ini harus masih bisa dibaca, dibandingkan, dan dikirim tahun depan.', 'What the doctor writes today must still be readable, comparable, and sendable next year.')] as const,
      tag: t('REKAM MEDIS', 'MEDICAL RECORDS'),
      title: t('SOAP, tanda vital berkolom, diagnosis berkode.', 'SOAP, typed vitals, coded diagnoses.'),
      body: t('Tanda vital bukan satu kotak catatan, melainkan kolom berjenis yang masing-masing membawa kode LOINC, karena "TD 120/80" di kotak bebas tidak bisa dipetakan ke standar apa pun tanpa menebak. Diagnosis memakai daftar ICD-10 RESMI Kemenkes, 18.543 kode, yang persis sama dengan yang dipakai INA-CBG menilai klaim. Kunjungan tidak bisa ditutup tanpa diagnosis, dan rekam medis yang sudah ditutup hanya bisa ditambahi adendum, bukan disunting diam-diam. Keduanya ditegakkan database.',
              'Vitals are not one free text box but typed columns each carrying its LOINC code, because "BP 120/80" in a free box cannot be mapped to any standard without guessing. Diagnoses use the OFFICIAL Ministry of Health ICD-10 list, 18,543 codes, the very list INA-CBG uses to assess claims. A visit cannot close without a diagnosis, and a closed record can only receive an addendum, never a silent edit. Both are enforced in the database.'),
      Icon: Stethoscope,
      visual: (<AppWindow><div className="space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[['TD','120/80','mmHg'],['Nadi','88','/mnt'],['Suhu','37,8','°C'],['SpO₂','97','%']].map((v,i)=>(
            <div key={i} className="rounded-lg border border-[var(--line-soft)] p-1.5 text-center"><p className="text-[8px] text-[var(--ink-faint)]">{v[0]}</p><p className="text-[11px] font-bold text-[var(--ink)] leading-tight">{v[1]}</p><p className="text-[7px] text-[var(--ink-faint)]">{v[2]}</p></div>))}
        </div>
        {[['S', t('Demam 3 hari, nyeri menelan','Fever 3 days, sore throat')],['O', t('Faring hiperemis, tonsil T1-T1','Pharynx hyperaemic, tonsils T1-T1')]].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5 flex gap-2"><span className="text-[9px] font-bold text-[var(--brand-soft)]">{r[0]}</span><span className="text-[10px] text-[var(--ink)]">{r[1]}</span></div>))}
        <div className="rounded-lg border border-[var(--line-soft)] p-2">
          <p className="text-[8px] text-[var(--ink-faint)] mb-1">{t('Cari: "faringitis"','Search: "pharyngitis"')}</p>
          <div className="flex items-center justify-between text-[10px] text-[var(--ink)] py-0.5"><span><span className="font-mono text-[var(--brand-soft)]">J02.9</span> Acute pharyngitis, unspecified</span><span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--brand)] text-[var(--on-brand)]">{t('Primer','Primary')}</span></div>
          <div className="flex items-center justify-between text-[10px] text-[var(--ink-soft)] py-0.5"><span><span className="font-mono">J03.9</span> Acute tonsillitis, unspecified</span></div>
        </div>
        <p className="text-[9px] text-[var(--ink-faint)]">{t('Diketik Indonesia, ketemu nama resmi Inggris. 162 pasang kata dan 81 kata kerja tindakan menjembataninya.','Typed in Indonesian, matched to the official English name. 162 word pairs and 81 procedure verbs bridge the gap.')}</p>
      </div></AppWindow>) },

    { tag: t('LAB & RADIOLOGI', 'LAB & IMAGING'),
      title: t('Hasil lab berkolom. Yang kritis tidak terselip.', 'Lab results in columns. Critical values do not hide.'),
      body: t('Paket pemeriksaan menyimpan CETAKAN parameternya: nama, kode LOINC, satuan, dan rentang rujukan, diisi sekali lalu dituangkan ke formulir hasil. Tanpa itu, darah lengkap berarti sepuluh baris diketik ulang tiap pasien, dan rentang rujukan yang diketik ulang berbeda-beda tergantung siapa yang jaga sehingga penanda tinggi dan rendah berhenti berarti apa pun. Radiologi sengaja TIDAK dipaksa berkolom: bacaannya memang temuan dan kesan. Cito menentukan urutan antrean, bukan sekadar penanda.',
              'A test package stores a TEMPLATE of its parameters: name, LOINC code, unit, and reference range, entered once then poured into the result form. Without it, a full blood count means ten rows retyped per patient, and retyped ranges differ by whoever is on shift until high and low flags mean nothing. Imaging is deliberately NOT forced into columns: its reading really is findings and impression. Urgent orders set queue order, not just a badge.'),
      Icon: Microscope,
      visual: (<AppWindow><div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-[var(--ink)]">{t('Darah Lengkap','Full Blood Count')}</span><span className="text-[8px] px-1.5 py-0.5 rounded bg-red-600 text-white font-semibold">CITO</span></div>
        {[['Hemoglobin','11,2','g/dL','12,0 - 16,0','amber',t('RENDAH','LOW')],['Leukosit','9.400','/µL','4.000 - 11.000','hijau',t('NORMAL','NORMAL')],['Trombosit','84.000','/µL','150.000 - 450.000','merah',t('KRITIS','CRITICAL')]].map((r,i)=>(
          <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5">
            <span className="text-[10px] text-[var(--ink)] flex-1 truncate">{r[0]}</span>
            <span className="text-[10px] font-bold text-[var(--ink)]">{r[1]}</span>
            <span className="text-[8px] text-[var(--ink-faint)] w-14 truncate">{r[2]}</span>
            <span className="text-[8px] text-[var(--ink-faint)] hidden sm:inline w-24 truncate">{r[3]}</span>
            <Tingkat warna={r[4] as 'merah' | 'amber' | 'hijau'}>{r[5]}</Tingkat>
          </div>))}
        <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[9px] text-red-700">{t('Ditandai kritis. Dokter pengirim dikabari hari ini juga.','Flagged critical. The ordering doctor is informed today.')}</div>
      </div></AppWindow>) },

    { tag: t('E-RESEP', 'E-PRESCRIPTION'),
      title: t('Aturan pakai dipecah, supaya bisa dicetak dan dikirim.', 'Dosing split into fields, so it can be printed and sent.'),
      body: t('Dosis, frekuensi, dan rute jadi kolom terpisah, karena "3x1 sesudah makan" yang terlanjur satu kalimat tidak bisa dibelah kembali, dan yang tidak bisa dibelah tidak bisa dicetak dengan benar maupun dikirim ke SatuSehat. Dokter juga boleh menulis PERMINTAAN TERBUKA tanpa memilih produk, misalnya "antihistamin oral, 10 tablet", lalu farmasi yang mengisinya. Kata-kata dokter pindah ke kolom sendiri dan tidak pernah ditimpa, jadi rekamnya selalu terbaca: dokter meminta X, farmasi mengisi Y, oleh siapa, jam berapa.',
              'Dose, frequency, and route are separate columns, because "3x1 after meals" written as one sentence cannot be split back, and what cannot be split cannot be printed correctly or sent to SatuSehat. Doctors may also write an OPEN REQUEST without picking a product, say "oral antihistamine, 10 tablets", and pharmacy fills it. The doctor original wording moves to its own column and is never overwritten, so the record always reads: the doctor asked for X, pharmacy filled Y, by whom, at what time.'),
      Icon: FileText,
      visual: (<AppWindow><div className="space-y-1.5">
        {[['Amoxicillin 500 mg','1 tablet','3x sehari','Oral','30'],['Paracetamol 500 mg','1 tablet','3x sehari bila demam','Oral','10']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <p className="text-[10px] font-semibold text-[var(--ink)] mb-1">{r[0]} <span className="text-[var(--ink-faint)] font-normal">· {r[4]}</span></p>
            <div className="flex gap-1.5">{[[t('Dosis','Dose'),r[1]],[t('Frekuensi','Frequency'),r[2]],[t('Rute','Route'),r[3]]].map((c,j)=>(
              <span key={j} className="text-[8px] rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--ink-soft)]"><span className="text-[var(--ink-faint)]">{c[0]}: </span>{c[1]}</span>))}</div>
          </div>))}
        <div className="rounded-lg border border-dashed border-[var(--line)] px-2.5 py-2">
          <p className="text-[10px] text-[var(--ink)]">{t('Antihistamin oral, 10 tablet','Oral antihistamine, 10 tablets')}</p>
          <p className="text-[8px] text-[var(--accent)] mt-0.5">{t('Permintaan terbuka. Produk dipilih farmasi.','Open request. Product chosen by pharmacy.')}</p>
        </div>
        <p className="text-[9px] text-[var(--ink-faint)]">{t('Pemeriksaan interaksi obat sengaja TIDAK dibuat, dan itu dikatakan di layar. Yang setengah benar lebih berbahaya daripada tidak ada.','Drug interaction checking is deliberately NOT built, and the screen says so. Half correct is more dangerous than absent.')}</p>
      </div></AppWindow>) },

    { bab: ['03', t('Farmasi dan kasir', 'Pharmacy and cashier'), t('Uang dan penyerahan obat adalah dua kejadian terpisah, dan dicatat terpisah.', 'Money and handover are two separate events, and are recorded separately.')] as const,
      tag: t('FARMASI', 'PHARMACY'),
      title: t('Yang menyatakan obat berpindah tangan adalah farmasi.', 'Handover is declared by pharmacy.'),
      body: t('Dulu kasir memanggil penandaan "sudah dilayani" saat pembayaran, jadi database mencatat obat sudah diserahkan pada detik uang diterima. Pasien yang membayar lalu pulang tanpa mengambil obatnya tercatat sudah menerima, dan untuk narkotika serta psikotropika itu catatan bertanda tangan apoteker yang isinya salah. Sekarang resep punya rel keadaan sendiri, dan tiap perpindahan ditulis oleh yang benar-benar mengerjakannya. Etiket dicetak dari layar Farmasi: putih untuk obat dalam, biru untuk obat luar, konvensi apotek Indonesia yang jadi pengaman terakhir sebelum obat masuk mulut.',
              'The cashier used to mark "dispensed" at payment, so the database recorded handover the second money arrived. A patient who paid then left without collecting was recorded as having received it, and for narcotics and psychotropics that is a pharmacist signed record that is simply wrong. Now prescriptions have their own state rail, and each move is written by whoever actually did the work. Labels print from the Pharmacy screen: white for internal, blue for external, the Indonesian pharmacy convention that is the last safeguard before a medicine reaches a mouth.'),
      Icon: FlaskConical,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center gap-1">
          {[[t('Draf','Draft'),t('dokter','doctor')],[t('Final','Final'),t('dokter','doctor')],[t('Disiapkan','Preparing'),t('farmasi','pharmacy')],[t('Siap','Ready'),t('farmasi','pharmacy')],[t('Diserahkan','Handed over'),t('farmasi','pharmacy')]].map((s,i)=>(
            <div key={i} className="flex-1 text-center">
              <div className={`h-1 rounded-full mb-1 ${i<=2?'bg-[var(--brand)]':'bg-[var(--line-soft)]'}`} />
              <p className={`text-[8px] font-semibold ${i<=2?'text-[var(--ink)]':'text-[var(--ink-faint)]'}`}>{s[0]}</p>
              <p className="text-[7px] text-[var(--ink-faint)]">{s[1]}</p>
            </div>))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2">
            <p className="text-[8px] text-[var(--ink-faint)] mb-1">{t('Etiket obat dalam','Internal use label')}</p>
            <p className="text-[9px] font-bold text-[var(--ink)]">I Wayan Sudiarta</p>
            <p className="text-[8px] text-[var(--ink-soft)]">Amoxicillin 500 mg</p>
            <p className="text-[9px] font-semibold text-[var(--ink)] mt-1">{t('3x sehari 1 tablet','3x daily, 1 tablet')}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
            <p className="text-[8px] text-blue-700 mb-1">{t('Etiket obat luar','External use label')}</p>
            <p className="text-[9px] font-bold text-blue-900">I Wayan Sudiarta</p>
            <p className="text-[8px] text-blue-800">Gentamicin salep mata</p>
            <p className="text-[9px] font-semibold text-blue-900 mt-1">{t('3x sehari, mata kanan','3x daily, right eye')}</p>
          </div>
        </div>
      </div></AppWindow>) },

    { tag: t('SATU TAGIHAN PER KUNJUNGAN', 'ONE BILL PER VISIT'),
      title: t('Kasir menagih sekali, dan menagih lengkap.', 'The cashier bills once, and bills in full.'),
      body: t('Biaya administrasi masuk saat kunjungan dibuka, tarif konsultasi masuk saat pasien benar-benar diperiksa, bukan saat mendaftar, karena pasien yang pulang dari ruang tunggu sebelum diperiksa tidak boleh ditagih konsultasi. Tindakan, penunjang, dan obat menyusul ke tagihan yang sama. Kasir mengambil semuanya lewat SATU panggilan, bukan dua: kalau terpisah, ada jeda di mana kasir sudah melihat tarifnya tapi obatnya belum sampai, lalu menekan Proses, dan struk yang kurang satu baris baru ketahuan saat pasien sudah pulang. Lencana SIAP DITAGIH dinyatakan dokter, bukan ditebak layar.',
              'The admin fee enters when the visit opens, the consultation fee when the patient is actually examined rather than at registration, because someone who leaves the waiting room before being seen must not be charged for a consultation. Procedures, ancillaries, and drugs join the same bill. The cashier pulls all of it in ONE call, not two: split apart, there is a window where the cashier sees the fees but the drugs have not landed, presses Process, and the missing line is discovered after the patient has gone. The READY TO BILL badge is declared by the doctor, never guessed by the screen.'),
      Icon: Wallet,
      visual: (<AppWindow><div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-[var(--ink)]">A-014 · I Wayan Sudiarta</span><span className="text-[8px] px-1.5 py-0.5 rounded bg-green-600 text-white font-semibold">{t('SIAP DITAGIH','READY TO BILL')}</span></div>
        {[[t('Administrasi','Admin fee'),'Rp 15.000'],[t('Konsultasi, Poli Umum','Consultation, General'),'Rp 50.000'],[t('Tindakan: jahit luka','Procedure: wound suture'),'Rp 150.000'],[t('Lab: darah lengkap','Lab: full blood count'),'Rp 85.000'],[t('Obat, 3 baris resep','Drugs, 3 prescription lines'),'Rp 62.000']].map((r,i)=>(
          <div key={i} className="flex items-center justify-between text-[10px] border-b border-[var(--line-soft)] pb-1"><span className="text-[var(--ink-soft)]">{r[0]}</span><span className="text-[var(--ink)]">{r[1]}</span></div>))}
        <div className="flex items-center justify-between pt-1"><span className="text-[11px] font-bold text-[var(--ink)]">Total</span><span className="text-[13px] font-bold text-[var(--brand)]">Rp 362.000</span></div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5"><p className="text-[8px] text-[var(--ink-faint)]">{t('Diterima tunai','Cash received')}</p><p className="text-[10px] font-semibold text-[var(--ink)]">Rp 62.000</p></div>
          <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5"><p className="text-[8px] text-[var(--ink-faint)]">{t('Ditagihkan BPJS','Billed to BPJS')}</p><p className="text-[10px] font-semibold text-[var(--accent)]">Rp 300.000</p></div>
        </div>
        <p className="text-[9px] text-[var(--ink-faint)]">{t('Piutang penjamin tidak dihitung sebagai uang masuk. Kalau ikut, laci kasir tidak akan pernah cocok saat tutup buku.','Payer receivables are not counted as cash in. If they were, the drawer would never balance at close.')}</p>
      </div></AppWindow>) },

    { tag: t('KASIR & BARCODE', 'POS & BARCODE'),
      title: t('Pindai dus pabriknya, bukan tempel stiker sendiri.', 'Scan the manufacturer box, not your own sticker.'),
      body: t('Yang paling berguna dari barcode bukan mencetak label sendiri, melainkan menyimpan barcode yang SUDAH tercetak di dus pabriknya supaya kasir tinggal memindainya. Barcode dijaga unik per faskes, karena dua produk berbarcode sama membuat pemindaian ambigu dan yang terpilih saat ambigu adalah yang kebetulan lebih dulu. Di kasir, cocokan barcode PERSIS selalu menang atas hasil teratas pencarian teks: pemindai mengetik angkanya lalu menekan Enter sendiri, dan satu digit yang beririsan cukup untuk memasukkan obat yang salah.',
              'The most useful thing about barcodes is not printing your own labels but storing the one ALREADY printed on the manufacturer box so the cashier can just scan it. Barcodes are kept unique per facility, because two products sharing one code make scanning ambiguous and the winner is whichever happens to come first. At the register an EXACT barcode match always beats the top text search hit: a scanner types the digits then presses Enter itself, and one overlapping digit is enough to ring up the wrong medicine.'),
      Icon: ScanLine,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2"><ScanLine size={14} className="text-[var(--brand-soft)]" /><span className="text-[11px] font-mono text-[var(--ink)]">8992222212106</span></div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 flex items-center justify-between">
          <div><p className="text-[10px] font-semibold text-green-900">Sanmol Tablet 500 mg</p><p className="text-[8px] text-green-700">{t('Rak A3 · Stok 300 · Batch BT-2408','Shelf A3 · Stock 300 · Batch BT-2408')}</p></div>
          <span className="text-[10px] font-bold text-green-900">Rp 3.000</span>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[9px] text-amber-800">⚠ {t('Golongan narkotika: identitas pasien dan nomor resep wajib terisi. Ditolak database, bukan cuma oleh formulir.','Narcotic class: patient identity and prescription number required. Refused by the database, not just the form.')}</div>
        <div className="grid grid-cols-3 gap-1.5">{[t('Tunai','Cash'),'QRIS',t('Transfer','Transfer')].map(m=><div key={m} className="text-[10px] text-center py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)]">{m}</div>)}</div>
      </div></AppWindow>) },

    { bab: ['04', t('Uang yang bisa dipertanggungjawabkan', 'Money you can account for'), t('Yang ditagihkan ke penjamin bukan uang yang diterima, dan keduanya tidak boleh dicampur.', 'What is billed to a payer is not cash received, and the two must never be mixed.')] as const,
      tag: t('PENJAMIN & KLAIM', 'PAYERS & CLAIMS'),
      title: t('Klaim adalah baris yang dilacak, bukan tombol cetak.', 'A claim is a tracked record, not a print button.'),
      body: t('Faktur yang cuma dicetak tanpa meninggalkan catatan berarti klinik tidak bisa menjawab tiga pertanyaan yang pasti ditanyakan: klaim mana yang sudah dikirim, berapa yang belum dibayar, dan transaksi ini sudah masuk klaim yang mana. Yang tidak tercatat akan ditagihkan dua kali, dan menagih penjamin dua kali untuk pelayanan yang sama adalah cara tercepat kehilangan kerja sama. Rincian klaim disimpan sebagai CUPLIKAN: klaim yang sudah di tangan verifikator tidak boleh berubah isinya karena satu transaksi dibatalkan minggu depan. Yang berubah muncul sebagai selisih.',
              'An invoice printed without leaving a record means the clinic cannot answer three questions it will certainly be asked: which claims were sent, how much is unpaid, and which claim this transaction belongs to. What is not recorded gets billed twice, and billing a payer twice for the same service is the fastest way to lose the contract. Claim details are stored as a SNAPSHOT: a claim already with the verifier must not change because one transaction is voided next week. Changes surface as a difference.'),
      Icon: FileCheck,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {[t('Draf','Draft'),t('Dikirim','Sent'),t('Dibayar','Paid')].map((s,i)=>(
            <div key={i} className="flex items-center gap-1.5 flex-1"><span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${i<=1?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>{i+1}</span><span className="text-[8px] text-[var(--ink-soft)]">{s}</span>{i<2&&<div className="flex-1 h-px bg-[var(--line-soft)]" />}</div>))}
        </div>
        {[['KLM/2026/08/001','BPJS Kesehatan','1 - 15 Agu','Rp 18.450.000','hijau',t('Dibayar','Paid')],['KLM/2026/08/002','Allianz','1 - 20 Agu','Rp 4.120.000','amber',t('Dikirim','Sent')],['KLM/2026/08/003','Mandiri Inhealth','1 - 22 Agu','Rp 2.870.000','merah',t('Draf','Draft')]].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-[var(--ink-soft)]">{r[0]}</span><Tingkat warna={r[4] as 'merah'|'amber'|'hijau'}>{r[5]}</Tingkat></div>
            <div className="flex items-center justify-between mt-0.5"><span className="text-[10px] font-semibold text-[var(--ink)]">{r[1]} <span className="font-normal text-[var(--ink-faint)]">· {r[2]}</span></span><span className="text-[10px] font-bold text-[var(--ink)]">{r[3]}</span></div>
          </div>))}
        <p className="text-[9px] text-[var(--ink-faint)]">{t('Fakturnya membawa nomor kartu penjamin dan diagnosis primer per baris, karena itu yang diperiksa verifikator satu per satu.','The printed invoice carries the payer card number and primary diagnosis per line, because that is what the verifier checks one by one.')}</p>
      </div></AppWindow>) },

    { tag: t('PEMBELIAN & PEMBAYARAN FAKTUR', 'PURCHASING & INVOICE PAYMENTS'),
      title: t('Dari pesanan ke PBF sampai faktur lunas, terpantau.', 'From the order to the distributor to a settled invoice.'),
      body: t('Buat pesanan ke supplier, terima barang beserta batch dan tanggal kadaluarsanya, lalu kelola pembayaran faktur yang diurutkan menurut jatuh tempo, lengkap dengan penanda yang sudah lewat tempo dan bukti pembayaran yang bisa dicetak. Penerimaan barang memakai delta relatif dan menggabungkan batch yang sama, jadi kiriman yang datang bertahap tidak melahirkan batch kembar yang membuat kartu stok tidak terbaca.',
              'Create purchase orders, receive goods along with their batch and expiry, then manage invoice payments sorted by due date, with overdue flags and printable payment receipts. Goods receipt uses relative deltas and merges identical batches, so a shipment arriving in parts does not spawn duplicate batches that make the stock card unreadable.'),
      Icon: Receipt,
      visual: (<AppWindow><div className="space-y-1.5">{[['INV/0087','PBF Sehat Sentosa',t('Jatuh tempo 3 hari','Due in 3 days'),'amber'],['INV/0091','PT Kimia Farma',t('Terlambat 6 hari','6 days overdue'),'merah'],['INV/0080','PBF Anugerah',t('Lunas','Settled'),'hijau']].map((r,i)=>(
        <div key={i} className="flex items-center justify-between bg-[var(--surface)]/70 border border-[var(--line-soft)] rounded-lg px-3 py-2">
          <div><p className="text-[10px] font-mono text-[var(--ink)]">{r[0]}</p><p className="text-[9px] text-[var(--ink-faint)]">{r[1]}</p></div>
          <Tingkat warna={r[3] as 'merah'|'amber'|'hijau'}>{r[2]}</Tingkat>
        </div>))}</div></AppWindow>) },

    { tag: t('LAPORAN & SIPNAP', 'REPORTS & SIPNAP'),
      title: t('Laporan wajib yang tidak lagi memakan satu malam.', 'The mandatory report that no longer eats an evening.'),
      body: t('Narkotika, Psikotropika, dan Prekursor per periode: penerimaan diambil dari pembelian, pengeluaran lengkap dengan data pasien dan nomor resep, siap cetak dengan tanda tangan penanggung jawab. Di sebelahnya ada laporan penjualan, rekap metode bayar, laporan per penjamin yang memisahkan uang diterima dari yang masih ditagihkan, dan kartu stok per batch. SIPNAP ada di semua paket, termasuk yang paling murah.',
              'Narcotics, psychotropics, and precursors per period: receipts pulled from purchases, dispensing complete with patient data and prescription number, ready to print with the responsible pharmacist signature. Alongside it: sales reports, payment method recaps, a per payer report separating cash received from amounts still billed, and per batch stock cards. SIPNAP is in every plan, including the cheapest.'),
      Icon: BarChart2,
      visual: (<AppWindow><div className="text-center"><p className="text-[11px] font-bold text-[var(--ink)]">LAPORAN PENGGUNAAN NARKOTIKA</p><p className="text-[9px] text-[var(--ink-faint)] mb-2">{t('Periode: Bulan berjalan','Period: current month')}</p><div className="border border-[var(--line)] rounded overflow-hidden"><div className="grid grid-cols-5 text-[8px] bg-[var(--surface-2)] text-[var(--ink-soft)]">{[t('Sediaan','Item'),t('Awal','Open'),t('Masuk','In'),t('Keluar','Out'),t('Sisa','Left')].map((h,i)=><span key={i} className={`p-1 ${i<4?'border-r border-[var(--line)]':''}`}>{h}</span>)}</div>{[['Codein 10 mg','12','20','5','27'],['Pethidin 50 ml','4','10','2','12']].map((r,i)=>(<div key={i} className="grid grid-cols-5 text-[8px] border-t border-[var(--line-soft)]">{r.map((c,j)=><span key={j} className={`p-1 text-[var(--ink)] ${j<4?'border-r border-[var(--line-soft)]':''}`}>{c}</span>)}</div>))}</div><p className="text-[8px] text-[var(--ink-faint)] mt-2">apt. Anessa Beckham, S.Farm · SIPA 4471/SIPA/2024</p></div></AppWindow>) },

    { bab: ['05', t('Barang di rak', 'Stock on the shelf'), t('Obat punya batch dan tanggal kadaluarsa. Sistem yang hanya menghitung jumlah tidak cukup.', 'Medicines have batches and expiry dates. A system that only counts quantity is not enough.')] as const,
      tag: t('STOK, BATCH & KADALUARSA', 'STOCK, BATCHES & EXPIRY'),
      title: t('Tiga tingkat kadaluarsa, bukan dua.', 'Three expiry tiers, not two.'),
      body: t('"Sudah lewat" dan "25 hari lagi" dulu satu kelompok merah, jadi seluruh layar jadi dinding merah dan tidak ada yang menonjol. Padahal keduanya menuntut hal BERLAWANAN: yang sudah lewat harus ditarik dari rak dan tidak boleh dijual sama sekali, yang 25 hari lagi justru harus didahulukan dijual. Warna yang sama untuk dua perintah yang berlawanan membuat keduanya diabaikan. Setelah itu ada tindak lanjutnya: musnahkan dengan Berita Acara resmi, atau retur ke supplier. Stok berkurang hanya setelah dikonfirmasi.',
              '"Already expired" and "25 days left" used to share one red, so the whole screen became a red wall and nothing stood out. Yet the two demand OPPOSITE actions: expired stock must be pulled from the shelf and never sold, while stock with 25 days left must be sold first. One colour for two opposite orders gets both ignored. Then comes the follow up: destroy with an official report, or return to the supplier. Stock only drops after confirmation.'),
      Icon: CalendarClock,
      visual: (<AppWindow><table className="w-full text-[10px]"><thead><tr className="text-[var(--ink-faint)] text-[8px]"><th className="text-left font-medium pb-1">{t('Produk','Product')}</th><th className="text-left font-medium pb-1">Batch</th><th className="text-left font-medium pb-1">{t('Kadaluarsa','Expiry')}</th><th className="text-right font-medium pb-1">{t('Aksi','Action')}</th></tr></thead><tbody>
        {[['Amoxicillin 500','BT-2312',t('Lewat 12 hari','12 days past'),'merah',t('Musnahkan','Destroy')],['Cetirizine 10','BT-2401',t('25 hari lagi','25 days left'),'amber',t('Jual dulu','Sell first')],['Sanmol 500','BT-2408',t('Aman','Safe'),'hijau',t('Retur','Return')]].map((r,i)=>(
          <tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-1.5 text-[var(--ink)]">{r[0]}</td><td className="py-1.5 font-mono text-[var(--ink-soft)]">{r[1]}</td><td className="py-1.5"><Tingkat warna={r[3] as 'merah'|'amber'|'hijau'}>{r[2]}</Tingkat></td><td className="py-1.5 text-right"><span className="text-[9px] px-2 py-0.5 rounded bg-[var(--brand)] text-[var(--on-brand)]">{r[4]}</span></td></tr>))}
      </tbody></table></AppWindow>) },

    { tag: t('ORDER TERPANDU', 'GUIDED ORDER'),
      title: t('Restok otomatis. Pesanan terpecah per distributor.', 'Auto restock. Orders split per distributor.'),
      body: t('Satu klik, sistem mengumpulkan semua barang yang mencapai stok minimum, menyarankan jumlah order, lalu otomatis membagi ke distributor masing-masing. Tinggal review, dan pesanan langsung terpecah menjadi satu PO per supplier, siap kirim. Tidak perlu lagi memeriksa kartu stok satu per satu, dan tidak ada lagi barang yang baru diingat setelah pasien menanyakannya.',
              'One click, the system gathers every item at minimum stock, suggests order quantities, then assigns each to its distributor. Review it, and the order splits into one PO per supplier, ready to send. No more checking stock cards one by one, and no more remembering an item only after a patient asks for it.'),
      Icon: Wand2,
      visual: (<AppWindow><div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">{[t('Pilih','Select'),t('Bagi','Assign'),t('Buat','Create')].map((s,i)=>(<div key={i} className="flex items-center gap-1.5 flex-1"><span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${i===0?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>{i+1}</span><span className="text-[8px] text-[var(--ink-soft)]">{s}</span>{i<2&&<div className="flex-1 h-px bg-[var(--line-soft)]" />}</div>))}</div>
        {[['Amoxicillin 500','2/10','PBF Sehat'],['Paracetamol 500','5/20','PBF Sehat'],['Vitamin C 500','3/15','PT Kimia']].map((r,i)=>(<div key={i} className="flex items-center justify-between text-[10px] rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5"><span className="text-[var(--ink)]">{r[0]}</span><span className="text-red-600">{r[1]}</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--brand-soft)]">{r[2]}</span></div>))}
        <div className="text-[9px] text-center text-[var(--brand-soft)] font-medium">→ 2 PO {t('siap kirim','ready to send')}</div>
      </div></AppWindow>) },

    { bab: ['06', t('Yang mengelola faskesnya', 'Running the facility'), t('Hak akses, cabang, dan izin praktik. Bagian yang tidak dilihat pasien, tapi yang ditanya auditor.', 'Permissions, branches, and practice licences. The part patients never see, and auditors always ask about.')] as const,
      tag: t('HAK AKSES PER SUB-MODUL', 'PER SUB-MODULE PERMISSIONS'),
      title: t('Yang menahan ada di database, bukan cuma tombol yang disembunyikan.', 'The guard is in the database, not a hidden button.'),
      body: t('Menyembunyikan menu saja berarti petugas pendaftaran yang mengetik alamatnya, atau memanggil fungsinya lewat kunci yang memang ada di dalam peramban tiap pengguna, tetap bisa membaca SOAP dan diagnosis siapa pun di kliniknya. Untuk rekam medis itu bukan kelalaian kecil. Sekarang penjaganya dipanggil dari dalam sepuluh fungsi medis, dan matriksnya ada di SATU tempat. Pendaftaran memegang identitas dan antrean tanpa membuka rekam medis; perawat menambah tanda vital tanpa menulis diagnosis; farmasi melihat resep dan alergi tanpa membuka SOAP; kasir melihat tagihan tanpa membuka apa pun yang medis.',
              'Hiding a menu only means a registration clerk who types the address, or calls the function with the key that sits inside every user browser anyway, can still read anyone SOAP notes and diagnoses. For medical records that is not a small oversight. The guard now runs inside ten clinical functions, and the matrix lives in ONE place. Registration holds identity and queues without opening records; nurses add vitals without writing diagnoses; pharmacy sees prescriptions and allergies without SOAP; the cashier sees the bill without anything clinical.'),
      Icon: Lock,
      visual: (<AppWindow><div className="overflow-hidden"><table className="w-full text-[9px]"><thead><tr className="text-[var(--ink-faint)] text-[8px]"><th className="text-left font-medium pb-1.5">{t('Peran','Role')}</th>{[t('Identitas','Identity'),'SOAP',t('Diagnosis','Dx'),t('Resep','Rx'),t('Tagihan','Bill')].map(h=><th key={h} className="font-medium pb-1.5">{h}</th>)}</tr></thead><tbody>
        {[[t('Pendaftaran','Registration'),1,0,0,0,0],[t('Perawat','Nurse'),1,1,0,0,0],[t('Dokter','Doctor'),1,1,1,1,0],[t('Farmasi','Pharmacy'),1,0,0,1,0],[t('Kasir','Cashier'),1,0,0,0,1]].map((r,i)=>(
          <tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-1.5 text-[var(--ink)]">{r[0]}</td>{(r.slice(1) as number[]).map((c,j)=>(<td key={j} className="py-1.5 text-center">{c?<Check size={12} className="inline text-green-600" />:<X size={12} className="inline text-[var(--ink-faint)]" />}</td>))}</tr>))}
      </tbody></table></div><p className="text-[9px] text-[var(--ink-faint)] mt-2">{t('Pemilik dan admin sengaja mendapat semuanya. Mengunci pemilik dari datanya sendiri akan membuat semua orang dibuatkan akun pemilik.','Owners and admins deliberately get everything. Locking an owner out of their own data just gets everyone an owner account.')}</p></AppWindow>) },

    { tag: t('MULTI OUTLET', 'MULTIPLE OUTLETS'),
      title: t('Tiap cabang tetap fasilitas tersendiri.', 'Each branch stays its own facility.'),
      body: t('Bukan jalan pintas: tiap cabang apotek punya izin dan penanggung jawabnya sendiri, stoknya sendiri, dan SIPNAP-nya dilaporkan per outlet. Menyatukan stok beberapa cabang di satu badan usaha justru membuat laporan wajibnya salah. Yang dibagi cuma langganannya: outlet baru mewarisi paket dan masa aktif, tidak melahirkan tagihan kedua. Satu orang boleh punya akses ke beberapa outlet DENGAN PERAN BERBEDA, karena memaksanya satu peran membuat pemilik memberi hak lebih tinggi daripada yang dibutuhkan, dan hak yang dinaikkan demi kenyamanan tidak pernah diturunkan lagi.',
              'Not a shortcut: each branch has its own licence and person in charge, its own stock, and its own mandatory reporting. Merging several branches stock under one entity actively breaks those reports. Only the subscription is shared: a new outlet inherits the plan and validity rather than creating a second bill. One person may hold access to several outlets WITH DIFFERENT ROLES, because forcing a single role makes owners grant more than needed, and permissions raised for convenience are never lowered again.'),
      Icon: Building2,
      visual: (<AppWindow><div className="space-y-2">
        {[['Klinik Rexco 88',t('Klinik · Denpasar','Clinic · Denpasar'),t('Outlet aktif','Active outlet'),true],['Apotek Rexco Renon',t('Apotek · Renon','Pharmacy · Renon'),t('Pindah ke sini','Switch here'),false]].map((r,i)=>(
          <div key={i} className={`rounded-lg border px-2.5 py-2 flex items-center justify-between ${r[3]?'border-[var(--brand)] bg-[var(--surface-2)]':'border-[var(--line-soft)]'}`}>
            <div><p className="text-[10px] font-semibold text-[var(--ink)]">{r[0]}</p><p className="text-[9px] text-[var(--ink-faint)]">{r[1]}</p></div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded ${r[3]?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--surface-2)] text-[var(--ink-soft)]'}`}>{r[2]}</span>
          </div>))}
        <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[9px] text-[var(--ink-soft)]">{t('Stok, kasir, dan laporan mengikuti outlet yang sedang dibuka. Satu langganan, kuota cabang mengikuti paket.','Stock, register, and reports follow the open outlet. One subscription, branch quota follows the plan.')}</div>
      </div></AppWindow>) },

    { tag: t('PERIZINAN TENAGA KESEHATAN', 'PRACTITIONER LICENCES'),
      title: t('STR dan SIP menempel di orangnya, dengan masa berlakunya.', 'Licences attach to the person, with their expiry.'),
      body: t('Klinik punya lebih dari satu dokter, dan resep yang dicetak harus membawa nomor izin DOKTER YANG MENULISNYA. Resep bernomor izin orang lain bukan dokumen yang kurang rapi, ia dokumen yang salah. Izin praktik juga ada masa berlakunya: SIP yang habis berarti prakteknya tidak sah hari itu juga, dan tanggal yang tidak disimpan tidak bisa diingatkan. Sisa harinya dihitung di server, bukan di peramban, karena komputer klinik yang jamnya meleset dua bulan benar-benar terjadi.',
              'A clinic has more than one doctor, and a printed prescription must carry the licence number of THE DOCTOR WHO WROTE IT. A prescription bearing someone else licence is not untidy, it is wrong. Licences also expire: a lapsed practice permit means practice is unlawful that same day, and a date you never stored cannot be a reminder. Days remaining are computed on the server, not in the browser, because a clinic PC whose clock is two months off genuinely happens.'),
      Icon: Award,
      visual: (<AppWindow><div className="space-y-1.5">
        {[['dr. Andi Wirawan','STR 3311/2023','SIP 4471/2024',t('Lewat 9 hari','9 days past'),'merah'],['drg. Rina Kusuma','STR 2210/2024','SIP 5512/2025',t('54 hari lagi','54 days left'),'amber'],['apt. Anessa Beckham','STR 1180/2025','SIPA 4471/2026',t('318 hari lagi','318 days left'),'hijau']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[var(--ink)]">{r[0]}</span><Tingkat warna={r[4] as 'merah'|'amber'|'hijau'}>{r[3]}</Tingkat></div>
            <p className="text-[8px] text-[var(--ink-faint)] mt-0.5 font-mono">{r[1]} · {r[2]}</p>
          </div>))}
        <p className="text-[9px] text-[var(--ink-faint)]">{t('Tiga tingkat, bukan dua: yang sudah lewat menuntut berhenti praktik, yang 60 hari lagi menuntut mengurus perpanjangan.','Three tiers, not two: lapsed demands stopping practice, sixty days out demands starting the renewal.')}</p>
      </div></AppWindow>) },
  ]

  /* ── Daftar modul lengkap, dikelompokkan supaya bisa dibacakan ── */
  const kelompokModul = [
    { judul: t('Pelayanan pasien', 'Patient services'), items: [
      [Stethoscope, t('Kunjungan & antrean per poli', 'Visits & per unit queues'), t('Rel keadaan yang bergeser sendiri mengikuti resep, antrean menyaring ke poli dokternya.', 'A state rail that follows the prescription, queues filtered to the doctor unit.')],
      [CalendarClock, t('Reservasi', 'Appointments'), t('Jadwal praktik per sesi, kuota ditegakkan database, no show dihanguskan sendiri.', 'Session based schedules, quota enforced in the database, no shows expire automatically.')],
      [UsersRound, t('Pasien & riwayat', 'Patients & history'), t('Identitas lengkap, kerabat, alamat berkolom, dan pintu ke rekam medis kunjungan lama.', 'Full identity, next of kin, columnar address, and a door into past visit records.')],
      [FileText, t('Rekam medis SOAP', 'SOAP records'), t('Tanda vital berkode LOINC, ICD-10 resmi, adendum, riwayat keadaan otomatis.', 'LOINC coded vitals, official ICD-10, addenda, automatic state history.')],
      [GitBranch, t('Rujukan internal', 'Internal referral'), t('Satu kunjungan berpindah poli, catatan dan tarif konsultasi jadi per poli.', 'One visit moves between units, notes and consultation fees become per unit.')],
      [Tv, t('Layar ruang tunggu', 'Waiting room screen'), t('Tautan bertoken tanpa login, nama disamarkan di database, panggilan bersuara.', 'Tokenized link with no login, names masked in the database, spoken calls.')],
    ]},
    { judul: t('Klinis & penunjang', 'Clinical & ancillary'), items: [
      [Syringe, t('E-resep', 'E-prescription'), t('Dosis, frekuensi, rute terpisah. Permintaan terbuka diisi farmasi tanpa menimpa kata dokter.', 'Dose, frequency, route separated. Open requests filled by pharmacy without overwriting the doctor.')],
      [FlaskConical, t('Antrean farmasi & etiket', 'Pharmacy queue & labels'), t('Lima keadaan resep, etiket 70 x 40 mm, putih obat dalam dan biru obat luar.', 'Five prescription states, 70 x 40 mm labels, white for internal and blue for external.')],
      [Microscope, t('Lab & radiologi', 'Lab & imaging'), t('Hasil berkolom dengan rentang rujukan, cito naik antrean, nilai kritis bertanda merah.', 'Columnar results with reference ranges, urgent jumps the queue, critical values flagged red.')],
      [HeartPulse, t('Layanan jasa & tarif', 'Services & tariffs'), t('Tindakan berkode ICD-9-CM, tarif konsultasi per poli, biaya administrasi.', 'ICD-9-CM coded procedures, per unit consultation tariffs, admin fees.')],
      [Award, t('Perizinan tenaga kesehatan', 'Practitioner licences'), t('STR dan SIP dengan masa berlaku, sisa hari dihitung di server.', 'Licences with validity, days remaining computed on the server.')],
      [ClipboardCheck, t('Poli & jadwal dokter', 'Units & doctor schedules'), t('Deret antrean per poli, penugasan dokter, sesi praktik berkuota.', 'Per unit queue series, doctor assignment, quota bearing sessions.')],
    ]},
    { judul: t('Uang & kepatuhan', 'Money & compliance'), items: [
      [ShoppingCart, t('Kasir & struk', 'POS & receipts'), t('Tunai, QRIS, transfer, pemindai barcode, penjualan resep dengan penjagaan golongan.', 'Cash, QRIS, transfer, barcode scanning, prescription sales with class guards.')],
      [Wallet, t('Tagihan kunjungan', 'Visit billing'), t('Satu tagihan per kunjungan, terkunci begitu kunjungan ditutup.', 'One bill per visit, locked the moment the visit closes.')],
      [FileCheck, t('Klaim penjamin', 'Payer claims'), t('Klaim bernomor dengan rincian cuplikan, rel keadaan, dan faktur siap kirim.', 'Numbered claims with snapshot details, a state rail, and a sendable invoice.')],
      [Receipt, t('Pembayaran faktur', 'Invoice payments'), t('Hutang supplier diurutkan jatuh tempo, penanda lewat tempo, bukti bayar tercetak.', 'Supplier debts sorted by due date, overdue flags, printable payment receipts.')],
      [BarChart2, t('Laporan SIPNAP', 'SIPNAP reports'), t('Narkotika, psikotropika, prekursor. Ada di semua paket, termasuk yang paling murah.', 'Narcotics, psychotropics, precursors. In every plan, including the cheapest.')],
      [TrendingUp, t('Laporan penjualan & penjamin', 'Sales & payer reports'), t('Rekap metode bayar, dan pemisahan uang diterima dari yang masih ditagihkan.', 'Payment method recaps, and cash received separated from amounts still billed.')],
    ]},
    { judul: t('Barang & operasional', 'Stock & operations'), items: [
      [Pill, t('Produk, batch & kadaluarsa', 'Products, batches & expiry'), t('Katalog, harga, margin, rak, barcode unik per faskes, tiga tingkat kadaluarsa.', 'Catalog, prices, margins, shelves, per facility unique barcodes, three expiry tiers.')],
      [Wand2, t('Order terpandu', 'Guided order'), t('Restok otomatis dari stok minimum, pesanan terpecah jadi PO per distributor.', 'Auto restock from minimum stock, split into one PO per distributor.')],
      [PackageOpen, t('Pembelian & penerimaan', 'Purchasing & receiving'), t('PO, penerimaan bertahap dengan penggabungan batch, faktur pembelian.', 'POs, partial receiving with batch merging, purchase invoices.')],
      [ClipboardList, t('Tindak lanjut kadaluarsa', 'Expiry follow-up'), t('Musnahkan dengan Berita Acara resmi, atau retur ke supplier. Stok turun setelah konfirmasi.', 'Destroy with an official report, or return to the supplier. Stock drops after confirmation.')],
      [Building2, t('Multi outlet', 'Multiple outlets'), t('Tiap cabang tetap faskes tersendiri, satu langganan, akses per pengguna per outlet.', 'Each branch stays its own facility, one subscription, per user per outlet access.')],
      [Database, t('Migrasi & ekspor CSV', 'CSV migration & export'), t('Template produk, supplier, stok awal, saldo hutang. Datanya bisa dibawa keluar kapan saja.', 'Templates for products, suppliers, opening stock, outstanding debts. Data can leave any time.')],
    ]},
  ] as const

  /* ── Aturan yang ditolak DATABASE, bukan cuma layar ── */
  const aturan = [
    ['SH002', t('Kuota paket penuh', 'Plan quota reached'), t('Produk, pengguna, dan outlet dibatasi paket, ditegakkan trigger. Impor CSV massal ikut ditolak.', 'Products, users, and outlets are capped by plan, enforced by triggers. A bulk CSV import is refused too.')],
    ['SH003', t('Masa aktif habis', 'Subscription lapsed'), t('Yang berhenti hanya transaksi baru. SIPNAP, cetak ulang faktur, dan kartu stok tetap terbuka.', 'Only new transactions stop. SIPNAP, invoice reprints, and stock cards stay open.')],
    ['SH005', t('Stok tidak cukup', 'Insufficient stock'), t('Penjualan yang melebihi batch yang ada ditolak sebelum uang tercatat.', 'A sale beyond available batches is refused before any money is recorded.')],
    ['SH006', t('Golongan tanpa identitas', 'Controlled class without identity'), t('Narkotika, psikotropika, dan prekursor menuntut data pasien dan nomor resep.', 'Narcotics, psychotropics, and precursors demand patient data and a prescription number.')],
    ['SH007', t('Peran tidak berhak', 'Role not permitted'), t('Sepuluh fungsi medis memeriksa peran di dalam dirinya, bukan mengandalkan menu.', 'Ten clinical functions check the role inside themselves, not via the menu.')],
    ['SH004', t('Masukan tidak sah', 'Invalid input'), t('Termasuk reservasi kembar dan kunjungan terbuka ganda di hari yang sama.', 'Including duplicate bookings and two open visits for one patient on one day.')],
  ]

  const aturanMedis = [
    t('Kunjungan tidak bisa ditutup tanpa diagnosis.', 'A visit cannot close without a diagnosis.'),
    t('Rekam medis yang sudah ditutup hanya bisa ditambahi adendum, tidak disunting.', 'A closed record can only receive an addendum, never an edit.'),
    t('Resep yang sudah difinalkan hanya bisa dibatalkan lalu ditulis ulang.', 'A finalised prescription can only be cancelled and rewritten.'),
    t('Farmasi tidak bisa menambah obat yang tidak ditulis dokter.', 'Pharmacy cannot add a drug the doctor did not write.'),
    t('Satu pasien tidak boleh punya dua kunjungan terbuka di hari yang sama.', 'One patient cannot hold two open visits on the same day.'),
    t('Data tiap fasilitas terisolasi di level baris, bukan disaring aplikasi.', 'Each facility data is isolated at row level, not filtered by the app.'),
  ]

  /* ── Perbandingan jujur ── */
  const banding = {
    kolom: [t('Buku & Excel', 'Books & Excel'), t('Aplikasi kasir umum', 'Generic POS'), 'Sehatera'],
    baris: [
      [t('Stok per batch dan tanggal kadaluarsa', 'Stock per batch and expiry date'), 0, 1, 2],
      [t('Laporan SIPNAP siap cetak', 'Print ready SIPNAP report'), 0, 0, 2],
      [t('Rekam medis SOAP dengan ICD-10 resmi', 'SOAP records with official ICD-10'), 0, 0, 2],
      [t('Satu tagihan per kunjungan', 'One bill per visit'), 0, 0, 2],
      [t('Klaim penjamin terlacak sampai dibayar', 'Payer claims tracked until paid'), 0, 0, 2],
      [t('Hak akses ditegakkan di database', 'Permissions enforced in the database'), 0, 1, 2],
      [t('Beberapa cabang dalam satu langganan', 'Several branches in one subscription'), 0, 1, 2],
      [t('Bentuk data mengikuti SatuSehat & BPJS', 'Data shaped for SatuSehat & BPJS'), 0, 0, 2],
    ] as [string, number, number, number][],
  }

  /* ── Tanya jawab. Ini bagian yang dipakai menutup penjualan. ── */
  const faq = [
    [t('Data lama kami di Excel dan buku. Harus diketik ulang?', 'Our old data is in Excel and notebooks. Do we retype it?'),
     t('Tidak. Unduh template, isi di Excel, lalu unggah CSV: produk, supplier, stok awal, sampai saldo hutang langsung masuk. Yang biasanya makan berhari-hari input manual selesai dalam satu sesi pendampingan. Datanya juga bisa diekspor keluar kapan saja, jadi Anda tidak terkunci.',
       'No. Download a template, fill it in Excel, then upload the CSV: products, suppliers, opening stock, even outstanding debts come straight in. What normally takes days of typing finishes in one assisted session. Data can also be exported out at any time, so you are not locked in.')],
    [t('Apakah sudah terhubung SatuSehat dan BPJS?', 'Is it connected to SatuSehat and BPJS yet?'),
     t('Belum, dan kami menuliskannya apa adanya di dalam aplikasi. Yang SUDAH ada: bentuk datanya mengikuti keduanya (ICD-10 resmi, ICD-9-CM, tanda vital berkode LOINC, alamat berkolom), tempat menyimpan kredensial tiap faskes secara terenkripsi, dan mesin antrean kirim yang idempoten. Yang ditunggu kredensial resmi milik faskes Anda. Menambah kolom kosong belakangan itu murah; data yang terlanjur terkumpul setahun dalam bentuk yang tidak bisa dikirim tidak bisa diperbaiki tanpa mengetik ulang.',
       'Not yet, and we say so inside the app. What EXISTS: the data shape follows both (official ICD-10, ICD-9-CM, LOINC coded vitals, columnar addresses), an encrypted per facility credential store, and an idempotent outbound queue. What is missing is your facility own official credentials. Adding an empty column later is cheap; a year of data collected in an unsendable shape cannot be fixed without retyping it.')],
    [t('Kalau internet mati, apotek berhenti?', 'If the internet drops, does the pharmacy stop?'),
     t('Sehatera berjalan di peramban dan memang butuh internet. Yang perlu disiapkan tiap faskes cuma satu: tethering ponsel sebagai cadangan. Sebagai gantinya, datanya tidak tinggal di komputer kasir, jadi komputer yang rusak, hilang, atau kena virus tidak membawa serta pembukuan Anda.',
       'Sehatera runs in the browser and does need internet. Every facility needs one fallback: phone tethering. In exchange, the data does not live on the till PC, so a machine that breaks, is stolen, or catches a virus does not take your books with it.')],
    [t('Siapa yang bisa melihat data pasien kami?', 'Who can see our patient data?'),
     t('Tiap fasilitas terisolasi di level baris di database, bukan disaring oleh aplikasi, jadi kueri dari faskes lain tidak mengembalikan baris Anda sama sekali. Di dalam faskes, hak akses dipegang sepuluh fungsi medis yang memeriksa peran di dalam dirinya. Nama pasien di layar ruang tunggu disamarkan di database, jadi nama lengkap tidak pernah sampai ke televisi ruang tunggu.',
       'Each facility is isolated at row level in the database rather than filtered by the app, so a query from another facility returns none of your rows. Inside the facility, permissions live inside ten clinical functions that check the role themselves. Waiting room names are masked in the database, so full names never reach the TV.')],
    [t('Kami punya dua cabang. Perlu dua langganan?', 'We have two branches. Do we need two subscriptions?'),
     t('Tidak. Outlet kedua mewarisi paket dan masa aktif dari yang pertama, jumlahnya dibatasi kuota paket. Tiap outlet tetap punya stok, penanggung jawab, dan laporan SIPNAP sendiri, karena memang begitu aturannya dilaporkan. Satu orang boleh memegang beberapa outlet dengan peran yang berbeda di masing-masing.',
       'No. A second outlet inherits the plan and validity from the first, with the count capped by the plan quota. Each outlet keeps its own stock, person in charge, and SIPNAP report, because that is how the regulation is filed. One person may hold several outlets with a different role in each.')],
    [t('Berapa lama sampai bisa dipakai?', 'How long until we can use it?'),
     t('Pendaftaran mandiri langsung jadi dan ada masa coba. Yang menentukan lamanya adalah data awal: kalau katalog dan stok sudah rapi di Excel, satu sesi pendampingan cukup. Aktivasi, impor data awal, pengaturan poli, tarif, dan peran staf dibantu langsung oleh tim Seawise.',
       'Self service registration is instant and comes with a trial. What sets the pace is your starting data: if the catalog and stock are tidy in Excel, one assisted session is enough. Activation, initial import, unit setup, tariffs, and staff roles are handled with the Seawise team.')],
    [t('Kalau langganan kami lewat masa aktif, data hilang?', 'If our subscription lapses, do we lose the data?'),
     t('Tidak, dan aplikasinya tidak dikunci. Yang berhenti hanya transaksi baru. Apotek yang lewat masa aktifnya masih punya kewajiban SIPNAP bulan itu, masih perlu mencetak ulang faktur, dan masih perlu melihat kartu stoknya. Mengunci semuanya berarti menghukum kewajiban hukum yang tidak ikut berhenti.',
       'No, and the app is not locked. Only new transactions stop. A lapsed pharmacy still owes that month SIPNAP report, still needs to reprint invoices, and still needs its stock cards. Locking everything would punish legal duties that do not pause.')],
    [t('Ada pemeriksaan interaksi obat?', 'Is there a drug interaction checker?'),
     t('Sengaja tidak, dan itu dikatakan di layar resep, bukan didiamkan. Pemeriksaan interaksi butuh basis data yang dirawat terus menerus, dan yang setengah benar lebih berbahaya daripada tidak ada karena orang mulai memercayainya. Alasan yang sama membuat kami tidak menerjemahkan 18.543 nama diagnosis dengan mesin.',
       'Deliberately not, and the prescription screen says so rather than staying quiet. Interaction checking needs a continuously maintained database, and half correct is more dangerous than absent because people start trusting it. The same reason keeps us from machine translating 18,543 diagnosis names.')],
  ]

  return (
    <div className="kn-ambient min-h-screen text-[var(--ink)]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Nav */}
      <nav className="kn-nav sticky top-0 z-30 bg-[var(--surface)]/70 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mark size={36} />
            <div className="leading-tight"><div className="font-bold text-sm">Sehatera</div><div className="text-[10px] text-[var(--ink-faint)]">by Seawise Studio</div></div>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <a href="/" className="hidden lg:inline text-sm font-medium text-[var(--brand)] px-3 py-2">{t('Masuk', 'Sign In')}</a>
            <a href={wa(t('Halo Seawise, saya ingin bertanya tentang Sehatera.', 'Hello Seawise, I would like to ask about Sehatera.'))}
               target="_blank" rel="noopener noreferrer"
               className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] border border-[var(--line)] bg-[var(--surface)]/70 px-3.5 py-2 rounded-xl hover:bg-[var(--surface)] transition">
              <MessageCircle size={15} /> {t('Hubungi Tim', 'Talk to Us')}
            </a>
            <a href="/" className="text-sm font-semibold bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-xl hover:bg-[var(--brand-hover)] transition">{t('Daftar Sekarang', 'Get Started')}</a>
          </div>
        </div>
      </nav>

      {/* Peta bab. Dipakai saat presentasi untuk melompat ke bagian yang
          ditanyakan calon klien, bukan menggulung dari awal tiap kali. */}
      <div className="kn-nav sticky top-16 z-20 bg-[var(--surface)]/50 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 h-11 flex items-center gap-1 overflow-x-auto kn-rail">
          {bab.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--brand)] hover:bg-[var(--surface)]/70 px-3 py-1.5 rounded-lg transition whitespace-nowrap">{label}</a>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-5 pt-16 sm:pt-24 pb-14 text-center">
        <p className="reveal text-[var(--accent)] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-5">{t('Sistem Manajemen Fasilitas Kesehatan', 'Healthcare Facility Management System')}</p>
        <h1 className="reveal kn-headline text-4xl sm:text-6xl md:text-7xl font-bold mb-6" style={{ transitionDelay: '.05s' }}>
          {t('Apotek, klinik,', 'Pharmacy, clinic,')}<br />{t('rumah sakit. Satu sistem.', 'hospital. One system.')}
        </h1>
        <p className="reveal text-lg sm:text-xl text-[var(--ink-mid)] max-w-2xl mx-auto mb-7" style={{ transitionDelay: '.1s' }}>
          {t('Pendaftaran, antrean, rekam medis, e-resep, lab, kasir, klaim penjamin, stok obat, dan laporan wajib. Semuanya dalam satu aplikasi, dan aturannya ditegakkan di database, bukan sekadar di layar.',
             'Registration, queues, medical records, e-prescriptions, lab, POS, payer claims, drug stock, and mandatory reports. All in one app, with the rules enforced in the database rather than merely on screen.')}
        </p>
        <div className="reveal flex flex-wrap items-center justify-center gap-2 mb-8" style={{ transitionDelay: '.12s' }}>
          <Chip><BadgeCheck size={13} className="text-[var(--brand-soft)]" /> {t('18.543 kode ICD-10 resmi Kemenkes', '18,543 official ICD-10 codes')}</Chip>
          <Chip><BadgeCheck size={13} className="text-[var(--brand-soft)]" /> {t('4.626 kode ICD-9-CM', '4,626 ICD-9-CM codes')}</Chip>
          <Chip><ShieldCheck size={13} className="text-[var(--brand-soft)]" /> {t('Data tiap faskes terisolasi', 'Per facility data isolation')}</Chip>
          <Chip><Languages size={13} className="text-[var(--brand-soft)]" /> {t('Dwibahasa ID / EN', 'Bilingual ID / EN')}</Chip>
        </div>
        <div className="reveal flex items-center justify-center gap-3 mb-14" style={{ transitionDelay: '.15s' }}>
          <a href="/" className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-6 py-3 rounded-xl font-semibold hover:bg-[var(--brand-hover)] transition">{t('Coba Sekarang', 'Try Now')} <ArrowRight size={17} /></a>
          <a href={wa(t('Halo Seawise, saya ingin dijadwalkan demo Sehatera.', 'Hello Seawise, I would like to schedule a Sehatera demo.'))}
             target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-[var(--line)] bg-[var(--surface)]/60 hover:bg-[var(--surface)] transition">
            <MessageCircle size={17} /> {t('Minta Demo', 'Request a Demo')}
          </a>
          <a href="#harga" className="hidden sm:inline px-6 py-3 rounded-xl font-semibold border border-[var(--line)] hover:bg-[var(--surface)]/60 transition">{t('Lihat Harga', 'See Pricing')}</a>
        </div>
        <div className="reveal px-2 sm:px-8 pb-10" style={{ transitionDelay: '.2s' }}>
          <DeviceShowcase t={t} />
        </div>
      </header>

      {/* Untuk siapa */}
      <section id="untuk-siapa" className="max-w-6xl mx-auto px-5 py-16 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Bentuk faskes menentukan menunya.', 'The facility type decides the menu.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg max-w-2xl mx-auto mb-10" style={{ transitionDelay: '.05s' }}>
          {t('Apotek berpaket tertinggi tetap tidak melihat Antrean Pasien, karena ia memang tidak punya antrean pasien, bukan karena paketnya kurang.',
             'A pharmacy on the top plan still never sees Patient Queue, because it has no patient queue, not because its plan falls short.')}
        </p>
        <div className="reveal flex justify-center gap-2 mb-8">
          {(['apotek', 'klinik', 'rumah_sakit'] as const).map(k => {
            const D = sektorData[k]
            return (
              <button key={k} onClick={() => setSektor(k)}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${sektor === k ? 'bg-[var(--brand)] text-[var(--on-brand)] border-transparent' : 'bg-[var(--surface)]/70 text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--surface)]'}`}>
                <D.Icon size={16} /> {D.nama}
              </button>
            )
          })}
        </div>
        <div className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-3xl p-6 sm:p-9">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center mb-4"><S.Icon size={22} /></div>
              <h3 className="kn-headline text-2xl font-bold mb-2">{S.nama}</h3>
              <p className="text-[var(--ink-mid)] leading-relaxed mb-5">{S.ringkas}</p>
              <div className="rounded-2xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)]/70 px-4 py-3">
                <p className="text-sm text-[var(--ink-mid)] leading-relaxed">{S.khas}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-3">{t('Menu yang didapat', 'Menus included')}</p>
              <div className="flex flex-wrap gap-2">
                {S.modul.map(m => <Chip key={m}><Check size={12} className="text-[var(--brand-soft)]" /> {m}</Chip>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Masalah (gelap) */}
      <section className="kn-dark text-white py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-6">{t('Yang menggerus untung, diam-diam.', 'What quietly eats the margin.')}</h2>
          <p className="reveal text-[var(--on-brand-soft)] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>{t('Enam kebocoran yang tidak pernah dilaporkan sebagai keluhan, karena tidak ada yang menyadarinya sampai audit atau tutup buku.', 'Six leaks nobody reports as a complaint, because nobody notices until the audit or the monthly close.')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {[
              [t('Obat kadaluarsa terbuang', 'Expired medicine wasted'), t('Tanpa pantauan batch dan tanggal, stok mati baru ketahuan saat mau dijual.', 'Without batch and date tracking, dead stock is found only when someone tries to sell it.')],
              [t('Laporan SIPNAP manual', 'Manual SIPNAP reports'), t('Rekap narkotika dan psikotropika makan satu malam penuh, dan rawan salah.', 'Narcotics and psychotropics recaps eat a whole evening, and go wrong easily.')],
              [t('Faktur jatuh tempo terlewat', 'Missed invoice due dates'), t('Hutang supplier tercecer di beberapa buku, denda datang belakangan.', 'Supplier debts scattered across notebooks, penalties arrive later.')],
              [t('Rekam medis di kertas', 'Records on paper'), t('Riwayat pasien tahun lalu ada di lemari, dan tidak terbaca saat dibutuhkan.', 'Last year history sits in a cabinet, unreadable when it matters.')],
              [t('Tagihan pasien kurang satu baris', 'A bill missing one line'), t('Tindakan yang belum dimasukkan saat kasir menagih tidak pernah tertagih lagi.', 'A procedure not yet entered when the cashier bills is never billed at all.')],
              [t('Klaim penjamin tidak terlacak', 'Untracked payer claims'), t('Tidak ada yang tahu klaim mana sudah dikirim dan berapa yang belum dibayar.', 'Nobody knows which claims were sent or how much is still unpaid.')],
            ].map((p, i) => (
              <div key={i} className="reveal bg-white/[0.06] border border-white/10 rounded-2xl p-6" style={{ transitionDelay: `${(i % 3) * .07}s` }}>
                <p className="font-semibold text-lg mb-1.5">{p[0]}</p>
                <p className="text-[var(--on-brand-soft)] text-sm leading-relaxed">{p[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur satu pasien */}
      <section id="alur" className="max-w-6xl mx-auto px-5 py-20 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Satu pasien, dari memesan sampai klaim dibayar.', 'One patient, from booking to a paid claim.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>
          {t('Sembilan langkah, dan tiap langkah ditulis oleh orang yang benar-benar mengerjakannya.', 'Nine steps, each written by whoever actually did the work.')}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alur.map((a, i) => (
            <div key={i} className="reveal relative bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-2xl p-5 pl-6" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
              <span className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-[var(--brand-soft)]/40" />
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center shrink-0"><a.Icon size={16} /></span>
                <div className="min-w-0">
                  <p className="font-bold text-[15px] leading-tight">{i + 1}. {a.judul}</p>
                  <p className="text-[11px] text-[var(--accent)] font-medium">{a.siapa}</p>
                </div>
              </div>
              <p className="text-[var(--ink-soft)] text-sm leading-relaxed">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sorotan modul */}
      <section id="modul" className="pb-8 scroll-mt-28">
        {spotlights.map((s, i) => (
          <div key={i}>
            {s.bab && <Bab no={s.bab[0]} judul={s.bab[1]} ringkas={s.bab[2]} />}
            <div className="max-w-6xl mx-auto px-5 py-12 sm:py-16">
              <div className={`grid md:grid-cols-2 gap-10 sm:gap-14 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="reveal">
                  <p className="inline-flex items-center gap-2 text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-3"><s.Icon size={14} /> {s.tag}</p>
                  <h3 className="kn-headline text-3xl sm:text-4xl font-bold mb-4">{s.title}</h3>
                  <p className="text-[var(--ink-mid)] text-[17px] leading-relaxed">{s.body}</p>
                </div>
                <div className="reveal" style={{ transitionDelay: '.08s' }}>{s.visual}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Daftar modul lengkap */}
      <section className="max-w-6xl mx-auto px-5 py-16 border-t border-[var(--line)]">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Dua puluh empat modul, satu langganan.', 'Twenty four modules, one subscription.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-12" style={{ transitionDelay: '.05s' }}>{t('Yang ada di daftar ini benar-benar ada di dalam aplikasi hari ini.', 'Everything on this list genuinely exists in the app today.')}</p>
        <div className="space-y-10">
          {kelompokModul.map((k, ki) => (
            <div key={ki}>
              <p className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-4">{k.judul}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {k.items.map(([Ic, judul, d], i) => (
                  <div key={i} className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-2xl p-5" style={{ transitionDelay: `${(i % 3) * .05}s` }}>
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center mb-3"><Ic size={18} /></div>
                    <p className="font-bold mb-1">{judul}</p>
                    <p className="text-[var(--ink-soft)] text-sm leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Yang ditegakkan database */}
      <section id="aturan" className="kn-dark text-white py-20 sm:py-24 scroll-mt-28">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="reveal text-[var(--on-brand-soft)] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t('Yang ditegakkan, bukan diingatkan', 'Enforced, not reminded')}</p>
            <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-4" style={{ transitionDelay: '.05s' }}>{t('Aturannya ada di database, bukan di layar.', 'The rules live in the database, not on screen.')}</h2>
            <p className="reveal text-[var(--on-brand-soft)] text-lg max-w-3xl mx-auto" style={{ transitionDelay: '.1s' }}>
              {t('Pengecekan yang cuma ada di formulir akan dilewati oleh impor CSV massal, oleh alamat yang diketik langsung, dan oleh layar berikutnya yang lupa memeriksa. Di sini penolakannya keluar dari database dengan kodenya sendiri, dan kalimatnya sudah ditulis untuk pemilik faskes, bukan untuk programmer.',
                 'A check that lives only in the form is bypassed by a bulk CSV import, by a typed URL, and by the next screen that forgets to look. Here the refusal comes from the database with its own code, and the wording is written for the facility owner, not for a programmer.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {aturan.map(([kode, judul, d], i) => (
              <div key={i} className="reveal bg-white/[0.06] border border-white/10 rounded-2xl p-5" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
                <span className="inline-block font-mono text-[10px] tracking-widest text-[var(--accent)] border border-white/15 rounded px-1.5 py-0.5 mb-2.5">{kode}</span>
                <p className="font-semibold mb-1">{judul}</p>
                <p className="text-[var(--on-brand-soft)] text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <div className="reveal bg-white/[0.06] border border-white/10 rounded-2xl p-6">
            <p className="font-semibold mb-4">{t('Enam aturan medis yang tidak bisa diakali dari layar mana pun', 'Six clinical rules no screen can talk its way around')}</p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {aturanMedis.map((a, i) => (
                <p key={i} className="flex items-start gap-2 text-[var(--on-brand-soft)] text-sm leading-relaxed"><Lock size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" /> {a}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perbandingan */}
      <section id="banding" className="max-w-5xl mx-auto px-5 py-20 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Kenapa bukan Excel, dan kenapa bukan aplikasi kasir biasa.', 'Why not Excel, and why not a generic POS.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-10" style={{ transitionDelay: '.05s' }}>{t('Keduanya bisa mencatat penjualan. Yang tidak bisa mereka lakukan ada di bawah ini.', 'Both can record a sale. What they cannot do is listed below.')}</p>
        <div className="reveal overflow-x-auto rounded-2xl border border-white/60 bg-[var(--surface)]/70 shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="text-left font-semibold p-4 text-[var(--ink-soft)]">{t('Kemampuan', 'Capability')}</th>
                {banding.kolom.map((k, i) => (
                  <th key={i} className={`p-4 font-semibold w-32 ${i === 2 ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banding.baris.map((r, i) => (
                <tr key={i} className="border-b border-[var(--line-soft)] last:border-0">
                  <td className="p-4 text-[var(--ink)]">{r[0]}</td>
                  {[r[1], r[2], r[3]].map((v, j) => (
                    <td key={j} className={`p-4 text-center ${j === 2 ? 'bg-[var(--surface-2)]/60' : ''}`}>
                      {v === 2 ? <Check size={18} className="inline text-green-600" />
                        : v === 1 ? <span className="text-[10px] text-amber-700 font-medium">{t('sebagian', 'partial')}</span>
                        : <X size={16} className="inline text-[var(--ink-faint)]" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SatuSehat & BPJS, apa adanya */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-3xl p-7 sm:p-10">
          <p className="text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-3">{t('Jalan ke sistem nasional', 'The road to national systems')}</p>
          <h2 className="kn-headline text-2xl sm:text-3xl font-bold mb-4">{t('Bentuk datanya sudah menuruti SatuSehat dan BPJS. Pengirimannya belum menyala.', 'The data already follows SatuSehat and BPJS. The sending is not switched on yet.')}</h2>
          <p className="text-[var(--ink-mid)] leading-relaxed mb-7 max-w-3xl">
            {t('Kami menuliskannya apa adanya, termasuk di dalam aplikasi, karena yang dijual tanpa barang bukan kelalaian teknis melainkan janji yang tidak ditepati. Menambah kolom kosong belakangan itu murah; data yang terlanjur terkumpul setahun dalam bentuk yang tidak bisa dikirim tidak bisa diperbaiki tanpa mengetik ulang seluruhnya.',
               'We say this plainly, including inside the app, because selling what does not exist is not a technical oversight but a broken promise. Adding an empty column later is cheap; a year of data collected in an unsendable shape cannot be fixed without retyping all of it.')}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              { Ic: BadgeCheck, judul: t('Diagnosis berkode ICD-10', 'ICD-10 coded diagnoses'),  d: t('Satu payload Condition hanya membawa satu kode, dan tabelnya memang sudah satu baris per kode.', 'One Condition payload carries one code, and the table is already one row per code.') },
              { Ic: BadgeCheck, judul: t('Tindakan berkode ICD-9-CM', 'ICD-9-CM coded procedures'),  d: t('Menempel di katalog layanan, ikut sendiri ke tagihan kunjungan, lengkap dengan siapa yang mengerjakan.', 'Attached to the service catalog, flowing into the visit bill along with who performed it.') },
              { Ic: BadgeCheck, judul: t('Tanda vital berkolom LOINC', 'LOINC coded vitals'),  d: t('Tiap kolom membawa kodenya sendiri, jadi tidak ada yang perlu ditebak saat dipetakan.', 'Each column carries its own code, so nothing needs guessing when it is mapped.') },
              { Ic: Lock, judul: t('Kredensial per faskes, terenkripsi', 'Encrypted per facility credentials'),  d: t('Disimpan di brankas rahasia, bukan polos di pengaturan, dan tidak bisa dibaca balik dari layar.', 'Kept in a secret vault, not plain in settings, and never readable back from a screen.') },
            ].map(({ Ic, judul, d }, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center shrink-0"><Ic size={16} /></span>
                <div><p className="font-semibold text-[15px]">{judul}</p><p className="text-[var(--ink-soft)] text-sm leading-relaxed">{d}</p></div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)]/70 px-4 py-3">
            <p className="text-sm text-[var(--ink-mid)] leading-relaxed">
              {t('Yang ditunggu adalah kredensial resmi milik faskes Anda, yang memang diberikan per fasilitas dan bukan per vendor. Begitu terbit, mesin antrean kirimnya sudah menunggu: idempoten, menyimpan payload sebagai cuplikan, dan mundur berlipat kalau jaringan Kemenkes sedang penuh.',
                 'What we wait for is your facility own official credentials, which are issued per facility and never per vendor. Once issued, the outbound queue is already waiting: idempotent, storing payloads as snapshots, and backing off exponentially when the ministry network is busy.')}
            </p>
          </div>
        </div>
      </section>

      {/* Harga.
          Angkanya dibaca dari tabel `plans`, bukan ditulis di sini. Halaman ini
          dulu memasang dua angka yang tidak ada di database dan tidak pernah
          ditagihkan; siapa pun yang membacanya lalu mendaftar akan menemukan
          harga yang sama sekali lain begitu masuk. */}
      <section id="harga" className="kn-dark text-white py-20 sm:py-28 scroll-mt-28">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="reveal text-[var(--on-brand-soft)] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t('Harga', 'Pricing')}</p>
            <h2 className="reveal kn-headline text-4xl sm:text-5xl font-bold mb-3" style={{ transitionDelay: '.05s' }}>
              {t('Bayar sesuai ukuran faskes Anda', 'Pay for the size of your facility')}
            </h2>
            <p className="reveal text-[var(--on-brand-soft)] text-lg" style={{ transitionDelay: '.1s' }}>
              {t('Naik paket saat faskes Anda tumbuh, bukan sebelum itu.', 'Move up when your facility grows, not before.')}
            </p>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <DaftarPaket nada="gelap" />
          </div>
          <div className="reveal mt-8 grid sm:grid-cols-3 gap-4 text-sm">
            {[
              [t('Masa coba lebih dulu', 'Trial first'), t('Daftar sendiri, pakai dulu dengan data Anda sendiri, baru putuskan.', 'Register yourself, use it with your own data, then decide.')],
              [t('Kuota benar-benar ditegakkan', 'Quotas genuinely enforced'), t('Produk, pengguna, dan cabang dibatasi paket lewat trigger database, jadi angkanya bukan sekadar tulisan di halaman ini.', 'Products, users, and branches are capped by plan through database triggers, so these numbers are not just words on this page.')],
              [t('Klinik dan rumah sakit', 'Clinics and hospitals'), t('Modul kliniknya sudah utuh, tapi harganya per penawaran karena kewajiban hukum dan pemasangannya berbeda tiap faskes. Hubungi tim Seawise.', 'The clinical modules are complete, but pricing is by quotation because legal duties and setup differ per facility. Talk to the Seawise team.')],
            ].map((c, i) => (
              <div key={i} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                <p className="font-semibold mb-1">{c[0]}</p>
                <p className="text-[var(--on-brand-soft)] leading-relaxed">{c[1]}</p>
              </div>
            ))}
          </div>
          <div className="reveal flex flex-wrap items-center justify-center gap-3 mt-10" style={{ transitionDelay: '.25s' }}>
            <a href="/" className="inline-flex items-center gap-2 bg-[var(--surface)] text-[var(--brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--line-soft)] transition">
              {t('Daftarkan Faskes Sekarang', 'Register Your Facility Now')} <ArrowRight size={18} />
            </a>
            <a href={wa(t('Halo Seawise, saya ingin penawaran Sehatera untuk klinik atau rumah sakit.', 'Hello Seawise, I would like a Sehatera quotation for a clinic or hospital.'))}
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 border border-white/25 text-white px-7 py-3.5 rounded-xl font-bold hover:bg-white/10 transition">
              <MessageCircle size={18} /> {t('Minta Penawaran Klinik', 'Request a Clinic Quote')}
            </a>
          </div>
        </div>
      </section>

      {/* Tanya jawab */}
      <section id="tanya-jawab" className="max-w-3xl mx-auto px-5 py-20 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Yang biasanya ditanyakan.', 'What people usually ask.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-10" style={{ transitionDelay: '.05s' }}>{t('Termasuk yang jawabannya belum enak, karena itu yang menentukan apakah kami layak dipercaya.', 'Including the ones with uncomfortable answers, because those decide whether we are worth trusting.')}</p>
        <div className="space-y-3">
          {faq.map(([q, a], i) => (
            <div key={i} className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-2xl overflow-hidden">
              <button onClick={() => setTanya(tanya === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-[var(--surface)] transition">
                <span className="font-semibold text-[15px]">{q}</span>
                <ChevronDown size={18} className={`shrink-0 text-[var(--ink-faint)] transition-transform ${tanya === i ? 'rotate-180' : ''}`} />
              </button>
              {tanya === i && (
                <p className="px-5 pb-5 -mt-1 text-[var(--ink-soft)] leading-relaxed">{a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Penutup */}
      <section className="max-w-4xl mx-auto px-5 pb-24 text-center">
        <div className="reveal bg-[var(--surface)]/70 border border-white/60 shadow-sm rounded-3xl px-6 py-14 sm:px-12">
          <h2 className="kn-headline text-3xl sm:text-5xl font-bold mb-5">{t('Siap membuat faskes lebih tenang?', 'Ready for a calmer facility?')}</h2>
          <p className="text-[var(--ink-mid)] text-lg mb-8 max-w-2xl mx-auto">
            {t('Mulai hari ini dengan masa coba. Aktivasi, impor data awal, pengaturan poli dan tarif, sampai pembagian peran staf dibantu langsung oleh tim Seawise.',
               'Start today on a trial. Activation, initial data import, unit and tariff setup, and staff role assignment are handled with the Seawise team.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/" className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--brand-hover)] transition">{t('Mulai Sekarang', 'Start Now')} <ArrowRight size={18} /></a>
            <a href={wa(t('Halo Seawise, saya ingin dijadwalkan demo Sehatera.', 'Hello Seawise, I would like to schedule a Sehatera demo.'))}
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-[var(--line)] hover:bg-[var(--surface)] transition">
              <MessageCircle size={18} /> {t('Bicara dengan Tim', 'Talk to the Team')}
            </a>
          </div>
          {/* Nomornya ditulis terbaca, bukan cuma disembunyikan di balik tombol.
              Yang membuka halaman ini dari komputer meja sering menyimpannya
              untuk ditelepon nanti, dan tautan wa.me di sana membuka WhatsApp
              Web yang belum tentu pernah ia pasang. */}
          <p className="mt-6 text-sm text-[var(--ink-faint)]">
            {t('WhatsApp', 'WhatsApp')} <a href={wa(t('Halo Seawise, saya ingin bertanya tentang Sehatera.', 'Hello Seawise, I would like to ask about Sehatera.'))} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--brand)] hover:underline underline-offset-4">0812 3759 7759</a>
          </p>
        </div>
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
