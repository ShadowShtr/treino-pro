import { useEffect, useState } from "react";
import { getExerciseImages, getExerciseSvgFrames, getExerciseTips } from "../data/exerciseMedia";

/**
 * Demonstração animada do exercício: alterna entre os quadros
 * (posição inicial/final) criando um efeito de GIF.
 * Usa fotos do catálogo ou, para alguns exercícios, bonecos SVG locais.
 * Não renderiza nada se o exercício não tiver mídia ou a imagem falhar.
 */
export function ExerciseAnim({ name, className = "" }: { name: string; className?: string }) {
  const svgFrames = getExerciseSvgFrames(name);
  const images = svgFrames ? null : getExerciseImages(name);
  const frameCount = svgFrames?.length ?? (images ? 2 : 0);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [name]);

  useEffect(() => {
    if (frameCount < 2 || failed) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frameCount), 1000);
    return () => window.clearInterval(id);
  }, [name, frameCount, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (frameCount === 0 || failed) return null;

  return (
    <div className={`exercise-anim ${className}`}>
      {svgFrames
        ? svgFrames.map((svg, i) => (
            <div
              key={i}
              className="exercise-anim-svg"
              style={{ opacity: frame === i ? 1 : 0 }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ))
        : images!.map((src, i) => (
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

/** Miniatura estática (1º quadro) para listas de seleção. */
export function ExerciseThumb({ name }: { name: string }) {
  const svgFrames = getExerciseSvgFrames(name);
  const images = svgFrames ? null : getExerciseImages(name);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [name]);

  if (svgFrames) {
    return (
      <span
        className="exercise-thumb exercise-thumb-svg"
        dangerouslySetInnerHTML={{ __html: svgFrames[0] }}
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
