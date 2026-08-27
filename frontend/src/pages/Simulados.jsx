import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [mostrarErros, setMostrarErros] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [salvandoResultado, setSalvandoResultado] = useState(false);

  const [erro, setErro] = useState('');

  // ==========================================
  // PEGAR ID DO USUÁRIO
  // ==========================================

  function obterUsuarioId() {
    const usuarioSalvo = localStorage.getItem('etecamp_usuario');

    if (!usuarioSalvo) {
      console.error('Usuário não encontrado no localStorage.');
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioSalvo);

      console.log('Usuário logado:', usuario);

      if (usuario.id) {
        return Number(usuario.id);
      }

      if (usuario.usuarioId) {
        return Number(usuario.usuarioId);
      }

      console.error('ID do usuário não encontrado:', usuario);

      return null;
    } catch (error) {
      console.error('Erro ao ler etecamp_usuario:', error);
      return null;
    }
  }

  // ==========================================
  // CARREGAR SIMULADOS
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

      const statusSalvos = JSON.parse(
        localStorage.getItem('statusSimulados') || '{}'
      );

      const simuladosComStatus = lista.map((simulado) => ({
        ...simulado,
        status: statusSalvos[simulado.id] || 'nao-iniciado'
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
    const statusSalvos = JSON.parse(
      localStorage.getItem('statusSimulados') || '{}'
    );

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
      setResultadoFinal(null);
      setMostrarErros(false);

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

      if (simulado.status === 'em-progresso') {
        const respostasSalvas = JSON.parse(
          localStorage.getItem(
            `respostasSimulado_${simulado.id}`
          ) || '{}'
        );

        setRespostas(respostasSalvas);
      } else {
        localStorage.removeItem(
          `respostasSimulado_${simulado.id}`
        );

        setRespostas({});
      }

      if (
        simulado.status === 'nao-iniciado' ||
        simulado.status === 'concluido'
      ) {
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

        salvarStatus(
          simulado.id,
          'em-progresso'
        );

        addXP(10, 'simulado iniciado');
      }

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
  // SELECIONAR RESPOSTA
  // ==========================================

  function selecionarResposta(questaoId, alternativa) {
    if (respostas[questaoId]) {
      return;
    }

    const novasRespostas = {
      ...respostas,
      [questaoId]: alternativa
    };

    setRespostas(novasRespostas);

    if (simuladoSelecionado) {
      localStorage.setItem(
        `respostasSimulado_${simuladoSelecionado.id}`,
        JSON.stringify(novasRespostas)
      );
    }
  }

  // ==========================================
  // RESPOSTA CORRETA
  // ==========================================

  function obterRespostaCorreta(questao) {
    return String(
      questao.correta ||
        questao.resposta_correta ||
        questao.respostaCorreta ||
        ''
    ).toUpperCase();
  }

  // ==========================================
  // TEXTO DA ALTERNATIVA
  // ==========================================

  function obterTextoAlternativa(questao, letra) {
    const alternativas = {
      A: questao.alternativa_a,
      B: questao.alternativa_b,
      C: questao.alternativa_c,
      D: questao.alternativa_d,
      E: questao.alternativa_e
    };

    return alternativas[letra] || '';
  }

  // ==========================================
  // CALCULAR RESULTADO
  // ==========================================

  function calcularResultado() {
    let acertos = 0;
    let erros = 0;

    const detalhes = questoes.map((questao, index) => {
      const respostaUsuario =
        respostas[questao.id] || null;

      const respostaCorreta =
        obterRespostaCorreta(questao);

      const acertou =
        respostaUsuario &&
        String(respostaUsuario).toUpperCase() ===
          respostaCorreta;

      if (acertou) {
        acertos++;
      } else {
        erros++;
      }

      return {
        questao,
        index,
        respostaUsuario,
        respostaCorreta,
        acertou: Boolean(acertou)
      };
    });

    const totalQuestoes = questoes.length;

    const porcentagem =
      totalQuestoes > 0
        ? (acertos / totalQuestoes) * 100
        : 0;

    return {
      acertos,
      erros,
      totalQuestoes,
      porcentagem,
      detalhes
    };
  }

  // ==========================================
  // SALVAR RESULTADO
  // ==========================================

  async function salvarResultado() {
    const usuarioId = obterUsuarioId();

    if (!usuarioId) {
      throw new Error(
        'Não foi possível identificar o usuário logado.'
      );
    }

    const resultado = calcularResultado();

    const resposta = await fetch(
      `${API_URL}/resultados`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          usuarioId,

          acertos: resultado.acertos,

          erros: resultado.erros,

          totalQuestoes:
            resultado.totalQuestoes
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados.mensagem ||
          'Erro ao salvar resultado.'
      );
    }

    return dados;
  }

  // ==========================================
  // FINALIZAR SIMULADO
  // ==========================================

  async function finalizarSimulado() {
    if (!simuladoSelecionado) {
      return;
    }

    const respondeu =
      Object.keys(respostas).length;

    if (respondeu < questoes.length) {
      const continuar = window.confirm(
        `Você respondeu ${respondeu} de ${questoes.length} questões.\n\nAs questões não respondidas serão consideradas erradas.\n\nDeseja finalizar mesmo assim?`
      );

      if (!continuar) {
        return;
      }
    }

    const confirmar = window.confirm(
      'Deseja finalizar o simulado?'
    );

    if (!confirmar) {
      return;
    }

    try {
      setSalvandoResultado(true);
      setErro('');

      const resultadoCalculado =
        calcularResultado();

      const dados =
        await salvarResultado();

      const resultado =
        dados.resultado || resultadoCalculado;

      // ======================================
      // ATUALIZAR STATUS
      // ======================================

      setSimulados((prev) =>
        prev.map((simulado) =>
          simulado.id ===
          simuladoSelecionado.id
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

      // ======================================
      // XP
      // ======================================

      addXP(
        50,
        'simulado concluído'
      );

      // ======================================
      // RESULTADO FINAL
      // ======================================

      setResultadoFinal({
        acertos:
          resultado.acertos,

        erros:
          resultado.erros,

        totalQuestoes:
          resultado.totalQuestoes,

        porcentagem:
          Number(
            resultado.porcentagem
          ),

        detalhes:
          resultadoCalculado.detalhes
      });

      setMostrarErros(false);

      // ======================================
      // APAGAR RESPOSTAS SALVAS
      // ======================================

      localStorage.removeItem(
        `respostasSimulado_${simuladoSelecionado.id}`
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível salvar o resultado.'
      );

      alert(
        error.message ||
          'Não foi possível salvar o resultado.'
      );
    } finally {
      setSalvandoResultado(false);
    }
  }

  // ==========================================
  // REFAZER SIMULADO
  // ==========================================

  function refazerSimulado() {
    if (!simuladoSelecionado) {
      return;
    }

    localStorage.removeItem(
      `respostasSimulado_${simuladoSelecionado.id}`
    );

    setRespostas({});

    setResultadoFinal(null);

    setMostrarErros(false);

    setSimulados((prev) =>
      prev.map((simulado) =>
        simulado.id ===
        simuladoSelecionado.id
          ? {
              ...simulado,
              status: 'em-progresso'
            }
          : simulado
      )
    );

    salvarStatus(
      simuladoSelecionado.id,
      'em-progresso'
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // ==========================================
  // PRÓXIMA QUESTÃO
  // ==========================================

  function proximaQuestao(index) {
    const proxima =
      document.getElementById(
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
  // VOLTAR
  // ==========================================

  function voltarParaSimulados() {
    if (salvandoResultado) {
      return;
    }

    setSimuladoSelecionado(null);
    setQuestoes([]);
    setRespostas({});
    setResultadoFinal(null);
    setMostrarErros(false);

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
          .map(
            (questao) =>
              questao.materia
          )
          .filter(Boolean)
      )
    )
  ];

  const simuladosVisiveis =
    filtro === 'Todas'
      ? simulados
      : simulados.filter(
          (simulado) =>
            simulado.materia === filtro
        );

  const concluidos =
    simulados.filter(
      (simulado) =>
        simulado.status ===
        'concluido'
    ).length;

  // ==========================================
  // TELA DO SIMULADO
  // ==========================================

  if (simuladoSelecionado) {

    // ========================================
    // RESULTADO FINAL
    // ========================================

       if (resultadoFinal) {
      return createPortal(
        <div className="simulado-fullscreen">
          <div className="page-header">
            <div>
              <h1>
                Resultado do simulado
              </h1>

              <p>
                {simuladoSelecionado.titulo}
              </p>
            </div>
          </div>

          {/* RESULTADO PRINCIPAL */}

          <div
            className="stat-card"
            style={{
              textAlign: 'center',
              marginTop: '30px',
              padding: '40px'
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                marginBottom: '10px'
              }}
            >
              🎉 Simulado concluído!
            </h2>

            <p
              style={{
                fontSize: '18px',
                marginBottom: '35px'
              }}
            >
              Confira seu desempenho:
            </p>

            {/* ESTATÍSTICAS */}

            <div
              className="stats-row"
              style={{
                marginBottom: '30px'
              }}
            >
              <div className="stat-card">
                <div
                  className="stat-value"
                  style={{
                    color: '#16a34a'
                  }}
                >
                  {resultadoFinal.acertos}
                </div>

                <div className="stat-label">
                  Acertos
                </div>
              </div>

              <div className="stat-card">
                <div
                  className="stat-value"
                  style={{
                    color: '#dc2626'
                  }}
                >
                  {resultadoFinal.erros}
                </div>

                <div className="stat-label">
                  Erros
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value">
                  {Number(
                    resultadoFinal.porcentagem
                  ).toFixed(2)}
                  %
                </div>

                <div className="stat-label">
                  Aproveitamento
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: '16px',
                marginBottom: '30px'
              }}
            >
              Você acertou{' '}
              <strong>
                {resultadoFinal.acertos}
              </strong>{' '}
              de{' '}
              <strong>
                {resultadoFinal.totalQuestoes}
              </strong>{' '}
              questões.
            </p>

            {/* BOTÕES */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'center',
                gap: '15px',
                flexWrap: 'wrap'
              }}
            >
              <button
                className="simulado-btn"
                onClick={() =>
                  setMostrarErros(
                    !mostrarErros
                  )
                }
              >
                {mostrarErros
                  ? 'Ocultar questões'
                  : 'Ver questões'}
              </button>

              <button
                className="simulado-btn"
                onClick={
                  refazerSimulado
                }
              >
                Refazer simulado
              </button>

              <button
                className="simulado-btn"
                onClick={
                  voltarParaSimulados
                }
              >
                Voltar para simulados
              </button>
            </div>
          </div>

          {/* =====================================
              QUESTÕES DO RESULTADO
          ====================================== */}

          {mostrarErros && (
            <div
              style={{
                marginTop: '30px',
                display: 'flex',
                flexDirection:
                  'column',
                gap: '20px',
                marginBottom: '50px'
              }}
            >
              <div className="stat-card">
                <h2>
                  Correção das questões
                </h2>

                <p>
                  Confira quais questões
                  você acertou e quais
                  errou.
                </p>
              </div>

              {resultadoFinal.detalhes.map(
                (item) => {
                  const {
                    questao,
                    index,
                    respostaUsuario,
                    respostaCorreta,
                    acertou
                  } = item;

                  return (
                    <div
                      key={questao.id}
                      className="simulado-card"
                      style={{
                        padding: '25px',
                        border:
                          acertou
                            ? '2px solid #16a34a'
                            : '2px solid #dc2626'
                      }}
                    >
                      {/* CABEÇALHO */}

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap: '15px',
                          marginBottom:
                            '20px',
                          flexWrap:
                            'wrap'
                        }}
                      >
                        <span
                          className="simulado-subject"
                        >
                          Questão{' '}
                          {index + 1}
                        </span>

                        <span
                          style={{
                            padding:
                              '7px 14px',
                            borderRadius:
                              '20px',
                            fontWeight:
                              '700',
                            color:
                              acertou
                                ? '#166534'
                                : '#991b1b',
                            background:
                              acertou
                                ? '#dcfce7'
                                : '#fee2e2'
                          }}
                        >
                          {acertou
                            ? '✓ Acertou'
                            : '✕ Errou'}
                        </span>
                      </div>

                      {/* PERGUNTA */}

                      <h2
                        style={{
                          marginBottom:
                            '25px'
                        }}
                      >
                        {questao.pergunta}
                      </h2>

                      {/* ALTERNATIVAS */}

                      <div
                        style={{
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          gap: '10px'
                        }}
                      >
                        {[
                          [
                            'A',
                            questao.alternativa_a
                          ],
                          [
                            'B',
                            questao.alternativa_b
                          ],
                          [
                            'C',
                            questao.alternativa_c
                          ],
                          [
                            'D',
                            questao.alternativa_d
                          ],
                          [
                            'E',
                            questao.alternativa_e
                          ]
                        ].map(
                          ([
                            letra,
                            texto
                          ]) => {
                            const ehCorreta =
                              letra ===
                              respostaCorreta;

                            const foiSelecionada =
                              letra ===
                              respostaUsuario;

                            let background =
                              '#ffffff';

                            let border =
                              '1px solid #d1d5db';

                            if (
                              ehCorreta
                            ) {
                              background =
                                '#dcfce7';

                              border =
                                '2px solid #16a34a';
                            }

                            if (
                              foiSelecionada &&
                              !ehCorreta
                            ) {
                              background =
                                '#fee2e2';

                              border =
                                '2px solid #dc2626';
                            }

                            return (
                              <div
                                key={
                                  letra
                                }
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '12px',
                                  padding:
                                    '14px 16px',
                                  borderRadius:
                                    '10px',
                                  border,
                                  background
                                }}
                              >
                                <strong
                                  style={{
                                    minWidth:
                                      '32px',
                                    height:
                                      '32px',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    borderRadius:
                                      '50%',
                                    background:
                                      ehCorreta
                                        ? '#16a34a'
                                        : foiSelecionada
                                        ? '#dc2626'
                                        : '#e5e7eb',
                                    color:
                                      ehCorreta ||
                                      foiSelecionada
                                        ? '#ffffff'
                                        : '#111827'
                                  }}
                                >
                                  {letra}
                                </strong>

                                <span
                                  style={{
                                    flex: 1
                                  }}
                                >
                                  {texto}
                                </span>

                                {ehCorreta && (
                                  <strong
                                    style={{
                                      color:
                                        '#166534'
                                    }}
                                  >
                                    ✓ Correta
                                  </strong>
                                )}

                                {foiSelecionada &&
                                  !ehCorreta && (
                                    <strong
                                      style={{
                                        color:
                                          '#991b1b'
                                      }}
                                    >
                                      Sua resposta
                                    </strong>
                                  )}
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* RESUMO DA QUESTÃO */}

                      <div
                        style={{
                          marginTop:
                            '20px',
                          padding:
                            '15px',
                          borderRadius:
                            '10px',
                          background:
                            acertou
                              ? '#f0fdf4'
                              : '#fef2f2'
                        }}
                      >
                        {acertou ? (
                          <p
                            style={{
                              margin: 0,
                              color:
                                '#166534'
                            }}
                          >
                            <strong>
                              Você acertou!
                            </strong>{' '}
                            A alternativa{' '}
                            <strong>
                              {
                                respostaCorreta
                              }
                            </strong>{' '}
                            é a correta.
                          </p>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              color:
                                '#991b1b'
                            }}
                          >
                            <strong>
                              Você errou.
                            </strong>{' '}
                            Sua resposta:{' '}
                            <strong>
                              {respostaUsuario ||
                                'Não respondida'}
                            </strong>
                            {' | '}
                            Resposta correta:{' '}
                            <strong>
                              {
                                respostaCorreta
                              }
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
                    )}
        </div>,
        document.body
      );
    }

    // ========================================
    // TELA DAS QUESTÕES
    // ========================================

       return createPortal(
      <div className="simulado-fullscreen">
        <div className="page-header">
          <div>
            <button
              className="simulado-btn"
              onClick={
                voltarParaSimulados
              }
              disabled={
                salvandoResultado
              }
              style={{
                marginBottom:
                  '15px'
              }}
            >
              ← Voltar para simulados
            </button>

            <h1>
              {simuladoSelecionado.titulo}
            </h1>

            {simuladoSelecionado.descricao && (
              <p>
                {
                  simuladoSelecionado.descricao
                }
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
              {
                simuladoSelecionado.tempo_limite
              }
            </div>

            <div className="stat-label">
              Minutos
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              {
                Object.keys(
                  respostas
                ).length
              }
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
                Este simulado ainda
                não possui questões.
              </h2>

              <p>
                O administrador
                precisa adicionar
                questões antes de
                você poder realizar
                o simulado.
              </p>
            </div>
          ) : (
            questoes.map(
              (questao, index) => {
                const respostaSelecionada =
                  respostas[
                    questao.id
                  ];

                const respondeu =
                  Boolean(
                    respostaSelecionada
                  );

                return (
                  <div
                    className="simulado-card"
                    id={`questao-${index}`}
                    key={questao.id}
                    style={{
                      padding: '25px'
                    }}
                  >
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

                    <h2
                      style={{
                        marginTop:
                          '20px',
                        marginBottom:
                          '25px'
                      }}
                    >
                      {questao.pergunta}
                    </h2>

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        gap: '12px'
                      }}
                    >
                      {[
                        [
                          'A',
                          questao.alternativa_a
                        ],
                        [
                          'B',
                          questao.alternativa_b
                        ],
                        [
                          'C',
                          questao.alternativa_c
                        ],
                        [
                          'D',
                          questao.alternativa_d
                        ],
                        [
                          'E',
                          questao.alternativa_e
                        ]
                      ].map(
                        ([
                          letra,
                          texto
                        ]) => {
                          const selecionada =
                            respostaSelecionada ===
                            letra;

                          return (
                            <button
                              key={
                                letra
                              }
                              type="button"
                              disabled={
                                respondeu ||
                                salvandoResultado
                              }
                              onClick={() =>
                                selecionarResposta(
                                  questao.id,
                                  letra
                                )
                              }
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: '15px',
                                width:
                                  '100%',
                                textAlign:
                                  'left',
                                padding:
                                  '16px 18px',
                                borderRadius:
                                  '10px',
                                border:
                                  selecionada
                                    ? '2px solid #2563eb'
                                    : '1px solid #d1d5db',
                                background:
                                  selecionada
                                    ? '#eff6ff'
                                    : '#ffffff',
                                cursor:
                                  respondeu
                                    ? 'default'
                                    : 'pointer',
                                fontSize:
                                  '16px'
                              }}
                            >
                              <strong
                                style={{
                                  minWidth:
                                    '32px',
                                  height:
                                    '32px',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'center',
                                  borderRadius:
                                    '50%',
                                  background:
                                    selecionada
                                      ? '#2563eb'
                                      : '#e5e7eb',
                                  color:
                                    selecionada
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

                    {index <
                      questoes.length -
                        1 && (
                      <button
                        className="simulado-btn"
                        onClick={() =>
                          proximaQuestao(
                            index
                          )
                        }
                        style={{
                          marginTop:
                            '25px'
                        }}
                      >
                        Próxima questão →
                      </button>
                    )}
                  </div>
                );
              }
            )
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
              onClick={
                finalizarSimulado
              }
              disabled={
                salvandoResultado
              }
              style={{
                padding: '14px 35px',
                fontSize: '16px'
              }}
            >
              {salvandoResultado
                ? 'Salvando resultado...'
                : 'Finalizar simulado'}
            </button>
          </div>
               )}
      </div>,
      document.body
    );
  }

  // ==========================================
  // CARREGANDO
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

  // ==========================================
  // LISTAGEM
  // ==========================================

  return (
    <div>
      <div className="page-header">
        <h1>Simulados</h1>

        <div className="page-actions">
          <select
            className="mural-filter-select"
            value={filtro}
            onChange={(e) =>
              setFiltro(
                e.target.value
              )
            }
          >
            <option value="Todas">
              Todas as matérias
            </option>

            {materias
              .filter(
                (materia) =>
                  materia !== 'Todas'
              )
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

      {erro && (
        <div
          className="stat-card"
          style={{
            marginBottom: '20px'
          }}
        >
          <p>{erro}</p>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">
            {String(
              concluidos
            ).padStart(2, '0')}
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
              (
                total,
                simulado
              ) =>
                total +
                Number(
                  simulado.quantidade_questoes ||
                    0
                ),
              0
            )}
          </div>

          <div className="stat-label">
            Questões disponíveis
          </div>
        </div>
      </div>

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
            Os simulados cadastrados
            pelo administrador
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

                <h2
                  style={{
                    marginTop: '15px',
                    marginBottom:
                      '10px'
                  }}
                >
                  {simulado.titulo}
                </h2>

                {simulado.descricao && (
                  <p
                    style={{
                      marginBottom:
                        '20px'
                    }}
                  >
                    {simulado.descricao}
                  </p>
                )}

                <div className="simulado-meta">
                  <span>
                    📝{' '}
                    {
                      simulado.quantidade_questoes
                    }{' '}
                    questões
                  </span>

                  <span>
                    ⏱{' '}
                    {
                      simulado.tempo_limite
                    }{' '}
                    minutos
                  </span>
                </div>

                <button
                  className="simulado-btn"
                  onClick={() =>
                    abrirSimulado(
                      simulado
                    )
                  }
                  disabled={
                    carregandoQuestoes
                  }
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