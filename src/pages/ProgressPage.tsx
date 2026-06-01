import { useMemo, useState } from "react";
import {
  Download,
  Dumbbell,
  HeartPulse,
  Pill,
  Scale,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, Empty, PageHeader, SectionTitle } from "../components/Ui";
import { macrosForLog, monthlySummary } from "../lib/calculations";
import { calculateTargets } from "../lib/fitnessFormulas";
import { daysInMonth, formatDate, monthKey, todayISO } from "../lib/date";
import { exportMonthlyPdf } from "../lib/pdf";
import type { FitnessData, MeasurementEntry } from "../types";

const measurementOptions: { key: keyof MeasurementEntry; label: string }[] = [
  { key: "cintura", label: "Cintura" },
  { key: "abdomen", label: "Abdómen" },
  { key: "peito", label: "Peito" },
  { key: "braco", label: "Braço" },
  { key: "coxa", label: "Coxa" },
  { key: "gluteo", label: "Glúteo" },
  { key: "gordura", label: "Gordura %" }
];

export function ProgressPage({ data }: { data: FitnessData }) {
  const [month, setMonth] = useState(monthKey());
  const [measurement, setMeasurement] = useState<keyof MeasurementEntry>("cintura");
  const targets = calculateTargets(data.profile!);
  const report = monthlySummary(data, month, targets);

  const mealSeries = useMemo(
    () =>
      Object.values(data.logs)
        .filter((log) => log.date.startsWith(month))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((log) => {
          const values = macrosForLog(log);
          return {
            label: log.date.slice(8),
            calorias: Math.round(values.calories),
            proteina: Math.round(values.protein),
            agua: log.waterMl
          };
        }),
    [data.logs, month]
  );

  const weightSeries = useMemo(
    () =>
      [...data.weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ label: formatDate(entry.date), peso: entry.weight })),
    [data.weights]
  );

  const measureSeries = useMemo(
    () =>
      [...data.measurements]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ label: formatDate(entry.date), valor: Number(entry[measurement]) })),
    [data.measurements, measurement]
  );

  const workoutSeries = useMemo(() => {
    const weeks = [0, 1, 2, 3, 4].map((w) => ({ label: `S${w + 1}`, treinos: 0 }));
    data.completedWorkouts
      .filter((entry) => entry.date.startsWith(month))
      .forEach((entry) => {
        const w = Math.min(4, Math.floor((Number(entry.date.slice(8)) - 1) / 7));
        weeks[w].treinos += 1;
      });
    return weeks;
  }, [data.completedWorkouts, month]);

  const currentWeight = report.finalWeight;
  const weightDiff = report.weightDifference;

  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        title="Evolução"
        action={
          <input
            className="date-pill"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />

      {/* Monthly summary tiles — 3x2 */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SummaryTile label="Calorias médias" value={`${report.avgCalories}`} unit="kcal" />
        <SummaryTile label="Proteína média" value={`${report.avgProtein}`} unit="g" />
        <SummaryTile label="Água média" value={`${report.avgWater}`} unit="ml" />
        <SummaryTile label="Treinos" value={`${report.completedWorkouts}`} unit="treinos" />
        <SummaryTile label="Creatina" value={`${report.creatineDays}`} unit="dias" />
        <SummaryTile label="Dias na meta" value={`${report.successfulDays}`} unit="dias" />
      </div>

      {/* Weight trend */}
      <Card className="mb-4">
        <SectionTitle
          aside={
            currentWeight !== undefined ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-ink">{currentWeight} kg</span>
                {weightDiff !== null && (
                  <span
                    className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      weightDiff > 0
                        ? "bg-red-100 text-red-600"
                        : weightDiff < 0
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {weightDiff > 0 ? (
                      <TrendingUp size={11} />
                    ) : weightDiff < 0 ? (
                      <TrendingDown size={11} />
                    ) : null}
                    {weightDiff > 0 ? "+" : ""}
                    {weightDiff} kg
                  </span>
                )}
              </div>
            ) : undefined
          }
        >
          Peso
        </SectionTitle>
        {weightSeries.length ? (
          <SimpleLine data={weightSeries} keyName="peso" color="#FC4C02" suffix=" kg" />
        ) : (
          <Empty>Registe o peso semanalmente no perfil.</Empty>
        )}
      </Card>

      {/* Calories + Protein chart */}
      <Card className="mb-4">
        <SectionTitle>Calorias e Proteínas</SectionTitle>
        {mealSeries.length ? (
          <>
            <ResponsiveContainer width="100%" height={185}>
              <LineChart data={mealSeries}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip />
                {targets?.calories && (
                  <ReferenceLine
                    y={targets.calories}
                    stroke="#FC4C02"
                    strokeDasharray="4 3"
                    strokeOpacity={0.5}
                  />
                )}
                {targets?.protein && (
                  <ReferenceLine
                    y={targets.protein}
                    stroke="#16A34A"
                    strokeDasharray="4 3"
                    strokeOpacity={0.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calorias"
                  stroke="#FC4C02"
                  strokeWidth={2.5}
                  dot={false}
                  name="Calorias"
                />
                <Line
                  type="monotone"
                  dataKey="proteina"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  dot={false}
                  name="Proteína"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-slate-400">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
                Calorias
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-success" />
                Proteínas
              </span>
              <span className="ml-auto text-[10px]">- - meta</span>
            </div>
          </>
        ) : (
          <Empty>Sem refeições neste mês.</Empty>
        )}
      </Card>

      {/* Water bar chart */}
      <Card className="mb-4">
        <SectionTitle>Água ingerida</SectionTitle>
        {mealSeries.length ? (
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={mealSeries}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip formatter={(value) => [`${value} ml`, "Água"]} />
              {targets?.waterMl && (
                <ReferenceLine
                  y={targets.waterMl}
                  stroke="#0ea5e9"
                  strokeDasharray="4 3"
                  strokeOpacity={0.5}
                />
              )}
              <Bar dataKey="agua" fill="#0ea5e9" radius={[7, 7, 0, 0]} name="Água" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty>Sem registos de água neste mês.</Empty>
        )}
      </Card>

      {/* Measurements chart */}
      <Card className="mb-4">
        <SectionTitle>Medidas corporais</SectionTitle>
        {/* Horizontal chip tabs */}
        <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          {measurementOptions.map((opt) => (
            <button
              key={String(opt.key)}
              type="button"
              onClick={() => setMeasurement(opt.key)}
              className={`flex-shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                measurement === opt.key
                  ? "border-success bg-success/10 text-success"
                  : "border-outline bg-white text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {measureSeries.length ? (
          <SimpleLine
            data={measureSeries}
            keyName="valor"
            color="#16A34A"
            suffix={measurement === "gordura" ? "%" : " cm"}
          />
        ) : (
          <Empty>Sem medidas registadas.</Empty>
        )}
      </Card>

      {/* Workout frequency */}
      <Card className="mb-4">
        <SectionTitle>Treinos concluídos</SectionTitle>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={workoutSeries}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} hide />
            <Tooltip />
            <Bar dataKey="treinos" fill="#FC4C02" radius={[8, 8, 0, 0]} name="Treinos" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly calendar */}
      <Calendar data={data} month={month} />

      {/* Monthly report */}
      <Card>
        <SectionTitle>Relatório mensal</SectionTitle>
        <div className="mb-4 space-y-2 text-sm text-slate-600">
          <p>
            Alimentação registada:{" "}
            <strong className="text-slate-900">{report.daysTracked} dias</strong>
          </p>
          <p>
            Água média:{" "}
            <strong className="text-slate-900">{report.avgWater} ml/dia</strong>
          </p>
          <p>
            Creatina tomada:{" "}
            <strong className="text-slate-900">{report.creatineDays} dias</strong>
          </p>
          <p>
            Variação de peso:{" "}
            <strong className="text-slate-900">
              {report.weightDifference === null
                ? "Sem comparação"
                : `${report.weightDifference > 0 ? "+" : ""}${report.weightDifference} kg`}
            </strong>
          </p>
          <p>
            Treinos concluídos:{" "}
            <strong className="text-slate-900">{report.completedWorkouts}</strong>
          </p>
          <p>
            Dias na meta:{" "}
            <strong className="text-slate-900">{report.successfulDays} dias</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn-primary flex w-full justify-center gap-2 py-3"
          onClick={() => exportMonthlyPdf(data, month)}
        >
          <Download size={17} /> Exportar PDF
        </button>
      </Card>
    </>
  );
}

/* ─── Summary tile ────────────────────────────────────────────────────────── */

function SummaryTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card>
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{unit}</p>
    </Card>
  );
}

/* ─── Simple line chart ───────────────────────────────────────────────────── */

function SimpleLine({
  data,
  keyName,
  color,
  suffix
}: {
  data: Record<string, string | number>[];
  keyName: string;
  color: string;
  suffix: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={165}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip formatter={(value) => [`${value}${suffix}`, ""]} />
        <Line
          type="monotone"
          dataKey={keyName}
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Monthly calendar ────────────────────────────────────────────────────── */

function Calendar({ data, month }: { data: FitnessData; month: string }) {
  const dates = daysInMonth(month);
  const blankCells = new Date(`${month}-01T12:00:00`).getDay();
  const today = todayISO();
  const targets = calculateTargets(data.profile!);

  // Count activity days for the month summary
  const activeDays = dates.filter((date) => {
    const log = data.logs[date];
    return (
      (log && Object.values(log.meals).flat().length > 0) ||
      data.completedWorkouts.some((e) => e.date === date) ||
      data.cardioEntries.some((e) => e.date === date)
    );
  }).length;

  const workoutDays = dates.filter((d) => data.completedWorkouts.some((e) => e.date === d)).length;
  const creatineDays = dates.filter((d) => data.logs[d]?.creatine === true).length;

  return (
    <Card className="mb-4">
      <SectionTitle>Calendário mensal</SectionTitle>

      {/* Mini summary strip */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 rounded-2xl bg-primary/10 px-3 py-2 text-center">
          <p className="text-lg font-bold text-primary">{activeDays}</p>
          <p className="text-[10px] text-muted">dias ativos</p>
        </div>
        <div className="flex-1 rounded-2xl bg-success/10 px-3 py-2 text-center">
          <p className="text-lg font-bold text-success">{workoutDays}</p>
          <p className="text-[10px] text-muted">treinos</p>
        </div>
        <div className="flex-1 rounded-2xl bg-primary-dark/10 px-3 py-2 text-center">
          <p className="text-lg font-bold text-primary-dark">{creatineDays}</p>
          <p className="text-[10px] text-muted">creatina</p>
        </div>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-muted">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: blankCells }, (_, i) => <div key={`b${i}`} />)}
        {dates.map((date) => {
          const log = data.logs[date];
          const hasMeals = Boolean(log && Object.values(log.meals).flat().length > 0);
          const trained = data.completedWorkouts.some((e) => e.date === date);
          const creatine = log?.creatine === true;
          const cardio = data.cardioEntries.some((e) => e.date === date);
          const hasWeight = data.weights.some((e) => e.date === date);
          const isToday = date === today;
          const isFuture = date > today;

          // Calorie fill percentage for mini bar
          let calPct = 0;
          if (hasMeals && targets.calories > 0) {
            const { calories } = macrosForLog(log!);
            calPct = Math.min(1, calories / targets.calories);
          }

          const dayNum = Number(date.slice(8));
          const hasAny = hasMeals || trained || cardio;

          return (
            <div
              key={date}
              className={`relative flex flex-col items-center rounded-xl py-1.5 transition-all ${
                isToday
                  ? "bg-primary/12 ring-1 ring-inset ring-primary"
                  : hasAny
                  ? "bg-slate-50"
                  : ""
              } ${isFuture ? "opacity-25" : ""}`}
            >
              <span className={`text-[11px] font-semibold leading-tight ${isToday ? "text-primary" : "text-ink"}`}>
                {dayNum}
              </span>

              {/* Calorie mini-bar */}
              {hasMeals && (
                <div className="mt-0.5 h-[3px] w-5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${calPct >= 0.9 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${calPct * 100}%` }}
                  />
                </div>
              )}

              {/* Activity dots */}
              <div className="mt-0.5 flex gap-[2px]">
                {hasMeals && <span className="h-[5px] w-[5px] rounded-full bg-primary" />}
                {trained && <span className="h-[5px] w-[5px] rounded-full bg-success" />}
                {cardio && <span className="h-[5px] w-[5px] rounded-full bg-danger" />}
                {creatine && <span className="h-[5px] w-[5px] rounded-full bg-primary-dark" />}
                {hasWeight && <span className="h-[5px] w-[5px] rounded-full bg-warning" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-outline pt-3">
        {[
          { color: "bg-primary", Icon: UtensilsCrossed, label: "Alimentação" },
          { color: "bg-success",  Icon: Dumbbell,       label: "Treino" },
          { color: "bg-danger",   Icon: HeartPulse,     label: "Cardio" },
          { color: "bg-primary-dark", Icon: Pill,       label: "Creatina" },
          { color: "bg-warning",  Icon: Scale,          label: "Peso/medida" },
        ].map(({ color, Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`} />
            <Icon size={12} className="flex-shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </Card>
  );
}
