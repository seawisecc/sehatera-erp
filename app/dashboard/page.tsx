'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, LogOut, Settings, Truck,
  FlaskConical, Wallet, CalendarClock, ClipboardList, Printer, Pencil,
  Receipt, CreditCard, Building2, Users, PanelLeftClose, PanelLeft, ChevronRight,
  UserPlus, Trash2, Upload, ShieldCheck, Check, ArrowLeft, Menu, X, Download, Database, HeartPulse,
  Search, Wand2, AlertTriangle, LayoutGrid
} from 'lucide-react'
import { supabase, createSignupClient } from '../../lib/supabase'
import { AMBIENT } from '../../lib/theme'
import { useLang, LangToggle } from '../../lib/i18n'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', en: 'Dashboard', icon: LayoutDashboard },
  { id: 'produk', label: 'Produk & Stok', en: 'Products & Stock', icon: Pill },
  { id: 'transaksi', label: 'Transaksi', en: 'Sales', icon: ShoppingCart },
  { id: 'layanan', label: 'Layanan Jasa', en: 'Services', icon: HeartPulse },
  { id: 'pembelian', label: 'Pembelian', en: 'Purchasing', icon: PackageOpen },
  { id: 'faktur', label: 'Pembayaran Faktur', en: 'Invoice Payments', icon: Receipt },
  { id: 'supplier', label: 'Supplier', en: 'Suppliers', icon: Truck },
  { id: 'tindaklanjut', label: 'Tindak Lanjut', en: 'Follow-up', icon: ClipboardList },
  { id: 'laporan', label: 'Laporan', en: 'Reports', icon: BarChart2 },
  { id: 'pengaturan', label: 'Pengaturan', en: 'Settings', icon: Settings },
]

// Hak akses per role: daftar id halaman yang boleh dibuka
const ROLE_PAGES: Record<string, string[]> = {
  pemilik:          ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  admin:            ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  apoteker:         ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan'],
  asisten_apoteker: ['dashboard','produk','transaksi','layanan','tindaklanjut','laporan'],
  kasir:            ['dashboard','transaksi','layanan'],
}
const ROLE_LABELS: Record<string,string> = { pemilik:'Pemilik', apoteker:'Apoteker', asisten_apoteker:'Asisten Apoteker', kasir:'Kasir', admin:'Admin', superadmin:'Super Admin' }

// ── Gaya tabel seragam (profesional) ──
const TBL_WRAP = 'bg-white/80 backdrop-blur-sm border border-[#e8e4d9] rounded-2xl shadow-sm overflow-x-auto'
const TBL = 'w-full text-sm border-collapse'
const THEAD = 'bg-[#f6f4ee] border-b border-[#e6e2d8]'
const TH = 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8a9691] whitespace-nowrap'
const TH_L = TH + ' text-left'
const TH_R = TH + ' text-right'
const TH_C = TH + ' text-center'
const TR = 'border-b border-[#f2efe8] last:border-0 hover:bg-[#faf9f5] transition-colors'
const TD = 'px-4 py-2.5 align-middle'

// Badge warna per kategori obat
const KATEGORI_BADGE: Record<string, string> = {
  bebas: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  bebas_terbatas: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  keras: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  psikotropika: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  narkotika: 'bg-rose-100 text-rose-800 ring-1 ring-rose-700/20',
  prekursor: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  suplemen: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  alkes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20',
  lainnya: 'bg-gray-100 text-gray-600 ring-1 ring-gray-400/20',
}

export default function Dashboard() {
  const { t, lang } = useLang()
  const [activePage, setActivePage] = useState('dashboard')
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
  const [laporanTab, setLaporanTab] = useState<'penjualan'|'metode'|'sipnap'>('penjualan')
  // Filter kolom produk
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStok, setFilterStok] = useState('')
  // Filter laporan penjualan / metode bayar
  const [lapDari, setLapDari] = useState('')
  const [lapSampai, setLapSampai] = useState('')
  const [lapMetode, setLapMetode] = useState('')
  const [lapStatus, setLapStatus] = useState('')
  // Kasir: tandai transaksi resep
  const [isResep, setIsResep] = useState(false)
  const [sipnapForm, setSipnapForm] = useState({ golongan: 'narkotika', bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() })
  const [importInfo, setImportInfo] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState<string | null>(null)
  const [migrasiCompany, setMigrasiCompany] = useState('')
  const [prosesLoading, setProsesLoading] = useState(false)
  const [showStruk, setShowStruk] = useState(false)
  const [lastTrx, setLastTrx] = useState<any>(null)
  const [lastItems, setLastItems] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [statProduk, setStatProduk] = useState(0)
  const [statTrxHariIni, setStatTrxHariIni] = useState(0)
  const [statOmzet, setStatOmzet] = useState(0)
  const [statExpired, setStatExpired] = useState(0)
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d')
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [expiringSoon, setExpiringSoon] = useState<any[]>([])
  const [dueInvoices, setDueInvoices] = useState<any[]>([])
  const [settingsData, setSettingsData] = useState<any>({
    nama_apotek: '', alamat: '', nomor_ijin: '', nomor_telepon: ''
  })
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceForm, setServiceForm] = useState({ nama: '', harga: 0, deskripsi: '' })
  const [editService, setEditService] = useState<any>(null)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    nama_supplier: '', jenis: 'PBF', alamat: '', telepon: '', email: ''
  })
  const [editProduk, setEditProduk] = useState<any>(null)
  const [produkSuppliers, setProdukSuppliers] = useState<any[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [expiredAlerts, setExpiredAlerts] = useState<any[]>([])
  const [showProdukDetail, setShowProdukDetail] = useState<any>(null)
  const [produkDetailTab, setProdukDetailTab] = useState('info')
  const [produkBatches, setProdukBatches] = useState<any[]>([])
  const [produkTrxOut, setProdukTrxOut] = useState<any[]>([])
  const [produkTrxIn, setProdukTrxIn] = useState<any[]>([])
  const [showTindakLanjut, setShowTindakLanjut] = useState<any>(null)
  const [tindakLanjutMode, setTindakLanjutMode] = useState<'pilih'|'musnahkan'|'retur'>('pilih')
  const [formMusnahkan, setFormMusnahkan] = useState({ tanggal_musnahkan: new Date().toISOString().split('T')[0], qty_musnahkan: 0, metode: 'Dibakar', saksi_1: '', saksi_2: '', keterangan: '' })
  const [formRetur, setFormRetur] = useState({ supplier_id: '', tanggal_retur: new Date().toISOString().split('T')[0], qty_retur: 0, alasan: '' })
  const [batchSupplier, setBatchSupplier] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [currentModules, setCurrentModules] = useState<string[] | null>(null)
  const [isSuper, setIsSuper] = useState(false)
  const [superViewCompany, setSuperViewCompany] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyBlocked, setCompanyBlocked] = useState<'pending' | 'expired' | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [showMasaAktif, setShowMasaAktif] = useState<any>(null)
  const [masaAktifDate, setMasaAktifDate] = useState('')
  const [authName, setAuthName] = useState('')
  const [settingsTab, setSettingsTab] = useState('profil')
  const [users, setUsers] = useState<any[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ nama: '', email: '', password: '', role: 'kasir', modules: ROLE_PAGES['kasir'] as string[] })
  const [editUser, setEditUser] = useState<any>(null)
  const [savingUser, setSavingUser] = useState(false)
  const [tindakLanjutTab, setTindakLanjutTab] = useState<'musnahkan'|'retur'>('musnahkan')
  const [riwayatMusnah, setRiwayatMusnah] = useState<any[]>([])
  const [riwayatRetur, setRiwayatRetur] = useState<any[]>([])

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { if (activePage === 'tindaklanjut') { fetchRiwayatMusnah(); fetchRiwayatRetur() } }, [activePage])
  useEffect(() => { if (activePage === 'dashboard') fetchStats() }, [activePage])
  useEffect(() => { if (activePage === 'dashboard') fetchSalesChart(chartRange) }, [chartRange])
  useEffect(() => { if (activePage === 'produk') { fetchProducts(); fetchExpiredAlerts() } }, [activePage])
  useEffect(() => { if (activePage === 'laporan') fetchRiwayat() }, [activePage])
  useEffect(() => { if (activePage === 'supplier') fetchSuppliers() }, [activePage])
  useEffect(() => { if (activePage === 'layanan' || activePage === 'transaksi') fetchServices() }, [activePage])
  useEffect(() => { if (activePage === 'pembelian') { fetchPOList(); fetchSuppliers() } }, [activePage])
  useEffect(() => { if (activePage === 'faktur') fetchFaktur() }, [activePage])
  useEffect(() => { if (activePage === 'pengaturan') fetchUsers() }, [activePage])
  useEffect(() => { if (activePage === 'companies') fetchCompanies() }, [activePage])
  useEffect(() => { if (activePage === 'migrasi' && isSuper) fetchCompanies() }, [activePage, isSuper])
  useEffect(() => { if (isSuper) fetchCompanies() }, [isSuper])
  // Saat super admin ganti "lihat sebagai apotek", muat ulang data halaman aktif
  useEffect(() => {
    if (!isSuper) return
    fetchSettings()
    if (activePage === 'dashboard') fetchStats()
    else if (activePage === 'produk') { fetchProducts(); fetchExpiredAlerts() }
    else if (activePage === 'supplier') fetchSuppliers()
    else if (activePage === 'pembelian') fetchPOList()
    else if (activePage === 'laporan') fetchRiwayat()
    else if (activePage === 'faktur') fetchFaktur()
    else if (activePage === 'tindaklanjut') { fetchRiwayatMusnah(); fetchRiwayatRetur() }
    else if (activePage === 'pengaturan') fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superViewCompany])

  // Filter query untuk super admin: batasi ke apotek yang sedang "diintip"
  const scopeQ = (q: any) => (isSuper && superViewCompany) ? q.eq('company_id', superViewCompany) : q
  useEffect(() => { try { setSidebarCollapsed(localStorage.getItem('sw_sidebar_collapsed') === '1') } catch {} }, [])

  // Cek sesi & tentukan role saat masuk dashboard
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const email = (user.email || '').toLowerCase()
      setAuthName((user.user_metadata as any)?.nama_lengkap || user.email || '')

      // Cek super admin (penyedia layanan)
      const { data: sa } = await supabase.from('super_admins').select('email').ilike('email', email).maybeSingle()
      if (sa) {
        setIsSuper(true)
        setCurrentRole('superadmin')
        setCurrentModules(null)
        return
      }

      // Cek status aktivasi apotek (berdasarkan email admin yang mendaftar)
      const { data: comp } = await supabase.from('companies').select('*').ilike('admin_email', email).maybeSingle()
      if (comp) {
        const today = new Date(new Date().toDateString())
        const expired = comp.valid_sampai && new Date(comp.valid_sampai) < today
        if (comp.status !== 'aktif') { setCompanyBlocked('pending'); return }
        if (expired) { setCompanyBlocked('expired'); return }
        setCompanyName(comp.nama || '')
        // Apotek baru belum punya settings → prefill nama apotek dari company
        setSettingsData((prev: any) => prev.nama_apotek ? prev : { ...prev, nama_apotek: comp.nama || '' })
      }

      const { data: au } = await supabase.from('app_users').select('*').ilike('email', email).maybeSingle()
      if (au) {
        if (au.status !== 'aktif') {
          alert(t('Akun Anda dinonaktifkan. Hubungi pemilik apotek.', 'Your account has been deactivated. Contact the pharmacy owner.'))
          await supabase.auth.signOut(); window.location.href = '/'; return
        }
        setCurrentRole(au.role)
        setCurrentModules(Array.isArray(au.modules) ? au.modules : null)
      } else {
        // Email tidak terdaftar di manajemen pengguna → dianggap Pemilik (akses penuh)
        setCurrentRole('pemilik')
        setCurrentModules(null)
      }
    })()
  }, [])

  // Akses = daftar modul user (jika diatur) ; kalau kosong pakai default role.
  // Super admin: akses penuh + halaman Companies. Migrasi Data menyatu dengan Pengaturan.
  const allowedPages = (() => {
    if (isSuper) return [...menuItems.map(m => m.id), 'companies', 'migrasi']
    if (!currentRole) return []
    const base = currentModules && currentModules.length ? currentModules : (ROLE_PAGES[currentRole] || ['dashboard'])
    return base.includes('pengaturan') ? [...base, 'migrasi'] : base
  })()

  // Jika role tidak boleh membuka halaman aktif, arahkan ke halaman pertama yang diizinkan
  useEffect(() => {
    if (currentRole && !allowedPages.includes(activePage)) setActivePage(allowedPages[0] || 'dashboard')
  }, [currentRole, activePage])

  // PO States
  const [poList, setPoList] = useState<any[]>([])
  const [showPOForm, setShowPOForm] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [supplierProducts, setSupplierProducts] = useState<any[]>([])
  const [poItems, setPoItems] = useState<any[]>([])
  const [poCatatan, setPoCatatan] = useState('')
  const [showPenerimaan, setShowPenerimaan] = useState<any>(null)
  const [penerimaanItems, setPenerimaanItems] = useState<any[]>([])
  const [showPODetail, setShowPODetail] = useState<any>(null)
  // Guided order (order terpandu) states
  const [guidedOpen, setGuidedOpen] = useState(false)
  const [guidedStep, setGuidedStep] = useState(1)
  const [guidedItems, setGuidedItems] = useState<any[]>([])
  const [guidedLoading, setGuidedLoading] = useState(false)
  const [showTrxDetail, setShowTrxDetail] = useState<any>(null)
  const [trxDetailItems, setTrxDetailItems] = useState<any[]>([])

  // Faktur States
  const [fakturForm, setFakturForm] = useState({ nomor_faktur: '', tanggal_faktur: new Date().toISOString().split('T')[0], term_of_payment: 30 })
  const [fakturList, setFakturList] = useState<any[]>([])
  const [showBayar, setShowBayar] = useState<any>(null)
  const [bayarForm, setBayarForm] = useState({ tanggal_bayar: new Date().toISOString().split('T')[0], metode_bayar: 'Transfer', catatan_bayar: '' })

  const fetchFaktur = async () => {
    const { data } = await scopeQ(supabase.from('faktur')
      .select('*, suppliers(nama_supplier), purchase_orders(nomor_po)'))
    const rows = data || []
    // Urut: belum bayar dulu (by jatuh tempo terdekat), baru yang lunas
    rows.sort((a: any, b: any) => {
      const aUnpaid = a.status !== 'lunas' ? 0 : 1
      const bUnpaid = b.status !== 'lunas' ? 0 : 1
      if (aUnpaid !== bUnpaid) return aUnpaid - bUnpaid
      return new Date(a.tanggal_jatuh_tempo || 0).getTime() - new Date(b.tanggal_jatuh_tempo || 0).getTime()
    })
    setFakturList(rows)
  }

  const submitBayar = async () => {
    if (!showBayar) return
    const { error } = await supabase.from('faktur').update({
      status: 'lunas',
      tanggal_bayar: bayarForm.tanggal_bayar,
      metode_bayar: bayarForm.metode_bayar,
      catatan_bayar: bayarForm.catatan_bayar,
    }).eq('id', showBayar.id)
    if (error) { alert('Error: ' + error.message); return }
    const paid = { ...showBayar, status: 'lunas', tanggal_bayar: bayarForm.tanggal_bayar, metode_bayar: bayarForm.metode_bayar, catatan_bayar: bayarForm.catatan_bayar }
    setShowBayar(null)
    fetchFaktur()
    cetakBuktiBayar(paid)
  }

  const cetakBuktiBayar = (f: any) => {
    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
    const rp = (n: any) => 'Rp ' + (n || 0).toLocaleString('id-ID')
    const win = window.open('', '_blank', 'width=800,height=900')
    win?.document.write(`<html><head><title>Bukti Pembayaran ${f.nomor_faktur || ''}</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;font-size:12px;padding:40px;color:#1c2620;}
      .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
      h1{font-size:16px;font-weight:bold;}
      .apotek p{font-size:11px;color:#555;}
      .divider{border-top:2px solid #1e3a2c;margin:12px 0;}
      .title{text-align:center;margin:8px 0 18px;}
      .title h2{font-size:15px;letter-spacing:1px;}
      .title p{font-size:11px;color:#666;}
      table{width:100%;border-collapse:collapse;margin:6px 0;}
      td{padding:6px 8px;vertical-align:top;}
      .label{width:38%;color:#555;}
      .val{font-weight:600;}
      .total-box{margin-top:14px;background:#f5f2eb;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}
      .total-box .l{font-size:12px;color:#555;}
      .total-box .v{font-size:20px;font-weight:bold;}
      .stamp{margin-top:10px;display:inline-block;border:2px solid #16a34a;color:#16a34a;font-weight:bold;padding:4px 14px;border-radius:6px;letter-spacing:2px;transform:rotate(-4deg);}
      .ttd{margin-top:48px;display:flex;justify-content:flex-end;}
      .ttd-box{text-align:center;}
      .ttd-line{border-top:1px solid #000;width:200px;margin:56px auto 4px;}
      .foot{margin-top:32px;font-size:10px;color:#999;text-align:center;}
    </style></head><body>
      <div class="head">
        <div class="apotek">
          <h1>${settingsData.nama_apotek || 'Apotek'}</h1>
          <p>${settingsData.alamat || ''}</p>
          <p>SIA: ${settingsData.nomor_ijin || '-'} | Telp: ${settingsData.nomor_telepon || '-'}</p>
        </div>
        <div style="text-align:right;">
          <span class="stamp">LUNAS</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="title">
        <h2>BUKTI PEMBAYARAN FAKTUR</h2>
        <p>No. Faktur: ${f.nomor_faktur || '-'}</p>
      </div>
      <table>
        <tr><td class="label">Dibayarkan kepada</td><td class="val">${f.suppliers?.nama_supplier || '-'}</td></tr>
        <tr><td class="label">No. Purchase Order</td><td>${f.purchase_orders?.nomor_po || '-'}</td></tr>
        <tr><td class="label">Tanggal Faktur</td><td>${fmt(f.tanggal_faktur)}</td></tr>
        <tr><td class="label">Jatuh Tempo</td><td>${fmt(f.tanggal_jatuh_tempo)}</td></tr>
        <tr><td class="label">Tanggal Pembayaran</td><td class="val">${fmt(f.tanggal_bayar)}</td></tr>
        <tr><td class="label">Metode Pembayaran</td><td>${f.metode_bayar || '-'}</td></tr>
        ${f.catatan_bayar ? `<tr><td class="label">Catatan</td><td>${f.catatan_bayar}</td></tr>` : ''}
      </table>
      <div class="total-box">
        <span class="l">Jumlah Dibayar</span>
        <span class="v">${rp(f.total)}</span>
      </div>
      <div class="ttd">
        <div class="ttd-box">
          <p>Penerima / Penanggung Jawab,</p>
          <div class="ttd-line"></div>
          <p><b>${settingsData.nama_apoteker || '-'}</b></p>
          <p>SIPA: ${settingsData.nomor_sipa || '-'}</p>
        </div>
      </div>
      <div class="foot">Dokumen ini dicetak otomatis oleh Pharmacy Store by Seawise Studio.</div>
    </body></html>`)
    win?.document.close(); win?.print()
  }

  const fetchPOList = async () => {
    const { data } = await scopeQ(supabase.from('purchase_orders').select('*, suppliers(nama_supplier, kode, alamat, telepon)').order('created_at', { ascending: false }))
    setPoList(data || [])
  }

  const fetchSupplierProducts = async (supplierId: string) => {
    const { data } = await supabase.from('product_suppliers').select('*, products(*)').eq('supplier_id', supplierId)
    setSupplierProducts(data?.map((d: any) => d.products) || [])
  }

  const addPoItem = (product: any) => {
    const exists = poItems.find(i => i.product_id === product.id)
    if (exists) return
    setPoItems([...poItems, {
      product_id: product.id,
      nama_produk: product.nama_obat,
      satuan: product.satuan,
      qty_pesan: 1,
      harga_beli: product.harga_beli || 0,
      subtotal: product.harga_beli || 0
    }])
  }

  const updatePoItem = (idx: number, field: string, value: number) => {
    const updated = [...poItems]
    updated[idx] = { ...updated[idx], [field]: value }
    updated[idx].subtotal = updated[idx].qty_pesan * updated[idx].harga_beli
    setPoItems(updated)
  }

  const submitPO = async () => {
    if (superLocked()) return alert(t('⚠️ Pilih satu apotek di dropdown "Lihat sebagai apotek" dulu sebelum membuat PO.', '⚠️ Select a specific pharmacy in the "View as pharmacy" dropdown before creating a PO.'))
    if (!selectedSupplier || poItems.length === 0) return alert(t('Pilih supplier dan tambah produk dulu!', 'Select a supplier and add products first!'))
    const total_nilai = poItems.reduce((a, b) => a + b.subtotal, 0)
    const cid = (isSuper && superViewCompany) ? { company_id: superViewCompany } : {}
    const { data: po, error } = await supabase.from('purchase_orders').insert([{ supplier_id: selectedSupplier.id, total_nilai, catatan: poCatatan, ...cid }]).select().single()
    if (error) { alert('Error: ' + error.message); return }
    await supabase.from('po_items').insert(poItems.map(i => ({ ...i, po_id: po.id, ...cid })))
    setShowPOForm(false); setSelectedSupplier(null); setPoItems([]); setPoCatatan(''); setSupplierProducts([])
    fetchPOList()
    alert(`✅ ${t('PO', 'PO')} ${po.nomor_po} ${t('berhasil dibuat!', 'created successfully!')}`)
  }

  // ── Order Terpandu (Guided Order) ──
  const superLocked = () => isSuper && !superViewCompany
  const startGuidedOrder = async () => {
    if (superLocked()) return alert(t('⚠️ Pilih satu apotek di dropdown "Lihat sebagai apotek" dulu sebelum membuat order.', '⚠️ Select a specific pharmacy in the "View as pharmacy" dropdown before creating an order.'))
    setGuidedLoading(true)
    const { data: prods } = await scopeQ(supabase.from('products').select('id,nama_obat,satuan,stok_total,stok_minimum,harga_beli').order('nama_obat'))
    const low = (prods || []).filter((p: any) => (p.stok_total ?? 0) <= (p.stok_minimum ?? 0))
    if (low.length === 0) { setGuidedLoading(false); alert(t('Tidak ada barang yang mencapai stok minimum. 👍', 'No items have reached minimum stock. 👍')); return }
    const ids = low.map((p: any) => p.id)
    const { data: ps } = await scopeQ(supabase.from('product_suppliers').select('product_id, suppliers(id, nama_supplier, jenis)').in('product_id', ids))
    const byProd: Record<string, any[]> = {}
    ;(ps || []).forEach((r: any) => { if (r.suppliers) { (byProd[r.product_id] = byProd[r.product_id] || []).push(r.suppliers) } })
    setGuidedItems(low.map((p: any) => {
      const sup = byProd[p.id] || []
      const target = Math.max(1, (p.stok_minimum || 0) * 2 - (p.stok_total || 0)) // restok ke ~2× stok minimum
      return { product_id: p.id, nama: p.nama_obat, satuan: p.satuan, stok_total: p.stok_total ?? 0, stok_minimum: p.stok_minimum ?? 0, harga_beli: p.harga_beli || 0, qty: target, suppliers: sup, supplier_id: sup[0]?.id || '' }
    }))
    setGuidedStep(1); setGuidedOpen(true); setGuidedLoading(false)
  }

  const closeGuided = () => { setGuidedOpen(false); setGuidedStep(1); setGuidedItems([]) }
  const updateGuided = (pid: string, field: string, value: any) =>
    setGuidedItems(prev => prev.map(i => i.product_id === pid ? { ...i, [field]: value } : i))
  const supName = (id: string) => suppliers.find((s: any) => s.id === id)?.nama_supplier || '-'

  const submitGuided = async () => {
    const valid = guidedItems.filter(i => i.supplier_id && i.qty > 0)
    if (valid.length === 0) { alert(t('Tidak ada item dengan supplier & qty yang valid.', 'No items with a valid supplier & qty.')); return }
    setGuidedLoading(true)
    const groups: Record<string, any[]> = {}
    valid.forEach(i => { (groups[i.supplier_id] = groups[i.supplier_id] || []).push(i) })
    const created: string[] = []
    const cid = (isSuper && superViewCompany) ? { company_id: superViewCompany } : {}
    try {
      for (const sid of Object.keys(groups)) {
        const items = groups[sid]
        const total_nilai = items.reduce((a, b) => a + b.qty * b.harga_beli, 0)
        const { data: po, error } = await supabase.from('purchase_orders').insert([{ supplier_id: sid, total_nilai, catatan: t('Order terpandu, restok otomatis', 'Guided order, auto restock'), ...cid }]).select().single()
        if (error) { alert('Error: ' + error.message); setGuidedLoading(false); return }
        await supabase.from('po_items').insert(items.map(i => ({ po_id: po.id, product_id: i.product_id, nama_produk: i.nama, satuan: i.satuan, qty_pesan: i.qty, harga_beli: i.harga_beli, subtotal: i.qty * i.harga_beli, ...cid })))
        created.push(po.nomor_po)
      }
      closeGuided(); fetchPOList()
      alert(`✅ ${created.length} ${t('PO berhasil dibuat & siap kirim', 'POs created & ready to send')}: ${created.join(', ')}`)
    } catch (e) { alert(t('Terjadi kesalahan, coba lagi.', 'An error occurred, please try again.')) }
    finally { setGuidedLoading(false) }
  }

  const openPenerimaan = async (po: any) => {
    const { data: items } = await supabase.from('po_items').select('*, products(nama_obat, stok_total)').eq('po_id', po.id)
    setPenerimaanItems(items?.map((item: any) => ({
      ...item,
      qty_terima: item.qty_terima || item.qty_pesan,
      batch_number: item.batch_number || '',
      expired_date: item.expired_date || '',
      harga_beli: item.harga_beli || 0,
    })) || [])
    setFakturForm({ nomor_faktur: '', tanggal_faktur: new Date().toISOString().split('T')[0], term_of_payment: 30 })
    setShowPenerimaan(po)
  }

  const submitPenerimaan = async (closePO: boolean) => {
    if (!showPenerimaan) return
    for (const item of penerimaanItems) {
      if (item.qty_terima > 0) {
        // Update stok produk
        await supabase.from('products').update({
          stok_total: (item.products?.stok_total || 0) + item.qty_terima,
          harga_beli: item.harga_beli
        }).eq('id', item.product_id)

        // Catat ke product_batches
        if (item.batch_number && item.expired_date) {
          await supabase.from('product_batches').insert([{
            product_id: item.product_id,
            batch_number: item.batch_number,
            expired_date: item.expired_date,
            stok_batch: item.qty_terima
          }])
        }

        // Update po_items
        await supabase.from('po_items').update({
          qty_terima: item.qty_terima,
          batch_number: item.batch_number,
          expired_date: item.expired_date,
          harga_beli: item.harga_beli,
          subtotal: item.qty_terima * item.harga_beli
        }).eq('id', item.id)
      }
    }

    const newStatus = closePO ? 'selesai' : 'dikirim'
    const newStatusPenerimaan = closePO ? 'selesai' : 'partial'
    await supabase.from('purchase_orders').update({
      status: newStatus,
      status_penerimaan: newStatusPenerimaan,
      tanggal_terima: new Date().toISOString().split('T')[0]
    }).eq('id', showPenerimaan.id)

    // Buat faktur pembelian dari penerimaan ini (jika nomor faktur diisi)
    let fakturMsg = ''
    if (fakturForm.nomor_faktur.trim()) {
      const totalFaktur = penerimaanItems.reduce((a, b) => a + (b.qty_terima > 0 ? b.qty_terima * b.harga_beli : 0), 0)
      const jt = new Date(fakturForm.tanggal_faktur)
      jt.setDate(jt.getDate() + (Number(fakturForm.term_of_payment) || 0))
      const { error: fErr } = await supabase.from('faktur').insert([{
        nomor_faktur: fakturForm.nomor_faktur.trim(),
        po_id: showPenerimaan.id,
        supplier_id: showPenerimaan.supplier_id,
        tanggal_faktur: fakturForm.tanggal_faktur,
        term_of_payment: Number(fakturForm.term_of_payment) || 0,
        tanggal_jatuh_tempo: jt.toISOString().split('T')[0],
        total: totalFaktur,
        status: 'belum_bayar',
      }])
      fakturMsg = fErr ? `\n⚠️ ${t('Faktur gagal disimpan:', 'Failed to save invoice:')} ${fErr.message}` : `\n🧾 ${t('Faktur', 'Invoice')} ${fakturForm.nomor_faktur.trim()} ${t('tercatat (jatuh tempo', 'recorded (due')} ${jt.toLocaleDateString('id-ID')}).`
    }

    setShowPenerimaan(null)
    setPenerimaanItems([])
    fetchPOList()
    alert((closePO ? t('✅ PO selesai! Stok dan batch sudah diupdate.', '✅ PO completed! Stock and batches updated.') : t('✅ Penerimaan parsial disimpan. PO masih terbuka.', '✅ Partial receipt saved. PO still open.')) + fakturMsg)
  }

  const printPO = async (po: any) => {
    const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id)
    const supplier = po.suppliers
    const win = window.open('', '_blank', 'width=800,height=900')
    win?.document.write(`<html><head><title>PO - ${po.nomor_po}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;font-size:12px;padding:32px;}
      .header{display:flex;justify-content:space-between;margin-bottom:24px;}
      h1{font-size:18px;font-weight:bold;margin-bottom:4px;}
      table{width:100%;border-collapse:collapse;margin:16px 0;}
      th{background:#1e3a2c;color:white;padding:8px;text-align:left;font-size:11px;}
      td{padding:8px;border-bottom:1px solid #eee;font-size:11px;}
      .total-row td{font-weight:bold;border-top:2px solid #1e3a2c;}
      .divider{border-top:2px solid #1e3a2c;margin:12px 0;}
      .ttd{margin-top:48px;display:flex;justify-content:space-between;}
      .ttd-box{text-align:center;}
      .ttd-line{border-top:1px solid black;width:200px;margin:48px auto 4px;}
    </style></head><body>
    <div class="header">
      <div>
        <h1>${settingsData.nama_apotek}</h1>
        <p>${settingsData.alamat}</p>
        <p>SIA: ${settingsData.nomor_ijin} | Telp: ${settingsData.nomor_telepon}</p>
      </div>
      <div style="text-align:right;">
        <h1>PURCHASE ORDER</h1>
        <p><b>No. PO:</b> ${po.nomor_po}</p>
        <p><b>Tanggal:</b> ${new Date(po.tanggal_po || po.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</p>
        <p><b>Status:</b> ${po.status?.toUpperCase()}</p>
      </div>
    </div>
    <div class="divider"></div>
    <div style="margin:12px 0;">
      <p><b>Kepada Yth:</b></p>
      <p>${supplier?.nama_supplier || '-'}</p>
      <p>${supplier?.alamat || ''}</p>
      <p>${supplier?.telepon || ''}</p>
    </div>
    <table>
      <thead><tr><th>No</th><th>Nama Produk</th><th>Satuan</th><th>Qty</th><th>Harga Beli</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${items?.map((item: any, i: number) => `<tr>
          <td>${i+1}</td><td>${item.nama_produk}</td><td>${item.satuan}</td>
          <td>${item.qty_pesan}</td>
          <td>Rp ${item.harga_beli?.toLocaleString('id-ID')}</td>
          <td>Rp ${item.subtotal?.toLocaleString('id-ID')}</td>
        </tr>`).join('')}
        <tr class="total-row"><td colspan="5">TOTAL</td><td>Rp ${po.total_nilai?.toLocaleString('id-ID')}</td></tr>
      </tbody>
    </table>
    ${po.catatan ? `<p><b>Catatan:</b> ${po.catatan}</p>` : ''}
    <div class="ttd">
      <div class="ttd-box">
        <p>Hormat kami,</p>
        <div class="ttd-line"></div>
        <p><b>${settingsData.nama_apoteker || 'Apoteker'}</b></p>
        <p>SIPA: ${settingsData.nomor_sipa || '-'}</p>
      </div>
      <div class="ttd-box">
        <p>Diterima oleh,</p>
        <div class="ttd-line"></div>
        <p><b>${supplier?.nama_supplier || '-'}</b></p>
      </div>
    </div>
    </body></html>`)
    win?.document.close(); win?.print()
  }

  const statusPOColor: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    dikirim: 'bg-blue-100 text-blue-700',
    selesai: 'bg-green-100 text-green-700',
    dibatalkan: 'bg-red-100 text-red-700',
  }

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
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    setCompanies(data || [])
  }

  const toggleCompanyStatus = async (c: any) => {
    const next = c.status === 'aktif' ? 'nonaktif' : 'aktif'
    if (!confirm(`${next === 'aktif' ? t('Aktifkan', 'Activate') : t('Nonaktifkan', 'Deactivate')} ${t('apotek', 'pharmacy')} "${c.nama}"?`)) return
    await supabase.from('companies').update({ status: next }).eq('id', c.id)
    fetchCompanies()
  }

  const simpanMasaAktif = async (tanpaBatas: boolean) => {
    if (!showMasaAktif) return
    await supabase.from('companies').update({
      valid_sampai: tanpaBatas ? null : (masaAktifDate || null),
      // set aktif sekalian saat memperpanjang masa aktif
      status: 'aktif',
    }).eq('id', showMasaAktif.id)
    setShowMasaAktif(null)
    fetchCompanies()
  }

  // ── Migrasi Data (import/export CSV) ──
  const parseCSV = (text: string): Record<string, string>[] => {
    text = text.replace(/\r\n?/g, '\n')
    const rows: string[][] = []
    let cur: string[] = [], field = '', inQ = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
        else field += c
      } else if (c === '"') inQ = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
      else field += c
    }
    if (field.length || cur.length) { cur.push(field); rows.push(cur) }
    const header = (rows.shift() || []).map(h => h.trim())
    return rows.filter(r => r.some(c => c.trim() !== '')).map(r => {
      const o: Record<string, string> = {}
      header.forEach((h, i) => { o[h] = (r[i] ?? '').trim() })
      return o
    })
  }

  const downloadTemplate = (filename: string, headers: string[], examples: string[][]) => {
    const esc = (v: string) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
    const lines = [headers.join(','), ...examples.map(r => r.map(esc).join(','))]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

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
      if (activePage === 'supplier') fetchSuppliers()
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
      if (activePage === 'faktur') fetchFaktur()
    } catch (e: any) { setImportInfo(p => ({ ...p, fakturawal: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  // ── Export / Backup ke CSV ──
  const scopeExport = (q: any) => (isSuper && migrasiCompany) ? q.eq('company_id', migrasiCompany) : q
  const exportProduk = async () => {
    const { data } = await scopeExport(supabase.from('products').select('*').order('kode'))
    const headers = ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum']
    downloadTemplate('export_produk.csv', headers, (data || []).map((p: any) => headers.map(h => String(p[h] ?? ''))))
  }
  const exportSupplier = async () => {
    const { data } = await scopeExport(supabase.from('suppliers').select('*').order('kode'))
    const headers = ['kode', 'nama_supplier', 'jenis', 'alamat', 'telepon', 'email']
    downloadTemplate('export_supplier.csv', headers, (data || []).map((s: any) => headers.map(h => String(s[h] ?? ''))))
  }
  const exportStok = async () => {
    const { data } = await scopeExport(supabase.from('product_batches').select('*, products(kode)').order('expired_date'))
    const headers = ['kode_produk', 'batch_number', 'expired_date', 'stok_batch']
    downloadTemplate('export_stok_batch.csv', headers, (data || []).map((b: any) => [b.products?.kode || '', b.batch_number || '', b.expired_date || '', String(b.stok_batch ?? '')]))
  }
  const exportTransaksi = async () => {
    const { data } = await scopeExport(supabase.from('transactions').select('*').order('created_at', { ascending: false }))
    const headers = ['nomor_transaksi', 'tanggal', 'total', 'bayar', 'kembalian', 'status', 'nama_pasien', 'kontak_pasien', 'alamat_pasien', 'nomor_resep']
    downloadTemplate('export_transaksi.csv', headers, (data || []).map((t: any) => [
      t.nomor_transaksi || '', t.created_at || '', String(t.total ?? ''), String(t.bayar ?? ''), String(t.kembalian ?? ''),
      t.status || '', t.nama_pasien || '', t.kontak_pasien || '', t.alamat_pasien || '', t.nomor_resep || '',
    ]))
  }
  const exportFaktur = async () => {
    const { data } = await scopeExport(supabase.from('faktur').select('*, suppliers(nama_supplier), purchase_orders(nomor_po)').order('tanggal_faktur', { ascending: false }))
    const headers = ['nomor_faktur', 'supplier', 'nomor_po', 'tanggal_faktur', 'term_of_payment', 'tanggal_jatuh_tempo', 'total', 'status', 'tanggal_bayar', 'metode_bayar', 'catatan_bayar']
    downloadTemplate('export_faktur.csv', headers, (data || []).map((f: any) => [
      f.nomor_faktur || '', f.suppliers?.nama_supplier || '', f.purchase_orders?.nomor_po || '', f.tanggal_faktur || '',
      String(f.term_of_payment ?? ''), f.tanggal_jatuh_tempo || '', String(f.total ?? ''), f.status || '',
      f.tanggal_bayar || '', f.metode_bayar || '', f.catatan_bayar || '',
    ]))
  }

  const fetchStats = async () => {
    const { count: produkCount } = await scopeQ(supabase.from('products').select('*', { count: 'exact', head: true }))
    setStatProduk(produkCount || 0)
    const today = new Date().toISOString().split('T')[0]
    const { data: trxHariIni } = await scopeQ(supabase.from('transactions').select('total').gte('created_at', today))
    setStatTrxHariIni(trxHariIni?.length || 0)
    setStatOmzet(trxHariIni?.reduce((a: number, b: any) => a + b.total, 0) || 0)
    const in60 = new Date(); in60.setDate(new Date().getDate() + 60)
    const { count: expCount } = await scopeQ(supabase.from('product_batches')
      .select('*', { count: 'exact', head: true })
      .lte('expired_date', in60.toISOString().split('T')[0])
      .gt('stok_batch', 0))
    setStatExpired(expCount || 0)
    fetchDashboardWidgets()
  }

  // Kunci tanggal lokal (bukan UTC) supaya transaksi hari ini tidak "tergeser" 1 hari
  const localKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const fetchSalesChart = async (range: '7d' | '30d' = chartRange) => {
    const span = range === '30d' ? 30 : 7
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (span - 1))
    const days: Date[] = []
    for (let i = 0; i < span; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
    const { data: trx } = await scopeQ(supabase.from('transactions').select('total,created_at,status').gte('created_at', start.toISOString()))
    // Bucket transaksi berdasarkan tanggal LOKAL: total omzet + jumlah transaksi
    const bucket: Record<string, { value: number; count: number }> = {}
    ;(trx || []).forEach((x: any) => {
      if (x.status === 'dibatalkan' || !x.created_at) return
      const k = localKey(new Date(x.created_at))
      if (!bucket[k]) bucket[k] = { value: 0, count: 0 }
      bucket[k].value += (x.total || 0)
      bucket[k].count += 1
    })
    setSalesChart(days.map((d, i) => {
      const b = bucket[localKey(d)] || { value: 0, count: 0 }
      // 7 hari: tampilkan nama hari. 30 hari: tampilkan tgl tiap ~5 titik
      const label = span === 7
        ? d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { weekday: 'short' })
        : (i % 5 === 0 || i === span - 1) ? d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' }) : ''
      return { label, day: d.getDate(), value: b.value, count: b.count }
    }))
  }

  const fetchDashboardWidgets = async () => {
    await fetchSalesChart()

    // Produk terlaris (30 hari)
    const d30 = new Date(); d30.setDate(d30.getDate() - 30)
    const { data: items } = await scopeQ(supabase.from('transaction_items').select('nama_obat,jumlah,transactions(status,created_at)'))
    const map: Record<string, number> = {}
    ;(items || []).forEach((it: any) => {
      if (it.transactions?.status === 'dibatalkan') return
      if (!it.transactions?.created_at || new Date(it.transactions.created_at) < d30) return
      map[it.nama_obat] = (map[it.nama_obat] || 0) + (it.jumlah || 0)
    })
    setBestSellers(Object.entries(map).map(([nama, qty]) => ({ nama, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5))

    // Stok minim
    const { data: prods } = await scopeQ(supabase.from('products').select('nama_obat,kode,stok_total,stok_minimum').order('stok_total'))
    setLowStock((prods || []).filter((p: any) => (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)).slice(0, 8))

    // Segera expired
    const in60 = new Date(); in60.setDate(in60.getDate() + 60)
    const { data: batches } = await scopeQ(supabase.from('product_batches')
      .select('batch_number,expired_date,stok_batch,products(nama_obat)')
      .lte('expired_date', in60.toISOString().split('T')[0]).gt('stok_batch', 0).order('expired_date'))
    setExpiringSoon((batches || []).slice(0, 6))

    // Tagihan faktur akan jatuh tempo (belum lunas), urut jatuh tempo terdekat
    const { data: fakturs } = await scopeQ(supabase.from('faktur')
      .select('nomor_faktur,tanggal_jatuh_tempo,total,status,suppliers(nama_supplier)')
      .neq('status', 'lunas'))
    setDueInvoices((fakturs || [])
      .filter((f: any) => f.tanggal_jatuh_tempo)
      .sort((a: any, b: any) => new Date(a.tanggal_jatuh_tempo).getTime() - new Date(b.tanggal_jatuh_tempo).getTime())
      .slice(0, 6))
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

  const openTindakLanjut = async (batch: any) => {
  setShowTindakLanjut(batch)
  setTindakLanjutMode('pilih')
  setFormMusnahkan({ tanggal_musnahkan: new Date().toISOString().split('T')[0], qty_musnahkan: batch.stok_batch, metode: 'Dibakar', saksi_1: settingsData.nama_apoteker || '', saksi_2: '', keterangan: '' })
  setFormRetur({ supplier_id: '', tanggal_retur: new Date().toISOString().split('T')[0], qty_retur: batch.stok_batch, alasan: 'Produk mendekati/melebihi expired date' })
  setBatchSupplier(null)
  if (batch.po_id) {
    const { data: po } = await supabase.from('purchase_orders').select('*, suppliers(*)').eq('id', batch.po_id).single()
    if (po) setBatchSupplier(po.suppliers)
  } else {
    const { data: ps } = await supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', batch.product_id).limit(1).single()
    if (ps) setBatchSupplier(ps.suppliers)
  }
}

const submitCloseBatch = async () => {
  if (!showTindakLanjut) return
  if (!confirm(t('Tandai batch ini selesai ditindaklanjuti?\nAlert akan dihapus. Stok total TIDAK dipotong, ini hanya pengingat.', 'Mark this batch as followed up?\nThe alert will be removed. Total stock is NOT deducted, reminder only.'))) return
  // Hanya menghapus batch dari daftar reminder (stok_batch -> 0).
  // Stok total produk TIDAK diubah di sini (bukan mutasi stok, hanya pengingat).
  await supabase.from('product_batches').update({ stok_batch: 0 }).eq('id', showTindakLanjut.id)
  setShowTindakLanjut(null)
  fetchExpiredAlerts()
  if (showProdukDetail) openProdukDetail(showProdukDetail)
  alert(t('✅ Batch ditandai selesai, alert dihapus. Stok total tidak berubah.', '✅ Batch marked done, alert removed. Total stock unchanged.'))
}

const submitMusnahkan = async () => {
  if (!showTindakLanjut) return
  const { data: ba, error } = await supabase.from('pemusnahan').insert([{ batch_id: showTindakLanjut.id, product_id: showTindakLanjut.product_id, ...formMusnahkan }]).select().single()
  if (error) { alert('Error: ' + error.message); return }
  await supabase.from('product_batches').update({ stok_batch: Math.max(0, showTindakLanjut.stok_batch - formMusnahkan.qty_musnahkan) }).eq('id', showTindakLanjut.id)
  await supabase.from('products').update({ stok_total: Math.max(0, (showProdukDetail?.stok_total || 0) - formMusnahkan.qty_musnahkan) }).eq('id', showTindakLanjut.product_id)
  setShowTindakLanjut(null)
  fetchExpiredAlerts()
  if (showProdukDetail) openProdukDetail(showProdukDetail)
  const win = window.open('', '_blank', 'width=800,height=900')
  win?.document.write(`<html><head><title>Berita Acara Pemusnahan</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:12px;padding:40px;}h1{font-size:16px;text-align:center;font-weight:bold;}h2{font-size:13px;text-align:center;margin-bottom:20px;}.apotek{text-align:center;margin-bottom:16px;}.divider{border-top:2px solid black;margin:12px 0;}table{width:100%;border-collapse:collapse;margin:16px 0;}td{padding:6px 8px;vertical-align:top;}.label{width:35%;font-weight:bold;}.ttd{margin-top:48px;display:flex;justify-content:space-around;}.ttd-box{text-align:center;}.ttd-line{border-top:1px solid black;width:180px;margin:48px auto 4px;}</style></head><body><div class="apotek"><h1>${settingsData.nama_apotek}</h1><p>${settingsData.alamat}</p><p>SIA: ${settingsData.nomor_ijin} | Telp: ${settingsData.nomor_telepon}</p></div><div class="divider"></div><h1>BERITA ACARA PEMUSNAHAN OBAT</h1><h2>No: ${ba.nomor_ba}</h2><table><tr><td class="label">Tanggal Pemusnahan</td><td>: ${new Date(formMusnahkan.tanggal_musnahkan).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</td></tr><tr><td class="label">Nama Produk</td><td>: ${showProdukDetail?.nama_obat}</td></tr><tr><td class="label">No. Batch</td><td>: ${showTindakLanjut.batch_number || '-'}</td></tr><tr><td class="label">Expired Date</td><td>: ${showTindakLanjut.expired_date ? new Date(showTindakLanjut.expired_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-'}</td></tr><tr><td class="label">Jumlah Dimusnahkan</td><td>: ${formMusnahkan.qty_musnahkan} ${showProdukDetail?.satuan}</td></tr><tr><td class="label">Metode Pemusnahan</td><td>: ${formMusnahkan.metode}</td></tr><tr><td class="label">Keterangan</td><td>: ${formMusnahkan.keterangan || '-'}</td></tr></table><p>Demikian berita acara ini dibuat dengan sebenarnya.</p><div class="ttd"><div class="ttd-box"><p>Apoteker Penanggung Jawab</p><div class="ttd-line"></div><p><b>${settingsData.nama_apoteker || '-'}</b></p><p>SIPA: ${settingsData.nomor_sipa || '-'}</p></div><div class="ttd-box"><p>Saksi 1</p><div class="ttd-line"></div><p><b>${formMusnahkan.saksi_1 || '-'}</b></p></div><div class="ttd-box"><p>Saksi 2</p><div class="ttd-line"></div><p><b>${formMusnahkan.saksi_2 || '-'}</b></p></div></div></body></html>`)
  win?.document.close(); win?.print()
}

const submitRetur = async () => {
  if (!showTindakLanjut) return
  const supplierId = formRetur.supplier_id || batchSupplier?.id
  if (!supplierId) { alert(t('Pilih supplier dulu!', 'Choose a supplier first!')); return }
  // Retur hanya DIAJUKAN dulu, stok belum berkurang sampai dikonfirmasi.
  const { error } = await supabase.from('retur_supplier').insert([{ batch_id: showTindakLanjut.id, product_id: showTindakLanjut.product_id, supplier_id: supplierId, qty_retur: formRetur.qty_retur, tanggal_retur: formRetur.tanggal_retur, alasan: formRetur.alasan, status: 'diajukan' }])
  if (error) { alert('Error: ' + error.message); return }
  setShowTindakLanjut(null)
  fetchExpiredAlerts()
  if (showProdukDetail) openProdukDetail(showProdukDetail)
  alert(t('✅ Retur diajukan. Stok belum berubah, konfirmasi di menu Tindak Lanjut → Retur untuk memproses.', '✅ Return filed. Stock unchanged, confirm it in Follow-up → Returns to process.'))
}

// Konfirmasi retur: stok fisik keluar → kurangi batch & stok total, status jadi 'selesai'
const konfirmasiRetur = async (row: any) => {
  if (row.status === 'selesai') { alert(t('Retur ini sudah dikonfirmasi.', 'This return is already confirmed.')); return }
  if (!confirm(t(`Konfirmasi retur ${row.nomor_retur || ''}?\nStok "${row.products?.nama_obat || ''}" akan dikurangi ${row.qty_retur} ${row.products?.satuan || ''}.`, `Confirm return ${row.nomor_retur || ''}?\nStock of "${row.products?.nama_obat || ''}" will be reduced by ${row.qty_retur} ${row.products?.satuan || ''}.`))) return
  const { data: batch } = await supabase.from('product_batches').select('stok_batch').eq('id', row.batch_id).single()
  const { data: prod } = await supabase.from('products').select('stok_total').eq('id', row.product_id).single()
  await supabase.from('product_batches').update({ stok_batch: Math.max(0, (batch?.stok_batch || 0) - row.qty_retur) }).eq('id', row.batch_id)
  await supabase.from('products').update({ stok_total: Math.max(0, (prod?.stok_total || 0) - row.qty_retur) }).eq('id', row.product_id)
  await supabase.from('retur_supplier').update({ status: 'selesai' }).eq('id', row.id)
  fetchRiwayatRetur()
  fetchExpiredAlerts()
  alert(t('✅ Retur dikonfirmasi. Stok sudah diperbarui.', '✅ Return confirmed. Stock updated.'))
}

// Batalkan retur yang masih diajukan (stok tidak terpengaruh karena belum dikurangi)
const batalRetur = async (row: any) => {
  if (row.status === 'selesai') { alert(t('Retur sudah selesai, tidak bisa dibatalkan.', 'Return is completed and cannot be cancelled.')); return }
  if (!confirm(t(`Batalkan retur ${row.nomor_retur || ''}?`, `Cancel return ${row.nomor_retur || ''}?`))) return
  await supabase.from('retur_supplier').update({ status: 'dibatalkan' }).eq('id', row.id)
  fetchRiwayatRetur()
  alert(t('Retur dibatalkan.', 'Return cancelled.'))
}

  const fetchRiwayatMusnah = async () => {
    const { data } = await scopeQ(supabase.from('pemusnahan')
      .select('*, products(nama_obat, satuan, kode), product_batches(batch_number, expired_date)')
      .order('created_at', { ascending: false }))
    setRiwayatMusnah(data || [])
  }

  const fetchRiwayatRetur = async () => {
    const { data } = await scopeQ(supabase.from('retur_supplier')
      .select('*, products(nama_obat, satuan, kode), suppliers(nama_supplier), product_batches(batch_number, expired_date)')
      .order('created_at', { ascending: false }))
    setRiwayatRetur(data || [])
  }

  const reprintBA = (row: any) => {
    const win = window.open('', '_blank', 'width=800,height=900')
    win?.document.write(`<html><head><title>Berita Acara Pemusnahan</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:12px;padding:40px;}h1{font-size:16px;text-align:center;font-weight:bold;}h2{font-size:13px;text-align:center;margin-bottom:20px;}.apotek{text-align:center;margin-bottom:16px;}.divider{border-top:2px solid black;margin:12px 0;}table{width:100%;border-collapse:collapse;margin:16px 0;}td{padding:6px 8px;vertical-align:top;}.label{width:35%;font-weight:bold;}.ttd{margin-top:48px;display:flex;justify-content:space-around;}.ttd-box{text-align:center;}.ttd-line{border-top:1px solid black;width:180px;margin:48px auto 4px;}</style></head><body><div class="apotek"><h1>${settingsData.nama_apotek || '-'}</h1><p>${settingsData.alamat || ''}</p><p>SIA: ${settingsData.nomor_ijin || '-'} | Telp: ${settingsData.nomor_telepon || '-'}</p></div><div class="divider"></div><h1>BERITA ACARA PEMUSNAHAN OBAT</h1><h2>No: ${row.nomor_ba || '-'}</h2><table><tr><td class="label">Tanggal Pemusnahan</td><td>: ${row.tanggal_musnahkan ? new Date(row.tanggal_musnahkan).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-'}</td></tr><tr><td class="label">Nama Produk</td><td>: ${row.products?.nama_obat || '-'}</td></tr><tr><td class="label">No. Batch</td><td>: ${row.product_batches?.batch_number || '-'}</td></tr><tr><td class="label">Expired Date</td><td>: ${row.product_batches?.expired_date ? new Date(row.product_batches.expired_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-'}</td></tr><tr><td class="label">Jumlah Dimusnahkan</td><td>: ${row.qty_musnahkan} ${row.products?.satuan || ''}</td></tr><tr><td class="label">Metode Pemusnahan</td><td>: ${row.metode || '-'}</td></tr><tr><td class="label">Keterangan</td><td>: ${row.keterangan || '-'}</td></tr></table><p>Demikian berita acara ini dibuat dengan sebenarnya.</p><div class="ttd"><div class="ttd-box"><p>Apoteker Penanggung Jawab</p><div class="ttd-line"></div><p><b>${settingsData.nama_apoteker || '-'}</b></p><p>SIPA: ${settingsData.nomor_sipa || '-'}</p></div><div class="ttd-box"><p>Saksi 1</p><div class="ttd-line"></div><p><b>${row.saksi_1 || '-'}</b></p></div><div class="ttd-box"><p>Saksi 2</p><div class="ttd-line"></div><p><b>${row.saksi_2 || '-'}</b></p></div></div></body></html>`)
    win?.document.close(); win?.print()
  }

  const fetchRiwayat = async () => {
    const { data } = await scopeQ(supabase.from('transactions').select('*').order('created_at', { ascending: false }))
    setRiwayat(data || [])
  }

  const cetakSIPNAP = async () => {
    const { golongan, bulan, tahun } = sipnapForm
    const monthStart = new Date(tahun, bulan - 1, 1)
    const monthEnd = new Date(tahun, bulan, 1)
    const inMonth = (d: any) => { const t = new Date(d); return t >= monthStart && t < monthEnd }
    const before = (d: any) => new Date(d) < monthStart
    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const fmtED = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'

    const { data: prods } = await scopeQ(supabase.from('products').select('*').eq('kategori', golongan).order('nama_obat'))
    if (!prods || prods.length === 0) { alert(t('Belum ada produk berkategori ', 'No products in category ') + golongan + '.'); return }
    const ids = prods.map((p: any) => p.id)

    const { data: penerimaan } = await supabase.from('po_items')
      .select('product_id, qty_terima, purchase_orders(tanggal_terima, suppliers(nama_supplier))').in('product_id', ids)
    const { data: pengeluaran } = await supabase.from('transaction_items')
      .select('product_id, jumlah, transactions(created_at, nama_pasien, alamat_pasien, kontak_pasien, nomor_resep, status)').in('product_id', ids)
    const { data: batches } = await supabase.from('product_batches')
      .select('product_id, batch_number, expired_date').in('product_id', ids)

    let rowsHtml = ''
    prods.forEach((p: any, idx: number) => {
      const recAll = (penerimaan || []).filter((r: any) => r.product_id === p.id && r.purchase_orders?.tanggal_terima)
      const outAll = (pengeluaran || []).filter((r: any) => r.product_id === p.id && r.transactions?.status !== 'dibatalkan' && r.transactions?.created_at)

      const awal = recAll.filter((r: any) => before(r.purchase_orders.tanggal_terima)).reduce((a: number, r: any) => a + (r.qty_terima || 0), 0)
                 - outAll.filter((r: any) => before(r.transactions.created_at)).reduce((a: number, r: any) => a + (r.jumlah || 0), 0)

      const recMonth = recAll.filter((r: any) => inMonth(r.purchase_orders.tanggal_terima))
        .map((r: any) => ({ tgl: fmt(r.purchase_orders.tanggal_terima), sumber: r.purchase_orders?.suppliers?.nama_supplier || '-', jml: r.qty_terima || 0 }))
      const outMonth = outAll.filter((r: any) => inMonth(r.transactions.created_at))
        .map((r: any) => ({
          tgl: fmt(r.transactions.created_at), resep: r.transactions?.nomor_resep || '-',
          pasien: [r.transactions?.nama_pasien, r.transactions?.alamat_pasien, r.transactions?.kontak_pasien].filter(Boolean).join(' / ') || '-',
          jml: r.jumlah || 0,
        }))

      const masuk = recMonth.reduce((a: number, r: any) => a + r.jml, 0)
      const keluar = outMonth.reduce((a: number, r: any) => a + r.jml, 0)
      const totalP = awal + masuk
      const akhir = totalP - keluar
      const batchStr = (batches || []).filter((b: any) => b.product_id === p.id).map((b: any) => `${b.batch_number || '-'} (ED ${fmtED(b.expired_date)})`).join('<br>') || '-'

      const n = Math.max(recMonth.length, outMonth.length, 1)
      for (let i = 0; i < n; i++) {
        const rec = recMonth[i]; const out = outMonth[i]
        rowsHtml += '<tr>'
        if (i === 0) {
          rowsHtml += `<td rowspan="${n}" class="c">${idx + 1}</td><td rowspan="${n}" class="l">${p.nama_obat}</td><td rowspan="${n}" class="c">${p.satuan || ''}</td><td rowspan="${n}" class="c">${awal}</td>`
        }
        rowsHtml += `<td class="c">${rec ? rec.tgl : ''}</td><td class="l">${rec ? rec.sumber : ''}</td><td class="c">${rec ? rec.jml : ''}</td>`
        if (i === 0) rowsHtml += `<td rowspan="${n}" class="c">${totalP}</td>`
        rowsHtml += `<td class="c">${out ? out.tgl + '<br>' + out.resep : ''}</td><td class="l">${out ? out.pasien : ''}</td><td class="c">${out ? out.jml : ''}</td>`
        if (i === 0) rowsHtml += `<td rowspan="${n}" class="c">${akhir}</td><td rowspan="${n}" class="l">${batchStr}</td>`
        rowsHtml += '</tr>'
      }
    })

    const namaBulan = new Date(tahun, bulan - 1, 1).toLocaleDateString('id-ID', { month: 'long' })
    const judul = golongan === 'narkotika' ? 'NARKOTIKA' : golongan === 'psikotropika' ? 'PSIKOTROPIKA' : 'PREKURSOR'
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const win = window.open('', '_blank', 'width=1200,height=800')
    win?.document.write(`<html><head><title>Laporan SIPNAP ${judul} ${namaBulan} ${tahun}</title><style>
      @page { size: A4 landscape; margin: 12mm; }
      *{box-sizing:border-box;} body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:10px;}
      h1{text-align:center;font-size:15px;margin-bottom:16px;}
      .info td{padding:1px 4px;font-size:11px;}
      table.rep{width:100%;border-collapse:collapse;margin-top:8px;}
      table.rep th, table.rep td{border:1px solid #000;padding:3px 5px;font-size:10px;}
      table.rep th{text-align:center;font-weight:bold;}
      .c{text-align:center;} .l{text-align:left;}
      .sign{margin-top:40px;width:100%;}
      .sign .box{width:280px;float:right;text-align:center;}
      .sign .nm{font-weight:bold;text-decoration:underline;margin-top:56px;}
    </style></head><body>
      <h1>LAPORAN PENGGUNAAN ${judul}</h1>
      <table class="info">
        <tr><td>Nama Sarana</td><td>: ${settingsData.nama_apotek || '-'}</td></tr>
        <tr><td>Alamat</td><td>: ${settingsData.alamat || '-'}</td></tr>
        <tr><td>Bulan/Tahun</td><td>: ${namaBulan} ${tahun}</td></tr>
      </table>
      <table class="rep">
        <thead>
          <tr>
            <th rowspan="2">No</th><th rowspan="2">Nama Sediaan</th><th rowspan="2">Satuan</th><th rowspan="2">Persediaan Awal</th>
            <th colspan="3">Penerimaan</th>
            <th rowspan="2">Total Persediaan</th>
            <th colspan="3">Pengeluaran</th>
            <th rowspan="2">Persediaan Akhir Bulan</th>
            <th rowspan="2">No. Batch &amp; ED</th>
          </tr>
          <tr>
            <th>Tanggal</th><th>Sumber</th><th>Jumlah</th>
            <th>Tanggal/No. Resep</th><th>Nama /Alamat Pasien</th><th>Jumlah</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="sign">
        <div class="box">
          <p>${settingsData.kota || ''}${settingsData.kota ? ', ' : ''}${tglCetak}</p>
          <p>Penanggung Jawab Farmasi</p>
          <p class="nm">${settingsData.nama_apoteker || '-'}</p>
          <p>SIPA: ${settingsData.nomor_sipa || '-'}</p>
        </div>
      </div>
    </body></html>`)
    win?.document.close(); win?.print()
  }

  const fetchSuppliers = async () => {
    const { data } = await scopeQ(supabase.from('suppliers').select('*').order('kode'))
    setSuppliers(data || [])
  }

  // ── Layanan Jasa (services) ──
  const fetchServices = async () => {
    const { data } = await scopeQ(supabase.from('services').select('*').order('nama'))
    setServices(data || [])
  }
  const handleTambahService = async () => {
    if (!serviceForm.nama.trim()) { alert(t('Nama layanan wajib diisi', 'Service name is required')); return }
    const cid = (isSuper && migrasiCompany) ? { company_id: migrasiCompany } : {}
    const { error } = await supabase.from('services').insert([{ nama: serviceForm.nama.trim(), harga: serviceForm.harga || 0, deskripsi: serviceForm.deskripsi || null, ...cid }])
    if (error) { alert('Error: ' + error.message); return }
    setShowServiceForm(false); setServiceForm({ nama: '', harga: 0, deskripsi: '' }); fetchServices()
  }
  const handleUpdateService = async () => {
    if (!editService) return
    const { error } = await supabase.from('services').update({ nama: editService.nama, harga: editService.harga || 0, deskripsi: editService.deskripsi, status: editService.status }).eq('id', editService.id)
    if (error) { alert('Error: ' + error.message); return }
    setEditService(null); fetchServices()
  }
  const handleDeleteService = async (s: any) => {
    if (!confirm(t(`Hapus layanan "${s.nama}"?`, `Delete service "${s.nama}"?`))) return
    await supabase.from('services').delete().eq('id', s.id); fetchServices()
  }

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

  const handleTambahSupplier = async () => {
    const { error } = await supabase.from('suppliers').insert([supplierForm])
    if (!error) {
      setShowSupplierForm(false)
      setSupplierForm({ nama_supplier: '', jenis: 'PBF', alamat: '', telepon: '', email: '' })
      fetchSuppliers()
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

  // Filter laporan penjualan (dipakai tab Penjualan & Metode Bayar)
  const riwayatFiltered = riwayat.filter(x => {
    const d = (x.created_at || '').split('T')[0]
    if (lapDari && d < lapDari) return false
    if (lapSampai && d > lapSampai) return false
    if (lapMetode && (x.metode_bayar || 'Tunai') !== lapMetode) return false
    if (lapStatus && (x.status || 'selesai') !== lapStatus) return false
    return true
  })

  const kategoriLabel: Record<string, string> = {
    bebas: 'Bebas', bebas_terbatas: 'Bebas Terbatas', keras: 'Keras',
    suplemen: 'Suplemen', psikotropika: 'Psikotropika', narkotika: 'Narkotika',
    prekursor: 'Prekursor', alkes: 'Alkes', lainnya: 'Lainnya',
  }

  // Apotek belum diaktivasi / masa aktif habis
  if (companyBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={AMBIENT}>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-8 max-w-md text-center">
          <div className="relative w-12 h-12 rounded-2xl bg-[#1e3a2c] flex items-center justify-center mx-auto mb-4">
            <FlaskConical size={24} className="text-white" strokeWidth={1.8} />
            <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
          </div>
          <h1 className="text-xl font-bold text-[#1c2620] mb-2">
            {companyBlocked === 'pending' ? 'Menunggu Aktivasi' : 'Masa Aktif Berakhir'}
          </h1>
          <p className="text-sm text-[#6b7280] mb-6">
            {companyBlocked === 'pending'
              ? 'Akun apotek Anda sudah terdaftar dan sedang menunggu aktivasi dari tim Seawise. Anda akan bisa masuk setelah diaktifkan.'
              : 'Masa aktif langganan apotek Anda telah berakhir. Hubungi tim Seawise untuk memperpanjang.'}
          </p>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            className="w-full bg-[#1e3a2c] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#24462f] transition">
            {t('Keluar', 'Sign out')}
          </button>
        </div>
      </div>
    )
  }

  // Tunggu role selesai dimuat sebelum render dashboard (hindari flicker menu)
  if (!currentRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={AMBIENT}>
        <div className="relative w-12 h-12 rounded-2xl bg-[#1e3a2c] flex items-center justify-center">
          <FlaskConical size={24} className="text-white" strokeWidth={1.8} />
          <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
        </div>
        <p className="text-sm text-[#6b7280]">{t('Memuat akses pengguna…', 'Loading user access…')}</p>
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
      <h2 className="text-xl font-bold text-[#1c2620] mb-1">{t('Migrasi Data', 'Data Migration')}</h2>
      <p className="text-sm text-[#6b7280] mb-5">{t('Onboarding cepat: unduh template, isi di Excel/Sheets, lalu upload CSV.', 'Fast onboarding: download a template, fill it in Excel/Sheets, then upload the CSV.')}</p>
      {isSuper && (
        <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{t('Mode Super Admin', 'Super Admin Mode')}</p>
            <p className="text-xs text-amber-700">{t('Pilih apotek tujuan, data import/export akan masuk/diambil dari apotek ini.', 'Select a target pharmacy, imported/exported data goes to/from this pharmacy.')}</p>
          </div>
          <select value={migrasiCompany} onChange={e => setMigrasiCompany(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
            <option value="">{t('Pilih Apotek', 'Select Pharmacy')}</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {migrasiCards.map(c => (
          <div key={c.key} className="border border-[#e2ddd3] rounded-2xl p-4 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[#dce5db] text-[#2f5741] flex items-center justify-center mb-3"><c.Icon size={18} strokeWidth={1.9} /></div>
            <h3 className="font-bold text-[#1c2620] text-sm">{c.title}</h3>
            <p className="text-xs text-[#6b7280] mt-1 mb-3">{c.desc}</p>
            <div className="bg-[#f5f2eb] rounded-lg p-2.5 mb-3">
              <p className="text-[10px] font-medium text-[#6b7280] mb-1">{t('Kolom CSV:', 'CSV Columns:')}</p>
              <p className="text-[10px] text-[#1c2620] font-mono leading-relaxed break-words">{c.cols}</p>
            </div>
            <p className="text-[10px] text-[#9ca3af] mb-3">{c.hint}</p>
            <div className="mt-auto flex flex-col gap-2">
              <button onClick={() => downloadTemplate(c.file, c.headers, c.examples)}
                className="inline-flex items-center justify-center gap-2 border border-[#d1cdc4] text-[#1e3a2c] py-2 rounded-lg text-xs font-medium hover:bg-[#f5f2eb] transition">
                <Download size={14} /> {t('Download Template', 'Download Template')}
              </button>
              <label className={`inline-flex items-center justify-center gap-2 bg-[#1e3a2c] text-white py-2 rounded-lg text-xs font-medium hover:bg-[#24462f] transition cursor-pointer ${importing === c.key ? 'opacity-60 pointer-events-none' : ''}`}>
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
      <div className="mt-5 bg-[#f5f2eb] rounded-xl p-3.5 text-xs text-[#6b7280]">
        <p className="font-medium text-[#1c2620] mb-1">{t('Urutan yang disarankan', 'Recommended order')}</p>
        <p>{t('1) Import Produk → 2) Supplier → 3) Stok Awal → 4) Mapping Produk–Supplier. Simpan file sebagai CSV UTF-8.', '1) Import Products → 2) Suppliers → 3) Opening Stock → 4) Product–Supplier Mapping. Save the file as CSV UTF-8.')}</p>
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-bold text-[#1c2620] mb-1">{t('Export / Backup Data', 'Export / Backup Data')}</h3>
        <p className="text-xs text-[#6b7280] mb-3">{t('Unduh data apotek saat ini ke CSV.', 'Download current pharmacy data to CSV.')}</p>
        <div className="flex flex-wrap gap-2">
          {([['Produk', exportProduk], ['Supplier', exportSupplier], ['Stok / Batch', exportStok], ['Transaksi', exportTransaksi], ['Faktur', exportFaktur]] as const).map(([label, fn]) => (
            <button key={label} onClick={() => { if (isSuper && !migrasiCompany) return alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); (fn as () => void)() }}
              className="inline-flex items-center gap-2 border border-[#d1cdc4] text-[#1e3a2c] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#f5f2eb] transition"><Download size={14} /> {t('Export', 'Export')} {label}</button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Modal Tindak Lanjut Batch */}
{showTindakLanjut && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#1e3a2c]">{t('Tindak Lanjut Batch', 'Batch Follow-up')}</h2>
        <p className="text-xs text-[#6b7280]">{showProdukDetail?.nama_obat} · Batch: {showTindakLanjut.batch_number || '-'} · Exp: {showTindakLanjut.expired_date ? new Date(showTindakLanjut.expired_date).toLocaleDateString('id-ID') : '-'} · {t('Stok', 'Stock')}: {showTindakLanjut.stok_batch}</p>
      </div>
      {tindakLanjutMode === 'pilih' && (
        <div className="space-y-3">
          <button onClick={submitCloseBatch} className="w-full flex items-start gap-4 p-4 border-2 border-[#d1cdc4] rounded-xl hover:border-[#1e3a2c] hover:bg-[#f5f2eb] transition text-left">
            <span className="text-2xl">✅</span>
            <div><p className="font-semibold text-[#1e3a2c] text-sm">{t('Tandai Selesai (Reminder)', 'Mark Done (Reminder)')}</p><p className="text-xs text-[#6b7280] mt-0.5">{t('Hapus alert batch ini dari daftar. Stok total tidak dipotong, hanya pengingat.', 'Remove this batch alert from the list. Total stock is not deducted, reminder only.')}</p></div>
          </button>
          <button onClick={() => setTindakLanjutMode('musnahkan')} className="w-full flex items-start gap-4 p-4 border-2 border-[#d1cdc4] rounded-xl hover:border-red-400 hover:bg-red-50 transition text-left">
            <span className="text-2xl">🔥</span>
            <div><p className="font-semibold text-[#1e3a2c] text-sm">{t('Musnahkan', 'Destroy')}</p><p className="text-xs text-[#6b7280] mt-0.5">{t('Buat Berita Acara Pemusnahan dan cetak dokumen resmi.', 'Create a Destruction Report and print the official document.')}</p></div>
          </button>
          <button onClick={() => setTindakLanjutMode('retur')} className="w-full flex items-start gap-4 p-4 border-2 border-[#d1cdc4] rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-left">
            <span className="text-2xl">↩️</span>
            <div><p className="font-semibold text-[#1e3a2c] text-sm">{t('Retur ke Supplier', 'Return to Supplier')}</p><p className="text-xs text-[#6b7280] mt-0.5">{batchSupplier ? `${t('Retur ke', 'Return to')} ${batchSupplier.nama_supplier}` : t('Pilih supplier untuk retur', 'Choose a supplier for the return')}</p></div>
          </button>
          <button onClick={() => setShowTindakLanjut(null)} className="w-full border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
        </div>
      )}
      {tindakLanjutMode === 'musnahkan' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Tanggal Pemusnahan', 'Destruction Date')}</label><input type="date" value={formMusnahkan.tanggal_musnahkan} onChange={e => setFormMusnahkan({...formMusnahkan, tanggal_musnahkan: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Qty Dimusnahkan', 'Qty Destroyed')}</label><input type="number" value={formMusnahkan.qty_musnahkan} max={showTindakLanjut.stok_batch} onChange={e => setFormMusnahkan({...formMusnahkan, qty_musnahkan: +e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
          </div>
          <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Metode', 'Method')}</label>
            <select value={formMusnahkan.metode} onChange={e => setFormMusnahkan({...formMusnahkan, metode: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
              <option>Dibakar</option><option>Dikubur</option><option>Dihancurkan</option><option>Dilarutkan & Dibuang</option><option>Lainnya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Saksi 1', 'Witness 1')}</label><input value={formMusnahkan.saksi_1} onChange={e => setFormMusnahkan({...formMusnahkan, saksi_1: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Saksi 2', 'Witness 2')}</label><input value={formMusnahkan.saksi_2} onChange={e => setFormMusnahkan({...formMusnahkan, saksi_2: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
          </div>
          <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Keterangan', 'Notes')}</label><textarea value={formMusnahkan.keterangan} rows={2} onChange={e => setFormMusnahkan({...formMusnahkan, keterangan: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
          <div className="flex gap-3"><button onClick={() => setTindakLanjutMode('pilih')} className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Kembali', 'Back')}</button><button onClick={submitMusnahkan} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">🔥 {t('Musnahkan & Cetak BA', 'Destroy & Print Report')}</button></div>
        </div>
      )}
      {tindakLanjutMode === 'retur' && (
        <div className="space-y-3">
          {batchSupplier ? (
            <div className="p-3 bg-[#f5f2eb] rounded-lg"><p className="text-xs text-[#6b7280] mb-0.5">{t('Supplier dari PO asal', 'Supplier from original PO')}</p><p className="font-semibold text-[#1e3a2c]">{batchSupplier.nama_supplier}</p></div>
          ) : (
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Pilih Supplier *', 'Choose Supplier *')}</label>
              <select value={formRetur.supplier_id} onChange={e => setFormRetur({...formRetur, supplier_id: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                <option value="">{t('-- Pilih Supplier --', '-- Choose Supplier --')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Tanggal Retur', 'Return Date')}</label><input type="date" value={formRetur.tanggal_retur} onChange={e => setFormRetur({...formRetur, tanggal_retur: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
            <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Qty Retur', 'Return Qty')}</label><input type="number" value={formRetur.qty_retur} max={showTindakLanjut.stok_batch} onChange={e => setFormRetur({...formRetur, qty_retur: +e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
          </div>
          <div><label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Alasan', 'Reason')}</label><textarea value={formRetur.alasan} rows={2} onChange={e => setFormRetur({...formRetur, alasan: e.target.value})} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" /></div>
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <span>ℹ️</span><span>{t('Retur diajukan dulu.', 'The return is filed first.')} <b>{t('Stok baru berkurang setelah kamu Konfirmasi', 'Stock is only reduced after you Confirm')}</b> {t('di menu Tindak Lanjut → Retur.', 'in Follow-up → Returns.')}</span>
          </div>
          <div className="flex gap-3"><button onClick={() => setTindakLanjutMode('pilih')} className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Kembali', 'Back')}</button><button onClick={submitRetur} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">↩️ {t('Ajukan Retur', 'File Return')}</button></div>
        </div>
      )}
    </div>
  </div>
)}
{/* Modal Detail Produk */}
      {showProdukDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#f0ede6]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1e3a2c]">{showProdukDetail.nama_obat}</h2>
                  <p className="text-xs text-[#6b7280]">{showProdukDetail.kode} · {showProdukDetail.nama_generik}</p>
                </div>
                <button onClick={() => setShowProdukDetail(null)}
                  className="text-[#9ca3af] hover:text-[#1e3a2c] text-xl font-light">✕</button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {['info', 'batch', 'keluar', 'masuk'].map(tab => (
                  <button key={tab} onClick={() => setProdukDetailTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                      produkDetailTab === tab ? 'bg-[#1e3a2c] text-[#e8e4d9]' : 'text-[#6b7280] hover:bg-[#f5f2eb]'
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
                  <div className="col-span-2 bg-white border border-[#e2ddd3] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-xs text-[#6b7280] mb-1">• Harga Pokok</p>
                          <p className="font-semibold text-[#1c2620] text-sm tabular-nums">Rp {beli.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6b7280] mb-1">• Harga Jual</p>
                          <p className="font-semibold text-[#1c2620] text-sm tabular-nums">Rp {jual.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6b7280] mb-1">• Markup</p>
                          <p className="font-semibold text-[#1c2620] text-sm tabular-nums">{markup.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6b7280] mb-1">• Margin</p>
                          <p className="font-semibold text-[#1c2620] text-sm tabular-nums">{margin.toFixed(2)}%</p>
                        </div>
                      </div>
                      <button onClick={() => { setEditProduk(showProdukDetail); fetchProdukSuppliers(showProdukDetail.id) }}
                        title="Atur harga" className="p-2 rounded-lg text-[#1e3a2c] hover:bg-[#f5f2eb] transition">
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
                    <div key={i} className="bg-[#f5f2eb] rounded-lg p-3">
                      <p className="text-xs text-[#6b7280] mb-0.5">{item.label}</p>
                      <p className="font-medium text-[#1e3a2c] text-sm">{item.value || '-'}</p>
                    </div>
                  ))}
                  <div className="col-span-2 bg-[#f5f2eb] rounded-lg p-3">
                    <p className="text-xs text-[#6b7280] mb-0.5">Kandungan / Komposisi</p>
                    <p className="font-medium text-[#1e3a2c] text-sm">{showProdukDetail.kandungan || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-[#f5f2eb] rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Truck size={13} className="text-[#2f5741]" />
                      <p className="text-xs text-[#6b7280]">{t('Bisa dipesan di', 'Can be ordered from')}</p>
                    </div>
                    {produkSuppliers.length === 0 ? (
                      <p className="text-xs text-[#9ca3af] italic">{t('Belum ada supplier, atur lewat tombol Edit.', 'No supplier set, assign via Edit.')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {produkSuppliers.map((ps: any) => (
                          <span key={ps.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#d8d2c4] text-xs font-medium text-[#1e3a2c]">
                            {ps.suppliers?.nama_supplier || '-'}
                            {ps.suppliers?.jenis && <span className="text-[#9ca3af] font-normal">· {ps.suppliers.jenis}</span>}
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
                    <p className="text-center text-[#9ca3af] py-8">{t('Belum ada data batch', 'No batch data yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1e3a2c]">
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">No. Batch</th>
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Expired Date</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Stok Batch</th>
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Status</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Aksi</th>
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
                            <tr key={i} className={`border-b border-[#f0ede6] ${isExpired ? 'bg-red-50' : isDanger ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : ''}`}>
                              <td className="px-3 py-2 font-mono text-xs text-[#1e3a2c]">{b.batch_number || '-'}</td>
                              <td className="px-3 py-2 text-sm">
                                {b.expired_date ? new Date(b.expired_date).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '-'}
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-[#1e3a2c]">{b.stok_batch}</td>
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
                                  <button onClick={() => openTindakLanjut(b)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${isExpired || isDanger ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-[#d1cdc4] text-[#1e3a2c] hover:bg-[#f5f2eb]'}`}>
                                    Tindak Lanjut
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#9ca3af]">-</span>
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
                    <p className="text-center text-[#9ca3af] py-8">{t('Belum ada riwayat penjualan', 'No sales history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1e3a2c]">
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">No. Transaksi</th>
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Tanggal</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty</th>
                          <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Harga Jual</th>
                          <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Subtotal</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkTrxOut.map((t: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-3 py-2 font-mono text-xs text-[#1e3a2c]">{t.transactions?.nomor_transaksi}</td>
                            <td className="px-3 py-2 text-xs text-[#6b7280]">
                              {t.transactions?.created_at ? new Date(t.transactions.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-[#1e3a2c] font-medium">{t.jumlah}</td>
                            <td className="px-3 py-2 text-right text-[#6b7280]">Rp {t.harga_jual?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-right font-medium text-[#1e3a2c]">Rp {t.subtotal?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.transactions?.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                {t.transactions?.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#1e3a2c] bg-[#f5f2eb]">
                          <td colSpan={2} className="px-3 py-2 font-bold text-sm text-[#1e3a2c]">Total Keluar</td>
                          <td className="px-3 py-2 text-center font-bold text-[#1e3a2c]">
                            {produkTrxOut.filter(t => t.transactions?.status !== 'dibatalkan').reduce((a: number, b: any) => a + b.jumlah, 0)}
                          </td>
                          <td></td>
                          <td className="px-3 py-2 text-right font-bold text-[#1e3a2c]">
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
                    <p className="text-center text-[#9ca3af] py-8">{t('Belum ada riwayat penerimaan', 'No receiving history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1e3a2c]">
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">No. PO</th>
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Supplier</th>
                          <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Tgl Terima</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty Pesan</th>
                          <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty Terima</th>
                          <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Harga Beli</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produkTrxIn.map((t: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-3 py-2 font-mono text-xs text-[#1e3a2c]">{t.purchase_orders?.nomor_po}</td>
                            <td className="px-3 py-2 text-xs text-[#6b7280]">{t.purchase_orders?.suppliers?.nama_supplier}</td>
                            <td className="px-3 py-2 text-xs text-[#6b7280]">
                              {t.purchase_orders?.tanggal_terima ? new Date(t.purchase_orders.tanggal_terima).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center text-[#6b7280]">{t.qty_pesan}</td>
                            <td className="px-3 py-2 text-center font-medium text-[#1e3a2c]">{t.qty_terima || 0}</td>
                            <td className="px-3 py-2 text-right text-[#1e3a2c]">Rp {t.harga_beli?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#1e3a2c] bg-[#f5f2eb]">
                          <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[#1e3a2c]">Total Masuk</td>
                          <td className="px-3 py-2 text-center font-bold text-[#1e3a2c]">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1e3a2c] mb-4">Edit Produk, {editProduk.kode}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Obat</label>
                  <input value={editProduk.nama_obat} onChange={e => setEditProduk({...editProduk, nama_obat: e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Generik</label>
                  <input value={editProduk.nama_generik || ''} onChange={e => setEditProduk({...editProduk, nama_generik: e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">Kandungan</label>
                <input value={editProduk.kandungan || ''} onChange={e => setEditProduk({...editProduk, kandungan: e.target.value})}
                  className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Beli</label>
                  <input type="number" value={editProduk.harga_beli} onChange={e => setEditProduk({...editProduk, harga_beli: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Jual</label>
                  <input type="number" value={editProduk.harga_jual} onChange={e => setEditProduk({...editProduk, harga_jual: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Stok</label>
                  <input type="number" value={editProduk.stok_total} onChange={e => setEditProduk({...editProduk, stok_total: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Stok Minimum</label>
                  <input type="number" value={editProduk.stok_minimum} onChange={e => setEditProduk({...editProduk, stok_minimum: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
              </div>

              {/* Assign Supplier */}
              <div className="border-t border-[#f0ede6] pt-3">
                <label className="text-xs font-medium text-[#6b7280] mb-2 block">{t('Supplier Produk Ini', 'Suppliers for this Product')} <span className="text-[#9ca3af]">({produkSuppliers.length} {t('dipilih', 'selected')})</span></label>
                {suppliers.length === 0 ? (
                  <p className="text-xs text-[#9ca3af]">Belum ada supplier, tambah di menu Supplier dulu</p>
                ) : (
                  <>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                      placeholder={t('Cari supplier...', 'Search supplier...')}
                      className="w-full border border-[#d1cdc4] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
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
                            isActive ? 'border-[#1e3a2c] bg-[#f5f2eb]' : 'border-[#d1cdc4] hover:bg-gray-50'
                          }`}>
                          <div>
                            <div className="text-sm font-medium text-[#1e3a2c]">{s.nama_supplier}</div>
                            <div className="text-xs text-[#9ca3af]">{s.jenis} · {s.kode}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isActive ? 'border-[#1e3a2c] bg-[#1e3a2c]' : 'border-[#d1cdc4]'
                          }`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
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
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
              <button onClick={async () => {
                const { error } = await supabase.from('products').update({
                  nama_obat: editProduk.nama_obat, nama_generik: editProduk.nama_generik,
                  kandungan: editProduk.kandungan, harga_beli: editProduk.harga_beli,
                  harga_jual: editProduk.harga_jual, stok_total: editProduk.stok_total,
                  stok_minimum: editProduk.stok_minimum,
                }).eq('id', editProduk.id)
                if (!error) { setEditProduk(null); setProdukSuppliers([]); setSupplierSearch(''); fetchProducts() }
              }} className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}
      {showTrxDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1e3a2c]">{t('Detail Transaksi', 'Transaction Details')}</h2>
                <p className="text-xs text-[#6b7280]">{showTrxDetail.nomor_transaksi}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                showTrxDetail.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
              }`}>{showTrxDetail.status === 'dibatalkan' ? t('dibatalkan', 'cancelled') : (showTrxDetail.status || t('selesai', 'completed'))}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-[#f5f2eb] rounded-xl text-sm">
              <div>
                <p className="text-xs text-[#6b7280] mb-0.5">{t('Waktu', 'Time')}</p>
                <p className="font-medium text-[#1e3a2c]">{new Date(showTrxDetail.created_at).toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7280] mb-0.5">Total</p>
                <p className="font-bold text-[#1e3a2c]">Rp {showTrxDetail.total?.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7280] mb-0.5">{t('Bayar', 'Paid')}</p>
                <p className="font-medium text-[#1e3a2c]">Rp {showTrxDetail.bayar?.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7280] mb-0.5">{t('Kembalian', 'Change')}</p>
                <p className="font-medium text-[#1e3a2c]">Rp {showTrxDetail.kembalian?.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-[#1e3a2c]">
                  <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">{t('Produk', 'Product')}</th>
                  <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty</th>
                  <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">{t('Harga', 'Price')}</th>
                  <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {trxDetailItems.map((item, i) => (
                  <tr key={i} className={TR}>
                    <td className="px-3 py-2 font-medium text-[#1e3a2c]">{item.nama_obat}</td>
                    <td className="px-3 py-2 text-center text-[#6b7280]">{item.jumlah}</td>
                    <td className="px-3 py-2 text-right text-[#6b7280]">Rp {item.harga_jual?.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 text-right font-medium text-[#1e3a2c]">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#1e3a2c] bg-[#f5f2eb]">
                  <td colSpan={3} className="px-3 py-2 font-bold text-sm text-[#1e3a2c]">TOTAL</td>
                  <td className="px-3 py-2 text-right font-bold text-[#1e3a2c]">
                    Rp {trxDetailItems.reduce((a, b) => a + (b.subtotal || 0), 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>

            <button onClick={() => { setShowTrxDetail(null); setTrxDetailItems([]) }}
              className="w-full border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Tutup', 'Close')}</button>
          </div>
        </div>
      )}

      {/* Modal Detail PO */}
{showPODetail && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a2c]">{t('Detail PO', 'PO Details')}</h2>
          <p className="text-xs text-[#6b7280]">{showPODetail.nomor_po}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusPOColor[showPODetail.status] || 'bg-gray-100 text-gray-600'}`}>
          {showPODetail.status}
        </span>
      </div>

      {/* Info PO */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[#f5f2eb] rounded-xl text-sm">
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Supplier</p>
          <p className="font-medium text-[#1e3a2c]">{showPODetail.suppliers?.nama_supplier}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">{t('Tanggal PO', 'PO Date')}</p>
          <p className="font-medium text-[#1e3a2c]">
            {new Date(showPODetail.tanggal_po || showPODetail.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">{t('Tanggal Terima', 'Received Date')}</p>
          <p className="font-medium text-[#1e3a2c]">
            {showPODetail.tanggal_terima ? new Date(showPODetail.tanggal_terima).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">{t('Total Nilai', 'Total Value')}</p>
          <p className="font-bold text-[#1e3a2c]">Rp {showPODetail.total_nilai?.toLocaleString('id-ID')}</p>
        </div>
        {showPODetail.catatan && (
          <div className="col-span-2">
            <p className="text-xs text-[#6b7280] mb-0.5">{t('Catatan', 'Notes')}</p>
            <p className="text-[#1e3a2c]">{showPODetail.catatan}</p>
          </div>
        )}
      </div>

      {/* Tabel Item */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="bg-[#1e3a2c]">
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">{t('Produk', 'Product')}</th>
            <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">{t('Qty Pesan', 'Order Qty')}</th>
            <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">{t('Qty Terima', 'Recv Qty')}</th>
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">{t('No. Batch', 'Batch No.')}</th>
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">{t('Expired', 'Expiry')}</th>
            <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">{t('Harga Beli', 'Buy Price')}</th>
            <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {showPODetail.items?.map((item: any, i: number) => (
            <tr key={i} className={TR}>
              <td className="px-3 py-2 font-medium text-[#1e3a2c]">{item.nama_produk}</td>
              <td className="px-3 py-2 text-center text-[#6b7280]">{item.qty_pesan} {item.satuan}</td>
              <td className="px-3 py-2 text-center">
                <span className={`font-medium ${item.qty_terima < item.qty_pesan ? 'text-yellow-600' : 'text-green-600'}`}>
                  {item.qty_terima || 0} {item.satuan}
                </span>
              </td>
              <td className="px-3 py-2 text-[#6b7280] font-mono text-xs">{item.batch_number || '-'}</td>
              <td className="px-3 py-2 text-[#6b7280] text-xs">
                {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
              </td>
              <td className="px-3 py-2 text-right text-[#1e3a2c]">Rp {item.harga_beli?.toLocaleString('id-ID')}</td>
              <td className="px-3 py-2 text-right font-medium text-[#1e3a2c]">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#1e3a2c] bg-[#f5f2eb]">
            <td colSpan={6} className="px-3 py-2 font-bold text-sm text-[#1e3a2c]">TOTAL</td>
            <td className="px-3 py-2 text-right font-bold text-[#1e3a2c]">
              Rp {showPODetail.items?.reduce((a: number, b: any) => a + (b.subtotal || 0), 0).toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-3">
        <button onClick={() => setShowPODetail(null)}
          className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Tutup', 'Close')}</button>
        <button onClick={() => { printPO(showPODetail); }}
          className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">🖨️ {t('Print PO', 'Print PO')}</button>
      </div>
    </div>
  </div>
)}
{/* Modal Penerimaan Barang */}
      {showPenerimaan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1e3a2c]">{t('Penerimaan Barang', 'Goods Receipt')}</h2>
                <p className="text-xs text-[#6b7280]">PO: {showPenerimaan.nomor_po} · {showPenerimaan.suppliers?.nama_supplier}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-[#f5f2eb]">
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">{t('Produk', 'Product')}</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280]">{t('Qty PO', 'PO Qty')}</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280]">{t('Qty Terima', 'Recv Qty')}</th>
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">{t('No. Batch', 'Batch No.')}</th>
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">{t('Expired Date', 'Expiry Date')}</th>
                  <th className="text-right px-3 py-2 text-xs text-[#6b7280]">{t('Harga Beli', 'Buy Price')}</th>
                </tr>
              </thead>
              <tbody>
                {penerimaanItems.map((item, idx) => (
                  <tr key={idx} className="border-t border-[#f0ede6]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#1e3a2c] text-sm">{item.nama_produk}</div>
                      <div className="text-xs text-[#9ca3af]">{item.satuan}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-[#6b7280]">{item.qty_pesan}</td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} max={item.qty_pesan} value={item.qty_terima}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].qty_terima = +e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-16 text-center border border-[#d1cdc4] rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.batch_number} placeholder="BT-001"
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].batch_number = e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-28 border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" value={item.expired_date}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].expired_date = e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-36 border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.harga_beli}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].harga_beli = +e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-28 text-right border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Faktur & Term of Payment */}
            <div className="border border-[#e2ddd3] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={15} className="text-[#1e3a2c]" />
                <p className="text-sm font-semibold text-[#1e3a2c]">{t('Faktur Pembelian', 'Purchase Invoice')}</p>
                <span className="text-xs text-[#9ca3af]">{t('(kosongkan jika belum ada faktur)', '(leave empty if no invoice yet)')}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Nomor Faktur', 'Invoice Number')}</label>
                  <input value={fakturForm.nomor_faktur} onChange={e => setFakturForm({ ...fakturForm, nomor_faktur: e.target.value })}
                    placeholder="INV/2026/001" className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Tanggal Faktur', 'Invoice Date')}</label>
                  <input type="date" value={fakturForm.tanggal_faktur} onChange={e => setFakturForm({ ...fakturForm, tanggal_faktur: e.target.value })}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Term of Payment</label>
                  <select value={fakturForm.term_of_payment} onChange={e => setFakturForm({ ...fakturForm, term_of_payment: +e.target.value })}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                    <option value={0}>{t('Tunai (0 hari)', 'Cash (0 days)')}</option>
                    <option value={7}>7 {t('hari', 'days')}</option>
                    <option value={14}>14 {t('hari', 'days')}</option>
                    <option value={30}>30 {t('hari', 'days')}</option>
                    <option value={45}>45 {t('hari', 'days')}</option>
                    <option value={60}>60 {t('hari', 'days')}</option>
                    <option value={90}>90 {t('hari', 'days')}</option>
                  </select>
                </div>
              </div>
              {fakturForm.nomor_faktur.trim() && (
                <p className="text-xs text-[#6b7280] mt-2">
                  {t('Jatuh tempo', 'Due date')}: <b className="text-[#1e3a2c]">{(() => { const d = new Date(fakturForm.tanggal_faktur); d.setDate(d.getDate() + (Number(fakturForm.term_of_payment) || 0)); return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) })()}</b>
                  {' · '}Total: <b className="text-[#1e3a2c]">Rp {penerimaanItems.reduce((a, b) => a + (b.qty_terima > 0 ? b.qty_terima * b.harga_beli : 0), 0).toLocaleString('id-ID')}</b>
                </p>
              )}
            </div>

            <div className="bg-[#f5f2eb] rounded-lg p-3 mb-4 text-xs text-[#6b7280]">
              <p>💡 <b>{t('Penerimaan Parsial:', 'Partial Receipt:')}</b> {t('Isi qty terima sesuai barang yang datang. Klik "Simpan Parsial" jika ada sisa yang belum datang, atau "Tutup PO" jika selesai.', 'Enter received qty for arrived goods. Click "Save Partial" if some are still pending, or "Close PO" when complete.')}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowPenerimaan(null); setPenerimaanItems([]) }}
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
              <button onClick={async () => {
                await supabase.from('purchase_orders').update({ status: 'dibatalkan' }).eq('id', showPenerimaan.id)
                setShowPenerimaan(null); setPenerimaanItems([]); fetchPOList()
              }} className="px-4 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition">
                {t('Batalkan PO', 'Cancel PO')}
              </button>
              <button onClick={() => submitPenerimaan(false)}
                className="flex-1 border-2 border-[#1e3a2c] text-[#1e3a2c] py-2 rounded-lg text-sm font-medium hover:bg-[#f5f2eb] transition">
                {t('Simpan Parsial', 'Save Partial')}
              </button>
              <button onClick={() => submitPenerimaan(true)}
                className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                {t('Terima & Tutup PO', 'Receive & Close PO')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Layanan Jasa (tambah / edit) */}
      {(showServiceForm || editService) && (() => {
        const isEdit = !!editService
        const val = isEdit ? editService : serviceForm
        const setVal = (patch: any) => isEdit ? setEditService({ ...editService, ...patch }) : setServiceForm({ ...serviceForm, ...patch })
        return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[#1e3a2c] mb-4">{isEdit ? t('Edit Layanan', 'Edit Service') : t('Tambah Layanan', 'Add Service')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Nama Layanan *', 'Service Name *')}</label>
                <input value={val.nama} onChange={e => setVal({ nama: e.target.value })} placeholder={t('mis. Racikan Resep, Cek Gula Darah', 'e.g. Prescription Compounding, Blood Sugar Check')}
                  className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Tarif (Rp)', 'Fee (Rp)')}</label>
                <input type="text" inputMode="numeric" value={val.harga ? val.harga.toLocaleString('id-ID') : ''}
                  onChange={e => setVal({ harga: +e.target.value.replace(/\D/g, '') || 0 })}
                  className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Deskripsi', 'Description')}</label>
                <textarea value={val.deskripsi || ''} onChange={e => setVal({ deskripsi: e.target.value })} rows={2}
                  className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
              </div>
              {isEdit && (
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Status</label>
                  <select value={editService.status} onChange={e => setEditService({ ...editService, status: e.target.value })}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                    <option value="aktif">{t('Aktif', 'Active')}</option>
                    <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowServiceForm(false); setEditService(null) }} className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
              <button onClick={isEdit ? handleUpdateService : handleTambahService} className="flex-1 bg-[#1e3a2c] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">{t('Simpan', 'Save')}</button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Modal Ubah Masa Aktif (super admin) */}
      {showMasaAktif && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-[#1e3a2c] mb-1">{t('Ubah Masa Aktif', 'Change Validity')}</h2>
            <p className="text-xs text-[#6b7280] mb-4">{showMasaAktif.nama}</p>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Valid sampai', 'Valid until')}</label>
            <input type="date" value={masaAktifDate} onChange={e => setMasaAktifDate(e.target.value)}
              className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
            <button onClick={() => simpanMasaAktif(true)} className="mt-2 text-xs text-[#1e3a2c] font-medium hover:underline">
              {t('Set tanpa batas', 'Set unlimited')}
            </button>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowMasaAktif(null)} className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
              <button onClick={() => simpanMasaAktif(false)} className="flex-1 bg-[#1e3a2c] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">{t('Simpan & Aktifkan', 'Save & Activate')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bayar Faktur */}
      {showBayar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#1e3a2c]">{t('Bayar Faktur', 'Pay Invoice')}</h2>
              <p className="text-xs text-[#6b7280]">{showBayar.nomor_faktur} · {showBayar.suppliers?.nama_supplier}</p>
            </div>
            <div className="bg-[#f5f2eb] rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6b7280]">{t('Jumlah Tagihan', 'Amount Due')}</p>
                <p className="text-xl font-bold text-[#1e3a2c]">Rp {(showBayar.total || 0).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6b7280]">{t('Jatuh Tempo', 'Due Date')}</p>
                <p className="text-sm font-medium text-[#1e3a2c]">{showBayar.tanggal_jatuh_tempo ? new Date(showBayar.tanggal_jatuh_tempo).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Tanggal Bayar', 'Payment Date')}</label>
                  <input type="date" value={bayarForm.tanggal_bayar} onChange={e => setBayarForm({ ...bayarForm, tanggal_bayar: e.target.value })}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Metode', 'Method')}</label>
                  <select value={bayarForm.metode_bayar} onChange={e => setBayarForm({ ...bayarForm, metode_bayar: e.target.value })}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                    <option>Transfer</option><option>QRIS</option><option>Tunai</option><option>Debit</option><option>Giro</option><option>Cek</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Catatan', 'Notes')}</label>
                <input value={bayarForm.catatan_bayar} onChange={e => setBayarForm({ ...bayarForm, catatan_bayar: e.target.value })}
                  placeholder={t('No. referensi / bank (opsional)', 'Reference no. / bank (optional)')} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBayar(null)} className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
              <button onClick={submitBayar} className="flex-1 bg-[#1e3a2c] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">{t('Tandai Lunas', 'Mark as Paid')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Struk */}
      {showStruk && lastTrx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div id="struk-print" className="p-6">
              <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                <h2 className="font-bold text-lg text-[#1e3a2c]">{settingsData.nama_apotek}</h2>
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
                    <div className="flex justify-between text-[#1e3a2c] font-medium">
                      <span>{item.nama_obat}</span>
                      <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-gray-400">{item.jumlah} x Rp {item.harga_jual?.toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-[#1e3a2c]">
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
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Tutup', 'Close')}</button>
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
              }} className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">
                🖨️ {t('Cetak', 'Print')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen" style={AMBIENT}>
        {/* Top bar (mobile) */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-[#1e3a2c] text-white">
          <button onClick={() => setMobileNavOpen(true)} aria-label="Menu"><Menu size={22} /></button>
          <span className="font-medium truncate">{isSuper ? (companies.find((c: any) => c.id === superViewCompany)?.nama || 'Super Admin') : (settingsData.nama_apotek || companyName || 'Apotek Saya')}</span>
        </div>

        <div className="md:flex md:min-h-screen">
        {/* Backdrop (mobile) */}
        {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />}
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-64 bg-gradient-to-b from-[#1e3a2c] via-[#213829] to-[#2c3320] flex flex-col transition-transform md:transition-[width] duration-200 shrink-0 fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 md:z-auto ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className={`${sidebarCollapsed ? 'px-3' : 'px-5'} py-5`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <FlaskConical size={20} className="text-white" strokeWidth={1.8} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm leading-tight truncate">Pharmacy Store</div>
                  <div className="text-[#9db3a5] text-xs truncate">by Seawise Studio</div>
                </div>
              )}
              <button onClick={() => setMobileNavOpen(false)} className="md:hidden ml-auto text-[#9db3a5] hover:text-white" aria-label="Tutup menu"><X size={20} /></button>
            </div>
            {/* Toggle minimize */}
            <button onClick={() => { const nv = !sidebarCollapsed; setSidebarCollapsed(nv); try { localStorage.setItem('sw_sidebar_collapsed', nv ? '1' : '0') } catch {} }}
              title={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
              className={`mt-4 w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-left hover:bg-white/10 transition`}>
              {!sidebarCollapsed && <span className="text-[#e8efe9] text-sm font-medium truncate">{isSuper ? (companies.find((c: any) => c.id === superViewCompany)?.nama || 'Super Admin') : (settingsData.nama_apotek || companyName || 'Apotek Saya')}</span>}
              {sidebarCollapsed ? <PanelLeft size={17} className="text-[#9db3a5]" /> : <PanelLeftClose size={16} className="text-[#9db3a5] shrink-0" />}
            </button>
            {/* Super admin: lihat sebagai apotek */}
            {isSuper && !sidebarCollapsed && (
              <div className="mt-2">
                <label className="text-[10px] uppercase tracking-wide text-[#9db3a5] mb-1 block">Lihat sebagai apotek</label>
                <select value={superViewCompany} onChange={e => setSuperViewCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.07] border border-white/10 text-[#e8efe9] text-sm focus:outline-none">
                  <option value="" className="text-black">Semua apotek</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id} className="text-black">{c.nama}</option>)}
                </select>
              </div>
            )}
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
            {menuItems.filter(item => allowedPages.includes(item.id)).map((item) => {
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => { setActivePage(item.id); setMobileNavOpen(false) }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm transition text-left ${
                    activePage === item.id ? 'bg-white/12 text-white font-medium' : 'text-[#9db3a5] hover:bg-white/[0.07] hover:text-white'
                  }`}>
                  <Icon size={17} className="shrink-0" />{!sidebarCollapsed && <span className="truncate">{lang === 'en' ? item.en : item.label}</span>}
                </button>
              )
            })}
            {isSuper && (
              <button onClick={() => { setActivePage('companies'); setMobileNavOpen(false) }}
                title={sidebarCollapsed ? 'Companies' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm transition text-left ${
                  activePage === 'companies' ? 'bg-white/12 text-white font-medium' : 'text-[#9db3a5] hover:bg-white/[0.07] hover:text-white'
                }`}>
                <Building2 size={17} className="shrink-0" />{!sidebarCollapsed && <span className="truncate">Companies</span>}
              </button>
            )}
          </nav>
          <div className={`${sidebarCollapsed ? 'px-3' : 'px-5'} py-4 border-t border-white/10`}>
            {!sidebarCollapsed && (
              <>
                <div className="text-white text-sm font-medium truncate">{authName || settingsData.nama_apotek || 'Pengguna'}</div>
                <div className="mt-0.5 mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[#c9d6cc] text-[10px] font-medium">
                  <ShieldCheck size={11} /> {currentRole ? (ROLE_LABELS[currentRole] || currentRole) : '...'}
                </div>
              </>
            )}
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              title={t('Keluar', 'Sign out')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-1.5'} text-[#9db3a5] text-xs ${sidebarCollapsed ? 'mt-0' : 'mt-2.5'} hover:text-white transition w-full`}>
              <LogOut size={sidebarCollapsed ? 17 : 13} />{!sidebarCollapsed && t('Keluar', 'Sign out')}
            </button>
            {!sidebarCollapsed && <div className="mt-3"><LangToggle dark /></div>}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8">

          {/* COMPANIES (super admin) */}
          {activePage === 'companies' && isSuper && (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">Companies</h1>
              <p className="text-[#6b7280] text-sm mb-6">{companies.length} {t('apotek terdaftar', 'registered pharmacies')}</p>
              <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl overflow-x-auto">
                {companies.length === 0 ? (
                  <p className="text-center text-[#9ca3af] py-12 text-sm">{t('Belum ada apotek yang mendaftar.', 'No pharmacies have registered yet.')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#9ca3af] border-b border-[#f0ede6]">
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">{t('Company', 'Company')}</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Admin</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide">User</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">{t('Valid Sampai', 'Valid Until')}</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-[#f0ede6] last:border-0 hover:bg-[#faf9f6]">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#1c2620]">{c.nama}</p>
                            <p className="text-xs text-[#9ca3af] font-mono">{c.slug || '-'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-[#1c2620]">{c.admin_nama || '-'}</p>
                            <p className="text-xs text-[#9ca3af]">{c.admin_email || '-'}</p>
                          </td>
                          <td className="px-5 py-4 text-center text-[#1c2620]">{c.user_count ?? 1}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {c.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[#6b7280]">
                            {c.valid_sampai ? new Date(c.valid_sampai).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : t('Tanpa batas', 'Unlimited')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => toggleCompanyStatus(c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${c.status === 'aktif' ? 'border-[#e0b3a0] text-[#a75a34] hover:bg-[#f0dcd2]' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                                {c.status === 'aktif' ? t('Nonaktifkan', 'Deactivate') : t('Aktifkan', 'Activate')}
                              </button>
                              <button onClick={() => { setMasaAktifDate(c.valid_sampai || ''); setShowMasaAktif(c) }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e3a2c] text-white hover:bg-[#24462f] transition">
                                {t('Ubah Masa Aktif', 'Change Validity')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Dashboard', 'Dashboard')}</h1>
              <p className="text-[#6b7280] text-sm mb-8">
                {t('Halo', 'Hello')}, <span className="font-semibold text-[#1c2620]">{settingsData.nama_apoteker || t('Apoteker', 'Pharmacist')}</span> 👋, {t('ringkasan aktivitas apotek hari ini', "today's pharmacy activity summary")}
              </p>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
                {[
                  { label: t('Total Produk', 'Total Products'), value: statProduk, desc: t('Item terdaftar', 'Registered items'), Icon: Pill, chip: 'bg-[#dce5db] text-[#2f5741]' },
                  { label: t('Transaksi Hari Ini', 'Sales Today'), value: statTrxHariIni, desc: t('Penjualan hari ini', "Today's sales"), Icon: ShoppingCart, chip: 'bg-[#dce5db] text-[#2f5741]' },
                  { label: t('Expired ≤ 60 Hari', 'Expiring ≤ 60 Days'), value: statExpired, desc: t('Batch mendekati / lewat exp', 'Batches near / past expiry'), Icon: CalendarClock, chip: 'bg-[#f5e6c8] text-[#8a6d1f]' },
                  { label: t('Omzet Hari Ini', 'Revenue Today'), value: `Rp ${statOmzet.toLocaleString('id-ID')}`, desc: t('Total penjualan', 'Total sales'), Icon: Wallet, chip: 'bg-[#f0dcd2] text-[#a75a34]' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-4 sm:p-5 flex flex-col aspect-square xl:aspect-auto">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${s.chip}`}>
                      <s.Icon size={19} strokeWidth={1.9} />
                    </div>
                    <div className="mt-auto pt-3">
                      <p className="text-[10.5px] sm:text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-1 leading-tight">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#1c2620] leading-tight break-words">{s.value}</p>
                      <p className="text-[11px] text-[#9ca3af] mt-1.5 leading-tight">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grafik penjualan + Produk terlaris */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <h3 className="font-bold text-[#1c2620]">{chartRange === '7d' ? t('Penjualan 7 Hari Terakhir', 'Sales, Last 7 Days') : t('Penjualan 30 Hari Terakhir', 'Sales, Last 30 Days')}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-xs text-[#6b7280]"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#2f5741]" />{t('Omzet', 'Revenue')}</span>
                        <span className="flex items-center gap-1.5 text-xs text-[#6b7280]"><span className="inline-block w-4 h-0.5 rounded bg-[#c2632f]" />{t('Transaksi', 'Transactions')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-[#1e3a2c] leading-none">Rp {salesChart.reduce((a, b) => a + (b.value || 0), 0).toLocaleString('id-ID')}</p>
                      <div className="inline-flex rounded-lg bg-[#eef0ea] p-0.5 text-xs font-medium">
                        {(['7d', '30d'] as const).map(r => (
                          <button key={r} onClick={() => setChartRange(r)}
                            className={`px-2.5 py-1 rounded-md transition-all ${chartRange === r ? 'bg-white text-[#1e3a2c] shadow-sm' : 'text-[#6b7280] hover:text-[#1c2620]'}`}>
                            {r === '7d' ? t('7 Hari', '7 Days') : t('30 Hari', '30 Days')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const fallbackN = chartRange === '30d' ? 30 : 7
                    const data = salesChart.length ? salesChart : Array.from({ length: fallbackN }, () => ({ label: '', day: '', value: 0, count: 0 }))
                    const n = data.length
                    const dense = n > 10
                    const maxVal = Math.max(...data.map((d: any) => d.value), 1)
                    const maxCnt = Math.max(...data.map((d: any) => d.count), 1)
                    // Geometri (viewBox 340×150)
                    const W = 340, H = 150, PL = 34, PR = 24, PT = 16, PB = 24
                    const plotW = W - PL - PR, plotH = H - PT - PB, baseY = PT + plotH
                    const slot = plotW / n
                    const cx = (i: number) => PL + slot * i + slot / 2
                    const barW = Math.max(3, slot * (dense ? 0.62 : 0.5))
                    const lineY = (c: number) => baseY - (c / maxCnt) * plotH
                    // Kurva halus (Catmull-Rom → Bézier) agar garis tampak elegan
                    const pts = data.map((d: any, i: number) => ({ x: cx(i), y: lineY(d.count) }))
                    const smooth = (p: { x: number; y: number }[]) => {
                      if (p.length < 2) return p.length ? `M${p[0].x},${p[0].y}` : ''
                      let dPath = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`
                      for (let i = 0; i < p.length - 1; i++) {
                        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
                        const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
                        const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
                        dPath += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
                      }
                      return dPath
                    }
                    const linePath = smooth(pts)
                    const lineLen = 900
                    const fmtRp = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}jt` : v >= 1e3 ? `${Math.round(v / 1e3)}rb` : `${v}`
                    return (
                      <div>
                        <svg key={chartRange} viewBox={`0 0 ${W} ${H}`} className="w-full h-48 sw-chart">
                          <defs>
                            <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3a6b50" />
                              <stop offset="100%" stopColor="#1e3a2c" />
                            </linearGradient>
                          </defs>
                          {/* grid + label sumbu omzet (kiri) */}
                          {[0, 0.5, 1].map((g, i) => {
                            const y = baseY - g * plotH
                            return (
                              <g key={i}>
                                <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#eceae3" strokeWidth="1" />
                                <text x={PL - 5} y={y + 3} textAnchor="end" fontSize="7.5" fill="#b8bcb4">{fmtRp(maxVal * g)}</text>
                              </g>
                            )
                          })}
                          {/* label sumbu transaksi (kanan) */}
                          {[0, 1].map((g, i) => (
                            <text key={'r' + i} x={W - PR + 5} y={baseY - g * plotH + 3} textAnchor="start" fontSize="7.5" fill="#d3a488">{Math.round(maxCnt * g)}</text>
                          ))}
                          {/* batang omzet */}
                          {data.map((d: any, i: number) => {
                            const h = (d.value / maxVal) * plotH
                            return (
                              <rect className="sw-bar" key={'b' + i} x={cx(i) - barW / 2} y={baseY - h} width={barW} height={Math.max(0, h)}
                                rx={Math.min(3, barW / 2)} fill="url(#salesBar)" style={{ transformOrigin: `center ${baseY}px`, animationDelay: `${i * 0.04}s` }} />
                            )
                          })}
                          {/* garis jumlah transaksi */}
                          <path className="sw-chart-line" d={linePath} fill="none" stroke="#c2632f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ strokeDasharray: lineLen, strokeDashoffset: lineLen }} />
                          {!dense && data.map((d: any, i: number) => (
                            <g key={'p' + i}>
                              <circle className="sw-chart-dot" cx={cx(i)} cy={lineY(d.count)} r="3" fill="#fff" stroke="#c2632f" strokeWidth="2" style={{ animationDelay: `${0.6 + i * 0.06}s` }} />
                              {d.count > 0 && <text className="sw-chart-dot" x={cx(i)} y={lineY(d.count) - 7} textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2632f" style={{ animationDelay: `${0.7 + i * 0.06}s` }}>{d.count}</text>}
                            </g>
                          ))}
                          {/* label hari/tanggal */}
                          {data.map((d: any, i: number) => d.label ? <text key={'t' + i} x={cx(i)} y={H - 7} textAnchor="middle" fontSize="8.5" fill="#9ca3af">{d.label}</text> : null)}
                        </svg>
                      </div>
                    )
                  })()}
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <h3 className="font-bold text-[#1c2620] mb-1">{t('Produk Terlaris', 'Best Sellers')}</h3>
                  <p className="text-xs text-[#9ca3af] mb-4">{t('30 hari terakhir', 'Last 30 days')}</p>
                  {bestSellers.length === 0 ? (
                    <p className="text-center text-xs text-[#9ca3af] py-8">{t('Belum ada penjualan', 'No sales yet')}</p>
                  ) : (
                    <div className="space-y-3">
                      {bestSellers.map((b: any, i: number) => {
                        const maxQty = bestSellers[0].qty || 1
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-[#1c2620] truncate pr-2">{i + 1}. {b.nama}</span>
                              <span className="text-[#6b7280] shrink-0">{b.qty}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#eef0ea] overflow-hidden">
                              <div className="h-full rounded-full bg-[#2f5741]" style={{ width: `${Math.max(6, (b.qty / maxQty) * 100)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Stok minim + Segera expired */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><Pill size={16} /></div>
                    <h3 className="font-bold text-[#1c2620]">{t('Stok Minim', 'Low Stock')}</h3>
                  </div>
                  {lowStock.length === 0 ? (
                    <p className="text-center text-xs text-[#9ca3af] py-6">{t('Semua stok aman 👍', 'All stock is healthy 👍')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {lowStock.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[#f0ede6] last:border-0">
                          <span className="text-[#1c2620] truncate pr-2">{p.nama_obat}</span>
                          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">{p.stok_total} / {p.stok_minimum}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#f5e6c8] text-[#8a6d1f] flex items-center justify-center"><CalendarClock size={16} /></div>
                    <h3 className="font-bold text-[#1c2620]">{t('Segera Expired (≤60 hari)', 'Expiring Soon (≤60 days)')}</h3>
                  </div>
                  {expiringSoon.length === 0 ? (
                    <p className="text-center text-xs text-[#9ca3af] py-6">{t('Tidak ada batch mendekati expired', 'No batches nearing expiry')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {expiringSoon.map((b: any, i: number) => {
                        const days = Math.ceil((new Date(b.expired_date).getTime() - Date.now()) / 86400000)
                        return (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[#f0ede6] last:border-0">
                            <div className="min-w-0 pr-2">
                              <p className="text-[#1c2620] truncate">{b.products?.nama_obat}</p>
                              <p className="text-[10px] text-[#9ca3af]">{t('Batch', 'Batch')} {b.batch_number || '-'} · {t('sisa', 'qty')} {b.stok_batch}</p>
                            </div>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${days <= 0 ? 'bg-red-200 text-red-800' : days <= 30 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                              {days <= 0 ? t('Expired', 'Expired') : `${days} ${t('hari', 'days')}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Tagihan faktur akan jatuh tempo (ringkas) */}
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#f2ddd0] text-[#a8532a] flex items-center justify-center"><Receipt size={16} /></div>
                      <h3 className="font-bold text-[#1c2620]">{t('Jatuh Tempo', 'Invoices Due')}</h3>
                    </div>
                    {dueInvoices.length > 0 && (
                      <button onClick={() => setActivePage('faktur')} className="text-xs font-medium text-[#1e3a2c] hover:underline">{t('Semua', 'All')}</button>
                    )}
                  </div>
                  {dueInvoices.length === 0 ? (
                    <p className="text-center text-xs text-[#9ca3af] py-6">{t('Tidak ada tagihan 👍', 'No invoices due 👍')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dueInvoices.map((f: any, i: number) => {
                        const days = Math.ceil((new Date(f.tanggal_jatuh_tempo).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
                        const badge = days < 0 ? 'bg-red-200 text-red-800' : days <= 7 ? 'bg-red-50 text-red-600' : days <= 14 ? 'bg-yellow-50 text-yellow-700' : 'bg-[#eef0ea] text-[#2f5741]'
                        return (
                          <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[#f0ede6] last:border-0">
                            <div className="min-w-0 pr-2">
                              <p className="text-[#1c2620] truncate">{f.suppliers?.nama_supplier || '-'}</p>
                              <p className="text-[10px] text-[#9ca3af] tabular-nums">Rp {(f.total || 0).toLocaleString('id-ID')}</p>
                            </div>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge}`}>
                              {days < 0 ? `${t('Telat', 'Late')} ${Math.abs(days)}${t('h', 'd')}` : days === 0 ? t('Hari ini', 'Today') : `${days} ${t('hari', 'days')}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TINDAK LANJUT, Riwayat Barang Expired */}
          {activePage === 'tindaklanjut' && (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Tindak Lanjut Barang Expired', 'Expired Goods Follow-up')}</h1>
              <p className="text-[#6b7280] text-sm mb-6">{t('Riwayat pemusnahan & retur atas batch yang expired / mendekati expired', 'History of destruction & returns for expired / near-expiry batches')}</p>

              {/* Tabs */}
              <div className="flex gap-1 mb-5">
                {([
                  { id: 'musnahkan', label: `${t('Pemusnahan', 'Destruction')} (${riwayatMusnah.length})` },
                  { id: 'retur', label: `${t('Retur Supplier', 'Supplier Returns')} (${riwayatRetur.length})` },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setTindakLanjutTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      tindakLanjutTab === tab.id ? 'bg-[#1e3a2c] text-white' : 'text-[#6b7280] hover:bg-white/60'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl overflow-x-auto">
                {/* PEMUSNAHAN */}
                {tindakLanjutTab === 'musnahkan' && (
                  riwayatMusnah.length === 0 ? (
                    <p className="text-center text-[#9ca3af] py-12 text-sm">{t('Belum ada riwayat pemusnahan', 'No destruction history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1e3a2c] text-[#e8efe9]">
                          <th className="text-left px-4 py-3 text-xs font-medium">No. BA</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Tanggal</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Produk</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Batch / Exp</th>
                          <th className="text-center px-4 py-3 text-xs font-medium">Qty</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Metode</th>
                          <th className="text-center px-4 py-3 text-xs font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayatMusnah.map((r: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-4 py-3 font-mono text-xs text-[#1c2620]">{r.nomor_ba || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">{r.tanggal_musnahkan ? new Date(r.tanggal_musnahkan).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
                            <td className="px-4 py-3 text-[#1c2620] font-medium">{r.products?.nama_obat || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">
                              {r.product_batches?.batch_number || '-'}
                              {r.product_batches?.expired_date && <span className="text-[#9ca3af]"> · exp {new Date(r.product_batches.expired_date).toLocaleDateString('id-ID', {month:'short',year:'numeric'})}</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-[#1c2620] font-medium">{r.qty_musnahkan} {r.products?.satuan || ''}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">{r.metode || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => reprintBA(r)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d1cdc4] text-[#1e3a2c] text-xs font-medium hover:bg-[#f5f2eb] transition">
                                <Printer size={13} /> Cetak BA
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {/* RETUR */}
                {tindakLanjutTab === 'retur' && (
                  riwayatRetur.length === 0 ? (
                    <p className="text-center text-[#9ca3af] py-12 text-sm">{t('Belum ada riwayat retur', 'No return history yet')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#1e3a2c] text-[#e8efe9]">
                          <th className="text-left px-4 py-3 text-xs font-medium">No. Retur</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Tanggal</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Produk</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Supplier</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Batch / Exp</th>
                          <th className="text-center px-4 py-3 text-xs font-medium">Qty</th>
                          <th className="text-left px-4 py-3 text-xs font-medium">Alasan</th>
                          <th className="text-center px-4 py-3 text-xs font-medium">Status</th>
                          <th className="text-center px-4 py-3 text-xs font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayatRetur.map((r: any, i: number) => (
                          <tr key={i} className={TR}>
                            <td className="px-4 py-3 font-mono text-xs text-[#1c2620]">{r.nomor_retur || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">{r.tanggal_retur ? new Date(r.tanggal_retur).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
                            <td className="px-4 py-3 text-[#1c2620] font-medium">{r.products?.nama_obat || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">{r.suppliers?.nama_supplier || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">
                              {r.product_batches?.batch_number || '-'}
                              {r.product_batches?.expired_date && <span className="text-[#9ca3af]"> · exp {new Date(r.product_batches.expired_date).toLocaleDateString('id-ID', {month:'short',year:'numeric'})}</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-[#1c2620] font-medium">{r.qty_retur} {r.products?.satuan || ''}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280] max-w-[220px] truncate">{r.alasan || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                r.status === 'selesai' ? 'bg-green-100 text-green-700'
                                : r.status === 'dibatalkan' ? 'bg-gray-100 text-gray-500'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>{r.status || 'diajukan'}</span>
                            </td>
                            <td className="px-4 py-3">
                              {(!r.status || r.status === 'diajukan') ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => konfirmasiRetur(r)}
                                    className="px-2.5 py-1 rounded-lg bg-[#1e3a2c] text-white text-xs font-medium hover:bg-[#24462f] transition whitespace-nowrap">
                                    Konfirmasi
                                  </button>
                                  <button onClick={() => batalRetur(r)}
                                    className="px-2.5 py-1 rounded-lg border border-[#d1cdc4] text-[#6b7280] text-xs font-medium hover:bg-[#f5f2eb] transition">
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center text-xs text-[#9ca3af]">-</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </div>
          )}

          {/* PEMBAYARAN FAKTUR */}
          {activePage === 'faktur' && (() => {
            const today = new Date(); today.setHours(0,0,0,0)
            const belumLunas = fakturList.filter(f => f.status !== 'lunas')
            const totalHutang = belumLunas.reduce((a, f) => a + (f.total || 0), 0)
            const terlambat = belumLunas.filter(f => f.tanggal_jatuh_tempo && new Date(f.tanggal_jatuh_tempo) < today).length
            return (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Pembayaran Faktur', 'Invoice Payments')}</h1>
              <p className="text-[#6b7280] text-sm mb-6">{t('Faktur pembelian diurutkan berdasarkan jatuh tempo terdekat', 'Purchase invoices sorted by nearest due date')}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#f0dcd2] text-[#a75a34]"><Wallet size={20} strokeWidth={1.9} /></div>
                  <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-1.5">{t('Total Hutang Belum Lunas', 'Total Unpaid Debt')}</p>
                  <p className="text-2xl font-bold text-[#1c2620] leading-none">Rp {totalHutang.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#f5e6c8] text-[#8a6d1f]"><Receipt size={20} strokeWidth={1.9} /></div>
                  <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-1.5">{t('Faktur Belum Lunas', 'Unpaid Invoices')}</p>
                  <p className="text-2xl font-bold text-[#1c2620] leading-none">{belumLunas.length}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-red-100 text-red-600"><CalendarClock size={20} strokeWidth={1.9} /></div>
                  <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide mb-1.5">{t('Lewat Jatuh Tempo', 'Overdue')}</p>
                  <p className="text-2xl font-bold text-[#1c2620] leading-none">{terlambat}</p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl overflow-x-auto">
                {fakturList.length === 0 ? (
                  <p className="text-center text-[#9ca3af] py-12 text-sm">{t('Belum ada faktur. Faktur otomatis tercatat saat penerimaan barang.', 'No invoices yet. Invoices are recorded automatically during goods receipt.')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1e3a2c] text-[#e8efe9]">
                        <th className="text-left px-4 py-3 text-xs font-medium">{t('No. Faktur', 'Invoice No.')}</th>
                        <th className="text-left px-4 py-3 text-xs font-medium">Supplier</th>
                        <th className="text-left px-4 py-3 text-xs font-medium">PO</th>
                        <th className="text-left px-4 py-3 text-xs font-medium">{t('Tgl Faktur', 'Invoice Date')}</th>
                        <th className="text-center px-4 py-3 text-xs font-medium">TOP</th>
                        <th className="text-left px-4 py-3 text-xs font-medium">{t('Jatuh Tempo', 'Due Date')}</th>
                        <th className="text-right px-4 py-3 text-xs font-medium">Total</th>
                        <th className="text-center px-4 py-3 text-xs font-medium">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-medium">{t('Aksi', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fakturList.map((f: any, i: number) => {
                        const jt = f.tanggal_jatuh_tempo ? new Date(f.tanggal_jatuh_tempo) : null
                        const overdue = jt && jt < today && f.status !== 'lunas'
                        const dueSoon = jt && !overdue && f.status !== 'lunas' && (jt.getTime() - today.getTime()) / 86400000 <= 7
                        return (
                          <tr key={i} className={`${TR} ${overdue ? 'bg-red-50/60' : ''}`}>
                            <td className="px-4 py-3 font-mono text-xs text-[#1c2620]">{f.nomor_faktur || '-'}</td>
                            <td className="px-4 py-3 text-[#1c2620]">{f.suppliers?.nama_supplier || '-'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{f.purchase_orders?.nomor_po || '-'}</td>
                            <td className="px-4 py-3 text-xs text-[#6b7280]">{f.tanggal_faktur ? new Date(f.tanggal_faktur).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
                            <td className="px-4 py-3 text-center text-xs text-[#6b7280]">{f.term_of_payment === 0 ? t('Tunai', 'Cash') : `${f.term_of_payment} ${t('hr', 'd')}`}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-medium' : 'text-[#6b7280]'}>
                                {jt ? jt.toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
                              </span>
                              {overdue && <span className="block text-[10px] text-red-500">{t('terlambat', 'overdue')}</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-[#1c2620] tabular-nums">Rp {(f.total || 0).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {f.status === 'lunas' ? t('Lunas', 'Paid') : t('Belum Lunas', 'Unpaid')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {f.status === 'lunas' ? (
                                <button onClick={() => cetakBuktiBayar(f)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d1cdc4] text-[#1e3a2c] text-xs font-medium hover:bg-[#f5f2eb] transition">
                                  <Printer size={13} /> {t('Cetak Bukti', 'Print Receipt')}
                                </button>
                              ) : (
                                <button onClick={() => { setBayarForm({ tanggal_bayar: new Date().toISOString().split('T')[0], metode_bayar: 'Transfer', catatan_bayar: '' }); setShowBayar(f) }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a2c] text-white text-xs font-medium hover:bg-[#24462f] transition">
                                  <CreditCard size={13} /> {t('Bayar', 'Pay')}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            )
          })()}

          {/* PRODUK */}
          {activePage === 'produk' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1e3a2c] mb-1">{t('Produk & Stok', 'Products & Stock')}</h1>
                  <p className="text-[#6b7280] text-sm">{t('Daftar semua produk obat di apotek', 'All medicine products in the pharmacy')}</p>
                </div>
                <button onClick={() => setShowForm(true)}
                  className="bg-[#1e3a2c] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                  + {t('Tambah Produk', 'Add Product')}
                </button>
              </div>

              {/* Alert Expired */}
              {expiredAlerts.length > 0 && (
                <div className="mb-6 space-y-3">
                  {(() => {
                    const today0 = new Date(); today0.setHours(0, 0, 0, 0)
                    const in30 = new Date(today0); in30.setDate(today0.getDate() + 30)
                    const merah = expiredAlerts.filter(b => new Date(b.expired_date) <= in30)
                    const kuning = expiredAlerts.filter(b => new Date(b.expired_date) > in30)
                    const groups = [
                      { items: merah, tone: 'red', Icon: AlertTriangle,
                        wrap: 'bg-red-50 border-red-200', title: t('Segera Kadaluarsa', 'Expiring Soon'), sub: `≤30 ${t('hari', 'days')}`,
                        titleCls: 'text-red-700', badgeCls: 'bg-red-100 text-red-700', card: 'border-red-100',
                        dayCls: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
                      { items: kuning, tone: 'amber', Icon: CalendarClock,
                        wrap: 'bg-amber-50 border-amber-200', title: t('Perlu Perhatian', 'Needs Attention'), sub: `31–60 ${t('hari', 'days')}`,
                        titleCls: 'text-amber-800', badgeCls: 'bg-amber-100 text-amber-800', card: 'border-amber-100',
                        dayCls: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
                    ]
                    return groups.filter(g => g.items.length > 0).map((g, gi) => (
                      <div key={gi} className={`border rounded-2xl p-3 sm:p-4 ${g.wrap}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <g.Icon size={17} className={g.titleCls} />
                          <span className={`font-semibold text-sm ${g.titleCls}`}>{g.title}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${g.badgeCls}`}>{g.items.length} {t('batch', 'batches')} · {g.sub}</span>
                        </div>
                        <div className="space-y-2">
                          {g.items.map((b: any, i: number) => {
                            const days = Math.ceil((new Date(b.expired_date).getTime() - today0.getTime()) / 86400000)
                            const exp = new Date(b.expired_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            return (
                              <div key={i} className={`flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5 ${g.card}`}>
                                <div className="shrink-0 w-12 text-center">
                                  <div className={`text-base font-bold leading-none ${g.dayCls}`}>{days < 0 ? '!' : days}</div>
                                  <div className="text-[9px] text-[#9ca3af] mt-0.5 leading-none">{days < 0 ? t('lewat', 'past') : t('hari lagi', 'days left')}</div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-[#1c2620] text-sm leading-tight truncate">{b.products?.nama_obat || '-'}</p>
                                  <p className="text-[11px] text-[#6b7280] leading-tight mt-0.5">
                                    <span className="font-mono">{b.batch_number || '-'}</span> · {t('Exp', 'Exp')} {exp} · {t('Stok', 'Stock')} {b.stok_batch}
                                  </p>
                                </div>
                                <button onClick={() => { setShowProdukDetail(b.products); openTindakLanjut(b) }}
                                  className={`shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition ${g.btn}`}>
                                  {t('Tindak Lanjut', 'Follow up')}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

              {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                    <h2 className="text-lg font-bold text-[#1e3a2c] mb-4">{t('Tambah Produk Baru', 'Add New Product')}</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Nama Obat *', 'Drug Name *')}</label>
                          <input value={form.nama_obat} onChange={e => setForm({...form, nama_obat: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Nama Generik', 'Generic Name')}</label>
                          <input value={form.nama_generik} onChange={e => setForm({...form, nama_generik: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Kandungan / Komposisi', 'Ingredient / Composition')}</label>
                        <input value={form.kandungan} onChange={e => setForm({...form, kandungan: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Kategori', 'Category')}</label>
                          <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
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
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Satuan', 'Unit')}</label>
                          <select value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                            <option>Tablet</option><option>Kapsul</option><option>Botol</option>
                            <option>Sachet</option><option>Tube</option><option>Ampul</option><option>Vial</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Harga Beli', 'Buy Price')}</label>
                          <input type="number" value={form.harga_beli} onChange={e => setForm({...form, harga_beli: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Harga Jual', 'Sell Price')}</label>
                          <input type="number" value={form.harga_jual} onChange={e => setForm({...form, harga_jual: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Stok Awal', 'Opening Stock')}</label>
                          <input type="number" value={form.stok_total} onChange={e => setForm({...form, stok_total: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowForm(false)}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
                      <button onClick={handleTambahProduk}
                        className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">{t('Simpan Produk', 'Save Product')}</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input type="text" placeholder={t('Cari nama obat, generik, atau kandungan...', 'Search drug name, generic, or ingredient...')}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-[#d1cdc4] bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#1e3a2c] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                </div>
                <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
                  className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2.5 text-sm text-[#1e3a2c] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                  <option value="">{t('Semua Kategori', 'All Categories')}</option>
                  {Object.keys(kategoriLabel).map(k => <option key={k} value={k}>{kategoriLabel[k]}</option>)}
                </select>
                <select value={filterStok} onChange={e => setFilterStok(e.target.value)}
                  className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2.5 text-sm text-[#1e3a2c] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                  <option value="">{t('Semua Stok', 'All Stock')}</option>
                  <option value="aman">{t('Stok Aman', 'Healthy')}</option>
                  <option value="minim">{t('Stok Minim', 'Low')}</option>
                  <option value="habis">{t('Stok Habis', 'Out of stock')}</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2.5 text-sm text-[#1e3a2c] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                  <option value="">{t('Semua Status', 'All Status')}</option>
                  <option value="aktif">{t('Aktif', 'Active')}</option>
                  <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
                </select>
                {(filterKategori || filterStok || filterStatus || search) && (
                  <button onClick={() => { setSearch(''); setFilterKategori(''); setFilterStok(''); setFilterStatus('') }}
                    className="px-3 py-2.5 rounded-lg text-sm text-[#6b7280] border border-[#d1cdc4] hover:bg-gray-50 whitespace-nowrap">{t('Reset', 'Reset')}</button>
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
                      <tr><td className="px-4 py-10 text-center text-[#9ca3af]" colSpan={8}>{t('Memuat data...', 'Loading data...')}</td></tr>
                    ) : produkFiltered.length === 0 ? (
                      <tr><td className="px-4 py-10 text-center text-[#9ca3af]" colSpan={8}>{t('Tidak ada produk ditemukan', 'No products found')}</td></tr>
                    ) : (
                      produkFiltered.map((p) => {
                        const habis = (p.stok_total ?? 0) <= 0
                        const minim = !habis && (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)
                        const stokCls = habis ? 'bg-red-50 text-red-600 ring-1 ring-red-500/20' : minim ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
                        return (
                        <tr key={p.id} className={TR}>
                          <td className={TD}><span className="font-mono text-xs text-[#8a9691]">{p.kode}</span></td>
                          <td className={TD}>
                            <div className="font-medium text-[#1c2620] leading-tight">{p.nama_obat}</div>
                            {p.nama_generik && <div className="text-xs text-[#9ca3af] leading-tight mt-0.5">{p.nama_generik}</div>}
                          </td>
                          <td className={TD}>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${KATEGORI_BADGE[p.kategori] || KATEGORI_BADGE.lainnya}`}>
                              {kategoriLabel[p.kategori] || p.kategori}
                            </span>
                          </td>
                          <td className={TD + ' text-[#6b7280]'}>{p.satuan}</td>
                          <td className={TD + ' text-right font-medium text-[#1c2620] tabular-nums whitespace-nowrap'}>Rp {p.harga_jual?.toLocaleString('id-ID')}</td>
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
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#1e3a2c] hover:bg-[#eef0ea] transition">{t('Detail', 'Details')}</button>
                              <button onClick={() => {
                                setEditProduk(p)
                                fetchProdukSuppliers(p.id)
                                if (suppliers.length === 0) fetchSuppliers()
                              }} className="px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-[#1e3a2c] hover:bg-[#24462f] transition">Edit</button>
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
                  <h1 className="text-2xl font-bold text-[#1e3a2c] mb-1">{t('Kasir', 'Cashier')}</h1>
                  <p className="text-[#6b7280] text-sm">{t('Transaksi penjualan obat', 'Medicine sales transactions')}</p>
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
                  <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-4">
                    <input type="text" placeholder={t('Cari obat by nama, generik, atau kandungan...', 'Search by name, generic, or ingredient...')}
                      value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value.length > 1) fetchProducts() }}
                      className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
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
                          }} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f5f2eb] cursor-pointer">
                            <div>
                              <div className="text-sm font-medium text-[#1e3a2c]">{p.nama_obat}</div>
                              <div className="text-xs text-[#9ca3af]">{p.nama_generik} · {t('Stok', 'Stock')}: {p.stok_total}</div>
                            </div>
                            <div className="text-sm font-medium text-[#1e3a2c]">Rp {p.harga_jual?.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                        {services.filter((s: any) => s.status === 'aktif' && s.nama?.toLowerCase().includes(search.toLowerCase())).map((s: any) => (
                          <div key={'svc-' + s.id} onClick={() => {
                            const kid = 'svc-' + s.id
                            const exists = keranjang.find(k => k.id === kid)
                            if (exists) { setKeranjang(keranjang.map(k => k.id === kid ? {...k, jumlah: k.jumlah + 1} : k)) }
                            else { setKeranjang([...keranjang, { id: kid, nama_obat: s.nama, harga_jual: s.harga || 0, jumlah: 1, is_jasa: true, kategori: 'jasa', stok_total: 0 }]) }
                            setSearch('')
                          }} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#eef0ea] cursor-pointer">
                            <div>
                              <div className="text-sm font-medium text-[#1e3a2c]">{s.nama}</div>
                              <div className="text-xs text-[#2f5741] inline-flex items-center gap-1"><HeartPulse size={11} /> {t('Layanan Jasa', 'Service')}</div>
                            </div>
                            <div className="text-sm font-medium text-[#1e3a2c]">Rp {(s.harga || 0).toLocaleString('id-ID')}</div>
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
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">{t('Belum ada produk, cari obat di atas', 'No products yet, search above')}</td></tr>
                        ) : (
                          keranjang.map(item => (
                            <tr key={item.id} className={TR}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-[#1e3a2c]">{item.nama_obat}</div>
                                <div className="text-xs text-[#9ca3af]">{item.is_jasa ? item.kode : `${item.kode || ''}${item.kode ? ' · ' : ''}${t('Stok', 'Stock')}: ${item.stok_total}`}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: Math.max(1, k.jumlah - 1)} : k))}
                                    className="w-6 h-6 rounded bg-[#f5f2eb] text-[#1e3a2c] font-bold text-xs">−</button>
                                  <input type="number" min={1} max={item.is_jasa ? undefined : item.stok_total} value={item.jumlah}
                                    onChange={e => { const v = Math.max(1, +e.target.value); const capped = (!item.is_jasa && v > (item.stok_total ?? 0)) ? (item.stok_total ?? 0) : v; setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: capped} : k)) }}
                                    className="w-12 text-center text-sm border border-[#d1cdc4] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                                  <button onClick={() => {
                                    if (!item.is_jasa && item.jumlah + 1 > (item.stok_total ?? 0)) { alert(t(`Stok ${item.nama_obat} hanya ${item.stok_total}.`, `Only ${item.stok_total} of ${item.nama_obat} in stock.`)); return }
                                    setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: k.jumlah + 1} : k))
                                  }}
                                    className="w-6 h-6 rounded bg-[#f5f2eb] text-[#1e3a2c] font-bold text-xs">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-[#1e3a2c]">Rp {item.harga_jual?.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right font-medium text-[#1e3a2c]">Rp {(item.harga_jual * item.jumlah)?.toLocaleString('id-ID')}</td>
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
                  <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-[#1e3a2c] mb-4">{t('Ringkasan Transaksi', 'Transaction Summary')}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7280]">{t('Total Item', 'Total Items')}</span>
                        <span className="text-[#1e3a2c]">{keranjang.reduce((a, b) => a + b.jumlah, 0)} {t('item', 'items')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-[#f0ede6] pt-2">
                        <span className="text-[#1e3a2c]">Total</span>
                        <span className="text-[#1e3a2c]">Rp {keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    {(() => {
                      const hasGolongan = keranjang.some(k => ['narkotika','psikotropika','prekursor'].includes(k.kategori))
                      return (<>
                      {!hasGolongan && (
                        <label className="mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#d1cdc4] bg-white cursor-pointer hover:bg-[#f5f2eb] transition">
                          <input type="checkbox" checked={isResep} onChange={e => setIsResep(e.target.checked)}
                            className="w-4 h-4 accent-[#1e3a2c]" />
                          <div>
                            <span className="text-sm font-medium text-[#1e3a2c]">{t('Transaksi berupa resep', 'This is a prescription sale')}</span>
                            <p className="text-xs text-[#9ca3af]">{t('Centang untuk mengisi data pasien & no. resep', 'Tick to record patient data & prescription no.')}</p>
                          </div>
                        </label>
                      )}
                      {(hasGolongan || isResep) && (
                      <div className={`mb-4 p-3 rounded-xl border space-y-2 ${hasGolongan ? 'border-amber-300 bg-amber-50' : 'border-[#cfe0d4] bg-[#f2f7f3]'}`}>
                        <p className={`text-xs font-semibold ${hasGolongan ? 'text-amber-800' : 'text-[#2f5741]'}`}>{hasGolongan ? '⚠️ ' + t('Ada obat Narkotika/Psikotropika/Prekursor, wajib isi data pasien & resep', 'Contains Narcotics/Psychotropics/Precursors, patient & prescription data required') : '📋 ' + t('Data Pasien & Resep', 'Patient & Prescription Data')}</p>
                        <input value={pasienForm.nomor_resep} onChange={e => setPasienForm({...pasienForm, nomor_resep: e.target.value})}
                          placeholder={t('No. Resep *', 'Prescription No. *')} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        <input value={pasienForm.nama_pasien} onChange={e => setPasienForm({...pasienForm, nama_pasien: e.target.value})}
                          placeholder={t('Nama Pasien *', 'Patient Name *')} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={pasienForm.kontak_pasien} onChange={e => setPasienForm({...pasienForm, kontak_pasien: e.target.value})}
                            placeholder={t('Kontak (HP)', 'Contact (Phone)')} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                          <input value={pasienForm.alamat_pasien} onChange={e => setPasienForm({...pasienForm, alamat_pasien: e.target.value})}
                            placeholder={t('Alamat', 'Address')} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                        </div>
                      </div>
                      )}
                      </>)
                    })()}
                    <div className="mb-3">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Metode Pembayaran', 'Payment Method')}</label>
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {['Tunai','QRIS','Transfer','Debit','Kartu Kredit'].map(m => (
                          <button key={m} onClick={() => setMetodeBayar(m)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${metodeBayar === m ? 'bg-[#1e3a2c] text-white border-[#1e3a2c]' : 'border-[#d1cdc4] text-[#6b7280] hover:bg-[#f5f2eb]'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Bayar (Rp)', 'Pay (Rp)')}</label>
                      <input type="text" inputMode="numeric" value={bayar ? bayar.toLocaleString('id-ID') : ''}
                        onChange={e => setBayar(+e.target.value.replace(/\D/g, '') || 0)}
                        onDoubleClick={() => setBayar(keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0))}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" placeholder="0" />
                      <p className="text-[11px] text-[#9ca3af] mt-1">{t('Klik 2× untuk isi otomatis sesuai total.', 'Double-click to auto-fill the total.')}</p>
                    </div>
                    {bayar > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-green-600 mb-4">
                        <span>{t('Kembalian', 'Change')}</span>
                        <span>Rp {Math.max(0, bayar - keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <button disabled={prosesLoading || (isSuper && !superViewCompany)} onClick={async () => {
                      if (prosesLoading) return
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
                      const kembalian = bayar - total
                      setProsesLoading(true)
                      try {
                        const trxPayload: any = { total, bayar, kembalian, metode_bayar: metodeBayar }
                        if (isSuper && superViewCompany) trxPayload.company_id = superViewCompany
                        if (perluResep) {
                          trxPayload.nama_pasien = pasienForm.nama_pasien.trim()
                          trxPayload.alamat_pasien = pasienForm.alamat_pasien.trim()
                          trxPayload.kontak_pasien = pasienForm.kontak_pasien.trim()
                          trxPayload.nomor_resep = pasienForm.nomor_resep.trim()
                        }
                        const { data: trx, error: trxError } = await supabase.from('transactions').insert([trxPayload]).select().single()
                        if (trxError) { alert('Error: ' + trxError.message); setProsesLoading(false); return }
                        const items = keranjang.map(k => ({ transaction_id: trx.id, product_id: k.is_jasa ? null : k.id, nama_obat: k.nama_obat, harga_jual: k.harga_jual, jumlah: k.jumlah, subtotal: k.harga_jual * k.jumlah, ...(isSuper && superViewCompany ? { company_id: superViewCompany } : {}) }))
                        const { error: itemError } = await supabase.from('transaction_items').insert(items)
                        if (itemError) { alert('Error items: ' + itemError.message); setProsesLoading(false); return }
                        for (const k of keranjang) {
                          if (!k.is_jasa) await supabase.from('products').update({ stok_total: Math.max(0, (k.stok_total ?? 0) - k.jumlah) }).eq('id', k.id)
                        }
                        setLastTrx({ ...trx, total, bayar, kembalian })
                        setLastItems(keranjang.map(k => ({ ...k, subtotal: k.harga_jual * k.jumlah })))
                        setShowStruk(true)
                        setKeranjang([])
                        setBayar(0)
                        setMetodeBayar('Tunai')
                        setPasienForm({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' }); setIsResep(false)
                      } catch(e) { alert(t('Terjadi kesalahan, coba lagi', 'An error occurred, please try again')) }
                      finally { setProsesLoading(false) }
                    }} className="w-full bg-[#1e3a2c] text-[#e8e4d9] py-3 rounded-lg text-sm font-medium hover:bg-[#24462f] transition disabled:opacity-50">
                      {(isSuper && !superViewCompany) ? t('🔒 Pilih apotek dulu', '🔒 Select a pharmacy first') : prosesLoading ? t('Memproses...', 'Processing...') : t('Proses Transaksi', 'Process Transaction')}
                    </button>
                    <button onClick={() => { setKeranjang([]); setBayar(0); setMetodeBayar('Tunai'); setPasienForm({ nama_pasien: '', alamat_pasien: '', kontak_pasien: '', nomor_resep: '' }); setIsResep(false) }}
                      className="w-full mt-2 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                      {t('Batal / Reset', 'Cancel / Reset')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAYANAN JASA */}
          {activePage === 'layanan' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Layanan Jasa', 'Services')}</h1>
                  <p className="text-[#6b7280] text-sm">{t('Jasa apotek seperti racikan resep, cek gula darah, tensi, dll, bisa dijual di Kasir.', 'Pharmacy services like prescription compounding, blood-sugar checks, etc., sellable at the cashier.')}</p>
                </div>
                <button onClick={() => { setServiceForm({ nama: '', harga: 0, deskripsi: '' }); setShowServiceForm(true) }}
                  className="bg-[#1e3a2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                  + {t('Tambah Layanan', 'Add Service')}
                </button>
              </div>
              <div className={TBL_WRAP}>
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('Nama Layanan', 'Service Name')}</th>
                      <th className={TH_R}>{t('Tarif', 'Fee')}</th>
                      <th className={TH_L}>{t('Deskripsi', 'Description')}</th>
                      <th className={TH_C}>Status</th>
                      <th className={TH_C}>{t('Aksi', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">{t('Belum ada layanan, tambah layanan pertama', 'No services yet, add your first service')}</td></tr>
                    ) : services.map((s: any) => (
                      <tr key={s.id} className={TR}>
                        <td className="px-4 py-3 font-medium text-[#1c2620]">{s.nama}</td>
                        <td className="px-4 py-3 text-right text-[#1c2620]">Rp {(s.harga || 0).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-[#6b7280] text-xs max-w-[280px] truncate">{s.deskripsi || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setEditService({ ...s })} title="Edit" className="p-1.5 rounded-lg text-[#1e3a2c] hover:bg-[#f5f2eb] transition"><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteService(s)} title={t('Hapus','Delete')} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PEMBELIAN */}
          {activePage === 'pembelian' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1e3a2c] mb-1">{t('Pembelian', 'Purchasing')}</h1>
                  <p className="text-[#6b7280] text-sm">{t('Purchase Order ke supplier', 'Purchase Orders to suppliers')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPOForm(true)} disabled={isSuper && !superViewCompany}
                    className="inline-flex items-center gap-1.5 border border-[#1e3a2c] text-[#1e3a2c] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f5f2eb] transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <Pencil size={15} /> {t('Order Manual', 'Manual Order')}
                  </button>
                  <button onClick={startGuidedOrder} disabled={guidedLoading || (isSuper && !superViewCompany)}
                    className="inline-flex items-center gap-1.5 bg-[#1e3a2c] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Wand2 size={15} /> {(isSuper && !superViewCompany) ? t('🔒 Pilih apotek dulu', '🔒 Select a pharmacy first') : guidedLoading ? t('Memuat...', 'Loading...') : t('Order Terpandu', 'Guided Order')}
                  </button>
                </div>
              </div>
              {isSuper && !superViewCompany && (
                <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{t('Pembuatan PO dikunci', 'PO creation locked')}</p>
                    <p className="text-amber-700">{t('Dropdown "Lihat sebagai apotek" masih menampilkan semua apotek. Pilih satu apotek di sidebar agar PO tidak tercampur / mempengaruhi apotek lain.', 'The "View as pharmacy" dropdown still shows all pharmacies. Pick a specific pharmacy in the sidebar so POs are not mixed across pharmacies.')}</p>
                  </div>
                </div>
              )}

              {showPOForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-lg font-bold text-[#1e3a2c] mb-4">{t('Order Manual, Buat Purchase Order', 'Manual Order, Create Purchase Order')}</h2>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Pilih Supplier *</label>
                      <select onChange={async (e) => {
                        const s = suppliers.find((x: any) => x.id === e.target.value)
                        setSelectedSupplier(s || null); setPoItems([])
                        if (s) fetchSupplierProducts(s.id)
                      }} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                        <option value="">-- Pilih Supplier --</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nama_supplier} ({s.jenis})</option>)}
                      </select>
                    </div>
                    {selectedSupplier && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-[#6b7280] mb-2 block">Produk dari {selectedSupplier.nama_supplier}</label>
                        {supplierProducts.length === 0 ? (
                          <p className="text-xs text-[#9ca3af] p-3 bg-gray-50 rounded-lg">Belum ada produk yang di-assign ke supplier ini.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {supplierProducts.map((p: any) => (
                              <div key={p.id} onClick={() => addPoItem(p)}
                                className={`px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                                  poItems.some(i => i.product_id === p.id) ? 'border-[#1e3a2c] bg-[#f5f2eb]' : 'border-[#d1cdc4] hover:bg-gray-50'
                                }`}>
                                <div className="font-medium text-[#1e3a2c]">{p.nama_obat}</div>
                                <div className="text-xs text-[#9ca3af]">{p.satuan} · Stok: {p.stok_total}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {poItems.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-[#6b7280] mb-2 block">Detail Order</label>
                        <table className="w-full text-sm border border-[#f0ede6] rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-[#f5f2eb]">
                              <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Produk</th>
                              <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Satuan</th>
                              <th className="text-center px-3 py-2 text-xs text-[#6b7280]">Qty</th>
                              <th className="text-right px-3 py-2 text-xs text-[#6b7280]">Harga Beli</th>
                              <th className="text-right px-3 py-2 text-xs text-[#6b7280]">Subtotal</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {poItems.map((item, idx) => (
                              <tr key={idx} className="border-t border-[#f0ede6]">
                                <td className="px-3 py-2 text-[#1e3a2c] font-medium">{item.nama_produk}</td>
                                <td className="px-3 py-2 text-[#6b7280]">{item.satuan}</td>
                                <td className="px-3 py-2">
                                  <input type="number" min={1} value={item.qty_pesan}
                                    onChange={e => updatePoItem(idx, 'qty_pesan', +e.target.value)}
                                    className="w-16 text-center border border-[#d1cdc4] rounded px-1 py-0.5 text-sm" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" value={item.harga_beli}
                                    onChange={e => updatePoItem(idx, 'harga_beli', +e.target.value)}
                                    className="w-24 text-right border border-[#d1cdc4] rounded px-1 py-0.5 text-sm" />
                                </td>
                                <td className="px-3 py-2 text-right text-[#1e3a2c]">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                                    className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-[#1e3a2c] bg-[#f5f2eb]">
                              <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[#1e3a2c]">TOTAL</td>
                              <td className="px-3 py-2 text-right font-bold text-[#1e3a2c]">Rp {poItems.reduce((a, b) => a + b.subtotal, 0).toLocaleString('id-ID')}</td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Catatan (opsional)</label>
                      <textarea value={poCatatan} onChange={e => setPoCatatan(e.target.value)} rows={2}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowPOForm(false); setSelectedSupplier(null); setPoItems([]); setPoCatatan('') }}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
                      <button onClick={submitPO}
                        className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">Buat PO</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Order Terpandu (Guided Order) Wizard ── */}
              {guidedOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[92vh] flex flex-col">
                    {/* Header + step indicator */}
                    <div className="px-6 pt-5 pb-4 border-b border-[#f0ede6]">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[#1e3a2c] flex items-center gap-2"><Wand2 size={18} /> {t('Order Terpandu', 'Guided Order')}</h2>
                        <button onClick={closeGuided} className="text-[#9ca3af] hover:text-[#1e3a2c]"><X size={20} /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        {[
                          { n: 1, label: t('Pilih Barang', 'Select Items') },
                          { n: 2, label: t('Bagi Distributor', 'Assign Distributors') },
                          { n: 3, label: t('Review & Buat', 'Review & Create') },
                        ].map((s, i) => (
                          <div key={s.n} className="flex items-center gap-2 flex-1">
                            <div className={`flex items-center gap-2 ${guidedStep >= s.n ? 'text-[#1e3a2c]' : 'text-[#c3bfb4]'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${guidedStep > s.n ? 'bg-[#2f5741] text-white' : guidedStep === s.n ? 'bg-[#1e3a2c] text-white' : 'bg-[#eceae3] text-[#9ca3af]'}`}>
                                {guidedStep > s.n ? <Check size={13} /> : s.n}
                              </div>
                              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                            </div>
                            {i < 2 && <div className={`flex-1 h-0.5 rounded ${guidedStep > s.n ? 'bg-[#2f5741]' : 'bg-[#eceae3]'}`} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-6 py-4 overflow-y-auto flex-1">
                      {/* STEP 1, pilih barang */}
                      {guidedStep === 1 && (
                        <div>
                          <p className="text-sm text-[#6b7280] mb-3">{t('Sistem mengumpulkan barang yang sudah mencapai stok minimum. Sesuaikan jumlah order bila perlu.', 'The system collected items that reached minimum stock. Adjust order quantities as needed.')}</p>
                          {guidedItems.length === 0 ? (
                            <p className="text-center text-sm text-[#9ca3af] py-8">{t('Tidak ada barang yang perlu di-restok.', 'No items need restocking.')}</p>
                          ) : (
                            <table className="w-full text-sm border border-[#f0ede6] rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-[#f5f2eb] text-xs text-[#6b7280]">
                                  <th className="text-left px-3 py-2">{t('Produk', 'Product')}</th>
                                  <th className="text-center px-3 py-2">{t('Stok / Min', 'Stock / Min')}</th>
                                  <th className="text-center px-3 py-2">{t('Qty Order', 'Order Qty')}</th>
                                  <th className="px-2 py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {guidedItems.map(it => (
                                  <tr key={it.product_id} className="border-t border-[#f0ede6]">
                                    <td className="px-3 py-2">
                                      <div className="font-medium text-[#1e3a2c]">{it.nama}</div>
                                      <div className="text-xs text-[#9ca3af]">{it.satuan}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">{it.stok_total} / {it.stok_minimum}</span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <input type="number" min={1} value={it.qty}
                                        onChange={e => updateGuided(it.product_id, 'qty', Math.max(1, +e.target.value))}
                                        className="w-16 text-center border border-[#d1cdc4] rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e3a2c]" />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <button onClick={() => setGuidedItems(guidedItems.filter(x => x.product_id !== it.product_id))}
                                        className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}

                      {/* STEP 2, bagi distributor */}
                      {guidedStep === 2 && (
                        <div>
                          <p className="text-sm text-[#6b7280] mb-3">{t('Sistem memilih distributor default tiap barang. Ubah bila perlu. Barang tanpa supplier akan dilewati.', 'The system picked a default distributor per item. Change if needed. Items without a supplier will be skipped.')}</p>
                          <div className="space-y-2">
                            {guidedItems.map(it => (
                              <div key={it.product_id} className="flex items-center justify-between gap-3 px-3 py-2 border border-[#f0ede6] rounded-lg">
                                <div className="min-w-0">
                                  <div className="font-medium text-[#1e3a2c] text-sm truncate">{it.nama}</div>
                                  <div className="text-xs text-[#9ca3af]">{it.qty} {it.satuan}</div>
                                </div>
                                {it.suppliers.length === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 shrink-0"><AlertTriangle size={13} /> {t('Belum ada supplier', 'No supplier')}</span>
                                ) : (
                                  <select value={it.supplier_id} onChange={e => updateGuided(it.product_id, 'supplier_id', e.target.value)}
                                    className="border border-[#d1cdc4] rounded-lg px-2 py-1.5 text-sm max-w-[55%] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                                    {it.suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nama_supplier}{s.jenis ? ` (${s.jenis})` : ''}</option>)}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STEP 3, review & buat */}
                      {guidedStep === 3 && (() => {
                        const valid = guidedItems.filter(i => i.supplier_id && i.qty > 0)
                        const skipped = guidedItems.filter(i => !i.supplier_id || i.qty <= 0)
                        const groups: Record<string, any[]> = {}
                        valid.forEach(i => { (groups[i.supplier_id] = groups[i.supplier_id] || []).push(i) })
                        const sids = Object.keys(groups)
                        return (
                          <div>
                            <p className="text-sm text-[#6b7280] mb-3">{t('Order akan dipecah menjadi', 'The order will be split into')} <span className="font-bold text-[#1e3a2c]">{sids.length} PO</span> {t('siap kirim ke masing-masing distributor.', 'ready to send to each distributor.')}</p>
                            <div className="space-y-3">
                              {sids.map(sid => {
                                const items = groups[sid]
                                const total = items.reduce((a, b) => a + b.qty * b.harga_beli, 0)
                                return (
                                  <div key={sid} className="border border-[#e2ddd0] rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f2eb]">
                                      <span className="font-semibold text-[#1e3a2c] text-sm flex items-center gap-1.5"><Truck size={14} /> {supName(sid)}</span>
                                      <span className="text-xs text-[#6b7280]">{items.length} {t('item', 'items')}</span>
                                    </div>
                                    <table className="w-full text-sm">
                                      <tbody>
                                        {items.map(it => (
                                          <tr key={it.product_id} className="border-t border-[#f0ede6]">
                                            <td className="px-4 py-2 text-[#1e3a2c]">{it.nama}</td>
                                            <td className="px-2 py-2 text-center text-[#6b7280] whitespace-nowrap">{it.qty} × Rp {it.harga_beli.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-2 text-right text-[#1e3a2c] font-medium">Rp {(it.qty * it.harga_beli).toLocaleString('id-ID')}</td>
                                          </tr>
                                        ))}
                                        <tr className="border-t border-[#e2ddd0] bg-[#faf8f3]">
                                          <td colSpan={2} className="px-4 py-2 font-semibold text-[#1e3a2c] text-xs">TOTAL</td>
                                          <td className="px-4 py-2 text-right font-bold text-[#1e3a2c]">Rp {total.toLocaleString('id-ID')}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )
                              })}
                            </div>
                            {skipped.length > 0 && (
                              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                                <span className="font-semibold">{skipped.length} {t('barang dilewati', 'items skipped')}</span> ({t('tanpa supplier', 'no supplier')}): {skipped.map(s => s.nama).join(', ')}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Footer nav */}
                    <div className="px-6 py-4 border-t border-[#f0ede6] flex gap-3">
                      <button onClick={() => guidedStep === 1 ? closeGuided() : setGuidedStep(guidedStep - 1)}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm hover:bg-gray-50">
                        {guidedStep === 1 ? t('Batal', 'Cancel') : t('Kembali', 'Back')}
                      </button>
                      {guidedStep < 3 ? (
                        <button onClick={() => setGuidedStep(guidedStep + 1)} disabled={guidedItems.length === 0}
                          className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] disabled:opacity-50">
                          {t('Lanjut', 'Next')}
                        </button>
                      ) : (
                        <button onClick={submitGuided} disabled={guidedLoading}
                          className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] disabled:opacity-50">
                          {guidedLoading ? t('Memproses...', 'Processing...') : t('Buat Semua PO', 'Create All POs')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={TBL_WRAP}>
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('No. PO', 'PO No.')}</th>
                      <th className={TH_L}>Supplier</th>
                      <th className={TH_L}>{t('Tanggal', 'Date')}</th>
                      <th className={TH_R}>Total</th>
                      <th className={TH_C}>Status</th>
                      <th className={TH_C}>{t('Aksi', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poList.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">{t('Belum ada PO, buat PO pertama', 'No POs yet, create your first PO')}</td></tr>
                    ) : (
                      poList.map((po: any) => (
                        <tr key={po.id} className={TR}>
                          <td className="px-4 py-3 font-mono text-xs text-[#1e3a2c] font-medium">{po.nomor_po}</td>
                          <td className="px-4 py-3 text-[#1e3a2c]">{po.suppliers?.nama_supplier}</td>
                          <td className="px-4 py-3 text-[#6b7280]">
                            {new Date(po.tanggal_po || po.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#1e3a2c]">Rp {po.total_nilai?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusPOColor[po.status] || 'bg-gray-100 text-gray-600'}`}>{po.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => printPO(po)} className="text-xs text-[#1e3a2c] hover:underline font-medium">Print</button>
<span className="text-[#d1cdc4]">|</span>
<button onClick={async () => {
  const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id)
  setShowPODetail({ ...po, items: items || [] })
}} className="text-xs text-[#6b7280] hover:underline font-medium">{t('Detail', 'Details')}</button>
                              {po.status === 'draft' && (
                                <>
                                  <span className="text-[#d1cdc4]">|</span>
                                  <button onClick={async () => {
                                    await supabase.from('purchase_orders').update({ status: 'dikirim' }).eq('id', po.id)
                                    fetchPOList()
                                  }} className="text-xs text-blue-600 hover:underline font-medium">{t('Kirim', 'Send')}</button>
                                </>
                              )}
                              {po.status === 'dikirim' && (
                                <>
                                  <span className="text-[#d1cdc4]">|</span>
                                  <button onClick={() => openPenerimaan(po)} className="text-xs text-green-600 hover:underline font-medium">
                                    {po.status_penerimaan === 'partial' ? t('Terima Lagi', 'Receive More') : t('Terima Barang', 'Receive Goods')}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLIER */}
          {activePage === 'supplier' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1e3a2c] mb-1">{t('Supplier', 'Suppliers')}</h1>
                  <p className="text-[#6b7280] text-sm">{t('Daftar PBF dan distributor apotek', 'List of pharmacy distributors (PBF)')}</p>
                </div>
                <button onClick={() => setShowSupplierForm(true)}
                  className="bg-[#1e3a2c] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                  + {t('Tambah Supplier', 'Add Supplier')}
                </button>
              </div>

              {showSupplierForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <h2 className="text-lg font-bold text-[#1e3a2c] mb-4">{t('Tambah Supplier', 'Add Supplier')}</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Nama Supplier *', 'Supplier Name *')}</label>
                        <input value={supplierForm.nama_supplier} onChange={e => setSupplierForm({...supplierForm, nama_supplier: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Jenis', 'Type')}</label>
                        <select value={supplierForm.jenis} onChange={e => setSupplierForm({...supplierForm, jenis: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                          <option value="PBF">PBF</option>
                          <option value="Subdistributor">Subdistributor</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Telepon', 'Phone')}</label>
                        <input value={supplierForm.telepon} onChange={e => setSupplierForm({...supplierForm, telepon: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
                        <input value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">{t('Alamat', 'Address')}</label>
                        <textarea value={supplierForm.alamat} onChange={e => setSupplierForm({...supplierForm, alamat: e.target.value})}
                          rows={2} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowSupplierForm(false)}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">{t('Batal', 'Cancel')}</button>
                      <button onClick={handleTambahSupplier}
                        className="flex-1 bg-[#1e3a2c] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">{t('Simpan', 'Save')}</button>
                    </div>
                  </div>
                </div>
              )}

              <div className={TBL_WRAP}>
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('Kode', 'Code')}</th>
                      <th className={TH_L}>{t('Nama Supplier', 'Supplier Name')}</th>
                      <th className={TH_L}>{t('Jenis', 'Type')}</th>
                      <th className={TH_L}>{t('Telepon', 'Phone')}</th>
                      <th className={TH_C}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">{t('Belum ada supplier, tambah supplier dulu', 'No suppliers yet, add a supplier first')}</td></tr>
                    ) : (
                      suppliers.map(s => (
                        <tr key={s.id} className={TR}>
                          <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{s.kode}</td>
                          <td className="px-4 py-3 font-medium text-[#1e3a2c]">{s.nama_supplier}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{s.jenis}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{s.telepon || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{s.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LAPORAN */}
          {activePage === 'laporan' && (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Laporan', 'Reports')}</h1>
              <p className="text-[#6b7280] text-sm mb-5">{t('Laporan penjualan & laporan SIPNAP (Narkotika/Psikotropika/Prekursor)', 'Sales reports & SIPNAP reports (Narcotics/Psychotropics/Precursors)')}</p>

              <div className="flex gap-1 mb-5">
                {([{id:'penjualan',label:t('Penjualan','Sales')},{id:'metode',label:t('Metode Bayar','Payment Methods')},{id:'sipnap',label:'SIPNAP'}] as const).map(tab => (
                  <button key={tab.id} onClick={() => setLaporanTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${laporanTab === tab.id ? 'bg-[#1e3a2c] text-white' : 'text-[#6b7280] hover:bg-white/60'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filter bar (Penjualan & Metode Bayar) */}
              {(laporanTab === 'penjualan' || laporanTab === 'metode') && (
                <div className="mb-5 flex flex-wrap items-end gap-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#6b7280] mb-1 block uppercase tracking-wide">{t('Dari Tgl', 'From')}</label>
                    <input type="date" value={lapDari} onChange={e => setLapDari(e.target.value)}
                      className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6b7280] mb-1 block uppercase tracking-wide">{t('Sampai Tgl', 'To')}</label>
                    <input type="date" value={lapSampai} onChange={e => setLapSampai(e.target.value)}
                      className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6b7280] mb-1 block uppercase tracking-wide">{t('Metode', 'Method')}</label>
                    <select value={lapMetode} onChange={e => setLapMetode(e.target.value)}
                      className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                      <option value="">{t('Semua', 'All')}</option>
                      {['Tunai','QRIS','Transfer','Debit','Kartu Kredit'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6b7280] mb-1 block uppercase tracking-wide">Status</label>
                    <select value={lapStatus} onChange={e => setLapStatus(e.target.value)}
                      className="border border-[#d1cdc4] bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                      <option value="">{t('Semua', 'All')}</option>
                      <option value="selesai">{t('Selesai', 'Completed')}</option>
                      <option value="dibatalkan">{t('Dibatalkan', 'Cancelled')}</option>
                    </select>
                  </div>
                  {(lapDari || lapSampai || lapMetode || lapStatus) && (
                    <button onClick={() => { setLapDari(''); setLapSampai(''); setLapMetode(''); setLapStatus('') }}
                      className="px-3 py-2 rounded-lg text-sm text-[#6b7280] border border-[#d1cdc4] hover:bg-gray-50">{t('Reset', 'Reset')}</button>
                  )}
                </div>
              )}

              {/* Tab Metode Bayar, rekap uang per metode */}
              {laporanTab === 'metode' && (() => {
                const aktif = riwayatFiltered.filter(x => x.status !== 'dibatalkan')
                const metodeList = ['Tunai','QRIS','Transfer','Debit','Kartu Kredit']
                const rekap = metodeList.map(m => {
                  const rows = aktif.filter(x => (x.metode_bayar || 'Tunai') === m)
                  return { metode: m, count: rows.length, total: rows.reduce((a, b) => a + (b.total || 0), 0) }
                })
                const grand = rekap.reduce((a, b) => a + b.total, 0)
                const grandCount = rekap.reduce((a, b) => a + b.count, 0)
                const ikon: Record<string, string> = { Tunai: '💵', QRIS: '📱', Transfer: '🏦', Debit: '💳', 'Kartu Kredit': '💳' }
                return (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                      {rekap.map(r => (
                        <div key={r.metode} className="bg-white/80 backdrop-blur-sm border border-[#e8e4d9] rounded-2xl shadow-sm p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{ikon[r.metode]}</span>
                            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{r.metode}</span>
                          </div>
                          <p className="text-lg font-bold text-[#1c2620] tabular-nums leading-none">Rp {r.total.toLocaleString('id-ID')}</p>
                          <p className="text-xs text-[#9ca3af] mt-1.5">{r.count} {t('transaksi', 'transactions')}</p>
                          {grand > 0 && (
                            <div className="mt-2 h-1.5 rounded-full bg-[#eef0ea] overflow-hidden">
                              <div className="h-full rounded-full bg-[#2f5741]" style={{ width: `${grand ? (r.total / grand) * 100 : 0}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className={TBL_WRAP}>
                      <table className={TBL}>
                        <thead className={THEAD}>
                          <tr>
                            <th className={TH_L}>{t('Metode Pembayaran', 'Payment Method')}</th>
                            <th className={TH_C}>{t('Jumlah Transaksi', 'Transactions')}</th>
                            <th className={TH_R}>{t('Total Diterima', 'Total Received')}</th>
                            <th className={TH_R}>{t('% dari Total', '% of Total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rekap.map(r => (
                            <tr key={r.metode} className={TR}>
                              <td className={TD + ' font-medium text-[#1c2620]'}>{ikon[r.metode]} {r.metode}</td>
                              <td className={TD + ' text-center text-[#6b7280] tabular-nums'}>{r.count}</td>
                              <td className={TD + ' text-right font-medium text-[#1c2620] tabular-nums'}>Rp {r.total.toLocaleString('id-ID')}</td>
                              <td className={TD + ' text-right text-[#6b7280] tabular-nums'}>{grand ? ((r.total / grand) * 100).toFixed(1) : '0.0'}%</td>
                            </tr>
                          ))}
                          <tr className="bg-[#f6f4ee] border-t-2 border-[#1e3a2c]">
                            <td className={TD + ' font-bold text-[#1e3a2c]'}>TOTAL</td>
                            <td className={TD + ' text-center font-bold text-[#1e3a2c] tabular-nums'}>{grandCount}</td>
                            <td className={TD + ' text-right font-bold text-[#1e3a2c] tabular-nums'}>Rp {grand.toLocaleString('id-ID')}</td>
                            <td className={TD + ' text-right font-bold text-[#1e3a2c]'}>100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-3">{t('Rekap uang masuk per metode pembayaran (transaksi dibatalkan tidak dihitung). Gunakan untuk mencocokkan uang tunai & saldo QRIS/transfer dengan fisik.', 'Money-in recap per payment method (cancelled transactions excluded). Use it to reconcile cash & QRIS/transfer balances with actuals.')}</p>
                  </div>
                )
              })()}

              {laporanTab === 'sipnap' && (
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-6 max-w-2xl">
                  <h2 className="text-lg font-bold text-[#1c2620] mb-1">Laporan SIPNAP</h2>
                  <p className="text-sm text-[#6b7280] mb-5">Pilih golongan &amp; periode. Penerimaan diambil dari pembelian supplier, pengeluaran dari transaksi (beserta data pasien &amp; no. resep).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Golongan</label>
                      <select value={sipnapForm.golongan} onChange={e => setSipnapForm({...sipnapForm, golongan: e.target.value})}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                        <option value="narkotika">Narkotika</option>
                        <option value="psikotropika">Psikotropika</option>
                        <option value="prekursor">Prekursor</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Bulan</label>
                      <select value={sipnapForm.bulan} onChange={e => setSipnapForm({...sipnapForm, bulan: +e.target.value})}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                        {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m,i) => (
                          <option key={i} value={i+1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Tahun</label>
                      <input type="number" value={sipnapForm.tahun} onChange={e => setSipnapForm({...sipnapForm, tahun: +e.target.value})}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]" />
                    </div>
                  </div>
                  <button onClick={cetakSIPNAP}
                    className="inline-flex items-center gap-2 bg-[#1e3a2c] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                    <Printer size={15} /> Cetak Laporan SIPNAP
                  </button>
                  <p className="text-xs text-[#9ca3af] mt-3">Tanda tangan hanya oleh Apoteker Penanggung Jawab (APJ). Pastikan Nama Apoteker &amp; SIPA sudah diisi di Pengaturan → Data Apoteker.</p>
                </div>
              )}

              {laporanTab === 'penjualan' && (<>
              <div className={TBL_WRAP}>
                <table className={TBL}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH_L}>{t('No. Transaksi', 'Transaction No.')}</th>
                      <th className={TH_L}>{t('Waktu', 'Time')}</th>
                      <th className={TH_C}>{t('Metode', 'Method')}</th>
                      <th className={TH_R}>Total</th>
                      <th className={TH_R}>{t('Bayar', 'Paid')}</th>
                      <th className={TH_R}>{t('Kembalian', 'Change')}</th>
                      <th className={TH_C}>Status</th>
                      <th className={TH_C}>{t('Aksi', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatFiltered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-[#9ca3af]">{t('Belum ada transaksi', 'No transactions yet')}</td></tr>
                    ) : (
                      riwayatFiltered.map(trx => (
                        <tr key={trx.id} className={TR}>
                          <td className="px-4 py-3 font-mono text-xs text-[#1e3a2c] font-medium">{trx.nomor_transaksi}</td>
                          <td className="px-4 py-3 text-[#6b7280]">
                            {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#eef0ea] text-[#2f5741]">{trx.metode_bayar || 'Tunai'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#1e3a2c]">Rp {trx.total?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right text-[#6b7280]">Rp {trx.bayar?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right text-[#6b7280]">Rp {trx.kembalian?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              trx.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                            }`}>{trx.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={async () => {
                                const { data: items } = await supabase.from('transaction_items').select('*').eq('transaction_id', trx.id)
                                setTrxDetailItems(items || [])
                                setShowTrxDetail(trx)
                              }} className="text-xs text-[#1e3a2c] hover:underline font-medium">Detail</button>
                              {trx.status !== 'dibatalkan' && (
                                <>
                                  <span className="text-[#d1cdc4]">|</span>
                                  <button onClick={async () => {
                                    if (!confirm(t(`Yakin batalkan transaksi ${trx.nomor_transaksi}? Stok akan dikembalikan.`, `Cancel transaction ${trx.nomor_transaksi}? Stock will be restored.`))) return
                                    const { data: items } = await supabase.from('transaction_items').select('*, products(stok_total)').eq('transaction_id', trx.id)
                                    if (items) {
                                      for (const item of items) {
                                        await supabase.from('products').update({
                                          stok_total: (item.products?.stok_total || 0) + item.jumlah
                                        }).eq('id', item.product_id)
                                      }
                                    }
                                    await supabase.from('transactions').update({ status: 'dibatalkan' }).eq('id', trx.id)
                                    fetchRiwayat()
                                    alert(t('✅ Transaksi dibatalkan, stok dikembalikan.', '✅ Transaction cancelled, stock restored.'))
                                  }} className="text-xs text-red-500 hover:underline font-medium">{t('Batalkan', 'Cancel')}</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {riwayatFiltered.length > 0 && (
                <div className="mt-4 bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm p-4 flex justify-between items-center">
                  <span className="text-sm text-[#6b7280]">Total {riwayatFiltered.length} {t('transaksi', 'transactions')}</span>
                  <span className="text-sm font-semibold text-[#1e3a2c]">
                    {t('Total Omzet', 'Total Revenue')}: Rp {riwayatFiltered.filter(x => x.status !== 'dibatalkan').reduce((a, b) => a + b.total, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              </>)}
            </div>
          )}

          {/* MIGRASI DATA, dipindah ke Settings → Migrasi Data (lihat migrasiPane) */}
          {false && (() => {
            const cards = [
              {
                key: 'produk', title: t('Daftar Produk', 'Product List'), Icon: Pill,
                desc: t('Impor katalog obat: nama, kategori, harga, dan stok awal.', 'Import the drug catalog: name, category, price, and opening stock.'),
                cols: 'kode (opsional), nama_obat, nama_generik, kandungan, kategori, satuan, isi_kemasan, harga_beli, harga_jual, stok_total, stok_minimum',
                hint: 'Kategori: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.',
                file: 'template_produk.csv',
                headers: ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum'],
                examples: [['', 'Paracetamol 500mg', 'Paracetamol', 'Paracetamol 500 mg', 'bebas', 'Tablet', '100', '500', '1000', '150', '10']],
                onUpload: importProduk,
              },
              {
                key: 'supplier', title: t('Daftar Supplier', 'Supplier List'), Icon: Truck,
                desc: t('Impor daftar PBF / supplier obat.', 'Import the list of distributors / drug suppliers.'),
                cols: 'nama_supplier, jenis, alamat, telepon, email',
                hint: 'Jenis yang valid: PBF, Subdistributor, atau Lainnya (nilai lain otomatis disesuaikan).',
                file: 'template_supplier.csv',
                headers: ['nama_supplier', 'jenis', 'alamat', 'telepon', 'email'],
                examples: [['PT Bina San Prima', 'PBF', 'Jl. Industri No. 1', '021-1234567', 'sales@binasan.co.id']],
                onUpload: importSupplier,
              },
              {
                key: 'stok', title: t('Stok Awal (Batch)', 'Opening Stock (Batch)'), Icon: PackageOpen,
                desc: t('Impor stok awal per batch + expired date. Dicocokkan ke produk lewat kode.', 'Import opening stock per batch + expiry date. Matched to products by code.'),
                cols: 'kode_produk, batch_number, expired_date (YYYY-MM-DD), stok_batch',
                hint: 'Impor Produk dulu agar kode-nya tersedia. Stok batch akan menambah stok total produk.',
                file: 'template_stok_awal.csv',
                headers: ['kode_produk', 'batch_number', 'expired_date', 'stok_batch'],
                examples: [['OBT-0001', 'BT-2401', '2026-12-31', '150']],
                onUpload: importStok,
              },
              {
                key: 'mapping', title: t('Mapping Produk–Supplier', 'Product–Supplier Mapping'), Icon: ClipboardList,
                desc: t('Kaitkan tiap produk ke supplier-nya, agar pembuatan PO otomatis tahu daftar produk per supplier.', 'Link each product to its supplier, so creating a PO automatically knows the products per supplier.'),
                cols: 'kode_produk, nama_supplier (atau kode_supplier)',
                hint: 'Import Produk & Supplier dulu. Nama supplier harus sama persis dengan yang terdaftar.',
                file: 'template_mapping_produk_supplier.csv',
                headers: ['kode_produk', 'nama_supplier'],
                examples: [['OBT-0001', 'PT Bina San Prima']],
                onUpload: importMapping,
              },
              {
                key: 'fakturawal', title: t('Faktur / Hutang Awal', 'Opening Invoices / Debts'), Icon: Receipt,
                desc: t('Impor faktur pembelian yang belum lunas, langsung muncul di menu Pembayaran Faktur dengan jatuh tempo.', 'Import unpaid purchase invoices, they appear in Invoice Payments with due dates.'),
                cols: 'nomor_faktur, nama_supplier, tanggal_faktur (YYYY-MM-DD), term_of_payment, total',
                hint: 'Import Supplier dulu. Jatuh tempo dihitung dari tanggal_faktur + term_of_payment bila kolom tanggal_jatuh_tempo tidak diisi.',
                file: 'template_faktur_awal.csv',
                headers: ['nomor_faktur', 'nama_supplier', 'tanggal_faktur', 'term_of_payment', 'total'],
                examples: [['INV/2025/0087', 'PT Bina San Prima', '2026-06-15', '30', '2500000']],
                onUpload: importFakturAwal,
              },
            ]
            return (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Migrasi Data', 'Data Migration')}</h1>
              <p className="text-[#6b7280] text-sm mb-6">{t('Onboarding cepat: unduh template, isi di Excel/Sheets, lalu upload CSV. Data otomatis masuk ke apotek Anda.', 'Fast onboarding: download a template, fill it in Excel/Sheets, then upload the CSV. Data goes straight into your pharmacy.')}</p>

              {isSuper && (
                <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">{t('Mode Super Admin', 'Super Admin Mode')}</p>
                    <p className="text-xs text-amber-700">{t('Pilih apotek tujuan, data import/export akan masuk/diambil dari apotek ini.', 'Select a target pharmacy, imported/exported data goes to/from this pharmacy.')}</p>
                  </div>
                  <select value={migrasiCompany} onChange={e => setMigrasiCompany(e.target.value)}
                    className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]">
                    <option value="">{t('Pilih Apotek', 'Select Pharmacy')}</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(c => (
                  <div key={c.key} className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-5 flex flex-col">
                    <div className="w-11 h-11 rounded-xl bg-[#dce5db] text-[#2f5741] flex items-center justify-center mb-3"><c.Icon size={20} strokeWidth={1.9} /></div>
                    <h2 className="font-bold text-[#1c2620]">{c.title}</h2>
                    <p className="text-sm text-[#6b7280] mt-1 mb-3">{c.desc}</p>
                    <div className="bg-[#f5f2eb] rounded-lg p-3 mb-3">
                      <p className="text-[11px] font-medium text-[#6b7280] mb-1">{t('Kolom CSV:', 'CSV Columns:')}</p>
                      <p className="text-[11px] text-[#1c2620] font-mono leading-relaxed break-words">{c.cols}</p>
                    </div>
                    <p className="text-[11px] text-[#9ca3af] mb-4">{c.hint}</p>
                    <div className="mt-auto flex flex-col gap-2">
                      <button onClick={() => downloadTemplate(c.file, c.headers, c.examples)}
                        className="inline-flex items-center justify-center gap-2 border border-[#d1cdc4] text-[#1e3a2c] py-2 rounded-lg text-sm font-medium hover:bg-[#f5f2eb] transition">
                        <Download size={15} /> {t('Download Template', 'Download Template')}
                      </button>
                      <label className={`inline-flex items-center justify-center gap-2 bg-[#1e3a2c] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition cursor-pointer ${importing === c.key ? 'opacity-60 pointer-events-none' : ''}`}>
                        <Upload size={15} /> {importing === c.key ? t('Mengimpor…', 'Importing…') : t('Upload CSV', 'Upload CSV')}
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
              <div className="mt-6 bg-white/60 border border-white/60 rounded-xl p-4 text-sm text-[#6b7280] max-w-3xl">
                <p className="font-medium text-[#1c2620] mb-1">{t('Urutan yang disarankan', 'Recommended order')}</p>
                <p>{t('1) Import Produk → 2) Supplier → 3) Stok Awal → 4) Mapping Produk–Supplier. Simpan file sebagai CSV UTF-8. Header wajib sama persis dengan template.', '1) Import Products → 2) Suppliers → 3) Opening Stock → 4) Product–Supplier Mapping. Save the file as CSV UTF-8. Headers must match the template exactly.')}</p>
              </div>

              {/* Export / Backup */}
              <div className="mt-6">
                <h2 className="text-lg font-bold text-[#1c2620] mb-1">{t('Export / Backup Data', 'Export / Backup Data')}</h2>
                <p className="text-sm text-[#6b7280] mb-4">{t('Unduh data apotek saat ini ke CSV (untuk cadangan atau pindah sistem).', 'Download current pharmacy data to CSV (for backup or system migration).')}</p>
                <div className="flex flex-wrap gap-3">
                  {([['Produk',exportProduk],['Supplier',exportSupplier],['Stok / Batch',exportStok],['Transaksi',exportTransaksi],['Faktur',exportFaktur]] as const).map(([label, fn]) => (
                    <button key={label} onClick={() => { if (isSuper && !migrasiCompany) return alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); (fn as () => void)() }}
                      className="inline-flex items-center gap-2 border border-[#d1cdc4] text-[#1e3a2c] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f5f2eb] transition"><Download size={15} /> {t('Export', 'Export')} {label}</button>
                  ))}
                </div>
              </div>
            </div>
            )
          })()}

          {/* PENGATURAN */}
          {activePage === 'pengaturan' && (() => {
            const inputCls = 'w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]'
            const roleLabels: Record<string,string> = { pemilik:t('Pemilik','Owner'), apoteker:t('Apoteker','Pharmacist'), asisten_apoteker:t('Asisten Apoteker','Pharmacist Assistant'), kasir:t('Kasir','Cashier'), admin:'Admin' }
            const settingsMenu = [
              { id:'profil', label:t('Profil Apotek','Pharmacy Profile'), desc:t('Nama, alamat, logo','Name, address, logo'), Icon:Building2 },
              { id:'pengguna', label:t('Manajemen Pengguna','User Management'), desc:t('Akses pengguna, anggota tim','User access, team members'), Icon:Users },
              { id:'apoteker', label:t('Data Apoteker','Pharmacist Data'), desc:t('SIA, SIPA, penanggung jawab','SIA, SIPA, responsible person'), Icon:ShieldCheck },
              { id:'migrasi', label:t('Migrasi Data','Data Migration'), desc:t('Import & export CSV','Import & export CSV'), Icon:Database },
            ]
            return (
            <div>
              <h1 className="text-3xl font-bold text-[#1c2620] mb-1">{t('Pengaturan', 'Settings')}</h1>
              <p className="text-[#6b7280] text-sm mb-6">{t('Kelola profil apotek, pengguna, dan data penanggung jawab', 'Manage pharmacy profile, users, and responsible pharmacist data')}</p>
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                {/* Sub-menu kiri */}
                <div className="space-y-2">
                  {settingsMenu.map((m: any) => (
                    <button key={m.id} onClick={() => m.nav ? setActivePage(m.id) : setSettingsTab(m.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                        settingsTab === m.id ? 'bg-white/80 border-[#1e3a2c]/20 shadow-sm' : 'bg-white/50 border-white/60 hover:bg-white/70'
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${settingsTab === m.id ? 'bg-[#1e3a2c] text-white' : 'bg-[#eef0ea] text-[#1e3a2c]'}`}>
                        <m.Icon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1c2620]">{m.label}</p>
                        <p className="text-xs text-[#9ca3af] truncate">{m.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#c4c9c2] shrink-0" />
                    </button>
                  ))}
                  <div className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-white/60 bg-white/30 opacity-70">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#eef0ea] text-[#9ca3af] shrink-0"><CreditCard size={17} /></div>
                    <div className="flex-1"><p className="text-sm font-semibold text-[#6b7280]">{t('Metode Pembayaran', 'Payment Methods')}</p><p className="text-xs text-[#9ca3af]">{t('Segera hadir', 'Coming soon')}</p></div>
                  </div>
                </div>

                {/* Konten kanan */}
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl p-6">
                  {settingsTab === 'migrasi' && migrasiPane}
                  {/* PROFIL APOTEK */}
                  {settingsTab === 'profil' && (
                    <div>
                      <h2 className="text-xl font-bold text-[#1c2620] mb-1">{t('Profil apotek', 'Pharmacy profile')}</h2>
                      <p className="text-sm text-[#6b7280] mb-6">{t('Profil apotek akan ditampilkan pada struk penjualan.', 'The pharmacy profile appears on sales receipts.')}</p>
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Logo */}
                        <div className="shrink-0">
                          <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[#d1cdc4] flex items-center justify-center overflow-hidden bg-[#faf9f6]">
                            {settingsData.logo_url
                              ? <img src={settingsData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                              : <Building2 size={44} className="text-[#c4c9c2]" strokeWidth={1.3} />}
                          </div>
                          <label className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#d1cdc4] text-sm text-[#1e3a2c] font-medium hover:bg-[#f5f2eb] transition cursor-pointer">
                            <Upload size={15} /> {t('Ubah logo', 'Change logo')}
                            <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                              onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                          </label>
                          <p className="text-xs text-[#9ca3af] mt-2 text-center">{t('Maksimal 4MB', 'Max 4MB')}<br/>{t('Format .JPG .JPEG .PNG', 'Format .JPG .JPEG .PNG')}</p>
                        </div>
                        {/* Fields */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nama apotek', 'Pharmacy name')}</label>
                            <input value={settingsData.nama_apotek || ''} onChange={e => setSettingsData({...settingsData, nama_apotek: e.target.value})} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Sektor usaha', 'Business sector')}</label>
                              <input value={settingsData.sektor_usaha || 'Apotek'} onChange={e => setSettingsData({...settingsData, sektor_usaha: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Kota/Kabupaten', 'City/Regency')}</label>
                              <input value={settingsData.kota || ''} onChange={e => setSettingsData({...settingsData, kota: e.target.value})} placeholder="Kab. Gianyar, Bali" className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Alamat', 'Address')}</label>
                            <textarea value={settingsData.alamat || ''} onChange={e => setSettingsData({...settingsData, alamat: e.target.value})} rows={2} className={inputCls} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('No. telepon', 'Phone No.')}</label>
                              <input value={settingsData.nomor_telepon || ''} onChange={e => setSettingsData({...settingsData, nomor_telepon: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Email</label>
                              <input type="email" value={settingsData.email || ''} onChange={e => setSettingsData({...settingsData, email: e.target.value})} className={inputCls} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nomor Ijin (SIA)', 'License No. (SIA)')}</label>
                            <input value={settingsData.nomor_ijin || ''} onChange={e => setSettingsData({...settingsData, nomor_ijin: e.target.value})} className={inputCls} />
                          </div>
                          <button onClick={saveSettings} className="bg-[#1e3a2c] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                            {t('Simpan Profil', 'Save Profile')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DATA APOTEKER */}
                  {settingsTab === 'apoteker' && (
                    <div className="max-w-md">
                      <h2 className="text-xl font-bold text-[#1c2620] mb-1">{t('Data apoteker', 'Pharmacist data')}</h2>
                      <p className="text-sm text-[#6b7280] mb-6">{t('Penanggung jawab yang tertera di PO & Berita Acara.', 'The responsible person shown on POs & official reports.')}</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nama Apoteker', 'Pharmacist Name')}</label>
                          <input value={settingsData.nama_apoteker || ''} onChange={e => setSettingsData({...settingsData, nama_apoteker: e.target.value})} placeholder="apt. Nama Apoteker, S.Farm" className={inputCls} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nomor SIPA', 'SIPA Number')}</label>
                          <input value={settingsData.nomor_sipa || ''} onChange={e => setSettingsData({...settingsData, nomor_sipa: e.target.value})} placeholder="SIPA/001/2024/..." className={inputCls} />
                        </div>
                        <button onClick={saveSettings} className="bg-[#1e3a2c] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                          {t('Simpan Data Apoteker', 'Save Pharmacist Data')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MANAJEMEN PENGGUNA */}
                  {settingsTab === 'pengguna' && (() => {
                    const ModuleGrid = ({ selected, onToggle, onClear, onAll }: { selected: string[], onToggle: (id:string)=>void, onClear: ()=>void, onAll: ()=>void }) => (
                      <div className="border border-[#e2ddd3] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[#1c2620]">{t('Akses Modul', 'Module Access')}</p>
                          <div className="flex gap-3 text-xs">
                            <button type="button" onClick={onAll} className="text-[#1e3a2c] font-medium hover:underline">{t('Pilih semua', 'Select all')}</button>
                            <button type="button" onClick={onClear} className="text-[#6b7280] hover:underline">{t('Hapus semua', 'Clear all')}</button>
                          </div>
                        </div>
                        <p className="text-xs text-[#9ca3af] mb-4">{t('Centang modul yang boleh dibuka user ini.', 'Check the modules this user may open.')}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {menuItems.map(m => {
                            const checked = selected.includes(m.id)
                            return (
                              <button type="button" key={m.id} onClick={() => onToggle(m.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm transition ${checked ? 'border-[#1e3a2c] bg-[#f5f2eb]' : 'border-[#d1cdc4] hover:bg-gray-50'}`}>
                                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? 'bg-[#1e3a2c] text-white' : 'border border-[#d1cdc4]'}`}>{checked && <Check size={11} strokeWidth={3} />}</span>
                                <span className="text-[#1c2620]">{lang === 'en' ? m.en : m.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )

                    // ── FORM TAMBAH ──
                    if (showUserForm) return (
                      <div>
                        <button onClick={() => setShowUserForm(false)} className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#1e3a2c] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[#1c2620] mb-1">{t('Tambah Pengguna', 'Add User')}</h2>
                        <p className="text-sm text-[#6b7280] mb-5">{t('User baru langsung bisa login dengan email & password ini.', 'The new user can sign in immediately with this email & password.')}</p>
                        <div className="space-y-5">
                          <div className="border border-[#e2ddd3] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Email</label>
                              <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="nama@apotek.com" className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Password Awal', 'Initial Password')}</label>
                              <input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={t('Minimal 6 karakter', 'At least 6 characters')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} placeholder={t('Nama lengkap', 'Full name')} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Role</label>
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
                            className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition disabled:opacity-50">
                            {savingUser ? t('Membuat…', 'Creating…') : t('Buat Pengguna', 'Create User')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── FORM EDIT ──
                    if (editUser) return (
                      <div>
                        <button onClick={() => setEditUser(null)} className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#1e3a2c] mb-3"><ArrowLeft size={15} /> {t('Kembali ke Pengguna', 'Back to Users')}</button>
                        <h2 className="text-xl font-bold text-[#1c2620] mb-1">{t('Edit Pengguna', 'Edit User')}</h2>
                        <p className="text-sm text-[#6b7280] mb-5">{t('Ubah role, status, dan hak akses modul. Email login tidak dapat diubah di sini.', 'Change role, status, and module access. Login email cannot be changed here.')}</p>
                        <div className="space-y-5">
                          <div className="border border-[#e2ddd3] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">{t('Nama', 'Name')}</label>
                              <input value={editUser.nama} onChange={e => setEditUser({...editUser, nama: e.target.value})} className={inputCls} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Email</label>
                              <input value={editUser.email || ''} disabled className={inputCls + ' bg-[#f5f2eb] text-[#9ca3af]'} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Role</label>
                              <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className={inputCls}>
                                <option value="pemilik">{t('Pemilik', 'Owner')}</option>
                                <option value="apoteker">{t('Apoteker', 'Pharmacist')}</option>
                                <option value="asisten_apoteker">{t('Asisten Apoteker', 'Pharmacist Assistant')}</option>
                                <option value="kasir">{t('Kasir', 'Cashier')}</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#374151] mb-1 block">Status</label>
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
                          <button onClick={handleUpdateUser} className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition">
                            {t('Simpan Perubahan', 'Save Changes')}
                          </button>
                        </div>
                      </div>
                    )

                    // ── LIST ──
                    return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-[#1c2620]">{t('Manajemen pengguna', 'User management')}</h2>
                        <button onClick={openTambahUser}
                          className="inline-flex items-center gap-2 bg-[#1e3a2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#24462f] transition">
                          <UserPlus size={15} /> {t('Tambah Pengguna', 'Add User')}
                        </button>
                      </div>
                      <p className="text-sm text-[#6b7280] mb-5">{t('Atur anggota tim apotek beserta hak akses modul masing-masing.', 'Manage pharmacy team members and their module access.')}</p>
                      {users.length === 0 ? (
                        <div className="text-center py-12 text-sm text-[#9ca3af]">
                          <Users size={32} className="mx-auto mb-2 text-[#c4c9c2]" />
                          {t('Belum ada pengguna. Klik "Tambah Pengguna" untuk menambah anggota tim.', 'No users yet. Click "Add User" to add a team member.')}
                        </div>
                      ) : (
                        <div className="border border-[#f0ede6] rounded-xl overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[#f5f2eb] text-[#6b7280]">
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
                                <tr key={i} className="border-t border-[#f0ede6] hover:bg-[#faf9f6]">
                                  <td className="px-4 py-3 font-medium text-[#1c2620]">{u.nama}</td>
                                  <td className="px-4 py-3 text-[#6b7280] text-xs">{u.email || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#dce5db] text-[#2f5741]">{roleLabels[u.role] || u.role}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-[#6b7280]">{Array.isArray(u.modules) && u.modules.length ? `${u.modules.length} ${t('modul','modules')}` : t('default role','default role')}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggleUserStatus(u)}
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {u.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => setEditUser({ ...u, modules: Array.isArray(u.modules) ? u.modules : [] })} title="Edit" className="p-1.5 rounded-lg text-[#1e3a2c] hover:bg-[#f5f2eb] transition"><Pencil size={14} /></button>
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

        {/* Bottom tab bar (mobile) + More sheet */}
        {(() => {
          const navAll = menuItems.filter(i => allowedPages.includes(i.id))
          const navMain = navAll.slice(0, 4)
          const superExtra = (isSuper && allowedPages.includes('companies')) ? [{ id: 'companies', label: 'Companies', en: 'Companies', icon: Building2 }] : []
          const moreList = [...navAll.slice(4), ...superExtra]
          const short = (it: any) => (lang === 'en' ? it.en : it.label).split(/[ &\/]/)[0]
          const moreActive = moreList.some(m => m.id === activePage)
          return (
            <>
              <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#e6e2d8] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                {navMain.map(item => {
                  const Icon = item.icon; const active = activePage === item.id
                  return (
                    <button key={item.id} onClick={() => setActivePage(item.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active ? 'text-[#1e3a2c]' : 'text-[#9ca3af]'}`}>
                      <span className={`flex items-center justify-center w-10 h-6 rounded-full ${active ? 'bg-[#1e3a2c]/10' : ''}`}><Icon size={19} /></span>
                      <span className="text-[10px] font-medium leading-none">{short(item)}</span>
                    </button>
                  )
                })}
                {moreList.length > 0 && (
                  <button onClick={() => setMoreOpen(true)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${moreActive || moreOpen ? 'text-[#1e3a2c]' : 'text-[#9ca3af]'}`}>
                    <span className={`flex items-center justify-center w-10 h-6 rounded-full ${moreActive || moreOpen ? 'bg-[#1e3a2c]/10' : ''}`}><LayoutGrid size={19} /></span>
                    <span className="text-[10px] font-medium leading-none">{t('Lainnya', 'More')}</span>
                  </button>
                )}
              </nav>

              {moreOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-4 sw-sheet" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
                    <div className="w-10 h-1 rounded-full bg-[#d8d2c4] mx-auto mb-3" />
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-[#1c2620]">{t('Menu Lainnya', 'More Menu')}</p>
                      <button onClick={() => setMoreOpen(false)} className="text-[#9ca3af] hover:text-[#1c2620]" aria-label="Tutup"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {moreList.map(item => {
                        const Icon = item.icon; const active = activePage === item.id
                        return (
                          <button key={item.id} onClick={() => { setActivePage(item.id); setMoreOpen(false) }}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition ${active ? 'border-[#1e3a2c] bg-[#f5f2eb] text-[#1e3a2c]' : 'border-[#eceae3] text-[#4b5563]'}`}>
                            <Icon size={20} />
                            <span className="text-[10px] font-medium text-center leading-tight px-0.5">{lang === 'en' ? item.en : item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#f0ede6] mt-4 pt-3">
                      <LangToggle />
                      <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
                        className="inline-flex items-center gap-1.5 text-sm text-red-500 font-medium"><LogOut size={15} /> {t('Keluar', 'Sign out')}</button>
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