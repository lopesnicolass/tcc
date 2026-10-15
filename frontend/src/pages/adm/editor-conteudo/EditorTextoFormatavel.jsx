import { useRef } from 'react';
import { TextoFormatado } from '../../../components/conteudos/TextoFormatado.jsx';

export function EditorTextoFormatavel({ titulo = 'Conteúdo', valor = '', onChange, linhas = 8, placeholder = 'Digite seu texto...' }) {
  const referencia = useRef(null);

  function aplicarMarcador(antes, depois = antes, exemplo = 'texto importante') {
    const area = referencia.current;
    if (!area) return;
    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const atual = String(valor || '');
    const selecionado = atual.slice(inicio, fim) || exemplo;
    const inserido = `${antes}${selecionado}${depois}`;
    onChange(`${atual.slice(0, inicio)}${inserido}${atual.slice(fim)}`);
    requestAnimationFrame(() => {
      if (!referencia.current) return;
      referencia.current.focus();
      referencia.current.setSelectionRange(inicio + antes.length, inicio + antes.length + selecionado.length);
    });
  }

  function aplicarLista() {
    const area = referencia.current;
    if (!area) return;
    const atual = String(valor || '');
    const inicio = area.selectionStart;
    const fim = area.selectionEnd;
    const comecoLinha = atual.lastIndexOf('\n', inicio - 1) + 1;
    const fimLinhaBruto = atual.indexOf('\n', fim);
    const fimLinha = fimLinhaBruto === -1 ? atual.length : fimLinhaBruto;
    const selecionado = atual.slice(comecoLinha, fimLinha) || 'Primeiro item';
    const lista = selecionado.split('\n').map(linha => /^\s*[-•]\s+/.test(linha) ? linha : `- ${linha}`).join('\n');
    onChange(`${atual.slice(0, comecoLinha)}${lista}${atual.slice(fimLinha)}`);
    requestAnimationFrame(() => referencia.current?.focus());
  }

  return <div className="editor-formatted-field">
    <label className="editor-field-label" htmlFor="editor-conteudo-formatavel">{titulo}</label>
    <div className="editor-format-toolbar" role="toolbar" aria-label="Formatar conteúdo da aula">
      <button type="button" title="Negrito" aria-label="Aplicar negrito ao trecho selecionado" onMouseDown={e => e.preventDefault()} onClick={() => aplicarMarcador('**')}><strong>N</strong></button>
      <button type="button" title="Itálico" aria-label="Aplicar itálico ao trecho selecionado" onMouseDown={e => e.preventDefault()} onClick={() => aplicarMarcador('*')}><em>I</em></button>
      <button type="button" title="Marca-texto" aria-label="Destacar trecho selecionado" onMouseDown={e => e.preventDefault()} onClick={() => aplicarMarcador('==')}><span className="editor-marker-demo">A</span></button>
      <button type="button" title="Inserir fórmula matemática inline" onMouseDown={e => e.preventDefault()} onClick={() => aplicarMarcador('[math:', ']', '\\frac{a}{b}')}>½ Fórmula</button>
      <button type="button" title="Lista com marcadores" aria-label="Transformar linhas selecionadas em lista" onMouseDown={e => e.preventDefault()} onClick={aplicarLista}>☷ Lista</button>
    </div>
    <textarea id="editor-conteudo-formatavel" ref={referencia} rows={linhas} placeholder={placeholder} value={valor || ''} onChange={e => onChange(e.target.value)} />
    <small className="editor-field-help">Selecione palavras e use os botões acima. A prévia mostra como o estudante verá o conteúdo.</small>
    <div className="editor-formatted-preview" aria-label="Prévia da formatação">
      <span className="editor-field-label">Prévia do texto</span>
      {valor?.trim() ? <TextoFormatado texto={valor} /> : <small>Digite algo para visualizar a formatação.</small>}
    </div>
  </div>;
}
