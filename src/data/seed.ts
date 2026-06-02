import { baseFoods } from "./foods";
import { offsetDate, todayISO, weekdayForDate } from "../lib/date";
import type {
  DayLog,
  FitnessData,
  MealItem,
  Measurements,
  Profile,
  WorkoutExercise,
  WorkoutPlan
} from "../types";

export const emptyMeasurements: Measurements = {
  cintura: 0,
  abdomen: 0,
  peito: 0,
  braco: 0,
  antebraco: 0,
  coxa: 0,
  panturrilha: 0,
  gluteo: 0,
  pescoco: 0,
  gordura: 0
};

function exercise(name: string, sets = 3, repetitions = "10-12", load = "", notes = ""): WorkoutExercise {
  return { id: crypto.randomUUID(), name, sets, repetitions, load, notes };
}

export const exampleWorkouts: WorkoutPlan[] = [
  { day: "segunda", name: "Peito e tríceps", exercises: [
    exercise("Supino reto", 4, "10", "40 kg", "Controlar descida"),
    exercise("Supino inclinado", 3, "10-12"),
    exercise("Crucifixo", 3, "12"),
    exercise("Tríceps pulley", 3, "12")
  ] },
  { day: "terca", name: "Costas e bíceps", exercises: [
    exercise("Puxada alta", 4, "10"),
    exercise("Remada baixa", 3, "12"),
    exercise("Remada curvada", 3, "10"),
    exercise("Rosca direta", 3, "12")
  ] },
  { day: "quarta", name: "Descanso", exercises: [] },
  { day: "quinta", name: "Pernas", exercises: [
    exercise("Agachamento livre", 4, "8-10"),
    exercise("Leg press", 4, "12"),
    exercise("Cadeira extensora", 3, "12"),
    exercise("Mesa flexora", 3, "12")
  ] },
  { day: "sexta", name: "Ombros e core", exercises: [
    exercise("Desenvolvimento", 4, "10"),
    exercise("Elevação lateral", 3, "12"),
    exercise("Abdominal supra", 3, "15"),
    exercise("Prancha", 3, "45 s")
  ] },
  { day: "sabado", name: "Cardio leve", exercises: [exercise("Esteira", 1, "30 min")] },
  { day: "domingo", name: "Descanso", exercises: [] }
];

export function emptyData(): FitnessData {
  return {
    version: 2,
    theme: "light",
    streak: { current: 0, best: 0, updatedAt: todayISO() },
    profile: null,
    foods: [...baseFoods],
    favoriteFoods: [],
    logs: {},
    weights: [],
    measurements: [],
    workouts: exampleWorkouts,
    workoutTemplates: [],
    completedWorkouts: [],
    cardioEntries: []
  };
}

function item(foodId: string, quantity: number, measure: "g" | "unit" = "g"): MealItem {
  const food = baseFoods.find((candidate) => candidate.id === foodId)!;
  return { id: crypto.randomUUID(), food, quantity, measure };
}

function demoDay(date: string, offset: number): DayLog {
  return {
    date,
    creatine: offset !== -3,
    waterMl: Math.max(1250, 2500 + offset * 100),
    meals: {
      refeicao1: [item("pao-frances", 1, "unit"), item("ovo", 2, "unit"), item("banana-prata", 1, "unit")],
      refeicao2: [item("arroz-branco", 150 + offset * 3), item("feijao-carioca", 100), item("frango-grelhado", 160)],
      refeicao3: [item("batata-doce", 180), item("patinho", 130), item("brocolis", 80)]
    }
  };
}

export function demoData(): FitnessData {
  const profile: Profile = {
    nome: "Rafael",
    idade: 31,
    sexo: "masculino",
    altura: 178,
    pesoAtual: 82.4,
    pesoDesejado: 78,
    objetivo: "perda_controlada",
    atividade: "moderado",
    frequenciaTreino: 4,
    createdAt: todayISO()
  };
  const dates = [-6, -5, -4, -3, -2, -1, 0].map(offsetDate);
  const logs = Object.fromEntries(dates.map((date, index) => [date, demoDay(date, index - 6)]));
  return {
    version: 2,
    theme: "light",
    streak: { current: 0, best: 0, updatedAt: todayISO() },
    profile,
    foods: [...baseFoods],
    logs,
    weights: [
      { id: crypto.randomUUID(), date: offsetDate(-21), weight: 84.1 },
      { id: crypto.randomUUID(), date: offsetDate(-14), weight: 83.5 },
      { id: crypto.randomUUID(), date: offsetDate(-7), weight: 82.9 },
      { id: crypto.randomUUID(), date: todayISO(), weight: 82.4 }
    ],
    measurements: [
      {
        id: crypto.randomUUID(),
        date: offsetDate(-30),
        cintura: 91,
        abdomen: 94,
        peito: 104,
        braco: 36,
        antebraco: 29,
        coxa: 59,
        panturrilha: 39,
        gluteo: 101,
        pescoco: 39,
        gordura: 20
      },
      {
        id: crypto.randomUUID(),
        date: todayISO(),
        cintura: 88,
        abdomen: 91,
        peito: 103,
        braco: 36,
        antebraco: 29,
        coxa: 58,
        panturrilha: 39,
        gluteo: 99,
        pescoco: 38,
        gordura: 18.5
      }
    ],
    workouts: exampleWorkouts,
    workoutTemplates: [],
    completedWorkouts: [-5, -3, -1].map((offset) => {
      const date = offsetDate(offset);
      const day = weekdayForDate(date);
      const workout = exampleWorkouts.find((entry) => entry.day === day) ?? exampleWorkouts[0];
      return {
        id: crypto.randomUUID(),
        date,
        day,
        name: workout.name,
        exercises: workout.exercises.map((entry) => ({ ...entry, id: crypto.randomUUID() }))
      };
    }),
    cardioEntries: []
  };
}
