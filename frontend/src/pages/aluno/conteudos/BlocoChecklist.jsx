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

export default function BlocoChecklist({
  bloco
}) {
  const dados =
    useMemo(
      () =>
        normalizarDados(
          bloco?.dados
        ),
      [bloco?.dados]
    );

  const itens =
    useMemo(
      () =>
        Array.isArray(
          dados.itens
        )
          ? dados.itens.filter(
              (item) =>
                String(
                  item
                ).trim()
            )
          : [],
      [dados.itens]
    );

  const [
    concluidos,
    setConcluidos
  ] = useState([]);

  const [
    carregando,
    setCarregando
  ] = useState(true);

  const [
    salvando,
    setSalvando
  ] = useState(null);

  const [
    limpando,
    setLimpando
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarProgresso() {
      try {
        setCarregando(
          true
        );

        setErro('');

        const token =
          obterToken();

        if (!token) {
          if (ativo) {
            setConcluidos([]);
          }

          return;
        }

        const resposta =
          await fetch(
            `${API_URL}/checklists/${bloco.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
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
              'Não foi possível carregar o checklist.'
          );
        }

        if (!ativo) {
          return;
        }

        setConcluidos(
          Array.isArray(
            dadosResposta.itensConcluidos
          )
            ? dadosResposta.itensConcluidos.map(
                (item) =>
                  Number(item)
              )
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar checklist:',
          error
        );

        if (ativo) {
          setConcluidos([]);

          setErro(
            error.message ||
              'Não foi possível carregar o checklist.'
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

    if (bloco?.id) {
      carregarProgresso();
    } else {
      setCarregando(
        false
      );
    }

    return () => {
      ativo = false;
    };
  }, [bloco?.id]);

  async function alternarItem(
    index
  ) {
    const token =
      obterToken();

    if (!token) {
      setErro(
        'Sua sessão expirou. Faça login novamente.'
      );

      return;
    }

    if (
      salvando !== null ||
      limpando
    ) {
      return;
    }

    const estavaConcluido =
      concluidos.includes(
        index
      );

    const anteriores =
      [...concluidos];

    const novos =
      estavaConcluido
        ? anteriores.filter(
            (item) =>
              item !== index
          )
        : [
            ...anteriores,
            index
          ].sort(
            (a, b) =>
              a - b
          );

    setConcluidos(
      novos
    );

    setSalvando(
      index
    );

    setErro('');

    try {
      const resposta =
        await fetch(
          `${API_URL}/checklists/${bloco.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              itemIndice:
                index,

              concluido:
                !estavaConcluido
            })
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
            'Não foi possível salvar este item.'
        );
      }
    } catch (error) {
      console.error(
        'Erro ao salvar item do checklist:',
        error
      );

      setConcluidos(
        anteriores
      );

      setErro(
        error.message ||
          'Não foi possível salvar este item.'
      );
    } finally {
      setSalvando(
        null
      );
    }
  }

  async function limpar() {
    const token =
      obterToken();

    if (!token) {
      setErro(
        'Sua sessão expirou. Faça login novamente.'
      );

      return;
    }

    if (limpando) {
      return;
    }

    try {
      setLimpando(
        true
      );

      setErro('');

      const resposta =
        await fetch(
          `${API_URL}/checklists/${bloco.id}`,
          {
            method:
              'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`
            }
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
            'Não foi possível limpar o checklist.'
        );
      }

      setConcluidos([]);
    } catch (error) {
      console.error(
        'Erro ao limpar checklist:',
        error
      );

      setErro(
        error.message ||
          'Não foi possível limpar o checklist.'
      );
    } finally {
      setLimpando(
        false
      );
    }
  }

  const quantidadeConcluida =
    concluidos.filter(
      (item) =>
        item >= 0 &&
        item <
          itens.length
    ).length;

  const porcentagem =
    itens.length > 0
      ? Math.round(
          (
            quantidadeConcluida /
            itens.length
          ) * 100
        )
      : 0;

  return (
    <section className="pagina-content-block pagina-checklist-block">
      <div className="pagina-checklist-header">
        <div>
          <h2>
            {dados.titulo ||
              'Checklist de revisão'}
          </h2>

          <p>
            Marque os pontos que você já revisou.
          </p>
        </div>

        <div className="pagina-checklist-progress">
          <strong>
            {porcentagem}%
          </strong>

          <span>
            {quantidadeConcluida}/
            {itens.length}
          </span>
        </div>
      </div>

      <div className="pagina-checklist-track">
        <div
          style={{
            width:
              `${porcentagem}%`
          }}
        />
      </div>

      {carregando ? (
        <div className="pagina-block-placeholder">
          Carregando checklist...
        </div>
      ) : itens.length ===
        0 ? (
        <div className="pagina-block-placeholder">
          Este checklist ainda não possui itens.
        </div>
      ) : (
        <div className="pagina-checklist">
          {itens.map(
            (
              item,
              index
            ) => {
              const concluido =
                concluidos.includes(
                  index
                );

              return (
                <button
                  key={
                    index
                  }
                  type="button"
                  className={`pagina-check-item interactive ${
                    concluido
                      ? 'completed'
                      : ''
                  }`}
                  onClick={() =>
                    alternarItem(
                      index
                    )
                  }
                  disabled={
                    salvando !==
                      null ||
                    limpando
                  }
                >
                  <span className="pagina-check-icon">
                    {concluido && (
                      <Icon
                        name="check"
                        size={14}
                      />
                    )}
                  </span>

                  <span className="pagina-check-text">
                    {item}
                  </span>

                  {salvando ===
                    index && (
                    <small>
                      Salvando...
                    </small>
                  )}
                </button>
              );
            }
          )}
        </div>
      )}

      {erro && (
        <div className="pagina-inline-error">
          {erro}
        </div>
      )}

      {!carregando &&
        quantidadeConcluida >
          0 && (
          <button
            type="button"
            className="pagina-checklist-reset"
            onClick={
              limpar
            }
            disabled={
              limpando
            }
          >
            {limpando
              ? 'Limpando...'
              : 'Limpar checklist'}
          </button>
        )}
    </section>
  );
}