import {
    Navigate,
    Outlet
} from 'react-router-dom';

import {
    useEffect,
    useState
} from 'react';

import {
    request,
    obterToken,
    limparSessao
} from '../services/api.js';


// =====================================================
// ROTA PROTEGIDA
// =====================================================
//
// O frontend verifica:
//
// 1. se existe token;
// 2. se existe usuário salvo;
// 3. se o token ainda é aceito pelo backend;
// 4. se o usuário ainda existe no banco.
//
// Se estiver tudo certo, mantém o acesso à rota.
// =====================================================

export default function ProtectedRoute() {

    const [
        status,
        setStatus
    ] = useState(
        'carregando'
    );


    useEffect(() => {

        let ativo = true;


        // =================================================
        // VALIDAR SESSÃO
        // =================================================

        async function validarSessao() {

            const token =
                obterToken();

            const usuarioSalvo =
                localStorage.getItem(
                    'etecamp_usuario'
                );


            // ---------------------------------------------
            // NÃO EXISTE SESSÃO LOCAL
            // ---------------------------------------------

            if (
                !token ||
                !usuarioSalvo
            ) {

                limparSessao();

                if (ativo) {

                    setStatus(
                        'nao-autenticado'
                    );

                }

                return;
            }


            // ---------------------------------------------
            // VALIDAR USUÁRIO SALVO
            // ---------------------------------------------

            try {

                const usuarioLocal =
                    JSON.parse(
                        usuarioSalvo
                    );


                if (
                    !usuarioLocal ||
                    !usuarioLocal.id
                ) {

                    throw new Error(
                        'Usuário local inválido.'
                    );
                }

            } catch (erro) {

                console.error(
                    '❌ Sessão local inválida:',
                    erro
                );

                limparSessao();

                if (ativo) {

                    setStatus(
                        'nao-autenticado'
                    );

                }

                return;
            }


            // ---------------------------------------------
            // VALIDAR TOKEN NO BACKEND
            // ---------------------------------------------

            try {

                const dados =
                    await request(
                        '/usuarios/meu-perfil',
                        {},
                        'Sua sessão não é mais válida.'
                    );


                const usuario =
                    dados?.usuario;


                if (
                    !usuario ||
                    !usuario.id
                ) {

                    throw new Error(
                        'O servidor não retornou um usuário válido.'
                    );
                }


                // -----------------------------------------
                // ATUALIZAR USUÁRIO LOCAL
                // -----------------------------------------

                localStorage.setItem(
                    'etecamp_usuario',
                    JSON.stringify(
                        usuario
                    )
                );


                if (ativo) {

                    setStatus(
                        'autenticado'
                    );

                }

            } catch (erro) {

                console.error(
                    '❌ Sessão rejeitada pelo backend:',
                    erro
                );


                limparSessao();


                if (ativo) {

                    setStatus(
                        'nao-autenticado'
                    );

                }

            }
        }


        // =================================================
        // EXECUTAR
        // =================================================

        validarSessao();


        // =================================================
        // LIMPEZA
        // =================================================

        return () => {

            ativo = false;

        };

    }, []);


    // =====================================================
    // VALIDANDO SESSÃO
    // =====================================================

    if (
        status ===
        'carregando'
    ) {

        return null;

    }


    // =====================================================
    // NÃO AUTENTICADO
    // =====================================================

    if (
        status ===
        'nao-autenticado'
    ) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );

    }


    // =====================================================
    // AUTENTICADO
    // =====================================================

    return (
        <Outlet />
    );
}