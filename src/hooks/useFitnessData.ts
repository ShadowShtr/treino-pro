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
  signInWithGoogle,
  signUpWithEmail,
  signOut as signOutFromCloud,
  syncAppData
} from "../lib/syncService";
import type {
  AppTheme,
  CardioEntry,
  DayLog,
  FitnessData,
  Food,
  KanbanColumn,
  KanbanTask,
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
  return { date, meals: { refeicao1: [], refeicao2: [], refeicao3: [], refeicao4: [], refeicao5: [], refeicao6: [] }, creatine: null, waterMl: 0 };
}

function compactLogs(logs: Record<string, DayLog>): Record<string, DayLog> {
  return Object.fromEntries(
    Object.entries(logs).filter(([, log]) =>
      Object.values(log.meals).some((meal) => meal.length > 0) || log.waterMl > 0 || log.creatine !== null
    )
  );
}

function hasImportantAction(data: FitnessData, date: string): boolean {
  const log = data.logs[date];
  return (
    (log ? Object.values(log.meals).some((meal) => meal.length > 0) : false) ||
    (log?.waterMl ?? 0) > 0 || log?.creatine === true ||
    data.weights.some((e) => e.date === date) ||
    data.completedWorkouts.some((e) => e.date === date) ||
    data.cardioEntries.some((e) => e.date === date)
  );
}

function calculateStreak(data: FitnessData): StreakStats {
  const dates = new Set([
    ...Object.keys(data.logs),
    ...data.weights.map((e) => e.date),
    ...data.completedWorkouts.map((e) => e.date),
    ...data.cardioEntries.map((e) => e.date)
  ]);
  const activeDates = [...dates].filter((d) => hasImportantAction(data, d)).sort();
  let best = 0, run = 0, previous = "";
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
  const pendingConflict = useRef(false);
  const lastAutoSyncTime = useRef<number>(0);
  const lastManualSyncTime = useRef<number>(0);

  function sameData(a: FitnessData | null, b: FitnessData | null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function applyRemoteData(remoteData: FitnessData, updatedAt?: string | null) {
    restoringFromCloud.current = true;
    setData(remoteData);
    persistData(remoteData);
    setSyncStatus((cur) => ({ ...cur, authenticated: true, state: "synced", lastSyncedAt: updatedAt ?? cur.lastSyncedAt ?? new Date().toISOString(), message: "Dados sincronizados com a nuvem." }));
    window.setTimeout(() => { restoringFromCloud.current = false; }, 0);
  }

  async function restoreAfterAuth(email?: string | null): Promise<AuthSyncResult> {
    setSyncStatus((cur) => ({ ...cur, authenticated: true, userEmail: email ?? cur.userEmail, state: "syncing", message: "Carregando dados da nuvem..." }));
    try {
      const cloud = await getCloudAppDataWithMeta();
      const cloudHasData = hasMeaningfulCloudData(cloud.data);
      const localHasData = hasMeaningfulLocalData(data);

      // Cloud has data, local is empty → always use cloud
      if (cloudHasData && !localHasData) {
        applyRemoteData(cloud.data!, cloud.updatedAt);
        return "cloud-applied";
      }

      // Both have data
      if (cloudHasData && localHasData) {
        // Identical → just confirm sync
        if (sameData(cloud.data, data)) {
          applyRemoteData(cloud.data!, cloud.updatedAt);
          return "cloud-applied";
        }

        // Cloud updated AFTER our last sync → another device saved newer data → use cloud
        const lastSynced = syncStatus.lastSyncedAt;
        if (lastSynced && cloud.updatedAt && cloud.updatedAt > lastSynced) {
          applyRemoteData(cloud.data!, cloud.updatedAt);
          return "cloud-applied";
        }

        // Can't resolve automatically → show modal
        pendingConflict.current = true;
        setSyncStatus((cur) => ({ ...cur, authenticated: true, userEmail: email ?? cur.userEmail, state: "pending", lastSyncedAt: cloud.updatedAt, message: "Encontramos dados neste dispositivo e na nuvem. Escolha qual deseja usar." }));
        return "choice-needed";
      }

      // Cloud is empty, local has data → upload to cloud automatically
      if (!cloudHasData && localHasData) {
        try {
          const saved = await saveCloudAppData(data, { allowEmptyOverwrite: false });
          setSyncStatus({ ...saved, authenticated: true, userEmail: email ?? saved.userEmail });
        } catch {
          setSyncStatus((cur) => ({ ...cur, authenticated: true, userEmail: email ?? cur.userEmail, state: "error", message: "Erro ao enviar dados para a nuvem." }));
        }
        return "local-only";
      }

      // Neither has meaningful data
      setSyncStatus((cur) => ({ ...cur, authenticated: true, userEmail: email ?? cur.userEmail, state: "synced", message: "Conta conectada." }));
      return "local-only";
    } catch {
      setSyncStatus((cur) => ({ ...cur, authenticated: true, userEmail: email ?? cur.userEmail, state: "error", message: "Erro ao carregar dados da nuvem." }));
      return "local-only";
    }
  }

  // Check Supabase session on startup
  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        await restoreAfterAuth(user.email);
      } else {
        setSyncStatus((cur) => ({ ...cur, authenticated: false, userEmail: null, state: "local", message: cur.configured ? "Dados guardados apenas neste dispositivo. Faça login para sincronizar." : "Sincronização não configurada. App funcionando localmente." }));
      }
      readyForCloudSync.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Streak recalculation
  useEffect(() => {
    const next = calculateStreak(data);
    if (data.streak.current !== next.current || data.streak.best !== next.best || data.streak.updatedAt !== next.updatedAt) {
      setData((cur) => ({ ...cur, streak: next }));
    }
  }, [data]);

  // Track conflict state via ref so the auto-sync effect can read it without causing loops
  useEffect(() => {
    pendingConflict.current = syncStatus.state === "pending";
  }, [syncStatus.state]);

  // Auto-sync on data change
  useEffect(() => {
    persistData(data);
    if (restoringFromCloud.current) return;
    if (!readyForCloudSync.current || !syncStatus.authenticated) return;
    if (pendingConflict.current) return;
    if (!hasMeaningfulLocalData(data)) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    const now = Date.now();
    if (now - lastAutoSyncTime.current < 5000) return;
    setSyncStatus((cur) => ({ ...cur, state: "syncing", message: "Sincronizando..." }));
    syncTimer.current = window.setTimeout(() => {
      lastAutoSyncTime.current = Date.now();
      syncAppData(data).then(setSyncStatus);
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, syncStatus.authenticated]);

  const update = (recipe: (draft: FitnessData) => FitnessData) => setData((cur) => recipe(cur));

  const actions = useMemo(
    () => ({
      replace(next: FitnessData) {
        setData(next);
        if (syncStatus.authenticated) syncAppData(next).then(setSyncStatus);
      },
      clear() { setData(emptyData()); },
      setTheme(theme: AppTheme) { update((cur) => ({ ...cur, theme })); },
      resetRecords(scope: ResetScope) {
        if (scope === "tudo") { setData(emptyData()); return; }
        update((cur) => {
          if (scope === "alimentacao") {
            const logs = Object.fromEntries(
              Object.entries(cur.logs).map(([date, log]) => [date, { ...log, meals: { refeicao1: [], refeicao2: [], refeicao3: [], refeicao4: [], refeicao5: [], refeicao6: [] } }])
            );
            return { ...cur, logs: compactLogs(logs) };
          }
          if (scope === "treinos") {
            return { ...cur, workouts: cur.workouts.map((w) => ({ ...w, name: "", exercises: [] })), completedWorkouts: [] };
          }
          if (scope === "evolucao") {
            return { ...cur, weights: [], measurements: [], cardioEntries: [] };
          }
          const logs = Object.fromEntries(
            Object.entries(cur.logs).map(([date, log]) => [date, { ...log, waterMl: 0, creatine: null }])
          );
          return { ...cur, logs: compactLogs(logs) };
        });
      },
      createProfile(profile: Profile, measurements: Measurements) {
        if (!hasMinimumProfile(profile)) { window.alert("Preencha idade, altura e peso atual."); return false; }
        setData((cur) => ({
          ...cur, profile,
          weights: [{ id: crypto.randomUUID(), date: todayISO(), weight: profile.pesoAtual }],
          measurements: [{ id: crypto.randomUUID(), date: todayISO(), ...measurements }]
        }));
        return true;
      },
      saveProfile(profile: Profile) {
        if (!hasMinimumProfile(profile)) { window.alert("Idade, altura e peso atual são obrigatórios."); return false; }
        update((cur) => ({ ...cur, profile }));
        return true;
      },
      saveWeight(entry: Omit<WeightEntry, "id">, id?: string) {
        if (!Number.isFinite(entry.weight) || entry.weight < 30 || entry.weight > 300) { window.alert("Peso inválido."); return false; }
        update((cur) => {
          const weights = id
            ? cur.weights.map((w) => (w.id === id ? { ...entry, id } : w))
            : [...cur.weights, { ...entry, id: crypto.randomUUID() }];
          const latest = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0];
          return { ...cur, weights, profile: cur.profile && latest ? { ...cur.profile, pesoAtual: latest.weight } : cur.profile };
        });
        return true;
      },
      deleteWeight(id: string) {
        update((cur) => {
          const weights = cur.weights.filter((w) => w.id !== id);
          const latest = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0];
          return { ...cur, weights, profile: cur.profile && latest ? { ...cur.profile, pesoAtual: latest.weight } : cur.profile };
        });
      },
      saveMeasurement(entry: Omit<MeasurementEntry, "id">, id?: string) {
        update((cur) => ({
          ...cur,
          measurements: id
            ? cur.measurements.map((m) => (m.id === id ? { ...entry, id } : m))
            : [...cur.measurements, { ...entry, id: crypto.randomUUID() }]
        }));
      },
      deleteMeasurement(id: string) {
        update((cur) => ({ ...cur, measurements: cur.measurements.filter((m) => m.id !== id) }));
      },
      addItem(date: string, meal: MealId, item: Omit<MealItem, "id">) {
        update((cur) => {
          const log = cur.logs[date] ?? blankLog(date);
          return { ...cur, logs: { ...cur.logs, [date]: { ...log, meals: { ...log.meals, [meal]: [...(log.meals[meal] ?? []), { ...item, id: crypto.randomUUID() }] } } } };
        });
      },
      updateItem(date: string, meal: MealId, item: MealItem) {
        update((cur) => {
          const log = cur.logs[date] ?? blankLog(date);
          return { ...cur, logs: { ...cur.logs, [date]: { ...log, meals: { ...log.meals, [meal]: (log.meals[meal] ?? []).map((e) => (e.id === item.id ? item : e)) } } } };
        });
      },
      removeItem(date: string, meal: MealId, id: string) {
        update((cur) => {
          const log = cur.logs[date] ?? blankLog(date);
          return { ...cur, logs: { ...cur.logs, [date]: { ...log, meals: { ...log.meals, [meal]: (log.meals[meal] ?? []).filter((e) => e.id !== id) } } } };
        });
      },
      copyMeal(date: string, meal: MealId, sourceDate: string, sourceMeal: MealId) {
        update((cur) => {
          const source = cur.logs[sourceDate]?.meals[sourceMeal] ?? [];
          const target = cur.logs[date] ?? blankLog(date);
          return { ...cur, logs: { ...cur.logs, [date]: { ...target, meals: { ...target.meals, [meal]: source.map((e) => ({ ...e, id: crypto.randomUUID() })) } } } };
        });
      },
      setCreatine(date: string, taken: boolean) {
        update((cur) => { const log = cur.logs[date] ?? blankLog(date); return { ...cur, logs: { ...cur.logs, [date]: { ...log, creatine: taken } } }; });
        return true;
      },
      addWater(date: string, amount: number) {
        if (![250, 500, 750].includes(amount) && (amount < -10000 || amount > 10000)) { window.alert("Água inválida."); return false; }
        update((cur) => { const log = cur.logs[date] ?? blankLog(date); return { ...cur, logs: { ...cur.logs, [date]: { ...log, waterMl: Math.max(0, log.waterMl + amount) } } }; });
        return true;
      },
      saveFood(food: Food) {
        update((cur) => ({ ...cur, foods: cur.foods.some((f) => f.id === food.id) ? cur.foods.map((f) => (f.id === food.id ? food : f)) : [...cur.foods, food] }));
      },
      deleteFood(id: string) {
        update((cur) => ({ ...cur, foods: cur.foods.filter((f) => f.id !== id || !f.custom), favoriteFoods: cur.favoriteFoods.filter((fid) => fid !== id) }));
      },
      toggleFavorite(id: string) {
        update((cur) => ({
          ...cur,
          favoriteFoods: cur.favoriteFoods.includes(id)
            ? cur.favoriteFoods.filter((fid) => fid !== id)
            : [...cur.favoriteFoods, id]
        }));
      },
      saveWorkout(day: Weekday, plan: WorkoutPlan) {
        update((cur) => ({ ...cur, workouts: cur.workouts.map((w) => (w.day === day ? plan : w)) }));
      },
      copyWorkout(targetDay: Weekday, sourceDay: Weekday) {
        update((cur) => {
          const source = cur.workouts.find((w) => w.day === sourceDay);
          if (!source) return cur;
          return { ...cur, workouts: cur.workouts.map((w) => w.day === targetDay ? { day: targetDay, name: source.name, exercises: source.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })) } : w) };
        });
        return true;
      },
      saveWorkoutTemplate(template: WorkoutTemplate) {
        const safe = secureWorkoutTemplate({ ...template, updatedAt: todayISO() });
        update((cur) => ({ ...cur, workoutTemplates: cur.workoutTemplates.some((t) => t.id === safe.id) ? cur.workoutTemplates.map((t) => (t.id === safe.id ? safe : t)) : [...cur.workoutTemplates, safe] }));
        return true;
      },
      deleteWorkoutTemplate(id: string) {
        update((cur) => ({ ...cur, workoutTemplates: cur.workoutTemplates.filter((t) => t.id !== id) }));
      },
      duplicateWorkoutTemplate(id: string) {
        update((cur) => {
          const template = cur.workoutTemplates.find((t) => t.id === id);
          if (!template) return cur;
          const today = todayISO();
          return { ...cur, workoutTemplates: [...cur.workoutTemplates, { ...template, id: crypto.randomUUID(), name: `${template.name} cópia`, createdAt: today, updatedAt: today, exercises: template.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })) }] };
        });
      },
      copyWorkoutToTemplate(day: Weekday) {
        const today = todayISO();
        update((cur) => {
          const workout = cur.workouts.find((w) => w.day === day);
          if (!workout || workout.exercises.length === 0) return cur;
          return { ...cur, workoutTemplates: [...cur.workoutTemplates, { id: crypto.randomUUID(), name: workout.name || "Modelo de treino", createdAt: today, updatedAt: today, exercises: workout.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })) }] };
        });
        return true;
      },
      applyWorkoutTemplate(templateId: string, day: Weekday, mode: "replace" | "append") {
        update((cur) => {
          const template = cur.workoutTemplates.find((t) => t.id === templateId);
          if (!template) return cur;
          return {
            ...cur,
            workouts: cur.workouts.map((workout) => {
              if (workout.day !== day) return workout;
              const exercises = template.exercises.map((e) => ({ ...e, id: crypto.randomUUID() }));
              return { ...workout, name: mode === "append" && workout.name ? workout.name : template.name, exercises: mode === "append" ? [...workout.exercises, ...exercises] : exercises };
            })
          };
        });
        return true;
      },
      completeWorkout(date: string) {
        update((cur) => {
          const day = weekdayForDate(date);
          const workout = cur.workouts.find((w) => w.day === day);
          if (!workout || workout.exercises.length === 0) return cur;
          return { ...cur, completedWorkouts: [...cur.completedWorkouts.filter((e) => e.date !== date), { id: crypto.randomUUID(), date, day, name: workout.name, exercises: workout.exercises.map((e) => ({ ...e })) }] };
        });
      },
      undoWorkout(date: string) {
        update((cur) => ({ ...cur, completedWorkouts: cur.completedWorkouts.filter((e) => e.date !== date) }));
      },
      saveCardio(entry: Omit<CardioEntry, "id">, id?: string) {
        update((cur) => ({ ...cur, cardioEntries: id ? cur.cardioEntries.map((e) => (e.id === id ? { ...entry, id } : e)) : [...cur.cardioEntries, { ...entry, id: crypto.randomUUID() }] }));
        return true;
      },
      deleteCardio(id: string) {
        update((cur) => ({ ...cur, cardioEntries: cur.cardioEntries.filter((e) => e.id !== id) }));
      },

      // ── Kanban actions ──────────────────────────────────────────────────
      addKanbanColumn(name: string) {
        const col: KanbanColumn = { id: crypto.randomUUID(), name, tasks: [] };
        update((cur) => ({ ...cur, kanbanColumns: [...(cur.kanbanColumns ?? []), col] }));
      },
      renameKanbanColumn(id: string, name: string) {
        update((cur) => ({ ...cur, kanbanColumns: (cur.kanbanColumns ?? []).map((c) => (c.id === id ? { ...c, name } : c)) }));
      },
      deleteKanbanColumn(id: string) {
        update((cur) => ({ ...cur, kanbanColumns: (cur.kanbanColumns ?? []).filter((c) => c.id !== id) }));
      },
      addKanbanTask(columnId: string, title: string) {
        const task: KanbanTask = { id: crypto.randomUUID(), title, createdAt: new Date().toISOString() };
        update((cur) => ({
          ...cur,
          kanbanColumns: (cur.kanbanColumns ?? []).map((c) =>
            c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c
          )
        }));
      },
      updateKanbanTask(columnId: string, task: KanbanTask) {
        update((cur) => ({
          ...cur,
          kanbanColumns: (cur.kanbanColumns ?? []).map((c) =>
            c.id === columnId ? { ...c, tasks: c.tasks.map((t) => (t.id === task.id ? task : t)) } : c
          )
        }));
      },
      deleteKanbanTask(columnId: string, taskId: string) {
        update((cur) => ({
          ...cur,
          kanbanColumns: (cur.kanbanColumns ?? []).map((c) =>
            c.id === columnId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c
          )
        }));
      },
      moveKanbanTask(taskId: string, fromColumnId: string, toColumnId: string) {
        update((cur) => {
          const from = (cur.kanbanColumns ?? []).find((c) => c.id === fromColumnId);
          const task = from?.tasks.find((t) => t.id === taskId);
          if (!task) return cur;
          return {
            ...cur,
            kanbanColumns: (cur.kanbanColumns ?? []).map((c) => {
              if (c.id === fromColumnId) return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
              if (c.id === toColumnId) return { ...c, tasks: [...c.tasks, task] };
              return c;
            })
          };
        });
      },

      // ── Auth actions (Supabase) ───────────────────────────────────────────
      async signInWithGoogle() {
        await signInWithGoogle();
        // Redirect handled by Supabase OAuth — page reloads after auth
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
        pendingConflict.current = false;
        const result = await getCloudAppDataWithMeta();
        if (result.data) applyRemoteData(result.data, result.updatedAt);
        setSyncStatus((cur) => ({ ...cur, state: result.data ? "synced" : "local", lastSyncedAt: result.data ? result.updatedAt ?? cur.lastSyncedAt : cur.lastSyncedAt, message: result.data ? "Dados da nuvem carregados." : "Nenhum dado encontrado na nuvem." }));
        return result.data;
      },
      async uploadToCloud() {
        pendingConflict.current = false;
        setSyncStatus((cur) => ({ ...cur, state: "syncing", message: "Sincronizando..." }));
        setSyncStatus(await saveCloudAppData(data, { allowEmptyOverwrite: true }));
      },
      async syncNow() {
        const now = Date.now();
        if (now - lastManualSyncTime.current < 10000) return;
        lastManualSyncTime.current = now;
        setSyncStatus((cur) => ({ ...cur, state: "syncing", message: "Sincronizando..." }));
        setSyncStatus(await syncAppData(data));
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, syncStatus.authenticated]
  );

  return { data, actions, syncStatus };
}
