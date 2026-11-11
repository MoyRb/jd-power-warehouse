import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #F3C41B',
        }}
      >
        <span
          style={{
            color: '#F3C41B',
            fontSize: 11,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          JD
        </span>
      </div>
    ),
    { ...size },
  )
}
