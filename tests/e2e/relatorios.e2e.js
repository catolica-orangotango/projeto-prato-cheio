// Histórias 4 e 5: total coletado no período e "estoque" da ONG (ADR 0004 e 0005).
import { test, expect } from '@playwright/test';
import { dia, unico, publicarPelaApi } from './apoio.js';

// Cada teste usa uma ONG própria, com uma doação já coletada por ela hoje.
let ong;
let coletada;

test.beforeEach(async ({ page, request }) => {
  ong = unico('ONG');
  coletada = await publicarPelaApi(request, {
    tipo: unico('Feijão'),
    quantidade: 3,
    unidade: 'kg',
    validade: dia(4),
  });
  await request.post(`/api/doacoes/${coletada.id}/aceitar`, { data: { ong } });
  await request.post(`/api/doacoes/${coletada.id}/coletar`);
  await page.goto('/');
});

test.describe('história 4', () => {
  const consulta = (page) => page.getByRole('group', { name: 'Consultar total da ONG' });

  async function consultar(page, { nome = ong, inicio, fim }) {
    await consulta(page).getByLabel('ONG').fill(nome);
    await consulta(page).getByLabel('De').fill(inicio);
    await consulta(page).getByLabel('Até').fill(fim);
    await consulta(page).getByRole('button', { name: 'Consultar' }).click();
  }

  test('conta a coleta de hoje', async ({ page }) => {
    await consultar(page, { inicio: dia(0), fim: dia(0) });
    await expect(page.locator('#relatorio-resultado')).toHaveText(
      `${ong} coletou 1 doação(ões) de ${dia(0)} a ${dia(0)}.`,
    );
  });

  test('período sem coletas dá zero', async ({ page }) => {
    await consultar(page, { inicio: dia(-10), fim: dia(-1) });
    await expect(page.locator('#relatorio-resultado')).toHaveText(
      `${ong} coletou 0 doação(ões) de ${dia(-10)} a ${dia(-1)}.`,
    );
  });

  test('espaços nas pontas do nome da ONG são ignorados', async ({ page }) => {
    await consultar(page, { nome: `  ${ong}  `, inicio: dia(0), fim: dia(0) });
    await expect(page.locator('#relatorio-resultado')).toHaveText(new RegExp(`^${ong} coletou 1 `));
  });

  test('início depois do fim é recusado', async ({ page }) => {
    await consultar(page, { inicio: dia(1), fim: dia(0) });
    await expect(page.locator('#relatorio-resultado')).toHaveText(
      'Não foi possível consultar: período inválido: o início é depois do fim.',
    );
  });

  test('datas em branco são recusadas', async ({ page }) => {
    await consultar(page, { inicio: '', fim: '' });
    await expect(page.locator('#relatorio-resultado')).toHaveText(
      'Não foi possível consultar: início inválido: use o formato AAAA-MM-DD.',
    );
  });
});

test.describe('história 5', () => {
  const consulta = (page) => page.getByRole('group', { name: 'Consultar doações coletadas pela ONG' });

  async function consultar(page, nome) {
    await consulta(page).getByLabel('ONG').fill(nome);
    await consulta(page).getByRole('button', { name: 'Consultar estoque' }).click();
  }

  test('lista só o que a ONG coletou, sem marcar como vencida', async ({ page }) => {
    await consultar(page, ong);
    await expect(page.locator('#estoque-resultado')).toHaveText(`${ong} coletou 1 doação(ões).`);
    const itens = page.locator('#estoque-lista li');
    await expect(itens).toHaveCount(1);
    await expect(itens).toContainText(`${coletada.tipo}: 3 kg (validade ${dia(4)}, coletada em `);
    await expect(itens).not.toContainText('VENCIDA');
  });

  test('ONG sem coletas devolve lista vazia, sem erro', async ({ page }) => {
    const outra = unico('ONG');
    await consultar(page, outra);
    await expect(page.locator('#estoque-resultado')).toHaveText(`${outra} coletou 0 doação(ões).`);
    await expect(page.locator('#estoque-lista li')).toHaveCount(0);
  });

  test('ONG em branco é recusada e a lista é limpa', async ({ page }) => {
    await consultar(page, ong);
    await expect(page.locator('#estoque-lista li')).toHaveCount(1);
    await consultar(page, '   ');
    await expect(page.locator('#estoque-resultado')).toHaveText('Não foi possível consultar: informe a ONG.');
    await expect(page.locator('#estoque-lista li')).toHaveCount(0);
  });
});
