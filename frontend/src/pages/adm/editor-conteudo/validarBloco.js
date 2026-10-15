export function pendenciaDoBloco(bloco) {
  const d = bloco?.dados || {};
  const vazio = valor => !String(valor ?? '').trim();
  switch (bloco?.tipo) {
    case 'texto': return vazio(d.texto) ? 'Texto sem explicação' : '';
    case 'destaque': return vazio(d.texto) ? 'Destaque sem mensagem' : '';
    case 'formula': return vazio(d.expressao) || d.expressao === String.raw`\frac{a}{b}` ? 'Preencha a fórmula matemática' : '';
    case 'exemplo': return !(d.passos || []).some(p => !vazio(p.texto) || !vazio(p.formula)) ? 'O exemplo precisa de pelo menos um passo' : '';
    case 'exemplos': return vazio(d.correto) || vazio(d.incorreto) ? 'Preencha o exemplo correto e o incorreto' : '';
    case 'tabela': return !(d.colunas?.length && d.linhas?.length && d.linhas.some(l => l.some(v => !vazio(v)))) ? 'Preencha a tabela' : '';
    case 'pergunta': return vazio(d.enunciado) || (d.alternativas || []).filter(a => !vazio(a)).length < 2 ||
      vazio(d.alternativas?.[Number(d.correta) || 0]) ? 'Preencha a pergunta, ao menos duas alternativas e a correta' : '';
    case 'linha_tempo': return !(d.itens || []).some(i => !vazio(i.titulo)) ? 'Adicione ao menos um acontecimento' : '';
    case 'glossario': return !(d.itens || []).some(i => !vazio(i.termo) && !vazio(i.definicao)) ? 'Preencha um termo e sua definição' : '';
    case 'expansivel': return vazio(d.texto) && vazio(d.formula) ? 'Adicione uma explicação ao Saiba mais' : '';
    case 'lista': case 'checklist': return !(d.itens || []).some(i => !vazio(i)) ? 'Adicione ao menos um item à lista' : '';
    case 'flashcards': return !(d.flashcardIds || []).length ? 'Selecione flashcards de revisão' : '';
    case 'questoes': return !(d.questaoIds || []).length ? 'Selecione questões' : '';
    case 'video': return vazio(d.url) ? 'Informe o link do vídeo' : '';
    case 'imagem': return vazio(d.url) ? 'Informe a URL da imagem' : '';
    case 'pdf': return vazio(d.url) ? 'Informe a URL do PDF' : '';
    case 'simulado': return !d.simuladoId ? 'Selecione um simulado' : '';
    default: return '';
  }
}
