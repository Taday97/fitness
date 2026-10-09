import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { ANIMS } from './animations'
import { bounds, cycleMs, HANG_Y, L, poseAt, solve, type Anim, type Joints, type Pt } from './skeleton'

const C = {
  near: '#FF4B72',
  torso: '#F2385F',
  far: '#FFB2BA',
  head: '#2B2628',
  floor: '#FEE8EB',
  mat: '#FFD9DC',
  iron: '#3A3236',
  chair: '#C9A28E',
  frame: '#B8ADB1',
  pad: '#F7B9C5',
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
  const male = useStore((s) => s.profile?.sex === 'male')
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

  const j = solve(poseAt(anim, t), anim.view, anim.anchor, anim.hipY)
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
      <GymBack props={props} j={j} anim={anim} />

      {/* extremidades lejanas */}
      <Limb a={j.hipJ[1]} b={j.knee[1]} c={j.ankle[1]} d={j.toe[1]} color={C.far} />
      <Arm a={j.shoulder[1]} b={j.elbow[1]} c={j.hand[1]} color={C.far} />
      {props.includes('dumbbells') && <Dumbbell p={j.hand[1]} small dim />}
      {props.includes('barbell') && anim.view === 'front' && <FrontBar j={j} />}

      {/* torso y cabeza */}
      <line x1={j.hip.x} y1={j.hip.y} x2={j.neck.x} y2={j.neck.y} stroke={C.torso} strokeWidth={13} strokeLinecap="round" />
      <Head j={j} male={male} />

      {/* extremidades cercanas */}
      <Limb a={j.hipJ[0]} b={j.knee[0]} c={j.ankle[0]} d={j.toe[0]} color={C.near} />
      <Arm a={j.shoulder[0]} b={j.elbow[0]} c={j.hand[0]} color={C.near} />
      {props.includes('dumbbells') && <Dumbbell p={j.hand[0]} small />}
      <GymFront props={props} j={j} anim={anim} />
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

function Head({ j, male }: { j: Joints; male?: boolean }) {
  if (male) return <circle cx={j.head.x} cy={j.head.y} r={L.head} fill={C.head} />
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

// ---------- Gimnasio ----------
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Disco de barra visto de lado */
function Plate({ p, r = 13 }: { p: Pt; r?: number }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={r} fill={C.iron} />
      <circle cx={p.x} cy={p.y} r={r * 0.35} fill="#6B6166" />
    </g>
  )
}

/** Barra apoyada en la parte alta de la espalda (sentadilla): detrás del cuello, sin tapar la cabeza */
function BackBar({ j }: { j: Joints }) {
  const dx = j.neck.x - j.hip.x, dy = j.neck.y - j.hip.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len, uy = dy / len
  // perpendicular hacia la espalda (mirando a la derecha, la espalda queda a la izquierda)
  const bx = uy, by = -ux
  return <Plate p={{ x: j.neck.x + bx * 11 - ux * 6, y: j.neck.y + by * 11 - uy * 6 }} r={11} />
}

/** Barra vista de frente (press militar…) */
function FrontBar({ j }: { j: Joints }) {
  const m = mid(j.hand[0], j.hand[1])
  const half = Math.max(48, Math.abs(j.hand[0].x - j.hand[1].x) / 2 + 22)
  return (
    <g>
      <line x1={m.x - half} y1={m.y} x2={m.x + half} y2={m.y} stroke={C.iron} strokeWidth={3.5} strokeLinecap="round" />
      <rect x={m.x - half - 2} y={m.y - 12} width={6} height={24} rx={2} fill={C.iron} />
      <rect x={m.x + half - 4} y={m.y - 12} width={6} height={24} rx={2} fill={C.iron} />
    </g>
  )
}

/** Banco plano bajo un tramo del cuerpo */
function Bench({ x0, x1, top }: { x0: number; x1: number; top: number }) {
  return (
    <g>
      <line x1={x0 + 6} y1={top} x2={x0 + 6} y2={0} stroke={C.frame} strokeWidth={4} />
      <line x1={x1 - 6} y1={top} x2={x1 - 6} y2={0} stroke={C.frame} strokeWidth={4} />
      <rect x={x0} y={top} width={x1 - x0} height={8} rx={3} fill={C.pad} />
    </g>
  )
}

/** Aparatos que quedan detrás del cuerpo */
function GymBack({ props, j, anim }: { props: string[]; j: Joints; anim: Anim }) {
  const has = (p: string) => props.includes(p)
  const hands = mid(j.hand[0], j.hand[1])
  const lowY = Math.max(j.hip.y, j.neck.y, j.shoulder[0].y)
  return (
    <g>
      {anim.pulley && (
        <g>
          <line x1={anim.pulley.x + 6} y1={Math.min(anim.pulley.y - 8, -170)} x2={anim.pulley.x + 6} y2={2} stroke={C.frame} strokeWidth={6} strokeLinecap="round" />
          <line x1={anim.pulley.x} y1={anim.pulley.y} x2={hands.x} y2={hands.y} stroke="#8A7F84" strokeWidth={1.6} />
          <circle cx={anim.pulley.x} cy={anim.pulley.y} r={5} fill={C.iron} />
        </g>
      )}
      {has('pullupBar') && (
        <g stroke={C.frame} strokeLinecap="round">
          <line x1={hands.x - 55} y1={-HANG_Y} x2={hands.x + 8} y2={-HANG_Y} strokeWidth={5} />
          <line x1={hands.x - 55} y1={-HANG_Y} x2={hands.x - 55} y2={2} strokeWidth={6} />
        </g>
      )}
      {has('bench') && <Bench x0={Math.min(j.hip.x, j.neck.x) - 6} x1={Math.max(j.hip.x, j.neck.x) + 10} top={lowY + 5} />}
      {has('benchBack') && <Bench x0={j.shoulder[0].x - 30} x1={j.shoulder[0].x + 8} top={j.shoulder[0].y + 5} />}
      {has('benchFoot') && <Bench x0={j.toe[1].x - 26} x1={j.toe[1].x + 12} top={Math.max(j.toe[1].y, j.ankle[1].y) + 4} />}
      {has('seat') && (
        <g>
          <line x1={j.hip.x} y1={j.hip.y + 8} x2={j.hip.x} y2={0} stroke={C.frame} strokeWidth={5} />
          <rect x={j.hip.x - 16} y={j.hip.y + 5} width={34} height={8} rx={3} fill={C.pad} />
          <line x1={j.hip.x - 12} y1={j.hip.y + 6} x2={j.hip.x - 12} y2={j.hip.y - 48} stroke={C.pad} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {has('legPress') && <LegPress j={j} />}
      {has('treadmill') && (
        <g>
          <rect x={-48} y={-7} width={96} height={8} rx={4} fill={C.frame} />
          <line x1={40} y1={-6} x2={30} y2={-95} stroke={C.frame} strokeWidth={4} strokeLinecap="round" />
          <line x1={30} y1={-95} x2={12} y2={-92} stroke={C.frame} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {has('bike') && (
        <g stroke={C.frame} strokeLinecap="round" fill="none">
          <circle cx={j.hip.x + 46} cy={-20} r={18} strokeWidth={5} />
          <line x1={j.hip.x} y1={j.hip.y + 8} x2={j.hip.x + 20} y2={-24} strokeWidth={5} />
          <line x1={j.hip.x + 20} y1={-24} x2={j.hip.x + 46} y2={-20} strokeWidth={5} />
          <line x1={j.hip.x + 46} y1={-20} x2={hands.x - 4} y2={hands.y + 6} strokeWidth={5} />
          <line x1={j.hip.x - 10} y1={j.hip.y + 6} x2={j.hip.x + 10} y2={j.hip.y + 6} stroke={C.pad} strokeWidth={7} />
          <line x1={j.hip.x - 20} y1={0} x2={j.hip.x + 70} y2={0} strokeWidth={5} />
        </g>
      )}
    </g>
  )
}

/** Prensa: respaldo inclinado y plataforma perpendicular a las espinillas */
function LegPress({ j }: { j: Joints }) {
  const sx = j.ankle[0].x - j.knee[0].x, sy = j.ankle[0].y - j.knee[0].y
  const len = Math.hypot(sx, sy) || 1
  const nx = -sy / len, ny = sx / len
  const c = { x: j.ankle[0].x + (sx / len) * 6, y: j.ankle[0].y + (sy / len) * 6 }
  return (
    <g>
      <line x1={j.hip.x + 4} y1={j.hip.y + 8} x2={j.neck.x + 6} y2={j.neck.y + 10} stroke={C.pad} strokeWidth={9} strokeLinecap="round" />
      <line x1={j.hip.x} y1={j.hip.y + 10} x2={j.hip.x} y2={0} stroke={C.frame} strokeWidth={5} />
      <line x1={j.hip.x - 10} y1={0} x2={c.x + 30} y2={c.y - 40} stroke={C.frame} strokeWidth={4} strokeLinecap="round" />
      <line x1={c.x - nx * 24} y1={c.y - ny * 24} x2={c.x + nx * 24} y2={c.y + ny * 24} stroke={C.iron} strokeWidth={6} strokeLinecap="round" />
    </g>
  )
}

/** Aparatos que quedan delante del cuerpo (lo que se agarra o empuja) */
function GymFront({ props, j, anim }: { props: string[]; j: Joints; anim: Anim }) {
  const has = (p: string) => props.includes(p)
  const hands = mid(j.hand[0], j.hand[1])
  return (
    <g>
      {has('barbell') && anim.view === 'side' && <Plate p={hands} />}
      {has('barbellHip') && <Plate p={{ x: j.hip.x + 2, y: j.hip.y - 10 }} />}
      {has('barbellBack') && <BackBar j={j} />}
      {has('pullupBar') && <circle cx={hands.x} cy={-HANG_Y} r={3.5} fill={C.iron} />}
      {anim.pulley && <line x1={hands.x - 9} y1={hands.y} x2={hands.x + 9} y2={hands.y} stroke={C.iron} strokeWidth={4} strokeLinecap="round" />}
      {has('legExtPad') && (
        <g>
          <line x1={j.knee[0].x} y1={j.knee[0].y} x2={j.ankle[0].x} y2={j.ankle[0].y} stroke={C.frame} strokeWidth={3} />
          <circle cx={j.ankle[0].x + 2} cy={j.ankle[0].y + 3} r={6} fill={C.pad} />
        </g>
      )}
      {has('legCurlPad') && <circle cx={j.ankle[0].x} cy={j.ankle[0].y - 6} r={6} fill={C.pad} />}
    </g>
  )
}
