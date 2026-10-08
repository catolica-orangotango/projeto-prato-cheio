# ADR 0003 — Reescrita do registro "PostgreSQL porque é um banco melhor"

- **Data:** 2026-10-07
- **Status:** aceito (versão reescrita; versão completa em [ADR 0001](0001-banco-de-dados-sqlite-para-postgresql.md))

## Registro original
> "Decidimos utilizar PostgreSQL porque é um banco melhor."

**Por que ele é insuficiente:**
- Não diz qual problema existia (sem contexto).
- "Melhor" não é um critério: melhor em quê, para quem, em que situação?
- Não cita nenhuma alternativa, então não dá para saber o que foi descartado.
- Não registra o que se perde (custo, complexidade), então a decisão parece gratuita.
- Quem ler daqui a um ano não consegue saber quando revisá-la.

## Contexto
O Prato Cheio permite que duas ONGs tentem aceitar a mesma doação ao mesmo tempo, e a regra RN3 diz que uma doação vai para uma só ONG. Com SQLite, essa garantia depende do lock de arquivo, que serializa todas as escritas e prende o banco a um único disco e a uma única instância da aplicação. O projeto precisa crescer para mais de um processo e mais de uma ONG escrevendo ao mesmo tempo, e o CI deve rodar o mesmo motor da produção.

## Alternativas consideradas
1. **SQLite** — simples e sem servidor, mas escrita serializada e arquivo local; não serve a mais de uma instância.
2. **PostgreSQL** — escritas concorrentes por linha, `UPDATE ... RETURNING` como trava do aceite, tipos de data com fuso, constraints; custo: precisar de um servidor e reescrever parte do SQL.
3. **MySQL** — também concorrente, mas sem `RETURNING`, e fora do caminho já previsto no CI.

## Decisão
Usar **PostgreSQL** porque o aceite concorrente de doações precisa continuar correto com várias instâncias e escritores simultâneos, e porque desenvolvimento, CI e produção devem usar o mesmo motor. Não porque seja "melhor" em geral: para um único processo local, o SQLite seria a escolha mais barata.

## Consequências
- **Positivas:** aceite duplo continua impossível sem lock de arquivo; mesmo motor em todos os ambientes; base para `timestamptz` e constraints.
- **Negativas:** exige Docker ou serviço gerenciado; testes mais lentos; SQL do schema e marcadores `?` → `$1` precisam ser reescritos.
- **Riscos:** diferenças de comportamento entre motores; mitigado rodando a suíte de testes antes e depois da migração.

## Rastreabilidade
- RN3 e o risco de aceite duplo em `docs/analise.md`.
- Detalhamento completo e comparação com MySQL: ADR 0001. Revisão para o cenário multicidade: [ADR 0002](0002-revisao-banco-multicidade.md).
