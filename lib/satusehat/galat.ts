/**
 * Galat SatuSehat berbentuk FHIR, bukan JSON galat biasa.
 *
 * Yang dikembalikan saat 4xx adalah resource `OperationOutcome`, dan kalimat
 * yang berguna terkubur di `issue[].details.text`. Kalau seluruh badan jawaban
 * ditempel apa adanya ke `galat_terakhir`, kolom itu berisi JSON sepanjang dua
 * ribu karakter dan orang yang membuka layar antrean tidak menemukan apa pun
 * yang bisa ditindaklanjuti.
 *
 * 5xx justru BUKAN JSON: dokumennya menyebut `Content-Type: text/plain` dengan
 * isi semacam "Gateway Timeout". Membaca jawaban sebagai JSON tanpa syarat
 * akan melempar SyntaxError, dan yang tercatat jadi galat parser, bukan galat
 * jaringan Kemenkes.
 */

export type Keluaran<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; pesan: string; status: number; mentah?: unknown }

type Issue = { severity?: string; code?: string; details?: { text?: string } }

/** Kalimat yang layak ditaruh di `galat_terakhir` dan ditunjukkan ke orang. */
export function pesanOperationOutcome(badan: unknown, status: number): string {
  const oo = badan as { resourceType?: string; issue?: Issue[] } | null
  if (oo && oo.resourceType === 'OperationOutcome' && Array.isArray(oo.issue)) {
    const teks = oo.issue
      .map(i => i?.details?.text || i?.code || i?.severity)
      .filter(Boolean)
      .join('; ')
    if (teks) return `${status}: ${teks}`
  }
  if (typeof badan === 'string' && badan.trim()) return `${status}: ${badan.trim().slice(0, 300)}`
  return `${status}: tanpa keterangan dari SatuSehat`
}

/**
 * Membaca badan jawaban tanpa mengandaikan ia JSON.
 *
 * Mengembalikan objek kalau memang JSON, dan teks apa adanya kalau bukan.
 * Kedua bentuk itu sama-sama sah menurut dokumennya.
 */
export async function bacaBadan(r: Response): Promise<unknown> {
  const teks = await r.text()
  if (!teks) return null
  try {
    return JSON.parse(teks)
  } catch {
    return teks
  }
}
