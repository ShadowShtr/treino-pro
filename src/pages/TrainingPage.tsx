import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  FileText,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  Undo2
} from "lucide-react";
import { baseExercises, exerciseGroups } from "../data/exercises";
import { Card, Empty, Modal, PageHeader, SectionTitle } from "../components/Ui";
import { formatDate, todayISO, weekdayForDate, weekdays } from "../lib/date";
import type { useFitnessData } from "../hooks/useFitnessData";
import type { FitnessData, Weekday, WorkoutExercise, WorkoutTemplate } from "../types";

type Actions = ReturnType<typeof useFitnessData>["actions"];

function emptyExercise(name = ""): WorkoutExercise {
  return { id: crypto.randomUUID(), name, sets: 3, repetitions: "10-12", load: "", notes: "" };
}

export function TrainingPage({ data, actions }: { data: FitnessData; actions: Actions }) {
  const [selectedDay, setSelectedDay] = useState<Weekday>(weekdayForDate(todayISO()));
  const [completionDate, setCompletionDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<WorkoutExercise | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seriesExercise, setSeriesExercise] = useState<WorkoutExercise | null>(null);
  const [performedSets, setPerformedSets] = useState<Record<string, number>>({});
  const [copySource, setCopySource] = useState<Weekday>("segunda");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateEditor, setTemplateEditor] = useState<WorkoutTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<WorkoutTemplate | null>(null);
  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const plan = data.workouts.find((entry) => entry.day === selectedDay)!;
  const completionPlan = data.workouts.find((entry) => entry.day === weekdayForDate(completionDate))!;
  const completed = data.completedWorkouts.some((entry) => entry.date === completionDate);
  const suggestions = useMemo(
    () => baseExercises.filter((name) => name.toLowerCase().includes(search.toLowerCase())).slice(0, 8),
    [search]
  );
  const history = [...data.completedWorkouts].sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    if (copySource === selectedDay) {
      setCopySource(weekdays.find(({ id }) => id !== selectedDay)!.id);
    }
  }, [copySource, selectedDay]);

  useEffect(() => {
    if (!restOpen || !restRunning || restSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          setRestRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restOpen, restRunning, restSeconds]);

  function saveExercises(exercises: WorkoutExercise[]) {
    actions.saveWorkout(selectedDay, { ...plan, exercises });
  }

  function saveExercise(exercise: WorkoutExercise) {
    const exists = plan.exercises.some((entry) => entry.id === exercise.id);
    saveExercises(
      exists
        ? plan.exercises.map((entry) => (entry.id === exercise.id ? exercise : entry))
        : [...plan.exercises, exercise]
    );
    setEditor(null);
    setSearch("");
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= plan.exercises.length) return;
    const exercises = [...plan.exercises];
    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    saveExercises(exercises);
  }

  function openRest(seconds = 60) {
    setRestSeconds(seconds);
    setRestRunning(false);
    setRestOpen(true);
  }

  function newTemplate(): WorkoutTemplate {
    const today = todayISO();
    return { id: crypto.randomUUID(), name: "Novo modelo", exercises: [], createdAt: today, updatedAt: today };
  }

  return (
    <>
      <PageHeader
        eyebrow="Plano semanal"
        title="Treinos"
        action={
          <button type="button" aria-label="Adicionar exercício" className="rounded-xl bg-white/18 p-3 text-white" onClick={() => setPickerOpen(true)}>
            <Plus size={20} />
          </button>
        }
      />

      <button type="button" className="mb-4 flex w-full items-center justify-between gap-3 rounded-3xl border border-outline bg-white p-4 text-left shadow-card" onClick={() => setTemplatesOpen(true)}>
        <span>
          <span className="block text-base font-semibold text-ink">Modelos de treino</span>
          <span className="mt-1 block text-sm text-muted">{data.workoutTemplates.length} modelo(s) guardado(s)</span>
        </span>
        <FileText className="text-primary" size={24} />
      </button>

      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {weekdays.map(({ id, short }) => (
          <button
            type="button"
            key={id}
            className={`min-w-[54px] rounded-2xl border py-3 text-sm font-medium ${
              selectedDay === id ? "border-primary bg-primary text-white shadow-primary" : "border-outline bg-white text-muted"
            }`}
            onClick={() => setSelectedDay(id)}
          >
            {short}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="field-label">Treino do dia
              <input value={plan.name} onChange={(event) => actions.saveWorkout(selectedDay, { ...plan, name: event.target.value })} placeholder="Ex.: Peito e tríceps" />
            </label>
            <p className="mt-2 text-sm text-muted">{plan.exercises.length} exercício(s)</p>
          </div>
          <button type="button" className="icon-action mt-5 h-11" aria-label="Adicionar exercício" onClick={() => setPickerOpen(true)}>
            <Plus size={19} />
          </button>
        </div>
        <div className="mb-4 flex items-end gap-2 rounded-2xl bg-slate-50 p-3">
          <label className="field-label flex-1">Copiar treino de outro dia
            <select value={copySource} onChange={(event) => setCopySource(event.target.value as Weekday)}>
              {weekdays.filter(({ id }) => id !== selectedDay).map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <button type="button" className="btn-secondary px-3" onClick={() => actions.copyWorkout(selectedDay, copySource)}>
            <Copy size={17} /> Copiar
          </button>
        </div>

        <SectionTitle>Exercícios</SectionTitle>
        {plan.exercises.length ? (
          <div className="space-y-3">
            {plan.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                completedSets={performedSets[exercise.id] ?? 0}
                onSeries={() => setSeriesExercise(exercise)}
                onEdit={() => setEditor(exercise)}
                onRemove={() => saveExercises(plan.exercises.filter((entry) => entry.id !== exercise.id))}
                onUp={() => moveExercise(index, -1)}
                onDown={() => moveExercise(index, 1)}
              />
            ))}
          </div>
        ) : (
          <Empty>Dia sem exercícios configurados.</Empty>
        )}
        <label className="search-input mt-4">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar exercício para adicionar" />
        </label>
        {search && (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-outline p-2">
            {suggestions.map((exercise) => (
              <button key={exercise} className="selection-row" type="button" onClick={() => setEditor(emptyExercise(exercise))}>
                <span>{exercise}</span><Plus size={15} className="text-primary" />
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          disabled={plan.exercises.length === 0}
          className="btn-primary py-3.5 disabled:opacity-40"
          onClick={() => setSeriesExercise(plan.exercises[0] ?? null)}
        >
          Iniciar treino
        </button>
        <button type="button" className="btn-secondary justify-center px-4" onClick={() => openRest()}>
          <Timer size={18} /> Descanso
        </button>
      </div>

      <Card className="mb-4">
        <SectionTitle>Marcar conclusão</SectionTitle>
        <label className="field-label mb-3">Data
          <input type="date" value={completionDate} onChange={(event) => setCompletionDate(event.target.value)} />
        </label>
        <p className="mb-3 text-sm text-muted">
          {completionPlan.name} • {completionPlan.exercises.length} exercício(s)
        </p>
        {completed ? (
          <button type="button" className="btn-secondary flex w-full items-center justify-center gap-2 py-3" onClick={() => actions.undoWorkout(completionDate)}>
            <Undo2 size={17} /> Desmarcar conclusão
          </button>
        ) : (
          <button type="button" disabled={completionPlan.exercises.length === 0} className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-40" onClick={() => actions.completeWorkout(completionDate)}>
            <CheckCircle2 size={18} /> Marcar treino como concluído
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle>Histórico concluído</SectionTitle>
        {history.length ? (
          <div className="space-y-2">
            {history.slice(0, 12).map((entry) => (
              <div className="rounded-2xl bg-slate-50 px-3 py-3" key={entry.id}>
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{entry.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
                    <button className="text-slate-400" onClick={() => actions.undoWorkout(entry.date)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">{entry.exercises.map((exercise) => exercise.name).join(" • ")}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Nenhum treino concluído ainda.</Empty>
        )}
      </Card>

      <ExerciseModal exercise={editor} onClose={() => setEditor(null)} onSave={saveExercise} />
      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name) => {
          saveExercise(emptyExercise(name));
          setPickerOpen(false);
        }}
        onCustom={() => {
          setPickerOpen(false);
          setEditor(emptyExercise());
        }}
      />
      <SeriesModal
        exercise={seriesExercise}
        completed={seriesExercise ? performedSets[seriesExercise.id] ?? 0 : 0}
        onClose={() => setSeriesExercise(null)}
        onChange={(count) => seriesExercise && setPerformedSets((current) => ({ ...current, [seriesExercise.id]: count }))}
      />
      <RestModal
        open={restOpen}
        seconds={restSeconds}
        running={restRunning}
        onClose={() => { setRestOpen(false); setRestRunning(false); }}
        onSelect={(seconds) => { setRestSeconds(seconds); setRestRunning(false); }}
        onToggle={() => setRestRunning((current) => !current)}
        onReset={() => { setRestSeconds(60); setRestRunning(false); }}
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
        onSave={(template) => {
          if (actions.saveWorkoutTemplate(template)) setTemplateEditor(null);
        }}
      />
      <ApplyTemplateModal
        template={applyTemplate}
        workouts={data.workouts}
        onClose={() => setApplyTemplate(null)}
        onApply={(day, mode) => {
          if (applyTemplate && actions.applyWorkoutTemplate(applyTemplate.id, day, mode)) setApplyTemplate(null);
        }}
      />
    </>
  );
}

function ExerciseCard({
  exercise,
  completedSets,
  onSeries,
  onEdit,
  onRemove,
  onUp,
  onDown
}: {
  exercise: WorkoutExercise;
  completedSets: number;
  onSeries: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <article className="rounded-2xl border border-outline bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-ink">{exercise.name}</p>
        <div className="flex shrink-0 gap-2 text-slate-400">
          <button type="button" aria-label="Mover para cima" onClick={onUp}><ArrowUp size={15} /></button>
          <button type="button" aria-label="Mover para baixo" onClick={onDown}><ArrowDown size={15} /></button>
          <button type="button" aria-label="Editar" onClick={onEdit}><Pencil size={15} /></button>
          <button type="button" aria-label="Remover" onClick={onRemove}><Trash2 size={15} /></button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <ExerciseMetric label="Séries" value={String(exercise.sets)} />
        <ExerciseMetric label="Repetições" value={exercise.repetitions} />
        <ExerciseMetric label="Carga" value={exercise.load || "-"} />
      </div>
      {exercise.notes && <p className="mt-3 text-xs text-muted">{exercise.notes}</p>}
      <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm font-medium text-primary" onClick={onSeries}>
        <CheckCircle2 size={16} /> {completedSets ? `${completedSets}/${exercise.sets} séries feitas` : "Registar série"}
      </button>
    </article>
  );
}

function ExerciseMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function ExercisePickerModal({
  open,
  onClose,
  onPick,
  onCustom
}: {
  open: boolean;
  onClose: () => void;
  onPick: (name: string) => void;
  onCustom: () => void;
}) {
  return (
    <Modal open={open} title="Adicionar exercício" onClose={onClose}>
      <button type="button" className="btn-primary mb-3 w-full py-3" onClick={onCustom}>
        <Plus size={17} /> Exercício personalizado
      </button>
      <div className="space-y-3">
        {exerciseGroups.map(({ group, exercises }) => (
          <details key={group} className="rounded-2xl border border-outline bg-slate-50 p-3" open={group === "Peito"}>
            <summary className="cursor-pointer text-sm font-semibold text-ink">{group}</summary>
            <div className="mt-2 space-y-1">
              {exercises.map((exercise) => (
                <button key={exercise} type="button" className="selection-row" onClick={() => onPick(exercise)}>
                  <span>{exercise}</span><Plus size={15} className="text-primary" />
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Modal>
  );
}

function ExerciseModal({
  exercise,
  onClose,
  onSave
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
      <form className="space-y-3" onSubmit={(event: FormEvent) => { event.preventDefault(); onSave({ ...form, sets: Number(setsText) }); }}>
        <label className="field-label">Nome do exercício
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">Séries
            <input required type="number" min="1" value={setsText} placeholder="Ex: 3" onChange={(event) => setSetsText(event.target.value.replace(/^0+(?=\d)/, ""))} />
          </label>
          <label className="field-label">Repetições
            <input required value={form.repetitions} onChange={(event) => setForm({ ...form, repetitions: event.target.value })} placeholder="10 ou 8-12" />
          </label>
        </div>
        <label className="field-label">Carga opcional
          <input value={form.load} onChange={(event) => setForm({ ...form, load: event.target.value })} placeholder="Ex.: 40 kg" />
        </label>
        <label className="field-label">Observação opcional
          <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Ex.: controlar descida" />
        </label>
        <button className="btn-primary w-full py-3" type="submit">Guardar exercício</button>
      </form>
    </Modal>
  );
}

function SeriesModal({
  exercise,
  completed,
  onClose,
  onChange
}: {
  exercise: WorkoutExercise | null;
  completed: number;
  onClose: () => void;
  onChange: (completed: number) => void;
}) {
  if (!exercise) return null;
  return (
    <Modal open title={exercise.name} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">Marque as séries executadas nesta sessão. Este registo não altera o histórico detalhado.</p>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {Array.from({ length: exercise.sets }, (_, index) => {
          const count = index + 1;
          const done = count <= completed;
          return (
            <button
              key={count}
              type="button"
              className={`rounded-xl border px-2 py-3 text-sm font-medium ${done ? "border-primary bg-primary text-white" : "border-outline bg-white text-muted"}`}
              onClick={() => onChange(done && count === completed ? completed - 1 : count)}
            >
              Série {count}
            </button>
          );
        })}
      </div>
      <button className="btn-primary w-full py-3" type="button" onClick={onClose}>Concluir registo</button>
    </Modal>
  );
}

function RestModal({
  open,
  seconds,
  running,
  onClose,
  onSelect,
  onToggle,
  onReset
}: {
  open: boolean;
  seconds: number;
  running: boolean;
  onClose: () => void;
  onSelect: (seconds: number) => void;
  onToggle: () => void;
  onReset: () => void;
}) {
  return (
    <Modal open={open} title="Temporizador de descanso" onClose={onClose}>
      <p className="mb-5 text-center text-5xl font-semibold tabular-nums text-ink">{formatTimer(seconds)}</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[30, 60, 90].map((duration) => (
          <button key={duration} type="button" className="btn-secondary justify-center" onClick={() => onSelect(duration)}>
            {duration}s
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary justify-center py-3" onClick={onReset}>Repor</button>
        <button type="button" className="btn-primary py-3" onClick={onToggle}>{running ? "Pausar" : "Iniciar"}</button>
      </div>
    </Modal>
  );
}

function TemplatesModal({
  open,
  templates,
  currentPlan,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyCurrent,
  onApply
}: {
  open: boolean;
  templates: WorkoutTemplate[];
  currentPlan: { exercises: WorkoutExercise[] };
  onClose: () => void;
  onCreate: () => void;
  onEdit: (template: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCopyCurrent: () => void;
  onApply: (template: WorkoutTemplate) => void;
}) {
  return (
    <Modal open={open} title="Modelos de treino" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button className="btn-primary py-3" type="button" onClick={onCreate}><Plus size={17} /> Criar modelo</button>
        <button className="btn-secondary justify-center py-3 disabled:opacity-40" type="button" disabled={!currentPlan.exercises.length} onClick={onCopyCurrent}>
          <Copy size={17} /> Copiar atual
        </button>
      </div>
      {templates.length ? (
        <div className="space-y-3">
          {templates.map((template) => (
            <article key={template.id} className="rounded-2xl border border-outline bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{template.name}</p>
                  <p className="text-sm text-muted">{template.exercises.length} exercício(s)</p>
                </div>
                <button className="btn-secondary px-3" type="button" onClick={() => onApply(template)}>Aplicar</button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="btn-secondary justify-center px-2" type="button" onClick={() => onEdit(template)}><Pencil size={15} /> Editar</button>
                <button className="btn-secondary justify-center px-2" type="button" onClick={() => onDuplicate(template.id)}><Copy size={15} /> Duplicar</button>
                <button className="btn-secondary justify-center px-2" type="button" onClick={() => onDelete(template.id)}><Trash2 size={15} /> Apagar</button>
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

function TemplateEditorModal({
  template,
  onClose,
  onSave
}: {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onSave: (template: WorkoutTemplate) => void;
}) {
  const [form, setForm] = useState<WorkoutTemplate | null>(template);
  useEffect(() => setForm(template), [template]);
  if (!template || !form) return null;

  function updateExercise(index: number, exercise: WorkoutExercise) {
    setForm((current) => current && {
      ...current,
      exercises: current.exercises.map((entry, entryIndex) => entryIndex === index ? exercise : entry)
    });
  }

  return (
    <Modal open title="Editar modelo" onClose={onClose}>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label className="field-label">Nome do modelo
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <SectionTitle>Exercícios</SectionTitle>
        <div className="space-y-3">
          {form.exercises.map((exercise, index) => (
            <div key={exercise.id} className="rounded-2xl border border-outline p-3">
              <label className="field-label">Nome
                <input required value={exercise.name} onChange={(event) => updateExercise(index, { ...exercise, name: event.target.value })} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="field-label">Séries
                  <input required type="number" min="1" max="20" value={exercise.sets ? String(exercise.sets) : ""} placeholder="Ex: 3" onChange={(event) => updateExercise(index, { ...exercise, sets: Number(event.target.value.replace(/^0+(?=\d)/, "")) })} />
                </label>
                <label className="field-label">Repetições
                  <input required value={exercise.repetitions} onChange={(event) => updateExercise(index, { ...exercise, repetitions: event.target.value })} />
                </label>
              </div>
              <label className="field-label mt-3">Carga opcional
                <input value={exercise.load} onChange={(event) => updateExercise(index, { ...exercise, load: event.target.value })} />
              </label>
              <label className="field-label mt-3">Observação opcional
                <input value={exercise.notes} onChange={(event) => updateExercise(index, { ...exercise, notes: event.target.value })} />
              </label>
              <button className="mt-3 text-sm font-semibold text-danger" type="button" onClick={() => setForm({ ...form, exercises: form.exercises.filter((_, entryIndex) => entryIndex !== index) })}>
                Remover exercício
              </button>
            </div>
          ))}
        </div>
        <button className="btn-secondary justify-center py-3" type="button" onClick={() => setForm({ ...form, exercises: [...form.exercises, emptyExercise()] })}>
          <Plus size={17} /> Adicionar exercício
        </button>
        <button className="btn-primary w-full py-3" type="submit">Guardar modelo</button>
      </form>
    </Modal>
  );
}

function ApplyTemplateModal({
  template,
  workouts,
  onClose,
  onApply
}: {
  template: WorkoutTemplate | null;
  workouts: { day: Weekday; exercises: WorkoutExercise[] }[];
  onClose: () => void;
  onApply: (day: Weekday, mode: "replace" | "append") => void;
}) {
  const [day, setDay] = useState<Weekday>("segunda");
  useEffect(() => setDay("segunda"), [template]);
  if (!template) return null;
  const hasWorkout = Boolean(workouts.find((entry) => entry.day === day)?.exercises.length);

  function apply(mode: "replace" | "append") {
    onApply(day, mode);
  }

  return (
    <Modal open title="Aplicar modelo" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{template.name}</p>
      <label className="field-label mb-4">Dia da semana
        <select value={day} onChange={(event) => setDay(event.target.value as Weekday)}>
          {weekdays.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      {hasWorkout ? (
        <>
          <p className="mb-3 rounded-2xl bg-primary-light p-3 text-sm text-ink">Este dia já tem treino. Deseja substituir ou adicionar ao treino existente?</p>
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-primary px-2" type="button" onClick={() => apply("replace")}>Substituir</button>
            <button className="btn-secondary justify-center px-2" type="button" onClick={() => apply("append")}>Adicionar</button>
            <button className="btn-secondary justify-center px-2" type="button" onClick={onClose}>Cancelar</button>
          </div>
        </>
      ) : (
        <button className="btn-primary w-full py-3" type="button" onClick={() => apply("replace")}>Aplicar modelo</button>
      )}
    </Modal>
  );
}

function formatTimer(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}
