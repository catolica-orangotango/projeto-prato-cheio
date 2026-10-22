# ADR 0004 — História 4 conta doações coletadas, não aceitas

- **Data:** 2026-10-14
- **Status:** aceito (confirmado pelo grupo)

## Contexto
A história 4 ([#5](https://github.com/catolica-orangotango/projeto-prato-cheio/issues/5)) diz: *"Como coordenador da ONG, quero saber quantas doações **coletamos** em um período determinado"*. Os critérios de aceite escritos na aula 4 (`docs/atividades/aula4.md`, repetidos em `docs/analise.md`) contam outra coisa: o total de doações **aceitas** pela ONG, filtrado pela data de **aceite**.

Na época isso fazia sentido: o sistema só conhecia os status `disponivel` e `aceita`, e não havia como registrar uma coleta. A história 3 ([#3](https://github.com/catolica-orangotango/projeto-prato-cheio/issues/3), PR #11) mudou esse quadro: agora existe o status `coletada` e as colunas `aceita_em` e `coletada_em`.

Contar aceites e contar coletas não dá o mesmo número. Uma doação aceita pode vencer ou nunca ser retirada, e nenhuma refeição chega a quem precisa. O indicador do objetivo 2 da análise é justamente "doações coletadas por semana".

Os critérios originais também deixavam em aberto se os dias de início e fim entram no intervalo e o que fazer com uma consulta inválida.

## Alternativas consideradas
1. **Manter os critérios originais (aceitas, por `aceita_em`).** Prós: é o que o grupo acordou na aula 4, e nada muda nos docs. Contras: o número não responde à pergunta da história e infla o volume com doações que não foram retiradas.
2. **Contar coletadas, por `coletada_em`.** Prós: responde à história e ao indicador da análise, e usa dados que a HU3 já grava. Contras: muda um critério acordado pelo grupo e depende da HU3 estar na `main` (já está).
3. **Devolver os dois números (aceitas e coletadas).** Prós: mostra também a perda entre aceite e coleta. Contras: aumenta o escopo da história, e a métrica de perda pertence ao experimento da hipótese, não a esta história.

## Decisão
Alternativa 2. A história conta doações **coletadas** pela ONG, pela data de coleta (`coletada_em`). Junto com ela:

- **Intervalo inclusivo:** coletas feitas nos dias de início e de fim entram na conta.
- **CA 4.4 (novo):** doações aceitas e ainda não coletadas não entram no total.
- **CA 4.5 (novo):** consulta sem ONG, com data fora do formato AAAA-MM-DD ou com início depois do fim é recusada, com o motivo. É o mesmo padrão de validação da história 1.
- **Fora do escopo:** login e perfil de coordenador. A ONG é informada na consulta, como no aceite. Listagem detalhada e gráficos também ficam de fora.

Os critérios completos (CA 4.1 a 4.5) estão na issue #5.

## Consequências
- **Positivas:** o número que o coordenador vê é o volume que de fato saiu do doador. A história alimenta o indicador "doações coletadas por semana" sem trabalho extra.
- **Negativas / o que abrimos mão:** o critério acordado em aula muda, e os docs da aula 4 e da análise passam a divergir da issue até serem atualizados. A taxa de aceite sem coleta não aparece para o coordenador.
- **Riscos:** o grupo pode não concordar com a troca. Nesse caso, este ADR passa a "substituído" e a issue volta aos critérios originais. Coletas feitas fora do sistema (pelo WhatsApp) não têm `coletada_em` e não aparecem na contagem; o coordenador precisa saber que o total cobre só o que passou pela plataforma.
- **Limitação conhecida (fuso horário):** `coletada_em` é gravada em UTC (`datetime('now')`, desde a história 3) e a contagem compara o dia em UTC. Uma coleta feita no Brasil depois das 21h (UTC−3) conta no dia seguinte, o que pode mover coletas de borda entre períodos. Fica para resolver junto com a migração para PostgreSQL (ADR 0001), usando `timestamptz` e o fuso da ONG na consulta, em vez de um deslocamento fixo agora no SQLite.

## Rastreabilidade
- História 4 e CA 4.1–4.3 em `docs/analise.md` e `docs/atividades/aula4.md`.
- Objetivo 2 da análise: "doações coletadas por semana".
- Depende da história 3 (status `coletada` e `coletada_em`), PR #11.
