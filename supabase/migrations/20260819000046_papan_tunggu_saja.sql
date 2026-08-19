-- ============================================================
-- 0046  Papan hanya menampilkan yang benar-benar menunggu
-- ============================================================
--
-- Dua keluhan pemilik tentang papan ruang tunggu, dan keduanya sah.
--
-- SATU: pasien yang sudah dipanggil HILANG dari papan begitu poli lain
-- memanggil. Sebabnya rancangan saya: papan cuma menampilkan SATU yang
-- terakhir dipanggil, dan yang sudah dipanggil juga sudah keluar dari daftar
-- "Menunggu". Jadi di klinik dengan empat poli, panggilan poli Gigi
-- menghapus panggilan poli Umum dari layar sebelum orangnya sempat berdiri.
--
-- DUA: pasien yang sedang DIPERIKSA masih terpampang. Ia sudah di dalam
-- ruangan; namanya di papan cuma membuat orang lain mengira antreannya macet.
--
-- Yang tinggal di papan sekarang: yang menunggu diperiksa, dan yang menunggu
-- obat. Keduanya memang sedang duduk di ruang tunggu. `diperiksa` keluar
-- karena orangnya tidak ada di sana.
--
-- Daftar statusnya ditulis sebagai yang MASUK, bukan yang keluar. Kalau
-- ditulis sebagai "not in (selesai, batal)", keadaan baru mana pun akan
-- otomatis muncul di papan pengumuman ruang tunggu tanpa ada yang
-- memutuskannya. Untuk papan yang menghadap publik, bawaannya harus diam.

create or replace function public.layar_antrean(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_set  record;
  v_hasil jsonb;
begin
  if coalesce(trim(p_token), '') = '' then
    raise exception 'Layar antrean butuh token.' using errcode = 'SH004';
  end if;

  select s.*, c.nama as nama_faskes
    into v_set
    from public.settings s
    join public.companies c on c.id = s.company_id
   where s.token_antrean = trim(p_token)
     and c.deleted_at is null;
  if not found then
    raise exception 'Token layar antrean tidak dikenali.' using errcode = 'SH004';
  end if;

  select jsonb_build_object(
    'faskes', v_set.nama_faskes,
    'pada', now(),
    'antrean', coalesce((
      select jsonb_agg(x order by x.dipanggil_pada desc nulls last, x.dibuka_pada)
      from (
        select
          v.nomor_antre,
          v.status,
          v.dipanggil_pada,
          v.jumlah_panggil,
          v.dibuka_pada,
          u.nama as poli,
          case when v_set.antrean_nama_penuh then p.nama
               else public.samarkan_nama(p.nama) end as nama
        from public.visits v
        join public.patients p on p.id = v.patient_id
        left join public.clinic_units u on u.id = v.unit_id
        where v.company_id = v_set.company_id
          and v.tanggal = current_date
          -- Ditulis sebagai yang MASUK, bukan yang keluar.
          and v.status in ('terdaftar', 'resep', 'obat')
      ) x), '[]'::jsonb))
  into v_hasil;

  return v_hasil;
end;
$$;

revoke all on function public.layar_antrean(text) from public;
grant execute on function public.layar_antrean(text) to anon, authenticated;
