import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ExternalLink, KeyRound, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import type { Activity, Equipment, Level, Profile } from '../types'
import { Button, Card, Chip, Field, Label, Logo, Stepper, cx, inputCls } from '../components/ui'
import Figure from '../figure/Figure'
import { GOALS, bmi } from '../lib/nutrition'
import { DAYS_SHORT } from '../lib/utils'
import { generatePlan } from '../lib/gemini'
import { basicPlan } from '../lib/basicPlan'

const FOCUS = ['Glúteos', 'Piernas', 'Abdomen', 'Brazos', 'Espalda', 'Todo el cuerpo']
const LEVELS: { v: Level; l: string; d: string }[] = [
  { v: 'beginner', l: 'Principiante', d: 'Empiezo o vuelvo' },
  { v: 'intermediate', l: 'Intermedia', d: 'Entreno a veces' },
  { v: 'advanced', l: 'Avanzada', d: 'Entreno a menudo' },
]
const ACTIVITIES: { v: Activity; l: string; d: string }[] = [
  { v: 'sedentary', l: 'Sedentaria', d: 'Trabajo sentada' },
  { v: 'light', l: 'Ligera', d: 'Camino algo' },
  { v: 'moderate', l: 'Moderada', d: 'De pie a menudo' },
  { v: 'active', l: 'Muy activa', d: 'Trabajo físico' },
]
const LOADING_MSGS = [
  'Analizando tus medidas…',
  'Calculando calorías y proteínas…',
  'Eligiendo los mejores ejercicios para ti…',
  'Ajustando series y repeticiones…',
  'Preparando tus estiramientos…',
]

const blank = (): Profile => ({
  name: '', sex: 'female', age: 28, heightCm: 163, weightKg: 62, activity: 'light', goal: 'Tonificar',
  level: 'beginner', daysPerWeek: 3, trainingDays: [0, 2, 4], minutesPerSession: 30, equipment: ['mat'],
  focusAreas: ['Glúteos', 'Abdomen'], limitations: '', createdAt: new Date().toISOString(),
})

export default function Onboarding() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const store = useStore()
  const editing = params.get('edit') === '1' && !!store.profile
  const [p, setP] = useState<Profile>(() => (store.profile ? { ...store.profile } : blank()))
  const [step, setStep] = useState(editing ? 1 : 0)
  const [key, setKey] = useState(store.settings.apiKey)
  const [customGoal, setCustomGoal] = useState(!GOALS.some((g) => g.label === p.goal))
  const [hasTarget, setHasTarget] = useState(!!p.targetWeightKg)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(0)
  const [error, setError] = useState('')

  const up = (o: Partial<Profile>) => setP((x) => ({ ...x, ...o }))
  const steps = 5

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setMsg((m) => (m + 1) % LOADING_MSGS.length), 2200)
    return () => clearInterval(t)
  }, [loading])

  const valid = [
    true,
    p.name.trim().length > 0 && p.age >= 14,
    p.weightKg > 30 && p.heightCm > 120,
    p.goal.trim().length > 0,
    p.trainingDays.length > 0,
    true,
  ][step]

  async function finish(useAI: boolean, regenerate = true) {
    const profile: Profile = {
      ...p,
      name: p.name.trim(),
      daysPerWeek: p.trainingDays.length,
      trainingDays: [...p.trainingDays].sort(),
      targetWeightKg: hasTarget ? p.targetWeightKg : undefined,
      startWeightKg: p.startWeightKg ?? p.weightKg,
    }
    store.setSettings({ apiKey: key.trim() })
    store.setProfile(profile)
    if (!regenerate && store.plan) return nav('/plan')
    const settings = { ...store.settings, apiKey: key.trim() }
    if (!useAI) {
      store.setPlan(basicPlan(profile, settings))
      return nav('/')
    }
    setError('')
    setLoading(true)
    try {
      const plan = await generatePlan(profile, settings)
      store.setPlan(plan)
      nav(editing ? '/plan' : '/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="relative">
          <div className="bg-grad absolute inset-0 rounded-full opacity-15 blur-2xl" />
          <Figure anim="jumping_jacks" className="relative h-56 w-56" />
        </div>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blush-2 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles size={14} /> GEMINI TRABAJANDO
          </div>
          <h2 className="text-2xl font-extrabold">Creando tu plan, {p.name || 'guapa'}</h2>
          <p className="mt-2 h-6 text-muted">{LOADING_MSGS[msg]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-[max(env(safe-area-inset-top),16px)] pb-6">
      {step > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => (step === 1 && editing ? nav(-1) : setStep(step - 1))} className="-ml-2 grid size-10 place-items-center rounded-full active:bg-blush" aria-label="Atrás">
              <ChevronLeft />
            </button>
            <span className="rounded-full bg-blush-2 px-3 py-1 text-xs font-bold text-primary">
              PASO {step} DE {steps}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: steps }).map((_, i) => (
              <div key={i} className={cx('h-1.5 flex-1 rounded-full', i < step ? 'bg-grad' : 'bg-line')} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1">
        {step === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6 pt-6 text-center">
            <Logo size={64} />
            <div>
              <h1 className="text-[32px] leading-tight font-extrabold">
                Tu entrenadora <span className="text-grad">con IA</span>, en casa
              </h1>
              <p className="mt-3 text-muted">
                Rutinas guiadas con voz, un plan de nutrición a tu medida y ajustes cada día según tu progreso.
              </p>
            </div>
            <Figure anim="squat" className="h-52 w-52" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Title t="Cuéntame sobre ti" s="Así personalizo tu plan desde el primer día." />
            <Field label="¿Cómo te llamas?">
              <input className={inputCls} value={p.name} onChange={(e) => up({ name: e.target.value })} placeholder="Tu nombre" autoFocus />
            </Field>
            <div>
              <Label>Sexo (para calcular tu metabolismo)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Chip active={p.sex === 'female'} onClick={() => up({ sex: 'female' })}>Mujer</Chip>
                <Chip active={p.sex === 'male'} onClick={() => up({ sex: 'male' })}>Hombre</Chip>
              </div>
            </div>
            <Card className="flex items-center justify-between">
              <Label>Edad</Label>
              <Stepper value={p.age} onChange={(age) => up({ age })} min={14} max={90} unit="años" big />
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Title t="Tus medidas" s="Las actualizarás tras cada entreno para que la IA ajuste el plan." />
            <div className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col items-center gap-2">
                <Label>Peso actual</Label>
                <Stepper value={p.weightKg} onChange={(weightKg) => up({ weightKg })} step={0.5} min={30} max={250} unit="kg" big />
              </Card>
              <Card className="flex flex-col items-center gap-2">
                <Label>Estatura</Label>
                <Stepper value={p.heightCm} onChange={(heightCm) => up({ heightCm })} min={120} max={220} unit="cm" big />
              </Card>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-blush px-4 py-2 text-sm">
              <span className="size-2 rounded-full bg-ok" />
              IMC <b>{bmi(p).toFixed(1)}</b>
            </div>
            <Card>
              <button type="button" onClick={() => { setHasTarget(!hasTarget); if (!p.targetWeightKg) up({ targetWeightKg: p.weightKg - 3 }) }} className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">¿Tienes un peso objetivo?</span>
                <span className={cx('rounded-full px-3 py-1 text-xs font-bold', hasTarget ? 'bg-grad text-white' : 'bg-blush text-muted')}>{hasTarget ? 'Sí' : 'No'}</span>
              </button>
              {hasTarget && (
                <div className="mt-3 flex justify-center">
                  <Stepper value={p.targetWeightKg ?? p.weightKg} onChange={(targetWeightKg) => up({ targetWeightKg })} step={0.5} min={30} max={250} unit="kg" big />
                </div>
              )}
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cintura (opcional)">
                <input className={inputCls} inputMode="decimal" value={p.waistCm ?? ''} onChange={(e) => up({ waistCm: Number(e.target.value) || undefined })} placeholder="cm" />
              </Field>
              <Field label="Cadera (opcional)">
                <input className={inputCls} inputMode="decimal" value={p.hipCm ?? ''} onChange={(e) => up({ hipCm: Number(e.target.value) || undefined })} placeholder="cm" />
              </Field>
            </div>
            <div>
              <Label>Actividad diaria (sin contar el entreno)</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITIES.map((a) => (
                  <Choice key={a.v} active={p.activity === a.v} onClick={() => up({ activity: a.v })} title={a.l} desc={a.d} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Title t="¿Cuál es tu propósito?" s="La IA elegirá ejercicios y te dirá en cuánto tiempo puedes lograrlo." />
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.label}
                  onClick={() => { setCustomGoal(false); up({ goal: g.label }) }}
                  className={cx('flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left transition', !customGoal && p.goal === g.label ? 'border-primary shadow-float' : 'border-line')}
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-blush text-xl">{g.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-bold">{g.label}</span>
                    <span className="block text-xs text-muted">{g.desc}</span>
                  </span>
                </button>
              ))}
              <button
                onClick={() => { setCustomGoal(true); up({ goal: '' }) }}
                className={cx('flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left', customGoal ? 'border-primary' : 'border-line')}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-blush text-xl">✍️</span>
                <span className="font-bold">Otro (lo escribo yo)</span>
              </button>
              {customGoal && (
                <textarea className={inputCls} rows={2} value={p.goal} onChange={(e) => up({ goal: e.target.value })} placeholder="Ej.: levantar glúteos y marcar abdomen para el verano" autoFocus />
              )}
            </div>
            <div>
              <Label>Zonas a priorizar</Label>
              <div className="flex flex-wrap gap-2">
                {FOCUS.map((f) => (
                  <Chip key={f} active={p.focusAreas.includes(f)} onClick={() => up({ focusAreas: p.focusAreas.includes(f) ? p.focusAreas.filter((x) => x !== f) : [...p.focusAreas, f] })}>{f}</Chip>
                ))}
              </div>
            </div>
            <div>
              <Label>Tu nivel</Label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <Choice key={l.v} active={p.level === l.v} onClick={() => up({ level: l.v })} title={l.l} desc={l.d} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Title t="Tu entrenamiento" s="Todo en casa. Elige días, tiempo y el material que tienes." />
            <div>
              <Label right={<span className="text-xs font-bold text-primary">{p.trainingDays.length} días/semana</span>}>Días que entrenas</Label>
              <div className="flex justify-between gap-1">
                {DAYS_SHORT.map((d, i) => {
                  const on = p.trainingDays.includes(i)
                  return (
                    <button key={d} onClick={() => up({ trainingDays: on ? p.trainingDays.filter((x) => x !== i) : [...p.trainingDays, i] })}
                      className={cx('grid size-11 place-items-center rounded-full text-sm font-bold transition', on ? 'bg-grad text-white shadow-glow' : 'border border-line bg-white text-muted')}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>Minutos por sesión</Label>
              <div className="flex flex-wrap gap-2">
                {[15, 20, 30, 45, 60].map((m) => (
                  <Chip key={m} active={p.minutesPerSession === m} onClick={() => up({ minutesPerSession: m })}>{m} min</Chip>
                ))}
              </div>
            </div>
            <div>
              <Label>Material que tienes en casa</Label>
              <div className="space-y-2">
                {([
                  ['dumbbells', '🏋️', 'Mancuernas', 'Pesas ligeras o ajustables'],
                  ['mat', '🧘', 'Esterilla', 'Para ejercicios en el suelo'],
                  ['chair', '🪑', 'Silla estable', 'Para fondos de tríceps'],
                ] as [Equipment, string, string, string][]).map(([v, e, l, d]) => {
                  const on = p.equipment.includes(v)
                  return (
                    <div key={v}>
                      <button onClick={() => up({ equipment: on ? p.equipment.filter((x) => x !== v) : [...p.equipment, v] })}
                        className={cx('flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left', on ? 'border-primary' : 'border-line')}>
                        <span className="grid size-10 place-items-center rounded-xl bg-blush text-lg">{e}</span>
                        <span className="flex-1"><b className="block text-sm">{l}</b><span className="text-xs text-muted">{d}</span></span>
                        <span className={cx('grid size-6 place-items-center rounded-full text-xs text-white', on ? 'bg-grad' : 'border-2 border-line')}>{on && '✓'}</span>
                      </button>
                      {v === 'dumbbells' && on && (
                        <input className={cx(inputCls, 'mt-2')} value={p.dumbbellKg ?? ''} onChange={(e) => up({ dumbbellKg: e.target.value })} placeholder="¿De cuántos kg? Ej.: par de 2 y 5 kg" />
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-muted">Sin material también funciona: usaremos tu propio peso.</p>
            </div>
            <Field label="Lesiones o molestias (opcional)">
              <textarea className={inputCls} rows={2} value={p.limitations} onChange={(e) => up({ limitations: e.target.value })} placeholder="Ej.: me molesta la rodilla derecha al saltar" />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <Title t="Conecta Gemini (gratis)" s="Con tu clave, la IA crea tu plan y lo adapta tras cada entreno." />
            <Card className="space-y-3">
              <div className="flex items-center gap-2 font-bold"><KeyRound size={18} className="text-primary" /> Cómo conseguir tu clave</div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
                <li>Abre Google AI Studio con tu cuenta de Google.</li>
                <li>Pulsa <b>“Create API key”</b> (es gratis).</li>
                <li>Copia la clave y pégala aquí.</li>
              </ol>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                Abrir Google AI Studio <ExternalLink size={14} />
              </a>
            </Card>
            <Field label="Tu clave de Gemini" hint="Se guarda solo en tu teléfono. Nunca se sube a GitHub.">
              <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza…" autoComplete="off" spellCheck={false} />
            </Field>
            {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {step < 5 ? (
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => setStep(step + 1)}>
            {step === 0 ? 'Empezar' : 'Continuar'} <ArrowRight size={18} />
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full" disabled={!key.trim()} onClick={() => finish(true)}>
              <Sparkles size={18} /> {editing ? 'Guardar y regenerar con IA' : 'Generar mi plan con IA'}
            </Button>
            {editing ? (
              <Button variant="ghost" className="w-full" onClick={() => finish(false, false)}>Guardar sin regenerar el plan</Button>
            ) : (
              <Button variant="ghost" className="w-full" onClick={() => finish(false)}>Continuar sin IA (plan básico)</Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Title({ t, s }: { t: string; s: string }) {
  return (
    <div>
      <h1 className="text-[28px] leading-tight font-extrabold">{t}</h1>
      <p className="mt-1 text-muted">{s}</p>
    </div>
  )
}

function Choice({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={cx('rounded-2xl p-3 text-center transition', active ? 'bg-grad text-white shadow-glow' : 'border border-line bg-white')}>
      <div className="text-sm font-bold">{title}</div>
      <div className={cx('text-[11px]', active ? 'text-white/85' : 'text-muted')}>{desc}</div>
    </button>
  )
}
