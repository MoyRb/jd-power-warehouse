import { ImageResponse } from 'next/og'
import { SITE_CONFIG } from '@/lib/site-config'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#F3C41B',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#141414',
            border: '3px solid #F3C41B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <span style={{ color: '#F3C41B', fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>
            JD
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: '#F3C41B',
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: 16,
          }}
        >
          JD Power Warehouse
        </div>

        {/* Sub-headline */}
        <div
          style={{
            color: '#F6F4EE',
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
            opacity: 0.9,
          }}
        >
          Discount Home Improvement &amp; Tools
        </div>

        {/* Details row */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <span style={{ color: '#8C8C8C', fontSize: 20 }}>
            {SITE_CONFIG.location.display}
          </span>
          <span style={{ color: '#F3C41B', fontSize: 20, opacity: 0.4 }}>•</span>
          <span style={{ color: '#8C8C8C', fontSize: 20 }}>
            {SITE_CONFIG.hours.display}
          </span>
          <span style={{ color: '#F3C41B', fontSize: 20, opacity: 0.4 }}>•</span>
          <span style={{ color: '#F3C41B', fontSize: 20, fontWeight: 700 }}>
            Up to 70% off retail
          </span>
        </div>

        {/* Domain watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 80,
            color: '#8C8C8C',
            fontSize: 18,
            opacity: 0.6,
          }}
        >
          jd-power-warehouse.com
        </div>
      </div>
    ),
    { ...size },
  )
}
