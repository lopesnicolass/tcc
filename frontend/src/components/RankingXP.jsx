import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, obterToken, request } from '../services/api.js';
import Icon from './Icon.jsx';
import { xpForLevel } from '../context/GamificationContext.jsx';

function nivelPorXp(total) {
  let nivel = 1;
  let restante = Math.max(0, Number(total) || 0);
  while (restante >= xpForLevel(nivel) && nivel < 1000) {
    restante -= xpForLevel(nivel);
    nivel += 1;
  }
  return nivel;
}

const POSICAO_LABEL = ['1º lugar', '2º lugar', '3º lugar'];

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

  const alunosExibidos = alunos.map((aluno, indice) => ({
    ...aluno,
    posicao: indice + 1
  }));

  const minhaPosicao = alunosExibidos.find((aluno) => String(aluno.id) === String(usuarioId))?.posicao;

  return (
    <section className="home-ranking panel-card" aria-labelledby="home-ranking-title">
      <div className="home-ranking-decor" aria-hidden="true">
        <span className="home-ranking-decor-orb home-ranking-decor-orb-left" />
        <span className="home-ranking-decor-orb home-ranking-decor-orb-right" />
        <span className="home-ranking-decor-star home-ranking-decor-star-one">✦</span>
        <span className="home-ranking-decor-star home-ranking-decor-star-two">✧</span>
        <span className="home-ranking-decor-star home-ranking-decor-star-three">✦</span>
      </div>
      <div className="home-ranking-heading">
        <div>
          
          <h2 id="home-ranking-title">Ranking de <em>XP</em></h2>
          <p>Acompanhe sua posição entre os estudantes.</p>
        </div>
        {participando && !carregando && !erro && (
          <div className="home-ranking-my-position" aria-label="Sua posição no ranking">
            <span>SUA COLOCAÇÃO</span>
            <strong>{minhaPosicao ? `${minhaPosicao}º lugar` : 'Fora do top 3'}</strong>
            <small>{minhaPosicao ? `de ${alunos.length} estudantes` : 'Continue acumulando XP'}</small>
            <span className="home-ranking-position-icon" aria-hidden="true"><Icon name="trophy" size={20} /></span>
          </div>
        )}
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
          {alunosExibidos.map((aluno) => (
            <li className={`home-ranking-player home-ranking-place-${aluno.posicao}`} key={aluno.id}>
              {aluno.posicao === 1 && (
                <span className="home-ranking-crown" aria-hidden="true"><Icon name="crown" size={27} /></span>
              )}
              <span className="home-ranking-medal" role="img" aria-label={POSICAO_LABEL[aluno.posicao - 1]}>
                <span aria-hidden="true">{aluno.posicao}</span>
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
                <small><Icon name="star" size={12} /> {String(aluno.id) === String(usuarioId) ? 'Você · ' : ''}Nível {nivelPorXp(aluno.xp)}</small>
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
