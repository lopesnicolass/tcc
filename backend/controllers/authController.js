const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    criarUsuario,
    buscarUsuarioPorEmail,
    salvarTokenRecuperacao,
    buscarUsuarioPorTokenRecuperacao,
    limparTokenRecuperacao,
    atualizarSenha
} = require("../models/usuarioModel");

const {
    enviarEmailRecuperacao
} = require("../config/mailer");

const {
    criarSessao
} = require("../models/sessaoModel");


// ============================
// CADASTRO DE ALUNO
// ============================

async function cadastrar(req, res) {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });
    }

    buscarUsuarioPorEmail(email, async (erro, resultado) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar o banco de dados."
            });
        }

        if (resultado) {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        try {

            const senhaCriptografada =
                await bcrypt.hash(senha, 10);

            criarUsuario(
                nome,
                email,
                senhaCriptografada,
                "aluno",
                (erro) => {

                    if (erro) {
                        console.error(erro);

                        return res.status(500).json({
                            mensagem: "Erro ao cadastrar usuário."
                        });
                    }

                    return res.status(201).json({
                        mensagem: "Aluno cadastrado com sucesso!"
                    });
                }
            );

        } catch (erro) {

            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro interno do servidor."
            });
        }

    });
}


// ============================
// LOGIN
// ============================

async function login(req, res) {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: "Preencha email e senha."
        });
    }

    buscarUsuarioPorEmail(email, async (erro, usuario) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar o banco de dados."
            });
        }

        if (!usuario) {
            return res.status(401).json({
                mensagem: "Email ou senha incorretos."
            });
        }

        try {

            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    usuario.senha
                );

            if (!senhaCorreta) {
                return res.status(401).json({
                    mensagem: "Email ou senha incorretos."
                });
            }


            // ============================
            // GERAR TOKEN JWT
            // ============================

            const token = jwt.sign(
                {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );


            // ============================
            // REGISTRAR SESSÃO
            // ============================

            criarSessao(usuario.id, (erro) => {

                if (erro) {
                    console.error(
                        "❌ Erro ao registrar sessão:",
                        erro
                    );

                    return res.status(500).json({
                        mensagem: "Erro ao registrar sessão."
                    });
                }


                // ============================
                // RETORNAR LOGIN
                // ============================

                return res.status(200).json({
                    mensagem: "Login realizado com sucesso!",
                    token,
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        tipo: usuario.tipo
                    }
                });

            });

        } catch (erro) {

            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro interno do servidor."
            });
        }

    });
}


// ============================
// SOLICITAR RECUPERAÇÃO DE SENHA
// ============================

async function esqueciSenha(req, res) {

    const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();

    if (!email) {
        return res.status(400).json({
            mensagem: "Informe seu e-mail."
        });
    }

    const mensagemPadrao =
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";

    buscarUsuarioPorEmail(email, async (erro, usuario) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Não foi possível processar a recuperação agora."
            });
        }

        if (!usuario) {
            return res.status(200).json({
                mensagem: mensagemPadrao
            });
        }

        try {
            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            const minutosValidade = 15;
            const expiraEm = Date.now() + (minutosValidade * 60 * 1000);

            salvarTokenRecuperacao(
                usuario.id,
                tokenHash,
                expiraEm,
                async (erroToken) => {

                    if (erroToken) {
                        console.error(erroToken);

                        return res.status(500).json({
                            mensagem: "Não foi possível gerar a recuperação agora."
                        });
                    }

                    const baseUrl =
                        process.env.FRONTEND_URL ||
                        "http://localhost:5173";

                    const link =
                        `${baseUrl}/redefinir-senha?token=${token}`;

                    try {
                        await enviarEmailRecuperacao({
                            destinatario: usuario.email,
                            nome: usuario.nome,
                            link
                        });

                        return res.status(200).json({
                            mensagem: mensagemPadrao
                        });
                    } catch (erroEmail) {
                        console.error(erroEmail);

                        limparTokenRecuperacao(usuario.id, () => {});

                        return res.status(500).json({
                            mensagem: "Não foi possível enviar o e-mail de recuperação."
                        });
                    }
                }
            );

        } catch (erroGeracao) {
            console.error(erroGeracao);

            return res.status(500).json({
                mensagem: "Não foi possível processar a recuperação agora."
            });
        }
    });
}


// ============================
// REDEFINIR SENHA
// ============================

async function redefinirSenha(req, res) {

    const token = String(req.body?.token || "");
    const novaSenha = String(req.body?.novaSenha || "");

    if (!token || !novaSenha) {
        return res.status(400).json({
            mensagem: "Dados de redefinição incompletos."
        });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({
            mensagem: "A senha deve ter pelo menos 6 caracteres."
        });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    buscarUsuarioPorTokenRecuperacao(
        tokenHash,
        Date.now(),
        async (erro, usuario) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Não foi possível validar o link de recuperação."
                });
            }

            if (!usuario) {
                return res.status(400).json({
                    mensagem: "Esse link de recuperação é inválido ou expirou."
                });
            }

            try {
                const senhaCriptografada =
                    await bcrypt.hash(novaSenha, 10);

                atualizarSenha(
                    usuario.id,
                    senhaCriptografada,
                    (erroSenha) => {

                        if (erroSenha) {
                            console.error(erroSenha);

                            return res.status(500).json({
                                mensagem: "Não foi possível atualizar sua senha."
                            });
                        }

                        limparTokenRecuperacao(
                            usuario.id,
                            (erroLimpeza) => {

                                if (erroLimpeza) {
                                    console.error(erroLimpeza);

                                    return res.status(500).json({
                                        mensagem: "Sua senha foi alterada, mas não foi possível finalizar a recuperação."
                                    });
                                }

                                return res.status(200).json({
                                    mensagem: "Senha redefinida com sucesso!"
                                });
                            }
                        );
                    }
                );

            } catch (erroHash) {
                console.error(erroHash);

                return res.status(500).json({
                    mensagem: "Não foi possível atualizar sua senha."
                });
            }
        }
    );
}


// ============================
// EXPORTAR
// ============================

module.exports = {
    cadastrar,
    login,
    esqueciSenha,
    redefinirSenha
};