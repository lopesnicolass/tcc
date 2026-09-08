import { NavLink, Link } from 'react-router-dom';
import logoIcon from '../assets/tenna_logo.png';

const NAV_SECTIONS = [
  {
    title: 'VISÃO GERAL',
    items: [
      {
        to: '/admin',
        label: 'Dashboard',
        icon: 'home',
        end: true,
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

  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
  ),

  arrowLeft: (
    <path d="M19 12H5m7-7-7 7 7 7" />
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
  return (
    <aside className="sidebar admin-sidebar">

      {/* =====================================================
          MARCA
          ===================================================== */}

      <div className="sidebar-brand admin-sidebar-brand">
        <img
          src={logoIcon}
          alt="Tenna"
          className="admin-sidebar-logo"
          style={{
            width: '145px',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>


      {/* =====================================================
          IDENTIFICAÇÃO DO ADMINISTRADOR
          ===================================================== */}

      <div
        className="admin-sidebar-status"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >

        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(33,150,243,0.18)',
            color: '#90CAF9',
            flexShrink: 0,
          }}
        >
          <Icon name="shield" size={16} />
        </div>

        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <strong
            style={{
              color: '#fff',
              fontSize: '12.5px',
              lineHeight: '1.2',
            }}
          >
            Área administrativa
          </strong>

          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '10.5px',
              marginTop: '3px',
            }}
          >
            Acesso autorizado
          </span>
        </div>

      </div>


      {/* =====================================================
          NAVEGAÇÃO
          ===================================================== */}

      <div
        className="admin-sidebar-navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          flex: 1,
        }}
      >

        {NAV_SECTIONS.map((section) => (

          <div
            className="admin-nav-section"
            key={section.title}
          >

            {/* Título da seção */}

            <div
              className="admin-nav-section-title"
              style={{
                padding: '0 12px',
                marginBottom: '8px',
                color: 'rgba(255,255,255,0.38)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {section.title}
            </div>


            {/* Itens */}

            <nav
              className="sidebar-nav admin-sidebar-nav"
              aria-label={section.title}
              style={{
                gap: '4px',
              }}
            >

              {section.items.map((item) => (

                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-link admin-sidebar-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                >

                  <span
                    className="admin-sidebar-icon"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={item.icon} size={19} />
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


      {/* =====================================================
          RODAPÉ DA SIDEBAR
          ===================================================== */}

      <div
        className="admin-sidebar-footer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >

        <Link
          to="/home"
          className="sidebar-link admin-back-link"
        >

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              flexShrink: 0,
            }}
          >
            <Icon name="arrowLeft" size={19} />
          </span>

          <span className="label">
            Voltar ao sistema
          </span>

        </Link>

      </div>

    </aside>
  );
}
