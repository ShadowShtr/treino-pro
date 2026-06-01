import {
  ACTIVITY_LABELS,
  OBJECTIVE_LABELS,
  calculateTargets
} from "../lib/fitnessFormulas";
import type { Measurements, Profile } from "../types";

export function GoalsExplanation({ profile, measurements }: { profile: Profile; measurements?: Measurements }) {
  const canCalculate = profile.idade > 0 && profile.altura > 0 && profile.pesoAtual > 0;
  const targets = canCalculate ? calculateTargets(profile) : null;
  const bmi = profile.altura > 0 && profile.pesoAtual > 0
    ? profile.pesoAtual / (profile.altura / 100) ** 2
    : null;
  const waist = measurements?.cintura ?? 0;
  const waistHeight = waist > 0 && profile.altura > 0 ? waist / profile.altura : null;
  const hasCompleteBody = Boolean(waistHeight && measurements && Object.values(measurements).every((value) => value > 0) && profile.biotipo);

  return (
    <section className="rounded-3xl border border-outline bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-primary">Resumo corporal e metas</p>
      <div className="mb-4 space-y-1.5 text-sm text-slate-600">
        <p>Com base nos seus dados:</p>
        <p>
          Peso: <strong>{profile.pesoAtual} kg</strong> · Altura: <strong>{profile.altura} cm</strong> · Idade: <strong>{profile.idade} anos</strong>
        </p>
        <p>IMC: <strong>{bmi ? bmi.toFixed(1) : "pendente"}</strong></p>
        <p>
          Relação cintura/altura:{" "}
          <strong>{waistHeight ? waistHeight.toFixed(2) : "pendente"}</strong>
          {!waistHeight && " — adicione a medida da cintura para calcular."}
        </p>
        <p>Risco contextual de cintura: <strong>{waistHeight ? waistRisk(waistHeight) : "pendente"}</strong></p>
        <p>Percentual de gordura: <strong>{measurements?.gordura ? `${measurements.gordura}%` : "não informado"}</strong></p>
        <p>Biotipo: <strong>{profile.biotipo || "não informado"}</strong>{!profile.biotipo && " — usado apenas como referência visual."}</p>
        <p>
          Atividade: <strong>{ACTIVITY_LABELS[profile.atividade]}</strong> ({targets?.activityFactor ?? "pendente"}x)
        </p>
        <p className="pt-2">TMB estimada: <strong>{targets ? `${targets.bmr} kcal` : "pendente"}</strong></p>
        <p>Gasto diário estimado: <strong>{targets ? `${targets.tdee} kcal` : "pendente"}</strong></p>
        <p className="pt-2">Objetivo: <strong>{OBJECTIVE_LABELS[profile.objetivo]}</strong></p>
        <p className="text-base text-ink">Meta diária: <strong>{targets ? `${targets.calories} kcal` : "pendente"}</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Goal label="Proteína" value={targets ? `${targets.protein} g/dia` : "pendente"} />
        <Goal label="Carboidratos" value={targets ? `${targets.carbs} g/dia` : "pendente"} />
        <Goal label="Gorduras" value={targets ? `${targets.fats} g/dia` : "pendente"} />
        <Goal label="Água base" value={targets ? `${targets.waterMl} ml/dia` : "pendente"} />
      </div>
      <p className="mt-4 rounded-2xl bg-primary-light p-3 text-xs leading-5 text-slate-600">
        {hasCompleteBody
          ? "Com base no peso, altura, idade, atividade, objetivo, cintura e medidas corporais, o app calculou as metas e gerou uma leitura corporal estimada mais completa."
          : "Com os dados atuais, o app conseguiu calcular TMB, gasto diário, calorias e macros. Para uma leitura corporal mais completa, adicione cintura, medidas mensais e percentual de gordura."}
      </p>
    </section>
  );
}

function waistRisk(ratio: number): string {
  if (ratio < 0.5) return "baixo";
  if (ratio < 0.6) return "atenção";
  return "elevado";
}

function Goal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-light p-3">
      <span className="block text-xs text-muted">{label}</span>
      <strong className="mt-1 block text-base text-ink">{value}</strong>
    </div>
  );
}
