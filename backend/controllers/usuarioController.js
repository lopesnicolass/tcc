const {
    listarUsuarios,
    excluirUsuario
} = require("../models/usuarioModel");


// ============================
// LISTAR TODOS OS USUÁRIOS
// ============================

function listarTodosUsuarios(req, res) {

    listarUsuarios((erro, usuarios) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar usuários."
            });
        }

        return res.status(200).json({
            usuarios: usuarios
        });
    });
}


// ============================
// EXCLUIR USUÁRIO
// ============================

function excluir(req, res) {

    const usuarioId = Number(req.params.id);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    // Não permite o administrador excluir a própria conta
    if (req.usuario.id === usuarioId) {
        return res.status(400).json({
            mensagem: "O administrador não pode excluir a própria conta."
        });
    }

    excluirUsuario(usuarioId, (erro, alterados) => {

        if (erro) {
            console.error("❌ Erro ao excluir usuário:", erro);

            return res.status(500).json({
                mensagem: "Erro ao excluir usuário."
            });
        }

        if (alterados === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            mensagem: "Usuário excluído com sucesso."
        });
    });
}


module.exports = {
    listarTodosUsuarios,
    excluir
};