import '../../styles/public/Auth.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoWordmark from '../../assets/tenna_logo.png';
import { request } from '../../services/api.js';

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    const emailNormalizado = email.trim().toLowerCase();

    if (!validarEmail(emailNormalizado)) {
      setErro('Digite um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      await request(
        '/auth/esqueci-senha',
        {
          method: 'POST',
          body: JSON.stringify({ email: emailNormalizado }),
        },
        'Não foi possível solicitar a recuperação.'
      );

      setEnviado(true);
      setLoading(false);
    } catch (erroFetch) {
      console.error(erroFetch);
      setErro(erroFetch.message || 'Não foi possível conectar ao servidor.');
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
          <div className="view single-view">
            {enviado ? (
              <>
                <div className="form-head">
                  <p className="eyebrow">Confira seu e-mail</p>
                  <h2>Solicitação enviada</h2>
                  <p className="sub">
                    Se o endereço informado estiver cadastrado, enviaremos um link para você criar uma nova senha.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate('/login', { state: { view: 'login' } })}
                >
                  <span className="btn-label">Voltar para o login</span>
                </button>
              </>
            ) : (
              <>
                <div className="form-head">
                  <p className="eyebrow">Recuperar acesso</p>
                  <h2>Esqueceu sua senha?</h2>
                  <p className="sub">
                    Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {erro && <div className="form-error">{erro}</div>}

                  <div className="field">
                    <label htmlFor="recuperacao-email">E-mail</label>
                    <input
                      type="email"
                      id="recuperacao-email"
                      name="email"
                      placeholder="seunome@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <button type="submit" className={`btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                    <span className="btn-label">Enviar link de recuperação</span>
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
