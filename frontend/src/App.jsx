import { Routes, Route, Navigate } from 'react-router-dom';

import Auth from './pages/Auth.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Mural from './pages/Mural.jsx';
import Cronograma from './pages/Cronograma.jsx';
import Simulados from './pages/Simulados.jsx';
import Provas from './pages/Provas.jsx';
import Desempenho from './pages/Desempenho.jsx';
import FlashCards from './pages/FlashCards.jsx';
import Perfil from './pages/Perfil.jsx';

import AdminUsuarios from './pages/AdminUsuarios.jsx';
import AdminSimulados from './pages/AdminSimulados.jsx';
import AdminFlashCards from './pages/AdminFlashCards.jsx';

import XPToast from './components/XPToast.jsx';

export default function App() {
  return (
    <>
      <XPToast />

      <Routes>

        {/* ============================
            ROTA INICIAL
        ============================ */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* ============================
            LOGIN
        ============================ */}

        <Route
          path="/login"
          element={<Auth />}
        />

        {/* ============================
            ÁREA PROTEGIDA DO ALUNO
        ============================ */}

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>

            <Route
              path="/home"
              element={<Home />}
            />

            <Route
              path="/mural"
              element={<Mural />}
            />

            <Route
              path="/cronograma"
              element={<Cronograma />}
            />

            <Route
              path="/simulados"
              element={<Simulados />}
            />

            <Route
              path="/provas"
              element={<Provas />}
            />

            <Route
              path="/desempenho"
              element={<Desempenho />}
            />

            <Route
              path="/flashcards"
              element={<FlashCards />}
            />

            <Route
              path="/perfil"
              element={<Perfil />}
            />

          </Route>
        </Route>

        {/* ============================
            ÁREA PROTEGIDA DO ADMIN
        ============================ */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>

            <Route
              path="/admin/usuarios"
              element={<AdminUsuarios />}
            />

            <Route
              path="/admin/simulados"
              element={<AdminSimulados />}
            />

            <Route
              path="/admin/flashcards"
              element={<AdminFlashCards />}
            />

          </Route>
        </Route>

        {/* ============================
            QUALQUER ROTA DESCONHECIDA
        ============================ */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </>
  );
}