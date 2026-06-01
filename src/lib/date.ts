import type { Weekday } from "../types";

export const weekdays: { id: Weekday; label: string; short: string }[] = [
  { id: "segunda", label: "Segunda", short: "Seg" },
  { id: "terca", label: "Terça", short: "Ter" },
  { id: "quarta", label: "Quarta", short: "Qua" },
  { id: "quinta", label: "Quinta", short: "Qui" },
  { id: "sexta", label: "Sexta", short: "Sex" },
  { id: "sabado", label: "Sábado", short: "Sáb" },
  { id: "domingo", label: "Domingo", short: "Dom" }
];

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function dateISO(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function offsetDate(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return dateISO(value);
}

export function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });
}

export function monthKey(value: string = todayISO()): string {
  return value.slice(0, 7);
}

export function weekdayForDate(date: string): Weekday {
  const index = new Date(`${date}T12:00:00`).getDay();
  return weekdays[(index + 6) % 7].id;
}

export function daysInMonth(month: string): string[] {
  const [year, rawMonth] = month.split("-").map(Number);
  const total = new Date(year, rawMonth, 0).getDate();
  return Array.from({ length: total }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });
}

export function daysSince(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const from = new Date(`${value}T12:00:00`).getTime();
  const to = new Date(`${todayISO()}T12:00:00`).getTime();
  return Math.floor((to - from) / 86400000);
}
