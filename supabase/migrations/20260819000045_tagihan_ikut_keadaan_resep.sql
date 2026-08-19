-- ============================================================
-- 0045  Obat kembali muncul di kasir
-- ============================================================
--
-- Dilaporkan pemilik saat menjalankan satu pasien dari pendaftaran sampai
-- penyiapan obat: obat yang sudah diresepkan TIDAK MUNCUL di kasir.
--
-- Sebabnya `tagihan_kunjungan()` menyaring `status = 'final'`. Daftar itu
-- benar sampai migrasi 0035, yang menambahkan `disiapkan` dan `siap`. Begitu
-- farmasi menekan Mulai siapkan, resepnya berhenti cocok dan bagian `obat`
-- pulang kosong. Kasir melihat tarif dan tindakannya saja.
--
-- INI KETIGA KALINYA pola yang sama menggigit. Migrasi 0036 memperbaiki
-- `resep_kunjungan` dan `isi_resep`, migrasi 0042 memperbaiki
-- `v_antrean_hari_ini`, dan `tagihan_kunjungan` terlewat di dua-duanya.
--
-- Yang membuatnya lolos dari semua pengujian: uji 0035 menguji rel keadaan
-- resepnya, uji 0024 sudah lama lulus dengan status `final`, dan tidak ada
-- satu pun uji yang menjalankan SATU pasien dari pendaftaran sampai kasir.
-- Yang menemukannya justru orang yang memakai aplikasinya.
--
-- Akibatnya bukan tampilan: kasir memproses transaksi TANPA obatnya, pasien
-- membayar kurang, dan stok tidak berkurang. Ketahuannya nanti saat stok
-- opname, berbulan-bulan kemudian, tanpa ada yang bisa menjelaskan.
--
-- Yang berubah di bawah HANYA satu baris `where`. Sisanya disalin mekanis
-- dari migrasi 0024.

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
    'resep_id', v_resep.id,
    'biaya', v_biaya,
    'obat',  v_obat);
end;
$$;

revoke all on function public.tagihan_kunjungan(uuid) from public, anon;
grant execute on function public.tagihan_kunjungan(uuid) to authenticated;
