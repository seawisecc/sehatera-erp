'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Pencil, Plus, Stethoscope, UserRound, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { rupiah } from '@/lib/format'

/**
 * Poli dan dokter yang bertugas di masing-masing.
 *
 * Kode poli bukan hiasan: ia jadi awalan nomor antrean, jadi tiap pintu punya
 * deretnya sendiri. Tanpa itu "A-014" dipanggil dan tiga orang berdiri, masing
 * masing dari ruang tunggu yang berbeda.
 *
 * Penugasan dokter dibuat boleh lebih dari satu poli per dokter, karena di
 * klinik kecil satu dokter umum sering merangkap KIA atau lansia. Memaksanya
 * satu poli berarti orang akan mengisi yang bukan sebenarnya, dan data yang
 * diisi asal lebih buruk daripada data yang kosong.
 */

type Poli = {
  id: string
  nama: string
  kode: string
  kode_bpjs: string | null
  tarif_konsultasi: number
  urutan: number
  aktif: boolean
}

type Anggota = { id: string; nama: string | null; email: string; role: string }

const KOSONG = { nama: '', kode: '', kode_bpjs: '', tarif_konsultasi: '' }

export default function PengaturanPoli() {
  const { t } = useLang()
  const app = useApp()

  const [poli, setPoli] = useState<Poli[]>([])
  const [dokter, setDokter] = useState<Anggota[]>([])
  const [tugas, setTugas] = useState<Record<string, string[]>>({})
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)

  const [form, setForm] = useState<typeof KOSONG | null>(null)
  const [ubahId, setUbahId] = useState<string | null>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const [u, a, d] = await Promise.all([
      app.scope(supabase.from('clinic_units').select('*').order('urutan').order('nama')),
      app.scope(supabase.from('app_users').select('id,nama,email,role').order('nama')),
      app.scope(supabase.from('unit_doctors').select('unit_id,email')),
    ])
    setPoli((u.data as Poli[]) || [])
    setDokter(((a.data as Anggota[]) || []).filter(x => x.role === 'dokter'))
    const peta: Record<string, string[]> = {}
    for (const r of (d.data as any[]) || []) {
      peta[r.unit_id] = [...(peta[r.unit_id] || []), (r.email || '').toLowerCase()]
    }
    setTugas(peta)
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const simpan = async () => {
    if (!form) return
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_poli', {
      p_id: ubahId,
      p_data: {
        nama: form.nama,
        kode: form.kode,
        kode_bpjs: form.kode_bpjs,
        tarif_konsultasi: form.tarif_konsultasi,
      },
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setForm(null); setUbahId(null)
    muat()
  }

  const setAktif = async (p: Poli, aktif: boolean) => {
    setSibuk(true)
    const { error } = await supabase.rpc('nonaktifkan_poli', { p_id: p.id, p_aktif: aktif })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const geserDokter = async (p: Poli, email: string) => {
    const kini = tugas[p.id] || []
    const baru = kini.includes(email) ? kini.filter(e => e !== email) : [...kini, email]
    setTugas({ ...tugas, [p.id]: baru })
    const { error } = await supabase.rpc('set_dokter_poli', { p_unit: p.id, p_emails: baru })
    if (error) { alert(pesanError(error)); muat() }
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'block text-xs font-medium text-[var(--ink-soft)] mb-1'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">{t('Poli & Dokter', 'Clinic Units & Doctors')}</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5 max-w-lg leading-relaxed">
            {t('Kode poli jadi awalan nomor antrean, jadi tiap poli punya deret sendiri: U-001 untuk Umum, G-001 untuk Gigi. Deret yang dipakai bersama membuat satu nomor dipanggil di beberapa ruang sekaligus.',
               'The unit code becomes the queue prefix, so each unit gets its own series: U-001 for General, D-001 for Dental. A shared series means one number gets called in several rooms at once.')}
          </p>
        </div>
        <button onClick={() => { setForm({ ...KOSONG }); setUbahId(null) }}
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          <Plus size={15} /> {t('Tambah Poli', 'Add Unit')}
        </button>
      </div>

      {memuat ? (
        <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
      ) : poli.length === 0 ? (
        <div className="py-12 text-center">
          <Stethoscope size={28} className="mx-auto text-[var(--ink-faint)] mb-3" />
          <p className="text-sm text-[var(--ink-soft)] max-w-sm mx-auto leading-relaxed">
            {t('Belum ada poli. Selama belum ada, pendaftaran tetap jalan dan nomor antreannya memakai deret tunggal A-001, jadi klinik satu ruang periksa tidak perlu mengisi apa pun di sini.',
               'No units yet. Until there is one, registration still works with a single A-001 series, so a one-room clinic does not need to fill anything in here.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {poli.map(p => (
            <div key={p.id}
              className={`rounded-xl border p-4 ${p.aktif ? 'border-[var(--line)] bg-[var(--surface)]' : 'border-[var(--line)] bg-[var(--surface-2)] opacity-70'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="num shrink-0 w-10 h-10 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] flex items-center justify-center text-sm font-bold">
                  {p.kode}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {p.nama}
                    {!p.aktif && <span className="ml-2 text-[10px] font-medium text-[var(--ink-faint)]">{t('nonaktif', 'inactive')}</span>}
                  </p>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {t('Antrean', 'Queue')} <span className="num">{p.kode}-001</span>
                    {p.tarif_konsultasi > 0 && <> · {t('konsultasi', 'consult')} <span className="num">{rupiah(p.tarif_konsultasi)}</span></>}
                    {p.kode_bpjs && <> · {t('kode BPJS', 'BPJS code')} <span className="num">{p.kode_bpjs}</span></>}
                  </p>
                </div>
                <button onClick={() => { setUbahId(p.id); setForm({
                  nama: p.nama, kode: p.kode, kode_bpjs: p.kode_bpjs || '',
                  tarif_konsultasi: p.tarif_konsultasi ? String(p.tarif_konsultasi) : '',
                }) }}
                  className="shrink-0 p-2 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--surface-2)] hover:text-[var(--brand)]"
                  aria-label={t('Ubah', 'Edit')}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => setAktif(p, !p.aktif)} disabled={sibuk}
                  className="shrink-0 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] hover:underline underline-offset-4 disabled:opacity-50">
                  {p.aktif ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan', 'Activate')}
                </button>
              </div>

              {/* Dokter yang bertugas. Dicentang langsung di sini, bukan di
                  jendela terpisah: daftarnya pendek dan berubah cukup sering. */}
              <div className="mt-3 pt-3 border-t border-[var(--line-soft)]">
                {dokter.length === 0 ? (
                  <p className="text-xs text-[var(--ink-faint)]">
                    {t('Belum ada pengguna berperan Dokter. Tambahkan dulu di Manajemen Pengguna.',
                       'No user has the Doctor role yet. Add one in User Management first.')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {dokter.map(d => {
                      const on = (tugas[p.id] || []).includes((d.email || '').toLowerCase())
                      return (
                        <button key={d.id} onClick={() => geserDokter(p, (d.email || '').toLowerCase())}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
                            on ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                               : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
                          }`}>
                          {on ? <Check size={12} /> : <UserRound size={12} />}
                          {d.nama || d.email}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--brand)]">
                {ubahId ? t('Ubah Poli', 'Edit Unit') : t('Tambah Poli', 'Add Unit')}
              </h3>
              <button onClick={() => { setForm(null); setUbahId(null) }} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={L}>{t('Nama poli', 'Unit name')} <span className="text-red-500">*</span></label>
                <input autoFocus value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                  placeholder={t('Umum, Gigi, KIA, Lansia…', 'General, Dental, Maternal…')} className={I} />
              </div>
              <div>
                <label className={L}>{t('Kode antrean', 'Queue code')} <span className="text-red-500">*</span></label>
                <input value={form.kode} maxLength={3}
                  onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                  placeholder="U" className={`${I} num uppercase`} />
                <p className="text-[11px] text-[var(--ink-faint)] mt-1">
                  {t('Satu sampai tiga huruf. Lebih panjang tidak terbaca dari kursi belakang ruang tunggu, dan itu satu-satunya tempat nomor ini dibaca.',
                     'One to three letters. Longer is unreadable from the back of the waiting room, and that is the only place this number is read.')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={L}>{t('Tarif konsultasi', 'Consultation fee')}</label>
                  <input inputMode="numeric" value={form.tarif_konsultasi}
                    onChange={e => setForm({ ...form, tarif_konsultasi: e.target.value.replace(/[^0-9]/g, '') })}
                    className={`${I} num`} />
                </div>
                <div>
                  <label className={L}>{t('Kode poli BPJS', 'BPJS unit code')}</label>
                  <input value={form.kode_bpjs} onChange={e => setForm({ ...form, kode_bpjs: e.target.value })}
                    className={`${I} num`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setForm(null); setUbahId(null) }}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpan} disabled={sibuk || !form.nama.trim() || !form.kode.trim()}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
