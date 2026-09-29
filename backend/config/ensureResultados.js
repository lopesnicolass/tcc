const db = require("./db");

db.serialize(() => {
    // =====================================================
    // GARANTIR TABELA DE RESULTADOS
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS resultados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            simulado_id INTEGER,
            acertos INTEGER NOT NULL DEFAULT 0,
            erros INTEGER NOT NULL DEFAULT 0,
            total_questoes INTEGER NOT NULL DEFAULT 0,
            porcentagem REAL NOT NULL DEFAULT 0,
            data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE,

            FOREIGN KEY (simulado_id)
                REFERENCES simulados(id)
                ON DELETE SET NULL
        )
    `, (erro) => {
        if (erro) {
            console.error(
                "❌ Erro ao garantir tabela resultados:",
                erro.message
            );

            return;
        }

        garantirColunaSimulado();
    });


    // =====================================================
    // GARANTIR SIMULADO_ID EM BANCO ANTIGO
    // =====================================================

    function garantirColunaSimulado() {

        db.all(
            `PRAGMA table_info(resultados)`,
            (erro, colunas) => {

                if (erro) {
                    console.error(
                        "❌ Erro ao verificar tabela resultados:",
                        erro.message
                    );

                    return;
                }

                const nomesColunas =
                    (colunas || []).map(
                        coluna => coluna.name
                    );

                if (
                    nomesColunas.includes(
                        "simulado_id"
                    )
                ) {

                    criarIndice();

                    return;
                }

                console.log(
                    "⚠️ Banco antigo detectado."
                );

                console.log(
                    "➡️ Adicionando coluna simulado_id..."
                );

                db.run(
                    `
                    ALTER TABLE resultados
                    ADD COLUMN simulado_id INTEGER
                    `,
                    (erroAlteracao) => {

                        if (erroAlteracao) {

                            console.error(
                                "❌ Erro ao adicionar simulado_id:",
                                erroAlteracao.message
                            );

                            return;
                        }

                        console.log(
                            "✅ Coluna simulado_id adicionada."
                        );

                        criarIndice();
                    }
                );
            }
        );
    }


    // =====================================================
    // ÍNDICE
    // =====================================================

    function criarIndice() {

        db.run(
            `
            CREATE INDEX IF NOT EXISTS
                idx_resultados_usuario
            ON resultados(usuario_id)
            `,
            (erro) => {

                if (erro) {

                    console.error(
                        "❌ Erro ao criar índice de usuário:",
                        erro.message
                    );

                    return;
                }

                db.run(
                    `
                    CREATE INDEX IF NOT EXISTS
                        idx_resultados_simulado
                    ON resultados(simulado_id)
                    `,
                    (erroIndice) => {

                        if (erroIndice) {

                            console.error(
                                "❌ Erro ao criar índice de simulado:",
                                erroIndice.message
                            );

                            return;
                        }

                        console.log(
                            "✅ Estrutura de resultados verificada."
                        );
                    }
                );
            }
        );
    }
});