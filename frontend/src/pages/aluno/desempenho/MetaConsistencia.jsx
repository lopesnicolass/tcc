import { CartaoAmpliavel } from './CartaoAmpliavel.jsx';
import { META } from './constants.js';

export function MetaConsistencia({ mediaGeral, faltamParaMeta, consistencia, mediaRecente, mensagemConsistencia, possuiResultados = false, totalResultados = 0 }) {
  const faltam = Math.max(0, faltamParaMeta);
  const percentual = Math.max(0, Math.min(100, Number(mediaGeral) || 0));
  return (
    <div className="desempenho-split-meta">
      <CartaoAmpliavel titulo="Meta de desempenho" tamanho="grande">
      <section className="desempenho-painel">
        <div className="desempenho-painel-cabecalho"><div><h2>Meta de desempenho</h2><p>Compare sua média com a referência de {META}%.</p></div><strong className="desempenho-painel-numero">{possuiResultados ? `${Math.round(mediaGeral)}%` : '—'}</strong></div>
        <div className="desempenho-meta-grafico">
          <div className="desempenho-barra desempenho-meta-barra" role="progressbar" aria-label="Média geral" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual)}>
            <span style={{ width: `${percentual}%` }} />
            <i style={{ left: `${META}%` }} aria-hidden="true" />
          </div>
          <div className="desempenho-meta-eixo"><span>0%</span><span>Meta: {META}%</span><span>100%</span></div>
        </div>
        <div className="desempenho-explicacao">
          <strong>{!possuiResultados ? 'Sua meta começa com o primeiro simulado' : faltam > 0 ? `Faltam ${faltam.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos percentuais` : 'Meta alcançada!'}</strong>
          <p>{!possuiResultados ? 'Faça um simulado para acompanhar sua evolução.' : faltam > 0 ? 'A referência é uma orientação de estudo, não uma exigência.' : 'Sua média já alcançou a referência definida.'}</p>
        </div>
      </section>
      </CartaoAmpliavel>
      <CartaoAmpliavel titulo="Regularidade das notas" tamanho="grande">
      <section className="desempenho-painel">
        <div className="desempenho-painel-cabecalho"><div><h2>Regularidade das notas</h2><p>O quanto as notas variam entre tentativas.</p></div><strong className="desempenho-painel-numero">{totalResultados >= 2 ? `${Math.round(consistencia)}%` : '—'}</strong></div>
        <div className="desempenho-consistencia-escala" aria-label={totalResultados >= 2 ? `Índice de regularidade ${Math.round(consistencia)} por cento` : 'Dados insuficientes'}>
          {Array.from({ length: 10 }, (_, i) => <span className={totalResultados >= 2 && consistencia >= (i + 1)*10 ? 'preenchido' : ''} key={i} />)}
        </div>
        <div className="desempenho-explicacao">
          <strong>{totalResultados >= 2 ? mensagemConsistencia : 'Ainda são necessárias duas tentativas'}</strong>
          <p>{totalResultados >= 2 ? `Média das últimas ${Math.min(3, totalResultados)} tentativas: ${Math.round(mediaRecente)}%. Notas regulares não significam necessariamente notas altas.` : 'A regularidade será exibida quando houver ao menos duas notas para comparar.'}</p>
        </div>
      </section>
      </CartaoAmpliavel>
    </div>
  );
}
