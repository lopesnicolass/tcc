const db = require("../config/db");

const MIN_QUESTOES_SIMULADO = 10;

const DIFICULDADES_VALIDAS = [
    "Fácil",
    "Média",
    "Difícil"
];

function criarErro(
    mensagem,
    code
) {
    const erro =
        new Error(
            mensagem
        );

    erro.code =
        code;

    return erro;
}


// =====================================================
// VALIDAR TÓPICO + MATÉRIA
// =====================================================

function validarTopicoDaMateria(
    topicoId,
    materia,
    callback
) {

    db.get(
        `
            SELECT
                t.id,
                t.nome,
                t.materia_id,
                m.nome AS materia_nome

            FROM topicos t

            INNER JOIN materias m
                ON m.id = t.materia_id

            WHERE t.id = ?
              AND m.nome = ?
              AND t.ativo = 1
              AND m.ativa = 1
        `,
        [
            topicoId,
            materia
        ],
        callback
    );
}


// =====================================================
// CRIAR SIMULADO
// =====================================================

function criarSimulado(
    titulo,
    descricao,
    materia,
    dificuldade,
    tempoLimite,
    quantidadeQuestoes,
    topicoId,
    callback
) {

    validarTopicoDaMateria(
        topicoId,
        materia,
        (
            erro,
            topico
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            if (!topico) {

                return callback(
                    criarErro(
                        "O conteúdo informado não existe para a matéria selecionada.",
                        "TOPICO_NOT_FOUND"
                    )
                );
            }


            db.run(
                `
                    INSERT INTO simulados
                    (
                        titulo,
                        descricao,
                        materia,
                        dificuldade,
                        topico_id,
                        tempo_limite,
                        quantidade_questoes,
                        ativo
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `,
                [
                    titulo,
                    descricao,
                    topico.materia_nome,
                    dificuldade,
                    topico.id,
                    tempoLimite,
                    quantidadeQuestoes
                ],
                function (erroInsert) {

                    if (erroInsert) {
                        return callback(
                            erroInsert
                        );
                    }

                    callback(
                        null,
                        this
                    );
                }
            );
        }
    );
}


// =====================================================
// LISTAR SIMULADOS ATIVOS
// =====================================================

function listarSimulados(
    callback
) {

    db.all(
        `
            SELECT
                s.id,
                s.titulo,
                s.descricao,

                COALESCE(
                    m.nome,
                    s.materia
                ) AS materia,

                s.dificuldade,
                s.topico_id,
                t.nome AS topico,
                s.tempo_limite,
                s.quantidade_questoes,
                s.ativo,
                s.data_criacao

            FROM simulados s

            LEFT JOIN topicos t
                ON t.id = s.topico_id

            LEFT JOIN materias m
                ON m.id = t.materia_id

            WHERE s.ativo = 1

            ORDER BY
                s.id DESC
        `,
        [],
        callback
    );
}


// =====================================================
// BUSCAR SIMULADO ATIVO
// =====================================================

function buscarSimuladoPorId(
    id,
    callback
) {

    db.get(
        `
            SELECT
                s.id,
                s.titulo,
                s.descricao,

                COALESCE(
                    m.nome,
                    s.materia
                ) AS materia,

                s.dificuldade,
                s.topico_id,
                t.nome AS topico,
                s.tempo_limite,
                s.quantidade_questoes,
                s.ativo,
                s.data_criacao

            FROM simulados s

            LEFT JOIN topicos t
                ON t.id = s.topico_id

            LEFT JOIN materias m
                ON m.id = t.materia_id

            WHERE s.id = ?
              AND s.ativo = 1
        `,
        [
            id
        ],
        callback
    );
}


// =====================================================
// CONTAR QUESTÕES
// =====================================================

function contarQuestoesDoSimulado(
    simuladoId,
    callback
) {

    db.get(
        `
            SELECT
                COUNT(*) AS total

            FROM simulado_questoes

            WHERE simulado_id = ?
        `,
        [
            simuladoId
        ],
        (
            erro,
            resultado
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                Number(
                    resultado?.total || 0
                )
            );
        }
    );
}


// =====================================================
// REMOVER QUESTÕES ALÉM DA QUANTIDADE ATUAL
// =====================================================

function removerQuestoesForaDaQuantidade(
    simuladoId,
    quantidadeQuestoes,
    callback
) {

    db.run(
        `
            DELETE FROM simulado_questoes

            WHERE simulado_id = ?
              AND ordem > ?
        `,
        [
            simuladoId,
            quantidadeQuestoes
        ],
        callback
    );
}


// =====================================================
// ATUALIZAR SIMULADO
// =====================================================

function atualizarSimulado(
    id,
    titulo,
    descricao,
    materia,
    dificuldade,
    tempoLimite,
    quantidadeQuestoes,
    topicoId,
    callback
) {

    validarTopicoDaMateria(
        topicoId,
        materia,
        (
            erro,
            topico
        ) => {

            if (erro) {
                return callback(
                    erro
                );
            }

            if (!topico) {

                return callback(
                    criarErro(
                        "O conteúdo informado não existe para a matéria selecionada.",
                        "TOPICO_NOT_FOUND"
                    )
                );
            }


            db.run(
                `
                    UPDATE simulados

                    SET
                        titulo = ?,
                        descricao = ?,
                        materia = ?,
                        dificuldade = ?,
                        topico_id = ?,
                        tempo_limite = ?,
                        quantidade_questoes = ?

                    WHERE id = ?
                      AND ativo = 1
                `,
                [
                    titulo,
                    descricao,
                    topico.materia_nome,
                    dificuldade,
                    topico.id,
                    tempoLimite,
                    quantidadeQuestoes,
                    id
                ],
                function (
                    erroUpdate
                ) {

                    if (erroUpdate) {
                        return callback(
                            erroUpdate
                        );
                    }


                    if (
                        this.changes === 0
                    ) {

                        return callback(
                            null,
                            this,
                            "NOT_FOUND"
                        );
                    }


                    /*
                     * Quando o administrador remove uma
                     * questão pelo frontend, as questões que
                     * permanecem recebem novas posições.
                     *
                     * Assim, qualquer vínculo que ainda esteja
                     * além da nova quantidade pode ser removido.
                     */

                    removerQuestoesForaDaQuantidade(
                        id,
                        quantidadeQuestoes,
                        (
                            erroLimpeza
                        ) => {

                            if (
                                erroLimpeza
                            ) {

                                return callback(
                                    erroLimpeza
                                );
                            }

                            callback(
                                null,
                                this
                            );
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// DESATIVAR SIMULADO
// =====================================================
//
// Não usamos DELETE físico.
//
// O histórico de resultados continua apontando para o
// simulado antigo e o aluno deixa de recebê-lo na listagem.
//

function excluirSimulado(
    id,
    callback
) {

    db.run(
        `
            UPDATE simulados

            SET
                ativo = 0

            WHERE id = ?
              AND ativo = 1
        `,
        [
            id
        ],
        function (erro) {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// BUSCAR QUESTÃO
// =====================================================

function buscarQuestao(
    questaoId,
    callback
) {

    db.get(
        `
            SELECT
                id,
                pergunta,
                alternativa_a,
                alternativa_b,
                alternativa_c,
                alternativa_d,
                alternativa_e,
                correta,
                materia

            FROM questoes

            WHERE id = ?
        `,
        [
            questaoId
        ],
        callback
    );
}


// =====================================================
// VERIFICAR QUESTÃO DUPLICADA
// =====================================================

function verificarQuestaoDuplicada(
    simuladoId,
    questaoId,
    callback
) {

    db.get(
        `
            SELECT
                id

            FROM simulado_questoes

            WHERE simulado_id = ?
              AND questao_id = ?

            LIMIT 1
        `,
        [
            simuladoId,
            questaoId
        ],
        callback
    );
}


// =====================================================
// ADICIONAR QUESTÃO
// =====================================================

function adicionarQuestao(
    simuladoId,
    questaoId,
    ordem,
    callback
) {

    const novaOrdem =
        Number(ordem);

    if (
        !Number.isInteger(
            novaOrdem
        ) ||
        novaOrdem <= 0
    ) {

        return callback(
            criarErro(
                "A ordem da questão é inválida.",
                "ORDEM_INVALIDA"
            )
        );
    }


    db.get(
        `
            SELECT
                id,
                materia,
                quantidade_questoes

            FROM simulados

            WHERE id = ?
              AND ativo = 1
        `,
        [
            simuladoId
        ],
        (
            erroSimulado,
            simulado
        ) => {

            if (erroSimulado) {
                return callback(
                    erroSimulado
                );
            }

            if (!simulado) {

                return callback(
                    criarErro(
                        "Simulado não encontrado.",
                        "SIMULADO_NOT_FOUND"
                    )
                );
            }


            buscarQuestao(
                questaoId,
                (
                    erroQuestao,
                    questao
                ) => {

                    if (erroQuestao) {
                        return callback(
                            erroQuestao
                        );
                    }

                    if (!questao) {

                        return callback(
                            criarErro(
                                "Questão não encontrada.",
                                "QUESTAO_NOT_FOUND"
                            )
                        );
                    }


                    if (
                        String(
                            questao.materia
                        ).trim() !==
                        String(
                            simulado.materia
                        ).trim()
                    ) {

                        return callback(
                            criarErro(
                                "A questão precisa pertencer à mesma matéria do simulado.",
                                "QUESTAO_MATERIA_INVALIDA"
                            )
                        );
                    }


                    verificarQuestaoDuplicada(
                        simuladoId,
                        questaoId,
                        (
                            erroDuplicada,
                            existente
                        ) => {

                            if (
                                erroDuplicada
                            ) {

                                return callback(
                                    erroDuplicada
                                );
                            }


                            if (
                                existente
                            ) {

                                return callback(
                                    criarErro(
                                        "Esta questão já está adicionada ao simulado.",
                                        "QUESTAO_DUPLICADA"
                                    )
                                );
                            }


                            contarQuestoesDoSimulado(
                                simuladoId,
                                (
                                    erroContagem,
                                    totalAtual
                                ) => {

                                    if (
                                        erroContagem
                                    ) {

                                        return callback(
                                            erroContagem
                                        );
                                    }


                                    db.get(
                                        `
                                            SELECT
                                                id

                                            FROM simulado_questoes

                                            WHERE simulado_id = ?
                                              AND ordem = ?

                                            LIMIT 1
                                        `,
                                        [
                                            simuladoId,
                                            novaOrdem
                                        ],
                                        (
                                            erroOrdem,
                                            ordemExistente
                                        ) => {

                                            if (
                                                erroOrdem
                                            ) {

                                                return callback(
                                                    erroOrdem
                                                );
                                            }


                                            /*
                                             * Na edição, uma questão removida
                                             * pode deixar a posição ocupada até
                                             * que uma nova questão seja enviada.
                                             *
                                             * Por isso permitimos substituição
                                             * quando a posição já existe.
                                             */

                                            if (
                                                totalAtual >=
                                                    Number(
                                                        simulado.quantidade_questoes
                                                    ) &&
                                                !ordemExistente
                                            ) {

                                                return callback(
                                                    criarErro(
                                                        "A quantidade de questões do simulado já foi atingida.",
                                                        "QUESTOES_LIMITE_ATINGIDO"
                                                    )
                                                );
                                            }


                                            const inserir =
                                                () => {

                                                    db.run(
                                                        `
                                                            INSERT INTO simulado_questoes
                                                            (
                                                                simulado_id,
                                                                questao_id,
                                                                ordem
                                                            )

                                                            VALUES (?, ?, ?)
                                                        `,
                                                        [
                                                            simuladoId,
                                                            questaoId,
                                                            novaOrdem
                                                        ],
                                                        function (
                                                            erroInsert
                                                        ) {

                                                            if (
                                                                erroInsert
                                                            ) {

                                                                return callback(
                                                                    erroInsert
                                                                );
                                                            }

                                                            callback(
                                                                null,
                                                                this
                                                            );
                                                        }
                                                    );
                                                };


                                            /*
                                             * Se a posição já está ocupada,
                                             * ela pertence a uma questão antiga
                                             * que foi removida/reorganizada
                                             * pelo administrador.
                                             */

                                            if (
                                                ordemExistente
                                            ) {

                                                db.run(
                                                    `
                                                        DELETE FROM simulado_questoes

                                                        WHERE id = ?
                                                    `,
                                                    [
                                                        ordemExistente.id
                                                    ],
                                                    (
                                                        erroExcluir
                                                    ) => {

                                                        if (
                                                            erroExcluir
                                                        ) {

                                                            return callback(
                                                                erroExcluir
                                                            );
                                                        }

                                                        inserir();
                                                    }
                                                );

                                            } else {

                                                inserir();

                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// LISTAR QUESTÕES DO SIMULADO — ADMIN
// =====================================================

function listarQuestoesDoSimulado(
    simuladoId,
    callback
) {

    db.all(
        `
            SELECT
                q.id,
                q.pergunta,
                q.alternativa_a,
                q.alternativa_b,
                q.alternativa_c,
                q.alternativa_d,
                q.alternativa_e,
                q.correta,
                q.materia,
                sq.ordem

            FROM simulado_questoes sq

            INNER JOIN questoes q
                ON q.id = sq.questao_id

            INNER JOIN simulados s
                ON s.id = sq.simulado_id

            WHERE sq.simulado_id = ?
              AND s.ativo = 1

            ORDER BY
                sq.ordem ASC,
                sq.id ASC
        `,
        [
            simuladoId
        ],
        callback
    );
}


// =====================================================
// LISTAR QUESTÕES DO SIMULADO — ALUNO
// =====================================================
//
// O gabarito NÃO é retornado aqui.
//

function listarQuestoesDoSimuladoParaResponder(
    simuladoId,
    callback
) {

    db.all(
        `
            SELECT
                q.id,
                q.pergunta,
                q.alternativa_a,
                q.alternativa_b,
                q.alternativa_c,
                q.alternativa_d,
                q.alternativa_e,
                q.materia,
                sq.ordem

            FROM simulado_questoes sq

            INNER JOIN questoes q
                ON q.id = sq.questao_id

            INNER JOIN simulados s
                ON s.id = sq.simulado_id

            WHERE sq.simulado_id = ?
              AND s.ativo = 1

            ORDER BY
                sq.ordem ASC,
                sq.id ASC
        `,
        [
            simuladoId
        ],
        callback
    );
}


// =====================================================
// BUSCAR GABARITO
// =====================================================
//
// Uso exclusivo interno para correção.
//

function buscarGabaritoDoSimulado(
    simuladoId,
    callback
) {

    db.all(
        `
            SELECT
                q.id,
                q.correta,
                sq.ordem

            FROM simulado_questoes sq

            INNER JOIN questoes q
                ON q.id = sq.questao_id

            INNER JOIN simulados s
                ON s.id = sq.simulado_id

            WHERE sq.simulado_id = ?
              AND s.ativo = 1

            ORDER BY
                sq.ordem ASC,
                sq.id ASC
        `,
        [
            simuladoId
        ],
        callback
    );
}


// =====================================================
// REMOVER QUESTÃO
// =====================================================

function removerQuestao(
    simuladoId,
    questaoId,
    callback
) {

    db.run(
        `
            DELETE FROM simulado_questoes

            WHERE simulado_id = ?
              AND questao_id = ?
        `,
        [
            simuladoId,
            questaoId
        ],
        function (erro) {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                this
            );
        }
    );
}


// =====================================================
// ATUALIZAR ORDEM
// =====================================================

function atualizarOrdemQuestao(
    simuladoId,
    questaoId,
    ordem,
    callback
) {

    const novaOrdem =
        Number(ordem);


    if (
        !Number.isInteger(
            novaOrdem
        ) ||
        novaOrdem <= 0
    ) {

        return callback(
            criarErro(
                "A ordem da questão é inválida.",
                "ORDEM_INVALIDA"
            )
        );
    }


    db.get(
        `
            SELECT
                id

            FROM simulado_questoes

            WHERE simulado_id = ?
              AND questao_id = ?

            LIMIT 1
        `,
        [
            simuladoId,
            questaoId
        ],
        (
            erroAtual,
            atual
        ) => {

            if (erroAtual) {
                return callback(
                    erroAtual
                );
            }


            if (!atual) {

                return callback(
                    criarErro(
                        "Questão não encontrada neste simulado.",
                        "QUESTAO_SIMULADO_NOT_FOUND"
                    )
                );
            }


            /*
             * A tela do admin reconstrói a sequência
             * das questões.
             *
             * Quando uma questão foi removida do meio,
             * a próxima ocupa sua posição.
             *
             * O vínculo antigo daquela posição pode,
             * portanto, ser removido.
             */

            db.run(
                `
                    DELETE FROM simulado_questoes

                    WHERE simulado_id = ?
                      AND ordem = ?
                      AND questao_id <> ?
                `,
                [
                    simuladoId,
                    novaOrdem,
                    questaoId
                ],
                (
                    erroLimpeza
                ) => {

                    if (
                        erroLimpeza
                    ) {

                        return callback(
                            erroLimpeza
                        );
                    }


                    db.run(
                        `
                            UPDATE simulado_questoes

                            SET
                                ordem = ?

                            WHERE simulado_id = ?
                              AND questao_id = ?
                        `,
                        [
                            novaOrdem,
                            simuladoId,
                            questaoId
                        ],
                        function (
                            erroUpdate
                        ) {

                            if (
                                erroUpdate
                            ) {

                                return callback(
                                    erroUpdate
                                );
                            }

                            callback(
                                null,
                                this
                            );
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// REMOVER TODAS AS QUESTÕES
// =====================================================
//
// Mantida para compatibilidade com código antigo.
// A exclusão normal do simulado agora é lógica e não usa
// esta função.
//

function removerTodasQuestoesDoSimulado(
    simuladoId,
    callback
) {

    db.run(
        `
            DELETE FROM simulado_questoes

            WHERE simulado_id = ?
        `,
        [
            simuladoId
        ],
        function (erro) {

            if (erro) {
                return callback(
                    erro
                );
            }

            callback(
                null,
                this
            );
        }
    );
}


module.exports = {

    MIN_QUESTOES_SIMULADO,

    DIFICULDADES_VALIDAS,

    criarSimulado,

    listarSimulados,

    buscarSimuladoPorId,

    atualizarSimulado,

    excluirSimulado,

    adicionarQuestao,

    listarQuestoesDoSimulado,

    listarQuestoesDoSimuladoParaResponder,

    buscarGabaritoDoSimulado,

    removerQuestao,

    atualizarOrdemQuestao,

    removerTodasQuestoesDoSimulado

};