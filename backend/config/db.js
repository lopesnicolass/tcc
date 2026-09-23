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

            if (!nomesColunas.includes("foto_perfil_dados")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN foto_perfil_dados BLOB
                `, (erroAlteracao) => {

                    if (erroAlteracao) {
                        console.error(
                            "Erro ao adicionar foto_perfil_dados:",
                            erroAlteracao.message
                        );
                    } else {
                        console.log(
                            "Coluna foto_perfil_dados adicionada com sucesso."
                        );
                    }

                });
            }

            if (!nomesColunas.includes("foto_perfil_tipo")) {

                db.run(`
                    ALTER TABLE usuarios
                    ADD COLUMN foto_perfil_tipo TEXT
                `, (erroAlteracao) => {

                    if (erroAlteracao) {
                        console.error(
                            "Erro ao adicionar foto_perfil_tipo:",
                            erroAlteracao.message
                        );
                    } else {
                        console.log(
                            "Coluna foto_perfil_tipo adicionada com sucesso."
                        );
                    }

                });
            }

        }
    );


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
// CONTEÚDOS ESTUDADOS PELOS USUÁRIOS
// =====================================================

db.run(`
    CREATE TABLE IF NOT EXISTS conteudos_estudados (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id INTEGER NOT NULL,

        topico_id INTEGER NOT NULL,

        estudado INTEGER NOT NULL DEFAULT 1,

        data_estudo DATETIME
            DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,

        FOREIGN KEY (topico_id)
            REFERENCES topicos(id)
            ON DELETE CASCADE,

        UNIQUE (
            usuario_id,
            topico_id
        )
    )
`);




    // =====================================================
    // PLANOS AUTOMÁTICOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS planos_automaticos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,

            meses INTEGER NOT NULL,

            dias_semana INTEGER NOT NULL,

            data_criacao DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            atualizado_em DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        )
    `);


    // =====================================================
    // ATIVIDADES DOS PLANOS AUTOMÁTICOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS plano_atividades (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            plano_id INTEGER NOT NULL,

            mes_numero INTEGER NOT NULL,

            semana_numero INTEGER NOT NULL,

            dia_semana TEXT NOT NULL,

            data_estudo TEXT,

            materia_id INTEGER,

            materia TEXT NOT NULL,

            topico_id INTEGER,

            topico TEXT NOT NULL,

            descricao TEXT DEFAULT '',

            horario TEXT DEFAULT '08:00',

            concluida INTEGER NOT NULL DEFAULT 0,

            FOREIGN KEY (plano_id)
                REFERENCES planos_automaticos(id)
                ON DELETE CASCADE,

            FOREIGN KEY (materia_id)
                REFERENCES materias(id)
                ON DELETE SET NULL,

            FOREIGN KEY (topico_id)
                REFERENCES topicos(id)
                ON DELETE SET NULL
        )
    `);


        db.run(`
        CREATE TABLE IF NOT EXISTS cronograma_atividades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            horario TEXT NOT NULL DEFAULT '08:00',
            nome TEXT NOT NULL,
            materia TEXT NOT NULL,
            concluida INTEGER NOT NULL DEFAULT 0,
            origem TEXT DEFAULT NULL,
            topico_id INTEGER DEFAULT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (topico_id) REFERENCES topicos(id) ON DELETE SET NULL
        )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_cronograma_usuario ON cronograma_atividades(usuario_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_cronograma_usuario_data ON cronograma_atividades(usuario_id, data)`);

    // =====================================================
    // ÍNDICES — PLANOS AUTOMÁTICOS
    // =====================================================

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_planos_automaticos_usuario
        ON planos_automaticos(usuario_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_plano_atividades_plano
        ON plano_atividades(plano_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_plano_atividades_data
        ON plano_atividades(data_estudo)
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
                ON DELETE CASCADE
        )
    `);

    db.run(`
    CREATE INDEX IF NOT EXISTS idx_conteudos_estudados_usuario
    ON conteudos_estudados(usuario_id)
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
                ON DELETE CASCADE
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

            topico_id INTEGER
                REFERENCES topicos(id)
                ON DELETE SET NULL,

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
                REFERENCES simulados(id)
                ON DELETE CASCADE,

            FOREIGN KEY (questao_id)
                REFERENCES questoes(id)
                ON DELETE CASCADE,

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
                ON DELETE CASCADE
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
    // MIGRAÇÃO — FLASHCARDS VINCULADOS A CONTEÚDOS
    // =====================================================

    db.all(
        `PRAGMA table_info(flashcards)`,
        (erro, colunas) => {

            if (erro) {
                console.error(
                    "Erro ao verificar tabela flashcards:",
                    erro.message
                );
                return;
            }

            const nomesColunas = colunas.map(
                coluna => coluna.name
            );

            if (!nomesColunas.includes("topico_id")) {

                db.run(`
                    ALTER TABLE flashcards
                    ADD COLUMN topico_id INTEGER
                    REFERENCES topicos(id)
                    ON DELETE SET NULL
                `, (erroAlteracao) => {

                    if (erroAlteracao) {
                        console.error(
                            "Erro ao adicionar topico_id aos flashcards:",
                            erroAlteracao.message
                        );
                    } else {
                        console.log(
                            "Coluna topico_id adicionada aos flashcards com sucesso."
                        );

                        db.run(`
                            CREATE INDEX IF NOT EXISTS idx_flashcards_topico
                            ON flashcards(topico_id)
                        `, (erroIndice) => {
                            if (erroIndice) {
                                console.error(
                                    "Erro ao criar índice dos conteúdos dos flashcards:",
                                    erroIndice.message
                                );
                            }
                        });
                    }

                });
            } else {
                db.run(`
                    CREATE INDEX IF NOT EXISTS idx_flashcards_topico
                    ON flashcards(topico_id)
                `);
            }
        }
    );


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

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_simulados_materia
        ON simulados(materia)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_simulados_topico
        ON simulados(topico_id)
    `);


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

            if (!nomesColunas.includes("topico_id")) {

                db.run(`
                    ALTER TABLE simulados
                    ADD COLUMN topico_id INTEGER
                    REFERENCES topicos(id)
                    ON DELETE SET NULL
                `, (erroAlteracao) => {

                    if (erroAlteracao) {
                        console.error(
                            "Erro ao adicionar topico_id aos simulados:",
                            erroAlteracao.message
                        );
                    } else {
                        db.run(`
                            CREATE INDEX IF NOT EXISTS idx_simulados_topico
                            ON simulados(topico_id)
                        `);
                    }
                });
            } else {
                db.run(`
                    CREATE INDEX IF NOT EXISTS idx_simulados_topico
                    ON simulados(topico_id)
                `);
            }

        }
    );


    // =====================================================
    // MIGRAÇÃO — ON DELETE CASCADE
    // (bancos criados antes desta correção não tinham
    // cascade nas FKs para usuarios/simulados/questoes,
    // o que impedia excluir usuário/questão que já
    // possuísse resultados, sessões, post-its ou vínculos
    // em simulados)
    // =====================================================

    function garantirCascade(
        nomeTabela,
        tabelaReferenciada,
        sqlCriarTabelaComCascade,
        colunas
    ) {

        db.all(
            `PRAGMA foreign_key_list(${nomeTabela})`,
            (erro, fks) => {

                if (erro) {
                    console.error(
                        `Erro ao verificar FKs de ${nomeTabela}:`,
                        erro.message
                    );
                    return;
                }

                const fkAlvo = fks.find(
                    (fk) => fk.table === tabelaReferenciada
                );

                if (fkAlvo && fkAlvo.on_delete === "CASCADE") {
                    // já está correto, nada a fazer
                    return;
                }

                console.log(
                    `⏳ Migrando tabela ${nomeTabela} para ON DELETE CASCADE...`
                );

                db.exec(
                    `
                    PRAGMA foreign_keys = OFF;

                    BEGIN TRANSACTION;

                    ALTER TABLE ${nomeTabela}
                        RENAME TO ${nomeTabela}_old;

                    ${sqlCriarTabelaComCascade}

                    INSERT INTO ${nomeTabela} (${colunas})
                        SELECT ${colunas} FROM ${nomeTabela}_old;

                    DROP TABLE ${nomeTabela}_old;

                    COMMIT;

                    PRAGMA foreign_keys = ON;
                    `,
                    (erroMigracao) => {

                        if (erroMigracao) {
                            console.error(
                                `❌ Erro ao migrar ${nomeTabela}:`,
                                erroMigracao.message
                            );
                            return;
                        }

                        console.log(
                            `✅ Tabela ${nomeTabela} migrada com sucesso (ON DELETE CASCADE).`
                        );
                    }
                );
            }
        );
    }

    garantirCascade(
        "resultados",
        "usuarios",
        `
        CREATE TABLE resultados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            acertos INTEGER NOT NULL,
            erros INTEGER NOT NULL,
            total_questoes INTEGER NOT NULL,
            porcentagem REAL NOT NULL,
            data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        `,
        "id, usuario_id, acertos, erros, total_questoes, porcentagem, data_realizacao"
    );

    garantirCascade(
        "sessoes",
        "usuarios",
        `
        CREATE TABLE sessoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            login_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            logout_em DATETIME,
            ativo INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        `,
        "id, usuario_id, login_em, logout_em, ativo"
    );

    garantirCascade(
        "mural_postits",
        "usuarios",
        `
        CREATE TABLE mural_postits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            materia TEXT NOT NULL,
            texto TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        `,
        "id, usuario_id, materia, texto, data_criacao"
    );

    garantirCascade(
        "simulado_questoes",
        "questoes",
        `
        CREATE TABLE simulado_questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulado_id INTEGER NOT NULL,
            questao_id INTEGER NOT NULL,
            ordem INTEGER NOT NULL,
            FOREIGN KEY (simulado_id) REFERENCES simulados(id) ON DELETE CASCADE,
            FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE,
            UNIQUE (simulado_id, questao_id)
        );
        `,
        "id, simulado_id, questao_id, ordem"
    );
    db.run(`
    CREATE TABLE IF NOT EXISTS sessoes_flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        total_cards INTEGER NOT NULL DEFAULT 0,
        acertos INTEGER NOT NULL DEFAULT 0,
        erros INTEGER NOT NULL DEFAULT 0,
        data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_fim DATETIME DEFAULT NULL,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS respostas_flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessao_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        flashcard_id INTEGER NOT NULL,
        materia TEXT NOT NULL,
        acertou INTEGER NOT NULL,
        data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessao_id)
            REFERENCES sessoes_flashcards(id)
            ON DELETE CASCADE,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,
        FOREIGN KEY (flashcard_id)
            REFERENCES flashcards(id)
            ON DELETE CASCADE
    )
`);

db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessoes_flashcards_usuario
    ON sessoes_flashcards(usuario_id)
`);

db.run(`
    CREATE INDEX IF NOT EXISTS idx_respostas_flashcards_usuario
    ON respostas_flashcards(usuario_id)
`);

db.run(`
    CREATE INDEX IF NOT EXISTS idx_respostas_flashcards_materia
    ON respostas_flashcards(usuario_id, materia)
`);

    // =====================================================
    // PÁGINAS DINÂMICAS DE CONTEÚDO
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS paginas_conteudo (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            topico_id INTEGER NOT NULL,

            titulo TEXT NOT NULL,

            descricao TEXT DEFAULT '',

            publicado INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (topico_id)
                REFERENCES topicos(id)
                ON DELETE CASCADE,

            UNIQUE (topico_id)
        )
    `);


    // =====================================================
    // BLOCOS DAS PÁGINAS DE CONTEÚDO
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS blocos_conteudo (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            pagina_id INTEGER NOT NULL,

            tipo TEXT NOT NULL,

            ordem INTEGER NOT NULL DEFAULT 0,

            dados TEXT NOT NULL DEFAULT '{}',

            ativo INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (pagina_id)
                REFERENCES paginas_conteudo(id)
                ON DELETE CASCADE
        )
    `);


    // =====================================================
    // ÍNDICES — PÁGINAS DE CONTEÚDO
    // =====================================================

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_paginas_conteudo_topico
        ON paginas_conteudo(topico_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_blocos_conteudo_pagina
        ON blocos_conteudo(pagina_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_blocos_conteudo_ordem
        ON blocos_conteudo(pagina_id, ordem)
    `);

    
});

module.exports = db;