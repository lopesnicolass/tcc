const express =
    require("express");

const router =
    express.Router();

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

const controller =
    require("../controllers/conteudoPaginaController");

router.use(
    autenticarToken
);


// =====================================================
// ALUNO
// =====================================================

router.get(
    "/topico/:topicoId",
    controller.buscarPaginaPorTopico
);


// =====================================================
// ADMIN — PÁGINAS
// =====================================================

router.get(
    "/",
    verificarAdmin,
    controller.listarPaginas
);

router.post(
    "/",
    verificarAdmin,
    controller.criarPagina
);

router.put(
    "/:id",
    verificarAdmin,
    controller.atualizarPagina
);

router.delete(
    "/:id",
    verificarAdmin,
    controller.excluirPagina
);


// =====================================================
// ADMIN — BLOCOS
// =====================================================

router.get(
    "/:paginaId/blocos",
    verificarAdmin,
    controller.listarBlocos
);

router.post(
    "/:paginaId/blocos",
    verificarAdmin,
    controller.criarBloco
);

router.put(
    "/blocos/:id",
    verificarAdmin,
    controller.atualizarBloco
);

router.delete(
    "/blocos/:id",
    verificarAdmin,
    controller.excluirBloco
);


// =====================================================
// ADMIN — BUSCAR UMA PÁGINA
//
// Fica por último para não interceptar
// /topico/:topicoId
// =====================================================

router.get(
    "/:id",
    verificarAdmin,
    controller.buscarPaginaPorId
);


module.exports =
    router;