import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { exerciseGroups } from "../data/exercises";
import { getExerciseInfo, GROUP_COLORS } from "../data/exerciseLibrary";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { ExerciseDetailModal } from "./ExerciseDetailModal";
import { Empty, Modal } from "./Ui";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Biblioteca de exercícios navegável (inspirada no Lyfta): chips de grupos
 * musculares, busca e grade de cards com foto. Tocar em um card abre o
 * detalhe com a demonstração completa.
 */
export function ExerciseLibraryModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  /** Quando informado, o detalhe mostra "Adicionar ao treino". */
  onAdd?: (name: string) => void;
}) {
  const [group, setGroup] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<string | null>(null);

  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; group: string }[] = [];
    for (const entry of exerciseGroups) {
      if (group !== "Todos" && entry.group !== group) continue;
      for (const name of entry.exercises) {
        if (seen.has(name)) continue;
        seen.add(name);
        list.push({ name, group: entry.group });
      }
    }
    const query = normalize(search.trim());
    if (!query) return list;
    return list.filter((item) => normalize(item.name).includes(query));
  }, [group, search]);

  return (
    <>
      <Modal
        title="Biblioteca de exercícios"
        open={open}
        onClose={onClose}
        stickyTop={
          <div className="space-y-3">
            <label className="search-input">
              <Search className="h-4 w-4" />
              <input
                type="search"
                placeholder="Buscar exercício"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              {["Todos", ...exerciseGroups.map((g) => g.group)].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    group === g
                      ? "bg-primary text-white"
                      : GROUP_COLORS[g] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {items.length === 0 ? (
          <Empty>Nenhum exercício encontrado para essa busca.</Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-1">
            {items.map((item) => {
              const info = getExerciseInfo(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setDetail(item.name)}
                  className="flex flex-col gap-2 rounded-3xl border border-outline bg-white p-3 text-left shadow-card"
                >
                  <ExerciseAnimation images={info?.images} alt={item.name} size="card" />
                  <div>
                    <p className="m-0 text-[13px] font-semibold leading-tight text-ink">
                      {item.name}
                    </p>
                    <p className="m-0 mt-1 text-[11px] font-medium text-slate-400">
                      {info?.primaryMuscles.join(", ") ?? item.group}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      {detail && (
        <ExerciseDetailModal
          name={detail}
          open
          onClose={() => setDetail(null)}
          onAdd={onAdd}
        />
      )}
    </>
  );
}
