const db = require("../config/db");


// =====================================================
// CRIAR FLASHCARD
// =====================================================

function criarFlashcard(
    primario,
    secundario,
    materia,
    callback
) {

    const sql = `
        INSERT INTO flashcards
        (
            primario,
            secundario,
            materia
        )
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [
            primario,
            secundario,
            materia
        ],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            buscarFlashcardPorId(
                this.lastID,
                callback
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
            id,
            primario,
            secundario,
            materia,
            ativo,
            created_at,
            updated_at

        FROM flashcards

        WHERE ativo = 1

        ORDER BY
            materia ASC,
            id ASC
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
                id,
                primario,
                secundario,
                materia,
                ativo,
                created_at,
                updated_at

            FROM flashcards

            WHERE id = ?
        `,
        [id],
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

            const materia =
                dados.materia !== undefined
                    ? dados.materia
                    : atual.materia;

            const ativo =
                dados.ativo !== undefined
                    ? (dados.ativo ? 1 : 0)
                    : atual.ativo;


            db.run(
                `
                    UPDATE flashcards

                    SET
                        primario = ?,
                        secundario = ?,
                        materia = ?,
                        ativo = ?,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = ?
                `,
                [
                    primario,
                    secundario,
                    materia,
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
