# ADR 0007 — Playwright para os testes de fluxo ponta a ponta

- **Data:** 2026-10-28
- **Status:** proposto

## Contexto
A suíte atual (`tests/doacoes.test.js`, Vitest + Supertest) cobre as regras de negócio e as rotas da API, com SQLite em memória. Ela não passa pela interface (`public/index.html`), e a interface tem lógica própria: monta o corpo das requisições, mostra avisos de erro, recarrega as listas depois de aceitar ou coletar e precisa funcionar no celular (stakeholder voluntário entregador, `docs/analise.md`).

Essa lacuna já custou caro: a issue #25 (a tela engolia os erros do servidor) e o achado do ADR 0006 (a quantidade em branco sumia do aviso) passaram pelos testes da API porque o defeito estava entre o campo da tela e a requisição.

Fizemos um teste de fluxo exploratório com Playwright cobrindo as histórias 1 a 5 na tela, com viewport de celular (390×844): 23 passos, entre eles publicar com erro e com sucesso, aceite concorrente (RN3), retirada duplicada, relatórios das histórias 4 e 5, servidor fora do ar e ausência de erros de JavaScript no console. Ele encontrou o defeito do ADR 0006 e reproduziu a limitação de fuso já registrada (ADR 0004 e 0005): depois das 21h no Brasil, uma doação com validade "hoje" é recusada como vencida.

## Alternativas consideradas
1. **Playwright (`@playwright/test`)** *(escolhida)*.
   - Prós: espera automática pelos elementos (menos testes instáveis); seletores por papel e texto (`getByRole('button', { name: 'Aceitar' })`), que também verificam acessibilidade básica; emulação de celular; intercepta rede (`page.route`) para simular servidor fora do ar; `request` embutido para preparar cenários pela API (outra ONG aceitando antes); sobe o servidor sozinho (`webServer`); Chromium, Firefox e WebKit com a mesma API; gratuito e de código aberto.
   - Contras: baixa navegadores (cerca de 150 MB por navegador) no CI e na máquina; exige Node 20 ou superior (o projeto já exige 22.13); é mais uma ferramenta de teste além do Vitest.
2. **Cypress**.
   - Prós: interface de depuração visual muito boa; comunidade grande.
   - Contras: roda dentro do navegador, o que complica preparar cenários com duas "abas" ou duas ONGs; WebKit só experimental; recursos de paralelismo e gravação no CI são pagos.
3. **Puppeteer**.
   - Prós: leve, mantido pelo time do Chrome.
   - Contras: é biblioteca de automação, não ferramenta de teste: sem espera automática nas asserções, sem runner, sem relatório; só Chromium e Firefox.
4. **Selenium WebDriver**.
   - Prós: padrão W3C, suporta qualquer navegador.
   - Contras: configuração de drivers mais pesada; esperas manuais; mais lento e mais instável para um projeto deste tamanho.
5. **Continuar só com testes de API e teste manual da tela**.
   - Prós: nada novo para instalar; CI mais rápido.
   - Contras: é o cenário em que os dois defeitos acima passaram despercebidos.

## Decisão
Alternativa 1. Os testes de fluxo usam `@playwright/test`, em `tests/e2e/`, separados da suíte do Vitest:

- **Comando próprio** (`npm run test:e2e`), para que `npm test` continue rápido e sem navegador.
- **Servidor e banco isolados:** o `webServer` do Playwright sobe `src/server.js` numa porta própria com `DATABASE_FILE=:memory:`, como o Vitest: o banco nasce vazio a cada execução e some quando o servidor para; o `dados.sqlite` de desenvolvimento nunca é tocado. `reuseExistingServer: false`, porque no teste exploratório um servidor esquecido de uma execução anterior, com banco sujo, derrubou vários passos em cascata.
- **Só Chromium com viewport de celular** no começo, por ser o caso de uso principal (entregador na rua). Firefox e WebKit entram se aparecer defeito específico de navegador.
- **Preparo de cenários pela API** (`request`), e verificação pela tela: o teste clica onde o usuário clica e só usa a API para simular outro ator (outra ONG, outra aba).
- **CI:** um job a mais, depois do job atual, com `npx playwright install --with-deps chromium` e o relatório HTML publicado como artefato quando falhar.

## Consequências
- **Positivas:** os critérios de aceite passam a ser verificados como o usuário os vive, inclusive avisos de erro e layout no celular; defeitos de "cola" entre tela e API, como os da issue #25 e do ADR 0006, ganham rede de segurança; a migração para PostgreSQL (ADR 0001) ganha uma segunda prova de que o comportamento se manteve.
- **Negativas / o que abrimos mão:** o CI fica mais lento (instalar o Chromium e subir o servidor); mais uma dependência de desenvolvimento para manter atualizada; testes de tela quebram com mudanças de texto, então os textos dos avisos viram parte do contrato.
- **Riscos e o que fazer se der errado:**
  - *Testes instáveis:* usar só as esperas do Playwright (`expect(...).toHaveText`, `waitFor`), nunca pausas fixas; se um teste falhar de forma intermitente, corrigir ou remover, não reexecutar até passar.
  - *Fuso horário:* enquanto `hoje()` usar UTC (ADR 0004 e 0005), datas "de hoje" nos testes devem ser calculadas em UTC, como o servidor faz; caso contrário o teste falha à noite. Quando o fuso for resolvido, ajustar junto.
  - *Custo do CI alto demais:* rodar o job de e2e só em Pull Request para a `main`, não em todo push.

## Rastreabilidade
- CA 1.1 a 1.3, 2.1 a 2.3, 3.1 a 3.4, 4.1 a 4.5 e 5.1 a 5.5 em `docs/analise.md`, verificados pela interface.
- Stakeholder voluntário entregador ("funciona no celular, na rua") em `docs/analise.md`.
- Issue #25 (interface engolia erros) e ADR 0006 (quantidade em branco), defeitos que motivaram a decisão.
- Limitação de fuso dos ADR 0004 e 0005, reproduzida pelo teste exploratório.
