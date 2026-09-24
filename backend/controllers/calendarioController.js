const {
    listarDatasImportantes,
    buscarDataImportantePorId,
    criarDataImportante,
    atualizarDataImportante,
    excluirDataImportante
} = require("../models/calendarioModel");

function normalizarTexto(valor) {
    return String(valor || "").trim();
}

function validarData(data) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(data || ""));
}

function listar(req, res) {
    listarDatasImportantes((erro, datas) => {
        if (erro) {
            console.error("Erro ao listar datas importantes:", erro);
            return res.status(500).json({
                mensagem: "Erro ao buscar as datas importantes."
            });
        }
        res.json({ datas });
    });
}

function criar(req, res) {
    const titulo = normalizarTexto(req.body.titulo);
    const tipo = normalizarTexto(req.body.tipo) || "Outro";
    const data = normalizarTexto(req.body.data);
    const descricao = normalizarTexto(req.body.descricao);

    if (!titulo || !data) {
        return res.status(400).json({
            mensagem: "Informe o título e a data da data importante."
        });
    }

    if (!validarData(data)) {
        return res.status(400).json({ mensagem: "Informe uma data válida." });
    }

    criarDataImportante({ titulo, tipo, data, descricao }, (erro, resultado) => {
        if (erro) {
            console.error("Erro ao criar data importante:", erro);
            return res.status(500).json({ mensagem: "Erro ao salvar a data importante." });
        }

        buscarDataImportantePorId(resultado.lastID, (erroBusca, dataCriada) => {
            if (erroBusca) {
                return res.status(201).json({
                    mensagem: "Data importante criada com sucesso.",
                    id: resultado.lastID
                });
            }

            res.status(201).json({
                mensagem: "Data importante criada com sucesso.",
                data: dataCriada
            });
        });
    });
}

function atualizar(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID inválido." });
    }

    const dados = {};

    if (req.body.titulo !== undefined) {
        dados.titulo = normalizarTexto(req.body.titulo);
        if (!dados.titulo) {
            return res.status(400).json({ mensagem: "Informe o título da data importante." });
        }
    }

    if (req.body.tipo !== undefined) {
        dados.tipo = normalizarTexto(req.body.tipo) || "Outro";
    }

    if (req.body.data !== undefined) {
        dados.data = normalizarTexto(req.body.data);
        if (!validarData(dados.data)) {
            return res.status(400).json({ mensagem: "Informe uma data válida." });
        }
    }

    if (req.body.descricao !== undefined) {
        dados.descricao = normalizarTexto(req.body.descricao);
    }

    atualizarDataImportante(id, dados, (erro, resultado) => {
        if (erro) {
            console.error("Erro ao atualizar data importante:", erro);
            return res.status(500).json({ mensagem: "Erro ao atualizar a data importante." });
        }

        if (!resultado.changes) {
            return res.status(404).json({ mensagem: "Data importante não encontrada." });
        }

        buscarDataImportantePorId(id, (erroBusca, dataAtualizada) => {
            if (erroBusca) {
                return res.json({ mensagem: "Data importante atualizada com sucesso." });
            }

            res.json({
                mensagem: "Data importante atualizada com sucesso.",
                data: dataAtualizada
            });
        });
    });
}

function excluir(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID inválido." });
    }

    excluirDataImportante(id, (erro, resultado) => {
        if (erro) {
            console.error("Erro ao excluir data importante:", erro);
            return res.status(500).json({ mensagem: "Erro ao excluir a data importante." });
        }

        if (!resultado.changes) {
            return res.status(404).json({ mensagem: "Data importante não encontrada." });
        }

        res.json({ mensagem: "Data importante excluída com sucesso." });
    });
}

module.exports = { listar, criar, atualizar, excluir };
