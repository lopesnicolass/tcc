import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import '../styles/dashboard.css';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminPreview, setIsAdminPreview] = useState(() =>
    sessionStorage.getItem('etecamp_admin_preview') === 'true'
  );

  const ocultarSidebar = /^\/conteudos\/\d+\/?$/.test(location.pathname);

  const voltarParaAdministracao = () => {
    sessionStorage.removeItem('etecamp_admin_preview');
    setIsAdminPreview(false);
    navigate('/admin');
  };

  return (
    <div
      className={`dashboard student-area ${
        ocultarSidebar ? 'dashboard-sem-sidebar' : ''
      }`}
    >
      {!ocultarSidebar && <Sidebar />}

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

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
