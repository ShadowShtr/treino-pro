import { useEffect, useState, type FormEvent } from "react";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { macrosForLog } from "../lib/calculations";
import { CARDIO_LABELS, classifyTreadmillMode, estimateCardioCalories, generateCardioExplanation } from "../lib/cardioFormulas";
import { formatDate, todayISO } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { CardioEntry, CardioIntensity, CardioType, FitnessData, TreadmillMode } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

const cardioTypes = Object.entries(CARDIO_LABELS) as [CardioType, string][];
const intensities: CardioIntensity[] = ["leve", "moderada", "forte"];

export function CardioPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const [modal, setModal] = useState<CardioEntry | null>(null);
  const [details, setDetails] = useState<CardioEntry | null>(null);
  const today = todayISO();
  const todayEntries = data.cardioEntries.filter((entry) => entry.date === today);
  const consumed = Math.round(macrosForLog(data.logs[today]).calories);
  const cardio = todayEntries.reduce((total, entry) => total + entry.calories, 0);
  const recent = [...data.cardioEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const week = summaryForDays(data.cardioEntries, 7);
  const month = summaryForDays(data.cardioEntries, 30);

  return (
    <>
      <PageHeader eyebrow="Cardio" title="Cardio" action={<button className="rounded-xl bg-white/18 p-3 text-white" onClick={() => setModal(emptyCardio(data.profile!.pesoAtual))}><Plus size={20} /></button>} />
      <button className="btn-primary mb-4 w-full py-3" onClick={() => setModal(emptyCardio(data.profile!.pesoAtual))}><Plus size={18} /> Registrar cardio</button>

      <Card className="mb-4">
        <SectionTitle>Resumo de hoje</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Consumo alimentar" value={`${consumed} kcal`} />
          <Metric label="Cardio" value={`-${cardio} kcal`} />
          <Metric label="Saldo parcial" value={`${consumed - cardio} kcal`} accent />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">O saldo é apenas comparativo. Não substitui avaliação profissional nem obriga a comer mais.</p>
      </Card>

      <Card className="mb-4">
        <SectionTitle>Resumo semanal</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Sessões" value={String(week.sessions)} />
          <Metric label="Minutos" value={String(week.minutes)} />
          <Metric label="Kcal" value={String(week.calories)} />
        </div>
        <p className="mt-3 text-sm text-muted">Mais frequente: {week.favorite || "-"}</p>
      </Card>

      <Card className="mb-4">
        <SectionTitle>Resumo mensal</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Sessões" value={String(month.sessions)} />
          <Metric label="Minutos" value={String(month.minutes)} />
          <Metric label="Kcal" value={String(month.calories)} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Histórico recente</SectionTitle>
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((entry) => (
              <article key={entry.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{CARDIO_LABELS[entry.type]} · {entry.durationMin} min</p>
                    <p className="text-xs text-muted">{formatDate(entry.date)} · {entry.intensity} · {entry.calories} kcal</p>
                    {(entry.speedKmH || entry.inclinePercent) && <p className="mt-1 text-xs text-muted">{entry.speedKmH ? `${entry.speedKmH} km/h` : ""} {entry.inclinePercent ? `· ${entry.inclinePercent}%` : ""}</p>}
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <button onClick={() => setDetails(entry)} aria-label="Ver cálculo"><Info size={16} /></button>
                    <button onClick={() => setModal(entry)} aria-label="Editar"><Pencil size={16} /></button>
                    <button onClick={() => actions.deleteCardio(entry.id)} aria-label="Apagar"><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : <Empty>Nenhum cardio registrado ainda.</Empty>}
      </Card>

      <p className="mt-4 rounded-2xl bg-primary-light p-3 text-xs leading-5 text-muted">
        As medidas corporais ajudam no acompanhamento, mas a estimativa de calorias do cardio depende principalmente do peso, duração e intensidade.
      </p>

      <CardioModal
        entry={modal}
        currentWeight={data.profile!.pesoAtual}
        onClose={() => setModal(null)}
        onSave={(entry, id) => {
          actions.saveCardio(entry, id);
          setModal(null);
        }}
      />
      <Modal open={Boolean(details)} title="Cálculo usado" onClose={() => setDetails(null)}>
        {details && <p className="text-sm leading-6 text-muted">{details.explanation}</p>}
        <p className="mt-3 text-sm leading-6 text-muted">Quando não há velocidade/inclinação suficientes, o app usa estimativa por MET.</p>
      </Modal>
    </>
  );
}

function emptyCardio(weightKg: number): CardioEntry {
  return {
    id: "",
    date: todayISO(),
    type: "esteira",
    durationMin: 0,
    intensity: "moderada",
    calories: 0,
    weightKg,
    explanation: ""
  };
}

function CardioModal({ entry, currentWeight, onClose, onSave }: {
  entry: CardioEntry | null;
  currentWeight: number;
  onClose: () => void;
  onSave: (entry: Omit<CardioEntry, "id">, id?: string) => void;
}) {
  const [type, setType] = useState<CardioType>(entry?.type ?? "esteira");
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [duration, setDuration] = useState(entry?.durationMin ? String(entry.durationMin) : "");
  const [intensity, setIntensity] = useState<CardioIntensity>(entry?.intensity ?? "moderada");
  const [speed, setSpeed] = useState(entry?.speedKmH ? String(entry.speedKmH) : "");
  const [incline, setIncline] = useState(entry?.inclinePercent ? String(entry.inclinePercent) : "");
  const [distance, setDistance] = useState(entry?.distanceKm ? String(entry.distanceKm) : "");
  const [resistance, setResistance] = useState(entry?.resistance ?? "");
  const [pace, setPace] = useState(entry?.pace ?? "");
  const [floorsOrSteps, setFloorsOrSteps] = useState(entry?.floorsOrSteps ?? "");
  const [mode, setMode] = useState<TreadmillMode | "auto">(entry?.treadmillMode ?? "auto");
  const [notes, setNotes] = useState(entry?.notes ?? "");

  useEffect(() => {
    setType(entry?.type ?? "esteira");
    setDate(entry?.date ?? todayISO());
    setDuration(entry?.durationMin ? String(entry.durationMin) : "");
    setIntensity(entry?.intensity ?? "moderada");
    setSpeed(entry?.speedKmH ? String(entry.speedKmH) : "");
    setIncline(entry?.inclinePercent ? String(entry.inclinePercent) : "");
    setDistance(entry?.distanceKm ? String(entry.distanceKm) : "");
    setResistance(entry?.resistance ?? "");
    setPace(entry?.pace ?? "");
    setFloorsOrSteps(entry?.floorsOrSteps ?? "");
    setMode(entry?.treadmillMode ?? "auto");
    setNotes(entry?.notes ?? "");
  }, [entry]);

  if (!entry) return null;
  const entryId = entry.id || undefined;

  function submit(event: FormEvent) {
    event.preventDefault();
    const durationMin = Number(duration);
    if (!durationMin || !currentWeight) {
      window.alert("Informe duração e peso atual no perfil.");
      return;
    }
    const speedKmH = speed ? Number(speed) : undefined;
    const treadmillMode = type === "esteira" ? (mode === "auto" && speedKmH ? classifyTreadmillMode(speedKmH) : mode === "auto" ? undefined : mode) : undefined;
    const draft = {
      date,
      type,
      durationMin,
      intensity,
      weightKg: currentWeight,
      speedKmH,
      inclinePercent: incline ? Number(incline) : undefined,
      distanceKm: distance ? Number(distance) : undefined,
      resistance,
      pace,
      floorsOrSteps,
      treadmillMode,
      notes,
      calories: 0,
      explanation: ""
    };
    const calories = estimateCardioCalories(draft);
    onSave({ ...draft, calories, explanation: generateCardioExplanation(draft) }, entryId);
  }

  return (
    <Modal open title={entry.id ? "Editar cardio" : "Registrar cardio"} onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <label className="field-label">Tipo
          <select value={type} onChange={(event) => setType(event.target.value as CardioType)}>
            {cardioTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">Duração (min)<input type="number" required min="1" value={duration} placeholder="Ex: 30" onChange={(event) => setDuration(cleanNumber(event.target.value))} /></label>
          <label className="field-label">Data<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {intensities.map((option) => <button type="button" key={option} className={`toggle-button ${intensity === option ? "selected" : ""}`} onClick={() => setIntensity(option)}>{option}</button>)}
        </div>
        {type === "esteira" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="field-label">Velocidade km/h<input type="number" min="0" step="0.1" value={speed} placeholder="Ex: 6" onChange={(event) => setSpeed(cleanNumber(event.target.value))} /></label>
              <label className="field-label">Inclinação %<input type="number" min="0" step="0.1" value={incline} placeholder="Ex: 0" onChange={(event) => setIncline(cleanNumber(event.target.value))} /></label>
            </div>
            <label className="field-label">Modo
              <select value={mode} onChange={(event) => setMode(event.target.value as TreadmillMode | "auto")}>
                <option value="auto">Automático</option>
                <option value="caminhada">Caminhada</option>
                <option value="corrida">Corrida</option>
              </select>
            </label>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">Distância (opcional)<input type="number" min="0" step="0.01" value={distance} placeholder="Opcional" onChange={(event) => setDistance(cleanNumber(event.target.value))} /></label>
          <label className="field-label">Resistência/carga<input value={resistance} placeholder="Opcional" onChange={(event) => setResistance(event.target.value)} /></label>
        </div>
        {(type === "remo" || type === "eliptico") && <label className="field-label">Ritmo<input value={pace} placeholder="Opcional" onChange={(event) => setPace(event.target.value)} /></label>}
        {type === "escada" && <label className="field-label">Andares ou passos<input value={floorsOrSteps} placeholder="Opcional" onChange={(event) => setFloorsOrSteps(event.target.value)} /></label>}
        <label className="field-label">Observação<input value={notes} placeholder="Opcional" onChange={(event) => setNotes(event.target.value)} /></label>
        <button className="btn-primary w-full py-3" type="submit">Salvar cardio</button>
      </form>
    </Modal>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-2xl p-3 ${accent ? "bg-primary-light" : "bg-slate-50"}`}><p className="text-[11px] text-muted">{label}</p><p className="mt-1 text-sm font-bold text-ink">{value}</p></div>;
}

function summaryForDays(entries: CardioEntry[], days: number) {
  const start = new Date(`${todayISO()}T12:00:00`);
  start.setDate(start.getDate() - days + 1);
  const filtered = entries.filter((entry) => new Date(`${entry.date}T12:00:00`) >= start);
  const counts = filtered.reduce<Record<string, number>>((acc, entry) => {
    acc[CARDIO_LABELS[entry.type]] = (acc[CARDIO_LABELS[entry.type]] ?? 0) + 1;
    return acc;
  }, {});
  return {
    sessions: filtered.length,
    minutes: filtered.reduce((total, entry) => total + entry.durationMin, 0),
    calories: filtered.reduce((total, entry) => total + entry.calories, 0),
    favorite: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  };
}

function cleanNumber(value: string): string {
  return value.replace(/^0+(?=\d)/, "");
}
