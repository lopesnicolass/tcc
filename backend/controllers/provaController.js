const fs = require("fs");
const path = require("path");

const {
    criarProva,
    listarProvas,
    buscarProvaPorId,
    excluirProva
} = require("../models/provaModel");


const PASTA_UPLOADS_PROVAS =
    path.join(__dirname, "..", "uploads", "provas");


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
// APAGAR UM ARQUIVO FÍSICO DE FORMA SEGURA
// (nunca derruba a requisição por causa disso —
// só registra no log se der erro)
// =====================================================

function apagarArquivoFisico(nomeArquivo) {

    if (!nomeArquivo) {
        return;
    }

    const caminhoCompleto =
        path.join(PASTA_UPLOADS_PROVAS, nomeArquivo);

    fs.unlink(caminhoCompleto, (erro) => {

        if (erro && erro.code !== "ENOENT") {
            console.error(
                `⚠️ Não foi possível apagar o arquivo ${nomeArquivo}:`,
                erro.message
            );
        }
    });
}


// =====================================================
// EXCLUIR PROVA
// (agora também remove os PDFs físicos da pasta uploads,
// evitando acumular arquivos órfãos)
// =====================================================

function deletarProva(req, res) {

    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({
            mensagem: "ID da prova inválido."
        });
    }

    buscarProvaPorId(id, (erroBusca, prova) => {

        if (erroBusca) {
            console.error(erroBusca);

            return res.status(500).json({
                mensagem: "Erro ao excluir prova."
            });
        }

        if (!prova) {
            return res.status(404).json({
                mensagem: "Prova não encontrada."
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

            apagarArquivoFisico(prova.arquivo_prova);
            apagarArquivoFisico(prova.arquivo_gabarito);

            return res.status(200).json({
                mensagem: "Prova excluída com sucesso!"
            });
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