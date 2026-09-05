const db = require("../config/db");


// =====================================================
// BUSCAR USUÁRIO POR EMAIL
// =====================================================

function buscarUsuarioPorEmail(email, callback) {

    const sql = `
        SELECT *
        FROM usuarios
        WHERE email = ?
    `;

    db.get(sql, [email], callback);
}


// =====================================================
// BUSCAR USUÁRIO POR ID
// =====================================================

function buscarUsuarioPorId(id, callback) {

    const sql = `
        SELECT
            id,
            nome,
            email,
            tipo,
            foto_perfil
        FROM usuarios
        WHERE id = ?
    `;

    db.get(sql, [id], callback);
}


// =====================================================
// CRIAR USUÁRIO
// =====================================================

function criarUsuario(
    nome,
    email,
    senha,
    tipo,
    callback
) {

    const sql = `
        INSERT INTO usuarios
        (nome, email, senha, tipo)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [nome, email, senha, tipo],
        callback
    );
}


// =====================================================
// LISTAR TODOS OS USUÁRIOS
// =====================================================

function listarUsuarios(callback) {

    const sql = `
        SELECT
            id,
            nome,
            email,
            tipo,
            foto_perfil
        FROM usuarios
        ORDER BY id DESC
    `;

    db.all(sql, [], callback);
}


// =====================================================
// ATUALIZAR PERFIL
// =====================================================

function atualizarPerfil(
    id,
    nome,
    email,
    callback
) {

    const sql = `
        UPDATE usuarios
        SET
            nome = ?,
            email = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [nome, email, id],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(null, this.changes);
        }
    );
}


// =====================================================
// ATUALIZAR SENHA
// =====================================================

function atualizarSenha(
    id,
    senha,
    callback
) {

    const sql = `
        UPDATE usuarios
        SET senha = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [senha, id],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(null, this.changes);
        }
    );
}


// =====================================================
// ATUALIZAR FOTO
// =====================================================

function atualizarFoto(
    id,
    fotoPerfil,
    callback
) {

    const sql = `
        UPDATE usuarios
        SET foto_perfil = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [fotoPerfil, id],
        function (erro) {

            if (erro) {
                return callback(erro);
            }

            callback(null, this.changes);
        }
    );
}


// =====================================================
// EXCLUIR USUÁRIO
// =====================================================

function excluirUsuario(id, callback) {

    const sql = `
        DELETE FROM usuarios
        WHERE id = ?
    `;

    db.run(sql, [id], function (erro) {

        if (erro) {
            console.error(
                "❌ Erro ao excluir usuário:",
                erro
            );

            return callback(erro);
        }

        callback(null, this.changes);
    });
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    criarUsuario,
    listarUsuarios,
    atualizarPerfil,
    atualizarSenha,
    atualizarFoto,
    excluirUsuario

};