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

import React from "react";

export function BottomNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-outline/50 bg-white/96 pb-[calc(env(safe-area-inset-bottom)+4px)] pt-1.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1">
        {entries.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              aria-label={label}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-slate-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.6} />
              <span className={`text-[9.5px] font-semibold leading-none ${isActive ? "text-primary" : "text-slate-400"}`}>
                {label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-[3px] w-3 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
