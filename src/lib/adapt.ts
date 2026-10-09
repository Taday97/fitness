import type { CheckIn, Plan, Profile } from '../types'
import { getEx } from '../data/exercises'
import { localNutrition } from './nutrition'

/** Ajuste sencillo sin IA a partir del último check-in. */
export function localAdapt(plan: Plan, p: Profile, c: CheckIn): Plan {
  const easy = c.rpe <= 6 || c.sensations.includes('Muy fácil')
  const hard = c.rpe >= 9 || c.sensations.includes('Muy difícil') || c.energy === 'low'
  const adjustments: string[] = []
  const routines = plan.routines.map((r) => ({
    ...r,
    main: r.main.map((it) => {
      const ex = getEx(it.exerciseId)
      if (!easy && !hard) return it
      const n = { ...it }
      if (ex.kind === 'time') n.seconds = Math.max(15, (it.seconds ?? 30) + (easy ? 5 : -5))
      else n.reps = Math.max(5, (it.reps ?? 10) + (easy ? 2 : -2))
      return n
    }),
  }))
  if (easy) adjustments.push('Esfuerzo bajo: +2 repeticiones (o +5 s) en los ejercicios principales.')
  else if (hard) adjustments.push('Esfuerzo alto: −2 repeticiones (o −5 s) para recuperar bien.')
  else adjustments.push('Esfuerzo ideal: mantenemos la carga actual.')
  if (c.sensations.includes('Molestia articular'))
    adjustments.push('Notaste molestias: reduce el rango de movimiento y cambia el ejercicio si persiste.')
  const nutrition = { ...localNutrition(p, c.weightKg), tips: plan.nutrition.tips }
  if (nutrition.calories !== plan.nutrition.calories)
    adjustments.push(`Calorías recalculadas con tu peso actual: ${nutrition.calories} kcal.`)
  return {
    ...plan,
    routines,
    nutrition,
    updatedAt: new Date().toISOString(),
    lastAdjustments: adjustments,
    coachMessage: easy ? '¡Vas sobrada! Subimos un poquito la exigencia.' : hard ? 'Hoy fue duro, ¡y lo terminaste! Ajustamos para que recuperes.' : '¡Constancia perfecta! Sigue así.',
  }
}
