import { useEffect, useState, type ComponentType } from "react";
import {
  Activity,
  Droplets,
  Info,
  Pencil,
  Pill,
  Ruler,
  Scale,
  UtensilsCrossed
} from "lucide-react";
import { Card, Modal, ProgressBar, SectionTitle } from "../components/Ui";
import { useToast } from "../components/Toast";
import { completedMeals, macrosForLog } from "../lib/calculations";
import { calculateTargets, calculateWaterTarget } from "../lib/fitnessFormulas";
import { daysSince, todayISO, weekdayForDate, weekdays } from "../lib/date";
import { haptic } from "../lib/haptic";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, TabId, WeightEntry } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];
type IconType = ComponentType<{ size?: number; className?: string }>;

export function HomePage({ data, actions, setTab }: { data: FitnessData; actions: Actions; setTab: (tab: TabId) => void }) {
  const [showFormula, setShowFormula] = useState(false);
  const [weightModal, setWeightModal] = useState<WeightEntry | null>(null);
  const toast = useToast();
  const profile = data.profile!;
  const today = todayISO();
  const log = data.logs[today];
  const targets = calculateTargets(profile);
  const day = weekdayForDate(today);
  const weekday = weekdays.find((entry) => entry.id === day);
  const workout = data.workouts.find((entry) => entry.day === day)!;
  const trained = data.completedWorkouts.some((entry) => entry.date === today);
  const waterTarget = calculateWaterTarget(profile, trained);
  const lastWeight = [...data.weights].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastMeasures = [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];
  const mealCount = completedMeals(log);
  const macros = macrosForLog(log);
  const calories = Math.round(macros.calories);
  const protein = Math.round(macros.protein);
  const carbs = Math.round(macros.carbs);
  const fats = Math.round(macros.fats);
  const cardioCalories = data.cardioEntries
    .filter((entry) => entry.date === today)
    .reduce((total, entry) => total + entry.calories, 0);
  const weightDue = daysSince(lastWeight?.date) >= 7;
  const measuresDue = daysSince(lastMeasures?.date) >= 30;
  const weeklyGoals = calculateWeeklyGoals(data);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const todayFormatted = new Date(`${today}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short"
  });

  const ringR = 52, ringStroke = 10;
  const ringCircumference = 2 * Math.PI * ringR;
  const caloriePercent = targets.calories > 0 ? Math.min(1, calories / targets.calories) : 0;
  const ringOffset = ringCircumference * (1 - caloriePercent);
  const avgWaterL = weeklyGoals.avgWater / 1000;

  // "O que falta hoje"
  const missingProtein = Math.max(0, targets.protein - protein);
  const missingWater = Math.max(0, waterTarget - (log?.waterMl ?? 0));
  const missingCalories = Math.max(0, targets.calories - calories);
  const hasMissing = missingProtein > 5 || missingWater > 250 || (missingCalories > 100 && calories > 0);

  // Last 7 days dots
  const last7 = getLast7Days(data);

  function addWater(amount: number) {
    haptic("light");
    actions.addWater(today, amount);
    if (amount > 0) toast(`+${amount} ml de água`, "info");
  }

  function startWorkout() {
    if (!workout?.exercises.length) { window.alert("Nenhum treino definido para hoje."); return; }
    setTab("training");
  }

  return (
    <>
      {/* Header */}
      <header className="brand-header mb-5 flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 px-2.5 py-1.5">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="white" aria-hidden="true">
              <path d="M3,3 L21,3 L21,7.5 L8,7.5 L8,9.5 L16,9.5 L16,13.5 L8,13.5 L8,16.5 L21,16.5 L21,21 L3,21 Z"/>
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-lg font-extrabold tracking-[0.12em]">EVOXE</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white/90">{greeting}, {profile.nome}!</p>
          <p className="mt-0.5 text-xs text-white/65 capitalize">{todayFormatted}</p>
        </div>
      </header>

      {/* 7-day dots strip */}
      <div className="mb-3 flex items-center justify-between px-1">
        {last7.map(({ date, short, hasFood, hasTrain, isToday }) => (
          <div key={date} className="flex flex-col items-center gap-1">
            <span className={`text-[9px] font-semibold ${isToday ? "text-primary" : "text-muted"}`}>{short}</span>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isToday ? "ring-2 ring-primary" : ""
            } ${hasFood && hasTrain ? "bg-primary" : hasFood ? "bg-primary/60" : hasTrain ? "bg-success/70" : "bg-slate-100"}`}>
              {(hasFood || hasTrain) && <span className="h-1.5 w-1.5 rounded-full bg-white/90" />}
            </div>
          </div>
        ))}
      </div>

      {/* Hero card */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width={ringR * 2 + ringStroke} height={ringR * 2 + ringStroke} viewBox={`0 0 ${ringR * 2 + ringStroke} ${ringR * 2 + ringStroke}`}>
              <circle cx={ringR + ringStroke / 2} cy={ringR + ringStroke / 2} r={ringR} fill="none" stroke="#f1f5f9" strokeWidth={ringStroke} />
              <circle cx={ringR + ringStroke / 2} cy={ringR + ringStroke / 2} r={ringR} fill="none" stroke="#fc4c02" strokeWidth={ringStroke} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} transform={`rotate(-90 ${ringR + ringStroke / 2} ${ringR + ringStroke / 2})`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-ink" style={{ fontSize: 17, fontWeight: 800 }}>{calories}</text>
              <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: 9, fill: "#94a3b8" }}>kcal</text>
            </svg>
          </div>
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Proteína" value={protein} target={targets.protein} unit="g" color="bg-blue-500" />
            <MacroBar label="Carbs" value={carbs} target={targets.carbs} unit="g" color="bg-amber-500" />
            <MacroBar label="Gordura" value={fats} target={targets.fats} unit="g" color="bg-rose-400" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <p className="text-xs text-muted">Meta: {targets.calories} kcal</p>
          {cardioCalories > 0 && <p className="text-xs font-semibold text-success">-{Math.round(cardioCalories)} kcal cardio</p>}
        </div>
      </Card>

      {/* "O que falta hoje" */}
      {hasMissing && (
        <Card className="mb-4 border-primary/20 bg-primary-light">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Ainda hoje</p>
          <div className="space-y-1.5">
            {missingProtein > 5 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">💪 Proteína</span>
                <span className="font-semibold text-primary">faltam {missingProtein}g</span>
              </div>
            )}
            {missingWater > 250 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">💧 Água</span>
                <span className="font-semibold text-blue-600">faltam {Math.round(missingWater / 100) * 100} ml</span>
              </div>
            )}
            {missingCalories > 100 && calories > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">🔥 Calorias</span>
                <span className="font-semibold text-primary">faltam {missingCalories} kcal</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Water card */}
      <Card className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-primary" />
            <span className="text-sm font-semibold text-ink">{liters(log?.waterMl ?? 0)} / {liters(waterTarget)} L</span>
          </div>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, waterTarget > 0 ? ((log?.waterMl ?? 0) / waterTarget) * 100 : 0)}%`, transition: "width 0.4s ease" }} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[250, 500, 750].map((amount) => (
            <button key={amount} type="button" className="btn-secondary justify-center px-1 text-xs" onClick={() => addWater(amount)}>
              +{amount}ml
            </button>
          ))}
          <button type="button" className="btn-secondary justify-center px-1 text-xs" onClick={() => { haptic("light"); actions.addWater(today, -(log?.waterMl ?? 0)); }}>
            Zerar
          </button>
        </div>
      </Card>

      {/* Quick tiles: Creatina + Peso */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button type="button" className="quick-action" onClick={() => { haptic("light"); actions.setCreatine(today, log?.creatine !== true); toast(log?.creatine !== true ? "Creatina marcada ✓" : "Creatina desmarcada"); }}>
          <Pill size={22} className={log?.creatine === true ? "text-success" : "text-primary"} />
          <span className="font-semibold text-ink">Creatina</span>
          <span className={`text-xs ${log?.creatine === true ? "text-success" : "text-muted"}`}>{log?.creatine === true ? "Tomada ✓" : "Marcar"}</span>
        </button>
        <button type="button" className="quick-action" onClick={() => setWeightModal({ id: "", date: today, weight: lastWeight?.weight ?? profile.pesoAtual })}>
          <Scale size={22} className="text-primary" />
          <span className="font-semibold text-ink">Peso</span>
          <span className="text-xs text-muted">{lastWeight ? `${lastWeight.weight} kg` : "Registar"}</span>
        </button>
      </div>

      {/* Today's workout */}
      {workout && (
        <Card className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{weekday?.label ?? "Hoje"}</p>
              <p className="mt-1 text-base font-bold text-ink">{workout.name || "Descanso"}</p>
              {workout.exercises.length > 0 && <p className="mt-0.5 text-xs text-muted">{workout.exercises.length} exercícios</p>}
              {workout.exercises.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {workout.exercises.slice(0, 4).map((ex) => (
                    <span key={ex.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">{ex.name}</span>
                  ))}
                  {workout.exercises.length > 4 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-muted">+{workout.exercises.length - 4}</span>}
                </div>
              )}
            </div>
            {workout.exercises.length > 0 && (
              <button type="button" className={`flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold text-white ${trained ? "bg-success" : "btn-primary"}`} onClick={startWorkout}>
                {trained ? "✓ Feito" : "Iniciar"}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Quick tiles: Alimentação + Cardio */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button type="button" className="quick-action" onClick={() => setTab("food")}>
          <UtensilsCrossed size={22} className="text-primary" />
          <span className="font-semibold text-ink">Alimentação</span>
          <span className="text-xs text-muted">{mealCount} de 3 refeições</span>
        </button>
        <button type="button" className="quick-action" onClick={() => setTab("cardio")}>
          <Activity size={22} className="text-primary" />
          <span className="font-semibold text-ink">Cardio</span>
          <span className={`text-xs ${cardioCalories > 0 ? "text-success" : "text-muted"}`}>{cardioCalories > 0 ? `-${Math.round(cardioCalories)} kcal` : "Registar"}</span>
        </button>
      </div>

      {/* Esta semana */}
      <SectionTitle>Esta semana</SectionTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <WeekCard label="Treinos" value={`${weeklyGoals.workouts}/5`} progress={weeklyGoals.workouts} target={5} />
        <WeekCard label="Alimentação" value={`${weeklyGoals.meals}/7 dias`} progress={weeklyGoals.meals} target={7} />
        <WeekCard label="Creatina" value={`${weeklyGoals.creatine}/7`} progress={weeklyGoals.creatine} target={7} />
        <WeekCard label="Água média" value={`${liters(weeklyGoals.avgWater)} L`} progress={avgWaterL} target={waterTarget / 1000} />
      </div>

      {/* Meta estimada */}
      <Card className="mb-4">
        <SectionTitle aside={<button type="button" aria-label="Explicação" className="icon-action h-9 min-w-9" onClick={() => setShowFormula(true)}><Info size={17} /></button>}>
          Meta estimada
        </SectionTitle>
        <div className="flex gap-2">
          <MetaPill label="TMB" value={`${targets.bmr} kcal`} />
          <MetaPill label="TDEE" value={`${targets.tdee} kcal`} />
          <MetaPill label="Meta" value={`${targets.calories} kcal`} accent />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">Calculado com Mifflin-St Jeor. TMB × fator de atividade = TDEE; TDEE × ajuste do objetivo = Meta.</p>
      </Card>

      {/* Lembretes */}
      <div id="lembretes-hoje">
        <SectionTitle aside={<button type="button" className="flex items-center gap-1 text-sm font-medium text-primary" onClick={() => setTab("profile")}><Pencil size={14} /> Editar</button>}>
          Lembretes
        </SectionTitle>
        <div className="mb-6 grid grid-cols-2 gap-2">
          <ReminderChip icon={Scale} label="Peso" status={weightDue ? "Atualizar" : "Em dia"} due={weightDue} onClick={() => setWeightModal({ id: "", date: today, weight: lastWeight?.weight ?? profile.pesoAtual })} />
          <ReminderChip icon={Pill} label="Creatina" status={log?.creatine === true ? "Tomada" : "Pendente"} due={log?.creatine !== true} onClick={() => { haptic("light"); actions.setCreatine(today, log?.creatine !== true); }} />
          <ReminderChip icon={Ruler} label="Medidas" status={measuresDue ? "Atualizar" : "Em dia"} due={measuresDue} onClick={() => setTab("profile")} />
          <ReminderChip icon={UtensilsCrossed} label="Refeições" status={mealCount < 3 ? `${mealCount}/3 feitas` : "Completas"} due={mealCount < 3} onClick={() => setTab("food")} />
        </div>
      </div>

      {/* Modals */}
      <Modal title="Como a meta é calculada" open={showFormula} onClose={() => setShowFormula(false)}>
        <p className="text-sm leading-6 text-muted"><strong>TMB</strong> = Mifflin-St Jeor = {targets.bmr} kcal</p>
        <p className="mt-3 text-sm leading-6 text-muted"><strong>TDEE</strong> = TMB × fator de atividade ({targets.activityFactor}) = {targets.tdee} kcal</p>
        <p className="mt-3 text-sm leading-6 text-muted"><strong>Meta</strong> = TDEE × ajuste por objetivo ({targets.objectiveFactor}) = {targets.baseCalories} kcal{targets.somatotypeAdjustmentCalories !== 0 && <> + biotipo ({targets.somatotypeAdjustmentCalories} kcal) = {targets.calories} kcal</>}</p>
        <p className="mt-3 text-xs leading-5 text-muted">Ajuste contextual e conservador. Confirme pela evolução semanal.</p>
      </Modal>

      <WeightQuickModal entry={weightModal} onClose={() => setWeightModal(null)} onSave={(entry) => { if (actions.saveWeight(entry)) { setWeightModal(null); toast("Peso registado ✓"); } }} />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="text-[11px] font-semibold text-ink">{value}<span className="font-normal text-muted">/{target}{unit}</span></span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function WeekCard({ label, value, progress, target }: { label: string; value: string; progress: number; target: number }) {
  return (
    <Card className="p-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{value}</p>
      <ProgressBar value={progress} target={target} />
    </Card>
  );
}

function MetaPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex-1 rounded-2xl px-2 py-2.5 text-center ${accent ? "bg-primary-light" : "bg-slate-50"}`}>
      <p className="text-[10px] text-muted">{label}</p>
      <p className={`mt-0.5 text-xs font-bold ${accent ? "text-primary" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function ReminderChip({ icon: Icon, label, status, due, onClick }: { icon: IconType; label: string; status: string; due: boolean; onClick: () => void }) {
  return (
    <button type="button" className="rounded-2xl border border-outline bg-white p-3 text-left shadow-card" onClick={onClick}>
      <Icon size={17} className={due ? "text-primary" : "text-success"} />
      <p className="mt-2 text-sm font-medium text-ink">{label}</p>
      <p className={`mt-1 text-xs ${due ? "text-primary" : "text-success"}`}>{status}</p>
    </button>
  );
}

function liters(value: number): string {
  return (value / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function calculateWeeklyGoals(data: FitnessData) {
  const today = new Date(`${todayISO()}T12:00:00`);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const logs = days.map((date) => data.logs[date]).filter(Boolean);
  return {
    workouts: data.completedWorkouts.filter((e) => days.includes(e.date)).length,
    meals: logs.filter((e) => completedMeals(e) > 0).length,
    creatine: logs.filter((e) => e.creatine === true).length,
    avgWater: Math.round(logs.reduce((t, e) => t + e.waterMl, 0) / Math.max(logs.length, 1))
  };
}

function getLast7Days(data: FitnessData) {
  const today = todayISO();
  const DAY_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 6 + i);
    const date = d.toISOString().slice(0, 10);
    const log = data.logs[date];
    const hasFood = Boolean(log && Object.values(log.meals).flat().length > 0);
    const hasTrain = data.completedWorkouts.some((e) => e.date === date);
    return { date, short: DAY_SHORT[d.getDay()], hasFood, hasTrain, isToday: date === today };
  });
}

function WeightQuickModal({ entry, onClose, onSave }: { entry: WeightEntry | null; onClose: () => void; onSave: (entry: Omit<WeightEntry, "id">) => void }) {
  const [weightText, setWeightText] = useState("");
  useEffect(() => { setWeightText(entry?.weight ? String(entry.weight) : ""); }, [entry]);
  if (!entry) return null;
  return (
    <Modal open title="Registar peso" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); onSave({ date: String(form.get("date")), weight: Number(weightText) }); }}>
        <label className="field-label">Data<input type="date" name="date" required defaultValue={entry.date} /></label>
        <label className="field-label">Peso (kg)<input type="number" name="weight" min="30" max="300" step="0.1" required value={weightText} placeholder="Ex: 80" onChange={(e) => setWeightText(e.target.value.replace(/^0+(?=\d)/, ""))} /></label>
        <button className="btn-primary w-full py-3" type="submit">Guardar peso</button>
      </form>
    </Modal>
  );
}
