/**
 * Kelas tampilan yang dipakai berulang.
 *
 * Semuanya melewati token tema di `app/globals.css` — jangan menulis hex di
 * sini. Warna yang ditanam langsung adalah alasan "ganti tema" dulu praktis
 * tidak bisa dilakukan.
 */

// ── Tabel seragam ──
export const TBL_WRAP = 'bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--line)] rounded-2xl shadow-sm overflow-x-auto'
export const TBL      = 'w-full text-sm border-collapse'
export const THEAD    = 'bg-[var(--surface-2)] border-b border-[var(--line)]'
export const TH       = 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] whitespace-nowrap'
export const TH_L     = TH + ' text-left'
export const TH_R     = TH + ' text-right'
export const TH_C     = TH + ' text-center'
export const TR       = 'border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)] transition-colors'
export const TD       = 'px-4 py-2.5 align-middle'

/**
 * Warna lencana golongan obat.
 *
 * Sengaja memakai palet tetap Tailwind, bukan token tema: golongan obat adalah
 * penanda REGULASI, bukan selera. Merah untuk narkotika harus tetap merah di
 * tema mana pun — apoteker mengenalinya dari warna sebelum sempat membaca
 * tulisannya, dan itu justru yang diandalkan saat sedang buru-buru.
 */
export const KATEGORI_BADGE: Record<string, string> = {
  bebas:           'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  bebas_terbatas:  'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  keras:           'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  psikotropika:    'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  narkotika:       'bg-rose-100 text-rose-800 ring-1 ring-rose-700/20',
  prekursor:       'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  suplemen:        'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  alkes:           'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20',
  lainnya:         'bg-gray-100 text-gray-600 ring-1 ring-gray-400/20',
}

/** Golongan yang wajib mencatat pasien & nomor resep, dan wajib masuk SIPNAP. */
export const GOLONGAN_DIAWASI = ['narkotika', 'psikotropika', 'prekursor'] as const
