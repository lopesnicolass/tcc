const db = require("../config/db");

// =====================================================
// LISTAR MATÉRIAS
// =====================================================

function listarMaterias(callback) {
    const sql = `
        SELECT
            id,
            nome,
            slug,
            icone,
            cor,
            descricao,
            ativa,
            ordem,
            created_at,
            updated_at
        FROM materias
        ORDER BY
            ordem ASC,
            nome ASC
    `;

    db.all(
        sql,
        [],
        (erro, materias) => {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                materias || []
            );
        }
    );
}

// =====================================================
// BUSCAR MATÉRIA
// =====================================================

function buscarMateriaPorId(id, callback) {
    db.get(
        `
            SELECT
                id,
                nome,
                slug,
                icone,
                cor,
                descricao,
                ativa,
                ordem,
                created_at,
                updated_at
            FROM materias
            WHERE id = ?
        `,
        [id],
        (erro, materia) => {
            if (erro) {
                return callback(erro);
            }

            if (!materia) {
                return callback(null, null);
            }

            db.all(
                `
                    SELECT
                        id,
                        materia_id,
                        nome,
                        descricao,
                        ordem,
                        ativo,
                        created_at,
                        updated_at
                    FROM topicos
                    WHERE materia_id = ?
                    ORDER BY
                        ordem ASC,
                        id ASC
                `,
                [id],
                (erroTopicos, topicos) => {
                    if (erroTopicos) {
                        return callback(
                            erroTopicos
                        );
                    }

                    materia.topicos =
                        topicos || [];

                    callback(
                        null,
                        materia
                    );
                }
            );
        }
    );
}

// =====================================================
// CRIAR MATÉRIA
// =====================================================

function criarMateria(dados, callback) {
    const {
        nome,
        slug,
        icone = "book",
        cor = "#2196F3",
        descricao = "",
        ativa = 1,
        ordem = 0
    } = dados;

    db.run(
        `
            INSERT INTO materias
            (
                nome,
                slug,
                icone,
                cor,
                descricao,
                ativa,
                ordem
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            nome,
            slug,
            icone || "book",
            cor || "#2196F3",
            descricao || "",
            ativa ? 1 : 0,
            Number(ordem) || 0
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            buscarMateriaPorId(
                this.lastID,
                callback
            );
        }
    );
}

// =====================================================
// ATUALIZAR MATÉRIA
// =====================================================

function atualizarMateria(
    id,
    dados,
    callback
) {
    db.get(
        `
            SELECT *
            FROM materias
            WHERE id = ?
        `,
        [id],
        (erro, atual) => {
            if (erro) {
                return callback(erro);
            }

            if (!atual) {
                return callback(
                    null,
                    null
                );
            }

            const nome =
                dados.nome !== undefined
                    ? dados.nome
                    : atual.nome;

            const slug =
                dados.slug !== undefined
                    ? dados.slug
                    : atual.slug;

            const icone =
                dados.icone !== undefined
                    ? dados.icone
                    : atual.icone;

            const cor =
                dados.cor !== undefined
                    ? dados.cor
                    : atual.cor;

            const descricao =
                dados.descricao !== undefined
                    ? dados.descricao
                    : atual.descricao;

            const ativa =
                dados.ativa !== undefined
                    ? (
                        dados.ativa
                            ? 1
                            : 0
                    )
                    : atual.ativa;

            const ordem =
                dados.ordem !== undefined
                    ? Number(dados.ordem) || 0
                    : atual.ordem;

            db.run(
                `
                    UPDATE materias
                    SET
                        nome = ?,
                        slug = ?,
                        icone = ?,
                        cor = ?,
                        descricao = ?,
                        ativa = ?,
                        ordem = ?,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                [
                    nome,
                    slug,
                    icone,
                    cor,
                    descricao,
                    ativa,
                    ordem,
                    id
                ],
                (erroUpdate) => {
                    if (erroUpdate) {
                        return callback(
                            erroUpdate
                        );
                    }

                    buscarMateriaPorId(
                        id,
                        callback
                    );
                }
            );
        }
    );
}

// =====================================================
// EXCLUIR MATÉRIA
// =====================================================

function excluirMateria(id, callback) {
    db.run(
        `
            DELETE FROM materias
            WHERE id = ?
        `,
        [id],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this.changes > 0
            );
        }
    );
}

// =====================================================
// CRIAR TÓPICO
// =====================================================

function criarTopico(dados, callback) {
    const {
        materia_id,
        nome,
        descricao = "",
        ordem = 0,
        ativo = 1
    } = dados;

    db.get(
        `
            SELECT id
            FROM materias
            WHERE id = ?
        `,
        [materia_id],
        (erro, materia) => {
            if (erro) {
                return callback(erro);
            }

            if (!materia) {
                const erroMateria =
                    new Error(
                        "Matéria não encontrada."
                    );

                erroMateria.code =
                    "MATERIA_NOT_FOUND";

                return callback(
                    erroMateria
                );
            }

            db.run(
                `
                    INSERT INTO topicos
                    (
                        materia_id,
                        nome,
                        descricao,
                        ordem,
                        ativo
                    )
                    VALUES (?, ?, ?, ?, ?)
                `,
                [
                    materia_id,
                    nome,
                    descricao || "",
                    Number(ordem) || 0,
                    ativo ? 1 : 0
                ],
                function (erroInsert) {
                    if (erroInsert) {
                        return callback(
                            erroInsert
                        );
                    }

                    db.get(
                        `
                            SELECT *
                            FROM topicos
                            WHERE id = ?
                        `,
                        [this.lastID],
                        callback
                    );
                }
            );
        }
    );
}

// =====================================================
// ATUALIZAR TÓPICO
// =====================================================

function atualizarTopico(
    id,
    dados,
    callback
) {
    db.get(
        `
            SELECT *
            FROM topicos
            WHERE id = ?
        `,
        [id],
        (erro, atual) => {
            if (erro) {
                return callback(erro);
            }

            if (!atual) {
                return callback(
                    null,
                    null
                );
            }

            const nome =
                dados.nome !== undefined
                    ? dados.nome
                    : atual.nome;

            const descricao =
                dados.descricao !== undefined
                    ? dados.descricao
                    : atual.descricao;

            const ordem =
                dados.ordem !== undefined
                    ? Number(dados.ordem) || 0
                    : atual.ordem;

            const ativo =
                dados.ativo !== undefined
                    ? (
                        dados.ativo
                            ? 1
                            : 0
                    )
                    : atual.ativo;

            db.run(
                `
                    UPDATE topicos
                    SET
                        nome = ?,
                        descricao = ?,
                        ordem = ?,
                        ativo = ?,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                [
                    nome,
                    descricao,
                    ordem,
                    ativo,
                    id
                ],
                (erroUpdate) => {
                    if (erroUpdate) {
                        return callback(
                            erroUpdate
                        );
                    }

                    db.get(
                        `
                            SELECT *
                            FROM topicos
                            WHERE id = ?
                        `,
                        [id],
                        callback
                    );
                }
            );
        }
    );
}

// =====================================================
// EXCLUIR TÓPICO
// =====================================================

function excluirTopico(
    id,
    callback
) {
    db.run(
        `
            DELETE FROM topicos
            WHERE id = ?
        `,
        [id],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this.changes > 0
            );
        }
    );
}

// =====================================================
// LISTAR TUDO
// =====================================================

function listarConteudos(callback) {
    listarMaterias(
        (erro, materias) => {
            if (erro) {
                return callback(erro);
            }

            if (!materias.length) {
                return callback(
                    null,
                    []
                );
            }

            const resultado =
                new Array(
                    materias.length
                );

            let concluidas = 0;
            let primeiroErro = null;

            materias.forEach(
                (materia, index) => {
                    db.all(
                        `
                            SELECT
                                id,
                                materia_id,
                                nome,
                                descricao,
                                ordem,
                                ativo,
                                created_at,
                                updated_at
                            FROM topicos
                            WHERE materia_id = ?
                            ORDER BY
                                ordem ASC,
                                id ASC
                        `,
                        [materia.id],
                        (
                            erroTopicos,
                            topicos
                        ) => {
                            if (
                                erroTopicos &&
                                !primeiroErro
                            ) {
                                primeiroErro =
                                    erroTopicos;
                            }

                            resultado[index] = {
                                ...materia,
                                topicos:
                                    erroTopicos
                                        ? []
                                        : (
                                            topicos || []
                                        )
                            };

                            concluidas++;

                            if (
                                concluidas ===
                                materias.length
                            ) {
                                if (
                                    primeiroErro
                                ) {
                                    return callback(
                                        primeiroErro
                                    );
                                }

                                callback(
                                    null,
                                    resultado
                                );
                            }
                        }
                    );
                }
            );
        }
    );
}

// =====================================================
// LISTAR PROGRESSO DO USUÁRIO
// =====================================================

function listarConteudosEstudados(
    usuarioId,
    callback
) {
    db.all(
        `
            SELECT
                topico_id,
                estudado,
                data_estudo
            FROM conteudos_estudados
            WHERE usuario_id = ?
              AND estudado = 1
            ORDER BY
                data_estudo DESC,
                topico_id ASC
        `,
        [usuarioId],
        (erro, registros) => {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                registros || []
            );
        }
    );
}

// =====================================================
// MARCAR / DESMARCAR TÓPICO
// =====================================================

function marcarTopicoEstudado(
    usuarioId,
    topicoId,
    estudado,
    callback
) {
    db.get(
        `
            SELECT id
            FROM topicos
            WHERE id = ?
              AND ativo = 1
        `,
        [topicoId],
        (erro, topico) => {
            if (erro) {
                return callback(erro);
            }

            if (!topico) {
                const erroTopico =
                    new Error(
                        "Tópico não encontrado."
                    );

                erroTopico.code =
                    "TOPICO_NOT_FOUND";

                return callback(
                    erroTopico
                );
            }

            db.run(
                `
                    INSERT INTO conteudos_estudados
                    (
                        usuario_id,
                        topico_id,
                        estudado,
                        data_estudo
                    )
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)

                    ON CONFLICT (
                        usuario_id,
                        topico_id
                    )

                    DO UPDATE SET
                        estudado = excluded.estudado,
                        data_estudo =
                            CURRENT_TIMESTAMP
                `,
                [
                    usuarioId,
                    topicoId,
                    estudado ? 1 : 0
                ],
                callback
            );
        }
    );
}

// =====================================================
// LIMPAR PROGRESSO
// =====================================================

function limparConteudosEstudados(
    usuarioId,
    callback
) {
    db.run(
        `
            DELETE FROM conteudos_estudados
            WHERE usuario_id = ?
        `,
        [usuarioId],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            callback(
                null,
                this.changes
            );
        }
    );
}

module.exports = {
    listarMaterias,
    buscarMateriaPorId,
    criarMateria,
    atualizarMateria,
    excluirMateria,
    criarTopico,
    atualizarTopico,
    excluirTopico,
    listarConteudos,
    listarConteudosEstudados,
    marcarTopicoEstudado,
    limparConteudosEstudados
};