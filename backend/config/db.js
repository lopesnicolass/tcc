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
        console.error("Erro ao conectar ao SQLite:");
        console.error(erro.message);
        return;
    }

    console.log("SQLite conectado com sucesso!");
});

db.serialize(() => {

    // =====================================================
    // FOREIGN KEYS
    // =====================================================

    db.run(`PRAGMA foreign_keys = ON`);


    // =====================================================
    // USUÁRIOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            email TEXT NOT NULL UNIQUE,

            senha TEXT NOT NULL,

            tipo TEXT NOT NULL DEFAULT 'aluno',

            xp INTEGER NOT NULL DEFAULT 0,

            streak INTEGER NOT NULL DEFAULT 0,

            last_active_date TEXT DEFAULT NULL,

            foto_perfil TEXT DEFAULT NULL
        )
    `);


    // =====================================================
    // MATÉRIAS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS materias (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            nome TEXT NOT NULL,

            slug TEXT NOT NULL UNIQUE,

            icone TEXT DEFAULT 'book',

            cor TEXT DEFAULT '#2196F3',

            descricao TEXT DEFAULT '',

            ativa INTEGER NOT NULL DEFAULT 1,

            ordem INTEGER NOT NULL DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // =====================================================
    // TÓPICOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS topicos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            materia_id INTEGER NOT NULL,

            nome TEXT NOT NULL,

            descricao TEXT DEFAULT '',

            ordem INTEGER NOT NULL DEFAULT 0,

            ativo INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (materia_id)
                REFERENCES materias(id)
                ON DELETE CASCADE
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

            data_realizacao DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
        )
    `);


    // =====================================================
    // SESSÕES
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS sessoes (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,

            login_em DATETIME
                DEFAULT CURRENT_TIMESTAMP,

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

            materia TEXT NOT NULL
                DEFAULT 'Português',

            dificuldade TEXT NOT NULL
                DEFAULT 'Média',

            ativo INTEGER NOT NULL DEFAULT 1,

            data_criacao DATETIME
                DEFAULT CURRENT_TIMESTAMP
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

            UNIQUE (
                simulado_id,
                questao_id
            )
        )
    `);


    // =====================================================
    // MURAL
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS mural_postits (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,

            materia TEXT NOT NULL,

            texto TEXT NOT NULL,

            data_criacao DATETIME
                DEFAULT CURRENT_TIMESTAMP,

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

            data_criacao DATETIME
                DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // =====================================================
    // FLASHCARDS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS flashcards (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            primario TEXT NOT NULL,

            secundario TEXT NOT NULL,

            materia TEXT NOT NULL,

            ativo INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME
                DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // =====================================================
    // ÍNDICES
    // =====================================================

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_topicos_materia
        ON topicos(materia_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_materias_ordem
        ON materias(ordem)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_flashcards_materia
        ON flashcards(materia)
    `);


    // =====================================================
    // MIGRAÇÃO — FOTO DE PERFIL
    // =====================================================

    db.all(
        `PRAGMA table_info(usuarios)`,
        (erro, colunas) => {

            if (erro) {
                console.error(
                    "Erro ao verificar tabela usuarios:",
                    erro.message
                );

                return;
            }

            const nomesColunas = colunas.map(
                coluna => coluna.name
            );

            if (!nomesColunas.includes("foto_perfil")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN foto_perfil TEXT
                `);
            }
        }
    );


    // =====================================================
    // MIGRAÇÃO — XP / STREAK
    // =====================================================

    db.all(
        `PRAGMA table_info(usuarios)`,
        (erro, colunas) => {

            if (erro) {
                console.error(
                    "Erro ao verificar colunas de gamificação:",
                    erro.message
                );

                return;
            }

            const nomesColunas = colunas.map(
                coluna => coluna.name
            );

            if (!nomesColunas.includes("xp")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN xp INTEGER
                    NOT NULL DEFAULT 0
                `);
            }

            if (!nomesColunas.includes("streak")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN streak INTEGER
                    NOT NULL DEFAULT 0
                `);
            }

            if (!nomesColunas.includes("last_active_date")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN last_active_date TEXT
                    DEFAULT NULL
                `);
            }
        }
    );


    // =====================================================
    // MIGRAÇÃO — SIMULADOS
    // =====================================================

    db.all(
        `PRAGMA table_info(simulados)`,
        (erro, colunas) => {

            if (erro) {
                console.error(
                    "Erro ao verificar tabela simulados:",
                    erro.message
                );

                return;
            }

            const nomesColunas = colunas.map(
                coluna => coluna.name
            );

            if (!nomesColunas.includes("materia")) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN materia TEXT
                    NOT NULL DEFAULT 'Português'
                `);
            }

            if (!nomesColunas.includes("dificuldade")) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN dificuldade TEXT
                    NOT NULL DEFAULT 'Média'
                `);
            }
        }
    );

});


module.exports = db;