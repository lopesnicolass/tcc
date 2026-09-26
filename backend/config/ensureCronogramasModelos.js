const db = require('./db');

// Estrutura dos cronogramas que o administrador monta por frequência,
// mês, semana e sessão. Mantemos as tabelas antigas intactas para evitar
// perda de dados de versões anteriores do projeto.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cronogramas_programados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      frequencia_dias INTEGER NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (erro) => {
    if (erro) {
      console.error('Erro ao garantir tabela cronogramas_programados:', erro.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS cronogramas_programados_sessoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programacao_id INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      semana INTEGER NOT NULL,
      sessao INTEGER NOT NULL,
      materia_id INTEGER NOT NULL,
      topico_id INTEGER NOT NULL,
      dia_estudo INTEGER NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (programacao_id)
        REFERENCES cronogramas_programados(id)
        ON DELETE CASCADE,
      FOREIGN KEY (materia_id)
        REFERENCES materias(id)
        ON DELETE CASCADE,
      FOREIGN KEY (topico_id)
        REFERENCES topicos(id)
        ON DELETE CASCADE,
      UNIQUE (programacao_id, mes, semana, sessao)
    )
  `, (erro) => {
    if (erro) {
      console.error('Erro ao garantir tabela cronogramas_programados_sessoes:', erro.message);
    }
  });

  db.all(`PRAGMA table_info(cronogramas_programados_sessoes)`, (erroInfo, colunas) => {
    if (erroInfo) {
      console.error('Erro ao verificar estrutura de sessões do cronograma:', erroInfo.message);
      return;
    }

    const possuiDiaEstudo = (colunas || []).some((coluna) => coluna.name === 'dia_estudo');
    if (possuiDiaEstudo) return;

    db.run(
      `ALTER TABLE cronogramas_programados_sessoes ADD COLUMN dia_estudo INTEGER NOT NULL DEFAULT 1`,
      (erroAlteracao) => {
        if (erroAlteracao) {
          console.error('Erro ao adicionar dia_estudo às sessões do cronograma:', erroAlteracao.message);
          return;
        }

        // Dados antigos continuam válidos: distribuímos as posições existentes
        // entre os 7 dias para preservar o comportamento anterior até o admin revisar.
        db.run(
          `UPDATE cronogramas_programados_sessoes
           SET dia_estudo = ((sessao - 1) % 7) + 1`,
          (erroAtualizacao) => {
            if (erroAtualizacao) {
              console.error('Erro ao migrar os dias das sessões do cronograma:', erroAtualizacao.message);
            }
          }
        );
      }
    );
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_frequencia
    ON cronogramas_programados(frequencia_dias)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_sessoes_programacao
    ON cronogramas_programados_sessoes(programacao_id, mes, semana, sessao)
  `);
});

module.exports = db;
