const db = require("../config/db");

// =====================================================
// SALVAR PLANO
// =====================================================

function criarPlano(
    usuarioId,
    meses,
    diasSemana,
    atividades,
    callback
) {
    db.run(
        `
        INSERT INTO planos_automaticos
        (
            usuario_id,
            meses,
            dias_semana
        )
        VALUES (?, ?, ?)
        `,
        [
            usuarioId,
            meses,
            diasSemana
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            const planoId = this.lastID;

            if (!Array.isArray(atividades) || !atividades.length) {
                return callback(null, planoId);
            }

            let concluidas = 0;
            let primeiroErro = null;

            atividades.forEach((atividade) => {
                db.run(
                    `
                    INSERT INTO plano_atividades
                    (
                        plano_id,
                        mes_numero,
                        semana_numero,
                        dia_semana,
                        data_estudo,
                        materia_id,
                        materia,
                        topico_id,
                        topico,
                        descricao,
                        horario,
                        concluida
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        planoId,
                        atividade.mes_numero,
                        atividade.semana_numero,
                        atividade.dia_semana,
                        atividade.data_estudo || null,
                        atividade.materia_id || null,
                        atividade.materia,
                        atividade.topico_id || null,
                        atividade.topico,
                        atividade.descricao || "",
                        atividade.horario || "08:00",
                        atividade.concluida ? 1 : 0
                    ],
                    (erroAtividade) => {
                        if (erroAtividade && !primeiroErro) {
                            primeiroErro = erroAtividade;
                        }

                        concluidas++;

                        if (concluidas === atividades.length) {
                            if (primeiroErro) {
                                return callback(primeiroErro);
                            }

                            callback(null, planoId);
                        }
                    }
                );
            });
        }
    );
}

// =====================================================
// BUSCAR PLANO ATUAL DO USUÁRIO
// =====================================================

function buscarPlanoAtual(
    usuarioId,
    callback
) {
    db.get(
        `
        SELECT
            id,
            usuario_id,
            meses,
            dias_semana,
            data_criacao,
            atualizado_em
        FROM planos_automaticos
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [usuarioId],
        (erro, plano) => {
            if (erro) {
                return callback(erro);
            }

            if (!plano) {
                return callback(null, null);
            }

            db.all(
                `
                SELECT
                    id,
                    plano_id,
                    mes_numero,
                    semana_numero,
                    dia_semana,
                    data_estudo,
                    materia_id,
                    materia,
                    topico_id,
                    topico,
                    descricao,
                    horario,
                    concluida
                FROM plano_atividades
                WHERE plano_id = ?
                ORDER BY
                    mes_numero ASC,
                    semana_numero ASC,
                    id ASC
                `,
                [plano.id],
                (erroAtividades, atividades) => {
                    if (erroAtividades) {
                        return callback(erroAtividades);
                    }

                    callback(null, {
                        ...plano,
                        atividades: atividades || []
                    });
                }
            );
        }
    );
}

// =====================================================
// EXCLUIR PLANOS ANTIGOS DO USUÁRIO
// =====================================================

function excluirPlanosDoUsuario(
    usuarioId,
    callback
) {
    db.run(
        `
        DELETE FROM planos_automaticos
        WHERE usuario_id = ?
        `,
        [usuarioId],
        callback
    );
}

// =====================================================
// ATUALIZAR CONCLUSÃO DA ATIVIDADE
// =====================================================

function atualizarAtividade(
    usuarioId,
    atividadeId,
    concluida,
    callback
) {
    db.run(
        `
        UPDATE plano_atividades
        SET concluida = ?
        WHERE id = ?
          AND plano_id IN (
              SELECT id
              FROM planos_automaticos
              WHERE usuario_id = ?
          )
        `,
        [
            concluida ? 1 : 0,
            atividadeId,
            usuarioId
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this.changes > 0
            );
        }
    );
}

module.exports = {
    criarPlano,
    buscarPlanoAtual,
    excluirPlanosDoUsuario,
    atualizarAtividade
};