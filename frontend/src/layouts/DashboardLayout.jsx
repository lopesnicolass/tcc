import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import MobileNavigationBar from '../components/MobileNavigationBar.jsx';
import '../styles/dashboard.css';
import '../styles/mobile-responsive.css';
import '../styles/student-sidebar-refined.css';
import '../styles/focus-clean-view.css';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Tela limpa é uma escolha do aluno, não uma barra que invade a leitura.
  // O menu continua montado para preservar a observação da sessão/pausa automática.
  const [focusRunning, setFocusRunning] = useState(false);
  const [cleanFocus, setCleanFocus] = useState(false);
  const onFocusRunningChange = useCallback((running) => {
    setFocusRunning(running);
    if (!running) setCleanFocus(false);
  }, []);
  const alternarTelaLimpa = useCallback(() => {
    setCleanFocus((anterior) => !anterior);
  }, []);

  useEffect(() => {
    if (!cleanFocus) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setCleanFocus(false);
    };
    const media = window.matchMedia('(max-width: 760px)');
    const onBreakPoint = () => { if (media.matches) setCleanFocus(false); };
    onBreakPoint();
    document.addEventListener('keydown', onKeyDown);
    media.addEventListener('change', onBreakPoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      media.removeEventListener('change', onBreakPoint);
    };
  }, [cleanFocus]);

  const [isAdminPreview, setIsAdminPreview] = useState(() =>
    sessionStorage.getItem('etecamp_admin_preview') === 'true'
  );

  useEffect(() => {
    const fechar = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(fechar);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('tenna-mobile-menu-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('tenna-mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  const voltarParaAdministracao = () => {
    sessionStorage.removeItem('etecamp_admin_preview');
    setIsAdminPreview(false);
    navigate('/admin');
  };

  return (
    <div
      className={`dashboard student-area ${cleanFocus && focusRunning ? 'is-focus-clean' : ''}`}
    >
      <>
          <MobileNavigationBar label="Estudante" menuId="tenna-student-nav" expanded={mobileMenuOpen} onOpen={() => setMobileMenuOpen(true)} />
          {mobileMenuOpen && <button type="button" className="tenna-mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
          <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
            onFocusRunningChange={onFocusRunningChange}
            onToggleCleanFocus={alternarTelaLimpa}
            cleanFocus={cleanFocus} />
        </>

      {isAdminPreview && (
        <div className="admin-preview-banner" role="status">
          <div className="admin-preview-banner-copy">
            <span className="admin-preview-banner-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            </span>
            <div>
              <strong>Visualização de estudante</strong>
              <span>Você está vendo o site como um aluno.</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-preview-return"
            onClick={voltarParaAdministracao}
          >
            Voltar para administração
          </button>
        </div>
      )}

      {cleanFocus && focusRunning && (
        <button type="button" className="tenna-focus-clean-exit"
          onClick={() => setCleanFocus(false)}
          aria-label="Mostrar menu de navegação"
          title="Mostrar menu (Esc)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
