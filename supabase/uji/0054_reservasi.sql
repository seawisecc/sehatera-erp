-- ============================================================
-- Uji migrasi 0054: reservasi
-- ============================================================
--
-- BUKAN migrasi. Diakhiri `raise exception`, jadi tidak mengubah apa pun.

do $$
declare
  v_co   uuid;
  v_unit uuid;
  v_jad  uuid;
  v_jad2 uuid;
  v_pas  uuid;
  v_pas2 uuid;
  v_res  jsonb;
  v_id   uuid;
  v_hasil jsonb;
  v_row  record;
  v_tgl  date;
  v_n    integer;
  v_stat text;
  v_asu  uuid;
  v_jt   jsonb;
begin
  select id into v_co from public.companies where sektor in ('klinik','rumah_sakit') limit 1;
  if v_co is null then raise exception 'Tidak ada faskes klinik untuk diuji.'; end if;
  select id into v_unit from public.clinic_units where company_id = v_co and aktif limit 1;
  if v_unit is null then raise exception 'Tidak ada poli untuk diuji.'; end if;

  -- Besok, supaya tidak bergantung pada hari apa uji ini dijalankan.
  v_tgl := current_date + 1;

  insert into public.doctor_schedules (company_id, unit_id, dokter_email, hari, jam_mulai, jam_selesai, kuota)
  values (v_co, v_unit, 'uji.dokter@contoh.id', extract(dow from v_tgl)::smallint, '08:00', '12:00', 2)
  returning id into v_jad;

  insert into public.patients (company_id, nama) values (v_co, 'UJI RESERVASI SATU') returning id into v_pas;
  insert into public.patients (company_id, nama) values (v_co, 'UJI RESERVASI DUA')  returning id into v_pas2;

  -- 1. Reservasi tanpa pasien terdaftar HARUS bisa ---------------------------
  -- Inti bentuk modul ini: yang menelepon besok pagi belum tentu punya nomor RM.
  v_res := public.buat_reservasi('Orang Yang Menelepon', v_tgl, v_jad, '08123456789', p_company => v_co);
  if (v_res ->> 'patient_id') is not null then
    raise exception 'Reservasi tanpa pasien malah membuat pasien.';
  end if;
  if (v_res ->> 'nomor') is null then
    raise exception 'Reservasi tidak dapat nomor.';
  end if;
  if (v_res ->> 'urut')::integer <> 1 then
    raise exception 'Urutan pertama tercatat %, seharusnya 1.', v_res ->> 'urut';
  end if;

  -- 2. Kuota ditegakkan database ---------------------------------------------
  perform public.buat_reservasi('Orang Kedua', v_tgl, v_jad, null, v_pas, p_company => v_co);
  begin
    perform public.buat_reservasi('Orang Ketiga', v_tgl, v_jad, null, v_pas2, p_company => v_co);
    raise exception 'Kuota 2 dilewati oleh pemesan ketiga.';
  exception when sqlstate 'SH002' then null;
  end;

  -- 3. Yang batal MENGEMBALIKAN tempatnya ------------------------------------
  -- Kalau tidak, sesi yang seluruh pemesannya membatalkan akan tetap terkunci
  -- penuh sampai besok, dan klinik menolak orang di depan kursi kosong.
  select id into v_id from public.reservations
   where jadwal_id = v_jad and tanggal = v_tgl and status = 'menunggu' order by urut limit 1;
  perform public.batal_reservasi(v_id, 'Uji');
  v_res := public.buat_reservasi('Orang Ketiga', v_tgl, v_jad, null, v_pas2, p_company => v_co);
  if (v_res ->> 'id') is null then
    raise exception 'Tempat yang dibatalkan tidak kembali bisa dipesan.';
  end if;

  -- 4. Kuota nol berarti TANPA BATAS -----------------------------------------
  insert into public.doctor_schedules (company_id, unit_id, hari, jam_mulai, jam_selesai, kuota)
  values (v_co, v_unit, extract(dow from v_tgl)::smallint, '13:00', '17:00', 0)
  returning id into v_jad2;
  for v_n in 1..5 loop
    perform public.buat_reservasi('Sore ' || v_n, v_tgl, v_jad2, p_company => v_co);
  end loop;

  -- 5. Tanggal yang sudah lewat ditolak --------------------------------------
  begin
    perform public.buat_reservasi('Kemarin', current_date - 1, v_jad, p_company => v_co);
    raise exception 'Reservasi untuk kemarin diterima.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 6. Jadwal hari lain ditolak ----------------------------------------------
  begin
    perform public.buat_reservasi('Salah hari', v_tgl + 1, v_jad, p_company => v_co);
    raise exception 'Jadwal dipakai pada hari yang bukan harinya.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 7. Satu pasien tidak punya dua janji terbuka di poli & hari yang sama ----
  begin
    perform public.buat_reservasi('Orang Kedua Lagi', v_tgl, v_jad2, null, v_pas, p_company => v_co);
    raise exception 'Satu pasien bisa memesan dua kali di poli dan hari yang sama.';
  exception when unique_violation then null;
  end;

  -- 8. Penerbit asuransi tanpa penjamin asuransi ditolak ---------------------
  insert into public.insurers (company_id, nama) values (v_co, 'UJI RESERVASI ASURANSI')
    returning id into v_asu;
  begin
    perform public.buat_reservasi('Salah penjamin', v_tgl, v_jad2, null, null, null, 'umum', v_asu, p_company => v_co);
    raise exception 'Penerbit asuransi diterima padahal penjaminnya umum.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 9. Sisa yang dilihat layar sama dengan yang dipakai menolak --------------
  v_jt := public.jadwal_tanggal(v_tgl, v_co);
  if not exists (select 1 from jsonb_array_elements(v_jt) x
                  where (x ->> 'id')::uuid = v_jad and (x ->> 'terpakai')::integer = 2) then
    raise exception 'Hitungan terpakai di jadwal_tanggal tidak cocok dengan yang sebenarnya: %', v_jt;
  end if;

  -- 10. Hadir: lahir jadi kunjungan lewat jalur yang sama ---------------------
  select id into v_id from public.reservations
   where jadwal_id = v_jad and tanggal = v_tgl and patient_id = v_pas2 and status = 'menunggu';
  v_hasil := public.hadirkan_reservasi(v_id);
  if (v_hasil -> 'kunjungan' ->> 'id') is null then
    raise exception 'Reservasi hadir tapi tidak melahirkan kunjungan.';
  end if;
  -- Nomor antrean ikut, artinya benar-benar lewat `daftar_kunjungan`.
  if (v_hasil -> 'kunjungan' ->> 'nomor_antre') is null then
    raise exception 'Kunjungan dari reservasi tidak punya nomor antrean. Jalurnya bukan daftar_kunjungan.';
  end if;
  -- Biaya administrasi ikut masuk, artinya triggernya juga kena.
  select count(*) into v_n from public.visit_charges
   where visit_id = (v_hasil -> 'kunjungan' ->> 'id')::uuid;
  if v_n = 0 then
    raise exception 'Kunjungan dari reservasi tidak membawa biaya apa pun. Trigger biaya terlewat.';
  end if;

  select * into v_row from public.reservations where id = v_id;
  if v_row.status <> 'hadir' or v_row.visit_id is null then
    raise exception 'Reservasi tidak tertaut ke kunjungannya: status %, visit %.', v_row.status, v_row.visit_id;
  end if;

  -- 11. Yang sudah hadir tidak bisa dihadirkan atau dibatalkan lagi ----------
  begin
    perform public.hadirkan_reservasi(v_id);
    raise exception 'Reservasi yang sudah hadir bisa dihadirkan dua kali.';
  exception when sqlstate 'SH004' then null;
  end;
  begin
    perform public.batal_reservasi(v_id);
    raise exception 'Reservasi yang sudah hadir masih bisa dibatalkan.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 12. Tanpa nomor RM, kehadiran menuntut pasiennya dicocokkan --------------
  select id into v_id from public.reservations
   where jadwal_id = v_jad2 and tanggal = v_tgl and patient_id is null limit 1;
  begin
    perform public.hadirkan_reservasi(v_id);
    raise exception 'Reservasi tanpa nomor RM jadi kunjungan tanpa pasien.';
  exception when sqlstate 'SH004' then null;
  end;

  -- 13. Reservasi kemarin yang tidak datang jadi hangus ----------------------
  insert into public.reservations (company_id, nama, tanggal, unit_id, jadwal_id)
  values (v_co, 'UJI TIDAK DATANG', current_date - 3, v_unit, v_jad) returning id into v_id;
  perform public.hanguskan_reservasi_lewat(v_co);
  select status into v_stat from public.reservations where id = v_id;
  if v_stat <> 'hangus' then
    raise exception 'Reservasi tiga hari lalu masih berstatus %, jadi hitungan hari ini akan salah.', v_stat;
  end if;

  -- 14. Yang hangus tidak ikut menghabiskan kuota -----------------------------
  select count(*) into v_n from public.reservations
   where jadwal_id = v_jad and tanggal = v_tgl and status = 'menunggu';
  if v_n <> 1 then
    raise exception 'Sisa menunggu di sesi pagi %, seharusnya 1.', v_n;
  end if;

  raise exception 'SEMUA UJI LULUS. Kuota ditegakkan database, dan reservasi jadi kunjungan lewat jalur yang sama dengan pendaftaran.';
end $$;
