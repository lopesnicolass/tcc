import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ICONS = {
  users: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-6a3 3 0 1 1 0 6M18 15a4 4 0 0 1 4 4v2" />
  ),
  book: (
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
  ),
  check: (
    <path d="M5 5h14v14H5V5Zm3.5 7 2.5 2.5L16 9" />
  ),
  file: (
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 12h6M9 16h6" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  arrow: (
    <path d="M5 12h13m-5-5 5 5-5 5" />
  ),
  refresh: (
    <path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11m0-5v5h5M4 13a8.1 8.1 0 0 0 14.8 3L21 13m0 5v-5h-5" />
  ),
  shield: (
    <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Zm0 5v5m0 4h.01" />
  ),
  activity: (
    <path d="M3 12h4l2.2-6 4.6 12 2.2-6H21" />
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function getArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function StatCard({ icon, value, label, detail, loading }) {
  return (
    <article className="admin-overview-stat">
      <div className="admin-overview-stat-top">
        <div className="admin-overview-stat-icon">
          <Icon name={icon} size={21} />
        </div>
        <span className="admin-stat-detail">{detail}</span>
      </div>
      <div className="admin-overview-stat-value">
        {loading ? <span className="admin-skeleton admin-skeleton-number" /> : value}
      </div>
      <div className="admin-overview-stat-label">{label}</div>
    </article>
  );
}

function QuickAction({ to, icon, title, description }) {
  return (
    <Link to={to} className="admin-quick-action">
      <span className="admin-quick-icon"><Icon name={icon} size={20} /></span>
      <span className="admin-quick-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="admin-quick-arrow"><Icon name="arrow" size={17} /></span>
    </Link>
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
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const carregarDashboard = useCallback(async () => {
    setCarregando(true);
    setErro('');

    const token = localStorage.getItem('etecamp_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const endpoints = [
      ['usuarios', `${API_URL}/usuarios`, headers],
      ['simulados', `${API_URL}/simulados`, {}],
      ['questoes', `${API_URL}/questoes`, {}],
      ['provas', `${API_URL}/provas`, {}],
    ];

    try {
      const respostas = await Promise.all(
        endpoints.map(async ([chave, url, requestHeaders]) => {
          try {
            const resposta = await fetch(url, { headers: requestHeaders });
            const texto = await resposta.text();
            let payload = {};

            try {
              payload = texto ? JSON.parse(texto) : {};
            } catch {
              payload = {};
            }

            return { chave, ok: resposta.ok, payload };
          } catch (error) {
            return { chave, ok: false, payload: {}, error };
          }
        })
      );

      const novoDados = respostas.reduce(
        (acc, item) => {
          const keys = {
            usuarios: 'usuarios',
            simulados: 'simulados',
            questoes: 'questoes',
            provas: 'provas',
          };

          acc[item.chave] = item.ok ? getArray(item.payload, keys[item.chave]) : [];
          return acc;
        },
        { usuarios: [], simulados: [], questoes: [], provas: [] }
      );

      const falhas = respostas.filter((item) => !item.ok);
      if (falhas.length) {
        setErro(
          falhas.some((item) => item.chave === 'usuarios')
            ? 'Não foi possível carregar todos os dados administrativos. Verifique sua permissão de administrador.'
            : 'Algumas informações não puderam ser carregadas. Os dados disponíveis continuam sendo exibidos.'
        );
      }

      setDados(novoDados);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dashboard administrativo:', error);
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  const usuariosRecentes = useMemo(
    () => [...dados.usuarios].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5),
    [dados.usuarios]
  );

  const provasRecentes = useMemo(
    () => [...dados.provas].slice(0, 5),
    [dados.provas]
  );

  const admins = useMemo(
    () => dados.usuarios.filter((usuario) => usuario.tipo === 'admin').length,
    [dados.usuarios]
  );

  const alunos = Math.max(dados.usuarios.length - admins, 0);

  return (
    <div className="admin-dashboard-page admin-overview-page">
      <header className="admin-overview-header">
        <div>
          <span className="admin-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Visão geral</h1>
          <p>Gerencie o conteúdo do Tenna e acompanhe o que está acontecendo na plataforma.</p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={carregarDashboard}
          disabled={carregando}
        >
          <Icon name="refresh" size={17} />
          {carregando ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </header>

      <div className="admin-dashboard-status">
        <span className="admin-status-dot" />
        <strong>Sistema administrativo</strong>
        <span>Dados conectados ao backend</span>
        {ultimaAtualizacao && (
          <time dateTime={ultimaAtualizacao.toISOString()}>
            Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
        )}
      </div>

      {erro && (
        <div className="admin-alert admin-dashboard-alert" role="alert">
          <span className="admin-alert-icon">!</span>
          <span>{erro}</span>
        </div>
      )}

      <section className="admin-overview-stats" aria-label="Resumo da plataforma">
        <StatCard
          icon="users"
          value={dados.usuarios.length}
          label="Usuários cadastrados"
          detail={`${alunos} alunos`}
          loading={carregando}
        />
        <StatCard
          icon="book"
          value={dados.questoes.length}
          label="Questões cadastradas"
          detail="Banco de questões"
          loading={carregando}
        />
        <StatCard
          icon="check"
          value={dados.simulados.length}
          label="Simulados"
          detail="Disponíveis no sistema"
          loading={carregando}
        />
        <StatCard
          icon="file"
          value={dados.provas.length}
          label="Provas anteriores"
          detail="Arquivos cadastrados"
          loading={carregando}
        />
      </section>

      <div className="admin-overview-layout">
        <section className="admin-overview-card admin-quick-card">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">ATALHOS</span>
              <h2>Ações rápidas</h2>
              <p>Entre direto nas áreas que você mais vai utilizar.</p>
            </div>
          </div>

          <div className="admin-quick-grid">
            <QuickAction
              to="/admin/conteudos"
              icon="book"
              title="Gerenciar conteúdos"
              description="Matérias e tópicos"
            />
            <QuickAction
              to="/admin/simulados"
              icon="check"
              title="Gerenciar simulados"
              description="Simulados e questões"
            />
            <QuickAction
              to="/admin/provas"
              icon="file"
              title="Adicionar prova"
              description="Provas e gabaritos"
            />
            <QuickAction
              to="/admin/usuarios"
              icon="users"
              title="Gerenciar usuários"
              description="Alunos e administradores"
            />
            <QuickAction
              to="/admin/flashcards"
              icon="book"
              title="FlashCards"
              description="Cartões de estudo"
            />
          </div>
        </section>

        <section className="admin-overview-card admin-health-card">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">CONTROLE</span>
              <h2>Resumo do sistema</h2>
              <p>Indicadores básicos do ambiente administrativo.</p>
            </div>
          </div>

          <div className="admin-health-list">
            <div className="admin-health-row">
              <span className="admin-health-icon"><Icon name="shield" size={18} /></span>
              <div><strong>Acesso administrativo</strong><small>Área protegida por autenticação</small></div>
              <span className="admin-health-badge">Protegido</span>
            </div>
            <div className="admin-health-row">
              <span className="admin-health-icon"><Icon name="activity" size={18} /></span>
              <div><strong>Usuários</strong><small>{admins} administrador(es) · {alunos} aluno(s)</small></div>
              <span className="admin-health-badge">Ativo</span>
            </div>
            <div className="admin-health-row">
              <span className="admin-health-icon"><Icon name="book" size={18} /></span>
              <div><strong>Banco de questões</strong><small>{dados.questoes.length} questão(ões) disponível(is)</small></div>
              <span className="admin-health-badge">Online</span>
            </div>
          </div>
        </section>

        <section className="admin-overview-card admin-recent-card">
          <div className="admin-section-heading admin-section-heading-row">
            <div>
              <span className="admin-section-kicker">USUÁRIOS</span>
              <h2>Cadastros recentes</h2>
              <p>Últimos usuários retornados pela API.</p>
            </div>
            <Link to="/admin/usuarios" className="admin-see-all">Ver todos <Icon name="arrow" size={15} /></Link>
          </div>

          {usuariosRecentes.length ? (
            <div className="admin-recent-list">
              {usuariosRecentes.map((usuario) => (
                <div className="admin-recent-user" key={usuario.id}>
                  <div className="admin-user-avatar">
                    {(usuario.nome || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="admin-user-copy">
                    <strong>{usuario.nome || 'Usuário sem nome'}</strong>
                    <span>{usuario.email || 'E-mail não informado'}</span>
                  </div>
                  <span className={`admin-role-badge ${usuario.tipo === 'admin' ? 'is-admin' : ''}`}>
                    {usuario.tipo === 'admin' ? 'Administrador' : 'Aluno'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <span>👥</span>
              <strong>Nenhum usuário encontrado</strong>
              <p>Quando houver cadastros, eles aparecerão aqui.</p>
            </div>
          )}
        </section>

        <section className="admin-overview-card admin-recent-card">
          <div className="admin-section-heading admin-section-heading-row">
            <div>
              <span className="admin-section-kicker">ARQUIVOS</span>
              <h2>Provas anteriores</h2>
              <p>Últimas provas disponíveis no sistema.</p>
            </div>
            <Link to="/admin/provas" className="admin-see-all">Gerenciar <Icon name="arrow" size={15} /></Link>
          </div>

          {provasRecentes.length ? (
            <div className="admin-proof-list-new">
              {provasRecentes.map((prova) => (
                <div className="admin-proof-item-new" key={prova.id}>
                  <div className="admin-proof-file-icon"><Icon name="file" size={18} /></div>
                  <div>
                    <strong>{prova.titulo || 'Prova anterior'}</strong>
                    <span>{prova.ano ? `Edição ${prova.ano}` : 'Ano não informado'}</span>
                  </div>
                  <span className="admin-pdf-badge">PDF</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <span>📄</span>
              <strong>Nenhuma prova cadastrada</strong>
              <p>Adicione uma prova anterior para começar a biblioteca.</p>
              <Link to="/admin/provas" className="admin-inline-action"><Icon name="plus" size={15} /> Cadastrar prova</Link>
            </div>
          )}
        </section>
      </div>

      <footer className="admin-dashboard-footer">
        <span>Tenna · Painel administrativo</span>
        <span>Última atualização: {ultimaAtualizacao ? formatDate(ultimaAtualizacao) : 'aguardando dados'}</span>
      </footer>
    </div>
  );
}
