const express = require("express");

const router = express.Router();

const autenticarToken =
    require("../middleware/authMiddleware");

const controller =
    require("../controllers/conteudoPaginaController");

router.use(autenticarToken);

/* PÁGINAS */

router.get(
    "/",
    controller.listarPaginas
);

router.get(
    "/topico/:topicoId",
    controller.buscarPaginaPorTopico
);

router.get(
    "/:id",
    controller.buscarPaginaPorId
);

router.post(
    "/",
    controller.criarPagina
);

router.put(
    "/:id",
    controller.atualizarPagina
);

router.delete(
    "/:id",
    controller.excluirPagina
);

/* BLOCOS */

router.get(
    "/:paginaId/blocos",
    controller.listarBlocos
);

router.post(
    "/:paginaId/blocos",
    controller.criarBloco
);

router.put(
    "/blocos/:id",
    controller.atualizarBloco
);

router.delete(
    "/blocos/:id",
    controller.excluirBloco
);

module.exports = router;