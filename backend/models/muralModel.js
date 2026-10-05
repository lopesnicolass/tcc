const db = require("../config/db");

const {
    normalizarMateriaMural
} = require("../utils/materiaUtils");


// =====================================================
// LISTAR POST-ITS DO USUÁRIO
// =====================================================

function listarPostits(
    usuarioId,
    callback
) {

    const sql = `
        SELECT
            id,
            usuario_id,
            materia,
            texto,
            data_criacao
        FROM mural_postits
        WHERE usuario_id = ?
        ORDER BY data_criacao DESC, id DESC
    `;

    db.all(
        sql,
        [usuarioId],
        (erro, postits) => {

            if (erro) {

                console.error(
                    "❌ Erro ao listar post-its:",
                    erro.message
                );

                return callback(
                    erro,
                    null
                );
            }

            const postitsNormalizados =
                (postits || []).map(
                    (postit) => ({
                        ...postit,

                        materia:
                            normalizarMateriaMural(
                                postit.materia
                            )
                    })
                );

            callback(
                null,
                postitsNormalizados
            );
        }
    );
}


// =====================================================
// CRIAR POST-IT
// =====================================================

function criarPostit(
    usuarioId,
    materia,
    texto,
    callback
) {

    const materiaNormalizada =
        normalizarMateriaMural(
            materia
        );

    const sql = `
        INSERT INTO mural_postits
        (
            usuario_id,
            materia,
            texto
        )
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [
            usuarioId,
            materiaNormalizada,
            texto
        ],
        function (erro) {

            if (erro) {

                console.error(
                    "❌ Erro ao criar post-it:",
                    erro.message
                );

                return callback(
                    erro,
                    null
                );
            }

            callback(
                null,
                {
                    id: this.lastID,
                    usuario_id: usuarioId,
                    materia: materiaNormalizada,
                    texto
                }
            );
        }
    );
}


// =====================================================
// ATUALIZAR POST-IT
// =====================================================

function atualizarPostit(
    id,
    usuarioId,
    materia,
    texto,
    callback
) {

    const materiaNormalizada =
        normalizarMateriaMural(
            materia
        );

    const sql = `
        UPDATE mural_postits
        SET
            materia = ?,
            texto = ?
        WHERE
            id = ?
            AND usuario_id = ?
    `;

    db.run(
        sql,
        [
            materiaNormalizada,
            texto,
            id,
            usuarioId
        ],
        function (erro) {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar post-it:",
                    erro.message
                );

                return callback(
                    erro,
                    null
                );
            }

            if (this.changes === 0) {

                return callback(
                    new Error(
                        "Post-it não encontrado."
                    ),
                    null
                );
            }

            callback(
                null,
                {
                    id,
                    usuario_id: usuarioId,
                    materia: materiaNormalizada,
                    texto
                }
            );
        }
    );
}


// =====================================================
// EXCLUIR POST-IT
// =====================================================

function excluirPostit(
    id,
    usuarioId,
    callback
) {

    const sql = `
        DELETE FROM mural_postits
        WHERE
            id = ?
            AND usuario_id = ?
    `;

    db.run(
        sql,
        [
            id,
            usuarioId
        ],
        function (erro) {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir post-it:",
                    erro.message
                );

                return callback(
                    erro,
                    null
                );
            }

            if (this.changes === 0) {

                return callback(
                    new Error(
                        "Post-it não encontrado."
                    ),
                    null
                );
            }

            callback(
                null,
                {
                    mensagem:
                        "Post-it excluído com sucesso."
                }
            );
        }
    );
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
    listarPostits,
    criarPostit,
    atualizarPostit,
    excluirPostit
};