'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { rupiah } from '@/lib/format'

/**
 * Tarif dan tindakan satu kunjungan.
 *
 * Dua baris pertama biasanya sudah terisi sendiri: biaya administrasi masuk
 * saat pasien didaftarkan, tarif konsultasi masuk saat pemeriksaan dimulai.
 * Keduanya adalah biaya yang paling sering lupa ditagih, dan kehilangan yang
 * tidak disadari tidak akan pernah dilaporkan sebagai keluhan.
 *
 * Yang ditambahkan tangan di sini hanya tindakan. Daftarnya diambil dari
 * Layanan yang sudah ada, jadi harga tidak diketik ulang tiap kali dan tidak
 * berbeda-beda antar petugas untuk tindakan yang sama.
 */

type Biaya = {
  jenis: string
  service_id: string | null
  nama: string
  jumlah: string
  harga: string
  kode_icd9: string
  catatan: string
}

type Layanan = { id: string; nama: string; harga: number }

const NAMA_JENIS: Record<string, [string, string]> = {
  administrasi: ['Administrasi', 'Administration'],
  konsultasi:   ['Konsultasi', 'Consultation'],
  tindakan:     ['Tindakan', 'Procedure'],
  lainnya:      ['Lainnya', 'Other'],
}

export default function TarifKunjungan({
  visitId, nama, tertutup, onTutup, onSimpan,
}: {
  visitId: string
  nama: string
  tertutup: boolean
  onTutup: () => void
  onSimpan: () => void
}) {
  const { t, lang } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()
  const en = lang === 'en'

  const [items, setItems] = useState<Biaya[]>([])
  const [layanan, setLayanan] = useState<Layanan[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [cari, setCari] = useState('')

  useEffect(() => {
    let batal = false
    ;(async () => {
      const [tag, lay] = await Promise.all([
        supabase.rpc('tagihan_kunjungan', { p_visit: visitId }),
        app.scope(supabase.from('services').select('id,nama,harga').eq('status', 'aktif').order('nama')),
      ])
      if (batal) return
      if (tag.error) { kabar(pesanError(tag.error), 'galat'); onTutup(); return }
      setItems((((tag.data as any)?.biaya || []) as any[]).map(x => ({
        jenis: x.jenis, service_id: x.service_id, nama: x.nama,
        jumlah: String(Number(x.jumlah)), harga: String(Number(x.harga)),
        kode_icd9: x.kode_icd9 || '', catatan: x.catatan || '',
      })))
      setLayanan((lay.data as Layanan[]) || [])
      setMemuat(false)
    })()
    return () => { batal = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId])

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return []
    return layanan.filter(l => l.nama.toLowerCase().includes(q)).slice(0, 8)
  }, [cari, layanan])

  const total = items.reduce((n, i) => n + (Number(i.jumlah) || 0) * (Number(i.harga) || 0), 0)

  const tambah = (l: Layanan) => {
    setItems([...items, {
      jenis: 'tindakan', service_id: l.id, nama: l.nama,
      jumlah: '1', harga: String(l.harga || 0), kode_icd9: '', catatan: '',
    }])
    setCari('')
  }

  const tambahBebas = () => {
    const n = cari.trim()
    if (!n) return
    setItems([...items, { jenis: 'lainnya', service_id: null, nama: n, jumlah: '1', harga: '0', kode_icd9: '', catatan: '' }])
    setCari('')
  }

  const ubah = (idx: number, k: keyof Biaya, v: string) =>
    setItems(items.map((x, n) => n === idx ? { ...x, [k]: v } : x))

  const simpan = async () => {
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_biaya_kunjungan', {
      p_visit: visitId,
      p_items: items.map(i => ({
        jenis: i.jenis, service_id: i.service_id, nama: i.nama,
        jumlah: i.jumlah, harga: i.harga, kode_icd9: i.kode_icd9, catatan: i.catatan,
      })),
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    onSimpan()
    onTutup()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60'
  const L = 'block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-0.5'

  return (
    <div className="fixed inset-0 bg-black/45 flex items-start justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface-2)] rounded-2xl w-full max-w-2xl my-4 shadow-xl">

        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--surface)] rounded-t-2xl border-b border-[var(--line)]">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--ink)]">{t('Tarif & Tindakan', 'Charges & Procedures')}</h2>
            <p className="text-xs text-[var(--ink-soft)] truncate">{nama}</p>
          </div>
          <button onClick={onTutup} className="shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {memuat ? (
            <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
          ) : (
            <>
              {!tertutup && (
                <div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    <input autoFocus value={cari} onChange={e => setCari(e.target.value)}
                      placeholder={t('Cari tindakan di daftar Layanan…', 'Search the Services list…')}
                      className={`${I} pl-9 py-2.5`} />
                  </div>
                  {cari.trim() && (
                    <div className="mt-1 border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)]">
                      {hasil.map(l => (
                        <button key={l.id} onClick={() => tambah(l)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 border-b border-[var(--line-soft)] last:border-b-0">
                          <span className="text-[var(--ink)] truncate flex-1">{l.nama}</span>
                          <span className="num text-xs text-[var(--ink-faint)] shrink-0">{rupiah(l.harga)}</span>
                        </button>
                      ))}
                      <button onClick={tambahBebas}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] text-[var(--ink-soft)] flex items-center gap-2">
                        <Plus size={13} /> {t(`Tambah "${cari.trim()}" sebagai baris bebas`, `Add "${cari.trim()}" as a free line`)}
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--ink-faint)] mt-1.5 leading-relaxed">
                    {t('Administrasi dan konsultasi biasanya sudah masuk sendiri. Yang perlu ditambahkan di sini hanya tindakan.',
                       'Administration and consultation are usually added automatically. Only procedures need adding here.')}
                  </p>
                </div>
              )}

              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--ink-faint)]">
                  {t('Belum ada biaya pada kunjungan ini.', 'No charges on this visit yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--ink-soft)]">
                          {(NAMA_JENIS[it.jenis] || NAMA_JENIS.lainnya)[en ? 1 : 0]}
                        </span>
                        <input disabled={tertutup} value={it.nama} onChange={e => ubah(idx, 'nama', e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-[var(--ink)] focus:outline-none disabled:opacity-70" />
                        <span className="num text-sm font-semibold text-[var(--ink)] shrink-0">
                          {rupiah((Number(it.jumlah) || 0) * (Number(it.harga) || 0))}
                        </span>
                        {!tertutup && (
                          <button onClick={() => setItems(items.filter((_, n) => n !== idx))}
                            className="shrink-0 text-[var(--ink-faint)] hover:text-red-600" aria-label={t('Hapus', 'Remove')}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={L}>{t('Jumlah', 'Qty')}</label>
                          <input inputMode="decimal" disabled={tertutup} value={it.jumlah}
                            onChange={e => ubah(idx, 'jumlah', e.target.value.replace(/[^0-9.]/g, ''))}
                            className={`${I} num`} />
                        </div>
                        <div>
                          <label className={L}>{t('Harga satuan', 'Unit price')}</label>
                          <input inputMode="numeric" disabled={tertutup} value={it.harga}
                            onChange={e => ubah(idx, 'harga', e.target.value.replace(/[^0-9]/g, ''))}
                            className={`${I} num`} />
                        </div>
                        <div>
                          <label className={L} title="ICD-9-CM">{t('Kode tindakan', 'Procedure code')}</label>
                          <input disabled={tertutup || it.jenis !== 'tindakan'} value={it.kode_icd9}
                            placeholder="86.59"
                            onChange={e => ubah(idx, 'kode_icd9', e.target.value)}
                            className={`${I} num`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-[var(--line-soft)]">
                <span className="text-sm font-semibold text-[var(--ink)]">{t('Total tarif & tindakan', 'Charges subtotal')}</span>
                <span className="num text-xl font-bold text-[var(--brand)]">{rupiah(total)}</span>
              </div>
              <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed">
                {t('Obat belum termasuk di sini. Ia menyusul dari resep, dan keduanya bertemu jadi satu tagihan di kasir.',
                   'Drugs are not included here. They come from the prescription, and both meet as one bill at the counter.')}
              </p>
            </>
          )}
        </div>

        {!memuat && (
          <div className="sticky bottom-0 flex gap-3 px-6 py-4 bg-[var(--surface)] rounded-b-2xl border-t border-[var(--line)]">
            <button onClick={onTutup}
              className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
              {tertutup ? t('Tutup', 'Close') : t('Batal', 'Cancel')}
            </button>
            {!tertutup && (
              <button onClick={simpan} disabled={sibuk}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                <Check size={16} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Tarif', 'Save Charges')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
