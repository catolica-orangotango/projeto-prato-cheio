# ADR 0006 — A interface envia a quantidade como digitada; quem valida é o servidor

- **Data:** 2026-10-28
- **Status:** proposto

## Contexto
O teste de fluxo com Playwright (ADR 0007) encontrou uma divergência no CA 1.2 (*"Dado que deixei em branco um campo obrigatório [...] Então o sistema recusa, informa o motivo"*). Com tipo preenchido e os outros campos em branco, a tela dizia:

> Não foi possível publicar: campos obrigatórios ausentes: unidade, validade.

A quantidade, também em branco, não aparecia. A causa estava em `public/index.html`: a interface enviava `quantidade: Number(quantidade.value)`, e `Number('')` vale `0`. O servidor recebia `0`, que não é "vazio" para `criarDoacao` (`src/doacoes.js`), então a quantidade passava pela checagem de campos obrigatórios e só seria recusada depois, com outra mensagem ("quantidade deve ser um número inteiro maior que zero"). O doador corrigia unidade e validade, tentava de novo e só então descobria o problema na quantidade.

Os testes da API não pegavam o caso porque mandam o corpo JSON direto, sem passar pela conversão da tela.

## Alternativas consideradas
1. **Enviar o valor do campo como está (`quantidade.value`)** *(escolhida)*.
   - Prós: uma linha; o servidor já trata texto vazio como ausente e já converte com `Number(...)` e `Number.isInteger`; a regra (RN1) fica num lugar só.
   - Contras: a quantidade viaja como texto (`"10"`) no JSON; quem lê a requisição na rede vê string, não número.
2. **Converter só quando preenchido (`quantidade.value === '' ? '' : Number(quantidade.value)`)**.
   - Prós: mantém número no JSON quando há valor.
   - Contras: duplica na tela uma decisão que o servidor já toma; mais um ramo para manter sem ganho para o usuário.
3. **Validar na tela antes de enviar (campos `required`, checagem em JavaScript)**.
   - Prós: aviso imediato, sem ida ao servidor.
   - Contras: duas validações da RN1 que podem divergir, que é exatamente o tipo de erro encontrado aqui; o servidor continua tendo que validar de qualquer jeito. Pode vir depois como conforto, não como regra.

## Decisão
Alternativa 1. A interface não interpreta os campos da doação: envia o que foi digitado e mostra o motivo que o servidor devolve. A RN1 continua inteira em `criarDoacao`, que é onde os testes automatizados a cobrem.

## Consequências
- **Positivas:** o aviso lista todos os campos em branco de uma vez, cumprindo o CA 1.2; a tela fica mais burra e a regra, num lugar só.
- **Negativas / o que abrimos mão:** o JSON de publicação leva a quantidade como texto. A API continua aceitando número também, então chamadas diretas não quebram.
- **Riscos:** se alguém tirar a conversão `Number(dados.quantidade)` do servidor, a quantidade passaria a ser gravada como texto. Os testes de `criarDoacao` e o teste de fluxo (passo "publicar doação válida") pegam essa regressão.

## Rastreabilidade
- CA 1.2 e RN1 em `docs/analise.md`.
- Correção em `public/index.html` (envio da publicação).
- Encontrado pelo teste de fluxo descrito no ADR 0007.
