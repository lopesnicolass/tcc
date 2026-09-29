const {
    listarAtividades,
    buscarAtividadePorId,
    criarAtividade,
    salvarAtividadesEmLote,
    atualizarAtividade,
    excluirAtividade,
    excluirAtividadesPorOrigem
} = require("../models/cronogramaModel");


// =====================================================
// FORMATAR ATIVIDADE PARA O FRONTEND
// =====================================================

function formatarAtividade(linha) {

    return {
        id: Number(linha.id),

        data: linha.data,

        horario: linha.horario,

        nome: linha.nome,

        materia: linha.materia,

        done: Boolean(
            linha.concluida
        ),

        origem:
            linha.origem || null,

        topicoId:
            linha.topico_id
                ? Number(linha.topico_id)
                : null
    };
}


// =====================================================
// VERIFICAR ACESSO
// =====================================================

function usuarioPodeAcessar(
    req,
    usuarioId
) {

    if (!req.usuario) {
        return false;
    }


    if (
        req.usuario.tipo ===
        "admin"
    ) {
        return true;
    }


    return (
        Number(req.usuario.id) ===
        usuarioId
    );
}


// =====================================================
// VALIDAR DATA
// =====================================================

function dataValida(data) {

    if (
        typeof data !==
        "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            data
        )
    ) {
        return false;
    }


    const [
        ano,
        mes,
        dia
    ] =
        data
            .split("-")
            .map(Number);


    const objeto =
        new Date(
            Date.UTC(
                ano,
                mes - 1,
                dia
            )
        );


    return (
        objeto.getUTCFullYear() ===
            ano &&
        objeto.getUTCMonth() ===
            mes - 1 &&
        objeto.getUTCDate() ===
            dia
    );
}


// =====================================================
// VALIDAR HORÁRIO
// =====================================================

function horarioValido(
    horario
) {

    if (
        typeof horario !==
        "string" ||
        !/^\d{2}:\d{2}$/.test(
            horario
        )
    ) {
        return false;
    }


    const [
        hora,
        minuto
    ] =
        horario
            .split(":")
            .map(Number);


    return (
        hora >= 0 &&
        hora <= 23 &&
        minuto >= 0 &&
        minuto <= 59
    );
}


// =====================================================
// VALIDAR ATIVIDADE
// =====================================================

function validarAtividade(
    dados,
    exigirTudo = true
) {

    if (exigirTudo) {

        if (
            !dados ||
            !dados.nome ||
            !String(
                dados.nome
            ).trim() ||
            !dados.materia ||
            !String(
                dados.materia
            ).trim() ||
            !dados.data ||
            !dados.horario
        ) {

            return (
                "Preencha nome, matéria, data e horário."
            );
        }
    }


    if (
        dados.nome !==
        undefined
    ) {

        const nome =
            String(
                dados.nome
            ).trim();


        if (!nome) {
            return (
                "O nome da atividade não pode ficar vazio."
            );
        }


        if (
            nome.length >
            200
        ) {

            return (
                "O nome da atividade é muito longo."
            );
        }
    }


    if (
        dados.materia !==
        undefined
    ) {

        const materia =
            String(
                dados.materia
            ).trim();


        if (!materia) {
            return (
                "A matéria não pode ficar vazia."
            );
        }
    }


    if (
        dados.data !==
        undefined &&
        !dataValida(
            dados.data
        )
    ) {

        return (
            "Data inválida. Use o formato AAAA-MM-DD."
        );
    }


    if (
        dados.horario !==
        undefined &&
        !horarioValido(
            dados.horario
        )
    ) {

        return (
            "Horário inválido. Use o formato HH:MM."
        );
    }


    return null;
}


// =====================================================
// PREPARAR ATIVIDADE
// =====================================================

function prepararAtividade(
    atividade
) {

    return {

        nome:
            String(
                atividade.nome
            ).trim(),

        materia:
            String(
                atividade.materia
            ).trim(),

        data:
            atividade.data,

        horario:
            atividade.horario ||
            "08:00",

        concluida:
            Boolean(
                atividade.done
            ),

        origem:
            atividade.origem
                ? String(
                      atividade.origem
                  ).trim()
                : null,

        topicoId:
            atividade.topicoId
                ? Number(
                      atividade.topicoId
                  )
                : null
    };
}


// =====================================================
// LISTAR
// =====================================================

function listar(req, res) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );


    if (!usuarioId) {

        return res.status(400).json({
            mensagem:
                "Usuário inválido."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para ver este cronograma."
        });
    }


    listarAtividades(
        usuarioId,
        (erro, linhas) => {

            if (erro) {

                console.error(
                    "❌ Erro ao listar cronograma:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao buscar o cronograma."
                });
            }


            return res.json({

                atividades:
                    (
                        linhas || []
                    ).map(
                        formatarAtividade
                    )

            });
        }
    );
}


// =====================================================
// CRIAR
// =====================================================

function criar(req, res) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );


    if (!usuarioId) {

        return res.status(400).json({
            mensagem:
                "Usuário inválido."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para criar atividades neste cronograma."
        });
    }


    const dados =
        req.body || {};


    const erroValidacao =
        validarAtividade(
            dados,
            true
        );


    if (erroValidacao) {

        return res.status(400).json({
            mensagem:
                erroValidacao
        });
    }


    const atividade =
        prepararAtividade(
            dados
        );


    criarAtividade(
        usuarioId,
        atividade,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao criar atividade:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao criar atividade."
                });
            }


            return res.status(201).json({

                mensagem:
                    "Atividade criada com sucesso!",

                atividade: {

                    id:
                        resultado.lastID,

                    data:
                        atividade.data,

                    horario:
                        atividade.horario,

                    nome:
                        atividade.nome,

                    materia:
                        atividade.materia,

                    done:
                        atividade.concluida,

                    origem:
                        atividade.origem,

                    topicoId:
                        atividade.topicoId
                }
            });
        }
    );
}


// =====================================================
// CRIAR VÁRIAS
// =====================================================

function criarEmLote(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );


    if (!usuarioId) {

        return res.status(400).json({
            mensagem:
                "Usuário inválido."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para alterar este cronograma."
        });
    }


    const {
        atividades,
        substituirOrigem
    } =
        req.body || {};


    if (
        !Array.isArray(
            atividades
        ) ||
        !atividades.length
    ) {

        return res.status(400).json({
            mensagem:
                "Informe ao menos uma atividade."
        });
    }


    const atividadesPreparadas =
        [];


    for (
        const atividade
        of atividades
    ) {

        const erroValidacao =
            validarAtividade(
                atividade,
                true
            );


        if (erroValidacao) {

            return res.status(400).json({
                mensagem:
                    erroValidacao
            });
        }


        atividadesPreparadas.push(
            prepararAtividade(
                atividade
            )
        );
    }


    const origem =
        substituirOrigem ===
            null ||
        substituirOrigem ===
            undefined ||
        substituirOrigem ===
            ""
            ? null
            : String(
                  substituirOrigem
              ).trim();


    salvarAtividadesEmLote(
        usuarioId,
        atividadesPreparadas,
        origem,
        (erro) => {

            if (erro) {

                console.error(
                    "❌ Erro ao salvar atividades em lote:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao salvar as atividades."
                });
            }


            listarAtividades(
                usuarioId,
                (
                    erroListar,
                    linhas
                ) => {

                    if (
                        erroListar
                    ) {

                        console.error(
                            "❌ Erro ao recarregar cronograma:",
                            erroListar
                        );

                        return res.status(500).json({
                            mensagem:
                                "Atividades salvas, mas houve erro ao recarregar o cronograma."
                        });
                    }


                    return res.status(201).json({

                        mensagem:
                            origem
                                ? "Atividades substituídas no cronograma!"
                                : "Atividades adicionadas ao cronograma!",

                        atividades:
                            (
                                linhas ||
                                []
                            ).map(
                                formatarAtividade
                            )

                    });
                }
            );
        }
    );
}


// =====================================================
// ATUALIZAR
// =====================================================

function atualizar(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );

    const id =
        Number(
            req.params.id
        );


    if (
        !usuarioId ||
        !id
    ) {

        return res.status(400).json({
            mensagem:
                "Dados inválidos."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para editar esta atividade."
        });
    }


    const dados =
        req.body || {};


    const erroValidacao =
        validarAtividade(
            dados,
            false
        );


    if (erroValidacao) {

        return res.status(400).json({
            mensagem:
                erroValidacao
        });
    }


    buscarAtividadePorId(
        id,
        (
            erroBusca,
            atividade
        ) => {

            if (erroBusca) {

                console.error(
                    "❌ Erro ao buscar atividade:",
                    erroBusca
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao atualizar atividade."
                });
            }


            if (!atividade) {

                return res.status(404).json({
                    mensagem:
                        "Atividade não encontrada."
                });
            }


            if (
                Number(
                    atividade.usuario_id
                ) !==
                usuarioId
            ) {

                return res.status(403).json({
                    mensagem:
                        "Esta atividade não pertence a este usuário."
                });
            }


            atualizarAtividade(
                id,
                {
                    nome:
                        dados.nome !==
                        undefined
                            ? String(
                                  dados.nome
                              ).trim()
                            : undefined,

                    materia:
                        dados.materia !==
                        undefined
                            ? String(
                                  dados.materia
                              ).trim()
                            : undefined,

                    data:
                        dados.data,

                    horario:
                        dados.horario,

                    concluida:
                        dados.done !==
                        undefined
                            ? Boolean(
                                  dados.done
                              )
                            : undefined
                },
                (
                    erro,
                    resultado
                ) => {

                    if (erro) {

                        console.error(
                            "❌ Erro ao atualizar atividade:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao atualizar atividade."
                        });
                    }


                    if (
                        resultado.changes ===
                        0
                    ) {

                        return res.status(404).json({
                            mensagem:
                                "Atividade não encontrada."
                        });
                    }


                    buscarAtividadePorId(
                        id,
                        (
                            erroFinal,
                            linhaAtualizada
                        ) => {

                            if (
                                erroFinal ||
                                !linhaAtualizada
                            ) {

                                return res.status(200).json({
                                    mensagem:
                                        "Atividade atualizada com sucesso!"
                                });
                            }


                            return res.status(200).json({

                                mensagem:
                                    "Atividade atualizada com sucesso!",

                                atividade:
                                    formatarAtividade(
                                        linhaAtualizada
                                    )
                            });
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// EXCLUIR
// =====================================================

function excluir(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );

    const id =
        Number(
            req.params.id
        );


    if (
        !usuarioId ||
        !id
    ) {

        return res.status(400).json({
            mensagem:
                "Dados inválidos."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para excluir esta atividade."
        });
    }


    buscarAtividadePorId(
        id,
        (
            erroBusca,
            atividade
        ) => {

            if (erroBusca) {

                console.error(
                    "❌ Erro ao buscar atividade:",
                    erroBusca
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir atividade."
                });
            }


            if (!atividade) {

                return res.status(404).json({
                    mensagem:
                        "Atividade não encontrada."
                });
            }


            if (
                Number(
                    atividade.usuario_id
                ) !==
                usuarioId
            ) {

                return res.status(403).json({
                    mensagem:
                        "Esta atividade não pertence a este usuário."
                });
            }


            excluirAtividade(
                id,
                (
                    erro,
                    resultado
                ) => {

                    if (erro) {

                        console.error(
                            "❌ Erro ao excluir atividade:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao excluir atividade."
                        });
                    }


                    if (
                        resultado.changes ===
                        0
                    ) {

                        return res.status(404).json({
                            mensagem:
                                "Atividade não encontrada."
                        });
                    }


                    return res.status(200).json({
                        mensagem:
                            "Atividade excluída com sucesso."
                    });
                }
            );
        }
    );
}


// =====================================================
// EXCLUIR POR ORIGEM
// =====================================================

function excluirPorOrigem(
    req,
    res
) {

    const usuarioId =
        Number(
            req.params.usuarioId
        );

    const origem =
        String(
            req.params.origem || ""
        ).trim();


    if (
        !usuarioId ||
        !origem
    ) {

        return res.status(400).json({
            mensagem:
                "Dados inválidos."
        });
    }


    if (
        !usuarioPodeAcessar(
            req,
            usuarioId
        )
    ) {

        return res.status(403).json({
            mensagem:
                "Você não tem permissão para alterar este cronograma."
        });
    }


    excluirAtividadesPorOrigem(
        usuarioId,
        origem,
        (
            erro,
            resultado
        ) => {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir atividades por origem:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao remover as atividades."
                });
            }


            return res.json({

                mensagem:
                    "Atividades removidas com sucesso.",

                removidas:
                    resultado.changes ||
                    0

            });
        }
    );
}


module.exports = {
    listar,
    criar,
    criarEmLote,
    atualizar,
    excluir,
    excluirPorOrigem
};