// Etapa 1 — persistência do Terrário. Não migra saldos antigos do localStorage.
const db = require('./db');

const statements = [
  `CREATE TABLE IF NOT EXISTS terrario_usuario (
    usuario_id INTEGER PRIMARY KEY,
    sementes INTEGER NOT NULL DEFAULT 0 CHECK(sementes >= 0),
    sala_desbloqueada INTEGER NOT NULL DEFAULT 1,
    sala_ativa INTEGER NOT NULL DEFAULT 1,
    total_sessoes_concluidas INTEGER NOT NULL DEFAULT 0,
    tempo_total_foco_segundos INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS terrario_sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    duracao_minutos INTEGER NOT NULL CHECK(duracao_minutos IN (1, 15, 25, 45)),
    restante_segundos INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'em_andamento'
      CHECK(estado IN ('em_andamento', 'pausada', 'concluida', 'cancelada')),
    iniciada_em_ms INTEGER NOT NULL,
    ativo_desde_ms INTEGER,
    concluida_em_ms INTEGER,
    sementes_recebidas INTEGER NOT NULL DEFAULT 0,
    xp_recebido INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_terrario_sessao_ativa
    ON terrario_sessoes(usuario_id)
    WHERE estado IN ('em_andamento', 'pausada')`,
  `CREATE INDEX IF NOT EXISTS idx_terrario_sessoes_usuario
    ON terrario_sessoes(usuario_id, id DESC)`,
  `CREATE TABLE IF NOT EXISTS terrario_inventario (
    usuario_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    equipado INTEGER NOT NULL DEFAULT 0 CHECK(equipado IN (0, 1)),
    posicao_x REAL,
    posicao_y REAL,
    PRIMARY KEY(usuario_id, item_id),
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,
  // Escala de cada móvel: tabela adicional para preservar o inventário existente.
  `CREATE TABLE IF NOT EXISTS terrario_item_escalas (
    usuario_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    escala REAL NOT NULL DEFAULT 1 CHECK(escala >= 0.6 AND escala <= 1.5),
    PRIMARY KEY(usuario_id,item_id),
    FOREIGN KEY(usuario_id,item_id) REFERENCES terrario_inventario(usuario_id,item_id) ON DELETE CASCADE
  )`,
  // Catálogo autoritativo: nunca confiar no preço enviado pelo navegador.
  `CREATE TABLE IF NOT EXISTS terrario_catalogo (
    item_id TEXT PRIMARY KEY,
    preco INTEGER NOT NULL CHECK(preco>=0)
  )`,
  `INSERT OR IGNORE INTO terrario_catalogo(item_id,preco) VALUES
     ('vasinho',0),('mesa',10),('banquinho',6),('luminaria',12),('cama',16)`,
  // Amplia o catálogo sem alterar compras, saldos nem preços dos cinco itens anteriores.
  `INSERT OR IGNORE INTO terrario_catalogo(item_id,preco) VALUES
    ('prateleira',18),('quadro',9),('estante',20),('lampiao',12),
    ('bau',14),('tapete',8),('mesa_redonda',18),('almofada',7),('banquinho_tronco',7)`,
  // Preços oficiais dos itens exclusivos da Sala 2. Nenhuma compra antiga muda.
  `INSERT OR IGNORE INTO terrario_catalogo(item_id,preco) VALUES
    ('s2_mesa',24),('s2_cadeira',10),('s2_estante',22),
    ('s2_mural',14),('s2_calendario',8),('s2_globo',16),
    ('s2_puff',12),('s2_planta',9),('s2_luzes',15),('s2_caixa',7)`,
  // Complementos exclusivos: cadastrados na abertura do backend, sem mexer nos anteriores.
  `INSERT OR IGNORE INTO terrario_catalogo(item_id,preco) VALUES
    ('s2_tapete_redondo',11),('s2_vaso',8),('s2_livros',6),('s2_avisos',12)` ,
  // A inserção do item e o desconto acontecem atomicamente na mesma instrução.
  // INSERT OR IGNORE de um item já adquirido não executa este gatilho.
  `CREATE TRIGGER IF NOT EXISTS trg_terrario_comprar_item
    AFTER INSERT ON terrario_inventario
    WHEN NEW.item_id <> 'vasinho'
    BEGIN
      UPDATE terrario_usuario SET sementes = sementes -
        (SELECT preco FROM terrario_catalogo WHERE item_id=NEW.item_id)
      WHERE usuario_id=NEW.usuario_id;
    END`,
  // Os gatilhos são parte do UPDATE da sessão: sucesso ou falha juntos.
  // Sessões de demonstração (1 minuto) não liberam novas salas nem XP oficial.
  `CREATE TRIGGER IF NOT EXISTS trg_terrario_conclusao
    AFTER UPDATE OF estado ON terrario_sessoes
    WHEN OLD.estado != 'concluida' AND NEW.estado = 'concluida'
    BEGIN
      INSERT OR IGNORE INTO terrario_usuario(usuario_id) VALUES(NEW.usuario_id);
      UPDATE terrario_usuario SET
        sementes = sementes + NEW.sementes_recebidas,
        total_sessoes_concluidas = total_sessoes_concluidas +
          CASE WHEN NEW.duracao_minutos >= 15 THEN 1 ELSE 0 END,
        tempo_total_foco_segundos = tempo_total_foco_segundos +
          NEW.duracao_minutos * 60,
        sala_desbloqueada = CASE
          WHEN total_sessoes_concluidas +
            CASE WHEN NEW.duracao_minutos >= 15 THEN 1 ELSE 0 END >= 5
          THEN MAX(sala_desbloqueada, 2) ELSE sala_desbloqueada END
      WHERE usuario_id = NEW.usuario_id;
      INSERT INTO xp_eventos_verificados(usuario_id, action, referencia, data, quantidade)
        SELECT NEW.usuario_id, 'foco_concluido', CAST(NEW.id AS TEXT),
               date('now'), NEW.xp_recebido
        WHERE NEW.xp_recebido > 0
        ON CONFLICT(usuario_id, action, referencia) DO NOTHING;
    END`
];

db.serialize(() => {
  for (const sql of statements) {
    db.run(sql, (erro) => {
      if (erro) console.error('Erro na migração do Terrário:', erro.message);
    });
  }
});

module.exports = { statements };
