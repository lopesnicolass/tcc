import { NavLink, useNavigate } from "react-router-dom";
import { useGamification } from '../context/GamificationContext.jsx';
import logoIcon from '../assets/tenna_logo.png';

const NAV_ITEMS = [
  { to: '/home', label: 'Início', icon: 'home' },
  { to: '/mural', label: 'Mural', icon: 'mural' },
  { to: '/cronograma', label: 'Cronograma', icon: 'calendar' },
  { to: '/simulados', label: 'Simulados', icon: 'check' },
  { to: '/provas', label: 'Provas', icon: 'file' },
  { to: '/desempenho', label: 'Desempenho', icon: 'chart' },
  { to: '/flashcards', label: 'FlashCards', icon: 'layers' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
];

const ICONS = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" />,
  mural: <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
  calendar: <path d="M4 9h16M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  check: <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />,
  file: <path d="M7 3h7l5 5v13H7V3Zm6 0v5h5M9 12h6M9 16h6" />,
  chart: <path d="M4 20V10M11 20V4M18 20v-7" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
};

export default function Sidebar() {
  const { streak } = useGamification();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
  <img src={logoIcon} alt="Tenna" className="sidebar-logo-full" />
</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {ICONS[item.icon]}
            </svg>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

<div className="sidebar-streak">
        <span className="sidebar-streak-icon">🔥</span>
        <div>
          <div className="sidebar-streak-num">{streak}</div>
          <div className="sidebar-streak-label">dias seguidos</div>
        </div>
      </div>

    </aside>
  );
}