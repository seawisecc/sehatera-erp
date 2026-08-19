-- ============================================================
-- 0064  Nomor resep sampai ke kasir
-- ============================================================
--
-- `tagihan_kunjungan()` mengembalikan `resep_id` tapi tidak pernah nomornya,
-- jadi layar Kasir mengisi kotak "No. Resep" dengan nomor KUNJUNGAN: satu-
-- satunya nomor yang sampai ke sana.
--
-- Itu bukan salah tempat yang tidak berbahaya. Untuk obat golongan narkotika
-- dan psikotropika, nomor resep adalah catatan yang wajib benar dan ikut ke
-- laporan SIPNAP; nomor kunjungan di kolom itu tidak menunjuk resep mana pun,
-- dan yang memeriksanya nanti tidak akan menemukan apa-apa.
--
-- Resepnya sendiri SUDAH bernomor sejak migrasi 0023 lewat `next_doc_number`.
-- Yang kurang cuma jalan pulangnya ke layar.

create or replace function public.tagihan_kunjungan(p_visit uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_resep record;
  v_biaya jsonb;
  v_obat  jsonb;
begin
  select v.*, p.nama as pasien_nama, p.nomor_rm, p.alergi
    into v_visit
    from public.visits v join public.patients p on p.id = v.patient_id
   where v.id = p_visit
     and (public.boleh_admin_platform() or v.company_id = public.auth_company_id());
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  select * into v_resep from public.prescriptions
   where visit_id = p_visit
     and status in ('final', 'disiapkan', 'siap', 'dilayani')
   order by ditulis_pada desc limit 1;

  v_biaya := coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'jenis', c.jenis, 'service_id', c.service_id, 'nama', c.nama,
      'jumlah', c.jumlah, 'harga', c.harga, 'catatan', c.catatan, 'kode_icd9', c.kode_icd9)
      order by case c.jenis when 'administrasi' then 1 when 'konsultasi' then 2 else 3 end,
               c.dicatat_pada)
    from public.visit_charges c where c.visit_id = p_visit), '[]'::jsonb);

  v_obat := case when v_resep.id is null then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object(
      'product_id', i.product_id, 'nama_obat', i.nama_obat, 'jumlah', i.jumlah,
      'satuan', i.satuan, 'aturan_pakai', i.aturan_pakai,
      'stok', p.stok_total, 'harga_jual', p.harga_jual, 'kategori', p.kategori)
      order by i.urutan)
    from public.prescription_items i
    left join public.products p on p.id = i.product_id
    where i.prescription_id = v_resep.id), '[]'::jsonb) end;

  return jsonb_build_object(
    'kunjungan', jsonb_build_object(
      'id', v_visit.id, 'nomor', v_visit.nomor, 'nomor_antre', v_visit.nomor_antre,
      'status', v_visit.status, 'poli', v_visit.poli, 'penjamin', v_visit.penjamin,
      'pasien_nama', v_visit.pasien_nama, 'nomor_rm', v_visit.nomor_rm,
      'alergi', v_visit.alergi),
    -- Nomor resepnya ikut. Sampai sekarang kasir mengisi kotak "No. Resep"
    -- dengan nomor KUNJUNGAN, karena itu satu-satunya nomor yang sampai ke
    -- layarnya. Untuk obat golongan narkotika dan psikotropika kotak itu
    -- adalah catatan yang wajib benar, dan nomor kunjungan di sana bukan
    -- sekadar salah tempat: ia tidak menunjuk resep mana pun.
    'resep_id', v_resep.id,
    'resep_nomor', v_resep.nomor,
    'resep_status', v_resep.status,
    'biaya', v_biaya,
    'obat',  v_obat);
end;
$$;

revoke all on function public.tagihan_kunjungan(uuid) from public, anon;
grant execute on function public.tagihan_kunjungan(uuid) to authenticated;
