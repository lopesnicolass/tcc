const {
    criarQuestao,
    listarQuestoes,
    buscarQuestaoPorId,
    atualizarQuestao,
    excluirQuestao,
    listarQuestoesPorIds,
    corrigirQuestoesPorIds
} = require("../models/questaoModel");

// =====================================================
// UTILITÁRIO
// =====================================================

function alternativasValidas() {
    return [
        "A",
        "B",
        "C",
        "D",
        "E"
    ];
}

function normalizarIds(valor) {
    let valores = [];

    if (Array.isArray(valor)) {
        valores = valor;
    } else if (
        typeof valor === "string"
    ) {
        valores =
            valor.split(",");
    }

    return [
        ...new Set(
            valores
                .map(
                    (item) =>
                        Number(
                            String(item).trim()
                        )
                )
                .filter(
                    (item) =>
                        Number.isInteger(item) &&
                        item > 0
                )
        )
    ];
}


// =====================================================
// CADASTRAR QUESTÃO — ADMIN
// =====================================================

function cadastrarQuestao(
    req,
    res
) {
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


    const a =
        alternativaA ??
        alternativa_a;

    const b =
        alternativaB ??
        alternativa_b;

    const c =
        alternativaC ??
        alternativa_c;

    const d =
        alternativaD ??
        alternativa_d;

    const e =
        alternativaE ??
        alternativa_e;


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
        String(
            correta
        ).toUpperCase();


    if (
        !alternativasValidas().includes(
            respostaCorreta
        )
    ) {
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
        (
            erro,
            resultado
        ) => {
            if (erro) {
                console.error(
                    "Erro ao cadastrar questão:",
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

                    pergunta:
                        pergunta.trim(),

                    alternativaA:
                        a.trim(),

                    alternativaB:
                        b.trim(),

                    alternativaC:
                        c.trim(),

                    alternativaD:
                        d.trim(),

                    alternativaE:
                        e.trim(),

                    correta:
                        respostaCorreta,

                    materia
                }
            });
        }
    );
}


// =====================================================
// LISTAR QUESTÕES — ADMIN
// =====================================================

function listarTodasQuestoes(
    req,
    res
) {
    listarQuestoes(
        (
            erro,
            questoes
        ) => {
            if (erro) {
                console.error(
                    "Erro ao buscar questões:",
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
// BUSCAR QUESTÃO — ADMIN
// =====================================================

function buscarQuestao(
    req,
    res
) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID da questão inválido."
        });
    }


    buscarQuestaoPorId(
        id,
        (
            erro,
            questao
        ) => {
            if (erro) {
                console.error(
                    "Erro ao buscar questão:",
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
// QUESTÕES DO CONTEÚDO — ALUNO
//
// IMPORTANTE:
// a resposta correta NÃO é enviada.
// =====================================================

function listarQuestoesDoConteudo(
    req,
    res
) {
    const ids =
        normalizarIds(
            req.query.ids
        );

    if (
        ids.length === 0
    ) {
        return res.json({
            questoes: []
        });
    }


    listarQuestoesPorIds(
        ids,
        (
            erro,
            questoes
        ) => {
            if (erro) {
                console.error(
                    "Erro ao carregar questões do conteúdo:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao carregar questões."
                });
            }

            return res.json({
                questoes:
                    questoes || []
            });
        }
    );
}


// =====================================================
// CORRIGIR QUESTÕES DO CONTEÚDO — ALUNO
// =====================================================

function corrigirQuestoesDoConteudo(
    req,
    res
) {
    const ids =
        normalizarIds(
            req.body?.questaoIds
        );

    const respostas =
        req.body?.respostas;


    if (
        ids.length === 0
    ) {
        return res.status(400).json({
            mensagem:
                "Nenhuma questão foi informada."
        });
    }


    if (
        !respostas ||
        typeof respostas !== "object" ||
        Array.isArray(respostas)
    ) {
        return res.status(400).json({
            mensagem:
                "As respostas precisam ser informadas."
        });
    }


    corrigirQuestoesPorIds(
        ids,
        respostas,
        (
            erro,
            detalhes
        ) => {
            if (erro) {
                console.error(
                    "Erro ao corrigir questões:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao corrigir questões."
                });
            }


            const lista =
                detalhes || [];

            const acertos =
                lista.filter(
                    (item) =>
                        item.acertou
                ).length;

            const totalQuestoes =
                ids.length;

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
                        ).toFixed(2)
                    )
                    : 0;


            return res.json({
                resultado: {
                    acertos,
                    erros,
                    totalQuestoes,
                    porcentagem
                },

                detalhes: lista
            });
        }
    );
}


// =====================================================
// EDITAR QUESTÃO — ADMIN
// =====================================================

function editarQuestao(
    req,
    res
) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID da questão inválido."
        });
    }


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


    const a =
        alternativaA ??
        alternativa_a;

    const b =
        alternativaB ??
        alternativa_b;

    const c =
        alternativaC ??
        alternativa_c;

    const d =
        alternativaD ??
        alternativa_d;

    const e =
        alternativaE ??
        alternativa_e;


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
        String(
            correta
        ).toUpperCase();


    if (
        !alternativasValidas().includes(
            respostaCorreta
        )
    ) {
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
        (
            erro,
            resultado
        ) => {
            if (erro) {
                console.error(
                    "Erro ao atualizar questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar questão."
                });
            }


            if (
                !resultado ||
                resultado.changes === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada."
                });
            }


            return res.json({
                mensagem:
                    "Questão atualizada com sucesso!"
            });
        }
    );
}


// =====================================================
// EXCLUIR QUESTÃO — ADMIN
// =====================================================

function deletarQuestao(
    req,
    res
) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID da questão inválido."
        });
    }


    excluirQuestao(
        id,
        (
            erro,
            resultado
        ) => {
            if (erro) {
                console.error(
                    "Erro ao excluir questão:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir questão."
                });
            }


            if (
                !resultado ||
                resultado.changes === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Questão não encontrada."
                });
            }


            return res.json({
                mensagem:
                    "Questão excluída com sucesso!"
            });
        }
    );
}
// =====================================================
// LISTAR QUESTÕES DE UM BLOCO DE CONTEÚDO — ALUNO
// =====================================================

function listarQuestoesDoConteudo(
    req,
    res
) {
    const idsParam =
        String(
            req.query.ids || ''
        );

    const ids =
        idsParam
            .split(',')
            .map((id) => Number(id))
            .filter(
                (id) =>
                    Number.isInteger(id) &&
                    id > 0
            );

    if (ids.length === 0) {
        return res.json({
            questoes: []
        });
    }

    listarQuestoesPorIds(
        ids,
        (erro, questoes) => {
            if (erro) {
                console.error(
                    "❌ Erro ao buscar questões do conteúdo:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar questões."
                });
            }

            return res.json({
                questoes:
                    questoes || []
            });
        }
    );
}


// =====================================================
// CORRIGIR BLOCO DE QUESTÕES — ALUNO
// =====================================================

function corrigirQuestoesDoConteudo(
    req,
    res
) {
    const ids =
        Array.isArray(
            req.body?.questaoIds
        )
            ? req.body.questaoIds
            : [];

    const respostas =
        req.body?.respostas || {};

    const idsNumericos =
        ids
            .map(Number)
            .filter(
                (id) =>
                    Number.isInteger(id) &&
                    id > 0
            );

    if (idsNumericos.length === 0) {
        return res.status(400).json({
            mensagem:
                "Nenhuma questão foi enviada."
        });
    }

    corrigirQuestoesPorIds(
        idsNumericos,
        respostas,
        (erro, resultado) => {
            if (erro) {
                console.error(
                    "❌ Erro ao corrigir questões:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao corrigir questões."
                });
            }

            const lista =
                resultado || [];

            const acertos =
                lista.filter(
                    (item) =>
                        item.acertou
                ).length;

            const total =
                lista.length;

            const porcentagem =
                total > 0
                    ? Math.round(
                        (acertos / total) *
                            100
                    )
                    : 0;

            return res.json({
                resultado:
                    lista,

                acertos,

                total,

                porcentagem
            });
        }
    );
}

module.exports = {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao,
    listarQuestoesDoConteudo,
    corrigirQuestoesDoConteudo
};