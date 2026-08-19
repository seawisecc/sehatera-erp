-- ============================================================
-- Uji migrasi 0055: kredensial faskes
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Rahasia yang dipakai di sini bukan kredensial siapa pun: ia dikarang di
-- tempat, dan seluruh percobaannya dibatalkan di baris terakhir.

do $$
declare
  v_co   uuid;
  v_out  jsonb;
  v_row  record;
  v_n    integer;
  v_sid  uuid;
  v_teks text;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;

  -- 1. Tabelnya TIDAK boleh punya policy --------------------------------------
  -- Ini inti migrasi ini. RLS menyaring baris, bukan kolom, jadi policy apa pun
  -- yang mengizinkan pemilik melihat daftar kredensialnya otomatis mengizinkan
  -- ia membaca `secret_id`.
  select count(*) into v_n from pg_policies
   where schemaname = 'public' and tablename = 'faskes_credentials';
  if v_n > 0 then
    raise exception 'faskes_credentials punya % policy. PostgREST jadi bisa membacanya langsung.', v_n;
  end if;

  select count(*) into v_n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = 'faskes_credentials' and c.relrowsecurity;
  if v_n <> 1 then
    raise exception 'RLS tidak menyala di faskes_credentials.';
  end if;

  -- 2. Memasang, dan yang dikembalikan tidak membawa penunjuknya --------------
  v_out := public.simpan_kredensial('satusehat', 'sandbox',
    jsonb_build_object('client_id', 'UJI-CLIENT', 'organization_id', 'UJI-ORG'),
    jsonb_build_object('client_secret', 'rahasia-karangan-uji-0055'),
    v_co);

  if (v_out ->> 'terpasang')::boolean is not true then
    raise exception 'Kredensial tersimpan tapi dilaporkan belum terpasang.';
  end if;
  if v_out ? 'secret_id' or v_out ? 'rahasia' then
    raise exception 'Jawaban simpan_kredensial membawa penunjuk atau rahasianya: %', v_out;
  end if;

  -- 3. Yang tersimpan di tabel benar-benar SANDI, bukan teks -------------------
  select * into v_row from public.faskes_credentials
   where company_id = v_co and sistem = 'satusehat' and lingkungan = 'sandbox';
  if v_row.secret_id is null then
    raise exception 'secret_id kosong padahal rahasianya dikirim.';
  end if;

  select s.secret into v_teks from vault.secrets s where s.id = v_row.secret_id;
  if v_teks is null then
    raise exception 'Secret tidak ada di Vault.';
  end if;
  if position('rahasia-karangan-uji-0055' in v_teks) > 0 then
    raise exception 'Rahasianya tersimpan sebagai teks terang di Vault. Enkripsinya tidak jalan.';
  end if;

  -- 4. Metadata TIDAK pernah membawa rahasia atau penunjuknya ------------------
  -- Ujinya menyebut kuncinya satu per satu dengan sengaja. Kalau ditulis
  -- sebagai "tidak boleh ada kunci selain ini", kunci baru mana pun akan lolos
  -- diam-diam, dan yang bocor di sini adalah kunci sistem nasional.
  v_out := public.kredensial_faskes(v_co);
  if not exists (select 1 from jsonb_array_elements(v_out) x
                  where x ->> 'sistem' = 'satusehat' and (x ->> 'terpasang')::boolean) then
    raise exception 'Kredensial yang baru dipasang tidak muncul di daftar: %', v_out;
  end if;
  if exists (select 1 from jsonb_array_elements(v_out) x
              where x ? 'secret_id' or x ? 'rahasia' or x ? 'client_secret'
                 or x ? 'secret' or x ? 'decrypted_secret') then
    raise exception 'kredensial_faskes membocorkan rahasia atau penunjuknya: %', v_out;
  end if;
  if v_out::text like '%rahasia-karangan-uji-0055%' then
    raise exception 'Rahasianya ikut keluar lewat kredensial_faskes.';
  end if;

  -- 5. Bagian publiknya memang terbaca -----------------------------------------
  if not exists (select 1 from jsonb_array_elements(v_out) x
                  where x -> 'publik' ->> 'client_id' = 'UJI-CLIENT') then
    raise exception 'Bagian publik tidak terbaca, padahal justru itu yang perlu dicocokkan petugas.';
  end if;

  -- 6. Memasang ulang MENGGANTI, tidak menumpuk --------------------------------
  v_sid := v_row.secret_id;
  perform public.simpan_kredensial('satusehat', 'sandbox',
    jsonb_build_object('client_id', 'UJI-CLIENT-2'),
    jsonb_build_object('client_secret', 'rahasia-kedua-uji-0055'), v_co);

  select count(*) into v_n from public.faskes_credentials
   where company_id = v_co and sistem = 'satusehat' and lingkungan = 'sandbox';
  if v_n <> 1 then
    raise exception 'Pemasangan ulang membuat % baris.', v_n;
  end if;

  select * into v_row from public.faskes_credentials
   where company_id = v_co and sistem = 'satusehat' and lingkungan = 'sandbox';
  if v_row.secret_id <> v_sid then
    raise exception 'Pemasangan ulang membuat secret BARU di Vault. Yang lama menggantung tanpa ada yang tahu.';
  end if;

  select count(*) into v_n from vault.secrets
   where name = 'sehatera:' || v_co::text || ':satusehat:sandbox';
  if v_n <> 1 then
    raise exception 'Ada % secret bernama sama di Vault.', v_n;
  end if;

  -- 7. Bagian publik bisa diperbaiki tanpa mengetik ulang rahasianya ----------
  perform public.simpan_kredensial('satusehat', 'sandbox',
    jsonb_build_object('client_id', 'UJI-CLIENT-3'), null, v_co);
  select * into v_row from public.faskes_credentials
   where company_id = v_co and sistem = 'satusehat' and lingkungan = 'sandbox';
  if v_row.secret_id is null then
    raise exception 'Memperbaiki bagian publik menghapus rahasianya.';
  end if;
  if v_row.publik ->> 'client_id' <> 'UJI-CLIENT-3' then
    raise exception 'Bagian publik tidak berubah.';
  end if;

  -- 8. Yang keluar lewat jalur server memang rahasianya --------------------
  v_out := public.ambil_kredensial(v_co, 'satusehat', 'sandbox');
  if v_out -> 'rahasia' ->> 'client_secret' <> 'rahasia-kedua-uji-0055' then
    raise exception 'Rahasia yang keluar bukan yang terakhir dipasang: %', v_out -> 'rahasia';
  end if;

  -- 9. `authenticated` tidak boleh memanggilnya --------------------------------
  -- Kunci anon ada di dalam peramban setiap pengguna. Kalau fungsi ini terbuka,
  -- Vault berhenti berarti apa pun.
  if has_function_privilege('authenticated',
       'public.ambil_kredensial(uuid, text, text)', 'execute') then
    raise exception 'ambil_kredensial bisa dipanggil authenticated. Kunci anon jadi cukup untuk mengambil client secret.';
  end if;
  if not has_function_privilege('authenticated',
       'public.kredensial_faskes(uuid)', 'execute') then
    raise exception 'kredensial_faskes tidak bisa dipanggil aplikasi, jadi layarnya tidak akan pernah terisi.';
  end if;

  -- 10. Sistem dan lingkungan di luar daftar ditolak ---------------------------
  begin
    perform public.simpan_kredensial('satusehat', 'staging', '{}'::jsonb, null, v_co);
    raise exception 'Lingkungan asing diterima.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.simpan_kredensial('kemenkes_lama', 'sandbox', '{}'::jsonb, null, v_co);
    raise exception 'Sistem asing diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 11. Sandbox dan produksi hidup berdampingan --------------------------------
  perform public.simpan_kredensial('satusehat', 'produksi', '{}'::jsonb,
    jsonb_build_object('client_secret', 'rahasia-produksi-uji-0055'), v_co);
  select count(*) into v_n from public.faskes_credentials
   where company_id = v_co and sistem = 'satusehat';
  if v_n <> 2 then
    raise exception 'Sandbox dan produksi tidak bisa berdampingan: cuma ada % baris.', v_n;
  end if;

  raise exception 'SEMUA UJI LULUS. Rahasianya di Vault, tabelnya tidak bisa dibaca PostgREST, dan tidak ada jalan membaca balik dari layar.';
end $$;
