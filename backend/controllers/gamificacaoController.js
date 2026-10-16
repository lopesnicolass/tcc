const {
    buscarGamificacao,
    registrarAtividade
} = require("../models/usuarioModel");


function obterHoje() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}


function obterOntem() {
    const agora = new Date();
    agora.setDate(agora.getDate() - 1);
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}


function buscar(req, res) {
    const usuarioId = req.usuario.id;

    buscarGamificacao(usuarioId, (erro, dados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                mensagem: "Erro ao buscar gamificação."
            });
        }

        if (!dados) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        res.json({
            xp: Number(dados.xp) || 0,
            streak: Number(dados.streak) || 0,
            lastActiveDate: dados.last_active_date || null
        });
    });
}


function calcularStreak(dados) {
    const hoje = obterHoje();
    const ontem = obterOntem();
    let streak = Number(dados.streak) || 0;

    if (dados.last_active_date !== hoje) {
        streak = dados.last_active_date === ontem
            ? streak + 1
            : 1;
    }

    return { hoje, streak };
}


function registrar(req, res) {
    const usuarioId = req.usuario.id;

    buscarGamificacao(usuarioId, (erro, dados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                mensagem: "Erro ao consultar sequência."
            });
        }

        if (!dados) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const { hoje, streak } = calcularStreak(dados);

        registrarAtividade(
            usuarioId,
            streak,
            hoje,
            (erro) => {
                if (erro) {
                    console.error(erro);
                    return res.status(500).json({
                        mensagem: "Erro ao registrar atividade."
                    });
                }

                buscarGamificacao(usuarioId, (erro, atualizado) => {
                    if (erro) {
                        console.error(erro);
                        return res.status(500).json({
                            mensagem: "Erro ao atualizar sequência."
                        });
                    }

                    res.json({
                        xp: Number(atualizado.xp) || 0,
                        streak: Number(atualizado.streak) || 0,
                        lastActiveDate: atualizado.last_active_date || null
                    });
                });
            }
        );
    });
}


module.exports = {
    buscar,
    registrar
};
