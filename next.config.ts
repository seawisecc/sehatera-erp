import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        /**
         * Service worker tidak boleh ikut tersimpan di cache peramban.
         *
         * Ia berkas yang tugasnya MENGATUR cache, jadi versi lamanya yang
         * tertahan berarti aturan lama bertahan juga, dan pembaruan berikutnya
         * tidak pernah sampai ke komputer klinik tanpa ada yang menyadarinya.
         * Pendaftarannya sudah memakai `updateViaCache: 'none'`, ini
         * lapis keduanya dari sisi server.
         */
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
