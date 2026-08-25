const {
    criarResultado,
    buscarResultadosPorUsuario,
    buscarDesempenhoPorUsuario
} = require("../models/resultadoModel");


// ============================
// CRIAR RESULTADO
// ============================

function cadastrarResultado(req, res) {

    const {
        usuarioId,
        acertos,
        erros,
        totalQuestoes
    } = req.body;


    // ============================
    // VALIDAÇÕES
    // ============================

    if (
        usuarioId === undefined ||
        acertos === undefined ||
        erros === undefined ||
        totalQuestoes === undefined
    ) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }


    const usuario = Number(usuarioId);
    const acertosNumero = Number(acertos);
    const errosNumero = Number(erros);
    const totalNumero = Number(totalQuestoes);


    if (!Number.isInteger(usuario) || usuario <= 0) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }


    if (
        !Number.isInteger(acertosNumero) ||
        acertosNumero < 0
    ) {
        return res.status(400).json({
            mensagem: "Quantidade de acertos inválida."
        });
    }


    if (
        !Number.isInteger(errosNumero) ||
        errosNumero < 0
    ) {
        return res.status(400).json({
            mensagem: "Quantidade de erros inválida."
        });
    }


    if (
        !Number.isInteger(totalNumero) ||
        totalNumero <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "O total de questões deve ser maior que zero."
        });
    }


    if (
        acertosNumero + errosNumero !== totalNumero
    ) {
        return res.status(400).json({
            mensagem:
                "A quantidade de acertos e erros não corresponde ao total de questões."
        });
    }


    // ============================
    // CALCULAR PORCENTAGEM
    // ============================

    const porcentagem =
        (acertosNumero / totalNumero) * 100;


    // ============================
    // SALVAR NO BANCO
    // ============================

    criarResultado(
        usuario,
        acertosNumero,
        errosNumero,
        totalNumero,
        porcentagem,
        (erro, resultado) => {

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

                    id: resultado.lastID,

                    usuarioId: usuario,

                    acertos: acertosNumero,

                    erros: errosNumero,

                    totalQuestoes: totalNumero,

                    porcentagem:
                        Number(
                            porcentagem.toFixed(2)
                        )
                }
            });
        }
    );
}


// ============================
// BUSCAR RESULTADOS DO USUÁRIO
// ============================

function listarResultados(req, res) {

    const {
        usuarioId
    } = req.params;


    if (!usuarioId) {

        return res.status(400).json({
            mensagem:
                "Usuário não informado."
        });
    }


    buscarResultadosPorUsuario(
        usuarioId,
        (erro, resultados) => {

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
                resultados
            });
        }
    );
}


// ============================
// BUSCAR DESEMPENHO
// ============================

function buscarDesempenho(req, res) {

    const {
        usuarioId
    } = req.params;


    if (!usuarioId) {

        return res.status(400).json({
            mensagem:
                "Usuário não informado."
        });
    }


    buscarDesempenhoPorUsuario(
        usuarioId,
        (erro, resultado) => {

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
                desempenho: resultado
            });
        }
    );
}


module.exports = {
    cadastrarResultado,
    listarResultados,
    buscarDesempenho
};