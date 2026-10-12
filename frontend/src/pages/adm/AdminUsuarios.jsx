import '../../styles/adm/AdminUsuarios.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../../services/api.js';

function normalizarTexto(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [excluindo, setExcluindo] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await request('/usuarios', {}, 'Erro ao carregar usuários.');
      setUsers(Array.isArray(dados?.usuarios) ? dados.usuarios : []);
    } catch (erroAtual) {
      console.error(erroAtual);
      setErro(erroAtual.message || 'Não foi possível consultar os usuários.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    return users.filter((user) => {
      const categoria = user.tipo === 'admin' ? 'admin' : 'aluno';
      const confereTipo = filtro === 'todos' || categoria === filtro;
      const confereBusca = !termo || normalizarTexto(`${user.nome || ''} ${user.email || ''}`).includes(termo);
      return confereTipo && confereBusca;
    });
  }, [users, busca, filtro]);

  const totalAdmins = users.filter((user) => user.tipo === 'admin').length;
  const totalAlunos = users.length - totalAdmins;

  async function handleDelete(id) {
    if (excluindo !== null) return;
    const usuario = users.find((user) => user.id === id);
    if (!usuario) return;
    const confirmar = window.confirm(`Excluir definitivamente o usuário "${usuario.nome || usuario.email}"? Essa ação não pode ser desfeita.`);
    if (!confirmar) return;
    setExcluindo(id);
    setErro('');
    setMensagem('');
    try {
      await request(`/usuarios/${id}`, { method: 'DELETE' }, 'Erro ao excluir usuário.');
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setMensagem(`Usuário "${usuario.nome || usuario.email}" excluído.`);
    } catch (erroAtual) {
      console.error(erroAtual);
      setErro(erroAtual.message || 'Não foi possível excluir esse usuário.');
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="admin-users-page">
      <header className="page-header admin-users-header">
        <div>
          <span className="admin-section-kicker">GERENCIAMENTO</span>
          <h1>Usuários</h1>
          <p>Encontre estudantes e administradores e gerencie os cadastros da plataforma.</p>
        </div>
        <button type="button" className="admin-users-reload" onClick={carregarUsuarios} disabled={carregando || excluindo !== null}>
          {carregando ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </header>

      <section className="admin-users-stats" aria-label="Resumo de usuários">
        <div><span>Total de contas</span><strong>{carregando || erro ? '—' : users.length}</strong></div>
        <div><span>Estudantes</span><strong>{carregando || erro ? '—' : totalAlunos}</strong></div>
        <div><span>Administradores</span><strong>{carregando || erro ? '—' : totalAdmins}</strong></div>
      </section>

      <section className="admin-users-panel" aria-label="Lista de usuários">
        <div className="admin-users-toolbar">
          <div>
            <h2>Contas cadastradas</h2>
            <p>Pesquise pelo nome ou e-mail e filtre por tipo de conta.</p>
          </div>
          <div className="admin-users-controls">
            <label className="admin-users-input-wrap">
              <span className="sr-only">Buscar usuários</span>
              <input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar nome ou e-mail" />
            </label>
            <label className="admin-users-select-wrap">
              <span className="sr-only">Filtrar por tipo de usuário</span>
              <select value={filtro} onChange={(event) => setFiltro(event.target.value)}>
                <option value="todos">Todos os tipos</option>
                <option value="aluno">Estudantes</option>
                <option value="admin">Administradores</option>
              </select>
            </label>
          </div>
        </div>

        {erro && <div className="admin-users-message is-error" role="alert">{erro} <button type="button" onClick={carregarUsuarios}>Tentar novamente</button></div>}
        {mensagem && !erro && <p className="admin-users-message is-success" role="status">{mensagem}</p>}
        {carregando ? (
          <p className="admin-users-empty" role="status">Carregando usuários...</p>
        ) : !erro && usuariosFiltrados.length > 0 ? (
          <>
            <p className="admin-users-count" role="status">{usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}</p>
            <div className="admin-users-list">
              {usuariosFiltrados.map((usuario) => (
                <article className="admin-users-row" key={usuario.id}>
                  <div className="admin-users-avatar" aria-hidden="true">{String(usuario.nome || '?').trim().charAt(0).toUpperCase()}</div>
                  <div className="admin-users-identity">
                    <strong>{usuario.nome || 'Usuário sem nome'}</strong>
                    <span>{usuario.email || 'E-mail não informado'}</span>
                  </div>
                  <span className={`admin-users-role ${usuario.tipo === 'admin' ? 'is-admin' : ''}`}>{usuario.tipo === 'admin' ? 'Administrador' : 'Estudante'}</span>
                  <button type="button" className="admin-users-delete" onClick={() => handleDelete(usuario.id)} disabled={excluindo !== null} aria-label={`Excluir ${usuario.nome || 'usuário'}`}>
                    {excluindo === usuario.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : !erro ? (
          <div className="admin-users-empty">
            <strong>{users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhuma conta corresponde aos filtros'}</strong>
            <p>{users.length === 0 ? 'Os novos cadastros aparecerão aqui.' : 'Experimente outro termo ou remova o filtro.'}</p>
            {users.length > 0 && <button type="button" onClick={() => { setBusca(''); setFiltro('todos'); }}>Limpar filtros</button>}
          </div>
        ) : null}
      </section>
    </div>
  );
}
