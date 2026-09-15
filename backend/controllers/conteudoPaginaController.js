const model =
    require("../models/conteudoPaginaModel");

function criarPagina(req, res) {
    const {
        topico_id,
        titulo,
        descricao
    } = req.body || {};

    const topicoId = Number(topico_id);

    if (
        !Number.isInteger(topicoId) ||
        topicoId <= 0
    ) {
        return res.status(400).json({
            erro: "Tópico inválido."
        });
    }

    if (
        !titulo ||
        !String(titulo).trim()
    ) {
        return res.status(400).json({
            erro: "O título é obrigatório."
        });
    }

    model.criarPagina(
        topicoId,
        String(titulo).trim(),
        descricao
            ? String(descricao).trim()
            : "",
        (erro, pagina) => {
            if (erro) {
                console.error(
                    "Erro ao criar página:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao criar página de conteúdo."
                });
            }

            return res.status(201).json({
                mensagem:
                    "Página criada com sucesso.",
                pagina
            });
        }
    );
}

function listarPaginas(req, res) {
    model.listarPaginas(
        (erro, paginas) => {
            if (erro) {
                console.error(
                    "Erro ao listar páginas:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao listar páginas."
                });
            }

            return res.json({
                paginas: paginas || []
            });
        }
    );
}

function buscarPagina(req, res) {
    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    model.buscarPaginaPorId(
        id,
        (erro, pagina) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao buscar página."
                });
            }

            if (!pagina) {
                return res.status(404).json({
                    erro:
                        "Página não encontrada."
                });
            }

            model.listarBlocos(
                id,
                (erroBlocos, blocos) => {
                    if (erroBlocos) {
                        return res.status(500).json({
                            erro:
                                "Erro ao carregar blocos."
                        });
                    }

                    return res.json({
                        ...pagina,
                        blocos
                    });
                }
            );
        }
    );
}

function buscarPorTopico(req, res) {
    const topicoId =
        Number(req.params.topicoId);

    if (
        !Number.isInteger(topicoId) ||
        topicoId <= 0
    ) {
        return res.status(400).json({
            erro: "Tópico inválido."
        });
    }

    model.buscarPaginaPorTopico(
        topicoId,
        (erro, pagina) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao buscar conteúdo."
                });
            }

            if (!pagina) {
                return res.status(404).json({
                    erro:
                        "Página de conteúdo não encontrada."
                });
            }

            model.listarBlocos(
                pagina.id,
                (erroBlocos, blocos) => {
                    if (erroBlocos) {
                        return res.status(500).json({
                            erro:
                                "Erro ao carregar conteúdo."
                        });
                    }

                    return res.json({
                        ...pagina,
                        blocos
                    });
                }
            );
        }
    );
}

function atualizarPagina(req, res) {
    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    model.atualizarPagina(
        id,
        req.body || {},
        (erro, pagina) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao atualizar página."
                });
            }

            if (!pagina) {
                return res.status(404).json({
                    erro:
                        "Página não encontrada."
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
    const id =
        Number(req.params.id);

    model.excluirPagina(
        id,
        (erro, excluida) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao excluir página."
                });
            }

            if (!excluida) {
                return res.status(404).json({
                    erro:
                        "Página não encontrada."
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

function criarBloco(req, res) {
    const paginaId =
        Number(req.params.paginaId);

    const {
        tipo,
        ordem,
        dados
    } = req.body || {};

    if (
        !Number.isInteger(paginaId) ||
        paginaId <= 0
    ) {
        return res.status(400).json({
            erro: "Página inválida."
        });
    }

    if (
        !tipo ||
        !String(tipo).trim()
    ) {
        return res.status(400).json({
            erro: "O tipo do bloco é obrigatório."
        });
    }

    model.criarBloco(
        paginaId,
        String(tipo).trim(),
        Number.isInteger(Number(ordem))
            ? Number(ordem)
            : 0,
        dados || {},
        (erro, bloco) => {
            if (erro) {
                console.error(
                    "Erro ao criar bloco:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao criar bloco."
                });
            }

            return res.status(201).json({
                mensagem:
                    "Bloco criado com sucesso.",
                bloco
            });
        }
    );
}

function listarBlocos(req, res) {
    const paginaId =
        Number(req.params.paginaId);

    if (
        !Number.isInteger(paginaId) ||
        paginaId <= 0
    ) {
        return res.status(400).json({
            erro: "Página inválida."
        });
    }

    model.listarBlocos(
        paginaId,
        (erro, blocos) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao listar blocos."
                });
            }

            return res.json({
                blocos
            });
        }
    );
}

function atualizarBloco(req, res) {
    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    model.atualizarBloco(
        id,
        req.body || {},
        (erro, bloco) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao atualizar bloco."
                });
            }

            if (!bloco) {
                return res.status(404).json({
                    erro:
                        "Bloco não encontrado."
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
    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro: "ID inválido."
        });
    }

    model.excluirBloco(
        id,
        (erro, excluido) => {
            if (erro) {
                return res.status(500).json({
                    erro:
                        "Erro ao excluir bloco."
                });
            }

            if (!excluido) {
                return res.status(404).json({
                    erro:
                        "Bloco não encontrado."
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
    criarPagina,
    listarPaginas,
    buscarPagina,
    buscarPorTopico,
    atualizarPagina,
    excluirPagina,

    criarBloco,
    listarBlocos,
    atualizarBloco,
    excluirBloco
};