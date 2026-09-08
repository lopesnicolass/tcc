const express = require("express");

const router = express.Router();

const flashcardController =
    require("../controllers/flashcardController");

const autenticarToken =
    require("../middleware/authMiddleware");

const verificarAdmin =
    require("../middleware/adminMiddleware");


// =====================================================
// ALUNO — LISTAR FLASHCARDS
// =====================================================

router.get(
    "/",
    autenticarToken,
    flashcardController.listar
);


// =====================================================
// ADMIN — CRIAR
// =====================================================

router.post(
    "/",
    autenticarToken,
    verificarAdmin,
    flashcardController.criar
);


// =====================================================
// ADMIN — BUSCAR POR ID
// =====================================================

router.get(
    "/:id",
    autenticarToken,
    verificarAdmin,
    flashcardController.buscarPorId
);


// =====================================================
// ADMIN — ATUALIZAR
// =====================================================

router.put(
    "/:id",
    autenticarToken,
    verificarAdmin,
    flashcardController.atualizar
);


// =====================================================
// ADMIN — EXCLUIR
// =====================================================

router.delete(
    "/:id",
    autenticarToken,
    verificarAdmin,
    flashcardController.excluir
);


module.exports = router;