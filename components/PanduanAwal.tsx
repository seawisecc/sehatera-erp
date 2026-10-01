'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'

/**
 * Panduan awal di Beranda: apa yang harus diisi sebelum faskes ini bisa
 * melayani orang pertamanya.
 *
 * Paket Klinik dibuka untuk pendaftaran mandiri, jadi tidak ada lagi orang
 * Seawise yang duduk di sebelah pemilik saat ia pertama kali masuk. Yang
 * dilihatnya adalah Beranda berisi nol di semua kartu, dan dari situ ia harus
 * menebak sendiri bahwa poli harus dibuat sebelum pasien bisa didaftarkan.
 * Masa coba yang habis untuk menebak adalah masa coba yang tidak jadi
 * pelanggan.
 *
 * Tiap butir DIHITUNG dari data, bukan dicentang tangan. Centang tangan bisa
 * dicentang tanpa dikerjakan, dan daftar yang tidak jujur tentang dirinya
 * sendiri berhenti dibaca. Konsekuensinya: panduannya hilang sendiri begitu
 * semuanya terisi, dan muncul lagi kalau sesuatu dihapus.
 *
 * Tombol tutup ada karena tidak semua butir wajib bagi semua orang: apotek
 * yang dijalankan satu orang tidak akan pernah mengundang anggota tim.
 * Penandanya di localStorage per peramban, sengaja: menutupnya bukan
 * keputusan untuk seluruh faskes, cuma "saya sudah tahu".
 */

type Butir = { id: string; judul: string; ket: string; href: string; selesai: boolean }

export default function PanduanAwal() {
  const { t } = useLang()
  const app = useApp()
  const klinik = app.sektor !== 'apotek'
  const companyId: string = app.superViewCompany || app.session?.company?.id || ''
  const kunci = `sw_panduan_tutup:${companyId}`

  const [hitung, setHitung] = useState<Record<string, number> | null>(null)
  const [tutup, setTutup] = useState(false)

  useEffect(() => {
    try { setTutup(!!companyId && localStorage.getItem(kunci) === '1') } catch { setTutup(false) }
  }, [kunci, companyId])

  const muat = useCallback(async () => {
    const jumlah = async (q: any) => {
      const { count, error } = await app.scope(q)
      // Galat dibaca sebagai "belum tahu", bukan "belum ada": butir yang
      // tidak bisa diperiksa tidak boleh menyuruh orang mengerjakan ulang
      // sesuatu yang mungkin sudah ia kerjakan.
      return error ? -1 : (count ?? 0)
    }
    const head = { count: 'exact' as const, head: true }
    const [produk, stok, supplier, tim, poli, dokterPoli, layanan, izin] = await Promise.all([
      jumlah(supabase.from('products').select('id', head)),
      jumlah(supabase.from('product_batches').select('id', head).gt('stok_batch', 0)),
      klinik ? Promise.resolve(0) : jumlah(supabase.from('suppliers').select('id', head)),
      jumlah(supabase.from('app_users').select('id', head).neq('role', 'pemilik')),
      klinik ? jumlah(supabase.from('clinic_units').select('id', head).eq('aktif', true)) : Promise.resolve(0),
      klinik ? jumlah(supabase.from('unit_doctors').select('id', head)) : Promise.resolve(0),
      klinik ? jumlah(supabase.from('services').select('id', head)) : Promise.resolve(0),
      klinik ? jumlah(supabase.from('app_users').select('id', head).eq('role', 'dokter').not('nomor_sip', 'is', null)) : Promise.resolve(0),
    ])
    setHitung({ produk, stok, supplier, tim, poli, dokterPoli, layanan, izin })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany, klinik])

  useEffect(() => { muat() }, [muat])

  // Hanya yang bisa mengerjakannya. Kasir yang melihat "buat poli" cuma
  // mendapat pekerjaan yang tidak boleh ia sentuh.
  // Super admin hanya saat sedang melihat satu klien; tanpa itu hitungannya
  // menjumlah seluruh faskes dan tidak berarti apa pun.
  const berhak = app.isSuper ? !!app.superViewCompany : (app.currentRole === 'pemilik' || app.currentRole === 'admin')
  if (!berhak || !hitung || tutup) return null

  const s = app.settingsData || {}
  const ada = (v: unknown) => typeof v === 'string' ? v.trim() !== '' : v != null
  const profilLengkap = ada(s.nama_faskes || s.nama_apotek) && ada(s.alamat) && ada(s.nomor_telepon) && ada(s.nomor_ijin)
  // -1 (gagal diperiksa) dianggap selesai, alasannya di atas.
  const isi = (n: number) => n !== 0
  const faskes = app.kata('faskes').toLowerCase()

  const butir: Butir[] = [
    {
      id: 'profil', selesai: profilLengkap, href: '/pengaturan?tab=profil',
      judul: t(`Lengkapi profil ${faskes}`, `Complete the ${faskes} profile`),
      ket: klinik
        ? t('Nama, alamat, telepon, dan nomor izin operasional. Semuanya tercetak di kop resep dan kuitansi.', 'Name, address, phone, and operating licence. All of it prints on prescriptions and receipts.')
        : t('Nama, alamat, telepon, dan nomor SIA. Tercetak di struk dan purchase order.', 'Name, address, phone, and SIA number. Printed on receipts and purchase orders.'),
    },
    // Apoteker penanggung jawab diisi di tab tersendiri, bukan di Profil,
    // jadi butirnya juga terpisah: satu butir yang menunjuk ke tab yang salah
    // membuat orang mencari kolom yang tidak ada di sana.
    ...(!klinik ? [{
      id: 'apoteker', selesai: ada(s.nama_apoteker) && ada(s.nomor_sipa), href: '/pengaturan?tab=apoteker',
      judul: t('Isi apoteker penanggung jawab', 'Enter the responsible pharmacist'),
      ket: t('Nama dan nomor SIPA. Tertera di purchase order dan laporan SIPNAP.', 'Name and SIPA number. Required on purchase orders and SIPNAP reports.'),
    }] : []),
    ...(klinik ? [
      {
        id: 'poli', selesai: isi(hitung.poli), href: '/pengaturan?tab=poli',
        judul: t('Buat poli', 'Create clinic units'),
        ket: t('Tanpa poli, pasien tidak punya antrean untuk didaftarkan. Tarif konsultasi diatur per poli di sini juga.', 'Without a unit, patients have no queue to join. Consultation fees are set per unit here too.'),
      },
      {
        id: 'dokter', selesai: isi(hitung.dokterPoli), href: '/pengaturan?tab=poli',
        judul: t('Tempatkan dokter di poli', 'Assign doctors to units'),
        ket: t('Undang dokternya sebagai pengguna berperan Dokter, lalu pasang ke polinya. Antrean dokter tersaring ke polinya sendiri.', 'Invite the doctor as a user with the Doctor role, then assign them to a unit. Each doctor sees their own unit queue.'),
      },
      {
        id: 'izin', selesai: isi(hitung.izin), href: '/pengaturan?tab=perizinan',
        judul: t('Isi STR dan SIP dokter', 'Enter doctor STR and SIP'),
        ket: t('Nomor izin dokter yang menulis resep tercetak di kertas resepnya. Masa berlakunya diingatkan sebelum habis.', 'The prescribing doctor licence number prints on the prescription. Expiry is flagged before it lapses.'),
      },
      {
        id: 'layanan', selesai: isi(hitung.layanan), href: '/layanan',
        judul: t('Atur tarif layanan', 'Set service fees'),
        ket: t('Tindakan, pemeriksaan lab, dan biaya administrasi. Kasir menagih dari daftar ini.', 'Procedures, lab tests, and the administration fee. The cashier bills from this list.'),
      },
    ] : []),
    {
      id: 'produk', selesai: isi(hitung.produk), href: '/pengaturan/migrasi',
      judul: klinik ? t('Masukkan daftar obat', 'Add the drug list') : t('Masukkan katalog produk', 'Add the product catalog'),
      ket: t('Satu per satu di Produk & Stok, atau sekaligus dari Excel lewat Migrasi Data.', 'One by one in Products & Stock, or all at once from Excel via Data Migration.'),
    },
    {
      id: 'stok', selesai: isi(hitung.stok), href: '/pengaturan/migrasi',
      judul: t('Catat stok awal per batch', 'Record opening stock per batch'),
      ket: t('Dengan nomor batch dan tanggal kadaluarsa, supaya kasir mengeluarkan yang paling dulu kadaluarsa dan SIPNAP punya saldo awal.', 'With batch numbers and expiry dates, so the cashier sells the earliest expiry first and SIPNAP has an opening balance.'),
    },
    ...(!klinik ? [{
      id: 'supplier', selesai: isi(hitung.supplier), href: '/supplier',
      judul: t('Daftarkan supplier', 'Add suppliers'),
      ket: t('PBF tempat Anda membeli obat. Dibutuhkan untuk membuat PO dan mencatat faktur.', 'The distributors you buy from. Needed to create POs and record invoices.'),
    }] : []),
    {
      id: 'tim', selesai: isi(hitung.tim), href: '/pengaturan?tab=pengguna',
      judul: t('Undang anggota tim', 'Invite your team'),
      ket: klinik
        ? t('Pendaftaran, perawat, dokter, farmasi, dan kasir masing-masing dengan perannya sendiri, supaya rekam medis hanya terbuka untuk yang berhak.', 'Front desk, nurses, doctors, pharmacy, and cashier each with their own role, so medical records open only to those entitled.')
        : t('Apoteker, asisten, dan kasir masing-masing dengan perannya sendiri. Lewati kalau Anda bekerja sendiri.', 'Pharmacists, assistants, and cashiers each with their own role. Skip if you work alone.'),
    },
  ]

  const jumlahSelesai = butir.filter(b => b.selesai).length
  if (jumlahSelesai === butir.length) return null
  const berikut = butir.find(b => !b.selesai)

  const sembunyikan = () => {
    try { localStorage.setItem(kunci, '1') } catch { /* peramban menolak; cukup disembunyikan untuk kunjungan ini */ }
    setTutup(true)
  }

  return (
    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm p-5 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-[var(--ink)]">
            {t(`Siapkan ${faskes} Anda`, `Set up your ${faskes}`)}
          </h2>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">
            {t(`${jumlahSelesai} dari ${butir.length} selesai. Panduan ini hilang sendiri begitu semuanya terisi.`,
               `${jumlahSelesai} of ${butir.length} done. This guide disappears once everything is filled in.`)}
          </p>
        </div>
        <button onClick={sembunyikan} title={t('Sembunyikan panduan', 'Hide guide')} aria-label={t('Sembunyikan panduan', 'Hide guide')}
          className="shrink-0 p-1.5 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition">
          <X size={16} />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--surface-2)] mt-4 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${(jumlahSelesai / butir.length) * 100}%` }} />
      </div>

      <ol className="mt-4 grid gap-2 md:grid-cols-2">
        {butir.map(b => {
          const kini = b.id === berikut?.id
          return (
            <li key={b.id}>
              <Link href={b.href}
                className={`group flex gap-3 rounded-xl border p-3 h-full transition ${
                  kini ? 'border-[var(--brand)]/40 bg-[var(--surface-2)]'
                  : 'border-[var(--line-soft)] hover:bg-[var(--surface-2)]'}`}>
                {b.selesai
                  ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-700" />
                  : <Circle size={18} className={`shrink-0 mt-0.5 ${kini ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`} />}
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${b.selesai ? 'text-[var(--ink-soft)] line-through decoration-[var(--ink-faint)]' : 'text-[var(--ink)]'}`}>
                    {b.judul}
                  </span>
                  {!b.selesai && <span className="block text-xs text-[var(--ink-soft)] mt-0.5 leading-relaxed">{b.ket}</span>}
                </span>
                {!b.selesai && <ArrowRight size={15} className="shrink-0 mt-0.5 text-[var(--ink-faint)] group-hover:text-[var(--brand)] transition" />}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
