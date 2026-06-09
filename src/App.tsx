import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { ToastProvider } from "./components/Toast";
import { demoData } from "./data/seed";
import { useFitnessData } from "./hooks/useFitnessData";
import { FoodPage } from "./pages/FoodPage";
import { HomePage } from "./pages/HomePage";
import { CardioPage } from "./pages/CardioPage";
import { Onboarding } from "./pages/Onboarding";
import { ProfilePage } from "./pages/ProfilePage";
import { TasksPage } from "./pages/TasksPage";
import { TrainingPage } from "./pages/TrainingPage";
import type { TabId } from "./types";

const ProgressPage = lazy(() =>
  import("./pages/ProgressPage").then((m) => ({ default: m.ProgressPage }))
);

const TAB_ORDER: TabId[] = ["home", "food", "training", "cardio", "progress", "tasks", "profile"];

function ProgressSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2,3,4,5].map((i) => <div key={i} className="h-20 rounded-3xl bg-slate-200" />)}
      </div>
      <div className="h-48 rounded-3xl bg-slate-200" />
      <div className="h-48 rounded-3xl bg-slate-200" />
      <div className="h-36 rounded-3xl bg-slate-200" />
    </div>
  );
}

export default function App() {
  const { data, actions, syncStatus } = useFitnessData();
  const [tab, setTab] = useState<TabId>("home");
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) < 60 || dy > 40) return;
    const idx = TAB_ORDER.indexOf(tab);
    if (dx < 0 && idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
    if (dx > 0 && idx > 0) setTab(TAB_ORDER[idx - 1]);
  }

  if (!data.profile) {
    return (
      <ToastProvider>
        <Onboarding
          onFinish={(profile, measurements) => actions.createProfile(profile, measurements)}
          onDemo={() => actions.replace(demoData())}
          data={data}
          actions={actions}
          syncStatus={syncStatus}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div
        className="min-h-dvh bg-app"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <main className="mx-auto max-w-lg px-4 pb-[calc(86px+env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
          {tab === "home"     && <HomePage     data={data} actions={actions} setTab={setTab} />}
          {tab === "food"     && <FoodPage     data={data} actions={actions} />}
          {tab === "training" && <TrainingPage data={data} actions={actions} />}
          {tab === "cardio"   && <CardioPage   data={data} actions={actions} />}
          {tab === "progress" && (
            <Suspense fallback={<ProgressSkeleton />}>
              <ProgressPage data={data} />
            </Suspense>
          )}
          {tab === "tasks"   && <TasksPage    data={data} actions={actions} />}
          {tab === "profile"  && <ProfilePage  data={data} actions={actions} syncStatus={syncStatus} />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </ToastProvider>
  );
}
