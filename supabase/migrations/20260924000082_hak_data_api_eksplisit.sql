-- ============================================================
-- 0082  Hak Data API ditulis sendiri, tidak lagi diberikan Supabase
-- ============================================================
--
-- Mulai 30 Oktober 2026 Supabase BERHENTI memberi hak Data API secara
-- otomatis pada tabel baru di skema public. Tabel yang sudah ada tetap
-- memegang haknya, jadi produksi tidak berubah apa pun. Yang berubah adalah
-- tabel yang lahir SESUDAH tanggal itu, termasuk yang lahir dari migrasi:
-- project baru, preview branch, dan `supabase db reset`.
--
-- Artinya seluruh folder ini, dijalankan dari nol sesudah 30 Oktober,
-- menghasilkan database yang tabelnya ada semua tapi tidak satu pun terbaca
-- aplikasi. Tidak ada migrasi yang gagal: yang terlihat cuma "permission
-- denied" di peramban, di layar pertama yang dibuka.
--
-- Migrasi yang sudah dijalankan tidak boleh disunting, jadi hak seluruh
-- tabel lama ditulis di SINI, sekali, sesudah semuanya lahir.
--
--
-- ## Isinya SALINAN keadaan produksi, bukan rancangan baru
--
-- Daftar di bawah dibaca dari database produksi pada 24 September 2026
-- (`aclexplode` atas `pg_class.relacl`), bukan dari berkas migrasi:
-- berkas cuma tahu keadaan saat ia ditulis, aturan yang sama dengan
-- `pg_get_viewdef`.
--
-- - 52 tabel: anon, authenticated, dan service_role memegang SELECT, INSERT,
--   UPDATE, DELETE. Seluruhnya ber-RLS, dan RLS itulah penjaganya, bukan
--   hak ini.
-- - `v_company_quota`: ketiganya, persis seperti tabel.
-- - `v_antrean_hari_ini` dan `v_resep_menunggu`: TANPA anon. Anon dicabut
--   sengaja sejak 0016 dan 0023, karena view tidak tunduk pada RLS
--   tabelnya seperti tabel tunduk pada policy-nya. Memberi anon di sini
--   berarti membuka antrean pasien untuk kunci yang ada di dalam peramban.
-- - Sequence: USAGE dan SELECT. `nextval()` pada nilai bawaan kolom
--   berjalan sebagai peran yang meng-INSERT, jadi tabel yang boleh diisi
--   tapi sequence-nya tidak boleh dipakai gagal di tiap baris baru.
--
-- Di produksi seluruh pernyataan ini tidak melakukan apa pun: haknya sudah
-- ada. `grant` atas hak yang sudah dipegang tidak mengeluh.
--
--
-- ## Yang sengaja TIDAK dilakukan
--
-- **Tidak memasang `alter default privileges` untuk menghidupkan lagi
-- pemberian otomatisnya.** Itu persis kebiasaan yang sedang dibuang Supabase:
-- tabel yang lahir terbuka tanpa ada yang memutuskannya. Aturan yang sama
-- dengan layar antrean ruang tunggu (0041): yang tampil ditulis sebagai yang
-- MASUK, bukan sebagai yang tidak dikeluarkan.
--
-- **Tidak mempersempit hak anon pada tabel.** Anon memegang DML penuh di
-- produksi, dan yang menahannya RLS. Mempersempitnya mungkin benar, tapi itu
-- perubahan perilaku yang harus dibuktikan di peramban (halaman harga,
-- pendaftaran, layar antrean), bukan diselipkan di migrasi yang tugasnya
-- menyalin.
--
-- **Tidak memakai perulangan atas `information_schema.tables`.** Perulangan
-- memberi hak pada apa pun yang kebetulan ada, termasuk tabel yang nanti
-- sengaja dibiarkan tertutup. Daftarnya harfiah supaya terbaca.
--
--
-- ## Mulai sekarang
--
-- **Tiap migrasi yang membuat tabel atau view di public WAJIB menulis
-- grant-nya di migrasi yang sama.** `supabase/uji/0082_hak_data_api.sql`
-- menolak tabel public mana pun yang tidak terjangkau authenticated dan
-- service_role, dan menolak anon pada kedua view antrean.

-- ── Tabel ─────────────────────────────────────────────────────
grant select, insert, update, delete on
  public.app_users,
  public.audit_logs,
  public.billing_invoices,
  public.claims,
  public.clinic_units,
  public.companies,
  public.company_groups,
  public.doctor_schedules,
  public.faktur,
  public.faskes_credentials,
  public.icd10,
  public.icd10_alias,
  public.icd9cm,
  public.icd_kata,
  public.insurers,
  public.invitations,
  public.lab_results,
  public.outbound_messages,
  public.outlet_aktif,
  public.patients,
  public.pemusnahan,
  public.plans,
  public.po_items,
  public.prescription_items,
  public.prescriptions,
  public.product_batches,
  public.product_suppliers,
  public.products,
  public.purchase_orders,
  public.reservations,
  public.retur_supplier,
  public.service_lab_params,
  public.services,
  public.settings,
  public.subscription_events,
  public.super_admins,
  public.suppliers,
  public.transaction_item_batches,
  public.transaction_items,
  public.transactions,
  public.trial_grants,
  public.unit_doctors,
  public.visit_addenda,
  public.visit_charges,
  public.visit_diagnoses,
  public.visit_notes,
  public.visit_penunjang,
  public.visit_referrals,
  public.visit_status_log,
  public.visit_vitals,
  public.visits,
  public.webhook_events
to anon, authenticated, service_role;

-- ── View ──────────────────────────────────────────────────────
grant select, insert, update, delete on public.v_company_quota
  to anon, authenticated, service_role;

-- Tanpa anon: lihat catatan di atas.
grant select, insert, update, delete on
  public.v_antrean_hari_ini,
  public.v_resep_menunggu
to authenticated, service_role;

-- ── Sequence ──────────────────────────────────────────────────
grant usage, select on
  public.product_kode_seq,
  public.nomor_transaksi_seq,
  public.supplier_kode_seq,
  public.po_nomor_seq,
  public.ba_musnahkan_seq,
  public.retur_seq
to anon, authenticated, service_role;
