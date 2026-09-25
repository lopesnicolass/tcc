const db = require('../config/db');

const CRONOGRAMA_BASE = 0;
const CONFIG_TABLE = 'cronogramas_programados_config';

function ensureConfigTable(callback) {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (
        programacao_id INTEGER PRIMARY KEY,
        meses INTEGER NOT NULL DEFAULT 12,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    callback
  );
}

function mapearModelo(linha) {
  const meses = Number(linha.meses || 12);

  return {
    id: linha.id,
    frequencia_dias: null,
    meses,
    nome: linha.nome,
    descricao: linha.descricao || '',
    ativo: Boolean(linha.ativo),
    criado_em: linha.criado_em,
    atualizado_em: linha.atualizado_em,
    sessoes: [],
    total_sessoes: 0,
    sessoes_preenchidas: 0,
    total_semanas: meses * 4
  };
}

function buscarItens(programacaoId, callback) {
  db.all(
    `
      SELECT
        s.id,
        s.programacao_id,
        s.mes,
        s.semana,
        s.sessao,
        s.materia_id,
        m.nome AS materia,
        s.topico_id,
        t.nome AS topico,
        t.descricao AS topico_descricao
      FROM cronogramas_programados_sessoes s
      INNER JOIN materias m ON m.id = s.materia_id
      INNER JOIN topicos t ON t.id = s.topico_id
      WHERE s.programacao_id = ?
      ORDER BY s.mes ASC, s.semana ASC, s.sessao ASC
    `,
    [programacaoId],
    callback
  );
}

function anexarItens(modelo, callback) {
  buscarItens(modelo.id, (erro, sessoes) => {
    if (erro) return callback(erro);

    modelo.sessoes = sessoes || [];
    modelo.sessoes_preenchidas = modelo.sessoes.length;
    modelo.total_sessoes = modelo.sessoes.length;
    callback(null, modelo);
  });
}

function selectModelo(baseWhere, params, callback) {
  db.get(
    `
      SELECT
        cp.id,
        cp.frequencia_dias,
        cp.nome,
        cp.descricao,
        cp.ativo,
        cp.criado_em,
        cp.atualizado_em,
        COALESCE(cfg.meses, 12) AS meses
      FROM cronogramas_programados cp
      LEFT JOIN ${CONFIG_TABLE} cfg ON cfg.programacao_id = cp.id
      WHERE ${baseWhere}
      LIMIT 1
    `,
    params,
    (erro, linha) => {
      if (erro) return callback(erro);
      if (!linha) return callback(null, null);
      anexarItens(mapearModelo(linha), callback);
    }
  );
}

function buscarModeloBase(callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    selectModelo(
      'cp.frequencia_dias = ? AND cp.ativo = 1',
      [CRONOGRAMA_BASE],
      callback
    );
  });
}

function listarModelos(callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    selectModelo('cp.frequencia_dias = ?', [CRONOGRAMA_BASE], (erro, modelo) => {
      if (erro) return callback(erro);
      callback(null, modelo ? [modelo] : []);
    });
  });
}

function buscarModeloPorId(id, callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    selectModelo(
      'cp.id = ? AND cp.frequencia_dias = ?',
      [id, CRONOGRAMA_BASE],
      callback
    );
  });
}

function buscarModeloPorFrequencia(_frequencia, callback) {
  buscarModeloBase(callback);
}

function validarMeses(meses) {
  const valor = Number(meses);
  return Number.isInteger(valor) && valor >= 1 && valor <= 12 ? valor : null;
}

function validarItens(sessoes, meses, callback) {
  if (!Array.isArray(sessoes)) {
    return callback(new Error('A configuração do cronograma é inválida.'));
  }

  const recebidas = sessoes.map((item) => ({
    mes: Number(item.mes),
    semana: Number(item.semana),
    sessao: Number(item.sessao),
    materiaId: Number(item.materiaId),
    topicoId: Number(item.topicoId)
  }));

  const chaves = new Set();

  for (const item of recebidas) {
    if (item.mes < 1 || item.mes > meses) {
      return callback(new Error(`O mês precisa estar entre 1 e ${meses}.`));
    }

    if (item.semana < 1 || item.semana > 4) {
      return callback(new Error('A semana precisa estar entre 1 e 4.'));
    }

    if (item.sessao < 1) {
      return callback(new Error('A ordem do conteúdo precisa ser maior que zero.'));
    }

    if (!item.materiaId || !item.topicoId) {
      return callback(new Error('Cada conteúdo do cronograma precisa ter matéria e conteúdo.'));
    }

    const chave = `${item.mes}-${item.semana}-${item.sessao}`;
    if (chaves.has(chave)) {
      return callback(new Error('Não pode haver duas configurações para a mesma posição da semana.'));
    }
    chaves.add(chave);
  }

  if (!recebidas.length) {
    return callback(null, []);
  }

  let restantes = recebidas.length;
  let primeiroErro = null;

  recebidas.forEach((item, index) => {
    db.get(
      `
        SELECT
          t.id AS topico_id,
          t.materia_id,
          t.ativo,
          m.ativa
        FROM topicos t
        INNER JOIN materias m ON m.id = t.materia_id
        WHERE t.id = ?
          AND t.materia_id = ?
      `,
      [item.topicoId, item.materiaId],
      (erro, linha) => {
        if (erro && !primeiroErro) {
          primeiroErro = erro;
        } else if (!linha || Number(linha.ativo) !== 1 || Number(linha.ativa) !== 1) {
          primeiroErro = primeiroErro || new Error(`O conteúdo ${index + 1} do cronograma não está disponível.`);
        }

        restantes -= 1;
        if (restantes === 0) {
          callback(primeiroErro, primeiroErro ? null : recebidas);
        }
      }
    );
  });
}

function inserirItens(programacaoId, sessoes, callback) {
  if (!sessoes.length) return callback(null);

  let indice = 0;

  function proximo() {
    if (indice >= sessoes.length) return callback(null);

    const item = sessoes[indice++];
    db.run(
      `
        INSERT INTO cronogramas_programados_sessoes
          (programacao_id, mes, semana, sessao, materia_id, topico_id, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [item.programacaoId || programacaoId, item.mes, item.semana, item.sessao, item.materiaId, item.topicoId],
      (erro) => {
        if (erro) return callback(erro);
        proximo();
      }
    );
  }

  proximo();
}

function criarModelo(dados, callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    const meses = validarMeses(dados.meses);
    if (!meses) return callback(new Error('A quantidade de meses precisa estar entre 1 e 12.'));

    validarItens(dados.sessoes, meses, (erroValidacao, sessoes) => {
      if (erroValidacao) return callback(erroValidacao);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get(
          `SELECT id FROM cronogramas_programados WHERE frequencia_dias = ?`,
          [CRONOGRAMA_BASE],
          (erroExistente, existente) => {
            if (erroExistente) {
              return db.run('ROLLBACK', () => callback(erroExistente));
            }

            if (existente) {
              return db.run('ROLLBACK', () => callback(new Error('Já existe um cronograma configurado. Edite o cronograma atual.')));
            }

            db.run(
              `
                INSERT INTO cronogramas_programados
                  (frequencia_dias, nome, descricao, ativo, atualizado_em)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
              `,
              [CRONOGRAMA_BASE, dados.nome, dados.descricao || ''],
              function (erroInsercao) {
                if (erroInsercao) {
                  return db.run('ROLLBACK', () => callback(erroInsercao));
                }

                const programacaoId = this.lastID;

                db.run(
                  `
                    INSERT OR REPLACE INTO ${CONFIG_TABLE}
                      (programacao_id, meses, atualizado_em)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                  `,
                  [programacaoId, meses],
                  (erroConfiguracao) => {
                    if (erroConfiguracao) {
                      return db.run('ROLLBACK', () => callback(erroConfiguracao));
                    }

                    inserirItens(programacaoId, sessoes, (erroItens) => {
                      if (erroItens) {
                        return db.run('ROLLBACK', () => callback(erroItens));
                      }

                      db.run('COMMIT', (erroCommit) => {
                        if (erroCommit) return callback(erroCommit);
                        buscarModeloPorId(programacaoId, callback);
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

function atualizarModelo(id, dados, callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    const meses = validarMeses(dados.meses);
    if (!meses) return callback(new Error('A quantidade de meses precisa estar entre 1 e 12.'));

    validarItens(dados.sessoes, meses, (erroValidacao, sessoes) => {
      if (erroValidacao) return callback(erroValidacao);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `
            UPDATE cronogramas_programados
            SET nome = ?,
                descricao = ?,
                ativo = 1,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
              AND frequencia_dias = ?
          `,
          [dados.nome, dados.descricao || '', id, CRONOGRAMA_BASE],
          function (erroAtualizacao) {
            if (erroAtualizacao || this.changes === 0) {
              return db.run('ROLLBACK', () => callback(erroAtualizacao || new Error('Cronograma não encontrado.')));
            }

            db.run(
              `
                INSERT OR REPLACE INTO ${CONFIG_TABLE}
                  (programacao_id, meses, atualizado_em)
                VALUES (?, ?, CURRENT_TIMESTAMP)
              `,
              [id, meses],
              (erroConfiguracao) => {
                if (erroConfiguracao) {
                  return db.run('ROLLBACK', () => callback(erroConfiguracao));
                }

                db.run(
                  `DELETE FROM cronogramas_programados_sessoes WHERE programacao_id = ?`,
                  [id],
                  (erroExclusao) => {
                    if (erroExclusao) {
                      return db.run('ROLLBACK', () => callback(erroExclusao));
                    }

                    inserirItens(id, sessoes, (erroItens) => {
                      if (erroItens) {
                        return db.run('ROLLBACK', () => callback(erroItens));
                      }

                      db.run('COMMIT', (erroCommit) => {
                        if (erroCommit) return callback(erroCommit);
                        buscarModeloPorId(id, callback);
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

function excluirModelo(id, callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    db.run(
      `DELETE FROM cronogramas_programados WHERE id = ? AND frequencia_dias = ?`,
      [id, CRONOGRAMA_BASE],
      function (erro) {
        if (erro) return callback(erro, null);

        const excluiu = this.changes > 0;
        if (!excluiu) return callback(null, false);

        db.run(
          `DELETE FROM ${CONFIG_TABLE} WHERE programacao_id = ?`,
          [id],
          (erroConfig) => callback(erroConfig, erroConfig ? null : true)
        );
      }
    );
  });
}

function ativarModelo(id, callback) {
  db.run(
    `UPDATE cronogramas_programados SET ativo = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ? AND frequencia_dias = ?`,
    [id, CRONOGRAMA_BASE],
    function (erro) {
      if (erro) return callback(erro);
      if (this.changes === 0) return callback(new Error('Cronograma não encontrado.'));
      buscarModeloPorId(id, callback);
    }
  );
}

module.exports = {
  listarModelos,
  buscarModeloPorId,
  buscarModeloPorFrequencia,
  criarModelo,
  atualizarModelo,
  excluirModelo,
  ativarModelo
};
