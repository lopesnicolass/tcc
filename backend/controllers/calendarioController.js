const {
    listarDatasImportantes,
    buscarProximoVestibulinho,
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

// Horario e link sao opcionais; URLs arbitrarias ou scripts nao sao aceitos.
function validarHorario(horario) {
    return !horario || /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
}
function validarLink(link) {
    if (!link) return true;
    if (link.length > 2000) return false;
    try {
        const url = new URL(link);
        return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname);
    } catch {
        return false;
    }
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
    const horario = normalizarTexto(req.body.horario);
    const link = normalizarTexto(req.body.link);

    if (!titulo || !data) {
        return res.status(400).json({
            mensagem: "Informe o título e a data da data importante."
        });
    }

    if (!validarData(data)) {
        return res.status(400).json({ mensagem: "Informe uma data válida." });
    }

    if (!validarHorario(horario)) return res.status(400).json({ mensagem: "Informe um horário válido (HH:mm)." });
    if (!validarLink(link)) return res.status(400).json({ mensagem: "Informe um link HTTP(S) válido." });

    criarDataImportante({ titulo, tipo, data, descricao, horario, link }, (erro, resultado) => {
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
    if (req.body.horario !== undefined) {
        dados.horario = normalizarTexto(req.body.horario);
        if (!validarHorario(dados.horario)) return res.status(400).json({ mensagem: "Informe um horário válido (HH:mm)." });
    }
    if (req.body.link !== undefined) {
        dados.link = normalizarTexto(req.body.link);
        if (!validarLink(dados.link)) return res.status(400).json({ mensagem: "Informe um link HTTP(S) válido." });
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


// Endpoint público usado pela landing e pela Home; não retorna as demais datas.
function proximoVestibulinho(req, res) {
    // Data civil de São Paulo, independente da configuração de fuso do servidor.
    const hoje = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date()).split('/').reverse().join('-');

    buscarProximoVestibulinho(hoje, (erro, prova) => {
        if (erro) {
            console.error('Erro ao consultar a data do Vestibulinho:', erro);
            return res.status(500).json({ mensagem: 'Não foi possível consultar a data do Vestibulinho.' });
        }
        return res.json({ data: prova?.data || null });
    });
}

module.exports = { listar, criar, atualizar, excluir, proximoVestibulinho };
