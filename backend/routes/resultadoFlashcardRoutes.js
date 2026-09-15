const express = require("express");

const {
    criarSessao,
    registrarResposta,
    finalizarSessao,
    listarSessoes,
    desempenhoPorMateria,
    listarRespostas
} = require("../controllers/resultadoFlashcardController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// CRIAR SESSÃO
// =====================================================

router.post(
    "/sessoes",
    autenticarToken,
    criarSessao
);


// =====================================================
// REGISTRAR RESPOSTA
// =====================================================

router.post(
    "/sessoes/:sessaoId/respostas",
    autenticarToken,
    registrarResposta
);


// =====================================================
// FINALIZAR SESSÃO
// =====================================================

router.put(
    "/sessoes/:sessaoId/finalizar",
    autenticarToken,
    finalizarSessao
);


// =====================================================
// LISTAR SESSÕES
// =====================================================

router.get(
    "/sessoes",
    autenticarToken,
    listarSessoes
);


// =====================================================
// DESEMPENHO POR MATÉRIA
// =====================================================

router.get(
    "/desempenho",
    autenticarToken,
    desempenhoPorMateria
);


// =====================================================
// LISTAR RESPOSTAS
// =====================================================

router.get(
    "/respostas",
    autenticarToken,
    listarRespostas
);


module.exports = router;