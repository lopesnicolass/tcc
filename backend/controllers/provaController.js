const {
    criarProva,
    listarProvas,
    buscarProvaPorId,
    excluirProva
} = require("../models/provaModel");


// =====================================================
// CRIAR PROVA
// =====================================================

function cadastrarProva(req, res) {

    const {
        ano,
        titulo
    } = req.body;

    const arquivoProva = req.files?.arquivo_prova?.[0];
    const arquivoGabarito = req.files?.arquivo_gabarito?.[0];

    if (!ano || !titulo) {
        return res.status(400).json({
            mensagem: "Ano e título são obrigatórios."
        });
    }

    if (!arquivoProva || !arquivoGabarito) {
        return res.status(400).json({
            mensagem: "É necessário enviar a prova e o gabarito em PDF."
        });
    }

    criarProva(
        ano,
        titulo,
        arquivoProva.filename,
        arquivoGabarito.filename,
        (erro, id) => {

            if (erro) {
                console.error(erro);

                return res.status(500).json({
                    mensagem: "Erro ao cadastrar prova."
                });
            }

            return res.status(201).json({
                mensagem: "Prova cadastrada com sucesso!",
                id: id
            });
        }
    );
}


// =====================================================
// LISTAR PROVAS
// =====================================================

function listarTodasProvas(req, res) {

    listarProvas((erro, provas) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao listar provas."
            });
        }

        return res.status(200).json({
            provas: provas
        });
    });
}


// =====================================================
// BUSCAR PROVA POR ID
// =====================================================

function buscarUmaProva(req, res) {

    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "ID da prova inválido."
        });
    }

    buscarProvaPorId(id, (erro, prova) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao buscar prova."
            });
        }

        if (!prova) {
            return res.status(404).json({
                mensagem: "Prova não encontrada."
            });
        }

        return res.status(200).json(prova);
    });
}


// =====================================================
// EXCLUIR PROVA
// =====================================================

function deletarProva(req, res) {

    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "ID da prova inválido."
        });
    }

    excluirProva(id, (erro, alterados) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao excluir prova."
            });
        }

        if (alterados === 0) {
            return res.status(404).json({
                mensagem: "Prova não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Prova excluída com sucesso!"
        });
    });
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
    cadastrarProva,
    listarTodasProvas,
    buscarUmaProva,
    deletarProva
};