import { useEffect, useMemo, useState } from 'react';
import { request } from '../../services/api.js';
import '../../styles/adm/AdminCalendario.css';

const TIPOS = [
  'Inscrições',
  'Prova',
  'Resultado',
  'Outro',
];

const FORM_INICIAL = {
  titulo: '',
  tipo: 'Inscrições',
  data: '',
  descricao: '',
};

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatarData(data) {
  if (!data) return '—';
  const partes = String(data).split('-');
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mesLabel(date) {
  const texto = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function getTipoClass(tipo) {
  const mapa = {
    Inscrições: 'inscricoes',
    Prova: 'prova',
    Resultado: 'resultado',
    Outro: 'outro',
  };

  return mapa[tipo] || 'outro';
}

export default function AdminCalendario() {
  const [datas, setDatas] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState(() => dateKey(new Date()));
  const [campoAberto, setCampoAberto] = useState(null);
  const [mesCampo, setMesCampo] = useState(() => new Date());
  const diasCampo = useMemo(() => {
    const primeiro = new Date(mesCampo.getFullYear(), mesCampo.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      return dia;
    });
  }, [mesCampo]);
  function abrirCampoData() {
    if (campoAberto === 'data') { setCampoAberto(null); return; }
    const base = form.data ? new Date(`${form.data}T12:00:00`) : new Date();
    setMesCampo(new Date(base.getFullYear(), base.getMonth(), 1));
    setCampoAberto('data');
  }


  async function carregarDatas() {
    try {
      setCarregando(true);
      setErro('');

      const resposta = await request('/calendario/datas-importantes');
      setDatas(Array.isArray(resposta?.datas) ? resposta.datas : []);
    } catch (error) {
      console.error('Erro ao carregar datas importantes:', error);
      setErro(error.message || 'Não foi possível carregar o calendário.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const iniciar = setTimeout(() => { void carregarDatas(); }, 0);
    return () => clearTimeout(iniciar);
  }, []);

  const datasOrdenadas = useMemo(
    () => [...datas].sort((a, b) => String(a.data).localeCompare(String(b.data))),
    [datas]
  );

  const diasDoMes = useMemo(() => {
    const primeiro = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());

    const total = Math.ceil((primeiro.getDay() + new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + index);
      return dia;
    });
  }, [mesAtual]);

  function alterarForm(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setMensagem('');
    setErro('');
  }

  function iniciarEdicao(data) {
    setEditando(data.id);
    setDiaSelecionado(data.data);
    setForm({
      titulo: data.titulo || '',
      tipo: data.tipo || 'Outro',
      data: data.data || '',
      descricao: data.descricao || '',
    });
    setMensagem('');
    setErro('');
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setMensagem('');
    setErro('');
  }

  async function salvar(event) {
    event.preventDefault();

    if (!form.titulo.trim() || !form.data) {
      setErro('Preencha o título e a data.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setMensagem('');

      const resposta = await request(
        editando
          ? `/calendario/datas-importantes/${editando}`
          : '/calendario/datas-importantes',
        {
          method: editando ? 'PUT' : 'POST',
          body: JSON.stringify({
            titulo: form.titulo.trim(),
            tipo: form.tipo,
            data: form.data,
            descricao: form.descricao.trim(),
          }),
        }
      );

      if (resposta.data) {
        setDatas((atual) => {
          if (editando) {
            return atual.map((item) =>
              item.id === editando ? resposta.data : item
            );
          }

          return [...atual, resposta.data];
        });
      } else {
        await carregarDatas();
      }

      const dataSalva = new Date(`${form.data}T12:00:00`);
      setMesAtual(new Date(dataSalva.getFullYear(), dataSalva.getMonth(), 1));
      setDiaSelecionado(form.data);
      const mensagemSucesso =
        editando
          ? 'Data importante atualizada com sucesso.'
          : 'Data importante adicionada ao calendário.';

      setEditando(null);
      setForm(FORM_INICIAL);
      setMensagem(mensagemSucesso);
    } catch (error) {
      console.error('Erro ao salvar data importante:', error);
      setErro(error.message || 'Não foi possível salvar a data.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    try {
      setExcluindo(id);
      setErro('');
      setMensagem('');

      await request(`/calendario/datas-importantes/${id}`, {
        method: 'DELETE',
      });

      setDatas((atual) => atual.filter((item) => item.id !== id));
      setMensagem('Data importante excluída.');

      if (editando === id) {
        cancelarEdicao();
      }
    } catch (error) {
      console.error('Erro ao excluir data importante:', error);
      setErro(error.message || 'Não foi possível excluir a data.');
    } finally {
      setExcluindo(null);
    }
  }

  function mudarMes(delta) {
    setMesAtual(
      (atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1)
    );
  }

  const hoje = dateKey(new Date());
  const eventosSelecionados = datasOrdenadas.filter((item) => item.data === diaSelecionado);

  return (
    <div className="admin-calendar-page">
      <header className="admin-calendar-header">
        <div>
          <h1>Datas importantes</h1>
          <p>
            Cadastre as datas que os estudantes precisam acompanhar, como inscrições,
            prova e divulgação de resultados.
          </p>
        </div>
      </header>

      {mensagem && <div className="admin-calendar-feedback success">{mensagem}</div>}
      {erro && <div className="admin-calendar-feedback error">{erro}</div>}

      <div className="admin-calendar-layout">
        <section className="admin-calendar-month-card">
          <div className="admin-calendar-toolbar">
            <div className="admin-calendar-month-actions">
              <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
              <h2>{mesLabel(mesAtual)}</h2>
              <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
            </div>
            <div className="admin-calendar-month-actions">
              <button type="button" className="admin-calendar-today" onClick={() => { const d = new Date(); setMesAtual(new Date(d.getFullYear(), d.getMonth(), 1)); setDiaSelecionado(dateKey(d)); }}>Hoje</button>
            </div>
          </div>

          <div className="admin-calendar-weekdays">
            {SEMANA.map((dia) => <span key={dia}>{dia}</span>)}
          </div>

          <div className="admin-calendar-grid">
            {diasDoMes.map((dia) => {
              const chave = dateKey(dia);
              const eventos = datas.filter((item) => item.data === chave);
              const foraDoMes = dia.getMonth() !== mesAtual.getMonth();

              return (
                <button
                  type="button"
                  key={chave}
                  className={`admin-calendar-day ${foraDoMes ? 'outside' : ''} ${chave === hoje ? 'today' : ''} ${chave === diaSelecionado ? 'selected' : ''}`}
                  onClick={() => setDiaSelecionado(chave)}
                  aria-label={`${formatarData(chave)}: ${eventos.length} eventos`}
                  aria-pressed={chave === diaSelecionado}
                >
                  <span className="admin-calendar-day-number">{dia.getDate()}</span>
                  {chave === hoje && <span className="admin-calendar-today-tag">HOJE</span>}
                  {eventos.length > 0 && <span className="admin-calendar-dots">{eventos.slice(0, 4).map((evento) => <span key={evento.id} className={`admin-calendar-type-dot ${getTipoClass(evento.tipo)}`} />)}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="admin-calendar-sidebar">
          <section className="admin-calendar-selected-card">
            <div className="admin-calendar-selected-heading">
              <div><span>DATA SELECIONADA</span><h2>{formatarData(diaSelecionado)}</h2></div>
              <button type="button" onClick={() => { cancelarEdicao(); setForm((atual) => ({ ...atual, data: diaSelecionado })); }} aria-label="Cadastrar evento nesta data">+</button>
            </div>
            {eventosSelecionados.length ? eventosSelecionados.map((item) => (
              <button key={item.id} type="button" className="admin-calendar-selected-event" onClick={() => iniciarEdicao(item)}>
                <span className={`admin-calendar-type-dot ${getTipoClass(item.tipo)}`} />
                <span><strong>{item.titulo}</strong><small>{item.tipo}</small></span>
                <span className="admin-calendar-edit-label">Editar</span>
              </button>
            )) : <p className="admin-calendar-empty">Nenhuma data importante neste dia.</p>}
          </section>
          <aside className="admin-calendar-form-card">
          <div className="admin-calendar-form-heading">
            <h2>{editando ? 'Atualizar evento' : 'Adicionar data importante'}</h2>
            <p>Essas informações serão exibidas no calendário dos estudantes.</p>
          </div>

          <form onSubmit={salvar} className="admin-calendar-form">
            <label>
              Título
              <input
                value={form.titulo}
                onChange={(event) => alterarForm('titulo', event.target.value)}
                placeholder="Ex.: Início das inscrições"
                disabled={salvando}
              />
            </label>

            <div className="admin-calendar-form-row">
              <label>
                Tipo
                <div className="admin-calendar-picker-anchor">
                  <button type="button" className="admin-calendar-field-button" aria-expanded={campoAberto === 'tipo'} disabled={salvando} onClick={() => setCampoAberto(campoAberto === 'tipo' ? null : 'tipo')}>
                    <span>{form.tipo}</span><span className="admin-calendar-chevron" />
                  </button>
                  {campoAberto === 'tipo' && <div className="admin-calendar-dropdown" role="listbox" aria-label="Tipo de evento">
                    {TIPOS.map((tipo) => <button type="button" role="option" aria-selected={form.tipo === tipo} key={tipo} className={form.tipo === tipo ? 'active' : ''} onClick={() => { alterarForm('tipo', tipo); setCampoAberto(null); }}>{tipo}</button>)}
                  </div>}
                </div>
              </label>

              <label>
                Data
                <div className="admin-calendar-picker-anchor">
                  <button type="button" className="admin-calendar-field-button admin-calendar-date-button" aria-expanded={campoAberto === 'data'} disabled={salvando} onClick={abrirCampoData}>
                    <span className={form.data ? '' : 'placeholder'}>{form.data ? formatarData(form.data) : 'dd/mm/aaaa'}</span>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
                  </button>
                  {campoAberto === 'data' && <div className="admin-calendar-date-popover">
                    <div className="admin-calendar-date-nav">
                      <button type="button" aria-label="Mês anterior" onClick={() => setMesCampo(new Date(mesCampo.getFullYear(), mesCampo.getMonth()-1, 1))}>‹</button>
                      <strong>{mesLabel(mesCampo)}</strong>
                      <button type="button" aria-label="Próximo mês" onClick={() => setMesCampo(new Date(mesCampo.getFullYear(), mesCampo.getMonth()+1, 1))}>›</button>
                    </div>
                    <div className="admin-calendar-date-grid">
                      {SEMANA.map((dia) => <span className="weekday" key={dia}>{dia.slice(0, 1)}</span>)}
                      {diasCampo.map((dia) => { const chave = dateKey(dia); return <button type="button" key={chave} className={`${dia.getMonth() !== mesCampo.getMonth() ? 'outside' : ''} ${chave === form.data ? 'chosen' : ''} ${chave === dateKey(new Date()) ? 'current' : ''}`} onClick={() => { alterarForm('data', chave); setCampoAberto(null); }}>{dia.getDate()}</button>; })}
                    </div>
                    <div className="admin-calendar-date-footer"><button type="button" onClick={() => { alterarForm('data', ''); setCampoAberto(null); }}>Limpar</button><button type="button" onClick={() => { alterarForm('data', dateKey(new Date())); setCampoAberto(null); }}>Hoje</button></div>
                  </div>}
                </div>
              </label>
            </div>

            <label>
              Descrição
              <textarea
                value={form.descricao}
                onChange={(event) => alterarForm('descricao', event.target.value)}
                placeholder="Ex.: Último dia para realizar a inscrição."
                rows={4}
                disabled={salvando}
              />
            </label>

            <div className="admin-calendar-form-actions">
              {editando && (
                <button type="button" className="admin-calendar-secondary" onClick={cancelarEdicao} disabled={salvando}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="admin-calendar-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar data'}
              </button>
            </div>
          </form>

          <div className="admin-calendar-list-heading">
            <div>
              <h3>Datas configuradas</h3>
            </div>
            <small>{datas.length}</small>
          </div>

          <div className="admin-calendar-list">
            {carregando ? (
              <p className="admin-calendar-empty">Carregando...</p>
            ) : datasOrdenadas.length === 0 ? (
              <p className="admin-calendar-empty">Nenhuma data importante cadastrada.</p>
            ) : (
              datasOrdenadas.map((item) => (
                <article key={item.id} className="admin-calendar-list-item">
                  <span className={`admin-calendar-type-dot ${getTipoClass(item.tipo)}`} />
                  <div>
                    <strong>{item.titulo}</strong>
                    <span>{formatarData(item.data)} · {item.tipo}</span>
                    {item.descricao && <p>{item.descricao}</p>}
                  </div>
                  <div className="admin-calendar-list-actions">
                    <button type="button" onClick={() => iniciarEdicao(item)}>Editar</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (window.confirm(`Excluir a data "${item.titulo}"?`)) {
                          excluir(item.id);
                        }
                      }}
                      disabled={excluindo === item.id}
                    >
                      {excluindo === item.id ? '...' : 'Excluir'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
          </aside>
        </aside>
      </div>
    </div>
  );
}
