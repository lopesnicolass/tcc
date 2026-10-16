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
