import '../../styles/aluno/PlanoAutomatico.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from "../../context/GamificationContext.jsx";
import SubjectIcon from "../../components/SubjectIcon.jsx";
import Icon from "../../components/Icon.jsx";

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const DAYS_BY_COUNT = {
  1: ['Quarta'],
  2: ['Terça', 'Quinta'],
  3: ['Segunda', 'Quarta', 'Sexta'],
  4: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
  5: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  6: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  7: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
};

const STORAGE_KEY = 'tenna_plano_automatico';

const pad = (n) => String(n).padStart(2, '0');

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('etecamp_usuario') || '{}');
  } catch {
    return {};
  }
}

function getUserKey() {
  const usuario = getUser();
  return String(usuario.id || usuario.usuarioId || 'anonimo');
}

function getToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

function agruparItensPorSemana(sessoes) {
  const mapa = new Map();

  (Array.isArray(sessoes) ? sessoes : []).forEach((item) => {
    const chave = `${item.mes}-${item.semana}`;
    const lista = mapa.get(chave) || [];
    lista.push(item);
    mapa.set(chave, lista);
  });

  mapa.forEach((lista) => {
    lista.sort((a, b) => {
      const diaA = Number(a.dia_estudo || 1);
      const diaB = Number(b.dia_estudo || 1);
      if (diaA !== diaB) return diaA - diaB;
      return Number(a.sessao) - Number(b.sessao);
    });
  });

  return mapa;
}

function listarSemanasFaltantes(cronograma, months) {
  const mapa = agruparItensPorSemana(cronograma?.sessoes);
  const faltantes = [];

  for (let mes = 1; mes <= months; mes += 1) {
    for (let semana = 1; semana <= 4; semana += 1) {
      const itens = mapa.get(`${mes}-${semana}`) || [];
      if (!itens.length) {
        faltantes.push({ mes, semana });
      }
    }
  }

  return faltantes;
}

function distribuirItensNosDias(itens, quantidadeDias) {
  const dias = Array.from({ length: quantidadeDias }, () => []);

  itens.forEach((item) => {
    const diaAdministrado = Number(item.dia_estudo || 1);
    if (diaAdministrado < 1 || diaAdministrado > quantidadeDias) return;
    dias[diaAdministrado - 1].push(item);
  });

  return dias;
}

function generatePlan(months, days, sessoes) {
  if (!Array.isArray(sessoes) || !sessoes.length) {
    return [];
  }

  const daysList = DAYS_BY_COUNT[days] || DAYS_BY_COUNT[3];
  const semanasPorMes = agruparItensPorSemana(sessoes);
  const now = new Date();

  return Array.from({ length: months }, (_, monthIndex) => {
    const date = new Date(now.getFullYear(), now.getMonth() + monthIndex, 1);

    const semanas = Array.from({ length: 4 }, (_, weekIndex) => {
      const itensSemana = semanasPorMes.get(`${monthIndex + 1}-${weekIndex + 1}`) || [];
      const distribuicao = distribuirItensNosDias(itensSemana, daysList.length);

      return {
        number: weekIndex + 1,
        days: daysList.map((day, dayIndex) => ({
          day,
          items: distribuicao[dayIndex].map((item) => ({
            materia: item.materia,
            materiaId: item.materia_id,
            topico: item.topico,
            topicoId: item.topico_id,
            descricao: item.topico_descricao || '',
            key: `topico:${item.topico_id}`,
            diaEstudo: Number(item.dia_estudo || dayIndex + 1)
          }))
        }))
      };
    });

    return {
      numero: monthIndex + 1,
      nome: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      semanas
    };
  });
}

function savePlan(plan) {
  localStorage.setItem(`${STORAGE_KEY}_${getUserKey()}`, JSON.stringify(plan));
}

export default function PlanoAutomatico() {
  const navigate =
    useNavigate();

  const { addXP } =
    useGamification();

  const [months, setMonths] =
    useState(6);

  const [days, setDays] =
    useState(3);

  const [plan, setPlan] =
    useState(null);

  const [selected, setSelected] =
    useState(1);

  const [openWeeks, setOpenWeeks] =
    useState(
      new Set(['1-1'])
    );

  const [addingWeek, setAddingWeek] =
    useState(null);

  const [syncingPlan, setSyncingPlan] =
    useState(false);

  const [syncError, setSyncError] =
    useState('');

  const [cronogramaModelo, setCronogramaModelo] =
    useState(null);

  const [carregandoModelo, setCarregandoModelo] =
    useState(true);

  const [modeloError, setModeloError] =
    useState('');

  useEffect(() => {
    async function carregarCronogramaModelo() {
      setCarregandoModelo(true);
      setModeloError('');
      setCronogramaModelo(null);
      setPlan(null);

      try {
        const response = await fetch(
          `${API_URL}/cronogramas-modelos/ativo`,
          {
            headers: {
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensagem ||
              'O administrador ainda não configurou o cronograma de estudos.'
          );
        }

        const modelo = data.cronograma || null;
        setCronogramaModelo(modelo);
        setMonths(Number(modelo?.meses || 1));
      } catch (error) {
        console.error('Erro ao carregar cronograma automático:', error);
        setCronogramaModelo(null);
        setModeloError(
          error.message ||
            'Não foi possível carregar o cronograma automático.'
        );
      } finally {
        setCarregandoModelo(false);
      }
    }

    carregarCronogramaModelo();
  }, []);

  const phases = [
    'Fundamentos',
    'Construção de conhecimento',
    'Aprofundamento',
    'Prática',
    'Revisão',
    'Simulados'
  ];

  const current =
    plan?.find(
      (m) =>
        m.numero ===
        selected
    ) ||
    plan?.[0];

  const progress =
    useMemo(() => {
      if (!plan) {
        return 0;
      }

      try {
        const done =
          JSON.parse(
            localStorage.getItem(
              `conteudosEstudados_${getUserKey()}`
            ) || '{}'
          );

        const keys = [
          ...new Set(
            plan.flatMap((m) =>
              m.semanas.flatMap((w) =>
                w.days.flatMap((d) => d.items.map((item) => item.key))
              )
            )
          )
        ];

        return keys.length
          ? Math.round(
              keys.filter(
                (k) =>
                  done[k]
              ).length /
                keys.length *
                100
            )
          : 0;

      } catch {
        return 0;
      }
    }, [plan]);

  function montarAtividadesDoPlano(p) {
    const hoje = new Date();
    const nomesDias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];

    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());

    const atividades = [];

    p.forEach((month) => {
      month.semanas.forEach((week) => {
        week.days.forEach((day) => {
          if (!day.items.length) return;

          const indiceDia = nomesDias.indexOf(day.day);
          const alvo = new Date(domingo);

          alvo.setDate(
            domingo.getDate() +
              indiceDia +
              7 * (month.numero - 1) +
              7 * (week.number - 1)
          );

          const dataFinal =
            day.data ||
            `${alvo.getFullYear()}-${pad(alvo.getMonth() + 1)}-${pad(alvo.getDate())}`;

          day.items.forEach((item) => {
            atividades.push({
              data: dataFinal,
              horario: '08:00',
              nome: item.topico,
              materia: item.materia,
              topicoId: item.topicoId || null,
              done: false,
              origem: 'plano-automatico'
            });
          });
        });
      });
    });

    return atividades;
  }

  async function generate() {
    if (!cronogramaModelo || !cronogramaModelo.sessoes?.length) {
      setSyncError('O administrador ainda não configurou o cronograma de estudos.');
      return;
    }

    const faltantes = listarSemanasFaltantes(cronogramaModelo, months);

    if (faltantes.length) {
      const primeiro = faltantes[0];
      setSyncError(
        `O cronograma ainda não está completo até o mês ${months}. Falta configurar a semana ${primeiro.semana} do mês ${primeiro.mes}.`
      );
      return;
    }

    const mesesDoCronograma = Number(cronogramaModelo.meses || 0);
    if (!mesesDoCronograma) {
      setSyncError('O cronograma do administrador ainda não possui a quantidade de meses configurada.');
      return;
    }

    const p = generatePlan(mesesDoCronograma, days, cronogramaModelo.sessoes);

    setPlan(p);
    setSelected(1);
    setOpenWeeks(new Set(['1-1']));
    savePlan(p);

    addXP(20, 'plano automático gerado');

    const usuarioId = Number(getUser().id || getUser().usuarioId || 0);
    const token = getToken();

    if (!usuarioId) {
      return;
    }

    const atividades = montarAtividadesDoPlano(p);

    if (!atividades.length) {
      return;
    }

    try {
      setSyncingPlan(true);
      setSyncError('');

      const response = await fetch(`${API_URL}/cronograma/${usuarioId}/lote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          atividades,
          substituirOrigem: 'plano-automatico'
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            'Não foi possível salvar o plano no cronograma.'
        );
      }
    } catch (erro) {
      console.error('Erro ao salvar plano no cronograma:', erro);
      setSyncError(
        erro.message ||
          'O plano foi gerado, mas não foi possível salvá-lo no cronograma.'
      );
    } finally {
      setSyncingPlan(false);
    }
  }

  async function addWeek(month, week) {
    const usuarioId = Number(getUser().id || getUser().usuarioId || 0);
    const token = getToken();

    if (!usuarioId) return;

    const hoje = new Date();
    const nomesDias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];
    const domingo = new Date(hoje);
    domingo.setDate(hoje.getDate() - hoje.getDay());
    const atividades = [];

    week.days.forEach((day) => {
      if (!day.items.length) return;

      const indiceDia = nomesDias.indexOf(day.day);
      const alvo = new Date(domingo);
      alvo.setDate(
        domingo.getDate() +
          indiceDia +
          7 * (month.numero - 1) +
          7 * (week.number - 1)
      );

      const dataFinal =
        day.data ||
        `${alvo.getFullYear()}-${pad(alvo.getMonth() + 1)}-${pad(alvo.getDate())}`;

      day.items.forEach((item) => {
        atividades.push({
          data: dataFinal,
          horario: '08:00',
          nome: item.topico,
          materia: item.materia,
          topicoId: item.topicoId || null,
          done: false,
          origem: 'plano-automatico'
        });
      });
    });

    if (!atividades.length) return;

    try {
      setAddingWeek(`${month.numero}-${week.number}`);

      const response = await fetch(`${API_URL}/cronograma/${usuarioId}/lote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          atividades,
          substituirOrigem: null
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            'Não foi possível adicionar a semana ao calendário.'
        );
      }

      addXP(10, 'semana adicionada ao calendário');
      navigate('/cronograma');
    } catch (erro) {
      console.error('Erro ao adicionar semana:', erro);
      window.alert(
        erro.message ||
          'Não foi possível adicionar a semana ao calendário.'
      );
    } finally {
      setAddingWeek(null);
    }
  }

  const focoItem =
    current?.semanas
      ?.flatMap((week) => week.days.flatMap((day) => day.items))
      ?.find(Boolean);

  const focoMateria = focoItem?.materia;
  const focoTopico = focoItem?.topico;

  return (
    <div className="tenna-auto-plan">

      <section className="tenna-auto-intro">

        <div className="tenna-auto-intro-copy">

          <span className="tenna-auto-kicker">
            PLANO AUTOMÁTICO
          </span>

          <h2>
            Uma jornada para você saber{' '}
            <span>
              o que estudar
            </span>
          </h2>

          <p>
            O Tenna organiza os conteúdos
            para o Vestibulinho em meses e semanas.
            O administrador também define o Dia 1, Dia 2 e assim por diante,
            e você escolhe quantos dias consegue estudar por semana.
          </p>

        </div>

        <div className="tenna-auto-intro-badge">

          <Icon
            name="target"
            size={26}
            color="#fff"
          />

          <small>
            Seu foco
          </small>

        </div>

      </section>

      <section className="tenna-auto-config">

        <div className="tenna-auto-config-head">

          <div className="tenna-auto-config-title">

  <div>

    <h3>
      Monte seu plano
    </h3>

    <p>
      O administrador definiu o período do cronograma. Você só precisa escolher quantos dias consegue estudar por semana.
    </p>

    {plan && (
      <span className="tenna-auto-ready">
        ✓ Plano criado
      </span>
    )}

  </div>

</div>

          <div className="tenna-auto-personalized">
            <div className="tenna-auto-personalized-icon">
              <Icon
                name="target"
                size={27}
                color="var(--accent-dark)"
              />
            </div>

            <div className="tenna-auto-personalized-copy">
              <strong>Seu plano será adaptado ao seu ritmo</strong>
              <span>✓ Aproveita o cronograma definido pelo administrador</span>
              <span>✓ Usa a distribuição de Dias 1 a 7 definida pelo administrador</span>
              <span>✓ Relaciona esses dias aos seus dias de estudo da semana</span>
            </div>

            <div className="tenna-auto-personalized-deco" aria-hidden="true">✦</div>
          </div>

        </div>

        <div className="tenna-auto-options">

          <div className="tenna-auto-option-group">

            <span className="tenna-auto-label">
              Período do cronograma
            </span>

            <div className="tenna-auto-pills">
              <div className="tenna-auto-pill selected" aria-label="Período definido pelo administrador">
                <strong>{months}</strong>
                <span>{months === 1 ? 'mês definido' : 'meses definidos'}</span>
              </div>
            </div>

          </div>

          <div className="tenna-auto-option-group">

            <span className="tenna-auto-label">
              Dias de estudo por semana
            </span>

            <div className="tenna-auto-pills days">

              {[1, 2, 3, 4, 5, 6, 7].map(
                (d) => (

                  <button
                    key={d}
                    type="button"
                    className={
                      `tenna-auto-pill ${
                        days === d
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setDays(d)
                    }
                  >

                    <strong>
                      {d}x
                    </strong>

                    <span>
                      por semana
                    </span>

                  </button>

                )
              )}

            </div>

          </div>

        </div>

        <div className="tenna-auto-config-bottom">

          <div className="tenna-auto-config-note-wrap">
            {carregandoModelo ? (
              <span className="tenna-auto-config-note">
                <Icon name="book" size={14} color="var(--accent-dark)" />
                Carregando o cronograma definido pelo administrador...
              </span>
            ) : cronogramaModelo ? (
              <span className="tenna-auto-config-note">
                <Icon name="book" size={14} color="var(--accent-dark)" />
                Cronograma oficial: <strong>{cronogramaModelo.nome}</strong> · {cronogramaModelo.meses} {cronogramaModelo.meses === 1 ? 'mês' : 'meses'} · {cronogramaModelo.sessoes_preenchidas} conteúdos organizados por mês, semana e dia de estudo
              </span>
            ) : (
              <span className="tenna-auto-config-note error">
                <Icon name="book" size={14} color="var(--accent-dark)" />
                {modeloError || 'O administrador ainda não configurou um cronograma automático.'}
              </span>
            )}
          </div>

          <button
            className="mural-btn primary"
            onClick={generate}
            disabled={syncingPlan || carregandoModelo || !cronogramaModelo}
          >
            {syncingPlan
              ? 'Gerando e salvando...'
              : 'Gerar meu plano'}
          </button>

          {syncError && (
            <span className="tenna-auto-error">
              {syncError}
            </span>
          )}

        </div>

      </section>

      {plan && (

        <div className="tenna-auto-result">

          <section className="tenna-auto-next">

            <div className="tenna-auto-next-icon">
              <SubjectIcon
                materia={
                  focoMateria
                }
                size={20}
              />
            </div>

            <div className="tenna-auto-next-info">

              <span>
                PRÓXIMO FOCO
              </span>

              <strong>
                {focoMateria}
              </strong>

              <p>
                {focoTopico}
              </p>

            </div>

            <button
              className="tenna-auto-next-button"
              onClick={() =>
                navigate(
                  '/conteudos'
                )
              }
            >
              Estudar conteúdo

              <Icon
                name="arrowRight"
                size={14}
              />

            </button>

          </section>

          <section className="tenna-auto-journey">

            <div className="tenna-auto-journey-head">

              <div>

                <span className="tenna-auto-step">
                  02
                </span>

                <div>

                  <h3>
                    Sua jornada
                  </h3>

                  <p>
                    {months}{' '}
                    {months === 1 ? 'mês' : 'meses'}
                    {' · '}
                    {days}x por semana
                  </p>

                </div>

              </div>

              <div className="tenna-auto-progress-value">

                <strong>
                  {progress}%
                </strong>

                <span>
                  concluído
                </span>

              </div>

            </div>

            <div className="tenna-auto-progress-track">

              <span
                style={{
                  width:
                    `${progress}%`
                }}
              />

            </div>

            <div className="tenna-auto-timeline-wrap">

              <div className="tenna-auto-timeline-line" />

              <div className="tenna-auto-timeline">

                {plan.map(
                  (m) => (

                    <button
                      key={
                        m.numero
                      }
                      className={
                        `tenna-auto-timeline-item ${
                          m.numero ===
                          selected
                            ? 'active'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setSelected(
                          m.numero
                        )
                      }
                    >

                      <span className="tenna-auto-timeline-dot">
                        {m.numero}
                      </span>

                      <strong>
                        Mês {m.numero}
                      </strong>

                      <small>
                        {m.numero === 1
                          ? 'Começo'
                          : m.numero ===
                              months
                            ? 'Reta final'
                            : 'Preparação'}
                      </small>

                    </button>

                  )
                )}

              </div>

            </div>

          </section>

          <section className="tenna-auto-month">

            <div className="tenna-auto-month-head">

              <div className="tenna-auto-month-title">

                <div
                  className="tenna-auto-month-icon"
                  style={{
                    color:
                      'var(--accent-dark)'
                  }}
                >
                  <Icon
                    name="calendar"
                    size={22}
                  />
                </div>

                <div>

                  <span>
                    MÊS {current.numero}
                    {' · '}
                    {
                      phases[
                        Math.min(
                          current.numero -
                            1,
                          phases.length -
                            1
                        )
                      ]
                    }
                  </span>

                  <h3>
                    {current.nome}
                  </h3>

                  <p>
                    {current.semanas.reduce(
                      (n, w) =>
                        n +
                        w.days.filter((day) => day.items.length).length,
                      0
                    )}
                    {' dias de estudo organizados'}
                  </p>

                </div>

              </div>

              <div className="tenna-auto-month-count">

                <strong>
                  {current.semanas.length}
                </strong>

                <span>
                  semanas
                </span>

              </div>

            </div>

            <div className="tenna-auto-weeks">

              {current.semanas.map(
                (w) => {

                  const key =
                    `${current.numero}-${w.number}`;

                  const open =
                    openWeeks.has(
                      key
                    );

                  const adding =
                    addingWeek ===
                    key;

                  return (

                    <article
                      className={
                        `tenna-auto-week ${
                          open
                            ? 'open'
                            : ''
                        }`
                      }
                      key={key}
                    >

                      <button
                        className="tenna-auto-week-head"
                        onClick={() =>
                          setOpenWeeks(
                            (prev) => {
                              const n =
                                new Set(
                                  prev
                                );

                              n.has(
                                key
                              )
                                ? n.delete(
                                    key
                                  )
                                : n.add(
                                    key
                                  );

                              return n;
                            }
                          )
                        }
                      >

                        <span className="tenna-auto-week-number">
                          {pad(
                            w.number
                          )}
                        </span>

                        <span className="tenna-auto-week-title">

                          <strong>
                            Semana {w.number}
                          </strong>

                          <small>
                            {w.days.filter((day) => day.items.length).length}
                            {' dias com conteúdo'}
                          </small>

                        </span>

                        <span className="tenna-auto-week-status">

                          {open
                            ? 'Fechar'
                            : 'Ver semana'}

                          <b>
                            ›
                          </b>

                        </span>

                      </button>

                      {open && (

                        <div className="tenna-auto-week-body">

                          <div className="tenna-auto-day-list">

                            {w.days.map(
                              (d, i) => {
                                const primeiroItem = d.items[0];

                                return (
                                  <div
                                    className={`tenna-auto-day ${d.items.length ? '' : 'empty'}`}
                                    key={i}
                                  >
                                    <div className="tenna-auto-day-name">
                                      {d.day.slice(0, 3).toUpperCase()}
                                    </div>

                                    <div className="tenna-auto-day-icon">
                                      <SubjectIcon
                                        materia={primeiroItem?.materia || 'Estudo'}
                                        size={16}
                                      />
                                    </div>

                                    <div className="tenna-auto-day-content">
                                      {d.items.length ? (
                                        d.items.map((item, itemIndex) => (
                                          <div className="tenna-auto-day-item" key={itemIndex}>
                                            <strong>{item.materia}</strong>
                                            <span>{item.topico}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="tenna-auto-day-item vazio">
                                          <strong>Dia reservado</strong>
                                          <span>Nenhum conteúdo foi distribuído para este dia.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}

                          </div>

                          <button
                            className="mural-btn primary"
                            onClick={() =>
                              addWeek(
                                current,
                                w
                              )
                            }
                            disabled={adding}
                          >
                            {adding
                              ? 'Adicionando...'
                              : '+ Adicionar semana ao meu calendário'}
                          </button>

                        </div>

                      )}

                    </article>

                  );
                }
              )}

            </div>

          </section>

        </div>

      )}

    </div>
  );
}