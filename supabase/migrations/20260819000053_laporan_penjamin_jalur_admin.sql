-- ============================================================
-- 0053: laporan_penjamin menerima faskes
-- ============================================================
--
-- `laporan_penjamin(date, date)` lahir di 0051 hanya membaca
-- `auth_company_id()`. Dua hal yang salah karenanya:
--
-- 1. **Super admin yang sedang melihat klien akan melihat laporan yang
--    keliru.** Seluruh aplikasi menyaring lewat `app.scope()`, yang membawa
--    faskes yang sedang dibuka, bukan faskes pemilik akunnya. Fungsi yang
--    tidak menerima faskes tidak bisa ikut aturan itu; ia akan menjawab
--    dengan angka apotek lain, dan angkanya adalah UANG.
-- 2. Sama seperti `apply_transaction` sebelum 0052, ia tidak bisa diuji
--    dari SQL Editor: `auth_company_id()` membaca JWT yang tidak ada di sana.
--
-- Gerbangnya `boleh_admin_platform()`, persis 0017, 0022, dan 0052. Untuk
-- pengguna biasa `p_company` tetap diabaikan.
--
-- Versi dua argumen DIBUANG, tidak dibiarkan hidup berdampingan. Menambah
-- argumen berdefault melahirkan fungsi kedua, bukan mengganti yang lama, dan
-- itu sudah menggigit di 0048: panggilan lama jadi ambigu (42725), atau lebih
-- buruk, jatuh ke versi lama diam-diam sehingga argumen barunya tidak pernah
-- sampai.

drop function if exists public.laporan_penjamin(date, date);

create or replace function public.laporan_penjamin(
  p_dari    date,
  p_sampai  date,
  p_company uuid default null
)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_co uuid := case when p_company is not null and public.boleh_admin_platform()
                    then p_company else public.auth_company_id() end;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;

  return coalesce((
    select jsonb_agg(x order by x.penjamin)
    from (
      select
        t.penjamin,
        i.nama as asuransi,
        count(*)::integer                     as jumlah_transaksi,
        sum(t.total)::numeric                 as total,
        sum(t.diterima_tunai)::numeric        as diterima_tunai,
        sum(t.ditagihkan_penjamin)::numeric   as ditagihkan
      from public.transactions t
      left join public.insurers i on i.id = t.asuransi_id
      where t.company_id = v_co
        and t.status = 'selesai'
        and t.created_at::date between p_dari and p_sampai
      group by t.penjamin, i.nama
    ) x), '[]'::jsonb);
end;
$$;

revoke all on function public.laporan_penjamin(date, date, uuid) from public, anon;
grant execute on function public.laporan_penjamin(date, date, uuid) to authenticated;
