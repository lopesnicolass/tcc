const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    cadastrarProva,
    listarTodasProvas,
    buscarUmaProva,
    deletarProva
} = require("../controllers/provaController");

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

        const identificador = Date.now();

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
    storage: storage,
    fileFilter: fileFilter
});


// =====================================================
// CADASTRAR PROVA
// =====================================================

router.post(
    "/",
    upload.fields([
        {
            name: "arquivo_prova",
            maxCount: 1
        },
        {
            name: "arquivo_gabarito",
            maxCount: 1
        }
    ]),
    cadastrarProva
);


// =====================================================
// LISTAR PROVAS
// =====================================================

router.get(
    "/",
    listarTodasProvas
);


// =====================================================
// BUSCAR PROVA
// =====================================================

router.get(
    "/:id",
    buscarUmaProva
);


// =====================================================
// EXCLUIR PROVA
// =====================================================

router.delete(
    "/:id",
    deletarProva
);


module.exports = router;