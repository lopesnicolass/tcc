const {
    criarQuestao,
    listarQuestoes,
    buscarQuestaoPorId,
    atualizarQuestao,
    excluirQuestao
} = require("../models/questaoModel");


// ============================
// CADASTRAR QUESTÃO
// ============================

function cadastrarQuestao(req, res) {

    const {
        pergunta,
        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        correta,
        materia
    } = req.body;

    // Verifica se todos os campos foram preenchidos
    if (
        !pergunta ||
        !alternativaA ||
        !alternativaB ||
        !alternativaC ||
        !alternativaD ||
        !correta ||
        !materia
    ) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    // Verifica se a resposta correta é válida
    const alternativasValidas = ["A", "B", "C", "D"];

    if (!alternativasValidas.includes(correta.toUpperCase())) {
        return res.status(400).json({
            mensagem: "A resposta correta deve ser A, B, C ou D."
        });
    }

    criarQuestao(
        pergunta,
        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        correta.toUpperCase(),
        materia,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao cadastrar questão."
                });
            }

            return res.status(201).json({
                mensagem: "Questão cadastrada com sucesso!",
                questao: {
                    id: resultado.lastID,
                    pergunta,
                    alternativaA,
                    alternativaB,
                    alternativaC,
                    alternativaD,
                    correta: correta.toUpperCase(),
                    materia
                }
            });
        }
    );
}


// ============================
// LISTAR QUESTÕES
// ============================

function listarTodasQuestoes(req, res) {

    listarQuestoes((erro, questoes) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar questões."
            });
        }

        return res.status(200).json({
            questoes
        });
    });
}


// ============================
// BUSCAR QUESTÃO POR ID
// ============================

function buscarQuestao(req, res) {

    const { id } = req.params;

    buscarQuestaoPorId(id, (erro, questao) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar questão."
            });
        }

        if (!questao) {
            return res.status(404).json({
                mensagem: "Questão não encontrada."
            });
        }

        return res.status(200).json({
            questao
        });
    });
}


// ============================
// ATUALIZAR QUESTÃO
// ============================

function editarQuestao(req, res) {

    const { id } = req.params;

    const {
        pergunta,
        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        correta,
        materia
    } = req.body;

    if (
        !pergunta ||
        !alternativaA ||
        !alternativaB ||
        !alternativaC ||
        !alternativaD ||
        !correta ||
        !materia
    ) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    const alternativasValidas = ["A", "B", "C", "D"];

    if (!alternativasValidas.includes(correta.toUpperCase())) {
        return res.status(400).json({
            mensagem: "A resposta correta deve ser A, B, C ou D."
        });
    }

    atualizarQuestao(
        id,
        pergunta,
        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        correta.toUpperCase(),
        materia,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao atualizar questão."
                });
            }

            if (resultado.changes === 0) {
                return res.status(404).json({
                    mensagem: "Questão não encontrada."
                });
            }

            return res.status(200).json({
                mensagem: "Questão atualizada com sucesso!"
            });
        }
    );
}


// ============================
// EXCLUIR QUESTÃO
// ============================

function deletarQuestao(req, res) {

    const { id } = req.params;

    excluirQuestao(id, (erro, resultado) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao excluir questão."
            });
        }

        if (resultado.changes === 0) {
            return res.status(404).json({
                mensagem: "Questão não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Questão excluída com sucesso!"
        });
    });
}


// ============================
// EXPORTAÇÕES
// ============================

module.exports = {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao
};