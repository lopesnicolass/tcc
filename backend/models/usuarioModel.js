const db = require("../config/db");


// ============================
// BUSCAR USUÁRIO POR EMAIL
// ============================

function buscarUsuarioPorEmail(email, callback) {

    const sql = `
        SELECT *
        FROM usuarios
        WHERE email = ?
    `;

    db.get(sql, [email], callback);
}


// ============================
// CRIAR USUÁRIO
// ============================

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


// ============================
// LISTAR TODOS OS USUÁRIOS
// ============================

function listarUsuarios(callback) {

    const sql = `
        SELECT
            id,
            nome,
            email,
            tipo
        FROM usuarios
        ORDER BY id DESC
    `;

    db.all(sql, [], callback);
}


module.exports = {
    buscarUsuarioPorEmail,
    criarUsuario,
    listarUsuarios
};