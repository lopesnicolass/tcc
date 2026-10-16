import { useEffect, useMemo, useState } from 'react';
import EditorConteudo from './EditorConteudo.jsx';
import '../../styles/adm/AdminConteudos.css';

import { request } from './admin-conteudos/api.js';
import { Icon } from './admin-conteudos/icons.jsx';
import {
  EMPTY_MATERIA,
  EMPTY_TOPICO,
} from './admin-conteudos/helpers.js';

import { Estatisticas } from './admin-conteudos/Estatisticas.jsx';
import { ListaMaterias } from './admin-conteudos/ListaMaterias.jsx';
import { ModalMateria } from './admin-conteudos/ModalMateria.jsx';
import { ModalTopico } from './admin-conteudos/ModalTopico.jsx';

export default function AdminConteudos() {
  const [materias, setMaterias] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [sucesso, setSucesso] =
    useState('');

  const [busca] =
    useState('');

  const [filtro] =
    useState('todas');

  const [materiaAberta, setMateriaAberta] =
    useState(null);

  const [modalMateria, setModalMateria] =
    useState(null);

  const [modalTopico, setModalTopico] =
    useState(null);

  const [formMateria, setFormMateria] =
    useState(EMPTY_MATERIA);

  const [formTopico, setFormTopico] =
    useState(EMPTY_TOPICO);

  const [topicoSelecionado, setTopicoSelecionado] =
    useState(null);

  async function carregarMaterias() {
    try {
      setCarregando(true);
      setErro('');

      const dados =
        await request('/conteudos');

      setMaterias(
        Array.isArray(
          dados.materias
        )
          ? dados.materias
          : []
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível carregar os conteúdos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarMaterias(); }, 0);
    return () => clearTimeout(iniciar);
  }, []);

  function abrirConstrutor(topico, materia) {
    setErro('');
    setSucesso('');
    setTopicoSelecionado({ ...topico, materiaNome: materia?.nome || '' });
  }

  function voltarDaConstrucao() {
    setTopicoSelecionado(null);
    carregarMaterias();
  }

  function mostrarSucesso(
    mensagem
  ) {
    setSucesso(mensagem);

    window.setTimeout(() => {
      setSucesso('');
    }, 3500);
  }

  function abrirEditarMateria(
    materia
  ) {
    setFormMateria({
      nome: materia.nome || '',
      slug: materia.slug || '',
      icone:
        materia.icone ||
        'book',
      cor:
        materia.cor ||
        '#2196F3',
      descricao:
        materia.descricao ||
        '',
      ativa:
        materia.ativa,
      ordem:
        materia.ordem || 0,
    });

    setModalMateria({
      modo: 'editar',
      id: materia.id,
    });
  }

  function abrirNovoTopico(
    materia
  ) {
    setFormTopico({
      ...EMPTY_TOPICO,
      ordem:
        (materia.topicos
          ?.length || 0) + 1,
    });

    setModalTopico({
      modo: 'criar',
      materiaId:
        materia.id,
    });
  }

  function abrirEditarTopico(
    topico
  ) {
    setFormTopico({
      nome:
        topico.nome || '',
      descricao:
        topico.descricao ||
        '',
      ordem:
        topico.ordem || 0,
      ativo:
        Boolean(
          topico.ativo
        ),
      prioridade: Number(topico.prioridade || 2),
      frequencia_provas: Number(topico.frequencia_provas || 0),
      tempo_estimado_minutos: Number(topico.tempo_estimado_minutos || 45),
      justificativa_prioridade: topico.justificativa_prioridade || '',
      fonte_frequencia: topico.fonte_frequencia || '',
    });

    setModalTopico({
      modo: 'editar',
      id: topico.id,
      materiaId:
        topico.materia_id,
    });
  }

  async function salvarMateria() {
    if (!modalMateria?.id) return;
    try {
      setSalvando(true);
      setErro('');
      await request(`/conteudos/materias/${modalMateria.id}`, {
        method: 'PUT',
        body: JSON.stringify({ descricao: formMateria.descricao.trim() }),
      });
      setModalMateria(null);
      mostrarSucesso('Descrição da matéria atualizada.');
      await carregarMaterias();
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar a descrição.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTopico() {
    if (
      !formTopico.nome.trim()
    ) {
      setErro(
        'Informe o nome do tópico.'
      );
      return;
    }

    if (
      Number(formTopico.frequencia_provas || 0) > 0 &&
      !String(formTopico.fonte_frequencia || '').trim()
    ) {
      setErro(
        'Informe a prova ou os anos analisados para registrar a recorrência.'
      );
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const payload = {
        ...formTopico,

        nome:
          formTopico.nome.trim(),

        ordem:
          Number(
            formTopico.ordem
          ) || 0,
      };

      if (
        modalTopico.modo ===
        'criar'
      ) {
        await request(
          `/conteudos/materias/${modalTopico.materiaId}/topicos`,
          {
            method: 'POST',
            body: JSON.stringify(
              payload
            ),
          }
        );

        mostrarSucesso(
          'Tópico criado com sucesso.'
        );
      } else {
        await request(
          `/conteudos/topicos/${modalTopico.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              payload
            ),
          }
        );

        mostrarSucesso(
          'Tópico atualizado com sucesso.'
        );
      }

      setModalTopico(null);

      await carregarMaterias();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível salvar o tópico.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMateria(
    materia
  ) {
    const confirmar =
      window.confirm(
        `Tem certeza que deseja excluir "${materia.nome}"?\n\nTodos os conteúdos dessa matéria também serão excluídos.`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro('');

      await request(
        `/conteudos/materias/${materia.id}`,
        {
          method: 'DELETE',
        }
      );

      if (
        materiaAberta ===
        materia.id
      ) {
        setMateriaAberta(
          null
        );
      }

      mostrarSucesso(
        'Matéria excluída com sucesso.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível excluir a matéria.'
      );
    }
  }

  async function excluirTopico(
    topico
  ) {
    const confirmar =
      window.confirm(
        `Excluir o tópico "${topico.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro('');

      await request(
        `/conteudos/topicos/${topico.id}`,
        {
          method: 'DELETE',
        }
      );

      mostrarSucesso(
        'Tópico excluído com sucesso.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível excluir o tópico.'
      );
    }
  }

  async function alternarMateria(
    materia
  ) {
    try {
      setErro('');

      await request(
        `/conteudos/materias/${materia.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ativa:
              !materia.ativa,
          }),
        }
      );

      mostrarSucesso(
        materia.ativa
          ? 'Matéria desativada.'
          : 'Matéria ativada.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível alterar a matéria.'
      );
    }
  }

  async function alternarTopico(
    topico
  ) {
    try {
      setErro('');

      await request(
        `/conteudos/topicos/${topico.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ativo:
              !topico.ativo,
          }),
        }
      );

      mostrarSucesso(
        topico.ativo
          ? 'Tópico desativado.'
          : 'Tópico ativado.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível alterar o tópico.'
      );
    }
  }

  const materiasFiltradas =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return materias.filter(
        (materia) => {
          const correspondeBusca =
            !termo ||
            materia.nome
              ?.toLowerCase()
              .includes(termo) ||
            materia.descricao
              ?.toLowerCase()
              .includes(termo) ||
            materia.topicos?.some(
              (topico) =>
                topico.nome
                  ?.toLowerCase()
                  .includes(termo)
            );

          const correspondeFiltro =
            filtro === 'todas' ||
            (filtro === 'ativas' &&
              materia.ativa) ||
            (filtro ===
              'inativas' &&
              !materia.ativa);

          return (
            correspondeBusca &&
            correspondeFiltro
          );
        }
      );
    }, [
      materias,
      busca,
      filtro,
    ]);

  const totalTopicos =
    materias.reduce(
      (total, materia) =>
        total +
        (materia.topicos
          ?.length || 0),
      0
    );

  const totalAtivas =
    materias.filter(
      (materia) =>
        Boolean(
          materia.ativa
        )
    ).length;

  const totalTopicosAtivos =
    materias.reduce(
      (total, materia) =>
        total +
        (
          materia.topicos ||
          []
        ).filter(
          (topico) =>
            topico.ativo
        ).length,
      0
    );

  if (topicoSelecionado) {
    return (
      <EditorConteudo
        topicoId={topicoSelecionado.id}
        topicoNome={topicoSelecionado.nome}
        materiaNome={topicoSelecionado.materiaNome}
        aoVoltar={voltarDaConstrucao}
      />
    );
  }

  return (
    <div className="admin-page">

      {/* CABEÇALHO */}

      <header className="page-header">
        <div>

          <h1>
            Conteúdos
          </h1>

          <p>
            As cinco matérias já vêm cadastradas. Personalize suas descrições e crie conteúdos e aulas para os alunos.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="mural-btn secondary"
            onClick={
              carregarMaterias
            }
            disabled={
              carregando
            }
          >
            <Icon
              name="refresh"
              size={17}
            />

            Atualizar
          </button>


        </div>
      </header>

      {/* ALERTAS */}

      {erro && (
        <div
          className="admin-alert"
          style={{
            marginBottom:
              '16px',
            padding:
              '12px 15px',
            borderRadius:
              '12px',
            background:
              '#fff1f0',
            border:
              '1px solid #ffc9c5',
            color:
              '#b42318',
            fontSize:
              '13px',
            fontWeight: 700,
          }}
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          className="admin-alert"
          style={{
            marginBottom:
              '16px',
            padding:
              '12px 15px',
            borderRadius:
              '12px',
            background:
              '#F1F8FF',
            border:
              '1px solid #B8DDF7',
            color:
              '#0D47A1',
            fontSize:
              '13px',
            fontWeight: 700,
          }}
        >
          {sucesso}
        </div>
      )}

      {/* ESTATÍSTICAS */}

      <Estatisticas
        totalMaterias={materias.length}
        totalAtivas={totalAtivas}
        totalTopicos={totalTopicos}
        totalTopicosAtivos={totalTopicosAtivos}
      />

      {/* LISTA */}

      <ListaMaterias
        carregando={carregando}
        materiasFiltradas={materiasFiltradas}
        materiaAberta={materiaAberta}
        setMateriaAberta={setMateriaAberta}
        abrirEditarMateria={abrirEditarMateria}
        alternarMateria={alternarMateria}
        excluirMateria={excluirMateria}
        abrirNovoTopico={abrirNovoTopico}
        abrirEditarTopico={abrirEditarTopico}
        abrirConstrutor={abrirConstrutor}
        alternarTopico={alternarTopico}
        excluirTopico={excluirTopico}
      />

      {/* MODAL DE MATÉRIA */}

      <ModalMateria
        modalMateria={modalMateria}
        setModalMateria={setModalMateria}
        formMateria={formMateria}
        setFormMateria={setFormMateria}
        salvarMateria={salvarMateria}
        salvando={salvando}
      />

      {/* MODAL DE TÓPICO */}

      <ModalTopico
        modalTopico={modalTopico}
        setModalTopico={setModalTopico}
        formTopico={formTopico}
        setFormTopico={setFormTopico}
        salvarTopico={salvarTopico}
        salvando={salvando}
      />

    </div>
  );
}