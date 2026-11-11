import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          borderRadius: '50%',
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '8px solid #F3C41B',
        }}
      >
        <span
          style={{
            color: '#F3C41B',
            fontSize: 68,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-2px',
          }}
        >
          JD
        </span>
      </div>
    ),
    { ...size },
  )
}
