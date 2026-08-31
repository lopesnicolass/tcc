const db = require("../config/db");


// =====================================================
// CRIAR PROVA
// =====================================================

function criarProva(
    ano,
    titulo,
    arquivoProva,
    arquivoGabarito,
    callback
) {

    const sql = `
        INSERT INTO provas
        (
            ano,
            titulo,
            arquivo_prova,
            arquivo_gabarito
        )
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            ano,
            titulo,
            arquivoProva,
            arquivoGabarito
        ],
        function (erro) {

            if (erro) {
                console.error(
                    "❌ Erro ao criar prova:",
                    erro
                );

                return callback(erro);
            }

            callback(null, this.lastID);
        }
    );
}


// =====================================================
// LISTAR TODAS AS PROVAS
// =====================================================

function listarProvas(callback) {

    const sql = `
        SELECT
            id,
            ano,
            titulo,
            arquivo_prova,
            arquivo_gabarito,
            data_criacao
        FROM provas
        ORDER BY ano DESC
    `;

    db.all(
        sql,
        [],
        (erro, resultados) => {

            if (erro) {
                console.error(
                    "❌ Erro ao listar provas:",
                    erro
                );

                return callback(erro);
            }

            callback(null, resultados);
        }
    );
}


// =====================================================
// BUSCAR PROVA POR ID
// =====================================================

function buscarProvaPorId(id, callback) {

    const sql = `
        SELECT
            id,
            ano,
            titulo,
            arquivo_prova,
            arquivo_gabarito,
            data_criacao
        FROM provas
        WHERE id = ?
    `;

    db.get(
        sql,
        [id],
        (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao buscar prova:",
                    erro
                );

                return callback(erro);
            }

            callback(null, resultado);
        }
    );
}


// =====================================================
// EXCLUIR PROVA
// =====================================================

function excluirProva(id, callback) {

    const sql = `
        DELETE FROM provas
        WHERE id = ?
    `;

    db.run(
        sql,
        [id],
        function (erro) {

            if (erro) {
                console.error(
                    "❌ Erro ao excluir prova:",
                    erro
                );

                return callback(erro);
            }

            callback(null, this.changes);
        }
    );
}


// =====================================================
// EXPORTAR FUNÇÕES
// =====================================================

module.exports = {
    criarProva,
    listarProvas,
    buscarProvaPorId,
    excluirProva
};