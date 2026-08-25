'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useLang } from '@/lib/i18n'

/**
 * Mencarikan kode KFA untuk satu obat, lalu membiarkan ORANG yang memilih.
 *
 * **Sengaja tidak memilih sendiri, walau bisa.** Mencari "paracetamol 500 mg
 * tablet" di kamus nasional mengembalikan obat kombinasi lebih dulu, karena
 * peringkatnya longgar. Kode KFA yang salah berarti melaporkan pasien menerima
 * obat yang tidak pernah ia terima, dan itu tidak muncul sebagai galat di mana
 * pun: payload-nya sah, kirimannya diterima, dan yang salah cuma isinya.
 * Alasan yang sama dengan kenapa kode SNOMED dan ICD tidak pernah ditebak di
 * project ini.
 *
 * Dua daftar, dan bedanya menentukan apa yang dilaporkan:
 *
 * - **Varian (93)** merek tertentu dari pabrik tertentu. Dipakai kalau yang
 *   diserahkan memang Panadol, bukan parasetamol mana saja.
 * - **Template (92)** zat aktif, kekuatan, dan bentuk sediaan tanpa merek.
 *   Dipakai kalau resepnya generik dan mereknya menyesuaikan stok.
 */
export default function PilihKfa({ namaObat, onPilih }: {
  namaObat: string
  onPilih: (kode: string) => void
}) {
  const { t } = useLang()
  const [buka, setBuka] = useState(false)
  const [jenis, setJenis] = useState<'varian' | 'template'>('template')
  const [cari, setCari] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [hasil, setHasil] = useState<any[]>([])
  const [pesan, setPesan] = useState('')

  const jalan = async (kata: string) => {
    setSibuk(true); setPesan('')
    try {
      const r = await fetch('/api/kfa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cari: kata, jenis }),
      })
      const j = await r.json()
      if (!j.ok) { setPesan(j.pesan || t('Pencarian gagal.', 'Search failed.')); setHasil([]); return }
      setHasil(j.hasil || [])
      if (!j.hasil?.length) setPesan(t('Tidak ada yang cocok. Coba kata yang lebih pendek.', 'No match. Try a shorter term.'))
    } catch (e) {
      setPesan((e as Error).message)
    } finally { setSibuk(false) }
  }

  if (!buka) {
    return (
      <button type="button"
        onClick={() => { setBuka(true); setCari(namaObat); if (namaObat.trim().length >= 3) jalan(namaObat) }}
        className="text-xs font-semibold text-[var(--brand)] hover:underline underline-offset-4">
        {t('Cari di kamus KFA', 'Search the KFA dictionary')}
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/50 p-3">
      <div className="flex gap-2 mb-2">
        {(['template', 'varian'] as const).map(j => (
          <button key={j} type="button" onClick={() => setJenis(j)}
            className={`px-2 py-1 rounded text-[11px] font-semibold ${
              jenis === j ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--surface)] text-[var(--ink-soft)]'}`}>
            {j === 'template' ? t('Template (92)', 'Template (92)') : t('Varian bermerek (93)', 'Branded variant (93)')}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={cari} onChange={e => setCari(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); jalan(cari) } }}
          placeholder={t('mis. paracetamol 500 mg tablet', 'e.g. paracetamol 500 mg tablet')}
          className="flex-1 border border-[var(--line)] rounded-lg px-3 py-2 text-xs bg-[var(--surface)]" />
        <button type="button" onClick={() => jalan(cari)} disabled={sibuk}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--brand)] text-[var(--on-brand)] disabled:opacity-50">
          <Search size={13} />
        </button>
      </div>

      {sibuk && <p className="text-[11px] text-[var(--ink-faint)] mt-2">{t('Mencari…', 'Searching…')}</p>}
      {pesan && <p className="text-[11px] text-amber-700 mt-2">{pesan}</p>}

      {hasil.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-56 overflow-y-auto">
          {hasil.map(h => (
            <li key={h.kode}>
              <button type="button" onClick={() => { onPilih(h.kode); setBuka(false) }}
                className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-[var(--surface)] transition">
                <span className="num text-[11px] font-semibold text-[var(--brand)]">{h.kode}</span>
                <span className="text-[11px] text-[var(--ink)] ml-2">{h.nama}</span>
                {(h.sediaan || h.merek) && (
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {[h.merek, h.sediaan, h.satuan].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-[var(--ink-faint)] mt-2 leading-relaxed">
        {t('Hasilnya usulan, bukan jawaban. Peringkat kamus longgar, jadi obat kombinasi sering muncul lebih dulu. Cocokkan sendiri sebelum memilih.',
           'These are suggestions, not answers. The dictionary ranks loosely, so combination drugs often appear first. Check before picking.')}
      </p>
    </div>
  )
}
