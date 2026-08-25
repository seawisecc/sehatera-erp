-- ============================================================
-- 0072  Antrean kirim bisa diambil per faskes
-- ============================================================
--
-- `ambil_antrean_kirim()` mengambil baris tertua untuk satu SISTEM, tanpa
-- memandang faskesnya. Itu benar untuk pengirim yang berjalan sendiri di latar
-- belakang, dan salah untuk tombol yang ditekan orang di layar Pengaturan satu
-- klinik.
--
-- Bukan soal kerahasiaan, karena pengambilannya memang cuma dari jalur server.
-- Soalnya efek samping: pengambilan MENAIKKAN `percobaan` pada baris yang
-- diambilnya. Baris klinik lain yang ikut terambil lalu tidak diproses akan
-- tetap naik hitungannya dan mundur jedanya, dan sesudah beberapa kali orang
-- menekan tombol di kliniknya sendiri, kiriman klinik sebelah `ditinggalkan`
-- tanpa pernah sekali pun benar-benar dicoba. Kegagalan yang paling sulit
-- dilacak adalah yang sebabnya ada di tenant lain.
--
-- **Versi lama DIBUANG lebih dulu, tidak dibiarkan berdampingan.** Menambah
-- argumen berdefault MELAHIRKAN fungsi kedua, bukan mengganti yang lama, dan
-- itu sudah menggigit di migrasi 0048: panggilan jadi ambigu (42725), dan yang
-- lebih buruk, kalau versi lama yang terpilih maka argumen barunya diam-diam
-- tidak berlaku. Pola yang sama dengan migrasi 0022 dan 0050.

drop function if exists public.ambil_antrean_kirim(text, integer);

create or replace function public.ambil_antrean_kirim(
  p_sistem  text,
  p_batas   integer default 20,
  p_company uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_hasil jsonb;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Antrean kirim hanya bisa diambil lewat jalur server.' using errcode = 'SH007';
  end if;

  with diambil as (
    select id from public.outbound_messages
     where sistem = p_sistem
       and status = 'antre'
       and kirim_setelah <= now()
       -- Kosong berarti SELURUH faskes, dan itu memang yang dibutuhkan
       -- pengirim latar belakang nanti. Yang menyebut faskes hanya mengambil
       -- miliknya sendiri.
       and (p_company is null or company_id = p_company)
     order by kirim_setelah, created_at
     limit greatest(coalesce(p_batas, 20), 1)
     for update skip locked
  ), naik as (
    update public.outbound_messages m
       set percobaan = m.percobaan + 1, updated_at = now()
      from diambil d where d.id = m.id
    returning m.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', n.id, 'company_id', n.company_id, 'resource', n.resource,
           'entity', n.entity, 'entity_id', n.entity_id, 'payload', n.payload,
           'percobaan', n.percobaan) order by n.created_at), '[]'::jsonb)
    into v_hasil from naik n;

  return v_hasil;
end;
$$;

revoke all on function public.ambil_antrean_kirim(text, integer, uuid) from public, anon, authenticated;
