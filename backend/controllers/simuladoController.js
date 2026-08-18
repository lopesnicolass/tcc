const {
    criarResultado,
    buscarResultadosPorUsuario,
    buscarDesempenhoPorUsuario
} = require("../models/resultadoModel");


// ============================
// CADASTRAR RESULTADO
// ============================

function cadastrarResultado(req, res) {

    const {
        usuarioId,
        acertos,
        erros,
        totalQuestoes,
        porcentagem
    } = req.body;

    if (
        usuarioId === undefined ||
        acertos === undefined ||
        erros === undefined ||
        totalQuestoes === undefined ||
        porcentagem === undefined
    ) {
        return res.status(400).json({
            mensagem: "Todos os dados do resultado são obrigatórios."
        });
    }

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
                resultadoId: resultado.insertId
            });
        }
    );
}


// ============================
// LISTAR RESULTADOS
// ============================

function listarResultados(req, res) {

    const { usuarioId } = req.params;

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "ID do usuário não informado."
        });
    }

    buscarResultadosPorUsuario(
        usuarioId,
        (erro, resultados) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao consultar resultados."
                });
            }

            return res.status(200).json({
                resultados: resultados
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
            mensagem: "ID do usuário não informado."
        });
    }

    buscarDesempenhoPorUsuario(
        usuarioId,
        (erro, resultado) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao consultar desempenho."
                });
            }

            return res.status(200).json({
                desempenho: resultado[0]
            });
        }
    );
}


module.exports = {
    cadastrarResultado,
    listarResultados,
    buscarDesempenho
};