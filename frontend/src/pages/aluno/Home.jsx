import '../../styles/aluno/Home.css';
import { useEffect, useState } from 'react';
import { useGamification } from '../../context/GamificationContext.jsx';
import {
  LEVEL_TITLES,
  xpForLevel
} from '../../context/GamificationContext.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DESEMPENHOS_INICIAIS = [
  {
    materia: 'Português',
    percentual: 68
  },
  {
    materia: 'Matemática',
    percentual: 54
  },
  {
    materia: 'Ciências',
    percentual: 63
  },
  {
    materia: 'História',
    percentual: 71
  },
  {
    materia: 'Geografia',
    percentual: 59
  }
];

export default function Home() {
  const {
    level,
    title,
    xp,
    xpIntoLevel,
    xpForNext
  } = useGamification();

  const [showLevels, setShowLevels] = useState(false);
  const [proximasAtividades, setProximasAtividades] = useState([]);
  const [carregandoAtividades, setCarregandoAtividades] =
    useState(true);

  const usuarioSalvo =
    localStorage.getItem('etecamp_usuario');

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : null;

  const primeiroNome =
    usuario?.nome?.split(' ')[0] || 'Aluno';

  const usuarioId = usuario?.id;

  useEffect(() => {
    async function carregarProximasAtividades() {
      if (!usuarioId) {
        setProximasAtividades([]);
        setCarregandoAtividades(false);
        return;
      }

      try {
        const token =
          localStorage.getItem('etecamp_token');

        const resposta = await fetch(
          `${API_URL}/cronograma/${usuarioId}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`
                }
              : {}
          }
        );

        if (!resposta.ok) {
          throw new Error(
            `Erro ao carregar cronograma: ${resposta.status}`
          );
        }

        const dados = await resposta.json();

        let atividades = [];

        if (Array.isArray(dados)) {
          atividades = dados;
        } else if (Array.isArray(dados.atividades)) {
          atividades = dados.atividades;
        } else if (Array.isArray(dados.cronograma)) {
          atividades = dados.cronograma;
        } else if (Array.isArray(dados.data)) {
          atividades = dados.data;
        }

        const agora = new Date();

        const futuras = atividades
          .filter((atividade) => {
            if (!atividade?.data) {
              return false;
            }

            const concluida =
              atividade.concluida === true ||
              atividade.concluida === 1 ||
              atividade.concluida === '1' ||
              atividade.done === true;

            if (concluida) {
              return false;
            }

            return dataDaAtividadeAindaVigente(
              atividade,
              agora
            );
          })
          .sort((a, b) => {
            return obterDataOrdenacao(a)
              - obterDataOrdenacao(b);
          })
          .slice(0, 4);

        setProximasAtividades(futuras);
      } catch (erro) {
        console.error(
          'Erro ao carregar próximas atividades:',
          erro
        );

        setProximasAtividades([]);
      } finally {
        setCarregandoAtividades(false);
      }
    }

    carregarProximasAtividades();
  }, [usuarioId]);

  function dataDaAtividadeAindaVigente(
    atividade,
    agora
  ) {
    const dataAtividade =
      criarDataAtividade(atividade);

    if (!dataAtividade) {
      return false;
    }

    return dataAtividade >= agora;
  }

  function criarDataAtividade(atividade) {
    if (!atividade?.data) {
      return null;
    }

    const dataTexto =
      String(atividade.data).trim();

    let ano;
    let mes;
    let dia;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
      [ano, mes, dia] =
        dataTexto.split('-').map(Number);
    } else if (
      /^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)
    ) {
      [dia, mes, ano] =
        dataTexto.split('/').map(Number);
    } else {
      return null;
    }

    const horario =
      String(
        atividade.horario || '23:59'
      );

    const [horaTexto, minutoTexto] =
      horario.split(':');

    const hora =
      Number(horaTexto) || 0;

    const minuto =
      Number(minutoTexto) || 0;

    const resultado =
      new Date(
        ano,
        mes - 1,
        dia,
        hora,
        minuto,
        0,
        0
      );

    if (Number.isNaN(resultado.getTime())) {
      return null;
    }

    return resultado;
  }

  function obterDataOrdenacao(atividade) {
    const data =
      criarDataAtividade(atividade);

    return data
      ? data.getTime()
      : Number.MAX_SAFE_INTEGER;
  }

  function formatarData(data) {
    if (!data) {
      return '';
    }

    const texto =
      String(data).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes, dia] =
        texto.split('-');

      return `${dia}/${mes}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      return texto.slice(0, 5);
    }

    return texto;
  }

  function obterStatusData(atividade) {
    const data =
      criarDataAtividade(atividade);

    if (!data) {
      return '';
    }

    const agora = new Date();

    const hoje =
      new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

    const dataSemHorario =
      new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
      );

    const diferenca =
      Math.round(
        (
          dataSemHorario.getTime()
          - hoje.getTime()
        ) /
        (1000 * 60 * 60 * 24)
      );

    if (diferenca === 0) {
      return 'Hoje';
    }

    if (diferenca === 1) {
      return 'Amanhã';
    }

    return '';
  }

  return (
    <div className="home-page">
      {/* =====================================================
          HERO
          ===================================================== */}

      <div className="home-hero">
        <div className="home-hero-text">
          <h1>
            Olá, {primeiroNome}!
          </h1>

          <p>
            Continue seus estudos e alcance seus objetivos!
          </p>
        </div>

        <div className="home-hero-progress">
          <div
            className="home-hero-level home-hero-level-clickable"
            onClick={() => setShowLevels(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {
                setShowLevels(true);
              }
            }}
          >
            <div className="home-hero-level-badge">
              {level}
            </div>

            <div className="home-hero-level-text">
              <strong>
                {title}
              </strong>

              <span>
                Nível {level}
              </span>
            </div>
          </div>

          <div className="home-hero-xp">
            <div className="home-hero-xp-label">
              <span>
                {xpIntoLevel} / {xpForNext} XP
              </span>

              <span>
                {xp} XP total
              </span>
            </div>

            <div className="home-hero-xp-track">
              <div
                className="home-hero-xp-fill"
                style={{
                  width: `${Math.min(
                    (
                      xpIntoLevel /
                      xpForNext
                    ) * 100,
                    100
                  )}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ESTATÍSTICAS
          ===================================================== */}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 9h16M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            </svg>
          </div>

          <div className="stat-value">
            45
          </div>

          <div className="stat-label">
            Dias até o Vestibulinho
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0V4Z" />
            </svg>
          </div>

          <div className="stat-value">
            3
          </div>

          <div className="stat-label">
            Simulados realizados
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path d="M9 12.5 11 14.5 15.5 10" />
            </svg>
          </div>

          <div className="stat-value">
            61%
          </div>

          <div className="stat-label">
            Progresso geral
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTEÚDO DA HOME
          ===================================================== */}

      <div className="home-grid">
        {/* ===================================================
            PROGRESSO POR MATÉRIA
            =================================================== */}

        <div className="panel-card home-performance-card">
          <div className="home-panel-heading">
            <div>
              <h3>
                Progresso por matéria
              </h3>

              <p>
                Seu desempenho inicial em cada área
              </p>
            </div>
          </div>

          <div className="performance-chart">
            {DESEMPENHOS_INICIAIS.map(
              (item) => (
                <div
                  className="performance-row"
                  key={item.materia}
                >
                  <div className="performance-row-top">
                    <span className="performance-subject">
                      {item.materia}
                    </span>

                    <span className="performance-value">
                      {item.percentual}%
                    </span>
                  </div>

                  <div className="performance-track">
                    <div
                      className="performance-fill"
                      style={{
                        width:
                          `${item.percentual}%`
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ===================================================
            PRÓXIMAS ATIVIDADES
            =================================================== */}

        <div className="panel-card home-activities-card">
          <div className="home-panel-heading">
            <div>
              <h3>
                Próximas atividades
              </h3>

              <p>
                O que está programado para você
              </p>
            </div>
          </div>

          {carregandoAtividades ? (
            <div className="activities-empty-message">
              <span>
                Carregando suas próximas atividades...
              </span>
            </div>
          ) : proximasAtividades.length === 0 ? (
            <div className="activities-empty-message">
              <span>
                Você não tem próximas atividades.
              </span>
            </div>
          ) : (
            <div className="activity-list">
              {proximasAtividades.map(
                (atividade) => {
                  const status =
                    obterStatusData(
                      atividade
                    );

                  return (
                    <div
                      className="activity-item"
                      key={atividade.id}
                    >
                      <div className="activity-item-info">
                        <span className="activity-name">
                          {atividade.nome}
                        </span>

                        <span className="activity-subject">
                          {atividade.materia}
                        </span>
                      </div>

                      <div className="activity-item-date">
                        {status && (
                          <span className="activity-status">
                            {status}
                          </span>
                        )}

                        <span className="date">
                          {formatarData(
                            atividade.data
                          )}
                        </span>

                        {atividade.horario && (
                          <span className="time">
                            {atividade.horario}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          MODAL DE NÍVEIS
          ===================================================== */}

      {showLevels && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowLevels(false)
          }
        >
          <div
            className="modal-card levels-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <h2>
                Níveis e XP
              </h2>

              <p>
                Veja quanto XP falta pra subir de nível.
              </p>
            </div>

            <div className="levels-list">
              {LEVEL_TITLES.map(
                (nivelTitulo, index) => {
                  const nivel =
                    index + 1;

                  return (
                    <div
                      key={nivel}
                      className={`levels-row ${
                        nivel === level
                          ? 'current'
                          : ''
                      }`}
                    >
                      <div className="levels-row-badge">
                        {nivel}
                      </div>

                      <div className="levels-row-info">
                        <strong>
                          {nivelTitulo}
                        </strong>

                        <span>
                          Nível {nivel}
                        </span>
                      </div>

                      <div className="levels-row-xp">
                        {xpForLevel(nivel)} XP
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary landing-cta"
                onClick={() =>
                  setShowLevels(false)
                }
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}