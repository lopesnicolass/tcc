const {
    criarSimulado,
    listarSimulados,
    buscarSimuladoPorId,
    adicionarQuestaoAoSimulado,
    listarQuestoesDoSimulado,
    removerQuestaoDoSimulado
} = require("../models/simuladoModel");


// ============================
// CRIAR SIMULADO
// ============================

function cadastrarSimulado(req, res) {

    const {
        titulo,
        descricao,
        tempoLimite,
        quantidadeQuestoes
    } = req.body;

    if (
        !titulo ||
        tempoLimite === undefined ||
        quantidadeQuestoes === undefined
    ) {
        return res.status(400).json({
            mensagem: "Preencha os campos obrigatórios."
        });
    }

    if (tempoLimite <= 0) {
        return res.status(400).json({
            mensagem: "O tempo limite deve ser maior que zero."
        });
    }

    if (quantidadeQuestoes <= 0) {
        return res.status(400).json({
            mensagem: "A quantidade de questões deve ser maior que zero."
        });
    }

    criarSimulado(
        titulo,
        descricao || "",
        tempoLimite,
        quantidadeQuestoes,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao criar simulado."
                });
            }

            return res.status(201).json({
                mensagem: "Simulado criado com sucesso!",
                simulado: {
                    id: resultado.lastID,
                    titulo,
                    descricao: descricao || "",
                    tempoLimite,
                    quantidadeQuestoes
                }
            });
        }
    );
}


// ============================
// LISTAR SIMULADOS
// ============================

function listarTodosSimulados(req, res) {

    listarSimulados((erro, simulados) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar simulados."
            });
        }

        return res.status(200).json({
            simulados
        });
    });
}


// ============================
// BUSCAR SIMULADO POR ID
// ============================

function buscarSimulado(req, res) {

    const { id } = req.params;

    buscarSimuladoPorId(id, (erro, simulado) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar simulado."
            });
        }

        if (!simulado) {
            return res.status(404).json({
                mensagem: "Simulado não encontrado."
            });
        }

        listarQuestoesDoSimulado(id, (erro, questoes) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao buscar questões do simulado."
                });
            }

            return res.status(200).json({
                simulado,
                questoes
            });
        });
    });
}


// ============================
// ADICIONAR QUESTÃO AO SIMULADO
// ============================

function adicionarQuestao(req, res) {

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

    adicionarQuestaoAoSimulado(
        id,
        questaoId,
        ordem,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

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


// ============================
// LISTAR QUESTÕES DO SIMULADO
// ============================

function listarQuestoes(req, res) {

    const { id } = req.params;

    listarQuestoesDoSimulado(
        id,
        (erro, questoes) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao buscar questões."
                });
            }

            return res.status(200).json({
                questoes
            });
        }
    );
}


// ============================
// REMOVER QUESTÃO DO SIMULADO
// ============================

function removerQuestao(req, res) {

    const { id, questaoId } = req.params;

    removerQuestaoDoSimulado(
        id,
        questaoId,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao remover questão."
                });
            }

            if (resultado.changes === 0) {
                return res.status(404).json({
                    mensagem: "Questão não encontrada no simulado."
                });
            }

            return res.status(200).json({
                mensagem: "Questão removida do simulado!"
            });
        }
    );
}


// ============================
// EXPORTAÇÕES
// ============================

module.exports = {
    cadastrarSimulado,
    listarTodosSimulados,
    buscarSimulado,
    adicionarQuestao,
    listarQuestoes,
    removerQuestao
};