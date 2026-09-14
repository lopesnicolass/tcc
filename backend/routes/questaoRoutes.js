const express = require("express");

const {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao
} = require("../controllers/questaoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router = express.Router();


// ============================
// CADASTRAR QUESTÃO — ADMIN
// ============================

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    cadastrarQuestao
);


// ============================
// LISTAR QUESTÕES — ADMIN
// (o banco de questões só é usado nas telas
// administrativas de montagem de simulados)
// ============================

router.get(
    "/",
    autenticarToken,
    verificarAdmin,
    listarTodasQuestoes
);


// ============================
// BUSCAR QUESTÃO POR ID — ADMIN
// ============================

router.get(
    "/:id",
    autenticarToken,
    verificarAdmin,
    buscarQuestao
);


// ============================
// EDITAR QUESTÃO — ADMIN
// ============================

router.put(
    "/:id",
    autenticarToken,
    verificarAdmin,
    editarQuestao
);


// ============================
// EXCLUIR QUESTÃO — ADMIN
// ============================

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    deletarQuestao
);


module.exports = router;