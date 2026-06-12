import { useEffect, useState } from "react";
import { getExerciseAnimation, getExerciseImages, getExerciseTips } from "../data/exerciseMedia";

/**
 * Demonstração do exercício. Dois formatos:
 * - mini-animação SVG local (boneco em movimento contínuo, estilo vídeo);
 * - 2 fotos do catálogo (posição inicial/final) alternadas em crossfade.
 * Não renderiza nada se o exercício não tiver mídia ou a imagem falhar.
 */
export function ExerciseAnim({ name, className = "" }: { name: string; className?: string }) {
  const animation = getExerciseAnimation(name);
  const images = animation ? null : getExerciseImages(name);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [name]);

  useEffect(() => {
    if (!images || failed) return;
    const id = window.setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 900);
    return () => window.clearInterval(id);
  }, [name, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (animation) {
    return (
      <div className={`exercise-anim ${className}`}>
        <div className="exercise-anim-svg" dangerouslySetInnerHTML={{ __html: animation }} />
      </div>
    );
  }

  if (!images || failed) return null;

  return (
    <div className={`exercise-anim ${className}`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? `Demonstração: ${name}` : ""}
          decoding="async"
          onError={() => setFailed(true)}
          style={{ opacity: frame === i ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

/** Miniatura para listas de seleção (animada para os bonecos SVG). */
export function ExerciseThumb({ name }: { name: string }) {
  const animation = getExerciseAnimation(name);
  const images = animation ? null : getExerciseImages(name);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [name]);

  if (animation) {
    return (
      <span
        className="exercise-thumb exercise-thumb-svg"
        dangerouslySetInnerHTML={{ __html: animation }}
      />
    );
  }
  if (!images || failed) return null;
  return (
    <img
      className="exercise-thumb"
      src={images[0]}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** Dicas curtas de execução — complementam a demonstração visual. */
export function ExerciseTips({ name, className = "" }: { name: string; className?: string }) {
  const tips = getExerciseTips(name);
  if (!tips) return null;

  return (
    <ul className={`space-y-1.5 ${className}`}>
      {tips.map((tip, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          {tip}
        </li>
      ))}
    </ul>
  );
}
