import '../../styles/aluno/Simulados.css';
import { useEffect, useEffectEvent, useState, useRef } from 'react';
import { useGamification } from '../../context/GamificationShared.js';

import { TelaResultado } from './simulados/TelaResultado.jsx';
import { TelaSimulado } from './simulados/TelaSimulado.jsx';
import { ListaSimulados } from './simulados/ListaSimulados.jsx';
import { filtrarPorMateria, integrarStatusComHistorico } from './simulados/dadosSimulados.js';
import { request } from '../../services/api.js';
import { lerPrazoSalvo, lerSegundosSalvos, pausarPrazo, retomarPrazo, calcularSegundosRestantes } from '../../utils/simuladoCronometro.js';
import { prepararTentativaPersistida } from '../../utils/simuladoTentativa.js';

// A navegação dos simulados é independente do estado de outras contas.
// sessionStorage mantém a tela no mesmo navegador/aba ao navegar pela sidebar.
function chaveVisitaSimulados() {
  try {
    const usuario = JSON.parse(localStorage.getItem('etecamp_usuario') || 'null');
    const id = usuario?.id ?? usuario?.usuarioId;
    return id ? `tenna_simulados_visita_${id}` : null;
  } catch {
    return null;
  }
}

function lerVisitaSimulados() {
  try {
    const chave = chaveVisitaSimulados();
    return chave ? JSON.parse(sessionStorage.getItem(chave) || 'null') : null;
  } catch {
    return null;
  }
}

function salvarVisitaSimulados(visita) {
  try {
    const chave = chaveVisitaSimulados();
    if (chave) sessionStorage.setItem(chave, JSON.stringify(visita));
  } catch {
    // Navegação continua funcionando mesmo com armazenamento indisponível.
  }
}

export default function Simulados() {
  const { recarregarGamificacao } = useGamification();
  const visitaInicial = useRef(undefined);
  if (visitaInicial.current === undefined) {
    visitaInicial.current = lerVisitaSimulados();
  }
  const restauracaoTentada = useRef(false);
  const restauracaoPendente = useRef(Boolean(visitaInicial.current?.simuladoId));
  const rolagemPendente = useRef(visitaInicial.current?.scrollY ?? null);
  const visualAtual = useRef(null);

  const [simulados, setSimulados] = useState([]);
  const [filtro, setFiltro] = useState(() =>
    typeof visitaInicial.current?.filtro === 'string'
      ? visitaInicial.current.filtro
      : 'Todas'
  );

  // Clicar em Simulados na sidebar não reinicia a matéria escolhida.
  // O retorno à lista principal é feito pelo botão "Simulados" no cabeçalho.

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

  // null indica histórico ainda indisponível; [] indica usuário sem tentativas.
  const [historicoResultados, setHistoricoResultados] =
    useState(null);

  // Reflete tentativas salvas no servidor sem interromper provas em andamento.
  useEffect(() => {
    if (!Array.isArray(historicoResultados)) return;
    const atualizar = setTimeout(() => {
      setSimulados((atuais) => {
        const integrados = integrarStatusComHistorico(atuais, historicoResultados);
        return integrados.some((item, index) => item !== atuais[index]) ? integrados : atuais;
      });
    }, 0);
    return () => clearTimeout(atualizar);
  }, [historicoResultados, simulados]);

  // ==========================================
  // CRONÔMETRO
  // ==========================================

  const [tempoRestante, setTempoRestante] =
    useState(null);

  const [tempoGasto, setTempoGasto] =
    useState(null);

  // Guarda a visualização ao navegar por outras páginas sem mexer na prova.
  // A tentativa, respostas e cronômetro continuam controlados pelas rotinas
  // já existentes do simulador.
  useEffect(() => {
    visualAtual.current = {
      filtro, simuladoSelecionado, resultadoFinal, tempoGasto, mostrarErros
    };
  }, [filtro, simuladoSelecionado, resultadoFinal, tempoGasto, mostrarErros]);

  useEffect(() => {
    function guardarVisualizacao() {
      const visual = visualAtual.current;
      if (!visual) return;
      if (restauracaoPendente.current && !visual.simuladoSelecionado) return;
      salvarVisitaSimulados({
        filtro: visual.filtro,
        simuladoId: visual.simuladoSelecionado?.id ?? null,
        tela: visual.simuladoSelecionado
          ? (visual.resultadoFinal ? 'resultado' : 'prova')
          : 'lista',
        resultadoFinal: visual.resultadoFinal,
        tempoGasto: visual.tempoGasto,
        mostrarErros: visual.mostrarErros,
        scrollY: window.scrollY
      });
    }
    window.addEventListener('pagehide', guardarVisualizacao);
    return () => {
      guardarVisualizacao();
      window.removeEventListener('pagehide', guardarVisualizacao);
    };
  }, []);

  const finalizandoPorTempo =
    useRef(false);

  // O intervalo usa sempre as respostas e a função de finalização atuais.
  const respostasAtuais = useRef({});
  const finalizarSimuladoRef = useRef(null);
  const ultimaTentativaAutomatica = useRef(0);

  useEffect(() => {
    respostasAtuais.current = respostas;
  }, [respostas]);

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

  function obterChaveTentativa(simuladoId) {
    const usuarioId = obterUsuarioId();
    return usuarioId ? `tentativaSimulado_${usuarioId}_${simuladoId}` : null;
  }

  function prepararTentativa(simuladoId, nova = false) {
    const chave = obterChaveTentativa(simuladoId);
    if (!chave) throw new Error('Usuário não encontrado para registrar a tentativa.');
    return prepararTentativaPersistida(localStorage, chave, nova);
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

  // Resultados oficiais: única fonte de verdade para Home, Simulados e Desempenho.
  async function carregarHistoricoResultados() {
    try {
      const dados = await request(
        '/resultados/me',
        {},
        'Não foi possível carregar o histórico dos simulados.'
      );
      setHistoricoResultados(
        (Array.isArray(dados?.resultados) ? dados.resultados : []).map(
          (resultado) => ({
            ...resultado,
            totalQuestoes: Number(
              resultado.total_questoes ?? resultado.totalQuestoes ?? 0
            )
          })
        )
      );
    } catch (error) {
      console.error('Erro ao carregar histórico de simulados:', error);
      setHistoricoResultados(null);
      setErro(error.message || 'Não foi possível carregar o histórico dos simulados.');
    }
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

  function obterChaveRestante(simuladoId) {
    const usuarioId = obterUsuarioId();
    return usuarioId ? `restanteSimulado_${usuarioId}_${simuladoId}` : null;
  }

  // Ao sair da prova, preserva o tempo em segundos e remove o prazo ativo.
  // Assim o relógio só avança enquanto o simulado está aberto.
  function pausarCronometro(simulado) {
    if (!simulado || simulado.status === 'concluido') return;
    const chavePrazo = obterChavePrazo(simulado.id);
    const chaveRestante = obterChaveRestante(simulado.id);
    if (!chavePrazo || !chaveRestante) return;
    pausarPrazo(localStorage, chavePrazo, chaveRestante);
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

    const limiteMinutos = Number(simulado.tempo_limite);
    if (Number.isFinite(limiteMinutos) && limiteMinutos > 0) {
      const limite = Math.ceil(limiteMinutos * 60);
      const pausado = lerSegundosSalvos(localStorage, obterChaveRestante(simulado.id));
      const prazo = lerPrazoSalvo(localStorage, obterChavePrazo(simulado.id));
      const restante = Number.isFinite(pausado)
        ? pausado
        : Number.isFinite(prazo) ? calcularSegundosRestantes(prazo) : NaN;
      if (Number.isFinite(restante)) return Math.max(0, limite - Math.min(restante, limite));
    }

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
      localStorage.removeItem(chave);
    }
    const chaveRestante = obterChaveRestante(simuladoId);
    if (chaveRestante) localStorage.removeItem(chaveRestante);
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

    localStorage.setItem(chave, String(prazo));
    const chaveRestante = obterChaveRestante(simulado.id);
    if (chaveRestante) localStorage.removeItem(chaveRestante);

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

    const chaveRestante = obterChaveRestante(simulado.id);
    const segundosLimite = Math.ceil(minutos * 60);
    const haviaPausa = Number.isFinite(lerSegundosSalvos(localStorage, chaveRestante));
    const haviaPrazo = Number.isFinite(lerPrazoSalvo(localStorage, chave));
    const restante = retomarPrazo(
      localStorage, chave, chaveRestante, segundosLimite
    );

    // Reconstitui o início apenas ao retomar uma pausa ou recuperar um
    // cronômetro sem início salvo, para que a duração ignore o intervalo fora.
    const chaveInicio = obterChaveInicio(simulado.id);
    if (chaveInicio && (haviaPausa || !haviaPrazo ||
        !Number.isFinite(lerPrazoSalvo(localStorage, chaveInicio)))) {
      localStorage.setItem(
        chaveInicio,
        String(Date.now() - (segundosLimite - restante) * 1000)
      );
    }

    setTempoRestante(restante);
  }

  // ==========================================
  // ATUALIZAR CRONÔMETRO
  // ==========================================

  const pausarCronometroNoEfeito = useEffectEvent((simulado) => pausarCronometro(simulado));
  const carregarCronometroNoEfeito = useEffectEvent((simulado) => carregarCronometro(simulado));
  const obterChavePrazoNoEfeito = useEffectEvent((id) => obterChavePrazo(id));

  useEffect(() => {
    if (
      !simuladoSelecionado ||
      simuladoSelecionado.status === 'concluido' ||
      resultadoFinal
    ) {
      return;
    }

    const inicioCronometro = setTimeout(() => {
      carregarCronometroNoEfeito(simuladoSelecionado);
    }, 0);

    const intervalo =
      setInterval(() => {
        const chave =
          obterChavePrazoNoEfeito(
            simuladoSelecionado.id
          );

        const prazo = lerPrazoSalvo(localStorage, chave);

        if (
          !Number.isFinite(
            prazo
          )
        ) {
          return;
        }

        const restante = calcularSegundosRestantes(prazo);

        setTempoRestante(
          restante
        );

        if (
          restante <= 0 &&
          !finalizandoPorTempo.current &&
          Date.now() - ultimaTentativaAutomatica.current >= 15000
        ) {
          finalizandoPorTempo.current =
            true;

          // Se a API falhar, o próximo ciclo poderá tentar novamente.
          ultimaTentativaAutomatica.current = Date.now();
          finalizarSimuladoRef.current?.(true);
        }
      }, 1000);

    const pausarAoFecharPagina = () => pausarCronometroNoEfeito(simuladoSelecionado);
    window.addEventListener('pagehide', pausarAoFecharPagina);

    return () => {
      clearTimeout(inicioCronometro);
      clearInterval(intervalo);
      window.removeEventListener('pagehide', pausarAoFecharPagina);
      pausarAoFecharPagina();
    };
  }, [
    simuladoSelecionado,
    resultadoFinal,
    questoes.length
  ]);

  async function carregarSimulados() {
    try {
      setCarregando(
        true
      );

      setErro('');

      const dados =
        await request(
          '/simulados',
          {},
          'Erro ao buscar simulados.'
        );

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

    let statusSalvos;

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
    simulado,
    { restaurando = false } = {}
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

      const dados =
        await request(
          `/simulados/${simulado.id}`,
          {},
          'Erro ao buscar o simulado.'
        );

      const listaQuestoes =
        Array.isArray(
          dados.questoes
        )
          ? dados.questoes
          : [];

      // Reutiliza o ID se a prova estava em andamento; gera outro ao refazer.
      prepararTentativa(simulado.id, simulado.status !== 'em-progresso');

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

          respostasAtuais.current = respostasSalvas;
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

        // O início não concede XP sem uma tentativa validada no servidor.
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

      if (!restaurando) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
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
  // CARREGAR SIMULADOS
  // ==========================================

  const carregarSimuladosNoEfeito = useEffectEvent(() => carregarSimulados());

  useEffect(() => {
    const iniciar = setTimeout(() => {
      void carregarHistoricoResultados();
      void carregarSimuladosNoEfeito();
    }, 0);
    return () => clearTimeout(iniciar);
  }, []);

  // ==========================================
  // ABRIR SIMULADO VINDO DO CONTEÚDO
  // ==========================================

  const abrirSimuladoNoEfeito = useEffectEvent((simulado) => abrirSimulado(simulado));

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
      queueMicrotask(() => setErro('O simulado solicitado não foi encontrado.'));

      return;
    }

    abrindoSimuladoPorParametro.current =
      true;

    // Abre no próximo microtask; não cancelar no cleanup, pois o parâmetro
    // já foi retirado da URL (inclusive durante remount em StrictMode).
    queueMicrotask(() => {
      void abrirSimuladoNoEfeito(simulado).finally(() => {
        abrindoSimuladoPorParametro.current = false;
      });
    });
  }, [
    carregando,
    simulados,
    simuladoSelecionado
  ]);

  // Restaura um simulado que estava aberto ao sair pela sidebar.
  // A abertura reutiliza o ID da tentativa e retoma o tempo pausado,
  // sem reiniciar respostas nem criar outra tentativa.
  const retomarSimuladoNoEfeito = useEffectEvent((simulado) =>
    abrirSimulado(simulado, { restaurando: true })
  );
  useEffect(() => {
    if (carregando || restauracaoTentada.current) return;
    restauracaoTentada.current = true;
    const visita = visitaInicial.current;
    const id = Number(visita?.simuladoId);
    const aberturaExterna = new URLSearchParams(window.location.search).has('simuladoId');
    if (!Number.isInteger(id) || id <= 0 || aberturaExterna) {
      restauracaoPendente.current = false;
      return;
    }
    const simulado = simulados.find((item) => Number(item.id) === id);
    if (!simulado) {
      restauracaoPendente.current = false;
      return;
    }

    if (visita.tela === 'resultado' && visita.resultadoFinal) {
      queueMicrotask(() => {
        setSimuladoSelecionado({ ...simulado, status: 'concluido' });
        setResultadoFinal(visita.resultadoFinal);
        setTempoGasto(visita.tempoGasto ?? null);
        setMostrarErros(Boolean(visita.mostrarErros));
        restauracaoPendente.current = false;
      });
    } else if (visita.tela === 'prova' && simulado.status === 'em-progresso') {
      void retomarSimuladoNoEfeito(simulado).finally(() => {
        restauracaoPendente.current = false;
      });
    } else {
      restauracaoPendente.current = false;
    }
  }, [carregando, simulados]);

  // Recupera a posição de leitura somente após o conteúdo ter sido montado.
  useEffect(() => {
    if (carregando || (visitaInicial.current?.simuladoId && !simuladoSelecionado && restauracaoPendente.current)) return;
    const posicao = rolagemPendente.current;
    if (typeof posicao !== 'number' || posicao <= 0) return;
    rolagemPendente.current = null;
    const quadro = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: posicao, behavior: 'instant' }));
    });
    return () => cancelAnimationFrame(quadro);
  }, [carregando, simuladoSelecionado, resultadoFinal]);

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

        respostasAtuais.current = novasRespostas;
        return novasRespostas;
      }
    );
  }

  // ==========================================
  // CORRIGIR NO SERVIDOR
  // ==========================================

  async function corrigirNoServidor() {
    const dados =
      await request(
        `/simulados/${simuladoSelecionado.id}/corrigir`,
        {
          method: 'POST',

          body: JSON.stringify({
            respostas: respostasAtuais.current,
            tentativaId: prepararTentativa(simuladoSelecionado.id)
          })
        },
        'Erro ao corrigir o simulado.'
      );

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
      id:
        dados.resultado.id,

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

      const resultado =
        await corrigirNoServidor();

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

      // O backend concede XP depois de persistir o resultado.
      await recarregarGamificacao('simulado concluído');

      // O resultado já foi persistido por /simulados/:id/corrigir.
      // Recarrega o histórico oficial, sem duplicar tentativas no localStorage.
      await carregarHistoricoResultados();

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
          resultado.detalhes
      });

      setMostrarErros(
        false
      );

      // ========================================
      // REMOVER RESPOSTAS SALVAS
      // ========================================
      const chaveTentativa = obterChaveTentativa(simuladoSelecionado.id);
      if (chaveTentativa) localStorage.removeItem(chaveTentativa);

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

    } finally {
      setSalvandoResultado(
        false
      );
    }
  }

  useEffect(() => {
    finalizarSimuladoRef.current = finalizarSimulado;
  });

  // ==========================================
  // REFAZER SIMULADO
  // ==========================================

  function refazerSimulado() {
    if (
      !simuladoSelecionado
    ) {
      return;
    }
    prepararTentativa(simuladoSelecionado.id, true);

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

    finalizandoPorTempo.current = false;

    // Pausa imediatamente ao clicar em voltar, antes mesmo do próximo render.
    if (simuladoSelecionado && !resultadoFinal) {
      pausarCronometro(simuladoSelecionado);
    }

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

  const simuladosVisiveis = filtrarPorMateria(simulados, filtro);

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
        erro={erro}
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
      historicoResultados={
        historicoResultados
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