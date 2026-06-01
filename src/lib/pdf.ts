import { monthlySummary } from "./calculations";
import { calculateTargets } from "./fitnessFormulas";
import { formatDate } from "./date";
import type { FitnessData, MeasurementEntry } from "../types";

const measurementRows: { key: keyof MeasurementEntry; label: string }[] = [
  { key: "cintura", label: "Cintura" },
  { key: "abdomen", label: "Abdómen" },
  { key: "peito", label: "Peito" },
  { key: "braco", label: "Braço" },
  { key: "coxa", label: "Coxa" },
  { key: "gluteo", label: "Glúteo" },
  { key: "gordura", label: "Gordura %" }
];

export async function exportMonthlyPdf(data: FitnessData, month: string): Promise<void> {
  if (!data.profile) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const targets = calculateTargets(data.profile);
  const report = monthlySummary(data, month, targets);
  const measures = data.measurements
    .filter((entry) => entry.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
  let y = 20;

  doc.setFillColor(252, 76, 2);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Travizani Fitness", 16, y);
  y = 45;
  doc.setTextColor(31, 41, 51);
  doc.setFontSize(13);
  doc.text(`Relatório mensal - ${month}`, 16, y);
  y += 13;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summary = [
    `Utilizador: ${data.profile.nome}`,
    `Calorias médias/dia: ${report.avgCalories} kcal (meta ${targets.calories} kcal)`,
    `Proteína média/dia: ${report.avgProtein} g (meta ${targets.protein} g)`,
    `Água média/dia: ${report.avgWater} ml (base ${targets.waterMl} ml)`,
    `Dias com alimentação registada: ${report.daysTracked}`,
    `Treinos concluídos: ${report.completedWorkouts}`,
    `Dias com creatina tomada: ${report.creatineDays}`,
    `Dias dentro das metas: ${report.successfulDays}`
  ];
  doc.setFillColor(255, 241, 235);
  doc.roundedRect(12, y - 7, 186, summary.length * 7 + 10, 4, 4, "F");
  summary.forEach((line) => {
    doc.text(line, 16, y);
    y += 7;
  });
  y += 8;

  if (report.weightDifference !== null) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Evolução do peso: ${report.initialWeight} kg > ${report.finalWeight} kg (${report.weightDifference > 0 ? "+" : ""}${report.weightDifference} kg)`,
      16,
      y
    );
    y += 10;
  }

  if (measures.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Medidas registadas", 16, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const first = measures[0];
    const last = measures[measures.length - 1];
    measurementRows.forEach(({ key, label }) => {
      const start = Number(first[key]);
      const end = Number(last[key]);
      const difference = Number((end - start).toFixed(1));
      doc.text(
        `${label}: ${end} ${key === "gordura" ? "%" : "cm"} (${difference > 0 ? "+" : ""}${difference})`,
        16,
        y
      );
      y += 7;
    });
    doc.text(`Último registo: ${formatDate(last.date)}`, 16, y + 2);
  }

  doc.save(`travizani-relatorio-${month}.pdf`);
}
