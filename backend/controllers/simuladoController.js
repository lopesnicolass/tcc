const {
    criarSimulado,
    listarSimulados,
    buscarSimuladoPorId,
    adicionarQuestao,
    listarQuestoesDoSimulado,
    removerQuestao
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
        quantidadeQuestoes
    } = req.body;


    // ============================
    // VALIDAÇÕES
    // ============================

    if (
        !titulo ||
        !materia ||
        !dificuldade ||
        tempoLimite === undefined ||
        quantidadeQuestoes === undefined
    ) {

        return res.status(400).json({
            mensagem: "Preencha todos os campos obrigatórios."
        });

    }


    if (Number(tempoLimite) <= 0) {

        return res.status(400).json({
            mensagem: "O tempo limite deve ser maior que zero."
        });

    }


    if (Number(quantidadeQuestoes) <= 0) {

        return res.status(400).json({
            mensagem: "A quantidade de questões deve ser maior que zero."
        });

    }


    // ============================
    // CRIAR SIMULADO
    // ============================

    criarSimulado(
        titulo,
        descricao || "",
        materia,
        dificuldade,
        Number(tempoLimite),
        Number(quantidadeQuestoes),
        (erro, resultado) => {

            if (erro) {

                console.error(
                    "❌ Erro ao cadastrar simulado:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao cadastrar simulado."
                });

            }


            return res.status(201).json({

                mensagem: "Simulado criado com sucesso!",

                simuladoId: resultado.lastID

            });

        }
    );
}


// =====================================================
// LISTAR TODOS OS SIMULADOS
// =====================================================

function listarTodosSimulados(req, res) {

    listarSimulados((erro, simulados) => {

        if (erro) {

            console.error(
                "❌ Erro ao buscar simulados:",
                erro
            );

            return res.status(500).json({
                mensagem: "Erro ao buscar simulados."
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
                    mensagem: "Erro ao buscar simulado."
                });

            }


            if (!simulado) {

                return res.status(404).json({
                    mensagem: "Simulado não encontrado."
                });

            }


            // ============================
            // BUSCAR QUESTÕES
            // ============================

            listarQuestoesDoSimulado(
                id,
                (erro, questoes) => {

                    if (erro) {

                        console.error(
                            "❌ Erro ao buscar questões:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem: "Erro ao buscar questões do simulado."
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
// ADICIONAR QUESTÃO AO SIMULADO
// =====================================================

function adicionarQuestaoAoSimulado(req, res) {

    const { id } = req.params;

    const {
        questaoId,
        ordem
    } = req.body;


    if (
        questaoId === undefined ||
        ordem === undefined
    ) {

        return res.status(400).json({
            mensagem: "Informe a questão e a ordem."
        });

    }


    adicionarQuestao(
        id,
        questaoId,
        ordem,
        (erro, resultado) => {

            if (erro) {

                console.error(
                    "❌ Erro ao adicionar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao adicionar questão ao simulado."
                });

            }


            return res.status(201).json({

                mensagem: "Questão adicionada ao simulado!",

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
                    mensagem: "Erro ao buscar questões do simulado."
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

function removerQuestaoDoSimulado(req, res) {

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
                    mensagem: "Erro ao remover questão do simulado."
                });

            }


            if (resultado.changes === 0) {

                return res.status(404).json({
                    mensagem: "Questão não encontrada neste simulado."
                });

            }


            return res.status(200).json({
                mensagem: "Questão removida do simulado!"
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

    adicionarQuestao: adicionarQuestaoAoSimulado,

    listarQuestoes,

    removerQuestao: removerQuestaoDoSimulado

};