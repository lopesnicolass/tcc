const bcrypt = require("bcrypt");
const db = require("./config/db");

const nome = "Administrador";
const email = "admin@vestibulinho.com";
const senha = "Admin123";

async function criarAdmin() {

    try {

        const senhaCriptografada =
            await bcrypt.hash(senha, 10);

        db.get(
            `SELECT id FROM usuarios WHERE email = ?`,
            [email],
            (erro, usuario) => {

                if (erro) {
                    console.error("Erro ao consultar usuário:", erro);
                    return;
                }

                if (usuario) {
                    console.log("⚠️ Esse administrador já existe.");
                    db.close();
                    return;
                }

                db.run(
                    `
                    INSERT INTO usuarios
                    (nome, email, senha, tipo)
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        nome,
                        email,
                        senhaCriptografada,
                        "admin"
                    ],
                    function (erro) {

                        if (erro) {
                            console.error(
                                "Erro ao criar administrador:",
                                erro
                            );
                            return;
                        }

                        console.log(
                            "✅ Administrador criado com sucesso!"
                        );

                        console.log("Email:", email);
                        console.log("Senha:", senha);

                        db.close();
                    }
                );
            }
        );

    } catch (erro) {

        console.error(
            "Erro ao criptografar senha:",
            erro
        );

        db.close();
    }
}

criarAdmin();