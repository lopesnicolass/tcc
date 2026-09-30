const express = require("express");

const router =
    express.Router();

const autenticarToken =
    require("../middleware/authMiddleware");

const {
    buscar,
    registrar,
    ganharXP
} = require("../controllers/gamificacaoController");


// Buscar XP do usuário logado
router.get(
    "/",
    autenticarToken,
    buscar
);


// Registrar uma interação/atividade do usuário.
// Não concede XP; apenas mantém a sequência diária.
router.post(
    "/atividade",
    autenticarToken,
    registrar
);


// Adicionar XP ao usuário logado
router.post(
    "/xp",
    autenticarToken,
    ganharXP
);


module.exports = router;