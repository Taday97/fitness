import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react'
import { findRoutine, useRoutines, useStore } from '../store'
import type { Routine, RoutineItem } from '../types'
import { CATEGORY_LABEL, EXERCISES, canDo, getEx, usesWeight } from '../data/exercises'
import Figure from '../figure/Figure'
import { Button, Card, Chip, Field, Sheet, Stepper, TopBar, cx, inputCls } from '../components/ui'
import { DAYS_SHORT, estimateKcal, estimateMinutes, uid } from '../lib/utils'

type Sec = 'warmup' | 'main' | 'cooldown'
const SECS: { k: Sec; l: string }[] = [
  { k: 'warmup', l: 'Calentamiento' },
  { k: 'main', l: 'Bloque principal' },
  { k: 'cooldown', l: 'Estiramientos' },
]

export default function RoutineEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const routines = useRoutines()
  const { saveRoutine, settings, profile } = useStore()
  const existing = id === 'new' ? undefined : findRoutine(routines, id!)
  const [r, setR] = useState<Routine>(
    () => existing ? structuredClone(existing) : { id: uid(), name: '', focus: 'Personalizada', days: [], warmup: [], main: [], cooldown: [], source: 'custom' },
  )
  const [picker, setPicker] = useState<Sec>()

  const up = (o: Partial<Routine>) => setR((x) => ({ ...x, ...o }))
  const setItems = (k: Sec, items: RoutineItem[]) => setR((x) => ({ ...x, [k]: items }))
  const otherDays = useMemo(() => new Set(routines.filter((x) => x.id !== r.id && x.source === 'custom').flatMap((x) => x.days)), [routines, r.id])

  function add(k: Sec, exId: string) {
    const ex = getEx(exId)
    const light = k !== 'main'
    const it: RoutineItem = { exerciseId: exId, sets: light ? 1 : 3, ...(ex.kind === 'time' ? { seconds: light ? 30 : 40 } : { reps: 12 }) }
    setItems(k, [...r[k], it])
    setPicker(undefined)
  }

  function save() {
    saveRoutine({ ...r, name: r.name.trim() || 'Mi rutina' })
    nav(-1)
  }

  return (
    <div className="pb-28">
      <TopBar title={existing ? 'Editar rutina' : 'Nueva rutina'} subtitle={r.source === 'custom' ? 'Rutina propia' : 'Rutina del plan'} back />
      <div className="space-y-5 px-5 pt-4">
        <Field label="Nombre">
          <input className={inputCls} value={r.name} onChange={(e) => up({ name: e.target.value })} placeholder="Ej.: Glúteos express" />
        </Field>
        <Field label="Enfoque">
          <input className={inputCls} value={r.focus} onChange={(e) => up({ focus: e.target.value })} placeholder="Ej.: Tren inferior" />
        </Field>
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Días en que toca</div>
          <div className="flex justify-between">
            {DAYS_SHORT.map((d, i) => {
              const on = r.days.includes(i)
              return (
                <button key={d} onClick={() => up({ days: on ? r.days.filter((x) => x !== i) : [...r.days, i].sort() })}
                  className={cx('relative grid size-11 place-items-center rounded-full text-sm font-bold', on ? 'bg-grad text-white shadow-glow' : 'border border-line bg-surface text-muted')}>
                  {d}
                  {!on && otherDays.has(i) && <span className="absolute -top-0.5 right-0 size-2 rounded-full bg-peach" />}
                </button>
              )
            })}
          </div>
          {r.source === 'custom' && <p className="mt-2 text-xs text-muted">Tus rutinas propias tienen prioridad sobre las de la IA ese día.</p>}
        </div>

        <div className="flex gap-3 rounded-2xl bg-blush p-3 text-sm">
          <span>⏱ <b>~{estimateMinutes(r, settings)} min</b></span>
          <span>🔥 <b>~{estimateKcal(r, profile!.weightKg)} kcal</b></span>
          <span className="text-muted">Descansos: {settings.restBetweenSets}s / {settings.restBetweenExercises}s</span>
        </div>

        {SECS.map(({ k, l }) => (
          <section key={k} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{l}</h2>
              <Button variant="secondary" className="h-9 px-3" onClick={() => setPicker(k)}><Plus size={16} /> Añadir</Button>
            </div>
            {!r[k].length && <p className="rounded-xl border border-dashed border-line p-3 text-center text-sm text-faint">Sin ejercicios</p>}
            {r[k].map((it, i) => (
              <ItemEditor
                key={i + it.exerciseId}
                it={it}
                showRest={k === 'main'}
                onChange={(n) => setItems(k, r[k].map((x, j) => (j === i ? n : x)))}
                onRemove={() => setItems(k, r[k].filter((_, j) => j !== i))}
                onMove={(d) => {
                  const a = [...r[k]]
                  const j = i + d
                  if (j < 0 || j >= a.length) return
                  ;[a[i], a[j]] = [a[j], a[i]]
                  setItems(k, a)
                }}
              />
            ))}
          </section>
        ))}
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-20 border-t border-line pb-safe">
        <div className="mx-auto max-w-md px-5 py-3">
          <Button size="lg" className="w-full" disabled={!r.main.length} onClick={save}>Guardar rutina</Button>
        </div>
      </div>

      <Picker open={!!picker} section={picker} onClose={() => setPicker(undefined)} onPick={(exId) => add(picker!, exId)} />
    </div>
  )
}

function ItemEditor({ it, onChange, onRemove, onMove, showRest }: {
  it: RoutineItem; onChange: (i: RoutineItem) => void; onRemove: () => void; onMove: (d: number) => void; showRest: boolean
}) {
  const ex = getEx(it.exerciseId)
  const settings = useStore((s) => s.settings)
  return (
    <Card className="space-y-3 p-3">
      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0 rounded-xl bg-blush"><Figure anim={ex.anim} playing={false} className="size-full" /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{ex.name}</div>
          <div className="truncate text-xs text-muted">{ex.muscles}</div>
        </div>
        <div className="flex flex-col">
          <button onClick={() => onMove(-1)} className="p-1 text-muted" aria-label="Subir"><ArrowUp size={16} /></button>
          <button onClick={() => onMove(1)} className="p-1 text-muted" aria-label="Bajar"><ArrowDown size={16} /></button>
        </div>
        <button onClick={onRemove} className="grid size-9 place-items-center rounded-full bg-blush text-muted" aria-label="Quitar"><Trash2 size={16} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Box label="Series"><Stepper value={it.sets} onChange={(sets) => onChange({ ...it, sets })} min={1} max={10} /></Box>
        {ex.kind === 'time' ? (
          <Box label={ex.perSide ? 'Segundos/lado' : 'Segundos'}><Stepper value={it.seconds ?? 30} onChange={(seconds) => onChange({ ...it, seconds })} step={5} min={5} max={300} /></Box>
        ) : (
          <Box label={ex.perSide ? 'Reps/lado' : 'Repeticiones'}><Stepper value={it.reps ?? 10} onChange={(reps) => onChange({ ...it, reps })} min={1} max={100} /></Box>
        )}
        {usesWeight(ex) && (
          <Box label="Peso (kg)"><Stepper value={it.weightKg ?? (ex.equipment === 'gym' ? 20 : 2)} onChange={(weightKg) => onChange({ ...it, weightKg })} step={ex.equipment === 'gym' ? 2.5 : 0.5} min={0.5} max={300} /></Box>
        )}
        {showRest && (
          <Box label={it.restSec === undefined ? 'Descanso (auto)' : 'Descanso (s)'}>
            <Stepper value={it.restSec ?? settings.restBetweenSets} onChange={(restSec) => onChange({ ...it, restSec })} step={5} min={0} max={300} />
          </Box>
        )}
      </div>
    </Card>
  )
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-blush py-2">
      <span className="text-[10px] font-bold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </div>
  )
}

function Picker({ open, section, onClose, onPick }: { open: boolean; section?: Sec; onClose: () => void; onPick: (id: string) => void }) {
  const profile = useStore((s) => s.profile)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [preview, setPreview] = useState<string>()
  const defaultCats = section === 'warmup' ? ['warmup', 'cardio'] : section === 'cooldown' ? ['stretch'] : ['strength', 'core', 'cardio']
  const list = EXERCISES.filter((e) => (cat === 'all' ? defaultCats.includes(e.category) && canDo(e, profile) : cat === 'gym' ? e.equipment === 'gym' : e.category === cat))
    .filter((e) => !q || (e.name + e.muscles).toLowerCase().includes(q.toLowerCase()))
    // primero lo que puedes hacer con tu material
    .sort((a, b) => Number(canDo(b, profile)) - Number(canDo(a, profile)))
  return (
    <Sheet open={open} onClose={onClose} title="Añadir ejercicio">
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute top-3.5 left-3 text-faint" />
          <input className={cx(inputCls, 'pl-10')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (glúteos, plancha…)" />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={cat === 'all'} onClick={() => setCat('all')} className="shrink-0">Sugeridos</Chip>
          {Object.entries(CATEGORY_LABEL).map(([k, l]) => <Chip key={k} active={cat === k} onClick={() => setCat(k)} className="shrink-0">{l}</Chip>)}
          <Chip active={cat === 'gym'} onClick={() => setCat('gym')} className="shrink-0">🏋️ Gimnasio</Chip>
        </div>
        <div className="space-y-2">
          {list.map((e) => {
            const missing = !canDo(e, profile)
            return (
              <div key={e.id} className="rounded-2xl border border-line">
                <div className="flex items-center gap-3 p-2">
                  <button onClick={() => setPreview(preview === e.id ? undefined : e.id)} className="size-14 shrink-0 rounded-xl bg-blush">
                    <Figure anim={e.anim} playing={preview === e.id} className="size-full" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{e.name}</div>
                    <div className="truncate text-xs text-muted">{e.muscles}{missing ? ' · necesitas ' + ({ dumbbells: 'mancuernas', chair: 'silla', gym: 'gimnasio' } as Record<string, string>)[e.equipment ?? ''] : ''}</div>
                  </div>
                  <button onClick={() => onPick(e.id)} className="bg-grad grid size-9 shrink-0 place-items-center rounded-full text-white"><Plus size={18} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}
