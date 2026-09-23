const db = require("../config/db");

// =====================================================
// VERIFICAR BLOCO
// =====================================================

function verificarBlocoChecklist(
    blocoId,
    callback
) {
    db.get(
        `
            SELECT
                b.id,
                b.pagina_id,
                b.tipo,
                p.publicado
            FROM blocos_conteudo b
            INNER JOIN paginas_conteudo p
                ON p.id = b.pagina_id
            WHERE b.id = ?
        `,
        [blocoId],
        callback
    );
}

// =====================================================
// LISTAR PROGRESSO
// =====================================================

function listarProgresso(
    usuarioId,
    blocoId,
    callback
) {
    db.all(
        `
            SELECT
                item_indice,
                concluido
            FROM checklist_progresso
            WHERE usuario_id = ?
              AND bloco_id = ?
              AND concluido = 1
            ORDER BY item_indice ASC
        `,
        [
            usuarioId,
            blocoId
        ],
        callback
    );
}

// =====================================================
// SALVAR ITEM
// =====================================================

function salvarItem(
    usuarioId,
    blocoId,
    itemIndice,
    concluido,
    callback
) {
    db.run(
        `
            INSERT INTO checklist_progresso
            (
                usuario_id,
                bloco_id,
                item_indice,
                concluido,
                updated_at
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT(
                usuario_id,
                bloco_id,
                item_indice
            )
            DO UPDATE SET
                concluido =
                    excluded.concluido,
                updated_at =
                    CURRENT_TIMESTAMP
        `,
        [
            usuarioId,
            blocoId,
            itemIndice,
            concluido ? 1 : 0
        ],
        function (erro) {
            if (erro) {
                return callback(
                    erro
                );
            }

            db.get(
                `
                    SELECT
                        item_indice,
                        concluido
                    FROM checklist_progresso
                    WHERE usuario_id = ?
                      AND bloco_id = ?
                      AND item_indice = ?
                `,
                [
                    usuarioId,
                    blocoId,
                    itemIndice
                ],
                callback
            );
        }
    );
}

// =====================================================
// LIMPAR PROGRESSO
// =====================================================

function limparProgresso(
    usuarioId,
    blocoId,
    callback
) {
    db.run(
        `
            DELETE FROM checklist_progresso
            WHERE usuario_id = ?
              AND bloco_id = ?
        `,
        [
            usuarioId,
            blocoId
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

module.exports = {
    verificarBlocoChecklist,
    listarProgresso,
    salvarItem,
    limparProgresso
};