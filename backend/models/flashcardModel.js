const db = require("../config/db");


// =====================================================
// CRIAR FLASHCARD
// =====================================================

function criarFlashcard(
    primario,
    secundario,
    materiaId,
    topicoId,
    callback
) {

    db.get(
        `
            SELECT
                t.id AS topico_id,
                t.nome AS conteudo,
                m.id AS materia_id,
                m.nome AS materia

            FROM topicos t

            INNER JOIN materias m
                ON m.id = t.materia_id

            WHERE t.id = ?
              AND m.id = ?
              AND t.ativo = 1
              AND m.ativa = 1
        `,
        [topicoId, materiaId],
        (erro, vinculo) => {

            if (erro) {
                return callback(erro);
            }

            if (!vinculo) {
                const erroVinculo =
                    new Error(
                        "O conteúdo selecionado não pertence à matéria informada ou não está disponível."
                    );

                erroVinculo.code =
                    "CONTENT_LINK_INVALID";

                return callback(
                    erroVinculo
                );
            }

            const sql = `
                INSERT INTO flashcards
                (
                    primario,
                    secundario,
                    materia,
                    topico_id
                )
                VALUES (?, ?, ?, ?)
            `;

            db.run(
                sql,
                [
                    primario,
                    secundario,
                    vinculo.materia,
                    vinculo.topico_id
                ],
                function (erroInsert) {

                    if (erroInsert) {
                        return callback(
                            erroInsert
                        );
                    }

                    buscarFlashcardPorId(
                        this.lastID,
                        callback
                    );
                }
            );
        }
    );
}


// =====================================================
// LISTAR FLASHCARDS
// =====================================================

function listarFlashcards(callback) {

    const sql = `
        SELECT
            f.id,
            f.primario,
            f.secundario,
            COALESCE(m.nome, f.materia) AS materia,
            m.id AS materia_id,
            f.topico_id,
            t.nome AS conteudo,
            f.ativo,
            f.created_at,
            f.updated_at

        FROM flashcards f

        LEFT JOIN topicos t
            ON t.id = f.topico_id

        LEFT JOIN materias m
            ON m.id = t.materia_id

        WHERE f.ativo = 1

        ORDER BY
            COALESCE(m.ordem, 9999) ASC,
            COALESCE(m.nome, f.materia) ASC,
            COALESCE(t.ordem, 9999) ASC,
            COALESCE(t.nome, '') ASC,
            f.id ASC
    `;

    db.all(
        sql,
        [],
        (erro, flashcards) => {

            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                flashcards || []
            );
        }
    );
}


// =====================================================
// BUSCAR FLASHCARD
// =====================================================

function buscarFlashcardPorId(
    id,
    callback
) {

    db.get(
        `
            SELECT
                f.id,
                f.primario,
                f.secundario,
                COALESCE(m.nome, f.materia) AS materia,
                m.id AS materia_id,
                f.topico_id,
                t.nome AS conteudo,
                f.ativo,
                f.created_at,
                f.updated_at

            FROM flashcards f

            LEFT JOIN topicos t
                ON t.id = f.topico_id

            LEFT JOIN materias m
                ON m.id = t.materia_id

            WHERE f.id = ?
        `,
        [id],
        callback
    );
}


// =====================================================
// VALIDAR VÍNCULO MATÉRIA + CONTEÚDO
// =====================================================

function buscarVinculoConteudo(
    materiaId,
    topicoId,
    callback
) {

    db.get(
        `
            SELECT
                t.id AS topico_id,
                t.nome AS conteudo,
                m.id AS materia_id,
                m.nome AS materia

            FROM topicos t

            INNER JOIN materias m
                ON m.id = t.materia_id

            WHERE t.id = ?
              AND m.id = ?
              AND t.ativo = 1
              AND m.ativa = 1
        `,
        [topicoId, materiaId],
        callback
    );
}


// =====================================================
// ATUALIZAR FLASHCARD
// =====================================================

function atualizarFlashcard(
    id,
    dados,
    callback
) {

    db.get(
        `
            SELECT *
            FROM flashcards
            WHERE id = ?
        `,
        [id],
        (erro, atual) => {

            if (erro) {
                return callback(erro);
            }

            if (!atual) {
                return callback(
                    null,
                    null
                );
            }

            const primario =
                dados.primario !== undefined
                    ? dados.primario
                    : atual.primario;

            const secundario =
                dados.secundario !== undefined
                    ? dados.secundario
                    : atual.secundario;

            const ativo =
                dados.ativo !== undefined
                    ? (dados.ativo ? 1 : 0)
                    : atual.ativo;

            const materiaId =
                dados.materiaId !== undefined
                    ? Number(dados.materiaId)
                    : null;

            const topicoId =
                dados.topicoId !== undefined
                    ? Number(dados.topicoId)
                    : null;

            if (
                !Number.isInteger(materiaId) ||
                materiaId <= 0 ||
                !Number.isInteger(topicoId) ||
                topicoId <= 0
            ) {
                const erroVinculo =
                    new Error(
                        "Matéria e conteúdo são obrigatórios."
                    );

                erroVinculo.code =
                    "CONTENT_LINK_REQUIRED";

                return callback(
                    erroVinculo
                );
            }

            buscarVinculoConteudo(
                materiaId,
                topicoId,
                (erroVinculo, vinculo) => {

                    if (erroVinculo) {
                        return callback(
                            erroVinculo
                        );
                    }

                    if (!vinculo) {
                        const erroConteudo =
                            new Error(
                                "O conteúdo selecionado não pertence à matéria informada ou não está disponível."
                            );

                        erroConteudo.code =
                            "CONTENT_LINK_INVALID";

                        return callback(
                            erroConteudo
                        );
                    }

                    db.run(
                        `
                            UPDATE flashcards

                            SET
                                primario = ?,
                                secundario = ?,
                                materia = ?,
                                topico_id = ?,
                                ativo = ?,
                                updated_at =
                                    CURRENT_TIMESTAMP

                            WHERE id = ?
                        `,
                        [
                            primario,
                            secundario,
                            vinculo.materia,
                            vinculo.topico_id,
                            ativo,
                            id
                        ],
                        (erroUpdate) => {

                            if (erroUpdate) {
                                return callback(
                                    erroUpdate
                                );
                            }

                            buscarFlashcardPorId(
                                id,
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
// EXCLUIR FLASHCARD
// =====================================================

function excluirFlashcard(
    id,
    callback
) {

    db.run(
        `
            DELETE FROM flashcards
            WHERE id = ?
        `,
        [id],
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

    criarFlashcard,

    listarFlashcards,

    buscarFlashcardPorId,

    atualizarFlashcard,

    excluirFlashcard

};
