const db = require("../config/db");

// =====================================================
// LISTAR ATIVIDADES DO USUÁRIO
// =====================================================

function listarAtividades(usuarioId, callback) {
    const sql = `
        SELECT *
        FROM cronograma_atividades
        WHERE usuario_id = ?
        ORDER BY data ASC, horario ASC
    `;

    db.all(sql, [usuarioId], callback);
}

// =====================================================
// BUSCAR UMA ATIVIDADE POR ID
// (usado para checar o dono antes de editar/excluir)
// =====================================================

function buscarAtividadePorId(id, callback) {
    const sql = `
        SELECT *
        FROM cronograma_atividades
        WHERE id = ?
    `;

    db.get(sql, [id], callback);
}

// =====================================================
// CRIAR UMA ATIVIDADE
// =====================================================

function criarAtividade(
    usuarioId,
    dados,
    callback
) {
    const sql = `
        INSERT INTO cronograma_atividades
        (
            usuario_id,
            data,
            horario,
            nome,
            materia,
            concluida,
            origem,
            topico_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            usuarioId,
            dados.data,
            dados.horario,
            dados.nome,
            dados.materia,
            dados.concluida ? 1 : 0,
            dados.origem || null,
            dados.topicoId || null
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            callback(null, this);
        }
    );
}

// =====================================================
// CRIAR VÁRIAS ATIVIDADES DE UMA VEZ
// (usado pelo Plano Automático)
// =====================================================

function criarAtividadesEmLote(
    usuarioId,
    listaAtividades,
    callback
) {
    if (!listaAtividades.length) {
        return callback(null, []);
    }

    const criadas = [];
    let houveErro = null;

    db.serialize(() => {

        db.run("BEGIN TRANSACTION");

        const stmt = db.prepare(`
            INSERT INTO cronograma_atividades
            (
                usuario_id,
                data,
                horario,
                nome,
                materia,
                concluida,
                origem,
                topico_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        listaAtividades.forEach((atividade) => {

            stmt.run(
                [
                    usuarioId,
                    atividade.data,
                    atividade.horario || "08:00",
                    atividade.nome,
                    atividade.materia,
                    atividade.concluida ? 1 : 0,
                    atividade.origem || null,
                    atividade.topicoId || null
                ],
                function (erro) {
                    if (erro) {
                        houveErro = erro;
                        return;
                    }

                    criadas.push(this.lastID);
                }
            );
        });

        stmt.finalize((erroFinalize) => {

            if (erroFinalize || houveErro) {
                db.run("ROLLBACK");
                return callback(erroFinalize || houveErro);
            }

            db.run("COMMIT", (erroCommit) => {

                if (erroCommit) {
                    return callback(erroCommit);
                }

                callback(null, criadas);
            });
        });
    });
}

// =====================================================
// ATUALIZAR ATIVIDADE
// (atualização parcial — só troca o que for enviado)
// =====================================================

function atualizarAtividade(
    id,
    dados,
    callback
) {
    const campos = [];
    const valores = [];

    if (dados.nome !== undefined) {
        campos.push("nome = ?");
        valores.push(dados.nome);
    }

    if (dados.materia !== undefined) {
        campos.push("materia = ?");
        valores.push(dados.materia);
    }

    if (dados.data !== undefined) {
        campos.push("data = ?");
        valores.push(dados.data);
    }

    if (dados.horario !== undefined) {
        campos.push("horario = ?");
        valores.push(dados.horario);
    }

    if (dados.concluida !== undefined) {
        campos.push("concluida = ?");
        valores.push(dados.concluida ? 1 : 0);
    }

    if (!campos.length) {
        return callback(
            new Error("Nenhum campo para atualizar.")
        );
    }

    valores.push(id);

    const sql = `
        UPDATE cronograma_atividades
        SET ${campos.join(", ")}
        WHERE id = ?
    `;

    db.run(sql, valores, function (erro) {
        if (erro) {
            return callback(erro);
        }

        callback(null, this);
    });
}

// =====================================================
// EXCLUIR UMA ATIVIDADE
// =====================================================

function excluirAtividade(id, callback) {
    const sql = `
        DELETE FROM cronograma_atividades
        WHERE id = ?
    `;

    db.run(sql, [id], function (erro) {
        if (erro) {
            return callback(erro);
        }

        callback(null, this);
    });
}

// =====================================================
// EXCLUIR TODAS AS ATIVIDADES DE UMA ORIGEM
// (ex.: apagar tudo que veio do plano automático)
// =====================================================

function excluirAtividadesPorOrigem(
    usuarioId,
    origem,
    callback
) {
    const sql = `
        DELETE FROM cronograma_atividades
        WHERE usuario_id = ?
        AND origem = ?
    `;

    db.run(sql, [usuarioId, origem], function (erro) {
        if (erro) {
            return callback(erro);
        }

        callback(null, this);
    });
}

module.exports = {
    listarAtividades,
    buscarAtividadePorId,
    criarAtividade,
    criarAtividadesEmLote,
    atualizarAtividade,
    excluirAtividade,
    excluirAtividadesPorOrigem
};