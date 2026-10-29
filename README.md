# Prato Cheio

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

**Documentação:** fica em [`docs/`](docs/). Comece pela [análise](docs/analise.md) e pelo [projeto](docs/projeto.md); o mapa completo está na seção [Documentação](#documentação).

## Integrantes
- Gustavo Vinicius Taques (@gustavotaques)
- João Pedro Angélico (@joaopedroangelico)
- Luis Fernando Pereira (@Luis-Fernando-Pereira)
- Vynicyus Candido (@VynicyusCandido)

## Como rodar

Requisito: **Node.js 22.13 ou superior**. Mais nada — o banco da Unidade 1 é SQLite, embutido no próprio Node.

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README e banco relacional migrado para PostgreSQL na Unidade 3.

```bash
npm install       # só na primeira vez
npm run db:migrar # cria o schema (arquivo dados.sqlite)
npm start         # sobe em http://localhost:3000
npm test          # roda os testes de API e regras (detalhes abaixo)
npm run dev       # sobe recarregando a cada alteração
```

> **Atenção:** não deixe o repositório dentro de uma pasta sincronizada (OneDrive, Google Drive, Dropbox) nem em disco de rede. O SQLite precisa de trava de arquivo e nesses lugares falha com `disk I/O error`. Clone em uma pasta local comum, por exemplo `~/dev/`.

## Como rodar os testes

São dois tipos de teste, os dois com **Node.js 22.13 ou superior** (com nvm: `nvm use 22`). Nenhum deles toca o `dados.sqlite`: todos usam SQLite **em memória**.

### Testes de API e regras de negócio (Vitest)

Ficam em `tests/*.test.js` e chamam as rotas e as regras direto, sem navegador.

```bash
npm test                 # roda todos, em segundos
npm run test:cobertura   # o mesmo, com relatório em coverage/index.html
```

> Ao rodar `npm test` o Node imprime `ExperimentalWarning: SQLite is an experimental feature`.
> É esperado — o módulo embutido `node:sqlite` ainda é marcado como experimental. Não é erro e não reprova o CI.

### Testes de fluxo pela interface (Playwright)

Ficam em `tests/e2e/*.e2e.js`. Abrem o Chromium em tamanho de celular e clicam na tela como o usuário, cobrindo as histórias 1 a 5 ([ADR 0007](docs/adr/0007-playwright-para-testes-de-fluxo.md)). Por usarem navegador, ficam fora do `npm test`.

```bash
npx playwright install chromium   # só na primeira vez: baixa o navegador (~120 MB)
npm run test:e2e                  # roda todos
```

O `npm run test:e2e` sobe sozinho o próprio servidor, na porta 3100, com banco em memória; não precisa rodar `npm start` antes.

```bash
npx playwright test publicar   # só um arquivo (nome parcial serve)
npx playwright test --headed   # mostra o navegador abrindo e clicando
npx playwright test --ui       # modo interativo, passo a passo
npx playwright show-report     # abre o relatório HTML da última execução
```

Quando um teste falha, a screenshot e o trace ficam em `test-results/`. Para ver o trace: `npx playwright show-trace test-results/<pasta-do-teste>/trace.zip`.

### Qualidade de código

```bash
npm run lint             # ESLint: aponta erros comuns no código
npm run formatar         # Prettier: formata src/, tests/ e configs
npm run formatar:checar  # Prettier: só confere, sem alterar
```

O CI (`.github/workflows/ci.yml`) roda lint, formatação, `npm run test:cobertura` e, num job separado, `npm run test:e2e`. O Pull Request só entra com tudo verde.

## Documentação

Toda a documentação do projeto fica na pasta [`docs/`](docs/):

| O quê | Onde |
|---|---|
| **Análise**: stakeholders, histórias de usuário, critérios de aceite (CA), regras de negócio (RN), riscos | [`docs/analise.md`](docs/analise.md) |
| **Projeto**: arquitetura, decisões de projeto (D1, D2…), como cada história foi implementada e testada | [`docs/projeto.md`](docs/projeto.md) |
| **ADRs**: cada decisão arquitetural com contexto, alternativas e consequências (modelo em `0000`) | [`docs/adr/`](docs/adr/) |
| **Diagramas UML**: versão gerada pela IA, versão final e correções | [`docs/diagramas/`](docs/diagramas/) |
| **Retrospectivas** de cada iteração | [`docs/retrospectivas/`](docs/retrospectivas/) |
| **Atividades de aula** | [`docs/atividades/`](docs/atividades/) |

## O banco: SQLite agora, PostgreSQL depois

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | **SQLite** (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL** (após refatorar) | um PostgreSQL acessível — o caminho é escolha do grupo |

A troca não é acidente de percurso: na Unidade 2 vocês registram a decisão em um **ADR** (alternativas, consequências, riscos) e na Unidade 3 executam a **refatoração** — com os testes existentes provando que o comportamento se manteve.

O `src/db.js` foi desenhado para isso: ele expõe `query()` devolvendo `{ rows }`, então a troca do banco fica contida nele e não vaza para as regras de negócio.

**Como o PostgreSQL vai subir é decisão do grupo**, comparada no mesmo ADR: instalar o PostgreSQL na máquina, subir um contêiner, ou usar um serviço gerenciado gratuito (Neon, Supabase, Render). A disciplina não impõe o caminho — exige o banco alcançável por `DATABASE_URL`, o schema migrado e o CI verde. Cada opção tem custo e risco diferentes, e reconhecê-los é parte da decisão.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão e schema do banco (pronto)
src/app.js           rotas da API
src/doacoes.js       regras de negócio      <- implementar (U1)
src/repositorio.js   acesso ao banco (SQL)  <- implementar (U1)
public/index.html    interface (funciona no celular)
tests/               testes de API e regras (Vitest)
tests/e2e/           testes de fluxo pela interface (Playwright)
docs/                documentação (ver a seção Documentação)
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/diagramas/      diagramas UML: versão da IA, final e correções (N2)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## O que já está pronto e o que falta

Pronto: estrutura do projeto, interface básica, rota de saúde, **conexão com o banco e o schema** (`src/db.js`), CI configurado e um teste passando (prova que a aplicação sobe).

Falta (Trabalho 1 — walking skeleton): implementar `src/doacoes.js` (regras) e
`src/repositorio.js` (SQL) para que a história zero funcione ponta a ponta —
**um doador publica uma doação → uma ONG vê a doação → a ONG a aceita e ela sai da lista.**
Os critérios de aceite estão em `tests/doacoes.test.js` como `it.todo`: troque cada um
por um teste de verdade conforme implementa.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
