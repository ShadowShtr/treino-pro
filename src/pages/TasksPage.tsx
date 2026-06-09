import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { FitnessData, KanbanTask } from "../types";

interface KanbanActions {
  addKanbanColumn: (name: string) => void;
  renameKanbanColumn: (id: string, name: string) => void;
  deleteKanbanColumn: (id: string) => void;
  addKanbanTask: (columnId: string, title: string) => void;
  updateKanbanTask: (columnId: string, task: KanbanTask) => void;
  deleteKanbanTask: (columnId: string, taskId: string) => void;
  moveKanbanTask: (taskId: string, fromColumnId: string, toColumnId: string) => void;
}

interface Props {
  data: FitnessData;
  actions: KanbanActions;
}

type DragState = {
  taskId: string;
  fromColumnId: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
};

export function TasksPage({ data, actions }: Props) {
  const columns = data.kanbanColumns ?? [];

  const [openTask, setOpenTask] = useState<{ task: KanbanTask; columnId: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");

  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  const actionsRef = useRef(actions);
  const wasDraggingRef = useRef(false);

  useEffect(() => { actionsRef.current = actions; }, [actions]);

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const active = d.active || Math.sqrt(dx * dx + dy * dy) > 8;

      if (active) {
        let found: string | null = null;
        for (const [id, el] of columnRefs.current) {
          const r = el.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top && e.clientY <= r.bottom) {
            found = id;
            break;
          }
        }
        dropTargetRef.current = found;
        setDropTarget(found);
      }

      const next: DragState = { ...d, x: e.clientX, y: e.clientY, active };
      dragRef.current = next;
      setDrag(next);
    }

    function handleUp() {
      const d = dragRef.current;
      if (!d) return;
      wasDraggingRef.current = d.active;
      if (d.active && dropTargetRef.current && dropTargetRef.current !== d.fromColumnId) {
        actionsRef.current.moveKanbanTask(d.taskId, d.fromColumnId, dropTargetRef.current);
      }
      dragRef.current = null;
      dropTargetRef.current = null;
      setDrag(null);
      setDropTarget(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  function handleCardPointerDown(e: React.PointerEvent, taskId: string, columnId: string) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const state: DragState = {
      taskId, fromColumnId: columnId,
      startX: e.clientX, startY: e.clientY,
      x: e.clientX, y: e.clientY,
      active: false
    };
    dragRef.current = state;
    setDrag(state);
  }

  function handleCardClick(task: KanbanTask, columnId: string) {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    setOpenTask({ task, columnId });
    setEditingTitle(task.title);
    setEditingDesc(task.description ?? "");
  }

  function saveTaskModal() {
    if (!openTask) return;
    const title = editingTitle.trim();
    actions.updateKanbanTask(openTask.columnId, {
      ...openTask.task,
      title: title || openTask.task.title,
      description: editingDesc.trim() || undefined
    });
    setOpenTask(null);
  }

  function commitAddColumn() {
    const name = newColumnName.trim();
    if (name) actions.addKanbanColumn(name);
    setAddingColumn(false);
    setNewColumnName("");
  }

  function commitAddTask(columnId: string) {
    const title = newTaskTitle.trim();
    if (title) actions.addKanbanTask(columnId, title);
    setAddingTask(null);
    setNewTaskTitle("");
  }

  const draggedTask = drag
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === drag.taskId)
    : null;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Tarefas</h1>

      {/* Board */}
      <div className="-mx-4 overflow-x-auto">
        <div className="flex gap-3 px-4 pb-4" style={{ minWidth: "max-content" }}>

          {columns.map((col) => (
            <div
              key={col.id}
              ref={(el) => {
                if (el) columnRefs.current.set(col.id, el);
                else columnRefs.current.delete(col.id);
              }}
              className={`flex w-64 flex-shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                dropTarget === col.id && drag?.fromColumnId !== col.id
                  ? "border-primary bg-primary-light/60"
                  : "border-outline bg-card"
              }`}
            >
              {/* Column header */}
              <div className="mb-3 flex items-center gap-1.5">
                {editingColumnId === col.id ? (
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-primary px-2 py-1 text-sm font-semibold outline-none"
                    value={editingColumnName}
                    onChange={(e) => setEditingColumnName(e.target.value)}
                    onBlur={() => {
                      const n = editingColumnName.trim();
                      if (n) actions.renameKanbanColumn(col.id, n);
                      setEditingColumnId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const n = editingColumnName.trim();
                        if (n) actions.renameKanbanColumn(col.id, n);
                        setEditingColumnId(null);
                      }
                      if (e.key === "Escape") setEditingColumnId(null);
                    }}
                  />
                ) : (
                  <button
                    className="flex-1 text-left text-sm font-semibold text-slate-700"
                    onClick={() => {
                      setEditingColumnId(col.id);
                      setEditingColumnName(col.name);
                    }}
                  >
                    {col.name}
                    <span className="ml-1.5 text-xs font-normal text-slate-400">{col.tasks.length}</span>
                  </button>
                )}
                <button
                  className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-400"
                  onClick={() => {
                    if (window.confirm(`Excluir coluna "${col.name}"?`))
                      actions.deleteKanbanColumn(col.id);
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`cursor-pointer rounded-xl border border-outline bg-white p-3 shadow-sm transition-all select-none ${
                      drag?.taskId === task.id && drag.active
                        ? "scale-95 opacity-40"
                        : "hover:border-primary/40 hover:shadow"
                    }`}
                    onPointerDown={(e) => handleCardPointerDown(e, task.id, col.id)}
                    onClick={() => handleCardClick(task, col.id)}
                  >
                    <p className="text-sm font-medium leading-snug text-slate-800">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add task */}
              {addingTask === col.id ? (
                <div className="mt-2">
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-primary px-3 py-2 text-sm outline-none"
                    placeholder="Título da tarefa..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitAddTask(col.id);
                      if (e.key === "Escape") { setAddingTask(null); setNewTaskTitle(""); }
                    }}
                    onBlur={() => commitAddTask(col.id)}
                  />
                </div>
              ) : (
                <button
                  className="mt-2 flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  onClick={() => { setAddingTask(col.id); setNewTaskTitle(""); }}
                >
                  <Plus size={13} />
                  Adicionar tarefa
                </button>
              )}
            </div>
          ))}

          {/* Add column */}
          <div className="w-64 flex-shrink-0">
            {addingColumn ? (
              <div className="rounded-2xl border border-outline bg-card p-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Nova coluna</p>
                <input
                  autoFocus
                  className="w-full rounded-xl border border-primary px-3 py-2 text-sm outline-none"
                  placeholder="Nome da coluna..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitAddColumn();
                    if (e.key === "Escape") { setAddingColumn(false); setNewColumnName(""); }
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="flex-1 rounded-xl bg-primary py-1.5 text-sm font-medium text-white"
                    onClick={commitAddColumn}
                  >
                    Criar
                  </button>
                  <button
                    className="rounded-xl border border-outline px-3 py-1.5 text-sm text-slate-500"
                    onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-400 transition hover:border-primary hover:text-primary"
                onClick={() => setAddingColumn(true)}
              >
                <Plus size={15} />
                Nova coluna
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Drag ghost */}
      {drag?.active && draggedTask && (
        <div
          className="pointer-events-none fixed z-50 w-56 rotate-2 rounded-xl border border-primary bg-white p-3 shadow-2xl opacity-90"
          style={{ left: drag.x - 28, top: drag.y - 16, transform: "rotate(2deg)" }}
        >
          <p className="text-sm font-medium text-slate-800">{draggedTask.title}</p>
          {draggedTask.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{draggedTask.description}</p>
          )}
        </div>
      )}

      {/* Task popup modal */}
      {openTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[calc(86px+env(safe-area-inset-bottom))]"
          onClick={(e) => { if (e.target === e.currentTarget) saveTaskModal(); }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">Detalhes da tarefa</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-xl p-1.5 text-red-400 hover:bg-red-50"
                  onClick={() => {
                    actions.deleteKanbanTask(openTask.columnId, openTask.task.id);
                    setOpenTask(null);
                  }}
                >
                  <Trash2 size={15} />
                </button>
                <button
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50"
                  onClick={saveTaskModal}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
                <input
                  className="w-full rounded-xl border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTaskModal(); }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
                <textarea
                  className="w-full resize-none rounded-xl border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                  rows={3}
                  placeholder="Adicione uma descrição..."
                  value={editingDesc}
                  onChange={(e) => setEditingDesc(e.target.value)}
                />
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white"
              onClick={saveTaskModal}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
