const express = require('express');
const router = express.Router();

const controller = require('../controllers/cronogramaModeloController');
const autenticarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');
const pessoal = require('../controllers/planoPessoalController');

router.get('/meu-plano', autenticarToken, pessoal.meuPlano);
router.put('/meu-plano', autenticarToken, pessoal.atualizarMeuPlano);
router.get('/ativo', autenticarToken, controller.ativo);
router.get('/disponiveis', autenticarToken, controller.disponiveis);
router.get('/', autenticarToken, verificarAdmin, controller.listar);
router.post('/', autenticarToken, verificarAdmin, controller.criar);
router.put('/:id', autenticarToken, verificarAdmin, controller.atualizar);
router.put('/:id/arquivar', autenticarToken, verificarAdmin, controller.arquivar);
router.put('/:id/ativar', autenticarToken, verificarAdmin, controller.ativar);
router.delete('/:id', autenticarToken, verificarAdmin, controller.excluir);

module.exports = router;
