const db =
    require("../config/db");

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
// LISTAR QUESTÕES — ADMIN
// =====================================================

function listarQuestoes(
    callback
) {
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
// BUSCAR QUESTÃO
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
// LISTAR QUESTÕES PELOS IDs — ALUNO
// NÃO RETORNA A RESPOSTA CORRETA
// =====================================================

function listarQuestoesPorIds(
    ids,
    callback
) {
    if (
        !Array.isArray(ids) ||
        ids.length === 0
    ) {
        return callback(
            null,
            []
        );
    }

    const placeholders =
        ids
            .map(
                () => "?"
            )
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

        WHERE id IN (
            ${placeholders}
        )
    `;

    db.all(
        sql,
        ids,
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
             * Mantém a mesma ordem
             * em que o administrador
             * selecionou as questões.
             */

            const mapa =
                new Map(
                    (
                        questoes ||
                        []
                    ).map(
                        (
                            questao
                        ) => [
                            Number(
                                questao.id
                            ),
                            questao
                        ]
                    )
                );

            const ordenadas =
                ids
                    .map(
                        (id) =>
                            mapa.get(
                                Number(
                                    id
                                )
                            )
                    )
                    .filter(
                        Boolean
                    );

            callback(
                null,
                ordenadas
            );
        }
    );
}

// =====================================================
// CORRIGIR QUESTÕES
// =====================================================

function corrigirQuestoesPorIds(
    ids,
    respostas,
    callback
) {
    if (
        !Array.isArray(ids) ||
        ids.length === 0
    ) {
        return callback(
            null,
            []
        );
    }

    const placeholders =
        ids
            .map(
                () => "?"
            )
            .join(",");

    db.all(
        `
            SELECT
                id,
                correta

            FROM questoes

            WHERE id IN (
                ${placeholders}
            )
        `,
        ids,
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
                    (
                        questoes ||
                        []
                    ).map(
                        (
                            questao
                        ) => [
                            Number(
                                questao.id
                            ),
                            questao
                        ]
                    )
                );

            const detalhes =
                ids
                    .map(
                        (id) =>
                            mapa.get(
                                Number(
                                    id
                                )
                            )
                    )
                    .filter(
                        Boolean
                    )
                    .map(
                        (
                            questao
                        ) => {
                            const respostaUsuario =
                                respostas &&
                                respostas[
                                    questao.id
                                ] != null
                                    ? String(
                                          respostas[
                                              questao.id
                                          ]
                                      ).toUpperCase()
                                    : null;

                            const respostaCorreta =
                                String(
                                    questao.correta
                                ).toUpperCase();

                            return {
                                questaoId:
                                    Number(
                                        questao.id
                                    ),

                                respostaUsuario,

                                respostaCorreta,

                                acertou:
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
// ATUALIZAR
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
// EXCLUIR
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
// LISTAR QUESTÕES PARA O ALUNO
// Não envia a resposta correta.
// =====================================================

function listarQuestoesPorIds(
    ids,
    callback
) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return callback(null, []);
    }

    const idsNumericos = ids
        .map(Number)
        .filter(
            (id) =>
                Number.isInteger(id) &&
                id > 0
        );

    if (idsNumericos.length === 0) {
        return callback(null, []);
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
        ORDER BY id ASC
    `;

    db.all(
        sql,
        idsNumericos,
        callback
    );
}


// =====================================================
// CORRIGIR QUESTÕES DO ALUNO
// =====================================================

function corrigirQuestoesPorIds(
    ids,
    respostas,
    callback
) {
    if (
        !Array.isArray(ids) ||
        ids.length === 0
    ) {
        return callback(
            null,
            []
        );
    }

    const idsNumericos = ids
        .map(Number)
        .filter(
            (id) =>
                Number.isInteger(id) &&
                id > 0
        );

    if (idsNumericos.length === 0) {
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
        (erro, questoes) => {
            if (erro) {
                return callback(
                    erro
                );
            }

            const lista =
                (questoes || []).map(
                    (questao) => {
                        const respostaUsuario =
                            String(
                                respostas?.[
                                    String(
                                        questao.id
                                    )
                                ] ?? ''
                            ).toUpperCase();

                        const respostaCorreta =
                            String(
                                questao.correta || ''
                            ).toUpperCase();

                        return {
                            questaoId:
                                questao.id,

                            respostaUsuario,

                            respostaCorreta,

                            acertou:
                                respostaUsuario !== '' &&
                                respostaUsuario ===
                                    respostaCorreta
                        };
                    }
                );

            callback(
                null,
                lista
            );
        }
    );
}

module.exports = {
    criarQuestao,
    listarQuestoes,
    buscarQuestaoPorId,
    listarQuestoesPorIds,
    corrigirQuestoesPorIds,
    atualizarQuestao,
    excluirQuestao
};
