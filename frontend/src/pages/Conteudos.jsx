import '../styles/dashboard.css';
import { useEffect, useMemo, useState } from 'react';
import { getSubjectStyle } from '../utils/subjects.js';
import SubjectIcon from '../components/cu.jsx';
import Icon from '../components/Icon.jsx';

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
  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000';

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [materiasData, setMateriasData] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertos, setAbertos] = useState(new Set());
  const [estudados, setEstudados] = useState({});
  const [salvandoTopico, setSalvandoTopico] = useState(null);

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

        const token =
          localStorage.getItem(
            'etecamp_token'
          );

        if (!token) {
          setEstudados({});
          return;
        }

        const respostaProgresso =
          await fetch(
            `${API_URL}/conteudos/progresso`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const dadosProgresso =
          await respostaProgresso
            .json()
            .catch(() => ({}));

        if (
          respostaProgresso.ok &&
          Array.isArray(
            dadosProgresso.topicos
          )
        ) {
          const mapa = {};

          dadosProgresso.topicos.forEach(
            (item) => {
              mapa[String(item.topico_id)] =
                Boolean(item.estudado);
            }
          );

          if (ativo) {
            setEstudados(mapa);
          }
        } else {
          setEstudados({});
        }

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

  async function toggleEstudado(topico) {
    if (!topico?.id) {
      return;
    }

    const token =
      localStorage.getItem(
        'etecamp_token'
      );

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

      setEstudados((prev) => ({
        ...prev,
        [String(topicoId)]:
          novoStatus
      }));

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
    const token =
      localStorage.getItem(
        'etecamp_token'
      );

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
    <div className="conteudos-page">

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

          <span>⌕</span>

          <input
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            placeholder="Buscar conteúdo..."
            aria-label="Buscar conteúdo"
          />

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
          className="content-reset-btn"
          onClick={
            marcarTodosComoNaoEstudados
          }
        >
          Limpar progresso
        </button>

      </div>

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

                const style =
                  getSubjectStyle(
                    materia
                  );

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
                        style.color
                    }}
                  >

                    <button
                      className="content-subject-header"
                      onClick={() =>
                        toggleMateria(
                          materia
                        )
                      }
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

                          <SubjectIcon
                            materia={
                              materia
                            }
                            size={20}
                          />

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

                    {aberto && (

                      <div className="content-topic-list">

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
                              <button
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
                                onClick={() =>
                                  toggleEstudado(
                                    topic
                                  )
                                }
                                disabled={
                                  salvando
                                }
                                style={
                                  done
                                    ? {
                                        borderColor:
                                          style.color,
                                        background:
                                          style.bg
                                      }
                                    : undefined
                                }
                              >

                                <span
                                  className="content-topic-check"
                                  style={
                                    done
                                      ? {
                                          background:
                                            style.color,
                                          borderColor:
                                            style.color
                                        }
                                      : undefined
                                  }
                                >
                                  {done
                                    ? '✓'
                                    : ''}
                                </span>

                                <span className="content-topic-number">
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    '0'
                                  )}
                                </span>

                                <span className="content-topic-name">
                                  {topic.nome}
                                </span>

                                <span
                                  className="content-topic-status"
                                  style={
                                    done
                                      ? {
                                          color:
                                            style.color
                                        }
                                      : undefined
                                  }
                                >
                                  {salvando
                                    ? 'Salvando...'
                                    : done
                                      ? 'Estudado'
                                      : 'Marcar'}
                                </span>

                              </button>
                            );
                          }
                        )}

                      </div>

                    )}

                  </section>
                );
              }
            )}

            {Object.keys(
              conteudosFiltrados
            ).length === 0 && (

              <div className="content-empty">

                <strong>
                  Nenhum conteúdo encontrado.
                </strong>

                <span>
                  Tente outra palavra ou selecione outra matéria.
                </span>

              </div>

            )}

          </div>
        )}

    </div>
  );
}