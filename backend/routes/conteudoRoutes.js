const express = require("express");

const router = express.Router();

const conteudoController =
    require("../controllers/conteudoController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");


// =====================================================
// CONTEÚDOS PÚBLICOS PARA ALUNOS
// =====================================================
//
// Não exige login de administrador.
// Retorna somente matérias e tópicos ativos.
//

router.get(
    "/publico",
    conteudoController.listarPublico
);


// =====================================================
// PROTEÇÃO ADMINISTRATIVA
// =====================================================

router.use(
    autenticarToken,
    verificarAdmin
);


// =====================================================
// ADMIN — LEITURA
// =====================================================

router.get(
    "/",
    conteudoController.listar
);

router.get(
    "/materias/:id",
    conteudoController.buscarMateria
);


// =====================================================
// ADMIN — MATÉRIAS
// =====================================================

router.post(
    "/materias",
    conteudoController.criarMateria
);

router.put(
    "/materias/:id",
    conteudoController.atualizarMateria
);

router.delete(
    "/materias/:id",
    conteudoController.excluirMateria
);


// =====================================================
// ADMIN — TÓPICOS
// =====================================================

router.post(
    "/materias/:materiaId/topicos",
    conteudoController.criarTopico
);

router.put(
    "/topicos/:id",
    conteudoController.atualizarTopico
);

router.delete(
    "/topicos/:id",
    conteudoController.excluirTopico
);


module.exports = router;