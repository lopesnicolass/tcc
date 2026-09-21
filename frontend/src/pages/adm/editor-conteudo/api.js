// Helper de chamada à API usado só pelo Editor de Conteúdo.
// Extraído de EditorConteudo.jsx (estava tudo junto no mesmo arquivo).

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token')
  );
}

export async function request(url, options = {}) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : {
            'Content-Type': 'application/json',
          }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const texto = await resposta.text();

  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {};
  }

  if (
    resposta.status === 404 &&
    url.startsWith('/paginas-conteudo/topico/')
  ) {
    return {
      pagina: null,
      blocos: [],
    };
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        dados.message ||
        dados.mensagem ||
        'Não foi possível realizar a operação.'
    );
  }

  return dados;
}
