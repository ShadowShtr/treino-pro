import { useEffect, useRef, useState, type FormEvent } from "react";
import { Cloud, Download, LogIn, LogOut, Monitor, Moon, Pencil, Plus, RotateCcw, ShieldAlert, Smartphone, Sun, Trash2, Upload } from "lucide-react";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { measurementFields, NumberField } from "./Onboarding";
import { GoalsExplanation } from "../components/GoalsExplanation";
import { formatDate, todayISO } from "../lib/date";
import { exportBackup, parseBackup } from "../lib/storage";
import { emptyMeasurements } from "../data/seed";
import { SOMATOTYPE_DESCRIPTIONS, SOMATOTYPE_LABELS } from "../lib/fitnessFormulas";
import type { AuthSyncResult, ResetScope, useFitnessData } from "../hooks/useFitnessData";
import type { AppTheme, FitnessData, MeasurementEntry, Measurements, Profile, Somatotype, SyncStatus, WeightEntry } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

export function ProfilePage({ data, actions, syncStatus }: { data: FitnessData; actions: Actions; syncStatus: SyncStatus }) {
  const profile = data.profile!;
  const [form, setForm] = useState(profile);
  const [weight, setWeight] = useState<WeightEntry | null>(null);
  const [measures, setMeasures] = useState<MeasurementEntry | null>(null);
  const [focusMeasure, setFocusMeasure] = useState<keyof Measurements | null>(null);
  const [resetScope, setResetScope] = useState<ResetScope | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
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
    if (target === "cintura" || target === "gordura") setFocusMeasure(target);
    else setFocusMeasure(null);
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
    try {
      await action();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Dados pessoais" title="Perfil" />
      <div className="mb-4"><GoalsExplanation profile={profile} measurements={latestMeasures} /></div>

      <Card className="mb-4">
        <SectionTitle>Completar dados corporais</SectionTitle>
        <p className="text-xl font-extrabold text-ink">Perfil corporal {completion.percent}% completo</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${completion.percent}%` }} />
        </div>
        <div className="mt-4 space-y-2">
          {completion.missing.length ? completion.missing.map((item) => (
            <button key={item.label} type="button" className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-left text-sm text-muted" onClick={() => openMissing(item.target)}>
              <span>{item.label}</span><span className="text-primary">Preencher</span>
            </button>
          )) : (
            <p className="rounded-2xl bg-primary-light px-3 py-2 text-sm text-ink">Dados corporais principais completos.</p>
          )}
        </div>
      </Card>

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

      <Card className="mb-4" id="dados-perfil">
        <SectionTitle>Dados do perfil</SectionTitle>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); actions.saveProfile(form); }}>
          <label className="field-label">Nome
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Opcional" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Idade" value={form.idade} placeholder="Ex: 26" onChange={(idade) => setForm({ ...form, idade })} />
            <label className="field-label">Sexo
              <select value={form.sexo} onChange={(event) => setForm({ ...form, sexo: event.target.value as Profile["sexo"] })}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </label>
            <NumberField label="Altura (cm)" value={form.altura} placeholder="Ex: 170" onChange={(altura) => setForm({ ...form, altura })} />
            <NumberField label="Peso desejado" step="0.1" optional placeholder="Ex: 78" value={form.pesoDesejado} onChange={(pesoDesejado) => setForm({ ...form, pesoDesejado })} />
            <NumberField label="Treinos/semana" max={7} value={form.frequenciaTreino} onChange={(frequenciaTreino) => setForm({ ...form, frequenciaTreino })} />
            <label className="field-label">Atividade
              <select value={form.atividade} onChange={(event) => setForm({ ...form, atividade: event.target.value as Profile["atividade"] })}>
                <option value="sedentario">Sedentário</option>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="intenso">Intenso</option>
                <option value="muito_intenso">Muito intenso</option>
              </select>
            </label>
          </div>
          <label className="field-label">Objetivo
            <select value={form.objetivo} onChange={(event) => setForm({ ...form, objetivo: event.target.value as Profile["objetivo"] })}>
              <option value="manter">Manter peso</option>
              <option value="ganho_controlado">Ganho controlado</option>
              <option value="perda_controlada">Perda controlada</option>
              <option value="recomposicao">Recomposição corporal</option>
            </select>
          </label>
          <SomatotypePicker value={form.biotipo ?? "nao_sei"} onChange={(biotipo) => setForm({ ...form, biotipo })} />
          <button className="btn-primary w-full py-3" type="submit">Guardar perfil</button>
        </form>
      </Card>

      <Card className="mb-4">
        <SectionTitle aside={<button className="text-sm font-medium text-primary" onClick={() => setWeight({ id: "", date: todayISO(), weight: profile.pesoAtual })}><Plus size={15} className="inline" /> Registar</button>}>
          Peso semanal
        </SectionTitle>
        <EntryList
          entries={[...data.weights].sort((a, b) => b.date.localeCompare(a.date))}
          value={(entry) => `${entry.weight} kg`}
          onEdit={(entry) => setWeight(entry)}
          onDelete={(entry) => actions.deleteWeight(entry.id)}
        />
      </Card>

      <Card className="mb-4">
        <SectionTitle aside={<button className="text-sm font-medium text-primary" onClick={() => setMeasures({ id: "", date: todayISO(), ...emptyMeasurements })}><Plus size={15} className="inline" /> Registar</button>}>
          Medidas mensais
        </SectionTitle>
        <EntryList
          entries={[...data.measurements].sort((a, b) => b.date.localeCompare(a.date))}
          value={(entry) => `Cintura ${entry.cintura} cm • Gordura ${entry.gordura}%`}
          onEdit={(entry) => setMeasures(entry)}
          onDelete={(entry) => actions.deleteMeasurement(entry.id)}
        />
      </Card>

      <Card>
        <SectionTitle>Dados e segurança</SectionTitle>
        <div className="mb-4 flex gap-3 rounded-2xl bg-primary-light p-3 text-sm leading-6 text-slate-600">
          <Smartphone size={20} className="mt-0.5 shrink-0 text-primary" />
          <p>{syncNotice(syncStatus)} Também pode exportar um backup JSON como cópia de segurança adicional.</p>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Conta e sincronização</p>
        <div className="mb-4 rounded-2xl border border-outline bg-slate-50 p-3">
          <div className="mb-3 flex items-start gap-3">
            <Cloud size={19} className="mt-0.5 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{syncStatus.authenticated ? "Conta conectada" : "Sem login"}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{syncStatus.message}</p>
              <p className="mt-1 text-xs text-muted">E-mail: {syncStatus.userEmail ?? "-"}</p>
              <p className="text-xs text-muted">Última sincronização: {formatSyncDate(syncStatus.lastSyncedAt)}</p>
              <p className="text-xs text-muted">Status: {syncStatusLabel(syncStatus.state)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {syncStatus.authenticated ? (
              <>
                <button className="btn-secondary justify-center py-3 disabled:opacity-50" type="button" disabled={Boolean(busyAction)} onClick={() => runOnce("sync", actions.syncNow)}>Sincronizar agora</button>
                <button className="btn-secondary justify-center py-3 disabled:opacity-50" type="button" disabled={Boolean(busyAction)} onClick={() => runOnce("signout", actions.signOut)}><LogOut size={17} /> Sair</button>
              </>
            ) : (
              <button className="btn-secondary col-span-2 justify-center py-3" type="button" onClick={() => setAuthOpen(true)} disabled={!syncStatus.configured}>
                <LogIn size={17} /> Entrar / Criar conta
              </button>
            )}
          </div>
        </div>
        {!syncStatus.authenticated && (
          <p className="mb-4 rounded-2xl bg-primary-light p-3 text-sm leading-5 text-muted">
            Dados guardados apenas neste dispositivo. Faça login para sincronizar com a nuvem.
          </p>
        )}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Backup</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary flex justify-center gap-2 py-3" onClick={() => exportBackup(data)}>
            <Download size={17} /> Exportar JSON
          </button>
          <button className="btn-secondary flex justify-center gap-2 py-3" onClick={() => inputRef.current?.click()}>
            <Upload size={17} /> Importar JSON
          </button>
        </div>
        <div className="my-5 border-t border-outline" />
        <div className="mb-3 flex items-center gap-2 text-danger">
          <ShieldAlert size={18} />
          <p className="text-sm font-semibold">Resetar dados</p>
        </div>
        <p className="mb-3 text-sm leading-6 text-slate-500">
          Escolha somente os registos que pretende apagar. Esta ação não pode ser anulada.
        </p>
        <div className="space-y-2">
          {resetOptions.map(({ scope, label, description }) => (
            <button
              type="button"
              key={scope}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline px-3 py-3 text-left"
              onClick={() => setResetScope(scope)}
            >
              <span>
                <span className="block text-sm font-medium text-ink">{label}</span>
                <span className="block text-xs text-muted">{description}</span>
              </span>
              <RotateCcw size={16} className={scope === "tudo" ? "text-danger" : "text-primary"} />
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-outline pt-4 text-xs text-muted">
          <span>Travizani Fitness</span>
          <span>Versão 1.0.0</span>
        </div>
        <input ref={inputRef} className="hidden" accept="application/json" type="file" onChange={(event) => importFile(event.target.files?.[0])} />
      </Card>

      <WeightModal entry={weight} onClose={() => setWeight(null)} onSave={(entry) => { if (actions.saveWeight(entry, weight?.id || undefined)) setWeight(null); }} />
      <MeasurementModal entry={measures} focusKey={focusMeasure} onClose={() => setMeasures(null)} onSave={(entry) => { actions.saveMeasurement(entry, measures?.id || undefined); setMeasures(null); }} />
      <ResetDataModal
        scope={resetScope}
        onClose={() => setResetScope(null)}
        onConfirm={() => {
          if (resetScope) actions.resetRecords(resetScope);
          setResetScope(null);
        }}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onDone={async (mode, email, password) => {
          const result = mode === "signup"
            ? await actions.signUp(email, password)
            : await actions.signIn(email, password);
          setAuthOpen(false);
          if (result === "choice-needed") setCloudChoiceOpen(true);
          return result;
        }}
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

const resetOptions: { scope: ResetScope; label: string; description: string }[] = [
  { scope: "alimentacao", label: "Apagar alimentação", description: "Remove refeições registadas." },
  { scope: "treinos", label: "Apagar treinos", description: "Remove planos e histórico de conclusão." },
  { scope: "evolucao", label: "Apagar evolução", description: "Remove pesos e medidas registados." },
  { scope: "agua_creatina", label: "Apagar água e creatina", description: "Remove hidratação e checklist diário." },
  { scope: "tudo", label: "Apagar tudo", description: "Reinicia todo o perfil e histórico." }
];

const themeOptions: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Automático", icon: Monitor }
];

function syncStatusLabel(state: SyncStatus["state"]) {
  return {
    synced: "Sincronizado",
    local: "Local",
    pending: "Pendente",
    syncing: "Salvando...",
    error: "Erro ao sincronizar"
  }[state];
}

function syncNotice(status: SyncStatus) {
  if (!status.authenticated) {
    return "Os seus dados ficam apenas neste dispositivo. Faça login para sincronizar com a nuvem.";
  }
  if (status.state === "synced") {
    return "Os seus dados estão guardados neste dispositivo e sincronizados com a nuvem.";
  }
  if (status.state === "syncing") {
    return status.message.includes("Carregando")
      ? "Carregando dados da nuvem..."
      : "Guardando alterações neste dispositivo e sincronizando com a nuvem...";
  }
  if (status.state === "pending") {
    return "Os dados foram guardados neste dispositivo, mas ainda estão pendentes de sincronização.";
  }
  if (status.state === "error") {
    return "Não foi possível sincronizar agora. Os dados continuam guardados neste dispositivo.";
  }
  return "Os seus dados ficam apenas neste dispositivo. Faça login para sincronizar com a nuvem.";
}

function formatSyncDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

type MissingTarget = "pesoDesejado" | "cintura" | "gordura" | "biotipo" | "medidas";

function bodyCompletion(profile: Profile, measurements?: MeasurementEntry) {
  const checks = [
    { ok: profile.pesoDesejado > 0, label: "Peso desejado pendente", target: "pesoDesejado" as const },
    { ok: Boolean(measurements?.cintura), label: "Cintura pendente", target: "cintura" as const },
    { ok: Boolean(measurements?.gordura), label: "Percentual de gordura pendente", target: "gordura" as const },
    { ok: Boolean(profile.biotipo && profile.biotipo !== "nao_sei"), label: "Biotipo pendente", target: "biotipo" as const },
    {
      ok: Boolean(measurements && measurementFields.every(({ key }) => measurements[key] > 0)),
      label: "Medidas mensais pendentes",
      target: "medidas" as const
    }
  ];
  const required = 6;
  const done = required + checks.filter((item) => item.ok).length;
  return {
    percent: Math.round((done / (required + checks.length)) * 100),
    missing: checks.filter((item) => !item.ok).map((item) => ({ label: item.label, target: item.target }))
  };
}

function SomatotypePicker({ value, onChange }: { value: Somatotype; onChange: (value: Somatotype) => void }) {
  const options = Object.keys(SOMATOTYPE_LABELS) as Somatotype[];
  return (
    <div className="space-y-2">
      <p className="field-label">Biotipo percebido</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-2xl border p-3 text-left ${value === option ? "border-primary bg-primary-light" : "border-outline bg-white"}`}
            onClick={() => onChange(option)}
          >
            <span className="block text-sm font-semibold text-ink">{SOMATOTYPE_LABELS[option]}</span>
            <span className="mt-1 block text-xs leading-5 text-muted">{SOMATOTYPE_DESCRIPTIONS[option]}</span>
          </button>
        ))}
      </div>
      <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-muted">
        O biotipo é usado apenas como ajuste contextual. A base principal dos cálculos continua sendo peso, altura, idade, sexo, atividade, objetivo e evolução real.
      </p>
    </div>
  );
}

function ResetDataModal({
  scope,
  onClose,
  onConfirm
}: {
  scope: ResetScope | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setStep(1);
    setTyped("");
  }, [scope]);
  if (!scope) return null;
  const selected = resetOptions.find((option) => option.scope === scope)!;

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
            <button className="flex min-h-11 items-center justify-center rounded-xl bg-danger px-3 text-sm font-semibold text-white" type="button" onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm leading-6 text-slate-600">
            Segunda confirmação: escreva <strong>APAGAR</strong> para confirmar.
          </p>
          <label className="field-label mb-4">Confirmação
            <input autoFocus value={typed} onChange={(event) => setTyped(event.target.value.toUpperCase())} placeholder="APAGAR" />
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

function AuthModal({
  open,
  onClose,
  onDone
}: {
  open: boolean;
  onClose: () => void;
  onDone: (mode: "signin" | "signup", email: string, password: string) => Promise<AuthSyncResult>;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <Modal open title="Conta Supabase" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await onDone(mode, email, password);
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Não foi possível autenticar.");
        } finally {
          setBusy(false);
        }
      }}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`toggle-button ${mode === "signin" ? "selected" : ""}`} onClick={() => setMode("signin")}>Entrar</button>
          <button type="button" className={`toggle-button ${mode === "signup" ? "selected" : ""}`} onClick={() => setMode("signup")}>Criar conta</button>
        </div>
        <label className="field-label">E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="field-label">Senha<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="btn-primary w-full py-3" type="submit" disabled={busy}>{busy ? "Aguarde..." : "Continuar"}</button>
      </form>
    </Modal>
  );
}

function CloudChoiceModal({
  open,
  busy,
  onClose,
  onUpload,
  onUseCloud,
  onExport
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
        Encontramos dados neste dispositivo e/ou na nuvem. Escolha qual deseja usar.
      </p>
      <div className="space-y-2">
        <button className="btn-secondary w-full justify-center py-3 disabled:opacity-50" type="button" disabled={busy} onClick={onUseCloud}>Usar dados da nuvem</button>
        <button className="btn-primary w-full py-3 disabled:opacity-50" type="button" disabled={busy} onClick={onUpload}>Enviar dados deste dispositivo</button>
        <button className="btn-secondary w-full justify-center py-3" type="button" onClick={onExport}>Exportar backup antes</button>
      </div>
    </Modal>
  );
}

function EntryList<T extends { id: string; date: string }>({
  entries,
  value,
  onEdit,
  onDelete
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
        <div key={entry.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-3">
          <div>
            <p className="text-sm font-medium">{value(entry)}</p>
            <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
          </div>
          <div className="flex gap-2 text-slate-400">
            <button onClick={() => onEdit(entry)}><Pencil size={16} /></button>
            <button onClick={() => onDelete(entry)}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeightModal({
  entry,
  onClose,
  onSave
}: {
  entry: WeightEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<WeightEntry, "id">) => void;
}) {
  const [weightText, setWeightText] = useState("");
  useEffect(() => {
    setWeightText(entry?.weight ? String(entry.weight) : "");
  }, [entry]);
  if (!entry) return null;
  return (
    <Modal open title="Peso semanal" onClose={onClose}>
      <form className="space-y-3" onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (!weightText) {
          window.alert("Peso pendente.");
          return;
        }
        onSave({ date: String(form.get("date")), weight: Number(weightText) });
      }}>
        <label className="field-label">Data<input type="date" name="date" required defaultValue={entry.date} /></label>
        <label className="field-label">Peso (kg)
          <input
            type="number"
            name="weight"
            min="1"
            step="0.1"
            required
            value={weightText}
            placeholder="Ex: 74"
            onChange={(event) => setWeightText(event.target.value.replace(/^0+(?=\d)/, ""))}
          />
        </label>
        <button className="btn-primary w-full py-3" type="submit">Guardar peso</button>
      </form>
    </Modal>
  );
}

function MeasurementModal({
  entry,
  focusKey,
  onClose,
  onSave
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
    <Modal open title="Medidas mensais" onClose={onClose}>
      <form className="space-y-3" onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        onSave({ date: String(fields.get("date")), ...form });
      }}>
        <label className="field-label">Data<input type="date" name="date" required defaultValue={entry.date} /></label>
        <div className="grid grid-cols-2 gap-3">
          {measurementFields.map(({ key, label }) => (
            <NumberField key={key} label={label} step="0.1" optional placeholder="Opcional" autoFocus={focusKey === key} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />
          ))}
        </div>
        <button className="btn-primary w-full py-3" type="submit">Guardar medidas</button>
      </form>
    </Modal>
  );
}
