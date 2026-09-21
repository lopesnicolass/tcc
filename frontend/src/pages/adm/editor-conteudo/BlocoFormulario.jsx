import { Icon } from './icons.jsx';
import { campo } from './Campo.jsx';
import { youtubeEmbed } from './blocoHelpers.js';

// Formulário de edição do bloco que está aberto no modal.
// Extraído de EditorConteudo.jsx (era a função formularioBloco()).
//
// Antes essa lógica lia tudo direto do estado do componente pai
// (blocoEditando, atualizarDado, etc). Agora tudo isso chega por
// props — o comportamento é o mesmo, só a forma de acessar mudou.

export function BlocoFormulario({
  blocoEditando,
  atualizarDado,
  atualizarItem,
  adicionarItem,
  removerItem,
  alternarSelecionado,
  flashcards,
  questoes,
  simulados,
  buscaRelacionados,
  setBuscaRelacionados,
}) {
  if (!blocoEditando) {
    return null;
  }

  const dados =
    blocoEditando.dados || {};

  function itensFiltrados(
    lista,
    callback
  ) {
    const termo =
      buscaRelacionados
        .trim()
        .toLowerCase();

    if (!termo) {
      return lista;
    }

    return lista.filter(
      callback
    );
  }

  switch (
    blocoEditando.tipo
  ) {
    case 'texto':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              ),
            {
              placeholder:
                'Ex.: Introdução',
            }
          )}

          {campo(
            'Conteúdo',
            dados.texto,
            (valor) =>
              atualizarDado(
                'texto',
                valor
              ),
            {
              multiline: true,
              rows: 9,
              placeholder:
                'Escreva a explicação...',
            }
          )}
        </>
      );

    case 'destaque':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              ),
            {
              placeholder:
                'Ex.: Atenção!',
            }
          )}

          <label className="editor-field">
            <span className="editor-field-label">
              Tipo de destaque
            </span>

            <select
              value={
                dados.variante ||
                'info'
              }
              onChange={(event) =>
                atualizarDado(
                  'variante',
                  event.target
                    .value
                )
              }
            >
              <option value="info">
                Informação
              </option>

              <option value="warning">
                Atenção
              </option>

              <option value="success">
                Dica
              </option>
            </select>
          </label>

          {campo(
            'Mensagem',
            dados.texto,
            (valor) =>
              atualizarDado(
                'texto',
                valor
              ),
            {
              multiline: true,
              rows: 6,
              placeholder:
                'Escreva a informação...',
            }
          )}
        </>
      );

    case 'video':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              )
          )}

          {campo(
            'Link do YouTube',
            dados.url,
            (valor) =>
              atualizarDado(
                'url',
                valor
              ),
            {
              placeholder:
                'https://www.youtube.com/watch?v=...',
            }
          )}

          {campo(
            'Descrição',
            dados.descricao,
            (valor) =>
              atualizarDado(
                'descricao',
                valor
              ),
            {
              multiline: true,
              rows: 4,
            }
          )}

          {youtubeEmbed(
            dados.url
          ) && (
            <div className="editor-preview">
              <span>Prévia</span>

              <iframe
                src={youtubeEmbed(
                  dados.url
                )}
                title={
                  dados.titulo ||
                  'Videoaula'
                }
                allowFullScreen
              />
            </div>
          )}
        </>
      );

    case 'imagem':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              )
          )}

          {campo(
            'URL da imagem',
            dados.url,
            (valor) =>
              atualizarDado(
                'url',
                valor
              ),
            {
              placeholder:
                'https://...',
            }
          )}

          {campo(
            'Texto alternativo',
            dados.alt,
            (valor) =>
              atualizarDado(
                'alt',
                valor
              )
          )}

          {campo(
            'Legenda',
            dados.legenda,
            (valor) =>
              atualizarDado(
                'legenda',
                valor
              )
          )}

          {dados.url && (
            <div className="editor-preview">
              <span>Prévia</span>

              <img
                src={dados.url}
                alt={
                  dados.alt || ''
                }
              />
            </div>
          )}
        </>
      );

    case 'pdf':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              )
          )}

          {campo(
            'URL do PDF',
            dados.url,
            (valor) =>
              atualizarDado(
                'url',
                valor
              ),
            {
              placeholder:
                'https://...',
            }
          )}

          {campo(
            'Descrição',
            dados.descricao,
            (valor) =>
              atualizarDado(
                'descricao',
                valor
              ),
            {
              multiline: true,
              rows: 4,
            }
          )}
        </>
      );

    case 'lista':
    case 'checklist':
      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              )
          )}

          <div className="editor-items">
            <div className="editor-items-header">
              <span>
                Itens
              </span>

              <button
                type="button"
                className="editor-small-button"
                onClick={
                  adicionarItem
                }
              >
                <Icon
                  name="plus"
                  size={14}
                />

                Adicionar
              </button>
            </div>

            {(Array.isArray(
              dados.itens
            )
              ? dados.itens
              : ['']
            ).map(
              (item, index) => (
                <div
                  className="editor-item-row"
                  key={index}
                >
                  <span>
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      '0'
                    )}
                  </span>

                  <input
                    value={
                      item || ''
                    }
                    onChange={(event) =>
                      atualizarItem(
                        index,
                        event.target
                          .value
                      )
                    }
                    placeholder="Digite o item..."
                  />

                  <button
                    type="button"
                    className="editor-icon-button danger"
                    onClick={() =>
                      removerItem(
                        index
                      )
                    }
                  >
                    <Icon
                      name="trash"
                      size={14}
                    />
                  </button>
                </div>
              )
            )}
          </div>
        </>
      );

    case 'flashcards': {
      const selecionados =
        Array.isArray(
          dados.flashcardIds
        )
          ? dados.flashcardIds
          : [];

      const lista =
        itensFiltrados(
          flashcards,
          (card) =>
            String(
              card.primario || ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              ) ||
            String(
              card.secundario || ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              ) ||
            String(
              card.materia || ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              )
        );

      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              ),
            {
              placeholder:
                'Ex.: Flashcards para revisar',
            }
          )}

          {campo(
            'Descrição',
            dados.descricao,
            (valor) =>
              atualizarDado(
                'descricao',
                valor
              ),
            {
              multiline: true,
              rows: 3,
            }
          )}

          <div className="editor-related">
            <div className="editor-related-header">
              <strong>
                Selecionar flashcards
              </strong>

              <span>
                {selecionados.length}{' '}
                selecionado(s)
              </span>
            </div>

            <div className="editor-search">
              <Icon
                name="search"
                size={16}
              />

              <input
                value={
                  buscaRelacionados
                }
                onChange={(event) =>
                  setBuscaRelacionados(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar flashcard..."
              />
            </div>

            <div className="editor-related-list">
              {lista.length === 0 ? (
                <div className="editor-related-empty">
                  Nenhum flashcard encontrado.
                </div>
              ) : (
                lista.map(
                  (card) => {
                    const ativo =
                      selecionados.some(
                        (id) =>
                          Number(
                            id
                          ) ===
                          Number(
                            card.id
                          )
                      );

                    return (
                      <button
                        type="button"
                        key={card.id}
                        className={`editor-related-item ${
                          ativo
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          alternarSelecionado(
                            'flashcardIds',
                            card.id
                          )
                        }
                      >
                        <span className="editor-related-check">
                          {ativo && (
                            <Icon
                              name="check"
                              size={13}
                            />
                          )}
                        </span>

                        <span>
                          <strong>
                            {
                              card.primario
                            }
                          </strong>

                          <small>
                            {
                              card.secundario
                            }
                          </small>

                          <small>
                            {
                              card.materia
                            }
                          </small>
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </>
      );
    }

    case 'questoes': {
      const selecionadas =
        Array.isArray(
          dados.questaoIds
        )
          ? dados.questaoIds
          : [];

      const lista =
        itensFiltrados(
          questoes,
          (questao) =>
            String(
              questao.pergunta ||
                questao.enunciado ||
                ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              )
        );

      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              ),
            {
              placeholder:
                'Ex.: Pratique o conteúdo',
            }
          )}

          {campo(
            'Descrição',
            dados.descricao,
            (valor) =>
              atualizarDado(
                'descricao',
                valor
              ),
            {
              multiline: true,
              rows: 3,
            }
          )}

          <div className="editor-related">
            <div className="editor-related-header">
              <strong>
                Selecionar questões
              </strong>

              <span>
                {selecionadas.length}{' '}
                selecionada(s)
              </span>
            </div>

            <div className="editor-search">
              <Icon
                name="search"
                size={16}
              />

              <input
                value={
                  buscaRelacionados
                }
                onChange={(event) =>
                  setBuscaRelacionados(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar questão..."
              />
            </div>

            <div className="editor-related-list">
              {lista.length === 0 ? (
                <div className="editor-related-empty">
                  Nenhuma questão encontrada.
                </div>
              ) : (
                lista.map(
                  (questao) => {
                    const ativo =
                      selecionadas.some(
                        (id) =>
                          Number(
                            id
                          ) ===
                          Number(
                            questao.id
                          )
                      );

                    return (
                      <button
                        type="button"
                        key={questao.id}
                        className={`editor-related-item ${
                          ativo
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          alternarSelecionado(
                            'questaoIds',
                            questao.id
                          )
                        }
                      >
                        <span className="editor-related-check">
                          {ativo && (
                            <Icon
                              name="check"
                              size={13}
                            />
                          )}
                        </span>

                        <span>
                          <strong>
                            Questão{' '}
                            {
                              questao.id
                            }
                          </strong>

                          <small>
                            {
                              questao.pergunta ||
                              questao.enunciado ||
                              'Sem enunciado'
                            }
                          </small>

                          {questao.materia && (
                            <small>
                              {
                                questao.materia
                              }
                            </small>
                          )}
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </>
      );
    }

    case 'simulado': {
      const lista =
        itensFiltrados(
          simulados,
          (simulado) =>
            String(
              simulado.titulo ||
                simulado.nome ||
                ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              ) ||
            String(
              simulado.materia ||
                ''
            )
              .toLowerCase()
              .includes(
                buscaRelacionados
                  .toLowerCase()
              )
        );

      return (
        <>
          {campo(
            'Título',
            dados.titulo,
            (valor) =>
              atualizarDado(
                'titulo',
                valor
              ),
            {
              placeholder:
                'Ex.: Simulado recomendado',
            }
          )}

          {campo(
            'Descrição',
            dados.descricao,
            (valor) =>
              atualizarDado(
                'descricao',
                valor
              ),
            {
              multiline: true,
              rows: 3,
            }
          )}

          <div className="editor-related">
            <div className="editor-related-header">
              <strong>
                Selecionar simulado
              </strong>

              <span>
                {dados.simuladoId
                  ? '1 selecionado'
                  : 'Nenhum selecionado'}
              </span>
            </div>

            <div className="editor-search">
              <Icon
                name="search"
                size={16}
              />

              <input
                value={
                  buscaRelacionados
                }
                onChange={(event) =>
                  setBuscaRelacionados(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar simulado..."
              />
            </div>

            <div className="editor-related-list">
              {lista.length === 0 ? (
                <div className="editor-related-empty">
                  Nenhum simulado encontrado.
                </div>
              ) : (
                lista.map(
                  (simulado) => {
                    const ativo =
                      Number(
                        dados.simuladoId
                      ) ===
                      Number(
                        simulado.id
                      );

                    return (
                      <button
                        type="button"
                        key={simulado.id}
                        className={`editor-related-item ${
                          ativo
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          atualizarDado(
                            'simuladoId',
                            ativo
                              ? null
                              : Number(
                                  simulado.id
                                )
                          )
                        }
                      >
                        <span className="editor-related-check">
                          {ativo && (
                            <Icon
                              name="check"
                              size={13}
                            />
                          )}
                        </span>

                        <span>
                          <strong>
                            {
                              simulado.titulo ||
                              simulado.nome
                            }
                          </strong>

                          <small>
                            {simulado.materia ||
                              'Sem matéria'}
                          </small>

                          <small>
                            {simulado.quantidade_questoes ||
                              0}{' '}
                            questões
                          </small>
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </>
      );
    }

    default:
      return null;
  }
}
