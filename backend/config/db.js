const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const caminhoBanco = path.join(
    __dirname,
    "..",
    "banco",
    "vestibulinho.sqlite"
);

const db = new sqlite3.Database(caminhoBanco, (erro) => {

    if (erro) {
        console.error("❌ Erro ao conectar ao SQLite:");
        console.error(erro.message);
        return;
    }

    console.log("✅ SQLite conectado com sucesso!");
});


// ============================
// CRIAÇÃO DAS TABELAS
// ============================

db.serialize(() => {

    db.run(`
       CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'aluno'
)
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS resultados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            acertos INTEGER NOT NULL,
            erros INTEGER NOT NULL,
            total_questoes INTEGER NOT NULL,
            porcentagem REAL NOT NULL,
            data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
        )
    `);

});


module.exports = db;