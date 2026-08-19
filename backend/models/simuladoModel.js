const db = require("../config/db");


// ============================
// CRIAR SIMULADO
// ============================

function criarSimulado(
    titulo,
    descricao,
    tempoLimite,
    quantidadeQuestoes,
    callback
) {

    const sql = `
        INSERT INTO simulados
        (
            titulo,
            descricao,
            tempo_limite,
            quantidade_questoes
        )
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            titulo,
            descricao,
            tempoLimite,
            quantidadeQuestoes
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
// LISTAR SIMULADOS
// ============================

function listarSimulados(callback) {

    const sql = `
        SELECT *
        FROM simulados
        ORDER BY id DESC
    `;

    db.all(sql, [], callback);
}


// ============================
// BUSCAR SIMULADO POR ID
// ============================

function buscarSimuladoPorId(id, callback) {

    const sql = `
        SELECT *
        FROM simulados
        WHERE id = ?
    `;

    db.get(sql, [id], callback);
}


// ============================
// ADICIONAR QUESTÃO AO SIMULADO
// ============================

function adicionarQuestaoAoSimulado(
    simuladoId,
    questaoId,
    ordem,
    callback
) {

    const sql = `
        INSERT INTO simulado_questoes
        (
            simulado_id,
            questao_id,
            ordem
        )
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [
            simuladoId,
            questaoId,
            ordem
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
// LISTAR QUESTÕES DO SIMULADO
// ============================

function listarQuestoesDoSimulado(
    simuladoId,
    callback
) {

    const sql = `
        SELECT
            q.id,
            q.pergunta,
            q.alternativa_a,
            q.alternativa_b,
            q.alternativa_c,
            q.alternativa_d,
            q.materia,
            sq.ordem

        FROM simulado_questoes sq

        INNER JOIN questoes q
            ON q.id = sq.questao_id

        WHERE sq.simulado_id = ?

        ORDER BY sq.ordem ASC
    `;

    db.all(
        sql,
        [simuladoId],
        callback
    );
}


// ============================
// REMOVER QUESTÃO DO SIMULADO
// ============================

function removerQuestaoDoSimulado(
    simuladoId,
    questaoId,
    callback
) {

    const sql = `
        DELETE FROM simulado_questoes
        WHERE simulado_id = ?
        AND questao_id = ?
    `;

    db.run(
        sql,
        [
            simuladoId,
            questaoId
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
// EXPORTAÇÕES
// ============================

module.exports = {
    criarSimulado,
    listarSimulados,
    buscarSimuladoPorId,
    adicionarQuestaoAoSimulado,
    listarQuestoesDoSimulado,
    removerQuestaoDoSimulado
};