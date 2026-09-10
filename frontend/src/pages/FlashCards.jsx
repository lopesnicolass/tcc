import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MATERIAS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
];

export default function FlashCards() {
  const { addXP } = useGamification();

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [filtro, setFiltro] = useState('Todas');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarFlashcards();
  }, []);

  async function carregarFlashcards() {
    try {
      setCarregando(true);
      setErro('');

      const token =
        localStorage.getItem('etecamp_token');

      const resposta = await fetch(
        `${API_URL}/flashcards`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Erro ao carregar flashcards.'
        );
      }

      const flashcards = Array.isArray(dados)
        ? dados
        : dados.flashcards || [];

      const cardsFormatados = flashcards
        .filter((card) => card.ativo === 1 || card.ativo === true)
        .map((card) => ({
          id: card.id,
          subject: card.materia,
          front: card.primario,
          back: card.secundario,
        }));

      setCards(cardsFormatados);
    } catch (erro) {
      console.error(
        'Erro ao carregar flashcards:',
        erro
      );

      setErro(
        'Não foi possível carregar os flashcards.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function toggle(id) {
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
    return cards.filter(
      (card) => card.subject === materia
    ).length;
  }

  function renderGrid(cardsParaExibir) {
    if (cardsParaExibir.length === 0) {
      return (
        <p className="flashcards-vazio">
          Nenhum flashcard encontrado.
        </p>
      );
    }

    return (
      <div className="flashcard-grid">
        {cardsParaExibir.map((card) => (
          <div
            className={`flashcard ${
              flipped.has(card.id) ? 'flipped' : ''
            }`}
            key={card.id}
            onClick={() => toggle(card.id)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-face front">
                {card.front}
              </div>

              <div className="flashcard-face back">
                {card.back}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (carregando) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Flash Cards</h1>
            <p>
              Revise os conteúdos de forma rápida com os Cards
            </p>
          </div>
        </div>

        <p>Carregando flashcards...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Flash Cards</h1>
            <p>
              Revise os conteúdos de forma rápida com os Cards
            </p>
          </div>
        </div>

        <p>{erro}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Flash Cards</h1>

          <p>
            Revise os conteúdos de forma rápida com os Cards
          </p>
        </div>
      </div>

      <div className="materia-tabs">
        <button
          className={`materia-tab ${
            filtro === 'Todas' ? 'active' : ''
          }`}
          onClick={() => setFiltro('Todas')}
        >
          Todas{' '}
          <span className="materia-tab-count">
            {cards.length}
          </span>
        </button>

        {MATERIAS.map((materia) => (
          <button
            key={materia}
            className={`materia-tab ${
              filtro === materia ? 'active' : ''
            }`}
            onClick={() => setFiltro(materia)}
          >
            {materia}{' '}
            <span className="materia-tab-count">
              {contarPorMateria(materia)}
            </span>
          </button>
        ))}
      </div>

      {filtro === 'Todas' ? (
        MATERIAS.map((materia) => {
          const cardsDaMateria = cards.filter(
            (card) => card.subject === materia
          );

          if (cardsDaMateria.length === 0) {
            return null;
          }

          return (
            <div
              className="materia-section"
              key={materia}
            >
              <h2 className="materia-section-title">
                {materia}
              </h2>

              {renderGrid(cardsDaMateria)}
            </div>
          );
        })
      ) : (
        <div className="materia-section">
          {renderGrid(
            cards.filter(
              (card) => card.subject === filtro
            )
          )}
        </div>
      )}
    </div>
  );
}