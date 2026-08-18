-- ============================================================
-- 0036  Resep ikut membawa keadaan baru, dan isinya untuk farmasi
-- ============================================================
--
-- Dua hal yang tertinggal dari migrasi 0035.
--
-- 1. `resep_kunjungan()` menyaring `status in ('draf','final','dilayani')`.
--    Daftar itu ditulis saat keadaan resep memang cuma tiga. Sesudah 0035,
--    resep yang sedang disiapkan farmasi berstatus `disiapkan` atau `siap`,
--    jadi fungsi ini mengembalikan NULL untuknya dan layar Resep di Kunjungan
--    akan berkata "belum ada resep" pada kunjungan yang resepnya justru
--    sedang dikerjakan di belakang. Bug yang lahir dari migrasi sebelumnya,
--    bukan bug lama.
--
--    Ini pola yang pantas diingat: menambah nilai status berarti memeriksa
--    SETIAP tempat yang menyebut nilai lama satu per satu. Daftar harfiah
--    seperti ini tidak akan pernah mengeluh saat ketinggalan.
--
-- 2. Farmasi butuh isi resep berdasarkan RESEP-nya, bukan kunjungannya.
--    Layar farmasi berjalan dari antrean resep, dan satu kunjungan bisa punya
--    lebih dari satu resep sepanjang harinya.

create or replace function public.resep_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_visit record; v_resep record;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions
   where visit_id = p_visit
     and status in ('draf', 'final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;
  if not found then
    return jsonb_build_object('resep', null, 'items', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori,
        'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = v_resep.id), '[]'::jsonb));
end;
$$;

revoke all on function public.resep_kunjungan(uuid) from public, anon;
grant execute on function public.resep_kunjungan(uuid) to authenticated;

/**
 * Isi satu resep, diambil dari id resepnya.
 *
 * Stok ikut karena itu pertanyaan pertama farmasi saat membuka resep: apakah
 * obatnya ada. Kalau tidak ikut di sini, layarnya harus menembak katalog
 * sekali lagi per baris obat dan jawabannya datang belakangan, tepat saat
 * orangnya sudah memutuskan.
 */
create or replace function public.isi_resep(p_resep uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_resep record;
begin
  select * into v_resep from public.prescriptions
   where id = p_resep
     and (public.boleh_admin_platform() or company_id = public.auth_company_id());
  if not found then
    raise exception 'Resep tidak ditemukan.' using errcode = 'SH004';
  end if;

  return jsonb_build_object(
    'resep', to_jsonb(v_resep),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_id', i.product_id, 'nama_obat', i.nama_obat,
        'jumlah', i.jumlah, 'satuan', i.satuan, 'dosis', i.dosis,
        'frekuensi', i.frekuensi, 'rute', i.rute, 'aturan_pakai', i.aturan_pakai,
        'catatan', i.catatan, 'urutan', i.urutan,
        'stok', p.stok_total, 'kategori', p.kategori, 'satuan_produk', p.satuan
      ) order by i.urutan, i.nama_obat)
      from public.prescription_items i
      left join public.products p on p.id = i.product_id
      where i.prescription_id = p_resep), '[]'::jsonb));
end;
$$;

revoke all on function public.isi_resep(uuid) from public, anon;
grant execute on function public.isi_resep(uuid) to authenticated;
