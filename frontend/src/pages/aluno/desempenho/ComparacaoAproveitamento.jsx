import { CartaoAmpliavel } from './CartaoAmpliavel.jsx';
import { META } from './constants.js';

function Barra({ rotulo, valor, cor }) {
  const percentual = Math.max(0, Math.min(100, Number(valor) || 0));
  return <div className="desempenho-comparacao-item">
    <div className="desempenho-comparacao-titulos"><span>{rotulo}</span><strong>{Math.round(percentual)}%</strong></div>
    <div className="desempenho-barra" role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual)}>
      <span style={{ width: `${percentual}%`, background: cor }} />
    </div>
  </div>;
}

export function ComparacaoAproveitamento({ mediaGeral, melhorResultado, menorResultado, totalQuestoes, percentualAcertos, totalAcertos, totalErros }) {
  return (
    <div className="desempenho-split-comparacao">
      <CartaoAmpliavel titulo="Comparação das notas" tamanho="grande">
      <section className="desempenho-painel">
        <div className="desempenho-painel-cabecalho"><div><h2>Comparação das notas</h2><p>Notas por simulado, em uma escala de 0 a 100%.</p></div></div>
        <div className="desempenho-comparacao-lista">
          <Barra rotulo="Média geral" valor={mediaGeral} cor="#2082ea" />
          <Barra rotulo="Melhor nota" valor={melhorResultado} cor="#22935e" />
          <Barra rotulo="Menor nota" valor={menorResultado} cor="#889bb3" />
          <Barra rotulo="Meta de referência" valor={META} cor="#d5a11a" />
        </div>
      </section>
      </CartaoAmpliavel>
      <CartaoAmpliavel titulo="Aproveitamento geral" tamanho="grande">
      <section className="desempenho-painel">
        <div className="desempenho-painel-cabecalho"><div><h2>Aproveitamento geral</h2><p>Distribuição das questões avaliadas.</p></div></div>
        {totalQuestoes === 0 ? <p className="desempenho-vazio">Nenhuma questão avaliada até agora.</p> : <>
          <div className="desempenho-aproveitamento-centro">
            <div className="desempenho-rosca" style={{ '--taxa': `${Math.max(0, Math.min(100, percentualAcertos))}%` }} role="img" aria-label={`${Math.round(percentualAcertos)}% de acertos`}>
              <div><strong>{Math.round(percentualAcertos)}%</strong><span>de acertos</span></div>
            </div>
          </div>
          <div className="desempenho-legendas">
            <div><i className="desempenho-legendas-cor verde" /><strong>{totalAcertos}</strong><span>Acertos</span></div>
            <div><i className="desempenho-legendas-cor cinza" /><strong>{totalErros}</strong><span>Erros</span></div>
          </div>
        </>}
      </section>
      </CartaoAmpliavel>
    </div>
  );
}
