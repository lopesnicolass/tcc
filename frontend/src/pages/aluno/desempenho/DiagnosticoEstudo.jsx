import { CartaoAmpliavel } from './CartaoAmpliavel.jsx';
import { Link } from 'react-router-dom';

const CORES_MATERIA = {
  'Matemática': '#d85656', 'Português': '#2385e5', 'Ciências': '#8759c9',
  'Geografia': '#229967', 'História': '#e09c32'
};

function TextoProgresso({ percentual }) {
  return <strong className="desempenho-diagnostico-porcentagem">{percentual}%</strong>;
}

function ConteudoMaterias({ materias }) {
  return (
    <>
      <div className="desempenho-diagnostico-cabecalho">
        <div>
          <h3>Desempenho por matéria</h3>
          <p>Acertos sobre questões respondidas em cada disciplina.</p>
        </div>
        <span className="desempenho-diagnostico-total">{materias.length} {materias.length === 1 ? 'matéria' : 'matérias'}</span>
      </div>
      {materias.length === 0 ? (
        <div className="desempenho-diagnostico-sem-dados">
          Ainda não há simulados vinculados a uma matéria específica. Faça um simulado de Português, Matemática ou outra disciplina para começar essa comparação.
        </div>
      ) : (
        <div className="desempenho-diagnostico-materias">
          {materias.map((item, indice) => (
            <div className="desempenho-diagnostico-materia" key={item.id}>
              <div className="desempenho-diagnostico-linha">
                <div className="desempenho-diagnostico-nome">
                  <span className="desempenho-diagnostico-ordem">{String(indice + 1).padStart(2, '0')}</span>
                  <strong>{item.nome}</strong>
                </div>
                <TextoProgresso percentual={item.percentual} />
              </div>
              <div className="desempenho-diagnostico-barra" role="progressbar" aria-label={`Acertos em ${item.nome}`} aria-valuenow={item.percentual} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${item.percentual}%`, background: CORES_MATERIA[item.nome] || '#2385e5' }} />
              </div>
              <span className="desempenho-diagnostico-amostra">
                {item.acertos} de {item.questoes} questões corretas · {item.tentativas} {item.tentativas === 1 ? 'tentativa' : 'tentativas'}
                {item.amostraInicial ? ' · amostra inicial' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="desempenho-diagnostico-nota">Simulados gerais sem divisão por matéria não entram nesta comparação. Uma amostra pequena ainda não indica domínio definitivo.</p>
    </>
  );
}

function ConteudoRevisoes({ sugestoes }) {
  return (
    <>
      <div className="desempenho-diagnostico-cabecalho">
        <div>
          <h3>Prioridades de revisão</h3>
          <p>Comece pelos conteúdos que precisam de mais atenção.</p>
        </div>
      </div>
      {sugestoes.length === 0 ? (
        <div className="desempenho-diagnostico-sem-dados">
          Continue praticando simulados por matéria para receber sugestões direcionadas.
        </div>
      ) : (
        <ol className="desempenho-revisoes-lista">
          {sugestoes.map((item, indice) => (
            <li key={item.id} className="desempenho-revisao-item">
              <span className="desempenho-revisao-icone" aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>
              <div className="desempenho-revisao-texto">
                <span>{item.tipo === 'assunto' ? `ASSUNTO · ${item.materia}` : 'MATÉRIA'}</span>
                <strong>{item.nome}</strong>
                <small>{item.percentual}% de acertos · {item.amostraInicial ? 'resultado inicial' : `${item.tentativas} tentativas`}</small>
              </div>
              <Link
                className="desempenho-revisao-link"
                to={item.tipo === 'assunto' && item.topicoId ? `/conteudos/${item.topicoId}` : '/conteudos'}
                aria-label={`Revisar ${item.nome}`}
              >
                Revisar <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <div className="desempenho-diagnostico-acao">
        <Link to="/simulados">Praticar com simulados <span aria-hidden="true">→</span></Link>
      </div>
      <p className="desempenho-diagnostico-nota">As sugestões usam o aproveitamento do simulado associado ao assunto; não identificam individualmente as questões erradas.</p>
    </>
  );
}

export function DiagnosticoEstudo({ materias, sugestoes, possuiResultados }) {
  if (!possuiResultados) {
    return (
      <section className="desempenho-diagnostico-vazio" aria-labelledby="diagnostico-vazio-titulo">
        <div className="desempenho-diagnostico-vazio-icon" aria-hidden="true">✦</div>
        <div>
          <h2 id="diagnostico-vazio-titulo">Seu plano de revisão começa aqui</h2>
          <p>Faça um simulado para descobrir como está sua preparação. Seus resultados aparecerão por matéria e por assunto quando houver dados.</p>
        </div>
        <Link className="desempenho-diagnostico-btn" to="/simulados">Fazer simulado <span aria-hidden="true">→</span></Link>
      </section>
    );
  }

  return (
    <section className="desempenho-diagnostico" aria-label="Análise do seu desempenho">
      <div className="desempenho-diagnostico-topo">
        <h2>Onde focar seus estudos</h2>
        <p>Recomendações com base nas tentativas registradas.</p>
      </div>

      <div className="desempenho-diagnostico-grid">
        <CartaoAmpliavel titulo="Prioridades de revisão" tamanho="grande">
          <article className="desempenho-diagnostico-card desempenho-diagnostico-sugestoes desempenho-diagnostico-card--clicavel">
            <ConteudoRevisoes sugestoes={sugestoes} />
          </article>
        </CartaoAmpliavel>
        <CartaoAmpliavel titulo="Desempenho por matéria" tamanho="grande">
          <article className="desempenho-diagnostico-card desempenho-diagnostico-card--clicavel">
            <ConteudoMaterias materias={materias} />
          </article>
        </CartaoAmpliavel>
      </div>

    </section>
  );
}
