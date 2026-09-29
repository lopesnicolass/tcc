const db = require("../config/db");

// =====================================================
// CRIAR QUESTÃO
// =====================================================

function criarQuestao(
    pergunta,
    alternativaA,
    alternativaB,
    alternativaC,
    alternativaD,
    alternativaE,
    correta,
    materia,
    callback
) {

    const sql = `
        INSERT INTO questoes
        (
            pergunta,
            alternativa_a,
            alternativa_b,
            alternativa_c,
            alternativa_d,
            alternativa_e,
            correta,
            materia
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            pergunta,
            alternativaA,
            alternativaB,
            alternativaC,
            alternativaD,
            alternativaE,
            correta,
            materia
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
// LISTAR QUESTÕES — ADMIN
// =====================================================

function listarQuestoes(callback) {

    const sql = `
        SELECT *
        FROM questoes
        ORDER BY id DESC
    `;

    db.all(
        sql,
        [],
        callback
    );
}


// =====================================================
// BUSCAR QUESTÃO POR ID
// =====================================================

function buscarQuestaoPorId(
    id,
    callback
) {

    const sql = `
        SELECT *
        FROM questoes
        WHERE id = ?
    `;

    db.get(
        sql,
        [id],
        callback
    );
}


// =====================================================
// NORMALIZAR IDS
// =====================================================

function normalizarIds(ids) {

    if (!Array.isArray(ids)) {
        return [];
    }

    return ids
        .map(Number)
        .filter(
            id =>
                Number.isInteger(id) &&
                id > 0
        );
}


// =====================================================
// LISTAR QUESTÕES PARA O ALUNO
//
// IMPORTANTE:
// A resposta correta NÃO é enviada.
// =====================================================

function listarQuestoesPorIds(
    ids,
    callback
) {

    const idsNumericos =
        normalizarIds(ids);

    if (
        idsNumericos.length === 0
    ) {

        return callback(
            null,
            []
        );
    }

    const placeholders =
        idsNumericos
            .map(() => "?")
            .join(",");

    const sql = `
        SELECT
            id,
            pergunta,
            alternativa_a,
            alternativa_b,
            alternativa_c,
            alternativa_d,
            alternativa_e,
            materia
        FROM questoes
        WHERE id IN (${placeholders})
    `;

    db.all(
        sql,
        idsNumericos,
        (
            erro,
            questoes
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            /*
             * O banco pode devolver as questões
             * em uma ordem diferente da enviada.
             *
             * Aqui restauramos a ordem original.
             */

            const mapa =
                new Map(
                    (questoes || []).map(
                        questao => [
                            Number(
                                questao.id
                            ),
                            questao
                        ]
                    )
                );

            const ordenadas =
                idsNumericos
                    .map(
                        id =>
                            mapa.get(id)
                    )
                    .filter(Boolean);

            callback(
                null,
                ordenadas
            );
        }
    );
}


// =====================================================
// CORRIGIR QUESTÕES
//
// A resposta correta é consultada SOMENTE
// no backend.
// =====================================================

function corrigirQuestoesPorIds(
    ids,
    respostas,
    callback
) {

    const idsNumericos =
        normalizarIds(ids);

    if (
        idsNumericos.length === 0
    ) {

        return callback(
            null,
            []
        );
    }

    const placeholders =
        idsNumericos
            .map(() => "?")
            .join(",");

    const sql = `
        SELECT
            id,
            correta
        FROM questoes
        WHERE id IN (${placeholders})
    `;

    db.all(
        sql,
        idsNumericos,
        (
            erro,
            questoes
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            const mapa =
                new Map(
                    (questoes || []).map(
                        questao => [
                            Number(
                                questao.id
                            ),
                            questao
                        ]
                    )
                );

            const detalhes =
                idsNumericos
                    .map(
                        id =>
                            mapa.get(id)
                    )
                    .filter(Boolean)
                    .map(
                        questao => {

                            const respostaUsuario =
                                respostas &&
                                respostas[
                                    String(
                                        questao.id
                                    )
                                ] != null
                                    ? String(
                                          respostas[
                                              String(
                                                  questao.id
                                              )
                                          ]
                                      ).trim().toUpperCase()
                                    : "";

                            const respostaCorreta =
                                String(
                                    questao.correta || ""
                                )
                                    .trim()
                                    .toUpperCase();

                            return {

                                questaoId:
                                    Number(
                                        questao.id
                                    ),

                                respostaUsuario,

                                respostaCorreta,

                                acertou:
                                    respostaUsuario !== "" &&
                                    respostaUsuario ===
                                        respostaCorreta
                            };
                        }
                    );

            callback(
                null,
                detalhes
            );
        }
    );
}


// =====================================================
// ATUALIZAR QUESTÃO
// =====================================================

function atualizarQuestao(
    id,
    pergunta,
    alternativaA,
    alternativaB,
    alternativaC,
    alternativaD,
    alternativaE,
    correta,
    materia,
    callback
) {

    const sql = `
        UPDATE questoes

        SET
            pergunta = ?,
            alternativa_a = ?,
            alternativa_b = ?,
            alternativa_c = ?,
            alternativa_d = ?,
            alternativa_e = ?,
            correta = ?,
            materia = ?

        WHERE id = ?
    `;

    db.run(
        sql,
        [
            pergunta,
            alternativaA,
            alternativaB,
            alternativaC,
            alternativaD,
            alternativaE,
            correta,
            materia,
            id
        ],
        function (erro) {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// EXCLUIR QUESTÃO
// =====================================================

function excluirQuestao(
    id,
    callback
) {

    db.run(
        `
        DELETE FROM questoes
        WHERE id = ?
        `,
        [id],
        function (erro) {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {

    criarQuestao,

    listarQuestoes,

    buscarQuestaoPorId,

    listarQuestoesPorIds,

    corrigirQuestoesPorIds,

    atualizarQuestao,

    excluirQuestao

};