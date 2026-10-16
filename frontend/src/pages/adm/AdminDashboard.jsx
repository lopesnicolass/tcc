import '../../styles/adm/AdminDashboard.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { request } from '../../services/api.js';
import { contarSeDisponivel, resumirFontesAdministrativas } from '../../utils/adminOverview.js';

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

const QUICK_ACTIONS = [
  { to: '/admin/conteudos', icon: 'book', title: 'Gerenciar conteúdos', description: 'Matérias e tópicos', tone: 'blue' },
  { to: '/admin/simulados', icon: 'check', title: 'Gerenciar simulados', description: 'Simulados e questões', tone: 'green' },
  { to: '/admin/provas', icon: 'file', title: 'Adicionar prova', description: 'Provas e gabaritos', tone: 'orange' },
  { to: '/admin/usuarios', icon: 'users', title: 'Gerenciar usuários', description: 'Alunos e administradores', tone: 'purple' },
  { to: '/admin/flashcards', icon: 'book', title: 'Flashcards', description: 'Cartões de estudo', tone: 'cyan' },
  { to: '/admin/cronogramas', icon: 'activity', title: 'Cronogramas', description: 'Planos de estudo', tone: 'indigo' },
  { to: '/admin/calendario', icon: 'activity', title: 'Calendário', description: 'Datas importantes', tone: 'rose' },
];

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

function StatCard({ icon, value, label, detail, loading, unavailable, tone = 'blue' }) {
  return (
    <article className={`admin-overview-stat admin-overview-stat--${tone}`}>
      <div className="admin-overview-stat-top">
        <div className="admin-overview-stat-icon">
          <Icon name={icon} size={21} />
        </div>
        <span className="admin-stat-detail">{unavailable && !loading ? 'Indisponível' : detail}</span>
      </div>
      <div className="admin-overview-stat-value">
        {loading ? <span className="admin-skeleton admin-skeleton-number" /> : unavailable ? '—' : value}
      </div>
      <div className="admin-overview-stat-label">{label}</div>
      <span className="admin-overview-stat-accent" aria-hidden="true" />
    </article>
  );
}

function QuickAction({ to, icon, title, description, tone = 'blue' }) {
  return (
    <Link to={to} className={`admin-quick-action admin-quick-action--${tone}`}>
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
  const [fontes, setFontes] = useState({ usuarios: false, simulados: false, questoes: false, provas: false });
  const [erro, setErro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  const carregarDashboard = useCallback(async () => {
    setCarregando(true);
    setErro('');

    const endpoints = [
      ['usuarios', '/usuarios'],
      ['simulados', '/simulados'],
      ['questoes', '/questoes'],
      ['provas', '/provas'],
    ];

    try {
      const respostas = await Promise.all(
        endpoints.map(async ([chave, url]) => {
          try {
            const payload = await request(url);
            return { chave, ok: true, payload };
          } catch (error) {
            return { chave, ok: false, payload: {}, error };
          }
        })
      );

      const { dados: novoDados, status } = resumirFontesAdministrativas(respostas);
      setFontes(status);

      const falhas = Object.entries(status).filter(([, ok]) => !ok);
      if (falhas.length) {
        setErro(
          !status.usuarios
            ? 'Não foi possível carregar todos os dados administrativos. Verifique sua permissão de administrador.'
            : 'Algumas informações não puderam ser carregadas. Os dados disponíveis continuam sendo exibidos.'
        );
      }

      setDados(novoDados);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dashboard administrativo:', error);
      setFontes({ usuarios: false, simulados: false, questoes: false, provas: false });
      setDados({ usuarios: [], simulados: [], questoes: [], provas: [] });
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarDashboard(); }, 0);
    return () => clearTimeout(iniciar);
  }, [carregarDashboard]);

  const usuariosRecentes = useMemo(
    () => [...dados.usuarios].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5),
    [dados.usuarios]
  );

  const provasRecentes = useMemo(
    () => [...dados.provas].slice(0, 5),
    [dados.provas]
  );

  const statusGeral = Object.values(fontes).every(Boolean);
  const statusTexto = carregando ? 'Verificando informações' : statusGeral ? 'Dados carregados' : 'Dados parciais';
  const statusDescricao = carregando
    ? 'Consultando as informações'
    : statusGeral ? 'Todas as consultas concluídas' : 'Uma ou mais consultas falharam';

  return (
    <div className="admin-dashboard-page admin-overview-page">
      <header className="admin-overview-header admin-overview-hero">
        <div className="admin-hero-copy">
          <span className="admin-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Visão geral</h1>
        </div>

        <div className="admin-hero-actions">
          <div className={`admin-connection-badge ${!carregando && !statusGeral ? 'admin-connection-warning' : ''}`} role="status">
            <span className="admin-status-dot" />
            <span><strong>{statusTexto}</strong><small>{statusDescricao}</small></span>
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
        </div>
      </header>

      {erro && (
        <div className="admin-alert admin-dashboard-alert" role="alert">
          <span className="admin-alert-icon">!</span>
          <span>{erro}</span>
        </div>
      )}

      <section className="admin-overview-stats" aria-label="Resumo da plataforma">
        <div className="admin-stats-heading">
          <div>
            <h2>Resumo geral</h2>
          </div>
          <span>Dados atuais</span>
        </div>
        <div className="admin-stats-cards">
          <StatCard icon="users" value={contarSeDisponivel(dados.usuarios, fontes.usuarios)} label="Usuários cadastrados" detail="Pessoas na plataforma" loading={carregando} unavailable={!fontes.usuarios} tone="blue" />
          <StatCard icon="book" value={contarSeDisponivel(dados.questoes, fontes.questoes)} label="Questões cadastradas" detail="Banco de questões" loading={carregando} unavailable={!fontes.questoes} tone="green" />
          <StatCard icon="check" value={contarSeDisponivel(dados.simulados, fontes.simulados)} label="Simulados" detail="Disponíveis no sistema" loading={carregando} unavailable={!fontes.simulados} tone="purple" />
          <StatCard icon="file" value={contarSeDisponivel(dados.provas, fontes.provas)} label="Provas anteriores" detail="Arquivos cadastrados" loading={carregando} unavailable={!fontes.provas} tone="orange" />
        </div>
      </section>

      <section className="admin-overview-card admin-quick-card admin-primary-card">
        <div className="admin-section-heading admin-section-heading-row">
          <div>
            <span className="admin-section-kicker">COMECE POR AQUI</span>
            <h2>Ações rápidas</h2>
            <p>Acesse diretamente as áreas que você mais utiliza no gerenciamento da plataforma.</p>
          </div>
          <span className="admin-section-hint">7 áreas de gerenciamento</span>
        </div>

        <div className="admin-quick-grid">
          {QUICK_ACTIONS.map((item) => (
            <QuickAction key={item.to} {...item} />
          ))}
        </div>
      </section>

      <div className="admin-overview-layout">
        <section className="admin-overview-card admin-recent-card">
          <div className="admin-section-heading admin-section-heading-row">
            <div>
              <span className="admin-section-kicker">USUÁRIOS</span>
              <h2>Cadastros recentes</h2>
              <p>Últimos usuários retornados pela API.</p>
            </div>
            <Link to="/admin/usuarios" className="admin-see-all">Ver todos <Icon name="arrow" size={15} /></Link>
          </div>

          {!fontes.usuarios && !carregando ? (
            <div className="admin-empty-state"><strong>Dados indisponíveis</strong><p>Não foi possível consultar os usuários. Tente atualizar os dados.</p></div>
          ) : usuariosRecentes.length ? (
            <div className="admin-recent-list">
              {usuariosRecentes.map((usuario) => (
                <div className="admin-recent-user" key={usuario.id}>
                  <div className="admin-user-avatar">{(usuario.nome || '?').trim().charAt(0).toUpperCase()}</div>
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
              <span>👥</span><strong>Nenhum usuário encontrado</strong>
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

          {!fontes.provas && !carregando ? (
            <div className="admin-empty-state"><strong>Dados indisponíveis</strong><p>Não foi possível consultar as provas. Tente atualizar os dados.</p></div>
          ) : provasRecentes.length ? (
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
              <span>📄</span><strong>Nenhuma prova cadastrada</strong>
              <p>Adicione uma prova anterior para começar a biblioteca.</p>
              <Link to="/admin/provas" className="admin-inline-action"><Icon name="plus" size={15} /> Cadastrar prova</Link>
            </div>
          )}
        </section>

        <section className="admin-overview-card admin-health-card admin-system-card">
          <div className="admin-section-heading">
            <span className="admin-section-kicker">CONSULTAS</span>
            <h2>Estado das informações</h2>
            <p>Disponibilidade das informações consultadas pelo painel — não substitui um monitoramento do servidor.</p>
          </div>
          <div className="admin-health-list">
            {[
              ['Usuários', 'usuarios'], ['Simulados', 'simulados'],
              ['Questões', 'questoes'], ['Provas', 'provas'],
            ].map(([nome, chave]) => (
              <div className={`admin-health-row admin-health-row--${chave}`} key={chave}>
                <span className="admin-health-icon"><Icon name="activity" size={18} /></span>
                <div><strong>{nome}</strong><small>{carregando ? 'Consultando...' : fontes[chave] ? 'Consulta concluída' : 'Falha na consulta'}</small></div>
                <span className={`admin-health-badge ${!carregando && !fontes[chave] ? 'is-unavailable' : ''}`}>
                  {carregando ? 'Aguarde' : fontes[chave] ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="admin-dashboard-footer">
        <span>Tenna · Painel administrativo</span>
        <span>Última atualização: {ultimaAtualizacao ? formatDate(ultimaAtualizacao) : 'aguardando dados'}</span>
      </footer>
    </div>
  );
}
