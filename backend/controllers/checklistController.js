const checklistModel =
    require("../models/checklistModel");

// =====================================================
// UTILITÁRIOS
// =====================================================

function obterUsuarioId(
    req
) {
    const id =
        Number(
            req.usuario?.id
        );

    if (
        Number.isInteger(id) &&
        id > 0
    ) {
        return id;
    }

    return null;
}

function obterBloco(
    req,
    res,
    blocoId,
    callback
) {
    const usuarioId =
        obterUsuarioId(req);

    if (!usuarioId) {
        return res.status(401).json({
            mensagem:
                "Usuário não autenticado."
        });
    }

    checklistModel.verificarBloco(
        blocoId,
        (
            erro,
            bloco
        ) => {
            if (erro) {
                console.error(
                    "Erro ao verificar checklist:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao verificar checklist."
                });
            }

            if (!bloco) {
                return res.status(404).json({
                    mensagem:
                        "Checklist não encontrado."
                });
            }

            /*
             * Página não publicada:
             * aluno não pode acessar.
             *
             * Administrador pode acessar.
             */

            if (
                req.usuario?.tipo !==
                    "admin" &&
                Number(
                    bloco.publicado
                ) !== 1
            ) {
                return res.status(404).json({
                    mensagem:
                        "Checklist não encontrado."
                });
            }

            callback(
                usuarioId,
                bloco
            );
        }
    );
}

// =====================================================
// LISTAR PROGRESSO
// =====================================================

function listarProgresso(
    req,
    res
) {
    const blocoId =
        Number(
            req.params.blocoId
        );

    if (
        !Number.isInteger(
            blocoId
        ) ||
        blocoId <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID do bloco inválido."
        });
    }

    obterBloco(
        req,
        res,
        blocoId,
        (
            usuarioId
        ) => {
            checklistModel.listarProgresso(
                usuarioId,
                blocoId,
                (
                    erro,
                    itens
                ) => {
                    if (erro) {
                        console.error(
                            "Erro ao listar progresso do checklist:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao carregar o progresso do checklist."
                        });
                    }

                    return res.json({
                        blocoId,

                        itensConcluidos:
                            (
                                itens ||
                                []
                            ).map(
                                (
                                    item
                                ) =>
                                    Number(
                                        item.item_indice
                                    )
                            )
                    });
                }
            );
        }
    );
}

// =====================================================
// ATUALIZAR ITEM
// =====================================================

function atualizarItem(
    req,
    res
) {
    const blocoId =
        Number(
            req.params.blocoId
        );

    const itemIndice =
        Number(
            req.body?.itemIndice
        );

    const concluido =
        Boolean(
            req.body?.concluido
        );

    if (
        !Number.isInteger(
            blocoId
        ) ||
        blocoId <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID do bloco inválido."
        });
    }

    if (
        !Number.isInteger(
            itemIndice
        ) ||
        itemIndice < 0
    ) {
        return res.status(400).json({
            mensagem:
                "Índice do item inválido."
        });
    }

    obterBloco(
        req,
        res,
        blocoId,
        (
            usuarioId
        ) => {
            checklistModel.atualizarItem(
                usuarioId,
                blocoId,
                itemIndice,
                concluido,
                (
                    erro,
                    item
                ) => {
                    if (erro) {
                        console.error(
                            "Erro ao atualizar checklist:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao salvar o item do checklist."
                        });
                    }

                    return res.json({
                        mensagem:
                            "Item atualizado com sucesso.",

                        item
                    });
                }
            );
        }
    );
}

// =====================================================
// LIMPAR PROGRESSO
// =====================================================

function limparProgresso(
    req,
    res
) {
    const blocoId =
        Number(
            req.params.blocoId
        );

    if (
        !Number.isInteger(
            blocoId
        ) ||
        blocoId <= 0
    ) {
        return res.status(400).json({
            mensagem:
                "ID do bloco inválido."
        });
    }

    obterBloco(
        req,
        res,
        blocoId,
        (
            usuarioId
        ) => {
            checklistModel.limparProgresso(
                usuarioId,
                blocoId,
                (
                    erro
                ) => {
                    if (erro) {
                        console.error(
                            "Erro ao limpar checklist:",
                            erro
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao limpar o checklist."
                        });
                    }

                    return res.json({
                        mensagem:
                            "Checklist limpo com sucesso.",

                        itensConcluidos:
                            []
                    });
                }
            );
        }
    );
}

module.exports = {
    listarProgresso,
    atualizarItem,
    limparProgresso
};