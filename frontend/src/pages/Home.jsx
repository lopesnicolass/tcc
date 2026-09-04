import { useGamification } from '../context/GamificationContext.jsx';

export default function Home() {
  const { level, title, xp, xpIntoLevel, xpForNext } = useGamification();

  const usuarioSalvo = localStorage.getItem('etecamp_usuario');
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Aluno';

  return (

    <div>
      <div className="home-hero">
        <div className="home-hero-text">
          <h1>Olá, {primeiroNome}!</h1>
          <p>Continue seus estudos e alcance seus objetivos!</p>
        </div>

        <div className="home-hero-level">
          <div className="home-hero-level-badge">{level}</div>
          <div className="home-hero-level-text">
            <strong>{title}</strong>
            <span>Nível {level}</span>
          </div>
        </div>

        <div className="home-hero-xp">
          <div className="home-hero-xp-label">
            <span>{xpIntoLevel} / {xpForNext} XP</span>
            <span>{xp} XP total</span>
          </div>
          <div className="home-hero-xp-track">
            <div className="home-hero-xp-fill" style={{ width: `${(xpIntoLevel / xpForNext) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9h16M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /></svg>
          </div>
          <div className="stat-value">45</div>
          <div className="stat-label">Dias até o Vestibulinho</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0V4Z" /></svg>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-label">Simulados realizados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9 12.5 11 14.5 15.5 10" /></svg>
          </div>
          <div className="stat-value">73%</div>
          <div className="stat-label">Progresso geral</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel-card">
          <h3>Progresso por matéria</h3>
          <div className="chart-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V10M11 20V4M18 20v-7" /></svg>
          </div>
        </div>

        <div className="panel-card">
          <h3>Próximas atividades</h3>
          <div className="activity-list">
            <div className="activity-item"><span>Atividade 1</span><span className="date">04/09</span></div>
            <div className="activity-item"><span>Atividade 2</span><span className="date">05/09</span></div>
            <div className="activity-item"><span>Atividade 3</span><span className="date">07/09</span></div>
            <div className="activity-item"><span>Atividade 4</span><span className="date">08/09</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}