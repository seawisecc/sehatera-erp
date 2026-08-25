-- ============================================================
-- 0071  Nomor IHS per poli, dan satu kolom untuk satu fakta
-- ============================================================
--
-- Dua hal yang sama-sama menghalangi pengiriman Encounter ke SatuSehat, dan
-- keduanya baru terlihat sesudah payload-nya benar-benar dibangun.
--
-- **1. `Encounter.location` WAJIB, dan poli tidak punya tempat menyimpannya.**
-- `settings.ihs_location_id` sudah ada sejak migrasi 0018, tapi ia SATU untuk
-- seluruh faskes. Klinik Rexco 88 punya empat poli, dan kunjungan di Poli Gigi
-- yang dikirim dengan Location Poli Umum bukan data yang kurang rapi: ia
-- kunjungan yang tercatat terjadi di ruangan yang salah. Kolom lama dibiarkan
-- sebagai lokasi faskes secara keseluruhan; yang per poli ada di sini.
--
-- **2. `app_users` punya DUA kolom untuk satu fakta.** Migrasi 0018 menambah
-- `ihs_id` ("Nomor IHS tenaga kesehatan"), lalu migrasi 0070 menambah
-- `ihs_practitioner_id` untuk hal yang sama persis, tanpa menyadari yang
-- pertama sudah ada. Ini pola yang catatan project ini sendiri sudah tandai
-- berbahaya pada `settings.ihs_organization_id`: dua tempat untuk satu fakta
-- akan menyimpang, dan yang membacanya nanti tidak punya cara tahu mana yang
-- benar.
--
-- Yang MENANG adalah `ihs_practitioner_id`: itu yang disunting layar Perizinan
-- lewat `simpan_perizinan()`, jadi ia satu-satunya yang bisa terisi. `ihs_id`
-- tidak pernah dibaca maupun ditulis kode mana pun.
--
-- Sekarang waktu termurah untuk membereskannya, justru karena belum ada yang
-- terisi. Isinya tetap DIPINDAHKAN lebih dulu, bukan diandaikan kosong: yang
-- diandaikan kosong ternyata berisi adalah cara kehilangan data tanpa jejak.

-- ------------------------------------------------------------
-- 1. Location per poli
-- ------------------------------------------------------------

alter table public.clinic_units
  add column if not exists ihs_location_id text;

comment on column public.clinic_units.ihs_location_id is
  'Location di SatuSehat untuk poli ini, didaftarkan lebih dulu sebagai prasyarat. Encounter.location wajib, dan satu Location untuk seluruh faskes menaruh semua kunjungan di ruangan yang sama.';

-- `create or replace` dengan tanda tangan yang SAMA, jadi tidak melahirkan
-- fungsi kedua. Menambah argumen berdefault yang melahirkan fungsi kembar
-- sudah menggigit di migrasi 0048; di sini argumennya tetap (uuid, jsonb) dan
-- kolom barunya masuk lewat `p_data`.
create or replace function public.simpan_poli(p_id uuid, p_data jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_company uuid := coalesce(public.auth_company_id(), (p_data ->> 'company_id')::uuid);
  v_kode    text := upper(trim(coalesce(p_data ->> 'kode', '')));
  v_nama    text := trim(coalesce(p_data ->> 'nama', ''));
  v_row     record;
begin
  if v_company is null then
    raise exception 'Akun ini belum terhubung ke fasilitas mana pun.' using errcode = 'SH004';
  end if;
  if v_nama = '' then
    raise exception 'Nama poli tidak boleh kosong.' using errcode = 'SH004';
  end if;
  if v_kode !~ '^[A-Z]{1,3}$' then
    raise exception 'Kode antrean harus satu sampai tiga huruf, misalnya U untuk Umum atau G untuk Gigi.'
      using errcode = 'SH004';
  end if;

  if p_id is null then
    insert into public.clinic_units (company_id, nama, kode, kode_bpjs, tarif_konsultasi, urutan, ihs_location_id)
    values (v_company, v_nama, v_kode,
            nullif(trim(p_data ->> 'kode_bpjs'), ''),
            coalesce(nullif(p_data ->> 'tarif_konsultasi', '')::numeric, 0),
            coalesce(nullif(p_data ->> 'urutan', '')::integer,
                     (select coalesce(max(urutan), 0) + 1 from public.clinic_units where company_id = v_company)),
            nullif(trim(p_data ->> 'ihs_location_id'), ''))
    returning * into v_row;
  else
    update public.clinic_units set
      nama             = v_nama,
      kode             = v_kode,
      kode_bpjs        = nullif(trim(p_data ->> 'kode_bpjs'), ''),
      tarif_konsultasi = coalesce(nullif(p_data ->> 'tarif_konsultasi', '')::numeric, tarif_konsultasi),
      urutan           = coalesce(nullif(p_data ->> 'urutan', '')::integer, urutan),
      aktif            = coalesce((p_data ->> 'aktif')::boolean, aktif),
      -- Kunci yang TIDAK dikirim tidak mengubah apa pun; kunci yang dikirim
      -- kosong MENGOSONGKAN. Layar poli tidak selalu membawa kolom ini, dan
      -- yang diam-diam menghapus nomor IHS orang lain lebih buruk daripada
      -- yang menolak menyimpan.
      ihs_location_id  = case when p_data ? 'ihs_location_id'
                              then nullif(trim(p_data ->> 'ihs_location_id'), '')
                              else ihs_location_id end
     where id = p_id
       and (public.boleh_admin_platform() or company_id = public.auth_company_id())
    returning * into v_row;
    if not found then
      raise exception 'Poli tidak ditemukan.' using errcode = 'SH004';
    end if;
  end if;

  perform public.catat_audit(v_row.company_id,
    case when p_id is null then 'poli.dibuat' else 'poli.diubah' end,
    'clinic_units', v_row.id::text, jsonb_build_object('nama', v_row.nama, 'kode', v_row.kode));

  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'Sudah ada poli dengan nama atau kode antrean yang sama.' using errcode = 'SH004';
end;
$$;

-- ------------------------------------------------------------
-- 2. Satu kolom untuk nomor IHS tenaga kesehatan
-- ------------------------------------------------------------

do $$
begin
  -- Pindahkan dulu, baru buang. Urutan ini yang membuatnya aman dijalankan di
  -- atas database yang sudah berisi data, dan `if exists` membuatnya aman
  -- dijalankan ulang.
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'app_users' and column_name = 'ihs_id') then
    update public.app_users
       set ihs_practitioner_id = ihs_id
     where ihs_practitioner_id is null
       and nullif(trim(ihs_id), '') is not null;

    alter table public.app_users drop column ihs_id;
  end if;
end $$;
