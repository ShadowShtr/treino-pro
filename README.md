# Travizani Fitness

PWA mobile-first para controle pessoal de alimentacao, peso, medidas, agua e treinos. O layout usa fundo claro, cards brancos e destaque laranja `#FC4C02`. O app funciona sem login usando `localStorage`; quando Supabase estiver configurado e o usuario entrar com e-mail/senha, os dados tambem podem sincronizar com a nuvem.

## Funcionalidades

- Onboarding com perfil, objetivo, atividade e medidas corporais.
- Uso progressivo: apenas idade, sexo, altura, peso atual, objetivo e atividade sao essenciais para comecar; peso desejado, biotipo e medidas podem ser completados depois.
- Metas diarias calculadas a partir de TMB, gasto diario, objetivo e peso corporal.
- Tres refeicoes por dia, alimentos internos e personalizados, creatina e agua diaria.
- Treinos semanais com series, repeticoes, carga opcional, observacao, reordenacao e copia entre dias.
- Registo rapido de series executadas na sessao e temporizador simples de descanso.
- Evolucao com graficos, calendario mensal e relatorio PDF.
- PWA instalavel, com suporte offline apos a primeira abertura.
- Sincronizacao opcional com Supabase Auth e tabela `user_app_data`.

## Calculos

As formulas estao centralizadas e documentadas em `src/lib/fitnessFormulas.ts`.

- TMB: equacao de Mifflin-St Jeor.
- Gasto diario: TMB multiplicada pelo fator de atividade.
- Meta calorica: manutencao `100%`, ganho controlado `110%`, perda controlada `85%`, recomposicao `95%` do gasto diario.
- Proteina: `1.8`, `2.0` ou `2.2 g/kg`, conforme o objetivo.
- Gordura: `0.8 g/kg`; caso os carboidratos fiquem negativos, a gordura e recalculada com minimo de `0.6 g/kg`.
- Carboidratos: calorias restantes depois de proteina e gordura.
- Agua: `35 ml/kg`, com `+500 ml` em dias com treino concluido.

Os valores sao estimativas para acompanhamento e devem ser ajustados pela evolucao de peso, medidas e desempenho.

## Regra de desenvolvimento: dados corporais progressivos

O app nao deve bloquear o utilizador por falta de dados corporais opcionais. Dados como peso desejado, cintura, abdomen, peito, braco, antebraco, coxa, panturrilha, gluteo, pescoco, percentual de gordura, biotipo e medidas mensais completas podem ser preenchidos depois.

Quando um dado opcional estiver ausente, a interface deve mostrar `pendente` ou `nao informado`, nunca `0` como se fosse um resultado real. Sempre que o utilizador adicionar ou alterar dados corporais, os resumos devem recalcular automaticamente IMC, cintura/altura quando houver cintura, TMB, gasto diario, calorias, macros, agua e o texto final.

Backups JSON devem preservar dados parciais e a importacao deve aceitar perfis incompletos sem quebrar o app.

## Supabase e sincronizacao

O app usa `localStorage` como cache local e continua funcionando sem Supabase ou sem login. Com login ativo, o estado completo do app e salvo na tabela `user_app_data`, no campo `data`.

Tabela esperada:

```text
user_app_data
- user_id
- data
- updated_at
```

Variaveis de ambiente usadas pelo Vite:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Crie um ficheiro `.env.local` para uso local e nao envie `.env` ou `.env.local` para o GitHub. Na Vercel, configure essas variaveis em `Project Settings > Environment Variables`.

Fluxo de dados:

- Sem login: dados guardados apenas neste dispositivo.
- Com login: o app salva primeiro no `localStorage` e tenta sincronizar com Supabase.
- Se a sincronizacao falhar, o status fica como `Pendente de sincronizacao`.
- Ao importar backup JSON, os dados continuam compativeis e tambem sincronizam se houver login.
- Ao entrar numa conta, o usuario pode enviar os dados locais para a nuvem, usar os dados da nuvem ou exportar backup antes.

## Executar no computador

Instale Node.js LTS e execute na pasta do projeto:

```powershell
npm install
npm run dev
```

Para gerar e testar a versao PWA local:

```powershell
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Abra no computador:

```text
http://localhost:4173
```

Para abrir no iPhone na mesma rede Wi-Fi, descubra o IP do computador com `ipconfig` e abra no Safari:

```text
http://IP-DO-COMPUTADOR:4173
```

Esse endereco local serve para testes. Para instalacao PWA completa e uso continuo no iPhone, publique em HTTPS.

## Publicar na Vercel

A forma mais direta de obter HTTPS e publicar na Vercel:

1. Crie uma conta em [vercel.com](https://vercel.com).
2. Envie esta pasta para um repositorio no GitHub.
3. Na Vercel, escolha `Add New > Project` e importe o repositorio.
4. A Vercel deteta o Vite automaticamente. Confirme `Build Command: npm run build` e `Output Directory: dist`.
5. Conclua o deploy e abra o link HTTPS gerado.

## Instalar no iPhone

1. Abra o link HTTPS da Vercel no Safari do iPhone.
2. Toque em `Partilhar`.
3. Toque em `Adicionar ao ecra principal`.
4. Abra o icone `Travizani Fitness`.

Os registos ficam apenas nesse navegador/dispositivo. Use `Perfil > Exportar backup JSON` periodicamente e importe esse ficheiro ao mudar de aparelho.

## Instalar no Android

1. Abra o link HTTPS da Vercel no Chrome Android.
2. Aguarde a primeira abertura carregar completamente.
3. Toque no menu de tres pontos do Chrome.
4. Toque em `Adicionar ao ecra principal` ou `Instalar app`.
5. Confirme o nome `Travizani Fitness`.
6. Abra pelo icone instalado.

Para o Chrome Android mostrar a instalacao, o app precisa estar em HTTPS, ter manifest valido, icones 192x192 e 512x512, service worker ativo e `display: standalone`.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- `vite-plugin-pwa`
- `localStorage`
- Supabase
- Recharts e jsPDF
