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

  function toggle(id) {
    // IMPORTANTE: não fazemos efeitos colaterais (como addXP)
    // dentro do callback de setState. Em modo StrictMode o React
    // pode executar esse callback mais de uma vez em desenvolvimento.
    if (flipped.has(id)) {
      setFlipped((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    setFlipped((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    addXP(5, 'flashcard revisado');
  }

  function contarPorMateria(materia) {
    return CARDS.filter((c) => c.subject === materia).length;
  }

  function renderGrid(cards) {
    return (
      <div className="flashcard-grid">
        {cards.map((c) => (
          <div className={`flashcard ${flipped.has(c.id) ? 'flipped' : ''}`} key={c.id} onClick={() => toggle(c.id)}>
            <div className="flashcard-inner">
              <div className="flashcard-face front">{c.front}</div>
              <div className="flashcard-face back">{c.back}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Flash Cards</h1>
          <p>Revise os conteúdos de forma rápida com os Cards</p>
        </div>
      </div>

      <div className="materia-tabs">
        <button
          className={`materia-tab ${filtro === 'Todas' ? 'active' : ''}`}
          onClick={() => setFiltro('Todas')}
        >
          Todas <span className="materia-tab-count">{CARDS.length}</span>
        </button>
        {MATERIAS.map((m) => (
          <button
            key={m}
            className={`materia-tab ${filtro === m ? 'active' : ''}`}
            onClick={() => setFiltro(m)}
          >
            {m} <span className="materia-tab-count">{contarPorMateria(m)}</span>
          </button>
        ))}
      </div>

      {filtro === 'Todas' ? (
        MATERIAS.map((m) => {
          const cards = CARDS.filter((c) => c.subject === m);
          if (cards.length === 0) return null;
          return (
            <div className="materia-section" key={m}>
              <h2 className="materia-section-title">{m}</h2>
              {renderGrid(cards)}
            </div>
          );
        })
      ) : (
        <div className="materia-section">
          {renderGrid(CARDS.filter((c) => c.subject === filtro))}
        </div>
      )}
    </div>
  );
}