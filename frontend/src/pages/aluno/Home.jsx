import '../../styles/aluno/Home.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext.jsx';
import {
  LEVEL_TITLES,
  xpForLevel
} from '../../context/GamificationContext.jsx';
import Icon from '../../components/Icon.jsx';
import SubjectIcon from '../../components/SubjectIcon.jsx';
import { getSubjectStyle } from '../../utils/subjects.js';
import { API_URL, obterToken } from '../../services/api.js';

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

function criarDataAtividade(atividade) {
  if (!atividade?.data) {
    return null;
  }

  const texto = String(atividade.data).trim();

  let ano;
  let mes;
  let dia;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    [ano, mes, dia] = texto.split('-').map(Number);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    [dia, mes, ano] = texto.split('/').map(Number);
  } else {
    return null;
  }

  const [horaTexto, minutoTexto] = String(
    atividade.horario || '23:59'
  ).split(':');

  const resultado = new Date(
    ano,
    mes - 1,
    dia,
    Number(horaTexto) || 0,
    Number(minutoTexto) || 0,
    0,
    0
  );

  return Number.isNaN(resultado.getTime())
    ? null
    : resultado;
}

function formatarData(data) {
  if (!data) {
    return '';
  }

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  return texto;
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

function obterStatusData(atividade) {
  const data = criarDataAtividade(atividade);

  if (!data) {
    return '';
  }

  const agora = new Date();
  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const dataSemHorario = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  const diferenca = Math.round(
    (dataSemHorario.getTime() - hoje.getTime()) /
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
          fetch(`${API_URL}/calendario/datas-importantes`, { headers })
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

            const data = criarDataAtividade(atividade);

            return !concluida && data && data >= agora;
          })
          .sort(
            (a, b) =>
              (criarDataAtividade(a)?.getTime() ||
                Number.MAX_SAFE_INTEGER) -
              (criarDataAtividade(b)?.getTime() ||
                Number.MAX_SAFE_INTEGER)
          )
          .slice(0, 4);

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

        const datasImportantes = Array.isArray(
          dadosCalendario?.datas
        )
          ? dadosCalendario.datas
          : [];

        const hojeSemHorario = new Date();
        hojeSemHorario.setHours(0, 0, 0, 0);

        const vestibulinho = datasImportantes
          .filter((item) => {
            const titulo = String(item?.titulo || '').toLowerCase();
            const tipo = String(item?.tipo || '').toLowerCase();
            const data = criarDataAtividade({ data: item?.data });

            return (
              data &&
              data >= hojeSemHorario &&
              (titulo.includes('vestibulinho') ||
                tipo.includes('vestibulinho'))
            );
          })
          .sort(
            (a, b) =>
              (criarDataAtividade({ data: a.data })?.getTime() ||
                Number.MAX_SAFE_INTEGER) -
              (criarDataAtividade({ data: b.data })?.getTime() ||
                Number.MAX_SAFE_INTEGER)
          )[0] || null;

        setDataVestibulinho(vestibulinho);
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
  }, [usuarioId]);

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

  const diasParaVestibulinho = useMemo(() => {
    if (!dataVestibulinho?.data) {
      return null;
    }

    const alvo = criarDataAtividade({
      data: dataVestibulinho.data
    });

    if (!alvo) {
      return null;
    }

    alvo.setHours(0, 0, 0, 0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return Math.max(0, Math.ceil(
      (alvo.getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24)
    ));
  }, [dataVestibulinho]);

  return (
    <div className="home-page page-shell">
      {/* HERO */}
      <div className="home-hero">
        <div className="home-hero-text">
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

            <div className="home-hero-xp-track">
              <div
                className="home-hero-xp-fill"
                style={{
                  width: `${Math.min(
                    (xpIntoLevel / xpForNext) * 100,
                    100
                  )}%`
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {erroResumo && (
        <div className="home-inline-error">
          {erroResumo}
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
            {carregandoResumo
              ? '—'
              : totalSimulados}
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
            {carregandoResumo
              ? '—'
              : `${mediaGeral}%`}
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
            {carregandoResumo
              ? '—'
              : `${melhorResultado}%`}
          </div>

          <div className="stat-label">
            Melhor resultado
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="home-grid">
        <div className="panel-card home-performance-card">
          <div className="home-panel-heading">
            <div>
              <h3>Progresso por matéria</h3>
              <p>
                Quanto dos conteúdos disponíveis você já revisou.
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

          {carregandoResumo ? (
            <div className="activities-empty-message">
              Carregando seu progresso...
            </div>
          ) : progressoPorMateria.length === 0 ? (
            <div className="activities-empty-message">
              Nenhum conteúdo disponível ainda.
            </div>
          ) : (
            <div className="performance-chart">
              {progressoPorMateria.map(
                (item) => {
                  const style =
                    getSubjectStyle(item.nome);
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

                      <div className="performance-track">
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

        <div className="panel-card home-activities-card">
          <div className="home-panel-heading">
            <div>
              <h3>Próximas atividades</h3>
              <p>
                O que está programado para você.
              </p>
            </div>

            <button
              type="button"
              className="home-panel-link"
              onClick={() => navigate('/cronograma')}
            >
              Abrir plano de estudos →
            </button>
          </div>

          {carregandoResumo ? (
            <div className="activities-empty-message">
              Carregando suas atividades...
            </div>
          ) : proximasAtividades.length === 0 ? (
            <div className="activities-empty-message">
              <strong>Nenhuma atividade próxima.</strong>
              <span>
                Organize seu próximo estudo no cronograma.
              </span>
            </div>
          ) : (
            <div className="activity-list">
              {proximasAtividades.map(
                (atividade) => {
                  const status =
                    obterStatusData(atividade);

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
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* DETALHES EXTRAS */}
      <div className="home-extra-grid">
        <div className="panel-card home-next-card">
          <div className="home-extra-icon">
            <Icon name="book" size={22} />
          </div>

          <div className="home-extra-copy">
            <span className="home-extra-kicker">
              CONTINUE ESTUDANDO
            </span>

            {proximoTopico ? (
              <>
                <h3>{proximoTopico.nome}</h3>
                <p>
                  {proximoTopico.materia}
                </p>

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

            {ultimoResultado ? (
              <>
                <div className="home-result-score">
                  {Number(
                    ultimoResultado.porcentagem || 0
                  ).toFixed(0)}%
                </div>

                <h3>
                  {ultimoResultado.simulado_nome ||
                    'Simulado realizado'}
                </h3>

                <p>
                  {ultimoResultado.acertos} acertos de{' '}
                  {ultimoResultado.total_questoes} questões
                  {' · '}
                  {formatarDataResultado(
                    ultimoResultado.data_realizacao
                  )}
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
              onClick={() => navigate('/desempenho')}
            >
              Ver desempenho →
            </button>
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
