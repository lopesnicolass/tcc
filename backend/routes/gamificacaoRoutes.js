const express = require("express");

const router =
    express.Router();

const autenticarToken =
    require("../middleware/authMiddleware");

const {
    buscar,
    registrar
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


// XP é concedido apenas após ações verificadas no backend.
router.post('/xp', autenticarToken, (req, res) => res.status(403).json({
    mensagem: 'XP só pode ser concedido por atividades confirmadas pelo servidor.'
}));


// Ranking exclusivo para alunos autenticados, com participação voluntária.
const ranking = require('../controllers/rankingController');
router.get('/ranking', autenticarToken, ranking.listar);
router.get('/ranking/configuracao', autenticarToken, ranking.configuracao);
router.put('/ranking/configuracao', autenticarToken, ranking.atualizarConfiguracao);
router.get('/ranking/foto/:id', autenticarToken, ranking.foto);

module.exports = router;