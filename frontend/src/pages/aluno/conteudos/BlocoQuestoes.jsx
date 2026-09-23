import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Icon from '../../../components/Icon.jsx';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

function obterToken() {
  return localStorage.getItem(
    'etecamp_token'
  );
}

function normalizarDados(
  valor
) {
  if (
    typeof valor ===
    'string'
  ) {
    try {
      valor =
        JSON.parse(valor);
    } catch {
      valor = {};
    }
  }

  if (
    !valor ||
    typeof valor !==
      'object' ||
    Array.isArray(valor)
  ) {
    return {};
  }

  return valor;
}

function normalizarIds(
  valor
) {
  if (
    Array.isArray(valor)
  ) {
    return [
      ...new Set(
        valor
          .map(
            (item) =>
              Number(item)
          )
          .filter(
            (item) =>
              Number.isInteger(
                item
              ) &&
              item > 0
          )
      )
    ];
  }

  if (!valor) {
    return [];
  }

  return [
    ...new Set(
      String(valor)
        .split(',')
        .map(
          (item) =>
            Number(
              item.trim()
            )
        )
        .filter(
          (item) =>
            Number.isInteger(
              item
            ) &&
            item > 0
        )
    )
  ];
}

function obterAlternativa(
  questao,
  letra
) {
  const mapa = {
    A: questao.alternativa_a,
    B: questao.alternativa_b,
    C: questao.alternativa_c,
    D: questao.alternativa_d,
    E: questao.alternativa_e,
  };

  return mapa[
    letra
  ] || '';
}

export default function BlocoQuestoes({
  bloco,
}) {
  const dados =
    useMemo(
      () =>
        normalizarDados(
          bloco?.dados
        ),
      [
        bloco?.dados,
      ]
    );

  const questaoIds =
    useMemo(
      () =>
        normalizarIds(
          dados.questaoIds ??
            dados.ids
        ),
      [
        dados.questaoIds,
        dados.ids,
      ]
    );

  const [
    questoes,
    setQuestoes,
  ] = useState([]);

  const [
    respostas,
    setRespostas,
  ] = useState({});

  const [
    resultado,
    setResultado,
  ] = useState(null);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    corrigindo,
    setCorrigindo,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarQuestoes() {
      if (
        questaoIds.length ===
        0
      ) {
        if (ativo) {
          setQuestoes([]);
          setRespostas({});
          setResultado(null);
          setCarregando(false);
        }

        return;
      }

      try {
        setCarregando(true);
        setErro('');

        const token =
          obterToken();

        const resposta =
          await fetch(
            `${API_URL}/questoes/aluno?ids=${encodeURIComponent(
              questaoIds.join(',')
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const dadosResposta =
          await resposta
            .json()
            .catch(
              () => ({})
            );

        if (!resposta.ok) {
          throw new Error(
            dadosResposta.mensagem ||
              dadosResposta.erro ||
              'Não foi possível carregar as questões.'
          );
        }

        if (!ativo) {
          return;
        }

        setQuestoes(
          Array.isArray(
            dadosResposta.questoes
          )
            ? dadosResposta.questoes
            : []
        );

        setRespostas({});
        setResultado(null);
      } catch (error) {
        console.error(
          'Erro ao carregar questões:',
          error
        );

        if (ativo) {
          setQuestoes([]);
          setErro(
            error.message ||
              'Não foi possível carregar as questões.'
          );
        }
      } finally {
        if (ativo) {
          setCarregando(
            false
          );
        }
      }
    }

    carregarQuestoes();

    return () => {
      ativo = false;
    };
  }, [
    bloco?.id,
    questaoIds.join(',')
  ]);

  function selecionarResposta(
    questaoId,
    alternativa
  ) {
    if (resultado) {
      return;
    }

    setRespostas(
      (prev) => ({
        ...prev,

        [questaoId]:
          alternativa
      })
    );
  }

  async function corrigir() {
    if (
      questoes.length ===
        0 ||
      Object.keys(
        respostas
      ).length !==
        questoes.length
    ) {
      return;
    }

    try {
      setCorrigindo(true);
      setErro('');

      const token =
        obterToken();

      if (!token) {
        throw new Error(
          'Sua sessão expirou. Faça login novamente.'
        );
      }

      const resposta =
        await fetch(
          `${API_URL}/questoes/corrigir-bloco`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              questaoIds:
                questoes.map(
                  (questao) =>
                    Number(
                      questao.id
                    )
                ),

              respostas
            })
          }
        );

      const dados =
        await resposta
          .json()
          .catch(
            () => ({})
          );

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
            dados.erro ||
            'Não foi possível corrigir as questões.'
        );
      }

      setResultado(
        dados
      );
    } catch (error) {
      console.error(
        'Erro ao corrigir questões:',
        error
      );

      setErro(
        error.message ||
          'Não foi possível corrigir as questões.'
      );
    } finally {
      setCorrigindo(false);
    }
  }

  function refazer() {
    setRespostas({});
    setResultado(null);
    setErro('');
  }

  function obterDetalhe(
    questaoId
  ) {
    return (
      resultado?.detalhes?.find(
        (item) =>
          Number(
            item.questaoId
          ) ===
          Number(
            questaoId
          )
      ) || null
    );
  }

  if (carregando) {
    return (
      <section className="pagina-content-block pagina-questions-block">
        <div className="pagina-resource-block">
          <div className="pagina-resource-block-icon">
            <Icon
              name="question"
              size={23}
            />
          </div>

          <div className="pagina-resource-block-copy">
            <h2>
              {dados.titulo ||
                'Pratique'}
            </h2>

            <p>
              {dados.descricao ||
                'Resolva questões para fixar o conteúdo estudado.'}
            </p>
          </div>
        </div>

        <div className="pagina-questions-loading">
          Carregando questões...
        </div>
      </section>
    );
  }

  if (
    questaoIds.length ===
    0
  ) {
    return (
      <section className="pagina-content-block pagina-questions-block">
        <div className="pagina-resource-block">
          <div className="pagina-resource-block-icon">
            <Icon
              name="question"
              size={23}
            />
          </div>

          <div className="pagina-resource-block-copy">
            <h2>
              {dados.titulo ||
                'Pratique'}
            </h2>

            <p>
              {dados.descricao ||
                'Resolva questões para fixar o conteúdo estudado.'}
            </p>
          </div>
        </div>

        <div className="pagina-block-placeholder">
          O administrador ainda não selecionou questões para este conteúdo.
        </div>
      </section>
    );
  }

  const respondidas =
    Object.keys(
      respostas
    ).length;

  const total =
    questoes.length;

  const podeCorrigir =
    total > 0 &&
    respondidas ===
      total;

  const resultadoInfo =
    resultado?.resultado ||
    null;

  return (
    <section className="pagina-content-block pagina-questions-block">
      <div className="pagina-resource-block">
        <div className="pagina-resource-block-icon">
          <Icon
            name="question"
            size={23}
          />
        </div>

        <div className="pagina-resource-block-copy">
          <h2>
            {dados.titulo ||
              'Pratique'}
          </h2>

          <p>
            {dados.descricao ||
              'Resolva questões para fixar o conteúdo estudado.'}
          </p>
        </div>
      </div>

      {erro && (
        <div className="pagina-inline-error">
          {erro}
        </div>
      )}

      {questoes.length ===
      0 ? (
        <div className="pagina-block-placeholder">
          Nenhuma das questões selecionadas está disponível no banco.
        </div>
      ) : (
        <>
          <div className="pagina-questions-summary">
            <span>
              {respondidas} de{' '}
              {total} respondidas
            </span>

            {resultadoInfo && (
              <strong>
                {
                  resultadoInfo.acertos
                }{' '}
                acertos •{' '}
                {
                  resultadoInfo.porcentagem
                }%
              </strong>
            )}
          </div>

          <div className="pagina-questions-list">
            {questoes.map(
              (
                questao,
                index
              ) => {
                const selecionada =
                  respostas[
                    questao.id
                  ];

                const detalhe =
                  obterDetalhe(
                    questao.id
                  );

                const letras = [
                  'A',
                  'B',
                  'C',
                  'D',
                  'E'
                ];

                return (
                  <article
                    key={
                      questao.id
                    }
                    className={`pagina-question-card ${
                      detalhe
                        ? detalhe.acertou
                          ? 'correct'
                          : 'incorrect'
                        : ''
                    }`}
                  >
                    <div className="pagina-question-head">
                      <span>
                        QUESTÃO{' '}
                        {index +
                          1}
                      </span>

                      {detalhe && (
                        <strong>
                          {detalhe.acertou
                            ? '✓ Acertou'
                            : '✕ Errou'}
                        </strong>
                      )}
                    </div>

                    <h3>
                      {
                        questao.pergunta
                      }
                    </h3>

                    <div className="pagina-question-options">
                      {letras.map(
                        (
                          letra
                        ) => {
                          const foiSelecionada =
                            selecionada ===
                            letra;

                          const eCorreta =
                            detalhe?.respostaCorreta ===
                            letra;

                          const eErrada =
                            Boolean(
                              detalhe &&
                              !detalhe.acertou &&
                              foiSelecionada
                            );

                          return (
                            <button
                              key={
                                letra
                              }
                              type="button"
                              className={`pagina-question-option ${
                                foiSelecionada
                                  ? 'selected'
                                  : ''
                              } ${
                                eCorreta
                                  ? 'correct'
                                  : ''
                              } ${
                                eErrada
                                  ? 'incorrect'
                                  : ''
                              }`}
                              onClick={() =>
                                selecionarResposta(
                                  questao.id,
                                  letra
                                )
                              }
                              disabled={
                                Boolean(
                                  resultado
                                )
                              }
                            >
                              <span className="pagina-question-letter">
                                {
                                  letra
                                }
                              </span>

                              <span className="pagina-question-option-text">
                                {obterAlternativa(
                                  questao,
                                  letra
                                )}
                              </span>

                              {eCorreta && (
                                <span className="pagina-question-feedback">
                                  Correta
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {resultadoInfo ? (
            <div className="pagina-questions-result">
              <div>
                <span>
                  RESULTADO
                </span>

                <strong>
                  {
                    resultadoInfo.acertos
                  }{' '}
                  de{' '}
                  {
                    resultadoInfo.totalQuestoes
                  }{' '}
                  questões
                </strong>

                <p>
                  {
                    resultadoInfo.porcentagem
                  }%
                  de aproveitamento.
                </p>
              </div>

              <button
                type="button"
                className="pagina-secondary-button"
                onClick={
                  refazer
                }
              >
                Refazer questões
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pagina-primary-action"
              onClick={
                corrigir
              }
              disabled={
                !podeCorrigir ||
                corrigindo
              }
            >
              {corrigindo
                ? 'Corrigindo...'
                : podeCorrigir
                  ? 'Corrigir questões'
                  : 'Responda todas as questões'}
            </button>
          )}
        </>
      )}
    </section>
  );
}