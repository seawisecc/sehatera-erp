'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TH_R, TR } from '@/lib/ui'
import { rupiah, tanggal, tanggalInput } from '@/lib/format'
import JejakAudit from '@/components/JejakAudit'
import Tagihan from '@/components/klien/Tagihan'
import EditorPaket from '@/components/klien/EditorPaket'

/**
 * Klien: daftar faskes yang berlangganan. Hanya untuk super admin.
 *
 * Daftar `companies` sendiri TIDAK diambil di sini, melainkan dari
 * `app-context`: pemilih faskes di topbar memakai daftar yang sama, dan dua
 * pengambilan terpisah berarti setelah satu apotek ditangguhkan di halaman ini,
 * pemilih di atas masih menampilkannya sebagai aktif.
 */

type Status = 'active' | 'trial' | 'suspended' | 'inactive'

export default function HalamanKlien() {
  const { t } = useLang()
  const app = useApp()

  const [plans, setPlans] = useState<any[]>([])
  const [cari, setCari] = useState('')
  const [saring, setSaring] = useState<'semua' | Status>('semua')

  const [edit, setEdit] = useState<any>(null)
  const [tanggalAktif, setTanggalAktif] = useState('')
  const [paket, setPaket] = useState('')
  const [simpanan, setSimpanan] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [sektor, setSektor] = useState('apotek')
  const [tab, setTab] = useState<'daftar' | 'tagihan' | 'paket' | 'jejak'>('daftar')

  // Paket dibaca dari database, bukan dihard-code: harga dan batasnya memang
  // dirancang bisa diubah tanpa deploy ulang.
  useEffect(() => {
    if (!app.isSuper) return
    supabase.from('plans').select('*').order('sort_order').then(({ data }) => setPlans(data || []))
  }, [app.isSuper])

  useEffect(() => {
    if (!edit) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setEdit(null) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [edit])

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return app.companies.filter((c: any) => {
      if (saring !== 'semua' && c.status !== saring) return false
      if (!q) return true
      return [c.nama, c.slug, c.admin_nama, c.admin_email]
        .some((v: string) => (v || '').toLowerCase().includes(q))
    })
  }, [app.companies, cari, saring])

  /**
   * Tanggal yang berlaku ditentukan STATUS, sama persis dengan
   * company_lapsed_at() di database. Membaca kolom yang salah di sini berarti
   * admin memperpanjang faskes yang belum perlu, dan melewatkan yang perlu.
   */
  const batasAktif = (c: any): string | null =>
    c.status === 'trial' ? c.trial_ends_at : c.subscription_ends_at

  /**
   * Menangguhkan atau mengaktifkan apotek.
   *
   * Lewat `set_company_status()`, bukan UPDATE langsung dari peramban.
   * Alasannya bukan kerapian: ini tindakan yang MEMATIKAN kasir sebuah apotek
   * yang mungkin sedang buka, dan riwayat siapa melakukannya kapan harus ada
   * tanpa bergantung pada peramban ingat mencatatnya.
   */
  const ubahStatus = async (c: any) => {
    const next = c.status === 'suspended' ? 'active' : 'suspended'
    const aksi = next === 'active' ? t('Aktifkan', 'Activate') : t('Tangguhkan', 'Suspend')
    const ingat = next === 'suspended'
      ? t('\n\nKasir apotek ini langsung berhenti bisa menjual.',
           '\n\nThis pharmacy cashier stops being able to sell immediately.')
      : ''
    if (!confirm(`${aksi} ${t('faskes', 'facility')} "${c.nama}"?${ingat}`)) return
    setSibuk(true)
    const { error } = await supabase.rpc('set_company_status', { p_company: c.id, p_status: next })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    app.muatCompanies()
  }

  /**
   * Memperpanjang masa aktif dan mengubah paket.
   *
   * Status ikut berpindah ke 'active', dan itu dikerjakan di dalam fungsinya.
   * Keduanya harus bergerak bersama: faskes yang statusnya masih 'trial' dibaca
   * dari `trial_ends_at`, jadi memperpanjang tanpa memindahkan status berarti
   * tanggal barunya tidak dilihat siapa pun (lihat company_lapsed_at,
   * migrasi 0003).
   */
  const simpan = async (tanpaBatas: boolean) => {
    if (!edit) return
    setSimpanan(true)
    const { error } = await supabase.rpc('set_company_plan', {
      p_company: edit.id,
      p_plan: paket || null,
      p_sampai: tanpaBatas ? null : (tanggalAktif || null),
      p_tanpa_batas: tanpaBatas,
    })
    if (error) { setSimpanan(false); alert(pesanError(error)); return }

    if (sektor !== (edit.sektor || 'apotek')) {
      const { error: eSektor } = await supabase.rpc('set_company_sektor', {
        p_company: edit.id, p_sektor: sektor,
      })
      if (eSektor) { setSimpanan(false); alert(pesanError(eSektor)); return }
    }
    setSimpanan(false)
    setEdit(null)
    app.muatCompanies()
  }

  const LENCANA: Record<string, [string, string]> = {
    active:    ['bg-green-100 text-green-800', t('Aktif', 'Active')],
    trial:     ['bg-amber-100 text-amber-800', t('Masa coba', 'Trial')],
    suspended: ['bg-red-100 text-red-800',     t('Ditangguhkan', 'Suspended')],
    inactive:  ['bg-gray-100 text-gray-600',   t('Nonaktif', 'Inactive')],
  }

  const hitung = (s: Status) => app.companies.filter((c: any) => c.status === s).length
  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  if (!app.isSuper) {
    return <p className="text-[var(--ink-faint)] text-sm">{t('Halaman ini hanya untuk super admin.', 'This page is for super admins only.')}</p>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Klien', 'Clients')}</h1>
        <p className="text-[var(--ink-soft)] text-sm">
          {app.companies.length} {t('faskes terdaftar', 'registered facilities')}
          {' · '}{hitung('active')} {t('aktif', 'active')}
          {' · '}{hitung('trial')} {t('masa coba', 'on trial')}
          {' · '}{hitung('suspended')} {t('ditangguhkan', 'suspended')}
        </p>
      </div>

      <div className="flex gap-1 mb-5">
        {([
          { id: 'daftar',  label: t('Daftar Klien', 'Client List') },
          { id: 'tagihan', label: t('Tagihan', 'Invoices') },
          { id: 'paket',   label: t('Paket', 'Plans') },
          { id: 'jejak',   label: t('Jejak Audit', 'Audit Trail') },
        ] as const).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === x.id ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface)]/60'}`}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'tagihan' && <Tagihan />}
      {tab === 'paket' && <EditorPaket />}
      {tab === 'jejak' && <JejakAudit tampilkanFaskes />}

      {tab === 'daftar' && (<>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={cari}
          onChange={e => setCari(e.target.value)}
          placeholder={t('Cari nama, slug, atau email admin…', 'Search name, slug, or admin email…')}
          className={inputCls + ' max-w-sm'}
        />
        <div className="flex items-center gap-1">
          {(['semua', 'active', 'trial', 'suspended', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSaring(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                saring === s
                  ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]'
                  : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {s === 'semua' ? t('Semua', 'All') : LENCANA[s][1]}
            </button>
          ))}
        </div>
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Faskes', 'Facility')}</th>
              <th className={TH_L}>Admin</th>
              <th className={TH_L}>{t('Paket', 'Plan')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_L}>{t('Aktif Sampai', 'Active Until')}</th>
              <th className={TH_R}></th>
            </tr>
          </thead>
          <tbody>
            {daftar.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--ink-faint)] text-sm">
                {app.companies.length === 0
                  ? t('Belum ada faskes yang mendaftar.', 'No facilities have registered yet.')
                  : t('Tidak ada yang cocok dengan saringan ini.', 'Nothing matches this filter.')}
              </td></tr>
            ) : daftar.map((c: any) => {
              const iso = batasAktif(c)
              const lewat = iso ? new Date(iso) <= new Date() : false
              const [cls, label] = LENCANA[c.status] || LENCANA.inactive
              return (
                <tr key={c.id} className={TR}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--ink)]">{c.nama}</p>
                    <p className="text-xs text-[var(--ink-faint)] num">{c.slug || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--ink)]">{c.admin_nama || '-'}</p>
                    <p className="text-xs text-[var(--ink-faint)]">{c.admin_email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--ink)]">
                      {c.plans?.name || <span className="text-[var(--ink-faint)]">{t('Belum berpaket', 'No plan')}</span>}
                    </p>
                    {c.plans?.price_monthly ? (
                      <p className="text-xs text-[var(--ink-faint)] num">
                        {rupiah(c.plans.price_monthly)}/{t('bln', 'mo')}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] num">
                    {!iso
                      ? <span className="text-[var(--ink-faint)]">{t('Tanpa batas', 'Unlimited')}</span>
                      : <span className={lewat ? 'text-red-600 font-medium' : ''}>{tanggal(iso)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => ubahStatus(c)}
                        disabled={sibuk}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          c.status === 'suspended'
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-[var(--line)] text-[var(--accent)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        {c.status === 'suspended' ? t('Aktifkan', 'Activate') : t('Tangguhkan', 'Suspend')}
                      </button>
                      <button
                        onClick={() => {
                          setTanggalAktif(tanggalInput(batasAktif(c)))
                          setPaket(c.plan_id || '')
                          setSektor(c.sektor || 'apotek')
                          setEdit(c)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)] transition whitespace-nowrap"
                      >
                        {t('Paket & Masa Aktif', 'Plan & Validity')}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </>)}

      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-1">{t('Paket & Masa Aktif', 'Plan & Validity')}</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4">{edit.nama}</p>

            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Paket', 'Plan')}</label>
            <select value={paket} onChange={e => setPaket(e.target.value)} className={inputCls + ' mb-3'}>
              <option value="">{t('(tidak diubah)', '(unchanged)')}</option>
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}: {rupiah(p.price_monthly)}/{t('bln', 'mo')}
                </option>
              ))}
            </select>

            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Jenis fasilitas', 'Facility type')}</label>
            <select value={sektor} onChange={e => setSektor(e.target.value)} className={inputCls + ' mb-1'}>
              <option value="apotek">{t('Apotek', 'Pharmacy')}</option>
              <option value="klinik">{t('Klinik', 'Clinic')}</option>
              <option value="rumah_sakit">{t('Rumah Sakit', 'Hospital')}</option>
            </select>
            <p className="text-[11px] text-[var(--ink-faint)] mb-3 leading-relaxed">
              {t('Menentukan menu mana yang ADA di aplikasi faskes ini, terpisah dari paket yang menentukan menu mana yang dibuka.',
                 'Determines which menus EXIST for this facility, separate from the plan that determines which are unlocked.')}
            </p>

            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Aktif sampai', 'Active until')}</label>
            <input type="date" value={tanggalAktif} onChange={e => setTanggalAktif(e.target.value)} className={inputCls} />
            <button onClick={() => simpan(true)} disabled={simpanan}
              className="mt-2 text-xs text-[var(--brand)] font-medium hover:underline disabled:opacity-50">
              {t('Set tanpa batas', 'Set unlimited')}
            </button>

            <p className="text-[11px] text-[var(--ink-faint)] mt-3 leading-relaxed">
              {t('Menyimpan juga memindahkan faskes ini dari masa coba ke berlangganan, dan perubahannya dicatat di riwayat langganan.',
                 'Saving also moves this facility from trial to paid, and the change is written to the subscription history.')}
            </p>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setEdit(null)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={() => simpan(false)} disabled={simpanan}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {simpanan ? t('Menyimpan…', 'Saving…') : t('Simpan & Aktifkan', 'Save & Activate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
