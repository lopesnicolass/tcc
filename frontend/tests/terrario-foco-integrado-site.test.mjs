import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ler = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const layout = ler('../src/layouts/DashboardLayout.jsx');
const sidebar = ler('../src/components/Sidebar.jsx');
const indicador = ler('../src/components/FocoNoSite.jsx');
const css = ler('../src/components/FocoNoSite.css');
const terrario = ler('../src/terrario/Terrario.jsx');

test('o status do foco vive na sidebar, sem faixa de iniciar foco nas outras paginas', () => {
  assert.match(sidebar, /<FocoNoSite\s+onFocusRunningChange=\{/);
  assert.doesNotMatch(layout, /<FocoNoSite|tenna-study-clean|telaLimpa/);
  assert.match(layout, /<Outlet\s*\/>/);
  assert.doesNotMatch(indicador, /\/terrario\/foco\/iniciar|>Começar foco<|OPCOES\s*=/);
  assert.match(indicador, /if \(!ativa\) return null/);
  assert.match(indicador, /Foco ativo|Foco pausado/);
});

test('mantem a mesma sessao no servidor e permite pausar/retomar pela sidebar', () => {
  assert.match(indicador, /request\('\/terrario\/estado'\)/);
  assert.match(indicador, /remainingFromServer/);
  assert.match(indicador, /rodando \? 'pausar' : 'continuar'/);
  assert.match(indicador, /\/terrario\/foco\/\$\{sessao\.id\}\/\$\{acao\}/);
  assert.match(indicador, /tenna:focus-updated/);
  assert.match(indicador, /onClick=\{\(\) => navigate\('\/terrario'\)\}/);
});

test('pausa automaticamente ao sair da aba ou da janela sem encerrar', () => {
  assert.match(indicador, /document\.addEventListener\('visibilitychange', aoOcultar\)/);
  assert.match(indicador, /if \(document\.hidden\) void pausarAoSair\(\)/);
  assert.match(indicador, /window\.addEventListener\('blur', aoPerderFoco\)/);
  assert.match(indicador, /window\.addEventListener\('pagehide', pausarAoSair\)/);
  assert.match(indicador, /keepalive: true/);
  assert.match(indicador, /\/terrario\/foco\/\$\{sessao\.id\}\/pausar/);
  assert.match(indicador, /sessao\?\.estado !== 'em_andamento'/);
  assert.doesNotMatch(indicador, /\/cancelar|\/concluir/);
  assert.doesNotMatch(indicador, /aoMostrar.*continuar/);
});

test('indicador pequeno e adaptado a sidebar recolhida', () => {
  assert.match(css, /\.tenna-sidebar-focus/);
  assert.match(css, /\.sidebar-collapsed \.tenna-sidebar-focus/);
  assert.doesNotMatch(css, /position:\s*sticky/);
  assert.doesNotMatch(css, /tenna-study-clean/);
});

test('acoes do terrario comunicam o estado e aceitam atualizacao da sidebar', () => {
  assert.match(terrario, /new CustomEvent\('tenna:focus-updated', \{ detail: data \}\)/);
  assert.match(terrario, /window\.addEventListener\('tenna:focus-updated', refresh\)/);
  assert.match(terrario, /window\.removeEventListener\('tenna:focus-updated', refresh\)/);
});


test('tela limpa opcional: o controle fica ao lado do foco, sem barra sobre conteudos', () => {
  const view = ler('../src/styles/focus-clean-view.css');
  assert.match(indicador, /tenna-sidebar-focus-clean/);
  assert.match(indicador, /aria-label=\{cleanFocus \? 'Desativar tela limpa' : 'Ativar tela limpa'\}/);
  assert.match(layout, /is-focus-clean/);
  assert.match(layout, /Mostrar menu de navegação/);
  assert.match(view, /\.dashboard\.student-area\.is-focus-clean > \.student-sidebar/);
  assert.match(view, /width: 0 !important/);
  assert.match(view, /max-width: 1260px/);
  assert.doesNotMatch(layout, /<FocoNoSite/);
});

test('a tela limpa sai ao pausar a sessao, ao apertar Esc e no mobile', () => {
  const view = ler('../src/styles/focus-clean-view.css');
  assert.match(indicador, /onFocusRunningChange\?\.\(rodando\)/);
  assert.match(layout, /if \(!running\) setCleanFocus\(false\)/);
  assert.match(layout, /event.key === 'Escape'/);
  assert.match(layout, /\(max-width: 760px\)/);
  assert.match(view, /prefers-reduced-motion: reduce/);
  assert.match(view, /@media \(max-width: 760px\)/);
});
