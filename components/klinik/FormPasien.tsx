'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Portal from '@/components/Portal'
import { useLang } from '@/lib/i18n'

/**
 * Formulir identitas pasien.
 *
 * Dipakai dua tempat: daftar pasien, dan pendaftaran cepat dari layar
 * Kunjungan. Karena itu ia berdiri sendiri, bukan menumpang salah satunya.
 *
 * **NIK dan telepon WAJIB**, atas permintaan pemilik. Tanpa NIK, pasien tidak
 * bisa dikirim ke SatuSehat sama sekali; tanpa telepon, klinik tidak bisa
 * mengabari hasil pemeriksaan atau memanggil kontrol.
 *
 * **Tapi palangnya punya pintu.** Pasien yang datang tidak sadarkan diri tidak
 * memegang KTP, dan petugas yang tidak bisa mendaftarkannya akan mengarang
 * enam belas angka supaya formulirnya mau lewat. NIK karangan lebih berbahaya
 * daripada NIK kosong: ia terlihat seperti data, ikut terkirim, dan menempel
 * pada orang lain. Jadi ada penanda "identitas belum lengkap" yang menuntut
 * alasan, dan alasannya masuk jejak audit. Pola yang sama dengan penyerahan
 * obat tanpa bayar di migrasi 0035.
 *
 * **Penjamin TIDAK ada di sini lagi.** Satu orang bisa punya kartu BPJS
 * sekaligus asuransi kantor, dan yang menanggung kunjungan hari ini ditentukan
 * saat pendaftaran, bukan setahun lalu. Yang menempel pada orangnya adalah
 * NOMOR kartunya, dan itu yang disimpan di sini.
 */

export type Pasien = {
  id: string
  nomor_rm: string | null
  nama: string
  nik: string | null
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  alamat: string | null
  telepon: string | null
  gol_darah: string | null
  alergi: string | null
  penjamin: string
  nomor_penjamin: string | null
  catatan: string | null
  tempat_lahir?: string | null
  agama?: string | null
  pekerjaan?: string | null
  pendidikan?: string | null
  status_kawin?: string | null
  kewarganegaraan?: string | null
  rt?: string | null
  rw?: string | null
  kelurahan?: string | null
  kecamatan?: string | null
  kota?: string | null
  provinsi?: string | null
  kode_pos?: string | null
  nomor_bpjs?: string | null
  nomor_polis?: string | null
  kerabat_nama?: string | null
  kerabat_hubungan?: string | null
  kerabat_telepon?: string | null
  kerabat_alamat?: string | null
  identitas_belum_lengkap?: boolean | null
  alasan_identitas?: string | null
}

const MEDAN = [
  'nama', 'nik', 'tanggal_lahir', 'tempat_lahir', 'jenis_kelamin', 'alamat', 'telepon',
  'gol_darah', 'alergi', 'nomor_penjamin', 'catatan', 'agama', 'pekerjaan', 'pendidikan',
  'status_kawin', 'kewarganegaraan', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kota',
  'provinsi', 'kode_pos', 'nomor_bpjs', 'nomor_polis', 'kerabat_nama', 'kerabat_hubungan',
  'kerabat_telepon', 'kerabat_alamat', 'alasan_identitas',
] as const

const KOSONG: any = Object.fromEntries(MEDAN.map(k => [k, '']))
KOSONG.kewarganegaraan = 'WNI'
KOSONG.identitas_belum_lengkap = false

const STATUS_KAWIN = [
  ['belum_kawin', 'Belum kawin', 'Single'],
  ['kawin', 'Kawin', 'Married'],
  ['cerai_hidup', 'Cerai hidup', 'Divorced'],
  ['cerai_mati', 'Cerai mati', 'Widowed'],
] as const

const HUBUNGAN = ['Suami', 'Istri', 'Ayah', 'Ibu', 'Anak', 'Saudara', 'Wali', 'Lainnya']
const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
const PENDIDIKAN = ['Tidak sekolah', 'SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3']

export default function FormPasien({
  pasien, sibuk, onTutup, onSimpan,
}: {
  /** null berarti pasien baru. */
  pasien: Pasien | null
  sibuk: boolean
  onTutup: () => void
  onSimpan: (isi: any, id: string | null) => Promise<boolean>
}) {
  const { t, lang } = useLang()
  const [isi, setIsi] = useState<any>(KOSONG)

  useEffect(() => {
    if (!pasien) { setIsi(KOSONG); return }
    const next: any = {}
    for (const k of MEDAN) next[k] = (pasien as any)[k] || ''
    next.identitas_belum_lengkap = !!pasien.identitas_belum_lengkap
    if (!next.kewarganegaraan) next.kewarganegaraan = 'WNI'
    setIsi(next)
  }, [pasien])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const ubah = (k: string, v: any) => setIsi((x: any) => ({ ...x, [k]: v }))
  const input = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const label = 'text-xs font-medium text-[var(--ink-soft)] mb-1 block'
  const judul = 'text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-soft)] mb-2 pb-1 border-b border-[var(--line-soft)]'

  const darurat = !!isi.identitas_belum_lengkap
  const nikSalah = isi.nik.trim() !== '' && !/^[0-9]{16}$/.test(isi.nik.trim())
  const nikKurang = !darurat && isi.nik.trim() === ''
  const telpKurang = !darurat && isi.telepon.trim() === ''
  const alasanKurang = darurat && isi.alasan_identitas.trim() === ''
  const bolehSimpan = isi.nama.trim() !== '' && !nikSalah && !nikKurang && !telpKurang && !alasanKurang

  return (
    <Portal>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-[var(--brand)] mb-1">
          {pasien ? t('Ubah Data Pasien', 'Edit Patient') : t('Pasien Baru', 'New Patient')}
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mb-5">
          {pasien
            ? <>No. RM <span className="num">{pasien.nomor_rm || '-'}</span></>
            : t('NIK dan nomor telepon wajib. Kalau pasiennya memang tidak bisa menunjukkan identitas, tandai di bagian bawah dan tulis alasannya.',
                'ID number and phone are required. If the patient genuinely cannot show identification, tick the box at the bottom and write why.')}
        </p>

        <div className="space-y-5">
          {/* ── Identitas ── */}
          <div>
            <p className={judul}>{t('Identitas', 'Identity')}</p>
            <div className="space-y-3">
              <div>
                <label className={label}>{t('Nama lengkap', 'Full name')} <span className="text-red-500">*</span></label>
                <input autoFocus value={isi.nama} onChange={e => ubah('nama', e.target.value)} className={input} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>NIK {!darurat && <span className="text-red-500">*</span>}</label>
                  <input value={isi.nik} onChange={e => ubah('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                    inputMode="numeric" placeholder={t('16 angka', '16 digits')}
                    className={`${input} num ${nikSalah || nikKurang ? 'border-red-400' : ''}`} />
                  {nikSalah && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {t(`Baru ${isi.nik.trim().length} dari 16 angka.`, `Only ${isi.nik.trim().length} of 16 digits.`)}
                    </p>
                  )}
                </div>
                <div>
                  <label className={label}>{t('Telepon', 'Phone')} {!darurat && <span className="text-red-500">*</span>}</label>
                  <input value={isi.telepon} onChange={e => ubah('telepon', e.target.value)}
                    inputMode="tel" className={`${input} num ${telpKurang ? 'border-red-400' : ''}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={label}>{t('Tempat lahir', 'Place of birth')}</label>
                  <input value={isi.tempat_lahir} onChange={e => ubah('tempat_lahir', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Tanggal lahir', 'Date of birth')}</label>
                  <input type="date" value={isi.tanggal_lahir} onChange={e => ubah('tanggal_lahir', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Jenis kelamin', 'Sex')}</label>
                  <select value={isi.jenis_kelamin} onChange={e => ubah('jenis_kelamin', e.target.value)} className={input}>
                    <option value="">{t('(belum diisi)', '(not set)')}</option>
                    <option value="L">{t('Laki-laki', 'Male')}</option>
                    <option value="P">{t('Perempuan', 'Female')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={label}>{t('Gol. darah', 'Blood type')}</label>
                  <select value={isi.gol_darah} onChange={e => ubah('gol_darah', e.target.value)} className={input}>
                    <option value="">-</option>
                    {['A', 'B', 'AB', 'O'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('Agama', 'Religion')}</label>
                  <select value={isi.agama} onChange={e => ubah('agama', e.target.value)} className={input}>
                    <option value="">-</option>
                    {AGAMA.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('Status kawin', 'Marital status')}</label>
                  <select value={isi.status_kawin} onChange={e => ubah('status_kawin', e.target.value)} className={input}>
                    <option value="">-</option>
                    {STATUS_KAWIN.map(([v, id, en]) => (
                      <option key={v} value={v}>{lang === 'en' ? en : id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('Warga negara', 'Nationality')}</label>
                  <select value={isi.kewarganegaraan} onChange={e => ubah('kewarganegaraan', e.target.value)} className={input}>
                    <option value="WNI">WNI</option>
                    <option value="WNA">WNA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>{t('Pekerjaan', 'Occupation')}</label>
                  <input value={isi.pekerjaan} onChange={e => ubah('pekerjaan', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Pendidikan', 'Education')}</label>
                  <select value={isi.pendidikan} onChange={e => ubah('pendidikan', e.target.value)} className={input}>
                    <option value="">-</option>
                    {PENDIDIKAN.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Alamat ──
              Dipecah per bagian, bukan satu kotak bebas. SatuSehat mewajibkan
              alamat berkolom, dan membelah alamat setahun yang terlanjur
              tertulis sebagai satu baris tidak bisa dilakukan tanpa menebak. */}
          <div>
            <p className={judul}>{t('Alamat', 'Address')}</p>
            <div className="space-y-3">
              <div>
                <label className={label}>{t('Jalan, nomor rumah', 'Street, house number')}</label>
                <textarea rows={2} value={isi.alamat} onChange={e => ubah('alamat', e.target.value)} className={input} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={label}>RT</label>
                  <input value={isi.rt} onChange={e => ubah('rt', e.target.value.replace(/\D/g, '').slice(0, 3))} className={input + ' num'} />
                </div>
                <div>
                  <label className={label}>RW</label>
                  <input value={isi.rw} onChange={e => ubah('rw', e.target.value.replace(/\D/g, '').slice(0, 3))} className={input + ' num'} />
                </div>
                <div className="col-span-2">
                  <label className={label}>{t('Kelurahan/Desa', 'Village')}</label>
                  <input value={isi.kelurahan} onChange={e => ubah('kelurahan', e.target.value)} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={label}>{t('Kecamatan', 'District')}</label>
                  <input value={isi.kecamatan} onChange={e => ubah('kecamatan', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Kota/Kabupaten', 'City')}</label>
                  <input value={isi.kota} onChange={e => ubah('kota', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Provinsi', 'Province')}</label>
                  <input value={isi.provinsi} onChange={e => ubah('provinsi', e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>{t('Kode pos', 'Postal code')}</label>
                  <input value={isi.kode_pos} onChange={e => ubah('kode_pos', e.target.value.replace(/\D/g, '').slice(0, 5))} className={input + ' num'} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Alergi ──
              Berdiri sendiri dan diberi peringatan, bukan disatukan ke catatan
              umum. Ia satu-satunya isian di formulir ini yang bisa membunuh
              orang kalau terlewat dibaca. */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <label className="text-xs font-semibold text-red-800 mb-1 block">
              {t('Alergi obat', 'Drug allergies')}
            </label>
            <input value={isi.alergi} onChange={e => ubah('alergi', e.target.value)}
              placeholder={t('mis. amoksisilin, sulfa. Kosongkan kalau tidak ada.', 'e.g. amoxicillin, sulfa. Leave empty if none.')}
              className="w-full border border-red-300 bg-[var(--surface)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <p className="text-[11px] text-red-700 mt-1.5 leading-relaxed">
              {t('Yang ditulis di sini muncul sebagai peringatan merah di layar Kunjungan, setiap kali pasien ini datang.',
                 'What you write here appears as a red warning on the Visits screen, every time this patient comes in.')}
            </p>
          </div>

          {/* ── Kerabat ── */}
          <div>
            <p className={judul}>{t('Kerabat yang bisa dihubungi', 'Next of kin')}</p>
            <p className="text-[11px] text-[var(--ink-faint)] mb-2 leading-relaxed">
              {t('Yang dihubungi kalau pasiennya sendiri tidak bisa dihubungi, dan yang dimintai persetujuan tindakan kalau pasiennya tidak sadar.',
                 'Who to call when the patient cannot be reached, and who is asked to consent when the patient is unconscious.')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={label}>{t('Nama', 'Name')}</label>
                <input value={isi.kerabat_nama} onChange={e => ubah('kerabat_nama', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>{t('Hubungan', 'Relationship')}</label>
                <select value={isi.kerabat_hubungan} onChange={e => ubah('kerabat_hubungan', e.target.value)} className={input}>
                  <option value="">-</option>
                  {HUBUNGAN.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>{t('Telepon', 'Phone')}</label>
                <input value={isi.kerabat_telepon} onChange={e => ubah('kerabat_telepon', e.target.value)}
                  inputMode="tel" className={input + ' num'} />
              </div>
            </div>
            <div className="mt-3">
              <label className={label}>{t('Alamat kerabat (kalau berbeda)', 'Address (if different)')}</label>
              <input value={isi.kerabat_alamat} onChange={e => ubah('kerabat_alamat', e.target.value)} className={input} />
            </div>
          </div>

          {/* ── Kartu penjamin ──
              Nomor kartunya menempel pada ORANGNYA, dan satu orang boleh punya
              dua. Yang MEMILIH penanggung untuk satu kunjungan adalah layar
              pendaftaran, bukan formulir ini. */}
          <div>
            <p className={judul}>{t('Kartu penjamin', 'Payer cards')}</p>
            <p className="text-[11px] text-[var(--ink-faint)] mb-2 leading-relaxed">
              {t('Satu orang bisa punya kartu BPJS sekaligus asuransi. Siapa yang menanggung kunjungan dipilih saat pendaftaran, bukan di sini.',
                 'One person can hold both a BPJS card and private insurance. Who pays for a visit is chosen at registration, not here.')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>{t('Nomor BPJS', 'BPJS number')}</label>
                <input value={isi.nomor_bpjs} onChange={e => ubah('nomor_bpjs', e.target.value)} className={input + ' num'} />
              </div>
              <div>
                <label className={label}>{t('Nomor polis asuransi', 'Insurance policy number')}</label>
                <input value={isi.nomor_polis} onChange={e => ubah('nomor_polis', e.target.value)} className={input + ' num'} />
              </div>
            </div>
          </div>

          {/* ── Catatan & pintu darurat ── */}
          <div>
            <p className={judul}>{t('Lain-lain', 'Other')}</p>
            <label className={label}>{t('Catatan', 'Notes')}</label>
            <textarea rows={2} value={isi.catatan} onChange={e => ubah('catatan', e.target.value)} className={input} />

            <div className={`mt-3 rounded-xl border p-3 ${darurat ? 'border-amber-300 bg-amber-50' : 'border-[var(--line)]'}`}>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={darurat}
                  onChange={e => ubah('identitas_belum_lengkap', e.target.checked)}
                  className="mt-0.5" />
                <span className="text-xs text-[var(--ink)] leading-relaxed">
                  {t('Identitas belum lengkap (gawat darurat, kartu tertinggal, pasien tidak sadar)',
                     'Identity incomplete (emergency, card left behind, patient unconscious)')}
                </span>
              </label>
              {darurat && (
                <div className="mt-2">
                  <label className="text-[11px] font-semibold text-amber-800 mb-1 block">
                    {t('Alasannya', 'Reason')} <span className="text-red-500">*</span>
                  </label>
                  <input value={isi.alasan_identitas} onChange={e => ubah('alasan_identitas', e.target.value)}
                    placeholder={t('mis. dibawa tetangga dalam keadaan tidak sadar', 'e.g. brought in unconscious by a neighbour')}
                    className="w-full border border-amber-300 bg-[var(--surface)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <p className="text-[11px] text-amber-800 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    {t('Alasan ini masuk jejak audit. Lengkapi identitasnya begitu keluarganya datang, dan penanda ini hilang sendiri.',
                       'This reason goes into the audit trail. Complete the identity once the family arrives and this flag clears itself.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 sticky bottom-0 -mx-6 -mb-6 px-6 pt-3 pb-6 bg-[var(--surface)] border-t border-[var(--line-soft)]">
          <button onClick={onTutup} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
            {t('Batal', 'Cancel')}
          </button>
          <button
            onClick={() => { if (bolehSimpan) onSimpan(isi, pasien?.id ?? null) }}
            disabled={sibuk || !bolehSimpan}
            className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
            {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan', 'Save')}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
