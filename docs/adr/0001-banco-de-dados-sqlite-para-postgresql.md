# ADR 0001 — Banco de dados: de SQLite para PostgreSQL

- **Data:** 2026-10-07
- **Status:** aceito (revisado em [ADR 0002](0002-revisao-banco-multicidade.md): decisão mantida)

## Contexto
O Prato Cheio guarda hoje uma única entidade, `doacoes` (`tipo`, `quantidade`, `unidade`, `validade`, `status`, `ong`, `criada_em`), em SQLite pelo módulo embutido `node:sqlite`, com SQL direto e sem ORM (`src/db.js`, `src/repositorio.js`). O arquivo é `dados.sqlite`; nos testes, o banco roda em memória.

Três pontos pesam na escolha:

- **Aceite concorrente (RN3: uma doação, uma ONG).** Duas ONGs podem aceitar a mesma doação ao mesmo tempo. A garantia está em `UPDATE doacoes SET status='aceita', ong=? WHERE id=? AND status='disponivel' RETURNING *`: só a primeira altera a linha. No SQLite isso funciona porque o lock de arquivo serializa todas as escritas, o que é simples, mas faz cada escrita esperar a anterior.
- **Dados de tempo.** `validade` é texto `AAAA-MM-DD` e a lista usa `date('now')`, que é UTC. A análise (`docs/analise.md`) já registra o risco de erro perto da meia-noite.
- **Plano do curso.** O README prevê PostgreSQL na Unidade 3, e `db.js` foi desenhado para que a troca fique contida nele (`query` devolvendo `{ rows }`).

O que pede a decisão: o banco deve continuar adequado quando o sistema sair de um bairro e rodar como serviço, com mais de um processo e mais de uma ONG escrevendo ao mesmo tempo, e com o ambiente de CI e produção iguais ao de desenvolvimento.

## Alternativas consideradas
1. **Manter SQLite**
   - Prós: zero instalação, zero custo, sem servidor, testes em memória rápidos, nada a migrar.
   - Contras: um único escritor por vez (lock de arquivo); o arquivo precisa estar no disco da mesma máquina, então não há mais de uma instância da aplicação com disco compartilhado de forma segura; sem usuários e permissões no banco; backup é cópia de arquivo, que o próprio time precisa lembrar de fazer.
2. **PostgreSQL** (local, em contêiner, ou serviço gerenciado como Neon, Supabase ou Render)
   - Prós: concorrência real com MVCC (escritas em linhas diferentes não se bloqueiam); `UPDATE ... WHERE ... RETURNING` funciona como trava do aceite sob `READ COMMITTED`; tipos `date` e `timestamptz` com fuso; índices, constraints (`CHECK` em `status`) e papéis de acesso; o mesmo banco no dev, CI e produção; o CI já tem o serviço `postgres:16-alpine` previsto, comentado, em `.github/workflows/ci.yml`.
   - Contras: precisa subir um servidor (contêiner ou conta em serviço gerenciado); testes mais lentos e dependentes de infraestrutura; é preciso reescrever o schema e os marcadores de parâmetro; pool de conexões passa a ser nossa responsabilidade.
3. **MySQL / MariaDB**
   - Prós: concorrência por linha (InnoDB); amplamente oferecido por hospedagens.
   - Contras: `RETURNING` só existe no MariaDB, não no MySQL, o que obrigaria a trocar o `UPDATE ... RETURNING` por duas consultas ou outra técnica; o curso e o CI já apontam para PostgreSQL, então ficaríamos sozinhos fora do caminho previsto; ganho técnico sobre o PostgreSQL nesse domínio é nulo.

## Decisão
Adotar **PostgreSQL**, subido em **contêiner** (`postgres:16-alpine`) no desenvolvimento e no CI, acessado com o driver `pg` e SQL direto, sem ORM. A troca fica contida em `src/db.js` e nos marcadores de parâmetro de `src/repositorio.js`.

Por que não as outras:

- **SQLite** é a melhor opção para um bairro com um processo, mas o objetivo do projeto inclui crescer além disso, e a serialização de todas as escritas e o arquivo local são limites estruturais, não de configuração.
- **MySQL/MariaDB** não traz nada que o PostgreSQL não traga, e perde o `RETURNING` (no MySQL), em que o nosso aceite se apoia.
- Manter **SQL direto sem ORM** preserva a interface `query(sql, valores) → { rows }` e o código de regras de negócio intacto; um ORM seria uma segunda decisão, com custo próprio, e não é necessário para uma tabela.

## Consequências
- **Positivas:**
  - Aceite duplo continua impossível, agora sem depender de lock de arquivo.
  - Desenvolvimento, CI e produção usam o mesmo motor, reduzindo "funciona na minha máquina".
  - Abre caminho para `timestamptz`, constraints e índices (ver o risco de fuso na análise).
- **Negativas / o que abrimos mão:**
  - Perdemos o "clonar e rodar": é preciso Docker (ou um banco gerenciado) para desenvolver.
  - Testes deixam de rodar em memória; ficam mais lentos e precisam de limpeza entre casos (`limparBanco`).
  - Há trabalho de migração: `AUTOINCREMENT` vira `GENERATED ... AS IDENTITY` (ou `SERIAL`), `datetime('now')` vira `now()`, `date('now')` vira `current_date`, `?` vira `$1`, `$2`.
- **Riscos e o que fazer se der errado:**
  - `db.js` decide entre leitura e escrita por regex sobre o SQL (`select|with`, `returning`). Com `pg` isso deixa de ser necessário, pois `query` sempre devolve `rows`; remover a regex na migração em vez de portá-la.
  - Comportamento diferente entre motores (por exemplo, comparação de texto de data, que passa a ser `date`). Mitigação: rodar a suíte de testes existente (`tests/doacoes.test.js`) antes e depois, como exige a Refatoração 1 em `docs/refatoracoes.md`.
  - Se o contêiner no CI for instável ou lento, o plano B é um serviço gerenciado com banco de testes separado; a decisão de motor não muda.

## Rastreabilidade
- **RN3** (uma doação, uma ONG) e o risco de aceite duplo em `docs/analise.md`.
- Risco de **fuso horário** da validade em `docs/analise.md` (UTC com `date('now')`).
- Refatoração 1 em `docs/refatoracoes.md` (execução da migração).
