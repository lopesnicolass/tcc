const {
    buscarSessoesAtivas,
    encerrarSessao
} = require("../models/sessaoModel");


// =====================================================
// LISTAR USUÁRIOS LOGADOS
// =====================================================

function listarSessoesAtivas(req, res) {

    buscarSessoesAtivas((erro, sessoes) => {

        if (erro) {
            console.error(
                "❌ Erro ao buscar sessões ativas:",
                erro
            );

            return res.status(500).json({
                mensagem: "Erro ao buscar usuários logados."
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

    if (!req.usuario) {
        return res.status(401).json({
            mensagem: "Usuário não autenticado."
        });
    }

    const usuarioId = req.usuario.id;

    encerrarSessao(usuarioId, (erro) => {

        if (erro) {
            console.error(
                "❌ Erro ao encerrar sessão:",
                erro
            );

            return res.status(500).json({
                mensagem: "Erro ao encerrar sessão."
            });
        }

        return res.status(200).json({
            mensagem: "Logout realizado com sucesso!"
        });

    });
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
    listarSessoesAtivas,
    sair
};