const {
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
    atualizarOrdemQuestao
} = require("../models/simuladoModel");


const {
    criarResultado
} = require("../models/resultadoModel");


// =====================================================
// AUXILIAR
// =====================================================

function numeroInteiroPositivo(
    valor
) {

    const numero =
        Number(valor);

    return (
        Number.isInteger(
            numero
        ) &&
        numero > 0
    )
        ? numero
        : null;
}


// =====================================================
// CADASTRAR SIMULADO
// =====================================================

function cadastrarSimulado(
    req,
    res
) {

    const {
        titulo,
        descricao,
        materia,
        dificuldade,

        tempoLimite,
        tempo_limite,

        quantidadeQuestoes,
        quantidade_questoes,

        topicoId,
        topico_id
    } = req.body || {};


    const tempo =
        tempoLimite ??
        tempo_limite;


    const quantidade =
        quantidadeQuestoes ??
        quantidade_questoes;


    const idTopico =
        topicoId ??
        topico_id;


    const tempoNumero =
        numeroInteiroPositivo(
            tempo
        );


    const quantidadeNumero =
        numeroInteiroPositivo(
            quantidade
        );


    const topicoNumero =
        numeroInteiroPositivo(
            idTopico
        );


    if (
        !String(
            titulo || ""
        ).trim() ||

        !String(
            materia || ""
        ).trim() ||

        !DIFICULDADES_VALIDAS.includes(
            String(
                dificuldade || ""
            )
        ) ||

        !tempoNumero ||

        !quantidadeNumero ||

        !topicoNumero
    ) {

        return res.status(400).json({
            mensagem:
                "Preencha todos os campos obrigatórios corretamente."
        });
    }


    if (
        quantidadeNumero <
        MIN_QUESTOES_SIMULADO
    ) {

        return res.status(400).json({
            mensagem:
                `Um simulado precisa ter no mínimo ${MIN_QUESTOES_SIMULADO} questões.`
        });
    }


    criarSimulado(
        String(
            titulo
        ).trim(),

        String(
            descricao || ""
        ).trim(),

        String(
            materia
        ).trim(),

        String(
            dificuldade
        ),

        tempoNumero,

        quantidadeNumero,

        topicoNumero,

        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao cadastrar simulado:",
                    erro
                );


                if (
                    erro.code ===
                    "TOPICO_NOT_FOUND"
                ) {

                    return res.status(400).json({
                        mensagem:
                            "O conteúdo selecionado não existe para a matéria escolhida."
                    });
                }


                return res.status(500).json({
                    mensagem:
                        "Erro ao cadastrar simulado."
                });
            }


            return res.status(201).json({

                mensagem:
                    "Simulado criado com sucesso!",

                simulado: {

                    id:
                        resultado.lastID,

                    titulo:
                        String(
                            titulo
                        ).trim(),

                    descricao:
                        String(
                            descricao || ""
                        ).trim(),

                    materia:
                        String(
                            materia
                        ).trim(),

                    dificuldade:
                        String(
                            dificuldade
                        ),

                    tempo_limite:
                        tempoNumero,

                    quantidade_questoes:
                        quantidadeNumero,

                    topico_id:
                        topicoNumero,

                    ativo:
                        1
                }

            });

        }
    );
}


// =====================================================
// LISTAR SIMULADOS
// =====================================================

function listarTodosSimulados(
    req,
    res
) {

    listarSimulados(
        (
            erro,
            simulados
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar simulados:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar simulados."
                });
            }


            return res.status(200).json({
                simulados:
                    simulados || []
            });

        }
    );
}


// =====================================================
// BUSCAR SIMULADO PARA O ALUNO
// =====================================================

function buscarSimulado(
    req,
    res
) {

    const id =
        numeroInteiroPositivo(
            req.params.id
        );


    if (!id) {

        return res.status(400).json({
            mensagem:
                "ID do simulado inválido."
        });
    }


    buscarSimuladoPorId(
        id,
        (
            erro,
            simulado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar simulado."
                });
            }


            if (!simulado) {

                return res.status(404).json({
                    mensagem:
                        "Simulado não encontrado."
                });
            }


            listarQuestoesDoSimuladoParaResponder(
                id,
                (
                    erroQuestoes,
                    questoes
                ) => {

                    if (
                        erroQuestoes
                    ) {

                        console.error(
                            "❌ Erro ao buscar questões:",
                            erroQuestoes
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao buscar questões do simulado."
                        });
                    }


                    if (
                        !questoes ||
                        questoes.length === 0
                    ) {

                        return res.status(409).json({
                            mensagem:
                                "Este simulado ainda não possui questões disponíveis."
                        });
                    }


                    return res.status(200).json({
                        simulado,
                        questoes
                    });

                }
            );

        }
    );
}


// =====================================================
// EDITAR SIMULADO
// =====================================================

function editarSimulado(
    req,
    res
) {

    const id =
        numeroInteiroPositivo(
            req.params.id
        );


    const {
        titulo,
        descricao,
        materia,
        dificuldade,

        tempoLimite,
        tempo_limite,

        quantidadeQuestoes,
        quantidade_questoes,

        topicoId,
        topico_id
    } = req.body || {};


    const tempo =
        tempoLimite ??
        tempo_limite;


    const quantidade =
        quantidadeQuestoes ??
        quantidade_questoes;


    const idTopico =
        topicoId ??
        topico_id;


    const tempoNumero =
        numeroInteiroPositivo(
            tempo
        );


    const quantidadeNumero =
        numeroInteiroPositivo(
            quantidade
        );


    const topicoNumero =
        numeroInteiroPositivo(
            idTopico
        );


    if (
        !id ||

        !String(
            titulo || ""
        ).trim() ||

        !String(
            materia || ""
        ).trim() ||

        !DIFICULDADES_VALIDAS.includes(
            String(
                dificuldade || ""
            )
        ) ||

        !tempoNumero ||

        !quantidadeNumero ||

        !topicoNumero
    ) {

        return res.status(400).json({
            mensagem:
                "Preencha todos os campos obrigatórios corretamente."
        });
    }


    if (
        quantidadeNumero <
        MIN_QUESTOES_SIMULADO
    ) {

        return res.status(400).json({
            mensagem:
                `Um simulado precisa ter no mínimo ${MIN_QUESTOES_SIMULADO} questões.`
        });
    }


    atualizarSimulado(
        id,

        String(
            titulo
        ).trim(),

        String(
            descricao || ""
        ).trim(),

        String(
            materia
        ).trim(),

        String(
            dificuldade
        ),

        tempoNumero,

        quantidadeNumero,

        topicoNumero,

        (
            erro,
            resultado,
            status
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar simulado:",
                    erro
                );


                if (
                    erro.code ===
                    "TOPICO_NOT_FOUND"
                ) {

                    return res.status(400).json({
                        mensagem:
                            "O conteúdo selecionado não existe para a matéria escolhida."
                    });
                }


                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar simulado."
                });
            }


            if (
                status ===
                    "NOT_FOUND" ||

                !resultado ||

                resultado.changes ===
                    0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Simulado não encontrado."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Simulado atualizado com sucesso!"
            });

        }
    );
}


// =====================================================
// EXCLUIR SIMULADO
// =====================================================
//
// Exclusão lógica: ativo = 0.
//

function deletarSimulado(
    req,
    res
) {

    const id =
        numeroInteiroPositivo(
            req.params.id
        );


    if (!id) {

        return res.status(400).json({
            mensagem:
                "ID do simulado inválido."
        });
    }


    excluirSimulado(
        id,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao desativar simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir simulado."
                });
            }


            if (
                resultado.changes ===
                0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Simulado não encontrado."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Simulado excluído com sucesso!"
            });

        }
    );
}


// =====================================================
// ADICIONAR QUESTÃO
// =====================================================

function adicionarQuestaoAoSimulado(
    req,
    res
) {

    const simuladoId =
        numeroInteiroPositivo(
            req.params.id
        );


    const {
        questaoId,
        questao_id,
        ordem
    } = req.body || {};


    const idQuestao =
        numeroInteiroPositivo(
            questaoId ??
            questao_id
        );


    const ordemNumero =
        numeroInteiroPositivo(
            ordem
        );


    if (
        !simuladoId ||
        !idQuestao ||
        !ordemNumero
    ) {

        return res.status(400).json({
            mensagem:
                "Informe uma questão e uma ordem válidas."
        });
    }


    adicionarQuestao(
        simuladoId,
        idQuestao,
        ordemNumero,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao adicionar questão:",
                    erro
                );


                switch (
                    erro.code
                ) {

                    case "SIMULADO_NOT_FOUND":

                    case "QUESTAO_NOT_FOUND":

                        return res.status(404).json({
                            mensagem:
                                erro.message
                        });


                    case "QUESTAO_MATERIA_INVALIDA":

                    case "QUESTAO_DUPLICADA":

                    case "QUESTOES_LIMITE_ATINGIDO":

                    case "ORDEM_INVALIDA":

                        return res.status(400).json({
                            mensagem:
                                erro.message
                        });


                    default:

                        return res.status(500).json({
                            mensagem:
                                "Erro ao adicionar questão ao simulado."
                        });
                }
            }


            return res.status(201).json({

                mensagem:
                    "Questão adicionada ao simulado!",

                id:
                    resultado.lastID

            });

        }
    );
}


// =====================================================
// LISTAR QUESTÕES — ADMIN
// =====================================================

function listarQuestoes(
    req,
    res
) {

    const id =
        numeroInteiroPositivo(
            req.params.id
        );


    if (!id) {

        return res.status(400).json({
            mensagem:
                "ID do simulado inválido."
        });
    }


    listarQuestoesDoSimulado(
        id,
        (
            erro,
            questoes
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar questões:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar questões."
                });
            }


            return res.status(200).json({
                questoes:
                    questoes || []
            });

        }
    );
}


// =====================================================
// REMOVER QUESTÃO
// =====================================================

function removerQuestaoDoSimulado(
    req,
    res
) {

    const simuladoId =
        numeroInteiroPositivo(
            req.params.id
        );


    const questaoId =
        numeroInteiroPositivo(
            req.params.questaoId
        );


    if (
        !simuladoId ||
        !questaoId
    ) {

        return res.status(400).json({
            mensagem:
                "IDs inválidos."
        });
    }


    removerQuestao(
        simuladoId,
        questaoId,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao remover questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao remover questão do simulado."
                });
            }


            if (
                resultado.changes ===
                0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada neste simulado."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Questão removida do simulado!"
            });

        }
    );
}


// =====================================================
// ATUALIZAR ORDEM
// =====================================================

function editarOrdemQuestao(
    req,
    res
) {

    const simuladoId =
        numeroInteiroPositivo(
            req.params.id
        );


    const questaoId =
        numeroInteiroPositivo(
            req.params.questaoId
        );


    const ordem =
        numeroInteiroPositivo(
            req.body?.ordem
        );


    if (
        !simuladoId ||
        !questaoId ||
        !ordem
    ) {

        return res.status(400).json({
            mensagem:
                "Informe uma ordem válida."
        });
    }


    atualizarOrdemQuestao(
        simuladoId,
        questaoId,
        ordem,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar ordem:",
                    erro
                );


                if (
                    erro.code ===
                    "ORDEM_INVALIDA"
                ) {

                    return res.status(400).json({
                        mensagem:
                            erro.message
                    });
                }


                if (
                    erro.code ===
                    "QUESTAO_SIMULADO_NOT_FOUND"
                ) {

                    return res.status(404).json({
                        mensagem:
                            erro.message
                    });
                }


                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar a ordem da questão."
                });
            }


            if (
                resultado.changes ===
                0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada neste simulado."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Ordem atualizada com sucesso!"
            });

        }
    );
}


// =====================================================
// CORRIGIR SIMULADO
// =====================================================

function corrigirSimulado(
    req,
    res
) {

    const simuladoId =
        numeroInteiroPositivo(
            req.params.id
        );


    const {
        respostas
    } = req.body || {};


    const usuarioId =
        numeroInteiroPositivo(
            req.usuario?.id ||
            req.usuario?.usuarioId
        );


    if (!usuarioId) {

        return res.status(401).json({
            mensagem:
                "Usuário não autenticado."
        });
    }


    if (!simuladoId) {

        return res.status(400).json({
            mensagem:
                "ID do simulado inválido."
        });
    }


    if (
        !respostas ||
        typeof respostas !==
            "object" ||
        Array.isArray(
            respostas
        )
    ) {

        return res.status(400).json({
            mensagem:
                "Informe as respostas no formato { questaoId: alternativa }."
        });
    }


    buscarGabaritoDoSimulado(
        simuladoId,
        (
            erro,
            gabarito
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao corrigir simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao corrigir o simulado."
                });
            }


            if (
                !gabarito ||
                gabarito.length ===
                    0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Simulado não encontrado ou sem questões."
                });
            }


            let acertos =
                0;


            const detalhes =
                gabarito.map(
                    (
                        questao
                    ) => {

                        const respostaUsuario =
                            respostas[
                                questao.id
                            ] != null
                                ? String(
                                    respostas[
                                        questao.id
                                    ]
                                )
                                    .trim()
                                    .toUpperCase()
                                : null;


                        const respostaCorreta =
                            String(
                                questao.correta ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        const acertou =
                            Boolean(
                                respostaUsuario &&
                                respostaUsuario ===
                                    respostaCorreta
                            );


                        if (
                            acertou
                        ) {
                            acertos +=
                                1;
                        }


                        return {

                            questaoId:
                                Number(
                                    questao.id
                                ),

                            respostaUsuario,

                            respostaCorreta,

                            acertou

                        };

                    }
                );


            const totalQuestoes =
                gabarito.length;


            const erros =
                totalQuestoes -
                acertos;


            const porcentagem =
                totalQuestoes > 0

                    ? Number(
                        (
                            (
                                acertos /
                                totalQuestoes
                            ) * 100
                        ).toFixed(
                            2
                        )
                    )

                    : 0;


            criarResultado(
                usuarioId,
                simuladoId,
                acertos,
                erros,
                totalQuestoes,
                porcentagem,

                (
                    erroResultado,
                    resultadoSalvo
                ) => {

                    if (
                        erroResultado
                    ) {

                        console.error(
                            "❌ Erro ao salvar resultado do simulado:",
                            erroResultado
                        );

                        return res.status(500).json({
                            mensagem:
                                "O simulado foi corrigido, mas não foi possível salvar o resultado."
                        });
                    }


                    return res.status(200).json({

                        resultado: {

                            id:
                                resultadoSalvo.lastID,

                            acertos,

                            erros,

                            totalQuestoes,

                            porcentagem

                        },

                        detalhes

                    });

                }
            );

        }
    );
}


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {

    cadastrarSimulado,

    listarTodosSimulados,

    buscarSimulado,

    editarSimulado,

    deletarSimulado,

    adicionarQuestao:
        adicionarQuestaoAoSimulado,

    listarQuestoes,

    removerQuestao:
        removerQuestaoDoSimulado,

    editarOrdemQuestao,

    corrigirSimulado

};