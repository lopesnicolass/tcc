const db = require("../config/db");


// =====================================================
// AUXILIAR DE ERRO
// =====================================================

function criarErro(
    mensagem,
    code
) {

    const erro =
        new Error(
            mensagem
        );

    erro.code =
        code;

    return erro;
}


// =====================================================
// CRIAR SESSÃO
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
                return callback(
                    erro
                );
            }

            callback(
                null,
                {
                    id:
                        this.lastID,

                    usuario_id:
                        usuarioId,

                    total_cards:
                        totalCards,

                    acertos:
                        0,

                    erros:
                        0
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
        [
            sessaoId
        ],
        callback
    );
}


// =====================================================
// CONTAR RESPOSTAS
// =====================================================

function contarRespostasDaSessao(
    sessaoId,
    callback
) {

    db.get(
        `
            SELECT
                COUNT(*) AS total

            FROM respostas_flashcards

            WHERE sessao_id = ?
        `,
        [
            sessaoId
        ],
        (erro, resultado) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                Number(
                    resultado?.total || 0
                )
            );
        }
    );
}


// =====================================================
// BUSCAR FLASHCARD
// =====================================================

function buscarFlashcardPorId(
    flashcardId,
    callback
) {

    db.get(
        `
            SELECT
                id,
                materia,
                ativo

            FROM flashcards

            WHERE id = ?
        `,
        [
            flashcardId
        ],
        callback
    );
}


// =====================================================
// VERIFICAR CARD REPETIDO NA SESSÃO
// =====================================================

function verificarRespostaDuplicada(
    sessaoId,
    flashcardId,
    callback
) {

    db.get(
        `
            SELECT
                id

            FROM respostas_flashcards

            WHERE sessao_id = ?
              AND flashcard_id = ?

            LIMIT 1
        `,
        [
            sessaoId,
            flashcardId
        ],
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
    acertou,
    callback
) {

    buscarSessaoPorId(
        sessaoId,
        (
            erroSessao,
            sessao
        ) => {

            if (erroSessao) {
                return callback(
                    erroSessao
                );
            }

            if (!sessao) {

                return callback(
                    criarErro(
                        "Sessão de flashcards não encontrada.",
                        "SESSION_NOT_FOUND"
                    )
                );
            }


            if (
                Number(
                    sessao.usuario_id
                ) !==
                Number(
                    usuarioId
                )
            ) {

                return callback(
                    criarErro(
                        "Você não pode alterar esta sessão.",
                        "SESSION_ACCESS_DENIED"
                    )
                );
            }


            if (
                sessao.data_fim
            ) {

                return callback(
                    criarErro(
                        "Esta sessão já foi finalizada.",
                        "SESSION_FINISHED"
                    )
                );
            }


            buscarFlashcardPorId(
                flashcardId,
                (
                    erroFlashcard,
                    flashcard
                ) => {

                    if (erroFlashcard) {
                        return callback(
                            erroFlashcard
                        );
                    }

                    if (!flashcard) {

                        return callback(
                            criarErro(
                                "Flashcard não encontrado.",
                                "FLASHCARD_NOT_FOUND"
                            )
                        );
                    }


                    if (
                        Number(
                            flashcard.ativo
                        ) !== 1
                    ) {

                        return callback(
                            criarErro(
                                "Este flashcard não está disponível.",
                                "FLASHCARD_INACTIVE"
                            )
                        );
                    }


                    contarRespostasDaSessao(
                        sessaoId,
                        (
                            erroContagem,
                            totalRespondido
                        ) => {

                            if (erroContagem) {
                                return callback(
                                    erroContagem
                                );
                            }


                            if (
                                totalRespondido >=
                                Number(
                                    sessao.total_cards
                                )
                            ) {

                                return callback(
                                    criarErro(
                                        "A quantidade máxima de respostas desta sessão já foi atingida.",
                                        "SESSION_FULL"
                                    )
                                );
                            }


                            verificarRespostaDuplicada(
                                sessaoId,
                                flashcardId,
                                (
                                    erroDuplicada,
                                    respostaExistente
                                ) => {

                                    if (erroDuplicada) {
                                        return callback(
                                            erroDuplicada
                                        );
                                    }


                                    if (
                                        respostaExistente
                                    ) {

                                        return callback(
                                            criarErro(
                                                "Este flashcard já foi respondido nesta sessão.",
                                                "FLASHCARD_ALREADY_ANSWERED"
                                            )
                                        );
                                    }


                                    const materia =
                                        String(
                                            flashcard.materia ||
                                            ""
                                        ).trim();


                                    if (!materia) {

                                        return callback(
                                            criarErro(
                                                "O flashcard não possui matéria cadastrada.",
                                                "FLASHCARD_MATERIA_INVALIDA"
                                            )
                                        );
                                    }


                                    // --------------------------------
                                    // TRANSAÇÃO
                                    // --------------------------------

                                    db.run(
                                        "BEGIN IMMEDIATE TRANSACTION",
                                        (erroBegin) => {

                                            if (erroBegin) {
                                                return callback(
                                                    erroBegin
                                                );
                                            }


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
                                                    acertou
                                                        ? 1
                                                        : 0
                                                ],
                                                function (
                                                    erroInsert
                                                ) {

                                                    if (
                                                        erroInsert
                                                    ) {

                                                        return db.run(
                                                            "ROLLBACK",
                                                            () =>
                                                                callback(
                                                                    erroInsert
                                                                )
                                                        );
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
                                                        function (
                                                            erroUpdate
                                                        ) {

                                                            if (
                                                                erroUpdate
                                                            ) {

                                                                return db.run(
                                                                    "ROLLBACK",
                                                                    () =>
                                                                        callback(
                                                                            erroUpdate
                                                                        )
                                                                );
                                                            }


                                                            db.run(
                                                                "COMMIT",
                                                                (
                                                                    erroCommit
                                                                ) => {

                                                                    if (
                                                                        erroCommit
                                                                    ) {

                                                                        return db.run(
                                                                            "ROLLBACK",
                                                                            () =>
                                                                                callback(
                                                                                    erroCommit
                                                                                )
                                                                        );
                                                                    }


                                                                    buscarSessaoPorId(
                                                                        sessaoId,
                                                                        (
                                                                            erroFinal,
                                                                            sessaoAtualizada
                                                                        ) => {

                                                                            if (
                                                                                erroFinal
                                                                            ) {

                                                                                return callback(
                                                                                    erroFinal
                                                                                );
                                                                            }


                                                                            callback(
                                                                                null,
                                                                                {
                                                                                    id:
                                                                                        this.lastID,

                                                                                    flashcard_id:
                                                                                        flashcardId,

                                                                                    materia,

                                                                                    acertou,

                                                                                    sessao:
                                                                                        sessaoAtualizada
                                                                                }
                                                                            );

                                                                        }
                                                                    );

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

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

    buscarSessaoPorId(
        sessaoId,
        (
            erroSessao,
            sessao
        ) => {

            if (erroSessao) {
                return callback(
                    erroSessao
                );
            }

            if (!sessao) {
                return callback(
                    null,
                    null
                );
            }


            if (
                Number(
                    sessao.usuario_id
                ) !==
                Number(
                    usuarioId
                )
            ) {

                const erro =
                    criarErro(
                        "Você não pode finalizar esta sessão.",
                        "SESSION_ACCESS_DENIED"
                    );

                return callback(
                    erro
                );
            }


            if (
                sessao.data_fim
            ) {

                return callback(
                    null,
                    sessao
                );
            }


            contarRespostasDaSessao(
                sessaoId,
                (
                    erroContagem,
                    totalRespondido
                ) => {

                    if (erroContagem) {
                        return callback(
                            erroContagem
                        );
                    }


                    if (
                        totalRespondido <
                        Number(
                            sessao.total_cards
                        )
                    ) {

                        return callback(
                            criarErro(
                                "A sessão ainda não possui todas as respostas.",
                                "SESSION_INCOMPLETE"
                            )
                        );
                    }


                    db.run(
                        `
                            UPDATE sessoes_flashcards

                            SET
                                data_fim =
                                    CURRENT_TIMESTAMP

                            WHERE id = ?
                              AND usuario_id = ?
                              AND data_fim IS NULL
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


                            buscarSessaoPorId(
                                sessaoId,
                                callback
                            );

                        }
                    );

                }
            );

        }
    );
}


// =====================================================
// LISTAR SESSÕES
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
                data_inicio DESC,
                id DESC
        `,
        [
            usuarioId
        ],
        (
            erro,
            sessoes
        ) => {

            if (erro) {
                return callback(
                    erro
                );
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
                    ) /
                    COUNT(*),
                    2
                ) AS porcentagem_acertos

            FROM respostas_flashcards

            WHERE usuario_id = ?

            GROUP BY
                materia

            ORDER BY
                porcentagem_acertos ASC,
                materia ASC
        `,
        [
            usuarioId
        ],
        (
            erro,
            desempenho
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                desempenho || []
            );
        }
    );
}


// =====================================================
// LISTAR RESPOSTAS
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
                data_resposta DESC,
                id DESC
        `,
        [
            usuarioId
        ],
        (
            erro,
            respostas
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                respostas || []
            );
        }
    );
}


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {

    criarSessao,

    buscarSessaoPorId,

    registrarResposta,

    finalizarSessao,

    listarSessoesDoUsuario,

    buscarDesempenhoPorMateria,

    listarRespostasDoUsuario

};