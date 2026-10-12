import { createPortal } from 'react-dom';

// Tela de prova: preserva todas as questões e o salvamento automático de respostas.
export function TelaSimulado({
  simuladoSelecionado,
  questoes,
  tempoRestante,
  respostas,
  salvandoResultado,
  voltarParaSimulados,
  formatarTempo,
  selecionarResposta,
  proximaQuestao,
  finalizarSimulado
}) {
  const respondidas = questoes.filter((item) => Boolean(respostas[item.id])).length;
  const pendentes = questoes.length - respondidas;
  const progresso = questoes.length ? Math.round(100 * respondidas / questoes.length) : 0;
  const tempoCritico = tempoRestante !== null && tempoRestante <= 60;

  function irParaQuestao(index) {
    const destino = document.getElementById(`questao-${index}`);
    destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return createPortal(
    <main className="simulado-fullscreen simulado-prova">
      <div className="simulado-prova-inicio">
        <button type="button" className="simulado-prova-voltar" onClick={voltarParaSimulados} disabled={salvandoResultado}>
          ← Voltar para simulados
        </button>
        <div className="simulado-prova-cabecalho">
          <div>
            <span className="simulado-prova-kicker">Simulado em andamento</span>
            <h1>{simuladoSelecionado.titulo}</h1>
            {simuladoSelecionado.descricao && <p>{simuladoSelecionado.descricao}</p>}
            <p className="simulado-prova-ajuda">Suas respostas são salvas automaticamente neste navegador.</p>
          </div>
          <div className={`simulado-prova-relogio${tempoCritico ? ' critico' : ''}`} aria-label="Tempo restante">
            <span aria-hidden="true">⏱</span>
            <div>
              <small>Tempo restante</small>
              <strong>{formatarTempo(tempoRestante)}</strong>
            </div>
          </div>
        </div>
      </div>

      {questoes.length === 0 ? (
        <section className="stat-card simulado-prova-vazio" role="status">
          <h2>Este simulado ainda não possui questões.</h2>
          <p>O administrador precisa adicionar questões antes de você realizar a prova.</p>
        </section>
      ) : (
        <>
          <section className="simulado-prova-painel" aria-label="Acompanhamento da prova">
            <div className="simulado-prova-progresso-titulos">
              <div>
                <strong>{respondidas} de {questoes.length} questões respondidas</strong>
                <span>{pendentes === 0 ? 'Todas respondidas. Revise antes de finalizar.' : `${pendentes} ${pendentes === 1 ? 'questão pendente' : 'questões pendentes'}`}</span>
              </div>
              <strong className="simulado-prova-porcentagem">{progresso}%</strong>
            </div>
            <div className="simulado-prova-trilha" role="progressbar" aria-label="Questões respondidas" aria-valuemin={0} aria-valuemax={questoes.length} aria-valuenow={respondidas}>
              <span style={{ width: `${progresso}%` }} />
            </div>
            <nav className="simulado-prova-navegacao" aria-label="Ir para uma questão">
              {questoes.map((questao, index) => (
                <button
                  key={questao.id}
                  type="button"
                  className={`simulado-prova-numero ${respostas[questao.id] ? 'respondida' : 'pendente'}`}
                  onClick={() => irParaQuestao(index)}
                  aria-label={`Ir para questão ${index + 1}, ${respostas[questao.id] ? 'respondida' : 'não respondida'}`}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
            <div className="simulado-prova-legenda">
              <span><i className="simulado-legenda-marcador respondida" /> Respondida</span>
              <span><i className="simulado-legenda-marcador pendente" /> Pendente</span>
            </div>
          </section>

          <div className="simulado-prova-questoes">
            {questoes.map((questao, index) => (
              <section className="simulado-prova-questao" id={`questao-${index}`} key={questao.id} aria-labelledby={`titulo-questao-${questao.id}`}>
                <div className="simulado-prova-questao-topo">
                  <span>Questão {index + 1} de {questoes.length}</span>
                  <span className={respostas[questao.id] ? 'respondida' : 'pendente'}>
                    {respostas[questao.id] ? '✓ Respondida' : 'Não respondida'}
                  </span>
                </div>
                {questao.materia && <span className="simulado-prova-materia">{questao.materia}</span>}
                <h2 id={`titulo-questao-${questao.id}`}>{questao.pergunta}</h2>
                <div className="simulado-prova-opcoes" role="group" aria-label={`Alternativas da questão ${index + 1}`}>
                  {[
                    ['A', questao.alternativa_a], ['B', questao.alternativa_b],
                    ['C', questao.alternativa_c], ['D', questao.alternativa_d],
                    ['E', questao.alternativa_e]
                  ].filter(([, texto]) => texto != null && String(texto).trim() !== '').map(([letra, texto]) => (
                    <button
                      key={letra}
                      type="button"
                      className={`simulado-prova-opcao ${respostas[questao.id] === letra ? 'selecionada' : ''}`}
                      disabled={salvandoResultado}
                      onClick={() => selecionarResposta(questao.id, letra)}
                      aria-pressed={respostas[questao.id] === letra}
                    >
                      <span className="simulado-prova-letra" aria-hidden="true">{letra}</span>
                      <span>{texto}</span>
                    </button>
                  ))}
                </div>
                <div className="simulado-prova-questao-rodape">
                  <small>{respostas[questao.id] ? 'Você pode alterar esta resposta antes de finalizar.' : 'Selecione uma alternativa para responder.'}</small>
                  {index < questoes.length - 1 && (
                    <button type="button" className="simulado-prova-proxima" onClick={() => proximaQuestao(index)}>
                      Próxima questão →
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
          <div className="simulado-prova-finalizacao">
            <div>
              <strong>{pendentes === 0 ? 'Tudo pronto para finalizar?' : 'Confira as questões pendentes'}</strong>
              <p>{pendentes === 0
                ? 'Revise suas alternativas e finalize quando estiver pronto.'
                : `Você ainda tem ${pendentes} ${pendentes === 1 ? 'questão sem resposta' : 'questões sem resposta'}. Pode finalizar, mas elas contarão como erros.`}</p>
            </div>
            <button type="button" className="simulado-prova-finalizar" onClick={() => finalizarSimulado(false)} disabled={salvandoResultado}>
              {salvandoResultado ? 'Salvando resultado...' : 'Finalizar simulado →'}
            </button>
          </div>
        </>
      )}
    </main>,
    document.body
  );
}
