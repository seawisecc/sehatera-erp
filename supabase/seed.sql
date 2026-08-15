-- ============================================================
-- Sehatera · Seed
-- Jalankan sesudah semua migrasi.
-- ============================================================

-- ---------- paket langganan ----------
-- Harga mengikuti TokoKu persis. KUOTA PRODUK sengaja berbeda: TokoKu memberi
-- 200 / 2.000 item, dan itu masuk akal untuk warung. Apotek terkecil pun
-- membawa 1.500–3.000 item, jadi angka TokoKu akan mentok di hari pertama impor
-- katalog — orang membayar, mengimpor, lalu ditolak sebelum sempat berjualan.
--
-- Penanda di `features` dibaca lewat lib/plan.ts. Aturan di sana: kunci yang
-- TIDAK ada dianggap kemampuan penuh, jadi menambah kemampuan baru tidak
-- diam-diam mengunci apotek yang sudah berlangganan.
insert into public.plans (code, name, description, price_monthly, price_yearly,
                          max_outlets, max_users, max_products, max_devices,
                          sort_order, is_public, features)
values
  ('starter', 'Starter', 'Apotek tunggal, satu kasir',
   99000, 990000, 1, 3, 1500, 2, 1, true,
   '{"reports":"basic","purchasing":"basic","crm":"basic","multi_outlet":false,"api":false,"klinik":false,"support":"email"}'),

  ('growth', 'Growth', 'Apotek berkembang dengan beberapa cabang',
   249000, 2490000, 5, 15, 8000, 8, 2, true,
   '{"reports":"full","purchasing":"full","crm":"full","multi_outlet":true,"api":false,"klinik":false,"support":"whatsapp"}'),

  ('enterprise', 'Enterprise', 'Jaringan apotek',
   749000, 7490000, null, null, null, null, 3, true,
   '{"reports":"full","purchasing":"full","crm":"full","multi_outlet":true,"api":true,"klinik":false,"support":"dedicated"}'),

  -- Harga paket Klinik masih usulan dan belum diketok pemilik. Dipasang
  -- is_public = false supaya tidak muncul di halaman harga sampai angkanya
  -- benar — lebih baik tidak terlihat daripada terlihat salah.
  ('klinik', 'Klinik', 'Klinik pratama & utama — rekam medis, SatuSehat, BPJS',
   1490000, 14900000, null, null, null, null, 4, false,
   '{"reports":"full","purchasing":"full","crm":"full","multi_outlet":true,"api":true,"klinik":true,"support":"dedicated"}')
on conflict (code) do update set
  name          = excluded.name,
  description   = excluded.description,
  price_monthly = excluded.price_monthly,
  price_yearly  = excluded.price_yearly,
  max_outlets   = excluded.max_outlets,
  max_users     = excluded.max_users,
  max_products  = excluded.max_products,
  max_devices   = excluded.max_devices,
  sort_order    = excluded.sort_order,
  is_public     = excluded.is_public,
  features      = excluded.features,
  updated_at    = now();

-- ---------- super admin ----------
insert into public.super_admins (email) values ('seawise.cc@gmail.com')
  on conflict (email) do nothing;
