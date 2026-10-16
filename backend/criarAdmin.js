require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./config/db");

// Configure ADMIN_EMAIL e ADMIN_PASSWORD apenas no ambiente de provisionamento.
const nome = process.env.ADMIN_NAME || 'Administrador';
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const senha = process.env.ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !senha || senha.length < 12) {
    console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) antes de criar o administrador.');
    process.exit(1);
}

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
                        // Nunca imprimir a senha no console.

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