'use client'

import { useEffect, useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { rupiah, angka } from '@/lib/format'
import { readPlanFeatures } from '@/lib/plan'

/**
 * Daftar paket langganan, dibaca dari database.
 *
 * Ini menggantikan harga yang dulu ditulis langsung di halaman `/kenapa`:
 * Rp 216.000/bulan dan Rp 2.160.000/tahun, angka yang TIDAK ADA di tabel
 * `plans` dan tidak pernah ditagihkan. Siapa pun yang membacanya lalu
 * mendaftar akan menemukan harga yang sama sekali lain begitu masuk. Sekarang
 * satu sumber: kalau harga diubah di Super Admin, halaman ini ikut berubah
 * tanpa deploy.
 *
 * Paket dengan `is_public = false` sengaja tidak muncul. Itu yang menahan
 * paket Klinik, yang harganya masih usulan dan belum diketok: lebih baik tidak
 * terlihat daripada terlihat salah.
 */

type Paket = {
  id: string
  code: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  max_outlets: number | null
  max_users: number | null
  max_products: number | null
  features: unknown
}

export default function DaftarPaket({ nada = 'terang' }: { nada?: 'terang' | 'gelap' }) {
  const { t } = useLang()
  const [paket, setPaket] = useState<Paket[] | null>(null)
  const [tahunan, setTahunan] = useState(false)

  useEffect(() => {
    supabase.from('plans')
      .select('id,code,name,description,price_monthly,price_yearly,max_outlets,max_users,max_products,features')
      .eq('is_public', true)
      .order('sort_order')
      .then(({ data }) => setPaket((data as Paket[]) || []))
  }, [])

  const gelap = nada === 'gelap'
  const kartu = gelap
    ? 'bg-white/[0.06] border border-white/10 text-white'
    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]'
  const kartuUtama = gelap
    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xl border border-transparent'
    : 'bg-[var(--surface)] text-[var(--ink)] shadow-xl border-2 border-[var(--brand)]'
  const redup = gelap ? 'text-[var(--on-brand-soft)]' : 'text-[var(--ink-soft)]'

  if (paket === null) {
    return <p className={`text-sm text-center py-10 ${redup}`}>{t('Memuat paket…', 'Loading plans…')}</p>
  }
  if (paket.length === 0) {
    return <p className={`text-sm text-center py-10 ${redup}`}>{t('Paket belum tersedia.', 'Plans are not available yet.')}</p>
  }

  // Paket tengah dipakai sebagai anjuran. Bukan karena paling menguntungkan,
  // tapi karena batasnya yang paling sering cocok untuk apotek yang sudah
  // punya lebih dari satu orang di belakang meja.
  const iUtama = paket.length >= 3 ? 1 : 0

  const batas = (n: number | null, satuan: string) =>
    n === null ? t('tanpa batas', 'unlimited') : `${angka(n)} ${satuan}`

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className={`inline-flex rounded-xl p-1 text-sm font-medium ${gelap ? 'bg-white/10' : 'bg-[var(--surface-2)]'}`}>
          {([false, true] as const).map(v => (
            <button key={String(v)} onClick={() => setTahunan(v)}
              className={`px-4 py-1.5 rounded-lg transition ${
                tahunan === v
                  ? (gelap ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--surface)] text-[var(--brand)] shadow-sm')
                  : (gelap ? 'text-[var(--on-brand-soft)]' : 'text-[var(--ink-soft)]')
              }`}>
              {v ? t('Tahunan', 'Yearly') : t('Bulanan', 'Monthly')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 text-left">
        {paket.map((p, i) => {
          const f = readPlanFeatures(p.features)
          const harga = tahunan ? (p.price_yearly ?? p.price_monthly * 12) : p.price_monthly
          const per = tahunan ? t('/tahun', '/year') : t('/bulan', '/month')
          // Diskon tahunan dihitung dari angkanya sendiri, bukan ditulis
          // tangan: kalau harga diubah di Super Admin dan diskonnya ditulis
          // tetap, halaman ini akan menjanjikan potongan yang tidak diberikan.
          const setahunPenuh = p.price_monthly * 12
          const hemat = tahunan && p.price_yearly && p.price_yearly < setahunPenuh
            ? setahunPenuh - p.price_yearly : 0

          const isi: [string, boolean | string][] = [
            [t('Item obat', 'Drug items'), batas(p.max_products, t('item', 'items'))],
            [t('Pengguna', 'Users'), batas(p.max_users, t('orang', 'people'))],
            [t('Cabang', 'Outlets'), batas(p.max_outlets, t('cabang', 'outlets'))],
            [t('Laporan lengkap', 'Full reports'), f.reports === 'full'],
            [t('Pembelian & faktur lengkap', 'Full purchasing & invoices'), f.purchasing === 'full'],
            [t('Riwayat pasien', 'Patient history'), f.crm === 'full'],
            ['API', f.api],
            [t('Modul klinik', 'Clinic module'), f.klinik],
            [t('Bantuan', 'Support'), f.support === 'dedicated' ? t('Pendampingan khusus', 'Dedicated')
              : f.support === 'whatsapp' ? 'WhatsApp' : 'Email'],
          ]

          return (
            <div key={p.id} className={`relative rounded-2xl p-6 flex flex-col ${i === iUtama ? kartuUtama : kartu}`}>
              {i === iUtama && (
                <span className="absolute -top-3 left-6 bg-[var(--accent)] text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                  {t('Paling sering dipakai', 'Most chosen')}
                </span>
              )}
              <p className="text-sm font-semibold uppercase tracking-wide opacity-70">{p.name}</p>
              <p className="text-3xl font-bold mt-2 num">
                {rupiah(harga)}
                <span className="text-base font-medium opacity-60">{per}</span>
              </p>
              {hemat > 0 && (
                <p className="text-xs font-medium text-[var(--accent)] mt-1 num">
                  {t('hemat', 'save')} {rupiah(hemat)} {t('setahun', 'a year')}
                </p>
              )}
              {p.description && <p className="text-sm opacity-70 mt-2 leading-relaxed">{p.description}</p>}

              <div className="mt-5 space-y-2 flex-1">
                {isi.map(([label, nilai], j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    {typeof nilai === 'boolean' ? (
                      nilai
                        ? <Check size={15} className="mt-0.5 shrink-0 text-[var(--brand-soft)]" />
                        : <Minus size={15} className="mt-0.5 shrink-0 opacity-30" />
                    ) : (
                      <Check size={15} className="mt-0.5 shrink-0 text-[var(--brand-soft)]" />
                    )}
                    <span className={typeof nilai === 'boolean' && !nilai ? 'opacity-40' : ''}>
                      {label}
                      {typeof nilai === 'string' && <span className="opacity-60"> · <span className="num">{nilai}</span></span>}
                    </span>
                  </div>
                ))}
              </div>

              <a href="/"
                className={`mt-6 block text-center px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  i === iUtama
                    ? 'bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]'
                    : gelap ? 'border border-white/20 hover:bg-white/10' : 'border border-[var(--line)] hover:bg-[var(--surface-2)]'
                }`}>
                {t('Mulai masa coba 14 hari', 'Start the 14-day trial')}
              </a>
            </div>
          )
        })}
      </div>

      <p className={`text-xs mt-6 text-center leading-relaxed ${redup}`}>
        {t('Masa coba 14 hari, tanpa kartu kredit. Turun paket tidak menghapus data apa pun; yang berubah hanya batas penambahan.',
           'A 14-day trial, no credit card. Downgrading deletes nothing; only the limit on adding changes.')}
      </p>
    </div>
  )
}
