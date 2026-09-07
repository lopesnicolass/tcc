import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'home' },
  { to: '/admin/conteudos', label: 'Conteúdos', icon: 'book' },
  { to: '/admin/usuarios', label: 'Usuários', icon: 'user' },
  { to: '/admin/simulados', label: 'Simulados', icon: 'check' },
  { to: '/admin/flashcards', label: 'FlashCards', icon: 'layers' },
  { to: '/admin/provas', label: 'Provas Anteriores', icon: 'file' },
  
];

const ICONS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />
  ),

  calendar: (
    <path d="M5 4h14v17H5V4Zm3-2v4m8-4v4M5 9h14M8 13h3m-3 4h5" />
  ),

  book: (
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
  ),

  target: (
    <path d="M12 21a9 9 0 1 0-9-9m9 5a5 5 0 1 0-5-5m5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 0 6-6" />
  ),

  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
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
};

export default function AdminSidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="logo-mark">A</div>

        <div className="sidebar-brand-text">
          <strong>VESTIBULINHO</strong>
          <span>Painel do Administrador</span>
        </div>

      </div>

      <nav className="sidebar-nav">

        {NAV_ITEMS.map((item) => (

          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[item.icon]}
            </svg>

            <span className="label">
              {item.label}
            </span>

          </NavLink>

        ))}

      </nav>

    </aside>
  );
}