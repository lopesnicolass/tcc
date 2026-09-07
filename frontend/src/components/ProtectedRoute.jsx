import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const usuarioSalvo = localStorage.getItem('etecamp_usuario');

  if (!usuarioSalvo) {
    return <Navigate to="/login" replace />;
  }

  try {
    const usuario = JSON.parse(usuarioSalvo);

    if (!usuario || !usuario.id) {
      localStorage.removeItem('etecamp_usuario');
      return <Navigate to="/login" replace />;
    }

    return <Outlet />;
  } catch (erro) {
    console.error('Sessão inválida:', erro);

    localStorage.removeItem('etecamp_usuario');

    return <Navigate to="/login" replace />;
  }
}