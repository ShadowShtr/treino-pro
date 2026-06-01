import type {
  DayLog,
  FitnessData,
  MealItem,
  NutritionTargets
} from "../types";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function macrosForItem(item: MealItem): Macros {
  const grams =
    item.measure === "unit"
      ? item.quantity * (item.food.gramsPerUnit ?? item.food.baseGrams)
      : item.quantity;
  const factor = grams / item.food.baseGrams;
  return {
    calories: item.food.calories * factor,
    protein: item.food.protein * factor,
    carbs: item.food.carbs * factor,
    fats: item.food.fats * factor
  };
}

export function addMacros(values: Macros[]): Macros {
  return values.reduce(
    (result, item) => ({
      calories: result.calories + item.calories,
      protein: result.protein + item.protein,
      carbs: result.carbs + item.carbs,
      fats: result.fats + item.fats
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function macrosForLog(log?: DayLog): Macros {
  if (!log) return addMacros([]);
  return addMacros(
    Object.values(log.meals)
      .flat()
      .map(macrosForItem)
  );
}

export function completedMeals(log?: DayLog): number {
  return log ? Object.values(log.meals).filter((meal) => meal.length > 0).length : 0;
}

export function monthlySummary(data: FitnessData, month: string, targets?: NutritionTargets) {
  const logs = Object.values(data.logs).filter((entry) => entry.date.startsWith(month));
  const totals = addMacros(logs.map(macrosForLog));
  const daysWithMeals = logs.filter((entry) => completedMeals(entry) > 0);
  const daysWithTracking = logs.filter(
    (entry) => completedMeals(entry) > 0 || entry.waterMl > 0 || entry.creatine !== null
  );
  const divisor = Math.max(daysWithMeals.length, 1);
  const trackingDivisor = Math.max(daysWithTracking.length, 1);
  const weights = data.weights
    .filter((entry) => entry.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = data.completedWorkouts.filter((entry) => entry.date.startsWith(month));
  const successfulDays = targets
    ? daysWithMeals.filter((entry) => {
        const macros = macrosForLog(entry);
        return (
          Math.abs(macros.calories - targets.calories) <= targets.calories * 0.1 &&
          macros.protein >= targets.protein * 0.9
        );
      }).length
    : 0;
  return {
    avgCalories: Math.round(totals.calories / divisor),
    avgProtein: Math.round(totals.protein / divisor),
    avgWater: Math.round(logs.reduce((total, entry) => total + entry.waterMl, 0) / trackingDivisor),
    daysTracked: daysWithMeals.length,
    completedWorkouts: completed.length,
    creatineDays: logs.filter((entry) => entry.creatine === true).length,
    successfulDays,
    initialWeight: weights.at(0)?.weight,
    finalWeight: weights.at(-1)?.weight,
    weightDifference:
      weights.length > 1 ? Number((weights.at(-1)!.weight - weights[0].weight).toFixed(1)) : null
  };
}
