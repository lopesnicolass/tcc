import { useState } from 'react';
import { STATUS_LABEL, BTN_LABEL } from './constants.js';

const MATERIAS_SIMULADOS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências',
  'Simulados Gerais',
];

const MATERIA_ALIASES = {
  'Língua Portuguesa': 'Português',
  'Ciências da Natureza': 'Ciências',
  'Geral': 'Simulados Gerais',
  'Simulado Geral': 'Simulados Gerais',
  'Simulados Gerais': 'Simulados Gerais',
  'Geral/Misto': 'Simulados Gerais',
  'Misto': 'Simulados Gerais',
};

function ehSimuladoGeral(simulado) {
  if (!simulado) return false;

  if (simulado.tipo === 'geral' || simulado.tipo === 'misto') {
    return true;
  }

  if (simulado.is_geral === true || simulado.simulado_geral === true) {
    return true;
  }

  if (Array.isArray(simulado.materias) && simulado.materias.length > 1) {
    return true;
  }

  return MATERIA_ALIASES[simulado.materia] === 'Simulados Gerais';
}

function normalizarMateria(materia) {
  return MATERIA_ALIASES[materia] || materia;
}

function normalizarMateriaSimulado(simulado) {
  return ehSimuladoGeral(simulado)
    ? 'Simulados Gerais'
    : normalizarMateria(simulado?.materia);
}

const MATERIA_ESTILO = {
  Matemática: { sigla: '∑', classe: 'matematica' },
  Português: { sigla: 'A', classe: 'portugues' },
  História: { sigla: 'H', classe: 'historia' },
  Geografia: { sigla: 'G', classe: 'geografia' },
  Ciências: { sigla: 'C', classe: 'ciencias' },
  Biologia: { sigla: 'B', classe: 'biologia' },
  Química: { sigla: 'Q', classe: 'quimica' },
  Física: { sigla: 'F', classe: 'fisica' },
  Inglês: { sigla: 'EN', classe: 'ingles' },
  'Simulados Gerais': { sigla: '★', classe: 'gerais' },
 
};


const CAPAS_SIMULADOS = import.meta.glob(
  '../../../assets/simulados/*.{png,jpg,jpeg,webp,avif}',
  {
    eager: true,
    import: 'default',
    query: '?url'
  }
);

function slugDaMateria(materia) {
  return materia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function obterCapaMateria(materia) {
  const slug = slugDaMateria(materia);
  const entrada = Object.entries(CAPAS_SIMULADOS).find(([caminho]) => {
    const arquivo = caminho.split('/').pop()?.replace(/\.[^.]+$/, '');
    return arquivo === slug;
  });

  return entrada?.[1] || null;
}

function estiloMateria(materia) {
  const configuracao = MATERIA_ESTILO[materia];

  if (configuracao) {
    return configuracao;
  }

  const slug = materia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

  return {
    sigla: materia.slice(0, 1).toUpperCase(),
    classe: slug || 'outra'
  };
}

export function ListaSimulados({
  materias,
  filtro,
  setFiltro,
  simulados,
  erro,
  concluidos,
  simuladosVisiveis,
  abrirSimulado,
  carregandoQuestoes
}) {
  const [conteudoAberto, setConteudoAberto] = useState(null);

  const materiaSelecionada =
    filtro !== 'Todas' ? normalizarMateria(filtro) : null;

  const estiloMateriaSelecionada = materiaSelecionada
    ? estiloMateria(materiaSelecionada)
    : null;

  const gruposPorMateria = Array.from(
    simuladosVisiveis.reduce(
      (mapa, simulado) => {
        const materia = normalizarMateriaSimulado(simulado) || 'Sem matéria';

        if (!mapa.has(materia)) {
          mapa.set(materia, []);
        }

        mapa.get(materia).push(simulado);

        return mapa;
      },
      new Map()
    )
  );

  // As matérias ficam sempre visíveis. O administrador apenas alimenta
  // o card correspondente ao criar um novo simulado para aquela matéria.
  const materiasDisponiveis = MATERIAS_SIMULADOS;

  function renderSimulados() {
    return (
      <div className="simulados-lista-detalhe">
        {gruposPorMateria.map(
          ([materia, listaMateria]) => {
            const gruposPorConteudo =
              Array.from(
                listaMateria.reduce(
                  (mapa, simulado) => {
                    const chave =
                      simulado.topico_id != null
                        ? `topico-${simulado.topico_id}`
                        : 'sem-conteudo';

                    if (!mapa.has(chave)) {
                      mapa.set(chave, {
                        nome:
                          simulado.topico ||
                          'Conteúdo não definido',
                        simulados: []
                      });
                    }

                    mapa.get(chave).simulados.push(simulado);

                    return mapa;
                  },
                  new Map()
                )
              );

            return (
              <section
                key={materia}
                className="simulados-materia-section"
              >
                {gruposPorConteudo.map(([chave, grupo]) => {
                  const aberto = conteudoAberto === `${materia}-${chave}`;
                  const painelId = `simulados-${materia}-${chave}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-');

                  return (
                    <section
                      key={chave}
                      className={`simulados-conteudo-group ${aberto ? 'aberto' : ''}`}
                    >
                      <button
                        type="button"
                        className="simulados-conteudo-heading"
                        aria-expanded={aberto}
                        aria-controls={painelId}
                        onClick={() =>
                          setConteudoAberto(aberto ? null : `${materia}-${chave}`)
                        }
                      >
                        <span className="simulados-conteudo-heading-main">
                          <span className="simulados-conteudo-icon" aria-hidden="true">
                            ✓
                          </span>
                          <span className="simulados-conteudo-heading-copy">
                            <span className="simulados-conteudo-label">Conteúdo</span>
                            <span className="simulados-conteudo-title">{grupo.nome}</span>
                          </span>
                        </span>

                        <span className="simulados-conteudo-heading-side">
                          <span className="simulados-conteudo-count">
                            {grupo.simulados.length}{' '}
                            {grupo.simulados.length === 1 ? 'simulado' : 'simulados'}
                          </span>
                          <span className="simulados-conteudo-chevron" aria-hidden="true">
                            {aberto ? '⌃' : '⌄'}
                          </span>
                        </span>
                      </button>

                      {aberto && (
                        <div
                          id={painelId}
                          className="simulados-conteudo-panel"
                        >
                          <div className="simulado-grid">
                            {grupo.simulados.map((simulado) => (
                              <article
                                className={`simulado-card simulado-card-${simulado.status}`}
                                key={simulado.id}
                              >
                                <div className="simulado-card-header">
                                  <span className="simulado-subject">
                                    {simulado.materia || 'Simulado'}
                                  </span>

                                  <span
                                    className={`status-badge ${simulado.status}`}
                                  >
                                    {STATUS_LABEL[simulado.status]}
                                  </span>
                                </div>

                                <div className="simulado-card-body">
                                  <div className="simulado-card-kicker">
                                    Simulado
                                  </div>

                                  <h2>{simulado.titulo}</h2>

                                  {simulado.descricao && (
                                    <p className="simulado-description">
                                      {simulado.descricao}
                                    </p>
                                  )}

                                  <div className="simulado-meta">
                                    <span>
                                      <strong aria-hidden="true">📝</strong>
                                      {simulado.quantidade_questoes} questões
                                    </span>

                                    <span>
                                      <strong aria-hidden="true">⏱</strong>
                                      {simulado.tempo_limite} minutos
                                    </span>
                                  </div>
                                </div>

                                <button
                                  className="simulado-btn"
                                  onClick={() => abrirSimulado(simulado)}
                                  disabled={carregandoQuestoes}
                                >
                                  {carregandoQuestoes
                                    ? 'Carregando...'
                                    : BTN_LABEL[simulado.status]}
                                </button>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </section>
            );
          }
        )}
      </div>
    );
  }

  return (
    <div className="simulados-page page-shell">
      <div
        className={`simulados-hero ${
          materiaSelecionada
            ? `simulados-hero-materia simulados-hero-materia-${estiloMateriaSelecionada?.classe || 'outra'}`
            : ''
        }`}
      >
        <div className="simulados-hero-copy">
          <h1>{materiaSelecionada || 'Simulados'}</h1>
          <p>
            {materiaSelecionada
              ? 'Escolha um simulado para começar seus estudos.'
              : 'Pratique seus conhecimentos, acompanhe seus resultados e avance na sua preparação para o Vestibulinho.'}
          </p>
        </div>

      </div>

      {erro && (
        <div className="stat-card simulados-error-card">
          <p>{erro}</p>
        </div>
      )}

      {!materiaSelecionada ? (
        <section className="materias-simulados-section">
          <div className="materias-simulados-grid">
            {materiasDisponiveis.map((materia) => {
              const estilo = estiloMateria(materia);
              const listaMateria = simulados.filter(
                (simulado) => normalizarMateriaSimulado(simulado) === materia
              );
              const quantidadeQuestoes = listaMateria.reduce(
                (total, simulado) => total + Number(simulado.quantidade_questoes || 0),
                0
              );

              return (
                <button
                  key={materia}
                  type="button"
                  className="materia-simulado-card"
                  onClick={() => setFiltro(materia)}
                >
                  <div className={`materia-simulado-cover materia-cover-${estilo.classe}`}>
                    {obterCapaMateria(materia) ? (
                      <img
                        className="materia-simulado-cover-image"
                        src={obterCapaMateria(materia)}
                        alt={`Capa de ${materia}`}
                      />
                    ) : (
                      <>
                        <span className="materia-simulado-cover-shape materia-simulado-cover-shape-one" />
                        <span className="materia-simulado-cover-shape materia-simulado-cover-shape-two" />
                        <span className="materia-simulado-cover-symbol">
                          {estilo.sigla}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="materia-simulado-card-content">
                    <h3>{materia}</h3>
                    <div className="materia-simulado-card-footer">
                      <span>{listaMateria.length} {listaMateria.length === 1 ? 'simulado' : 'simulados'}</span>
                      <span>{quantidadeQuestoes} questões</span>
                    </div>
                  </div>

                  <span className="materia-simulado-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="simulados-detalhe-topo">
            <button
              type="button"
              className="simulados-voltar-materias"
              onClick={() => setFiltro('Todas')}
            >
              ← Voltar para matérias
            </button>
          </div>

          {simuladosVisiveis.length === 0 ? (
            <div className="stat-card simulados-empty-card">
              <h2>Nenhum simulado encontrado.</h2>
              <p>Os simulados cadastrados pelo administrador aparecerão aqui.</p>
            </div>
          ) : (
            renderSimulados()
          )}
        </>
      )}
    </div>
  );
}
