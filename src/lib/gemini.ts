import type { CheckIn, Plan, Profile, Routine, RoutineItem, Session, Settings } from '../types'
import { EXERCISES, EX_BY_ID } from '../data/exercises'
import { bmi, localNutrition, localWeeksEstimate } from './nutrition'
import { DAYS, clamp, uid } from './utils'

const API = 'https://generativelanguage.googleapis.com/v1beta'
// Alias que Google mantiene apuntando al Flash estable más reciente
export const DEFAULT_MODEL = 'gemini-flash-latest'

export class GeminiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

// El store se registra aquí para guardar el modelo elegido automáticamente (evita una importación circular)
let onModelResolved: (model: string) => void = () => {}
export const setModelListener = (fn: (model: string) => void) => (onModelResolved = fn)

async function call(path: string, key: string, body?: unknown) {
  let res: Response
  try {
    res = await fetch(`${API}/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new GeminiError('No hay conexión a internet o Gemini no responde.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg: string = data?.error?.message ?? res.statusText
    if (res.status === 429) throw new GeminiError('Has llegado al límite gratuito de Gemini por ahora. Espera un minuto y vuelve a intentarlo.')
    if (res.status === 400 && /api key/i.test(msg)) throw new GeminiError('La clave de Gemini no es válida. Revísala en Ajustes.')
    if (res.status === 403) throw new GeminiError('La clave no tiene permiso para usar Gemini. Crea una nueva en Google AI Studio.')
    if (res.status === 404) throw new GeminiError('Ese modelo de Gemini no está disponible para tu clave. Elige otro en Ajustes.', 404)
    if (res.status === 503) throw new GeminiError('Gemini está saturado ahora mismo. Inténtalo de nuevo en unos segundos.')
    throw new GeminiError(`Error de Gemini (${res.status}): ${msg}`, res.status)
  }
  return data
}

/** Modelos disponibles para esta clave que admiten generateContent (para elegir en Ajustes). */
export async function listModels(key: string): Promise<string[]> {
  const data = await call('models?pageSize=200', key)
  return (data.models ?? [])
    .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: { name: string }) => m.name.replace(/^models\//, ''))
    .filter((n: string) => /gemini/.test(n) && !/(tts|image|embedding|live|audio|vision)/.test(n))
    .sort((a: string, b: string) => (b.includes('flash') ? 1 : 0) - (a.includes('flash') ? 1 : 0) || b.localeCompare(a))
}

/** El mejor modelo para la app: Flash estable (ni preview ni lite) de la versión más alta. */
export function pickModel(models: string[]): string | undefined {
  const ver = (m: string) => parseFloat(m.match(/gemini-(d+(?:.d+)?)/)?.[1] ?? '0')
  const score = (m: string) =>
    (m.includes('flash') ? 4 : 0) + (/preview|exp/.test(m) ? 0 : 2) + (m.includes('lite') ? 0 : 1)
  return [...models].sort((a, b) => score(b) - score(a) || ver(b) - ver(a))[0]
}

async function generateJSON<T>(s: Settings, system: string, prompt: string, schema: object): Promise<T> {
  if (!s.apiKey) throw new GeminiError('Falta la clave de Gemini. Añádela en Ajustes.')
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.6 },
  }
  const model = s.model || DEFAULT_MODEL
  let data
  try {
    data = await call(`models/${model}:generateContent`, s.apiKey, body)
  } catch (e) {
    // Google retira modelos con el tiempo: si el elegido ya no existe, usamos el mejor disponible para esta clave
    if (!(e instanceof GeminiError) || e.status !== 404) throw e
    const fallback = pickModel((await listModels(s.apiKey)).filter((m) => m !== model))
    if (!fallback) throw e
    data = await call(`models/${fallback}:generateContent`, s.apiKey, body)
    onModelResolved(fallback)
  }
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')
  if (!text) throw new GeminiError('Gemini no devolvió respuesta. Inténtalo de nuevo.')
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError('La respuesta de Gemini llegó incompleta. Inténtalo de nuevo.')
  }
}

// ---------- Esquema de respuesta ----------
const S = { type: 'STRING' }
const I = { type: 'INTEGER' }
const N = { type: 'NUMBER' }
const arr = (items: object) => ({ type: 'ARRAY', items })
const ITEM = {
  type: 'OBJECT',
  properties: {
    exerciseId: { type: 'STRING', enum: EXERCISES.map((e) => e.id) },
    sets: I, reps: I, seconds: I, weightKg: N, note: S,
  },
  required: ['exerciseId', 'sets'],
}
const PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: S,
    weeksEstimate: I,
    estimateExplanation: S,
    whyItWorks: arr(S),
    nutrition: {
      type: 'OBJECT',
      properties: { calories: I, proteinG: I, carbsG: I, fatG: I, waterL: N, tips: arr(S) },
      required: ['calories', 'proteinG', 'carbsG', 'fatG', 'waterL', 'tips'],
    },
    routines: arr({
      type: 'OBJECT',
      properties: { name: S, focus: S, days: arr(I), warmup: arr(ITEM), main: arr(ITEM), cooldown: arr(ITEM) },
      required: ['name', 'focus', 'days', 'warmup', 'main', 'cooldown'],
    }),
    tips: arr(S),
    adjustments: arr(S),
    coachMessage: S,
  },
  required: ['summary', 'weeksEstimate', 'estimateExplanation', 'whyItWorks', 'nutrition', 'routines', 'tips', 'coachMessage'],
}

const SYSTEM = `Eres "Forma AI", una entrenadora personal y nutricionista deportiva experta en entrenamiento en casa.
Hablas en español, de forma cercana, motivadora y clara. Diriges el mensaje a la usuaria por su nombre.
Tus planes son seguros, realistas y basados en evidencia (sobrecarga progresiva, déficit calórico moderado, proteína suficiente).
No das diagnósticos médicos; si hay dolor o lesión, recomiendas precaución y consultar a un profesional.`

function catalogText(p: Profile) {
  return EXERCISES.filter((e) => !e.equipment || e.equipment === 'mat' || p.equipment.includes(e.equipment))
    .map((e) => `- ${e.id}: ${e.name} [${e.category}, ${e.kind === 'time' ? 'por tiempo' : 'por repeticiones'}${e.perSide ? ', por lado' : ''}${e.equipment ? ', ' + e.equipment : ''}] – ${e.muscles}`)
    .join('\n')
}

function profileText(p: Profile) {
  const eq = p.equipment.length ? p.equipment.map((e) => ({ dumbbells: `mancuernas (${p.dumbbellKg || 'peso no indicado'})`, mat: 'esterilla', chair: 'silla estable' })[e]).join(', ') : 'ninguno (solo peso corporal)'
  return `Nombre: ${p.name}
Sexo: ${p.sex === 'female' ? 'mujer' : 'hombre'} · Edad: ${p.age} años
Altura: ${p.heightCm} cm · Peso: ${p.weightKg} kg · IMC: ${bmi(p).toFixed(1)}
${p.targetWeightKg ? `Peso objetivo: ${p.targetWeightKg} kg\n` : ''}${p.waistCm ? `Cintura: ${p.waistCm} cm\n` : ''}${p.hipCm ? `Cadera: ${p.hipCm} cm\n` : ''}Actividad diaria fuera del entreno: ${p.activity}
Objetivo: ${p.goal}
Nivel: ${p.level}
Zonas a priorizar: ${p.focusAreas.join(', ') || 'todo el cuerpo'}
Días de entrenamiento: ${p.trainingDays.map((d) => `${d} (${DAYS[d]})`).join(', ')}
Minutos por sesión: ${p.minutesPerSession}
Material: ${eq}
Lesiones o limitaciones: ${p.limitations || 'ninguna'}`
}

function rules(p: Profile, s: Settings) {
  const ref = localNutrition(p)
  return `REGLAS DEL PLAN:
1. Usa SOLO ejercicios del catálogo (campo exerciseId). No inventes ids.
2. Para ejercicios "por tiempo" rellena "seconds"; para "por repeticiones" rellena "reps" (si es "por lado", las reps son por cada lado).
3. Cada rutina tiene: warmup (3–5 ejercicios suaves de calentamiento/cardio, sets=1, por tiempo 30–60 s), main (el bloque principal) y cooldown (3–5 estiramientos, sets=1, 30–45 s).
4. Los DESCANSOS los define la usuaria (${s.restBetweenSets} s entre series, ${s.restBetweenExercises} s entre ejercicios): NO los incluyas, pero tenlos en cuenta para que cada sesión dure como máximo ${p.minutesPerSession} minutos.
5. "days" usa 0=lunes … 6=domingo. Reparte las rutinas EXACTAMENTE entre estos días: ${JSON.stringify(p.trainingDays)}. Cada día de entreno tiene una sola rutina; puedes repetir una rutina en varios días. Evita trabajar el mismo grupo muscular fuerte dos días seguidos.
6. Ajusta series y repeticiones al nivel (${p.level}). Si hay mancuernas, sugiere weightKg dentro del rango disponible.
7. Respeta las lesiones/limitaciones: evita ejercicios que las agraven.
8. Nutrición: calcula con Mifflin-St Jeor y el objetivo. Referencia calculada: ${ref.calories} kcal, ${ref.proteinG} g proteína, ${ref.carbsG} g carbohidratos, ${ref.fatG} g grasa. Nunca bajes de ${p.sex === 'male' ? 1500 : 1200} kcal. Da 3–5 consejos prácticos de comida.
9. weeksEstimate: semanas realistas para lograr el objetivo (referencia: ~${localWeeksEstimate(p)}). Explica el cálculo en estimateExplanation (1–3 frases).
10. whyItWorks: 3–5 frases explicando por qué estos ejercicios ayudan a su objetivo.
11. Nombres de rutina cortos y motivadores (máx. 4 palabras). coachMessage: 1–2 frases motivadoras.

CATÁLOGO DISPONIBLE:
${catalogText(p)}`
}

function compactRoutine(r: Routine) {
  const it = (x: RoutineItem) => `${x.exerciseId} ${x.sets}x${x.reps ? x.reps + 'reps' : (x.seconds ?? 30) + 's'}${x.weightKg ? ' ' + x.weightKg + 'kg' : ''}`
  return `"${r.name}" días ${JSON.stringify(r.days)} | calentamiento: ${r.warmup.map(it).join(', ')} | principal: ${r.main.map(it).join(', ')} | estiramientos: ${r.cooldown.map(it).join(', ')}`
}

interface RawPlan extends Omit<Plan, 'createdAt' | 'updatedAt' | 'routines' | 'source'> {
  routines: Omit<Routine, 'id' | 'source'>[]
  adjustments?: string[]
}

function sanitize(raw: RawPlan, p: Profile, prev?: Plan): Plan {
  const cleanItems = (items: RoutineItem[] = [], warm = false) =>
    items
      .filter((x) => EX_BY_ID[x.exerciseId])
      .filter((x) => { const eq = EX_BY_ID[x.exerciseId].equipment; return !eq || eq === 'mat' || p.equipment.includes(eq) })
      .map((x) => {
        const ex = EX_BY_ID[x.exerciseId]
        const out: RoutineItem = { exerciseId: x.exerciseId, sets: clamp(Math.round(x.sets || 1), 1, warm ? 2 : 6) }
        if (ex.kind === 'time') out.seconds = clamp(Math.round(x.seconds || 30), 10, 180)
        else out.reps = clamp(Math.round(x.reps || 10), 1, 50)
        if (x.weightKg && ex.equipment === 'dumbbells') out.weightKg = clamp(x.weightKg, 0.5, 50)
        if (x.note) out.note = x.note
        return out
      })
  const routines: Routine[] = (raw.routines ?? [])
    .map((r) => ({
      id: uid(), source: 'ai' as const, name: r.name || 'Rutina', focus: r.focus || '',
      days: (r.days ?? []).filter((d) => p.trainingDays.includes(d)),
      warmup: cleanItems(r.warmup, true), main: cleanItems(r.main), cooldown: cleanItems(r.cooldown, true),
    }))
    .filter((r) => r.main.length > 0)
  if (!routines.length) throw new GeminiError('Gemini no generó rutinas válidas. Inténtalo de nuevo.')
  // asegurar que cada día de entreno tiene una rutina y que no hay duplicados
  const seen = new Set<number>()
  routines.forEach((r) => (r.days = r.days.filter((d) => (seen.has(d) ? false : (seen.add(d), true)))))
  p.trainingDays.filter((d) => !seen.has(d)).forEach((d, i) => routines[i % routines.length].days.push(d))
  routines.forEach((r) => r.days.sort())

  const ref = localNutrition(p)
  const n = raw.nutrition ?? ref
  const now = new Date().toISOString()
  return {
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    source: 'ai',
    summary: raw.summary ?? '',
    weeksEstimate: clamp(Math.round(raw.weeksEstimate || localWeeksEstimate(p)), 1, 104),
    estimateExplanation: raw.estimateExplanation ?? '',
    whyItWorks: raw.whyItWorks ?? [],
    nutrition: {
      calories: clamp(Math.round(n.calories || ref.calories), p.sex === 'male' ? 1500 : 1200, 4500),
      proteinG: clamp(Math.round(n.proteinG || ref.proteinG), 40, 300),
      carbsG: clamp(Math.round(n.carbsG || ref.carbsG), 30, 600),
      fatG: clamp(Math.round(n.fatG || ref.fatG), 25, 200),
      waterL: clamp(n.waterL || ref.waterL, 1, 6),
      tips: n.tips?.length ? n.tips : ref.tips,
    },
    routines,
    tips: raw.tips ?? [],
    lastAdjustments: raw.adjustments,
    coachMessage: raw.coachMessage,
  }
}

export async function generatePlan(p: Profile, s: Settings): Promise<Plan> {
  const prompt = `Crea un plan de entrenamiento en casa y nutrición personalizado para esta persona.

PERFIL:
${profileText(p)}

${rules(p, s)}

Deja "adjustments" vacío.`
  const raw = await generateJSON<RawPlan>(s, SYSTEM, prompt, PLAN_SCHEMA)
  return sanitize(raw, p)
}

export async function adaptPlan(
  p: Profile, s: Settings, plan: Plan, checkIns: CheckIn[], sessions: Session[],
): Promise<Plan> {
  const last = checkIns.slice(-10)
  const latest = last[last.length - 1]
  const hist = last.map((c) => `${c.date.slice(0, 10)}: peso ${c.weightKg} kg${c.waistCm ? `, cintura ${c.waistCm} cm` : ''}, esfuerzo ${c.rpe}/10, energía ${c.energy}${c.sensations.length ? ', ' + c.sensations.join(', ') : ''}${c.notes ? ` – "${c.notes}"` : ''}`).join('\n')
  const recent = sessions.slice(-14).map((x) => `${x.date.slice(0, 10)} ${x.routineName} (${Math.round(x.durationSec / 60)} min, ${x.exercisesDone}/${x.exercisesTotal} ejercicios)`).join('\n')
  const weeks = Math.max(0, Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (7 * 864e5)))
  const prompt = `La usuaria acaba de terminar un entrenamiento y te manda su check-in. Adapta su plan según su progreso.

PERFIL (peso actualizado: ${latest?.weightKg ?? p.weightKg} kg):
${profileText({ ...p, weightKg: latest?.weightKg ?? p.weightKg })}

PLAN ACTUAL (semana ${weeks + 1}, estimación anterior: ${plan.weeksEstimate} semanas, ${plan.nutrition.calories} kcal, ${plan.nutrition.proteinG} g proteína):
${plan.routines.map(compactRoutine).join('\n')}

HISTORIAL DE CHECK-INS (más reciente al final):
${hist || 'sin datos'}

SESIONES RECIENTES:
${recent || 'sin datos'}

CÓMO ADAPTAR:
- Esfuerzo ≤ 6 o "Muy fácil": sube reps (10–20 %), tiempo, una serie o una variante más difícil.
- Esfuerzo 7–8: mantén y progresa poco (sobrecarga progresiva suave).
- Esfuerzo ≥ 9, "Muy difícil" o poca energía: reduce volumen ligeramente.
- "Molestia articular" o dolor: sustituye el ejercicio implicado por uno más suave y menciónalo.
- Recalcula weeksEstimate con la tendencia real de peso/medidas y ajusta calorías si el progreso se estanca o es demasiado rápido.
- Mantén la misma estructura de rutinas y días salvo que haya un buen motivo.
- "adjustments": 2–5 frases cortas y concretas con los cambios aplicados (ej. "Sentadilla goblet: 12 → 14 reps").
- coachMessage: feedback motivador sobre su progreso de 1–2 frases.

${rules(p, s)}`
  const raw = await generateJSON<RawPlan>(s, SYSTEM, prompt, PLAN_SCHEMA)
  return sanitize(raw, p, plan)
}
