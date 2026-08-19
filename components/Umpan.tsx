'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import Portal from '@/components/Portal'

/**
 * Kabar dan pertanyaan, tanpa kotak bawaan peramban.
 *
 * Sampai sekarang aplikasi ini memakai `alert`, `confirm`, dan `prompt` di 139
 * tempat. Empat hal salah dengan itu, dan yang terakhir yang paling mahal.
 *
 * 1. **Tampilannya milik sistem operasi, bukan milik aplikasi.** Kotak abu-abu
 *    bertuliskan "localhost:3001 says" di tengah layar adalah satu-satunya
 *    bagian yang membuat orang berhenti mengira ini perangkat lunak yang
 *    dibeli.
 * 2. **Ia MEMBEKUKAN seluruh peramban.** Kasir yang mendapat kotak galat tidak
 *    bisa menggulung struk di belakangnya untuk memeriksa apa yang salah.
 * 3. **Tidak bisa dwibahasa dengan rapi, tidak bisa membedakan galat dari
 *    kabar baik**, dan tombolnya selalu "OK" walau yang akan terjadi adalah
 *    menghapus data.
 * 4. **Kabar yang lewat begitu saja hilang.** `alert` menuntut satu klik untuk
 *    setiap kejadian, jadi orang menekan OK tanpa membaca, lalu kejadian
 *    berikutnya yang penting ikut ditekan OK juga.
 *
 * Gantinya tiga hal:
 *
 * - `kabar()` untuk yang cukup dilihat sekilas. Menumpuk di pojok, hilang
 *   sendiri, dan yang berupa galat bertahan lebih lama karena memang perlu
 *   dibaca sampai habis.
 * - `konfirmasi()` untuk yang perlu dijawab ya/tidak, dengan tombol yang
 *   MENYEBUT tindakannya ("Hapus", "Batalkan kunjungan") dan berwarna merah
 *   kalau merusak. Tombol bertuliskan "OK" tidak pernah memberi tahu apa yang
 *   akan terjadi.
 * - `tanya()` untuk yang perlu satu baris jawaban, misalnya alasan pembatalan.
 *
 * Ketiganya mengembalikan Promise, jadi pemanggilnya berbentuk sama seperti
 * `confirm`/`prompt` yang digantikan: `if (!await konfirmasi(...)) return`.
 */

type Jenis = 'info' | 'ok' | 'galat'
type Pesan = { id: number; teks: string; jenis: Jenis }

type Konfirmasi = {
  judul: string
  pesan?: string
  tombol?: string
  batal?: string
  bahaya?: boolean
}

type Tanya = {
  judul: string
  pesan?: string
  label?: string
  nilai?: string
  wajib?: boolean
  tombol?: string
}

type Isi = {
  kabar: (teks: string, jenis?: Jenis) => void
  konfirmasi: (opsi: Konfirmasi) => Promise<boolean>
  tanya: (opsi: Tanya) => Promise<string | null>
}

const Ctx = createContext<Isi | null>(null)

export function useUmpan(): Isi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUmpan dipakai di luar UmpanProvider')
  return v
}

export function UmpanProvider({ children }: { children: React.ReactNode }) {
  const [pesan, setPesan] = useState<Pesan[]>([])
  const [konf, setKonf] = useState<(Konfirmasi & { jawab: (v: boolean) => void }) | null>(null)
  const [tny, setTny] = useState<(Tanya & { jawab: (v: string | null) => void }) | null>(null)
  const [isian, setIsian] = useState('')
  const urut = useRef(0)

  const kabar = useCallback((teks: string, jenis: Jenis = 'info') => {
    const id = ++urut.current
    setPesan(p => [...p, { id, teks, jenis }])
    // Galat bertahan lebih lama: ia memang perlu dibaca sampai habis, dan
    // kalimat penolakan di aplikasi ini panjang karena menyebutkan apa yang
    // harus dilakukan orangnya.
    const lama = jenis === 'galat' ? 9000 : 4000
    setTimeout(() => setPesan(p => p.filter(x => x.id !== id)), lama)
  }, [])

  const konfirmasi = useCallback((opsi: Konfirmasi) =>
    new Promise<boolean>(res => setKonf({ ...opsi, jawab: res })), [])

  const tanya = useCallback((opsi: Tanya) =>
    new Promise<string | null>(res => { setIsian(opsi.nilai || ''); setTny({ ...opsi, jawab: res }) }), [])

  // Escape membatalkan, Enter menjawab. Kotak bawaan peramban melakukan ini,
  // dan menghilangkannya diam-diam membuat orang merasa aplikasinya melambat.
  useEffect(() => {
    if (!konf && !tny) return
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (konf) { konf.jawab(false); setKonf(null) }
        if (tny) { tny.jawab(null); setTny(null) }
      }
      if (e.key === 'Enter' && konf) { konf.jawab(true); setKonf(null) }
    }
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [konf, tny])

  const IKON = { info: Info, ok: Check, galat: AlertTriangle }
  const WARNA: Record<Jenis, string> = {
    info:  'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]',
    ok:    'border-emerald-200 bg-emerald-50 text-emerald-900',
    galat: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <Ctx.Provider value={{ kabar, konfirmasi, tanya }}>
      {children}

      {/* Kabar menumpuk di pojok kanan bawah, bukan di tengah layar: yang
          sedang dikerjakan orang tetap terlihat di belakangnya. */}
      {pesan.length > 0 && (
        <Portal>
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none">
            {pesan.map(p => {
              const Ikon = IKON[p.jenis]
              return (
                <div key={p.id} role="status"
                  className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg text-sm leading-relaxed ${WARNA[p.jenis]}`}>
                  <Ikon size={16} className="shrink-0 mt-0.5" />
                  <span className="flex-1 whitespace-pre-line">{p.teks}</span>
                  <button onClick={() => setPesan(x => x.filter(y => y.id !== p.id))}
                    aria-label="Tutup" className="shrink-0 opacity-50 hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </Portal>
      )}

      {konf && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-[var(--ink)] leading-snug">{konf.judul}</h3>
              {konf.pesan && (
                <p className="text-sm text-[var(--ink-soft)] mt-2 leading-relaxed whitespace-pre-line">{konf.pesan}</p>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => { konf.jawab(false); setKonf(null) }}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm hover:bg-[var(--surface-2)] transition">
                  {konf.batal || 'Batal'}
                </button>
                <button autoFocus onClick={() => { konf.jawab(true); setKonf(null) }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    konf.bahaya
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]'
                  }`}>
                  {konf.tombol || 'Lanjutkan'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {tny && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4" role="dialog" aria-modal="true">
            <form
              onSubmit={e => {
                e.preventDefault()
                if (tny.wajib && !isian.trim()) return
                tny.jawab(isian)
                setTny(null)
              }}
              className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-bold text-[var(--ink)] leading-snug">{tny.judul}</h3>
              {tny.pesan && (
                <p className="text-sm text-[var(--ink-soft)] mt-2 leading-relaxed">{tny.pesan}</p>
              )}
              {tny.label && (
                <label className="text-[11px] font-medium text-[var(--ink-soft)] mt-4 mb-1 block uppercase tracking-wide">
                  {tny.label}{tny.wajib && <span className="text-red-500"> *</span>}
                </label>
              )}
              <input autoFocus value={isian} onChange={e => setIsian(e.target.value)}
                className="mt-1 w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => { tny.jawab(null); setTny(null) }}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm hover:bg-[var(--surface-2)] transition">
                  Batal
                </button>
                <button type="submit" disabled={!!tny.wajib && !isian.trim()}
                  className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  {tny.tombol || 'Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </Ctx.Provider>
  )
}
