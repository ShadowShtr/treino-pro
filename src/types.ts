export type TabId = "home" | "food" | "training" | "cardio" | "progress" | "profile";
export type AppTheme = "light" | "dark" | "system";
export type Objective = "manter" | "ganho_controlado" | "perda_controlada" | "recomposicao";
export type Sex = "masculino" | "feminino";
export type Somatotype = "ectomorfo" | "mesomorfo" | "endomorfo" | "nao_sei";
export type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso" | "muito_intenso";
export type CardioType = "esteira" | "bike" | "eliptico" | "escada" | "remo" | "air_bike" | "simulador_caminhada";
export type CardioIntensity = "leve" | "moderada" | "forte";
export type TreadmillMode = "caminhada" | "corrida";
export type Weekday =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

export interface Measurements {
  cintura: number;
  abdomen: number;
  peito: number;
  braco: number;
  antebraco: number;
  coxa: number;
  panturrilha: number;
  gluteo: number;
  pescoco: number;
  gordura: number;
}

export interface Profile {
  nome: string;
  idade: number;
  sexo: Sex;
  altura: number;
  pesoAtual: number;
  pesoDesejado: number;
  biotipo?: Somatotype;
  objetivo: Objective;
  atividade: ActivityLevel;
  frequenciaTreino: number;
  createdAt: string;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  baseCalories: number;
  somatotypeAdjustmentPercent: number;
  somatotypeAdjustmentCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterMl: number;
  activityFactor: number;
  objectiveFactor: number;
  proteinFactor: number;
  fatFactor: number;
}

export interface Food {
  id: string;
  nome: string;
  baseGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  unitName?: string;
  gramsPerUnit?: number;
  custom?: boolean;
}

export interface MealItem {
  id: string;
  food: Food;
  quantity: number;
  measure: "g" | "unit";
}

export interface DayMeals {
  refeicao1: MealItem[];
  refeicao2: MealItem[];
  refeicao3: MealItem[];
}

export interface DayLog {
  date: string;
  meals: DayMeals;
  creatine: boolean | null;
  waterMl: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface MeasurementEntry extends Measurements {
  id: string;
  date: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  repetitions: string;
  load?: string;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlan {
  day: Weekday;
  name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutCompletion {
  id: string;
  date: string;
  day: Weekday;
  name: string;
  exercises: WorkoutExercise[];
}

export interface CardioEntry {
  id: string;
  date: string;
  type: CardioType;
  durationMin: number;
  intensity: CardioIntensity;
  calories: number;
  weightKg: number;
  speedKmH?: number;
  inclinePercent?: number;
  distanceKm?: number;
  resistance?: string;
  pace?: string;
  floorsOrSteps?: string;
  treadmillMode?: TreadmillMode;
  notes?: string;
  explanation: string;
}

export interface StreakStats {
  current: number;
  best: number;
  updatedAt: string;
}

export interface FitnessData {
  version: number;
  theme: AppTheme;
  streak: StreakStats;
  profile: Profile | null;
  foods: Food[];
  logs: Record<string, DayLog>;
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  workouts: WorkoutPlan[];
  workoutTemplates: WorkoutTemplate[];
  completedWorkouts: WorkoutCompletion[];
  cardioEntries: CardioEntry[];
}

export type SyncState = "local" | "syncing" | "synced" | "pending" | "error";

export interface SyncStatus {
  configured: boolean;
  authenticated: boolean;
  state: SyncState;
  userEmail: string | null;
  lastSyncedAt: string | null;
  message: string;
}
