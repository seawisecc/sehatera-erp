-- ============================================================
-- Sehatera · 0004 · Fungsi yang dipanggil aplikasi
--
-- Tiga hal yang sebelumnya dikerjakan browser satu per satu, dan karena itu
-- bisa berhenti di tengah jalan:
--   · pendaftaran apotek baru
--   · penjualan (transaksi + item + potong stok + potong batch)
--   · pembacaan identitas & hak akses saat masuk aplikasi
-- ============================================================

-- ============================================================
-- 1. Konteks sesi
-- ============================================================
-- Dulu aplikasi menembak `super_admins`, `companies`, lalu `app_users` sebagai
-- tiga permintaan terpisah, dan yang pertama mengharuskan tabel super admin
-- bisa dibaca semua orang. Satu fungsi menggantikan ketiganya, dan tidak ada
-- satu pun tabel platform yang perlu dibuka.
create or replace function public.my_context()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_email   text := lower(auth.jwt() ->> 'email');
  v_super   boolean;
  v_company uuid;
  v_row     record;
  v_user    record;
begin
  if v_email is null then
    return jsonb_build_object('signedIn', false);
  end if;

  v_super := public.is_super_admin();

  if v_super then
    return jsonb_build_object(
      'signedIn', true, 'email', v_email,
      'isSuper', true, 'role', 'superadmin', 'modules', null, 'company', null);
  end if;

  v_company := public.auth_company_id();

  select c.id, c.nama, c.status, c.theme, c.trial_ends_at, c.subscription_ends_at,
         p.code as plan_code, p.name as plan_name, p.price_monthly, p.features
    into v_row
    from public.companies c
    left join public.plans p on p.id = c.plan_id
   where c.id = v_company and c.deleted_at is null;

  select role, modules, status into v_user
    from public.app_users
   where company_id = v_company and lower(email) = v_email
   limit 1;

  return jsonb_build_object(
    'signedIn', true,
    'email',    v_email,
    'isSuper',  false,
    -- Email yang tidak terdaftar di direktori tim tapi memiliki apotek adalah
    -- pemiliknya. Itu keadaan normal, bukan kesalahan: pendaftar tidak pernah
    -- mengundang dirinya sendiri.
    'role',     coalesce(v_user.role, 'pemilik'),
    'modules',  v_user.modules,
    'memberStatus', v_user.status,
    'company',  case when v_row.id is null then null else jsonb_build_object(
      'id',                 v_row.id,
      'nama',               v_row.nama,
      'status',             v_row.status,
      'theme',              v_row.theme,
      'trialEndsAt',        v_row.trial_ends_at,
      'subscriptionEndsAt', v_row.subscription_ends_at,
      'planCode',           v_row.plan_code,
      'planName',           v_row.plan_name,
      'planPriceMonthly',   v_row.price_monthly,
      'features',           coalesce(v_row.features, '{}'::jsonb)
    ) end
  );
end;
$$;

revoke all on function public.my_context() from public, anon;
grant execute on function public.my_context() to authenticated;

-- ============================================================
-- 2. Pendaftaran apotek
-- ============================================================
-- Dipanggil sekali sesudah akun auth terbentuk. Semua yang dibutuhkan apotek
-- baru dibuat di sini dalam satu transaksi database: kalau salah satu gagal,
-- tidak ada yang tersisa setengah jadi.
create or replace function public.register_apotek(
  p_nama_apotek text,
  p_nama_admin  text,
  p_kota        text default null,
  p_telepon     text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_email      text := lower(auth.jwt() ->> 'email');
  v_company    uuid;
  v_plan       uuid;
  v_slug       text;
  v_trial_used boolean;
  v_trial_end  timestamptz;
begin
  if v_email is null then
    raise exception 'Harus masuk dulu sebelum mendaftarkan apotek.' using errcode = 'SH004';
  end if;

  if coalesce(trim(p_nama_apotek), '') = '' then
    raise exception 'Nama apotek wajib diisi.' using errcode = 'SH004';
  end if;

  -- Satu email = satu apotek. Kalau tidak dijaga, menekan tombol daftar dua
  -- kali karena halaman terasa lambat akan melahirkan dua apotek kembar, dan
  -- auth_company_id() akan memilih salah satunya secara acak.
  select id into v_company from public.companies
   where lower(admin_email) = v_email and deleted_at is null limit 1;
  if v_company is not null then
    return jsonb_build_object('companyId', v_company, 'created', false);
  end if;

  v_slug := regexp_replace(lower(trim(p_nama_apotek)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if exists (select 1 from public.companies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  end if;

  select id into v_plan from public.plans where code = 'starter' limit 1;

  -- Masa coba dicatat per email pendaftar. Yang mendaftar apotek kedua tetap
  -- boleh: dia hanya tidak dapat 14 hari gratis untuk kedua kalinya.
  v_trial_used := exists (select 1 from public.trial_grants where email = v_email);
  v_trial_end  := case when v_trial_used then now() else now() + interval '14 days' end;

  insert into public.companies (nama, slug, admin_nama, admin_email, kota, telepon,
                                plan_id, status, trial_ends_at, theme)
  values (trim(p_nama_apotek), v_slug, nullif(trim(p_nama_admin), ''), v_email,
          nullif(trim(p_kota), ''), nullif(trim(p_telepon), ''),
          v_plan, 'trial', v_trial_end, 'sunrise-sorbet')
  returning id into v_company;

  insert into public.trial_grants (email, company_id)
  values (v_email, v_company)
  on conflict (email) do nothing;

  -- Profil apotek diisi awal supaya struk dan laporan SIPNAP tidak mencetak
  -- baris kosong di hari pertama.
  insert into public.settings (company_id, nama_apotek, kota, sektor_usaha)
  values (v_company, trim(p_nama_apotek), nullif(trim(p_kota), ''), 'Apotek');

  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_company, coalesce(nullif(trim(p_nama_admin), ''), v_email),
          v_email, 'pemilik', 'aktif', '[]'::jsonb);

  insert into public.subscription_events (company_id, action, plan_id, actor_email, note)
  values (v_company, 'subscribe', v_plan, v_email,
          case when v_trial_used
               then 'Pendaftaran tanpa masa coba — email ini sudah pernah memakai masa coba.'
               else 'Pendaftaran baru, masa coba 14 hari.' end);

  return jsonb_build_object('companyId', v_company, 'created', true, 'trialUsed', v_trial_used);
end;
$$;

revoke all on function public.register_apotek(text, text, text, text) from public, anon;
grant execute on function public.register_apotek(text, text, text, text) to authenticated;

-- ============================================================
-- 3. Penjualan
-- ============================================================
-- Menggantikan urutan panggilan yang sebelumnya dijalankan browser satu per
-- satu: insert transaksi → insert item → lalu SATU UPDATE STOK PER PRODUK di
-- dalam perulangan. Urutan itu punya dua masalah nyata di apotek yang ramai:
--
--   1. Kalau jaringan putus di tengah perulangan, transaksi dan itemnya sudah
--      tersimpan tapi sebagian stok belum terpotong. Tidak ada yang tahu sampai
--      stok opname berikutnya.
--   2. `stok_batch` TIDAK PERNAH ikut dipotong sama sekali: hanya
--      `products.stok_total`. Jadi sejak transaksi pertama, jumlah batch dan
--      stok total sudah berbeda, dan angka batch itulah yang dipakai laporan
--      SIPNAP dan penelusuran obat kadaluarsa.
--
-- Di sini semuanya jadi satu transaksi database, dan batch dipotong dengan
-- aturan FEFO: yang paling dekat kadaluarsa keluar duluan.
create or replace function public.apply_transaction(
  p_items        jsonb,
  p_bayar        numeric,
  p_metode_bayar text default 'Tunai',
  p_pasien       jsonb default null,
  -- Hanya untuk Super Admin yang sedang membantu satu apotek ("lihat sebagai").
  -- Diabaikan untuk semua orang lain: kalau tidak, siapa pun bisa menuliskan
  -- transaksi ke apotek orang dengan menambahkan satu argumen.
  p_company      uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company   uuid := case when p_company is not null and public.is_super_admin()
                           then p_company else public.auth_company_id() end;
  v_trx       uuid;
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
  -- Semua penolakan terjadi sebelum satu baris pun ditulis, supaya tidak ada
  -- transaksi setengah jadi yang harus dibersihkan tangan.
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

    -- Obat golongan wajib membawa identitas pasien dan nomor resep. Ini
    -- kewajiban pelaporan SIPNAP, jadi ditolak di database, bukan hanya
    -- diingatkan di layar, yang bisa dilewati siapa pun yang memanggil API
    -- langsung.
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
    nama_pasien, alamat_pasien, kontak_pasien, nomor_resep)
  values (
    v_company, v_total, p_bayar, p_bayar - v_total,
    coalesce(p_metode_bayar, 'Tunai'), 'selesai',
    nullif(trim(p_pasien ->> 'nama_pasien'), ''),
    nullif(trim(p_pasien ->> 'alamat_pasien'), ''),
    nullif(trim(p_pasien ->> 'kontak_pasien'), ''),
    nullif(trim(p_pasien ->> 'nomor_resep'), ''))
  returning id into v_trx;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := (v_item ->> 'jumlah')::integer;
    v_harga := coalesce((v_item ->> 'harga_jual')::numeric, 0);
    v_pid   := case when coalesce((v_item ->> 'is_jasa')::boolean, false)
                    then null else (v_item ->> 'product_id')::uuid end;

    insert into public.transaction_items (
      company_id, transaction_id, product_id, nama_obat, harga_jual, jumlah, subtotal)
    values (v_company, v_trx, v_pid, v_item ->> 'nama_obat', v_harga, v_qty, v_harga * v_qty);

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
    loop
      exit when v_sisa <= 0;
      v_ambil := least(v_sisa, v_batch.stok_batch);
      update public.product_batches
         set stok_batch = stok_batch - v_ambil
       where id = v_batch.id;
      v_sisa := v_sisa - v_ambil;
    end loop;
  end loop;

  return (select to_jsonb(t) from public.transactions t where t.id = v_trx);
end;
$$;

revoke all on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) from public, anon;
grant execute on function public.apply_transaction(jsonb, numeric, text, jsonb, uuid) to authenticated;

comment on function public.apply_transaction is
  'Penjualan sebagai satu transaksi database. Memotong stok produk DAN batch (FEFO), yang sebelumnya tidak pernah terjadi.';
comment on function public.my_context is
  'Identitas, peran, hak akses modul, dan keadaan langganan dalam satu panggilan.';
