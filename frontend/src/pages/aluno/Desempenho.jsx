import '../../styles/aluno/Desempenho.css';
import { useEffect, useMemo, useState } from 'react';

import { META } from './desempenho/constants.js';
import { Hero } from './desempenho/Hero.jsx';
import { CardsResumo } from './desempenho/CardsResumo.jsx';
import { GraficoEvolucao } from './desempenho/GraficoEvolucao.jsx';
import { ComparacaoAproveitamento } from './desempenho/ComparacaoAproveitamento.jsx';
import { MetaConsistencia } from './desempenho/MetaConsistencia.jsx';
import { Historico } from './desempenho/Historico.jsx';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Desempenho() {
  const [desempenho, setDesempenho] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  function obterUsuarioId() {
    const usuarioSalvo = localStorage.getItem('etecamp_usuario');

    if (!usuarioSalvo) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioSalvo);

      if (usuario.id) {
        return Number(usuario.id);
      }

      if (usuario.usuarioId) {
        return Number(usuario.usuarioId);
      }

      return null;
    } catch (error) {
      console.error('Erro ao ler usuário:', error);
      return null;
    }
  }

  useEffect(() => {
    async function carregarDesempenho() {
      try {
        setCarregando(true);
        setErro('');

        const usuarioId = obterUsuarioId();

        if (!usuarioId) {
          throw new Error(
            'Não foi possível identificar o usuário logado.'
          );
        }

        const token =
          localStorage.getItem('etecamp_token') ||
          localStorage.getItem('token');

        const [
          respostaDesempenho,
          respostaResultados
        ] = await Promise.all([
          fetch(
            `${API_URL}/resultados/${usuarioId}/desempenho`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),
          fetch(
            `${API_URL}/resultados/${usuarioId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ]);

        const dadosDesempenho =
          await respostaDesempenho.json();

        const dadosResultados =
          await respostaResultados.json();

        if (!respostaDesempenho.ok) {
          throw new Error(
            dadosDesempenho.mensagem ||
              'Não foi possível carregar o desempenho.'
          );
        }

        if (!respostaResultados.ok) {
          throw new Error(
            dadosResultados.mensagem ||
              'Não foi possível carregar o histórico.'
          );
        }

        setDesempenho(
          dadosDesempenho.desempenho || null
        );

        setResultados(
          Array.isArray(
            dadosResultados.resultados
          )
            ? dadosResultados.resultados
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar desempenho:',
          error
        );

        setErro(
          error.message ||
            'Não foi possível carregar seu desempenho.'
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDesempenho();
  }, []);

  function numero(valor) {
    return Number(valor || 0);
  }

  function limitar(
    valor,
    minimo = 0,
    maximo = 100
  ) {
    return Math.min(
      maximo,
      Math.max(minimo, numero(valor))
    );
  }

  function porcentagem(valor) {
    return `${numero(valor).toFixed(0)}%`;
  }

  function formatarData(data) {
    if (!data) {
      return '';
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return '';
    }

    return dataObj.toLocaleDateString(
      'pt-BR'
    );
  }

  function obterNomeSimulado(
    resultado,
    index
  ) {
    const nome =
      resultado?.simulado_nome ||
      resultado?.nome_simulado ||
      resultado?.simulado ||
      resultado?.titulo_simulado ||
      resultado?.titulo ||
      resultado?.nome;

    if (
      typeof nome === 'string' &&
      nome.trim()
    ) {
      return nome.trim();
    }

    return `Simulado ${index + 1}`;
  }

  const mediaGeral = numero(
    desempenho?.mediaPorcentagem
  );

  const totalQuestoes = numero(
    desempenho?.totalQuestoes
  );

  const totalAcertos = numero(
    desempenho?.totalAcertos
  );

  const totalErros = numero(
    desempenho?.totalErros
  );

  const totalSimulados = numero(
    desempenho?.totalSimulados
  );

  const melhorResultado = useMemo(() => {
    if (!resultados.length) {
      return 0;
    }

    return Math.max(
      ...resultados.map((resultado) =>
        numero(resultado.porcentagem)
      )
    );
  }, [resultados]);

  const menorResultado = useMemo(() => {
    if (!resultados.length) {
      return 0;
    }

    return Math.min(
      ...resultados.map((resultado) =>
        numero(resultado.porcentagem)
      )
    );
  }, [resultados]);

  const percentualAcertos =
    totalQuestoes > 0
      ? (totalAcertos / totalQuestoes) * 100
      : 0;

  const percentualErros =
    totalQuestoes > 0
      ? (totalErros / totalQuestoes) * 100
      : 0;

  const faltamParaMeta = Math.max(
    0,
    META - mediaGeral
  );

  const progressoMeta = Math.min(
    100,
    (mediaGeral / META) * 100
  );

  const resultadosCronologicos = useMemo(() => {
    return resultados
      .slice()
      .reverse();
  }, [resultados]);

  const mediaRecente = useMemo(() => {
    if (!resultadosCronologicos.length) {
      return 0;
    }

    const ultimos =
      resultadosCronologicos.slice(-3);

    return (
      ultimos.reduce(
        (soma, resultado) =>
          soma +
          numero(resultado.porcentagem),
        0
      ) / ultimos.length
    );
  }, [resultadosCronologicos]);

  const tendencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 'neutra';
    }

    const ultimo =
      numero(
        resultadosCronologicos[
          resultadosCronologicos.length - 1
        ]?.porcentagem
      );

    const anterior =
      numero(
        resultadosCronologicos[
          resultadosCronologicos.length - 2
        ]?.porcentagem
      );

    if (ultimo > anterior) {
      return 'alta';
    }

    if (ultimo < anterior) {
      return 'baixa';
    }

    return 'neutra';
  }, [resultadosCronologicos]);

  const desvioMedio = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 0;
    }

    const media =
      resultadosCronologicos.reduce(
        (soma, resultado) =>
          soma +
          numero(resultado.porcentagem),
        0
      ) /
      resultadosCronologicos.length;

    const variancia =
      resultadosCronologicos.reduce(
        (soma, resultado) => {
          const diferenca =
            numero(
              resultado.porcentagem
            ) - media;

          return (
            soma +
            diferenca * diferenca
          );
        },
        0
      ) /
      resultadosCronologicos.length;

    return Math.sqrt(variancia);
  }, [resultadosCronologicos]);

  const consistencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 100;
    }

    return limitar(
      100 - desvioMedio * 2
    );
  }, [
    resultadosCronologicos,
    desvioMedio
  ]);

  const mensagemConsistencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 'Faça mais simulados para medir sua consistência.';
    }

    if (consistencia >= 80) {
      return 'Seu desempenho está bem consistente.';
    }

    if (consistencia >= 60) {
      return 'Seu desempenho apresenta uma variação moderada.';
    }

    return 'Seus resultados estão variando bastante entre os simulados.';
  }, [
    resultadosCronologicos,
    consistencia
  ]);

  /*
   * PONTOS DO GRÁFICO
   */

  const pontosGrafico = useMemo(() => {
    if (!resultadosCronologicos.length) {
      return [];
    }

    return resultadosCronologicos.map(
      (resultado, index) => {
        const valor = limitar(
          resultado.porcentagem
        );

        return {
          valor,
          index,
          resultado
        };
      }
    );
  }, [resultadosCronologicos]);

  if (carregando) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Desempenho</h1>

            <p>
              Acompanhe sua evolução e identifique
              pontos de melhoria
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '50px',
            textAlign: 'center',
            color: '#70829a'
          }}
        >
          Carregando seu desempenho...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Desempenho</h1>

            <p>
              Acompanhe sua evolução e identifique
              pontos de melhoria
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '30px',
            color: '#d54545'
          }}
        >
          {erro}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        paddingBottom: '40px'
      }}
    >
      <Hero
        mediaGeral={mediaGeral}
        tendencia={tendencia}
        progressoMeta={progressoMeta}
        melhorResultado={melhorResultado}
        porcentagem={porcentagem}
      />

      <CardsResumo
        totalSimulados={totalSimulados}
        totalQuestoes={totalQuestoes}
        totalAcertos={totalAcertos}
        totalErros={totalErros}
        percentualAcertos={percentualAcertos}
        percentualErros={percentualErros}
      />

      <GraficoEvolucao
        resultadosCronologicos={resultadosCronologicos}
        pontosGrafico={pontosGrafico}
        obterNomeSimulado={obterNomeSimulado}
        formatarData={formatarData}
      />

      <ComparacaoAproveitamento
        mediaGeral={mediaGeral}
        melhorResultado={melhorResultado}
        menorResultado={menorResultado}
        totalQuestoes={totalQuestoes}
        percentualAcertos={percentualAcertos}
        totalAcertos={totalAcertos}
        totalErros={totalErros}
      />

      <MetaConsistencia
        porcentagem={porcentagem}
        mediaGeral={mediaGeral}
        progressoMeta={progressoMeta}
        faltamParaMeta={faltamParaMeta}
        consistencia={consistencia}
        mediaRecente={mediaRecente}
        mensagemConsistencia={mensagemConsistencia}
      />

      <Historico
        resultados={resultados}
        mediaGeral={mediaGeral}
        limitar={limitar}
        obterNomeSimulado={obterNomeSimulado}
        formatarData={formatarData}
        porcentagem={porcentagem}
      />
    </div>
  );
}
