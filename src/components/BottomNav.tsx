import { Apple, ChartNoAxesColumn, Dumbbell, HeartPulse, House, UserRound } from "lucide-react";
import type { TabId } from "../types";

const entries = [
  { id: "home" as TabId, label: "Início", icon: House },
  { id: "food" as TabId, label: "Alimentação", icon: Apple },
  { id: "training" as TabId, label: "Treinos", icon: Dumbbell },
  { id: "cardio" as TabId, label: "Cardio", icon: HeartPulse },
  { id: "progress" as TabId, label: "Evolução", icon: ChartNoAxesColumn },
  { id: "profile" as TabId, label: "Perfil", icon: UserRound }
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around">
        {entries.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={`flex min-w-[52px] flex-col items-center gap-1 rounded-2xl px-1.5 py-1.5 text-[10px] font-medium transition ${
              active === id ? "bg-primary-light text-primary" : "text-slate-400"
            }`}
          >
            <Icon size={21} strokeWidth={active === id ? 2.4 : 1.8} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
