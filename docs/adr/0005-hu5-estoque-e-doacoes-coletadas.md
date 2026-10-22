# ADR 0005 — História 5 fatiada: "estoque" é o que a ONG coletou

- **Data:** 2026-10-21
- **Status:** aceito (confirmado pelo grupo)

## Contexto
A história 5 ([#4](https://github.com/catolica-orangotango/projeto-prato-cheio/issues/4)) diz: *"Como agente da vigilância sanitária, quero consultar todos os alimentos perecíveis que a ONG possui em estoque, para que eu possa realizar auditorias de qualidade"*. A Análise (`docs/analise.md`) já a marcou como mal fatiada: falha em **E**stimável e **S**mall, porque "estoque" pressupõe um inventário no tempo que o modelo não tem.

O que o sistema sabe hoje, depois das histórias 3 e 4: cada doação passa por `disponivel`, `aceita` e `coletada`, com `ong`, `aceita_em` e `coletada_em`. Não existe:
- **baixa:** nada registra que a ONG consumiu, distribuiu ou descartou a doação depois de coletar;
- **perecível:** não há campo que separe perecíveis de não perecíveis;
- **login:** o agente da vigilância não tem perfil, e a ONG chega como texto livre.

Sem a baixa, "o que a ONG possui agora" não pode ser calculado. O que dá para saber é o que a ONG **coletou**.

## Alternativas consideradas
1. **Construir o estoque de verdade** (registrar baixa, separar perecíveis, perfil da vigilância).
   - Prós: responde à história como foi escrita.
   - Contras: exige modelo novo (baixa, movimentação, campo de perecibilidade) e uma história nova para a ONG dar baixa. Não é uma fatia pequena e o ganho depende de dados que nenhum ator hoje informa.
2. **Tratar "estoque" como as doações coletadas pela ONG, com a validade à vista** *(escolhida)*.
   - Prós: usa só dados que já existem (`status`, `ong`, `coletada_em`, `validade`); entrega o que a auditoria mais precisa, que é saber o que a ONG recebeu e o que já passou da validade.
   - Contras: sem baixa, a lista só cresce e inclui o que a ONG já pode ter distribuído; todo alimento é tratado como perecível.
3. **Mostrar só as doações coletadas ainda dentro da validade.**
   - Prós: lista "limpa", parecida com um estoque utilizável.
   - Contras: esconde justamente o que a auditoria quer achar, a comida vencida em poder da ONG. Descartada.

## Decisão
Alternativa 2. A história fatiada fica assim:

> Como **agente da vigilância sanitária**, quero consultar as doações que uma ONG coletou, com a validade de cada uma e a indicação de quais já venceram, para auditar a qualidade.

Critérios de aceite (CA 5.1 a 5.5, em `docs/analise.md`):
- Lista as doações coletadas pela ONG com tipo, quantidade, unidade, validade e data de coleta, da validade mais próxima para a mais distante.
- Marca como **vencida** a doação com validade anterior ao dia da consulta.
- Só entram doações coletadas pela ONG consultada (nem disponíveis, nem só aceitas, nem de outras ONGs).
- ONG sem doações coletadas devolve lista vazia, sem erro.
- Consulta sem ONG é recusada.

Fora do escopo: baixa de estoque, campo de perecibilidade, perfil e login da vigilância, filtros por período ou por tipo. A ONG é informada na consulta, como no aceite (ADR 0004).

## Consequências
- **Positivas:** a história passa a ser pequena e testável, reaproveita o que as histórias 3 e 4 já gravam e deixa a vigilância ver o risco real (vencidos em poder da ONG). Fecha o ciclo da análise: o requisito de rastreabilidade mínima (CA 1.3) agora tem quem o consulte.
- **Negativas / o que abrimos mão:** a lista não é um estoque de verdade. Ela mostra tudo o que a ONG coletou, inclusive o que já foi consumido. Todo alimento entra como se fosse perecível.
- **Riscos:** a vigilância pode ler "coletou" como "tem agora" e tirar uma conclusão errada. A interface e o nome da rota falam em doações coletadas, e a evolução natural é uma história de baixa (a ONG registra consumo ou descarte), que transformaria a lista num estoque real. A consulta é aberta (sem login), como a da história 4; um perfil de vigilância fica para quando houver autenticação.
- **Limitação conhecida (fuso horário):** "vencida" compara a validade com o dia atual em UTC (`hoje()`), a mesma regra da publicação (RN1). Perto da meia-noite no Brasil, um item pode aparecer como vencido ou não com um dia de diferença. Resolve junto com a migração para PostgreSQL (ADR 0001 e 0002), usando o fuso da cidade.

## Rastreabilidade
- História 5 e CA 5.1 a 5.5 em `docs/analise.md`.
- Falha de INVEST da história 5 ("estoque") e adiamento na "Decisão de análise" de `docs/analise.md`.
- Stakeholder vigilância sanitária e a rastreabilidade mínima (CA 1.3, RN1).
- Depende das histórias 3 (`coletada_em`) e 4 (consulta por ONG, ADR 0004).
