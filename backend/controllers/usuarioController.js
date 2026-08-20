const {
    listarUsuarios
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


module.exports = {
    listarTodosUsuarios
};