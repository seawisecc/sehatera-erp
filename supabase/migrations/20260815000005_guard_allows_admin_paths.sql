-- ============================================================
-- Sehatera · 0005 · Gerbang kolom komersial: izinkan jalur admin
--
-- Migrasi 0002 memasang `guard_company_commercial()` untuk menahan pemilik
-- apotek mengubah paket dan masa aktifnya sendiri — RLS menyaring baris, bukan
-- kolom, jadi izin memperbarui profil apotek otomatis mencakup `status` dan
-- tanggal langganan juga.
--
-- Yang terlewat: gerbang itu bersandar sepenuhnya pada `is_super_admin()`, yang
-- membaca email dari JWT. Koneksi yang TIDAK lewat PostgREST — migrasi, skrip
-- seed, tugas terjadwal, dan kunci service_role di sisi server — sama sekali
-- tidak punya JWT, jadi semuanya ikut tertolak. Ketahuan saat menjalankan seed
-- data demo: skrip yang berjalan sebagai pemilik database sendiri ditolak
-- dengan pesan yang ditujukan untuk pemilik apotek.
--
-- Yang TIDAK boleh ikut lolos adalah kunci `anon` dan `authenticated`: keduanya
-- selalu membawa JWT, jadi keduanya tetap melewati pemeriksaan di bawah.
-- ============================================================

create or replace function public.guard_company_commercial()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if public.is_super_admin()
     -- Kunci service_role: dipakai kode sisi server yang memang berwenang
     -- (mis. webhook pembayaran yang memperpanjang langganan sesudah dana
     -- masuk). Tidak pernah ada di browser.
     or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     -- Tanpa JWT sama sekali = koneksi database langsung: migrasi, seed, atau
     -- SQL Editor. Permintaan dari aplikasi SELALU membawa JWT, jadi jalur ini
     -- tidak bisa dicapai dari browser.
     or auth.jwt() is null
  then
    return new;
  end if;

  if new.plan_id                 is distinct from old.plan_id
     or new.status               is distinct from old.status
     or new.trial_ends_at        is distinct from old.trial_ends_at
     or new.subscription_ends_at is distinct from old.subscription_ends_at
     or new.deleted_at           is distinct from old.deleted_at
     or new.admin_email          is distinct from old.admin_email then
    raise exception 'Paket dan masa aktif hanya bisa diubah oleh admin Sehatera.'
      using errcode = 'SH001';
  end if;

  return new;
end;
$$;

comment on function public.guard_company_commercial is
  'RLS menyaring baris, bukan kolom. Trigger ini yang menahan pemilik apotek mengubah paket dan masa aktifnya sendiri. Super admin, service_role, dan koneksi database langsung dilewatkan.';
