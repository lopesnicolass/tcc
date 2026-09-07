const express = require("express");

const router =
    express.Router();

const autenticarToken =
    require("../middleware/authMiddleware");

const {
    buscar,
    ganharXP
} = require("../controllers/gamificacaoController");


// Buscar XP do usuário logado
router.get(
    "/",
    autenticarToken,
    buscar
);


// Adicionar XP ao usuário logado
router.post(
    "/xp",
    autenticarToken,
    ganharXP
);


module.exports = router;