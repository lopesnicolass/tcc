const express = require("express");
const cors = require("cors");
require("dotenv").config();

const questaoRoutes = require("./routes/questaoRoutes");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const resultadoRoutes = require("./routes/resultadoRoutes");
const simuladoRoutes = require("./routes/simuladoRoutes");


const app = express();


// ============================
// CONFIGURAÇÕES
// ============================

app.use(cors());
app.use(express.json());


// ============================
// ROTAS
// ============================

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/resultados", resultadoRoutes);
app.use("/questoes", questaoRoutes);
app.use("/simulados", simuladoRoutes);
app.use("/questoes", questaoRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Vestibulinho funcionando!"
    });
});

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