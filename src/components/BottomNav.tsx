import { Apple, ChartNoAxesColumn, Dumbbell, HeartPulse, House, UserRound } from "lucide-react";
import type { TabId } from "../types";

const entries: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home",     label: "Início",      icon: House },
  { id: "food",     label: "Alimentação", icon: Apple },
  { id: "training", label: "Treinos",     icon: Dumbbell },
  { id: "cardio",   label: "Cardio",      icon: HeartPulse },
  { id: "progress", label: "Evolução",    icon: ChartNoAxesColumn },
  { id: "profile",  label: "Perfil",      icon: UserRound },
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
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                isActive
                  ? "gap-[3px] rounded-[14px] bg-primary px-3 py-[7px]"
                  : "gap-0 px-2.5 py-2.5"
              }`}
            >
              <Icon
                size={isActive ? 19 : 20}
                strokeWidth={isActive ? 2.3 : 1.6}
                className={isActive ? "text-white" : "text-slate-400"}
              />
              {isActive && (
                <span className="whitespace-nowrap text-[9.5px] font-bold leading-none text-white">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
