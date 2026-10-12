import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, obterToken, request } from '../services/api.js';
import Icon from './Icon.jsx';

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default function RankingXP({ xp, usuarioId }) {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [fotos, setFotos] = useState({});
  const [participando, setParticipando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    let ativo = true;
    const urls = [];

    async function carregarRanking() {
      setCarregando(true);
      setErro('');
      setFotos({});

      try {
        const dados = await request('/gamificacao/ranking');
        if (!ativo) return;

        const lista = Array.isArray(dados.top3) ? dados.top3.slice(0, 3) : [];
        setAlunos(lista);
        setParticipando(Boolean(dados.participando));
        setCarregando(false);

        const token = obterToken();
        const imagens = await Promise.all(lista.map(async (aluno) => {
          if (!aluno.possuiFoto || !token) return null;
          try {
            const resposta = await fetch(`${API_URL}/gamificacao/ranking/foto/${aluno.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!resposta.ok) return null;
            const blob = await resposta.blob();
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) return null;
            const url = URL.createObjectURL(blob);
            if (!ativo) {
              URL.revokeObjectURL(url);
              return null;
            }
            urls.push(url);
            return [aluno.id, url];
          } catch {
            return null;
          }
        }));

        if (ativo) setFotos(Object.fromEntries(imagens.filter(Boolean)));
      } catch (falha) {
        if (ativo) {
          setErro(falha.message || 'Não foi possível carregar o ranking.');
          setCarregando(false);
        }
      }
    }

    carregarRanking();
    return () => {
      ativo = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [xp, usuarioId, recarregar]);

  return (
    <section className="home-ranking panel-card" aria-labelledby="home-ranking-title">
      <div className="home-ranking-heading">
        <div>
          <span className="home-ranking-kicker"><Icon name="trophy" size={15} /> DESTAQUES DA TURMA</span>
          <h2 id="home-ranking-title">Ranking de XP</h2>
          <p>Os 3 estudantes participantes com mais pontos acumulados.</p>
        </div>
        {!participando && !carregando && !erro && (
          <button type="button" className="home-ranking-join" onClick={() => navigate('/perfil')}>
            Participar do ranking →
          </button>
        )}
      </div>

      {carregando ? (
        <p className="home-ranking-message" role="status">Carregando classificação...</p>
      ) : erro ? (
        <div className="home-ranking-message" role="alert">
          {erro}
          <button type="button" onClick={() => setRecarregar((n) => n + 1)}>Tentar novamente</button>
        </div>
      ) : alunos.length === 0 ? (
        <div className="home-ranking-message">
          Ainda não há participantes. Ative a opção de ranking no seu Perfil para aparecer aqui.
        </div>
      ) : (
        <ol className="home-ranking-list">
          {alunos.map((aluno, indice) => (
            <li className={`home-ranking-player home-ranking-place-${indice + 1}`} key={aluno.id}>
              <span className="home-ranking-medal" aria-label={`${indice + 1}º lugar`}>
                {MEDALHAS[indice]}
              </span>
              <span className="home-ranking-avatar">
                {fotos[aluno.id] ? (
                  <img src={fotos[aluno.id]} alt={`Foto de ${aluno.nome}`} />
                ) : (
                  <span aria-hidden="true">{aluno.nome?.trim()?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </span>
              <span className="home-ranking-player-name">
                <strong>{aluno.nome}</strong>
                <small>{aluno.id === usuarioId ? 'Você · ' : ''}{indice + 1}º lugar</small>
              </span>
              <span className="home-ranking-score"><strong>{Number(aluno.xp).toLocaleString('pt-BR')}</strong><small>XP</small></span>
            </li>
          ))}
        </ol>
      )}
      <p className="home-ranking-note">
        Só aparecem nome e foto de estudantes que autorizaram a participação no Perfil.
      </p>
    </section>
  );
}
