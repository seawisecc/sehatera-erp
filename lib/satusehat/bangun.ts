/**
 * Pembangun payload FHIR untuk SatuSehat.
 *
 * SELURUH system, kode, dan kewajiban di berkas ini dibaca dari dokumen resmi
 * pada 25 Agustus 2026: Panduan Interoperabilitas > Modul Pelayanan > Resume
 * Medis - Rawat Jalan (disunting 2 Desember 2025), dan halaman FHIR > Encounter.
 * Tidak satu pun ditulis dari ingatan. Kalau berubah, buka dokumennya lagi.
 *
 * Fungsi di sini MURNI: masuk data yang sudah dikumpulkan pemanggil, keluar
 * objek. Tidak menyentuh database dan tidak memanggil jaringan. Itu yang
 * membuatnya bisa diuji tanpa kredensial, dan `bangun.uji.mts` memakainya.
 *
 * **Yang kurang ditolak, bukan dibiarkan kosong.** Payload yang berangkat
 * tanpa elemen wajib akan dijawab OperationOutcome berhari-hari kemudian dari
 * dalam antrean, dan yang membacanya sudah lupa kunjungan mana itu. Lebih baik
 * gagal di sini, dengan kalimat yang menyebut apa yang harus diisi.
 */

import { waktuUtc, terlaluTua } from './waktu'
import { SYS } from './config'

export class PayloadKurang extends Error {
  constructor(public kurang: string[]) {
    super(`Belum bisa dikirim ke SatuSehat: ${kurang.join('; ')}.`)
    this.name = 'PayloadKurang'
  }
}

/** Terminologi yang dipatok dokumen. Jangan diganti tanpa membuka dokumennya. */
export const KODE = {
  /** Encounter.class untuk rawat jalan. Dipatok Tabel 2 Resume Medis Rawat Jalan. */
  kelasRawatJalan: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'ambulatory',
  },
  /**
   * Encounter.participant.type.
   *
   * **Bentuknya CodeableConcept, jadi coding-nya dibungkus lagi**:
   * `type: [{ coding: [ini] }]`, bukan `type: [ini]`. Halaman FHIR > Encounter
   * memperlihatkan contoh JSON untuk `participant.type.coding`, dan dibaca
   * sepintas ia terlihat seperti isi `type` itu sendiri. Salah bungkus ini
   * dijawab `unparseable_resource` tanpa menyebut elemennya.
   */
  peranPelaksana: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
    code: 'ATND',
    display: 'attender',
  },
  /**
   * Kelas layanan pada `Encounter.location.extension`, dan ia WAJIB walau tidak
   * tertulis begitu di mana pun. Nilainya administratif (kelas reguler versus
   * eksekutif), bukan klinis, jadi `reguler` aman jadi bawaan untuk klinik
   * pratama yang tidak mengenal kelas eksekutif.
   */
  kelasLayanan: {
    system: 'http://terminology.kemkes.go.id/CodeSystem/locationServiceClass-Outpatient',
    code: 'reguler',
    display: 'Kelas Reguler',
  },
  /**
   * Encounter.hospitalization.dischargeDisposition, dan ia WAJIB bahkan untuk
   * rawat jalan. Pasien klinik pulang ke rumah, jadi `home`.
   */
  pulangKeRumah: {
    system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition',
    code: 'home',
    display: 'Home',
  },
  /** Condition.category untuk DIAGNOSIS, bukan untuk keluhan. */
  kategoriDiagnosis: {
    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
    code: 'encounter-diagnosis',
    display: 'Encounter Diagnosis',
  },
  snomed: 'http://snomed.info/sct',
} as const

/**
 * `Encounter.identifier.system` dijahit dari Organization ID faskesnya sendiri.
 *
 * Artinya nomor kunjungan tidak perlu unik sedunia, cuma unik di dalam satu
 * organisasi. Itu juga berarti system-nya BERBEDA antara sandbox dan produksi,
 * karena organization id keduanya berbeda, jadi ia tidak boleh dijadikan
 * tetapan.
 */
export const systemEncounter = (organizationId: string) =>
  `http://sys-ids.kemkes.go.id/encounter/${organizationId}`

export type StatusKunjungan = 'arrived' | 'in-progress' | 'finished' | 'cancelled'

/**
 * Rel kunjungan Sehatera dipetakan ke `Encounter.status`.
 *
 * Daftar sah di SatuSehat ada tujuh (`planned`, `arrived`, `triaged`,
 * `in-progress`, `onleave`, `finished`, `cancelled`, Lampiran Standar
 * Terminologi 3.2), dan rel kita cuma empat plus batal. Yang perlu diputuskan
 * satu: **`obat` tetap `in-progress`, bukan `finished`.**
 *
 * Pasien yang resepnya sedang disiapkan farmasi masih berada di dalam
 * kliniknya dan tagihannya belum tertutup. Menyebutnya `finished` berarti
 * SatuSehat menutup pertemuan yang di dunia nyata masih berjalan, dan waktu
 * selesainya jadi terlalu awal untuk setiap pasien yang menebus obat.
 *
 * Ditulis sebagai pemetaan LENGKAP dari nilai yang ada, bukan `else` yang
 * menampung sisa. Keadaan baru di rel kunjungan harus menabrak berkas ini dan
 * dipikirkan, bukan diam-diam jatuh ke salah satu nilai.
 */
const PETA_STATUS: Record<string, StatusKunjungan> = {
  terdaftar: 'arrived',
  diperiksa: 'in-progress',
  obat: 'in-progress',
  selesai: 'finished',
  batal: 'cancelled',
}

export function statusEncounter(statusKunjungan: string): StatusKunjungan {
  const s = PETA_STATUS[statusKunjungan]
  if (!s) throw new PayloadKurang([`keadaan kunjungan "${statusKunjungan}" belum punya padanan Encounter.status`])
  return s
}

export type RiwayatKeadaan = { status: StatusKunjungan; mulai: string; selesai?: string | null }

export type DataEncounter = {
  organizationId: string
  /** Nomor kunjungan milik klinik, dipakai apa adanya sebagai identifier.value. */
  nomorKunjungan: string
  status: StatusKunjungan
  /** Encounter.statusHistory, WAJIB. Sehatera sudah mencatatnya lewat trigger sejak migrasi 0018. */
  riwayat: RiwayatKeadaan[]
  pasienIhs: string
  pasienNama?: string | null
  /** Nomor IHS tenaga kesehatan yang melayani, dari `app_users`. */
  dokterIhs: string
  dokterNama?: string | null
  /** Nomor IHS Location untuk polinya. Didaftarkan lebih dulu sebagai prasyarat. */
  lokasiIhs: string
  lokasiNama?: string | null
  mulai: string
  selesai?: string | null
  /** Referensi ke Condition diagnosis yang sudah lebih dulu dikirim. */
  diagnosisRef?: { id: string; primer?: boolean }[]
  /**
   * Nomor Encounter di SatuSehat, HANYA untuk pembaruan (PUT).
   *
   * FHIR menuntut `id` di dalam badan pembaruan cocok dengan yang di alamatnya.
   * Kosong berarti ini kiriman baru (POST), dan menyertakan `id` pada kiriman
   * baru justru ditolak.
   */
  id?: string | null
}

export function bangunEncounter(d: DataEncounter): Record<string, unknown> {
  const kurang: string[] = []
  if (!d.organizationId) kurang.push('Organization ID faskes belum ada di kredensial SatuSehat')
  if (!d.nomorKunjungan) kurang.push('nomor kunjungan kosong')
  if (!d.pasienIhs) kurang.push('pasien belum punya nomor IHS, cocokkan dulu NIK-nya ke SatuSehat')
  if (!d.dokterIhs) kurang.push('dokter belum punya nomor IHS di Pengaturan > Perizinan Tenaga Kesehatan')
  if (!d.lokasiIhs) kurang.push('poli belum punya nomor IHS Location')
  if (!d.riwayat?.length) kurang.push('riwayat keadaan kunjungan kosong')

  const mulai = waktuUtc(d.mulai)
  if (!mulai) kurang.push('waktu mulai kunjungan tidak terbaca')
  else if (terlaluTua(mulai)) kurang.push('tanggal kunjungan lebih awal dari 3 Juni 2014, yang ditolak SatuSehat')
  if (kurang.length) throw new PayloadKurang(kurang)

  const selesai = waktuUtc(d.selesai)

  const payload: Record<string, unknown> = {
    resourceType: 'Encounter',
    ...(d.id ? { id: d.id } : {}),
    identifier: [{
      system: systemEncounter(d.organizationId),
      value: d.nomorKunjungan,
    }],
    status: d.status,
    // statusHistory WAJIB, dan bukan formalitas: Encounter tanpa riwayat tidak
    // bisa menjawab "sejak kapan pasien ini menunggu". Sehatera mencatatnya
    // lewat TRIGGER, bukan dari dalam fungsi, jadi perpindahan lewat jalur mana
    // pun ikut tertangkap.
    statusHistory: d.riwayat.map(r => ({
      status: r.status,
      period: bersih({ start: waktuUtc(r.mulai), end: waktuUtc(r.selesai) }),
    })),
    class: KODE.kelasRawatJalan,
    subject: ref('Patient', d.pasienIhs, d.pasienNama),
    participant: [{
      type: [{ coding: [KODE.peranPelaksana] }],
      individual: ref('Practitioner', d.dokterIhs, d.dokterNama),
    }],
    period: bersih({ start: mulai, end: selesai }),
    location: [{
      location: ref('Location', d.lokasiIhs, d.lokasiNama),
      period: bersih({ start: mulai, end: selesai }),
      extension: [{
        url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass',
        extension: [{ url: 'value', valueCodeableConcept: { coding: [KODE.kelasLayanan] } }],
      }],
    }],
    serviceProvider: { reference: `Organization/${d.organizationId}` },
  }

  // `hospitalization.dischargeDisposition` HANYA untuk kunjungan yang sudah
  // berakhir. Pasien yang baru datang belum pulang ke mana pun, dan contoh
  // resmi untuk Encounter berstatus `arrived` memang tidak memuatnya.
  if (d.status === 'finished') {
    payload.hospitalization = { dischargeDisposition: { coding: [KODE.pulangKeRumah] } }
  }

  if (d.diagnosisRef?.length) {
    payload.diagnosis = d.diagnosisRef.map((x, i) => ({
      condition: { reference: `Condition/${x.id}` },
      // `rank` 1 berarti diagnosis primer. Sehatera sudah memaksa tepat satu
      // primer per kunjungan sejak migrasi 0018, jadi angkanya tidak ditebak.
      rank: x.primer ? 1 : i + 2,
    }))
  }
  return payload
}

export type DataDiagnosis = {
  pasienIhs: string
  /** ID Encounter yang dikembalikan SatuSehat, bukan nomor kunjungan lokal. */
  encounterId: string
  icd10: string
  icd10Nama: string
  /**
   * Padanan SNOMED CT-nya, dan ia OPSIONAL. Ini sempat saya baca terbalik.
   *
   * Modul Resume Medis Rawat Jalan (2 Desember 2025) menulis diagnosis
   * "dilaporkan menggunakan kode ICD-10 dan padanan dari kode SNOMED-CT", dan
   * tabelnya memang mendaftar dua system di bawah satu `code.coding`. Dibaca
   * sendirian, itu berbunyi seperti keduanya wajib.
   *
   * Dokumen Lampiran Standar Terminologi v10.3 (30 Juni 2026), yang TUJUH
   * BULAN lebih baru dan merupakan sumber normatif untuk terminologi,
   * memisahkan keduanya menurut MAKNA KLINIS di bagian 10.5:
   *
   * - **ICD-10 versi 2010** dipakai "ketika melaporkan terkait diagnosis
   *   pasien saat kunjungan". Itu persis perkara kita.
   * - **SNOMED CT** dipakai untuk hal LAIN: kondisi saat meninggalkan rumah
   *   sakit, keluhan utama, temuan pemeriksaan klinis, riwayat penyakit
   *   pribadi dan keluarga, masalah gizi, keluhan makan.
   *
   * Jadi diagnosis kunjungan sah berangkat dengan ICD-10 saja, dan versi yang
   * dituntut adalah versi 2010, yaitu persis berkas e-klaim Kemenkes yang
   * sudah dimuat di migrasi 0026 sampai 0029.
   *
   * Kalau padanan SNOMED-nya suatu saat ada, ia ikut sebagai coding kedua dan
   * itu tetap benar. Yang dilarang adalah MENEBAKNYA: kode SNOMED yang salah
   * bukan data yang kurang rapi, ia diagnosis orang lain yang menempel pada
   * pasien ini. Alasan yang sama dengan kenapa 18.543 nama ICD tidak
   * diterjemahkan mesin.
   *
   * Yang mengadili kalau kedua dokumen benar-benar bertabrakan bukan bacaan
   * saya, melainkan satu POST ke sandbox.
   */
  snomed?: string | null
  snomedNama?: string | null
  /** Kapan diagnosisnya ditegakkan. */
  dicatatPada?: string | null
}

export function bangunConditionDiagnosis(d: DataDiagnosis): Record<string, unknown> {
  const kurang: string[] = []
  if (!d.pasienIhs) kurang.push('pasien belum punya nomor IHS')
  if (!d.encounterId) kurang.push('kunjungannya belum terkirim, jadi belum punya id Encounter di SatuSehat')
  if (!d.icd10) kurang.push('kode ICD-10 kosong')
  if (kurang.length) throw new PayloadKurang(kurang)

  return {
    resourceType: 'Condition',
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      }],
    },
    category: [{ coding: [KODE.kategoriDiagnosis] }],
    // SATU payload Condition = SATU diagnosis. Kunjungan dengan tiga diagnosis
    // berangkat sebagai tiga payload, dan bentuk `visit_diagnoses` yang sudah
    // satu baris per kode kebetulan sudah cocok.
    code: {
      coding: [
        { system: SYS.icd10, code: d.icd10, display: d.icd10Nama },
        // Coding kedua HANYA kalau padanannya benar-benar ada. Entri SNOMED
        // berkode kosong lebih buruk daripada tidak ada entri sama sekali:
        // ia terbaca sebagai klaim bahwa pemetaannya sudah dikerjakan.
        ...(d.snomed ? [bersih({ system: KODE.snomed, code: d.snomed, display: d.snomedNama })] : []),
      ],
      text: d.icd10Nama,
    },
    subject: { reference: `Patient/${d.pasienIhs}` },
    encounter: { reference: `Encounter/${d.encounterId}` },
    ...(waktuUtc(d.dicatatPada) ? { recordedDate: waktuUtc(d.dicatatPada) } : {}),
  }
}

const ref = (jenis: string, id: string, nama?: string | null) =>
  bersih({ reference: `${jenis}/${id}`, display: nama })

/** Membuang kunci yang nilainya kosong. FHIR menolak properti bernilai null. */
function bersih<T extends Record<string, unknown>>(o: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && v !== '') out[k] = v
  return out as T
}

/**
 * `Location.identifier.system` dijahit dari Organization ID, pola yang sama
 * dengan Encounter, jadi ia juga berbeda antara sandbox dan produksi.
 */
export const systemLocation = (organizationId: string) =>
  `http://sys-ids.kemkes.go.id/location/${organizationId}`

export type DataLocation = {
  organizationId: string
  /** Kode poli milik klinik, dipakai sebagai identifier.value. */
  kode: string
  nama: string
  /**
   * Koordinat, dan SatuSehat mewajibkannya (`*Location.position.longitude`
   * dan `*Location.position.latitude`).
   *
   * Sehatera tidak menyimpan koordinat di mana pun, jadi angkanya diketik
   * sekali saat Location dibuat. Sengaja TIDAK diberi nilai bawaan: koordinat
   * karangan menempatkan klinik di tempat yang salah pada peta nasional, dan
   * itu tidak pernah muncul sebagai galat.
   */
  latitude: number
  longitude: number
  deskripsi?: string | null
}

export function bangunLocation(d: DataLocation): Record<string, unknown> {
  const kurang: string[] = []
  if (!d.organizationId) kurang.push('Organization ID faskes belum ada di kredensial SatuSehat')
  if (!d.nama) kurang.push('nama poli kosong')
  if (!d.kode) kurang.push('kode poli kosong')
  if (!Number.isFinite(d.latitude) || !Number.isFinite(d.longitude)) {
    kurang.push('koordinat lintang dan bujur klinik belum diisi, dan SatuSehat mewajibkannya')
  }
  if (kurang.length) throw new PayloadKurang(kurang)

  return {
    resourceType: 'Location',
    identifier: [{ system: systemLocation(d.organizationId), value: d.kode }],
    status: 'active',
    name: d.nama,
    ...(d.deskripsi ? { description: d.deskripsi } : {}),
    // `instance` berarti ruangan ini, bukan kelas ruangan. Poli adalah tempat
    // tertentu di klinik tertentu.
    mode: 'instance',
    physicalType: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
        code: 'ro',
        display: 'Room',
      }],
    },
    position: { longitude: d.longitude, latitude: d.latitude },
    managingOrganization: { reference: `Organization/${d.organizationId}` },
  }
}

export type DataProcedure = {
  pasienIhs: string
  /** ID Encounter yang dikembalikan SatuSehat, bukan nomor kunjungan lokal. */
  encounterId: string
  /**
   * Nomor IHS orang yang MENGERJAKAN tindakannya.
   *
   * `Procedure.performer[i].actor` wajib, dan itu yang membuat migrasi 0025
   * menambahkan `visit_charges.dikerjakan_oleh`: sebelum itu yang tercatat cuma
   * siapa yang MENGETIK biayanya, yang di klinik sibuk hampir selalu kasir,
   * bukan yang memegang alatnya. Keputusan lama itu terbayar di sini.
   */
  pelaksanaIhs: string
  pelaksanaNama?: string | null
  icd9: string
  icd9Nama: string
  dikerjakanPada?: string | null
}

export function bangunProcedure(d: DataProcedure): Record<string, unknown> {
  const kurang: string[] = []
  if (!d.pasienIhs) kurang.push('pasien belum punya nomor IHS')
  if (!d.encounterId) kurang.push('kunjungannya belum terkirim, jadi belum punya id Encounter di SatuSehat')
  if (!d.icd9) kurang.push('tindakan ini belum punya kode ICD-9-CM di katalog Layanan')
  if (!d.pelaksanaIhs) {
    kurang.push('yang mengerjakan tindakan belum punya nomor IHS di Pengaturan > Perizinan Tenaga Kesehatan')
  }
  if (kurang.length) throw new PayloadKurang(kurang)

  return {
    resourceType: 'Procedure',
    // `completed`, bukan `in-progress`: yang dikirim adalah tindakan yang sudah
    // masuk tagihan, dan tindakan yang belum dikerjakan tidak ditagihkan.
    status: 'completed',
    code: {
      coding: [{ system: SYS.icd9cm, code: d.icd9, display: d.icd9Nama }],
      text: d.icd9Nama,
    },
    subject: { reference: `Patient/${d.pasienIhs}` },
    encounter: { reference: `Encounter/${d.encounterId}` },
    performer: [{ actor: ref('Practitioner', d.pelaksanaIhs, d.pelaksanaNama) }],
    ...(waktuUtc(d.dikerjakanPada) ? { performedDateTime: waktuUtc(d.dikerjakanPada) } : {}),
  }
}

// ── Resep ────────────────────────────────────────────────────────────────────

/**
 * Rute pemberian obat, dipetakan ke kode WHO ATC yang dipakai SatuSehat.
 *
 * Daftarnya TERTUTUP dan pendek, jadi memetakannya aman, tidak seperti KFA
 * atau SNOMED yang puluhan ribu. Kuncinya sudah dinormalkan huruf kecil.
 *
 * **Yang tidak dikenali DITOLAK, bukan dijadikan oral.** Salep mata yang
 * dilaporkan sebagai obat minum adalah kalimat yang bisa diminum orang, dan
 * itu persis alasan `RUTE_LUAR` di `lib/cetak.ts` ditulis sebagai daftar yang
 * LUAR alih-alih "yang bukan oral".
 */
const RUTE_ATC: Record<string, { code: string; display: string }> = {
  oral: { code: 'O', display: 'Oral' },
  'per oral': { code: 'O', display: 'Oral' },
  po: { code: 'O', display: 'Oral' },
  minum: { code: 'O', display: 'Oral' },
  sublingual: { code: 'SL', display: 'Sublingual/Buccal/Oromucosal' },
  bukal: { code: 'SL', display: 'Sublingual/Buccal/Oromucosal' },
  rektal: { code: 'R', display: 'Rectal' },
  rectal: { code: 'R', display: 'Rectal' },
  supositoria: { code: 'R', display: 'Rectal' },
  vaginal: { code: 'V', display: 'Vaginal' },
  nasal: { code: 'N', display: 'Nasal' },
  inhalasi: { code: 'Inhal', display: 'Inhalation' },
  hirup: { code: 'Inhal', display: 'Inhalation' },
  transdermal: { code: 'TD', display: 'Transdermal' },
  parenteral: { code: 'P', display: 'Parenteral' },
  injeksi: { code: 'P', display: 'Parenteral' },
  iv: { code: 'P', display: 'Parenteral' },
  im: { code: 'P', display: 'Parenteral' },
  sc: { code: 'P', display: 'Parenteral' },
  implant: { code: 'implant', display: 'Implant' },
  instilasi: { code: 'Instill', display: 'Instillation' },
}

export const ruteAtc = (rute: string | null | undefined) =>
  RUTE_ATC[String(rute || '').trim().toLowerCase()] || null

/**
 * Mengurai frekuensi yang ditulis dokter jadi angka yang dimengerti FHIR.
 *
 * `timing.repeat` minta ANGKA: berapa kali, per berapa, satuan apa. Sehatera
 * menyimpan frekuensi sebagai teks karena itu yang diketik dokter, dan
 * bentuknya bervariasi: "3 x sehari", "1x sehari", "tiap 8 jam".
 *
 * **Yang tidak terurai DITOLAK, bukan ditebak jadi sekali sehari.** Aturan
 * pakai yang salah adalah dosis yang salah, dan dosis yang salah pada
 * antibiotik atau obat jantung bukan kesalahan administratif.
 */
export function uraiFrekuensi(teks: string | null | undefined):
  { frequency: number; period: number; periodUnit: 'd' | 'h' } | null {
  const t = String(teks || '').trim().toLowerCase()
  if (!t) return null

  // "3 x sehari", "3x sehari", "3 kali sehari", "3x1"
  const perHari = t.match(/^(\d+)\s*(?:x|kali)\s*(?:se)?hari/)
  if (perHari) return { frequency: Number(perHari[1]), period: 1, periodUnit: 'd' }

  // "tiap 8 jam", "setiap 8 jam", "per 8 jam", "q8h"
  const perJam = t.match(/(?:tiap|setiap|per|q)\s*(\d+)\s*(?:jam|h)/)
  if (perJam) return { frequency: 1, period: Number(perJam[1]), periodUnit: 'h' }

  // "3x1" tanpa kata hari: angka pertama tetap berapa kali sehari.
  const singkat = t.match(/^(\d+)\s*x\s*\d/)
  if (singkat) return { frequency: Number(singkat[1]), period: 1, periodUnit: 'd' }

  return null
}

/**
 * Satuan katalog klinik dipetakan ke kode BENTUK SEDIAAN HL7, bukan UCUM.
 *
 * Ini yang paling banyak makan percobaan, dan pesan galatnya menyesatkan di
 * tiap langkah karena tidak pernah menyebut elemen mana yang salah:
 *
 *   `system` diisi KFA        -> "Invalid coding system: .../kfa"
 *   `system` dihapus          -> "Invalid coding system: " (kosong)
 *   `system` UCUM tanpa code  -> "Code not found: '' in system: unitsofmeasure"
 *   code `{tbl}` (anotasi UCUM sah) -> "Code not found: '{tbl}'"
 *   code `1` (unity UCUM sah)       -> "Code not found: '1'"
 *
 * Jawabannya ada di Lampiran Standar Terminologi bagian
 * `MedicationDispense.quantity`: sistemnya
 * **`http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm`**, dan
 * kodenya bentuk sediaan (TAB, CAP, ...), bukan satuan besaran sama sekali.
 *
 * **Pelajarannya: "Code not found" berarti sistemnya salah, bukan kodenya.**
 * UCUM diterima sebagai system justru karena ia sistem yang sah; yang tidak
 * pernah cocok adalah isinya, karena daftar yang dimaksud memang bukan UCUM.
 *
 * Yang tidak dikenali TIDAK dikirim satuannya sama sekali. Bentuk sediaan yang
 * salah membuat obat minum terbaca sebagai tetes mata, dan itu jenis kesalahan
 * yang tidak terlihat sebagai galat di mana pun.
 */
const SATUAN_SEDIAAN: Record<string, { code: string; display: string }> = {
  tablet: { code: 'TAB', display: 'Tablet' },
  tab: { code: 'TAB', display: 'Tablet' },
  kaplet: { code: 'TAB', display: 'Tablet' },
  kapsul: { code: 'CAP', display: 'Capsule' },
  capsule: { code: 'CAP', display: 'Capsule' },
}

export const satuanSediaan = (satuan: string | null | undefined) =>
  SATUAN_SEDIAAN[String(satuan || '').trim().toLowerCase()] || null

export const systemResep = (organizationId: string) =>
  `http://sys-ids.kemkes.go.id/prescription/${organizationId}`

export type DataResep = {
  organizationId: string
  /** Nomor resep milik klinik, dipakai apa adanya sebagai identifier.value. */
  nomorResep: string
  urutan?: number
  pasienIhs: string
  pasienNama?: string | null
  encounterId: string
  /** Dokter yang MENULIS resep. Bukan yang menyerahkan obatnya. */
  dokterIhs: string
  dokterNama?: string | null
  /** Kode KFA produk: 92 (template) atau 93 (bermerek). */
  kodeKfa: string
  /**
   * Kode obat LOKAL di katalog klinik, misalnya `OB-005`.
   *
   * `Medication.identifier` menyimpannya supaya baris di SatuSehat bisa
   * ditelusuri balik ke baris di sini. Ditolak validator kalau kosong
   * (RuleNumber 10380), kecuali untuk obat racikan.
   */
  kodeLokal?: string | null
  namaObat: string
  jumlah: number
  satuan?: string | null
  frekuensi?: string | null
  rute?: string | null
  aturanPakai?: string | null
  ditulisPada?: string | null
}

export function bangunMedicationRequest(d: DataResep): Record<string, unknown> {
  const kurang: string[] = []
  if (!d.organizationId) kurang.push('Organization ID faskes belum ada di kredensial SatuSehat')
  if (!d.pasienIhs) kurang.push('pasien belum punya nomor IHS')
  if (!d.encounterId) kurang.push('kunjungannya belum terkirim, jadi belum punya id Encounter di SatuSehat')
  if (!d.dokterIhs) kurang.push('dokter penulis resep belum punya nomor IHS di Pengaturan > Perizinan Tenaga Kesehatan')
  if (!d.kodeKfa) kurang.push('obat ini belum punya kode KFA, isi di Produk & Stok lewat Cari di kamus KFA')

  const rute = ruteAtc(d.rute)
  if (!rute) kurang.push(`rute "${d.rute || '(kosong)'}" belum dikenali, jadi tidak bisa dikirim`)

  const ulang = uraiFrekuensi(d.frekuensi)
  if (!ulang) kurang.push(`frekuensi "${d.frekuensi || '(kosong)'}" tidak bisa diurai jadi angka`)

  if (kurang.length) throw new PayloadKurang(kurang)

  // `Medication` dibawa sebagai resource CONTAINED, bukan dikirim terpisah,
  // dan `medicationReference` menunjuk ke dalam dirinya sendiri lewat "#".
  const idObat = 'obat'

  return {
    resourceType: 'MedicationRequest',
    identifier: [{ system: systemResep(d.organizationId), value: d.nomorResep }],
    // `active` berarti resep yang masih berlaku. Yang sudah diserahkan seluruhnya
    // tetap `active` sampai masa pakainya habis; `completed` dipakai saat
    // pengobatannya benar-benar selesai, bukan saat obatnya diambil.
    status: 'active',
    // `order` berarti permintaan yang membawa hak untuk bertindak, dan itulah
    // resep dokter. `proposal` dan `plan` untuk usulan yang belum mengikat.
    intent: 'order',
    contained: [{
      resourceType: 'Medication',
      id: idObat,
      // Kode obat LOKAL klinik, bukan kode KFA. Dua hal berbeda: yang ini
      // menelusuri balik ke katalog kita, yang di `code` menyebut obat apa
      // menurut kamus nasional.
      identifier: [{
        system: `http://sys-ids.kemkes.go.id/medication/${d.organizationId}`,
        use: 'official',
        value: d.kodeLokal || d.kodeKfa,
      }],
      code: { coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: d.kodeKfa, display: d.namaObat }] },
      status: 'active',
      extension: [{
        url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType',
        valueCodeableConcept: {
          coding: [{
            // **http**, bukan https, walau halaman FHIR > Medication menulis
            // `https://` di contoh JSON-nya. Yang dipakai validator adalah
            // yang di Lampiran Standar Terminologi. Dicoba keduanya: `https`
            // dijawab "Invalid coding system: https://terminology..."
            // (RuleNumber 10031), `http` diterima.
            system: 'http://terminology.kemkes.go.id/CodeSystem/medication-type',
            // Non-compound: obat jadi, bukan racikan. Sehatera belum punya
            // resep racikan, dan racikan menuntut daftar bahan yang berbeda
            // bentuknya. Ditulis sebagai nilai tetap supaya hari racikan
            // ditambahkan, tempat ini menabrak dan dipikirkan.
            code: 'NC', display: 'Non-compound',
          }],
        },
      }],
    }],
    medicationReference: { reference: `#${idObat}`, display: d.namaObat },
    subject: bersih({ reference: `Patient/${d.pasienIhs}`, display: d.pasienNama }),
    encounter: { reference: `Encounter/${d.encounterId}` },
    ...(waktuUtc(d.ditulisPada) ? { authoredOn: waktuUtc(d.ditulisPada) } : {}),
    requester: ref('Practitioner', d.dokterIhs, d.dokterNama),
    dosageInstruction: [bersih({
      sequence: d.urutan || 1,
      text: d.aturanPakai || [d.frekuensi, d.rute].filter(Boolean).join(', '),
      timing: { repeat: ulang },
      route: { coding: [{ system: 'http://www.whocc.no/atc', code: rute.code, display: rute.display }] },
    })],
    dispenseRequest: {
      // `system` pada Quantity WAJIB, dan ia berarti sistem SATUAN.
      //
      // Tiga percobaan mengajarkan ini. Mengisinya dengan KFA dijawab
      // "Invalid coding system: http://sys-ids.kemkes.go.id/kfa"; menghapus
      // `system` dijawab "Invalid coding system: " berisi kosong. Keduanya
      // RuleNumber 10348, dan pesannya tidak pernah menyebut elemen mana.
      //
      // UCUM (`http://unitsofmeasure.org`) adalah sistem satuan yang dipakai
      // dokumennya untuk `timing.repeat.periodUnit`, jadi ia yang dipakai di
      // sini juga.
      quantity: bersih({
        value: d.jumlah,
        unit: d.satuan,
        ...(satuanSediaan(d.satuan)
          ? {
              system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
              code: satuanSediaan(d.satuan)!.code,
            }
          : {}),
      }),
    },
    // Boleh diganti obat lain yang setara atau tidak. Ditulis `false` karena
    // yang menentukan penggantinya harus dokter, bukan aplikasi.
    substitution: { allowedBoolean: false },
  }
}
