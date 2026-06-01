import { lazy, Suspense, useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { demoData } from "./data/seed";
import { useFitnessData } from "./hooks/useFitnessData";
import { FoodPage } from "./pages/FoodPage";
import { HomePage } from "./pages/HomePage";
import { CardioPage } from "./pages/CardioPage";
import { Onboarding } from "./pages/Onboarding";
import { ProfilePage } from "./pages/ProfilePage";
import { TrainingPage } from "./pages/TrainingPage";
import type { TabId } from "./types";

const ProgressPage = lazy(() =>
  import("./pages/ProgressPage").then((module) => ({ default: module.ProgressPage }))
);

export default function App() {
  const { data, actions, syncStatus } = useFitnessData();
  const [tab, setTab] = useState<TabId>("home");

  useEffect(() => {
    const applyTheme = () => {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = data.theme === "system" ? (systemDark ? "dark" : "light") : data.theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreference = data.theme;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [data.theme]);

  if (!data.profile) {
    return (
      <Onboarding
        onFinish={(profile, measurements) => actions.createProfile(profile, measurements)}
        onDemo={() => actions.replace(demoData())}
        data={data}
        actions={actions}
        syncStatus={syncStatus}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-app">
      <main className="mx-auto max-w-lg px-4 pb-[calc(86px+env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
        {tab === "home" && <HomePage data={data} actions={actions} setTab={setTab} />}
        {tab === "food" && <FoodPage data={data} actions={actions} />}
        {tab === "training" && <TrainingPage data={data} actions={actions} />}
        {tab === "cardio" && <CardioPage data={data} actions={actions} />}
        {tab === "progress" && (
          <Suspense fallback={<div className="rounded-3xl bg-white p-5 text-sm text-slate-500">A carregar evolução...</div>}>
            <ProgressPage data={data} />
          </Suspense>
        )}
        {tab === "profile" && <ProfilePage data={data} actions={actions} syncStatus={syncStatus} />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
