/**
 * Logo Sehatera: "Perisai Nadi".
 *
 * Tiga hal yang harus dibawa satu tanda:
 *   perisai : perlindungan. Aplikasi ini memegang rekam obat golongan dan,
 *              nanti, rekam medis. Kepercayaan itu yang dijual, bukan fiturnya.
 *   palang  : kesehatan. Satu-satunya lambang yang dikenali semua orang di
 *              Indonesia tanpa perlu dijelaskan, dari apotek sampai rumah sakit.
 *   nadi    : kehidupan, dan sistem yang mengawasinya.
 *
 * Nadinya DIPAHAT dari palang, bukan ditempel di atasnya. Tanda yang menumpuk
 * tiga lambang jadi ramai dan hancur di ukuran kecil; dengan dipahat, pada 16px
 * garisnya melebur jadi palang biasa dan tandanya tetap terbaca: pada ukuran
 * besar barulah nadinya terlihat.
 *
 * Warna ikut token tema. Diganti tema, logonya ikut: tidak ada berkas PNG yang
 * harus disediakan empat kali.
 */
export function Mark({
  size = 32,
  className = '',
  /** Pakai `mono` di atas permukaan berwarna (sidebar, tombol): satu warna saja. */
  variant = 'gradient',
  style,
}: {
  size?: number
  className?: string
  variant?: 'gradient' | 'mono'
  style?: React.CSSProperties
}) {
  // id unik supaya beberapa logo di satu halaman tidak saling merebut gradien
  const gid = `sehatera-grad-${variant}`

  // Gradiennya memakai --mark-*, BUKAN --grad-* yang mengisi bidang besar.
  // Gradien suasana boleh pastel; lambang sering tampil 16 sampai 30 piksel di
  // atas putih, dan pastel pada ukuran itu larut jadi noda pucat.

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`${variant === 'gradient' ? 'sw-mark ' : ''}${className}`}
      style={style}
      role="img"
      aria-label="Sehatera"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gid} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--mark-1)" />
            <stop offset="52%" stopColor="var(--mark-2)" />
            <stop offset="100%" stopColor="var(--mark-3)" />
          </linearGradient>
        </defs>
      )}

      {/* Perisai */}
      <path
        d="M16 2.2 27.2 6.4V16c0 6.5-4.7 12.1-11.2 13.8C9.5 28.1 4.8 22.5 4.8 16V6.4L16 2.2Z"
        fill={variant === 'gradient' ? `url(#${gid})` : 'currentColor'}
      />

      {/* Palang */}
      <g fill={variant === 'gradient' ? 'var(--surface)' : 'var(--brand)'}>
        <rect x="13.7" y="9.2" width="4.6" height="13.6" rx="1.9" />
        <rect x="9.2" y="13.7" width="13.6" height="4.6" rx="1.9" />
      </g>

      {/* Nadi: dipahat dari lengan mendatar palang, memakai warna perisainya
          sendiri sehingga terbaca sebagai celah, bukan garis tambahan. */}
      <path
        d="M9.2 16h2.6l1.5-3.4 2.4 6.8 1.4-3.4h3.7"
        stroke={variant === 'gradient' ? `url(#${gid})` : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

/** Logo lengkap: tanda + nama. */
export function Logo({
  size = 36,
  className = '',
  /** Baris kecil di bawah nama: nama faskes, atau "by Seawise Studio". */
  sub,
  /** Kelas tambahan untuk baris kecil itu. */
  subClass = '',
  /**
   * Latar tempat logo ini berdiri.
   *
   * `onBrand` untuk sidebar yang berwarna PEKAT, `onGrad` untuk bidang gradien
   * tema yang justru TERANG. Keduanya harus dibedakan: --on-brand adalah warna
   * terang untuk di atas yang gelap, dan memakainya di atas gradien pastel
   * membuat tulisannya lenyap. Ini kesalahan yang sudah pernah terjadi dua
   * kali di proyek ini.
   */
  tone = 'default',
}: {
  size?: number
  className?: string
  sub?: string
  subClass?: string
  tone?: 'default' | 'onBrand' | 'onGrad'
}) {
  const onBrand = tone === 'onBrand'
  const onGrad = tone === 'onGrad'
  const berlatar = onBrand || onGrad
  const warnaUtama = onBrand ? 'var(--on-brand)' : onGrad ? 'var(--on-grad)' : 'var(--ink)'
  const warnaSub = onBrand ? 'var(--on-brand-soft)' : onGrad ? 'var(--on-grad-soft)' : 'var(--ink-faint)'

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <span
        className="shrink-0 rounded-2xl flex items-center justify-center"
        style={
          berlatar
            ? {
                width: size, height: size,
                background: onBrand
                  ? 'color-mix(in oklab, var(--surface) 16%, transparent)'
                  : 'color-mix(in oklab, var(--on-grad) 10%, transparent)',
              }
            : { width: size, height: size }
        }
      >
        <Mark
          size={berlatar ? size * 0.72 : size}
          variant={berlatar ? 'mono' : 'gradient'}
          className={berlatar ? '' : undefined}
          style={berlatar ? { color: warnaUtama } : undefined}
        />
      </span>
      <span className="min-w-0">
        <span
          className="block font-semibold leading-tight truncate"
          style={{ fontFamily: 'var(--font-sora), system-ui, sans-serif', letterSpacing: '-0.02em', color: warnaUtama }}
        >
          Sehatera
        </span>
        {sub && (
          <span className={`block text-xs truncate ${subClass}`} style={{ color: warnaSub }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  )
}
