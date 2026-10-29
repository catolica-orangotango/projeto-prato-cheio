import { defineConfig } from '@playwright/test';

// Testes de fluxo pela interface (ADR 0007): `npm run test:e2e`.
// Os arquivos terminam em .e2e.js para o Vitest (`npm test`) não os pegar.
const PORTA = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  // Um servidor e um banco compartilhados: os testes rodam um de cada vez.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    browserName: 'chromium',
    // Celular: o entregador usa o sistema na rua (docs/analise.md).
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Banco em memória: começa vazio a cada execução e não toca o dados.sqlite.
  // Nunca reaproveita um servidor já aberto, que pode estar com banco sujo.
  webServer: {
    command: 'node --no-warnings=ExperimentalWarning src/server.js',
    url: `http://localhost:${PORTA}/api/saude`,
    env: { PORT: String(PORTA), DATABASE_FILE: ':memory:' },
    reuseExistingServer: false,
  },
});
