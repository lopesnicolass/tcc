// Cliente de API único do frontend.
//
// Antes, cada página tinha sua própria cópia de API_URL,
// obterToken() e um monte de fetch() manual repetindo a mesma
// lógica de headers, Authorization e leitura do JSON. Esse arquivo
// centraliza tudo isso — cada página agora só chama request(...).

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

// O token já foi salvo com nomes diferentes em telas diferentes
// ao longo do projeto ('etecamp_token' e 'token'). Checamos os
// dois pra não quebrar sessões já salvas.
export function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  );
}

// request(url, options, mensagemPadrao)
//
// - url: caminho relativo, ex: '/mural/123'
// - options: mesmas opções do fetch (method, body, headers...)
// - mensagemPadrao: mensagem de erro a usar SE o backend não
//   mandar nenhuma (dados.erro / dados.mensagem / dados.message)
//
// Se o body for um FormData (upload de arquivo), o Content-Type
// não é definido manualmente — o navegador define sozinho, com o
// boundary correto.
export async function request(
  url,
  options = {},
  mensagemPadrao = 'Não foi possível completar a operação.'
) {
  const token = obterToken();
  const ehFormData = options.body instanceof FormData;

  const resposta = await fetch(
    `${API_URL}${url}`,
    {
      ...options,
      headers: {
        ...(ehFormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(options.headers || {}),
      },
    }
  );

  const texto = await resposta.text();

  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {};
  }

  if (!resposta.ok) {
    const erro = new Error(
      dados.erro ||
        dados.mensagem ||
        dados.message ||
        mensagemPadrao
    );

    // Deixa o corpo bruto disponível, pra quem precisar de algo
    // além da mensagem (ex.: um código de erro específico).
    erro.dados = dados;
    erro.status = resposta.status;

    throw erro;
  }

  return dados;
}
