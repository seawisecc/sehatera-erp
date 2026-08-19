'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Plus, Trash2, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'

/**
 * Jadwal praktik per poli. Dasar dari modul Reservasi.
 *
 * Bentuknya SESI, bukan slot janji per lima belas menit. Klinik pratama tidak
 * bekerja begitu: pasien datang di rentang jam praktik dan dilayani berurutan.
 * Memaksa jam pasti berarti membuat janji yang tidak pernah ditepati, dan
 * pasien yang datang tepat waktu tetap menunggu di belakang tiga orang. Yang
 * bisa dijanjikan adalah sesi dan urutan di dalamnya.
 *
 * Kuota 0 berarti TANPA BATAS, bukan tertutup. Pola yang sama dengan kolom
 * paket di `lib/plan.ts`: penanda yang lupa diisi itu wajar, dan memberi
 * kelebihan jauh lebih murah daripada menolak pasien di depan kursi kosong
 * lalu menunggu kliniknya mengeluh.
 */

const HARI = [
  ['Minggu', 'Sunday'], ['Senin', 'Monday'], ['Selasa', 'Tuesday'],
  ['Rabu', 'Wednesday'], ['Kamis', 'Thursday'], ['Jumat', 'Friday'], ['Sabtu', 'Saturday'],
] as const

type Jadwal = {
  id: string
  unit_id: string
  dokter_email: string | null
  hari: number
  jam_mulai: string
  jam_selesai: string
  kuota: number
  aktif: boolean
}

const KOSONG = { unit_id: '', dokter_email: '', hari: [] as number[], jam_mulai: '08:00', jam_selesai: '12:00', kuota: '20' }

export default function JadwalPraktik() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()

  const [poli, setPoli] = useState<any[]>([])
  const [dokter, setDokter] = useState<any[]>([])
  const [jadwal, setJadwal] = useState<Jadwal[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [form, setForm] = useState<typeof KOSONG | null>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const [u, a, j] = await Promise.all([
      app.scope(supabase.from('clinic_units').select('id,nama,aktif').order('urutan').order('nama')),
      app.scope(supabase.from('app_users').select('nama,email,role')),
      app.scope(supabase.from('doctor_schedules').select('*').order('hari').order('jam_mulai')),
    ])
    setPoli((u.data as any[]) || [])
    setDokter(((a.data as any[]) || []).filter(x => x.role === 'dokter'))
    setJadwal((j.data as Jadwal[]) || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  /**
   * Satu tekan Simpan boleh membuat beberapa hari sekaligus.
   *
   * Jadwal praktik hampir selalu berbentuk "Senin sampai Jumat pagi", dan
   * memaksa mengisi formulir yang sama lima kali adalah cara paling mudah
   * membuat hari Kamis punya jam yang berbeda karena satu ketikan meleset.
   */
  const simpan = async () => {
    if (!form || !form.unit_id || form.hari.length === 0) return
    setSibuk(true)
    const baris = form.hari.map(h => ({
      ...app.cid(),
      unit_id: form.unit_id,
      dokter_email: form.dokter_email || null,
      hari: h,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      kuota: Number(form.kuota) || 0,
    }))
    const { error } = await supabase.from('doctor_schedules').insert(baris)
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setForm(null)
    muat()
  }

  const hapus = async (j: Jadwal) => {
    setSibuk(true)
    const { error } = await supabase.from('doctor_schedules').delete().eq('id', j.id)
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide'

  const namaPoli = (id: string) => poli.find(p => p.id === id)?.nama || '-'
  const jamPendek = (j: string) => (j || '').slice(0, 5)

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h3 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2">
          <CalendarClock size={18} /> {t('Jadwal Praktik', 'Practice Schedule')}
        </h3>
        <button onClick={() => setForm({ ...KOSONG })} disabled={poli.length === 0}
          className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-40">
          <Plus size={15} /> {t('Tambah Sesi', 'Add Session')}
        </button>
      </div>
      <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
        {t('Sesi inilah yang bisa dipesan di menu Reservasi. Kuota 0 berarti tanpa batas.',
           'These sessions are what can be booked in Appointments. A quota of 0 means no limit.')}
      </p>

      {memuat ? (
        <p className="text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
      ) : jadwal.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)] border border-dashed border-[var(--line)] rounded-xl px-4 py-6 text-center">
          {t('Belum ada jadwal praktik. Tanpa ini, reservasi tidak bisa dibuat sama sekali.',
             'No practice schedule yet. Without one, no appointment can be made at all.')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {jadwal.map(j => (
            <div key={j.id} className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl border border-[var(--line)]">
              <span className="text-xs font-semibold text-[var(--brand)] w-16 shrink-0">{HARI[j.hari][0]}</span>
              <span className="num text-sm text-[var(--ink)] shrink-0">
                {jamPendek(j.jam_mulai)} - {jamPendek(j.jam_selesai)}
              </span>
              <span className="text-sm text-[var(--ink-soft)] truncate flex-1">
                {namaPoli(j.unit_id)}
                {j.dokter_email && <span className="text-[var(--ink-faint)]"> · {j.dokter_email}</span>}
              </span>
              <span className="text-xs text-[var(--ink-faint)] shrink-0">
                {j.kuota > 0
                  ? <><span className="num">{j.kuota}</span> {t('tempat', 'seats')}</>
                  : t('tanpa batas', 'no limit')}
              </span>
              <button onClick={() => hapus(j)} disabled={sibuk}
                className="shrink-0 p-1.5 rounded-lg text-[var(--ink-faint)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={t('Hapus', 'Delete')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--brand)]">{t('Tambah Sesi Praktik', 'Add a Session')}</h3>
              <button onClick={() => setForm(null)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={L}>{t('Poli', 'Unit')} <span className="text-red-500">*</span></label>
                <select value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} className={I}>
                  <option value="">{t('Pilih poli…', 'Choose a unit…')}</option>
                  {poli.filter(p => p.aktif).map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>

              <div>
                <label className={L}>{t('Dokter', 'Doctor')}</label>
                <select value={form.dokter_email} onChange={e => setForm({ ...form, dokter_email: e.target.value })} className={I}>
                  <option value="">{t('Siapa saja yang bertugas', 'Whoever is on duty')}</option>
                  {dokter.map(d => (
                    <option key={d.email} value={(d.email || '').toLowerCase()}>{d.nama || d.email}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--ink-faint)] mt-1">
                  {t('Boleh dikosongkan. Poli yang dokternya bergantian dijadwalkan per poli saja.',
                     'May be left empty. Units where doctors rotate are scheduled per unit only.')}
                </p>
              </div>

              <div>
                <label className={L}>{t('Hari', 'Days')} <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {HARI.map((h, i) => {
                    const on = form.hari.includes(i)
                    return (
                      <button key={i} type="button"
                        onClick={() => setForm({
                          ...form,
                          hari: on ? form.hari.filter(x => x !== i) : [...form.hari, i],
                        })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs transition ${
                          on ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                             : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'
                        }`}>
                        {h[0].slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={L}>{t('Mulai', 'From')}</label>
                  <input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className={`${I} num`} />
                </div>
                <div>
                  <label className={L}>{t('Selesai', 'To')}</label>
                  <input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className={`${I} num`} />
                </div>
                <div>
                  <label className={L}>{t('Kuota', 'Quota')}</label>
                  <input inputMode="numeric" value={form.kuota}
                    onChange={e => setForm({ ...form, kuota: e.target.value.replace(/[^0-9]/g, '') })}
                    className={`${I} num`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setForm(null)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpan} disabled={sibuk || !form.unit_id || form.hari.length === 0}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
