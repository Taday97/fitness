import type { Nutrition, Profile } from '../types'

export type GoalType = 'lose' | 'gain' | 'tone' | 'endurance' | 'wellness'

export const GOALS: { label: string; type: GoalType; emoji: string; desc: string }[] = [
  { label: 'Perder grasa', type: 'lose', emoji: '🔥', desc: 'Bajar de peso y definir' },
  { label: 'Tonificar', type: 'tone', emoji: '✨', desc: 'Firmeza sin cambiar mucho el peso' },
  { label: 'Ganar músculo', type: 'gain', emoji: '💪', desc: 'Más fuerza y volumen' },
  { label: 'Mejorar resistencia', type: 'endurance', emoji: '⚡', desc: 'Más energía y fondo' },
  { label: 'Flexibilidad y bienestar', type: 'wellness', emoji: '🌸', desc: 'Moverme mejor y sentirme bien' },
]

export function goalType(goal: string): GoalType {
  const g = goal.toLowerCase()
  if (/(perder|grasa|adelgaz|bajar|quemar)/.test(g)) return 'lose'
  if (/(ganar|músculo|musculo|volumen|fuerza)/.test(g)) return 'gain'
  if (/(resist|cardio|energ)/.test(g)) return 'endurance'
  if (/(flexib|bienestar|movilidad|estr)/.test(g)) return 'wellness'
  return 'tone'
}

const ACTIVITY: Record<Profile['activity'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

export const bmi = (p: Pick<Profile, 'weightKg' | 'heightCm'>) => p.weightKg / (p.heightCm / 100) ** 2

export function bmr(p: Profile, weight = p.weightKg) {
  return 10 * weight + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
}

/** Cálculo local (Mifflin-St Jeor). Se usa sin IA y como referencia para la IA. */
export function localNutrition(p: Profile, weight = p.weightKg): Nutrition {
  const type = goalType(p.goal)
  // los días de entrenamiento suben un poco el gasto
  const factor = ACTIVITY[p.activity] + Math.min(p.daysPerWeek, 6) * 0.02
  const tdee = bmr(p, weight) * factor
  const delta = type === 'lose' ? -450 : type === 'gain' ? 250 : 0
  const min = p.sex === 'male' ? 1500 : 1200
  const calories = Math.round(Math.max(min, tdee + delta) / 10) * 10
  const proteinPerKg = type === 'lose' || type === 'gain' ? 1.8 : type === 'tone' ? 1.6 : 1.4
  const proteinG = Math.round(weight * proteinPerKg)
  const fatG = Math.round(weight * 0.8)
  const carbsG = Math.max(50, Math.round((calories - proteinG * 4 - fatG * 9) / 4))
  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    waterL: Math.round(weight * 0.035 * 10) / 10,
    tips: [
      'Reparte la proteína en 3–4 comidas (huevos, yogur griego, pollo, pescado, legumbres, tofu).',
      'Llena medio plato con verduras en comida y cena.',
      'Bebe agua a lo largo del día, más en los días de entreno.',
    ],
  }
}

export function localWeeksEstimate(p: Profile): number {
  const type = goalType(p.goal)
  if (p.targetWeightKg && Math.abs(p.targetWeightKg - p.weightKg) >= 0.5) {
    const diff = p.targetWeightKg - p.weightKg
    // ritmo sostenible: ~0,6 % del peso/semana para bajar, 0,25 kg/semana para subir
    const rate = diff < 0 ? Math.min(0.75, p.weightKg * 0.006) : 0.25
    return Math.max(4, Math.ceil(Math.abs(diff) / rate))
  }
  return type === 'wellness' ? 6 : type === 'endurance' ? 8 : 12
}
