const db = require('./db');

// =====================================================
// CRONOGRAMA BASE DO PLANO AUTOMÁTICO
// =====================================================

// O projeto usa um único cronograma-base definido pelo administrador.
// Mantemos frequencia_dias = 0 para compatibilidade com versões anteriores.
const CRONOGRAMA_BASE = 0;


db.serialize(() => {
  // ===================================================
  // CRONOGRAMA PRINCIPAL
  // ===================================================

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
      console.error(
        '❌ Erro ao garantir tabela cronogramas_programados:',
        erro.message
      );
    }
  });

  // ===================================================
  // CONFIGURAÇÃO DO NÚMERO DE MESES
  // ===================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS cronogramas_programados_config (
      programacao_id INTEGER PRIMARY KEY,
      meses INTEGER NOT NULL DEFAULT 12,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (programacao_id)
        REFERENCES cronogramas_programados(id)
        ON DELETE CASCADE
    )
  `, (erro) => {
    if (erro) {
      console.error(
        '❌ Erro ao garantir tabela cronogramas_programados_config:',
        erro.message
      );
    }
  });

  // ===================================================
  // SESSÕES / CONTEÚDOS DO CRONOGRAMA
  // ===================================================

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
      console.error(
        '❌ Erro ao garantir tabela cronogramas_programados_sessoes:',
        erro.message
      );
    }
  });

  // ===================================================
  // MIGRAÇÃO — DIA DE ESTUDO
  // ===================================================

  db.all(
    `PRAGMA table_info(cronogramas_programados_sessoes)`,
    (erroInfo, colunas) => {
      if (erroInfo) {
        console.error(
          '❌ Erro ao verificar estrutura das sessões:',
          erroInfo.message
        );
        return;
      }

      const possuiDiaEstudo =
        (colunas || []).some(
          (coluna) => coluna.name === 'dia_estudo'
        );

      if (possuiDiaEstudo) {
        return;
      }

      db.run(
        `
          ALTER TABLE cronogramas_programados_sessoes
          ADD COLUMN dia_estudo INTEGER NOT NULL DEFAULT 1
        `,
        (erroAlteracao) => {
          if (erroAlteracao) {
            console.error(
              '❌ Erro ao adicionar dia_estudo:',
              erroAlteracao.message
            );
            return;
          }

          // Preserva dados antigos distribuindo as sessões pelos dias 1..7.
          db.run(
            `
              UPDATE cronogramas_programados_sessoes
              SET dia_estudo = ((sessao - 1) % 7) + 1
            `,
            (erroAtualizacao) => {
              if (erroAtualizacao) {
                console.error(
                  '❌ Erro ao migrar dias das sessões:',
                  erroAtualizacao.message
                );
              }
            }
          );
        }
      );
    }
  );

  // ===================================================
  // ÍNDICES
  // ===================================================

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_frequencia
    ON cronogramas_programados(frequencia_dias)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_ativo
    ON cronogramas_programados(ativo)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_config_meses
    ON cronogramas_programados_config(meses)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_sessoes_programacao
    ON cronogramas_programados_sessoes(
      programacao_id,
      mes,
      semana,
      sessao
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_cronogramas_programados_sessoes_topico
    ON cronogramas_programados_sessoes(topico_id)
  `);
});

module.exports = {
  CRONOGRAMA_BASE
};