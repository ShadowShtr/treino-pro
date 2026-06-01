import { emptyData } from "../data/seed";
import { migrateData } from "./storage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { FitnessData, SyncStatus } from "../types";

const SYNC_STATUS_KEY = "travizani-fitness-sync-status";
const TABLE = "user_app_data";

export interface CloudAppDataResult {
  data: FitnessData | null;
  updatedAt: string | null;
}

export function hasValidProfile(appData: FitnessData | null | undefined): boolean {
  const profile = appData?.profile;
  return Boolean(
    profile &&
      Number.isFinite(profile.idade) &&
      profile.idade > 0 &&
      Number.isFinite(profile.altura) &&
      profile.altura > 0 &&
      Number.isFinite(profile.pesoAtual) &&
      profile.pesoAtual > 0 &&
      profile.sexo &&
      profile.objetivo &&
      profile.atividade
  );
}

function workoutsChanged(appData: FitnessData): boolean {
  const normalize = (data: FitnessData) =>
    data.workouts.map((workout) => ({
      day: workout.day,
      name: workout.name,
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        load: exercise.load ?? "",
        notes: exercise.notes ?? ""
      }))
    }));
  return JSON.stringify(normalize(appData)) !== JSON.stringify(normalize(emptyData()));
}

export function hasMeaningfulLocalData(appData: FitnessData | null | undefined): boolean {
  if (!appData) return false;
  if (hasValidProfile(appData)) return true;
  if (appData.weights.some((entry) => entry.weight > 0)) return true;
  if (appData.measurements.some((entry) => Object.entries(entry).some(([key, value]) => key !== "id" && key !== "date" && Number(value) > 0))) return true;
  if (appData.cardioEntries.length > 0) return true;
  if (appData.completedWorkouts.length > 0) return true;
  if (appData.workoutTemplates.length > 0) return true;
  if (workoutsChanged(appData)) return true;
  if (appData.foods.some((food) => food.custom)) return true;
  return Object.values(appData.logs).some((log) =>
    Object.values(log.meals).some((meal) => meal.length > 0) ||
    log.waterMl > 0 ||
    log.creatine !== null
  );
}

export const hasMeaningfulCloudData = hasMeaningfulLocalData;

function baseStatus(): SyncStatus {
  try {
    const saved = localStorage.getItem(SYNC_STATUS_KEY);
    if (saved) return { ...JSON.parse(saved), configured: isSupabaseConfigured } as SyncStatus;
  } catch {
    // usa estado local abaixo
  }
  return {
    configured: isSupabaseConfigured,
    authenticated: false,
    state: isSupabaseConfigured ? "local" : "local",
    userEmail: null,
    lastSyncedAt: null,
    message: isSupabaseConfigured
      ? "Dados guardados apenas neste dispositivo. Faça login para sincronizar com a nuvem."
      : "Supabase não configurado. O app está funcionando apenas localmente."
  };
}

function saveStatus(status: SyncStatus): SyncStatus {
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  return status;
}

export function getSyncStatus(): SyncStatus {
  return baseStatus();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user ?? null;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user ?? null;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  saveStatus({
    ...baseStatus(),
    authenticated: false,
    state: "local",
    userEmail: null,
    message: "Dados guardados apenas neste dispositivo. Faça login para sincronizar com a nuvem."
  });
}

export async function loadCloudAppData(): Promise<FitnessData | null> {
  const result = await getCloudAppDataWithMeta();
  return result.data;
}

export async function getCloudAppDataWithMeta(): Promise<CloudAppDataResult> {
  if (!supabase) return { data: null, updatedAt: null };
  const user = await getCurrentUser();
  if (!user) return { data: null, updatedAt: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select("data, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.data) return { data: null, updatedAt: data?.updated_at ?? null };
  return {
    data: migrateData(data.data as Parameters<typeof migrateData>[0], emptyData()),
    updatedAt: data.updated_at ?? null
  };
}

export async function saveCloudAppData(appData: FitnessData, options: { allowEmptyOverwrite?: boolean } = {}): Promise<SyncStatus> {
  if (!supabase) return getSyncStatus();
  const user = await getCurrentUser();
  if (!user) {
    return saveStatus({
      ...baseStatus(),
      authenticated: false,
      state: "local",
      userEmail: null,
      message: "Dados guardados apenas neste dispositivo. Faça login para sincronizar com a nuvem."
    });
  }

  if (!options.allowEmptyOverwrite && !hasMeaningfulLocalData(appData)) {
    const cloud = await getCloudAppDataWithMeta();
    if (hasMeaningfulCloudData(cloud.data)) {
      return saveStatus({
        configured: true,
        authenticated: true,
        state: "pending",
        userEmail: user.email ?? null,
        lastSyncedAt: cloud.updatedAt,
        message: "Dados da nuvem preservados. O estado local vazio não foi enviado."
      });
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: user.id, data: appData, updated_at: now }, { onConflict: "user_id" });

  if (error) throw error;
  return saveStatus({
    configured: true,
    authenticated: true,
    state: "synced",
    userEmail: user.email ?? null,
    lastSyncedAt: now,
    message: "Sincronizado com a nuvem."
  });
}

export async function syncAppData(appData: FitnessData): Promise<SyncStatus> {
  try {
    return await saveCloudAppData(appData);
  } catch {
    const user = await getCurrentUser().catch(() => null);
    return saveStatus({
      ...baseStatus(),
      authenticated: Boolean(user),
      userEmail: user?.email ?? baseStatus().userEmail,
      state: "pending",
      message: "Pendente de sincronização."
    });
  }
}
