import { useState } from 'react';
import '../../styles/shared/BlocosDidaticos.css';
import { TextoFormatado } from './TextoFormatado.jsx';
import { FormulaMatematica } from './FormulaMatematica.jsx';

const texto = valor => String(valor ?? '').trim();

export function BlocoDidatico({ tipo, dados = {} }) {
  const [alternativa, setAlternativa] = useState(null);
  const [aberto, setAberto] = useState(false);
  const titulo = dados.titulo || {
    formula: 'Fórmula matemática', exemplo: 'Exemplo resolvido', exemplos: 'Certo ou errado', tabela: 'Tabela comparativa',
    pergunta: 'Teste seu conhecimento', linha_tempo: 'Linha do tempo', glossario: 'Glossário', expansivel: 'Saiba mais'
  }[tipo];
  const itens = Array.isArray(dados.itens) ? dados.itens : [];
  const passos = Array.isArray(dados.passos) ? dados.passos : [];
  const alternativas = Array.isArray(dados.alternativas) ? dados.alternativas : [];
  const resposta = Number(dados.correta ?? 0);

  return <section className={`pagina-content-block tenna-didatico tenna-didatico-${tipo}`}>
    {tipo !== 'expansivel' && <h2>{titulo}</h2>}
    {dados.descricao && <TextoFormatado texto={dados.descricao} />}

    {tipo === 'formula' && <>
      <div className="tenna-formula-visor"><FormulaMatematica expressao={dados.expressao} /></div>
      {dados.legenda && <p className="tenna-didatico-legenda">{dados.legenda}</p>}
    </>}

    {tipo === 'exemplo' && <>
      {dados.enunciado && <div className="tenna-didatico-enunciado"><TextoFormatado texto={dados.enunciado} /></div>}
      <div className="tenna-passos">{passos.filter(p => texto(p?.texto) || texto(p?.formula)).map((passo, i) => <div className="tenna-passo" key={i}>
        <span className="tenna-passo-numero">{i + 1}</span>
        <div>{passo.texto && <TextoFormatado texto={passo.texto} />}{passo.formula && <FormulaMatematica expressao={passo.formula} />}</div>
      </div>)}</div>
      {dados.resultado && <div className="tenna-resultado"><strong>Resposta:</strong> <TextoFormatado texto={dados.resultado} /></div>}
    </>}

    {tipo === 'exemplos' && <>
      <div className="tenna-exemplos-comparacao">
        <div className="tenna-exemplo-certo"><strong>✓ Exemplo correto</strong><TextoFormatado texto={dados.correto || ''} /></div>
        <div className="tenna-exemplo-errado"><strong>✕ Exemplo incorreto</strong><TextoFormatado texto={dados.incorreto || ''} /></div>
      </div>
      {dados.explicacao && <div className="tenna-exemplos-explicacao"><strong>Entenda a diferença</strong><TextoFormatado texto={dados.explicacao} /></div>}
    </>}

    {tipo === 'tabela' && <div className="tenna-tabela-scroll"><table className="tenna-tabela">
      <thead><tr>{(dados.colunas || []).map((col, i) => <th scope="col" key={i}>{col}</th>)}</tr></thead>
      <tbody>{(dados.linhas || []).map((linha, i) => <tr key={i}>{(dados.colunas || []).map((_, j) => <td key={j}>{linha?.[j] || '—'}</td>)}</tr>)}</tbody>
    </table></div>}

    {tipo === 'pergunta' && <>
      <p className="tenna-pergunta-enunciado">{dados.enunciado || 'Responda à questão:'}</p>
      <div className="tenna-alternativas">{alternativas.map((opcao, i) => <button key={i} type="button"
        className={`tenna-alternativa ${alternativa === i ? 'selecionada' : ''} ${alternativa !== null && resposta === i ? 'correta' : ''}`}
        aria-pressed={alternativa === i} onClick={() => setAlternativa(i)}>
        <span>{String.fromCharCode(65 + i)}</span>{opcao}
      </button>)}</div>
      {alternativa !== null && <div className={`tenna-feedback ${alternativa === resposta ? 'acerto' : 'erro'}`} role="status">
        <strong>{alternativa === resposta ? 'Resposta correta!' : 'Vamos revisar?'}</strong>
        {dados.explicacao && <TextoFormatado texto={dados.explicacao} />}
        <button type="button" onClick={() => setAlternativa(null)}>Tentar novamente</button>
      </div>}
    </>}

    {tipo === 'linha_tempo' && <ol className="tenna-linha-tempo">{itens.map((item, i) => <li key={i}>
      <span className="tenna-data">{item.data || 'Evento'}</span>
      <div><strong>{item.titulo}</strong>{item.texto && <TextoFormatado texto={item.texto} />}</div>
    </li>)}</ol>}

    {tipo === 'glossario' && <dl className="tenna-glossario">{itens.map((item, i) => <div key={i}>
      <dt>{item.termo}</dt><dd>{item.definicao}</dd>
    </div>)}</dl>}

    {tipo === 'expansivel' && <div className="tenna-expansivel">
      <button type="button" className="tenna-expansivel-botao" aria-expanded={aberto} onClick={() => setAberto(a => !a)}>
        <strong>{titulo}</strong><span aria-hidden="true">{aberto ? '−' : '+'}</span>
      </button>
      {aberto && <div className="tenna-expansivel-corpo"><TextoFormatado texto={dados.texto || ''} />
        {dados.formula && <FormulaMatematica expressao={dados.formula} />}
      </div>}
    </div>}
  </section>;
}
