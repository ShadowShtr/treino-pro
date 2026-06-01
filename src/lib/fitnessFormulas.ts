import type { ActivityLevel, NutritionTargets, Objective, Profile, Somatotype } from "../types";

/**
 * Fatores fixos utilizados para estimar gasto energético diário (TDEE).
 * O valor multiplica a TMB calculada pela fórmula de Mifflin-St Jeor.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muito_intenso: 1.9
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
  muito_intenso: "Muito intenso"
};

/**
 * Ajuste calórico fixo por objetivo, aplicado ao TDEE.
 * 1 representa manutenção; valores abaixo/acima representam défice/superávit.
 */
export const OBJECTIVE_FACTORS: Record<Objective, number> = {
  manter: 1,
  ganho_controlado: 1.1,
  perda_controlada: 0.85,
  recomposicao: 0.95
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  manter: "Manter peso",
  ganho_controlado: "Ganho controlado",
  perda_controlada: "Perda controlada",
  recomposicao: "Recomposição corporal"
};

export const SOMATOTYPE_LABELS: Record<Somatotype, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
  nao_sei: "Não sei"
};

export const SOMATOTYPE_DESCRIPTIONS: Record<Somatotype, string> = {
  ectomorfo: "Estrutura geralmente mais leve, tendência a menor peso corporal e maior dificuldade de ganho de massa.",
  mesomorfo: "Estrutura geralmente mais atlética, boa resposta ao treino de força e facilidade relativa para ganhar massa.",
  endomorfo: "Estrutura geralmente mais robusta, maior tendência a acúmulo de peso e necessidade de controle calórico mais atento.",
  nao_sei: "Não aplicar ajuste de biotipo."
};

export function calculateSomatotypeAdjustment(objective: Objective, somatotype: Somatotype = "nao_sei"): number {
  const table: Record<Objective, Record<Somatotype, number>> = {
    manter: { ectomorfo: 0.02, mesomorfo: 0, endomorfo: -0.02, nao_sei: 0 },
    ganho_controlado: { ectomorfo: 0.05, mesomorfo: 0, endomorfo: -0.03, nao_sei: 0 },
    perda_controlada: { ectomorfo: 0.03, mesomorfo: 0, endomorfo: -0.03, nao_sei: 0 },
    recomposicao: { ectomorfo: 0.03, mesomorfo: 0, endomorfo: -0.02, nao_sei: 0 }
  };
  return table[objective][somatotype];
}

/**
 * Proteína diária em g/kg segundo o objetivo definido.
 * As quantidades permanecem dentro do uso comum para pessoas que treinam,
 * com valor superior em défice para auxiliar a preservação de massa magra.
 */
export const PROTEIN_FACTORS: Record<Objective, number> = {
  manter: 1.8,
  ganho_controlado: 2,
  perda_controlada: 2.2,
  recomposicao: 2
};

const DEFAULT_FAT_FACTOR = 0.8;
const MINIMUM_FAT_FACTOR = 0.6;

/**
 * Taxa Metabólica Basal por Mifflin-St Jeor.
 * Homem: 10*peso + 6.25*altura - 5*idade + 5
 * Mulher: 10*peso + 6.25*altura - 5*idade - 161
 */
export function calculateBmr(profile: Pick<Profile, "pesoAtual" | "altura" | "idade" | "sexo">): number {
  const sexAdjustment = profile.sexo === "masculino" ? 5 : -161;
  return 10 * profile.pesoAtual + 6.25 * profile.altura - 5 * profile.idade + sexAdjustment;
}

/** Gasto energético diário estimado = TMB * fator de atividade. */
export function calculateTdee(profile: Profile): number {
  return calculateBmr(profile) * ACTIVITY_FACTORS[profile.atividade];
}

/**
 * Água base diária = peso corporal * 35 ml.
 * Em dias com treino concluído acrescentam-se 500 ml.
 */
export function calculateWaterTarget(profile: Pick<Profile, "pesoAtual">, trained = false): number {
  return Math.round(profile.pesoAtual * 35 + (trained ? 500 : 0));
}

/**
 * Calcula metas nutricionais diárias:
 * - Calorias: TDEE multiplicado pelo ajuste fixo do objetivo.
 * - Proteína: peso * fator do objetivo.
 * - Gordura: peso * 0.8 g; se não sobrarem calorias para carboidratos,
 *   reduz para o mínimo técnico previsto de 0.6 g/kg e recalcula.
 * - Carboidrato: calorias restantes depois de proteína (4 kcal/g)
 *   e gordura (9 kcal/g), nunca abaixo de zero.
 */
export function calculateTargets(profile: Profile): NutritionTargets {
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(profile);
  const objectiveFactor = OBJECTIVE_FACTORS[profile.objetivo];
  const baseCalories = tdee * objectiveFactor;
  const somatotypeAdjustmentPercent = calculateSomatotypeAdjustment(profile.objetivo, profile.biotipo ?? "nao_sei");
  const somatotypeAdjustmentCalories = baseCalories * somatotypeAdjustmentPercent;
  const calories = baseCalories + somatotypeAdjustmentCalories;
  const proteinFactor = PROTEIN_FACTORS[profile.objetivo];
  const protein = profile.pesoAtual * proteinFactor;
  let fatFactor = DEFAULT_FAT_FACTOR;
  let fats = profile.pesoAtual * fatFactor;
  let carbCalories = calories - protein * 4 - fats * 9;

  if (carbCalories < 0) {
    fatFactor = MINIMUM_FAT_FACTOR;
    fats = profile.pesoAtual * fatFactor;
    carbCalories = calories - protein * 4 - fats * 9;
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    baseCalories: Math.round(baseCalories),
    somatotypeAdjustmentPercent,
    somatotypeAdjustmentCalories: Math.round(somatotypeAdjustmentCalories),
    protein: Math.round(protein),
    carbs: Math.round(Math.max(0, carbCalories) / 4),
    fats: Math.round(fats),
    waterMl: calculateWaterTarget(profile),
    activityFactor: ACTIVITY_FACTORS[profile.atividade],
    objectiveFactor,
    proteinFactor,
    fatFactor
  };
}
