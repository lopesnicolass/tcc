import carteiraProva from './assets/sala3/carteira_vestibulinho.png';
import lousa from './assets/sala3/lousa_instrucoes.png';
import relogio from './assets/sala3/relogio_prova.png';
import mochila from './assets/sala3/mochila_tenna.png';
import kitProva from './assets/sala3/kit_prova.png';
import calendario from './assets/sala3/calendario_vestibulinho.png';
import painel from './assets/sala3/painel_desempenho.png';
import tapete from './assets/sala3/tapete_desafio.png';

import cadeira3 from './assets/sala3/cadeira3.webp';
import estante3 from './assets/sala3/estante3.webp';
import livros3 from './assets/sala3/livros3.webp';
import puff3 from './assets/sala3/puff3.webp';
import vaso3 from './assets/sala3/vaso3.webp';
import luzes3 from './assets/sala3/luzes3.webp';
import caixa3 from './assets/sala3/caixa3.webp';

// Todos os elementos da Sala 3 são imagens independentes com transparência.
// Os IDs de carteira, painel, calendário e tapete são conservados para
// reconhecer compras de versões anteriores, sem cobrar novamente.
export const ITEMS_SALA3 = [
  { id:'s3_mesa', name:'Carteira do Vestibulinho', price:28, img:carteiraProva, width:30, x:43, y:80, zone:'chao', subtitle:'Carteira com cadeira encaixada, folha de prova e materiais' },
  { id:'s3_lousa', name:'Quadro de Instruções', price:18, img:lousa, width:24, x:29, y:43, zone:'parede', subtitle:'Lembretes visuais para o dia da prova' },
  { id:'s3_relogio', name:'Relógio da Prova', price:11, img:relogio, width:9, x:82, y:31, zone:'parede', subtitle:'Marca o tempo do desafio final' },
  { id:'s3_mochila', name:'Mochila da Tenna', price:13, img:mochila, width:13, x:22, y:84, zone:'chao', subtitle:'Materiais preparados para o dia especial' },
  { id:'s3_kit', name:'Kit de Prova', price:9, img:kitProva, width:7, x:53, y:68, zone:'chao', subtitle:'Materiais da prova, para colocar perto da carteira' },
  { id:'s3_calendario', name:'Calendário do Vestibulinho', price:9, img:calendario, width:11, x:82, y:51, zone:'parede', subtitle:'Calendário de madeira com a data da prova em destaque' },
  { id:'s3_painel', name:'Painel de Desempenho', price:15, img:painel, width:25, x:65, y:41, zone:'parede', subtitle:'Metas, simulados e evolução da jornada' },
  { id:'s3_tapete', name:'Tapete do Desafio', price:12, img:tapete, width:41, x:44, y:85, zone:'tapete', subtitle:'Tapete azul e dourado com as formiguinhas' },
];

// Compras do catálogo antigo continuam acessíveis aos donos, mas não são vendidas novamente.
export const ITEMS_SALA3_LEGADOS = [
  { id:'s3_cadeira', name:'Cadeira confortável', price:12, img:cadeira3, width:13, x:36, y:73, zone:'chao', subtitle:'Conforto para estudar por mais tempo' },
  { id:'s3_estante', name:'Estante de revisão', price:24, img:estante3, width:17, x:75, y:68, zone:'chao', subtitle:'Materiais, livros e resumos sempre por perto' },
  { id:'s3_livros', name:'Livros de revisão', price:7, img:livros3, width:14, x:50, y:80, zone:'chao', subtitle:'Apoio para a última fase da jornada' },
  { id:'s3_puff', name:'Puff de descanso', price:13, img:puff3, width:18, x:63, y:81, zone:'tapete', subtitle:'Uma pausa curta antes da próxima revisão' },
  { id:'s3_vaso', name:'Planta inspiradora', price:9, img:vaso3, width:12, x:18, y:68, zone:'chao', subtitle:'Vida e cor para a reta final' },
  { id:'s3_luzes', name:'Luzes de revisão', price:16, img:luzes3, width:24, x:50, y:29, zone:'pendurado', subtitle:'Um clima especial para estudar' },
  { id:'s3_caixa', name:'Caixa de resumos', price:8, img:caixa3, width:13, x:81, y:80, zone:'chao', subtitle:'Guarde mapas mentais e fichas de estudo' },
];
