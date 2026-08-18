const db = require("../config/db");


// ============================
// CRIAR USUÁRIO
// ============================

function criarUsuario(nome, email, senha, tipo, callback) {

    const sql = `
        INSERT INTO usuarios (nome, email, senha, tipo)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [nome, email, senha, tipo],
        function (erro) {
            callback(erro, this);
        }
    );
}


// ============================
// BUSCAR USUÁRIO POR EMAIL
// ============================

function buscarUsuarioPorEmail(email, callback) {

    const sql = `
        SELECT *
        FROM usuarios
        WHERE email = ?
    `;

    db.get(
        sql,
        [email],
        callback
    );
}


// ============================
// BUSCAR USUÁRIO POR ID
// ============================

function buscarUsuarioPorId(id, callback) {

    const sql = `
        SELECT id, nome, email, tipo
        FROM usuarios
        WHERE id = ?
    `;

    db.get(
        sql,
        [id],
        callback
    );
}


// ============================
// ATUALIZAR USUÁRIO
// ============================

function atualizarUsuario(id, nome, email, callback) {

    const sql = `
        UPDATE usuarios
        SET nome = ?, email = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [nome, email, id],
        function (erro) {
            callback(erro, this);
        }
    );
}


// ============================
// EXPORTAÇÕES
// ============================

module.exports = {
    criarUsuario,
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    atualizarUsuario
};