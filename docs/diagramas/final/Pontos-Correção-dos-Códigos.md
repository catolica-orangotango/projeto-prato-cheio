# Prato Cheio: pontos de correção dos códigos

Pull Request da entrega: <https://github.com/catolica-orangotango/projeto-prato-cheio/pull/27>

| Arquivo | Diagrama | Versão da IA (sem correção) | Versão final (corrigida) |
|---|---|---|---|
| `codigo1.puml` | Casos de Uso (UML) | [`v1-ia/codigo1.puml`](../v1-ia/codigo1.puml) | [`final/codigo1.puml`](codigo1.puml) |
| `codigo2.puml` | Classes (UML) | [`v1-ia/codigo2.puml`](../v1-ia/codigo2.puml) | [`final/codigo2.puml`](codigo2.puml) |

**Ferramenta:** PlantUML (`.puml`). Usamos PlantUML porque o Mermaid não tem diagrama de casos de
uso. Para ver a imagem, cole o código em <https://www.plantuml.com/plantuml> ou use a extensão
"PlantUML" do VS Code (Alt+D).

**Gravidade:**

- **GRAVE:** contradiz uma regra de negócio ou a implementação real.
- **EXAGERO:** inclui algo que não existe e que nenhuma história pede.
- **NOTAÇÃO:** usa a notação UML de forma errada.

Os dois problemas principais da entrega estão marcados com ⭐ **PRINCIPAL**.

---

## codigo1.puml: Diagrama de Casos de Uso

### UC-1 · GRAVE · Login e cadastro de conta que não existem

- **Onde (v1):**
  - [linhas 14-15](../v1-ia/codigo1.puml#L14-L15): casos "Fazer login" e "Cadastrar conta"
  - [linha 31](../v1-ia/codigo1.puml#L31): `Doador --> UC_Cad`
  - [linhas 45-46](../v1-ia/codigo1.puml#L45-L46): `<<include>>` de login em Publicar e Aceitar
- **Por quê:** o sistema não tem autenticação. Em `src/app.js` o aceite usa
  `req.body?.ong ?? 'ONG'`: o nome da ONG chega como texto livre. Também não existe tabela de
  usuários (`src/db.js` só cria a tabela `doacoes`). O `<<include>>` afirma que **toda**
  publicação passa por login, o que é falso.
- **Correção:** casos e `<<include>>` removidos. Na final, a nota de "Aceitar doação"
  ([linhas 49-54](codigo1.puml#L49-L54)) registra "não há login" como **limitação**.

### UC-2 · EXAGERO · Notificação automática e ator "Sistema de Notificação"

- **Onde (v1):** [linha 11](../v1-ia/codigo1.puml#L11) (ator `Notif`),
  [linha 24](../v1-ia/codigo1.puml#L24) (caso "Notificar ONGs"),
  [linha 43](../v1-ia/codigo1.puml#L43) e [linhas 49-50](../v1-ia/codigo1.puml#L49-L50)
  (`<<include>>` de notificação).
- **Por quê:** notificação só aparece em `docs/analise.md` como intervenção do **experimento**
  (hipótese de avisar em 15 min). Não foi implementada e não é história de usuário. O diagrama
  mostra como funcionalidade o que ainda é hipótese.
- **Correção:** ator e caso de uso removidos.

### UC-3 · EXAGERO · Editar, excluir, cancelar aceite e filtrar por proximidade

- **Onde (v1):**
  - [linhas 17-18](../v1-ia/codigo1.puml#L17-L18) (Editar/Excluir doação) +
    [linhas 33-34](../v1-ia/codigo1.puml#L33-L34)
  - [linha 23](../v1-ia/codigo1.puml#L23) (Cancelar aceite) + [linha 37](../v1-ia/codigo1.puml#L37)
  - [linha 21](../v1-ia/codigo1.puml#L21) (Filtrar por proximidade) + [linha 38](../v1-ia/codigo1.puml#L38)
- **Por quê:**
  - Editar/excluir: nenhuma história pede, e `src/app.js` só tem `GET` e `POST`.
  - Cancelar aceite: nenhuma regra prevê, e isso abriria um conflito com a RN3 que o grupo não
    decidiu.
  - Proximidade: a RN4 está **fora do escopo** ("o modelo ainda não registra localização").
- **Correção:** removidos. Ficaram só os casos que vêm das histórias H1 a H5.

### UC-4 · NOTAÇÃO · `<<extend>>` em uma validação obrigatória · ⭐ PRINCIPAL

- **Onde (v1):**
  - [linha 19](../v1-ia/codigo1.puml#L19): `usecase "Validar dados da doação"`
  - [linha 47](../v1-ia/codigo1.puml#L47): `UC_Val ..> UC_Pub : <<extend>>`
- **Por quê:** há dois erros de notação.
  1. `<<extend>>` indica comportamento **opcional**, que só acontece sob uma condição. A
     validação da RN1 acontece **sempre** (`criarDoacao()` em `src/doacoes.js`).
  2. Validar não é um **objetivo do ator**: nenhum doador entra no sistema "para validar dados".
     É uma regra interna da publicação.
- **Correção:** caso de uso removido. A RN1 virou nota presa a "Publicar doação"
  ([linhas 37-41](codigo1.puml#L37-L41)).

### UC-5 · NOTAÇÃO · `<<include>>` com o sentido errado

- **Onde (v1):** [linha 48](../v1-ia/codigo1.puml#L48): `UC_Ver ..> UC_Aceitar : <<include>>`
- **Por quê:** "Ver inclui Aceitar" significa que **toda vez** que a ONG vê a lista, ela aceita
  uma doação. É falso: ela pode ver e não aceitar nada. E aceitar não depende de ver:
  `POST /api/doacoes/:id/aceitar` funciona sozinho.
- **Correção:** relação removida. Os dois casos ficaram independentes, ligados ao mesmo ator
  ([linhas 30-31](codigo1.puml#L30-L31)).

### UC-6 · GRAVE · Atores errados, histórias pendentes desenhadas como prontas e H3 incompleta

- **Onde (v1):**
  - [linha 9](../v1-ia/codigo1.puml#L9) (ator "Administrador (Marta)") +
    [linhas 26-27](../v1-ia/codigo1.puml#L26-L27) e [40-41](../v1-ia/codigo1.puml#L40-L41)
  - [linhas 10](../v1-ia/codigo1.puml#L10), [28](../v1-ia/codigo1.puml#L28) e
    [42](../v1-ia/codigo1.puml#L42) (Vigilância / Consultar estoque)
  - [linha 7](../v1-ia/codigo1.puml#L7) (ator genérico "ONG")
  - [linhas 8](../v1-ia/codigo1.puml#L8), [25](../v1-ia/codigo1.puml#L25) e
    [39](../v1-ia/codigo1.puml#L39) (Entregador só com "Confirmar coleta")
- **Por quê:**
  - O relatório de volume é a H4, cujo ator é o **coordenador da ONG**, não a Marta. "Gerenciar
    ONGs" não vem de nenhuma história: a Marta é stakeholder, não usuária do sistema.
  - A H4 e a H5 **ainda não foram implementadas**, e a H5 falha em E e S do INVEST ("estoque"
    não existe no modelo). O diagrama as mostra como se já existissem.
  - A H2 fala de **funcionário de ONG**; uma organização não é um ator humano.
  - A H3 (entregador) **foi implementada**, mas a IA desenhou só a confirmação. Faltou o caso
    "Ver doações aguardando retirada" (`GET /api/doacoes/aceitas`), que é como o entregador sabe
    o que buscar.
- **Correção:** os atores agora seguem as histórias ([linhas 12-16](codigo1.puml#L12-L16)). A H3
  tem os dois casos do entregador ([linhas 22-23](codigo1.puml#L22-L23) e
  [32-33](codigo1.puml#L32-L33)), com uma nota das regras da coleta
  ([linhas 56-60](codigo1.puml#L56-L60)). H4 e H5 aparecem com o estereótipo `<<pendente>>`, em
  cinza, com a legenda "não existem no sistema hoje" ([linhas 6-10](codigo1.puml#L6-L10),
  [25-26](codigo1.puml#L25-L26) e [62-65](codigo1.puml#L62-L65)). Cada caso traz o número da
  história (H1 a H5), o que dá rastreabilidade.

---

## codigo2.puml: Diagrama de Classes

### CL-1 · GRAVE · Doação e ONG ligadas como muitos-para-muitos · ⭐ PRINCIPAL

- **Onde (v1):** [linha 84](../v1-ia/codigo2.puml#L84): `Doacao "*" -- "*" ONG : aceita`
- **Por quê:** o `*` do lado da ONG diz que **uma doação pode ser aceita por várias ONGs**,
  exatamente o que a RN3 proíbe. No banco, `ong` é uma única coluna, anulável, da tabela
  `doacoes` (`src/db.js`), gravada uma vez só pelo `UPDATE ... WHERE status = 'disponivel'`
  (`src/repositorio.js`).
- **Correção:** a relação virou o atributo `ong: string [0..1]` na `Doacao`
  ([linha 50](codigo2.puml#L50)): nenhuma ONG até o aceite e no máximo uma depois. Uma nota
  explica ([linhas 69-74](codigo2.puml#L69-L74)). Se a U2 criar a entidade ONG, a associação
  correta será `Doacao "*" --> "0..1" ONG`.
- **O que dizer:** cardinalidade **é** regra de negócio. Um `*` errado desfaz a principal
  garantia do sistema.

### CL-2 · EXAGERO · Hierarquia de usuários com login, senha, CNPJ e CNH

- **Onde (v1):** [linhas 5-11](../v1-ia/codigo2.puml#L5-L11) (`Usuario` com `senha` e
  `login()`), [linhas 13-33](../v1-ia/codigo2.puml#L13-L33) (`Doador`, `ONG`, `Entregador`) e
  [linhas 80-82](../v1-ia/codigo2.puml#L80-L82) (herança).
- **Por quê:** o schema tem **uma única tabela**, `doacoes`. Não há cadastro, login nem perfis.
  A IA desenhou um sistema "típico", e não o que existe. A associação
  `Entregador "1" -- "*" Doacao` ([linha 85](../v1-ia/codigo2.puml#L85)) também é falsa: a coleta
  grava só `status` e `coletada_em`, sem registrar **quem** coletou.
- **Correção:** as quatro classes foram removidas. A nota da `Doacao` diz "Não existe entidade
  ONG, Doador nem Entregador: não há cadastro nem login".

### CL-3 · GRAVE · Atributos da Doação diferentes do schema e das regras

- **Onde (v1):**

  | Linha | Na v1 | Problema |
  |---|---|---|
  | [46](../v1-ia/codigo2.puml#L46) | `descricao` | o campo real é `tipo` |
  | [47](../v1-ia/codigo2.puml#L47) | `quantidade: double` | a RN1 exige **inteiro** > 0 |
  | [50](../v1-ia/codigo2.puml#L50) | `foto: Blob` | não existe e contraria o risco R1 (formulário curto) |
  | — | faltam `unidade`, `criada_em`, `aceita_em` e `coletada_em` | ausentes no modelo |

- **Por quê:** separar quantidade de unidade foi decisão da análise. O `criada_em` é a
  rastreabilidade mínima pedida pela vigilância (CA 1.3), testada em `tests/doacoes.test.js`.
  `aceita_em` e `coletada_em` são os carimbos de tempo que a H3 grava (CA 3.1) e que o
  experimento da análise usa para medir o tempo entre publicação, aceite e coleta.
- **Correção:** a `Doacao` espelha o `CREATE TABLE` de `src/db.js`
  ([linhas 43-54](codigo2.puml#L43-L54)): `tipo`, `quantidade: int`, `unidade`,
  `validade: date`, `status`, `ong [0..1]`, `criada_em`, `aceita_em [0..1]` e
  `coletada_em [0..1]`.

### CL-4 · GRAVE · Status VENCIDA e CANCELADA inexistentes

- **Onde (v1):** [linha 58](../v1-ia/codigo2.puml#L58) (`VENCIDA`),
  [linha 60](../v1-ia/codigo2.puml#L60) (`CANCELADA`) e [linha 52](../v1-ia/codigo2.puml#L52)
  (método `vencer()`).
- **Por quê:** a coluna `status` só recebe `'disponivel'` (padrão), `'aceita'` (no aceite) e
  `'coletada'` (na retirada, H3). "Vencida" é **calculada na leitura** (`validade >= date('now')`
  em `listarDisponiveis()`); nada grava esse estado. Cancelamento não existe.
  O `COLETADA` da v1 ([linha 59](../v1-ia/codigo2.puml#L59)) está **certo**: passou a existir
  com a H3.
- **Correção:** enum com `disponivel`, `aceita` e `coletada`
  ([linhas 56-60](codigo2.puml#L56-L60)). `vencer()` removido.

### CL-5 · NOTAÇÃO · Responsabilidades espalhadas e camada de dados pulada

- **Onde (v1):** [linha 51](../v1-ia/codigo2.puml#L51) (`Doacao.aceitar()`),
  [linha 27](../v1-ia/codigo2.puml#L27) (`ONG.aceitarDoacao()`),
  [linhas 63-67](../v1-ia/codigo2.puml#L63-L67) (`DoacaoService`) e
  [linha 89](../v1-ia/codigo2.puml#L89) (`DoacaoService ..> SQLiteDatabase`).
- **Por quê:**
  - A regra de aceite aparece em **três** lugares. No código ela mora só em `aceitar()` de
    `src/doacoes.js`, e a trava fica no SQL de `src/repositorio.js`.
  - O serviço depende **direto** do SQLite, sem repositório nem `db.js`. Isso contradiz a decisão
    do README, "a troca do banco fica contida em `db.js`", tomada para a migração para PostgreSQL
    na U3.
- **Correção:** os quatro módulos reais aparecem com o estereótipo `<<módulo>>` e dependência num
  único sentido, `app.js → doacoes.js → repositorio.js → db.js`
  ([linhas 7-41](codigo2.puml#L7-L41) e [62-66](codigo2.puml#L62-L66)). A `Doacao` virou
  `<<tabela>>`, só com dados. As notas mostram onde está cada regra
  ([linhas 76-87](codigo2.puml#L76-L87)).

### CL-6 · EXAGERO · Endereço, geolocalização e notificação

- **Onde (v1):**
  - [linhas 35-42](../v1-ia/codigo2.puml#L35-L42): `Endereco` com latitude, longitude e
    `calcularDistancia()`
  - [linhas 15](../v1-ia/codigo2.puml#L15), [23-24](../v1-ia/codigo2.puml#L23-L24) e
    [86-87](../v1-ia/codigo2.puml#L86-L87): endereço e raio de atuação
  - [linhas 69-74](../v1-ia/codigo2.puml#L69-L74) e [90-91](../v1-ia/codigo2.puml#L90-L91):
    `Notificacao`
- **Por quê:** a RN4 (proximidade) está fora do escopo e a notificação é só hipótese do
  experimento.
- **Correção:** removidos.

---

## Detalhes para mencionar na apresentação

- O código **não** é orientado a objetos: são módulos JavaScript e uma tabela. Por isso o
  diagrama de classes final usa os estereótipos `<<módulo>>` e `<<tabela>>` de propósito, sem
  inventar classes.
- O estereótipo `<<pendente>>` nos casos de uso separa o que existe (H1, H2 e H3) do que ainda
  foi só planejado (H4 e H5).
- Cada caso de uso traz o número da história (H1 a H5) e as notas trazem as RNs: é a
  rastreabilidade entre requisito e modelo.
- A IA errou mais por **exagero** do que por omissão: completou o sistema com o que um sistema
  "típico" teria (login, CRUD, notificação, geolocalização). O trabalho do grupo foi cortar até
  sobrar o que o caso e o código sustentam.
- A IA recebeu só os requisitos, não o código. Por isso acertou o vocabulário e errou na
  estrutura.
