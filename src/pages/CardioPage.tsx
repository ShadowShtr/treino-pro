import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ChevronDown,
  Info,
  Pencil,
  Plus,
  Timer,
  Trash2,
  Bike,
  Zap,
  Activity,
  Footprints
} from "lucide-react";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { macrosForLog } from "../lib/calculations";
import {
  CARDIO_LABELS,
  classifyTreadmillMode,
  estimateCardioCalories,
  generateCardioExplanation
} from "../lib/cardioFormulas";
import { formatDate, todayISO } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { CardioEntry, CardioIntensity, CardioType, FitnessData } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

const cardioTypes = Object.entries(CARDIO_LABELS) as [CardioType, string][];
const intensities: { value: CardioIntensity; label: string }[] = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "forte", label: "Forte" }
];

function cardioIcon(type: CardioType) {
  switch (type) {
    case "bike":
    case "air_bike":
      return <Bike size={20} />;
    case "esteira":
    case "simulador_caminhada":
      return <Footprints size={20} />;
    case "eliptico":
    case "escada":
      return <Zap size={20} />;
    case "remo":
      return <Activity size={20} />;
    default:
      return <Timer size={20} />;
  }
}

function intensityColor(intensity: CardioIntensity): string {
  if (intensity === "leve") return "bg-sky-100 text-sky-700";
  if (intensity === "moderada") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function CardioPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const [modal, setModal] = useState<CardioEntry | null>(null);
  const [details, setDetails] = useState<CardioEntry | null>(null);
  const today = todayISO();
  const todayEntries = data.cardioEntries.filter((entry) => entry.date === today);
  const consumed = Math.round(macrosForLog(data.logs[today]).calories);
  const cardioCalories = todayEntries.reduce((total, entry) => total + entry.calories, 0);
  const cardioMinutes = todayEntries.reduce((total, entry) => total + entry.durationMin, 0);
  const recent = [...data.cardioEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const week = summaryForDays(data.cardioEntries, 7);

  const currentWeight = data.profile?.pesoAtual ?? 70;

  function openPreset(
    type: CardioType,
    durationMin: number,
    intensity: CardioIntensity = "moderada"
  ) {
    setModal({
      id: "",
      date: today,
      type,
      durationMin,
      intensity,
      calories: 0,
      weightKg: currentWeight,
      explanation: ""
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Cardio"
        title="Cardio"
        action={
          <button
            className="rounded-xl bg-white/18 p-3 text-white"
            aria-label="Registar cardio"
            onClick={() => setModal(emptyCardio(currentWeight))}
          >
            <Plus size={20} />
          </button>
        }
      />

      {/* Main CTA + quick presets */}
      <button
        className="btn-primary mb-3 w-full py-3"
        onClick={() => setModal(emptyCardio(currentWeight))}
      >
        <Plus size={18} />
        Registar cardio
      </button>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <PresetChip
          icon={<Footprints size={16} />}
          label="Esteira 30 min"
          sub="moderada"
          onClick={() => openPreset("esteira", 30, "moderada")}
        />
        <PresetChip
          icon={<Bike size={16} />}
          label="Bike 30 min"
          sub="moderada"
          onClick={() => openPreset("bike", 30, "moderada")}
        />
        <PresetChip
          icon={<Zap size={16} />}
          label="Elíptico 20 min"
          sub="moderada"
          onClick={() => openPreset("eliptico", 20, "moderada")}
        />
        <PresetChip
          icon={<Timer size={16} />}
          label="Personalizado"
          sub="configurar"
          onClick={() => setModal(emptyCardio(currentWeight))}
        />
      </div>

      {/* Today's summary */}
      <Card className="mb-4">
        <SectionTitle>Resumo de hoje</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Sessões hoje" value={String(todayEntries.length)} />
          <Metric label="Tempo" value={`${cardioMinutes} min`} />
          <Metric label="Calorias queimadas" value={`${cardioCalories} kcal`} accent />
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
          Saldo:{" "}
          <strong className="text-ink">{consumed} kcal</strong>
          {" — "}
          <strong className="text-danger">{cardioCalories} kcal</strong>
          {" = "}
          <strong className="text-ink">{consumed - cardioCalories} kcal</strong>
          {" "}(apenas comparativo)
        </p>
      </Card>

      {/* Weekly summary */}
      <Card className="mb-4">
        <SectionTitle>Resumo semanal (7 dias)</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Sessões" value={String(week.sessions)} />
          <Metric label="Minutos" value={String(week.minutes)} />
          <Metric label="Kcal" value={String(week.calories)} />
        </div>
        {week.favorite && (
          <p className="mt-3 text-sm text-muted">
            Favorito: <strong className="text-ink">{week.favorite}</strong>
          </p>
        )}
      </Card>

      {/* Recent history */}
      <Card>
        <SectionTitle>Histórico recente</SectionTitle>
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-outline bg-white p-3 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 rounded-xl bg-primary-light p-2 text-primary">
                      {cardioIcon(entry.type)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-semibold text-ink">
                          {CARDIO_LABELS[entry.type]}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${intensityColor(entry.intensity)}`}>
                          {entry.intensity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(entry.date)} · {entry.durationMin} min · {entry.calories} kcal
                      </p>
                      {entry.type === "esteira" && (entry.speedKmH || entry.inclinePercent) && (
                        <p className="mt-0.5 text-xs text-muted">
                          {entry.speedKmH ? `${entry.speedKmH} km/h` : ""}
                          {entry.speedKmH && entry.inclinePercent ? " · " : ""}
                          {entry.inclinePercent ? `${entry.inclinePercent}% incl.` : ""}
                          {entry.treadmillMode ? ` · ${entry.treadmillMode}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1.5 text-slate-400">
                    <button
                      className="rounded-lg bg-slate-50 p-2 hover:text-primary"
                      onClick={() => setDetails(entry)}
                      aria-label="Ver cálculo"
                    >
                      <Info size={15} />
                    </button>
                    <button
                      className="rounded-lg bg-slate-50 p-2 hover:text-primary"
                      onClick={() => setModal(entry)}
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="rounded-lg bg-slate-50 p-2 hover:text-danger"
                      onClick={() => actions.deleteCardio(entry.id)}
                      aria-label="Apagar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty>Nenhum cardio registado ainda.</Empty>
        )}
      </Card>

      <p className="mt-4 rounded-2xl bg-primary-light p-3 text-xs leading-5 text-muted">
        A estimativa de calorias depende principalmente do peso, duração e intensidade. Para a
        esteira, usamos a fórmula VO2 quando velocidade e inclinação são fornecidos.
      </p>

      <CardioModal
        entry={modal}
        currentWeight={currentWeight}
        onClose={() => setModal(null)}
        onSave={(entry, id) => {
          actions.saveCardio(entry, id);
          setModal(null);
        }}
      />

      <Modal
        open={Boolean(details)}
        title="Cálculo usado"
        onClose={() => setDetails(null)}
      >
        {details && (
          <p className="text-sm leading-6 text-muted">{details.explanation}</p>
        )}
        <p className="mt-3 text-sm leading-6 text-muted">
          Quando não há velocidade/inclinação suficientes, o app usa estimativa por MET.
        </p>
      </Modal>
    </>
  );
}

/* ─── Preset chip ─────────────────────────────────────────────────────────── */

function PresetChip({
  icon,
  label,
  sub,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-2xl border border-outline bg-white px-3 py-3 text-left shadow-card hover:border-primary hover:bg-primary-light"
    >
      <span className="flex-shrink-0 rounded-xl bg-primary-light p-2 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-muted capitalize">{sub}</p>
      </div>
    </button>
  );
}

/* ─── Metric tile ─────────────────────────────────────────────────────────── */

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? "bg-primary-light" : "bg-slate-50"}`}>
      <p className="text-[10px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────────── */

function CardioModal({
  entry,
  currentWeight,
  onClose,
  onSave
}: {
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
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [showMore, setShowMore] = useState(false);

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
    setNotes(entry?.notes ?? "");
    setShowMore(false);
  }, [entry]);

  const estimatedCalories = useMemo(() => {
    const durationMin = Number(duration);
    if (!durationMin || !currentWeight) return null;
    const speedKmH = speed ? Number(speed) : undefined;
    const treadmillMode =
      type === "esteira"
        ? speedKmH
          ? classifyTreadmillMode(speedKmH)
          : undefined
        : undefined;
    return estimateCardioCalories({
      type,
      intensity,
      durationMin,
      weightKg: currentWeight,
      speedKmH,
      inclinePercent: incline ? Number(incline) : undefined,
      treadmillMode
    });
  }, [type, intensity, duration, speed, incline, currentWeight]);

  if (!entry) return null;
  const entryId = entry.id || undefined;

  function submit(event: FormEvent) {
    event.preventDefault();
    const durationMin = Number(duration);
    if (!durationMin || !currentWeight) {
      window.alert("Informe duração e peso actual no perfil.");
      return;
    }
    const speedKmH = speed ? Number(speed) : undefined;
    const treadmillMode =
      type === "esteira" && speedKmH ? classifyTreadmillMode(speedKmH) : undefined;
    const draft = {
      date,
      type,
      durationMin,
      intensity,
      weightKg: currentWeight,
      speedKmH,
      inclinePercent: incline ? Number(incline) : undefined,
      distanceKm: distance ? Number(distance) : undefined,
      resistance: resistance || undefined,
      pace: pace || undefined,
      floorsOrSteps: floorsOrSteps || undefined,
      treadmillMode,
      notes: notes || undefined,
      calories: 0,
      explanation: ""
    };
    const calories = estimateCardioCalories(draft);
    onSave({ ...draft, calories, explanation: generateCardioExplanation(draft) }, entryId);
  }

  return (
    <Modal
      open
      title={entry.id ? "Editar cardio" : "Registar cardio"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={submit}>
        {/* Type chips — horizontal scroll */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Tipo de cardio</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {cardioTypes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex-shrink-0 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${
                  type === value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-outline bg-white text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration + Date */}
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">
            Duração (min)
            <input
              type="number"
              required
              min="1"
              value={duration}
              placeholder="Ex: 30"
              onChange={(e) => setDuration(cleanNumber(e.target.value))}
            />
          </label>
          <label className="field-label">
            Data
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {/* Intensity toggles */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Intensidade</p>
          <div className="flex gap-2">
            {intensities.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`toggle-button ${intensity === opt.value ? "selected" : ""}`}
                onClick={() => setIntensity(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Esteira-specific fields */}
        {type === "esteira" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">
              Velocidade (km/h)
              <input
                type="number"
                min="0"
                step="0.1"
                value={speed}
                placeholder="Ex: 6"
                onChange={(e) => setSpeed(cleanNumber(e.target.value))}
              />
            </label>
            <label className="field-label">
              Inclinação (%)
              <input
                type="number"
                min="0"
                step="0.1"
                value={incline}
                placeholder="Ex: 0"
                onChange={(e) => setIncline(cleanNumber(e.target.value))}
              />
            </label>
          </div>
        )}

        {/* Live calorie preview */}
        {estimatedCalories !== null && (
          <div className="flex items-center justify-between rounded-2xl bg-primary-light px-4 py-3">
            <span className="text-sm text-muted">Estimativa</span>
            <span className="font-bold text-primary">~{estimatedCalories} kcal</span>
          </div>
        )}

        {/* Mais opções toggle */}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-outline px-4 py-3 text-sm text-muted"
          onClick={() => setShowMore((v) => !v)}
        >
          <span>Mais opções</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </button>

        {showMore && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="field-label">
                Distância (km)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={distance}
                  placeholder="Opcional"
                  onChange={(e) => setDistance(cleanNumber(e.target.value))}
                />
              </label>
              <label className="field-label">
                Resistência/carga
                <input
                  value={resistance}
                  placeholder="Opcional"
                  onChange={(e) => setResistance(e.target.value)}
                />
              </label>
            </div>
            {(type === "remo" || type === "eliptico") && (
              <label className="field-label">
                Ritmo
                <input
                  value={pace}
                  placeholder="Opcional"
                  onChange={(e) => setPace(e.target.value)}
                />
              </label>
            )}
            {type === "escada" && (
              <label className="field-label">
                Andares ou passos
                <input
                  value={floorsOrSteps}
                  placeholder="Opcional"
                  onChange={(e) => setFloorsOrSteps(e.target.value)}
                />
              </label>
            )}
            <label className="field-label">
              Observação
              <input
                value={notes}
                placeholder="Opcional"
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>
        )}

        <button className="btn-primary w-full py-3" type="submit">
          Salvar cardio
        </button>
      </form>
    </Modal>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

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

export function summaryForDays(entries: CardioEntry[], days: number) {
  const start = new Date(`${todayISO()}T12:00:00`);
  start.setDate(start.getDate() - days + 1);
  const filtered = entries.filter(
    (entry) => new Date(`${entry.date}T12:00:00`) >= start
  );
  const counts = filtered.reduce<Record<string, number>>((acc, entry) => {
    const label = CARDIO_LABELS[entry.type];
    acc[label] = (acc[label] ?? 0) + 1;
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
