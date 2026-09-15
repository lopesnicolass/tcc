const db = require("../config/db");

function criarPagina(topicoId, titulo, descricao, callback) {
    const sql = `
        INSERT INTO paginas_conteudo
        (
            topico_id,
            titulo,
            descricao
        )
        VALUES (?, ?, ?)
    `;

    db.run(
        sql,
        [
            topicoId,
            titulo,
            descricao || ""
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            buscarPaginaPorId(
                this.lastID,
                callback
            );
        }
    );
}

function listarPaginas(callback) {
    db.all(
        `
            SELECT
                p.id,
                p.topico_id,
                p.titulo,
                p.descricao,
                p.publicado,
                p.created_at,
                p.updated_at,
                t.nome AS topico,
                m.id AS materia_id,
                m.nome AS materia
            FROM paginas_conteudo p
            INNER JOIN topicos t
                ON t.id = p.topico_id
            INNER JOIN materias m
                ON m.id = t.materia_id
            ORDER BY
                m.ordem ASC,
                t.ordem ASC,
                p.id ASC
        `,
        [],
        callback
    );
}

function buscarPaginaPorId(id, callback) {
    db.get(
        `
            SELECT
                p.id,
                p.topico_id,
                p.titulo,
                p.descricao,
                p.publicado,
                p.created_at,
                p.updated_at,
                t.nome AS topico,
                m.id AS materia_id,
                m.nome AS materia
            FROM paginas_conteudo p
            INNER JOIN topicos t
                ON t.id = p.topico_id
            INNER JOIN materias m
                ON m.id = t.materia_id
            WHERE p.id = ?
        `,
        [id],
        callback
    );
}

function buscarPaginaPorTopico(topicoId, callback) {
    db.get(
        `
            SELECT
                p.id,
                p.topico_id,
                p.titulo,
                p.descricao,
                p.publicado,
                p.created_at,
                p.updated_at,
                t.nome AS topico,
                m.id AS materia_id,
                m.nome AS materia
            FROM paginas_conteudo p
            INNER JOIN topicos t
                ON t.id = p.topico_id
            INNER JOIN materias m
                ON m.id = t.materia_id
            WHERE p.topico_id = ?
        `,
        [topicoId],
        callback
    );
}

function atualizarPagina(id, dados, callback) {
    db.get(
        `
            SELECT *
            FROM paginas_conteudo
            WHERE id = ?
        `,
        [id],
        (erro, atual) => {
            if (erro) {
                return callback(erro);
            }

            if (!atual) {
                return callback(null, null);
            }

            const titulo =
                dados.titulo !== undefined
                    ? dados.titulo
                    : atual.titulo;

            const descricao =
                dados.descricao !== undefined
                    ? dados.descricao
                    : atual.descricao;

            const publicado =
                dados.publicado !== undefined
                    ? (dados.publicado ? 1 : 0)
                    : atual.publicado;

            db.run(
                `
                    UPDATE paginas_conteudo
                    SET
                        titulo = ?,
                        descricao = ?,
                        publicado = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                [
                    titulo,
                    descricao,
                    publicado,
                    id
                ],
                (erroUpdate) => {
                    if (erroUpdate) {
                        return callback(erroUpdate);
                    }

                    buscarPaginaPorId(
                        id,
                        callback
                    );
                }
            );
        }
    );
}

function excluirPagina(id, callback) {
    db.run(
        `
            DELETE FROM paginas_conteudo
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
// BLOCOS
// =====================================================

function criarBloco(
    paginaId,
    tipo,
    ordem,
    dados,
    callback
) {
    const sql = `
        INSERT INTO blocos_conteudo
        (
            pagina_id,
            tipo,
            ordem,
            dados
        )
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            paginaId,
            tipo,
            ordem || 0,
            JSON.stringify(dados || {})
        ],
        function (erro) {
            if (erro) {
                return callback(erro);
            }

            buscarBlocoPorId(
                this.lastID,
                callback
            );
        }
    );
}

function listarBlocos(paginaId, callback) {
    db.all(
        `
            SELECT
                id,
                pagina_id,
                tipo,
                ordem,
                dados,
                ativo,
                created_at,
                updated_at
            FROM blocos_conteudo
            WHERE pagina_id = ?
              AND ativo = 1
            ORDER BY ordem ASC, id ASC
        `,
        [paginaId],
        (erro, blocos) => {
            if (erro) {
                return callback(erro);
            }

            const resultado = (blocos || []).map(
                (bloco) => ({
                    ...bloco,
                    dados: tentarConverterJSON(
                        bloco.dados
                    )
                })
            );

            callback(
                null,
                resultado
            );
        }
    );
}

function buscarBlocoPorId(id, callback) {
    db.get(
        `
            SELECT
                id,
                pagina_id,
                tipo,
                ordem,
                dados,
                ativo,
                created_at,
                updated_at
            FROM blocos_conteudo
            WHERE id = ?
        `,
        [id],
        (erro, bloco) => {
            if (erro) {
                return callback(erro);
            }

            if (bloco) {
                bloco.dados =
                    tentarConverterJSON(
                        bloco.dados
                    );
            }

            callback(
                null,
                bloco
            );
        }
    );
}

function atualizarBloco(
    id,
    dados,
    callback
) {
    db.get(
        `
            SELECT *
            FROM blocos_conteudo
            WHERE id = ?
        `,
        [id],
        (erro, atual) => {
            if (erro) {
                return callback(erro);
            }

            if (!atual) {
                return callback(null, null);
            }

            const tipo =
                dados.tipo !== undefined
                    ? dados.tipo
                    : atual.tipo;

            const ordem =
                dados.ordem !== undefined
                    ? dados.ordem
                    : atual.ordem;

            const conteudo =
                dados.dados !== undefined
                    ? JSON.stringify(
                        dados.dados
                    )
                    : atual.dados;

            const ativo =
                dados.ativo !== undefined
                    ? (dados.ativo ? 1 : 0)
                    : atual.ativo;

            db.run(
                `
                    UPDATE blocos_conteudo
                    SET
                        tipo = ?,
                        ordem = ?,
                        dados = ?,
                        ativo = ?,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                [
                    tipo,
                    ordem,
                    conteudo,
                    ativo,
                    id
                ],
                (erroUpdate) => {
                    if (erroUpdate) {
                        return callback(
                            erroUpdate
                        );
                    }

                    buscarBlocoPorId(
                        id,
                        callback
                    );
                }
            );
        }
    );
}

function excluirBloco(id, callback) {
    db.run(
        `
            DELETE FROM blocos_conteudo
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

function tentarConverterJSON(valor) {
    try {
        return JSON.parse(valor);
    } catch {
        return {};
    }
}

module.exports = {
    criarPagina,
    listarPaginas,
    buscarPaginaPorId,
    buscarPaginaPorTopico,
    atualizarPagina,
    excluirPagina,

    criarBloco,
    listarBlocos,
    buscarBlocoPorId,
    atualizarBloco,
    excluirBloco
};