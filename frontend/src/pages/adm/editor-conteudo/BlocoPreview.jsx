import { Icon } from './icons.jsx';
import { youtubeEmbed } from './blocoHelpers.js';

// Pré-visualização de um bloco já salvo, mostrada na lista de
// blocos da página. É uma função pura: só depende do `bloco`
// recebido, não de nenhum estado do editor.
// Extraído de EditorConteudo.jsx.

export function previewBloco(bloco) {
  const dados =
    bloco.dados || {};

  switch (bloco.tipo) {
    case 'texto':
      return (
        <>
          {dados.titulo && (
            <h3>{dados.titulo}</h3>
          )}

          <p>
            {dados.texto ||
              'Este bloco ainda está vazio.'}
          </p>
        </>
      );

    case 'destaque':
      return (
        <div
          className={`editor-block-highlight ${
            dados.variante ||
            'info'
          }`}
        >
          <strong>
            {dados.titulo ||
              'Destaque'}
          </strong>

          <span>
            {dados.texto ||
              'Adicione uma mensagem.'}
          </span>
        </div>
      );

    case 'video':
      return (
        <>
          {dados.titulo && (
            <h3>
              {dados.titulo}
            </h3>
          )}

          {youtubeEmbed(
            dados.url
          ) ? (
            <div className="editor-block-video">
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
          ) : (
            <div className="editor-block-placeholder">
              Adicione um link do YouTube.
            </div>
          )}
        </>
      );

    case 'imagem':
      return (
        <>
          {dados.titulo && (
            <h3>{dados.titulo}</h3>
          )}

          {dados.url ? (
            <div className="editor-block-image">
              <img
                src={dados.url}
                alt={
                  dados.alt || ''
                }
              />

              {dados.legenda && (
                <small>
                  {dados.legenda}
                </small>
              )}
            </div>
          ) : (
            <div className="editor-block-placeholder">
              Adicione a URL da imagem.
            </div>
          )}
        </>
      );

    case 'pdf':
      return (
        <>
          {dados.titulo && (
            <h3>{dados.titulo}</h3>
          )}

          {dados.descricao && (
            <p className="editor-muted">
              {dados.descricao}
            </p>
          )}

          {dados.url && (
            <a
              href={dados.url}
              target="_blank"
              rel="noreferrer"
              className="editor-resource"
            >
              <Icon
                name="file"
                size={17}
              />

              Abrir PDF
            </a>
          )}
        </>
      );

    case 'lista':
    case 'checklist':
      return (
        <>
          {dados.titulo && (
            <h3>{dados.titulo}</h3>
          )}

          <ul className="editor-preview-list">
            {(Array.isArray(
              dados.itens
            )
              ? dados.itens
              : []
            )
              .filter(
                (item) =>
                  String(
                    item
                  ).trim()
              )
              .map(
                (item, index) => (
                  <li key={index}>
                    {item}
                  </li>
                )
              )}
          </ul>
        </>
      );

    case 'flashcards': {
      const quantidade =
        Array.isArray(
          dados.flashcardIds
        )
          ? dados.flashcardIds.length
          : 0;

      return (
        <>
          <h3>
            {dados.titulo ||
              'Flashcards para revisar'}
          </h3>

          <p className="editor-muted">
            {dados.descricao ||
              'Flashcards relacionados ao tópico.'}
          </p>

          <span className="editor-preview-tag">
            {quantidade}{' '}
            flashcard(s) selecionado(s)
          </span>
        </>
      );
    }

    case 'questoes': {
      const quantidade =
        Array.isArray(
          dados.questaoIds
        )
          ? dados.questaoIds.length
          : 0;

      return (
        <>
          <h3>
            {dados.titulo ||
              'Pratique'}
          </h3>

          <p className="editor-muted">
            {dados.descricao ||
              'Questões relacionadas ao tópico.'}
          </p>

          <span className="editor-preview-tag">
            {quantidade}{' '}
            questão(ões) selecionada(s)
          </span>
        </>
      );
    }

    case 'simulado':
      return (
        <>
          <h3>
            {dados.titulo ||
              'Simulado recomendado'}
          </h3>

          <p className="editor-muted">
            {dados.descricao ||
              'Simulado relacionado ao tópico.'}
          </p>

          <span className="editor-preview-tag">
            {dados.simuladoId
              ? `Simulado #${dados.simuladoId}`
              : 'Nenhum simulado selecionado'}
          </span>
        </>
      );

    default:
      return null;
  }
}
