// Catálogo exclusivo da segunda câmara. Os identificadores não se repetem na Sala 1.
import mesa2 from './assets/sala2/mesa2.webp';
import cadeira2 from './assets/sala2/cadeira2.webp';
import estante2 from './assets/sala2/estante2.webp';
import mural2 from './assets/sala2/mural2.webp';
import calendario2 from './assets/sala2/calendario2.webp';
import globo2 from './assets/sala2/globo2.webp';
import puff2 from './assets/sala2/puff2.webp';
import planta2 from './assets/sala2/planta_pendente2.webp';
import luz2 from './assets/sala2/luz_fio2.webp';
import caixa2 from './assets/sala2/caixa2.webp';
import tapete2 from './assets/sala2/tapete_redondo2.webp';
import vaso2 from './assets/sala2/planta_vaso2.webp';
import livros2 from './assets/sala2/pilha_livros2.webp';
import avisos2 from './assets/sala2/quadro_avisos2.webp';

export const ITEMS_SALA2 = [
  { id:'s2_mesa', name:'Escrivaninha de revisão', price:24, img:mesa2, width:25, x:36, y:66, zone:'chao', subtitle:'Livros e luminária para estudar' },
  { id:'s2_cadeira', name:'Cadeira de estudos', price:10, img:cadeira2, width:12, x:36, y:73, zone:'chao', subtitle:'Conforto para revisar' },
  { id:'s2_estante', name:'Estante alta do conhecimento', price:22, img:estante2, width:17, x:76, y:68, zone:'chao', subtitle:'Uma coleção de livros' },
  { id:'s2_mural', name:'Mural de metas', price:14, img:mural2, width:20, x:49, y:35, zone:'parede', subtitle:'Acompanhe cada conquista' },
  { id:'s2_calendario', name:'Calendário de estudos', price:8, img:calendario2, width:13, x:69, y:36, zone:'parede', subtitle:'Organize a semana' },
  { id:'s2_globo', name:'Globo terrestre', price:16, img:globo2, width:13, x:26, y:79, zone:'chao', subtitle:'Aprenda sobre o mundo' },
  { id:'s2_puff', name:'Puff de leitura', price:12, img:puff2, width:18, x:64, y:81, zone:'tapete', subtitle:'Uma pausa entre os livros' },
  { id:'s2_planta', name:'Planta suspensa', price:9, img:planta2, width:13, x:84, y:38, zone:'pendurado', subtitle:'Mais vida para o refúgio' },
  { id:'s2_luzes', name:'Luzes aconchegantes', price:15, img:luz2, width:23, x:48, y:29, zone:'pendurado', subtitle:'Iluminação para a toca' },
  { id:'s2_caixa', name:'Caixa de fichamentos', price:7, img:caixa2, width:13, x:81, y:80, zone:'chao', subtitle:'Anotações bem guardadas' },
  { id:'s2_tapete_redondo', name:'Tapete redondo', price:11, img:tapete2, width:37, x:53, y:83, zone:'tapete', subtitle:'Um cantinho acolhedor para ler' },
  { id:'s2_vaso', name:'Planta em vaso', price:8, img:vaso2, width:12, x:18, y:68, zone:'chao', subtitle:'Um toque de natureza na sala' },
  { id:'s2_livros', name:'Pilha de livros', price:6, img:livros2, width:13, x:52, y:81, zone:'chao', subtitle:'Leituras da sua jornada' },
  { id:'s2_avisos', name:'Quadro de avisos', price:12, img:avisos2, width:17, x:29, y:39, zone:'parede', subtitle:'Lembretes e recados importantes' },
];
