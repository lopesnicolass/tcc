import { Navigate, Outlet } from 'react-router-dom';

// Igual ao ProtectedRoute, mas também exige tipo === 'admin'.
// O backend já bloqueia (adminMiddleware), isso aqui é só pra
// não deixar a UI de admin nem aparecer pra quem não pode usar.
export default function AdminRoute() {
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

    if (usuario.tipo !== 'admin') {
      return <Navigate to="/home" replace />;
    }

    return <Outlet />;
  } catch (erro) {
    console.error('Sessão inválida:', erro);

    localStorage.removeItem('etecamp_usuario');

    return <Navigate to="/login" replace />;
  }
}
