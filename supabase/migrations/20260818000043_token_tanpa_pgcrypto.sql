-- ============================================================
-- 0043  Token antrean tanpa pgcrypto
-- ============================================================
--
-- `token_antrean_saya()` gagal dengan SQLSTATE 42883 (undefined_function)
-- saat ditekan dari aplikasi, padahal fungsinya jelas ada.
--
-- Sebabnya `gen_random_bytes()` milik pgcrypto, dan di Supabase pgcrypto
-- dipasang di skema `extensions`, bukan `public`. Fungsi ini mengunci
-- `set search_path = public, pg_temp` (dan memang harus, itu penjaga terhadap
-- pembajakan search_path pada fungsi security definer), jadi ia tidak bisa
-- melihat `extensions.gen_random_bytes`.
--
-- Yang menyamarkannya: berkas uji memakai `gen_random_bytes` di dalam blok
-- `do $$` biasa, yang berjalan dengan search_path bawaan SQL Editor dan
-- MEMANG bisa melihat skema `extensions`. Jadi ujinya lulus sementara
-- aplikasinya gagal. Pelajaran: fungsi ber-`search_path` terkunci tidak boleh
-- diuji lewat blok yang search_path-nya tidak terkunci.
--
-- Perbaikannya bukan menambahkan `extensions` ke search_path, melainkan
-- MEMBUANG ketergantungannya: `gen_random_uuid()` ada di inti PostgreSQL
-- sejak versi 13, selalu terlihat, dan dua di antaranya sudah memberi 64
-- huruf acak. Ketergantungan yang tidak ada tidak bisa hilang lagi nanti.

create or replace function public.token_antrean_saya(p_putar boolean default false)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co    uuid := public.auth_company_id();
  v_token text;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  select token_antrean into v_token from public.settings where company_id = v_co;

  if v_token is null or coalesce(p_putar, false) then
    -- 64 huruf heksadesimal dari dua uuid acak. Bukan id fasilitas: id itu
    -- muncul di banyak tempat lain, dan kunci yang sama dengan pengenal
    -- bukan kunci.
    v_token := replace(gen_random_uuid()::text, '-', '')
            || replace(gen_random_uuid()::text, '-', '');
    update public.settings set token_antrean = v_token where company_id = v_co;
    perform public.catat_audit(v_co, 'antrean.token', 'settings', v_co::text,
      jsonb_build_object('diputar', coalesce(p_putar, false)));
  end if;

  return v_token;
end;
$$;

revoke all on function public.token_antrean_saya(boolean) from public, anon;
grant execute on function public.token_antrean_saya(boolean) to authenticated;
