'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR } from '@/lib/ui'
import { rupiah, tanggal } from '@/lib/format'

/**
 * Buku tagihan langganan.
 *
 * Sampai sekarang berlangganan cuma dua tanggal di tabel apotek: siapa
 * membayar berapa untuk periode mana tidak pernah tercatat di mana pun. Untuk
 * dua apotek itu bisa diingat kepala; untuk dua puluh tidak, dan pertanyaan
 * "siapa yang belum bayar bulan ini" jadi tidak bisa dijawab tanpa membuka
 * WhatsApp satu per satu.
 *
 * Menandai lunas TIDAK dilakukan dari sini, melainkan lewat `lunasi_tagihan()`
 * yang idempoten. Alasannya sama dengan yang akan berlaku untuk gateway nanti:
 * menekan tombol dua kali karena halaman terasa lambat tidak boleh
 * memperpanjang langganan dua kali.
 */

const WARNA: Record<string, string> = {
  belum_bayar: 'bg-amber-100 text-amber-800',
  lunas:       'bg-green-100 text-green-800',
  dibatalkan:  'bg-gray-100 text-gray-500',
}

export default function Tagihan() {
  const { t } = useLang()
  const app = useApp()

  const [baris, setBaris] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [saring, setSaring] = useState<'semua' | 'belum_bayar' | 'lunas'>('belum_bayar')
  const [terbit, setTerbit] = useState<{ company: string; siklus: 'bulanan' | 'tahunan' } | null>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data } = await app.scope(
      supabase.from('billing_invoices')
        .select('*, companies(nama), plans(name)')
        .order('periode_mulai', { ascending: false })
        .limit(300)
    )
    setBaris(data || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const tersaring = useMemo(
    () => saring === 'semua' ? baris : baris.filter(b => b.status === saring),
    [baris, saring])

  const belum = baris.filter(b => b.status === 'belum_bayar')
  const totalBelum = belum.reduce((a, b) => a + (b.jumlah || 0), 0)

  const terbitkan = async () => {
    if (!terbit?.company) { alert(t('Pilih faskes dulu.', 'Choose a facility first.')); return }
    setSibuk(true)
    const { data, error } = await supabase.rpc('terbitkan_tagihan', {
      p_company: terbit.company,
      p_siklus: terbit.siklus,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setTerbit(null)
    muat()
    alert(`${t('Tagihan', 'Invoice')} ${(data as any)?.nomor} ${t('diterbitkan.', 'issued.')}`)
  }

  const lunasi = async (b: any) => {
    const metode = prompt(t('Dibayar lewat apa? (transfer, tunai, QRIS)', 'Paid by what? (transfer, cash, QRIS)'), 'transfer')
    if (metode === null) return
    const referensi = prompt(t('Nomor referensi atau bukti transfer (boleh kosong)', 'Reference or transfer proof number (optional)'), '') ?? ''
    setSibuk(true)
    const { error } = await supabase.rpc('lunasi_tagihan', {
      p_invoice: b.id, p_metode: metode, p_referensi: referensi,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
    app.muatCompanies()
  }

  const batalkan = async (b: any) => {
    const alasan = prompt(t(`Batalkan tagihan ${b.nomor}? Tulis alasannya.`, `Cancel invoice ${b.nomor}? Write the reason.`), '')
    if (alasan === null) return
    setSibuk(true)
    const { error } = await supabase.rpc('batalkan_tagihan', { p_invoice: b.id, p_alasan: alasan })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const inputCls = 'border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1">
          {(['belum_bayar', 'lunas', 'semua'] as const).map(s => (
            <button key={s} onClick={() => setSaring(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                saring === s
                  ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]'
                  : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'
              }`}>
              {s === 'belum_bayar' ? t('Belum bayar', 'Unpaid') : s === 'lunas' ? t('Lunas', 'Paid') : t('Semua', 'All')}
            </button>
          ))}
        </div>
        <button onClick={() => setTerbit({ company: app.superViewCompany || '', siklus: 'bulanan' })}
          className="bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
          + {t('Terbitkan Tagihan', 'Issue Invoice')}
        </button>
      </div>

      {belum.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <b className="num">{belum.length}</b> {t('tagihan belum dibayar, total', 'unpaid invoices, totalling')}{' '}
          <b className="num">{rupiah(totalBelum)}</b>.
        </div>
      )}

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>No.</th>
              <th className={TH_L}>{t('Faskes', 'Facility')}</th>
              <th className={TH_L}>{t('Paket', 'Plan')}</th>
              <th className={TH_L}>{t('Periode', 'Period')}</th>
              <th className={TH_R}>{t('Jumlah', 'Amount')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : tersaring.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--ink-faint)] text-sm">
                {baris.length === 0
                  ? t('Belum ada tagihan. Terbitkan yang pertama lewat tombol di atas.', 'No invoices yet. Issue the first one with the button above.')
                  : t('Tidak ada yang cocok dengan saringan ini.', 'Nothing matches this filter.')}
              </td></tr>
            ) : tersaring.map((b: any) => (
              <tr key={b.id} className={TR}>
                <td className="px-4 py-3 num text-xs text-[var(--brand)] font-medium">{b.nomor || '-'}</td>
                <td className="px-4 py-3 text-[var(--ink)]">{b.companies?.nama || '-'}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)] text-xs">
                  {b.plans?.name || '-'} · {b.siklus}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)] text-xs num">
                  {tanggal(b.periode_mulai)} &rarr; {tanggal(b.periode_selesai)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-[var(--ink)] num">{rupiah(b.jumlah)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${WARNA[b.status] || ''}`}>
                    {b.status === 'belum_bayar' ? t('Belum bayar', 'Unpaid')
                      : b.status === 'lunas' ? t('Lunas', 'Paid') : t('Dibatalkan', 'Cancelled')}
                  </span>
                  {b.status === 'lunas' && b.dibayar_pada && (
                    <p className="text-[10px] text-[var(--ink-faint)] mt-0.5 num">{tanggal(b.dibayar_pada)}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {b.status === 'belum_bayar' ? (
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <button onClick={() => lunasi(b)} disabled={sibuk}
                        className="px-2.5 py-1 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-xs font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                        {t('Tandai Lunas', 'Mark Paid')}
                      </button>
                      <button onClick={() => batalkan(b)} disabled={sibuk}
                        className="px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-medium hover:bg-[var(--surface-2)] transition">
                        {t('Batal', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--ink-faint)]">{b.referensi || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--ink-faint)] mt-3 leading-relaxed">
        {t('Menandai lunas juga memajukan masa aktif apoteknya sampai akhir periode yang dibayar, dan itu terjadi dalam satu transaksi database. Menekannya dua kali tidak memperpanjang dua kali.',
           'Marking an invoice paid also extends the pharmacy validity to the end of the paid period, in one database transaction. Pressing it twice does not extend it twice.')}
      </p>

      {terbit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">{t('Terbitkan Tagihan', 'Issue Invoice')}</h2>

            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Faskes', 'Facility')}</label>
            <select value={terbit.company} onChange={e => setTerbit({ ...terbit, company: e.target.value })}
              className={inputCls + ' w-full mb-3'}>
              <option value="">{t('-- Pilih Faskes --', '-- Choose Facility --')}</option>
              {app.companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>

            <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Siklus', 'Cycle')}</label>
            <select value={terbit.siklus} onChange={e => setTerbit({ ...terbit, siklus: e.target.value as 'bulanan' | 'tahunan' })}
              className={inputCls + ' w-full'}>
              <option value="bulanan">{t('Bulanan', 'Monthly')}</option>
              <option value="tahunan">{t('Tahunan', 'Yearly')}</option>
            </select>

            <p className="text-[11px] text-[var(--ink-faint)] mt-3 leading-relaxed">
              {t('Nominalnya diambil dari paket yang sedang dipakai faskes itu. Periodenya dimulai dari akhir masa aktif yang sekarang, bukan dari hari ini, supaya yang membayar lebih awal tidak kehilangan sisa harinya.',
                 'The amount comes from the facility current plan. The period starts at the end of the current validity, not today, so paying early does not forfeit the remaining days.')}
            </p>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setTerbit(null)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={terbitkan} disabled={sibuk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menerbitkan…', 'Issuing…') : t('Terbitkan', 'Issue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
