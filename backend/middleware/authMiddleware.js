const jwt = require("jsonwebtoken");

const {
    buscarSessaoAtivaPorId
} = require("../models/sessaoModel");


function autenticarToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            mensagem: "Token não informado."
        });
    }

    const partes = authHeader.split(" ");

    if (
        partes.length !== 2 ||
        partes[0] !== "Bearer"
    ) {
        return res.status(401).json({
            mensagem: "Formato do token inválido."
        });
    }

    const token = partes[1];

    try {

        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const sessaoId =
            Number(usuario.sessaoId);

        if (
            !Number.isInteger(sessaoId) ||
            sessaoId <= 0
        ) {
            return res.status(401).json({
                mensagem:
                    "Sessão inválida. Faça login novamente."
            });
        }

        buscarSessaoAtivaPorId(
            sessaoId,
            (erro, sessao) => {

                if (erro) {

                    console.error(
                        "❌ Erro ao validar sessão:",
                        erro
                    );

                    return res.status(500).json({
                        mensagem:
                            "Não foi possível validar sua sessão."
                    });
                }

                if (!sessao) {

                    return res.status(401).json({
                        mensagem:
                            "Sua sessão foi encerrada. Faça login novamente."
                    });
                }

                if (
                    Number(sessao.usuario_id) !==
                    Number(usuario.id)
                ) {

                    return res.status(401).json({
                        mensagem:
                            "Sessão inválida. Faça login novamente."
                    });
                }

                req.usuario = usuario;
                req.sessaoId = sessaoId;

                next();
            }
        );

    } catch (erro) {

        return res.status(401).json({
            mensagem:
                "Token inválido ou expirado."
        });
    }
}


module.exports = autenticarToken;