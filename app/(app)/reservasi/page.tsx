'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, Phone, Search, UserPlus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import { tanggal } from '@/lib/format'

/**
 * Reservasi: janji datang, bukan rekam medis.
 *
 * Tiga hal yang membentuk layar ini, dan ketiganya keputusan yang bisa
 * dibantah, jadi ditulis di sini supaya tidak perlu ditebak nanti.
 *
 * 1. **Yang memesan boleh belum jadi pasien.** Yang menelepon sore ini untuk
 *    besok pagi belum tentu pernah datang. Memaksa nomor RM lebih dulu berarti
 *    klinik mengumpulkan rekam medis untuk orang yang mungkin tidak jadi
 *    datang. Pencocokan ke pasien terjadi saat orangnya tiba, di kotak yang
 *    sama dengan pendaftaran biasa.
 * 2. **Sisa kursi dibaca dari database**, lewat `jadwal_tanggal()`, bukan
 *    dihitung di sini. Kalau layar menghitung sendiri, ia akan menampilkan
 *    "sisa 2" pada saat database sudah menolak, dan petugas loket akan
 *    mengira aplikasinya rusak padahal ia sedang benar.
 * 3. **Yang harinya lewat tanpa datang dihanguskan saat layar dibuka.**
 *    Klinik ini belum punya penjadwal, dan reservasi yang menggantung di
 *    keadaan menunggu selamanya membuat hitungan hari berikutnya salah.
 */

type Sesi = {
  id: string
  unit_id: string
  unit_nama: string
  dokter_email: string | null
  jam_mulai: string
  jam_selesai: string
  kuota: number
  terpakai: number
}

const hariIni = () => new Date().toISOString().slice(0, 10)

const jamPendek = (j: string) => (j || '').slice(0, 5)

export default function HalamanReservasi() {
  const { t } = useLang()
  const app = useApp()

  const bolehTulis = boleh(app.currentRole, 'reservasi.tulis', app.isSuper)

  const [tgl, setTgl] = useState(hariIni())
  const [sesi, setSesi] = useState<Sesi[]>([])
  const [daftar, setDaftar] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const [buka, setBuka] = useState(false)
  const [form, setForm] = useState({
    nama: '', telepon: '', jadwal: '', keluhan: '',
    penjamin: 'umum' as 'umum' | 'bpjs' | 'asuransi',
    asuransi: '', nomor_penjamin: '', patient_id: '',
  })
  const [cariPasien, setCariPasien] = useState('')
  const [hasilPasien, setHasilPasien] = useState<any[]>([])
  const [asuransi, setAsuransi] = useState<any[]>([])

  // Untuk menghadirkan reservasi yang dibuat tanpa nomor RM.
  const [cocokkan, setCocokkan] = useState<any>(null)
  const [cariCocok, setCariCocok] = useState('')
  const [hasilCocok, setHasilCocok] = useState<any[]>([])

  const scope = app.scope

  const muat = useCallback(async () => {
    setMemuat(true)
    setGalat('')

    // Dipanggil sebelum membaca, supaya angka yang muncul sudah bersih dari
    // janji kemarin yang tidak pernah ditepati.
    await supabase.rpc('hanguskan_reservasi_lewat', { p_company: app.superViewCompany || null })

    const [{ data: j, error: ej }, { data: r }] = await Promise.all([
      supabase.rpc('jadwal_tanggal', { p_tanggal: tgl, p_company: app.superViewCompany || null }),
      scope(
        supabase.from('reservations')
          .select('*, patients(nama, nomor_rm), clinic_units(nama)')
          .eq('tanggal', tgl)
          .order('urut')
      ),
    ])
    if (ej) setGalat(pesanError(ej))
    setSesi(((j as any[]) || []) as Sesi[])
    setDaftar((r as any[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgl, app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    ;(async () => {
      const { data } = await scope(supabase.from('insurers').select('id,nama').eq('aktif', true).order('nama'))
      setAsuransi((data as any[]) || [])
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  const cariPasienDi = async (q: string, set: (v: any[]) => void) => {
    if (q.trim().length < 2) { set([]); return }
    const { data } = await scope(
      supabase.from('patients').select('id,nama,nomor_rm,telepon,penjamin,asuransi_id,nomor_penjamin')
        .or(`nama.ilike.%${q}%,nomor_rm.ilike.%${q}%,telepon.ilike.%${q}%`)
        .limit(8)
    )
    set((data as any[]) || [])
  }

  useEffect(() => {
    const id = setTimeout(() => cariPasienDi(cariPasien, setHasilPasien), 250)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cariPasien])

  useEffect(() => {
    const id = setTimeout(() => cariPasienDi(cariCocok, setHasilCocok), 250)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cariCocok])

  const menunggu = useMemo(() => daftar.filter(x => x.status === 'menunggu'), [daftar])
  const selesai = useMemo(() => daftar.filter(x => x.status !== 'menunggu'), [daftar])

  const simpan = async () => {
    if (!form.nama.trim() || !form.jadwal) return
    setSibuk(true)
    const { error } = await supabase.rpc('buat_reservasi', {
      p_nama: form.nama.trim(),
      p_tanggal: tgl,
      p_jadwal: form.jadwal,
      p_telepon: form.telepon.trim() || null,
      p_patient: form.patient_id || null,
      p_keluhan: form.keluhan.trim() || null,
      p_penjamin: form.penjamin,
      p_asuransi: form.penjamin === 'asuransi' ? (form.asuransi || null) : null,
      p_nomor_penjamin: form.nomor_penjamin.trim() || null,
      p_company: app.superViewCompany || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setBuka(false)
    setForm({ nama: '', telepon: '', jadwal: '', keluhan: '', penjamin: 'umum', asuransi: '', nomor_penjamin: '', patient_id: '' })
    setCariPasien('')
    muat()
  }

  const hadirkan = async (r: any, patientId?: string) => {
    setSibuk(true)
    const { error } = await supabase.rpc('hadirkan_reservasi', {
      p_id: r.id, p_patient: patientId || r.patient_id || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setCocokkan(null)
    setCariCocok('')
    muat()
  }

  const batalkan = async (r: any) => {
    const alasan = window.prompt(t('Alasan pembatalan (boleh dikosongkan):', 'Reason for cancelling (optional):'))
    if (alasan === null) return
    setSibuk(true)
    const { error } = await supabase.rpc('batal_reservasi', { p_id: r.id, p_alasan: alasan || null })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const KARTU = 'bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm'

  const namaSesi = (s: Sesi) =>
    `${s.unit_nama} · ${jamPendek(s.jam_mulai)}-${jamPendek(s.jam_selesai)}${s.dokter_email ? ` · ${s.dokter_email}` : ''}`

  const sisaSesi = (s: Sesi) => (s.kuota > 0 ? s.kuota - s.terpakai : null)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Reservasi', 'Appointments')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">
            {tanggal(tgl)} · <span className="num">{menunggu.length}</span> {t('ditunggu', 'expected')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={tgl} onChange={e => setTgl(e.target.value)} className={inputCls + ' w-auto'} />
          {bolehTulis && (
            <button onClick={() => setBuka(true)} disabled={sesi.length === 0}
              className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-40">
              <CalendarClock size={16} /> {t('Buat Reservasi', 'New Appointment')}
            </button>
          )}
        </div>
      </div>

      {galat && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{galat}</p>
      )}

      {/* Sesi hari itu, beserta sisanya. Ditaruh di atas daftar orangnya
          karena pertanyaan pertama petugas loket bukan "siapa saja", melainkan
          "masih ada tempat atau tidak". */}
      {sesi.length === 0 ? (
        <div className={`${KARTU} p-8 text-center mb-5`}>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-md mx-auto">
            {t('Tidak ada jadwal praktik pada tanggal ini. Atur jadwalnya di Pengaturan > Poli & Dokter supaya reservasi bisa dibuat.',
               'No practice schedule on this date. Set it up in Settings > Units & Doctors so appointments can be made.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {sesi.map(s => {
            const sisa = sisaSesi(s)
            return (
              <div key={s.id} className={`${KARTU} p-4`}>
                <p className="text-sm font-semibold text-[var(--ink)]">{s.unit_nama}</p>
                <p className="text-xs text-[var(--ink-soft)] num mt-0.5">
                  {jamPendek(s.jam_mulai)} - {jamPendek(s.jam_selesai)}
                </p>
                {s.dokter_email && <p className="text-xs text-[var(--ink-faint)] truncate mt-0.5">{s.dokter_email}</p>}
                <p className="mt-2 text-sm">
                  {sisa === null ? (
                    <span className="text-[var(--ink-soft)]">
                      <span className="num font-bold text-[var(--ink)]">{s.terpakai}</span> {t('memesan · tanpa batas', 'booked · no limit')}
                    </span>
                  ) : (
                    <span className={sisa <= 0 ? 'text-red-700 font-semibold' : 'text-[var(--ink-soft)]'}>
                      <span className="num font-bold">{sisa}</span> {t('dari', 'of')} <span className="num">{s.kuota}</span> {t('tempat tersisa', 'seats left')}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className={`${KARTU} p-5 sm:p-6`}>
        {memuat ? (
          <p className="text-sm text-[var(--ink-faint)] py-8 text-center">{t('Memuat...', 'Loading...')}</p>
        ) : daftar.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)] py-8 text-center">
            {t('Belum ada yang memesan untuk tanggal ini.', 'Nobody has booked for this date yet.')}
          </p>
        ) : (
          <div className="space-y-2">
            {[...menunggu, ...selesai].map(r => (
              <div key={r.id}
                className={`flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  r.status === 'menunggu' ? 'border-[var(--line)]' : 'border-[var(--line-soft)] bg-[var(--surface-2)]/40'
                }`}>
                <span className="num text-xs font-bold text-[var(--brand)] shrink-0">{r.nomor}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--ink)] truncate">
                    {r.patients?.nama || r.nama}
                    {r.patients?.nomor_rm && <span className="text-xs text-[var(--ink-faint)] num"> · {r.patients.nomor_rm}</span>}
                    {!r.patient_id && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 align-middle">
                        {t('BELUM PUNYA RM', 'NO RECORD YET')}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[var(--ink-faint)] truncate">
                    {r.clinic_units?.nama || '-'}
                    {r.telepon && <> · <Phone size={10} className="inline" /> <span className="num">{r.telepon}</span></>}
                    {r.penjamin !== 'umum' && <> · {r.penjamin.toUpperCase()}</>}
                    {r.keluhan && <> · {r.keluhan}</>}
                  </p>
                </div>
                {r.status === 'menunggu' ? (
                  bolehTulis && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => (r.patient_id ? hadirkan(r) : setCocokkan(r))} disabled={sibuk}
                        className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                        <Check size={13} /> {t('Tiba', 'Arrived')}
                      </button>
                      <button onClick={() => batalkan(r)} disabled={sibuk}
                        className="text-xs text-red-600 hover:underline underline-offset-4 disabled:opacity-50">
                        {t('Batal', 'Cancel')}
                      </button>
                    </div>
                  )
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    r.status === 'hadir' ? 'bg-green-100 text-green-700'
                    : r.status === 'batal' ? 'bg-red-50 text-red-700'
                    : 'bg-[var(--surface-2)] text-[var(--ink-faint)]'
                  }`}>
                    {r.status === 'hadir' ? t('SUDAH DATANG', 'ARRIVED')
                      : r.status === 'batal' ? t('DIBATALKAN', 'CANCELLED')
                      : t('TIDAK DATANG', 'NO SHOW')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Buat reservasi ── */}
      {buka && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[8vh]" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-1">{t('Buat Reservasi', 'New Appointment')}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4">
              {t('Untuk ' + tanggal(tgl) + '. Pasien yang belum pernah datang cukup diisi nama dan teleponnya.',
                 'For ' + tanggal(tgl) + '. Someone who has never been here only needs a name and phone number.')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">
                  {t('Sesi praktik', 'Session')} <span className="text-red-500">*</span>
                </label>
                <select value={form.jadwal} onChange={e => setForm({ ...form, jadwal: e.target.value })} className={inputCls}>
                  <option value="">{t('Pilih sesi...', 'Choose a session...')}</option>
                  {sesi.map(s => {
                    const sisa = sisaSesi(s)
                    return (
                      <option key={s.id} value={s.id} disabled={sisa !== null && sisa <= 0}>
                        {namaSesi(s)}{sisa === null ? '' : ` · ${sisa <= 0 ? t('penuh', 'full') : `${t('sisa', 'left')} ${sisa}`}`}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Pasien lama dicari; yang baru cukup namanya. Dua-duanya lewat
                  kotak yang sama supaya petugas tidak perlu memutuskan lebih
                  dulu orang ini sudah pernah datang atau belum. */}
              <div>
                <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">
                  {t('Cari pasien lama', 'Find a returning patient')}
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                  <input value={cariPasien} onChange={e => setCariPasien(e.target.value)}
                    placeholder={t('Nama, no. RM, atau telepon', 'Name, record no., or phone')}
                    className={inputCls + ' pl-9'} />
                </div>
                {hasilPasien.length > 0 && (
                  <div className="mt-1.5 border border-[var(--line)] rounded-lg divide-y divide-[var(--line-soft)] max-h-44 overflow-y-auto">
                    {hasilPasien.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => {
                          setForm(f => ({
                            ...f, patient_id: p.id, nama: p.nama, telepon: p.telepon || f.telepon,
                            penjamin: (p.penjamin || 'umum'), asuransi: p.asuransi_id || '',
                            nomor_penjamin: p.nomor_penjamin || '',
                          }))
                          setCariPasien('')
                          setHasilPasien([])
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)]">
                        {p.nama}
                        {p.nomor_rm && <span className="text-xs text-[var(--ink-faint)] num"> · {p.nomor_rm}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">
                    {t('Nama', 'Name')} <span className="text-red-500">*</span>
                  </label>
                  <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value, patient_id: '' })} className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Telepon', 'Phone')}</label>
                  <input value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} inputMode="tel" className={inputCls + ' num'} />
                </div>
              </div>

              {form.patient_id && (
                <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                  <Check size={13} /> {t('Terhubung ke rekam medis yang sudah ada.', 'Linked to an existing record.')}
                </p>
              )}

              <div>
                <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Keluhan', 'Complaint')}</label>
                <input value={form.keluhan} onChange={e => setForm({ ...form, keluhan: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Penjamin', 'Payer')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['umum', 'bpjs', 'asuransi'] as const).map(x => (
                    <button key={x} type="button" onClick={() => setForm({ ...form, penjamin: x, asuransi: x === 'asuransi' ? form.asuransi : '' })}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        form.penjamin === x ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]'
                                            : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'
                      }`}>
                      {x === 'umum' ? 'Umum' : x === 'bpjs' ? 'BPJS' : t('Asuransi', 'Insurance')}
                    </button>
                  ))}
                </div>
              </div>

              {form.penjamin === 'asuransi' && (
                <select value={form.asuransi} onChange={e => setForm({ ...form, asuransi: e.target.value })} className={inputCls}>
                  <option value="">{t('Pilih penerbit asuransi...', 'Choose the insurer...')}</option>
                  {asuransi.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                </select>
              )}

              {form.penjamin !== 'umum' && (
                <input value={form.nomor_penjamin} onChange={e => setForm({ ...form, nomor_penjamin: e.target.value })}
                  placeholder={t('Nomor kartu/polis', 'Card or policy number')} className={inputCls + ' num'} />
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={simpan} disabled={sibuk || !form.nama.trim() || !form.jadwal}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-40">
                {t('Simpan Reservasi', 'Save Appointment')}
              </button>
              <button onClick={() => setBuka(false)}
                className="px-4 py-2.5 rounded-xl text-sm border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]">
                {t('Tutup', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cocokkan pasien saat orangnya tiba ── */}
      {cocokkan && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-[12vh]" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-1">{t('Siapa yang datang?', 'Who arrived?')}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
              {t(`"${cocokkan.nama}" memesan tanpa nomor RM. Cocokkan ke pasien yang sudah ada, atau daftarkan dulu sebagai pasien baru di menu Pasien.`,
                 `"${cocokkan.nama}" booked without a record number. Match them to an existing patient, or register them first in the Patients screen.`)}
            </p>

            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input value={cariCocok} onChange={e => setCariCocok(e.target.value)} autoFocus
                placeholder={t('Nama, no. RM, atau telepon', 'Name, record no., or phone')}
                className={inputCls + ' pl-9'} />
            </div>

            {hasilCocok.length > 0 && (
              <div className="border border-[var(--line)] rounded-lg divide-y divide-[var(--line-soft)] max-h-52 overflow-y-auto">
                {hasilCocok.map(p => (
                  <button key={p.id} type="button" onClick={() => hadirkan(cocokkan, p.id)} disabled={sibuk}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] disabled:opacity-50">
                    {p.nama}
                    {p.nomor_rm && <span className="text-xs text-[var(--ink-faint)] num"> · {p.nomor_rm}</span>}
                  </button>
                ))}
              </div>
            )}

            <a href="/pasien"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:underline underline-offset-4">
              <UserPlus size={14} /> {t('Daftarkan sebagai pasien baru', 'Register as a new patient')}
            </a>

            <button onClick={() => { setCocokkan(null); setCariCocok('') }}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]">
              <X size={14} /> {t('Tutup', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
