import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ChartLine, Home as HomeIcon, Play, Sparkles } from 'lucide-react'
import { todayRoutine, useRoutines, useStore } from './store'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import PlanScreen from './screens/PlanScreen'
import Progress from './screens/Progress'
import SettingsScreen from './screens/Settings'
import SessionScreen from './screens/Session'
import CheckInScreen from './screens/CheckIn'
import RoutineEditor from './screens/RoutineEditor'
import { cx } from './components/ui'

function BottomNav() {
  const nav = useNavigate()
  const routines = useRoutines()
  const today = todayRoutine(routines)
  const item = (to: string, label: string, Icon: typeof HomeIcon) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) => cx('flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted')}
    >
      <Icon size={22} />
      {label}
    </NavLink>
  )
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line pb-safe">
      <div className="mx-auto flex max-w-md items-end px-2">
        {item('/', 'Hoy', HomeIcon)}
        {item('/plan', 'Plan IA', Sparkles)}
        <button
          onClick={() => {
            const r = today ?? routines[0]
            nav(r ? `/session/${r.id}` : '/plan')
          }}
          className="flex flex-1 flex-col items-center gap-1 pb-2 text-[11px] font-semibold text-muted"
        >
          <span className="bg-grad shadow-glow -mt-5 grid size-14 place-items-center rounded-full text-white">
            <Play size={24} fill="currentColor" />
          </span>
          Entrenar
        </button>
        {item('/progress', 'Progreso', ChartLine)}
      </div>
    </nav>
  )
}

function Shell() {
  const profile = useStore((s) => s.profile)
  const plan = useStore((s) => s.plan)
  const loc = useLocation()
  const ready = profile && plan
  const showNav = ready && ['/', '/plan', '/progress'].includes(loc.pathname)
  return (
    <div className={cx('mx-auto min-h-dvh max-w-md bg-[#fff8f8]', showNav && 'pb-24')}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        {!ready ? (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<PlanScreen />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/session/:id" element={<SessionScreen />} />
            <Route path="/checkin/:sessionId" element={<CheckInScreen />} />
            <Route path="/routine/:id" element={<RoutineEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      {showNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
