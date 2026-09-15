
const resultadoFlashcardModel =
    require("../models/resultadoFlashcardModel");


// =====================================================
// OBTER USUÁRIO LOGADO
// =====================================================

function obterUsuarioId(req) {

    if (!req.usuario || !req.usuario.id) {
        return null;
    }

    return Number(req.usuario.id);
}


// =====================================================
// CRIAR SESSÃO
// =====================================================

function criarSessao(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }

    const totalCards =
        Number(req.body?.totalCards);

    if (
        !Number.isInteger(totalCards) ||
        totalCards <= 0
    ) {

        return res.status(400).json({
            erro: "Quantidade de cards inválida."
        });
    }

    resultadoFlashcardModel.criarSessao(
        usuarioId,
        totalCards,
        (erro, sessao) => {

            if (erro) {

                console.error(
                    "Erro ao criar sessão de flashcards:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao iniciar sessão de flashcards."
                });
            }

            return res.status(201).json({
                mensagem:
                    "Sessão iniciada com sucesso.",
                sessao
            });
        }
    );
}


// =====================================================
// REGISTRAR RESPOSTA
// =====================================================

function registrarResposta(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }

    const sessaoId =
        Number(req.params.sessaoId);

    const flashcardId =
        Number(req.body?.flashcardId);

    const materia =
        req.body?.materia;

    const acertou =
        req.body?.acertou;


    if (
        !Number.isInteger(sessaoId) ||
        sessaoId <= 0
    ) {

        return res.status(400).json({
            erro: "ID da sessão inválido."
        });
    }


    if (
        !Number.isInteger(flashcardId) ||
        flashcardId <= 0
    ) {

        return res.status(400).json({
            erro: "ID do flashcard inválido."
        });
    }


    if (
        !materia ||
        !String(materia).trim()
    ) {

        return res.status(400).json({
            erro: "A matéria é obrigatória."
        });
    }


    if (typeof acertou !== "boolean") {

        return res.status(400).json({
            erro:
                "Informe se o flashcard foi acertado ou errado."
        });
    }


    resultadoFlashcardModel.buscarSessaoPorId(
        sessaoId,
        (erroBusca, sessao) => {

            if (erroBusca) {

                console.error(
                    "Erro ao verificar sessão:",
                    erroBusca
                );

                return res.status(500).json({
                    erro:
                        "Erro ao verificar sessão."
                });
            }


            if (!sessao) {

                return res.status(404).json({
                    erro:
                        "Sessão de flashcards não encontrada."
                });
            }


            if (
                Number(sessao.usuario_id) !==
                usuarioId
            ) {

                return res.status(403).json({
                    erro:
                        "Você não pode alterar esta sessão."
                });
            }


            if (sessao.data_fim) {

                return res.status(400).json({
                    erro:
                        "Esta sessão já foi finalizada."
                });
            }


            resultadoFlashcardModel.registrarResposta(
                sessaoId,
                usuarioId,
                flashcardId,
                String(materia).trim(),
                acertou,
                (erro, resposta) => {

                    if (erro) {

                        console.error(
                            "Erro ao registrar resposta:",
                            erro
                        );

                        return res.status(500).json({
                            erro:
                                "Erro ao registrar resposta."
                        });
                    }

                    return res.status(201).json({
                        mensagem:
                            "Resposta registrada com sucesso.",
                        resposta
                    });
                }
            );
        }
    );
}


// =====================================================
// FINALIZAR SESSÃO
// =====================================================

function finalizarSessao(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }

    const sessaoId =
        Number(req.params.sessaoId);

    if (
        !Number.isInteger(sessaoId) ||
        sessaoId <= 0
    ) {

        return res.status(400).json({
            erro: "ID da sessão inválido."
        });
    }


    resultadoFlashcardModel.finalizarSessao(
        sessaoId,
        usuarioId,
        (erro, sessao) => {

            if (erro) {

                console.error(
                    "Erro ao finalizar sessão:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao finalizar sessão."
                });
            }


            if (!sessao) {

                return res.status(404).json({
                    erro:
                        "Sessão não encontrada."
                });
            }


            return res.json({
                mensagem:
                    "Sessão finalizada com sucesso.",
                sessao
            });
        }
    );
}


// =====================================================
// LISTAR SESSÕES
// =====================================================

function listarSessoes(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.listarSessoesDoUsuario(
        usuarioId,
        (erro, sessoes) => {

            if (erro) {

                console.error(
                    "Erro ao listar sessões:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao carregar histórico."
                });
            }

            return res.json({
                sessoes
            });
        }
    );
}


// =====================================================
// DESEMPENHO POR MATÉRIA
// =====================================================

function desempenhoPorMateria(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.buscarDesempenhoPorMateria(
        usuarioId,
        (erro, desempenho) => {

            if (erro) {

                console.error(
                    "Erro ao buscar desempenho dos flashcards:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao carregar desempenho."
                });
            }

            return res.json({
                desempenho
            });
        }
    );
}


// =====================================================
// LISTAR RESPOSTAS
// =====================================================

function listarRespostas(req, res) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.listarRespostasDoUsuario(
        usuarioId,
        (erro, respostas) => {

            if (erro) {

                console.error(
                    "Erro ao listar respostas:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao carregar respostas."
                });
            }

            return res.json({
                respostas
            });
        }
    );
}


module.exports = {
    criarSessao,
    registrarResposta,
    finalizarSessao,
    listarSessoes,
    desempenhoPorMateria,
    listarRespostas
};