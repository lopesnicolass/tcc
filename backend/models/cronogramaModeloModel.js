const db = require('../config/db');

// A coluna frequencia_dias é UNIQUE no banco antigo. Para preservar as tabelas
// e não tocar nos planos existentes, codificamos a variação como meses * 10 + dias.
// Ex.: 2 meses / 3 dias => 23; 4 meses / 3 dias => 43.
// O cronograma legado (frequencia_dias=0) permanece preservado, mas não é usado.
function chaveVariacao(meses, dias) {
  return Number(meses) * 10 + Number(dias);
}
function diasDaChave(chave) {
  return Number(chave) % 10;
}

const CONFIG_TABLE = 'cronogramas_programados_config';
const VERSION_TABLE = 'cronogramas_programados_versoes';
const PUBLISHED_TABLE = 'cronogramas_programados_publicados';
function garantirVersoes(callback) {
  db.run(`CREATE TABLE IF NOT EXISTS ${VERSION_TABLE} (programacao_id INTEGER PRIMARY KEY, versao INTEGER NOT NULL DEFAULT 1, FOREIGN KEY(programacao_id) REFERENCES cronogramas_programados(id) ON DELETE CASCADE)`, callback);
}


function ensureConfigTable(callback) {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (
        programacao_id INTEGER PRIMARY KEY,
        meses INTEGER NOT NULL DEFAULT 12,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    (erro) => erro ? callback(erro) : garantirVersoes((erroVersoes) =>
      erroVersoes ? callback(erroVersoes) : garantirPublicacoes(callback))
  );
}

// Migração não destrutiva: captura uma cópia dos modelos já publicados antes
// de qualquer edição no painel. Novos rascunhos não entram aqui.
function garantirPublicacoes(callback) {
  db.run(`CREATE TABLE IF NOT EXISTS ${PUBLISHED_TABLE} (
    programacao_id INTEGER PRIMARY KEY, modelo_json TEXT NOT NULL,
    versao INTEGER NOT NULL, publicado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (programacao_id) REFERENCES cronogramas_programados(id) ON DELETE CASCADE
  )`, (erroTabela) => {
    if (erroTabela) return callback(erroTabela);
    db.all(`SELECT cp.id, cp.frequencia_dias, cp.nome, cp.descricao, cp.ativo,
      cp.criado_em, cp.atualizado_em, COALESCE(cfg.meses, 12) AS meses,
      COALESCE(v.versao, 1) AS versao FROM cronogramas_programados cp
      LEFT JOIN ${CONFIG_TABLE} cfg ON cfg.programacao_id = cp.id
      LEFT JOIN ${VERSION_TABLE} v ON v.programacao_id = cp.id
      WHERE cp.ativo = 1 AND cp.frequencia_dias BETWEEN 11 AND 127
        AND (cp.frequencia_dias % 10) BETWEEN 1 AND 7`, [], (erro, linhas) => {
      if (erro) return callback(erro);
      let indice = 0;
      function proximo() {
        if (indice >= linhas.length) return callback(null);
        const linha = linhas[indice++];
        db.get(`SELECT programacao_id FROM ${PUBLISHED_TABLE} WHERE programacao_id = ?`, [linha.id], (erroBusca, existente) => {
          if (erroBusca) return callback(erroBusca);
          if (existente) return proximo();
          const base = mapearModelo(linha);
          anexarItens(base, (erroItens, completo) => {
            if (erroItens) return callback(erroItens);
            db.run(`INSERT OR IGNORE INTO ${PUBLISHED_TABLE}(programacao_id, modelo_json, versao) VALUES (?, ?, ?)`,
              [linha.id, JSON.stringify(completo), completo.versao], (erroInsercao) =>
                erroInsercao ? callback(erroInsercao) : proximo());
          });
        });
      }
      proximo();
    });
  });
}

function mapearModelo(linha) {
  const meses = Number(linha.meses || 12);

  return {
    id: linha.id,
    versao: Number(linha.versao || 1),
    versaoPublicada: Number(linha.versao_publicada || 0),
    publicado: linha.modelo_publicado ? JSON.parse(linha.modelo_publicado) : null,
    frequencia_dias: diasDaChave(linha.frequencia_dias),
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
        s.dia_estudo,
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
        COALESCE(cfg.meses, 12) AS meses,
        COALESCE(v.versao, 1) AS versao,
        pub.versao AS versao_publicada, pub.modelo_json AS modelo_publicado
      FROM cronogramas_programados cp
      LEFT JOIN ${CONFIG_TABLE} cfg ON cfg.programacao_id = cp.id
      LEFT JOIN ${VERSION_TABLE} v ON v.programacao_id = cp.id
      LEFT JOIN ${PUBLISHED_TABLE} pub ON pub.programacao_id = cp.id
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

function buscarModeloPorCombinacao(meses, dias, callback) {
  ensureConfigTable((erro) => {
    if (erro) return callback(erro);
    selectModelo('cp.frequencia_dias = ? AND cp.ativo = 1',
      [chaveVariacao(meses, dias)], (erroConsulta, modelo) => {
        if (erroConsulta || !modelo) return callback(erroConsulta, modelo);
        // Estudantes recebem apenas a versão publicada, não alterações em rascunho.
        const publicado = modelo.publicado;
        if (!publicado) return callback(null, null);
        callback(null, { ...publicado, ativo: true, versao: modelo.versaoPublicada,
          versaoPublicada: modelo.versaoPublicada, atualizado_em: publicado.atualizado_em });
      });
  });
}

function listarModelos(callback) {
  ensureConfigTable((erro) => {
    if (erro) return callback(erro);
    db.all(`SELECT cp.id, cp.frequencia_dias, cp.nome, cp.descricao, cp.ativo,
      cp.criado_em, cp.atualizado_em, COALESCE(cfg.meses, 12) AS meses, COALESCE(v.versao, 1) AS versao, pub.versao AS versao_publicada,
      pub.modelo_json AS modelo_publicado
      FROM cronogramas_programados cp
      LEFT JOIN ${CONFIG_TABLE} cfg ON cfg.programacao_id = cp.id
      LEFT JOIN ${VERSION_TABLE} v ON v.programacao_id = cp.id
      LEFT JOIN ${PUBLISHED_TABLE} pub ON pub.programacao_id = cp.id
      WHERE cp.frequencia_dias BETWEEN 11 AND 127
        AND (cp.frequencia_dias % 10) BETWEEN 1 AND 7
        AND (cp.frequencia_dias / 10) = COALESCE(cfg.meses, 12)
      ORDER BY cfg.meses, (cp.frequencia_dias % 10)`, [], (erroLista, linhas) => {
      if (erroLista) return callback(erroLista);
      Promise.all((linhas || []).map((linha) => new Promise((resolve, reject) => {
        anexarItens(mapearModelo(linha), (e, modelo) => e ? reject(e) : resolve(modelo));
      }))).then((modelos) => callback(null, modelos)).catch(callback);
    });
  });
}

function buscarModeloPorId(id, callback) {
  ensureConfigTable((erro) => {
    if (erro) return callback(erro);
    selectModelo('cp.id = ? AND cp.frequencia_dias BETWEEN 11 AND 127', [id], callback);
  });
}

function buscarModeloPorFrequencia(dias, meses, callback) {
  buscarModeloPorCombinacao(meses, dias, callback);
}

function validarMeses(meses) {
  const valor = Number(meses);
  return Number.isInteger(valor) && valor >= 1 && valor <= 12 ? valor : null;
}

function validarItens(sessoes, meses, dias, callback) {
  if (!Array.isArray(sessoes)) {
    return callback(new Error('A configuração do cronograma é inválida.'));
  }

  const recebidas = sessoes.map((item) => ({
    mes: Number(item.mes),
    semana: Number(item.semana),
    sessao: Number(item.sessao),
    diaEstudo: Number(item.diaEstudo || 1),
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

    if (item.diaEstudo < 1 || item.diaEstudo > dias) {
      return callback(new Error(`O dia de estudo precisa estar entre 1 e ${dias} para esta versão.`));
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
          (programacao_id, mes, semana, sessao, dia_estudo, materia_id, topico_id, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [item.programacaoId || programacaoId, item.mes, item.semana, item.sessao, item.diaEstudo, item.materiaId, item.topicoId],
      (erro) => {
        if (erro) return callback(erro);
        proximo();
      }
    );
  }

  proximo();
}

// Reaproveita o ID na mesma posição; assim a chave estável de uma sessão
// não muda só porque o administrador salvou o modelo novamente.
function atualizarItensSemPerderIds(id, sessoes, callback) {
  const chavesNovas = new Set(sessoes.map(s => `${s.mes}:${s.semana}:${s.sessao}`));
  db.all('SELECT id, mes, semana, sessao, materia_id, topico_id FROM cronogramas_programados_sessoes WHERE programacao_id = ?', [id], (erro, antigos) => {
    if (erro) return callback(erro);
    const remover = (antigos || []).filter(s => !chavesNovas.has(`${s.mes}:${s.semana}:${s.sessao}`));
    const existentesPorPosicao = new Map((antigos || []).map(a => [`${a.mes}:${a.semana}:${a.sessao}`, a]));
    let indice = 0;
    function inserir() {
      if (indice >= sessoes.length) return excluir(0);
      const item = sessoes[indice++];
      const antigo = existentesPorPosicao.get(`${item.mes}:${item.semana}:${item.sessao}`);
      // Alterar o conteúdo exige uma nova identidade; do contrário o Calendário
      // poderia associar uma sessão antiga a outra matéria/conteúdo.
      if (antigo && (Number(antigo.topico_id) !== item.topicoId || Number(antigo.materia_id) !== item.materiaId)) {
        return db.run('DELETE FROM cronogramas_programados_sessoes WHERE id = ?', [antigo.id],
          erroExcluir => erroExcluir ? callback(erroExcluir) : gravarItem(item));
      }
      gravarItem(item);
    }
    function gravarItem(item) {
      db.run(`INSERT INTO cronogramas_programados_sessoes
        (programacao_id, mes, semana, sessao, dia_estudo, materia_id, topico_id, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(programacao_id, mes, semana, sessao) DO UPDATE SET
        dia_estudo=excluded.dia_estudo, materia_id=excluded.materia_id,
        topico_id=excluded.topico_id, atualizado_em=CURRENT_TIMESTAMP`,
      [id, item.mes, item.semana, item.sessao, item.diaEstudo, item.materiaId, item.topicoId],
      e => e ? callback(e) : inserir());
    }
    function excluir(indiceRemocao) {
      if (indiceRemocao >= remover.length) return callback(null);
      db.run('DELETE FROM cronogramas_programados_sessoes WHERE id = ?', [remover[indiceRemocao].id],
        e => e ? callback(e) : excluir(indiceRemocao + 1));
    }
    inserir();
  });
}

function criarModelo(dados, callback) {
  ensureConfigTable((erroTabela) => {
    if (erroTabela) return callback(erroTabela);

    const meses = validarMeses(dados.meses);
    if (!meses) return callback(new Error('A quantidade de meses precisa estar entre 1 e 12.'));

    const dias = Number(dados.frequenciaDias);
    if (!Number.isInteger(dias) || dias < 1 || dias > 7) return callback(new Error('Selecione entre 1 e 7 dias por semana.'));
    validarItens(dados.sessoes, meses, dias, (erroValidacao, sessoes) => {
      if (erroValidacao) return callback(erroValidacao);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get(
          `SELECT id FROM cronogramas_programados WHERE frequencia_dias = ?`,
          [chaveVariacao(meses, dias)],
          (erroExistente, existente) => {
            if (erroExistente) {
              return db.run('ROLLBACK', () => callback(erroExistente));
            }

            if (existente) {
              return db.run('ROLLBACK', () => callback(new Error('Já existe um cronograma para esta combinação de meses e dias. Edite-o.')));
            }

            db.run(
              `
                INSERT INTO cronogramas_programados
                  (frequencia_dias, nome, descricao, ativo, atualizado_em)
                VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
              `,
              [chaveVariacao(meses, dias), dados.nome, dados.descricao || ''],
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

    const dias = Number(dados.frequenciaDias);
    if (!Number.isInteger(dias) || dias < 1 || dias > 7) return callback(new Error('Selecione entre 1 e 7 dias por semana.'));
    validarItens(dados.sessoes, meses, dias, (erroValidacao, sessoes) => {
      if (erroValidacao) return callback(erroValidacao);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `
            UPDATE cronogramas_programados
            SET nome = ?,
                descricao = ?,
                atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?
              AND frequencia_dias = ?
          `,
          [dados.nome, dados.descricao || '', id, chaveVariacao(meses, dias)],
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

                atualizarItensSemPerderIds(id, sessoes, (erroItens) => {
                  if (erroItens) return db.run('ROLLBACK', () => callback(erroItens));
                  db.run(`INSERT INTO ${VERSION_TABLE}(programacao_id, versao) VALUES (?, 2)
                    ON CONFLICT(programacao_id) DO UPDATE SET versao = versao + 1`, [id], (erroVersao) => {
                    if (erroVersao) return db.run('ROLLBACK', () => callback(erroVersao));
                    db.run('COMMIT', (erroCommit) => {
                      if (erroCommit) return callback(erroCommit);
                      buscarModeloPorId(id, callback);
                    });
                  });
                });
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
      `DELETE FROM cronogramas_programados WHERE id = ? AND frequencia_dias BETWEEN 11 AND 127`,
      [id],
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

function arquivarModelo(id, callback) {
  db.run(`UPDATE cronogramas_programados SET ativo = 0 WHERE id = ? AND frequencia_dias BETWEEN 11 AND 127`, [id], function(erro) {
    if (erro) return callback(erro);
    if (!this.changes) return callback(new Error('Cronograma não encontrado.'));
    buscarModeloPorId(id, callback);
  });
}

function ativarModelo(id, callback) {
  // Salva a nova versão publicada somente quando o administrador confirma.
  buscarModeloPorId(id, (erroBusca, base) => {
    if (erroBusca || !base) return callback(erroBusca || new Error('Cronograma não encontrado.'));
    const { publicado, versaoPublicada, ...snapshot } = base;
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(`INSERT INTO ${PUBLISHED_TABLE} (programacao_id, modelo_json, versao, publicado_em)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(programacao_id) DO UPDATE SET
          modelo_json = excluded.modelo_json, versao = excluded.versao,
          publicado_em = CURRENT_TIMESTAMP`, [id, JSON.stringify(snapshot), base.versao], (erroPub) => {
        if (erroPub) return db.run('ROLLBACK', () => callback(erroPub));
        db.run(`UPDATE cronogramas_programados SET ativo = 1 WHERE id = ?`, [id], (erroAtivar) => {
          if (erroAtivar) return db.run('ROLLBACK', () => callback(erroAtivar));
          db.run('COMMIT', (erroCommit) => {
            if (erroCommit) return callback(erroCommit);
            buscarModeloPorId(id, callback);
          });
        });
      });
    });
  });
}

module.exports = {
  listarModelos,
  buscarModeloPorId,
  buscarModeloPorFrequencia,
  buscarModeloPorCombinacao,
  criarModelo,
  atualizarModelo,
  excluirModelo,
  ativarModelo,
  arquivarModelo
};
