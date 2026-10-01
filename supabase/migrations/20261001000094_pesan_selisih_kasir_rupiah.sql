-- ============================================================
-- 0094  Pesan selisih tutup kasir memakai format rupiah
-- ============================================================
--
-- `tutup_kasir()` menolak selisih tanpa catatan dengan pesan berisi angka
-- dari to_char(..., 'FM999G999G999'). Huruf G mengikuti lc_numeric server,
-- yang berbahasa Inggris, jadi kasir membaca "Ada selisih -5,000": koma,
-- padahal seluruh aplikasi menulis rupiah dengan titik. Ketahuan
-- 1 Oktober 2026 saat menguji tutup kasir di layar.
--
-- Disulam ke definisi yang SEDANG BERLAKU (pg_get_functiondef), bukan disalin
-- dari berkas 0091, alasan yang sama dengan 0081. Jangkar yang meleset akan
-- membuat replace() diam-diam tidak mengubah apa pun, jadi hasilnya dibaca
-- ulang dan dibatalkan kalau jahitannya tidak ada.

do $$
declare
  v_oid oid;
  v_def text;
  v_baru text;
begin
  select p.oid into v_oid from pg_proc p
   where p.proname = 'tutup_kasir' and p.pronamespace = 'public'::regnamespace;
  if v_oid is null then
    raise exception 'tutup_kasir() tidak ditemukan; migrasi 0094 dibatalkan.';
  end if;

  v_def := pg_get_functiondef(v_oid);
  v_baru := replace(v_def,
    $a$'Ada selisih % antara$a$,
    $b$'Ada selisih Rp % antara$b$);
  v_baru := replace(v_baru,
    $a$to_char(p_kas_dihitung - v_harus, 'FM999G999G999')$a$,
    $b$replace(to_char(p_kas_dihitung - v_harus, 'FM999,999,999,990'), ',', '.')$b$);

  if v_baru = v_def then
    raise exception 'Jangkar tutup_kasir() tidak ditemukan; migrasi 0094 dibatalkan.';
  end if;
  execute v_baru;

  v_def := pg_get_functiondef(v_oid);
  if position($c$'FM999,999,999,990'), ',', '.')$c$ in v_def) = 0
     or position('Ada selisih Rp %' in v_def) = 0 then
    raise exception 'tutup_kasir() tidak memuat format baru; migrasi 0094 dibatalkan.';
  end if;
end $$;
