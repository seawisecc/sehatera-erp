-- ============================================================
-- 0086  Permintaan penunjang di luar katalog berhenti gagal
-- ============================================================
--
-- Ditemukan 28 September 2026, bukan oleh keluhan melainkan oleh
-- supabase/uji/0061_penunjang.sql yang dijalankan ulang saat audit:
--
--   55000: record "v_svc" is not assigned yet
--
-- `minta_penunjang()` membaca `v_svc.kode_loinc` DI LUAR blok
-- `if p_service is not null`. Kalau dokter meminta pemeriksaan yang tidak ada
-- di katalog Layanan, `v_svc` tidak pernah diisi, dan PL/pgSQL menolak
-- membaca field dari record yang belum pernah diisi. Akibatnya SETIAP
-- permintaan lab atau radiologi di luar katalog gagal, padahal migrasi 0061
-- justru menjanjikan "yang di luar katalog tetap boleh diminta, tapi tidak
-- menagih". Pesan yang sampai ke dokter cuma "coba lagi sebentar lagi",
-- karena 55000 bukan kode SH.
--
-- Perbaikannya: LOINC dari katalog disalin ke variabel biasa DI DALAM blok
-- katalog. Variabel biasa yang tidak diisi bernilai null, bukan galat.
--
-- Disulam ke definisi yang SEDANG BERLAKU (pg_get_functiondef), bukan disalin
-- dari berkas migrasi lama, sama seperti 0081. Sesudah menulis, definisinya
-- dibaca ulang; kalau salah satu jahitan tidak ada, migrasinya GAGAL alih-alih
-- melapor berhasil sambil membiarkan fungsinya seperti semula.

do $$
declare
  v_def  text;
  v_baru text;
begin
  select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'minta_penunjang';

  if v_def is null then
    raise exception 'minta_penunjang tidak ditemukan';
  end if;

  v_baru := replace(v_def,
    '  v_svc     record;',
    E'  v_svc     record;\n  v_loinc   text;');

  v_baru := replace(v_baru,
    'from public.service_lab_params p where p.service_id = v_svc.id;',
    E'from public.service_lab_params p where p.service_id = v_svc.id;\n\n    -- Disalin di SINI, di dalam blok katalog: di luar blok ini v_svc\n    -- tidak pernah diisi, dan membacanya melempar 55000 (migrasi 0086).\n    v_loinc := v_svc.kode_loinc;');

  v_baru := replace(v_baru,
    'coalesce(nullif(trim(p_loinc), ''''), v_svc.kode_loinc)',
    'coalesce(nullif(trim(p_loinc), ''''), v_loinc)');

  execute v_baru;

  -- Periksa jahitannya sendiri.
  select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'minta_penunjang';

  if position('v_loinc   text;' in v_def) = 0
     or position('v_loinc := v_svc.kode_loinc;' in v_def) = 0
     or position(', v_loinc)' in v_def) = 0
     or position('v_svc.kode_loinc)' in v_def) > 0 then
    raise exception 'Jahitan minta_penunjang tidak lengkap; migrasi 0086 dibatalkan.';
  end if;
end $$;
