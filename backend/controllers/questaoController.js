const {
    criarQuestao,
    listarQuestoes,
    buscarQuestaoPorId,
    atualizarQuestao,
    excluirQuestao
} = require("../models/questaoModel");


// =====================================================
// CADASTRAR QUESTÃO
// =====================================================

function cadastrarQuestao(req, res) {

    const {
        pergunta,

        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        alternativaE,

        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        alternativa_e,

        correta,
        materia
    } = req.body;


    const a = alternativaA ?? alternativa_a;
    const b = alternativaB ?? alternativa_b;
    const c = alternativaC ?? alternativa_c;
    const d = alternativaD ?? alternativa_d;
    const e = alternativaE ?? alternativa_e;


    if (
        !pergunta ||
        !a ||
        !b ||
        !c ||
        !d ||
        !e ||
        !correta ||
        !materia
    ) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }


    const respostaCorreta =
        String(correta).toUpperCase();

    const alternativasValidas = [
        "A",
        "B",
        "C",
        "D",
        "E"
    ];


    if (!alternativasValidas.includes(respostaCorreta)) {
        return res.status(400).json({
            mensagem:
                "A resposta correta deve ser A, B, C, D ou E."
        });
    }


    criarQuestao(
        pergunta.trim(),
        a.trim(),
        b.trim(),
        c.trim(),
        d.trim(),
        e.trim(),
        respostaCorreta,
        materia,
        (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao cadastrar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao cadastrar questão."
                });
            }


            return res.status(201).json({

                mensagem:
                    "Questão cadastrada com sucesso!",

                questao: {
                    id: resultado.lastID,
                    pergunta: pergunta.trim(),

                    alternativaA: a.trim(),
                    alternativaB: b.trim(),
                    alternativaC: c.trim(),
                    alternativaD: d.trim(),
                    alternativaE: e.trim(),

                    correta: respostaCorreta,
                    materia
                }
            });
        }
    );
}


// =====================================================
// LISTAR QUESTÕES
// =====================================================

function listarTodasQuestoes(req, res) {

    listarQuestoes((erro, questoes) => {

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
    });
}


// =====================================================
// BUSCAR QUESTÃO POR ID
// =====================================================

function buscarQuestao(req, res) {

    const { id } = req.params;

    buscarQuestaoPorId(
        id,
        (erro, questao) => {

            if (erro) {
                console.error(
                    "❌ Erro ao buscar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar questão."
                });
            }


            if (!questao) {
                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada."
                });
            }


            return res.status(200).json({
                questao
            });
        }
    );
}


// =====================================================
// ATUALIZAR QUESTÃO
// =====================================================

function editarQuestao(req, res) {

    const { id } = req.params;

    const {
        pergunta,

        alternativaA,
        alternativaB,
        alternativaC,
        alternativaD,
        alternativaE,

        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        alternativa_e,

        correta,
        materia
    } = req.body;


    const a = alternativaA ?? alternativa_a;
    const b = alternativaB ?? alternativa_b;
    const c = alternativaC ?? alternativa_c;
    const d = alternativaD ?? alternativa_d;
    const e = alternativaE ?? alternativa_e;


    if (
        !pergunta ||
        !a ||
        !b ||
        !c ||
        !d ||
        !e ||
        !correta ||
        !materia
    ) {
        return res.status(400).json({
            mensagem:
                "Preencha todos os campos."
        });
    }


    const respostaCorreta =
        String(correta).toUpperCase();


    const alternativasValidas = [
        "A",
        "B",
        "C",
        "D",
        "E"
    ];


    if (!alternativasValidas.includes(respostaCorreta)) {
        return res.status(400).json({
            mensagem:
                "A resposta correta deve ser A, B, C, D ou E."
        });
    }


    atualizarQuestao(
        id,
        pergunta.trim(),
        a.trim(),
        b.trim(),
        c.trim(),
        d.trim(),
        e.trim(),
        respostaCorreta,
        materia,
        (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao atualizar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar questão."
                });
            }


            if (resultado.changes === 0) {
                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Questão atualizada com sucesso!"
            });
        }
    );
}


// =====================================================
// EXCLUIR QUESTÃO
// =====================================================

function deletarQuestao(req, res) {

    const { id } = req.params;

    excluirQuestao(
        id,
        (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao excluir questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir questão."
                });
            }


            if (resultado.changes === 0) {
                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada."
                });
            }


            return res.status(200).json({
                mensagem:
                    "Questão excluída com sucesso!"
            });
        }
    );
}


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao
};