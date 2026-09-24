const RESEND_API_URL = "https://api.resend.com/emails";

async function enviarEmailRecuperacao({ destinatario, nome, link }) {

    const apiKey = process.env.RESEND_API_KEY;
    const remetente = process.env.EMAIL_FROM;

    if (!apiKey || !remetente) {
        console.log("\n========================================");
        console.log("LINK DE RECUPERAÇÃO DE SENHA (DEV)");
        console.log(link);
        console.log("========================================\n");
        return { modo: "dev" };
    }

    const corpo = [
        `Olá${nome ? `, ${nome}` : ""}!`,
        "",
        "Recebemos uma solicitação para redefinir a senha da sua conta no Prepara ETECAMP.",
        "",
        "Acesse o link abaixo para criar uma nova senha:",
        link,
        "",
        "Este link expira em 15 minutos.",
        "Se você não solicitou a redefinição, ignore este e-mail."
    ].join("\n");

    const resposta = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: remetente,
            to: [destinatario],
            subject: "Redefinição de senha - Prepara ETECAMP",
            text: corpo
        })
    });

    if (!resposta.ok) {
        const detalhes = await resposta.text();
        throw new Error(`Falha ao enviar e-mail: ${detalhes}`);
    }

    return { modo: "email" };
}

module.exports = {
    enviarEmailRecuperacao
};
