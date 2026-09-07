import { useMemo, useState } from 'react';

const INITIAL_DATA = [
  { id: 1, nome: 'Língua Portuguesa', slug: 'lingua-portuguesa', icone: '📝', ativa: true, cor: 'blue', descricao: 'Leitura, interpretação, gramática e produção de sentidos.', topicos: [
    { id: 101, nome: 'Interpretação e compreensão de textos', ordem: 1, ativo: true },
    { id: 102, nome: 'Gêneros e tipos textuais', ordem: 2, ativo: true },
    { id: 103, nome: 'Coesão e coerência', ordem: 3, ativo: true },
    { id: 104, nome: 'Classes gramaticais', ordem: 4, ativo: true },
    { id: 105, nome: 'Pontuação e acentuação', ordem: 5, ativo: true },
  ]},
  { id: 2, nome: 'Matemática', slug: 'matematica', icone: '➗', ativa: true, cor: 'green', descricao: 'Números, álgebra, geometria, estatística e resolução de problemas.', topicos: [
    { id: 201, nome: 'Números e operações', ordem: 1, ativo: true },
    { id: 202, nome: 'Frações, razão e proporção', ordem: 2, ativo: true },
    { id: 203, nome: 'Porcentagem', ordem: 3, ativo: true },
    { id: 204, nome: 'Equações e expressões algébricas', ordem: 4, ativo: true },
    { id: 205, nome: 'Geometria e medidas', ordem: 5, ativo: true },
    { id: 206, nome: 'Gráficos, média e probabilidade', ordem: 6, ativo: true },
  ]},
  { id: 3, nome: 'História', slug: 'historia', icone: '🏛️', ativa: true, cor: 'orange', descricao: 'Principais períodos e processos históricos do Brasil e do mundo.', topicos: [
    { id: 301, nome: 'Antiguidade e Idade Média', ordem: 1, ativo: true },
    { id: 302, nome: 'Grandes Navegações e colonização', ordem: 2, ativo: true },
    { id: 303, nome: 'Brasil Império e Independência', ordem: 3, ativo: true },
    { id: 304, nome: 'República e Era Vargas', ordem: 4, ativo: true },
    { id: 305, nome: 'Guerras Mundiais e Guerra Fria', ordem: 5, ativo: true },
  ]},
  { id: 4, nome: 'Geografia', slug: 'geografia', icone: '🌎', ativa: true, cor: 'cyan', descricao: 'Espaço geográfico, população, economia, ambiente e cartografia.', topicos: [
    { id: 401, nome: 'Cartografia e leitura de mapas', ordem: 1, ativo: true },
    { id: 402, nome: 'Climas e biomas brasileiros', ordem: 2, ativo: true },
    { id: 403, nome: 'População e urbanização', ordem: 3, ativo: true },
    { id: 404, nome: 'Globalização e economia', ordem: 4, ativo: true },
  ]},
  { id: 5, nome: 'Ciências da Natureza', slug: 'ciencias-da-natureza', icone: '🧪', ativa: true, cor: 'purple', descricao: 'Biologia, Química e Física aplicadas ao cotidiano.', topicos: [
    { id: 501, nome: 'Célula e organização dos seres vivos', ordem: 1, ativo: true },
    { id: 502, nome: 'Ecossistemas e sustentabilidade', ordem: 2, ativo: true },
    { id: 503, nome: 'Matéria e transformações químicas', ordem: 3, ativo: true },
    { id: 504, nome: 'Movimento, energia e forças', ordem: 4, ativo: true },
  ]},
  { id: 6, nome: 'Raciocínio e interpretação', slug: 'raciocinio-e-interpretacao', icone: '🧠', ativa: true, cor: 'pink', descricao: 'Estratégias de análise, lógica e resolução de situações-problema.', topicos: [
    { id: 601, nome: 'Sequências e padrões', ordem: 1, ativo: true },
    { id: 602, nome: 'Interpretação de tabelas e gráficos', ordem: 2, ativo: true },
    { id: 603, nome: 'Problemas lógicos', ordem: 3, ativo: true },
  ]},
];

const EMPTY_SUBJECT = { nome: '', descricao: '', icone: '📚', cor: 'blue' };
const EMPTY_TOPIC = { nome: '', descricao: '', ativo: true };

function nextId(items) {
  return items.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

export default function AdminConteudos() {
  const [materias, setMaterias] = useState(INITIAL_DATA);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [materiaAberta, setMateriaAberta] = useState(1);
  const [modal, setModal] = useState(null);
  const [formMateria, setFormMateria] = useState(EMPTY_SUBJECT);
  const [formTopico, setFormTopico] = useState(EMPTY_TOPIC);

  const totalTopicos = materias.reduce((total, materia) => total + materia.topicos.length, 0);
  const topicosAtivos = materias.reduce((total, materia) => total + materia.topicos.filter((topico) => topico.ativo).length, 0);
  const materiasAtivas = materias.filter((materia) => materia.ativa).length;

  const materiasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return materias.filter((materia) => {
      const bateBusca = !termo || materia.nome.toLowerCase().includes(termo) || materia.topicos.some((topico) => topico.nome.toLowerCase().includes(termo));
      const bateStatus = filtroStatus === 'todas' || (filtroStatus === 'ativas' && materia.ativa) || (filtroStatus === 'inativas' && !materia.ativa);
      return bateBusca && bateStatus;
    });
  }, [materias, busca, filtroStatus]);

  function abrirNovaMateria() {
    setFormMateria(EMPTY_SUBJECT);
    setModal({ tipo: 'materia', modo: 'novo' });
  }

  function abrirEditarMateria(materia) {
    setFormMateria({ nome: materia.nome, descricao: materia.descricao, icone: materia.icone, cor: materia.cor });
    setModal({ tipo: 'materia', modo: 'editar', id: materia.id });
  }

  function salvarMateria(event) {
    event.preventDefault();
    if (!formMateria.nome.trim()) return;

    if (modal.modo === 'novo') {
      const id = nextId(materias);
      const slug = formMateria.nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setMaterias((atual) => [...atual, { ...formMateria, id, slug, ativa: true, topicos: [] }]);
      setMateriaAberta(id);
    } else {
      setMaterias((atual) => atual.map((materia) => materia.id === modal.id ? { ...materia, ...formMateria } : materia));
    }
    setModal(null);
  }

  function excluirMateria(materia) {
    if (!window.confirm(`Excluir a matéria "${materia.nome}"? Os tópicos dela também serão removidos.`)) return;
    setMaterias((atual) => atual.filter((item) => item.id !== materia.id));
    if (materiaAberta === materia.id) setMateriaAberta(null);
  }

  function alternarMateria(id) {
    setMaterias((atual) => atual.map((materia) => materia.id === id ? { ...materia, ativa: !materia.ativa } : materia));
  }

  function abrirNovoTopico(materia) {
    setFormTopico(EMPTY_TOPIC);
    setModal({ tipo: 'topico', modo: 'novo', materiaId: materia.id });
  }

  function abrirEditarTopico(materia, topico) {
    setFormTopico({ nome: topico.nome, descricao: topico.descricao || '', ativo: topico.ativo });
    setModal({ tipo: 'topico', modo: 'editar', materiaId: materia.id, id: topico.id });
  }

  function salvarTopico(event) {
    event.preventDefault();
    if (!formTopico.nome.trim()) return;

    setMaterias((atual) => atual.map((materia) => {
      if (materia.id !== modal.materiaId) return materia;
      if (modal.modo === 'novo') {
        const id = nextId(materia.topicos);
        const ordem = materia.topicos.length + 1;
        return { ...materia, topicos: [...materia.topicos, { ...formTopico, id, ordem }] };
      }
      return { ...materia, topicos: materia.topicos.map((topico) => topico.id === modal.id ? { ...topico, ...formTopico } : topico) };
    }));
    setModal(null);
  }

  function excluirTopico(materiaId, topico) {
    if (!window.confirm(`Excluir o tópico "${topico.nome}"?`)) return;
    setMaterias((atual) => atual.map((materia) => {
      if (materia.id !== materiaId) return materia;
      const topicos = materia.topicos.filter((item) => item.id !== topico.id).map((item, index) => ({ ...item, ordem: index + 1 }));
      return { ...materia, topicos };
    }));
  }

  function alternarTopico(materiaId, topicoId) {
    setMaterias((atual) => atual.map((materia) => materia.id === materiaId
      ? { ...materia, topicos: materia.topicos.map((topico) => topico.id === topicoId ? { ...topico, ativo: !topico.ativo } : topico) }
      : materia));
  }

  return (
    <div className="admin-content-page">
      <div className="page-header admin-page-header">
        <div>
          <span className="admin-eyebrow">BASE DE ESTUDOS</span>
          <h1>Conteúdos</h1>
          <p>Organize as matérias e os tópicos que estarão disponíveis para os alunos.</p>
        </div>
        <button type="button" className="mural-btn primary" onClick={abrirNovaMateria}>+ Nova matéria</button>
      </div>

      <div className="admin-content-stats">
        <div className="admin-content-stat"><span className="admin-content-stat-icon">📚</span><div><strong>{materias.length}</strong><span>Matérias</span></div></div>
        <div className="admin-content-stat"><span className="admin-content-stat-icon">📖</span><div><strong>{totalTopicos}</strong><span>Tópicos cadastrados</span></div></div>
        <div className="admin-content-stat"><span className="admin-content-stat-icon">✓</span><div><strong>{topicosAtivos}</strong><span>Tópicos ativos</span></div></div>
        <div className="admin-content-stat"><span className="admin-content-stat-icon">●</span><div><strong>{materiasAtivas}</strong><span>Matérias ativas</span></div></div>
      </div>

      <section className="panel-card admin-panel-card admin-content-manager">
        <div className="admin-content-toolbar">
          <div className="admin-content-search">
            <span>⌕</span>
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar matéria ou tópico..." />
          </div>
          <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </div>

        <div className="admin-content-info-bar">
          <span><strong>{materiasFiltradas.length}</strong> matérias exibidas</span>
          <span>Os dados desta tela estão simulados e já seguem o formato pensado para a futura API.</span>
        </div>

        <div className="admin-subject-list">
          {materiasFiltradas.map((materia) => {
            const aberta = materiaAberta === materia.id;
            const topicosOrdenados = [...materia.topicos].sort((a, b) => a.ordem - b.ordem);
            return (
              <article className={`admin-subject-card ${aberta ? 'open' : ''} ${!materia.ativa ? 'inactive' : ''}`} key={materia.id}>
                <div className="admin-subject-head" onClick={() => setMateriaAberta(aberta ? null : materia.id)}>
                  <div className={`admin-subject-icon ${materia.cor}`}>{materia.icone}</div>
                  <div className="admin-subject-main">
                    <div className="admin-subject-title-row"><h2>{materia.nome}</h2><span className={`admin-status ${materia.ativa ? 'active' : 'inactive'}`}>{materia.ativa ? 'Ativa' : 'Inativa'}</span></div>
                    <p>{materia.descricao}</p>
                    <span className="admin-subject-count">{materia.topicos.length} {materia.topicos.length === 1 ? 'tópico' : 'tópicos'}</span>
                  </div>
                  <div className="admin-subject-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="admin-icon-btn" title="Editar matéria" onClick={() => abrirEditarMateria(materia)}>✎</button>
                    <button type="button" className="admin-icon-btn" title={materia.ativa ? 'Desativar' : 'Ativar'} onClick={() => alternarMateria(materia.id)}>{materia.ativa ? '◉' : '○'}</button>
                    <button type="button" className="admin-icon-btn danger" title="Excluir matéria" onClick={() => excluirMateria(materia)}>×</button>
                  </div>
                  <span className="admin-chevron">{aberta ? '⌃' : '⌄'}</span>
                </div>

                {aberta && (
                  <div className="admin-topic-area">
                    <div className="admin-topic-heading"><div><strong>Tópicos de estudo</strong><span>Ordenados na sequência em que serão apresentados.</span></div><button type="button" className="mural-btn ghost small" onClick={() => abrirNovoTopico(materia)}>+ Adicionar tópico</button></div>
                    {topicosOrdenados.length ? (
                      <div className="admin-topic-list">
                        {topicosOrdenados.map((topico) => (
                          <div className={`admin-topic-row ${!topico.ativo ? 'inactive' : ''}`} key={topico.id}>
                            <span className="admin-topic-order">{String(topico.ordem).padStart(2, '0')}</span>
                            <span className="admin-topic-grip">⋮⋮</span>
                            <div className="admin-topic-name"><strong>{topico.nome}</strong>{topico.descricao && <span>{topico.descricao}</span>}</div>
                            <span className={`admin-status ${topico.ativo ? 'active' : 'inactive'}`}>{topico.ativo ? 'Ativo' : 'Inativo'}</span>
                            <button type="button" className="admin-topic-action" onClick={() => alternarTopico(materia.id, topico.id)}>{topico.ativo ? 'Desativar' : 'Ativar'}</button>
                            <button type="button" className="admin-topic-action" onClick={() => abrirEditarTopico(materia, topico)}>Editar</button>
                            <button type="button" className="admin-topic-action danger" onClick={() => excluirTopico(materia.id, topico)}>Excluir</button>
                          </div>
                        ))}
                      </div>
                    ) : <div className="admin-content-empty">Nenhum tópico cadastrado nesta matéria.</div>}
                  </div>
                )}
              </article>
            );
          })}
          {!materiasFiltradas.length && <div className="admin-content-empty large"><strong>Nenhuma matéria encontrada</strong><span>Tente outro termo de busca ou altere o filtro.</span></div>}
        </div>
      </section>

      {modal && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true">
            <div className="admin-modal-head"><div><span className="admin-eyebrow">{modal.tipo === 'materia' ? 'MATÉRIA' : 'TÓPICO'}</span><h2>{modal.modo === 'novo' ? 'Adicionar' : 'Editar'} {modal.tipo === 'materia' ? 'matéria' : 'tópico'}</h2></div><button type="button" className="admin-modal-close" onClick={() => setModal(null)}>×</button></div>
            {modal.tipo === 'materia' ? (
              <form onSubmit={salvarMateria}>
                <label className="admin-field"><span>Nome da matéria</span><input autoFocus value={formMateria.nome} onChange={(event) => setFormMateria({ ...formMateria, nome: event.target.value })} placeholder="Ex.: Matemática" required /></label>
                <label className="admin-field"><span>Descrição</span><textarea value={formMateria.descricao} onChange={(event) => setFormMateria({ ...formMateria, descricao: event.target.value })} placeholder="Explique o que será estudado nesta matéria." rows={4} /></label>
                <div className="admin-field-row"><label className="admin-field"><span>Ícone</span><input value={formMateria.icone} onChange={(event) => setFormMateria({ ...formMateria, icone: event.target.value })} placeholder="📚" maxLength={4} /></label><label className="admin-field"><span>Cor visual</span><select value={formMateria.cor} onChange={(event) => setFormMateria({ ...formMateria, cor: event.target.value })}><option value="blue">Azul</option><option value="green">Verde</option><option value="orange">Laranja</option><option value="cyan">Ciano</option><option value="purple">Roxo</option><option value="pink">Rosa</option></select></label></div>
                <div className="admin-modal-actions"><button type="button" className="mural-btn ghost" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="mural-btn primary">Salvar matéria</button></div>
              </form>
            ) : (
              <form onSubmit={salvarTopico}>
                <label className="admin-field"><span>Nome do tópico</span><input autoFocus value={formTopico.nome} onChange={(event) => setFormTopico({ ...formTopico, nome: event.target.value })} placeholder="Ex.: Porcentagem" required /></label>
                <label className="admin-field"><span>Descrição <small>(opcional)</small></span><textarea value={formTopico.descricao} onChange={(event) => setFormTopico({ ...formTopico, descricao: event.target.value })} placeholder="Breve descrição do conteúdo." rows={4} /></label>
                <label className="admin-check"><input type="checkbox" checked={formTopico.ativo} onChange={(event) => setFormTopico({ ...formTopico, ativo: event.target.checked })} /><span>Disponível para os alunos</span></label>
                <div className="admin-modal-actions"><button type="button" className="mural-btn ghost" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="mural-btn primary">Salvar tópico</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
