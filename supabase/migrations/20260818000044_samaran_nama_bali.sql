-- ============================================================
-- 0044  Penyamaran nama yang mengerti nama Bali
-- ============================================================
--
-- Migrasi 0041 menyamarkan nama jadi "kata pertama + inisial kata kedua".
-- Untuk "Nyoman Rai Sudiartha" itu menghasilkan "Nyoman R." dan enak dibaca,
-- jadi ujinya lulus dan saya menganggapnya beres.
--
-- Di layar sungguhan hasilnya "I W." untuk I Wayan Sudiarta.
--
-- Sebabnya "I" dan "Ni" dalam nama Bali itu PENANDA, bukan nama: I untuk
-- laki-laki, Ni untuk perempuan. Aturan saya membuang justru kata yang
-- berguna dan menyisakan yang tidak membedakan siapa pun. Di ruang tunggu
-- yang isinya belasan orang bernama I dan Ni, "I W." tidak memanggil siapa
-- pun.
--
-- Aturan barunya: kalau kata pertama pendek (tiga huruf atau kurang), ia
-- dianggap penanda dan kata kedua ikut utuh. Jadi:
--
--   I Wayan Sudiarta      -> I Wayan S.
--   Ni Putu Diah Lestari  -> Ni Putu D.
--   Nyoman Rai Sudiartha  -> Nyoman R.
--   Kadek Sri Wahyuni     -> Kadek S.
--   Sukarno               -> Sukarno
--
-- Ini melebar melewati Bali: "Siti", "Dewi", "Sri" di Jawa juga sering jadi
-- penanda, dan aturan panjang kata menangkapnya tanpa perlu daftar nama.

create or replace function public.samarkan_nama(p_nama text)
returns text
language sql immutable strict parallel safe
as $$
  with k as (
    select string_to_array(regexp_replace(trim(p_nama), '\s+', ' ', 'g'), ' ') as w
  ),
  n as (
    select w,
           array_length(w, 1) as n,
           -- Kata pertama tiga huruf atau kurang dianggap penanda (I, Ni,
           -- Ida, Sri), jadi kata kedua ikut utuh supaya masih membedakan.
           case when length(w[1]) <= 3 and array_length(w, 1) >= 2 then 2 else 1 end as utuh
      from k
  )
  select case
    when n is null or n = 0 then ''
    when n <= utuh then array_to_string(w[1:n], ' ')
    else array_to_string(w[1:utuh], ' ') || ' ' || upper(left(w[utuh + 1], 1)) || '.'
  end
  from n;
$$;

comment on function public.samarkan_nama(text) is
  'Nama untuk dipajang di ruang tunggu. Kata pertama yang pendek dianggap penanda (I, Ni, Ida, Sri) dan kata kedua ikut utuh, supaya samarannya masih membedakan orang.';

-- ------------------------------------------------------------
-- Layar memakai aturan yang sama
-- ------------------------------------------------------------
-- Disalin dari migrasi 0041, satu-satunya perubahan ada di `nama`.

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
          and v.status not in ('selesai', 'batal')
      ) x), '[]'::jsonb))
  into v_hasil;

  return v_hasil;
end;
$$;

revoke all on function public.layar_antrean(text) from public;
grant execute on function public.layar_antrean(text) to anon, authenticated;

-- Bukti aturannya, dijalankan saat migrasi ini masuk.
do $$
declare r record;
begin
  for r in select * from (values
      ('I Wayan Sudiarta',     'I Wayan S.'),
      ('Ni Putu Diah Lestari', 'Ni Putu D.'),
      ('Nyoman Rai Sudiartha', 'Nyoman R.'),
      ('Kadek Sri Wahyuni',    'Kadek S.'),
      ('Sukarno',              'Sukarno'),
      ('I Komang',             'I Komang')
    ) as t(masuk, harap)
  loop
    if public.samarkan_nama(r.masuk) <> r.harap then
      raise exception 'samarkan_nama("%") = "%", seharusnya "%".',
        r.masuk, public.samarkan_nama(r.masuk), r.harap;
    end if;
  end loop;
end $$;
