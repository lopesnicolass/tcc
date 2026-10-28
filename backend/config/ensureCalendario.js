const db = require('./db');

// Garante que a tabela de datas importantes exista mesmo em bancos
// antigos que foram criados antes da funcionalidade do calendário.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS datas_importantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'Outro',
      data TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      horario TEXT DEFAULT '',
      link TEXT DEFAULT '',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (erro) => {
    if (erro) {
      console.error('Erro ao garantir tabela datas_importantes:', erro.message);
    }
  });

  // Migracao aditiva: preserva eventos cadastrados em bancos antigos.
  db.all('PRAGMA table_info(datas_importantes)', (erro, colunas = []) => {
    if (erro) {
      console.error('Erro ao consultar colunas de datas_importantes:', erro.message);
      return;
    }
    const existentes = new Set(colunas.map((coluna) => coluna.name));
    for (const campo of ['horario', 'link']) {
      if (existentes.has(campo)) continue;
      db.run(`ALTER TABLE datas_importantes ADD COLUMN ${campo} TEXT DEFAULT ''`, (falha) => {
        if (falha && !/duplicate column name/i.test(falha.message)) {
          console.error(`Erro ao adicionar coluna ${campo}:`, falha.message);
        }
      });
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_datas_importantes_data
    ON datas_importantes(data)
  `, (erro) => {
    if (erro) {
      console.error('Erro ao garantir índice de datas_importantes:', erro.message);
    }
  });
});

module.exports = db;
