'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Pill, PackageOpen, LogOut, Settings, Truck,
  FlaskConical, ClipboardList, Pencil,
  Receipt, CreditCard, Building2, Users, ChevronRight,
  UserPlus, Trash2, Upload, ShieldCheck, Check, ArrowLeft, Menu, X, Download, Database, HeartPulse,
  Search, AlertTriangle, LayoutGrid
} from 'lucide-react'
import { supabase, createSignupClient } from '../../lib/supabase'
import { useLang, LangToggle } from '../../lib/i18n'
import { useTheme, ThemePicker, ThemeToggle } from '../../lib/theme'
import { getSessionContext, pesanError, type SessionContext } from '../../lib/session'
import { FULL_PLAN, lockedModules } from '../../lib/plan'
import { subscriptionState, isLapsed, pesanLangganan } from '../../lib/subscription'
import { parseCSV, unduhCSV } from '../../lib/csv'
import { menuItems, menuSuper, ROLE_PAGES, ROLE_LABELS, RUTE_SIAP } from '../../lib/navigation'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR, TD, KATEGORI_BADGE } from '../../lib/ui'

export default function Dashboard() {
  const { t, lang } = useLang()
  const { theme, applyCompanyTheme } = useTheme()
  const [session, setSession] = useState<SessionContext | null>(null)
  const [activePage, setActivePage] = useState('dashboard')

  /**
   * Jembatan selama pemecahan.
   *
   * `?p=<modul>` membuat halaman monolit ini bisa dibagikan dan disegarkan
   * seperti alamat sungguhan, jauh sebelum modulnya sendiri pindah. Modul yang
   * SUDAH pindah tidak dirender di sini lagi: menunya mengantar ke rutenya.
   */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p')
    const tujuan = [...menuItems, ...menuSuper].find(m => m.id === (p || 'dashboard'))
    // Modul yang sudah punya rutenya sendiri tidak dirender di sini lagi. Ini
    // juga yang menangani /dashboard tanpa ?p: Beranda sudah pindah, jadi
    // alamat lama itu mengantar ke sana, bukan menampilkan layar kosong.
    if (tujuan && RUTE_SIAP.has(tujuan.id)) { window.location.replace(tujuan.href); return }
    if (p) setActivePage(p)
  }, [])

  const bukaModul = (id: string) => {
    const tujuan = [...menuItems, ...menuSuper].find(m => m.id === id)
    if (tujuan && RUTE_SIAP.has(id)) { window.location.href = tujuan.href; return }
    setActivePage(id)
    const u = new URL(window.location.href)
    u.searchParams.set('p', id)
    window.history.replaceState(null, '', u)
  }
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nama_obat: '', nama_generik: '', kandungan: '',
    kategori: 'bebas', satuan: 'Tablet', isi_kemasan: 1,
    harga_beli: 0, harga_jual: 0, stok_total: 0, stok_minimum: 10
  })
  const [keranjang, setKeranjang] = useState<any[]>([])
  const [bayar, setBayar] = useState(0)
  const [metodeBayar, setMetodeBayar] = useState('Tunai')
  const [pasienForm, setPasienForm] = useState({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' })
  // Filter kolom produk
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStok, setFilterStok] = useState('')
  // Filter laporan penjualan / metode bayar
  // Kasir: tandai transaksi resep
  const [isResep, setIsResep] = useState(false)
  const [importInfo, setImportInfo] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState<string | null>(null)
  const [migrasiCompany, setMigrasiCompany] = useState('')
  const [prosesLoading, setProsesLoading] = useState(false)
  const [showStruk, setShowStruk] = useState(false)
  const [lastTrx, setLastTrx] = useState<any>(null)
  const [lastItems, setLastItems] = useState<any[]>([])
  const [settingsData, setSettingsData] = useState<any>({
    nama_apotek: '', alamat: '', nomor_ijin: '', nomor_telepon: ''
  })
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [editProduk, setEditProduk] = useState<any>(null)
  const [produkSuppliers, setProdukSuppliers] = useState<any[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [expiredAlerts, setExpiredAlerts] = useState<any[]>([])
  const [showProdukDetail, setShowProdukDetail] = useState<any>(null)
  const [produkDetailTab, setProdukDetailTab] = useState('info')
  const [produkBatches, setProdukBatches] = useState<any[]>([])
  const [produkTrxOut, setProdukTrxOut] = useState<any[]>([])
  const [produkTrxIn, setProdukTrxIn] = useState<any[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [currentModules, setCurrentModules] = useState<string[] | null>(null)
  const [isSuper, setIsSuper] = useState(false)
  const [superViewCompany, setSuperViewCompany] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companies, setCompanies] = useState<any[]>([])
  const [authName, setAuthName] = useState('')
  const [settingsTab, setSettingsTab] = useState('profil')
  const [users, setUsers] = useState<any[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ nama: '', email: '', password: '', role: 'kasir', modules: ROLE_PAGES['kasir'] as string[] })
  const [editUser, setEditUser] = useState<any>(null)
  const [savingUser, setSavingUser] = useState(false)

  // Kuota dibaca dari `v_company_quota`: view yang sama yang dipakai trigger
  // penegak kuota. Kalau layar menghitung sendiri, angkanya cepat atau lambat
  // berbeda dari angka yang dipakai menolak.
  const [kuota, setKuota] = useState<any>(null)
  const fetchKuota = async () => {
    const { data } = await supabase.from('v_company_quota').select('*').maybeSingle()
    setKuota(data)
  }
  useEffect(() => { if (activePage === 'pengaturan' && settingsTab === 'langganan') fetchKuota() }, [activePage, settingsTab])

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { if (activePage === 'produk') { fetchProducts(); fetchExpiredAlerts() } }, [activePage])
  // Kasir masih memerlukan daftar layanan untuk dijual. Selama halaman ini
  // belum ikut pindah, ia mengambilnya sendiri.
  const [services, setServices] = useState<any[]>([])
  useEffect(() => {
    if (activePage !== 'transaksi') return
    scopeQ(supabase.from('services').select('*').order('nama')).then(({ data }: any) => setServices(data || []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, superViewCompany])
  useEffect(() => { if (activePage === 'pengaturan') fetchUsers() }, [activePage])
  useEffect(() => { if (activePage === 'migrasi' && isSuper) fetchCompanies() }, [activePage, isSuper])
  useEffect(() => { if (isSuper) fetchCompanies() }, [isSuper])
  // Saat super admin ganti "lihat sebagai apotek", muat ulang data halaman aktif
  useEffect(() => {
    if (!isSuper) return
    fetchSettings()
    if (activePage === 'produk') { fetchProducts(); fetchExpiredAlerts() }
    else if (activePage === 'pengaturan') fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superViewCompany])

  // Filter query untuk super admin: batasi ke apotek yang sedang "diintip"
  const scopeQ = (q: any) => (isSuper && superViewCompany) ? q.eq('company_id', superViewCompany) : q
  useEffect(() => { try { setSidebarCollapsed(localStorage.getItem('sw_sidebar_collapsed') === '1') } catch {} }, [])

  // Cek sesi & tentukan role saat masuk dashboard.
  //
  // Satu panggilan `my_context()` menggantikan tiga permintaan tabel yang dulu
  // dilakukan berturut-turut. Yang pertama di antaranya membaca `super_admins`
  // langsung, dan itu memaksa daftar super admin bisa dibaca semua orang yang
  // login: lubang yang ditutup di migrasi 0002.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setAuthName((user.user_metadata as any)?.nama_lengkap || user.email || '')

      let ctx = await getSessionContext()
      if (!ctx.signedIn) { window.location.href = '/'; return }

      // Pendaftaran yang tertunda karena konfirmasi email diselesaikan di sini.
      // Nama apoteknya ikut di metadata akun sejak halaman daftar, jadi tetap
      // ada walaupun orang kembali berhari-hari kemudian lewat tautan email.
      if (!ctx.isSuper && !ctx.company) {
        const namaApotek = (user.user_metadata as any)?.nama_apotek
        if (namaApotek) {
          await supabase.rpc('register_apotek', {
            p_nama_apotek: namaApotek,
            p_nama_admin: (user.user_metadata as any)?.nama_lengkap || '',
          })
          ctx = await getSessionContext()
        }
      }
      setSession(ctx)

      if (ctx.isSuper) {
        setIsSuper(true)
        setCurrentRole('superadmin')
        setCurrentModules(null)
        return
      }

      // Anggota tim yang dinonaktifkan pemiliknya tidak boleh masuk. Ini
      // diperiksa lagi oleh RLS di setiap permintaan data, jadi kalaupun
      // pemeriksaan di sini dilewati, tidak ada data yang bisa dibaca.
      if (ctx.memberStatus && ctx.memberStatus !== 'aktif') {
        alert(t('Akun Anda dinonaktifkan. Hubungi pemilik apotek.', 'Your account has been deactivated. Contact the pharmacy owner.'))
        await supabase.auth.signOut(); window.location.href = '/'; return
      }

      if (ctx.company) {
        setCompanyName(ctx.company.nama || '')
        // Tema bawaan apotek dipakai kalau perangkat ini belum punya pilihan
        // sendiri, supaya semua kasir di satu apotek melihat tampilan yang sama.
        applyCompanyTheme(ctx.company.theme)
        setSettingsData((prev: any) => prev.nama_apotek ? prev : { ...prev, nama_apotek: ctx.company!.nama || '' })
      }

      setCurrentRole(ctx.role)
      setCurrentModules(ctx.modules)
    })()
  }, [])

  // ── Kerangka aplikasi ──
  const [accountOpen, setAccountOpen] = useState(false)

  /**
   * Pilihan lipat sidebar milik PENGGUNA, terpisah dari lipat otomatis.
   *
   * Tanpa pemisahan ini, mode fokus akan menimpa pilihan orang secara permanen:
   * masuk ke Kasir sekali, dan sidebar tetap menyempit di semua halaman lain
   * sesudahnya karena keadaan terakhirnya sudah ikut tersimpan.
   */
  const pinRef = useRef<boolean>(false)
  useEffect(() => {
    try { pinRef.current = localStorage.getItem('sw_sidebar_collapsed') === '1' } catch {}
  }, [])

  /**
   * Mode fokus: sidebar menyempit sendiri di halaman yang butuh layar lebar dan
   * perhatian penuh. Kasir adalah contohnya: di sana orang sedang berhadapan
   * dengan pembeli, bukan sedang mencari menu.
   */
  const HALAMAN_FOKUS = ['transaksi']
  useEffect(() => {
    setSidebarCollapsed(HALAMAN_FOKUS.includes(activePage) ? true : pinRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage])

  /** Nama yang dipakai di sidebar, topbar mobile, dan menu akun. */
  const namaFaskes = isSuper
    ? (companies.find((c: any) => c.id === superViewCompany)?.nama || 'Super Admin')
    : (settingsData.nama_apotek || companyName || 'Apotek Saya')

  const langgananState = subscriptionState(session?.company ?? null)
  const langgananPesan = pesanLangganan(langgananState, t)
  const kasirTerkunci = isLapsed(langgananState)
  const fitur = session?.company?.features ?? FULL_PLAN

  // Akses = daftar modul user (jika diatur) ; kalau kosong pakai default role.
  // Super admin: akses penuh + halaman Companies. Migrasi Data menyatu dengan Pengaturan.
  const allowedPages = (() => {
    if (isSuper) return [...menuItems.map(m => m.id), 'klien', 'migrasi']
    if (!currentRole) return []
    const base = currentModules && currentModules.length ? currentModules : (ROLE_PAGES[currentRole] || ['dashboard'])
    const withMigrasi = base.includes('pengaturan') ? [...base, 'migrasi'] : base
    // Modul yang tidak dibuka paket disaring PALING AKHIR, sesudah hak akses
    // per pengguna. Urutan ini penting: pemilik boleh memberi kasir akses ke
    // Pembayaran Faktur, tapi paket Starter tetap tidak membukanya untuk
    // siapa pun di apotek itu.
    const terkunci = lockedModules(fitur)
    return withMigrasi.filter(p => !terkunci.includes(p))
  })()

  /** Menu yang benar-benar tampil di sidebar, termasuk halaman khusus Super Admin. */
  const navItems = [
    ...menuItems.filter(i => allowedPages.includes(i.id)),
    ...(isSuper ? menuSuper : []),
  ]

  const judulHalaman = (() => {
    const m = navItems.find(i => i.id === activePage)
    if (m) return lang === 'en' ? m.en : m.label
    return activePage === 'migrasi' ? t('Migrasi Data', 'Data Migration') : 'Sehatera'
  })()

  // Jika role tidak boleh membuka halaman aktif, arahkan ke halaman pertama yang diizinkan
  useEffect(() => {
    if (currentRole && !allowedPages.includes(activePage)) bukaModul(allowedPages[0] || 'dashboard')
  }, [currentRole, activePage])

  const fetchSettings = async () => {
    if (isSuper && !superViewCompany) return // banyak apotek → jangan ambil settings global
    const { data } = await scopeQ(supabase.from('settings').select('*')).maybeSingle()
    if (data) setSettingsData(data)
  }

  const saveSettings = async () => {
    const payload = {
      nama_apotek: settingsData.nama_apotek,
      sektor_usaha: settingsData.sektor_usaha,
      kota: settingsData.kota,
      alamat: settingsData.alamat,
      nomor_ijin: settingsData.nomor_ijin,
      nomor_telepon: settingsData.nomor_telepon,
      email: settingsData.email,
      logo_url: settingsData.logo_url,
      nama_apoteker: settingsData.nama_apoteker,
      nomor_sipa: settingsData.nomor_sipa,
    }
    const { data: existing } = await supabase.from('settings').select('id').maybeSingle()
    const { error } = existing
      ? await supabase.from('settings').update(payload).eq('id', existing.id)
      : await supabase.from('settings').insert([payload])
    if (!error) { alert(t('✅ Data apotek berhasil disimpan!', '✅ Pharmacy data saved successfully!')); fetchSettings() }
    else alert('Error: ' + error.message)
  }

  // ── Manajemen pengguna / role ──
  const fetchUsers = async () => {
    const { data } = await scopeQ(supabase.from('app_users').select('*').order('created_at', { ascending: true }))
    setUsers(data || [])
  }

  const openTambahUser = () => {
    setUserForm({ nama: '', email: '', password: '', role: 'kasir', modules: ROLE_PAGES['kasir'] })
    setShowUserForm(true)
  }

  const handleTambahUser = async () => {
    if (!userForm.nama.trim() || !userForm.email.trim() || !userForm.password) { alert(t('Email, password, dan nama wajib diisi', 'Email, password, and name are required')); return }
    if (userForm.password.length < 6) { alert(t('Password minimal 6 karakter', 'Password must be at least 6 characters')); return }
    setSavingUser(true)
    // 1. Buat akun login (pakai client isolasi agar sesi admin tidak berganti)
    const tmp = createSignupClient()
    const { error: authErr } = await tmp.auth.signUp({
      email: userForm.email.trim(),
      password: userForm.password,
      options: { data: { nama_lengkap: userForm.nama.trim() } },
    })
    if (authErr && !/already registered|already been registered/i.test(authErr.message)) {
      setSavingUser(false); alert(t('Gagal membuat akun login: ', 'Failed to create login account: ') + authErr.message); return
    }
    // 2. Simpan ke direktori pengguna + hak akses modul
    const { error } = await supabase.from('app_users').insert([{
      nama: userForm.nama.trim(), email: userForm.email.trim().toLowerCase(),
      role: userForm.role, status: 'aktif', modules: userForm.modules,
    }])
    setSavingUser(false)
    if (error) { alert(t('Akun login dibuat, tapi gagal simpan data: ', 'Login account created, but failed to save data: ') + error.message); return }
    setShowUserForm(false)
    fetchUsers()
    alert(t('✅ Pengguna dibuat. User bisa langsung login dengan email & password tersebut.', '✅ User created. They can sign in immediately with that email & password.'))
  }

  const handleUpdateUser = async () => {
    if (!editUser) return
    const { error } = await supabase.from('app_users').update({
      nama: editUser.nama, email: editUser.email, role: editUser.role, status: editUser.status,
      modules: Array.isArray(editUser.modules) ? editUser.modules : [],
    }).eq('id', editUser.id)
    if (error) { alert('Error: ' + error.message); return }
    setEditUser(null)
    fetchUsers()
  }

  // Toggle satu modul pada userForm / editUser
  const toggleFormModule = (target: 'new' | 'edit', pageId: string) => {
    if (target === 'new') {
      const has = userForm.modules.includes(pageId)
      setUserForm({ ...userForm, modules: has ? userForm.modules.filter(m => m !== pageId) : [...userForm.modules, pageId] })
    } else if (editUser) {
      const mods: string[] = Array.isArray(editUser.modules) ? editUser.modules : []
      const has = mods.includes(pageId)
      setEditUser({ ...editUser, modules: has ? mods.filter(m => m !== pageId) : [...mods, pageId] })
    }
  }

  const toggleUserStatus = async (u: any) => {
    await supabase.from('app_users').update({ status: u.status === 'aktif' ? 'nonaktif' : 'aktif' }).eq('id', u.id)
    fetchUsers()
  }

  const handleDeleteUser = async (u: any) => {
    if (!confirm(t(`Hapus pengguna "${u.nama}"?`, `Delete user "${u.nama}"?`))) return
    await supabase.from('app_users').delete().eq('id', u.id)
    fetchUsers()
  }

  const handleLogoUpload = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { alert(t('Ukuran maksimal 4MB', 'Maximum size is 4MB')); return }
    const reader = new FileReader()
    reader.onload = () => setSettingsData({ ...settingsData, logo_url: reader.result as string })
    reader.readAsDataURL(file)
  }

  // ── Super admin: kelola apotek (companies) ──
  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies')
      .select('*, plans(code, name, price_monthly)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setCompanies(data || [])
  }


  // ── Migrasi Data (import/export CSV) ──
  const importProduk = async (file: File) => {
    const cid = (isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('produk'); setImportInfo(p => ({ ...p, produk: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama_obat)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, produk: 'Tidak ada baris valid (kolom nama_obat kosong).' })); return }
      const payload = valid.map(r => {
        const o: any = {
          nama_obat: r.nama_obat, nama_generik: r.nama_generik || null, kandungan: r.kandungan || null,
          kategori: (r.kategori || 'bebas').toLowerCase().replace(/\s+/g, '_'),
          satuan: r.satuan || 'Tablet', isi_kemasan: +(r.isi_kemasan || 1) || 1,
          harga_beli: +(r.harga_beli || 0) || 0, harga_jual: +(r.harga_jual || 0) || 0,
          stok_total: +(r.stok_total || 0) || 0, stok_minimum: +(r.stok_minimum || 10) || 10,
        }
        if (r.kode) o.kode = r.kode
        if (cid) o.company_id = cid
        return o
      })
      const { error } = await supabase.from('products').insert(payload)
      if (error) { setImportInfo(p => ({ ...p, produk: 'Error: ' + error.message })); return }
      setImportInfo(p => ({ ...p, produk: `✅ ${payload.length} produk berhasil diimpor.` }))
      if (activePage === 'produk') fetchProducts()
    } catch (e: any) { setImportInfo(p => ({ ...p, produk: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importSupplier = async (file: File) => {
    const cid = (isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('supplier'); setImportInfo(p => ({ ...p, supplier: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama_supplier)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, supplier: 'Tidak ada baris valid (kolom nama_supplier kosong).' })); return }
      const normJenis = (v: string) => {
        const s = (v || '').trim().toLowerCase().replace(/[\s-]/g, '')
        if (!s || s === 'pbf') return 'PBF'
        if (s.includes('sub') || s.includes('distributor')) return 'Subdistributor'
        return 'Lainnya'
      }
      const payload = valid.map(r => ({ nama_supplier: r.nama_supplier, jenis: normJenis(r.jenis), alamat: r.alamat || null, telepon: r.telepon || null, email: r.email || null, ...(cid ? { company_id: cid } : {}) }))
      const { error } = await supabase.from('suppliers').insert(payload)
      if (error) { setImportInfo(p => ({ ...p, supplier: 'Error: ' + error.message })); return }
      setImportInfo(p => ({ ...p, supplier: `✅ ${payload.length} supplier berhasil diimpor.` }))
    } catch (e: any) { setImportInfo(p => ({ ...p, supplier: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importStok = async (file: File) => {
    const cid = (isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('stok'); setImportInfo(p => ({ ...p, stok: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => (r.kode_produk || r.kode) && r.stok_batch)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, stok: 'Tidak ada baris valid (butuh kode_produk & stok_batch).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        const kode = (r.kode_produk || r.kode).trim()
        let pq = supabase.from('products').select('id, stok_total').eq('kode', kode)
        if (cid) pq = pq.eq('company_id', cid)
        const { data: prod } = await pq.maybeSingle()
        if (!prod) { gagal.push(kode); continue }
        const qty = +(r.stok_batch || 0) || 0
        await supabase.from('product_batches').insert([{ product_id: prod.id, batch_number: r.batch_number || null, expired_date: r.expired_date || null, stok_batch: qty, ...(cid ? { company_id: cid } : {}) }])
        await supabase.from('products').update({ stok_total: (prod.stok_total || 0) + qty }).eq('id', prod.id)
        ok++
      }
      setImportInfo(p => ({ ...p, stok: `✅ ${ok} batch stok awal diimpor.` + (gagal.length ? ` ${gagal.length} kode tidak ditemukan: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, stok: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importMapping = async (file: File) => {
    const cid = (isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('mapping'); setImportInfo(p => ({ ...p, mapping: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => (r.kode_produk || r.kode) && (r.nama_supplier || r.kode_supplier))
      if (valid.length === 0) { setImportInfo(p => ({ ...p, mapping: 'Tidak ada baris valid (butuh kode_produk & nama_supplier).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        const kode = (r.kode_produk || r.kode).trim()
        let pq = supabase.from('products').select('id').eq('kode', kode)
        if (cid) pq = pq.eq('company_id', cid)
        const { data: prod } = await pq.maybeSingle()
        if (!prod) { gagal.push(kode); continue }
        let sup: any = null
        if (r.kode_supplier) { let sq = supabase.from('suppliers').select('id').eq('kode', r.kode_supplier.trim()); if (cid) sq = sq.eq('company_id', cid); const { data } = await sq.maybeSingle(); sup = data }
        if (!sup && r.nama_supplier) { let sq = supabase.from('suppliers').select('id').ilike('nama_supplier', r.nama_supplier.trim()); if (cid) sq = sq.eq('company_id', cid); const { data } = await sq.maybeSingle(); sup = data }
        if (!sup) { gagal.push(kode + '→' + (r.nama_supplier || r.kode_supplier)); continue }
        const { data: exists } = await supabase.from('product_suppliers').select('id').eq('product_id', prod.id).eq('supplier_id', sup.id).maybeSingle()
        if (!exists) await supabase.from('product_suppliers').insert([{ product_id: prod.id, supplier_id: sup.id, ...(cid ? { company_id: cid } : {}) }])
        ok++
      }
      setImportInfo(p => ({ ...p, mapping: `✅ ${ok} mapping produk–supplier diimpor.` + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, mapping: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importFakturAwal = async (file: File) => {
    const cid = (isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('fakturawal'); setImportInfo(p => ({ ...p, fakturawal: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nomor_faktur && r.nama_supplier)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, fakturawal: 'Tidak ada baris valid (butuh nomor_faktur & nama_supplier).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        let sq = supabase.from('suppliers').select('id').ilike('nama_supplier', r.nama_supplier.trim())
        if (cid) sq = sq.eq('company_id', cid)
        const { data: sup } = await sq.maybeSingle()
        if (!sup) { gagal.push(r.nomor_faktur + '→' + r.nama_supplier); continue }
        const tf = r.tanggal_faktur || new Date().toISOString().split('T')[0]
        const top = +(r.term_of_payment || 0) || 0
        let jt = r.tanggal_jatuh_tempo
        if (!jt) { const d = new Date(tf); d.setDate(d.getDate() + top); jt = d.toISOString().split('T')[0] }
        await supabase.from('faktur').insert([{ nomor_faktur: r.nomor_faktur.trim(), supplier_id: sup.id, tanggal_faktur: tf, term_of_payment: top, tanggal_jatuh_tempo: jt, total: +(r.total || 0) || 0, status: 'belum_bayar', ...(cid ? { company_id: cid } : {}) }])
        ok++
      }
      setImportInfo(p => ({ ...p, fakturawal: `✅ ${ok} faktur/hutang awal diimpor.` + (gagal.length ? ` ${gagal.length} supplier tidak ditemukan: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, fakturawal: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  // ── Export / Backup ke CSV ──
  const scopeExport = (q: any) => (isSuper && migrasiCompany) ? q.eq('company_id', migrasiCompany) : q
  const exportProduk = async () => {
    const { data } = await scopeExport(supabase.from('products').select('*').order('kode'))
    const headers = ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum']
    unduhCSV('export_produk.csv', headers, (data || []).map((p: any) => headers.map(h => String(p[h] ?? ''))))
  }
  const exportSupplier = async () => {
    const { data } = await scopeExport(supabase.from('suppliers').select('*').order('kode'))
    const headers = ['kode', 'nama_supplier', 'jenis', 'alamat', 'telepon', 'email']
    unduhCSV('export_supplier.csv', headers, (data || []).map((s: any) => headers.map(h => String(s[h] ?? ''))))
  }
  const exportStok = async () => {
    const { data } = await scopeExport(supabase.from('product_batches').select('*, products(kode)').order('expired_date'))
    const headers = ['kode_produk', 'batch_number', 'expired_date', 'stok_batch']
    unduhCSV('export_stok_batch.csv', headers, (data || []).map((b: any) => [b.products?.kode || '', b.batch_number || '', b.expired_date || '', String(b.stok_batch ?? '')]))
  }
  const exportTransaksi = async () => {
    const { data } = await scopeExport(supabase.from('transactions').select('*').order('created_at', { ascending: false }))
    const headers = ['nomor_transaksi', 'tanggal', 'total', 'bayar', 'kembalian', 'status', 'nama_pasien', 'kontak_pasien', 'alamat_pasien', 'nomor_resep']
    unduhCSV('export_transaksi.csv', headers, (data || []).map((t: any) => [
      t.nomor_transaksi || '', t.created_at || '', String(t.total ?? ''), String(t.bayar ?? ''), String(t.kembalian ?? ''),
      t.status || '', t.nama_pasien || '', t.kontak_pasien || '', t.alamat_pasien || '', t.nomor_resep || '',
    ]))
  }
  const exportFaktur = async () => {
    const { data } = await scopeExport(supabase.from('faktur').select('*, suppliers(nama_supplier), purchase_orders(nomor_po)').order('tanggal_faktur', { ascending: false }))
    const headers = ['nomor_faktur', 'supplier', 'nomor_po', 'tanggal_faktur', 'term_of_payment', 'tanggal_jatuh_tempo', 'total', 'status', 'tanggal_bayar', 'metode_bayar', 'catatan_bayar']
    unduhCSV('export_faktur.csv', headers, (data || []).map((f: any) => [
      f.nomor_faktur || '', f.suppliers?.nama_supplier || '', f.purchase_orders?.nomor_po || '', f.tanggal_faktur || '',
      String(f.term_of_payment ?? ''), f.tanggal_jatuh_tempo || '', String(f.total ?? ''), f.status || '',
      f.tanggal_bayar || '', f.metode_bayar || '', f.catatan_bayar || '',
    ]))
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await scopeQ(supabase.from('products').select('*').order('kode'))
    setProducts(data || [])
    setLoading(false)
  }

  const fetchExpiredAlerts = async () => {
    const today = new Date()
    const in60Days = new Date()
    in60Days.setDate(today.getDate() + 60)
    const { data } = await scopeQ(supabase
      .from('product_batches')
      .select('*, products(nama_obat, kode)')
      .lte('expired_date', in60Days.toISOString().split('T')[0])
      .gt('stok_batch', 0)
      .order('expired_date'))
    setExpiredAlerts(data || [])
  }

  const openProdukDetail = async (produk: any) => {
    setShowProdukDetail(produk)
    setProdukDetailTab('info')
    fetchProdukSuppliers(produk.id)

    // Fetch batches
    const { data: batches } = await supabase
      .from('product_batches')
      .select('*')
      .eq('product_id', produk.id)
      .order('expired_date')
    setProdukBatches(batches || [])

    // Fetch riwayat keluar (transaksi), sort by tanggal transaksi di JS
    // (transaction_items tidak punya kolom created_at sendiri, jadi jangan .order di query)
    const { data: trxOut } = await supabase
      .from('transaction_items')
      .select('*, transactions(nomor_transaksi, created_at, status)')
      .eq('product_id', produk.id)
    setProdukTrxOut((trxOut || []).sort((a: any, b: any) =>
      new Date(b.transactions?.created_at || 0).getTime() - new Date(a.transactions?.created_at || 0).getTime()))

    // Fetch riwayat masuk (PO), sort by tanggal terima di JS
    const { data: trxIn } = await supabase
      .from('po_items')
      .select('*, purchase_orders(nomor_po, tanggal_terima, status, suppliers(nama_supplier))')
      .eq('product_id', produk.id)
    setProdukTrxIn((trxIn || []).sort((a: any, b: any) =>
      new Date(b.purchase_orders?.tanggal_terima || 0).getTime() - new Date(a.purchase_orders?.tanggal_terima || 0).getTime()))
  }

  const fetchSuppliers = async () => {
    const { data } = await scopeQ(supabase.from('suppliers').select('*').order('kode'))
    setSuppliers(data || [])
  }

  // ── Layanan Jasa (services) ──
  const fetchProdukSuppliers = async (productId: string) => {
    const { data } = await supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', productId)
    setProdukSuppliers(data || [])
  }

  const toggleSupplierProduk = async (productId: string, supplierId: string, isActive: boolean) => {
    if (isActive) {
      await supabase.from('product_suppliers').delete().eq('product_id', productId).eq('supplier_id', supplierId)
    } else {
      await supabase.from('product_suppliers').insert([{ product_id: productId, supplier_id: supplierId }])
    }
    fetchProdukSuppliers(productId)
  }

  const handleTambahProduk = async () => {
    const { error } = await supabase.from('products').insert([form])
    if (!error) {
      setShowForm(false)
      setForm({ nama_obat: '', nama_generik: '', kandungan: '', kategori: 'bebas', satuan: 'Tablet', isi_kemasan: 1, harga_beli: 0, harga_jual: 0, stok_total: 0, stok_minimum: 10 })
      fetchProducts()
    }
  }

  const filteredProducts = products.filter(p =>
    p.nama_obat?.toLowerCase().includes(search.toLowerCase()) ||
    p.nama_generik?.toLowerCase().includes(search.toLowerCase()) ||
    p.kandungan?.toLowerCase().includes(search.toLowerCase())
  )

  // Filter tambahan khusus tabel produk (kategori/status/stok)
  const produkFiltered = filteredProducts.filter(p => {
    if (filterKategori && p.kategori !== filterKategori) return false
    if (filterStatus && (p.status || 'aktif') !== filterStatus) return false
    if (filterStok) {
      const stok = p.stok_total ?? 0, min = p.stok_minimum ?? 0
      if (filterStok === 'habis' && stok > 0) return false
      if (filterStok === 'minim' && !(stok > 0 && stok <= min)) return false
      if (filterStok === 'aman' && !(stok > min)) return false
    }
    return true
  })

  const kategoriLabel: Record<string, string> = {
    bebas: 'Bebas', bebas_terbatas: 'Bebas Terbatas', keras: 'Keras',
    suplemen: 'Suplemen', psikotropika: 'Psikotropika', narkotika: 'Narkotika',
    prekursor: 'Prekursor', alkes: 'Alkes', lainnya: 'Lainnya',
  }

  // Spanduk keadaan langganan.
  //
  // Menggantikan layar penuh "Masa Aktif Berakhir" yang dulu MENGUNCI SELURUH
  // aplikasi. Apotek yang masa aktifnya lewat masih punya kewajiban SIPNAP
  // bulan itu, masih perlu mencetak ulang faktur, dan masih perlu melihat kartu
  // stoknya. Menyandera semua itu sampai mereka membayar bukan cuma tidak
  // sopan: itu menghalangi mereka memenuhi kewajiban hukum. Jadi yang berhenti
  // hanya transaksi baru, dan itu sudah ditegakkan di database (migrasi 0003).
  const langgananBanner = langgananPesan && (
    <div
      role={langgananPesan.nada === 'berhenti' ? 'alert' : undefined}
      className={`mb-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${
        langgananPesan.nada === 'berhenti'
          ? 'border-red-300 bg-red-50 text-red-900'
          : langgananPesan.nada === 'peringatan'
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)]'
      }`}
    >
      <AlertTriangle size={17} className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{langgananPesan.judul}</p>
        <p className="text-xs mt-0.5 leading-relaxed opacity-90">{langgananPesan.isi}</p>
      </div>
      <button
        onClick={() => { setActivePage('pengaturan'); setSettingsTab('langganan') }}
        className="ml-auto shrink-0 self-center text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
      >
        {t('Lihat langganan', 'View subscription')}
      </button>
    </div>
  )

  // Tunggu role selesai dimuat sebelum render dashboard (hindari flicker menu)
  if (!currentRole) {
    return (
      <div className="sw-ambient min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="relative w-12 h-12 rounded-2xl bg-[var(--brand)] flex items-center justify-center">
          <FlaskConical size={24} className="text-white" strokeWidth={1.8} />
          <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </div>
        <p className="text-sm text-[var(--ink-soft)]">{t('Memuat akses pengguna…', 'Loading user access…')}</p>
      </div>
    )
  }

  // Konten Migrasi Data, dirender sebagai sub-menu di dalam Pengaturan
  const migrasiCards = [
    { key: 'produk', title: t('Daftar Produk', 'Product List'), Icon: Pill, desc: t('Impor katalog obat: nama, kategori, harga, dan stok awal.', 'Import the drug catalog: name, category, price, and opening stock.'), cols: 'kode (opsional), nama_obat, nama_generik, kandungan, kategori, satuan, isi_kemasan, harga_beli, harga_jual, stok_total, stok_minimum', hint: t('Kategori: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.', 'Category: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.'), file: 'template_produk.csv', headers: ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum'], examples: [['', 'Paracetamol 500mg', 'Paracetamol', 'Paracetamol 500 mg', 'bebas', 'Tablet', '100', '500', '1000', '150', '10']], onUpload: importProduk },
    { key: 'supplier', title: t('Daftar Supplier', 'Supplier List'), Icon: Truck, desc: t('Impor daftar PBF / supplier obat.', 'Import the list of distributors / drug suppliers.'), cols: 'nama_supplier, jenis, alamat, telepon, email', hint: t('Jenis yang valid: PBF, Subdistributor, atau Lainnya (nilai lain otomatis disesuaikan).', 'Valid types: PBF, Subdistributor, or Lainnya (other values auto-adjusted).'), file: 'template_supplier.csv', headers: ['nama_supplier', 'jenis', 'alamat', 'telepon', 'email'], examples: [['PT Bina San Prima', 'PBF', 'Jl. Industri No. 1', '021-1234567', 'sales@binasan.co.id']], onUpload: importSupplier },
    { key: 'stok', title: t('Stok Awal (Batch)', 'Opening Stock (Batch)'), Icon: PackageOpen, desc: t('Impor stok awal per batch + expired date. Dicocokkan ke produk lewat kode.', 'Import opening stock per batch + expiry date. Matched to products by code.'), cols: 'kode_produk, batch_number, expired_date (YYYY-MM-DD), stok_batch', hint: t('Impor Produk dulu agar kode-nya tersedia. Stok batch akan menambah stok total produk.', 'Import Products first so codes exist. Batch stock adds to the total product stock.'), file: 'template_stok_awal.csv', headers: ['kode_produk', 'batch_number', 'expired_date', 'stok_batch'], examples: [['OBT-0001', 'BT-2401', '2026-12-31', '150']], onUpload: importStok },
    { key: 'mapping', title: t('Mapping Produk–Supplier', 'Product–Supplier Mapping'), Icon: ClipboardList, desc: t('Kaitkan tiap produk ke supplier-nya, agar pembuatan PO otomatis tahu daftar produk per supplier.', 'Link each product to its supplier, so creating a PO automatically knows the products per supplier.'), cols: 'kode_produk, nama_supplier (atau kode_supplier)', hint: t('Import Produk & Supplier dulu. Nama supplier harus sama persis dengan yang terdaftar.', 'Import Products & Suppliers first. Supplier name must match exactly.'), file: 'template_mapping_produk_supplier.csv', headers: ['kode_produk', 'nama_supplier'], examples: [['OBT-0001', 'PT Bina San Prima']], onUpload: importMapping },
    { key: 'fakturawal', title: t('Faktur / Hutang Awal', 'Opening Invoices / Debts'), Icon: Receipt, desc: t('Impor faktur pembelian yang belum lunas, langsung muncul di menu Pembayaran Faktur dengan jatuh tempo.', 'Import unpaid purchase invoices, they appear in Invoice Payments with due dates.'), cols: 'nomor_faktur, nama_supplier, tanggal_faktur (YYYY-MM-DD), term_of_payment, total', hint: t('Import Supplier dulu. Jatuh tempo dihitung dari tanggal_faktur + term_of_payment bila kolom tanggal_jatuh_tempo tidak diisi.', 'Import Suppliers first. Due date is computed from tanggal_faktur + term_of_payment if tanggal_jatuh_tempo is empty.'), file: 'template_faktur_awal.csv', headers: ['nomor_faktur', 'nama_supplier', 'tanggal_faktur', 'term_of_payment', 'total'], examples: [['INV/2025/0087', 'PT Bina San Prima', '2026-06-15', '30', '2500000']], onUpload: importFakturAwal },
  ]
  const migrasiPane = (
    <div>
      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Migrasi Data', 'Data Migration')}</h2>
      <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Onboarding cepat: unduh template, isi di Excel/Sheets, lalu upload CSV.', 'Fast onboarding: download a template, fill it in Excel/Sheets, then upload the CSV.')}</p>
      {isSuper && (
        <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{t('Mode Super Admin', 'Super Admin Mode')}</p>
            <p className="text-xs text-amber-700">{t('Pilih apotek tujuan, data import/export akan masuk/diambil dari apotek ini.', 'Select a target pharmacy, imported/exported data goes to/from this pharmacy.')}</p>
          </div>
          <select value={migrasiCompany} onChange={e => setMigrasiCompany(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-[var(--surface)] min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            <option value="">{t('Pilih Apotek', 'Select Pharmacy')}</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {migrasiCards.map(c => (
          <div key={c.key} className="border border-[var(--line)] rounded-2xl p-4 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center mb-3"><c.Icon size={18} strokeWidth={1.9} /></div>
            <h3 className="font-bold text-[var(--ink)] text-sm">{c.title}</h3>
            <p className="text-xs text-[var(--ink-soft)] mt-1 mb-3">{c.desc}</p>
            <div className="bg-[var(--surface-2)] rounded-lg p-2.5 mb-3">
              <p className="text-[10px] font-medium text-[var(--ink-soft)] mb-1">{t('Kolom CSV:', 'CSV Columns:')}</p>
              <p className="text-[10px] text-[var(--ink)] font-mono leading-relaxed break-words">{c.cols}</p>
            </div>
            <p className="text-[10px] text-[var(--ink-faint)] mb-3">{c.hint}</p>
            <div className="mt-auto flex flex-col gap-2">
              <button onClick={() => unduhCSV(c.file, c.headers, c.examples)}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] text-[var(--brand)] py-2 rounded-lg text-xs font-medium hover:bg-[var(--surface-2)] transition">
                <Download size={14} /> {t('Download Template', 'Download Template')}
              </button>
              <label className={`inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-xs font-medium hover:bg-[var(--brand-hover)] transition cursor-pointer ${importing === c.key ? 'opacity-60 pointer-events-none' : ''}`}>
                <Upload size={14} /> {importing === c.key ? t('Mengimpor…', 'Importing…') : t('Upload CSV', 'Upload CSV')}
                <input type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => {
                    if (isSuper && !migrasiCompany) { alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); e.target.value = ''; return }
                    if (e.target.files?.[0]) { c.onUpload(e.target.files[0]); e.target.value = '' }
                  }} />
              </label>
            </div>
            {importInfo[c.key] && (
              <p className={`text-xs mt-3 ${importInfo[c.key].startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>{importInfo[c.key]}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 bg-[var(--surface-2)] rounded-xl p-3.5 text-xs text-[var(--ink-soft)]">
        <p className="font-medium text-[var(--ink)] mb-1">{t('Urutan yang disarankan', 'Recommended order')}</p>
        <p>{t('1) Import Produk → 2) Supplier → 3) Stok Awal → 4) Mapping Produk–Supplier. Simpan file sebagai CSV UTF-8.', '1) Import Products → 2) Suppliers → 3) Opening Stock → 4) Product–Supplier Mapping. Save the file as CSV UTF-8.')}</p>
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-bold text-[var(--ink)] mb-1">{t('Export / Backup Data', 'Export / Backup Data')}</h3>
        <p className="text-xs text-[var(--ink-soft)] mb-3">{t('Unduh data apotek saat ini ke CSV.', 'Download current pharmacy data to CSV.')}</p>
        <div className="flex flex-wrap gap-2">
          {([['Produk', exportProduk], ['Supplier', exportSupplier], ['Stok / Batch', exportStok], ['Transaksi', exportTransaksi], ['Faktur', exportFaktur]] as const).map(([label, fn]) => (
            <button key={label} onClick={() => { if (isSuper && !migrasiCompany) return alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); (fn as () => void)() }}
              className="inline-flex items-center gap-2 border border-[var(--line)] text-[var(--brand)] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--surface-2)] transition"><Download size={14} /> {t('Export', 'Export')} {label}</button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
{/* Modal Detail Produk */}
      {showProdukDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[var(--line-soft)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--brand)]">{showProdukDetail.nama_obat}</h2>
                  <p className="text-xs text-[var(--ink-soft)]">{showProdukDetail.kode} · {showProdukDetail.nama_generik}</p>
                </div>
                <button onClick={() => setShowProdukDetail(null)}
                  className="text-[var(--ink-faint)] hover:text-[var(--brand)] text-xl font-light">✕</button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {['info', 'batch', 'keluar', 'masuk'].map(tab => (
                  <button key={tab} onClick={() => setProdukDetailTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                      produkDetailTab === tab ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'
                    }`}>
                    {tab === 'info' ? t('Info Produk', 'Product Info') : tab === 'batch' ? t('Batch & Expired', 'Batch & Expiry') : tab === 'keluar' ? t('Riwayat Keluar', 'Out History') : t('Riwayat Masuk', 'In History')}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* TAB INFO */}
              {produkDetailTab === 'info' && (() => {
                const beli = showProdukDetail.harga_beli || 0
                const jual = showProdukDetail.harga_jual || 0
                const markup = beli > 0 ? ((jual - beli) / beli) * 100 : 0
                const margin = jual > 0 ? ((jual - beli) / jual) * 100 : 0
                return (
                <div className="grid grid-cols-2 gap-4">
                  {/* Baris harga, memudahkan atur harga */}
                  <div className="col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-xs text-[var(--ink-soft)] mb-1">• Harga Pokok</p>
                          <p className="font-semibold text-[var(--ink)] text-sm tabular-nums">Rp {beli.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ink-soft)] mb-1">• Harga Jual</p>
                          <p className="font-semibold text-[var(--ink)] text-sm tabular-nums">Rp {jual.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ink-soft)] mb-1">• Markup</p>
                          <p className="font-semibold text-[var(--ink)] text-sm tabular-nums">{markup.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--ink-soft)] mb-1">• Margin</p>
                          <p className="font-semibold text-[var(--ink)] text-sm tabular-nums">{margin.toFixed(2)}%</p>
                        </div>
                      </div>
                      <button onClick={() => { setEditProduk(showProdukDetail); fetchProdukSuppliers(showProdukDetail.id) }}
                        title="Atur harga" className="p-2 rounded-lg text-[var(--brand)] hover:bg-[var(--surface-2)] transition">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>

                  {[
                    { label: 'Kode', value: showProdukDetail.kode },
                    { label: 'Kategori', value: showProdukDetail.kategori },
                    { label: 'Satuan', value: showProdukDetail.satuan },
                    { label: 'Isi Kemasan', value: showProdukDetail.isi_kemasan },
                    { label: 'Stok Total', value: showProdukDetail.stok_total },
                    { label: 'Stok Minimum', value: showProdukDetail.stok_minimum },
                    { label: 'Status', value: showProdukDetail.status },
                  ].map((item, i) => (
                    <div key={i} className="bg-[var(--surface-2)] rounded-lg p-3">
                      <p className="text-xs text-[var(--ink-soft)] mb-0.5">{item.label}</p>
                      <p className="font-medium text-[var(--brand)] text-sm">{item.value || '-'}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-[var(--surface-2)] rounded-lg p-3">
                    <p className="text-xs text-[var(--ink-soft)] mb-0.5">Kandungan / Komposisi</p>
                    <p className="font-medium text-[var(--brand)] text-sm">{showProdukDetail.kandungan || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-[var(--surface-2)] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Truck size={13} className="text-[var(--brand-soft)]" />
                      <p className="text-xs text-[var(--ink-soft)]">{t('Bisa dipesan di', 'Can be ordered from')}</p>
                    </div>
                    {produkSuppliers.length === 0 ? (
                      <p className="text-xs text-[var(--ink-faint)] italic">{t('Belum ada supplier, atur lewat tombol Edit.', 'No supplier set, assign via Edit.')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {produkSuppliers.map((ps: any) => (
                          <span key={ps.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs font-medium text-[var(--brand)]">
                            {ps.suppliers?.nama_supplier || '-'}
                            {ps.suppliers?.jenis && <span className="text-[var(--ink-faint)] font-normal">· {ps.suppliers.jenis}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )
              })()}

              {/* TAB BATCH */}
              {produkDetailTab === 'batch' && (
                <div>
                  {produkBatches.length === 0 ? (
                    <p className="text-center text-[var(--ink-faint)] py-8">{t('Belum ada data batch', 'No batch data yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--brand)]">
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">No. Batch</th>
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">Expired Date</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Stok Batch</th>
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">Status</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkBatches.map((b: any, i: number) => {
                          const today = new Date()
                          const exp = new Date(b.expired_date)
                          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                          const isExpired = diffDays <= 0
                          const isDanger = diffDays > 0 && diffDays <= 30
                          const isWarning = diffDays > 30 && diffDays <= 60
                          return (
                            <tr key={i} className={`border-b border-[var(--line-soft)] ${isExpired ? 'bg-red-50' : isDanger ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : ''}`}>
                              <td className="px-3 py-2 font-mono text-xs text-[var(--brand)]">{b.batch_number || '-'}</td>
                              <td className="px-3 py-2 text-sm">
                                {b.expired_date ? new Date(b.expired_date).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '-'}
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-[var(--brand)]">{b.stok_batch}</td>
                              <td className="px-3 py-2">
                                {isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-200 text-red-800 font-medium">Expired</span>
                                ) : isDanger ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">≤ 30 hari</span>
                                ) : isWarning ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">≤ 60 hari</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Aman</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {b.stok_batch > 0 ? (
                                  <a href="/tindak-lanjut"
                                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium transition ${isExpired || isDanger ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-[var(--line)] text-[var(--brand)] hover:bg-[var(--surface-2)]'}`}>
                                    {t('Tindak Lanjut', 'Follow up')}
                                  </a>
                                ) : (
                                  <span className="text-xs text-[var(--ink-faint)]">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB KELUAR */}
              {produkDetailTab === 'keluar' && (
                <div>
                  {produkTrxOut.length === 0 ? (
                    <p className="text-center text-[var(--ink-faint)] py-8">{t('Belum ada riwayat penjualan', 'No sales history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--brand)]">
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">No. Transaksi</th>
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">Tanggal</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Qty</th>
                          <th className="text-right px-3 py-2 text-xs text-[var(--on-brand)]">Harga Jual</th>
                          <th className="text-right px-3 py-2 text-xs text-[var(--on-brand)]">Subtotal</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkTrxOut.map((t: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-3 py-2 font-mono text-xs text-[var(--brand)]">{t.transactions?.nomor_transaksi}</td>
                            <td className="px-3 py-2 text-xs text-[var(--ink-soft)]">
                              {t.transactions?.created_at ? new Date(t.transactions.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-[var(--brand)] font-medium">{t.jumlah}</td>
                            <td className="px-3 py-2 text-right text-[var(--ink-soft)]">Rp {t.harga_jual?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-right font-medium text-[var(--brand)]">Rp {t.subtotal?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.transactions?.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                {t.transactions?.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                          <td colSpan={2} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">Total Keluar</td>
                          <td className="px-3 py-2 text-center font-bold text-[var(--brand)]">
                            {produkTrxOut.filter(t => t.transactions?.status !== 'dibatalkan').reduce((a: number, b: any) => a + b.jumlah, 0)}
                          </td>
                          <td></td>
                          <td className="px-3 py-2 text-right font-bold text-[var(--brand)]">
                            Rp {produkTrxOut.filter(t => t.transactions?.status !== 'dibatalkan').reduce((a: number, b: any) => a + b.subtotal, 0).toLocaleString('id-ID')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}

              {/* TAB MASUK */}
              {produkDetailTab === 'masuk' && (
                <div>
                  {produkTrxIn.length === 0 ? (
                    <p className="text-center text-[var(--ink-faint)] py-8">{t('Belum ada riwayat penerimaan', 'No receiving history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--brand)]">
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">No. PO</th>
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">Supplier</th>
                          <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">Tgl Terima</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Qty Pesan</th>
                          <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Qty Terima</th>
                          <th className="text-right px-3 py-2 text-xs text-[var(--on-brand)]">Harga Beli</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkTrxIn.map((t: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-3 py-2 font-mono text-xs text-[var(--brand)]">{t.purchase_orders?.nomor_po}</td>
                            <td className="px-3 py-2 text-xs text-[var(--ink-soft)]">{t.purchase_orders?.suppliers?.nama_supplier}</td>
                            <td className="px-3 py-2 text-xs text-[var(--ink-soft)]">
                              {t.purchase_orders?.tanggal_terima ? new Date(t.purchase_orders.tanggal_terima).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-[var(--ink-soft)]">{t.qty_pesan}</td>
                            <td className="px-3 py-2 text-center font-medium text-[var(--brand)]">{t.qty_terima || 0}</td>
                            <td className="px-3 py-2 text-right text-[var(--brand)]">Rp {t.harga_beli?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                          <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">Total Masuk</td>
                          <td className="px-3 py-2 text-center font-bold text-[var(--brand)]">
                            {produkTrxIn.reduce((a: number, b: any) => a + (b.qty_terima || 0), 0)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Produk */}
      {editProduk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">Edit Produk, {editProduk.kode}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Nama Obat</label>
                  <input value={editProduk.nama_obat} onChange={e => setEditProduk({...editProduk, nama_obat: e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Nama Generik</label>
                  <input value={editProduk.nama_generik || ''} onChange={e => setEditProduk({...editProduk, nama_generik: e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Kandungan</label>
                <input value={editProduk.kandungan || ''} onChange={e => setEditProduk({...editProduk, kandungan: e.target.value})}
                  className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Harga Beli</label>
                  <input type="number" value={editProduk.harga_beli} onChange={e => setEditProduk({...editProduk, harga_beli: +e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Harga Jual</label>
                  <input type="number" value={editProduk.harga_jual} onChange={e => setEditProduk({...editProduk, harga_jual: +e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Stok</label>
                  <input type="number" value={editProduk.stok_total} onChange={e => setEditProduk({...editProduk, stok_total: +e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Stok Minimum</label>
                  <input type="number" value={editProduk.stok_minimum} onChange={e => setEditProduk({...editProduk, stok_minimum: +e.target.value})}
                    className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
              </div>

              {/* Assign Supplier */}
              <div className="border-t border-[var(--line-soft)] pt-3">
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-2 block">{t('Supplier Produk Ini', 'Suppliers for this Product')} <span className="text-[var(--ink-faint)]">({produkSuppliers.length} {t('dipilih', 'selected')})</span></label>
                {suppliers.length === 0 ? (
                  <p className="text-xs text-[var(--ink-faint)]">Belum ada supplier, tambah di menu Supplier dulu</p>
                ) : (
                  <>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                      placeholder={t('Cari supplier...', 'Search supplier...')}
                      className="w-full border border-[var(--line)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {suppliers.filter(s => {
                      const q = supplierSearch.trim().toLowerCase()
                      return !q || `${s.nama_supplier} ${s.kode} ${s.jenis}`.toLowerCase().includes(q)
                    }).map(s => {
                      const isActive = produkSuppliers.some(ps => ps.supplier_id === s.id)
                      return (
                        <div key={s.id} onClick={() => toggleSupplierProduk(editProduk.id, s.id, isActive)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition ${
                            isActive ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)] hover:bg-gray-50'
                          }`}>
                          <div>
                            <div className="text-sm font-medium text-[var(--brand)]">{s.nama_supplier}</div>
                            <div className="text-xs text-[var(--ink-faint)]">{s.jenis} · {s.kode}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isActive ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--line)]'
                          }`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-[var(--surface)]" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEditProduk(null); setProdukSuppliers([]); setSupplierSearch('') }}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">Batal</button>
              <button onClick={async () => {
                const { error } = await supabase.from('products').update({
                  nama_obat: editProduk.nama_obat, nama_generik: editProduk.nama_generik,
                  kandungan: editProduk.kandungan, harga_beli: editProduk.harga_beli,
                  harga_jual: editProduk.harga_jual, stok_total: editProduk.stok_total,
                  stok_minimum: editProduk.stok_minimum,
                }).eq('id', editProduk.id)
                if (!error) { setEditProduk(null); setProdukSuppliers([]); setSupplierSearch(''); fetchProducts() }
              }} className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Struk */}
      {showStruk && lastTrx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm">
            <div id="struk-print" className="p-6">
              <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                <h2 className="font-bold text-lg text-[var(--brand)]">{settingsData.nama_apotek}</h2>
                <p className="text-xs text-gray-500 mt-1">{settingsData.alamat}</p>
                <p className="text-xs text-gray-500">{settingsData.nomor_telepon}</p>
                {settingsData.nomor_ijin && <p className="text-xs text-gray-400 mt-1">SIA: {settingsData.nomor_ijin}</p>}
              </div>
              <div className="text-xs text-gray-500 mb-3 flex justify-between">
                <span>{lastTrx.nomor_transaksi}</span>
                <span>{new Date().toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
                {lastItems.map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between text-[var(--brand)] font-medium">
                      <span>{item.nama_obat}</span>
                      <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-gray-400">{item.jumlah} x Rp {item.harga_jual?.toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-[var(--brand)]">
                  <span>Total</span><span>Rp {lastTrx.total?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('Bayar', 'Paid')} ({lastTrx.metode_bayar || 'Tunai'})</span><span>Rp {lastTrx.bayar?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('Kembalian', 'Change')}</span><span>Rp {lastTrx.kembalian?.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4 border-t border-dashed border-gray-300 pt-3">
                {t('Terima kasih atas kunjungan Anda', 'Thank you for your visit')}
              </p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowStruk(false)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">{t('Tutup', 'Close')}</button>
              <button onClick={() => {
                const win = window.open('', '_blank', 'width=350,height=600')
                win?.document.write(`<html><head><title>Struk</title><style>
                  * { margin:0; padding:0; box-sizing:border-box; }
                  body { font-family:'Courier New',monospace; font-size:12px; padding:16px; width:300px; }
                  h2 { font-size:13px; text-align:center; font-weight:bold; margin-bottom:2px; }
                  p { text-align:center; font-size:10px; color:#555; margin:1px 0; }
                  .divider { border-top:1px dashed #999; margin:8px 0; }
                  .row { display:flex; justify-content:space-between; margin:2px 0; }
                  .bold { font-weight:bold; }
                  .small { font-size:10px; color:#555; }
                </style></head><body>
                  <h2>${settingsData.nama_apotek}</h2>
                  <p>${settingsData.alamat}</p>
                  <p>SIA: ${settingsData.nomor_ijin}</p>
                  <p>Telp: ${settingsData.nomor_telepon}</p>
                  <div class="divider"></div>
                  <div class="row small"><span>No.</span><span>${lastTrx?.nomor_transaksi}</span></div>
                  <div class="row small"><span>Waktu</span><span>${new Date().toLocaleString('id-ID')}</span></div>
                  <div class="divider"></div>
                  ${lastItems.map(item => `
                    <div style="margin:4px 0;">
                      <div class="bold" style="font-size:11px;">${item.nama_obat}</div>
                      <div class="row small">
                        <span>${item.jumlah} x Rp ${item.harga_jual?.toLocaleString('id-ID')}</span>
                        <span>Rp ${item.subtotal?.toLocaleString('id-ID')}</span>
                      </div>
                    </div>`).join('')}
                  <div class="divider"></div>
                  <div class="row bold"><span>TOTAL</span><span>Rp ${lastTrx?.total?.toLocaleString('id-ID')}</span></div>
                  <div class="row small"><span>Bayar (${lastTrx?.metode_bayar || 'Tunai'})</span><span>Rp ${lastTrx?.bayar?.toLocaleString('id-ID')}</span></div>
                  <div class="row small" style="color:green;"><span>Kembalian</span><span>Rp ${lastTrx?.kembalian?.toLocaleString('id-ID')}</span></div>
                  <div class="divider"></div>
                  <p style="margin-top:8px;">Terima kasih atas kunjungan Anda</p>
                  <p>Semoga lekas sembuh</p>
                </body></html>`)
                win?.document.close()
                win?.print()
              }} className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium">
                🖨️ {t('Cetak', 'Print')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sw-ambient min-h-screen">
        {/* ── Topbar mobile ── */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[var(--brand)] text-[var(--on-brand)]">
          <button onClick={() => setMobileNavOpen(true)} aria-label="Menu"><Menu size={22} /></button>
          <span className="font-medium truncate">{namaFaskes}</span>
        </div>

        <div className="md:flex md:min-h-screen">
        {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />}

        {/* ══ SIDEBAR ══
            Isinya sekarang HANYA merek dan menu. Nama pengguna, peran, tombol
            keluar, pemilih bahasa/tema, dan pemilih apotek Super Admin semuanya
            pindah ke topbar. Sidebar yang memuat semua itu memaksa mata
            memindai dua jenis hal di satu kolom, yang dituju (menu) dan yang
            jarang disentuh (setelan akun). */}
        <div className={`${sidebarCollapsed ? 'md:w-[76px]' : 'md:w-64'} w-64 bg-gradient-to-b from-[var(--brand)] via-[var(--brand-soft)] to-[var(--brand-hover)] flex flex-col shrink-0 fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 md:z-auto ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          style={{ transition: 'transform var(--t-normal) var(--ease), width var(--t-normal) var(--ease)' }}>

          {/* Tombol lipat: lingkaran di TEPI LUAR sidebar, bukan di dalamnya.
              Di tepi ia selalu di tempat yang sama entah sidebar terbuka atau
              menyempit, jadi tangan menemukannya tanpa dicari. */}
          <button
            onClick={() => { const nv = !sidebarCollapsed; setSidebarCollapsed(nv); pinRef.current = nv; try { localStorage.setItem('sw_sidebar_collapsed', nv ? '1' : '0') } catch {} }}
            title={sidebarCollapsed ? t('Perlebar sidebar', 'Expand sidebar') : t('Perkecil sidebar', 'Collapse sidebar')}
            aria-label={sidebarCollapsed ? t('Perlebar sidebar', 'Expand sidebar') : t('Perkecil sidebar', 'Collapse sidebar')}
            aria-expanded={!sidebarCollapsed}
            className="hidden md:flex absolute -right-3.5 top-20 z-10 w-7 h-7 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand)] shadow-md border border-[var(--line)] hover:bg-[var(--surface-2)]"
            style={{ transition: 'transform var(--t-quick) var(--ease), background-color var(--t-quick) var(--ease)' }}>
            <ChevronRight size={15} style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform var(--t-normal) var(--ease)' }} />
          </button>

          <div className={`${sidebarCollapsed ? 'px-3' : 'px-5'} py-5`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="relative w-10 h-10 rounded-2xl bg-[var(--surface)]/10 flex items-center justify-center shrink-0">
                <FlaskConical size={20} className="text-white" strokeWidth={1.8} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm leading-tight truncate">Sehatera</div>
                  <div className="text-[var(--on-brand-soft)] text-xs truncate">{namaFaskes}</div>
                </div>
              )}
              <button onClick={() => setMobileNavOpen(false)} className="md:hidden ml-auto text-[var(--on-brand-soft)] hover:text-white" aria-label="Tutup menu"><X size={20} /></button>
            </div>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const aktif = activePage === item.id
              return (
                <button key={item.id} onClick={() => { bukaModul(item.id); setMobileNavOpen(false) }}
                  title={sidebarCollapsed ? (lang === 'en' ? item.en : item.label) : undefined}
                  aria-current={aktif ? 'page' : undefined}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm text-left ${
                    aktif ? 'bg-[var(--surface)]/15 text-white font-medium' : 'text-[var(--on-brand-soft)] hover:bg-white/[0.07] hover:text-white'
                  }`}
                  style={{ transition: 'background-color var(--t-quick) var(--ease), color var(--t-quick) var(--ease)' }}>
                  <Icon size={17} className="shrink-0" />{!sidebarCollapsed && <span className="truncate">{lang === 'en' ? item.en : item.label}</span>}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">

        {/* ══ TOPBAR (desktop) ══
            Judul halaman di kiri, semua yang tentang "siapa saya dan bagaimana
            aplikasi ini disetel" di kanan. */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center gap-3 px-6 bg-[var(--surface)]/85 backdrop-blur border-b border-[var(--line)]">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-[var(--ink)] truncate leading-tight">{judulHalaman}</h1>
            <p className="text-xs text-[var(--ink-faint)] truncate">{namaFaskes}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isSuper && (
              <select value={superViewCompany} onChange={e => setSuperViewCompany(e.target.value)}
                aria-label={t('Lihat sebagai apotek', 'View as pharmacy')}
                className="max-w-[190px] px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] text-xs">
                <option value="">{t('Semua apotek', 'All pharmacies')}</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            )}
            <LangToggle />
            <ThemeToggle />

            <div className="relative">
              <button onClick={() => setAccountOpen(v => !v)}
                aria-haspopup="menu" aria-expanded={accountOpen}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)]"
                style={{ transition: 'background-color var(--t-quick) var(--ease)' }}>
                <span className="w-7 h-7 rounded-full bg-[var(--brand)] text-[var(--on-brand)] text-xs font-semibold flex items-center justify-center shrink-0">
                  {(authName || 'U').trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden lg:block text-xs font-medium text-[var(--ink)] max-w-[130px] truncate">{authName || t('Pengguna', 'User')}</span>
                <ChevronRight size={14} className="text-[var(--ink-faint)]" style={{ transform: accountOpen ? 'rotate(90deg)' : 'rotate(90deg)', transition: 'transform var(--t-quick) var(--ease)' }} />
              </button>

              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div role="menu" className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-lg overflow-hidden sw-anim-fade">
                    <div className="px-4 py-3 border-b border-[var(--line-soft)]">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate">{authName || t('Pengguna', 'User')}</p>
                      <p className="text-xs text-[var(--ink-faint)] truncate">{session?.email}</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-soft)] text-[10px] font-medium">
                        <ShieldCheck size={11} /> {currentRole ? (ROLE_LABELS[currentRole] || currentRole) : '…'}
                      </span>
                    </div>
                    {allowedPages.includes('pengaturan') && (
                      <button onClick={() => { setActivePage('pengaturan'); setSettingsTab('profil'); setAccountOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--ink-mid)] hover:bg-[var(--surface-2)] text-left">
                        <Settings size={15} /> {t('Pengaturan', 'Settings')}
                      </button>
                    )}
                    <button onClick={() => { setActivePage('pengaturan'); setSettingsTab('langganan'); setAccountOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--ink-mid)] hover:bg-[var(--surface-2)] text-left">
                      <CreditCard size={15} /> {t('Langganan', 'Subscription')}
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--accent)] hover:bg-[var(--surface-2)] text-left border-t border-[var(--line-soft)]">
                      <LogOut size={15} /> {t('Keluar', 'Sign out')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">

          {langgananBanner}

          {/* COMPANIES (super admin) */}
          {/* PRODUK */}
          {activePage === 'produk' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--brand)] mb-1">{t('Produk & Stok', 'Products & Stock')}</h1>
                  <p className="text-[var(--ink-soft)] text-sm">{t('Daftar semua produk obat di apotek', 'All medicine products in the pharmacy')}</p>
                </div>
                <button onClick={() => setShowForm(true)}
                  className="bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                  + {t('Tambah Produk', 'Add Product')}
                </button>
              </div>

              {expiredAlerts.length > 0 && (
                <a href="/tindak-lanjut"
                  className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span className="text-sm">
                    <b>{expiredAlerts.length} {t('batch', 'batches')}</b> {t('mendekati atau melewati kadaluarsa.', 'are nearing or past expiry.')}
                    {' '}<span className="underline">{t('Buka Tindak Lanjut', 'Open Follow-up')}</span>
                  </span>
                </a>
              )}

              {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl">
                    <h2 className="text-lg font-bold text-[var(--brand)] mb-4">{t('Tambah Produk Baru', 'Add New Product')}</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Obat *', 'Drug Name *')}</label>
                          <input value={form.nama_obat} onChange={e => setForm({...form, nama_obat: e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Generik', 'Generic Name')}</label>
                          <input value={form.nama_generik} onChange={e => setForm({...form, nama_generik: e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kandungan / Komposisi', 'Ingredient / Composition')}</label>
                        <input value={form.kandungan} onChange={e => setForm({...form, kandungan: e.target.value})}
                          className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kategori', 'Category')}</label>
                          <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                            <option value="bebas">Bebas</option>
                            <option value="bebas_terbatas">Bebas Terbatas</option>
                            <option value="keras">Keras</option>
                            <option value="suplemen">Suplemen</option>
                            <option value="psikotropika">Psikotropika</option>
                            <option value="narkotika">Narkotika</option>
                            <option value="prekursor">Prekursor</option>
                            <option value="alkes">Alkes</option>
                            <option value="lainnya">Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Satuan', 'Unit')}</label>
                          <select value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                            <option>Tablet</option><option>Kapsul</option><option>Botol</option>
                            <option>Sachet</option><option>Tube</option><option>Ampul</option><option>Vial</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Beli', 'Buy Price')}</label>
                          <input type="number" value={form.harga_beli} onChange={e => setForm({...form, harga_beli: +e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Jual', 'Sell Price')}</label>
                          <input type="number" value={form.harga_jual} onChange={e => setForm({...form, harga_jual: +e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Stok Awal', 'Opening Stock')}</label>
                          <input type="number" value={form.stok_total} onChange={e => setForm({...form, stok_total: +e.target.value})}
                            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowForm(false)}
                        className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
                      <button onClick={handleTambahProduk}
                        className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium">{t('Simpan Produk', 'Save Product')}</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                  <input type="text" placeholder={t('Cari nama obat, generik, atau kandungan...', 'Search drug name, generic, or ingredient...')}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--brand)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                </div>
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
                  className="border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5 text-sm text-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="">{t('Semua Kategori', 'All Categories')}</option>
                  {Object.keys(kategoriLabel).map(k => <option key={k} value={k}>{kategoriLabel[k]}</option>)}
                </select>
                <select value={filterStok} onChange={e => setFilterStok(e.target.value)}
                  className="border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5 text-sm text-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="">{t('Semua Stok', 'All Stock')}</option>
                  <option value="aman">{t('Stok Aman', 'Healthy')}</option>
                  <option value="minim">{t('Stok Minim', 'Low')}</option>
                  <option value="habis">{t('Stok Habis', 'Out of stock')}</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5 text-sm text-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
                  <option value="">{t('Semua Status', 'All Status')}</option>
                  <option value="aktif">{t('Aktif', 'Active')}</option>
                  <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
                </select>
                {(filterKategori || filterStok || filterStatus || search) && (
                  <button onClick={() => { setSearch(''); setFilterKategori(''); setFilterStok(''); setFilterStatus('') }}
                    className="px-3 py-2.5 rounded-lg text-sm text-[var(--ink-soft)] border border-[var(--line)] hover:bg-gray-50 whitespace-nowrap">{t('Reset', 'Reset')}</button>
                )}
              </div>

              <div className={TBL_WRAP}>
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('Kode', 'Code')}</th>
                      <th className={TH_L}>{t('Nama Obat', 'Drug Name')}</th>
                      <th className={TH_L}>{t('Kategori', 'Category')}</th>
                      <th className={TH_L}>{t('Satuan', 'Unit')}</th>
                      <th className={TH_R}>{t('H. Jual', 'Sell Price')}</th>
                      <th className={TH_C}>{t('Stok', 'Stock')}</th>
                      <th className={TH_C}>Status</th>
                      <th className={TH_R}>{t('Aksi', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="px-4 py-10 text-center text-[var(--ink-faint)]" colSpan={8}>{t('Memuat data...', 'Loading data...')}</td></tr>
                    ) : produkFiltered.length === 0 ? (
                      <tr><td className="px-4 py-10 text-center text-[var(--ink-faint)]" colSpan={8}>{t('Tidak ada produk ditemukan', 'No products found')}</td></tr>
                    ) : (
                      produkFiltered.map((p) => {
                        const habis = (p.stok_total ?? 0) <= 0
                        const minim = !habis && (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)
                        const stokCls = habis ? 'bg-red-50 text-red-600 ring-1 ring-red-500/20' : minim ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                        return (
                        <tr key={p.id} className={TR}>
                          <td className={TD}><span className="font-mono text-xs text-[var(--ink-faint)]">{p.kode}</span></td>
                          <td className={TD}>
                            <div className="font-medium text-[var(--ink)] leading-tight">{p.nama_obat}</div>
                            {p.nama_generik && <div className="text-xs text-[var(--ink-faint)] leading-tight mt-0.5">{p.nama_generik}</div>}
                          </td>
                          <td className={TD}>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${KATEGORI_BADGE[p.kategori] || KATEGORI_BADGE.lainnya}`}>
                              {kategoriLabel[p.kategori] || p.kategori}
                            </span>
                          </td>
                          <td className={TD + ' text-[var(--ink-soft)]'}>{p.satuan}</td>
                          <td className={TD + ' text-right font-medium text-[var(--ink)] tabular-nums whitespace-nowrap'}>Rp {p.harga_jual?.toLocaleString('id-ID')}</td>
                          <td className={TD + ' text-center'}>
                            <span className={`inline-block min-w-[2.25rem] px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${stokCls}`}>{p.stok_total}</span>
                          </td>
                          <td className={TD + ' text-center'}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'aktif' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {p.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                            </span>
                          </td>
                          <td className={TD + ' text-right whitespace-nowrap'}>
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => openProdukDetail(p)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--brand)] hover:bg-[var(--paper)] transition">{t('Detail', 'Details')}</button>
                              <button onClick={() => {
                                setEditProduk(p)
                                fetchProdukSuppliers(p.id)
                                if (suppliers.length === 0) fetchSuppliers()
                              }} className="px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] transition">Edit</button>
                            </div>
                          </td>
                        </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KASIR */}
          {activePage === 'transaksi' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--brand)] mb-1">{t('Kasir', 'Cashier')}</h1>
                  <p className="text-[var(--ink-soft)] text-sm">{t('Transaksi penjualan obat', 'Medicine sales transactions')}</p>
                </div>
              </div>
              {isSuper && !superViewCompany && (
                <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{t('Transaksi dikunci', 'Transactions locked')}</p>
                    <p className="text-amber-700">{t('Dropdown "Lihat sebagai apotek" masih menampilkan semua apotek. Pilih satu apotek di sidebar agar transaksi tidak mempengaruhi stok apotek lain.', 'The "View as pharmacy" dropdown still shows all pharmacies. Pick a specific pharmacy in the sidebar so transactions don\'t affect other pharmacies\' stock.')}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-[var(--surface)]/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-4">
                    <input type="text" placeholder={t('Cari obat by nama, generik, atau kandungan...', 'Search by name, generic, or ingredient...')}
                      value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value.length > 1) fetchProducts() }}
                      className="w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                    {search && (
                      <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                        {filteredProducts.map(p => (
                          <div key={p.id} onClick={() => {
                            if ((p.stok_total ?? 0) <= 0) { alert(t(`Stok ${p.nama_obat} habis, tidak bisa dijual.`, `${p.nama_obat} is out of stock.`)); return }
                            const exists = keranjang.find(k => k.id === p.id)
                            if (exists) {
                              if (exists.jumlah + 1 > (p.stok_total ?? 0)) { alert(t(`Stok ${p.nama_obat} hanya ${p.stok_total}.`, `Only ${p.stok_total} of ${p.nama_obat} in stock.`)); return }
                              setKeranjang(keranjang.map(k => k.id === p.id ? {...k, jumlah: k.jumlah + 1} : k))
                            }
                            else { setKeranjang([...keranjang, {...p, jumlah: 1}]) }
                            setSearch('')
                          }} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
                            <div>
                              <div className="text-sm font-medium text-[var(--brand)]">{p.nama_obat}</div>
                              <div className="text-xs text-[var(--ink-faint)]">{p.nama_generik} · {t('Stok', 'Stock')}: {p.stok_total}</div>
                            </div>
                            <div className="text-sm font-medium text-[var(--brand)]">Rp {p.harga_jual?.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                        {services.filter((s: any) => s.status === 'aktif' && s.nama?.toLowerCase().includes(search.toLowerCase())).map((s: any) => (
                          <div key={'svc-' + s.id} onClick={() => {
                            const kid = 'svc-' + s.id
                            const exists = keranjang.find(k => k.id === kid)
                            if (exists) { setKeranjang(keranjang.map(k => k.id === kid ? {...k, jumlah: k.jumlah + 1} : k)) }
                            else { setKeranjang([...keranjang, { id: kid, nama_obat: s.nama, harga_jual: s.harga || 0, jumlah: 1, is_jasa: true, kategori: 'jasa', stok_total: 0 }]) }
                            setSearch('')
                          }} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--paper)] cursor-pointer">
                            <div>
                              <div className="text-sm font-medium text-[var(--brand)]">{s.nama}</div>
                              <div className="text-xs text-[var(--brand-soft)] inline-flex items-center gap-1"><HeartPulse size={11} /> {t('Layanan Jasa', 'Service')}</div>
                            </div>
                            <div className="text-sm font-medium text-[var(--brand)]">Rp {(s.harga || 0).toLocaleString('id-ID')}</div>
                          </div>
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
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--ink-faint)]">{t('Belum ada produk, cari obat di atas', 'No products yet, search above')}</td></tr>
                        ) : (
                          keranjang.map(item => (
                            <tr key={item.id} className={TR}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-[var(--brand)]">{item.nama_obat}</div>
                                <div className="text-xs text-[var(--ink-faint)]">{item.is_jasa ? item.kode : `${item.kode || ''}${item.kode ? ' · ' : ''}${t('Stok', 'Stock')}: ${item.stok_total}`}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: Math.max(1, k.jumlah - 1)} : k))}
                                    className="w-6 h-6 rounded bg-[var(--surface-2)] text-[var(--brand)] font-bold text-xs">−</button>
                                  <input type="number" min={1} max={item.is_jasa ? undefined : item.stok_total} value={item.jumlah}
                                    onChange={e => { const v = Math.max(1, +e.target.value); const capped = (!item.is_jasa && v > (item.stok_total ?? 0)) ? (item.stok_total ?? 0) : v; setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: capped} : k)) }}
                                    className="w-12 text-center text-sm border border-[var(--line)] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]" />
                                  <button onClick={() => {
                                    if (!item.is_jasa && item.jumlah + 1 > (item.stok_total ?? 0)) { alert(t(`Stok ${item.nama_obat} hanya ${item.stok_total}.`, `Only ${item.stok_total} of ${item.nama_obat} in stock.`)); return }
                                    setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: k.jumlah + 1} : k))
                                  }}
                                    className="w-6 h-6 rounded bg-[var(--surface-2)] text-[var(--brand)] font-bold text-xs">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-[var(--brand)]">Rp {item.harga_jual?.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right font-medium text-[var(--brand)]">Rp {(item.harga_jual * item.jumlah)?.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => setKeranjang(keranjang.filter(k => k.id !== item.id))}
                                  className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-[var(--surface)]/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-[var(--brand)] mb-4">{t('Ringkasan Transaksi', 'Transaction Summary')}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--ink-soft)]">{t('Total Item', 'Total Items')}</span>
                        <span className="text-[var(--brand)]">{keranjang.reduce((a, b) => a + b.jumlah, 0)} {t('item', 'items')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-[var(--line-soft)] pt-2">
                        <span className="text-[var(--brand)]">Total</span>
                        <span className="text-[var(--brand)]">Rp {keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    {(() => {
                      const hasGolongan = keranjang.some(k => ['narkotika','psikotropika','prekursor'].includes(k.kategori))
                      return (<>
                      {!hasGolongan && (
                        <label className="mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-2)] transition">
                          <input type="checkbox" checked={isResep} onChange={e => setIsResep(e.target.checked)}
                            className="w-4 h-4 accent-[var(--brand)]" />
                          <div>
                            <span className="text-sm font-medium text-[var(--brand)]">{t('Transaksi berupa resep', 'This is a prescription sale')}</span>
                            <p className="text-xs text-[var(--ink-faint)]">{t('Centang untuk mengisi data pasien & no. resep', 'Tick to record patient data & prescription no.')}</p>
                          </div>
                        </label>
                      )}
                      {(hasGolongan || isResep) && (
                      <div className={`mb-4 p-3 rounded-xl border space-y-2 ${hasGolongan ? 'border-amber-300 bg-amber-50' : 'border-[var(--line)] bg-[var(--surface-2)]'}`}>
                        <p className={`text-xs font-semibold ${hasGolongan ? 'text-amber-800' : 'text-[var(--brand-soft)]'}`}>{hasGolongan ? '⚠️ ' + t('Ada obat Narkotika/Psikotropika/Prekursor, wajib isi data pasien & resep', 'Contains Narcotics/Psychotropics/Precursors, patient & prescription data required') : '📋 ' + t('Data Pasien & Resep', 'Patient & Prescription Data')}</p>
                        <input value={pasienForm.nomor_resep} onChange={e => setPasienForm({...pasienForm, nomor_resep: e.target.value})}
                          placeholder={t('No. Resep *', 'Prescription No. *')} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        <input value={pasienForm.nama_pasien} onChange={e => setPasienForm({...pasienForm, nama_pasien: e.target.value})}
                          placeholder={t('Nama Pasien *', 'Patient Name *')} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={pasienForm.kontak_pasien} onChange={e => setPasienForm({...pasienForm, kontak_pasien: e.target.value})}
                            placeholder={t('Kontak (HP)', 'Contact (Phone)')} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                          <input value={pasienForm.alamat_pasien} onChange={e => setPasienForm({...pasienForm, alamat_pasien: e.target.value})}
                            placeholder={t('Alamat', 'Address')} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
                        </div>
                      </div>
                      )}
                      </>)
                    })()}
                    <div className="mb-3">
                      <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Metode Pembayaran', 'Payment Method')}</label>
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {['Tunai','QRIS','Transfer','Debit','Kartu Kredit'].map(m => (
                          <button key={m} onClick={() => setMetodeBayar(m)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${metodeBayar === m ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--brand)]' : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Bayar (Rp)', 'Pay (Rp)')}</label>
                      <input type="text" inputMode="numeric" value={bayar ? bayar.toLocaleString('id-ID') : ''}
                        onChange={e => setBayar(+e.target.value.replace(/\D/g, '') || 0)}
                        onDoubleClick={() => setBayar(keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0))}
                        className="w-full border border-[var(--line)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="0" />
                      <p className="text-[11px] text-[var(--ink-faint)] mt-1">{t('Klik 2× untuk isi otomatis sesuai total.', 'Double-click to auto-fill the total.')}</p>
                    </div>
                    {bayar > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-green-600 mb-4">
                        <span>{t('Kembalian', 'Change')}</span>
                        <span>Rp {Math.max(0, bayar - keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <button disabled={prosesLoading || kasirTerkunci || (isSuper && !superViewCompany)} onClick={async () => {
                      if (prosesLoading) return
                      if (kasirTerkunci) return alert(langgananPesan?.isi || '')
                      if (isSuper && !superViewCompany) return alert(t('⚠️ Dropdown "Lihat sebagai apotek" masih menampilkan SEMUA apotek. Pilih satu apotek dulu sebelum transaksi agar tidak mempengaruhi stok apotek lain.', '⚠️ The "View as pharmacy" dropdown still shows ALL pharmacies. Select a specific pharmacy before making a transaction to avoid affecting other pharmacies\' stock.'))
                      if (keranjang.length === 0) return alert(t('Keranjang kosong!', 'Cart is empty!'))
                      const over = keranjang.find(k => !k.is_jasa && k.jumlah > (k.stok_total ?? 0))
                      if (over) return alert(t(`Stok ${over.nama_obat} tidak cukup, tersedia ${over.stok_total}, diminta ${over.jumlah}.`, `Insufficient stock for ${over.nama_obat}, available ${over.stok_total}, requested ${over.jumlah}.`))
                      const total = keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)
                      if (bayar < total) return alert(t('Pembayaran kurang!', 'Insufficient payment!'))
                      const hasGolongan = keranjang.some(k => ['narkotika','psikotropika','prekursor'].includes(k.kategori))
                      const perluResep = hasGolongan || isResep
                      if (perluResep && (!pasienForm.nama_pasien.trim() || !pasienForm.nomor_resep.trim())) {
                        return alert(hasGolongan
                          ? t('Obat golongan Narkotika/Psikotropika/Prekursor wajib mengisi Nama Pasien dan No. Resep.', 'Narcotics/Psychotropics/Precursors require Patient Name and Prescription No.')
                          : t('Transaksi resep wajib mengisi Nama Pasien dan No. Resep.', 'Prescription sale requires Patient Name and Prescription No.'))
                      }
                      setProsesLoading(true)
                      try {
                        // Satu panggilan, satu transaksi database.
                        //
                        // Sebelumnya urutannya dijalankan browser satu per satu:
                        // insert transaksi → insert item → lalu satu UPDATE stok
                        // per produk di dalam perulangan. Kalau jaringan putus di
                        // tengah perulangan, transaksinya sudah tersimpan tapi
                        // sebagian stok belum terpotong, dan tidak ada yang tahu
                        // sampai opname berikutnya. `stok_batch` bahkan tidak
                        // pernah ikut dipotong sama sekali, padahal angka batch
                        // itulah yang dipakai laporan SIPNAP dan penelusuran obat
                        // kadaluarsa.
                        const { data: trx, error } = await supabase.rpc('apply_transaction', {
                          p_items: keranjang.map(k => ({
                            product_id: k.is_jasa ? null : k.id,
                            is_jasa: !!k.is_jasa,
                            nama_obat: k.nama_obat,
                            harga_jual: k.harga_jual,
                            jumlah: k.jumlah,
                          })),
                          p_bayar: bayar,
                          p_metode_bayar: metodeBayar,
                          p_pasien: perluResep ? {
                            nama_pasien: pasienForm.nama_pasien.trim(),
                            alamat_pasien: pasienForm.alamat_pasien.trim(),
                            kontak_pasien: pasienForm.kontak_pasien.trim(),
                            nomor_resep: pasienForm.nomor_resep.trim(),
                          } : null,
                          p_company: (isSuper && superViewCompany) || null,
                        })
                        if (error) { alert(pesanError(error)); setProsesLoading(false); return }
                        setLastTrx(trx)
                        setLastItems(keranjang.map(k => ({ ...k, subtotal: k.harga_jual * k.jumlah })))
                        setShowStruk(true)
                        setKeranjang([])
                        setBayar(0)
                        setMetodeBayar('Tunai')
                        setPasienForm({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' }); setIsResep(false)
                        // Stok di layar sudah tidak sama dengan stok di database.
                        if (activePage === 'transaksi') fetchProducts()
                      } catch(e) { alert(t('Terjadi kesalahan, coba lagi', 'An error occurred, please try again')) }
                      finally { setProsesLoading(false) }
                    }} className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                      {kasirTerkunci ? t('🔒 Langganan berakhir', '🔒 Subscription ended')
                        : (isSuper && !superViewCompany) ? t('🔒 Pilih apotek dulu', '🔒 Select a pharmacy first')
                        : prosesLoading ? t('Memproses...', 'Processing...') : t('Proses Transaksi', 'Process Transaction')}
                    </button>
                    <button onClick={() => { setKeranjang([]); setBayar(0); setMetodeBayar('Tunai'); setPasienForm({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' }); setIsResep(false) }}
                      className="w-full mt-2 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                      {t('Batal / Reset', 'Cancel / Reset')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PENGATURAN */}
          {activePage === 'pengaturan' && (() => {
            const inputCls = 'w-full border border-[var(--line)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
            const roleLabels: Record<string,string> = { pemilik:t('Pemilik','Owner'), apoteker:t('Apoteker','Pharmacist'), asisten_apoteker:t('Asisten Apoteker','Pharmacist Assistant'), kasir:t('Kasir','Cashier'), admin:'Admin' }
            const settingsMenu = [
              { id:'profil', label:t('Profil Apotek','Pharmacy Profile'), desc:t('Nama, alamat, logo','Name, address, logo'), Icon:Building2 },
              { id:'pengguna', label:t('Manajemen Pengguna','User Management'), desc:t('Akses pengguna, anggota tim','User access, team members'), Icon:Users },
              { id:'apoteker', label:t('Data Apoteker','Pharmacist Data'), desc:t('SIA, SIPA, penanggung jawab','SIA, SIPA, responsible person'), Icon:ShieldCheck },
              { id:'tampilan', label:t('Tampilan','Appearance'), desc:t('Tema warna aplikasi','App colour theme'), Icon:LayoutGrid },
              { id:'langganan', label:t('Langganan','Subscription'), desc:t('Paket, masa aktif, kuota','Plan, validity, quota'), Icon:CreditCard },
              { id:'migrasi', label:t('Migrasi Data','Data Migration'), desc:t('Import & export CSV','Import & export CSV'), Icon:Database },
            ]
            return (
            <div>
              <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Pengaturan', 'Settings')}</h1>
              <p className="text-[var(--ink-soft)] text-sm mb-6">{t('Kelola profil apotek, pengguna, dan data penanggung jawab', 'Manage pharmacy profile, users, and responsible pharmacist data')}</p>
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                {/* Sub-menu kiri */}
                <div className="space-y-2">
                  {settingsMenu.map((m: any) => (
                    <button key={m.id} onClick={() => m.nav ? setActivePage(m.id) : setSettingsTab(m.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                        settingsTab === m.id ? 'bg-[var(--surface)]/80 border-[var(--brand)]/20 shadow-sm' : 'bg-[var(--surface)]/50 border-white/60 hover:bg-[var(--surface)]/70'
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${settingsTab === m.id ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--paper)] text-[var(--brand)]'}`}>
                        <m.Icon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)]">{m.label}</p>
                        <p className="text-xs text-[var(--ink-faint)] truncate">{m.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-[var(--ink-faint)] shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Konten kanan */}
                <div className="bg-[var(--surface)]/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-6">
                  {settingsTab === 'migrasi' && migrasiPane}

                  {/* TAMPILAN: tema warna */}
                  {settingsTab === 'tampilan' && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Tampilan', 'Appearance')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">
                        {t('Pilih tema warna aplikasi. Pilihan ini berlaku untuk perangkat ini.',
                           'Pick the app colour theme. This choice applies to this device.')}
                      </p>
                      <ThemePicker lang={lang} />
                      <p className="text-xs text-[var(--ink-faint)] mt-4 leading-relaxed">
                        {t('Tema bawaan apotek dipakai untuk perangkat yang belum pernah memilih sendiri, sehingga semua kasir melihat tampilan yang sama sejak hari pertama. Perangkat yang sudah memilih tetap memakai pilihannya.',
                           'The pharmacy default applies to devices that have never picked one, so every cashier sees the same look from day one. Devices that have chosen keep their choice.')}
                      </p>
                      {(currentRole === 'pemilik' || currentRole === 'admin') && (
                        <button
                          onClick={async () => {
                            if (!session?.company) return
                            const { error } = await supabase.from('companies')
                              .update({ theme }).eq('id', session.company.id)
                            alert(error ? pesanError(error)
                              : t('Tema bawaan apotek disimpan.', 'Pharmacy default theme saved.'))
                          }}
                          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)] transition">
                          {t('Jadikan tema bawaan apotek', 'Make this the pharmacy default')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* LANGGANAN */}
                  {settingsTab === 'langganan' && (() => {
                    const c = session?.company
                    const rp = (n: number | null | undefined) => 'Rp ' + (n || 0).toLocaleString('id-ID')
                    const tgl = (iso: string | null) => iso
                      ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    const aktifSampai = c?.status === 'trial' ? c?.trialEndsAt : c?.subscriptionEndsAt
                    const statusLabel: Record<string, string> = {
                      trial: t('Masa coba gratis', 'Free trial'),
                      active: t('Aktif', 'Active'),
                      suspended: t('Ditangguhkan', 'Suspended'),
                      inactive: t('Nonaktif', 'Inactive'),
                    }
                    // Batas dari paket; null berarti tanpa batas. Angkanya datang
                    // dari view yang sama dengan yang dipakai trigger menolak,
                    // supaya yang dilihat di sini persis yang ditegakkan.
                    const bar = (dipakai: number, batas: number | null, label: string) => {
                      const persen = batas ? Math.min(100, Math.round((dipakai / batas) * 100)) : 0
                      const penuh = batas !== null && dipakai >= batas
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[var(--ink-soft)]">{label}</span>
                            <span className={`tabular-nums font-medium ${penuh ? 'text-red-600' : 'text-[var(--ink)]'}`}>
                              {dipakai.toLocaleString('id-ID')} / {batas === null ? t('tanpa batas', 'unlimited') : batas.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${penuh ? 'bg-red-500' : 'bg-[var(--brand)]'}`}
                              style={{ width: batas === null ? '8%' : `${persen}%` }} />
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Langganan', 'Subscription')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-6">
                          {t('Paket, masa aktif, dan pemakaian kuota apotek ini.', 'Plan, validity, and quota usage for this pharmacy.')}
                        </p>

                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-3)] p-5 mb-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-[var(--ink-faint)] font-semibold">{t('Paket aktif', 'Active plan')}</p>
                              <p className="text-2xl font-bold text-[var(--ink)] mt-1">{c?.planName || t('Belum berpaket', 'No plan yet')}</p>
                              <p className="text-sm text-[var(--ink-soft)] mt-0.5">
                                {c?.planPriceMonthly ? `${rp(c.planPriceMonthly)} / ${t('bulan', 'month')}` : t('Belum ada tagihan untuk apotek ini.', 'No billing for this pharmacy yet.')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              c?.status === 'active' ? 'bg-green-100 text-green-800'
                              : c?.status === 'trial' ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'}`}>
                              {statusLabel[c?.status || 'trial']}
                            </span>
                          </div>
                          <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-wrap gap-x-8 gap-y-2 text-sm">
                            <div>
                              <span className="text-[var(--ink-faint)]">{t('Aktif sampai', 'Active until')}: </span>
                              <span className="font-semibold text-[var(--ink)]">{tgl(aktifSampai ?? null)}</span>
                            </div>
                            <div>
                              <span className="text-[var(--ink-faint)]">{t('Bantuan', 'Support')}: </span>
                              <span className="font-semibold text-[var(--ink)]">
                                {fitur.support === 'dedicated' ? t('Pendampingan khusus', 'Dedicated') : fitur.support === 'whatsapp' ? 'WhatsApp' : 'Email'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{t('Pemakaian kuota', 'Quota usage')}</h3>
                        {kuota ? (
                          <div className="space-y-4">
                            {bar(kuota.used_products ?? 0, kuota.max_products, t('Item obat', 'Drug items'))}
                            {bar(kuota.used_users ?? 0, kuota.max_users, t('Pengguna', 'Users'))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--ink-faint)]">{t('Memuat pemakaian…', 'Loading usage…')}</p>
                        )}

                        <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                          <p className="text-sm font-semibold text-[var(--ink)] mb-1">{t('Mau ganti paket?', 'Want to change plans?')}</p>
                          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                            {t('Untuk sekarang pergantian paket dilakukan lewat admin Sehatera. Pembayaran otomatis di dalam aplikasi belum tersedia. Turun paket tidak menghapus data apa pun; yang berubah hanya batas penambahan.',
                               'For now, plan changes go through the Sehatera admin. In-app automatic payment is not available yet. Downgrading deletes nothing; only the limit on adding changes.')}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                  {/* PROFIL APOTEK */}
                  {settingsTab === 'profil' && (
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Profil apotek', 'Pharmacy profile')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">{t('Profil apotek akan ditampilkan pada struk penjualan.', 'The pharmacy profile appears on sales receipts.')}</p>
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Logo */}
                        <div className="shrink-0">
                          <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[var(--line)] flex items-center justify-center overflow-hidden bg-[var(--surface)]">
                            {settingsData.logo_url
                              ? <img src={settingsData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                              : <Building2 size={44} className="text-[var(--ink-faint)]" strokeWidth={1.3} />}
                          </div>
                          <label className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--brand)] font-medium hover:bg-[var(--surface-2)] transition cursor-pointer">
                            <Upload size={15} /> {t('Ubah logo', 'Change logo')}
                            <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                              onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                          </label>
                          <p className="text-xs text-[var(--ink-faint)] mt-2 text-center">{t('Maksimal 4MB', 'Max 4MB')}<br/>{t('Format .JPG .JPEG .PNG', 'Format .JPG .JPEG .PNG')}</p>
                        </div>
                        {/* Fields */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama apotek', 'Pharmacy name')}</label>
                            <input value={settingsData.nama_apotek || ''} onChange={e => setSettingsData({...settingsData, nama_apotek: e.target.value})} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Sektor usaha', 'Business sector')}</label>
                              <input value={settingsData.sektor_usaha || 'Apotek'} onChange={e => setSettingsData({...settingsData, sektor_usaha: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Kota/Kabupaten', 'City/Regency')}</label>
                              <input value={settingsData.kota || ''} onChange={e => setSettingsData({...settingsData, kota: e.target.value})} placeholder="Kab. Gianyar, Bali" className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Alamat', 'Address')}</label>
                            <textarea value={settingsData.alamat || ''} onChange={e => setSettingsData({...settingsData, alamat: e.target.value})} rows={2} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('No. telepon', 'Phone No.')}</label>
                              <input value={settingsData.nomor_telepon || ''} onChange={e => setSettingsData({...settingsData, nomor_telepon: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input type="email" value={settingsData.email || ''} onChange={e => setSettingsData({...settingsData, email: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nomor Ijin (SIA)', 'License No. (SIA)')}</label>
                            <input value={settingsData.nomor_ijin || ''} onChange={e => setSettingsData({...settingsData, nomor_ijin: e.target.value})} className={inputCls} />
                          </div>
                          <button onClick={saveSettings} className="bg-[var(--brand)] text-[var(--on-brand)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                            {t('Simpan Profil', 'Save Profile')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DATA APOTEKER */}
                  {settingsTab === 'apoteker' && (
                    <div className="max-w-md">
                      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Data apoteker', 'Pharmacist data')}</h2>
                      <p className="text-sm text-[var(--ink-soft)] mb-6">{t('Penanggung jawab yang tertera di PO & Berita Acara.', 'The responsible person shown on POs & official reports.')}</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama Apoteker', 'Pharmacist Name')}</label>
                          <input value={settingsData.nama_apoteker || ''} onChange={e => setSettingsData({...settingsData, nama_apoteker: e.target.value})} placeholder="apt. Nama Apoteker, S.Farm" className={inputCls} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nomor SIPA', 'SIPA Number')}</label>
                          <input value={settingsData.nomor_sipa || ''} onChange={e => setSettingsData({...settingsData, nomor_sipa: e.target.value})} placeholder="SIPA/001/2024/..." className={inputCls} />
                        </div>
                        <button onClick={saveSettings} className="bg-[var(--brand)] text-[var(--on-brand)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                          {t('Simpan Data Apoteker', 'Save Pharmacist Data')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MANAJEMEN PENGGUNA */}
                  {settingsTab === 'pengguna' && (() => {
                    const ModuleGrid = ({ selected, onToggle, onClear, onAll }: { selected: string[], onToggle: (id:string)=>void, onClear: ()=>void, onAll: ()=>void }) => (
                      <div className="border border-[var(--line)] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[var(--ink)]">{t('Akses Modul', 'Module Access')}</p>
                          <div className="flex gap-3 text-xs">
                            <button type="button" onClick={onAll} className="text-[var(--brand)] font-medium hover:underline">{t('Pilih semua', 'Select all')}</button>
                            <button type="button" onClick={onClear} className="text-[var(--ink-soft)] hover:underline">{t('Hapus semua', 'Clear all')}</button>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--ink-faint)] mb-4">{t('Centang modul yang boleh dibuka user ini.', 'Check the modules this user may open.')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {menuItems.map(m => {
                            const checked = selected.includes(m.id)
                            return (
                              <button type="button" key={m.id} onClick={() => onToggle(m.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm transition ${checked ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)] hover:bg-gray-50'}`}>
                                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'border border-[var(--line)]'}`}>{checked && <Check size={11} strokeWidth={3} />}</span>
                                <span className="text-[var(--ink)]">{lang === 'en' ? m.en : m.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )

                    // ── FORM TAMBAH ──
                    if (showUserForm) return (
                      <div>
                        <button onClick={() => setShowUserForm(false)} className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Tambah Pengguna', 'Add User')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-5">{t('User baru langsung bisa login dengan email & password ini.', 'The new user can sign in immediately with this email & password.')}</p>
                        <div className="space-y-5">
                          <div className="border border-[var(--line)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="nama@apotek.com" className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Password Awal', 'Initial Password')}</label>
                              <input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={t('Minimal 6 karakter', 'At least 6 characters')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} placeholder={t('Nama lengkap', 'Full name')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Role</label>
                              <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value, modules: ROLE_PAGES[e.target.value] || []})} className={inputCls}>
                                <option value="pemilik">{t('Pemilik', 'Owner')}</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                          <ModuleGrid selected={userForm.modules}
                            onToggle={(id) => toggleFormModule('new', id)}
                            onClear={() => setUserForm({...userForm, modules: []})}
                            onAll={() => setUserForm({...userForm, modules: menuItems.map(m => m.id)})} />
                          <button onClick={handleTambahUser} disabled={savingUser}
                            className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                            {savingUser ? t('Membuat…', 'Creating…') : t('Buat Pengguna', 'Create User')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── FORM EDIT ──
                    if (editUser) return (
                      <div>
                        <button onClick={() => setEditUser(null)} className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Edit Pengguna', 'Edit User')}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Ubah role, status, dan hak akses modul. Email login tidak dapat diubah di sini.', 'Change role, status, and module access. Login email cannot be changed here.')}</p>
                        <div className="space-y-5">
                          <div className="border border-[var(--line)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={editUser.nama} onChange={e => setEditUser({...editUser, nama: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Email</label>
                              <input value={editUser.email || ''} disabled className={inputCls + ' bg-[var(--surface-2)] text-[var(--ink-faint)]'} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Role</label>
                              <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className={inputCls}>
                                <option value="pemilik">{t('Pemilik', 'Owner')}</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[var(--ink-mid)] mb-1 block">Status</label>
                              <select value={editUser.status} onChange={e => setEditUser({...editUser, status: e.target.value})} className={inputCls}>
                                <option value="aktif">{t('Aktif', 'Active')}</option>
                                <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
                              </select>
                            </div>
                          </div>
                          <ModuleGrid selected={Array.isArray(editUser.modules) ? editUser.modules : []}
                            onToggle={(id) => toggleFormModule('edit', id)}
                            onClear={() => setEditUser({...editUser, modules: []})}
                            onAll={() => setEditUser({...editUser, modules: menuItems.map(m => m.id)})} />
                          <button onClick={handleUpdateUser} className="w-full bg-[var(--brand)] text-[var(--on-brand)] py-3 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition">
                            {t('Simpan Perubahan', 'Save Changes')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── LIST ──
                    return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-[var(--ink)]">{t('Manajemen pengguna', 'User management')}</h2>
                        <button onClick={openTambahUser}
                          className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                          <UserPlus size={15} /> {t('Tambah Pengguna', 'Add User')}
                        </button>
                      </div>
                      <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Atur anggota tim apotek beserta hak akses modul masing-masing.', 'Manage pharmacy team members and their module access.')}</p>
                      {users.length === 0 ? (
                        <div className="text-center py-12 text-sm text-[var(--ink-faint)]">
                          <Users size={32} className="mx-auto mb-2 text-[var(--ink-faint)]" />
                          {t('Belum ada pengguna. Klik "Tambah Pengguna" untuk menambah anggota tim.', 'No users yet. Click "Add User" to add a team member.')}
                        </div>
                      ) : (
                        <div className="border border-[var(--line-soft)] rounded-xl overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[var(--surface-2)] text-[var(--ink-soft)]">
                                <th className="text-left px-4 py-2.5 text-xs font-medium">{t('Nama', 'Name')}</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium">Email</th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium">Role</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">{t('Modul', 'Modules')}</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">Status</th>
                                <th className="text-center px-4 py-2.5 text-xs font-medium">{t('Aksi', 'Action')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u:any, i:number) => (
                                <tr key={i} className="border-t border-[var(--line-soft)] hover:bg-[var(--surface)]">
                                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.nama}</td>
                                  <td className="px-4 py-3 text-[var(--ink-soft)] text-xs">{u.email || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--brand-soft)]">{roleLabels[u.role] || u.role}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-[var(--ink-soft)]">{Array.isArray(u.modules) && u.modules.length ? `${u.modules.length} ${t('modul','modules')}` : t('default role','default role')}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggleUserStatus(u)}
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {u.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => setEditUser({ ...u, modules: Array.isArray(u.modules) ? u.modules : [] })} title="Edit" className="p-1.5 rounded-lg text-[var(--brand)] hover:bg-[var(--surface-2)] transition"><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteUser(u)} title="Hapus" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    )
                  })()}
                </div>
              </div>
            </div>
            )
          })()}

        </div>
        </div>
        </div>

        {/* Bottom tab bar (mobile) + More sheet */}
        {(() => {
          const navAll = menuItems.filter(i => allowedPages.includes(i.id))
          const navMain = navAll.slice(0, 4)
          const superExtra = (isSuper && allowedPages.includes('klien')) ? menuSuper : []
          const moreList = [...navAll.slice(4), ...superExtra]
          const short = (it: any) => (lang === 'en' ? it.en : it.label).split(/[ &\/]/)[0]
          const moreActive = moreList.some(m => m.id === activePage)
          return (
            <>
              <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)]/95 backdrop-blur border-t border-[var(--line)] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                {navMain.map(item => {
                  const Icon = item.icon; const active = activePage === item.id
                  return (
                    <button key={item.id} onClick={() => bukaModul(item.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>
                      <span className={`flex items-center justify-center w-10 h-6 rounded-full ${active ? 'bg-[var(--brand)]/10' : ''}`}><Icon size={19} /></span>
                      <span className="text-[10px] font-medium leading-none">{short(item)}</span>
                    </button>
                  )
                })}
                {moreList.length > 0 && (
                  <button onClick={() => setMoreOpen(true)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${moreActive || moreOpen ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>
                    <span className={`flex items-center justify-center w-10 h-6 rounded-full ${moreActive || moreOpen ? 'bg-[var(--brand)]/10' : ''}`}><LayoutGrid size={19} /></span>
                    <span className="text-[10px] font-medium leading-none">{t('Lainnya', 'More')}</span>
                  </button>
                )}
              </nav>

              {moreOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute bottom-0 inset-x-0 bg-[var(--surface)] rounded-t-3xl p-4 sw-sheet" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
                    <div className="w-10 h-1 rounded-full bg-[var(--line)] mx-auto mb-3" />
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">{t('Menu Lainnya', 'More Menu')}</p>
                      <button onClick={() => setMoreOpen(false)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label="Tutup"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {moreList.map(item => {
                        const Icon = item.icon; const active = activePage === item.id
                        return (
                          <button key={item.id} onClick={() => { bukaModul(item.id); setMoreOpen(false) }}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition ${active ? 'border-[var(--brand)] bg-[var(--surface-2)] text-[var(--brand)]' : 'border-[var(--line-soft)] text-[var(--ink-mid)]'}`}>
                            <Icon size={20} />
                            <span className="text-[10px] font-medium text-center leading-tight px-0.5">{lang === 'en' ? item.en : item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    {/* Identitas pengguna dan pemilih tema ikut ke sini saat
                        sidebar dibersihkan. Di layar lebar keduanya ada di menu
                        akun pada topbar: di mobile tidak ada topbar itu, jadi
                        tanpa bagian ini orang kehilangan satu-satunya tempat
                        melihat sedang masuk sebagai siapa. */}
                    <div className="border-t border-[var(--line-soft)] mt-4 pt-3 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-full bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold flex items-center justify-center shrink-0">
                          {(authName || 'U').trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--ink)] truncate">{authName || t('Pengguna', 'User')}</p>
                          <p className="text-[11px] text-[var(--ink-faint)] truncate">
                            {currentRole ? (ROLE_LABELS[currentRole] || currentRole) : '…'}
                          </p>
                        </div>
                        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
                          className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] font-medium shrink-0">
                          <LogOut size={15} /> {t('Keluar', 'Sign out')}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <LangToggle />
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </>
  )
}