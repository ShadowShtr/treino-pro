// Demonstrações visuais dos exercícios — imagens do free-exercise-db
// (https://github.com/yuhonas/free-exercise-db, domínio público).
// Cada exercício tem 2 quadros (posição inicial/final) que são alternados
// para criar uma animação demonstrativa estilo GIF.

import { EXERCISE_ANIMATIONS } from "./exerciseAnimations";

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
  "Jump": "Bench_Jump",
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

// ─────────────────────────────────────────────────────
// Dicas curtas por exercício — só o essencial para executar
// bem, sem texto longo. Complementam a demonstração visual.
// ─────────────────────────────────────────────────────
const TIPS: Record<string, string[]> = {
  // ── Peito ──
  "Supino reto": ["Desça a barra devagar até ao meio do peito", "Empurre para cima sem bloquear os cotovelos"],
  "Supino inclinado": ["Banco inclinado a 30–45°", "A barra desce até à parte alta do peito"],
  "Supino declinado": ["Banco declinado, pés presos", "Desça a barra até à parte baixa do peito"],
  "Supino reto com halteres": ["Desça os halteres ao lado do peito", "Suba juntando-os no topo"],
  "Supino inclinado com halteres": ["Banco a 30–45°", "Cotovelos a ~45° do tronco"],
  "Crucifixo reto": ["Braços quase esticados, abra em arco", "Feche como se abraçasse uma árvore"],
  "Crucifixo inclinado": ["Banco inclinado", "Abra em arco e volte devagar"],
  "Crossover alto": ["Polias acima da cabeça", "Puxe em arco até as mãos quase se cruzarem"],
  "Crossover baixo": ["Polias em baixo", "Puxe para cima e para dentro"],
  "Crossover neutro": ["Polias à altura do peito", "Junte as mãos à frente do peito"],
  "Peck deck": ["Costas bem apoiadas no banco", "Feche os braços à frente e volte devagar"],
  "Flexão de braço": ["Corpo reto da cabeça aos pés", "Desça até o peito quase tocar o chão"],
  "Flexão inclinada": ["Mãos num banco ou apoio alto", "Versão mais fácil — ideal para começar"],
  "Flexão declinada": ["Pés elevados num banco", "Versão mais difícil — parte alta do peito"],
  "Pullover": ["Deitado, haltere sobre o peito", "Leve atrás da cabeça e volte"],
  "Cable fly": ["Deitado entre as polias", "Feche os braços em arco sobre o peito"],

  // ── Costas ──
  "Puxada alta": ["Pegada larga", "Puxe a barra até ao topo do peito"],
  "Puxada frente": ["Peito aberto, tronco ligeiramente inclinado", "Puxe até ao peito e suba devagar"],
  "Puxada triângulo": ["Pegada no triângulo", "Cotovelos junto ao corpo"],
  "Puxada neutro": ["Pegada fechada", "Cotovelos para baixo e para trás"],
  "Remada baixa": ["Costas direitas", "Puxe ao abdómen e aperte as escápulas"],
  "Remada curvada": ["Tronco inclinado, costas retas", "Puxe a barra até ao abdómen"],
  "Remada unilateral": ["Joelho e mão apoiados no banco", "Puxe o haltere até à cintura"],
  "Remada cavalinho": ["Tronco inclinado sobre a barra", "Puxe ao peito apertando as costas"],
  "Remada máquina": ["Peito apoiado", "Puxe e aperte as escápulas atrás"],
  "Remada Yates": ["Tronco a ~45°, pegada supinada", "Puxe a barra à cintura"],
  "Pulldown": ["Braços quase esticados", "Empurre a barra até às coxas"],
  "Barra fixa": ["Pegada mais larga que os ombros", "Suba até o queixo passar a barra"],
  "Barra fixa supinada": ["Palmas viradas para si", "Mais bíceps — suba controlado"],
  "Levantamento terra": ["Costas retas, barra junto às pernas", "Empurre o chão com as pernas"],
  "Face pull": ["Corda à altura do rosto", "Puxe para a testa abrindo os cotovelos"],
  "Serrátil": ["Braços esticados para cima", "Empurre os ombros para a frente no topo"],

  // ── Pernas ──
  "Agachamento livre": ["Pés à largura dos ombros", "Desça como se fosse sentar numa cadeira"],
  "Agachamento sumô": ["Pés bem afastados, pontas para fora", "Tronco direito durante a descida"],
  "Agachamento goblet": ["Haltere junto ao peito", "Ótimo para aprender a agachar"],
  "Leg press": ["Pés à largura dos ombros na plataforma", "Não bloqueie os joelhos no topo"],
  "Leg press 45°": ["Desça até ~90° nos joelhos", "Empurre com os calcanhares"],
  "Hack machine": ["Costas apoiadas na máquina", "Desça controlado até ~90°"],
  "Cadeira extensora": ["Estique as pernas até ao topo", "Desça devagar, sem deixar cair"],
  "Mesa flexora": ["Deitado, leve os calcanhares ao glúteo", "Suba e desça controlado"],
  "Cadeira flexora": ["Sentado, dobre os joelhos para trás", "Segure 1s em baixo"],
  "Stiff": ["Pernas quase esticadas", "Desça sentindo o posterior da coxa"],
  "Afundo": ["Passo à frente, joelho de trás desce", "Tronco sempre direito"],
  "Passada": ["Passos alternados em movimento", "Joelho da frente alinhado com o pé"],
  "Avanço com barra": ["Barra apoiada nas costas", "Passo à frente e volte com força"],
  "Step up": ["Suba o banco com um pé", "Empurre com o calcanhar de cima"],
  "Agachamento búlgaro": ["Pé de trás apoiado no banco", "Desça com o tronco direito"],
  "Leg curl deitado": ["Calcanhares em direção ao glúteo", "Não levante a anca do banco"],

  // ── Ombros ──
  "Desenvolvimento com barra": ["Barra à altura dos ombros", "Empurre acima da cabeça sem arquear as costas"],
  "Desenvolvimento com halteres": ["Halteres à altura das orelhas", "Suba até quase esticar os braços"],
  "Arnold press": ["Comece com as palmas viradas para si", "Rode os pulsos enquanto sobe"],
  "Desenvolvimento na máquina": ["Costas apoiadas", "Empurre para cima e desça devagar"],
  "Elevação lateral": ["Suba até à linha dos ombros", "Cotovelos ligeiramente dobrados"],
  "Elevação lateral máquina": ["Suba até à linha dos ombros", "Desça devagar, sem deixar cair"],
  "Elevação frontal": ["Suba à frente até à altura dos ombros", "Desça devagar, sem balançar"],
  "Elevação frontal com cabo": ["Cabo na posição baixa", "Suba à frente sem balançar o corpo"],
  "Crucifixo inverso": ["Tronco inclinado à frente", "Abra os braços para trás"],
  "Crucifixo inverso máquina": ["Peito apoiado", "Abra os braços para trás devagar"],
  "Remada alta": ["Puxe a barra até ao peito", "Cotovelos sempre acima das mãos"],
  "Encolhimento": ["Encolha os ombros para cima", "Segure 1s e desça"],

  // ── Bíceps ──
  "Rosca direta": ["Cotovelos colados ao tronco", "Suba a barra sem balançar o corpo"],
  "Rosca direta com halteres": ["Os dois halteres sobem juntos", "Desça devagar até esticar"],
  "Rosca alternada": ["Um braço de cada vez", "Rode a palma para cima ao subir"],
  "Rosca martelo": ["Palmas viradas uma para a outra", "Cotovelos fixos junto ao corpo"],
  "Rosca Scott": ["Braços apoiados no banco Scott", "Desça quase até esticar"],
  "Rosca concentrada": ["Cotovelo apoiado na coxa", "Suba devagar e aperte em cima"],
  "Rosca 21": ["7 meias-repetições em baixo + 7 em cima + 7 completas", "Use carga leve"],
  "Rosca no cabo": ["Cotovelos junto ao corpo", "Tensão constante — desça devagar"],
  "Rosca inversa": ["Palmas viradas para baixo", "Trabalha antebraço e bíceps"],

  // ── Tríceps ──
  "Tríceps pulley": ["Cotovelos colados ao tronco", "Empurre até esticar e volte devagar"],
  "Tríceps corda": ["Abra a corda no final do movimento", "Só o antebraço se move"],
  "Tríceps barra": ["Pegada na barra", "Empurre até esticar os braços"],
  "Tríceps testa": ["Deitado, desça a barra até à testa", "Cotovelos apontados para cima"],
  "Tríceps testa com halteres": ["Desça os halteres ao lado da cabeça", "Cotovelos fixos"],
  "Tríceps francês": ["Haltere atrás da cabeça", "Estique os braços para cima"],
  "Paralelas": ["Desça até ~90° nos cotovelos", "Tronco direito foca mais o tríceps"],
  "Tríceps coice": ["Tronco inclinado, cotovelo alto", "Estique o braço para trás"],
  "Tríceps máquina": ["Cotovelos apoiados", "Empurre até esticar e volte devagar"],
  "Tríceps unilateral": ["Um braço de cada vez", "Cotovelo fixo junto ao corpo"],

  // ── Abdômen ──
  "Abdominal supra": ["Suba só os ombros do chão", "Não puxe o pescoço com as mãos"],
  "Abdominal infra": ["Leve os joelhos ao peito", "Tire a anca do chão no final"],
  "Abdominal oblíquo": ["Cotovelo em direção ao joelho oposto", "Alterne os lados"],
  "Prancha": ["Corpo reto dos ombros aos pés", "Contraia o abdómen e respire"],
  "Prancha lateral": ["Apoio num antebraço", "Anca elevada e corpo alinhado"],
  "Prancha com movimento": ["Alterne entre antebraços e mãos", "Anca estável, sem balançar"],
  "Elevação de pernas": ["Pernas esticadas, suba até 90°", "Desça devagar sem tocar no chão"],
  "Elevação de pernas na barra": ["Pendurado na barra", "Suba as pernas sem balançar"],
  "Russian twist": ["Tronco inclinado atrás, pés elevados", "Rode de um lado ao outro"],
  "Crunch na máquina": ["Enrole o tronco à frente", "Volte devagar"],
  "Abdominal no cabo": ["Ajoelhado, corda junto à cabeça", "Enrole o tronco para baixo"],
  "Mountain climber": ["Posição de prancha", "Joelhos ao peito alternando rápido"],
  "Hollow body": ["Deitado, lombar colada ao chão", "Eleve ombros e pernas e segure"],

  // ── Glúteos ──
  "Elevação pélvica": ["Deitado, pés no chão", "Suba a anca apertando o glúteo"],
  "Elevação pélvica com barra": ["Barra sobre a anca", "Suba até alinhar tronco e coxas"],
  "Hip thrust": ["Costas apoiadas no banco", "Suba a anca e aperte o glúteo no topo"],
  "Cadeira abdutora": ["Abra as pernas contra a resistência", "Volte devagar"],
  "Coice na polia": ["Tornozelo preso ao cabo", "Empurre a perna para trás"],
  "Kick back": ["De quatro apoios", "Empurre o calcanhar para cima e para trás"],
  "Good morning": ["Barra nas costas, joelhos semiflexionados", "Incline o tronco com as costas retas"],
  "Extensão de quadril no cabo": ["De costas para a polia, cabo entre as pernas", "Empurre a anca à frente apertando o glúteo"],
  "Avanço": ["Passo para trás e desça", "Volte empurrando com a perna da frente"],

  // ── Panturrilha ──
  "Panturrilha em pé": ["Suba na ponta dos pés", "Pausa em cima, desça devagar"],
  "Panturrilha sentado": ["Joelhos a 90°", "Amplitude completa — desça bem"],
  "Panturrilha no leg press": ["Só a ponta dos pés na plataforma", "Empurre com os dedos"],
  "Panturrilha unilateral": ["Uma perna de cada vez", "Suba o máximo que conseguir"],
  "Panturrilha com halteres": ["Haltere em cada mão", "Suba na ponta dos pés e segure 1s"],

  // ── Cardio ──
  "Esteira": ["Comece a caminhar e aumente o ritmo", "Postura direita, olhar em frente"],
  "Bike ergométrica": ["Ajuste o banco à altura da anca", "Ritmo constante"],
  "Elíptico": ["Movimento contínuo e suave", "Use também os braços"],
  "Escada": ["Postura direita", "Não se apoie demasiado nas mãos"],
  "Remo ergométrico": ["Empurre primeiro com as pernas", "Depois puxe com os braços"],
  "Corda náutica": ["Joelhos semiflexionados", "Ondule as cordas alternando os braços"],
  "Burpee": ["Agache e apoie as mãos no chão", "Estique as pernas em prancha", "Volte e salte com os braços para cima"],
  "Jump": ["Salte com força para cima do apoio", "Aterre suave, joelhos flexionados"],
  "Polichinelo": ["Abra pernas e braços ao mesmo tempo", "Volte ao centro e repita em ritmo"],
  "Corrida": ["Ritmo confortável para começar", "Aumente a distância aos poucos"],
  "HIIT": ["Alterne esforço máximo com descanso curto", "Ex.: 30s forte + 30s leve"],
  "Circuito": ["Vários exercícios em sequência", "Pouco descanso entre eles"],
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
  if (getExerciseAnimation(name)) return null;
  const id = resolveId(name);
  if (!id) return null;
  return [`${BASE}/${id}/0.jpg`, `${BASE}/${id}/1.jpg`];
}

/** Mini-animação SVG local (tem prioridade sobre as fotos). */
export function getExerciseAnimation(name: string): string | null {
  return EXERCISE_ANIMATIONS[normalize(name)] ?? null;
}

const TIPS_LOOKUP = new Map(Object.entries(TIPS).map(([k, v]) => [normalize(k), v]));

/** Dicas curtas de execução, ou null para exercícios personalizados. */
export function getExerciseTips(name: string): string[] | null {
  return TIPS_LOOKUP.get(normalize(name)) ?? null;
}

export function hasExerciseMedia(name: string): boolean {
  return getExerciseAnimation(name) !== null || resolveId(name) !== null;
}
