// Camada de dados do Prato Cheio — acesso ao banco.
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

// Insere a doação e devolve a linha criada (com id, status e criada_em).
export async function inserir({ tipo, quantidade, unidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, unidade, validade)
     VALUES (?, ?, ?, ?)
     RETURNING *`,
    [tipo, quantidade, unidade, validade],
  );
  return rows[0];
}

// Devolve apenas as doações disponíveis e ainda não vencidas,
// mais urgentes primeiro (validade crescente). Regra de negócio 2 (aula 2).
export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = 'disponivel'
       AND validade >= date('now')
     ORDER BY validade ASC, id ASC`,
  );
  return rows;
}

// Busca uma doação pelo id (undefined se não existir).
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// Marca a doação como aceita pela ONG e devolve a linha atualizada.
// O `AND status = 'disponivel'` é a trava contra aceite duplo: só a primeira ONG
// casa com a condição; para a segunda o UPDATE não afeta nenhuma linha e o
// RETURNING volta vazio.
export async function aceitar(id, ong) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = 'aceita', ong = ?, aceita_em = datetime('now')
     WHERE id = ? AND status = 'disponivel'
     RETURNING *`,
    [ong, id],
  );
  return rows[0];
}

// Doações aceitas aguardando retirada pelo entregador, mais urgentes primeiro.
export async function listarAceitas() {
  const { rows } = await query(
    `SELECT * FROM doacoes
     WHERE status = 'aceita'
     ORDER BY validade ASC, id ASC`,
  );
  return rows;
}

// Marca a doação como coletada e devolve a linha atualizada.
// Mesma trava do aceite: o `AND status = 'aceita'` impede coletar uma doação
// que ainda não foi aceita ou confirmar duas vezes a mesma retirada.
export async function coletar(id) {
  const { rows } = await query(
    `UPDATE doacoes
     SET status = 'coletada', coletada_em = datetime('now')
     WHERE id = ? AND status = 'aceita'
     RETURNING *`,
    [id],
  );
  return rows[0];
}
