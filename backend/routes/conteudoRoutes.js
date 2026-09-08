const express = require("express");

const router = express.Router();

const conteudoController =
    require("../controllers/conteudoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");

router.get(
    "/",
    autenticarToken,
    conteudoController.listar
);

router.get(
    "/publico",
    conteudoController.listarPublico
);

router.get(
    "/materias/:id",
    autenticarToken,
    conteudoController.buscarMateria
);

router.post(
    "/materias",
    autenticarToken,
    verificarAdmin,
    conteudoController.criarMateria
);

router.put(
    "/materias/:id",
    autenticarToken,
    verificarAdmin,
    conteudoController.atualizarMateria
);

router.delete(
    "/materias/:id",
    autenticarToken,
    verificarAdmin,
    conteudoController.excluirMateria
);

router.post(
    "/materias/:materiaId/topicos",
    autenticarToken,
    verificarAdmin,
    conteudoController.criarTopico
);

router.put(
    "/topicos/:id",
    autenticarToken,
    verificarAdmin,
    conteudoController.atualizarTopico
);

router.delete(
    "/topicos/:id",
    autenticarToken,
    verificarAdmin,
    conteudoController.excluirTopico
);

module.exports = router;