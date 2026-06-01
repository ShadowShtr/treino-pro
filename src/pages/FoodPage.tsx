import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Copy, Droplets, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, Empty, Modal, PageHeader, ProgressBar, SectionTitle } from "../components/Ui";
import { macrosForItem, macrosForLog } from "../lib/calculations";
import { calculateTargets, calculateWaterTarget } from "../lib/fitnessFormulas";
import { formatDate, todayISO } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { DayLog, FitnessData, Food, MealItem } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];
type MealId = keyof DayLog["meals"];

const mealEntries: { id: MealId; label: string }[] = [
  { id: "refeicao1", label: "Refeição 1" },
  { id: "refeicao2", label: "Refeição 2" },
  { id: "refeicao3", label: "Refeição 3" }
];

export function FoodPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const [date, setDate] = useState(todayISO());
  const [activeMeal, setActiveMeal] = useState<MealId | null>(null);
  const [editingItem, setEditingItem] = useState<{ meal: MealId; item: MealItem } | null>(null);
  const [copyMeal, setCopyMeal] = useState<MealId | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | undefined>();
  const log = data.logs[date];
  const macros = macrosForLog(log);
  const targets = calculateTargets(data.profile!);
  const trained = data.completedWorkouts.some((entry) => entry.date === date);
  const waterTarget = calculateWaterTarget(data.profile!, trained);

  return (
    <>
      <PageHeader
        eyebrow="Registo diário"
        title="Alimentação"
        action={<input className="date-pill" type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
      />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Macro label="Calorias" value={Math.round(macros.calories)} target={targets.calories} suffix="kcal" />
          <Macro label="Proteína" value={Math.round(macros.protein)} target={targets.protein} suffix="g" />
          <Macro label="Carboidratos" value={Math.round(macros.carbs)} target={targets.carbs} suffix="g" />
          <Macro label="Gorduras" value={Math.round(macros.fats)} target={targets.fats} suffix="g" />
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle aside={<Droplets size={18} className="text-primary" />}>Água</SectionTitle>
        <p className="mb-1 text-sm text-slate-500">
          Recomendada {trained ? "em dia de treino" : "hoje"}: <strong className="text-slate-900">{waterTarget} ml</strong>
        </p>
        <p className="text-xl font-semibold">{log?.waterMl ?? 0} ml <span className="text-sm font-normal text-slate-400">ingeridos</span></p>
        <ProgressBar value={log?.waterMl ?? 0} target={waterTarget} />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[250, 500, 750].map((amount) => (
            <button type="button" className="btn-secondary justify-center px-1 text-xs" key={amount} onClick={() => actions.addWater(date, amount)}>
              +{amount}
            </button>
          ))}
          <button type="button" className="btn-secondary justify-center px-1 text-xs" onClick={() => actions.addWater(date, -(log?.waterMl ?? 0))}>
            Zerar
          </button>
        </div>
      </Card>

      <div className="mb-4 space-y-3">
        {mealEntries.map(({ id, label }) => {
          const items = log?.meals[id] ?? [];
          const total = items.reduce((sum, item) => sum + macrosForItem(item).calories, 0);
          return (
            <Card key={id}>
              <SectionTitle
                aside={<span className="text-xs text-slate-400">{Math.round(total)} kcal</span>}
              >
                {label}
              </SectionTitle>
              {items.length ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <MealRow
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem({ meal: id, item })}
                      onRemove={() => actions.removeItem(date, id, item.id)}
                    />
                  ))}
                </div>
              ) : (
                <Empty>Nenhum alimento registado.</Empty>
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

      <Card className="mb-4">
        <SectionTitle>Creatina diária</SectionTitle>
        <p className="mb-3 text-sm text-slate-500">Checklist simples, sem cálculo nutricional.</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`toggle-button ${log?.creatine === true ? "selected" : ""}`}
            onClick={() => actions.setCreatine(date, true)}
          >
            <Check size={17} /> Tomei
          </button>
          <button
            type="button"
            className={`toggle-button ${log?.creatine === false ? "selected-negative" : ""}`}
            onClick={() => actions.setCreatine(date, false)}
          >
            Não tomei
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle
          aside={<button className="text-sm font-medium text-primary" onClick={() => { setEditingFood(undefined); setCustomOpen(true); }}>+ Novo</button>}
        >
          Alimentos personalizados
        </SectionTitle>
        {data.foods.filter((food) => food.custom).length ? (
          <div className="space-y-2">
            {data.foods.filter((food) => food.custom).map((food) => (
              <div key={food.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{food.nome}</p>
                  <p className="text-xs text-slate-400">{food.calories} kcal / 100 g</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs font-medium text-primary" onClick={() => { setEditingFood(food); setCustomOpen(true); }}>Editar</button>
                  <button className="text-slate-400" onClick={() => actions.deleteFood(food.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Crie alimentos que usa no dia a dia.</Empty>
        )}
      </Card>

      <AddFoodModal
        open={activeMeal !== null}
        foods={data.foods}
        onClose={() => setActiveMeal(null)}
        onAdd={(item) => {
          if (activeMeal) actions.addItem(date, activeMeal, item);
          setActiveMeal(null);
        }}
      />
      <CopyMealModal
        open={copyMeal !== null}
        logs={data.logs}
        targetDate={date}
        onClose={() => setCopyMeal(null)}
        onCopy={(sourceDate, sourceMeal) => {
          if (copyMeal) actions.copyMeal(date, copyMeal, sourceDate, sourceMeal);
          setCopyMeal(null);
        }}
      />
      <CustomFoodModal
        open={customOpen}
        food={editingFood}
        onClose={() => setCustomOpen(false)}
        onSave={(food) => {
          actions.saveFood(food);
          setCustomOpen(false);
        }}
      />
      <EditItemModal
        entry={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(item) => {
          if (editingItem) actions.updateItem(date, editingItem.meal, item);
          setEditingItem(null);
        }}
      />
    </>
  );
}

function Macro({ label, value, target, suffix }: { label: string; value: number; target: number; suffix: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold">{value} <span className="font-normal text-slate-400">/ {target} {suffix}</span></p>
      <ProgressBar value={value} target={target} />
    </div>
  );
}

function MealRow({ item, onEdit, onRemove }: { item: MealItem; onEdit: () => void; onRemove: () => void }) {
  const values = macrosForItem(item);
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.food.nome}</p>
        <p className="text-xs text-slate-400">
          {item.quantity} {item.measure === "g" ? "g" : item.food.unitName ?? "un."} • {Math.round(values.calories)} kcal • {Math.round(values.protein)} g prot.
        </p>
      </div>
      <button className="mt-1 text-slate-400" onClick={onEdit}><Pencil size={16} /></button>
      <button className="mt-1 text-slate-400" onClick={onRemove}><Trash2 size={16} /></button>
    </div>
  );
}

function AddFoodModal({
  open,
  foods,
  onClose,
  onAdd
}: {
  open: boolean;
  foods: Food[];
  onClose: () => void;
  onAdd: (item: Omit<MealItem, "id">) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [measure, setMeasure] = useState<"g" | "unit">("g");
  const filtered = useMemo(
    () => foods.filter((food) => food.nome.toLowerCase().includes(search.toLowerCase())).slice(0, 20),
    [foods, search]
  );

  function choose(food: Food) {
    setSelected(food);
    setQuantity(food.unitName ? "1" : "100");
    setMeasure(food.unitName ? "unit" : "g");
  }

  return (
    <Modal open={open} title="Adicionar alimento" onClose={onClose}>
      {!selected ? (
        <>
          <label className="search-input mb-3"><Search size={17} /><input autoFocus placeholder="Pesquisar alimento..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="space-y-2">
            {filtered.map((food) => (
              <button type="button" key={food.id} className="selection-row" onClick={() => choose(food)}>
                <span>{food.nome}</span>
                <small>{food.calories} kcal / 100 g</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!quantity || Number(quantity) <= 0) {
            window.alert("Quantidade pendente.");
            return;
          }
          onAdd({ food: selected, quantity: Number(quantity), measure });
          setSelected(null);
          setSearch("");
        }}>
          <div className="rounded-2xl bg-primary-light p-3">
            <p className="font-medium text-ink">{selected.nome}</p>
            <p className="text-sm text-primary">{selected.calories} kcal / 100 g</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">Quantidade
              <input type="number" min="0.1" step="0.1" required value={quantity} placeholder="Ex: 100" onChange={(event) => setQuantity(event.target.value.replace(/^0+(?=\d)/, ""))} />
            </label>
            <label className="field-label">Medida
              <select value={measure} onChange={(event) => setMeasure(event.target.value as "g" | "unit")}>
                <option value="g">gramas</option>
                {selected.unitName && <option value="unit">{selected.unitName}</option>}
              </select>
            </label>
          </div>
          <button className="btn-primary w-full py-3" type="submit">Adicionar à refeição</button>
          <button className="w-full text-sm text-slate-500" type="button" onClick={() => setSelected(null)}>Voltar à pesquisa</button>
        </form>
      )}
    </Modal>
  );
}

function CopyMealModal({
  open,
  logs,
  targetDate,
  onClose,
  onCopy
}: {
  open: boolean;
  logs: Record<string, DayLog>;
  targetDate: string;
  onClose: () => void;
  onCopy: (date: string, meal: MealId) => void;
}) {
  const options = Object.values(logs)
    .filter((log) => log.date !== targetDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Modal open={open} title="Copiar refeição" onClose={onClose}>
      {options.length ? options.map((log) => (
        <div className="mb-4" key={log.date}>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">{formatDate(log.date)}</p>
          <div className="space-y-2">
            {mealEntries.filter(({ id }) => log.meals[id].length).map(({ id, label }) => (
              <button className="selection-row" type="button" key={id} onClick={() => onCopy(log.date, id)}>
                <span>{label}</span>
                <small>{log.meals[id].length} itens</small>
              </button>
            ))}
          </div>
        </div>
      )) : <Empty>Não existem refeições anteriores para copiar.</Empty>}
    </Modal>
  );
}

function CustomFoodModal({
  open,
  food,
  onClose,
  onSave
}: {
  open: boolean;
  food?: Food;
  onClose: () => void;
  onSave: (food: Food) => void;
}) {
  const initial = food ?? { id: crypto.randomUUID(), nome: "", baseGrams: 100, calories: 0, protein: 0, carbs: 0, fats: 0, custom: true };
  const [form, setForm] = useState<Food>(initial);
  const [nutrition, setNutrition] = useState({
    calories: initial.calories ? String(initial.calories) : "",
    protein: initial.protein ? String(initial.protein) : "",
    carbs: initial.carbs ? String(initial.carbs) : "",
    fats: initial.fats ? String(initial.fats) : ""
  });
  const key = food?.id ?? "new";

  useEffect(() => {
    setForm(initial);
    setNutrition({
      calories: initial.calories ? String(initial.calories) : "",
      protein: initial.protein ? String(initial.protein) : "",
      carbs: initial.carbs ? String(initial.carbs) : "",
      fats: initial.fats ? String(initial.fats) : ""
    });
  }, [food?.id, open]);

  return (
    <Modal open={open} title={food ? "Editar alimento" : "Novo alimento"} onClose={onClose}>
      <form key={key} className="space-y-3" onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (Object.values(nutrition).some((value) => value === "")) {
          window.alert("Preencha os valores nutricionais. Use 0 quando o nutriente não existir.");
          return;
        }
        onSave({
          ...form,
          id: food?.id ?? form.id,
          calories: Number(nutrition.calories || 0),
          protein: Number(nutrition.protein || 0),
          carbs: Number(nutrition.carbs || 0),
          fats: Number(nutrition.fats || 0),
          custom: true
        });
      }}>
        <label className="field-label">Nome
          <input required defaultValue={initial.nome} onChange={(event) => setForm((value) => ({ ...value, nome: event.target.value }))} />
        </label>
        <p className="text-xs text-slate-400">Valores nutricionais por 100 g</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["calories", "Calorias"],
            ["protein", "Proteína (g)"],
            ["carbs", "Carboidratos (g)"],
            ["fats", "Gorduras (g)"]
          ] as [keyof Food, string][]).map(([field, label]) => (
            <label className="field-label" key={field}>{label}
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={nutrition[field as keyof typeof nutrition]}
                placeholder="Ex: 10"
                onChange={(event) => setNutrition((value) => ({ ...value, [field]: event.target.value.replace(/^0+(?=\d)/, "") }))}
              />
            </label>
          ))}
        </div>
        <button className="btn-primary w-full py-3" type="submit">Guardar alimento</button>
      </form>
    </Modal>
  );
}

function EditItemModal({
  entry,
  onClose,
  onSave
}: {
  entry: { meal: MealId; item: MealItem } | null;
  onClose: () => void;
  onSave: (item: MealItem) => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [measure, setMeasure] = useState<"g" | "unit">("g");
  useEffect(() => {
    if (entry) {
      setQuantity(String(entry.item.quantity));
      setMeasure(entry.item.measure);
    }
  }, [entry]);
  if (!entry) return null;
  return (
    <Modal open title="Editar registo" onClose={onClose}>
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (!quantity || Number(quantity) <= 0) {
          window.alert("Quantidade pendente.");
          return;
        }
        onSave({ ...entry.item, quantity: Number(quantity), measure });
      }}>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm font-medium">{entry.item.food.nome}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">Quantidade
            <input type="number" min="0.1" step="0.1" value={quantity} placeholder="Ex: 100" onChange={(event) => setQuantity(event.target.value.replace(/^0+(?=\d)/, ""))} required />
          </label>
          <label className="field-label">Medida
            <select value={measure} onChange={(event) => setMeasure(event.target.value as "g" | "unit")}>
              <option value="g">gramas</option>
              {entry.item.food.unitName && <option value="unit">{entry.item.food.unitName}</option>}
            </select>
          </label>
        </div>
        <button className="btn-primary w-full py-3" type="submit">Guardar alteração</button>
      </form>
    </Modal>
  );
}
