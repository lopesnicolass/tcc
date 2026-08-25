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
  materia: MATERIAS[0]
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

  const [carregando, setCarregando] = useState(true);

  const [postando, setPostando] = useState(false);

  const [erro, setErro] = useState('');

  const [mensagem, setMensagem] = useState('');


  // =====================================================
  // CARREGAR SIMULADOS DO BANCO
  // =====================================================

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
  // ABRIR MODAL
  // =====================================================

  function openCreate() {

    setForm({
      ...emptySimulado
    });

    setQuestoes([]);

    setQuestaoForm({
      ...emptyQuestao
    });

    setErro('');

    setMensagem('');

    setShowModal(true);
  }


  // =====================================================
  // ADICIONAR QUESTÃO TEMPORARIAMENTE
  // =====================================================

  function handleAddQuestao(e) {

    e.preventDefault();

    if (!questaoForm.enunciado.trim()) {

      alert('Digite o enunciado da questão.');

      return;
    }

    if (
      !questaoForm.a.trim() ||
      !questaoForm.b.trim() ||
      !questaoForm.c.trim() ||
      !questaoForm.d.trim() ||
      !questaoForm.e.trim()
    ) {

      alert('Preencha todas as alternativas.');

      return;
    }


    setQuestoes((prev) => [

      ...prev,

      {
        ...questaoForm,
        materia: form.materia
      }

    ]);


    setQuestaoForm({
      ...emptyQuestao
    });

    setShowQuestaoModal(false);
  }


  // =====================================================
  // POSTAR SIMULADO
  // =====================================================

  async function handlePostar(e) {

    e.preventDefault();

    setErro('');
    setMensagem('');


    // ============================
    // VALIDAÇÕES
    // ============================

    if (!form.nome.trim()) {

      alert('Digite o nome do simulado.');

      return;
    }


    const tempo = Number(
      String(form.limiteTempo)
        .replace(/\D/g, '')
    );


    if (!tempo || tempo <= 0) {

      alert('Digite um tempo válido. Exemplo: 60');

      return;
    }


    if (questoes.length < MIN_QUESTOES) {

      alert(
        `É necessário adicionar pelo menos ${MIN_QUESTOES} questões.`
      );

      return;
    }


    try {

      setPostando(true);


      // =================================================
      // 1. CRIAR SIMULADO
      // =================================================

      const respostaSimulado = await fetch(
        `${API_URL}/simulados`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            titulo: form.nome,

            descricao: `Simulado de ${form.materia}`,

            materia: form.materia,

            dificuldade: form.dificuldade,

            tempoLimite: tempo,

            quantidadeQuestoes: questoes.length

          })

        }
      );


      const dadosSimulado =
        await respostaSimulado.json();


      if (!respostaSimulado.ok) {

        throw new Error(
          dadosSimulado.mensagem ||
          'Erro ao criar simulado.'
        );

      }


      const simuladoId =
        dadosSimulado.simuladoId;


      // =================================================
      // 2. CRIAR QUESTÕES
      // =================================================

      for (
        let index = 0;
        index < questoes.length;
        index++
      ) {

        const questao = questoes[index];


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
                  questao.enunciado,

                alternativa_a:
                  questao.a,

                alternativa_b:
                  questao.b,

                alternativa_c:
                  questao.c,

                alternativa_d:
                  questao.d,

                alternativa_e:
                  questao.e,

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
            `Erro ao criar a questão ${index + 1}.`
          );

        }


        // ===============================================
        // 3. VINCULAR QUESTÃO AO SIMULADO
        // ===============================================

        const questaoId =
          dadosQuestao.questaoId ||
          dadosQuestao.id;


        if (!questaoId) {

          throw new Error(
            `A questão ${index + 1} foi criada, mas o backend não retornou o ID.`
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

                questaoId,

                ordem: index + 1

              })

            }
          );


        const dadosVinculo =
          await respostaVinculo.json();


        if (!respostaVinculo.ok) {

          throw new Error(
            dadosVinculo.mensagem ||
            `Erro ao vincular a questão ${index + 1}.`
          );

        }

      }


      // =================================================
      // 4. ATUALIZAR LISTA
      // =================================================

      await carregarSimulados();


      setMensagem(
        'Simulado publicado com sucesso!'
      );


      setForm({
        ...emptySimulado
      });

      setQuestoes([]);

      setShowModal(false);


    } catch (error) {

      console.error(error);

      setErro(
        error.message ||
        'Erro ao publicar simulado.'
      );

      alert(
        error.message ||
        'Erro ao publicar simulado.'
      );

    } finally {

      setPostando(false);

    }
  }


  // =====================================================
  // EXCLUIR / FECHAR MODAL
  // =====================================================

  function fecharModal() {

    if (postando) {
      return;
    }

    setShowModal(false);

    setQuestaoForm({
      ...emptyQuestao
    });

  }


  return (

    <div>

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="page-header">

        <h1>
          Simulados
        </h1>

      </div>


      {/* =================================================
          ERRO
      ================================================= */}

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


      {/* =================================================
          MENSAGEM
      ================================================= */}

      {mensagem && (

        <div
          className="stat-card"
          style={{
            marginBottom: '20px'
          }}
        >

          <p>
            {mensagem}
          </p>

        </div>

      )}


      {/* =================================================
          LISTA
      ================================================= */}

      {carregando ? (

        <div className="stat-card">

          <h2>
            Carregando simulados...
          </h2>

        </div>

      ) : simulados.length === 0 ? (

        <div className="stat-card">

          <h2>
            Nenhum simulado cadastrado.
          </h2>

          <p>
            Clique no botão + para criar o primeiro simulado.
          </p>

        </div>

      ) : (

        <div className="admin-list">

          {simulados.map((simulado) => (

            <div
              className="admin-list-item"
              key={simulado.id}
            >

              <div>

                <strong>
                  {simulado.titulo}
                </strong>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '14px'
                  }}
                >

                  {simulado.materia}

                  {' • '}

                  {simulado.dificuldade}

                  {' • '}

                  {simulado.quantidade_questoes} questões

                  {' • '}

                  {simulado.tempo_limite} min

                </div>

              </div>


              <button
                className="admin-edit-btn"
                type="button"
              >
                Editar
              </button>

            </div>

          ))}

        </div>

      )}


      {/* =================================================
          BOTÃO +
      ================================================= */}

      <button
        className="fab-add"
        onClick={openCreate}
        aria-label="Criar simulado"
      >
        +
      </button>


      {/* =================================================
          MODAL DO SIMULADO
      ================================================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={fecharModal}
        >

          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <h2>
                Criar Simulado
              </h2>

            </div>


            <form onSubmit={handlePostar}>

              <div className="modal-two-col">

                {/* ======================================
                    INFORMAÇÕES
                ====================================== */}

                <div>

                  <div className="modal-input-group">

                    <label>
                      Nome do Simulado
                    </label>

                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nome: e.target.value
                        })
                      }
                      autoFocus
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
                      value={form.limiteTempo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          limiteTempo: e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="modal-input-group">

                    <label>
                      Dificuldade
                    </label>

                    <select
                      value={form.dificuldade}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dificuldade: e.target.value
                        })
                      }
                    >

                      <option>
                        Fácil
                      </option>

                      <option>
                        Média
                      </option>

                      <option>
                        Difícil
                      </option>

                    </select>

                  </div>

                </div>


                {/* ======================================
                    MATÉRIA
                ====================================== */}

                <div>

                  <span className="modal-materia-label">
                    Matéria
                  </span>


                  <div className="modal-materia-list">

                    {MATERIAS.map((materia) => (

                      <button
                        type="button"
                        key={materia}
                        className={`materia-pill ${
                          form.materia === materia
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          setForm({
                            ...form,
                            materia
                          })
                        }
                      >

                        {materia}

                      </button>

                    ))}

                  </div>

                </div>

              </div>


              {/* =================================================
                  CRIAR QUESTÃO
              ================================================= */}

              <button
                type="button"
                className="mural-btn secondary"
                onClick={() =>
                  setShowQuestaoModal(true)
                }
              >
                Criar Questão
              </button>


              {/* =================================================
                  QUESTÕES ADICIONADAS
              ================================================= */}

              <div
                style={{
                  marginTop: '15px'
                }}
              >

                <span
                  className={`question-count-badge ${
                    questoes.length < MIN_QUESTOES
                      ? 'incomplete'
                      : ''
                  }`}
                >

                  {questoes.length}

                  {' '}

                  questão(ões) adicionada(s)

                </span>


                <p className="modal-note">

                  É necessário no mínimo{' '}

                  {MIN_QUESTOES}

                  {' '}

                  questões para postar um simulado.

                </p>

              </div>


              {/* =================================================
                  LISTA DAS QUESTÕES
              ================================================= */}

              {questoes.length > 0 && (

                <div
                  style={{
                    marginTop: '15px',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >

                  {questoes.map(
                    (questao, index) => (

                      <div
                        key={index}
                        style={{
                          padding: '10px',
                          marginBottom: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '8px'
                        }}
                      >

                        <strong>
                          Questão {index + 1}
                        </strong>

                        <div
                          style={{
                            marginTop: '4px',
                            fontSize: '14px'
                          }}
                        >

                          {questao.enunciado}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}


              {/* =================================================
                  BOTÕES
              ================================================= */}

              <div
                className="modal-actions"
                style={{
                  marginTop: '20px'
                }}
              >

                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={fecharModal}
                  disabled={postando}
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="mural-btn primary"
                  disabled={
                    postando ||
                    questoes.length < MIN_QUESTOES
                  }
                >

                  {postando
                    ? 'Publicando...'
                    : 'Postar'}

                </button>

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
                Criar Questão
              </h2>

            </div>


            <form onSubmit={handleAddQuestao}>

              <div className="modal-scroll">

                {/* ======================================
                    ENUNCIADO
                ====================================== */}

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
                      setQuestaoForm({
                        ...questaoForm,
                        enunciado:
                          e.target.value
                      })
                    }
                    autoFocus
                  />

                </div>


                {/* ======================================
                    ALTERNATIVAS
                ====================================== */}

                <div className="modal-input-group">

                  <label>
                    Alternativa A
                  </label>

                  <input
                    type="text"
                    value={questaoForm.a}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        a: e.target.value
                      })
                    }
                  />

                </div>


                <div className="modal-input-group">

                  <label>
                    Alternativa B
                  </label>

                  <input
                    type="text"
                    value={questaoForm.b}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        b: e.target.value
                      })
                    }
                  />

                </div>


                <div className="modal-input-group">

                  <label>
                    Alternativa C
                  </label>

                  <input
                    type="text"
                    value={questaoForm.c}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        c: e.target.value
                      })
                    }
                  />

                </div>


                <div className="modal-input-group">

                  <label>
                    Alternativa D
                  </label>

                  <input
                    type="text"
                    value={questaoForm.d}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        d: e.target.value
                      })
                    }
                  />

                </div>


                <div className="modal-input-group">

                  <label>
                    Alternativa E
                  </label>

                  <input
                    type="text"
                    value={questaoForm.e}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        e: e.target.value
                      })
                    }
                  />

                </div>


                {/* ======================================
                    RESPOSTA CORRETA
                ====================================== */}

                <div className="modal-input-group">

                  <label>
                    Resposta correta
                  </label>

                  <select
                    value={questaoForm.correta}
                    onChange={(e) =>
                      setQuestaoForm({
                        ...questaoForm,
                        correta:
                          e.target.value
                      })
                    }
                  >

                    <option value="A">
                      Alternativa A
                    </option>

                    <option value="B">
                      Alternativa B
                    </option>

                    <option value="C">
                      Alternativa C
                    </option>

                    <option value="D">
                      Alternativa D
                    </option>

                    <option value="E">
                      Alternativa E
                    </option>

                  </select>

                </div>

              </div>


              {/* =================================================
                  BOTÕES DA QUESTÃO
              ================================================= */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="mural-btn ghost"
                  onClick={() =>
                    setShowQuestaoModal(false)
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="mural-btn primary"
                >
                  Criar
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}