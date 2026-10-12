import { useState } from 'react';
import { STATUS_LABEL, BTN_LABEL } from './constants.js';
import {
  MATERIAS_SIMULADOS,
  normalizarMateria,
  normalizarMateriaSimulado,
  calcularIndicadores
} from './dadosSimulados.js';

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
  filtro,
  setFiltro,
  simulados,
  erro,
  historicoResultados,
  simuladosVisiveis,
  abrirSimulado,
  carregandoQuestoes
}) {
  const materiaSelecionada =
    filtro !== 'Todas' ? normalizarMateria(filtro) : null;

  const estiloMateriaSelecionada = materiaSelecionada
    ? estiloMateria(materiaSelecionada)
    : null;

  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('todos');

  function selecionarMateria(materia) {
    setBusca('');
    setSituacao('todos');
    setFiltro(materia);
  }

  const textoBusca = busca.trim().toLocaleLowerCase('pt-BR');
  const filtrados = simuladosVisiveis.filter((simulado) => {
    if (situacao !== 'todos' && simulado.status !== situacao) return false;
    if (!textoBusca) return true;
    return [simulado.titulo, simulado.descricao, simulado.topico]
      .some((texto) => String(texto || '').toLocaleLowerCase('pt-BR').includes(textoBusca));
  });
  const gruposPorMateria = Array.from(
    filtrados.reduce((mapa, simulado) => {
      const materia = normalizarMateriaSimulado(simulado);
      if (!mapa.has(materia)) mapa.set(materia, []);
      mapa.get(materia).push(simulado);
      return mapa;
    }, new Map())
  );

  const indicadores = calcularIndicadores(historicoResultados);
  const emAndamento = simulados.filter((item) => item.status === 'em-progresso');

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
                {gruposPorConteudo.map(([chave, grupo]) => (
                  <div
                    key={chave}
                    className="simulados-conteudo-group"
                  >
                    <div className="simulados-conteudo-heading">
                      <div className="simulados-conteudo-heading-main">
                        <span className="simulados-conteudo-label">Conteúdo</span>
                        <h3>{grupo.nome}</h3>
                      </div>
                      <span className="simulados-conteudo-count">
                        {grupo.simulados.length}{' '}
                        {grupo.simulados.length === 1 ? 'simulado' : 'simulados'}
                      </span>
                    </div>

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
                              {STATUS_LABEL[simulado.status] || 'Não iniciado'}
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
                              : (BTN_LABEL[simulado.status] || 'Iniciar')}
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
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

      {!materiaSelecionada && (
        <>
          <section className="simulados-resumo" aria-label="Resumo dos simulados">
            <div className="simulados-resumo-item">
              <span className="simulados-resumo-label">Tentativas realizadas</span>
              <strong>{historicoResultados === null ? '—' : indicadores.tentativas}</strong>
              <span className="simulados-resumo-hint">Resultados salvos na sua conta</span>
            </div>
            <div className="simulados-resumo-item">
              <span className="simulados-resumo-label">Média das tentativas</span>
              <strong>{indicadores.media === null ? '—' : `${indicadores.media}%`}</strong>
              <span className="simulados-resumo-hint">Aproveitamento nas questões</span>
            </div>
            <div className="simulados-resumo-item">
              <span className="simulados-resumo-label">Matérias praticadas</span>
              <strong>{historicoResultados === null ? '—' : indicadores.materias.length}</strong>
              <span className="simulados-resumo-hint">Com resultados por disciplina</span>
            </div>
          </section>
          {indicadores.foco && (
            <div className="simulados-destaques">
              <div className="simulados-destaque">
                  <div>
                    <span className="simulados-destaque-label">Sugestão de revisão</span>
                    <h2>{indicadores.foco.materia}</h2>
                    <p>{indicadores.foco.percentual}% de acertos nas tentativas dessa matéria. Que tal praticar mais?</p>
                  </div>
                  <button type="button" className="simulados-destaque-acao simulados-destaque-acao-secundaria" onClick={() => selecionarMateria(indicadores.foco.materia)}>
                    Ver simulados →
                  </button>
                </div>
            </div>
          )}
        </>
      )}

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
                  onClick={() => selecionarMateria(materia)}
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
                    {listaMateria.some((item) => item.status === 'em-progresso') && (
                      <span className="materia-simulado-em-andamento">● Você tem simulado em andamento</span>
                    )}
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
              onClick={() => selecionarMateria('Todas')}
            >
              ← Voltar para matérias
            </button>
          </div>

          <div className="simulados-filtros">
            <label className="simulados-busca-label" htmlFor="busca-simulados">Buscar nesta matéria</label>
            <input
              id="busca-simulados"
              type="search"
              className="simulados-busca"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar por título ou conteúdo..."
            />
            <label className="simulados-situacao-label" htmlFor="situacao-simulados">Situação</label>
            <select id="situacao-simulados" className="simulados-situacao" value={situacao} onChange={(evento) => setSituacao(evento.target.value)}>
              <option value="todos">Todos os simulados</option>
              <option value="nao-iniciado">Não iniciados</option>
              <option value="em-progresso">Em andamento</option>
              <option value="concluido">Concluídos</option>
            </select>
          </div>
          {filtrados.length === 0 ? (
            <div className="stat-card simulados-empty-card" role="status">
              <h2>{simuladosVisiveis.length === 0 ? 'Nenhum simulado disponível ainda.' : 'Nenhum simulado corresponde aos filtros.'}</h2>
              <p>{simuladosVisiveis.length === 0
                ? 'Os simulados cadastrados pelo administrador aparecerão aqui.'
                : 'Tente outro termo ou escolha uma situação diferente.'}</p>
              {simuladosVisiveis.length > 0 && (
                <button type="button" className="simulados-limpar-filtros" onClick={() => { setBusca(''); setSituacao('todos'); }}>Limpar filtros</button>
              )}
            </div>
          ) : (
            renderSimulados()
          )}
        </>
      )}
    </div>
  );
}
