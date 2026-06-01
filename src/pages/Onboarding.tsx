import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Ruler,
  Sparkles,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { todayISO } from "../lib/date";
import { emptyMeasurements } from "../data/seed";
import { GoalsExplanation } from "../components/GoalsExplanation";
import { Modal } from "../components/Ui";
import { SOMATOTYPE_DESCRIPTIONS, SOMATOTYPE_LABELS } from "../lib/fitnessFormulas";
import { exportBackup } from "../lib/storage";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, Measurements, Profile, Somatotype, SyncStatus } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];
type Step = 0 | 1 | 2;

interface Props {
  onFinish: (profile: Profile, measurements: Measurements) => void;
  onDemo: () => void;
  data: FitnessData;
  actions: Actions;
  syncStatus: SyncStatus;
}

const objectiveOptions: { value: Profile["objetivo"]; label: string; desc: string }[] = [
  { value: "manter", label: "Manter peso", desc: "Equilibrar calorias" },
  { value: "ganho_controlado", label: "Ganho muscular", desc: "Superávit controlado" },
  { value: "perda_controlada", label: "Perda de peso", desc: "Déficit controlado" },
  { value: "recomposicao", label: "Recomposição", desc: "Perder gordura e ganhar músculo" },
];

const activityOptions: { value: Profile["atividade"]; label: string; desc: string }[] = [
  { value: "sedentario", label: "Sedentário", desc: "Pouco ou nenhum exercício" },
  { value: "leve", label: "Leve", desc: "Exercício 1–3x por semana" },
  { value: "moderado", label: "Moderado", desc: "Exercício 3–5x por semana" },
  { value: "intenso", label: "Intenso", desc: "Exercício 6–7x por semana" },
  { value: "muito_intenso", label: "Muito intenso", desc: "Treino duas vezes ao dia" },
];

// ─────────────────────────────────────────────────────
// Main Onboarding wizard
// ─────────────────────────────────────────────────────
export function Onboarding({ onFinish, onDemo, data, actions, syncStatus }: Props) {
  const [step, setStep] = useState<Step>(0);
  const { isSignedIn } = useAuth();

  function handleSignIn() {
    const clerkDomain = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
      ?.replace("pk_test_", "")
      ?.replace("pk_live_", "")
      ?.split(".")[0];
    const base = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_")
      ? `https://${clerkDomain}.clerk.accounts.com`
      : `https://closing-cat-49.clerk.accounts.dev`;
    window.location.href = `${base}/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
  }
  const [profile, setProfile] = useFormProfile();
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show conflict modal when Clerk auth succeeds and there's a data conflict
  useEffect(() => {
    if (syncStatus.state === "pending" && syncStatus.authenticated) {
      setChoiceOpen(true);
    }
  }, [syncStatus.state, syncStatus.authenticated]);

  function finish() {
    if (!profile.idade || !profile.altura || !profile.pesoAtual) {
      window.alert("Preencha idade, altura e peso atual para calcular as metas iniciais.");
      return;
    }
    onFinish({ ...profile, createdAt: todayISO() }, measurements);
  }

  return (
    <main className="min-h-dvh bg-app pb-10">
      <div className="mx-auto max-w-md px-5 pt-[max(28px,env(safe-area-inset-top))]">

        {/* Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary">
            <Activity size={28} />
          </div>
          <div>
            <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">TREINO PRO</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {step === 0 && "Bem-vindo"}
              {step === 1 && "Seu perfil"}
              {step === 2 && "Medidas iniciais"}
            </h1>
          </div>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? "bg-primary" : "bg-slate-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? "bg-primary" : "bg-slate-200"}`} />
            <span className="ml-1 shrink-0 text-xs font-semibold text-muted">Passo {step} de 2</span>
          </div>
        )}

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-base leading-7 text-muted">
              Registe treinos, alimentação e evolução corporal — tudo guardado com segurança neste dispositivo.
            </p>

            {/* Account card */}
            <div className="form-card">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">
                  <Cloud size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Já tem conta?</p>
                  <p className="text-xs text-muted">Entre para restaurar dados da nuvem</p>
                </div>
              </div>
              {isSignedIn ? (
                <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-success">
                  <CheckCircle2 size={16} /> Conta conectada — dados a sincronizar
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-secondary w-full justify-center gap-2 py-3"
                  onClick={handleSignIn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Entrar com Google
                </button>
              )}
            </div>

            {/* Demo */}
            <button
              type="button"
              onClick={onDemo}
              className="btn-secondary flex w-full items-center justify-between py-3.5"
            >
              <span className="flex items-center gap-2 text-muted">
                <Sparkles size={17} className="text-primary" /> Ver app com dados de exemplo
              </span>
              <ArrowRight size={17} className="text-primary" />
            </button>

            {/* Start */}
            <button
              type="button"
              className="btn-primary w-full py-4 text-base font-bold"
              onClick={() => setStep(1)}
            >
              Criar meu perfil <ArrowRight size={19} />
            </button>
          </div>
        )}

        {/* ── Step 1: Profile ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Basic info */}
            <div className="form-card space-y-3">
              <p className="text-sm font-bold text-ink">Dados básicos</p>
              <label className="field-label">
                Nome <span className="font-normal text-slate-400">(opcional)</span>
                <input
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  placeholder="Como posso te chamar?"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Idade"
                  value={profile.idade}
                  placeholder="Ex: 26"
                  onChange={(idade) => setProfile({ ...profile, idade })}
                />
                <label className="field-label">
                  Sexo
                  <select
                    value={profile.sexo}
                    onChange={(e) => setProfile({ ...profile, sexo: e.target.value as Profile["sexo"] })}
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </label>
                <NumberField
                  label="Altura (cm)"
                  value={profile.altura}
                  placeholder="Ex: 175"
                  onChange={(altura) => setProfile({ ...profile, altura })}
                />
                <NumberField
                  label="Peso atual (kg)"
                  value={profile.pesoAtual}
                  step="0.1"
                  placeholder="Ex: 74"
                  onChange={(pesoAtual) => setProfile({ ...profile, pesoAtual })}
                />
                <NumberField
                  label="Peso desejado"
                  value={profile.pesoDesejado}
                  step="0.1"
                  optional
                  placeholder="Opcional"
                  onChange={(pesoDesejado) => setProfile({ ...profile, pesoDesejado })}
                />
                <NumberField
                  label="Treinos/semana"
                  value={profile.frequenciaTreino}
                  max={7}
                  onChange={(frequenciaTreino) => setProfile({ ...profile, frequenciaTreino })}
                />
              </div>
            </div>

            {/* Objective */}
            <div className="form-card space-y-3">
              <p className="text-sm font-bold text-ink">Objetivo principal</p>
              <div className="grid grid-cols-2 gap-2">
                {objectiveOptions.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-2xl border p-3 text-left transition-all ${profile.objetivo === value ? "border-primary bg-primary-light" : "border-outline bg-white"}`}
                    onClick={() => setProfile({ ...profile, objetivo: value })}
                  >
                    <span className={`block text-sm font-semibold ${profile.objetivo === value ? "text-primary" : "text-ink"}`}>
                      {label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-muted">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity level */}
            <div className="form-card space-y-2">
              <p className="mb-1 text-sm font-bold text-ink">Nível de atividade</p>
              {activityOptions.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all ${profile.atividade === value ? "border-primary bg-primary-light" : "border-outline bg-white"}`}
                  onClick={() => setProfile({ ...profile, atividade: value })}
                >
                  <span>
                    <span className={`block text-sm font-semibold ${profile.atividade === value ? "text-primary" : "text-ink"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-muted">{desc}</span>
                  </span>
                  {profile.atividade === value && <CheckCircle2 size={18} className="shrink-0 text-primary" />}
                </button>
              ))}
            </div>

            {/* Somatotype */}
            <CompactSomatotypePicker
              value={profile.biotipo ?? "nao_sei"}
              onChange={(biotipo) => setProfile({ ...profile, biotipo })}
            />

            <div className="grid grid-cols-2 gap-3 pb-2">
              <button type="button" className="btn-secondary justify-center py-3.5" onClick={() => setStep(0)}>
                <ArrowLeft size={17} /> Voltar
              </button>
              <button type="button" className="btn-primary py-3.5" onClick={() => setStep(2)}>
                Próximo <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Measurements ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="form-card space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-primary-light p-3">
                <Ruler size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm leading-5 text-primary">
                  Todos os campos são opcionais — pode preencher depois. Quanto mais dados, mais preciso o acompanhamento.
                </p>
              </div>
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
            </div>

            <GoalsExplanation profile={profile} measurements={measurements} />

            <div className="grid grid-cols-2 gap-3 pb-2">
              <button type="button" className="btn-secondary justify-center py-3.5" onClick={() => setStep(1)}>
                <ArrowLeft size={17} /> Voltar
              </button>
              <button type="button" className="btn-primary py-3.5 font-bold" onClick={finish}>
                <CheckCircle2 size={17} /> Criar perfil
              </button>
            </div>
          </div>
        )}
      </div>

      <OnboardingCloudChoiceModal
        open={choiceOpen}
        busy={busy}
        onClose={() => setChoiceOpen(false)}
        onUseCloud={async () => {
          setBusy(true);
          try { await actions.loadFromCloud(); setChoiceOpen(false); }
          finally { setBusy(false); }
        }}
        onUpload={async () => {
          setBusy(true);
          try { await actions.uploadToCloud(); setChoiceOpen(false); }
          finally { setBusy(false); }
        }}
        onExport={() => exportBackup(data)}
      />
    </main>
  );
}

// ─────────────────────────────────────────────────────
// Cloud choice modal
// ─────────────────────────────────────────────────────
function OnboardingCloudChoiceModal({
  open, busy, onClose, onUseCloud, onUpload, onExport,
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
// Compact somatotype picker
// ─────────────────────────────────────────────────────
function CompactSomatotypePicker({ value, onChange }: { value: Somatotype; onChange: (v: Somatotype) => void }) {
  const options = Object.keys(SOMATOTYPE_LABELS) as Somatotype[];
  return (
    <div className="form-card space-y-3">
      <p className="text-sm font-bold text-ink">Biotipo percebido <span className="font-normal text-slate-400">(opcional)</span></p>
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
      <p className="text-[11px] leading-5 text-muted">
        O biotipo é apenas um ajuste contextual. A base principal são peso, altura, idade, sexo e nível de atividade.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Exports used by ProfilePage
// ─────────────────────────────────────────────────────
export const measurementFields: { key: keyof Measurements; label: string }[] = [
  { key: "cintura", label: "Cintura (cm)" },
  { key: "abdomen", label: "Abdómen (cm)" },
  { key: "peito", label: "Peito (cm)" },
  { key: "braco", label: "Braço (cm)" },
  { key: "antebraco", label: "Antebraço (cm)" },
  { key: "coxa", label: "Coxa (cm)" },
  { key: "panturrilha", label: "Panturrilha (cm)" },
  { key: "gluteo", label: "Glúteo (cm)" },
  { key: "pescoco", label: "Pescoço (cm)" },
  { key: "gordura", label: "Gordura (%)" },
];

export function NumberField({
  label,
  value,
  step = "1",
  max,
  optional = false,
  placeholder,
  onChange,
  autoFocus = false,
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
  useEffect(() => { setText(value > 0 ? String(value) : ""); }, [value]);

  function change(raw: string) {
    const normalized = raw.replace(/^0+(?=\d)/, "");
    setText(normalized);
    if (normalized === "") { onChange(0); return; }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) onChange(parsed);
  }

  return (
    <label className="field-label">
      {label}
      <input
        required={!optional}
        type="number"
        min="0"
        max={max}
        step={step}
        value={text}
        placeholder={placeholder ?? (optional ? "Opcional" : "Pendente")}
        autoFocus={autoFocus}
        onFocus={() => { if (text === "0") setText(""); }}
        onChange={(e) => change(e.target.value)}
      />
    </label>
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
    createdAt: "",
  });
}
