-- ============================================================
-- Uji migrasi 0075: antre ulang yang ditinggalkan
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.
--
-- Yang dibuktikan ada EMPAT, dan tiga di antaranya adalah hal yang TIDAK boleh
-- terjadi. Fungsi yang mengganti payload terlalu bersemangat jauh lebih
-- berbahaya daripada yang tidak mengganti sama sekali: cuplikan yang sudah
-- terkirim adalah catatan tentang apa yang benar-benar dikirim ke sistem
-- nasional, dan catatan yang bisa berubah bukan catatan.

do $$
declare
  v_co   uuid;
  v_out  jsonb;
  v_id   uuid;
  v_row  record;
begin
  select id into v_co from public.companies where nama = 'Klinik Rexco 88' limit 1;
  if v_co is null then raise exception 'Klinik contoh tidak ditemukan.'; end if;

  -- ── 1. Baris baru: baru = true, diulang = false ──────────────────────────
  v_out := public.antre_kirim('satusehat', 'Encounter', 'uji-0075',
             '{"versi":"lama"}'::jsonb, 'visits', null, v_co);
  if not (v_out ->> 'baru')::boolean then raise exception 'Baris pertama tidak dianggap baru.'; end if;
  if (v_out ->> 'diulang')::boolean then raise exception 'Baris pertama tidak boleh bertanda diulang.'; end if;
  v_id := (v_out ->> 'id')::uuid;

  -- ── 2. Yang masih `antre` TIDAK boleh ditimpa ────────────────────────────
  -- Mengganti payload di bawah kaki pengirim yang sedang berjalan adalah cara
  -- membuat dua kiriman berbeda dengan satu kunci.
  v_out := public.antre_kirim('satusehat', 'Encounter', 'uji-0075',
             '{"versi":"baru"}'::jsonb, 'visits', null, v_co);
  if (v_out ->> 'baru')::boolean then raise exception 'Baris yang sudah ada dianggap baru.'; end if;
  if (v_out ->> 'diulang')::boolean then raise exception 'Baris yang masih antre ikut dibangkitkan.'; end if;
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.payload ->> 'versi' <> 'lama' then
    raise exception 'Payload yang masih antre tertimpa jadi %.', v_row.payload ->> 'versi';
  end if;

  -- ── 3. Yang `terkirim` TIDAK boleh ditimpa ───────────────────────────────
  -- Ini yang paling penting: cuplikan yang sudah sampai adalah catatan tentang
  -- apa yang benar-benar dikirim.
  update public.outbound_messages set status = 'terkirim', terkirim_pada = now() where id = v_id;
  v_out := public.antre_kirim('satusehat', 'Encounter', 'uji-0075',
             '{"versi":"baru"}'::jsonb, 'visits', null, v_co);
  if (v_out ->> 'diulang')::boolean then raise exception 'Baris yang sudah terkirim ikut dibangkitkan.'; end if;
  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.payload ->> 'versi' <> 'lama' or v_row.status <> 'terkirim' then
    raise exception 'Baris terkirim berubah: payload=% status=%.', v_row.payload ->> 'versi', v_row.status;
  end if;

  -- ── 4. Yang `ditinggalkan` DIBANGKITKAN dengan payload baru ──────────────
  update public.outbound_messages
     set status = 'ditinggalkan', percobaan = 6, galat_terakhir = 'bentuk lama salah',
         kirim_setelah = now() + interval '1 day'
   where id = v_id;

  v_out := public.antre_kirim('satusehat', 'Condition', 'uji-0075',
             '{"versi":"baru"}'::jsonb, 'visit_diagnoses', 'xyz', v_co);
  if (v_out ->> 'baru')::boolean then raise exception 'Yang dibangkitkan tidak boleh bertanda baru.'; end if;
  if not (v_out ->> 'diulang')::boolean then raise exception 'Yang ditinggalkan tidak dibangkitkan.'; end if;

  select * into v_row from public.outbound_messages where id = v_id;
  if v_row.payload ->> 'versi' <> 'baru' then
    raise exception 'Payload tidak diperbarui: %.', v_row.payload ->> 'versi';
  end if;
  if v_row.status <> 'antre' then raise exception 'Status tidak kembali ke antre: %.', v_row.status; end if;
  if v_row.percobaan <> 0 then raise exception 'Percobaan tidak dinolkan: %.', v_row.percobaan; end if;
  if v_row.galat_terakhir is not null then raise exception 'Galat lama tidak dibersihkan.'; end if;
  if v_row.kirim_setelah > now() then raise exception 'Jeda lama masih menahan, tidak dicoba sekarang.'; end if;
  -- Resource dan entity ikut diperbarui: bentuk yang dibetulkan bisa saja
  -- berpindah jenis kiriman, misalnya dari POST jadi PUT.
  if v_row.resource <> 'Condition' or v_row.entity_id <> 'xyz' then
    raise exception 'Resource atau entity tidak ikut diperbarui.';
  end if;

  raise exception 'SEMUA UJI LULUS';
end $$;
