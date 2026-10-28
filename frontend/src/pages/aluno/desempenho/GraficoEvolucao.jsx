import { CartaoAmpliavel } from './CartaoAmpliavel.jsx';
import { useEffect, useRef, useState } from 'react';
import { META } from './constants.js';
import { normalizarMateriaDesempenho } from '../../../utils/desempenhoInsights.js';

const ALTURA = 242;
const TOPO = 26;
const BASE = 198;
const ESQUERDA = 44;
const DIREITA = 24;

function obterTempo(resultado) {
  const tempo = new Date(resultado?.data_realizacao ?? '').getTime();
  return Number.isFinite(tempo) ? tempo : 0;
}

export function GraficoEvolucao({ resultadosCronologicos, obterNomeSimulado, formatarData }) {
  const [intervalo, setIntervalo] = useState('8');
  const [materia, setMateria] = useState('todas');
  const [selecionado, setSelecionado] = useState(null);
  const graficoRef = useRef(null);
  const [larguraVisivel, setLarguraVisivel] = useState(680);
  useEffect(() => {
    const elemento = graficoRef.current;
    if (!elemento || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([entrada]) => {
      setLarguraVisivel(Math.floor(entrada.contentRect.width));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);
  const materiaDoResultado = (resultado) => normalizarMateriaDesempenho(resultado?.materia) || 'Gerais / sem matéria';
  const materias = [...new Set(resultadosCronologicos.map(materiaDoResultado))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtrados = materia === 'todas' ? resultadosCronologicos : resultadosCronologicos.filter((resultado) => materiaDoResultado(resultado) === materia);
  const lista = intervalo === 'todos' ? filtrados : filtrados.slice(-8);
  const largura = Math.max(680, larguraVisivel, lista.length * 76);
  const areaUtil = largura - ESQUERDA - DIREITA;
  const posX = (index) => lista.length === 1 ? ESQUERDA + areaUtil / 2 : ESQUERDA + index * (areaUtil / (lista.length - 1));
  const posY = (valor) => BASE - Math.max(0, Math.min(100, Number(valor) || 0)) * ((BASE - TOPO) / 100);
  const pontos = lista.map((resultado, index) => ({
    ...resultado,
    x: posX(index),
    y: posY(resultado.porcentagem),
    valor: Math.round(Math.max(0, Math.min(100, Number(resultado.porcentagem) || 0))),
    etiqueta: obterNomeSimulado(resultado, resultadosCronologicos.indexOf(resultado)),
    data: formatarData(resultado.data_realizacao)
  }));
  const linha = pontos.map((p) => `${p.x},${p.y}`).join(' ');
  const pontoAtivo = selecionado != null ? pontos[selecionado] : null;

  return (
    <CartaoAmpliavel titulo="Evolução dos simulados" tamanho="extra">
    <section className="desempenho-painel desempenho-grafico" aria-labelledby="desempenho-grafico-titulo">
      <div className="desempenho-painel-cabecalho">
        <div>
          <h2 id="desempenho-grafico-titulo">Sua evolução nos simulados</h2>
          <p>Veja como suas notas mudaram e filtre por matéria.</p>
        </div>
        <div className="desempenho-grafico-filtros">
          {materias.length > 1 && <label className="desempenho-campo-filtro">Matéria
            <select aria-label="Filtrar evolução por matéria" value={materia} onChange={(event) => { setMateria(event.target.value); setSelecionado(null); }}>
              <option value="todas">Todas as matérias</option>
              {materias.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
            </select>
          </label>}
          {filtrados.length > 8 && (
          <div className="desempenho-opcoes" role="group" aria-label="Quantidade de tentativas no gráfico">
            <button type="button" className={intervalo === '8' ? 'ativo' : ''} onClick={() => { setIntervalo('8'); setSelecionado(null); }} aria-pressed={intervalo === '8'}>Últimas 8</button>
            <button type="button" className={intervalo === 'todos' ? 'ativo' : ''} onClick={() => { setIntervalo('todos'); setSelecionado(null); }} aria-pressed={intervalo === 'todos'}>Todas</button>
          </div>
          )}
        </div>
      </div>

      {!lista.length ? (
        <p className="desempenho-vazio">Ainda não há resultados para este filtro.</p>
      ) : (
        <>
          <div className="desempenho-grafico-legenda"><span className="desempenho-legenda-ponto"/> Resultado <span className="desempenho-legenda-meta"/> Meta {META}%</div>
          <div ref={graficoRef} className="desempenho-grafico-rolagem" role="region" tabIndex="0" aria-label="Gráfico de evolução. Role horizontalmente se necessário">
            <svg viewBox={`0 0 ${largura} ${ALTURA}`} width={largura} height={ALTURA} role="img" aria-label={`Notas de ${lista.length} tentativas, de 0 a 100 por cento`}>
              {[0,25,50,75,100].map((valor) => {
                const y = posY(valor);
                return <g key={valor}>
                  <line x1={ESQUERDA} y1={y} x2={largura-DIREITA} y2={y} stroke="#e1e9f3" strokeDasharray="4 5" />
                  <text x={ESQUERDA-12} y={y+4} textAnchor="end" className="desempenho-svg-eixo">{valor}%</text>
                </g>;
              })}
              <line x1={ESQUERDA} y1={posY(META)} x2={largura-DIREITA} y2={posY(META)} stroke="#cf9d1c" strokeDasharray="6 5" strokeWidth="1.5" />
              {pontos.length > 1 && <>
                <polygon points={`${linha} ${pontos.at(-1).x},${BASE} ${pontos[0].x},${BASE}`} fill="#2887ed" fillOpacity=".075" />
                <polyline points={linha} fill="none" stroke="#2082ea" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              </>}
              {pontos.map((ponto, indice) => {
                return <g key={ponto.id ?? `${ponto.data}-${indice}`}>
                  <circle cx={ponto.x} cy={ponto.y} r="12" fill="transparent" />
                  <circle cx={ponto.x} cy={ponto.y} r="5.5" fill="#fff" stroke="#2082ea" strokeWidth="3" />
                  <text x={ponto.x} y={ponto.y-14} className="desempenho-svg-valor" textAnchor="middle">{ponto.valor}%</text>
                  <text x={ponto.x} y={BASE+23} className="desempenho-svg-eixo" textAnchor="middle">{lista.length > 1 ? `#${resultadosCronologicos.indexOf(lista[indice])+1}` : 'Tentativa 1'}</text>
                  <title>{`${ponto.etiqueta} · ${ponto.data} · ${ponto.valor}%`}</title>
                  <circle cx={ponto.x} cy={ponto.y} r="13" fill="transparent" role="button" tabIndex="0" aria-label={`Ver ${ponto.etiqueta}: ${ponto.valor}% em ${ponto.data}`} onClick={() => setSelecionado(indice)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelecionado(indice); } }} />
                </g>;
              })}
            </svg>
          </div>
          <div className="desempenho-grafico-rodape">
            {pontoAtivo ? <span><strong>{pontoAtivo.etiqueta}</strong> · {pontoAtivo.data} · {pontoAtivo.valor}%</span> : <span>Selecione um ponto para ver o nome e a data do simulado.</span>}
            <span>{obterTempo(lista[0]) && obterTempo(lista.at(-1)) ? `${formatarData(lista[0].data_realizacao)} a ${formatarData(lista.at(-1).data_realizacao)}` : `${lista.length} tentativas exibidas`}</span>
          </div>
        </>
      )}
    </section>
    </CartaoAmpliavel>
  );
}
