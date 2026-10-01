'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight, Award, BadgeCheck, BarChart2, Building2, CalendarClock, Check,
  ChevronDown, ClipboardCheck, ClipboardList, Database, FileCheck, FileText,
  FlaskConical, GitBranch, HeartPulse, Hospital, Languages, LayoutDashboard,
  Lock, Menu, Microscope, PackageOpen, Pill, Receipt, ScanLine, Settings,
  ShieldCheck, ShoppingCart, Stethoscope, Store, Syringe, TrendingUp, Tv,
  MessageCircle, UsersRound, Volume2, Wallet, Wand2, X, Banknote, ArrowLeftRight, KeyRound
} from 'lucide-react'
import { Mark } from '../../components/Logo'
import DaftarPaket from '../../components/DaftarPaket'
import { useLang, LangToggle } from '../../lib/i18n'

const CSS = `
/* Latar halaman memakai resep yang SAMA dengan .sw-ambient di globals.css:
   tiga radial dari gradien identitas tema, di atas --paper. Versi sebelumnya
   menanam hijau dan krem sebagai hex, warisan TokoKu, jadi halaman jualan
   berdiri di atas warna yang tidak ada di aplikasinya. Pada tema bawaan yang
   maroon, hasilnya dua sistem warna dalam satu layar. */
.kn-ambient {
  background:
    radial-gradient(1100px 560px at 8% -8%, var(--grad-1) 0%, transparent 55%),
    radial-gradient(1000px 520px at 102% -4%, var(--grad-2) 0%, transparent 52%),
    radial-gradient(900px 720px at 104% 60%, var(--grad-3) 0%, transparent 55%),
    var(--paper);
}
/* Bagian gelap mengikuti keluarga --brand, bukan hijau tetap. Teks di atasnya
   memakai --on-brand, bukan putih, karena --brand tema Clean Slate jauh lebih
   terang daripada tema lain. */
.kn-dark { background: linear-gradient(160deg, var(--brand-hover) 0%, var(--brand) 52%, var(--brand-soft) 100%); }
.reveal { opacity:0; transform: translateY(18px); transition: opacity .45s cubic-bezier(.22,.61,.36,1), transform .45s cubic-bezier(.22,.61,.36,1); }
.reveal.in { opacity:1; transform:none; }
.kn-nav { backdrop-filter: saturate(160%) blur(12px); -webkit-backdrop-filter: saturate(160%) blur(12px); }
.kn-win { box-shadow: 0 40px 90px -30px rgba(0,0,0,.42); }
.kn-headline { letter-spacing:-0.02em; line-height:1.02; }
@media (prefers-reduced-motion: reduce){ .reveal{ opacity:1; transform:none; transition:none; } }
/* Rel bab di bawah nav. Batang gulungnya disembunyikan: ia muncul di tengah
   presentasi dan tidak ada yang menggulungnya dengan tetikus di layar lebar. */
.kn-rail{ scrollbar-width:none; -ms-overflow-style:none; }
.kn-rail::-webkit-scrollbar{ display:none; }

/* ── Panggung perangkat (MacBook Pro + iPhone Pro) ──
   Warna BODI perangkatnya sengaja tetap hex abu gelap: laptop dan ponsel
   sungguhan tidak ikut berganti tema. Yang ada DI DALAM layarnya memakai
   token, karena itu memang aplikasinya. */
.dev-stage{ position:relative; max-width:720px; margin:0 auto; padding-bottom:1%; }
.macbook{ position:relative; width:80%; }
.mb-lid{ background:#0a0b0d; border:1px solid #34373c; border-radius:11px 11px 5px 5px; padding:0.85% 0.85% 1.5%; box-shadow:0 46px 86px -32px rgba(0,0,0,.38); }
.mb-cam{ display:block; width:4px; height:4px; margin:0 auto 0.6%; border-radius:50%; background:#141619; box-shadow:inset 0 0 0 1px #2c2f34; }
.mb-screen{ border-radius:5px; overflow:hidden; background:var(--paper); aspect-ratio:16/10.2; }
.mb-deck{ position:relative; width:113%; margin-left:-6.5%; height:clamp(11px,2.1vw,22px); background:linear-gradient(180deg,#4a4d53 0%,#303338 42%,#191a1d 100%); border-radius:3px 3px 11px 11px; box-shadow:0 22px 30px -14px rgba(0,0,0,.26); }
.mb-deck::before{ content:''; position:absolute; left:0; right:0; top:0; height:1.5px; background:rgba(255,255,255,.22); border-radius:3px 3px 0 0; }
.mb-groove{ position:absolute; top:0; left:50%; transform:translateX(-50%); width:13%; height:46%; background:#141619; border-radius:0 0 9px 9px; }
.iphone{ position:absolute; right:0; bottom:-9%; width:22.5%; min-width:134px; background:linear-gradient(150deg,#3b3e43 0%,#141518 62%); border-radius:26px; padding:1.4%; box-shadow:0 38px 62px -18px rgba(0,0,0,.42); z-index:5; }
.iphone-inner{ position:relative; background:var(--paper); border-radius:22px; overflow:hidden; aspect-ratio:9/19.5; }
.ip-island{ position:absolute; z-index:6; top:3.4%; left:50%; transform:translateX(-50%); width:30%; height:3%; background:#000; border-radius:20px; }
.ip-side{ position:absolute; background:#25272b; border-radius:2px; }
.ip-pw{ right:-2px; top:27%; width:2.5px; height:12%; }
.ip-cam{ right:-2px; top:43%; width:2.5px; height:7%; }
.ip-v1{ left:-2px; top:23%; width:2.5px; height:6%; }
.ip-v2{ left:-2px; top:32%; width:2.5px; height:9%; }
.ip-v3{ left:-2px; top:44%; width:2.5px; height:9%; }
@media (max-width:560px){ .macbook{ width:90%; } .iphone{ width:30%; right:-4%; bottom:-11%; } }
`

/**
 * Rangka layar aplikasi, dipakai SETIAP mokup di halaman ini.
 *
 * Sebelumnya tiap mokup punya rangkanya sendiri: sebagian memakai titik-titik
 * jendela macOS, sebagian tidak punya rangka sama sekali, dan ikon di rel
 * kirinya selalu empat ikon yang sama tidak peduli modul apa yang sedang
 * ditunjukkan. Hasilnya tujuh belas gambar yang tidak terlihat berasal dari
 * satu aplikasi, dan calon klien yang menggulung halaman ini tidak pernah
 * mengenali satu bentuk pun.
 *
 * Rangka ini menyalin bentuk `AppShell` yang sebenarnya: rel ikon sempit
 * bergradasi --brand seperti sidebar yang sedang dilipat, baris judul setinggi
 * topbar, isi di atas --paper. Menu yang aktif memakai --grad dan --on-grad,
 * persis aturan yang dipakai `ItemNav`.
 */
const REL: Ikon[] = [
  LayoutDashboard, CalendarClock, Stethoscope, UsersRound, FlaskConical,
  Microscope, Pill, ShoppingCart, BarChart2, Settings,
]

function AppWindow({ judul, sub, aktif = 0, children }: {
  judul: string
  sub?: string
  aktif?: number
  children: React.ReactNode
}) {
  return (
    <div className="kn-win rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surface)] w-full">
      <div className="flex items-stretch min-h-[236px]">
        {/* Rel ikon. Ini bentuk sidebar aplikasi saat dilipat, bukan hiasan. */}
        <div className="w-[52px] shrink-0 relative overflow-hidden bg-gradient-to-b from-[var(--brand)] via-[var(--brand-soft)] to-[var(--brand-hover)]">
         <div className="absolute inset-0 flex flex-col items-center py-2.5 gap-0.5">
          <span className="w-8 h-8 rounded-xl bg-[var(--on-brand)]/15 flex items-center justify-center mb-1.5 shrink-0">
            <Mark size={16} variant="mono" className="text-[var(--on-brand)]" />
          </span>
          {REL.map((I, i) => (
            <span key={i}
              className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${i === aktif ? 'shadow-sm' : 'text-[var(--on-brand-soft)]'}`}
              style={i === aktif ? { background: 'var(--grad)', color: 'var(--on-grad)' } : undefined}>
              <I size={15} />
            </span>
          ))}
         </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Baris judul, sepadan dengan topbar aplikasi. */}
          <div className="h-11 shrink-0 flex items-center gap-2 px-4 border-b border-[var(--line)] bg-[var(--surface)]">
            <p className="text-[13px] font-semibold text-[var(--ink)] truncate">{judul}</p>
            {sub && <>
              <span className="text-[var(--ink-faint)] text-[12px]">/</span>
              <p className="text-[12px] text-[var(--ink-soft)] truncate">{sub}</p>
            </>}
            <span className="ml-auto shrink-0 w-7 h-7 rounded-full bg-[var(--surface-2)] text-[var(--brand)] text-[10px] font-bold flex items-center justify-center">AB</span>
          </div>
          <div className="flex-1 p-4 bg-[var(--paper)]">{children}</div>
        </div>
      </div>
    </div>
  )
}


// Recreation Dashboard (di dalam layar MacBook) + Kasir mobile (di dalam iPhone)
function DeviceShowcase({ t }: { t: (id: string, en: string) => string }) {
  const nav = [
    [LayoutDashboard, t('Beranda', 'Home'), true],
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
    [CalendarClock, 'bg-[var(--accent-soft)] text-[var(--accent)]', t('KEDALUWARSA ≤60 HARI', 'EXPIRING ≤60 DAYS'), '3'],
    [Wallet, 'bg-[var(--surface-2)] text-[var(--accent)]', t('OMZET HARI INI', 'REVENUE TODAY'), 'Rp 10.095.000'],
  ] as const
  const sellers: [string, number][] = [['Sarung Tangan Latex (M)', 160], ['Tolak Angin Cair 15 ml', 10], ['Simvastatin 20 mg', 10], ['Konidin Tablet', 10]]
  const bars = [3, 3, 3, 3, 3, 2, 62]
  const cashItems: [string, string, string][] = [
    ['Sanmol Tablet 500 mg', t('Paracetamol · Stok: 300', 'Paracetamol · Stock: 300'), 'Rp 3.000'],
    ['Panadol Regular Caplet', t('Paracetamol · Stok: 240', 'Paracetamol · Stock: 240'), 'Rp 11.000'],
    ['Bodrex Tablet', t('Paracetamol + Kafein · Stok: 500', 'Paracetamol + Caffeine · Stock: 500'), 'Rp 5.500'],
    ['Darlie Routines Flu & Batuk', t('Paracetamol + Herbal · Stok: 200', 'Paracetamol + Herbal · Stock: 200'), 'Rp 4.800'],
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
              <p className="font-bold text-[var(--ink)] leading-none shrink-0" style={{ fontSize: 'clamp(11px,1.7vw,24px)' }}>{t('Beranda', 'Home')}</p>
              <p className="text-[var(--ink-soft)] mt-1 mb-[3%] shrink-0" style={{ fontSize: 'clamp(6px,0.78vw,11px)' }}>{t('Halo, apt. Anessa Beckham 👋, ringkasan aktivitas apotek hari ini', 'Hello, apt. Anessa Beckham 👋, today’s pharmacy summary')}</p>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-[2.2%] mb-[3%] shrink-0">
                {stats.map(([Ic, chip, label, val], i) => (
                  <div key={i} className="bg-[var(--surface)]/80 border border-[var(--line-soft)] rounded-lg px-[8%] py-[7%]">
                    <div className={`rounded-md flex items-center justify-center mb-[12%] ${chip}`} style={{ width: 'clamp(14px,1.7vw,28px)', height: 'clamp(14px,1.7vw,28px)' }}><Ic className="w-1/2 h-1/2" /></div>
                    <p className="text-[var(--ink-soft)] uppercase tracking-wide leading-tight" style={{ fontSize: 'clamp(4.5px,0.6vw,8px)' }}>{label}</p>
                    <p className="font-bold text-[var(--ink)] leading-tight mt-0.5" style={{ fontSize: 'clamp(7px,1vw,14px)' }}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Chart + Best sellers */}
              <div className="grid grid-cols-3 gap-[2.2%] flex-1 min-h-0">
                <div className="col-span-2 bg-[var(--surface)]/80 border border-[var(--line-soft)] rounded-lg p-[3.2%] flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-[2%] shrink-0">
                    <div>
                      <p className="font-bold text-[var(--ink)]" style={{ fontSize: 'clamp(6px,0.85vw,12px)' }}>{t('Penjualan 7 Hari Terakhir', 'Sales, Last 7 Days')}</p>
                      <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: 'clamp(4.5px,0.62vw,8px)' }}><span className="text-[var(--brand-soft)]">● {t('Omzet', 'Revenue')}</span><span className="text-[var(--accent)]">━ {t('Transaksi', 'Transactions')}</span></div>
                    </div>
                    <p className="font-bold text-[var(--brand)]" style={{ fontSize: 'clamp(6px,0.9vw,13px)' }}>Rp 10.095.000</p>
                  </div>
                  <svg viewBox="0 0 260 92" preserveAspectRatio="xMidYMid meet" className="w-full flex-1 min-h-0">
                    {[0, 0.5, 1].map((g, i) => <line key={i} x1="8" x2="252" y1={78 - g * 62} y2={78 - g * 62} stroke="var(--line-soft)" strokeWidth="1" />)}
                    {bars.map((h, i) => { const bh = (h / 62) * 62; return <rect key={i} x={14 + i * 34} y={78 - bh} width="17" height={bh} rx="3" fill="var(--brand)" /> })}
                    <path d="M22,75 L56,75 L90,75 L124,75 L158,75 L192,77 L226,16" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    {[[22, 75], [56, 75], [90, 75], [124, 75], [158, 75], [192, 77], [226, 16]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.8" />)}
                  </svg>
                </div>
                <div className="bg-[var(--surface)]/80 border border-[var(--line-soft)] rounded-lg p-[6%] min-h-0 overflow-hidden">
                  <p className="font-bold text-[var(--ink)] mb-[9%]" style={{ fontSize: 'clamp(6px,0.85vw,12px)' }}>{t('Produk Terlaris', 'Best Sellers')}</p>
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
            <p className="font-bold text-[var(--ink)]" style={{ fontSize: 'clamp(9px,2vw,15px)' }}>{t('Kasir', 'Cashier')}</p>
            <p className="text-[var(--ink-soft)] mb-[5%]" style={{ fontSize: 'clamp(5px,1.1vw,9px)' }}>{t('Transaksi penjualan obat', 'Medicine sales')}</p>
            <div className="bg-[var(--surface)]/80 border border-[var(--line-soft)] rounded-lg p-[4%]">
              <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 mb-[4%] text-[var(--ink)]" style={{ fontSize: 'clamp(6px,1.3vw,10px)' }}>Para</div>
              {cashItems.map(([nm, sub, pr], i) => (
                <div key={i} className="flex items-center justify-between py-[3%] border-b border-[var(--line-soft)] last:border-0">
                  <div className="min-w-0 pr-1"><p className="text-[var(--ink)] truncate" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}>{nm}</p><p className="text-[var(--ink-faint)] truncate" style={{ fontSize: 'clamp(4.5px,0.95vw,8px)' }}>{sub}</p></div>
                  <span className="text-[var(--ink)] shrink-0" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}>{pr}</span>
                </div>
              ))}
            </div>
            <div className="bg-[var(--surface)]/80 border border-[var(--line-soft)] rounded-lg p-[5%] mt-[5%]">
              <p className="font-bold text-[var(--ink)] mb-[5%]" style={{ fontSize: 'clamp(6px,1.4vw,11px)' }}>{t('Ringkasan Transaksi', 'Transaction Summary')}</p>
              <div className="flex justify-between text-[var(--ink-soft)] mb-1" style={{ fontSize: 'clamp(5.5px,1.2vw,10px)' }}><span>{t('Total Item', 'Total Items')}</span><span>{t('0 item', '0 items')}</span></div>
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
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sektor, tanya])

  /* ── Peta bab, dipakai nav lengket saat presentasi ── */
  const bab = [
    ['untuk-siapa', t('Untuk siapa', 'Who it is for')],
    ['alur', t('Alur pasien', 'Patient flow')],
    ['modul', t('Modul', 'Modules')],
    ['aturan', t('Aturan', 'Rules')],
    ['banding', t('Perbandingan', 'Comparison')],
    ['harga', t('Harga', 'Pricing')],
    ['tanya-jawab', t('Tanya jawab', 'FAQ')],
  ] as const

  /* ── Tiga bentuk fasilitas ── */
  const sektorData = {
    apotek: {
      Icon: Store,
      nama: t('Apotek', 'Pharmacy'),
      ringkas: t('Kasir, stok per batch dan tanggal kedaluwarsa, pembelian ke PBF, pembayaran faktur, stok opname, dan laporan SIPNAP.',
                 'POS, stock by batch and expiry date, purchasing from distributors, invoice payments, stock takes, and SIPNAP reporting.'),
      modul: [t('Beranda', 'Home'), t('Produk & Stok', 'Products & Stock'), t('Stok Opname', 'Stock Take'), t('Transfer Stok', 'Stock Transfer'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('Laporan SIPNAP tersedia di semua paket, termasuk paket termurah. Pelaporan narkotika dan psikotropika adalah kewajiban hukum apotek, bukan fitur tambahan yang dijual terpisah.',
              'SIPNAP reporting is in every plan, including the cheapest. Narcotics and psychotropics reporting is a legal duty for pharmacies, not an add-on sold separately.'),
    },
    klinik: {
      Icon: Stethoscope,
      nama: t('Klinik', 'Clinic'),
      ringkas: t('Seluruh modul apotek, ditambah reservasi, antrean per poli, rekam medis elektronik, e-resep, laboratorium dan radiologi, serta klaim penjamin.',
                 'Every pharmacy module, plus appointments, per-unit queues, electronic medical records, e-prescriptions, lab and imaging, and payer claims.'),
      modul: [t('Beranda', 'Home'), t('Reservasi', 'Appointments'), t('Kunjungan', 'Visits'), t('Pasien', 'Patients'), t('Farmasi', 'Pharmacy'), t('Lab & Radiologi', 'Lab & Imaging'), t('Produk & Stok', 'Products & Stock'), t('Stok Opname', 'Stock Take'), t('Transfer Stok', 'Stock Transfer'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('Satu kunjungan, satu tagihan. Pasien cukup membayar sekali di kasir, termasuk pasien BPJS dan asuransi, sehingga tidak ada kunjungan yang tertahan karena menunggu pembayaran penjamin.',
              'One visit, one bill. The patient pays once at the cashier, BPJS and insurance patients included, so no visit is left hanging while waiting for a payer to settle.'),
    },
    rumah_sakit: {
      Icon: Hospital,
      nama: t('Rumah Sakit', 'Hospital'),
      ringkas: t('Untuk saat ini setara dengan modul klinik, dengan jumlah poli, dokter, dan tenaga kesehatan tanpa batas.',
                 'For now equivalent to the clinic modules, with unlimited units, doctors, and clinical staff.'),
      modul: [t('Beranda', 'Home'), t('Reservasi', 'Appointments'), t('Kunjungan', 'Visits'), t('Pasien', 'Patients'), t('Farmasi', 'Pharmacy'), t('Lab & Radiologi', 'Lab & Imaging'), t('Produk & Stok', 'Products & Stock'), t('Stok Opname', 'Stock Take'), t('Transfer Stok', 'Stock Transfer'), t('Transaksi', 'Sales'), t('Layanan Jasa', 'Services'), t('Pembelian', 'Purchasing'), t('Pembayaran Faktur', 'Invoice Payments'), t('Supplier', 'Suppliers'), t('Tindak Lanjut', 'Follow-up'), t('Laporan', 'Reports'), t('Pengaturan', 'Settings')],
      khas: t('Rawat inap, manajemen kamar, dan penunjang lanjutan disiapkan sesuai kebutuhan tiap rumah sakit. Kami sengaja tidak menampilkan menunya lebih dulu, karena menu yang hanya mengantar ke halaman kosong lebih merugikan daripada menu yang belum ada.',
              'Inpatient care, ward management, and advanced ancillaries are prepared to fit each hospital. We deliberately do not show those menus yet, because a menu that leads to an empty page does more harm than a menu that is not there.'),
    },
  } as const
  const S = sektorData[sektor]

  /* ── Alur satu pasien, dari memesan sampai klaim dibayar ── */
  const alur = [
    { Icon: CalendarClock, siapa: t('Loket / telepon', 'Front desk / phone'), judul: t('Reservasi', 'Appointment'),
      d: t('Pasien memesan jadwal praktik dokter. Pemesan belum harus terdaftar sebagai pasien, karena orang yang menelepon sore ini untuk besok pagi belum tentu datang.', 'The patient books a doctor session. A caller need not be a registered patient yet, because whoever calls this evening for tomorrow may never arrive.') },
    { Icon: UsersRound, siapa: t('Pendaftaran', 'Registration'), judul: t('Pendaftaran', 'Registration'),
      d: t('Petugas mencatat identitas lengkap, penjamin yang berlaku hari itu, dan poli tujuan. Nomor antrean terbit, dan biaya administrasi otomatis masuk ke tagihan.', 'Staff record full identity, the payer valid that day, and the target unit. A queue number is issued, and the admin fee enters the bill automatically.') },
    { Icon: Tv, siapa: t('Layar ruang tunggu', 'Waiting room screen'), judul: t('Antrean', 'Queue'),
      d: t('Nomor antrean tampil besar di televisi ruang tunggu dan dipanggil dengan suara. Layar ini tidak memakai akun staf, sehingga tidak ada jalan untuk membuka rekam medis dari sana.', 'The queue number shows large on the waiting room TV and is called aloud. The screen uses no staff account, so there is no way to open medical records from it.') },
    { Icon: Stethoscope, siapa: t('Dokter', 'Doctor'), judul: t('Pemeriksaan', 'Examination'),
      d: t('Dokter mengisi catatan SOAP, tanda vital, dan diagnosis ICD-10 resmi. Tarif konsultasi baru masuk saat pasien benar-benar diperiksa, bukan saat mendaftar.', 'The doctor records SOAP notes, vitals, and an official ICD-10 diagnosis. The consultation fee enters only when the patient is actually examined, not at registration.') },
    { Icon: Microscope, siapa: t('Analis', 'Lab technician'), judul: t('Penunjang', 'Ancillaries'),
      d: t('Hasil laboratorium diisi per parameter lengkap dengan nilai rujukan, sedangkan radiologi berupa uraian. Permintaan cito didahulukan, dan nilai kritis ditandai merah agar dokter segera dikabari.', 'Lab results are entered per parameter with reference ranges, while imaging is a written report. Urgent requests go first, and critical values are flagged red so the doctor is told right away.') },
    { Icon: FileText, siapa: t('Dokter', 'Doctor'), judul: t('Resep', 'Prescription'),
      d: t('Dosis, frekuensi, dan cara pemberian dicatat terpisah. Dokter juga dapat menulis permintaan umum tanpa memilih merek, lalu farmasi yang menentukan produknya.', 'Dose, frequency, and route are recorded separately. The doctor may also write a general request without choosing a brand, and pharmacy picks the product.') },
    { Icon: FlaskConical, siapa: t('Farmasi', 'Pharmacy'), judul: t('Penyiapan', 'Dispensing prep'),
      d: t('Farmasi menyiapkan obat, mencetak etiket, lalu menandai obat siap. Penyerahan obat dicatat oleh farmasi, bukan oleh mesin kasir.', 'Pharmacy prepares the medicine, prints the label, then marks it ready. Handover is recorded by pharmacy, not by the cash register.') },
    { Icon: Wallet, siapa: t('Kasir', 'Cashier'), judul: t('Pembayaran', 'Payment'),
      d: t('Satu tagihan memuat administrasi, konsultasi, tindakan, pemeriksaan penunjang, dan obat. Dapat dibayar tunai, QRIS, transfer, atau ditagihkan ke penjamin.', 'One bill holds admin, consultation, procedures, tests, and medicine. Pay by cash, QRIS, transfer, or bill the payer.') },
    { Icon: FileCheck, siapa: t('Pemilik / admin', 'Owner / admin'), judul: t('Klaim', 'Claim'),
      d: t('Tagihan ke penjamin dihimpun menjadi klaim bernomor, dicetak lengkap dengan nomor kartu dan diagnosis utama, lalu dipantau sampai dibayar.', 'Payer billings are gathered into a numbered claim, printed with card numbers and primary diagnoses, then tracked until paid.') },
  ]

  /* ── Sorotan modul. `bab` menandai awal kelompok. ── */
  const spotlights: Sorot[] = [
    { bab: ['01', t('Pasien datang', 'The patient arrives'), t('Dari pemesanan lewat telepon hingga nama pasien dipanggil di ruang tunggu.', 'From a phone booking to a name called in the waiting room.')] as const,
      tag: t('BERANDA', 'HOME'),
      title: t('Kondisi faskes dalam sekali lihat.', 'The whole facility, at a glance.'),
      body: t('Grafik kunjungan dan penjualan dengan rentang 7, 30, atau 90 hari, masing-masing dibandingkan dengan periode sebelumnya. Di bawahnya tampil produk terlaris, stok yang menipis, obat yang segera kedaluwarsa, dan faktur yang mendekati jatuh tempo. Faskes yang baru mendaftar juga dipandu langkah demi langkah sampai siap melayani pasien pertamanya.',
              'Visit and sales charts over 7, 30, or 90 days, each compared with the previous period. Below them: best sellers, low stock, medicine expiring soon, and invoices coming due. A newly registered facility is also guided step by step until it is ready for its first patient.'),
      Icon: TrendingUp,
      visual: (<AppWindow judul={t('Beranda', 'Home')} aktif={0}><div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[[t('Omzet','Revenue'),'Rp8,4jt'],[t('Kunjungan','Visits'),'34'],[t('Produk','Products'),'1.240']].map((c,i)=>(<div key={i} className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[10px] text-[var(--ink-faint)] uppercase tracking-wide">{c[0]}</p><p className="text-[13px] font-bold text-[var(--ink)]">{c[1]}</p></div>))}
        </div>
        <div className="rounded-lg border border-[var(--line-soft)] p-2.5">
          <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-[var(--ink)]">{t('Penjualan 7 Hari','Sales, 7 Days')}</span><div className="flex gap-1.5 text-[9px]"><span className="text-[var(--brand-soft)]">▉ {t('Omzet','Revenue')}</span><span className="text-[var(--accent)]">━ {t('Transaksi','Trx')}</span></div></div>
          <svg viewBox="0 0 240 74" className="w-full">
            {[24,40,32,54,46,66,58].map((h,i)=>(<rect key={i} x={12+i*32} y={68-h} width="16" height={h} rx="3" fill="var(--brand)" />))}
            <path d="M20,42 C36,34 40,32 52,30 C68,27 72,40 84,38 C100,35 104,24 116,22 C132,20 136,32 148,30 C164,27 168,16 180,15 C196,14 200,22 212,24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
            {[[20,42],[52,30],[84,38],[116,22],[148,30],[180,15],[212,24]].map((p,i)=>(<circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.8" />))}
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[10px] text-[var(--ink-faint)] mb-0.5">{t('Stok Minim','Low Stock')}</p><p className="text-[12px] text-[var(--ink)]">Amoxicillin <span className="text-red-600 font-semibold">2/10</span></p></div>
          <div className="rounded-lg border border-[var(--line-soft)] p-2"><p className="text-[10px] text-[var(--ink-faint)] mb-0.5">{t('Jatuh Tempo','Due')}</p><p className="text-[12px] text-[var(--ink)]">PBF Sehat <span className="text-amber-700 font-semibold">3 {t('hari','d')}</span></p></div>
        </div>
      </div></AppWindow>) },

    { tag: t('RESERVASI', 'APPOINTMENTS'),
      title: t('Janji temu dengan kuota yang benar-benar terjaga.', 'Appointments with a quota that truly holds.'),
      body: t('Jadwal praktik disusun per sesi, bukan per slot lima belas menit, karena begitulah klinik pratama bekerja: pasien datang dalam rentang jam praktik dan dilayani berurutan. Kuota setiap sesi dijaga sistem, sehingga dua petugas yang menyimpan bersamaan tidak akan sama-sama mendapatkan kursi terakhir. Reservasi yang tidak hadir otomatis dibatalkan keesokan harinya.',
              'Practice schedules are organised by session, not fifteen-minute slots, because that is how primary clinics work: patients arrive within practice hours and are served in order. Each session’s quota is guarded by the system, so two staff saving at once cannot both take the last seat. No-shows are cancelled automatically the next day.'),
      Icon: CalendarClock,
      visual: (<AppWindow judul={t('Reservasi', 'Appointments')} aktif={1}><div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] text-[var(--ink-soft)]"><span className="font-semibold text-[var(--ink)]">{t('Sabtu, 23 Agustus','Saturday, 23 August')}</span><span>{t('Sisa kuota','Seats left')} 4/20</span></div>
        {[['08.00 - 11.00','dr. Andi, Poli Umum','16'],['09.00 - 12.00','drg. Rina, Poli Gigi','7'],['16.00 - 19.00','dr. Sari, KIA','3']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2 flex items-center justify-between">
            <div><p className="text-[12px] font-semibold text-[var(--ink)]">{r[1]}</p><p className="text-[11px] text-[var(--ink-faint)]">{r[0]}</p></div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--brand-soft)]">{r[2]} {t('terisi','booked')}</span>
          </div>))}
        <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] text-[var(--ink-soft)]">{t('Pasien datang? Satu klik menjadikannya kunjungan, lengkap dengan nomor antrean dan biaya administrasi.','Patient arrived? One click turns it into a visit, with queue number and admin fee included.')}</div>
      </div></AppWindow>) },

    { tag: t('ANTREAN & LAYAR RUANG TUNGGU', 'QUEUE & WAITING ROOM SCREEN'),
      title: t('Nomor dipanggil dan terdengar jelas.', 'Numbers called, and clearly heard.'),
      body: t('Antrean bernomor per poli, ditambah layar khusus untuk televisi ruang tunggu yang dibuka melalui tautan rahasia tanpa perlu masuk sebagai staf. Ini keputusan keamanan: akun yang dibiarkan terbuka di ruang publik dapat dipakai siapa saja yang lewat. Nama pasien disamarkan sejak dari server, sehingga nama lengkapnya tidak pernah sampai ke televisi. Panggilan suara dibuat otomatis, jadi nomor berapa pun dapat diucapkan tanpa rekaman.',
              'Numbered queues per unit, plus a waiting room TV screen opened through a secret link with no staff login. That is a security decision: an account left open in a public room can be used by anyone walking past. Patient names are masked at the server, so full names never reach the TV. Voice calls are generated automatically, so any number can be spoken without recordings.'),
      Icon: Tv,
      // Ini SATU-SATUNYA mokup yang bukan layar staf, jadi rangkanya sengaja
      // beda: bingkai televisi dengan kaki, bukan rel ikon dan topbar. Yang
      // dilihat di sini memang layar yang menempel di dinding ruang tunggu.
      visual: (<div>
        <div className="kn-win rounded-[18px] p-2.5 bg-[var(--ink)]">
          <div className="rounded-xl overflow-hidden bg-[var(--brand)] text-[var(--on-brand)] p-5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[var(--on-brand-soft)] mb-3">
              <span>Klinik Rexco 88</span>
              <span className="inline-flex items-center gap-1.5"><Volume2 size={13} /> {t('Suara aktif','Voice on')}</span>
            </div>
            <div className="rounded-xl bg-[var(--on-brand)]/12 py-7 text-center mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--on-brand-soft)]">{t('Nomor dipanggil','Now calling')}</p>
              <p className="text-6xl font-bold leading-none mt-2 tracking-tight">A-014</p>
              <p className="text-base mt-2.5">Nyoman R. <span className="text-[var(--on-brand-soft)]">· Poli Umum</span></p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--on-brand-soft)] mb-2">{t('Sedang dipanggil','Also calling')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[['B-007','Poli Gigi'],['C-003','KIA'],['A-013','Poli Umum']].map((r,i)=>(
                <div key={i} className="rounded-lg bg-[var(--on-brand)]/12 px-2.5 py-2"><p className="text-lg font-bold leading-none">{r[0]}</p><p className="text-[11px] text-[var(--on-brand-soft)] mt-1.5">{r[1]}</p></div>))}
            </div>
          </div>
        </div>
        <div className="mx-auto w-24 h-1.5 rounded-b-lg bg-[var(--ink)]/70" />
        <div className="mx-auto w-40 h-1 rounded-full bg-[var(--ink)]/25 mt-0.5" />
      </div>) },

    { tag: t('PASIEN & IDENTITAS', 'PATIENTS & IDENTITY'),
      title: t('Identitas wajib lengkap, dengan jalan keluar untuk keadaan darurat.', 'Identity required, with a way through for emergencies.'),
      body: t('NIK dan nomor telepon wajib diisi, dan aturan ini tetap berlaku saat data diimpor dari Excel. Untuk pasien gawat darurat yang datang tanpa KTP tersedia jalur khusus yang mewajibkan alasan, dan alasan itu tercatat di jejak audit. NIK karangan jauh lebih berbahaya daripada NIK kosong, karena terlihat seperti data yang benar. Alamat dicatat terperinci sampai kelurahan, sesuai ketentuan SatuSehat.',
              'National ID and phone number are required, and the rule still applies when data is imported from Excel. Emergency patients who arrive without an ID card have a dedicated path that requires a reason, and that reason is kept in the audit trail. An invented ID is far more dangerous than a blank one, because it looks like real data. Addresses are recorded down to the village, as SatuSehat requires.'),
      Icon: BadgeCheck,
      visual: (<AppWindow judul={t('Pasien', 'Patients')} aktif={3}><div className="space-y-2">
        {[[t('Nama lengkap','Full name'),'I Wayan Sudiarta'],['NIK','5171 •••• •••• 0042'],[t('Telepon','Phone'),'0812 •••• 4471'],[t('Kerabat','Next of kin'),'Ni Made Ayu · 0813 •••• 2210']].map((r,i)=>(
          <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5"><span className="text-[11px] text-[var(--ink-faint)]">{r[0]}</span><span className="text-[12px] text-[var(--ink)] font-medium">{r[1]}</span></div>))}
        <div className="grid grid-cols-2 gap-1.5">
          {[[t('Kelurahan','Village'),'Renon'],[t('Kecamatan','District'),'Denpasar Selatan'],[t('Kota','City'),'Denpasar'],[t('Provinsi','Province'),'Bali']].map((r,i)=>(
            <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2 py-1.5"><p className="text-[10px] text-[var(--ink-faint)]">{r[0]}</p><p className="text-[12px] text-[var(--ink)]">{r[1]}</p></div>))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">{t('Tanpa NIK? Wajib menuliskan alasan, dan alasannya tercatat di jejak audit.','No ID number? A reason is required, and it is recorded in the audit trail.')}</div>
      </div></AppWindow>) },

    { bab: ['02', t('Ruang periksa', 'The examination room'), t('Catatan dokter hari ini harus tetap dapat dibaca, dibandingkan, dan dikirim tahun depan.', 'What the doctor writes today must still be readable, comparable, and sendable next year.')] as const,
      tag: t('REKAM MEDIS', 'MEDICAL RECORDS'),
      title: t('Catatan SOAP, tanda vital terukur, diagnosis berkode.', 'SOAP notes, measured vitals, coded diagnoses.'),
      body: t('Tanda vital tidak ditulis dalam satu kotak bebas, tetapi dalam kolom tersendiri yang masing-masing berkode standar internasional, karena tulisan "TD 120/80" tidak dapat diolah tanpa menebak. Diagnosis memakai daftar ICD-10 resmi Kemenkes sebanyak 18.543 kode, sama dengan yang dipakai INA-CBG untuk menilai klaim, dan dapat dicari dalam bahasa Indonesia. Kunjungan tidak dapat ditutup tanpa diagnosis, dan rekam medis yang sudah ditutup hanya dapat ditambah adendum, tidak dapat diubah diam-diam.',
              'Vitals are not written in one free text box but in separate columns, each carrying an international standard code, because "BP 120/80" cannot be processed without guessing. Diagnoses use the official Ministry of Health ICD-10 list of 18,543 codes, the same list INA-CBG uses to assess claims, searchable in Indonesian. A visit cannot close without a diagnosis, and a closed record can only receive an addendum, never a silent edit.'),
      Icon: Stethoscope,
      visual: (<AppWindow judul={t('Kunjungan', 'Visits')} sub={t('Rekam Medis', 'Medical Record')} aktif={2}><div className="space-y-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[['TD','120/80','mmHg'],['Nadi','88','/mnt'],['Suhu','37,8','°C'],['SpO₂','97','%']].map((v,i)=>(
            <div key={i} className="rounded-lg border border-[var(--line-soft)] p-1.5 text-center"><p className="text-[10px] text-[var(--ink-faint)]">{v[0]}</p><p className="text-[13px] font-bold text-[var(--ink)] leading-tight">{v[1]}</p><p className="text-[9px] text-[var(--ink-faint)]">{v[2]}</p></div>))}
        </div>
        {[['S', t('Demam 3 hari, nyeri menelan','Fever 3 days, sore throat')],['O', t('Faring hiperemis, tonsil T1-T1','Pharynx hyperaemic, tonsils T1-T1')]].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5 flex gap-2"><span className="text-[11px] font-bold text-[var(--brand-soft)]">{r[0]}</span><span className="text-[12px] text-[var(--ink)]">{r[1]}</span></div>))}
        <div className="rounded-lg border border-[var(--line-soft)] p-2">
          <p className="text-[10px] text-[var(--ink-faint)] mb-1">{t('Cari: "faringitis"','Search: "pharyngitis"')}</p>
          <div className="flex items-center justify-between text-[12px] text-[var(--ink)] py-0.5"><span><span className="font-mono text-[var(--brand-soft)]">J02.9</span> Acute pharyngitis, unspecified</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brand)] text-[var(--on-brand)]">{t('Primer','Primary')}</span></div>
          <div className="flex items-center justify-between text-[12px] text-[var(--ink-soft)] py-0.5"><span><span className="font-mono">J03.9</span> Acute tonsillitis, unspecified</span></div>
        </div>
        <p className="text-[11px] text-[var(--ink-faint)]">{t('Diketik dalam bahasa Indonesia, ditemukan nama resminya. Ratusan padanan kata menjembatani istilah sehari-hari dengan nama baku ICD.','Typed in Indonesian, matched to the official name. Hundreds of word pairs bridge everyday terms and standard ICD names.')}</p>
      </div></AppWindow>) },

    { tag: t('LAB & RADIOLOGI', 'LAB & IMAGING'),
      title: t('Hasil lab tersusun rapi, nilai kritis tidak terlewat.', 'Lab results in order, critical values never missed.'),
      body: t('Setiap paket pemeriksaan menyimpan cetakan parameternya: nama, kode, satuan, dan nilai rujukan, cukup diisi sekali lalu dipakai berulang. Tanpa itu, pemeriksaan darah lengkap berarti mengetik ulang sepuluh baris untuk setiap pasien, dan nilai rujukan bisa berbeda tergantung petugas jaga. Radiologi tetap ditulis sebagai uraian temuan dan kesan. Permintaan cito otomatis didahulukan dalam antrean.',
              'Each test package stores a template of its parameters: name, code, unit, and reference range, entered once and reused. Without it, a full blood count means retyping ten rows for every patient, and reference ranges drift with whoever is on shift. Imaging is still written as findings and impression. Urgent requests automatically go to the front of the queue.'),
      Icon: Microscope,
      visual: (<AppWindow judul={t('Lab & Radiologi', 'Lab & Imaging')} aktif={5}><div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-semibold text-[var(--ink)]">{t('Darah Lengkap','Full Blood Count')}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-semibold">CITO</span></div>
        {[['Hemoglobin','11,2','g/dL','12,0 - 16,0','amber',t('RENDAH','LOW')],['Leukosit','9.400','/µL','4.000 - 11.000','hijau',t('NORMAL','NORMAL')],['Trombosit','84.000','/µL','150.000 - 450.000','merah',t('KRITIS','CRITICAL')]].map((r,i)=>(
          <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5">
            <span className="text-[12px] text-[var(--ink)] flex-1 truncate">{r[0]}</span>
            <span className="text-[12px] font-bold text-[var(--ink)]">{r[1]}</span>
            <span className="text-[10px] text-[var(--ink-faint)] w-14 truncate">{r[2]}</span>
            <span className="text-[10px] text-[var(--ink-faint)] hidden sm:inline w-24 truncate">{r[3]}</span>
            <Tingkat warna={r[4] as 'merah' | 'amber' | 'hijau'}>{r[5]}</Tingkat>
          </div>))}
        <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">{t('Ditandai kritis. Dokter pengirim dikabari hari itu juga.','Flagged critical. The ordering doctor is informed the same day.')}</div>
      </div></AppWindow>) },

    { tag: t('E-RESEP', 'E-PRESCRIPTION'),
      title: t('Aturan pakai dicatat terpisah, siap dicetak dan dikirim.', 'Dosing recorded in parts, ready to print and send.'),
      body: t('Dosis, frekuensi, dan cara pemberian dicatat dalam kolom terpisah, karena "3x1 sesudah makan" yang terlanjur ditulis dalam satu kalimat tidak dapat diurai kembali untuk etiket maupun untuk SatuSehat. Dokter juga dapat menulis permintaan umum tanpa memilih merek, misalnya "antihistamin oral, 10 tablet", lalu farmasi yang memilih produknya. Tulisan asli dokter tetap tersimpan, sehingga selalu terbaca: dokter meminta apa, farmasi memberikan apa, oleh siapa, dan pukul berapa.',
              'Dose, frequency, and route are separate columns, because "3x1 after meals" written as one sentence cannot be split again for a label or for SatuSehat. Doctors may also write a general request without a brand, say "oral antihistamine, 10 tablets", and pharmacy chooses the product. The doctor’s original words are kept, so the record always reads: what the doctor asked for, what pharmacy gave, by whom, and when.'),
      Icon: FileText,
      visual: (<AppWindow judul={t('Kunjungan', 'Visits')} sub={t('Resep', 'Prescription')} aktif={2}><div className="space-y-1.5">
        {[['Amoxicillin 500 mg','1 tablet','3x sehari','Oral','30'],['Paracetamol 500 mg','1 tablet','3x sehari bila demam','Oral','10']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <p className="text-[12px] font-semibold text-[var(--ink)] mb-1">{r[0]} <span className="text-[var(--ink-faint)] font-normal">· {r[4]}</span></p>
            <div className="flex gap-1.5">{[[t('Dosis','Dose'),r[1]],[t('Frekuensi','Frequency'),r[2]],[t('Rute','Route'),r[3]]].map((c,j)=>(
              <span key={j} className="text-[10px] rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--ink-soft)]"><span className="text-[var(--ink-faint)]">{c[0]}: </span>{c[1]}</span>))}</div>
          </div>))}
        <div className="rounded-lg border border-dashed border-[var(--line)] px-2.5 py-2">
          <p className="text-[12px] text-[var(--ink)]">{t('Antihistamin oral, 10 tablet','Oral antihistamine, 10 tablets')}</p>
          <p className="text-[10px] text-[var(--accent)] mt-0.5">{t('Permintaan umum. Produk dipilih farmasi.','General request. Product chosen by pharmacy.')}</p>
        </div>
        <p className="text-[11px] text-[var(--ink-faint)]">{t('Pemeriksaan interaksi obat sengaja tidak dibuat, dan hal itu disampaikan di layar. Fitur yang setengah benar lebih berbahaya daripada tidak ada sama sekali.','Drug interaction checking is deliberately not built, and the screen says so. A half-correct feature is more dangerous than none.')}</p>
      </div></AppWindow>) },

    { bab: ['03', t('Farmasi dan kasir', 'Pharmacy and cashier'), t('Pembayaran dan penyerahan obat adalah dua kejadian berbeda, dan dicatat secara terpisah.', 'Payment and handover are two separate events, and are recorded separately.')] as const,
      tag: t('FARMASI', 'PHARMACY'),
      title: t('Penyerahan obat dicatat oleh farmasi.', 'Handover is recorded by pharmacy.'),
      body: t('Pasien yang sudah membayar belum tentu sudah menerima obatnya. Karena itu resep memiliki tahapan sendiri, mulai dari ditulis dokter, disiapkan, siap diambil, hingga diserahkan, dan setiap tahap dicatat oleh petugas yang benar-benar mengerjakannya. Untuk narkotika dan psikotropika, catatan ini ditandatangani apoteker, sehingga isinya harus tepat. Etiket dicetak langsung dari layar Farmasi: putih untuk obat dalam dan biru untuk obat luar, sesuai kebiasaan apotek di Indonesia.',
              'A patient who has paid has not necessarily received their medicine. So prescriptions have their own stages, from written by the doctor, prepared, ready for pickup, to handed over, and each stage is recorded by whoever actually did the work. For narcotics and psychotropics this record is signed by the pharmacist, so it must be accurate. Labels print straight from the Pharmacy screen: white for internal use, blue for external, following Indonesian pharmacy practice.'),
      Icon: FlaskConical,
      visual: (<AppWindow judul={t('Farmasi', 'Pharmacy')} sub={t('Antrean Resep', 'Prescription Queue')} aktif={4}><div className="space-y-2">
        <div className="flex items-center gap-1">
          {[[t('Draf','Draft'),t('dokter','doctor')],[t('Final','Final'),t('dokter','doctor')],[t('Disiapkan','Preparing'),t('farmasi','pharmacy')],[t('Siap','Ready'),t('farmasi','pharmacy')],[t('Diserahkan','Handed over'),t('farmasi','pharmacy')]].map((s,i)=>(
            <div key={i} className="flex-1 text-center">
              <div className={`h-1 rounded-full mb-1 ${i<=2?'bg-[var(--brand)]':'bg-[var(--line-soft)]'}`} />
              <p className={`text-[10px] font-semibold ${i<=2?'text-[var(--ink)]':'text-[var(--ink-faint)]'}`}>{s[0]}</p>
              <p className="text-[9px] text-[var(--ink-faint)]">{s[1]}</p>
            </div>))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2">
            <p className="text-[10px] text-[var(--ink-faint)] mb-1">{t('Etiket obat dalam','Internal use label')}</p>
            <p className="text-[11px] font-bold text-[var(--ink)]">I Wayan Sudiarta</p>
            <p className="text-[10px] text-[var(--ink-soft)]">Amoxicillin 500 mg</p>
            <p className="text-[11px] font-semibold text-[var(--ink)] mt-1">{t('3x sehari 1 tablet','3x daily, 1 tablet')}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
            <p className="text-[10px] text-blue-700 mb-1">{t('Etiket obat luar','External use label')}</p>
            <p className="text-[11px] font-bold text-blue-900">I Wayan Sudiarta</p>
            <p className="text-[10px] text-blue-800">Gentamicin salep mata</p>
            <p className="text-[11px] font-semibold text-blue-900 mt-1">{t('3x sehari, mata kanan','3x daily, right eye')}</p>
          </div>
        </div>
      </div></AppWindow>) },

    { tag: t('SATU TAGIHAN PER KUNJUNGAN', 'ONE BILL PER VISIT'),
      title: t('Kasir menagih sekali, dan tagihannya lengkap.', 'The cashier bills once, and bills in full.'),
      body: t('Biaya administrasi masuk saat pasien mendaftar, sedangkan tarif konsultasi baru masuk saat pasien benar-benar diperiksa, sehingga pasien yang pulang sebelum diperiksa tidak ikut ditagih. Tindakan, pemeriksaan penunjang, dan obat masuk ke tagihan yang sama, dan kasir melihat semuanya sekaligus. Tanda SIAP DITAGIH diberikan oleh dokter, sehingga kasir tidak menagih sebelum semua tindakan tercatat dan tidak ada biaya yang terlewat.',
              'The admin fee enters at registration, while the consultation fee enters only when the patient is actually examined, so someone who leaves before being seen is not charged. Procedures, tests, and medicine join the same bill, and the cashier sees everything at once. The READY TO BILL mark is given by the doctor, so the cashier never bills before every procedure is recorded and no charge slips through.'),
      Icon: Wallet,
      visual: (<AppWindow judul={t('Kasir', 'Cashier')} sub={t('Tagihan Kunjungan', 'Visit Bill')} aktif={7}><div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-semibold text-[var(--ink)]">A-014 · I Wayan Sudiarta</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white font-semibold">{t('SIAP DITAGIH','READY TO BILL')}</span></div>
        {[[t('Administrasi','Admin fee'),'Rp 15.000'],[t('Konsultasi, Poli Umum','Consultation, General'),'Rp 50.000'],[t('Tindakan: jahit luka','Procedure: wound suture'),'Rp 150.000'],[t('Lab: darah lengkap','Lab: full blood count'),'Rp 85.000'],[t('Obat, 3 baris resep','Drugs, 3 prescription lines'),'Rp 62.000']].map((r,i)=>(
          <div key={i} className="flex items-center justify-between text-[12px] border-b border-[var(--line-soft)] pb-1"><span className="text-[var(--ink-soft)]">{r[0]}</span><span className="text-[var(--ink)]">{r[1]}</span></div>))}
        <div className="flex items-center justify-between pt-1"><span className="text-[13px] font-bold text-[var(--ink)]">Total</span><span className="text-[15px] font-bold text-[var(--brand)]">Rp 362.000</span></div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5"><p className="text-[10px] text-[var(--ink-faint)]">{t('Diterima tunai','Cash received')}</p><p className="text-[12px] font-semibold text-[var(--ink)]">Rp 62.000</p></div>
          <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5"><p className="text-[10px] text-[var(--ink-faint)]">{t('Ditagihkan BPJS','Billed to BPJS')}</p><p className="text-[12px] font-semibold text-[var(--accent)]">Rp 300.000</p></div>
        </div>
        <p className="text-[11px] text-[var(--ink-faint)]">{t('Tagihan ke penjamin tidak dihitung sebagai uang masuk, sehingga isi laci kasir selalu dapat dicocokkan.','Amounts billed to payers are not counted as cash in, so the cash drawer always reconciles.')}</p>
      </div></AppWindow>) },

    { tag: t('KASIR & BARCODE', 'POS & BARCODE'),
      title: t('Cukup pindai barcode dari kemasan pabrik.', 'Just scan the manufacturer’s barcode.'),
      body: t('Barcode yang sudah tercetak di kemasan obat dapat disimpan di katalog, sehingga kasir cukup memindainya tanpa mencetak stiker sendiri. Barcode dijaga agar tidak kembar dalam satu faskes, dan hasil pindaian yang cocok persis selalu didahulukan daripada hasil pencarian nama, sehingga tidak ada obat yang salah masuk karena kemiripan angka. Untuk narkotika, psikotropika, dan prekursor, identitas pasien dan nomor resep wajib diisi.',
              'The barcode already printed on the medicine box can be saved in the catalog, so the cashier simply scans it without printing stickers. Barcodes are kept unique within a facility, and an exact scan always wins over a name search, so no wrong medicine slips in because of similar digits. Narcotics, psychotropics, and precursors require patient identity and a prescription number.'),
      Icon: ScanLine,
      visual: (<AppWindow judul={t('Kasir', 'Cashier')} aktif={7}><div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2"><ScanLine size={14} className="text-[var(--brand-soft)]" /><span className="text-[13px] font-mono text-[var(--ink)]">8992222212106</span></div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 flex items-center justify-between">
          <div><p className="text-[12px] font-semibold text-green-900">Sanmol Tablet 500 mg</p><p className="text-[10px] text-green-700">{t('Rak A3 · Stok 300 · Batch BT-2408','Shelf A3 · Stock 300 · Batch BT-2408')}</p></div>
          <span className="text-[12px] font-bold text-green-900">Rp 3.000</span>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">⚠ {t('Golongan narkotika: identitas pasien dan nomor resep wajib diisi, dan sistem menolak transaksi tanpa keduanya.','Narcotic class: patient identity and prescription number are required, and the system refuses the sale without them.')}</div>
        <div className="grid grid-cols-3 gap-1.5">{[t('Tunai','Cash'),'QRIS',t('Transfer','Transfer')].map(m=><div key={m} className="text-[12px] text-center py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)]">{m}</div>)}</div>
      </div></AppWindow>) },

    { bab: ['04', t('Keuangan yang dapat dipertanggungjawabkan', 'Money you can account for'), t('Tagihan ke penjamin bukanlah uang yang sudah diterima, dan keduanya tidak boleh tercampur.', 'What is billed to a payer is not cash received, and the two must never mix.')] as const,
      tag: t('PENJAMIN & KLAIM', 'PAYERS & CLAIMS'),
      title: t('Setiap klaim tercatat dan dipantau.', 'Every claim recorded and tracked.'),
      body: t('Klinik harus selalu dapat menjawab tiga pertanyaan: klaim mana yang sudah dikirim, berapa yang belum dibayar, dan transaksi mana yang sudah masuk ke klaim. Tanpa catatan, satu layanan bisa tertagih dua kali, dan itu cara tercepat kehilangan kerja sama dengan penjamin. Isi klaim dikunci saat dibuat, sehingga klaim yang sudah di tangan verifikator tidak berubah karena ada transaksi yang dibatalkan kemudian; perubahan seperti itu tampil sebagai selisih.',
              'A clinic must always be able to answer three questions: which claims were sent, how much is unpaid, and which transactions are already in a claim. Without a record, one service can be billed twice, the fastest way to lose a payer contract. A claim’s contents are locked when created, so a claim already with the verifier does not change when a transaction is voided later; such changes show as a difference.'),
      Icon: FileCheck,
      visual: (<AppWindow judul={t('Laporan', 'Reports')} sub={t('Klaim Penjamin', 'Payer Claims')} aktif={8}><div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {[t('Draf','Draft'),t('Dikirim','Sent'),t('Dibayar','Paid')].map((s,i)=>(
            <div key={i} className="flex items-center gap-1.5 flex-1"><span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${i<=1?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>{i+1}</span><span className="text-[10px] text-[var(--ink-soft)]">{s}</span>{i<2&&<div className="flex-1 h-px bg-[var(--line-soft)]" />}</div>))}
        </div>
        {[['KLM/2026/08/001','BPJS Kesehatan','1 - 15 Agu','Rp 18.450.000','hijau',t('Dibayar','Paid')],['KLM/2026/08/002','Allianz','1 - 20 Agu','Rp 4.120.000','amber',t('Dikirim','Sent')],['KLM/2026/08/003','Mandiri Inhealth','1 - 22 Agu','Rp 2.870.000','merah',t('Draf','Draft')]].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <div className="flex items-center justify-between"><span className="text-[11px] font-mono text-[var(--ink-soft)]">{r[0]}</span><Tingkat warna={r[4] as 'merah'|'amber'|'hijau'}>{r[5]}</Tingkat></div>
            <div className="flex items-center justify-between mt-0.5"><span className="text-[12px] font-semibold text-[var(--ink)]">{r[1]} <span className="font-normal text-[var(--ink-faint)]">· {r[2]}</span></span><span className="text-[12px] font-bold text-[var(--ink)]">{r[3]}</span></div>
          </div>))}
        <p className="text-[11px] text-[var(--ink-faint)]">{t('Faktur klaim memuat nomor kartu penjamin dan diagnosis utama di setiap baris, karena itulah yang diperiksa verifikator satu per satu.','The claim invoice carries the payer card number and primary diagnosis on every line, because that is what the verifier checks one by one.')}</p>
      </div></AppWindow>) },

    { tag: t('TUTUP KASIR & SETORAN', 'REGISTER CLOSE & DEPOSIT'),
      title: t('Laci kasir yang selalu dapat dicocokkan.', 'A cash drawer that always reconciles.'),
      body: t('Kasir membuka laci dengan uang modal di awal giliran, lalu menutupnya dengan menghitung uang yang ada. Sistem menghitung berapa yang seharusnya ada, menampilkan selisihnya, dan mewajibkan catatan bila tidak cocok. Bukti setoran dapat dicetak untuk ditandatangani kasir dan penerima, dan pemilik dapat melihat riwayat setoran seluruh kasir. Angka yang sudah ditutup tidak berubah meskipun ada transaksi yang dibatalkan sesudahnya.',
              'The cashier opens the drawer with a float at the start of the shift, then closes it by counting the cash. The system works out what should be there, shows the difference, and requires a note if it does not match. A deposit slip prints for the cashier and receiver to sign, and the owner sees every cashier’s deposit history. Closed figures do not change even if a transaction is voided afterwards.'),
      Icon: Banknote,
      visual: (<AppWindow judul={t('Kasir', 'Cashier')} sub={t('Tutup Kasir', 'Close Register')} aktif={7}><div className="space-y-1.5">
        {[[t('Kas awal','Opening cash'),'Rp 200.000',''],[t('Tunai diterima','Cash received'),'Rp 1.485.000',''],[t('Seharusnya di laci','Expected in drawer'),'Rp 1.685.000','font-semibold'],[t('Dihitung saat tutup','Counted at close'),'Rp 1.680.000','font-semibold']].map((r,i)=>(
          <div key={i} className="flex items-center justify-between text-[12px] border-b border-[var(--line-soft)] pb-1"><span className="text-[var(--ink-soft)]">{r[0]}</span><span className={`text-[var(--ink)] ${r[2]}`}>{r[1]}</span></div>))}
        <div className="flex items-center justify-between pt-0.5"><span className="text-[13px] font-bold text-[var(--ink)]">{t('Selisih','Difference')} <Tingkat warna="merah">{t('KURANG','SHORT')}</Tingkat></span><span className="text-[14px] font-bold text-red-600">Rp -5.000</span></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">{t('Catatan: kembalian salah ke pembeli','Note: wrong change given to a customer')}</div>
        <div className="text-[11px] text-center py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)]">{t('Cetak bukti setoran','Print deposit slip')}</div>
      </div></AppWindow>) },

    { tag: t('PEMBELIAN & PEMBAYARAN FAKTUR', 'PURCHASING & INVOICE PAYMENTS'),
      title: t('Dari pesanan ke PBF hingga faktur lunas.', 'From the distributor order to a settled invoice.'),
      body: t('Buat surat pesanan ke supplier, terima barang lengkap dengan nomor batch dan tanggal kedaluwarsanya, lalu kelola pembayaran faktur yang diurutkan menurut jatuh tempo, lengkap dengan penanda keterlambatan dan bukti pembayaran yang dapat dicetak. Barang yang datang bertahap tetap tercatat rapi tanpa batch ganda.',
              'Create purchase orders, receive goods with their batch numbers and expiry dates, then manage invoice payments sorted by due date, with overdue flags and printable payment receipts. Goods arriving in parts stay tidy, with no duplicate batches.'),
      Icon: Receipt,
      visual: (<AppWindow judul={t('Pembayaran Faktur', 'Invoice Payments')} aktif={8}><div className="space-y-1.5">{[['INV/0087','PBF Sehat Sentosa',t('Jatuh tempo 3 hari','Due in 3 days'),'amber'],['INV/0091','PT Kimia Farma',t('Terlambat 6 hari','6 days overdue'),'merah'],['INV/0080','PBF Anugerah',t('Lunas','Settled'),'hijau']].map((r,i)=>(
        <div key={i} className="flex items-center justify-between bg-[var(--surface)]/70 border border-[var(--line-soft)] rounded-lg px-3 py-2">
          <div><p className="text-[12px] font-mono text-[var(--ink)]">{r[0]}</p><p className="text-[11px] text-[var(--ink-faint)]">{r[1]}</p></div>
          <Tingkat warna={r[3] as 'merah'|'amber'|'hijau'}>{r[2]}</Tingkat>
        </div>))}</div></AppWindow>) },

    { tag: t('LAPORAN & SIPNAP', 'REPORTS & SIPNAP'),
      title: t('Laporan wajib yang tidak lagi menyita semalaman.', 'The mandatory report that no longer takes an evening.'),
      body: t('Laporan narkotika, psikotropika, dan prekursor per periode: penerimaan dari pembelian, pengeluaran lengkap dengan data pasien dan nomor resep, serta pemusnahan, retur, dan hasil stok opname. Saldo akhirnya selalu sama dengan stok di sistem, dan siap dicetak dengan tanda tangan apoteker penanggung jawab. Tersedia juga laporan penjualan, rekap metode pembayaran, dan laporan per penjamin. SIPNAP tersedia di semua paket.',
              'Narcotics, psychotropics, and precursors per period: receipts from purchasing, dispensing with patient data and prescription numbers, plus destructions, returns, and stock take results. The closing balance always matches system stock, ready to print with the responsible pharmacist’s signature. Sales reports, payment method recaps, and per-payer reports are included too. SIPNAP is in every plan.'),
      Icon: BarChart2,
      visual: (<AppWindow judul={t('Laporan', 'Reports')} sub={t('SIPNAP', 'SIPNAP')} aktif={8}><div className="text-center"><p className="text-[13px] font-bold text-[var(--ink)]">LAPORAN PENGGUNAAN NARKOTIKA</p><p className="text-[11px] text-[var(--ink-faint)] mb-2">{t('Periode: Bulan berjalan','Period: current month')}</p><div className="border border-[var(--line)] rounded overflow-hidden"><div className="grid grid-cols-5 text-[10px] bg-[var(--surface-2)] text-[var(--ink-soft)]">{[t('Sediaan','Item'),t('Awal','Open'),t('Masuk','In'),t('Keluar','Out'),t('Sisa','Left')].map((h,i)=><span key={i} className={`p-1 ${i<4?'border-r border-[var(--line)]':''}`}>{h}</span>)}</div>{[['Codein 10 mg','12','20','5','27'],['Pethidin 50 ml','4','10','2','12']].map((r,i)=>(<div key={i} className="grid grid-cols-5 text-[10px] border-t border-[var(--line-soft)]">{r.map((c,j)=><span key={j} className={`p-1 text-[var(--ink)] ${j<4?'border-r border-[var(--line-soft)]':''}`}>{c}</span>)}</div>))}</div><p className="text-[10px] text-[var(--ink-faint)] mt-2">apt. Anessa Beckham, S.Farm · SIPA 4471/SIPA/2024</p></div></AppWindow>) },

    { bab: ['05', t('Barang di rak', 'Stock on the shelf'), t('Obat memiliki batch dan tanggal kedaluwarsa. Sistem yang hanya menghitung jumlah tidak cukup.', 'Medicines have batches and expiry dates. A system that only counts quantity is not enough.')] as const,
      tag: t('STOK, BATCH & KEDALUWARSA', 'STOCK, BATCHES & EXPIRY'),
      title: t('Tiga tingkat peringatan kedaluwarsa.', 'Three levels of expiry warning.'),
      body: t('Obat yang sudah kedaluwarsa dan obat yang kedaluwarsa 25 hari lagi membutuhkan tindakan yang berlawanan: yang pertama harus ditarik dari rak, yang kedua justru harus dijual lebih dulu. Karena itu keduanya diberi warna berbeda, agar tidak sama-sama diabaikan. Tindak lanjutnya tersedia langsung: pemusnahan dengan Berita Acara resmi, atau retur ke supplier. Stok baru berkurang setelah tindakan dikonfirmasi.',
              'Expired medicine and medicine expiring in 25 days need opposite actions: the first must be pulled from the shelf, the second should be sold first. So they get different colours, and neither is ignored. Follow-up is built in: destruction with an official report, or a return to the supplier. Stock drops only after the action is confirmed.'),
      Icon: CalendarClock,
      visual: (<AppWindow judul={t('Produk & Stok', 'Products & Stock')} aktif={6}><table className="w-full text-[12px]"><thead><tr className="text-[var(--ink-faint)] text-[10px]"><th className="text-left font-medium pb-1">{t('Produk','Product')}</th><th className="text-left font-medium pb-1">Batch</th><th className="text-left font-medium pb-1">{t('Kedaluwarsa','Expiry')}</th><th className="text-right font-medium pb-1">{t('Aksi','Action')}</th></tr></thead><tbody>
        {[['Amoxicillin 500','BT-2312',t('Lewat 12 hari','12 days past'),'merah',t('Musnahkan','Destroy')],['Cetirizine 10','BT-2401',t('25 hari lagi','25 days left'),'amber',t('Jual dulu','Sell first')],['Sanmol 500','BT-2408',t('Aman','Safe'),'hijau',t('Retur','Return')]].map((r,i)=>(
          <tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-1.5 text-[var(--ink)]">{r[0]}</td><td className="py-1.5 font-mono text-[var(--ink-soft)]">{r[1]}</td><td className="py-1.5"><Tingkat warna={r[3] as 'merah'|'amber'|'hijau'}>{r[2]}</Tingkat></td><td className="py-1.5 text-right"><span className="text-[11px] px-2 py-0.5 rounded bg-[var(--brand)] text-[var(--on-brand)]">{r[4]}</span></td></tr>))}
      </tbody></table></AppWindow>) },

    { tag: t('PEMESANAN TERPANDU', 'GUIDED ORDER'),
      title: t('Pesan ulang otomatis, terbagi per distributor.', 'Automatic reorders, split per distributor.'),
      body: t('Dengan satu klik, sistem mengumpulkan semua barang yang mencapai stok minimum, menyarankan jumlah pesanan, lalu membaginya ke distributor masing-masing. Setelah diperiksa, pesanan langsung terpecah menjadi satu surat pesanan per supplier. Tidak perlu lagi memeriksa kartu stok satu per satu, dan tidak ada lagi barang yang baru teringat setelah pasien menanyakannya.',
              'With one click, the system gathers every item at minimum stock, suggests order quantities, and assigns each to its distributor. After a review, the order splits into one purchase order per supplier. No more checking stock cards one by one, and no more remembering an item only after a patient asks for it.'),
      Icon: Wand2,
      visual: (<AppWindow judul={t('Pembelian', 'Purchasing')} sub={t('Pemesanan Terpandu', 'Guided Order')} aktif={6}><div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">{[t('Pilih','Select'),t('Bagi','Assign'),t('Buat','Create')].map((s,i)=>(<div key={i} className="flex items-center gap-1.5 flex-1"><span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${i===0?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>{i+1}</span><span className="text-[10px] text-[var(--ink-soft)]">{s}</span>{i<2&&<div className="flex-1 h-px bg-[var(--line-soft)]" />}</div>))}</div>
        {[['Amoxicillin 500','2/10','PBF Sehat'],['Paracetamol 500','5/20','PBF Sehat'],['Vitamin C 500','3/15','PT Kimia']].map((r,i)=>(<div key={i} className="flex items-center justify-between text-[12px] rounded-lg border border-[var(--line-soft)] px-2.5 py-1.5"><span className="text-[var(--ink)]">{r[0]}</span><span className="text-red-600">{r[1]}</span><span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--brand-soft)]">{r[2]}</span></div>))}
        <div className="text-[11px] text-center text-[var(--brand-soft)] font-medium">→ 2 {t('surat pesanan siap dikirim','purchase orders ready to send')}</div>
      </div></AppWindow>) },

    { tag: t('STOK OPNAME & TRANSFER ANTARCABANG', 'STOCK TAKE & BRANCH TRANSFER'),
      title: t('Stok opname yang tercatat, transfer antarcabang yang rapi.', 'Recorded stock takes, tidy branch transfers.'),
      body: t('Stok opname dilakukan per batch dengan lembar hitung yang dapat dicetak untuk dibawa ke rak. Setiap selisih wajib diberi alasan, hanya apoteker atau pemilik yang dapat mengesahkannya, dan penyesuaiannya otomatis masuk ke laporan SIPNAP. Faskes yang memiliki cabang dapat memindahkan obat antaroutlet lengkap dengan batch dan tanggal kedaluwarsanya, tanpa harus dicatat sebagai penjualan di satu tempat dan pembelian di tempat lain.',
              'Stock takes are done per batch, with a printable count sheet to take to the shelves. Every difference needs a reason, only a pharmacist or owner can approve it, and the adjustment flows into the SIPNAP report automatically. Facilities with branches can move medicine between outlets along with batch and expiry date, without recording it as a sale in one place and a purchase in another.'),
      Icon: ClipboardCheck,
      visual: (<AppWindow judul={t('Stok Opname', 'Stock Take')} sub="OPN/2026/0002" aktif={6}><div className="space-y-1.5">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] text-[var(--ink-faint)] px-1"><span>{t('Obat · Batch','Drug · Batch')}</span><span className="text-right">{t('Sistem','System')}</span><span className="text-right">{t('Fisik','Count')}</span><span className="text-right">{t('Selisih','Diff')}</span></div>
        {[['Paracetamol 500 mg','BT-2408','330','330','0',''],['Zinc 20 mg','BT-2312','7','6','-1',t('Rusak','Damaged')],['Oralit','BT-2401','22','22','0','']].map((r,i)=>(
          <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center rounded-lg border px-2.5 py-1.5 ${r[4]!=='0'?'border-red-200 bg-red-50':'border-[var(--line-soft)]'}`}>
            <div className="min-w-0"><p className="text-[12px] text-[var(--ink)] truncate">{r[0]}</p><p className="text-[10px] font-mono text-[var(--ink-faint)]">{r[1]}{r[5]?` · ${r[5]}`:''}</p></div>
            <span className="text-[12px] text-right text-[var(--ink-soft)]">{r[2]}</span><span className="text-[12px] text-right text-[var(--ink)]">{r[3]}</span>
            <span className={`text-[12px] text-right font-semibold ${r[4]!=='0'?'text-red-600':'text-[var(--ink-faint)]'}`}>{r[4]}</span>
          </div>))}
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] text-[var(--ink-soft)]"><ArrowLeftRight size={13} className="text-[var(--brand-soft)] shrink-0" />{t('TRF/2026/0002 · 1 batch ke Apotek Cabang Renon · diterima','TRF/2026/0002 · 1 batch to Renon Branch Pharmacy · received')}</div>
      </div></AppWindow>) },

    { bab: ['06', t('Pengelolaan faskes', 'Running the facility'), t('Hak akses, cabang, dan izin praktik. Bagian yang tidak terlihat pasien, tetapi selalu ditanyakan auditor.', 'Permissions, branches, and practice licences. The part patients never see, and auditors always ask about.')] as const,
      tag: t('HAK AKSES & AKUN STAF', 'PERMISSIONS & STAFF ACCOUNTS'),
      title: t('Setiap peran hanya membuka yang menjadi tugasnya.', 'Each role opens only what its job needs.'),
      body: t('Hak akses tidak sekadar menyembunyikan menu, tetapi dijaga langsung di server, sehingga petugas yang mengetik alamat halaman secara langsung tetap tidak dapat membuka data yang bukan haknya. Petugas pendaftaran mengelola identitas dan antrean tanpa membuka rekam medis; perawat mengisi tanda vital tanpa menulis diagnosis; farmasi melihat resep dan alergi tanpa membuka catatan dokter; kasir melihat tagihan tanpa membuka data medis. Akun staf dibuatkan oleh pemilik atau admin, dan setiap staf wajib mengganti kata sandinya sendiri saat pertama kali masuk.',
              'Permissions do not merely hide menus; they are guarded at the server, so staff who type a page address directly still cannot open data outside their role. Registration manages identity and queues without opening records; nurses enter vitals without writing diagnoses; pharmacy sees prescriptions and allergies without the doctor’s notes; the cashier sees bills without any medical data. Staff accounts are created by the owner or an admin, and every staff member must set their own password on first sign-in.'),
      Icon: Lock,
      visual: (<AppWindow judul={t('Pengaturan', 'Settings')} sub={t('Pengguna & Peran', 'Users & Roles')} aktif={9}><div className="overflow-hidden"><table className="w-full text-[11px]"><thead><tr className="text-[var(--ink-faint)] text-[10px]"><th className="text-left font-medium pb-1.5">{t('Peran','Role')}</th>{[t('Identitas','Identity'),'SOAP',t('Diagnosis','Dx'),t('Resep','Rx'),t('Tagihan','Bill')].map(h=><th key={h} className="font-medium pb-1.5">{h}</th>)}</tr></thead><tbody>
        {[[t('Pendaftaran','Registration'),1,0,0,0,0],[t('Perawat','Nurse'),1,1,0,0,0],[t('Dokter','Doctor'),1,1,1,1,0],[t('Farmasi','Pharmacy'),1,0,0,1,0],[t('Kasir','Cashier'),1,0,0,0,1]].map((r,i)=>(
          <tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-1.5 text-[var(--ink)]">{r[0]}</td>{(r.slice(1) as number[]).map((c,j)=>(<td key={j} className="py-1.5 text-center">{c?<Check size={12} className="inline text-green-600" />:<X size={12} className="inline text-[var(--ink-faint)]" />}</td>))}</tr>))}
      </tbody></table></div><p className="text-[11px] text-[var(--ink-faint)] mt-2">{t('Pemilik dan admin sengaja mendapatkan akses penuh. Mengunci pemilik dari datanya sendiri hanya akan membuat semua orang dibuatkan akun pemilik.','Owners and admins deliberately get full access. Locking an owner out of their own data only leads to everyone getting an owner account.')}</p></AppWindow>) },

    { tag: t('BANYAK CABANG', 'MULTIPLE BRANCHES'),
      title: t('Setiap cabang tetap berdiri sendiri.', 'Each branch stands on its own.'),
      body: t('Setiap cabang apotek memiliki izin, penanggung jawab, stok, dan laporan SIPNAP sendiri, karena memang begitulah aturannya. Yang dibagi hanya langganannya: cabang baru mengikuti paket dan masa aktif yang sama tanpa tagihan kedua. Satu orang dapat bekerja di beberapa cabang dengan peran berbeda di masing-masing, dan berpindah cabang cukup dengan satu klik.',
              'Each pharmacy branch has its own licence, person in charge, stock, and SIPNAP report, because that is the regulation. Only the subscription is shared: a new branch follows the same plan and validity with no second bill. One person can work at several branches with a different role at each, and switching branches takes one click.'),
      Icon: Building2,
      visual: (<AppWindow judul={t('Pengaturan', 'Settings')} sub={t('Outlet & Cabang', 'Outlets & Branches')} aktif={9}><div className="space-y-2">
        {[['Klinik Rexco 88',t('Klinik · Denpasar','Clinic · Denpasar'),t('Outlet aktif','Active outlet'),true],['Apotek Rexco Renon',t('Apotek · Renon','Pharmacy · Renon'),t('Pindah ke sini','Switch here'),false]].map((r,i)=>(
          <div key={i} className={`rounded-lg border px-2.5 py-2 flex items-center justify-between ${r[3]?'border-[var(--brand)] bg-[var(--surface-2)]':'border-[var(--line-soft)]'}`}>
            <div><p className="text-[12px] font-semibold text-[var(--ink)]">{r[0]}</p><p className="text-[11px] text-[var(--ink-faint)]">{r[1]}</p></div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${r[3]?'bg-[var(--brand)] text-[var(--on-brand)]':'bg-[var(--surface-2)] text-[var(--ink-soft)]'}`}>{r[2]}</span>
          </div>))}
        <div className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] text-[var(--ink-soft)]">{t('Stok, kasir, dan laporan mengikuti cabang yang sedang dibuka. Satu langganan, jumlah cabang mengikuti paket.','Stock, register, and reports follow the open branch. One subscription, branch count follows the plan.')}</div>
      </div></AppWindow>) },

    { tag: t('PERIZINAN TENAGA KESEHATAN', 'PRACTITIONER LICENCES'),
      title: t('STR dan SIP melekat pada orangnya, lengkap dengan masa berlaku.', 'Licences belong to the person, with their expiry.'),
      body: t('Klinik umumnya memiliki lebih dari satu dokter, dan resep yang dicetak harus memuat nomor izin dokter yang menulisnya. Izin praktik juga memiliki masa berlaku: SIP yang sudah habis berarti praktik hari itu tidak sah. Karena tanggalnya tersimpan, sistem dapat memberi peringatan jauh sebelum izin berakhir, dan sisa harinya dihitung server, bukan jam komputer klinik yang bisa saja keliru.',
              'A clinic usually has more than one doctor, and a printed prescription must carry the licence number of the doctor who wrote it. Practice licences also expire: a lapsed SIP means practice that day is unlawful. Because the date is stored, the system can warn well before the licence ends, and days remaining are counted by the server, not a clinic PC clock that may be wrong.'),
      Icon: Award,
      visual: (<AppWindow judul={t('Pengaturan', 'Settings')} sub={t('Tenaga Kesehatan', 'Clinical Staff')} aktif={9}><div className="space-y-1.5">
        {[['dr. Andi Wirawan','STR 3311/2023','SIP 4471/2024',t('Lewat 9 hari','9 days past'),'merah'],['drg. Rina Kusuma','STR 2210/2024','SIP 5512/2025',t('54 hari lagi','54 days left'),'amber'],['apt. Anessa Beckham','STR 1180/2025','SIPA 4471/2026',t('318 hari lagi','318 days left'),'hijau']].map((r,i)=>(
          <div key={i} className="rounded-lg border border-[var(--line-soft)] px-2.5 py-2">
            <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-[var(--ink)]">{r[0]}</span><Tingkat warna={r[4] as 'merah'|'amber'|'hijau'}>{r[3]}</Tingkat></div>
            <p className="text-[10px] text-[var(--ink-faint)] mt-0.5 font-mono">{r[1]} · {r[2]}</p>
          </div>))}
        <p className="text-[11px] text-[var(--ink-faint)]">{t('Tiga tingkat peringatan: yang sudah lewat berarti harus berhenti praktik, yang tinggal 60 hari berarti saatnya mengurus perpanjangan.','Three warning levels: lapsed means stop practising, sixty days left means start the renewal.')}</p>
      </div></AppWindow>) },
  ]

  /* ── Daftar modul lengkap, dikelompokkan supaya bisa dibacakan ── */
  const kelompokModul = [
    { judul: t('Pelayanan pasien', 'Patient services'), items: [
      [Stethoscope, t('Kunjungan & antrean per poli', 'Visits & per-unit queues'), t('Status kunjungan bergeser otomatis mengikuti resep, dan antrean dokter tersaring ke polinya sendiri.', 'Visit status moves on its own with the prescription, and each doctor sees their own unit’s queue.')],
      [CalendarClock, t('Reservasi', 'Appointments'), t('Jadwal praktik per sesi dengan kuota, dan reservasi yang tidak hadir otomatis dibatalkan.', 'Session-based schedules with quotas, and no-shows cancelled automatically.')],
      [UsersRound, t('Pasien & riwayat', 'Patients & history'), t('Identitas lengkap, data kerabat, alamat terperinci, dan akses ke rekam medis kunjungan lama.', 'Full identity, next of kin, detailed address, and access to past visit records.')],
      [FileText, t('Rekam medis SOAP', 'SOAP records'), t('Tanda vital berkode, ICD-10 resmi, adendum, dan riwayat status yang tercatat otomatis.', 'Coded vitals, official ICD-10, addenda, and an automatic status history.')],
      [GitBranch, t('Rujukan internal', 'Internal referral'), t('Satu kunjungan dapat berpindah poli, dengan catatan dan tarif konsultasi per poli.', 'One visit can move between units, with notes and consultation fees per unit.')],
      [Tv, t('Layar ruang tunggu', 'Waiting room screen'), t('Dibuka lewat tautan khusus tanpa login, nama pasien disamarkan, dan nomor dipanggil dengan suara.', 'Opened via a dedicated link with no login, names masked, numbers called aloud.')],
    ]},
    { judul: t('Klinis & penunjang', 'Clinical & ancillary'), items: [
      [Syringe, t('E-resep', 'E-prescription'), t('Dosis, frekuensi, dan cara pemberian terpisah; permintaan umum dokter diisi oleh farmasi.', 'Dose, frequency, and route separated; general requests from doctors are filled by pharmacy.')],
      [FlaskConical, t('Antrean farmasi & etiket', 'Pharmacy queue & labels'), t('Lima tahap resep, etiket 70 x 40 mm, putih untuk obat dalam dan biru untuk obat luar.', 'Five prescription stages, 70 x 40 mm labels, white for internal and blue for external use.')],
      [Microscope, t('Laboratorium & radiologi', 'Lab & imaging'), t('Hasil per parameter dengan nilai rujukan, permintaan cito didahulukan, nilai kritis ditandai merah.', 'Results per parameter with reference ranges, urgent requests first, critical values flagged red.')],
      [HeartPulse, t('Layanan jasa & tarif', 'Services & tariffs'), t('Tindakan berkode ICD-9-CM, tarif konsultasi per poli, dan biaya administrasi.', 'ICD-9-CM coded procedures, per-unit consultation fees, and admin fees.')],
      [Award, t('Perizinan tenaga kesehatan', 'Practitioner licences'), t('STR dan SIP beserta masa berlakunya, dengan peringatan sebelum habis.', 'STR and SIP with their validity, warned before they lapse.')],
      [ClipboardCheck, t('Poli & jadwal dokter', 'Units & doctor schedules'), t('Antrean per poli, penempatan dokter, dan sesi praktik berkuota.', 'Per-unit queues, doctor assignments, and sessions with quotas.')],
    ]},
    { judul: t('Keuangan & kepatuhan', 'Money & compliance'), items: [
      [ShoppingCart, t('Kasir & struk', 'POS & receipts'), t('Tunai, QRIS, transfer, pemindai barcode, dan penjualan obat golongan dengan pemeriksaan resep.', 'Cash, QRIS, transfer, barcode scanning, and controlled-drug sales with prescription checks.')],
      [Banknote, t('Tutup kasir & setoran', 'Register close & deposits'), t('Buka dan tutup laci per kasir, selisih wajib dijelaskan, bukti setoran dapat dicetak.', 'Open and close the drawer per cashier, differences must be explained, deposit slips print.')],
      [Wallet, t('Tagihan kunjungan', 'Visit billing'), t('Satu tagihan per kunjungan, terkunci setelah kunjungan ditutup.', 'One bill per visit, locked once the visit closes.')],
      [FileCheck, t('Klaim penjamin', 'Payer claims'), t('Klaim bernomor yang isinya terkunci, dipantau dari draf hingga dibayar, dengan faktur siap kirim.', 'Numbered claims with locked contents, tracked from draft to paid, with a ready-to-send invoice.')],
      [Receipt, t('Pembayaran faktur', 'Invoice payments'), t('Utang ke supplier diurutkan menurut jatuh tempo, dengan penanda keterlambatan dan bukti bayar.', 'Supplier debts sorted by due date, with overdue flags and payment receipts.')],
      [BarChart2, t('Laporan SIPNAP', 'SIPNAP reports'), t('Narkotika, psikotropika, dan prekursor. Tersedia di semua paket, termasuk paket termurah.', 'Narcotics, psychotropics, and precursors. In every plan, including the cheapest.')],
      [TrendingUp, t('Laporan penjualan & penjamin', 'Sales & payer reports'), t('Rekap metode pembayaran, serta pemisahan uang yang diterima dari yang masih ditagihkan.', 'Payment method recaps, and cash received separated from amounts still billed.')],
    ]},
    { judul: t('Barang & operasional', 'Stock & operations'), items: [
      [Pill, t('Produk, batch & kedaluwarsa', 'Products, batches & expiry'), t('Katalog, harga, rak, barcode, dan tiga tingkat peringatan kedaluwarsa.', 'Catalog, prices, shelves, barcodes, and three levels of expiry warning.')],
      [ClipboardCheck, t('Stok opname', 'Stock take'), t('Hitung fisik per batch dengan lembar hitung tercetak, dan setiap selisih wajib beralasan.', 'Physical counts per batch with a printed count sheet, and every difference needs a reason.')],
      [ArrowLeftRight, t('Transfer antarcabang', 'Branch transfers'), t('Pindahkan obat antaroutlet lengkap dengan batch dan tanggal kedaluwarsanya.', 'Move medicine between outlets with batch and expiry date intact.')],
      [Wand2, t('Pemesanan terpandu', 'Guided ordering'), t('Pesan ulang dari stok minimum, otomatis terbagi menjadi surat pesanan per distributor.', 'Reorder from minimum stock, split automatically into one purchase order per distributor.')],
      [PackageOpen, t('Pembelian & penerimaan', 'Purchasing & receiving'), t('Surat pesanan, penerimaan bertahap, dan faktur pembelian.', 'Purchase orders, partial receiving, and purchase invoices.')],
      [ClipboardList, t('Tindak lanjut kedaluwarsa', 'Expiry follow-up'), t('Pemusnahan dengan Berita Acara resmi atau retur ke supplier; stok berkurang setelah dikonfirmasi.', 'Destruction with an official report or a supplier return; stock drops after confirmation.')],
      [Building2, t('Banyak cabang', 'Multiple branches'), t('Setiap cabang tetap berdiri sendiri dalam satu langganan, dengan akses per pengguna per cabang.', 'Each branch stands alone within one subscription, with per-user, per-branch access.')],
      [Database, t('Impor & ekspor data', 'Data import & export'), t('Pindahkan produk, stok awal, supplier, tarif, pasien, dan utang dari Excel. Data dapat diekspor kapan saja.', 'Bring products, opening stock, suppliers, tariffs, patients, and debts over from Excel. Export any time.')],
    ]},
  ] as const

  /* ── Aturan yang ditolak DATABASE, bukan cuma layar ── */
  const aturan = [
    [t('Kuota paket', 'Plan quota'), t('Jumlah produk, pengguna, dan cabang mengikuti paket, termasuk saat impor data massal.', 'Products, users, and branches follow the plan, bulk imports included.')],
    [t('Masa aktif habis', 'Subscription lapsed'), t('Yang berhenti hanya transaksi baru. SIPNAP, cetak ulang faktur, dan kartu stok tetap dapat dibuka.', 'Only new transactions stop. SIPNAP, invoice reprints, and stock cards stay open.')],
    [t('Stok tidak cukup', 'Insufficient stock'), t('Penjualan yang melebihi stok batch yang tersedia ditolak sebelum uang tercatat.', 'A sale beyond available batch stock is refused before any money is recorded.')],
    [t('Obat golongan tanpa identitas', 'Controlled drugs without identity'), t('Narkotika, psikotropika, dan prekursor wajib disertai data pasien dan nomor resep.', 'Narcotics, psychotropics, and precursors require patient data and a prescription number.')],
    [t('Peran tidak berhak', 'Role not permitted'), t('Hak membuka data medis diperiksa langsung di server, bukan hanya disembunyikan dari menu.', 'The right to open medical data is checked at the server, not just hidden from the menu.')],
    [t('Data tidak sah', 'Invalid data'), t('Termasuk reservasi ganda dan dua kunjungan terbuka untuk satu pasien pada hari yang sama.', 'Including duplicate bookings and two open visits for one patient on the same day.')],
  ]

  const aturanMedis = [
    t('Kunjungan tidak dapat ditutup tanpa diagnosis.', 'A visit cannot close without a diagnosis.'),
    t('Rekam medis yang sudah ditutup hanya dapat ditambah adendum, tidak dapat diubah.', 'A closed record can only receive an addendum, never an edit.'),
    t('Resep yang sudah final hanya dapat dibatalkan lalu ditulis ulang.', 'A finalised prescription can only be cancelled and rewritten.'),
    t('Farmasi tidak dapat menambahkan obat yang tidak ditulis dokter.', 'Pharmacy cannot add a drug the doctor did not write.'),
    t('Satu pasien tidak dapat memiliki dua kunjungan terbuka pada hari yang sama.', 'One patient cannot hold two open visits on the same day.'),
    t('Data setiap faskes terpisah sepenuhnya di server, bukan sekadar disaring oleh aplikasi.', 'Each facility’s data is fully separated at the server, not merely filtered by the app.'),
  ]

  /* ── Perbandingan jujur ── */
  const banding = {
    kolom: [t('Buku & Excel', 'Books & Excel'), t('Aplikasi kasir umum', 'Generic POS'), 'Sehatera'],
    baris: [
      [t('Stok per batch dan tanggal kedaluwarsa', 'Stock per batch and expiry date'), 0, 1, 2],
      [t('Laporan SIPNAP siap cetak', 'Print-ready SIPNAP report'), 0, 0, 2],
      [t('Rekam medis SOAP dengan ICD-10 resmi', 'SOAP records with official ICD-10'), 0, 0, 2],
      [t('Satu tagihan per kunjungan', 'One bill per visit'), 0, 0, 2],
      [t('Klaim penjamin terpantau hingga dibayar', 'Payer claims tracked until paid'), 0, 0, 2],
      [t('Stok opname dan tutup kasir tercatat', 'Recorded stock takes and register closes'), 0, 1, 2],
      [t('Hak akses dijaga di server', 'Permissions guarded at the server'), 0, 1, 2],
      [t('Beberapa cabang dalam satu langganan', 'Several branches in one subscription'), 0, 1, 2],
      [t('Data siap dikirim ke SatuSehat', 'Data ready for SatuSehat'), 0, 0, 2],
    ] as [string, number, number, number][],
  }

  /* ── Tanya jawab. Ini bagian yang dipakai menutup penjualan. ── */
  const faq = [
    [t('Data lama kami ada di Excel dan buku. Apakah harus diketik ulang?', 'Our old data is in Excel and notebooks. Do we have to retype it?'),
     t('Tidak perlu. Unduh template, isi di Excel, lalu unggah: produk, stok awal, supplier, tarif layanan, data pasien, hingga saldo utang dapat langsung masuk. Pekerjaan yang biasanya memakan waktu berhari-hari dapat selesai dalam satu sesi pendampingan. Data juga dapat diekspor kapan saja, sehingga Anda tidak terkunci.',
       'No. Download a template, fill it in Excel, then upload: products, opening stock, suppliers, service tariffs, patients, and outstanding debts come straight in. Work that usually takes days finishes in one assisted session. Data can also be exported at any time, so you are never locked in.')],
    [t('Apakah sudah terhubung ke SatuSehat dan BPJS?', 'Is it connected to SatuSehat and BPJS?'),
     t('Pengiriman ke SatuSehat sudah dibangun dan berhasil diuji di lingkungan uji (sandbox) Kemenkes untuk kunjungan, diagnosis, tindakan, resep, dan hasil laboratorium. Untuk produksi, Sehatera sedang menunggu verifikasi sebagai Penyedia Sistem RME, dan setiap faskes memerlukan kredensial resminya sendiri. BPJS belum tersambung. Yang terpenting, data Anda sejak hari pertama sudah dicatat dalam bentuk yang diminta kedua sistem tersebut, sehingga tidak perlu diketik ulang nanti.',
       'Sending to SatuSehat is built and has been proven on the Ministry’s test environment (sandbox) for visits, diagnoses, procedures, prescriptions, and lab results. For production, Sehatera is awaiting verification as an EMR System Provider, and each facility needs its own official credentials. BPJS is not connected yet. Most importantly, your data is recorded from day one in the shape both systems require, so nothing needs retyping later.')],
    [t('Jika internet mati, apakah pelayanan berhenti?', 'If the internet drops, does service stop?'),
     t('Sehatera berjalan di peramban dan memang membutuhkan internet. Cukup siapkan satu cadangan: hotspot dari ponsel. Sebagai gantinya, data tidak tersimpan di komputer kasir, sehingga komputer yang rusak, hilang, atau terkena virus tidak ikut menghilangkan pembukuan Anda. Sehatera juga dapat dipasang seperti aplikasi di komputer melalui Chrome.',
       'Sehatera runs in the browser and does need internet. Keep one fallback ready: a phone hotspot. In exchange, data does not live on the till PC, so a computer that breaks, is stolen, or catches a virus does not take your books with it. Sehatera can also be installed like an app on a computer through Chrome.')],
    [t('Siapa saja yang dapat melihat data pasien kami?', 'Who can see our patient data?'),
     t('Data setiap faskes terpisah sepenuhnya di server, sehingga faskes lain tidak dapat melihat data Anda sama sekali. Di dalam faskes, setiap staf hanya dapat membuka data sesuai perannya, dan pemeriksaannya dilakukan di server, bukan hanya dengan menyembunyikan menu. Setiap staf memiliki akun sendiri dengan kata sandi yang hanya ia ketahui, dan akun otomatis keluar setelah dua jam tidak digunakan. Nama pasien di layar ruang tunggu pun disamarkan.',
       'Each facility’s data is fully separated at the server, so other facilities cannot see your data at all. Inside the facility, each staff member can open only what their role allows, checked at the server rather than by hiding menus. Every staff member has their own account with a password only they know, and accounts sign out automatically after two idle hours. Patient names on the waiting room screen are masked too.')],
    [t('Bagaimana staf baru mendapatkan akun?', 'How do new staff get an account?'),
     t('Pemilik atau admin membuatkan akun dengan email dan kata sandi awal, lalu menyampaikannya langsung kepada staf. Saat pertama kali masuk, staf wajib mengganti kata sandi dengan miliknya sendiri. Jika staf lupa kata sandi, admin dapat mengatur ulang tanpa perlu email.',
       'The owner or an admin creates the account with an email and a first password, then passes them on in person. On first sign-in the staff member must replace the password with their own. If they forget it, an admin can reset it without email.')],
    [t('Kami memiliki dua cabang. Apakah perlu dua langganan?', 'We have two branches. Do we need two subscriptions?'),
     t('Tidak. Cabang kedua mengikuti paket dan masa aktif cabang pertama, dengan jumlah cabang sesuai kuota paket. Setiap cabang tetap memiliki stok, penanggung jawab, dan laporan SIPNAP sendiri, sesuai ketentuan pelaporan. Obat dapat dipindahkan antarcabang, dan satu orang dapat bekerja di beberapa cabang dengan peran berbeda.',
       'No. The second branch follows the first one’s plan and validity, with the branch count set by the plan quota. Each branch keeps its own stock, person in charge, and SIPNAP report, as the reporting rules require. Medicine can be moved between branches, and one person can work at several branches with different roles.')],
    [t('Berapa lama hingga siap digunakan?', 'How long until we can use it?'),
     t('Pendaftaran mandiri langsung aktif dengan masa coba, dan Beranda memandu langkah-langkah persiapannya. Lamanya bergantung pada data awal: jika katalog dan stok sudah rapi di Excel, satu sesi pendampingan sudah cukup. Aktivasi, impor data awal, pengaturan poli, tarif, dan akun staf dibantu langsung oleh tim Seawise.',
       'Self-registration is active immediately with a trial, and the Home screen guides the setup steps. Timing depends on your starting data: if the catalog and stock are tidy in Excel, one assisted session is enough. Activation, initial import, units, tariffs, and staff accounts are set up with the Seawise team.')],
    [t('Jika masa langganan habis, apakah data kami hilang?', 'If our subscription lapses, do we lose our data?'),
     t('Tidak, dan aplikasinya tidak dikunci. Yang berhenti hanya transaksi baru. Faskes yang masa aktifnya habis tetap memiliki kewajiban laporan SIPNAP bulan itu, tetap perlu mencetak ulang faktur, dan tetap perlu melihat kartu stoknya. Rekam medis pasien juga tetap dapat dibuka, karena rekam medis adalah dokumen milik pasien.',
       'No, and the app is not locked. Only new transactions stop. A lapsed facility still owes that month’s SIPNAP report, still needs to reprint invoices, and still needs its stock cards. Patient records also stay open, because a medical record belongs to the patient.')],
    [t('Apakah ada pemeriksaan interaksi obat?', 'Is there a drug interaction checker?'),
     t('Sengaja tidak ada, dan hal ini disampaikan di layar resep. Pemeriksaan interaksi obat membutuhkan basis data yang terus diperbarui, dan fitur yang setengah benar lebih berbahaya daripada tidak ada karena orang mulai memercayainya. Alasan yang sama membuat kami tidak menerjemahkan 18.543 nama diagnosis secara otomatis.',
       'Deliberately not, and the prescription screen says so. Interaction checking needs a continuously maintained database, and a half-correct feature is more dangerous than none because people start to trust it. The same reason keeps us from machine-translating 18,543 diagnosis names.')],
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
          {t('Pendaftaran, antrean, rekam medis, e-resep, laboratorium, kasir, klaim penjamin, stok obat, hingga laporan wajib, semuanya dalam satu aplikasi. Aturan pentingnya dijaga langsung oleh sistem, bukan sekadar diingatkan di layar.',
             'Registration, queues, medical records, e-prescriptions, lab, POS, payer claims, drug stock, and mandatory reports, all in one app. The important rules are guarded by the system itself, not merely reminded on screen.')}
        </p>
        <div className="reveal flex flex-wrap items-center justify-center gap-2 mb-8" style={{ transitionDelay: '.12s' }}>
          <Chip><BadgeCheck size={13} className="text-[var(--brand-soft)]" /> {t('18.543 kode ICD-10 resmi Kemenkes', '18,543 official ICD-10 codes')}</Chip>
          <Chip><BadgeCheck size={13} className="text-[var(--brand-soft)]" /> {t('4.626 kode ICD-9-CM', '4,626 ICD-9-CM codes')}</Chip>
          <Chip><ShieldCheck size={13} className="text-[var(--brand-soft)]" /> {t('Data setiap faskes terpisah', 'Per-facility data separation')}</Chip>
          <Chip><BadgeCheck size={13} className="text-[var(--brand-soft)]" /> {t('Teruji di sandbox SatuSehat', 'Proven on the SatuSehat sandbox')}</Chip>
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
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Jenis faskes menentukan menunya.', 'The facility type decides the menu.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg max-w-2xl mx-auto mb-10" style={{ transitionDelay: '.05s' }}>
          {t('Apotek dengan paket tertinggi pun tidak akan melihat menu Antrean Pasien, karena apotek memang tidak memiliki antrean pasien, bukan karena paketnya kurang.',
             'Even a pharmacy on the top plan never sees the Patient Queue menu, because a pharmacy has no patient queue, not because its plan falls short.')}
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
        <div className="reveal bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-3xl p-6 sm:p-9">
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-3">{t('Menu yang tersedia', 'Menus included')}</p>
              <div className="flex flex-wrap gap-2">
                {S.modul.map(m => <Chip key={m}><Check size={12} className="text-[var(--brand-soft)]" /> {m}</Chip>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Masalah (gelap) */}
      <section className="kn-dark text-[var(--on-brand)] py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-6">{t('Yang menggerus keuntungan tanpa terasa.', 'What quietly eats the margin.')}</h2>
          <p className="reveal text-[var(--on-brand-soft)] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>{t('Enam kebocoran yang jarang dikeluhkan, karena baru ketahuan saat audit atau tutup buku.', 'Six leaks rarely complained about, because they surface only at an audit or the monthly close.')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {[
              [t('Obat kedaluwarsa terbuang', 'Expired medicine wasted'), t('Tanpa pemantauan batch dan tanggal, stok mati baru ketahuan saat hendak dijual.', 'Without batch and date tracking, dead stock is found only when someone tries to sell it.')],
              [t('Laporan SIPNAP manual', 'Manual SIPNAP reports'), t('Rekap narkotika dan psikotropika menyita satu malam penuh dan rawan salah.', 'Narcotics and psychotropics recaps take a whole evening and go wrong easily.')],
              [t('Faktur jatuh tempo terlewat', 'Missed invoice due dates'), t('Utang ke supplier tercatat di beberapa buku, dan denda baru datang belakangan.', 'Supplier debts are scattered across notebooks, and penalties arrive later.')],
              [t('Rekam medis di atas kertas', 'Records on paper'), t('Riwayat pasien tahun lalu tersimpan di lemari dan sulit ditemukan saat dibutuhkan.', 'Last year’s history sits in a cabinet and is hard to find when it matters.')],
              [t('Tagihan pasien kurang satu baris', 'A bill missing one line'), t('Tindakan yang belum dicatat saat kasir menagih tidak akan pernah tertagih.', 'A procedure not yet recorded when the cashier bills is never billed at all.')],
              [t('Klaim penjamin tidak terpantau', 'Untracked payer claims'), t('Tidak ada yang tahu klaim mana yang sudah dikirim dan berapa yang belum dibayar.', 'Nobody knows which claims were sent or how much is still unpaid.')],
            ].map((p, i) => (
              <div key={i} className="reveal bg-[var(--on-brand)]/[0.08] border border-[var(--on-brand)]/15 rounded-2xl p-6" style={{ transitionDelay: `${(i % 3) * .07}s` }}>
                <p className="font-semibold text-lg mb-1.5">{p[0]}</p>
                <p className="text-[var(--on-brand-soft)] text-sm leading-relaxed">{p[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur satu pasien */}
      <section id="alur" className="max-w-6xl mx-auto px-5 py-20 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Satu pasien, dari pemesanan hingga klaim dibayar.', 'One patient, from booking to a paid claim.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>
          {t('Sembilan langkah, dan setiap langkah dicatat oleh orang yang benar-benar mengerjakannya.', 'Nine steps, each recorded by whoever actually did the work.')}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alur.map((a, i) => (
            <div key={i} className="reveal relative bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-2xl p-5 pl-6" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
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
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Dua puluh tujuh modul dalam satu langganan.', 'Twenty-seven modules, one subscription.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-12" style={{ transitionDelay: '.05s' }}>{t('Semua yang tercantum di sini benar-benar tersedia di aplikasi hari ini.', 'Everything listed here genuinely exists in the app today.')}</p>
        <div className="space-y-10">
          {kelompokModul.map((k, ki) => (
            <div key={ki}>
              <p className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-4">{k.judul}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {k.items.map(([Ic, judul, d], i) => (
                  <div key={i} className="reveal bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-2xl p-5" style={{ transitionDelay: `${(i % 3) * .05}s` }}>
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
      <section id="aturan" className="kn-dark text-[var(--on-brand)] py-20 sm:py-24 scroll-mt-28">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="reveal text-[var(--on-brand-soft)] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t('Dijaga sistem, bukan sekadar diingatkan', 'Guarded, not just reminded')}</p>
            <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-4" style={{ transitionDelay: '.05s' }}>{t('Aturan penting dijaga oleh sistem, bukan oleh ingatan.', 'Important rules are kept by the system, not by memory.')}</h2>
            <p className="reveal text-[var(--on-brand-soft)] text-lg max-w-3xl mx-auto" style={{ transitionDelay: '.1s' }}>
              {t('Pemeriksaan yang hanya ada di formulir akan terlewati saat data diimpor massal atau saat ada layar baru yang lupa memeriksanya. Di Sehatera, aturan berikut dijaga langsung di server, dan setiap penolakan disertai penjelasan yang ditulis untuk pemilik faskes, bukan untuk programmer.',
                 'A check that lives only in a form gets skipped by a bulk import or by a new screen that forgets to look. In Sehatera the rules below are kept at the server, and every refusal comes with an explanation written for the facility owner, not for a programmer.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {aturan.map(([judul, d], i) => (
              <div key={i} className="reveal bg-[var(--on-brand)]/[0.08] border border-[var(--on-brand)]/15 rounded-2xl p-5" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
                <Lock size={16} className="text-[var(--accent)] mb-2.5" />
                <p className="font-semibold mb-1">{judul}</p>
                <p className="text-[var(--on-brand-soft)] text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <div className="reveal bg-[var(--on-brand)]/[0.08] border border-[var(--on-brand)]/15 rounded-2xl p-6">
            <p className="font-semibold mb-4">{t('Enam aturan medis yang tidak dapat dilewati dari layar mana pun', 'Six clinical rules no screen can get around')}</p>
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
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Mengapa bukan Excel, dan mengapa bukan aplikasi kasir biasa.', 'Why not Excel, and why not a generic POS.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-10" style={{ transitionDelay: '.05s' }}>{t('Keduanya dapat mencatat penjualan. Yang tidak dapat mereka lakukan tercantum di bawah ini.', 'Both can record a sale. What they cannot do is listed below.')}</p>
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
        <div className="reveal bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-3xl p-7 sm:p-10">
          <p className="text-[var(--accent)] text-xs font-semibold uppercase tracking-[0.18em] mb-3">{t('Integrasi sistem nasional', 'National system integration')}</p>
          <h2 className="kn-headline text-2xl sm:text-3xl font-bold mb-4">{t('SatuSehat sudah berjalan di lingkungan uji. BPJS menyusul.', 'SatuSehat already runs on the test environment. BPJS is next.')}</h2>
          <p className="text-[var(--ink-mid)] leading-relaxed mb-7 max-w-3xl">
            {t('Kami menyampaikannya apa adanya. Pengiriman data ke SatuSehat sudah dibangun dan berhasil diuji di lingkungan uji (sandbox) Kemenkes untuk kunjungan, diagnosis, tindakan, resep, dan hasil laboratorium. Untuk lingkungan produksi, Sehatera sedang menunggu verifikasi sebagai Penyedia Sistem RME. Integrasi BPJS menunggu kredensial resmi dari faskes mitra.',
               'We say it plainly. Sending data to SatuSehat is built and has been proven on the Ministry of Health test environment (sandbox) for visits, diagnoses, procedures, prescriptions, and lab results. For production, Sehatera is awaiting verification as an EMR System Provider. BPJS integration awaits official credentials from a partner facility.')}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              { Ic: BadgeCheck, judul: t('Kunjungan dan diagnosis ICD-10', 'Visits and ICD-10 diagnoses'), d: t('Setiap kunjungan dikirim lengkap dengan riwayat statusnya, dan setiap diagnosis sebagai data tersendiri sesuai ketentuan SatuSehat.', 'Each visit is sent with its full status history, and each diagnosis as its own record, as SatuSehat requires.') },
              { Ic: BadgeCheck, judul: t('Tindakan berkode ICD-9-CM', 'ICD-9-CM coded procedures'), d: t('Kode tindakan melekat di daftar layanan dan ikut ke tagihan, lengkap dengan siapa yang mengerjakannya.', 'Procedure codes live in the service list and flow into the bill, along with who performed them.') },
              { Ic: BadgeCheck, judul: t('Resep dan hasil laboratorium', 'Prescriptions and lab results'), d: t('Resep dikirim dengan kode obat nasional (KFA), dan hasil laboratorium per parameter dengan kode standar internasional.', 'Prescriptions are sent with national drug codes (KFA), and lab results per parameter with international standard codes.') },
              { Ic: Lock, judul: t('Kredensial per faskes, terenkripsi', 'Encrypted per-facility credentials'), d: t('Kredensial setiap faskes disimpan di brankas rahasia, bukan di pengaturan biasa, dan tidak dapat dibaca kembali dari layar.', 'Each facility’s credentials are kept in a secret vault, not in ordinary settings, and can never be read back from a screen.') },
            ].map(({ Ic, judul, d }, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center shrink-0"><Ic size={16} /></span>
                <div><p className="font-semibold text-[15px]">{judul}</p><p className="text-[var(--ink-soft)] text-sm leading-relaxed">{d}</p></div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)]/70 px-4 py-3">
            <p className="text-sm text-[var(--ink-mid)] leading-relaxed">
              {t('Kredensial SatuSehat dan BPJS diberikan per faskes, bukan per vendor. Begitu kredensial produksi faskes Anda terbit, pengirimannya tinggal diaktifkan, karena data yang tercatat sejak hari pertama sudah dalam bentuk yang siap dikirim.',
                 'SatuSehat and BPJS credentials are issued per facility, not per vendor. Once your facility’s production credentials are issued, sending only needs switching on, because data recorded from day one is already in a sendable shape.')}
            </p>
          </div>
        </div>
      </section>

      {/* Harga.
          Angkanya dibaca dari tabel `plans`, bukan ditulis di sini. Halaman ini
          dulu memasang dua angka yang tidak ada di database dan tidak pernah
          ditagihkan; siapa pun yang membacanya lalu mendaftar akan menemukan
          harga yang sama sekali lain begitu masuk. */}
      <section id="harga" className="kn-dark text-[var(--on-brand)] py-20 sm:py-28 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <p className="reveal text-[var(--on-brand-soft)] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t('Harga', 'Pricing')}</p>
            <h2 className="reveal kn-headline text-4xl sm:text-5xl font-bold mb-3" style={{ transitionDelay: '.05s' }}>
              {t('Bayar sesuai ukuran faskes Anda', 'Pay for the size of your facility')}
            </h2>
            <p className="reveal text-[var(--on-brand-soft)] text-lg" style={{ transitionDelay: '.1s' }}>
              {t('Naik paket saat faskes Anda berkembang, bukan sebelumnya.', 'Move up when your facility grows, not before.')}
            </p>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <DaftarPaket nada="gelap" />
          </div>
          <div className="reveal mt-8 grid sm:grid-cols-3 gap-4 text-sm">
            {[
              [t('Masa coba lebih dulu', 'Trial first'), t('Daftar sendiri, coba dengan data Anda, baru putuskan.', 'Register yourself, try it with your own data, then decide.')],
              [t('Kuota benar-benar dijaga', 'Quotas genuinely enforced'), t('Jumlah produk, pengguna, dan cabang dibatasi sesuai paket langsung oleh sistem, sehingga angka di sini bukan sekadar tulisan.', 'Products, users, and branches are capped by plan in the system itself, so these numbers are not just words.')],
              [t('Rumah sakit', 'Hospitals'), t('Klinik memiliki paket tersendiri di atas. Untuk rumah sakit, harga disusun per penawaran karena kebutuhan dan pemasangannya berbeda di setiap fasilitas. Silakan hubungi tim Seawise.', 'Clinics have their own plan above. Hospitals are priced by quotation, because needs and setup differ per facility. Please contact the Seawise team.')],
            ].map((c, i) => (
              <div key={i} className="bg-[var(--on-brand)]/[0.08] border border-[var(--on-brand)]/15 rounded-2xl p-5">
                <p className="font-semibold mb-1">{c[0]}</p>
                <p className="text-[var(--on-brand-soft)] leading-relaxed">{c[1]}</p>
              </div>
            ))}
          </div>
          <div className="reveal flex flex-wrap items-center justify-center gap-3 mt-10" style={{ transitionDelay: '.25s' }}>
            <a href="/" className="inline-flex items-center gap-2 bg-[var(--surface)] text-[var(--brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--line-soft)] transition">
              {t('Daftarkan Faskes Sekarang', 'Register Your Facility Now')} <ArrowRight size={18} />
            </a>
            <a href={wa(t('Halo Seawise, saya ingin penawaran Sehatera untuk rumah sakit.', 'Hello Seawise, I would like a Sehatera quotation for a hospital.'))}
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 border border-[var(--on-brand)]/25 text-[var(--on-brand)] px-7 py-3.5 rounded-xl font-bold hover:bg-[var(--on-brand)]/10 transition">
              <MessageCircle size={18} /> {t('Minta Penawaran Rumah Sakit', 'Request a Hospital Quote')}
            </a>
          </div>
        </div>
      </section>

      {/* Tanya jawab */}
      <section id="tanya-jawab" className="max-w-3xl mx-auto px-5 py-20 scroll-mt-28">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">{t('Pertanyaan yang sering diajukan.', 'Frequently asked questions.')}</h2>
        <p className="reveal text-center text-[var(--ink-mid)] text-lg mb-10" style={{ transitionDelay: '.05s' }}>{t('Termasuk pertanyaan yang jawabannya belum sempurna, karena di situlah kepercayaan diuji.', 'Including the ones whose answers are not perfect yet, because that is where trust is tested.')}</p>
        <div className="space-y-3">
          {faq.map(([q, a], i) => (
            <div key={i} className="reveal bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-2xl overflow-hidden">
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
        <div className="reveal bg-[var(--surface)]/70 border border-[var(--line)] shadow-sm rounded-3xl px-6 py-14 sm:px-12">
          <h2 className="kn-headline text-3xl sm:text-5xl font-bold mb-5">{t('Siap membuat faskes Anda lebih tenang?', 'Ready for a calmer facility?')}</h2>
          <p className="text-[var(--ink-mid)] text-lg mb-8 max-w-2xl mx-auto">
            {t('Mulai hari ini dengan masa coba. Aktivasi, impor data awal, pengaturan poli dan tarif, hingga pembuatan akun staf dibantu langsung oleh tim Seawise.',
               'Start today with a trial. Activation, initial data import, unit and tariff setup, and staff accounts are set up with the Seawise team.')}
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
