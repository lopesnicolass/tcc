const express = require("express");

const controller =
    require("../controllers/conteudoPaginaController");

const autenticarToken =
    require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// PÁGINAS
// =====================================================

router.get(
    "/",
    autenticarToken,
    controller.listarPaginas
);

router.get(
    "/topico/:topicoId",
    autenticarToken,
    controller.buscarPorTopico
);

router.get(
    "/:id",
    autenticarToken,
    controller.buscarPagina
);

router.post(
    "/",
    autenticarToken,
    controller.criarPagina
);

router.put(
    "/:id",
    autenticarToken,
    controller.atualizarPagina
);

router.delete(
    "/:id",
    autenticarToken,
    controller.excluirPagina
);


// =====================================================
// BLOCOS
// =====================================================

router.get(
    "/:paginaId/blocos",
    autenticarToken,
    controller.listarBlocos
);

router.post(
    "/:paginaId/blocos",
    autenticarToken,
    controller.criarBloco
);

router.put(
    "/blocos/:id",
    autenticarToken,
    controller.atualizarBloco
);

router.delete(
    "/blocos/:id",
    autenticarToken,
    controller.excluirBloco
);

module.exports = router;