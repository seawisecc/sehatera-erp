/**
 * Latar halaman masuk: siluet dunia kesehatan.
 *
 * Digambar sebagai SVG sebaris, bukan berkas gambar. Dua alasan:
 *
 * 1. Warnanya ikut tema. Siluetnya memakai `var(--on-grad)` — warna yang tiap
 *    tema tetapkan sendiri untuk "yang di atas gradien". Di tiga tema berwarna
 *    itu gelap, di Clean Slate yang gradiennya justru gelap ia terang, dan
 *    siluetnya membalik dengan sendirinya. Berkas PNG harus disediakan empat
 *    kali dan tetap salah begitu ada tema kelima.
 * 2. Tidak ada permintaan jaringan. Halaman masuk adalah layar pertama yang
 *    dilihat orang, sering di jaringan klinik yang lambat; latar yang belum
 *    terunduh membuat kartu kaca melayang di atas kekosongan.
 *
 * Isinya sengaja: rumah sakit bertanda palang dengan helipad, klinik kecil,
 * apotek, ambulans, dan pepohonan. Bukan satu gedung — yang ingin disampaikan
 * adalah bahwa aplikasi ini untuk seluruh lingkungan itu, bukan apotek saja.
 */
export function AuthBackdrop() {
  return (
    <div className="sw-scene" aria-hidden="true">
      {/* Cahaya lembut di langit, mengikuti gradien tema. */}
      <div className="sw-scene-sky" />

      <svg
        className="sw-scene-art"
        viewBox="0 0 1440 460"
        preserveAspectRatio="xMidYMax meet"
        role="presentation"
      >
        {/* ── Lapisan jauh: gedung samar di kejauhan ── */}
        <g fill="var(--on-grad)" opacity="0.14">
          <rect x="40" y="210" width="90" height="250" rx="4" />
          <rect x="150" y="250" width="70" height="210" rx="4" />
          <rect x="1180" y="230" width="86" height="230" rx="4" />
          <rect x="1290" y="265" width="110" height="195" rx="4" />
          <rect x="980" y="255" width="64" height="205" rx="4" />
        </g>

        {/* ── Lapisan tengah: rumah sakit, klinik, apotek ── */}
        <g fill="var(--on-grad)" opacity="0.3">
          {/* Rumah sakit — blok tinggi, palang besar, helipad di atap */}
          <rect x="560" y="120" width="230" height="340" rx="6" />
          <rect x="600" y="92" width="150" height="30" rx="4" />
          <circle cx="675" cy="107" r="11" fill="none" stroke="var(--on-grad)" strokeWidth="3" />
          <path d="M669 107h12M675 101v12" stroke="var(--on-grad)" strokeWidth="2.5" strokeLinecap="round" />
          {/* palang pada dinding */}
          <path d="M652 168h46v20h-46z" fill="var(--paper)" opacity="0.85" />
          <path d="M665 155h20v46h-20z" fill="var(--paper)" opacity="0.85" />
          {/* jendela */}
          <g fill="var(--paper)" opacity="0.35">
            {[230, 268, 306, 344, 382, 420].map((y) =>
              [580, 612, 644, 708, 740].map((x) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="20" height="24" rx="2" />
              )),
            )}
          </g>

          {/* Klinik — bangunan rendah beratap pelana */}
          <rect x="360" y="288" width="170" height="172" rx="5" />
          <path d="M348 288 445 232l97 56z" />
          <path d="M438 300h14v34h-14z" fill="var(--paper)" opacity="0.8" />
          <path d="M428 310h34v14h-34z" fill="var(--paper)" opacity="0.8" />
          <g fill="var(--paper)" opacity="0.3">
            <rect x="380" y="360" width="26" height="30" rx="2" />
            <rect x="418" y="360" width="26" height="30" rx="2" />
            <rect x="484" y="360" width="26" height="30" rx="2" />
          </g>

          {/* Apotek — bangunan sedang, kanopi bergaris */}
          <rect x="830" y="255" width="150" height="205" rx="5" />
          <path d="M820 300h170l-12 26H832z" opacity="0.75" />
          <path d="M898 275h14v30h-14z" fill="var(--paper)" opacity="0.8" />
          <path d="M890 284h30v13h-30z" fill="var(--paper)" opacity="0.8" />
          <g fill="var(--paper)" opacity="0.3">
            <rect x="852" y="360" width="30" height="36" rx="2" />
            <rect x="900" y="360" width="30" height="36" rx="2" />
            <rect x="948" y="360" width="20" height="36" rx="2" />
          </g>
        </g>

        {/* ── Lapisan depan: pohon, ambulans, pagar ── */}
        <g fill="var(--on-grad)" opacity="0.46">
          {/* pohon kiri */}
          <Tree x={232} />
          <Tree x={286} scale={0.8} />
          <Tree x={1074} scale={0.9} />
          <Tree x={1128} />

          {/* Ambulans */}
          <g transform="translate(150 384)">
            <rect x="0" y="0" width="118" height="46" rx="7" />
            <path d="M118 14h34l26 22v10h-60z" />
            <rect x="126" y="18" width="22" height="16" rx="3" fill="var(--paper)" opacity="0.55" />
            <path d="M40 12h12v26H40z" fill="var(--paper)" opacity="0.7" />
            <path d="M33 19h26v12H33z" fill="var(--paper)" opacity="0.7" />
            <circle cx="34" cy="50" r="12" />
            <circle cx="146" cy="50" r="12" />
            <circle cx="34" cy="50" r="5" fill="var(--paper)" opacity="0.5" />
            <circle cx="146" cy="50" r="5" fill="var(--paper)" opacity="0.5" />
          </g>

          {/* tanah */}
          <rect x="0" y="446" width="1440" height="14" />
        </g>
      </svg>
    </div>
  )
}

/** Pohon sederhana — batang lurus dan tiga lapis daun. */
function Tree({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 446) scale(${scale}) translate(0 -${140})`}>
      <rect x="14" y="104" width="9" height="40" rx="3" />
      <path d="M18.5 0 46 46H-9z" />
      <path d="M18.5 34 50 84H-13z" />
      <path d="M18.5 68 54 122H-17z" />
    </g>
  )
}
