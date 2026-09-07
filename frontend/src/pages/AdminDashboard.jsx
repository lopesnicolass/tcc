import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ICONS = {
  users: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-6a3 3 0 0 1 0 6M18 15a4 4 0 0 1 4 4v2" />
  ),
  simulados: (
    <path d="M5 3h14v18H5V3Zm4 5h6M9 12h6M9 16h4" />
  ),
  questoes: (
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h4" />
  ),
  provas: (
    <path d="M7 3h10v4H7V3Zm-2 4h14v14H5V7Zm4 4h6M9 15h6" />
  ),
};

function StatCard({ icon, value, label, loading }) {
  return (
    <div className="stat-card admin-stat-card">
      <div className="stat-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </div>
      <div>
        <div className="stat-value">{loading ? '—' : value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dados, setDados] = useState({
    usuarios: [],
    simulados: [],
    questoes: [],
    provas: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarDashboard() {
    setCarregando(true);
    setErro('');

    const token = localStorage.getItem('etecamp_token');

    try {
      const respostas = await Promise.allSettled([
        fetch(`${API_URL}/usuarios`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_URL}/simulados`),
        fetch(`${API_URL}/questoes`),
        fetch(`${API_URL}/provas`),
      ]);

      const [usuariosRes, simuladosRes, questoesRes, provasRes] = respostas;

      const usuarios = usuariosRes.status === 'fulfilled' && usuariosRes.value.ok
        ? (await usuariosRes.value.json()).usuarios || []
        : [];

      const simulados = simuladosRes.status === 'fulfilled' && simuladosRes.value.ok
        ? (await simuladosRes.value.json()).simulados || []
        : [];

      const questoes = questoesRes.status === 'fulfilled' && questoesRes.value.ok
        ? (await questoesRes.value.json()).questoes || []
        : [];

      const provas = provasRes.status === 'fulfilled' && provasRes.value.ok
        ? (await provasRes.value.json()).provas || []
        : [];

      const falhou = respostas.some((resposta) => resposta.status === 'rejected');
      const usuariosFalhou = usuariosRes.status === 'fulfilled' && !usuariosRes.value.ok;

      if (falhou || usuariosFalhou) {
        setErro('Algumas informações não puderam ser carregadas.');
      }

      setDados({ usuarios, simulados, questoes, provas });
    } catch (error) {
      console.error('Erro ao carregar dashboard administrativo:', error);
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const usuariosRecentes = [...dados.usuarios].slice(0, 5);
  const provasRecentes = [...dados.provas].slice(0, 5);

  return (
    <div className="admin-dashboard-page">
      <div className="page-header admin-page-header">
        <div>
          <span className="admin-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Dashboard</h1>
          <p>Acompanhe e gerencie os principais dados do Tenna.</p>
        </div>
        <button type="button" className="mural-btn primary" onClick={carregarDashboard} disabled={carregando}>
          {carregando ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>

      {erro && <div className="admin-alert">{erro}</div>}

      <div className="stats-row admin-stats-row">
        <StatCard icon="users" value={dados.usuarios.length} label="Usuários cadastrados" loading={carregando} />
        <StatCard icon="simulados" value={dados.simulados.length} label="Simulados ativos" loading={carregando} />
        <StatCard icon="questoes" value={dados.questoes.length} label="Questões cadastradas" loading={carregando} />
        <StatCard icon="provas" value={dados.provas.length} label="Provas anteriores" loading={carregando} />
      </div>

      <div className="admin-dashboard-grid">
        <section className="panel-card admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>Usuários recentes</h2>
              <p>Últimos usuários cadastrados na plataforma.</p>
            </div>
              <a href="/admin/usuarios" className="admin-panel-link">Ver usuários</a>
          </div>

          {usuariosRecentes.length > 0 ? (
            <div className="admin-list">
              {usuariosRecentes.map((usuario) => (
                <div className="admin-list-row" key={usuario.id}>
                  <div className="admin-avatar">{(usuario.nome || '?').charAt(0).toUpperCase()}</div>
                  <div className="admin-list-main">
                    <strong>{usuario.nome}</strong>
                    <span>{usuario.email}</span>
                  </div>
                  <span className={`admin-badge ${usuario.tipo === 'admin' ? 'admin-badge-highlight' : ''}`}>
                    {usuario.tipo === 'admin' ? 'Administrador' : 'Aluno'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">Nenhum usuário encontrado.</div>
          )}
        </section>

        <section className="panel-card admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>Próxima etapa</h2>
              <p>Configure as informações que serão usadas pelo Tenna.</p>
            </div>
          </div>

          <div className="admin-next-card">
            <div className="admin-next-icon">📅</div>
            <div>
              <strong>Data do Vestibulinho</strong>
              <span>Ainda não configurada no painel.</span>
            </div>
            <button type="button" className="mural-btn primary" disabled>Próximo módulo</button>
          </div>

          <div className="admin-next-card">
            <div className="admin-next-icon">🎯</div>
            <div>
              <strong>Planos de estudo</strong>
              <span>Será o próximo módulo de gestão do Admin.</span>
            </div>
            <button type="button" className="mural-btn ghost" disabled>Em breve</button>
          </div>
        </section>

        <section className="panel-card admin-panel-card admin-panel-wide">
          <div className="admin-panel-heading">
            <div>
              <h2>Provas anteriores</h2>
              <p>Arquivos disponíveis no sistema.</p>
            </div>
            <a href="/admin/provas" className="admin-panel-link">Gerenciar provas</a>
          </div>

          {provasRecentes.length > 0 ? (
            <div className="admin-proof-list">
              {provasRecentes.map((prova) => (
                <div className="admin-proof-row" key={prova.id}>
                  <div>
                    <strong>{prova.titulo}</strong>
                    <span>{prova.ano}</span>
                  </div>
                  <span className="admin-badge">PDF</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">Nenhuma prova cadastrada.</div>
          )}
        </section>
      </div>
    </div>
  );
}
