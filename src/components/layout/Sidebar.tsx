import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patients', label: 'Patients', icon: Users, end: false },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp, end: false },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">MRI Insight</p>
          <p className="text-slate-400 text-xs">Patient Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              ].join(' ')
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <p className="text-slate-500 text-xs">MRI Patient Tracker</p>
        <p className="text-slate-600 text-xs">v1.0 — Prototype</p>
      </div>
    </aside>
  )
}
