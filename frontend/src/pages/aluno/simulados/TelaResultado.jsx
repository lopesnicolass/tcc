import { createPortal } from 'react-dom';

// Resultado e correção mantêm os dados oficiais retornados pelo backend.
export function TelaResultado({
  simuladoSelecionado,
  resultadoFinal,
  tempoGasto,
  mostrarErros,
  setMostrarErros,
  refazerSimulado,
  voltarParaSimulados,
  formatarTempo
}) {
  const aproveitamento = Number(resultadoFinal.porcentagem || 0);
  const detalhes = Array.isArray(resultadoFinal.detalhes) ? resultadoFinal.detalhes : [];

  return createPortal(
    <main className="simulado-fullscreen simulado-resultado-screen">
      <div className="simulado-resultado-container">
        <header className="simulado-resultado-cabecalho">
          <span className="simulado-resultado-kicker">Seu desempenho</span>
          <h1>Resultado do simulado</h1>
          <p>{simuladoSelecionado.titulo}</p>
        </header>

        <section className="simulado-resultado-resumo" aria-label="Resumo do resultado">
          <div className="simulado-resultado-principal">
            <span className="simulado-resultado-sobretitulo">Simulado finalizado</span>
            <strong className="simulado-resultado-nota">{aproveitamento.toFixed(1)}%</strong>
            <span className="simulado-resultado-nota-legenda">de aproveitamento</span>
            <div className="simulado-resultado-barra" role="progressbar" aria-label="Aproveitamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={aproveitamento}>
              <span style={{ width: `${Math.min(100, Math.max(0, aproveitamento))}%` }} />
            </div>
            <p>Você acertou <strong>{resultadoFinal.acertos}</strong> de <strong>{resultadoFinal.totalQuestoes}</strong> questões.</p>
          </div>
          <div className="simulado-resultado-numeros">
            <div className="simulado-resultado-numero acertos"><strong>{resultadoFinal.acertos}</strong><span>Acertos</span></div>
            <div className="simulado-resultado-numero erros"><strong>{resultadoFinal.erros}</strong><span>Erros</span></div>
            <div className="simulado-resultado-numero tempo"><strong>{formatarTempo(tempoGasto)}</strong><span>Tempo gasto</span></div>
          </div>
          <div className="simulado-resultado-acoes">
            <button type="button" className="simulado-resultado-botao principal" aria-expanded={mostrarErros} onClick={() => setMostrarErros(!mostrarErros)}>{mostrarErros ? 'Ocultar correção' : 'Ver correção'}</button>
            <button type="button" className="simulado-resultado-botao secundario" onClick={refazerSimulado}>Refazer simulado</button>
            <button type="button" className="simulado-resultado-botao discreto" onClick={voltarParaSimulados}>Voltar aos simulados</button>
          </div>
        </section>

        {mostrarErros && (
          <section className="simulado-resultado-correcao" aria-labelledby="simulado-correcao-titulo">
            <div className="simulado-resultado-correcao-heading">
              <h2 id="simulado-correcao-titulo">Correção das questões</h2>
              <p>Confira suas respostas e as alternativas corretas.</p>
            </div>
            <div className="simulado-resultado-questoes">
              {detalhes.map(({ questao, index, respostaUsuario, respostaCorreta, acertou }) => (
                <article key={questao.id} className={`simulado-resultado-questao ${acertou ? 'acertou' : 'errou'}`}>
                  <div className="simulado-resultado-questao-topo">
                    <span>Questão {index + 1}</span>
                    <span className={`simulado-resultado-estado ${acertou ? 'certo' : 'incorreto'}`}>{acertou ? 'Correta' : respostaUsuario ? 'Incorreta' : 'Não respondida'}</span>
                  </div>
                  <h3>{questao.pergunta}</h3>
                  <div className="simulado-resultado-alternativas">
                    {[
                      ['A', questao.alternativa_a],
                      ['B', questao.alternativa_b],
                      ['C', questao.alternativa_c],
                      ['D', questao.alternativa_d],
                      ['E', questao.alternativa_e]
                    ].filter(([, texto]) => texto != null && String(texto).trim() !== '').map(([letra, texto]) => {
                      const ehCorreta = letra === respostaCorreta;
                      const foiSelecionada = letra === respostaUsuario;
                      return (
                        <div key={letra} className={`simulado-resultado-alternativa ${ehCorreta ? 'correta' : ''} ${foiSelecionada && !ehCorreta ? 'errada' : ''}`}>
                          <span className="simulado-resultado-letra">{letra}</span>
                          <span className="simulado-resultado-alternativa-texto">{texto}</span>
                          {ehCorreta && <strong className="simulado-resultado-indicador-certo">Correta</strong>}
                          {foiSelecionada && !ehCorreta && <strong className="simulado-resultado-indicador-errado">Sua resposta</strong>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="simulado-resultado-explicacao">
                    {acertou ? 'Você acertou esta questão.' : respostaUsuario ? `Você marcou ${respostaUsuario}. A resposta correta é ${respostaCorreta}.` : `Questão não respondida. A resposta correta é ${respostaCorreta}.`}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>,
    document.body
  );
}
