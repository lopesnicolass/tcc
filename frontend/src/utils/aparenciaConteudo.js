export const TEMAS_CONTEUDO = [
  { id: 'azul', nome: 'Azul oceano', cor: '#1464d9', escura: '#0b3679', clara: '#e9f4ff' },
  { id: 'violeta', nome: 'Violeta criativo', cor: '#8057d9', escura: '#432683', clara: '#f2edff' },
  { id: 'verde', nome: 'Verde natureza', cor: '#16877a', escura: '#10514f', clara: '#e9f8f1' },
  { id: 'coral', nome: 'Coral energético', cor: '#db7047', escura: '#923b3e', clara: '#fff0e8' },
];

export const APARENCIA_PADRAO = {
  tema: 'azul', formato: 'trilha',
  rotulo: 'TRILHA DE APRENDIZAGEM',
  mensagem: 'Um passo de cada vez. Você consegue!',
  minutos: 8, mostrarIndice: true,
};

export function normalizarAparencia(entrada) {
  let dados = entrada;
  if (typeof dados === 'string') {
    try { dados = JSON.parse(dados); } catch { dados = {}; }
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) dados = {};
  return {
    tema: TEMAS_CONTEUDO.some((item) => item.id === dados.tema) ? dados.tema : APARENCIA_PADRAO.tema,
    formato: ['trilha', 'cartoes'].includes(dados.formato) ? dados.formato : APARENCIA_PADRAO.formato,
    rotulo: typeof dados.rotulo === 'string' ? dados.rotulo.slice(0, 48) : APARENCIA_PADRAO.rotulo,
    mensagem: typeof dados.mensagem === 'string' ? dados.mensagem.slice(0, 180) : APARENCIA_PADRAO.mensagem,
    minutos: Number.isInteger(Number(dados.minutos)) && Number(dados.minutos) >= 1 && Number(dados.minutos) <= 180
      ? Number(dados.minutos) : APARENCIA_PADRAO.minutos,
    mostrarIndice: typeof dados.mostrarIndice === 'boolean' ? dados.mostrarIndice : APARENCIA_PADRAO.mostrarIndice,
  };
}

export function obterPaleta(aparencia) {
  return TEMAS_CONTEUDO.find((item) => item.id === aparencia.tema) || TEMAS_CONTEUDO[0];
}
