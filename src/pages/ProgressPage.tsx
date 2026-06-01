import { useMemo, useState } from "react";
import { Download, Dumbbell, HeartPulse, Pill, Scale, UtensilsCrossed } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, Empty, PageHeader, SectionTitle } from "../components/Ui";
import { macrosForLog, monthlySummary } from "../lib/calculations";
import { calculateTargets } from "../lib/fitnessFormulas";
import { daysInMonth, formatDate, monthKey } from "../lib/date";
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
  const mealSeries = Object.values(data.logs)
    .filter((log) => log.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => {
      const values = macrosForLog(log);
      return { label: log.date.slice(8), calorias: Math.round(values.calories), proteina: Math.round(values.protein), agua: log.waterMl };
    });
  const weightSeries = [...data.weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({ label: formatDate(entry.date), peso: entry.weight }));
  const measureSeries = [...data.measurements]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({ label: formatDate(entry.date), valor: Number(entry[measurement]) }));
  const workoutSeries = useMemo(() => {
    const weeks = [0, 1, 2, 3, 4].map((week) => ({ label: `S${week + 1}`, treinos: 0 }));
    data.completedWorkouts.filter((entry) => entry.date.startsWith(month)).forEach((entry) => {
      const week = Math.min(4, Math.floor((Number(entry.date.slice(8)) - 1) / 7));
      weeks[week].treinos += 1;
    });
    return weeks;
  }, [data.completedWorkouts, month]);

  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        title="Evolução"
        action={<input className="date-pill" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}
      />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Summary label="Média calorias" value={`${report.avgCalories} kcal`} />
        <Summary label="Média proteína" value={`${report.avgProtein} g`} />
        <Summary label="Média água" value={`${report.avgWater} ml`} />
        <Summary label="Treinos" value={`${report.completedWorkouts}`} />
        <Summary label="Creatina tomada" value={`${report.creatineDays} dias`} />
        <Summary label="Dias na meta" value={`${report.successfulDays}`} />
      </div>

      <Card className="mb-4">
        <SectionTitle>Peso semanal</SectionTitle>
        {weightSeries.length ? <SimpleLine data={weightSeries} keyName="peso" color="#FC4C02" suffix=" kg" /> : <Empty>Sem peso registado.</Empty>}
      </Card>

      <Card className="mb-4">
        <SectionTitle>Água ingerida</SectionTitle>
        {mealSeries.length ? (
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={mealSeries}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip formatter={(value) => [`${value} ml`, "Água"]} />
              <Bar dataKey="agua" fill="#FC4C02" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty>Sem registos de água neste mês.</Empty>}
      </Card>

      <Card className="mb-4">
        <SectionTitle
          aside={
            <select className="compact-select" value={String(measurement)} onChange={(event) => setMeasurement(event.target.value as keyof MeasurementEntry)}>
              {measurementOptions.map((option) => <option key={String(option.key)} value={String(option.key)}>{option.label}</option>)}
            </select>
          }
        >
          Medidas mensais
        </SectionTitle>
        {measureSeries.length ? <SimpleLine data={measureSeries} keyName="valor" color="#16A34A" suffix={measurement === "gordura" ? "%" : " cm"} /> : <Empty>Sem medidas registadas.</Empty>}
      </Card>

      <Card className="mb-4">
        <SectionTitle>Calorias e proteínas</SectionTitle>
        {mealSeries.length ? (
          <ResponsiveContainer width="100%" height={185}>
            <LineChart data={mealSeries}>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="calorias" stroke="#FC4C02" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="proteina" stroke="#16A34A" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <Empty>Sem refeições neste mês.</Empty>}
        <div className="mt-2 flex gap-4 text-xs text-slate-400">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" /> Calorias</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-success" /> Proteínas</span>
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle>Treinos concluídos</SectionTitle>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={workoutSeries}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} hide />
            <Tooltip />
            <Bar dataKey="treinos" fill="#FC4C02" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Calendar data={data} month={month} />

      <Card>
        <SectionTitle>Relatório mensal</SectionTitle>
        <div className="mb-4 space-y-2 text-sm text-slate-600">
          <p>Alimentação registada: <strong className="text-slate-900">{report.daysTracked} dias</strong></p>
          <p>Água média: <strong className="text-slate-900">{report.avgWater} ml/dia</strong></p>
          <p>Creatina tomada: <strong className="text-slate-900">{report.creatineDays} dias</strong></p>
          <p>Variação de peso: <strong className="text-slate-900">{report.weightDifference === null ? "Sem comparação" : `${report.weightDifference > 0 ? "+" : ""}${report.weightDifference} kg`}</strong></p>
          <p>Treinos concluídos: <strong className="text-slate-900">{report.completedWorkouts}</strong></p>
        </div>
        <button type="button" className="btn-primary flex w-full justify-center gap-2 py-3" onClick={() => exportMonthlyPdf(data, month)}>
          <Download size={17} /> Exportar PDF
        </button>
      </Card>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </Card>
  );
}

function SimpleLine({ data, keyName, color, suffix }: { data: Record<string, string | number>[]; keyName: string; color: string; suffix: string }) {
  return (
    <ResponsiveContainer width="100%" height={165}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
        <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip formatter={(value) => [`${value}${suffix}`, ""]} />
        <Line type="monotone" dataKey={keyName} stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Calendar({ data, month }: { data: FitnessData; month: string }) {
  const dates = daysInMonth(month);
  const blankCells = new Date(`${month}-01T12:00:00`).getDay();
  return (
    <Card className="mb-4">
      <SectionTitle>Calendário mensal</SectionTitle>
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((label, index) => <span key={`${label}${index}`}>{label}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-3 text-center">
        {Array.from({ length: blankCells }, (_, index) => <span key={`blank-${index}`} />)}
        {dates.map((date) => {
          const hasMeals = Boolean(data.logs[date] && Object.values(data.logs[date].meals).flat().length);
          const trained = data.completedWorkouts.some((entry) => entry.date === date);
          const weighted = data.weights.some((entry) => entry.date === date);
          const measured = data.measurements.some((entry) => entry.date === date);
          const creatine = data.logs[date]?.creatine === true;
          const cardio = data.cardioEntries.some((entry) => entry.date === date);
          return (
            <div key={date} className="text-xs">
              <span className="block text-slate-700">{Number(date.slice(8))}</span>
              <span className="mt-1 flex justify-center gap-[2px]">
                {hasMeals && <i className="calendar-dot bg-primary" />}
                {trained && <i className="calendar-dot bg-success" />}
                {(weighted || measured) && <i className="calendar-dot bg-warning" />}
                {creatine && <i className="calendar-dot bg-primary-dark" />}
                {cardio && <i className="calendar-dot bg-danger" />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <Legend icon={UtensilsCrossed} color="bg-primary" label="Alimentação" />
        <Legend icon={Dumbbell} color="bg-success" label="Treino" />
        <Legend icon={Scale} color="bg-warning" label="Peso/medida" />
        <Legend icon={Pill} color="bg-primary-dark" label="Creatina" />
        <Legend icon={HeartPulse} color="bg-danger" label="Cardio" />
      </div>
    </Card>
  );
}

function Legend({ icon: Icon, color, label }: { icon: typeof Dumbbell; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <i className={`calendar-dot ${color}`} /><Icon size={13} />{label}
    </div>
  );
}
