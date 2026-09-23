const express =
    require("express");

const autenticarToken =
    require("../middleware/authMiddleware");

const controller =
    require("../controllers/checklistController");

const router =
    express.Router();

router.use(
    autenticarToken
);

router.get(
    "/:blocoId",
    controller.listarProgresso
);

router.put(
    "/:blocoId",
    controller.atualizarItem
);

router.delete(
    "/:blocoId",
    controller.limparProgresso
);

module.exports = router;