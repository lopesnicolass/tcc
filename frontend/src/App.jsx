import { Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/public/Landing.jsx';
import Auth from './pages/public/Auth.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/aluno/Home.jsx';
import Mural from './pages/aluno/Mural.jsx';
import Cronograma from './pages/aluno/Cronograma.jsx';
import PlanoAutomatico from './pages/aluno/PlanoAutomatico.jsx';
import Conteudos from './pages/aluno/Conteudos.jsx';
import Simulados from './pages/aluno/Simulados.jsx';
import Provas from './pages/aluno/Provas.jsx';
import Desempenho from './pages/aluno/Desempenho.jsx';
import FlashCards from './pages/aluno/FlashCards.jsx';
import Perfil from './pages/aluno/Perfil.jsx';
import Terrario from './terrario/Terrario.jsx';

import AdminDashboard from './pages/adm/AdminDashboard.jsx';
import AdminUsuarios from './pages/adm/AdminUsuarios.jsx';
import AdminSimulados from './pages/adm/AdminSimulados.jsx';
import AdminFlashCards from './pages/adm/AdminFlashCards.jsx';
import AdminProvas from './pages/adm/AdminProvas.jsx';
import AdminConteudos from './pages/adm/AdminConteudos.jsx';
// import AdminCronogramas from './pages/adm/AdminCronogramas.jsx';

import XPToast from './components/XPToast.jsx';

export default function App() {
  return (
    <>
      <XPToast />

      <Routes>

        {/* TELA INICIAL (antes do login) */}
        <Route path="/" element={<Landing />} />

        {/* LOGIN */}
        <Route path="/login" element={<Auth />} />

        {/* ÁREA PROTEGIDA DO ALUNO */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/conteudos" element={<Conteudos />} />
            <Route path="/cronograma" element={<Cronograma />} />
            <Route path="/plano-automatico" element={<PlanoAutomatico />} />
            <Route path="/simulados" element={<Simulados />} />
            <Route path="/provas" element={<Provas />} />
            <Route path="/desempenho" element={<Desempenho />} />
            <Route path="/flashcards" element={<FlashCards />} />
<Route path="/terrario" element={<Terrario />} />
<Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>

        {/* ÁREA PROTEGIDA DO ADMIN */}
       {/* ÁREA PROTEGIDA DO ADMIN */}
<Route element={<ProtectedRoute />}>
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/conteudos" element={<AdminConteudos />} />
    <Route path="/admin/usuarios" element={<AdminUsuarios />} />
    <Route path="/admin/simulados" element={<AdminSimulados />} />
    <Route path="/admin/flashcards" element={<AdminFlashCards />} />
    <Route path="/admin/provas" element={<AdminProvas />} />
  </Route>
</Route>

        {/* QUALQUER ROTA DESCONHECIDA */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </>
  );
}