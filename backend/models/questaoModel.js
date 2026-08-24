const db = require("../config/db");

// ============================
// CRIAR QUESTÃO
// ============================

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

// ============================
// LISTAR QUESTÕES
// ============================

function listarQuestoes(callback) {
    const sql = `
        SELECT *
        FROM questoes
        ORDER BY id DESC
    `;

    db.all(sql, [], callback);
}

// ============================
// BUSCAR QUESTÃO POR ID
// ============================

function buscarQuestaoPorId(id, callback) {
    const sql = `
        SELECT *
        FROM questoes
        WHERE id = ?
    `;

    db.get(sql, [id], callback);
}

// ============================
// ATUALIZAR QUESTÃO
// ============================

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
                return callback(erro);
            }

            callback(null, this);
        }
    );
}

// ============================
// EXCLUIR QUESTÃO
// ============================

function excluirQuestao(id, callback) {
    const sql = `
        DELETE FROM questoes
        WHERE id = ?
    `;

    db.run(sql, [id], function (erro) {
        if (erro) {
            return callback(erro);
        }

        callback(null, this);
    });
}

module.exports = {
    criarQuestao,
    listarQuestoes,
    buscarQuestaoPorId,
    atualizarQuestao,
    excluirQuestao
};