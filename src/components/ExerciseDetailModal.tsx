import { Dumbbell, Lightbulb, Plus } from "lucide-react";
import {
  DIFFICULTY_LABELS,
  getExerciseGroup,
  getExerciseInfo,
  GROUP_COLORS,
} from "../data/exerciseLibrary";
import { ExerciseAnimation } from "./ExerciseAnimation";
import { Empty, Modal } from "./Ui";

/**
 * Modal "como fazer" de um exercício: animação do movimento, músculos
 * trabalhados, equipamento, passo a passo numerado e dicas de técnica.
 *
 * Para exercícios personalizados (fora da biblioteca) mostra um estado
 * vazio amigável em vez de quebrar.
 */
export function ExerciseDetailModal({
  name,
  open,
  onClose,
  onAdd,
}: {
  name: string;
  open: boolean;
  onClose: () => void;
  /** Quando informado, mostra o botão "Adicionar ao treino". */
  onAdd?: (name: string) => void;
}) {
  const info = getExerciseInfo(name);
  const group = info?.group ?? getExerciseGroup(name);
  const groupColor = GROUP_COLORS[group] ?? "bg-slate-100 text-slate-700";

  return (
    <Modal title={name} open={open} onClose={onClose}>
      {!info ? (
        <Empty>
          Este exercício foi criado por você, então ainda não temos a
          demonstração dele na biblioteca. Execute com a orientação de um
          profissional. 💪
        </Empty>
      ) : (
        <div className="space-y-5 pb-1">
          <ExerciseAnimation images={info.images} alt={name} size="full" />

          <div className="flex flex-wrap items-center gap-2">
            {group && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${groupColor}`}>
                {group}
              </span>
            )}
            <span className="badge-soft">{DIFFICULTY_LABELS[info.difficulty]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Dumbbell className="h-3.5 w-3.5" />
              {info.equipment}
            </span>
          </div>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Músculos trabalhados
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {info.primaryMuscles.map((m) => (
                <span key={m} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${groupColor}`}>
                  {m}
                </span>
              ))}
              {info.secondaryMuscles?.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                  {m}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Como executar
            </h3>
            <ol className="space-y-2.5">
              {info.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="m-0 pt-0.5 text-sm leading-relaxed text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {info.tips && info.tips.length > 0 && (
            <section className="rounded-2xl bg-slate-50 p-3.5">
              <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                <Lightbulb className="h-4 w-4 text-warning" />
                Dicas
              </h3>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {info.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-slate-500">
                    <span className="text-warning">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {onAdd && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => {
                onAdd(name);
                onClose();
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar ao treino
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
