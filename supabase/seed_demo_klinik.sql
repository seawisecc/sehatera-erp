-- ============================================================
-- Data contoh Klinik Rexco 88, bagian 1: data induk
-- ============================================================
--
-- BUKAN migrasi, dan tidak dijalankan otomatis. Ini pengisi data uji supaya
-- modul yang baru selesai bisa dicoba dengan bentuk yang mirip klinik
-- sungguhan, bukan dengan satu baris contoh.
--
-- **Idempoten**: aman dijalankan berulang. Tiap penyisipan memakai
-- `on conflict do nothing` atau `where not exists`, dan tidak ada satu pun
-- yang menyentuh fasilitas selain Klinik Rexco 88.

do $$
declare
  v_co    uuid;
  v_grup  uuid;
  v_u     uuid;
  v_svc   uuid;
  v_n     integer;
  r       record;
begin
  select id into v_co from public.companies
   where nama = 'Klinik Rexco 88' and deleted_at is null limit 1;
  if v_co is null then
    raise exception 'Klinik Rexco 88 tidak ditemukan. Skrip ini sengaja tidak mengisi fasilitas lain.';
  end if;

  -- ── 1. Asuransi rekanan ────────────────────────────────────────────────
  insert into public.insurers (company_id, nama)
  select v_co, x from unnest(array['Allianz', 'Prudential', 'AXA Mandiri', 'Great Eastern']) x
  on conflict do nothing;

  -- ── 2. Jadwal praktik tiap poli, Senin sampai Sabtu ─────────────────────
  -- Poli Umum pagi dan sore; sisanya satu sesi. Kuota sengaja berbeda-beda
  -- supaya "penuh" dan "masih longgar" dua-duanya bisa dicoba.
  for r in select id, nama from public.clinic_units where company_id = v_co and aktif loop
    for v_n in 1..6 loop
      insert into public.doctor_schedules (company_id, unit_id, hari, jam_mulai, jam_selesai, kuota)
      select v_co, r.id, v_n, '08:00', '12:00',
             case r.nama when 'Umum' then 25 when 'Gigi' then 8 when 'KIA' then 12 else 10 end
      where not exists (
        select 1 from public.doctor_schedules
         where unit_id = r.id and hari = v_n and jam_mulai = '08:00');

      if r.nama = 'Umum' then
        insert into public.doctor_schedules (company_id, unit_id, hari, jam_mulai, jam_selesai, kuota)
        select v_co, r.id, v_n, '16:00', '20:00', 20
        where not exists (
          select 1 from public.doctor_schedules
           where unit_id = r.id and hari = v_n and jam_mulai = '16:00');
      end if;
    end loop;
  end loop;

  -- ── 3. Tarif dan paket pemeriksaan penunjang ───────────────────────────
  -- Parameternya lengkap dengan rentang rujukan, supaya formulir hasil di
  -- layar lab benar-benar terisi sendiri dan penanda tinggi/rendah bekerja.

  -- Darah lengkap: paket terpanjang, dan yang paling membuktikan gunanya
  -- cetakan parameter.
  select id into v_svc from public.services where company_id = v_co and nama = 'Darah Lengkap';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_loinc)
    values (v_co, 'Darah Lengkap', 85000, 'Hematologi rutin', 'aktif', 'lab', '58410-2')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, kode_loinc, satuan, rujukan_bawah, rujukan_atas, urutan)
  values
    (v_co, v_svc, 'Hemoglobin',  '718-7',  'g/dL',     13,      17,      1),
    (v_co, v_svc, 'Hematokrit',  '4544-3', '%',        40,      52,      2),
    (v_co, v_svc, 'Eritrosit',   '789-8',  'juta/uL',  4.5,     5.9,     3),
    (v_co, v_svc, 'Leukosit',    '6690-2', '/uL',      4000,    11000,   4),
    (v_co, v_svc, 'Trombosit',   '777-3',  '/uL',      150000,  450000,  5),
    (v_co, v_svc, 'MCV',         '787-2',  'fL',       80,      100,     6),
    (v_co, v_svc, 'MCH',         '785-6',  'pg',       27,      33,      7),
    (v_co, v_svc, 'MCHC',        '786-4',  'g/dL',     32,      36,      8),
    (v_co, v_svc, 'Limfosit',    '736-9',  '%',        20,      40,      9),
    (v_co, v_svc, 'Neutrofil',   '770-8',  '%',        50,      70,      10);

  select id into v_svc from public.services where company_id = v_co and nama = 'Gula Darah Puasa';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_loinc)
    values (v_co, 'Gula Darah Puasa', 35000, 'Puasa 8 jam', 'aktif', 'lab', '1558-6')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, kode_loinc, satuan, rujukan_bawah, rujukan_atas, urutan)
  values (v_co, v_svc, 'Glukosa puasa', '1558-6', 'mg/dL', 70, 100, 1);

  select id into v_svc from public.services where company_id = v_co and nama = 'Profil Lipid';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_loinc)
    values (v_co, 'Profil Lipid', 120000, 'Puasa 12 jam', 'aktif', 'lab', '57698-3')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, kode_loinc, satuan, rujukan_bawah, rujukan_atas, rujukan_teks, urutan)
  values
    (v_co, v_svc, 'Kolesterol total', '2093-3', 'mg/dL', null, 200, '< 200', 1),
    (v_co, v_svc, 'Trigliserida',     '2571-8', 'mg/dL', null, 150, '< 150', 2),
    (v_co, v_svc, 'HDL',              '2085-9', 'mg/dL', 40,   null, '> 40',  3),
    (v_co, v_svc, 'LDL',              '2089-1', 'mg/dL', null, 100, '< 100', 4);

  select id into v_svc from public.services where company_id = v_co and nama = 'Asam Urat Darah';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_loinc)
    values (v_co, 'Asam Urat Darah', 40000, null, 'aktif', 'lab', '3084-1')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, kode_loinc, satuan, rujukan_bawah, rujukan_atas, urutan)
  values (v_co, v_svc, 'Asam urat', '3084-1', 'mg/dL', 3.4, 7.0, 1);

  select id into v_svc from public.services where company_id = v_co and nama = 'Widal';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang)
    values (v_co, 'Widal', 55000, 'Curiga demam tifoid', 'aktif', 'lab')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, satuan, rujukan_teks, urutan)
  values
    (v_co, v_svc, 'S. typhi O',  'titer', 'negatif / < 1:80', 1),
    (v_co, v_svc, 'S. typhi H',  'titer', 'negatif / < 1:80', 2),
    (v_co, v_svc, 'S. paratyphi AO', 'titer', 'negatif / < 1:80', 3),
    (v_co, v_svc, 'S. paratyphi BO', 'titer', 'negatif / < 1:80', 4);

  select id into v_svc from public.services where company_id = v_co and nama = 'Urine Lengkap';
  if v_svc is null then
    insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_loinc)
    values (v_co, 'Urine Lengkap', 45000, null, 'aktif', 'lab', '24357-6')
    returning id into v_svc;
  end if;
  delete from public.service_lab_params where service_id = v_svc;
  insert into public.service_lab_params (company_id, service_id, nama, satuan, rujukan_teks, urutan)
  values
    (v_co, v_svc, 'Warna',      null, 'kuning jernih', 1),
    (v_co, v_svc, 'Protein',    null, 'negatif',       2),
    (v_co, v_svc, 'Glukosa',    null, 'negatif',       3),
    (v_co, v_svc, 'Leukosit',   '/LPB', '0 - 5',       4),
    (v_co, v_svc, 'Eritrosit',  '/LPB', '0 - 2',       5);

  -- Radiologi: tanpa cetakan parameter, dan itu disengaja. Bacaannya naratif.
  insert into public.services (company_id, nama, harga, deskripsi, status, jenis_penunjang, kode_icd9)
  select v_co, x.nama, x.harga, x.ket, 'aktif', 'radiologi', x.icd9
    from (values
      ('Thorax PA',            150000, 'Foto polos dada',        '87.44'),
      ('Thorax PA & Lateral',  220000, 'Dua posisi',             '87.44'),
      ('Foto Polos Abdomen',   180000, 'BNO',                    '88.19'),
      ('USG Abdomen',          250000, 'Perlu puasa 6 jam',      '88.76'),
      ('USG Kehamilan',        200000, 'Obstetri',               '88.78'),
      ('Foto Ekstremitas',     165000, 'Satu sisi, dua posisi',  '88.23')
    ) as x(nama, harga, ket, icd9)
   where not exists (select 1 from public.services s where s.company_id = v_co and s.nama = x.nama);

  -- ── 4. Outlet kedua, supaya pemilih outlet bisa dicoba ─────────────────
  -- Pemilih outlet di kanan atas sengaja menyembunyikan dirinya kalau
  -- outletnya cuma satu, jadi selama ini ia tidak pernah muncul di layar.
  select group_id into v_grup from public.companies where id = v_co;
  if v_grup is null then
    insert into public.company_groups (nama, dibuat_oleh)
    values ('Grup Rexco', (select admin_email from public.companies where id = v_co))
    returning id into v_grup;
    update public.companies set group_id = v_grup where id = v_co;
  end if;

  if not exists (select 1 from public.companies where group_id = v_grup and nama = 'Apotek Rexco Renon') then
    insert into public.companies (nama, kota, admin_email, sektor, group_id, plan_id, status,
                                  trial_ends_at, subscription_ends_at)
    select 'Apotek Rexco Renon', 'Denpasar', admin_email, 'apotek', v_grup, plan_id, status,
           trial_ends_at, subscription_ends_at
      from public.companies where id = v_co;
  end if;

  raise notice 'Data induk Klinik Rexco 88 terisi.';
end $$;
