import type { Routine, Session } from '../types'
import { addDays, dayKey, weekday } from './utils'

export function sessionDays(sessions: Session[]) {
  return new Set(sessions.map((s) => dayKey(s.date)))
}

/**
 * Racha: días seguidos sin saltarse un entreno programado.
 * Los días de descanso no rompen la racha; hoy cuenta si ya entrenaste
 * (si no, la racha llega hasta ayer).
 */
export function streak(sessions: Session[], scheduled: (wd: number) => boolean) {
  if (!sessions.length) return 0
  const done = sessionDays(sessions)
  const first = new Date(Math.min(...sessions.map((s) => new Date(s.date).getTime())))
  const firstKey = dayKey(first)
  let d = new Date()
  if (!done.has(dayKey(d))) d = addDays(d, -1)
  let n = 0
  for (let i = 0; i < 730; i++) {
    const k = dayKey(d)
    if (done.has(k)) n++
    else if (scheduled(weekday(d))) break
    else n++
    if (k <= firstKey) break
    d = addDays(d, -1)
  }
  return n
}

export function bestStreakSessions(sessions: Session[]) {
  return sessionDays(sessions).size
}

export function routineForDay(routines: Routine[], wd: number): Routine | undefined {
  return routines.find((r) => r.days.includes(wd))
}
