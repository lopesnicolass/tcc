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


    // Verifica se todos os campos foram enviados
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


    // Evita divisão por zero
    if (totalQuestoes <= 0) {
        return res.status(400).json({
            mensagem: "O total de questões deve ser maior que zero."
        });
    }


    // Calcula a porcentagem automaticamente
    const porcentagem =
        (acertos / totalQuestoes) * 100;


    criarResultado(
        usuarioId,
        acertos,
        erros,
        totalQuestoes,
        porcentagem,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao salvar resultado."
                });
            }


            return res.status(201).json({
                mensagem: "Resultado salvo com sucesso!",
                resultado: {
                    id: resultado.insertId,
                    usuarioId,
                    acertos,
                    erros,
                    totalQuestoes,
                    porcentagem: porcentagem.toFixed(2)
                }
            });
        }
    );
}


// ============================
// BUSCAR RESULTADOS DO USUÁRIO
// ============================

function listarResultados(req, res) {

    const { usuarioId } = req.params;


    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário não informado."
        });
    }


    buscarResultadosPorUsuario(
        usuarioId,
        (erro, resultados) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao buscar resultados."
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

    const { usuarioId } = req.params;


    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário não informado."
        });
    }


    buscarDesempenhoPorUsuario(
        usuarioId,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao buscar desempenho."
                });
            }


            return res.status(200).json({
                desempenho: resultado
            });
        }
    );
}


// ============================
// EXPORTAÇÕES
// ============================

module.exports = {
    cadastrarResultado,
    listarResultados,
    buscarDesempenho
};