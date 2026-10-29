// Comportamentos da interface que valem para todas as histórias.
import { test, expect } from '@playwright/test';
import { dia, preencherDoacao } from './apoio.js';

test('abre sem erros de JavaScript', async ({ page }) => {
  const erros = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Prato Cheio' })).toBeVisible();
  await expect(page.locator('#lista li').first()).toBeVisible();
  expect(erros).toEqual([]);
});

test('cabe na largura do celular, sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(page.viewportSize().width);
});

test('servidor fora do ar: avisa e mantém o que foi digitado', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/doacoes', (rota) =>
    rota.request().method() === 'POST' ? rota.abort() : rota.continue(),
  );
  await preencherDoacao(page, { tipo: 'Sopa', quantidade: '10', unidade: 'porções', validade: dia(3) });
  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(page.locator('#publicar-aviso')).toHaveText(
    'Não foi possível publicar: não foi possível falar com o servidor.',
  );
  await expect(page.getByLabel('Tipo de alimento')).toHaveValue('Sopa');
});
