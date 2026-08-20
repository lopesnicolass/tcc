import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const senha = e.target.senha.value;
    const errs = {};
    if (!validateEmail(email)) errs.email = true;
    if (senha.length < 6) errs.senha = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/admin/usuarios');
    }, 700);
  }

  return (
    <div className="page">
      <div className="app">
        <div className="panel-visual">
          <div className="visual-top">
            <div className="brand"><span className="dot"></span>Prepara ETECAMP</div>
          </div>

          <div className="visual-copy" style={{ textAlign: 'center', maxWidth: 'none' }}>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)' }}>ACESSO DO<br /><span className="accent-word">ADMINISTRADOR</span></h1>
            <p style={{ margin: '0 auto', maxWidth: '320px' }}>Gerencie usuários, simulados e flashcards da plataforma.</p>
          </div>

          <div />
        </div>

        <div className="panel-form">
          <div className="form-head">
            <p className="eyebrow">Área restrita</p>
            <h2>Entrar na plataforma</h2>
            <p className="sub">Acesso exclusivo para administradores.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className={`field ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="admin-email">E-mail</label>
              <input type="email" id="admin-email" name="email" placeholder="admin@etecamp.com" />
              <span className="error-msg">Digite um e-mail válido.</span>
            </div>
            <div className={`field ${errors.senha ? 'has-error' : ''}`}>
              <label htmlFor="admin-senha">Senha</label>
              <div className="field-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  id="admin-senha"
                  name="senha"
                  className="has-toggle"
                  placeholder="••••••••"
                />
                <button type="button" className="toggle-eye" onClick={() => setShowPass(!showPass)} aria-label="Mostrar senha">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <span className="error-msg">A senha deve ter pelo menos 6 caracteres.</span>
            </div>
            <button type="submit" className={`btn-primary ${loading ? 'loading' : ''}`} style={{ marginTop: '10px' }}>
              <span className="btn-label">Entrar</span>
              <span className="spinner"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}