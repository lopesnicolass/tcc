import '../../styles/public/Auth.css';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logoWordmark from '../../assets/tenna_logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.mensagem || 'Não foi possível redefinir sua senha.');
        setLoading(false);
        return;
      }

      setSucesso(true);
      setLoading(false);

      setTimeout(() => navigate('/login'), 1800);

    } catch (erro) {
      console.error(erro);
      setErro('Não foi possível conectar ao servidor.');
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate('/')}
        aria-label="Voltar para a página inicial"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="app">
        <div className="panel-visual panel-visual-simple">
          <button
            type="button"
            className="panel-visual-logo-btn"
            onClick={() => navigate('/')}
            aria-label="Voltar para a página inicial"
          >
            <img src={logoWordmark} alt="Prepara ETECAMP" className="panel-visual-logo" />
          </button>
        </div>

        <div className="panel-form">
          <div className="view">

            {!token ? (

              <>
                <div className="form-head">
                  <p className="eyebrow">Recuperar acesso</p>
                  <h2>Link inválido</h2>
                  <p className="sub">
                    Esse link de redefinição está incompleto ou já foi
                    usado. Solicite um novo na tela de login.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() =>
                    navigate('/login', { state: { view: 'login' } })
                  }
                >
                  <span className="btn-label">Voltar para o login</span>
                </button>
              </>

            ) : sucesso ? (

              <>
                <div className="form-head">
                  <p className="eyebrow">Tudo certo</p>
                  <h2>Senha redefinida!</h2>
                  <p className="sub">
                    Sua senha foi alterada com sucesso. Você já pode
                    entrar com a nova senha — redirecionando...
                  </p>
                </div>
              </>

            ) : (

              <>
                <div className="form-head">
                  <p className="eyebrow">Recuperar acesso</p>
                  <h2>Crie uma nova senha</h2>
                  <p className="sub">
                    Escolha uma senha com pelo menos 6 caracteres.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {erro && (
                    <div className="field" style={{ marginBottom: 6 }}>
                      <span style={{ color: '#C1462F', fontSize: 13.5, fontWeight: 600 }}>
                        {erro}
                      </span>
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="nova-senha">Nova senha</label>
                    <div className="field-input-wrap">
                      <input
                        type={showPass ? 'text' : 'password'}
                        id="nova-senha"
                        name="novaSenha"
                        className="has-toggle"
                        placeholder="••••••••"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                      <button
                        type="button"
                        className="toggle-eye"
                        onClick={() => setShowPass(!showPass)}
                        aria-label="Mostrar senha"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      id="confirmar-senha"
                      name="confirmarSenha"
                      placeholder="••••••••"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                  </div>

                  <button type="submit" className={`btn-primary ${loading ? 'loading' : ''}`}>
                    <span className="btn-label">Redefinir senha</span>
                    <span className="spinner"></span>
                  </button>
                </form>

                <p className="switch-line">
                  Lembrou a senha?{' '}
                  <button type="button" onClick={() => navigate('/login')}>
                    Voltar para o login
                  </button>
                </p>
              </>

            )}

          </div>
        </div>
      </div>
    </div>
  );
}
