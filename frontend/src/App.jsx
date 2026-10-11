import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

import Landing from './pages/public/Landing.jsx';
import Auth from './pages/public/Auth.jsx';
const EsqueciSenha = lazy(() => import('./pages/public/EsqueciSenha.jsx'));
const RedefinirSenha = lazy(() => import('./pages/public/RedefinirSenha.jsx'));

import DashboardLayout from './layouts/DashboardLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import XPToast from './components/XPToast.jsx';

const Home = lazy(() => import('./pages/aluno/Home.jsx'));
const Mural = lazy(() => import('./pages/aluno/Mural.jsx'));
const Cronograma = lazy(() => import('./pages/aluno/Cronograma.jsx'));
const PlanoAutomatico = lazy(() => import('./pages/aluno/PlanoAutomatico.jsx'));
const Conteudos = lazy(() => import('./pages/aluno/Conteudos.jsx'));
const PaginaConteudo = lazy(() => import('./pages/aluno/PaginaConteudo.jsx'));
const Simulados = lazy(() => import('./pages/aluno/Simulados.jsx'));
const Provas = lazy(() => import('./pages/aluno/Provas.jsx'));
const Desempenho = lazy(() => import('./pages/aluno/Desempenho.jsx'));
const FlashCards = lazy(() => import('./pages/aluno/FlashCards.jsx'));
const Perfil = lazy(() => import('./pages/aluno/Perfil.jsx'));

const Terrario = lazy(() => import('./terrario/Terrario.jsx'));

const AdminDashboard = lazy(() => import('./pages/adm/AdminDashboard.jsx'));
const AdminUsuarios = lazy(() => import('./pages/adm/AdminUsuarios.jsx'));
const AdminSimulados = lazy(() => import('./pages/adm/AdminSimulados.jsx'));
const AdminFlashCards = lazy(() => import('./pages/adm/AdminFlashCards.jsx'));
const AdminProvas = lazy(() => import('./pages/adm/AdminProvas.jsx'));
const AdminConteudos = lazy(() => import('./pages/adm/AdminConteudos.jsx'));
const AdminCronogramas = lazy(() => import('./pages/adm/AdminCronogramas.jsx'));
const AdminCalendario = lazy(() => import('./pages/adm/AdminCalendario.jsx'));

export default function App() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tenna_theme');
      const theme = saved === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  return (
    <>
      <XPToast />

      <Suspense fallback={<div className="rota-carregando" role="status" aria-live="polite">Carregando…</div>}>
      <Routes>

        {/* PÁGINAS PÚBLICAS */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Auth />}
        />

        <Route
          path="/esqueci-senha"
          element={<EsqueciSenha />}
        />

        <Route
          path="/redefinir-senha"
          element={<RedefinirSenha />}
        />

        {/* ÁREA PROTEGIDA */}

        <Route element={<ProtectedRoute />}>

          {/* ÁREA DO ALUNO */}

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
              path="/conteudos"
              element={<Conteudos />}
            />

            {/* PÁGINA DE ESTUDO DO TÓPICO */}

            <Route
              path="/conteudos/:topicoId"
              element={<PaginaConteudo />}
            />

            <Route
              path="/cronograma"
              element={<Cronograma />}
            />

            <Route
              path="/plano-automatico"
              element={<PlanoAutomatico />}
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
              path="/terrario"
              element={<Terrario />}
            />

            <Route
              path="/perfil"
              element={<Perfil />}
            />

          </Route>

          {/* ÁREA DO ADMIN */}

          <Route element={<AdminRoute />}>

            <Route
              path="/admin"
              element={<AdminLayout />}
            >

              <Route
                index
                element={<AdminDashboard />}
              />

              <Route
                path="conteudos"
                element={<AdminConteudos />}
              />

              <Route
                path="simulados"
                element={<AdminSimulados />}
              />

              <Route
                path="provas"
                element={<AdminProvas />}
              />

              <Route
                path="cronogramas"
                element={<AdminCronogramas />}
              />

              <Route
                path="calendario"
                element={<AdminCalendario />}
              />

              <Route
                path="flashcards"
                element={<AdminFlashCards />}
              />

              <Route
                path="usuarios"
                element={<AdminUsuarios />}
              />

            </Route>

          </Route>

        </Route>

        {/* ROTA DESCONHECIDA */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
      </Suspense>
    </>
  );
}