'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jam } from '@/lib/format'

/**
 * Layar antrean ruang tunggu.
 *
 * Dibuka di televisi, menghadap orang banyak, seharian. Tiga hal berasal
 * langsung dari kalimat itu:
 *
 * 1. TANPA LOGIN. Ia masuk dengan token di alamatnya, dan token itu cuma bisa
 *    membaca nomor antrean hari ini. Kalau layarnya login sebagai petugas,
 *    siapa pun yang lewat tinggal menekan Beranda di televisi itu dan masuk ke
 *    rekam medis seluruh klinik.
 * 2. TIDAK PERNAH KOSONG. Kalau jaringan klinik putus, yang terakhir diketahui
 *    tetap terpampang beserta penanda kecil bahwa ia sudah basi. Layar kosong
 *    membuat orang mengira antreannya hilang, lalu mereka semua berdiri dan
 *    bertanya ke pendaftaran.
 * 3. SUARANYA DIBANGKITKAN PERAMBAN, bukan berkas rekaman. Nomor apa pun bisa
 *    diucapkan tanpa menyiapkan ratusan potongan audio, termasuk nomor poli
 *    yang belum ada saat ini ditulis.
 */

const JEDA = 5_000

type Baris = {
  nomor_antre: string | null
  status: string
  poli: string | null
  nama: string
  dipanggil_pada: string | null
  jumlah_panggil: number
}

function Layar() {
  const q = useSearchParams()
  const token = q.get('t') || ''

  const [faskes, setFaskes] = useState('')
  const [antrean, setAntrean] = useState<Baris[]>([])
  const [galat, setGalat] = useState<string | null>(null)
  const [segar, setSegar] = useState<Date | null>(null)
  const [basi, setBasi] = useState(false)

  // Nomor yang sudah diucapkan. Tanpa ini, tiap penyegaran akan mengulang
  // panggilan yang sama dan ruang tunggu jadi berisik terus-menerus.
  const sudahDiucap = useRef<Set<string>>(new Set())
  const pertama = useRef(true)

  const ucap = useCallback((b: Baris) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const nomor = (b.nomor_antre || '').split('').join(' ')  // "U 0 0 1", bukan "U1"
    const teks = `Nomor antrean ${nomor}, ${b.nama}${b.poli ? `, silakan ke ${b.poli}` : ''}`
    const u = new SpeechSynthesisUtterance(teks)
    u.lang = 'id-ID'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }, [])

  const muat = useCallback(async () => {
    if (!token) { setGalat('Alamat layar ini belum membawa token.'); return }
    const { data, error } = await supabase.rpc('layar_antrean', { p_token: token })
    if (error) {
      // Bukan mengosongkan layar: yang terakhir diketahui tetap dipampang.
      setBasi(true)
      if (!segar) setGalat(error.message || 'Tidak bisa membaca antrean.')
      return
    }
    const d = data as any
    setFaskes(d?.faskes || '')
    const isi: Baris[] = d?.antrean || []
    setAntrean(isi)
    setGalat(null); setBasi(false); setSegar(new Date())

    // Panggilan baru diucapkan. Muatan PERTAMA tidak diucapkan: kalau televisi
    // menyala jam sepuluh, ia tidak boleh membacakan seluruh pagi itu.
    const baru = isi.filter(b => b.dipanggil_pada
      && !sudahDiucap.current.has(`${b.nomor_antre}|${b.jumlah_panggil}`))
    baru.forEach(b => sudahDiucap.current.add(`${b.nomor_antre}|${b.jumlah_panggil}`))
    if (!pertama.current) baru.forEach(ucap)
    pertama.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ucap])

  useEffect(() => {
    muat()
    const t = setInterval(muat, JEDA)
    return () => clearInterval(t)
  }, [muat])

  const dipanggil = antrean.filter(b => b.dipanggil_pada)
  const kini = dipanggil[0] || null
  const berikut = antrean.filter(b => !b.dipanggil_pada).slice(0, 6)

  if (galat) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)] p-8">
        <p className="text-xl text-[var(--ink-soft)] text-center max-w-lg">{galat}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-6 lg:p-10 flex flex-col">
      <header className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--brand)]">{faskes || 'Antrean'}</h1>
        <div className="text-right">
          <p className="num text-2xl lg:text-3xl font-bold tabular-nums">{jam(segar || new Date())}</p>
          {basi && (
            <p className="text-xs text-amber-700 font-medium">
              Jaringan terputus, ini keadaan terakhir yang diketahui
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 flex-1">
        {/* Yang sedang dipanggil */}
        <section className="rounded-3xl bg-[var(--surface)] border border-[var(--line)] flex flex-col items-center justify-center p-8 text-center">
          {kini ? (
            <>
              <p className="text-lg lg:text-xl text-[var(--ink-soft)] mb-2">Nomor dipanggil</p>
              <p className="num font-extrabold tracking-tight text-[clamp(4rem,16vw,11rem)] leading-none text-[var(--brand)]">
                {kini.nomor_antre || '-'}
              </p>
              <p className="text-2xl lg:text-4xl font-semibold mt-4">{kini.nama}</p>
              {kini.poli && (
                <p className="text-xl lg:text-2xl text-[var(--ink-soft)] mt-1">{kini.poli}</p>
              )}
              {kini.jumlah_panggil > 1 && (
                <p className="mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
                  Panggilan ke-{kini.jumlah_panggil}
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl text-[var(--ink-faint)]">Belum ada nomor yang dipanggil</p>
          )}
        </section>

        {/* Menunggu */}
        <section className="rounded-3xl bg-[var(--surface)] border border-[var(--line)] p-6">
          <p className="text-lg font-semibold text-[var(--ink-soft)] mb-3">Menunggu</p>
          {berikut.length === 0 ? (
            <p className="text-[var(--ink-faint)]">Tidak ada yang menunggu.</p>
          ) : (
            <ul className="space-y-2">
              {berikut.map((b, i) => (
                <li key={`${b.nomor_antre}-${i}`}
                  className="flex items-baseline gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3">
                  <span className="num text-2xl font-bold text-[var(--brand)] shrink-0">{b.nomor_antre || '-'}</span>
                  <span className="min-w-0">
                    <span className="block text-lg truncate">{b.nama}</span>
                    {b.poli && <span className="block text-sm text-[var(--ink-faint)]">{b.poli}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default function HalamanLayarAntrean() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--paper)]" />}>
      <Layar />
    </Suspense>
  )
}
