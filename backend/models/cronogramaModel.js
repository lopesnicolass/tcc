const db = require("../config/db");

// =====================================================
// LISTAR ATIVIDADES DO USUÁRIO
// =====================================================

function listarAtividades(usuarioId, callback) {

    const sql = `
        SELECT *
        FROM cronograma_atividades
        WHERE usuario_id = ?
        ORDER BY
            data ASC,
            horario ASC,
            id ASC
    `;

    db.all(
        sql,
        [usuarioId],
        callback
    );
}


// =====================================================
// BUSCAR UMA ATIVIDADE POR ID
// =====================================================

function buscarAtividadePorId(
    id,
    callback
) {

    const sql = `
        SELECT *
        FROM cronograma_atividades
        WHERE id = ?
    `;

    db.get(
        sql,
        [id],
        callback
    );
}


// =====================================================
// INSERIR UMA ATIVIDADE
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
            dados.horario || "08:00",
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

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// INSERIR VÁRIAS ATIVIDADES
// =====================================================

function inserirAtividades(
    usuarioId,
    listaAtividades,
    callback
) {

    if (
        !Array.isArray(listaAtividades) ||
        !listaAtividades.length
    ) {
        return callback(
            null,
            []
        );
    }


    const idsCriados = [];
    let indice = 0;


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


    function proximo() {

        if (
            indice >=
            listaAtividades.length
        ) {

            return stmt.finalize(
                (erroFinalize) => {

                    if (erroFinalize) {
                        return callback(
                            erroFinalize
                        );
                    }

                    callback(
                        null,
                        idsCriados
                    );
                }
            );
        }


        const atividade =
            listaAtividades[indice++];


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

                    return stmt.finalize(
                        () => callback(erro)
                    );
                }


                idsCriados.push(
                    this.lastID
                );

                proximo();
            }
        );
    }


    proximo();
}


// =====================================================
// CRIAR VÁRIAS ATIVIDADES EM LOTE
//
// A substituição da origem e a inserção acontecem
// na MESMA transação.
// =====================================================

function salvarAtividadesEmLote(
    usuarioId,
    listaAtividades,
    origemParaSubstituir,
    callback
) {

    if (
        !Array.isArray(listaAtividades) ||
        !listaAtividades.length
    ) {

        return callback(
            new Error(
                "Nenhuma atividade foi enviada."
            )
        );
    }


    db.serialize(() => {

        db.run(
            "BEGIN IMMEDIATE TRANSACTION",
            (erroInicio) => {

                if (erroInicio) {
                    return callback(
                        erroInicio
                    );
                }


                function rollback(erro) {

                    db.run(
                        "ROLLBACK",
                        () => callback(
                            erro
                        )
                    );
                }


                function inserir() {

                    inserirAtividades(
                        usuarioId,
                        listaAtividades,
                        (erroInsercao, ids) => {

                            if (erroInsercao) {

                                return rollback(
                                    erroInsercao
                                );
                            }


                            db.run(
                                "COMMIT",
                                (erroCommit) => {

                                    if (erroCommit) {
                                        return rollback(
                                            erroCommit
                                        );
                                    }


                                    callback(
                                        null,
                                        ids
                                    );
                                }
                            );
                        }
                    );
                }


                if (
                    !origemParaSubstituir
                ) {
                    return inserir();
                }


                db.run(
                    `
                        DELETE FROM cronograma_atividades
                        WHERE usuario_id = ?
                          AND origem = ?
                    `,
                    [
                        usuarioId,
                        origemParaSubstituir
                    ],
                    (erroExclusao) => {

                        if (erroExclusao) {

                            return rollback(
                                erroExclusao
                            );
                        }


                        inserir();
                    }
                );
            }
        );
    });
}


// =====================================================
// COMPATIBILIDADE
// =====================================================

function criarAtividadesEmLote(
    usuarioId,
    listaAtividades,
    callback
) {

    salvarAtividadesEmLote(
        usuarioId,
        listaAtividades,
        null,
        callback
    );
}


// =====================================================
// ATUALIZAR ATIVIDADE
// =====================================================

function atualizarAtividade(
    id,
    dados,
    callback
) {

    const campos = [];
    const valores = [];


    if (
        dados.nome !== undefined
    ) {
        campos.push(
            "nome = ?"
        );

        valores.push(
            dados.nome
        );
    }


    if (
        dados.materia !== undefined
    ) {
        campos.push(
            "materia = ?"
        );

        valores.push(
            dados.materia
        );
    }


    if (
        dados.data !== undefined
    ) {
        campos.push(
            "data = ?"
        );

        valores.push(
            dados.data
        );
    }


    if (
        dados.horario !== undefined
    ) {
        campos.push(
            "horario = ?"
        );

        valores.push(
            dados.horario
        );
    }


    if (
        dados.concluida !== undefined
    ) {
        campos.push(
            "concluida = ?"
        );

        valores.push(
            dados.concluida ? 1 : 0
        );
    }


    if (!campos.length) {

        return callback(
            new Error(
                "Nenhum campo para atualizar."
            )
        );
    }


    valores.push(id);


    db.run(
        `
            UPDATE cronograma_atividades
            SET ${campos.join(", ")}
            WHERE id = ?
        `,
        valores,
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// EXCLUIR UMA ATIVIDADE
// =====================================================

function excluirAtividade(
    id,
    callback
) {

    db.run(
        `
            DELETE FROM cronograma_atividades
            WHERE id = ?
        `,
        [id],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// EXCLUIR TODAS DE UMA ORIGEM
// =====================================================

function excluirAtividadesPorOrigem(
    usuarioId,
    origem,
    callback
) {

    db.run(
        `
            DELETE FROM cronograma_atividades
            WHERE usuario_id = ?
              AND origem = ?
        `,
        [
            usuarioId,
            origem
        ],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this
            );
        }
    );
}


module.exports = {
    listarAtividades,
    buscarAtividadePorId,
    criarAtividade,
    criarAtividadesEmLote,
    salvarAtividadesEmLote,
    atualizarAtividade,
    excluirAtividade,
    excluirAtividadesPorOrigem
};