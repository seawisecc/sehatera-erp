-- ============================================================
-- Uji migrasi 0056: antrean kirim idempoten
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_a    jsonb;
  v_b    jsonb;
  v_id   uuid;
  v_row  record;
  v_n    integer;
  v_amb  jsonb;
  v_sblm timestamptz;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;

  -- 1. Mengantre dua kali dengan kunci sama = SATU baris ----------------------
  -- Inti migrasi ini. Kunjungan yang dibuka lalu ditutup ulang tidak boleh
  -- berangkat dua kali ke SatuSehat.
  v_a := public.antre_kirim('satusehat', 'Encounter', 'UJI0056:enc:1',
           jsonb_build_object('resourceType', 'Encounter'), 'visits', 'uji-1', v_co);
  v_b := public.antre_kirim('satusehat', 'Encounter', 'UJI0056:enc:1',
           jsonb_build_object('resourceType', 'Encounter', 'berubah', true), 'visits', 'uji-1', v_co);

  if (v_a ->> 'id') <> (v_b ->> 'id') then
    raise exception 'Kunci yang sama melahirkan dua baris antrean.';
  end if;
  if (v_b ->> 'baru')::boolean is not false then
    raise exception 'Pengantrean kedua dilaporkan sebagai baris baru.';
  end if;

  v_id := (v_a ->> 'id')::uuid;

  -- Payload pertama TIDAK ditimpa: yang tercatat adalah keadaan saat diantre.
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.payload ? 'berubah' then
    raise exception 'Payload yang sudah antre ditimpa oleh pengantrean berikutnya.';
  end if;

  -- 2. Kunci kosong ditolak ----------------------------------------------------
  begin
    perform public.antre_kirim('satusehat', 'Patient', '   ', '{}'::jsonb, null, null, v_co);
    raise exception 'Kunci idempoten kosong diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 3. Sistem di luar daftar ditolak tabelnya ----------------------------------
  begin
    perform public.antre_kirim('kemenkes_lama', 'Patient', 'UJI0056:x', '{}'::jsonb, null, null, v_co);
    raise exception 'Sistem asing diterima.';
  exception when check_violation then null;
  end;

  -- 4. Mengambil menaikkan percobaan, dan yang belum waktunya tidak ikut -------
  update public.outbound_messages set kirim_setelah = now() + interval '1 hour'
   where id = v_id;
  v_amb := public.ambil_antrean_kirim('satusehat', 50);
  if exists (select 1 from jsonb_array_elements(v_amb) x where (x ->> 'id')::uuid = v_id) then
    raise exception 'Baris yang dijadwalkan satu jam lagi ikut terambil sekarang.';
  end if;

  update public.outbound_messages set kirim_setelah = now() - interval '1 minute'
   where id = v_id;
  v_amb := public.ambil_antrean_kirim('satusehat', 50);
  if not exists (select 1 from jsonb_array_elements(v_amb) x where (x ->> 'id')::uuid = v_id) then
    raise exception 'Baris yang sudah waktunya tidak terambil.';
  end if;

  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.percobaan <> 1 then
    raise exception 'Percobaan tercatat %, seharusnya 1. Pengirim yang mati di tengah tidak akan pernah terhitung.',
      v_row.percobaan;
  end if;

  -- 5. Gagal berarti dijadwalkan lebih jauh, bukan berhenti ---------------------
  v_sblm := v_row.kirim_setelah;
  perform public.tandai_gagal(v_id, 'Jaringan putus (uji)');
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.status <> 'antre' then
    raise exception 'Satu kegagalan langsung membuat baris berhenti dicoba: status %.', v_row.status;
  end if;
  if v_row.kirim_setelah <= v_sblm then
    raise exception 'Jeda tidak mundur sesudah gagal. Sistem yang sedang tumbang akan dihujani ulang.';
  end if;
  if v_row.galat_terakhir is null then
    raise exception 'Galatnya tidak dicatat, jadi tidak ada yang bisa dibaca orang.';
  end if;

  -- 6. Sesudah batasnya, MENYERAH itu keadaan, bukan diam ----------------------
  update public.outbound_messages set percobaan = 6, kirim_setelah = now() - interval '1 minute'
   where id = v_id;
  perform public.tandai_gagal(v_id, 'Menyerah (uji)', 6);
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.status <> 'ditinggalkan' then
    raise exception 'Sesudah enam percobaan barisnya masih %, jadi ia akan dicoba selamanya tanpa dilihat siapa pun.',
      v_row.status;
  end if;

  -- 7. Yang ditinggalkan tidak dibangunkan pengantrean berikutnya --------------
  v_b := public.antre_kirim('satusehat', 'Encounter', 'UJI0056:enc:1', '{}'::jsonb, null, null, v_co);
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.status <> 'ditinggalkan' then
    raise exception 'Pengantrean ulang menghidupkan kembali yang sudah diputuskan orang.';
  end if;

  -- 8. Yang ditinggalkan tidak ikut terambil -----------------------------------
  update public.outbound_messages set kirim_setelah = now() - interval '1 minute' where id = v_id;
  v_amb := public.ambil_antrean_kirim('satusehat', 50);
  if exists (select 1 from jsonb_array_elements(v_amb) x where (x ->> 'id')::uuid = v_id) then
    raise exception 'Baris yang ditinggalkan masih ikut terambil.';
  end if;

  -- 9. Terkirim mencatat waktunya dan membersihkan galatnya --------------------
  v_a := public.antre_kirim('satusehat', 'Condition', 'UJI0056:cond:1',
           jsonb_build_object('resourceType', 'Condition'), 'visit_diagnoses', 'uji-2', v_co);
  v_id := (v_a ->> 'id')::uuid;
  perform public.ambil_antrean_kirim('satusehat', 50);
  perform public.tandai_terkirim(v_id, 'IHS-UJI-1', jsonb_build_object('ok', true));
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.status <> 'terkirim' or v_row.terkirim_pada is null or v_row.id_luar <> 'IHS-UJI-1' then
    raise exception 'Penandaan terkirim tidak lengkap: status %, waktu %, id luar %.',
      v_row.status, v_row.terkirim_pada, v_row.id_luar;
  end if;

  -- 10. Yang sudah terkirim TIDAK berangkat lagi -------------------------------
  perform public.antre_kirim('satusehat', 'Condition', 'UJI0056:cond:1', '{}'::jsonb, null, null, v_co);
  select count(*) into v_n from public.outbound_messages
   where company_id = v_co and sistem = 'satusehat' and kunci_idempoten = 'UJI0056:cond:1';
  if v_n <> 1 then
    raise exception 'Ada % baris untuk kunci yang sudah terkirim.', v_n;
  end if;
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.status <> 'terkirim' then
    raise exception 'Yang sudah terkirim dibangunkan lagi jadi %. SatuSehat akan menerima kunjungan itu dua kali.',
      v_row.status;
  end if;

  -- 11. Jalur server saja untuk yang membawa payload ---------------------------
  -- Payloadnya berisi data pasien, dan pengambilnya juga yang memegang
  -- kredensial. Kunci anon ada di dalam peramban setiap pengguna.
  if has_function_privilege('authenticated', 'public.ambil_antrean_kirim(text, integer)', 'execute') then
    raise exception 'ambil_antrean_kirim terbuka untuk authenticated.';
  end if;
  if has_function_privilege('authenticated', 'public.tandai_terkirim(uuid, text, jsonb)', 'execute') then
    raise exception 'tandai_terkirim terbuka untuk authenticated: kiriman bisa dinyatakan berhasil dari peramban.';
  end if;
  if has_function_privilege('authenticated', 'public.tandai_gagal(uuid, text, integer)', 'execute') then
    raise exception 'tandai_gagal terbuka untuk authenticated.';
  end if;

  -- 12. Menulis langsung ke tabelnya tidak dibuka ------------------------------
  -- Policy-nya cuma SELECT. Kalau INSERT/UPDATE ikut terbuka, siapa pun yang
  -- tahu alamatnya bisa menandai kirimannya sendiri "terkirim" dan seluruh
  -- kunjungan hari itu tidak pernah sampai tanpa ada yang tahu.
  select count(*) into v_n from pg_policies
   where schemaname = 'public' and tablename = 'outbound_messages' and cmd <> 'SELECT';
  if v_n > 0 then
    raise exception 'outbound_messages punya % policy tulis. Kiriman bisa ditandai selesai dari peramban.', v_n;
  end if;

  -- 13. Ringkasan membawa yang tertua --------------------------------------
  v_a := public.ringkas_antrean_kirim(v_co);
  if not (v_a ? 'antre' and v_a ? 'ditinggalkan' and v_a ? 'tertua_antre') then
    raise exception 'Ringkasan tidak lengkap: %', v_a;
  end if;

  raise exception 'SEMUA UJI LULUS. Satu kejadian menghasilkan satu kiriman, kegagalan mundur berlipat, dan menyerah itu keadaan yang terlihat.';
end $$;
