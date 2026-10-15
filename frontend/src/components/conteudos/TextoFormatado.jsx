import React from 'react';
import { FormulaMatematica } from './FormulaMatematica.jsx';

// Formatação limitada e segura: o texto nunca é interpretado como HTML.
// Suporta **negrito**, *itálico*, ==marca-texto== e linhas iniciadas por "- ".
function formatarTrechos(texto, prefixo = 'trecho') {
  const partes = String(texto || '').split(/(\[math:[^\]\n]+\]|\*\*[^*\n]+\*\*|==[^=\n]+==|\*[^*\n]+\*)/g);
  return partes.map((parte, indice) => {
    const key = `${prefixo}-${indice}`;
    if (/^\[math:[^\]\n]+\]$/.test(parte)) return <FormulaMatematica key={key} inline expressao={parte.slice(6, -1)} />;
    if (/^\*\*[^*\n]+\*\*$/.test(parte)) return <strong key={key}>{parte.slice(2, -2)}</strong>;
    if (/^==[^=\n]+==$/.test(parte)) return <mark key={key} className="tenna-text-mark">{parte.slice(2, -2)}</mark>;
    if (/^\*[^*\n]+\*$/.test(parte)) return <em key={key}>{parte.slice(1, -1)}</em>;
    return <React.Fragment key={key}>{parte}</React.Fragment>;
  });
}

export function TextoFormatado({ texto, className = '' }) {
  const linhas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
  const grupos = [];
  let paragrafo = [];
  let lista = [];
  function descarregarParagrafo() {
    if (paragrafo.length) grupos.push({ tipo: 'paragrafo', itens: paragrafo });
    paragrafo = [];
  }
  function descarregarLista() {
    if (lista.length) grupos.push({ tipo: 'lista', itens: lista });
    lista = [];
  }
  linhas.forEach((linha) => {
    if (!linha.trim()) { descarregarParagrafo(); descarregarLista(); return; }
    if (/^\s*[-•]\s+/.test(linha)) {
      descarregarParagrafo();
      lista.push(linha.replace(/^\s*[-•]\s+/, ''));
    } else {
      descarregarLista();
      paragrafo.push(linha);
    }
  });
  descarregarParagrafo();
  descarregarLista();
  return (
    <div className={`tenna-texto-formatado ${className}`.trim()}>
      {grupos.map((grupo, indice) => grupo.tipo === 'lista'
        ? <ul key={indice}>{grupo.itens.map((item, i) => <li key={i}>{formatarTrechos(item, `${indice}-${i}`)}</li>)}</ul>
        : <p key={indice}>{grupo.itens.map((linha, i) => <React.Fragment key={i}>{i > 0 && <br />}{formatarTrechos(linha, `${indice}-${i}`)}</React.Fragment>)}</p>
      )}
    </div>
  );
}
