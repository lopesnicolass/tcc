const express = require("express");

const {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao
} = require("../controllers/questaoController");

const router = express.Router();


// ============================
// CADASTRAR QUESTÃO
// ============================

router.post("/", cadastrarQuestao);


// ============================
// LISTAR QUESTÕES
// ============================

router.get("/", listarTodasQuestoes);


// ============================
// BUSCAR QUESTÃO POR ID
// ============================

router.get("/:id", buscarQuestao);


// ============================
// EDITAR QUESTÃO
// ============================

router.put("/:id", editarQuestao);


// ============================
// EXCLUIR QUESTÃO
// ============================

router.delete("/:id", deletarQuestao);


module.exports = router;