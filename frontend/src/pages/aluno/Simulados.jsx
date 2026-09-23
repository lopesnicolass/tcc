import '../../styles/aluno/Simulados.css';
import { useEffect, useState, useRef } from 'react';
import { useGamification } from '../../context/GamificationContext.jsx';

import { STATUS_LABEL, BTN_LABEL } from './simulados/constants.js';
import { TelaResultado } from './simulados/TelaResultado.jsx';
import { TelaSimulado } from './simulados/TelaSimulado.jsx';
import { ListaSimulados } from './simulados/ListaSimulados.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token')
  );
}

export default function Simulados() {
  const { addXP } = useGamification();

  const [simulados, setSimulados] = useState([]);
  const [filtro, setFiltro] = useState('Todas');

  const [simuladoSelecionado, setSimuladoSelecionado] =
    useState(null);

  const [questoes, setQuestoes] = useState([]);

  const [respostas, setRespostas] = useState({});

  const [resultadoFinal, setResultadoFinal] =
    useState(null);

  const [mostrarErros, setMostrarErros] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoQuestoes, setCarregandoQuestoes] =
    useState(false);

  const [salvandoResultado, setSalvandoResultado] =
    useState(false);

  const [erro, setErro] =
    useState('');

  // ==========================================
  // CRONÔMETRO
  // ==========================================

  const [tempoRestante, setTempoRestante] =
    useState(null);

  const [tempoGasto, setTempoGasto] =
    useState(null);

  const finalizandoPorTempo =
    useRef(false);

  const abrindoSimuladoPorParametro =
    useRef(false);

  // ==========================================
  // PEGAR ID DO USUÁRIO
  // ==========================================

  function obterUsuarioId() {
    const usuarioSalvo =
      localStorage.getItem(
        'etecamp_usuario'
      );

    if (!usuarioSalvo) {
      console.error(
        'Usuário não encontrado no localStorage.'
      );

      return null;
    }

    try {
      const usuario =
        JSON.parse(
          usuarioSalvo
        );

      if (usuario.id) {
        return Number(
          usuario.id
        );
      }

      if (usuario.usuarioId) {
        return Number(
          usuario.usuarioId
        );
      }

      console.error(
        'ID do usuário não encontrado:',
        usuario
      );

      return null;
    } catch (error) {
      console.error(
        'Erro ao ler etecamp_usuario:',
        error
      );

      return null;
    }
  }

  // ==========================================
  // CHAVES DO LOCALSTORAGE
  // ==========================================

  function obterChaveStatus() {
    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {
      return null;
    }

    return `statusSimulados_${usuarioId}`;
  }

  function obterChaveRespostas(
    simuladoId
  ) {
    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {
      return null;
    }

    return `respostasSimulado_${usuarioId}_${simuladoId}`;
  }

  // ==========================================
  // CHAVES DO CRONÔMETRO
  // ==========================================

  function obterChavePrazo(
    simuladoId
  ) {
    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {
      return null;
    }

    return `prazoSimulado_${usuarioId}_${simuladoId}`;
  }

  function obterChaveInicio(
    simuladoId
  ) {
    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {
      return null;
    }

    return `inicioSimulado_${usuarioId}_${simuladoId}`;
  }

  // ==========================================
  // REGISTRAR INÍCIO
  // ==========================================

  function registrarInicioSimulado(
    simulado
  ) {
    const chaveInicio =
      obterChaveInicio(
        simulado.id
      );

    if (!chaveInicio) {
      return;
    }

    localStorage.setItem(
      chaveInicio,
      String(Date.now())
    );
  }

  // ==========================================
  // TEMPO GASTO
  // ==========================================

  function obterTempoGasto(
    simulado
  ) {
    const chaveInicio =
      obterChaveInicio(
        simulado.id
      );

    const inicio =
      chaveInicio
        ? Number(
            localStorage.getItem(
              chaveInicio
            )
          )
        : NaN;

    if (Number.isFinite(inicio)) {
      const segundos =
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              inicio
            ) / 1000
          )
        );

      const limite =
        Number(
          simulado.tempo_limite
        );

      if (
        Number.isFinite(
          limite
        ) &&
        limite > 0
      ) {
        return Math.min(
          segundos,
          limite * 60
        );
      }

      return segundos;
    }

    return 0;
  }

  // ==========================================
  // LIMPAR INÍCIO
  // ==========================================

  function limparInicioSimulado(
    simuladoId
  ) {
    const chaveInicio =
      obterChaveInicio(
        simuladoId
      );

    if (chaveInicio) {
      localStorage.removeItem(
        chaveInicio
      );
    }
  }

  // ==========================================
  // FORMATAR TEMPO
  // ==========================================

  function formatarTempo(
    segundos
  ) {
    if (
      segundos === null ||
      segundos === undefined
    ) {
      return '--:--';
    }

    const total =
      Math.max(
        0,
        Number(segundos)
      );

    const minutos =
      Math.floor(
        total / 60
      );

    const segundosRestantes =
      total % 60;

    return `${String(
      minutos
    ).padStart(
      2,
      '0'
    )}:${String(
      segundosRestantes
    ).padStart(
      2,
      '0'
    )}`;
  }

  // ==========================================
  // LIMPAR PRAZO
  // ==========================================

  function limparCronometro(
    simuladoId
  ) {
    const chave =
      obterChavePrazo(
        simuladoId
      );

    if (chave) {
      localStorage.removeItem(
        chave
      );
    }
  }

  // ==========================================
  // INICIAR CRONÔMETRO
  // ==========================================

  function iniciarCronometro(
    simulado
  ) {
    const chave =
      obterChavePrazo(
        simulado.id
      );

    if (!chave) {
      return;
    }

    const minutos =
      Number(
        simulado.tempo_limite
      );

    if (
      !Number.isFinite(
        minutos
      ) ||
      minutos <= 0
    ) {
      setTempoRestante(
        null
      );

      return;
    }

    const agora =
      Date.now();

    const prazo =
      agora +
      minutos *
        60 *
        1000;

    localStorage.setItem(
      chave,
      String(prazo)
    );

    registrarInicioSimulado(
      simulado
    );

    setTempoGasto(
      0
    );

    setTempoRestante(
      minutos * 60
    );
  }

  // ==========================================
  // CARREGAR CRONÔMETRO
  // ==========================================

  function carregarCronometro(
    simulado
  ) {
    const chave =
      obterChavePrazo(
        simulado.id
      );

    const minutos =
      Number(
        simulado.tempo_limite
      );

    if (
      !chave ||
      !Number.isFinite(
        minutos
      ) ||
      minutos <= 0
    ) {
      setTempoRestante(
        null
      );

      return;
    }

    const prazoSalvo =
      Number(
        localStorage.getItem(
          chave
        )
      );

    if (
      !Number.isFinite(
        prazoSalvo
      )
    ) {
      iniciarCronometro(
        simulado
      );

      return;
    }

    const restante =
      Math.max(
        0,
        Math.ceil(
          (
            prazoSalvo -
            Date.now()
          ) / 1000
        )
      );

    const chaveInicio =
      obterChaveInicio(
        simulado.id
      );

    if (
      chaveInicio &&
      !Number.isFinite(
        Number(
          localStorage.getItem(
            chaveInicio
          )
        )
      )
    ) {
      const inicioCalculado =
        prazoSalvo -
        minutos *
          60 *
          1000;

      localStorage.setItem(
        chaveInicio,
        String(
          inicioCalculado
        )
      );
    }

    setTempoRestante(
      restante
    );
  }

  // ==========================================
  // ATUALIZAR CRONÔMETRO
  // ==========================================

  useEffect(() => {
    if (
      !simuladoSelecionado ||
      resultadoFinal
    ) {
      return;
    }

    carregarCronometro(
      simuladoSelecionado
    );

    const intervalo =
      setInterval(() => {
        const chave =
          obterChavePrazo(
            simuladoSelecionado.id
          );

        const prazo =
          chave
            ? Number(
                localStorage.getItem(
                  chave
                )
              )
            : NaN;

        if (
          !Number.isFinite(
            prazo
          )
        ) {
          return;
        }

        const restante =
          Math.max(
            0,
            Math.ceil(
              (
                prazo -
                Date.now()
              ) / 1000
            )
          );

        setTempoRestante(
          restante
        );

        if (
          restante <= 0 &&
          !finalizandoPorTempo.current
        ) {
          finalizandoPorTempo.current =
            true;

          clearInterval(
            intervalo
          );

          finalizarSimulado(
            true
          );
        }
      }, 1000);

    return () =>
      clearInterval(
        intervalo
      );
  }, [
    simuladoSelecionado,
    resultadoFinal,
    questoes.length
  ]);

  // ==========================================
  // CARREGAR SIMULADOS
  // ==========================================

  useEffect(() => {
    carregarSimulados();
  }, []);

  // ==========================================
  // ABRIR SIMULADO VINDO DO CONTEÚDO
  // ==========================================

  useEffect(() => {
    if (
      carregando ||
      simulados.length === 0 ||
      simuladoSelecionado ||
      abrindoSimuladoPorParametro.current
    ) {
      return;
    }

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const simuladoId =
      Number(
        parametros.get(
          'simuladoId'
        )
      );

    if (
      !Number.isInteger(
        simuladoId
      ) ||
      simuladoId <= 0
    ) {
      return;
    }

    const simulado =
      simulados.find(
        (item) =>
          Number(
            item.id
          ) ===
          simuladoId
      );

    // Retira o parâmetro da URL imediatamente.
    // Assim o mesmo simulado não é aberto
    // novamente por outro render.
    window.history.replaceState(
      {},
      '',
      window.location.pathname
    );

    if (!simulado) {
      setErro(
        'O simulado solicitado não foi encontrado.'
      );

      return;
    }

    abrindoSimuladoPorParametro.current =
      true;

    abrirSimulado(
      simulado
    ).finally(() => {
      abrindoSimuladoPorParametro.current =
        false;
    });
  }, [
    carregando,
    simulados,
    simuladoSelecionado
  ]);

  async function carregarSimulados() {
    try {
      setCarregando(
        true
      );

      setErro('');

      const resposta =
        await fetch(
          `${API_URL}/simulados`,
          {
            headers: {
              Authorization:
                `Bearer ${obterToken()}`
            }
          }
        );

      if (
        !resposta.ok
      ) {
        throw new Error(
          'Erro ao buscar simulados.'
        );
      }

      const dados =
        await resposta.json();

      const lista =
        Array.isArray(
          dados.simulados
        )
          ? dados.simulados
          : [];

      const chaveStatus =
        obterChaveStatus();

      let statusSalvos = {};

      if (chaveStatus) {
        try {
          statusSalvos =
            JSON.parse(
              localStorage.getItem(
                chaveStatus
              ) || '{}'
            );
        } catch (error) {
          console.error(
            'Erro ao ler status dos simulados:',
            error
          );

          statusSalvos = {};
        }
      }

      const simuladosComStatus =
        lista.map(
          (simulado) => ({
            ...simulado,

            status:
              statusSalvos[
                simulado.id
              ] ||
              'nao-iniciado'
          })
        );

      setSimulados(
        simuladosComStatus
      );
    } catch (error) {
      console.error(
        error
      );

      setErro(
        'Não foi possível carregar os simulados. Verifique se o backend está rodando.'
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  // ==========================================
  // SALVAR STATUS
  // ==========================================

  function salvarStatus(
    id,
    status
  ) {
    const chaveStatus =
      obterChaveStatus();

    if (!chaveStatus) {
      console.error(
        'Não foi possível salvar o status: usuário não identificado.'
      );

      return;
    }

    let statusSalvos = {};

    try {
      statusSalvos =
        JSON.parse(
          localStorage.getItem(
            chaveStatus
          ) || '{}'
        );
    } catch (error) {
      console.error(
        'Erro ao ler status:',
        error
      );

      statusSalvos = {};
    }

    statusSalvos[id] =
      status;

    localStorage.setItem(
      chaveStatus,
      JSON.stringify(
        statusSalvos
      )
    );
  }

  // ==========================================
  // ABRIR SIMULADO
  // ==========================================

  async function abrirSimulado(
    simulado
  ) {
    try {
      finalizandoPorTempo.current =
        false;

      setCarregandoQuestoes(
        true
      );

      setErro('');

      setResultadoFinal(
        null
      );

      setMostrarErros(
        false
      );

      const resposta =
        await fetch(
          `${API_URL}/simulados/${simulado.id}`,
          {
            headers: {
              Authorization:
                `Bearer ${obterToken()}`
            }
          }
        );

      if (
        !resposta.ok
      ) {
        throw new Error(
          'Erro ao buscar o simulado.'
        );
      }

      const dados =
        await resposta.json();

      const listaQuestoes =
        Array.isArray(
          dados.questoes
        )
          ? dados.questoes
          : [];

      setSimuladoSelecionado(
        simulado
      );

      setQuestoes(
        listaQuestoes
      );

      // ========================================
      // CARREGAR RESPOSTAS
      // ========================================

      const chaveRespostas =
        obterChaveRespostas(
          simulado.id
        );

      if (
        simulado.status ===
          'em-progresso' &&
        chaveRespostas
      ) {
        try {
          const respostasSalvas =
            JSON.parse(
              localStorage.getItem(
                chaveRespostas
              ) || '{}'
            );

          setRespostas(
            respostasSalvas
          );
        } catch (error) {
          console.error(
            'Erro ao carregar respostas:',
            error
          );

          setRespostas({});
        }
      } else {
        if (
          chaveRespostas
        ) {
          localStorage.removeItem(
            chaveRespostas
          );
        }

        setRespostas({});
      }

      // ========================================
      // INICIAR OU REINICIAR
      // ========================================

      if (
        simulado.status ===
          'nao-iniciado' ||
        simulado.status ===
          'concluido'
      ) {
        const atualizado =
          {
            ...simulado,

            status:
              'em-progresso'
          };

        setSimulados(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                simulado.id
                  ? atualizado
                  : item
            )
        );

        setSimuladoSelecionado(
          atualizado
        );

        salvarStatus(
          simulado.id,
          'em-progresso'
        );

        addXP(
          10,
          'simulado iniciado'
        );
      }

      // ========================================
      // CRONÔMETRO
      // ========================================

      if (
        simulado.status ===
        'em-progresso'
      ) {
        carregarCronometro(
          simulado
        );
      } else {
        iniciarCronometro(
          simulado
        );
      }

      window.scrollTo({
        top: 0,
        behavior:
          'smooth'
      });
    } catch (error) {
      console.error(
        error
      );

      setErro(
        'Não foi possível carregar as questões deste simulado.'
      );
    } finally {
      setCarregandoQuestoes(
        false
      );
    }
  }

  // ==========================================
  // SELECIONAR / TROCAR RESPOSTA
  // ==========================================

  function selecionarResposta(
    questaoId,
    alternativa
  ) {
    setRespostas(
      (prev) => {
        const novasRespostas =
          {
            ...prev,

            [questaoId]:
              alternativa
          };

        if (
          simuladoSelecionado
        ) {
          const chaveRespostas =
            obterChaveRespostas(
              simuladoSelecionado.id
            );

          if (
            chaveRespostas
          ) {
            localStorage.setItem(
              chaveRespostas,
              JSON.stringify(
                novasRespostas
              )
            );
          }
        }

        return novasRespostas;
      }
    );
  }

  // ==========================================
  // CORRIGIR NO SERVIDOR
  // ==========================================

  async function corrigirNoServidor() {
    const resposta =
      await fetch(
        `${API_URL}/simulados/${simuladoSelecionado.id}/corrigir`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${obterToken()}`
          },

          body:
            JSON.stringify({
              respostas
            })
        }
      );

    const dados =
      await resposta.json();

    if (
      !resposta.ok
    ) {
      throw new Error(
        dados.mensagem ||
          'Erro ao corrigir o simulado.'
      );
    }

    const detalhesComQuestao =
      (
        Array.isArray(
          dados.detalhes
        )
          ? dados.detalhes
          : []
      ).map(
        (item) => {
          const index =
            questoes.findIndex(
              (questao) =>
                Number(
                  questao.id
                ) ===
                Number(
                  item.questaoId
                )
            );

          return {
            questao:
              index >= 0
                ? questoes[
                    index
                  ]
                : {
                    id:
                      item.questaoId
                  },

            index:
              index >= 0
                ? index
                : 0,

            respostaUsuario:
              item.respostaUsuario,

            respostaCorreta:
              item.respostaCorreta,

            acertou:
              item.acertou
          };
        }
      );

    return {
      acertos:
        dados.resultado.acertos,

      erros:
        dados.resultado.erros,

      totalQuestoes:
        dados.resultado.totalQuestoes,

      porcentagem:
        dados.resultado.porcentagem,

      detalhes:
        detalhesComQuestao
    };
  }

  // ==========================================
  // SALVAR RESULTADO
  // ==========================================

  async function salvarResultado(
    resultado
  ) {
    const usuarioId =
      obterUsuarioId();

    if (!usuarioId) {
      throw new Error(
        'Não foi possível identificar o usuário logado.'
      );
    }

    const resposta =
      await fetch(
        `${API_URL}/resultados`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${obterToken()}`
          },

          body:
            JSON.stringify({
              usuarioId,

              acertos:
                resultado.acertos,

              erros:
                resultado.erros,

              totalQuestoes:
                resultado.totalQuestoes
            })
        }
      );

    const dados =
      await resposta.json();

    if (
      !resposta.ok
    ) {
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

  async function finalizarSimulado(
    tempoEsgotado = false
  ) {
    if (
      !simuladoSelecionado
    ) {
      return;
    }

    // Evita que uma finalização manual e
    // uma finalização automática aconteçam
    // ao mesmo tempo.
    if (
      !tempoEsgotado
    ) {
      if (
        finalizandoPorTempo.current
      ) {
        return;
      }

      finalizandoPorTempo.current =
        true;
    }

    const tempoTotalGasto =
      obterTempoGasto(
        simuladoSelecionado
      );

    setTempoGasto(
      tempoTotalGasto
    );

    const respondeu =
      Object.keys(
        respostas
      ).length;

    if (!tempoEsgotado) {
      if (
        respondeu <
        questoes.length
      ) {
        const continuar =
          window.confirm(
            `Você respondeu ${respondeu} de ${questoes.length} questões.\n\nAs questões não respondidas serão consideradas erradas.\n\nDeseja finalizar mesmo assim?`
          );

        if (!continuar) {
          finalizandoPorTempo.current =
            false;

          return;
        }
      }

      const confirmar =
        window.confirm(
          'Deseja finalizar o simulado?'
        );

      if (!confirmar) {
        finalizandoPorTempo.current =
          false;

        return;
      }
    }

    try {
      setSalvandoResultado(
        true
      );

      setErro('');

      if (
        tempoEsgotado
      ) {
        setTempoRestante(
          0
        );
      }

      const resultadoCalculado =
        await corrigirNoServidor();

      const dados =
        await salvarResultado(
          resultadoCalculado
        );

      const resultado =
        dados.resultado ||
        resultadoCalculado;

      // ========================================
      // STATUS
      // ========================================

      setSimulados(
        (prev) =>
          prev.map(
            (simulado) =>
              simulado.id ===
              simuladoSelecionado.id
                ? {
                    ...simulado,

                    status:
                      'concluido'
                  }
                : simulado
          )
      );

      const simuladoAtualizado =
        {
          ...simuladoSelecionado,

          status:
            'concluido'
        };

      setSimuladoSelecionado(
        simuladoAtualizado
      );

      salvarStatus(
        simuladoSelecionado.id,
        'concluido'
      );

      limparCronometro(
        simuladoSelecionado.id
      );

      limparInicioSimulado(
        simuladoSelecionado.id
      );

      if (
        tempoEsgotado
      ) {
        setErro(
          'O tempo acabou. O simulado foi finalizado automaticamente.'
        );
      }

      addXP(
        50,
        'simulado concluído'
      );

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

      setMostrarErros(
        false
      );

      // ========================================
      // REMOVER RESPOSTAS SALVAS
      // ========================================

      const chaveRespostas =
        obterChaveRespostas(
          simuladoSelecionado.id
        );

      if (
        chaveRespostas
      ) {
        localStorage.removeItem(
          chaveRespostas
        );
      }

      finalizandoPorTempo.current =
        false;
    } catch (error) {
      console.error(
        error
      );

      finalizandoPorTempo.current =
        false;

      setErro(
        error.message ||
          'Não foi possível salvar o resultado.'
      );

      alert(
        error.message ||
          'Não foi possível salvar o resultado.'
      );
    } finally {
      setSalvandoResultado(
        false
      );
    }
  }

  // ==========================================
  // REFAZER SIMULADO
  // ==========================================

  function refazerSimulado() {
    if (
      !simuladoSelecionado
    ) {
      return;
    }

    const chaveRespostas =
      obterChaveRespostas(
        simuladoSelecionado.id
      );

    if (
      chaveRespostas
    ) {
      localStorage.removeItem(
        chaveRespostas
      );
    }

    setRespostas(
      {}
    );

    setResultadoFinal(
      null
    );

    setMostrarErros(
      false
    );

    setTempoGasto(
      null
    );

    const simuladoAtualizado =
      {
        ...simuladoSelecionado,

        status:
          'em-progresso'
      };

    setSimuladoSelecionado(
      simuladoAtualizado
    );

    setSimulados(
      (prev) =>
        prev.map(
          (simulado) =>
            simulado.id ===
            simuladoSelecionado.id
              ? simuladoAtualizado
              : simulado
        )
    );

    salvarStatus(
      simuladoSelecionado.id,
      'em-progresso'
    );

    finalizandoPorTempo.current =
      false;

    iniciarCronometro(
      simuladoSelecionado
    );

    window.scrollTo({
      top: 0,
      behavior:
        'smooth'
    });
  }

  // ==========================================
  // PRÓXIMA QUESTÃO
  // ==========================================

  function proximaQuestao(
    index
  ) {
    const proxima =
      document.getElementById(
        `questao-${index + 1}`
      );

    if (
      proxima
    ) {
      proxima.scrollIntoView(
        {
          behavior:
            'smooth',

          block:
            'start'
        }
      );
    }
  }

  // ==========================================
  // VOLTAR
  // ==========================================

  function voltarParaSimulados() {
    if (
      salvandoResultado
    ) {
      return;
    }

    finalizandoPorTempo.current =
      false;

    setSimuladoSelecionado(
      null
    );

    setQuestoes(
      []
    );

    setRespostas(
      {}
    );

    setResultadoFinal(
      null
    );

    setMostrarErros(
      false
    );

    setTempoRestante(
      null
    );

    setTempoGasto(
      null
    );

    setErro('');

    window.scrollTo({
      top: 0,
      behavior:
        'smooth'
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================

  const materias = [
    'Todas',

    ...Array.from(
      new Set(
        simulados
          .map(
            (simulado) =>
              simulado.materia
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
            simulado.materia ===
            filtro
        );

  const concluidos =
    simulados.filter(
      (simulado) =>
        simulado.status ===
        'concluido'
    ).length;

  // ==========================================
  // RESULTADO / TELA DO SIMULADO
  // ==========================================

  if (
    simuladoSelecionado
  ) {
    if (
      resultadoFinal
    ) {
      return (
        <TelaResultado
          simuladoSelecionado={
            simuladoSelecionado
          }
          resultadoFinal={
            resultadoFinal
          }
          tempoGasto={
            tempoGasto
          }
          mostrarErros={
            mostrarErros
          }
          setMostrarErros={
            setMostrarErros
          }
          refazerSimulado={
            refazerSimulado
          }
          voltarParaSimulados={
            voltarParaSimulados
          }
          formatarTempo={
            formatarTempo
          }
        />
      );
    }

    return (
      <TelaSimulado
        simuladoSelecionado={
          simuladoSelecionado
        }
        questoes={
          questoes
        }
        tempoRestante={
          tempoRestante
        }
        respostas={
          respostas
        }
        salvandoResultado={
          salvandoResultado
        }
        voltarParaSimulados={
          voltarParaSimulados
        }
        formatarTempo={
          formatarTempo
        }
        selecionarResposta={
          selecionarResposta
        }
        proximaQuestao={
          proximaQuestao
        }
        finalizarSimulado={
          finalizarSimulado
        }
      />
    );
  }

  // ==========================================
  // CARREGANDO LISTA
  // ==========================================

  if (
    carregando
  ) {
    return (
      <div>
        <div className="page-header">
          <h1>
            Simulados
          </h1>
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
    <ListaSimulados
      materias={
        materias
      }
      filtro={
        filtro
      }
      setFiltro={
        setFiltro
      }
      simulados={
        simulados
      }
      erro={
        erro
      }
      concluidos={
        concluidos
      }
      simuladosVisiveis={
        simuladosVisiveis
      }
      abrirSimulado={
        abrirSimulado
      }
      carregandoQuestoes={
        carregandoQuestoes
      }
    />
  );
}