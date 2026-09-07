import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

const MATERIAS = [
  'Português',
  'Matemática',
  'História',
  'Geografia',
  'Ciências'
];

const MIN_QUESTOES = 10;

const emptySimulado = {
  nome: '',
  limiteTempo: '',
  dificuldade: 'Média',
  materia: 'Português'
};

const emptyQuestao = {
  enunciado: '',
  a: '',
  b: '',
  c: '',
  d: '',
  e: '',
  correta: 'A'
};

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptySimulado);

  const [questoes, setQuestoes] = useState([]);

  const [showQuestaoModal, setShowQuestaoModal] = useState(false);
  const [questaoForm, setQuestaoForm] = useState(emptyQuestao);

  const [questaoEditando, setQuestaoEditando] = useState(null);

  const [simuladoEditando, setSimuladoEditando] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarSimulados();
  }, []);

  // =====================================================
  // CARREGAR SIMULADOS
  // =====================================================

  async function carregarSimulados() {
    try {
      setCarregando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/simulados`);

      if (!resposta.ok) {
        throw new Error('Erro ao carregar simulados.');
      }

      const dados = await resposta.json();

      setSimulados(dados.simulados || []);
    } catch (error) {
      console.error(error);

      setErro(
        'Não foi possível carregar os simulados. Verifique se o backend está rodando.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // ABRIR MODAL PARA CRIAR
  // =====================================================

  function openCreate() {
    setSimuladoEditando(null);

    setForm({
      ...emptySimulado
    });

    setQuestoes([]);

    setQuestaoForm({
      ...emptyQuestao
    });

    setQuestaoEditando(null);

    setErro('');
    setShowModal(true);
  }

  // =====================================================
  // ABRIR MODAL PARA EDITAR
  // =====================================================

  async function abrirEditar(simulado) {
    try {
      setCarregandoQuestoes(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/simulados/${simulado.id}`
      );

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar o simulado.');
      }

      const dados = await resposta.json();

      const dadosSimulado =
        dados.simulado || simulado;

      const listaQuestoes =
        dados.questoes || [];

      setSimuladoEditando(simulado.id);

      setForm({
        nome: dadosSimulado.titulo || '',
        limiteTempo:
          dadosSimulado.tempo_limite || '',
        dificuldade:
          dadosSimulado.dificuldade || 'Média',
        materia:
          dadosSimulado.materia || 'Português'
      });

      setQuestoes(
        listaQuestoes.map((questao) => ({
          id: questao.id,
          enunciado:
            questao.pergunta || '',
          a:
            questao.alternativa_a || '',
          b:
            questao.alternativa_b || '',
          c:
            questao.alternativa_c || '',
          d:
            questao.alternativa_d || '',
          e:
            questao.alternativa_e || '',
          correta:
            questao.correta || 'A'
        }))
      );

      setQuestaoForm({
        ...emptyQuestao
      });

      setQuestaoEditando(null);

      setShowModal(true);
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
        'Não foi possível abrir o simulado.'
      );

      alert(
        error.message ||
        'Não foi possível abrir o simulado.'
      );
    } finally {
      setCarregandoQuestoes(false);
    }
  }

  // =====================================================
  // ALTERAR FORMULÁRIO
  // =====================================================

  function alterarForm(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor
    }));
  }

  // =====================================================
  // ABRIR MODAL DE QUESTÃO
  // =====================================================

  function abrirCriarQuestao() {
    setQuestaoEditando(null);

    setQuestaoForm({
      ...emptyQuestao
    });

    setShowQuestaoModal(true);
  }

  // =====================================================
  // ABRIR QUESTÃO PARA EDIÇÃO
  // =====================================================

  function abrirEditarQuestao(index) {
    const questao = questoes[index];

    setQuestaoEditando(index);

    setQuestaoForm({
      ...questao
    });

    setShowQuestaoModal(true);
  }

  // =====================================================
  // ALTERAR QUESTÃO
  // =====================================================

  function alterarQuestao(campo, valor) {
    setQuestaoForm((prev) => ({
      ...prev,
      [campo]: valor
    }));
  }

  // =====================================================
  // SALVAR QUESTÃO NO FORMULÁRIO
  // =====================================================

  function handleAddQuestao(e) {
    e.preventDefault();

    if (
      !questaoForm.enunciado.trim() ||
      !questaoForm.a.trim() ||
      !questaoForm.b.trim() ||
      !questaoForm.c.trim() ||
      !questaoForm.d.trim() ||
      !questaoForm.e.trim() ||
      !questaoForm.correta
    ) {
      alert('Preencha todos os campos da questão.');
      return;
    }

    if (questaoEditando !== null) {
      setQuestoes((prev) =>
        prev.map((questao, index) =>
          index === questaoEditando
            ? {
                ...questaoForm,
                id: questao.id
              }
            : questao
        )
      );
    } else {
      setQuestoes((prev) => [
        ...prev,
        {
          ...questaoForm
        }
      ]);
    }

    setQuestaoForm({
      ...emptyQuestao
    });

    setQuestaoEditando(null);
    setShowQuestaoModal(false);
  }

  // =====================================================
  // REMOVER QUESTÃO DA LISTA
  // =====================================================

  function removerQuestao(index) {
    const confirmar = window.confirm(
      'Deseja realmente remover esta questão?'
    );

    if (!confirmar) {
      return;
    }

    setQuestoes((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  // =====================================================
  // EXCLUIR SIMULADO
  // =====================================================

  async function excluirSimulado() {
    if (!simuladoEditando) {
      return;
    }

    const confirmar = window.confirm(
      'Tem certeza que deseja excluir este simulado?\n\n' +
      'O simulado e os vínculos das questões serão excluídos permanentemente.'
    );

    if (!confirmar) {
      return;
    }

    try {
      setExcluindo(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/simulados/${simuladoEditando}`,
        {
          method: 'DELETE'
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.erro ||
          'Erro ao excluir o simulado.'
        );
      }

      alert(
        dados.mensagem ||
        'Simulado excluído com sucesso!'
      );

      setShowModal(false);

      setSimuladoEditando(null);

      setForm({
        ...emptySimulado
      });

      setQuestoes([]);

      setQuestaoForm({
        ...emptyQuestao
      });

      setQuestaoEditando(null);

      await carregarSimulados();

    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
        'Não foi possível excluir o simulado.'
      );

      alert(
        error.message ||
        'Não foi possível excluir o simulado.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  // =====================================================
  // VALIDAR SIMULADO
  // =====================================================

  function validarSimulado() {
    if (!form.nome.trim()) {
      alert('Preencha o nome do simulado.');
      return false;
    }

    if (
      form.limiteTempo === '' ||
      Number(form.limiteTempo) <= 0
    ) {
      alert('Informe um limite de tempo válido.');
      return false;
    }

    if (!form.materia) {
      alert('Selecione uma matéria.');
      return false;
    }

    if (!form.dificuldade) {
      alert('Selecione uma dificuldade.');
      return false;
    }

    if (questoes.length < MIN_QUESTOES) {
      alert(
        `É necessário adicionar no mínimo ${MIN_QUESTOES} questões.`
      );
      return false;
    }

    return true;
  }

  // =====================================================
  // CRIAR NOVO SIMULADO
  // =====================================================

  async function criarSimulado() {
    const respostaSimulado = await fetch(
      `${API_URL}/simulados`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: form.nome.trim(),
          descricao: '',
          tempoLimite: Number(form.limiteTempo),
          quantidadeQuestoes: questoes.length,
          materia: form.materia,
          dificuldade: form.dificuldade,
          ativo: 1
        })
      }
    );

    const dadosSimulado =
      await respostaSimulado.json();

    if (!respostaSimulado.ok) {
      throw new Error(
        dadosSimulado.mensagem ||
        dadosSimulado.erro ||
        'Erro ao cadastrar simulado.'
      );
    }

    const simuladoCriado =
      dadosSimulado.simulado ||
      dadosSimulado;

    const simuladoId =
      simuladoCriado.id ||
      dadosSimulado.id;

    if (!simuladoId) {
      throw new Error(
        'O backend não retornou o ID do simulado.'
      );
    }

    // Criar questões
    for (let i = 0; i < questoes.length; i++) {
      const questao = questoes[i];

      const respostaQuestao = await fetch(
        `${API_URL}/questoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pergunta:
              questao.enunciado.trim(),

            alternativaA:
              questao.a.trim(),

            alternativaB:
              questao.b.trim(),

            alternativaC:
              questao.c.trim(),

            alternativaD:
              questao.d.trim(),

            alternativaE:
              questao.e.trim(),

            correta:
              questao.correta,

            materia:
              form.materia
          })
        }
      );

      const dadosQuestao =
        await respostaQuestao.json();

      if (!respostaQuestao.ok) {
        throw new Error(
          dadosQuestao.mensagem ||
          dadosQuestao.erro ||
          `Erro ao cadastrar a questão ${i + 1}.`
        );
      }

      const questaoCriada =
        dadosQuestao.questao ||
        dadosQuestao;

      const questaoId =
        questaoCriada.id ||
        dadosQuestao.id;

      if (!questaoId) {
        throw new Error(
          `O backend não retornou o ID da questão ${i + 1}.`
        );
      }

      // Vincular questão
      const respostaVinculo = await fetch(
        `${API_URL}/simulados/${simuladoId}/questoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questaoId: questaoId,
            ordem: i + 1
          })
        }
      );

      const dadosVinculo =
        await respostaVinculo.json();

      if (!respostaVinculo.ok) {
        throw new Error(
          dadosVinculo.mensagem ||
          dadosVinculo.erro ||
          `Erro ao vincular a questão ${i + 1}.`
        );
      }
    }
  }

  // =====================================================
  // EDITAR SIMULADO
  // =====================================================

  async function editarSimulado() {
    const simuladoId = simuladoEditando;

    if (!simuladoId) {
      throw new Error(
        'ID do simulado não encontrado.'
      );
    }

    // Atualizar informações do simulado
    const respostaSimulado = await fetch(
      `${API_URL}/simulados/${simuladoId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: form.nome.trim(),
          descricao: '',
          tempoLimite: Number(form.limiteTempo),
          quantidadeQuestoes: questoes.length,
          materia: form.materia,
          dificuldade: form.dificuldade,
          ativo: 1
        })
      }
    );

    const dadosSimulado =
      await respostaSimulado.json();

    if (!respostaSimulado.ok) {
      throw new Error(
        dadosSimulado.mensagem ||
        dadosSimulado.erro ||
        'Erro ao atualizar o simulado.'
      );
    }

    // Processar questões
    for (let i = 0; i < questoes.length; i++) {
      const questao = questoes[i];

      // Questão que já existe
      if (questao.id) {
        const respostaQuestao =
          await fetch(
            `${API_URL}/questoes/${questao.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                pergunta:
                  questao.enunciado.trim(),

                alternativaA:
                  questao.a.trim(),

                alternativaB:
                  questao.b.trim(),

                alternativaC:
                  questao.c.trim(),

                alternativaD:
                  questao.d.trim(),

                alternativaE:
                  questao.e.trim(),

                correta:
                  questao.correta,

                materia:
                  form.materia
              })
            }
          );

        const dadosQuestao =
          await respostaQuestao.json();

        if (!respostaQuestao.ok) {
          throw new Error(
            dadosQuestao.mensagem ||
            dadosQuestao.erro ||
            `Erro ao atualizar a questão ${i + 1}.`
          );
        }

        // Atualizar ordem
        const respostaOrdem =
          await fetch(
            `${API_URL}/simulados/${simuladoId}/questoes/${questao.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ordem: i + 1
              })
            }
          );

        if (!respostaOrdem.ok) {
          const dadosOrdem =
            await respostaOrdem.json();

          throw new Error(
            dadosOrdem.mensagem ||
            'Erro ao atualizar a ordem da questão.'
          );
        }
      }

      // Questão nova adicionada durante edição
      else {
        const respostaQuestao =
          await fetch(
            `${API_URL}/questoes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                pergunta:
                  questao.enunciado.trim(),

                alternativaA:
                  questao.a.trim(),

                alternativaB:
                  questao.b.trim(),

                alternativaC:
                  questao.c.trim(),

                alternativaD:
                  questao.d.trim(),

                alternativaE:
                  questao.e.trim(),

                correta:
                  questao.correta,

                materia:
                  form.materia
              })
            }
          );

        const dadosQuestao =
          await respostaQuestao.json();

        if (!respostaQuestao.ok) {
          throw new Error(
            dadosQuestao.mensagem ||
            dadosQuestao.erro ||
            `Erro ao cadastrar a questão ${i + 1}.`
          );
        }

        const questaoCriada =
          dadosQuestao.questao ||
          dadosQuestao;

        const questaoId =
          questaoCriada.id ||
          dadosQuestao.id;

        if (!questaoId) {
          throw new Error(
            `O backend não retornou o ID da questão ${i + 1}.`
          );
        }

        const respostaVinculo =
          await fetch(
            `${API_URL}/simulados/${simuladoId}/questoes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                questaoId: questaoId,
                ordem: i + 1
              })
            }
          );

        const dadosVinculo =
          await respostaVinculo.json();

        if (!respostaVinculo.ok) {
          throw new Error(
            dadosVinculo.mensagem ||
            dadosVinculo.erro ||
            `Erro ao vincular a questão ${i + 1}.`
          );
        }
      }
    }
  }

  // =====================================================
  // POSTAR / SALVAR
  // =====================================================

  async function handlePostar(e) {
    e.preventDefault();

    if (!validarSimulado()) {
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      if (simuladoEditando) {
        await editarSimulado();

        alert(
          'Simulado atualizado com sucesso!'
        );
      } else {
        await criarSimulado();

        alert(
          'Simulado cadastrado com sucesso!'
        );
      }

      setShowModal(false);

      setSimuladoEditando(null);

      setForm({
        ...emptySimulado
      });

      setQuestoes([]);

      await carregarSimulados();

    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
        'Não foi possível salvar o simulado.'
      );

      alert(
        error.message ||
        'Não foi possível salvar o simulado.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      <div className="page-header">
        <h1>Simulados</h1>
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

      <div className="admin-list">
        {carregando ? (
          <div className="stat-card">
            Carregando simulados...
          </div>
        ) : simulados.length === 0 ? (
          <div className="stat-card">
            <h2>
              Nenhum simulado cadastrado.
            </h2>

            <p>
              Clique no botão + para criar o
              primeiro simulado.
            </p>
          </div>
        ) : (
          simulados.map((s) => (
            <div
              className="admin-list-item"
              key={s.id}
            >
              <div>
                <strong>
                  {s.titulo}
                </strong>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '14px',
                    opacity: 0.7
                  }}
                >
                  {s.materia || 'Sem matéria'} •{' '}
                  {s.dificuldade || 'Média'} •{' '}
                  {s.quantidade_questoes || 0}{' '}
                  questões •{' '}
                  {s.tempo_limite || 0} minutos
                </div>
              </div>

              <button
                className="admin-edit-btn"
                type="button"
                onClick={() =>
                  abrirEditar(s)
                }
                disabled={
                  carregandoQuestoes ||
                  salvando ||
                  excluindo
                }
              >
                Editar
              </button>
            </div>
          ))
        )}
      </div>

      <button
        className="fab-add"
        onClick={openCreate}
        aria-label="Criar simulado"
        type="button"
      >
        +
      </button>

      {/* =================================================
          MODAL DO SIMULADO
      ================================================= */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!salvando && !excluindo) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <h2>
                {simuladoEditando
                  ? 'Editar Simulado'
                  : 'Criar Simulado'}
              </h2>
            </div>

            <form onSubmit={handlePostar}>
              <div className="modal-two-col">
                <div>
                  <div className="modal-input-group">
                    <label>
                      Nome do Simulado
                    </label>

                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) =>
                        alterarForm(
                          'nome',
                          e.target.value
                        )
                      }
                      autoFocus
                      disabled={
                        salvando ||
                        excluindo
                      }
                    />
                  </div>

                  <div className="modal-input-group">
                    <label>
                      Limite de tempo
                    </label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 60"
                      value={
                        form.limiteTempo
                      }
                      onChange={(e) =>
                        alterarForm(
                          'limiteTempo',
                          e.target.value
                        )
                      }
                      disabled={
                        salvando ||
                        excluindo
                      }
                    />

                    <small>
                      Informe o tempo em minutos.
                    </small>
                  </div>

                  <div className="modal-input-group">
                    <label>
                      Dificuldade
                    </label>

                    <select
                      value={
                        form.dificuldade
                      }
                      onChange={(e) =>
                        alterarForm(
                          'dificuldade',
                          e.target.value
                        )
                      }
                      disabled={
                        salvando ||
                        excluindo
                      }
                    >
                      <option value="Fácil">
                        Fácil
                      </option>

                      <option value="Média">
                        Média
                      </option>

                      <option value="Difícil">
                        Difícil
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="modal-materia-label">
                    Matéria
                  </span>

                  <div className="modal-materia-list">
                    {MATERIAS.map((m) => (
                      <button
                        type="button"
                        key={m}
                        className={`materia-pill ${
                          form.materia === m
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          alterarForm(
                            'materia',
                            m
                          )
                        }
                        disabled={
                          salvando ||
                          excluindo
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px'
                }}
              >
                <button
                  type="button"
                  className="mural-btn secondary"
                  onClick={
                    abrirCriarQuestao
                  }
                  disabled={
                    salvando ||
                    excluindo
                  }
                >
                  + Criar Questão
                </button>
              </div>

              <div
                style={{
                  marginTop: '15px'
                }}
              >
                <span
                  className={`question-count-badge ${
                    questoes.length <
                    MIN_QUESTOES
                      ? 'incomplete'
                      : ''
                  }`}
                >
                  {questoes.length} questão(ões)
                  adicionada(s)
                </span>

                <p className="modal-note">
                  É necessário no mínimo{' '}
                  {MIN_QUESTOES} questões para
                  postar um simulado.
                </p>
              </div>

              {questoes.length > 0 && (
                <div
                  style={{
                    marginTop: '15px',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}
                >
                  {questoes.map(
                    (questao, index) => (
                      <div
                        key={
                          questao.id ||
                          `nova-${index}`
                        }
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap: '10px',
                          padding: '10px',
                          marginBottom: '8px',
                          border:
                            '1px solid #ddd',
                          borderRadius: '8px'
                        }}
                      >
                        <span>
                          Questão {index + 1}{' '}
                          — correta:{' '}
                          {questao.correta}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            gap: '8px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              abrirEditarQuestao(
                                index
                              )
                            }
                            disabled={
                              salvando ||
                              excluindo
                            }
                            style={{
                              border:
                                'none',
                              background:
                                'transparent',
                              cursor:
                                'pointer',
                              color:
                                '#2563eb'
                            }}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removerQuestao(
                                index
                              )
                            }
                            disabled={
                              salvando ||
                              excluindo
                            }
                            style={{
                              border:
                                'none',
                              background:
                                'transparent',
                              cursor:
                                'pointer',
                              color:
                                '#dc2626'
                            }}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div
                className="modal-actions"
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent:
                    'space-between'
                }}
              >
                <div>
                  {simuladoEditando && (
                    <button
                      type="button"
                      className="mural-btn"
                      onClick={
                        excluirSimulado
                      }
                      disabled={
                        salvando ||
                        excluindo
                      }
                      style={{
                        background:
                          '#dc2626',
                        color: '#fff'
                      }}
                    >
                      {excluindo
                        ? 'Excluindo...'
                        : 'Excluir Simulado'}
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px'
                  }}
                >
                  <button
                    type="button"
                    className="mural-btn ghost"
                    disabled={
                      salvando ||
                      excluindo
                    }
                    onClick={() =>
                      setShowModal(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="mural-btn primary"
                    disabled={
                      salvando ||
                      excluindo ||
                      questoes.length <
                        MIN_QUESTOES
                    }
                  >
                    {salvando
                      ? 'Salvando...'
                      : simuladoEditando
                      ? 'Salvar alterações'
                      : 'Postar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL DA QUESTÃO
      ================================================= */}

      {showQuestaoModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowQuestaoModal(false)
          }
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <h2>
                {questaoEditando !== null
                  ? 'Editar Questão'
                  : 'Criar Questão'}
              </h2>
            </div>

            <form
              onSubmit={handleAddQuestao}
            >
              <div className="modal-scroll">
                <div className="modal-input-group">
                  <label>
                    Enunciado
                  </label>

                  <textarea
                    className="modal-textarea"
                    style={{
                      height: '90px'
                    }}
                    value={
                      questaoForm.enunciado
                    }
                    onChange={(e) =>
                      alterarQuestao(
                        'enunciado',
                        e.target.value
                      )
                    }
                    autoFocus
                  />
                </div>

                {[
                  ['A', 'a'],
                  ['B', 'b'],
                  ['C', 'c'],
                  ['D', 'd'],
                  ['E', 'e']
                ].map(
                  ([letra, campo]) => (
                    <div
                      className="modal-input-group"
                      key={campo}
                    >
                      <label>
                        Alternativa {letra}
                      </label>

                      <input
                        type="text"
                        value={
                          questaoForm[campo]
                        }
                        onChange={(e) =>
                          alterarQuestao(
                            campo,
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )
                )}

                <div className="modal-input-group">
                  <label>
                    Alternativa correta
                  </label>

                  <select
                    value={
                      questaoForm.correta
                    }
                    onChange={(e) =>
                      alterarQuestao(
                        'correta',
                        e.target.value
                      )
                    }
                  >
                    <option value="A">
                      A
                    </option>

                    <option value="B">
                      B
                    </option>

                    <option value="C">
                      C
                    </option>

                    <option value="D">
                      D
                    </option>

                    <option value="E">
                      E
                    </option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() => {
                    setShowQuestaoModal(
                      false
                    );
                    setQuestaoEditando(
                      null
                    );
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="mural-btn primary"
                >
                  {questaoEditando !== null
                    ? 'Salvar questão'
                    : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}