// História 1: o doador publica uma doação (CA 1.1 e 1.2, RN1).
import { test, expect } from '@playwright/test';
import { dia, unico, preencherDoacao } from './apoio.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

const aviso = (page) => page.locator('#publicar-aviso');
const publicar = (page) => page.getByRole('button', { name: 'Publicar' });

test('CA 1.1: publicar doação válida limpa o formulário e a mostra na lista', async ({ page }) => {
  const tipo = unico('Sopa');
  await preencherDoacao(page, { tipo, quantidade: '10', unidade: 'porções', validade: dia(3) });
  await publicar(page).click();

  await expect(aviso(page)).toHaveText('Doação publicada.');
  await expect(aviso(page)).not.toHaveClass(/erro/);
  for (const rotulo of ['Tipo de alimento', 'Quantidade', 'Unidade', 'Validade / retirar até']) {
    await expect(page.getByLabel(rotulo)).toHaveValue('');
  }
  await expect(page.locator('#lista li', { hasText: tipo })).toContainText(
    `${tipo}: 10 porções (até ${dia(3)})`,
  );
});

test('CA 1.1: validade de hoje é aceita', async ({ page }) => {
  const tipo = unico('Pão');
  await preencherDoacao(page, { tipo, quantidade: '5', unidade: 'kg', validade: dia(0) });
  await publicar(page).click();

  await expect(aviso(page)).toHaveText('Doação publicada.');
  await expect(page.locator('#lista li', { hasText: tipo })).toBeVisible();
});

test('CA 1.2: campos em branco são todos listados e o que foi digitado fica', async ({ page }) => {
  await page.getByLabel('Tipo de alimento').fill('Sopa');
  await publicar(page).click();

  await expect(aviso(page)).toHaveText(
    'Não foi possível publicar: campos obrigatórios ausentes: quantidade, unidade, validade.',
  );
  await expect(aviso(page)).toHaveClass(/erro/);
  await expect(page.getByLabel('Tipo de alimento')).toHaveValue('Sopa');
});

test('CA 1.2: validade vencida é recusada', async ({ page }) => {
  await preencherDoacao(page, { tipo: 'Sopa', quantidade: '10', unidade: 'porções', validade: dia(-1) });
  await publicar(page).click();

  await expect(aviso(page)).toHaveText(
    'Não foi possível publicar: validade já vencida: a data precisa ser hoje ou no futuro.',
  );
  await expect(page.getByLabel('Validade / retirar até')).toHaveValue(dia(-1));
});

test('CA 1.2: quantidade zero é recusada', async ({ page }) => {
  await preencherDoacao(page, { tipo: 'Sopa', quantidade: '0', unidade: 'porções', validade: dia(3) });
  await publicar(page).click();

  await expect(aviso(page)).toHaveText(
    'Não foi possível publicar: quantidade deve ser um número inteiro maior que zero.',
  );
});
