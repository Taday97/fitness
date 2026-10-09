import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, ChevronUp, Droplets, Pencil, Plus, RefreshCw, Sparkles, Target, Trash2, UserRound, Utensils } from 'lucide-react'
import { useRoutines, useStore } from '../store'
import type { Routine } from '../types'
import { Button, Card, Label, TopBar, cx } from '../components/ui'
import { ExerciseRow, ExerciseSheet } from '../components/Exercise'
import { generatePlan } from '../lib/gemini'
import { basicPlan } from '../lib/basicPlan'
import { DAYS, addDays, estimateMinutes, fmtDate } from '../lib/utils'

export default function PlanScreen() {
  const nav = useNavigate()
  const { plan, profile, settings, customRoutines, setPlan, deleteRoutine } = useStore()
  const routines = useRoutines()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState<string>()
  const p = plan!
  const n = p.nutrition
  const target = addDays(new Date(p.createdAt), p.weeksEstimate * 7)
  const macroKcal = n.proteinG * 4 + n.carbsG * 4 + n.fatG * 9 || 1

  async function regenerate() {
    setError('')
    setBusy(true)
    try {
      setPlan(settings.apiKey ? await generatePlan(profile!, settings) : basicPlan(profile!, settings))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const newRoutine = () => nav('/routine/new')

  return (
    <div>
      <TopBar
        title="Tu plan personalizado"
        subtitle={p.source === 'ai' ? `Generado con Gemini · ${fmtDate(p.updatedAt)}` : 'Plan básico (sin IA)'}
        right={
          <button onClick={() => nav('/onboarding?edit=1')} className="grid size-10 place-items-center rounded-full bg-blush-2 text-primary" aria-label="Editar perfil">
            <UserRound size={20} />
          </button>
        }
      />
      <div className="space-y-4 px-5 pt-4 pb-6">
        {p.summary && <p className="text-muted">{p.summary}</p>}

        {/* estimación */}
        <div className="bg-grad rounded-3xl p-5 text-white shadow-glow">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase opacity-90"><Target size={16} /> Tu propósito: {profile!.goal}</div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-6xl leading-none font-extrabold">{p.weeksEstimate}</span>
            <span className="pb-1 text-xl font-bold">semanas</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            Meta estimada: {target.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {p.estimateExplanation && <p className="mt-3 rounded-2xl bg-white/15 p-3 text-sm">{p.estimateExplanation}</p>}
        </div>

        {/* nutrición */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 font-bold"><Utensils size={18} className="text-primary" /> Nutrición diaria</div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-grad">{n.calories}</span>
            <span className="pb-1 font-bold text-muted">kcal / día</span>
          </div>
          <div className="space-y-2.5">
            <Macro label="Proteína" g={n.proteinG} pct={(n.proteinG * 4) / macroKcal} color="bg-primary" big />
            <Macro label="Carbohidratos" g={n.carbsG} pct={(n.carbsG * 4) / macroKcal} color="bg-secondary" />
            <Macro label="Grasas" g={n.fatG} pct={(n.fatG * 9) / macroKcal} color="bg-peach" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blush p-3 text-sm"><Droplets size={18} className="text-primary" /> Agua: <b>{n.waterL} L</b> al día</div>
          <ul className="space-y-1.5 text-sm text-muted">
            {n.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{t}</li>)}
          </ul>
        </Card>

        {/* por qué funciona */}
        {p.whyItWorks.length > 0 && (
          <Card className="space-y-2">
            <div className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-primary" /> Por qué estos ejercicios te ayudan</div>
            <ul className="space-y-2 text-sm">
              {p.whyItWorks.map((t, i) => <li key={i} className="rounded-xl bg-blush p-3">{t}</li>)}
            </ul>
          </Card>
        )}

        {/* semana */}
        <Card>
          <div className="mb-3 flex items-center gap-2 font-bold"><CalendarDays size={18} className="text-primary" /> Tu semana</div>
          <div className="space-y-1.5">
            {DAYS.map((d, i) => {
              const r = routines.find((x) => x.days.includes(i))
              return (
                <div key={d} className="flex items-center gap-3 text-sm">
                  <span className="w-20 font-semibold text-muted">{d}</span>
                  <span className={cx('flex-1 rounded-lg px-3 py-1.5 font-semibold', r ? 'bg-blush-2 text-primary' : 'text-faint')}>{r ? r.name : 'Descanso'}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* rutinas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Mis rutinas</h2>
            <Button variant="secondary" onClick={newRoutine}><Plus size={16} /> Crear</Button>
          </div>
          {customRoutines.map((r) => (
            <RoutineCard key={r.id} r={r} onInfo={setInfo} onDelete={() => confirm(`¿Borrar "${r.name}"?`) && deleteRoutine(r.id)} />
          ))}
          {!customRoutines.length && <p className="text-sm text-muted">Crea tus propias rutinas eligiendo ejercicios, repeticiones y descansos. Si les asignas días, tienen prioridad sobre las de la IA.</p>}
          <h2 className="pt-2 text-lg font-bold">Rutinas de tu plan {p.source === 'ai' && <span className="text-sm text-primary">· IA</span>}</h2>
          {p.routines.map((r) => <RoutineCard key={r.id} r={r} onInfo={setInfo} />)}
        </div>

        {p.tips.length > 0 && (
          <Card className="space-y-1.5">
            <Label>Consejos</Label>
            {p.tips.map((t, i) => <p key={i} className="text-sm">💡 {t}</p>)}
          </Card>
        )}

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Button size="lg" variant="white" className="w-full" disabled={busy} onClick={() => confirm('Se creará un plan nuevo (tus rutinas propias se conservan). ¿Continuar?') && regenerate()}>
          <RefreshCw size={18} className={busy ? 'animate-spin' : ''} /> {busy ? 'Generando…' : settings.apiKey ? 'Regenerar plan con IA' : 'Regenerar plan básico'}
        </Button>
        <p className="text-center text-xs text-faint">Las estimaciones son orientativas y no sustituyen el consejo médico.</p>
      </div>
      <ExerciseSheet id={info} onClose={() => setInfo(undefined)} />
    </div>
  )
}

function Macro({ label, g, pct, color, big }: { label: string; g: number; pct: number; color: string; big?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className={cx('font-semibold', big && 'text-primary')}>{label}</span>
        <span className="font-bold tabular">{g} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={cx('h-full rounded-full', color)} style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
    </div>
  )
}

function RoutineCard({ r, onInfo, onDelete }: { r: Routine; onInfo: (id: string) => void; onDelete?: () => void }) {
  const nav = useNavigate()
  const settings = useStore((s) => s.settings)
  const [open, setOpen] = useState(false)
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <div className="font-bold">{r.name}</div>
          <div className="text-xs text-muted">
            {r.focus} · ~{estimateMinutes(r, settings)} min · {r.days.length ? r.days.map((d) => DAYS[d].slice(0, 3)).join(', ') : 'sin días asignados'}
          </div>
        </button>
        <button onClick={() => nav(`/routine/${r.id}`)} className="grid size-9 place-items-center rounded-full bg-blush-2 text-primary" aria-label="Editar"><Pencil size={16} /></button>
        {onDelete && <button onClick={onDelete} className="grid size-9 place-items-center rounded-full bg-blush text-muted" aria-label="Borrar"><Trash2 size={16} /></button>}
        <button onClick={() => setOpen(!open)} className="grid size-9 place-items-center rounded-full text-muted">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
      </div>
      {open && (
        <div className="space-y-2">
          {[...r.warmup, ...r.main, ...r.cooldown].map((it, i) => (
            <ExerciseRow key={i} item={it} onInfo={() => onInfo(it.exerciseId)} />
          ))}
          <Button className="w-full" onClick={() => nav(`/session/${r.id}`)}>Entrenar esta rutina</Button>
        </div>
      )}
    </Card>
  )
}
