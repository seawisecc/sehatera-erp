-- ============================================================
-- 0021  Farmasi klinik: apotek atau instalasi farmasi
-- ============================================================
--
-- Di klinik, bagian obatnya bisa berdiri dalam dua bentuk yang berbeda secara
-- hukum, bukan cuma berbeda nama:
--
--   APOTEK. Punya izin sendiri (SIA), apoteker penanggung jawab sendiri,
--   melayani siapa saja termasuk yang bukan pasien klinik, boleh menerima
--   resep dari luar, dan melapor SIPNAP atas namanya sendiri.
--
--   INSTALASI FARMASI. Bagian dari izin klinik, tidak punya SIA sendiri, dan
--   hanya melayani pasien klinik itu. Tidak ada penjualan bebas, tidak ada
--   resep dari luar.
--
-- Perbedaannya bukan soal istilah di layar. Instalasi farmasi yang melayani
-- pembelian bebas sedang melakukan sesuatu yang tidak boleh dilakukannya, dan
-- yang menanggungnya bukan aplikasi ini melainkan pemegang izin kliniknya.
-- Karena itu perbedaannya ditegakkan, bukan cuma ditampilkan: dalam mode
-- instalasi, penjualan yang tidak terikat ke kunjungan ditolak database.
--
-- Bawaannya dipilih supaya tidak ada yang berubah tanpa diminta: fasilitas
-- yang sektornya apotek tetap mode apotek, dan yang sudah berjalan tidak
-- terpengaruh sama sekali. Klinik yang memang menjalankan apotek sungguhan
-- tinggal menggesernya kembali di Pengaturan.

alter table public.settings
  add column if not exists mode_farmasi text not null default 'apotek';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settings_mode_farmasi_check') then
    alter table public.settings add constraint settings_mode_farmasi_check
      check (mode_farmasi in ('apotek', 'instalasi'));
  end if;
end $$;

comment on column public.settings.mode_farmasi is
  'apotek = izin sendiri, boleh melayani umum. instalasi = bagian dari izin klinik, hanya melayani pasien klinik ini.';

alter table public.transactions
  add column if not exists visit_id uuid references public.visits(id);

create index if not exists idx_trx_visit on public.transactions (visit_id);

comment on column public.transactions.visit_id is
  'Kunjungan yang melahirkan penjualan ini. Wajib pada mode instalasi, dan tetap berguna pada mode apotek untuk menyambungkan resep ke penyerahannya.';

/**
 * Menegakkan batas mode instalasi.
 *
 * Ditaruh sebagai trigger dan bukan di dalam fungsi penjualan, karena batas ini
 * harus berlaku untuk SEMUA cara sebuah penjualan bisa lahir, termasuk yang
 * belum ditulis. Penyerahan obat dari e-resep nanti masuk lewat jalur lain, dan
 * batasnya harus sudah menunggu di sana.
 */
create or replace function public.wajib_kunjungan_di_instalasi()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_sektor text;
  v_mode   text;
begin
  if new.visit_id is not null then
    return new;
  end if;

  select c.sektor, coalesce(s.mode_farmasi, 'apotek')
    into v_sektor, v_mode
    from public.companies c
    left join public.settings s on s.company_id = c.id
   where c.id = new.company_id;

  if coalesce(v_sektor, 'apotek') <> 'apotek' and v_mode = 'instalasi' then
    raise exception 'Instalasi farmasi hanya melayani pasien fasilitas ini, jadi penyerahan obat harus terikat ke satu kunjungan. Kalau bagian obat di sini memang apotek berizin sendiri, ubah dulu di Pengaturan.'
      using errcode = 'SH004';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_wajib_kunjungan on public.transactions;
create trigger trg_wajib_kunjungan
  before insert on public.transactions
  for each row execute function public.wajib_kunjungan_di_instalasi();

-- ------------------------------------------------------------
-- Penjualan membawa kunjungannya
-- ------------------------------------------------------------
-- Satu-satunya perubahan pada fungsi ini: `visit_id` dibaca dari p_pasien, yang
-- memang sudah berupa kantong keterangan pembeli. Tandatangannya tidak berubah,
-- jadi tidak ada pemanggil lama yang patah.

create or replace function public.apply_transaction(
  p_items        jsonb,
  p_bayar        numeric,
  p_metode_bayar text default 'Tunai',
  p_pasien       jsonb default '{}'::jsonb,
  p_company      uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company   uuid := case when p_company is not null and public.is_super_admin()
                           then p_company else public.auth_company_id() end;
  v_trx       uuid;
  v_item_id   uuid;
  v_total     numeric := 0;
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

  if coalesce(p_bayar, 0) < v_total then
    raise exception 'Pembayaran kurang dari total belanja.' using errcode = 'SH004';
  end if;

  -- ---------- tulis ----------
  insert into public.transactions (
    company_id, total, bayar, kembalian, metode_bayar, status,
    nama_pasien, alamat_pasien, kontak_pasien, nomor_resep, visit_id)
  values (
    v_company, v_total, p_bayar, p_bayar - v_total,
    coalesce(p_metode_bayar, 'Tunai'), 'selesai',
    nullif(trim(p_pasien ->> 'nama_pasien'), ''),
    nullif(trim(p_pasien ->> 'alamat_pasien'), ''),
    nullif(trim(p_pasien ->> 'kontak_pasien'), ''),
    nullif(trim(p_pasien ->> 'nomor_resep'), ''),
    nullif(p_pasien ->> 'visit_id', '')::uuid)
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


revoke all on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) from public, anon;
grant execute on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) to authenticated;

comment on function public.apply_transaction is
  'Penjualan sebagai satu transaksi database. Memotong stok produk DAN batch (FEFO), mencatat batch mana yang diambil supaya pembatalan bisa membalikkannya persis, dan menyimpan kunjungan asalnya bila ada.';

/**
 * Menyetel bentuk bagian farmasi.
 *
 * Dipisah dari penyimpanan pengaturan biasa karena ini mengubah apa yang boleh
 * dilakukan, bukan cuma apa yang tertulis, jadi pantas punya jejak auditnya
 * sendiri.
 */
create or replace function public.set_mode_farmasi(p_mode text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := public.auth_company_id();
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if p_mode not in ('apotek', 'instalasi') then
    raise exception 'Mode farmasi hanya bisa apotek atau instalasi.' using errcode = 'SH004';
  end if;

  update public.settings set mode_farmasi = p_mode
   where company_id = v_company
  returning * into v_row;
  if not found then
    raise exception 'Pengaturan fasilitas belum ada.' using errcode = 'SH004';
  end if;

  perform public.catat_audit(v_company, 'farmasi.mode', 'settings', v_company::text,
    jsonb_build_object('mode', p_mode));

  return jsonb_build_object('mode_farmasi', p_mode);
end;
$$;

revoke all on function public.set_mode_farmasi(text) from public, anon;
grant execute on function public.set_mode_farmasi(text) to authenticated;
