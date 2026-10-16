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
    opcoes,
    callback
) {
    // Compatível com inserções administrativas anteriores.
    if (typeof opcoes === 'function') {
        callback = opcoes;
        opcoes = {};
    }
    const tentativaId = opcoes?.tentativaId || null;
    const detalhes = opcoes?.detalhes || null;
    db.run(`INSERT INTO resultados
        (usuario_id, simulado_id, acertos, erros, total_questoes,
         porcentagem, tentativa_id, detalhes_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(usuario_id, tentativa_id) DO NOTHING`,
        [usuarioId, simuladoId, acertos, erros, totalQuestoes,
         porcentagem, tentativaId, detalhes ? JSON.stringify(detalhes) : null],
        function (erro) {
            if (erro) return callback(erro);
            if (this.changes) return callback(null, { lastID: this.lastID, duplicado: false });
            // O mesmo envio já foi persistido antes. Retornar a nota original.
            db.get(`SELECT id, simulado_id, acertos, erros, total_questoes,
                      porcentagem, detalhes_json FROM resultados
                      WHERE usuario_id=? AND tentativa_id=?`,
                [usuarioId, tentativaId], (erroBusca, registro) => {
                    if (erroBusca) return callback(erroBusca);
                    if (!registro) return callback(new Error('Tentativa já registrada, mas não encontrada.'));
                    let detalhesSalvos = [];
                    try { detalhesSalvos = JSON.parse(registro.detalhes_json || '[]'); }
                    catch { return callback(new Error('Detalhes do resultado inválidos.')); }
                    callback(null, { lastID: registro.id, duplicado: true,
                        registro: { ...registro, detalhes: detalhesSalvos } });
                });
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
            COALESCE(m.nome, s.materia) AS materia,
            t.id AS topico_id,
            t.nome AS assunto

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