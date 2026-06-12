// Demonstrações visuais dos exercícios — imagens do free-exercise-db
// (https://github.com/yuhonas/free-exercise-db, domínio público).
// Cada exercício tem 2 quadros (posição inicial/final) que são alternados
// para criar uma animação demonstrativa estilo GIF.

const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Nome do exercício (PT) → id no free-exercise-db
const MEDIA_IDS: Record<string, string> = {
  // ── Peito ──
  "Supino reto": "Barbell_Bench_Press_-_Medium_Grip",
  "Supino inclinado": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Supino declinado": "Decline_Barbell_Bench_Press",
  "Supino reto com halteres": "Dumbbell_Bench_Press",
  "Supino inclinado com halteres": "Incline_Dumbbell_Press",
  "Crucifixo reto": "Dumbbell_Flyes",
  "Crucifixo inclinado": "Incline_Dumbbell_Flyes",
  "Crossover alto": "Cable_Crossover",
  "Crossover baixo": "Low_Cable_Crossover",
  "Crossover neutro": "Cable_Crossover",
  "Peck deck": "Butterfly",
  "Flexão de braço": "Pushups",
  "Flexão inclinada": "Incline_Push-Up",
  "Flexão declinada": "Decline_Push-Up",
  "Pullover": "Straight-Arm_Dumbbell_Pullover",
  "Cable fly": "Flat_Bench_Cable_Flyes",

  // ── Costas ──
  "Puxada alta": "Wide-Grip_Lat_Pulldown",
  "Puxada frente": "Full_Range-Of-Motion_Lat_Pulldown",
  "Puxada triângulo": "V-Bar_Pulldown",
  "Puxada neutro": "Close-Grip_Front_Lat_Pulldown",
  "Remada baixa": "Seated_Cable_Rows",
  "Remada curvada": "Bent_Over_Barbell_Row",
  "Remada unilateral": "One-Arm_Dumbbell_Row",
  "Remada cavalinho": "T-Bar_Row_with_Handle",
  "Remada máquina": "Leverage_Iso_Row",
  "Remada Yates": "Bent_Over_Barbell_Row",
  "Pulldown": "Straight-Arm_Pulldown",
  "Barra fixa": "Pullups",
  "Barra fixa supinada": "Chin-Up",
  "Levantamento terra": "Barbell_Deadlift",
  "Face pull": "Face_Pull",
  "Serrátil": "Dumbbell_Incline_Shoulder_Raise",

  // ── Pernas ──
  "Agachamento livre": "Barbell_Squat",
  "Agachamento sumô": "Plie_Dumbbell_Squat",
  "Agachamento goblet": "Goblet_Squat",
  "Leg press": "Leg_Press",
  "Leg press 45°": "Leg_Press",
  "Hack machine": "Hack_Squat",
  "Cadeira extensora": "Leg_Extensions",
  "Mesa flexora": "Lying_Leg_Curls",
  "Cadeira flexora": "Seated_Leg_Curl",
  "Stiff": "Stiff-Legged_Barbell_Deadlift",
  "Afundo": "Dumbbell_Lunges",
  "Passada": "Bodyweight_Walking_Lunge",
  "Avanço com barra": "Barbell_Lunge",
  "Step up": "Dumbbell_Step_Ups",
  "Agachamento búlgaro": "Split_Squat_with_Dumbbells",
  "Leg curl deitado": "Lying_Leg_Curls",

  // ── Ombros ──
  "Desenvolvimento com barra": "Barbell_Shoulder_Press",
  "Desenvolvimento com halteres": "Dumbbell_Shoulder_Press",
  "Arnold press": "Arnold_Dumbbell_Press",
  "Desenvolvimento na máquina": "Machine_Shoulder_Military_Press",
  "Elevação lateral": "Side_Lateral_Raise",
  "Elevação lateral máquina": "Cable_Seated_Lateral_Raise",
  "Elevação frontal": "Front_Two-Dumbbell_Raise",
  "Elevação frontal com cabo": "Front_Cable_Raise",
  "Crucifixo inverso": "Reverse_Flyes",
  "Crucifixo inverso máquina": "Reverse_Machine_Flyes",
  "Remada alta": "Upright_Barbell_Row",
  "Encolhimento": "Barbell_Shrug",

  // ── Bíceps ──
  "Rosca direta": "Barbell_Curl",
  "Rosca direta com halteres": "Dumbbell_Bicep_Curl",
  "Rosca alternada": "Dumbbell_Alternate_Bicep_Curl",
  "Rosca martelo": "Hammer_Curls",
  "Rosca Scott": "Preacher_Curl",
  "Rosca concentrada": "Concentration_Curls",
  "Rosca 21": "Barbell_Curl",
  "Rosca no cabo": "Standing_Biceps_Cable_Curl",
  "Rosca inversa": "Reverse_Barbell_Curl",

  // ── Tríceps ──
  "Tríceps pulley": "Triceps_Pushdown",
  "Tríceps corda": "Triceps_Pushdown_-_Rope_Attachment",
  "Tríceps barra": "Triceps_Pushdown_-_V-Bar_Attachment",
  "Tríceps testa": "EZ-Bar_Skullcrusher",
  "Tríceps testa com halteres": "Lying_Dumbbell_Tricep_Extension",
  "Tríceps francês": "Standing_Dumbbell_Triceps_Extension",
  "Paralelas": "Dips_-_Triceps_Version",
  "Tríceps coice": "Tricep_Dumbbell_Kickback",
  "Tríceps máquina": "Machine_Triceps_Extension",
  "Tríceps unilateral": "Cable_One_Arm_Tricep_Extension",

  // ── Abdômen ──
  "Abdominal supra": "Crunches",
  "Abdominal infra": "Reverse_Crunch",
  "Abdominal oblíquo": "Oblique_Crunches",
  "Prancha": "Plank",
  "Prancha lateral": "Side_Bridge",
  "Prancha com movimento": "Plank",
  "Elevação de pernas": "Flat_Bench_Lying_Leg_Raise",
  "Elevação de pernas na barra": "Hanging_Leg_Raise",
  "Russian twist": "Russian_Twist",
  "Crunch na máquina": "Ab_Crunch_Machine",
  "Abdominal no cabo": "Cable_Crunch",
  "Mountain climber": "Mountain_Climbers",
  "Hollow body": "Flutter_Kicks",

  // ── Glúteos ──
  "Elevação pélvica": "Butt_Lift_Bridge",
  "Elevação pélvica com barra": "Barbell_Glute_Bridge",
  "Hip thrust": "Barbell_Hip_Thrust",
  "Cadeira abdutora": "Thigh_Abductor",
  "Coice na polia": "One-Legged_Cable_Kickback",
  "Kick back": "Glute_Kickback",
  "Good morning": "Good_Morning",
  "Extensão de quadril no cabo": "Pull_Through",
  "Avanço": "Dumbbell_Rear_Lunge",

  // ── Panturrilha ──
  "Panturrilha em pé": "Standing_Calf_Raises",
  "Panturrilha sentado": "Seated_Calf_Raise",
  "Panturrilha no leg press": "Calf_Press_On_The_Leg_Press_Machine",
  "Panturrilha unilateral": "Dumbbell_Seated_One-Leg_Calf_Raise",
  "Panturrilha com halteres": "Standing_Dumbbell_Calf_Raise",

  // ── Cardio ──
  "Esteira": "Running_Treadmill",
  "Bike ergométrica": "Bicycling_Stationary",
  "Elíptico": "Elliptical_Trainer",
  "Escada": "Stairmaster",
  "Remo ergométrico": "Rowing_Stationary",
  "Corda náutica": "Battling_Ropes",
  "Burpee": "Freehand_Jump_Squat",
  "Jump": "Bench_Jump",
  "Polichinelo": "Star_Jump",
  "Corrida": "Jogging_Treadmill",
  "Mountain Climber": "Mountain_Climbers",
  "HIIT": "Fast_Skipping",
  "Circuito": "Box_Jump_Multiple_Response",
};

// Apelidos genéricos para casar exercícios livres/personalizados digitados
// pelo usuário (chaves já normalizadas: minúsculas e sem acento).
const ALIASES: Record<string, string> = {
  "supino": "Barbell_Bench_Press_-_Medium_Grip",
  "supino maquina": "Machine_Bench_Press",
  "supino smith": "Smith_Machine_Bench_Press",
  "crucifixo": "Dumbbell_Flyes",
  "voador": "Butterfly",
  "crossover": "Cable_Crossover",
  "flexao": "Pushups",
  "agachamento": "Barbell_Squat",
  "agachamento smith": "Smith_Machine_Squat",
  "agachamento frontal": "Front_Barbell_Squat",
  "pistol": "Kettlebell_Pistol_Squat",
  "sissy": "Weighted_Sissy_Squat",
  "desenvolvimento": "Dumbbell_Shoulder_Press",
  "desenvolvimento militar": "Standing_Military_Press",
  "militar": "Standing_Military_Press",
  "rosca": "Barbell_Curl",
  "rosca punho": "Seated_Palm-Up_Barbell_Wrist_Curl",
  "antebraco": "Seated_Palm-Up_Barbell_Wrist_Curl",
  "rosca spider": "Spider_Curl",
  "rosca zottman": "Zottman_Curl",
  "triceps": "Triceps_Pushdown",
  "triceps banco": "Bench_Dips",
  "mergulho": "Bench_Dips",
  "remada": "Seated_Cable_Rows",
  "puxada": "Wide-Grip_Lat_Pulldown",
  "terra": "Barbell_Deadlift",
  "terra sumo": "Sumo_Deadlift",
  "terra romeno": "Romanian_Deadlift",
  "abdominal": "Crunches",
  "abdominal bicicleta": "Air_Bike",
  "abdominal remador": "Jackknife_Sit-Up",
  "panturrilha": "Standing_Calf_Raises",
  "burro": "Donkey_Calf_Raises",
  "gluteo": "Glute_Kickback",
  "ponte": "Butt_Lift_Bridge",
  "afundo": "Dumbbell_Lunges",
  "avanco": "Barbell_Lunge",
  "bulgaro": "Split_Squat_with_Dumbbells",
  "cadeira adutora": "Thigh_Adductor",
  "adutora": "Thigh_Adductor",
  "abdutora": "Thigh_Abductor",
  "lombar": "Hyperextensions_Back_Extensions",
  "hiperextensao": "Hyperextensions_Back_Extensions",
  "superman": "Superman",
  "kettlebell": "One-Arm_Kettlebell_Swings",
  "swing": "One-Arm_Kettlebell_Swings",
  "clean": "Power_Clean",
  "snatch": "Power_Snatch",
  "arremesso": "Power_Clean",
  "bicicleta": "Bicycling",
  "bike": "Bicycling_Stationary",
  "spinning": "Bicycling_Stationary",
  "caminhada": "Walking_Treadmill",
  "pular corda": "Rope_Jumping",
  "corda de pular": "Rope_Jumping",
  "remo": "Rowing_Stationary",
  "abdominal canivete": "Jackknife_Sit-Up",
  "sit up": "Sit-Up",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Índice normalizado (nomes do app + apelidos).
const NORMALIZED_ENTRIES: { key: string; id: string }[] = [
  ...Object.entries(MEDIA_IDS).map(([k, id]) => ({ key: normalize(k), id })),
  ...Object.entries(ALIASES).map(([k, id]) => ({ key: k, id })),
];

const EXACT_LOOKUP = new Map(NORMALIZED_ENTRIES.map(({ key, id }) => [key, id]));

// Frequência de cada palavra no índice: palavras raras ("sissy") são mais
// específicas que genéricas ("agachamento") e vencem no desempate.
const TOKEN_FREQ = new Map<string, number>();
for (const { key } of NORMALIZED_ENTRIES) {
  for (const t of key.split(" ")) {
    TOKEN_FREQ.set(t, (TOKEN_FREQ.get(t) ?? 0) + 1);
  }
}

function specificity(tokens: string[]): number {
  return tokens.reduce((s, t) => s + 1 / (TOKEN_FREQ.get(t) ?? 1), 0);
}

/** Resolve o id da demonstração, com correspondência aproximada para nomes livres. */
function resolveId(name: string): string | null {
  const direct = MEDIA_IDS[name];
  if (direct) return direct;

  const q = normalize(name);
  if (!q) return null;

  const exact = EXACT_LOOKUP.get(q);
  if (exact) return exact;

  // O nome digitado contém uma entrada conhecida ("supino reto na barra",
  // "agachamento sissy na máquina"): vence a entrada mais específica.
  let best: string | null = null;
  let bestScore = 0;
  for (const { key, id } of NORMALIZED_ENTRIES) {
    if (` ${q} `.includes(` ${key} `)) {
      const score = specificity(key.split(" "));
      // empate: a entrada mais ao fim do índice (apelidos curados) vence
      if (score >= bestScore) {
        best = id;
        bestScore = score;
      }
    }
  }
  if (best) return best;

  // O nome digitado é um pedaço de uma entrada conhecida ("crucifixo inv")
  if (q.length >= 4) {
    for (const { key, id } of NORMALIZED_ENTRIES) {
      if (key.includes(q)) return id;
    }
  }

  // Sobreposição de palavras: metade ou mais das palavras da entrada conhecida,
  // desempate pela especificidade das palavras casadas.
  const qTokens = new Set(q.split(" "));
  for (const { key, id } of NORMALIZED_ENTRIES) {
    const tokens = key.split(" ");
    const matched = tokens.filter((t) => t.length > 2 && qTokens.has(t));
    if (matched.length >= 1 && matched.length / tokens.length >= 0.5) {
      const score = specificity(matched);
      if (score > bestScore) {
        best = id;
        bestScore = score;
      }
    }
  }
  return best;
}

/** Retorna os 2 quadros (início/fim) da demonstração, ou null se não houver. */
export function getExerciseImages(name: string): [string, string] | null {
  const id = resolveId(name);
  if (!id) return null;
  return [`${BASE}/${id}/0.jpg`, `${BASE}/${id}/1.jpg`];
}

export function hasExerciseMedia(name: string): boolean {
  return resolveId(name) !== null;
}
