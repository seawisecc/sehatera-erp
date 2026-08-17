/**
 * Daftar pendek diagnosis ICD-10 yang sering dipakai di layanan primer.
 *
 * PENTING, dan tolong dibaca sebelum dipakai melayani pasien sungguhan:
 * daftar ini SARAN CEPAT supaya dokter tidak mengetik kode dari nol, BUKAN
 * rujukan resmi. Isinya saya susun dari yang lazim ditemui, bukan disalin dari
 * berkas Kemenkes atau BPJS, jadi ejaan dan cakupannya perlu dicocokkan dengan
 * daftar 144 diagnosis non-spesialistik BPJS sebelum dipakai untuk klaim.
 *
 * Yang menahan salah kode ada di database, bukan di daftar ini: kolom kodenya
 * menolak bentuk yang bukan ICD-10, dan SatuSehat akan menolak kode yang tidak
 * ada. Daftar ini cuma mempercepat yang sudah benar.
 *
 * Kode di luar daftar tetap bisa diketik bebas. Begitu daftar resminya diimpor
 * lewat menu Migrasi, tempat ini tinggal diganti sumbernya.
 */

export type SaranICD = { kode: string; nama: string }

export const SARAN_ICD10: SaranICD[] = [
  // Saluran napas
  { kode: 'J00',   nama: 'Nasofaringitis akut (pilek)' },
  { kode: 'J01.9', nama: 'Sinusitis akut' },
  { kode: 'J02.9', nama: 'Faringitis akut' },
  { kode: 'J03.9', nama: 'Tonsilitis akut' },
  { kode: 'J06.9', nama: 'Infeksi saluran napas atas akut' },
  { kode: 'J20.9', nama: 'Bronkitis akut' },
  { kode: 'J45.9', nama: 'Asma' },
  { kode: 'A15.0', nama: 'Tuberkulosis paru' },

  // Pencernaan
  { kode: 'A09',   nama: 'Diare dan gastroenteritis' },
  { kode: 'A01.0', nama: 'Demam tifoid' },
  { kode: 'K29.7', nama: 'Gastritis' },
  { kode: 'K30',   nama: 'Dispepsia' },
  { kode: 'K59.0', nama: 'Konstipasi' },
  { kode: 'R11',   nama: 'Mual dan muntah' },
  { kode: 'B82.9', nama: 'Kecacingan' },

  // Demam dan infeksi
  { kode: 'R50.9', nama: 'Demam tanpa sebab jelas' },
  { kode: 'A90',   nama: 'Demam dengue' },
  { kode: 'A91',   nama: 'Demam berdarah dengue' },
  { kode: 'B34.9', nama: 'Infeksi virus' },

  // Peredaran darah dan metabolik
  { kode: 'I10',   nama: 'Hipertensi esensial' },
  { kode: 'E11.9', nama: 'Diabetes melitus tipe 2' },
  { kode: 'E78.5', nama: 'Hiperlipidemia' },
  { kode: 'E66.9', nama: 'Obesitas' },
  { kode: 'D50.9', nama: 'Anemia defisiensi besi' },

  // Saraf dan otot
  { kode: 'R51',   nama: 'Sakit kepala' },
  { kode: 'G43.9', nama: 'Migrain' },
  { kode: 'M54.5', nama: 'Nyeri punggung bawah' },
  { kode: 'M79.1', nama: 'Mialgia' },
  { kode: 'M13.9', nama: 'Artritis' },
  { kode: 'G51.0', nama: 'Bell palsy' },

  // Kulit
  { kode: 'L23.9', nama: 'Dermatitis kontak alergi' },
  { kode: 'L30.9', nama: 'Dermatitis' },
  { kode: 'L50.9', nama: 'Urtikaria' },
  { kode: 'B35.4', nama: 'Tinea korporis' },
  { kode: 'B37.9', nama: 'Kandidiasis' },
  { kode: 'B86',   nama: 'Skabies' },
  { kode: 'L02.9', nama: 'Abses kulit' },

  // Mata, telinga, gigi
  { kode: 'H10.9', nama: 'Konjungtivitis' },
  { kode: 'H52.4', nama: 'Presbiopia' },
  { kode: 'H60.9', nama: 'Otitis eksterna' },
  { kode: 'H66.9', nama: 'Otitis media' },
  { kode: 'K02.9', nama: 'Karies gigi' },
  { kode: 'K04.7', nama: 'Abses periapikal' },

  // Saluran kemih dan kandungan
  { kode: 'N39.0', nama: 'Infeksi saluran kemih' },
  { kode: 'N76.0', nama: 'Vaginitis akut' },
  { kode: 'Z34.9', nama: 'Pengawasan kehamilan normal' },

  // Lain-lain
  { kode: 'F41.9', nama: 'Gangguan cemas' },
  { kode: 'T14.1', nama: 'Luka terbuka' },
  { kode: 'Z00.0', nama: 'Pemeriksaan kesehatan umum' },
]

export const BENTUK_ICD10 = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/

export function cariICD(q: string, batas = 8): SaranICD[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  return SARAN_ICD10
    .filter(d => d.kode.toLowerCase().startsWith(s) || d.nama.toLowerCase().includes(s))
    .slice(0, batas)
}

export const KESADARAN = [
  'Compos mentis', 'Apatis', 'Somnolen', 'Sopor', 'Coma',
]

export const STATUS_PULANG: { nilai: string; nama: string }[] = [
  { nilai: 'berobat_jalan', nama: 'Berobat jalan' },
  { nilai: 'rujuk',         nama: 'Dirujuk' },
  { nilai: 'rawat_inap',    nama: 'Rawat inap' },
  { nilai: 'meninggal',     nama: 'Meninggal' },
]
