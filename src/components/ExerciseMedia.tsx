import { useEffect, useState } from "react";
import { getExerciseImages } from "../data/exerciseMedia";

/**
 * Demonstração animada do exercício: alterna entre os 2 quadros
 * (posição inicial/final) criando um efeito de GIF.
 * Não renderiza nada se o exercício não tiver mídia ou a imagem falhar.
 */
export function ExerciseAnim({ name, className = "" }: { name: string; className?: string }) {
  const images = getExerciseImages(name);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [name]);

  useEffect(() => {
    if (!images || failed) return;
    const id = window.setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [name, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!images || failed) return null;

  return (
    <div className={`exercise-anim ${className}`}>
      <img
        src={images[0]}
        alt={`Demonstração: ${name}`}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ opacity: frame === 0 ? 1 : 0 }}
      />
      <img
        src={images[1]}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ opacity: frame === 1 ? 1 : 0 }}
      />
    </div>
  );
}

/** Miniatura estática (1º quadro) para listas de seleção. */
export function ExerciseThumb({ name }: { name: string }) {
  const images = getExerciseImages(name);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [name]);

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
