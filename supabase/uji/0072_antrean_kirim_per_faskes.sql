-- ============================================================
-- Uji migrasi 0072: antrean kirim per faskes
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Yang dibuktikan, dan yang ketiga adalah seluruh alasan migrasi ini ada:
-- fungsinya cuma SATU (tidak berkembar), penyaring faskes benar-benar
-- menyaring, dan baris faskes LAIN tidak ikut naik `percobaan`-nya.

do $$
declare
  v_a    uuid;
  v_b    uuid;
  v_ra   uuid;
  v_rb   uuid;
  v_out  jsonb;
  v_n    integer;
  v_coba integer;
begin
  select id into v_a from public.companies where nama = 'Klinik Rexco 88' limit 1;
  select id into v_b from public.companies where id <> v_a and deleted_at is null limit 1;
  if v_a is null or v_b is null then
    raise exception 'Butuh dua faskes untuk menguji pemisahannya.';
  end if;

  -- ── 1. Fungsinya cuma satu ───────────────────────────────────────────────
  select count(*) into v_n
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'ambil_antrean_kirim';
  if v_n <> 1 then
    raise exception 'Ada % versi ambil_antrean_kirim. Panggilannya ambigu, seperti migrasi 0048.', v_n;
  end if;

  -- ── 2. Tertutup untuk anon dan authenticated ─────────────────────────────
  if has_function_privilege('anon', 'public.ambil_antrean_kirim(text, integer, uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.ambil_antrean_kirim(text, integer, uuid)', 'execute') then
    raise exception 'ambil_antrean_kirim terbuka di luar jalur server.';
  end if;

  -- ── 3. Dua baris, dua faskes ─────────────────────────────────────────────
  insert into public.outbound_messages (company_id, sistem, resource, payload, kunci_idempoten)
  values (v_a, 'satusehat', 'Encounter', '{"uji":"a"}'::jsonb, 'uji-0072-a')
  returning id into v_ra;
  insert into public.outbound_messages (company_id, sistem, resource, payload, kunci_idempoten)
  values (v_b, 'satusehat', 'Encounter', '{"uji":"b"}'::jsonb, 'uji-0072-b')
  returning id into v_rb;

  -- ── 4. Mengambil milik faskes A saja ─────────────────────────────────────
  v_out := public.ambil_antrean_kirim('satusehat', 50, v_a);

  if not exists (select 1 from jsonb_array_elements(v_out) e where (e ->> 'id')::uuid = v_ra) then
    raise exception 'Baris faskes A tidak ikut terambil.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_out) e where (e ->> 'id')::uuid = v_rb) then
    raise exception 'Baris faskes B ikut terambil padahal disaring ke faskes A.';
  end if;

  -- ── 5. Yang penting: percobaan faskes B TIDAK naik ───────────────────────
  -- Kalau ini gagal, kiriman klinik sebelah akan `ditinggalkan` tanpa pernah
  -- sekali pun benar-benar dicoba, dan sebabnya ada di tenant lain.
  select percobaan into v_coba from public.outbound_messages where id = v_rb;
  if v_coba <> 0 then
    raise exception 'Percobaan baris faskes B naik jadi % padahal tidak diambil.', v_coba;
  end if;

  select percobaan into v_coba from public.outbound_messages where id = v_ra;
  if v_coba <> 1 then
    raise exception 'Percobaan baris faskes A seharusnya 1, bukan %.', v_coba;
  end if;

  -- ── 6. Tanpa faskes tetap mengambil semuanya ─────────────────────────────
  update public.outbound_messages set status = 'antre', percobaan = 0, kirim_setelah = now()
   where id in (v_ra, v_rb);
  v_out := public.ambil_antrean_kirim('satusehat', 50, null);
  if not exists (select 1 from jsonb_array_elements(v_out) e where (e ->> 'id')::uuid = v_rb) then
    raise exception 'Tanpa penyaring faskes, baris faskes B seharusnya ikut terambil.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
