import { useEffect, useMemo, useRef, useState } from 'react'
import { ANIMS } from './animations'
import { bounds, cycleMs, L, poseAt, solve, type Anim, type Joints, type Pt } from './skeleton'

const C = {
  near: '#FF4B72',
  torso: '#F2385F',
  far: '#FFB2BA',
  head: '#2B2628',
  floor: '#FEE8EB',
  mat: '#FFD9DC',
  iron: '#3A3236',
  chair: '#C9A28E',
}

interface Props {
  anim: string
  playing?: boolean
  speed?: number
  /** fracción del ciclo a mostrar cuando no se reproduce (0–1) */
  still?: number
  className?: string
  onRep?: (n: number) => void
}

export default function Figure({ anim: key, playing = true, speed = 1, still = 0.5, className, onRep }: Props) {
  const anim: Anim = ANIMS[key] ?? ANIMS.squat
  const total = cycleMs(anim)
  const box = useMemo(() => bounds(anim), [anim])
  const [t, setT] = useState(total * still)
  const tRef = useRef(total * still)
  const onRepRef = useRef(onRep)
  onRepRef.current = onRep

  useEffect(() => {
    if (!playing) {
      setT(total * still)
      return
    }
    let raf = 0
    let last = performance.now()
    // un "rep" = repFrames fotogramas; contamos al completar cada uno
    const repLen = anim.repFrames
      ? anim.frames.slice(0, anim.repFrames).reduce((s, f) => s + f.ms, 0)
      : total
    let reps = Math.floor(tRef.current / repLen)
    const loop = (now: number) => {
      tRef.current += (now - last) * speed
      last = now
      const r = Math.floor(tRef.current / repLen)
      if (r > reps) {
        reps = r
        onRepRef.current?.(r)
      }
      setT(tRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, anim, total, still])

  const j = solve(poseAt(anim, t), anim.view, anim.anchor)
  const pad = 14
  const w = Math.max(box.maxX - box.minX + pad * 2, 150)
  const h = Math.max(-box.minY + pad + 10, 150)
  const cx = (box.minX + box.maxX) / 2
  const vb = `${cx - w / 2} ${-h + 10} ${w} ${h}`
  const props = anim.props ?? []

  return (
    <svg viewBox={vb} className={className} preserveAspectRatio="xMidYMax meet" role="img" aria-label="Demostración del ejercicio">
      {/* suelo */}
      <line x1={cx - w / 2} x2={cx + w / 2} y1={2} y2={2} stroke={C.floor} strokeWidth={4} strokeLinecap="round" />
      {props.includes('mat') && (
        <rect x={box.minX - 8} y={-1} width={box.maxX - box.minX + 16} height={5} rx={2.5} fill={C.mat} />
      )}
      {props.includes('wall') && <Wall j={j} />}
      {props.includes('chair') && <Chair j={j} />}

      {/* extremidades lejanas */}
      <Limb a={j.hipJ[1]} b={j.knee[1]} c={j.ankle[1]} d={j.toe[1]} color={C.far} />
      <Arm a={j.shoulder[1]} b={j.elbow[1]} c={j.hand[1]} color={C.far} />
      {props.includes('dumbbells') && <Dumbbell p={j.hand[1]} small dim />}

      {/* torso y cabeza */}
      <line x1={j.hip.x} y1={j.hip.y} x2={j.neck.x} y2={j.neck.y} stroke={C.torso} strokeWidth={13} strokeLinecap="round" />
      <Head j={j} />

      {/* extremidades cercanas */}
      <Limb a={j.hipJ[0]} b={j.knee[0]} c={j.ankle[0]} d={j.toe[0]} color={C.near} />
      <Arm a={j.shoulder[0]} b={j.elbow[0]} c={j.hand[0]} color={C.near} />
      {props.includes('dumbbells') && <Dumbbell p={j.hand[0]} small />}
      {props.includes('dumbbell') && (
        <Dumbbell p={{ x: (j.hand[0].x + j.hand[1].x) / 2, y: (j.hand[0].y + j.hand[1].y) / 2 }} vertical />
      )}
    </svg>
  )
}

function Limb({ a, b, c, d, color }: { a: Pt; b: Pt; c: Pt; d: Pt; color: string }) {
  return (
    <polyline
      points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`}
      fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
    />
  )
}

function Arm({ a, b, c, color }: { a: Pt; b: Pt; c: Pt; color: string }) {
  return (
    <polyline
      points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
      fill="none" stroke={color} strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round"
    />
  )
}

function Head({ j }: { j: Joints }) {
  // moño: un pequeño círculo en la parte superior/trasera de la cabeza
  const dx = j.head.x - j.neck.x, dy = j.head.y - j.neck.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len, uy = dy / len
  const bun = { x: j.head.x + ux * (L.head + 1) - uy * 3, y: j.head.y + uy * (L.head + 1) + ux * 3 }
  return (
    <g>
      <circle cx={bun.x} cy={bun.y} r={4.2} fill={C.head} />
      <circle cx={j.head.x} cy={j.head.y} r={L.head} fill={C.head} />
    </g>
  )
}

function Dumbbell({ p, small, vertical, dim }: { p: Pt; small?: boolean; vertical?: boolean; dim?: boolean }) {
  const len = small ? 14 : 16
  const plate = small ? 9 : 11
  const op = dim ? 0.55 : 1
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${vertical ? 90 : 0})`} opacity={op}>
      <rect x={-len / 2} y={-1.5} width={len} height={3} rx={1.5} fill={C.iron} />
      <rect x={-len / 2 - 3} y={-plate / 2} width={4.5} height={plate} rx={1.5} fill={C.iron} />
      <rect x={len / 2 - 1.5} y={-plate / 2} width={4.5} height={plate} rx={1.5} fill={C.iron} />
    </g>
  )
}

function Wall({ j }: { j: Joints }) {
  const x = Math.min(j.hip.x, j.neck.x) - 9
  return <rect x={x - 6} y={-140} width={6} height={142} rx={2} fill={C.floor} />
}

function Chair({ j }: { j: Joints }) {
  const hx = Math.max(j.hand[0].x, j.hand[1].x) + 3
  const sy = Math.max(j.hand[0].y, j.hand[1].y) + 4
  const x0 = hx - 42
  return (
    <g stroke={C.chair} strokeWidth={4} strokeLinecap="round" fill="none">
      <line x1={x0} y1={sy} x2={hx} y2={sy} strokeWidth={5} />
      <line x1={x0 + 3} y1={sy} x2={x0 + 3} y2={0} />
      <line x1={hx - 3} y1={sy} x2={hx - 3} y2={0} />
      <line x1={x0 + 3} y1={sy} x2={x0 - 2} y2={sy - 42} />
    </g>
  )
}
