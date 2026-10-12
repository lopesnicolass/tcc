const db = require("../config/db");

// =====================================================
// CRIAR RESULTADO
// =====================================================

function criarResultado(
    usuarioId,
    simuladoId,
    acertos,
    erros,
    totalQuestoes,
    porcentagem,
    callback
) {

    const sql = `
        INSERT INTO resultados
        (
            usuario_id,
            simulado_id,
            acertos,
            erros,
            total_questoes,
            porcentagem
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            usuarioId,
            simuladoId,
            acertos,
            erros,
            totalQuestoes,
            porcentagem
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
// BUSCAR RESULTADOS DO USUÁRIO
// =====================================================

function buscarResultadosPorUsuario(
    usuarioId,
    callback
) {

    const sql = `
        SELECT
            r.id,
            r.usuario_id,
            r.simulado_id,
            r.acertos,
            r.erros,
            r.total_questoes,
            r.porcentagem,
            r.data_realizacao,

            s.titulo AS simulado_nome,
            COALESCE(m.nome, s.materia) AS materia

        FROM resultados r

        LEFT JOIN simulados s
            ON s.id = r.simulado_id

        LEFT JOIN topicos t
            ON t.id = s.topico_id

        LEFT JOIN materias m
            ON m.id = t.materia_id

        WHERE r.usuario_id = ?

        ORDER BY
            r.data_realizacao DESC,
            r.id DESC
    `;

    db.all(
        sql,
        [usuarioId],
        callback
    );
}


// =====================================================
// BUSCAR DESEMPENHO
// =====================================================

function buscarDesempenhoPorUsuario(
    usuarioId,
    callback
) {

    const sql = `
        SELECT

            COUNT(*) AS totalSimulados,

            COALESCE(
                AVG(porcentagem),
                0
            ) AS mediaPorcentagem,

            COALESCE(
                SUM(acertos),
                0
            ) AS totalAcertos,

            COALESCE(
                SUM(erros),
                0
            ) AS totalErros,

            COALESCE(
                SUM(total_questoes),
                0
            ) AS totalQuestoes,

            COALESCE(
                MAX(porcentagem),
                0
            ) AS melhorResultado

        FROM resultados

        WHERE usuario_id = ?
    `;

    db.get(
        sql,
        [usuarioId],
        callback
    );
}


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {
    criarResultado,
    buscarResultadosPorUsuario,
    buscarDesempenhoPorUsuario
};