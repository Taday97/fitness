import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Activity, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import type { CheckIn, Plan } from '../types'
import { Button, Card, Chip, Field, Label, Stepper, cx, inputCls } from '../components/ui'
import Figure from '../figure/Figure'
import { adaptPlan } from '../lib/gemini'
import { localAdapt } from '../lib/adapt'
import { fmtTime, uid } from '../lib/utils'

const SENSATIONS = ['Energía alta', 'Muy fácil', 'Muy difícil', 'Glúteos activados', 'Core firme', 'Me faltó el aire', 'Agujetas', 'Molestia articular', 'Dormí mal', 'Estrés']
const RPE_TEXT = ['', 'Muy suave', 'Suave', 'Ligero', 'Moderado', 'Algo duro', 'Duro', 'Intenso', 'Intenso pero controlado', 'Muy intenso', 'Al límite']

export default function CheckInScreen() {
  const { sessionId } = useParams()
  const nav = useNavigate()
  const { sessions, checkIns, profile, plan, settings, addCheckIn, setPlan } = useStore()
  const session = sessions.find((s) => s.id === sessionId)
  const lastWeight = checkIns[checkIns.length - 1]?.weightKg ?? profile!.weightKg
  const [weight, setWeight] = useState(lastWeight)
  const [waist, setWaist] = useState<string>(profile?.waistCm ? String(profile.waistCm) : '')
  const [hip, setHip] = useState<string>(profile?.hipCm ? String(profile.hipCm) : '')
  const [rpe, setRpe] = useState(7)
  const [energy, setEnergy] = useState<CheckIn['energy']>('normal')
  const [sens, setSens] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Plan>()

  async function save(useAI: boolean) {
    const c: CheckIn = {
      id: uid(), date: new Date().toISOString(), sessionId, weightKg: weight,
      waistCm: Number(waist) || undefined, hipCm: Number(hip) || undefined,
      rpe, energy, sensations: sens, notes: notes.trim(),
    }
    setError('')
    setBusy(true)
    const st = useStore.getState()
    const prof = { ...profile!, weightKg: weight }
    let next: Plan
    try {
      next = useAI
        ? await adaptPlan(prof, settings, plan!, [...st.checkIns, c], st.sessions)
        : localAdapt(plan!, prof, c)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
      return
    }
    addCheckIn({ ...c, adjustments: next.lastAdjustments })
    setPlan(next)
    setResult(next)
    setBusy(false)
  }

  if (busy) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <Figure anim="side_stretch" className="h-52 w-52" />
        <div className="inline-flex items-center gap-2 rounded-full bg-blush-2 px-3 py-1 text-xs font-bold text-primary"><Sparkles size={14} /> ANALIZANDO TU PROGRESO</div>
        <h2 className="text-2xl font-extrabold">Actualizando tu rutina…</h2>
        <p className="text-muted">La IA está revisando tu esfuerzo, peso y sensaciones.</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-4 px-5 pt-[max(env(safe-area-inset-top),20px)] pb-8">
        <div className="bg-grad rounded-3xl p-5 text-white shadow-glow">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider uppercase"><CheckCircle2 size={16} /> Plan recalibrado</div>
          <h1 className="text-2xl font-extrabold">Ajuste aplicado para tu próximo entreno</h1>
          {result.coachMessage && <p className="mt-2 text-white/90">{result.coachMessage}</p>}
        </div>
        <Card className="space-y-3">
          <Label>Cambios</Label>
          {(result.lastAdjustments?.length ? result.lastAdjustments : ['Mantenemos tu plan tal cual: ¡vas genial!']).map((a, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-blush p-3 text-sm">
              <TrendingUp size={18} className="shrink-0 text-primary" /> {a}
            </div>
          ))}
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <Label>Meta estimada</Label>
            <div className="text-3xl font-extrabold text-grad">{result.weeksEstimate}</div>
            <div className="text-xs font-bold text-muted">semanas</div>
          </Card>
          <Card className="text-center">
            <Label>Calorías/día</Label>
            <div className="text-3xl font-extrabold text-grad">{result.nutrition.calories}</div>
            <div className="text-xs font-bold text-muted">{result.nutrition.proteinG} g proteína</div>
          </Card>
        </div>
        <Button size="lg" className="w-full" onClick={() => nav('/', { replace: true })}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-5 pt-[max(env(safe-area-inset-top),20px)] pb-8">
      <div className="bg-grad relative overflow-hidden rounded-3xl p-5 text-white shadow-glow">
        <div className="text-xs font-bold tracking-wider uppercase opacity-90">{session?.routineName ?? 'Entrenamiento'}</div>
        <h1 className="text-[28px] font-extrabold">¡Sesión terminada! 🎉</h1>
        <p className="text-sm text-white/90">Cuéntame cómo te fue para ajustar tu próximo entreno.</p>
        {session && (
          <div className="mt-4 grid grid-cols-3 divide-x divide-white/30 rounded-2xl bg-white/15 py-3 text-center">
            <div><div className="text-[10px] font-bold opacity-80">TIEMPO</div><div className="text-xl font-extrabold">{fmtTime(session.durationSec)}</div></div>
            <div><div className="text-[10px] font-bold opacity-80">EJERCICIOS</div><div className="text-xl font-extrabold">{session.exercisesDone}/{session.exercisesTotal}</div></div>
            <div><div className="text-[10px] font-bold opacity-80">GASTO</div><div className="text-xl font-extrabold">~{session.kcal}<span className="text-xs"> kcal</span></div></div>
          </div>
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Esfuerzo percibido</Label>
          <span className="rounded-full bg-blush-2 px-3 py-1 text-sm font-extrabold text-primary">{rpe}/10</span>
        </div>
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-muted">
          <span>Muy suave</span><b className="text-primary">{RPE_TEXT[rpe]}</b><span>Al límite</span>
        </div>
      </Card>

      <Card className="space-y-3">
        <Label>Energía hoy</Label>
        <div className="grid grid-cols-3 gap-2">
          {([['low', '🪫 Baja'], ['normal', '🙂 Normal'], ['high', '⚡ Alta']] as const).map(([v, l]) => (
            <Chip key={v} active={energy === v} onClick={() => setEnergy(v)}>{l}</Chip>
          ))}
        </div>
        <Label>Sensaciones</Label>
        <div className="flex flex-wrap gap-2">
          {SENSATIONS.map((s) => (
            <Chip key={s} active={sens.includes(s)} onClick={() => setSens(sens.includes(s) ? sens.filter((x) => x !== s) : [...sens, s])}>{s}</Chip>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Tu peso hoy</Label>
            <div className={cx('text-xs font-semibold', weight < lastWeight ? 'text-ok' : 'text-muted')}>
              {weight === lastWeight ? 'Igual que la última vez' : `${weight > lastWeight ? '+' : ''}${(weight - lastWeight).toFixed(1)} kg`}
            </div>
          </div>
          <Stepper value={weight} onChange={setWeight} step={0.1} min={30} max={250} unit="kg" big />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cintura (cm)"><input className={inputCls} inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="Opcional" /></Field>
          <Field label="Cadera (cm)"><input className={inputCls} inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="Opcional" /></Field>
        </div>
        <Field label="Notas para tu entrenadora IA">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej.: las zancadas me costaron mucho, quiero más glúteo…" />
        </Field>
      </Card>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button className="mt-1 block font-bold underline" onClick={() => save(false)}>Guardar con ajuste básico</button>
        </div>
      )}

      {settings.apiKey ? (
        <Button size="lg" className="w-full" onClick={() => save(true)}><Sparkles size={18} /> Guardar y actualizar rutina con IA</Button>
      ) : (
        <Button size="lg" className="w-full" onClick={() => save(false)}><Activity size={18} /> Guardar y ajustar rutina</Button>
      )}
      <Button variant="ghost" className="w-full" onClick={() => nav('/', { replace: true })}>Omitir por hoy</Button>
    </div>
  )
}
