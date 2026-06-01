import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Droplets, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { macrosForItem, macrosForLog } from "../lib/calculations";
import { calculateTargets, calculateWaterTarget } from "../lib/fitnessFormulas";
import { daysInMonth, formatDate, todayISO } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { DayLog, FitnessData, Food, MealItem } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];
type MealId = keyof DayLog["meals"];

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_HEADERS = ["D","S","T","Q","Q","S","S"];

const mealEntries: { id: MealId; label: string }[] = [
  { id: "refeicao1", label: "Café da manhã" },
  { id: "refeicao2", label: "Lanche da manhã" },
  { id: "refeicao3", label: "Almoço" },
  { id: "refeicao4", label: "Lanche da tarde" },
  { id: "refeicao5", label: "Jantar" },
  { id: "refeicao6", label: "Ceia" }
];

function hasLogData(log: DayLog | undefined): boolean {
  if (!log) return false;
  return Object.values(log.meals).some((m) => m.length > 0) || log.waterMl > 0 || log.creatine !== null;
}

// ─── Month calendar ───────────────────────────────────────────────────────────
function MonthCalendar({
  selected,
  logs,
  onChange
}: {
  selected: string;
  logs: Record<string, DayLog>;
  onChange: (date: string) => void;
}) {
  const [ym, setYm] = useState(() => ({ year: Number(selected.slice(0, 4)), month: Number(selected.slice(5, 7)) }));
  const today = todayISO();

  function prevMonth() {
    setYm(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });
  }
  function nextMonth() {
    setYm(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 });
  }

  const monthStr = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
  const days = daysInMonth(monthStr);
  const firstDow = new Date(`${days[0]}T12:00:00`).getDay(); // 0=Sun
  const blanks = Array(firstDow).fill(null);

  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-xl p-2 text-muted hover:bg-slate-100 active:bg-slate-200">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-ink">
          {MONTH_NAMES[ym.month - 1]} {ym.year}
        </span>
        <button type="button" onClick={nextMonth} className="rounded-xl p-2 text-muted hover:bg-slate-100 active:bg-slate-200">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center">
        {DAY_HEADERS.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-muted">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map((date) => {
          const day = Number(date.slice(8));
          const isSelected = date === selected;
          const isToday = date === today;
          const hasData = hasLogData(logs[date]);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onChange(date)}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : isToday
                  ? "border border-primary text-primary font-bold"
                  : "text-ink hover:bg-slate-100"
              }`}
            >
              {day}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-70" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Water section ────────────────────────────────────────────────────────────
function WaterSection({
  waterMl,
  waterTarget,
  onAdd
}: {
  waterMl: number;
  waterTarget: number;
  onAdd: (amount: number) => void;
}) {
  const cups = Math.floor(waterMl / 250);
  const pct = waterTarget > 0 ? Math.min(1, waterMl / waterTarget) : 0;

  return (
    <div className="mt-4 rounded-2xl border border-outline bg-slate-50 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplets size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-ink">Água</span>
        </div>
        <span className="text-sm font-bold text-blue-600">
          {waterMl} <span className="text-xs font-normal text-muted">/ {waterTarget} ml</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* Cup icons */}
      {cups > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {Array.from({ length: Math.min(cups, 12) }, (_, i) => (
            <span key={i} className="text-base">💧</span>
          ))}
          {cups > 12 && <span className="text-xs text-muted">+{cups - 12}</span>}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-1.5">
        <button
          type="button"
          className="rounded-xl border border-outline bg-white px-3 py-1.5 text-xs font-semibold text-danger active:bg-red-50"
          onClick={() => onAdd(-250)}
        >
          −250
        </button>
        {[250, 500, 750].map((ml) => (
          <button
            key={ml}
            type="button"
            className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 active:bg-blue-100"
            onClick={() => onAdd(ml)}
          >
            +{ml}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FoodPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const [date, setDate] = useState(todayISO());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<MealId | null>(null);
  const [editingItem, setEditingItem] = useState<{ meal: MealId; item: MealItem } | null>(null);
  const [copyMeal, setCopyMeal] = useState<MealId | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | undefined>();
  const [slotsVisible, setSlotsVisible] = useState(1);
  const log = data.logs[date];

  useEffect(() => {
    const filled = mealEntries.filter(({ id }) => (log?.meals[id]?.length ?? 0) > 0).length;
    setSlotsVisible((prev) => Math.max(prev, Math.max(1, filled)));
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const macros = macrosForLog(log);
  const targets = calculateTargets(data.profile!);
  const trained = data.completedWorkouts.some((entry) => entry.date === date);
  const waterTarget = calculateWaterTarget(data.profile!, trained);

  const caloriesPct = targets.calories > 0 ? Math.min(1, macros.calories / targets.calories) : 0;
  const ringR = 44, ringStroke = 8;
  const ringCircumference = 2 * Math.PI * ringR;
  const ringOffset = ringCircumference * (1 - caloriesPct);

  function handleWaterAdd(amount: number) {
    // allow -250 to remove water
    if (amount === -250) {
      const cur = log?.waterMl ?? 0;
      if (cur <= 0) return;
      actions.addWater(date, -250);
      return;
    }
    actions.addWater(date, amount);
  }

  return (
    <>
      <PageHeader
        eyebrow="Registo diário"
        title="Alimentação"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Calendário"
              className={`rounded-xl p-2.5 transition-colors ${calendarOpen ? "bg-white/30 text-white" : "bg-white/18 text-white"}`}
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <CalendarDays size={20} />
            </button>
            <input
              className="date-pill"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setCalendarOpen(false); }}
            />
          </div>
        }
      />

      {calendarOpen && (
        <MonthCalendar
          selected={date}
          logs={data.logs}
          onChange={(d) => { setDate(d); setCalendarOpen(false); }}
        />
      )}

      {/* Summary hero card */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg width={ringR * 2 + ringStroke} height={ringR * 2 + ringStroke} viewBox={`0 0 ${ringR * 2 + ringStroke} ${ringR * 2 + ringStroke}`}>
              <circle cx={ringR + ringStroke / 2} cy={ringR + ringStroke / 2} r={ringR} fill="none" stroke="#f1f5f9" strokeWidth={ringStroke} />
              <circle cx={ringR + ringStroke / 2} cy={ringR + ringStroke / 2} r={ringR} fill="none" stroke="#fc4c02" strokeWidth={ringStroke} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} transform={`rotate(-90 ${ringR + ringStroke / 2} ${ringR + ringStroke / 2})`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
              <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: 15, fontWeight: 800, fill: "#0f172a" }}>{Math.round(macros.calories)}</text>
              <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: 8, fill: "#94a3b8" }}>kcal</text>
            </svg>
          </div>

          <div className="flex-1 space-y-2.5">
            <FoodMacroBar label="Proteína" value={Math.round(macros.protein)} target={targets.protein} unit="g" color="bg-blue-500" />
            <FoodMacroBar label="Carbs" value={Math.round(macros.carbs)} target={targets.carbs} unit="g" color="bg-amber-500" />
            <FoodMacroBar label="Gordura" value={Math.round(macros.fats)} target={targets.fats} unit="g" color="bg-rose-400" />
          </div>
        </div>

        <WaterSection
          waterMl={log?.waterMl ?? 0}
          waterTarget={waterTarget}
          onAdd={handleWaterAdd}
        />

        {/* Creatine toggle */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-muted mr-1">Creatina:</span>
          <button type="button" className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${log?.creatine === true ? "bg-success text-white" : "border border-outline bg-slate-50 text-ink"}`} onClick={() => actions.setCreatine(date, true)}>
            <Check size={11} className="inline mr-1" />Tomei
          </button>
          <button type="button" className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${log?.creatine === false ? "bg-slate-400 text-white" : "border border-outline bg-slate-50 text-ink"}`} onClick={() => actions.setCreatine(date, false)}>
            Não tomei
          </button>
        </div>
      </Card>

      {/* Meal cards */}
      <div className="mb-4 space-y-3">
        {mealEntries.slice(0, slotsVisible).map(({ id, label }) => {
          const items = log?.meals[id] ?? [];
          const total = items.reduce((sum, item) => sum + macrosForItem(item).calories, 0);
          return (
            <Card key={id}>
              <SectionTitle aside={<span className="text-xs font-semibold text-primary">{Math.round(total)} kcal</span>}>
                {label}
              </SectionTitle>
              {items.length ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <MealRow key={item.id} item={item} onEdit={() => setEditingItem({ meal: id, item })} onRemove={() => actions.removeItem(date, id, item.id)} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">Toque em + para adicionar</p>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-primary flex-1 py-2.5" onClick={() => setActiveMeal(id)}>
                  <Plus size={16} /> Adicionar
                </button>
                <button type="button" className="icon-action" aria-label={`Copiar para ${label}`} onClick={() => setCopyMeal(id)}>
                  <Copy size={18} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {slotsVisible < mealEntries.length && (
        <button type="button" className="btn-secondary mb-4 w-full justify-center py-3" onClick={() => setSlotsVisible((v) => Math.min(v + 1, mealEntries.length))}>
          <Plus size={16} /> {mealEntries[slotsVisible]?.label}
        </button>
      )}

      {/* Custom foods */}
      <Card className="mb-4">
        <SectionTitle aside={<button type="button" className="text-sm font-medium text-primary" onClick={() => { setEditingFood(undefined); setCustomOpen(true); }}>+ Novo</button>}>
          Alimentos personalizados
        </SectionTitle>
        {data.foods.filter((food) => food.custom).length ? (
          <div className="space-y-2">
            {data.foods.filter((food) => food.custom).map((food) => (
              <div key={food.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{food.nome}</p>
                  <p className="text-xs text-slate-400">{food.calories} kcal / 100 g</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="text-xs font-medium text-primary" onClick={() => { setEditingFood(food); setCustomOpen(true); }}>Editar</button>
                  <button type="button" className="text-slate-400" onClick={() => actions.deleteFood(food.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Crie alimentos que usa no dia a dia.</Empty>
        )}
      </Card>

      {/* Modals */}
      <AddFoodModal
        open={activeMeal !== null}
        foods={data.foods}
        onClose={() => setActiveMeal(null)}
        onAdd={(item) => { if (activeMeal) actions.addItem(date, activeMeal, item); setActiveMeal(null); }}
      />
      <CopyMealModal
        open={copyMeal !== null}
        logs={data.logs}
        targetDate={date}
        onClose={() => setCopyMeal(null)}
        onCopy={(sourceDate, sourceMeal) => { if (copyMeal) actions.copyMeal(date, copyMeal, sourceDate, sourceMeal); setCopyMeal(null); }}
      />
      <CustomFoodModal
        open={customOpen}
        food={editingFood}
        onClose={() => setCustomOpen(false)}
        onSave={(food) => { actions.saveFood(food); setCustomOpen(false); }}
      />
      <EditItemModal
        entry={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(item) => { if (editingItem) actions.updateItem(date, editingItem.meal, item); setEditingItem(null); }}
      />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FoodMacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
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

function MealRow({ item, onEdit, onRemove }: { item: MealItem; onEdit: () => void; onRemove: () => void }) {
  const values = macrosForItem(item);
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.food.nome}</p>
        <p className="text-xs text-slate-400">
          {item.quantity} {item.measure === "g" ? "g" : (item.food.unitName ?? "un.")} • {Math.round(values.calories)} kcal • {Math.round(values.protein)} g prot.
        </p>
      </div>
      <button type="button" className="mt-1 text-slate-400" onClick={onEdit}><Pencil size={16} /></button>
      <button type="button" className="mt-1 text-slate-400" onClick={onRemove}><Trash2 size={16} /></button>
    </div>
  );
}

function AddFoodModal({ open, foods, onClose, onAdd }: { open: boolean; foods: Food[]; onClose: () => void; onAdd: (item: Omit<MealItem, "id">) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [measure, setMeasure] = useState<"g" | "unit">("g");
  const scrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | undefined>(undefined);

  const filtered = useMemo(
    () => foods.filter((food) => food.nome.toLowerCase().includes(search.toLowerCase())).slice(0, 80),
    [foods, search]
  );

  const previewMacros = useMemo(() => {
    if (!selected || !quantity || Number(quantity) <= 0) return null;
    const grams = measure === "unit" ? Number(quantity) * (selected.gramsPerUnit ?? selected.baseGrams) : Number(quantity);
    const factor = grams / selected.baseGrams;
    return {
      calories: Math.round(selected.calories * factor),
      protein: Math.round(selected.protein * factor * 10) / 10,
      carbs: Math.round(selected.carbs * factor * 10) / 10,
      fats: Math.round(selected.fats * factor * 10) / 10
    };
  }, [selected, quantity, measure]);

  function choose(food: Food) {
    if (scrollingRef.current) return;
    setSelected(food);
    setQuantity(food.unitName ? "1" : "100");
    setMeasure(food.unitName ? "unit" : "g");
  }

  function handleScroll() {
    scrollingRef.current = true;
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => { scrollingRef.current = false; }, 200);
  }

  function handleClose() {
    setSelected(null);
    setSearch("");
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Adicionar alimento"
      onClose={handleClose}
      onContentScroll={handleScroll}
      stickyTop={!selected ? (
        <label className="search-input">
          <Search size={17} />
          <input autoFocus placeholder="Pesquisar alimento..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      ) : undefined}
    >
      {!selected ? (
        <div className="space-y-2">
          {filtered.map((food) => (
            <button type="button" key={food.id} className="selection-row" onClick={() => choose(food)}>
              <span>{food.nome}</span>
              <small>{food.calories} kcal / 100 g</small>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-2xl bg-slate-50 py-4 text-center text-sm text-slate-400">Nenhum alimento encontrado.</p>
          )}
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!quantity || Number(quantity) <= 0) { window.alert("Quantidade pendente."); return; }
            onAdd({ food: selected, quantity: Number(quantity), measure });
            setSelected(null);
            setSearch("");
          }}
        >
          <div className="rounded-2xl bg-primary-light p-3">
            <p className="font-semibold text-ink">{selected.nome}</p>
            <p className="mt-0.5 text-xs text-primary">{selected.calories} kcal / 100 g</p>
            <div className="mt-2 flex gap-3">
              <span className="text-[11px] text-muted">Prot: {selected.protein}g</span>
              <span className="text-[11px] text-muted">Carbs: {selected.carbs}g</span>
              <span className="text-[11px] text-muted">Gord: {selected.fats}g</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">
              Quantidade
              <input type="number" min="0.1" step="0.1" required value={quantity} placeholder="Ex: 100" onChange={(e) => setQuantity(e.target.value.replace(/^0+(?=\d)/, ""))} />
            </label>
            <label className="field-label">
              Medida
              <select value={measure} onChange={(e) => setMeasure(e.target.value as "g" | "unit")}>
                <option value="g">gramas</option>
                {selected.unitName && <option value="unit">{selected.unitName}</option>}
              </select>
            </label>
          </div>

          {previewMacros && (
            <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <span className="font-semibold text-ink">Esta porção: </span>
              {previewMacros.calories} kcal, {previewMacros.protein} g prot, {previewMacros.carbs} g carbs, {previewMacros.fats} g gord
            </div>
          )}

          <button className="btn-primary w-full py-3" type="submit">Adicionar</button>
          <button className="w-full text-sm text-slate-500" type="button" onClick={() => setSelected(null)}>Voltar à pesquisa</button>
        </form>
      )}
    </Modal>
  );
}

function CopyMealModal({ open, logs, targetDate, onClose, onCopy }: { open: boolean; logs: Record<string, DayLog>; targetDate: string; onClose: () => void; onCopy: (date: string, meal: MealId) => void }) {
  const options = Object.values(logs).filter((log) => log.date !== targetDate).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Modal open={open} title="Copiar refeição" onClose={onClose}>
      {options.length ? (
        options.map((log) => (
          <div className="mb-4" key={log.date}>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">{formatDate(log.date)}</p>
            <div className="space-y-2">
              {mealEntries.filter(({ id }) => (log.meals[id]?.length ?? 0) > 0).map(({ id, label }) => (
                <button className="selection-row" type="button" key={id} onClick={() => onCopy(log.date, id)}>
                  <span>{label}</span>
                  <small>{log.meals[id]?.length ?? 0} itens</small>
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <Empty>Não existem refeições anteriores para copiar.</Empty>
      )}
    </Modal>
  );
}

function CustomFoodModal({ open, food, onClose, onSave }: { open: boolean; food?: Food; onClose: () => void; onSave: (food: Food) => void }) {
  const initial = food ?? { id: crypto.randomUUID(), nome: "", baseGrams: 100, calories: 0, protein: 0, carbs: 0, fats: 0, custom: true };
  const [form, setForm] = useState<Food>(initial);
  const [nutrition, setNutrition] = useState({ calories: initial.calories ? String(initial.calories) : "", protein: initial.protein ? String(initial.protein) : "", carbs: initial.carbs ? String(initial.carbs) : "", fats: initial.fats ? String(initial.fats) : "" });

  useEffect(() => {
    setForm(initial);
    setNutrition({ calories: initial.calories ? String(initial.calories) : "", protein: initial.protein ? String(initial.protein) : "", carbs: initial.carbs ? String(initial.carbs) : "", fats: initial.fats ? String(initial.fats) : "" });
  }, [food?.id, open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open={open} title={food ? "Editar alimento" : "Novo alimento"} onClose={onClose}>
      <form
        key={food?.id ?? "new"}
        className="space-y-3"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (Object.values(nutrition).some((v) => v === "")) { window.alert("Preencha os valores nutricionais. Use 0 quando o nutriente não existir."); return; }
          onSave({ ...form, id: food?.id ?? form.id, calories: Number(nutrition.calories || 0), protein: Number(nutrition.protein || 0), carbs: Number(nutrition.carbs || 0), fats: Number(nutrition.fats || 0), custom: true });
        }}
      >
        <label className="field-label">
          Nome
          <input required defaultValue={initial.nome} onChange={(e) => setForm((v) => ({ ...v, nome: e.target.value }))} />
        </label>
        <p className="text-xs text-slate-400">Valores nutricionais por 100 g</p>
        <div className="grid grid-cols-2 gap-3">
          {([["calories", "Calorias"], ["protein", "Proteína (g)"], ["carbs", "Carboidratos (g)"], ["fats", "Gorduras (g)"]] as [keyof typeof nutrition, string][]).map(([field, label]) => (
            <label className="field-label" key={field}>
              {label}
              <input type="number" min="0" step="0.1" required value={nutrition[field]} placeholder="Ex: 10" onChange={(e) => setNutrition((v) => ({ ...v, [field]: e.target.value.replace(/^0+(?=\d)/, "") }))} />
            </label>
          ))}
        </div>
        <button className="btn-primary w-full py-3" type="submit">Guardar alimento</button>
      </form>
    </Modal>
  );
}

function EditItemModal({ entry, onClose, onSave }: { entry: { meal: MealId; item: MealItem } | null; onClose: () => void; onSave: (item: MealItem) => void }) {
  const [quantity, setQuantity] = useState("");
  const [measure, setMeasure] = useState<"g" | "unit">("g");

  const previewMacros = useMemo(() => {
    if (!entry || !quantity || Number(quantity) <= 0) return null;
    const food = entry.item.food;
    const grams = measure === "unit" ? Number(quantity) * (food.gramsPerUnit ?? food.baseGrams) : Number(quantity);
    const factor = grams / food.baseGrams;
    return { calories: Math.round(food.calories * factor), protein: Math.round(food.protein * factor * 10) / 10, carbs: Math.round(food.carbs * factor * 10) / 10, fats: Math.round(food.fats * factor * 10) / 10 };
  }, [entry, quantity, measure]);

  useEffect(() => {
    if (entry) { setQuantity(String(entry.item.quantity)); setMeasure(entry.item.measure); }
  }, [entry]);

  if (!entry) return null;

  return (
    <Modal open title="Editar registo" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!quantity || Number(quantity) <= 0) { window.alert("Quantidade pendente."); return; } onSave({ ...entry.item, quantity: Number(quantity), measure }); }}>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm font-medium text-ink">{entry.item.food.nome}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">
            Quantidade
            <input type="number" min="0.1" step="0.1" value={quantity} placeholder="Ex: 100" onChange={(e) => setQuantity(e.target.value.replace(/^0+(?=\d)/, ""))} required />
          </label>
          <label className="field-label">
            Medida
            <select value={measure} onChange={(e) => setMeasure(e.target.value as "g" | "unit")}>
              <option value="g">gramas</option>
              {entry.item.food.unitName && <option value="unit">{entry.item.food.unitName}</option>}
            </select>
          </label>
        </div>
        {previewMacros && (
          <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <span className="font-semibold text-ink">Esta porção: </span>
            {previewMacros.calories} kcal, {previewMacros.protein} g prot, {previewMacros.carbs} g carbs, {previewMacros.fats} g gord
          </div>
        )}
        <button className="btn-primary w-full py-3" type="submit">Guardar alteração</button>
      </form>
    </Modal>
  );
}
