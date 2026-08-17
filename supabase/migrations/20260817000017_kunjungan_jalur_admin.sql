-- ============================================================
-- 0017  ubah_status_kunjungan ikut jalur admin platform
-- ============================================================
--
-- Persoalan yang sama dengan migrasi 0014, dan jawabannya juga sama.
--
-- `ubah_status_kunjungan()` menahan siapa pun yang bukan pemilik fasilitas itu
-- atau super admin, dan penahannya membaca JWT. Koneksi langsung ke database
-- tidak punya JWT sama sekali, jadi SQL Editor, skrip pemeliharaan, dan migrasi
-- berikutnya ikut tertahan. Akibatnya mesin keadaan kunjungan, satu-satunya
-- bagian modul klinik yang benar-benar menjaga urutan langkah medis, tidak
-- bisa DIBUKTIKAN dari mana pun.
--
-- Menerima koneksi tanpa JWT tidak melemahkan apa pun: siapa pun yang bisa
-- membuka koneksi langsung sudah bisa meng-UPDATE kolom status itu sendiri
-- tanpa lewat fungsi ini. Yang ditahan penahan itu adalah pengguna aplikasi,
-- dan mereka SELALU membawa JWT.

create or replace function public.ubah_status_kunjungan(
  p_visit  uuid,
  p_status text,
  p_alasan text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_visit record;
  v_urut  text[] := array['terdaftar', 'diperiksa', 'resep', 'obat', 'selesai'];
  v_dari  integer;
  v_ke    integer;
begin
  select * into v_visit from public.visits
   where id = p_visit
     and (public.boleh_admin_platform() or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Kunjungan tidak ditemukan.' using errcode = 'SH004';
  end if;

  if v_visit.status = p_status then
    return to_jsonb(v_visit);
  end if;
  if v_visit.status in ('selesai', 'batal') then
    raise exception 'Kunjungan ini sudah ditutup.' using errcode = 'SH004';
  end if;

  if p_status = 'batal' then
    update public.visits
       set status = 'batal', ditutup_pada = now(),
           catatan_batal = nullif(trim(p_alasan), '')
     where id = p_visit;

    perform public.catat_audit(v_visit.company_id, 'kunjungan.dibatalkan', 'visits', p_visit::text,
      jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'alasan', p_alasan));

    return (select to_jsonb(v) from public.visits v where v.id = p_visit);
  end if;

  v_dari := array_position(v_urut, v_visit.status);
  v_ke   := array_position(v_urut, p_status);
  if v_ke is null then
    raise exception 'Keadaan kunjungan tidak dikenali.' using errcode = 'SH004';
  end if;

  -- Boleh maju satu langkah, boleh mundur satu langkah (dokter yang keliru
  -- menekan harus bisa membetulkannya sendiri, bukan memanggil admin), dan
  -- boleh dibatalkan dari mana pun sebelum selesai. Yang tidak boleh: melompat.
  if abs(v_ke - v_dari) > 1 then
    raise exception 'Kunjungan tidak bisa melompat dari % ke %. Lewati satu per satu.', v_visit.status, p_status
      using errcode = 'SH004';
  end if;

  update public.visits
     set status       = p_status,
         dokter_email = case when p_status = 'diperiksa' and dokter_email is null
                             then coalesce(lower(auth.jwt() ->> 'email'), dokter_email)
                             else dokter_email end,
         ditutup_pada = case when p_status = 'selesai' then now() else null end
   where id = p_visit;

  perform public.catat_audit(v_visit.company_id, 'kunjungan.' || p_status, 'visits', p_visit::text,
    jsonb_build_object('nomor', v_visit.nomor, 'dari', v_visit.status, 'ke', p_status));

  return (select to_jsonb(v) from public.visits v where v.id = p_visit);
end;
$$;

revoke all on function public.ubah_status_kunjungan(uuid, text, text) from public, anon;
grant execute on function public.ubah_status_kunjungan(uuid, text, text) to authenticated;
