# Biblioteca de Exercícios com Demonstração Visual

> **Em uma frase:** qualquer pessoa que use o app consegue ver **como executar cada exercício** — com animação do movimento, músculos trabalhados, passo a passo e dicas — direto na aba de Treino, sem sair do app.

---

## 1. Motivação

A inspiração veio de apps como o **Lyfta**: ao montar ou executar um treino, o usuário
(principalmente iniciante) muitas vezes não sabe o que é uma "Remada Yates" ou como
posicionar o corpo num "Stiff". Antes desta feature, os exercícios do app eram apenas
nomes (strings) em `src/data/exercises.ts` — sem foto, sem instrução, sem contexto.

Agora cada exercício do catálogo tem uma "carteira de identidade" completa, e o app
ensina a execução em três lugares estratégicos:

1. **No plano do dia** — cada exercício expandido mostra um atalho "Como fazer".
2. **Durante o treino** (sessão guiada) — a animação aparece em destaque, no momento
   em que a pessoa mais precisa dela.
3. **Na Biblioteca** — uma tela de navegação livre (ícone 📖 no topo da aba Treino)
   com busca e filtro por grupo muscular, para explorar e aprender.

## 2. De onde vêm as fotos (e por que não usamos GIFs)

| Decisão | Escolha | Por quê |
|---|---|---|
| Fonte das imagens | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) | ~870 exercícios fotografados, licença **Unlicense (domínio público)** — uso livre, sem custo, sem API key. As ilustrações de apps comerciais (Lyfta, MuscleWiki) são protegidas por direitos autorais. |
| Entrega das imagens | CDN jsDelivr (hot-link) | **Zero peso no bundle e no repositório.** O app só guarda URLs; as fotos carregam sob demanda e ficam no cache do navegador + cache do service worker. |
| "GIF" do movimento | Crossfade entre as 2 fotos (posição inicial → final) | GIFs reais teriam licença restritiva/custo de API e pesariam megabytes. O crossfade a cada ~1,1s comunica o movimento com 2 JPEGs de ~70 KB. |
| Idioma | Instruções escritas à mão em PT-BR | Tradução automática do inglês ficaria robótica. Cada passo foi escrito no tom do app. |

### Anatomia de uma URL de imagem

```
https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/<ID>/0.jpg   ← posição inicial
https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/<ID>/1.jpg   ← posição final
```

Onde `<ID>` é o identificador do exercício no free-exercise-db
(ex.: `Barbell_Bench_Press_-_Medium_Grip`). Todos os IDs usados foram validados
contra o `dist/exercises.json` oficial do projeto.

## 3. Arquitetura

```
src/
├── data/
│   ├── exercises.ts            (já existia) nomes PT-BR por grupo — fonte da verdade dos NOMES
│   └── exerciseLibrary.ts      🆕 dados instrutivos de cada exercício, indexados pelo nome
│
├── components/
│   ├── ExerciseAnimation.tsx   🆕 "GIF" de 2 quadros (full) / foto estática (card, thumb)
│   ├── ExerciseDetailModal.tsx 🆕 modal "como fazer": animação + músculos + passos + dicas
│   └── ExerciseLibraryModal.tsx🆕 navegação tipo Lyfta: chips de grupo + busca + grade
│
└── pages/
    └── TrainingPage.tsx        (editado) integra os três pontos de entrada
```

### Fluxo de dados

```
exercises.ts (nomes)  ──────────────┐
                                    ├──>  TrainingPage / Picker / Biblioteca
exerciseLibrary.ts (como fazer) ────┘            │
        │                                        ▼
        │   getExerciseInfo(nome) ──> ExerciseDetailModal
        │                                        │
        └── images: [url0, url1] ──> ExerciseAnimation (crossfade)
```

A chave de `exerciseLibrary` é **exatamente** o nome do exercício em `exercises.ts`.
Nenhuma migração de dados foi necessária: `WorkoutExercise` continua referenciando o
exercício só pelo `name`. Exercícios personalizados (criados pelo usuário) simplesmente
não existem na biblioteca e a UI mostra um estado vazio amigável.

### O componente `ExerciseAnimation`

Três tamanhos, três comportamentos (escolhidos por custo de rede):

| `size` | Comportamento | Onde é usado |
|---|---|---|
| `full` | Anima: alterna as 2 fotos com crossfade a cada 1,1s; tap pausa/retoma; dots indicam o quadro | Modal de detalhe, sessão de treino |
| `card` | Estático: só a 1ª foto, proporção 4:3, `loading="lazy"` | Cards da Biblioteca (evita carregar 240 imagens animadas de uma vez) |
| `thumb` | Estático: miniatura quadrada 56px | Picker de exercícios, atalho "Como fazer" |

Estados cobertos: **skeleton** com `animate-pulse` enquanto carrega, **fallback** com
ícone de halter se a imagem falhar (offline/CDN fora) ou se o exercício não tiver foto,
e **fundo branco forçado** via inline style (as fotos têm fundo branco; no tema escuro o
container continua branco de propósito, como uma "moldura de foto").

## 4. Performance — por que o app continua leve

- **Nenhuma imagem no bundle/repo** — só URLs (texto).
- `exerciseLibrary.ts` é texto puro (~60 KB, ~12 KB gzip) e entra no chunk da página de treino.
- Os modais de Biblioteca e Detalhe são `lazy()` — código só baixa quando abrem.
- Imagens com `loading="lazy"` + `decoding="async"` — só baixam quando visíveis.
- `<link rel="preconnect">` para `cdn.jsdelivr.net` no `index.html` — corta a latência do primeiro carregamento.
- **Service worker** (`vite.config.ts`): cache `CacheFirst` chamado `exercise-images`
  (máx. 300 entradas, 90 dias) — fotos já vistas funcionam **offline**.

## 5. Como adicionar um exercício novo à biblioteca

1. Adicione o nome em `src/data/exercises.ts` no grupo certo (se ainda não existir).
2. Procure o exercício equivalente no free-exercise-db:
   abra `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`
   e busque pelo nome em inglês (ex.: "lat pulldown"). Copie o campo `id`.
3. Confira a foto no navegador: `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/<ID>/0.jpg`.
4. Adicione a entrada em `src/data/exerciseLibrary.ts`, usando o helper `img(<ID>)`:

```ts
"Nome exato do exercício": {
  group: "Costas",
  primaryMuscles: ["Dorsal"],
  secondaryMuscles: ["Bíceps"],
  equipment: "Polia",
  difficulty: "iniciante",
  instructions: ["Passo 1…", "Passo 2…", "Passo 3…"],
  tips: ["Dica de técnica…"],
  images: img("Wide-Grip_Lat_Pulldown"),
},
```

5. Sem foto equivalente? Omita `images` — o app mostra o fallback e as instruções
   continuam aparecendo (vários exercícios de Cardio funcionam assim).

## 6. Limitações conhecidas e possíveis evoluções

- Algumas correspondências PT→EN são aproximadas (ex.: "Remada cavalinho" usa a foto
  de *T-Bar Row with Handle*). A instrução escrita compensa a diferença.
- 13 exercícios não têm foto (Serrátil, Hollow body, Burpee, Jump, Polichinelo, HIIT,
  Circuito etc.) — mostram fallback + instruções.
- Evoluções naturais: vídeos curtos, destaque dos músculos num SVG de corpo humano,
  favoritos na biblioteca, histórico de carga por exercício no modal de detalhe.

## 7. Créditos

- Fotos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense / domínio público).
- Inspiração de UX: Lyfta (apenas referência visual — nenhum asset foi copiado).
