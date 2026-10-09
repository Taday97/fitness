import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward, Timer, Volume2, VolumeX, X } from 'lucide-react'
import { findRoutine, useRoutines, useStore } from '../store'
import type { RoutineItem } from '../types'
import { getEx } from '../data/exercises'
import Figure from '../figure/Figure'
import { Button, Ring, cx } from '../components/ui'
import { ExerciseDetail } from '../components/Exercise'
import { beep, keepAwake, speak, stopSpeaking, vibrate } from '../lib/audio'
import { estimateKcal, fmtTime, uid } from '../lib/utils'

type Section = 'warmup' | 'main' | 'cooldown'
interface Step {
  kind: 'prep' | 'work' | 'rest'
  section: Section
  item: RoutineItem
  itemIndex: number
  set: number
  sets: number
  dur?: number // segundos (prep, descanso o ejercicio por tiempo)
}

const SECTION_LABEL: Record<Section, string> = { warmup: 'Calentamiento', main: 'Bloque principal', cooldown: 'Estiramientos' }

export default function SessionScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const routines = useRoutines()
  const routine = findRoutine(routines, id!)
  const { settings, setSettings, addSession, profile } = useStore()

  const { steps, flat } = useMemo(() => {
    const flat: { item: RoutineItem; section: Section }[] = routine
      ? (['warmup', 'main', 'cooldown'] as Section[]).flatMap((section) => routine[section].map((item) => ({ item, section })))
      : []
    const steps: Step[] = []
    if (!flat.length) return { steps, flat }
    steps.push({ kind: 'prep', section: flat[0].section, item: flat[0].item, itemIndex: 0, set: 1, sets: flat[0].item.sets, dur: settings.prepSec })
    flat.forEach(({ item, section }, i) => {
      const ex = getEx(item.exerciseId)
      for (let s = 1; s <= item.sets; s++) {
        steps.push({ kind: 'work', section, item, itemIndex: i, set: s, sets: item.sets, dur: ex.kind === 'time' ? item.seconds ?? 30 : undefined })
        const lastSet = s === item.sets
        if (lastSet && i === flat.length - 1) continue
        const next = lastSet ? flat[i + 1] : { item, section }
        const dur = !lastSet
          ? item.restSec ?? settings.restBetweenSets
          : section === 'main'
            ? item.restSec ?? settings.restBetweenExercises
            : settings.prepSec
        if (dur > 0)
          steps.push({ kind: 'rest', section: next.section, item: next.item, itemIndex: lastSet ? i + 1 : i, set: lastSet ? 1 : s + 1, sets: next.item.sets, dur })
      }
    })
    return { steps, flat }
    // los ajustes no cambian durante la sesión
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id])

  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(steps[0]?.dur ?? 0)
  const [paused, setPaused] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [repCount, setRepCount] = useState(0)
  const doneItems = useRef(new Set<number>())
  const startedAt = useRef(Date.now())
  const voiceOn = settings.voice

  const step = steps[idx]
  const ex = step ? getEx(step.item.exerciseId) : undefined
  const workSteps = steps.filter((s) => s.kind === 'work').length
  const workDone = steps.slice(0, idx).filter((s) => s.kind === 'work').length

  const say = useCallback((t: string, interrupt = true) => voiceOn && speak(t, { rate: settings.voiceRate, interrupt }), [voiceOn, settings.voiceRate])

  // pantalla siempre encendida
  useEffect(() => {
    let release = () => {}
    void keepAwake().then((r) => (release = r))
    return () => { release(); stopSpeaking() }
  }, [])

  // cronómetro total
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const finish = useCallback((partial = false) => {
    if (!routine) return
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000)
    const sid = uid()
    const done = doneItems.current.size
    addSession({
      id: sid, date: new Date().toISOString(), routineId: routine.id, routineName: routine.name, durationSec,
      exercisesDone: done, exercisesTotal: flat.length,
      kcal: Math.round(estimateKcal(routine, profile!.weightKg) * (partial ? done / Math.max(1, flat.length) : 1)),
    })
    say('¡Entrenamiento completado! Eres increíble.')
    nav(`/checkin/${sid}`, { replace: true })
  }, [routine, flat.length, addSession, profile, nav, say])

  const go = useCallback((n: number) => {
    if (n < 0) return
    const cur = steps[idx]
    if (cur?.kind === 'work' && n > idx) doneItems.current.add(cur.itemIndex)
    if (n >= steps.length) return finish()
    setIdx(n)
    setRemaining(steps[n].dur ?? 0)
    setRepCount(0)
    setPaused(false)
  }, [steps, idx, finish])

  // anunciar cada paso
  useEffect(() => {
    if (!step || !ex) return
    const side = ex.perSide ? ' por lado' : ''
    const what = ex.kind === 'time' ? `${step.item.seconds ?? 30} segundos${side}` : `${step.item.reps ?? 10} repeticiones${side}`
    const setTxt = step.sets > 1 ? `Serie ${step.set} de ${step.sets}. ` : ''
    if (step.kind === 'prep') say(`Prepárate. Empezamos con ${SECTION_LABEL[step.section].toLowerCase()}. Primer ejercicio: ${ex.name}.`)
    else if (step.kind === 'work') {
      say(`${ex.name}. ${setTxt}${what}.${ex.kind === 'time' ? ' ¡Vamos!' : ''}`)
      vibrate(80)
    } else {
      const sameEx = idx > 0 && steps[idx - 1].item === step.item
      say(`Descansa ${step.dur} segundos. ${sameEx ? `Después, serie ${step.set} de ${step.sets}.` : `Siguiente: ${ex.name}.`}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  // cuenta atrás de los pasos con tiempo
  useEffect(() => {
    if (!step?.dur || paused) return
    const t = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(t)
  }, [idx, paused, step?.dur])

  useEffect(() => {
    if (!step?.dur || paused) return
    if (remaining <= 0) {
      if (settings.beeps) beep(1175, 350)
      vibrate([60, 60, 120])
      go(idx + 1)
      return
    }
    if (remaining <= 3 && settings.beeps) beep(880, 120)
    if (step.kind === 'rest' && remaining === 10 && step.dur > 15) say('10 segundos', false)
    if (step.kind === 'work' && ex?.perSide && step.dur >= 20 && remaining === Math.floor(step.dur / 2)) say('Cambia de lado', true)
    if (step.kind === 'work' && step.dur >= 30 && remaining === Math.floor(step.dur / 2) && !ex?.perSide) say('¡Mitad! Sigue así', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const onRep = useCallback((n: number) => {
    if (!step || step.kind !== 'work' || ex?.kind !== 'reps' || paused) return
    const target = step.item.reps ?? 10
    if (n > target) return
    setRepCount(n)
    if (settings.countReps) say(n === target ? `${n}. ¡Muy bien!` : String(n), false)
  }, [step, ex, paused, settings.countReps, say])

  if (!routine || !step || !ex) {
    return (
      <div className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <p className="mb-4 text-muted">No encontré esa rutina o está vacía.</p>
          <Button onClick={() => nav('/')}>Volver</Button>
        </div>
      </div>
    )
  }

  const isRest = step.kind !== 'work'
  const timed = step.dur !== undefined
  const pct = timed ? 1 - remaining / (step.dur || 1) : 0

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      {/* barra superior */}
      <header className="flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <button onClick={() => { setPaused(true); setConfirmExit(true) }} className="grid size-10 place-items-center rounded-full bg-surface shadow-card" aria-label="Salir">
          <X size={20} />
        </button>
        <div className="flex-1 truncate rounded-full border border-line bg-surface px-3 py-2 text-[11px] font-bold tracking-wide uppercase shadow-card">
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
          Ejercicio {Math.min(step.itemIndex + 1, flat.length)} de {flat.length} · {SECTION_LABEL[step.section]}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-2 text-xs font-bold text-primary tabular shadow-card">
          <Timer size={14} /> {fmtTime(elapsed)}
        </div>
      </header>
      <div className="flex gap-0.5 px-4">
        {Array.from({ length: workSteps }).map((_, i) => (
          <div key={i} className={cx('h-1 flex-1 rounded-full', i < workDone ? 'bg-primary' : i === workDone && !isRest ? 'bg-peach' : 'bg-line')} />
        ))}
      </div>

      <main className="flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-40">
        {/* figura */}
        <div className={cx('relative overflow-hidden rounded-3xl border border-line shadow-card', isRest ? 'bg-gradient-to-b from-hero-3 to-surface' : 'bg-gradient-to-b from-hero-1 to-surface')}>
          <Figure
            key={idx}
            anim={ex.anim}
            playing={!paused}
            speed={isRest ? 0.6 : 1}
            onRep={onRep}
            className="mx-auto h-[34vh] max-h-80 w-full"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className={cx('rounded-full px-3 py-1 text-[11px] font-bold', isRest ? 'bg-surface text-secondary' : 'bg-grad text-white')}>
              {step.kind === 'prep' ? 'PREPÁRATE' : step.kind === 'rest' ? 'DESCANSO · SIGUIENTE' : SECTION_LABEL[step.section].toUpperCase()}
            </span>
            {step.sets > 1 && <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-primary">SERIE {step.set}/{step.sets}</span>}
          </div>
          <button onClick={() => setSettings({ voice: !voiceOn })} className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-surface/90 text-primary" aria-label="Voz">
            {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-[26px] leading-tight font-extrabold">{ex.name}</h1>
          <p className="text-sm text-muted">{ex.muscles}{step.item.weightKg ? ` · ${step.item.weightKg} kg` : ''}</p>
        </div>

        {/* objetivo / contador */}
        <div className="flex justify-center">
          {timed ? (
            <Ring value={pct} size={isRest ? 170 : 190}>
              <div className="text-center">
                <div className="text-5xl font-extrabold tabular">{remaining}</div>
                <div className="text-[11px] font-bold tracking-wider text-primary uppercase">
                  {isRest ? 'seg descanso' : ex.perSide ? 'seg · por lado' : 'segundos'}
                </div>
              </div>
            </Ring>
          ) : (
            <div className="flex flex-col items-center rounded-3xl border border-line bg-surface px-10 py-5 shadow-card">
              <div className="text-6xl font-extrabold tabular text-grad">{step.item.reps ?? 10}</div>
              <div className="text-xs font-bold tracking-wider text-muted uppercase">repeticiones{ex.perSide ? ' por lado' : ''}</div>
              {settings.countReps && <div className="mt-1 text-sm font-bold text-primary tabular">{repCount} / {step.item.reps ?? 10}</div>}
            </div>
          )}
        </div>

        {isRest && (
          <div className="text-center text-sm text-muted">
            Siguiente: <b className="text-ink">{ex.name}</b> · {ex.kind === 'time' ? `${step.item.seconds ?? 30} s` : `${step.item.reps ?? 10} reps`}
            {step.sets > 1 && ` · serie ${step.set} de ${step.sets}`}
          </div>
        )}

        {step.item.note && <p className="rounded-xl bg-blush p-3 text-sm">📝 {step.item.note}</p>}

        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <button onClick={() => setShowHow(!showHow)} className="flex w-full items-center justify-between p-4 font-bold">
            Cómo hacerlo {showHow ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showHow && <div className="px-4 pb-4"><ExerciseDetail id={ex.id} hideFigure /></div>}
        </div>
      </main>

      {/* controles */}
      <footer className="glass fixed inset-x-0 bottom-0 z-20 border-t border-line pb-safe">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => { let n = idx - 1; while (n > 0 && steps[n].kind !== 'work') n--; go(Math.max(0, n)) }} className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-card" aria-label="Anterior">
            <SkipBack size={20} />
          </button>
          {isRest ? (
            <>
              <button onClick={() => setRemaining((r) => r + 15)} className="h-12 shrink-0 rounded-full bg-blush-2 px-4 text-sm font-bold text-primary">+15 s</button>
              <Button size="lg" className="flex-1" onClick={() => go(idx + 1)}>
                <SkipForward size={18} /> {step.kind === 'prep' ? '¡Empezar ya!' : 'Saltar descanso'}
              </Button>
            </>
          ) : timed ? (
            <>
              <Button size="lg" variant="secondary" className="flex-1" onClick={() => setPaused(!paused)}>
                {paused ? <><Play size={18} fill="currentColor" /> Seguir</> : <><Pause size={18} fill="currentColor" /> Pausa</>}
              </Button>
              <button onClick={() => go(idx + 1)} className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-card" aria-label="Siguiente">
                <SkipForward size={20} />
              </button>
            </>
          ) : (
            <Button size="lg" className="flex-1" onClick={() => { if (settings.beeps) beep(1175, 200); go(idx + 1) }}>
              <Check size={20} strokeWidth={3} /> ¡Hecho! {step.sets > 1 ? `Serie ${step.set}` : ''}
            </Button>
          )}
        </div>
      </footer>

      {paused && timed && !confirmExit && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-surface/70 backdrop-blur-sm" onClick={() => setPaused(false)}>
          <div className="text-center">
            <div className="bg-grad shadow-glow mx-auto mb-3 grid size-20 place-items-center rounded-full text-white"><Play size={34} fill="currentColor" /></div>
            <div className="font-bold">En pausa · toca para seguir</div>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50">
          <div className="animate-sheet w-full max-w-md space-y-3 rounded-t-3xl bg-surface p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <h2 className="text-xl font-extrabold">¿Terminar el entrenamiento?</h2>
            <p className="text-sm text-muted">Llevas {fmtTime(elapsed)} y {doneItems.current.size} de {flat.length} ejercicios.</p>
            <Button className="w-full" onClick={() => finish(true)}>Guardar lo hecho y hacer check-in</Button>
            <Button variant="secondary" className="w-full" onClick={() => { setConfirmExit(false); setPaused(false) }}>Seguir entrenando</Button>
            <Button variant="ghost" className="w-full" onClick={() => nav('/', { replace: true })}>Salir sin guardar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
