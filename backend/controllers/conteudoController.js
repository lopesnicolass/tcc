const conteudoModel =
    require("../models/conteudoModel");
const { MATERIAS_FIXAS } = require("../utils/materiasFixas");

// =====================================================
// GERAR SLUG
// =====================================================

function gerarSlug(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            "");
}

// =====================================================
// ERRO DO BANCO
// =====================================================

function erroBanco(
    res,
    erro,
    mensagem
) {
    console.error(
        mensagem,
        erro
    );

    if (
        erro &&
        erro.code ===
            "SQLITE_CONSTRAINT"
    ) {
        return res.status(409).json({
            erro:
                "Já existe um registro com esses dados."
        });
    }

    return res.status(500).json({
        erro: mensagem
    });
}

// =====================================================
// LISTAR CONTEÚDOS
// =====================================================

function listar(req, res) {
    conteudoModel.listarConteudos(
        (erro, materias) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao carregar conteúdos."
                );
            }

            return res.json({
                materias
            });
        }
    );
}

// =====================================================
// BUSCAR MATÉRIA
// =====================================================

function buscarMateria(req, res) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro:
                "ID da matéria inválido."
        });
    }

    conteudoModel.buscarMateriaPorId(
        id,
        (erro, materia) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao buscar matéria."
                );
            }

            if (!materia) {
                return res.status(404).json({
                    erro:
                        "Matéria não encontrada."
                });
            }

            return res.json(
                materia
            );
        }
    );
}

// =====================================================
// CRIAR MATÉRIA
// =====================================================

function criarMateria(req, res) {
    return res.status(403).json({
        erro: "As cinco matérias do Tenna já vêm cadastradas. Adicione tópicos a elas."
    });
}

// =====================================================
// ATUALIZAR MATÉRIA
// =====================================================

function atualizarMateria(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID da matéria inválido." });
    }
    conteudoModel.buscarMateriaPorId(id, (erro, atual) => {
        if (erro) return erroBanco(res, erro, "Erro ao buscar matéria.");
        if (!atual) return res.status(404).json({ erro: "Matéria não encontrada." });
        if (!MATERIAS_FIXAS.some((item) => item.slug === atual.slug || item.nome === atual.nome)) {
            return res.status(403).json({ erro: "Esta matéria não pertence ao currículo fixo do Tenna." });
        }
        // O administrador só pode alterar a descrição, nunca a identidade da matéria.
        const descricao = String(req.body?.descricao ?? atual.descricao ?? '').trim().slice(0, 500);
        conteudoModel.atualizarMateria(id, { descricao }, (erroUpdate, materia) => {
            if (erroUpdate) return erroBanco(res, erroUpdate, "Erro ao atualizar descrição da matéria.");
            return res.json({ mensagem: "Descrição atualizada.", materia });
        });
    });
}

// =====================================================
// EXCLUIR MATÉRIA
// =====================================================

function excluirMateria(req, res) {
    return res.status(403).json({
        erro: "As matérias são fixas e não podem ser excluídas. Gerencie os tópicos dentro delas."
    });
}

// =====================================================
// CRIAR TÓPICO
// =====================================================

function criarTopico(
    req,
    res
) {
    const materiaId =
        Number(
            req.params.materiaId
        );

    if (
        !Number.isInteger(
            materiaId
        ) ||
        materiaId <= 0
    ) {
        return res.status(400).json({
            erro:
                "ID da matéria inválido."
        });
    }

    const {
        nome,
        descricao,
        ordem,
        ativo
    } = req.body || {};

    if (
        !nome ||
        !String(nome).trim()
    ) {
        return res.status(400).json({
            erro:
                "O nome do tópico é obrigatório."
        });
    }

    conteudoModel.criarTopico(
        {
            materia_id:
                materiaId,
            nome:
                String(nome).trim(),
            descricao,
            ordem,
            ativo:
                ativo === undefined
                    ? 1
                    : ativo
        },
        (erro, topico) => {
            if (erro) {
                if (
                    erro.code ===
                    "MATERIA_NOT_FOUND"
                ) {
                    return res.status(404).json({
                        erro:
                            "Matéria não encontrada."
                    });
                }

                return erroBanco(
                    res,
                    erro,
                    "Erro ao criar tópico."
                );
            }

            return res.status(201).json({
                mensagem:
                    "Tópico criado com sucesso.",
                topico
            });
        }
    );
}

// =====================================================
// ATUALIZAR TÓPICO
// =====================================================

function atualizarTopico(
    req,
    res
) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro:
                "ID do tópico inválido."
        });
    }

    const dados = {
        ...(req.body || {})
    };

    if (
        dados.nome !== undefined
    ) {
        dados.nome =
            String(
                dados.nome
            ).trim();

        if (!dados.nome) {
            return res.status(400).json({
                erro:
                    "O nome do tópico é obrigatório."
            });
        }
    }

    conteudoModel.atualizarTopico(
        id,
        dados,
        (erro, topico) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao atualizar tópico."
                );
            }

            if (!topico) {
                return res.status(404).json({
                    erro:
                        "Tópico não encontrado."
                });
            }

            return res.json({
                mensagem:
                    "Tópico atualizado com sucesso.",
                topico
            });
        }
    );
}

// =====================================================
// EXCLUIR TÓPICO
// =====================================================

function excluirTopico(
    req,
    res
) {
    const id =
        Number(
            req.params.id
        );

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).json({
            erro:
                "ID do tópico inválido."
        });
    }

    conteudoModel.excluirTopico(
        id,
        (erro, excluido) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao excluir tópico."
                );
            }

            if (!excluido) {
                return res.status(404).json({
                    erro:
                        "Tópico não encontrado."
                });
            }

            return res.json({
                mensagem:
                    "Tópico excluído com sucesso."
            });
        }
    );
}

// =====================================================
// LISTAR CONTEÚDOS PÚBLICOS
// =====================================================

function listarPublico(
    req,
    res
) {
    conteudoModel.listarConteudos(
        (erro, materias) => {
            if (erro) {
                console.error(
                    "Erro ao listar conteúdos públicos:",
                    erro
                );

                return res.status(500).json({
                    erro:
                        "Erro ao carregar conteúdos."
                });
            }

            const materiasAtivas =
                (
                    materias || []
                )
                    .filter(
                        (materia) =>
                            Number(
                                materia.ativa
                            ) === 1
                    )
                    .map(
                        (materia) => ({
                            ...materia,

                            topicos:
                                (
                                    materia.topicos ||
                                    []
                                ).filter(
                                    (topico) =>
                                        Number(
                                            topico.ativo
                                        ) === 1
                                )
                        })
                    );

            return res.json({
                materias:
                    materiasAtivas
            });
        }
    );
}

// =====================================================
// LISTAR PROGRESSO DO USUÁRIO
// =====================================================

function listarProgresso(
    req,
    res
) {
    const usuarioId =
        Number(
            req.usuario.id
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {
        return res.status(401).json({
            erro:
                "Usuário não identificado."
        });
    }

    conteudoModel.listarConteudosEstudados(
        usuarioId,
        (erro, topicos) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao carregar o progresso."
                );
            }

            return res.json({
                topicos:
                    topicos || []
            });
        }
    );
}

// =====================================================
// MARCAR TÓPICO COMO ESTUDADO
// =====================================================

function atualizarProgresso(
    req,
    res
) {
    const usuarioId =
        Number(
            req.usuario.id
        );

    const topicoId =
        Number(
            req.params.topicoId
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {
        return res.status(401).json({
            erro:
                "Usuário não identificado."
        });
    }

    if (
        !Number.isInteger(topicoId) ||
        topicoId <= 0
    ) {
        return res.status(400).json({
            erro:
                "ID do tópico inválido."
        });
    }

    const estudado =
        Boolean(
            req.body?.estudado
        );

    conteudoModel.marcarTopicoEstudado(
        usuarioId,
        topicoId,
        estudado,
        (erro) => {
            if (erro) {
                if (
                    erro.code ===
                    "TOPICO_NOT_FOUND"
                ) {
                    return res.status(404).json({
                        erro:
                            "Tópico não encontrado."
                    });
                }

                return erroBanco(
                    res,
                    erro,
                    "Erro ao salvar o progresso."
                );
            }

            return res.json({
                mensagem:
                    estudado
                        ? "Tópico marcado como estudado."
                        : "Tópico desmarcado.",
                topico_id:
                    topicoId,
                estudado
            });
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
    const usuarioId =
        Number(
            req.usuario.id
        );

    if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
    ) {
        return res.status(401).json({
            erro:
                "Usuário não identificado."
        });
    }

    conteudoModel.limparConteudosEstudados(
        usuarioId,
        (erro) => {
            if (erro) {
                return erroBanco(
                    res,
                    erro,
                    "Erro ao limpar o progresso."
                );
            }

            return res.json({
                mensagem:
                    "Progresso dos conteúdos limpo com sucesso."
            });
        }
    );
}

module.exports = {
    listar,
    listarPublico,
    buscarMateria,
    criarMateria,
    atualizarMateria,
    excluirMateria,
    criarTopico,
    atualizarTopico,
    excluirTopico,
    listarProgresso,
    atualizarProgresso,
    limparProgresso
};