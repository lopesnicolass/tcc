export const TEMAS_CONTEUDO = [
  { id: 'azul', nome: 'Azul oceano', cor: '#1464d9', escura: '#0b3679', clara: '#e9f4ff' },
  { id: 'violeta', nome: 'Violeta criativo', cor: '#8057d9', escura: '#432683', clara: '#f2edff' },
  { id: 'verde', nome: 'Verde natureza', cor: '#16877a', escura: '#10514f', clara: '#e9f8f1' },
  { id: 'coral', nome: 'Coral energético', cor: '#db7047', escura: '#923b3e', clara: '#fff0e8' },
];

export const APARENCIA_PADRAO = {
  tema: 'azul', formato: 'trilha',
  rotulo: 'MATERIAL DE ESTUDO',
  mensagem: 'Um passo de cada vez. Você consegue!',
  minutos: 8, mostrarIndice: true,
  cabecalho: 'compacto', tamanhoTexto: 'normal', larguraLeitura: 'confortavel',
  mostrarEtapas: false, mostrarMensagem: false, mostrarDetalhes: false,
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
    cabecalho: ['compacto', 'amplo'].includes(dados.cabecalho) ? dados.cabecalho : APARENCIA_PADRAO.cabecalho,
    tamanhoTexto: ['normal', 'grande'].includes(dados.tamanhoTexto) ? dados.tamanhoTexto : APARENCIA_PADRAO.tamanhoTexto,
    larguraLeitura: ['confortavel', 'ampla'].includes(dados.larguraLeitura) ? dados.larguraLeitura : APARENCIA_PADRAO.larguraLeitura,
    mostrarEtapas: typeof dados.mostrarEtapas === 'boolean' ? dados.mostrarEtapas : APARENCIA_PADRAO.mostrarEtapas,
    mostrarMensagem: typeof dados.mostrarMensagem === 'boolean' ? dados.mostrarMensagem : APARENCIA_PADRAO.mostrarMensagem,
    mostrarDetalhes: typeof dados.mostrarDetalhes === 'boolean' ? dados.mostrarDetalhes : APARENCIA_PADRAO.mostrarDetalhes,
  };
}

export function obterPaleta(aparencia) {
  return TEMAS_CONTEUDO.find((item) => item.id === aparencia.tema) || TEMAS_CONTEUDO[0];
}

// Identidade visual única para toda a matéria, inclusive em aulas antigas.
// A configuração `tema` salva nas páginas antigas não muda mais a cor.
export const PALETAS_MATERIAS = Object.freeze({
  'portugues': { id: 'portugues', nome: 'Português', cor: '#51A9E5', escura: '#1455A6', clara: '#E8F5FE' },
  'matematica': { id: 'matematica', nome: 'Matemática', cor: '#E8565B', escura: '#A93443', clara: '#FFF0F1' },
  'historia': { id: 'historia', nome: 'História', cor: '#AA7541', escura: '#86522E', clara: '#FDF4EA' },
  'geografia': { id: 'geografia', nome: 'Geografia', cor: '#55A75B', escura: '#297340', clara: '#EDF9EF' },
  'ciencias': { id: 'ciencias', nome: 'Ciências', cor: '#8C5AD0', escura: '#613B9A', clara: '#F4EEFF' },
});

export function obterPaletaMateria(nome = '') {
  const chave = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return PALETAS_MATERIAS[chave] || PALETAS_MATERIAS.portugues;
}
