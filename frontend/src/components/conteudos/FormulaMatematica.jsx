import React, { useRef, useState, useId } from 'react';

// Renderizador MathML local. Não usa HTML arbitrário nem depende de CDN.
// Aceita frações, raízes, expoentes, índices, símbolos comuns e agrupamentos.
const SIMBOLOS = {
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', neq: '≠', leq: '≤', geq: '≥',
  approx: '≈', infty: '∞', pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ',
  delta: 'δ', Delta: 'Δ', sigma: 'σ', Sigma: 'Σ', omega: 'ω', Omega: 'Ω',
  mu: 'μ', lambda: 'λ', sqrt: '√', degree: '°', to: '→', rightarrow: '→',
  in: '∈', sum: '∑', int: '∫', percent: '%', ',': ' ', ';': ' ', quad: '  ',
};

function analisarExpressao(expressao) {
  const fonte = String(expressao || '').slice(0, 1800);
  let cursor = 0;
  let contador = 0;
  const limite = 700;
  const grupo = (filhos) => React.createElement('mrow', null, ...filhos);
  const texto = (tag, valor) => React.createElement(tag, null, valor);
  function lerGrupo() {
    while (/\s/.test(fonte[cursor] || '') && cursor < fonte.length) cursor++;
    if (fonte[cursor] === '{') {
      cursor++;
      const res = lerSequencia('}');
      if (fonte[cursor] === '}') cursor++;
      return grupo(res);
    }
    return lerAtomo() || texto('mtext', '□');
  }
  function lerAtomo() {
    if (cursor >= fonte.length || contador++ > limite) return null;
    const char = fonte[cursor++];
    if (char === '{') {
      const filhos = lerSequencia('}');
      if (fonte[cursor] === '}') cursor++;
      return grupo(filhos);
    }
    if (char === '\\') {
      const match = fonte.slice(cursor).match(/^([a-zA-Z]+|.)/);
      const comando = match?.[0] || '';
      cursor += comando.length;
      if (comando === 'frac' || comando === 'dfrac' || comando === 'tfrac') {
        return React.createElement('mfrac', null, lerGrupo(), lerGrupo());
      }
      if (comando === 'sqrt') return React.createElement('msqrt', null, lerGrupo());
      if (comando === 'text' || comando === 'mathrm') {
        if (fonte[cursor] === '{') {
          const fim = fonte.indexOf('}', cursor + 1);
          if (fim !== -1) {
            const valor = fonte.slice(cursor + 1, fim);
            cursor = fim + 1;
            return texto('mtext', valor);
          }
        }
        return lerGrupo();
      }
      if (comando === 'left' || comando === 'right') return null;
      return texto('mo', SIMBOLOS[comando] || comando);
    }
    if (/\d/.test(char)) {
      let numero = char;
      while (/[\d.,]/.test(fonte[cursor] || '') && cursor < fonte.length) numero += fonte[cursor++];
      return texto('mn', numero);
    }
    if (/[a-zA-Z]/.test(char)) return texto('mi', char);
    if (char === '□') return texto('mtext', '□');
    if (char === '\n') return texto('mspace', ' ');
    if (char === ' ') return texto('mspace', ' ');
    return texto('mo', char);
  }
  function lerSequencia(fechar) {
    const saida = [];
    while (cursor < fonte.length && contador < limite) {
      if (fechar && fonte[cursor] === fechar) break;
      if (fonte[cursor] === '^' || fonte[cursor] === '_') {
        const operacao = fonte[cursor++];
        const indice = lerGrupo();
        const base = saida.pop() || texto('mi', 'x');
        saida.push(React.createElement(operacao === '^' ? 'msup' : 'msub', null, base, indice));
        continue;
      }
      const antes = cursor;
      const item = lerAtomo();
      if (item) saida.push(item);
      if (antes === cursor) cursor++;
    }
    return saida;
  }
  return grupo(lerSequencia());
}

export function FormulaMatematica({ expressao = '', inline = false }) {
  return <span className={`tenna-math ${inline ? 'tenna-math-inline' : 'tenna-math-block'}`}>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display={inline ? 'inline' : 'block'}>
      {analisarExpressao(expressao || '\\frac{a}{b}')}
    </math>
  </span>;
}

const INSERCOES = [
  ['Fração', '\\frac{a}{b}'], ['Potência', 'x^{2}'], ['Raiz', '\\sqrt{x}'],
  ['Índice', 'a_{1}'], ['±', '\\pm'], ['×', '\\times'], ['÷', '\\div'],
  ['π', '\\pi'], ['≤', '\\leq'], ['≥', '\\geq'], ['Δ', '\\Delta'],
  ['Equação de 2º grau', 'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}'],
];

export function EditorMatematico({ valor = '', onChange, titulo = 'Expressão matemática' }) {
  const referencia = useRef(null);
  const campoId = useId();
  const [estrutura, setEstrutura] = useState('fracao');
  const [parteA, setParteA] = useState('a');
  const [parteB, setParteB] = useState('b');
  function montar(tipo, a, b) {
    switch (tipo) {
      case 'fracao': return `\\frac{${a || 'a'}}{${b || 'b'}}`;
      case 'potencia': return `${a || 'x'}^{${b || '2'}}`;
      case 'raiz': return `\\sqrt{${a || 'x'}}`;
      case 'equacao': return `${a || '2x+5'}=${b || '15'}`;
      case 'porcentagem': return `\\frac{${a || '20'}}{100}\\times ${b || '150'}`;
      default: return a;
    }
  }
  function escolher(tipo) {
    setEstrutura(tipo);
    if (tipo !== 'livre') onChange(montar(tipo, parteA, parteB));
  }
  function editarParte(chave, texto) {
    const a = chave === 'a' ? texto : parteA;
    const b = chave === 'b' ? texto : parteB;
    if (chave === 'a') setParteA(texto);
    else setParteB(texto);
    onChange(montar(estrutura, a, b));
  }
  const inserir = (expressao) => {
    const campo = referencia.current;
    const inicio = campo?.selectionStart ?? String(valor).length;
    const fim = campo?.selectionEnd ?? inicio;
    const atual = String(valor || '');
    const novo = atual.slice(0, inicio) + expressao + atual.slice(fim);
    onChange(novo);
    requestAnimationFrame(() => {
      campo?.focus();
      campo?.setSelectionRange(inicio + expressao.length, inicio + expressao.length);
    });
  };
  return <div className="tenna-math-editor">
    <label className="editor-field-label" htmlFor={campoId}>{titulo}</label>
    <div className="tenna-math-compositor">
      <label className="editor-field-label">Montar fórmula sem digitar comandos
        <select value={estrutura} onChange={e => escolher(e.target.value)}>
          <option value="fracao">Fração</option><option value="potencia">Potência</option>
          <option value="raiz">Raiz quadrada</option><option value="equacao">Equação</option>
          <option value="porcentagem">Porcentagem</option><option value="livre">Expressão livre</option>
        </select>
      </label>
      {estrutura !== 'livre' && <div className="tenna-math-compositor-campos">
        <label>{({ fracao: 'Numerador', potencia: 'Base', raiz: 'Radicando', equacao: 'Lado esquerdo', porcentagem: 'Percentual' })[estrutura]}
          <input value={parteA} onChange={e => editarParte('a', e.target.value)} />
        </label>
        {estrutura !== 'raiz' && <label>{({ fracao: 'Denominador', potencia: 'Expoente', equacao: 'Lado direito', porcentagem: 'Valor total' })[estrutura]}
          <input value={parteB} onChange={e => editarParte('b', e.target.value)} />
        </label>}
      </div>}
    </div>
    <div className="tenna-math-toolbar" role="toolbar" aria-label="Inserir estruturas matemáticas">
      {INSERCOES.map(([nome, entrada]) => <button key={nome} type="button" onClick={() => inserir(entrada)} title={`Inserir ${nome}`}>{nome}</button>)}
    </div>
    <textarea id={campoId} ref={referencia} rows={3} spellCheck={false}
      value={valor} onChange={e => onChange(e.target.value)}
      placeholder="Escolha uma estrutura acima e substitua as letras por números" />
    <small className="editor-field-help">Escolha uma estrutura e preencha os campos acima. Para contas com várias operações, use também os botões e o campo de expressão. A prévia é atualizada automaticamente.</small>
    <div className="tenna-math-preview" aria-live="polite"><FormulaMatematica expressao={valor || '\\frac{a}{b}'} /></div>
  </div>;
}
