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

const verificarAdmin =
    require("../middleware/adminMiddleware");

const router =
    express.Router();


// =====================================================
// SALVAR RESULTADO MANUALMENTE
// =====================================================
//
// Esta rota não é usada pelo frontend do aluno.
// Ela fica restrita ao administrador para impedir que
// um usuário envie acertos/erros inventados diretamente
// para a API.
//
// O aluno usa /simulados/:id/corrigir.
//

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    cadastrarResultado
);


// =====================================================
// RESULTADOS DO USUÁRIO LOGADO
// =====================================================
//
// Estas rotas vêm antes de /:usuarioId para evitar
// conflito de roteamento.
//

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