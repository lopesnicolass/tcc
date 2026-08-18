const {
    buscarUsuarioPorId,
    atualizarUsuario
} = require("../models/usuarioModel");


// ============================
// BUSCAR PERFIL
// ============================

function buscarPerfil(req, res) {

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            mensagem: "ID do usuário não informado."
        });
    }

    buscarUsuarioPorId(id, (erro, resultado) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar o banco de dados."
            });
        }

        if (!resultado) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            usuario: resultado
        });
    });
}


// ============================
// ATUALIZAR PERFIL
// ============================

function atualizarPerfil(req, res) {

    const { id } = req.params;
    const { nome, email } = req.body;

    if (!id) {
        return res.status(400).json({
            mensagem: "ID do usuário não informado."
        });
    }

    if (!nome || !email) {
        return res.status(400).json({
            mensagem: "Nome e email são obrigatórios."
        });
    }

    atualizarUsuario(id, nome, email, (erro, resultado) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao atualizar perfil."
            });
        }

        if (resultado.changes === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            mensagem: "Perfil atualizado com sucesso!"
        });
    });
}


module.exports = {
    buscarPerfil,
    atualizarPerfil
};