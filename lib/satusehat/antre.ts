/**
 * Mengubah kunjungan Sehatera jadi payload FHIR, lalu mengantrekannya.
 *
 * HANYA UNTUK SISI SERVER: ia memakai client `service_role`.
 *
 * **Kunjungan berangkat dalam TIGA kiriman, bukan satu, dan itu bukan pilihan.**
 * SatuSehat menolak Encounter tanpa `Encounter.diagnosis` (RuleNumber 10457),
 * sedangkan `Condition.encounter` wajib menunjuk balik ke Encounter. Salah satu
 * harus lahir lebih dulu, dan tidak bisa dua-duanya. Lingkaran itu dipecahkan
 * dengan mengikuti kunjungannya, persis seperti yang terjadi di klinik:
 *
 *   1. Pasien didaftarkan  -> POST Encounter, status `arrived`, tanpa diagnosis
 *   2. Diagnosis ditegakkan -> POST Condition, menunjuk Encounter tadi
 *   3. Kunjungan ditutup    -> PUT Encounter, `finished` beserta diagnosisnya
 *
 * Ini ditemukan dengan MENGIRIM, bukan dengan membaca. Rancangan sebelumnya
 * mengirim satu Encounter jadi di ujung, dan ditolak validator Kemenkes.
 *
 * Ketiga tahap dipindai dalam satu tekan, jadi kunjungan lama yang sudah
 * terlanjur ditutup tetap terkejar: tahap 1 melahirkan Encounter-nya, tahap 2
 * dan 3 menyusul pada tekan berikutnya, sesudah nomor dari tahap sebelumnya
 * pulang.
 *
 * **Yang diantrekan adalah NIATNYA, bukan pengirimannya.** Kalau HTTP-nya
 * dipanggil pada detik kunjungan ditutup, kasir yang menekan Proses ikut
 * menunggu jaringan Kemenkes, dan kalau gagal, kunjungan itu tidak pernah
 * terkirim tanpa ada yang tahu.
 *
 * **Payload disimpan sebagai CUPLIKAN**, bukan dibangun ulang saat kirim.
 * Kalau dibangun ulang, perbaikan kode bulan depan diam-diam mengubah isi
 * kiriman yang sudah antre minggu lalu.
 *
 * **Kunci idempoten dibuat DI SINI, bukan oleh database**, dan berbeda per
 * tahap: `encounter:<visit>`, `condition:<diagnosis>`, `encounter-final:<visit>`.
 * Kunjungan yang ditutup, dibuka lagi, lalu ditutup lagi tetap satu kiriman
 * per tahap.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  bangunEncounter, bangunConditionDiagnosis, bangunProcedure, bangunMedicationRequest,
  statusEncounter, PayloadKurang,
  type DataEncounter, type RiwayatKeadaan, type StatusKunjungan,
} from './bangun'

export type Dilewati = { nomor: string; alasan: string }
export type HasilAntre = {
  diantre: number
  sudahAda: number
  /** Yang sudah menyerah lalu dibangkitkan dengan payload yang sudah dibetulkan. */
  diulang: number
  dilewati: Dilewati[]
  /** Berapa baris per tahap, supaya layarnya bisa mengatakan sedang di mana. */
  tahap: { encounter: number; condition: number; procedure: number; resep: number; final: number }
}

type BarisLog = { visit_id: string; ke: string; pada: string }

/**
 * Menyusun `Encounter.statusHistory` dari `visit_status_log`.
 *
 * Tabel itu mencatat PERPINDAHAN (`dari` -> `ke`, kapan), sedangkan FHIR minta
 * RENTANG (keadaan apa, dari kapan sampai kapan). Perubahannya: tiap
 * perpindahan menutup rentang sebelumnya dan membuka yang baru.
 *
 * **Keadaan berturut yang memetakan ke nilai FHIR yang SAMA digabung.**
 * `diperiksa` dan `obat` dua-duanya `in-progress`, dan mengirim dua rentang
 * `in-progress` yang bersambungan mengaku ada perpindahan yang di mata
 * SatuSehat tidak pernah terjadi. Yang digabung tetap benar: rentangnya
 * memanjang, bukan hilang.
 */
export function susunRiwayat(
  statusAwal: string,
  dibukaPada: string,
  log: BarisLog[],
  ditutupPada: string | null,
): RiwayatKeadaan[] {
  const urut = [...log].sort((a, b) => a.pada.localeCompare(b.pada))
  const mentah: { status: StatusKunjungan; mulai: string }[] = []

  const dorong = (s: string, pada: string) => {
    let fhir: StatusKunjungan
    try { fhir = statusEncounter(s) } catch { return }
    const akhir = mentah[mentah.length - 1]
    if (akhir && akhir.status === fhir) return // gabung, jangan bikin rentang kembar
    mentah.push({ status: fhir, mulai: pada })
  }

  dorong(statusAwal, dibukaPada)
  for (const b of urut) dorong(b.ke, b.pada)

  return mentah.map((m, i) => ({
    status: m.status,
    mulai: m.mulai,
    // Rentang terakhir ditutup oleh waktu kunjungan ditutup. Kalau kunjungannya
    // belum ditutup, ia memang belum punya akhir, dan itu bukan data yang
    // hilang.
    selesai: i + 1 < mentah.length ? mentah[i + 1].mulai : ditutupPada,
  }))
}

type Pasangan = { nama?: string; ihs?: string }

/** Data bersama yang dibutuhkan ketiga tahap. */
async function kumpulkan(db: SupabaseClient, company: string, ids: string[]) {
  const [{ data: log }, { data: orang }] = await Promise.all([
    db.from('visit_status_log').select('visit_id,ke,pada').in('visit_id', ids),
    db.from('app_users').select('email,nama,ihs_practitioner_id').eq('company_id', company),
  ])
  const perVisit = new Map<string, BarisLog[]>()
  for (const b of (log || []) as BarisLog[]) {
    const a = perVisit.get(b.visit_id) || []
    a.push(b); perVisit.set(b.visit_id, a)
  }
  const perEmail = new Map<string, Pasangan>()
  for (const u of (orang || []) as any[]) {
    perEmail.set(String(u.email).toLowerCase(), { nama: u.nama, ihs: u.ihs_practitioner_id })
  }
  return { perVisit, perEmail }
}

const PILIH_KUNJUNGAN =
  'id,nomor,status,dibuka_pada,ditutup_pada,tanggal,dokter_email,ihs_encounter_id,ihs_final_pada,' +
  'patients(nama,ihs_id),clinic_units(nama,ihs_location_id)'

/**
 * Ketiga tahap dalam satu pemindaian.
 *
 * Batasnya per tahap, bukan untuk seluruhnya: kalau satu angka dibagi bertiga,
 * tahap pertama yang kebetulan panjang akan membuat tahap ketiga tidak pernah
 * jalan, dan kunjungan yang tinggal selangkah lagi menggantung selamanya.
 */
export async function antrekanKunjungan(
  db: SupabaseClient,
  company: string,
  organizationId: string,
  batas = 50,
): Promise<HasilAntre> {
  const hasil: HasilAntre = {
    diantre: 0, sudahAda: 0, diulang: 0, dilewati: [],
    tahap: { encounter: 0, condition: 0, procedure: 0, resep: 0, final: 0 },
  }

  const antre = async (
    kunci: string, resource: string, payload: Record<string, unknown>,
    entity: string, entityId: string, nomor: string,
  ) => {
    const { data: jawab, error } = await db.rpc('antre_kirim', {
      p_sistem: 'satusehat', p_resource: resource, p_kunci: kunci,
      p_payload: payload, p_entity: entity, p_entity_id: entityId, p_company: company,
    })
    if (error) { hasil.dilewati.push({ nomor, alasan: error.message }); return false }
    if (jawab?.baru) hasil.diantre += 1
    else if (jawab?.diulang) hasil.diulang += 1
    else hasil.sudahAda += 1
    // Yang dibangkitkan ikut dihitung sebagai kemajuan tahap: ia memang akan
    // dikirim pada tekan berikutnya, sama seperti yang baru.
    return !!(jawab?.baru || jawab?.diulang)
  }

  // ── TAHAP 1: Encounter lahir ─────────────────────────────────────────────
  // Statusnya SELALU `arrived`, walau kunjungannya sudah lama ditutup.
  // Encounter dimaksudkan lahir di loket pendaftaran, dan di loket belum ada
  // diagnosis. Kunjungan lama yang sudah selesai tetap melewati pintu yang
  // sama, lalu diperbarui di tahap 3; hasil akhirnya di SatuSehat identik.
  const { data: baru, error: eBaru } = await db
    .from('visits').select(PILIH_KUNJUNGAN)
    .eq('company_id', company)
    .is('ihs_encounter_id', null)
    .neq('status', 'batal')
    .order('tanggal', { ascending: true })
    .limit(batas)
  // Galat kueri TIDAK boleh ditelan. Satu nama kolom yang salah membuat
  // `data` kosong, dan layarnya melaporkan "0 masuk antrean" yang terbaca
  // sebagai "tidak ada yang perlu dikirim". Itu bentuk kegagalan yang paling
  // menyesatkan: ia terlihat seperti pekerjaan yang sudah selesai. Persis ini
  // yang menyembunyikan salah kolom `created_at` versus `dicatat_pada`
  // sepanjang satu putaran uji.
  if (eBaru) throw new Error(`Tahap 1 gagal membaca kunjungan: ${eBaru.message}`)

  if (baru?.length) {
    const { perVisit, perEmail } = await kumpulkan(db, company, baru.map((v: any) => v.id))
    for (const v of baru as any[]) {
      const nomor = String(v.nomor || v.id)
      const dokter = perEmail.get(String(v.dokter_email || '').toLowerCase())
      const mulai = v.dibuka_pada || v.tanggal
      try {
        const payload = bangunEncounter({
          organizationId, nomorKunjungan: nomor, status: 'arrived',
          riwayat: [{ status: 'arrived', mulai }],
          pasienIhs: v.patients?.ihs_id || '', pasienNama: v.patients?.nama,
          dokterIhs: dokter?.ihs || '', dokterNama: dokter?.nama,
          lokasiIhs: v.clinic_units?.ihs_location_id || '', lokasiNama: v.clinic_units?.nama,
          mulai,
        })
        if (await antre(`encounter:${v.id}`, 'Encounter', payload, 'visits', v.id, nomor)) {
          hasil.tahap.encounter += 1
        }
        void perVisit
      } catch (e) {
        hasil.dilewati.push({
          nomor, alasan: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
        })
      }
    }
  }

  // ── TAHAP 2: Condition, sesudah Encounter-nya punya nomor ────────────────
  const { data: diagnosa, error: eDiag } = await db
    .from('visit_diagnoses')
    // `dicatat_pada`, BUKAN `created_at`: tabel ini memakai penamaan Indonesia
    // seperti tabel medis lain di sini.
    .select('id,visit_id,kode_icd10,nama,dicatat_pada,visits!inner(nomor,ihs_encounter_id,patients(ihs_id))')
    .eq('company_id', company)
    .is('ihs_condition_id', null)
    .not('visits.ihs_encounter_id', 'is', null)
    .limit(batas)
  if (eDiag) throw new Error(`Tahap 2 gagal membaca diagnosis: ${eDiag.message}`)

  for (const d of (diagnosa || []) as any[]) {
    const nomor = String(d.visits?.nomor || d.visit_id)
    try {
      const payload = bangunConditionDiagnosis({
        pasienIhs: d.visits?.patients?.ihs_id || '',
        encounterId: d.visits?.ihs_encounter_id || '',
        icd10: d.kode_icd10, icd10Nama: d.nama, dicatatPada: d.dicatat_pada,
      })
      if (await antre(`condition:${d.id}`, 'Condition', payload, 'visit_diagnoses', d.id, nomor)) {
        hasil.tahap.condition += 1
      }
    } catch (e) {
      hasil.dilewati.push({
        nomor, alasan: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
      })
    }
  }

  // ── TAHAP 2b: Procedure (tindakan) ───────────────────────────────────────
  // Sejajar dengan Condition, bukan sesudahnya: keduanya cuma butuh Encounter
  // sudah punya nomor. Yang menahan tahap 3 hanya Condition, karena
  // `Encounter.diagnosis` menunjuk ke sana; Procedure berdiri sendiri.
  //
  // Disaring ke `jenis = 'tindakan'` DAN `kode_icd9` terisi. Biaya administrasi
  // dan tarif konsultasi juga tinggal di tabel yang sama, dan mengirimnya
  // sebagai Procedure berarti melaporkan pasien menjalani prosedur bernama
  // "Biaya Administrasi".
  const { data: tindakan, error: eTindakan } = await db
    .from('visit_charges')
    .select('id,visit_id,nama,kode_icd9,dikerjakan_oleh,dicatat_pada,' +
            'visits!inner(nomor,dokter_email,ihs_encounter_id,patients(ihs_id))')
    .eq('company_id', company)
    .eq('jenis', 'tindakan')
    .is('ihs_procedure_id', null)
    .not('kode_icd9', 'is', null)
    .not('visits.ihs_encounter_id', 'is', null)
    .limit(batas)
  if (eTindakan) throw new Error(`Tahap tindakan gagal membaca biaya: ${eTindakan.message}`)

  if (tindakan?.length) {
    const { data: orang } = await db
      .from('app_users').select('email,nama,ihs_practitioner_id').eq('company_id', company)
    const perEmail = new Map<string, Pasangan>()
    for (const u of (orang || []) as any[]) {
      perEmail.set(String(u.email).toLowerCase(), { nama: u.nama, ihs: u.ihs_practitioner_id })
    }

    for (const c of tindakan as any[]) {
      const nomor = String(c.visits?.nomor || c.visit_id)
      // Yang mengerjakan, dengan dokter kunjungan sebagai cadangan. Kolom
      // `dikerjakan_oleh` memang bawaannya dokter kunjungan itu (migrasi 0025),
      // tapi baris lama bisa saja kosong.
      const pel = perEmail.get(String(c.dikerjakan_oleh || c.visits?.dokter_email || '').toLowerCase())
      try {
        const payload = bangunProcedure({
          pasienIhs: c.visits?.patients?.ihs_id || '',
          encounterId: c.visits?.ihs_encounter_id || '',
          pelaksanaIhs: pel?.ihs || '',
          pelaksanaNama: pel?.nama,
          icd9: c.kode_icd9, icd9Nama: c.nama, dikerjakanPada: c.dicatat_pada,
        })
        if (await antre(`procedure:${c.id}`, 'Procedure', payload, 'visit_charges', c.id, nomor)) {
          hasil.tahap.procedure += 1
        }
      } catch (e) {
        hasil.dilewati.push({
          nomor, alasan: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
        })
      }
    }
  }

  // ── TAHAP 2c: MedicationRequest (resep) ──────────────────────────────────
  // Sejajar dengan Condition dan Procedure: cuma butuh Encounter sudah punya
  // nomor. SATU kiriman per BARIS obat, bukan per resep: pasien yang menerima
  // tiga obat berangkat sebagai tiga MedicationRequest.
  //
  // Hanya resep yang sudah DIFINALKAN dokter. Yang masih `draf` belum tentu
  // jadi, dan yang belum tentu jadi tidak boleh tercatat di sistem nasional
  // sebagai obat yang diresepkan.
  const { data: obat, error: eObat } = await db
    .from('prescription_items')
    .select('id,urutan,nama_obat,jumlah,satuan,frekuensi,rute,aturan_pakai,kode_kfa,' +
            'products(kode,kode_kfa),' +
            'prescriptions!inner(nomor,status,dokter_email,ditulis_pada,' +
            'visits!inner(nomor,ihs_encounter_id,patients(nama,ihs_id)))')
    .eq('company_id', company)
    .is('ihs_medicationrequest_id', null)
    .not('prescriptions.visits.ihs_encounter_id', 'is', null)
    .in('prescriptions.status', ['final', 'disiapkan', 'siap', 'dilayani'])
    .limit(batas)
  if (eObat) throw new Error(`Tahap resep gagal membaca baris obat: ${eObat.message}`)

  if (obat?.length) {
    const { data: orang } = await db
      .from('app_users').select('email,nama,ihs_practitioner_id').eq('company_id', company)
    const perEmail = new Map<string, Pasangan>()
    for (const u of (orang || []) as any[]) {
      perEmail.set(String(u.email).toLowerCase(), { nama: u.nama, ihs: u.ihs_practitioner_id })
    }

    for (const it of obat as any[]) {
      const r = it.prescriptions
      const nomor = String(r?.nomor || r?.visits?.nomor || it.id)
      const dokter = perEmail.get(String(r?.dokter_email || '').toLowerCase())
      // Kode KFA baris resep MENANG atas kode produk: farmasi boleh
      // menyerahkan merek yang berbeda dari katalog, dan yang dilaporkan
      // harus yang benar-benar diserahkan.
      const kfa = it.kode_kfa || it.products?.kode_kfa || ''
      try {
        const payload = bangunMedicationRequest({
          organizationId,
          nomorResep: nomor,
          urutan: it.urutan || 1,
          pasienIhs: r?.visits?.patients?.ihs_id || '',
          pasienNama: r?.visits?.patients?.nama,
          encounterId: r?.visits?.ihs_encounter_id || '',
          dokterIhs: dokter?.ihs || '',
          dokterNama: dokter?.nama,
          kodeKfa: kfa,
          kodeLokal: it.products?.kode,
          namaObat: it.nama_obat,
          jumlah: Number(it.jumlah) || 0,
          satuan: it.satuan,
          frekuensi: it.frekuensi,
          rute: it.rute,
          aturanPakai: it.aturan_pakai,
          ditulisPada: r?.ditulis_pada,
        })
        if (await antre(`resep:${it.id}`, 'MedicationRequest', payload, 'prescription_items', it.id, nomor)) {
          hasil.tahap.resep += 1
        }
      } catch (e) {
        hasil.dilewati.push({
          nomor: `${nomor} · ${it.nama_obat}`,
          alasan: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
        })
      }
    }
  }

  // ── TAHAP 3: Encounter diperbarui jadi finished ──────────────────────────
  const { data: tutup, error: eTutup } = await db
    .from('visits').select(PILIH_KUNJUNGAN)
    .eq('company_id', company)
    .not('ihs_encounter_id', 'is', null)
    .is('ihs_final_pada', null)
    .in('status', ['selesai', 'batal'])
    .order('tanggal', { ascending: true })
    .limit(batas)
  if (eTutup) throw new Error(`Tahap 3 gagal membaca kunjungan: ${eTutup.message}`)

  if (tutup?.length) {
    const ids = tutup.map((v: any) => v.id)
    const { perVisit, perEmail } = await kumpulkan(db, company, ids)
    const { data: diagSemua, error: eSemua } = await db
      .from('visit_diagnoses').select('visit_id,tipe,ihs_condition_id').in('visit_id', ids)
    if (eSemua) throw new Error(`Tahap 3 gagal membaca diagnosis: ${eSemua.message}`)

    const perKunjungan = new Map<string, any[]>()
    for (const d of (diagSemua || []) as any[]) {
      const a = perKunjungan.get(d.visit_id) || []
      a.push(d); perKunjungan.set(d.visit_id, a)
    }

    for (const v of tutup as any[]) {
      const nomor = String(v.nomor || v.id)
      const diag = perKunjungan.get(v.id) || []
      // Menunggu SELURUH diagnosisnya punya nomor. Mengirim sebagian berarti
      // Encounter final yang kekurangan satu diagnosis, dan yang kurang di sana
      // tidak akan pernah ada yang menambahkan.
      if (!diag.length) {
        hasil.dilewati.push({ nomor, alasan: 'belum ada diagnosis, jadi Encounter belum bisa ditutup di SatuSehat' })
        continue
      }
      if (diag.some(d => !d.ihs_condition_id)) {
        hasil.dilewati.push({ nomor, alasan: 'menunggu diagnosisnya terkirim lebih dulu, tekan Kirim lalu ulangi' })
        continue
      }

      const dokter = perEmail.get(String(v.dokter_email || '').toLowerCase())
      try {
        const payload = bangunEncounter({
          id: v.ihs_encounter_id,
          organizationId, nomorKunjungan: nomor,
          status: statusEncounter(v.status),
          riwayat: susunRiwayat(v.status, v.dibuka_pada || v.tanggal, perVisit.get(v.id) || [], v.ditutup_pada),
          pasienIhs: v.patients?.ihs_id || '', pasienNama: v.patients?.nama,
          dokterIhs: dokter?.ihs || '', dokterNama: dokter?.nama,
          lokasiIhs: v.clinic_units?.ihs_location_id || '', lokasiNama: v.clinic_units?.nama,
          mulai: v.dibuka_pada || v.tanggal, selesai: v.ditutup_pada,
          diagnosisRef: diag.map(d => ({ id: d.ihs_condition_id, primer: d.tipe === 'primer' })),
        })
        if (await antre(`encounter-final:${v.id}`, `Encounter/${v.ihs_encounter_id}`,
                        payload, 'visits', v.id, nomor)) {
          hasil.tahap.final += 1
        }
      } catch (e) {
        hasil.dilewati.push({
          nomor, alasan: e instanceof PayloadKurang ? e.kurang.join('; ') : (e as Error).message,
        })
      }
    }
  }

  return hasil
}
