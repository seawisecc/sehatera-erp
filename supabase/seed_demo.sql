-- ============================================================
-- Sehatera · Seed demo
--
-- Mengisi satu apotek dengan data yang cukup untuk MENCOBA aplikasinya, bukan
-- sekadar membuat tabelnya tidak kosong. Yang membedakan: ada batch yang sudah
-- kadaluarsa dan yang hampir, ada obat golongan narkotika/psikotropika/
-- prekursor beserta transaksi resepnya, dan ada faktur yang sudah lewat jatuh
-- tempo. Tanpa ketiganya, layar Tindak Lanjut, laporan SIPNAP, dan pengingat
-- faktur akan tampak "berfungsi" hanya karena tidak ada yang perlu ditampilkan.
--
-- Aman dijalankan ulang: data demo dihapus dulu berdasarkan company_id.
-- TIDAK membuat akun login apa pun — apotek disambungkan ke akun auth yang
-- sudah ada.
--
-- ISI `v_email` DULU sebelum menjalankan, dan pastikan itu apotek yang memang
-- untuk uji coba. Pernah sekali skrip ini diarahkan ke apotek milik calon klien
-- yang batal, dan 36 obat beserta 64 transaksi karangan mendarat di sana.
-- ============================================================

do $$
declare
  v_company   uuid;
  v_plan      uuid;
  -- ↓ ganti dengan email pemilik apotek UJI COBA
  v_email     text := 'GANTI_DENGAN_EMAIL_APOTEK_UJI';
  v_sup       uuid[];
  v_pid       uuid;
  v_trx       uuid;
  r           record;
  i           integer;
  j           integer;
  v_tgl       timestamptz;
  v_total     numeric;
  v_qty       integer;
  v_golongan  boolean;
  v_po        uuid;
begin
  if v_email = 'GANTI_DENGAN_EMAIL_APOTEK_UJI' then
    raise exception 'Isi dulu v_email dengan email apotek uji coba di baris atas.';
  end if;

  select id into v_company from public.companies
   where lower(admin_email) = v_email and deleted_at is null limit 1;
  if v_company is null then
    raise exception 'Apotek untuk % belum ada, atau sudah ditandai terhapus.', v_email;
  end if;

  select id into v_plan from public.plans where code = 'starter';

  -- ---------- keadaan langganan: masa coba, 14 hari ----------
  update public.companies set
    plan_id              = v_plan,
    status               = 'trial',
    trial_ends_at        = now() + interval '14 days',
    subscription_ends_at = null,
    theme                = 'sunrise-sorbet',
    kota                 = 'Denpasar',
    telepon              = '0361-234567'
  where id = v_company;

  insert into public.trial_grants (email, company_id) values (v_email, v_company)
    on conflict (email) do update set company_id = excluded.company_id;

  insert into public.subscription_events (company_id, action, plan_id, actor_email, note)
  values (v_company, 'subscribe', v_plan, v_email, 'Data demo: masa coba 14 hari.');

  -- ---------- bersihkan data demo lama ----------
  delete from public.transaction_items where company_id = v_company;
  delete from public.transactions      where company_id = v_company;
  delete from public.faktur            where company_id = v_company;
  delete from public.po_items          where company_id = v_company;
  delete from public.purchase_orders   where company_id = v_company;
  delete from public.product_batches   where company_id = v_company;
  delete from public.product_suppliers where company_id = v_company;
  delete from public.products          where company_id = v_company;
  delete from public.suppliers         where company_id = v_company;
  delete from public.services          where company_id = v_company;

  -- ---------- profil apotek ----------
  delete from public.settings where company_id = v_company;
  insert into public.settings (company_id, nama_apotek, sektor_usaha, kota, alamat,
                               nomor_ijin, nomor_telepon, email, nama_apoteker, nomor_sipa)
  values (v_company, 'Apotek Uji Coba', 'Apotek', 'Denpasar',
          'Jl. Gatot Subroto Barat No. 88, Denpasar, Bali',
          '446/SIA/DPS/2025', '0361-234567', v_email,
          'apt. Ni Luh Putu Sari, S.Farm.', '19880412/SIPA/51.71/2025');

  -- ---------- pemasok (PBF) ----------
  for r in
    select * from (values
      ('PBF-001','PT Anugrah Argon Medica','PBF','Jl. Cokroaminoto 145, Denpasar','0361-411223'),
      ('PBF-002','PT Enseval Putera Megatrading','PBF','Jl. Mahendradatta 12, Denpasar','0361-482910'),
      ('PBF-003','PT Bina San Prima','PBF','Jl. Imam Bonjol 210, Denpasar','0361-733515'),
      ('PBF-004','PT Parit Padang Global','PBF','Jl. Buluh Indah 33, Denpasar','0361-419080'),
      ('PBF-005','PT Merapi Utama Pharma','Subdistributor','Jl. Kargo Permai 7, Denpasar','0361-412345'),
      ('PBF-006','PT Kimia Farma Trading','PBF','Jl. Diponegoro 125, Denpasar','0361-226813')
    ) as t(kode, nama, jenis, alamat, telp)
  loop
    insert into public.suppliers (company_id, kode, nama_supplier, jenis, alamat, telepon)
    values (v_company, r.kode, r.nama, r.jenis, r.alamat, r.telp);
  end loop;

  select array_agg(id order by kode) into v_sup
    from public.suppliers where company_id = v_company;

  -- ---------- katalog obat ----------
  -- Sengaja memuat kelima golongan yang diawasi. Apotek yang hanya berisi obat
  -- bebas tidak akan pernah memunculkan layar resep maupun SIPNAP, jadi bagian
  -- aplikasi yang paling sulit itu tidak akan pernah tercoba.
  i := 0;
  for r in
    select * from (values
      ('OBT-0001','Paracetamol 500 mg','Paracetamol','Paracetamol 500 mg','bebas','Tablet',100,   350,   700, 1240, 200),
      ('OBT-0002','Amoxicillin 500 mg','Amoxicillin','Amoxicillin 500 mg','keras','Kapsul',100,   900,  1800,  860, 150),
      ('OBT-0003','Antasida DOEN','Antasida','Al(OH)3 200mg + Mg(OH)2 200mg','bebas','Tablet',100, 250,   600,  940, 150),
      ('OBT-0004','Amlodipine 10 mg','Amlodipine','Amlodipine besilate 10 mg','keras','Tablet',30, 1100,  2200,  420,  60),
      ('OBT-0005','Metformin 500 mg','Metformin','Metformin HCl 500 mg','keras','Tablet',100,     600,  1300,  780, 120),
      ('OBT-0006','Cetirizine 10 mg','Cetirizine','Cetirizine HCl 10 mg','bebas_terbatas','Tablet',50, 800, 1700, 350,  60),
      ('OBT-0007','Omeprazole 20 mg','Omeprazole','Omeprazole 20 mg','keras','Kapsul',30,        1500,  3000,  260,  40),
      ('OBT-0008','Vitamin C 500 mg IPI','Asam askorbat','Vitamin C 500 mg','suplemen','Tablet',50, 400,  900, 1100, 150),
      ('OBT-0009','Ibuprofen 400 mg','Ibuprofen','Ibuprofen 400 mg','bebas_terbatas','Tablet',100, 550, 1200,  620, 100),
      ('OBT-0010','Dexamethasone 0,5 mg','Dexamethasone','Dexamethasone 0,5 mg','keras','Tablet',100, 300, 800, 540, 100),
      ('OBT-0011','Codipront Cum Exp','Codeine','Kodein + Feniltoloksamin','narkotika','Kapsul',10, 9500, 17500,  48,  20),
      ('OBT-0012','Alprazolam 0,5 mg','Alprazolam','Alprazolam 0,5 mg','psikotropika','Tablet',10, 4200,  8500,  60,  20),
      ('OBT-0013','Clobazam 10 mg','Clobazam','Clobazam 10 mg','psikotropika','Tablet',10,       5100, 10000,  40,  15),
      ('OBT-0014','Pseudoefedrin HCl 60 mg','Pseudoefedrin','Pseudoefedrin HCl 60 mg','prekursor','Tablet',10, 2200, 4500, 90, 30),
      ('OBT-0015','Tramadol 50 mg','Tramadol','Tramadol HCl 50 mg','keras','Kapsul',10,          3200,  6500,  70,  25),
      ('OBT-0016','OBH Combi Batuk Flu 100 ml','—','Paracetamol, Efedrin, CTM','bebas_terbatas','Botol',1, 12500, 19500, 84, 24),
      ('OBT-0017','Betadine Antiseptik 60 ml','Povidone iodine','Povidone iodine 10%','bebas','Botol',1, 17500, 27500, 56, 15),
      ('OBT-0018','Hansaplast Roll 2 cm','—','Plester luka','alkes','Roll',1,                    8500, 14000,  70,  20),
      ('OBT-0019','Masker Medis 3 Ply (50s)','—','Masker bedah 3 lapis','alkes','Box',1,        22000, 35000,  38,  10),
      ('OBT-0020','Handscoon Latex M (100s)','—','Sarung tangan periksa','alkes','Box',1,       58000, 82000,  16,   6),
      ('OBT-0021','Salbutamol 2 mg','Salbutamol','Salbutamol sulfat 2 mg','keras','Tablet',100,   450,  1100,  480,  80),
      ('OBT-0022','Ambroxol 30 mg','Ambroxol','Ambroxol HCl 30 mg','keras','Tablet',100,          500,  1200,  510,  80),
      ('OBT-0023','Simvastatin 20 mg','Simvastatin','Simvastatin 20 mg','keras','Tablet',30,     1250,  2600,  300,  50),
      ('OBT-0024','Allopurinol 100 mg','Allopurinol','Allopurinol 100 mg','keras','Tablet',100,   400,  1000,  460,  80),
      ('OBT-0025','Captopril 25 mg','Captopril','Captopril 25 mg','keras','Tablet',100,           380,   950,  420,  80),
      ('OBT-0026','Domperidone 10 mg','Domperidone','Domperidone 10 mg','keras','Tablet',100,     650,  1400,  380,  60),
      ('OBT-0027','Loratadine 10 mg','Loratadine','Loratadine 10 mg','bebas_terbatas','Tablet',50, 700, 1500,  290,  50),
      ('OBT-0028','Neurobion Forte','Vitamin B','B1, B6, B12','suplemen','Tablet',10,            3800,  6500,  120,  30),
      ('OBT-0029','Imboost Force','Echinacea','Echinacea + Zinc','suplemen','Tablet',10,         6500, 11000,   90,  24),
      ('OBT-0030','Sangobion','Zat besi','Fe fumarat + vitamin','suplemen','Kapsul',10,          4200,  7500,  110,  30),
      ('OBT-0031','Insto Tetes Mata 7,5 ml','Tetrahidrozolin','Tetrahidrozolin HCl','bebas','Botol',1, 9500, 15500, 62, 18),
      ('OBT-0032','Bodrex Migra','Paracetamol','Paracetamol + Propifenazon','bebas','Tablet',4,  1200,  2500,  180,  40),
      ('OBT-0033','Promag Tablet','Antasida','Hidrotalsit + Mg(OH)2','bebas','Tablet',12,        1500,  2900,  160,  40),
      ('OBT-0034','Termometer Digital','—','Termometer badan digital','alkes','Pcs',1,          32000, 52000,   14,   5),
      ('OBT-0035','Tensimeter Digital Omron','—','Alat ukur tekanan darah','alkes','Pcs',1,    385000,520000,    4,   2),
      ('OBT-0036','Test Strip Gula Darah (25s)','—','Strip glukometer','alkes','Box',1,          85000,125000,   12,   5)
    ) as t(kode, nama, generik, kandungan, kategori, satuan, isi, beli, jual, stok, minimum)
  loop
    i := i + 1;
    insert into public.products (company_id, kode, nama_obat, nama_generik, kandungan,
                                 kategori, satuan, isi_kemasan, harga_beli, harga_jual,
                                 stok_total, stok_minimum)
    values (v_company, r.kode, r.nama, nullif(r.generik, '—'), r.kandungan,
            r.kategori, r.satuan, r.isi, r.beli, r.jual, r.stok, r.minimum)
    returning id into v_pid;

    -- pemasok: dua PBF per obat, supaya order terpandu punya pilihan
    insert into public.product_suppliers (company_id, product_id, supplier_id)
    values (v_company, v_pid, v_sup[1 + (i % 6)]),
           (v_company, v_pid, v_sup[1 + ((i + 3) % 6)])
    on conflict do nothing;

    -- ---------- batch ----------
    -- Tiga bentuk sengaja: sudah lewat, hampir lewat, dan aman. Batch yang
    -- sudah lewat TIDAK dikurangi dari stok_total — itu memang keadaan yang
    -- ingin ditemukan apoteker di layar Tindak Lanjut, bukan yang sudah
    -- dibereskan diam-diam.
    if i % 7 = 0 then
      insert into public.product_batches (company_id, product_id, batch_number, expired_date, stok_batch)
      values (v_company, v_pid, 'B' || to_char(now() - interval '20 months', 'YYMM') || lpad(i::text, 3, '0'),
              (current_date - ((i % 40) + 5))::date, greatest(4, r.stok / 12));
    end if;

    if i % 4 = 0 then
      insert into public.product_batches (company_id, product_id, batch_number, expired_date, stok_batch)
      values (v_company, v_pid, 'B' || to_char(now() - interval '14 months', 'YYMM') || lpad(i::text, 3, '0'),
              (current_date + ((i % 60) + 10))::date, greatest(6, r.stok / 6));
    end if;

    insert into public.product_batches (company_id, product_id, batch_number, expired_date, stok_batch)
    values (v_company, v_pid, 'B' || to_char(now() - interval '3 months', 'YYMM') || lpad(i::text, 3, '0'),
            (current_date + 300 + (i * 7))::date, greatest(1, r.stok / 2));
  end loop;

  -- ---------- layanan jasa ----------
  insert into public.services (company_id, nama, harga, deskripsi) values
    (v_company, 'Racikan Puyer (per bungkus)', 2000,  'Jasa peracikan sediaan puyer sesuai resep dokter.'),
    (v_company, 'Racikan Kapsul (per kapsul)', 1500,  'Jasa peracikan sediaan kapsul.'),
    (v_company, 'Cek Gula Darah',              25000, 'Pemeriksaan gula darah sewaktu dengan glukometer.'),
    (v_company, 'Cek Asam Urat',               30000, 'Pemeriksaan kadar asam urat.'),
    (v_company, 'Cek Kolesterol',              45000, 'Pemeriksaan kolesterol total.'),
    (v_company, 'Cek Tekanan Darah',           10000, 'Pengukuran tekanan darah.');

  -- ---------- pembelian & faktur ----------
  for j in 1..4 loop
    insert into public.purchase_orders (company_id, supplier_id, total_nilai, catatan, status, tanggal_terima, created_at)
    values (v_company, v_sup[j], 0,
            case j when 1 then 'Restok rutin awal bulan' when 2 then 'Order terpandu, restok otomatis'
                   when 3 then 'Tambahan stok obat golongan' else 'Restok alkes' end,
            case when j <= 3 then 'selesai' else 'dikirim' end,
            case when j <= 3 then (current_date - (j * 9))::date else null end,
            now() - (j * 10 || ' days')::interval)
    returning id into v_po;

    v_total := 0;
    for r in
      select id, nama_obat, satuan, harga_beli from public.products
       where company_id = v_company order by md5(id::text || j::text) limit 5
    loop
      v_qty := 20 + (j * 10);
      insert into public.po_items (company_id, po_id, product_id, nama_produk, satuan,
                                   qty_pesan, qty_terima, harga_beli, subtotal)
      values (v_company, v_po, r.id, r.nama_obat, r.satuan, v_qty,
              case when j <= 3 then v_qty else 0 end, r.harga_beli, v_qty * r.harga_beli);
      v_total := v_total + (v_qty * r.harga_beli);
    end loop;
    update public.purchase_orders set total_nilai = v_total where id = v_po;

    if j <= 3 then
      -- Faktur pertama sengaja dibuat LEWAT jatuh tempo. Pengingat yang tidak
      -- pernah punya apa pun untuk diingatkan tidak bisa dinilai benar atau
      -- salah sampai ada tagihan betulan yang telat.
      insert into public.faktur (company_id, nomor_faktur, po_id, supplier_id, tanggal_faktur,
                                 term_of_payment, tanggal_jatuh_tempo, total, status,
                                 tanggal_bayar, metode_bayar)
      values (v_company, 'INV/' || to_char(now(), 'YYYY') || '/' || lpad((1000 + j)::text, 4, '0'),
              v_po, v_sup[j], (current_date - (j * 9))::date, 30,
              (current_date - (j * 9) + 30)::date, v_total,
              case when j = 3 then 'lunas' else 'belum_bayar' end,
              case when j = 3 then (current_date - 4)::date else null end,
              case when j = 3 then 'Transfer' else null end);
    end if;
  end loop;

  -- Satu faktur yang benar-benar sudah lewat tempo.
  insert into public.faktur (company_id, nomor_faktur, supplier_id, tanggal_faktur,
                             term_of_payment, tanggal_jatuh_tempo, total, status)
  values (v_company, 'INV/' || to_char(now(), 'YYYY') || '/0999', v_sup[5],
          (current_date - 52)::date, 30, (current_date - 22)::date, 4750000, 'belum_bayar');

  -- ---------- penjualan 30 hari terakhir ----------
  for j in 1..64 loop
    v_tgl := now() - ((j % 30) || ' days')::interval - ((j * 37) % 600 || ' minutes')::interval;

    -- Tiap transaksi kesepuluh memuat obat golongan, dan itu WAJIB membawa
    -- identitas pasien serta nomor resep — aturan yang sama ditegakkan
    -- database lewat apply_transaction().
    v_golongan := (j % 10 = 0);

    insert into public.transactions (company_id, total, bayar, kembalian, metode_bayar, status,
                                     nama_pasien, alamat_pasien, kontak_pasien, nomor_resep, created_at)
    values (v_company, 0, 0, 0,
            case (j % 4) when 0 then 'QRIS' when 1 then 'Tunai' when 2 then 'Tunai' else 'Debit' end,
            case when j % 23 = 0 then 'dibatalkan' else 'selesai' end,
            case when v_golongan then (array['Made Ariani','Wayan Sudira','Kadek Restu','Ni Putu Widya','I Gusti Ngurah Bagus'])[1 + (j % 5)] end,
            case when v_golongan then (array['Jl. Nangka Selatan 12, Denpasar','Jl. Kenyeri 45, Denpasar','Jl. Sedap Malam 7, Denpasar','Jl. Cargo Sari 21, Denpasar','Jl. Ahmad Yani 210, Denpasar'])[1 + (j % 5)] end,
            case when v_golongan then '08' || lpad(((j * 7919) % 100000000)::text, 10, '1') end,
            case when v_golongan then 'R/' || to_char(v_tgl, 'YYYYMMDD') || '/' || lpad(j::text, 3, '0') end,
            v_tgl)
    returning id into v_trx;

    v_total := 0;
    for r in
      select p.id, p.nama_obat, p.harga_jual, p.kategori
        from public.products p
       where p.company_id = v_company
         and (case when v_golongan
                   then p.kategori in ('narkotika','psikotropika','prekursor')
                   else p.kategori not in ('narkotika','psikotropika','prekursor') end)
       order by md5(p.id::text || j::text)
       limit 1 + (j % 4)
    loop
      v_qty := 1 + (j % 3);
      insert into public.transaction_items (company_id, transaction_id, product_id, nama_obat,
                                            harga_jual, jumlah, subtotal, created_at)
      values (v_company, v_trx, r.id, r.nama_obat, r.harga_jual, v_qty, r.harga_jual * v_qty, v_tgl);
      v_total := v_total + (r.harga_jual * v_qty);
    end loop;

    -- Bayar dibulatkan ke atas ke ribuan terdekat, seperti kebiasaan di kasir.
    update public.transactions
       set total = v_total,
           bayar = ceil((v_total + 1) / 5000.0) * 5000,
           kembalian = ceil((v_total + 1) / 5000.0) * 5000 - v_total
     where id = v_trx;
  end loop;

  raise notice 'Data demo untuk % selesai.', v_email;
end $$;

-- ============================================================
-- Apotek kedua: pelanggan BERBAYAR, supaya kedua keadaan langganan
-- bisa dilihat berdampingan tanpa menunggu 14 hari.
-- ============================================================
do $$
declare
  v_company uuid;
  v_plan    uuid;
begin
  select id into v_company from public.companies
   where lower(admin_email) = 'GANTI_DENGAN_EMAIL_APOTEK_BERBAYAR' and deleted_at is null limit 1;
  if v_company is null then return; end if;

  select id into v_plan from public.plans where code = 'growth';

  update public.companies set
    plan_id              = v_plan,
    status               = 'active',
    subscription_ends_at = now() + interval '5 days',   -- sengaja: memicu spanduk "segera berakhir"
    trial_ends_at        = now() - interval '3 months',
    theme                = 'neon-pulse',
    kota                 = 'Denpasar'
  where id = v_company;

  insert into public.subscription_events (company_id, action, plan_id, actor_email, note)
  values (v_company, 'renew', v_plan, 'seawise.cc@gmail.com',
          'Data demo: langganan berbayar, sisa 5 hari.');

  -- Kasir yang sudah punya akun login disambungkan sebagai anggota tim.
  insert into public.app_users (company_id, nama, email, role, status, modules)
  values (v_company, 'Kasir Sejahtera', 'kasir@sejahtera.co.id', 'kasir', 'aktif', '[]'::jsonb)
  on conflict do nothing;
end $$;

-- ---------- ringkasan ----------
select c.nama, c.status, p.name as paket,
       coalesce(c.trial_ends_at, c.subscription_ends_at)::date as aktif_sampai,
       (select count(*) from public.products   x where x.company_id = c.id) as produk,
       (select count(*) from public.product_batches x where x.company_id = c.id) as batch,
       (select count(*) from public.transactions x where x.company_id = c.id) as transaksi,
       (select count(*) from public.faktur     x where x.company_id = c.id) as faktur
from public.companies c
left join public.plans p on p.id = c.plan_id
where c.deleted_at is null
order by c.nama;
