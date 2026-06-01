import { createClient } from "@supabase/supabase-js";
import { emptyData } from "../data/seed";
import { migrateData } from "./storage";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import type { FitnessData, SyncStatus } from "../types";

const SYNC_STATUS_KEY = "treino-pro-sync-status";
const TABLE = "user_app_data";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface CloudAppDataResult {
  data: FitnessData | null;
  updatedAt: string | null;
}

// Creates an authenticated Supabase client using the Clerk JWT token.
// Supabase validates this token via the Clerk JWKS endpoint (configured in Supabase dashboard).
function getAuthenticatedSupabase(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
}

export function hasValidProfile(appData: FitnessData | null | undefined): boolean {
  const profile = appData?.profile;
  return Boolean(
    profile &&
      Number.isFinite(profile.idade) && profile.idade > 0 &&
      Number.isFinite(profile.altura) && profile.altura > 0 &&
      Number.isFinite(profile.pesoAtual) && profile.pesoAtual > 0 &&
      profile.sexo && profile.objetivo && profile.atividade
  );
}

function workoutsChanged(appData: FitnessData): boolean {
  const normalize = (d: FitnessData) =>
    d.workouts.map((w) => ({
      day: w.day, name: w.name,
      exercises: w.exercises.map((e) => ({ name: e.name, sets: e.sets, repetitions: e.repetitions, load: e.load ?? "", notes: e.notes ?? "" }))
    }));
  return JSON.stringify(normalize(appData)) !== JSON.stringify(normalize(emptyData()));
}

export function hasMeaningfulLocalData(appData: FitnessData | null | undefined): boolean {
  if (!appData) return false;
  if (hasValidProfile(appData)) return true;
  if (appData.weights.some((e) => e.weight > 0)) return true;
  if (appData.measurements.some((e) => Object.entries(e).some(([k, v]) => k !== "id" && k !== "date" && Number(v) > 0))) return true;
  if (appData.cardioEntries.length > 0) return true;
  if (appData.completedWorkouts.length > 0) return true;
  if (appData.workoutTemplates.length > 0) return true;
  if (workoutsChanged(appData)) return true;
  if (appData.foods.some((f) => f.custom)) return true;
  return Object.values(appData.logs).some((log) =>
    Object.values(log.meals).some((meal) => meal.length > 0) || log.waterMl > 0 || log.creatine !== null
  );
}

export const hasMeaningfulCloudData = hasMeaningfulLocalData;

function baseStatus(): SyncStatus {
  try {
    const saved = localStorage.getItem(SYNC_STATUS_KEY);
    if (saved) return { ...JSON.parse(saved), configured: isSupabaseConfigured } as SyncStatus;
  } catch { /* ignore */ }
  return {
    configured: isSupabaseConfigured,
    authenticated: false,
    state: "local",
    userEmail: null,
    lastSyncedAt: null,
    message: isSupabaseConfigured
      ? "Dados guardados apenas neste dispositivo. Faça login para sincronizar."
      : "Sincronização não configurada. App funcionando localmente."
  };
}

function saveStatus(status: SyncStatus): SyncStatus {
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  return status;
}

export function getSyncStatus(): SyncStatus {
  return baseStatus();
}

// ── Cloud operations (all require a Clerk JWT token) ──────────────────────────

export async function getCloudAppDataWithMeta(token: string, userId: string): Promise<CloudAppDataResult> {
  const client = getAuthenticatedSupabase(token);
  if (!client) return { data: null, updatedAt: null };

  const { data, error } = await client
    .from(TABLE)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.data) return { data: null, updatedAt: data?.updated_at ?? null };
  return {
    data: migrateData(data.data as Parameters<typeof migrateData>[0], emptyData()),
    updatedAt: data.updated_at ?? null
  };
}

export async function loadCloudAppData(token: string, userId: string): Promise<FitnessData | null> {
  const result = await getCloudAppDataWithMeta(token, userId);
  return result.data;
}

export async function saveCloudAppData(
  appData: FitnessData,
  token: string,
  userId: string,
  userEmail: string | null,
  options: { allowEmptyOverwrite?: boolean } = {}
): Promise<SyncStatus> {
  const client = getAuthenticatedSupabase(token);
  if (!client) return getSyncStatus();

  if (!options.allowEmptyOverwrite && !hasMeaningfulLocalData(appData)) {
    const cloud = await getCloudAppDataWithMeta(token, userId);
    if (hasMeaningfulCloudData(cloud.data)) {
      return saveStatus({
        configured: true, authenticated: true, state: "pending",
        userEmail, lastSyncedAt: cloud.updatedAt,
        message: "Dados da nuvem preservados. Estado local vazio não foi enviado."
      });
    }
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from(TABLE)
    .upsert({ user_id: userId, data: appData, updated_at: now }, { onConflict: "user_id" });

  if (error) throw error;
  return saveStatus({
    configured: true, authenticated: true, state: "synced",
    userEmail, lastSyncedAt: now, message: "Sincronizado com a nuvem."
  });
}

export async function syncAppData(
  appData: FitnessData,
  token: string,
  userId: string,
  userEmail: string | null
): Promise<SyncStatus> {
  try {
    return await saveCloudAppData(appData, token, userId, userEmail);
  } catch {
    return saveStatus({
      configured: true, authenticated: true, state: "pending",
      userEmail, lastSyncedAt: null, message: "Pendente de sincronização."
    });
  }
}

// ── Legacy Supabase auth (kept for any existing local sessions, will be removed after migration) ──
export async function legacySignOut() {
  if (!supabase) return;
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}
