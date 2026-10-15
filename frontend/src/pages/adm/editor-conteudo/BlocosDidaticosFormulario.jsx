import { EditorMatematico } from '../../../components/conteudos/FormulaMatematica.jsx';
import { BlocoDidatico } from '../../../components/conteudos/BlocosDidaticos.jsx';
import { EditorTextoFormatavel } from './EditorTextoFormatavel.jsx';

function Campo({ rotulo, valor, onChange, multiline = false, placeholder = '' }) {
  return <label className="editor-field"><span className="editor-field-label">{rotulo}</span>
    {multiline ? <textarea rows={3} value={valor || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      : <input value={valor || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
  </label>;
}
function EditorItens({ itens, atualizar, vazio, titulo = 'Itens', render }) {
  const lista = Array.isArray(itens) ? itens : [];
  return <div className="tenna-itens-editor">
    <div className="tenna-itens-cabecalho"><strong>{titulo}</strong><button type="button" className="editor-small-button" onClick={() => atualizar([...lista, typeof vazio === 'function' ? vazio() : vazio])}>+ Adicionar</button></div>
    {lista.map((item, index) => <div className="tenna-item-editor" key={index}>
      <div className="tenna-item-editor-top"><strong>{titulo === 'Passos da solução' ? `Passo ${index + 1}` : `Item ${index + 1}`}</strong>
        <div className="tenna-item-acoes">
          <button type="button" title="Subir" disabled={index === 0} onClick={() => { const copia = [...lista]; [copia[index - 1], copia[index]] = [copia[index], copia[index - 1]]; atualizar(copia); }}>↑</button>
          <button type="button" title="Descer" disabled={index === lista.length - 1} onClick={() => { const copia = [...lista]; [copia[index], copia[index + 1]] = [copia[index + 1], copia[index]]; atualizar(copia); }}>↓</button>
          <button type="button" title="Remover" onClick={() => atualizar(lista.filter((_, i) => i !== index))}>Excluir</button>
        </div>
      </div>
      {render(item, atualizacao => atualizar(lista.map((v, i) => i === index ? { ...v, ...atualizacao } : v)), index)}
    </div>)}
  </div>;
}

export function BlocosDidaticosFormulario({ tipo, dados, atualizarDado }) {
  const mudar = (chave) => (valor) => atualizarDado(chave, valor);
  const camposComTitulo = tipo !== 'expansivel';
  const colunas = Array.isArray(dados.colunas) ? dados.colunas : [];
  const linhas = Array.isArray(dados.linhas) ? dados.linhas : [];
  const alterarColunas = (novas) => {
    mudar('colunas')(novas);
    mudar('linhas')(linhas.map(linha => novas.map((_, i) => linha?.[i] || '')));
  };
  return <div className="tenna-didatico-form">
    {camposComTitulo && <Campo rotulo="Título do bloco" valor={dados.titulo} onChange={mudar('titulo')} />}
    {tipo === 'formula' && <>
      <EditorMatematico valor={dados.expressao || ''} onChange={mudar('expressao')} />
      <Campo rotulo="Explicação da fórmula (opcional)" valor={dados.descricao} onChange={mudar('descricao')} multiline />
      <Campo rotulo="Legenda (opcional)" valor={dados.legenda} onChange={mudar('legenda')} />
    </>}

    {tipo === 'exemplo' && <>
      <EditorTextoFormatavel titulo="Enunciado / objetivo" valor={dados.enunciado || ''} onChange={mudar('enunciado')} linhas={4} />
      <EditorItens titulo="Passos da solução" itens={dados.passos} vazio={() => ({ texto: '', formula: '' })} atualizar={mudar('passos')}
        render={(item, mudarItem) => <>
          <Campo rotulo="Explicação do passo" valor={item.texto} onChange={texto => mudarItem({ texto })} multiline />
          <EditorMatematico valor={item.formula || ''} onChange={formula => mudarItem({ formula })} titulo="Conta / fórmula deste passo (opcional)" />
        </>} />
      <Campo rotulo="Resposta final" valor={dados.resultado} onChange={mudar('resultado')} />
    </>}

    {tipo === 'exemplos' && <>
      <Campo rotulo="Exemplo correto" valor={dados.correto} onChange={mudar('correto')} multiline placeholder="Ex.: 20% de 150 = 30" />
      <Campo rotulo="Exemplo incorreto" valor={dados.incorreto} onChange={mudar('incorreto')} multiline placeholder="Ex.: 20% de 150 = 300" />
      <EditorTextoFormatavel titulo="Por que um está correto?" valor={dados.explicacao || ''} onChange={mudar('explicacao')} linhas={4} />
    </>}

    {tipo === 'tabela' && <>
      <Campo rotulo="Explicação da tabela (opcional)" valor={dados.descricao} onChange={mudar('descricao')} />
      <div className="tenna-itens-cabecalho"><strong>Colunas</strong><button type="button" className="editor-small-button" onClick={() => alterarColunas([...colunas, `Coluna ${colunas.length + 1}`])}>+ Coluna</button></div>
      <div className="tenna-table-editor-head">{colunas.map((col, i) => <div key={i}>
        <input aria-label={`Título da coluna ${i + 1}`} value={col} onChange={e => alterarColunas(colunas.map((v, j) => i === j ? e.target.value : v))} />
        <button type="button" disabled={colunas.length <= 1} onClick={() => {
          mudar('colunas')(colunas.filter((_, j) => i !== j));
          mudar('linhas')(linhas.map(linha => linha.filter((_, j) => i !== j)));
        }}>Remover</button></div>)}</div>
      <div className="tenna-itens-cabecalho"><strong>Linhas</strong><button type="button" className="editor-small-button" onClick={() => mudar('linhas')([...linhas, colunas.map(() => '')])}>+ Linha</button></div>
      {linhas.map((linha, i) => <div className="tenna-table-editor-row" key={i}>
        <div className="tenna-table-editor-cells">{colunas.map((_, j) => <input key={j} aria-label={`Linha ${i + 1}, coluna ${j + 1}`} value={linha?.[j] || ''}
          onChange={e => mudar('linhas')(linhas.map((row, r) => r === i ? colunas.map((__, c) => c === j ? e.target.value : row?.[c] || '') : row))}/>)}</div>
        <button type="button" className="editor-small-button" onClick={() => mudar('linhas')(linhas.filter((_, r) => r !== i))}>Excluir linha</button>
      </div>)}
    </>}

    {tipo === 'pergunta' && <>
      <Campo rotulo="Pergunta" valor={dados.enunciado} onChange={mudar('enunciado')} multiline />
      {(dados.alternativas || []).map((alternativa, i) => <label className="editor-field tenna-choice-editor" key={i}>
        <span className="editor-field-label"><input type="radio" name="correta-pergunta" checked={Number(dados.correta || 0) === i} onChange={() => mudar('correta')(i)} /> Correta: {String.fromCharCode(65 + i)}</span>
        <input value={alternativa} onChange={e => mudar('alternativas')(dados.alternativas.map((v, j) => j === i ? e.target.value : v))} />
        <button type="button" className="editor-small-button" disabled={(dados.alternativas || []).length <= 2} onClick={() => {
          mudar('alternativas')(dados.alternativas.filter((_, j) => j !== i));
          mudar('correta')(0);
        }}>Remover</button>
      </label>)}
      <button type="button" className="editor-small-button" disabled={(dados.alternativas || []).length >= 5} onClick={() => mudar('alternativas')([...(dados.alternativas || []), ''])}>+ Alternativa</button>
      <EditorTextoFormatavel titulo="Explicação após responder" valor={dados.explicacao || ''} onChange={mudar('explicacao')} linhas={4} />
    </>}

    {tipo === 'linha_tempo' && <EditorItens itens={dados.itens} atualizar={mudar('itens')} vazio={() => ({ data: '', titulo: '', texto: '' })} titulo="Acontecimentos"
      render={(item, mudarItem) => <>
        <Campo rotulo="Data / período" valor={item.data} onChange={data => mudarItem({ data })} placeholder="Ex.: 1822" />
        <Campo rotulo="Nome do acontecimento" valor={item.titulo} onChange={titulo => mudarItem({ titulo })} />
        <Campo rotulo="Descrição" valor={item.texto} onChange={texto => mudarItem({ texto })} multiline />
      </>} />}

    {tipo === 'glossario' && <EditorItens itens={dados.itens} atualizar={mudar('itens')} vazio={() => ({ termo: '', definicao: '' })} titulo="Termos do glossário"
      render={(item, mudarItem) => <>
        <Campo rotulo="Termo" valor={item.termo} onChange={termo => mudarItem({ termo })} />
        <Campo rotulo="Definição" valor={item.definicao} onChange={definicao => mudarItem({ definicao })} multiline />
      </>} />}

    {tipo === 'expansivel' && <>
      <Campo rotulo="Título que aparece para o estudante" valor={dados.titulo} onChange={mudar('titulo')} placeholder="Ex.: Saiba mais" />
      <EditorTextoFormatavel titulo="Texto ao expandir" valor={dados.texto || ''} onChange={mudar('texto')} linhas={6} />
      <EditorMatematico titulo="Fórmula complementar (opcional)" valor={dados.formula || ''} onChange={mudar('formula')} />
    </>}

    <div className="editor-live-preview tenna-didatico-preview"><span className="editor-panel-kicker">PRÉVIA DO ESTUDANTE</span><BlocoDidatico tipo={tipo} dados={dados} /></div>
  </div>;
}
