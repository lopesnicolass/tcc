const {
    buscarGamificacao,
    adicionarXP
} = require("../models/usuarioModel");


const XP_POR_ACAO = {
    simulado_iniciado: 10,
    simulado_concluido: 50,
    flashcard_revisado: 5,
    novo_postit: 10,
    semana_cronograma: 10,
    atividade_concluida: 15
};


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


function ganharXP(req, res) {
    const usuarioId = req.usuario.id;
    const { action } = req.body || {};
    const quantidade = XP_POR_ACAO[action];

    if (!quantidade) {
        return res.status(400).json({
            mensagem: "Ação de XP inválida."
        });
    }

    buscarGamificacao(usuarioId, (erro, dados) => {
        if (erro) {
            console.error(erro);
            return res.status(500).json({
                mensagem: "Erro ao consultar gamificação."
            });
        }

        if (!dados) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const hoje = obterHoje();
        const ontem = obterOntem();
        let streak = Number(dados.streak) || 0;

        if (dados.last_active_date !== hoje) {
            streak = dados.last_active_date === ontem
                ? streak + 1
                : 1;
        }

        adicionarXP(
            usuarioId,
            quantidade,
            streak,
            hoje,
            (erro) => {
                if (erro) {
                    console.error(erro);
                    return res.status(500).json({
                        mensagem: "Erro ao salvar XP."
                    });
                }

                buscarGamificacao(usuarioId, (erro, atualizado) => {
                    if (erro) {
                        console.error(erro);
                        return res.status(500).json({
                            mensagem: "Erro ao atualizar XP."
                        });
                    }

                    res.json({
                        xp: Number(atualizado.xp) || 0,
                        streak: Number(atualizado.streak) || 0,
                        lastActiveDate: atualizado.last_active_date || null,
                        gainedXP: quantidade
                    });
                });
            }
        );
    });
}


module.exports = {
    buscar,
    ganharXP
};
