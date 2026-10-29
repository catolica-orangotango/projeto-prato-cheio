# Documento de Projeto — Prato Cheio

*Trabalho 2 · Entrega 2 · branch `entrega-2`*

**Grupo:** Gustavo Vinicius Taques, João Pedro Angélico, Luis Fernando Pereira, Vynicyus Candido

## Estado da entrega

- Histórias 1 a 5 implementadas e testadas (42 testes, `npm test`). Nesta iteração entraram as histórias 3, 4 e 5.
- O banco **continua SQLite** (`node:sqlite`, `src/db.js`). A migração para PostgreSQL está decidida no [ADR 0001](adr/0001-banco-de-dados-sqlite-para-postgresql.md), mas **ainda não foi implementada** (Unidade 3). As decisões abaixo foram escritas para que essa troca fique contida em `src/db.js` e `src/repositorio.js`.
- A validação da interface (`public/index.html`) foi manual. A suíte automatizada cobre só a API.

## Histórias implementadas

| # | História | Critérios | Rota | Testes (erros incluídos) |
|---|---|---|---|---|
| 3 | **Entregador** confirma a retirada de uma doação aceita | CA 3.1–3.4 | `POST /api/doacoes/:id/coletar`, `GET /api/doacoes/aceitas` | 6: coleta registra `coletada_em`; recusa doação disponível, coleta dupla e id inexistente |
| 4 | **Coordenador** vê quantas doações a ONG coletou num período | CA 4.1–4.5 ([ADR 0004](adr/0004-hu4-conta-doacoes-coletadas.md)) | `GET /api/relatorios/coletas` | 11: intervalo inclusivo, zero sem erro, isolamento por ONG, aceitas não contam; recusa ONG ausente, data inválida/inexistente e início > fim |
| 5 | **Vigilância** consulta o que a ONG coletou, com a validade e o aviso de vencida | CA 5.1–5.5 ([ADR 0005](adr/0005-hu5-estoque-e-doacoes-coletadas.md)) | `GET /api/relatorios/estoque` | 6: ordenação por validade, vencida marcada, só a ONG consultada, lista vazia; recusa ONG ausente |

As histórias 1 e 2 (publicar e aceitar, Unidade 1) seguem na mesma suíte. Os critérios completos estão em [analise.md](analise.md).

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise | Registro |
|---|---|---|---|---|
| D1 | Migrar de SQLite para **PostgreSQL** (planejado, não implementado) | Manter SQLite · MySQL/MariaDB | RN3 (aceite concorrente); risco de fuso; crescimento além do bairro | [ADR 0001](adr/0001-banco-de-dados-sqlite-para-postgresql.md), revisão no [0002](adr/0002-revisao-banco-multicidade.md) |
| D2 | A **história 4 conta coletadas**, não aceitas | Manter critério da aula (aceitas) · devolver os dois números | Objetivo 2 ("doações coletadas por semana") | [ADR 0004](adr/0004-hu4-conta-doacoes-coletadas.md) |
| D3 | A **história 5 é fatiada**: "estoque" = o que a ONG coletou, com a vencida à vista | Construir estoque real (baixa, perecível, login) · listar só o que está na validade | Falha de INVEST da H5; rastreabilidade mínima (CA 1.3, RN1) | [ADR 0005](adr/0005-hu5-estoque-e-doacoes-coletadas.md) |
| D4 | **Trava no próprio SQL** para aceitar e coletar (`UPDATE ... WHERE status = ... RETURNING`) | Ler e depois gravar (check-then-act) · lock na aplicação | RN3: uma doação, uma ONG | comentários em `src/repositorio.js`; sem ADR próprio |
| D5 | **Camadas** `app.js` → `doacoes.js` (regras) → `repositorio.js` (SQL) → `db.js` (conexão), SQL direto sem ORM | SQL nas rotas · ORM | Stakeholder "equipe": fácil de trocar de banco; testável | `src/`; sem ADR próprio |
| D6 | A **interface envia a quantidade como digitada**; a RN1 é validada só no servidor | Converter só quando preenchido · validar também na tela | CA 1.2 (informar o motivo da recusa); RN1 | [ADR 0006](adr/0006-interface-envia-quantidade-sem-converter.md) |
| D7 | **Playwright** para testes de fluxo pela interface, em `tests/e2e/`, fora do `npm test` (proposto, não implementado) | Cypress · Puppeteer · Selenium · só testes de API | Critérios de aceite das histórias 1 a 5 vistos pela tela; entregador no celular | [ADR 0007](adr/0007-playwright-para-testes-de-fluxo.md) |

## Trade-offs de uma decisão em detalhe (D1)

| Critério | SQLite (hoje) | PostgreSQL (decidido) |
|---|---|---|
| Escritas simultâneas | Uma por vez (lock de arquivo) | Concorrência por linha (MVCC) |
| Trava do aceite (`UPDATE ... RETURNING`) | Funciona, por serialização | Funciona sob `READ COMMITTED` |
| Várias instâncias da aplicação | Não (arquivo local) | Sim (banco em rede) |
| Data e fuso | `TEXT` e `date('now')` em UTC | `date` e `timestamptz` |
| Operação e custo | Nenhum servidor, nenhum custo | Contêiner ou serviço gerenciado; pool de conexões |
| Testes | Em memória, rápidos | Dependem de um serviço no CI |
| Reescrita | Nenhuma | `AUTOINCREMENT`, `datetime('now')`, `?` → `$1` |

Escolhemos PostgreSQL pelo crescimento previsto (ADR 0002) e adiamos a implementação para a Unidade 3, quando o custo de infraestrutura é assumido junto com a refatoração.

## Requisitos não funcionais

| RNF | Como afeta o design |
|---|---|
| **Integridade sob concorrência** (duas ONGs aceitando a mesma doação; duas confirmações da mesma retirada) | Leva a D4: a garantia fica no `WHERE` do `UPDATE`, não em uma leitura anterior. Sustenta também a escolha do PostgreSQL (D1), que mantém a garantia com várias instâncias. |
| **Portabilidade do banco** (o piloto roda em SQLite; o destino é PostgreSQL) | Leva a D5: todo SQL fica em `repositorio.js`, `query()` devolve `{ rows }` em `db.js`, e o `COUNT(*)` já passa por `Number(...)` porque o PostgreSQL o entrega como texto. |
| **Correção das datas** (validade, `coletada_em`, vencida) | Hoje tudo é UTC (`datetime('now')`, `hoje()`). A limitação está declarada nos ADRs 0004 e 0005; a correção (`timestamptz` e o fuso da cidade) fica atrelada à migração (D1). |

## Diagramas

Reaproveitados da atividade anterior, em `docs/diagramas/`: casos de uso (`final/vf-ia1.puml`) e classes (`final/vf-ia2.puml`).

## ADRs

Ver `docs/adr/`.

- [0001](adr/0001-banco-de-dados-sqlite-para-postgresql.md) — SQLite para PostgreSQL (obrigatório).
- [0004](adr/0004-hu4-conta-doacoes-coletadas.md) — História 4 conta coletadas.
- [0005](adr/0005-hu5-estoque-e-doacoes-coletadas.md) — História 5 fatiada.
- [0006](adr/0006-interface-envia-quantidade-sem-converter.md) — Interface envia a quantidade sem converter.
- [0007](adr/0007-playwright-para-testes-de-fluxo.md) — Playwright para testes de fluxo (proposto).
- [0002](adr/0002-revisao-banco-multicidade.md) e [0003](adr/0003-reescrita-adr-postgresql-banco-melhor.md) — revisão do 0001 para o cenário multicidade e reescrita de um registro fraco (atividades de aula).

## Critérios de validação do projeto

| Requisito | Critério mensurável | Como verificamos |
|---|---|---|
| Funcionalidades | CA 3.1–3.4, 4.1–4.5 e 5.1–5.5 com ao menos um teste cada | `npm test`: 42 testes passando, CI verde em cada PR |
| Integridade | O segundo aceite e a segunda coleta da mesma doação são recusados e mantêm o primeiro registro | Testes de aceite duplo e de coleta dupla |
| Portabilidade | Nenhum SQL fora de `src/repositorio.js` e `src/db.js` | Busca por `SELECT`/`UPDATE` no restante de `src/` |
| Correção das datas | Intervalo inclusivo nos dois extremos; datas inexistentes recusadas | Testes de período e de formato |
| Interface | Aceite recusado, retirada recusada e publicação inválida mostram o motivo | Teste manual com duas abas (issue #25, corrigida no PR #29). **Não automatizado.** |

## Uso de IA

Nível: **IA como colaboradora**. Usamos o Claude Code para rascunhar os ADRs 0001 a 0003 e para apoiar os diagramas (versões da IA e correções em `docs/diagramas/ENTREGA.txt`). O grupo conferiu cada ADR contra o código e rodou `npm test` antes de integrar. Os PRs passaram por revisão de outro integrante e pelo CI. O grupo responde pelas decisões e pelo código.
