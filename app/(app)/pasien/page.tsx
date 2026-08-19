'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, History, Pencil, Search, Stethoscope, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TR } from '@/lib/ui'
import { tanggal } from '@/lib/format'
import FormPasien, { type Pasien } from '@/components/klinik/FormPasien'
import RiwayatPasien from '@/components/klinik/RiwayatPasien'
import DetailPasien from '@/components/klinik/DetailPasien'
import TombolIkon from '@/components/TombolIkon'
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

export default function HalamanPasien() {
  const { t, lang } = useLang()
  const app = useApp()

  const [daftar, setDaftar] = useState<Pasien[]>([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [form, setForm] = useState<Pasien | null | undefined>(undefined)
  const [riwayat, setRiwayat] = useState<string | null>(null)
  const [lihat, setLihat] = useState<Pasien | null>(null)
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
      [p.nama, p.nik, p.nomor_rm, p.telepon, p.nomor_penjamin, p.nomor_bpjs, p.nomor_polis, p.kerabat_telepon]
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

  /**
   * Membuka pendaftaran kunjungan untuk pasien ini, bukan mendaftarkannya.
   *
   * Versi lama menanyakan keluhan lewat kotak bawaan peramban lalu langsung
   * membuat kunjungan dengan penjamin yang tersimpan di profil pasien. Dua hal
   * salah di situ. Poli dan dokternya tidak pernah ditanya, jadi kunjungannya
   * lahir tanpa poli dan nomor antreannya jatuh ke deret bawaan. Dan
   * penjaminnya diambil dari profil, padahal siapa yang menanggung kunjungan
   * HARI INI ditentukan hari ini: pasien yang biasa BPJS bisa datang sebagai
   * pasien umum karena rujukannya belum keluar.
   *
   * Sekarang ia membuka formulir pendaftaran yang sama dengan yang dipakai di
   * layar Kunjungan, dengan pasiennya sudah terpilih.
   */
  const mulaiKunjungan = (p: Pasien) => {
    window.location.href = `/kunjungan?pasien=${p.id}`
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
              <th className={TH_L}>{t('Telepon', 'Phone')}</th>
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
                    {/* Menekan nama membuka BACAAN, bukan formulir ubah.
                        Dulu keduanya satu tindakan, jadi orang yang cuma ingin
                        memastikan nomor telepon berada satu ketikan dari
                        mengubah tanggal lahir orang tanpa sadar. */}
                    <button onClick={() => setLihat(p)} className="text-left">
                      <span className="font-medium text-[var(--ink)] hover:underline underline-offset-4">{p.nama}</span>
                      {p.alergi && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 align-middle">
                          {t('ALERGI', 'ALLERGY')}
                        </span>
                      )}
                      {p.identitas_belum_lengkap && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 align-middle">
                          {t('IDENTITAS BELUM LENGKAP', 'IDENTITY INCOMPLETE')}
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
                  <td className="px-4 py-3 text-[var(--ink-soft)] text-xs num">{p.telepon || '-'}</td>
                  <td className="px-4 py-3">
                    {/* Ikon saja, keterangannya muncul saat disentuh tetikus.
                        Urutannya mengikuti seberapa sering dipakai, bukan
                        seberapa penting: yang paling sering dilakukan dari
                        daftar pasien adalah MELIHAT, lalu membaca riwayat.
                        Mendaftarkan kunjungan ada di ujung karena pintu
                        utamanya memang layar Kunjungan. */}
                    <div className="flex items-center justify-center gap-1.5">
                      <TombolIkon label={t('Lihat data pasien', 'View patient')}
                        onClick={e => { e.stopPropagation(); setLihat(p) }}>
                        <Eye size={14} />
                      </TombolIkon>

                      {boleh(app.currentRole, 'rekam_medis.baca', app.isSuper) && (
                        <TombolIkon label={t('Riwayat rekam medis', 'Medical history')}
                          onClick={e => { e.stopPropagation(); setRiwayat(p.id) }}>
                          <History size={14} />
                        </TombolIkon>
                      )}

                      <TombolIkon label={t('Ubah data pasien', 'Edit patient')}
                        onClick={e => { e.stopPropagation(); setForm(p) }}>
                        <Pencil size={14} />
                      </TombolIkon>

                      <TombolIkon label={t('Daftarkan kunjungan', 'Start a visit')} warna="brand"
                        onClick={e => { e.stopPropagation(); mulaiKunjungan(p) }}>
                        <Stethoscope size={14} />
                      </TombolIkon>
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

      {lihat && (
        <DetailPasien
          pasien={lihat}
          onTutup={() => setLihat(null)}
          onUbah={() => { const p = lihat; setLihat(null); setForm(p) }}
          onRiwayat={() => { const p = lihat; setLihat(null); setRiwayat(p.id) }}
          bolehUbah
          bolehRiwayat={boleh(app.currentRole, 'rekam_medis.baca', app.isSuper)}
        />
      )}

      {riwayat && (
        <RiwayatPasien pasienId={riwayat} onTutup={() => setRiwayat(null)} />
      )}
    </div>
  )
}
