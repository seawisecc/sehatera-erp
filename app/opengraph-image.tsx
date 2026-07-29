import { ImageResponse } from 'next/og'

export const alt = 'Pharmacy Store by Seawise Studio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const chips = ['Dashboard Analitik', 'Kasir & Resep', 'Batch & Kadaluarsa', 'Order Terpandu', 'Laporan SIPNAP']
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '68px 72px',
          background: 'linear-gradient(135deg, #16281d 0%, #1e3a2c 48%, #3a3320 100%)',
          color: '#ffffff',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 22,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.5px' }}>Pharmacy Store</div>
            <div style={{ fontSize: 24, color: '#9db3a5' }}>by Seawise Studio</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 22 }}>
          Apotek Anda, dikelola dengan tenang.
        </div>

        <div style={{ fontSize: 27, color: '#c9d6cc', lineHeight: 1.45, marginBottom: 44, maxWidth: 940 }}>
          Dashboard analitik real-time, kasir &amp; resep, stok &amp; kadaluarsa, order terpandu, hingga laporan SIPNAP, dalam satu aplikasi.
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                fontSize: 21,
                color: '#e8efe9',
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 999,
                padding: '10px 22px',
                marginRight: 12,
                marginBottom: 12,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
