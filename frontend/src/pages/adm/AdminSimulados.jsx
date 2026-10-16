
import '../../styles/adm/AdminSimulados.css';
import { useEffect, useState } from 'react';
import { API_URL, obterToken } from '../../services/api.js';
import { Icon } from './admin-conteudos/icons.jsx';

function headerAuth(comJson = false) {
  const headers = {
    Authorization: `Bearer ${obterToken()}`
  };

  if (comJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

const MIN_QUESTOES = 10;

const emptySimulado = {
  nome: '',
  limiteTempo: '',
  materiaId: '',
  topicoId: ''
};

const emptyQuestao = {
  enunciado: '',
  a: '',
  b: '',
  c: '',
  d: '',
  e: '',
  correta: 'A',
  imagem: null
};

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState([]);
  const [materiasConteudos, setMateriasConteudos] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptySimulado);
  const [conteudosAbertos, setConteudosAbertos] = useState(false);

  const [questoes, setQuestoes] = useState([]);
  const [questoesOriginais, setQuestoesOriginais] = useState([]);

  const [showQuestaoModal, setShowQuestaoModal] = useState(false);

  // Impede a rolagem da página de fundo enquanto qualquer modal estiver aberto.
  useEffect(() => {
    if (!showModal && !showQuestaoModal) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [showModal, showQuestaoModal]);
  const [questaoForm, setQuestaoForm] = useState(emptyQuestao);

  const [questaoEditando, setQuestaoEditando] = useState(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroImagem, setErroImagem] = useState('');

  const [simuladoEditando, setSimuladoEditando] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarSimulados();
    carregarMateriasConteudos();
  }, []);

  // =====================================================
  // CARREGAR SIMULADOS
  // =====================================================

  async function carregarSimulados() {
    try {
      setCarregando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/simulados`, {
        headers: headerAuth()
      });

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
  // CARREGAR MATÉRIAS E CONTEÚDOS
  // =====================================================

  async function carregarMateriasConteudos() {
    try {
      const resposta = await fetch(
        `${API_URL}/conteudos`,
        {
          headers: headerAuth()
        }
      );

      if (!resposta.ok) {
        throw new Error(
          'Erro ao carregar matérias e conteúdos.'
        );
      }

      const dados = await resposta.json();

      setMateriasConteudos(
        Array.isArray(dados.materias)
          ? dados.materias
          : []
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Não foi possível carregar as matérias e conteúdos.'
      );
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
    setQuestoesOriginais([]);

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
        `${API_URL}/simulados/${simulado.id}`,
        { headers: headerAuth() }
      );

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar o simulado.');
      }

      const dados = await resposta.json();

      const dadosSimulado =
        dados.simulado || simulado;

      // Aqui usamos a rota de admin (/simulados/:id/questoes),
      // que inclui o gabarito — a rota /simulados/:id (usada
      // pelo aluno) nunca traz o campo "correta".
      const respostaQuestoes = await fetch(
        `${API_URL}/simulados/${simulado.id}/questoes`,
        { headers: headerAuth() }
      );

      if (!respostaQuestoes.ok) {
        throw new Error('Não foi possível carregar as questões do simulado.');
      }

      const dadosQuestoes = await respostaQuestoes.json();

      const listaQuestoes =
        dadosQuestoes.questoes || [];

      setSimuladoEditando(simulado.id);

      const materiaEncontrada =
        materiasConteudos.find(
          (materia) =>
            String(materia.nome) ===
            String(dadosSimulado.materia)
        );

      setForm({
        nome: dadosSimulado.titulo || '',
        limiteTempo:
          dadosSimulado.tempo_limite || '',
        materiaId:
          materiaEncontrada
            ? String(materiaEncontrada.id)
            : '',
        topicoId:
          dadosSimulado.topico_id != null
            ? String(dadosSimulado.topico_id)
            : ''
      });

      const questoesFormatadas =
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
            questao.correta || 'A',
          imagem: questao.imagem || null
        }));

      setQuestoes(questoesFormatadas);
      setQuestoesOriginais(questoesFormatadas);

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
    if (campo === 'materiaId' || campo === 'topicoId') setConteudosAbertos(false);
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'materiaId'
        ? { topicoId: '' }
        : {})
    }));
  }

  // =====================================================
  // ABRIR MODAL DE QUESTÃO
  // =====================================================

  function abrirCriarQuestao() {
    setErroImagem('');
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
    setErroImagem('');
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

  // Imagem é opcional e pertence apenas à questão editada.
  async function enviarImagemQuestao(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(arquivo.type)) {
      setErroImagem('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroImagem('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setEnviandoImagem(true);
    setErroImagem('');
    try {
      const dados = new FormData();
      dados.append('imagem', arquivo);
      const resposta = await fetch(`${API_URL}/questoes/imagem`, {
        method: 'POST',
        headers: headerAuth(),
        body: dados
      });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.mensagem || 'Falha ao enviar imagem.');
      setQuestaoForm(anterior => ({ ...anterior, imagem: corpo.imagem }));
    } catch (error) {
      setErroImagem(error.message || 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoImagem(false);
    }
  }

  // =====================================================
  // SALVAR QUESTÃO NO FORMULÁRIO
  // =====================================================

  function handleAddQuestao(e) {
    e.preventDefault();
    if (enviandoImagem) return;

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
          method: 'DELETE',
          headers: headerAuth()
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
      setQuestoesOriginais([]);

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

    if (!form.materiaId) {
      alert('Selecione uma matéria.');
      return false;
    }

    if (!form.topicoId) {
      alert('Selecione um conteúdo.');
      return false;
    }

    const materiaSelecionada =
      materiasConteudos.find(
        (materia) =>
          String(materia.id) ===
          String(form.materiaId)
      );

    const topicoSelecionado =
      materiaSelecionada?.topicos?.find(
        (topico) =>
          String(topico.id) ===
          String(form.topicoId)
      );

    if (!materiaSelecionada || !topicoSelecionado) {
      alert(
        'Selecione um conteúdo existente na matéria escolhida.'
      );
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
    const materiaSelecionada =
      materiasConteudos.find(
        (materia) =>
          String(materia.id) ===
          String(form.materiaId)
      );

    const respostaSimulado = await fetch(
      `${API_URL}/simulados`,
      {
        method: 'POST',
        headers: headerAuth(true),
        body: JSON.stringify({
          titulo: form.nome.trim(),
          descricao: '',
          tempoLimite: Number(form.limiteTempo),
          quantidadeQuestoes: questoes.length,
          materia:
            materiaSelecionada.nome,
          topicoId:
            Number(form.topicoId),
          dificuldade: simuladoEditando ? (simulados.find(item => item.id === simuladoEditando)?.dificuldade || 'Média') : 'Média',
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
          headers: headerAuth(true),
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
              materiaSelecionada.nome,
            imagem: questao.imagem || null
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
          headers: headerAuth(true),
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

    // Remover do banco as questões que existiam quando o
    // simulado foi aberto, mas não fazem mais parte da lista atual.
    const idsAtuais = new Set(
      questoes
        .filter((questao) => questao.id)
        .map((questao) => Number(questao.id))
    );

    const idsRemovidos = questoesOriginais
      .filter((questao) => {
        const id = Number(questao.id);
        return id && !idsAtuais.has(id);
      })
      .map((questao) => Number(questao.id));

    for (const questaoId of idsRemovidos) {
      const respostaRemocao = await fetch(
        `${API_URL}/simulados/${simuladoId}/questoes/${questaoId}`,
        {
          method: 'DELETE',
          headers: headerAuth()
        }
      );

      const dadosRemocao =
        await respostaRemocao.json();

      if (!respostaRemocao.ok) {
        throw new Error(
          dadosRemocao.mensagem ||
          dadosRemocao.erro ||
          'Erro ao remover uma questão do simulado.'
        );
      }
    }

    // Atualizar informações do simulado
    const materiaSelecionada =
      materiasConteudos.find(
        (materia) =>
          String(materia.id) ===
          String(form.materiaId)
      );

    const respostaSimulado = await fetch(
      `${API_URL}/simulados/${simuladoId}`,
      {
        method: 'PUT',
        headers: headerAuth(true),
        body: JSON.stringify({
          titulo: form.nome.trim(),
          descricao: '',
          tempoLimite: Number(form.limiteTempo),
          quantidadeQuestoes: questoes.length,
          materia:
            materiaSelecionada.nome,
          topicoId:
            Number(form.topicoId),
          dificuldade: simulados.find(item => String(item.id) === String(simuladoId))?.dificuldade || 'Média',
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
              headers: headerAuth(true),
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
                  materiaSelecionada.nome,
                imagem: questao.imagem || null
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
              headers: headerAuth(true),
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
              headers: headerAuth(true),
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
                  materiaSelecionada.nome,
                imagem: questao.imagem || null
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
              headers: headerAuth(true),
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
      setQuestoesOriginais([]);

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

  const gruposSimulados = Object.entries(
    simulados.reduce((materias, simulado) => {
      const materia = simulado.materia || 'Sem matéria';
      const conteudo = simulado.topico || 'Sem conteúdo';
      if (!materias[materia]) materias[materia] = {};
      if (!materias[materia][conteudo]) materias[materia][conteudo] = [];
      materias[materia][conteudo].push(simulado);
      return materias;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-simulados-page">
      <div className="page-header admin-simulados-heading">
        <div><h1>Simulados</h1><p>Gerencie seus simulados organizados por matéria e conteúdo.</p></div>
        <button className="admin-simulados-new" type="button" onClick={openCreate}>+ Novo simulado</button>
      </div>

      {erro && (
        <div className="stat-card simulado-error">
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
              Clique em Novo simulado para criar o
              primeiro simulado.
            </p>
          </div>
        ) : (
          gruposSimulados.map(([materia, conteudos]) => (
            <section className="admin-simulados-materia" key={materia}>
              <header className="admin-simulados-materia-header">
                {(() => {
                  const dadosMateria = materiasConteudos.find(item => item.nome === materia);
                  const iconesPermitidos = ['book', 'calculator', 'globe', 'flask', 'target'];
                  return (
                    <span
                      className="admin-simulados-materia-icon"
                      aria-hidden="true"
                      style={{ background: dadosMateria?.cor || '#2783d3' }}
                    >
                      <Icon name={iconesPermitidos.includes(dadosMateria?.icone) ? dadosMateria.icone : 'book'} size={22} />
                    </span>
                  );
                })()}
                <div><h2>{materia}</h2><span>{Object.values(conteudos).flat().length} simulado(s)</span></div>
              </header>
              {Object.entries(conteudos).sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([conteudo, itens]) => (
                <div className="admin-simulados-conteudo" key={conteudo}>
                  <div className="admin-simulados-conteudo-heading">
                    <h3>{conteudo}</h3><span>{itens.length} simulado(s)</span>
                  </div>
                  <div className="admin-simulados-items">
                    {itens.map((s) => (
                      <article className="admin-simulado-card" key={s.id}>
                        <div className="admin-simulado-card-main">
                          <strong>{s.titulo}</strong>
                          <div className="admin-simulado-details">
                            
                            <span>{s.quantidade_questoes || 0} questões</span>
                            <span>{s.tempo_limite || 0} minutos</span>
                          </div>
                        </div>
                        <button className="admin-edit-btn" type="button" onClick={() => abrirEditar(s)} disabled={carregandoQuestoes || salvando || excluindo}>Editar simulado</button>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>


      {/* Modal de criação / edição de simulado */}
      {showModal && (
        <div
          className="modal-overlay simulado-overlay"
          onClick={() => {
            if (!salvando && !excluindo && !showQuestaoModal) setShowModal(false);
          }}
        >
          <div className="modal-card simulado-editor-modal" role="dialog" aria-modal={!showQuestaoModal} aria-labelledby="simulado-modal-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="simulado-modal-title">{simuladoEditando ? 'Editar Simulado' : 'Criar Simulado'}</h2>
            </div>
            <form onSubmit={handlePostar}>
              <div className="simulado-form-grid">
                <div className="modal-input-group simulado-name-field">
                  <label htmlFor="simulado-nome">Nome do Simulado</label>
                  <input
                    id="simulado-nome"
                    type="text"
                    value={form.nome}
                    onChange={e => alterarForm('nome', e.target.value)}
                    autoFocus
                    disabled={salvando || excluindo}
                  />
                </div>
                <div className="modal-input-group simulado-time-field">
                  <label htmlFor="simulado-tempo">Limite de tempo <span className="simulado-label-hint">(minutos)</span></label>
                  <input
                    id="simulado-tempo"
                    type="number"
                    min="1"
                    placeholder="Ex.: 60"
                    value={form.limiteTempo}
                    onChange={e => alterarForm('limiteTempo', e.target.value)}
                    disabled={salvando || excluindo}
                  />
                </div>
                <div className="simulado-form-subject">
                  <span className="modal-materia-label" id="simulado-materia-label">Matéria</span>
                  {materiasConteudos.length === 0 ? (
                    <p className="modal-note">Cadastre uma matéria e pelo menos um conteúdo antes de criar um simulado.</p>
                  ) : (
                    <div className="modal-materia-list" role="group" aria-labelledby="simulado-materia-label">
                      {materiasConteudos.map(materia => (
                        <button
                          type="button"
                          key={materia.id}
                          className={`materia-pill ${String(form.materiaId) === String(materia.id) ? 'selected' : ''}`}
                          aria-pressed={String(form.materiaId) === String(materia.id)}
                          onClick={() => alterarForm('materiaId', String(materia.id))}
                          disabled={salvando || excluindo}
                        >{materia.nome}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="simulado-form-content">
                  <div className="modal-input-group simulado-content-group">
                    <label htmlFor="simulado-conteudo">Conteúdo</label>
                    {(() => {
                      const conteudosDisponiveis = (materiasConteudos.find(materia => String(materia.id) === String(form.materiaId))?.topicos || [])
                        .filter(topico => Number(topico.ativo) !== 0);
                      const selecionado = conteudosDisponiveis.find(topico => String(topico.id) === String(form.topicoId));
                      const desabilitado = salvando || excluindo || !form.materiaId || conteudosDisponiveis.length === 0;
                      return (
                        <div className="simulado-conteudo-select" onBlur={e => {
                          if (!e.currentTarget.contains(e.relatedTarget)) setConteudosAbertos(false);
                        }} onKeyDown={e => {
                          if (e.key === 'Escape') setConteudosAbertos(false);
                        }}>
                          <button
                            id="simulado-conteudo"
                            type="button"
                            className={`simulado-conteudo-trigger ${conteudosAbertos ? 'is-open' : ''} ${!selecionado ? 'is-placeholder' : ''}`}
                            aria-haspopup="listbox"
                            aria-expanded={conteudosAbertos && !desabilitado}
                            aria-controls="simulado-conteudo-opcoes"
                            disabled={desabilitado}
                            onClick={() => setConteudosAbertos(aberto => !aberto)}
                          >
                            <span>{selecionado?.nome || (form.materiaId ? 'Selecione um conteúdo' : 'Selecione uma matéria primeiro')}</span>
                            <span className="simulado-conteudo-chevron" aria-hidden="true" />
                          </button>
                          {conteudosAbertos && !desabilitado && (
                            <div id="simulado-conteudo-opcoes" className="simulado-conteudo-options" role="listbox" aria-label="Conteúdos disponíveis">
                              {conteudosDisponiveis.map(topico => (
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={String(form.topicoId) === String(topico.id)}
                                  key={topico.id}
                                  className={`simulado-conteudo-option ${String(form.topicoId) === String(topico.id) ? 'is-selected' : ''}`}
                                  onClick={() => alterarForm('topicoId', String(topico.id))}
                                >
                                  <span>{topico.nome}</span>
                                  {String(form.topicoId) === String(topico.id) && <span aria-hidden="true">✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {form.materiaId && (materiasConteudos.find(materia => String(materia.id) === String(form.materiaId))?.topicos || [])
                      .filter(topico => Number(topico.ativo) !== 0).length === 0 && (
                      <small>Esta matéria ainda não possui conteúdos cadastrados.</small>
                    )}
                  </div>
                </div>
              </div>

              <section className="simulado-questions-section" aria-labelledby="simulado-questoes-title">
                <div className="simulado-questions-toolbar">
                  <div className="simulado-questions-info">
                    <h3 id="simulado-questoes-title">Questões do simulado</h3>
                    <span className={`question-count-badge ${questoes.length < MIN_QUESTOES ? 'incomplete' : ''}`}>
                      {questoes.length} de {MIN_QUESTOES} questões mínimas
                    </span>
                  </div>
                  <button type="button" className="simulado-add-question" onClick={abrirCriarQuestao} disabled={salvando || excluindo}>
                    + Criar questão
                  </button>
                </div>
                {questoes.length === 0 ? (
                  <p className="simulado-questions-empty">Nenhuma questão adicionada. Crie a primeira questão para começar.</p>
                ) : (
                  <div className="simulado-question-list">
                    {questoes.map((questao, index) => (
                      <div key={questao.id || `nova-${index}`} className="simulado-question-item">
                        <span>Questão {index + 1} — correta: {questao.correta}
                          {questao.imagem && <span className="simulado-question-image-label"> · Com imagem</span>}
                        </span>
                        <div className="simulado-question-actions">
                          <button type="button" className="simulado-edit-question" onClick={() => abrirEditarQuestao(index)} disabled={salvando || excluindo}>Editar</button>
                          <button type="button" className="simulado-remove-question" onClick={() => removerQuestao(index)} disabled={salvando || excluindo}>Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="modal-actions simulado-modal-actions">
                <div>
                  {simuladoEditando && (
                    <button type="button" className="simulado-delete-button" onClick={excluirSimulado} disabled={salvando || excluindo}>
                      {excluindo ? 'Excluindo...' : 'Excluir simulado'}
                    </button>
                  )}
                </div>
                <div className="simulado-footer-actions">
                  <button type="button" className="mural-btn ghost" disabled={salvando || excluindo} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="mural-btn primary" disabled={salvando || excluindo || questoes.length < MIN_QUESTOES}>
                    {salvando ? 'Salvando...' : simuladoEditando ? 'Salvar alterações' : 'Postar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de criação / edição de questão */}
      {showQuestaoModal && (
        <div className="modal-overlay simulado-questao-overlay" onClick={() => { if (!enviandoImagem) setShowQuestaoModal(false); }}>
          <div className="modal-card simulado-questao-modal" role="dialog" aria-modal="true" aria-labelledby="simulado-questao-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="simulado-questao-title">{questaoEditando !== null ? 'Editar Questão' : 'Criar Questão'}</h2>
            </div>
            <form onSubmit={handleAddQuestao}>
              <div className="simulado-questao-fields">
                <div className="modal-input-group simulado-enunciado-grupo">
                  <label htmlFor="simulado-enunciado">Enunciado</label>
                  <textarea
                    id="simulado-enunciado"
                    className="modal-textarea simulado-enunciado"
                    value={questaoForm.enunciado}
                    onChange={e => alterarQuestao('enunciado', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="modal-input-group simulado-imagem-grupo">
                  <label htmlFor="imagem-da-questao">Imagem da questão <span>(opcional)</span></label>
                  <p className="simulado-imagem-ajuda">Adicione mapas, gráficos ou ilustrações. PNG, JPG, WEBP ou GIF, até 5 MB.</p>
                  {questaoForm.imagem && (
                    <div className="simulado-imagem-previa">
                      <img src={`${API_URL}${questaoForm.imagem}`} alt="Prévia da imagem da questão" />
                      <button type="button" className="simulado-imagem-remover" onClick={() => alterarQuestao('imagem', null)} disabled={enviandoImagem}>Remover imagem</button>
                    </div>
                  )}
                  <input id="imagem-da-questao" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={enviarImagemQuestao} disabled={enviandoImagem} aria-describedby="simulado-imagem-estado" />
                  <small id="simulado-imagem-estado" role={erroImagem ? 'alert' : 'status'}>
                    {enviandoImagem ? 'Enviando imagem...' : erroImagem || (questaoForm.imagem ? 'Imagem adicionada à questão.' : 'Questões sem imagem também são permitidas.')}
                  </small>
                </div>
                {[
                  ['A', 'a'], ['B', 'b'], ['C', 'c'], ['D', 'd'], ['E', 'e']
                ].map(([letra, campo]) => (
                  <div className="modal-input-group simulado-alternativa-field" key={campo}>
                    <label htmlFor={`simulado-alt-${campo}`}>Alternativa {letra}</label>
                    <input id={`simulado-alt-${campo}`} type="text" value={questaoForm[campo]} onChange={e => alterarQuestao(campo, e.target.value)} />
                  </div>
                ))}
                <div className="modal-input-group simulado-correta-field">
                  <span className="simulado-correta-label" id="simulado-correta-label">Alternativa correta</span>
                  <div className="simulado-alternativa-correta" role="radiogroup" aria-labelledby="simulado-correta-label">
                    {['A', 'B', 'C', 'D', 'E'].map(letra => (
                      <label key={letra} className={`simulado-alternativa-opcao ${questaoForm.correta === letra ? 'selecionada' : ''}`}>
                        <input type="radio" name="simulado-alternativa-correta" value={letra} checked={questaoForm.correta === letra} onChange={() => alterarQuestao('correta', letra)} />
                        <span>{letra}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions simulado-questao-actions">
                <button type="button" className="mural-btn ghost" onClick={() => { setShowQuestaoModal(false); setQuestaoEditando(null); }} disabled={enviandoImagem}>Cancelar</button>
                <button type="submit" className="mural-btn primary" disabled={enviandoImagem}>
                  {enviandoImagem ? 'Enviando imagem...' : questaoEditando !== null ? 'Salvar questão' : 'Criar questão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
