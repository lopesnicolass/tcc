const router = require('express').Router();
const autenticarToken = require('../middleware/authMiddleware');
const controller = require('../controllers/terrarioController');

router.use(autenticarToken);
router.get('/estado', controller.estado);
router.get('/jornada', controller.jornada);
router.post('/loja/:itemId/comprar', controller.comprarItem);
router.patch('/inventario/:itemId', controller.personalizarItem);
router.post('/foco/iniciar', controller.iniciar);
for (const acao of ['pausar', 'continuar', 'concluir', 'cancelar']) {
  router.post(`/foco/:id/${acao}`, controller.operacao(acao));
}
module.exports = router;
