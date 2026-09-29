const {
    criarResultado,
    buscarResultadosPorUsuario,
    buscarDesempenhoPorUsuario
} = require("../models/resultadoModel");


// =====================================================
// VERIFICAR SE O USUÁRIO PODE ACESSAR
// =====================================================

function usuarioPodeAcessar(
    req,
    usuarioId
) {

    if (!req.usuario) {
        return false;
    }

    if (
        req.usuario.tipo === "admin"
    ) {
        return true;
    }

    const usuarioLogadoId =
        Number(
            req.usuario.id ||
            req.usuario.usuarioId
        );

    return (
        Number.isInteger(
            usuarioLogadoId
        ) &&
        usuarioLogadoId === usuarioId
    );
}


// =====================================================
// IDENTIFICAR USUÁRIO LOGADO
// =====================================================

function obterUsuarioLogado(req) {

    const usuarioId =
        Number(
            req.usuario?.id ||
            req.usuario?.usuarioId
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {

        return null;
    }

    return usuarioId;
}


// =====================================================
// CRIAR RESULTADO
// =====================================================

function cadastrarResultado(
    req,
    res
) {

    const {
        simuladoId,
        acertos,
        erros,
        totalQuestoes
    } = req.body || {};

    const usuarioId =
        obterUsuarioLogado(req);

    if (!usuarioId) {

        return res.status(401).json({
            mensagem:
                "Usuário inválido ou não autenticado."
        });
    }


    // =================================================
    // VALIDAR CAMPOS
    // =================================================

    if (
        simuladoId === undefined ||
        acertos === undefined ||
        erros === undefined ||
        totalQuestoes === undefined
    ) {

        return res.status(400).json({
            mensagem:
                "Preencha todos os campos."
        });
    }


    const simuladoNumero =
        Number(simuladoId);

    const acertosNumero =
        Number(acertos);

    const errosNumero =
        Number(erros);

    const totalNumero =
        Number(totalQuestoes);


    // =================================================
    // VALIDAR SIMULADO
    // =================================================

    if (
        !Number.isInteger(simuladoNumero) ||
        simuladoNumero <= 0
    ) {

        return res.status(400).json({
            mensagem:
                "Simulado inválido."
        });
    }


    // =================================================
    // VALIDAR ACERTOS
    // =================================================

    if (
        !Number.isInteger(acertosNumero) ||
        acertosNumero < 0
    ) {

        return res.status(400).json({
            mensagem:
                "Quantidade de acertos inválida."
        });
    }


    // =================================================
    // VALIDAR ERROS
    // =================================================

    if (
        !Number.isInteger(errosNumero) ||
        errosNumero < 0
    ) {

        return res.status(400).json({
            mensagem:
                "Quantidade de erros inválida."
        });
    }


    // =================================================
    // VALIDAR TOTAL
    // =================================================

    if (
        !Number.isInteger(totalNumero) ||
        totalNumero <= 0
    ) {

        return res.status(400).json({
            mensagem:
                "O total de questões deve ser maior que zero."
        });
    }


    // =================================================
    // VALIDAR SOMA
    // =================================================

    if (
        acertosNumero + errosNumero !==
        totalNumero
    ) {

        return res.status(400).json({
            mensagem:
                "A quantidade de acertos e erros não corresponde ao total de questões."
        });
    }


    // =================================================
    // CALCULAR PORCENTAGEM
    // =================================================

    const porcentagem =
        (
            acertosNumero /
            totalNumero
        ) * 100;


    // =================================================
    // SALVAR
    // =================================================

    criarResultado(
        usuarioId,
        simuladoNumero,
        acertosNumero,
        errosNumero,
        totalNumero,
        porcentagem,

        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao salvar resultado:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao salvar resultado."
                });
            }


            return res.status(201).json({

                mensagem:
                    "Resultado salvo com sucesso!",

                resultado: {

                    id:
                        resultado.lastID,

                    usuarioId:
                        usuarioId,

                    simuladoId:
                        simuladoNumero,

                    acertos:
                        acertosNumero,

                    erros:
                        errosNumero,

                    totalQuestoes:
                        totalNumero,

                    porcentagem:
                        Number(
                            porcentagem.toFixed(2)
                        )
                }
            });

        }
    );
}


// =====================================================
// LISTAR RESULTADOS POR USUÁRIO
// =====================================================

function listarResultados(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {

        return res.status(400).json({
            mensagem:
                "Usuário não informado."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para ver esses resultados."
        });
    }


    buscarResultadosPorUsuario(
        usuarioId,

        (
            erro,
            resultados
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar resultados:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar resultados."
                });
            }


            return res.status(200).json({
                resultados:
                    resultados || []
            });
        }
    );
}


// =====================================================
// LISTAR MEUS RESULTADOS
// =====================================================

function listarMeusResultados(
    req,
    res
) {

    const usuarioId =
        obterUsuarioLogado(req);

    if (!usuarioId) {

        return res.status(401).json({
            mensagem:
                "Usuário não autenticado."
        });
    }


    buscarResultadosPorUsuario(
        usuarioId,

        (
            erro,
            resultados
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar meus resultados:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar resultados."
                });
            }


            return res.status(200).json({
                resultados:
                    resultados || []
            });
        }
    );
}


// =====================================================
// BUSCAR DESEMPENHO POR USUÁRIO
// =====================================================

function buscarDesempenho(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {

        return res.status(400).json({
            mensagem:
                "Usuário não informado."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para ver esse desempenho."
        });
    }


    buscarDesempenhoPorUsuario(
        usuarioId,

        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar desempenho:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar desempenho."
                });
            }


            return res.status(200).json({

                desempenho:
                    resultado || {
                        totalSimulados: 0,
                        mediaPorcentagem: 0,
                        totalAcertos: 0,
                        totalErros: 0,
                        totalQuestoes: 0,
                        melhorResultado: 0
                    }

            });
        }
    );
}


// =====================================================
// BUSCAR MEU DESEMPENHO
// =====================================================

function buscarMeuDesempenho(
    req,
    res
) {

    const usuarioId =
        obterUsuarioLogado(req);

    if (!usuarioId) {

        return res.status(401).json({
            mensagem:
                "Usuário não autenticado."
        });
    }


    buscarDesempenhoPorUsuario(
        usuarioId,

        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar meu desempenho:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar desempenho."
                });
            }


            return res.status(200).json({

                desempenho:
                    resultado || {
                        totalSimulados: 0,
                        mediaPorcentagem: 0,
                        totalAcertos: 0,
                        totalErros: 0,
                        totalQuestoes: 0,
                        melhorResultado: 0
                    }

            });
        }
    );
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    cadastrarResultado,

    listarResultados,

    listarMeusResultados,

    buscarDesempenho,

    buscarMeuDesempenho

};