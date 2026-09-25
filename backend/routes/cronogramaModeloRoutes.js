const express = require('express');
const router = express.Router();

const controller = require('../controllers/cronogramaModeloController');
const autenticarToken = require('../middleware/authMiddleware');
const verificarAdmin = require('../middleware/adminMiddleware');

router.get('/ativo', autenticarToken, controller.ativo);
router.get('/', autenticarToken, verificarAdmin, controller.listar);
router.post('/', autenticarToken, verificarAdmin, controller.criar);
router.put('/:id', autenticarToken, verificarAdmin, controller.atualizar);
router.put('/:id/ativar', autenticarToken, verificarAdmin, controller.ativar);
router.delete('/:id', autenticarToken, verificarAdmin, controller.excluir);

module.exports = router;
