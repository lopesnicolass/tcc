// Matérias oficiais do Tenna. Manter esta lista sincronizada com o frontend.
const MATERIAS_FIXAS = Object.freeze([
  { nome: 'Português', slug: 'portugues', cor: '#51A9E5', icone: 'book', ordem: 1 },
  { nome: 'Matemática', slug: 'matematica', cor: '#E8565B', icone: 'calculator', ordem: 2 },
  { nome: 'História', slug: 'historia', cor: '#AA7541', icone: 'book', ordem: 3 },
  { nome: 'Geografia', slug: 'geografia', cor: '#55A75B', icone: 'globe', ordem: 4 },
  { nome: 'Ciências', slug: 'ciencias', cor: '#8C5AD0', icone: 'flask', ordem: 5 },
]);
module.exports = { MATERIAS_FIXAS };
