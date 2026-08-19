'use client'

import { useEffect, useState } from 'react'
import PilihICD9 from '@/components/klinik/PilihICD9'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR } from '@/lib/ui'

/**
 * Layanan Jasa: racikan resep, cek gula darah, tensi, dan sejenisnya.
 *
 * Modul pertama yang keluar dari monolit, dipilih karena paling sedikit
 * ketergantungannya: tiga state sendiri, empat penangan, satu modal, dan
 * satu-satunya hal yang dibagi dengan modul lain adalah tabel `services` yang
 * juga dibaca Kasir.
 *
 * Satu kebocoran ikut diperbaiki di sini. Di monolit, penambahan layanan
 * membaca `migrasiCompany`, yaitu apotek yang dipilih di layar Migrasi Data,
 * untuk menentukan company_id. Artinya seorang super admin yang membuka
 * Migrasi Data, memilih satu apotek, lalu berpindah ke Layanan Jasa akan
 * menyimpan layanan barunya ke apotek itu, bukan ke apotek yang sedang
 * ditampilkan di topbar. Sekarang keduanya memakai sumber yang sama, yaitu
 * pemilih apotek di topbar (`app.cid()`).
 */
type Layanan = {
  id: string
  nama: string
  harga: number | null
  deskripsi: string | null
  status: string
  kode_icd9: string | null
}

export default function HalamanLayanan() {
  const { t } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const app = useApp()

  const [services, setServices] = useState<Layanan[]>([])
  const [memuat, setMemuat] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama: '', harga: 0, deskripsi: '', kode_icd9: null as string | null })
  const [edit, setEdit] = useState<Layanan | null>(null)

  const muat = async () => {
    setMemuat(true)
    const { data } = await app.scope(supabase.from('services').select('*').order('nama'))
    setServices((data as Layanan[]) || [])
    setMemuat(false)
  }

  // Dimuat ulang saat super admin berganti apotek di topbar.
  useEffect(() => { muat() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  const simpanBaru = async () => {
    if (!form.nama.trim()) { kabar(t('Nama layanan wajib diisi', 'Service name is required')); return }
    const { error } = await supabase.from('services').insert([{
      nama: form.nama.trim(),
      harga: form.harga || 0,
      deskripsi: form.deskripsi || null,
      kode_icd9: form.kode_icd9,
      ...app.cid(),
    }])
    if (error) { kabar(pesanError(error), 'galat'); return }
    setShowForm(false)
    setForm({ nama: '', harga: 0, deskripsi: '', kode_icd9: null })
    muat()
  }

  const simpanUbah = async () => {
    if (!edit) return
    const { error } = await supabase.from('services').update({
      nama: edit.nama,
      harga: edit.harga || 0,
      deskripsi: edit.deskripsi,
      status: edit.status,
      kode_icd9: edit.kode_icd9,
    }).eq('id', edit.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setEdit(null)
    muat()
  }

  const hapus = async (s: Layanan) => {
    if (!await konfirmasi({ bahaya: true, tombol: t('Hapus', 'Delete'), judul: t(`Hapus layanan "${s.nama}"?`, `Delete service "${s.nama}"?`) })) return
    const { error } = await supabase.from('services').delete().eq('id', s.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Layanan Jasa', 'Services')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">
            {/* Apotek menjual jasa, klinik mengerjakan tindakan. Menyebutnya
                "jasa apotek" di klinik membuat halaman ini terbaca seperti
                milik produk lain. */}
            {app.sektor === 'apotek'
              ? t('Jasa apotek seperti racikan resep, cek gula darah, dan tensi. Semuanya bisa dijual di Kasir.',
                  'Pharmacy services such as compounding, blood-sugar checks, and blood pressure. All sellable at the register.')
              : t('Tindakan dan layanan berbayar seperti konsultasi, jahit luka, dan nebulisasi. Semuanya masuk ke tagihan kunjungan.',
                  'Billable procedures and services such as consultation, wound suturing, and nebulisation. All flow into the visit bill.')}
          </p>
        </div>
        <button
          onClick={() => { setForm({ nama: '', harga: 0, deskripsi: '', kode_icd9: null }); setShowForm(true) }}
          className="shrink-0 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition"
        >
          + {t('Tambah Layanan', 'Add Service')}
        </button>
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Nama Layanan', 'Service Name')}</th>
              <th className={TH_R}>{t('Tarif', 'Fee')}</th>
              <th className={TH_L}>{t('Deskripsi', 'Description')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--ink-faint)]">
                {t('Belum ada layanan. Tambahkan yang pertama lewat tombol di atas.', 'No services yet. Add the first one with the button above.')}
              </td></tr>
            ) : services.map(s => (
              <tr key={s.id} className={TR}>
                <td className="px-4 py-3 font-medium text-[var(--ink)]">
                  {s.nama}
                  {app.sektor !== 'apotek' && s.kode_icd9 && (
                    <span className="num ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-2)] text-[var(--ink-soft)]"
                      title={t('Kode tindakan ICD-9-CM', 'ICD-9-CM procedure code')}>
                      {s.kode_icd9}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[var(--ink)] num">Rp {(s.harga || 0).toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)] text-xs max-w-[280px] truncate">{s.deskripsi || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setEdit({ ...s })} title="Edit" className="p-1.5 rounded-lg text-[var(--brand)] hover:bg-[var(--surface-2)] transition"><Pencil size={14} /></button>
                    <button onClick={() => hapus(s)} title={t('Hapus', 'Delete')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showForm || edit) && (
        <FormLayanan
          pakaiICD9={app.sektor !== 'apotek'}
          nilai={edit ?? form}
          isEdit={!!edit}
          ubah={(patch) => edit ? setEdit({ ...edit, ...patch }) : setForm({ ...form, ...patch })}
          batal={() => { setShowForm(false); setEdit(null) }}
          simpan={edit ? simpanUbah : simpanBaru}
        />
      )}
    </div>
  )
}

function FormLayanan({
  nilai, isEdit, ubah, batal, simpan, pakaiICD9,
}: {
  nilai: any
  isEdit: boolean
  /** Apotek tidak menagihkan tindakan medis, jadi kolomnya tidak dimunculkan. */
  pakaiICD9: boolean
  ubah: (patch: any) => void
  batal: () => void
  simpan: () => void
}) {
  const { t } = useLang()
  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-[var(--brand)] mb-4">
          {isEdit ? t('Edit Layanan', 'Edit Service') : t('Tambah Layanan', 'Add Service')}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Layanan *', 'Service Name *')}</label>
            <input
              autoFocus
              value={nilai.nama}
              onChange={e => ubah({ nama: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') simpan() }}
              placeholder={t('mis. Racikan Resep, Cek Gula Darah', 'e.g. Compounding, Blood Sugar Check')}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tarif (Rp)', 'Fee (Rp)')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={nilai.harga ? nilai.harga.toLocaleString('id-ID') : ''}
              onChange={e => ubah({ harga: +e.target.value.replace(/\D/g, '') || 0 })}
              onKeyDown={e => { if (e.key === 'Enter') simpan() }}
              className={inputCls + ' num'}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Deskripsi', 'Description')}</label>
            <textarea value={nilai.deskripsi || ''} onChange={e => ubah({ deskripsi: e.target.value })} rows={2} className={inputCls} />
          </div>
          {pakaiICD9 && (
            <PilihICD9 nilai={nilai.kode_icd9 ?? null} ubah={kode => ubah({ kode_icd9: kode })} />
          )}
          {isEdit && (
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Status</label>
              <select value={nilai.status} onChange={e => ubah({ status: e.target.value })} className={inputCls}>
                <option value="aktif">{t('Aktif', 'Active')}</option>
                <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={batal} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
          <button onClick={simpan} className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">{t('Simpan', 'Save')}</button>
        </div>
      </div>
    </div>
  )
}
