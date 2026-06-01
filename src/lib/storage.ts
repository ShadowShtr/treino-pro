import type {
  ActivityLevel,
  AppTheme,
  FitnessData,
  Food,
  MealItem,
  Objective,
  StreakStats,
  Weekday,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutTemplate,
  CardioEntry,
  Somatotype
} from "../types";

// Keep the original key so installed users do not lose locally stored records after renaming.
export const STORAGE_KEY = "ritmo-fitness-data-v1";
const CORRUPTED_STORAGE_KEY = `${STORAGE_KEY}-corrupted`;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

interface StoredData {
  version?: number;
  theme?: AppTheme;
  streak?: Partial<StreakStats>;
  profile?: Record<string, unknown> | null;
  foods?: FitnessData["foods"];
  logs?: Record<string, Record<string, unknown>>;
  weights?: FitnessData["weights"];
  measurements?: FitnessData["measurements"];
  workouts?: { day: Weekday; name: string; exercises: (string | Partial<WorkoutExercise>)[] }[];
  workoutTemplates?: {
    id?: string;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    exercises?: (string | Partial<WorkoutExercise>)[];
  }[];
  completedWorkouts?: {
    id?: string;
    date: string;
    day: Weekday;
    name: string;
    exercises: (string | Partial<WorkoutExercise>)[];
  }[];
  cardioEntries?: Partial<CardioEntry>[];
}

function sanitizeText(value: unknown, maxLength = 120): string {
  return String(value ?? "")
    .replace(/<[^>]*>?/g, "")
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeId(value: unknown): string {
  const text = sanitizeText(value, 80);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(text) ? text : crypto.randomUUID();
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function validDate(value: unknown): string {
  const text = typeof value === "string" ? value.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
}

function secureFood(food: Partial<Food> | undefined): Food | null {
  if (!food) return null;
  const nome = sanitizeText(food.nome, 100);
  if (!nome) return null;
  return {
    id: sanitizeId(food.id),
    nome,
    baseGrams: boundedNumber(food.baseGrams, 100, 1, 1000),
    calories: boundedNumber(food.calories, 0, 0, 1200),
    protein: boundedNumber(food.protein, 0, 0, 200),
    carbs: boundedNumber(food.carbs, 0, 0, 250),
    fats: boundedNumber(food.fats, 0, 0, 200),
    unitName: food.unitName ? sanitizeText(food.unitName, 40) : undefined,
    gramsPerUnit: food.gramsPerUnit ? boundedNumber(food.gramsPerUnit, 0, 0, 5000) : undefined,
    custom: Boolean(food.custom)
  };
}

function secureMealItem(item: Partial<MealItem> | undefined, foods: Food[]): MealItem | null {
  if (!item?.food) return null;
  const food = secureFood(item.food);
  if (!food) return null;
  const knownFood = foods.find((entry) => entry.id === food.id) ?? food;
  return {
    id: sanitizeId(item.id),
    food: knownFood,
    quantity: boundedNumber(item.quantity, 0, 0.1, 10000),
    measure: item.measure === "unit" ? "unit" : "g"
  };
}

function normalizeTheme(value: unknown): AppTheme {
  return value === "dark" || value === "system" ? value : "light";
}

function normalizeStreak(value: Partial<StreakStats> | undefined): StreakStats {
  const today = new Date().toISOString().slice(0, 10);
  return {
    current: boundedNumber(value?.current, 0, 0, 10000),
    best: boundedNumber(value?.best, 0, 0, 10000),
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt.slice(0, 10) : today
  };
}

function migrateObjective(value: unknown): Objective {
  if (value === "ganhar" || value === "ganho_controlado") return "ganho_controlado";
  if (value === "perder" || value === "perda_controlada") return "perda_controlada";
  if (value === "recompor" || value === "recomposicao") return "recomposicao";
  return "manter";
}

function migrateActivity(value: unknown, version = 1): ActivityLevel {
  if (value === "alto") return "intenso";
  if (value === "intenso") return version >= 2 ? "intenso" : "muito_intenso";
  if (value === "muito_intenso") return "muito_intenso";
  if (value === "leve" || value === "moderado" || value === "sedentario") return value;
  return "moderado";
}

function migrateSomatotype(value: unknown): Somatotype {
  if (value === "ectomorfo" || value === "mesomorfo" || value === "endomorfo" || value === "nao_sei") return value;
  return "nao_sei";
}

function migrateExercises(exercises: (string | Partial<WorkoutExercise>)[] = []): WorkoutExercise[] {
  return exercises.map((entry) => {
    if (typeof entry === "string") {
      return { id: crypto.randomUUID(), name: sanitizeText(entry, 100) || "Exercício", sets: 3, repetitions: "10-12", load: "", notes: "" };
    }
    return {
      id: entry.id ?? crypto.randomUUID(),
      name: sanitizeText(entry.name, 100) || "Exercício",
      sets: boundedNumber(entry.sets, 3, 1, 20),
      repetitions: sanitizeText(entry.repetitions, 30) || "10-12",
      load: sanitizeText(entry.load, 30),
      notes: sanitizeText(entry.notes, 180)
    };
  });
}

export function secureWorkoutTemplate(template: WorkoutTemplate): WorkoutTemplate {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: template.id || crypto.randomUUID(),
    name: sanitizeText(template.name, 100) || "Modelo de treino",
    exercises: migrateExercises(template.exercises),
    createdAt: template.createdAt || today,
    updatedAt: template.updatedAt || today
  };
}

export function migrateData(raw: StoredData, fallback: FitnessData): FitnessData {
  const foods = Array.isArray(raw.foods)
    ? raw.foods.map((food) => secureFood(food)).filter((food): food is Food => Boolean(food))
    : fallback.foods;

  const profile = raw.profile
    ? {
        nome: sanitizeText(raw.profile.nome, 80),
        idade: boundedNumber(raw.profile.idade, 0, 10, 100),
        sexo: raw.profile.sexo === "feminino" ? "feminino" as const : "masculino" as const,
        altura: boundedNumber(raw.profile.altura, 0, 100, 230),
        pesoAtual: boundedNumber(raw.profile.pesoAtual, 0, 30, 300),
        pesoDesejado: raw.profile.pesoDesejado ? boundedNumber(raw.profile.pesoDesejado, 0, 30, 300) : 0,
        biotipo: migrateSomatotype(raw.profile.biotipo),
        objetivo: migrateObjective(raw.profile.objetivo),
        atividade: migrateActivity(raw.profile.atividade, raw.version),
        frequenciaTreino: boundedNumber(raw.profile.frequenciaTreino, 0, 0, 7),
        createdAt: validDate(raw.profile.createdAt)
      }
    : null;

  const logs = Object.fromEntries(
    Object.entries(raw.logs ?? {}).map(([date, log]) => [
      validDate(date),
      {
        date: validDate(date),
        meals: {
          refeicao1: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao1 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item)),
          refeicao2: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao2 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item)),
          refeicao3: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao3 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item)),
          refeicao4: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao4 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item)),
          refeicao5: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao5 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item)),
          refeicao6: (((log.meals as FitnessData["logs"][string]["meals"] | undefined)?.refeicao6 ?? []) as Partial<MealItem>[])
            .map((item) => secureMealItem(item, foods)).filter((item): item is MealItem => Boolean(item))
        },
        creatine: typeof log.creatine === "boolean" ? log.creatine : null,
        waterMl: boundedNumber(log.waterMl, 0, 0, 10000)
      }
    ])
  );

  const workouts: WorkoutPlan[] = (raw.workouts ?? fallback.workouts).map((workout) => ({
    day: workout.day,
    name: sanitizeText(workout.name, 100),
    exercises: migrateExercises(workout.exercises)
  }));

  return {
    version: 2,
    theme: normalizeTheme(raw.theme),
    streak: normalizeStreak(raw.streak),
    profile,
    foods,
    logs,
    weights: Array.isArray(raw.weights) ? raw.weights.map((entry) => ({
      id: sanitizeId(entry.id),
      date: validDate(entry.date),
      weight: boundedNumber(entry.weight, 0, 30, 300)
    })) : [],
    measurements: Array.isArray(raw.measurements) ? raw.measurements.map((entry) => ({
      id: sanitizeId(entry.id),
      date: validDate(entry.date),
      cintura: boundedNumber(entry.cintura, 0, 0, 300),
      abdomen: boundedNumber(entry.abdomen, 0, 0, 300),
      peito: boundedNumber(entry.peito, 0, 0, 300),
      braco: boundedNumber(entry.braco, 0, 0, 120),
      antebraco: boundedNumber(entry.antebraco, 0, 0, 120),
      coxa: boundedNumber(entry.coxa, 0, 0, 180),
      panturrilha: boundedNumber(entry.panturrilha, 0, 0, 120),
      gluteo: boundedNumber(entry.gluteo, 0, 0, 300),
      pescoco: boundedNumber(entry.pescoco, 0, 0, 120),
      gordura: boundedNumber(entry.gordura, 0, 0, 80)
    })) : [],
    workouts,
    workoutTemplates: (raw.workoutTemplates ?? []).map((template) => secureWorkoutTemplate({
      id: template.id ?? crypto.randomUUID(),
      name: template.name ?? "Modelo de treino",
      createdAt: template.createdAt ?? new Date().toISOString().slice(0, 10),
      updatedAt: template.updatedAt ?? new Date().toISOString().slice(0, 10),
      exercises: migrateExercises(template.exercises)
    })),
    completedWorkouts: (raw.completedWorkouts ?? []).map((workout) => ({
      id: sanitizeId(workout.id),
      date: validDate(workout.date),
      day: workout.day,
      name: sanitizeText(workout.name, 100),
      exercises: migrateExercises(workout.exercises)
    })),
    cardioEntries: (raw.cardioEntries ?? []).map((entry) => ({
      id: sanitizeId(entry.id),
      date: validDate(entry.date),
      type: entry.type ?? "esteira",
      durationMin: boundedNumber(entry.durationMin, 0, 0, 600),
      intensity: entry.intensity === "leve" || entry.intensity === "forte" ? entry.intensity : "moderada",
      calories: boundedNumber(entry.calories, 0, 0, 5000),
      weightKg: boundedNumber(entry.weightKg, 0, 30, 300),
      speedKmH: entry.speedKmH ? boundedNumber(entry.speedKmH, 0, 0, 40) : undefined,
      inclinePercent: entry.inclinePercent ? boundedNumber(entry.inclinePercent, 0, 0, 40) : undefined,
      distanceKm: entry.distanceKm ? boundedNumber(entry.distanceKm, 0, 0, 200) : undefined,
      resistance: sanitizeText(entry.resistance, 40),
      pace: sanitizeText(entry.pace, 40),
      floorsOrSteps: sanitizeText(entry.floorsOrSteps, 40),
      treadmillMode: entry.treadmillMode === "corrida" ? "corrida" : entry.treadmillMode === "caminhada" ? "caminhada" : undefined,
      notes: sanitizeText(entry.notes, 180),
      explanation: sanitizeText(entry.explanation, 260)
    }))
  };
}

export function loadData(fallback: FitnessData): FitnessData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredData;
    if (!parsed || !Array.isArray(parsed.foods)) {
      return fallback;
    }
    return migrateData(parsed, fallback);
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(CORRUPTED_STORAGE_KEY, raw.slice(0, MAX_BACKUP_BYTES));
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage pode estar indisponível; mantém fallback.
    }
    return fallback;
  }
}

export function persistData(data: FitnessData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Mantém a app em memória se o armazenamento local falhar.
  }
}

export function exportBackup(data: FitnessData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `travizani-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function parseBackup(file: File): Promise<FitnessData> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error("Backup muito grande para importar com segurança.");
  }
  let candidate: StoredData;
  try {
    candidate = JSON.parse(await file.text()) as StoredData;
  } catch {
    throw new Error("O ficheiro não contém JSON válido.");
  }
  if (
    !candidate ||
    !Array.isArray(candidate.foods) ||
    !Array.isArray(candidate.workouts) ||
    typeof candidate.logs !== "object"
  ) {
    throw new Error("O ficheiro não contém um backup válido do Travizani Fitness.");
  }
  return migrateData(candidate, {
    version: 2,
    theme: "light",
    streak: { current: 0, best: 0, updatedAt: new Date().toISOString().slice(0, 10) },
    profile: null,
    foods: candidate.foods,
    logs: {},
    weights: [],
    measurements: [],
    workouts: [],
    workoutTemplates: [],
    completedWorkouts: [],
    cardioEntries: []
  });
}
