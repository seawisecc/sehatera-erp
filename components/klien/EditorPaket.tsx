'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { rupiah } from '@/lib/format'

/**
 * Editor paket langganan.
 *
 * Harga dan batas berubah tanpa deploy, dan halaman harga publik ikut berubah
 * karena membacanya dari tabel yang sama. Itu enak, dan justru karena itu
 * berbahaya: salah ketik di sini terlihat orang banyak dalam hitungan detik.
 * Karena itu tiap perubahan dicatat di jejak audit, dan kode paket sengaja
 * TIDAK bisa diubah, sebab ia dipakai sebagai pengenal di seed dan di riwayat
 * langganan.
 *
 * Penanda `Tampilkan di halaman harga` yang menahan paket Klinik: harganya
 * masih usulan dan belum diketok, jadi lebih baik tidak terlihat daripada
 * terlihat salah.
 */

const FITUR: { kunci: string; label: [string, string]; jenis: 'tier' | 'bool' | 'support' }[] = [
  { kunci: 'reports',      label: ['Laporan', 'Reports'],            jenis: 'tier' },
  { kunci: 'purchasing',   label: ['Pembelian', 'Purchasing'],       jenis: 'tier' },
  { kunci: 'crm',          label: ['Riwayat pasien', 'Patient CRM'], jenis: 'tier' },
  { kunci: 'multi_outlet', label: ['Multi cabang', 'Multi outlet'],  jenis: 'bool' },
  { kunci: 'api',          label: ['API', 'API'],                    jenis: 'bool' },
  { kunci: 'klinik',       label: ['Modul klinik', 'Clinic module'], jenis: 'bool' },
  { kunci: 'support',      label: ['Bantuan', 'Support'],            jenis: 'support' },
]

export default function EditorPaket() {
  const { t, lang } = useLang()
  const [paket, setPaket] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [sibuk, setSibuk] = useState(false)

  const muat = async () => {
    const { data } = await supabase.from('plans').select('*').order('sort_order')
    setPaket(data || [])
  }
  useEffect(() => { muat() }, [])

  const simpan = async () => {
    if (!edit) return
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_paket', {
      p_id: edit.id,
      p_name: edit.name,
      p_description: edit.description || '',
      p_price_monthly: Number(edit.price_monthly) || 0,
      p_price_yearly: edit.price_yearly === '' || edit.price_yearly === null ? null : Number(edit.price_yearly),
      p_max_outlets: edit.max_outlets === '' || edit.max_outlets === null ? null : Number(edit.max_outlets),
      p_max_users: edit.max_users === '' || edit.max_users === null ? null : Number(edit.max_users),
      p_max_products: edit.max_products === '' || edit.max_products === null ? null : Number(edit.max_products),
      p_is_public: !!edit.is_public,
      p_features: edit.features || {},
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setEdit(null)
    muat()
  }

  const ubahFitur = (kunci: string, nilai: unknown) =>
    setEdit({ ...edit, features: { ...(edit.features || {}), [kunci]: nilai } })

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const batasan = (n: number | null) => n === null ? t('tanpa batas', 'unlimited') : n.toLocaleString('id-ID')

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {paket.map(p => (
          <div key={p.id} className="border border-[var(--line)] rounded-2xl p-5 bg-[var(--surface)]">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-bold text-[var(--ink)]">{p.name}</p>
                <p className="text-xs text-[var(--ink-faint)] num">{p.code}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                p.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_public ? t('Terlihat publik', 'Public') : t('Tersembunyi', 'Hidden')}
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--brand)] num">
              {rupiah(p.price_monthly)}<span className="text-sm font-medium text-[var(--ink-soft)]">{t('/bln', '/mo')}</span>
            </p>
            <p className="text-xs text-[var(--ink-soft)] num mt-0.5">
              {p.price_yearly ? `${rupiah(p.price_yearly)}${t('/thn', '/yr')}` : t('tanpa harga tahunan', 'no yearly price')}
            </p>
            <p className="text-xs text-[var(--ink-soft)] mt-2 leading-relaxed">{p.description || '-'}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
              <span>{t('Item', 'Items')}: <span className="num">{batasan(p.max_products)}</span></span>
              <span>{t('Pengguna', 'Users')}: <span className="num">{batasan(p.max_users)}</span></span>
              <span>{t('Cabang', 'Outlets')}: <span className="num">{batasan(p.max_outlets)}</span></span>
            </div>
            <button onClick={() => setEdit({ ...p })}
              className="mt-4 w-full border border-[var(--line)] text-[var(--brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition">
              {t('Ubah', 'Edit')}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-faint)] mt-4 leading-relaxed">
        {t('Halaman harga publik membaca tabel ini langsung, jadi perubahan di sini terlihat tanpa deploy. Kode paket tidak bisa diubah: ia dipakai sebagai pengenal di riwayat langganan.',
           'The public pricing page reads this table directly, so changes here show without a deploy. The plan code cannot be changed: it is the identifier used across subscription history.')}
      </p>

      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-1">{t('Ubah Paket', 'Edit Plan')}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4 num">{edit.code}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama', 'Name')}</label>
                <input value={edit.name || ''} onChange={e => setEdit({ ...edit, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Keterangan', 'Description')}</label>
                <input value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga / bulan', 'Price / month')}</label>
                  <input type="number" min={0} value={edit.price_monthly ?? 0}
                    onChange={e => setEdit({ ...edit, price_monthly: e.target.value })} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga / tahun', 'Price / year')}</label>
                  <input type="number" min={0} value={edit.price_yearly ?? ''}
                    onChange={e => setEdit({ ...edit, price_yearly: e.target.value })} className={inputCls + ' num'} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([['max_products', t('Item obat', 'Drug items')], ['max_users', t('Pengguna', 'Users')], ['max_outlets', t('Cabang', 'Outlets')]] as const).map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{l}</label>
                    <input type="number" min={0} value={edit[k] ?? ''} placeholder={t('kosong = tanpa batas', 'empty = unlimited')}
                      onChange={e => setEdit({ ...edit, [k]: e.target.value })} className={inputCls + ' num'} />
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--line-soft)] pt-3">
                <p className="text-xs font-medium text-[var(--ink-soft)] mb-2">{t('Kemampuan', 'Capabilities')}</p>
                <div className="space-y-2">
                  {FITUR.map(f => {
                    const nilai = (edit.features || {})[f.kunci]
                    return (
                      <div key={f.kunci} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[var(--ink)]">{lang === 'en' ? f.label[1] : f.label[0]}</span>
                        {f.jenis === 'bool' ? (
                          <button onClick={() => ubahFitur(f.kunci, nilai !== true)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                              nilai === true ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]'
                                             : 'border-[var(--line)] text-[var(--ink-soft)]'}`}>
                            {nilai === true ? t('Terbuka', 'On') : t('Tertutup', 'Off')}
                          </button>
                        ) : f.jenis === 'support' ? (
                          <select value={nilai || 'email'} onChange={e => ubahFitur(f.kunci, e.target.value)}
                            className="border border-[var(--line)] rounded-lg px-2 py-1 text-xs">
                            <option value="email">Email</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="dedicated">{t('Pendampingan', 'Dedicated')}</option>
                          </select>
                        ) : (
                          <select value={nilai || 'full'} onChange={e => ubahFitur(f.kunci, e.target.value)}
                            className="border border-[var(--line)] rounded-lg px-2 py-1 text-xs">
                            <option value="basic">{t('Dasar', 'Basic')}</option>
                            <option value="full">{t('Lengkap', 'Full')}</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--surface-2)] transition">
                <input type="checkbox" checked={!!edit.is_public}
                  onChange={e => setEdit({ ...edit, is_public: e.target.checked })}
                  className="w-4 h-4 mt-0.5 accent-[var(--brand)]" />
                <span>
                  <span className="text-sm font-medium text-[var(--ink)]">{t('Tampilkan di halaman harga', 'Show on the pricing page')}</span>
                  <span className="block text-xs text-[var(--ink-faint)] leading-relaxed">
                    {t('Matikan untuk paket yang harganya belum diketok. Lebih baik tidak terlihat daripada terlihat salah.',
                       'Turn this off for plans whose price is not settled. Better invisible than visibly wrong.')}
                  </span>
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEdit(null)} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpan} disabled={sibuk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Paket', 'Save Plan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
