import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../src/', import.meta.url);
const code = (file) => readFileSync(new URL(file, base), 'utf8');

const styles = code('styles/adm/AdminConsistency.css');
const layout = code('layouts/AdminLayout.jsx');
const sidebar = code('components/AdminSidebar.jsx');
const usuarios = code('pages/adm/AdminUsuarios.jsx');
const dashboard = code('pages/adm/AdminDashboard.jsx');

test('a correção do tema é importada somente pelo layout administrativo', () => {
  assert.match(layout, /import '\.\.\/styles\/adm\/AdminConsistency\.css'/);
  assert.doesNotMatch(code('layouts/DashboardLayout.jsx'), /AdminConsistency/);
});

test('a sidebar oferece navegação, recolher menu e retorno à visão do estudante', () => {
  assert.match(sidebar, /to:\s*'\/admin\/usuarios'/);
  assert.match(sidebar, /setCollapsed/);
  assert.match(sidebar, /sessionStorage\.setItem\('etecamp_admin_preview', 'true'\)/);
  assert.match(styles, /\.admin-sidebar-navigation::-webkit-scrollbar/);
  assert.match(styles, /max-height:\s*780px/);
});

test('o contraste do admin é exclusivo da área administrativa e da sua camada de modais', () => {
  assert.match(styles, /html\[data-theme='dark'\] \.admin-area/);
  assert.doesNotMatch(styles, /\.student-area/);
  assert.match(styles, /\.admin-sidebar\.active|\.admin-sidebar-link\.active/);
});

test('os rótulos dos indicadores administrativos não são cortados por reticências', () => {
  assert.match(styles, /\.admin-stat-detail\s*\{[^}]*white-space:\s*normal/s);
  assert.match(dashboard, /Pessoas na plataforma/);
  assert.match(dashboard, /Banco de questões/);
});

test('a própria conta do administrador não recebe botão de exclusão', () => {
  assert.match(usuarios, /localStorage\.getItem\('etecamp_usuario'\)/);
  assert.match(usuarios, /Number\(usuario\.id\) === contaAtualId/);
  assert.match(usuarios, /Sua conta/);
  assert.match(usuarios, /Você não pode excluir a conta que está usando/);
});

test('as páginas administrativas continuam presentes sem trocar seus endpoints', () => {
  const pages = ['AdminConteudos','AdminSimulados','AdminProvas','AdminCronogramas','AdminCalendario','AdminFlashCards','AdminUsuarios'];
  for (const name of pages) assert.ok(code(`pages/adm/${name}.jsx`).length > 1000, `${name} ausente`);
  assert.match(code('pages/adm/AdminCalendario.jsx'), /\/calendario\/datas-importantes/);
  assert.match(code('pages/adm/AdminCronogramas.jsx'), /\/cronogramas-modelos/);
});
