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
  const [filtroAberto, setFiltroAberto] = useState(false);

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

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarUsuarios(); }, 0);
    return () => clearTimeout(iniciar);
  }, [carregarUsuarios]);

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
          <h1>Usuários</h1>
          <p>Encontre estudantes e administradores e gerencie os cadastros da plataforma.</p>
        </div>
        <button type="button" className="admin-users-reload" onClick={carregarUsuarios} disabled={carregando || excluindo !== null}>
          {carregando ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </header>

      <section className="admin-users-stats" aria-label="Resumo de usuários">
        <div><span className="admin-users-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M19 14a5 5 0 0 1 2 4v2"/></svg></span><span>Total de contas</span><strong>{carregando || erro ? '—' : users.length}</strong></div>
        <div><span className="admin-users-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m2 9 10-5 10 5-10 5L2 9ZM6 12v5c4 3 8 3 12 0v-5M22 9v7"/></svg></span><span>Estudantes</span><strong>{carregando || erro ? '—' : totalAlunos}</strong></div>
        <div><span className="admin-users-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span>Administradores</span><strong>{carregando || erro ? '—' : totalAdmins}</strong></div>
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
              <svg className="admin-users-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
              <input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar nome ou e-mail" />
            </label>
            <div className="admin-users-select-wrap">
              <button type="button" className="admin-users-filter-trigger" aria-label="Filtrar por tipo de usuário" aria-haspopup="listbox" aria-expanded={filtroAberto} onClick={() => setFiltroAberto(!filtroAberto)}>
                <span>{filtro === 'aluno' ? 'Estudantes' : filtro === 'admin' ? 'Administradores' : 'Todos os tipos'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {filtroAberto && <div className="admin-users-filter-options" role="listbox" aria-label="Tipo de usuário">
                {[['todos','Todos os tipos'],['aluno','Estudantes'],['admin','Administradores']].map(([valor, rotulo]) => (
                  <button key={valor} type="button" role="option" aria-selected={filtro === valor} className={filtro === valor ? 'is-selected' : ''} onClick={() => {setFiltro(valor);setFiltroAberto(false);}}>{rotulo}</button>
                ))}
              </div>}
            </div>
          </div>
        </div>

        {erro && <div className="admin-users-message is-error" role="alert">{erro} <button type="button" onClick={carregarUsuarios}>Tentar novamente</button></div>}
        {mensagem && !erro && <p className="admin-users-message is-success" role="status">{mensagem}</p>}
        {carregando ? (
          <p className="admin-users-empty" role="status">Carregando usuários...</p>
        ) : !erro && usuariosFiltrados.length > 0 ? (
          <>
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
