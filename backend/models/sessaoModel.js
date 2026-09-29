const db = require("../config/db");


// =====================================================
// CRIAR SESSÃO
// =====================================================

function criarSessao(usuarioId, callback) {

    const sql = `
        INSERT INTO sessoes (usuario_id)
        VALUES (?)
    `;

    db.run(sql, [usuarioId], function (erro) {

        if (erro) {
            console.error("❌ Erro ao criar sessão:", erro);
            return callback(erro);
        }

        callback(null, this.lastID);
    });
}


// =====================================================
// BUSCAR SESSÃO ATIVA POR ID
// =====================================================

function buscarSessaoAtivaPorId(sessaoId, callback) {

    const sql = `
        SELECT
            sessoes.id,
            sessoes.usuario_id
        FROM sessoes
        INNER JOIN usuarios
            ON sessoes.usuario_id = usuarios.id
        WHERE sessoes.id = ?
        AND sessoes.ativo = 1
        LIMIT 1
    `;

    db.get(sql, [sessaoId], (erro, sessao) => {

        if (erro) {
            console.error("❌ Erro ao validar sessão:", erro);
            return callback(erro);
        }

        callback(null, sessao || null);
    });
}


// =====================================================
// LISTAR SESSÕES ATIVAS
// =====================================================

function listarSessoesAtivas(callback) {

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
            console.error("❌ Erro ao listar sessões:", erro);
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

    db.run(sql, [usuarioId], function (erro) {

        if (erro) {
            console.error("❌ Erro ao encerrar sessão:", erro);
            return callback(erro);
        }

        console.log(
            `✅ Sessão encerrada para o usuário ${usuarioId}.`
        );

        callback(null);
    });
}


// =====================================================
// ENCERRAR SESSÃO ATUAL
// =====================================================

function encerrarSessaoPorId(sessaoId, callback) {

    const sql = `
        UPDATE sessoes
        SET
            ativo = 0,
            logout_em = CURRENT_TIMESTAMP
        WHERE id = ?
        AND ativo = 1
    `;

    db.run(sql, [sessaoId], function (erro) {

        if (erro) {
            console.error(
                "❌ Erro ao encerrar sessão atual:",
                erro
            );

            return callback(erro);
        }

        callback(null);
    });
}


module.exports = {
    criarSessao,
    buscarSessaoAtivaPorId,
    listarSessoesAtivas,
    encerrarSessaoPorId,
    encerrarSessao
};