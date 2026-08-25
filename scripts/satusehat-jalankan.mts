/**
 * Menjalankan satu putaran antre + kirim SatuSehat dari baris perintah.
 *
 *   npx tsx scripts/satusehat-jalankan.mts [putaran]
 *
 * Memakai JALUR KODE YANG SAMA dengan tombol di layar Pengaturan: modul
 * `antre.ts` dan `pengirim.ts` yang sama, bukan salinan. Bedanya cuma
 * pemeriksaan hak: di sini tidak ada sesi pengguna, jadi kredensialnya diambil
 * langsung lewat service_role.
 *
 * Dipakai untuk menguji tanpa membuka peramban. BUKAN untuk produksi: yang
 * dipakai klinik tetap tombolnya, karena di sana hak pemanggil diperiksa.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { antrekanKunjungan } from '../lib/satusehat/antre'
import { kirimBatch, type BarisAntrean } from '../lib/satusehat/pengirim'
import { cariPasienByNik, cariPractitionerByNik, type Konteks } from '../lib/satusehat/klien'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(b => b.includes('=') && !b.startsWith('#'))
    .map(b => [b.slice(0, b.indexOf('=')), b.slice(b.indexOf('=') + 1)]))

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const putaran = Number(process.argv[2]) || 3

const { data: co } = await db.from('companies').select('id').eq('nama', 'Klinik Rexco 88').maybeSingle()
if (!co) throw new Error('Klinik contoh tidak ditemukan.')

const { data: kred, error: eKred } = await db.rpc('ambil_kredensial', {
  p_company: co.id, p_sistem: 'satusehat', p_lingkungan: 'sandbox',
})
if (eKred) throw new Error(eKred.message)

const konteks: Konteks = {
  kunci: `${co.id}:sandbox`,
  lingkungan: 'sandbox',
  kredensial: {
    clientId: kred.publik.client_id,
    clientSecret: kred.rahasia.client_secret,
    organizationId: kred.publik.organization_id,
  },
}

// ── Prasyarat: nomor IHS pasien dan tenaga kesehatan ──
// Sama seperti tombol Ambil nomor IHS, dipersempit ke yang belum pernah dicari.
for (const [tabel, kolom, cari] of [
  ['patients', 'ihs_id', cariPasienByNik],
  ['app_users', 'ihs_practitioner_id', cariPractitionerByNik],
] as const) {
  const { data: baris } = await db.from(tabel).select('id,nik').eq('company_id', co.id)
    .is(kolom, null).not('nik', 'is', null).is('ihs_dicari_pada', null).limit(25)
  let dapat = 0
  for (const b of (baris || []) as any[]) {
    await db.from(tabel).update({ ihs_dicari_pada: new Date().toISOString() }).eq('id', b.id)
    const r = await cari(konteks, b.nik)
    if (r.ok && r.data) { await db.from(tabel).update({ [kolom]: r.data.ihs }).eq('id', b.id); dapat++ }
  }
  console.log(`prasyarat ${tabel}: ${dapat} dari ${baris?.length || 0} dapat nomor IHS`)
}

for (let i = 1; i <= putaran; i++) {
  const a = await antrekanKunjungan(db, co.id, konteks.kredensial.organizationId)
  const { data: antrean } = await db.rpc('ambil_antrean_kirim', {
    p_sistem: 'satusehat', p_batas: 20, p_company: co.id,
  })
  const baris = (antrean || []) as BarisAntrean[]
  const k = baris.length ? await kirimBatch(db, konteks, baris)
                         : { terkirim: 0, gagal: 0, dilewatiSudahAda: 0, galat: [] }

  console.log(`\n── putaran ${i} ──`)
  console.log(`  antre  : ${a.diantre} baru, ${a.diulang} diulang, ${a.sudahAda} sudah ada`,
              JSON.stringify(a.tahap))
  console.log(`  kirim  : ${k.terkirim} terkirim, ${k.gagal} gagal, ${k.dilewatiSudahAda} sudah ada di sana`)
  for (const g of k.galat) console.log(`    GAGAL ${g.resource}: ${g.pesan}`)
  for (const d of a.dilewati.slice(0, 3)) console.log(`    lewat ${d.nomor}: ${d.alasan}`)
  if (!a.diantre && !a.diulang && !baris.length) { console.log('  (tidak ada lagi yang perlu dikerjakan)'); break }
}
