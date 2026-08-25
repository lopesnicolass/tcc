const {
    criarSimulado,
    listarSimulados,
    buscarSimuladoPorId,
    atualizarSimulado,
    excluirSimulado,
    adicionarQuestao,
    listarQuestoesDoSimulado,
    removerQuestao,
    atualizarOrdemQuestao,
    removerTodasQuestoesDoSimulado
} = require("../models/simuladoModel");

// =====================================================
// CADASTRAR SIMULADO
// =====================================================

function cadastrarSimulado(req, res) {
    const {
        titulo,
        descricao,
        materia,
        dificuldade,

        tempoLimite,
        tempo_limite,

        quantidadeQuestoes,
        quantidade_questoes,

        ativo
    } = req.body;

    const tempo =
        tempoLimite ?? tempo_limite;

    const quantidade =
        quantidadeQuestoes ?? quantidade_questoes;

    if (
        !titulo ||
        !materia ||
        !dificuldade ||
        tempo === undefined ||
        quantidade === undefined
    ) {
        return res.status(400).json({
            mensagem:
                "Preencha todos os campos obrigatórios."
        });
    }

    if (Number(tempo) <= 0) {
        return res.status(400).json({
            mensagem:
                "O tempo limite deve ser maior que zero."
        });
    }

    if (Number(quantidade) <= 0) {
        return res.status(400).json({
            mensagem:
                "A quantidade de questões deve ser maior que zero."
        });
    }

    criarSimulado(
        titulo.trim(),
        descricao || "",
        materia,
        dificuldade,
        Number(tempo),
        Number(quantidade),
        (erro, resultado) => {
            if (erro) {
                console.error(
                    "❌ Erro ao cadastrar simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao cadastrar simulado."
                });
            }

            return res.status(201).json({
                mensagem:
                    "Simulado criado com sucesso!",

                simulado: {
                    id: resultado.lastID,
                    titulo: titulo.trim(),
                    descricao: descricao || "",
                    materia,
                    dificuldade,
                    tempo_limite: Number(tempo),
                    quantidade_questoes:
                        Number(quantidade),
                    ativo: ativo ?? 1
                }
            });
        }
    );
}

// =====================================================
// LISTAR SIMULADOS
// =====================================================

function listarTodosSimulados(req, res) {
    listarSimulados((erro, simulados) => {
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
            simulados
        });
    });
}

// =====================================================
// BUSCAR SIMULADO + QUESTÕES
// =====================================================

function buscarSimulado(req, res) {
    const { id } = req.params;

    buscarSimuladoPorId(
        id,
        (erro, simulado) => {
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

            listarQuestoesDoSimulado(
                id,
                (erro, questoes) => {
                    if (erro) {
                        console.error(
                            "❌ Erro ao buscar questões:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao buscar questões do simulado."
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

function editarSimulado(req, res) {
    const { id } = req.params;

    const {
        titulo,
        descricao,
        materia,
        dificuldade,

        tempoLimite,
        tempo_limite,

        quantidadeQuestoes,
        quantidade_questoes
    } = req.body;

    const tempo =
        tempoLimite ?? tempo_limite;

    const quantidade =
        quantidadeQuestoes ??
        quantidade_questoes;

    if (
        !titulo ||
        !materia ||
        !dificuldade ||
        tempo === undefined ||
        quantidade === undefined
    ) {
        return res.status(400).json({
            mensagem:
                "Preencha todos os campos obrigatórios."
        });
    }

    if (Number(tempo) <= 0) {
        return res.status(400).json({
            mensagem:
                "O tempo limite deve ser maior que zero."
        });
    }

    if (Number(quantidade) <= 0) {
        return res.status(400).json({
            mensagem:
                "A quantidade de questões deve ser maior que zero."
        });
    }

    atualizarSimulado(
        id,
        titulo.trim(),
        descricao || "",
        materia,
        dificuldade,
        Number(tempo),
        Number(quantidade),
        (erro, resultado) => {
            if (erro) {
                console.error(
                    "❌ Erro ao atualizar simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar simulado."
                });
            }

            if (resultado.changes === 0) {
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

function deletarSimulado(req, res) {
    const { id } = req.params;

    // Primeiro remove os vínculos.
    // As questões continuam no banco,
    // pois podem pertencer ao banco de questões.
    removerTodasQuestoesDoSimulado(
        id,
        (erro) => {
            if (erro) {
                console.error(
                    "❌ Erro ao remover questões do simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir o simulado."
                });
            }

            excluirSimulado(
                id,
                (erro, resultado) => {
                    if (erro) {
                        console.error(
                            "❌ Erro ao excluir simulado:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao excluir simulado."
                        });
                    }

                    if (resultado.changes === 0) {
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
    );
}

// =====================================================
// ADICIONAR QUESTÃO
// =====================================================

function adicionarQuestaoAoSimulado(
    req,
    res
) {
    const { id } = req.params;

    const {
        questaoId,
        questao_id,
        ordem
    } = req.body;

    const idQuestao =
        questaoId ?? questao_id;

    if (
        idQuestao === undefined ||
        ordem === undefined
    ) {
        return res.status(400).json({
            mensagem:
                "Informe a questão e a ordem."
        });
    }

    adicionarQuestao(
        id,
        idQuestao,
        Number(ordem),
        (erro, resultado) => {
            if (erro) {
                console.error(
                    "❌ Erro ao adicionar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao adicionar questão ao simulado."
                });
            }

            return res.status(201).json({
                mensagem:
                    "Questão adicionada ao simulado!",
                id: resultado.lastID
            });
        }
    );
}

// =====================================================
// LISTAR QUESTÕES
// =====================================================

function listarQuestoes(req, res) {
    const { id } = req.params;

    listarQuestoesDoSimulado(
        id,
        (erro, questoes) => {
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
                questoes
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
    const {
        id,
        questaoId
    } = req.params;

    removerQuestao(
        id,
        questaoId,
        (erro, resultado) => {
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

            if (resultado.changes === 0) {
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
    const {
        id,
        questaoId
    } = req.params;

    const { ordem } = req.body;

    if (ordem === undefined) {
        return res.status(400).json({
            mensagem:
                "Informe a ordem da questão."
        });
    }

    atualizarOrdemQuestao(
        id,
        questaoId,
        Number(ordem),
        (erro, resultado) => {
            if (erro) {
                console.error(
                    "❌ Erro ao atualizar ordem:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar ordem da questão."
                });
            }

            if (resultado.changes === 0) {
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

    editarOrdemQuestao
};