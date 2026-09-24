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
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (erro) => {
    if (erro) {
      console.error('Erro ao garantir tabela datas_importantes:', erro.message);
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
