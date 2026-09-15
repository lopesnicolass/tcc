const {
    listarAtividades,
    buscarAtividadePorId,
    criarAtividade,
    criarAtividadesEmLote,
    atualizarAtividade,
    excluirAtividade,
    excluirAtividadesPorOrigem
} = require("../models/cronogramaModel");


// =====================================================
// FORMATAR ATIVIDADE PARA O FRONTEND
// (o banco guarda "concluida" como 0/1, o front usa "done")
// =====================================================

function formatarAtividade(linha) {
    return {
        id: linha.id,
        data: linha.data,
        horario: linha.horario,
        nome: linha.nome,
        materia: linha.materia,
        done: Boolean(linha.concluida),
        origem: linha.origem || null,
        topicoId: linha.topico_id || null
    };
}


// =====================================================
// VERIFICAR SE O USUÁRIO PODE ACESSAR
// OS DADOS DE :usuarioId (DONO OU ADMIN)
// =====================================================

function usuarioPodeAcessar(req, usuarioId) {

    if (!req.usuario) {
        return false;
    }

    if (req.usuario.tipo === "admin") {
        return true;
    }

    return Number(req.usuario.id) === usuarioId;
}


// =====================================================
// VALIDAR OS CAMPOS DE UMA ATIVIDADE
// =====================================================

function validarAtividade(dados, exigirTudo = true) {

    if (
        exigirTudo &&
        (
            !dados.nome ||
            !String(dados.nome).trim() ||
            !dados.materia ||
            !dados.data ||
            !dados.horario
        )
    ) {
        return "Preencha nome, matéria, data e horário.";
    }

    if (
        dados.data !== undefined &&
        !/^\d{4}-\d{2}-\d{2}$/.test(dados.data)
    ) {
        return "Data inválida. Use o formato AAAA-MM-DD.";
    }

    if (
        dados.horario !== undefined &&
        !/^\d{2}:\d{2}$/.test(dados.horario)
    ) {
        return "Horário inválido. Use o formato HH:MM.";
    }

    return null;
}


// =====================================================
// LISTAR ATIVIDADES DO USUÁRIO
// =====================================================

function listar(req, res) {

    const usuarioId = Number(req.params.usuarioId);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para ver este cronograma."
        });
    }

    listarAtividades(usuarioId, (erro, linhas) => {

        if (erro) {
            console.error(
                "❌ Erro ao listar cronograma:",
                erro
            );

            return res.status(500).json({
                mensagem: "Erro ao buscar o cronograma."
            });
        }

        return res.json({
            atividades: (linhas || []).map(formatarAtividade)
        });
    });
}


// =====================================================
// CRIAR UMA ATIVIDADE
// =====================================================

function criar(req, res) {

    const usuarioId = Number(req.params.usuarioId);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para criar atividades neste cronograma."
        });
    }

    const dados = req.body || {};

    const erroValidacao = validarAtividade(dados, true);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    criarAtividade(
        usuarioId,
        {
            nome: String(dados.nome).trim(),
            materia: dados.materia,
            data: dados.data,
            horario: dados.horario,
            concluida: Boolean(dados.done),
            origem: dados.origem || null,
            topicoId: dados.topicoId || null
        },
        (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao criar atividade:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao criar atividade."
                });
            }

            return res.status(201).json({
                mensagem: "Atividade criada com sucesso!",
                atividade: {
                    id: resultado.lastID,
                    data: dados.data,
                    horario: dados.horario,
                    nome: String(dados.nome).trim(),
                    materia: dados.materia,
                    done: Boolean(dados.done),
                    origem: dados.origem || null,
                    topicoId: dados.topicoId || null
                }
            });
        }
    );
}


// =====================================================
// CRIAR VÁRIAS ATIVIDADES DE UMA VEZ
// (usado ao gerar/importar o Plano Automático)
// =====================================================

function criarEmLote(req, res) {

    const usuarioId = Number(req.params.usuarioId);

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário inválido."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para alterar este cronograma."
        });
    }

    const { atividades, substituirOrigem } = req.body || {};

    if (!Array.isArray(atividades) || !atividades.length) {
        return res.status(400).json({
            mensagem: "Informe ao menos uma atividade."
        });
    }

    for (const atividade of atividades) {

        const erroValidacao = validarAtividade(atividade, true);

        if (erroValidacao) {
            return res.status(400).json({
                mensagem: erroValidacao
            });
        }
    }

    function inserirLote() {

        criarAtividadesEmLote(
            usuarioId,
            atividades.map((atividade) => ({
                nome: String(atividade.nome).trim(),
                materia: atividade.materia,
                data: atividade.data,
                horario: atividade.horario,
                concluida: Boolean(atividade.done),
                origem: atividade.origem || null,
                topicoId: atividade.topicoId || null
            })),
            (erro) => {

                if (erro) {
                    console.error(
                        "❌ Erro ao criar atividades em lote:",
                        erro
                    );

                    return res.status(500).json({
                        mensagem: "Erro ao salvar as atividades."
                    });
                }

                listarAtividades(usuarioId, (erroListar, linhas) => {

                    if (erroListar) {
                        console.error(
                            "❌ Erro ao recarregar cronograma:",
                            erroListar
                        );

                        return res.status(500).json({
                            mensagem: "Atividades salvas, mas houve erro ao recarregar o cronograma."
                        });
                    }

                    return res.status(201).json({
                        mensagem: "Atividades adicionadas ao cronograma!",
                        atividades: (linhas || []).map(formatarAtividade)
                    });
                });
            }
        );
    }

    // Se veio "substituirOrigem", primeiro apaga tudo daquela
    // origem (ex.: um novo plano automático substitui o antigo)
    if (substituirOrigem) {

        excluirAtividadesPorOrigem(
            usuarioId,
            substituirOrigem,
            (erro) => {

                if (erro) {
                    console.error(
                        "❌ Erro ao substituir atividades:",
                        erro
                    );

                    return res.status(500).json({
                        mensagem: "Erro ao substituir as atividades antigas."
                    });
                }

                inserirLote();
            }
        );

    } else {

        inserirLote();
    }
}


// =====================================================
// ATUALIZAR UMA ATIVIDADE
// =====================================================

function atualizar(req, res) {

    const usuarioId = Number(req.params.usuarioId);
    const id = Number(req.params.id);

    if (!usuarioId || !id) {
        return res.status(400).json({
            mensagem: "Dados inválidos."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para editar esta atividade."
        });
    }

    const dados = req.body || {};

    const erroValidacao = validarAtividade(dados, false);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    buscarAtividadePorId(id, (erroBusca, atividade) => {

        if (erroBusca) {
            console.error(
                "❌ Erro ao buscar atividade:",
                erroBusca
            );

            return res.status(500).json({
                mensagem: "Erro ao atualizar atividade."
            });
        }

        if (!atividade) {
            return res.status(404).json({
                mensagem: "Atividade não encontrada."
            });
        }

        if (Number(atividade.usuario_id) !== usuarioId) {
            return res.status(403).json({
                mensagem: "Esta atividade não pertence a este usuário."
            });
        }

        atualizarAtividade(
            id,
            {
                nome:
                    dados.nome !== undefined
                        ? String(dados.nome).trim()
                        : undefined,
                materia: dados.materia,
                data: dados.data,
                horario: dados.horario,
                concluida:
                    dados.done !== undefined
                        ? Boolean(dados.done)
                        : undefined
            },
            (erro, resultado) => {

                if (erro) {
                    console.error(
                        "❌ Erro ao atualizar atividade:",
                        erro
                    );

                    return res.status(500).json({
                        mensagem: "Erro ao atualizar atividade."
                    });
                }

                if (resultado.changes === 0) {
                    return res.status(404).json({
                        mensagem: "Atividade não encontrada."
                    });
                }

                buscarAtividadePorId(id, (erroFinal, linhaAtualizada) => {

                    if (erroFinal || !linhaAtualizada) {
                        return res.status(200).json({
                            mensagem: "Atividade atualizada com sucesso!"
                        });
                    }

                    return res.status(200).json({
                        mensagem: "Atividade atualizada com sucesso!",
                        atividade: formatarAtividade(linhaAtualizada)
                    });
                });
            }
        );
    });
}


// =====================================================
// EXCLUIR UMA ATIVIDADE
// =====================================================

function excluir(req, res) {

    const usuarioId = Number(req.params.usuarioId);
    const id = Number(req.params.id);

    if (!usuarioId || !id) {
        return res.status(400).json({
            mensagem: "Dados inválidos."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para excluir esta atividade."
        });
    }

    buscarAtividadePorId(id, (erroBusca, atividade) => {

        if (erroBusca) {
            console.error(
                "❌ Erro ao buscar atividade:",
                erroBusca
            );

            return res.status(500).json({
                mensagem: "Erro ao excluir atividade."
            });
        }

        if (!atividade) {
            return res.status(404).json({
                mensagem: "Atividade não encontrada."
            });
        }

        if (Number(atividade.usuario_id) !== usuarioId) {
            return res.status(403).json({
                mensagem: "Esta atividade não pertence a este usuário."
            });
        }

        excluirAtividade(id, (erro, resultado) => {

            if (erro) {
                console.error(
                    "❌ Erro ao excluir atividade:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao excluir atividade."
                });
            }

            if (resultado.changes === 0) {
                return res.status(404).json({
                    mensagem: "Atividade não encontrada."
                });
            }

            return res.status(200).json({
                mensagem: "Atividade excluída com sucesso."
            });
        });
    });
}


// =====================================================
// EXCLUIR TODAS AS ATIVIDADES DE UMA ORIGEM
// (ex.: "apagar plano automático")
// =====================================================

function excluirPorOrigem(req, res) {

    const usuarioId = Number(req.params.usuarioId);
    const origem = req.params.origem;

    if (!usuarioId || !origem) {
        return res.status(400).json({
            mensagem: "Dados inválidos."
        });
    }

    if (!usuarioPodeAcessar(req, usuarioId)) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para alterar este cronograma."
        });
    }

    excluirAtividadesPorOrigem(usuarioId, origem, (erro, resultado) => {

        if (erro) {
            console.error(
                "❌ Erro ao excluir atividades por origem:",
                erro
            );

            return res.status(500).json({
                mensagem: "Erro ao excluir as atividades."
            });
        }

        return res.status(200).json({
            mensagem: "Atividades excluídas com sucesso.",
            removidas: resultado.changes
        });
    });
}


module.exports = {
    listar,
    criar,
    criarEmLote,
    atualizar,
    excluir,
    excluirPorOrigem
};