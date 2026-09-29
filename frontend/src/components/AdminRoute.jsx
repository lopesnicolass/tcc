import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { request } from '../services/api.js';

function limparSessao() {
  localStorage.removeItem('etecamp_usuario');
  localStorage.removeItem('etecamp_token');
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');

  sessionStorage.removeItem('etecamp_admin_preview');
}

export default function AdminRoute() {
  const [status, setStatus] =
    useState('verificando');

  const [usuario, setUsuario] =
    useState(null);

  useEffect(() => {
    let ativo = true;

    async function validarAdmin() {
      const token =
        localStorage.getItem('etecamp_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        '';

      if (!token) {
        limparSessao();

        if (ativo) {
          setStatus('invalida');
        }

        return;
      }

      try {
        const dados =
          await request(
            '/usuarios/meu-perfil',
            {},
            'Sua sessão não é mais válida.'
          );

        const usuarioAtual =
          dados?.usuario;

        if (
          !usuarioAtual ||
          !usuarioAtual.id
        ) {
          throw new Error(
            'Usuário não encontrado.'
          );
        }

        localStorage.setItem(
          'etecamp_usuario',
          JSON.stringify(usuarioAtual)
        );

        if (
          usuarioAtual.tipo !== 'admin'
        ) {
          if (ativo) {
            setStatus('nao-admin');
          }

          return;
        }

        if (ativo) {
          setUsuario(usuarioAtual);
          setStatus('valida');
        }

      } catch (erro) {
        console.error(
          'Erro ao validar acesso administrativo:',
          erro
        );

        limparSessao();

        if (ativo) {
          setStatus('invalida');
        }
      }
    }

    validarAdmin();

    return () => {
      ativo = false;
    };
  }, []);

  // =====================================================
  // ENQUANTO ESTÁ VALIDANDO
  // =====================================================

  if (status === 'verificando') {
    return null;
  }

  // =====================================================
  // SESSÃO INVÁLIDA
  // =====================================================

  if (status === 'invalida') {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =====================================================
  // USUÁRIO LOGADO, MAS NÃO É ADMIN
  // =====================================================

  if (status === 'nao-admin') {
    return (
      <Navigate
        to="/home"
        replace
      />
    );
  }

  // =====================================================
  // ADMIN VALIDADO
  // =====================================================

  if (
    status === 'valida' &&
    usuario
  ) {
    return <Outlet />;
  }

  return (
    <Navigate
      to="/login"
      replace
    />
  );
}