const db = require("./db");

db.serialize(() => {

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

            const nomesColunas = colunas.map(
                coluna => coluna.name
            );

            // =================================================
            // ADICIONAR VÍNCULO COM SIMULADO
            // =================================================

            if (!nomesColunas.includes("simulado_id")) {

                db.run(
                    `
                    ALTER TABLE resultados
                    ADD COLUMN simulado_id INTEGER
                    REFERENCES simulados(id)
                    ON DELETE SET NULL
                    `,
                    (erroAlteracao) => {

                        if (erroAlteracao) {

                            console.error(
                                "❌ Erro ao adicionar simulado_id em resultados:",
                                erroAlteracao.message
                            );

                            return;
                        }

                        console.log(
                            "✅ Coluna simulado_id adicionada em resultados."
                        );

                        criarIndice();
                    }
                );

            } else {

                criarIndice();
            }
        }
    );


    // =====================================================
    // ÍNDICE
    // =====================================================

    function criarIndice() {

        db.run(
            `
            CREATE INDEX IF NOT EXISTS
                idx_resultados_simulado
            ON resultados(simulado_id)
            `,
            (erro) => {

                if (erro) {

                    console.error(
                        "❌ Erro ao criar índice de resultados:",
                        erro.message
                    );

                    return;
                }

                console.log(
                    "✅ Índice de resultados por simulado verificado."
                );
            }
        );
    }
});