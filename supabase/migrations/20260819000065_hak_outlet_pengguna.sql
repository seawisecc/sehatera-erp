-- ============================================================
-- 0065  Satu pengguna, beberapa outlet
-- ============================================================
--
-- Migrasi 0062 membuat pemilik bisa berpindah outlet. Yang belum bisa:
-- memberi STAF akses ke lebih dari satu outlet. Apoteker yang menjaga dua
-- cabang bergantian harus dibuatkan dua akun dengan dua email, dan sesudah itu
-- tidak ada satu pun laporan yang tahu bahwa keduanya orang yang sama.
--
-- Bentuknya sudah ada sejak awal dan tidak perlu tabel baru: `app_users`
-- berpasangan (company_id, email) tanpa indeks unik pada email, jadi satu
-- email memang boleh muncul di beberapa faskes. Yang kurang cuma cara
-- mengaturnya, dan penjaganya.
--
-- **Perannya boleh BERBEDA tiap outlet.** Orang yang sama bisa apoteker di
-- cabang utama dan kasir di cabang kedua, dan memaksanya satu peran akan
-- membuat pemilik memberi peran yang lebih tinggi daripada yang dibutuhkan
-- "supaya bisa dua-duanya". Hak akses yang dinaikkan demi kenyamanan tidak
-- pernah diturunkan lagi.

/**
 * Outlet mana saja yang bisa dibuka satu pengguna, beserta perannya.
 *
 * Hanya untuk pemilik outlet: daftar siapa bisa masuk ke mana adalah peta
 * akses, dan peta akses bukan bacaan staf.
 */
create or replace function public.outlet_pengguna(p_email text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_saya text := lower(auth.jwt() ->> 'email');
  v_grup uuid;
begin
  select group_id into v_grup from public.companies where id = public.auth_company_id();

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'company_id', c.id, 'nama', c.nama, 'kota', c.kota, 'sektor', c.sektor,
             'peran', u.role, 'status', u.status,
             'bisa_masuk', u.id is not null and u.status = 'aktif')
           order by c.nama)
      from public.companies c
      left join public.app_users u
             on u.company_id = c.id and lower(u.email) = lower(p_email)
     where c.deleted_at is null
       and lower(c.admin_email) = v_saya
       and (v_grup is null or c.group_id = v_grup or c.id = public.auth_company_id())),
    '[]'::jsonb);
end;
$$;

revoke all on function public.outlet_pengguna(text) from public, anon;
grant execute on function public.outlet_pengguna(text) to authenticated;

/**
 * Menyetel akses satu pengguna ke satu outlet.
 *
 * Dikerjakan SATU outlet per panggilan, bukan seluruh daftar sekaligus.
 * Panggilan yang membawa seluruh daftar akan menghapus akses yang tidak
 * disebut, dan layar yang memuat daftarnya sedikit tertinggal akan mencabut
 * akses orang tanpa ada yang menyuruhnya.
 *
 * Kuota pengguna paket tetap berlaku per outlet, lewat trigger yang sama sejak
 * migrasi 0003: menambah orang ke cabang kedua memakai jatah cabang kedua.
 */
create or replace function public.atur_outlet_pengguna(
  p_email   text,
  p_company uuid,
  p_beri    boolean,
  p_peran   text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_saya  text := lower(auth.jwt() ->> 'email');
  v_asal  record;
  v_target record;
  v_row   record;
begin
  if v_saya is null then
    raise exception 'Tidak ada sesi.' using errcode = 'SH004';
  end if;
  if coalesce(trim(p_email), '') = '' then
    raise exception 'Email pengguna wajib diisi.' using errcode = 'SH004';
  end if;

  select * into v_asal from public.companies where id = public.auth_company_id();
  select * into v_target from public.companies where id = p_company and deleted_at is null;
  if not found then
    raise exception 'Outlet tidak ditemukan.' using errcode = 'SH004';
  end if;

  -- Yang boleh mengatur peta akses cuma PEMILIK outlet tujuan, dan outlet itu
  -- harus satu kelompok dengan yang sedang dibuka. Tanpa syarat kedua, siapa
  -- pun yang memiliki dua faskes terpisah bisa memindahkan orang di antara
  -- keduanya tanpa pernah membuka faskes yang kedua.
  if not public.boleh_admin_platform() then
    if lower(coalesce(v_target.admin_email, '')) <> v_saya then
      raise exception 'Outlet ini bukan milik akun Anda.' using errcode = 'SH007';
    end if;
    if v_asal.group_id is not null and v_target.group_id is distinct from v_asal.group_id
       and v_target.id <> v_asal.id then
      raise exception 'Outlet itu tidak berada dalam kelompok yang sama.' using errcode = 'SH007';
    end if;
  end if;

  -- Pemilik tidak bisa mencabut aksesnya sendiri. Yang mengunci dirinya
  -- sendiri di luar faskesnya tidak punya jalan masuk untuk membatalkannya.
  if not p_beri and lower(p_email) = lower(coalesce(v_target.admin_email, '')) then
    raise exception 'Akses pemilik ke outletnya sendiri tidak bisa dicabut.' using errcode = 'SH004';
  end if;

  if p_beri then
    insert into public.app_users (company_id, email, nama, role, status)
    values (p_company, lower(trim(p_email)),
            coalesce((select nama from public.app_users
                       where lower(email) = lower(p_email) and nama is not null limit 1),
                     split_part(p_email, '@', 1)),
            coalesce(nullif(trim(p_peran), ''), 'kasir'), 'aktif')
    on conflict do nothing;

    update public.app_users
       set status = 'aktif',
           role = coalesce(nullif(trim(p_peran), ''), role)
     where company_id = p_company and lower(email) = lower(p_email)
    returning * into v_row;
  else
    -- Dinonaktifkan, bukan dihapus. Barisnya menyimpan siapa pernah punya
    -- akses ke mana, dan itu yang dicari kalau ada yang perlu ditelusuri.
    update public.app_users set status = 'nonaktif'
     where company_id = p_company and lower(email) = lower(p_email)
    returning * into v_row;

    -- Penunjuk outlet aktifnya ikut dibersihkan. Kalau tidak, orangnya tetap
    -- menunjuk ke outlet yang aksesnya baru dicabut, dan `auth_company_id()`
    -- akan diam-diam melemparnya ke outlet lain tanpa penjelasan.
    delete from public.outlet_aktif
     where lower(email) = lower(p_email) and company_id = p_company;
  end if;

  perform public.catat_audit(p_company,
    case when p_beri then 'outlet.akses_diberi' else 'outlet.akses_dicabut' end,
    'app_users', coalesce(v_row.id::text, p_email),
    jsonb_build_object('email', lower(p_email), 'outlet', v_target.nama, 'peran', v_row.role));

  return jsonb_build_object('company_id', p_company, 'email', lower(p_email),
                            'bisa_masuk', p_beri, 'peran', v_row.role);
end;
$$;

revoke all on function public.atur_outlet_pengguna(text, uuid, boolean, text) from public, anon;
grant execute on function public.atur_outlet_pengguna(text, uuid, boolean, text) to authenticated;
