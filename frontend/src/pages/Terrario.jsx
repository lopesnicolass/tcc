import { useGamification } from '../context/GamificationContext.jsx';
import AntTerrarium from '../components/AntTerrarium.jsx';

export default function Terrario() {
  const {
    xp,
    level,
    title,
    streak
  } = useGamification();

  return (
    <div className="terrario-page">

      <header className="terrario-header">

        <div>
          <span className="terrario-kicker">
            MEU TERRÁRIO
          </span>

          <h1>
            Minha Colônia 🐜
          </h1>

          <p>
            Sua evolução nos estudos
            também faz sua colônia crescer.
          </p>
        </div>

        <div className="terrario-level">

          <span>
            Nível {level}
          </span>

          <strong>
            {title}
          </strong>

          <small>
            {xp} XP
          </small>

        </div>

      </header>

      <section className="terrario-stats">

               <div className="terrario-stat">
          <span>🐜</span>

          <div>
            <strong>{Math.max(1, Math.min(level, 10))}</strong>
            <small>formigas</small>
          </div>
        </div>

        <div className="terrario-stat">
          <span>🥚</span>

          <div>
            <strong>{Math.max(0, level - 1)}</strong>
            <small>ovos</small>
          </div>
        </div>

        <div className="terrario-stat">
          <span>🔥</span>

          <div>
            <strong>{streak}</strong>
            <small>dias seguidos</small>
          </div>
        </div>

        <div className="terrario-stat">
          <span>⭐</span>

          <div>
            <strong>{level}</strong>
            <small>evolução</small>
          </div>
        </div>

      </section>

      <section className="terrario-game-card">

        <div className="terrario-game-top">

          <div>
            <strong>
              Colônia ativa
            </strong>

            <span>
              Observe suas formigas trabalhando.
            </span>
          </div>

          <div className="terrario-live">
            <i />
            VIVA
          </div>

        </div>

        <AntTerrarium level={level} />

        <div className="terrario-game-footer">

          <span>
            🐜 Sua colônia está viva
          </span>

          <span>
            {xp} XP acumulados
          </span>

        </div>

      </section>

    </div>
  );
}