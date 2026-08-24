interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  accent: 'blue' | 'red' | 'amber' | 'green'
}

const accentMap = {
  blue:  { bg: 'bg-blue-50',  icon: 'bg-blue-100 text-blue-600',  value: 'text-blue-700'  },
  red:   { bg: 'bg-red-50',   icon: 'bg-red-100 text-red-600',    value: 'text-red-700'   },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600',value: 'text-amber-700' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600',value: 'text-green-700' },
}

export default function KpiCard({ title, value, subtitle, icon, accent }: Props) {
  const a = accentMap[accent]
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 flex items-start gap-4`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${a.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-2xl font-bold ${a.value}`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
