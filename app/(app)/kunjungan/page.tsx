'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, Pill, Search,
  Stethoscope, UserPlus, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { tanggal, tanggalJam } from '@/lib/format'
import FormPasien, { type Pasien } from '@/components/klinik/FormPasien'
import RekamMedis from '@/components/klinik/RekamMedis'
import Resep from '@/components/klinik/Resep'

/**
 * Kunjungan: satu layar kerja untuk seluruh hari.
 *
 * Ini bentuk yang dipilih dari dua yang diajukan. Alasannya bisa dihitung: di
 * klinik, satu pasien melewati enam langkah dalam satu kedatangan, dan kalau
 * keenamnya jadi enam menu terpisah, tiap perpindahan menuntut orang mencari
 * ulang pasien yang sama. Untuk 40 pasien sehari itu 160 pencarian, dan tiap
 * pencarian adalah tempat seseorang bisa memilih baris yang salah. Untuk resep
 * obat, memilih baris yang salah bukan kesalahan administratif.
 *
 * Jadi di sini pasienlah yang berpindah keadaan, bukan orangnya yang berpindah
 * menu. Antrean di kiri, satu pasien terbuka di kanan, dan langkah berikutnya
 * selalu satu tombol besar di tempat yang sama.
 *
 * Yang BELUM ada: rekam medis (SOAP dan tanda vital), e-resep, dan penyerahan
 * obat yang menyambung ke kasir. Ketiganya dibuka DARI layar ini, jadi layar
 * ini harus benar lebih dulu.
 */

type Antrean = {
  id: string
  nomor: string | null
  nomor_antre: string | null
  status: string
  keluhan: string | null
  penjamin: string
  dokter_email: string | null
  dibuka_pada: string
  pasien_id: string
  nomor_rm: string | null
  pasien_nama: string
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  alergi: string | null
  telepon: string | null
  umur: number | null
  jenis_kunjungan: string
  poli: string | null
  no_rujukan: string | null
  kesadaran: string | null
  status_pulang: string | null
  ada_catatan: boolean
  jumlah_diagnosis: number
  ada_vital: boolean
  status_resep: string | null
  unit_id: string | null
  unit_nama: string | null
  unit_kode: string | null
}

type Poli = { id: string; nama: string; kode: string }
type Dokter = { email: string; nama: string | null }

const LANGKAH = ['terdaftar', 'diperiksa', 'resep', 'obat', 'selesai'] as const

export default function HalamanKunjungan() {
  const { t, lang } = useLang()
  const app = useApp()

  const [antrean, setAntrean] = useState<Antrean[]>([])
  const [memuat, setMemuat] = useState(true)
  const [pilih, setPilih] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  const [cariPasien, setCariPasien] = useState('')
  const [hasilPasien, setHasilPasien] = useState<Pasien[]>([])
  const [bukaDaftar, setBukaDaftar] = useState(false)
  const [formPasien, setFormPasien] = useState<Pasien | null | undefined>(undefined)
  const [bukaRekam, setBukaRekam] = useState(false)
  const [bukaResep, setBukaResep] = useState(false)
  const [poli, setPoli] = useState<Poli[]>([])
  const [poliDipilih, setPoliDipilih] = useState<string | null>(null)
  const [dokter, setDokter] = useState<Dokter[]>([])
  const [tugas, setTugas] = useState<Record<string, string[]>>({})

  const namaLangkah: Record<string, string> = {
    terdaftar: t('Terdaftar', 'Registered'),
    diperiksa: t('Diperiksa', 'In exam'),
    resep:     t('Resep', 'Prescription'),
    obat:      t('Obat', 'Dispensing'),
    selesai:   t('Selesai', 'Done'),
    batal:     t('Batal', 'Cancelled'),
  }

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data } = await app.scope(
      supabase.from('v_antrean_hari_ini').select('*').order('dibuka_pada')
    )
    setAntrean((data as Antrean[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  // Poli dan dokter dimuat sekali, bukan tiap kali jendela pendaftaran dibuka:
  // keduanya jarang berubah, dan menunggu dua permintaan jaringan tiap kali
  // seorang pasien datang adalah menunggu yang tidak perlu.
  useEffect(() => {
    ;(async () => {
      const [u, a, d] = await Promise.all([
        app.scope(supabase.from('clinic_units').select('id,nama,kode').eq('aktif', true).order('urutan').order('nama')),
        app.scope(supabase.from('app_users').select('nama,email,role').eq('role', 'dokter').order('nama')),
        app.scope(supabase.from('unit_doctors').select('unit_id,email')),
      ])
      const daftarPoli = (u.data as Poli[]) || []
      setPoli(daftarPoli)
      setPoliDipilih(p => p ?? daftarPoli[0]?.id ?? null)
      setDokter(((a.data as any[]) || []).map(x => ({ email: (x.email || '').toLowerCase(), nama: x.nama })))
      const peta: Record<string, string[]> = {}
      for (const r of (d.data as any[]) || []) {
        peta[r.unit_id] = [...(peta[r.unit_id] || []), (r.email || '').toLowerCase()]
      }
      setTugas(peta)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  // Pasien yang sedang terbuka. Kalau tidak ada yang dipilih, yang pertama
  // belum selesai dibuka sendiri: yang paling sering dilakukan orang saat
  // membuka layar ini adalah melanjutkan antrean, bukan memilih.
  const aktif = useMemo(() => {
    if (pilih) return antrean.find(a => a.id === pilih) || null
    return antrean.find(a => a.status !== 'selesai' && a.status !== 'batal') || null
  }, [antrean, pilih])

  useEffect(() => {
    if (!bukaDaftar) return
    const q = cariPasien.trim()
    if (q.length < 2) { setHasilPasien([]); return }
    const id = setTimeout(async () => {
      const { data } = await app.scope(
        supabase.from('patients').select('*')
          .or(`nama.ilike.%${q}%,nik.ilike.%${q}%,nomor_rm.ilike.%${q}%`)
          .limit(8)
      )
      setHasilPasien((data as Pasien[]) || [])
    }, 220)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cariPasien, bukaDaftar, app.superViewCompany])

  const daftarkan = async (p: Pasien) => {
    setSibuk(true)
    const { data, error } = await supabase.rpc('daftar_kunjungan', {
      p_patient: p.id, p_keluhan: null, p_penjamin: p.penjamin,
      p_unit: poliDipilih, p_dokter: null,
      p_company: (app.isSuper && app.superViewCompany) || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setBukaDaftar(false); setCariPasien(''); setHasilPasien([])
    setPilih((data as any)?.id ?? null)
    muat()
  }

  const pindah = async (status: string, alasan?: string) => {
    if (!aktif) return
    setSibuk(true)
    const { error } = await supabase.rpc('ubah_status_kunjungan', {
      p_visit: aktif.id, p_status: status, p_alasan: alasan ?? null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const pilihDokter = async (email: string) => {
    if (!aktif) return
    setSibuk(true)
    const { error } = await supabase.rpc('set_dokter_kunjungan', {
      p_visit: aktif.id, p_email: email || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const batalkan = async () => {
    if (!aktif) return
    const alasan = prompt(t(`Batalkan kunjungan ${aktif.pasien_nama}? Tulis alasannya.`,
                            `Cancel the visit for ${aktif.pasien_nama}? Write the reason.`), '')
    if (alasan === null) return
    await pindah('batal', alasan)
  }

  const simpanPasien = async (isi: any, id: string | null) => {
    setSibuk(true)
    const { data, error } = await supabase.rpc('simpan_pasien', {
      p_id: id, p_data: isi,
      p_company: (app.isSuper && app.superViewCompany) || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return false }
    setFormPasien(undefined)
    if (!id && data) await daftarkan(data as Pasien)
    return true
  }

  const belum = antrean.filter(a => a.status !== 'selesai' && a.status !== 'batal')
  const kelar = antrean.filter(a => a.status === 'selesai')

  const iKini = aktif ? LANGKAH.indexOf(aktif.status as typeof LANGKAH[number]) : -1
  const berikut = iKini >= 0 && iKini < LANGKAH.length - 1 ? LANGKAH[iKini + 1] : null
  const sebelum = iKini > 0 ? LANGKAH[iKini - 1] : null

  const KARTU = 'bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] tracking-[-0.01em]">{t('Kunjungan', 'Visits')}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID',
              { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className="num">{belum.length}</span> {t('menunggu', 'waiting')}
            {' · '}
            <span className="num">{kelar.length}</span> {t('selesai', 'done')}
          </p>
        </div>
        <button onClick={() => { setBukaDaftar(true); setCariPasien('') }}
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          <UserPlus size={15} /> {t('Daftarkan Kunjungan', 'Register a Visit')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_1fr] gap-4">

        {/* ── Antrean ── */}
        <div className={`${KARTU} p-3 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto`}>
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
            {t('Antrean hari ini', 'Today queue')}
          </p>
          {memuat ? (
            <p className="px-2 py-8 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
          ) : antrean.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-[var(--ink-faint)] leading-relaxed">
              {t('Belum ada kunjungan hari ini. Daftarkan yang pertama lewat tombol di atas.',
                 'No visits today yet. Register the first one with the button above.')}
            </p>
          ) : (
            <div className="space-y-1">
              {antrean.map(a => {
                const on = aktif?.id === a.id
                const tutup = a.status === 'selesai' || a.status === 'batal'
                return (
                  <button key={a.id} onClick={() => setPilih(a.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                      on ? 'border-[var(--brand)] bg-[var(--surface-2)]'
                         : 'border-transparent hover:bg-[var(--surface-2)]'
                    } ${tutup ? 'opacity-55' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="num text-xs font-bold text-[var(--brand)] shrink-0">{a.nomor_antre}</span>
                      <span className="text-sm font-medium text-[var(--ink)] truncate">{a.pasien_nama}</span>
                      {a.alergi && <AlertTriangle size={13} className="shrink-0 text-red-600" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        a.status === 'batal' ? 'bg-gray-100 text-gray-500'
                        : a.status === 'selesai' ? 'bg-green-100 text-green-700'
                        : 'bg-[var(--surface-2)] text-[var(--ink-soft)]'
                      }`}>{namaLangkah[a.status]}</span>
                      {a.unit_nama && (
                        <span className="text-[10px] text-[var(--ink-faint)] truncate">{a.unit_nama}</span>
                      )}
                      <span className="text-[10px] text-[var(--ink-faint)] num ml-auto">
                        {new Date(a.dibuka_pada).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Pasien yang sedang dilayani ── */}
        <div className={`${KARTU} p-5 sm:p-6`}>
          {!aktif ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-sm mx-auto">
                {antrean.length === 0
                  ? t('Belum ada yang perlu dilayani hari ini.', 'Nobody to serve today yet.')
                  : t('Semua kunjungan hari ini sudah ditutup. Pilih salah satu di kiri untuk melihat kembali.',
                      'All of today visits are closed. Pick one on the left to look back.')}
              </p>
            </div>
          ) : (
            <>
              {/* Rel keadaan. Selalu di tempat yang sama, jadi mata tahu sudah
                  sampai mana tanpa membaca. */}
              <div className="flex mb-5 overflow-x-auto">
                {LANGKAH.map((s, i) => {
                  const lewat = iKini > i
                  const kini = iKini === i
                  return (
                    <div key={s}
                      className={`flex-1 min-w-[74px] text-center text-[11px] font-medium py-2 px-1 border border-r-0 last:border-r first:rounded-l-lg last:rounded-r-lg ${
                        kini ? 'text-[var(--on-grad)] border-transparent font-bold'
                        : lewat ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[var(--surface)] text-[var(--ink-faint)] border-[var(--line)]'
                      }`}
                      style={kini ? { background: 'var(--grad)' } : undefined}>
                      {namaLangkah[s]}
                    </div>
                  )
                })}
              </div>

              {/* Peringatan alergi berdiri PALING ATAS dan tidak bisa ditutup.
                  Ia satu-satunya hal di layar ini yang, kalau terlewat dibaca,
                  bisa membunuh orang. */}
              {aktif.alergi && (
                <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-300 text-red-900" role="alert">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{t('Alergi obat', 'Drug allergy')}</p>
                    <p className="text-sm">{aktif.alergi}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="num text-sm font-bold text-[var(--brand)]">{aktif.nomor_antre}</span>
                    <h2 className="text-2xl font-bold text-[var(--ink)] tracking-[-0.01em]">{aktif.pasien_nama}</h2>
                  </div>
                  <p className="text-sm text-[var(--ink-soft)] mt-1">
                    <span className="num">{aktif.nomor_rm || '-'}</span>
                    {aktif.umur !== null && ` · ${aktif.umur} ${t('th', 'y')}`}
                    {aktif.jenis_kelamin && ` · ${aktif.jenis_kelamin === 'L' ? t('Laki-laki', 'Male') : t('Perempuan', 'Female')}`}
                    {aktif.tanggal_lahir && ` · ${tanggal(aktif.tanggal_lahir)}`}
                  </p>
                  <p className="text-xs text-[var(--ink-faint)] mt-1">
                    {aktif.unit_nama && <>{t('Poli', 'Unit')} {aktif.unit_nama}{' · '}</>}
                    {t('Penjamin', 'Payer')}: {aktif.penjamin.toUpperCase()}
                    {' · '}{t('didaftarkan', 'registered')} {tanggalJam(aktif.dibuka_pada)}
                  </p>

                  {/* Dokter pemeriksa ditetapkan di sini, bukan saat mendaftar:
                      yang mendaftar tahu poli tujuannya, belum tentu tahu siapa
                      yang akan memeriksa. Dokter poli ini didahulukan, tapi yang
                      lain tetap bisa dipilih, karena di klinik kecil dokter
                      saling menggantikan. */}
                  {dokter.length > 0 && aktif.status !== 'batal' && aktif.status !== 'selesai' && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-[var(--ink-faint)]">{t('Diperiksa oleh', 'Seen by')}</span>
                      <select value={aktif.dokter_email || ''} disabled={sibuk}
                        onChange={e => pilihDokter(e.target.value)}
                        className="border border-[var(--line)] rounded-lg px-2 py-1 text-xs bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50">
                        <option value="">{t('belum ditentukan', 'not set yet')}</option>
                        {(() => {
                          const sePoli = aktif.unit_id ? (tugas[aktif.unit_id] || []) : []
                          const urut = [...dokter].sort((a, b) =>
                            Number(sePoli.includes(b.email)) - Number(sePoli.includes(a.email)))
                          return urut.map(d => (
                            <option key={d.email} value={d.email}>
                              {d.nama || d.email}{sePoli.includes(d.email) && aktif.unit_nama ? ` · ${aktif.unit_nama}` : ''}
                            </option>
                          ))
                        })()}
                      </select>
                    </div>
                  )}
                  {aktif.dokter_email && (aktif.status === 'selesai' || aktif.status === 'batal') && (
                    <p className="text-xs text-[var(--ink-faint)] mt-1">
                      {t('Diperiksa oleh', 'Seen by')} {aktif.dokter_email}
                    </p>
                  )}
                </div>
                <button onClick={() => setFormPasien(
                  { id: aktif.pasien_id, nomor_rm: aktif.nomor_rm, nama: aktif.pasien_nama,
                    nik: null, tanggal_lahir: aktif.tanggal_lahir, jenis_kelamin: aktif.jenis_kelamin,
                    alamat: null, telepon: aktif.telepon, gol_darah: null, alergi: aktif.alergi,
                    penjamin: aktif.penjamin, nomor_penjamin: null, catatan: null } as Pasien)}
                  className="shrink-0 text-xs font-medium text-[var(--brand)] hover:underline underline-offset-4">
                  {t('Ubah identitas', 'Edit identity')}
                </button>
              </div>

              {aktif.keluhan && (
                <div className="mt-4 rounded-xl bg-[var(--surface-2)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-0.5">
                    {t('Keluhan', 'Complaint')}
                  </p>
                  <p className="text-sm text-[var(--ink)]">{aktif.keluhan}</p>
                </div>
              )}

              {/* Yang dibuka DARI sini. Rekam medis sudah hidup; tiga sisanya
                  tetap ditampilkan supaya bentuk kerjanya terbaca sekarang dan
                  tidak berubah begitu modulnya datang. */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button onClick={() => setBukaRekam(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] transition">
                  <Stethoscope size={14} className="text-[var(--brand)]" />
                  {aktif.ada_catatan || aktif.jumlah_diagnosis > 0
                    ? t('Buka rekam medis', 'Open medical record')
                    : t('Isi rekam medis', 'Fill medical record')}
                  {aktif.jumlah_diagnosis > 0 && (
                    <Check size={13} className="text-emerald-600" />
                  )}
                </button>
                <button onClick={() => setBukaResep(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-xs font-medium text-[var(--ink)] hover:border-[var(--brand)] transition">
                  <Pill size={14} className="text-[var(--brand)]" />
                  {aktif.status_resep
                    ? t('Buka resep', 'Open prescription')
                    : t('Tulis resep', 'Write prescription')}
                  {aktif.status_resep === 'draf' && (
                    <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                      {t('DRAF', 'DRAFT')}
                    </span>
                  )}
                  {(aktif.status_resep === 'final' || aktif.status_resep === 'dilayani') && (
                    <Check size={13} className="text-emerald-600" />
                  )}
                </button>
                {[
                  t('Serahkan obat', 'Dispense'),
                  t('Bayar', 'Payment'),
                ].map((x, i) => (
                  <span key={i}
                    title={t('Belum tersedia. Menyusul di tahap berikutnya.', 'Not available yet. Coming in the next stage.')}
                    className="px-3 py-1.5 rounded-lg border border-dashed border-[var(--line)] text-xs text-[var(--ink-faint)]">
                    {x}
                  </span>
                ))}
              </div>

              {/* Tanda kesiapan, dipasang di sini dan bukan disembunyikan sampai
                  tombol terakhir ditekan. Kunjungan tanpa diagnosis akan ditolak
                  saat ditutup, dan penolakan yang benar pada saat yang salah
                  tetap terasa seperti aplikasi yang rusak. */}
              {aktif.status !== 'batal' && aktif.status !== 'selesai' && aktif.jumlah_diagnosis === 0 && (
                <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <FileText size={14} className="shrink-0 mt-0.5" />
                  {t('Kunjungan ini belum punya diagnosis, jadi belum bisa ditutup. BPJS dan SatuSehat akan menolaknya tanpa itu.',
                     'This visit has no diagnosis yet, so it cannot be closed. BPJS and SatuSehat will reject it without one.')}
                </p>
              )}

              {/* Resep draf tidak muncul di antrean farmasi, dan dokter yang
                  lupa menekan "Finalkan" tidak akan tahu sampai pasiennya
                  menunggu di loket tanpa pernah dipanggil. */}
              {aktif.status_resep === 'draf' && aktif.status !== 'batal' && aktif.status !== 'selesai' && (
                <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Pill size={14} className="shrink-0 mt-0.5" />
                  {t('Resepnya masih draf, jadi belum masuk antrean farmasi. Finalkan dulu supaya obatnya bisa disiapkan.',
                     'The prescription is still a draft, so it has not entered the pharmacy queue. Finalise it so the drugs can be prepared.')}
                </p>
              )}

              {/* Langkah berikutnya: satu tombol besar, selalu di tempat yang
                  sama, dan selalu menyebut langkah berikutnya dengan namanya. */}
              <div className="mt-6 pt-5 border-t border-[var(--line-soft)] flex flex-wrap items-center gap-3">
                {aktif.status === 'batal' ? (
                  <p className="text-sm text-[var(--ink-faint)]">{t('Kunjungan ini dibatalkan.', 'This visit was cancelled.')}</p>
                ) : aktif.status === 'selesai' ? (
                  <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                    <Check size={16} /> {t('Kunjungan selesai.', 'Visit complete.')}
                  </p>
                ) : (
                  <>
                    {berikut && (
                      <button onClick={() => pindah(berikut)} disabled={sibuk}
                        className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                        {namaLangkah[berikut]} <ArrowRight size={16} />
                      </button>
                    )}
                    {sebelum && (
                      <button onClick={() => pindah(sebelum)} disabled={sibuk}
                        className="inline-flex items-center gap-1.5 border border-[var(--line)] text-[var(--ink-soft)] px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-2)] transition disabled:opacity-50">
                        <ArrowLeft size={15} /> {namaLangkah[sebelum]}
                      </button>
                    )}
                    <button onClick={batalkan} disabled={sibuk}
                      className="ml-auto inline-flex items-center gap-1.5 text-xs text-red-600 hover:underline underline-offset-4 disabled:opacity-50">
                      <X size={13} /> {t('Batalkan kunjungan', 'Cancel visit')}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Daftarkan kunjungan ── */}
      {bukaDaftar && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[10vh]" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-1">{t('Daftarkan Kunjungan', 'Register a Visit')}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4">
              {t('Cari pasien yang sudah pernah datang. Kalau belum ada, daftarkan sebagai pasien baru.',
                 'Find a returning patient. If they are new, register them first.')}
            </p>

            {/* Poli dipilih SEBELUM pasiennya, karena itu yang menentukan
                deret antreannya. Kalau ditanyakan sesudah, nomornya sudah
                terlanjur terbit dari deret yang salah. */}
            {poli.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
                  {t('Poli tujuan', 'Destination unit')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {poli.map(u => (
                    <button key={u.id} onClick={() => setPoliDipilih(u.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        poliDipilih === u.id ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                                             : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
                      }`}>
                      <span className="num font-bold">{u.kode}</span> {u.nama}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input autoFocus value={cariPasien} onChange={e => setCariPasien(e.target.value)}
                placeholder={t('Nama, NIK, atau no. rekam medis…', 'Name, ID number, or medical record no.…')}
                className="w-full border border-[var(--line)] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
              {cariPasien.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--ink-faint)]">
                  {t('Ketik minimal dua huruf.', 'Type at least two characters.')}
                </p>
              ) : hasilPasien.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[var(--ink-faint)]">
                  {t('Tidak ada yang cocok.', 'No match.')}
                </p>
              ) : hasilPasien.map(p => (
                <button key={p.id} onClick={() => daftarkan(p)} disabled={sibuk}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-2)] transition disabled:opacity-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)] truncate">{p.nama}</span>
                    {p.alergi && <AlertTriangle size={12} className="shrink-0 text-red-600" />}
                  </div>
                  <p className="text-[11px] text-[var(--ink-faint)] num">
                    {p.nomor_rm || '-'}{p.nik ? ` · ${p.nik}` : ''}{p.tanggal_lahir ? ` · ${tanggal(p.tanggal_lahir)}` : ''}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setBukaDaftar(false)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Tutup', 'Close')}
              </button>
              <button onClick={() => { setBukaDaftar(false); setFormPasien(null) }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                <UserPlus size={15} /> {t('Pasien Baru', 'New Patient')}
              </button>
            </div>
          </div>
        </div>
      )}

      {bukaRekam && aktif && (
        <RekamMedis
          visitId={aktif.id}
          nama={`${aktif.pasien_nama}${aktif.nomor_rm ? ` · ${aktif.nomor_rm}` : ''}`}
          alergi={aktif.alergi}
          tertutup={aktif.status === 'selesai' || aktif.status === 'batal'}
          awal={{
            kesadaran: aktif.kesadaran, poli: aktif.poli, no_rujukan: aktif.no_rujukan,
            status_pulang: aktif.status_pulang, jenis_kunjungan: aktif.jenis_kunjungan,
          }}
          onTutup={() => setBukaRekam(false)}
          onSimpan={muat} />
      )}

      {bukaResep && aktif && (
        <Resep
          visitId={aktif.id}
          nama={`${aktif.pasien_nama}${aktif.nomor_rm ? ` · ${aktif.nomor_rm}` : ''}`}
          alergi={aktif.alergi}
          tertutup={aktif.status === 'selesai' || aktif.status === 'batal'}
          onTutup={() => setBukaResep(false)}
          onSimpan={muat} />
      )}

      {formPasien !== undefined && (
        <FormPasien pasien={formPasien} sibuk={sibuk}
          onTutup={() => setFormPasien(undefined)} onSimpan={simpanPasien} />
      )}
    </div>
  )
}
