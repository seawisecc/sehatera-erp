'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronRight, HandCoins, HandHelping, Package, Pill, RefreshCw, Search, StickyNote } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { jam } from '@/lib/format'

/**
 * Antrean penyiapan resep.
 *
 * Layar ini menutup dua lubang sekaligus, dan keduanya ada sejak modul resep
 * dibuat di migrasi 0023.
 *
 * Pertama, farmasi tidak punya tempat melihat resep masuk sama sekali. View
 * `v_resep_menunggu` sudah dibuat untuk ini lalu tidak pernah dibaca siapa
 * pun, jadi satu-satunya cara tahu ada resep baru adalah ikut menonton layar
 * Kunjungan milik orang lain.
 *
 * Kedua, dan ini yang lebih serius: sampai migrasi 0035, yang menyatakan obat
 * sudah diserahkan adalah KASIR, di detik pembayaran diterima. Sekarang
 * penyerahan ditulis oleh yang benar-benar menyerahkan, dan hanya sesudah
 * pembayaran tercatat.
 *
 * Penyegarannya berkala, bukan langganan realtime. Alasannya sederhana:
 * antrean farmasi satu klinik itu belasan baris sehari, dan sambungan
 * realtime yang putus diam-diam jauh lebih buruk daripada jeda sepuluh detik
 * yang bisa dilihat orang di pojok layar.
 */

type Resep = {
  id: string
  nomor: string | null
  status: string
  visit_id: string
  nomor_antre: string | null
  poli: string | null
  penjamin: string | null
  pasien_nama: string
  nomor_rm: string | null
  alergi: string | null
  jumlah_item: number
  jumlah_belum_diisi: number
  catatan: string | null
  sudah_bayar: boolean
  dokter_email: string | null
  difinalkan_pada: string | null
  disiapkan_pada: string | null
  disiapkan_oleh: string | null
  siap_pada: string | null
}

const JEDA_SEGAR = 10_000

export default function HalamanFarmasi() {
  const { t } = useLang()
  const app = useApp()

  const [daftar, setDaftar] = useState<Resep[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState<string | null>(null)
  const [buka, setBuka] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, any[]>>({})
  const [segarPada, setSegarPada] = useState<Date | null>(null)
  const [isiUntuk, setIsiUntuk] = useState<string | null>(null)
  const [cari, setCari] = useState('')
  const [hasil, setHasil] = useState<any[]>([])

  const muat = useCallback(async () => {
    const { data, error } = await app.scope(
      supabase.from('v_resep_menunggu').select('*').order('difinalkan_pada'),
    )
    if (!error) {
      setDaftar((data as Resep[]) || [])
      setSegarPada(new Date())
    }
    setMemuat(false)
  }, [app])

  useEffect(() => {
    muat()
    const jam = setInterval(muat, JEDA_SEGAR)
    return () => clearInterval(jam)
  }, [muat])

  const muatIsi = async (resepId: string) => {
    const { data, error } = await supabase.rpc('isi_resep', { p_resep: resepId })
    if (error) { alert(pesanError(error)); return }
    setItems(x => ({ ...x, [resepId]: (data as any)?.items ?? [] }))
  }

  const lihatIsi = async (r: Resep) => {
    if (buka === r.id) { setBuka(null); return }
    setBuka(r.id)
    if (items[r.id]) return
    muatIsi(r.id)
  }

  /** Cari obat di katalog untuk mengisi permintaan terbuka. */
  useEffect(() => {
    const q = cari.trim()
    if (!isiUntuk || q.length < 2) { setHasil([]); return }
    let hidup = true
    const jam = setTimeout(async () => {
      const { data } = await app.scope(
        supabase.from('products')
          .select('id,nama_obat,satuan,stok_total,kategori')
          .ilike('nama_obat', `%${q}%`).limit(8),
      )
      if (hidup) setHasil((data as any[]) || [])
    }, 250)
    return () => { hidup = false; clearTimeout(jam) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, isiUntuk])

  const isiPermintaan = async (resepId: string, itemId: string, p: any) => {
    setSibuk(resepId)
    const { error } = await supabase.rpc('isi_permintaan_farmasi', {
      p_item: itemId, p_product: p.id, p_nama: p.nama_obat,
      p_jumlah: null, p_satuan: p.satuan,
    })
    setSibuk(null)
    if (error) { alert(pesanError(error)); return }
    setIsiUntuk(null); setCari(''); setHasil([])
    await muatIsi(resepId)
    muat()
  }

  const pindah = async (r: Resep, status: string) => {
    setSibuk(r.id)
    const { error } = await supabase.rpc('ubah_status_resep', { p_resep: r.id, p_status: status })
    setSibuk(null)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const serahkan = async (r: Resep) => {
    let alasan: string | null = null
    if (!r.sudah_bayar) {
      // Jalannya ada, tapi harus disengaja dan harus ditulis alasannya.
      // Palang yang tidak bisa dilewati akan diakali dengan cara yang tidak
      // meninggalkan jejak sama sekali: menekan tombol bayar padahal belum.
      alasan = window.prompt(t(
        'Pembayaran resep ini belum tercatat. Kalau obatnya tetap diserahkan sekarang, tulis alasannya. Alasan ini masuk ke jejak audit.',
        'Payment for this prescription is not recorded. If you hand it over anyway, state why. This reason goes into the audit trail.'))
      if (alasan === null) return
      if (!alasan.trim()) {
        alert(t('Alasannya wajib diisi.', 'A reason is required.'))
        return
      }
    } else if (!window.confirm(t(
        `Serahkan obat ${r.pasien_nama} sekarang?`,
        `Hand over the medicine for ${r.pasien_nama} now?`))) {
      return
    }

    setSibuk(r.id)
    const { error } = await supabase.rpc('serahkan_resep', {
      p_resep: r.id,
      p_tanpa_bayar: !r.sudah_bayar,
      p_alasan: alasan,
    })
    setSibuk(null)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const kelompok = [
    { id: 'final',     judul: t('Resep baru', 'New'),              ket: t('Belum disentuh', 'Not started yet') },
    { id: 'disiapkan', judul: t('Sedang disiapkan', 'Preparing'),  ket: t('Kasir sudah boleh menagih', 'The cashier may bill now') },
    { id: 'siap',      judul: t('Siap diserahkan', 'Ready'),       ket: t('Menunggu pembayaran', 'Waiting for payment') },
  ]

  const K = 'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Farmasi', 'Pharmacy')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">
            {t('Resep yang sudah difinalkan dokter hari ini. Obat baru boleh diserahkan setelah pembayaran tercatat.',
               'Prescriptions finalised by doctors today. Medicine may only be handed over once payment is recorded.')}
          </p>
        </div>
        <button onClick={muat}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--ink-soft)] hover:bg-[var(--surface-2)] transition">
          <RefreshCw size={14} /> {t('Segarkan', 'Refresh')}
          {segarPada && <span className="num text-[11px] text-[var(--ink-faint)]">{jam(segarPada)}</span>}
        </button>
      </div>

      {memuat ? (
        <p className="py-16 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
      ) : daftar.length === 0 ? (
        <div className={`${K} py-16 text-center`}>
          <Pill size={28} className="mx-auto text-[var(--ink-faint)] mb-3" />
          <p className="text-sm text-[var(--ink-soft)]">
            {t('Belum ada resep menunggu hari ini.', 'No prescriptions waiting today.')}
          </p>
          <p className="text-xs text-[var(--ink-faint)] mt-1">
            {t('Layar ini menyegarkan sendiri tiap sepuluh detik.', 'This screen refreshes itself every ten seconds.')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {kelompok.map(g => {
            const isi = daftar.filter(r => r.status === g.id)
            if (isi.length === 0) return null
            return (
              <section key={g.id}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-sm font-bold text-[var(--ink)]">{g.judul}</h2>
                  <span className="num text-xs text-[var(--ink-faint)]">{isi.length}</span>
                  <span className="text-xs text-[var(--ink-faint)]">· {g.ket}</span>
                </div>

                <div className="space-y-2">
                  {isi.map(r => (
                    <div key={r.id}
                      /* Tepi merah HANYA pada yang sudah siap tapi belum
                         dibayar. Di kelompok "Resep baru" hampir semua baris
                         belum dibayar dan itu wajar, jadi mewarnainya merah
                         cuma membuat merah berhenti berarti apa-apa. Yang
                         genting adalah obat yang sudah di tangan farmasi dan
                         tinggal diserahkan. */
                      className={`${K} ${r.status === 'siap' && !r.sudah_bayar
                        ? 'border-red-300 bg-red-50/40' : ''}`}>
                      <div className="flex items-start gap-3 flex-wrap">
                        <span className="num text-sm font-bold text-[var(--brand)] shrink-0">
                          {r.nomor_antre || '-'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--ink)] truncate">
                            {r.pasien_nama}
                            {r.nomor_rm && <span className="num font-normal text-[var(--ink-faint)]"> · {r.nomor_rm}</span>}
                          </p>
                          <p className="text-xs text-[var(--ink-soft)]">
                            {r.poli || t('Tanpa poli', 'No unit')}
                            {' · '}{r.jumlah_item} {t('obat', 'items')}
                            {r.penjamin && ` · ${r.penjamin.toUpperCase()}`}
                          </p>
                        </div>

                        {r.jumlah_belum_diisi > 0 && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent-bg)] text-[var(--accent)]">
                            <HandHelping size={11} /> {r.jumlah_belum_diisi} {t('MENUNGGU DIPILIH', 'TO CHOOSE')}
                          </span>
                        )}
                        {r.sudah_bayar ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                            <HandCoins size={11} /> {t('SUDAH BAYAR', 'PAID')}
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle size={11} /> {t('BELUM BAYAR', 'UNPAID')}
                          </span>
                        )}
                      </div>

                      {r.alergi && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                          <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">
                            <span className="font-semibold">{t('Alergi', 'Allergy')}:</span> {r.alergi}
                          </p>
                        </div>
                      )}

                      {/* Catatan dokter. Kolomnya sudah ada sejak migrasi 0023
                          dan tidak pernah ditampilkan ke orang yang dituju. */}
                      {r.catatan && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[var(--accent-bg)] border border-[var(--line)] px-3 py-2">
                          <StickyNote size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
                          <p className="text-sm text-[var(--ink)]">
                            <span className="font-semibold">{t('Catatan dokter', 'Doctor note')}:</span> {r.catatan}
                          </p>
                        </div>
                      )}

                      <button onClick={() => lihatIsi(r)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] hover:text-[var(--brand)]">
                        {buka === r.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        {t('Lihat obatnya', 'Show items')}
                      </button>

                      {buka === r.id && (
                        <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 space-y-2">
                          {(items[r.id] ?? []).length === 0 ? (
                            <p className="text-xs text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
                          ) : items[r.id].map((it: any) => (
                            <div key={it.id} className="text-sm">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-medium text-[var(--ink)]">{it.nama_obat}</span>
                                {it.permintaan_terbuka && !it.diisi_pada && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent-bg)] text-[var(--accent)]">
                                    {t('DOKTER MINTA KAMU PILIH', 'CHOOSE THIS ONE')}
                                  </span>
                                )}
                                <span className="num text-xs text-[var(--ink-soft)]">
                                  {it.jumlah} {it.satuan || it.satuan_produk || ''}
                                </span>
                                {/* Stok dijawab di sini karena itu pertanyaan
                                    pertama farmasi saat membuka resep. */}
                                {it.product_id == null ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    {t('DI LUAR KATALOG', 'NOT IN CATALOGUE')}
                                  </span>
                                ) : Number(it.stok) < Number(it.jumlah) && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                    {t('STOK KURANG', 'LOW STOCK')} ({it.stok})
                                  </span>
                                )}
                              </div>
                              {(it.dosis || it.frekuensi || it.rute || it.aturan_pakai) && (
                                <p className="text-xs text-[var(--ink-faint)]">
                                  {[it.dosis, it.frekuensi, it.rute, it.aturan_pakai].filter(Boolean).join(' · ')}
                                </p>
                              )}

                              {/* Permintaan asli dokter tidak pernah hilang dari
                                  layar, supaya selalu terbaca siapa meminta apa. */}
                              {it.permintaan_asli && (
                                <p className="text-xs text-[var(--ink-faint)]">
                                  {t('diminta', 'requested')}: {it.permintaan_asli}
                                  {it.diisi_oleh && ` · ${t('diisi', 'filled by')} ${it.diisi_oleh}`}
                                </p>
                              )}

                              {it.permintaan_terbuka && r.status !== 'final' && (
                                <div className="mt-1.5">
                                  {isiUntuk === it.id ? (
                                    <div className="relative">
                                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                                      <input autoFocus value={cari} onChange={e => setCari(e.target.value)}
                                        placeholder={t('Cari obat di katalog…', 'Search the catalogue…')}
                                        className="w-full border border-[var(--line)] rounded-lg pl-8 pr-3 py-1.5 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                                      {hasil.length > 0 && (
                                        <div className="mt-1 border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)]">
                                          {hasil.map((p: any) => (
                                            <button key={p.id} onClick={() => isiPermintaan(r.id, it.id, p)}
                                              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] flex items-center gap-2">
                                              <span className="truncate flex-1">{p.nama_obat}</span>
                                              <span className={`num text-xs shrink-0 ${Number(p.stok_total) <= 0 ? 'text-red-600' : 'text-[var(--ink-faint)]'}`}>
                                                {Number(p.stok_total) <= 0 ? t('habis', 'out') : `${p.stok_total} ${p.satuan || ''}`}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      <button onClick={() => { setIsiUntuk(null); setCari(''); setHasil([]) }}
                                        className="mt-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] underline underline-offset-2">
                                        {t('batal', 'cancel')}
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setIsiUntuk(it.id); setCari('') }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] text-xs font-medium text-[var(--accent)] hover:bg-[var(--surface)]">
                                      <HandHelping size={12} />
                                      {it.diisi_pada ? t('Ganti pilihan', 'Change choice') : t('Pilih obatnya', 'Choose the drug')}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {r.status === 'final' && (
                          <button onClick={() => pindah(r, 'disiapkan')} disabled={sibuk === r.id}
                            className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                            <Package size={14} /> {t('Mulai siapkan', 'Start preparing')}
                          </button>
                        )}
                        {r.status === 'disiapkan' && (
                          <>
                            <button onClick={() => pindah(r, 'siap')} disabled={sibuk === r.id}
                              className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                              <Check size={14} /> {t('Tandai siap', 'Mark ready')}
                            </button>
                            <button onClick={() => pindah(r, 'final')} disabled={sibuk === r.id}
                              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] underline underline-offset-2">
                              {t('batal siapkan', 'undo')}
                            </button>
                          </>
                        )}
                        {r.status === 'siap' && (
                          <>
                            <button onClick={() => serahkan(r)} disabled={sibuk === r.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                                r.sudah_bayar
                                  ? 'bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]'
                                  : 'border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'}`}>
                              <Check size={14} /> {t('Serahkan obat', 'Hand over')}
                            </button>
                            {!r.sudah_bayar && (
                              <span className="text-xs font-medium text-red-700">
                                {t('Belum dibayar. Bisa diserahkan lebih dulu, tapi alasannya dicatat.',
                                   'Not paid yet. It can be handed over first, but the reason is recorded.')}
                              </span>
                            )}
                            <button onClick={() => pindah(r, 'disiapkan')} disabled={sibuk === r.id}
                              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] underline underline-offset-2">
                              {t('belum siap', 'not ready')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
