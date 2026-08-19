'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, FileText, Pill, Stethoscope, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { tanggal, tanggalJam } from '@/lib/format'
import RekamMedis from '@/components/klinik/RekamMedis'

/**
 * Riwayat kunjungan satu pasien, dan pintu ke rekam medis lamanya.
 *
 * Sampai migrasi 0034 pintu ini tidak ada: layar Kunjungan cuma membaca
 * antrean HARI INI, jadi begitu hari berganti rekam medis yang sudah tercatat
 * tidak bisa dibuka lagi oleh siapa pun. Datanya utuh, cuma tidak terjangkau.
 *
 * Isinya sengaja ringkasan. Yang dibutuhkan orang saat menelusuri riwayat
 * adalah kapan, di poli mana, dan diagnosis apa; isi lengkapnya baru diambil
 * kalau satu baris benar-benar dibuka.
 *
 * Kunjungan yang sudah selesai dibuka sebagai BACAAN. Itu bukan keputusan
 * layar ini: `RekamMedis` sudah tahu sendiri, dan database menolak perubahan
 * pada rekam medis yang sudah ditutup sejak migrasi 0018. Koreksi ditulis
 * sebagai adendum supaya catatan aslinya tetap utuh.
 */
export default function RiwayatPasien({
  pasienId, onTutup,
}: {
  pasienId: string
  onTutup: () => void
}) {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const [isi, setIsi] = useState<any>(null)
  const [memuat, setMemuat] = useState(true)
  const [buka, setBuka] = useState<any>(null)

  const muat = async () => {
    const { data, error } = await supabase.rpc('riwayat_pasien', { p_pasien: pasienId })
    if (error) { kabar(pesanError(error), 'galat'); onTutup(); return }
    setIsi(data)
    setMemuat(false)
  }

  useEffect(() => {
    let batal = false
    ;(async () => {
      const { data, error } = await supabase.rpc('riwayat_pasien', { p_pasien: pasienId })
      if (batal) return
      if (error) { kabar(pesanError(error), 'galat'); onTutup(); return }
      setIsi(data)
      setMemuat(false)
    })()
    return () => { batal = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasienId])

  const pasien = isi?.pasien
  const daftar: any[] = isi?.kunjungan ?? []

  const warna = (s: string) =>
    s === 'selesai' ? 'bg-green-100 text-green-700'
    : s === 'batal' ? 'bg-gray-100 text-gray-500'
    : 'bg-amber-100 text-amber-800'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto"
        role="dialog" aria-modal="true">
        <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl my-8">
          <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--line)]">
            <div>
              <h2 className="text-lg font-bold text-[var(--brand)]">
                {t('Riwayat Kunjungan', 'Visit History')}
              </h2>
              {pasien && (
                <p className="text-sm text-[var(--ink-soft)] mt-0.5">
                  {pasien.nama}
                  {pasien.nomor_rm && <span className="num"> · {pasien.nomor_rm}</span>}
                  {pasien.tanggal_lahir && ` · ${tanggal(pasien.tanggal_lahir)}`}
                </p>
              )}
            </div>
            <button onClick={onTutup} className="text-[var(--ink-faint)] hover:text-[var(--ink)]"
              aria-label={t('Tutup', 'Close')}>
              <X size={18} />
            </button>
          </div>

          {/* Alergi diulang di sini, bukan cuma di layar Kunjungan. Orang yang
              sedang membaca riwayat sedang memutuskan terapi. */}
          {pasien?.alergi && (
            <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">{t('Alergi', 'Allergy')}:</span> {pasien.alergi}
              </p>
            </div>
          )}

          <div className="p-6 pt-4">
            {memuat ? (
              <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
            ) : daftar.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--ink-faint)]">
                {t('Pasien ini belum pernah berkunjung.', 'This patient has no visits yet.')}
              </p>
            ) : (
              <div className="space-y-2">
                {daftar.map(k => (
                  <button key={k.id} onClick={() => setBuka(k)}
                    className="w-full text-left rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--ink)]">{tanggal(k.tanggal)}</span>
                      {k.unit_nama && (
                        <span className="text-xs text-[var(--ink-soft)]">{k.unit_nama}</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${warna(k.status)}`}>
                        {k.status.toUpperCase()}
                      </span>
                      {k.nomor && <span className="num text-[11px] text-[var(--ink-faint)] ml-auto">{k.nomor}</span>}
                    </div>

                    {k.diagnosis ? (
                      <p className="text-sm text-[var(--ink)] mt-1.5">
                        <span className="num font-semibold text-[var(--brand)]">{k.diagnosis.kode}</span>
                        {' '}{k.diagnosis.nama}
                        {k.diagnosis.terverifikasi === false && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {t('DI LUAR E-KLAIM', 'OFF-LIST')}
                          </span>
                        )}
                        {k.jumlah_diagnosis > 1 && (
                          <span className="text-xs text-[var(--ink-faint)]">
                            {' '}+{k.jumlah_diagnosis - 1} {t('lagi', 'more')}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--ink-faint)] mt-1.5 italic">
                        {k.keluhan || t('Tanpa diagnosis', 'No diagnosis')}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--ink-faint)]">
                      {k.ada_soap && <span className="inline-flex items-center gap-1"><FileText size={11} /> SOAP</span>}
                      {k.ada_vital && <span className="inline-flex items-center gap-1"><Stethoscope size={11} /> {t('tanda vital', 'vitals')}</span>}
                      {k.jumlah_resep > 0 && <span className="inline-flex items-center gap-1"><Pill size={11} /> {k.jumlah_resep} {t('resep', 'Rx')}</span>}
                      {k.jumlah_adendum > 0 && <span>{k.jumlah_adendum} {t('adendum', 'addenda')}</span>}
                      {k.dokter_email && <span className="ml-auto truncate max-w-[45%]">{k.dokter_email}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {buka && pasien && (
        <RekamMedis
          visitId={buka.id}
          nama={`${pasien.nama}${pasien.nomor_rm ? ` · ${pasien.nomor_rm}` : ''}`}
          alergi={pasien.alergi}
          tertutup={buka.status === 'selesai' || buka.status === 'batal'}
          awal={{
            kesadaran: buka.kesadaran, poli: buka.poli, no_rujukan: buka.no_rujukan,
            status_pulang: buka.status_pulang, jenis_kunjungan: buka.jenis_kunjungan || 'sakit',
          }}
          onTutup={() => setBuka(null)}
          onSimpan={muat} />
      )}
    </>
  )
}
