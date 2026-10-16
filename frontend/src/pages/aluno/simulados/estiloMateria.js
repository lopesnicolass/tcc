const MATERIA_ESTILO = {
  Matemática: { sigla: '∑', classe: 'matematica' },
  Português: { sigla: 'A', classe: 'portugues' },
  História: { sigla: 'H', classe: 'historia' },
  Geografia: { sigla: 'G', classe: 'geografia' },
  Ciências: { sigla: 'C', classe: 'ciencias' },
  Biologia: { sigla: 'B', classe: 'biologia' },
  Química: { sigla: 'Q', classe: 'quimica' },
  Física: { sigla: 'F', classe: 'fisica' },
  Inglês: { sigla: 'EN', classe: 'ingles' },
  'Simulados Gerais': { sigla: '★', classe: 'gerais' },
 
};


export function estiloMateria(materia) {
  const configuracao = MATERIA_ESTILO[materia];

  if (configuracao) {
    return configuracao;
  }

  const slug = materia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

  return {
    sigla: materia.slice(0, 1).toUpperCase(),
    classe: slug || 'outra'
  };
}
