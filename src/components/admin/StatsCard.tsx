interface StatsCardProps {
  title: string
  value: number | string
  label: string
  accent?: boolean
}

export default function StatsCard({ title, value, label, accent = false }: StatsCardProps) {
  return (
    <div className={`bg-[#141414] border rounded-xl p-6 ${accent ? 'border-[#f3c41b]/40' : 'border-[#2e2e2e]'}`}>
      <p className="text-[#8c8c8c] text-sm font-medium mb-2">{title}</p>
      <p className={`text-4xl font-black mb-1 ${accent ? 'text-[#f3c41b]' : 'text-[#f6f4ee]'}`}>
        {value}
      </p>
      <p className="text-[#8c8c8c] text-xs">{label}</p>
    </div>
  )
}
