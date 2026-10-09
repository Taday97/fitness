import { Info, Lightbulb } from 'lucide-react'
import type { RoutineItem } from '../types'
import { CATEGORY_LABEL, getEx } from '../data/exercises'
import Figure from '../figure/Figure'
import { itemLabel } from '../lib/utils'
import { Sheet } from './ui'

export function ExerciseRow({ item, index, onInfo }: { item: RoutineItem; index?: number; onInfo?: () => void }) {
  const ex = getEx(item.exerciseId)
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 shadow-card">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush">
        <Figure anim={ex.anim} playing={false} still={0.5} className="size-full" />
        {index !== undefined && (
          <span className="absolute bottom-0.5 left-0.5 rounded-md bg-surface/90 px-1 text-[10px] font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{ex.name}</div>
        <div className="truncate text-xs text-muted">{ex.muscles}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {item.sets > 1 && <span className="rounded-md bg-blush px-1.5 py-0.5 font-semibold">{item.sets} series</span>}
          <span className="font-bold text-primary">{itemLabel(item)}</span>
          {item.weightKg ? <span className="text-muted">· {item.weightKg} kg</span> : null}
        </div>
      </div>
      {onInfo && (
        <button onClick={onInfo} className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-2 text-primary" aria-label="Ver técnica">
          <Info size={18} />
        </button>
      )}
    </div>
  )
}

export function ExerciseSheet({ id, onClose, note }: { id?: string; onClose: () => void; note?: string }) {
  const ex = id ? getEx(id) : undefined
  return (
    <Sheet open={!!ex} onClose={onClose} title={ex?.name}>
      {ex && <ExerciseDetail id={ex.id} note={note} />}
    </Sheet>
  )
}

export function ExerciseDetail({ id, note, hideFigure }: { id: string; note?: string; hideFigure?: boolean }) {
  const ex = getEx(id)
  return (
    <div className="space-y-4">
      {!hideFigure && (
        <div className="rounded-2xl bg-gradient-to-b from-blush to-surface p-2">
          <Figure anim={ex.anim} className="mx-auto h-56 w-full" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-blush-2 px-3 py-1 text-xs font-bold text-primary">{CATEGORY_LABEL[ex.category]}</span>
        {ex.muscles.split(' · ').map((m) => (
          <span key={m} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">{m}</span>
        ))}
      </div>
      <ol className="space-y-2">
        {ex.steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-xl bg-blush p-3 text-sm">
            <span className="bg-grad grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="flex gap-2 rounded-xl border border-line bg-blush p-3 text-sm">
        <Lightbulb size={18} className="shrink-0 text-secondary" />
        <span>{ex.tip}</span>
      </div>
      {note && <p className="text-sm text-muted">📝 {note}</p>}
    </div>
  )
}
