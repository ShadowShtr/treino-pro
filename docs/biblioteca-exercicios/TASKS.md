# Tasks — Biblioteca de Exercícios

Plano de implementação executado para a feature, task por task. Cada task lista
objetivo, arquivos, o que foi feito e os critérios de aceitação usados para
considerá-la concluída. Útil como referência para manutenção e para replicar o
processo em features futuras.

Legenda: ✅ concluída

---

## T1 — Camada de dados (`exerciseLibrary.ts`) ✅

**Objetivo:** dar a cada um dos ~120 exercícios do catálogo uma ficha completa:
músculos, equipamento, dificuldade, instruções passo a passo em PT-BR, dicas e
as 2 fotos do movimento.

**Arquivos:** `src/data/exerciseLibrary.ts` (novo)

**O que foi feito:**
- Tipo `ExerciseInfo` com `group`, `primaryMuscles`, `secondaryMuscles?`,
  `equipment`, `difficulty`, `instructions[]`, `tips?[]`, `images?: [string, string]`.
- Mapeamento manual de cada nome PT-BR para o ID correspondente no
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (ex.: `"Supino reto"` → `Barbell_Bench_Press_-_Medium_Grip`).
- Instruções e dicas escritas à mão em PT-BR (3-4 passos + 1-2 dicas por exercício),
  com atenção a erros comuns de execução.
- Helper `img(id)` que monta o par de URLs do CDN jsDelivr.
- `GROUP_COLORS` e `getExerciseGroup` movidos de `TrainingPage.tsx` para cá
  (passaram a ser usados por 3 componentes — evita duplicação).

**Critérios de aceitação:**
- [x] Todos os nomes de `exercises.ts` têm entrada na biblioteca.
- [x] Todos os IDs de imagem validados contra o `dist/exercises.json` oficial
      (107 IDs únicos, todos com ≥ 2 fotos). URL do CDN testada (HTTP 200).
- [x] Exercícios sem equivalente (Cardio em geral, Serrátil, Hollow body) ficam
      sem `images` mas com instruções completas.

---

## T2 — Componente `ExerciseAnimation` ✅

**Objetivo:** simular um GIF do movimento alternando as 2 fotos (posição
inicial/final) com crossfade — leve, bonito e resiliente a falhas.

**Arquivos:** `src/components/ExerciseAnimation.tsx` (novo)

**O que foi feito:**
- Modo `full`: as duas `<img>` sobrepostas, opacidade alternada a cada 1,1s com
  `transition-opacity`; tap pausa/retoma; 2 dots indicam o quadro atual; badge
  "Pausado" quando parado.
- Modos estáticos `card` (4:3, para grades) e `thumb` (56px, para listas) que
  mostram só a 1ª foto — decisão de performance: a grade da biblioteca pode
  renderizar 120 cards.
- Skeleton `animate-pulse` enquanto carrega; a animação só começa quando as
  DUAS fotos terminam de carregar (evita piscar).
- `onError` → fallback com ícone de halter (também usado quando não há fotos).
- Fundo branco via inline style — imune ao override de `.bg-white` do tema escuro
  (as fotos têm fundo branco e precisam de "moldura" branca nos dois temas).

**Critérios de aceitação:**
- [x] Anima suavemente após carregar; sem flash de imagem quebrada.
- [x] Offline/CDN fora → fallback elegante, nada quebra.
- [x] Visual coerente nos temas claro e escuro.

---

## T3 — Modal de detalhe (`ExerciseDetailModal`) ✅

**Objetivo:** a tela "como fazer" — o coração da feature.

**Arquivos:** `src/components/ExerciseDetailModal.tsx` (novo)

**O que foi feito:**
- Layout (de cima para baixo): animação grande → chips (grupo muscular com a cor
  já usada no app, dificuldade, equipamento) → músculos primários (chip colorido)
  e secundários (chip neutro) → passos numerados com círculos laranja → seção de
  dicas com ícone de lâmpada.
- Prop opcional `onAdd` → botão "Adicionar ao treino" (usado quando aberto pela
  Biblioteca).
- Exercício personalizado (fora da biblioteca) → `Empty` amigável em vez de erro.
- Reutiliza o `Modal` existente de `Ui.tsx` — zero CSS novo.

**Critérios de aceitação:**
- [x] Abre por nome a partir de qualquer lugar do app.
- [x] Não quebra com exercício custom.
- [x] Tipografia/cores idênticas ao restante do app.

---

## T4 — Biblioteca navegável (`ExerciseLibraryModal`) ✅

**Objetivo:** navegação livre tipo Lyfta: filtrar por músculo, buscar, explorar.

**Arquivos:** `src/components/ExerciseLibraryModal.tsx` (novo)

**O que foi feito:**
- Header fixo (prop `stickyTop` do `Modal`): busca com normalização de acentos
  ("biceps" encontra "Bíceps") + fileira horizontal rolável de chips de grupos,
  cada chip com a cor do grupo; o ativo fica laranja.
- Grade de 2 colunas: foto estática (`size="card"`, lazy), nome e músculos primários.
- Tap no card → `ExerciseDetailModal`; com `onAdd`, dá para adicionar ao treino
  do dia direto dali (com toast de confirmação).
- Nomes duplicados entre grupos (ex.: "Agachamento sumô" em Pernas e Glúteos)
  são deduplicados na visão "Todos".

**Critérios de aceitação:**
- [x] Filtro + busca combinam corretamente.
- [x] Rolagem fluida (imagens lazy, sem animação na grade).
- [x] Estado vazio para busca sem resultados.

---

## T5 — Integração na aba Treino ✅

**Objetivo:** colocar a feature onde o usuário está, sem mudar nenhum fluxo existente.

**Arquivos:** `src/pages/TrainingPage.tsx` (editado)

**O que foi feito:**
- Botão 📖 (Biblioteca) no header da página, ao lado dos botões existentes.
- Card de exercício expandido: atalho "Como fazer" com miniatura da foto,
  descrição e ícone — abre o modal de detalhe.
- Modo compacto: ícone "?" discreto ao lado do lápis.
- **Sessão de treino guiada:** animação em destaque acima da grade de séries +
  botão "Como fazer este exercício" (o `key={exercise.id}` reinicia a animação
  ao trocar de exercício).
- Picker "Adicionar exercício": miniatura da foto em cada linha.
- `GROUP_COLORS`/`getExerciseGroup` agora importados de `exerciseLibrary.ts`.
- Modais carregados com `lazy()` + `Suspense` (mesmo padrão do `ProgressPage`).

**Critérios de aceitação:**
- [x] Nenhum fluxo existente alterado (adicionar/editar/concluir treino intactos).
- [x] Exercícios custom não mostram atalho "Como fazer" no card (não há o que mostrar).
- [x] Haptic feedback nos novos botões (padrão do app).

---

## T6 — Polimento e performance ✅

**Arquivos:** `index.html`, `vite.config.ts`

**O que foi feito:**
- `<link rel="preconnect" href="https://cdn.jsdelivr.net">` no `index.html`.
- Runtime caching no service worker (Workbox): cache `exercise-images`,
  estratégia `CacheFirst`, máx. 300 imagens, 90 dias — fotos já vistas
  funcionam offline.
- Revisão visual nos dois temas.

**Critérios de aceitação:**
- [x] `npm run build` sem erros de TypeScript.
- [x] Bundle principal sem crescimento relevante (dados são texto; modais em chunks separados).

---

## T7 — Documentação ✅

**Arquivos:** `docs/biblioteca-exercicios/README.md`, este arquivo, `README.md` raiz.

---

## T8 — Verificação e entrega ✅

- Build de produção limpo (`tsc -b && vite build`).
- Teste manual no dev server: detalhe, biblioteca, busca, filtros, sessão de
  treino, fallbacks, tema escuro.
- Branch `feature/biblioteca-exercicios` + Pull Request.
