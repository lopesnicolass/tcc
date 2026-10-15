import { CartaoAmpliavel } from './CartaoAmpliavel.jsx';
import { useMemo, useState } from 'react';

export function Historico({ resultados, mediaGeral, limitar, obterNomeSimulado, formatarData, porcentagem }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const ordenados = useMemo(() => [...resultados].sort((a, b) => {
    const dataA = new Date(a.data_realizacao || 0).getTime();
    const dataB = new Date(b.data_realizacao || 0).getTime();
    if (Number.isFinite(dataA) && Number.isFinite(dataB) && dataA !== dataB) return dataB - dataA;
    return Number(b.id || 0) - Number(a.id || 0);
  }), [resultados]);
  const visiveis = mostrarTodos ? ordenados : ordenados.slice(0, 6);
  return <CartaoAmpliavel titulo="Histórico de simulados" tamanho="extra"><section className="desempenho-painel desempenho-historico" aria-labelledby="desempenho-historico-titulo">
    <div className="desempenho-painel-cabecalho"><div><h2 id="desempenho-historico-titulo">Histórico de simulados</h2><p>Resultados organizados do mais recente para o mais antigo.</p></div><span className="desempenho-contador">{resultados.length} {resultados.length === 1 ? 'tentativa' : 'tentativas'}</span></div>
    {!visiveis.length ? <p className="desempenho-vazio">Seu histórico aparecerá após finalizar o primeiro simulado.</p> : <>
      <div className="desempenho-historico-lista">
        {visiveis.map((resultado, index) => {
          const valor = limitar(resultado.porcentagem);
          const acimaDaMedia = valor >= mediaGeral;
          return <div className="desempenho-historico-row" key={resultado.id ?? `${resultado.data_realizacao}-${index}`}>
            <div className="desempenho-historico-identificacao">
              <strong title={obterNomeSimulado(resultado, ordenados.length - index - 1)}>{obterNomeSimulado(resultado, ordenados.length - index - 1)}</strong>
              <span>{formatarData(resultado.data_realizacao) || 'Data indisponível'}</span>
            </div>
            <div className="desempenho-barra desempenho-historico-barra" role="progressbar" aria-label="Aproveitamento da tentativa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)}><span className={acimaDaMedia ? '' : 'abaixo'} style={{ width: `${valor}%` }}/></div>
            <strong className="desempenho-historico-porcentagem">{porcentagem(valor)}</strong>
          </div>;
        })}
      </div>
      {resultados.length > 6 && <div className="desempenho-historico-rodape"><button type="button" className="desempenho-botao-secundario" onClick={() => setMostrarTodos(!mostrarTodos)}>{mostrarTodos ? 'Mostrar apenas recentes' : `Ver todas as ${resultados.length} tentativas`}</button></div>}
    </>}
  </section></CartaoAmpliavel>;
}
