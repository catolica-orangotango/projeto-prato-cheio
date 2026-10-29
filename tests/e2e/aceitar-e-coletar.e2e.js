// Histórias 2 e 3: a ONG aceita a doação e o entregador confirma a retirada (RN3).
import { test, expect } from '@playwright/test';
import { dia, unico, publicarPelaApi } from './apoio.js';

let doacao;

test.beforeEach(async ({ page, request }) => {
  doacao = await publicarPelaApi(request, {
    tipo: unico('Arroz'),
    quantidade: 2,
    unidade: 'kg',
    validade: dia(5),
  });
  await page.goto('/');
});

const disponivel = (page) => page.locator('#lista li', { hasText: doacao.tipo });
const aguardando = (page) => page.locator('#aceitas li', { hasText: doacao.tipo });

test('história 2: aceitar move a doação para "Aguardando retirada"', async ({ page }) => {
  await disponivel(page).getByRole('button', { name: 'Aceitar' }).click();

  await expect(page.locator('#lista-aviso')).toHaveText(`Doação aceita: ${doacao.tipo}.`);
  await expect(disponivel(page)).toHaveCount(0);
  await expect(aguardando(page)).toContainText('aceita por Minha ONG');
});

test('RN3: aceitar doação que outra ONG já aceitou mostra o motivo', async ({ page, request }) => {
  // Outra ONG aceita enquanto a lista ainda está na tela.
  await request.post(`/api/doacoes/${doacao.id}/aceitar`, { data: { ong: 'Outra ONG' } });
  await disponivel(page).getByRole('button', { name: 'Aceitar' }).click();

  await expect(page.locator('#lista-aviso')).toHaveText(
    'Não foi possível aceitar: doação já foi aceita por outra ONG.',
  );
  await expect(page.locator('#lista-aviso')).toHaveClass(/erro/);
  await expect(disponivel(page)).toHaveCount(0);
});

test('história 3: confirmar retirada tira a doação da lista', async ({ page }) => {
  await disponivel(page).getByRole('button', { name: 'Aceitar' }).click();
  await aguardando(page).getByRole('button', { name: 'Confirmar retirada' }).click();

  await expect(page.locator('#aceitas-aviso')).toHaveText(`Retirada confirmada: ${doacao.tipo}.`);
  await expect(aguardando(page)).toHaveCount(0);
});

test('história 3: retirada já confirmada em outra tela mostra o motivo', async ({ page, request }) => {
  await disponivel(page).getByRole('button', { name: 'Aceitar' }).click();
  await expect(aguardando(page)).toBeVisible();
  await request.post(`/api/doacoes/${doacao.id}/coletar`);
  await aguardando(page).getByRole('button', { name: 'Confirmar retirada' }).click();

  await expect(page.locator('#aceitas-aviso')).toHaveText(
    'Não foi possível confirmar a retirada: doação já foi coletada.',
  );
  await expect(aguardando(page)).toHaveCount(0);
});
