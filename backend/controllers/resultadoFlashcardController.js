const resultadoFlashcardModel =
    require("../models/resultadoFlashcardModel");


// =====================================================
// USUÁRIO LOGADO
// =====================================================

function obterUsuarioId(req) {

    if (
        !req.usuario ||
        !req.usuario.id
    ) {
        return null;
    }

    const usuarioId =
        Number(
            req.usuario.id
        );

    if (
        !Number.isInteger(
            usuarioId
        ) ||
        usuarioId <= 0
    ) {
        return null;
    }

    return usuarioId;
}


// =====================================================
// CRIAR SESSÃO
// =====================================================

function criarSessao(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    const totalCards =
        Number(
            req.body?.totalCards
        );


    if (
        !Number.isInteger(
            totalCards
        ) ||
        totalCards <= 0 ||
        totalCards > 100
    ) {

        return res.status(400).json({
            erro:
                "Quantidade de cards inválida."
        });
    }


    resultadoFlashcardModel.criarSessao(
        usuarioId,
        totalCards,
        (
            erro,
            sessao
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao criar sessão de flashcards:",
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

function registrarResposta(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    const sessaoId =
        Number(
            req.params.sessaoId
        );

    const flashcardId =
        Number(
            req.body?.flashcardId
        );

    const acertou =
        req.body?.acertou;


    if (
        !Number.isInteger(
            sessaoId
        ) ||
        sessaoId <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID da sessão inválido."
        });
    }


    if (
        !Number.isInteger(
            flashcardId
        ) ||
        flashcardId <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID do flashcard inválido."
        });
    }


    if (
        typeof acertou !==
        "boolean"
    ) {

        return res.status(400).json({
            erro:
                "Informe se o flashcard foi acertado ou errado."
        });
    }


    resultadoFlashcardModel.registrarResposta(
        sessaoId,
        usuarioId,
        flashcardId,
        acertou,
        (
            erro,
            resposta
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao registrar resposta:",
                    erro
                );


                switch (
                    erro.code
                ) {

                    case "SESSION_NOT_FOUND":

                    case "FLASHCARD_NOT_FOUND":

                        return res.status(404).json({
                            erro:
                                erro.message
                        });


                    case "SESSION_ACCESS_DENIED":

                        return res.status(403).json({
                            erro:
                                erro.message
                        });


                    case "SESSION_FINISHED":

                    case "SESSION_FULL":

                    case "FLASHCARD_ALREADY_ANSWERED":

                    case "FLASHCARD_INACTIVE":

                    case "FLASHCARD_MATERIA_INVALIDA":

                        return res.status(400).json({
                            erro:
                                erro.message
                        });


                    default:

                        return res.status(500).json({
                            erro:
                                "Erro ao registrar resposta."
                        });
                }
            }


            return res.status(201).json({

                mensagem:
                    "Resposta registrada com sucesso.",

                resposta

            });

        }
    );
}


// =====================================================
// FINALIZAR SESSÃO
// =====================================================

function finalizarSessao(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    const sessaoId =
        Number(
            req.params.sessaoId
        );


    if (
        !Number.isInteger(
            sessaoId
        ) ||
        sessaoId <= 0
    ) {

        return res.status(400).json({
            erro:
                "ID da sessão inválido."
        });
    }


    resultadoFlashcardModel.finalizarSessao(
        sessaoId,
        usuarioId,
        (
            erro,
            sessao
        ) => {

            if (erro) {

                if (
                    erro.code ===
                    "SESSION_ACCESS_DENIED"
                ) {

                    return res.status(403).json({
                        erro:
                            erro.message
                    });
                }


                if (
                    erro.code ===
                    "SESSION_INCOMPLETE"
                ) {

                    return res.status(400).json({
                        erro:
                            erro.message
                    });
                }


                console.error(
                    "❌ Erro ao finalizar sessão:",
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

function listarSessoes(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.listarSessoesDoUsuario(
        usuarioId,
        (
            erro,
            sessoes
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao listar sessões:",
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

function desempenhoPorMateria(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.buscarDesempenhoPorMateria(
        usuarioId,
        (
            erro,
            desempenho
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar desempenho:",
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

function listarRespostas(
    req,
    res
) {

    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {

        return res.status(401).json({
            erro:
                "Usuário não autenticado."
        });
    }


    resultadoFlashcardModel.listarRespostasDoUsuario(
        usuarioId,
        (
            erro,
            respostas
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao listar respostas:",
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


// =====================================================
// EXPORTAÇÕES
// =====================================================

module.exports = {

    criarSessao,

    registrarResposta,

    finalizarSessao,

    listarSessoes,

    desempenhoPorMateria,

    listarRespostas

};