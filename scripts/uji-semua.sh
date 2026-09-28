#!/usr/bin/env bash
# Menjalankan SELURUH berkas di supabase/uji/ ke database yang tertaut.
#
# Tiap berkas diakhiri `raise exception`, jadi tidak ada yang tertinggal di
# database. Yang lulus hanya yang galat terakhirnya berbunyi "SEMUA UJI LULUS";
# selain itu dicetak beserta pesannya.
#
# Jalankan sesudah tiap migrasi, bukan cuma uji milik migrasi itu. Bug
# penunjang di luar katalog (0086) ditemukan uji 0061 yang lahir dua puluh
# lima migrasi sebelumnya, dan enam uji yang dibiarkan merah sempat membuat
# yang merah berhenti dibaca.
#
#   bash scripts/uji-semua.sh

set -u
cd "$(dirname "$0")/.."

export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2-)"

lulus=0
gagal=0
for f in supabase/uji/*.sql; do
  hasil="$(supabase db query --linked -f "$f" 2>&1 | grep -oE 'SEMUA UJI LULUS|ERROR: [^\\]{0,200}' | head -1)"
  if [[ "$hasil" == *"SEMUA UJI LULUS"* ]]; then
    lulus=$((lulus + 1))
  else
    gagal=$((gagal + 1))
    echo "GAGAL $(basename "$f"): ${hasil:-tanpa keluaran}"
  fi
done

echo "lulus $lulus, gagal $gagal"
[ "$gagal" -eq 0 ]
