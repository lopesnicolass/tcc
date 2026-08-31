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


// =====================================================
// CRIAÇÃO DAS TABELAS
// =====================================================

db.serialize(() => {

    // =====================================================
    // USUÁRIOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            tipo TEXT NOT NULL DEFAULT 'aluno'
        )
    `);


    // =====================================================
    // RESULTADOS
    // =====================================================

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
// =====================================================
// SESSÕES DOS USUÁRIOS
db.run(`
    CREATE TABLE IF NOT EXISTS sessoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id INTEGER NOT NULL,

        login_em DATETIME DEFAULT CURRENT_TIMESTAMP,

        logout_em DATETIME,

        ativo INTEGER NOT NULL DEFAULT 1,

        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
    )
`);
    // =====================================================
    // QUESTÕES
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            pergunta TEXT NOT NULL,

            alternativa_a TEXT NOT NULL,
            alternativa_b TEXT NOT NULL,
            alternativa_c TEXT NOT NULL,
            alternativa_d TEXT NOT NULL,
            alternativa_e TEXT NOT NULL,

            correta TEXT NOT NULL,

            materia TEXT NOT NULL
        )
    `);


    // =====================================================
    // SIMULADOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS simulados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            titulo TEXT NOT NULL,

            descricao TEXT,

            tempo_limite INTEGER NOT NULL,

            quantidade_questoes INTEGER NOT NULL,

            materia TEXT NOT NULL DEFAULT 'Português',

            dificuldade TEXT NOT NULL DEFAULT 'Média',

            ativo INTEGER NOT NULL DEFAULT 1,

            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // =====================================================
    // QUESTÕES DOS SIMULADOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS simulado_questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            simulado_id INTEGER NOT NULL,

            questao_id INTEGER NOT NULL,

            ordem INTEGER NOT NULL,

            FOREIGN KEY (simulado_id)
            REFERENCES simulados(id),

            FOREIGN KEY (questao_id)
            REFERENCES questoes(id),

            UNIQUE (simulado_id, questao_id)
        )
    `);


    // =====================================================
// POST-ITS DO MURAL
// =====================================================
// =====================================================
// MURAL DE POST-ITS
// =====================================================

db.run(`
    CREATE TABLE IF NOT EXISTS mural_postits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id INTEGER NOT NULL,

        materia TEXT NOT NULL,

        texto TEXT NOT NULL,

        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
    )
`);
// =====================================================
// PROVAS ANTERIORES
// =====================================================

db.run(`
    CREATE TABLE IF NOT EXISTS provas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ano INTEGER NOT NULL,

        titulo TEXT NOT NULL,

        arquivo_prova TEXT NOT NULL,

        arquivo_gabarito TEXT NOT NULL,

        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS sessoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id INTEGER NOT NULL,

        login_em DATETIME DEFAULT CURRENT_TIMESTAMP,

        logout_em DATETIME,

        ativo INTEGER NOT NULL DEFAULT 1,

        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
    )
`);


    // =====================================================
    // MIGRAÇÃO DO BANCO EXISTENTE
    // =====================================================
    //
    // Como seu banco já existe, CREATE TABLE IF NOT EXISTS
    // NÃO adiciona colunas novas.
    //
    // Por isso verificamos se as colunas já existem.
    //


    db.all(
        `PRAGMA table_info(simulados)`,
        (erro, colunas) => {

            if (erro) {
                console.error(
                    "❌ Erro ao verificar tabela simulados:",
                    erro.message
                );

                return;
            }

            const nomesColunas =
                colunas.map((coluna) => coluna.name);


            // MATÉRIA

            if (!nomesColunas.includes("materia")) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN materia TEXT NOT NULL DEFAULT 'Português'
                `, (erro) => {

                    if (erro) {
                        console.error(
                            "❌ Erro ao adicionar coluna materia:",
                            erro.message
                        );
                    } else {
                        console.log(
                            "✅ Coluna materia adicionada aos simulados."
                        );
                    }

                });

            }


            // DIFICULDADE

            if (!nomesColunas.includes("dificuldade")) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN dificuldade TEXT NOT NULL DEFAULT 'Média'
                `, (erro) => {

                    if (erro) {
                        console.error(
                            "❌ Erro ao adicionar coluna dificuldade:",
                            erro.message
                        );
                    } else {
                        console.log(
                            "✅ Coluna dificuldade adicionada aos simulados."
                        );
                    }

                });

            }

        }
    );

});


module.exports = db;