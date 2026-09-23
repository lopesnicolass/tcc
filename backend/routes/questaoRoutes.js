const express = require("express");

const {
    cadastrarQuestao,
    listarTodasQuestoes,
    buscarQuestao,
    editarQuestao,
    deletarQuestao,
    listarQuestoesDoConteudo,
    corrigirQuestoesDoConteudo
} = require("../controllers/questaoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router = express.Router();


// =====================================================
// ROTAS DO ALUNO
// =====================================================

router.get(
    "/aluno",
    autenticarToken,
    listarQuestoesDoConteudo
);

router.post(
    "/corrigir-bloco",
    autenticarToken,
    corrigirQuestoesDoConteudo
);


// =====================================================
// ROTAS ADMINISTRATIVAS
// =====================================================

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    cadastrarQuestao
);

router.get(
    "/",
    autenticarToken,
    verificarAdmin,
    listarTodasQuestoes
);

router.get(
    "/:id",
    autenticarToken,
    verificarAdmin,
    buscarQuestao
);

router.put(
    "/:id",
    autenticarToken,
    verificarAdmin,
    editarQuestao
);

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    deletarQuestao
);

module.exports = router;