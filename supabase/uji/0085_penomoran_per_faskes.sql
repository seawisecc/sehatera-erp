-- ============================================================
-- UJI 0085  Penomoran per faskes sungguhan berlaku
-- ============================================================
--
-- BUKAN migrasi. Tidak mengubah apa pun: blok ini diakhiri raise exception
-- sehingga seluruh percobaannya dibatalkan. Yang benar cuma satu keluaran:
-- galat terakhir berbunyi "SEMUA UJI LULUS".
--
-- Yang diperiksa adalah hal yang dulu gagal DIAM-DIAM: trigger lama yang
-- menang karena urutan abjad, indeks unik global yang akan menolak faskes
-- kedua, dan fungsi penomoran yang bisa dipanggil tanpa login.

do $$
declare
  v_a uuid;
  v_b uuid;
  v_na text;
  v_nb text;
  v_n int;
begin
  -- 1. Tidak ada lagi trigger penomoran lama.
  select count(*) into v_n from pg_trigger
   where not tgisinternal
     and tgname in ('set_nomor_transaksi', 'set_nomor_po', 'set_nomor_ba',
                    'set_nomor_retur', 'trg_set_nomor_retur',
                    'trg_nomor_trx', 'trg_nomor_po', 'trg_nomor_pemusnahan', 'trg_nomor_retur');
  if v_n <> 0 then
    raise exception 'GAGAL 1: masih ada % trigger penomoran lama', v_n;
  end if;

  -- 2. Tiap trigger penomoran berjalan SESUDAH trg_set_company_id. PostgreSQL
  --    mengurutkan trigger BEFORE menurut nama, jadi nama itulah urutannya.
  select count(*) into v_n from pg_trigger t
   where not t.tgisinternal and t.tgname like 'trg_z_nomor_%'
     and exists (select 1 from pg_trigger s
                  where s.tgrelid = t.tgrelid and s.tgname = 'trg_set_company_id'
                    and s.tgname < t.tgname);
  if v_n <> 4 then
    raise exception 'GAGAL 2: baru % dari 4 trigger penomoran jalan sesudah company_id terisi', v_n;
  end if;

  -- 3. Indeks unik GLOBAL sudah tidak ada; yang per faskes tetap.
  if exists (select 1 from pg_indexes where schemaname = 'public'
              and indexname in ('transactions_nomor_transaksi_key', 'purchase_orders_nomor_po_key')) then
    raise exception 'GAGAL 3: indeks unik global nomor masih ada';
  end if;
  if (select count(*) from pg_indexes where schemaname = 'public'
       and indexname in ('uq_trx_nomor_per_company', 'uq_po_nomor_per_company',
                         'uq_pemusnahan_nomor_per_company', 'uq_retur_nomor_per_company')) <> 4 then
    raise exception 'GAGAL 3b: indeks unik per faskes hilang';
  end if;

  -- 4. next_doc_number tidak bisa dipanggil dari luar.
  if has_function_privilege('anon', 'public.next_doc_number(uuid,text,text,text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.next_doc_number(uuid,text,text,text,text)', 'execute') then
    raise exception 'GAGAL 4: next_doc_number masih bisa dipanggil anon/authenticated';
  end if;

  -- 5. Dua faskes berbeda sama-sama mendapat nomor pertama di bentuk baru.
  select id into v_a from public.companies order by created_at limit 1;
  select id into v_b from public.companies where id <> v_a order by created_at limit 1;
  v_na := public.next_doc_number(v_a, 'transactions', 'nomor_transaksi', 'TRX', '2099');
  v_nb := public.next_doc_number(v_b, 'transactions', 'nomor_transaksi', 'TRX', '2099');
  if v_na <> 'TRX/2099/0001' or v_nb <> 'TRX/2099/0001' then
    raise exception 'GAGAL 5: nomor pertama dua faskes % dan %', v_na, v_nb;
  end if;

  -- 6. Faskes kosong ditolak, bukan dinomori dari baris milik siapa pun.
  begin
    perform public.next_doc_number(null, 'transactions', 'nomor_transaksi', 'TRX', '2099');
    raise exception 'GAGAL 6: nomor tanpa faskes tidak ditolak';
  exception when sqlstate 'SH004' then null;
  end;

  raise exception 'SEMUA UJI LULUS';
end $$;
