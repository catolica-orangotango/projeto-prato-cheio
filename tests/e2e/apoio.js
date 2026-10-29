// Apoio dos testes de fluxo.

// Data AAAA-MM-DD deslocada em dias a partir de hoje.
// Em UTC, como o `hoje()` do servidor (limitação de fuso, ADR 0004 e 0005);
// com a data local o teste falharia depois das 21h no Brasil.
export const dia = (deslocamento = 0) =>
  new Date(Date.now() + deslocamento * 864e5).toISOString().slice(0, 10);

// Sufixo para os testes não esbarrarem nos dados uns dos outros no mesmo banco.
export const unico = (texto) => `${texto} ${Math.random().toString(36).slice(2, 7)}`;

export async function preencherDoacao(page, { tipo, quantidade, unidade, validade }) {
  await page.getByLabel('Tipo de alimento').fill(tipo);
  await page.getByLabel('Quantidade').fill(quantidade);
  await page.getByLabel('Unidade').fill(unidade);
  await page.getByLabel('Validade / retirar até').fill(validade);
}

// Publica pela API, para preparar o cenário de um teste que verifica outra tela.
export async function publicarPelaApi(request, dados) {
  const resposta = await request.post('/api/doacoes', { data: dados });
  if (!resposta.ok()) throw new Error(`publicação recusada: ${await resposta.text()}`);
  return resposta.json();
}
