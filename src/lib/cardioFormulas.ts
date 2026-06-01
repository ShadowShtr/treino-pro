import type { CardioEntry, CardioIntensity, CardioType, TreadmillMode } from "../types";

export const CARDIO_LABELS: Record<CardioType, string> = {
  esteira: "Esteira",
  bike: "Bike ergométrica",
  eliptico: "Elíptico",
  escada: "Escada",
  remo: "Remo",
  air_bike: "Air bike",
  simulador_caminhada: "Simulador de caminhada"
};

const MET_VALUES: Record<CardioType, Record<CardioIntensity, number>> = {
  esteira: { leve: 3, moderada: 5, forte: 8 },
  bike: { leve: 4, moderada: 6, forte: 8 },
  eliptico: { leve: 4.5, moderada: 5.5, forte: 7 },
  escada: { leve: 6, moderada: 8.8, forte: 10 },
  remo: { leve: 4.8, moderada: 7, forte: 8.5 },
  air_bike: { leve: 5, moderada: 8, forte: 10.5 },
  simulador_caminhada: { leve: 3, moderada: 5, forte: 7 }
};

export function classifyTreadmillMode(speedKmH: number): TreadmillMode {
  return speedKmH < 8 ? "caminhada" : "corrida";
}

export function calculateTreadmillCalories({
  speedKmH,
  inclinePercent = 0,
  weightKg,
  durationMin,
  mode
}: {
  speedKmH: number;
  inclinePercent?: number;
  weightKg: number;
  durationMin: number;
  mode?: TreadmillMode;
}): number {
  const speedMMin = speedKmH * 1000 / 60;
  const grade = inclinePercent / 100;
  const treadmillMode = mode ?? classifyTreadmillMode(speedKmH);
  const vo2 = treadmillMode === "caminhada"
    ? 3.5 + 0.1 * speedMMin + 1.8 * speedMMin * grade
    : 3.5 + 0.2 * speedMMin + 0.9 * speedMMin * grade;
  return Math.round(((vo2 * weightKg * 5) / 1000) * durationMin);
}

export function getCardioMetValue(type: CardioType, intensity: CardioIntensity): number {
  return MET_VALUES[type][intensity];
}

export function calculateMetCalories(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

export function estimateCardioCalories(entry: {
  type: CardioType;
  intensity: CardioIntensity;
  durationMin: number;
  weightKg: number;
  speedKmH?: number;
  inclinePercent?: number;
  treadmillMode?: TreadmillMode;
}): number {
  if (entry.type === "esteira" && entry.speedKmH && entry.speedKmH > 0) {
    return calculateTreadmillCalories(entry as Parameters<typeof calculateTreadmillCalories>[0]);
  }
  return calculateMetCalories(getCardioMetValue(entry.type, entry.intensity), entry.weightKg, entry.durationMin);
}

export function generateCardioExplanation(entry: Pick<CardioEntry, "type" | "intensity" | "speedKmH" | "inclinePercent" | "weightKg" | "durationMin" | "treadmillMode">): string {
  if (entry.type === "esteira" && entry.speedKmH && entry.speedKmH > 0) {
    const mode = entry.treadmillMode ?? classifyTreadmillMode(entry.speedKmH);
    return `Estimativa por VO2 de ${mode}: velocidade ${entry.speedKmH} km/h, inclinação ${entry.inclinePercent ?? 0}%, peso ${entry.weightKg} kg e duração ${entry.durationMin} min.`;
  }
  const met = getCardioMetValue(entry.type, entry.intensity);
  return `Estimativa por MET (${met}) usando tipo de cardio, intensidade, peso ${entry.weightKg} kg e duração ${entry.durationMin} min.`;
}
