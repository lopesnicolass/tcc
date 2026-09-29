// =====================================================
// CLIENTE CENTRAL DA API
// =====================================================

export const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000';


// =====================================================
// OBTER TOKEN
// =====================================================

export function obterToken() {

    return (
        localStorage.getItem('etecamp_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        ''
    );
}


// =====================================================
// LIMPAR SESSÃO
// =====================================================

export function limparSessao() {

    localStorage.removeItem(
        'etecamp_token'
    );

    localStorage.removeItem(
        'token'
    );

    localStorage.removeItem(
        'accessToken'
    );

    localStorage.removeItem(
        'etecamp_usuario'
    );

    sessionStorage.removeItem(
        'etecamp_admin_preview'
    );

    window.dispatchEvent(
        new Event('etecamp-logout')
    );
}


// =====================================================
// REQUEST
// =====================================================

export async function request(
    url,
    options = {},
    mensagemPadrao =
        'Não foi possível completar a operação.'
) {

    const token =
        obterToken();

    const ehFormData =
        options.body instanceof FormData;


    const resposta =
        await fetch(
            `${API_URL}${url}`,
            {
                ...options,

                headers: {

                    ...(ehFormData
                        ? {}
                        : {
                            'Content-Type':
                                'application/json'
                        }),

                    ...(token
                        ? {
                            Authorization:
                                `Bearer ${token}`
                        }
                        : {}),

                    ...(options.headers || {})
                }
            }
        );


    const texto =
        await resposta.text();


    let dados = {};


    try {

        dados =
            texto
                ? JSON.parse(texto)
                : {};

    } catch {

        dados = {};

    }


    if (!resposta.ok) {

        const erro =
            new Error(
                dados.erro ||
                dados.mensagem ||
                dados.message ||
                mensagemPadrao
            );


        erro.dados =
            dados;

        erro.status =
            resposta.status;


        throw erro;
    }


    return dados;
}