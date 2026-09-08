import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useGamification } from '../context/GamificationContext.jsx';
import logoIcon from '../assets/tenna_logo.png';


const NAV_ITEMS = [
  { to: '/home', label: 'Início', icon: 'home' },
  { to: '/mural', label: 'Mural', icon: 'mural' },
  { to: '/conteudos', label: 'Conteúdos', icon: 'book' },
  { to: '/cronograma', label: 'Meu calendário', icon: 'calendar' },
  { to: '/plano-automatico', label: 'Plano automático', icon: 'target' },
  { to: '/simulados', label: 'Simulados', icon: 'check' },
  { to: '/provas', label: 'Provas', icon: 'file' },
  { to: '/desempenho', label: 'Desempenho', icon: 'chart' },
  { to: '/flashcards', label: 'FlashCards', icon: 'layers' },
  {
  to: '/terrario',
  label: 'Terrário',
  icon: 'terrarium'
},
  { to: '/perfil', label: 'Perfil', icon: 'user' },
];

const ICONS = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" />,
  mural: <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
  book: <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17ZM5 4.5v17M9 6h7M9 10h7M9 14h5" />,
  target: <path d="M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 10a2 2 0 1 0 2 2" />,
  calendar: <path d="M4 9h16M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  check: <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />,
  file: <path d="M7 3h7l5 5v13H7V3Zm6 0v5h5M9 12h6M9 16h6" />,
  chart: <path d="M4 20V10M11 20V4M18 20v-7" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
 terrarium: (
  <path d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-5h6v5M8 10h.01M16 10h.01" />
),
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
};

export default function Sidebar() {
  const { streak } = useGamification();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <img src={logoIcon} alt="Tenna" className="sidebar-logo-full" />
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Diminuir menu'}
          title={collapsed ? 'Expandir menu' : 'Diminuir menu'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
          </svg>
        </button>
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

{(() => {
        const streakValue = Math.max(0, Number(streak) || 0);
        const streakProgress = Math.min(streakValue, 7);
        const streakRemaining = Math.max(7 - streakValue, 0);
        const progressPercent = (streakProgress / 7) * 100;

        return (
          <div
            className={`sidebar-streak ${streakValue >= 7 ? 'sidebar-streak-complete' : ''}`}
            title={streakValue >= 7
              ? 'Meta de 7 dias alcançada!'
              : `Faltam ${streakRemaining} dias para 7`}
          >
            <div className="sidebar-streak-visual" aria-hidden="true">
              <span className="sidebar-streak-spark spark-1">✦</span>
              <span className="sidebar-streak-spark spark-2">✦</span>
              <span className="sidebar-streak-spark spark-3">✦</span>
              <span className="sidebar-streak-glow" />

              <svg className="sidebar-streak-flame" viewBox="0 0 48 56" fill="none">
                <path
                  d="M25.8 2.8c1.8 9.1-5.4 13.1-9.1 18.3-2.7 3.8-3.4 7.4-1.5 10.7 1.2-3.9 3.6-6.4 6.7-8.4-.4 6.1 3.9 8.2 5.6 12.1 1.1 2.5 1 5.2-.1 7.6 4.6-2.8 7.1-7.1 6.5-12.5-.6-5.6-4.7-9.1-5.5-13.7-.5-3.1.4-7.2-2.6-14.1Z"
                  fill="currentColor"
                />
                <path
                  d="M18.2 31.9c-3.7 4.5-4.2 9.4-1.1 13.7 2.2 3.1 5.8 4.7 9.2 4.7 5.9 0 10.7-4.8 10.7-10.7 0-2.9-1.2-5.6-3.2-7.5.3 5.3-2.4 8.8-6.4 9.9 1.1-4.2-.8-7.2-3.4-9.7-1.7-1.6-3.1-3.4-3.1-5.8-1.1 1.6-1.9 3.3-2.7 5.4Z"
                  fill="currentColor"
                  opacity=".7"
                />
                <circle cx="24" cy="43" r="1.8" fill="#FFC93C" />
                <circle cx="31" cy="39" r="1.3" fill="#FFC93C" />
              </svg>
            </div>

            <div className="sidebar-streak-content">
              <div className="sidebar-streak-heading">
                <strong>{streakValue}</strong>
                <span>{streakValue === 1 ? 'dia' : 'dias'}</span>
              </div>

              <div className="sidebar-streak-label">
                de sequência <span aria-hidden="true">🔥</span>
              </div>

              <div className="sidebar-streak-progress" aria-label={`${streakProgress} de 7 dias`}>
                <div
                  className="sidebar-streak-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
                <div className="sidebar-streak-dots">
                  {Array.from({ length: 7 }, (_, index) => (
                    <span
                      key={index}
                      className={index < streakProgress ? 'is-complete' : ''}
                    />
                  ))}
                </div>
              </div>

              <div className="sidebar-streak-message">
                {streakValue >= 7
                  ? 'Meta de 7 dias alcançada! 🔥'
                  : `Faltam ${streakRemaining} dias para 7 🔥`}
              </div>
            </div>

            <span className="sidebar-streak-arrow" aria-hidden="true">›</span>
          </div>
        );
      })()}

    </aside>
  );
}