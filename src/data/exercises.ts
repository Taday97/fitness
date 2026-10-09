import type { Exercise } from '../types'

// Catálogo de ejercicios para casa. Cada uno tiene su animación del muñeco.
// La IA solo puede elegir ejercicios de esta lista (así siempre hay animación).
export const EXERCISES: Exercise[] = [
  // ---------- Calentamiento ----------
  {
    id: 'jumping_jacks', name: 'Jumping jacks', anim: 'jumping_jacks', category: 'warmup', kind: 'time',
    muscles: 'Cuerpo completo · Cardio', met: 8,
    steps: ['Empieza de pie con los pies juntos y los brazos a los lados.', 'Salta abriendo piernas y subiendo los brazos por encima de la cabeza.', 'Vuelve a la posición inicial con otro salto y repite a ritmo constante.'],
    tip: 'Aterriza suave sobre la punta de los pies. Si quieres menos impacto, abre una pierna cada vez sin saltar.',
  },
  {
    id: 'arm_circles', name: 'Círculos de brazos', anim: 'arm_circles', category: 'warmup', kind: 'time',
    muscles: 'Hombros · Movilidad', met: 3,
    steps: ['De pie, brazos extendidos.', 'Dibuja círculos grandes y controlados con los brazos.', 'A mitad de tiempo cambia el sentido.'],
    tip: 'Mantén el abdomen activo y los hombros lejos de las orejas.',
  },
  {
    id: 'march', name: 'Marcha en el sitio', anim: 'march', category: 'warmup', kind: 'time',
    muscles: 'Piernas · Cardio suave', met: 3.5,
    steps: ['De pie, espalda recta.', 'Sube una rodilla hasta la altura de la cadera mientras mueves el brazo contrario.', 'Alterna piernas a ritmo cómodo.'],
    tip: 'Ideal para entrar en calor sin impacto.',
  },
  {
    id: 'good_morning', name: 'Bisagra de cadera', anim: 'good_morning', category: 'warmup', kind: 'reps',
    muscles: 'Isquios · Glúteos · Espalda baja', met: 3.5,
    steps: ['De pie, pies al ancho de caderas, manos en el pecho.', 'Lleva la cadera hacia atrás inclinando el torso con la espalda recta.', 'Vuelve a subir apretando glúteos.'],
    tip: 'Rodillas ligeramente flexionadas; el movimiento sale de la cadera, no de la espalda.',
  },
  {
    id: 'side_bend', name: 'Inclinaciones laterales', anim: 'side_bend', category: 'warmup', kind: 'time',
    muscles: 'Oblicuos · Movilidad', met: 2.5,
    steps: ['De pie, pies al ancho de caderas.', 'Eleva un brazo e inclínate hacia el lado contrario.', 'Alterna lados de forma fluida.'],
    tip: 'No gires el torso: inclínate como si estuvieras entre dos paredes.',
  },
  {
    id: 'leg_swings', name: 'Balanceo de pierna', anim: 'leg_swings', category: 'warmup', kind: 'reps', perSide: true,
    muscles: 'Cadera · Isquios · Flexores', met: 3,
    steps: ['Apóyate en una pared o silla con una mano.', 'Balancea la pierna hacia delante y atrás de forma controlada.', 'Cambia de pierna al terminar.'],
    tip: 'Aumenta el rango poco a poco, sin forzar.',
  },
  {
    id: 'cat_cow', name: 'Gato-vaca', anim: 'cat_cow', category: 'warmup', kind: 'time', equipment: 'mat',
    muscles: 'Columna · Movilidad', met: 2.5,
    steps: ['Colócate en cuadrupedia: manos bajo hombros, rodillas bajo caderas.', 'Inhala mirando al frente y arquea la espalda (vaca).', 'Exhala redondeando la espalda y mirando al ombligo (gato).'],
    tip: 'Sincroniza el movimiento con la respiración.',
  },

  // ---------- Cardio ----------
  {
    id: 'high_knees', name: 'Rodillas arriba', anim: 'high_knees', category: 'cardio', kind: 'time',
    muscles: 'Piernas · Core · Cardio', met: 8,
    steps: ['De pie, brazos en posición de carrera.', 'Corre en el sitio subiendo las rodillas a la altura de la cadera.', 'Mantén un ritmo rápido y el pecho erguido.'],
    tip: 'Si te cansas, baja el ritmo pero no pares: pasa a marcha.',
  },
  {
    id: 'shadow_boxing', name: 'Boxeo de sombra', anim: 'shadow_boxing', category: 'cardio', kind: 'time',
    muscles: 'Hombros · Brazos · Core', met: 7,
    steps: ['Guardia: puños a la altura de la barbilla, rodillas suaves.', 'Lanza golpes rectos alternando brazos.', 'Gira ligeramente el torso en cada golpe y vuelve a la guardia.'],
    tip: 'No bloquees los codos al extender.',
  },
  {
    id: 'mountain_climbers', name: 'Escaladores', anim: 'mountain_climbers', category: 'cardio', kind: 'time', equipment: 'mat',
    muscles: 'Core · Hombros · Cardio', met: 8,
    steps: ['Posición de plancha alta con manos bajo los hombros.', 'Lleva una rodilla hacia el pecho y vuelve.', 'Alterna piernas rápido manteniendo la cadera estable.'],
    tip: 'La cadera no debe subir: imagina un vaso de agua en tu espalda.',
  },
  {
    id: 'burpees', name: 'Burpees', anim: 'burpees', category: 'cardio', kind: 'reps',
    muscles: 'Cuerpo completo', met: 10,
    steps: ['De pie, baja a cuclillas y apoya las manos.', 'Salta con los pies atrás hasta la plancha.', 'Vuelve a cuclillas y salta arriba con los brazos extendidos.'],
    tip: 'Versión suave: da pasos atrás en lugar de saltar.',
  },
  {
    id: 'squat_jumps', name: 'Sentadilla con salto', anim: 'squat_jumps', category: 'cardio', kind: 'reps',
    muscles: 'Piernas · Glúteos · Potencia', met: 9,
    steps: ['Baja a sentadilla con los brazos atrás.', 'Salta con fuerza extendiendo cadera y brazos.', 'Aterriza suave y enlaza la siguiente.'],
    tip: 'Rodillas alineadas con las puntas de los pies al aterrizar.',
  },

  // ---------- Fuerza peso corporal ----------
  {
    id: 'squat', name: 'Sentadilla', anim: 'squat', category: 'strength', kind: 'reps',
    muscles: 'Cuádriceps · Glúteos', met: 5,
    steps: ['Pies al ancho de hombros, puntas ligeramente hacia fuera.', 'Baja llevando la cadera atrás como si te sentaras.', 'Sube empujando el suelo con los talones.'],
    tip: 'Pecho arriba y rodillas siguiendo la dirección de los pies.',
  },
  {
    id: 'sumo_squat', name: 'Sentadilla sumo', anim: 'sumo_squat', category: 'strength', kind: 'reps',
    muscles: 'Glúteos · Aductores · Cuádriceps', met: 5,
    steps: ['Pies más abiertos que los hombros y puntas hacia fuera.', 'Baja recto manteniendo el torso erguido.', 'Sube apretando glúteos.'],
    tip: 'Empuja las rodillas hacia fuera durante todo el movimiento.',
  },
  {
    id: 'lunges', name: 'Zancadas alternas', anim: 'lunges', category: 'strength', kind: 'reps', perSide: true,
    muscles: 'Glúteos · Cuádriceps', met: 5,
    steps: ['De pie, da un paso largo al frente.', 'Baja hasta que ambas rodillas formen unos 90°.', 'Empuja con la pierna delantera para volver y alterna.'],
    tip: 'El torso recto y la rodilla delantera sobre el tobillo.',
  },
  {
    id: 'side_lunges', name: 'Zancada lateral', anim: 'side_lunges', category: 'strength', kind: 'reps', perSide: true,
    muscles: 'Glúteo medio · Aductores', met: 5,
    steps: ['De pie con los pies juntos.', 'Da un paso amplio al lado y flexiona esa rodilla, la otra pierna estirada.', 'Vuelve al centro y alterna.'],
    tip: 'Lleva la cadera atrás como en una sentadilla.',
  },
  {
    id: 'glute_bridge', name: 'Puente de glúteos', anim: 'glute_bridge', category: 'strength', kind: 'reps', equipment: 'mat',
    muscles: 'Glúteos · Isquios', met: 4,
    steps: ['Túmbate boca arriba con rodillas flexionadas y pies en el suelo.', 'Eleva la cadera apretando glúteos hasta alinear rodillas, cadera y hombros.', 'Baja controlando sin tocar del todo el suelo.'],
    tip: 'Haz una pausa de 1 segundo arriba apretando fuerte.',
  },
  {
    id: 'pushups', name: 'Flexiones', anim: 'pushups', category: 'strength', kind: 'reps', equipment: 'mat',
    muscles: 'Pecho · Tríceps · Hombros', met: 6,
    steps: ['Plancha alta con manos algo más abiertas que los hombros.', 'Baja el pecho llevando los codos hacia atrás (unos 45°).', 'Empuja hasta estirar los brazos manteniendo el cuerpo recto.'],
    tip: 'Si cuestan, hazlas con rodillas apoyadas.',
  },
  {
    id: 'knee_pushups', name: 'Flexiones con rodillas', anim: 'knee_pushups', category: 'strength', kind: 'reps', equipment: 'mat',
    muscles: 'Pecho · Tríceps · Hombros', met: 4.5,
    steps: ['Apoya manos y rodillas, cuerpo recto de rodillas a cabeza.', 'Baja el pecho hacia el suelo con los codos atrás.', 'Empuja para subir.'],
    tip: 'No dejes caer la cadera.',
  },
  {
    id: 'tricep_dips', name: 'Fondos de tríceps en silla', anim: 'tricep_dips', category: 'strength', kind: 'reps', equipment: 'chair',
    muscles: 'Tríceps · Hombros', met: 5,
    steps: ['Siéntate al borde de una silla estable y apoya las manos a los lados.', 'Adelanta la cadera y baja flexionando los codos hacia atrás.', 'Empuja para subir sin bloquear los codos.'],
    tip: 'Asegúrate de que la silla no se mueva (apóyala contra la pared).',
  },
  {
    id: 'wall_sit', name: 'Sentadilla isométrica en pared', anim: 'wall_sit', category: 'strength', kind: 'time',
    muscles: 'Cuádriceps · Glúteos', met: 4,
    steps: ['Apoya la espalda en la pared.', 'Baja hasta que los muslos queden paralelos al suelo.', 'Aguanta la posición respirando.'],
    tip: 'Rodillas encima de los tobillos, no por delante.',
  },
  {
    id: 'calf_raises', name: 'Elevación de talones', anim: 'calf_raises', category: 'strength', kind: 'reps',
    muscles: 'Gemelos', met: 3.5,
    steps: ['De pie, pies al ancho de caderas.', 'Sube sobre las puntas de los pies.', 'Baja despacio.'],
    tip: 'Puedes apoyarte en una pared para el equilibrio.',
  },
  {
    id: 'donkey_kicks', name: 'Patada de glúteo', anim: 'donkey_kicks', category: 'strength', kind: 'reps', perSide: true, equipment: 'mat',
    muscles: 'Glúteo mayor', met: 4,
    steps: ['En cuadrupedia, abdomen activo.', 'Con la rodilla doblada, empuja el talón hacia el techo.', 'Baja sin apoyar la rodilla y repite. Luego cambia de lado.'],
    tip: 'No arquees la zona lumbar: el movimiento es de cadera.',
  },
  {
    id: 'superman', name: 'Superman', anim: 'superman', category: 'strength', kind: 'reps', equipment: 'mat',
    muscles: 'Espalda baja · Glúteos', met: 3.5,
    steps: ['Túmbate boca abajo con brazos estirados al frente.', 'Eleva a la vez brazos, pecho y piernas.', 'Mantén 1–2 segundos y baja despacio.'],
    tip: 'Mira al suelo para no forzar el cuello.',
  },

  // ---------- Core ----------
  {
    id: 'plank', name: 'Plancha', anim: 'plank', category: 'core', kind: 'time', equipment: 'mat',
    muscles: 'Core · Hombros', met: 4,
    steps: ['Apoya antebrazos con codos bajo los hombros.', 'Estira las piernas y forma una línea recta de cabeza a talones.', 'Aguanta apretando abdomen y glúteos.'],
    tip: 'Si duele la zona lumbar, apoya las rodillas.',
  },
  {
    id: 'crunches', name: 'Abdominales crunch', anim: 'crunches', category: 'core', kind: 'reps', equipment: 'mat',
    muscles: 'Recto abdominal', met: 3.8,
    steps: ['Boca arriba, rodillas flexionadas y manos detrás de la cabeza.', 'Eleva los hombros del suelo contrayendo el abdomen.', 'Baja despacio.'],
    tip: 'No tires del cuello con las manos; mira al techo.',
  },
  {
    id: 'leg_raises', name: 'Elevación de piernas', anim: 'leg_raises', category: 'core', kind: 'reps', equipment: 'mat',
    muscles: 'Abdomen inferior', met: 3.8,
    steps: ['Boca arriba, piernas estiradas y brazos a los lados.', 'Sube las piernas hasta la vertical.', 'Baja despacio sin tocar el suelo.'],
    tip: 'Mantén la zona lumbar pegada al suelo; si cuesta, dobla las rodillas.',
  },
  {
    id: 'dead_bug', name: 'Bicho muerto', anim: 'dead_bug', category: 'core', kind: 'reps', perSide: true, equipment: 'mat',
    muscles: 'Core profundo', met: 3.5,
    steps: ['Boca arriba, brazos al techo y rodillas a 90°.', 'Extiende un brazo atrás y la pierna contraria al frente.', 'Vuelve y alterna lados.'],
    tip: 'Exhala al extender y mantén la espalda baja pegada al suelo.',
  },
  {
    id: 'bird_dog', name: 'Bird dog', anim: 'bird_dog', category: 'core', kind: 'reps', perSide: true, equipment: 'mat',
    muscles: 'Core · Espalda · Glúteos', met: 3,
    steps: ['En cuadrupedia, espalda neutra.', 'Extiende un brazo al frente y la pierna contraria atrás.', 'Vuelve al centro y alterna.'],
    tip: 'Muévete lento: la cadera no debe girar.',
  },

  // ---------- Mancuernas ----------
  {
    id: 'db_goblet_squat', name: 'Sentadilla goblet', anim: 'db_goblet_squat', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Glúteos · Cuádriceps · Core', met: 5.5,
    steps: ['Sujeta una mancuerna vertical pegada al pecho.', 'Baja en sentadilla con el pecho erguido.', 'Sube empujando con los talones.'],
    tip: 'Los codos bajan por dentro de las rodillas.',
  },
  {
    id: 'db_sumo_squat', name: 'Sentadilla sumo con mancuerna', anim: 'db_sumo_squat', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Glúteos · Aductores', met: 5.5,
    steps: ['Pies abiertos, puntas hacia fuera, mancuerna colgando al centro.', 'Baja recto con la espalda erguida.', 'Sube apretando glúteos.'],
    tip: 'Rodillas hacia fuera, en la línea de los pies.',
  },
  {
    id: 'db_rdl', name: 'Peso muerto rumano', anim: 'db_rdl', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Isquios · Glúteos · Espalda baja', met: 5,
    steps: ['De pie con una mancuerna en cada mano delante de los muslos.', 'Lleva la cadera atrás deslizando las mancuernas por las piernas.', 'Sube apretando glúteos con la espalda recta.'],
    tip: 'Rodillas suaves y espalda neutra; baja solo hasta notar el estiramiento.',
  },
  {
    id: 'db_lunges', name: 'Zancadas con mancuernas', anim: 'db_lunges', category: 'strength', kind: 'reps', perSide: true, equipment: 'dumbbells',
    muscles: 'Glúteos · Cuádriceps', met: 5.5,
    steps: ['Mancuernas a los lados del cuerpo.', 'Da un paso al frente y baja hasta 90°.', 'Vuelve y alterna piernas.'],
    tip: 'Pasos largos trabajan más glúteo.',
  },
  {
    id: 'db_hip_thrust', name: 'Hip thrust con mancuerna', anim: 'db_hip_thrust', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Glúteo mayor', met: 4.5,
    steps: ['Boca arriba, rodillas flexionadas, mancuerna sobre la cadera.', 'Eleva la cadera apretando glúteos.', 'Baja controlando.'],
    tip: 'Barbilla hacia el pecho y pausa arriba.',
  },
  {
    id: 'db_shoulder_press', name: 'Press de hombros', anim: 'db_shoulder_press', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Hombros · Tríceps', met: 5,
    steps: ['Mancuernas a la altura de los hombros, codos abiertos.', 'Empuja hacia arriba hasta casi estirar los brazos.', 'Baja controlando.'],
    tip: 'Abdomen firme, no arquees la espalda.',
  },
  {
    id: 'db_curl', name: 'Curl de bíceps', anim: 'db_curl', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Bíceps', met: 4,
    steps: ['De pie, mancuernas a los lados con palmas al frente.', 'Flexiona los codos subiendo las mancuernas.', 'Baja despacio.'],
    tip: 'Codos pegados al cuerpo, sin balancearte.',
  },
  {
    id: 'db_row', name: 'Remo con mancuernas', anim: 'db_row', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Espalda · Bíceps', met: 5,
    steps: ['Inclina el torso hacia delante con la espalda recta.', 'Lleva las mancuernas hacia la cadera juntando escápulas.', 'Baja controlando.'],
    tip: 'Tira con los codos, no con las manos.',
  },
  {
    id: 'db_lateral_raise', name: 'Elevaciones laterales', anim: 'db_lateral_raise', category: 'strength', kind: 'reps', equipment: 'dumbbells',
    muscles: 'Hombros', met: 4,
    steps: ['De pie con mancuernas a los lados.', 'Eleva los brazos hacia los lados hasta la altura de los hombros.', 'Baja lento.'],
    tip: 'Codos ligeramente flexionados y peso ligero.',
  },

  // ---------- Estiramientos ----------
  {
    id: 'stretch_quad', name: 'Estiramiento de cuádriceps', anim: 'stretch_quad', category: 'stretch', kind: 'time', perSide: true,
    muscles: 'Cuádriceps', met: 2.3,
    steps: ['De pie, sujeta un pie y llévalo hacia el glúteo.', 'Rodillas juntas y cadera adelante.', 'Mantén y cambia de pierna a mitad de tiempo.'],
    tip: 'Apóyate en una pared si pierdes el equilibrio.',
  },
  {
    id: 'stretch_hamstring', name: 'Estiramiento de isquios sentada', anim: 'stretch_hamstring', category: 'stretch', kind: 'time', equipment: 'mat',
    muscles: 'Isquiotibiales · Espalda', met: 2.3,
    steps: ['Sentada con las piernas estiradas.', 'Inclínate hacia delante desde la cadera.', 'Lleva las manos hacia los pies y respira.'],
    tip: 'Espalda larga; no importa no llegar a los pies.',
  },
  {
    id: 'toe_touch', name: 'Flexión de pie hacia delante', anim: 'toe_touch', category: 'stretch', kind: 'time',
    muscles: 'Isquios · Espalda baja', met: 2.3,
    steps: ['De pie, rodillas suaves.', 'Deja caer el torso hacia delante.', 'Relaja cuello y brazos y respira.'],
    tip: 'Sube vértebra a vértebra al terminar.',
  },
  {
    id: 'child_pose', name: 'Postura del niño', anim: 'child_pose', category: 'stretch', kind: 'time', equipment: 'mat',
    muscles: 'Espalda · Caderas', met: 2,
    steps: ['De rodillas, siéntate sobre los talones.', 'Lleva el torso al suelo y estira los brazos al frente.', 'Respira profundo relajando la espalda.'],
    tip: 'Abre las rodillas si necesitas más espacio.',
  },
  {
    id: 'cobra', name: 'Esfinge / cobra suave', anim: 'cobra', category: 'stretch', kind: 'time', equipment: 'mat',
    muscles: 'Abdomen · Espalda', met: 2,
    steps: ['Boca abajo con antebrazos apoyados.', 'Eleva el pecho alargando la columna.', 'Mantén con hombros relajados.'],
    tip: 'Sin dolor lumbar: sube solo hasta donde estés cómoda.',
  },
  {
    id: 'hip_flexor_stretch', name: 'Estiramiento de flexores de cadera', anim: 'hip_flexor_stretch', category: 'stretch', kind: 'time', perSide: true, equipment: 'mat',
    muscles: 'Psoas · Cuádriceps', met: 2.3,
    steps: ['Rodilla trasera apoyada, pierna delantera a 90°.', 'Adelanta la cadera y sube los brazos.', 'Mantén y cambia de lado a mitad de tiempo.'],
    tip: 'Aprieta el glúteo de la pierna trasera para notar más el estiramiento.',
  },
  {
    id: 'chest_opener', name: 'Apertura de pecho', anim: 'chest_opener', category: 'stretch', kind: 'time',
    muscles: 'Pecho · Hombros', met: 2,
    steps: ['De pie, entrelaza las manos detrás.', 'Estira los brazos y abre el pecho.', 'Mira ligeramente arriba y respira.'],
    tip: 'Hombros abajo y atrás.',
  },
  {
    id: 'side_stretch', name: 'Estiramiento lateral', anim: 'side_stretch', category: 'stretch', kind: 'time',
    muscles: 'Oblicuos · Dorsales', met: 2,
    steps: ['De pie, brazo por encima de la cabeza.', 'Inclínate al lado contrario y mantén.', 'Cambia de lado.'],
    tip: 'Alarga el costado, sin hundir el pecho.',
  },
]

export const EX_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const getEx = (id: string): Exercise =>
  EX_BY_ID[id] ?? { ...EXERCISES[0], id, name: id }

export const CATEGORY_LABEL: Record<string, string> = {
  warmup: 'Calentamiento',
  cardio: 'Cardio',
  strength: 'Fuerza',
  core: 'Core',
  stretch: 'Estiramiento',
}
