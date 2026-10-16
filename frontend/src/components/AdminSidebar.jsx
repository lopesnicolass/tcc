import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import logoIcon from '../assets/tenna_logo.webp';
import ThemeToggle from './ThemeToggle.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'home' },
  { to: '/admin/conteudos', label: 'Conteúdos', icon: 'book' },
  { to: '/admin/simulados', label: 'Simulados', icon: 'check' },
  { to: '/admin/provas', label: 'Provas anteriores', icon: 'file' },
  { to: '/admin/cronogramas', label: 'Cronogramas', icon: 'calendar' },
  { to: '/admin/calendario', label: 'Calendário', icon: 'calendar' },
  { to: '/admin/flashcards', label: 'FlashCards', icon: 'layers' },
  { to: '/admin/usuarios', label: 'Usuários', icon: 'user' },
];

const ICONS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />
  ),
  book: (
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
  ),
  check: (
    <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />
  ),
  layers: (
    <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
  ),
  file: (
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h6" />
  ),
  calendar: (
    <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 4h14M8 3v4m8-4v4" />
  ),
  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
  ),
  eye: (
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  ),
  shield: (
    <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z" />
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export default function AdminSidebar({ mobileOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const fecharRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('tenna_admin_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('tenna_admin_sidebar_collapsed', String(collapsed)); }
    catch { /* Mantém a preferência durante a sessão. */ }
  }, [collapsed]);

  useEffect(() => {
    if (mobileOpen) fecharRef.current?.focus();
  }, [mobileOpen]);

  const abrirVisaoEstudante = () => {
    sessionStorage.setItem('etecamp_admin_preview', 'true');
    onClose();
    navigate('/home');
  };

  return (
    <aside id="tenna-admin-nav" aria-label="Menu administrativo" className={`sidebar admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand admin-sidebar-brand">
        <button type="button" className="tenna-mobile-drawer-close" ref={fecharRef} onClick={onClose} aria-label="Fechar menu">×</button>

        <div className="admin-sidebar-brand-shell">
          <img src={logoIcon} alt="Tenna" className="admin-sidebar-logo" />

        </div>
        <button type="button" className="sidebar-collapse-btn admin-sidebar-collapse-btn"
          onClick={() => setCollapsed(value => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Diminuir menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Diminuir menu'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
          </svg>
        </button>
      </div>

      <nav className="admin-sidebar-navigation" aria-label="Navegação administrativa">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/admin/conteudos'}
            onClick={onClose}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={({ isActive }) => `sidebar-link admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="admin-sidebar-icon"><Icon name={item.icon} size={19} /></span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-theme-toggle-wrap">
          <ThemeToggle className="admin-theme-toggle" />
        </div>

        <div className="admin-preview-card">
          <button
            type="button"
            className="sidebar-link admin-preview-link"
            onClick={abrirVisaoEstudante}
            title="Visualizar o site como estudante"
          >
            <span className="admin-preview-icon">
              <Icon name="eye" size={19} />
            </span>

            <span className="label">
              Visualizar como estudante
            </span>
          </button>

        </div>
      </div>
    </aside>
  );
}
