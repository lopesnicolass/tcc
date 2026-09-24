const db = require("../config/db");

function listarDatasImportantes(callback) {
    const sql = `
        SELECT id, titulo, tipo, data, descricao, criado_em, atualizado_em
        FROM datas_importantes
        ORDER BY data ASC, id ASC
    `;

    db.all(sql, callback);
}

function buscarDataImportantePorId(id, callback) {
    const sql = `
        SELECT *
        FROM datas_importantes
        WHERE id = ?
    `;

    db.get(sql, [id], callback);
}

function criarDataImportante(dados, callback) {
    const sql = `
        INSERT INTO datas_importantes
        (titulo, tipo, data, descricao)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [dados.titulo, dados.tipo || "Outro", dados.data, dados.descricao || ""], function (erro) {
        if (erro) return callback(erro);
        callback(null, this);
    });
}

function atualizarDataImportante(id, dados, callback) {
    const campos = [];
    const valores = [];

    if (dados.titulo !== undefined) {
        campos.push("titulo = ?");
        valores.push(dados.titulo);
    }
    if (dados.tipo !== undefined) {
        campos.push("tipo = ?");
        valores.push(dados.tipo);
    }
    if (dados.data !== undefined) {
        campos.push("data = ?");
        valores.push(dados.data);
    }
    if (dados.descricao !== undefined) {
        campos.push("descricao = ?");
        valores.push(dados.descricao);
    }

    if (!campos.length) {
        return callback(new Error("Nenhum campo para atualizar."));
    }

    campos.push("atualizado_em = CURRENT_TIMESTAMP");
    valores.push(id);

    db.run(
        `UPDATE datas_importantes SET ${campos.join(", ")} WHERE id = ?`,
        valores,
        function (erro) {
            if (erro) return callback(erro);
            callback(null, this);
        }
    );
}

function excluirDataImportante(id, callback) {
    db.run(
        `DELETE FROM datas_importantes WHERE id = ?`,
        [id],
        function (erro) {
            if (erro) return callback(erro);
            callback(null, this);
        }
    );
}

module.exports = {
    listarDatasImportantes,
    buscarDataImportantePorId,
    criarDataImportante,
    atualizarDataImportante,
    excluirDataImportante
};
