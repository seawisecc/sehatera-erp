'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Search, Stethoscope, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TR } from '@/lib/ui'
import { tanggal } from '@/lib/format'
import FormPasien, { type Pasien } from '@/components/klinik/FormPasien'
import RiwayatPasien from '@/components/klinik/RiwayatPasien'
import { boleh } from '@/lib/hak'

/**
 * Daftar pasien.
 *
 * Ini BUKAN tempat orang bekerja sehari-hari; layar Kunjungan yang begitu.
 * Halaman ini untuk mencari riwayat lama dan membetulkan identitas, dan
 * bentuknya mengikuti itu: satu kotak cari yang besar, dan daftar yang bisa
 * dibaca sekilas.
 *
 * Pencariannya menyertakan NIK dan nomor rekam medis, bukan cuma nama.
 * Nama pasien di Indonesia sering sama persis, dan memilih "Ni Wayan Sari"
 * yang keliru dari lima orang bernama sama adalah kesalahan yang tidak
 * kelihatan sampai obatnya sudah diserahkan.
 */

const KELAMIN: Record<string, [string, string]> = {
  L: ['Laki-laki', 'Male'],
  P: ['Perempuan', 'Female'],
}
const PENJAMIN: Record<string, [string, string]> = {
  umum: ['Umum', 'Self-pay'],
  bpjs: ['BPJS', 'BPJS'],
  asuransi: ['Asuransi', 'Insurance'],
}

export default function HalamanPasien() {
  const { t, lang } = useLang()
  const app = useApp()

  const [daftar, setDaftar] = useState<Pasien[]>([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [form, setForm] = useState<Pasien | null | undefined>(undefined)
  const [riwayat, setRiwayat] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data } = await app.scope(supabase.from('patients').select('*').order('nama'))
    setDaftar((data as Pasien[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return daftar
    return daftar.filter(p =>
      [p.nama, p.nik, p.nomor_rm, p.telepon, p.nomor_penjamin]
        .some(v => (v || '').toString().toLowerCase().includes(q)))
  }, [daftar, cari])

  const simpan = async (isi: any, id: string | null) => {
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_pasien', {
      p_id: id, p_data: isi,
      p_company: (app.isSuper && app.superViewCompany) || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return false }
    setForm(undefined)
    muat()
    return true
  }

  /** Mendaftarkan kunjungan langsung dari daftar pasien: yang paling sering
   *  terjadi adalah pasien lama datang lagi, dan memaksanya lewat layar
   *  Kunjungan dulu berarti mencari orang yang sama dua kali. */
  const mulaiKunjungan = async (p: Pasien) => {
    const keluhan = prompt(t(`Keluhan ${p.nama} hari ini?`, `What brings ${p.nama} in today?`), '')
    if (keluhan === null) return
    setSibuk(true)
    const { error } = await supabase.rpc('daftar_kunjungan', {
      p_patient: p.id, p_keluhan: keluhan, p_penjamin: p.penjamin,
      p_company: (app.isSuper && app.superViewCompany) || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    window.location.href = '/kunjungan'
  }

  const umur = (iso: string | null) => {
    if (!iso) return null
    const l = new Date(iso)
    let u = new Date().getFullYear() - l.getFullYear()
    const m = new Date().getMonth() - l.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < l.getDate())) u--
    return u
  }

  const inputCls = 'w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] tracking-[-0.01em]">{t('Pasien', 'Patients')}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {t('Identitas dan riwayat kunjungan. Untuk melayani pasien hari ini, buka Kunjungan.',
               'Identity and visit history. To serve today patients, open Visits.')}
          </p>
        </div>
        <button onClick={() => setForm(null)}
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          <UserPlus size={15} /> {t('Pasien Baru', 'New Patient')}
        </button>
      </div>

      <div className="relative mb-4 max-w-xl">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
        <input value={cari} onChange={e => setCari(e.target.value)} className={inputCls}
          placeholder={t('Cari nama, NIK, no. rekam medis, atau telepon…', 'Search name, ID number, medical record no., or phone…')} />
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>No. RM</th>
              <th className={TH_L}>{t('Nama', 'Name')}</th>
              <th className={TH_L}>{t('Lahir / Umur', 'Born / Age')}</th>
              <th className={TH_L}>NIK</th>
              <th className={TH_C}>{t('Penjamin', 'Payer')}</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : tersaring.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)] text-sm">
                {daftar.length === 0
                  ? t('Belum ada pasien terdaftar. Daftarkan yang pertama lewat tombol di atas.',
                      'No patients registered yet. Add the first one with the button above.')
                  : t('Tidak ada yang cocok dengan pencarian ini.', 'Nothing matches this search.')}
              </td></tr>
            ) : tersaring.map(p => {
              const u = umur(p.tanggal_lahir)
              return (
                <tr key={p.id} className={TR}>
                  <td className="px-4 py-3 num text-xs text-[var(--brand)] font-medium">{p.nomor_rm || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setForm(p)} className="text-left">
                      <span className="font-medium text-[var(--ink)] hover:underline underline-offset-4">{p.nama}</span>
                      {p.alergi && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 align-middle">
                          {t('ALERGI', 'ALLERGY')}
                        </span>
                      )}
                    </button>
                    {p.jenis_kelamin && (
                      <p className="text-[11px] text-[var(--ink-faint)]">
                        {KELAMIN[p.jenis_kelamin]?.[lang === 'en' ? 1 : 0] || p.jenis_kelamin}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] text-xs num">
                    {tanggal(p.tanggal_lahir) || '-'}{u !== null ? ` · ${u} ${t('th', 'y')}` : ''}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] text-xs num">{p.nik || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      p.penjamin === 'bpjs' ? 'bg-emerald-50 text-emerald-700'
                      : p.penjamin === 'asuransi' ? 'bg-blue-50 text-blue-700'
                      : 'bg-[var(--surface-2)] text-[var(--ink-soft)]'}`}>
                      {PENJAMIN[p.penjamin]?.[lang === 'en' ? 1 : 0] || p.penjamin}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Riwayat lebih dulu, dan itu bukan urutan sembarangan:
                          yang paling sering dicari dari daftar pasien adalah
                          "apa yang terjadi terakhir kali", bukan mendaftarkan
                          kunjungan baru. */}
                      {boleh(app.currentRole, 'rekam_medis.baca', app.isSuper) && (
                      <button onClick={e => { e.stopPropagation(); setRiwayat(p.id) }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-medium hover:bg-[var(--surface-2)] hover:text-[var(--brand)] transition whitespace-nowrap">
                        <History size={13} /> {t('Riwayat', 'History')}
                      </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); mulaiKunjungan(p) }} disabled={sibuk}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--brand)] text-xs font-medium hover:bg-[var(--surface-2)] transition whitespace-nowrap disabled:opacity-50">
                        <Stethoscope size={13} /> {t('Daftarkan Kunjungan', 'Start Visit')}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {form !== undefined && (
        <FormPasien pasien={form} sibuk={sibuk} onTutup={() => setForm(undefined)} onSimpan={simpan} />
      )}

      {riwayat && (
        <RiwayatPasien pasienId={riwayat} onTutup={() => setRiwayat(null)} />
      )}
    </div>
  )
}
