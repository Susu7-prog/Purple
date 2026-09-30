const CATS = { Work: '💼', Personal: '🏡', Health: '💪', Learning: '📚', Fun: '🎉' };
const $ = id => document.getElementById(id);
const iso = d => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const today = iso(0);

let tasks = [];
let filter = 'all', cat = 'All', query = '';

const api = (url = '', opts = {}) => fetch('/api/tasks' + url, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => r.json());
const load = async () => { tasks = await api(); render(); };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

$('date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const h = new Date().getHours();
$('greeting').textContent = (h < 12 ? '🌅 Good morning' : h < 18 ? '☀️ Good afternoon' : '🌙 Good evening') + ', Purple!';
$('category').innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v} ${k}</option>`).join('');
$('due').value = today;

function render() {
  const done = tasks.filter(t => t.done).length, total = tasks.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('bar-fill').style.width = pct + '%';
  $('progress-text').textContent = `${pct}% completed (${done}/${total})`;
  $('s-total').textContent = total; $('s-done').textContent = done;
  $('s-today').textContent = tasks.filter(t => !t.done && t.due === today).length;
  $('s-late').textContent = tasks.filter(t => !t.done && t.due && t.due < today).length;
  $('left').textContent = `${total - done} task${total - done === 1 ? '' : 's'} left`;

  $('chips').innerHTML = ['All', ...Object.keys(CATS)].map(c =>
    `<button data-c="${c}" class="${c === cat ? 'active' : ''}">${CATS[c] || '🗂️'} ${c}</button>`).join('');

  const rank = { high: 0, med: 1, low: 2 };
  const shown = tasks
    .filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done))
    .filter(t => cat === 'All' || t.category === cat)
    .filter(t => t.text.toLowerCase().includes(query))
    .sort((a, b) => a.done - b.done || rank[a.priority] - rank[b.priority] || (a.due || '9').localeCompare(b.due || '9'));

  $('list').innerHTML = shown.length ? shown.map(t => {
    const late = !t.done && t.due && t.due < today;
    const dueLabel = t.due === today ? 'Today' : t.due === iso(1) ? 'Tomorrow' : t.due;
    return `<li class="item ${t.priority} ${t.done ? 'done' : ''}">
      <div class="check" data-t="${t.id}"></div>
      <div class="body"><div class="title">${esc(t.text)}</div>
        <div class="meta"><span class="tag">${CATS[t.category]} ${t.category}</span>
        ${t.due ? `<span class="tag ${late ? 'late' : ''}">${late ? '⚠️ ' : '📅 '}${dueLabel}</span>` : ''}</div></div>
      <button class="del" data-d="${t.id}" title="Delete">🗑️</button></li>`;
  }).join('') : '<div class="empty">🎈 Nothing here. Add a task above!</div>';
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const text = $('text').value.trim(); if (!text) return;
  await api('', { method: 'POST', body: JSON.stringify({ text, category: $('category').value, priority: $('priority').value, due: $('due').value }) });
  $('text').value = ''; load();
});
$('list').addEventListener('click', async e => {
  const c = e.target.closest('[data-t]'), d = e.target.closest('[data-d]');
  if (c) { const t = tasks.find(x => x.id == c.dataset.t); await api('/' + t.id, { method: 'PATCH', body: JSON.stringify({ done: !t.done }) }); }
  if (d) await api('/' + d.dataset.d, { method: 'DELETE' });
  if (c || d) load();
});
$('tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f === 'completed' ? 'done' : b.dataset.f;
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b));
  render();
});
$('chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cat = b.dataset.c; render(); } });
$('search').addEventListener('input', e => { query = e.target.value.toLowerCase(); render(); });
$('clear').addEventListener('click', async () => { await api('?completed=true', { method: 'DELETE' }); load(); });
load();
