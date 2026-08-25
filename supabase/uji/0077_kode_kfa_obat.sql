-- ============================================================
-- Uji migrasi 0077: kode KFA di produk
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co uuid;
  v_id uuid;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then raise exception 'Klinik contoh tidak ditemukan.'; end if;
  select id into v_id from public.products where company_id = v_co limit 1;
  if v_id is null then raise exception 'Tidak ada produk di klinik contoh.'; end if;

  -- ── 1. Kode template (92) diterima ───────────────────────────────────────
  update public.products set kode_kfa = '92000001' where id = v_id;

  -- ── 2. Kode aktual (93) diterima ─────────────────────────────────────────
  update public.products set kode_kfa = '93000001' where id = v_id;

  -- ── 3. Kosong tetap boleh ────────────────────────────────────────────────
  -- Perbekalan non-obat seperti kasa dan spuit tidak selalu ada di KFA, dan
  -- tidak pernah ikut berangkat sebagai Medication.
  update public.products set kode_kfa = null where id = v_id;

  -- ── 4. Bentuk yang salah DITOLAK ─────────────────────────────────────────
  begin
    update public.products set kode_kfa = '12345678' where id = v_id;
    raise exception 'Kode diawali 12 diterima, seharusnya ditolak.';
  exception when check_violation then null;
  end;

  begin
    update public.products set kode_kfa = '9200' where id = v_id;
    raise exception 'Kode empat angka diterima, seharusnya ditolak.';
  exception when check_violation then null;
  end;

  begin
    update public.products set kode_kfa = 'parasetamol' where id = v_id;
    raise exception 'Kode berupa huruf diterima, seharusnya ditolak.';
  exception when check_violation then null;
  end;

  raise exception 'SEMUA UJI LULUS';
end $$;
