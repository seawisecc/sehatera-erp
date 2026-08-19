'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BadgeCheck, Pencil, X } from 'lucide-react'
import Portal from '@/components/Portal'
import TombolIkon from '@/components/TombolIkon'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TR, TD } from '@/lib/ui'
import { tanggal } from '@/lib/format'

/**
 * Perizinan tenaga kesehatan: STR, SIP, dan masa berlakunya.
 *
 * Menggantikan dua kotak teks di Pengaturan yang cuma memuat SATU nama
 * apoteker. Klinik punya lebih dari satu dokter, dan resep yang dicetak harus
 * membawa nomor izin dokter YANG MENULISNYA. Resep bernomor izin orang lain
 * bukan dokumen yang kurang rapi, ia dokumen yang salah.
 *
 * **Masa berlaku ditampilkan sebagai HITUNGAN HARI, bukan cuma tanggal.**
 * "31 Des 2026" menuntut orang menghitung sendiri, dan yang menuntut menghitung
 * akan dilewati. "Habis 42 hari lagi" tidak bisa dilewati.
 *
 * Tiga tingkat, bukan dua, alasan yang sama dengan kadaluarsa batch obat:
 * "sudah lewat" dan "60 hari lagi" menuntut hal yang berbeda. Yang sudah lewat
 * berarti prakteknya tidak sah hari ini; yang 60 hari lagi berarti berkas
 * perpanjangan mulai disiapkan. Warna yang sama untuk keduanya membuat
 * dua-duanya diabaikan.
 */

type Nakes = {
  id: string
  nama: string | null
  email: string
  role: string
  status: string
  spesialisasi: string | null
  nomor_str: string | null
  str_sampai: string | null
  nomor_sip: string | null
  sip_mulai: string | null
  sip_sampai: string | null
  ihs_practitioner_id: string | null
  sisa_hari: number | null
  str_sisa_hari: number | null
  poli: string[]
}

const LABEL_PERAN: Record<string, [string, string]> = {
  dokter:           ['Dokter', 'Doctor'],
  apoteker:         ['Apoteker', 'Pharmacist'],
  asisten_apoteker: ['Asisten Apoteker', 'Pharmacy Assistant'],
  perawat:          ['Perawat', 'Nurse'],
  analis:           ['Analis', 'Lab Analyst'],
}

/** Nama izinnya berbeda per profesi, dan menyebutnya salah terbaca sebagai tidak tahu. */
const NAMA_IZIN = (role: string) => (role === 'apoteker' || role === 'asisten_apoteker' ? 'SIPA' : 'SIP')

/** Ambang peringatan: 90 hari kira-kira waktu yang dibutuhkan mengurus perpanjangan. */
const AMBANG_SIAGA = 90

export default function Perizinan() {
  const { t, lang } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()

  const [daftar, setDaftar] = useState<Nakes[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [form, setForm] = useState<any>(null)

  const co = app.superViewCompany || null

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data, error } = await supabase.rpc('tenaga_kesehatan', { p_company: co })
    if (error) kabar(pesanError(error), 'galat')
    setDaftar((data as Nakes[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [co])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    if (!form) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setForm(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [form])

  const ringkas = useMemo(() => daftar.reduce((a, n) => {
    if (!n.nomor_sip) a.kosong++
    else if (n.sisa_hari === null) a.tanpaTanggal++
    else if (n.sisa_hari < 0) a.habis++
    else if (n.sisa_hari <= AMBANG_SIAGA) a.siaga++
    return a
  }, { kosong: 0, tanpaTanggal: 0, habis: 0, siaga: 0 }), [daftar])

  const simpan = async () => {
    setSibuk(true)
    const { error } = await supabase.rpc('simpan_perizinan', {
      p_id: form.id,
      p_data: {
        nama: form.nama, spesialisasi: form.spesialisasi,
        nomor_str: form.nomor_str, str_sampai: form.str_sampai || null,
        nomor_sip: form.nomor_sip,
        sip_mulai: form.sip_mulai || null, sip_sampai: form.sip_sampai || null,
        ihs_practitioner_id: form.ihs_practitioner_id,
      },
      p_company: co,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setForm(null)
    kabar(t('Perizinan tersimpan.', 'Licence saved.'), 'ok')
    muat()
  }

  /** Satu tempat yang memutuskan warna dan kalimatnya, supaya tabel dan dialog tidak berbeda. */
  const keadaan = (n: Nakes) => {
    if (!n.nomor_sip) {
      return { kelas: 'bg-[var(--surface-2)] text-[var(--ink-faint)]',
               teks: t('Belum diisi', 'Not filled in') }
    }
    if (n.sisa_hari === null) {
      return { kelas: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
               teks: t('Tanpa masa berlaku', 'No expiry recorded') }
    }
    if (n.sisa_hari < 0) {
      return { kelas: 'bg-red-100 text-red-800 ring-1 ring-red-700/20',
               teks: t(`Habis ${Math.abs(n.sisa_hari)} hari lalu`, `Expired ${Math.abs(n.sisa_hari)} days ago`) }
    }
    if (n.sisa_hari <= AMBANG_SIAGA) {
      return { kelas: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
               teks: t(`${n.sisa_hari} hari lagi`, `${n.sisa_hari} days left`) }
    }
    return { kelas: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
             teks: t(`Berlaku, ${n.sisa_hari} hari lagi`, `Valid, ${n.sisa_hari} days left`) }
  }

  const inputCls = 'w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">
        {t('Perizinan Tenaga Kesehatan', 'Practitioner Licences')}
      </h2>
      <p className="text-sm text-[var(--ink-soft)] mb-5 leading-relaxed">
        {t('Nomor STR dan SIP beserta masa berlakunya. Nomor izin dokter tercetak di resep yang ia tulis, jadi yang kosong akan terlihat kosong di kertas resepnya.',
           'Registration and practice licence numbers with their validity. A doctor licence number is printed on the prescriptions they write, so an empty one shows up empty on paper.')}
      </p>

      {(ringkas.habis > 0 || ringkas.siaga > 0) && (
        <div className={`mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
          ringkas.habis > 0 ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            {ringkas.habis > 0 && (
              <b>{t(`${ringkas.habis} izin sudah habis berlaku. `, `${ringkas.habis} licences have expired. `)}</b>
            )}
            {ringkas.siaga > 0 && t(`${ringkas.siaga} akan habis dalam ${AMBANG_SIAGA} hari. `,
                                    `${ringkas.siaga} expire within ${AMBANG_SIAGA} days. `)}
            {t('Praktik dengan izin yang lewat tidak sah sejak hari habisnya, bukan sejak ada yang menegur.',
               'Practising on an expired licence is invalid from the day it lapsed, not from the day someone notices.')}
          </span>
        </div>
      )}

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Nama', 'Name')}</th>
              <th className={TH_L}>{t('Peran', 'Role')}</th>
              <th className={TH_L}>STR</th>
              <th className={TH_L}>SIP / SIPA</th>
              <th className={TH_C}>{t('Masa berlaku', 'Validity')}</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat && (
              <tr><td className={TD + ' text-center text-[var(--ink-faint)]'} colSpan={6}>{t('Memuat…', 'Loading…')}</td></tr>
            )}
            {!memuat && daftar.length === 0 && (
              <tr><td className={TD + ' text-center text-[var(--ink-faint)] py-10 text-sm'} colSpan={6}>
                {t('Belum ada dokter, apoteker, atau tenaga kesehatan lain di daftar pengguna. Tambahkan dulu lewat Manajemen Pengguna.',
                   'No doctors, pharmacists, or other practitioners in the user list yet. Add them under User Management first.')}
              </td></tr>
            )}
            {daftar.map(n => {
              const k = keadaan(n)
              return (
                <tr key={n.id} className={TR}>
                  <td className={TD}>
                    <p className="font-medium text-[var(--ink)]">{n.nama || n.email}</p>
                    <p className="text-[11px] text-[var(--ink-faint)]">
                      {n.email}
                      {n.spesialisasi ? ` · ${n.spesialisasi}` : ''}
                      {n.poli?.length ? ` · ${n.poli.join(', ')}` : ''}
                    </p>
                  </td>
                  <td className={TD + ' text-[var(--ink-soft)] text-xs'}>
                    {LABEL_PERAN[n.role]?.[lang === 'en' ? 1 : 0] || n.role}
                  </td>
                  <td className={TD + ' num text-xs text-[var(--ink-soft)]'}>
                    {n.nomor_str || '-'}
                    {n.str_sampai && (
                      <div className={`text-[10px] ${(n.str_sisa_hari ?? 1) < 0 ? 'text-red-700 font-semibold' : 'text-[var(--ink-faint)]'}`}>
                        {tanggal(n.str_sampai)}
                      </div>
                    )}
                  </td>
                  <td className={TD + ' num text-xs text-[var(--ink)]'}>
                    {n.nomor_sip || <span className="text-[var(--ink-faint)]">-</span>}
                    {n.sip_sampai && (
                      <div className="text-[10px] text-[var(--ink-faint)]">{tanggal(n.sip_sampai)}</div>
                    )}
                  </td>
                  <td className={TD + ' text-center'}>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${k.kelas}`}>{k.teks}</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center justify-center">
                      <TombolIkon label={t('Isi atau ubah perizinan', 'Fill in or edit licence')}
                        onClick={() => setForm({
                          id: n.id, nama: n.nama || '', role: n.role,
                          spesialisasi: n.spesialisasi || '',
                          nomor_str: n.nomor_str || '', str_sampai: n.str_sampai || '',
                          nomor_sip: n.nomor_sip || '',
                          sip_mulai: n.sip_mulai || '', sip_sampai: n.sip_sampai || '',
                          ihs_practitioner_id: n.ihs_practitioner_id || '',
                        })}>
                        <Pencil size={14} />
                      </TombolIkon>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--ink-faint)] mt-3 leading-relaxed">
        {t('Daftar ini diambil dari pengguna yang perannya dokter, apoteker, asisten apoteker, perawat, atau analis. Untuk menambah orang, buka Manajemen Pengguna; di sini yang diisi hanya perizinannya.',
           'This list comes from users whose role is doctor, pharmacist, pharmacy assistant, nurse, or analyst. To add a person, open User Management; this screen only fills in their licences.')}
      </p>

      {form && (
        <Portal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
            <div className="bg-[var(--surface)] rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-[var(--line)]">
                <div>
                  <h3 className="text-lg font-bold text-[var(--brand)]">{t('Perizinan', 'Licence')}</h3>
                  <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                    {LABEL_PERAN[form.role]?.[lang === 'en' ? 1 : 0] || form.role}
                  </p>
                </div>
                <button onClick={() => setForm(null)} className="p-1.5 rounded-lg text-[var(--ink-faint)] hover:bg-[var(--surface-2)]" aria-label={t('Tutup', 'Close')}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                    {t('Nama lengkap dengan gelar', 'Full name with title')}
                  </label>
                  {/* Ditulis lengkap dengan gelarnya karena INI yang tercetak
                      di resep dan di berita acara, bukan nama panggilan. */}
                  <input autoFocus value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder={form.role === 'dokter' ? 'dr. Nama Lengkap, Sp.PD' : 'apt. Nama Lengkap, S.Farm.'}
                    className={inputCls} />
                </div>

                {form.role === 'dokter' && (
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Spesialisasi', 'Speciality')}</label>
                    <input value={form.spesialisasi} onChange={e => setForm({ ...form, spesialisasi: e.target.value })}
                      placeholder={t('Kosongkan untuk dokter umum', 'Leave empty for general practice')} className={inputCls} />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nomor STR', 'Registration no. (STR)')}</label>
                    <input value={form.nomor_str} onChange={e => setForm({ ...form, nomor_str: e.target.value })} className={inputCls + ' num'} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('STR berlaku sampai', 'STR valid until')}</label>
                    <input type="date" value={form.str_sampai} onChange={e => setForm({ ...form, str_sampai: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                    {t(`Nomor ${NAMA_IZIN(form.role)}`, `${NAMA_IZIN(form.role)} number`)}
                  </label>
                  <input value={form.nomor_sip} onChange={e => setForm({ ...form, nomor_sip: e.target.value })} className={inputCls + ' num'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Berlaku mulai', 'Valid from')}</label>
                    <input type="date" value={form.sip_mulai} onChange={e => setForm({ ...form, sip_mulai: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Berlaku sampai', 'Valid until')}</label>
                    <input type="date" value={form.sip_sampai} onChange={e => setForm({ ...form, sip_sampai: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed">
                  {t('Kosongkan tanggalnya kalau memang belum tahu. Yang kosong ditandai "tanpa masa berlaku", dan itu lebih jujur daripada tanggal karangan yang membuat layar ini bilang aman.',
                     'Leave the dates empty if you do not know them yet. Empty is marked "no expiry recorded", which is more honest than an invented date that makes this screen say everything is fine.')}
                </p>

                <div className="pt-1">
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                    {t('IHS Practitioner ID (SatuSehat)', 'IHS Practitioner ID (SatuSehat)')}
                  </label>
                  <input value={form.ihs_practitioner_id} onChange={e => setForm({ ...form, ihs_practitioner_id: e.target.value })}
                    placeholder={t('Boleh dikosongkan sampai pengirimannya disambungkan', 'May stay empty until sending is connected')}
                    className={inputCls + ' num'} />
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-[var(--line)]">
                <button onClick={() => setForm(null)} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                  {t('Batal', 'Cancel')}
                </button>
                <button onClick={simpan} disabled={sibuk}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  <BadgeCheck size={15} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
