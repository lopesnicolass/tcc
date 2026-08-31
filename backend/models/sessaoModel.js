const db = require("../config/db");


// =====================================================
// CRIAR SESSÃO
// =====================================================

function criarSessao(usuarioId, callback) {

    const sql = `
        INSERT INTO sessoes (
            usuario_id,
            ativo
        )
        VALUES (?, 1)
    `;

    db.run(
        sql,
        [usuarioId],
        function (erro) {

            if (erro) {
                console.error(
                    "❌ Erro ao criar sessão:",
                    erro
                );

                return callback(erro);
            }

            callback(null, this.lastID);
        }
    );
}


// =====================================================
// BUSCAR SESSÕES ATIVAS
// =====================================================

function buscarSessoesAtivas(callback) {

    const sql = `
        SELECT
            sessoes.id,
            sessoes.usuario_id,
            sessoes.login_em,
            usuarios.nome,
            usuarios.email,
            usuarios.tipo
        FROM sessoes
        INNER JOIN usuarios
            ON sessoes.usuario_id = usuarios.id
        WHERE sessoes.ativo = 1
        ORDER BY sessoes.login_em DESC
    `;

    db.all(sql, [], (erro, resultados) => {

        if (erro) {
            console.error(
                "❌ Erro ao buscar sessões ativas:",
                erro
            );

            return callback(erro);
        }

        callback(null, resultados);
    });
}


// =====================================================
// ENCERRAR SESSÃO
// =====================================================

function encerrarSessao(usuarioId, callback) {

    const sql = `
        UPDATE sessoes
        SET
            ativo = 0,
            logout_em = CURRENT_TIMESTAMP
        WHERE usuario_id = ?
        AND ativo = 1
    `;

    db.run(
        sql,
        [usuarioId],
        function (erro) {

            if (erro) {
                console.error(
                    "❌ Erro ao encerrar sessão:",
                    erro
                );

                return callback(erro);
            }

            callback(null);
        }
    );
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
    criarSessao,
    buscarSessoesAtivas,
    encerrarSessao
};