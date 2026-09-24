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
    carregarDatas();
  }, []);

  const datasOrdenadas = useMemo(
    () => [...datas].sort((a, b) => String(a.data).localeCompare(String(b.data))),
    [datas]
  );

  const proximaData = useMemo(() => {
    const hoje = dateKey(new Date());
    return datasOrdenadas.find((item) => item.data >= hoje) || null;
  }, [datasOrdenadas]);

  const diasDoMes = useMemo(() => {
    const primeiro = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + index);
      return dia;
    });
  }, [mesAtual]);

  const datasDoMes = useMemo(
    () =>
      datas.filter((item) => {
        const [ano, mes] = String(item.data || '').split('-');
        return (
          Number(ano) === mesAtual.getFullYear() &&
          Number(mes) === mesAtual.getMonth() + 1
        );
      }),
    [datas, mesAtual]
  );

  function alterarForm(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setMensagem('');
    setErro('');
  }

  function iniciarEdicao(data) {
    setEditando(data.id);
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

  return (
    <div className="admin-calendar-page">
      <header className="admin-calendar-header">
        <div>
          <span className="admin-calendar-eyebrow">CALENDÁRIO DO VESTIBULINHO</span>
          <h1>Datas importantes</h1>
          <p>
            Cadastre as datas que os estudantes precisam acompanhar, como inscrições,
            prova e divulgação de resultados.
          </p>
        </div>
      </header>

      <section className="admin-calendar-stats">
        <article>
          <span>Datas cadastradas</span>
          <strong>{datas.length}</strong>
        </article>

        <article>
          <span>Datas neste mês</span>
          <strong>{datasDoMes.length}</strong>
        </article>

        <article>
          <span>Próxima data</span>
          <strong>{proximaData ? formatarData(proximaData.data) : '—'}</strong>
        </article>
      </section>

      {mensagem && <div className="admin-calendar-feedback success">{mensagem}</div>}
      {erro && <div className="admin-calendar-feedback error">{erro}</div>}

      <div className="admin-calendar-layout">
        <section className="admin-calendar-month-card">
          <div className="admin-calendar-toolbar">
            <div>
              <span>VISUALIZAÇÃO</span>
              <h2>{mesLabel(mesAtual)}</h2>
            </div>

            <div className="admin-calendar-month-actions">
              <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
                ‹
              </button>
              <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">
                ›
              </button>
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
                <div
                  key={chave}
                  className={`admin-calendar-day ${foraDoMes ? 'outside' : ''}`}
                >
                  <span className="admin-calendar-day-number">{dia.getDate()}</span>

                  {eventos.slice(0, 3).map((evento) => (
                    <button
                      type="button"
                      key={evento.id}
                      className={`admin-calendar-event ${getTipoClass(evento.tipo)}`}
                      onClick={() => iniciarEdicao(evento)}
                      title="Editar data"
                    >
                      <strong>{evento.titulo}</strong>
                    </button>
                  ))}

                  {eventos.length > 3 && (
                    <span className="admin-calendar-more">+{eventos.length - 3} mais</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="admin-calendar-form-card">
          <div className="admin-calendar-form-heading">
            <span>{editando ? 'EDITAR DATA' : 'NOVA DATA'}</span>
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
                <select
                  value={form.tipo}
                  onChange={(event) => alterarForm('tipo', event.target.value)}
                  disabled={salvando}
                >
                  {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </label>

              <label>
                Data
                <input
                  type="date"
                  value={form.data}
                  onChange={(event) => alterarForm('data', event.target.value)}
                  disabled={salvando}
                />
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
              <span>CADASTRO</span>
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
      </div>
    </div>
  );
}
