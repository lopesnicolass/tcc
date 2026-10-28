// Refúgio do Conhecimento: a mesma linguagem de ilustração do Ninho Inicial.
// IDs e compras anteriores preservados; preços ajustados à recompensa de foco. A cadeira avulsa foi retirada;
// as compras antigas dela continuam registradas no backend, sem ser vendida novamente.
import mesa2 from './assets/sala2/mesa2.png';
import estante2 from './assets/sala2/estante2.png';
import mural2 from './assets/sala2/mural2.png';
import calendario2 from './assets/sala2/calendario2.png';
import globo2 from './assets/sala2/globo2.png';
import puff2 from './assets/sala2/puff2.png';
import planta2 from './assets/sala2/planta_pendente2.png';
import luz2 from './assets/sala2/luz_fio2.png';
import caixa2 from './assets/sala2/caixa2.png';
import tapete2 from './assets/sala2/tapete_redondo2.png';
import vaso2 from './assets/sala2/planta_vaso2.png';
import livros2 from './assets/sala2/pilha_livros2.png';
import avisos2 from './assets/sala2/quadro_avisos2.png';

export const ITEMS_SALA2 = [
  { id:'s2_mesa', name:'Escrivaninha com cadeira', price:8, img:mesa2, width:33, x:50, y:62, zone:'chao', subtitle:'Mesa, livros, luminária e cadeira encaixada' },
  { id:'s2_estante', name:'Estante do conhecimento', price:8, img:estante2, width:21, x:26, y:74, zone:'chao', subtitle:'Mais alta, com livros coloridos e folhas' },
  { id:'s2_mural', name:'Mural de metas', price:4, img:mural2, width:21, x:50, y:34, zone:'parede', subtitle:'Planeje os próximos passos' },
  { id:'s2_calendario', name:'Calendário de estudos', price:2, img:calendario2, width:14, x:72, y:35, zone:'parede', subtitle:'Sua semana organizada' },
  { id:'s2_globo', name:'Globo terrestre', price:6, img:globo2, width:14, x:26, y:84, zone:'chao', subtitle:'Aprenda sobre o mundo' },
  { id:'s2_puff', name:'Puff de leitura', price:4, img:puff2, width:19, x:75, y:82, zone:'tapete', subtitle:'Descanso junto à Tenna' },
  { id:'s2_planta', name:'Planta suspensa', price:2, img:planta2, width:13, x:17, y:33, zone:'pendurado', subtitle:'Folhas entre as raízes do ninho' },
  { id:'s2_luzes', name:'Luzes aconchegantes', price:6, img:luz2, width:29, x:49, y:20, zone:'pendurado', subtitle:'Um brilho suave no teto' },
  { id:'s2_caixa', name:'Caixa de fichamentos', price:2, img:caixa2, width:13, x:84, y:81, zone:'chao', subtitle:'Resumos sempre ao alcance' },
  { id:'s2_tapete_redondo', name:'Tapete redondo', price:4, img:tapete2, width:30, x:58, y:82, zone:'tapete', subtitle:'Um cantinho aconchegante' },
  { id:'s2_vaso', name:'Planta em vaso', price:2, img:vaso2, width:11, x:84, y:68, zone:'chao', subtitle:'Natureza na toca de estudos' },
  { id:'s2_livros', name:'Pilha de livros', price:2, img:livros2, width:11, x:45, y:78, zone:'chao', subtitle:'Leituras da sua jornada' },
  { id:'s2_avisos', name:'Quadro de avisos', price:4, img:avisos2, width:17, x:28, y:39, zone:'parede', subtitle:'Lembretes importantes' },
];

// Ambiente harmonizado para visualização. Demais itens seguem compráveis
// e podem ser adicionados individualmente pela loja.
export const DESTAQUES_SALA2 = Object.freeze([
  's2_luzes','s2_estante','s2_mural','s2_calendario',
  's2_mesa','s2_globo','s2_puff','s2_planta','s2_caixa','s2_tapete_redondo',
]);
