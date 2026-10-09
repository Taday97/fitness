import { L, type Anim, type Pose } from './skeleton'

const STAND: Pose = { torso: 179, ua: [6, -4], fa: [12, 2], th: [2, -2], sh: [0, -1] }
const FSTAND: Pose = { torso: 180, ua: [8, 8], fa: [5, 5], th: [5, 5], sh: [3, 3] }
const PLANK_HIGH: Pose = { torso: 115.5, ua: [0, 0], fa: [0, 0], th: [-64.5, -64.5], sh: [-64.5, -64.5] }
const QUAD: Pose = { torso: 108.5, head: 8, ua: [0, 0], fa: [0, 0], th: [0, 0], sh: [-90, -90], foot: [-90, -90] }
const BRIDGE_DOWN: Pose = { torso: -90, ua: [90, 90], fa: [90, 90], th: [145, 145], sh: [29, 29] }
const BRIDGE_UP: Pose = { torso: -70, ua: [110, 110], fa: [110, 110], th: [110, 110], sh: [10, 10] }
const SQUAT_DOWN: Pose = { torso: 145, ua: [85, 85], fa: [88, 88], th: [82, 82], sh: [-38, -38] }

const with_ = (p: Pose, o: Partial<Pose>): Pose => ({ ...p, ...o })
const hold = (p: Pose, ms: number) => ({ pose: p, ms })

/** Ángulos de muslo y espinilla para llevar el tobillo a (x, y) desde la cadera, con la rodilla hacia delante. */
function legIK(x: number, y: number): [number, number] {
  const deg = (r: number) => (r * 180) / Math.PI
  const d = Math.min(Math.hypot(x, y), L.th + L.sh - 0.5)
  const toTarget = deg(Math.atan2(x, y))
  const atHip = deg(Math.acos((L.th ** 2 + d ** 2 - L.sh ** 2) / (2 * L.th * d)))
  const th = toTarget + atHip
  const kx = Math.sin((th * Math.PI) / 180) * L.th, ky = Math.cos((th * Math.PI) / 180) * L.th
  return [th, deg(Math.atan2(x - kx, y - ky))]
}

/** Sentadilla búlgara: pie delantero en el suelo y empeine trasero en el banco, fijos; la cadera baja a la altura h. */
function splitSquat(h: number, torso: number): Pose {
  const front = legIK(18, h - 6)
  const rear = legIK(-52, h - 44)
  return { torso, ua: [2, -2], fa: [2, -2], th: [front[0], rear[0]], sh: [front[1], rear[1]], foot: [front[1] + 90, -92], raise: h }
}

/** Pedaleo: los tobillos recorren un círculo alrededor del eje de la biela (piernas en contrafase). */
function pedal(upper: Pick<Pose, 'torso' | 'ua' | 'fa'>, crank: { x: number; y: number }, r: number, ms: number) {
  const n = 8
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI
    const near = legIK(crank.x + Math.sin(a) * r, crank.y + Math.cos(a) * r)
    const far = legIK(crank.x - Math.sin(a) * r, crank.y - Math.cos(a) * r)
    return hold({ ...upper, th: [near[0], far[0]], sh: [near[1], far[1]], foot: [near[1] + 90, far[1] + 90] }, ms)
  })
}

const lunge = (dumbbells = false): Anim => {
  const arms = dumbbells ? { ua: [2, -2] as [number, number], fa: [2, -2] as [number, number] } : {}
  const A = with_(STAND, { ...arms })
  return {
    view: 'side', anchor: 'hip', props: dumbbells ? ['dumbbells'] : undefined, repFrames: 2,
    frames: [
      hold(A, 700),
      hold(with_(A, { th: [85, -15], sh: [-5, -85] }), 700),
      hold(A, 700),
      hold(with_(A, { th: [-15, 85], sh: [-85, -5] }), 700),
    ],
  }
}

const sideBend: Anim = {
  view: 'front', anchor: 'feet',
  frames: [
    hold(with_(FSTAND, { torso: 166, ua: [-150, 10], fa: [-128, 5], th: [6, 6], sh: [4, 4] }), 600),
    hold(with_(FSTAND, { torso: 166, ua: [-150, 10], fa: [-128, 5], th: [6, 6], sh: [4, 4] }), 900),
    hold(with_(FSTAND, { torso: 194, ua: [10, -150], fa: [5, -128], th: [6, 6], sh: [4, 4] }), 600),
    hold(with_(FSTAND, { torso: 194, ua: [10, -150], fa: [5, -128], th: [6, 6], sh: [4, 4] }), 900),
  ],
}

const hinge = (dumbbells: boolean): Anim => ({
  view: 'side', anchor: 'feet', props: dumbbells ? ['dumbbells'] : undefined,
  frames: dumbbells
    ? [
        hold(with_(STAND, { ua: [2, -2], fa: [2, -2] }), 1100),
        hold({ torso: 100, head: -10, ua: [0, -3], fa: [0, -3], th: [15, 15], sh: [-5, -5] }, 1100),
      ]
    : [
        hold(with_(STAND, { ua: [20, 20], fa: [160, 160] }), 1000),
        hold({ torso: 100, head: -10, ua: [-60, -60], fa: [80, 80], th: [15, 15], sh: [-5, -5] }, 1000),
      ],
})

export const ANIMS: Record<string, Anim> = {
  // ---------- Calentamiento / cardio ----------
  jumping_jacks: {
    view: 'front', anchor: 'feet',
    frames: [
      hold(FSTAND, 380),
      hold({ torso: 180, ua: [155, 155], fa: [172, 172], th: [20, 20], sh: [18, 18], lift: 5 }, 380),
    ],
  },
  arm_circles: {
    view: 'side', anchor: 'feet',
    frames: [0, 90, 180, 270, 360].map((a, i) =>
      hold(with_(STAND, { ua: [a, a], fa: [a, a] }), i === 4 ? 0 : 380),
    ),
  },
  march: {
    view: 'side', anchor: 'hip', repFrames: 2,
    frames: [
      hold({ torso: 179, ua: [-25, 30], fa: [60, 115], th: [65, -2], sh: [-10, 0] }, 480),
      hold({ torso: 179, ua: [30, -25], fa: [115, 60], th: [-2, 65], sh: [0, -10] }, 480),
    ],
  },
  high_knees: {
    view: 'side', anchor: 'hip', repFrames: 2,
    frames: [
      hold({ torso: 176, ua: [-35, 45], fa: [55, 135], th: [88, -2], sh: [-5, 0], lift: 3 }, 260),
      hold({ torso: 176, ua: [45, -35], fa: [135, 55], th: [-2, 88], sh: [0, -5], lift: 3 }, 260),
    ],
  },
  good_morning: hinge(false),
  side_bend: sideBend,
  leg_swings: {
    view: 'side', anchor: 'farFoot',
    frames: [
      hold({ torso: 178, ua: [-30, 75], fa: [-20, 82], th: [55, 0], sh: [50, 0] }, 650),
      hold({ torso: 182, ua: [35, 75], fa: [45, 82], th: [-38, 0], sh: [-38, 0] }, 650),
    ],
  },
  cat_cow: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold(with_(QUAD, { head: 30, torso: 111 }), 1400),
      hold(with_(QUAD, { head: -35, torso: 106 }), 1400),
    ],
  },
  shadow_boxing: {
    view: 'side', anchor: 'hip', repFrames: 4,
    frames: [
      hold({ torso: 174, ua: [30, 20], fa: [165, 160], th: [10, -10], sh: [-2, -6] }, 200),
      hold({ torso: 168, ua: [90, 20], fa: [90, 160], th: [10, -10], sh: [-2, -6] }, 250),
      hold({ torso: 174, ua: [30, 20], fa: [165, 160], th: [10, -10], sh: [-2, -6] }, 200),
      hold({ torso: 168, ua: [30, 88], fa: [165, 90], th: [10, -10], sh: [-2, -6] }, 250),
    ],
  },
  mountain_climbers: {
    view: 'side', anchor: 'hands', props: ['mat'], repFrames: 2,
    frames: [
      hold(with_(PLANK_HIGH, { th: [40, -64.5], sh: [-60, -64.5] }), 260),
      hold(with_(PLANK_HIGH, { th: [-64.5, 40], sh: [-64.5, -60] }), 260),
    ],
  },
  burpees: {
    view: 'side', anchor: 'hands',
    frames: [
      hold(with_(STAND, { ua: [0, 0], fa: [0, 0] }), 380),
      hold({ torso: 118, ua: [12, 12], fa: [6, 6], th: [108, 108], sh: [-30, -30] }, 320),
      hold(PLANK_HIGH, 400),
      hold({ torso: 118, ua: [12, 12], fa: [6, 6], th: [108, 108], sh: [-30, -30] }, 320),
      hold({ torso: 180, ua: [172, 172], fa: [178, 178], th: [0, 0], sh: [0, 0], foot: [35, 35], lift: 18 }, 380),
    ],
  },
  squat_jumps: {
    view: 'side', anchor: 'feet',
    frames: [
      hold(with_(SQUAT_DOWN, { ua: [-40, -40], fa: [-30, -30] }), 380),
      hold({ torso: 180, ua: [160, 160], fa: [170, 170], th: [0, 0], sh: [0, 0], foot: [30, 30], lift: 22 }, 300),
      hold(with_(STAND, { ua: [40, 40], fa: [60, 60] }), 320),
    ],
  },

  // ---------- Fuerza peso corporal ----------
  squat: {
    view: 'side', anchor: 'feet',
    frames: [hold(with_(STAND, { ua: [20, 18], fa: [30, 25] }), 1000), hold(SQUAT_DOWN, 1000)],
  },
  sumo_squat: {
    view: 'front', anchor: 'feet',
    frames: [
      hold({ torso: 180, ua: [20, 20], fa: [-120, -120], th: [28, 28], sh: [18, 18] }, 1000),
      hold({ torso: 180, ua: [20, 20], fa: [-120, -120], th: [62, 62], sh: [-7, -7] }, 1000),
    ],
  },
  lunges: lunge(false),
  side_lunges: {
    view: 'front', anchor: 'hip', repFrames: 2,
    frames: [
      hold({ torso: 180, ua: [20, 20], fa: [-120, -120], th: [10, 10], sh: [8, 8] }, 700),
      hold({ torso: 190, ua: [20, 20], fa: [-120, -120], th: [75, 53], sh: [-15, 53] }, 700),
      hold({ torso: 180, ua: [20, 20], fa: [-120, -120], th: [10, 10], sh: [8, 8] }, 700),
      hold({ torso: 170, ua: [20, 20], fa: [-120, -120], th: [53, 75], sh: [53, -15] }, 700),
    ],
  },
  glute_bridge: {
    view: 'side', anchor: 'feet', props: ['mat'],
    frames: [hold(BRIDGE_DOWN, 1000), hold(BRIDGE_UP, 1000)],
  },
  pushups: {
    view: 'side', anchor: 'feet', props: ['mat'],
    frames: [
      hold(PLANK_HIGH, 1000),
      hold({ torso: 100, ua: [-60, -60], fa: [44, 44], th: [-80, -80], sh: [-80, -80] }, 1000),
    ],
  },
  knee_pushups: {
    view: 'side', anchor: 'feet', props: ['mat'],
    frames: [
      hold({ torso: 126.5, ua: [0, 0], fa: [0, 0], th: [-53.5, -53.5], sh: [-100, -100], foot: [-100, -100] }, 1000),
      hold({ torso: 108, ua: [-60, -60], fa: [36, 36], th: [-72, -72], sh: [-100, -100], foot: [-100, -100] }, 1000),
    ],
  },
  plank: {
    view: 'side', anchor: 'feet', props: ['mat'],
    frames: [
      hold({ torso: 103, ua: [0, 0], fa: [90, 90], th: [-77, -77], sh: [-77, -77] }, 1600),
      hold({ torso: 104, ua: [0, 0], fa: [90, 90], th: [-76, -76], sh: [-76, -76] }, 1600),
    ],
  },
  crunches: {
    view: 'side', anchor: 'feet', props: ['mat'],
    frames: [
      hold({ torso: -90, ua: [-150, -150], fa: [4, 4], th: [145, 145], sh: [29, 29] }, 900),
      hold({ torso: -118, ua: [-178, -178], fa: [-24, -24], th: [145, 145], sh: [29, 29] }, 900),
    ],
  },
  leg_raises: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: -90, ua: [90, 90], fa: [90, 90], th: [96, 96], sh: [96, 96] }, 1100),
      hold({ torso: -90, ua: [90, 90], fa: [90, 90], th: [172, 172], sh: [172, 172] }, 1100),
    ],
  },
  superman: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: 90, ua: [90, 90], fa: [90, 90], th: [-90, -90], sh: [-90, -90], foot: [-90, -90] }, 1000),
      hold({ torso: 104, head: 4, ua: [108, 108], fa: [110, 110], th: [-104, -104], sh: [-106, -106], foot: [-106, -106] }, 1000),
    ],
  },
  donkey_kicks: {
    view: 'side', anchor: 'hands', props: ['mat'],
    frames: [hold(QUAD, 550), hold(with_(QUAD, { th: [-100, 0], sh: [175, -90], foot: [-95, -90] }), 550)],
  },
  bird_dog: {
    view: 'side', anchor: 'hip', props: ['mat'], repFrames: 4,
    frames: [
      hold(QUAD, 600),
      hold(with_(QUAD, { ua: [95, 0], fa: [95, 0], th: [0, -95], sh: [-90, -95], foot: [-90, -95] }), 900),
      hold(QUAD, 600),
      hold(with_(QUAD, { ua: [0, 95], fa: [0, 95], th: [-95, 0], sh: [-95, -90], foot: [-95, -90] }), 900),
    ],
  },
  dead_bug: {
    view: 'side', anchor: 'hip', props: ['mat'], repFrames: 4,
    frames: [
      hold({ torso: -90, ua: [180, 180], fa: [180, 180], th: [180, 180], sh: [90, 90] }, 600),
      hold({ torso: -90, ua: [-95, 180], fa: [-95, 180], th: [180, 100], sh: [90, 100] }, 800),
      hold({ torso: -90, ua: [180, 180], fa: [180, 180], th: [180, 180], sh: [90, 90] }, 600),
      hold({ torso: -90, ua: [180, -95], fa: [180, -95], th: [100, 180], sh: [100, 90] }, 800),
    ],
  },
  wall_sit: {
    view: 'side', anchor: 'feet', props: ['wall'],
    frames: [
      hold({ torso: 180, ua: [25, 25], fa: [88, 88], th: [90, 90], sh: [0, 0] }, 1500),
      hold({ torso: 180, ua: [25, 25], fa: [86, 86], th: [89, 89], sh: [0, 0] }, 1500),
    ],
  },
  calf_raises: {
    view: 'side', anchor: 'feet',
    frames: [hold(STAND, 700), hold(with_(STAND, { foot: [35, 35] }), 700)],
  },
  tricep_dips: {
    view: 'side', anchor: 'feet', props: ['chair'],
    frames: [
      hold({ torso: 180, ua: [-12, -12], fa: [-5, -5], th: [70, 70], sh: [0, 0] }, 1000),
      hold({ torso: 178, ua: [-60, -60], fa: [32, 32], th: [92, 92], sh: [0, 0] }, 1000),
    ],
  },

  // ---------- Mancuernas ----------
  db_goblet_squat: {
    view: 'side', anchor: 'feet', props: ['dumbbell'],
    frames: [
      hold(with_(STAND, { ua: [20, 20], fa: [160, 160] }), 1000),
      hold(with_(SQUAT_DOWN, { ua: [-15, -15], fa: [125, 125] }), 1000),
    ],
  },
  db_sumo_squat: {
    view: 'front', anchor: 'feet', props: ['dumbbell'],
    frames: [
      hold({ torso: 180, ua: [-10, -10], fa: [-12, -12], th: [28, 28], sh: [18, 18] }, 1000),
      hold({ torso: 180, ua: [-10, -10], fa: [-12, -12], th: [62, 62], sh: [-7, -7] }, 1000),
    ],
  },
  db_rdl: hinge(true),
  db_lunges: lunge(true),
  db_hip_thrust: {
    view: 'side', anchor: 'feet', props: ['dumbbell', 'mat'],
    frames: [hold(BRIDGE_DOWN, 1000), hold(BRIDGE_UP, 1000)],
  },
  db_shoulder_press: {
    view: 'front', anchor: 'feet', props: ['dumbbells'],
    frames: [
      hold(with_(FSTAND, { ua: [82, 82], fa: [172, 172] }), 900),
      hold(with_(FSTAND, { ua: [162, 162], fa: [175, 175] }), 900),
    ],
  },
  db_curl: {
    view: 'side', anchor: 'feet', props: ['dumbbells'],
    frames: [hold(with_(STAND, { ua: [4, 2], fa: [6, 4] }), 900), hold(with_(STAND, { ua: [8, 6], fa: [150, 148] }), 900)],
  },
  db_row: {
    view: 'side', anchor: 'feet', props: ['dumbbells'],
    frames: [
      hold({ torso: 115, head: 12, ua: [0, -2], fa: [0, -2], th: [18, 18], sh: [-8, -8] }, 900),
      hold({ torso: 115, head: 12, ua: [-100, -102], fa: [0, -2], th: [18, 18], sh: [-8, -8] }, 900),
    ],
  },
  db_lateral_raise: {
    view: 'front', anchor: 'feet', props: ['dumbbells'],
    frames: [hold(with_(FSTAND, { ua: [8, 8], fa: [8, 8] }), 900), hold(with_(FSTAND, { ua: [85, 85], fa: [88, 88] }), 900)],
  },

  // ---------- Gimnasio ----------
  treadmill_walk: {
    view: 'side', anchor: 'hip', props: ['treadmill'], repFrames: 2,
    frames: [
      hold({ torso: 178, ua: [-25, 25], fa: [-5, 55], th: [25, -20], sh: [-5, -30], raise: 7 }, 450),
      hold({ torso: 178, ua: [25, -25], fa: [55, -5], th: [-20, 25], sh: [-30, -5], raise: 7 }, 450),
    ],
  },
  stationary_bike: {
    view: 'side', hipY: 70, props: ['bike'], repFrames: 8,
    frames: pedal({ torso: 150, ua: [62, 62], fa: [95, 95] }, { x: 20, y: 46 }, 13, 140),
  },
  barbell_squat: {
    view: 'side', anchor: 'feet', props: ['barbellBack'],
    frames: [
      hold(with_(STAND, { ua: [-50, -50], fa: [160, 160] }), 1100),
      hold(with_(SQUAT_DOWN, { torso: 140, ua: [-89, -89], fa: [121, 121] }), 1100),
    ],
  },
  barbell_deadlift: {
    view: 'side', anchor: 'feet', props: ['barbell'],
    frames: [
      hold({ torso: 128, head: -8, ua: [-6, -6], fa: [-6, -6], th: [72, 72], sh: [-28, -28] }, 1200),
      hold(with_(STAND, { ua: [2, 2], fa: [2, 2] }), 1200),
    ],
  },
  bench_press: {
    view: 'side', hipY: 45, props: ['bench', 'barbell'],
    frames: [
      hold({ torso: -90, ua: [180, 180], fa: [180, 180], th: [70, 70], sh: [-5, -5] }, 1000),
      hold({ torso: -90, ua: [80, 80], fa: [176, 176], th: [70, 70], sh: [-5, -5] }, 1000),
    ],
  },
  db_bench_press: {
    view: 'side', hipY: 45, props: ['bench', 'dumbbells'],
    frames: [
      hold({ torso: -90, ua: [180, 180], fa: [180, 180], th: [70, 70], sh: [-5, -5] }, 1000),
      hold({ torso: -90, ua: [80, 80], fa: [176, 176], th: [70, 70], sh: [-5, -5] }, 1000),
    ],
  },
  barbell_ohp: {
    view: 'front', anchor: 'feet', props: ['barbell'],
    frames: [
      hold(with_(FSTAND, { ua: [38, 38], fa: [176, 176] }), 1000),
      hold(with_(FSTAND, { ua: [160, 160], fa: [176, 176] }), 1000),
    ],
  },
  lat_pulldown: {
    view: 'side', hipY: 40, props: ['seat'], pulley: { x: 0, y: -178 },
    frames: [
      hold({ torso: 186, ua: [172, 172], fa: [178, 178], th: [88, 88], sh: [-5, -5] }, 1000),
      hold({ torso: 192, ua: [-12, -12], fa: [158, 158], th: [88, 88], sh: [-5, -5] }, 1000),
    ],
  },
  seated_cable_row: {
    view: 'side', hipY: 18, props: ['seat'], pulley: { x: 105, y: -62 },
    frames: [
      hold({ torso: 168, ua: [90, 90], fa: [90, 90], th: [100, 100], sh: [78, 78] }, 1000),
      hold({ torso: 184, ua: [-40, -40], fa: [95, 95], th: [100, 100], sh: [78, 78] }, 1000),
    ],
  },
  leg_press: {
    view: 'side', hipY: 30, props: ['legPress'],
    frames: [
      hold({ torso: -128, ua: [-20, -20], fa: [50, 50], th: [128, 128], sh: [128, 128] }, 1100),
      hold({ torso: -128, ua: [-20, -20], fa: [50, 50], th: [172, 172], sh: [95, 95] }, 1100),
    ],
  },
  leg_extension: {
    view: 'side', hipY: 45, props: ['seat', 'legExtPad'],
    frames: [
      hold({ torso: 182, ua: [5, 5], fa: [60, 60], th: [90, 90], sh: [5, 5] }, 1000),
      hold({ torso: 182, ua: [5, 5], fa: [60, 60], th: [90, 90], sh: [88, 88] }, 1000),
    ],
  },
  leg_curl: {
    view: 'side', hipY: 40, props: ['bench', 'legCurlPad'],
    frames: [
      hold({ torso: 90, head: 10, ua: [70, 70], fa: [100, 100], th: [-90, -90], sh: [-90, -90], foot: [-180, -180] }, 1000),
      hold({ torso: 90, head: 10, ua: [70, 70], fa: [100, 100], th: [-92, -92], sh: [170, 170], foot: [80, 80] }, 1000),
    ],
  },
  pullups: {
    view: 'side', anchor: 'hang', props: ['pullupBar'],
    frames: [
      hold({ torso: 180, ua: [180, 180], fa: [180, 180], th: [8, 8], sh: [-30, -30] }, 1100),
      hold({ torso: 174, head: -6, ua: [22, 22], fa: [168, 168], th: [12, 12], sh: [-35, -35] }, 1100),
    ],
  },
  hanging_knee_raise: {
    view: 'side', anchor: 'hang', props: ['pullupBar'],
    frames: [
      hold({ torso: 180, ua: [180, 180], fa: [180, 180], th: [2, 2], sh: [-8, -8] }, 1000),
      hold({ torso: 184, ua: [180, 180], fa: [180, 180], th: [100, 100], sh: [5, 5] }, 1000),
    ],
  },
  barbell_row: {
    view: 'side', anchor: 'feet', props: ['barbell'],
    frames: [
      hold({ torso: 112, head: 12, ua: [0, 0], fa: [0, 0], th: [20, 20], sh: [-12, -12] }, 900),
      hold({ torso: 112, head: 12, ua: [-75, -75], fa: [15, 15], th: [20, 20], sh: [-12, -12] }, 900),
    ],
  },
  cable_pushdown: {
    view: 'side', anchor: 'feet', pulley: { x: 44, y: -178 },
    frames: [
      hold({ torso: 172, ua: [4, 4], fa: [148, 148], th: [4, 0], sh: [-4, -2] }, 900),
      hold({ torso: 172, ua: [4, 4], fa: [12, 12], th: [4, 0], sh: [-4, -2] }, 900),
    ],
  },
  barbell_hip_thrust: {
    view: 'side', anchor: 'feet', props: ['benchBack', 'barbellHip'],
    frames: [
      hold({ torso: -122, head: 20, ua: [58, 58], fa: [58, 58], th: [118, 118], sh: [-2, -2] }, 1000),
      hold({ torso: -92, head: 30, ua: [88, 88], fa: [88, 88], th: [92, 92], sh: [-4, -4] }, 1000),
    ],
  },
  bulgarian_split_squat: {
    view: 'side', hipY: 0, props: ['benchFoot', 'dumbbells'],
    frames: [hold(splitSquat(66, 178), 1000), hold(splitSquat(40, 168), 1000)],
  },

  // ---------- Estiramientos ----------
  stretch_quad: {
    view: 'side', anchor: 'farFoot',
    frames: [
      hold({ torso: 180, ua: [-25, 85], fa: [-8, 88], th: [-15, 0], sh: [-170, 0] }, 1800),
      hold({ torso: 182, ua: [-27, 88], fa: [-10, 90], th: [-18, 0], sh: [-172, 0] }, 1800),
    ],
  },
  stretch_hamstring: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: 130, head: 10, ua: [100, 100], fa: [95, 95], th: [90, 90], sh: [90, 90] }, 1800),
      hold({ torso: 118, head: 10, ua: [92, 92], fa: [90, 90], th: [90, 90], sh: [90, 90] }, 1800),
    ],
  },
  toe_touch: {
    view: 'side', anchor: 'feet',
    frames: [
      hold({ torso: 40, head: 0, ua: [5, 5], fa: [5, 5], th: [10, 10], sh: [-8, -8] }, 1800),
      hold({ torso: 28, head: 0, ua: [8, 8], fa: [8, 8], th: [12, 12], sh: [-10, -10] }, 1800),
    ],
  },
  child_pose: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: 78, head: -5, ua: [88, 88], fa: [90, 90], th: [68, 68], sh: [-90, -90], foot: [-90, -90] }, 2000),
      hold({ torso: 81, head: -5, ua: [88, 88], fa: [90, 90], th: [68, 68], sh: [-90, -90], foot: [-90, -90] }, 2000),
    ],
  },
  cobra: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: 118, head: 12, ua: [-5, -5], fa: [90, 90], th: [-90, -90], sh: [-90, -90], foot: [-90, -90] }, 2000),
      hold({ torso: 123, head: 22, ua: [-8, -8], fa: [90, 90], th: [-90, -90], sh: [-90, -90], foot: [-90, -90] }, 2000),
    ],
  },
  hip_flexor_stretch: {
    view: 'side', anchor: 'hip', props: ['mat'],
    frames: [
      hold({ torso: 182, ua: [178, 178], fa: [180, 180], th: [88, -25], sh: [-12, -90], foot: [78, -90] }, 2000),
      hold({ torso: 186, ua: [182, 182], fa: [186, 186], th: [94, -30], sh: [-18, -90], foot: [72, -90] }, 2000),
    ],
  },
  chest_opener: {
    view: 'side', anchor: 'feet',
    frames: [
      hold({ torso: 182, head: -8, ua: [-30, -30], fa: [-15, -15], th: [2, -2], sh: [0, 0] }, 2000),
      hold({ torso: 185, head: -14, ua: [-42, -42], fa: [-28, -28], th: [2, -2], sh: [0, 0] }, 2000),
    ],
  },
  side_stretch: sideBend,
}

export type AnimKey = keyof typeof ANIMS
