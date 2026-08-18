// ============================
// DADOS DO USUÁRIO
// ============================

const usuarioSalvo = localStorage.getItem("usuario");


// Se não existir usuário logado,
// volta para a página de login.
if (!usuarioSalvo) {

    window.location.href = "../login/login.html";

} else {

    const usuario = JSON.parse(usuarioSalvo);

    const nomeInput = document.getElementById("nome");
    const emailInput = document.getElementById("email");
    const avatarInicial = document.getElementById("avatarInicial");

    const editarBtn = document.getElementById("editarBtn");
    const salvarBtn = document.getElementById("salvarBtn");
    const cancelarBtn = document.getElementById("cancelarBtn");
    const sairBtn = document.getElementById("sairBtn");

    const mensagem = document.getElementById("mensagem");


    // ============================
    // MOSTRAR DADOS
    // ============================

    nomeInput.value = usuario.nome;
    emailInput.value = usuario.email;

    // Pega a primeira letra do nome
    avatarInicial.textContent =
        usuario.nome.charAt(0).toUpperCase();


    // ============================
    // EDITAR PERFIL
    // ============================

    editarBtn.addEventListener("click", () => {

        nomeInput.disabled = false;
        emailInput.disabled = false;

        editarBtn.hidden = true;

        salvarBtn.hidden = false;
        cancelarBtn.hidden = false;

        mensagem.textContent = "";

    });


    // ============================
    // CANCELAR EDIÇÃO
    // ============================

    cancelarBtn.addEventListener("click", () => {

        nomeInput.value = usuario.nome;
        emailInput.value = usuario.email;

        nomeInput.disabled = true;
        emailInput.disabled = true;

        editarBtn.hidden = false;

        salvarBtn.hidden = true;
        cancelarBtn.hidden = true;

        mensagem.textContent = "";

    });


    // ============================
    // SALVAR ALTERAÇÕES
    // ============================

    salvarBtn.addEventListener("click", () => {

        const novoNome = nomeInput.value.trim();
        const novoEmail = emailInput.value.trim();


        if (!novoNome || !novoEmail) {

            mensagem.textContent =
                "Preencha todos os campos.";

            return;
        }


        // Atualiza os dados
        usuario.nome = novoNome;
        usuario.email = novoEmail;


        // Salva novamente no navegador
        localStorage.setItem(
            "usuario",
            JSON.stringify(usuario)
        );


        // Atualiza a inicial do avatar
        avatarInicial.textContent =
            novoNome.charAt(0).toUpperCase();


        // Bloqueia os campos novamente
        nomeInput.disabled = true;
        emailInput.disabled = true;


        editarBtn.hidden = false;

        salvarBtn.hidden = true;
        cancelarBtn.hidden = true;


        mensagem.textContent =
            "Perfil atualizado com sucesso!";

    });


    // ============================
    // SAIR DA CONTA
    // ============================

    sairBtn.addEventListener("click", () => {

        localStorage.removeItem("usuario");

        window.location.href = "../login/login.html";

    });

}
