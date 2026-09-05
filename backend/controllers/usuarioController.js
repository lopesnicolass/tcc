const bcrypt = require("bcrypt");

const {
    listarUsuarios,
    excluirUsuario,
    buscarUsuarioPorId,
    buscarUsuarioPorEmail,
    atualizarPerfil,
    atualizarSenha,
    atualizarFoto
} = require("../models/usuarioModel");


// =====================================================
// LISTAR TODOS OS USUÁRIOS
// =====================================================

function listarTodosUsuarios(req, res) {

    listarUsuarios((erro, usuarios) => {

        if (erro) {

            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar usuários."
            });
        }

        return res.status(200).json({
            usuarios
        });
    });
}


// =====================================================
// BUSCAR MEU PERFIL
// =====================================================

function buscarMeuPerfil(req, res) {

    const usuarioId = Number(req.usuario.id);

    buscarUsuarioPorId(
        usuarioId,
        (erro, usuario) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar perfil:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao buscar perfil."
                });
            }

            if (!usuario) {

                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });
            }

            return res.status(200).json({
                usuario
            });

        }
    );
}


// =====================================================
// ATUALIZAR PERFIL
// =====================================================

async function editarPerfil(req, res) {

    const usuarioId = Number(req.usuario.id);

    const {
        nome,
        email,
        senhaAtual,
        novaSenha
    } = req.body;


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (!nome || nome.trim().length < 2) {

        return res.status(400).json({
            mensagem: "O nome deve possuir pelo menos 2 caracteres."
        });

    }


    if (!email) {

        return res.status(400).json({
            mensagem: "O e-mail é obrigatório."
        });

    }


    const emailValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {

        return res.status(400).json({
            mensagem: "Informe um e-mail válido."
        });

    }


    // =================================================
    // BUSCAR USUÁRIO
    // =================================================

    buscarUsuarioPorId(
        usuarioId,
        async (erro, usuario) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao consultar usuário."
                });

            }


            if (!usuario) {

                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });

            }


            // =================================================
            // VERIFICAR EMAIL DUPLICADO
            // =================================================

            buscarUsuarioPorEmail(
                email,
                async (erroEmail, usuarioEmail) => {

                    if (erroEmail) {

                        console.error(erroEmail);

                        return res.status(500).json({
                            mensagem: "Erro ao verificar e-mail."
                        });

                    }


                    if (
                        usuarioEmail &&
                        usuarioEmail.id !== usuarioId
                    ) {

                        return res.status(409).json({
                            mensagem:
                                "Este e-mail já está sendo utilizado."
                        });

                    }


                    // =================================================
                    // SE FOR ALTERAR SENHA
                    // =================================================

                    if (novaSenha) {

                        if (!senhaAtual) {

                            return res.status(400).json({
                                mensagem:
                                    "Informe sua senha atual."
                            });

                        }


                        if (novaSenha.length < 6) {

                            return res.status(400).json({
                                mensagem:
                                    "A nova senha deve possuir pelo menos 6 caracteres."
                            });

                        }


                        const senhaCorreta =
                            await bcrypt.compare(
                                senhaAtual,
                                usuario.senha
                            );


                        if (!senhaCorreta) {

                            return res.status(401).json({
                                mensagem:
                                    "A senha atual está incorreta."
                            });

                        }


                        const senhaCriptografada =
                            await bcrypt.hash(
                                novaSenha,
                                10
                            );


                        atualizarSenha(
                            usuarioId,
                            senhaCriptografada,
                            (erroSenha) => {

                                if (erroSenha) {

                                    console.error(
                                        erroSenha
                                    );

                                    return res.status(500).json({
                                        mensagem:
                                            "Erro ao atualizar senha."
                                    });

                                }

                            }
                        );

                    }


                    // =================================================
                    // ATUALIZAR NOME + EMAIL
                    // =================================================

                    atualizarPerfil(
                        usuarioId,
                        nome.trim(),
                        email.trim(),
                        (erroAtualizacao) => {

                            if (erroAtualizacao) {

                                console.error(
                                    erroAtualizacao
                                );

                                return res.status(500).json({
                                    mensagem:
                                        "Erro ao atualizar perfil."
                                });

                            }


                            buscarUsuarioPorId(
                                usuarioId,
                                (erroFinal, usuarioAtualizado) => {

                                    if (erroFinal) {

                                        console.error(
                                            erroFinal
                                        );

                                        return res.status(500).json({
                                            mensagem:
                                                "Perfil atualizado, mas não foi possível carregar os novos dados."
                                        });

                                    }


                                    return res.status(200).json({

                                        mensagem:
                                            "Perfil atualizado com sucesso!",

                                        usuario:
                                            usuarioAtualizado

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );
}


// =====================================================
// ATUALIZAR FOTO
// =====================================================

function editarFoto(req, res) {

    const usuarioId = Number(req.usuario.id);

    if (!req.file) {

        return res.status(400).json({
            mensagem: "Nenhuma imagem foi enviada."
        });

    }


    atualizarFoto(
        usuarioId,
        req.file.filename,
        (erro, alterados) => {

            if (erro) {

                console.error(
                    "❌ Erro ao atualizar foto:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao salvar foto."
                });

            }


            if (alterados === 0) {

                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });

            }


            return res.status(200).json({

                mensagem:
                    "Foto atualizada com sucesso!",

                foto_perfil:
                    req.file.filename

            });

        }
    );
}


// =====================================================
// EXCLUIR USUÁRIO
// =====================================================

function excluir(req, res) {

    const usuarioId =
        Number(req.params.id);


    if (!usuarioId) {

        return res.status(400).json({
            mensagem: "Usuário inválido."
        });

    }


    if (req.usuario.id === usuarioId) {

        return res.status(400).json({
            mensagem:
                "O administrador não pode excluir a própria conta."
        });

    }


    excluirUsuario(
        usuarioId,
        (erro, alterados) => {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir usuário:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir usuário."
                });

            }


            if (alterados === 0) {

                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado."
                });

            }


            return res.status(200).json({
                mensagem:
                    "Usuário excluído com sucesso."
            });

        }
    );
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

    listarTodosUsuarios,
    buscarMeuPerfil,
    editarPerfil,
    editarFoto,
    excluir

};