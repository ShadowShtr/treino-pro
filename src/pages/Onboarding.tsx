import { Activity, ArrowRight, Cloud, LogIn, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { todayISO } from "../lib/date";
import { emptyMeasurements } from "../data/seed";
import { GoalsExplanation } from "../components/GoalsExplanation";
import { Modal } from "../components/Ui";
import { SOMATOTYPE_DESCRIPTIONS, SOMATOTYPE_LABELS } from "../lib/fitnessFormulas";
import { exportBackup } from "../lib/storage";
import type { AuthSyncResult, useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, Measurements, Profile, Somatotype, SyncStatus } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

interface Props {
  onFinish: (profile: Profile, measurements: Measurements) => void;
  onDemo: () => void;
  data: FitnessData;
  actions: Actions;
  syncStatus: SyncStatus;
}

const objectiveLabels = {
  manter: "Manter peso",
  ganho_controlado: "Ganho controlado",
  perda_controlada: "Perda controlada",
  recomposicao: "Recomposição corporal"
};

export function Onboarding({ onFinish, onDemo, data, actions, syncStatus }: Props) {
  const [profile, setProfile] = useFormProfile();
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [authOpen, setAuthOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!profile.idade || !profile.altura || !profile.pesoAtual) {
      window.alert("Preencha idade, altura e peso atual para calcular as metas iniciais.");
      return;
    }
    onFinish({ ...profile, createdAt: todayISO() }, measurements);
  }

  return (
    <main className="min-h-dvh bg-app pb-8">
      <div className="mx-auto max-w-md px-5 pt-[max(30px,env(safe-area-inset-top))]">
        <div className="mb-7">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-primary">
            <Activity size={25} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">TRAVIZANI FITNESS</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Seu acompanhamento começa aqui.</h1>
          <p className="mt-3 leading-6 text-slate-500">
            Alimentação, medidas e treinos guardados apenas neste dispositivo.
          </p>
        </div>

        <button type="button" onClick={onDemo} className="btn-secondary mb-5 flex w-full items-center justify-between">
          <span className="flex items-center gap-2"><Sparkles size={17} /> Testar com dados de exemplo</span>
          <ArrowRight size={17} />
        </button>

        <section className="form-card mb-5">
          <div className="flex items-start gap-3">
            <Cloud size={20} className="mt-1 text-primary" />
            <div>
              <h2 className="form-title">Já tem conta?</h2>
              <p className="mb-3 text-sm leading-6 text-muted">
                Entre para carregar os dados salvos na nuvem antes de criar um novo perfil.
              </p>
              <p className="mb-3 text-xs leading-5 text-muted">{syncStatus.message}</p>
              <button className="btn-secondary w-full justify-center py-3" type="button" onClick={() => setAuthOpen(true)} disabled={!syncStatus.configured}>
                <LogIn size={17} /> Entrar / Criar conta
              </button>
            </div>
          </div>
        </section>

        <form className="space-y-4" onSubmit={submit}>
          <section className="form-card">
            <h2 className="form-title">Perfil inicial</h2>
            <p className="mb-3 rounded-2xl bg-primary-light p-3 text-sm leading-5 text-muted">
              Pode completar estes dados depois. Quanto mais informação adicionar, mais completo será o resumo corporal.
            </p>
            <label className="field-label">Nome <span className="font-normal text-slate-400">(opcional)</span>
              <input value={profile.nome} onChange={(event) => setProfile({ ...profile, nome: event.target.value })} placeholder="Pode preencher depois" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Idade" value={profile.idade} placeholder="Ex: 26" onChange={(idade) => setProfile({ ...profile, idade })} />
              <label className="field-label">Sexo
                <select value={profile.sexo} onChange={(event) => setProfile({ ...profile, sexo: event.target.value as Profile["sexo"] })}>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </label>
              <NumberField label="Altura (cm)" value={profile.altura} placeholder="Ex: 170" onChange={(altura) => setProfile({ ...profile, altura })} />
              <NumberField label="Peso atual (kg)" value={profile.pesoAtual} step="0.1" placeholder="Ex: 74" onChange={(pesoAtual) => setProfile({ ...profile, pesoAtual })} />
              <NumberField label="Peso desejado" value={profile.pesoDesejado} step="0.1" optional placeholder="Ex: 78" onChange={(pesoDesejado) => setProfile({ ...profile, pesoDesejado })} />
              <NumberField label="Treinos/semana" value={profile.frequenciaTreino} max={7} onChange={(frequenciaTreino) => setProfile({ ...profile, frequenciaTreino })} />
            </div>
            <label className="field-label">Objetivo principal
              <select value={profile.objetivo} onChange={(event) => setProfile({ ...profile, objetivo: event.target.value as Profile["objetivo"] })}>
                {Object.entries(objectiveLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="field-label">Nível de atividade
              <select value={profile.atividade} onChange={(event) => setProfile({ ...profile, atividade: event.target.value as Profile["atividade"] })}>
                <option value="sedentario">Sedentário</option>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="intenso">Intenso</option>
                <option value="muito_intenso">Muito intenso</option>
              </select>
            </label>
            <SomatotypePicker value={profile.biotipo ?? "nao_sei"} onChange={(biotipo) => setProfile({ ...profile, biotipo })} />
          </section>

          <section className="form-card">
            <h2 className="form-title">Medidas atuais <span className="font-normal text-slate-400">(cm)</span></h2>
            <div className="grid grid-cols-2 gap-3">
              {measurementFields.map(({ key, label }) => (
                <NumberField
                  key={key}
                  label={label}
                  value={measurements[key]}
                  step="0.1"
                  optional
                  placeholder="Opcional"
                  onChange={(value) => setMeasurements({ ...measurements, [key]: value })}
                />
              ))}
            </div>
          </section>

          <GoalsExplanation profile={profile} measurements={measurements} />
          <button className="btn-primary w-full py-4" type="submit">Criar meu perfil</button>
        </form>
      </div>
      <OnboardingAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onDone={async (mode, email, password) => {
          const result: AuthSyncResult = mode === "signup"
            ? await actions.signUp(email, password)
            : await actions.signIn(email, password);
          setAuthOpen(false);
          if (result === "choice-needed") setChoiceOpen(true);
        }}
      />
      <OnboardingCloudChoiceModal
        open={choiceOpen}
        busy={busy}
        onClose={() => setChoiceOpen(false)}
        onUseCloud={async () => {
          setBusy(true);
          try {
            await actions.loadFromCloud();
            setChoiceOpen(false);
          } finally {
            setBusy(false);
          }
        }}
        onUpload={async () => {
          setBusy(true);
          try {
            await actions.uploadToCloud();
            setChoiceOpen(false);
          } finally {
            setBusy(false);
          }
        }}
        onExport={() => exportBackup(data)}
      />
    </main>
  );
}

function OnboardingAuthModal({
  open,
  onClose,
  onDone
}: {
  open: boolean;
  onClose: () => void;
  onDone: (mode: "signin" | "signup", email: string, password: string) => Promise<void>;
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

function OnboardingCloudChoiceModal({
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

function useFormProfile() {
  return useState<Profile>({
    nome: "",
    idade: 0,
    sexo: "masculino",
    altura: 0,
    pesoAtual: 0,
    pesoDesejado: 0,
    biotipo: "nao_sei",
    objetivo: "manter",
    atividade: "moderado",
    frequenciaTreino: 3,
    createdAt: ""
  });
}

export const measurementFields: { key: keyof Measurements; label: string }[] = [
  { key: "cintura", label: "Cintura" },
  { key: "abdomen", label: "Abdómen" },
  { key: "peito", label: "Peito" },
  { key: "braco", label: "Braço" },
  { key: "antebraco", label: "Antebraço" },
  { key: "coxa", label: "Coxa" },
  { key: "panturrilha", label: "Panturrilha" },
  { key: "gluteo", label: "Glúteo" },
  { key: "pescoco", label: "Pescoço" },
  { key: "gordura", label: "Gordura (%)" }
];

export function NumberField({
  label,
  value,
  step = "1",
  max,
  optional = false,
  placeholder,
  onChange
  , autoFocus = false
}: {
  label: string;
  value: number;
  step?: string;
  max?: number;
  optional?: boolean;
  placeholder?: string;
  onChange: (value: number) => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : "");
  useEffect(() => {
    setText(value > 0 ? String(value) : "");
  }, [value]);

  function change(raw: string) {
    const normalized = raw.replace(/^0+(?=\d)/, "");
    setText(normalized);
    if (normalized === "") {
      onChange(0);
      return;
    }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) onChange(parsed);
  }

  return (
    <label className="field-label">{label}
      <input
        required={!optional}
        type="number"
        min="0"
        max={max}
        step={step}
        value={text}
        placeholder={placeholder ?? (optional ? "Opcional" : "Pendente")}
        autoFocus={autoFocus}
        onFocus={() => {
          if (text === "0") setText("");
        }}
        onChange={(event) => change(event.target.value)}
      />
    </label>
  );
}

function SomatotypePicker({ value, onChange }: { value: Somatotype; onChange: (value: Somatotype) => void }) {
  const options = Object.keys(SOMATOTYPE_LABELS) as Somatotype[];
  return (
    <div className="space-y-2">
      <p className="field-label">Biotipo percebido</p>
      {options.map((option) => (
        <button key={option} type="button" className={`w-full rounded-2xl border p-3 text-left ${value === option ? "border-primary bg-primary-light" : "border-outline bg-white"}`} onClick={() => onChange(option)}>
          <span className="block text-sm font-semibold text-ink">{SOMATOTYPE_LABELS[option]}</span>
          <span className="mt-1 block text-xs leading-5 text-muted">{SOMATOTYPE_DESCRIPTIONS[option]}</span>
        </button>
      ))}
      <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-muted">
        O biotipo é usado apenas como ajuste contextual. A base principal dos cálculos continua sendo peso, altura, idade, sexo, atividade, objetivo e evolução real.
      </p>
    </div>
  );
}
