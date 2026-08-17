'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Tema warna Sehatera.
 *
 * Nilai warnanya TIDAK ada di file ini: semuanya di `app/globals.css` sebagai
 * token CSS. Yang disimpan di sini hanya daftar tema yang boleh dipilih beserta
 * tiga warna contoh untuk kartu pratinjau di Pengaturan. Kalau nilai warnanya
 * ikut ditulis di sini, akan ada dua sumber kebenaran yang perlahan berbeda,
 * dan yang menang di layar selalu yang di CSS.
 */
export type ThemeId = 'vital-tide' | 'sunrise-sorbet' | 'lilac-dawn' | 'clean-slate'

export const DEFAULT_THEME: ThemeId = 'vital-tide'

/**
 * Empat tema, SEMUANYA terang.
 *
 * Tema gelap sengaja dibuang setelah dipakai sebentar: aplikasi ini dipakai di
 * ruangan terang, sering di samping dokumen kertas, dan layar gelap di antara
 * kertas putih memaksa mata menyesuaikan bolak-balik sepanjang hari. Yang
 * membedakan keempatnya sekarang bukan gelap-terang, tapi seberapa banyak
 * warna yang ikut bicara, dari Vital Tide yang tegas sampai Clean Slate yang
 * nyaris diam.
 */
export const THEMES: {
  id: ThemeId
  label: string
  mode: 'terang'
  /** Untuk siapa tema ini enak dipakai, bukan sekadar deskripsi warna. */
  hint: { id: string; en: string }
  swatch: [string, string, string]
}[] = [
  {
    id: 'vital-tide',
    label: 'Vital Tide',
    mode: 'terang',
    hint: {
      id: 'Biru ke hijau pastel: warna yang sudah lama dipakai dunia kesehatan.',
      en: 'Pastel blue into green: the colours healthcare has long used.',
    },
    swatch: ['#9fd8f7', '#8fe0d4', '#b6efc4'],
  },
  {
    id: 'sunrise-sorbet',
    label: 'Sunrise Sorbet',
    mode: 'terang',
    hint: {
      id: 'Hangat dan lembut, untuk layar yang dilihat sepanjang jam buka.',
      en: 'Warm and soft, for screens watched all through opening hours.',
    },
    swatch: ['#c6ffdd', '#fbd786', '#f7797d'],
  },
  {
    id: 'lilac-dawn',
    label: 'Lilac Dawn',
    mode: 'terang',
    hint: {
      id: 'Periwinkle, lilac, merah muda: urutan warna langit menjelang pagi.',
      en: 'Periwinkle, lilac, rose: the order the sky takes just before morning.',
    },
    swatch: ['#a8b8f2', '#d3a8f5', '#fbb8c4'],
  },
  {
    id: 'clean-slate',
    label: 'Clean Slate',
    mode: 'terang',
    hint: {
      id: 'Nyaris tanpa warna. Untuk layar yang dipakai di depan pasien.',
      en: 'Almost colourless. For screens used in front of patients.',
    },
    swatch: ['#475569', '#64748b', '#94a3b8'],
  },
]

const STORAGE_KEY = 'sw_theme'

export const isThemeId = (v: unknown): v is ThemeId =>
  THEMES.some((t) => t.id === v)

type Ctx = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  /** Tema bawaan apotek ini, dari kolom `companies.theme`. */
  applyCompanyTheme: (t: string | null | undefined) => void
}

const ThemeCtx = createContext<Ctx>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  applyCompanyTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME)

  // Nilai dari localStorage dibaca di skrip sebelum render (lihat
  // ThemeScript di app/layout.tsx) supaya halaman tidak berkedip; di sini
  // state React tinggal menyusul agar tombol pilihannya menunjuk yang benar.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (isThemeId(saved)) setThemeState(saved)
    } catch {}
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
  }

  /**
   * Dipakai sesudah sesi dibaca: semua kasir di satu apotek melihat tampilan
   * yang sama. Pilihan pribadi di perangkat ini tetap menang: orang yang sudah
   * memilih tema lain tidak boleh dikembalikan paksa setiap kali ia menyegarkan
   * halaman.
   */
  const applyCompanyTheme = (t: string | null | undefined) => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch {}
    if (isThemeId(t)) {
      setThemeState(t)
      document.documentElement.dataset.theme = t
    }
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, applyCompanyTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)

/**
 * Dijalankan sebelum React sempat merender.
 *
 * Tanpa ini, halaman selalu terlukis dengan tema bawaan lebih dulu lalu
 * berganti begitu useEffect jalan: kedipan warna tiap kali halaman dibuka.
 */
export function ThemeScript() {
  // Daftar tema dibangun dari THEMES, bukan ditulis ulang di dalam string.
  // Versi sebelumnya menanam dua id secara harfiah di sini, jadi menambah tema
  // ketiga akan membuat skrip ini menolaknya sebagai tidak dikenal dan
  // mengembalikan semua orang ke tema bawaan tiap kali halaman dibuka -
  // pilihan yang tersimpan rapi di localStorage, tapi tidak pernah dipakai.
  const daftar = JSON.stringify(THEMES.map((t) => t.id))
  const js = `(function(){try{var v=${daftar},t=localStorage.getItem('${STORAGE_KEY}');
document.documentElement.dataset.theme=v.indexOf(t)>=0?t:'${DEFAULT_THEME}';}
catch(e){document.documentElement.dataset.theme='${DEFAULT_THEME}';}})();`
  return <script dangerouslySetInnerHTML={{ __html: js }} />
}

/** Pemilih tema dengan pratinjau gradiennya. */
export function ThemePicker({
  lang = 'id',
  className = '',
}: {
  lang?: 'id' | 'en'
  className?: string
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {THEMES.map((t) => {
        const active = theme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            className={`text-left rounded-2xl border overflow-hidden transition ${
              active
                ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]'
                : 'border-[var(--line)] hover:border-[var(--brand-soft)]'
            }`}
          >
            <div
              className="h-16"
              style={{
                background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 48%, ${t.swatch[2]} 100%)`,
              }}
            />
            <div className="p-3 bg-[var(--surface)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--ink)]">{t.label}</span>
                {active && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)]">
                    {lang === 'en' ? 'in use' : 'dipakai'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed">
                {lang === 'en' ? t.hint.en : t.hint.id}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Sakelar ringkas untuk topbar: berputar melewati semua tema.
 *
 * Dulu ini menukar dua tema bolak-balik. Dengan empat tema, tukar-menukar tidak
 * lagi bisa menjangkau semuanya, jadi tombolnya memutar urutan dan labelnya
 * menyebut tema BERIKUTNYA: orang perlu tahu ke mana ia akan pergi sebelum
 * menekan, bukan sesudahnya.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const idx = THEMES.findIndex((t) => t.id === theme)
  const next = THEMES[(idx + 1) % THEMES.length]

  return (
    <button
      type="button"
      onClick={() => setTheme(next.id)}
      title={`Ganti ke ${next.label}`}
      aria-label={`Ganti ke ${next.label}`}
      className={`inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:border-[var(--brand-soft)] ${className}`}
    >
      <span
        className="w-4 h-4 rounded-full shrink-0"
        style={{ background: `linear-gradient(135deg, ${next.swatch.join(', ')})` }}
      />
      <span className="text-xs font-medium text-[var(--ink-soft)] whitespace-nowrap">{next.label}</span>
    </button>
  )
}
