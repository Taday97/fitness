import type { Routine, RoutineItem, Settings } from '../types'
import { getEx } from '../data/exercises'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** 0 = lunes … 6 = domingo */
export const weekday = (d = new Date()) => (d.getDay() + 6) % 7

export const dayKey = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const startOfWeek = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return addDays(x, -weekday(x))
}

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(iso).toLocaleDateString('es-ES', opts)

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const allItems = (r: Routine) => [...r.warmup, ...r.main, ...r.cooldown]

/** Segundos de trabajo de una serie. */
export function workSec(it: RoutineItem) {
  const ex = getEx(it.exerciseId)
  if (ex.kind === 'time') return it.seconds ?? 30
  return (it.reps ?? 10) * 3 * (ex.perSide ? 2 : 1)
}

export function restAfterSet(it: RoutineItem, s: Settings) {
  return it.restSec ?? s.restBetweenSets
}

export function estimateMinutes(r: Routine, s: Settings) {
  let t = s.prepSec
  for (const sec of ['warmup', 'main', 'cooldown'] as const) {
    r[sec].forEach((it) => {
      t += workSec(it) * it.sets
      if (sec === 'main') t += restAfterSet(it, s) * (it.sets - 1) + (it.restSec ?? s.restBetweenExercises)
      else t += s.prepSec
    })
  }
  return Math.max(1, Math.round(t / 60))
}

export function estimateKcal(r: Routine, weightKg: number) {
  let kcal = 0
  for (const it of allItems(r)) {
    const ex = getEx(it.exerciseId)
    kcal += (ex.met * 3.5 * weightKg) / 200 * ((workSec(it) * it.sets) / 60)
  }
  // descansos: ~1,5 MET
  kcal += (1.5 * 3.5 * weightKg) / 200 * 4
  return Math.round(kcal)
}

export const totalSets = (r: Routine) => r.main.reduce((s, it) => s + it.sets, 0)

export function itemLabel(it: RoutineItem) {
  const ex = getEx(it.exerciseId)
  const side = ex.perSide ? ' por lado' : ''
  if (ex.kind === 'time') return `${it.seconds ?? 30} s${side}`
  return `${it.reps ?? 10} reps${side}`
}

export function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
