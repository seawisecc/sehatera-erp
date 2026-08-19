'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Plus, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { useUmpan } from '@/components/Umpan'
import { rupiah, tanggal, tanggalLokal, awalBulanIni } from '@/lib/format'

/**
 * Daftar outlet, penambahan, dan rekap lintas outlet.
 *
 * **Outlet baru mewarisi paket dan masa aktif outlet asalnya**, tidak membuat
 * langganan kedua. Kalau tiap outlet berlangganan sendiri, pemilik jaringan
 * membayar berkali-kali untuk satu paket yang tertulis "3 cabang", dan itu
 * kebalikan dari yang dijanjikan halaman harga.
 *
 * **Tiap outlet tetap berdiri sendiri**: stok, pasien, pengguna, dan laporan
 * wajibnya terpisah. Itu bukan batasan teknis melainkan bentuk yang benar:
 * tiap cabang apotek punya SIA dan apoteker penanggung jawabnya sendiri, dan
 * SIPNAP-nya dilaporkan per outlet.
 *
 * Rekapnya cuma untuk PEMILIK. Kasir di cabang A tidak punya urusan dengan
 * omzet cabang B, dan menampilkannya berarti membocorkan angka yang tidak
 * pernah diminta siapa pun.
 */

type Outlet = { id: string; nama: string; kota: string | null; sektor: string; kelompok: string | null; pemilik: boolean; aktif: boolean }
type Rekap = { id: string; nama: string; kota: string | null; jumlah_transaksi: number; total: number; diterima_tunai: number; ditagihkan_penjamin: number }

export default function OutletCabang() {
  const { t } = useLang()
  const { kabar } = useUmpan()

  const [daftar, setDaftar] = useState<Outlet[]>([])
  const [rekap, setRekap] = useState<Rekap[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [buka, setBuka] = useState(false)
  const [form, setForm] = useState({ nama: '', kota: '', sektor: '' })

  const kini = new Date()
  const [dari, setDari] = useState(awalBulanIni(kini))
  const [sampai, setSampai] = useState(tanggalLokal(kini))

  const muat = useCallback(async () => {
    setMemuat(true)
    const [o, r] = await Promise.all([
      supabase.rpc('outlet_saya'),
      supabase.rpc('rekap_outlet', { p_dari: dari, p_sampai: sampai }),
    ])
    setDaftar(((o.data as Outlet[]) || []))
    setRekap(((r.data as Rekap[]) || []))
    setMemuat(false)
  }, [dari, sampai])

  useEffect(() => { muat() }, [muat])

  const tambah = async () => {
    if (!form.nama.trim()) return
    setSibuk(true)
    const { error } = await supabase.rpc('tambah_outlet', {
      p_nama: form.nama.trim(),
      p_kota: form.kota.trim() || null,
      p_sektor: form.sektor || null,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setBuka(false)
    setForm({ nama: '', kota: '', sektor: '' })
    kabar(t('Outlet baru dibuat. Pindah ke sana lewat pemilih outlet di kanan atas.',
            'New outlet created. Switch to it with the outlet picker at the top right.'), 'ok')
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'

  const total = rekap.reduce((a, b) => ({
    trx: a.trx + Number(b.jumlah_transaksi || 0),
    total: a.total + Number(b.total || 0),
    tunai: a.tunai + Number(b.diterima_tunai || 0),
  }), { trx: 0, total: 0, tunai: 0 })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2">
            <Building2 size={18} /> {t('Outlet & Cabang', 'Outlets & Branches')}
          </h3>
          <p className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed max-w-xl">
            {t('Tiap outlet berdiri sendiri: stok, pasien, pengguna, dan laporan wajibnya terpisah, karena tiap cabang memang punya izin dan penanggung jawabnya sendiri. Yang dipakai bersama cuma paket langganannya.',
               'Each outlet stands alone: stock, patients, users, and statutory reports are separate, because each branch has its own licence and person in charge. Only the subscription plan is shared.')}
          </p>
        </div>
        <button onClick={() => setBuka(true)}
          className="shrink-0 inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          <Plus size={15} /> {t('Tambah Outlet', 'Add Outlet')}
        </button>
      </div>

      {memuat ? (
        <p className="text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
      ) : (
        <div className="space-y-1.5">
          {daftar.map(o => (
            <div key={o.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-xl border ${
              o.aktif ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)]'
            }`}>
              <span className="text-sm font-medium text-[var(--ink)] flex-1 truncate">{o.nama}</span>
              <span className="text-[11px] text-[var(--ink-faint)]">{o.kota || '-'}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-soft)]">
                {o.sektor}
              </span>
              {o.aktif && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  {t('SEDANG DIBUKA', 'CURRENT')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--line-soft)] pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">{t('Rekap lintas outlet', 'Cross-outlet summary')}</h4>
            <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">
              {t('Hanya terlihat oleh pemilik. Tanpa ini, tiga outlet berarti tiga layar yang dijumlahkan tangan.',
                 'Owner only. Without it, three outlets means three screens added up by hand.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dari} onChange={e => setDari(e.target.value)} className={I + ' w-auto'} />
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)} className={I + ' w-auto'} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)]/60">
              <tr className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
                <th className="text-left font-medium px-3 py-2">Outlet</th>
                <th className="text-center font-medium px-3 py-2">{t('Transaksi', 'Sales')}</th>
                <th className="text-right font-medium px-3 py-2">{t('Nilai', 'Value')}</th>
                <th className="text-right font-medium px-3 py-2">{t('Diterima tunai', 'Cash received')}</th>
              </tr>
            </thead>
            <tbody>
              {rekap.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-[var(--ink-faint)] text-sm">
                  {t('Belum ada transaksi pada rentang ini.', 'No transactions in this range.')}
                </td></tr>
              ) : rekap.map(r => (
                <tr key={r.id} className="border-t border-[var(--line-soft)]">
                  <td className="px-3 py-2 text-[var(--ink)]">
                    {r.nama}
                    {r.kota && <span className="text-[11px] text-[var(--ink-faint)]"> · {r.kota}</span>}
                  </td>
                  <td className="px-3 py-2 text-center num text-[var(--ink-soft)]">{r.jumlah_transaksi}</td>
                  <td className="px-3 py-2 text-right num text-[var(--ink-soft)]">{rupiah(r.total)}</td>
                  <td className="px-3 py-2 text-right num font-medium text-[var(--ink)]">{rupiah(r.diterima_tunai)}</td>
                </tr>
              ))}
              {rekap.length > 1 && (
                <tr className="border-t-2 border-[var(--line)] bg-[var(--surface-2)]/40">
                  <td className="px-3 py-2 font-semibold text-[var(--ink)]">{t('Seluruh outlet', 'All outlets')}</td>
                  <td className="px-3 py-2 text-center num font-semibold">{total.trx}</td>
                  <td className="px-3 py-2 text-right num font-semibold">{rupiah(total.total)}</td>
                  <td className="px-3 py-2 text-right num font-bold text-[var(--brand)]">{rupiah(total.tunai)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--ink-faint)] mt-2">
          {tanggal(dari)} - {tanggal(sampai)}
        </p>
      </div>

      {buka && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-lg font-bold text-[var(--brand)]">{t('Tambah Outlet', 'Add Outlet')}</h3>
                <button onClick={() => setBuka(false)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
                {t('Outlet baru memakai paket dan masa aktif yang sama, tidak membuat langganan kedua. Isinya mulai kosong: katalog, stok, dan penggunanya diisi sendiri di outlet itu.',
                   'The new outlet uses the same plan and validity, not a second subscription. It starts empty: its catalogue, stock, and users are set up inside that outlet.')}
              </p>

              <div className="space-y-3">
                <div>
                  <label className={L}>{t('Nama outlet', 'Outlet name')} <span className="text-red-500">*</span></label>
                  <input autoFocus value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder={t('mis. Apotek Sehat Cabang Renon', 'e.g. Sehat Pharmacy, Renon branch')} className={I} />
                </div>
                <div>
                  <label className={L}>{t('Kota/Kabupaten', 'City')}</label>
                  <input value={form.kota} onChange={e => setForm({ ...form, kota: e.target.value })} className={I} />
                </div>
                <div>
                  <label className={L}>{t('Jenis fasilitas', 'Facility type')}</label>
                  <select value={form.sektor} onChange={e => setForm({ ...form, sektor: e.target.value })} className={I}>
                    <option value="">{t('Sama dengan outlet ini', 'Same as this outlet')}</option>
                    <option value="apotek">{t('Apotek', 'Pharmacy')}</option>
                    <option value="klinik">{t('Klinik', 'Clinic')}</option>
                    <option value="rumah_sakit">{t('Rumah Sakit', 'Hospital')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setBuka(false)}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                  {t('Batal', 'Cancel')}
                </button>
                <button onClick={tambah} disabled={sibuk || !form.nama.trim()}
                  className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  {sibuk ? t('Membuat…', 'Creating…') : t('Buat outlet', 'Create outlet')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
