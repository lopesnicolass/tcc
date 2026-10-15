import { META } from './constants.js';

export function Hero({ mediaGeral, tendencia, melhorResultado, porcentagem, possuiResultados = false }) {
  const tendenciaTexto = !possuiResultados || tendencia === 'neutra'
    ? 'Acompanhe os próximos resultados'
    : tendencia === 'alta' ? 'Última nota acima da anterior' : 'Última nota abaixo da anterior';

  return (
    <section className="desempenho-hero" aria-label="Resumo do desempenho">
      <div className="desempenho-hero-principal">
        <div>
          <span className="desempenho-hero-kicker">MINHA EVOLUÇÃO</span>
          <h1>Desempenho</h1>
          <p className="desempenho-hero-intro">Veja seus resultados nos simulados e descubra o que revisar.</p>
        </div>
        <div className="desempenho-hero-resumo">
          <div>
            <span className="desempenho-hero-legenda">Média dos simulados</span>
            <div className="desempenho-hero-valor">{possuiResultados ? porcentagem(mediaGeral) : '—'}</div>
          </div>
          <div className="desempenho-hero-meta">
            <span>Objetivo de referência</span>
            <strong>{META}%</strong>
          </div>
        </div>
      </div>
      
      <div className="desempenho-hero-destaques">
        <div className="desempenho-hero-destaque">
          <span className="desempenho-kpi-rotulo">Melhor resultado</span>
          <strong>{possuiResultados ? porcentagem(melhorResultado) : '—'}</strong>
          <small>Maior nota em uma tentativa</small>
        </div>
        <div className="desempenho-hero-destaque">
          <span className="desempenho-kpi-rotulo">Últimas tentativas</span>
          <strong className="desempenho-tendencia-titulo">
            {possuiResultados && tendencia !== 'neutra' && <span aria-hidden="true">{tendencia === 'alta' ? '↗' : '↘'}</span>}
            {!possuiResultados ? 'Aguardando dados' : tendencia === 'alta' ? 'Em alta' : tendencia === 'baixa' ? 'Em queda' : 'Sem mudança'}
          </strong>
          <small>{tendenciaTexto}</small>
        </div>
      </div>
      
    </section>
  );
}
