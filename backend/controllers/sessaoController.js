const {
    listarSessoesAtivas: buscarSessoesAtivas,
    encerrarSessao
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

    encerrarSessao(usuarioId, (erro) => {

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