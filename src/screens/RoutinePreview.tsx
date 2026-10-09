import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Clock, Dumbbell, Flame, Layers, Pencil, Play } from 'lucide-react'
import { findRoutine, useRoutines, useStore } from '../store'
import type { Routine } from '../types'
import { Button, TopBar } from '../components/ui'
import { ExerciseRow, ExerciseSheet } from '../components/Exercise'
import Figure from '../figure/Figure'
import { getEx } from '../data/exercises'
import { DAYS, estimateKcal, estimateMinutes, totalSets } from '../lib/utils'

/** Vista previa de una rutina: todos sus ejercicios antes de empezar. */
export default function RoutinePreview() {
  const { id } = useParams()
  const nav = useNavigate()
  const { profile, settings } = useStore()
  const routines = useRoutines()
  const [info, setInfo] = useState<{ id: string; note?: string }>()
  const r = findRoutine(routines, id ?? '')
  if (!r) return <Navigate to="/" replace />

  return (
    <div className="pb-28">
      <TopBar
        title={r.name}
        subtitle={r.focus}
        back
        right={
          <button onClick={() => nav(`/routine/${r.id}`)} className="grid size-10 place-items-center rounded-full bg-blush-2 text-primary" aria-label="Editar rutina">
            <Pencil size={18} />
          </button>
        }
      />
      <div className="space-y-5 px-5 pt-4">
        <div className="relative h-48 overflow-hidden rounded-3xl bg-gradient-to-br from-hero-1 via-hero-2 to-hero-3">
          <Figure anim={getEx(r.main[0]?.exerciseId ?? 'squat').anim} className="absolute right-2 bottom-0 h-44 w-44" />
          <div className="absolute top-4 left-4 flex max-w-[55%] flex-wrap gap-1.5">
            {r.days.length ? (
              r.days.map((d) => (
                <span key={d} className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-primary">{DAYS[d]}</span>
              ))
            ) : (
              <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-muted">Sin días asignados</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-line rounded-2xl border border-line bg-surface py-3 text-center shadow-card">
          <Stat icon={<Clock size={16} />} v={`${estimateMinutes(r, settings)}`} l="MIN" />
          <Stat icon={<Flame size={16} />} v={`~${estimateKcal(r, profile!.weightKg)}`} l="KCAL" />
          <Stat icon={<Dumbbell size={16} />} v={`${r.main.length}`} l="EJERCICIOS" />
          <Stat icon={<Layers size={16} />} v={`${totalSets(r)}`} l="SERIES" />
        </div>

        <Section title="Calentamiento" items={r.warmup} onInfo={setInfo} />
        <Section title="Bloque principal" items={r.main} onInfo={setInfo} numbered />
        <Section title="Estiramientos" items={r.cooldown} onInfo={setInfo} />
        <p className="text-center text-xs text-faint">Toca ⓘ en un ejercicio para ver cómo se hace.</p>
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line pb-safe">
        <div className="mx-auto max-w-md px-5 py-3">
          <Button size="lg" className="w-full" onClick={() => nav(`/session/${r.id}`)}>
            <Play size={18} fill="currentColor" /> Empezar esta rutina
          </Button>
        </div>
      </div>
      <ExerciseSheet id={info?.id} note={info?.note} onClose={() => setInfo(undefined)} />
    </div>
  )
}

function Stat({ icon, v, l }: { icon: React.ReactNode; v: string; l: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1">
      <span className="text-primary">{icon}</span>
      <span className="text-base font-extrabold tabular">{v}</span>
      <span className="text-[9px] font-bold tracking-wide text-muted">{l}</span>
    </div>
  )
}

function Section({ title, items, onInfo, numbered }: { title: string; items: Routine['main']; onInfo: (x: { id: string; note?: string }) => void; numbered?: boolean }) {
  if (!items.length) return null
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs font-semibold text-muted">{items.length} ejercicios</span>
      </div>
      {items.map((it, i) => (
        <ExerciseRow key={i} item={it} index={numbered ? i : undefined} onInfo={() => onInfo({ id: it.exerciseId, note: it.note })} />
      ))}
    </section>
  )
}
