import { useEffect, useRef, useState } from 'react';
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
  '../../../assets/simulados/*.png',
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
  const [filtroAberto, setFiltroAberto] = useState(false);
  const filtroRef = useRef(null);
  const opcoesSituacao = [
    { valor: 'todos', texto: 'Todos os simulados' },
    { valor: 'nao-iniciado', texto: 'Não iniciados' },
    { valor: 'em-progresso', texto: 'Em andamento' },
    { valor: 'concluido', texto: 'Concluídos' }
  ];

  useEffect(() => {
    if (!filtroAberto) return undefined;
    const fecharAoClicarFora = (evento) => {
      if (!filtroRef.current?.contains(evento.target)) setFiltroAberto(false);
    };
    const fecharComEscape = (evento) => {
      if (evento.key === 'Escape') setFiltroAberto(false);
    };
    document.addEventListener('pointerdown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [filtroAberto]);

  function selecionarMateria(materia) {
    setBusca('');
    setSituacao('todos');
    setFiltroAberto(false);
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
  const desempenhoOrdenado = [...indicadores.materias].sort((a,b) => b.percentual - a.percentual || a.materia.localeCompare(b.materia));
  const melhorDesempenho = desempenhoOrdenado[0] ?? null;
  const piorDesempenho = desempenhoOrdenado.length > 1 ? desempenhoOrdenado.at(-1) : null;

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
                    </div>

                    <div className="simulado-grid">
                      {grupo.simulados.map((simulado) => (
                        <article
                          className={`simulado-card simulado-card-${simulado.status}`}
                          key={simulado.id}
                        >
                          <div className="simulado-card-body">
                            <div className="simulado-card-topline">
                              <span className="simulado-card-kicker">Simulado</span>
                              <span className={`status-badge ${simulado.status}`}>
                                {STATUS_LABEL[simulado.status] || 'Não iniciado'}
                              </span>
                            </div>
                            <h2>{simulado.titulo}</h2>

                            {simulado.descricao && (
                              <p className="simulado-description">
                                {simulado.descricao}
                              </p>
                            )}

                            <div className="simulado-meta">
                              <span>
                                {simulado.quantidade_questoes} questões
                              </span>

                              <span>
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
              <div className="simulados-resumo-topo"><strong>{indicadores.media === null ? '—' : `${indicadores.media}%`}</strong></div>
              <span className="simulados-resumo-label">Taxa de acertos</span>
            </div>
            <div className="simulados-resumo-item">
              <div className="simulados-resumo-topo"><strong>{melhorDesempenho ? `${melhorDesempenho.percentual}%` : '—'}</strong></div>
              <span className="simulados-resumo-label">Melhor desempenho</span>
              <span className="simulados-resumo-materia">{melhorDesempenho?.materia ?? 'Sem resultados por matéria'}</span>
            </div>
            <div className="simulados-resumo-item">
              <div className="simulados-resumo-topo"><strong>{piorDesempenho ? `${piorDesempenho.percentual}%` : '—'}</strong></div>
              <span className="simulados-resumo-label">Pior desempenho</span>
              <span className="simulados-resumo-materia">{piorDesempenho?.materia ?? 'Pratique mais matérias para comparar'}</span>
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
                  </div>

                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="simulados-filtros">
            <div className="simulados-campo-busca">
              <label className="simulados-busca-label" htmlFor="busca-simulados">Pesquisar simulados</label>
              <div className="simulados-busca-wrap">
                <svg className="simulados-busca-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                <input
                  id="busca-simulados"
                  type="search"
                  className="simulados-busca"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Busque por título ou conteúdo"
                />
                {busca && <button type="button" className="simulados-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar pesquisa">×</button>}
              </div>
            </div>
            <div className="simulados-campo-situacao" ref={filtroRef}>
              <span className="simulados-situacao-label" id="simulados-situacao-titulo">Situação</span>
              <button
                type="button"
                className={`simulados-situacao-trigger${filtroAberto ? ' aberto' : ''}`}
                aria-expanded={filtroAberto}
                aria-haspopup="true"
                aria-labelledby="simulados-situacao-titulo simulados-situacao-selecionada"
                onClick={() => setFiltroAberto((aberto) => !aberto)}
              >
                <span id="simulados-situacao-selecionada">{opcoesSituacao.find((opcao) => opcao.valor === situacao)?.texto}</span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {filtroAberto && (
                <div className="simulados-situacao-menu" role="group" aria-label="Filtrar por situação">
                  {opcoesSituacao.map((opcao) => (
                    <button
                      type="button"
                      key={opcao.valor}
                      className={`simulados-situacao-opcao${situacao === opcao.valor ? ' selecionada' : ''}`}
                      aria-pressed={situacao === opcao.valor}
                      onClick={() => { setSituacao(opcao.valor); setFiltroAberto(false); }}
                    >
                      <span>{opcao.texto}</span>
                      {situacao === opcao.valor && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
