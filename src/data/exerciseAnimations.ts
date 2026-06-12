// Mini-animações SVG dos exercícios — efeito de vídeo em loop contínuo.
// Cada exercício é um boneco definido por poses-chave; o SMIL nativo do
// navegador interpola suavemente entre elas. Sem download, sem direitos
// autorais, funciona offline e pesa menos de 1 KB por exercício.

type Pt = [number, number];

type Pose = {
  head: Pt;
  neck: Pt;
  hip: Pt;
  /** por braço: [cotovelo, mão] */
  arms: [Pt, Pt][];
  /** por perna: [joelho, pé] */
  legs: [Pt, Pt][];
};

const SPLINE = "0.42 0 0.58 1";

function animateAttr(attr: string, values: (string | number)[], dur: number): string {
  const splines = Array(values.length - 1).fill(SPLINE).join(";");
  return `<animate attributeName="${attr}" values="${values.join(";")}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines="${splines}"/>`;
}

function animatedPath(ds: string[], dur: number): string {
  return `<path d="${ds[0]}">${animateAttr("d", ds, dur)}</path>`;
}

function limb(from: Pt, mid: Pt, end: Pt): string {
  return `M${from[0]} ${from[1]} L${mid[0]} ${mid[1]} L${end[0]} ${end[1]}`;
}

function buildFigure(keyPoses: Pose[], dur: number): string {
  const poses = [...keyPoses, keyPoses[0]]; // fecha o loop na pose inicial
  const parts: string[] = [
    animatedPath(poses.map((p) => `M${p.neck[0]} ${p.neck[1]} L${p.hip[0]} ${p.hip[1]}`), dur),
  ];
  for (let i = 0; i < keyPoses[0].arms.length; i++) {
    parts.push(animatedPath(poses.map((p) => limb(p.neck, p.arms[i][0], p.arms[i][1])), dur));
  }
  for (let i = 0; i < keyPoses[0].legs.length; i++) {
    parts.push(animatedPath(poses.map((p) => limb(p.hip, p.legs[i][0], p.legs[i][1])), dur));
  }
  const head =
    `<circle r="14" cx="${poses[0].head[0]}" cy="${poses[0].head[1]}">` +
    animateAttr("cx", poses.map((p) => p.head[0]), dur) +
    animateAttr("cy", poses.map((p) => p.head[1]), dur) +
    `</circle>`;
  return (
    `<svg viewBox="0 0 200 190" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M14 181 H186" stroke-width="4" opacity="0.18"/>` +
    head +
    parts.join("") +
    `</svg>`
  );
}

// Chaves já normalizadas (minúsculas, sem acento).
export const EXERCISE_ANIMATIONS: Record<string, string> = {};

function register(names: string[], poses: Pose[], dur: number) {
  const svg = buildFigure(poses, dur);
  for (const n of names) EXERCISE_ANIMATIONS[n] = svg;
}

// ── Polichinelo (vista frontal) ──
register(
  ["polichinelo", "polichinelos", "jumping jack"],
  [
    {
      head: [100, 40], neck: [100, 56], hip: [100, 118],
      arms: [[[84, 88], [78, 116]], [[116, 88], [122, 116]]],
      legs: [[[95, 150], [90, 180]], [[105, 150], [110, 180]]],
    },
    {
      head: [100, 32], neck: [100, 48], hip: [100, 112],
      arms: [[[70, 40], [56, 16]], [[130, 40], [144, 16]]],
      legs: [[[80, 146], [64, 180]], [[120, 146], [136, 180]]],
    },
  ],
  1.1
);

// ── Burpee (agachar → prancha → agachar → saltar) ──
const burpeeStand: Pose = {
  head: [100, 36], neck: [100, 54], hip: [100, 116],
  arms: [[[96, 88], [94, 114]], [[104, 88], [106, 114]]],
  legs: [[[97, 148], [94, 178]], [[103, 148], [106, 178]]],
};
const burpeeCrouch: Pose = {
  head: [120, 104], neck: [112, 114], hip: [88, 140],
  arms: [[[114, 144], [116, 174]], [[120, 146], [122, 176]]],
  legs: [[[112, 156], [106, 178]], [[116, 158], [110, 178]]],
};
register(
  ["burpee", "burpees"],
  [
    burpeeStand,
    burpeeCrouch,
    {
      head: [154, 108], neck: [142, 116], hip: [98, 140],
      arms: [[[138, 144], [136, 174]], [[144, 146], [142, 176]]],
      legs: [[[66, 156], [40, 172]], [[70, 158], [44, 174]]],
    },
    burpeeCrouch,
    {
      head: [100, 20], neck: [100, 38], hip: [100, 96],
      arms: [[[78, 26], [66, 6]], [[122, 26], [134, 6]]],
      legs: [[[96, 126], [92, 150]], [[104, 126], [108, 150]]],
    },
  ],
  3.2
);

// ── Hollow body (deitado → eleva ombros e pernas) ──
register(
  ["hollow body", "hollow"],
  [
    {
      head: [36, 152], neck: [52, 156], hip: [106, 158],
      arms: [[[32, 150], [14, 144]], [[34, 152], [16, 148]]],
      legs: [[[134, 158], [166, 158]], [[136, 160], [168, 160]]],
    },
    {
      head: [44, 126], neck: [58, 136], hip: [106, 152],
      arms: [[[36, 120], [18, 106]], [[38, 122], [20, 110]]],
      legs: [[[136, 142], [166, 124]], [[138, 144], [168, 128]]],
    },
  ],
  1.8
);

// ── Flexão de braço (vista lateral) ──
register(
  ["flexao de braco", "flexao", "flexoes", "push up", "pushup"],
  [
    {
      head: [156, 80], neck: [143, 90], hip: [97, 124],
      arms: [[[138, 130], [135, 172]], [[144, 132], [141, 174]]],
      legs: [[[64, 148], [36, 170]], [[68, 150], [40, 172]]],
    },
    {
      head: [150, 124], neck: [136, 134], hip: [92, 148],
      arms: [[[152, 156], [135, 172]], [[158, 158], [141, 174]]],
      legs: [[[62, 162], [36, 172]], [[66, 164], [40, 174]]],
    },
  ],
  1.6
);

// ── Abdominal supra / crunch (deitado, joelhos dobrados) ──
register(
  ["abdominal supra", "abdominal", "crunch"],
  [
    {
      head: [34, 146], neck: [49, 153], hip: [106, 158],
      arms: [[[54, 136], [40, 130]], [[58, 138], [44, 132]]],
      legs: [[[132, 124], [150, 168]], [[136, 126], [154, 170]]],
    },
    {
      head: [56, 122], neck: [66, 134], hip: [106, 158],
      arms: [[[72, 114], [58, 106]], [[76, 116], [62, 108]]],
      legs: [[[132, 124], [150, 168]], [[136, 126], [154, 170]]],
    },
  ],
  1.5
);

// ── Mountain climber (prancha, joelhos alternados) ──
register(
  ["mountain climber", "mountain climbers", "escalador"],
  [
    {
      head: [156, 80], neck: [143, 90], hip: [97, 124],
      arms: [[[138, 130], [135, 172]], [[144, 132], [141, 174]]],
      legs: [[[108, 146], [100, 168]], [[62, 148], [34, 170]]],
    },
    {
      head: [156, 80], neck: [143, 90], hip: [97, 124],
      arms: [[[138, 130], [135, 172]], [[144, 132], [141, 174]]],
      legs: [[[62, 148], [34, 170]], [[108, 146], [100, 168]]],
    },
  ],
  0.9
);

// ── Elevação de pernas (deitado, pernas sobem até 90°) ──
register(
  ["elevacao de pernas"],
  [
    {
      head: [34, 152], neck: [50, 157], hip: [102, 160],
      arms: [[[68, 164], [86, 166]], [[72, 166], [90, 168]]],
      legs: [[[134, 160], [166, 158]], [[136, 162], [168, 160]]],
    },
    {
      head: [34, 152], neck: [50, 157], hip: [102, 160],
      arms: [[[68, 164], [86, 166]], [[72, 166], [90, 168]]],
      legs: [[[106, 118], [112, 82]], [[110, 120], [116, 84]]],
    },
  ],
  1.8
);

// ── Elevação pélvica / ponte de glúteo ──
register(
  ["elevacao pelvica", "ponte", "ponte de gluteo", "glute bridge"],
  [
    {
      head: [32, 152], neck: [47, 156], hip: [102, 160],
      arms: [[[64, 166], [82, 168]], [[68, 168], [86, 170]]],
      legs: [[[126, 128], [142, 172]], [[130, 130], [146, 174]]],
    },
    {
      head: [32, 152], neck: [47, 154], hip: [104, 126],
      arms: [[[64, 166], [82, 168]], [[68, 168], [86, 170]]],
      legs: [[[126, 124], [142, 172]], [[130, 126], [146, 174]]],
    },
  ],
  1.5
);
