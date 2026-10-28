import { MATERIAS_SIMULADOS } from './dadosSimulados.js';
import './CategoriasSimulados.css';
import { estiloMateria } from './estiloMateria.js';



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



export function CategoriasSimulados({ indicadores, melhorDesempenho, piorDesempenho, materiasDisponiveis = MATERIAS_SIMULADOS, selecionarMateria }) {
  return (
    <>
<section className="simulados-resumo simulados-resumo-refinado" aria-label="Seu desempenho nos simulados">
          <article className="simulados-indicador simulados-indicador-media">
            <div className="simulados-indicador-topo">
              <span className="simulados-indicador-titulo">Taxa de acertos</span>
              <span className="simulados-indicador-icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
                </svg>
              </span>
            </div>
            <strong className="simulados-indicador-valor">{indicadores.media === null ? '—' : `${indicadores.media}%`}</strong>
            <div className="simulados-indicador-rodape">
              <div className="simulados-indicador-barra" role="progressbar" aria-label="Taxa média de acertos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={indicadores.media === null ? 0 : Math.max(0, Math.min(100, Number(indicadores.media) || 0))}>
                <span style={{ width: `${indicadores.media === null ? 0 : Math.max(0, Math.min(100, Number(indicadores.media) || 0))}%` }} />
              </div>
              <span className="simulados-indicador-apoio">Média dos simulados realizados</span>
            </div>
          </article>
          <article className="simulados-indicador simulados-indicador-melhor">
            <div className="simulados-indicador-topo">
              <span className="simulados-indicador-titulo">Melhor desempenho</span>
              <span className="simulados-indicador-icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4h8v7a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4" /><path d="M12 15v4m-4 1h8" />
                </svg>
              </span>
            </div>
            <strong className="simulados-indicador-valor">{melhorDesempenho ? `${melhorDesempenho.percentual}%` : '—'}</strong>
            <div className="simulados-indicador-rodape">
              <span className="simulados-indicador-materia"><span className="simulados-indicador-ponto" aria-hidden="true" />{melhorDesempenho?.materia ?? 'Sem resultados por matéria'}</span>
            </div>
          </article>
          <article className="simulados-indicador simulados-indicador-revisar">
            <div className="simulados-indicador-topo">
              <span className="simulados-indicador-titulo">Ponto de atenção</span>
              <span className="simulados-indicador-icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6c-2.8-1.8-6.2-2-9-1v13c3-1 6.5-.7 9 1 2.5-1.7 6-2 9-1V5c-2.8-1-6.2-.8-9 1Z" /><path d="M12 6v13" />
                </svg>
              </span>
            </div>
            <strong className="simulados-indicador-valor">{piorDesempenho ? `${piorDesempenho.percentual}%` : '—'}</strong>
            <div className="simulados-indicador-rodape">
              <span className="simulados-indicador-materia"><span className="simulados-indicador-ponto" aria-hidden="true" />{piorDesempenho?.materia ?? 'Pratique mais matérias para comparar'}</span>
            </div>
          </article>
        </section>
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
    </>
  );
}
