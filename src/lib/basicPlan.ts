import type { Plan, Profile, Routine, RoutineItem, Settings } from '../types'
import { getEx } from '../data/exercises'
import { goalType, localNutrition, localWeeksEstimate } from './nutrition'
import { estimateMinutes, uid } from './utils'

// Plan sin IA: plantillas razonables según objetivo, nivel y material.
// Sirve si no hay clave de Gemini o si la IA falla.

// en el gimnasio hay de todo
const has = (p: Profile, eq: string) => p.place === 'gym' || p.equipment.includes(eq as never)

function pick(p: Profile, ids: string[]): string[] {
  return ids
    .map((id) => {
      // si no hay mancuernas, usar la alternativa de peso corporal
      const alt: Record<string, string> = {
        db_goblet_squat: 'squat', db_sumo_squat: 'sumo_squat', db_rdl: 'good_morning', db_lunges: 'lunges',
        db_hip_thrust: 'glute_bridge', db_shoulder_press: 'pushups', db_row: 'superman', db_curl: 'knee_pushups',
        db_lateral_raise: 'shadow_boxing', tricep_dips: 'knee_pushups',
      }
      const ex = getEx(id)
      if (ex.equipment === 'dumbbells' && !has(p, 'dumbbells')) return alt[id]
      if (ex.equipment === 'chair' && !has(p, 'chair')) return alt[id]
      return id
    })
    .filter((v, i, a) => v && a.indexOf(v) === i)
}

function item(p: Profile, id: string): RoutineItem {
  const ex = getEx(id)
  const lvl = p.level
  const sets = lvl === 'beginner' ? 2 : lvl === 'intermediate' ? 3 : 4
  if (ex.kind === 'time') {
    const s = lvl === 'beginner' ? 25 : lvl === 'intermediate' ? 35 : 45
    return { exerciseId: id, sets, seconds: ex.category === 'core' ? s + 5 : s }
  }
  const reps = lvl === 'beginner' ? 10 : lvl === 'intermediate' ? 12 : 15
  return { exerciseId: id, sets, reps: ex.id === 'burpees' ? Math.round(reps / 2) : ex.perSide ? Math.round(reps * 0.8) : reps }
}

const WARMUP: RoutineItem[] = [
  { exerciseId: 'march', sets: 1, seconds: 45 },
  { exerciseId: 'arm_circles', sets: 1, seconds: 30 },
  { exerciseId: 'side_bend', sets: 1, seconds: 30 },
  { exerciseId: 'jumping_jacks', sets: 1, seconds: 30 },
]
const GYM_WARMUP: RoutineItem[] = [
  { exerciseId: 'treadmill_walk', sets: 1, seconds: 180 },
  { exerciseId: 'arm_circles', sets: 1, seconds: 30 },
  { exerciseId: 'side_bend', sets: 1, seconds: 30 },
]
const COOLDOWN: RoutineItem[] = [
  { exerciseId: 'stretch_quad', sets: 1, seconds: 40 },
  { exerciseId: 'toe_touch', sets: 1, seconds: 30 },
  { exerciseId: 'chest_opener', sets: 1, seconds: 30 },
  { exerciseId: 'side_stretch', sets: 1, seconds: 30 },
]

export function basicPlan(p: Profile, s: Settings): Plan {
  const type = goalType(p.goal)
  const mat = has(p, 'mat')
  const gym = p.place === 'gym'
  const cardio = type === 'lose' || type === 'endurance'
  const gymTemplates: { name: string; focus: string; ids: string[] }[] = [
    {
      name: 'Piernas y glúteos', focus: 'Tren inferior',
      ids: ['barbell_squat', 'barbell_hip_thrust', 'leg_press', p.level === 'beginner' ? 'db_rdl' : 'barbell_deadlift', 'bulgarian_split_squat', 'leg_curl', 'leg_extension', 'calf_raises'],
    },
    {
      name: 'Tren superior', focus: 'Pecho, espalda y brazos',
      ids: ['lat_pulldown', 'db_bench_press', 'seated_cable_row', 'barbell_ohp', 'cable_pushdown', 'db_curl', 'db_lateral_raise', 'plank'],
    },
    {
      name: cardio ? 'Full body + cardio' : 'Cuerpo completo', focus: 'Full body',
      ids: cardio
        ? ['leg_press', 'lat_pulldown', 'db_bench_press', 'db_lunges', 'seated_cable_row', 'mountain_climbers', 'hanging_knee_raise']
        : ['barbell_squat', 'bench_press', 'barbell_row', 'db_rdl', 'pullups', 'hanging_knee_raise', 'plank'],
    },
  ]
  const templates: { name: string; focus: string; ids: string[] }[] = gym ? gymTemplates : [
    {
      name: 'Glúteos y piernas', focus: 'Tren inferior',
      ids: ['db_goblet_squat', 'glute_bridge', 'lunges', 'db_rdl', 'sumo_squat', 'donkey_kicks', 'calf_raises', 'wall_sit'],
    },
    {
      name: 'Tren superior y core', focus: 'Brazos, espalda y abdomen',
      ids: ['knee_pushups', 'db_row', 'db_shoulder_press', 'tricep_dips', 'plank', 'dead_bug', 'db_curl', 'bird_dog'],
    },
    {
      name: type === 'lose' || type === 'endurance' ? 'Cardio quema grasa' : 'Cuerpo completo',
      focus: 'Full body',
      ids: type === 'lose' || type === 'endurance'
        ? ['squat_jumps', 'mountain_climbers', 'high_knees', 'burpees', 'shadow_boxing', 'glute_bridge', 'plank']
        : ['squat', 'pushups', 'db_lunges', 'db_row', 'glute_bridge', 'mountain_climbers', 'plank'],
    },
  ]
  if (type === 'wellness' && !gym) templates[2].ids = ['cat_cow', 'bird_dog', 'glute_bridge', 'squat', 'dead_bug', 'side_lunges', 'plank']

  const days = p.trainingDays.length ? [...p.trainingDays].sort() : [0, 2, 4]
  const nRoutines = Math.min(3, days.length)
  const routines: Routine[] = templates.slice(0, nRoutines).map((t) => {
    let ids = pick(p, t.ids)
    if (!mat) ids = ids.filter((id) => getEx(id).equipment !== 'mat' || ['glute_bridge', 'plank'].includes(id))
    const r: Routine = {
      id: uid(), name: t.name, focus: t.focus, days: [], source: 'basic',
      warmup: (gym ? GYM_WARMUP : WARMUP).map((x) => ({ ...x })),
      main: [],
      cooldown: (mat ? [...COOLDOWN.slice(0, 2), { exerciseId: 'child_pose', sets: 1, seconds: 40 }, COOLDOWN[3]] : COOLDOWN).map((x) => ({ ...x })),
    }
    // añadir ejercicios hasta llenar el tiempo disponible
    for (const id of ids) {
      r.main.push(item(p, id))
      if (estimateMinutes(r, s) > p.minutesPerSession) {
        if (r.main.length > 3) r.main.pop()
        break
      }
    }
    return r
  })
  days.forEach((d, i) => routines[i % routines.length].days.push(d))

  const now = new Date().toISOString()
  return {
    createdAt: now,
    updatedAt: now,
    source: 'basic',
    summary: `Plan básico de ${days.length} días por semana ${gym ? 'en el gimnasio ' : ''}para: ${p.goal.toLowerCase()}.`,
    weeksEstimate: localWeeksEstimate(p),
    estimateExplanation:
      'Estimación calculada con un ritmo sostenible (unos 0,5 kg por semana al perder grasa). Conecta Gemini para un análisis personalizado.',
    whyItWorks: [
      'Combina fuerza (mantiene y construye músculo) con trabajo metabólico.',
      'Cada grupo muscular se trabaja al menos una vez por semana con descanso entre sesiones.',
      'Las repeticiones subirán cuando el esfuerzo que reportes sea bajo.',
    ],
    nutrition: localNutrition(p),
    routines,
    tips: ['Duerme 7–9 horas: es cuando el músculo se recupera.', 'La constancia gana a la intensidad.'],
  }
}
