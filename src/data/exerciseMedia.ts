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
  "Jump": "Freehand_Jump_Squat",
  "Polichinelo": "Star_Jump",
  "Corrida": "Jogging_Treadmill",
  "Mountain Climber": "Mountain_Climbers",
};

/** Retorna os 2 quadros (início/fim) da demonstração, ou null se não houver. */
export function getExerciseImages(name: string): [string, string] | null {
  const id = MEDIA_IDS[name];
  if (!id) return null;
  return [`${BASE}/${id}/0.jpg`, `${BASE}/${id}/1.jpg`];
}

export function hasExerciseMedia(name: string): boolean {
  return Boolean(MEDIA_IDS[name]);
}
