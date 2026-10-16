const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');

const {
    cadastrarProva,
    listarTodasProvas,
    buscarUmaProva,
    deletarProva
} = require("../controllers/provaController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router = express.Router();


// =====================================================
// CONFIGURAÇÃO DO UPLOAD
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            path.join(__dirname, "..", "uploads", "provas")
        );

    },

    filename: function (req, file, cb) {

        const extensao = path.extname(file.originalname);

        const nomeOriginal = path
            .basename(file.originalname, extensao)
            .replace(/[^a-zA-Z0-9-_]/g, "-");

        const identificador = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

        const nomeArquivo =
            `${identificador}-${file.fieldname}-${nomeOriginal}${extensao}`;

        cb(null, nomeArquivo);

    }

});


// =====================================================
// FILTRO — APENAS PDF
// =====================================================

const fileFilter = function (req, file, cb) {

    const extensao = path
        .extname(file.originalname)
        .toLowerCase();

    if (extensao !== ".pdf") {

        return cb(
            new Error("Apenas arquivos PDF são permitidos.")
        );

    }

    cb(null, true);

};


// =====================================================
// MULTER
// =====================================================

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024, files: 2 }
});

function arquivosEnviados(req) {
    return Object.values(req.files || {}).flat();
}
function removerArquivos(req) {
    for (const arquivo of arquivosEnviados(req)) {
        try { fs.unlinkSync(arquivo.path); } catch (erro) { if (erro.code !== 'ENOENT') console.error(erro); }
    }
}
function validarPDFs(req, res, next) {
    upload.fields([{ name: 'arquivo_prova', maxCount: 1 }, { name: 'arquivo_gabarito', maxCount: 1 }])(req, res, (erro) => {
        if (erro) {
            removerArquivos(req);
            const tamanhoExcedido = erro.code === 'LIMIT_FILE_SIZE';
            return res.status(tamanhoExcedido ? 413 : 400).json({ mensagem: tamanhoExcedido ? 'PDF maior que 15 MB.' : 'Arquivo inválido. Envie apenas PDFs.' });
        }
        try {
            const arquivos = arquivosEnviados(req);
            if (arquivos.length !== 2 || arquivos.some(arquivo => {
                const fd = fs.openSync(arquivo.path, 'r');
                try {
                    const header = Buffer.alloc(5);
                    return fs.readSync(fd, header, 0, 5, 0) !== 5 || header.toString() !== '%PDF-';
                } finally { fs.closeSync(fd); }
            })) {
                removerArquivos(req);
                return res.status(400).json({ mensagem: 'Envie a prova e o gabarito em arquivos PDF válidos.' });
            }
            next();
        } catch (erroLeitura) {
            removerArquivos(req);
            console.error(erroLeitura);
            return res.status(500).json({ mensagem: 'Não foi possível validar os PDFs.' });
        }
    });
}


// =====================================================
// CADASTRAR PROVA — ADMIN
// =====================================================

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    validarPDFs,
    cadastrarProva
);


// =====================================================
// LISTAR PROVAS — PÚBLICO
// (provas de vestibulinhos anteriores, não é dado sensível)
// =====================================================

router.get(
    "/",
    listarTodasProvas
);


// =====================================================
// BUSCAR PROVA — PÚBLICO
// =====================================================

router.get(
    "/:id",
    buscarUmaProva
);


// =====================================================
// EXCLUIR PROVA — ADMIN
// =====================================================

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    deletarProva
);


module.exports = router;