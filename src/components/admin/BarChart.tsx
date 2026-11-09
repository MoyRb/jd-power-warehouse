export interface BarChartItem {
  label: string
  value: number
  sublabel?: string
}

interface BarChartProps {
  items: BarChartItem[]
  maxValue?: number
  className?: string
}

export function BarChart({ items, maxValue, className }: BarChartProps) {
  if (items.length === 0) {
    return <p className="text-[#8c8c8c] text-sm">No data</p>
  }

  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1)

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {items.map((item) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0
        return (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className="w-32 truncate text-[#f6f4ee] shrink-0" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 bg-[#2e2e2e] rounded h-2 overflow-hidden">
              <div
                className="h-2 rounded bg-[#f3c41b]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-[#8c8c8c] shrink-0">{item.value}</span>
            {item.sublabel && (
              <span className="text-[#8c8c8c] text-xs shrink-0">{item.sublabel}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
