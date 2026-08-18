const API_URL = "http://localhost:3000/auth";


// ============================
// CADASTRO
// ============================

const cadastroForm = document.getElementById("cadastroForm");

if (cadastroForm) {

    cadastroForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const mensagem = document.getElementById("mensagem");

        try {

            const resposta = await fetch(`${API_URL}/cadastro`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    senha: senha
                })
            });

            const dados = await resposta.json();

            mensagem.textContent = dados.mensagem;

            if (resposta.ok) {
                cadastroForm.reset();
            }

        } catch (erro) {

            console.error(erro);

            mensagem.textContent =
                "Não foi possível conectar ao servidor.";
        }
    });
}


// ============================
// LOGIN
// ============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        const mensagem = document.getElementById("mensagem");

        try {

            const resposta = await fetch(`${API_URL}/login`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            const dados = await resposta.json();

            mensagem.textContent = dados.mensagem;

     if (resposta.ok) {

    console.log("Usuário logado:", dados.usuario);

    localStorage.setItem(
        "usuario",
        JSON.stringify(dados.usuario)
    );

    window.location.href = "../home/home.html";
}

        } catch (erro) {

            console.error(erro);

            mensagem.textContent =
                "Não foi possível conectar ao servidor.";
        }
    });
}