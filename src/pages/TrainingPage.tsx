import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  FileText,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Timer,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { exerciseGroups } from "../data/exercises";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { formatDate, todayISO, weekdayForDate, weekdays } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, Weekday, WorkoutExercise, WorkoutTemplate } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

const GROUP_COLORS: Record<string, string> = {
  Peito: "bg-red-100 text-red-700",
  Costas: "bg-blue-100 text-blue-700",
  Pernas: "bg-green-100 text-green-700",
  Ombros: "bg-purple-100 text-purple-700",
  Bíceps: "bg-orange-100 text-orange-700",
  Tríceps: "bg-yellow-100 text-yellow-700",
  "Abdômen": "bg-teal-100 text-teal-700",
  "Glúteos": "bg-pink-100 text-pink-700",
  Panturrilha: "bg-indigo-100 text-indigo-700",
  Cardio: "bg-slate-100 text-slate-700",
};

function emptyExercise(name = ""): WorkoutExercise {
  return { id: crypto.randomUUID(), name, sets: 3, repetitions: "10-12", load: "", notes: "" };
}

function getExerciseGroup(name: string): string {
  for (const { group, exercises } of exerciseGroups) {
    if (exercises.includes(name)) return group;
  }
  return "";
}

function formatTimer(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export function TrainingPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const today = weekdayForDate(todayISO());
  const [selectedDay, setSelectedDay] = useState<Weekday>(today);
  const [completionDate, setCompletionDate] = useState(todayISO());
  const [inlineSearch, setInlineSearch] = useState("");
  const [editor, setEditor] = useState<WorkoutExercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [performedSets, setPerformedSets] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem("treino-session");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed.date === todayISO()) return parsed.sets as Record<string, number>;
      localStorage.removeItem("treino-session");
    } catch { /* ignore */ }
    return {};
  });
  const [copySource, setCopySource] = useState<Weekday>("segunda");
  const [showCopy, setShowCopy] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateEditor, setTemplateEditor] = useState<WorkoutTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<WorkoutTemplate | null>(null);
  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restTotal, setRestTotal] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const plan = data.workouts.find((w) => w.day === selectedDay)!;
  const completionPlan = data.workouts.find((w) => w.day === weekdayForDate(completionDate))!;
  const isCompleted = data.completedWorkouts.some((c) => c.date === completionDate);
  const history = [...data.completedWorkouts].sort((a, b) => b.date.localeCompare(a.date));

  const totalPlanned = plan.exercises.reduce((s, ex) => s + ex.sets, 0);
  const totalDone = plan.exercises.reduce((s, ex) => s + Math.min(performedSets[ex.id] ?? 0, ex.sets), 0);

  const planGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const ex of plan.exercises) {
      const g = getExerciseGroup(ex.name);
      if (g && !seen.has(g)) { seen.add(g); groups.push(g); }
    }
    return groups;
  }, [plan.exercises]);

  useEffect(() => {
    if (Object.keys(performedSets).length === 0) {
      localStorage.removeItem("treino-session");
    } else {
      localStorage.setItem("treino-session", JSON.stringify({ date: todayISO(), sets: performedSets }));
    }
  }, [performedSets]);

  useEffect(() => {
    if (copySource === selectedDay) {
      setCopySource(weekdays.find(({ id }) => id !== selectedDay)!.id);
    }
  }, [copySource, selectedDay]);

  useEffect(() => {
    if (!restOpen || !restRunning || restSeconds <= 0) return;
    const id = window.setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) { setRestRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [restOpen, restRunning, restSeconds]);

  function saveExercises(exercises: WorkoutExercise[]) {
    actions.saveWorkout(selectedDay, { ...plan, exercises });
  }

  function saveExercise(exercise: WorkoutExercise) {
    const exists = plan.exercises.some((e) => e.id === exercise.id);
    saveExercises(
      exists
        ? plan.exercises.map((e) => (e.id === exercise.id ? exercise : e))
        : [...plan.exercises, exercise]
    );
    setEditor(null);
    setInlineSearch("");
  }

  function moveExercise(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= plan.exercises.length) return;
    const list = [...plan.exercises];
    [list[index], list[target]] = [list[target], list[index]];
    saveExercises(list);
  }

  function openRest(seconds = 60) {
    setRestTotal(seconds);
    setRestSeconds(seconds);
    setRestRunning(true);
    setRestOpen(true);
  }

  function newTemplate(): WorkoutTemplate {
    const d = todayISO();
    return { id: crypto.randomUUID(), name: "Novo modelo", exercises: [], createdAt: d, updatedAt: d };
  }

  return (
    <>
      <PageHeader
        eyebrow="Plano semanal"
        title="Treinos"
        action={
          <button
            type="button"
            aria-label="Modelos de treino"
            className="rounded-xl bg-white/18 p-3 text-white"
            onClick={() => setTemplatesOpen(true)}
          >
            <FileText size={20} />
          </button>
        }
      />

      {/* ── Day selector ── */}
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {weekdays.map(({ id, short }) => {
          const dayPlan = data.workouts.find((w) => w.day === id)!;
          const dayDone = data.completedWorkouts.some((c) => c.day === id && c.date === todayISO());
          const hasEx = dayPlan.exercises.length > 0;
          const sel = selectedDay === id;
          const isToday = id === today;
          return (
            <button
              type="button"
              key={id}
              className={`relative flex min-w-[56px] flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-sm font-medium transition-all ${
                sel ? "border-primary bg-primary text-white shadow-primary" : "border-outline bg-white text-muted"
              }`}
              onClick={() => setSelectedDay(id)}
            >
              {isToday && !sel && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />
              )}
              <span className="font-bold">{short}</span>
              <span className={`text-[11px] font-semibold ${sel ? "text-white/75" : hasEx ? "text-primary" : "text-slate-300"}`}>
                {dayDone ? "✓" : hasEx ? dayPlan.exercises.length : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Workout card ── */}
      <Card className="mb-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <input
              className="w-full border-0 bg-transparent p-0 text-xl font-bold text-ink outline-none placeholder:text-slate-300"
              value={plan.name}
              onChange={(e) => actions.saveWorkout(selectedDay, { ...plan, name: e.target.value })}
              placeholder="Nome do treino…"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {planGroups.length > 0
                ? planGroups.map((g) => (
                    <span key={g} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${GROUP_COLORS[g] ?? "bg-slate-100 text-slate-600"}`}>
                      {g}
                    </span>
                  ))
                : <span className="text-sm text-muted">Adicione exercícios abaixo</span>}
            </div>
          </div>
          <button
            type="button"
            className="icon-action mt-1 h-10 w-10 shrink-0"
            aria-label="Adicionar exercício"
            onClick={() => setPickerOpen(true)}
          >
            <Plus size={19} />
          </button>
        </div>

        {/* Stats */}
        {plan.exercises.length > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
            <Stat label="Exercícios" value={plan.exercises.length} />
            <div className="h-7 w-px bg-outline" />
            <Stat label="Séries" value={totalPlanned} />
            {totalDone > 0 && (
              <>
                <div className="h-7 w-px bg-outline" />
                <div className="text-center">
                  <p className="text-base font-bold text-primary">{totalDone}/{totalPlanned}</p>
                  <p className="text-[10px] text-muted">Feitas</p>
                </div>
              </>
            )}
          </div>
        )}

        <SectionTitle>Exercícios</SectionTitle>

        {plan.exercises.length > 0 ? (
          <div className="space-y-2.5">
            {plan.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                completedSets={performedSets[ex.id] ?? 0}
                isFirst={i === 0}
                isLast={i === plan.exercises.length - 1}
                onSetToggle={(count) => setPerformedSets((cur) => ({ ...cur, [ex.id]: count }))}
                onEdit={() => setEditor(ex)}
                onRemove={() => saveExercises(plan.exercises.filter((e) => e.id !== ex.id))}
                onUp={() => moveExercise(i, -1)}
                onDown={() => moveExercise(i, 1)}
                onRest={openRest}
              />
            ))}
          </div>
        ) : (
          <Empty>Sem exercícios. Toque em + ou pesquise abaixo.</Empty>
        )}

        {/* Inline search */}
        <div className="mt-4">
          <label className="search-input">
            <Search size={17} />
            <input
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              placeholder="Pesquisar exercício para adicionar…"
            />
          </label>
          {inlineSearch && (
            <InlineSearchResults
              search={inlineSearch}
              onPick={(name) => { saveExercise(emptyExercise(name)); }}
            />
          )}
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-2">
        <button
          type="button"
          disabled={plan.exercises.length === 0}
          className="btn-primary py-3.5 disabled:opacity-40"
          onClick={() => setSessionActive(true)}
        >
          <Dumbbell size={18} /> Iniciar treino
        </button>
        <button
          type="button"
          className="btn-secondary justify-center px-4"
          aria-label="Temporizador de descanso"
          onClick={() => openRest(60)}
        >
          <Timer size={18} />
        </button>
        <button
          type="button"
          className="btn-secondary justify-center px-4"
          aria-label="Copiar treino"
          onClick={() => setShowCopy((v) => !v)}
        >
          <Copy size={18} />
        </button>
      </div>

      {/* Copy section (collapsible) */}
      {showCopy && (
        <Card className="mb-4">
          <p className="mb-3 text-sm font-semibold text-ink">Copiar treino de outro dia</p>
          <div className="flex items-end gap-2">
            <label className="field-label flex-1">
              Dia de origem
              <select value={copySource} onChange={(e) => setCopySource(e.target.value as Weekday)}>
                {weekdays.filter(({ id }) => id !== selectedDay).map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-primary px-4"
              onClick={() => { actions.copyWorkout(selectedDay, copySource); setShowCopy(false); }}
            >
              Copiar
            </button>
          </div>
        </Card>
      )}

      {/* ── Mark completion ── */}
      <Card className="mb-4">
        <SectionTitle>Marcar conclusão</SectionTitle>
        <label className="field-label mb-3">
          Data
          <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
        </label>
        <p className="mb-3 text-sm text-muted">
          {completionPlan.name} · {completionPlan.exercises.length} exercício(s)
        </p>
        {isCompleted ? (
          <button
            type="button"
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3"
            onClick={() => actions.undoWorkout(completionDate)}
          >
            <Undo2 size={17} /> Desmarcar conclusão
          </button>
        ) : (
          <button
            type="button"
            disabled={completionPlan.exercises.length === 0}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-40"
            onClick={() => {
              actions.completeWorkout(completionDate);
              setPerformedSets({});
            }}
          >
            <CheckCircle2 size={18} /> Marcar como concluído
          </button>
        )}
      </Card>

      {/* ── History ── */}
      <Card>
        <SectionTitle>Histórico</SectionTitle>
        {history.length ? (
          <div className="space-y-2">
            {history.slice(0, 12).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-outline bg-slate-50/60 px-3.5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{entry.name}</p>
                    <p className="text-xs text-muted">{formatDate(entry.date)}</p>
                  </div>
                  <button
                    className="shrink-0 text-slate-300 transition-colors hover:text-danger"
                    onClick={() => actions.undoWorkout(entry.date)}
                    aria-label="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.exercises.slice(0, 5).map((ex) => (
                    <span key={ex.id} className="rounded-lg border border-outline bg-white px-2 py-0.5 text-[11px] text-muted">
                      {ex.name}
                    </span>
                  ))}
                  {entry.exercises.length > 5 && (
                    <span className="rounded-lg border border-outline bg-white px-2 py-0.5 text-[11px] text-muted">
                      +{entry.exercises.length - 5}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Nenhum treino concluído ainda.</Empty>
        )}
      </Card>

      {/* ── Modals ── */}
      <ExerciseModal exercise={editor} onClose={() => setEditor(null)} onSave={saveExercise} />

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name) => { saveExercise(emptyExercise(name)); setPickerOpen(false); }}
        onCustom={() => { setPickerOpen(false); setEditor(emptyExercise()); }}
      />

      <RestModal
        open={restOpen}
        seconds={restSeconds}
        total={restTotal}
        running={restRunning}
        onClose={() => { setRestOpen(false); setRestRunning(false); }}
        onSelect={(s) => { setRestTotal(s); setRestSeconds(s); setRestRunning(true); }}
        onToggle={() => setRestRunning((v) => !v)}
        onReset={() => { setRestSeconds(restTotal); setRestRunning(false); }}
      />

      <TemplatesModal
        open={templatesOpen}
        templates={data.workoutTemplates}
        currentPlan={plan}
        onClose={() => setTemplatesOpen(false)}
        onCreate={() => setTemplateEditor(newTemplate())}
        onEdit={setTemplateEditor}
        onDelete={actions.deleteWorkoutTemplate}
        onDuplicate={actions.duplicateWorkoutTemplate}
        onCopyCurrent={() => actions.copyWorkoutToTemplate(selectedDay)}
        onApply={setApplyTemplate}
      />

      <TemplateEditorModal
        template={templateEditor}
        onClose={() => setTemplateEditor(null)}
        onSave={(t) => { if (actions.saveWorkoutTemplate(t)) setTemplateEditor(null); }}
      />

      <ApplyTemplateModal
        template={applyTemplate}
        workouts={data.workouts}
        onClose={() => setApplyTemplate(null)}
        onApply={(day, mode) => {
          if (applyTemplate && actions.applyWorkoutTemplate(applyTemplate.id, day, mode)) setApplyTemplate(null);
        }}
      />

      {/* ── Workout session overlay ── */}
      {sessionActive && plan.exercises.length > 0 && (
        <WorkoutSession
          exercises={plan.exercises}
          workoutName={plan.name}
          performedSets={performedSets}
          onSetChange={(id, count) => setPerformedSets((cur) => ({ ...cur, [id]: count }))}
          onClose={() => setSessionActive(false)}
          onComplete={() => { actions.completeWorkout(completionDate); setSessionActive(false); setPerformedSets({}); }}
          onOpenRest={openRest}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────
// Stat block
// ─────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Inline search results (inside main card)
// ─────────────────────────────────────────────────────
function InlineSearchResults({ search, onPick }: { search: string; onPick: (name: string) => void }) {
  const results = useMemo(() => {
    const q = search.toLowerCase();
    return exerciseGroups
      .flatMap((g) => g.exercises.filter((e) => e.toLowerCase().includes(q)).map((e) => ({ name: e, group: g.group })))
      .slice(0, 10);
  }, [search]);

  return (
    <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-outline bg-white p-2 shadow-card">
      {results.length ? (
        <div className="space-y-1">
          {results.map(({ name, group }) => (
            <button key={name} type="button" className="selection-row" onClick={() => onPick(name)}>
              <span>{name}</span>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${GROUP_COLORS[group] ?? "bg-slate-100 text-slate-600"}`}>
                  {group}
                </span>
                <Plus size={14} className="text-primary" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-muted">Nenhum resultado</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Exercise card (expandable with inline set tracking)
// ─────────────────────────────────────────────────────
function ExerciseCard({
  exercise,
  completedSets,
  isFirst,
  isLast,
  onSetToggle,
  onEdit,
  onRemove,
  onUp,
  onDown,
  onRest,
}: {
  exercise: WorkoutExercise;
  completedSets: number;
  isFirst: boolean;
  isLast: boolean;
  onSetToggle: (count: number) => void;
  onEdit: () => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  onRest: (seconds?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const group = getExerciseGroup(exercise.name);
  const allDone = completedSets >= exercise.sets && exercise.sets > 0;

  return (
    <article className={`overflow-hidden rounded-2xl border transition-all ${allDone ? "border-success/40 bg-green-50/40" : "border-outline bg-white"}`}>
      {/* Header row */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Set indicator circle */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${allDone ? "bg-success text-white" : completedSets > 0 ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}>
          {allDone ? <CheckCircle2 size={16} /> : completedSets > 0 ? `${completedSets}/${exercise.sets}` : exercise.sets}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-tight ${allDone ? "text-success" : "text-ink"}`}>{exercise.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {exercise.sets} séries · {exercise.repetitions} reps{exercise.load ? ` · ${exercise.load}` : ""}
          </p>
        </div>

        {group && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${GROUP_COLORS[group] ?? "bg-slate-100 text-slate-600"}`}>
            {group}
          </span>
        )}

        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-outline bg-slate-50/40 px-3.5 pb-3.5 pt-3">
          {/* Set dots */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Séries</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: exercise.sets }, (_, i) => {
              const n = i + 1;
              const done = n <= completedSets;
              return (
                <button
                  key={i}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-95 ${done ? "bg-primary text-white shadow-sm" : "border-2 border-outline bg-white text-slate-400"}`}
                  onClick={() => onSetToggle(done && n === completedSets ? completedSets - 1 : n)}
                >
                  {done ? "✓" : n}
                </button>
              );
            })}
          </div>

          {exercise.notes && (
            <p className="mb-3 rounded-xl bg-primary-light px-3 py-2 text-xs text-primary">{exercise.notes}</p>
          )}

          {/* Action row */}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary flex-1 justify-center py-2 text-xs" onClick={() => onRest(60)}>
              <Timer size={13} /> Descanso
            </button>
            <button type="button" className="btn-secondary px-3 py-2" onClick={onEdit} aria-label="Editar">
              <Pencil size={13} />
            </button>
            <button type="button" className="btn-secondary px-3 py-2 disabled:opacity-30" disabled={isFirst} onClick={onUp} aria-label="Mover para cima">
              ↑
            </button>
            <button type="button" className="btn-secondary px-3 py-2 disabled:opacity-30" disabled={isLast} onClick={onDown} aria-label="Mover para baixo">
              ↓
            </button>
            <button type="button" className="rounded-xl bg-red-50 px-3 py-2 text-danger" onClick={onRemove} aria-label="Remover">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────
// Workout session overlay (full screen)
// ─────────────────────────────────────────────────────
function WorkoutSession({
  exercises,
  workoutName,
  performedSets,
  onSetChange,
  onClose,
  onComplete,
  onOpenRest,
}: {
  exercises: WorkoutExercise[];
  workoutName: string;
  performedSets: Record<string, number>;
  onSetChange: (id: string, count: number) => void;
  onClose: () => void;
  onComplete: () => void;
  onOpenRest: (seconds?: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const exercise = exercises[index];
  const completedSets = performedSets[exercise.id] ?? 0;
  const group = getExerciseGroup(exercise.name);
  const allDone = exercises.every((ex) => (performedSets[ex.id] ?? 0) >= ex.sets);

  function toggleSet(n: number) {
    const done = n <= completedSets;
    const newCount = done && n === completedSets ? completedSets - 1 : n;
    onSetChange(exercise.id, newCount);
    if (!done && newCount >= exercise.sets) {
      onOpenRest(60);
    }
  }

  const totalPlanned = exercises.reduce((s, ex) => s + ex.sets, 0);
  const totalDone = exercises.reduce((s, ex) => s + Math.min(performedSets[ex.id] ?? 0, ex.sets), 0);
  const overallPct = totalPlanned > 0 ? (totalDone / totalPlanned) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-app">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 bg-primary px-5 py-4 text-white">
        <button type="button" onClick={onClose} className="rounded-full bg-white/20 p-2">
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white/80">{workoutName}</p>
          <p className="text-base font-bold">{index + 1} de {exercises.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{Math.round(overallPct)}%</p>
          <p className="text-[11px] text-white/70">concluído</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 shrink-0 bg-primary/20">
        <div className="h-full bg-white/60 transition-all duration-500" style={{ width: `${overallPct}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Exercise header */}
        <div className="mb-5">
          {group && (
            <span className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${GROUP_COLORS[group] ?? "bg-slate-100 text-slate-600"}`}>
              {group}
            </span>
          )}
          <h2 className="text-2xl font-bold leading-tight text-ink">{exercise.name}</h2>
          <p className="mt-1 text-muted">
            {exercise.sets} séries · {exercise.repetitions} reps
            {exercise.load ? ` · ${exercise.load}` : ""}
          </p>
        </div>

        {/* Set grid */}
        <div className="mb-5 rounded-3xl border border-outline bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {completedSets}/{exercise.sets} séries — toque para marcar
          </p>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: exercise.sets }, (_, i) => {
              const n = i + 1;
              const done = n <= completedSets;
              return (
                <button
                  key={i}
                  type="button"
                  className={`flex aspect-square items-center justify-center rounded-2xl text-lg font-bold transition-all active:scale-90 ${done ? "bg-primary text-white shadow-primary" : "border-2 border-outline bg-white text-slate-400"}`}
                  onClick={() => toggleSet(n)}
                >
                  {done ? "✓" : n}
                </button>
              );
            })}
          </div>
        </div>

        {exercise.notes && (
          <div className="mb-4 rounded-2xl bg-primary-light p-3">
            <p className="text-sm text-primary">{exercise.notes}</p>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary mb-5 w-full justify-center py-3"
          onClick={() => onOpenRest(60)}
        >
          <Timer size={17} /> Temporizador de descanso
        </button>

        {/* Exercise list overview */}
        <div className="rounded-2xl border border-outline bg-white p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Todos os exercícios</p>
          {exercises.map((ex, i) => {
            const exDone = (performedSets[ex.id] ?? 0) >= ex.sets;
            const isCurrent = i === index;
            return (
              <button
                key={ex.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm transition-all ${isCurrent ? "bg-primary-light font-semibold text-primary" : "text-ink"}`}
                onClick={() => setIndex(i)}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${exDone ? "bg-success text-white" : isCurrent ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}>
                  {exDone ? "✓" : i + 1}
                </span>
                <span className="flex-1 truncate">{ex.name}</span>
                {!exDone && (
                  <span className="text-[11px] text-muted">{performedSets[ex.id] ?? 0}/{ex.sets}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-outline bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={index === 0}
            className="btn-secondary justify-center py-3 disabled:opacity-30"
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft size={17} /> Anterior
          </button>
          {index < exercises.length - 1 ? (
            <button
              type="button"
              className="btn-primary py-3"
              onClick={() => setIndex((i) => i + 1)}
            >
              Próximo <ChevronRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className={`py-3 ${allDone ? "btn-primary" : "btn-secondary justify-center"}`}
              onClick={allDone ? onComplete : onClose}
            >
              {allDone ? <><CheckCircle2 size={17} /> Concluir</> : "Fechar"}
            </button>
          )}
        </div>
        {allDone && index < exercises.length - 1 && (
          <button type="button" className="btn-primary mt-3 w-full py-3" onClick={onComplete}>
            <CheckCircle2 size={17} /> Concluir treino
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Rest modal with circular progress
// ─────────────────────────────────────────────────────
function RestModal({
  open, seconds, total, running,
  onClose, onSelect, onToggle, onReset,
}: {
  open: boolean;
  seconds: number;
  total: number;
  running: boolean;
  onClose: () => void;
  onSelect: (s: number) => void;
  onToggle: () => void;
  onReset: () => void;
}) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 0;
  const offset = circ * (1 - progress);
  const urgent = seconds <= 10 && seconds > 0;

  return (
    <Modal open={open} title="Descanso" onClose={onClose}>
      <div className="flex flex-col items-center py-2">
        {/* Circular timer */}
        <div className="relative mb-5">
          <svg width="168" height="168" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={urgent ? "#dc2626" : "#fc4c02"}
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className={`text-4xl font-bold tabular-nums ${urgent ? "text-danger" : "text-ink"}`}>
              {formatTimer(seconds)}
            </span>
            {seconds === 0 && <span className="text-xs font-semibold text-success">Pronto!</span>}
          </div>
        </div>

        {/* Duration presets */}
        <div className="mb-5 grid w-full grid-cols-4 gap-2">
          {[30, 60, 90, 120].map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded-xl py-2 text-sm font-semibold transition-all ${total === d ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}
              onClick={() => onSelect(d)}
            >
              {d}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="grid w-full grid-cols-2 gap-3">
          <button type="button" className="btn-secondary justify-center py-3" onClick={onReset}>
            <RotateCcw size={16} /> Repor
          </button>
          <button type="button" className="btn-primary py-3" onClick={onToggle}>
            {running ? <Pause size={17} /> : <Play size={17} />}
            {running ? "Pausar" : "Iniciar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Exercise picker modal (tabs + search)
// ─────────────────────────────────────────────────────
function ExercisePickerModal({
  open, onClose, onPick, onCustom,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (name: string) => void;
  onCustom: () => void;
}) {
  const [activeGroup, setActiveGroup] = useState(exerciseGroups[0].group);
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    if (search) {
      const q = search.toLowerCase();
      return exerciseGroups.flatMap((g) =>
        g.exercises.filter((e) => e.toLowerCase().includes(q)).map((e) => ({ name: e, group: g.group }))
      );
    }
    return (exerciseGroups.find((g) => g.group === activeGroup)?.exercises ?? []).map((e) => ({ name: e, group: activeGroup }));
  }, [search, activeGroup]);

  return (
    <Modal open={open} title="Adicionar exercício" onClose={onClose}>
      <button type="button" className="btn-primary mb-3 w-full py-3" onClick={onCustom}>
        <Plus size={17} /> Exercício personalizado
      </button>

      <label className="search-input mb-3">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar…" />
      </label>

      {!search && (
        <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          {exerciseGroups.map(({ group }) => (
            <button
              key={group}
              type="button"
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${activeGroup === group ? "bg-primary text-white" : "bg-slate-100 text-muted"}`}
              onClick={() => setActiveGroup(group)}
            >
              {group}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1">
        {results.map(({ name, group }) => (
          <button key={name} type="button" className="selection-row" onClick={() => onPick(name)}>
            <span>{name}</span>
            <div className="flex shrink-0 items-center gap-2">
              {search && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${GROUP_COLORS[group] ?? "bg-slate-100 text-slate-600"}`}>
                  {group}
                </span>
              )}
              <Plus size={14} className="text-primary" />
            </div>
          </button>
        ))}
        {results.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">Nenhum resultado</p>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Exercise editor modal
// ─────────────────────────────────────────────────────
function ExerciseModal({
  exercise, onClose, onSave,
}: {
  exercise: WorkoutExercise | null;
  onClose: () => void;
  onSave: (exercise: WorkoutExercise) => void;
}) {
  const [form, setForm] = useState<WorkoutExercise>(emptyExercise());
  const [setsText, setSetsText] = useState("3");

  useEffect(() => {
    if (exercise) {
      setForm(exercise);
      setSetsText(exercise.sets ? String(exercise.sets) : "");
    }
  }, [exercise]);

  if (!exercise) return null;

  return (
    <Modal open title={exercise.name ? "Editar exercício" : "Novo exercício"} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e: FormEvent) => { e.preventDefault(); onSave({ ...form, sets: Number(setsText) }); }}
      >
        <label className="field-label">
          Nome do exercício
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Supino reto" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">
            Séries
            <input required type="number" min="1" value={setsText} placeholder="Ex: 4" onChange={(e) => setSetsText(e.target.value.replace(/^0+(?=\d)/, ""))} />
          </label>
          <label className="field-label">
            Repetições
            <input required value={form.repetitions} onChange={(e) => setForm({ ...form, repetitions: e.target.value })} placeholder="10 ou 8-12" />
          </label>
        </div>
        <label className="field-label">
          Carga (opcional)
          <input value={form.load} onChange={(e) => setForm({ ...form, load: e.target.value })} placeholder="Ex.: 40 kg" />
        </label>
        <label className="field-label">
          Observação (opcional)
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: controlar a descida" />
        </label>
        <button className="btn-primary w-full py-3" type="submit">Guardar exercício</button>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Templates modal
// ─────────────────────────────────────────────────────
function TemplatesModal({
  open, templates, currentPlan, onClose, onCreate, onEdit, onDelete, onDuplicate, onCopyCurrent, onApply,
}: {
  open: boolean;
  templates: WorkoutTemplate[];
  currentPlan: { exercises: WorkoutExercise[] };
  onClose: () => void;
  onCreate: () => void;
  onEdit: (t: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCopyCurrent: () => void;
  onApply: (t: WorkoutTemplate) => void;
}) {
  return (
    <Modal open={open} title="Modelos de treino" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button className="btn-primary py-3" type="button" onClick={onCreate}>
          <Plus size={17} /> Criar modelo
        </button>
        <button
          className="btn-secondary justify-center py-3 disabled:opacity-40"
          type="button"
          disabled={!currentPlan.exercises.length}
          onClick={onCopyCurrent}
        >
          <Copy size={17} /> Copiar atual
        </button>
      </div>
      {templates.length ? (
        <div className="space-y-3">
          {templates.map((t) => (
            <article key={t.id} className="rounded-2xl border border-outline bg-slate-50 p-3.5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-sm text-muted">{t.exercises.length} exercício(s)</p>
                </div>
                <button className="btn-primary px-3 py-1.5 text-xs" type="button" onClick={() => onApply(t)}>
                  Aplicar
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn-secondary justify-center px-2 text-xs" type="button" onClick={() => onEdit(t)}>
                  <Pencil size={13} /> Editar
                </button>
                <button className="btn-secondary justify-center px-2 text-xs" type="button" onClick={() => onDuplicate(t.id)}>
                  <Copy size={13} /> Duplicar
                </button>
                <button className="btn-secondary justify-center px-2 text-xs text-danger" type="button" onClick={() => onDelete(t.id)}>
                  <Trash2 size={13} /> Apagar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty>Nenhum modelo de treino ainda.</Empty>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Template editor modal
// ─────────────────────────────────────────────────────
function TemplateEditorModal({
  template, onClose, onSave,
}: {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
}) {
  const [form, setForm] = useState<WorkoutTemplate | null>(template);
  useEffect(() => setForm(template), [template]);
  if (!template || !form) return null;

  function updateEx(i: number, ex: WorkoutExercise) {
    setForm((cur) => cur && { ...cur, exercises: cur.exercises.map((e, idx) => (idx === i ? ex : e)) });
  }

  return (
    <Modal open title="Editar modelo" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <label className="field-label">
          Nome do modelo
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <SectionTitle>Exercícios</SectionTitle>
        <div className="space-y-3">
          {form.exercises.map((ex, i) => (
            <div key={ex.id} className="rounded-2xl border border-outline p-3">
              <label className="field-label">
                Nome
                <input required value={ex.name} onChange={(e) => updateEx(i, { ...ex, name: e.target.value })} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="field-label">
                  Séries
                  <input required type="number" min="1" max="20" value={ex.sets ? String(ex.sets) : ""} placeholder="3" onChange={(e) => updateEx(i, { ...ex, sets: Number(e.target.value.replace(/^0+(?=\d)/, "")) })} />
                </label>
                <label className="field-label">
                  Repetições
                  <input required value={ex.repetitions} onChange={(e) => updateEx(i, { ...ex, repetitions: e.target.value })} />
                </label>
              </div>
              <label className="field-label mt-3">
                Carga opcional
                <input value={ex.load} onChange={(e) => updateEx(i, { ...ex, load: e.target.value })} />
              </label>
              <button
                className="mt-3 text-sm font-semibold text-danger"
                type="button"
                onClick={() => setForm({ ...form, exercises: form.exercises.filter((_, idx) => idx !== i) })}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-secondary w-full justify-center py-3"
          type="button"
          onClick={() => setForm({ ...form, exercises: [...form.exercises, emptyExercise()] })}
        >
          <Plus size={17} /> Adicionar exercício
        </button>
        <button className="btn-primary w-full py-3" type="submit">Guardar modelo</button>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────
// Apply template modal
// ─────────────────────────────────────────────────────
function ApplyTemplateModal({
  template, workouts, onClose, onApply,
}: {
  template: WorkoutTemplate | null;
  workouts: { day: Weekday; exercises: WorkoutExercise[] }[];
  onClose: () => void;
  onApply: (day: Weekday, mode: "replace" | "append") => void;
}) {
  const [day, setDay] = useState<Weekday>("segunda");
  useEffect(() => setDay("segunda"), [template]);
  if (!template) return null;
  const hasWorkout = Boolean(workouts.find((w) => w.day === day)?.exercises.length);

  return (
    <Modal open title="Aplicar modelo" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{template.name}</p>
      <label className="field-label mb-4">
        Dia da semana
        <select value={day} onChange={(e) => setDay(e.target.value as Weekday)}>
          {weekdays.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      {hasWorkout ? (
        <>
          <p className="mb-3 rounded-2xl bg-primary-light p-3 text-sm text-ink">
            Este dia já tem treino. Deseja substituir ou adicionar?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-primary px-2 text-sm" type="button" onClick={() => onApply(day, "replace")}>Substituir</button>
            <button className="btn-secondary justify-center px-2 text-sm" type="button" onClick={() => onApply(day, "append")}>Adicionar</button>
            <button className="btn-secondary justify-center px-2 text-sm" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </>
      ) : (
        <button className="btn-primary w-full py-3" type="button" onClick={() => onApply(day, "replace")}>
          Aplicar modelo
        </button>
      )}
    </Modal>
  );
}
