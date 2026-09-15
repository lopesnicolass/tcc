const db = require("../config/db");


// =====================================================
// CRIAR SESSÃO DE FLASHCARDS
// =====================================================

function criarSessao(
    usuarioId,
    totalCards,
    callback
) {

    db.run(
        `
            INSERT INTO sessoes_flashcards
            (
                usuario_id,
                total_cards,
                acertos,
                erros
            )
            VALUES (?, ?, 0, 0)
        `,
        [
            usuarioId,
            totalCards
        ],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                {
                    id: this.lastID,
                    usuario_id: usuarioId,
                    total_cards: totalCards,
                    acertos: 0,
                    erros: 0
                }
            );
        }
    );
}


// =====================================================
// BUSCAR SESSÃO
// =====================================================

function buscarSessaoPorId(
    sessaoId,
    callback
) {

    db.get(
        `
            SELECT
                id,
                usuario_id,
                total_cards,
                acertos,
                erros,
                data_inicio,
                data_fim

            FROM sessoes_flashcards

            WHERE id = ?
        `,
        [sessaoId],
        callback
    );
}


// =====================================================
// REGISTRAR RESPOSTA
// =====================================================

function registrarResposta(
    sessaoId,
    usuarioId,
    flashcardId,
    materia,
    acertou,
    callback
) {

    db.run(
        `
            INSERT INTO respostas_flashcards
            (
                sessao_id,
                usuario_id,
                flashcard_id,
                materia,
                acertou
            )
            VALUES (?, ?, ?, ?, ?)
        `,
        [
            sessaoId,
            usuarioId,
            flashcardId,
            materia,
            acertou ? 1 : 0
        ],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            const campo =
                acertou
                    ? "acertos"
                    : "erros";

            db.run(
                `
                    UPDATE sessoes_flashcards

                    SET ${campo} =
                        ${campo} + 1

                    WHERE id = ?
                    AND usuario_id = ?
                `,
                [
                    sessaoId,
                    usuarioId
                ],
                function (erroUpdate) {

                    if (erroUpdate) {
                        return callback(
                            erroUpdate
                        );
                    }

                    callback(
                        null,
                        {
                            id: this.lastID
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// FINALIZAR SESSÃO
// =====================================================

function finalizarSessao(
    sessaoId,
    usuarioId,
    callback
) {

    db.run(
        `
            UPDATE sessoes_flashcards

            SET
                data_fim =
                    CURRENT_TIMESTAMP

            WHERE id = ?
            AND usuario_id = ?
        `,
        [
            sessaoId,
            usuarioId
        ],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            if (this.changes === 0) {
                return callback(
                    null,
                    null
                );
            }

            buscarSessaoPorId(
                sessaoId,
                callback
            );
        }
    );
}


// =====================================================
// LISTAR SESSÕES DO USUÁRIO
// =====================================================

function listarSessoesDoUsuario(
    usuarioId,
    callback
) {

    db.all(
        `
            SELECT
                id,
                total_cards,
                acertos,
                erros,
                data_inicio,
                data_fim

            FROM sessoes_flashcards

            WHERE usuario_id = ?

            ORDER BY
                data_inicio DESC
        `,
        [usuarioId],
        (erro, sessoes) => {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                sessoes || []
            );
        }
    );
}


// =====================================================
// DESEMPENHO POR MATÉRIA
// =====================================================

function buscarDesempenhoPorMateria(
    usuarioId,
    callback
) {

    db.all(
        `
            SELECT
                materia,

                COUNT(*) AS total_respostas,

                SUM(
                    CASE
                        WHEN acertou = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS acertos,

                SUM(
                    CASE
                        WHEN acertou = 0
                        THEN 1
                        ELSE 0
                    END
                ) AS erros,

                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN acertou = 1
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0
                    ) / COUNT(*),
                    2
                ) AS porcentagem_acertos

            FROM respostas_flashcards

            WHERE usuario_id = ?

            GROUP BY materia

            ORDER BY
                porcentagem_acertos ASC
        `,
        [usuarioId],
        (erro, desempenho) => {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                desempenho || []
            );
        }
    );
}


// =====================================================
// LISTAR RESPOSTAS DO USUÁRIO
// =====================================================

function listarRespostasDoUsuario(
    usuarioId,
    callback
) {

    db.all(
        `
            SELECT
                id,
                sessao_id,
                flashcard_id,
                materia,
                acertou,
                data_resposta

            FROM respostas_flashcards

            WHERE usuario_id = ?

            ORDER BY
                data_resposta DESC
        `,
        [usuarioId],
        (erro, respostas) => {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                respostas || []
            );
        }
    );
}


module.exports = {
    criarSessao,
    buscarSessaoPorId,
    registrarResposta,
    finalizarSessao,
    listarSessoesDoUsuario,
    buscarDesempenhoPorMateria,
    listarRespostasDoUsuario
};