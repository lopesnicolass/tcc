const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    criarUsuario,
    buscarUsuarioPorEmail
} = require("../models/usuarioModel");

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
// EXPORTAR
// ============================

module.exports = {
    cadastrar,
    login
};