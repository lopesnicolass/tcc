import '../styles/dashboard.css';
import { useMemo, useState } from 'react';

export const TOPICS_BANK = {
  'Língua Portuguesa': [
    'Interpretação e compreensão de textos',
    'Tema, ideia principal e informações implícitas',
    'Gêneros textuais',
    'Tipos textuais',
    'Linguagem verbal e não verbal',
    'Argumentação e ponto de vista',
    'Ironia, humor e efeitos de sentido',
    'Coesão e coerência',
    'Ortografia',
    'Acentuação gráfica',
    'Pontuação',
    'Classes gramaticais',
    'Substantivo, adjetivo e artigo',
    'Pronomes',
    'Verbos e tempos verbais',
    'Advérbios, preposições e conjunções',
    'Concordância verbal e nominal',
    'Regência verbal e nominal',
    'Crase',
    'Formação de palavras',
    'Sinônimos, antônimos e sentido das palavras',
    'Variação linguística',
    'Charges, tirinhas e textos publicitários',
    'Notícias, reportagens, crônicas e poemas',
  ],
  Matemática: [
    'Números naturais, inteiros e racionais',
    'Números decimais e operações',
    'Frações',
    'Potenciação e radiciação',
    'Expressões numéricas',
    'Razão e proporção',
    'Regra de três simples e composta',
    'Porcentagem',
    'Aumentos, descontos e variação percentual',
    'Juros simples',
    'Expressões algébricas',
    'Produtos notáveis e fatoração',
    'Equações do 1º grau',
    'Equações do 2º grau',
    'Sistemas de equações',
    'Inequações',
    'Sequências e padrões',
    'Função do 1º grau e gráficos',
    'Função do 2º grau e gráficos',
    'Ângulos e polígonos',
    'Triângulos e quadriláteros',
    'Perímetro e área',
    'Circunferência e círculo',
    'Teorema de Pitágoras',
    'Semelhança e escalas',
    'Volume de sólidos',
    'Tabelas e gráficos',
    'Média, moda e mediana',
    'Probabilidade',
  ],
  História: [
    'Antiguidade: Egito, Mesopotâmia, Grécia e Roma',
    'Feudalismo e sociedade medieval',
    'Igreja e cultura na Idade Média',
    'Renascimento',
    'Reformas religiosas',
    'Absolutismo e mercantilismo',
    'Grandes Navegações',
    'Colonização portuguesa na América',
    'Brasil Colônia e economia açucareira',
    'Escravidão e resistências',
    'Mineração no Brasil',
    'Independência do Brasil',
    'Primeiro Reinado e Período Regencial',
    'Segundo Reinado',
    'Abolição da escravidão',
    'Proclamação da República',
    'República Velha',
    'Era Vargas',
    'Revolução Industrial',
    'Imperialismo',
    'Primeira Guerra Mundial',
    'Revolução Russa',
    'Segunda Guerra Mundial',
    'Guerra Fria',
    'Ditadura Militar no Brasil',
    'Redemocratização e Constituição de 1988',
    'Globalização e mundo contemporâneo',
  ],
  Geografia: [
    'Cartografia e leitura de mapas',
    'Escala cartográfica',
    'Coordenadas geográficas',
    'Latitude, longitude e fusos horários',
    'Paisagem, lugar, território e região',
    'Relevo brasileiro',
    'Climas do Brasil',
    'Biomas brasileiros',
    'Recursos naturais',
    'População e densidade demográfica',
    'Migrações',
    'Urbanização',
    'Industrialização brasileira',
    'Agricultura e pecuária',
    'Fontes de energia',
    'Globalização e economia',
    'Blocos econômicos',
    'Geopolítica mundial',
    'Meio ambiente e sustentabilidade',
    'Desmatamento e poluição',
    'Água e saneamento básico',
    'Mudanças climáticas',
  ],
  Biologia: [
    'Célula e organização dos seres vivos',
    'Sistemas do corpo humano',
    'Alimentação e nutrientes',
    'Saúde, higiene e vacinação',
    'Vírus, bactérias, fungos e parasitas',
    'Reprodução e hereditariedade',
    'Genética básica',
    'Evolução e diversidade dos seres vivos',
    'Ecossistemas',
    'Cadeias e teias alimentares',
    'Relações ecológicas',
    'Ciclos da natureza',
    'Biodiversidade e conservação',
    'Sustentabilidade e recursos naturais',
  ],
  Química: [
    'Matéria e propriedades da matéria',
    'Estados físicos e mudanças de estado',
    'Substâncias e misturas',
    'Métodos de separação de misturas',
    'Átomos e elementos químicos',
    'Tabela periódica',
    'Transformações físicas e químicas',
    'Reações químicas',
    'Água e tratamento da água',
    'Combustíveis e fontes de energia',
    'Química no cotidiano',
    'Poluição e reciclagem',
  ],
  Física: [
    'Movimento, distância e tempo',
    'Velocidade e aceleração',
    'Gráficos de movimento',
    'Forças, massa, peso e gravidade',
    'Leis de Newton',
    'Equilíbrio',
    'Energia e suas formas',
    'Trabalho e energia mecânica',
    'Conservação da energia',
    'Eletricidade e circuitos',
    'Corrente, tensão e resistência',
    'Calor e temperatura',
    'Transferência de calor',
    'Ondas e som',
    'Luz, reflexão e refração',
  ],
  'Raciocínio e interpretação': [
    'Sequências numéricas',
    'Padrões e regularidades',
    'Problemas lógicos',
    'Análise de informações',
    'Interpretação de tabelas',
    'Interpretação de gráficos',
    'Relação de causa e consequência',
    'Análise de argumentos',
    'Resolução de problemas do cotidiano',
    'Avaliação de soluções',
  ],
};

const SUBJECT_ICONS = {
  'Língua Portuguesa': '📝',
  Matemática: '➗',
  História: '🏛️',
  Geografia: '🌎',
  Biologia: '🧬',
  Química: '⚗️',
  Física: '⚡',
  'Raciocínio e interpretação': '🧠',
};

const STORAGE_KEY = 'conteudosEstudados';

function getUserKey() {
  try {
    const raw = localStorage.getItem('etecamp_usuario');
    if (!raw) return 'anonimo';
    const user = JSON.parse(raw);
    return String(user.id || user.usuarioId || 'anonimo');
  } catch {
    return 'anonimo';
  }
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${getUserKey()}`) || '{}');
  } catch {
    return {};
  }
}

export default function Conteudos() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [abertos, setAbertos] = useState(() => new Set(Object.keys(TOPICS_BANK)));
  const [estudados, setEstudados] = useState(loadProgress);

  const total = Object.values(TOPICS_BANK).reduce((sum, topics) => sum + topics.length, 0);
  const totalEstudados = Object.values(estudados).filter(Boolean).length;
  const progresso = total ? Math.round((totalEstudados / total) * 100) : 0;

  const materias = filtro === 'Todas' ? Object.keys(TOPICS_BANK) : [filtro];
  const conteudosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return materias.reduce((acc, materia) => {
      const topics = TOPICS_BANK[materia].filter((topic) => !termo || topic.toLowerCase().includes(termo));
      if (topics.length) acc[materia] = topics;
      return acc;
    }, {});
  }, [busca, filtro, materias]);

  function toggleMateria(materia) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(materia)) next.delete(materia);
      else next.add(materia);
      return next;
    });
  }

  function toggleEstudado(materia, topic) {
    const key = `${materia}::${topic}`;
    setEstudados((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify(next));
      return next;
    });
  }

  function marcarTodosComoNaoEstudados() {
    setEstudados({});
    localStorage.removeItem(`${STORAGE_KEY}_${getUserKey()}`);
  }

  return (
    <div className="conteudos-page">
      <div className="page-header">
        <div>
          <h1>Conteúdos do Vestibulinho</h1>
          <p>Consulte o que estudar e acompanhe o que você já revisou.</p>
        </div>
      </div>

      <section className="content-progress-card">
        <div className="content-progress-main">
          <div className="content-progress-icon">📚</div>
          <div>
            <span className="content-eyebrow">Seu progresso</span>
            <h2>{totalEstudados} de {total} conteúdos estudados</h2>
            <p>Use esta lista como um guia para saber o que procurar e estudar.</p>
          </div>
        </div>
        <div className="content-progress-value">{progresso}%</div>
        <div className="content-progress-track"><div style={{ width: `${progresso}%` }} /></div>
      </section>

      <div className="content-toolbar">
        <div className="content-search-wrap">
          <span>⌕</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conteúdo..."
            aria-label="Buscar conteúdo"
          />
        </div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option>Todas</option>
          {Object.keys(TOPICS_BANK).map((materia) => <option key={materia}>{materia}</option>)}
        </select>
        <button className="content-reset-btn" onClick={marcarTodosComoNaoEstudados}>Limpar progresso</button>
      </div>

      <div className="content-subject-list">
        {Object.entries(conteudosFiltrados).map(([materia, topics]) => {
          const studiedCount = topics.filter((topic) => estudados[`${materia}::${topic}`]).length;
          const aberto = abertos.has(materia);
          return (
            <section className="content-subject-card" key={materia}>
              <button className="content-subject-header" onClick={() => toggleMateria(materia)}>
                <div className="content-subject-title">
                  <span className="content-subject-icon">{SUBJECT_ICONS[materia]}</span>
                  <div>
                    <h2>{materia}</h2>
                    <span>{topics.length} conteúdos • {studiedCount} estudados</span>
                  </div>
                </div>
                <span className={`content-chevron ${aberto ? 'open' : ''}`}>›</span>
              </button>

              {aberto && (
                <div className="content-topic-list">
                  {topics.map((topic, index) => {
                    const key = `${materia}::${topic}`;
                    const done = Boolean(estudados[key]);
                    return (
                      <button
                        className={`content-topic ${done ? 'studied' : ''}`}
                        key={topic}
                        onClick={() => toggleEstudado(materia, topic)}
                      >
                        <span className="content-topic-check">{done ? '✓' : ''}</span>
                        <span className="content-topic-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="content-topic-name">{topic}</span>
                        <span className="content-topic-status">{done ? 'Estudado' : 'Marcar'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {Object.keys(conteudosFiltrados).length === 0 && (
          <div className="content-empty">
            <strong>Nenhum conteúdo encontrado.</strong>
            <span>Tente outra palavra ou selecione outra matéria.</span>
          </div>
        )}
      </div>
    </div>
  );
}
