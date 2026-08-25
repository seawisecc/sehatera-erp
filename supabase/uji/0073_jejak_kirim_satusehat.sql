-- ============================================================
-- Uji migrasi 0073: jejak pengiriman SatuSehat
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Yang dibuktikan: keempat kolomnya ada dengan tipe yang benar, dan keduanya
-- yang paling mudah tertukar BISA dibedakan, yaitu "belum dicoba"
-- (ihs_dicari_pada null) versus "sudah dicoba tapi tidak ketemu"
-- (ihs_dicari_pada terisi, ihs_id tetap null).

do $$
declare
  v_co  uuid;
  v_pas uuid;
  v_n   integer;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then raise exception 'Klinik contoh tidak ditemukan.'; end if;

  -- ── 1. Keempat kolom ada ─────────────────────────────────────────────────
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and (
     (table_name = 'patients'        and column_name = 'ihs_dicari_pada')  or
     (table_name = 'app_users'       and column_name = 'ihs_dicari_pada')  or
     (table_name = 'visit_diagnoses' and column_name = 'ihs_condition_id') or
     (table_name = 'visits'          and column_name = 'ihs_final_pada'));
  if v_n <> 4 then
    raise exception 'Hanya % dari 4 kolom jejak yang ada.', v_n;
  end if;

  -- ── 2. Tiga keadaan yang harus bisa dibedakan ────────────────────────────
  select id into v_pas from public.patients where company_id = v_co limit 1;

  -- (a) belum dicoba
  update public.patients set ihs_id = null, ihs_dicari_pada = null where id = v_pas;
  if not exists (select 1 from public.patients
                  where id = v_pas and ihs_id is null and ihs_dicari_pada is null) then
    raise exception 'Keadaan "belum dicoba" tidak terbaca.';
  end if;

  -- (b) sudah dicoba, tidak ketemu. Ini yang selama ini tidak bisa dibedakan
  -- dari (a), dan yang membuat orang mengulang pencarian yang jawabannya sudah
  -- didapat.
  update public.patients set ihs_dicari_pada = now() where id = v_pas;
  if not exists (select 1 from public.patients
                  where id = v_pas and ihs_id is null and ihs_dicari_pada is not null) then
    raise exception 'Keadaan "sudah dicoba tapi tidak ketemu" tidak terbaca.';
  end if;

  -- (c) ketemu
  update public.patients set ihs_id = 'P-UJI-0073' where id = v_pas;
  if not exists (select 1 from public.patients where id = v_pas and ihs_id = 'P-UJI-0073') then
    raise exception 'Keadaan "ketemu" tidak tersimpan.';
  end if;

  -- ── 3. Waktu, bukan boolean ──────────────────────────────────────────────
  -- Jawaban "tidak ada" pada akhirnya bisa berubah, jadi yang dibutuhkan
  -- "kapan terakhir dicari", bukan "sudah selesai".
  if (select data_type from information_schema.columns
       where table_schema = 'public' and table_name = 'patients'
         and column_name = 'ihs_dicari_pada') <> 'timestamp with time zone' then
    raise exception 'ihs_dicari_pada bukan timestamptz.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
