import '../../styles/aluno/Conteudos.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { API_URL, obterToken } from '../../services/api.js';

const imagensMaterias = import.meta.glob(
  '../../assets/conteudos/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, query: '?url', import: 'default' }
);

const ALIAS_IMAGEM_MATERIA = {
  portugues: 'iconeportugues',
  'lingua-portuguesa': 'iconeportugues',
  matematica: 'iconematematica',
  historia: 'iconehistoria',
  geografia: 'iconegeografia',
  ciencias: 'iconeciencias',
  'ciencias-da-natureza': 'iconeciencias',
  biologia: 'biologia',
  quimica: 'quimica',
  fisica: 'fisica',
  'raciocinio-e-interpretacao': 'raciocinio-e-interpretacao',
};

function slugMateria(nome = '') {
  return String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getMateriaCor(materia = '') {
  const slug = slugMateria(materia);

  const cores = {
    portugues: { color: '#5DADE2', bg: '#EAF5FF' },
    'lingua-portuguesa': { color: '#5DADE2', bg: '#EAF5FF' },
    matematica: { color: '#D95C5C', bg: '#FFF0EF' },
    historia: { color: '#A97745', bg: '#F7F0E8' },
    geografia: { color: '#62A85E', bg: '#EFF8EE' },
    ciencias: { color: '#8D68C9', bg: '#F3EEFB' },
    'ciencias-da-natureza': { color: '#8D68C9', bg: '#F3EEFB' },
    biologia: { color: '#62A85E', bg: '#EFF8EE' },
    quimica: { color: '#8D68C9', bg: '#F3EEFB' },
    fisica: { color: '#8D68C9', bg: '#F3EEFB' },
  };

  return cores[slug] || { color: '#5DADE2', bg: '#EAF5FF' };
}

function getMateriaImagem(materia) {
  const slug = slugMateria(materia);
  const nomeArquivo = ALIAS_IMAGEM_MATERIA[slug] || slug;

  const encontrada = Object.entries(imagensMaterias).find(([caminho]) => {
    const nome = caminho
      .split('/')
      .pop()
      ?.replace(/\.(png|jpe?g|webp|avif)$/i, '')
      .toLowerCase();

    return nome === nomeArquivo;
  });

  return encontrada?.[1] || null;
}

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

export default function Conteudos() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [materiasData, setMateriasData] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertos, setAbertos] = useState(new Set());
  const [estudados, setEstudados] = useState({});
  const [salvandoTopico, setSalvandoTopico] = useState(null);

  async function carregarProgresso(tokenAtual = obterToken()) {
    if (!tokenAtual) {
      setEstudados({});
      return;
    }

    const resposta = await fetch(
      `${API_URL}/conteudos/progresso`,
      {
        headers: {
          Authorization: `Bearer ${tokenAtual}`
        }
      }
    );

    const dados = await resposta
      .json()
      .catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.erro ||
        dados.mensagem ||
        'Não foi possível carregar seu progresso.'
      );
    }

    const mapa = {};

    (Array.isArray(dados.topicos)
      ? dados.topicos
      : []
    ).forEach((item) => {
      mapa[String(item.topico_id)] =
        Boolean(item.estudado);
    });

    setEstudados(mapa);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarConteudos() {
      try {
        setCarregando(true);
        setErro('');

        const respostaConteudos = await fetch(
          `${API_URL}/conteudos/publico`
        );

        const dadosConteudos =
          await respostaConteudos
            .json()
            .catch(() => ({}));

        if (!respostaConteudos.ok) {
          throw new Error(
            dadosConteudos.erro ||
            dadosConteudos.mensagem ||
            'Não foi possível carregar os conteúdos.'
          );
        }

        const materias =
          Array.isArray(dadosConteudos)
            ? dadosConteudos
            : (dadosConteudos.materias || []);

        if (!ativo) {
          return;
        }

        setMateriasData(materias);

        setAbertos((prev) => {
          const nomesAtuais = new Set(
            materias.map(
              (materia) => materia.nome
            )
          );

          return new Set(
            [...prev].filter(
              (nome) =>
                nomesAtuais.has(nome)
            )
          );
        });

        const token = obterToken();

        await carregarProgresso(token);

      } catch (error) {
        console.error(
          'Erro ao carregar conteúdos:',
          error
        );

        if (ativo) {
          setErro(
            error.message ||
            'Não foi possível carregar os conteúdos.'
          );
        }

      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarConteudos();

    return () => {
      ativo = false;
    };
  }, [API_URL]);

  const total = materiasData.reduce(
    (sum, materia) =>
      sum +
      (
        Array.isArray(materia.topicos)
          ? materia.topicos.length
          : 0
      ),
    0
  );

  const totalEstudados =
    Object.values(estudados)
      .filter(Boolean)
      .length;

  const progresso =
    total
      ? Math.round(
          (totalEstudados / total) * 100
        )
      : 0;

  const materias =
    filtro === 'Todas'
      ? materiasData.map(
          (materia) => materia.nome
        )
      : [filtro];

  const conteudosFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return materias.reduce(
        (acc, nomeMateria) => {
          const materia =
            materiasData.find(
              (item) =>
                item.nome === nomeMateria
            );

          if (!materia) {
            return acc;
          }

          const topics =
            (materia.topicos || [])
              .filter(
                (topico) =>
                  topico &&
                  topico.nome
              )
              .filter(
                (topico) =>
                  !termo ||
                  topico.nome
                    .toLowerCase()
                    .includes(termo)
              );

          if (topics.length) {
            acc[nomeMateria] = topics;
          }

          return acc;
        },
        {}
      );
    }, [busca, filtro, materiasData]);

  const totalResultados = useMemo(
    () =>
      Object.values(conteudosFiltrados).reduce(
        (sum, topics) => sum + topics.length,
        0
      ),
    [conteudosFiltrados]
  );

  const filtrosAtivos =
    Boolean(busca.trim()) || filtro !== 'Todas';

  function limparFiltros() {
    setBusca('');
    setFiltro('Todas');
  }

  function toggleMateria(materia) {
    setAbertos((prev) => {
      const next = new Set(prev);

      if (next.has(materia)) {
        next.delete(materia);
      } else {
        next.add(materia);
      }

      return next;
    });
  }

  useEffect(() => {
    const nomesComResultado = Object.keys(conteudosFiltrados);

    if (busca.trim()) {
      setAbertos(new Set(nomesComResultado));
      return;
    }

    if (filtro !== 'Todas' && nomesComResultado.includes(filtro)) {
      setAbertos((prev) => new Set(prev).add(filtro));
    }
  }, [busca, filtro, conteudosFiltrados]);

  function limparBusca() {
    setBusca('');
  }

  async function toggleEstudado(topico) {
    if (!topico?.id) {
      return;
    }

    const token = obterToken();

    if (!token) {
      setErro(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    const topicoId =
      Number(topico.id);

    const novoStatus =
      !Boolean(
        estudados[String(topicoId)]
      );

    setSalvandoTopico(topicoId);
    setErro('');

    try {
      const resposta =
        await fetch(
          `${API_URL}/conteudos/progresso/${topicoId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              estudado: novoStatus
            })
          }
        );

      const dados =
        await resposta
          .json()
          .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          dados.mensagem ||
          'Não foi possível salvar o progresso.'
        );
      }

      await carregarProgresso(token);

    } catch (error) {
      console.error(
        'Erro ao salvar progresso:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível salvar o progresso.'
      );

    } finally {
      setSalvandoTopico(null);
    }
  }

  async function marcarTodosComoNaoEstudados() {
    const token = obterToken();

    if (!token) {
      setErro(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    const confirmar =
      window.confirm(
        'Deseja realmente limpar todo o seu progresso dos conteúdos?'
      );

    if (!confirmar) {
      return;
    }

    setErro('');

    try {
      const resposta =
        await fetch(
          `${API_URL}/conteudos/progresso`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const dados =
        await resposta
          .json()
          .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          dados.mensagem ||
          'Não foi possível limpar o progresso.'
        );
      }

      setEstudados({});

    } catch (error) {
      console.error(
        'Erro ao limpar progresso:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível limpar o progresso.'
      );
    }
  }

  return (
    <div className="conteudos-page page-shell">

      <section className="tenna-auto-intro">

        <div className="tenna-auto-intro-copy">

          <span className="tenna-auto-kicker">
            BASE DE CONTEÚDOS
          </span>

          <h2>
            Tudo que cai no{' '}
            <span>Vestibulinho</span>
          </h2>

          <p>
            Consulte o que estudar em cada
            matéria e marque o que você já revisou.
          </p>

        </div>

        <div className="tenna-auto-intro-badge">

          <Icon
            name="book"
            size={26}
            color="#fff"
          />

          <small>
            Conteúdos
          </small>

        </div>

      </section>

      <section className="content-progress-card">

        <div className="content-progress-main">

          <div
            className="content-progress-icon"
            style={{
              color:
                'var(--accent-dark)'
            }}
          >
            <Icon
              name="book"
              size={24}
            />
          </div>

          <div>

            <span className="content-eyebrow">
              Seu progresso
            </span>

            <h2>
              {totalEstudados} de {total}{' '}
              conteúdos estudados
            </h2>

            <p>
              Use esta lista como um guia
              para saber o que procurar e estudar.
            </p>

          </div>

        </div>

        <div className="content-progress-value">
          {progresso}%
        </div>

        <div className="content-progress-track">

          <div
            style={{
              width:
                `${progresso}%`
            }}
          />

        </div>

      </section>

      <div className="content-toolbar">

        <div className="content-search-wrap">

          <span className="content-search-icon" aria-hidden="true"><Icon name="search" size={18} /></span>

          <input
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            placeholder="Buscar conteúdo..."
            aria-label="Buscar conteúdo"
          />

          {busca && (
            <button
              type="button"
              className="content-search-clear"
              onClick={limparBusca}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              ×
            </button>
          )}

        </div>

        <select
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
        >

          <option>
            Todas
          </option>

          {materiasData.map(
            (materia) => (
              <option
                key={
                  materia.id ||
                  materia.nome
                }
                value={materia.nome}
              >
                {materia.nome}
              </option>
            )
          )}

        </select>

        <button
          className="content-reset-btn ui-btn ui-btn--ghost"
          onClick={
            marcarTodosComoNaoEstudados
          }
        >
          Limpar progresso
        </button>

      </div>

      {filtrosAtivos && (
        <div className="content-filter-summary" aria-live="polite">
          <div className="content-filter-result-count">
            <strong>{totalResultados}</strong>
            {totalResultados === 1
              ? ' conteúdo encontrado'
              : ' conteúdos encontrados'}
          </div>

          <div className="content-filter-chips">
            {busca.trim() && (
              <span className="content-filter-chip">
                Busca: <strong>"{busca.trim()}"</strong>
              </span>
            )}

            {filtro !== 'Todas' && (
              <span className="content-filter-chip">
                Matéria: <strong>{filtro}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            className="content-clear-filters"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {erro && (

        <div className="content-empty">

          <strong>
            Ocorreu um erro.
          </strong>

          <span>
            {erro}
          </span>

        </div>

      )}

      {!erro && carregando && (

        <div className="content-empty">

          <strong>
            Carregando conteúdos...
          </strong>

          <span>
            Buscando a lista atualizada no sistema.
          </span>

        </div>

      )}

      {!erro &&
        !carregando && (
          Object.keys(conteudosFiltrados).length === 0 ? (
            <div className="content-search-empty">
              <div className="content-search-empty-icon" aria-hidden="true"><Icon name="search" size={26} /></div>
              <strong>Nenhum conteúdo encontrado</strong>
              <span>
                Não encontramos nenhum tópico para <b>"{busca || filtro}"</b>.
              </span>
              {(busca || filtro !== 'Todas') && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="ui-btn ui-btn--secondary"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
          <div className="content-subject-list">

            {Object.entries(
              conteudosFiltrados
            ).map(
              ([materia, topics]) => {

                const studiedCount =
                  topics.filter(
                    (topic) =>
                      Boolean(
                        estudados[
                          String(topic.id)
                        ]
                      )
                  ).length;

                const aberto =
                  abertos.has(materia);

                const style = getMateriaCor(materia);

                const materiaProgresso =
                  topics.length
                    ? Math.round(
                        (
                          studiedCount /
                          topics.length
                        ) * 100
                      )
                    : 0;

                return (
                  <section
                    className="content-subject-card"
                    key={materia}
                    style={{
                      borderLeftColor:
                        style.color,
                      '--subject-color':
                        style.color,
                      '--subject-bg':
                        style.bg
                    }}
                  >

                    <button
                      type="button"
                      className="content-subject-header"
                      onClick={() =>
                        toggleMateria(
                          materia
                        )
                      }
                      aria-expanded={aberto}
                      aria-controls={`conteudos-${String(materia).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
                    >

                      <div className="content-subject-title">

                        <span
                          className="content-subject-icon"
                          style={{
                            background:
                              style.bg,
                            color:
                              style.color
                          }}
                        >

                          {getMateriaImagem(materia) ? (
                            <img
                              src={getMateriaImagem(materia)}
                              alt=""
                              className="content-subject-image"
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className="content-subject-image-fallback"
                              aria-hidden="true"
                            >
                              {String(materia).charAt(0).toUpperCase()}
                            </span>
                          )}

                        </span>

                        <div>

                          <h2>
                            {materia}
                          </h2>

                          <span>
                            {topics.length}{' '}
                            conteúdos •{' '}
                            {studiedCount}{' '}
                            estudados
                          </span>

                        </div>

                      </div>

                      <div className="content-subject-progress">

                        <span
                          style={{
                            color:
                              style.color
                          }}
                        >
                          {materiaProgresso}%
                        </span>

                        <span
                          className={
                            `content-chevron ${
                              aberto
                                ? 'open'
                                : ''
                            }`
                          }
                        >
                          ›
                        </span>

                      </div>

                    </button>

                    <div className="content-subject-track">
                      <div
                        style={{
                          width: `${materiaProgresso}%`,
                          background: style.color
                        }}
                      />
                    </div>

                    {aberto && (

                      <div
                        id={`conteudos-${String(materia).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
                        className="content-topic-list"
                      >

                        {topics.map(
                          (topic, index) => {

                            const done =
                              Boolean(
                                estudados[
                                  String(
                                    topic.id
                                  )
                                ]
                              );

                            const salvando =
                              salvandoTopico ===
                              Number(
                                topic.id
                              );

                            return (
                              <div
                                className={
                                  `content-topic ${
                                    done
                                      ? 'studied'
                                      : ''
                                  }`
                                }
                                key={
                                  topic.id
                                }
                                style={{
                                  '--topic-color': style.color,
                                  '--topic-bg': style.bg,
                                  borderColor: done
                                    ? style.color
                                    : undefined
                                }}
                              >

                                <button
                                  type="button"
                                  className="content-topic-check"
                                  onClick={(evento) => {
                                    evento.stopPropagation();
                                    toggleEstudado(
                                      topic
                                    );
                                  }}
                                  disabled={
                                    salvando
                                  }
                                  aria-label={
                                    done
                                      ? 'Marcar tópico como não estudado'
                                      : 'Marcar tópico como estudado'
                                  }
                                  style={{
                                    background: done
                                      ? style.color
                                      : style.bg,
                                    borderColor: done
                                      ? style.color
                                      : style.color,
                                    color: done
                                      ? '#fff'
                                      : style.color
                                  }}
                                >
                                  {done
                                    ? '✓'
                                    : ''}
                                </button>

                                <button
                                  type="button"
                                  className="content-topic-open"
                                  onClick={() =>
                                    navigate(
                                      `/conteudos/${topic.id}`
                                    )
                                  }
                                >
                                  <span className="content-topic-meta">
                                    <span
                                      className="content-topic-number"
                                      style={{
                                        background: style.bg,
                                        color: style.color
                                      }}
                                    >
                                      {String(
                                        index + 1
                                      ).padStart(
                                        2,
                                        '0'
                                      )}
                                    </span>

                                    <span
                                      className="content-topic-materia"
                                      style={{
                                        color: style.color,
                                        background: style.bg
                                      }}
                                    >
                                      {materia}
                                    </span>
                                  </span>

                                  <span className="content-topic-name">
                                    {topic.nome}
                                  </span>

                                  <span className="content-topic-footer">
                                    <span
                                      className="content-topic-status"
                                      style={{
                                        color: style.color,
                                        borderColor: `${style.color}2E`,
                                        background: done
                                          ? style.bg
                                          : '#F7FBFF'
                                      }}
                                    >
                                      {salvando
                                        ? 'Salvando...'
                                        : done
                                          ? 'Estudado'
                                          : 'Não iniciado'}
                                    </span>

                                    <span
                                      className="content-topic-action"
                                      style={{
                                        color: style.color
                                      }}
                                    >
                                      Ver conteúdo
                                      <span className="content-topic-arrow">
                                        ›
                                      </span>
                                    </span>
                                  </span>
                                </button>

                              </div>
                            );
                          }
                        )}

                      </div>

                    )}

                  </section>
                );
              }
            )}

          </div>
          ))}

    </div>
  );
}