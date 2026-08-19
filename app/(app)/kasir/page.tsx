'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, HeartPulse, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR } from '@/lib/ui'
import { rupiah, angka, tanggalJam } from '@/lib/format'
import { bukaCetak, strukPenjualan } from '@/lib/cetak'

/**
 * Kasir.
 *
 * Penjualannya sudah lewat `apply_transaction()` sejak migrasi 0004, jadi yang
 * berubah di sini bukan jalur datanya melainkan tempatnya, ditambah dua hal:
 *
 * 1. Pencarian tidak lagi memanggil ulang database tiap ketikan. Kode lama
 *    memanggil `fetchProducts()` pada setiap `onChange` begitu panjangnya lebih
 *    dari satu huruf, jadi mengetik "amoxicillin" berarti sepuluh pengambilan
 *    seluruh katalog. Katalog diambil sekali, penyaringan terjadi di layar.
 * 2. Struk pindah ke `lib/cetak.ts`. Nama apotek dan nama obat dulu ditempel
 *    mentah ke HTML, dan waktunya diambil dari jam cetak, bukan jam transaksi.
 *
 * Papan ketik: Enter di kotak cari memasukkan hasil teratas, F2 memindahkan
 * fokus ke kotak bayar. Kasir apotek bekerja sambil memegang obat di tangan
 * satunya, jadi jumlah perpindahan tangan ke tetikus itu yang menentukan
 * cepat atau tidaknya antrean bergerak.
 */

const URUT_KELOMPOK = ['administrasi', 'konsultasi', 'tindakan', 'penunjang', 'obat', 'lainnya'] as const

const METODE = ['Tunai', 'QRIS', 'Transfer', 'Debit', 'Kartu Kredit'] as const
const GOLONGAN = ['narkotika', 'psikotropika', 'prekursor']

type Item = {
  id: string
  nama_obat: string
  kode?: string | null
  harga_jual: number
  jumlah: number
  stok_total: number
  kategori?: string | null
  is_jasa?: boolean
  /**
   * Dari mana barisnya datang: administrasi, konsultasi, tindakan, obat.
   * Sama dengan `visit_charges.jenis`, ditambah `obat` untuk yang keluar dari
   * resep. Kasir membaca satu daftar panjang berisi tarif, tindakan, dan obat
   * bercampur, dan yang ditanya pasien hampir selalu "yang mana obatnya".
   */
  jenis?: string
}

export default function HalamanKasir() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()
  const scope = app.scope

  const [produk, setProduk] = useState<any[]>([])
  const [layanan, setLayanan] = useState<any[]>([])
  const [cari, setCari] = useState('')
  const [keranjang, setKeranjang] = useState<Item[]>([])
  const [bayar, setBayar] = useState(0)
  const [metode, setMetode] = useState<string>('Tunai')
  const [isResep, setIsResep] = useState(false)
  const [pasien, setPasien] = useState({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' })
  const [visitId, setVisitId] = useState('')
  const [resepMenunggu, setResepMenunggu] = useState<any[]>([])
  const [resepId, setResepId] = useState('')

  /**
   * Pelunasan. `penjamin` menentukan siapa yang membayar, `ditagihkan` berapa
   * yang jadi piutang ke penjamin itu. Sisanya yang harus diterima tunai.
   *
   * Dipisah dari `bayar` dengan sengaja: yang ditagihkan ke BPJS bukan uang
   * yang masuk laci, dan kalau digabung, laci kasir tidak akan pernah cocok
   * saat tutup buku.
   */
  const [penjamin, setPenjamin] = useState<'umum' | 'bpjs' | 'asuransi'>('umum')
  const [asuransiTrx, setAsuransiTrx] = useState('')
  const [ditagihkan, setDitagihkan] = useState(0)
  const [daftarAsuransi, setDaftarAsuransi] = useState<{ id: string; nama: string }[]>([])
  const [sibuk, setSibuk] = useState(false)

  const [struk, setStruk] = useState<any>(null)
  const [strukItems, setStrukItems] = useState<any[]>([])

  const cariRef = useRef<HTMLInputElement>(null)
  const bayarRef = useRef<HTMLInputElement>(null)

  const terkunciSuper = app.isSuper && !app.superViewCompany
  const terkunciLangganan = app.langganan.terkunci

  const muat = useCallback(async () => {
    const [{ data: p }, { data: s }, { data: ins }] = await Promise.all([
      scope(supabase.from('products').select('*').order('nama_obat')),
      scope(supabase.from('services').select('*').eq('status', 'aktif').order('nama')),
      scope(supabase.from('insurers').select('id,nama').eq('aktif', true).order('nama')),
    ])
    setProduk(p || [])
    setLayanan(s || [])
    setDaftarAsuransi((ins as any[]) || [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])
  useEffect(() => { cariRef.current?.focus() }, [])

  const total = useMemo(() => keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0), [keranjang])
  const adaGolongan = keranjang.some(k => GOLONGAN.includes(String(k.kategori)))
  const perluResep = adaGolongan || isResep

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return { obat: [] as any[], jasa: [] as any[], pindai: null as any }
    const cocok = (v: any) => (v || '').toString().toLowerCase().includes(q)

    /* Barcode dicocokkan PERSIS dan didahulukan, bukan ikut pencarian teks.
       Pemindai genggam berlaku seperti papan ketik: ia mengetik seluruh
       angkanya lalu menekan Enter sendiri. Kalau angkanya ikut pencarian
       kemiripan, Enter bisa memasukkan baris teratas yang kebetulan mirip,
       dan memasukkan obat yang salah karena satu digit beririsan bukan
       kesalahan administratif. */
    const pindai = produk.find(p => (p.barcode || '').toString().trim() === cari.trim()) || null

    return {
      obat: produk.filter(p => cocok(p.nama_obat) || cocok(p.nama_generik) || cocok(p.kandungan)
                            || cocok(p.kode) || cocok(p.barcode)).slice(0, 25),
      jasa: layanan.filter(s => cocok(s.nama)).slice(0, 10),
      pindai,
    }
  }, [cari, produk, layanan])

  const tambahObat = (p: any) => {
    if ((p.stok_total ?? 0) <= 0) {
      kabar(t(`Stok ${p.nama_obat} habis, tidak bisa dijual.`, `${p.nama_obat} is out of stock.`)); return
    }
    const ada = keranjang.find(k => k.id === p.id)
    if (ada) {
      if (ada.jumlah + 1 > (p.stok_total ?? 0)) {
        kabar(t(`Stok ${p.nama_obat} hanya ${p.stok_total}.`, `Only ${p.stok_total} of ${p.nama_obat} in stock.`)); return
      }
      setKeranjang(keranjang.map(k => k.id === p.id ? { ...k, jumlah: k.jumlah + 1 } : k))
    } else {
      setKeranjang([...keranjang, {
        id: p.id, nama_obat: p.nama_obat, kode: p.kode, harga_jual: p.harga_jual || 0,
        jumlah: 1, stok_total: p.stok_total ?? 0, kategori: p.kategori, jenis: 'obat',
      }])
    }
    setCari('')
    cariRef.current?.focus()
  }

  const tambahJasa = (s: any) => {
    const id = 'svc-' + s.id
    const ada = keranjang.find(k => k.id === id)
    if (ada) setKeranjang(keranjang.map(k => k.id === id ? { ...k, jumlah: k.jumlah + 1 } : k))
    else setKeranjang([...keranjang, {
      id, nama_obat: s.nama, harga_jual: s.harga || 0, jumlah: 1,
      is_jasa: true, kategori: 'jasa', stok_total: 0, jenis: 'tindakan',
    }])
    setCari('')
    cariRef.current?.focus()
  }

  const ubahJumlah = (id: string, jumlah: number) =>
    setKeranjang(prev => prev.map(k => {
      if (k.id !== id) return k
      const v = Math.max(1, jumlah)
      return { ...k, jumlah: (!k.is_jasa && v > k.stok_total) ? k.stok_total : v }
    }))

  const kosongkan = () => {
    setKeranjang([]); setBayar(0); setMetode('Tunai'); setIsResep(false)
    setPasien({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' })
    setPenjamin('umum'); setAsuransiTrx(''); setDitagihkan(0)
    setVisitId('')
    setResepId('')
  }

  useEffect(() => {
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); bayarRef.current?.focus(); bayarRef.current?.select() }
      if (e.key === 'F3') { e.preventDefault(); cariRef.current?.focus(); cariRef.current?.select() }
    }
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [])

  const proses = async () => {
    if (sibuk) return
    if (terkunciLangganan) { kabar(app.langganan.pesan?.isi || ''); return }
    if (terkunciSuper) {
      kabar(t('Pemilih faskes masih menampilkan semua apotek. Pilih satu apotek dulu sebelum transaksi.',
              'The facility picker still shows all pharmacies. Select one before making a transaction.')); return
    }
    if (keranjang.length === 0) { kabar(t('Keranjang kosong.', 'Cart is empty.')); return }

    const lebih = keranjang.find(k => !k.is_jasa && k.jumlah > k.stok_total)
    if (lebih) {
      kabar(t(`Stok ${lebih.nama_obat} tidak cukup: tersedia ${lebih.stok_total}, diminta ${lebih.jumlah}.`,
              `Insufficient stock for ${lebih.nama_obat}: ${lebih.stok_total} available, ${lebih.jumlah} requested.`)); return
    }
    // Yang harus ditutup tunai cuma sisanya sesudah dikurangi tagihan
    // penjamin. Pasien BPJS yang seluruh tagihannya ditanggung membayar nol,
    // dan itu sah.
    const harusTunai = Math.max(total - (penjamin === 'umum' ? 0 : ditagihkan), 0)
    if (bayar < harusTunai) {
      kabar(t(`Pembayaran kurang. Pasien harus membayar ${rupiah(harusTunai)}.`,
              `Payment is short. The patient must pay ${rupiah(harusTunai)}.`)); return
    }
    if (penjamin === 'asuransi' && !asuransiTrx) {
      kabar(t('Pilih dulu asuransinya.', 'Choose the insurer first.')); return
    }
    if (perluResep && (!pasien.nama_pasien.trim() || !pasien.nomor_resep.trim())) {
      kabar(adaGolongan
        ? t('Obat golongan Narkotika, Psikotropika, atau Prekursor wajib mencatat nama pasien dan nomor resep.',
             'Narcotics, psychotropics, or precursors require the patient name and prescription number.')
        : t('Transaksi resep wajib mencatat nama pasien dan nomor resep.',
             'A prescription sale requires the patient name and prescription number.'))
      return
    }

    if (instalasi && !visitId) {
      kabar(t('Pilih dulu kunjungan pasiennya. Instalasi farmasi hanya melayani pasien fasilitas ini, jadi penyerahan obat harus terikat ke satu kunjungan.',
              'Choose the patient visit first. A pharmacy installation serves only this facility patients, so dispensing must be tied to a visit.'))
      return
    }

    setSibuk(true)
    const { data, error } = await supabase.rpc('apply_transaction', {
      p_items: keranjang.map(k => ({
        product_id: k.is_jasa ? null : k.id,
        is_jasa: !!k.is_jasa,
        nama_obat: k.nama_obat,
        harga_jual: k.harga_jual,
        jumlah: k.jumlah,
      })),
      p_bayar: bayar,
      p_metode_bayar: metode,
      p_penjamin: penjamin,
      p_asuransi: penjamin === 'asuransi' ? (asuransiTrx || null) : null,
      p_ditagihkan: penjamin === 'umum' ? 0 : ditagihkan,
      p_pasien: {
        ...(perluResep ? {
          nama_pasien: pasien.nama_pasien.trim(),
          alamat_pasien: pasien.alamat_pasien.trim(),
          kontak_pasien: pasien.kontak_pasien.trim(),
          nomor_resep: pasien.nomor_resep.trim(),
        } : {}),
        ...(visitId ? { visit_id: visitId } : {}),
      },
      p_company: (app.isSuper && app.superViewCompany) || null,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }

    // Pembayaran dicatat SESUDAH penjualannya berhasil, tidak sebelumnya.
    // Fungsinya idempoten, jadi aman diulang.
    //
    // Kasir mencatat UANG, bukan penyerahan. Sampai migrasi 0035 baris ini
    // memanggil `tandai_resep_dilayani`, yang berarti database mencatat obat
    // sudah diserahkan pada detik uang diterima, padahal obatnya masih di
    // belakang. Yang menyatakan penyerahan sekarang farmasi, di layar
    // Farmasi, dan hanya sesudah baris ini berjalan.
    if (visitId) {
      await supabase.rpc('tandai_kunjungan_dibayar', {
        p_visit: visitId, p_transaksi: (data as any)?.id ?? null,
      })
    }
    if (resepId) {
      const { error: e2 } = await supabase.rpc('tandai_resep_dibayar', {
        p_resep: resepId, p_transaksi: (data as any)?.id ?? null,
      })
      if (e2) {
        kabar(t('Penjualan tersimpan, tapi pembayaran resepnya gagal dicatat. Layar Farmasi akan tetap menampilkannya sebagai BELUM BAYAR, jadi obatnya bisa tertahan. Beri tahu saya kalau ini terjadi.',
                'The sale was saved, but the prescription payment could not be recorded. The Pharmacy screen will still show it as UNPAID, so the medicine may be held back.')
              + '\n\n' + pesanError(e2))
      }
    }

    setStruk(data)
    setStrukItems(keranjang.map(k => ({ ...k, subtotal: k.harga_jual * k.jumlah })))
    kosongkan()
    // Stok di layar sudah tidak sama dengan stok di database.
    muat()
    cariRef.current?.focus()
  }

  const cetakStruk = () => {
    const ok = bukaCetak(strukPenjualan(app.settingsData, struk, strukItems), 350, 600)
    if (!ok) kabar(t('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'The print window was blocked. Allow pop-ups for this site.'))
  }

  /**
   * Bentuk bagian farmasi.
   *
   * Instalasi farmasi hanya melayani pasien fasilitas ini, jadi tiap penyerahan
   * obat harus terikat ke satu kunjungan. Database sudah menolak yang tidak,
   * tapi penolakan saja tidak cukup: kalau layarnya tidak menyediakan jalannya,
   * kasir cuma menemukan pintu terkunci tanpa tahu kuncinya di mana.
   */
  const instalasi = app.sektor !== 'apotek' && (app.settingsData.mode_farmasi || 'apotek') === 'instalasi'

  /**
   * Antrean resep yang menunggu diserahkan.
   *
   * Muncul untuk klinik dan rumah sakit, bukan cuma mode instalasi: klinik yang
   * bagian obatnya berbentuk apotek berizin sendiri tetap melayani resep dari
   * poli sendiri, ia cuma BOLEH melayani yang lain juga.
   */
  const klinik = app.sektor !== 'apotek'

  useEffect(() => {
    if (!klinik) { setResepMenunggu([]); return }
    ;(async () => {
      // Bukan cuma yang punya resep. Kunjungan yang cuma konsultasi tanpa obat
      // tetap harus bisa ditagih, dan itu justru kejadian yang paling sering.
      const { data } = await app.scope(
        supabase.from('v_antrean_hari_ini')
          .select('id,nomor_antre,pasien_nama,nomor_rm,alergi,unit_nama,status,status_resep,nilai_biaya,transaction_id,obat_belum_dipilih,siap_tagih_pada,siap_tagih_catatan,penunjang_menggantung')
          .not('status', 'in', '("batal")')
          .is('transaction_id', null)
          .order('dibuka_pada')
      )
      setResepMenunggu(((data as any[]) || []).map(x => ({ ...x, visit_id: x.id })))
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klinik, app.superViewCompany, struk])

  /**
   * Memuat SELURUH tagihan satu kunjungan ke keranjang: tarif, tindakan, dan
   * obat sekaligus.
   *
   * Satu panggilan, bukan dua. Kalau tarif dan obat diambil terpisah, ada
   * jeda di mana kasir sudah melihat tarifnya tapi obatnya belum sampai, lalu
   * menekan Proses. Struk yang kurang satu baris baru ketahuan saat pasien
   * sudah pulang, dan saat itu tidak ada lagi yang bisa dilakukan.
   *
   * Obat luar katalog dan yang stoknya habis tidak ikut, dan itu DIKATAKAN.
   * Keranjang yang diam-diam berisi lebih sedikit daripada resepnya adalah cara
   * paling mudah menyerahkan setengah resep tanpa ada yang sadar.
   */
  const muatTagihan = async (r: any) => {
    const { data, error } = await supabase.rpc('tagihan_kunjungan', { p_visit: r.visit_id })
    if (error) { kabar(pesanError(error), 'galat'); return }
    const d = data as any
    const masuk: Item[] = []
    const lewat: string[] = []

    // Tarif dan tindakan masuk sebagai jasa: ia tidak memotong stok, dan
    // `apply_transaction` sudah menangani baris jasa sejak kasir apotek.
    for (const c of (d.biaya || []) as any[]) {
      masuk.push({
        id: 'chg-' + c.id, nama_obat: c.nama, harga_jual: Number(c.harga) || 0,
        jumlah: Number(c.jumlah) || 1, is_jasa: true, kategori: 'jasa', stok_total: 0,
        jenis: c.jenis || 'tindakan',
      })
    }

    for (const i of (d.obat || []) as any[]) {
      const jumlah = Math.floor(Number(i.jumlah) || 0)
      const stok = Number(i.stok ?? 0)
      if (!i.product_id) { lewat.push(`${i.nama_obat} (${t('luar katalog', 'off catalogue')})`); continue }
      if (jumlah <= 0) continue
      if (stok <= 0) { lewat.push(`${i.nama_obat} (${t('stok habis', 'out of stock')})`); continue }
      if (jumlah > stok) lewat.push(`${i.nama_obat} (${t('diambil', 'took')} ${stok} ${t('dari', 'of')} ${jumlah})`)
      masuk.push({
        id: i.product_id, nama_obat: i.nama_obat, harga_jual: Number(i.harga_jual) || 0,
        jumlah: Math.min(jumlah, stok), stok_total: stok, kategori: i.kategori, jenis: 'obat',
      })
    }

    setKeranjang(masuk)
    setVisitId(r.visit_id)
    setResepId(d.resep_id || '')
    const k = d.kunjungan || {}
    // Penjamin kunjungan ikut ke kasir. Kalau kasir harus memilihnya ulang,
    // pasien BPJS yang lupa dipilih akan ditagih tunai penuh di depan
    // orangnya, dan itu keliru yang paling mahal diperbaiki.
    const pen = (k.penjamin || 'umum') as 'umum' | 'bpjs' | 'asuransi'
    setPenjamin(pen)
    setAsuransiTrx(k.asuransi_id || '')
    const totalTagihan = masuk.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)
    setDitagihkan(pen === 'umum' ? 0 : totalTagihan)
    /**
     * Nomor resepnya datang dari RESEPNYA, bukan dari nomor kunjungan.
     *
     * Sampai sekarang kotak "No. Resep" diisi `r.nomor`, yang adalah nomor
     * KUNJUNGAN: satu-satunya nomor yang sampai ke layar ini. Untuk obat
     * golongan narkotika dan psikotropika kotak itu adalah catatan yang wajib
     * benar dan ikut ke laporan SIPNAP, dan nomor kunjungan di sana tidak
     * menunjuk resep mana pun. Yang memeriksanya nanti tidak menemukan apa-apa.
     *
     * Resepnya sudah bernomor sendiri sejak migrasi 0023; yang kurang cuma
     * jalan pulangnya ke layar, dan itu ditambal migrasi 0064.
     *
     * Begitu kunjungannya PUNYA resep, penanda "transaksi berupa resep" ikut
     * menyala sendiri: kasir tidak perlu diminta mencentang sesuatu yang sudah
     * pasti benar, dan yang diminta mencentang cepat atau lambat lupa.
     */
    const noResep = d.resep_nomor || ''
    if (k.alergi || noResep) setIsResep(true)
    setPasien(x => ({
      ...x,
      nama_pasien: k.pasien_nama || x.nama_pasien,
      nomor_resep: noResep || x.nomor_resep,
    }))
    if (lewat.length) {
      kabar(t(`Tidak semua obat masuk keranjang:\n\n${lewat.join('\n')}\n\nSisanya perlu ditangani di luar aplikasi.`,
              `Not everything went into the cart:\n\n${lewat.join('\n')}\n\nThe rest needs handling outside the app.`))
    }
  }


  /**
   * Keranjang dikelompokkan menurut ASAL tagihannya.
   *
   * Kasir klinik membaca satu daftar berisi biaya administrasi, tarif
   * konsultasi, tindakan, dan obat bercampur menurut waktu dicatat. Yang
   * ditanya pasien di depan loket hampir selalu satu dari dua: "obatnya berapa"
   * atau "tindakannya yang mana". Menjawabnya dari daftar bercampur berarti
   * menelusuri baris satu per satu sambil orangnya menunggu.
   *
   * Judul kelompok hanya muncul kalau memang ada lebih dari satu kelompok:
   * di apotek seluruh keranjang berisi obat, dan satu judul untuk satu-satunya
   * kelompok cuma menambah baris yang tidak memberi tahu apa pun.
   */
  const berkelompok = useMemo(() => {
    const kenal = new Set<string>(URUT_KELOMPOK)
    return URUT_KELOMPOK
      .map(id => ({
        id,
        // Jenis yang tidak dikenali jatuh ke "Lainnya", bukan hilang. Daftar
        // harfiah yang ketinggalan sudah menggigit lima kali di project ini,
        // dan di sini yang hilang adalah baris tagihan.
        isi: keranjang.filter(k => (kenal.has(k.jenis || '') ? k.jenis : 'lainnya') === id),
      }))
      .filter(g => g.isi.length > 0)
  }, [keranjang])

  // Labelnya dibaca saat render, bukan ikut masuk ke memo di atas: kalau ikut,
  // menukar bahasa ID/EN tidak mengubah judul kelompok sampai keranjangnya
  // kebetulan berubah.
  const labelKelompok: Record<string, string> = {
    administrasi: t('Administrasi', 'Administration'),
    konsultasi:   t('Konsultasi', 'Consultation'),
    tindakan:     t('Tindakan & layanan', 'Procedures & services'),
    penunjang:    t('Lab & radiologi', 'Lab & imaging'),
    obat:         t('Obat & farmasi', 'Medicines & pharmacy'),
    lainnya:      t('Lainnya', 'Other'),
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const KARTU = 'bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] rounded-xl shadow-sm'
  const adaHasil = hasil.obat.length > 0 || hasil.jasa.length > 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Kasir', 'Cashier')}</h1>
        <p className="text-[var(--ink-soft)] text-sm">
          {t('Penjualan obat dan layanan.', 'Medicine and service sales.')}{' '}
          <span className="text-[var(--ink-faint)]">
            F3 {t('cari', 'search')} · F2 {t('bayar', 'pay')} · Enter {t('masukkan hasil teratas', 'add the top result')}
          </span>
        </p>
      </div>

      {terkunciSuper && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{t('Transaksi dikunci', 'Transactions locked')}</p>
            <p className="text-amber-700">
              {t('Pemilih faskes di atas masih menampilkan semua apotek. Pilih satu apotek supaya transaksi tidak memotong stok apotek lain.',
                 'The facility picker above still shows all pharmacies. Pick one so the sale does not deduct another pharmacy stock.')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className={`${KARTU} p-4`}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                ref={cariRef}
                value={cari}
                onChange={e => setCari(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // Cocokan barcode persis SELALU menang atas hasil teratas.
                    if (hasil.pindai) { tambahObat(hasil.pindai); setCari('') }
                    else if (hasil.obat[0]) tambahObat(hasil.obat[0])
                    else if (hasil.jasa[0]) tambahJasa(hasil.jasa[0])
                  }
                  if (e.key === 'Escape') setCari('')
                }}
                placeholder={t('Pindai barcode, atau cari obat dan layanan lalu tekan Enter…', 'Scan a barcode, or search a medicine or service then press Enter…')}
                className={inputCls + ' pl-9 py-2.5'}
              />
            </div>
            {cari && (
              <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                {!adaHasil && (
                  <p className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">
                    {t('Tidak ada yang cocok.', 'Nothing matches.')}
                  </p>
                )}
                {hasil.obat.map((p, i) => {
                  const habis = (p.stok_total ?? 0) <= 0
                  return (
                    <button key={p.id} onClick={() => tambahObat(p)} disabled={habis}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition ${
                        habis ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--surface-2)]'
                      } ${i === 0 ? 'ring-1 ring-[var(--brand)]/30' : ''}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--ink)] truncate">{p.nama_obat}</div>
                        <div className="text-xs text-[var(--ink-faint)]">
                          {p.nama_generik ? p.nama_generik + ' · ' : ''}
                          <span className="num">{t('stok', 'stock')} {angka(p.stok_total)}</span>
                          {habis ? ` · ${t('habis', 'out of stock')}` : ''}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[var(--brand)] num shrink-0">{rupiah(p.harga_jual)}</div>
                    </button>
                  )
                })}
                {hasil.jasa.map(s => (
                  <button key={'svc-' + s.id} onClick={() => tambahJasa(s)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-left transition">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--ink)] truncate">{s.nama}</div>
                      <div className="text-xs text-[var(--brand-soft)] inline-flex items-center gap-1">
                        <HeartPulse size={11} /> {t('Layanan Jasa', 'Service')}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-[var(--brand)] num shrink-0">{rupiah(s.harga)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={TBL_WRAP}>
            <table className={TBL}>
              <thead className={THEAD}>
                <tr>
                  <th className={TH_L}>{t('Produk', 'Product')}</th>
                  <th className={TH_C}>Qty</th>
                  <th className={TH_R}>{t('Harga', 'Price')}</th>
                  <th className={TH_R}>Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {keranjang.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--ink-faint)]">
                    {t('Keranjang kosong. Cari obat di kotak di atas.', 'Cart is empty. Search for a medicine above.')}
                  </td></tr>
                ) : berkelompok.flatMap(g => [
                  ...(berkelompok.length > 1 ? [(
                    <tr key={'h-' + g.id} className="bg-[var(--surface-2)]/60">
                      <td colSpan={3} className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                        {labelKelompok[g.id]}
                      </td>
                      <td className="px-4 py-1.5 text-right text-[11px] font-semibold text-[var(--ink-soft)] num">
                        {rupiah(g.isi.reduce((a, b) => a + b.harga_jual * b.jumlah, 0))}
                      </td>
                      <td />
                    </tr>
                  )] : []),
                  ...g.isi.map(item => (
                  <tr key={item.id} className={TR}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--ink)]">{item.nama_obat}</div>
                      <div className="text-xs text-[var(--ink-faint)]">
                        {item.is_jasa
                          ? t('Layanan jasa', 'Service')
                          : <>{item.kode ? <span className="num">{item.kode} · </span> : null}<span className="num">{t('stok', 'stock')} {angka(item.stok_total)}</span></>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => ubahJumlah(item.id, item.jumlah - 1)}
                          aria-label={t('Kurangi', 'Decrease')}
                          className="w-6 h-6 rounded bg-[var(--surface-2)] text-[var(--brand)] font-bold text-xs">−</button>
                        <input type="number" min={1} max={item.is_jasa ? undefined : item.stok_total} value={item.jumlah}
                          onChange={e => ubahJumlah(item.id, +e.target.value)}
                          className="w-14 text-center text-sm border border-[var(--line)] rounded px-1 py-0.5 num focus:outline-none focus:ring-1 focus:ring-[var(--brand)]" />
                        <button onClick={() => {
                          if (!item.is_jasa && item.jumlah + 1 > item.stok_total) {
                            kabar(t(`Stok ${item.nama_obat} hanya ${item.stok_total}.`, `Only ${item.stok_total} of ${item.nama_obat} in stock.`)); return
                          }
                          ubahJumlah(item.id, item.jumlah + 1)
                        }}
                          aria-label={t('Tambah', 'Increase')}
                          className="w-6 h-6 rounded bg-[var(--surface-2)] text-[var(--brand)] font-bold text-xs">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--ink-soft)] num">{rupiah(item.harga_jual)}</td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--ink)] num">{rupiah(item.harga_jual * item.jumlah)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setKeranjang(keranjang.filter(k => k.id !== item.id))}
                        aria-label={t('Hapus', 'Remove')}
                        className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className={`${KARTU} p-5 lg:sticky lg:top-4`}>
            <h3 className="font-semibold text-[var(--ink)] mb-4">{t('Ringkasan Transaksi', 'Transaction Summary')}</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ink-soft)]">{t('Total Item', 'Total Items')}</span>
                <span className="text-[var(--ink)] num">{angka(keranjang.reduce((a, b) => a + b.jumlah, 0))} {t('item', 'items')}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-[var(--line-soft)] pt-2">
                <span className="text-[var(--brand)]">Total</span>
                <span className="text-[var(--brand)] num">{rupiah(total)}</span>
              </div>
            </div>

            {!adaGolongan && (
              <label className="mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-2)] transition">
                <input type="checkbox" checked={isResep} onChange={e => setIsResep(e.target.checked)} className="w-4 h-4 accent-[var(--brand)]" />
                <div>
                  <span className="text-sm font-medium text-[var(--ink)]">{t('Transaksi berupa resep', 'This is a prescription sale')}</span>
                  <p className="text-xs text-[var(--ink-faint)]">{t('Centang untuk mengisi data pasien dan nomor resep.', 'Tick to record patient data and prescription number.')}</p>
                </div>
              </label>
            )}

            {klinik && resepMenunggu.length > 0 && (
              <div className="mb-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                <p className="text-xs font-semibold text-[var(--brand-soft)] mb-1.5">
                  {t('Kunjungan belum dibayar', 'Unpaid visits')}
                </p>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {resepMenunggu.map(r => (
                    <button key={r.id} onClick={() => muatTagihan(r)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border transition ${
                        visitId === r.visit_id ? 'border-[var(--brand)] bg-[var(--surface)]'
                                               : 'border-[var(--line)] hover:bg-[var(--surface)]'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className="num text-xs font-bold text-[var(--brand)] shrink-0">{r.nomor_antre}</span>
                        <span className="text-sm text-[var(--ink)] truncate flex-1">{r.pasien_nama}</span>
                        {r.alergi && <AlertTriangle size={12} className="shrink-0 text-red-600" />}
                        {r.nilai_biaya > 0 && (
                          <span className="num text-[10px] text-[var(--ink-faint)] shrink-0">{rupiah(r.nilai_biaya)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-[var(--ink-faint)] truncate">
                          {r.unit_nama ? `${r.unit_nama} · ` : ''}{r.status}
                        </span>
                        {/* Selama masih ada obat yang belum dipilih farmasi,
                            tagihannya BELUM LENGKAP: baris permintaan terbuka
                            belum punya harga. Menagih sekarang berarti menagih
                            kurang, dan itu bukan soal urutan sopan. */}
                        {r.obat_belum_dipilih > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                            {t(`MENUNGGU FARMASI · ${r.obat_belum_dipilih} obat belum dipilih`,
                               `WAITING FOR PHARMACY · ${r.obat_belum_dipilih} not chosen`)}
                          </span>
                        ) : r.status_resep === 'draf' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--surface-2)] text-[var(--ink-faint)]">
                            {t('RESEP MASIH DRAF', 'PRESCRIPTION DRAFT')}
                          </span>
                        ) : !r.siap_tagih_pada ? (
                          /* Lencana ini dulu HIJAU SECARA BAWAAN: yang tidak
                             sedang menunggu farmasi dianggap siap, jadi pasien
                             yang dokternya masih mengetik tampil sama persis
                             dengan yang pemeriksaannya sudah tuntas. Kasir yang
                             menagih duluan tidak menagih tindakannya, dan
                             kehilangan yang tidak disadari tidak pernah
                             dilaporkan sebagai keluhan. Sejak 0068 hijau
                             menuntut ada yang menyatakannya. */
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--surface-2)] text-[var(--ink-faint)]">
                            {t('MASIH DIPERIKSA', 'STILL IN EXAM')}
                          </span>
                        ) : (
                          <>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">
                              {t('SIAP DITAGIH', 'READY TO BILL')}
                            </span>
                            {r.penunjang_menggantung > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800"
                                title={r.siap_tagih_catatan || ''}>
                                {t(`HASIL BELUM KELUAR · ${r.penunjang_menggantung}`,
                                   `RESULTS PENDING · ${r.penunjang_menggantung}`)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--ink-faint)] mt-1.5 leading-relaxed">
                  {t('Pilih satu untuk memuat tarif, tindakan, dan obatnya sekaligus jadi satu tagihan. Obat luar katalog dan yang stoknya habis tidak ikut, dan itu diberitahukan.',
                     'Pick one to load its charges, procedures, and drugs as a single bill. Off-catalogue and out-of-stock drugs are left out, and you will be told.')}
                </p>
              </div>
            )}

            {/*
              Daftarnya SAMA dengan daftar kunjungan belum dibayar di atas,
              sengaja. Dulu kotak ini punya kueri sendiri yang hanya memuat
              status `obat`, jadi kunjungan yang cuma konsultasi tidak pernah
              muncul sebagai pilihan padahal kotaknya bertanda wajib. Lebih
              buruk: memilih dari daftar atas mengisi `visitId` tanpa ada
              pilihan yang cocok di sini, jadi kotaknya tetap terbaca sebagai
              belum dipilih padahal kunjungannya sudah terpilih. Dua daftar
              untuk satu hal selalu berakhir begitu.
            */}
            {instalasi && (
              <div className="mb-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                <p className="text-xs font-semibold text-[var(--brand-soft)] mb-1.5">
                  {t('Kunjungan pasien', 'Patient visit')} <span className="text-red-500">*</span>
                </p>
                <select value={visitId} onChange={e => setVisitId(e.target.value)} className={inputCls}>
                  <option value="">{t('Pilih kunjungan…', 'Choose a visit…')}</option>
                  {resepMenunggu.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.nomor_antre} · {k.pasien_nama}{k.unit_nama ? ` · ${k.unit_nama}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--ink-faint)] mt-1.5 leading-relaxed">
                  {resepMenunggu.length === 0
                    ? t('Belum ada kunjungan yang belum dibayar hari ini. Daftarkan pasiennya dulu di menu Kunjungan.',
                        'No unpaid visit today. Register the patient in the Visits screen first.')
                    : t('Bagian farmasi di sini berbentuk instalasi, jadi hanya melayani pasien fasilitas ini. Bisa diubah di Pengaturan.',
                        'The pharmacy unit here is an installation, so it serves only this facility patients. This can be changed in Settings.')}
                </p>
              </div>
            )}

            {perluResep && (
              <div className={`mb-4 p-3 rounded-xl border space-y-2 ${adaGolongan ? 'border-amber-300 bg-amber-50' : 'border-[var(--line)] bg-[var(--surface-2)]'}`}>
                <p className={`text-xs font-semibold ${adaGolongan ? 'text-amber-800' : 'text-[var(--brand-soft)]'}`}>
                  {adaGolongan
                    ? t('Ada obat golongan Narkotika, Psikotropika, atau Prekursor. Data pasien dan resep wajib diisi.',
                         'Contains narcotics, psychotropics, or precursors. Patient and prescription data are required.')
                    : t('Data Pasien dan Resep', 'Patient and Prescription Data')}
                </p>
                {/* Terkunci kalau nomornya datang dari resep yang ditulis
                    dokter. Nomor yang dibuat database lalu boleh ditimpa
                    tangan berhenti menjadi nomor: dua transaksi bisa membawa
                    nomor yang sama, dan tidak ada satu pun yang mengeluh. */}
                <div>
                  <input value={pasien.nomor_resep}
                    onChange={e => setPasien({ ...pasien, nomor_resep: e.target.value })}
                    readOnly={!!resepId}
                    placeholder={t('No. Resep *', 'Prescription No. *')}
                    className={`${inputCls} num ${resepId ? 'bg-[var(--surface-2)] text-[var(--ink-soft)] cursor-not-allowed' : ''}`} />
                  {resepId && (
                    <p className="text-[11px] text-[var(--ink-faint)] mt-1">
                      {t('Nomor dibuat sendiri saat dokter menulis resepnya.',
                         'Generated when the doctor wrote the prescription.')}
                    </p>
                  )}
                </div>
                <input value={pasien.nama_pasien} onChange={e => setPasien({ ...pasien, nama_pasien: e.target.value })}
                  placeholder={t('Nama Pasien *', 'Patient Name *')} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={pasien.kontak_pasien} onChange={e => setPasien({ ...pasien, kontak_pasien: e.target.value })}
                    inputMode="tel" placeholder={t('Kontak (HP)', 'Contact (Phone)')} className={inputCls + ' num'} />
                  <input value={pasien.alamat_pasien} onChange={e => setPasien({ ...pasien, alamat_pasien: e.target.value })}
                    placeholder={t('Alamat', 'Address')} className={inputCls} />
                </div>
              </div>
            )}

            {/* Pelunasan. Hanya di klinik: apotek tidak menagih ke penjamin. */}
            {klinik && (
              <div className="mb-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1.5 block">
                  {t('Dilunasi oleh', 'Settled by')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([['umum', t('Umum', 'Self-pay')], ['bpjs', 'BPJS'], ['asuransi', t('Asuransi', 'Insurance')]] as const).map(([nilai, label]) => (
                    <button key={nilai}
                      onClick={() => {
                        setPenjamin(nilai)
                        // Bawaannya SELURUH tagihan ditagihkan ke penjamin.
                        // Kasir tinggal menurunkannya kalau ada selisih bayar.
                        setDitagihkan(nilai === 'umum' ? 0 : total)
                        if (nilai !== 'asuransi') setAsuransiTrx('')
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                        penjamin === nilai ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]'
                                           : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface)]'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {penjamin === 'asuransi' && (
                  <select value={asuransiTrx} onChange={e => setAsuransiTrx(e.target.value)}
                    className={`${inputCls} mt-2`}>
                    <option value="">{t('Pilih asuransi…', 'Choose insurer…')}</option>
                    {daftarAsuransi.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
                  </select>
                )}

                {penjamin !== 'umum' && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                      {t('Ditagihkan ke penjamin (Rp)', 'Billed to payer (Rp)')}
                    </label>
                    <input type="text" inputMode="numeric"
                      value={ditagihkan ? angka(ditagihkan) : ''}
                      onChange={e => setDitagihkan(Math.min(+e.target.value.replace(/\D/g, '') || 0, total))}
                      className={`${inputCls} num`} />
                    {/* Angka yang dipakai mencocokkan laci sore hari. */}
                    <p className="text-[11px] text-[var(--ink-faint)] mt-1 leading-relaxed">
                      {t(`Pasien membayar tunai ${rupiah(Math.max(total - ditagihkan, 0))}. Sisanya jadi piutang ke penjamin dan TIDAK masuk laci kasir.`,
                         `The patient pays ${rupiah(Math.max(total - ditagihkan, 0))} in cash. The rest becomes a receivable and does NOT enter the till.`)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-3">
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Metode Pembayaran', 'Payment Method')}</label>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {METODE.map(m => (
                  <button key={m} onClick={() => setMetode(m)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${metode === m ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]' : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'}`}>
                    {m}
                  </button>
                ))}
              </div>

              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Bayar (Rp)', 'Pay (Rp)')}</label>
              <input
                ref={bayarRef}
                type="text" inputMode="numeric"
                value={bayar ? angka(bayar) : ''}
                onChange={e => setBayar(+e.target.value.replace(/\D/g, '') || 0)}
                onKeyDown={e => { if (e.key === 'Enter') proses() }}
                onDoubleClick={() => setBayar(total)}
                placeholder="0"
                className={inputCls + ' py-2.5 num'}
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <button onClick={() => setBayar(total)}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)] transition">
                  {t('Uang pas', 'Exact')}
                </button>
                {[50000, 100000].map(n => n > total && (
                  <button key={n} onClick={() => setBayar(n)}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)] transition num">
                    {angka(n)}
                  </button>
                ))}
              </div>
            </div>

            {bayar > 0 && (
              <div className="flex justify-between text-sm font-semibold text-green-600 mb-4">
                <span>{t('Kembalian', 'Change')}</span>
                <span className="num">{rupiah(Math.max(0, bayar - total))}</span>
              </div>
            )}

            <button onClick={proses} disabled={sibuk || terkunciLangganan || terkunciSuper}
              className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
              {terkunciLangganan ? t('Langganan berakhir', 'Subscription ended')
                : terkunciSuper ? t('Pilih apotek dulu', 'Select a pharmacy first')
                : sibuk ? t('Memproses…', 'Processing…') : t('Proses Transaksi', 'Process Transaction')}
            </button>
            <button onClick={kosongkan}
              className="w-full mt-2 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] transition">
              {t('Batal / Reset', 'Cancel / Reset')}
            </button>
          </div>
        </div>
      </div>

      {struk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-4 border-b border-dashed border-[var(--line)] pb-4">
                <h2 className="font-bold text-lg text-[var(--brand)]">{app.namaFaskes}</h2>
                <p className="text-xs text-[var(--ink-soft)] mt-1">{app.settingsData.alamat}</p>
                <p className="text-xs text-[var(--ink-soft)]">{app.settingsData.nomor_telepon}</p>
                {app.settingsData.nomor_ijin && <p className="text-xs text-[var(--ink-faint)] mt-1">SIA: {app.settingsData.nomor_ijin}</p>}
              </div>
              <div className="text-xs text-[var(--ink-soft)] mb-3 flex justify-between gap-2 num">
                <span>{struk.nomor_transaksi}</span>
                <span>{tanggalJam(struk.created_at)}</span>
              </div>
              <div className="border-t border-dashed border-[var(--line)] pt-3 space-y-1.5">
                {strukItems.map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between gap-2 text-[var(--ink)] font-medium">
                      <span>{item.nama_obat}</span>
                      <span className="num shrink-0">{rupiah(item.subtotal)}</span>
                    </div>
                    <div className="text-[var(--ink-faint)] num">{angka(item.jumlah)} x {rupiah(item.harga_jual)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-[var(--line)] mt-3 pt-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-[var(--brand)]">
                  <span>Total</span><span className="num">{rupiah(struk.total)}</span>
                </div>
                <div className="flex justify-between text-[var(--ink-soft)]">
                  <span>{t('Bayar', 'Paid')} ({struk.metode_bayar || 'Tunai'})</span><span className="num">{rupiah(struk.bayar)}</span>
                </div>
                <div className="flex justify-between text-[var(--ink-soft)]">
                  <span>{t('Kembalian', 'Change')}</span><span className="num">{rupiah(struk.kembalian)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-[var(--ink-faint)] mt-4 border-t border-dashed border-[var(--line)] pt-3">
                {t('Terima kasih atas kunjungan Anda', 'Thank you for your visit')}
              </p>
            </div>
            <div className="flex gap-2 p-4 border-t border-[var(--line-soft)]">
              <button onClick={() => { setStruk(null); setStrukItems([]); cariRef.current?.focus() }}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Tutup', 'Close')}
              </button>
              <button onClick={cetakStruk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                {t('Cetak', 'Print')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
