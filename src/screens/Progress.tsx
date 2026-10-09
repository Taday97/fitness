import { Clock, Dumbbell, Flame, Scale, Trophy } from 'lucide-react'
import { useRoutines, useStore } from '../store'
import { Card, Empty, Label, TopBar, cx } from '../components/ui'
import { sessionDays, streak } from '../lib/stats'
import { DAYS_SHORT, addDays, dayKey, fmtDate, startOfWeek } from '../lib/utils'

export default function Progress() {
  const { sessions, checkIns, profile } = useStore()
  const routines = useRoutines()
  const isTraining = (wd: number) => routines.some((r) => r.days.includes(wd))
  const st = streak(sessions, isTraining)
  const done = sessionDays(sessions)
  const totalMin = Math.round(sessions.reduce((s, x) => s + x.durationSec, 0) / 60)
  const totalKcal = sessions.reduce((s, x) => s + x.kcal, 0)

  // racha más larga (misma regla que la actual)
  let best = 0
  if (sessions.length) {
    const first = startOfWeek(new Date(Math.min(...sessions.map((s) => +new Date(s.date)))))
    let run = 0
    for (let d = first; dayKey(d) <= dayKey(new Date()); d = addDays(d, 1)) {
      const k = dayKey(d)
      if (done.has(k) || (!isTraining((d.getDay() + 6) % 7) && run > 0)) run++
      else if (k !== dayKey(new Date())) run = 0
      best = Math.max(best, run)
    }
  }

  const startW = profile?.startWeightKg ?? checkIns[0]?.weightKg ?? profile?.weightKg
  const weights = [
    ...(profile && startW ? [{ date: profile.createdAt, v: startW }] : []),
    ...checkIns.map((c) => ({ date: c.date, v: c.weightKg })),
  ]
  const waists = checkIns.filter((c) => c.waistCm).map((c) => ({ date: c.date, v: c.waistCm! }))
  const firstW = startW
  const lastW = checkIns[checkIns.length - 1]?.weightKg

  return (
    <div>
      <TopBar title="Tu progreso" subtitle={`${sessions.length} entrenamientos`} />
      <div className="space-y-4 px-5 pt-4 pb-6">
        {/* racha */}
        <div className="bg-grad relative overflow-hidden rounded-3xl p-5 text-white shadow-glow">
          <Flame size={120} className="absolute -right-4 -bottom-6 opacity-20" fill="currentColor" />
          <div className="text-xs font-bold tracking-wider uppercase opacity-90">Racha actual</div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-extrabold">{st}</span>
            <span className="pb-2 text-xl font-bold">{st === 1 ? 'día' : 'días'}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/90"><Trophy size={16} /> Mejor racha: {Math.max(best, st)} días</div>
          <p className="mt-2 text-xs text-white/80">Los días de descanso de tu plan no rompen la racha 💪</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Mini icon={<Dumbbell size={18} />} v={sessions.length} l="Sesiones" />
          <Mini icon={<Clock size={18} />} v={totalMin} l="Minutos" />
          <Mini icon={<Flame size={18} />} v={totalKcal} l="Kcal" />
        </div>

        {/* calendario */}
        <Card>
          <Label right={<span className="text-xs text-muted">últimas 12 semanas</span>}>Constancia</Label>
          <Heatmap done={done} isTraining={isTraining} />
        </Card>

        {/* peso */}
        <Card>
          <Label right={firstW !== undefined && lastW !== undefined && checkIns.length > 0 && (
            <span className={cx('text-sm font-bold', lastW <= firstW ? 'text-ok' : 'text-primary')}>
              {lastW - firstW > 0 ? '+' : ''}{(lastW - firstW).toFixed(1)} kg
            </span>
          )}>Peso</Label>
          {weights.length > 1 ? (
            <LineChart data={weights} unit="kg" target={profile?.targetWeightKg} />
          ) : (
            <Empty icon={<Scale />} title="Aún sin datos" text="Tras cada entreno te preguntaré tu peso y aquí verás tu evolución." />
          )}
        </Card>

        {waists.length > 1 && (
          <Card>
            <Label>Cintura</Label>
            <LineChart data={waists} unit="cm" />
          </Card>
        )}

        {checkIns.length > 0 && (
          <Card>
            <Label>Esfuerzo percibido (últimos check-ins)</Label>
            <div className="flex h-28 items-end gap-1.5">
              {checkIns.slice(-14).map((c) => (
                <div key={c.id} className="flex flex-1 flex-col items-center gap-1">
                  <div className="bg-grad w-full rounded-t-md" style={{ height: `${c.rpe * 9}px`, opacity: 0.4 + c.rpe / 17 }} />
                  <span className="text-[9px] text-faint">{new Date(c.date).getDate()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {sessions.length > 0 && (
          <div className="space-y-2">
            <Label>Historial</Label>
            {[...sessions].reverse().slice(0, 30).map((s) => {
              const c = checkIns.find((x) => x.sessionId === s.id)
              return (
                <Card key={s.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-grad grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white">
                      {fmtDate(s.date, { day: 'numeric' })}<br />{fmtDate(s.date, { month: 'short' })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{s.routineName}</div>
                      <div className="text-xs text-muted">
                        {Math.round(s.durationSec / 60)} min · {s.exercisesDone}/{s.exercisesTotal} ejercicios · ~{s.kcal} kcal
                        {c && ` · ${c.weightKg} kg · esfuerzo ${c.rpe}/10`}
                      </div>
                    </div>
                  </div>
                  {c?.adjustments?.length ? (
                    <ul className="mt-2 space-y-1 rounded-xl bg-blush p-2 text-xs text-muted">
                      {c.adjustments.map((a, i) => <li key={i}>↗ {a}</li>)}
                    </ul>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Mini({ icon, v, l }: { icon: React.ReactNode; v: number; l: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 p-3 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-xl font-extrabold tabular">{v.toLocaleString('es-ES')}</span>
      <span className="text-[10px] font-bold tracking-wide text-muted uppercase">{l}</span>
    </Card>
  )
}

function Heatmap({ done, isTraining }: { done: Set<string>; isTraining: (wd: number) => boolean }) {
  const weeks = 12
  const start = addDays(startOfWeek(), -(weeks - 1) * 7)
  const today = dayKey(new Date())
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-1 pt-0.5">
        {DAYS_SHORT.map((d) => <span key={d} className="h-[18px] text-[9px] leading-[18px] font-bold text-faint">{d}</span>)}
      </div>
      <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1">
        {Array.from({ length: weeks * 7 }).map((_, i) => {
          const d = addDays(start, i)
          const k = dayKey(d)
          const future = k > today
          return (
            <div
              key={k}
              title={k}
              className={cx(
                'aspect-square max-h-[18px] rounded-[5px]',
                done.has(k) ? 'bg-grad' : future ? 'bg-transparent' : isTraining(i % 7) ? 'bg-line' : 'bg-blush',
                k === today && 'ring-2 ring-primary/40',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

function LineChart({ data, unit, target }: { data: { date: string; v: number }[]; unit: string; target?: number }) {
  const W = 320, H = 150, P = { l: 34, r: 10, t: 12, b: 22 }
  const xs = data.map((d) => +new Date(d.date))
  const vals = data.map((d) => d.v).concat(target ? [target] : [])
  let min = Math.min(...vals), max = Math.max(...vals)
  if (max - min < 2) { min -= 1; max += 1 }
  const pad = (max - min) * 0.1
  min -= pad; max += pad
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1
  const X = (t: number) => P.l + ((t - x0) / (x1 - x0 || 1)) * (W - P.l - P.r)
  const Y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const pts = data.map((d, i) => `${X(xs[i])},${Y(d.v)}`).join(' ')
  const area = `${X(xs[0])},${H - P.b} ${pts} ${X(xs[xs.length - 1])},${H - P.b}`
  const ticks = [min + pad, (min + max) / 2, max - pad]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id={`fill-${unit}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`line-${unit}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-secondary)" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="var(--color-line)" />
          <text x={P.l - 6} y={Y(t) + 3} textAnchor="end" fontSize="9" fill="var(--color-faint)">{t.toFixed(1)}</text>
        </g>
      ))}
      {target && (
        <g>
          <line x1={P.l} x2={W - P.r} y1={Y(target)} y2={Y(target)} stroke="var(--color-ok)" strokeDasharray="4 4" />
          <text x={W - P.r} y={Y(target) - 4} textAnchor="end" fontSize="9" fill="var(--color-ok)" fontWeight="700">meta {target} {unit}</text>
        </g>
      )}
      <polygon points={area} fill={`url(#fill-${unit})`} />
      <polyline points={pts} fill="none" stroke={`url(#line-${unit})`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => <circle key={i} cx={X(xs[i])} cy={Y(d.v)} r="3.5" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" />)}
      <text x={P.l} y={H - 6} fontSize="9" fill="var(--color-faint)">{fmtDate(data[0].date)}</text>
      <text x={W - P.r} y={H - 6} fontSize="9" fill="var(--color-faint)" textAnchor="end">{fmtDate(data[data.length - 1].date)}</text>
    </svg>
  )
}
