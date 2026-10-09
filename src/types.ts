export type Sex = 'female' | 'male'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active'
export type Equipment = 'dumbbells' | 'mat' | 'chair' | 'gym' // gym = máquinas, barra, polea y banco
export type Place = 'home' | 'gym'
export type Category = 'warmup' | 'cardio' | 'strength' | 'core' | 'stretch'

export interface Profile {
  name: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  targetWeightKg?: number
  startWeightKg?: number // peso al empezar (para las gráficas)
  waistCm?: number
  hipCm?: number
  activity: Activity
  goal: string // texto libre o uno de los predefinidos
  level: Level
  daysPerWeek: number
  trainingDays: number[] // 0 = lunes … 6 = domingo
  minutesPerSession: number
  place?: Place // por defecto casa (perfiles antiguos)
  equipment: Equipment[]
  dumbbellKg?: string
  focusAreas: string[]
  limitations: string
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  anim: string
  category: Category
  kind: 'reps' | 'time'
  muscles: string
  equipment?: Equipment
  perSide?: boolean
  met: number
  steps: string[]
  tip: string
}

export interface RoutineItem {
  exerciseId: string
  sets: number
  reps?: number
  seconds?: number
  weightKg?: number
  restSec?: number // si no se indica, se usan los descansos de Ajustes
  note?: string
}

export interface Routine {
  id: string
  name: string
  focus: string
  days: number[] // 0 = lunes
  warmup: RoutineItem[]
  main: RoutineItem[]
  cooldown: RoutineItem[]
  source: 'ai' | 'custom' | 'basic'
}

export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterL: number
  tips: string[]
}

export interface Plan {
  createdAt: string
  updatedAt: string
  summary: string
  weeksEstimate: number
  estimateExplanation: string
  whyItWorks: string[]
  nutrition: Nutrition
  routines: Routine[]
  tips: string[]
  lastAdjustments?: string[]
  coachMessage?: string
  source: 'ai' | 'basic'
}

export interface Session {
  id: string
  date: string // ISO
  routineId: string
  routineName: string
  durationSec: number
  exercisesDone: number
  exercisesTotal: number
  kcal: number
}

export interface CheckIn {
  id: string
  date: string
  sessionId?: string
  weightKg: number
  waistCm?: number
  hipCm?: number
  rpe: number // 1–10
  energy: 'low' | 'normal' | 'high'
  sensations: string[]
  notes: string
  adjustments?: string[]
}

export interface Settings {
  apiKey: string
  model: string
  voice: boolean
  countReps: boolean
  beeps: boolean
  restBetweenSets: number
  restBetweenExercises: number
  prepSec: number
  voiceRate: number
}
