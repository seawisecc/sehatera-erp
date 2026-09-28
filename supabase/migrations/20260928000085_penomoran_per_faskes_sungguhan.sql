-- ============================================================
-- 0085  Penomoran per faskes akhirnya berlaku
-- ============================================================
--
-- Ditemukan saat audit 28 September 2026, dijalankan atas persetujuan
-- pemilik hari yang sama.
--
-- ── 1. Penomoran dari migrasi 0002 TIDAK PERNAH berlaku ─────────────────
--
-- Migrasi 0002 memasang `trg_nomor_*` yang memberi nomor berurut PER FASKES
-- (TRX/2026/0001). Tapi trigger penomoran lama dari folder `sql/` tidak
-- pernah dicabut: `set_nomor_transaksi`, `set_nomor_po`, `set_nomor_ba`,
-- `set_nomor_retur`, masing-masing memanggil `generate_nomor_*` yang memakai
-- SATU sequence untuk semua faskes.
--
-- PostgreSQL menjalankan trigger BEFORE yang setara menurut ABJAD, jadi
-- `set_nomor_*` jalan lebih dulu daripada `trg_nomor_*`. Fungsi yang baru
-- hanya mengisi nomor yang masih kosong, dan nomornya sudah terisi. Tidak ada
-- yang gagal, dan tidak ada yang tahu. Buktinya di data: Apotek Sejahtera
-- punya 24 transaksi bernomor TRX-...-0038 sampai TRX-...-0166, karena nomor
-- di antaranya dipakai faskes lain. Untuk Berita Acara Pemusnahan, nomor yang
-- melompat terbaca seperti dokumen yang hilang saat diperiksa.
--
-- Dua hal lain ikut menahan, dan ketiganya harus dicabut BERSAMAAN:
--
--   a. Indeks unik GLOBAL `transactions_nomor_transaksi_key` dan
--      `purchase_orders_nomor_po_key`. Dengannya dua faskes tidak bisa
--      sama-sama punya TRX/2026/0001, jadi mencabut trigger lama saja akan
--      membuat transaksi faskes kedua DITOLAK. Indeks unik per faskes sudah
--      ada sejak 0002 dan tetap dipakai.
--
--   b. `trg_nomor_*` berjalan SEBELUM `trg_set_company_id` (lagi-lagi abjad),
--      jadi pada baris yang company_id-nya diisi trigger (PO dari layar
--      Pembelian), nomornya dihitung dengan company_id kosong. Triggernya
--      dibuat ulang dengan nama `trg_z_nomor_*` supaya jalan sesudahnya.
--      **Awalan `z` itu bagian dari logikanya, jangan diganti.**
--
-- Nomor yang sudah terbit TIDAK diubah: nomor di struk yang sudah di tangan
-- pembeli, dan di BA yang sudah ditandatangani, adalah catatan. Dokumen baru
-- memakai bentuk per faskes (TRX/2026/0001), dan karena bentuknya berbeda
-- dari yang lama, hitungannya mulai dari 0001 tanpa bertabrakan.
--
-- ── 2. next_doc_number bisa dipanggil TANPA LOGIN ───────────────────────
--
-- Ia `security definer`, menerima company_id, NAMA TABEL, dan NAMA KOLOM
-- sebagai argumen, lalu menjalankan SQL dinamis dengan hak pemilik database.
-- Siapa pun dengan kunci anon (yang memang ada di peramban) bisa menanyakan
-- volume transaksi faskes lain, dan karena kolomnya di-cast ke integer, isi
-- kolom teks bisa keluar lewat pesan galat. Semua pemanggilnya fungsi
-- `security definer` milik postgres, jadi hak panggil dari luar dicabut
-- tanpa mengubah apa pun untuk mereka.
--
-- Sekalian: dua penyimpan yang bersamaan dulu bisa membaca max() yang sama
-- dan mendapat nomor kembar (lalu salah satunya ditolak indeks unik). Sekarang
-- ia mengunci per (faskes, tabel) sampai transaksinya selesai.
--
-- ── 3. Indeks jalur harian ──────────────────────────────────────────────
--
-- Advisor mencatat 51 foreign key tanpa indeks. Yang ditambahkan di sini
-- hanya yang ada di jalur kerja harian: kartu stok dan SIPNAP memfilter
-- `product_id`, pembatalan transaksi membaca `transaction_item_id`, dan RLS
-- tabel medis memfilter `company_id`. Sisanya tabel kecil yang tidak pernah
-- dicari lewat kolom itu; indeks yang tidak dipakai cuma memperlambat tulis.

-- ── 1a. trigger lama ────────────────────────────────────────────────────
drop trigger if exists set_nomor_transaksi on public.transactions;
drop trigger if exists set_nomor_po        on public.purchase_orders;
drop trigger if exists set_nomor_ba        on public.pemusnahan;
drop trigger if exists set_nomor_retur     on public.retur_supplier;
-- kembaran dari trg_nomor_retur, memanggil fungsi yang sama dua kali
drop trigger if exists trg_set_nomor_retur on public.retur_supplier;

drop function if exists public.generate_nomor_transaksi();
drop function if exists public.generate_nomor_po();
drop function if exists public.generate_nomor_ba();
drop function if exists public.generate_nomor_retur();

-- ── 1b. indeks unik global; yang per faskes tetap ───────────────────────
alter table public.transactions    drop constraint if exists transactions_nomor_transaksi_key;
alter table public.purchase_orders drop constraint if exists purchase_orders_nomor_po_key;
drop index if exists public.transactions_nomor_transaksi_key;
drop index if exists public.purchase_orders_nomor_po_key;

-- ── 1c. urutan: sesudah company_id terisi ───────────────────────────────
drop trigger if exists trg_nomor_trx        on public.transactions;
drop trigger if exists trg_nomor_po         on public.purchase_orders;
drop trigger if exists trg_nomor_pemusnahan on public.pemusnahan;
drop trigger if exists trg_nomor_retur      on public.retur_supplier;

create trigger trg_z_nomor_trx before insert on public.transactions
  for each row execute function public.set_nomor_transaksi();
create trigger trg_z_nomor_po before insert on public.purchase_orders
  for each row execute function public.set_nomor_po();
create trigger trg_z_nomor_pemusnahan before insert on public.pemusnahan
  for each row execute function public.set_nomor_pemusnahan();
create trigger trg_z_nomor_retur before insert on public.retur_supplier
  for each row execute function public.set_nomor_retur();

-- ── 2. next_doc_number: terkunci dari luar, dan dari balapan ────────────
create or replace function public.next_doc_number(
  p_company uuid, p_table text, p_column text, p_prefix text, p_year text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_seq integer;
begin
  if p_company is null then
    -- Nomor tanpa faskes dihitung dari baris milik siapa pun yang company_id-
    -- nya kosong, lalu bertabrakan. Lebih baik gagal di sini.
    raise exception 'Nomor dokumen tidak bisa dibuat tanpa faskes.' using errcode = 'SH004';
  end if;

  -- Satu kunci per (faskes, tabel), dilepas saat transaksinya selesai. Dua
  -- kasir yang menyimpan pada detik yang sama berbaris di sini, jadi yang
  -- kedua membaca max() SESUDAH yang pertama tertulis.
  perform pg_advisory_xact_lock(hashtextextended(p_company::text || ':' || p_table, 0));

  execute format(
    'select coalesce(max(nullif(regexp_replace(%I, ''^.*/'', ''''), '''')::integer), 0) + 1
       from public.%I
      where company_id = $1 and %I like $2',
    p_column, p_table, p_column
  )
  into v_seq
  using p_company, p_prefix || '/' || p_year || '/%';

  return p_prefix || '/' || p_year || '/' || lpad(v_seq::text, 4, '0');
end;
$function$;

revoke execute on function public.next_doc_number(uuid, text, text, text, text) from public, anon, authenticated;

-- ── 3. indeks jalur harian ──────────────────────────────────────────────
create index if not exists idx_transaction_items_product   on public.transaction_items (product_id);
create index if not exists idx_po_items_product            on public.po_items (product_id);
create index if not exists idx_tib_transaction_item        on public.transaction_item_batches (transaction_item_id);
create index if not exists idx_tib_product                 on public.transaction_item_batches (product_id);
create index if not exists idx_prescription_items_product  on public.prescription_items (product_id);
create index if not exists idx_prescription_items_company  on public.prescription_items (company_id);
create index if not exists idx_product_suppliers_supplier  on public.product_suppliers (supplier_id);
create index if not exists idx_purchase_orders_supplier    on public.purchase_orders (supplier_id);
create index if not exists idx_faktur_supplier             on public.faktur (supplier_id);
create index if not exists idx_pemusnahan_product          on public.pemusnahan (product_id);
create index if not exists idx_retur_supplier_product      on public.retur_supplier (product_id);
create index if not exists idx_reservations_jadwal         on public.reservations (jadwal_id);
create index if not exists idx_visits_unit                 on public.visits (unit_id);
create index if not exists idx_visit_charges_company       on public.visit_charges (company_id);
create index if not exists idx_visit_diagnoses_company     on public.visit_diagnoses (company_id);
create index if not exists idx_visit_notes_company         on public.visit_notes (company_id);
create index if not exists idx_visit_vitals_company        on public.visit_vitals (company_id);
create index if not exists idx_visit_status_log_company    on public.visit_status_log (company_id);
create index if not exists idx_visit_addenda_company       on public.visit_addenda (company_id);
create index if not exists idx_visit_referrals_company     on public.visit_referrals (company_id);
create index if not exists idx_lab_results_company         on public.lab_results (company_id);
create index if not exists idx_service_lab_params_company  on public.service_lab_params (company_id);

-- kembaran persis dari product_suppliers_product_id_supplier_id_key
drop index if exists public.uq_product_supplier;

-- ── 4. search_path pada fungsi security definer yang tersisa ────────────
alter function public.auto_confirm_email()     set search_path = public, pg_temp;
alter function public.generate_kode_produk()   set search_path = public, pg_temp;
alter function public.generate_kode_supplier() set search_path = public, pg_temp;
