'use client'

import { useEffect, useState } from 'react'
import { Pencil, Power, PowerOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import TombolIkon from '@/components/TombolIkon'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TR } from '@/lib/ui'

/**
 * Supplier: daftar PBF dan distributor apotek.
 *
 * Dua kesalahan ikut diperbaiki saat modul ini dipindah:
 *
 * 1. Penambahan supplier tidak pernah menyertakan company_id. Untuk pemilik
 *    apotek itu tidak terasa karena trigger database mengisinya dari sesi, tapi
 *    super admin tidak terikat apotek mana pun: supplier yang ia tambahkan
 *    sambil "melihat sebagai" satu apotek mendarat tanpa pemilik, lalu tidak
 *    terlihat oleh siapa pun.
 * 2. Kegagalan simpan tidak pernah diberitahukan. Kodenya `if (!error) { … }`
 *    tanpa cabang lain, jadi saat gagal formulirnya hanya diam terbuka dan
 *    orang menekan Simpan berulang kali.
 */
type Supplier = {
  id: string
  kode: string | null
  nama_supplier: string
  jenis: string
  telepon: string | null
  email: string | null
  alamat: string | null
  status: string
}

const FORM_KOSONG = { nama_supplier: '', jenis: 'PBF', alamat: '', telepon: '', email: '' }

export default function HalamanSupplier() {
  const { t } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const app = useApp()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [memuat, setMemuat] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [ubahId, setUbahId] = useState<string | null>(null)
  const [simpanan, setSimpanan] = useState(false)

  const muat = async () => {
    setMemuat(true)
    const { data } = await app.scope(supabase.from('suppliers').select('*').order('kode'))
    setSuppliers((data as Supplier[]) || [])
    setMemuat(false)
  }

  useEffect(() => { muat() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  const simpan = async () => {
    if (!form.nama_supplier.trim()) {
      kabar(t('Nama supplier wajib diisi', 'Supplier name is required'))
      return
    }
    setSimpanan(true)
    // Menyunting, bukan cuma menambah. Sampai sekarang halaman ini hanya bisa
    // INSERT, jadi satu digit telepon yang salah ketik tidak pernah bisa
    // dibetulkan, dan supplier yang berhenti berdagang tetap muncul di daftar
    // pemesanan selamanya.
    const { error } = ubahId
      ? await supabase.from('suppliers').update(form).eq('id', ubahId)
      : await supabase.from('suppliers').insert([{ ...form, ...app.cid() }])
    setSimpanan(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setShowForm(false)
    setUbahId(null)
    setForm(FORM_KOSONG)
    kabar(ubahId ? t('Supplier diperbarui.', 'Supplier updated.') : t('Supplier ditambahkan.', 'Supplier added.'), 'ok')
    muat()
  }

  const geserStatus = async (s: Supplier) => {
    const jadi = s.status === 'aktif' ? 'nonaktif' : 'aktif'
    if (jadi === 'nonaktif' && !await konfirmasi({
      judul: t(`Nonaktifkan ${s.nama_supplier}?`, `Deactivate ${s.nama_supplier}?`),
      pesan: t('Ia tidak akan muncul lagi saat membuat pesanan. Riwayat pembelian yang sudah ada tidak berubah.',
               'It will no longer appear when creating orders. Existing purchase history is unchanged.'),
      tombol: t('Nonaktifkan', 'Deactivate'),
    })) return
    const { error } = await supabase.from('suppliers').update({ status: jadi }).eq('id', s.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Supplier', 'Suppliers')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">{t('Daftar PBF dan distributor apotek.', 'Pharmaceutical distributors and suppliers.')}</p>
        </div>
        <button
          onClick={() => { setForm(FORM_KOSONG); setUbahId(null); setShowForm(true) }}
          className="shrink-0 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition"
        >
          + {t('Tambah Supplier', 'Add Supplier')}
        </button>
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Kode', 'Code')}</th>
              <th className={TH_L}>{t('Nama Supplier', 'Supplier Name')}</th>
              <th className={TH_L}>{t('Jenis', 'Type')}</th>
              <th className={TH_L}>{t('Telepon', 'Phone')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-faint)]">
                {t('Belum ada supplier. Tambahkan yang pertama lewat tombol di atas.', 'No suppliers yet. Add the first one with the button above.')}
              </td></tr>
            ) : suppliers.map(s => (
              <tr key={s.id} className={TR}>
                <td className="px-4 py-3 num text-xs text-[var(--ink-soft)]">{s.kode || '-'}</td>
                <td className="px-4 py-3 font-medium text-[var(--ink)]">{s.nama_supplier}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{s.jenis}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)] num">{s.telepon || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <TombolIkon label={t('Ubah data supplier', 'Edit supplier')}
                      onClick={() => {
                        setUbahId(s.id)
                        setForm({
                          nama_supplier: s.nama_supplier || '', jenis: s.jenis || 'PBF',
                          telepon: s.telepon || '', email: (s as any).email || '',
                          alamat: (s as any).alamat || '', status: s.status || 'aktif',
                        } as any)
                        setShowForm(true)
                      }}>
                      <Pencil size={14} />
                    </TombolIkon>
                    <TombolIkon
                      label={s.status === 'aktif' ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan kembali', 'Reactivate')}
                      warna={s.status === 'aktif' ? 'bahaya' : 'netral'}
                      onClick={() => geserStatus(s)}>
                      {s.status === 'aktif' ? <PowerOff size={14} /> : <Power size={14} />}
                    </TombolIkon>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">
              {ubahId ? t('Ubah Supplier', 'Edit Supplier') : t('Tambah Supplier', 'Add Supplier')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Supplier *', 'Supplier Name *')}</label>
                <input autoFocus value={form.nama_supplier} onChange={e => setForm({ ...form, nama_supplier: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') simpan() }} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Jenis', 'Type')}</label>
                <select value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} className={inputCls}>
                  <option value="PBF">PBF</option>
                  <option value="Subdistributor">Subdistributor</option>
                  <option value="Lainnya">{t('Lainnya', 'Other')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Telepon', 'Phone')}</label>
                <input value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') simpan() }} inputMode="tel" className={inputCls + ' num'} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') simpan() }} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Alamat', 'Address')}</label>
                <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setUbahId(null) }} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpan} disabled={simpanan}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {simpanan ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
