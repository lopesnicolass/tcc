import '../../styles/aluno/Home.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext.jsx';
import {
  LEVEL_TITLES,
  xpForLevel
} from '../../context/GamificationContext.jsx';
import Icon from '../../components/Icon.jsx';
import { API_URL, obterToken } from '../../services/api.js';
import { diasAteVestibulinho } from '../../utils/vestibulinho.js';
import { formatarData, obterStatusData, selecionarProximasAtividades } from '../../utils/homeAtividades.js';

function obterUsuario() {
  try {
    return JSON.parse(
      localStorage.getItem('etecamp_usuario') || '{}'
    );
  } catch {
    return {};
  }
}

function normalizarTopicos(materias) {
  return (Array.isArray(materias) ? materias : []).flatMap(
    (materia) =>
      (Array.isArray(materia.topicos)
        ? materia.topicos
        : []
      ).map((topico) => ({
        ...topico,
        materia: materia.nome,
        materiaId: materia.id
      }))
  );
}

const CORES_PROGRESSO_MATERIA = {
  'Português': '#2196F3',
  'Língua Portuguesa': '#2196F3',
  'Matemática': '#E53935',
  'História': '#8D6E63',
  'Geografia': '#43A047',
  'Ciências': '#8E44AD',
  'Biologia': '#8E44AD',
};

function obterCorProgressoMateria(materia = '') {
  if (CORES_PROGRESSO_MATERIA[materia]) {
    return CORES_PROGRESSO_MATERIA[materia];
  }

  const entrada = String(materia).toLowerCase();
  const encontrada = Object.keys(CORES_PROGRESSO_MATERIA).find(
    (nome) =>
      entrada.includes(nome.toLowerCase()) ||
      nome.toLowerCase().includes(entrada)
  );

  return encontrada
    ? CORES_PROGRESSO_MATERIA[encontrada]
    : '#2196F3';
}

export default function Home() {
  const navigate = useNavigate();

  const {
    level,
    title,
    xp,
    xpIntoLevel,
    xpForNext
  } = useGamification();

  const [showLevels, setShowLevels] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState('');
  const [tentativasResumo, setTentativasResumo] = useState(0);

  const [materiasData, setMateriasData] = useState([]);
  const [estudados, setEstudados] = useState({});
  const [desempenho, setDesempenho] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [proximasAtividades, setProximasAtividades] = useState([]);
  const [dataVestibulinho, setDataVestibulinho] = useState(null);

  const usuario = obterUsuario();
  const primeiroNome =
    usuario?.nome?.split(' ')[0] || 'Aluno';
  const usuarioId = Number(
    usuario?.id || usuario?.usuarioId || 0
  );

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      try {
        setCarregandoResumo(true);
        setErroResumo('');

        const token = obterToken();

        if (!token) {
          throw new Error(
            'Sua sessão não foi encontrada. Faça login novamente.'
          );
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        const requisicoes = [
          fetch(`${API_URL}/conteudos/publico`),
          fetch(`${API_URL}/conteudos/progresso`, { headers }),
          fetch(`${API_URL}/resultados/me/desempenho`, { headers }),
          fetch(`${API_URL}/resultados/me`, { headers }),
          fetch(`${API_URL}/calendario/vestibulinho`)
        ];

        if (usuarioId > 0) {
          requisicoes.push(
            fetch(`${API_URL}/cronograma/${usuarioId}`, {
              headers
            })
          );
        }

        const respostas = await Promise.all(requisicoes);
        const [
          respostaConteudos,
          respostaProgresso,
          respostaDesempenho,
          respostaResultados,
          respostaCalendario,
          respostaCronograma
        ] = respostas;

        const [
          dadosConteudos,
          dadosProgresso,
          dadosDesempenho,
          dadosResultados,
          dadosCalendario,
          dadosCronograma
        ] = await Promise.all(
          respostas.map((resposta) =>
            resposta.json().catch(() => ({}))
          )
        );

        if (!respostaConteudos.ok) {
          throw new Error(
            dadosConteudos.erro ||
              dadosConteudos.mensagem ||
              'Não foi possível carregar os conteúdos.'
          );
        }

        if (!respostaProgresso.ok) {
          throw new Error(
            dadosProgresso.erro ||
              dadosProgresso.mensagem ||
              'Não foi possível carregar seu progresso.'
          );
        }

        if (!respostaDesempenho.ok) {
          throw new Error(
            dadosDesempenho.mensagem ||
              'Não foi possível carregar seu desempenho.'
          );
        }

        if (!respostaResultados.ok) {
          throw new Error(
            dadosResultados.mensagem ||
              'Não foi possível carregar seu histórico.'
          );
        }

        if (!ativo) {
          return;
        }

        const materias = Array.isArray(
          dadosConteudos?.materias
        )
          ? dadosConteudos.materias
          : [];

        const mapaProgresso = {};

        (Array.isArray(dadosProgresso?.topicos)
          ? dadosProgresso.topicos
          : []
        ).forEach((item) => {
          mapaProgresso[String(item.topico_id)] =
            Boolean(item.estudado);
        });

        let atividades = [];

        if (Array.isArray(dadosCronograma)) {
          atividades = dadosCronograma;
        } else if (Array.isArray(dadosCronograma?.atividades)) {
          atividades = dadosCronograma.atividades;
        } else if (Array.isArray(dadosCronograma?.cronograma)) {
          atividades = dadosCronograma.cronograma;
        } else if (Array.isArray(dadosCronograma?.data)) {
          atividades = dadosCronograma.data;
        }

        const futuras = selecionarProximasAtividades(atividades);

        setMateriasData(materias);
        setEstudados(mapaProgresso);
        setDesempenho(
          dadosDesempenho?.desempenho || null
        );
        setResultados(
          Array.isArray(dadosResultados?.resultados)
            ? dadosResultados.resultados
            : []
        );

        setDataVestibulinho(respostaCalendario.ok ? (dadosCalendario?.data || null) : null);
        setProximasAtividades(futuras);
      } catch (error) {
        console.error(
          'Erro ao carregar resumo da home:',
          error
        );

        if (ativo) {
          setErroResumo(
            error.message ||
              'Não foi possível carregar os dados da Home.'
          );
        }
      } finally {
        if (ativo) {
          setCarregandoResumo(false);
        }
      }
    }

    carregarResumo();

    const atualizar = () => {
      carregarResumo();
    };

    window.addEventListener(
      'etecamp-login',
      atualizar
    );

    return () => {
      ativo = false;
      window.removeEventListener(
        'etecamp-login',
        atualizar
      );
    };
  }, [usuarioId, tentativasResumo]);

  const topicos = useMemo(
    () => normalizarTopicos(materiasData),
    [materiasData]
  );

  const totalConteudos = topicos.length;

  const totalEstudados = topicos.filter(
    (topico) =>
      Boolean(estudados[String(topico.id)])
  ).length;

  const progressoGeral =
    totalConteudos > 0
      ? Math.round(
          (totalEstudados / totalConteudos) * 100
        )
      : 0;

  const progressoPorMateria = materiasData.map(
    (materia) => {
      const lista = Array.isArray(materia.topicos)
        ? materia.topicos
        : [];

      const estudadosMateria = lista.filter(
        (topico) =>
          Boolean(estudados[String(topico.id)])
      ).length;

      const percentual =
        lista.length > 0
          ? Math.round(
              (estudadosMateria / lista.length) *
                100
            )
          : 0;

      return {
        ...materia,
        total: lista.length,
        estudados: estudadosMateria,
        percentual
      };
    }
  );

  const totalSimulados = Number(
    desempenho?.totalSimulados || 0
  );

  const mediaGeral = Math.round(
    Number(desempenho?.mediaPorcentagem || 0)
  );

  const melhorResultado = Math.round(
    Number(desempenho?.melhorResultado || 0)
  );

  const proximoTopico = topicos.find(
    (topico) =>
      !estudados[String(topico.id)]
  );

  const ultimoResultado = resultados[0] || null;
  const resumoIndisponivel = carregandoResumo || Boolean(erroResumo);
  const conteudosPendentes = Math.max(totalConteudos - totalEstudados, 0);
  const descricaoProgresso = totalConteudos > 0
    ? `${totalEstudados} de ${totalConteudos} conteúdos revisados`
    : 'Nenhum conteúdo cadastrado';

  function formatarDataResultado(data) {
    if (!data) {
      return '';
    }

    const objeto = new Date(data);

    if (Number.isNaN(objeto.getTime())) {
      return '';
    }

    return objeto.toLocaleDateString(
      'pt-BR'
    );
  }

  const diasParaVestibulinho = diasAteVestibulinho(dataVestibulinho);

  return (
    <div className="home-page page-shell">
      {/* HERO */}
      <div className="home-hero">
        <div className="home-hero-text">
          <span className="home-hero-kicker">SEU PAINEL DE ESTUDOS</span>
          <h1>
            Olá, {primeiroNome}!
          </h1>

          <p>
            Continue seus estudos e acompanhe sua evolução até o Vestibulinho.
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
              <strong>{title}</strong>
              <span>Nível {level}</span>
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

            <div
              className="home-hero-xp-track"
              role="progressbar"
              aria-label="Progresso de XP no nível atual"
              aria-valuemin={0}
              aria-valuemax={Math.max(xpForNext, 1)}
              aria-valuenow={Math.min(Math.max(xpIntoLevel, 0), Math.max(xpForNext, 1))}
            >
              <div
                className="home-hero-xp-fill"
                style={{
                  width: `${xpForNext > 0 ? Math.max(0, Math.min((xpIntoLevel / xpForNext) * 100, 100)) : 0}%`
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {erroResumo && (
        <div className="home-inline-error" role="alert">
          <span>{erroResumo}</span>
          <button
            type="button"
            className="home-retry-button"
            onClick={() => setTentativasResumo((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ESTATÍSTICAS REAIS */}
      <div className="home-stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="calendar" size={20} />
          </div>

          <div className="stat-value">
            {diasParaVestibulinho === null
              ? '—'
              : diasParaVestibulinho}
          </div>

          <div className="stat-label">
            Dias para o Vestibulinho
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="checkSquare" size={20} />
          </div>

          <div className="stat-value">
            {resumoIndisponivel ? '—' : totalSimulados}
          </div>

          <div className="stat-label">
            Simulados realizados
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="chart" size={20} />
          </div>

          <div className="stat-value">
            {resumoIndisponivel ? '—' : totalSimulados > 0 ? `${mediaGeral}%` : '—'}
          </div>

          <div className="stat-label">
            Média nos simulados
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="trophy" size={20} />
          </div>

          <div className="stat-value">
            {resumoIndisponivel ? '—' : totalSimulados > 0 ? `${melhorResultado}%` : '—'}
          </div>

          <div className="stat-label">
            Melhor resultado
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="home-grid">
        <div className="home-left-stack">
          <div className="panel-card home-performance-card">
            <div className="home-panel-heading">
              <div>
                <h3>Progresso por matéria</h3>
                <p>
                  Acompanhe seus conteúdos revisados em cada disciplina.
                </p>
              </div>

              <button
                type="button"
                className="home-panel-link"
                onClick={() => navigate('/conteudos')}
              >
                Ver conteúdos →
              </button>
            </div>

            {!resumoIndisponivel && totalConteudos > 0 && (
              <div className="home-overall-progress">
                <div className="home-overall-progress-top">
                  <span>{descricaoProgresso}</span>
                  <strong>{progressoGeral}%</strong>
                </div>
                <div
                  className="home-overall-progress-track"
                  role="progressbar"
                  aria-label="Conteúdos estudados no total"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressoGeral}
                >
                  <div style={{ width: `${progressoGeral}%` }} />
                </div>
                <small>
                  {conteudosPendentes > 0
                    ? `${conteudosPendentes} ${conteudosPendentes === 1 ? 'conteúdo pendente' : 'conteúdos pendentes'}`
                    : 'Todos os conteúdos foram revisados!'}
                </small>
              </div>
            )}

            {resumoIndisponivel ? (
              <div className="activities-empty-message" role="status">
                {erroResumo ? 'Não foi possível mostrar seu progresso.' : 'Carregando seu progresso...'}
              </div>
            ) : progressoPorMateria.length === 0 ? (
              <div className="activities-empty-message">
                Nenhum conteúdo disponível ainda.
              </div>
            ) : (
              <div className="performance-chart">
                {progressoPorMateria.map(
                  (item) => {
                    const corProgresso =
                      obterCorProgressoMateria(item.nome);

                    return (
                      <div
                        className="performance-row"
                        key={item.id || item.nome}
                      >
                        <div className="performance-row-top">
                          <div className="home-subject-label">
                            <span
                              className="home-subject-dot"
                              style={{
                                background: corProgresso
                              }}
                            />

                            <span className="performance-subject">
                              {item.nome}
                            </span>
                          </div>

                          <span className="performance-value">
                            {item.percentual}%
                          </span>
                        </div>

                        <div
                          className="performance-track"
                          role="progressbar"
                          aria-label={`Progresso de ${item.nome}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={item.percentual}
                        >
                          <div
                            className="performance-fill"
                            style={{
                              width: `${item.percentual}%`,
                              background: corProgresso
                            }}
                          />
                        </div>

                        <small className="performance-count">
                          {item.estudados} de {item.total} conteúdos
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        <div className="home-side-stack">
        <div className="panel-card home-activities-card">
          <div className="home-panel-heading">
            <div>
              <h3>Próximas atividades</h3>
              <p>
                Seus próximos compromissos de estudo.
              </p>
            </div>

            <button
              type="button"
              className="home-panel-link"
              onClick={() => navigate('/cronograma')}
            >
              Ver calendário →
            </button>
          </div>

          {resumoIndisponivel ? (
            <div className="activities-empty-message" role="status">
              {erroResumo ? 'Não foi possível mostrar suas atividades.' : 'Carregando suas atividades...'}
            </div>
          ) : proximasAtividades.length === 0 ? (
            <div className="activities-empty-message home-activities-empty">
              <span className="home-empty-icon"><Icon name="calendar" size={22} /></span>
              <strong>Nenhuma atividade próxima</strong>
              <span>Crie sua próxima atividade para organizar os estudos.</span>
              <button type="button" className="home-empty-action" onClick={() => navigate('/cronograma')}>
                Abrir calendário <Icon name="arrowRight" size={16} />
              </button>
            </div>
          ) : (
            <div className="activity-list">
              {proximasAtividades.map(
                (atividade) => {
                  const status =
                    obterStatusData(atividade);

                  return (
                    <button
                      type="button"
                      className="activity-item"
                      key={atividade.id ?? `${atividade.data}-${atividade.horario}-${atividade.nome}`}
                      onClick={() => navigate('/cronograma')}
                      aria-label={`Ver no calendário: ${atividade.nome}, ${formatarData(atividade.data)}`}
                    >
                      <div className="activity-item-info">
                        <span className="activity-name">
                          {atividade.nome}
                        </span>

                        <span className="activity-subject">
                          {atividade.materia || 'Estudo'}
                        </span>
                      </div>

                      <div className="activity-item-date">
                        {status && (
                          <span className="activity-status">
                            {status}
                          </span>
                        )}

                        <span className="date">
                          {formatarData(atividade.data)}
                        </span>

                        {atividade.horario && (
                          <span className="time">
                            {atividade.horario}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="panel-card home-next-card">
          <div className="home-extra-icon">
            <Icon name="book" size={22} />
          </div>

          <div className="home-extra-copy">
            <span className="home-extra-kicker">
              SEU PRÓXIMO PASSO
            </span>

            {resumoIndisponivel ? (
              <>
                <h3>{erroResumo ? 'Próximo estudo indisponível' : 'Preparando seu próximo estudo...'}</h3>
                <p>{erroResumo ? 'Tente novamente quando seus dados estiverem disponíveis.' : 'Buscando seus conteúdos pendentes.'}</p>
              </>
            ) : proximoTopico ? (
              <>
                <h3>{proximoTopico.nome}</h3>
                <p>{proximoTopico.materia} · Conteúdo pendente</p>

                <button
                  type="button"
                  className="home-extra-button"
                  onClick={() =>
                    navigate(
                      `/conteudos/${proximoTopico.id}`
                    )
                  }
                >
                  Abrir conteúdo →
                </button>
              </>
            ) : totalConteudos === 0 ? (
              <>
                <h3>Explore os simulados</h3>
                <p>Ainda não há conteúdos cadastrados para revisão.</p>
                <button type="button" className="home-extra-button" onClick={() => navigate('/simulados')}>
                  Ver simulados <Icon name="arrowRight" size={16} />
                </button>
              </>
            ) : (
              <>
                <h3>Você revisou tudo!</h3>
                <p>
                  Continue praticando com simulados e flashcards.
                </p>

                <button
                  type="button"
                  className="home-extra-button"
                  onClick={() => navigate('/simulados')}
                >
                  Fazer um simulado →
                </button>
              </>
            )}
          </div>
        </div>

        <div className="panel-card home-result-card">
          <div className="home-extra-icon home-result-icon">
            <Icon name="trophy" size={22} />
          </div>

          <div className="home-extra-copy">
            <span className="home-extra-kicker">
              ÚLTIMO RESULTADO
            </span>

            {resumoIndisponivel ? (
              <>
                <h3>{erroResumo ? 'Resultado indisponível' : 'Carregando resultados...'}</h3>
                <p>Seu histórico será exibido quando estiver disponível.</p>
              </>
            ) : ultimoResultado ? (
              <>
                <h3>
                  {ultimoResultado.simulado_nome ||
                    'Simulado realizado'}
                </h3>

                <p>
                  <strong className="home-result-percentage">
                    {Number(ultimoResultado.porcentagem || 0).toFixed(0)}% de acertos
                  </strong>
                  {' · '}
                  {ultimoResultado.acertos} de{' '}
                  {ultimoResultado.total_questoes} questões
                  {formatarDataResultado(ultimoResultado.data_realizacao)
                    ? ` · ${formatarDataResultado(ultimoResultado.data_realizacao)}`
                    : ''}
                </p>
              </>
            ) : (
              <>
                <h3>Ainda não há resultados.</h3>
                <p>
                  Faça seu primeiro simulado para começar a acompanhar sua evolução.
                </p>
              </>
            )}

            <button
              type="button"
              className="home-extra-button"
              onClick={() => navigate(ultimoResultado ? '/desempenho' : '/simulados')}
            >
              {ultimoResultado ? 'Ver desempenho →' : 'Fazer um simulado →'}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* MODAL DE NÍVEIS */}
      {showLevels && (
        <div
          className="modal-overlay"
          onClick={() => setShowLevels(false)}
        >
          <div
            className="modal-card levels-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Níveis e XP</h2>
              <p>
                Veja quanto XP falta para subir de nível.
              </p>
            </div>

            <div className="levels-list">
              {LEVEL_TITLES.map(
                (nivelTitulo, index) => {
                  const nivel = index + 1;

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
                        <strong>{nivelTitulo}</strong>
                        <span>Nível {nivel}</span>
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
                onClick={() => setShowLevels(false)}
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
