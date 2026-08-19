'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, KeyRound, Lock, RefreshCw } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { tanggalJam } from '@/lib/format'

/**
 * Kredensial SatuSehat dan BPJS, per faskes.
 *
 * **Layar ini tidak pernah menampilkan kembali rahasia yang sudah dipasang,
 * dan itu bukan kelalaian.** Yang bisa dibaca balik akan dibaca balik, dan
 * yang tampil di layar akan difoto. Database pun tidak menyediakan jalannya:
 * `kredensial_faskes()` hanya mengembalikan metadata, dan satu-satunya fungsi
 * yang mengembalikan rahasianya dicabut dari `authenticated` di migrasi 0055.
 * Kalau kredensialnya hilang, jalannya mengambil yang baru dari portalnya.
 *
 * Yang PUBLIK tetap ditampilkan: `client_id`, `organization_id`, `cons_id`.
 * Itu pengenal, bukan kunci, dan petugas perlu melihatnya untuk memastikan
 * tidak salah tempel antara sandbox dan produksi.
 */

type Baris = {
  sistem: string
  lingkungan: string
  publik: Record<string, string>
  terpasang: boolean
  diperbarui_pada: string | null
  diperbarui_oleh: string | null
}

/**
 * Kolom publik dan rahasia per sistem.
 *
 * Ditulis sebagai daftar, bukan satu kotak teks bebas berisi JSON: yang
 * mengetiknya adalah pemilik klinik, bukan pengembang, dan JSON yang salah
 * satu koma akan ditolak database dengan pesan yang tidak menolong siapa pun.
 */
const BENTUK: Record<string, { nama: string; publik: [string, string][]; rahasia: [string, string][] }> = {
  satusehat: {
    nama: 'SatuSehat',
    publik: [['client_id', 'Client ID'], ['organization_id', 'Organization ID']],
    rahasia: [['client_secret', 'Client Secret']],
  },
  bpjs_pcare: {
    nama: 'BPJS P-Care',
    publik: [['cons_id', 'Cons ID'], ['user_key', 'User Key'], ['username', 'Username'], ['kode_ppk', 'Kode PPK']],
    rahasia: [['secret_key', 'Secret Key'], ['password', 'Password']],
  },
  bpjs_vclaim: {
    nama: 'BPJS VClaim',
    publik: [['cons_id', 'Cons ID'], ['user_key', 'User Key']],
    rahasia: [['secret_key', 'Secret Key']],
  },
}

const SISTEM = ['satusehat', 'bpjs_pcare', 'bpjs_vclaim'] as const

export default function SistemNasional() {
  const { t } = useLang()
  const app = useApp()

  const [daftar, setDaftar] = useState<Baris[]>([])
  const [antrean, setAntrean] = useState<any>(null)
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const [form, setForm] = useState<{ sistem: string; lingkungan: string; isi: Record<string, string> } | null>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    setGalat('')
    const co = app.superViewCompany || null
    const [k, a] = await Promise.all([
      supabase.rpc('kredensial_faskes', { p_company: co }),
      supabase.rpc('ringkas_antrean_kirim', { p_company: co }),
    ])
    if (k.error) setGalat(pesanError(k.error))
    setDaftar(((k.data as Baris[]) || []))
    setAntrean(a.data || null)
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const cari = (sistem: string, lingkungan: string) =>
    daftar.find(x => x.sistem === sistem && x.lingkungan === lingkungan)

  const simpan = async () => {
    if (!form) return
    const b = BENTUK[form.sistem]
    const publik: Record<string, string> = {}
    const rahasia: Record<string, string> = {}
    for (const [k] of b.publik) if (form.isi[k]?.trim()) publik[k] = form.isi[k].trim()
    for (const [k] of b.rahasia) if (form.isi[k]?.trim()) rahasia[k] = form.isi[k].trim()

    setSibuk(true)
    const { error } = await supabase.rpc('simpan_kredensial', {
      p_sistem: form.sistem,
      p_lingkungan: form.lingkungan,
      p_publik: publik,
      // Yang tidak diisi tidak dikirim, dan yang tidak dikirim tidak diubah.
      // Itu yang membuat memperbaiki satu Organization ID yang salah ketik
      // tidak menuntut mengetik ulang client secret yang panjang.
      p_rahasia: Object.keys(rahasia).length > 0 ? rahasia : null,
      p_company: app.superViewCompany || null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    setForm(null)
    muat()
  }

  const I = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const L = 'text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2 mb-1">
          <KeyRound size={18} /> {t('Kredensial Sistem Nasional', 'National System Credentials')}
        </h3>
        <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
          {t('Kredensial ini diberikan per faskes, bukan per vendor: klinik ini mendaftar sendiri ke SatuSehat dan BPJS dan menerima kuncinya sendiri. Yang rahasia disimpan terenkripsi dan TIDAK pernah ditampilkan kembali di layar mana pun, termasuk untuk yang memasangnya. Kalau hilang, ambil yang baru dari portalnya.',
             'These credentials are issued per facility, not per vendor: this clinic registers with SatuSehat and BPJS itself and receives its own keys. Secrets are stored encrypted and are NEVER shown again on any screen, not even to whoever entered them. If lost, get new ones from the portal.')}
        </p>
      </div>

      {galat && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{galat}</p>
      )}

      {memuat ? (
        <p className="text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
      ) : (
        <div className="space-y-4">
          {SISTEM.map(s => (
            <div key={s} className="border border-[var(--line)] rounded-xl p-4">
              <p className="text-sm font-semibold text-[var(--ink)] mb-3">{BENTUK[s].nama}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['sandbox', 'produksi'] as const).map(lg => {
                  const row = cari(s, lg)
                  return (
                    <div key={lg} className="border border-[var(--line-soft)] rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                          {lg === 'sandbox' ? t('Sandbox', 'Sandbox') : t('Produksi', 'Production')}
                        </span>
                        {row?.terpasang ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                            <Lock size={10} /> {t('TERPASANG', 'CONFIGURED')}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-2)] text-[var(--ink-faint)]">
                            {t('BELUM', 'NOT SET')}
                          </span>
                        )}
                      </div>

                      {row && Object.keys(row.publik || {}).length > 0 && (
                        <div className="space-y-0.5 mb-2">
                          {BENTUK[s].publik.map(([k, label]) => row.publik?.[k] && (
                            <p key={k} className="text-[11px] text-[var(--ink-faint)] truncate">
                              {label}: <span className="num text-[var(--ink-soft)]">{row.publik[k]}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {row?.diperbarui_pada && (
                        <p className="text-[10px] text-[var(--ink-faint)] mb-2">
                          {t('Diperbarui', 'Updated')} {tanggalJam(row.diperbarui_pada)}
                          {row.diperbarui_oleh ? ` · ${row.diperbarui_oleh}` : ''}
                        </p>
                      )}

                      <button
                        onClick={() => setForm({ sistem: s, lingkungan: lg, isi: { ...(row?.publik || {}) } })}
                        className="text-xs font-semibold text-[var(--brand)] hover:underline underline-offset-4">
                        {row?.terpasang ? t('Ganti', 'Replace') : t('Pasang', 'Set up')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Antrean kirim. Angka yang paling berguna bukan "berapa yang antre",
          melainkan "yang tertua sejak kapan": antrean sepuluh baris itu wajar,
          sepuluh baris yang tertuanya sejak tiga hari lalu berarti pengirimnya
          berhenti dan tidak ada yang tahu. */}
      <div className="border border-[var(--line)] rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-sm font-semibold text-[var(--ink)]">{t('Antrean kirim', 'Send queue')}</h4>
          <button onClick={muat} disabled={memuat}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-50">
            <RefreshCw size={12} /> {t('Segarkan', 'Refresh')}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['antre', t('Menunggu kirim', 'Waiting')],
            ['terkirim', t('Terkirim', 'Sent')],
            ['pernah_gagal', t('Pernah gagal', 'Retrying')],
            ['ditinggalkan', t('Ditinggalkan', 'Given up')],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <p className="text-[11px] text-[var(--ink-faint)] uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-bold num leading-none mt-0.5 ${
                k === 'ditinggalkan' && Number(antrean?.[k] || 0) > 0 ? 'text-red-700' : 'text-[var(--ink)]'
              }`}>{Number(antrean?.[k] || 0)}</p>
            </div>
          ))}
        </div>

        {antrean?.tertua_antre && (
          <p className="text-[11px] text-[var(--ink-faint)] mt-3">
            {t('Yang tertua menunggu sejak', 'Oldest waiting since')} {tanggalJam(antrean.tertua_antre)}
          </p>
        )}

        <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {t('Pengirimannya belum dinyalakan. Bentuk kiriman FHIR harus dicocokkan ke dokumen resmi yang berlaku saat kredensialnya sudah ada, bukan dari ingatan, jadi antrean ini sengaja masih kosong. Yang sudah siap: tempat menyimpan kredensial dan mesin antreannya.',
             'Sending is not switched on yet. The FHIR payload shape must be checked against the official docs current at the time the credentials exist, not from memory, so this queue is deliberately still empty. What is ready: credential storage and the queue machinery.')}
        </p>
      </div>

      {form && (
        <Portal>
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--brand)] mb-1">
              {BENTUK[form.sistem].nama} · {form.lingkungan === 'sandbox' ? t('Sandbox', 'Sandbox') : t('Produksi', 'Production')}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
              {t('Kolom rahasia yang dikosongkan tidak mengubah apa pun, jadi memperbaiki satu pengenal yang salah ketik tidak menuntut mengetik ulang kuncinya.',
                 'Secret fields left empty change nothing, so fixing one mistyped identifier does not require retyping the key.')}
            </p>

            <div className="space-y-3">
              {BENTUK[form.sistem].publik.map(([k, label]) => (
                <div key={k}>
                  <label className={L}>{label}</label>
                  <input value={form.isi[k] || ''}
                    onChange={e => setForm({ ...form, isi: { ...form.isi, [k]: e.target.value } })}
                    className={`${I} num`} />
                </div>
              ))}

              <div className="pt-1 border-t border-[var(--line-soft)]">
                <p className="text-[11px] text-[var(--ink-faint)] mt-3 mb-2 flex items-center gap-1.5">
                  <Lock size={11} /> {t('Disimpan terenkripsi. Tidak akan pernah ditampilkan kembali.',
                                        'Stored encrypted. Will never be shown again.')}
                </p>
                {BENTUK[form.sistem].rahasia.map(([k, label]) => (
                  <div key={k} className="mb-3">
                    <label className={L}>{label}</label>
                    <input type="password" autoComplete="off" value={form.isi[k] || ''}
                      onChange={e => setForm({ ...form, isi: { ...form.isi, [k]: e.target.value } })}
                      placeholder={cari(form.sistem, form.lingkungan)?.terpasang
                        ? t('Kosongkan kalau tidak diganti', 'Leave empty to keep')
                        : ''}
                      className={`${I} num`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setForm(null)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpan} disabled={sibuk}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                <Check size={15} /> {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
