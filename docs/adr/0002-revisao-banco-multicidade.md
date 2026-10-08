# ADR 0002 — Revisão da escolha do banco diante da expansão multicidade

- **Data:** 2026-10-07
- **Status:** aceito
- **Revisa:** [ADR 0001](0001-banco-de-dados-sqlite-para-postgresql.md) — que permanece como registro histórico, sem alterações no texto da decisão.
- **Resultado da revisão:** decisão do 0001 **mantida** (PostgreSQL), com escopo ampliado.

## Contexto
O ADR 0001 foi tomado para um único bairro, com uma entidade (`doacoes`) e poucos acessos simultâneos. A premissa mudou: o Prato Cheio será usado por ONGs e doadores de **várias cidades**, com **acessos simultâneos** e **maior volume** de doações.

A pergunta da revisão: as premissas que sustentaram o 0001 ainda valem, e alguma delas inverte a escolha?

## Alternativas consideradas
1. **Manter PostgreSQL (decisão do 0001)** em uma instância única, com ajustes de modelo e operação.
   - Prós: o cenário novo é exatamente o que o PostgreSQL resolve; nada a refazer; uma instância bem dimensionada atende a milhares de escritas por segundo, muito acima de um app de doações.
   - Contras: instância única é ponto único de falha; exige pool, índices e backups desde já.
2. **Voltar ao SQLite** (por simplicidade).
   - Prós: continua sendo o mais simples de operar.
   - Contras: escrita serializada, arquivo local e uma instância da aplicação; várias cidades com picos simultâneos (ex.: fim de dia, feiras) formariam fila de escrita e erros `database is locked`. O contexto novo invalida a premissa de que ele bastava.
3. **Banco distribuído / uma base por cidade** (sharding desde o início).
   - Prós: isola cidades; escala horizontal.
   - Contras: complexidade operacional alta para um volume que não justifica; consultas entre cidades (doador que atende mais de uma) ficam difíceis. Prematuro.

## Decisão
**Manter o PostgreSQL** e ampliar o escopo da decisão com cinco ajustes, em vez de trocar de motor:

1. **Serviço gerenciado em produção** (Neon, Supabase ou Render), com backup automático; o contêiner fica só para dev e CI.
2. **Pool de conexões** no `src/db.js` (`pg.Pool`), com limite coerente com o plano contratado.
3. **Cidade como dado do modelo**, não como base separada: coluna `cidade_id` em `doacoes`, com índice composto, por exemplo `(cidade_id, status, validade)`, que serve a consulta da lista (RN2).
4. **Tempo com fuso:** `timestamptz` para `criada_em`, e a "validade" interpretada no fuso da cidade, resolvendo o risco da meia-noite agora ampliado entre cidades.
5. **Migrações versionadas** (arquivos SQL numerados), substituindo o `CREATE TABLE IF NOT EXISTS` do `migrar()`, já que o schema vai mudar com ONGs e doadores como tabelas.

## O que muda em relação ao 0001
| Ponto | Antes (um bairro) | Agora (várias cidades) | Efeito na decisão |
|---|---|---|---|
| Escritores simultâneos | Poucos | Muitos, em picos | **Reforça** o PostgreSQL; SQLite sai de vez |
| Aceite duplo | Raro | Provável | Mantém o `UPDATE ... WHERE status='disponivel' RETURNING`; vale em `READ COMMITTED` |
| Instâncias da aplicação | 1 | 2 ou mais | Exige banco em rede, não arquivo local |
| Consulta da lista (RN2) | Tabela pequena | Tabela grande | Novo: índice por cidade/status/validade |
| Fuso horário | UTC aceitável | Cidades em fusos diferentes | Novo: `timestamptz` e fuso por cidade |
| Disponibilidade e backup | Tolerável cópia manual | Serviço no ar para várias ONGs | Novo: serviço gerenciado |
| ONGs e doadores | Texto livre (`ong`) | Entidades próprias | Novo: tabelas e chaves estrangeiras (exigem constraints, que o PostgreSQL oferece) |

## Consequências
- **Positivas:** não há retrabalho da Refatoração 1; o cenário novo é atendido com ajustes incrementais; o histórico da decisão fica rastreável.
- **Negativas / o que abrimos mão:** custo recorrente do serviço gerenciado; dependência de um fornecedor (mitigada por usar PostgreSQL padrão, sem recursos proprietários); mais trabalho de modelagem agora.
- **Riscos e o que fazer se der errado:**
  - Instância única cair: ativar réplica de leitura ou alta disponibilidade do fornecedor; só então considerar outra topologia.
  - Esgotar conexões: limitar o pool e usar o pooler do fornecedor.
  - Se um dia uma cidade grande saturar a instância, abrir um **novo ADR** que **substitua** este. O 0001 e este 0002 continuam no repositório como histórico, com o status trocado para "substituído".

## Rastreabilidade
- Mudança de escopo informada para esta atividade (expansão para várias cidades, acessos simultâneos, mais volume).
- RN2 (lista de disponíveis) e RN3 (uma doação, uma ONG) em `docs/analise.md`.
- Risco de fuso da validade em `docs/analise.md`.
