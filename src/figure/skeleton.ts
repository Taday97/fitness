// Motor del muñeco: cinemática directa 2D a partir de ángulos absolutos.
// Convención de ángulos (grados): 0 = hacia abajo, 90 = hacia delante (derecha en pantalla),
// 180 = hacia arriba, -90 = hacia atrás. Índice 0 = extremidad cercana, 1 = lejana.

export type Pair = [number, number]

export interface Pose {
  torso: number // dirección cadera -> cuello
  head?: number // inclinación de la cabeza respecto al torso
  ua: Pair // brazo (hombro -> codo)
  fa: Pair // antebrazo (codo -> mano)
  th: Pair // muslo (cadera -> rodilla)
  sh: Pair // espinilla (rodilla -> tobillo)
  foot?: Pair // dirección del pie (por defecto sh + 90)
  lift?: number // elevar del suelo (saltos)
}

export type View = 'side' | 'front'
export type Anchor = 'feet' | 'hands' | 'hip' | 'nearFoot' | 'farFoot'
export type Prop = 'dumbbells' | 'dumbbell' | 'chair' | 'wall' | 'mat'

export interface Frame {
  pose: Pose
  ms: number // duración de la transición hacia el siguiente fotograma
}

export interface Anim {
  view: View
  anchor?: Anchor
  props?: Prop[]
  frames: Frame[]
  /** fotogramas por repetición (para contar en voz alta); por defecto todos */
  repFrames?: number
}

export const L = { torso: 50, head: 9, ua: 25, fa: 23, th: 34, sh: 32, foot: 9 }

export type Pt = { x: number; y: number }

export interface Joints {
  hip: Pt
  neck: Pt
  head: Pt
  shoulder: [Pt, Pt]
  elbow: [Pt, Pt]
  hand: [Pt, Pt]
  hipJ: [Pt, Pt]
  knee: [Pt, Pt]
  ankle: [Pt, Pt]
  toe: [Pt, Pt]
}

const rad = (d: number) => (d * Math.PI) / 180
const add = (p: Pt, a: number, len: number, mirror = false): Pt => ({
  x: p.x + (mirror ? -1 : 1) * Math.sin(rad(a)) * len,
  y: p.y + Math.cos(rad(a)) * len,
})

export function solve(p: Pose, view: View, anchor: Anchor = 'feet'): Joints {
  const hip: Pt = { x: 0, y: 0 }
  const neck = add(hip, p.torso, L.torso)
  const shoulderBase = add(hip, p.torso, L.torso - 3)
  const head = add(neck, p.torso + (p.head ?? 0), L.head + 2)
  const front = view === 'front'
  // En vista frontal el índice 0 se dibuja a la izquierda de la pantalla con ángulos espejados.
  const mir = (i: number) => front && i === 0
  // Desplazamiento perpendicular al torso (hombros y caderas acompañan la inclinación).
  const px = -Math.cos(rad(p.torso)), py = Math.sin(rad(p.torso))
  const offAlong = (base: Pt, i: number, w: number): Pt => {
    if (!front) return base
    const s = i === 0 ? -w : w
    return { x: base.x + px * s, y: base.y + py * s }
  }
  const shoulder: [Pt, Pt] = [offAlong(shoulderBase, 0, 11), offAlong(shoulderBase, 1, 11)]
  const hipJ: [Pt, Pt] = [offAlong(hip, 0, 7), offAlong(hip, 1, 7)]
  const elbow = [0, 1].map((i) => add(shoulder[i], p.ua[i], L.ua, mir(i))) as [Pt, Pt]
  const hand = [0, 1].map((i) => add(elbow[i], p.fa[i], L.fa, mir(i))) as [Pt, Pt]
  const knee = [0, 1].map((i) => add(hipJ[i], p.th[i], L.th, mir(i))) as [Pt, Pt]
  const ankle = [0, 1].map((i) => add(knee[i], p.sh[i], L.sh, mir(i))) as [Pt, Pt]
  const toe = [0, 1].map((i) => {
    const fd = p.foot ? p.foot[i] : front ? 90 : p.sh[i] + 90
    return add(ankle[i], fd, front ? 5 : L.foot, mir(i))
  }) as [Pt, Pt]

  const j: Joints = { hip, neck, head, shoulder, elbow, hand, hipJ, knee, ankle, toe }

  // Apoyar en el suelo: el punto más bajo toca y = 0.
  const pts = allPoints(j)
  // +5 = medio grosor del trazo, para que el cuerpo "apoye" sobre el suelo
  const maxY = Math.max(...pts.map((q) => q.y + 5), head.y + L.head)
  let dy = -maxY - (p.lift ?? 0)
  let dx = 0
  const avg = (a: Pt, b: Pt) => (a.x + b.x) / 2
  if (anchor === 'feet') dx = -avg(ankle[0], ankle[1])
  else if (anchor === 'hands') dx = -avg(hand[0], hand[1])
  else if (anchor === 'nearFoot') dx = -ankle[0].x
  else if (anchor === 'farFoot') dx = -ankle[1].x
  return translate(j, dx, dy)
}

export function allPoints(j: Joints): Pt[] {
  return [
    j.hip, j.neck,
    ...j.shoulder, ...j.elbow, ...j.hand, ...j.hipJ, ...j.knee, ...j.ankle, ...j.toe,
  ]
}

function translate(j: Joints, dx: number, dy: number): Joints {
  const t = (p: Pt): Pt => ({ x: p.x + dx, y: p.y + dy })
  const t2 = (a: [Pt, Pt]): [Pt, Pt] => [t(a[0]), t(a[1])]
  return {
    hip: t(j.hip), neck: t(j.neck), head: t(j.head),
    shoulder: t2(j.shoulder), elbow: t2(j.elbow), hand: t2(j.hand),
    hipJ: t2(j.hipJ), knee: t2(j.knee), ankle: t2(j.ankle), toe: t2(j.toe),
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpPair = (a: Pair, b: Pair, t: number): Pair => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const fa: Pair = a.foot ?? [a.sh[0] + 90, a.sh[1] + 90]
  const fb: Pair = b.foot ?? [b.sh[0] + 90, b.sh[1] + 90]
  return {
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? 0, b.head ?? 0, t),
    ua: lerpPair(a.ua, b.ua, t),
    fa: lerpPair(a.fa, b.fa, t),
    th: lerpPair(a.th, b.th, t),
    sh: lerpPair(a.sh, b.sh, t),
    foot: a.foot || b.foot ? lerpPair(fa, fb, t) : undefined,
    lift: lerp(a.lift ?? 0, b.lift ?? 0, t),
  }
}

export const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

export function cycleMs(anim: Anim) {
  return anim.frames.reduce((s, f) => s + f.ms, 0)
}

/** Pose en el instante `ms` (en bucle). */
export function poseAt(anim: Anim, ms: number): Pose {
  const total = cycleMs(anim)
  let t = ((ms % total) + total) % total
  for (let i = 0; i < anim.frames.length; i++) {
    const f = anim.frames[i]
    if (t <= f.ms) {
      const next = anim.frames[(i + 1) % anim.frames.length]
      return lerpPose(f.pose, next.pose, ease(f.ms === 0 ? 1 : t / f.ms))
    }
    t -= f.ms
  }
  return anim.frames[0].pose
}

/** Caja que contiene todos los fotogramas clave (para el viewBox). */
export function bounds(anim: Anim) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity
  const steps = 24
  const total = cycleMs(anim)
  for (let s = 0; s < steps; s++) {
    const j = solve(poseAt(anim, (total * s) / steps), anim.view, anim.anchor)
    for (const p of [...allPoints(j)]) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y)
    }
    minX = Math.min(minX, j.head.x - L.head); maxX = Math.max(maxX, j.head.x + L.head)
    minY = Math.min(minY, j.head.y - L.head)
  }
  if (anim.props?.includes('wall')) minX -= 10
  if (anim.props?.includes('chair')) minX -= 40
  return { minX, maxX, minY }
}
