-- ============================================================
-- 0052: apply_transaction lewat jalur admin platform
-- ============================================================
--
-- Sama seperti yang sudah dilakukan pada `daftar_kunjungan` di migrasi 0022
-- dan `ubah_status_kunjungan` di 0017: gerbangnya dipindah dari
-- `is_super_admin()` ke `boleh_admin_platform()`.
--
-- Alasannya bukan kenyamanan. `is_super_admin()` membaca JWT, jadi pembayaran
-- adalah SATU-SATUNYA langkah alur klinik yang tidak bisa diuji dari SQL
-- Editor: uji 0051 berhenti di "Akun ini belum terhubung ke apotek mana pun."
-- Sementara itu uang adalah bagian yang paling mahal kalau salah. Fungsi yang
-- tidak bisa diuji akan berhenti diuji.
--
-- `boleh_admin_platform()` melingkupi super admin, service_role, dan koneksi
-- langsung tanpa JWT. Untuk pengguna aplikasi biasa tidak ada yang berubah:
-- p_company mereka tetap diabaikan dan tetap jatuh ke auth_company_id().

create or replace function public.apply_transaction(
  p_items        jsonb,
  p_bayar        numeric,
  p_metode_bayar text default 'Tunai',
  p_pasien       jsonb default '{}'::jsonb,
  p_company      uuid default null,
  p_penjamin     text default 'umum',
  p_asuransi     uuid default null,
  p_ditagihkan   numeric default 0
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company   uuid := case when p_company is not null and public.boleh_admin_platform()
                           then p_company else public.auth_company_id() end;
  v_trx       uuid;
  v_item_id   uuid;
  v_total     numeric := 0;
  v_tagih     numeric := 0;
  v_pen       text;
  v_item      jsonb;
  v_pid       uuid;
  v_qty       integer;
  v_harga     numeric;
  v_stok      integer;
  v_nama      text;
  v_sisa      integer;
  v_ambil     integer;
  v_batch     record;
  v_golongan  boolean := false;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke apotek mana pun.' using errcode = 'SH004';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Keranjang kosong.' using errcode = 'SH004';
  end if;

  -- ---------- periksa dulu, tulis kemudian ----------
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := coalesce((v_item ->> 'jumlah')::integer, 0);
    v_harga := coalesce((v_item ->> 'harga_jual')::numeric, 0);
    if v_qty <= 0 then
      raise exception 'Jumlah harus lebih dari nol.' using errcode = 'SH004';
    end if;
    v_total := v_total + (v_harga * v_qty);

    if coalesce((v_item ->> 'is_jasa')::boolean, false) then
      continue;
    end if;

    v_pid := (v_item ->> 'product_id')::uuid;
    select stok_total, nama_obat,
           kategori in ('narkotika', 'psikotropika', 'prekursor')
      into v_stok, v_nama, v_golongan
      from public.products
     where id = v_pid and company_id = v_company;

    if not found then
      raise exception 'Obat tidak ditemukan di katalog apotek ini.' using errcode = 'SH004';
    end if;
    if v_stok < v_qty then
      raise exception 'Stok % tidak cukup: tersisa %, diminta %.', v_nama, v_stok, v_qty
        using errcode = 'SH005';
    end if;

    if v_golongan and (
         p_pasien is null
         or coalesce(trim(p_pasien ->> 'nama_pasien'), '') = ''
         or coalesce(trim(p_pasien ->> 'nomor_resep'), '') = ''
       ) then
      raise exception 'Obat golongan Narkotika/Psikotropika/Prekursor wajib mencatat nama pasien dan nomor resep.'
        using errcode = 'SH006';
    end if;
  end loop;

  -- ---------- pelunasan ----------
  -- Bagian yang DITAGIHKAN ke penjamin bukan uang yang masuk laci. Kalau
  -- keduanya digabung jadi satu angka `bayar`, laci kasir tidak akan pernah
  -- cocok saat tutup buku: sistem mengaku menerima uang yang sebenarnya masih
  -- jadi piutang ke BPJS.
  v_pen := lower(coalesce(nullif(trim(p_penjamin), ''), 'umum'));
  if v_pen not in ('umum', 'bpjs', 'asuransi') then
    raise exception 'Penjamin "%" tidak dikenali.', v_pen using errcode = 'SH004';
  end if;

  v_tagih := greatest(coalesce(p_ditagihkan, 0), 0);
  if v_pen = 'umum' and v_tagih > 0 then
    raise exception 'Pasien umum tidak bisa menagihkan apa pun ke penjamin.' using errcode = 'SH004';
  end if;
  if v_tagih > v_total then
    raise exception 'Yang ditagihkan ke penjamin (%) melebihi total belanja (%).', v_tagih, v_total
      using errcode = 'SH004';
  end if;

  if p_asuransi is not null then
    if v_pen <> 'asuransi' then
      raise exception 'Penerbit asuransi hanya berarti kalau penjaminnya asuransi.' using errcode = 'SH004';
    end if;
    if not exists (select 1 from public.insurers
                    where id = p_asuransi and company_id = v_company) then
      raise exception 'Asuransi itu tidak ada di daftar rekanan faskes ini.' using errcode = 'SH004';
    end if;
  end if;

  -- Yang harus ditutup tunai cuma SISANYA sesudah dikurangi tagihan penjamin.
  if coalesce(p_bayar, 0) < (v_total - v_tagih) then
    raise exception 'Pembayaran kurang dari yang harus dibayar pasien.' using errcode = 'SH004';
  end if;

  -- ---------- tulis ----------
  insert into public.transactions (
    company_id, total, bayar, kembalian, metode_bayar, status,
    nama_pasien, alamat_pasien, kontak_pasien, nomor_resep, visit_id,
    penjamin, asuransi_id, ditagihkan_penjamin, diterima_tunai)
  values (
    v_company, v_total, p_bayar, p_bayar - (v_total - v_tagih),
    coalesce(p_metode_bayar, 'Tunai'), 'selesai',
    nullif(trim(p_pasien ->> 'nama_pasien'), ''),
    nullif(trim(p_pasien ->> 'alamat_pasien'), ''),
    nullif(trim(p_pasien ->> 'kontak_pasien'), ''),
    nullif(trim(p_pasien ->> 'nomor_resep'), ''),
    nullif(p_pasien ->> 'visit_id', '')::uuid,
    v_pen, p_asuransi, v_tagih, v_total - v_tagih)
  returning id into v_trx;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := (v_item ->> 'jumlah')::integer;
    v_harga := coalesce((v_item ->> 'harga_jual')::numeric, 0);
    v_pid   := case when coalesce((v_item ->> 'is_jasa')::boolean, false)
                    then null else (v_item ->> 'product_id')::uuid end;

    insert into public.transaction_items (
      company_id, transaction_id, product_id, nama_obat, harga_jual, jumlah, subtotal)
    values (v_company, v_trx, v_pid, v_item ->> 'nama_obat', v_harga, v_qty, v_harga * v_qty)
    returning id into v_item_id;

    if v_pid is null then
      continue;
    end if;

    update public.products
       set stok_total = greatest(0, stok_total - v_qty)
     where id = v_pid and company_id = v_company;

    -- FEFO: batch yang paling dekat kadaluarsa dikeluarkan lebih dulu. Batch
    -- tanpa tanggal kadaluarsa ditaruh paling akhir supaya obat yang punya
    -- tanggal tidak keburu lewat sementara yang tak bertanggal terus terpakai.
    v_sisa := v_qty;
    for v_batch in
      select id, stok_batch from public.product_batches
       where product_id = v_pid and company_id = v_company and stok_batch > 0
       order by expired_date asc nulls last, created_at asc
      for update
    loop
      exit when v_sisa <= 0;
      v_ambil := least(v_sisa, v_batch.stok_batch);

      update public.product_batches
         set stok_batch = stok_batch - v_ambil
       where id = v_batch.id;

      insert into public.transaction_item_batches (
        company_id, transaction_id, transaction_item_id, product_id, batch_id, jumlah)
      values (v_company, v_trx, v_item_id, v_pid, v_batch.id, v_ambil);

      v_sisa := v_sisa - v_ambil;
    end loop;
  end loop;

  return (select to_jsonb(t) from public.transactions t where t.id = v_trx);
end;
$$;

revoke all on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid, text, uuid, numeric) from public, anon;
grant execute on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid, text, uuid, numeric) to authenticated;
