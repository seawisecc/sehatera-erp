-- ============================================================
-- Uji migrasi 0076: nomor Procedure untuk tindakan
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare v_n integer;
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'visit_charges'
                    and column_name = 'ihs_procedure_id') then
    raise exception 'visit_charges.ihs_procedure_id tidak ada.';
  end if;

  -- Indeks parsialnya ada, dan syaratnya menyebut `tindakan`. Kalau syaratnya
  -- hilang, pemindaian ikut menarik biaya administrasi dan tarif konsultasi,
  -- yang bukan tindakan medis.
  select count(*) into v_n from pg_indexes
   where schemaname = 'public' and indexname = 'idx_charges_ihs_belum'
     and indexdef like '%tindakan%';
  if v_n <> 1 then
    raise exception 'Indeks idx_charges_ihs_belum tidak ada atau tidak menyaring jenis tindakan.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
