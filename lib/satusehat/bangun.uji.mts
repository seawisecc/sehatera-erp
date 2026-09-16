/**
 * Bukti pembangun payload SatuSehat, dijalankan tangan:
 *
 *   npx tsx lib/satusehat/bangun.uji.mts
 *
 * Mengikuti pola `supabase/uji/` dan `lib/barcode.uji.mts`: bukan bagian dari
 * build, tidak menyentuh jaringan maupun database, dan yang benar cuma satu
 * keluaran, "SEMUA UJI LULUS".
 *
 * Yang dibuktikan: elemen wajib ada, system dan kode terminologi persis seperti
 * dokumennya, waktu berangkat sebagai UTC+00, dan yang kurang DITOLAK alih-alih
 * dikirim setengah jadi.
 *
 * Yang TIDAK dibuktikan: bahwa SatuSehat menerimanya. Itu cuma bisa dibuktikan
 * dengan mengirimkannya sungguhan ke sandbox, dan uji ini memakai bacaan
 * dokumen yang sama dengan yang dipakai menulis kodenya.
 */

import {
  bangunEncounter, bangunConditionDiagnosis, bangunProcedure, bangunMedicationRequest,
  statusEncounter, uraiFrekuensi, ruteAtc, satuanSediaan,
  PayloadKurang, KODE, systemEncounter,
  type DataEncounter, type DataDiagnosis, type DataProcedure, type DataResep,
  bangunObservationLab, ucumLab,
} from './bangun'

let gagal = 0
const cek = (nama: string, syarat: unknown) => {
  if (!syarat) { console.log('GAGAL:', nama); gagal++ }
}
const cekTolak = (nama: string, jalan: () => unknown, kataKunci: string) => {
  try { jalan(); console.log('GAGAL: seharusnya ditolak,', nama); gagal++ }
  catch (e) {
    if (!(e instanceof PayloadKurang) || !e.message.includes(kataKunci)) {
      console.log('GAGAL: ditolak dengan alasan yang salah,', nama, '->', (e as Error).message); gagal++
    }
  }
}

// UUID karangan, BUKAN Organization ID sungguhan. Dokumen SatuSehat menyebut
// Kode Akses API (Organization ID, Client ID, Client Secret) bersifat RAHASIA
// dan dilarang dipublikasikan, dan repo ini publik. Uji ini cuma memeriksa
// BENTUK payload, jadi nilai apa pun yang berbentuk UUID sama sahnya.
const ORG = '00000000-1111-2222-3333-444444444444'

// Kunjungan sore di Denpasar (WITA, UTC+8). Sengaja sore, supaya kalau zona
// waktunya salah, tanggalnya ikut bergeser dan ujinya kelihatan gagal.
const enc: DataEncounter = {
  organizationId: ORG,
  nomorKunjungan: 'KJ-2026-000123',
  status: 'in-progress',
  riwayat: [
    { status: 'arrived', mulai: '2026-08-25T17:05:00+08:00', selesai: '2026-08-25T17:35:00+08:00' },
    { status: 'in-progress', mulai: '2026-08-25T17:35:00+08:00' },
  ],
  pasienIhs: 'P02478375538',
  pasienNama: 'Ardianto Putra',
  dokterIhs: 'N10000001',
  dokterNama: 'dr. I Made Suardana',
  lokasiIhs: 'L10000009',
  lokasiNama: 'Poli Umum',
  mulai: '2026-08-25T17:05:00+08:00',
  diagnosisRef: [{ id: 'cond-1', primer: true }, { id: 'cond-2' }],
}

const p = bangunEncounter(enc) as any

cek('resourceType Encounter', p.resourceType === 'Encounter')
cek('identifier.system dijahit dari organization id',
  p.identifier[0].system === `http://sys-ids.kemkes.go.id/encounter/${ORG}`)
cek('identifier.system lewat helper sama', p.identifier[0].system === systemEncounter(ORG))
cek('identifier.value nomor kunjungan', p.identifier[0].value === 'KJ-2026-000123')

// 17.05 WITA = 09.05 UTC, dan tanggalnya TIDAK bergeser.
cek('period.start jadi UTC+00', p.period.start === '2026-08-25T09:05:00+00:00')
cek('period tanpa end saat belum selesai', p.period.end === undefined)
cek('statusHistory ikut UTC', p.statusHistory[0].period.start === '2026-08-25T09:05:00+00:00')
cek('statusHistory yang masih berjalan tanpa end', p.statusHistory[1].period.end === undefined)
cek('statusHistory dua baris', p.statusHistory.length === 2)

cek('class AMB ambulatory', p.class.code === 'AMB' && p.class.display === 'ambulatory')
cek('class system v3-ActCode', p.class.system === KODE.kelasRawatJalan.system)
cek('subject menunjuk Patient IHS', p.subject.reference === 'Patient/P02478375538')
// Bentuk CodeableConcept: type[].coding[], bukan type[] langsung. Salah bungkus
// di sini dijawab `unparseable_resource` tanpa menyebut elemennya, dan itu
// memakan waktu berjam-jam untuk ditemukan. Uji ini menahannya kembali.
cek('participant type dibungkus coding', p.participant[0].type[0].coding[0].code === 'ATND')
cek('participant type BUKAN coding telanjang', p.participant[0].type[0].code === undefined)
cek('location punya period', !!p.location[0].period?.start)
cek('location punya extension ServiceClass',
  p.location[0].extension[0].url === 'https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass')
cek('kelas layanan reguler',
  p.location[0].extension[0].extension[0].valueCodeableConcept.coding[0].code === 'reguler')
cek('participant individual Practitioner', p.participant[0].individual.reference === 'Practitioner/N10000001')
cek('location Location', p.location[0].location.reference === 'Location/L10000009')
cek('serviceProvider Organization', p.serviceProvider.reference === `Organization/${ORG}`)
// Kunjungan yang masih berjalan BELUM pulang ke mana pun.
cek('yang belum selesai tanpa hospitalization', p.hospitalization === undefined)
cek('diagnosis primer rank 1', p.diagnosis[0].rank === 1)
cek('diagnosis kedua bukan rank 1', p.diagnosis[1].rank !== 1)

const selesai = bangunEncounter({ ...enc, status: 'finished', selesai: '2026-08-25T18:10:00+08:00' }) as any
cek('yang finished punya dischargeDisposition home',
  selesai.hospitalization.dischargeDisposition.coding[0].code === 'home')
cek('yang finished punya period.end', selesai.period.end === '2026-08-25T10:10:00+00:00')

// Tidak ada properti bernilai null di mana pun: FHIR menolaknya.
const adaNull = JSON.stringify(p).includes(':null')
cek('tidak ada properti bernilai null', !adaNull)

// ── Yang kurang harus DITOLAK, bukan berangkat setengah jadi ──
cekTolak('tanpa IHS pasien', () => bangunEncounter({ ...enc, pasienIhs: '' }), 'nomor IHS')
cekTolak('tanpa IHS dokter', () => bangunEncounter({ ...enc, dokterIhs: '' }), 'Perizinan Tenaga Kesehatan')
cekTolak('tanpa IHS poli', () => bangunEncounter({ ...enc, lokasiIhs: '' }), 'poli')
cekTolak('tanpa riwayat keadaan', () => bangunEncounter({ ...enc, riwayat: [] }), 'riwayat keadaan')
cekTolak('tanggal sebelum 3 Juni 2014',
  () => bangunEncounter({ ...enc, mulai: '2013-01-01T08:00:00+08:00' }), '3 Juni 2014')

// ── Condition diagnosis ──
const diag: DataDiagnosis = {
  pasienIhs: 'P02478375538',
  encounterId: 'enc-abc',
  icd10: 'A01.0',
  icd10Nama: 'Typhoid fever',
  snomed: '4834000',
  snomedNama: 'Typhoid fever',
  dicatatPada: '2026-08-25T17:40:00+08:00',
}
const c = bangunConditionDiagnosis(diag) as any

cek('resourceType Condition', c.resourceType === 'Condition')
cek('category encounter-diagnosis', c.category[0].coding[0].code === 'encounter-diagnosis')
cek('code.coding berisi DUA sistem', c.code.coding.length === 2)
cek('coding pertama ICD-10', c.code.coding[0].system === 'http://hl7.org/fhir/sid/icd-10')
cek('coding kedua SNOMED', c.code.coding[1].system === 'http://snomed.info/sct')
cek('encounter menunjuk Encounter', c.encounter.reference === 'Encounter/enc-abc')
cek('recordedDate jadi UTC', c.recordedDate === '2026-08-25T09:40:00+00:00')

// Diagnosis kunjungan SAH berangkat dengan ICD-10 saja: Lampiran Standar
// Terminologi v10.3 bagian 10.5 memakai ICD-10 versi 2010 untuk diagnosis
// kunjungan, dan SNOMED untuk makna klinis yang lain. Yang harus dibuktikan di
// sini: tanpa SNOMED ia tetap terbangun, dan tidak meninggalkan entri coding
// kosong yang terbaca seperti pemetaan yang sudah dikerjakan.
const tanpaSnomed = bangunConditionDiagnosis({ ...diag, snomed: null }) as any
cek('tanpa SNOMED tetap terbangun', tanpaSnomed.resourceType === 'Condition')
cek('tanpa SNOMED cuma satu coding', tanpaSnomed.code.coding.length === 1)
cek('coding satu-satunya itu ICD-10', tanpaSnomed.code.coding[0].system === 'http://hl7.org/fhir/sid/icd-10')

cekTolak('tanpa kode ICD-10', () => bangunConditionDiagnosis({ ...diag, icd10: '' }), 'ICD-10')
cekTolak('tanpa id Encounter', () => bangunConditionDiagnosis({ ...diag, encounterId: '' }), 'Encounter')

// ── Pemetaan rel kunjungan Sehatera ke Encounter.status ──
cek('terdaftar jadi arrived', statusEncounter('terdaftar') === 'arrived')
cek('diperiksa jadi in-progress', statusEncounter('diperiksa') === 'in-progress')
cek('obat TETAP in-progress, bukan finished', statusEncounter('obat') === 'in-progress')
cek('selesai jadi finished', statusEncounter('selesai') === 'finished')
cek('batal jadi cancelled', statusEncounter('batal') === 'cancelled')
cekTolak('keadaan yang belum dipetakan ditolak', () => statusEncounter('rawat-inap'), 'padanan')

// ── Procedure (tindakan) ──
const tind: DataProcedure = {
  pasienIhs: 'P02478375538',
  encounterId: 'enc-abc',
  pelaksanaIhs: 'N10000001',
  pelaksanaNama: 'dr. I Made Suardana',
  icd9: '93.94',
  icd9Nama: 'Respiratory medication administered by nebulizer',
  dikerjakanPada: '2026-08-25T17:45:00+08:00',
}
const pr = bangunProcedure(tind) as any

cek('resourceType Procedure', pr.resourceType === 'Procedure')
cek('status completed', pr.status === 'completed')
cek('code ICD-9-CM', pr.code.coding[0].system === 'http://hl7.org/fhir/sid/icd-9-cm')
cek('encounter menunjuk Encounter', pr.encounter.reference === 'Encounter/enc-abc')
// `performer[].actor` wajib, dan itu seluruh alasan `visit_charges.dikerjakan_oleh`
// ditambahkan di migrasi 0025: sebelumnya yang tercatat cuma siapa yang mengetik
// biayanya, yang di klinik sibuk hampir selalu kasir.
cek('performer actor Practitioner', pr.performer[0].actor.reference === 'Practitioner/N10000001')
cek('performedDateTime jadi UTC', pr.performedDateTime === '2026-08-25T09:45:00+00:00')

cekTolak('tindakan tanpa kode ICD-9', () => bangunProcedure({ ...tind, icd9: '' }), 'ICD-9-CM')
cekTolak('tindakan tanpa pelaksana', () => bangunProcedure({ ...tind, pelaksanaIhs: '' }), 'Perizinan Tenaga Kesehatan')
cekTolak('tindakan tanpa Encounter', () => bangunProcedure({ ...tind, encounterId: '' }), 'Encounter')

// ── Penguraian frekuensi ──
// Yang tidak terurai harus null, BUKAN ditebak jadi sekali sehari: aturan pakai
// yang salah adalah dosis yang salah.
cek('3 x sehari', JSON.stringify(uraiFrekuensi('3 x sehari')) === '{"frequency":3,"period":1,"periodUnit":"d"}')
cek('1x sehari', JSON.stringify(uraiFrekuensi('1x sehari')) === '{"frequency":1,"period":1,"periodUnit":"d"}')
cek('2 kali sehari', JSON.stringify(uraiFrekuensi('2 kali sehari')) === '{"frequency":2,"period":1,"periodUnit":"d"}')
cek('tiap 8 jam', JSON.stringify(uraiFrekuensi('tiap 8 jam')) === '{"frequency":1,"period":8,"periodUnit":"h"}')
cek('3x1', JSON.stringify(uraiFrekuensi('3x1')) === '{"frequency":3,"period":1,"periodUnit":"d"}')
cek('kosong jadi null', uraiFrekuensi('') === null)
cek('kalimat aneh jadi null', uraiFrekuensi('kalau perlu saja') === null)

// ── Rute ──
cek('oral jadi O', ruteAtc('oral')?.code === 'O')
cek('Oral huruf besar tetap kena', ruteAtc('Oral')?.code === 'O')
cek('injeksi jadi P', ruteAtc('injeksi')?.code === 'P')
// Rute yang tidak dikenali TIDAK boleh jatuh ke oral. Salep mata yang
// dilaporkan sebagai obat minum adalah kalimat yang bisa diminum orang.
cek('rute asing jadi null', ruteAtc('tempel di jidat') === null)

// ── MedicationRequest ──
const resep: DataResep = {
  organizationId: ORG,
  nomorResep: 'RSP/2026/0009',
  pasienIhs: 'P02478375538',
  encounterId: 'enc-abc',
  dokterIhs: 'N10000001',
  dokterNama: 'dr. I Made Suardana',
  kodeKfa: '92000407',
  kodeLokal: 'OB-005',
  namaObat: 'Amlodipine Besilate 10 mg Tablet',
  jumlah: 30,
  satuan: 'Tablet',
  frekuensi: '1x sehari',
  rute: 'oral',
  aturanPakai: '1x sehari sesudah makan',
  ditulisPada: '2026-08-25T17:50:00+08:00',
}
const mr = bangunMedicationRequest(resep) as any

cek('resourceType MedicationRequest', mr.resourceType === 'MedicationRequest')
cek('status active', mr.status === 'active')
cek('intent order', mr.intent === 'order')
// Medication dibawa sebagai contained, dan rujukannya menunjuk ke dalam
// dirinya sendiri lewat "#". Ini bentuk yang paling mudah salah.
cek('Medication ada di contained', mr.contained[0].resourceType === 'Medication')
cek('medicationReference menunjuk ke contained', mr.medicationReference.reference === '#' + mr.contained[0].id)
cek('kode KFA di Medication.code', mr.contained[0].code.coding[0].code === '92000407')
// Dua penanda berbeda: identifier menelusuri balik ke katalog klinik, code
// menyebut obat apa menurut kamus nasional.
cek('Medication.identifier kode lokal', mr.contained[0].identifier[0].value === 'OB-005')
cek('identifier.system per organisasi',
  mr.contained[0].identifier[0].system === `http://sys-ids.kemkes.go.id/medication/${ORG}`)
// Sistemnya bentuk sediaan HL7, BUKAN UCUM. UCUM diterima sebagai system tapi
// tidak satu pun kodenya cocok, karena daftar yang dimaksud memang bukan UCUM.
cek('quantity system orderableDrugForm',
  mr.dispenseRequest.quantity.system === 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm')
cek('tablet jadi TAB', mr.dispenseRequest.quantity.code === 'TAB')
cek('nama satuan tetap terbawa', mr.dispenseRequest.quantity.unit === 'Tablet')
cek('kapsul jadi CAP', satuanSediaan('Kapsul')?.code === 'CAP')
// Yang tidak dikenali tidak dikirim kodenya sama sekali: bentuk sediaan yang
// salah membuat obat minum terbaca sebagai tetes mata.
cek('satuan asing tanpa kode', satuanSediaan('bungkus daun pisang') === null)
cek('medication-type system http', mr.contained[0].extension[0].valueCodeableConcept.coding[0].system === 'http://terminology.kemkes.go.id/CodeSystem/medication-type')
cek('medicationType NC', mr.contained[0].extension[0].valueCodeableConcept.coding[0].code === 'NC')
cek('requester dokter', mr.requester.reference === 'Practitioner/N10000001')
cek('timing.repeat berupa angka', mr.dosageInstruction[0].timing.repeat.frequency === 1)
cek('route ATC oral', mr.dosageInstruction[0].route.coding[0].code === 'O')
cek('jumlah masuk dispenseRequest', mr.dispenseRequest.quantity.value === 30)
cek('substitution tidak boleh diganti', mr.substitution.allowedBoolean === false)
cek('authoredOn jadi UTC', mr.authoredOn === '2026-08-25T09:50:00+00:00')

cekTolak('tanpa kode KFA', () => bangunMedicationRequest({ ...resep, kodeKfa: '' }), 'kode KFA')
cekTolak('rute tidak dikenali', () => bangunMedicationRequest({ ...resep, rute: 'tempel di jidat' }), 'rute')
cekTolak('frekuensi tidak terurai', () => bangunMedicationRequest({ ...resep, frekuensi: 'kalau perlu' }), 'frekuensi')
cekTolak('tanpa dokter', () => bangunMedicationRequest({ ...resep, dokterIhs: '' }), 'Perizinan Tenaga Kesehatan')

// ── Observation: hasil laboratorium ─────────────────────────────────────────
//
// Bentuknya satu Observation per PARAMETER, bukan per permintaan, karena
// `lab_results` memang sudah satu baris per parameter berkode LOINC sejak
// migrasi 0061.

const lab = {
  pasienIhs: 'P02478375538',
  encounterId: 'enc-1234',
  pelaksanaIhs: 'N10000001',
  pelaksanaNama: 'Ni Luh Analis',
  kodeLoinc: '718-7',
  nama: 'Hemoglobin',
  nilaiAngka: 11.2,
  satuan: 'g/dL',
  penanda: 'rendah',
  rujukanBawah: 12,
  rujukanAtas: 16,
  selesaiPada: '2026-08-25T16:50:00+08:00',
}

const ob = bangunObservationLab(lab) as any
cek('resourceType Observation', ob.resourceType === 'Observation')
cek('status final', ob.status === 'final')
cek('category laboratory', ob.category[0].coding[0].code === 'laboratory')
cek('code memakai LOINC', ob.code.coding[0].system === 'http://loinc.org')
cek('kode LOINC terbawa', ob.code.coding[0].code === '718-7')
cek('subject pasien', ob.subject.reference === 'Patient/P02478375538')
cek('encounter menunjuk kunjungan', ob.encounter.reference === 'Encounter/enc-1234')
// WITA dikurangi delapan jam. Klinik contoh project ini di Denpasar, jadi
// selisihnya cukup besar untuk memindahkan tanggal.
cek('effectiveDateTime jadi UTC', ob.effectiveDateTime === '2026-08-25T08:50:00+00:00')
cek('issued ikut terisi', ob.issued === '2026-08-25T08:50:00+00:00')
cek('performer analis', ob.performer[0].reference === 'Practitioner/N10000001')
// Keduanya WAJIB menurut validator walau dokumennya menyebutnya opsional.
cek('issued selalu ada', typeof ob.issued === 'string' && ob.issued.endsWith('+00:00'))
cek('performer selalu ada', Array.isArray(ob.performer) && ob.performer.length === 1)

// valueQuantity menuntut system DAN code. Yang cuma membawa `unit` ditolak
// dengan `Invalid coding system: ` (10012).
cek('valueQuantity bersystem UCUM', ob.valueQuantity.system === 'http://unitsofmeasure.org')
cek('kode UCUM g/dL', ob.valueQuantity.code === 'g/dL')
cek('referenceRange low bersystem', ob.referenceRange[0].low.system === 'http://unitsofmeasure.org')
cek('referenceRange high berkode', ob.referenceRange[0].high.code === 'g/dL')

// Huruf mikro ditulis bermacam-macam di lapangan; ketiganya satu satuan.
cek('mikro dinormalkan', ucumLab('10^3/\u00b5L') === '10*3/uL')
cek('mm/jam jadi mm/h', ucumLab('mm/jam') === 'mm/h')
cek('satuan asing tidak dipetakan', ucumLab('butir per sendok') === null)

// Satuan tanpa kode UCUM TIDAK dikirim sebagai angka: menebak kodenya berarti
// melaporkan angka dalam satuan yang salah.
const satuanAsing = bangunObservationLab({ ...lab, satuan: 'butir per sendok' }) as any
cek('satuan asing jadi teks, bukan angka', satuanAsing.valueQuantity === undefined)
cek('teksnya membawa satuannya', satuanAsing.valueString === '11.2 butir per sendok')
cek('tanpa UCUM tidak ada referenceRange', satuanAsing.referenceRange === undefined)

// Angka berangkat sebagai valueQuantity, bukan teks.
cek('nilai angka jadi valueQuantity', ob.valueQuantity.value === 11.2)
cek('satuan terbawa', ob.valueQuantity.unit === 'g/dL')
cek('tidak ada valueString saat angka', ob.valueString === undefined)

// Penanda Sehatera jadi interpretation berkode.
cek('rendah jadi L', ob.interpretation[0].coding[0].code === 'L')
cek('rentang rujukan ikut', ob.referenceRange[0].low.value === 12 && ob.referenceRange[0].high.value === 16)

// `kritis` TIDAK dilebur jadi tinggi/rendah: di Sehatera ia berarti dokternya
// dikabari sekarang, dan itu perbedaan yang harus ikut terkirim.
const kritis = bangunObservationLab({ ...lab, penanda: 'kritis' }) as any
cek('kritis jadi AA, bukan H/L', kritis.interpretation[0].coding[0].code === 'AA')

// Hasil yang bukan angka: "positif", "kuning keruh". Memaksanya jadi angka
// berarti mengarang, dan `nilai_angka` memang dipisah di database untuk ini.
const teks = bangunObservationLab({
  ...lab, kodeLoinc: '5802-4', nama: 'Nitrit urine',
  nilaiAngka: null, nilai: 'Positif', satuan: null, penanda: 'tinggi',
  rujukanBawah: null, rujukanAtas: null,
}) as any
cek('hasil non-angka jadi valueString', teks.valueString === 'Positif')
cek('tidak ada valueQuantity saat teks', teks.valueQuantity === undefined)
cek('tanpa rentang tidak ada referenceRange', teks.referenceRange === undefined)

// `performer` ternyata WAJIB, ditemukan dengan mengirim, bukan dengan membaca.
cekTolak('tanpa nomor IHS analis',
  () => bangunObservationLab({ ...lab, pelaksanaIhs: '' }), 'Perizinan Tenaga Kesehatan')

// Yang ditolak. Menebak kode LOINC dilarang dengan alasan yang sama seperti
// ICD dan KFA: payload-nya akan sah dan yang salah cuma isinya.
cekTolak('tanpa kode LOINC', () => bangunObservationLab({ ...lab, kodeLoinc: '' }), 'LOINC')
cekTolak('tanpa nomor IHS pasien', () => bangunObservationLab({ ...lab, pasienIhs: '' }), 'IHS')
cekTolak('kunjungan belum terkirim', () => bangunObservationLab({ ...lab, encounterId: '' }), 'Encounter')
cekTolak('belum ada hasilnya',
  () => bangunObservationLab({ ...lab, nilaiAngka: null, nilai: '   ' }), 'hasil')

console.log(gagal === 0 ? 'SEMUA UJI LULUS' : `GAGAL: ${gagal} uji`)
process.exit(gagal === 0 ? 0 : 1)
