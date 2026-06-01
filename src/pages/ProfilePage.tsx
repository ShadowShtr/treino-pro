import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Cloud,
  Download,
  LogOut,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sun,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { measurementFields, NumberField } from "./Onboarding";
import { GoalsExplanation } from "../components/GoalsExplanation";
import { formatDate, todayISO } from "../lib/date";
import { exportBackup, parseBackup } from "../lib/storage";
import { emptyMeasurements } from "../data/seed";
import { SOMATOTYPE_DESCRIPTIONS, SOMATOTYPE_LABELS } from "../lib/fitnessFormulas";
import type { ResetScope, useFitnessData } from "../hooks/useFitnessData";
import type {
  AppTheme,
  FitnessData,
  MeasurementEntry,
  Measurements,
  Profile,
  Somatotype,
  SyncStatus,
  WeightEntry,
} from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

const objectiveLabels: Record<string, string> = {
  manter: "Manter peso",
  ganho_controlado: "Ganho muscular",
  perda_controlada: "Perda de peso",
  recomposicao: "Recomposição corporal",
};

const activityLabels: Record<string, string> = {
  sedentario: "Sedentário",
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
  muito_intenso: "Muito intenso",
};

// ─────────────────────────────────────────────────────
// Profile page
// ─────────────────────────────────────────────────────
export function ProfilePage({
  data,
  actions,
  syncStatus,
}: {
  data: FitnessData;
  actions: Actions;
  syncStatus: SyncStatus;
}) {
  const profile = data.profile!;
  const [form, setForm] = useState(profile);
  const [weight, setWeight] = useState<WeightEntry | null>(null);
  const [measures, setMeasures] = useState<MeasurementEntry | null>(null);
  const [focusMeasure, setFocusMeasure] = useState<keyof Measurements | null>(null);
  const [resetScope, setResetScope] = useState<ResetScope | null>(null);
  const [cloudChoiceOpen, setCloudChoiceOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const latestMeasures = [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];
  const completion = bodyCompletion(profile, latestMeasures);

  useEffect(() => setForm(profile), [profile]);

  function openMissing(target: MissingTarget) {
    if (target === "pesoDesejado" || target === "biotipo") {
      document.getElementById("dados-perfil")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setFocusMeasure(target === "cintura" || target === "gordura" ? target : null);
    setMeasures(latestMeasures ?? { id: "", date: todayISO(), ...emptyMeasurements });
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const backup = await parseBackup(file);
      if (window.confirm("Substituir todos os dados atuais pelo backup selecionado?")) {
        actions.replace(backup);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível importar o backup.");
    }
  }

  async function runOnce(key: string, action: () => Promise<void>) {
    if (busyAction) return;
    setBusyAction(key);
    try { await action(); }
    finally { setBusyAction(null); }
  }

  const initials = profile.nome
    ? profile.nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <>
      <PageHeader eyebrow="Dados pessoais" title="Perfil" />

      {/* ── Profile avatar card ── */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="29" fill="none" stroke="#f1f5f9" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="29"
                fill="none"
                stroke="#fc4c02"
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 29}`}
                strokeDashoffset={`${2 * Math.PI * 29 * (1 - completion.percent / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light">
                {profile.nome
                  ? <span className="text-base font-bold text-primary">{initials}</span>
                  : <User size={20} className="text-primary" />
                }
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink">{profile.nome || "Sem nome"}</p>
            <p className="text-sm text-muted">
              {profile.altura > 0 ? `${profile.altura} cm` : "—"} ·{" "}
              {profile.pesoAtual > 0 ? `${profile.pesoAtual} kg` : "—"} ·{" "}
              {profile.idade > 0 ? `${profile.idade} anos` : "—"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion.percent}%` }} />
              </div>
              <span className="shrink-0 text-xs font-bold text-primary">{completion.percent}%</span>
            </div>
          </div>
        </div>

        {/* Missing fields */}
        {completion.missing.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Completar perfil</p>
            {completion.missing.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm"
                onClick={() => openMissing(item.target)}
              >
                <span className="text-muted">{item.label}</span>
                <span className="text-xs font-semibold text-primary">Preencher</span>
              </button>
            ))}
          </div>
        )}
        {completion.missing.length === 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2">
            <CheckCircle2 size={15} className="text-primary" />
            <p className="text-xs font-medium text-primary">Dados corporais completos</p>
          </div>
        )}
      </Card>

      {/* ── Goals summary ── */}
      <div className="mb-4">
        <GoalsExplanation profile={profile} measurements={latestMeasures} />
      </div>

      {/* ── Theme ── */}
      <Card className="mb-4">
        <SectionTitle>Tema do app</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={`theme-option ${data.theme === value ? "selected" : ""}`}
              onClick={() => actions.setTheme(value)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── Profile form ── */}
      <Card className="mb-4" id="dados-perfil">
        <SectionTitle>Dados do perfil</SectionTitle>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); actions.saveProfile(form); }}>
          <label className="field-label">
            Nome
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Opcional" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Idade" value={form.idade} placeholder="Ex: 26" onChange={(idade) => setForm({ ...form, idade })} />
            <label className="field-label">
              Sexo
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value as Profile["sexo"] })}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </label>
            <NumberField label="Altura (cm)" value={form.altura} placeholder="Ex: 175" onChange={(altura) => setForm({ ...form, altura })} />
            <NumberField label="Peso desejado" step="0.1" optional placeholder="Opcional" value={form.pesoDesejado} onChange={(pesoDesejado) => setForm({ ...form, pesoDesejado })} />
            <NumberField label="Treinos/semana" max={7} value={form.frequenciaTreino} onChange={(frequenciaTreino) => setForm({ ...form, frequenciaTreino })} />
            <label className="field-label">
              Atividade
              <select value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value as Profile["atividade"] })}>
                {Object.entries(activityLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            Objetivo
            <select value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value as Profile["objetivo"] })}>
              {Object.entries(objectiveLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </label>
          <ProfileSomatotypePicker value={form.biotipo ?? "nao_sei"} onChange={(biotipo) => setForm({ ...form, biotipo })} />
          <button className="btn-primary w-full py-3" type="submit">Guardar perfil</button>
        </form>
      </Card>

      {/* ── Weight ── */}
      <Card className="mb-4">
        <SectionTitle
          aside={
            <button
              className="flex items-center gap-1 text-sm font-semibold text-primary"
              onClick={() => setWeight({ id: "", date: todayISO(), weight: profile.pesoAtual })}
            >
              <Plus size={15} /> Registar
            </button>
          }
        >
          Peso semanal
        </SectionTitle>
        <EntryList
          entries={[...data.weights].sort((a, b) => b.date.localeCompare(a.date))}
          value={(entry) => `${entry.weight} kg`}
          onEdit={(entry) => setWeight(entry)}
          onDelete={(entry) => actions.deleteWeight(entry.id)}
        />
      </Card>

      {/* ── Measurements ── */}
      <Card className="mb-4">
        <SectionTitle
          aside={
            <button
              className="flex items-center gap-1 text-sm font-semibold text-primary"
              onClick={() => setMeasures({ id: "", date: todayISO(), ...emptyMeasurements })}
            >
              <Plus size={15} /> Registar
            </button>
          }
        >
          Medidas mensais
        </SectionTitle>
        <EntryList
          entries={[...data.measurements].sort((a, b) => b.date.localeCompare(a.date))}
          value={(entry) => `Cintura ${entry.cintura || "—"} cm · Gordura ${entry.gordura || "—"}%`}
          onEdit={(entry) => setMeasures(entry)}
          onDelete={(entry) => actions.deleteMeasurement(entry.id)}
        />
      </Card>

      {/* ── Account & Security ── */}
      <Card>
        <SectionTitle>Conta e dados</SectionTitle>

        {/* Sync status */}
        <div className="mb-4 rounded-2xl border border-outline bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${syncStatus.authenticated ? "bg-primary-light" : "bg-slate-100"}`}>
              <Cloud size={18} className={syncStatus.authenticated ? "text-primary" : "text-muted"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">
                {syncStatus.authenticated ? "Conta conectada" : "Sem login"}
              </p>
              <p className="text-xs text-muted">
                {syncStatus.authenticated ? syncStatus.userEmail ?? "—" : "Dados apenas neste dispositivo"}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${syncStatusStyle(syncStatus.state)}`}>
              {syncStatusLabel(syncStatus.state)}
            </span>
          </div>

          {syncStatus.authenticated && syncStatus.lastSyncedAt && (
            <p className="mb-3 text-xs text-muted">
              Última sincronização: {formatSyncDate(syncStatus.lastSyncedAt)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {syncStatus.authenticated ? (
              <>
                <button className="btn-secondary justify-center py-3 disabled:opacity-50" type="button" disabled={Boolean(busyAction)} onClick={() => runOnce("sync", actions.syncNow)}>
                  {busyAction === "sync" ? "Salvando…" : "Sincronizar agora"}
                </button>
                <button className="btn-secondary justify-center py-3 disabled:opacity-50" type="button" disabled={Boolean(busyAction)} onClick={() => runOnce("signout", actions.signOut)}>
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <button className="btn-secondary col-span-2 w-full justify-center gap-2 py-3 disabled:opacity-40" type="button" disabled={!syncStatus.configured} onClick={() => actions.signInWithGoogle()}>
                <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Entrar com Google
              </button>
            )}
          </div>

          {!syncStatus.authenticated && (
            <p className="mt-3 text-xs leading-5 text-muted">
              Faça login para sincronizar dados entre dispositivos e ter backup na nuvem.
            </p>
          )}
        </div>

        {/* Backup */}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Backup</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button className="btn-secondary justify-center py-3" onClick={() => exportBackup(data)}>
            <Download size={16} /> Exportar JSON
          </button>
          <button className="btn-secondary justify-center py-3" onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> Importar JSON
          </button>
        </div>

        {/* Reset */}
        <div className="border-t border-outline pt-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert size={17} className="text-danger" />
            <p className="text-sm font-bold text-danger">Resetar dados</p>
          </div>
          <p className="mb-3 text-sm leading-5 text-muted">
            Escolha o que pretende apagar. Esta ação não pode ser desfeita.
          </p>
          <div className="space-y-2">
            {resetOptions.map(({ scope, label, description }) => (
              <button
                key={scope}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline px-3 py-3 text-left transition-colors hover:border-danger/40 hover:bg-red-50/50"
                onClick={() => setResetScope(scope)}
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block text-xs text-muted">{description}</span>
                </span>
                <RotateCcw size={15} className={scope === "tudo" ? "shrink-0 text-danger" : "shrink-0 text-primary"} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-outline pt-4 text-xs text-muted">
          <span>TREINO PRO</span>
          <span>Versão 1.0.0</span>
        </div>

        <input
          ref={inputRef}
          className="hidden"
          accept="application/json"
          type="file"
          onChange={(e) => importFile(e.target.files?.[0])}
        />
      </Card>

      {/* Modals */}
      <WeightModal
        entry={weight}
        onClose={() => setWeight(null)}
        onSave={(entry) => { if (actions.saveWeight(entry, weight?.id || undefined)) setWeight(null); }}
      />
      <MeasurementModal
        entry={measures}
        focusKey={focusMeasure}
        onClose={() => setMeasures(null)}
        onSave={(entry) => { actions.saveMeasurement(entry, measures?.id || undefined); setMeasures(null); }}
      />
      <ResetDataModal
        scope={resetScope}
        onClose={() => setResetScope(null)}
        onConfirm={() => { if (resetScope) actions.resetRecords(resetScope); setResetScope(null); }}
      />
      <CloudChoiceModal
        open={cloudChoiceOpen}
        onClose={() => setCloudChoiceOpen(false)}
        busy={Boolean(busyAction)}
        onUpload={async () => runOnce("upload", async () => { await actions.uploadToCloud(); setCloudChoiceOpen(false); })}
        onUseCloud={async () => runOnce("load-cloud", async () => { await actions.loadFromCloud(); setCloudChoiceOpen(false); })}
        onExport={() => exportBackup(data)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────
// Somatotype picker (profile page version)
// ─────────────────────────────────────────────────────
function ProfileSomatotypePicker({ value, onChange }: { value: Somatotype; onChange: (v: Somatotype) => void }) {
  const options = Object.keys(SOMATOTYPE_LABELS) as Somatotype[];
  return (
    <div className="space-y-2">
      <p className="field-label">Biotipo percebido</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`rounded-2xl border p-3 text-left transition-all ${value === opt ? "border-primary bg-primary-light" : "border-outline bg-white"}`}
            onClick={() => onChange(opt)}
          >
            <span className={`block text-sm font-semibold ${value === opt ? "text-primary" : "text-ink"}`}>
              {SOMATOTYPE_LABELS[opt]}
            </span>
            <span className="mt-0.5 block text-[11px] leading-4 text-muted">{SOMATOTYPE_DESCRIPTIONS[opt]}</span>
          </button>
        ))}
      </div>
      <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-muted">
        O biotipo é apenas um ajuste contextual. A base principal são peso, altura, idade, sexo e atividade.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Entry list (weight / measurement)
// ─────────────────────────────────────────────────────
function EntryList<T extends { id: string; date: string }>({
  entries, value, onEdit, onDelete,
}: {
  entries: T[];
  value: (entry: T) => string;
  onEdit: (entry: T) => void;
  onDelete: (entry: T) => void;
}) {
  if (!entries.length) return <Empty>Nenhum registo ainda.</Empty>;
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-2 rounded-2xl border border-outline bg-slate-50/60 px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{value(entry)}</p>
            <p className="text-xs text-muted">{formatDate(entry.date)}</p>
          </div>
          <div className="flex shrink-0 gap-3 text-slate-400">
            <button type="button" onClick={() => onEdit(entry)} aria-label="Editar">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={() => onDelete(entry)} aria-label="Remover" className="text-slate-300 hover:text-danger">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Weight modal
// ─────────────────────────────────────────────────────
function WeightModal({
  entry, onClose, onSave,
}: {
  entry: WeightEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<WeightEntry, "id">) => void;
}) {
  const [weightText, setWeightText] = useState("");
  useEffect(() => { setWeightText(entry?.weight ? String(entry.weight) : ""); }, [entry]);
  if (!entry) return null;
  return (
    <Modal open title="Registar peso" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (!weightText) { window.alert("Peso pendente."); return; }
          onSave({ date: String(fd.get("date")), weight: Number(weightText) });
        }}
      >
        <label className="field-label">
          Data
          <input type="date" name="date" required defaultValue={entry.date} />
        </label>
        <label className="field-label">
          Peso (kg)
          <input
            type="number"
            name="weight"
            min="1"
            step="0.1"
            required
            value={weightText}
            placeholder="Ex: 74.5"
            onChange={(e) => setWeightText(e.target.value.replace(/^0+(?=\d)/, ""))}
          />
        </label>
        <button className="btn-primary w-full py-3" type="submit">Guardar peso</button>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Measurement modal
// ─────────────────────────────────────────────────────
function MeasurementModal({
  entry, focusKey, onClose, onSave,
}: {
  entry: MeasurementEntry | null;
  focusKey: keyof Measurements | null;
  onClose: () => void;
  onSave: (entry: Omit<MeasurementEntry, "id">) => void;
}) {
  const [form, setForm] = useState<Measurements>(entry ?? emptyMeasurements);
  useEffect(() => setForm(entry ?? emptyMeasurements), [entry]);
  if (!entry) return null;
  return (
    <Modal open title="Registar medidas" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSave({ date: String(fd.get("date")), ...form });
        }}
      >
        <label className="field-label">
          Data
          <input type="date" name="date" required defaultValue={entry.date} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {measurementFields.map(({ key, label }) => (
            <NumberField
              key={key}
              label={label}
              step="0.1"
              optional
              placeholder="Opcional"
              autoFocus={focusKey === key}
              value={form[key]}
              onChange={(value) => setForm({ ...form, [key]: value })}
            />
          ))}
        </div>
        <button className="btn-primary w-full py-3" type="submit">Guardar medidas</button>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Reset data modal
// ─────────────────────────────────────────────────────
function ResetDataModal({
  scope, onClose, onConfirm,
}: {
  scope: ResetScope | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  useEffect(() => { setStep(1); setTyped(""); }, [scope]);
  if (!scope) return null;
  const selected = resetOptions.find((o) => o.scope === scope)!;

  return (
    <Modal open title="Confirmar eliminação" onClose={onClose}>
      {step === 1 ? (
        <>
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm leading-6 text-red-700">
            <strong className="block">{selected.label}</strong>
            {selected.description} Esta ação é permanente.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary justify-center py-3" type="button" onClick={onClose}>Cancelar</button>
            <button
              className="flex min-h-11 items-center justify-center rounded-xl bg-danger px-3 text-sm font-semibold text-white"
              type="button"
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm leading-6 text-muted">
            Escreva <strong>APAGAR</strong> para confirmar.
          </p>
          <label className="field-label mb-4">
            Confirmação
            <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} placeholder="APAGAR" />
          </label>
          <button
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-danger px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={typed !== "APAGAR"}
            onClick={onConfirm}
          >
            Apagar definitivamente
          </button>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────
// Cloud choice modal
// ─────────────────────────────────────────────────────
function CloudChoiceModal({
  open, busy, onClose, onUpload, onUseCloud, onExport,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onUpload: () => Promise<void>;
  onUseCloud: () => Promise<void>;
  onExport: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open title="Sincronizar dados" onClose={onClose}>
      <p className="mb-4 text-sm leading-6 text-muted">
        Encontramos dados neste dispositivo e na nuvem. Qual deseja usar?
      </p>
      <div className="space-y-2">
        <button className="btn-secondary w-full justify-center py-3 disabled:opacity-50" type="button" disabled={busy} onClick={onUseCloud}>
          Usar dados da nuvem
        </button>
        <button className="btn-primary w-full py-3 disabled:opacity-50" type="button" disabled={busy} onClick={onUpload}>
          Enviar dados deste dispositivo
        </button>
        <button className="btn-secondary w-full justify-center py-3" type="button" onClick={onExport}>
          Exportar backup antes
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Helpers & constants
// ─────────────────────────────────────────────────────
const resetOptions: { scope: ResetScope; label: string; description: string }[] = [
  { scope: "alimentacao", label: "Apagar alimentação", description: "Remove refeições registadas." },
  { scope: "treinos", label: "Apagar treinos", description: "Remove planos e histórico de conclusão." },
  { scope: "evolucao", label: "Apagar evolução", description: "Remove pesos e medidas registados." },
  { scope: "agua_creatina", label: "Apagar água e creatina", description: "Remove hidratação e checklist diário." },
  { scope: "tudo", label: "Apagar tudo", description: "Reinicia todo o perfil e histórico." },
];

const themeOptions: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

function syncStatusLabel(state: SyncStatus["state"]) {
  const map: Record<string, string> = {
    synced: "Sincronizado",
    local: "Local",
    pending: "Pendente",
    syncing: "Salvando…",
    error: "Erro",
  };
  return map[state] ?? state;
}

function syncStatusStyle(state: SyncStatus["state"]) {
  if (state === "synced") return "bg-green-100 text-green-700";
  if (state === "error") return "bg-red-100 text-red-700";
  if (state === "syncing") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function formatSyncDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type MissingTarget = "pesoDesejado" | "cintura" | "gordura" | "biotipo" | "medidas";

function bodyCompletion(profile: Profile, measurements?: MeasurementEntry) {
  const checks = [
    { ok: profile.pesoDesejado > 0, label: "Peso desejado pendente", target: "pesoDesejado" as const },
    { ok: Boolean(measurements?.cintura), label: "Cintura pendente", target: "cintura" as const },
    { ok: Boolean(measurements?.gordura), label: "% de gordura pendente", target: "gordura" as const },
    { ok: Boolean(profile.biotipo && profile.biotipo !== "nao_sei"), label: "Biotipo pendente", target: "biotipo" as const },
    {
      ok: Boolean(measurements && measurementFields.every(({ key }) => measurements[key] > 0)),
      label: "Medidas mensais pendentes",
      target: "medidas" as const,
    },
  ];
  const base = 6;
  const done = base + checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / (base + checks.length)) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => ({ label: c.label, target: c.target })),
  };
}
