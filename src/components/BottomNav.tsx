import React from "react";
import { Apple, ChartNoAxesColumn, Dumbbell, HeartPulse, House, UserRound } from "lucide-react";
import type { TabId } from "../types";

const entries: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home",     label: "Início",   icon: House },
  { id: "food",     label: "Alim.",    icon: Apple },
  { id: "training", label: "Treinos",  icon: Dumbbell },
  { id: "cardio",   label: "Cardio",   icon: HeartPulse },
  { id: "progress", label: "Evolução", icon: ChartNoAxesColumn },
  { id: "profile",  label: "Perfil",   icon: UserRound },
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="app-bottom-nav fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-30 mx-auto max-w-lg py-1.5">
      <div className="flex items-center justify-around px-1">
        {entries.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              aria-label={label}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5 transition-all ${
                isActive ? "bg-primary-light text-primary" : "text-slate-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.6} />
              <span className={`text-[9.5px] font-semibold leading-none ${isActive ? "text-primary" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
