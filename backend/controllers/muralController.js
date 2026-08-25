const {
    listarPostits,
    criarPostit,
    atualizarPostit,
    excluirPostit
} = require("../models/muralModel");


// ==========================================
// LISTAR POST-ITS
// ==========================================

function listar(req, res) {

    const usuarioId = Number(req.params.usuarioId);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    listarPostits(
        usuarioId,
        (erro, postits) => {

            if (erro) {
                console.error(
                    "❌ Erro ao listar post-its:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao buscar post-its."
                });
            }

            return res.json({
                postits: postits || []
            });
        }
    );
}


// ==========================================
// CRIAR POST-IT
// ==========================================

function criar(req, res) {

    const usuarioId =
        Number(req.params.usuarioId);

    const {
        materia,
        texto
    } = req.body;


    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }


    if (
        !materia ||
        !texto ||
        !texto.trim()
    ) {
        return res.status(400).json({
            mensagem:
                "Matéria e texto são obrigatórios."
        });
    }


    if (
        texto.trim().length > 200
    ) {
        return res.status(400).json({
            mensagem:
                "O post-it pode ter no máximo 200 caracteres."
        });
    }


    criarPostit(
        usuarioId,
        materia,
        texto.trim(),
        (erro, postit) => {

            if (erro) {

                console.error(
                    "❌ Erro ao criar post-it:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao criar post-it."
                });
            }


            return res.status(201).json({
                mensagem:
                    "Post-it criado com sucesso!",

                postit
            });
        }
    );
}


// ==========================================
// ATUALIZAR POST-IT
// ==========================================

function atualizar(req, res) {

    const id =
        Number(req.params.id);

    const usuarioId =
        Number(req.params.usuarioId);

    const {
        materia,
        texto
    } = req.body;


    if (!id || !usuarioId) {

        return res.status(400).json({
            mensagem:
                "Dados inválidos."
        });
    }


    if (
        !materia ||
        !texto ||
        !texto.trim()
    ) {

        return res.status(400).json({
            mensagem:
                "Matéria e texto são obrigatórios."
        });
    }


    if (
        texto.trim().length > 200
    ) {

        return res.status(400).json({
            mensagem:
                "O post-it pode ter no máximo 200 caracteres."
        });
    }


    atualizarPostit(
        id,
        usuarioId,
        materia,
        texto.trim(),
        (erro, resultado) => {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar post-it:",
                    erro
                );

                return res.status(404).json({
                    mensagem:
                        "Post-it não encontrado."
                });
            }


            return res.json({
                mensagem:
                    "Post-it atualizado com sucesso!",

                postit: resultado
            });
        }
    );
}


// ==========================================
// EXCLUIR POST-IT
// ==========================================

function excluir(req, res) {

    const id =
        Number(req.params.id);

    const usuarioId =
        Number(req.params.usuarioId);


    if (!id || !usuarioId) {

        return res.status(400).json({
            mensagem:
                "Dados inválidos."
        });
    }


    excluirPostit(
        id,
        usuarioId,
        (erro, resultado) => {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir post-it:",
                    erro
                );

                return res.status(404).json({
                    mensagem:
                        "Post-it não encontrado."
                });
            }


            return res.json({
                mensagem:
                    "Post-it excluído com sucesso."
            });
        }
    );
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    listar,
    criar,
    atualizar,
    excluir
};