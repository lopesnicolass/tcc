import { useEffect, useMemo, useState } from 'react';
import '../../styles/adm/AdminCronogramas.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOTAL_MESES = 12;
const TOTAL_SEMANAS = 4;

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('etecamp_token') ||
    ''
  );
}

function criarGradeVazia(quantidadeMeses = 0) {
  return Array.from({ length: quantidadeMeses }, (_, mesIndex) => ({
    mes: mesIndex + 1,
    semanas: Array.from({ length: TOTAL_SEMANAS }, (_, semanaIndex) => ({
      semana: semanaIndex + 1,
      itens: []
    }))
  }));
}

function preencherGrade(modelo) {
  const grade = criarGradeVazia(Number(modelo?.meses || 0));

  (modelo?.sessoes || []).forEach((item) => {
    const mes = grade[item.mes - 1];
    const semana = mes?.semanas[item.semana - 1];

    if (!semana) return;

    semana.itens.push({
      ordem: Number(item.sessao),
      materiaId: String(item.materia_id),
      topicoId: String(item.topico_id)
    });
  });

  grade.forEach((mes) => {
    mes.semanas.forEach((semana) => {
      semana.itens.sort((a, b) => a.ordem - b.ordem);
    });
  });

  return grade;
}

function contarItens(grade) {
  return grade.reduce(
    (total, mes) =>
      total + mes.semanas.reduce((semanaTotal, semana) => semanaTotal + semana.itens.length, 0),
    0
  );
}

function contarItensMes(grade, mesNumero) {
  const mes = grade[mesNumero - 1];
  if (!mes) return 0;

  return mes.semanas.reduce((total, semana) => total + semana.itens.length, 0);
}

function contarSemanasPreenchidas(grade) {
  return grade.reduce(
    (total, mes) =>
      total + mes.semanas.filter((semana) => semana.itens.length > 0).length,
    0
  );
}

export default function AdminCronogramas() {
  const [cronograma, setCronograma] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(1);
  const [mesesSelecionados, setMesesSelecionados] = useState(0);
  const [grade, setGrade] = useState(() => criarGradeVazia());
  const [formulario, setFormulario] = useState({
    nome: 'Cronograma de estudos',
    descricao: 'Conteúdos organizados pelo administrador em meses e semanas.'
  });
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [modalExclusao, setModalExclusao] = useState(false);

  const opcoesConteudo = useMemo(
    () =>
      materias.flatMap((materia) =>
        (materia.topicos || []).map((topico) => ({
          materiaId: String(materia.id),
          topicoId: String(topico.id),
          materia: materia.nome,
          topico: topico.nome
        }))
      ),
    [materias]
  );

  const totalItens = contarItens(grade);
  const totalSemanas = mesesSelecionados * TOTAL_SEMANAS;
  const semanasPreenchidas = contarSemanasPreenchidas(grade);
  const mesAtual = grade[mesSelecionado - 1];

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    setCarregando(true);
    setErro('');

    try {
      const [respostaCronograma, respostaMaterias] = await Promise.all([
        fetch(`${API_URL}/cronogramas-modelos`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch(`${API_URL}/conteudos/publico`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);

      const dadosCronograma = await respostaCronograma.json();
      const dadosMaterias = await respostaMaterias.json();

      if (!respostaCronograma.ok) {
        throw new Error(dadosCronograma.mensagem || 'Não foi possível carregar o cronograma.');
      }

      if (!respostaMaterias.ok) {
        throw new Error(dadosMaterias.mensagem || 'Não foi possível carregar os conteúdos.');
      }

      const modelo = Array.isArray(dadosCronograma.cronogramas)
        ? dadosCronograma.cronogramas[0]
        : null;

      setCronograma(modelo || null);
      setMesesSelecionados(Number(modelo?.meses || 0));
      setMaterias(Array.isArray(dadosMaterias.materias) ? dadosMaterias.materias : []);
      setEditandoId(modelo?.id || null);
      setGrade(preencherGrade(modelo));
      setMesSelecionado(1);
      setFormulario({
        nome: modelo?.nome || 'Cronograma de estudos',
        descricao: modelo?.descricao || 'Conteúdos organizados pelo administrador em meses e semanas.'
      });
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar a configuração do cronograma.');
    } finally {
      setCarregando(false);
    }
  }

  function alterarItem(mesNumero, semanaNumero, itemOrdem, topicoId) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (mes.mes !== mesNumero) return mes;

        return {
          ...mes,
          semanas: mes.semanas.map((semana) => {
            if (semana.semana !== semanaNumero) return semana;

            return {
              ...semana,
              itens: semana.itens.map((item) => {
                if (item.ordem !== itemOrdem) return item;

                const opcao = opcoesConteudo.find((conteudo) => conteudo.topicoId === String(topicoId));

                return {
                  ...item,
                  topicoId: topicoId || '',
                  materiaId: opcao?.materiaId || ''
                };
              })
            };
          })
        };
      })
    );
  }

  function adicionarItem(mesNumero, semanaNumero) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (mes.mes !== mesNumero) return mes;

        return {
          ...mes,
          semanas: mes.semanas.map((semana) => {
            if (semana.semana !== semanaNumero) return semana;

            const proximaOrdem = semana.itens.length
              ? Math.max(...semana.itens.map((item) => item.ordem)) + 1
              : 1;

            return {
              ...semana,
              itens: [
                ...semana.itens,
                {
                  ordem: proximaOrdem,
                  materiaId: '',
                  topicoId: ''
                }
              ]
            };
          })
        };
      })
    );
  }

  function removerItem(mesNumero, semanaNumero, itemOrdem) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (mes.mes !== mesNumero) return mes;

        return {
          ...mes,
          semanas: mes.semanas.map((semana) => {
            if (semana.semana !== semanaNumero) return semana;

            const itens = semana.itens
              .filter((item) => item.ordem !== itemOrdem)
              .map((item, index) => ({ ...item, ordem: index + 1 }));

            return { ...semana, itens };
          })
        };
      })
    );
  }

  function limparSemana(mesNumero, semanaNumero) {
    setGrade((atual) =>
      atual.map((mes) => {
        if (mes.mes !== mesNumero) return mes;

        return {
          ...mes,
          semanas: mes.semanas.map((semana) =>
            semana.semana === semanaNumero ? { ...semana, itens: [] } : semana
          )
        };
      })
    );
  }

  function limparMes(mesNumero) {
    setGrade((atual) =>
      atual.map((mes) =>
        mes.mes === mesNumero
          ? {
              ...mes,
              semanas: mes.semanas.map((semana) => ({ ...semana, itens: [] }))
            }
          : mes
      )
    );
  }

  function alterarQuantidadeMeses(valor) {
    const quantidade = Number(valor);
    if (!quantidade || quantidade < 1 || quantidade > TOTAL_MESES) {
      setMesesSelecionados(0);
      setGrade(criarGradeVazia());
      setMesSelecionado(1);
      return;
    }

    setMesesSelecionados(quantidade);
    setGrade((atual) => {
      const novaGrade = criarGradeVazia(quantidade);

      novaGrade.forEach((mes) => {
        const anterior = atual[mes.mes - 1];
        if (!anterior) return;

        mes.semanas = mes.semanas.map((semana) => {
          const semanaAnterior = anterior.semanas[semana.semana - 1];
          return semanaAnterior
            ? { ...semana, itens: semanaAnterior.itens }
            : semana;
        });
      });

      return novaGrade;
    });

    setMesSelecionado((atual) => Math.min(atual, quantidade));
  }

  async function salvarCronograma(event) {
    event.preventDefault();
    setMensagem('');
    setErro('');

    if (!formulario.nome.trim()) {
      setErro('Informe um nome para o cronograma.');
      return;
    }

    if (!mesesSelecionados) {
      setErro('Selecione quantos meses faltam para o Vestibulinho.');
      return;
    }

    if (!totalItens) {
      setErro('Adicione pelo menos um conteúdo ao cronograma antes de salvar.');
      return;
    }

    const sessoes = grade.flatMap((mes) =>
      mes.semanas.flatMap((semana) =>
        semana.itens
          .filter((item) => item.topicoId && item.materiaId)
          .map((item) => ({
            mes: mes.mes,
            semana: semana.semana,
            sessao: item.ordem,
            materiaId: Number(item.materiaId),
            topicoId: Number(item.topicoId)
          }))
      )
    );

    if (sessoes.length !== totalItens) {
      setErro('Revise os conteúdos adicionados. Todos os itens precisam ter um conteúdo selecionado.');
      return;
    }

    setSalvando(true);

    try {
      const url = editandoId
        ? `${API_URL}/cronogramas-modelos/${editandoId}`
        : `${API_URL}/cronogramas-modelos`;

      const resposta = await fetch(url, {
        method: editandoId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          descricao: formulario.descricao.trim(),
          meses: mesesSelecionados,
          sessoes
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível salvar o cronograma.');
      }

      setCronograma(dados.cronograma);
      setEditandoId(dados.cronograma.id);
      setMesesSelecionados(Number(dados.cronograma.meses || mesesSelecionados));
      setGrade(preencherGrade(dados.cronograma));
      setMensagem(
        `Cronograma salvo. ${dados.cronograma.sessoes_preenchidas} conteúdos organizados em ${contarSemanasPreenchidas(preencherGrade(dados.cronograma))} semanas.`
      );
    } catch (error) {
      setErro(error.message || 'Erro ao salvar o cronograma.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCronograma() {
    if (!editandoId) return;

    try {
      const resposta = await fetch(`${API_URL}/cronogramas-modelos/${editandoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Não foi possível excluir o cronograma.');
      }

      setCronograma(null);
      setEditandoId(null);
      setGrade(criarGradeVazia());
      setMesesSelecionados(0);
      setMesSelecionado(1);
      setMensagem('Cronograma excluído.');
    } catch (error) {
      setErro(error.message || 'Erro ao excluir o cronograma.');
    } finally {
      setModalExclusao(false);
    }
  }

  if (carregando) {
    return (
      <main className="admin-cronogramas">
        <div className="admin-cronogramas-loading">Carregando cronograma...</div>
      </main>
    );
  }

  return (
    <main className="admin-cronogramas">
      <header className="admin-cronogramas-header">
        <div>
          <span className="admin-cronogramas-eyebrow">PLANO AUTOMÁTICO</span>
          <h1>Cronograma de estudos</h1>
          <p>
            Primeiro, organize os conteúdos em meses e semanas. A divisão desses conteúdos pelos dias de estudo acontece depois, de acordo com a escolha de cada estudante.
          </p>
        </div>
      </header>

      {(mensagem || erro) && (
        <div className={`cronograma-alerta ${erro ? 'erro' : 'sucesso'}`}>
          {erro || mensagem}
        </div>
      )}

      <form className="cronograma-layout" onSubmit={salvarCronograma}>
        <section className="cronograma-admin-card cronograma-resumo-card">
          <div className="cronograma-card-header">
            <div>
              <span className="cronograma-section-kicker">CONFIGURAÇÃO</span>
              <h2>{editandoId ? 'Editar cronograma' : 'Criar cronograma'}</h2>
              <p>O cronograma é único e serve de base para qualquer frequência semanal escolhida pelo estudante.</p>
            </div>
            {editandoId && <span className="cronograma-status-chip">Configurado</span>}
          </div>

          <div className="cronograma-resumo-grid">
            <label className="cronograma-form-group">
              <span>Nome do cronograma</span>
              <input
                value={formulario.nome}
                onChange={(event) => setFormulario((atual) => ({ ...atual, nome: event.target.value }))}
                placeholder="Ex.: Cronograma para o Vestibulinho"
                maxLength={100}
              />
            </label>

            <label className="cronograma-form-group">
              <span>Quantos meses faltam para o Vestibulinho?</span>
              <select
                value={mesesSelecionados || ''}
                onChange={(event) => alterarQuantidadeMeses(event.target.value)}
              >
                <option value="">Selecione</option>
                {Array.from({ length: TOTAL_MESES }, (_, index) => TOTAL_MESES - index).map((mes) => (
                  <option key={mes} value={mes}>
                    {mes} {mes === 1 ? 'mês' : 'meses'}
                  </option>
                ))}
              </select>
            </label>

            <label className="cronograma-form-group">
              <span>Descrição</span>
              <textarea
                value={formulario.descricao}
                onChange={(event) => setFormulario((atual) => ({ ...atual, descricao: event.target.value }))}
                placeholder="Explique como o cronograma foi organizado."
                rows={3}
                maxLength={300}
              />
            </label>
          </div>

          <div className="cronograma-estatisticas">
            <div>
              <strong>{mesesSelecionados || 0}</strong>
              <span>{mesesSelecionados === 1 ? 'mês definido' : 'meses definidos'}</span>
            </div>
            <div>
              <strong>{totalSemanas}</strong>
              <span>semanas disponíveis</span>
            </div>
            <div>
              <strong>{totalItens}</strong>
              <span>conteúdos cadastrados</span>
            </div>
          </div>
        </section>

        <section className="cronograma-admin-card cronograma-periodo-card">
          <div className="cronograma-card-header">
            <div>
              <span className="cronograma-section-kicker">PERÍODO</span>
              <h2>{mesesSelecionados ? 'Meses do cronograma' : 'Defina o período do cronograma'}</h2>
              <p>{mesesSelecionados ? `Foram criados ${mesesSelecionados} ${mesesSelecionados === 1 ? 'mês' : 'meses'}, cada um com 4 semanas. Agora você adiciona os conteúdos de cada semana.` : 'Selecione acima quantos meses faltam para o Vestibulinho. Depois disso, os meses e as semanas aparecerão aqui.'}</p>
            </div>
            <button
              type="button"
              className="cronograma-btn secundario"
              onClick={() => limparMes(mesSelecionado)}
              disabled={!mesAtual || !contarItensMes(grade, mesSelecionado)}
            >
              Limpar mês
            </button>
          </div>

          {mesesSelecionados ? (
            <div className="cronograma-meses-grid">
              {grade.map((mes) => {
                const quantidade = contarItensMes(grade, mes.mes);
                return (
                  <button
                    key={mes.mes}
                    type="button"
                    className={`cronograma-mes-card ${mesSelecionado === mes.mes ? 'selecionado' : ''}`}
                    onClick={() => setMesSelecionado(mes.mes)}
                  >
                    <strong>Mês {mes.mes}</strong>
                    <span>{quantidade} {quantidade === 1 ? 'conteúdo' : 'conteúdos'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="cronograma-semana-vazia">
              <strong>Nenhum mês foi criado ainda.</strong>
              <span>Selecione a quantidade de meses acima para criar a estrutura do cronograma.</span>
            </div>
          )}
        </section>

        <section className="cronograma-admin-card cronograma-semanas-card">
          <div className="cronograma-card-header">
            <div>
              <span className="cronograma-section-kicker">MÊS {mesSelecionado}</span>
              <h2>Organização das semanas</h2>
              <p>Adicione os conteúdos que deverão ser estudados em cada semana. A divisão por dias será feita depois, no plano do estudante.</p>
            </div>
            <span className="cronograma-item-count">{mesAtual ? `${contarItensMes(grade, mesSelecionado)} conteúdos` : 'Selecione um mês'}</span>
          </div>

          {mesAtual ? (
          <div className="cronograma-semanas-stack">
            {mesAtual.semanas.map((semana) => (
              <article className="cronograma-semana-block" key={semana.semana}>
                <div className="cronograma-semana-top">
                  <div>
                    <span className="cronograma-section-kicker">SEMANA {semana.semana}</span>
                    <h3>
                      {semana.itens.length
                        ? `${semana.itens.length} ${semana.itens.length === 1 ? 'conteúdo definido' : 'conteúdos definidos'}`
                        : 'Nenhum conteúdo definido'}
                    </h3>
                  </div>
                  <div className="cronograma-semana-actions">
                    <button
                      type="button"
                      className="cronograma-btn secundario small"
                      onClick={() => adicionarItem(mesSelecionado, semana.semana)}
                    >
                      + Adicionar conteúdo
                    </button>
                    <button
                      type="button"
                      className="cronograma-btn texto small"
                      onClick={() => limparSemana(mesSelecionado, semana.semana)}
                      disabled={!semana.itens.length}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {semana.itens.length ? (
                  <div className="cronograma-itens-lista">
                    {semana.itens.map((item) => (
                      <div className="cronograma-item-row" key={item.ordem}>
                        <span className="cronograma-item-numero">{item.ordem}</span>
                        <div className="cronograma-item-select-wrap">
                          <span>Conteúdo da semana</span>
                          <select
                            value={item.topicoId}
                            onChange={(event) => alterarItem(mesSelecionado, semana.semana, item.ordem, event.target.value)}
                          >
                            <option value="">Selecione matéria e conteúdo</option>
                            {opcoesConteudo.map((opcao) => (
                              <option key={opcao.topicoId} value={opcao.topicoId}>
                                {opcao.materia} — {opcao.topico}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="cronograma-item-remover"
                          onClick={() => removerItem(mesSelecionado, semana.semana, item.ordem)}
                          aria-label="Remover conteúdo"
                          title="Remover conteúdo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cronograma-semana-vazia">
                    <strong>Semana ainda não configurada</strong>
                    <span>Adicione os conteúdos que farão parte desta semana.</span>
                    <button
                      type="button"
                      className="cronograma-btn principal small"
                      onClick={() => adicionarItem(mesSelecionado, semana.semana)}
                    >
                      Adicionar conteúdo
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          ) : (
            <div className="cronograma-semana-vazia">
              <strong>Selecione a quantidade de meses.</strong>
              <span>Depois, escolha um mês para cadastrar seus conteúdos por semana.</span>
            </div>
          )}
        </section>

        <div className="cronograma-programacao-acoes">
          <button className="cronograma-btn principal grande" type="submit" disabled={salvando || !mesesSelecionados}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar cronograma'}
          </button>
        </div>
      </form>

      {cronograma && (
        <section className="cronograma-admin-card cronograma-configurado-card">
          <div className="cronograma-card-header">
            <div>
              <span className="cronograma-section-kicker">CRONOGRAMA ATUAL</span>
              <h2>{cronograma.nome}</h2>
              <p>{cronograma.descricao || 'Sem descrição cadastrada.'}</p>
            </div>
            <div className="cronograma-configurado-actions">
              <span>{cronograma.sessoes_preenchidas} conteúdos</span>
              <button type="button" className="cronograma-btn perigo small" onClick={() => setModalExclusao(true)}>
                Excluir cronograma
              </button>
            </div>
          </div>
        </section>
      )}

      {modalExclusao && (
        <div className="cronograma-modal-backdrop" role="presentation" onMouseDown={() => setModalExclusao(false)}>
          <div className="cronograma-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className="cronograma-section-kicker">EXCLUIR CRONOGRAMA</span>
            <h2>Excluir o cronograma atual?</h2>
            <p>
              Os conteúdos organizados nos meses e semanas do cronograma serão removidos da configuração do plano automático. Os conteúdos cadastrados na plataforma continuam intactos.
            </p>
            <div className="cronograma-modal-actions">
              <button className="cronograma-btn secundario" type="button" onClick={() => setModalExclusao(false)}>
                Cancelar
              </button>
              <button className="cronograma-btn perigo" type="button" onClick={excluirCronograma}>
                Excluir cronograma
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
