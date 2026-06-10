import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

/**
 * Simula um GIF do exercício alternando as duas fotos (posição inicial e
 * final) com crossfade. As imagens vêm de CDN e carregam sob demanda:
 * mostra um skeleton enquanto carregam e um fallback elegante se falharem
 * (ex.: offline ou exercício sem foto).
 *
 * Tocar na imagem pausa/retoma a animação.
 */
export function ExerciseAnimation({
  images,
  alt,
  size = "full",
  className = "",
}: {
  images?: [string, string];
  alt: string;
  /**
   * full  — animação com crossfade (modal de detalhe)
   * card  — primeira foto estática em proporção 4:3 (grades/listas)
   * thumb — miniatura quadrada estática (linhas compactas)
   */
  size?: "thumb" | "card" | "full";
  className?: string;
}) {
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<[boolean, boolean]>([false, false]);
  const [failed, setFailed] = useState(false);

  const isThumb = size === "thumb";
  const isStatic = size !== "full";
  const ready = loaded[0] && loaded[1];
  const animating = !isStatic && ready && !failed && !paused;

  useEffect(() => {
    if (!animating) return;
    const id = window.setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1100);
    return () => window.clearInterval(id);
  }, [animating]);

  if (!images || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-slate-100 ${
          isThumb ? "h-14 w-14" : "aspect-[4/3] w-full"
        } ${className}`}
        aria-label={alt}
      >
        <Dumbbell className={`text-slate-400 ${isThumb ? "h-5 w-5" : "h-10 w-10"}`} />
      </div>
    );
  }

  if (isStatic) {
    return (
      <div
        className={`flex-shrink-0 overflow-hidden border border-outline ${
          isThumb ? "h-14 w-14 rounded-2xl" : "aspect-[4/3] w-full rounded-2xl"
        } ${className}`}
        style={{ background: "#fff" }}
      >
        <img
          src={images[0]}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain ${isThumb ? "" : "p-1.5"}`}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPaused((p) => !p)}
      className={`relative block aspect-[4/3] w-full overflow-hidden rounded-3xl border border-outline ${className}`}
      style={{ background: "#fff" }}
      aria-label={paused ? "Retomar animação" : "Pausar animação"}
    >
      {!ready && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? `${alt} — posição inicial` : `${alt} — posição final`}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-300"
          style={{ opacity: ready && frame === i ? 1 : 0 }}
          onLoad={() => setLoaded((l) => (i === 0 ? [true, l[1]] : [l[0], true]))}
          onError={() => setFailed(true)}
        />
      ))}
      {ready && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{ background: frame === i ? "#fc4c02" : "#e5e7eb" }}
            />
          ))}
        </div>
      )}
      {paused && ready && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold text-white">
          Pausado
        </span>
      )}
    </button>
  );
}
