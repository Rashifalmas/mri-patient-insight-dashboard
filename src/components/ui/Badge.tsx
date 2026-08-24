const statusStyles: Record<string, string> = {
  completed:   'bg-green-100 text-green-700',
  waiting:     'bg-amber-100 text-amber-700',
  'in progress': 'bg-blue-100 text-blue-700',
  cancelled:   'bg-slate-100 text-slate-600',
  scheduled:   'bg-purple-100 text-purple-700',
}

const priorityStyles: Record<string, string> = {
  emergency: 'bg-red-100 text-red-700',
  urgent:    'bg-orange-100 text-orange-700',
  normal:    'bg-slate-100 text-slate-600',
  routine:   'bg-slate-100 text-slate-500',
}

interface Props {
  value: string
  variant?: 'status' | 'priority'
}

export default function Badge({ value, variant = 'status' }: Props) {
  const map = variant === 'status' ? statusStyles : priorityStyles
  const styles = map[value.toLowerCase()] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles}`}>
      {value}
    </span>
  )
}
