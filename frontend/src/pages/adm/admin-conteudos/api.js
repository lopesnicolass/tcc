// A tela de Conteúdos do admin usa o mesmo cliente de API central
// do resto do site — sem duplicar fetch/token aqui.
export { request, obterToken } from '../../../services/api.js';
