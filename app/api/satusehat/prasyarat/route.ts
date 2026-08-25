/**
 * Mengambil nomor IHS untuk prasyarat: pasien, tenaga kesehatan, dan poli.
 *
 * Dokumen SatuSehat menyebut urutannya jelas: prasyarat dulu (Organization,
 * Location, Practitioner, Patient), baru resource klinis. Endpoint ini
 * mengerjakan seluruh prasyarat yang bisa dikerjakan mesin, dalam satu tekan.
 *
 * **Tiga jenis pekerjaan yang terlihat mirip padahal berbeda sifatnya**, dan
 * membedakannya menghemat banyak kebingungan:
 *
 * - **Pasien dan tenaga kesehatan DICARI, tidak didaftarkan.** Keduanya sudah
 *   ada di ekosistem nasional (pasien lewat Dukcapil, dokter lewat STR), dan
 *   Practitioner bahkan tidak punya jalur penambahan data sama sekali. Membuat
 *   yang baru untuk orang yang sudah ada di sana melahirkan dua nomor untuk
 *   satu manusia.
 * - **Poli DIBUAT.** Ruangan di dalam klinik ini tidak ada di daftar nasional
 *   mana pun sampai kita mengirimkannya.
 *
 * **Yang sudah punya nomor tidak disentuh lagi.** Itu yang membuat tombolnya
 * aman ditekan berkali-kali, dan itu juga yang menahan pemakaian kuota
 * panggilan untuk menanyakan hal yang jawabannya sudah disimpan.
 *
 * Batasnya kecil dan sengaja. Tiap baris adalah satu panggilan HTTP ke
 * Kemenkes, dan satu permintaan peramban punya batas waktu.
 */

import { NextResponse } from 'next/server'
import { siapkanSatuSehat, gagal } from '@/lib/server/satusehat-konteks'
import { cariPasienByNik, cariPractitionerByNik, buatLocation } from '@/lib/satusehat/klien'
import { bangunLocation, PayloadKurang } from '@/lib/satusehat/bangun'

const BATAS = 25

/**
 * Yang sudah pernah dicari dan tidak ketemu tidak dicari lagi selama sebulan.
 *
 * Pasien yang NIK-nya belum terdaftar di MPI akan menjawab "tidak ditemukan"
 * hari ini, besok, dan minggu depan, sementara ia terus menempati batch dan
 * menghabiskan panggilan yang jatahnya terbatas. Tanpa jeda ini, satu klinik
 * dengan tiga puluh pasien tak dikenal tidak akan pernah sampai ke pasien
 * ketiga puluh satu yang baru didaftarkan.
 *
 * Sebulan, bukan selamanya: jawaban "tidak ada" bisa berubah. Bayi yang baru
 * punya NIK, atau NIK yang baru dibetulkan salah ketiknya, harus punya
 * kesempatan kedua tanpa siapa pun mengingat untuk memintanya.
 */
const JEDA_CARI_ULANG_HARI = 30

type Catatan = { apa: string; nama: string; hasil: string }

export async function POST(req: Request) {
  const siap = await siapkanSatuSehat(req)
  if (siap instanceof NextResponse) return siap

  const { admin, company, konteks, organizationId, badan } = siap
  const lat = Number(badan.latitude)
  const long = Number(badan.longitude)

  const catatan: Catatan[] = []
  let berhasil = 0, tidakKetemu = 0, galat = 0

  // ── 1. Pasien ────────────────────────────────────────────────────────────
  const batasCari = new Date(Date.now() - JEDA_CARI_ULANG_HARI * 86400_000).toISOString()

  const { data: pasien, count: sisaPasien } = await admin
    .from('patients')
    .select('id,nama,nik', { count: 'exact' })
    .eq('company_id', company)
    .is('ihs_id', null)
    .not('nik', 'is', null)
    .or(`ihs_dicari_pada.is.null,ihs_dicari_pada.lt.${batasCari}`)
    // URUTANNYA WAJIB, dan ini bukan kerapian.
    //
    // Tanpa `order`, PostgreSQL boleh mengembalikan baris mana saja dan boleh
    // berbeda antar permintaan. Dengan batas 25 dan 31 baris yang butuh nomor,
    // artinya enam baris yang sama bisa TIDAK PERNAH terpilih walau tombolnya
    // ditekan berkali-kali. Ini bug yang sama bentuknya dengan `limit 1` tanpa
    // `order by` di `auth_company_id()` yang dibetulkan migrasi 0062.
    //
    // Arahnya TERBARU DULU, dan itu disengaja. Yang gagal dicari akan gagal
    // lagi besok (NIK-nya memang belum ada di sana), jadi kalau yang terlama
    // didahulukan, baris yang tidak akan pernah berhasil menempati seluruh
    // batch selamanya dan pasien yang baru didaftarkan tidak pernah kebagian.
    // Yang baru ditambahkan justru yang paling sering sedang ditunggu orangnya.
    .order('created_at', { ascending: false })
    .limit(BATAS)

  for (const p of (pasien || []) as any[]) {
    // Ditandai SEBELUM dicari, bukan sesudah. Pencarian yang mati di tengah
    // tidak sempat melapor, dan baris yang selalu membunuh pemanggilnya akan
    // dicoba selamanya kalau penandanya menunggu laporan. Alasan yang sama
    // dengan kenapa `percobaan` di antrean kirim dinaikkan saat DIAMBIL.
    await admin.from('patients').update({ ihs_dicari_pada: new Date().toISOString() }).eq('id', p.id)
    const r = await cariPasienByNik(konteks, p.nik)
    if (!r.ok) {
      galat += 1; catatan.push({ apa: 'Pasien', nama: p.nama, hasil: r.pesan }); continue
    }
    if (!r.data) {
      // Di sandbox ini WAJAR: yang dikenali cuma sepuluh NIK contoh Kemenkes.
      // Di produksi ia berarti NIK-nya salah ketik atau belum ada di Dukcapil.
      tidakKetemu += 1
      catatan.push({ apa: 'Pasien', nama: p.nama, hasil: 'tidak ditemukan di SatuSehat' })
      continue
    }
    await admin.from('patients').update({ ihs_id: r.data.ihs }).eq('id', p.id)
    berhasil += 1
  }

  // ── 2. Tenaga kesehatan ──────────────────────────────────────────────────
  const { data: orang, count: sisaNakes } = await admin
    .from('app_users')
    .select('id,nama,nik,email', { count: 'exact' })
    .eq('company_id', company)
    .is('ihs_practitioner_id', null)
    .not('nik', 'is', null)
    .or(`ihs_dicari_pada.is.null,ihs_dicari_pada.lt.${batasCari}`)
    .order('created_at', { ascending: false })
    .limit(BATAS)

  for (const u of (orang || []) as any[]) {
    await admin.from('app_users').update({ ihs_dicari_pada: new Date().toISOString() }).eq('id', u.id)
    const r = await cariPractitionerByNik(konteks, u.nik)
    if (!r.ok) {
      galat += 1; catatan.push({ apa: 'Nakes', nama: u.nama || u.email, hasil: r.pesan }); continue
    }
    if (!r.data) {
      tidakKetemu += 1
      catatan.push({ apa: 'Nakes', nama: u.nama || u.email, hasil: 'tidak ditemukan di SatuSehat' })
      continue
    }
    // Menulis SATU kolom saja, dan itu memang seluruh alasan jalur ini ada di
    // server: RLS menyaring baris, bukan kolom, jadi layar yang boleh menulis
    // nomor IHS lewat jalur biasa otomatis boleh menulis `role` juga.
    await admin.from('app_users').update({ ihs_practitioner_id: r.data.ihs }).eq('id', u.id)
    berhasil += 1
  }

  // ── 3. Poli ──────────────────────────────────────────────────────────────
  const { data: poli } = await admin
    .from('clinic_units')
    .select('id,nama,kode')
    .eq('company_id', company)
    .is('ihs_location_id', null)
    .eq('aktif', true)
    .limit(BATAS)

  for (const u of (poli || []) as any[]) {
    let payload: Record<string, unknown>
    try {
      payload = bangunLocation({
        organizationId, kode: u.kode, nama: u.nama, latitude: lat, longitude: long,
      })
    } catch (e) {
      galat += 1
      catatan.push({
        apa: 'Poli', nama: u.nama,
        hasil: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
      })
      continue
    }
    const r = await buatLocation(konteks, payload)
    if (!r.ok) {
      galat += 1; catatan.push({ apa: 'Poli', nama: u.nama, hasil: r.pesan }); continue
    }
    await admin.from('clinic_units').update({ ihs_location_id: r.data }).eq('id', u.id)
    berhasil += 1
  }

  // Berapa yang MASIH menunggu sesudah batch ini. Tanpa angka ini, orang yang
  // punya lebih banyak baris daripada satu batch tidak punya cara tahu bahwa
  // menekan sekali lagi masih ada gunanya.
  const tersisa = Math.max((sisaPasien || 0) - (pasien?.length || 0), 0)
                + Math.max((sisaNakes || 0) - (orang?.length || 0), 0)

  return NextResponse.json({
    ok: true,
    berhasil, tidakKetemu, galat, tersisa,
    catatan: catatan.slice(0, 20),
    pesan: berhasil === 0 && tidakKetemu === 0 && galat === 0 && tersisa === 0
      ? 'Semua pasien, tenaga kesehatan, dan poli sudah punya nomor IHS.'
      : `${berhasil} dapat nomor IHS` +
        (tidakKetemu ? `, ${tidakKetemu} tidak ditemukan di SatuSehat dan tidak akan dicari lagi selama ${JEDA_CARI_ULANG_HARI} hari` : '') +
        (galat ? `, ${galat} gagal` : '') +
        (tersisa ? `. Masih ada ${tersisa} yang belum dicoba, tekan sekali lagi` : '') + '.',
  })
}
