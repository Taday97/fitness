import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Clock, Dumbbell, Eye, Flame, Layers, List, Moon, Play, Sparkles } from 'lucide-react'
import { todayRoutine, useRoutines, useStore } from '../store'
import type { Routine } from '../types'
import { Button, Card, Logo, cx } from '../components/ui'
import { ExerciseRow, ExerciseSheet } from '../components/Exercise'
import Figure from '../figure/Figure'
import { streak, sessionDays } from '../lib/stats'
import { DAYS_SHORT, addDays, dayKey, estimateKcal, estimateMinutes, startOfWeek, totalSets, weekday } from '../lib/utils'
import { getEx } from '../data/exercises'

export default function Home() {
  const nav = useNavigate()
  const { profile, plan, sessions, settings } = useStore()
  const routines = useRoutines()
  const today = todayRoutine(routines)
  const [chosen, setChosen] = useState<string>()
  const [info, setInfo] = useState<{ id: string; note?: string }>()
  const r: Routine | undefined = routines.find((x) => x.id === chosen) ?? today
  const done = sessionDays(sessions)
  const doneToday = done.has(dayKey(new Date()))
  const isTrainingDay = (wd: number) => routines.some((x) => x.days.includes(wd))
  const st = streak(sessions, isTrainingDay)
  const week = Math.floor((Date.now() - new Date(plan!.createdAt).getTime()) / (7 * 864e5)) + 1
  const monday = startOfWeek()
  const hour = new Date().getHours()
  const hello = hour < 13 ? '¡Buenos días' : hour < 20 ? '¡Buenas tardes' : '¡Buenas noches'

  return (
    <div className="space-y-5 px-5 pt-[max(env(safe-area-inset-top),16px)]">
      {/* cabecera */}
      <header className="flex items-center gap-3">
        <Logo size={40} />
        <div className="flex-1">
          <div className="text-lg leading-tight font-extrabold tracking-tight">FORMA AI</div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            {settings.apiKey ? 'IA ACTIVA · GEMINI' : 'MODO BÁSICO · SIN IA'}
          </div>
        </div>
        <Link to="/settings" className="bg-grad grid size-11 place-items-center rounded-full text-lg font-extrabold text-white ring-2 ring-white shadow-glow" aria-label="Ajustes">
          {profile!.name.charAt(0).toUpperCase()}
        </Link>
      </header>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-bold tracking-wider text-muted uppercase">Semana {week} · {new Date().toLocaleDateString('es-ES', { weekday: 'long' })}</div>
          <h1 className="text-[28px] leading-tight font-extrabold">{hello}, {profile!.name}! ✨</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-card">
          <Flame size={14} fill="currentColor" /> {st} {st === 1 ? 'día' : 'días'}
        </div>
      </div>

      {/* mensaje de la IA */}
      <Card onClick={() => nav('/plan')} className="flex items-center gap-3">
        <div className="bg-grad grid size-11 shrink-0 place-items-center rounded-xl text-white"><Sparkles size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
            {plan!.lastAdjustments?.length ? 'Plan IA ajustado' : 'Tu plan IA'}
          </div>
          <div className="line-clamp-2 text-sm text-muted">{plan!.coachMessage || plan!.summary}</div>
        </div>
        <ChevronRight size={18} className="text-faint" />
      </Card>

      {/* adherencia semanal */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-muted uppercase">Esta semana</span>
          <span className="text-sm font-bold text-primary">
            {DAYS_SHORT.filter((_, i) => done.has(dayKey(addDays(monday, i)))).length}/{routines.length ? new Set(routines.flatMap((x) => x.days)).size : 0} entrenos
          </span>
        </div>
        <p className="-mt-1 mb-3 text-xs text-faint">Toca un día para ver su rutina completa</p>
        <div className="flex justify-between">
          {DAYS_SHORT.map((d, i) => {
            const date = addDays(monday, i)
            const k = dayKey(date)
            const isToday = i === weekday()
            const did = done.has(k)
            const train = isTrainingDay(i)
            const past = k < dayKey(new Date())
            const dayRoutine = routines.find((x) => x.days.includes(i))
            return (
              <button
                key={d}
                onClick={() => dayRoutine && nav(`/preview/${dayRoutine.id}`)}
                disabled={!dayRoutine}
                aria-label={dayRoutine ? `Ver rutina: ${dayRoutine.name}` : 'Descanso'}
                className="flex flex-col items-center gap-1.5 active:scale-95"
              >
                <span className={cx('text-xs font-bold', isToday ? 'text-primary' : 'text-faint')}>{d}</span>
                <span
                  className={cx(
                    'grid size-10 place-items-center rounded-full text-sm font-bold',
                    did ? 'bg-grad text-white shadow-glow' : isToday ? 'border-2 border-primary text-primary' : train ? (past ? 'bg-line text-faint' : 'bg-blush-2 text-ink') : 'border border-dashed border-line text-faint',
                  )}
                >
                  {did ? <Check size={18} strokeWidth={3} /> : !train ? <Moon size={14} /> : isToday ? <span className="size-2.5 rounded-full bg-primary" /> : date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* rutina del día */}
      {r ? (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-float">
          <div className="relative h-52 bg-gradient-to-br from-[#ffe1e6] via-[#fff0f2] to-[#ffe7de]">
            <Figure anim={getEx(r.main[0]?.exerciseId ?? 'squat').anim} className="absolute right-0 bottom-0 h-48 w-48" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-primary">
                {chosen ? 'RUTINA ELEGIDA' : doneToday ? '✓ HECHA HOY' : 'RUTINA DE HOY'}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 max-w-[58%]">
              <div className="text-[11px] font-bold tracking-wider text-primary uppercase">{r.focus}</div>
              <h2 className="text-2xl leading-tight font-extrabold">{r.name}</h2>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-4 divide-x divide-line rounded-2xl border border-line bg-blush py-3 text-center">
              <Stat icon={<Clock size={16} />} v={`${estimateMinutes(r, settings)}`} l="MIN" />
              <Stat icon={<Flame size={16} />} v={`~${estimateKcal(r, profile!.weightKg)}`} l="KCAL" />
              <Stat icon={<Dumbbell size={16} />} v={`${r.main.length}`} l="EJERCICIOS" />
              <Stat icon={<Layers size={16} />} v={`${totalSets(r)}`} l="SERIES" />
            </div>
            <Button size="lg" className="w-full" onClick={() => nav(`/session/${r.id}`)}>
              <Play size={18} fill="currentColor" /> {doneToday && !chosen ? 'Entrenar otra vez' : 'Iniciar entrenamiento'}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => nav(`/preview/${r.id}`)}>
              <Eye size={16} /> Ver todos los ejercicios
            </Button>
          </div>
        </div>
      ) : (
        <Card className="flex items-center gap-4 bg-gradient-to-br from-white to-blush">
          <Figure anim="child_pose" className="h-24 w-28 shrink-0" />
          <div>
            <div className="text-lg font-extrabold">Hoy toca descanso 🌙</div>
            <p className="text-sm text-muted">El músculo crece mientras descansas. Si te apetece moverte, elige una rutina abajo.</p>
          </div>
        </Card>
      )}

      {/* cambiar rutina */}
      {routines.length > 1 && (
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">¿Otra rutina hoy?</div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {routines.map((x) => (
              <button key={x.id} onClick={() => setChosen(x.id === today?.id ? undefined : x.id)}
                className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold', r?.id === x.id ? 'bg-grad text-white shadow-glow' : 'border border-line bg-white text-muted')}>
                {x.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* desglose */}
      {r && (
        <section className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold"><List size={20} className="text-primary" /> Desglose de rutina</h3>
            <span className="rounded-full bg-blush-2 px-2.5 py-1 text-[11px] font-bold text-primary">{r.main.length} EJERCICIOS</span>
          </div>
          <Section title="Calentamiento" items={r.warmup} onInfo={setInfo} />
          <Section title="Bloque principal" items={r.main} onInfo={setInfo} numbered />
          <Section title="Estiramientos" items={r.cooldown} onInfo={setInfo} />
        </section>
      )}
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
    <div className="space-y-2">
      <div className="text-xs font-bold text-muted">{title}</div>
      {items.map((it, i) => (
        <ExerciseRow key={i} item={it} index={numbered ? i : undefined} onInfo={() => onInfo({ id: it.exerciseId, note: it.note })} />
      ))}
    </div>
  )
}
