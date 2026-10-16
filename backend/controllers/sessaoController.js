const {
    listarSessoesAtivas: buscarSessoesAtivas,
    encerrarSessao,
    encerrarSessaoPorId
} = require("../models/sessaoModel");


// =====================================================
// LISTAR USUÁRIOS LOGADOS
// =====================================================

function listarSessoesAtivas(req, res) {

    buscarSessoesAtivas((erro, sessoes) => {

        if (erro) {
            console.error("❌ Erro ao buscar sessões:", erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar sessões ativas."
            });
        }

        return res.status(200).json({
            usuarios: sessoes
        });
    });
}


// =====================================================
// ENCERRAR SESSÃO
// =====================================================

function sair(req, res) {

    const usuarioId = Number(req.params.usuarioId);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    const podeEncerrar =
        req.usuario &&
        (
            req.usuario.tipo === "admin" ||
            Number(req.usuario.id) === usuarioId
        );

    if (!podeEncerrar) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para encerrar esta sessão."
        });
    }

    // O próprio usuário sai somente da sessão autenticada; admins podem
    // desconectar todas as sessões de outra conta.
    const encerrar = Number(req.usuario.id) === usuarioId
        ? (callback) => encerrarSessaoPorId(req.sessaoId, callback)
        : (callback) => encerrarSessao(usuarioId, callback);

    encerrar((erro) => {

        if (erro) {
            console.error("❌ Erro ao encerrar sessão:", erro);

            return res.status(500).json({
                mensagem: "Erro ao encerrar sessão."
            });
        }

        return res.status(200).json({
            mensagem: "Sessão encerrada com sucesso."
        });
    });
}


module.exports = {
    listarSessoesAtivas,
    sair
};