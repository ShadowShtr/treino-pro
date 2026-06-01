import { useEffect, useMemo, useRef, useState } from "react";
import { emptyData } from "../data/seed";
import { todayISO, weekdayForDate } from "../lib/date";
import { loadData, persistData, secureWorkoutTemplate } from "../lib/storage";
import {
  getCurrentUser,
  getCloudAppDataWithMeta,
  getSyncStatus,
  hasMeaningfulCloudData,
  hasMeaningfulLocalData,
  saveCloudAppData,
  signInWithEmail,
  signOut as signOutFromCloud,
  signUpWithEmail,
  syncAppData
} from "../lib/syncService";
import type {
  AppTheme,
  DayLog,
  FitnessData,
  CardioEntry,
  Food,
  MealItem,
  MeasurementEntry,
  Measurements,
  Profile,
  StreakStats,
  SyncStatus,
  Weekday,
  WeightEntry,
  WorkoutPlan,
  WorkoutTemplate
} from "../types";

type MealId = keyof DayLog["meals"];
export type ResetScope = "alimentacao" | "treinos" | "evolucao" | "agua_creatina" | "tudo";
export type AuthSyncResult = "cloud-applied" | "choice-needed" | "local-only";

function blankLog(date: string): DayLog {
  return {
    date,
    meals: { refeicao1: [], refeicao2: [], refeicao3: [] },
    creatine: null,
    waterMl: 0
  };
}

function compactLogs(logs: Record<string, DayLog>): Record<string, DayLog> {
  return Object.fromEntries(
    Object.entries(logs).filter(([, log]) =>
      Object.values(log.meals).some((meal) => meal.length > 0) ||
      log.waterMl > 0 ||
      log.creatine !== null
    )
  );
}

function hasImportantAction(data: FitnessData, date: string): boolean {
  const log = data.logs[date];
  return (
    (log ? Object.values(log.meals).some((meal) => meal.length > 0) : false) ||
    (log?.waterMl ?? 0) > 0 ||
    log?.creatine === true ||
    data.weights.some((entry) => entry.date === date) ||
    data.completedWorkouts.some((entry) => entry.date === date) ||
    data.cardioEntries.some((entry) => entry.date === date)
  );
}

function calculateStreak(data: FitnessData): StreakStats {
  const dates = new Set([
    ...Object.keys(data.logs),
    ...data.weights.map((entry) => entry.date),
    ...data.completedWorkouts.map((entry) => entry.date),
    ...data.cardioEntries.map((entry) => entry.date)
  ]);
  const activeDates = [...dates].filter((date) => hasImportantAction(data, date)).sort();
  let best = 0;
  let run = 0;
  let previous = "";
  for (const date of activeDates) {
    const expected = previous ? new Date(`${previous}T12:00:00`) : null;
    expected?.setDate(expected.getDate() + 1);
    run = expected && expected.toISOString().slice(0, 10) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  let current = 0;
  const cursor = new Date(`${todayISO()}T12:00:00`);
  while (hasImportantAction(data, cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best, updatedAt: todayISO() };
}

function hasMinimumProfile(profile: Profile): boolean {
  return (
    Number.isFinite(profile.idade) && profile.idade > 0 &&
    Number.isFinite(profile.altura) && profile.altura > 0 &&
    Number.isFinite(profile.pesoAtual) && profile.pesoAtual > 0
  );
}

export function useFitnessData() {
  const [data, setData] = useState<FitnessData>(() => loadData(emptyData()));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatus());
  const syncTimer = useRef<number | null>(null);
  const readyForCloudSync = useRef(false);
  const restoringFromCloud = useRef(false);

  function sameData(left: FitnessData | null, right: FitnessData | null) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function applyRemoteData(remoteData: FitnessData, updatedAt?: string | null) {
    restoringFromCloud.current = true;
    setData(remoteData);
    persistData(remoteData);
    setSyncStatus((current) => ({
      ...current,
      authenticated: true,
      state: "synced",
      lastSyncedAt: updatedAt ?? current.lastSyncedAt ?? new Date().toISOString(),
      message: "Dados sincronizados com a nuvem."
    }));
    window.setTimeout(() => {
      restoringFromCloud.current = false;
    }, 0);
  }

  async function restoreAfterAuth(email?: string | null): Promise<AuthSyncResult> {
    setSyncStatus((current) => ({
      ...current,
      authenticated: true,
      userEmail: email ?? current.userEmail,
      state: "syncing",
      message: "Carregando dados da nuvem..."
    }));
    try {
      const cloud = await getCloudAppDataWithMeta();
      const cloudHasData = hasMeaningfulCloudData(cloud.data);
      const localHasData = hasMeaningfulLocalData(data);

      if (cloudHasData && (!localHasData || sameData(cloud.data, data))) {
        applyRemoteData(cloud.data!, cloud.updatedAt);
        return "cloud-applied";
      }

      if (cloudHasData && localHasData) {
        setSyncStatus((current) => ({
          ...current,
          authenticated: true,
          userEmail: email ?? current.userEmail,
          state: "pending",
          lastSyncedAt: cloud.updatedAt,
          message: "Encontramos dados neste dispositivo e na nuvem. Escolha qual deseja usar."
        }));
        return "choice-needed";
      }

      if (!cloudHasData && localHasData) {
        setSyncStatus((current) => ({
          ...current,
          authenticated: true,
          userEmail: email ?? current.userEmail,
          state: "pending",
          message: "Encontramos dados neste dispositivo. Você pode enviar para a nuvem."
        }));
        return "choice-needed";
      }

      setSyncStatus((current) => ({
        ...current,
        authenticated: true,
        userEmail: email ?? current.userEmail,
        state: "synced",
        message: "Conta conectada. Preencha o perfil para começar a sincronizar."
      }));
      return "local-only";
    } catch {
      setSyncStatus((current) => ({
        ...current,
        authenticated: true,
        userEmail: email ?? current.userEmail,
        state: "error",
        message: "Erro ao carregar dados da nuvem. Os dados locais continuam disponíveis."
      }));
      return "local-only";
    }
  }

  useEffect(() => {
    const next = calculateStreak(data);
    if (data.streak.current !== next.current || data.streak.best !== next.best || data.streak.updatedAt !== next.updatedAt) {
      setData((current) => ({ ...current, streak: next }));
    }
  }, [data]);

  useEffect(() => {
    persistData(data);
    if (restoringFromCloud.current) return;
    if (!readyForCloudSync.current || !syncStatus.authenticated) return;
    if (!hasMeaningfulLocalData(data)) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    setSyncStatus((current) => ({ ...current, state: "syncing", message: "Sincronizando..." }));
    syncTimer.current = window.setTimeout(() => {
      syncAppData(data).then(setSyncStatus);
    }, 900);
  }, [data, syncStatus.authenticated]);

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        await restoreAfterAuth(user.email);
      } else {
        setSyncStatus((current) => ({
          ...current,
          authenticated: false,
          userEmail: null,
          state: "local",
          message: current.configured
            ? "Dados guardados apenas neste dispositivo. Faça login para sincronizar com a nuvem."
            : "Supabase não configurado. O app está funcionando apenas localmente."
        }));
      }
      readyForCloudSync.current = true;
    });
  }, []);

  const update = (recipe: (draft: FitnessData) => FitnessData) => setData((current) => recipe(current));

  const actions = useMemo(
    () => ({
      replace(next: FitnessData) {
        setData(next);
        if (syncStatus.authenticated) {
          syncAppData(next).then(setSyncStatus);
        }
      },
      clear() {
        setData(emptyData());
      },
      setTheme(theme: AppTheme) {
        update((current) => ({ ...current, theme }));
      },
      resetRecords(scope: ResetScope) {
        if (scope === "tudo") {
          setData(emptyData());
          return;
        }
        update((current) => {
          if (scope === "alimentacao") {
            const logs = Object.fromEntries(
              Object.entries(current.logs).map(([date, log]) => [
                date,
                { ...log, meals: { refeicao1: [], refeicao2: [], refeicao3: [] } }
              ])
            );
            return { ...current, logs: compactLogs(logs) };
          }
          if (scope === "treinos") {
            return {
              ...current,
              workouts: current.workouts.map((workout) => ({ ...workout, name: "", exercises: [] })),
              completedWorkouts: []
            };
          }
          if (scope === "evolucao") {
            return { ...current, weights: [], measurements: [], cardioEntries: [] };
          }
          const logs = Object.fromEntries(
            Object.entries(current.logs).map(([date, log]) => [
              date,
              { ...log, waterMl: 0, creatine: null }
            ])
          );
          return { ...current, logs: compactLogs(logs) };
        });
      },
      createProfile(profile: Profile, measurements: Measurements) {
        if (!hasMinimumProfile(profile)) {
          window.alert("Preencha idade, altura e peso atual para calcular as metas iniciais.");
          return false;
        }
        setData((current) => ({
          ...current,
          profile,
          weights: [{ id: crypto.randomUUID(), date: todayISO(), weight: profile.pesoAtual }],
          measurements: [
            { id: crypto.randomUUID(), date: todayISO(), ...measurements }
          ]
        }));
        return true;
      },
      saveProfile(profile: Profile) {
        if (!hasMinimumProfile(profile)) {
          window.alert("Idade, altura e peso atual precisam estar preenchidos para manter os cálculos.");
          return false;
        }
        update((current) => ({ ...current, profile }));
        return true;
      },
      saveWeight(entry: Omit<WeightEntry, "id">, id?: string) {
        if (!Number.isFinite(entry.weight) || entry.weight < 30 || entry.weight > 300) {
          window.alert("Peso inválido.");
          return false;
        }
        update((current) => {
          const weights = id
            ? current.weights.map((item) => (item.id === id ? { ...entry, id } : item))
            : [...current.weights, { ...entry, id: crypto.randomUUID() }];
          const latest = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0];
          return {
            ...current,
            weights,
            profile: current.profile && latest
              ? { ...current.profile, pesoAtual: latest.weight }
              : current.profile
          };
        });
        return true;
      },
      deleteWeight(id: string) {
        update((current) => {
          const weights = current.weights.filter((entry) => entry.id !== id);
          const latest = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0];
          return {
            ...current,
            weights,
            profile: current.profile && latest
              ? { ...current.profile, pesoAtual: latest.weight }
              : current.profile
          };
        });
      },
      saveMeasurement(entry: Omit<MeasurementEntry, "id">, id?: string) {
        update((current) => ({
          ...current,
          measurements: id
            ? current.measurements.map((item) => (item.id === id ? { ...entry, id } : item))
            : [...current.measurements, { ...entry, id: crypto.randomUUID() }]
        }));
      },
      deleteMeasurement(id: string) {
        update((current) => ({
          ...current,
          measurements: current.measurements.filter((entry) => entry.id !== id)
        }));
      },
      addItem(date: string, meal: MealId, item: Omit<MealItem, "id">) {
        update((current) => {
          const log = current.logs[date] ?? blankLog(date);
          return {
            ...current,
            logs: {
              ...current.logs,
              [date]: {
                ...log,
                meals: {
                  ...log.meals,
                  [meal]: [...log.meals[meal], { ...item, id: crypto.randomUUID() }]
                }
              }
            }
          };
        });
      },
      updateItem(date: string, meal: MealId, item: MealItem) {
        update((current) => {
          const log = current.logs[date] ?? blankLog(date);
          return {
            ...current,
            logs: {
              ...current.logs,
              [date]: {
                ...log,
                meals: {
                  ...log.meals,
                  [meal]: log.meals[meal].map((entry) => (entry.id === item.id ? item : entry))
                }
              }
            }
          };
        });
      },
      removeItem(date: string, meal: MealId, id: string) {
        update((current) => {
          const log = current.logs[date] ?? blankLog(date);
          return {
            ...current,
            logs: {
              ...current.logs,
              [date]: {
                ...log,
                meals: { ...log.meals, [meal]: log.meals[meal].filter((item) => item.id !== id) }
              }
            }
          };
        });
      },
      copyMeal(date: string, meal: MealId, sourceDate: string, sourceMeal: MealId) {
        update((current) => {
          const source = current.logs[sourceDate]?.meals[sourceMeal] ?? [];
          const target = current.logs[date] ?? blankLog(date);
          return {
            ...current,
            logs: {
              ...current.logs,
              [date]: {
                ...target,
                meals: {
                  ...target.meals,
                  [meal]: source.map((item) => ({ ...item, id: crypto.randomUUID() }))
                }
              }
            }
          };
        });
      },
      setCreatine(date: string, taken: boolean) {
        update((current) => {
          const log = current.logs[date] ?? blankLog(date);
          return { ...current, logs: { ...current.logs, [date]: { ...log, creatine: taken } } };
        });
        return true;
      },
      addWater(date: string, amount: number) {
        if (![250, 500, 750].includes(amount) && (amount < -10000 || amount > 10000)) {
          window.alert("Água inválida.");
          return false;
        }
        update((current) => {
          const log = current.logs[date] ?? blankLog(date);
          return {
            ...current,
            logs: {
              ...current.logs,
              [date]: { ...log, waterMl: Math.max(0, log.waterMl + amount) }
            }
          };
        });
        return true;
      },
      saveFood(food: Food) {
        update((current) => ({
          ...current,
          foods: current.foods.some((entry) => entry.id === food.id)
            ? current.foods.map((entry) => (entry.id === food.id ? food : entry))
            : [...current.foods, food]
        }));
      },
      deleteFood(id: string) {
        update((current) => ({
          ...current,
          foods: current.foods.filter((food) => food.id !== id || !food.custom)
        }));
      },
      saveWorkout(day: Weekday, plan: WorkoutPlan) {
        update((current) => ({
          ...current,
          workouts: current.workouts.map((workout) => (workout.day === day ? plan : workout))
        }));
      },
      copyWorkout(targetDay: Weekday, sourceDay: Weekday) {
        update((current) => {
          const source = current.workouts.find((workout) => workout.day === sourceDay);
          if (!source) return current;
          return {
            ...current,
            workouts: current.workouts.map((workout) =>
              workout.day === targetDay
                ? {
                    day: targetDay,
                    name: source.name,
                    exercises: source.exercises.map((exercise) => ({
                      ...exercise,
                      id: crypto.randomUUID()
                    }))
                  }
                : workout
            )
          };
        });
        return true;
      },
      saveWorkoutTemplate(template: WorkoutTemplate) {
        const today = todayISO();
        const safeTemplate = secureWorkoutTemplate({ ...template, updatedAt: today });
        update((current) => ({
          ...current,
          workoutTemplates: current.workoutTemplates.some((entry) => entry.id === safeTemplate.id)
            ? current.workoutTemplates.map((entry) => (entry.id === safeTemplate.id ? safeTemplate : entry))
            : [...current.workoutTemplates, safeTemplate]
        }));
        return true;
      },
      deleteWorkoutTemplate(id: string) {
        update((current) => ({
          ...current,
          workoutTemplates: current.workoutTemplates.filter((entry) => entry.id !== id)
        }));
      },
      duplicateWorkoutTemplate(id: string) {
        update((current) => {
          const template = current.workoutTemplates.find((entry) => entry.id === id);
          if (!template) return current;
          const today = todayISO();
          return {
            ...current,
            workoutTemplates: [
              ...current.workoutTemplates,
              {
                ...template,
                id: crypto.randomUUID(),
                name: `${template.name} cópia`,
                createdAt: today,
                updatedAt: today,
                exercises: template.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() }))
              }
            ]
          };
        });
      },
      copyWorkoutToTemplate(day: Weekday) {
        const today = todayISO();
        update((current) => {
          const workout = current.workouts.find((entry) => entry.day === day);
          if (!workout || workout.exercises.length === 0) return current;
          return {
            ...current,
            workoutTemplates: [
              ...current.workoutTemplates,
              {
                id: crypto.randomUUID(),
                name: workout.name || "Modelo de treino",
                createdAt: today,
                updatedAt: today,
                exercises: workout.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() }))
              }
            ]
          };
        });
        return true;
      },
      applyWorkoutTemplate(templateId: string, day: Weekday, mode: "replace" | "append") {
        update((current) => {
          const template = current.workoutTemplates.find((entry) => entry.id === templateId);
          if (!template) return current;
          return {
            ...current,
            workouts: current.workouts.map((workout) => {
              if (workout.day !== day) return workout;
              const exercises = template.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() }));
              return {
                ...workout,
                name: mode === "append" && workout.name ? workout.name : template.name,
                exercises: mode === "append" ? [...workout.exercises, ...exercises] : exercises
              };
            })
          };
        });
        return true;
      },
      completeWorkout(date: string) {
        update((current) => {
          const day = weekdayForDate(date);
          const workout = current.workouts.find((entry) => entry.day === day);
          if (!workout || workout.exercises.length === 0) return current;
          return {
            ...current,
            completedWorkouts: [
              ...current.completedWorkouts.filter((entry) => entry.date !== date),
              {
                id: crypto.randomUUID(),
                date,
                day,
                name: workout.name,
                exercises: workout.exercises.map((exercise) => ({ ...exercise }))
              }
            ]
          };
        });
      },
      undoWorkout(date: string) {
        update((current) => ({
          ...current,
          completedWorkouts: current.completedWorkouts.filter((entry) => entry.date !== date)
        }));
      },
      saveCardio(entry: Omit<CardioEntry, "id">, id?: string) {
        update((current) => ({
          ...current,
          cardioEntries: id
            ? current.cardioEntries.map((item) => (item.id === id ? { ...entry, id } : item))
            : [...current.cardioEntries, { ...entry, id: crypto.randomUUID() }]
        }));
        return true;
      },
      deleteCardio(id: string) {
        update((current) => ({
          ...current,
          cardioEntries: current.cardioEntries.filter((entry) => entry.id !== id)
        }));
      },
      async signUp(email: string, password: string) {
        const user = await signUpWithEmail(email, password);
        return restoreAfterAuth(user?.email ?? email);
      },
      async signIn(email: string, password: string) {
        const user = await signInWithEmail(email, password);
        return restoreAfterAuth(user?.email ?? email);
      },
      async signOut() {
        await signOutFromCloud();
        setSyncStatus(getSyncStatus());
      },
      async loadFromCloud() {
        const result = await getCloudAppDataWithMeta();
        const cloud = result.data;
        if (cloud) applyRemoteData(cloud, result.updatedAt);
        setSyncStatus((current) => ({
          ...current,
          state: cloud ? "synced" : "local",
          lastSyncedAt: cloud ? result.updatedAt ?? current.lastSyncedAt : current.lastSyncedAt,
          message: cloud ? "Dados da nuvem carregados." : "Nenhum dado encontrado na nuvem."
        }));
        return cloud;
      },
      async uploadToCloud() {
        setSyncStatus((current) => ({ ...current, state: "syncing", message: "Sincronizando..." }));
        setSyncStatus(await saveCloudAppData(data));
      },
      async syncNow() {
        setSyncStatus((current) => ({ ...current, state: "syncing", message: "Sincronizando..." }));
        setSyncStatus(await syncAppData(data));
      }
    }),
    [data, syncStatus.authenticated]
  );

  return { data, actions, syncStatus };
}
