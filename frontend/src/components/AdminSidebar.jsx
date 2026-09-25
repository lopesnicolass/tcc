import { NavLink, useNavigate } from 'react-router-dom';
import logoIcon from '../assets/tenna_logo.png';
import ThemeToggle from './ThemeToggle.jsx';

const NAV_SECTIONS = [
  {
    title: 'VISÃO GERAL',
    items: [
      {
        to: '/admin',
        label: 'Dashboard',
        icon: 'home',
      },
    ],
  },

  {
    title: 'CONTEÚDO',
    items: [
      {
        to: '/admin/conteudos',
        label: 'Conteúdos',
        icon: 'book',
      },
      {
        to: '/admin/simulados',
        label: 'Simulados',
        icon: 'check',
      },
      {
        to: '/admin/provas',
        label: 'Provas anteriores',
        icon: 'file',
      },
      {
        to: '/admin/cronogramas',
        label: 'Cronogramas',
        icon: 'calendar',
      },
      {
        to: '/admin/calendario',
        label: 'Calendário',
        icon: 'calendar',
      },
      {
        to: '/admin/flashcards',
        label: 'FlashCards',
        icon: 'layers',
      },
    ],
  },

  {
    title: 'USUÁRIOS',
    items: [
      {
        to: '/admin/usuarios',
        label: 'Usuários',
        icon: 'user',
      },
    ],
  },
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

export default function AdminSidebar() {
  const navigate = useNavigate();

  const abrirVisaoEstudante = () => {
    sessionStorage.setItem('etecamp_admin_preview', 'true');
    navigate('/home');
  };

  return (
    <aside className="sidebar admin-sidebar">

      {/* LOGO */}

      <div className="sidebar-brand admin-sidebar-brand">
        <img
          src={logoIcon}
          alt="Tenna"
          className="admin-sidebar-logo"
        />
      </div>

      {/* STATUS */}

      <div className="admin-sidebar-status">
        <div className="admin-sidebar-status-icon">
          <Icon name="shield" size={16} />
        </div>

        <div className="admin-sidebar-status-copy">
          <strong className="admin-sidebar-status-title">
            Área administrativa
          </strong>

          <span className="admin-sidebar-status-subtitle">
            Acesso autorizado
          </span>
        </div>
      </div>

      {/* NAVEGAÇÃO */}

      <div className="admin-sidebar-navigation">
        {NAV_SECTIONS.map((section) => (
          <div
            className="admin-nav-section"
            key={section.title}
          >
            <div className="admin-nav-section-title">
              {section.title}
            </div>

            <nav
              className="sidebar-nav admin-sidebar-nav"
              aria-label={section.title}
            >
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={
                    item.to === '/admin' ||
                    item.to === '/admin/conteudos'
                  }
                  className={({ isActive }) =>
                    `sidebar-link admin-sidebar-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                >
                  <span className="admin-sidebar-icon">
                    <Icon
                      name={item.icon}
                      size={19}
                    />
                  </span>

                  <span className="label">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* VISUALIZAÇÃO DO ESTUDANTE */}

      <div className="admin-sidebar-footer">
        <div className="admin-theme-toggle-wrap">
          <ThemeToggle className="admin-theme-toggle" />
        </div>

        <button
          type="button"
          className="sidebar-link admin-preview-link"
          onClick={abrirVisaoEstudante}
          title="Visualizar o site como estudante"
        >
          <span className="admin-preview-icon">
            <Icon
              name="eye"
              size={19}
            />
          </span>

          <span className="label">
            Visualizar como estudante
          </span>
        </button>
      </div>

    </aside>
  );
}