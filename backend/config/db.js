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
    // FOREIGN KEYS
    // =====================================================

    db.run(`PRAGMA foreign_keys = ON`, (erro) => {
        if (erro) {
            console.error(
                "❌ Erro ao ativar foreign keys:",
                erro.message
            );
        }
    });


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
    `, (erro) => {

        if (erro) {
            console.error(
                "❌ Erro ao criar tabela materias:",
                erro.message
            );

            return;
        }


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
        `, (erroTopicos) => {

            if (erroTopicos) {
                console.error(
                    "❌ Erro ao criar tabela topicos:",
                    erroTopicos.message
                );

                return;
            }


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


            // =====================================================
            // SEED INICIAL
            // =====================================================

            db.get(
                `SELECT COUNT(*) AS total FROM materias`,
                [],
                (erroCount, resultado) => {

                    if (erroCount) {
                        console.error(
                            "❌ Erro ao verificar matérias:",
                            erroCount.message
                        );

                        return;
                    }


                    // Se já existem matérias,
                    // não cadastra novamente.
                    if (resultado.total > 0) {
                        return;
                    }


                    const materias = [

                        // =================================================
                        // PORTUGUÊS
                        // =================================================

                        {
                            nome: "Língua Portuguesa",

                            slug: "lingua-portuguesa",

                            icone: "book",

                            cor: "#2196F3",

                            descricao:
                                "Leitura, interpretação, gramática e produção textual.",

                            topicos: [
                                "Interpretação de texto",
                                "Gêneros textuais",
                                "Classes gramaticais",
                                "Ortografia",
                                "Pontuação",
                                "Concordância verbal e nominal"
                            ]
                        },


                        // =================================================
                        // MATEMÁTICA
                        // =================================================

                        {
                            nome: "Matemática",

                            slug: "matematica",

                            icone: "calculator",

                            cor: "#1976D2",

                            descricao:
                                "Conteúdos matemáticos essenciais para o Vestibulinho.",

                            topicos: [
                                "Operações básicas",
                                "Frações",
                                "Porcentagem",
                                "Razão e proporção",
                                "Equações",
                                "Geometria"
                            ]
                        },


                        // =================================================
                        // HISTÓRIA
                        // =================================================

                        {
                            nome: "História",

                            slug: "historia",

                            icone: "book",

                            cor: "#1565C0",

                            descricao:
                                "Principais acontecimentos históricos.",

                            topicos: [
                                "Brasil Colonial",
                                "Independência do Brasil",
                                "República",
                                "Revolução Industrial",
                                "Guerras Mundiais",
                                "Ditadura Militar"
                            ]
                        },


                        // =================================================
                        // GEOGRAFIA
                        // =================================================

                        {
                            nome: "Geografia",

                            slug: "geografia",

                            icone: "globe",

                            cor: "#0288D1",

                            descricao:
                                "Espaço geográfico, sociedade e meio ambiente.",

                            topicos: [
                                "Cartografia",
                                "Relevo",
                                "Clima",
                                "População",
                                "Urbanização",
                                "Meio ambiente"
                            ]
                        },


                        // =================================================
                        // CIÊNCIAS
                        // =================================================

                        {
                            nome: "Ciências da Natureza",

                            slug: "ciencias-da-natureza",

                            icone: "flask",

                            cor: "#039BE5",

                            descricao:
                                "Conceitos fundamentais de Ciências.",

                            topicos: [
                                "Sistema solar",
                                "Corpo humano",
                                "Ecologia",
                                "Energia",
                                "Matéria",
                                "Transformações químicas"
                            ]
                        },


                        // =================================================
                        // RACIOCÍNIO
                        // =================================================

                        {
                            nome: "Raciocínio e Interpretação",

                            slug: "raciocinio-e-interpretacao",

                            icone: "target",

                            cor: "#0D47A1",

                            descricao:
                                "Questões de lógica, interpretação e raciocínio.",

                            topicos: [
                                "Raciocínio lógico",
                                "Sequências",
                                "Problemas matemáticos",
                                "Interpretação de gráficos",
                                "Análise de informações"
                            ]
                        }

                    ];


                    let indiceMateria = 0;


                    function inserirProximaMateria() {

                        if (indiceMateria >= materias.length) {

                            console.log(
                                "✅ Conteúdos iniciais cadastrados."
                            );

                            return;
                        }


                        const materia =
                            materias[indiceMateria];


                        db.run(
                            `
                                INSERT INTO materias
                                (
                                    nome,
                                    slug,
                                    icone,
                                    cor,
                                    descricao,
                                    ativa,
                                    ordem
                                )

                                VALUES (?, ?, ?, ?, ?, 1, ?)
                            `,

                            [
                                materia.nome,
                                materia.slug,
                                materia.icone,
                                materia.cor,
                                materia.descricao,
                                indiceMateria + 1
                            ],

                            function (erroMateria) {

                                if (erroMateria) {

                                    console.error(
                                        "❌ Erro ao inserir matéria inicial:",
                                        erroMateria.message
                                    );

                                    return;
                                }


                                const materiaId =
                                    this.lastID;


                                let indiceTopico = 0;


                                function inserirProximoTopico() {

                                    if (
                                        indiceTopico >=
                                        materia.topicos.length
                                    ) {

                                        indiceMateria++;

                                        inserirProximaMateria();

                                        return;
                                    }


                                    db.run(
                                        `
                                            INSERT INTO topicos
                                            (
                                                materia_id,
                                                nome,
                                                descricao,
                                                ordem,
                                                ativo
                                            )

                                            VALUES (?, ?, '', ?, 1)
                                        `,

                                        [
                                            materiaId,

                                            materia.topicos[
                                                indiceTopico
                                            ],

                                            indiceTopico + 1
                                        ],

                                        (erroTopico) => {

                                            if (erroTopico) {

                                                console.error(
                                                    "❌ Erro ao inserir tópico inicial:",
                                                    erroTopico.message
                                                );

                                                return;
                                            }


                                            indiceTopico++;

                                            inserirProximoTopico();
                                        }
                                    );
                                }


                                inserirProximoTopico();
                            }
                        );
                    }


                    inserirProximaMateria();
                }
            );
        });
    });


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

            last_active_date TEXT DEFAULT NULL
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
    // PROVAS
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
    // MIGRAÇÃO — FOTO DE PERFIL
    // =====================================================

    db.all(
        `PRAGMA table_info(usuarios)`,

        (erro, colunas) => {

            if (erro) {

                console.error(
                    "❌ Erro ao verificar tabela usuarios:",
                    erro.message
                );

                return;
            }


            const nomesColunas =
                colunas.map(
                    coluna => coluna.name
                );


            if (
                !nomesColunas.includes(
                    "foto_perfil"
                )
            ) {

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
                    "❌ Erro ao verificar colunas de gamificação:",
                    erro.message
                );

                return;
            }


            const nomesColunas =
                colunas.map(
                    coluna => coluna.name
                );


            if (
                !nomesColunas.includes("xp")
            ) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN xp INTEGER
                    NOT NULL DEFAULT 0
                `);
            }


            if (
                !nomesColunas.includes("streak")
            ) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN streak INTEGER
                    NOT NULL DEFAULT 0
                `);
            }


            if (
                !nomesColunas.includes(
                    "last_active_date"
                )
            ) {

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
                    "❌ Erro ao verificar tabela simulados:",
                    erro.message
                );

                return;
            }


            const nomesColunas =
                colunas.map(
                    coluna => coluna.name
                );


            if (
                !nomesColunas.includes("materia")
            ) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN materia TEXT
                    NOT NULL DEFAULT 'Português'
                `);
            }


            if (
                !nomesColunas.includes(
                    "dificuldade"
                )
            ) {

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