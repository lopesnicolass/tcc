import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext.jsx';

const API_URL = 'http://localhost:3000';

const STATUS_LABEL = {
  'nao-iniciado': 'Não iniciado',
  'em-progresso': 'Em progresso',
  'concluido': 'Concluído'
};

const BTN_LABEL = {
  'nao-iniciado': 'Iniciar',
  'em-progresso': 'Continuar',
  'concluido': 'Refazer'
};

export default function Simulados() {

  const { addXP } = useGamification();

  const [simulados, setSimulados] = useState([]);
  const [filtro, setFiltro] = useState('Todas');

  const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});

  const [carregando, setCarregando] = useState(true);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);

  const [erro, setErro] = useState('');

  // ==========================================
  // CARREGAR SIMULADOS DO BACKEND
  // ==========================================

  useEffect(() => {
    carregarSimulados();
  }, []);

  async function carregarSimulados() {

    try {

      setCarregando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/simulados`);

      if (!resposta.ok) {
        throw new Error('Erro ao buscar simulados.');
      }

      const dados = await resposta.json();

      const lista = dados.simulados || [];

      /*
       * Recupera o status salvo no navegador.
       * Assim, se o aluno iniciou um simulado,
       * ele continua aparecendo como "Em progresso".
       */
      const statusSalvos =
        JSON.parse(localStorage.getItem('statusSimulados') || '{}');

      const simuladosComStatus = lista.map((simulado) => ({
        ...simulado,
        status:
          statusSalvos[simulado.id] ||
          'nao-iniciado'
      }));

      setSimulados(simuladosComStatus);

    } catch (error) {

      console.error(error);

      setErro(
        'Não foi possível carregar os simulados. Verifique se o backend está rodando.'
      );

    } finally {

      setCarregando(false);

    }
  }


  // ==========================================
  // SALVAR STATUS
  // ==========================================

  function salvarStatus(id, status) {

    const statusSalvos =
      JSON.parse(localStorage.getItem('statusSimulados') || '{}');

    statusSalvos[id] = status;

    localStorage.setItem(
      'statusSimulados',
      JSON.stringify(statusSalvos)
    );

  }


  // ==========================================
  // ABRIR SIMULADO
  // ==========================================

  async function abrirSimulado(simulado) {

    try {

      setCarregandoQuestoes(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/simulados/${simulado.id}`
      );

      if (!resposta.ok) {
        throw new Error('Erro ao buscar o simulado.');
      }

      const dados = await resposta.json();

      const listaQuestoes = dados.questoes || [];

      setSimuladoSelecionado(simulado);
      setQuestoes(listaQuestoes);

      /*
       * Recupera respostas anteriores caso o aluno
       * tenha clicado em continuar.
       */
      const respostasSalvas =
        JSON.parse(
          localStorage.getItem(
            `respostasSimulado_${simulado.id}`
          ) || '{}'
        );

      setRespostas(respostasSalvas);

      // Se estava não iniciado, passa para em progresso
      if (simulado.status === 'nao-iniciado') {

        const atualizado = {
          ...simulado,
          status: 'em-progresso'
        };

        setSimulados((prev) =>
          prev.map((item) =>
            item.id === simulado.id
              ? atualizado
              : item
          )
        );

        salvarStatus(simulado.id, 'em-progresso');

        addXP(10, 'simulado iniciado');
      }

      /*
       * Volta para o começo da página.
       */
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    } catch (error) {

      console.error(error);

      setErro(
        'Não foi possível carregar as questões deste simulado.'
      );

    } finally {

      setCarregandoQuestoes(false);

    }
  }


  // ==========================================
  // SELECIONAR ALTERNATIVA
  // ==========================================

  function selecionarResposta(questaoId, alternativa) {

    const novasRespostas = {
      ...respostas,
      [questaoId]: alternativa
    };

    setRespostas(novasRespostas);

    localStorage.setItem(
      `respostasSimulado_${simuladoSelecionado.id}`,
      JSON.stringify(novasRespostas)
    );

  }


  // ==========================================
  // IR PARA PRÓXIMA QUESTÃO
  // ==========================================

  function proximaQuestao(index) {

    const proxima = document.getElementById(
      `questao-${index + 1}`
    );

    if (proxima) {

      proxima.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }

  }


  // ==========================================
  // FINALIZAR SIMULADO
  // ==========================================

  function finalizarSimulado() {

    if (!simuladoSelecionado) {
      return;
    }

    const respondeu = Object.keys(respostas).length;

    const confirmar = window.confirm(
      `Você respondeu ${respondeu} de ${questoes.length} questões.\n\nDeseja finalizar o simulado?`
    );

    if (!confirmar) {
      return;
    }

    /*
     * Por enquanto o resultado é controlado no frontend.
     * Depois podemos conectar isso ao /resultados.
     */

    setSimulados((prev) =>
      prev.map((simulado) =>
        simulado.id === simuladoSelecionado.id
          ? {
              ...simulado,
              status: 'concluido'
            }
          : simulado
      )
    );

    salvarStatus(
      simuladoSelecionado.id,
      'concluido'
    );

    addXP(50, 'simulado concluído');

    alert('Simulado concluído com sucesso!');

    setSimuladoSelecionado(null);
    setQuestoes([]);
    setRespostas({});

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // ==========================================
  // VOLTAR PARA LISTA
  // ==========================================

  function voltarParaSimulados() {

    setSimuladoSelecionado(null);
    setQuestoes([]);
    setRespostas({});

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // ==========================================
  // FILTRO
  // ==========================================

  const materias = [
    'Todas',
    ...Array.from(
      new Set(
        questoes
          .map((questao) => questao.materia)
          .filter(Boolean)
      )
    )
  ];


  /*
   * Os simulados antigos não possuem matéria na tabela.
   *
   * Por isso, quando o backend não enviar "materia",
   * usamos a matéria das questões para organizar.
   */
  const simuladosVisiveis =
    filtro === 'Todas'
      ? simulados
      : simulados.filter(
          (simulado) =>
            simulado.materia === filtro
      );


  const concluidos = simulados.filter(
    (simulado) =>
      simulado.status === 'concluido'
  ).length;


  // ==========================================
  // TELA DO SIMULADO
  // ==========================================

  if (simuladoSelecionado) {

    return (
      <div>

        {/* CABEÇALHO */}

        <div className="page-header">

          <div>

            <button
              className="simulado-btn"
              onClick={voltarParaSimulados}
              style={{
                marginBottom: '15px'
              }}
            >
              ← Voltar para simulados
            </button>

            <h1>
              {simuladoSelecionado.titulo}
            </h1>

            {simuladoSelecionado.descricao && (
              <p>
                {simuladoSelecionado.descricao}
              </p>
            )}

          </div>

        </div>


        {/* INFORMAÇÕES */}

        <div className="stats-row">

          <div className="stat-card">

            <div className="stat-value">
              {questoes.length}
            </div>

            <div className="stat-label">
              Questões
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-value">
              {simuladoSelecionado.tempo_limite}
            </div>

            <div className="stat-label">
              Minutos
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-value">
              {Object.keys(respostas).length}
            </div>

            <div className="stat-label">
              Respondidas
            </div>

          </div>

        </div>


        {/* QUESTÕES */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            marginTop: '30px'
          }}
        >

          {questoes.length === 0 ? (

            <div className="stat-card">

              <h2>
                Este simulado ainda não possui questões.
              </h2>

              <p>
                O administrador precisa adicionar questões
                antes de você poder realizar o simulado.
              </p>

            </div>

          ) : (

            questoes.map((questao, index) => (

              <div
                className="simulado-card"
                id={`questao-${index}`}
                key={questao.id}
                style={{
                  padding: '25px'
                }}
              >

                {/* NÚMERO + MATÉRIA */}

                <div className="simulado-top">

                  <span className="simulado-subject">

                    Questão {index + 1}

                  </span>

                  {questao.materia && (
                    <span className="status-badge concluido">

                      {questao.materia}

                    </span>
                  )}

                </div>


                {/* PERGUNTA */}

                <h2
                  style={{
                    marginTop: '20px',
                    marginBottom: '25px'
                  }}
                >
                  {questao.pergunta}
                </h2>


                {/* ALTERNATIVAS */}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >

                  {[
                    ['A', questao.alternativa_a],
                    ['B', questao.alternativa_b],
                    ['C', questao.alternativa_c],
                    ['D', questao.alternativa_d],
                    ['E', questao.alternativa_e]
                  ].map(
                    ([letra, texto]) => {

                      const selecionada =
                        respostas[questao.id] === letra;

                      return (

                        <button
                          key={letra}
                          type="button"
                          onClick={() =>
                            selecionarResposta(
                              questao.id,
                              letra
                            )
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            width: '100%',
                            textAlign: 'left',
                            padding: '16px 18px',
                            borderRadius: '10px',
                            border: selecionada
                              ? '2px solid #2563eb'
                              : '1px solid #d1d5db',
                            background: selecionada
                              ? '#eff6ff'
                              : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >

                          <strong
                            style={{
                              minWidth: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              background: selecionada
                                ? '#2563eb'
                                : '#e5e7eb',
                              color: selecionada
                                ? '#ffffff'
                                : '#111827'
                            }}
                          >
                            {letra}

                          </strong>

                          <span>
                            {texto}
                          </span>

                        </button>

                      );

                    }
                  )}

                </div>


                {/* BOTÃO PRÓXIMA */}

                {index < questoes.length - 1 && (

                  <button
                    className="simulado-btn"
                    onClick={() =>
                      proximaQuestao(index)
                    }
                    style={{
                      marginTop: '25px'
                    }}
                  >
                    Próxima questão →
                  </button>

                )}

              </div>

            ))

          )}

        </div>


        {/* FINALIZAR */}

        {questoes.length > 0 && (

          <div
            style={{
              marginTop: '35px',
              marginBottom: '50px',
              padding: '25px',
              textAlign: 'center'
            }}
          >

            <button
              className="simulado-btn"
              onClick={finalizarSimulado}
              style={{
                padding: '14px 35px',
                fontSize: '16px'
              }}
            >
              Finalizar simulado
            </button>

          </div>

        )}

      </div>
    );
  }


  // ==========================================
  // TELA DE LISTAGEM
  // ==========================================

  if (carregando) {

    return (
      <div>

        <div className="page-header">
          <h1>Simulados</h1>
        </div>

        <div className="stat-card">

          <h2>
            Carregando simulados...
          </h2>

        </div>

      </div>
    );

  }


  return (

    <div>

      {/* CABEÇALHO */}

      <div className="page-header">

        <h1>
          Simulados
        </h1>

        <div className="page-actions">

          <select
            className="mural-filter-select"
            value={filtro}
            onChange={(e) =>
              setFiltro(e.target.value)
            }
          >

            <option value="Todas">
              Todas as matérias
            </option>

            {materias
              .filter((materia) => materia !== 'Todas')
              .map((materia) => (

                <option
                  key={materia}
                  value={materia}
                >
                  {materia}
                </option>

              ))}

          </select>

        </div>

      </div>


      {/* ERRO */}

      {erro && (

        <div
          className="stat-card"
          style={{
            marginBottom: '20px'
          }}
        >

          <p>
            {erro}
          </p>

        </div>

      )}


      {/* ESTATÍSTICAS */}

      <div className="stats-row">

        <div className="stat-card">

          <div className="stat-value">
            {String(concluidos).padStart(2, '0')}
          </div>

          <div className="stat-label">
            Simulados concluídos
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-value">
            {simulados.length}
          </div>

          <div className="stat-label">
            Simulados disponíveis
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-value">
            {simulados.reduce(
              (total, simulado) =>
                total +
                Number(
                  simulado.quantidade_questoes || 0
                ),
              0
            )}
          </div>

          <div className="stat-label">
            Questões disponíveis
          </div>

        </div>

      </div>


      {/* SIMULADOS */}

      {simuladosVisiveis.length === 0 ? (

        <div
          className="stat-card"
          style={{
            marginTop: '25px'
          }}
        >

          <h2>
            Nenhum simulado encontrado.
          </h2>

          <p>
            Os simulados cadastrados pelo administrador
            aparecerão aqui.
          </p>

        </div>

      ) : (

        <div
          className="simulado-grid"
          style={{
            marginTop: '25px'
          }}
        >

          {simuladosVisiveis.map(
            (simulado) => (

              <div
                className="simulado-card"
                key={simulado.id}
              >

                {/* TOPO */}

                <div className="simulado-top">

                  <span className="simulado-subject">

                    {simulado.materia ||
                      'Simulado'}

                  </span>

                  <span
                    className={`status-badge ${simulado.status}`}
                  >

                    {
                      STATUS_LABEL[
                        simulado.status
                      ]
                    }

                  </span>

                </div>


                {/* TÍTULO */}

                <h2
                  style={{
                    marginTop: '15px',
                    marginBottom: '10px'
                  }}
                >
                  {simulado.titulo}
                </h2>


                {/* DESCRIÇÃO */}

                {simulado.descricao && (

                  <p
                    style={{
                      marginBottom: '20px'
                    }}
                  >
                    {simulado.descricao}
                  </p>

                )}


                {/* INFORMAÇÕES */}

                <div className="simulado-meta">

                  <span>
                    📝 {simulado.quantidade_questoes} questões
                  </span>

                  <span>
                    ⏱ {simulado.tempo_limite} minutos
                  </span>

                </div>


                {/* BOTÃO */}

                <button
                  className="simulado-btn"
                  onClick={() =>
                    abrirSimulado(simulado)
                  }
                  disabled={carregandoQuestoes}
                  style={{
                    marginTop: '20px'
                  }}
                >

                  {carregandoQuestoes
                    ? 'Carregando...'
                    : BTN_LABEL[
                        simulado.status
                      ]}

                </button>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );
}