interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export default function Card({ children, title, subtitle, className = '' }: Props) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-slate-100">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
