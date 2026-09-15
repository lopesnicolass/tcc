const conteudoPaginaModel = require("../models/conteudoPaginaModel");

const TIPOS_BLOCO_VALIDOS = [
    "texto",
    "destaque",
    "video",
    "imagem",
    "pdf",
    "lista",
    "flashcards",
    "questoes",
    "simulado",
    "checklist"
];

function erroBanco(res, erro, mensagem) {
    console.error(mensagem, erro);

    return res.status(500).json({
        erro: mensagem,
        detalhe: erro?.message || undefined
    });
}

// =====================================================
// PÁGINAS
// =====================================================

function listarPaginas(req, res) {
    conteudoPaginaModel.listarPaginas(
        (erro, paginas) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao listar páginas de conteúdo."
                );
            }

            return res.json({
                paginas: paginas || []
            });
        }
    );
}

function buscarPaginaPorId(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            erro: "ID da página inválido."
        });
    }

    conteudoPaginaModel.buscarPaginaPorId(
        id,
        (erro, pagina) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao buscar página de conteúdo."
                );
            }

            if (!pagina) {
                return res.status(404).json({
                    erro: "Página de conteúdo não encontrada."
                });
            }

            conteudoPaginaModel.listarBlocos(
                id,
                (erroBlocos, blocos) => {
                    if (erroBlocos) {
                        return erroBanco(
                            res,
                            erroBlocos,
                            "Erro ao carregar blocos da página."
                        );
                    }

                    return res.json({
                        pagina,
                        blocos: blocos || []
                    });
                }
            );
        }
    );
}

function buscarPaginaPorTopico(req, res) {
    const topicoId = Number(req.params.topicoId);

    if (
        !Number.isInteger(topicoId) ||
        topicoId <= 0
    ) {
        return res.status(400).json({
            erro: "ID do tópico inválido."
        });
    }

    conteudoPaginaModel.buscarPaginaPorTopico(
        topicoId,
        (erro, pagina) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao buscar página do tópico."
                );
            }

            if (!pagina) {
                return res.json({
                    pagina: null,
                    blocos: []
                });
            }

            conteudoPaginaModel.listarBlocos(
                pagina.id,
                (erroBlocos, blocos) => {
                    if (erroBlocos) {
                        return erroBanco(
                            res,
                            erroBlocos,
                            "Erro ao carregar blocos da página."
                        );
                    }

                    return res.json({
                        pagina,
                        blocos: blocos || []
                    });
                }
            );
        }
    );
}

function criarPagina(req, res) {
    const {
        topicoId,
        titulo,
        descricao
    } = req.body || {};

    const idTopico = Number(topicoId);

    if (
        !Number.isInteger(idTopico) ||
        idTopico <= 0
    ) {
        return res.status(400).json({
            erro: "ID do tópico inválido."
        });
    }

    if (
        !titulo ||
        !String(titulo).trim()
    ) {
        return res.status(400).json({
            erro: "O título da página é obrigatório."
        });
    }

    conteudoPaginaModel.buscarPaginaPorTopico(
        idTopico,
        (erroBusca, existente) => {
            if (erroBusca) {
                return erroBanco(
                    res,
                    erroBusca,
                    "Erro ao verificar página existente."
                );
            }

            if (existente) {
                return res.status(409).json({
                    erro: "Este tópico já possui uma página de conteúdo.",
                    pagina: existente
                });
            }

            conteudoPaginaModel.criarPagina(
                idTopico,
                String(titulo).trim(),
                descricao
                    ? String(descricao).trim()
                    : "",
                (erro, pagina) => {
                    if (erro) {
                        return erroBanco(
                            res,
                            erro,
                            "Erro ao criar página de conteúdo."
                        );
                    }

                    return res.status(201).json({
                        mensagem:
                            "Página criada com sucesso.",
                        pagina
                    });
                }
            );
        }
    );
}

function atualizarPagina(req, res) {
    const id = Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID da página inválido."
        });
    }

    const dados = {
        ...(req.body || {})
    };

    if (
        dados.titulo !== undefined &&
        !String(dados.titulo).trim()
    ) {
        return res.status(400).json({
            erro: "O título da página é obrigatório."
        });
    }

    if (
        dados.titulo !== undefined
    ) {
        dados.titulo =
            String(dados.titulo).trim();
    }

    if (
        dados.descricao !== undefined
    ) {
        dados.descricao =
            String(dados.descricao);
    }

    conteudoPaginaModel.atualizarPagina(
        id,
        dados,
        (erro, pagina) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao atualizar página de conteúdo."
                );
            }

            if (!pagina) {
                return res.status(404).json({
                    erro:
                        "Página de conteúdo não encontrada."
                });
            }

            return res.json({
                mensagem:
                    "Página atualizada com sucesso.",
                pagina
            });
        }
    );
}

function excluirPagina(req, res) {
    const id = Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID da página inválido."
        });
    }

    conteudoPaginaModel.excluirPagina(
        id,
        (erro, excluida) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao excluir página de conteúdo."
                );
            }

            if (!excluida) {
                return res.status(404).json({
                    erro:
                        "Página de conteúdo não encontrada."
                });
            }

            return res.json({
                mensagem:
                    "Página excluída com sucesso."
            });
        }
    );
}

// =====================================================
// BLOCOS
// =====================================================

function listarBlocos(req, res) {
    const paginaId = Number(req.params.paginaId);

    if (
        !Number.isInteger(paginaId) ||
        paginaId <= 0
    ) {
        return res.status(400).json({
            erro: "ID da página inválido."
        });
    }

    conteudoPaginaModel.listarBlocos(
        paginaId,
        (erro, blocos) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao listar blocos."
                );
            }

            return res.json({
                blocos: blocos || []
            });
        }
    );
}

function criarBloco(req, res) {
    const paginaId = Number(req.params.paginaId);

    if (
        !Number.isInteger(paginaId) ||
        paginaId <= 0
    ) {
        return res.status(400).json({
            erro: "ID da página inválido."
        });
    }

    const {
        tipo,
        ordem,
        dados
    } = req.body || {};

    if (
        !TIPOS_BLOCO_VALIDOS.includes(tipo)
    ) {
        return res.status(400).json({
            erro: "Tipo de bloco inválido.",
            tipoRecebido: tipo || null,
            tiposPermitidos:
                TIPOS_BLOCO_VALIDOS
        });
    }

    if (
        dados !== undefined &&
        (
            typeof dados !== "object" ||
            dados === null ||
            Array.isArray(dados)
        )
    ) {
        return res.status(400).json({
            erro:
                "Os dados do bloco devem ser um objeto."
        });
    }

    conteudoPaginaModel.buscarPaginaPorId(
        paginaId,
        (erroPagina, pagina) => {
            if (erroPagina) {
                return erroBanco(
                    res,
                    erroPagina,
                    "Erro ao verificar a página."
                );
            }

            if (!pagina) {
                return res.status(404).json({
                    erro:
                        "Página de conteúdo não encontrada."
                });
            }

            conteudoPaginaModel.criarBloco(
                paginaId,
                tipo,
                Number(ordem) || 0,
                dados || {},
                (erro, bloco) => {
                    if (erro) {
                        return erroBanco(
                            res,
                            erro,
                            "Erro ao criar bloco."
                        );
                    }

                    return res.status(201).json({
                        mensagem:
                            "Bloco criado com sucesso.",
                        bloco
                    });
                }
            );
        }
    );
}

function atualizarBloco(req, res) {
    const id = Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID do bloco inválido."
        });
    }

    const dados = {
        ...(req.body || {})
    };

    if (
        dados.tipo !== undefined &&
        !TIPOS_BLOCO_VALIDOS.includes(
            dados.tipo
        )
    ) {
        return res.status(400).json({
            erro: "Tipo de bloco inválido.",
            tipoRecebido: dados.tipo,
            tiposPermitidos:
                TIPOS_BLOCO_VALIDOS
        });
    }

    if (
        dados.dados !== undefined &&
        (
            typeof dados.dados !== "object" ||
            dados.dados === null ||
            Array.isArray(dados.dados)
        )
    ) {
        return res.status(400).json({
            erro:
                "Os dados do bloco devem ser um objeto."
        });
    }

    conteudoPaginaModel.atualizarBloco(
        id,
        dados,
        (erro, bloco) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao atualizar bloco."
                );
            }

            if (!bloco) {
                return res.status(404).json({
                    erro:
                        "Bloco de conteúdo não encontrado."
                });
            }

            return res.json({
                mensagem:
                    "Bloco atualizado com sucesso.",
                bloco
            });
        }
    );
}

function excluirBloco(req, res) {
    const id = Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID do bloco inválido."
        });
    }

    conteudoPaginaModel.excluirBloco(
        id,
        (erro, excluido) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao excluir bloco."
                );
            }

            if (!excluido) {
                return res.status(404).json({
                    erro:
                        "Bloco de conteúdo não encontrado."
                });
            }

            return res.json({
                mensagem:
                    "Bloco excluído com sucesso."
            });
        }
    );
}

module.exports = {
    listarPaginas,
    buscarPaginaPorId,
    buscarPaginaPorTopico,
    criarPagina,
    atualizarPagina,
    excluirPagina,
    listarBlocos,
    criarBloco,
    atualizarBloco,
    excluirBloco
};