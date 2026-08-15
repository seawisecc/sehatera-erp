'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Tema warna Sehatera.
 *
 * Nilai warnanya TIDAK ada di file ini — semuanya di `app/globals.css` sebagai
 * token CSS. Yang disimpan di sini hanya daftar tema yang boleh dipilih beserta
 * tiga warna contoh untuk kartu pratinjau di Pengaturan. Kalau nilai warnanya
 * ikut ditulis di sini, akan ada dua sumber kebenaran yang perlahan berbeda,
 * dan yang menang di layar selalu yang di CSS.
 */
export type ThemeId = 'sunrise-sorbet' | 'neon-pulse'

export const DEFAULT_THEME: ThemeId = 'sunrise-sorbet'

export const THEMES: {
  id: ThemeId
  label: string
  mode: 'terang' | 'gelap'
  /** Untuk siapa tema ini enak dipakai — bukan sekadar deskripsi warna. */
  hint: { id: string; en: string }
  swatch: [string, string, string]
}[] = [
  {
    id: 'sunrise-sorbet',
    label: 'Sunrise Sorbet',
    mode: 'terang',
    hint: {
      id: 'Lembut dan tenang, untuk layar yang dilihat sepanjang jam buka.',
      en: 'Soft and calm, for screens watched all through opening hours.',
    },
    swatch: ['#c6ffdd', '#fbd786', '#f7797d'],
  },
  {
    id: 'neon-pulse',
    label: 'Neon Pulse',
    mode: 'gelap',
    hint: {
      id: 'Pekat dan berkontras tinggi, untuk shift malam dan apotek 24 jam.',
      en: 'Deep and high contrast, for night shifts and 24-hour pharmacies.',
    },
    swatch: ['#8a2387', '#e94057', '#f27121'],
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
   * yang sama. Pilihan pribadi di perangkat ini tetap menang — orang yang sudah
   * memilih Neon Pulse untuk shift malamnya tidak boleh dikembalikan paksa
   * setiap kali ia menyegarkan halaman.
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
 * berganti begitu useEffect jalan — kedipan terang di layar yang justru dipilih
 * karena gelap, tiap kali halaman dibuka.
 */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');
document.documentElement.dataset.theme=(t==='neon-pulse'||t==='sunrise-sorbet')?t:'${DEFAULT_THEME}';}
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

/** Sakelar ringkas untuk topbar. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const next: ThemeId = theme === 'sunrise-sorbet' ? 'neon-pulse' : 'sunrise-sorbet'
  const nextLabel = THEMES.find((t) => t.id === next)!.label

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Ganti ke ${nextLabel}`}
      aria-label={`Ganti ke ${nextLabel}`}
      className={`inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:border-[var(--brand-soft)] ${className}`}
    >
      <span
        className="w-4 h-4 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${THEMES.find((t) => t.id === next)!.swatch.join(', ')})`,
        }}
      />
      <span className="text-xs font-medium text-[var(--ink-soft)]">{nextLabel}</span>
    </button>
  )
}
