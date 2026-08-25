/**
 * Pengirim antrean: mengambil batch, mengetuk SatuSehat, melaporkan hasilnya.
 *
 * HANYA UNTUK SISI SERVER.
 *
 * Tiga hal yang membentuk berkas ini, dan ketiganya soal apa yang terjadi saat
 * ada yang MELESET, bukan saat semuanya lancar.
 *
 * **1. POST ke SatuSehat tidak idempoten, sedangkan antrean ini at-least-once.**
 * Proses yang mati di antara "SatuSehat sudah membuat Encounter" dan "baris
 * antrean sudah ditandai terkirim" akan mencoba lagi, dan percobaan kedua
 * melahirkan Encounter KEDUA untuk kunjungan yang sama. Penjaganya bukan
 * transaksi, yang memang tidak mungkin melintasi dua sistem, melainkan penanda
 * yang ditulis di sisi kita: kalau `visits.ihs_encounter_id` sudah terisi,
 * barisnya ditandai terkirim TANPA mengetuk SatuSehat lagi.
 *
 * **2. Penanda ditulis SEBELUM baris antrean ditandai terkirim.** Urutan
 * sebaliknya meninggalkan celah yang persis sama besarnya dengan yang mau
 * ditutup. Kalau ia mati di antara keduanya, yang terjadi adalah baris antrean
 * dicoba lagi lalu berhenti di penjaga nomor 1, dan itu keadaan yang benar.
 *
 * **3. Kegagalan jaringan dan kegagalan penolakan diperlakukan sama di sini,**
 * yaitu `tandai_gagal`, yang menjadwalkan ulang dengan jeda berlipat dan
 * menyerah sesudah beberapa kali. Membedakan keduanya terdengar lebih pintar,
 * tapi kredensial yang salah dan jaringan yang putus sama-sama sembuh dengan
 * orang yang membaca layar antrean, dan keduanya sudah membawa kalimatnya
 * masing-masing di `galat_terakhir`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { panggil, type Konteks } from './klien'

/**
 * Satu kolom `resource` menampung dua jenis kiriman, dan bedanya ada di garis
 * miring: `Encounter` berarti kiriman baru (POST), `Encounter/<id>` berarti
 * pembaruan (PUT) atas nomor itu.
 *
 * Ditulis sebagai kesepakatan di SATU tempat, bukan disebar sebagai
 * pemeriksaan `includes('/')` di beberapa berkas. Yang disebar akan berbeda
 * pada hari salah satunya diperbaiki.
 */
export const caraKirim = (resource: string): 'POST' | 'PUT' =>
  resource.includes('/') ? 'PUT' : 'POST'

export type BarisAntrean = {
  id: string
  company_id: string
  resource: string
  entity: string | null
  entity_id: string | null
  payload: Record<string, unknown>
  percobaan: number
}

export type HasilKirim = {
  terkirim: number
  gagal: number
  dilewatiSudahAda: number
  galat: { resource: string; pesan: string }[]
}

export async function kirimBatch(
  db: SupabaseClient,
  k: Konteks,
  baris: BarisAntrean[],
): Promise<HasilKirim> {
  const hasil: HasilKirim = { terkirim: 0, gagal: 0, dilewatiSudahAda: 0, galat: [] }

  for (const b of baris) {
    // ── Penjaga kembar ──
    if (b.resource === 'Encounter' && caraKirim(b.resource) === 'POST'
        && b.entity === 'visits' && b.entity_id) {
      const { data: v } = await db
        .from('visits').select('ihs_encounter_id').eq('id', b.entity_id).maybeSingle()
      if (v?.ihs_encounter_id) {
        await db.rpc('tandai_terkirim', { p_id: b.id, p_id_luar: v.ihs_encounter_id, p_jawaban: null })
        hasil.dilewatiSudahAda += 1
        continue
      }
    }

    const jawab = await panggil<{ id?: string }>(k, b.resource, {
      method: caraKirim(b.resource),
      body: JSON.stringify(b.payload),
    })

    if (!jawab.ok) {
      await db.rpc('tandai_gagal', { p_id: b.id, p_galat: jawab.pesan })
      hasil.gagal += 1
      if (hasil.galat.length < 5) hasil.galat.push({ resource: b.resource, pesan: jawab.pesan })
      continue
    }

    const idLuar = jawab.data?.id || null

    // Penanda dulu, baru laporan. Lihat alasan nomor 2 di kepala berkas.
    //
    // TIGA jenis tulis-balik, dan masing-masing menandai kejadian yang berbeda:
    // Encounter lahir, Condition lahir, dan Encounter selesai diperbarui. Satu
    // penanda untuk beberapa kejadian adalah cara kehilangan salah satunya.
    const tulisBalik: { tabel: string; isi: Record<string, unknown> } | null =
      !b.entity_id ? null
      : b.entity === 'visits' && caraKirim(b.resource) === 'PUT'
        ? { tabel: 'visits', isi: { ihs_final_pada: new Date().toISOString() } }
      : b.entity === 'visits' && idLuar
        ? { tabel: 'visits', isi: { ihs_encounter_id: idLuar } }
      : b.entity === 'visit_diagnoses' && idLuar
        ? { tabel: 'visit_diagnoses', isi: { ihs_condition_id: idLuar } }
      : b.entity === 'visit_charges' && idLuar
        ? { tabel: 'visit_charges', isi: { ihs_procedure_id: idLuar } }
      : b.entity === 'prescription_items' && idLuar
        ? { tabel: 'prescription_items', isi: { ihs_medicationrequest_id: idLuar } }
      : null

    if (tulisBalik) {
      const { error } = await db
        .from(tulisBalik.tabel).update(tulisBalik.isi).eq('id', b.entity_id)
      if (error) {
        // Encounter SUDAH ada di SatuSehat tapi penandanya gagal ditulis. Baris
        // antrean sengaja TIDAK ditandai terkirim: ia akan dicoba lagi, dan
        // percobaan berikutnya menulis penandanya. Yang tidak boleh terjadi
        // adalah kehilangan nomor itu diam-diam.
        await db.rpc('tandai_gagal', {
          p_id: b.id,
          p_galat: `Terkirim ke SatuSehat sebagai ${idLuar || '(pembaruan)'}, tapi penandanya gagal disimpan: ${error.message}`,
        })
        hasil.gagal += 1
        continue
      }
    }

    await db.rpc('tandai_terkirim', {
      p_id: b.id, p_id_luar: idLuar, p_jawaban: jawab.data as Record<string, unknown>,
    })
    hasil.terkirim += 1
  }

  return hasil
}
