/**
 * Latar halaman masuk: pemandangan dunia kesehatan.
 *
 * Komposisinya mengikuti rujukan yang diminta: rumah sakit dengan ambulans di
 * kiri, apotek di kanan, meja resepsionis klinik, tanaman di latar depan, dan
 * ikon medis melayang dalam heksagon, tapi digambar sebagai SVG, bukan render
 * 3D. Dua hal yang tidak bisa diberikan gambar raster:
 *
 * 1. Ikut tema. Setiap warna di sini adalah token. Ganti tema, seluruh
 *    pemandangan ikut berganti. Render 3D harus disediakan empat kali, dan
 *    tetap salah begitu ada tema kelima.
 * 2. Tidak ada permintaan jaringan, dan tajam di layar sebesar apa pun. Ini
 *    layar pertama yang dilihat orang, sering di jaringan klinik yang lambat.
 *
 * Yang TIDAK bisa disamai: kedalaman fotografis render 3D. Jadi gayanya sengaja
 * dibuat ilustrasi datar berlapis: pilihan yang terbaca sebagai keputusan
 * desain, bukan sebagai tiruan yang gagal.
 *
 * Kedalaman dibangun dari empat lapis, makin dekat makin pekat:
 *   langit & awan → kota jauh → bangunan utama → latar depan
 */
export function AuthBackdrop() {
  return (
    <div className="sw-scene" aria-hidden="true">
      <div className="sw-scene-sky" />

      <svg
        className="sw-scene-art"
        viewBox="0 0 2200 1500"
        preserveAspectRatio="xMidYMax slice"
        role="presentation"
      >
        {/* Kanvas sengaja jauh lebih besar daripada isinya. Dua akibat yang
            keduanya diinginkan: pemandangan tampil lebih KECIL (jadi ia latar,
            bukan saingan bagi formulir), dan `slice` memotong dari langit yang
            kosong, bukan dari bangunan. */}
        <g transform="translate(300 600)">
        {/* ── Awan ─────────────────────────────────────────────── */}
        <g fill="var(--surface)" opacity="0.34">
          <ellipse cx="240" cy="140" rx="130" ry="42" />
          <ellipse cx="330" cy="118" rx="92" ry="34" />
          <ellipse cx="1290" cy="112" rx="150" ry="46" />
          <ellipse cx="1180" cy="136" rx="96" ry="34" />
          <ellipse cx="800" cy="86" rx="112" ry="32" />
        </g>

        {/* ── Garis EKG melintasi langit ────────────────────────── */}
        <path
          d="M0 236h190l26-58 30 132 34-96 22 22h150"
          stroke="var(--on-grad)" strokeWidth="2.5" fill="none" opacity="0.18"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── Heksagon ikon medis (kanan atas, seperti rujukan) ─── */}
        <g opacity="0.2">
          <HexIcon cx={1352} cy={110} r={44}><Heart /></HexIcon>
          <HexIcon cx={1452} cy={186} r={40}><Shield /></HexIcon>
          <HexIcon cx={1262} cy={190} r={38}><Pill /></HexIcon>
          <HexIcon cx={1356} cy={262} r={36}><Dna /></HexIcon>
        </g>

        {/* ── Kota jauh ────────────────────────────────────────── */}
        <g fill="var(--on-grad)" opacity="0.07">
          <rect x="120" y="330" width="74" height="330" rx="4" />
          <rect x="212" y="392" width="58" height="268" rx="4" />
          <rect x="600" y="300" width="66" height="360" rx="4" />
          <rect x="684" y="366" width="52" height="294" rx="4" />
          <rect x="880" y="336" width="70" height="324" rx="4" />
          <rect x="1420" y="356" width="88" height="304" rx="4" />
          <rect x="1520" y="404" width="72" height="256" rx="4" />
        </g>

        {/* ══ RUMAH SAKIT (kiri) ═══════════════════════════════════ */}
        <g>
          <rect x="-40" y="300" width="420" height="420" rx="10" fill="var(--on-grad)" opacity="0.16" />
          {/* atap & helipad */}
          <rect x="20" y="268" width="290" height="34" rx="6" fill="var(--on-grad)" opacity="0.18" />
          <circle cx="165" cy="285" r="13" fill="none" stroke="var(--on-grad)" strokeWidth="3" opacity="0.4" />
          <path d="M158 285h14M165 278v14" stroke="var(--on-grad)" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
          {/* papan nama */}
          <rect x="-10" y="330" width="250" height="52" rx="8" fill="var(--surface)" opacity="0.82" />
          <g transform="translate(8 344)">
            <rect x="9" y="0" width="8" height="26" rx="2.5" fill="var(--brand)" />
            <rect x="0" y="9" width="26" height="8" rx="2.5" fill="var(--brand)" />
          </g>
          <text x="46" y="366" fill="var(--brand)" opacity="0.9"
            style={{ font: '700 26px var(--font-sora), system-ui, sans-serif', letterSpacing: '0.02em' }}>
            HOSPITAL
          </text>
          {/* jendela */}
          <g fill="var(--surface)" opacity="0.45">
            {[418, 470, 522, 574].map((y) =>
              [0, 56, 112, 204, 260, 316].map((x) => (
                <rect key={`h${x}-${y}`} x={x} y={y} width="38" height="34" rx="3" />
              )),
            )}
          </g>
          {/* kanopi IGD */}
          <rect x="40" y="612" width="230" height="40" rx="6" fill="var(--brand)" opacity="0.34" />
          <text x="90" y="639" fill="var(--surface)" opacity="0.9"
            style={{ font: '600 17px var(--font-sans), system-ui, sans-serif', letterSpacing: '0.08em' }}>
            EMERGENCY
          </text>
        </g>

        {/* ── Ambulans ─────────────────────────────────────────── */}
        <g transform="translate(-10 656)">
          <rect x="0" y="0" width="196" height="74" rx="11" fill="var(--surface)" opacity="0.92" />
          <path d="M196 22h56l42 36v16h-98z" fill="var(--surface)" opacity="0.92" />
          <rect x="208" y="30" width="34" height="24" rx="4" fill="var(--on-grad)" opacity="0.28" />
          {/* palang di badan */}
          <g transform="translate(64 20)">
            <rect x="12" y="0" width="11" height="34" rx="3" fill="var(--brand)" opacity="0.8" />
            <rect x="0" y="11" width="35" height="11" rx="3" fill="var(--brand)" opacity="0.8" />
          </g>
          <rect x="20" y="-12" width="52" height="14" rx="6" fill="var(--accent)" opacity="0.75" />
          <g fill="var(--on-grad)" opacity="0.6">
            <circle cx="56" cy="80" r="19" />
            <circle cx="248" cy="80" r="19" />
          </g>
          <g fill="var(--surface)" opacity="0.85">
            <circle cx="56" cy="80" r="8" />
            <circle cx="248" cy="80" r="8" />
          </g>
        </g>

        {/* ══ APOTEK (kanan) ═══════════════════════════════════════ */}
        <g>
          <rect x="1230" y="360" width="430" height="360" rx="10" fill="var(--on-grad)" opacity="0.14" />
          {/* papan nama */}
          <rect x="1230" y="360" width="430" height="62" rx="8" fill="var(--brand)" opacity="0.42" />
          <g transform="translate(1252 376)">
            <rect x="10" y="0" width="9" height="30" rx="3" fill="var(--surface)" />
            <rect x="0" y="10.5" width="29" height="9" rx="3" fill="var(--surface)" />
          </g>
          <text x="1296" y="402" fill="var(--surface)"
            style={{ font: '700 30px var(--font-sora), system-ui, sans-serif', letterSpacing: '0.02em' }}>
            PHARMACY
          </text>
          {/* etalase & rak obat */}
          <rect x="1254" y="444" width="390" height="256" rx="6" fill="var(--surface)" opacity="0.55" />
          <g fill="var(--on-grad)" opacity="0.16">
            {[470, 512, 554, 596].map((y) => <rect key={`r${y}`} x="1270" y={y} width="360" height="6" rx="3" />)}
          </g>
          <g fill="var(--brand)" opacity="0.2">
            {[470, 512, 554].map((y) =>
              [1280, 1316, 1352, 1388, 1424, 1460, 1496, 1532, 1568].map((x) => (
                <rect key={`b${x}-${y}`} x={x} y={y - 22} width="22" height="22" rx="3" />
              )),
            )}
          </g>
        </g>

        {/* ══ MEJA RESEPSIONIS KLINIK (tengah-kanan bawah) ═════════ */}
        <g transform="translate(1080 640)">
          <rect x="0" y="0" width="250" height="76" rx="10" fill="var(--surface)" opacity="0.9" />
          <rect x="0" y="0" width="250" height="16" rx="8" fill="var(--on-grad)" opacity="0.14" />
          <g transform="translate(24 30)">
            <rect x="8" y="0" width="8" height="26" rx="2.5" fill="var(--brand)" opacity="0.85" />
            <rect x="0" y="9" width="24" height="8" rx="2.5" fill="var(--brand)" opacity="0.85" />
          </g>
          <text x="60" y="52" fill="var(--brand)" opacity="0.85"
            style={{ font: '600 20px var(--font-sora), system-ui, sans-serif', letterSpacing: '0.04em' }}>
            CLINIC
          </text>
        </g>

        {/* ══ LATAR DEPAN: tanaman & tanah ═════════════════════════ */}
        <g fill="var(--on-grad)" opacity="0.24">
          <rect x="0" y="720" width="1600" height="180" />
        </g>
        <g fill="var(--on-grad)" opacity="0.36">
          <Plant x={40} y={900} s={1.25} />
          <Plant x={210} y={900} s={0.9} />
          <Plant x={1330} y={900} s={1.15} />
          <Plant x={1500} y={900} s={0.95} />
          <Plant x={880} y={900} s={0.75} />
        </g>
        </g>
      </svg>
    </div>
  )
}

/* ── Heksagon berisi ikon, seperti kisi ikon pada rujukan ── */
function HexIcon({ cx, cy, r, children }: { cx: number; cy: number; r: number; children: React.ReactNode }) {
  const titik = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={titik} fill="var(--surface)" opacity="0.55" />
      <polygon points={titik} fill="none" stroke="var(--on-grad)" strokeWidth="1.6" opacity="0.5" />
      <g transform={`translate(${cx - r * 0.42} ${cy - r * 0.42}) scale(${(r * 0.84) / 24})`}>{children}</g>
    </g>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'var(--brand)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const Heart = () => <path d="M12 20.5 4.2 12.9a5 5 0 1 1 7.8-6.2 5 5 0 1 1 7.8 6.2Z" {...stroke} />
const Shield = () => (
  <>
    <path d="M12 2.5 20 5.6V12c0 4.6-3.4 8.6-8 9.7-4.6-1.1-8-5.1-8-9.7V5.6Z" {...stroke} />
    <path d="M8.6 12l2.4 2.4 4.4-4.6" {...stroke} />
  </>
)
const Pill = () => (
  <>
    <rect x="2.4" y="8.4" width="19" height="7.4" rx="3.7" transform="rotate(-38 12 12)" {...stroke} />
    <path d="M8.6 15.6 15.6 8.6" {...stroke} />
  </>
)
const Dna = () => (
  <>
    <path d="M6 2c0 5.5 12 4.5 12 10S6 16.5 6 22" {...stroke} />
    <path d="M18 2c0 5.5-12 4.5-12 10s12 4.5 12 10" {...stroke} />
  </>
)

/** Tanaman hias latar depan: daun melengkung dari satu titik. */
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0c-4-40 8-72 26-92-4 34-12 62-26 92Z" />
      <path d="M0 0c-26-28-32-62-28-90 18 22 30 54 28 90Z" />
      <path d="M0 0c22-30 52-44 78-44-20 22-48 40-78 44Z" />
      <path d="M0 0c-24-24-56-32-80-28 22 18 52 30 80 28Z" />
      <path d="M0 0c10-34 34-56 58-64-14 28-34 50-58 64Z" />
    </g>
  )
}
