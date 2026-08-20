function verificarAdmin(req, res, next) {

    const tipo = req.headers["x-tipo-usuario"];

    if (tipo !== "admin") {
        return res.status(403).json({
            mensagem: "Acesso permitido somente para administradores."
        });
    }

    next();
}

module.exports = verificarAdmin;