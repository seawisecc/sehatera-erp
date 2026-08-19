'use client'

import { useEffect } from 'react'
import { AlertTriangle, History, Pencil, Phone, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { useLang } from '@/lib/i18n'
import { tanggal } from '@/lib/format'
import type { Pasien } from '@/components/klinik/FormPasien'

/**
 * Melihat data pasien tanpa membuka formulirnya.
 *
 * Dulu satu-satunya cara melihat identitas pasien adalah menekan namanya, yang
 * membuka formulir ubah. Artinya membaca dan mengubah adalah tindakan yang
 * sama, dan setiap kali seseorang cuma ingin memastikan nomor teleponnya, ia
 * berada satu ketikan dari mengubah tanggal lahir orang tanpa sadar.
 *
 * Yang kosong TETAP ditampilkan sebagai "belum diisi", tidak disembunyikan.
 * Baris yang hilang terbaca sebagai "tidak ada informasinya", sedangkan yang
 * dibutuhkan justru sebaliknya: tahu bahwa ada yang belum dilengkapi.
 */

const KELAMIN: Record<string, [string, string]> = { L: ['Laki-laki', 'Male'], P: ['Perempuan', 'Female'] }
const KAWIN: Record<string, [string, string]> = {
  belum_kawin: ['Belum kawin', 'Single'], kawin: ['Kawin', 'Married'],
  cerai_hidup: ['Cerai hidup', 'Divorced'], cerai_mati: ['Cerai mati', 'Widowed'],
}

export default function DetailPasien({
  pasien, onTutup, onUbah, onRiwayat, bolehUbah, bolehRiwayat,
}: {
  pasien: Pasien
  onTutup: () => void
  onUbah: () => void
  onRiwayat: () => void
  bolehUbah: boolean
  bolehRiwayat: boolean
}) {
  const { t, lang } = useLang()

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const umur = (() => {
    if (!pasien.tanggal_lahir) return null
    const l = new Date(pasien.tanggal_lahir)
    let u = new Date().getFullYear() - l.getFullYear()
    const m = new Date().getMonth() - l.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < l.getDate())) u--
    return u
  })()

  const kosong = <span className="text-[var(--ink-faint)] italic">{t('belum diisi', 'not filled in')}</span>
  const B = ({ label, nilai, num }: { label: string; nilai?: string | null; num?: boolean }) => (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</p>
      <p className={`text-sm text-[var(--ink)] ${num ? 'num' : ''}`}>{nilai || kosong}</p>
    </div>
  )
  const judul = 'text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-soft)] mb-2 pb-1 border-b border-[var(--line-soft)]'

  const alamatLengkap = [
    pasien.alamat,
    pasien.rt || pasien.rw ? `RT ${pasien.rt || '-'} / RW ${pasien.rw || '-'}` : null,
    pasien.kelurahan, pasien.kecamatan, pasien.kota, pasien.provinsi, pasien.kode_pos,
  ].filter(Boolean).join(', ')

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--surface)] px-6 pt-6 pb-4 border-b border-[var(--line-soft)] z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[var(--ink)] truncate">{pasien.nama}</h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                <span className="num text-[var(--brand)] font-medium">{pasien.nomor_rm || '-'}</span>
                {pasien.jenis_kelamin && <> · {KELAMIN[pasien.jenis_kelamin]?.[lang === 'en' ? 1 : 0]}</>}
                {umur !== null && <> · <span className="num">{umur}</span> {t('th', 'y')}</>}
              </p>
            </div>
            <button onClick={onTutup} className="shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
              <X size={18} />
            </button>
          </div>

          {pasien.alergi && (
            <p className="mt-3 flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span><strong>{t('Alergi:', 'Allergies:')}</strong> {pasien.alergi}</span>
            </p>
          )}

          {pasien.identitas_belum_lengkap && (
            <p className="mt-2 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>{t('Identitas belum lengkap.', 'Identity incomplete.')}</strong>{' '}
                {pasien.alasan_identitas}
              </span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {bolehRiwayat && (
              <button onClick={onRiwayat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-xs font-semibold hover:bg-[var(--brand-hover)] transition">
                <History size={13} /> {t('Riwayat rekam medis', 'Medical history')}
              </button>
            )}
            {bolehUbah && (
              <button onClick={onUbah}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-medium hover:bg-[var(--surface-2)] transition">
                <Pencil size={13} /> {t('Ubah data', 'Edit')}
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className={judul}>{t('Identitas', 'Identity')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <B label="NIK" nilai={pasien.nik} num />
              <B label={t('Telepon', 'Phone')} nilai={pasien.telepon} num />
              <B label={t('Tempat, tgl lahir', 'Place, date of birth')}
                 nilai={[pasien.tempat_lahir, tanggal(pasien.tanggal_lahir)].filter(Boolean).join(', ')} />
              <B label={t('Gol. darah', 'Blood type')} nilai={pasien.gol_darah} />
              <B label={t('Agama', 'Religion')} nilai={pasien.agama} />
              <B label={t('Status kawin', 'Marital status')}
                 nilai={pasien.status_kawin ? KAWIN[pasien.status_kawin]?.[lang === 'en' ? 1 : 0] : null} />
              <B label={t('Pekerjaan', 'Occupation')} nilai={pasien.pekerjaan} />
              <B label={t('Pendidikan', 'Education')} nilai={pasien.pendidikan} />
              <B label={t('Warga negara', 'Nationality')} nilai={pasien.kewarganegaraan} />
            </div>
          </div>

          <div>
            <p className={judul}>{t('Alamat', 'Address')}</p>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{alamatLengkap || kosong}</p>
          </div>

          <div>
            <p className={judul}>{t('Kerabat yang bisa dihubungi', 'Next of kin')}</p>
            {pasien.kerabat_nama ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                <B label={t('Nama', 'Name')} nilai={pasien.kerabat_nama} />
                <B label={t('Hubungan', 'Relationship')} nilai={pasien.kerabat_hubungan} />
                <B label={t('Telepon', 'Phone')} nilai={pasien.kerabat_telepon} num />
                {pasien.kerabat_alamat && (
                  <div className="col-span-2 sm:col-span-3">
                    <B label={t('Alamat', 'Address')} nilai={pasien.kerabat_alamat} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm flex items-center gap-2">
                <Phone size={13} className="text-[var(--ink-faint)]" />
                {kosong}
                <span className="text-[11px] text-[var(--ink-faint)]">
                  {t('Diperlukan kalau pasien harus dirujuk atau tidak sadar.',
                     'Needed if the patient must be referred or is unconscious.')}
                </span>
              </p>
            )}
          </div>

          <div>
            <p className={judul}>{t('Kartu penjamin', 'Payer cards')}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <B label={t('Nomor BPJS', 'BPJS number')} nilai={pasien.nomor_bpjs || pasien.nomor_penjamin} num />
              <B label={t('Nomor polis', 'Policy number')} nilai={pasien.nomor_polis} num />
            </div>
            <p className="text-[11px] text-[var(--ink-faint)] mt-2 leading-relaxed">
              {t('Siapa yang menanggung tiap kunjungan dipilih saat pendaftaran, bukan dari sini.',
                 'Who pays for each visit is chosen at registration, not from here.')}
            </p>
          </div>

          {pasien.catatan && (
            <div>
              <p className={judul}>{t('Catatan', 'Notes')}</p>
              <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">{pasien.catatan}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </Portal>
  )
}
