-- ============================================================
-- 0067  Klaim menerima faskes
-- ============================================================
--
-- Kesalahan yang sama seperti sebelum 0053: ketiga fungsi klaim di 0066 hanya
-- membaca `auth_company_id()`. Dua akibatnya persis sama.
--
-- 1. **Super admin yang sedang melihat klien akan membuat klaim untuk faskes
--    yang salah.** Seluruh aplikasi menyaring lewat `app.scope()`, yang
--    membawa faskes yang sedang dibuka, bukan faskes akun yang login. Klaim
--    yang salah faskes bukan cuma laporan keliru: ia MENANDAI transaksi orang
--    lain sebagai sudah ditagihkan, dan pelayanan yang tertandai berhenti
--    muncul di daftar yang belum diklaim. Uang yang hilang tidak muncul
--    sebagai galat.
-- 2. Tidak bisa diuji dari SQL Editor, tempat satu-satunya SQL dijalankan di
--    project ini. Yang tidak bisa diuji tidak diuji.
--
-- Versi lama DIBUANG, tidak dibiarkan hidup berdampingan. Menambah argumen
-- berdefault melahirkan fungsi kedua, bukan mengganti yang lama (0048).

drop function if exists public.tagihan_belum_diklaim(date, date, text, uuid);
drop function if exists public.buat_klaim(date, date, text, uuid, text);
drop function if exists public.daftar_klaim(text);

-- ------------------------------------------------------------
-- Yang belum ditagihkan
-- ------------------------------------------------------------
create or replace function public.tagihan_belum_diklaim(
  p_dari     date,
  p_sampai   date,
  p_penjamin text default null,
  p_asuransi uuid default null,
  p_company  uuid default null
)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuka tagihan penjamin.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', t.id, 'nomor', t.nomor_transaksi, 'tanggal', t.created_at,
             'penjamin', t.penjamin, 'asuransi', i.nama,
             'pasien', coalesce(p.nama, t.nama_pasien),
             'nomor_rm', p.nomor_rm, 'nomor_penjamin', v.nomor_penjamin,
             'kunjungan', v.nomor,
             'diagnosis', (select d.kode_icd10 from public.visit_diagnoses d
                            where d.visit_id = v.id and d.tipe = 'primer' limit 1),
             'diagnosis_nama', (select d.nama from public.visit_diagnoses d
                                 where d.visit_id = v.id and d.tipe = 'primer' limit 1),
             'total', t.total, 'ditagihkan', t.ditagihkan_penjamin)
           order by t.created_at)
      from public.transactions t
      left join public.visits v on v.id = t.visit_id
      left join public.patients p on p.id = v.patient_id
      left join public.insurers i on i.id = t.asuransi_id
     where t.company_id = v_co
       and t.status = 'selesai'
       and t.claim_id is null
       and coalesce(t.ditagihkan_penjamin, 0) > 0
       and t.created_at::date between p_dari and p_sampai
       and (p_penjamin is null or t.penjamin = p_penjamin)
       and (p_asuransi is null or t.asuransi_id = p_asuransi)), '[]'::jsonb);
end;
$$;

revoke all on function public.tagihan_belum_diklaim(date, date, text, uuid, uuid) from public, anon;
grant execute on function public.tagihan_belum_diklaim(date, date, text, uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- Membuat klaim
-- ------------------------------------------------------------
create or replace function public.buat_klaim(
  p_dari     date,
  p_sampai   date,
  p_penjamin text,
  p_asuransi uuid default null,
  p_catatan  text default null,
  p_company  uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
  v_isi   jsonb;
  v_row   record;
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuat klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if p_penjamin not in ('bpjs', 'asuransi') then
    raise exception 'Klaim hanya untuk BPJS atau asuransi. Pasien umum membayar sendiri.'
      using errcode = 'SH004';
  end if;
  if p_penjamin = 'asuransi' and p_asuransi is null then
    raise exception 'Pilih dulu penerbit asuransinya: satu klaim tidak bisa dikirim ke dua perusahaan.'
      using errcode = 'SH004';
  end if;
  if p_sampai < p_dari then
    raise exception 'Tanggal akhir lebih awal daripada tanggal mulai.' using errcode = 'SH004';
  end if;

  v_isi := public.tagihan_belum_diklaim(p_dari, p_sampai, p_penjamin, p_asuransi, v_co);
  if jsonb_array_length(v_isi) = 0 then
    raise exception 'Tidak ada tagihan yang belum diklaim pada rentang itu.' using errcode = 'SH004';
  end if;

  insert into public.claims (
    company_id, nomor, penjamin, asuransi_id, dari, sampai,
    jumlah_transaksi, total_pelayanan, total_ditagihkan, rincian, catatan, dibuat_oleh)
  values (
    v_co,
    public.next_doc_number(v_co, 'claims', 'nomor', 'KLM', to_char(p_sampai, 'YYYY')),
    p_penjamin, p_asuransi, p_dari, p_sampai,
    jsonb_array_length(v_isi),
    (select coalesce(sum((x ->> 'total')::numeric), 0) from jsonb_array_elements(v_isi) x),
    (select coalesce(sum((x ->> 'ditagihkan')::numeric), 0) from jsonb_array_elements(v_isi) x),
    v_isi, nullif(trim(p_catatan), ''), lower(auth.jwt() ->> 'email'))
  returning * into v_row;

  -- Penandanya dipasang SESUDAH klaimnya ada, dan hanya pada baris yang
  -- benar-benar masuk cuplikan. Kalau ditandai lebih dulu, kegagalan di tengah
  -- meninggalkan transaksi bertanda klaim yang tidak pernah ada.
  update public.transactions t
     set claim_id = v_row.id
    from jsonb_array_elements(v_isi) x
   where t.id = (x ->> 'id')::uuid and t.company_id = v_co and t.claim_id is null;

  perform public.catat_audit(v_co, 'klaim.buat', 'claims', v_row.id::text,
    jsonb_build_object('nomor', v_row.nomor, 'penjamin', p_penjamin,
                       'transaksi', v_row.jumlah_transaksi, 'nilai', v_row.total_ditagihkan));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.buat_klaim(date, date, text, uuid, text, uuid) from public, anon;
grant execute on function public.buat_klaim(date, date, text, uuid, text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Daftar klaim
-- ------------------------------------------------------------
create or replace function public.daftar_klaim(
  p_status  text default null,
  p_company uuid default null
)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_co    uuid := case when p_company is not null and v_adm
                       then p_company else public.auth_company_id() end;
  v_peran text := public.peran_saya();
begin
  if v_co is null then
    raise exception 'Fasilitas tidak ditemukan.' using errcode = 'SH004';
  end if;
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak membuka daftar klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', c.id, 'nomor', c.nomor, 'penjamin', c.penjamin,
             'asuransi', i.nama, 'dari', c.dari, 'sampai', c.sampai,
             'jumlah_transaksi', c.jumlah_transaksi,
             'total_pelayanan', c.total_pelayanan,
             'total_ditagihkan', c.total_ditagihkan,
             'status', c.status, 'dikirim_pada', c.dikirim_pada,
             'dibayar_pada', c.dibayar_pada, 'dibayar_jumlah', c.dibayar_jumlah,
             'catatan', c.catatan, 'dibuat_oleh', c.dibuat_oleh, 'created_at', c.created_at,
             'rincian', c.rincian,
             'selisih_dibatalkan', (
               select count(*) from public.transactions t
                where t.claim_id = c.id and t.status <> 'selesai'))
           order by c.created_at desc)
      from public.claims c
      left join public.insurers i on i.id = c.asuransi_id
     where c.company_id = v_co
       and (p_status is null or c.status = p_status)), '[]'::jsonb);
end;
$$;

revoke all on function public.daftar_klaim(text, uuid) from public, anon;
grant execute on function public.daftar_klaim(text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Rel keadaan: gerbangnya ikut jalur admin
-- ------------------------------------------------------------
-- `ubah_status_klaim` tidak perlu argumen faskes: p_id sudah menunjuk satu
-- baris, dan barisnya membawa company_id-nya sendiri. Yang perlu diperbaiki
-- cuma peran_saya() yang null di jalur admin, sama seperti dua di atas.
create or replace function public.ubah_status_klaim(
  p_id      uuid,
  p_status  text,
  p_dibayar numeric default null,
  p_tanggal date default null,
  p_catatan text default null
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_adm   boolean := public.boleh_admin_platform();
  v_peran text := public.peran_saya();
  v_row   record;
begin
  if not v_adm and coalesce(v_peran, '') not in ('pemilik', 'admin') then
    raise exception 'Peran % tidak berhak mengubah klaim.', coalesce(v_peran, 'tanpa peran')
      using errcode = 'SH007';
  end if;
  if p_status not in ('draf', 'dikirim', 'dibayar', 'ditolak', 'batal') then
    raise exception 'Keadaan klaim "%" tidak dikenali.', p_status using errcode = 'SH004';
  end if;

  select * into v_row from public.claims
   where id = p_id and (v_adm or company_id = public.auth_company_id())
   for update;
  if not found then
    raise exception 'Klaim tidak ditemukan.' using errcode = 'SH004';
  end if;
  if v_row.status = 'dibayar' and p_status <> 'dibayar' then
    raise exception 'Klaim yang sudah dibayar tidak bisa diubah lagi. Selisihnya diurus lewat klaim berikutnya.'
      using errcode = 'SH004';
  end if;
  if p_status = 'dibayar' and coalesce(p_dibayar, 0) <= 0 then
    raise exception 'Jumlah yang dibayar penjamin wajib diisi. Klaim dibayar nol tidak bisa dibedakan dari klaim yang ditolak.'
      using errcode = 'SH004';
  end if;

  update public.claims set
    status         = p_status,
    dikirim_pada   = case when p_status = 'dikirim' then coalesce(dikirim_pada, now()) else dikirim_pada end,
    dibayar_pada   = case when p_status = 'dibayar' then coalesce(p_tanggal, current_date) else null end,
    dibayar_jumlah = case when p_status = 'dibayar' then p_dibayar else null end,
    catatan        = coalesce(nullif(trim(p_catatan), ''), catatan)
   where id = p_id
  returning * into v_row;

  if p_status = 'batal' then
    update public.transactions set claim_id = null where claim_id = p_id;
  end if;

  perform public.catat_audit(v_row.company_id, 'klaim.' || p_status, 'claims', p_id::text,
    jsonb_build_object('nomor', v_row.nomor, 'dibayar', v_row.dibayar_jumlah));

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.ubah_status_klaim(uuid, text, numeric, date, text) from public, anon;
grant execute on function public.ubah_status_klaim(uuid, text, numeric, date, text) to authenticated;
