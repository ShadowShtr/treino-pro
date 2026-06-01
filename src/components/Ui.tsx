import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header mb-5 flex items-start justify-between gap-3 px-5 py-5">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">{eyebrow}</p>}
        <h1 className="text-[1.7rem] font-semibold tracking-tight text-white">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <section id={id} className={`rounded-3xl border border-outline bg-white p-4 shadow-card ${className}`}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
      {aside}
    </div>
  );
}

export function ProgressBar({ value, target, tone = "primary" }: { value: number; target: number; tone?: "primary" | "green" }) {
  const percent = Math.min(100, target ? (value / target) * 100 : 0);
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${tone === "green" ? "bg-success" : "bg-primary"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">{children}</p>;
}

export function Modal({
  title,
  open,
  onClose,
  children,
  stickyTop,
  onContentScroll
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  stickyTop?: ReactNode;
  onContentScroll?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-3 sm:items-center sm:justify-center">
      <div className="flex max-h-[88svh] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-outline px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600" onClick={onClose}>
            Fechar
          </button>
        </div>
        {stickyTop && (
          <div className="flex-shrink-0 border-b border-outline px-5 py-3">{stickyTop}</div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4" onScroll={onContentScroll}>{children}</div>
      </div>
    </div>
  );
}
