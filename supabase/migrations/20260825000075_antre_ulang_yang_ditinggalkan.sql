-- ============================================================
-- 0075  Yang ditinggalkan bisa diantre ulang dengan payload baru
-- ============================================================
--
-- Lubang yang ditinggalkan sadar di 0056, dan baru terasa saat pengiriman
-- SatuSehat benar-benar jalan.
--
-- Payload disimpan sebagai CUPLIKAN, dan itu benar: kiriman yang sudah antre
-- minggu lalu tidak boleh berubah isinya karena kode diperbaiki bulan depan.
-- Tapi aturan itu diterapkan pada SEMUA keadaan, termasuk pada baris yang
-- **sudah menyerah dan tidak pernah berhasil terkirim**. Akibatnya:
--
--   1. Bentuk payload ternyata salah, ditolak validator.
--   2. Baris itu gagal berkali-kali lalu `ditinggalkan`.
--   3. Bentuknya dibetulkan di kode.
--   4. Kunci idempotennya menahan baris baru lahir menggantikannya, dan yang
--      lama tidak akan pernah dikirim lagi. Kunjungan itu hilang selamanya
--      dari SatuSehat, tanpa ada yang menyadarinya.
--
-- Selama pengembangan barisnya dibuang tangan lewat database. Itu bukan
-- sesuatu yang boleh diminta dari klinik.
--
-- **Yang berubah cuma satu keadaan: `ditinggalkan`.** Cuplikan yang sudah
-- TERKIRIM tetap tidak bisa disentuh, karena ia catatan tentang apa yang
-- benar-benar dikirim. Yang masih `antre` juga dibiarkan: ia belum menyerah,
-- dan mengganti payload di bawah kaki pengirim yang sedang berjalan adalah
-- cara membuat dua kiriman berbeda dengan satu kunci.
--
-- Yang ditinggalkan tidak pernah sampai ke mana pun, jadi tidak ada catatan
-- yang dirusak dengan menggantinya. Justru sebaliknya: membiarkannya berarti
-- menyimpan cuplikan yang sudah terbukti salah, selamanya.

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
  v_co    uuid := case when p_company is not null and public.boleh_admin_platform()
                       then p_company else public.auth_company_id() end;
  v_row   record;
  v_baru  boolean;
  v_ulang boolean := false;
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
  -- terakhir mengenai baris", jadi pernyataan di bawah menimpanya, dan
  -- jawabannya ikut berubah tanpa ada yang mengubah kode ini. Aturan yang
  -- ditemukan uji di migrasi 0057.
  v_baru := found;

  if not v_baru then
    -- Yang sudah MENYERAH dibangkitkan dengan payload yang baru. Yang
    -- `terkirim` maupun yang masih `antre` tidak disentuh sama sekali.
    update public.outbound_messages set
      resource       = p_resource,
      entity         = p_entity,
      entity_id      = p_entity_id,
      payload        = p_payload,
      status         = 'antre',
      percobaan      = 0,
      kirim_setelah  = now(),
      galat_terakhir = null,
      updated_at     = now()
     where company_id = v_co
       and sistem = p_sistem
       and kunci_idempoten = trim(p_kunci)
       and status = 'ditinggalkan'
    returning * into v_row;

    v_ulang := found;

    if not v_ulang then
      select * into v_row from public.outbound_messages
       where company_id = v_co and sistem = p_sistem and kunci_idempoten = trim(p_kunci);
    end if;
  end if;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status,
                            'percobaan', v_row.percobaan,
                            'baru', v_baru,
                            -- Dibedakan dari `baru`: yang dibangkitkan bukan
                            -- kejadian baru, ia kejadian lama yang mendapat
                            -- kesempatan kedua. Layar perlu bisa mengatakan
                            -- bedanya, kalau tidak orang mengira kunjungan
                            -- lamanya terkirim dua kali.
                            'diulang', v_ulang);
end;
$$;

revoke all on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) from public, anon;
grant execute on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) to authenticated;
