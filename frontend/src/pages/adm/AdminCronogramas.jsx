import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import '../../styles/adm/AdminCronogramas.css';
import { API_URL } from '../../services/api.js';

const TOTAL_MESES = 12;
const TOTAL_SEMANAS = 4;
const DIAS_ESTUDO = Array.from({ length: 7 }, (_, index) => index + 1);

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('etecamp_token') ||
    ''
  );
}

function criarGradeVazia(quantidadeMeses = 0) {
  return Array.from({ length: quantidadeMeses }, (_, mesIndex) => ({
    mes: mesIndex + 1,
    semanas: Array.from({ length: TOTAL_SEMANAS }, (_, semanaIndex) => ({
      semana: semanaIndex + 1,
      itens: []
    }))
  }));
}

function preencherGrade(modelo) {
  const grade = criarGradeVazia(Number(modelo?.meses || 0));

  (modelo?.sessoes || []).forEach((item) => {
    const mes = grade[item.mes - 1];
    const semana = mes?.semanas[item.semana - 1];

    if (!semana) return;

    semana.itens.push({
      ordem: Number(item.sessao),
      materiaId: String(item.materia_id),
      topicoId: String(item.topico_id),
      diaEstudo: Number(item.dia_estudo || 1)
    });
  });

  grade.forEach((mes) => {
    mes.semanas.forEach((semana) => {
      semana.itens.sort((a, b) => a.ordem - b.ordem);
    });
  });

  return grade;
}

function contarItens(grade) {
  return grade.reduce(
    (total, mes) =>
      total +
      mes.semanas.reduce(
        (semanaTotal, semana) =>
          semanaTotal + semana.itens.length,
        0
      ),
    0
  );
}

function contarItensMes(grade, mesNumero) {
  const mes = grade[mesNumero - 1];

  if (!mes) return 0;

  return mes.semanas.reduce(
    (total, semana) =>
      total + semana.itens.length,
    0
  );
}

function contarSemanasPreenchidas(grade) {
  return grade.reduce(
    (total, mes) =>
      total +
      mes.semanas.filter(
        (semana) =>
          semana.itens.length > 0
      ).length,
    0
  );
}


// Seletor compartilhado pelos campos do cronograma: não depende do menu nativo do navegador.
function SeletorTenna({ value, options, onChange, placeholder = 'Selecione', searchable = false, ariaLabel }) {
  const [aberto, setAberto] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [abrirAcima, setAbrirAcima] = useState(false);
  const referencia = useRef(null);
  const buscaRef = useRef(null);

  const selecionada = options.find((opcao) => String(opcao.value) === String(value));
  const filtradas = options.filter((opcao) =>
    `${opcao.group || ''} ${opcao.label}`.toLocaleLowerCase('pt-BR')
      .includes(pesquisa.trim().toLocaleLowerCase('pt-BR'))
  );

  useEffect(() => {
    if (!aberto) return undefined;
    const fecharFora = (evento) => {
      if (!referencia.current?.contains(evento.target)) setAberto(false);
    };
    document.addEventListener('pointerdown', fecharFora);
    return () => document.removeEventListener('pointerdown', fecharFora);
  }, [aberto]);

  useEffect(() => {
    if (aberto && searchable) buscaRef.current?.focus();
  }, [aberto, searchable]);

  function alternar() {
    if (!aberto) {
      const posicao = referencia.current?.getBoundingClientRect();
      setAbrirAcima(Boolean(posicao && window.innerHeight - posicao.bottom < 310 && posicao.top > 310));
      setPesquisa('');
      setIndiceAtivo(Math.max(0, options.findIndex((opcao) => String(opcao.value) === String(value))));
    }
    setAberto(!aberto);
  }

  function selecionar(opcao) {
    onChange(String(opcao.value));
    setAberto(false);
    setPesquisa('');
  }

  function teclado(evento) {
    if (evento.key === 'Escape') {
      setAberto(false);
      return;
    }
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!aberto) { alternar(); return; }
      setIndiceAtivo((anterior) => Math.max(0, Math.min(filtradas.length - 1, anterior + (evento.key === 'ArrowDown' ? 1 : -1))));
    }
    if (evento.key === 'Enter' && aberto && filtradas[indiceAtivo]) {
      evento.preventDefault();
      selecionar(filtradas[indiceAtivo]);
    }
  }

  return (
    <div className={`cronograma-seletor ${aberto ? 'aberto' : ''}`} ref={referencia} onKeyDown={teclado}>
      <button
        type="button"
        className={`cronograma-seletor-trigger ${!selecionada ? 'placeholder' : ''}`}
        onClick={alternar}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span>{selecionada?.label || placeholder}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {aberto && (
        <div className={`cronograma-seletor-menu ${abrirAcima ? 'acima' : ''}`}>
          {searchable && (
            <div className="cronograma-seletor-busca">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input ref={buscaRef} value={pesquisa} type="search" placeholder="Buscar matéria ou conteúdo..."
                aria-label="Buscar matéria ou conteúdo"
                onChange={(evento) => { setPesquisa(evento.target.value); setIndiceAtivo(0); }} />
            </div>
          )}
          <div className="cronograma-seletor-opcoes" role="listbox" aria-label={ariaLabel}>
            {filtradas.length ? filtradas.map((opcao, indice) => (
              <button key={`${opcao.value}-${indice}`} type="button" role="option"
                aria-selected={String(opcao.value) === String(value)}
                className={`cronograma-seletor-opcao ${String(opcao.value) === String(value) ? 'selecionada' : ''} ${indice === indiceAtivo ? 'em-foco' : ''}`}
                onMouseEnter={() => setIndiceAtivo(indice)} onClick={() => selecionar(opcao)}>
                <span className="cronograma-seletor-opcao-texto">
                  {opcao.group && <small>{opcao.group}</small>}
                  <span>{opcao.label}</span>
                </span>
                {String(opcao.value) === String(value) && <span className="cronograma-seletor-check" aria-hidden="true">✓</span>}
              </button>
            )) : <p className="cronograma-seletor-sem-resultados">Nenhum conteúdo encontrado.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCronogramas() {
  const [cronograma, setCronograma] = useState(null);
  const [modelos, setModelos] = useState([]);
  const [frequenciaSelecionada, setFrequenciaSelecionada] = useState(0);

  const [materias, setMaterias] =
    useState([]);

  const [mesSelecionado, setMesSelecionado] =
    useState(1);

  const [mesesSelecionados, setMesesSelecionados] =
    useState(0);

  const [grade, setGrade] =
    useState(() =>
      criarGradeVazia()
    );

  const [formulario, setFormulario] =
    useState({
      nome: 'Cronograma de estudos',
      descricao:
        'Conteúdos organizados pelo administrador em meses e semanas.'
    });

  const [editandoId, setEditandoId] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState('');

  const [erro, setErro] =
    useState('');

  const [modalExclusao, setModalExclusao] =
    useState(false);
  const [mostrandoPrevia, setMostrandoPrevia] = useState(false);
  const [alterandoPublicacao, setAlterandoPublicacao] = useState(false);

  const opcoesConteudo =
    useMemo(
      () =>
        materias.flatMap(
          (materia) =>
            (materia.topicos || []).map(
              (topico) => ({
                materiaId:
                  String(materia.id),

                topicoId:
                  String(topico.id),

                materia:
                  materia.nome,

                topico:
                  topico.nome
              })
            )
        ),
      [materias]
    );

  const totalItens =
    contarItens(grade);

  const totalSemanas =
    mesesSelecionados *
    TOTAL_SEMANAS;

  const semanasPreenchidas =
    contarSemanasPreenchidas(
      grade
    );

  const mesAtual =
    grade[
      mesSelecionado - 1
    ];
  const alertasDistribuicao = useMemo(() => {
    const avisos = [];
    for (const mes of grade) for (const semana of mes.semanas) {
      const quantidade = Array.from({ length: frequenciaSelecionada }, (_, i) =>
        semana.itens.filter(item => Number(item.diaEstudo || 1) === i + 1).length);
      const sem = quantidade.filter(valor => !valor).length;
      if (sem) avisos.push(`Mês ${mes.mes}, semana ${semana.semana}: ${sem} ${sem === 1 ? 'dia sem conteúdo' : 'dias sem conteúdo'}.`);
      quantidade.forEach((total, indice) => {
        if (total > 2) avisos.push(`Mês ${mes.mes}, semana ${semana.semana}, dia ${indice + 1}: ${total * 45} minutos de estudo estimados.`);
      });
    }
    return avisos;
  }, [grade, frequenciaSelecionada]);

  async function carregarTudo() {
    setCarregando(true);
    setErro('');

    try {
      const [
        respostaCronograma,
        respostaMaterias
      ] = await Promise.all([
        fetch(
          `${API_URL}/cronogramas-modelos`,
          {
            headers: {
              Authorization:
                `Bearer ${getToken()}`
            }
          }
        ),

        fetch(
          `${API_URL}/conteudos/publico`,
          {
            headers: {
              Authorization:
                `Bearer ${getToken()}`
            }
          }
        )
      ]);

      const dadosCronograma =
        await respostaCronograma.json();

      const dadosMaterias =
        await respostaMaterias.json();

      if (
        !respostaCronograma.ok
      ) {
        throw new Error(
          dadosCronograma.mensagem ||
          'Não foi possível carregar o cronograma.'
        );
      }

      if (
        !respostaMaterias.ok
      ) {
        throw new Error(
          dadosMaterias.mensagem ||
          'Não foi possível carregar os conteúdos.'
        );
      }

      const todos = Array.isArray(dadosCronograma.cronogramas)
        ? dadosCronograma.cronogramas : [];
      setModelos(todos);
      const inicial = todos[0] || null;
      abrirVariacao(Number(inicial?.meses || 2), Number(inicial?.frequencia_dias || 3), todos, true);
      setMaterias(Array.isArray(dadosMaterias.materias) ? dadosMaterias.materias : []);
    } catch (error) {
      setErro(
        error.message ||
        'Não foi possível carregar a configuração do cronograma.'
      );
    } finally {
      setCarregando(false);
    }
  }

  const carregarTudoNoEfeito = useEffectEvent(() => carregarTudo());

  useEffect(() => {
    const iniciar = setTimeout(() => {
      void carregarTudoNoEfeito();
    }, 0);
    return () => clearTimeout(iniciar);
  }, []);

  function alterarDiaItem(
    mesNumero,
    semanaNumero,
    itemOrdem,
    diaEstudo
  ) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (
          mes.mes !==
          mesNumero
        ) {
          return mes;
        }

        return {
          ...mes,

          semanas:
            mes.semanas.map(
              (semana) => {
                if (
                  semana.semana !==
                  semanaNumero
                ) {
                  return semana;
                }

                return {
                  ...semana,

                  itens:
                    semana.itens.map(
                      (item) =>
                        item.ordem ===
                        itemOrdem
                          ? {
                              ...item,

                              diaEstudo:
                                Number(
                                  diaEstudo
                                ) || 1
                            }
                          : item
                    )
                };
              }
            )
        };
      })
    );
  }

  function alterarItem(
    mesNumero,
    semanaNumero,
    itemOrdem,
    topicoId
  ) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (
          mes.mes !==
          mesNumero
        ) {
          return mes;
        }

        return {
          ...mes,

          semanas:
            mes.semanas.map(
              (semana) => {
                if (
                  semana.semana !==
                  semanaNumero
                ) {
                  return semana;
                }

                return {
                  ...semana,

                  itens:
                    semana.itens.map(
                      (item) => {

                        if (
                          item.ordem !==
                          itemOrdem
                        ) {
                          return item;
                        }

                        const opcao =
                          opcoesConteudo.find(
                            (conteudo) =>
                              conteudo.topicoId ===
                              String(
                                topicoId
                              )
                          );

                        return {
                          ...item,

                          topicoId:
                            topicoId || '',

                          materiaId:
                            opcao?.materiaId ||
                            ''
                        };
                      }
                    )
                };
              }
            )
        };
      })
    );
  }

  function adicionarItem(
    mesNumero,
    semanaNumero
  ) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (
          mes.mes !==
          mesNumero
        ) {
          return mes;
        }

        return {
          ...mes,

          semanas:
            mes.semanas.map(
              (semana) => {

                if (
                  semana.semana !==
                  semanaNumero
                ) {
                  return semana;
                }

                const proximaOrdem =
                  semana.itens.length
                    ? Math.max(
                        ...semana.itens.map(
                          (item) =>
                            item.ordem
                        )
                      ) + 1
                    : 1;

                return {
                  ...semana,

                  itens: [
                    ...semana.itens,

                    {
                      ordem:
                        proximaOrdem,

                      materiaId:
                        '',

                      topicoId:
                        '',

                      diaEstudo:
                        1
                    }
                  ]
                };
              }
            )
        };
      })
    );
  }

  function removerItem(
    mesNumero,
    semanaNumero,
    itemOrdem
  ) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (
          mes.mes !==
          mesNumero
        ) {
          return mes;
        }

        return {
          ...mes,

          semanas:
            mes.semanas.map(
              (semana) => {

                if (
                  semana.semana !==
                  semanaNumero
                ) {
                  return semana;
                }

                const itens =
                  semana.itens
                    .filter(
                      (item) =>
                        item.ordem !==
                        itemOrdem
                    )
                    .map(
                      (item, index) => ({
                        ...item,
                        ordem:
                          index + 1
                      })
                    );

                return {
                  ...semana,
                  itens
                };
              }
            )
        };
      })
    );
  }

  function duplicarSemana(mesNumero, semanaNumero) {
    const indiceDestino = semanaNumero < 4 ? { mes: mesNumero, semana: semanaNumero + 1 }
      : { mes: mesNumero + 1, semana: 1 };
    const origem = grade[mesNumero - 1]?.semanas[semanaNumero - 1];
    const destino = grade[indiceDestino.mes - 1]?.semanas[indiceDestino.semana - 1];
    if (!origem?.itens.length || !destino) return;
    if (destino.itens.length && !window.confirm('A próxima semana já tem conteúdos. Deseja substituí-los pela cópia?')) return;
    setGrade(atual => atual.map(mes => mes.mes !== indiceDestino.mes ? mes : ({
      ...mes, semanas: mes.semanas.map(semana => semana.semana !== indiceDestino.semana ? semana : ({
        ...semana, itens: origem.itens.map((item, index) => ({ ...item, ordem: index + 1 }))
      }))
    })));
    setMensagem(`Semana ${semanaNumero} copiada para o mês ${indiceDestino.mes}, semana ${indiceDestino.semana}. Salve para confirmar.`);
  }

  async function alterarPublicacao(publicar) {
    if (!editandoId || alterandoPublicacao) return;
    const texto = publicar ? 'Publicar este modelo para os estudantes?' : 'Arquivar este modelo? Os planos individuais existentes serão mantidos.';
    if (!window.confirm(texto)) return;
    setAlterandoPublicacao(true);
    setErro(''); setMensagem('');
    try {
      const resposta = await fetch(`${API_URL}/cronogramas-modelos/${editandoId}/${publicar ? 'ativar' : 'arquivar'}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao alterar publicação.');
      setCronograma(dados.cronograma);
      setModelos(atuais => atuais.map(m => m.id === editandoId ? dados.cronograma : m));
      setMensagem(dados.mensagem);
    } catch (e) { setErro(e.message); }
    finally { setAlterandoPublicacao(false); }
  }

  function limparSemana(
    mesNumero,
    semanaNumero
  ) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (
          mes.mes !==
          mesNumero
        ) {
          return mes;
        }

        return {
          ...mes,

          semanas:
            mes.semanas.map(
              (semana) =>
                semana.semana ===
                semanaNumero
                  ? {
                      ...semana,
                      itens: []
                    }
                  : semana
            )
        };
      })
    );
  }

  function limparMes(
    mesNumero
  ) {
    setGrade((atual) =>
      atual.map((mes) =>
        mes.mes === mesNumero
          ? {
              ...mes,

              semanas:
                mes.semanas.map(
                  (semana) => ({
                    ...semana,
                    itens: []
                  })
                )
            }
          : mes
      )
    );
  }

  // Cada combinação meses + dias guarda seus próprios conteúdos.
  function abrirVariacao(meses, dias, lista = modelos, carregamentoInicial = false) {
    const quantidade = Number(meses) || 0;
    const frequencia = Number(dias) || 0;
    if (!carregamentoInicial && (quantidade !== mesesSelecionados || frequencia !== frequenciaSelecionada)) {
      const original = cronograma ? preencherGrade(cronograma) : criarGradeVazia(mesesSelecionados);
      const alterouGrade = JSON.stringify(grade) !== JSON.stringify(original);
      const alterouDados = formulario.nome !== (cronograma?.nome || `Cronograma · ${mesesSelecionados} ${mesesSelecionados === 1 ? 'mês' : 'meses'} · ${frequenciaSelecionada} ${frequenciaSelecionada === 1 ? 'dia' : 'dias'}`) ||
        formulario.descricao !== (cronograma?.descricao || 'Conteúdos definidos pelo administrador para esta combinação.');
      if ((alterouGrade || alterouDados) && !window.confirm('Existem alterações não salvas nesta programação. Deseja trocar de combinação e descartá-las?')) return;
    }
    const encontrado = lista.find((m) => Number(m.meses) === quantidade &&
      Number(m.frequencia_dias) === frequencia) || null;
    setMesesSelecionados(quantidade);
    setFrequenciaSelecionada(frequencia);
    setCronograma(encontrado);
    setEditandoId(encontrado?.id || null);
    setGrade(encontrado ? preencherGrade(encontrado) : criarGradeVazia(quantidade));
    setMesSelecionado(1);
    setFormulario({
      nome: encontrado?.nome || `Cronograma · ${quantidade} ${quantidade === 1 ? 'mês' : 'meses'} · ${frequencia} ${frequencia === 1 ? 'dia' : 'dias'}`,
      descricao: encontrado?.descricao || 'Conteúdos definidos pelo administrador para esta combinação.'
    });
    setErro('');
    setMensagem('');
  }

  async function salvarCronograma(
    event
  ) {
    event.preventDefault();

    setMensagem('');
    setErro('');

    if (
      !formulario.nome.trim()
    ) {
      setErro(
        'Informe um nome para o cronograma.'
      );

      return;
    }

    if (!mesesSelecionados || !frequenciaSelecionada) {
      setErro(
        'Selecione a quantidade de meses e de dias por semana.'
      );

      return;
    }

    if (!totalItens) {
      setErro(
        'Adicione pelo menos um conteúdo ao cronograma antes de salvar.'
      );

      return;
    }

    const sessoes =
      grade.flatMap(
        (mes) =>
          mes.semanas.flatMap(
            (semana) =>
              semana.itens
                .filter(
                  (item) =>
                    item.topicoId &&
                    item.materiaId
                )
                .map(
                  (item) => ({
                    mes:
                      mes.mes,

                    semana:
                      semana.semana,

                    sessao:
                      item.ordem,

                    diaEstudo:
                      Number(
                        item.diaEstudo ||
                        1
                      ),

                    materiaId:
                      Number(
                        item.materiaId
                      ),

                    topicoId:
                      Number(
                        item.topicoId
                      )
                  })
                )
          )
      );

    if (
      sessoes.length !==
      totalItens
    ) {
      setErro(
        'Revise os conteúdos adicionados. Todos os itens precisam ter um conteúdo selecionado.'
      );

      return;
    }

    const semanasSemConteudo =
      grade.flatMap(
        (mes) =>
          mes.semanas
            .filter(
              (semana) =>
                semana.itens
                  .length === 0
            )
            .map(
              (semana) =>
                `Mês ${mes.mes}, semana ${semana.semana}`
            )
      );

    if (
      semanasSemConteudo.length
    ) {
      const exibicao =
        semanasSemConteudo
          .slice(0, 3)
          .join('; ');

      const restante =
        semanasSemConteudo.length >
        3
          ? ` e mais ${semanasSemConteudo.length - 3}`
          : '';

      setErro(
        `Esta versão precisa de pelo menos um conteúdo por semana. Faltam ${exibicao}${restante}.`
      );

      return;
    }

    setSalvando(true);

    try {
      const url =
        editandoId
          ? `${API_URL}/cronogramas-modelos/${editandoId}`
          : `${API_URL}/cronogramas-modelos`;

      const resposta =
        await fetch(
          url,
          {
            method:
              editandoId
                ? 'PUT'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${getToken()}`
            },

            body:
              JSON.stringify({
                nome:
                  formulario.nome.trim(),

                descricao:
                  formulario.descricao.trim(),

                meses:
                  mesesSelecionados,

                frequenciaDias: frequenciaSelecionada,

                sessoes
              })
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          'Não foi possível salvar o cronograma.'
        );
      }

      setCronograma(dados.cronograma);
      setModelos((atuais) => [...atuais.filter((m) => m.id !== dados.cronograma.id), dados.cronograma]
        .sort((a, b) => (a.meses - b.meses) || (a.frequencia_dias - b.frequencia_dias)));

      setEditandoId(
        dados.cronograma.id
      );

      setMesesSelecionados(
        Number(
          dados.cronograma.meses ||
          mesesSelecionados
        )
      );

      setGrade(
        preencherGrade(
          dados.cronograma
        )
      );

      setMensagem(
        `Cronograma salvo ${dados.cronograma.ativo ? 'como revisão (publique as alterações para novos estudantes)' : 'como rascunho (publique para disponibilizar aos estudantes)'}. ${dados.cronograma.sessoes_preenchidas} conteúdos organizados em ${contarSemanasPreenchidas(
          preencherGrade(
            dados.cronograma
          )
        )} semanas.`
      );

    } catch (error) {

      setErro(
        error.message ||
        'Erro ao salvar o cronograma.'
      );

    } finally {

      setSalvando(false);

    }
  }

  async function excluirCronograma() {
    if (!editandoId) {
      return;
    }

    try {

      const resposta =
        await fetch(
          `${API_URL}/cronogramas-modelos/${editandoId}`,
          {
            method:
              'DELETE',

            headers: {
              Authorization:
                `Bearer ${getToken()}`
            }
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          'Não foi possível excluir o cronograma.'
        );
      }

      setCronograma(null);
      setModelos((atuais) => atuais.filter((m) => m.id !== editandoId));
      setEditandoId(null);

      setGrade(criarGradeVazia(mesesSelecionados));

      // Mantém a combinação escolhida para facilitar a criação de outra versão.
      setMesSelecionado(1);

      setMensagem(
        'Cronograma excluído.'
      );

    } catch (error) {

      setErro(
        error.message ||
        'Erro ao excluir o cronograma.'
      );

    } finally {

      setModalExclusao(
        false
      );

    }
  }

  if (carregando) {
    return (
      <main className="admin-cronogramas">
        <div className="admin-cronogramas-loading">
          Carregando cronograma...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-cronogramas">

      <header className="admin-cronogramas-header">

        <div>

          <h1>
            Cronogramas
          </h1>

          <p>
            Defina os conteúdos de cada combinação de meses e dias de estudo.
          </p>

        </div>

      </header>

      {(mensagem || erro) && (
        <div
          className={
            `cronograma-alerta ${
              erro
                ? 'erro'
                : 'sucesso'
            }`
          }
        >
          {erro || mensagem}
        </div>
      )}

      <form
        className="cronograma-layout"
        onSubmit={
          salvarCronograma
        }
      >

        <section
          className="cronograma-admin-card cronograma-resumo-card"
        >

          <div className="cronograma-card-header">

            <div>

              <span className="cronograma-section-kicker">
                ETAPA 01 · CONFIGURAÇÃO
              </span>

              <h2>
                {editandoId ? 'Editar programação' : 'Criar programação'}
              </h2>

              <p>
                Escolha a duração e a frequência para configurar o plano.
              </p>

            </div>

            {editandoId && (
              <span className="cronograma-status-chip">
                {cronograma?.ativo ? (Number(cronograma.versaoPublicada) < Number(cronograma.versao) ? 'Alterações não publicadas' : 'Publicado') : (cronograma?.versaoPublicada ? 'Arquivado' : 'Rascunho')}
              </span>
            )}

          </div>

          <div className={`tenna-variacoes-existentes ${modelos.length ? 'tem-modelos' : 'sem-modelos'}`}>
            <strong>Programações cadastradas</strong>
            <div className="tenna-variacoes-pills">
              {modelos.length ? modelos.map((m) => (
                <button key={m.id} type="button"
                  className={editandoId === m.id ? 'ativo' : ''}
                  onClick={() => abrirVariacao(m.meses, m.frequencia_dias)}>
                  {m.meses} {m.meses === 1 ? 'mês' : 'meses'} · {m.frequencia_dias} {m.frequencia_dias === 1 ? 'dia' : 'dias'} {m.ativo ? (Number(m.versao) > Number(m.versaoPublicada) ? '· revisão pendente' : '✓') : (m.versaoPublicada ? '· arquivado' : '· rascunho')}
                </button>
              )) : <span>Nenhuma programação cadastrada ainda.</span>}
            </div>
          </div>

          <div className="cronograma-resumo-grid">

            <label className="cronograma-form-group cronograma-campo-nome">

              <span>
                Nome do cronograma
              </span>

              <input
                value={
                  formulario.nome
                }
                onChange={
                  (event) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        nome:
                          event.target
                            .value
                      })
                    )
                }
                placeholder="Ex.: Cronograma para o Vestibulinho"
                maxLength={100}
              />

            </label>

            <div className="cronograma-form-group">

              <span>
                Duração do plano (meses)
              </span>

              <SeletorTenna
                value={mesesSelecionados || ''}
                onChange={(valor) => abrirVariacao(valor, frequenciaSelecionada)}
                placeholder="Selecione a duração"
                ariaLabel="Duração do plano em meses"
                options={Array.from({ length: TOTAL_MESES }, (_, index) => ({
                  value: index + 1,
                  label: `${index + 1} ${index === 0 ? 'mês' : 'meses'}`
                }))}
              />

            </div>

            <div className="cronograma-form-group">
              <span>Dias de estudo por semana</span>
              <SeletorTenna
                value={frequenciaSelecionada || ''}
                onChange={(valor) => abrirVariacao(mesesSelecionados, valor)}
                placeholder="Selecione os dias"
                ariaLabel="Dias de estudo por semana"
                options={DIAS_ESTUDO.map((dia) => ({
                  value: dia,
                  label: `${dia} ${dia === 1 ? 'dia' : 'dias'} por semana`
                }))}
              />
            </div>

            <label className="cronograma-form-group cronograma-campo-descricao">

              <span>
                Descrição
              </span>

              <textarea
                value={
                  formulario.descricao
                }
                onChange={
                  (event) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,

                        descricao:
                          event.target
                            .value
                      })
                    )
                }
                placeholder="Descrição opcional da programação"
                rows={2}
                maxLength={300}
              />

            </label>

          </div>

          <div className="tenna-variacao-resumo" role="status">
            <span className="tenna-variacao-status-dot" />
            {editandoId ? 'Programação cadastrada' : 'Programação ainda não cadastrada'}
            <strong>{totalItens} {totalItens === 1 ? 'conteúdo' : 'conteúdos'}</strong>
            <span>{semanasPreenchidas} de {totalSemanas} semanas preenchidas</span>
          </div>

        </section>

        <section
          className="cronograma-admin-card cronograma-periodo-card"
        >

          <div className="cronograma-card-header">

            <div>

              <span className="cronograma-section-kicker">
                ETAPA 02 · MESES
              </span>

              <h2>
                {mesesSelecionados && frequenciaSelecionada
                  ? `${mesesSelecionados} ${mesesSelecionados === 1 ? 'mês' : 'meses'} · ${frequenciaSelecionada} ${frequenciaSelecionada === 1 ? 'dia' : 'dias'}/semana`
                  : 'Selecione a duração e a frequência'}
              </h2>

              <p>
                {mesesSelecionados
                  ? 'Selecione o mês que deseja organizar.'
                  : 'Escolha a duração e os dias na etapa anterior.'}
              </p>

            </div>

            <button
              type="button"
              className="cronograma-btn secundario"
              onClick={() =>
                limparMes(
                  mesSelecionado
                )
              }
              disabled={
                !mesAtual ||
                !contarItensMes(
                  grade,
                  mesSelecionado
                )
              }
            >
              Limpar mês
            </button>

          </div>

          {mesesSelecionados ? (

            <div className="cronograma-meses-grid">

              {grade.map(
                (mes) => {

                  const quantidade =
                    contarItensMes(
                      grade,
                      mes.mes
                    );

                  return (
                    <button
                      key={mes.mes}
                      type="button"
                      className={
                        `cronograma-mes-card ${
                          mesSelecionado ===
                          mes.mes
                            ? 'selecionado'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setMesSelecionado(
                          mes.mes
                        )
                      }
                    >

                      <strong>
                        Mês {mes.mes}
                      </strong>

                      <span>
                        {quantidade}{' '}
                        {quantidade === 1
                          ? 'conteúdo'
                          : 'conteúdos'}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          ) : (

            <div className="cronograma-semana-vazia">

              <strong>
                Nenhum mês foi criado ainda.
              </strong>

              <span>
                Selecione a quantidade de meses e dias acima para criar a estrutura.
              </span>

            </div>

          )}

        </section>

        <section
          className="cronograma-admin-card cronograma-semanas-card"
        >

          <div className="cronograma-card-header">

            <div>

              <span className="cronograma-section-kicker">
                ETAPA 03 · MÊS {mesSelecionado}
              </span>

              <h2>
                Organização das semanas
              </h2>

              <p>
                Adicione os conteúdos de cada semana e escolha o dia de estudo.
              </p>

            </div>

            <span className="cronograma-item-count">
              {mesAtual
                ? `${contarItensMes(
                    grade,
                    mesSelecionado
                  )} conteúdos`
                : 'Selecione um mês'}
            </span>

          </div>

          {mesAtual ? (

            <div className="cronograma-semanas-stack">

              {mesAtual.semanas.map(
                (semana) => (

                  <article
                    className="cronograma-semana-block"
                    key={
                      semana.semana
                    }
                  >

                    <div className="cronograma-semana-top">

                      <div>

                        <span className="cronograma-section-kicker">
                          SEMANA {semana.semana}
                        </span>

                        <h3>
                          {semana.itens
                            .length
                            ? `${semana.itens.length} ${
                                semana.itens.length ===
                                1
                                  ? 'conteúdo definido'
                                  : 'conteúdos definidos'
                              }`
                            : 'Nenhum conteúdo definido'}
                        </h3>

                      </div>

                      <div className="cronograma-semana-actions">

                        <button
                          type="button"
                          className="cronograma-btn secundario small"
                          onClick={() =>
                            adicionarItem(
                              mesSelecionado,
                              semana.semana
                            )
                          }
                        >
                          + Adicionar conteúdo
                        </button>

                        <button type="button" className="cronograma-btn secundario small"
                          disabled={!semana.itens.length || (semana.semana === 4 && mesSelecionado === mesesSelecionados)}
                          onClick={() => duplicarSemana(mesSelecionado, semana.semana)}>
                          Copiar para próxima semana
                        </button>

                        <button
                          type="button"
                          className="cronograma-btn texto small"
                          onClick={() =>
                            limparSemana(
                              mesSelecionado,
                              semana.semana
                            )
                          }
                          disabled={
                            !semana.itens.length
                          }
                        >
                          Limpar
                        </button>

                      </div>

                    </div>

                    {semana.itens.length ? (

                      <div className="cronograma-itens-lista">

                        {semana.itens.map(
                          (item) => (

                            <div
                              className="cronograma-item-row"
                              key={
                                item.ordem
                              }
                            >

                              <span className="cronograma-item-numero">
                                {item.ordem}
                              </span>

                              <div className="cronograma-item-dia-wrap">
                                <span>Dia de estudo</span>
                                <SeletorTenna
                                  value={item.diaEstudo || 1}
                                  ariaLabel={`Dia de estudo do conteúdo ${item.ordem}`}
                                  onChange={(valor) => alterarDiaItem(mesSelecionado, semana.semana, item.ordem, valor)}
                                  options={DIAS_ESTUDO.filter((dia) => dia <= frequenciaSelecionada).map((dia) => ({
                                    value: dia, label: `Dia ${dia}`
                                  }))}
                                />
                              </div>

                              <div className="cronograma-item-select-wrap">
                                <span>Conteúdo da semana</span>
                                <SeletorTenna
                                  value={item.topicoId}
                                  ariaLabel={`Conteúdo da semana ${semana.semana}, item ${item.ordem}`}
                                  placeholder="Escolha a matéria e o conteúdo"
                                  searchable
                                  onChange={(valor) => alterarItem(mesSelecionado, semana.semana, item.ordem, valor)}
                                  options={opcoesConteudo.map((opcao) => ({
                                    value: opcao.topicoId,
                                    label: opcao.topico,
                                    group: opcao.materia
                                  }))}
                                />
                              </div>

                              <button
                                type="button"
                                className="cronograma-item-remover"
                                onClick={() =>
                                  removerItem(
                                    mesSelecionado,
                                    semana.semana,
                                    item.ordem
                                  )
                                }
                                aria-label="Remover conteúdo"
                                title="Remover conteúdo"
                              >
                                ×
                              </button>

                            </div>
                          )
                        )}

                      </div>

                    ) : (

                      <div className="cronograma-semana-vazia">

                        <strong>
                          Semana ainda não configurada
                        </strong>

                        <span>
                          Adicione os conteúdos que farão parte desta semana.
                        </span>

                        <button
                          type="button"
                          className="cronograma-btn principal small"
                          onClick={() =>
                            adicionarItem(
                              mesSelecionado,
                              semana.semana
                            )
                          }
                        >
                          Adicionar conteúdo
                        </button>

                      </div>

                    )}

                  </article>
                )
              )}

            </div>

          ) : (

            <div className="cronograma-semana-vazia">

              <strong>
                Selecione meses e dias por semana.
              </strong>

              <span>
                Depois, escolha um mês para cadastrar seus conteúdos por semana.
              </span>

            </div>

          )}

          {!!grade.length && <div className="tenna-admin-avisos" role="status">
            <strong>Verificação de distribuição</strong>
            <p>{totalItens} conteúdos · aproximadamente {totalItens * 45} minutos no plano · {alertasDistribuicao.length} avisos.</p>
            {alertasDistribuicao.length > 0 && <ul>{alertasDistribuicao.slice(0, 5).map((aviso, indice) => <li key={indice}>{aviso}</li>)}</ul>}
            {alertasDistribuicao.length > 5 && <small>Mais {alertasDistribuicao.length - 5} avisos nas outras semanas.</small>}
            <button className="cronograma-btn secundario small" type="button" onClick={() => setMostrandoPrevia(!mostrandoPrevia)}>
              {mostrandoPrevia ? 'Ocultar prévia' : 'Visualizar mês como estudante'}
            </button>
            {mostrandoPrevia && mesAtual && <div className="tenna-admin-previa">
              <strong>Prévia · Mês {mesSelecionado}</strong>
              {mesAtual.semanas.map((semana) => <div key={semana.semana}>
                <b>Semana {semana.semana}</b>
                {semana.itens.length ? semana.itens.map(item => {
                  const conteudo = opcoesConteudo.find(op => op.topicoId === String(item.topicoId));
                  return <p key={item.ordem}>Dia {item.diaEstudo || 1}: {conteudo?.materia || 'Matéria pendente'} — {conteudo?.topico || 'Selecione um conteúdo'} · 45 min</p>;
                }) : <p>Nenhum conteúdo programado.</p>}
              </div>)}
            </div>}
          </div>}

          <div className="cronograma-programacao-acoes">

          <button
            className="cronograma-btn principal grande"
            type="submit"
            disabled={
              salvando ||
              !mesesSelecionados || !frequenciaSelecionada
            }
          >
            {salvando
              ? 'Salvando...'
              : editandoId
                ? 'Salvar alterações'
                : 'Criar cronograma'}
          </button>

          </div>

        </section>

      </form>

      {cronograma && (

        <section
          className="cronograma-admin-card cronograma-configurado-card"
        >

          <div className="cronograma-card-header">

            <div>

              <span className="cronograma-section-kicker">
                CRONOGRAMA ATUAL
              </span>

              <h2>
                {cronograma.nome}
              </h2>

              <p>
                {cronograma.descricao ||
                  'Sem descrição cadastrada.'}
              </p>

            </div>

            <div className="cronograma-configurado-actions">

              <span>
                {
                  cronograma.sessoes_preenchidas
                }{' '}
                conteúdos
              </span>

              <button type="button" className="cronograma-btn principal small"
                disabled={alterandoPublicacao || salvando || (cronograma.ativo && Number(cronograma.versao) <= Number(cronograma.versaoPublicada))}
                onClick={() => alterarPublicacao(true)}>
                {cronograma.versaoPublicada ? 'Publicar alterações' : 'Publicar modelo'}
              </button>
              {cronograma.ativo && <button type="button" className="cronograma-btn secundario small"
                disabled={alterandoPublicacao || salvando} onClick={() => alterarPublicacao(false)}>Arquivar</button>}
              <button
                type="button"
                className="cronograma-btn perigo small"
                onClick={() =>
                  setModalExclusao(true)
                }
              >
                Excluir cronograma
              </button>

            </div>

          </div>

        </section>
      )}

      {modalExclusao && (

        <div
          className="cronograma-modal-backdrop"
          role="presentation"
          onMouseDown={() =>
            setModalExclusao(false)
          }
        >

          <div
            className="cronograma-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <span className="cronograma-section-kicker">
              EXCLUIR CRONOGRAMA
            </span>

            <h2>
              Excluir o cronograma atual?
            </h2>

            <p>
              Os conteúdos organizados nos meses e semanas do cronograma serão removidos da configuração do plano automático. Os conteúdos cadastrados na plataforma continuam intactos.
            </p>

            <div className="cronograma-modal-actions">

              <button
                className="cronograma-btn secundario"
                type="button"
                onClick={() =>
                  setModalExclusao(false)
                }
              >
                Cancelar
              </button>

              <button
                className="cronograma-btn perigo"
                type="button"
                onClick={
                  excluirCronograma
                }
              >
                Excluir cronograma
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}