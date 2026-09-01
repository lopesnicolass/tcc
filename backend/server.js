require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const questaoRoutes = require("./routes/questaoRoutes");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const resultadoRoutes = require("./routes/resultadoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");
const muralRoutes = require("./routes/muralRoutes");
const sessaoRoutes = require("./routes/sessaoRoutes");
const provaRoutes = require("./routes/provaRoutes");

const app = express();


// ============================
// CONFIGURAÇÕES
// ============================

app.use(cors());

app.use(express.json());


// ============================
// ARQUIVOS PDF
// ============================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// ============================
// ROTAS
// ============================

app.use("/auth", authRoutes);

app.use("/usuarios", usuarioRoutes);

app.use("/resultados", resultadoRoutes);

app.use("/questoes", questaoRoutes);

app.use("/simulados", simuladoRoutes);

app.use("/mural", muralRoutes);

app.use("/sessoes", sessaoRoutes);

app.use("/provas", provaRoutes);


// ============================
// ROTA INICIAL
// ============================

app.get("/", (req, res) => {

    res.json({
        mensagem: "API do Vestibulinho funcionando!"
    });

});


// ============================
// SERVIDOR
// ============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor rodando na porta ${PORT}`
    );

});