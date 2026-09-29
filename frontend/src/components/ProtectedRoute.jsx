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
//
// Não confiamos somente no localStorage.
//
// O frontend verifica:
//
// 1. se existe token;
// 2. se existe usuário salvo;
// 3. se o token ainda é aceito pelo backend;
// 4. se o usuário ainda existe no SQLite.
//
// Se tudo estiver certo, atualiza o usuário salvo
// com os dados reais vindos do banco.
// =====================================================

export default function ProtectedRoute() {

    const [status, setStatus] =
        useState('carregando');


    useEffect(() => {

        let ativo = true;


        async function validarSessao() {

            const token =
                obterToken();

            const usuarioSalvo =
                localStorage.getItem(
                    'etecamp_usuario'
                );


            // -------------------------------------------------
            // NÃO EXISTE SESSÃO LOCAL
            // -------------------------------------------------

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


            // -------------------------------------------------
            // VALIDAR JSON DO USUÁRIO SALVO
            // -------------------------------------------------

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


            // -------------------------------------------------
            // VALIDAR TOKEN + USUÁRIO NO BACKEND
            // -------------------------------------------------

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


                // -------------------------------------------------
                // ATUALIZA O USUÁRIO LOCAL
                // COM A VERSÃO OFICIAL DO BANCO
                // -------------------------------------------------

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


        validarSessao();


        return () => {

            ativo = false;

        };

    }, []);


    // =====================================================
    // ENQUANTO VALIDA
    // =====================================================

    if (
        status === 'carregando'
    ) {

        return null;

    }


    // =====================================================
    // NÃO AUTENTICADO
    // =====================================================

    if (
        status === 'nao-autenticado'
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
}ensureResultados.js