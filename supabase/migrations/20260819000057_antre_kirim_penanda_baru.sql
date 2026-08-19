-- ============================================================
-- 0057  Penanda `baru` di antre_kirim yang selalu benar
-- ============================================================
--
-- `antre_kirim` mengembalikan `baru` untuk memberi tahu pemanggil apakah
-- barisnya benar-benar dibuat atau kunci itu sudah pernah diantre. Hitungannya
-- salah: `v_row.percobaan = 0 and v_row.status = 'antre'`. Baris yang SUDAH
-- ADA dan belum pernah diambil pengirim juga berpercobaan nol dan berstatus
-- antre, jadi jawabannya selalu "baru".
--
-- Yang rusak karenanya bukan idempotensinya: barisnya memang tetap satu.
-- Yang rusak adalah pelaporannya, dan itu justru bagian yang dipakai
-- memutuskan. Pemanggil yang mencatat "satu kunjungan diantrekan" akan
-- mencatatnya tiap kali kunjungan itu ditutup ulang, dan hitungan berapa yang
-- sebenarnya berangkat jadi lebih besar daripada kenyataannya. Kesalahan
-- semacam ini tidak pernah muncul sebagai galat.
--
-- Jawabannya sudah ada di `found` sesudah INSERT ... ON CONFLICT DO NOTHING.
-- Yang perlu diperhatikan: `found` menjawab pernyataan TERAKHIR, jadi ia harus
-- ditangkap sebelum SELECT pengambil baris lama menimpanya.
--
-- Ditemukan uji `supabase/uji/0056_antrean_kirim.sql`, bukan saat membacanya.

create or replace function public.antre_kirim(
  p_sistem    text,
  p_resource  text,
  p_kunci     text,
  p_payload   jsonb,
  p_entity    text default null,
  p_entity_id text default null,
  p_company   uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_co  uuid := case when p_company is not null and public.boleh_admin_platform()
                     then p_company else public.auth_company_id() end;
  v_row  record;
  v_baru boolean;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_kunci), '') = '' then
    raise exception 'Kunci idempoten harus diisi. Tanpa itu satu kejadian bisa terkirim berkali-kali.'
      using errcode = 'SH004';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload harus berupa objek.' using errcode = 'SH004';
  end if;

  insert into public.outbound_messages
    (company_id, sistem, resource, entity, entity_id, payload, kunci_idempoten)
  values
    (v_co, p_sistem, p_resource, p_entity, p_entity_id, p_payload, trim(p_kunci))
  on conflict (company_id, sistem, kunci_idempoten) do nothing
  returning * into v_row;

  -- `found` HARUS ditangkap di sini juga. Ia menjawab "apakah pernyataan
  -- terakhir mengenai baris", jadi SELECT di bawah menimpanya, dan jawabannya
  -- ikut berubah tanpa ada yang mengubah kode ini.
  v_baru := found;

  if not v_baru then
    select * into v_row from public.outbound_messages
     where company_id = v_co and sistem = p_sistem and kunci_idempoten = trim(p_kunci);
  end if;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status,
                            'percobaan', v_row.percobaan, 'baru', v_baru);
end;
$$;

revoke all on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) from public, anon;
grant execute on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) to authenticated;
