import { useEffect, useState, type ComponentType } from "react";
import {
  Activity,
  Apple,
  Beef,
  Bell,
  CalendarCheck,
  Droplets,
  Dumbbell,
  Flame,
  Info,
  Pencil,
  Pill,
  Ruler,
  Scale,
  Wheat
} from "lucide-react";
import { Card, Modal, ProgressBar, SectionTitle } from "../components/Ui";
import { completedMeals, macrosForLog } from "../lib/calculations";
import { calculateTargets, calculateWaterTarget } from "../lib/fitnessFormulas";
import { daysSince, todayISO, weekdayForDate, weekdays } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, TabId, WeightEntry } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];
type IconType = ComponentType<{ size?: number; className?: string }>;

export function HomePage({ data, actions, setTab }: { data: FitnessData; actions: Actions; setTab: (tab: TabId) => void }) {
  const [showFormula, setShowFormula] = useState(false);
  const [mealModal, setMealModal] = useState(false);
  const [waterModal, setWaterModal] = useState(false);
  const [weightModal, setWeightModal] = useState<WeightEntry | null>(null);
  const profile = data.profile!;
  const today = todayISO();
  const log = data.logs[today];
  const targets = calculateTargets(profile);
  const day = weekdayForDate(today);
  const weekday = weekdays.find((entry) => entry.id === day)?.label;
  const workout = data.workouts.find((entry) => entry.day === day)!;
  const trained = data.completedWorkouts.some((entry) => entry.date === today);
  const waterTarget = calculateWaterTarget(profile, trained);
  const lastWeight = [...data.weights].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastMeasures = [...data.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];
  const mealCount = completedMeals(log);
  const calories = Math.round(macrosForLog(log).calories);
  const cardioCalories = data.cardioEntries.filter((entry) => entry.date === today).reduce((total, entry) => total + entry.calories, 0);
  const weightDue = daysSince(lastWeight?.date) >= 7;
  const measuresDue = daysSince(lastMeasures?.date) >= 30;
  const streak = data.streak;
  const weeklyGoals = calculateWeeklyGoals(data);

  function startWorkout() {
    if (!workout.exercises.length) {
      window.alert("Nenhum treino definido para hoje.");
      return;
    }
    setTab("training");
  }

  return (
    <>
      <header className="brand-header mb-5 flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/17 p-2">
            <Activity size={24} />
          </div>
          <div className="leading-none">
            <p className="text-lg font-extrabold tracking-[0.12em]">TRAVIZANI</p>
            <p className="mt-1 text-xs font-semibold tracking-[0.34em] text-white/85">FITNESS</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Ver lembretes"
          className="rounded-xl bg-white/14 p-2.5"
          onClick={() => document.getElementById("lembretes-hoje")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Bell size={20} />
        </button>
      </header>

      <Card className="mb-4 strava-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="badge-primary">Hoje</span>
            <p className="mt-3 text-sm font-medium text-muted">Calorias consumidas</p>
            <h1 className="mt-1 text-4xl font-extrabold tabular-nums text-ink">{calories}</h1>
            <p className="text-sm text-muted">/ {targets.calories} kcal</p>
          </div>
          <Flame className="text-primary" size={34} />
        </div>
        <ProgressBar value={calories} target={targets.calories} />
      </Card>

      <Card className="mb-4">
        <SectionTitle>Comparativo do dia</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Calculation label="Consumo alimentar" value={`${calories} kcal`} />
          <Calculation label="Cardio" value={`-${cardioCalories} kcal`} />
          <Calculation label="Saldo parcial" value={`${calories - cardioCalories} kcal`} accent />
          <Calculation label="Meta alimentar" value={`${targets.calories} kcal`} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">O saldo é apenas comparativo. Não substitui avaliação profissional nem obriga a comer mais.</p>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <ProgressCard icon={Flame} label="Calorias hoje" value={`${calories} / ${targets.calories} kcal`} progress={calories} target={targets.calories} />
        <ProgressCard icon={Droplets} label="Água" value={`${liters(log?.waterMl ?? 0)} / ${liters(waterTarget)} L`} progress={log?.waterMl ?? 0} target={waterTarget} />
        <ProgressCard icon={Dumbbell} label="Treino do dia" value={workout.name || "Descanso"} progress={trained ? 1 : 0} target={1} badge={trained ? "Concluído" : workout.exercises.length ? "Pendente" : "Hoje"} />
        <ProgressCard icon={CalendarCheck} label="Sequência atual" value={`${streak.current} dias`} progress={streak.current} target={Math.max(streak.best, 1)} badge={`Melhor ${streak.best}`} />
        <ProgressCard icon={Scale} label="Peso atual" value={`${lastWeight?.weight ?? profile.pesoAtual} kg`} progress={weightDue ? 0 : 1} target={1} badge={weightDue ? "Pendente" : "Meta"} />
      </div>

      <SectionTitle>Ações rápidas</SectionTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <QuickAction icon={Apple} label="Adicionar refeição" onClick={() => setMealModal(true)} />
        <QuickAction icon={Droplets} label="Adicionar água" onClick={() => setWaterModal(true)} />
        <QuickAction icon={Pill} label="Marcar creatina" onClick={() => actions.setCreatine(today, log?.creatine !== true)} active={log?.creatine === true} />
        <QuickAction icon={Dumbbell} label="Iniciar treino" onClick={startWorkout} />
        <QuickAction icon={Scale} label="Atualizar peso" onClick={() => setWeightModal({ id: "", date: today, weight: profile.pesoAtual })} />
      </div>

      <Card className="mb-4">
        <SectionTitle
          aside={
            <button type="button" aria-label="Explicação dos cálculos" className="icon-action h-9 min-w-9" onClick={() => setShowFormula(true)}>
              <Info size={17} />
            </button>
          }
        >
          Meta estimada
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Calculation label="TMB" value={`${targets.bmr} kcal`} />
          <Calculation label="Gasto diário" value={`${targets.tdee} kcal`} />
          <Calculation label="Meta diária" value={`${targets.calories} kcal`} accent />
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <TargetCard icon={Beef} label="Proteína" value={`${targets.protein} g`} target={`${targets.protein} g`} />
        <TargetCard icon={Wheat} label="Carboidratos" value={`${targets.carbs} g`} target={`${targets.carbs} g`} />
      </div>

      <Card className="mb-4">
        <SectionTitle aside={<Droplets size={18} className="text-primary" />}>Água do dia</SectionTitle>
        <p className="text-2xl font-semibold text-ink">
          {liters(log?.waterMl ?? 0)} L <span className="text-sm font-normal text-muted">/ {liters(waterTarget)} L</span>
        </p>
        <ProgressBar value={log?.waterMl ?? 0} target={waterTarget} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[250, 500, 750].map((amount) => (
            <button type="button" key={amount} className="btn-secondary justify-center px-2" onClick={() => actions.addWater(today, amount)}>
              +{amount} ml
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-semibold text-ink">Treino de hoje</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">{weekday}</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">{workout.name || "Descanso"}</h2>
            <p className="mt-1 text-sm text-muted">
              {workout.exercises.length ? `${workout.exercises.length} exercícios` : "Sem treino planeado"}
            </p>
          </div>
          {workout.exercises.length > 0 && (
            <button className="btn-primary px-5 py-2.5" onClick={startWorkout}>
              {trained ? "Concluído" : "Iniciar"}
            </button>
          )}
        </div>
      </Card>

      <SectionTitle>Metas semanais</SectionTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <GoalCard label="Treinos" value={`${weeklyGoals.workouts}/5`} progress={weeklyGoals.workouts} target={5} />
        <GoalCard label="Alimentação" value={`${weeklyGoals.meals}/7 dias`} progress={weeklyGoals.meals} target={7} />
        <GoalCard label="Creatina" value={`${weeklyGoals.creatine}/7 dias`} progress={weeklyGoals.creatine} target={7} />
        <GoalCard label="Água" value={`${liters(weeklyGoals.avgWater)} L média`} progress={weeklyGoals.avgWater} target={3000} />
      </div>

      <div id="lembretes-hoje">
        <SectionTitle
          aside={
            <button className="flex items-center gap-1 text-sm font-medium text-primary" onClick={() => setTab("profile")}>
              <Pencil size={14} /> Editar metas
            </button>
          }
        >
          Lembretes rápidos
        </SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <ReminderChip icon={Scale} label="Atualizar peso" status={weightDue ? "Pendente" : "Em dia"} due={weightDue} onClick={() => setWeightModal({ id: "", date: today, weight: profile.pesoAtual })} />
          <ReminderChip
            icon={Pill}
            label="Creatina"
            status={log?.creatine === true ? "Tomada" : "Não registada"}
            due={log?.creatine !== true}
            onClick={() => actions.setCreatine(today, log?.creatine !== true)}
          />
          <ReminderChip icon={Ruler} label="Atualizar medidas" status={measuresDue ? "Pendente" : "Em dia"} due={measuresDue} onClick={() => setTab("profile")} />
          <ReminderChip icon={Dumbbell} label="Refeições" status={mealCount < 3 ? `${3 - mealCount} pendente(s)` : "Concluídas"} due={mealCount < 3} onClick={() => setTab("food")} />
        </div>
      </div>

      <Modal title="Como a meta é calculada" open={showFormula} onClose={() => setShowFormula(false)}>
        <p className="text-sm leading-6 text-muted">
          TMB = Mifflin-St Jeor ({targets.bmr} kcal). TDEE = TMB × fator de atividade ({targets.activityFactor}) = {targets.tdee} kcal. Meta por objetivo = TDEE × {targets.objectiveFactor} = {targets.baseCalories} kcal. Ajuste por biotipo = {Math.round(targets.somatotypeAdjustmentPercent * 100)}% ({targets.somatotypeAdjustmentCalories} kcal). Meta final = {targets.calories} kcal.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">Este ajuste é contextual e conservador. Deve ser confirmado pela evolução semanal de peso, medidas e desempenho.</p>
      </Modal>
      <Modal title="Adicionar refeição" open={mealModal} onClose={() => setMealModal(false)}>
        <div className="grid gap-2">
          {["Refeição 1", "Refeição 2", "Refeição 3"].map((meal) => (
            <button key={meal} type="button" className="btn-secondary justify-center py-3" onClick={() => { setMealModal(false); setTab("food"); }}>
              {meal}
            </button>
          ))}
        </div>
      </Modal>
      <Modal title="Adicionar água" open={waterModal} onClose={() => setWaterModal(false)}>
        <div className="grid grid-cols-3 gap-2">
          {[250, 500, 750].map((amount) => (
            <button key={amount} type="button" className="btn-secondary justify-center py-3" onClick={() => { actions.addWater(today, amount); setWaterModal(false); }}>
              +{amount} ml
            </button>
          ))}
        </div>
      </Modal>
      <WeightQuickModal
        entry={weightModal}
        onClose={() => setWeightModal(null)}
        onSave={(entry) => {
          if (actions.saveWeight(entry)) setWeightModal(null);
        }}
      />
    </>
  );
}

function TargetCard({ icon: Icon, label, value, target }: { icon: IconType; label: string; value: string; target: string }) {
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Icon size={16} className="text-primary" />
      </div>
      <strong className="block text-lg text-ink">{value}</strong>
      <p className="mt-1 text-xs text-muted">/meta {target}</p>
    </Card>
  );
}

function ProgressCard({ icon: Icon, label, value, progress, target, badge }: { icon: IconType; label: string; value: string; progress: number; target: number; badge?: string }) {
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Icon size={17} className="text-primary" />
        {badge && <span className="badge-soft">{badge}</span>}
      </div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 min-h-10 text-base font-bold leading-5 text-ink">{value}</p>
      <ProgressBar value={progress} target={target} />
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick, active = false }: { icon: IconType; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" className="quick-action" onClick={onClick}>
      <Icon size={23} className={active ? "text-success" : "text-primary"} />
      <span>{label}</span>
    </button>
  );
}

function GoalCard({ label, value, progress, target }: { label: string; value: string; progress: number; target: number }) {
  return (
    <Card className="p-3.5">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      <ProgressBar value={progress} target={target} />
    </Card>
  );
}

function Calculation({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-2 py-3 text-center ${accent ? "bg-primary-light" : "bg-slate-50"}`}>
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${accent ? "text-primary" : "text-ink"}`}>{value}</p>
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
  return (value / 1000).toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function calculateWeeklyGoals(data: FitnessData) {
  const today = new Date(`${todayISO()}T12:00:00`);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const logs = days.map((date) => data.logs[date]).filter(Boolean);
  return {
    workouts: data.completedWorkouts.filter((entry) => days.includes(entry.date)).length,
    meals: logs.filter((entry) => completedMeals(entry) > 0).length,
    creatine: logs.filter((entry) => entry.creatine === true).length,
    avgWater: Math.round(logs.reduce((total, entry) => total + entry.waterMl, 0) / Math.max(logs.length, 1))
  };
}

function WeightQuickModal({
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
    <Modal open title="Atualizar peso" onClose={onClose}>
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSave({ date: String(form.get("date")), weight: Number(weightText) });
      }}>
        <label className="field-label">Data<input type="date" name="date" required defaultValue={entry.date} /></label>
        <label className="field-label">Peso (kg)<input type="number" name="weight" min="30" max="300" step="0.1" required value={weightText} placeholder="Ex: 80" onChange={(event) => setWeightText(event.target.value.replace(/^0+(?=\d)/, ""))} /></label>
        <button className="btn-primary w-full py-3" type="submit">Guardar peso</button>
      </form>
    </Modal>
  );
}
