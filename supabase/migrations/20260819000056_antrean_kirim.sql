-- ============================================================
-- 0056  Antrean kirim ke sistem nasional, idempoten
-- ============================================================
--
-- Prasyarat kedua pengiriman ke SatuSehat dan BPJS, dan bentuknya mengikuti
-- `webhook_events` dari migrasi 0013 karena masalahnya sama persis: satu pihak
-- di luar kendali kita, jaringan yang putus di tengah, dan tidak boleh ada
-- yang terkirim dua kali maupun hilang.
--
-- **Kenapa antrean, bukan langsung kirim saat kejadiannya.** Kalau kunjungan
-- ditutup lalu HTTP-nya dipanggil di detik itu juga, dokter yang menekan
-- Selesai ikut menunggu jaringan Kemenkes, dan kalau gagal, kunjungan itu
-- tidak pernah terkirim tanpa ada yang tahu. Yang dicatat di sini adalah
-- NIATNYA; pengirimannya berjalan sendiri dan boleh gagal berkali-kali.
--
-- Empat hal yang menentukan bentuknya.
--
-- 1. **Kunci idempoten yang dibuat PEMANGGIL, bukan database.** Satu kunjungan
--    yang ditutup, dibuka lagi, lalu ditutup lagi harus tetap menghasilkan satu
--    kiriman. Kalau kuncinya nomor urut, percobaan kedua jadi baris baru dan
--    SatuSehat menerima satu kunjungan dua kali. Bentuknya
--    `<resource>:<entity_id>` atau yang lebih halus kalau memang perlu.
--
-- 2. **Payload disimpan sebagai cuplikan, bukan dibangun ulang saat kirim.**
--    Kalau dibangun ulang, perbaikan kode bulan depan diam-diam mengubah isi
--    kiriman yang sudah antre sejak minggu lalu, dan yang terkirim bukan lagi
--    yang terjadi. Ini alasan yang sama dengan `transaction_item_batches` di
--    migrasi 0009: yang sudah terjadi dicatat, bukan dihitung ulang.
--
-- 3. **Menyerah itu KEADAAN, bukan diam.** Sesudah sekian percobaan barisnya
--    jadi `ditinggalkan` beserta galat terakhirnya, supaya muncul di layar
--    sebagai sesuatu yang harus diurus orang. Antrean yang mencoba selamanya
--    adalah antrean yang tidak pernah dilihat siapa pun.
--
-- 4. **`for update skip locked` saat mengambil.** Dua pengirim yang berjalan
--    bersamaan tidak boleh mengambil baris yang sama, dan yang kedua tidak
--    boleh menunggu yang pertama selesai.
--
-- **Yang sengaja BELUM ada di sini: pemanggil yang mengisi antreannya.**
-- Bentuk payload FHIR harus dicocokkan ke dokumen resmi yang berlaku saat
-- kredensialnya ada, bukan dari ingatan. Mengisi antrean dengan payload yang
-- belum diverifikasi cuma menumpuk ribuan baris yang harus dibuang ulang, dan
-- lebih buruk: membuat orang mengira pengirimannya sudah jalan.

create table if not exists public.outbound_messages (id uuid primary key default gen_random_uuid());
alter table public.outbound_messages
  add column if not exists company_id     uuid not null references public.companies(id) on delete cascade,
  add column if not exists sistem         text not null,
  add column if not exists resource       text not null,
  add column if not exists entity         text,
  add column if not exists entity_id      text,
  add column if not exists payload        jsonb not null default '{}'::jsonb,
  add column if not exists kunci_idempoten text not null,
  add column if not exists status         text not null default 'antre',
  add column if not exists percobaan      integer not null default 0,
  add column if not exists kirim_setelah  timestamptz not null default now(),
  add column if not exists galat_terakhir text,
  add column if not exists id_luar        text,
  add column if not exists jawaban        jsonb,
  add column if not exists terkirim_pada  timestamptz,
  add column if not exists created_at     timestamptz not null default now(),
  add column if not exists updated_at      timestamptz not null default now();

-- TIGA keadaan, ditulis sebagai yang ada. Yang gagal tidak punya keadaan
-- sendiri: ia kembali ke `antre` dengan `kirim_setelah` yang lebih jauh, dan
-- `percobaan` yang membedakannya dari yang belum pernah dicoba. Keadaan
-- "gagal" yang akan dicoba lagi cuma membuat orang mengira ia berhenti.
alter table public.outbound_messages drop constraint if exists outbound_status_check;
alter table public.outbound_messages add constraint outbound_status_check
  check (status in ('antre', 'terkirim', 'ditinggalkan'));

alter table public.outbound_messages drop constraint if exists outbound_sistem_check;
alter table public.outbound_messages add constraint outbound_sistem_check
  check (sistem in ('satusehat', 'bpjs_pcare', 'bpjs_vclaim'));

comment on table public.outbound_messages is
  'Antrean kirim ke sistem nasional. Idempoten lewat kunci yang dibuat pemanggil, dan payloadnya cuplikan, bukan dibangun ulang saat kirim.';
comment on column public.outbound_messages.kunci_idempoten is
  'Dibuat pemanggil, bukan database. Kunjungan yang ditutup dua kali harus menghasilkan satu kiriman.';
comment on column public.outbound_messages.payload is
  'Cuplikan saat diantre. Jangan dibangun ulang saat kirim: perbaikan kode nanti akan mengubah isi kiriman yang sudah antre.';

create unique index if not exists uq_outbound_kunci
  on public.outbound_messages (company_id, sistem, kunci_idempoten);
create index if not exists idx_outbound_antre
  on public.outbound_messages (sistem, kirim_setelah)
  where status = 'antre';
create index if not exists idx_outbound_company
  on public.outbound_messages (company_id, status, created_at desc);

alter table public.outbound_messages enable row level security;
-- Dibaca faskesnya sendiri supaya layarnya bisa menampilkan apa yang tersendat.
-- Menulis TIDAK lewat sini: seluruh perpindahan keadaan lewat fungsi, jadi
-- tidak ada jalan menandai sesuatu "terkirim" dari peramban.
drop policy if exists "tenant_read" on public.outbound_messages;
create policy "tenant_read" on public.outbound_messages for select to authenticated
  using (public.boleh_admin_platform() or company_id = public.auth_company_id());

drop trigger if exists trg_set_company_id on public.outbound_messages;
create trigger trg_set_company_id before insert on public.outbound_messages
  for each row execute function public.set_company_id();

-- ------------------------------------------------------------
-- Mengantre
-- ------------------------------------------------------------
/**
 * Idempoten: memanggilnya dua kali dengan kunci yang sama tidak membuat baris
 * kedua, dan mengembalikan yang sudah ada.
 *
 * Yang sudah `terkirim` TIDAK dibangunkan lagi. Itu seluruh gunanya kunci ini:
 * kunjungan yang dibuka lalu ditutup ulang tidak boleh berangkat dua kali.
 * Yang `ditinggalkan` juga tidak, supaya sesuatu yang sudah diputuskan orang
 * tidak hidup sendiri; membangunkannya kembali adalah tindakan tersendiri.
 */
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
  v_row record;
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

  if not found then
    select * into v_row from public.outbound_messages
     where company_id = v_co and sistem = p_sistem and kunci_idempoten = trim(p_kunci);
  end if;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status,
                            'percobaan', v_row.percobaan, 'baru', v_row.percobaan = 0 and v_row.status = 'antre');
end;
$$;

revoke all on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) from public, anon;
grant execute on function public.antre_kirim(text, text, text, jsonb, text, text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Mengambil untuk dikirim
-- ------------------------------------------------------------
/**
 * Jalur server saja, sama seperti `ambil_kredensial` di 0055: yang memanggilnya
 * memegang payload berisi data pasien beserta kredensial faskesnya.
 *
 * `for update skip locked` supaya dua pengirim yang berjalan bersamaan tidak
 * mengambil baris yang sama, dan yang kedua tidak menunggu yang pertama
 * selesai berbicara dengan jaringan Kemenkes.
 *
 * `percobaan` dinaikkan DI SINI, saat diambil, bukan saat gagal. Pengirim yang
 * mati di tengah tidak sempat melapor gagal, dan kalau hitungannya bergantung
 * pada laporan itu, baris yang selalu membuat pengirimnya mati akan dicoba
 * selamanya.
 */
create or replace function public.ambil_antrean_kirim(p_sistem text, p_batas integer default 20)
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
     where sistem = p_sistem and status = 'antre' and kirim_setelah <= now()
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

revoke all on function public.ambil_antrean_kirim(text, integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Melaporkan hasilnya
-- ------------------------------------------------------------
create or replace function public.tandai_terkirim(p_id uuid, p_id_luar text default null, p_jawaban jsonb default null)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya jalur server yang boleh menandai kiriman.' using errcode = 'SH007';
  end if;
  update public.outbound_messages
     set status = 'terkirim', id_luar = p_id_luar, jawaban = p_jawaban,
         galat_terakhir = null, terkirim_pada = now(), updated_at = now()
   where id = p_id and status = 'antre';
end;
$$;

revoke all on function public.tandai_terkirim(uuid, text, jsonb) from public, anon, authenticated;

/**
 * Gagal berarti dijadwalkan ulang lebih jauh, bukan berhenti.
 *
 * Jedanya berlipat: 1, 2, 4, 8 menit dan seterusnya. Mencoba ulang tiap detik
 * pada sistem yang sedang tumbang adalah cara menambah beban ke pihak yang
 * sedang bermasalah, dan itu yang membuat pemulihannya lebih lama.
 *
 * Sesudah `p_batas_percobaan`, barisnya `ditinggalkan` beserta galat
 * terakhirnya, supaya ada yang bisa dilihat orang. Bukan dihapus: yang gagal
 * justru catatan yang paling perlu dibaca.
 */
create or replace function public.tandai_gagal(p_id uuid, p_galat text, p_batas_percobaan integer default 6)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_row record;
begin
  if not public.boleh_admin_platform() then
    raise exception 'Hanya jalur server yang boleh menandai kiriman.' using errcode = 'SH007';
  end if;

  select * into v_row from public.outbound_messages where id = p_id for update;
  if not found or v_row.status <> 'antre' then
    return;
  end if;

  update public.outbound_messages
     set galat_terakhir = left(coalesce(p_galat, 'tanpa keterangan'), 2000),
         status = case when v_row.percobaan >= greatest(coalesce(p_batas_percobaan, 6), 1)
                       then 'ditinggalkan' else 'antre' end,
         kirim_setelah = now() + (interval '1 minute' * power(2, least(v_row.percobaan, 10))),
         updated_at = now()
   where id = p_id;
end;
$$;

revoke all on function public.tandai_gagal(uuid, text, integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Ringkasan untuk layar
-- ------------------------------------------------------------
/**
 * Berapa yang antre, berapa terkirim, berapa ditinggalkan, dan yang tertua
 * masih menunggu sejak kapan.
 *
 * Angka terakhir itu yang paling berguna: antrean sepuluh baris itu wajar,
 * antrean sepuluh baris yang tertuanya sejak tiga hari lalu berarti
 * pengirimnya berhenti dan tidak ada yang tahu.
 */
create or replace function public.ringkas_antrean_kirim(p_company uuid default null)
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

  return (
    select jsonb_build_object(
      'antre',        count(*) filter (where status = 'antre'),
      'terkirim',     count(*) filter (where status = 'terkirim'),
      'ditinggalkan', count(*) filter (where status = 'ditinggalkan'),
      'pernah_gagal', count(*) filter (where status = 'antre' and percobaan > 0),
      'tertua_antre', min(created_at) filter (where status = 'antre'))
    from public.outbound_messages where company_id = v_co);
end;
$$;

revoke all on function public.ringkas_antrean_kirim(uuid) from public, anon;
grant execute on function public.ringkas_antrean_kirim(uuid) to authenticated;
