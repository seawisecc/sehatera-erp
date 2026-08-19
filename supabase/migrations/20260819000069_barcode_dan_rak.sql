-- ============================================================
-- 0069  Barcode dan rak: menemukan obat, bukan mencetak stiker
-- ============================================================
--
-- Urutan yang benar untuk fitur ini terbalik dari yang terlihat. Yang paling
-- berguna BUKAN mencetak label sendiri, melainkan MENYIMPAN barcode yang sudah
-- tercetak di dus pabriknya, supaya kasir tinggal memindainya. Hampir semua
-- obat sudah berbarcode dari sananya; yang tidak ada selama ini adalah tempat
-- menyimpan angkanya di sini.
--
-- **Barcode WAJIB unik per faskes.** Dua produk berbarcode sama membuat
-- pemindaian ambigu, dan yang dipilih aplikasi saat ambigu adalah yang
-- kebetulan lebih dulu. Untuk obat, mengambil baris yang salah bukan kesalahan
-- administratif. Ditegakkan indeks unik parsial, bukan pemeriksaan di form:
-- impor katalog CSV menembak tabel ini langsung dalam satu insert massal, dan
-- gerbang yang cuma ada di form akan dilewati (aturan lama project ini).
--
-- `rak` untuk MENEMUKAN obatnya di ruangan. Apotek dengan 800 item punya
-- lorong dan rak bernomor, dan "A3-2" di layar menghemat berjalan bolak-balik
-- yang tidak pernah muncul sebagai angka di laporan mana pun.

alter table public.products
  add column if not exists barcode text,
  add column if not exists rak     text;

comment on column public.products.barcode is
  'Barcode yang tercetak di kemasan pabrik (EAN-13 dan sejenisnya), untuk dipindai kasir. Unik per faskes: yang ambigu akan mengambil baris yang salah.';
comment on column public.products.rak is
  'Letak fisiknya di ruangan, misalnya "A3-2". Untuk menemukan barangnya, bukan untuk laporan.';

-- Kosong TIDAK dianggap kembar: sebagian besar katalog akan lama tidak
-- berbarcode, dan indeks yang menghitung null sebagai nilai akan menolak
-- produk kedua yang barcodenya belum diisi.
create unique index if not exists uq_products_barcode
  on public.products (company_id, barcode)
  where barcode is not null and barcode <> '';

create index if not exists idx_products_rak
  on public.products (company_id, rak) where rak is not null;

-- ------------------------------------------------------------
-- Mencari produk lewat barcode
-- ------------------------------------------------------------
/**
 * Satu produk, dicari persis. Bukan pencarian teks.
 *
 * Sengaja fungsi tersendiri dan bukan `ilike` di layar kasir: pemindai
 * mengetik cepat lalu menekan Enter, dan pencarian teks yang mengembalikan
 * tiga kemiripan menuntut orangnya memilih. Yang memilih sambil terburu-buru
 * di depan antrean adalah cara paling mudah menyerahkan obat yang salah.
 *
 * Mengembalikan null kalau tidak ketemu, supaya layarnya bisa mengatakan
 * "barcode ini belum terdaftar" alih-alih diam. Barcode yang tidak dikenali
 * hampir selalu berarti produknya memang belum didaftarkan, dan itu kalimat
 * yang bisa ditindaklanjuti.
 */
create or replace function public.produk_by_barcode(
  p_barcode text,
  p_company uuid default null
)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co  uuid := case when p_company is not null and public.boleh_admin_platform()
                     then p_company else public.auth_company_id() end;
  v_row record;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_barcode), '') = '' then
    return null;
  end if;

  select id, kode, nama_obat, nama_generik, kandungan, kategori, satuan,
         harga_jual, stok_total, rak, barcode, status
    into v_row
    from public.products
   where company_id = v_co
     and barcode = trim(p_barcode)
   limit 1;

  if not found then return null; end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.produk_by_barcode(text, uuid) from public, anon;
grant execute on function public.produk_by_barcode(text, uuid) to authenticated;
