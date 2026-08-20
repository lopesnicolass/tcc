import { useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const CARDS = [
  { id: 1, subject: 'Matemática', front: 'Qual a fórmula de Bhaskara?', back: 'x = (-b ± √Δ) / 2a' },
  { id: 2, subject: 'Português', front: 'O que é um adjetivo?', back: 'Palavra que caracteriza o substantivo.' },
  { id: 3, subject: 'História', front: 'Quem chegou ao Brasil em 1500?', back: 'Pedro Álvares Cabral.' },
  { id: 4, subject: 'Português', front: 'O que é um advérbio?', back: 'Palavra que modifica verbo, adjetivo ou outro advérbio.' },
  { id: 5, subject: 'História', front: 'Em que ano começou a 2ª Guerra Mundial?', back: '1939.' },
  { id: 6, subject: 'Ciências', front: 'O que é urbanização?', back: 'Processo de crescimento e expansão das cidades.' },
  { id: 7, subject: 'Matemática', front: 'Quantas faces tem um cubo?', back: '6 faces.' },
  { id: 8, subject: 'Português', front: 'O que é um substantivo?', back: 'Palavra que nomeia seres, objetos, lugares ou sentimentos.' },
];

const MATERIAS = ['Matemática', 'Português', 'Ciências', 'História'];

export default function FlashCards() {
const { addXP } = useGamification();

  const [flipped, setFlipped] = useState(new Set());
  const [filtro, setFiltro] = useState('Todas');

  const visiveis = filtro === 'Todas' ? CARDS : CARDS.filter((c) => c.subject === filtro);

  function toggle(id) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        addXP(5, 'flashcard revisado');
      }
      return next;
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Flash Cards</h1>
          <p>Revise os conteúdos de forma rápida com os Cards</p>
        </div>
        <div className="page-actions">
          <select className="mural-filter-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="Todas">Filtrar por matéria</option>
            {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flashcard-grid">
        {visiveis.map((c) => (
          <div className={`flashcard ${flipped.has(c.id) ? 'flipped' : ''}`} key={c.id} onClick={() => toggle(c.id)}>
            <div className="flashcard-inner">
              <div className="flashcard-face front">{c.front}</div>
              <div className="flashcard-face back">{c.back}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}