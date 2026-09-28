const express = require("express");

const {
    cadastrarResultado,
    listarResultados,
    listarMeusResultados,
    buscarDesempenho,
    buscarMeuDesempenho
} = require("../controllers/resultadoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// SALVAR RESULTADO
// =====================================================

router.post(
    "/",
    autenticarToken,
    cadastrarResultado
);

// =====================================================
// RESULTADOS DO USUÁRIO LOGADO
// Essas rotas vêm antes de /:usuarioId para evitar conflito.
// =====================================================

router.get(
    "/me/desempenho",
    autenticarToken,
    buscarMeuDesempenho
);

router.get(
    "/me",
    autenticarToken,
    listarMeusResultados
);

// =====================================================
// RESULTADOS POR USUÁRIO
// =====================================================

router.get(
    "/:usuarioId/desempenho",
    autenticarToken,
    buscarDesempenho
);

router.get(
    "/:usuarioId",
    autenticarToken,
    listarResultados
);

module.exports = router;
