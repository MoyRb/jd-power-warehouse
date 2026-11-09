import type { InquiryDayCount } from '@/lib/db'

interface SparklineProps {
  data: InquiryDayCount[]
  width?: number
  height?: number
  className?: string
}

export function Sparkline({ data, width = 400, height = 80, className }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className={className}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#2e2e2e"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  const counts = data.map((d) => d.count)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)
  const range = maxCount - minCount || 1

  const pad = 4
  const usableW = width - pad * 2
  const usableH = height - pad * 2

  const toX = (i: number) => pad + (i / (data.length - 1)) * usableW
  const toY = (v: number) => pad + usableH - ((v - minCount) / range) * usableH

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.count)}`).join(' ')

  // Polygon for fill area: line path + bottom-right + bottom-left
  const fillPoints = [
    ...data.map((d, i) => `${toX(i)},${toY(d.count)}`),
    `${toX(data.length - 1)},${height}`,
    `${toX(0)},${height}`,
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      className={className}
      aria-hidden="true"
    >
      <polygon points={fillPoints} fill="#f3c41b" fillOpacity="0.1" />
      <polyline
        points={linePoints}
        fill="none"
        stroke="#f3c41b"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
